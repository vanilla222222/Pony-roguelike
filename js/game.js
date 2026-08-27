'use strict';
/* ============================================================
   game.js — the Game class: state machine, room/floor
   transitions, camera, and the update loop.

   All canvas drawing lives in render.js (methods are bolted onto
   Game.prototype there) — kept in a separate file purely so this
   one stays about *state*, not pixels. See render.js's header
   comment for the rendering performance notes.
   ============================================================ */

const CAMERA_TILES = 12; // always "the zoom of a 1x1 room" (10 floor tiles + 2 border)
const CAMERA_W = CAMERA_TILES * TILE;
const CAMERA_H = CAMERA_TILES * TILE;
const ROOM_FREEZE_TIME = 0.4; // brief pause on room entry so the player can take it in
const ROOM_FADE_TIME = 0.4;
const MAX_DPR = 2; // cap devicePixelRatio scaling — sharp on retina without paying 3x fill-rate on very high-dpr phones

// same lookup-table pattern as ui.js's ROOM_TYPE_ICON/roomTypeColor and
// render.js's DOOR_COLORS — a new special room type only needs an entry
// here, not a new switch case.
const ROOM_LABELS = {
  boss: 'Boss Chamber', treasure: 'Treasure Room', shop: 'Shop', secret: 'Secret Room!',
  petshop: 'Pet Shop', curse: 'Cursed Room!', sacrifice: 'Sacrifice Room', vault: 'Vault',
  challenge: 'Challenge Room', crystal: 'Crystal Room', sombra: 'Sombra Room',
  cpathgate: 'The Storm Drain',
};
function roomLabel(node){ return ROOM_LABELS[node.type] || ''; }

class Game {
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.canvas.width = CAMERA_W * this.dpr;
    this.canvas.height = CAMERA_H * this.dpr;
    this.state = 'idle'; // idle | playing | gameover | win
    this.player = null;
    this.dungeon = null;
    this.currentRoom = null;
    this.projectiles = []; this.bombs = []; this.explosions = []; this.floatTexts = [];
    this.swingFX = null;
    this.laserFX = null;
    this.paused = false;
    this.camX = 0; this.camY = 0;
    this.freezeTimer = 0;
    this.roomFadeTimer = 0;
    this.slowTimer = 0; // Chrono Shard — while > 0, enemies update on a slowed-down clock
    this.now = performance.now();
    this._entityDrawScratch = []; // reused every frame by drawWorldSorted() to avoid per-frame array churn
  }

  startRun(classId){
    this.player = new Player(classId);
    // Phase 8b — skill tree starting-pickup nodes (bombs/keys/coins/blue
    // hearts); see achievements/skilltree.js. Order vs. recalcPlayerStats
    // doesn't matter — it only touches pickup counters, not derived stats.
    applySkillTreeStartingPickups(this.player);
    recalcPlayerStats(this.player);
    this.state = 'playing';
    this.paused = false;
    this.floorsClearedNoDamage = 0;
    this.floorBranch = null;
    // Sticky, set once by descend('C') from the floor-2 gate room and never
    // cleared for the rest of the run. While it is 'C' the run is on the
    // 3C-10C path and floorNum 2-9 mean the C-branch floors, NOT the normal
    // ones — every floorNum-sensitive branch below checks this FIRST.
    this.floorPath = null;
    this.runElapsed = 0; // seconds actually spent playing (excludes paused time) — see update()
    this.runKills = 0; // this run's enemy kill count — see combat.js handleEnemyDeath, shown on the pause/end screens
    bumpStat('runsStarted', 1, this);
    // freeze which items/pickups/trinkets/familiars/stars this run may roll —
    // anything unlocked DURING the run only counts from the next one on
    // (see achievements.js's currentUnlocks/unlockAchievement)
    beginRunUnlocks();
    // which real effect each pill color turns out to be, rerolled fresh every
    // run (Isaac-style) — pillIdentified tracks which colors this run has
    // already revealed by using one
    this.pillEffectMap = {};
    for (const c of PILL_COLORS) this.pillEffectMap[c.id] = Util.choice(PILL_EFFECT_LIST).id;
    this.pillIdentified = {};
    const unlocks = loadUnlocks();
    this.maxFloorsThisRun = unlocks.polishDefeated ? 8 : BASE_MAX_FLOORS;
    this.startFloor(0);
  }

  startFloor(floorNum){
    this.dungeon = generateDungeon(floorNum);
    // stages bestiary tab (see stages.js/bestiary.js) — floorNum 8-11 branch
    // into A/B (9A/9B..12A/12B, own palette + own roster already, see
    // stages.js's BRANCH_PALETTES*/floorKeyFor), floorNum 12 is the single
    // converged floor 13, and the C-branch has its own 3 named regions
    // (cPaletteFor) instead of the STAGES/stageIndexForFloor chain at all.
    if (this.floorPath === 'C') {
      markBestiarySeen('seenStages', floorNum <= 3 ? 'gutters' : floorNum <= 5 ? 'sewers' : floorNum <= 9 ? 'rainforest' : 'mangroves', this);
    } else if (this.floorPath === 'D') {
      // mirrors the C line above — same three-region split as dPaletteFor
      markBestiarySeen('seenStages', floorNum <= 4 ? 'observatory' : floorNum <= 6 ? 'orrery' : 'voidbetween', this);
    } else if (floorNum > OLD_MAIN_ROUTE_FINAL_FLOOR) {
      // Phase 10 — the extended main route (floorNum 15-34) drops back to the
      // plain STAGES/stageIndexForFloor chain, exactly like floors 0-7 do in
      // the final else below: no A/B branch suffix (floorBranch is still
      // sticky from floor 9's fork but means nothing out here) and no
      // numbered-floor id. Checked FIRST so neither the floorNum>=12
      // ('13'/'14'/'15') case nor the floorBranch case can claim these floors
      // and mint ids like '16' or '16a' that no STAGE_LIST page has.
      markBestiarySeen('seenStages', STAGES[stageIndexForFloor(floorNum)].id, this);
    } else if (floorNum >= 12) {
      // floors 13/14/15 — all linear, one bestiary id each (stages.js STAGE_LIST)
      markBestiarySeen('seenStages', String(floorNum + 1), this);
    } else if (floorNum >= 8 && this.floorBranch) {
      markBestiarySeen('seenStages', String(floorNum + 1) + this.floorBranch.toLowerCase(), this);
    } else {
      markBestiarySeen('seenStages', STAGES[stageIndexForFloor(floorNum)].id, this);
    }
    // Stage background music. Plain-route floors look up STAGE_MUSIC_TRACKS
    // (stages.js) by the current stage id via the same stageIndexForFloor
    // chain used just above for the bestiary — covers the whole route now,
    // not just floorNum<=OLD_MAIN_ROUTE_FINAL_FLOOR: the Phase 10 stages
    // (frozendesert..hyperspace) have their own MUSIC_TRACKS entries too,
    // and this used to stop short of them, leaving those tracks wired but
    // unreachable in an actual run. C-branch floors look up C_MUSIC_TRACKS
    // via cMusicTrackFor(floorNum) (gutters/sewers/rainforest/mangroves),
    // D-branch floors look up D_MUSIC_TRACKS via dMusicTrackFor(floorNum)
    // (observatory/orrery/voidbetween) — both the audio equivalents of
    // their respective cPaletteFor/dPaletteFor region splits. Any
    // stage/region with no entry in its table just falls through to
    // stopMusic(). startMusic/stopMusic are both idempotent (see their own
    // doc comments in audio.js), so this can run unconditionally on every
    // startFloor — two floors of the same stage/region never restart the
    // loop, and leaving for any other stage/branch/region fades it out
    // exactly once.
    // Resolved once here and stashed on `this.currentFloorTrackId` rather
    // than called unconditionally like it used to be — enterRoom (below)
    // now overrides the floor's track with a room-type one (boss/crystal/
    // etc, see ROOM_MUSIC_TRACKS) for as long as the player is standing in
    // a room that has one, and needs to know what to restore when they
    // leave it. startFloor itself still starts the floor's track (every
    // start-of-floor entry is into the start room, which has no
    // ROOM_MUSIC_TRACKS entry, so enterRoom's own logic would resolve to
    // the exact same track anyway — setting it here just avoids a
    // redundant double-lookup on floor 0).
    if (!this.floorPath) {
      this.currentFloorTrackId = STAGE_MUSIC_TRACKS[STAGES[stageIndexForFloor(floorNum)].id] || null;
    } else if (this.floorPath === 'C') {
      this.currentFloorTrackId = cMusicTrackFor(floorNum);
    } else if (this.floorPath === 'D') {
      this.currentFloorTrackId = dMusicTrackFor(floorNum);
    } else {
      this.currentFloorTrackId = null;
    }
    if (this.currentFloorTrackId) Sound.startMusic(this.currentFloorTrackId); else Sound.stopMusic();
    // Night Owl's Feather / Spectral Token — mark rooms "seen" (shape known,
    // type still hidden until visited/revealed) rather than "discovered",
    // same distinction the minimap already draws on — see ui.js drawMinimap
    if (this.player.passives.nightowlfeather) {
      for (const r of this.dungeon.rooms.values()) r.seen = true;
    }
    if (this.player.passives.spectraltoken && this.dungeon.secretNode) {
      this.dungeon.secretNode.seen = true;
    }
    if ((this.player.passives.starlitcompass || this.player.passives.infernalcompass)) {
      if (this.dungeon.crystalNode) this.dungeon.crystalNode.seen = true;
      if (this.dungeon.sombraNode) this.dungeon.sombraNode.seen = true;
    }
    this.player.secondWindUsedThisFloor = false;
    this.player.tookDamageThisFloor = false;
    this.player.unlimitedKeysFloor = false; // Gold Key/Gold Bomb only last the floor they're found on
    this.player.unlimitedBombsFloor = false;
    if (this.player.passives.whisperingkey) this.player.keys += this.player.passives.whisperingkey;
    if (this.player.passives.vaultcracker) this.player.keys += this.player.passives.vaultcracker;
    if (this.player.passives.guardianfeather) this.player.shieldHits = Math.max(this.player.shieldHits, 1);
    if (this.player.trinketId === 'blastcap') this.player.bombs += 1;
    if (this.player.trinketId === 'tinybattery' && this.player.activeItem) {
      this.player.activeCharge = Math.min(this.player.activeItem.maxCharge, this.player.activeCharge + 1);
    }
    // expand-everything trinket batch (see data.js) — per-floor handouts, same
    // shape as Blast Cap/Tiny Battery above. Only one can ever be held at a
    // time (trinkets are single-slot), so these never stack with each other.
    if (this.player.trinketId === 'wardingsigil') this.player.shieldHits = Math.max(this.player.shieldHits, 1);
    if (this.player.trinketId === 'skeletonpin') this.player.keys += 1;
    if (this.player.trinketId === 'tollpouch') this.player.coins += 5;
    if (this.player.trinketId === 'soulcandle') this.player.healBlue(0.5);
    if (this.player.trinketId === 'pilgrimsflask') this.player.heal(0.5);
    // lifetime "deepest floor reached" record — see main.js's lifetime stats
    // line. Floor 1 itself isn't worth celebrating (every fresh save "beats"
    // it the first time it loads), so the toast only fires past that.
    if (setStatMax('deepestFloor', floorNum + 1) && floorNum > 0) {
      this.toast('🏅 New personal best! Reached Floor ' + (floorNum + 1) + ' for the first time.', false, 'good');
    }
    // floorNum-sensitive, so it has to exclude BOTH alternate paths — floorNum
    // 8 is 9C on the C-branch and 9D on the D-branch, not floor 9 of the
    // normal descent.
    if (floorNum === 8 && !this.floorPath) unlockAchievement('deepdiver', this);
    // Phase 7f — Hollow Chorus (floor 13) / Final Waveform (floor 14) floor-reach +
    // speedrun-to-floor checkpoints. Exact same shape as the deepdiver check just
    // above; see achievements/defs-7.js's Exploration/Challenge sections.
    if (floorNum === 12 && !this.floorPath) {
      unlockAchievement('exploration_reach_floor13', this);
      if (this.runElapsed < 22 * 60) unlockAchievement('challenge_hollowchorus_speedrun', this);
    }
    if (floorNum === 13 && !this.floorPath) {
      unlockAchievement('exploration_reach_floor14', this);
      if (this.runElapsed < 29 * 60) unlockAchievement('challenge_finalwaveform_speedrun', this);
    }
    if (this.floorPath === 'C') {
      // One bump per C floor ENTERED — startFloor runs exactly once per floor
      // per run and descend() only ever moves floorNum forward, so this can
      // fire at most 8 times in a run (3C..10C) and walking back into an
      // already-cleared room never touches it. See achievements.js's
      // cbranch_entered / exploration_cbranchfloors ladder.
      bumpStat('cBranchFloorsVisited', 1, this);
      // Phase 7g — The Tangled Shallows (floor 11C) reach + speedrun-to-floor
      // checkpoint. Exact same shape as the floorNum===12/13 checks above (see
      // achievements/defs-8.js's Exploration/Challenge sections).
      if (floorNum === 10) {
        unlockAchievement('exploration_reach_11c', this);
        if (this.runElapsed < 20 * 60) unlockAchievement('challenge_mangroves_speedrun', this);
      }
      // C-branch superbosses: 6C, 8C, 9C, 10C, 11C, 12C. Every other C floor
      // takes the generic pool for its floorKey ('3C'..'12C', see stages.js) —
      // those enemy/boss entries are a later slice, so resolveGenericBoss falls
      // through to the stage pool until they exist, which is fine.
      if (floorNum === 5) this.pendingBossType = SUPERBOSSES.drenched;        // 6C
      else if (floorNum === 7) this.pendingBossType = SUPERBOSSES.brazil;      // 8C
      else if (floorNum === 8) this.pendingBossType = SUPERBOSSES.israelprime; // 9C
      else if (floorNum === 9) this.pendingBossType = SUPERBOSSES.monsoon;     // 10C — Phase 7a
      else if (floorNum === 10) this.pendingBossType = SUPERBOSSES.mangrove;   // 11C — Phase 7a
      else if (floorNum === 11) this.pendingBossType = SUPERBOSSES.kirk;       // 12C — the C-branch finale (moved from 10C)
      else this.pendingBossType = resolveGenericBoss(floorNum, null, 'C');
    }
    else if (this.floorPath === 'D') {
      // D-branch superbosses sit at the END of each of the three regions:
      // floorNum 4 = 5D (Observatory), 6 = 7D (Orrery), 9 = 10D (the finale).
      // Same shape as the C block above, including the generic fallback.
      bumpStat('dBranchFloorsVisited', 1, this);
      // Phase 7h — The Observatory (floors 4D/5D) reach + speedrun-to-floor
      // checkpoints. Exact same shape as the floorNum===10 (11C) checks above
      // (see achievements/defs-9.js's Exploration/Challenge sections).
      if (floorNum === 3) {
        unlockAchievement('exploration_reach_4d', this);
        if (this.runElapsed < 15 * 60) unlockAchievement('challenge_observatory_4d_speedrun', this);
      }
      if (floorNum === 4) {
        unlockAchievement('exploration_reach_5d', this);
        if (this.runElapsed < 19 * 60) unlockAchievement('challenge_observatory_5d_speedrun', this);
      }
      // Phase 7h (cont.) — The Orrery (floors 6D/7D) reach + speedrun-to-floor
      // checkpoints. Exact same shape as the floorNum===3/4 (4D/5D) checks
      // above (see achievements/defs-10.js's Exploration/Challenge sections).
      if (floorNum === 5) {
        unlockAchievement('exploration_reach_6d', this);
        if (this.runElapsed < 22 * 60) unlockAchievement('challenge_orrery_6d_speedrun', this);
      }
      if (floorNum === 6) {
        unlockAchievement('exploration_reach_7d', this);
        if (this.runElapsed < 26 * 60) unlockAchievement('challenge_orrery_7d_speedrun', this);
      }
      // Phase 7h (cont.) — The Void Between, PART 1 (floorKey '8D') reach +
      // speedrun-to-floor checkpoint. Exact same shape as the floorNum===5/6
      // (6D/7D) checks above (see achievements/defs-11.js's Exploration/
      // Challenge sections). '8D' has no superboss of its own (that's
      // '10D''s singularity, floorNum 9), so there is no matching
      // onBossDefeated() Challenge block for this floor — see descend()
      // below for its floor-scoped no-damage/frugal/untouched checks instead.
      if (floorNum === 7) {
        unlockAchievement('exploration_reach_8d', this);
        if (this.runElapsed < 29 * 60) unlockAchievement('challenge_voidbetween_8d_speedrun', this);
      }
      // Phase 7h (cont.) — The Void Between, PART 2 (floorKeys '9D'/'10D')
      // reach + speedrun-to-floor checkpoints. Exact same shape as the
      // floorNum===5/6/7 checks above (see achievements/defs-12.js's
      // Exploration/Challenge sections). '10D' DOES have a superboss
      // (singularity, the D-branch finale) — see onBossDefeated() below for
      // its boss-room-anchored Challenge block.
      if (floorNum === 8) {
        unlockAchievement('exploration_reach_9d', this);
        if (this.runElapsed < 32 * 60) unlockAchievement('challenge_voidbetween2_9d_speedrun', this);
      }
      if (floorNum === 9) {
        unlockAchievement('exploration_reach_10d', this);
        if (this.runElapsed < 35 * 60) unlockAchievement('challenge_voidbetween2_10d_speedrun', this);
      }
      if (floorNum === 4) this.pendingBossType = SUPERBOSSES.astrolabe;        // 5D
      else if (floorNum === 6) this.pendingBossType = SUPERBOSSES.orrery;      // 7D
      else if (floorNum === 9) this.pendingBossType = SUPERBOSSES.singularity; // 10D — the D-branch finale
      else this.pendingBossType = resolveGenericBoss(floorNum, null, 'D');
    }
    else if (floorNum === 5) this.pendingBossType = SUPERBOSSES.polish;
    else if (floorNum === 7) this.pendingBossType = SUPERBOSSES.tyrone;
    else if (floorNum === 8) this.pendingBossType = this.floorBranch === 'B' ? SUPERBOSSES.israel : SUPERBOSSES.pineapple;
    // 10A/10B — the continuation past 9A/9B, see descend()'s floorNum===8
    // branch below and stages.js's BRANCH_PALETTES_10
    else if (floorNum === 9) this.pendingBossType = this.floorBranch === 'B' ? SUPERBOSSES.lilac : SUPERBOSSES.algae;
    // 11A/11B, 12A/12B, then 13 — the branch stays sticky through 12 and the
    // two sides converge on the finale, so floorNum 12 takes no ternary
    else if (floorNum === 10) this.pendingBossType = this.floorBranch === 'B' ? SUPERBOSSES.clapper : SUPERBOSSES.plapper;
    else if (floorNum === 11) this.pendingBossType = this.floorBranch === 'B' ? SUPERBOSSES.vanilladnb : SUPERBOSSES.nhm;
    // Phase 7a — floors 13 and 14, both linear (no ternary, the branch has
    // converged), then the unchanged finale two floors lower than it used to be
    else if (floorNum === 12) this.pendingBossType = SUPERBOSSES.wobbler;
    else if (floorNum === 13) this.pendingBossType = SUPERBOSSES.subdrop;
    else if (floorNum === 14) this.pendingBossType = SUPERBOSSES.onetruednb;
    // Phase 10 — the 10 new post-14 stages, each a 2-floor block; the
    // superboss lands on the second floor of its stage (see stages.js's
    // STAGES[4..13] / stage4-6-superbosses.js / stage7-9-superbosses.js /
    // stage10-13-superbosses.js for the stage/name mapping).
    else if (floorNum === 16) this.pendingBossType = SUPERBOSSES.iceagent;      // Frozen Desert
    else if (floorNum === 18) this.pendingBossType = SUPERBOSSES.mexico;        // Badlands
    else if (floorNum === 20) this.pendingBossType = SUPERBOSSES.g5;            // Beach
    else if (floorNum === 22) this.pendingBossType = SUPERBOSSES.japan;         // Ocean
    else if (floorNum === 24) this.pendingBossType = SUPERBOSSES.deannb;        // The Sea Floor
    else if (floorNum === 26) this.pendingBossType = SUPERBOSSES.israelprimeprime; // Trench
    else if (floorNum === 28) this.pendingBossType = SUPERBOSSES.palestine;     // Trench Depths
    else if (floorNum === 30) this.pendingBossType = SUPERBOSSES.warden;        // Deep Dark
    else if (floorNum === 32) this.pendingBossType = SUPERBOSSES.notch;         // Meta Realm
    else if (floorNum === 34) this.pendingBossType = SUPERBOSSES.kirkinator;    // Hyperspace — main-route finale
    else this.pendingBossType = resolveGenericBoss(floorNum, this.floorBranch);
    this.enterRoom(this.dungeon.start, null);
  }

  enterRoom(node, enteredSlot){
    ensureRoomBuilt(node);
    // Changeling's green fire pool is anchored in world coordinates, so it
    // must never survive a room change (see combat.js updateGreenFireAttack)
    if (this.player) this.player.fireZone = null;
    // only the dungeon's ONE designated boss room (dungeon.bossNode) is
    // forced to this floor's superboss — on 9A/9B/10A/10B, the bonus second
    // boss room (dungeon.secondBossNode, see dungeon.js's generateDungeon)
    // is deliberately left to resolveGenericBoss's normal fallback instead,
    // via floorBranch below, so it draws from that floor's floorKey-tagged
    // regular bosses (enemies.js) rather than repeating the superboss.
    const isDesignatedBossRoom = node.type === 'boss' && node === this.dungeon.bossNode;
    populateRoom(node, this.dungeon, Object.assign(
      { floorBranch: this.floorBranch },
      isDesignatedBossRoom ? { bossType: this.pendingBossType } : null
    ));
    this.currentRoom = node;
    // the reroll altar's escalating cost is scoped to ONE shop visit — walking
    // out and back in restarts it at 3c. See shop.js's rerollAltarCost. (The
    // slots themselves keep whatever they were rerolled into; only the price
    // ladder resets.)
    if (node.rerollAltar) node.rerollAltar.uses = 0;
    // Sprinter's Band (expand-everything trinket batch, see data.js) — the same
    // speedBoostTimer several active items already set (items.js), re-armed on
    // every room entry. combat.js's updatePlayer reads it as a x1.5 while > 0.
    if (this.player.trinketId === 'sprintersband') {
      this.player.speedBoostTimer = Math.max(this.player.speedBoostTimer, 2);
    }
    // Bestiary's Objects tab — an obstacle only needs to be encountered
    // (not necessarily destroyed) to stop showing as "?", see js/bestiary.js
    if (node.obstacles) for (const ob of node.obstacles) markBestiarySeen('objectsSeen', ob.kind);
    // "for the room" star buffs wear off the instant a new room is entered —
    // see stars.js applyStarEffect (Alcyone/Electra/Vega)
    if (this.player.starDamageBonus || this.player.starSpeedMult !== 1) {
      this.player.starDamageBonus = 0;
      this.player.starSpeedMult = 1;
      recalcPlayerStats(this.player);
    }
    // per-room damage flag — Gold Heart's room-clear heal only pays out on a
    // clean room (see onRoomJustCleared)
    this.player.tookDamageThisRoom = false;
    const firstVisit = !node.discovered;
    node.discovered = true;
    node.visited = true;
    // new-room-type visit counters — see achievements.js's petshopregular/
    // petshoptycoon, curseexplorer/curseveteran, crystalseeker/crystaldevotee
    if (firstVisit) {
      if (node.type === 'petshop') bumpStat('petshopsVisited', 1, this);
      else if (node.type === 'curse') bumpStat('curseRoomsVisited', 1, this);
      else if (node.type === 'crystal') bumpStat('crystalRoomsVisited', 1, this);
      else if (node.type === 'star') bumpStat('starRoomsVisited', 1, this);
      else if (node.type === 'treasure') bumpStat('treasureRoomsVisited', 1, this);
      else if (node.type === 'shop') { bumpStat('shopRoomsVisited', 1, this); this.player.visitedShopThisRun = true; } // Phase 5b — see achievements.js 'challenge_frugal_run'
      else if (node.type === 'secret') bumpStat('secretRoomsVisited', 1, this);
      else if (node.type === 'sacrifice') bumpStat('sacrificeRoomsVisited', 1, this);
      else if (node.type === 'vault') bumpStat('vaultRoomsVisited', 1, this);
      else if (node.type === 'challenge') bumpStat('challengeRoomsVisited', 1, this);
      else if (node.type === 'sombra') bumpStat('sombraRoomsVisited', 1, this);
      else if (node.type === 'shrine') bumpStat('shrineRoomsVisited', 1, this);
      else if (node.type === 'arcade') bumpStat('arcadeRoomsVisited', 1, this);
    }
    // Bestiary's Rooms tab — markBestiarySeen is idempotent (achievements.js),
    // so this doesn't need the firstVisit gate
    markBestiarySeen('seenRoomTypes', node.type, this);
    for (const slot of node.doorSlots) {
      if (slot.type === 'normal' && slot.pairedSlot) {
        const nb = slot.pairedSlot.room;
        if (nb && !nb.discovered) nb.seen = true;
      }
    }

    this.projectiles = []; this.bombs = []; this.explosions = []; this.floatTexts = []; this.swingFX = null; this.laserFX = null;

    if (enteredSlot && enteredSlot.cells) {
      const cx = enteredSlot.cells.reduce((a, c) => a + c.x, 0) / enteredSlot.cells.length;
      const cy = enteredSlot.cells.reduce((a, c) => a + c.y, 0) / enteredSlot.cells.length;
      const dir = DIRS.find(d => d.d === enteredSlot.dir);
      const spot = findNearestFloor(node, Math.round(cx - dir.dx * 2), Math.round(cy - dir.dy * 2));
      this.player.x = spot.x * TILE + TILE / 2;
      this.player.y = spot.y * TILE + TILE / 2;
    } else {
      const spot = findNearestFloor(node, Math.floor(node.tileW / 2), Math.floor(node.tileH / 2));
      this.player.x = spot.x * TILE + TILE / 2;
      this.player.y = spot.y * TILE + TILE / 2;
    }

    // Phase 6a overhaul — familiars/changeling minions used to only close a
    // room-change gap via their slow per-frame lerp (entities.js), visibly
    // crossing the map over several seconds. Hard-snap them to the player's
    // freshly-set spawn spot instead, every room entry — both arrays are
    // eagerly initialized to [] on every Player (see entities.js), so this
    // loop is a safe no-op for classes without either.
    for (const f of this.player.familiars) { f.x = this.player.x; f.y = this.player.y; }
    for (const m of this.player.changelingMinions) { m.x = this.player.x; m.y = this.player.y; }

    this.updateCamera();
    this.freezeTimer = ROOM_FREEZE_TIME;
    this.roomFadeTimer = ROOM_FADE_TIME;

    if (node.type === 'boss' && !node.bossDefeated) {
      Sound.play('bossIntro');
      this.player.tookDamageThisBossRoom = false; // see the Untouchable achievement
    }
    // Room-type background music (economy.js's ROOM_MUSIC_TRACKS — boss/
    // crystal+shrine/sombra+curse/treasure/secret+sacrifice/shop+petshop)
    // overrides the floor's own track for as long as the player is
    // standing in a room that has one; every other room type (normal,
    // start, vault, challenge, star, the two gate rooms, arcade — none of
    // which have a track of their own) falls through to restoring
    // whatever this.currentFloorTrackId was set to in startFloor. Both
    // startMusic/stopMusic are idempotent, so walking back and forth
    // between two rooms of the same type/floor never restarts either loop.
    const roomTrackId = ROOM_MUSIC_TRACKS[node.type];
    if (roomTrackId) Sound.startMusic(roomTrackId);
    else if (this.currentFloorTrackId) Sound.startMusic(this.currentFloorTrackId);
    else Sound.stopMusic();
    const label = roomLabel(node);
    if (label) showRoomBanner(label, node.type);
  }

  transitionThroughDoor(slot){
    const oppSlot = slot && slot.pairedSlot;
    if (!oppSlot) return;
    // cursed rooms tax half a heart both ways — leaving one and entering one
    // are each their own event, so both can fire on the same crossing in the
    // (structurally very unlikely) case of two curse rooms sitting adjacent
    if (!this.player.curseImmune) { // Holy Water — see items.js recalcPlayerStats
      if (this.currentRoom.type === 'curse') damagePlayer(this, 0.5, 'curse');
      if (oppSlot.room.type === 'curse') damagePlayer(this, 0.5, 'curse');
    }
    // Engineer Pony's built turrets are room-scoped ("resets when leaving
    // room" per spec) — rooms are NOT rebuilt on revisit (populateRoom is a
    // no-op past the first visit, see room.js), so nothing clears this array
    // automatically. Clear the DEPARTING room's turrets here, not the
    // destination's — if the player later returns to this same room, it
    // stays empty (populateRoom won't re-add anything either).
    if (this.currentRoom && this.currentRoom.playerTurrets) this.currentRoom.playerTurrets.length = 0;
    this.enterRoom(oppSlot.room, oppSlot);
  }

  fitCanvas(){
    const wrap = document.getElementById('canvasWrap');
    if (!wrap) return;
    const maxW = Math.max(50, wrap.clientWidth - 8);
    const maxH = Math.max(50, wrap.clientHeight - 8);
    // scale is computed against the *logical* camera size, not the dpr-scaled
    // backing store, so the on-screen footprint stays identical regardless
    // of how crisp the backing bitmap is
    const scale = Math.min(maxW / CAMERA_W, maxH / CAMERA_H, 2.2);
    this.canvas.style.width = (CAMERA_W * scale) + 'px';
    this.canvas.style.height = (CAMERA_H * scale) + 'px';
    this._positionHudPanels(wrap, CAMERA_W * scale);
  }

  // The side HUD panels (#leftPanel/#rightPanel) used to sit at a fixed 6px
  // inset from #canvasWrap's own edges, on the assumption the canvas tops
  // out around 704px (2.2x of an assumed 320px camera). The real camera is
  // 384px (CAMERA_TILES*TILE), so it actually scales up to ~845px — leaving
  // far less side space than that, and a *fixed* panel width doesn't fit it
  // reliably either way. Size the panels to whatever side space is actually
  // available (clamped to a readable range) instead of assuming a width,
  // and only fall back/hide once even the minimum readable width won't fit.
  _positionHudPanels(wrap, canvasPxW){
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    if (!leftPanel || !rightPanel) return;
    const gap = 14;          // clear space between canvas edge and panel
    const outer = 6;         // clear space between panel and #canvasWrap's own edge
    const minW = 130, maxW = 190;
    const sideSpace = (wrap.clientWidth - canvasPxW) / 2;
    const available = sideSpace - gap - outer;
    const fits = available >= minW;
    leftPanel.classList.toggle('hud-panel-hidden', !fits);
    rightPanel.classList.toggle('hud-panel-fallback', !fits);
    if (fits) {
      const panelW = Math.round(Util.clamp(available, minW, maxW));
      leftPanel.style.width = panelW + 'px';
      rightPanel.style.width = panelW + 'px';
      leftPanel.style.left = outer + 'px';
      rightPanel.style.right = outer + 'px';
    } else {
      // .hud-panel-fallback sets width:auto for the bottom-strip layout, but
      // an inline width from an earlier "fits" pass takes precedence over
      // any class rule — clear it, or a shrink-then-grow resize would leave
      // the fallback strip stuck at its last fitted pixel width.
      rightPanel.style.width = '';
      rightPanel.style.right = '';
      leftPanel.style.width = '';
      leftPanel.style.left = '';
    }
  }

  updateCamera(){
    const node = this.currentRoom;
    const roomPxW = node.tileW * TILE, roomPxH = node.tileH * TILE;
    let camX = this.player.x - CAMERA_W / 2;
    let camY = this.player.y - CAMERA_H / 2;
    camX = roomPxW <= CAMERA_W ? (roomPxW - CAMERA_W) / 2 : Util.clamp(camX, 0, roomPxW - CAMERA_W);
    camY = roomPxH <= CAMERA_H ? (roomPxH - CAMERA_H) / 2 : Util.clamp(camY, 0, roomPxH - CAMERA_H);
    this.camX = camX; this.camY = camY;
  }

  tryPlaceBomb(){
    if (this.state !== 'playing' || this.paused || this.freezeTimer > 0) return;
    placeBombAt(this, this.player.x, this.player.y, 'player');
  }

  tryUseActive(){
    if (this.state !== 'playing' || this.paused || this.freezeTimer > 0) return;
    useActiveItem(this);
  }

  tryUsePill(){
    if (this.state !== 'playing' || this.paused || this.freezeTimer > 0) return;
    useHeldPill(this);
  }

  tryUseStar(){
    if (this.state !== 'playing' || this.paused || this.freezeTimer > 0) return;
    useHeldStar(this);
  }

  tryDonate(){
    if (this.state !== 'playing' || this.paused || this.freezeTimer > 0) return;
    tryDonateMachine(this);
  }

  tryReroll(){
    if (this.state !== 'playing' || this.paused || this.freezeTimer > 0) return;
    tryRerollAltar(this);
  }

  tryArcadeInteract(){
    if (this.state !== 'playing' || this.paused || this.freezeTimer > 0) return;
    tryArcadeInteract(this);
  }

  toast(msg, long, kind){ toast(msg, long, kind); }

  onRoomJustCleared(){
    Sound.play('roomClear');
    this.player.gainRoomClearCharge();
    bumpStat('roomsCleared', 1, this);
    spawnClearRoomPickup(this);
    // Gold Heart — clearing a room without taking a hit heals half a heart
    if (this.player.goldHeart && !this.player.tookDamageThisRoom) {
      this.player.heal(0.5);
      Sound.play('heart');
      this.floatTexts.push(new FloatText(this.player.x, this.player.y - 30, '+½ heart', '#e35b6a'));
    }
    // expand-everything trinket batch (see data.js) — their own `if`s so they
    // read independently of the Tin Whistle toast branch below.
    if (this.player.trinketId === 'tithebell' && Util.chance(0.2)) {
      const node = this.currentRoom;
      const spot = findClearFloorSpot(node, Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE));
      node.pickups.push(new Pickup('coin', spot.x, spot.y, Util.weighted(COIN_TYPES)));
    }
    if (this.player.trinketId === 'mendingchime' && Util.chance(0.1) && this.player.redCurrent < this.player.redMax) {
      this.player.heal(0.5);
      Sound.play('heart');
      this.floatTexts.push(new FloatText(this.player.x, this.player.y - 30, '+\u00bd heart', '#e35b6a'));
    }
    if (this.player.trinketId === 'tinwhistle' && this.player.activeItem && Util.chance(0.05)) {
      this.player.activeCharge = Math.min(this.player.activeItem.maxCharge, this.player.activeCharge + 1);
      toast('Room cleared! Tin Whistle hums — active item charged!');
    } else {
      toast('Room cleared!');
    }
  }

  onBossDefeated(enemy){
    const node = this.currentRoom;
    // 9A/9B/10A/10B/11A/11B/12A/12B's bonus second boss room (see dungeon.js's
    // generateDungeon/secondBossNode) never grants a staircase on its own —
    // otherwise clearing it would let a run skip straight past that floor's
    // actual superboss. Everything else about defeating it (loot pedestal,
    // achievements, kill counters) still happens completely normally. Floors
    // 13/14/15 (floorNum 12/13/14) have no second boss room, so they are not in
    // this list — keep this in lockstep with dungeon.js's secondBossNode
    // condition, which is written to exactly the same shape.
    //
    // Phase 7a bug fix: this used to test floorNum alone, with no floorPath
    // guard, so the C-branch's floorNum 8/9 (9C/10C) incidentally satisfied it
    // and generated an unintended bonus boss room. Adding the C-branch's 11C/12C
    // and the whole D-branch would have made that worse, so the mechanic is now
    // explicitly main-route-only, as the comment above always claimed.
    const f = this.dungeon.floorNum;
    const isBonusBossRoom = !this.floorPath && (f === 8 || f === 9 || f === 10 || f === 11) && node !== this.dungeon.bossNode;
    if (!isBonusBossRoom) node.stairsSpot = { x: node.tileW / 2, y: node.tileH / 2 };
    // Trophy Chain (expand-everything trinket batch, see data.js)
    if (this.player.trinketId === 'trophychain' && enemy) {
      for (let i = 0; i < 5; i++) {
        const spot = findClearFloorSpot(node, Math.floor(enemy.x / TILE), Math.floor(enemy.y / TILE));
        node.pickups.push(new Pickup('coin', spot.x, spot.y, Util.weighted(COIN_TYPES)));
      }
    }
    const unlocks = loadUnlocks();

    const superbossId = enemy && enemy.type && SUPERBOSSES[enemy.type.id] ? enemy.type.id : null;
    if (superbossId) {
      if (!unlocks.superbossDefeats) unlocks.superbossDefeats = { polish:0, tyrone:0, pineapple:0, israel:0, algae:0, lilac:0,
        plapper:0, clapper:0, nhm:0, vanilladnb:0, onetruednb:0 };
      const beforeCount = unlocks.superbossDefeats[superbossId] || 0;
      unlocks.superbossDefeats[superbossId] = beforeCount + 1;

      // Per-CLASS defeat tracking (Phase 10) — the class-select screen shows
      // each character which superbosses THEY specifically have beaten,
      // split by route (see ui.js's buildClassSelect + the new
      // data/enemies/superboss-routes.js). Lazily created the same way the
      // global counter above is, so an old save with no entries yet just
      // starts empty rather than needing a migration.
      if (!unlocks.classSuperbossDefeats) unlocks.classSuperbossDefeats = {};
      const classId = this.player.classId;
      if (classId) {
        if (!unlocks.classSuperbossDefeats[classId]) unlocks.classSuperbossDefeats[classId] = {};
        const classBeforeCount = unlocks.classSuperbossDefeats[classId][superbossId] || 0;
        unlocks.classSuperbossDefeats[classId][superbossId] = classBeforeCount + 1;
      }

      if (superbossId === 'polish' && !unlocks.polishDefeated) {
        unlocks.polishDefeated = true;
        toast('Polish DNB falls! The Inferno awaits on future runs...');
      }
      if (superbossId === 'tyrone' && beforeCount + 1 === 3) {
        toast('Tyrone falls for the 3rd time! A branching path awaits on future runs...');
      }
      saveUnlocks(unlocks);

      // this run gets the branch-hole choice only if it already had 3+ prior Tyrone kills
      // coming in (matches "future runs" — the run that hits kill #3 doesn't branch itself)
      if (superbossId === 'tyrone' && beforeCount >= 3) {
        node.stairsSpot = null;
        const cx = node.tileW / 2, cy = node.tileH / 2;
        node.branchSpots = [
          { x: cx - 2.4, y: cy, branch: 'A', label: '9A' },
          { x: cx + 2.4, y: cy, branch: 'B', label: '9B' },
        ];
      }
    }

    // achievement unlocks last — after every save above, so their own
    // load/save round-trip (see achievements.js unlockAchievement) can't
    // get clobbered by a stale copy of `unlocks` this function saved earlier.
    // unlockAchievement() is idempotent, so it's safe to call unconditionally.
    unlockAchievement('unlock_batpony', this); // any boss defeat unlocks Bat Pony
    if (superbossId) {
      unlockAchievement('sb_' + superbossId + '_' + this.player.classId, this);
      if (!this.player.tookDamageThisBossRoom) unlockAchievement('untouchable', this);
      // consecutive untouched superboss rooms — a run meets at most 7 superbosses
      // (polish, tyrone, then one per floor 9A/9B..12A/12B, then onetruednb — see
      // startFloor's pendingBossType chain), so 7 is "the whole run untouched".
      // Counter lives on the player (entities.js), so it resets with every new run.
      if (!this.player.tookDamageThisBossRoom) {
        this.player.bossRoomsNoDamageStreak = (this.player.bossRoomsNoDamageStreak || 0) + 1;
        if (this.player.bossRoomsNoDamageStreak >= 2) unlockAchievement('challenge_bossstreak_2', this);
        if (this.player.bossRoomsNoDamageStreak >= 4) unlockAchievement('challenge_bossstreak_4', this);
        if (this.player.bossRoomsNoDamageStreak >= 7) unlockAchievement('challenge_bossstreak_7', this);
      } else {
        this.player.bossRoomsNoDamageStreak = 0;
      }
      if (this.player.redCurrent + this.player.blueCurrent <= 1) unlockAchievement('unbreakable', this); // Ember Heart — see data.js
      if (superbossId === 'polish') {
        unlockAchievement('unlock_hypogriff', this); // "beat Floor 6"
        if (!this.player.tookDamageThisRun) unlockAchievement('unlock_seapony', this); // "Floors 1-6 without damage"
      }
      if (superbossId === 'pineapple') unlockAchievement('unlock_griffin', this); // "beat Floor 9A"
      if (superbossId === 'israel') unlockAchievement('unlock_kirin', this); // "beat Floor 9B"
      if (superbossId === 'tyrone') unlockAchievement('unlock_dragon', this); // "beat Floor 7"
      if (superbossId === 'onetruednb') unlockAchievement('unlock_dnbpony', this); // "beat Floor 13"
      // mirrors the polish/unlock_seapony "no damage so far" line above, but at the
      // deepest superboss — i.e. the entire game beaten without ever being hit
      if (superbossId === 'onetruednb' && !this.player.tookDamageThisRun) unlockAchievement('challenge_flawless_run', this);
      // Phase 7f — Hollow Chorus (WobblerDNB)/Final Waveform (SubdropDNB) Challenge
      // achievements. Every condition here reuses an existing per-player/per-run
      // flag (tookDamageThisBossRoom/tookDamageThisFloor/tookDamageThisRun/redMax/
      // visitedShopThisRun) or game.runElapsed — no new stat. See achievements/
      // defs-7.js's Challenge section for the full id -> reward list.
      if (superbossId === 'wobbler') {
        if (!this.player.tookDamageThisBossRoom) unlockAchievement('challenge_hollowchorus_flawless', this);
        if (!this.player.tookDamageThisFloor) unlockAchievement('challenge_hollowchorus_floor_nodamage', this);
        if (this.player.redMax <= 1) unlockAchievement('challenge_hollowchorus_onehearted', this);
        if (this.runElapsed < 20 * 60) unlockAchievement('challenge_hollowchorus_speedkill', this);
      }
      if (superbossId === 'subdrop') {
        if (!this.player.tookDamageThisBossRoom) unlockAchievement('challenge_finalwaveform_flawless', this);
        if (!this.player.tookDamageThisFloor) unlockAchievement('challenge_finalwaveform_floor_nodamage', this);
        if (this.player.redMax <= 1) unlockAchievement('challenge_finalwaveform_onehearted', this);
        if (this.runElapsed < 26 * 60) unlockAchievement('challenge_finalwaveform_speedkill', this);
        if (!this.player.visitedShopThisRun) unlockAchievement('challenge_subdrop_frugal', this);
        if (!this.player.tookDamageThisRun) unlockAchievement('challenge_finalwaveform_untouched_run', this);
      }
      // Phase 7g — The Tangled Shallows (Mangrove DNB, 11C) Challenge
      // achievements. Every condition here reuses an existing per-player/per-run
      // flag (tookDamageThisBossRoom/tookDamageThisFloor/tookDamageThisRun/redMax/
      // visitedShopThisRun) or game.runElapsed — no new stat. See achievements/
      // defs-8.js's Challenge section for the full id -> reward list.
      if (superbossId === 'mangrove') {
        if (!this.player.tookDamageThisBossRoom) unlockAchievement('challenge_mangrove_flawless', this);
        if (!this.player.tookDamageThisFloor) unlockAchievement('challenge_mangrove_floor_nodamage', this);
        if (this.player.redMax <= 1) unlockAchievement('challenge_mangrove_onehearted', this);
        if (this.runElapsed < 18 * 60) unlockAchievement('challenge_mangrove_speedkill', this);
        if (!this.player.visitedShopThisRun) unlockAchievement('challenge_mangrove_frugal', this);
        if (!this.player.tookDamageThisRun) unlockAchievement('challenge_mangrove_untouched_run', this);
      }
      // Phase 7h — The Observatory (Astrolabe DNB, 5D) Challenge achievements.
      // Every condition here reuses an existing per-player/per-run flag
      // (tookDamageThisBossRoom/tookDamageThisFloor/tookDamageThisRun/redMax/
      // visitedShopThisRun) or game.runElapsed — no new stat. See achievements/
      // defs-9.js's Challenge section for the full id -> reward list.
      if (superbossId === 'astrolabe') {
        if (!this.player.tookDamageThisBossRoom) unlockAchievement('challenge_astrolabe_flawless', this);
        if (!this.player.tookDamageThisFloor) unlockAchievement('challenge_astrolabe_floor_nodamage', this);
        if (this.player.redMax <= 1) unlockAchievement('challenge_astrolabe_onehearted', this);
        if (this.runElapsed < 19 * 60) unlockAchievement('challenge_astrolabe_speedkill', this);
        if (!this.player.visitedShopThisRun) unlockAchievement('challenge_astrolabe_frugal', this);
        if (!this.player.tookDamageThisRun) unlockAchievement('challenge_astrolabe_untouched_run', this);
      }
      // Phase 7h (cont.) — The Orrery (Orrery DNB, 7D) Challenge achievements.
      // Every condition here reuses an existing per-player/per-run flag
      // (tookDamageThisBossRoom/tookDamageThisFloor/tookDamageThisRun/redMax/
      // visitedShopThisRun) or game.runElapsed — no new stat. See achievements/
      // defs-10.js's Challenge section for the full id -> reward list.
      if (superbossId === 'orrery') {
        if (!this.player.tookDamageThisBossRoom) unlockAchievement('challenge_orrery_flawless', this);
        if (!this.player.tookDamageThisFloor) unlockAchievement('challenge_orrery_floor_nodamage', this);
        if (this.player.redMax <= 1) unlockAchievement('challenge_orrery_onehearted', this);
        if (this.runElapsed < 28 * 60) unlockAchievement('challenge_orrery_speedkill', this);
        if (!this.player.visitedShopThisRun) unlockAchievement('challenge_orrery_frugal', this);
        if (!this.player.tookDamageThisRun) unlockAchievement('challenge_orrery_untouched_run', this);
      }
      // Phase 7h (cont.) — The Void Between, PART 2 (The Singularity, 10D)
      // Challenge achievements. Every condition here reuses an existing
      // per-player/per-run flag (tookDamageThisBossRoom/tookDamageThisFloor/
      // tookDamageThisRun/redMax/visitedShopThisRun) or game.runElapsed — no
      // new stat. See achievements/defs-12.js's Challenge section for the
      // full id -> reward list.
      if (superbossId === 'singularity') {
        if (!this.player.tookDamageThisBossRoom) unlockAchievement('challenge_voidbetween2_flawless', this);
        if (!this.player.tookDamageThisFloor) unlockAchievement('challenge_voidbetween2_floor_nodamage', this);
        if (this.player.redMax <= 1) unlockAchievement('challenge_voidbetween2_onehearted', this);
        if (this.runElapsed < 38 * 60) unlockAchievement('challenge_voidbetween2_speedkill', this);
        if (!this.player.visitedShopThisRun) unlockAchievement('challenge_voidbetween2_frugal', this);
        if (!this.player.tookDamageThisRun) unlockAchievement('challenge_voidbetween2_untouched_run', this);
      }
    }
  }

  updateItemPedestal(){
    const node = this.currentRoom;
    if (!node.itemPedestals) return;
    for (const ped of node.itemPedestals) {
      if (ped.taken) continue;
      const px = ped.x * TILE, py = ped.y * TILE;
      if (Util.dist(this.player.x, this.player.y, px, py) < 22) {
        // devil deals (see room.js's addDealPedestal) charge a heart instead
        // of being free — same "must always have something left over" rule
        // as a cursed chest (combat.js's tryOpenChest), so a deal can never
        // outright kill you
        if (ped.isDeal) {
          const player = this.player;
          // Deal Maker discounts every deal's heart cost, floored at half a
          // heart — see items.js recalcPlayerStats
          const cost = Math.max(0.5, ped.heartCost - (player.dealDiscount || 0));
          const avail = player.redCurrent + player.blueCurrent;
          if (avail <= cost) {
            if (node.keyToastCooldown <= 0) { node.keyToastCooldown = 1.5; Sound.play('uiDeny'); this.toast("Not enough hearts for this deal."); }
            continue;
          }
          player.spendHearts(cost);
          bumpStat('sombraDealsTaken', 1, this); // see achievements.js's sombranovice/sombraveteran
        }
        // shrine offers (see room.js's addShrinePedestal) charge coins instead
        // of hearts — denied outright if the player can't afford it, same
        // "walk away, come back richer" shape as the shop's price gate
        if (ped.isShrine) {
          const player = this.player;
          if (player.coins < ped.coinCost) {
            if (node.keyToastCooldown <= 0) { node.keyToastCooldown = 1.5; Sound.play('uiDeny'); this.toast('Not enough coins for this shrine offer.'); }
            continue;
          }
          player.coins -= ped.coinCost;
        }
        ped.taken = true;
        if (ped.isTrinket) equipTrinket(this, ped.item);
        else if (ped.isFamiliar) addFamiliar(this, ped.item);
        // star pedestals (see room.js's addStarPedestal) go through the same
        // path as any other star pickup — starPocket is a single slot, so
        // taking one overwrites a star already held, and grantPickupEffect
        // already says so in its toast
        else if (ped.isStar) grantPickupEffect(this, 'star', px, py - 10, undefined, undefined, ped.starId);
        else applyItemToPlayer(this, ped.item);
        // challenge rooms lock the moment their guaranteed item is taken —
        // see combat.js's startChallengeRoom/spawnChallengeWave
        if (node.type === 'challenge' && !node.challengeStarted) startChallengeRoom(this, node);
      }
    }
  }

  // Binding of Isaac "external item descriptions"-style tooltip — shows
  // whichever unclaimed item/trinket/familiar pedestal you're nearest to,
  // at a wider range than the pickup-trigger radius above so you see what
  // it is before you're close enough to actually grab it.
  updateItemExamine(){
    const node = this.currentRoom;
    let nearest = null, nearestD = 70;
    if (node.itemPedestals) {
      for (const ped of node.itemPedestals) {
        if (ped.taken) continue;
        const d = Util.dist(this.player.x, this.player.y, ped.x * TILE, ped.y * TILE);
        if (d < nearestD) { nearestD = d; nearest = ped; }
      }
    }
    showItemExamine(nearest);
  }

  checkStairs(){
    const node = this.currentRoom;
    if (node.branchSpots) {
      for (const b of node.branchSpots) {
        if (Util.dist(this.player.x, this.player.y, b.x * TILE, b.y * TILE) < 26) { this.descend(b.branch); return; }
      }
      return;
    }
    if (!node.stairsSpot) return;
    const px = node.stairsSpot.x * TILE, py = node.stairsSpot.y * TILE;
    if (Util.dist(this.player.x, this.player.y, px, py) < 26) this.descend();
  }

  descend(branch){
    if (!this.player.tookDamageThisFloor) {
      this.floorsClearedNoDamage = (this.floorsClearedNoDamage || 0) + 1;
      if (this.floorsClearedNoDamage >= 2) unlockAchievement('unlock_zebra', this);
      if (this.floorsClearedNoDamage >= 4) unlockAchievement('challenge_floors_nodamage_4', this);
      if (this.floorsClearedNoDamage >= 6) unlockAchievement('challenge_floors_nodamage_6', this);
    } else {
      this.floorsClearedNoDamage = 0;
    }
    // Phase 7h (cont.) — The Void Between, PART 1 (floorKey '8D') Challenge
    // feats. '8D' has no superboss of its own (that's '10D''s singularity,
    // floorNum 9), so unlike every other D-branch region's onBossDefeated()
    // Challenge block, these three fire right here at floor-clear time —
    // this.dungeon.floorNum is still 7 (i.e. '8D') at this point, one line
    // before the D-branch progression block below advances it. Reuses
    // player.tookDamageThisFloor/visitedShopThisRun/tookDamageThisRun exactly
    // like every other Challenge no-damage/frugal/untouched check in this
    // file — no new stat. See achievements/defs-11.js's Challenge section.
    if (this.floorPath === 'D' && this.dungeon.floorNum === 7) {
      if (!this.player.tookDamageThisFloor) unlockAchievement('challenge_voidbetween_8d_nodamage', this);
      if (!this.player.visitedShopThisRun) unlockAchievement('challenge_voidbetween_8d_frugal', this);
      if (!this.player.tookDamageThisRun) unlockAchievement('challenge_voidbetween_8d_untouched', this);
    }
    Sound.play('descend');
    // Eternal Heart — protected it for a whole floor, so the temporary half
    // pip cashes out into a real, permanent full container (net +1 max heart).
    // Placed before every startFloor()/win branch below so it applies no
    // matter which way this descent goes. See entities.js takeDamage for the
    // other half of the rule (losing it to an unshielded hit).
    if (this.player.eternalHeart) {
      this.player.eternalHeart = false;
      this.player.redMax = Math.max(0, this.player.redMax - 0.5);
      this.player.redCurrent = Math.min(this.player.redCurrent, this.player.redMax);
      this.player.grantHeartContainer(1);
      this.toast('💗 Eternal Heart became a heart container!');
    }
    // The floor-2 gate room's single spot (room.js's 'cpathgate') reuses the
    // same branchSpots plumbing as Tyrone's 9A/9B fork, so it arrives here as
    // branch 'C' — but it means something completely different: not "pick a
    // side of floor 9", but "leave the normal run entirely". Checked first.
    if (branch === 'C') {
      this.floorPath = 'C';
      this.toast('You slip down the storm drain...');
      this.startFloor(2); // floorNum 2 = "3C"
      return;
    }
    // Phase 7a — the second diversion, same plumbing as 'C' above but from the
    // floor-3 Planetarium gate room (room.js's 'planetarium'). Leaves the
    // normal run entirely for the 4D-10D starlit path.
    if (branch === 'D') {
      this.floorPath = 'D';
      this.toast('You step off the platform and fall upward, into the stars...');
      this.startFloor(3); // floorNum 3 = "4D"
      return;
    }
    if (branch) {
      this.floorBranch = branch;
      this.startFloor(8); // floor 9A/9B
      return;
    }
    // --- C-branch progression. Checked BEFORE the normal floorNum chain
    // because C floors occupy floorNum 2-9, which on a normal run are plain
    // early/mid floors handled by the maxFloorsThisRun fallthrough at the
    // bottom. Nothing below this block can run once floorPath is 'C'.
    // 10C (floorNum 9) is the end of the road: killing Kirk DNB and taking
    // the stairs wins the run outright, a second win condition alongside the
    // normal floor-13 One True DNB finale.
    if (this.floorPath === 'C') {
      if (this.dungeon.floorNum >= C_LAST_FLOORNUM) {
        // The branch's own completion flag — Kirk DNB is dead (his room's
        // stairs are what got us here) and 10C's stairs have been taken.
        // Fires exactly once per run: `state = 'win'` on the next line stops
        // update() dead, so descend() can never be reached again. Bumped
        // BEFORE endRunUnlocks() so any achievement it unlocks still sees a
        // live run to toast against. See achievements.js's cbranch_complete /
        // challenge_cbranchwins ladder.
        bumpStat('cBranchRunsCompleted', 1, this);
        // Phase 10 — clearing the C route is what earns the D route's gate
        // room (floor 3's planetarium, see dungeon.js). Granted before
        // endRunUnlocks() for the same reason the bump above is: the toast
        // needs a live run. It applies from the NEXT run, per unlockPath.
        unlockPath('D', this);
        this.state = 'win'; endRunUnlocks(); return;
      }
      this.startFloor(this.dungeon.floorNum + 1);
      return;
    }
    // --- D-branch progression. Exact mirror of the C block above, and for the
    // same reason: D floors occupy floorNum 3-9, which mean something else
    // entirely on both the normal path and the C-branch. 10D (floorNum 9) ends
    // the run — a third win condition.
    if (this.floorPath === 'D') {
      if (this.dungeon.floorNum >= D_LAST_FLOORNUM) {
        // Fires exactly once per run, for the same reason the C block's bump
        // does: `state = 'win'` on the next line stops update() dead. Bumped
        // BEFORE endRunUnlocks() so anything it unlocks still has a live run
        // to toast against.
        bumpStat('dBranchRunsCompleted', 1, this);
        this.state = 'win'; endRunUnlocks(); return;
      }
      this.startFloor(this.dungeon.floorNum + 1);
      return;
    }
    // The post-branch descent 9A/9B -> 10A/10B -> 11A/11B -> 12A/12B -> 13 ->
    // 14 -> 15 always continues on the same branch (floorBranch is already set
    // from the branch choice above) rather than ending the run right here —
    // these early returns are what let the extended path escape
    // maxFloorsThisRun, which is only ever 6 or 8. Floors 13 and 14 (floorNum
    // 12/13, Phase 7a) need their own lines for exactly that reason: without
    // them the fallthrough below would see next=13 >= maxFloorsThisRun and win
    // the run two floors early. Floor 15 (floorNum 14) used to have NO line and
    // fall through to the win check; as of Phase 10 the range block just below
    // carries it (and floors 16-34) onward, and only floorNum
    // MAIN_ROUTE_FINAL_FLOOR (34) reaches the win check. See
    // isLastFloorOfRun(), which mirrors this same rule for the stairs' "DOWN"
    // vs "ESCAPE" label (render.js's drawStairs)
    if (this.dungeon.floorNum === 8) { this.startFloor(9); return; }
    if (this.dungeon.floorNum === 9) { this.startFloor(10); return; }
    if (this.dungeon.floorNum === 10) { this.startFloor(11); return; }
    if (this.dungeon.floorNum === 11) { this.startFloor(12); return; }
    if (this.dungeon.floorNum === 12) { this.startFloor(13); return; }
    if (this.dungeon.floorNum === 13) { this.startFloor(14); return; }
    // Phase 10 — THE EXTENDED MAIN ROUTE. floorNum 14 ("The One True Descent",
    // HUD floor 15) used to fall through to the win check below and end the
    // run; it now continues into floorNum 15 (stage 4, Frozen Desert) and on
    // through floorNum MAIN_ROUTE_FINAL_FLOOR (34, Hyperspace), which is the
    // new — and only — Main path ending. Same shape as the hardcoded 8..13
    // lines above, just expressed as a range because there are twenty of them.
    //
    // The unlockPath('C') grant has NOT moved trigger: it still fires on
    // taking the stairs of floorNum OLD_MAIN_ROUTE_FINAL_FLOOR on the Main
    // path, exactly as before — that boundary simply isn't the run's end any
    // more, so the grant lives here instead of in the win branch. unlockPath
    // is idempotent (it returns early if the path is already earned), and the
    // win branch below still carries its own identical guard, so a player who
    // somehow reaches the finale without having crossed 14 still gets it.
    if (this.dungeon.floorNum >= OLD_MAIN_ROUTE_FINAL_FLOOR && this.dungeon.floorNum < MAIN_ROUTE_FINAL_FLOOR) {
      if (this.dungeon.floorNum === OLD_MAIN_ROUTE_FINAL_FLOOR) unlockPath('C', this);
      this.startFloor(this.dungeon.floorNum + 1);
      return;
    }
    const next = this.dungeon.floorNum + 1;
    if (next >= this.maxFloorsThisRun) {
      // Phase 10 — clearing the FULL main route (i.e. taking the stairs on
      // floorNum OLD_MAIN_ROUTE_FINAL_FLOOR, the old finale) is what earns the
      // C route's gate room on floor 2 (see dungeon.js). The floorNum test
      // matters: this same win branch also fires on the short 6/8-floor runs a
      // player takes before Polish is beaten, and those must NOT unlock
      // anything. floorPath is necessarily null here — both branch blocks
      // above return before reaching this line — but the guard is written
      // explicitly rather than relying on that.
      if (!this.floorPath && this.dungeon.floorNum >= OLD_MAIN_ROUTE_FINAL_FLOOR) unlockPath('C', this);
      this.state = 'win'; endRunUnlocks(); return;
    }
    this.startFloor(next);
  }

  // true once standing on THIS floor's stairs would end the run — mirrors
  // descend()'s own floorNum 8-13 special cases exactly, so the stairs never
  // mislabel 9A/9B as "ESCAPE" when 10A/10B..15 still follows (see
  // render.js's drawStairs). Keep this list in lockstep with descend().
  isLastFloorOfRun(){
    const f = this.dungeon.floorNum;
    // C-branch: the run ends on 12C (floorNum 11) and nowhere earlier, so
    // maxFloorsThisRun is irrelevant here. Mirrors descend()'s C block.
    if (this.floorPath === 'C') return f >= C_LAST_FLOORNUM;
    // D-branch: same rule, ending on 10D (floorNum 9). Mirrors descend()'s D block.
    if (this.floorPath === 'D') return f >= D_LAST_FLOORNUM;
    // floorNum 12/13 (floors 13/14) join this list for Phase 7a — descend()
    // hardcodes a next floor for both, so neither is ever the last one.
    if (f === 8 || f === 9 || f === 10 || f === 11 || f === 12 || f === 13) return false;
    // Phase 10 — floorNum 14-33 are carried by descend()'s extended-main-route
    // range block, so none of them is the last floor either; floorNum 34
    // (MAIN_ROUTE_FINAL_FLOOR) is, and it is the ONLY Main path floor that
    // still ends the run. Kept in lockstep with descend(), as the note above
    // requires. Floors 0-13 fall through to the unchanged maxFloorsThisRun
    // rule, so short 6/8-floor runs still label their stairs exactly as before.
    if (f >= OLD_MAIN_ROUTE_FINAL_FLOOR) return f >= MAIN_ROUTE_FINAL_FLOOR;
    return f + 1 >= this.maxFloorsThisRun;
  }

  update(input, dt){
    if (this.state !== 'playing' || this.paused) return;
    this.now = performance.now(); // sampled once per tick; every draw/bob-animation call reuses this instead of re-querying the clock
    this.runElapsed += dt; // wall-clock time actually spent playing this run — pause doesn't count, see main.js's pause/gameover/win stat readouts
    if (this.roomFadeTimer > 0) this.roomFadeTimer -= dt;
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      updateHUD(this);
      drawMinimap(this);
      return;
    }
    // Hit-stop (render.js's FX). A few frames of frozen simulation is what makes
    // a heavy hit read as impact instead of as a particle glitch, so the freeze
    // has to stop *everything* — enemies, projectiles, the player — not just FX.
    //
    // Deliberately does NOT call FX.update() here: render() runs immediately
    // after update() every frame (main.js's loop) and its own FX.update(fxDt)
    // is what consumes hitStopTimer. Decrementing it in both places would make
    // every freeze last half as long as it asked for. This check also sits
    // *after* the room-freeze block above on purpose — a room transition must
    // always keep counting down, and render()'s FX.reset() on room change
    // clears any hit-stop that was still pending when the door was crossed.
    if (FX.frozen()) {
      updateHUD(this);
      drawMinimap(this);
      return;
    }
    updatePlayer(this, input, dt);
    if (this.slowTimer > 0) this.slowTimer -= dt;
    const enemyDt = this.slowTimer > 0 ? dt * 0.35 : dt; // Chrono Shard
    for (const e of this.currentRoom.enemies) updateEnemy(this, e, enemyDt);
    updateFamiliars(this, dt);
    updateObstacles(this, dt);
    updateProjectiles(this, dt);
    updateBombs(this, dt);
    updateExplosions(this, dt);
    updateFloatTexts(this, dt);
    updateShop(this);
    this.updateItemPedestal();
    this.updateItemExamine();
    this.updateCamera();
    if (this.swingFX) { this.swingFX.life -= dt; if (this.swingFX.life <= 0) this.swingFX = null; }
    if (this.laserFX) { this.laserFX.life -= dt; if (this.laserFX.life <= 0) this.laserFX = null; }
    this.checkStairs();
    // the run's unlock snapshot dies with the run — menus/bestiary go back to
    // reading the live save, so anything just earned shows up immediately
    if (this.player.isDead) { this.state = 'gameover'; endRunUnlocks(); }
    updateHUD(this);
    drawMinimap(this);
  }
}

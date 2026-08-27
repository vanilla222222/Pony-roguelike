'use strict';
/* ============================================================
   entities.js — Player, Enemy, Boss, Projectile, Obstacle,
   Pickup, Chest, Bomb, Explosion, FloatText
   ============================================================ */

class Player {
  constructor(classId){
    const def = CLASSES[classId];
    this.classId = classId;
    this.def = def;
    this.x = 0; this.y = 0;
    this.radius = 12;
    this.baseSpeed = def.speed;
    this.canFly = !!def.canFly;
    this.attackType = def.attackType;
    this.baseMeleeDamage = def.meleeDamage || 0;
    this.baseRangedDamage = def.rangedDamage || 0;
    this.meleeCooldownBase = def.meleeCooldown || 0.4;
    this.fireCooldownBase = def.fireCooldown || 0.5;
    this.boltSpeed = def.boltSpeed || 340; // flat per-class flavor now — how FAST a bolt travels, not how FAR (see rangeTiles)
    this.onKillHealChance = def.lifedrinkChance || 0;
    this.laser = !!def.laser; // Pony Bot — see combat.js playerLaserAttack; laser ignores range entirely
    // Dragon AND Crystal Pony — see combat.js playerChargedBeamAttack; input.attack
    // must be held for chargeTime before anything fires. Which attack the full
    // charge actually fires is the crystalVolley flag's business, below.
    this.charged = !!def.charged;
    this.chargeTimer = 0;
    this.chargeTime = def.chargeTime || 0;
    this.crystalVolley = !!def.crystalVolley; // Crystal Pony — see combat.js playerCrystalVolleyAttack
    // Phase 8b-uniquefx shadow fields — per-instance copies of a knob that
    // used to be hardcoded in combat.js, so a skilltree.js `uniqueField`
    // node can add a bonus onto it WITHOUT ever writing back onto
    // `player.def` (a direct reference to the shared CLASSES[classId]
    // object — mutating it would permanently corrupt that class for every
    // future run/character, see skilltree.js's applySkillTreeUniqueFieldBonuses).
    // Number of shards Crystal Pony's charged volley fires — was a fixed
    // 3-element CRYSTAL_VOLLEY_OFFSETS array in combat-2.js; only seeded
    // (non-zero) for classes that actually have crystalVolley.
    this.crystalShardCount = def.crystalVolley ? 3 : 0;
    // Same deal for the SPREAD of that volley — the px gap between adjacent
    // shard start points, previously the fixed CRYSTAL_VOLLEY_SPACING constant
    // read straight out of combat-2.js. Seeded from
    // CRYSTAL_VOLLEY_SPACING_DEFAULT (combat-2.js) only for classes that
    // actually have crystalVolley, so a uniqueField node can widen or tighten
    // the fan without touching the shared class def.
    this.crystalVolleySpacing = def.crystalVolley ? CRYSTAL_VOLLEY_SPACING_DEFAULT : 0;
    this.greenFireAttack = !!def.greenFireAttack; // Changeling — see combat.js updateGreenFireAttack
    this.fireZone = null; // {x, y, radius} while the Changeling holds attack, null otherwise
    // the speed multiplier applied while standing in her own fire zone
    // (miredInOwnFire in combat-1.js's updatePlayer) — was a hardcoded 0.25
    // constant; per-instance now so a uniqueField node can tune it (see the
    // shadow-field note above crystalShardCount)
    this.fireZoneRootMult = 0.25;
    // Phase 8c-2 shadow fields — Changeling's held fire-zone pool size/reach,
    // previously read live as `player.def.fireZoneRadius || 50` /
    // `player.def.fireZoneRange || 40` in combat-1.js's updateGreenFireAttack
    // (a read-only, no-mutation-risk pattern, but with no per-instance field
    // for a uniqueField node to add onto — see the audit's "not yet shadowed"
    // list). Seeded from the same def fields/fallbacks so behavior is
    // unchanged until a skilltree node actually targets one.
    this.fireZoneRadius = def.fireZoneRadius || 50;
    this.fireZoneRange = def.fireZoneRange || 40;
    // Changedling — an always-on version of the fire zone above that follows
    // her instead of staying anchored; reuses the SAME fireZone field
    // (only one of greenFireAttack/innateFireRing is ever true for a given
    // class) — see combat.js updateFireRingAttack
    this.innateFireRing = !!def.innateFireRing;
    // Phase 8c-2 shadow field — Changedling's (or, via a uniqueFlag node,
    // Alicorn's) fire-ring radius; was `player.def.fireRingRadius || 60` in
    // combat-1.js's updateFireRingAttack, same shadow-field treatment as
    // fireZoneRadius/fireZoneRange above.
    this.fireRingRadius = def.fireRingRadius || 60;
    this.shockwaveAttack = !!def.shockwaveAttack; // Diamond Dog — her melee swing shatters rocks too, see combat.js playerMeleeAttack
    // Phase 8c-2 shadow field — Diamond Dog's (or, via a uniqueFlag node,
    // Earth Pony's) flat chance for a shockwave-shattered rock to pay out a
    // coin; was `player.def.rockCoinChance || 0` in combat-1.js's
    // shatterRockByShockwave, same shadow-field treatment as above. Defaults
    // to 0 for every class without the def field, exactly as before.
    this.rockCoinChance = def.rockCoinChance || 0;
    // Changeling Queen — periodically summons small changeling minions that
    // each run their own miniature fire-zone tick, see combat.js
    // updateChangelingSummons
    this.summonsChangelings = !!def.summonsChangelings;
    this.changelingSummonCooldown = def.changelingSummonCooldown || 8;
    this.maxChangelingMinions = def.maxChangelingMinions || 2;
    this.changelingMinionDmg = def.changelingMinionDmg || 0;
    this.changelingMinionRadius = def.changelingMinionRadius || 0;
    this._changelingSummonTimer = 0; // counts UP to changelingSummonCooldown, see updateChangelingSummons
    // Engineer Pony — hold the build key to plant a stationary turret, see
    // combat.js updateTurretBuild / main.js's input.build
    this.canBuildTurrets = !!def.canBuildTurrets;
    this.turretBuildTimer = 0;
    // Phase 8c-2 shadow fields — Engineer Pony's turret knobs, previously
    // hardcoded constants inline in combat-1.js's updateTurretBuild
    // (`dmg: player.rangedDamage * 0.7`) and updatePlayerTurrets's caller
    // (`node.playerTurrets.length >= 3`). Per-instance now so uniqueField
    // nodes can tune them; every other class simply never sets
    // canBuildTurrets true, so these stay unused no-ops for them.
    this.turretDamageMult = 0.7;
    this.maxTurrets = 3;
    // Phase 8c-2 shadow field — Pony Bot's fragility multiplier, previously
    // read live as `(game.player.def && game.player.def.damageTakenMult) ||
    // 1` in combat-1.js's playerDamageAmount (explicitly called out in the
    // Phase 8b-uniquefx audit as read-only/unshadowed). Seeded from the same
    // def field/fallback, defaults to 1 (no change) for every other class.
    this.damageTakenMult = def.damageTakenMult || 1;
    this.unlimitedRange = !!def.unlimitedRange; // Breezie — see combat.js playerRangedAttack; bolts only ever stop at a wall
    // "layered attacks" pass — item-granted secondary/tertiary attack
    // effects, rebuilt every recalcPlayerStats from owned items' data.js
    // `attackLayer` field (see items.js). Dispatched from js/attackStyles.js,
    // hooked into every one of the attack functions above/below this class.
    this.attackLayers = [];
    // a tiny generic delayed-callback queue, {time, fn} — used by the
    // echoShot attack-layer style (see attackStyles.js) for a true delayed
    // second hit rather than a simultaneous one. Ticked in combat.js's
    // updatePlayer. Generic on purpose in case something else wants a
    // one-shot delayed effect later.
    this.delayedActions = [];

    // Range stat, in tiles: how far a ranged bolt flies before expiring, or
    // how far a melee swing reaches. Ranged classes start at 7 tiles, melee
    // at 1 — Range Up items/pills add tiles at full rate for ranged classes
    // and 25% rate for melee (see recalcPlayerStats). The laser ignores this
    // entirely (always room-spanning), so it's left at 0/unused for it. A
    // class can override the default via def.baseRangeTiles (e.g. Kelpie's
    // unusually long melee reach, or Dragon's deliberately short beam).
    this.baseRangeTiles = this.laser ? 0 : (def.baseRangeTiles != null ? def.baseRangeTiles : (this.attackType === 'melee' ? 1 : 7));
    this.rangeTiles = this.baseRangeTiles;
    this.meleeRange = this.baseRangeTiles * TILE; // effective, recalculated once trinkets/pills/items can modify it — see recalcPlayerStats

    this.trinketId = null; // single-slot, Isaac-style — see items.js equipTrinket
    this.familiars = []; // stacking companions, one Familiar instance per copy owned — see familiars.js
    this.changelingMinions = []; // Changeling Queen's summoned minions — see combat.js updateChangelingSummons

    this.pillPocket = null; // held pill's color id — see pills.js
    // every pill effect is permanent — these accumulate up or down over the
    // course of a run and are folded into recalcPlayerStats below, separate
    // from item/trinket bonuses since they aren't tied to any owned count
    this.pillSpeedBonus = 0;
    this.pillDamageBonus = 0;
    this.pillLuckBonus = 0;
    this.pillRangeBonus = 0;
    this.pillFireRateBonus = 0;

    this.starPocket = null; // held star's id — see stars.js
    // star buffs that only last "for the room" — cleared the instant a new
    // room is entered, see game.js enterRoom. Unlike the pill*Bonus fields
    // above, these are meant to wear off, so they're never "permanent".
    this.starDamageBonus = 0; // Alcyone — folded into recalcPlayerStats below
    this.starSpeedMult = 1; // Electra (1.5) / Vega (2) — see combat.js updatePlayer's speed formula

    this.redMax = def.redMax;
    this.redCurrent = def.redMax;
    this.blueCurrent = def.startBlue || 0;

    this.coins = def.startCoins || 0;
    this.keys = def.startKeys || 0;
    this.bombs = def.startBombs || 0;
    this.unlimitedKeysFloor = false; // Gold Key pickup — reset each floor, see game.js startFloor()
    this.unlimitedBombsFloor = false; // Gold Bomb pickup — ditto

    this.passives = {};
    this.activeItem = null;
    this.activeCharge = 0;

    this.facing = { x: 0, y: 1 };
    this.moving = false; // set every frame in combat.js's updatePlayer — drives drawPony's walk cycle, see render.js
    this.attackTimer = 0;
    this.invulnTimer = 0;
    this.invincibleTimer = 0;
    this.speedBoostTimer = 0;
    this.dmgFlashTimer = 0;
    this.freezeTimer = 0; // Sand Trap — see combat.js updatePlayer/updateObstacles
    this.secondWindUsedThisFloor = false;
    this.tookDamageThisFloor = false;
    this.isDead = false;
    this.lastDamageSource = null; // see takeDamage() below / main.js's gameover handling

    this.luckyPennies = 0; // count of lucky pennies collected this run

    this.speed = this.baseSpeed;
    this.meleeDamage = this.baseMeleeDamage;
    this.rangedDamage = this.baseRangedDamage;
    this.meleeCooldown = this.meleeCooldownBase; // effective, after Fire Rate Up etc.
    this.fireCooldown = this.fireCooldownBase;
    this.spikedBarding = false;
    this.lifestealChance = 0;
    this.critChance = 0;
    this.revealMap = false;
    this.eyeUsed = false; // All-Seeing Eye was used this run (revealMap stays true even after recalc)
    this.hasSecondWind = false;
    this.luck = 0;

    // on-hit status chances (see items.js recalcPlayerStats / combat.js applyOnHitStatuses)
    this.venomChance = 0;
    this.stunChance = 0;
    this.charmChance = 0;
    this.freezeChance = 0;
    this.fearChance = 0;

    // newer item-driven stats (see items.js recalcPlayerStats)
    this.magnetRadius = 0;
    this.bombRadiusMult = 1;
    // tearFlags — every item/trinket that touches how the player's own
    // ranged bolts behave writes into this one shared bag instead of its own
    // one-off field, so stacking multiple such items actually combines
    // (see items.js recalcPlayerStats, combat.js playerRangedAttack/
    // updateProjectiles). Counts, not booleans — most can stack.
    //   pierce    — extra enemies a bolt can pass through before dying
    //   homing    — bolts gently steer toward the nearest enemy in flight
    //   spectral  — bolts ignore obstacles entirely (walls still stop them)
    //   explosive — a bolt detonates a small blast wherever it dies
    this.tearFlags = { pierce: 0, homing: 0, spectral: 0, explosive: 0 };
    this.multishotExtra = 0;
    this.dodgeChance = 0;
    this.critMultiplier = 2;
    this.shieldHits = 0; // consumed by Iron Curtain — see takeDamage() below
    // Eternal Heart pickup — a temporary +0.5 red pip (drawn pale in the HUD,
    // see ui.js) that's stripped by the first hit blue hearts don't absorb,
    // or cashed in for a permanent full container on reaching the next floor
    // (see takeDamage() below and game.js descend())
    this.eternalHeart = false;
    // Gold Heart pickup — heals half a heart at the end of any room cleared
    // without taking a hit (see game.js onRoomJustCleared), and is lost the
    // instant any hit actually registers (see takeDamage() below).
    this.goldHeart = false;
    this.bossDamageBonus = 0; // Void-Touched Charm
    this.bossDamageTakenMult = 1; // Stonewall

    this.tookDamageThisBossRoom = false; // reset on boss-room entry — see game.js enterRoom / Untouchable achievement
    this.bossRoomsNoDamageStreak = 0; // consecutive superboss rooms cleared without damage, reset on any hit — see game.js onBossDefeated / Challenge achievements
    this.tookDamageThisRun = false; // reset once per run at construction — see the Sea Pony achievement
    this.tookDamageThisRoom = false; // reset on room entry — see game.js enterRoom / Gold Heart room-clear heal
    // Phase 5b — set the first time this run's player steps into a shop
    // room (see game.js enterRoom's first-visit block); checked at
    // recordWin() for the 'challenge_frugal_run' achievement, same
    // bespoke-trigger shape as tookDamageThisRun/onehearted above.
    this.visitedShopThisRun = false;
    // Phase 5b — Synergy A (Ecosystem Set) one-shot flag, set the first
    // time recalcPlayerStats sees ecosystemSetActive true this run, so the
    // 'synergy_ecosystem' stat bump fires exactly once per run rather than
    // once per recalcPlayerStats call while the synergy stays active.
    this._ecosystemSetSeen = false;
  }

  totalHearts(){ return this.redCurrent + this.blueCurrent; }

  // `source` is optional and only used to attribute a death to a specific
  // cause — currently just the Pony Bot achievement ("die to a cactus")
  takeDamage(amount, source){
    if (this.invulnTimer > 0 || this.invincibleTimer > 0 || this.isDead) return;
    if (this.shieldHits > 0) { this.shieldHits--; Sound.play('shieldBlock'); return; }
    if (this.dodgeChance && Math.random() < this.dodgeChance) { Sound.play('dodge'); return; }
    Sound.play('playerHurt');
    // Phase 13 visual pass (batch 1) — stamped on every hit that actually
    // lands (past invuln/shield/dodge above); ui.js updateHUD diffs this
    // against its own cache and retriggers the #canvasWrap hit-flash class.
    // Date.now() rather than a boolean so two hits in the same HUD-diff
    // window still count as "changed" and each gets its own flash.
    this._hitFlashAt = Date.now();
    // Eternal Heart is spent by the first hit that isn't soaked by blue
    // hearts — checked here, past invuln/shield/dodge (so only a hit that
    // really lands counts) and BEFORE blue is drained below, so blueCurrent
    // is still its pre-hit value. The hit itself still deals its damage.
    if (this.eternalHeart && this.blueCurrent <= 0) {
      this.eternalHeart = false;
      this.redMax = Math.max(0, this.redMax - 0.5);
      this.redCurrent = Math.min(this.redCurrent, this.redMax);
    }
    // remembers whatever actually landed this hit — an enemy/boss/superboss
    // id, an obstacle kind, or 'curse'/'explosion' — so the Bestiary can
    // credit an enemy with a death, see main.js's gameover handling below
    this.lastDamageSource = source;
    this.tookDamageThisFloor = true;
    this.tookDamageThisBossRoom = true;
    this.tookDamageThisRun = true;
    this.tookDamageThisRoom = true;
    // any hit that gets this far counts — the Gold Heart is flat-out lost,
    // with no shield/eternal-heart interaction of its own
    this.goldHeart = false;
    let dmg = amount;
    if (this.blueCurrent > 0) {
      const used = Math.min(this.blueCurrent, dmg);
      this.blueCurrent -= used; dmg -= used;
    }
    // only spend red / check for death on whatever damage blue didn't
    // absorb — characters with redMax:0 (Pony Bot, Kirin) sit at
    // redCurrent 0 permanently, so an unconditional "<= 0" check here would
    // kill them on their very first hit regardless of blue hearts, since
    // blue never gets a chance to actually shield them
    if (dmg > 0) {
      this.redCurrent -= dmg;
      if (this.redCurrent <= 0) {
        if (this.hasSecondWind && !this.secondWindUsedThisFloor) {
          this.secondWindUsedThisFloor = true;
          this.redCurrent = 0.5;
        } else {
          this.redCurrent = 0;
          this.isDead = true;
          if (source === 'cactus') unlockAchievement('unlock_ponybot', null);
        }
      }
    }
    // Capped. Every source here stacks additively and several of them stack
    // with THEMSELVES (they're counts, not booleans), so an unbounded sum was
    // a real degenerate build: ~4 copies of Tempered Steel plus a Fool's
    // Feather already buys well over 2s of post-hit invulnerability, which is
    // longer than most enemies need to reposition — i.e. functional immunity.
    // 1.8s is still a huge upgrade over the 0.85s baseline.
    this.invulnTimer = Math.min(1.8,
      0.85 + (this.trinketId === 'foolsfeather' ? 0.5 : 0) + 0.2 * (this.passives.temperedsteel || 0)
      + 0.3 * (this.passives.seraphshield || 0)
      // 75-achievement + 25-unlocked batch (see data.js) — invulnerability contributions
      + 0.2 * (this.passives.phoenixfeathershard || 0) + 0.15 * (this.passives.steadfastheart || 0));
    this.dmgFlashTimer = 0.3;
  }

  // draws down `cost` worth of hearts, blue first then whatever's left out
  // of red — the shared "pay hearts for something" pattern used by cursed
  // chests, devil deals, and a couple of active items (Sombra's Bargain,
  // Martyr's Resolve). Caller is responsible for checking there's enough
  // available first (every current call site follows the same "must always
  // leave something" rule — see combat.js's tryOpenChest for the canonical
  // example — but that check varies enough by context it isn't folded in here).
  spendHearts(cost){
    let remaining = cost;
    const fromBlue = Math.min(this.blueCurrent, remaining);
    this.blueCurrent -= fromBlue; remaining -= fromBlue;
    this.redCurrent -= remaining;
    this.dmgFlashTimer = 0.3;
  }

  heal(amount){ this.redCurrent = Math.min(this.redMax, this.redCurrent + amount); }
  healBlue(amount){ const cap = 20 - this.redMax; this.blueCurrent = Util.clamp(this.blueCurrent + amount, 0, Math.max(0, cap)); }
  grantHeartContainer(n){
    if (this.def.noRedContainers) return;
    const cap = 20;
    const newMax = Math.min(cap - this.blueCurrent, this.redMax + n);
    const gained = Math.max(0, newMax - this.redMax);
    this.redMax = newMax;
    this.redCurrent = Math.min(this.redMax, this.redCurrent + gained);
  }

  onKill(){
    if (this.onKillHealChance && Math.random() < this.onKillHealChance && this.redCurrent < this.redMax) this.heal(0.5);
  }
  onHitLanded(){
    if (this.lifestealChance && Math.random() < this.lifestealChance && this.redCurrent < this.redMax) this.heal(0.5);
  }

  gainRoomClearCharge(){
    if (this.activeItem && this.activeCharge < this.activeItem.maxCharge) this.activeCharge++;
  }
  pickupActiveItem(item){ this.activeItem = item; this.activeCharge = 0; }
}

class Enemy {
  constructor(type, tx, ty, floorNum){
    // Phase 10 difficulty rebalance — growth.js's stage-keyed multiplier layer.
    // stageTunedType hands back a COPY of the type with its `*Cooldown` fields
    // shortened (the ai-*.js functions read those off the type object, not off
    // the instance), and returns the original object by reference on stages 0-1
    // where the multiplier is exactly 1. See growth.js for the curve and why.
    const stageMult = (typeof stageDifficultyMult === 'function') ? stageDifficultyMult(floorNum) : 1;
    const stageAggro = (typeof stageAggressionMult === 'function') ? stageAggressionMult(floorNum) : 1;
    if (typeof stageTunedType === 'function') type = stageTunedType(type, floorNum);
    this.type = type;
    this.name = type.name;
    this.x = tileToPx(tx); this.y = tileToPx(ty);
    this.radius = type.radius;
    // multiplicative, so an enemy's toughness *relative to every other enemy*
    // is the same on Floor 10 as on Floor 1 — see enemies.js's enemyHpScale
    // for why the old flat per-floor HP addition had to go. (The old formula's
    // exact per-floor constant is not recoverable — this repo has no history
    // and the line was already replaced — so it is deliberately not cited.)
    // ...and on top of that, the player's chosen difficulty (main.js's
    // difficultyStatMult — easy 0.75 / normal 1 / hard 1.5). It's an extra
    // FACTOR on the floor curve, never a replacement for it, and it only
    // ever touches enemy hp/dmg — no player stat reads this.
    const diffMult = (typeof difficultyStatMult === 'function') ? difficultyStatMult() : 1;
    this.hp = Math.max(1, Math.round(type.hp * enemyHpScale(floorNum) * stageMult * diffMult));
    this.maxHp = this.hp;
    // trash dmg takes only a SHARE of the stage multiplier (growth.js's
    // stageDamageMult) — it is the one number here that is still well under
    // combat-1.js's 4-heart cap, so a nudge here actually lands, but hearts are
    // the harshest resource in the game to inflate.
    const stageDmg = (typeof stageDamageMult === 'function') ? stageDamageMult(floorNum) : 1;
    this.dmg = Math.max(1, Math.round(type.dmg * stageDmg * diffMult)); // half-hearts — see combat.js's playerDamageAmount
    this.isChampion = false; // set post-population by room.js — doubled hp/dmg, bonus death drop. Bosses never get it.
    this.speed = type.speed * stageAggro;
    this.flies = !!type.flies;
    this.behavior = type.behavior;
    this.color = type.color; this.dark = type.dark;
    this.contactCooldown = 0;
    this.fireTimer = Util.rand(0.4, type.fireCooldown || 1.5);
    this.pathTimer = 0;
    this.pathDir = null;
    this.navPath = null; // cached BFS route around obstacles — see ai.js's chaseSeek
    this.isBoss = false;
    this.isDead = false;
    this.hitFlash = 0;
    this.knockX = 0; this.knockY = 0;
    this.fuseTimer = 0; this.arming = false;
    this.shielded = type.behavior === 'shielded';
    this.shieldTimer = type.shieldTime || 0;
    this.vx = 0; this.vy = 0;

    // generic state shared by the newer behaviors (charger/leaper/turret/splitter)
    this.attackTimer = Util.rand(0.5, type.chargeCooldown || type.leapCooldown || 1.5);
    this.dashing = false; this.dashTimer = 0; this.dashVX = 0; this.dashVY = 0;
    this.telegraph = 0;
    this.splitDone = false;
    this.facingAngle = 0;

    // state for the extended behavior set (orbiter/burrower/summoner/healer/
    // sniper/swarm/ambusher/teleporter/shielder/lobber/weaver/sentry — see
    // ai.js). All initialized here rather than lazily on first use, so no
    // behavior ever does arithmetic on undefined.
    this.orbitDir = Math.random() < 0.5 ? -1 : 1;   // orbiter: which way it strafes
    this.submerged = false;                          // burrower (also used by the wyrm/wraith bosses)
    this.burrowTimer = type.burrowCooldown || 3;
    this.summonTimer = Util.rand(1, type.summonCooldown || 6);
    this.minionsSpawned = 0;                         // summoner: lifetime count, capped by maxSummons
    this.healTimer = Util.rand(0.5, type.healCooldown || 3);
    this.triggered = false;                          // ambusher: has the trap sprung
    this.blinkTimer = Util.rand(0.5, type.blinkCooldown || 3.5);
    this.grantedShield = false;                      // shield handed out by a shielder — expires in combat.js
    this.lobTimer = 0; this.lobTime = 0; this.lobX = 0; this.lobY = 0;
    this.weavePhase = Math.random() * Math.PI * 2;
    this.lastPX = null; this.lastPY = null;          // sentry: last sampled player position

    // state for the extended regular-boss set (bossBoneCaller/bossGraveChorus/
    // bossRotBloom/bossAntlerWarden/bossGlassScorpion/bossDuneRavager/
    // bossFurnaceHeart/bossSlagbound — see ai.js). Same rule as the block
    // above: eager init, so no boss ever does `-= dt` on undefined and freezes.
    this.wardOwner = null;                           // set on a MINION by aiBossBoneCaller: which boss its life props up
    this.wardTimer = 0;                              // bonecaller: hard cap on how long one ward can hold
    this.waveTimer = Util.rand(2, 3.5);              // bonecaller: time to the next raising
    this.spinTimer = 0;                              // grave chorus: spiral-burst window
    this.spinAngle = 0;                              // grave chorus: current sweep angle
    this.bounces = 0;                                // antler warden: ricochets left in the current charge
    this.pyres = [];                                 // dune ravager: pending delayed ground bursts, {x,y,t}
    this.pyreDrop = 0;                               // dune ravager: cadence between drops along the charge
    this.pulseCount = 0;                             // furnace heart: ring waves left in the volley
    this.pulseTimer = 0;                             // furnace heart: gap between waves
    this.exhaustTimer = 0;                           // furnace heart: post-volley punish window
    this.prevHp = this.hp;                           // slagbound: previous-frame HP (Boss re-seeds this after its own HP curve)
    this.retaliation = 0;                            // slagbound: stored damage, spends into a ring

    // state for the DNB superboss set (bossPlapper/bossClapper/bossNhm/
    // bossVanillaDnb/bossOneTrueDnb — floors 11A/11B/12A/12B/13, see ai.js).
    // Same rule as every block above, and it matters more here than anywhere:
    // these fights are timer-driven end to end, so ONE uninitialized field
    // would NaN on its first `-= dt` and leave the run's final boss inert.
    this.beatTimer = Util.rand(0.8, 1.4);            // plapper: time to the next bar
    this.burstShots = 0;                             // plapper/one-true: aimed shots left in the downbeat burst
    this.shotTimer = 0;                              // plapper/nhm/one-true: gap between shots inside a burst or drop
    this.barCount = 0;                               // plapper/one-true: bars elapsed — every 3rd is the shockwave
    this.clapCount = 0;                              // clapper/one-true: blink-claps left in the current volley
    this.buildTimer = 0;                             // nhm/one-true: buildup window before the drop
    this.dropShots = 0;                              // nhm/one-true: gapped walls left in the drop
    this.dropAngle = 0;                              // nhm/one-true: orientation the drop's walls are built around
    this.sweepTimer = 0;                             // vanilla/one-true: rotating-arm sweep window
    this.sweepDir = Math.random() < 0.5 ? -1 : 1;    // vanilla/one-true: which way the arm rotates
    this.regenTimer = 0;                             // vanilla: shielded/regen phase remaining
    this.phaseIndex = 0;                             // one-true: which HP band's pattern is running (0 at full HP, so spawning never fakes a transition)
    this.phaseShift = 0;                             // one-true: the do-nothing beat that telegraphs a band change
    // pre-existing shared latch: every superboss's SECOND minion wave. It was
    // only ever set lazily in ai.js and read as `!e.minions2`, which is safe
    // but relied on undefined being falsy — declared here now that five more
    // bosses use it. Purely a clarity change: false and undefined behave
    // identically at every read site.
    this.minions2 = false;

    // status effects (see combat.js applyOnHitStatuses / updateEnemy) — never apply to bosses
    this.poisonTimer = 0; this.poisonTickTimer = 0;
    this.stunTimer = 0;
    this.freezeTimer = 0;
    this.fearTimer = 0;
    this.charmTimer = 0;
    this.vulnerableTimer = 0;
  }
  takeDamage(amount, kx, ky){
    if (this.shielded) return false;
    // Vulnerable status effect — marked enemies take 50% more damage from every source.
    if (this.vulnerableTimer > 0) amount *= 1.5;
    this.hp -= amount;
    this.hitFlash = 0.15;
    this.knockX += kx || 0; this.knockY += ky || 0;
    if (this.hp <= 0) this.isDead = true;
    return true;
  }
}

class Boss extends Enemy {
  constructor(type, tx, ty, floorNum){
    super(type, tx, ty, floorNum);
    this.isBoss = true;
    // bosses get their own (gentler) curve — see enemies.js's bossHpScale.
    // Difficulty is re-applied here for the same reason prevHp is: Enemy's
    // constructor already put dmg on the difficulty factor, but the hp it
    // computed came off the *enemy* curve and is thrown away below.
    // Same stage-keyed multiplier the Enemy constructor applied — recomputed
    // rather than passed down, because super() already ran and threw away the
    // hp it derived from the *enemy* curve. Bosses have to climb in lockstep
    // with trash or they fall behind it stage by stage. Their `speed` and
    // `*Cooldown` fields were already tuned by super().
    const bossStageMult = (typeof stageDifficultyMult === 'function') ? stageDifficultyMult(floorNum) : 1;
    this.hp = Math.max(1, Math.round(type.hp * bossHpScale(floorNum) * bossStageMult * ((typeof difficultyStatMult === 'function') ? difficultyStatMult() : 1)));
    this.maxHp = this.hp;
    // bosses now ALSO get real floor-scaled damage (see enemies.js's
    // bossDmgScale) — Enemy's constructor already set this.dmg off the flat,
    // never-floor-scaled formula every other enemy uses; overwrite it here
    // with the boss-specific curve, same difficulty-mult re-application
    // pattern as the hp line right above.
    this.dmg = Math.max(1, Math.round(type.dmg * bossDmgScale(floorNum) * ((typeof difficultyStatMult === 'function') ? difficultyStatMult() : 1)));
    // re-seeded here because Enemy's constructor took it off the *enemy* curve
    // above — see ai.js's aiBossSlagbound, which reads it as a hit signal
    this.prevHp = this.hp;
    this.name = type.name;
    this.attackTimer = Util.rand(0.6, 1.3);
    this.pattern = 0;
    this.minionsSpawned = false;
    this.dashTimer = 0; this.dashing = false; this.dashVX = 0; this.dashVY = 0;
    this.telegraph = 0;
    this.shielded = false;
    this.enraged = false;
  }
}

// Phase 15 — the "miniboss" room's occupant. Sits deliberately BETWEEN Enemy
// and Boss: tougher and more dangerous than any trash mob, but not a real
// Boss — it does NOT set isBoss (so it never hijacks the big top-of-screen
// boss health bar, never bumps `bossesKilled`, never fires game.onBossDefeated,
// and the Phase 14 facing-flip/hit-squash/breathing treatment in
// utils-2.js's drawBrownHumanoid still applies to it exactly like trash,
// since that logic is keyed off `!isBoss`). Uses its own gentler-than-boss
// growth curve (growth.js's minibossHpScale/minibossDmgScale) — see
// MINIBOSS_TYPES' header comment in data/enemies/minibosses.js for the
// stat-band reasoning.
class Miniboss extends Enemy {
  constructor(type, tx, ty, floorNum){
    super(type, tx, ty, floorNum);
    this.isMiniboss = true;
    const mbStageMult = (typeof stageDifficultyMult === 'function') ? stageDifficultyMult(floorNum) : 1;
    this.hp = Math.max(1, Math.round(type.hp * minibossHpScale(floorNum) * mbStageMult * ((typeof difficultyStatMult === 'function') ? difficultyStatMult() : 1)));
    this.maxHp = this.hp;
    this.dmg = Math.max(1, Math.round(type.dmg * minibossDmgScale(floorNum) * ((typeof difficultyStatMult === 'function') ? difficultyStatMult() : 1)));
    this.prevHp = this.hp;
    this.name = type.name;
  }
}

class Projectile {
  constructor(x, y, vx, vy, damage, owner, opts){
    opts = opts || {};
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.damage = damage; this.owner = owner;
    this.radius = opts.radius || 5;
    this.color = opts.color || (owner === 'player' ? '#c9c3ff' : '#e0895a');
    this.life = opts.life !== undefined ? opts.life : 2.5;
    this.dead = false;
    this.pierce = opts.pierce || 0; // Piercing Shot — extra enemies this bolt can pass through
    this.hitEnemies = []; // tracks who a piercing bolt already hit, so it can't double-hit the same target
    this.fromBoss = !!opts.fromBoss; // owner==='enemy' bolts only — see combat.js playerDamageAmount()
    // whichever enemy/obstacle fired this, so updateProjectiles' obstacle-
    // collision pass can skip colliding it against its own shooter the
    // instant it spawns (only matters for obstacle-sourced shots, since
    // enemies aren't in node.obstacles — see ai.js's fireProjectileAngle)
    this.source = opts.source || null;
    // player tearFlags, snapshotted at fire time — see combat.js's
    // playerRangedAttack/updateProjectiles
    this.homing = opts.homing || 0;
    this.spectral = !!opts.spectral;
    this.explosive = opts.explosive || 0;
    this.exploded = false; // guards explosive bolts from detonating twice
  }
}

class Obstacle {
  constructor(kind, tx, ty){
    this.kind = kind;
    this.def = OBSTACLES[kind];
    this.x = tileToPx(tx); this.y = tileToPx(ty);
    this.tx = tx; this.ty = ty;
    this.radius = kind === 'pit' ? TILE / 2 : 14;
    this.destroyed = false;
    this.isPit = kind === 'pit';
    this.destructible = !!this.def.destructible;
    this.alwaysBlocks = !!this.def.blocksFlight;
    this.tall = !!this.def.tall;
    this.isHazard = !!this.def.hazard;
    this.attackable = !!this.def.attackable;
    // a hazard is normally walk-over (non-blocking) — Spiked Rock sets this
    // to stay solid (block movement) while still hurting on contact, see
    // combat.js's collidesAt
    this.solid = !!this.def.solid;
    // Mud / Sand Trap — explicitly walk-over: never blocks movement, enemy
    // pathing, line of sight or projectiles, and doesn't make its tile count
    // as occupied for pickup/enemy placement. Independent of isHazard (which
    // only happens to be non-blocking as a side effect of hurting on contact)
    // — see combat.js's collidesAt/tileHasObstacle and ai.js's makeIsBlockedFn
    this.isWalkable = !!this.def.walkable;
    // Sand Trap only — freezes the player briefly on contact instead of
    // dealing damage, see combat.js's updateObstacles
    this.isFreezeTrap = !!this.def.freeze;
    // Bomb Barrel's pushable variant — shoved a step by player contact,
    // see combat.js's tryPushObstacles
    this.pushable = !!this.def.pushable;
    this.hp = this.def.maxHp || 0;
    this.hitFlash = 0;
    this.contactCooldownTimer = 0;
    this.fireTimer = this.def.fireCooldown ? Util.rand(0.6, this.def.fireCooldown) : 0;
    // Moving Spike only — patrol state, lazily initialized on its first
    // update tick (needs the room grid, not available in this constructor)
    // — see combat.js's updateMovingSpike
    // spikeWallDir is the SPIKE_DIRS index pointing from the spike toward the
    // wall/obstacle it is currently hugging — null means "not touching one"
    this.spikeDir = null; this.spikeWallDir = null; this.spikeTargetTx = null; this.spikeTargetTy = null;
  }
}

class Pickup {
  constructor(kind, tx, ty, extra){
    this.kind = kind;
    this.x = tileToPx(tx); this.y = tileToPx(ty);
    this.radius = 9;
    this.coin = extra; // coin-tier object, when kind==='coin'
    this.pillColor = kind === 'pill' ? extra : null; // pill color id, when kind==='pill'
    this.starId = kind === 'star' ? extra : null; // star id, when kind==='star'
    this.collected = false;
    this.bobPhase = Math.random() * Math.PI * 2;
  }
}

class Chest {
  constructor(kind, tx, ty){
    this.kind = kind;
    this.def = CHEST_TYPES[kind] || CHEST_TYPES.grey;
    this.x = tileToPx(tx); this.y = tileToPx(ty);
    this.radius = 13;
    this.opened = false;
  }
}

class Bomb {
  constructor(x, y, owner){
    this.x = x; this.y = y; this.owner = owner;
    this.timer = 1.7;
    this.exploded = false;
    this.radius = 8;
  }
}

class Explosion {
  constructor(x, y, radius){
    this.x = x; this.y = y; this.radius = radius;
    this.life = 0.35; this.maxLife = 0.35;
  }
}

class FloatText {
  constructor(x, y, text, color){
    this.x = x; this.y = y; this.text = text; this.color = color || '#fff';
    this.life = 0.9; this.maxLife = 0.9;
  }
}

// a persistent companion that follows the player between rooms and floors
// for the rest of the run — see familiars.js for behavior, render.js for
// drawing. `index` staggers multiple familiars so they don't stack exactly
// on top of each other.
class Familiar {
  constructor(def, player, index){
    this.def = def;
    this.index = index;
    this.x = player.x; this.y = player.y;
    this.angle = (index * 1.7) % (Math.PI * 2);
    this.fireTimer = Util.rand(0, def.cooldown || 1);
    this.contactCooldown = 0;
    this.procTimer = Util.rand(def.interval ? def.interval * 0.3 : 3, def.interval || 5);
  }
}

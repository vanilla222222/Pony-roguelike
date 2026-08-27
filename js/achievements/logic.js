'use strict';
// achievements/logic.js — split from achievements.js: index + unlock/tracking logic + panel UI.
const ACHIEVEMENTS_BY_ID = {};
const _ACHV_BY_STATKEY = new Map();          // statKey            -> [def, ...]
const _ACHV_BY_BESTIARY_ID = new Map();      // 'section/id'       -> [def, ...] (per-id count predicates)
const _ACHV_BY_BESTIARY_SECTION = new Map(); // section            -> [def, ...] (distinct-breadth predicates)
const _ACHV_BY_CATEGORY = new Map();         // category           -> [def, ...] (panel grouping)
function _indexPush(map, key, def){
  const arr = map.get(key);
  if (arr) arr.push(def); else map.set(key, [def]);
}
function indexAchievement(def){
  ACHIEVEMENTS_BY_ID[def.id] = def;
  if (def.statKey) _indexPush(_ACHV_BY_STATKEY, def.statKey, def);
  if (def.bestiarySection) {
    if (def.bestiaryId && def.threshold != null) _indexPush(_ACHV_BY_BESTIARY_ID, def.bestiarySection + '/' + def.bestiaryId, def);
    if (def.distinctThreshold != null) _indexPush(_ACHV_BY_BESTIARY_SECTION, def.bestiarySection, def);
  }
  _indexPush(_ACHV_BY_CATEGORY, def.category || 'Miscellaneous', def);
}
for (const a of ACHIEVEMENTS) indexAchievement(a);
_achvIndexReady = true;

/* ---------------------------------------------------------------
   Unlock persistence + gameplay hooks
   --------------------------------------------------------------- */
function ensureUnlockShape(unlocks){
  if (!unlocks.achievements) unlocks.achievements = {};
  if (!unlocks.unlockedItems) unlocks.unlockedItems = {};
  if (!unlocks.unlockedPickups) unlocks.unlockedPickups = {};
  if (!unlocks.unlockedTrinkets) unlocks.unlockedTrinkets = {};
  if (!unlocks.unlockedFamiliars) unlocks.unlockedFamiliars = {};
  if (!unlocks.unlockedStars) unlocks.unlockedStars = {};
  // The two newest categories. Same "create it if the save predates it"
  // treatment as the five above — ensureUnlockShape runs on EVERY read
  // (currentUnlocks/beginRunUnlocks) and every write (unlockAchievement), so a
  // save written before these keys existed gets them filled in the first time
  // it's touched and nothing ever reads `undefined[id]`.
  if (!unlocks.unlockedPillColors) unlocks.unlockedPillColors = {};
  if (!unlocks.unlockedEnemies) unlocks.unlockedEnemies = {};
  // Phase 10 — the two alternate routes are now EARNED rather than always
  // offered: { C:bool, D:bool }, read by core.js's isPathUnlocked and granted
  // by game.js's descend (clear the old main route -> C; clear the C route ->
  // D). Same "create it if the save predates it" treatment as everything
  // above, so an old save simply starts with both false — see the audit note:
  // players who had already used C/D must clear the main route once more.
  if (!unlocks.unlockedPaths) unlocks.unlockedPaths = { C:false, D:false };
  if (!unlocks.winsByClass) unlocks.winsByClass = {};
  // donation machine (see shop.js) — which of the 10 per-kind -1c discounts
  // have been earned; the lifetime coins-donated count itself lives in
  // unlocks.stats.donationTotal below, so its own achievements (the
  // "Donations" category) can threshold against it the same generic way
  // every other stat-based achievement already does — see bumpStat().
  if (!unlocks.donationDiscounts) unlocks.donationDiscounts = {};
  // Bestiary — per-id counters/seen-flags, kept in their own object since
  // they're keyed by enemy/object/item id rather than a single running
  // total, unlike everything in unlocks.stats below. See bumpBestiaryCount/
  // markBestiarySeen just below, and js/bestiary.js for what reads all of
  // this back out into the panel.
  if (!unlocks.bestiary) unlocks.bestiary = {};
  const b = unlocks.bestiary;
  if (!b.enemyKills) b.enemyKills = {};       // { enemyOrBossId: count } — see combat.js handleEnemyDeath
  if (!b.enemyDeaths) b.enemyDeaths = {};     // { enemyOrBossId: count } — see entities.js takeDamage + main.js's gameover handling
  if (!b.objectsSeen) b.objectsSeen = {};     // { obstacleKind: true } — set the moment a room containing one is entered, see game.js enterRoom
  if (!b.objectsDestroyed) b.objectsDestroyed = {}; // { obstacleKind: count } — see combat.js damageObstacleHit/explodeAt/destroyAllObstacles
  if (!b.seenItems) b.seenItems = {};         // { itemId: true } — see items.js applyItemToPlayer
  if (!b.seenTrinkets) b.seenTrinkets = {};   // { trinketId: true } — see items.js equipTrinket
  if (!b.seenFamiliars) b.seenFamiliars = {}; // { familiarId: true } — see items.js addFamiliar
  if (!b.seenStars) b.seenStars = {};         // { starId: true } — see combat.js grantPickupEffect's 'star' case
  if (!b.seenPills) b.seenPills = {};         // { colorId: true } — see combat.js grantPickupEffect's 'pill' case
  if (!b.seenPickupKinds) b.seenPickupKinds = {}; // { pickupKind: true } — see combat.js grantPickupEffect
  if (!b.seenRoomTypes) b.seenRoomTypes = {}; // { roomType: true } — set on first entry, see game.js enterRoom
  if (!b.seenStages) b.seenStages = {}; // { stageId: true } — set on floor start (main path only), see game.js startFloor
  // Phase 8a — bestiary tiers. The eight buckets above are boolean "ever seen"
  // sets, which can't feed a repeat-count ladder, so each gains a parallel
  // COUNT bucket bumped from the same markBestiarySeen call. The boolean set
  // stays authoritative for "discovered" (panel rows, breadth achievements);
  // these are purely the tier ladders' input. objectsSeen deliberately gets no
  // counter — objectsDestroyed already covers the tiered case for objects.
  if (!b.itemsCollectedCount) b.itemsCollectedCount = {};           // { itemId: count } — mirrors seenItems
  if (!b.trinketsEquippedCount) b.trinketsEquippedCount = {};       // { trinketId: count } — mirrors seenTrinkets
  if (!b.familiarsCollectedCount) b.familiarsCollectedCount = {};   // { familiarId: count } — mirrors seenFamiliars
  if (!b.starsUsedCount) b.starsUsedCount = {};                     // { starId: count } — mirrors seenStars
  if (!b.pillsDrunkCount) b.pillsDrunkCount = {};                   // { colorId: count } — mirrors seenPills
  if (!b.pickupKindsCollectedCount) b.pickupKindsCollectedCount = {}; // { pickupKind: count } — mirrors seenPickupKinds
  if (!b.roomTypesVisitedCount) b.roomTypesVisitedCount = {};       // { roomType: count } — mirrors seenRoomTypes
  if (!b.stagesVisitedCount) b.stagesVisitedCount = {};             // { stageId: count } — mirrors seenStages
  // { 'category/id': highestTierPaidOut 0-4 } — the ledger that keeps a tier
  // from paying its skill point twice. See checkBestiaryTierUp below.
  if (!b.tiersAwarded) b.tiersAwarded = {};
  // Phase 8a — the skill-point wallet the tiers feed. Nothing spends it yet;
  // the skill tree panel itself is a later phase. `spent`/`unlockedNodes` are
  // reserved now so the save shape doesn't need another migration later.
  if (!unlocks.skillTree) unlocks.skillTree = { points: 0, spent: {}, unlockedNodes: {} };
  if (unlocks.skillTree.points == null) unlocks.skillTree.points = 0;
  if (!unlocks.skillTree.spent) unlocks.skillTree.spent = {};
  if (!unlocks.skillTree.unlockedNodes) unlocks.skillTree.unlockedNodes = {};
  // Lifetime total ever earned (never decremented by spending OR by
  // sellSkillNode's refund — a refund gives `points` back, not a fresh
  // earn) — purely a "how far have I come" stat surfaced in the skill tree
  // panel's summary line. Older saves get it backfilled once, seeded from
  // `points + sum(spent)` so it isn't just 0 for anyone who already had a
  // wallet before this counter existed.
  if (unlocks.skillTree.lifetimeEarned == null) {
    let spentTotal = 0;
    for (const k in unlocks.skillTree.spent) spentTotal += unlocks.skillTree.spent[k] || 0;
    unlocks.skillTree.lifetimeEarned = unlocks.skillTree.points + spentTotal;
  }
  // merge onto any existing stats blob so older saves pick up new counters
  // without losing progress on the ones they already had
  const statDefaults = {
    secretRoomsFound:0, chestsOpened:0, rocksBombed:0, coinsSpent:0, cursedChestsOpened:0,
    enemiesKilled:0, bossesKilled:0, coinsCollected:0, goldChestsOpened:0, stoneChestsOpened:0,
    obstaclesDestroyed:0, bombsPlaced:0, shotsFired:0, critsLanded:0, itemsCollected:0,
    trinketsEquipped:0, familiarsCollected:0, deaths:0, wins:0, roomsCleared:0,
    shopPurchases:0, activeItemUses:0, meleeKills:0, rangedKills:0, donationTotal:0, pillsUsed:0, keysUsed:0, starsUsed:0,
    // how many of the every-25c-donated skill points have already been paid
    // out — see awardDonationSkillPoints below. Kept as its own counter
    // (rather than re-deriving from donationTotal each time) so a future
    // change to the interval can't silently re-pay or skip old progress.
    donationSkillPointsAwarded:0,
    // new-room-type / new-obstacle counters (see game.js's enterRoom, combat.js's
    // triggerSacrificeSpike/tryUnlockKeyDoor/checkRoomCleared/handleEnemyDeath/
    // explodeAt/damageObstacleHit) — thresholds for the 20 achievements below
    petshopsVisited:0, curseRoomsVisited:0, sacrificeSpikesTriggered:0, vaultsOpened:0,
    challengeRoomsCompleted:0, crystalRoomsVisited:0, sombraDealsTaken:0, swarmerdnbKilled:0,
    turretsDestroyed:0, bombBarrelsDetonated:0,
    // per-room-type first-visit counters bumped from the same enterRoom
    // first-visit block as petshopsVisited/curseRoomsVisited above — these
    // drive the 11 Compass (teleport_*) star achievements in section 8c
    treasureRoomsVisited:0, shopRoomsVisited:0, secretRoomsVisited:0,
    sacrificeRoomsVisited:0, vaultRoomsVisited:0, challengeRoomsVisited:0,
    sombraRoomsVisited:0, shrineRoomsVisited:0,
    // Phase 4 overhaul — Arcade room (see dungeon.js's attachSpecial,
    // combat.js's coinLockedRoomFor/tryUnlockCoinDoor). Same first-visit
    // chain as the counters above.
    arcadeRoomsVisited:0,
    // Star Rooms (game.js enterRoom, same first-visit chain as the three
    // above) and the shop's Reroll Altar (shop.js tryRerollAltar, bumped
    // only once the coin cost is actually paid)
    starRoomsVisited:0, rerollAltarUses:0,
    // C-branch (the 3C-10C drowned path, game.js's floorPath === 'C').
    // cBranchFloorsVisited is bumped once per C floor ENTERED, from
    // startFloor's own `floorPath === 'C'` block — startFloor runs exactly
    // once per floor per run and descend only ever moves floorNum forward,
    // so a run can contribute at most 8 (3C..10C) and walking back into an
    // already-cleared room cannot bump it again.
    // cBranchRunsCompleted is bumped once per WON C-branch run, from the
    // single `floorNum >= C_LAST_FLOORNUM` win branch in descend() — i.e.
    // Kirk DNB is dead and the stairs on 10C were taken.
    cBranchFloorsVisited:0, cBranchRunsCompleted:0,
    // D-branch (the 4D-10D starlit path, game.js's floorPath === 'D', Phase
    // 7a). Exact mirror of the two C counters above and bumped from the exact
    // same two places: dBranchFloorsVisited once per D floor ENTERED (a run can
    // contribute at most 7, 4D..10D), dBranchRunsCompleted once per WON D run,
    // from the single `floorNum >= D_LAST_FLOORNUM` win branch in descend().
    dBranchFloorsVisited:0, dBranchRunsCompleted:0,
    // Windigo's unlock counter — see combat.js applyOnHitStatuses / freezeAllEnemies
    enemiesFrozen:0,
    // Gargoyle's unlock counter — see combat.js applyOnHitStatuses / attackStyles.js markedForDeath
    enemiesMarkedVulnerable:0,
    // Phase 5a batch — unlock counters for Changedling/Changeling Queen/
    // Filly/Engineer Pony, see combat.js updateFireRingAttack/
    // updateChangelingSummons/applyOnHitStatuses/updateTurretBuild
    fireRingHits:0, changelingMinionsSummoned:0, enemiesCharmed:0, turretsBuilt:0,
    // Phase 5b — new lifetime counters. ecosystemSetActivations: one-shot
    // per run the first time Synergy A (Ecosystem Set) goes active, see
    // items.js recalcPlayerStats. arcadeFilliesFed/arcadeMachinesUsed: every
    // successful feed/use, see shop.js feedArcadeFilly/useArcadeMachine.
    // arcadeFillyCapstonesReached: every time any individual filly's
    // fedCount crosses its own capstone threshold and filly.done flips true
    // (feedArcadeFilly, all four fillies that have a capstone — battery does
    // not).
    ecosystemSetActivations:0, arcadeFilliesFed:0, arcadeMachinesUsed:0, arcadeFillyCapstonesReached:0,
    // lifetime meta-stats for the main menu's summary line — see main.js
    runsStarted:0, totalPlaytime:0,
    // "best of" records (max/min-style, not additive — see setStatMax/
    // setStatMin below) — deepest floor ever reached and the fastest a run
    // has ever been won in, shown on the main menu and flagged with a
    // "New personal best!" toast the moment either one improves
    deepestFloor:0, fastestWinSeconds:null,
  };
  unlocks.stats = Object.assign({}, statDefaults, unlocks.stats || {});
  if (unlocks.donationTotal) { // one-time migration off the old top-level field
    unlocks.stats.donationTotal = Math.max(unlocks.stats.donationTotal, unlocks.donationTotal);
    delete unlocks.donationTotal;
  }
  return unlocks;
}

function isItemUnlocked(itemId){
  return !!currentUnlocks().unlockedItems[itemId]; // per-run snapshot while a run is live — see currentUnlocks()
}

// idempotent: safe to call every time the condition is true, not just once
function unlockAchievement(achId, game){
  const def = ACHIEVEMENTS_BY_ID[achId];
  if (!def) return;
  const unlocks = ensureUnlockShape(loadUnlocks());
  if (unlocks.achievements[achId]) return; // already earned
  unlocks.achievements[achId] = true;

  let rewardItem = null;
  let rewardTrinket = null;
  let rewardFamiliar = null;
  let rewardStar = null;
  let rewardPillColor = null;
  let rewardEnemy = null;
  if (def.classId) {
    unlocks[def.classId] = true;
  } else if (def.itemId) {
    unlocks.unlockedItems[def.itemId] = true;
    rewardItem = ITEMS[def.itemId];
  } else if (def.pickupKind) {
    unlocks.unlockedPickups[def.pickupKind] = true;
  } else if (def.trinketId) {
    unlocks.unlockedTrinkets[def.trinketId] = true;
    rewardTrinket = TRINKETS[def.trinketId];
  } else if (def.familiarId) {
    unlocks.unlockedFamiliars[def.familiarId] = true;
    rewardFamiliar = FAMILIAR_TYPES[def.familiarId];
  } else if (def.starId) {
    unlocks.unlockedStars[def.starId] = true;
    rewardStar = STAR_TYPES[def.starId];
  } else if (def.pillColorId) {
    unlocks.unlockedPillColors[def.pillColorId] = true;
    rewardPillColor = PILL_COLORS_BY_ID[def.pillColorId];
  } else if (def.enemyId) {
    unlocks.unlockedEnemies[def.enemyId] = true;
    rewardEnemy = ENEMY_TYPES[def.enemyId];
  } else if (def.shopDiscount) {
    unlocks.donationDiscounts[def.shopDiscount] = true;
  } else if (def.skillPoints) {
    // flat skill-point bonus — used by the four donation milestones past
    // 1000c (2000/3000/4000/5000), once every -1c shop discount is already
    // spoken for. Separate from (and on top of) the every-25c drip in
    // awardDonationSkillPoints below.
    unlocks.skillTree.points += def.skillPoints;
    unlocks.skillTree.lifetimeEarned = (unlocks.skillTree.lifetimeEarned || 0) + def.skillPoints;
  }
  saveUnlocks(unlocks);

  if (def.classId) {
    const cls = CLASSES[def.classId];
    Sound.play('unlock');
    toast('New class unlocked: ' + (cls ? cls.name : def.classId) + '!', false, 'good');
  } else {
    Sound.play('achievement');
    // the reward's own icon reads faster than its name alone at a glance —
    // e.g. "🔩" before "unlocked trinket "Rusty Bolt"" instead of just text
    // pill colors and enemies carry no `icon` field of their own (they're a
    // swatch and a sprite, not an inventory entry), so they get a fixed
    // stand-in glyph rather than an empty slot in the toast.
    const rewardIcon = rewardItem ? rewardItem.icon : rewardTrinket ? rewardTrinket.icon : rewardFamiliar ? rewardFamiliar.icon : rewardStar ? rewardStar.icon
      : rewardPillColor ? '💊' : rewardEnemy ? '👾' : def.skillPoints ? '💠' : '';
    const rewardLabel = rewardItem ? ('"' + rewardItem.name + '"')
      : rewardTrinket ? ('trinket "' + rewardTrinket.name + '"')
      : rewardFamiliar ? ('familiar "' + rewardFamiliar.name + '"')
      : rewardStar ? ('star "' + rewardStar.name + '"')
      : rewardPillColor ? ('pill color "' + rewardPillColor.name + '"')
      : rewardEnemy ? ('enemy "' + rewardEnemy.name + '"')
      : def.pickupKind ? PICKUP_KIND_LABELS[def.pickupKind]
      : def.shopDiscount ? (SHOP_KIND_LABELS[def.shopDiscount] + ' price -1c, permanently')
      : def.skillPoints ? (def.skillPoints + ' skill point' + (def.skillPoints === 1 ? '' : 's')) : null;
    toast('🏆 Achievement: ' + def.name + (rewardLabel ? ' — unlocked ' + (rewardIcon ? rewardIcon + ' ' : '') + rewardLabel : ''), true, 'good');
  }

  // NOTE: the reward is deliberately NOT handed to the player in the current
  // run — it's unlocked for every run from NOW ON. The run in progress keeps
  // rolling against the unlock snapshot it took at startRun (see
  // currentUnlocks() at the top of this file), so a mid-run unlock can't
  // appear in this run's spawns either.

  // Completionist: once a superboss kill lands, check whether that finishes
  // the whole set of superbosses (all 11) for this specific character
  if (def.category === 'Superbosses') {
    const classId = achId.slice(achId.lastIndexOf('_') + 1);
    const bossIds = Object.keys(SUPERBOSSES);
    const gotAll = bossIds.every(b => unlocks.achievements['sb_' + b + '_' + classId]);
    if (gotAll) unlockAchievement('completionist_' + classId, game);
  }
}

// lifetime counters for the threshold-based misc achievements
// Phase 10 — grant an alternate route (see core.js's isPathUnlocked).
// Idempotent and safe to call every time the condition holds. Writes straight
// to the live save and deliberately does NOT touch the run snapshot, so the
// newly opened path first appears on the player's NEXT run, matching how
// every other mid-run unlock behaves (see beginRunUnlocks/endRunUnlocks).
// `game` is optional and only used for the toast.
function unlockPath(path, game){
  const unlocks = ensureUnlockShape(loadUnlocks());
  if (unlocks.unlockedPaths[path]) return; // already earned
  unlocks.unlockedPaths[path] = true;
  saveUnlocks(unlocks);
  if (game && game.toast) game.toast('🗝️ A new path has opened — look for its gate on your next run!');
}

function bumpStat(key, amount, game){
  const unlocks = ensureUnlockShape(loadUnlocks());
  unlocks.stats[key] = (unlocks.stats[key] || 0) + amount;
  saveUnlocks(unlocks);
  // index lookup instead of scanning every achievement — see indexAchievement.
  // Same result: the bucket holds exactly the defs whose statKey === key.
  const watchers = _ACHV_BY_STATKEY.get(key);
  if (watchers) for (const a of watchers) {
    if (unlocks.stats[key] >= a.threshold) unlockAchievement(a.id, game);
  }
}

// Every 25c ever donated (see shop.js's DONATION_SKILL_POINT_INTERVAL) pays
// 1 skill point, independent of and on top of the "Donations" achievement
// ladder above. Idempotent: derives how many intervals SHOULD have been paid
// from the current donationTotal and only pays the difference, tracked in
// unlocks.stats.donationSkillPointsAwarded so a re-entrant call (or a save
// re-load) can never double-pay. Called from shop.js's tryDonateMachine
// right after bumpStat('donationTotal', ...). `game` is optional, used only
// for the toast.
function awardDonationSkillPoints(game){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const eligible = Math.floor((unlocks.stats.donationTotal || 0) / DONATION_SKILL_POINT_INTERVAL);
  const already = unlocks.stats.donationSkillPointsAwarded || 0;
  const gained = eligible - already;
  if (gained <= 0) return;
  unlocks.stats.donationSkillPointsAwarded = eligible;
  unlocks.skillTree.points += gained;
  unlocks.skillTree.lifetimeEarned = (unlocks.skillTree.lifetimeEarned || 0) + gained;
  saveUnlocks(unlocks);
  Sound.play('skillPointGain');
  if (game && game.toast) game.toast('💠 +' + gained + ' skill point' + (gained === 1 ? '' : 's') + ' from donating!');
}

// "best of" lifetime records — unlike bumpStat, these only ever move in one
// direction and don't add up. Returns true the moment a new record is set,
// so callers (game.js's descend/main.js's win handling) can flash a "New
// personal best!" toast exactly when it actually happens.
function setStatMax(key, value){
  const unlocks = ensureUnlockShape(loadUnlocks());
  if (value > (unlocks.stats[key] || 0)) { unlocks.stats[key] = value; saveUnlocks(unlocks); return true; }
  return false;
}
function setStatMin(key, value){
  const unlocks = ensureUnlockShape(loadUnlocks());
  if (unlocks.stats[key] == null || value < unlocks.stats[key]) { unlocks.stats[key] = value; saveUnlocks(unlocks); return true; }
  return false;
}

/* ---------------------------------------------------------------
   Bestiary tracking — per-id counters/seen-flags feeding js/bestiary.js's
   panel. Kept separate from bumpStat's single running totals above since
   these are keyed by enemy/object/item id, not one flat counter.
   --------------------------------------------------------------- */
// returns true the moment `id` is recorded in `section` for the very first
// time — combat.js's handleEnemyDeath uses this to fire a one-off "New
// Bestiary entry" toast on an enemy's first kill, without re-toasting on
// every kill after
/* Phase 8a — bestiary tiers.

   Every per-id count feeds a 4-rung ladder (see achievements/bestiary-tiers.js).
   The moment a count crosses a rung it pays 1 skill point per rung crossed into
   unlocks.skillTree.points, recorded in unlocks.bestiary.tiersAwarded so the
   same rung can never pay twice. Nothing spends those points yet — the skill
   tree panel is a later phase.

   Which boolean-seen sections get a parallel count bucket + a tier category.
   Sections absent from this table (objectsSeen — no natural repeat-count
   meaning) stay plain booleans and earn no tier. enemyDeaths likewise has no
   entry in the count-section table below: it measures how often something
   killed YOU, which is not player progress. */
const _BESTIARY_SEEN_TIER_MAP = {
  seenItems:       { category:'item',     countBucket:'itemsCollectedCount' },
  seenTrinkets:    { category:'trinket',  countBucket:'trinketsEquippedCount' },
  seenFamiliars:   { category:'familiar', countBucket:'familiarsCollectedCount' },
  seenStars:       { category:'star',     countBucket:'starsUsedCount' },
  seenPills:       { category:'pill',     countBucket:'pillsDrunkCount' },
  seenPickupKinds: { category:'pickup',   countBucket:'pickupKindsCollectedCount' },
  seenRoomTypes:   { category:'roomtype', countBucket:'roomTypesVisitedCount' },
  seenStages:      { category:'stage',    countBucket:'stagesVisitedCount' },
};

// enemyKills is one bucket holding three tier categories — which one an id
// belongs to is decided by the data table it was declared in.
function bestiaryTierCategoryForEnemy(id){
  if (typeof SUPERBOSSES !== 'undefined' && SUPERBOSSES[id]) return 'superboss';
  if (typeof BOSS_TYPES !== 'undefined' && BOSS_TYPES[id]) return 'boss';
  return 'enemy';
}

// Mutates `unlocks` only — the caller is responsible for the single
// saveUnlocks() that persists it. Returns the newly reached tier (1-4), or 0
// if this call didn't cross a rung. A jump that clears several rungs at once
// (e.g. a save imported past a threshold) pays for all of them.
function checkBestiaryTierUp(unlocks, category, id, count){
  const key = category + '/' + id;
  const prevTier = unlocks.bestiary.tiersAwarded[key] || 0;
  const newTier = bestiaryTierFor(category, count);
  if (newTier > prevTier) {
    unlocks.bestiary.tiersAwarded[key] = newTier;
    const gained = newTier - prevTier;
    unlocks.skillTree.points += gained;
    unlocks.skillTree.lifetimeEarned = (unlocks.skillTree.lifetimeEarned || 0) + gained;
    return newTier;
  }
  return 0;
}

function bumpBestiaryCount(section, id, amount, game){
  if (!id) return false;
  const unlocks = ensureUnlockShape(loadUnlocks());
  const bucket = unlocks.bestiary[section];
  const wasNew = !bucket[id];
  bucket[id] = (bucket[id] || 0) + amount;
  // tier pass BEFORE the single save below, so points ride along with it
  if (section === 'enemyKills') checkBestiaryTierUp(unlocks, bestiaryTierCategoryForEnemy(id), id, bucket[id]);
  else if (section === 'objectsDestroyed') checkBestiaryTierUp(unlocks, 'object', id, bucket[id]);
  saveUnlocks(unlocks);
  checkBestiaryAchievements(section, id, bucket, game, true);
  return wasNew;
}
// idempotent for the seen-flag itself — cheap to call on every pickup/
// encounter, not just the first. The parallel count bucket (Phase 8a) DOES
// move on every call, since that's what the tier ladder thresholds against.
function markBestiarySeen(section, id, game){
  if (!id) return;
  const unlocks = ensureUnlockShape(loadUnlocks());
  const bucket = unlocks.bestiary[section];
  const wasNew = !bucket[id];
  if (wasNew) bucket[id] = true;
  const tierInfo = _BESTIARY_SEEN_TIER_MAP[section];
  if (tierInfo) {
    const counts = unlocks.bestiary[tierInfo.countBucket];
    counts[id] = (counts[id] || 0) + 1;
    checkBestiaryTierUp(unlocks, tierInfo.category, id, counts[id]);
  }
  if (wasNew || tierInfo) saveUnlocks(unlocks); // exactly one save per call
  // only the first time: nothing else can move a section's distinct count
  if (wasNew) checkBestiaryAchievements(section, id, bucket, game, false);
}

// main.js's module-level `game`, for the bestiary call sites that don't thread
// one through (combat.js/game.js/items.js all call the two functions above
// without it). Without this a bestiary achievement would still unlock and
// still be permanently added to the pools, it just wouldn't hand the reward
// over during the run that earned it, unlike every statKey achievement.
// achievements.js loads before main.js, hence the TDZ guard.
function activeGame(){
  try { return typeof game !== 'undefined' ? game : null; } catch (e) { return null; }
}

// The bestiary equivalent of bumpStat's threshold sweep — two predicate kinds:
//   bestiarySection + bestiaryId + threshold   → "kill 25 of THIS enemy"
//   bestiarySection + distinctThreshold        → "have seen 50 DISTINCT entries"
// `checkCount` is false for markBestiarySeen, whose buckets hold `true` rather
// than a running count, so a per-id count predicate is meaningless there.
function checkBestiaryAchievements(section, id, bucket, game, checkCount){
  const g = game || activeGame();
  if (checkCount) {
    const watchers = _ACHV_BY_BESTIARY_ID.get(section + '/' + id);
    if (watchers) {
      const count = bucket[id] || 0;
      for (const a of watchers) if (count >= a.threshold) unlockAchievement(a.id, g);
    }
  }
  const breadth = _ACHV_BY_BESTIARY_SECTION.get(section);
  if (breadth) { // Object.keys only when this section actually has a breadth achievement
    const distinct = Object.keys(bucket).length;
    for (const a of breadth) if (distinct >= a.distinctThreshold) unlockAchievement(a.id, g);
  }
}

// wins need a set of *which* characters have won, not just a count — see
// the "Triple Threat" achievement — so this handles both that and the
// simple "win once" achievement in one place
function recordWin(game, classId){
  bumpStat('wins', 1, game);
  const unlocks = ensureUnlockShape(loadUnlocks());
  unlocks.winsByClass[classId] = true;
  saveUnlocks(unlocks);
  if (Object.keys(unlocks.winsByClass).length >= 3) unlockAchievement('triplethreat', game);
  if (Object.keys(unlocks.winsByClass).length >= 8) unlockAchievement('challenge_wins_8classes', game);
  if (Object.keys(unlocks.winsByClass).length >= 20) unlockAchievement('challenge_wins_allclasses', game); // 20 = every key in data.js's CLASSES
  if (game.player.redMax <= 1) unlockAchievement('onehearted', game); // Witheredapple — see data.js
  if (game.player.redMax <= 1 && !game.player.tookDamageThisRun) unlockAchievement('challenge_onehearted_flawless', game);
  // Phase 5b — bespoke trigger (Predicate D, no statKey), same shape as the
  // two checks just above: won the run and never once stepped into a shop
  // room (entities.js's player.visitedShopThisRun, set by game.js enterRoom).
  if (!game.player.visitedShopThisRun) unlockAchievement('challenge_frugal_run', game);
}

/* ---------------------------------------------------------------
   The category strings the panel renders, in display order. This is the
   ONLY place categories are enumerated anywhere in the codebase —
   index.html's #achievementsFilter is All/Unlocked/Locked only, it has
   no per-category buttons — so a new `category:` value just needs a
   line here. (And even without one it still shows up: buildAchievementsPanel
   appends any unlisted category it finds in the index after these.)

   Characters/Superbosses/Completionist/Donations/Miscellaneous are the
   original five; Exploration/Collection/Challenge are reserved for the
   achievement expansion and are empty until then — an empty category
   renders nothing, since the panel skips any section with no rows to show.

   'Slayer' was removed entirely (its trophy-only rewards deleted, every
   real reward migrated 1:1 into 'Mastery' — see defs-mastery.js and
   feature-research/phase9-megaupdates/audit-remove-slayer.md); 'Mastery'
   is no longer reserved-and-empty, it now holds those migrated entries.
   --------------------------------------------------------------- */
const ACHIEVEMENT_CATEGORY_ORDER = [
  'Characters', 'Superbosses', 'Completionist',
  'Mastery', 'Exploration', 'Collection', 'Challenge',
  'Donations', 'Miscellaneous',
];

// which rows the panel currently shows — toggled by the All/Unlocked/Locked
// filter buttons in index.html's achievementsScreen (wired just below)
let _achvFilter = 'all';

function buildAchievementsPanel(){
  const wrap = document.getElementById('achievementsList');
  if (!wrap) return;
  wrap.innerHTML = '';
  const unlocks = ensureUnlockShape(loadUnlocks());

  const totalDone = ACHIEVEMENTS.filter(a => unlocks.achievements[a.id]).length;
  const summaryEl = document.getElementById('achievementsSummary');
  if (summaryEl) summaryEl.textContent = totalDone + ' / ' + ACHIEVEMENTS.length + ' unlocked';

  // Display order. Anything whose category isn't listed here still gets shown,
  // in its own section after these — see the leftovers pass just below, which
  // is what keeps a typo'd or brand-new category from silently vanishing from
  // the panel entirely.
  const categories = ACHIEVEMENT_CATEGORY_ORDER.slice();
  for (const cat of _ACHV_BY_CATEGORY.keys()) if (categories.indexOf(cat) === -1) categories.push(cat);

  // memo for the distinct-breadth progress lines below — one Object.keys per
  // bestiary section per panel build instead of one per row
  const distinctCounts = {};
  const distinctSeen = section => {
    if (distinctCounts[section] == null) distinctCounts[section] = Object.keys(unlocks.bestiary[section] || {}).length;
    return distinctCounts[section];
  };

  // whole panel is assembled off-DOM and attached in one go — at ~850 rows the
  // old per-header live appendChild made the browser lay the list out again
  // partway through every filter click
  const frag = document.createDocumentFragment();
  for (const cat of categories) {
    const inCat = _ACHV_BY_CATEGORY.get(cat) || []; // pre-grouped, see indexAchievement
    const catDone = inCat.filter(a => unlocks.achievements[a.id]).length;
    const shown = inCat.filter(a => {
      const done = !!unlocks.achievements[a.id];
      return _achvFilter === 'all' || (_achvFilter === 'unlocked' && done) || (_achvFilter === 'locked' && !done);
    });
    if (!shown.length) continue; // e.g. "Unlocked only" on a category with nothing earned yet
    const h = document.createElement('h3');
    h.className = 'achv-category';
    h.textContent = cat + ' (' + catDone + '/' + inCat.length + ')';
    frag.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'achv-grid';
    for (const a of shown) {
      const done = !!unlocks.achievements[a.id];
      const row = document.createElement('div');
      row.className = 'achv-row' + (done ? ' done' : '');
      const icon = document.createElement('div');
      icon.className = 'achv-icon';
      icon.textContent = done ? a.icon : '❓';
      row.appendChild(icon);
      const text = document.createElement('div');
      text.className = 'achv-text';
      const name = document.createElement('div');
      name.className = 'achv-name';
      name.textContent = done ? a.name : '???';
      text.appendChild(name);
      const desc = document.createElement('div');
      desc.className = 'achv-desc';
      // stat-based achievements not yet earned show live progress
      // ("142 / 300") instead of a flat "Not yet earned." — a lot less
      // opaque about how close you actually are
      if (done) desc.textContent = a.desc;
      else if (a.statKey) desc.textContent = Util.formatNum(unlocks.stats[a.statKey] || 0) + ' / ' + Util.formatNum(a.threshold);
      // bestiary-backed achievements get the same live progress treatment —
      // per-id counts ("18 / 25 Cryptslingers") and distinct-breadth counts
      // ("34 / 50 items seen"). See checkBestiaryAchievements.
      else if (a.bestiarySection && a.bestiaryId != null && a.threshold != null) {
        const b = unlocks.bestiary[a.bestiarySection] || {};
        desc.textContent = Util.formatNum(b[a.bestiaryId] || 0) + ' / ' + Util.formatNum(a.threshold);
      } else if (a.bestiarySection && a.distinctThreshold != null) {
        desc.textContent = Util.formatNum(distinctSeen(a.bestiarySection)) + ' / ' + Util.formatNum(a.distinctThreshold);
      } else desc.textContent = 'Not yet earned.';
      text.appendChild(desc);
      if (a.classId || a.itemId || a.pickupKind || a.trinketId || a.familiarId || a.starId || a.shopDiscount || a.skillPoints) {
        const rew = document.createElement('div');
        rew.className = 'achv-reward';
        if (a.classId) {
          const cls = CLASSES[a.classId];
          rew.textContent = 'Unlocks: ' + (done ? (cls ? cls.name : a.classId) : 'a new character');
        } else if (a.itemId) {
          const item = ITEMS[a.itemId];
          rew.textContent = done ? ('Reward: ' + item.icon + ' ' + item.name) : 'Reward: an item';
        } else if (a.trinketId) {
          const trinket = TRINKETS[a.trinketId];
          rew.textContent = done ? ('Reward: ' + trinket.icon + ' ' + trinket.name + ' (trinket)') : 'Reward: a trinket';
        } else if (a.familiarId) {
          const familiar = FAMILIAR_TYPES[a.familiarId];
          rew.textContent = done ? ('Reward: ' + familiar.icon + ' ' + familiar.name + ' (familiar)') : 'Reward: a familiar';
        } else if (a.starId) {
          const star = STAR_TYPES[a.starId];
          rew.textContent = done ? ('Reward: ' + star.icon + ' ' + star.name + ' (star)') : 'Reward: a star';
        } else if (a.shopDiscount) {
          rew.textContent = done ? ('Reward: ' + SHOP_KIND_LABELS[a.shopDiscount] + ' price -1c') : 'Reward: a permanent shop discount';
        } else if (a.skillPoints) {
          rew.textContent = 'Reward: 💠 ' + a.skillPoints + ' skill point' + (a.skillPoints === 1 ? '' : 's');
        } else {
          rew.textContent = done ? ('Reward: ' + PICKUP_KIND_LABELS[a.pickupKind] + ' pickups') : 'Reward: a special pickup';
        }
        text.appendChild(rew);
      }
      row.appendChild(text);
      grid.appendChild(row);
    }
    frag.appendChild(grid);
  }
  wrap.appendChild(frag);
}

// All / Unlocked / Locked filter row — see index.html's achievementsScreen
for (const btn of document.querySelectorAll('#achievementsFilter button')) {
  btn.addEventListener('click', () => {
    _achvFilter = btn.dataset.filter;
    for (const b of document.querySelectorAll('#achievementsFilter button')) b.classList.toggle('active', b === btn);
    Sound.play('uiClick');
    buildAchievementsPanel();
  });
}

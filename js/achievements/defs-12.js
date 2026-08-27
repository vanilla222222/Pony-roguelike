'use strict';
// achievements/defs-12.js — Phase 7h (cont.): The Void Between, PART 2
// (floorKeys '9D'/'10D' + the superboss `singularity`, D-branch region 3's
// second half) achievement batch — the LAST of the 4 sequential sub-batches
// covering the D-branch's ~800-achievement allocation, and the batch that
// closes out Phase 7h. See feature-research/phase7h-dbranch-achievements/
// audit-voidbetween-2.md for the full design rationale, reward-economy
// findings, and verification output.
//
// Reward-economy summary: shopDiscount/pillColorId/enemyId are re-confirmed
// fully exhausted, unchanged from defs-7f/7g/7h(Observatory/Orrery/Void
// Between PART 1)'s own findings (12/12 shop kinds, 40/40 pill colors, 60/60
// locked enemies). Verified before writing: no existing achievement
// references any of '9D''s/'10D''s 66 enemy ids or 'singularity' (grep across
// js/achievements/defs-*.js came back empty), so no second-ladder workaround
// is needed anywhere in this file. Shape follows defs-10.js's Orrery batch
// (2 floorKeys, 66 enemies, 1 superboss = 180 achievements), NOT defs-11.js's
// smaller single-floorKey PART 1 shape: the BULK is a 2-tier Slayer ladder
// (10/40) over the FULL 66-enemy roster, with a 3rd tier (threshold 100)
// added for 12 flagship enemies (6 per floorKey, one per distinct AI behavior
// family: splitter/summoner/shielder/sniper/teleporter/ambusher) granting a
// unique capstone reward instead of another trophy. Every non-capstone rung
// mints a brand-new 'vbtrophy2_' trophy passive (locked:true, unlockedBy) —
// deliberately a DISTINCT prefix from PART 1's 'vbtrophy_' so the two
// companion batches can never collide — cycling the same five +1-stat
// archetypes every prior batch used (Luck / speed / melee / ranged /
// recharge). Void-Between-themed and pushed to the region's end state (guttering
// embers and dying light on '9D', the event horizon and total collapse on
// '10D', accent #9ab8ff).

/* ============================================================
   SLAYER — bestiary kill-count ladders over the FULL '9D'+'10D' roster
   ============================================================
   2-tier ladders (10/40) for all 66 enemies (33 per floorKey). 12 flagship
   enemies (6 per floorKey, one per distinct AI behavior: splitter/summoner/
   shielder/sniper/teleporter/ambusher) get a 3rd tier (threshold 100)
   granting a unique capstone reward instead of another trophy passive.
   ============================================================ */

// ---- 9D roster (33) ----

































// ---- 10D roster (33) ----


































/* ============================================================
   CHALLENGE — hand-wired Predicate D feats for the superboss `singularity`
   and the 9D/10D floors
   ============================================================
   Every id below has exactly one unlockAchievement() call site:
     challenge_voidbetween2_flawless -> game.js onBossDefeated(), new
       singularity block mirroring the existing astrolabe/orrery blocks,
       reusing player.tookDamageThisBossRoom — no new stat.
     challenge_voidbetween2_floor_nodamage -> same block, reusing
       player.tookDamageThisFloor.
     challenge_voidbetween2_onehearted -> same block, reusing player.redMax.
     challenge_voidbetween2_speedkill -> same block, reusing game.runElapsed.
     challenge_voidbetween2_frugal -> same block, reusing
       player.visitedShopThisRun.
     challenge_voidbetween2_untouched_run -> same block, reusing
       player.tookDamageThisRun.
     challenge_voidbetween2_9d_speedrun / _10d_speedrun -> game.js
       startFloor(), beside the existing floorPath==='D' block's
       floorNum===5/6/7 cases — exact same shape as every prior D-branch
       batch's speedrun checkpoints.
   ============================================================ */

addAchievement({ id:'challenge_voidbetween2_flawless', name:'Not a Star Left Burning', icon:'🌌',
  desc:'Defeat The Singularity without taking damage in its boss room.', category:'Challenge', trinketId:'collapsedmoment' });
addAchievement({ id:'challenge_voidbetween2_floor_nodamage', name:'Untouched at the Horizon', icon:'🛡️',
  desc:'Clear all of Floor 10D without taking any damage.', category:'Challenge', itemId:'vbtrophy2_challenge_floor_nodamage' });
addAchievement({ id:'challenge_voidbetween2_onehearted', name:'One Star Left', icon:'💔',
  desc:'Defeat The Singularity with only one red heart of maximum health.', category:'Challenge', itemId:'vbtrophy2_challenge_onehearted' });
addAchievement({ id:'challenge_voidbetween2_speedkill', name:'Faster Than the Collapse', icon:'⏱️',
  desc:'Defeat The Singularity within 38 minutes of run time.', category:'Challenge', itemId:'vbtrophy2_challenge_speedkill' });
addAchievement({ id:'challenge_voidbetween2_frugal', name:'Nothing Bought at the End', icon:'👛',
  desc:'Defeat The Singularity without ever visiting a shop this run.', category:'Challenge', trinketId:'emptyeventpurse' });
addAchievement({ id:'challenge_voidbetween2_untouched_run', name:'Never Once Touched by the Dark', icon:'🕊️',
  desc:'Defeat The Singularity having taken no damage at any point this run.', category:'Challenge', familiarId:'horizonwisp' });
addAchievement({ id:'challenge_voidbetween2_9d_speedrun', name:'Racing the Last Light', icon:'⏳',
  desc:'Reach Floor 9D within 32 minutes of run time.', category:'Challenge', itemId:'emberchronometer' });
addAchievement({ id:'challenge_voidbetween2_10d_speedrun', name:'Racing the Horizon', icon:'⌚',
  desc:'Reach Floor 10D within 35 minutes of run time.', category:'Challenge', itemId:'eventchronometer' });


/* ============================================================
   EXPLORATION — per-floorKey reach milestones + first-encounter bestiary
   entries for a representative slice of both rosters
   ============================================================
   exploration_reach_9d / _10d: Predicate D, hand-wired in game.js
   startFloor() beside the existing floorPath==='D' pendingBossType chain —
   exact same shape as defs-9's/defs-10's/defs-11's own floor-reach checks
   (floorNum===3/4/5/6/7, here 8/9). Every other achievement here is
   Predicate B (bestiarySection:'enemyKills', bestiaryId, threshold:1) riding
   the same bumpBestiaryCount() call combat.js's handleEnemyDeath already
   makes on every kill — no new code for those, including
   exploration_meet_singularity (the superboss kill also flows through
   handleEnemyDeath, same as defs-9's meet_astrolabe / defs-10's meet_orrery).
   ============================================================ */

addAchievement({ id:'exploration_reach_9d', name:'The Last Light', icon:'🕯️',
  desc:'Reach Floor 9D.', category:'Exploration', itemId:'vbtrophy2_exploration_floor9d' });
addAchievement({ id:'exploration_reach_10d', name:'The Event Horizon', icon:'🌑',
  desc:'Reach Floor 10D.', category:'Exploration', itemId:'vbtrophy2_exploration_floor10d' });
addAchievement({ id:'exploration_meet_singularity', name:'First Sight: The Singularity', icon:'👁️',
  desc:'Encounter and defeat The Singularity for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'singularity', threshold:1, itemId:'vbtrophy2_exploration_meet_singularity' });

// ---- 9D first-sight slice (9 of 33) ----
addAchievement({ id:'exploration_meet_starvedhound', name:'First Sight: Starved Hound', icon:'👁️',
  desc:'Encounter and defeat the DNB Starved Hound for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'starvedhound', threshold:1, itemId:'vbtrophy2_meet_starvedhound' });
addAchievement({ id:'exploration_meet_dyingember', name:'First Sight: Dying Ember', icon:'👁️',
  desc:'Encounter and defeat the DNB Dying Ember for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'dyingember', threshold:1, itemId:'vbtrophy2_meet_dyingember' });
addAchievement({ id:'exploration_meet_fadingnova', name:'First Sight: Fading Nova', icon:'👁️',
  desc:'Encounter and defeat the DNB Fading Nova for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'fadingnova', threshold:1, itemId:'vbtrophy2_meet_fadingnova' });
addAchievement({ id:'exploration_meet_darkplate', name:'First Sight: Dark Plate', icon:'👁️',
  desc:'Encounter and defeat the DNB Dark Plate for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'darkplate', threshold:1, itemId:'vbtrophy2_meet_darkplate' });
addAchievement({ id:'exploration_meet_nullram', name:'First Sight: Null Ram', icon:'👁️',
  desc:'Encounter and defeat the DNB Null Ram for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'nullram', threshold:1, itemId:'vbtrophy2_meet_nullram' });
addAchievement({ id:'exploration_meet_lastlightturret', name:'First Sight: Last Light Turret', icon:'👁️',
  desc:'Encounter and defeat the DNB Last Light Turret for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'lastlightturret', threshold:1, itemId:'vbtrophy2_meet_lastlightturret' });
addAchievement({ id:'exploration_meet_voidleaper', name:'First Sight: Void Leaper', icon:'👁️',
  desc:'Encounter and defeat the DNB Void Leaper for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'voidleaper', threshold:1, itemId:'vbtrophy2_meet_voidleaper' });
addAchievement({ id:'exploration_meet_witherslinger', name:'First Sight: Wither Slinger', icon:'👁️',
  desc:'Encounter and defeat the DNB Wither Slinger for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'witherslinger', threshold:1, itemId:'vbtrophy2_meet_witherslinger' });
addAchievement({ id:'exploration_meet_nullmortar', name:'First Sight: Null Mortar', icon:'👁️',
  desc:'Encounter and defeat the DNB Null Mortar for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'nullmortar', threshold:1, itemId:'vbtrophy2_meet_nullmortar' });
// ---- 10D first-sight slice (9 of 33) ----
addAchievement({ id:'exploration_meet_collapsehound', name:'First Sight: Collapse Hound', icon:'👁️',
  desc:'Encounter and defeat the DNB Collapse Hound for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'collapsehound', threshold:1, itemId:'vbtrophy2_meet_collapsehound' });
addAchievement({ id:'exploration_meet_lastlightmoth', name:'First Sight: Last Light Moth', icon:'👁️',
  desc:'Encounter and defeat the DNB Last Light Moth for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'lastlightmoth', threshold:1, itemId:'vbtrophy2_meet_lastlightmoth' });
addAchievement({ id:'exploration_meet_eventspark', name:'First Sight: Event Spark', icon:'👁️',
  desc:'Encounter and defeat the DNB Event Spark for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'eventspark', threshold:1, itemId:'vbtrophy2_meet_eventspark' });
addAchievement({ id:'exploration_meet_horizonplate', name:'First Sight: Horizon Plate', icon:'👁️',
  desc:'Encounter and defeat the DNB Horizon Plate for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'horizonplate', threshold:1, itemId:'vbtrophy2_meet_horizonplate' });
addAchievement({ id:'exploration_meet_gravram', name:'First Sight: Grav Ram', icon:'👁️',
  desc:'Encounter and defeat the DNB Grav Ram for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'gravram', threshold:1, itemId:'vbtrophy2_meet_gravram' });
addAchievement({ id:'exploration_meet_collapseturret', name:'First Sight: Collapse Turret', icon:'👁️',
  desc:'Encounter and defeat the DNB Collapse Turret for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'collapseturret', threshold:1, itemId:'vbtrophy2_meet_collapseturret' });
addAchievement({ id:'exploration_meet_abyssleaper', name:'First Sight: Abyss Leaper', icon:'👁️',
  desc:'Encounter and defeat the DNB Abyss Leaper for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'abyssleaper', threshold:1, itemId:'vbtrophy2_meet_abyssleaper' });
addAchievement({ id:'exploration_meet_eventslinger', name:'First Sight: Event Slinger', icon:'👁️',
  desc:'Encounter and defeat the DNB Event Slinger for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'eventslinger', threshold:1, itemId:'vbtrophy2_meet_eventslinger' });
addAchievement({ id:'exploration_meet_gravmortar', name:'First Sight: Grav Mortar', icon:'👁️',
  desc:'Encounter and defeat the DNB Grav Mortar for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'gravmortar', threshold:1, itemId:'vbtrophy2_meet_gravmortar' });

/* ============================================================
   COLLECTION — distinct-breadth over the '9D' roster, the '10D' roster, and
   the combined Void Between PART 2 region
   ============================================================
   Same bespoke-breadth-check shape defs-9's checkObservatoryCollection /
   defs-10's checkOrreryCollection / defs-11's checkVoidBetweenCollection
   used (addTierSet's distinct:true predicate counts an entire bestiary
   section bucket, not a scoped id subset — no built-in predicate fits). One
   helper (checkVoidBetween2Collection — a DISTINCT name from PART 1's
   checkVoidBetweenCollection, which stays wired to its own '8D' roster and is
   untouched here — called from combat-2.js's handleEnemyDeath right beside
   it; see the audit for the exact call site), 7 achievements it can unlock.
   Reads the SAME unlocks.bestiary.enemyKills bucket combat.js already writes
   on every kill — no new stat, no new bestiary bucket, just a scoped count.
   ============================================================ */

const VOIDBETWEEN2_9D_ROSTER_IDS = ["starvedhound","dyingember","fadingnova","darkplate","nullram","lastlightturret","voidleaper","witherslinger","nullmortar","fainttrail","darkwatcher","dyingsatellite","nulltunneler","embermites","fadinghusk","nullcaller","emberkeeper","darkwarden","nightmarksman","nullblink","hollowstalker","nullhound","faintrunner","darkslinger","nullspark","witherwisp","darkram","faintmortar","darktunneler","nullsatellite","fadingsentinel","darkblink","nullbulwark"];
const VOIDBETWEEN2_10D_ROSTER_IDS = ["collapsehound","lastlightmoth","eventspark","horizonplate","gravram","collapseturret","abyssleaper","eventslinger","gravmortar","silenttrail","horizonwatcher","collapsesatellite","eventtunneler","collapsemites","horizonhusk","eventcaller","lastkeeper","horizonwarden","gravmarksman","eventblink","silentstalker","gravhound","collapserunner","abyssslinger","horizonspark","eventmoth","horizonram","abyssmortar","gravtunneler","eventsatellite","collapsesentinel","horizonblink","eventbulwark"];
const VOIDBETWEEN2_SUPERBOSS_IDS = ['singularity'];
// the exact set combat-2.js's handleEnemyDeath tests before bothering to call
// the checker below — 67 ids total, a tiny fraction of the enemyKills space
const VOIDBETWEEN2_WATCH_IDS = new Set(VOIDBETWEEN2_9D_ROSTER_IDS.concat(VOIDBETWEEN2_10D_ROSTER_IDS, VOIDBETWEEN2_SUPERBOSS_IDS));
function checkVoidBetween2Collection(game){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const bucket = unlocks.bestiary.enemyKills;
  const countIn = ids => ids.reduce((n, id) => n + (bucket[id] ? 1 : 0), 0);
  const d9 = countIn(VOIDBETWEEN2_9D_ROSTER_IDS), d10 = countIn(VOIDBETWEEN2_10D_ROSTER_IDS), sb = countIn(VOIDBETWEEN2_SUPERBOSS_IDS);
  if (d9 >= 11) unlockAchievement('collection_voidbetween2_9d_t1', game);
  if (d9 >= 22) unlockAchievement('collection_voidbetween2_9d_t2', game);
  if (d9 >= 33) unlockAchievement('collection_voidbetween2_9d_t3', game);
  if (d10 >= 11) unlockAchievement('collection_voidbetween2_10d_t1', game);
  if (d10 >= 22) unlockAchievement('collection_voidbetween2_10d_t2', game);
  if (d10 >= 33) unlockAchievement('collection_voidbetween2_10d_t3', game);
  if (d9 + d10 + sb >= 67) unlockAchievement('collection_voidbetween2_grand', game);
}

addAchievement({ id:'collection_voidbetween2_9d_t1', name:'Dying Light Fragments', icon:'🧩',
  desc:'Encounter and defeat 11 different kinds of Void Between foe from Floor 9D\'s regular roster.', category:'Collection', itemId:'vbtrophy2_collection_9d_t1' });
addAchievement({ id:'collection_voidbetween2_9d_t2', name:'Deep Into the Dark', icon:'🧩',
  desc:'Encounter and defeat 22 different kinds of Void Between foe from Floor 9D\'s regular roster.', category:'Collection', itemId:'vbtrophy2_collection_9d_t2' });
addAchievement({ id:'collection_voidbetween2_9d_t3', name:'The Whole Guttering Dark', icon:'🕯️',
  desc:'Encounter and defeat all 33 kinds of Void Between foe — Floor 9D\'s full regular roster.', category:'Collection', itemId:'lastlightheart' });
addAchievement({ id:'collection_voidbetween2_10d_t1', name:'Collapse Fragments', icon:'🧩',
  desc:'Encounter and defeat 11 different kinds of Void Between foe from Floor 10D\'s regular roster.', category:'Collection', itemId:'vbtrophy2_collection_10d_t1' });
addAchievement({ id:'collection_voidbetween2_10d_t2', name:'Deep Into the Horizon', icon:'🧩',
  desc:'Encounter and defeat 22 different kinds of Void Between foe from Floor 10D\'s regular roster.', category:'Collection', itemId:'vbtrophy2_collection_10d_t2' });
addAchievement({ id:'collection_voidbetween2_10d_t3', name:'The Whole Event Horizon', icon:'🌑',
  desc:'Encounter and defeat all 33 kinds of Void Between foe — Floor 10D\'s full regular roster.', category:'Collection', itemId:'eventhorizonheart' });
addAchievement({ id:'collection_voidbetween2_grand', name:'Nothing Left At All', icon:'🌌',
  desc:'Encounter and defeat all 67 foes of the Void Between\'s end — every regular enemy of Floors 9D and 10D, plus The Singularity superboss.', category:'Collection', familiarId:'singularitywisp' });

'use strict';
// achievements/defs-11.js — Phase 7h (cont.): The Void Between, PART 1
// (floorKey '8D', D-branch region 3) achievement batch — third of ~4
// sequential sub-batches covering the D-branch's ~800-achievement
// allocation. See feature-research/phase7h-dbranch-achievements/
// audit-voidbetween-1.md for the full design rationale, reward-economy
// findings, and verification output.
//
// Reward-economy summary: shopDiscount/pillColorId/enemyId are re-confirmed
// fully exhausted, unchanged from defs-7f/7g/7h(Observatory/Orrery)'s own
// findings (12/12 shop kinds, 40/40 pill colors, 60/60 locked enemies).
// Verified before writing: no existing achievement references any of '8D''s
// 33 enemy ids (grep across js/achievements/defs-*.js came back empty), so
// no second-ladder workaround is needed anywhere in this file. UNLIKE
// defs-9.js's Observatory batch and defs-10.js's Orrery batch (each 2
// floorKeys + 1 superboss, 180 achievements), '8D' is a SINGLE floorKey with
// NO superboss of its own — the region's superboss, `singularity`, sits on
// '10D' and belongs to the next sub-batch. Scaled down accordingly: the BULK
// is a 2-tier Slayer ladder (10/40) over the full 33-enemy roster, with a 3rd
// tier (threshold 100) added for 6 flagship enemies (one per distinct AI
// behavior family: splitter/summoner/shielder/sniper/teleporter/ambusher)
// granting a unique capstone reward instead of another trophy. Every
// non-capstone rung mints a brand-new 'vbtrophy_' trophy passive
// (locked:true, unlockedBy), cycling the same five +1-stat archetypes
// defs-7f/7g/7h(Observatory/Orrery) used (Luck / speed / melee / ranged /
// recharge). Void-Between-themed (cold, empty, drifting derelict wreckage,
// dying starlight, accent #9ab8ff). Challenge trades the usual
// onBossDefeated()-anchored feats for floorKey-scoped ones instead, since
// there is no boss room to anchor them to — see the Challenge section below.

/* ============================================================
   SLAYER — bestiary kill-count ladders over the FULL '8D' roster
   ============================================================
   2-tier ladders (10/40) for all 33 enemies. 6 flagship enemies (one per
   distinct AI behavior family not already showcased on a single trophy
   rung: splitter/summoner/shielder/sniper/teleporter/ambusher) get a 3rd
   tier (threshold 100) granting a unique capstone reward instead of
   another trophy.
   ============================================================ */

addTierSet({ baseId:'slayer_voidwisp', name:'Void Wisp Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'voidwisp',
  desc: n => 'Defeat ' + n + ' of the DNB Void Wisp.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_voidwisp_t1' }, { threshold:40, itemId:'vbtrophy_slayer_voidwisp_t2' } ] });

addTierSet({ baseId:'slayer_derelictmoth', name:'Derelict Moth Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'derelictmoth',
  desc: n => 'Defeat ' + n + ' of the DNB Derelict Moth.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_derelictmoth_t1' }, { threshold:40, itemId:'vbtrophy_slayer_derelictmoth_t2' } ] });

addTierSet({ baseId:'slayer_wreckspark', name:'Wreck Spark Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'wreckspark',
  desc: n => 'Defeat ' + n + ' of the DNB Wreck Spark.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_wreckspark_t1' }, { threshold:40, itemId:'vbtrophy_slayer_wreckspark_t2' } ] });

addTierSet({ baseId:'slayer_hullplate', name:'Hull Plate Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hullplate',
  desc: n => 'Defeat ' + n + ' of the DNB Hull Plate.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_hullplate_t1' }, { threshold:40, itemId:'vbtrophy_slayer_hullplate_t2' } ] });

addTierSet({ baseId:'slayer_driftram', name:'Drift Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'driftram',
  desc: n => 'Defeat ' + n + ' of the DNB Drift Ram.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_driftram_t1' }, { threshold:40, itemId:'vbtrophy_slayer_driftram_t2' } ] });

addTierSet({ baseId:'slayer_silentturret', name:'Silent Turret Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'silentturret',
  desc: n => 'Defeat ' + n + ' of the DNB Silent Turret.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_silentturret_t1' }, { threshold:40, itemId:'vbtrophy_slayer_silentturret_t2' } ] });

addTierSet({ baseId:'slayer_driftleaper', name:'Drift Leaper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'driftleaper',
  desc: n => 'Defeat ' + n + ' of the DNB Drift Leaper.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_driftleaper_t1' }, { threshold:40, itemId:'vbtrophy_slayer_driftleaper_t2' } ] });

addTierSet({ baseId:'slayer_voidslinger', name:'Void Slinger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'voidslinger',
  desc: n => 'Defeat ' + n + ' of the DNB Void Slinger.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_voidslinger_t1' }, { threshold:40, itemId:'vbtrophy_slayer_voidslinger_t2' } ] });

addTierSet({ baseId:'slayer_wreckmortar', name:'Wreck Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'wreckmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Wreck Mortar.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_wreckmortar_t1' }, { threshold:40, itemId:'vbtrophy_slayer_wreckmortar_t2' } ] });

addTierSet({ baseId:'slayer_stardrift', name:'Star Drift Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'stardrift',
  desc: n => 'Defeat ' + n + ' of the DNB Star Drift.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_stardrift_t1' }, { threshold:40, itemId:'vbtrophy_slayer_stardrift_t2' } ] });

addTierSet({ baseId:'slayer_hulkwatcher', name:'Hulk Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hulkwatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Hulk Watcher.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_hulkwatcher_t1' }, { threshold:40, itemId:'vbtrophy_slayer_hulkwatcher_t2' } ] });

addTierSet({ baseId:'slayer_debrissatellite', name:'Debris Satellite Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'debrissatellite',
  desc: n => 'Defeat ' + n + ' of the DNB Debris Satellite.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_debrissatellite_t1' }, { threshold:40, itemId:'vbtrophy_slayer_debrissatellite_t2' } ] });

addTierSet({ baseId:'slayer_hulltunneler', name:'Hull Tunneler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hulltunneler',
  desc: n => 'Defeat ' + n + ' of the DNB Hull Tunneler.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_hulltunneler_t1' }, { threshold:40, itemId:'vbtrophy_slayer_hulltunneler_t2' } ] });

addTierSet({ baseId:'slayer_driftmites', name:'Drift Mites Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'driftmites',
  desc: n => 'Defeat ' + n + ' of the DNB Drift Mites.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_driftmites_t1' }, { threshold:40, itemId:'vbtrophy_slayer_driftmites_t2' } ] });

addTierSet({ baseId:'slayer_wreckhusk', name:'Wreck Husk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'wreckhusk',
  desc: n => 'Defeat ' + n + ' of the DNB Wreck Husk.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_wreckhusk_t1' }, { threshold:40, itemId:'vbtrophy_slayer_wreckhusk_t2' }, { threshold:100, itemId:'hullshardcore' } ] });

addTierSet({ baseId:'slayer_voidcaller', name:'Void Caller Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'voidcaller',
  desc: n => 'Defeat ' + n + ' of the DNB Void Caller.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_voidcaller_t1' }, { threshold:40, itemId:'vbtrophy_slayer_voidcaller_t2' }, { threshold:100, trinketId:'voidsummonschit' } ] });

addTierSet({ baseId:'slayer_hullmender', name:'Hull Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hullmender',
  desc: n => 'Defeat ' + n + ' of the DNB Hull Mender.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_hullmender_t1' }, { threshold:40, itemId:'vbtrophy_slayer_hullmender_t2' } ] });

addTierSet({ baseId:'slayer_driftwarden', name:'Drift Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'driftwarden',
  desc: n => 'Defeat ' + n + ' of the DNB Drift Warden.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_driftwarden_t1' }, { threshold:40, itemId:'vbtrophy_slayer_driftwarden_t2' }, { threshold:100, itemId:'driftwardenplate' } ] });

addTierSet({ baseId:'slayer_hulkmarksman', name:'Hulk Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hulkmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Hulk Marksman.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_hulkmarksman_t1' }, { threshold:40, itemId:'vbtrophy_slayer_hulkmarksman_t2' }, { threshold:100, familiarId:'hulkmarksmandrone' } ] });

addTierSet({ baseId:'slayer_hullblink', name:'Hull Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hullblink',
  desc: n => 'Defeat ' + n + ' of the DNB Hull Blink.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_hullblink_t1' }, { threshold:40, itemId:'vbtrophy_slayer_hullblink_t2' }, { threshold:100, itemId:'hullblinkanchor' } ] });

addTierSet({ baseId:'slayer_shadowhulk', name:'Shadow Hulk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'shadowhulk',
  desc: n => 'Defeat ' + n + ' of the DNB Shadow Hulk.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_shadowhulk_t1' }, { threshold:40, itemId:'vbtrophy_slayer_shadowhulk_t2' }, { threshold:100, trinketId:'shadowhulkveil' } ] });

addTierSet({ baseId:'slayer_derelicthound', name:'Derelict Hound Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'derelicthound',
  desc: n => 'Defeat ' + n + ' of the DNB Derelict Hound.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_derelicthound_t1' }, { threshold:40, itemId:'vbtrophy_slayer_derelicthound_t2' } ] });

addTierSet({ baseId:'slayer_comethusk', name:'Comet Husk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'comethusk',
  desc: n => 'Defeat ' + n + ' of the DNB Comet Husk.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_comethusk_t1' }, { threshold:40, itemId:'vbtrophy_slayer_comethusk_t2' } ] });

addTierSet({ baseId:'slayer_wreckslinger', name:'Wreck Slinger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'wreckslinger',
  desc: n => 'Defeat ' + n + ' of the DNB Wreck Slinger.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_wreckslinger_t1' }, { threshold:40, itemId:'vbtrophy_slayer_wreckslinger_t2' } ] });

addTierSet({ baseId:'slayer_hullspark', name:'Hull Spark Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hullspark',
  desc: n => 'Defeat ' + n + ' of the DNB Hull Spark.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_hullspark_t1' }, { threshold:40, itemId:'vbtrophy_slayer_hullspark_t2' } ] });

addTierSet({ baseId:'slayer_duskmoth', name:'Dusk Moth Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'duskmoth',
  desc: n => 'Defeat ' + n + ' of the DNB Dusk Moth.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_duskmoth_t1' }, { threshold:40, itemId:'vbtrophy_slayer_duskmoth_t2' } ] });

addTierSet({ baseId:'slayer_hulkram', name:'Hulk Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hulkram',
  desc: n => 'Defeat ' + n + ' of the DNB Hulk Ram.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_hulkram_t1' }, { threshold:40, itemId:'vbtrophy_slayer_hulkram_t2' } ] });

addTierSet({ baseId:'slayer_driftmortar', name:'Drift Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'driftmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Drift Mortar.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_driftmortar_t1' }, { threshold:40, itemId:'vbtrophy_slayer_driftmortar_t2' } ] });

addTierSet({ baseId:'slayer_wrecktunneler', name:'Wreck Tunneler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'wrecktunneler',
  desc: n => 'Defeat ' + n + ' of the DNB Wreck Tunneler.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_wrecktunneler_t1' }, { threshold:40, itemId:'vbtrophy_slayer_wrecktunneler_t2' } ] });

addTierSet({ baseId:'slayer_driftsatellite', name:'Drift Satellite Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'driftsatellite',
  desc: n => 'Defeat ' + n + ' of the DNB Drift Satellite.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_driftsatellite_t1' }, { threshold:40, itemId:'vbtrophy_slayer_driftsatellite_t2' } ] });

addTierSet({ baseId:'slayer_derelictsentinel', name:'Derelict Sentinel Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'derelictsentinel',
  desc: n => 'Defeat ' + n + ' of the DNB Derelict Sentinel.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_derelictsentinel_t1' }, { threshold:40, itemId:'vbtrophy_slayer_derelictsentinel_t2' } ] });

addTierSet({ baseId:'slayer_driftblink', name:'Drift Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'driftblink',
  desc: n => 'Defeat ' + n + ' of the DNB Drift Blink.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_driftblink_t1' }, { threshold:40, itemId:'vbtrophy_slayer_driftblink_t2' } ] });

addTierSet({ baseId:'slayer_hullbulwark', name:'Hull Bulwark Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hullbulwark',
  desc: n => 'Defeat ' + n + ' of the DNB Hull Bulwark.',
  tiers:[ { threshold:10, itemId:'vbtrophy_slayer_hullbulwark_t1' }, { threshold:40, itemId:'vbtrophy_slayer_hullbulwark_t2' } ] });
/* ============================================================
   CHALLENGE — hand-wired Predicate D feats for floorKey '8D'
   ============================================================
   '8D' has no superboss of its own (that's '10D''s singularity, floorNum 9,
   covered by the next sub-batch), so unlike defs-7's/defs-8's/defs-9's/
   defs-10's onBossDefeated()-anchored Challenge blocks, these are anchored
   to the floor itself instead:
     challenge_voidbetween_8d_speedrun -> game.js startFloor(), beside the
       existing floorPath==='D' block's floorNum===3/4/5/6 cases — exact same
       shape as defs-9's/defs-10's own speedrun checks.
     challenge_voidbetween_8d_nodamage / _frugal / _untouched -> game.js
       descend(), a new floorPath==='D' && dungeon.floorNum===7 block placed
       right after the existing floorsClearedNoDamage bump (i.e. still on
       '8D', one line before the D-branch progression advances floorNum) —
       reusing player.tookDamageThisFloor/visitedShopThisRun/
       tookDamageThisRun exactly like every other floor-clear/frugal/
       untouched-run check in this file. No new stat.
   ============================================================ */

addAchievement({ id:'challenge_voidbetween_8d_speedrun', name:'Racing the Drift', icon:'⏳',
  desc:'Reach Floor 8D within 29 minutes of run time.', category:'Challenge', itemId:'voidchronometer' });
addAchievement({ id:'challenge_voidbetween_8d_nodamage', name:'Untouched Wreckage', icon:'🛡️',
  desc:'Clear all of Floor 8D without taking any damage.', category:'Challenge', itemId:'vbtrophy_challenge_nodamage' });
addAchievement({ id:'challenge_voidbetween_8d_frugal', name:'Nothing Bought in the Cold', icon:'👛',
  desc:'Clear Floor 8D without ever visiting a shop this run.', category:'Challenge', trinketId:'hollowdriftpouch' });
addAchievement({ id:'challenge_voidbetween_8d_untouched', name:'Never Once Struck by the Drift', icon:'🕊️',
  desc:'Clear Floor 8D having taken no damage at any point this run.', category:'Challenge', familiarId:'coldstarwisp' });

/* ============================================================
   EXPLORATION — floorKey reach milestone + first-encounter bestiary entries
   for a representative slice of the '8D' roster
   ============================================================
   exploration_reach_8d: Predicate D, hand-wired in game.js startFloor()
   beside the existing floorPath==='D' pendingBossType chain — exact same
   shape as defs-9's/defs-10's own floor-reach checks (floorNum===3/4/5/6,
   here floorNum===7). Every other achievement here is Predicate B
   (bestiarySection:'enemyKills', bestiaryId, threshold:1) riding the same
   bumpBestiaryCount() call combat.js's handleEnemyDeath already makes on
   every kill — no new code for those.
   ============================================================ */

addAchievement({ id:'exploration_reach_8d', name:'The Void Between', icon:'🌌',
  desc:'Reach Floor 8D.', category:'Exploration', itemId:'vbtrophy_exploration_floor8d' });

// ---- 8D first-sight slice (11 of 33) ----
addAchievement({ id:'exploration_meet_voidwisp', name:'First Sight: Void Wisp', icon:'👁️',
  desc:'Encounter and defeat the DNB Void Wisp for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'voidwisp', threshold:1, itemId:'vbtrophy_meet_voidwisp' });
addAchievement({ id:'exploration_meet_derelictmoth', name:'First Sight: Derelict Moth', icon:'👁️',
  desc:'Encounter and defeat the DNB Derelict Moth for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'derelictmoth', threshold:1, itemId:'vbtrophy_meet_derelictmoth' });
addAchievement({ id:'exploration_meet_wreckspark', name:'First Sight: Wreck Spark', icon:'👁️',
  desc:'Encounter and defeat the DNB Wreck Spark for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'wreckspark', threshold:1, itemId:'vbtrophy_meet_wreckspark' });
addAchievement({ id:'exploration_meet_hullplate', name:'First Sight: Hull Plate', icon:'👁️',
  desc:'Encounter and defeat the DNB Hull Plate for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'hullplate', threshold:1, itemId:'vbtrophy_meet_hullplate' });
addAchievement({ id:'exploration_meet_driftram', name:'First Sight: Drift Ram', icon:'👁️',
  desc:'Encounter and defeat the DNB Drift Ram for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'driftram', threshold:1, itemId:'vbtrophy_meet_driftram' });
addAchievement({ id:'exploration_meet_silentturret', name:'First Sight: Silent Turret', icon:'👁️',
  desc:'Encounter and defeat the DNB Silent Turret for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'silentturret', threshold:1, itemId:'vbtrophy_meet_silentturret' });
addAchievement({ id:'exploration_meet_driftleaper', name:'First Sight: Drift Leaper', icon:'👁️',
  desc:'Encounter and defeat the DNB Drift Leaper for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'driftleaper', threshold:1, itemId:'vbtrophy_meet_driftleaper' });
addAchievement({ id:'exploration_meet_voidslinger', name:'First Sight: Void Slinger', icon:'👁️',
  desc:'Encounter and defeat the DNB Void Slinger for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'voidslinger', threshold:1, itemId:'vbtrophy_meet_voidslinger' });
addAchievement({ id:'exploration_meet_wreckmortar', name:'First Sight: Wreck Mortar', icon:'👁️',
  desc:'Encounter and defeat the DNB Wreck Mortar for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'wreckmortar', threshold:1, itemId:'vbtrophy_meet_wreckmortar' });
addAchievement({ id:'exploration_meet_stardrift', name:'First Sight: Star Drift', icon:'👁️',
  desc:'Encounter and defeat the DNB Star Drift for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'stardrift', threshold:1, itemId:'vbtrophy_meet_stardrift' });
addAchievement({ id:'exploration_meet_hulkwatcher', name:'First Sight: Hulk Watcher', icon:'👁️',
  desc:'Encounter and defeat the DNB Hulk Watcher for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'hulkwatcher', threshold:1, itemId:'vbtrophy_meet_hulkwatcher' });

/* ============================================================
   COLLECTION — distinct-breadth over the '8D' roster
   ============================================================
   Same bespoke-breadth-check shape defs-9's checkObservatoryCollection /
   defs-10's checkOrreryCollection used (addTierSet's distinct:true predicate
   counts an entire bestiary section bucket, not a scoped id subset — no
   built-in predicate fits). Only ONE floorKey this time (no region-wide
   grand tier the way defs-9/defs-10 needed for their 2-floorKey slices), so
   3 tiers instead of the 3-per-floorKey-plus-1-grand split those used: 11/22
   (trophy rungs) then all 33 (capstone). One helper
   (checkVoidBetweenCollection, called from combat-2.js's handleEnemyDeath —
   see the audit for the exact call site), 3 achievements it can unlock.
   Reads the SAME unlocks.bestiary.enemyKills bucket combat.js already writes
   on every kill — no new stat, no new bestiary bucket, just a scoped count.
   ============================================================ */

const VOIDBETWEEN_8D_ROSTER_IDS = ["voidwisp","derelictmoth","wreckspark","hullplate","driftram","silentturret","driftleaper","voidslinger","wreckmortar","stardrift","hulkwatcher","debrissatellite","hulltunneler","driftmites","wreckhusk","voidcaller","hullmender","driftwarden","hulkmarksman","hullblink","shadowhulk","derelicthound","comethusk","wreckslinger","hullspark","duskmoth","hulkram","driftmortar","wrecktunneler","driftsatellite","derelictsentinel","driftblink","hullbulwark"];
// the exact set combat-2.js's handleEnemyDeath tests before bothering to call
// the checker below — 33 ids total, a tiny fraction of the enemyKills space
const VOIDBETWEEN_WATCH_IDS = new Set(VOIDBETWEEN_8D_ROSTER_IDS);
function checkVoidBetweenCollection(game){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const bucket = unlocks.bestiary.enemyKills;
  const count = VOIDBETWEEN_8D_ROSTER_IDS.reduce((n, id) => n + (bucket[id] ? 1 : 0), 0);
  if (count >= 11) unlockAchievement('collection_voidbetween_t1', game);
  if (count >= 22) unlockAchievement('collection_voidbetween_t2', game);
  if (count >= 33) unlockAchievement('collection_voidbetween_t3', game);
}

addAchievement({ id:'collection_voidbetween_t1', name:'Wreckage Fragments', icon:'🧩',
  desc:'Encounter and defeat 11 different kinds of Void Between foe from Floor 8D\'s regular roster.', category:'Collection', itemId:'vbtrophy_collection_t1' });
addAchievement({ id:'collection_voidbetween_t2', name:'Deep Into the Cold', icon:'🧩',
  desc:'Encounter and defeat 22 different kinds of Void Between foe from Floor 8D\'s regular roster.', category:'Collection', itemId:'vbtrophy_collection_t2' });
addAchievement({ id:'collection_voidbetween_t3', name:'The Whole Drift', icon:'🌌',
  desc:'Encounter and defeat all 33 kinds of Void Between foe — Floor 8D\'s full regular roster.', category:'Collection', itemId:'voidbetweenheart' });

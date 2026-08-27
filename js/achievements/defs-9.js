'use strict';
// achievements/defs-9.js — Phase 7h: The Observatory (floors 4D/5D, D-branch
// region 1) achievement batch. See feature-research/phase7h-dbranch-
// achievements/audit-observatory.md for the full design rationale, reward-
// economy findings, and verification output.
//
// Reward-economy summary: shopDiscount/pillColorId/enemyId are re-confirmed
// fully exhausted, unchanged from defs-7f/7g's own findings. Verified before
// writing: no existing achievement references any of 4D's/5D's 66 enemy ids
// or 'astrolabe' (grep across js/achievements/defs-*.js came back empty), so
// no second-ladder workaround is needed anywhere in this file. This slice
// covers TWO floorKeys (4D + 5D, 33 enemies each = 66 total), so — per the
// dispatch's scale note — its count runs proportionally higher than defs-7f/
// 7g's single-floorKey batches: the BULK is a 2-tier Slayer ladder (10/40)
// over the FULL 66-enemy roster, with a 3rd tier (threshold 100) added for
// 12 flagship enemies (6 per floorKey, one per distinct AI behavior family:
// splitter/summoner/shielder/ambusher/sniper/teleporter) granting a unique
// capstone reward instead of another trophy. Every non-capstone rung mints a
// brand-new 'obstrophy_' trophy passive (locked:true, unlockedBy), cycling
// the same five +1-stat archetypes defs-7f/7g used (Luck / speed / melee /
// ranged / recharge). Observatory-themed (dusty brass/tarnished gold/cracked
// lens glass/drifting star-dust/faded constellations, accent #c9b06a).

/* ============================================================
   SLAYER — bestiary kill-count ladders over the FULL '4D'+'5D' roster
   ============================================================
   2-tier ladders (10/40) for all 66 enemies (33 per floorKey). 12 flagship
   enemies (6 per floorKey, one per distinct AI behavior not already
   showcased: splitter/summoner/shielder/ambusher/sniper/teleporter) get a
   3rd tier (threshold 100) granting a unique capstone reward instead of
   another trophy passive.
   ============================================================ */

// ---- 4D roster (33) ----

































// ---- 5D roster (33) ----

































/* ============================================================
   CHALLENGE — hand-wired Predicate D feats for the superboss `astrolabe`
   and the 4D/5D floors
   ============================================================
   Every id below has exactly one unlockAchievement() call site:
     challenge_astrolabe_flawless -> game.js onBossDefeated(), new astrolabe
       block mirroring the existing wobbler/subdrop/mangrove blocks,
       reusing player.tookDamageThisBossRoom — no new stat.
     challenge_astrolabe_floor_nodamage -> same block, reusing
       player.tookDamageThisFloor.
     challenge_astrolabe_onehearted -> same block, reusing player.redMax.
     challenge_astrolabe_speedkill -> same block, reusing game.runElapsed.
     challenge_astrolabe_frugal -> same block, reusing player.visitedShopThisRun.
     challenge_astrolabe_untouched_run -> same block, reusing
       player.tookDamageThisRun.
     challenge_observatory_4d_speedrun / _5d_speedrun -> game.js startFloor(),
       beside the existing floorPath==='D' block's floorNum===3/4 cases —
       exact same shape as defs-7's/defs-8's own speedrun checks.
   ============================================================ */

addAchievement({ id:'challenge_astrolabe_flawless', name:'Not a Star Out of Place', icon:'🧭',
  desc:'Defeat Astrolabe DNB without taking damage in its boss room.', category:'Challenge', trinketId:'stillorbit' });
addAchievement({ id:'challenge_astrolabe_floor_nodamage', name:'Untouched Observatory', icon:'🛡️',
  desc:'Clear all of Floor 5D without taking any damage.', category:'Challenge', itemId:'obstrophy_challenge_floor_nodamage' });
addAchievement({ id:'challenge_astrolabe_onehearted', name:'One Lens Left', icon:'💔',
  desc:'Defeat Astrolabe DNB with only one red heart of maximum health.', category:'Challenge', itemId:'obstrophy_challenge_onehearted' });
addAchievement({ id:'challenge_astrolabe_speedkill', name:'Quick Orbit', icon:'⏱️',
  desc:'Defeat Astrolabe DNB within 19 minutes of run time.', category:'Challenge', itemId:'obstrophy_challenge_speedkill' });
addAchievement({ id:'challenge_astrolabe_frugal', name:'Nothing Bought Under the Dome', icon:'👛',
  desc:'Defeat Astrolabe DNB without ever visiting a shop this run.', category:'Challenge', trinketId:'emptylenscase' });
addAchievement({ id:'challenge_astrolabe_untouched_run', name:'Never Once Scratched the Lens', icon:'🕊️',
  desc:'Defeat Astrolabe DNB having taken no damage at any point this run.', category:'Challenge', familiarId:'stargazerwisp' });
addAchievement({ id:'challenge_observatory_4d_speedrun', name:'Racing the Dome', icon:'⏳',
  desc:'Reach Floor 4D within 15 minutes of run time.', category:'Challenge', itemId:'brasschronometer' });
addAchievement({ id:'challenge_observatory_5d_speedrun', name:'Racing the Astrolabe', icon:'⌚',
  desc:'Reach Floor 5D within 19 minutes of run time.', category:'Challenge', itemId:'astrolabechronometer' });

/* ============================================================
   EXPLORATION — per-floorKey reach milestones + first-encounter bestiary
   entries for a representative slice of both rosters
   ============================================================
   exploration_reach_4d / _5d: Predicate D, hand-wired in game.js startFloor()
   beside the existing floorPath==='D' pendingBossType chain — exact same
   shape as defs-7's/defs-8's own floor-reach checks (floorNum===3/4). Every
   other achievement here is Predicate B (bestiarySection:'enemyKills',
   bestiaryId, threshold:1) riding the same bumpBestiaryCount() call
   combat.js's handleEnemyDeath already makes on every kill — no new code
   for those, including exploration_meet_astrolabe (the superboss kill also
   flows through handleEnemyDeath, same as defs-7's/defs-8's meet_* entries).
   ============================================================ */

addAchievement({ id:'exploration_reach_4d', name:'The Observatory', icon:'🔭',
  desc:'Reach Floor 4D.', category:'Exploration', itemId:'obstrophy_exploration_floor4d' });
addAchievement({ id:'exploration_reach_5d', name:'Beneath the Dome', icon:'🌌',
  desc:'Reach Floor 5D.', category:'Exploration', itemId:'obstrophy_exploration_floor5d' });
addAchievement({ id:'exploration_meet_astrolabe', name:'First Sight: Astrolabe DNB', icon:'👁️',
  desc:'Encounter and defeat Astrolabe DNB for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'astrolabe', threshold:1, itemId:'obstrophy_exploration_meet_astrolabe' });

// ---- 4D first-sight slice (9 of 33) ----
addAchievement({ id:'exploration_meet_lensdrifter', name:'First Sight: Lens Drifter', icon:'👁️',
  desc:'Encounter and defeat the DNB Lens Drifter for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'lensdrifter', threshold:1, itemId:'obstrophy_meet_lensdrifter' });
addAchievement({ id:'exploration_meet_dustmote', name:'First Sight: Dust Mote', icon:'👁️',
  desc:'Encounter and defeat the DNB Dust Mote for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'dustmote', threshold:1, itemId:'obstrophy_meet_dustmote' });
addAchievement({ id:'exploration_meet_starshard', name:'First Sight: Star Shard', icon:'👁️',
  desc:'Encounter and defeat the DNB Star Shard for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'starshard', threshold:1, itemId:'obstrophy_meet_starshard' });
addAchievement({ id:'exploration_meet_brassbulwark', name:'First Sight: Brass Bulwark', icon:'👁️',
  desc:'Encounter and defeat the DNB Brass Bulwark for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'brassbulwark', threshold:1, itemId:'obstrophy_meet_brassbulwark' });
addAchievement({ id:'exploration_meet_comettusk', name:'First Sight: Comet Tusk', icon:'👁️',
  desc:'Encounter and defeat the DNB Comet Tusk for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'comettusk', threshold:1, itemId:'obstrophy_meet_comettusk' });
addAchievement({ id:'exploration_meet_spyglassturret', name:'First Sight: Spyglass Turret', icon:'👁️',
  desc:'Encounter and defeat the DNB Spyglass Turret for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'spyglassturret', threshold:1, itemId:'obstrophy_meet_spyglassturret' });
addAchievement({ id:'exploration_meet_astralhopper', name:'First Sight: Astral Hopper', icon:'👁️',
  desc:'Encounter and defeat the DNB Astral Hopper for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'astralhopper', threshold:1, itemId:'obstrophy_meet_astralhopper' });
addAchievement({ id:'exploration_meet_gravitymortar', name:'First Sight: Gravity Mortar', icon:'👁️',
  desc:'Encounter and defeat the DNB Gravity Mortar for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'gravitymortar', threshold:1, itemId:'obstrophy_meet_gravitymortar' });
addAchievement({ id:'exploration_meet_domewatcher', name:'First Sight: Dome Watcher', icon:'👁️',
  desc:'Encounter and defeat the DNB Dome Watcher for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'domewatcher', threshold:1, itemId:'obstrophy_meet_domewatcher' });
// ---- 5D first-sight slice (9 of 33) ----
addAchievement({ id:'exploration_meet_astrolabestalker', name:'First Sight: Astrolabe Stalker', icon:'👁️',
  desc:'Encounter and defeat the DNB Astrolabe Stalker for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'astrolabestalker', threshold:1, itemId:'obstrophy_meet_astrolabestalker' });
addAchievement({ id:'exploration_meet_cometwisp', name:'First Sight: Comet Wisp', icon:'👁️',
  desc:'Encounter and defeat the DNB Comet Wisp for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'cometwisp', threshold:1, itemId:'obstrophy_meet_cometwisp' });
addAchievement({ id:'exploration_meet_quasarshard', name:'First Sight: Quasar Shard', icon:'👁️',
  desc:'Encounter and defeat the DNB Quasar Shard for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'quasarshard', threshold:1, itemId:'obstrophy_meet_quasarshard' });
addAchievement({ id:'exploration_meet_brassaegis', name:'First Sight: Brass Aegis', icon:'👁️',
  desc:'Encounter and defeat the DNB Brass Aegis for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'brassaegis', threshold:1, itemId:'obstrophy_meet_brassaegis' });
addAchievement({ id:'exploration_meet_meteortusk', name:'First Sight: Meteor Tusk', icon:'👁️',
  desc:'Encounter and defeat the DNB Meteor Tusk for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'meteortusk', threshold:1, itemId:'obstrophy_meet_meteortusk' });
addAchievement({ id:'exploration_meet_opticturret', name:'First Sight: Optic Turret', icon:'👁️',
  desc:'Encounter and defeat the DNB Optic Turret for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'opticturret', threshold:1, itemId:'obstrophy_meet_opticturret' });
addAchievement({ id:'exploration_meet_starhopper', name:'First Sight: Star Hopper', icon:'👁️',
  desc:'Encounter and defeat the DNB Star Hopper for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'starhopper', threshold:1, itemId:'obstrophy_meet_starhopper' });
addAchievement({ id:'exploration_meet_novamortar', name:'First Sight: Nova Mortar', icon:'👁️',
  desc:'Encounter and defeat the DNB Nova Mortar for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'novamortar', threshold:1, itemId:'obstrophy_meet_novamortar' });
addAchievement({ id:'exploration_meet_astrariumwatcher', name:'First Sight: Astrarium Watcher', icon:'👁️',
  desc:'Encounter and defeat the DNB Astrarium Watcher for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'astrariumwatcher', threshold:1, itemId:'obstrophy_meet_astrariumwatcher' });

/* ============================================================
   COLLECTION — distinct-breadth over the '4D' roster, the '5D' roster, and
   the combined Observatory region
   ============================================================
   Same bespoke-breadth-check shape defs-7's checkHollowChorusFinalWaveform-
   Collection / defs-8's checkMangrovesCollection used (addTierSet's
   distinct:true predicate counts an entire bestiary section bucket, not a
   scoped id subset — no built-in predicate fits). One helper
   (checkObservatoryCollection, called from combat-2.js's handleEnemyDeath —
   see the audit for the exact call site), 7 achievements it can unlock.
   Reads the SAME unlocks.bestiary.enemyKills bucket combat.js already writes
   on every kill — no new stat, no new bestiary bucket, just a scoped count.
   ============================================================ */

const OBSERVATORY_4D_ROSTER_IDS = ["lensdrifter","dustmote","starshard","brassbulwark","comettusk","spyglassturret","astralhopper","novaslinger","gravitymortar","constellationweaver","domewatcher","planetcircler","dustborer","starmites","dustcluster","constellationcaller","lensmender","brasswarden","telescopemarksman","stardriftblink","shadowcomet","duststrider","cometsprinter","glassslinger","meteorspark","dustmoth","brassram","stardustmortar","lensborer","satellitecircler","telescopesentinel","novablink","domebulwark"];
const OBSERVATORY_5D_ROSTER_IDS = ["astrolabestalker","cometwisp","quasarshard","brassaegis","meteortusk","opticturret","starhopper","gravslinger","novamortar","nebulaweaver","astrariumwatcher","ringcircler","gravityborer","cosmicmites","nebulacluster","astralcaller","glassmender","astrolabewarden","precisionmarksman","voidblink","eclipsecomet","gravitybrute","starstreak","prismslinger","fluxshard","astralmoth","brassjuggernaut","cometmortar","duskborer","mooncircler","opticsentinel","riftblink","astralbulwark"];
const OBSERVATORY_SUPERBOSS_IDS = ['astrolabe'];
// the exact set combat-2.js's handleEnemyDeath tests before bothering to call
// the checker below — 67 ids total, a tiny fraction of the enemyKills space
const OBSERVATORY_WATCH_IDS = new Set(OBSERVATORY_4D_ROSTER_IDS.concat(OBSERVATORY_5D_ROSTER_IDS, OBSERVATORY_SUPERBOSS_IDS));
function checkObservatoryCollection(game){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const bucket = unlocks.bestiary.enemyKills;
  const countIn = ids => ids.reduce((n, id) => n + (bucket[id] ? 1 : 0), 0);
  const d4 = countIn(OBSERVATORY_4D_ROSTER_IDS), d5 = countIn(OBSERVATORY_5D_ROSTER_IDS), sb = countIn(OBSERVATORY_SUPERBOSS_IDS);
  if (d4 >= 11) unlockAchievement('collection_observatory_4d_t1', game);
  if (d4 >= 22) unlockAchievement('collection_observatory_4d_t2', game);
  if (d4 >= 33) unlockAchievement('collection_observatory_4d_t3', game);
  if (d5 >= 11) unlockAchievement('collection_observatory_5d_t1', game);
  if (d5 >= 22) unlockAchievement('collection_observatory_5d_t2', game);
  if (d5 >= 33) unlockAchievement('collection_observatory_5d_t3', game);
  if (d4 + d5 + sb >= 67) unlockAchievement('collection_observatory_grand', game);
}

addAchievement({ id:'collection_observatory_4d_t1', name:'Dome Fragments', icon:'🧩',
  desc:'Encounter and defeat 11 different kinds of Observatory foe from Floor 4D\'s regular roster.', category:'Collection', itemId:'obstrophy_collection_4d_t1' });
addAchievement({ id:'collection_observatory_4d_t2', name:'Deep Into the Dust', icon:'🧩',
  desc:'Encounter and defeat 22 different kinds of Observatory foe from Floor 4D\'s regular roster.', category:'Collection', itemId:'obstrophy_collection_4d_t2' });
addAchievement({ id:'collection_observatory_4d_t3', name:'The Whole Dome', icon:'🔭',
  desc:'Encounter and defeat all 33 kinds of Observatory foe — Floor 4D\'s full regular roster.', category:'Collection', itemId:'lensarrayheart' });
addAchievement({ id:'collection_observatory_5d_t1', name:'Astrolabe Fragments', icon:'🧩',
  desc:'Encounter and defeat 11 different kinds of Observatory foe from Floor 5D\'s regular roster.', category:'Collection', itemId:'obstrophy_collection_5d_t1' });
addAchievement({ id:'collection_observatory_5d_t2', name:'Deep Into the Glass', icon:'🧩',
  desc:'Encounter and defeat 22 different kinds of Observatory foe from Floor 5D\'s regular roster.', category:'Collection', itemId:'obstrophy_collection_5d_t2' });
addAchievement({ id:'collection_observatory_5d_t3', name:'The Whole Astrolabe', icon:'🧭',
  desc:'Encounter and defeat all 33 kinds of Observatory foe — Floor 5D\'s full regular roster.', category:'Collection', itemId:'astrolabecoreheart' });
addAchievement({ id:'collection_observatory_grand', name:'Nothing Left in the Dark', icon:'🌌',
  desc:'Encounter and defeat all 67 foes of the Observatory — every regular enemy of Floors 4D and 5D, plus the Astrolabe DNB superboss.', category:'Collection', familiarId:'observatorywisp' });

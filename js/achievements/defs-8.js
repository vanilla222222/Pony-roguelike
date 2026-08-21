'use strict';
// achievements/defs-8.js — Phase 7g: The Tangled Shallows (floor 11C,
// C-branch) achievement batch. See feature-research/phase7g-cbranch-
// achievements/audit.md for the full design rationale, reward-economy
// findings, and verification output.
//
// Reward-economy summary: shopDiscount (11/11), pillColorId (40/40) and
// enemyId (60/60) are re-confirmed fully exhausted, unchanged from defs-7f's
// own finding. So exactly as defs-7f did: the BULK of this batch mints brand-
// new 'trophy' passive items (locked:true, unlockedBy, prefixed 'mgtrophy_'),
// each wired into a real recalcPlayerStats effect (js/systems/items-1.js/
// items-2.js). 13 ladder-capstone/hardest-Challenge/full-completion rungs
// instead grant a freshly minted, uniquely-named locked item / trinket
// (pendingReward:true) / familiar — Mangroves-themed (silt-brown brackish
// water, salt-bleached roots, tidal; accent #d8c88a). '11C' has no per-
// floorKey BOSS_TYPES roster (C-branch convention — its mid-boss is the
// superboss `mangrove`), so there is no boss-tier Slayer sub-section like
// defs-7f's section B.
//
// Verified before writing: no existing achievement references any of the 33
// '11C' enemy ids or `mangrove` (grep across js/achievements/defs-*.js came
// back empty), so unlike defs-7f's floorKey '13' extension, no second-ladder
// workaround is needed anywhere in this file.

/* ============================================================
   SLAYER — bestiary kill-count ladders over the '11C' 33-enemy roster
   ============================================================
   2-tier ladders (10/40) for all 33 enemies. t1 is always a freshly minted
   'mgtrophy_' trophy passive. t2 is a trophy passive for 27 of them and a
   capstone-tier unique reward for 6 flagship enemies spanning distinct
   behaviors (chaser/turret/summoner/shielder/ambusher/weaver).
   ============================================================ */

addTierSet({ baseId:'slayer_rootwraith', name:'Root Wraith Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rootwraith',
  desc: n => 'Defeat ' + n + ' of the DNB Root Wraith.',
  tiers:[ { threshold:10, itemId:'mgtrophy_rootwraith_t1' }, { threshold:40, trinketId:'rootboundtalon' } ] });

addTierSet({ baseId:'slayer_saltheron', name:'Salt Heron Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'saltheron',
  desc: n => 'Defeat ' + n + ' of the DNB Salt Heron.',
  tiers:[ { threshold:10, itemId:'mgtrophy_saltheron_t1' }, { threshold:40, itemId:'mgtrophy_saltheron_t2' } ] });

addTierSet({ baseId:'slayer_tidebloat', name:'Tide Bloat Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'tidebloat',
  desc: n => 'Defeat ' + n + ' of the DNB Tide Bloat.',
  tiers:[ { threshold:10, itemId:'mgtrophy_tidebloat_t1' }, { threshold:40, itemId:'mgtrophy_tidebloat_t2' } ] });

addTierSet({ baseId:'slayer_brineplate', name:'Brine Plate Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brineplate',
  desc: n => 'Defeat ' + n + ' of the DNB Brine Plate.',
  tiers:[ { threshold:10, itemId:'mgtrophy_brineplate_t1' }, { threshold:40, itemId:'mgtrophy_brineplate_t2' } ] });

addTierSet({ baseId:'slayer_mudtuskram', name:'Mudtusk Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mudtuskram',
  desc: n => 'Defeat ' + n + ' of the DNB Mudtusk Ram.',
  tiers:[ { threshold:10, itemId:'mgtrophy_mudtuskram_t1' }, { threshold:40, itemId:'mgtrophy_mudtuskram_t2' } ] });

addTierSet({ baseId:'slayer_barnaclespike', name:'Barnacle Spike Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'barnaclespike',
  desc: n => 'Defeat ' + n + ' of the DNB Barnacle Spike.',
  tiers:[ { threshold:10, itemId:'mgtrophy_barnaclespike_t1' }, { threshold:40, itemId:'barnaclecrown' } ] });

addTierSet({ baseId:'slayer_mudskipper', name:'Mudskipper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mudskipper',
  desc: n => 'Defeat ' + n + ' of the DNB Mudskipper.',
  tiers:[ { threshold:10, itemId:'mgtrophy_mudskipper_t1' }, { threshold:40, itemId:'mgtrophy_mudskipper_t2' } ] });

addTierSet({ baseId:'slayer_eelspitter', name:'Eel Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'eelspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Eel Spitter.',
  tiers:[ { threshold:10, itemId:'mgtrophy_eelspitter_t1' }, { threshold:40, itemId:'mgtrophy_eelspitter_t2' } ] });

addTierSet({ baseId:'slayer_crabmortar', name:'Crab Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'crabmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Crab Mortar.',
  tiers:[ { threshold:10, itemId:'mgtrophy_crabmortar_t1' }, { threshold:40, itemId:'mgtrophy_crabmortar_t2' } ] });

addTierSet({ baseId:'slayer_mangroveviper', name:'Mangrove Viper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mangroveviper',
  desc: n => 'Defeat ' + n + ' of the DNB Mangrove Viper.',
  tiers:[ { threshold:10, itemId:'mgtrophy_mangroveviper_t1' }, { threshold:40, itemId:'viperscoil' } ] });

addTierSet({ baseId:'slayer_tidewatcher', name:'Tide Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'tidewatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Tide Watcher.',
  tiers:[ { threshold:10, itemId:'mgtrophy_tidewatcher_t1' }, { threshold:40, itemId:'mgtrophy_tidewatcher_t2' } ] });

addTierSet({ baseId:'slayer_siltswirl', name:'Silt Swirl Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'siltswirl',
  desc: n => 'Defeat ' + n + ' of the DNB Silt Swirl.',
  tiers:[ { threshold:10, itemId:'mgtrophy_siltswirl_t1' }, { threshold:40, itemId:'mgtrophy_siltswirl_t2' } ] });

addTierSet({ baseId:'slayer_fiddlerborer', name:'Fiddler Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'fiddlerborer',
  desc: n => 'Defeat ' + n + ' of the DNB Fiddler Borer.',
  tiers:[ { threshold:10, itemId:'mgtrophy_fiddlerborer_t1' }, { threshold:40, itemId:'mgtrophy_fiddlerborer_t2' } ] });

addTierSet({ baseId:'slayer_silthopper', name:'Silt Hopper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'silthopper',
  desc: n => 'Defeat ' + n + ' of the DNB Silt Hopper.',
  tiers:[ { threshold:10, itemId:'mgtrophy_silthopper_t1' }, { threshold:40, itemId:'mgtrophy_silthopper_t2' } ] });

addTierSet({ baseId:'slayer_brinesack', name:'Brine Sack Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brinesack',
  desc: n => 'Defeat ' + n + ' of the DNB Brine Sack.',
  tiers:[ { threshold:10, itemId:'mgtrophy_brinesack_t1' }, { threshold:40, itemId:'mgtrophy_brinesack_t2' } ] });

addTierSet({ baseId:'slayer_hivewader', name:'Hive Wader Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hivewader',
  desc: n => 'Defeat ' + n + ' of the DNB Hive Wader.',
  tiers:[ { threshold:10, itemId:'mgtrophy_hivewader_t1' }, { threshold:40, familiarId:'siltswarmling' } ] });

addTierSet({ baseId:'slayer_mangrovemender', name:'Mangrove Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mangrovemender',
  desc: n => 'Defeat ' + n + ' of the DNB Mangrove Mender.',
  tiers:[ { threshold:10, itemId:'mgtrophy_mangrovemender_t1' }, { threshold:40, itemId:'mgtrophy_mangrovemender_t2' } ] });

addTierSet({ baseId:'slayer_tidewarden', name:'Tide Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'tidewarden',
  desc: n => 'Defeat ' + n + ' of the DNB Tide Warden.',
  tiers:[ { threshold:10, itemId:'mgtrophy_tidewarden_t1' }, { threshold:40, itemId:'tidewardenaegis' } ] });

addTierSet({ baseId:'slayer_heronmarksman', name:'Heron Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'heronmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Heron Marksman.',
  tiers:[ { threshold:10, itemId:'mgtrophy_heronmarksman_t1' }, { threshold:40, itemId:'mgtrophy_heronmarksman_t2' } ] });

addTierSet({ baseId:'slayer_brackblink', name:'Brack Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brackblink',
  desc: n => 'Defeat ' + n + ' of the DNB Brack Blink.',
  tiers:[ { threshold:10, itemId:'mgtrophy_brackblink_t1' }, { threshold:40, itemId:'mgtrophy_brackblink_t2' } ] });

addTierSet({ baseId:'slayer_crocshade', name:'Croc Shade Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'crocshade',
  desc: n => 'Defeat ' + n + ' of the DNB Croc Shade.',
  tiers:[ { threshold:10, itemId:'mgtrophy_crocshade_t1' }, { threshold:40, trinketId:'crocshadefang' } ] });

addTierSet({ baseId:'slayer_mireloper', name:'Mire Loper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mireloper',
  desc: n => 'Defeat ' + n + ' of the DNB Mire Loper.',
  tiers:[ { threshold:10, itemId:'mgtrophy_mireloper_t1' }, { threshold:40, itemId:'mgtrophy_mireloper_t2' } ] });

addTierSet({ baseId:'slayer_tidedasher', name:'Tide Dasher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'tidedasher',
  desc: n => 'Defeat ' + n + ' of the DNB Tide Dasher.',
  tiers:[ { threshold:10, itemId:'mgtrophy_tidedasher_t1' }, { threshold:40, itemId:'mgtrophy_tidedasher_t2' } ] });

addTierSet({ baseId:'slayer_saltspitter', name:'Salt Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'saltspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Salt Spitter.',
  tiers:[ { threshold:10, itemId:'mgtrophy_saltspitter_t1' }, { threshold:40, itemId:'mgtrophy_saltspitter_t2' } ] });

addTierSet({ baseId:'slayer_bloatbladder', name:'Bloat Bladder Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'bloatbladder',
  desc: n => 'Defeat ' + n + ' of the DNB Bloat Bladder.',
  tiers:[ { threshold:10, itemId:'mgtrophy_bloatbladder_t1' }, { threshold:40, itemId:'mgtrophy_bloatbladder_t2' } ] });

addTierSet({ baseId:'slayer_mangrovebat', name:'Mangrove Bat Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mangrovebat',
  desc: n => 'Defeat ' + n + ' of the DNB Mangrove Bat.',
  tiers:[ { threshold:10, itemId:'mgtrophy_mangrovebat_t1' }, { threshold:40, itemId:'mgtrophy_mangrovebat_t2' } ] });

addTierSet({ baseId:'slayer_siltboar', name:'Silt Boar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'siltboar',
  desc: n => 'Defeat ' + n + ' of the DNB Silt Boar.',
  tiers:[ { threshold:10, itemId:'mgtrophy_siltboar_t1' }, { threshold:40, itemId:'mgtrophy_siltboar_t2' } ] });

addTierSet({ baseId:'slayer_mudmortar', name:'Mud Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mudmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Mud Mortar.',
  tiers:[ { threshold:10, itemId:'mgtrophy_mudmortar_t1' }, { threshold:40, itemId:'mgtrophy_mudmortar_t2' } ] });

addTierSet({ baseId:'slayer_mudlobster', name:'Mud Lobster Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mudlobster',
  desc: n => 'Defeat ' + n + ' of the DNB Mud Lobster.',
  tiers:[ { threshold:10, itemId:'mgtrophy_mudlobster_t1' }, { threshold:40, itemId:'mgtrophy_mudlobster_t2' } ] });

addTierSet({ baseId:'slayer_duskcircler', name:'Dusk Circler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'duskcircler',
  desc: n => 'Defeat ' + n + ' of the DNB Dusk Circler.',
  tiers:[ { threshold:10, itemId:'mgtrophy_duskcircler_t1' }, { threshold:40, itemId:'mgtrophy_duskcircler_t2' } ] });

addTierSet({ baseId:'slayer_rootsentinel', name:'Root Sentinel Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rootsentinel',
  desc: n => 'Defeat ' + n + ' of the DNB Root Sentinel.',
  tiers:[ { threshold:10, itemId:'mgtrophy_rootsentinel_t1' }, { threshold:40, itemId:'mgtrophy_rootsentinel_t2' } ] });

addTierSet({ baseId:'slayer_brackmist', name:'Brack Mist Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brackmist',
  desc: n => 'Defeat ' + n + ' of the DNB Brack Mist.',
  tiers:[ { threshold:10, itemId:'mgtrophy_brackmist_t1' }, { threshold:40, itemId:'mgtrophy_brackmist_t2' } ] });

addTierSet({ baseId:'slayer_shellbulk', name:'Shell Bulk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'shellbulk',
  desc: n => 'Defeat ' + n + ' of the DNB Shell Bulk.',
  tiers:[ { threshold:10, itemId:'mgtrophy_shellbulk_t1' }, { threshold:40, itemId:'mgtrophy_shellbulk_t2' } ] });


/* ============================================================
   CHALLENGE — hand-wired Predicate D feats for the superboss `mangrove`
   and the 11C floor/region
   ============================================================
   Every id below has exactly one unlockAchievement() call site:
     challenge_mangrove_flawless -> game.js onBossDefeated(), new mangrove
       block mirroring the existing wobbler/subdrop blocks (Phase 7f),
       reusing player.tookDamageThisBossRoom — no new stat.
     challenge_mangrove_floor_nodamage -> same block, reusing
       player.tookDamageThisFloor.
     challenge_mangrove_onehearted -> same block, reusing player.redMax.
     challenge_mangrove_speedkill -> same block, reusing game.runElapsed.
     challenge_mangrove_frugal -> same block, reusing player.visitedShopThisRun.
     challenge_mangrove_untouched_run -> same block, reusing
       player.tookDamageThisRun.
     challenge_mangroves_speedrun -> game.js startFloor(), beside the
       existing floorPath==='C' block's floorNum===10 (11C) case — exact
       same shape as defs-7's floorNum===12/13 speedrun checks.
   ============================================================ */

addAchievement({ id:'challenge_mangrove_flawless', name:'Not a Ripple', icon:'🌿',
  desc:'Defeat Mangrove DNB without taking damage in its boss room.', category:'Challenge', trinketId:'stillbrackwater' });
addAchievement({ id:'challenge_mangrove_floor_nodamage', name:'Untouched Shallows', icon:'🛡️',
  desc:'Clear all of Floor 11C without taking any damage.', category:'Challenge', itemId:'mgtrophy_challenge_floor_nodamage' });
addAchievement({ id:'challenge_mangrove_onehearted', name:'One Root Left', icon:'💔',
  desc:'Defeat Mangrove DNB with only one red heart of maximum health.', category:'Challenge', itemId:'mgtrophy_challenge_onehearted' });
addAchievement({ id:'challenge_mangrove_speedkill', name:'Quick Tide', icon:'⏱️',
  desc:'Defeat Mangrove DNB within 18 minutes of run time.', category:'Challenge', itemId:'mgtrophy_challenge_speedkill' });
addAchievement({ id:'challenge_mangrove_frugal', name:'Nothing Bought in the Shallows', icon:'👛',
  desc:'Defeat Mangrove DNB without ever visiting a shop this run.', category:'Challenge', trinketId:'emptycreel' });
addAchievement({ id:'challenge_mangrove_untouched_run', name:'Never Once Sank', icon:'🕊️',
  desc:'Defeat Mangrove DNB having taken no damage at any point this run.', category:'Challenge', familiarId:'saltboundwisp' });
addAchievement({ id:'challenge_mangroves_speedrun', name:'Racing the Tide', icon:'⏳',
  desc:'Reach Floor 11C within 20 minutes of run time.', category:'Challenge', itemId:'tidalclock' });

/* ============================================================
   EXPLORATION — reaching 11C + first-encounter bestiary entries
   ============================================================
   exploration_reach_11c: Predicate D, hand-wired in game.js startFloor()
   beside the existing floorPath==='C' pendingBossType chain — exact same
   shape as defs-7's floorNum===12/13 checks. Everything else here is
   Predicate B (bestiarySection:'enemyKills', bestiaryId, threshold:1)
   riding the same bumpBestiaryCount() call combat.js's handleEnemyDeath
   already makes on every kill — no new code for those, including
   exploration_meet_mangrove (the superboss kill also flows through
   handleEnemyDeath, same as defs-7's meet_wobbler/meet_subdrop).
   ============================================================ */

addAchievement({ id:'exploration_reach_11c', name:'The Tangled Shallows', icon:'🌿',
  desc:'Reach Floor 11C.', category:'Exploration', itemId:'mgtrophy_exploration_floor11c' });
addAchievement({ id:'exploration_meet_mangrove', name:'First Sight: Mangrove DNB', icon:'👁️',
  desc:'Encounter and defeat Mangrove DNB for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'mangrove', threshold:1, itemId:'mgtrophy_exploration_meet_mangrove' });
addAchievement({ id:'exploration_meet_saltheron', name:'First Sight: Salt Heron', icon:'👁️',
  desc:'Encounter and defeat the DNB Salt Heron for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'saltheron', threshold:1, itemId:'mgtrophy_meet_saltheron' });
addAchievement({ id:'exploration_meet_tidebloat', name:'First Sight: Tide Bloat', icon:'👁️',
  desc:'Encounter and defeat the DNB Tide Bloat for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'tidebloat', threshold:1, itemId:'mgtrophy_meet_tidebloat' });
addAchievement({ id:'exploration_meet_mudtuskram', name:'First Sight: Mudtusk Ram', icon:'👁️',
  desc:'Encounter and defeat the DNB Mudtusk Ram for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'mudtuskram', threshold:1, itemId:'mgtrophy_meet_mudtuskram' });
addAchievement({ id:'exploration_meet_mudskipper', name:'First Sight: Mudskipper', icon:'👁️',
  desc:'Encounter and defeat the DNB Mudskipper for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'mudskipper', threshold:1, itemId:'mgtrophy_meet_mudskipper' });
addAchievement({ id:'exploration_meet_eelspitter', name:'First Sight: Eel Spitter', icon:'👁️',
  desc:'Encounter and defeat the DNB Eel Spitter for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'eelspitter', threshold:1, itemId:'mgtrophy_meet_eelspitter' });
addAchievement({ id:'exploration_meet_crabmortar', name:'First Sight: Crab Mortar', icon:'👁️',
  desc:'Encounter and defeat the DNB Crab Mortar for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'crabmortar', threshold:1, itemId:'mgtrophy_meet_crabmortar' });
addAchievement({ id:'exploration_meet_mireloper', name:'First Sight: Mire Loper', icon:'👁️',
  desc:'Encounter and defeat the DNB Mire Loper for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'mireloper', threshold:1, itemId:'mgtrophy_meet_mireloper' });
addAchievement({ id:'exploration_meet_saltspitter', name:'First Sight: Salt Spitter', icon:'👁️',
  desc:'Encounter and defeat the DNB Salt Spitter for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'saltspitter', threshold:1, itemId:'mgtrophy_meet_saltspitter' });
addAchievement({ id:'exploration_meet_bloatbladder', name:'First Sight: Bloat Bladder', icon:'👁️',
  desc:'Encounter and defeat the DNB Bloat Bladder for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'bloatbladder', threshold:1, itemId:'mgtrophy_meet_bloatbladder' });
addAchievement({ id:'exploration_meet_siltboar', name:'First Sight: Silt Boar', icon:'👁️',
  desc:'Encounter and defeat the DNB Silt Boar for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'siltboar', threshold:1, itemId:'mgtrophy_meet_siltboar' });
addAchievement({ id:'exploration_meet_mudlobster', name:'First Sight: Mud Lobster', icon:'👁️',
  desc:'Encounter and defeat the DNB Mud Lobster for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'mudlobster', threshold:1, itemId:'mgtrophy_meet_mudlobster' });
addAchievement({ id:'exploration_meet_shellbulk', name:'First Sight: Shell Bulk', icon:'👁️',
  desc:'Encounter and defeat the DNB Shell Bulk for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'shellbulk', threshold:1, itemId:'mgtrophy_meet_shellbulk' });

/* ============================================================
   COLLECTION — distinct-breadth over JUST the '11C' roster
   ============================================================
   Same bespoke-breadth-check shape defs-7's checkHollowChorusFinalWave-
   formCollection used (addTierSet's distinct:true predicate counts an
   entire bestiary section bucket, not a scoped id subset — no built-in
   predicate fits). One helper (checkMangrovesCollection, called from
   combat.js's handleEnemyDeath — see the audit for the exact call site),
   6 achievements it can unlock. Reads the SAME unlocks.bestiary.enemyKills
   bucket combat.js already writes on every kill — no new stat, no new
   bestiary bucket, just a scoped count over it.
   ============================================================ */

const MANGROVES_ORIGINAL_IDS = ['rootwraith', 'saltheron', 'tidebloat', 'brineplate', 'mudtuskram', 'barnaclespike', 'mudskipper', 'eelspitter', 'crabmortar', 'mangroveviper', 'tidewatcher', 'siltswirl', 'fiddlerborer', 'silthopper', 'brinesack', 'hivewader', 'mangrovemender', 'tidewarden', 'heronmarksman', 'brackblink', 'crocshade'];
const MANGROVES_FLAVOR_IDS = ['mireloper', 'tidedasher', 'saltspitter', 'bloatbladder', 'mangrovebat', 'siltboar', 'mudmortar', 'mudlobster', 'duskcircler', 'rootsentinel', 'brackmist', 'shellbulk'];
const MANGROVES_SUPERBOSS_IDS = ['mangrove'];
// the exact set combat.js's handleEnemyDeath tests before bothering to call
// the checker below — 34 ids total, a tiny fraction of the enemyKills space
const MANGROVES_WATCH_IDS = new Set(MANGROVES_ORIGINAL_IDS.concat(MANGROVES_FLAVOR_IDS, MANGROVES_SUPERBOSS_IDS));
function checkMangrovesCollection(game){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const bucket = unlocks.bestiary.enemyKills;
  const countIn = ids => ids.reduce((n, id) => n + (bucket[id] ? 1 : 0), 0);
  const origCount = countIn(MANGROVES_ORIGINAL_IDS), flavorCount = countIn(MANGROVES_FLAVOR_IDS), sb = countIn(MANGROVES_SUPERBOSS_IDS);
  const roster = origCount + flavorCount;
  if (roster >= 11) unlockAchievement('collection_mangroves_roster_t1', game);
  if (roster >= 22) unlockAchievement('collection_mangroves_roster_t2', game);
  if (roster >= 33) unlockAchievement('collection_mangroves_roster_t3', game);
  if (flavorCount >= 12) unlockAchievement('collection_mangroves_flavors', game);
  if (origCount >= 21) unlockAchievement('collection_mangroves_originals', game);
  if (roster + sb >= 34) unlockAchievement('collection_mangroves_grand', game);
}

addAchievement({ id:'collection_mangroves_roster_t1', name:'Shallows Fragments', icon:'🧩',
  desc:'Encounter and defeat 11 different kinds of Tangled Shallows foe (Floor 11C regular roster).', category:'Collection', itemId:'mgtrophy_collection_roster_t1' });
addAchievement({ id:'collection_mangroves_roster_t2', name:'Deep Into the Silt', icon:'🧩',
  desc:'Encounter and defeat 22 different kinds of Tangled Shallows foe (Floor 11C regular roster).', category:'Collection', itemId:'mgtrophy_collection_roster_t2' });
addAchievement({ id:'collection_mangroves_roster_t3', name:'The Whole Tangle', icon:'🌿',
  desc:'Encounter and defeat all 33 kinds of Tangled Shallows foe — Floor 11C\'s full regular roster.', category:'Collection', itemId:'mangrovecanopyheart' });
addAchievement({ id:'collection_mangroves_flavors', name:'Every Brackish Variant', icon:'🐊',
  desc:'Encounter and defeat all 12 flavor-variant foes of the Tangled Shallows.', category:'Collection', trinketId:'brackishvariant' });
addAchievement({ id:'collection_mangroves_originals', name:'The Original Roster', icon:'🍃',
  desc:'Encounter and defeat all 21 original foes of the Tangled Shallows.', category:'Collection', itemId:'mgtrophy_collection_originals' });
addAchievement({ id:'collection_mangroves_grand', name:'Nothing Left in the Silt', icon:'🌊',
  desc:'Encounter and defeat all 34 foes of the Tangled Shallows — every regular enemy and the Mangrove DNB superboss of Floor 11C.', category:'Collection', familiarId:'lasttidewatcher' });

'use strict';
// achievements/defs-7.js — Phase 7f: The Hollow Chorus (floor 13) / The Final
// Waveform (floor 14) main-route achievement batch. See
// feature-research/phase7f-mainroute-achievements/audit.md for the full design
// rationale, reward-economy findings, and verification output.
//
// Reward-economy summary (see audit for the grep evidence): shopDiscount (11/11
// kinds claimed), pillColorId (40/40 claimed) and enemyId (60/60 claimed) are
// fully exhausted pools — using any of them here would silently collide with an
// existing achievement's grant. TRINKET_LIST is swept whole by SUPERBOSS_REWARDS
// (defs-1.js) unless a trinket carries pendingReward:true. So: the BULK of this
// batch mints brand-new 'trophy' passive items (locked:true, unlockedBy) — the
// same genuinely-repeatable pattern Slices 7/8 already used, since every id is
// freshly minted there's no shared pool to exhaust. The ~14 ladder-capstone/
// hardest-Challenge/full-completion rungs instead grant a freshly minted,
// pendingReward:true trinket, a freshly minted locked item, or a freshly minted
// locked orbiter familiar — never touching any id SUPERBOSS_REWARDS or an
// earlier defs file already claims.

/* ============================================================
   SLAYER — bestiary kill-count ladders over the '13'/'14' roster
   ============================================================
   A. floorKey '14' regular enemies (brand new, no prior achievement) — 3-tier
      ladders, 8/30/80.
   B. The 4 new floorKey '13'/'14' bosses (brand new) — 3-tier ladders, 3/10/25.
   C. floorKey '13' roster EXTENSION — its 8 regular + 4 reskin enemies already
      have a Slayer achievement from an earlier phase (defs-2.js single T20 /
      defs-4.js 5/20/50 ladder). Rather than re-touch those ids (forbidden — the
      task says do not duplicate existing rungs), this adds a SECOND ladder on
      fresh ids (baseId prefixed 'slayer2_') picking up past where the originals
      leave off. See audit.md for why this widened the Slayer section past the
      literal '13/14 roster' reading.
   ============================================================ */

// ---- A. floorKey '14' regular enemies ----
addTierSet({ baseId:'slayer_deadaircoda', name:'Dead Air Coda Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'deadaircoda',
  desc: n => 'Defeat ' + n + ' of the DNB Dead Air Coda.',
  tiers:[ { threshold:8, itemId:'hcfwtrophy_deadaircoda_t1' }, { threshold:30, itemId:'hcfwtrophy_deadaircoda_t2' }, { threshold:80, itemId:'hcfwtrophy_deadaircoda_t3' } ] });

addTierSet({ baseId:'slayer_flatlineburrower', name:'Flatline Burrower Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'flatlineburrower',
  desc: n => 'Defeat ' + n + ' of the DNB Flatline Burrower.',
  tiers:[ { threshold:8, itemId:'hcfwtrophy_flatlineburrower_t1' }, { threshold:30, itemId:'hcfwtrophy_flatlineburrower_t2' }, { threshold:80, itemId:'hcfwtrophy_flatlineburrower_t3' } ] });

addTierSet({ baseId:'slayer_silencestalker', name:'Silence Stalker Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'silencestalker',
  desc: n => 'Defeat ' + n + ' of the DNB Silence Stalker.',
  tiers:[ { threshold:8, itemId:'hcfwtrophy_silencestalker_t1' }, { threshold:30, itemId:'hcfwtrophy_silencestalker_t2' }, { threshold:80, itemId:'hcfwtrophy_silencestalker_t3' } ] });

addTierSet({ baseId:'slayer_decrescendosplitter', name:'Decrescendo Splitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'decrescendosplitter',
  desc: n => 'Defeat ' + n + ' of the DNB Decrescendo Splitter.',
  tiers:[ { threshold:8, itemId:'hcfwtrophy_decrescendosplitter_t1' }, { threshold:30, itemId:'hcfwtrophy_decrescendosplitter_t2' }, { threshold:80, trinketId:'splitscarcasing' } ] });

// ---- B. the 4 new floorKey '13'/'14' bosses ----
addTierSet({ baseId:'slayer_lastovertone', name:'The Last Overtone Hunter', icon:'👑',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'lastovertone',
  desc: n => 'Defeat ' + n + ' of The Last Overtone.',
  tiers:[ { threshold:3, itemId:'hcfwtrophy_lastovertone_t1' }, { threshold:10, itemId:'hcfwtrophy_lastovertone_t2' }, { threshold:25, itemId:'lastchord' } ] });

addTierSet({ baseId:'slayer_hollowcantor', name:'The Hollow Cantor Hunter', icon:'👑',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hollowcantor',
  desc: n => 'Defeat ' + n + ' of The Hollow Cantor.',
  tiers:[ { threshold:3, itemId:'hcfwtrophy_hollowcantor_t1' }, { threshold:10, itemId:'hcfwtrophy_hollowcantor_t2' }, { threshold:25, trinketId:'cantorbell' } ] });

addTierSet({ baseId:'slayer_flatlinewraith', name:'The Flatline Wraith Hunter', icon:'👑',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'flatlinewraith',
  desc: n => 'Defeat ' + n + ' of The Flatline Wraith.',
  tiers:[ { threshold:3, itemId:'hcfwtrophy_flatlinewraith_t1' }, { threshold:10, itemId:'hcfwtrophy_flatlinewraith_t2' }, { threshold:25, familiarId:'wraithnote' } ] });

addTierSet({ baseId:'slayer_zeroamplitude', name:'The Zero Amplitude Hunter', icon:'👑',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'zeroamplitude',
  desc: n => 'Defeat ' + n + ' of The Zero Amplitude.',
  tiers:[ { threshold:3, itemId:'hcfwtrophy_zeroamplitude_t1' }, { threshold:10, itemId:'hcfwtrophy_zeroamplitude_t2' }, { threshold:25, itemId:'zeroline' } ] });

// ---- C. floorKey '13' roster extension — SECOND ladder, fresh ids, picking up
//    past the pre-existing achievement's own threshold(s) on the same bestiaryId ----
addTierSet({ baseId:'slayer2_onbeatstalker', name:'Onbeat Stalker Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'onbeatstalker',
  desc: n => 'Defeat ' + n + ' of the DNB Onbeat Stalker.',
  tiers:[ { threshold:60, itemId:'hcfwtrophy_r_onbeatstalker_t1' }, { threshold:150, itemId:'hcfwtrophy_r_onbeatstalker_t2' }, { threshold:300, itemId:'hcfwtrophy_r_onbeatstalker_t3' } ] });

addTierSet({ baseId:'slayer2_downbeatbrute', name:'Downbeat Brute Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'downbeatbrute',
  desc: n => 'Defeat ' + n + ' of the DNB Downbeat Brute.',
  tiers:[ { threshold:60, itemId:'hcfwtrophy_r_downbeatbrute_t1' }, { threshold:150, itemId:'hcfwtrophy_r_downbeatbrute_t2' }, { threshold:300, itemId:'hcfwtrophy_r_downbeatbrute_t3' } ] });

addTierSet({ baseId:'slayer2_crescendocharger', name:'Crescendo Charger Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'crescendocharger',
  desc: n => 'Defeat ' + n + ' of the DNB Crescendo Charger.',
  tiers:[ { threshold:60, itemId:'hcfwtrophy_r_crescendocharger_t1' }, { threshold:150, itemId:'hcfwtrophy_r_crescendocharger_t2' }, { threshold:300, itemId:'hcfwtrophy_r_crescendocharger_t3' } ] });

addTierSet({ baseId:'slayer2_apexmarksman', name:'Apex Marksman Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'apexmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Apex Marksman.',
  tiers:[ { threshold:60, itemId:'hcfwtrophy_r_apexmarksman_t1' }, { threshold:150, itemId:'hcfwtrophy_r_apexmarksman_t2' }, { threshold:300, itemId:'hcfwtrophy_r_apexmarksman_t3' } ] });

addTierSet({ baseId:'slayer2_codablinker', name:'Coda Blinker Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'codablinker',
  desc: n => 'Defeat ' + n + ' of the DNB Coda Blinker.',
  tiers:[ { threshold:60, itemId:'hcfwtrophy_r_codablinker_t1' }, { threshold:150, itemId:'hcfwtrophy_r_codablinker_t2' }, { threshold:300, itemId:'hcfwtrophy_r_codablinker_t3' } ] });

addTierSet({ baseId:'slayer2_resonancewarden', name:'Resonance Warden Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'resonancewarden',
  desc: n => 'Defeat ' + n + ' of the DNB Resonance Warden.',
  tiers:[ { threshold:60, itemId:'hcfwtrophy_r_resonancewarden_t1' }, { threshold:150, itemId:'hcfwtrophy_r_resonancewarden_t2' }, { threshold:300, itemId:'hcfwtrophy_r_resonancewarden_t3' } ] });

addTierSet({ baseId:'slayer2_finalemortar', name:'Finale Mortar Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'finalemortar',
  desc: n => 'Defeat ' + n + ' of the DNB Finale Mortar.',
  tiers:[ { threshold:60, itemId:'hcfwtrophy_r_finalemortar_t1' }, { threshold:150, itemId:'hcfwtrophy_r_finalemortar_t2' }, { threshold:300, itemId:'hcfwtrophy_r_finalemortar_t3' } ] });

addTierSet({ baseId:'slayer2_goldenmites', name:'Golden Mites Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'goldenmites',
  desc: n => 'Defeat ' + n + ' of the DNB Golden Mites.',
  tiers:[ { threshold:60, itemId:'hcfwtrophy_r_goldenmites_t1' }, { threshold:150, itemId:'hcfwtrophy_r_goldenmites_t2' }, { threshold:300, itemId:'hcfwtrophy_r_goldenmites_t3' } ] });

addTierSet({ baseId:'slayer2_polyrhythm', name:'Polyrhythm Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'polyrhythm',
  desc: n => 'Defeat ' + n + ' of the DNB Polyrhythm.',
  tiers:[ { threshold:100, itemId:'hcfwtrophy_r_polyrhythm_t1' }, { threshold:250, itemId:'hcfwtrophy_r_polyrhythm_t2' }, { threshold:500, itemId:'hcfwtrophy_r_polyrhythm_t3' } ] });

addTierSet({ baseId:'slayer2_fermatasentry', name:'Fermata Sentry Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'fermatasentry',
  desc: n => 'Defeat ' + n + ' of the DNB Fermata Sentry.',
  tiers:[ { threshold:100, itemId:'hcfwtrophy_r_fermatasentry_t1' }, { threshold:250, itemId:'hcfwtrophy_r_fermatasentry_t2' }, { threshold:500, itemId:'hcfwtrophy_r_fermatasentry_t3' } ] });

addTierSet({ baseId:'slayer2_syncopehopper', name:'Syncope Hopper Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'syncopehopper',
  desc: n => 'Defeat ' + n + ' of the DNB Syncope Hopper.',
  tiers:[ { threshold:100, itemId:'hcfwtrophy_r_syncopehopper_t1' }, { threshold:250, itemId:'hcfwtrophy_r_syncopehopper_t2' }, { threshold:500, itemId:'hcfwtrophy_r_syncopehopper_t3' } ] });

addTierSet({ baseId:'slayer2_tremorswarm', name:'Tremor Swarm Veteran Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'tremorswarm',
  desc: n => 'Defeat ' + n + ' of the DNB Tremor Swarm.',
  tiers:[ { threshold:100, itemId:'hcfwtrophy_r_tremorswarm_t1' }, { threshold:250, itemId:'hcfwtrophy_r_tremorswarm_t2' }, { threshold:500, itemId:'hcfwtrophy_r_tremorswarm_t3' } ] });


/* ============================================================
   CHALLENGE — hand-wired Predicate D feats for floors 13/14
   ============================================================
   Every id below has exactly one unlockAchievement() call site:
     challenge_hollowchorus_flawless / challenge_finalwaveform_flawless
       -> game.js onBossDefeated(), new wobbler/subdrop block (mirrors the
          existing 'untouchable' check, scoped per-superboss)
     challenge_hollowchorus_floor_nodamage / challenge_finalwaveform_floor_nodamage
       -> same block, reusing player.tookDamageThisFloor (already written by
          game.js startFloor/combat — no new stat)
     challenge_hollowchorus_onehearted / challenge_finalwaveform_onehearted
       -> same block, reusing player.redMax (already the 'onehearted' pattern)
     challenge_hollowchorus_speedkill / challenge_finalwaveform_speedkill
       -> same block, reusing game.runElapsed
     challenge_subdrop_frugal -> same block, reusing player.visitedShopThisRun
     challenge_finalwaveform_untouched_run -> same block, reusing player.tookDamageThisRun
     challenge_hollowchorus_speedrun / challenge_finalwaveform_speedrun
       -> game.js startFloor(), beside the existing 'deepdiver' floorNum===8 check
   ============================================================ */

addAchievement({ id:'challenge_hollowchorus_flawless', name:'Not a Note Out of Place', icon:'🎻',
  desc:'Defeat WobblerDNB without taking damage in its boss room.', category:'Challenge', trinketId:'stilledchord' });
addAchievement({ id:'challenge_finalwaveform_flawless', name:'Dead Silent', icon:'📟',
  desc:'Defeat SubdropDNB without taking damage in its boss room.', category:'Challenge', trinketId:'flatlinedcoil' });
addAchievement({ id:'challenge_hollowchorus_floor_nodamage', name:'Untouched Chorus', icon:'🛡️',
  desc:'Clear all of Floor 13 without taking any damage.', category:'Challenge', itemId:'hcfwtrophy_challenge_hc_floor_nodamage' });
addAchievement({ id:'challenge_finalwaveform_floor_nodamage', name:'Untouched Waveform', icon:'🛡️',
  desc:'Clear all of Floor 14 without taking any damage.', category:'Challenge', itemId:'hcfwtrophy_challenge_fw_floor_nodamage' });
addAchievement({ id:'challenge_hollowchorus_onehearted', name:'Single Beat', icon:'💔',
  desc:'Defeat WobblerDNB with only one red heart of maximum health.', category:'Challenge', itemId:'hcfwtrophy_challenge_hc_onehearted' });
addAchievement({ id:'challenge_finalwaveform_onehearted', name:'Single Frequency', icon:'💔',
  desc:'Defeat SubdropDNB with only one red heart of maximum health.', category:'Challenge', itemId:'hcfwtrophy_challenge_fw_onehearted' });
addAchievement({ id:'challenge_hollowchorus_speedkill', name:'Quick Coda', icon:'⏱️',
  desc:'Defeat WobblerDNB within 20 minutes of run time.', category:'Challenge', itemId:'hcfwtrophy_challenge_hc_speedkill' });
addAchievement({ id:'challenge_finalwaveform_speedkill', name:'Quick Flatline', icon:'⏱️',
  desc:'Defeat SubdropDNB within 26 minutes of run time.', category:'Challenge', itemId:'hcfwtrophy_challenge_fw_speedkill' });
addAchievement({ id:'challenge_subdrop_frugal', name:'Nothing Left to Spend', icon:'👛',
  desc:'Defeat SubdropDNB without ever visiting a shop this run.', category:'Challenge', trinketId:'threadbarepurse' });
addAchievement({ id:'challenge_finalwaveform_untouched_run', name:'Silent All the Way Down', icon:'🕊️',
  desc:'Defeat SubdropDNB having taken no damage at any point this run.', category:'Challenge', familiarId:'silentwake' });
addAchievement({ id:'challenge_hollowchorus_speedrun', name:'Racing the Beat', icon:'⏳',
  desc:'Reach Floor 13 within 22 minutes of run time.', category:'Challenge', itemId:'metronomecharm' });
addAchievement({ id:'challenge_finalwaveform_speedrun', name:'Racing the Flatline', icon:'⌚',
  desc:'Reach Floor 14 within 29 minutes of run time.', category:'Challenge', itemId:'cadencewatch' });

/* ============================================================
   EXPLORATION — floor milestones + first-encounter bestiary entries
   ============================================================
   exploration_reach_floor13 / _floor14: Predicate D, hand-wired in game.js
   startFloor() beside the existing 'deepdiver' (floorNum===8) check — exact
   same shape, floorNum===12/13. Everything else here is Predicate B
   (bestiarySection:'enemyKills', bestiaryId, threshold:1) riding the same
   bumpBestiaryCount() call combat.js's handleEnemyDeath already makes on every
   kill — no new code for those.
   ============================================================ */

addAchievement({ id:'exploration_reach_floor13', name:'The Hollow Chorus', icon:'🎼',
  desc:'Reach Floor 13.', category:'Exploration', itemId:'hcfwtrophy_exploration_floor13' });
addAchievement({ id:'exploration_reach_floor14', name:'The Final Waveform', icon:'📉',
  desc:'Reach Floor 14.', category:'Exploration', itemId:'hcfwtrophy_exploration_floor14' });
addAchievement({ id:'exploration_meet_lastovertone', name:'First Sight: The Last Overtone', icon:'👁️',
  desc:'Encounter and defeat The Last Overtone for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'lastovertone', threshold:1, itemId:'hcfwtrophy_exploration_meet_lastovertone' });
addAchievement({ id:'exploration_meet_hollowcantor', name:'First Sight: The Hollow Cantor', icon:'👁️',
  desc:'Encounter and defeat The Hollow Cantor for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'hollowcantor', threshold:1, itemId:'hcfwtrophy_exploration_meet_hollowcantor' });
addAchievement({ id:'exploration_meet_flatlinewraith', name:'First Sight: The Flatline Wraith', icon:'👁️',
  desc:'Encounter and defeat The Flatline Wraith for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'flatlinewraith', threshold:1, itemId:'hcfwtrophy_exploration_meet_flatlinewraith' });
addAchievement({ id:'exploration_meet_zeroamplitude', name:'First Sight: The Zero Amplitude', icon:'👁️',
  desc:'Encounter and defeat The Zero Amplitude for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'zeroamplitude', threshold:1, itemId:'hcfwtrophy_exploration_meet_zeroamplitude' });
addAchievement({ id:'exploration_meet_wobbler', name:'First Sight: WobblerDNB', icon:'👁️',
  desc:'Encounter and defeat WobblerDNB for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'wobbler', threshold:1, itemId:'hcfwtrophy_exploration_meet_wobbler' });
addAchievement({ id:'exploration_meet_subdrop', name:'First Sight: SubdropDNB', icon:'👁️',
  desc:'Encounter and defeat SubdropDNB for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'subdrop', threshold:1, itemId:'hcfwtrophy_exploration_meet_subdrop' });
addAchievement({ id:'exploration_meet_deadaircoda', name:'First Sight: Dead Air Coda', icon:'👁️',
  desc:'Encounter and defeat the DNB Dead Air Coda for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'deadaircoda', threshold:1, itemId:'hcfwtrophy_exploration_meet_deadaircoda' });
addAchievement({ id:'exploration_meet_flatlineburrower', name:'First Sight: Flatline Burrower', icon:'👁️',
  desc:'Encounter and defeat the DNB Flatline Burrower for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'flatlineburrower', threshold:1, itemId:'hcfwtrophy_exploration_meet_flatlineburrower' });
addAchievement({ id:'exploration_meet_silencestalker', name:'First Sight: Silence Stalker', icon:'👁️',
  desc:'Encounter and defeat the DNB Silence Stalker for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'silencestalker', threshold:1, itemId:'hcfwtrophy_exploration_meet_silencestalker' });
addAchievement({ id:'exploration_meet_decrescendosplitter', name:'First Sight: Decrescendo Splitter', icon:'👁️',
  desc:'Encounter and defeat the DNB Decrescendo Splitter for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'decrescendosplitter', threshold:1, itemId:'hcfwtrophy_exploration_meet_decrescendosplitter' });
addAchievement({ id:'exploration_meet_polyrhythm', name:'First Sight: Polyrhythm', icon:'👁️',
  desc:'Encounter and defeat the DNB Polyrhythm for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'polyrhythm', threshold:1, itemId:'hcfwtrophy_exploration_meet_polyrhythm' });
addAchievement({ id:'exploration_meet_tremorswarm', name:'First Sight: Tremor Swarm', icon:'👁️',
  desc:'Encounter and defeat the DNB Tremor Swarm for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'tremorswarm', threshold:1, itemId:'hcfwtrophy_exploration_meet_tremorswarm' });

/* ============================================================
   COLLECTION — distinct-breadth over JUST the floorKey '13'/'14' roster
   ============================================================
   No existing infra fits: addTierSet's distinct:true predicate (Predicate C)
   counts Object.keys() over an ENTIRE bestiary section bucket, not a scoped
   subset of ids within it — checkBestiaryAchievements (logic.js) has no id-list
   parameter. So this is a small bespoke Predicate D breadth check: the 3 id
   lists below, a single helper (checkHollowChorusFinalWaveformCollection, called
   from combat.js's handleEnemyDeath — see the audit for the exact call site),
   and 6 achievements it can unlock. All 3 lists read the SAME unlocks.bestiary.
   enemyKills bucket combat.js already writes on every kill (bumpBestiaryCount) —
   no new stat, no new bestiary bucket, just a scoped count over it. */
const HOLLOWCHORUS_ROSTER_IDS = ['onbeatstalker', 'downbeatbrute', 'crescendocharger', 'apexmarksman', 'codablinker', 'resonancewarden', 'finalemortar', 'goldenmites', 'polyrhythm', 'fermatasentry', 'syncopehopper', 'tremorswarm', 'lastovertone', 'hollowcantor'];
const FINALWAVEFORM_ROSTER_IDS = ['deadaircoda', 'flatlineburrower', 'silencestalker', 'decrescendosplitter', 'flatlinewraith', 'zeroamplitude'];
const MAINROUTE_1314_SUPERBOSS_IDS = ['wobbler', 'subdrop'];
// the exact set combat.js's handleEnemyDeath tests before bothering to call the
// checker below — 22 ids total, a tiny fraction of the ~265-entry enemyKills space
const HOLLOWCHORUS_FINALWAVEFORM_WATCH_IDS = new Set(
  HOLLOWCHORUS_ROSTER_IDS.concat(FINALWAVEFORM_ROSTER_IDS, MAINROUTE_1314_SUPERBOSS_IDS));
function checkHollowChorusFinalWaveformCollection(game){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const bucket = unlocks.bestiary.enemyKills;
  const countIn = ids => ids.reduce((n, id) => n + (bucket[id] ? 1 : 0), 0);
  const hc = countIn(HOLLOWCHORUS_ROSTER_IDS), fw = countIn(FINALWAVEFORM_ROSTER_IDS), sb = countIn(MAINROUTE_1314_SUPERBOSS_IDS);
  if (hc >= 7) unlockAchievement('collection_hollowchorus_roster_t1', game);
  if (hc >= 14) unlockAchievement('collection_hollowchorus_roster_t2', game);
  if (fw >= 3) unlockAchievement('collection_finalwaveform_roster_t1', game);
  if (fw >= 6) unlockAchievement('collection_finalwaveform_roster_t2', game);
  if (sb >= 2) unlockAchievement('collection_mainroute_superbosses', game);
  if (hc + fw + sb >= 22) unlockAchievement('collection_grandcollection_1314', game);
}

addAchievement({ id:'collection_hollowchorus_roster_t1', name:'Chorus Fragments', icon:'🧩',
  desc:'Encounter and defeat 7 different kinds of Hollow Chorus foe (Floor 13 regular roster + its 2 bosses).', category:'Collection', itemId:'hcfwtrophy_collection_hc_roster_t1' });
addAchievement({ id:'collection_hollowchorus_roster_t2', name:'The Whole Chorus', icon:'🎶',
  desc:'Encounter and defeat all 14 kinds of Hollow Chorus foe — Floor 13 full regular + boss roster.', category:'Collection', familiarId:'lastchordmoth' });
addAchievement({ id:'collection_finalwaveform_roster_t1', name:'Waveform Fragments', icon:'🧩',
  desc:'Encounter and defeat 3 different kinds of Final Waveform foe (Floor 14 regular roster + its 2 bosses).', category:'Collection', itemId:'hcfwtrophy_collection_fw_roster_t1' });
addAchievement({ id:'collection_finalwaveform_roster_t2', name:'The Whole Waveform', icon:'📡',
  desc:'Encounter and defeat all 6 kinds of Final Waveform foe — Floor 14 full regular + boss roster.', category:'Collection', itemId:'lastwaveformcore' });
addAchievement({ id:'collection_mainroute_superbosses', name:'Twin Silence', icon:'〰️',
  desc:'Encounter and defeat both WobblerDNB and SubdropDNB.', category:'Collection', itemId:'hcfwtrophy_collection_mainroute_sb' });
addAchievement({ id:'collection_grandcollection_1314', name:'Nothing Left Playing', icon:'🥁',
  desc:'Encounter and defeat all 22 foes of the Hollow Chorus and Final Waveform — every regular enemy, boss, and superboss of floors 13 and 14.', category:'Collection', trinketId:'lastbarritual' });

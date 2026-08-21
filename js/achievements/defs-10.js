'use strict';
// achievements/defs-10.js — Phase 7h (cont.): The Orrery (floorKeys '6D'/'7D',
// D-branch region 2) achievement batch — second of ~4 sequential sub-batches
// covering the D-branch's ~800-achievement allocation. See feature-research/
// phase7h-dbranch-achievements/audit-orrery.md for the full design rationale,
// reward-economy findings, and verification output.
//
// Reward-economy summary: shopDiscount/pillColorId/enemyId are re-confirmed
// fully exhausted, unchanged from defs-7f/7g/7h(Observatory)'s own findings.
// Verified before writing: no existing achievement references any of 6D's/
// 7D's 66 enemy ids or 'orrery' (grep across js/achievements/defs-*.js came
// back empty), so no second-ladder workaround is needed anywhere in this
// file. Same shape as defs-9.js's Observatory batch (2 floorKeys, 66 enemies,
// 1 superboss): the BULK is a 2-tier Slayer ladder (10/40) over the FULL
// 66-enemy roster, with a 3rd tier (threshold 100) added for 12 flagship
// enemies (6 per floorKey, one per distinct AI behavior family: splitter/
// summoner/shielder/ambusher/sniper/teleporter) granting a unique capstone
// reward instead of another trophy. Every non-capstone rung mints a
// brand-new 'ortrophy_' trophy passive (locked:true, unlockedBy), cycling
// the same five +1-stat archetypes defs-7f/7g/7h(Observatory) used (Luck /
// speed / melee / ranged / recharge). Orrery-themed (polished brass
// clockwork rings, turning gears, orbiting mechanisms, deep indigo sky,
// accent #e0b45a).

/* ============================================================
   SLAYER — bestiary kill-count ladders over the FULL '6D'+'7D' roster
   ============================================================
   2-tier ladders (10/40) for all 66 enemies (33 per floorKey). 12 flagship
   enemies (6 per floorKey, one per distinct AI behavior: splitter/summoner/
   shielder/ambusher/sniper/teleporter) get a 3rd tier (threshold 100)
   granting a unique capstone reward instead of another trophy passive.
   ============================================================ */

// ---- 6D roster (33) ----
addTierSet({ baseId:'slayer_gearhound', name:'Gearhound Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gearhound',
  desc: n => 'Defeat ' + n + ' of the DNB Gearhound.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_gearhound_t1' }, { threshold:40, itemId:'ortrophy_slayer_gearhound_t2' } ] });

addTierSet({ baseId:'slayer_cogmoth', name:'Cogmoth Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cogmoth',
  desc: n => 'Defeat ' + n + ' of the DNB Cogmoth.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_cogmoth_t1' }, { threshold:40, itemId:'ortrophy_slayer_cogmoth_t2' } ] });

addTierSet({ baseId:'slayer_sparkcog', name:'Spark Cog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sparkcog',
  desc: n => 'Defeat ' + n + ' of the DNB Spark Cog.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_sparkcog_t1' }, { threshold:40, itemId:'ortrophy_slayer_sparkcog_t2' } ] });

addTierSet({ baseId:'slayer_brassplate', name:'Brass Plate Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brassplate',
  desc: n => 'Defeat ' + n + ' of the DNB Brass Plate.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_brassplate_t1' }, { threshold:40, itemId:'ortrophy_slayer_brassplate_t2' } ] });

addTierSet({ baseId:'slayer_ringrammer', name:'Ring Rammer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ringrammer',
  desc: n => 'Defeat ' + n + ' of the DNB Ring Rammer.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ringrammer_t1' }, { threshold:40, itemId:'ortrophy_slayer_ringrammer_t2' } ] });

addTierSet({ baseId:'slayer_meridianturret', name:'Meridian Turret Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'meridianturret',
  desc: n => 'Defeat ' + n + ' of the DNB Meridian Turret.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_meridianturret_t1' }, { threshold:40, itemId:'ortrophy_slayer_meridianturret_t2' } ] });

addTierSet({ baseId:'slayer_cogspring', name:'Cog Spring Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cogspring',
  desc: n => 'Defeat ' + n + ' of the DNB Cog Spring.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_cogspring_t1' }, { threshold:40, itemId:'ortrophy_slayer_cogspring_t2' } ] });

addTierSet({ baseId:'slayer_gearslinger', name:'Gearslinger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gearslinger',
  desc: n => 'Defeat ' + n + ' of the DNB Gearslinger.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_gearslinger_t1' }, { threshold:40, itemId:'ortrophy_slayer_gearslinger_t2' } ] });

addTierSet({ baseId:'slayer_gyromortar', name:'Gyro Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gyromortar',
  desc: n => 'Defeat ' + n + ' of the DNB Gyro Mortar.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_gyromortar_t1' }, { threshold:40, itemId:'ortrophy_slayer_gyromortar_t2' } ] });

addTierSet({ baseId:'slayer_ringweaver', name:'Ring Weaver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ringweaver',
  desc: n => 'Defeat ' + n + ' of the DNB Ring Weaver.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ringweaver_t1' }, { threshold:40, itemId:'ortrophy_slayer_ringweaver_t2' } ] });

addTierSet({ baseId:'slayer_clockwatcher', name:'Clock Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'clockwatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Clock Watcher.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_clockwatcher_t1' }, { threshold:40, itemId:'ortrophy_slayer_clockwatcher_t2' } ] });

addTierSet({ baseId:'slayer_epicycler', name:'Epicycler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'epicycler',
  desc: n => 'Defeat ' + n + ' of the DNB Epicycler.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_epicycler_t1' }, { threshold:40, itemId:'ortrophy_slayer_epicycler_t2' } ] });

addTierSet({ baseId:'slayer_gearworm', name:'Gearworm Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gearworm',
  desc: n => 'Defeat ' + n + ' of the DNB Gearworm.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_gearworm_t1' }, { threshold:40, itemId:'ortrophy_slayer_gearworm_t2' } ] });

addTierSet({ baseId:'slayer_cogmites', name:'Cog Mites Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cogmites',
  desc: n => 'Defeat ' + n + ' of the DNB Cog Mites.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_cogmites_t1' }, { threshold:40, itemId:'ortrophy_slayer_cogmites_t2' } ] });

addTierSet({ baseId:'slayer_geartwin', name:'Gear Twin Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'geartwin',
  desc: n => 'Defeat ' + n + ' of the DNB Gear Twin.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_geartwin_t1' }, { threshold:40, itemId:'ortrophy_slayer_geartwin_t2' }, { threshold:100, itemId:'gearclutchcore' } ] });

addTierSet({ baseId:'slayer_meridiancaller', name:'Meridian Caller Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'meridiancaller',
  desc: n => 'Defeat ' + n + ' of the DNB Meridian Caller.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_meridiancaller_t1' }, { threshold:40, itemId:'ortrophy_slayer_meridiancaller_t2' }, { threshold:100, trinketId:'meridiansummonschit' } ] });

addTierSet({ baseId:'slayer_gearmender', name:'Gear Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gearmender',
  desc: n => 'Defeat ' + n + ' of the DNB Gear Mender.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_gearmender_t1' }, { threshold:40, itemId:'ortrophy_slayer_gearmender_t2' } ] });

addTierSet({ baseId:'slayer_ringwarden', name:'Ring Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ringwarden',
  desc: n => 'Defeat ' + n + ' of the DNB Ring Warden.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ringwarden_t1' }, { threshold:40, itemId:'ortrophy_slayer_ringwarden_t2' }, { threshold:100, itemId:'ringwardenplating' } ] });

addTierSet({ baseId:'slayer_meridianmarksman', name:'Meridian Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'meridianmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Meridian Marksman.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_meridianmarksman_t1' }, { threshold:40, itemId:'ortrophy_slayer_meridianmarksman_t2' }, { threshold:100, familiarId:'meridianmarksmandrone' } ] });

addTierSet({ baseId:'slayer_gearblink', name:'Gear Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gearblink',
  desc: n => 'Defeat ' + n + ' of the DNB Gear Blink.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_gearblink_t1' }, { threshold:40, itemId:'ortrophy_slayer_gearblink_t2' }, { threshold:100, itemId:'gearblinkanchor' } ] });

addTierSet({ baseId:'slayer_shadowcog', name:'Shadow Cog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'shadowcog',
  desc: n => 'Defeat ' + n + ' of the DNB Shadow Cog.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_shadowcog_t1' }, { threshold:40, itemId:'ortrophy_slayer_shadowcog_t2' }, { threshold:100, trinketId:'shadowcogveil' } ] });

addTierSet({ baseId:'slayer_ironhound', name:'Iron Hound Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ironhound',
  desc: n => 'Defeat ' + n + ' of the DNB Iron Hound.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ironhound_t1' }, { threshold:40, itemId:'ortrophy_slayer_ironhound_t2' } ] });

addTierSet({ baseId:'slayer_sparkrunner', name:'Spark Runner Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sparkrunner',
  desc: n => 'Defeat ' + n + ' of the DNB Spark Runner.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_sparkrunner_t1' }, { threshold:40, itemId:'ortrophy_slayer_sparkrunner_t2' } ] });

addTierSet({ baseId:'slayer_cogslinger', name:'Cog Slinger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cogslinger',
  desc: n => 'Defeat ' + n + ' of the DNB Cog Slinger.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_cogslinger_t1' }, { threshold:40, itemId:'ortrophy_slayer_cogslinger_t2' } ] });

addTierSet({ baseId:'slayer_fusegear', name:'Fuse Gear Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'fusegear',
  desc: n => 'Defeat ' + n + ' of the DNB Fuse Gear.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_fusegear_t1' }, { threshold:40, itemId:'ortrophy_slayer_fusegear_t2' } ] });

addTierSet({ baseId:'slayer_ringmoth', name:'Ring Moth Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ringmoth',
  desc: n => 'Defeat ' + n + ' of the DNB Ring Moth.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ringmoth_t1' }, { threshold:40, itemId:'ortrophy_slayer_ringmoth_t2' } ] });

addTierSet({ baseId:'slayer_bronzeram', name:'Bronze Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'bronzeram',
  desc: n => 'Defeat ' + n + ' of the DNB Bronze Ram.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_bronzeram_t1' }, { threshold:40, itemId:'ortrophy_slayer_bronzeram_t2' } ] });

addTierSet({ baseId:'slayer_orbitmortar', name:'Orbit Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'orbitmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Orbit Mortar.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_orbitmortar_t1' }, { threshold:40, itemId:'ortrophy_slayer_orbitmortar_t2' } ] });

addTierSet({ baseId:'slayer_cogtunneler', name:'Cog Tunneler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cogtunneler',
  desc: n => 'Defeat ' + n + ' of the DNB Cog Tunneler.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_cogtunneler_t1' }, { threshold:40, itemId:'ortrophy_slayer_cogtunneler_t2' } ] });

addTierSet({ baseId:'slayer_ringsatellite', name:'Ring Satellite Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ringsatellite',
  desc: n => 'Defeat ' + n + ' of the DNB Ring Satellite.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ringsatellite_t1' }, { threshold:40, itemId:'ortrophy_slayer_ringsatellite_t2' } ] });

addTierSet({ baseId:'slayer_gearsentinel', name:'Gear Sentinel Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gearsentinel',
  desc: n => 'Defeat ' + n + ' of the DNB Gear Sentinel.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_gearsentinel_t1' }, { threshold:40, itemId:'ortrophy_slayer_gearsentinel_t2' } ] });

addTierSet({ baseId:'slayer_cogblink', name:'Cog Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cogblink',
  desc: n => 'Defeat ' + n + ' of the DNB Cog Blink.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_cogblink_t1' }, { threshold:40, itemId:'ortrophy_slayer_cogblink_t2' } ] });

addTierSet({ baseId:'slayer_bronzebulwark', name:'Bronze Bulwark Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'bronzebulwark',
  desc: n => 'Defeat ' + n + ' of the DNB Bronze Bulwark.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_bronzebulwark_t1' }, { threshold:40, itemId:'ortrophy_slayer_bronzebulwark_t2' } ] });

// ---- 7D roster (33) ----
addTierSet({ baseId:'slayer_zenithhound', name:'Zenith Hound Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'zenithhound',
  desc: n => 'Defeat ' + n + ' of the DNB Zenith Hound.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_zenithhound_t1' }, { threshold:40, itemId:'ortrophy_slayer_zenithhound_t2' } ] });

addTierSet({ baseId:'slayer_starcog', name:'Star Cog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'starcog',
  desc: n => 'Defeat ' + n + ' of the DNB Star Cog.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_starcog_t1' }, { threshold:40, itemId:'ortrophy_slayer_starcog_t2' } ] });

addTierSet({ baseId:'slayer_novagear', name:'Nova Gear Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'novagear',
  desc: n => 'Defeat ' + n + ' of the DNB Nova Gear.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_novagear_t1' }, { threshold:40, itemId:'ortrophy_slayer_novagear_t2' } ] });

addTierSet({ baseId:'slayer_ironplate', name:'Iron Plate Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ironplate',
  desc: n => 'Defeat ' + n + ' of the DNB Iron Plate.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ironplate_t1' }, { threshold:40, itemId:'ortrophy_slayer_ironplate_t2' } ] });

addTierSet({ baseId:'slayer_zenithram', name:'Zenith Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'zenithram',
  desc: n => 'Defeat ' + n + ' of the DNB Zenith Ram.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_zenithram_t1' }, { threshold:40, itemId:'ortrophy_slayer_zenithram_t2' } ] });

addTierSet({ baseId:'slayer_apexturret', name:'Apex Turret Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'apexturret',
  desc: n => 'Defeat ' + n + ' of the DNB Apex Turret.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_apexturret_t1' }, { threshold:40, itemId:'ortrophy_slayer_apexturret_t2' } ] });

addTierSet({ baseId:'slayer_springcoil', name:'Spring Coil Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'springcoil',
  desc: n => 'Defeat ' + n + ' of the DNB Spring Coil.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_springcoil_t1' }, { threshold:40, itemId:'ortrophy_slayer_springcoil_t2' } ] });

addTierSet({ baseId:'slayer_zenithslinger', name:'Zenith Slinger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'zenithslinger',
  desc: n => 'Defeat ' + n + ' of the DNB Zenith Slinger.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_zenithslinger_t1' }, { threshold:40, itemId:'ortrophy_slayer_zenithslinger_t2' } ] });

addTierSet({ baseId:'slayer_heavygyro', name:'Heavy Gyro Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'heavygyro',
  desc: n => 'Defeat ' + n + ' of the DNB Heavy Gyro.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_heavygyro_t1' }, { threshold:40, itemId:'ortrophy_slayer_heavygyro_t2' } ] });

addTierSet({ baseId:'slayer_braidring', name:'Braid Ring Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'braidring',
  desc: n => 'Defeat ' + n + ' of the DNB Braid Ring.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_braidring_t1' }, { threshold:40, itemId:'ortrophy_slayer_braidring_t2' } ] });

addTierSet({ baseId:'slayer_apexwatcher', name:'Apex Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'apexwatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Apex Watcher.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_apexwatcher_t1' }, { threshold:40, itemId:'ortrophy_slayer_apexwatcher_t2' } ] });

addTierSet({ baseId:'slayer_grandepicycler', name:'Grand Epicycler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'grandepicycler',
  desc: n => 'Defeat ' + n + ' of the DNB Grand Epicycler.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_grandepicycler_t1' }, { threshold:40, itemId:'ortrophy_slayer_grandepicycler_t2' } ] });

addTierSet({ baseId:'slayer_ironworm', name:'Iron Worm Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ironworm',
  desc: n => 'Defeat ' + n + ' of the DNB Iron Worm.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ironworm_t1' }, { threshold:40, itemId:'ortrophy_slayer_ironworm_t2' } ] });

addTierSet({ baseId:'slayer_meridianmites', name:'Meridian Mites Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'meridianmites',
  desc: n => 'Defeat ' + n + ' of the DNB Meridian Mites.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_meridianmites_t1' }, { threshold:40, itemId:'ortrophy_slayer_meridianmites_t2' } ] });

addTierSet({ baseId:'slayer_geartriad', name:'Gear Triad Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'geartriad',
  desc: n => 'Defeat ' + n + ' of the DNB Gear Triad.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_geartriad_t1' }, { threshold:40, itemId:'ortrophy_slayer_geartriad_t2' }, { threshold:100, itemId:'geartriadcore' } ] });

addTierSet({ baseId:'slayer_zenithcaller', name:'Zenith Caller Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'zenithcaller',
  desc: n => 'Defeat ' + n + ' of the DNB Zenith Caller.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_zenithcaller_t1' }, { threshold:40, itemId:'ortrophy_slayer_zenithcaller_t2' }, { threshold:100, trinketId:'zenithsummonschit' } ] });

addTierSet({ baseId:'slayer_ringmender', name:'Ring Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ringmender',
  desc: n => 'Defeat ' + n + ' of the DNB Ring Mender.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ringmender_t1' }, { threshold:40, itemId:'ortrophy_slayer_ringmender_t2' } ] });

addTierSet({ baseId:'slayer_apexwarden', name:'Apex Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'apexwarden',
  desc: n => 'Defeat ' + n + ' of the DNB Apex Warden.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_apexwarden_t1' }, { threshold:40, itemId:'ortrophy_slayer_apexwarden_t2' }, { threshold:100, itemId:'apexwardenplating' } ] });

addTierSet({ baseId:'slayer_apexsniper', name:'Apex Sniper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'apexsniper',
  desc: n => 'Defeat ' + n + ' of the DNB Apex Sniper.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_apexsniper_t1' }, { threshold:40, itemId:'ortrophy_slayer_apexsniper_t2' }, { threshold:100, familiarId:'apexsniperdrone' } ] });

addTierSet({ baseId:'slayer_ringblink', name:'Ring Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ringblink',
  desc: n => 'Defeat ' + n + ' of the DNB Ring Blink.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ringblink_t1' }, { threshold:40, itemId:'ortrophy_slayer_ringblink_t2' }, { threshold:100, itemId:'ringblinkanchor' } ] });

addTierSet({ baseId:'slayer_nightgear', name:'Night Gear Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'nightgear',
  desc: n => 'Defeat ' + n + ' of the DNB Night Gear.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_nightgear_t1' }, { threshold:40, itemId:'ortrophy_slayer_nightgear_t2' }, { threshold:100, trinketId:'nightgearveil' } ] });

addTierSet({ baseId:'slayer_titanhound', name:'Titan Hound Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'titanhound',
  desc: n => 'Defeat ' + n + ' of the DNB Titan Hound.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_titanhound_t1' }, { threshold:40, itemId:'ortrophy_slayer_titanhound_t2' } ] });

addTierSet({ baseId:'slayer_cometrunner', name:'Comet Runner Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cometrunner',
  desc: n => 'Defeat ' + n + ' of the DNB Comet Runner.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_cometrunner_t1' }, { threshold:40, itemId:'ortrophy_slayer_cometrunner_t2' } ] });

addTierSet({ baseId:'slayer_apexslinger', name:'Apex Slinger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'apexslinger',
  desc: n => 'Defeat ' + n + ' of the DNB Apex Slinger.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_apexslinger_t1' }, { threshold:40, itemId:'ortrophy_slayer_apexslinger_t2' } ] });

addTierSet({ baseId:'slayer_shrapnelgear', name:'Shrapnel Gear Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'shrapnelgear',
  desc: n => 'Defeat ' + n + ' of the DNB Shrapnel Gear.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_shrapnelgear_t1' }, { threshold:40, itemId:'ortrophy_slayer_shrapnelgear_t2' } ] });

addTierSet({ baseId:'slayer_duskcog', name:'Dusk Cog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'duskcog',
  desc: n => 'Defeat ' + n + ' of the DNB Dusk Cog.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_duskcog_t1' }, { threshold:40, itemId:'ortrophy_slayer_duskcog_t2' } ] });

addTierSet({ baseId:'slayer_ironram', name:'Iron Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ironram',
  desc: n => 'Defeat ' + n + ' of the DNB Iron Ram.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ironram_t1' }, { threshold:40, itemId:'ortrophy_slayer_ironram_t2' } ] });

addTierSet({ baseId:'slayer_apexmortar', name:'Apex Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'apexmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Apex Mortar.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_apexmortar_t1' }, { threshold:40, itemId:'ortrophy_slayer_apexmortar_t2' } ] });

addTierSet({ baseId:'slayer_irontunneler', name:'Iron Tunneler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'irontunneler',
  desc: n => 'Defeat ' + n + ' of the DNB Iron Tunneler.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_irontunneler_t1' }, { threshold:40, itemId:'ortrophy_slayer_irontunneler_t2' } ] });

addTierSet({ baseId:'slayer_grandsatellite', name:'Grand Satellite Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'grandsatellite',
  desc: n => 'Defeat ' + n + ' of the DNB Grand Satellite.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_grandsatellite_t1' }, { threshold:40, itemId:'ortrophy_slayer_grandsatellite_t2' } ] });

addTierSet({ baseId:'slayer_zenithsentinel', name:'Zenith Sentinel Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'zenithsentinel',
  desc: n => 'Defeat ' + n + ' of the DNB Zenith Sentinel.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_zenithsentinel_t1' }, { threshold:40, itemId:'ortrophy_slayer_zenithsentinel_t2' } ] });

addTierSet({ baseId:'slayer_apexblink', name:'Apex Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'apexblink',
  desc: n => 'Defeat ' + n + ' of the DNB Apex Blink.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_apexblink_t1' }, { threshold:40, itemId:'ortrophy_slayer_apexblink_t2' } ] });

addTierSet({ baseId:'slayer_ironbulwark', name:'Iron Bulwark Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ironbulwark',
  desc: n => 'Defeat ' + n + ' of the DNB Iron Bulwark.',
  tiers:[ { threshold:10, itemId:'ortrophy_slayer_ironbulwark_t1' }, { threshold:40, itemId:'ortrophy_slayer_ironbulwark_t2' } ] });


/* ============================================================
   CHALLENGE — hand-wired Predicate D feats for the superboss `orrery`
   and the 6D/7D floors
   ============================================================
   Every id below has exactly one unlockAchievement() call site:
     challenge_orrery_flawless -> game.js onBossDefeated(), new orrery
       block mirroring the existing wobbler/subdrop/mangrove/astrolabe
       blocks, reusing player.tookDamageThisBossRoom — no new stat.
     challenge_orrery_floor_nodamage -> same block, reusing
       player.tookDamageThisFloor.
     challenge_orrery_onehearted -> same block, reusing player.redMax.
     challenge_orrery_speedkill -> same block, reusing game.runElapsed.
     challenge_orrery_frugal -> same block, reusing player.visitedShopThisRun.
     challenge_orrery_untouched_run -> same block, reusing
       player.tookDamageThisRun.
     challenge_orrery_6d_speedrun / _7d_speedrun -> game.js startFloor(),
       beside the existing floorPath==='D' block's floorNum===5/6 cases —
       exact same shape as defs-9's own speedrun checks.
   ============================================================ */

addAchievement({ id:'challenge_orrery_flawless', name:'Not a Gear Turned', icon:'⚙️',
  desc:'Defeat Orrery DNB without taking damage in its boss room.', category:'Challenge', trinketId:'stillmechanism' });
addAchievement({ id:'challenge_orrery_floor_nodamage', name:'Untouched Mechanism', icon:'🛡️',
  desc:'Clear all of Floor 7D without taking any damage.', category:'Challenge', itemId:'ortrophy_challenge_floor_nodamage' });
addAchievement({ id:'challenge_orrery_onehearted', name:'One Gear Left', icon:'💔',
  desc:'Defeat Orrery DNB with only one red heart of maximum health.', category:'Challenge', itemId:'ortrophy_challenge_onehearted' });
addAchievement({ id:'challenge_orrery_speedkill', name:'Quick Rotation', icon:'⏱️',
  desc:'Defeat Orrery DNB within 28 minutes of run time.', category:'Challenge', itemId:'ortrophy_challenge_speedkill' });
addAchievement({ id:'challenge_orrery_frugal', name:'Nothing Bought Among the Gears', icon:'👛',
  desc:'Defeat Orrery DNB without ever visiting a shop this run.', category:'Challenge', trinketId:'emptygearbox' });
addAchievement({ id:'challenge_orrery_untouched_run', name:'Never Once Caught in the Works', icon:'🕊️',
  desc:'Defeat Orrery DNB having taken no damage at any point this run.', category:'Challenge', familiarId:'gearworkwisp' });
addAchievement({ id:'challenge_orrery_6d_speedrun', name:'Racing the Rings', icon:'⏳',
  desc:'Reach Floor 6D within 22 minutes of run time.', category:'Challenge', itemId:'brassringchronometer' });
addAchievement({ id:'challenge_orrery_7d_speedrun', name:'Racing the Mechanism', icon:'⌚',
  desc:'Reach Floor 7D within 26 minutes of run time.', category:'Challenge', itemId:'apexchronometer' });


/* ============================================================
   EXPLORATION — per-floorKey reach milestones + first-encounter bestiary
   entries for a representative slice of both rosters
   ============================================================
   exploration_reach_6d / _7d: Predicate D, hand-wired in game.js startFloor()
   beside the existing floorPath==='D' pendingBossType chain — exact same
   shape as defs-9's own floor-reach checks (floorNum===3/4, here 5/6). Every
   other achievement here is Predicate B (bestiarySection:'enemyKills',
   bestiaryId, threshold:1) riding the same bumpBestiaryCount() call
   combat.js's handleEnemyDeath already makes on every kill — no new code
   for those, including exploration_meet_orrery (the superboss kill also
   flows through handleEnemyDeath, same as defs-9's meet_astrolabe entry).
   ============================================================ */

addAchievement({ id:'exploration_reach_6d', name:'The Orrery', icon:'⚙️',
  desc:'Reach Floor 6D.', category:'Exploration', itemId:'ortrophy_exploration_floor6d' });
addAchievement({ id:'exploration_reach_7d', name:'Among the Turning Rings', icon:'🪐',
  desc:'Reach Floor 7D.', category:'Exploration', itemId:'ortrophy_exploration_floor7d' });
addAchievement({ id:'exploration_meet_orrery', name:'First Sight: Orrery DNB', icon:'👁️',
  desc:'Encounter and defeat Orrery DNB for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'orrery', threshold:1, itemId:'ortrophy_exploration_meet_orrery' });

// ---- 6D first-sight slice (9 of 33) ----
addAchievement({ id:'exploration_meet_gearhound', name:'First Sight: Gearhound', icon:'👁️',
  desc:'Encounter and defeat the DNB Gearhound for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'gearhound', threshold:1, itemId:'ortrophy_meet_gearhound' });
addAchievement({ id:'exploration_meet_cogmoth', name:'First Sight: Cogmoth', icon:'👁️',
  desc:'Encounter and defeat the DNB Cogmoth for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'cogmoth', threshold:1, itemId:'ortrophy_meet_cogmoth' });
addAchievement({ id:'exploration_meet_sparkcog', name:'First Sight: Spark Cog', icon:'👁️',
  desc:'Encounter and defeat the DNB Spark Cog for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'sparkcog', threshold:1, itemId:'ortrophy_meet_sparkcog' });
addAchievement({ id:'exploration_meet_brassplate', name:'First Sight: Brass Plate', icon:'👁️',
  desc:'Encounter and defeat the DNB Brass Plate for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'brassplate', threshold:1, itemId:'ortrophy_meet_brassplate' });
addAchievement({ id:'exploration_meet_ringrammer', name:'First Sight: Ring Rammer', icon:'👁️',
  desc:'Encounter and defeat the DNB Ring Rammer for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'ringrammer', threshold:1, itemId:'ortrophy_meet_ringrammer' });
addAchievement({ id:'exploration_meet_meridianturret', name:'First Sight: Meridian Turret', icon:'👁️',
  desc:'Encounter and defeat the DNB Meridian Turret for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'meridianturret', threshold:1, itemId:'ortrophy_meet_meridianturret' });
addAchievement({ id:'exploration_meet_cogspring', name:'First Sight: Cog Spring', icon:'👁️',
  desc:'Encounter and defeat the DNB Cog Spring for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'cogspring', threshold:1, itemId:'ortrophy_meet_cogspring' });
addAchievement({ id:'exploration_meet_gearslinger', name:'First Sight: Gearslinger', icon:'👁️',
  desc:'Encounter and defeat the DNB Gearslinger for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'gearslinger', threshold:1, itemId:'ortrophy_meet_gearslinger' });
addAchievement({ id:'exploration_meet_gyromortar', name:'First Sight: Gyro Mortar', icon:'👁️',
  desc:'Encounter and defeat the DNB Gyro Mortar for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'gyromortar', threshold:1, itemId:'ortrophy_meet_gyromortar' });
// ---- 7D first-sight slice (9 of 33) ----
addAchievement({ id:'exploration_meet_zenithhound', name:'First Sight: Zenith Hound', icon:'👁️',
  desc:'Encounter and defeat the DNB Zenith Hound for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'zenithhound', threshold:1, itemId:'ortrophy_meet_zenithhound' });
addAchievement({ id:'exploration_meet_starcog', name:'First Sight: Star Cog', icon:'👁️',
  desc:'Encounter and defeat the DNB Star Cog for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'starcog', threshold:1, itemId:'ortrophy_meet_starcog' });
addAchievement({ id:'exploration_meet_novagear', name:'First Sight: Nova Gear', icon:'👁️',
  desc:'Encounter and defeat the DNB Nova Gear for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'novagear', threshold:1, itemId:'ortrophy_meet_novagear' });
addAchievement({ id:'exploration_meet_ironplate', name:'First Sight: Iron Plate', icon:'👁️',
  desc:'Encounter and defeat the DNB Iron Plate for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'ironplate', threshold:1, itemId:'ortrophy_meet_ironplate' });
addAchievement({ id:'exploration_meet_zenithram', name:'First Sight: Zenith Ram', icon:'👁️',
  desc:'Encounter and defeat the DNB Zenith Ram for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'zenithram', threshold:1, itemId:'ortrophy_meet_zenithram' });
addAchievement({ id:'exploration_meet_apexturret', name:'First Sight: Apex Turret', icon:'👁️',
  desc:'Encounter and defeat the DNB Apex Turret for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'apexturret', threshold:1, itemId:'ortrophy_meet_apexturret' });
addAchievement({ id:'exploration_meet_springcoil', name:'First Sight: Spring Coil', icon:'👁️',
  desc:'Encounter and defeat the DNB Spring Coil for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'springcoil', threshold:1, itemId:'ortrophy_meet_springcoil' });
addAchievement({ id:'exploration_meet_zenithslinger', name:'First Sight: Zenith Slinger', icon:'👁️',
  desc:'Encounter and defeat the DNB Zenith Slinger for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'zenithslinger', threshold:1, itemId:'ortrophy_meet_zenithslinger' });
addAchievement({ id:'exploration_meet_heavygyro', name:'First Sight: Heavy Gyro', icon:'👁️',
  desc:'Encounter and defeat the DNB Heavy Gyro for the first time.', category:'Exploration', bestiarySection:'enemyKills', bestiaryId:'heavygyro', threshold:1, itemId:'ortrophy_meet_heavygyro' });

/* ============================================================
   COLLECTION — distinct-breadth over the '6D' roster, the '7D' roster, and
   the combined Orrery region
   ============================================================
   Same bespoke-breadth-check shape defs-9's checkObservatoryCollection used
   (addTierSet's distinct:true predicate counts an entire bestiary section
   bucket, not a scoped id subset — no built-in predicate fits). One helper
   (checkOrreryCollection, called from combat-2.js's handleEnemyDeath — see
   the audit for the exact call site), 7 achievements it can unlock. Reads
   the SAME unlocks.bestiary.enemyKills bucket combat.js already writes on
   every kill — no new stat, no new bestiary bucket, just a scoped count.
   ============================================================ */

const ORRERY_6D_ROSTER_IDS = ["gearhound","cogmoth","sparkcog","brassplate","ringrammer","meridianturret","cogspring","gearslinger","gyromortar","ringweaver","clockwatcher","epicycler","gearworm","cogmites","geartwin","meridiancaller","gearmender","ringwarden","meridianmarksman","gearblink","shadowcog","ironhound","sparkrunner","cogslinger","fusegear","ringmoth","bronzeram","orbitmortar","cogtunneler","ringsatellite","gearsentinel","cogblink","bronzebulwark"];
const ORRERY_7D_ROSTER_IDS = ["zenithhound","starcog","novagear","ironplate","zenithram","apexturret","springcoil","zenithslinger","heavygyro","braidring","apexwatcher","grandepicycler","ironworm","meridianmites","geartriad","zenithcaller","ringmender","apexwarden","apexsniper","ringblink","nightgear","titanhound","cometrunner","apexslinger","shrapnelgear","duskcog","ironram","apexmortar","irontunneler","grandsatellite","zenithsentinel","apexblink","ironbulwark"];
const ORRERY_SUPERBOSS_IDS = ['orrery'];
// the exact set combat-2.js's handleEnemyDeath tests before bothering to call
// the checker below — 67 ids total, a tiny fraction of the enemyKills space
const ORRERY_WATCH_IDS = new Set(ORRERY_6D_ROSTER_IDS.concat(ORRERY_7D_ROSTER_IDS, ORRERY_SUPERBOSS_IDS));
function checkOrreryCollection(game){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const bucket = unlocks.bestiary.enemyKills;
  const countIn = ids => ids.reduce((n, id) => n + (bucket[id] ? 1 : 0), 0);
  const d6 = countIn(ORRERY_6D_ROSTER_IDS), d7 = countIn(ORRERY_7D_ROSTER_IDS), sb = countIn(ORRERY_SUPERBOSS_IDS);
  if (d6 >= 11) unlockAchievement('collection_orrery_6d_t1', game);
  if (d6 >= 22) unlockAchievement('collection_orrery_6d_t2', game);
  if (d6 >= 33) unlockAchievement('collection_orrery_6d_t3', game);
  if (d7 >= 11) unlockAchievement('collection_orrery_7d_t1', game);
  if (d7 >= 22) unlockAchievement('collection_orrery_7d_t2', game);
  if (d7 >= 33) unlockAchievement('collection_orrery_7d_t3', game);
  if (d6 + d7 + sb >= 67) unlockAchievement('collection_orrery_grand', game);
}

addAchievement({ id:'collection_orrery_6d_t1', name:'Gearwork Fragments', icon:'🧩',
  desc:'Encounter and defeat 11 different kinds of Orrery foe from Floor 6D\'s regular roster.', category:'Collection', itemId:'ortrophy_collection_6d_t1' });
addAchievement({ id:'collection_orrery_6d_t2', name:'Deep Into the Rings', icon:'🧩',
  desc:'Encounter and defeat 22 different kinds of Orrery foe from Floor 6D\'s regular roster.', category:'Collection', itemId:'ortrophy_collection_6d_t2' });
addAchievement({ id:'collection_orrery_6d_t3', name:'The Whole Gearwork', icon:'⚙️',
  desc:'Encounter and defeat all 33 kinds of Orrery foe — Floor 6D\'s full regular roster.', category:'Collection', itemId:'gearworkheart' });
addAchievement({ id:'collection_orrery_7d_t1', name:'Mechanism Fragments', icon:'🧩',
  desc:'Encounter and defeat 11 different kinds of Orrery foe from Floor 7D\'s regular roster.', category:'Collection', itemId:'ortrophy_collection_7d_t1' });
addAchievement({ id:'collection_orrery_7d_t2', name:'Deep Into the Apex', icon:'🧩',
  desc:'Encounter and defeat 22 different kinds of Orrery foe from Floor 7D\'s regular roster.', category:'Collection', itemId:'ortrophy_collection_7d_t2' });
addAchievement({ id:'collection_orrery_7d_t3', name:'The Whole Mechanism', icon:'🪐',
  desc:'Encounter and defeat all 33 kinds of Orrery foe — Floor 7D\'s full regular roster.', category:'Collection', itemId:'orreryheart' });
addAchievement({ id:'collection_orrery_grand', name:'Nothing Left Turning', icon:'🌌',
  desc:'Encounter and defeat all 67 foes of the Orrery — every regular enemy of Floors 6D and 7D, plus the Orrery DNB superboss.', category:'Collection', familiarId:'orrerywisp' });

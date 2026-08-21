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
addTierSet({ baseId:'slayer_lensdrifter', name:'Lens Drifter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'lensdrifter',
  desc: n => 'Defeat ' + n + ' of the DNB Lens Drifter.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_lensdrifter_t1' }, { threshold:40, itemId:'obstrophy_slayer_lensdrifter_t2' } ] });

addTierSet({ baseId:'slayer_dustmote', name:'Dust Mote Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'dustmote',
  desc: n => 'Defeat ' + n + ' of the DNB Dust Mote.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_dustmote_t1' }, { threshold:40, itemId:'obstrophy_slayer_dustmote_t2' } ] });

addTierSet({ baseId:'slayer_starshard', name:'Star Shard Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'starshard',
  desc: n => 'Defeat ' + n + ' of the DNB Star Shard.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_starshard_t1' }, { threshold:40, itemId:'obstrophy_slayer_starshard_t2' } ] });

addTierSet({ baseId:'slayer_brassbulwark', name:'Brass Bulwark Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brassbulwark',
  desc: n => 'Defeat ' + n + ' of the DNB Brass Bulwark.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_brassbulwark_t1' }, { threshold:40, itemId:'obstrophy_slayer_brassbulwark_t2' } ] });

addTierSet({ baseId:'slayer_comettusk', name:'Comet Tusk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'comettusk',
  desc: n => 'Defeat ' + n + ' of the DNB Comet Tusk.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_comettusk_t1' }, { threshold:40, itemId:'obstrophy_slayer_comettusk_t2' } ] });

addTierSet({ baseId:'slayer_spyglassturret', name:'Spyglass Turret Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'spyglassturret',
  desc: n => 'Defeat ' + n + ' of the DNB Spyglass Turret.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_spyglassturret_t1' }, { threshold:40, itemId:'obstrophy_slayer_spyglassturret_t2' } ] });

addTierSet({ baseId:'slayer_astralhopper', name:'Astral Hopper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'astralhopper',
  desc: n => 'Defeat ' + n + ' of the DNB Astral Hopper.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_astralhopper_t1' }, { threshold:40, itemId:'obstrophy_slayer_astralhopper_t2' } ] });

addTierSet({ baseId:'slayer_novaslinger', name:'Nova Slinger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'novaslinger',
  desc: n => 'Defeat ' + n + ' of the DNB Nova Slinger.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_novaslinger_t1' }, { threshold:40, itemId:'obstrophy_slayer_novaslinger_t2' } ] });

addTierSet({ baseId:'slayer_gravitymortar', name:'Gravity Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gravitymortar',
  desc: n => 'Defeat ' + n + ' of the DNB Gravity Mortar.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_gravitymortar_t1' }, { threshold:40, itemId:'obstrophy_slayer_gravitymortar_t2' } ] });

addTierSet({ baseId:'slayer_constellationweaver', name:'Constellation Weaver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'constellationweaver',
  desc: n => 'Defeat ' + n + ' of the DNB Constellation Weaver.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_constellationweaver_t1' }, { threshold:40, itemId:'obstrophy_slayer_constellationweaver_t2' } ] });

addTierSet({ baseId:'slayer_domewatcher', name:'Dome Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'domewatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Dome Watcher.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_domewatcher_t1' }, { threshold:40, itemId:'obstrophy_slayer_domewatcher_t2' } ] });

addTierSet({ baseId:'slayer_planetcircler', name:'Planet Circler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'planetcircler',
  desc: n => 'Defeat ' + n + ' of the DNB Planet Circler.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_planetcircler_t1' }, { threshold:40, itemId:'obstrophy_slayer_planetcircler_t2' } ] });

addTierSet({ baseId:'slayer_dustborer', name:'Dust Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'dustborer',
  desc: n => 'Defeat ' + n + ' of the DNB Dust Borer.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_dustborer_t1' }, { threshold:40, itemId:'obstrophy_slayer_dustborer_t2' } ] });

addTierSet({ baseId:'slayer_starmites', name:'Star Mites Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'starmites',
  desc: n => 'Defeat ' + n + ' of the DNB Star Mites.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_starmites_t1' }, { threshold:40, itemId:'obstrophy_slayer_starmites_t2' } ] });

addTierSet({ baseId:'slayer_dustcluster', name:'Dust Cluster Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'dustcluster',
  desc: n => 'Defeat ' + n + ' of the DNB Dust Cluster.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_dustcluster_t1' }, { threshold:40, itemId:'obstrophy_slayer_dustcluster_t2' }, { threshold:100, trinketId:'shatteredlensfragment' } ] });

addTierSet({ baseId:'slayer_constellationcaller', name:'Constellation Caller Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'constellationcaller',
  desc: n => 'Defeat ' + n + ' of the DNB Constellation Caller.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_constellationcaller_t1' }, { threshold:40, itemId:'obstrophy_slayer_constellationcaller_t2' }, { threshold:100, itemId:'starchartrelic' } ] });

addTierSet({ baseId:'slayer_lensmender', name:'Lens Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'lensmender',
  desc: n => 'Defeat ' + n + ' of the DNB Lens Mender.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_lensmender_t1' }, { threshold:40, itemId:'obstrophy_slayer_lensmender_t2' } ] });

addTierSet({ baseId:'slayer_brasswarden', name:'Brass Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brasswarden',
  desc: n => 'Defeat ' + n + ' of the DNB Brass Warden.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_brasswarden_t1' }, { threshold:40, itemId:'obstrophy_slayer_brasswarden_t2' }, { threshold:100, itemId:'brasswardensplating' } ] });

addTierSet({ baseId:'slayer_telescopemarksman', name:'Telescope Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'telescopemarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Telescope Marksman.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_telescopemarksman_t1' }, { threshold:40, itemId:'obstrophy_slayer_telescopemarksman_t2' }, { threshold:100, familiarId:'lensmarksmandrone' } ] });

addTierSet({ baseId:'slayer_stardriftblink', name:'Stardrift Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'stardriftblink',
  desc: n => 'Defeat ' + n + ' of the DNB Stardrift Blink.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_stardriftblink_t1' }, { threshold:40, itemId:'obstrophy_slayer_stardriftblink_t2' }, { threshold:100, itemId:'stardriftanchor' } ] });

addTierSet({ baseId:'slayer_shadowcomet', name:'Shadow Comet Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'shadowcomet',
  desc: n => 'Defeat ' + n + ' of the DNB Shadow Comet.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_shadowcomet_t1' }, { threshold:40, itemId:'obstrophy_slayer_shadowcomet_t2' }, { threshold:100, trinketId:'cometshadowveil' } ] });

addTierSet({ baseId:'slayer_duststrider', name:'Dust Strider Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'duststrider',
  desc: n => 'Defeat ' + n + ' of the DNB Dust Strider.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_duststrider_t1' }, { threshold:40, itemId:'obstrophy_slayer_duststrider_t2' } ] });

addTierSet({ baseId:'slayer_cometsprinter', name:'Comet Sprinter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cometsprinter',
  desc: n => 'Defeat ' + n + ' of the DNB Comet Sprinter.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_cometsprinter_t1' }, { threshold:40, itemId:'obstrophy_slayer_cometsprinter_t2' } ] });

addTierSet({ baseId:'slayer_glassslinger', name:'Glass Slinger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'glassslinger',
  desc: n => 'Defeat ' + n + ' of the DNB Glass Slinger.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_glassslinger_t1' }, { threshold:40, itemId:'obstrophy_slayer_glassslinger_t2' } ] });

addTierSet({ baseId:'slayer_meteorspark', name:'Meteor Spark Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'meteorspark',
  desc: n => 'Defeat ' + n + ' of the DNB Meteor Spark.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_meteorspark_t1' }, { threshold:40, itemId:'obstrophy_slayer_meteorspark_t2' } ] });

addTierSet({ baseId:'slayer_dustmoth', name:'Dust Moth Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'dustmoth',
  desc: n => 'Defeat ' + n + ' of the DNB Dust Moth.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_dustmoth_t1' }, { threshold:40, itemId:'obstrophy_slayer_dustmoth_t2' } ] });

addTierSet({ baseId:'slayer_brassram', name:'Brass Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brassram',
  desc: n => 'Defeat ' + n + ' of the DNB Brass Ram.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_brassram_t1' }, { threshold:40, itemId:'obstrophy_slayer_brassram_t2' } ] });

addTierSet({ baseId:'slayer_stardustmortar', name:'Stardust Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'stardustmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Stardust Mortar.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_stardustmortar_t1' }, { threshold:40, itemId:'obstrophy_slayer_stardustmortar_t2' } ] });

addTierSet({ baseId:'slayer_lensborer', name:'Lens Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'lensborer',
  desc: n => 'Defeat ' + n + ' of the DNB Lens Borer.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_lensborer_t1' }, { threshold:40, itemId:'obstrophy_slayer_lensborer_t2' } ] });

addTierSet({ baseId:'slayer_satellitecircler', name:'Satellite Circler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'satellitecircler',
  desc: n => 'Defeat ' + n + ' of the DNB Satellite Circler.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_satellitecircler_t1' }, { threshold:40, itemId:'obstrophy_slayer_satellitecircler_t2' } ] });

addTierSet({ baseId:'slayer_telescopesentinel', name:'Telescope Sentinel Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'telescopesentinel',
  desc: n => 'Defeat ' + n + ' of the DNB Telescope Sentinel.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_telescopesentinel_t1' }, { threshold:40, itemId:'obstrophy_slayer_telescopesentinel_t2' } ] });

addTierSet({ baseId:'slayer_novablink', name:'Nova Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'novablink',
  desc: n => 'Defeat ' + n + ' of the DNB Nova Blink.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_novablink_t1' }, { threshold:40, itemId:'obstrophy_slayer_novablink_t2' } ] });

addTierSet({ baseId:'slayer_domebulwark', name:'Dome Bulwark Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'domebulwark',
  desc: n => 'Defeat ' + n + ' of the DNB Dome Bulwark.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_domebulwark_t1' }, { threshold:40, itemId:'obstrophy_slayer_domebulwark_t2' } ] });

// ---- 5D roster (33) ----
addTierSet({ baseId:'slayer_astrolabestalker', name:'Astrolabe Stalker Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'astrolabestalker',
  desc: n => 'Defeat ' + n + ' of the DNB Astrolabe Stalker.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_astrolabestalker_t1' }, { threshold:40, itemId:'obstrophy_slayer_astrolabestalker_t2' } ] });

addTierSet({ baseId:'slayer_cometwisp', name:'Comet Wisp Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cometwisp',
  desc: n => 'Defeat ' + n + ' of the DNB Comet Wisp.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_cometwisp_t1' }, { threshold:40, itemId:'obstrophy_slayer_cometwisp_t2' } ] });

addTierSet({ baseId:'slayer_quasarshard', name:'Quasar Shard Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'quasarshard',
  desc: n => 'Defeat ' + n + ' of the DNB Quasar Shard.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_quasarshard_t1' }, { threshold:40, itemId:'obstrophy_slayer_quasarshard_t2' } ] });

addTierSet({ baseId:'slayer_brassaegis', name:'Brass Aegis Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brassaegis',
  desc: n => 'Defeat ' + n + ' of the DNB Brass Aegis.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_brassaegis_t1' }, { threshold:40, itemId:'obstrophy_slayer_brassaegis_t2' } ] });

addTierSet({ baseId:'slayer_meteortusk', name:'Meteor Tusk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'meteortusk',
  desc: n => 'Defeat ' + n + ' of the DNB Meteor Tusk.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_meteortusk_t1' }, { threshold:40, itemId:'obstrophy_slayer_meteortusk_t2' } ] });

addTierSet({ baseId:'slayer_opticturret', name:'Optic Turret Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'opticturret',
  desc: n => 'Defeat ' + n + ' of the DNB Optic Turret.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_opticturret_t1' }, { threshold:40, itemId:'obstrophy_slayer_opticturret_t2' } ] });

addTierSet({ baseId:'slayer_starhopper', name:'Star Hopper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'starhopper',
  desc: n => 'Defeat ' + n + ' of the DNB Star Hopper.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_starhopper_t1' }, { threshold:40, itemId:'obstrophy_slayer_starhopper_t2' } ] });

addTierSet({ baseId:'slayer_gravslinger', name:'Grav Slinger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gravslinger',
  desc: n => 'Defeat ' + n + ' of the DNB Grav Slinger.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_gravslinger_t1' }, { threshold:40, itemId:'obstrophy_slayer_gravslinger_t2' } ] });

addTierSet({ baseId:'slayer_novamortar', name:'Nova Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'novamortar',
  desc: n => 'Defeat ' + n + ' of the DNB Nova Mortar.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_novamortar_t1' }, { threshold:40, itemId:'obstrophy_slayer_novamortar_t2' } ] });

addTierSet({ baseId:'slayer_nebulaweaver', name:'Nebula Weaver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'nebulaweaver',
  desc: n => 'Defeat ' + n + ' of the DNB Nebula Weaver.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_nebulaweaver_t1' }, { threshold:40, itemId:'obstrophy_slayer_nebulaweaver_t2' } ] });

addTierSet({ baseId:'slayer_astrariumwatcher', name:'Astrarium Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'astrariumwatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Astrarium Watcher.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_astrariumwatcher_t1' }, { threshold:40, itemId:'obstrophy_slayer_astrariumwatcher_t2' } ] });

addTierSet({ baseId:'slayer_ringcircler', name:'Ring Circler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ringcircler',
  desc: n => 'Defeat ' + n + ' of the DNB Ring Circler.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_ringcircler_t1' }, { threshold:40, itemId:'obstrophy_slayer_ringcircler_t2' } ] });

addTierSet({ baseId:'slayer_gravityborer', name:'Gravity Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gravityborer',
  desc: n => 'Defeat ' + n + ' of the DNB Gravity Borer.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_gravityborer_t1' }, { threshold:40, itemId:'obstrophy_slayer_gravityborer_t2' } ] });

addTierSet({ baseId:'slayer_cosmicmites', name:'Cosmic Mites Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cosmicmites',
  desc: n => 'Defeat ' + n + ' of the DNB Cosmic Mites.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_cosmicmites_t1' }, { threshold:40, itemId:'obstrophy_slayer_cosmicmites_t2' } ] });

addTierSet({ baseId:'slayer_nebulacluster', name:'Nebula Cluster Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'nebulacluster',
  desc: n => 'Defeat ' + n + ' of the DNB Nebula Cluster.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_nebulacluster_t1' }, { threshold:40, itemId:'obstrophy_slayer_nebulacluster_t2' }, { threshold:100, itemId:'nebulacoreshard' } ] });

addTierSet({ baseId:'slayer_astralcaller', name:'Astral Caller Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'astralcaller',
  desc: n => 'Defeat ' + n + ' of the DNB Astral Caller.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_astralcaller_t1' }, { threshold:40, itemId:'obstrophy_slayer_astralcaller_t2' }, { threshold:100, trinketId:'astralbeaconchit' } ] });

addTierSet({ baseId:'slayer_glassmender', name:'Glass Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'glassmender',
  desc: n => 'Defeat ' + n + ' of the DNB Glass Mender.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_glassmender_t1' }, { threshold:40, itemId:'obstrophy_slayer_glassmender_t2' } ] });

addTierSet({ baseId:'slayer_astrolabewarden', name:'Astrolabe Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'astrolabewarden',
  desc: n => 'Defeat ' + n + ' of the DNB Astrolabe Warden.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_astrolabewarden_t1' }, { threshold:40, itemId:'obstrophy_slayer_astrolabewarden_t2' }, { threshold:100, itemId:'astrolabewardenplate' } ] });

addTierSet({ baseId:'slayer_precisionmarksman', name:'Precision Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'precisionmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Precision Marksman.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_precisionmarksman_t1' }, { threshold:40, itemId:'obstrophy_slayer_precisionmarksman_t2' }, { threshold:100, familiarId:'precisionopticdrone' } ] });

addTierSet({ baseId:'slayer_voidblink', name:'Void Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'voidblink',
  desc: n => 'Defeat ' + n + ' of the DNB Void Blink.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_voidblink_t1' }, { threshold:40, itemId:'obstrophy_slayer_voidblink_t2' }, { threshold:100, itemId:'voidriftanchor' } ] });

addTierSet({ baseId:'slayer_eclipsecomet', name:'Eclipse Comet Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'eclipsecomet',
  desc: n => 'Defeat ' + n + ' of the DNB Eclipse Comet.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_eclipsecomet_t1' }, { threshold:40, itemId:'obstrophy_slayer_eclipsecomet_t2' }, { threshold:100, trinketId:'eclipseveilcloak' } ] });

addTierSet({ baseId:'slayer_gravitybrute', name:'Gravity Brute Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gravitybrute',
  desc: n => 'Defeat ' + n + ' of the DNB Gravity Brute.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_gravitybrute_t1' }, { threshold:40, itemId:'obstrophy_slayer_gravitybrute_t2' } ] });

addTierSet({ baseId:'slayer_starstreak', name:'Star Streak Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'starstreak',
  desc: n => 'Defeat ' + n + ' of the DNB Star Streak.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_starstreak_t1' }, { threshold:40, itemId:'obstrophy_slayer_starstreak_t2' } ] });

addTierSet({ baseId:'slayer_prismslinger', name:'Prism Slinger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'prismslinger',
  desc: n => 'Defeat ' + n + ' of the DNB Prism Slinger.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_prismslinger_t1' }, { threshold:40, itemId:'obstrophy_slayer_prismslinger_t2' } ] });

addTierSet({ baseId:'slayer_fluxshard', name:'Flux Shard Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'fluxshard',
  desc: n => 'Defeat ' + n + ' of the DNB Flux Shard.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_fluxshard_t1' }, { threshold:40, itemId:'obstrophy_slayer_fluxshard_t2' } ] });

addTierSet({ baseId:'slayer_astralmoth', name:'Astral Moth Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'astralmoth',
  desc: n => 'Defeat ' + n + ' of the DNB Astral Moth.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_astralmoth_t1' }, { threshold:40, itemId:'obstrophy_slayer_astralmoth_t2' } ] });

addTierSet({ baseId:'slayer_brassjuggernaut', name:'Brass Juggernaut Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brassjuggernaut',
  desc: n => 'Defeat ' + n + ' of the DNB Brass Juggernaut.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_brassjuggernaut_t1' }, { threshold:40, itemId:'obstrophy_slayer_brassjuggernaut_t2' } ] });

addTierSet({ baseId:'slayer_cometmortar', name:'Comet Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cometmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Comet Mortar.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_cometmortar_t1' }, { threshold:40, itemId:'obstrophy_slayer_cometmortar_t2' } ] });

addTierSet({ baseId:'slayer_duskborer', name:'Dusk Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'duskborer',
  desc: n => 'Defeat ' + n + ' of the DNB Dusk Borer.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_duskborer_t1' }, { threshold:40, itemId:'obstrophy_slayer_duskborer_t2' } ] });

addTierSet({ baseId:'slayer_mooncircler', name:'Moon Circler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mooncircler',
  desc: n => 'Defeat ' + n + ' of the DNB Moon Circler.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_mooncircler_t1' }, { threshold:40, itemId:'obstrophy_slayer_mooncircler_t2' } ] });

addTierSet({ baseId:'slayer_opticsentinel', name:'Optic Sentinel Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'opticsentinel',
  desc: n => 'Defeat ' + n + ' of the DNB Optic Sentinel.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_opticsentinel_t1' }, { threshold:40, itemId:'obstrophy_slayer_opticsentinel_t2' } ] });

addTierSet({ baseId:'slayer_riftblink', name:'Rift Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'riftblink',
  desc: n => 'Defeat ' + n + ' of the DNB Rift Blink.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_riftblink_t1' }, { threshold:40, itemId:'obstrophy_slayer_riftblink_t2' } ] });

addTierSet({ baseId:'slayer_astralbulwark', name:'Astral Bulwark Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'astralbulwark',
  desc: n => 'Defeat ' + n + ' of the DNB Astral Bulwark.',
  tiers:[ { threshold:10, itemId:'obstrophy_slayer_astralbulwark_t1' }, { threshold:40, itemId:'obstrophy_slayer_astralbulwark_t2' } ] });

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

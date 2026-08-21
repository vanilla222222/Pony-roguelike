'use strict';
// achievements/defs-3.js — split from achievements.js (part 3/6).
addAchievement({ id:'slayer_boss_blizzardwraith', name:'Blizzard Wraith Hunter', icon:'👹',
  desc:'Defeat The Blizzard Wraith 5 times.', category:'Slayer', itemId:'slayertrophy_boss_blizzardwraith', bestiarySection:'enemyKills', bestiaryId:'blizzardwraith', threshold:5 });
addAchievement({ id:'slayer_boss_vinehorror', name:'Vine Horror Hunter', icon:'👹',
  desc:'Defeat The Vine Horror 5 times.', category:'Slayer', itemId:'slayertrophy_boss_vinehorror', bestiarySection:'enemyKills', bestiaryId:'vinehorror', threshold:5 });
addAchievement({ id:'slayer_boss_canopystalker', name:'Canopy Stalker Hunter', icon:'👹',
  desc:'Defeat The Canopy Stalker 5 times.', category:'Slayer', itemId:'slayertrophy_boss_canopystalker', bestiarySection:'enemyKills', bestiaryId:'canopystalker', threshold:5 });
addAchievement({ id:'slayer_boss_subdrowner', name:'Sub Drowner Hunter', icon:'👹',
  desc:'Defeat The Sub Drowner 5 times.', category:'Slayer', itemId:'slayertrophy_boss_subdrowner', bestiarySection:'enemyKills', bestiaryId:'subdrowner', threshold:5 });
addAchievement({ id:'slayer_boss_pressurechoir', name:'Pressure Choir Hunter', icon:'👹',
  desc:'Defeat The Pressure Choir 5 times.', category:'Slayer', itemId:'slayertrophy_boss_pressurechoir', bestiarySection:'enemyKills', bestiaryId:'pressurechoir', threshold:5 });
addAchievement({ id:'slayer_boss_brinebloom', name:'Brine Bloom Hunter', icon:'👹',
  desc:'Defeat The Brine Bloom 5 times.', category:'Slayer', itemId:'slayertrophy_boss_brinebloom', bestiarySection:'enemyKills', bestiaryId:'brinebloom', threshold:5 });
addAchievement({ id:'slayer_boss_glassreef', name:'Glass Reef Hunter', icon:'👹',
  desc:'Defeat The Glass Reef 5 times.', category:'Slayer', itemId:'slayertrophy_boss_glassreef', bestiarySection:'enemyKills', bestiaryId:'glassreef', threshold:5 });
addAchievement({ id:'slayer_boss_feedbackeffigy', name:'Feedback Effigy Hunter', icon:'👹',
  desc:'Defeat The Feedback Effigy 5 times.', category:'Slayer', itemId:'slayertrophy_boss_feedbackeffigy', bestiarySection:'enemyKills', bestiaryId:'feedbackeffigy', threshold:5 });
addAchievement({ id:'slayer_boss_brokenrefrain', name:'Broken Refrain Hunter', icon:'👹',
  desc:'Defeat The Broken Refrain 5 times.', category:'Slayer', itemId:'slayertrophy_boss_brokenrefrain', bestiarySection:'enemyKills', bestiaryId:'brokenrefrain', threshold:5 });
addAchievement({ id:'slayer_boss_redlineravager', name:'Redline Ravager Hunter', icon:'👹',
  desc:'Defeat The Redline Ravager 5 times.', category:'Slayer', itemId:'slayertrophy_boss_redlineravager', bestiarySection:'enemyKills', bestiaryId:'redlineravager', threshold:5 });
addAchievement({ id:'slayer_boss_clippingcolossus', name:'Clipping Colossus Hunter', icon:'👹',
  desc:'Defeat The Clipping Colossus 5 times.', category:'Slayer', itemId:'slayertrophy_boss_clippingcolossus', bestiarySection:'enemyKills', bestiaryId:'clippingcolossus', threshold:5 });


/* ==== SLAYER — C-branch Gutters floors 3C / 4C (expand-everything) ====
   66 enemies (33 on each of 3C and 4C), one THREE-RUNG ladder apiece,
   declared with Slice 1's addTierSet: ids mint as 'slayer_<id>_t1/_t2/_t3'
   and names auto-suffix ' I'/' II'/' III'. Predicate B (enemyKills/<id>).
   Thresholds 5 / 20 / 50 — rung 2 is the flat 20 every pre-existing
   single-shot Slayer entry uses, so a player who already grinds one of
   these to the old bar lands exactly on the middle rung.
   ALL THREE rungs now carry a reward. The top rung keeps its
   slayertrophy_<id> passive (see data.js); rungs 1 and 2 were back-filled
   from the five freshly-authored unclaimed pools — locked pill colors,
   locked enemies (bestiary unlocks), pendingReward trinkets, and the newest
   locked items / familiars. A given enemy's t1 and t2 always draw from two
   DIFFERENT pools, and no reward id is granted by more than one
   achievement anywhere in this file.
   ---------------------------------------------------------------------- */
addTierSet({ baseId:'slayer_gutterrat', name:'Gutter Rat Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gutterrat',
  desc: n => 'Defeat ' + n + ' of the DNB Gutter Rat.',
  tiers:[ { threshold:5, trinketId:'heavywedge' }, { threshold:20, itemId:'ashensigil' }, { threshold:50, itemId:'slayertrophy_gutterrat' } ] });
addTierSet({ baseId:'slayer_runoffwisp', name:'Runoff Wisp Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'runoffwisp',
  desc: n => 'Defeat ' + n + ' of the DNB Runoff Wisp.',
  tiers:[ { threshold:5, familiarId:'russetchit' }, { threshold:20, trinketId:'irontooth' }, { threshold:50, itemId:'slayertrophy_runoffwisp' } ] });
addTierSet({ baseId:'slayer_gasbloat', name:'Gas Bloat Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gasbloat',
  desc: n => 'Defeat ' + n + ' of the DNB Gas Bloat.',
  tiers:[ { threshold:5, itemId:'gildedcrown' }, { threshold:20, familiarId:'boghusk' }, { threshold:50, itemId:'slayertrophy_gasbloat' } ] });
addTierSet({ baseId:'slayer_grateguard', name:'Grate Guard Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'grateguard',
  desc: n => 'Defeat ' + n + ' of the DNB Grate Guard.',
  tiers:[ { threshold:5, trinketId:'roughspur' }, { threshold:20, itemId:'weatheredidol' }, { threshold:50, itemId:'slayertrophy_grateguard' } ] });
addTierSet({ baseId:'slayer_silthog', name:'Silt Hog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'silthog',
  desc: n => 'Defeat ' + n + ' of the DNB Silt Hog.',
  tiers:[ { threshold:5, familiarId:'claynut' }, { threshold:20, trinketId:'brutalrivet' }, { threshold:50, itemId:'slayertrophy_silthog' } ] });
addTierSet({ baseId:'slayer_drainspout', name:'Drain Spout Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'drainspout',
  desc: n => 'Defeat ' + n + ' of the DNB Drain Spout.',
  tiers:[ { threshold:5, itemId:'runicrelic' }, { threshold:20, familiarId:'indigoscarab' }, { threshold:50, itemId:'slayertrophy_drainspout' } ] });
addTierSet({ baseId:'slayer_gutterhopper', name:'Gutter Hopper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gutterhopper',
  desc: n => 'Defeat ' + n + ' of the DNB Gutter Hopper.',
  tiers:[ { threshold:5, trinketId:'brutalcleat' }, { threshold:20, itemId:'ashentalisman' }, { threshold:50, itemId:'slayertrophy_gutterhopper' } ] });
addTierSet({ baseId:'slayer_sewerspitter', name:'Sewer Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sewerspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Sewer Spitter.',
  tiers:[ { threshold:5, familiarId:'meadowscarab' }, { threshold:20, trinketId:'nimbleribbon' }, { threshold:50, itemId:'slayertrophy_sewerspitter' } ] });
addTierSet({ baseId:'slayer_sludgemortar', name:'Sludge Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sludgemortar',
  desc: n => 'Defeat ' + n + ' of the DNB Sludge Mortar.',
  tiers:[ { threshold:5, itemId:'fortunaterelic' }, { threshold:20, familiarId:'brightbead' }, { threshold:50, itemId:'slayertrophy_sludgemortar' } ] });
addTierSet({ baseId:'slayer_eelweaver', name:'Eel Weaver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'eelweaver',
  desc: n => 'Defeat ' + n + ' of the DNB Eel Weaver.',
  tiers:[ { threshold:5, trinketId:'dartingribbon' }, { threshold:20, itemId:'heavyamulet' }, { threshold:50, itemId:'slayertrophy_eelweaver' } ] });
addTierSet({ baseId:'slayer_gratewatcher', name:'Grate Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gratewatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Grate Watcher.',
  tiers:[ { threshold:5, familiarId:'tidalhusk' }, { threshold:20, trinketId:'fleetquill' }, { threshold:50, itemId:'slayertrophy_gratewatcher' } ] });
addTierSet({ baseId:'slayer_gnatswirl', name:'Gnat Swirl Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gnatswirl',
  desc: n => 'Defeat ' + n + ' of the DNB Gnat Swirl.',
  tiers:[ { threshold:5, itemId:'crackedamulet' }, { threshold:20, familiarId:'umbercog' }, { threshold:50, itemId:'slayertrophy_gnatswirl' } ] });
addTierSet({ baseId:'slayer_mudburrower', name:'Mud Burrower Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mudburrower',
  desc: n => 'Defeat ' + n + ' of the DNB Mud Burrower.',
  tiers:[ { threshold:5, trinketId:'swiftlace' }, { threshold:20, itemId:'ashencloak' }, { threshold:50, itemId:'slayertrophy_mudburrower' } ] });
addTierSet({ baseId:'slayer_gutterlarvae', name:'Gutter Larvae Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gutterlarvae',
  desc: n => 'Defeat ' + n + ' of the DNB Gutter Larvae.',
  tiers:[ { threshold:5, familiarId:'indigomite' }, { threshold:20, trinketId:'skimmingwisp' }, { threshold:50, itemId:'slayertrophy_gutterlarvae' } ] });
addTierSet({ baseId:'slayer_bloatsack', name:'Bloat Sack Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'bloatsack',
  desc: n => 'Defeat ' + n + ' of the DNB Bloat Sack.',
  tiers:[ { threshold:5, itemId:'runicpendant' }, { threshold:20, familiarId:'sootybramble' }, { threshold:50, itemId:'slayertrophy_bloatsack' } ] });
addTierSet({ baseId:'slayer_ratcaller', name:'Rat Caller Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ratcaller',
  desc: n => 'Defeat ' + n + ' of the DNB Rat Caller.',
  tiers:[ { threshold:5, trinketId:'fourleafpip' }, { threshold:20, itemId:'airymedallion' }, { threshold:50, itemId:'slayertrophy_ratcaller' } ] });
addTierSet({ baseId:'slayer_algaemender', name:'Algae Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'algaemender',
  desc: n => 'Defeat ' + n + ' of the DNB Algae Mender.',
  tiers:[ { threshold:5, familiarId:'emberscarab' }, { threshold:20, trinketId:'fourleafdram' }, { threshold:50, itemId:'slayertrophy_algaemender' } ] });
addTierSet({ baseId:'slayer_drainwarden', name:'Drain Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'drainwarden',
  desc: n => 'Defeat ' + n + ' of the DNB Drain Warden.',
  tiers:[ { threshold:5, itemId:'bluntsignet' }, { threshold:20, familiarId:'marblecrab' }, { threshold:50, itemId:'slayertrophy_drainwarden' } ] });
addTierSet({ baseId:'slayer_pipemarksman', name:'Pipe Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'pipemarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Pipe Marksman.',
  tiers:[ { threshold:5, trinketId:'auspiciouschit' }, { threshold:20, itemId:'widecirclet' }, { threshold:50, itemId:'slayertrophy_pipemarksman' } ] });
addTierSet({ baseId:'slayer_overflowblink', name:'Overflow Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'overflowblink',
  desc: n => 'Defeat ' + n + ' of the DNB Overflow Blink.',
  tiers:[ { threshold:5, familiarId:'rimesnail' }, { threshold:20, trinketId:'serendipitysprig' }, { threshold:50, itemId:'slayertrophy_overflowblink' } ] });
addTierSet({ baseId:'slayer_sumplurker', name:'Sump Lurker Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sumplurker',
  desc: n => 'Defeat ' + n + ' of the DNB Sump Lurker.',
  tiers:[ { threshold:5, itemId:'chippedamulet' }, { threshold:20, familiarId:'velvettick' }, { threshold:50, itemId:'slayertrophy_sumplurker' } ] });
addTierSet({ baseId:'slayer_sludgehulk', name:'Sludge Hulk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sludgehulk',
  desc: n => 'Defeat ' + n + ' of the DNB Sludge Hulk.',
  tiers:[ { threshold:5, trinketId:'auspiciousknot' }, { threshold:20, itemId:'hallowedmantle' }, { threshold:50, itemId:'slayertrophy_sludgehulk' } ] });
addTierSet({ baseId:'slayer_drainskitter', name:'Drain Skitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'drainskitter',
  desc: n => 'Defeat ' + n + ' of the DNB Drain Skitter.',
  tiers:[ { threshold:5, familiarId:'meadowcog' }, { threshold:20, trinketId:'exactingsight' }, { threshold:50, itemId:'slayertrophy_drainskitter' } ] });
addTierSet({ baseId:'slayer_brinespitter', name:'Brine Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brinespitter',
  desc: n => 'Defeat ' + n + ' of the DNB Brine Spitter.',
  tiers:[ { threshold:5, itemId:'weatheredcharm' }, { threshold:20, familiarId:'sablewhorl' }, { threshold:50, itemId:'slayertrophy_brinespitter' } ] });
addTierSet({ baseId:'slayer_fumedrone', name:'Fume Drone Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'fumedrone',
  desc: n => 'Defeat ' + n + ' of the DNB Fume Drone.',
  tiers:[ { threshold:5, trinketId:'sharpedge' }, { threshold:20, itemId:'weatheredgauntlet' }, { threshold:50, itemId:'slayertrophy_fumedrone' } ] });
addTierSet({ baseId:'slayer_gutterswoop', name:'Gutter Swoop Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gutterswoop',
  desc: n => 'Defeat ' + n + ' of the DNB Gutter Swoop.',
  tiers:[ { threshold:5, familiarId:'prismknuckle' }, { threshold:20, trinketId:'keenfacet' }, { threshold:50, itemId:'slayertrophy_gutterswoop' } ] });
addTierSet({ baseId:'slayer_rustcharger', name:'Rust Charger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rustcharger',
  desc: n => 'Defeat ' + n + ' of the DNB Rust Charger.',
  tiers:[ { threshold:5, itemId:'scatteringeffigy' }, { threshold:20, familiarId:'saffronmite' }, { threshold:50, itemId:'slayertrophy_rustcharger' } ] });
addTierSet({ baseId:'slayer_flotsamlobber', name:'Flotsam Lobber Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'flotsamlobber',
  desc: n => 'Defeat ' + n + ' of the DNB Flotsam Lobber.',
  tiers:[ { threshold:5, trinketId:'exactingfacet' }, { threshold:20, itemId:'wispinggauntlet' }, { threshold:50, itemId:'slayertrophy_flotsamlobber' } ] });
addTierSet({ baseId:'slayer_gritdelver', name:'Grit Delver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gritdelver',
  desc: n => 'Defeat ' + n + ' of the DNB Grit Delver.',
  tiers:[ { threshold:5, familiarId:'cindersnail' }, { threshold:20, trinketId:'hairlinesplinter' }, { threshold:50, itemId:'slayertrophy_gritdelver' } ] });
addTierSet({ baseId:'slayer_driftcircler', name:'Drift Circler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'driftcircler',
  desc: n => 'Defeat ' + n + ' of the DNB Drift Circler.',
  tiers:[ { threshold:5, itemId:'pallidcirclet' }, { threshold:20, familiarId:'rimetick' }, { threshold:50, itemId:'slayertrophy_driftcircler' } ] });
addTierSet({ baseId:'slayer_drainwatcher', name:'Drain Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'drainwatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Drain Watcher.',
  tiers:[ { threshold:5, trinketId:'clickingratchet' }, { threshold:20, itemId:'ancientrune' }, { threshold:50, itemId:'slayertrophy_drainwatcher' } ] });
addTierSet({ baseId:'slayer_culvertmarksman', name:'Culvert Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'culvertmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Culvert Marksman.',
  tiers:[ { threshold:5, familiarId:'lunarcrab' }, { threshold:20, trinketId:'snappytrigger' }, { threshold:50, itemId:'slayertrophy_culvertmarksman' } ] });
addTierSet({ baseId:'slayer_puddleblink', name:'Puddle Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'puddleblink',
  desc: n => 'Defeat ' + n + ' of the DNB Puddle Blink.',
  tiers:[ { threshold:5, itemId:'pullingsignet' }, { threshold:20, familiarId:'opalknuckle' }, { threshold:50, itemId:'slayertrophy_puddleblink' } ] });
addTierSet({ baseId:'slayer_sewerrat', name:'Sewer Rat Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sewerrat',
  desc: n => 'Defeat ' + n + ' of the DNB Sewer Rat.',
  tiers:[ { threshold:5, enemyId:'ossuarysaint' }, { threshold:20, trinketId:'quickratchet' }, { threshold:50, itemId:'slayertrophy_sewerrat' } ] });
addTierSet({ baseId:'slayer_fetidflier', name:'Fetid Flier Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'fetidflier',
  desc: n => 'Defeat ' + n + ' of the DNB Fetid Flier.',
  tiers:[ { threshold:5, itemId:'leviathanpendant' }, { threshold:20, familiarId:'verdantshard' }, { threshold:50, itemId:'slayertrophy_fetidflier' } ] });
addTierSet({ baseId:'slayer_rotbladder', name:'Rot Bladder Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rotbladder',
  desc: n => 'Defeat ' + n + ' of the DNB Rot Bladder.',
  tiers:[ { threshold:5, enemyId:'reliquarymite' }, { threshold:20, trinketId:'clickingescapement' }, { threshold:50, itemId:'slayertrophy_rotbladder' } ] });
addTierSet({ baseId:'slayer_rustplate', name:'Rust Plate Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rustplate',
  desc: n => 'Defeat ' + n + ' of the DNB Rust Plate.',
  tiers:[ { threshold:5, itemId:'runictalisman' }, { threshold:20, familiarId:'cobaltsprocket' }, { threshold:50, itemId:'slayertrophy_rustplate' } ] });
addTierSet({ baseId:'slayer_brinehog', name:'Brine Hog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brinehog',
  desc: n => 'Defeat ' + n + ' of the DNB Brine Hog.',
  tiers:[ { threshold:5, enemyId:'pallbearer' }, { threshold:20, trinketId:'longglass' }, { threshold:50, itemId:'slayertrophy_brinehog' } ] });
addTierSet({ baseId:'slayer_standpipeturret', name:'Standpipe Turret Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'standpipeturret',
  desc: n => 'Defeat ' + n + ' of the DNB Standpipe Turret.',
  tiers:[ { threshold:5, itemId:'hallowedcharm' }, { threshold:20, familiarId:'coralcog' }, { threshold:50, itemId:'slayertrophy_standpipeturret' } ] });
addTierSet({ baseId:'slayer_culvertleaper', name:'Culvert Leaper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'culvertleaper',
  desc: n => 'Defeat ' + n + ' of the DNB Culvert Leaper.',
  tiers:[ { threshold:5, enemyId:'candlewake' }, { threshold:20, trinketId:'outreachglass' }, { threshold:50, itemId:'slayertrophy_culvertleaper' } ] });
addTierSet({ baseId:'slayer_bilgespitter', name:'Bilge Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'bilgespitter',
  desc: n => 'Defeat ' + n + ' of the DNB Bilge Spitter.',
  tiers:[ { threshold:5, itemId:'hallowedlocket' }, { threshold:20, familiarId:'stormbeetle' }, { threshold:50, itemId:'slayertrophy_bilgespitter' } ] });
addTierSet({ baseId:'slayer_refusemortar', name:'Refuse Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'refusemortar',
  desc: n => 'Defeat ' + n + ' of the DNB Refuse Mortar.',
  tiers:[ { threshold:5, pillColorId:'obsidian' }, { threshold:20, enemyId:'mistlestag' }, { threshold:50, itemId:'slayertrophy_refusemortar' } ] });
addTierSet({ baseId:'slayer_bilgeweaver', name:'Bilge Weaver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'bilgeweaver',
  desc: n => 'Defeat ' + n + ' of the DNB Bilge Weaver.',
  tiers:[ { threshold:5, trinketId:'horizonspan' }, { threshold:20, itemId:'breezylocket' }, { threshold:50, itemId:'slayertrophy_bilgeweaver' } ] });
addTierSet({ baseId:'slayer_culvertwatcher', name:'Culvert Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'culvertwatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Culvert Watcher.',
  tiers:[ { threshold:5, familiarId:'bognut' }, { threshold:20, pillColorId:'quartz' }, { threshold:50, itemId:'slayertrophy_culvertwatcher' } ] });
addTierSet({ baseId:'slayer_carrionswirl', name:'Carrion Swirl Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'carrionswirl',
  desc: n => 'Defeat ' + n + ' of the DNB Carrion Swirl.',
  tiers:[ { threshold:5, enemyId:'fungalchoir' }, { threshold:20, trinketId:'leviathanbane' }, { threshold:50, itemId:'slayertrophy_carrionswirl' } ] });
addTierSet({ baseId:'slayer_muckborer', name:'Muck Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'muckborer',
  desc: n => 'Defeat ' + n + ' of the DNB Muck Borer.',
  tiers:[ { threshold:5, itemId:'viciousrune' }, { threshold:20, familiarId:'sablepip' }, { threshold:50, itemId:'slayertrophy_muckborer' } ] });
addTierSet({ baseId:'slayer_rotgrubs', name:'Rot Grubs Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rotgrubs',
  desc: n => 'Defeat ' + n + ' of the DNB Rot Grubs.',
  tiers:[ { threshold:5, pillColorId:'garnet' }, { threshold:20, enemyId:'dewdancer' }, { threshold:50, itemId:'slayertrophy_rotgrubs' } ] });
addTierSet({ baseId:'slayer_rotsack', name:'Rot Sack Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rotsack',
  desc: n => 'Defeat ' + n + ' of the DNB Rot Sack.',
  tiers:[ { threshold:5, trinketId:'behemothtag' }, { threshold:20, itemId:'overlookcrown' }, { threshold:50, itemId:'slayertrophy_rotsack' } ] });
addTierSet({ baseId:'slayer_broodcaller', name:'Brood Caller Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'broodcaller',
  desc: n => 'Defeat ' + n + ' of the DNB Brood Caller.',
  tiers:[ { threshold:5, familiarId:'sablehusk' }, { threshold:20, pillColorId:'amethyst' }, { threshold:50, itemId:'slayertrophy_broodcaller' } ] });
addTierSet({ baseId:'slayer_muckmender', name:'Muck Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'muckmender',
  desc: n => 'Defeat ' + n + ' of the DNB Muck Mender.',
  tiers:[ { threshold:5, enemyId:'heartseedling' }, { threshold:20, trinketId:'ogretag' }, { threshold:50, itemId:'slayertrophy_muckmender' } ] });
addTierSet({ baseId:'slayer_cisternwarden', name:'Cistern Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cisternwarden',
  desc: n => 'Defeat ' + n + ' of the DNB Cistern Warden.',
  tiers:[ { threshold:5, itemId:'weatheredreliquary' }, { threshold:20, familiarId:'tidalchit' }, { threshold:50, itemId:'slayertrophy_cisternwarden' } ] });
addTierSet({ baseId:'slayer_outfallmarksman', name:'Outfall Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'outfallmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Outfall Marksman.',
  tiers:[ { threshold:5, pillColorId:'citrine' }, { threshold:20, enemyId:'glasswake' }, { threshold:50, itemId:'slayertrophy_outfallmarksman' } ] });
addTierSet({ baseId:'slayer_backflowblink', name:'Backflow Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'backflowblink',
  desc: n => 'Defeat ' + n + ' of the DNB Backflow Blink.',
  tiers:[ { threshold:5, trinketId:'colossussigil' }, { threshold:20, itemId:'woundcharm' }, { threshold:50, itemId:'slayertrophy_backflowblink' } ] });
addTierSet({ baseId:'slayer_cisternlurker', name:'Cistern Lurker Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cisternlurker',
  desc: n => 'Defeat ' + n + ' of the DNB Cistern Lurker.',
  tiers:[ { threshold:5, familiarId:'meadowpebble' }, { threshold:20, pillColorId:'turquoise' }, { threshold:50, itemId:'slayertrophy_cisternlurker' } ] });
addTierSet({ baseId:'slayer_floodbrute', name:'Flood Brute Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'floodbrute',
  desc: n => 'Defeat ' + n + ' of the DNB Flood Brute.',
  tiers:[ { threshold:5, enemyId:'mirageoracle' }, { threshold:20, trinketId:'redoubtslab' }, { threshold:50, itemId:'slayertrophy_floodbrute' } ] });
addTierSet({ baseId:'slayer_scumskitter', name:'Scum Skitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'scumskitter',
  desc: n => 'Defeat ' + n + ' of the DNB Scum Skitter.',
  tiers:[ { threshold:5, itemId:'tollinglocket' }, { threshold:20, familiarId:'cindersprocket' }, { threshold:50, itemId:'slayertrophy_scumskitter' } ] });
addTierSet({ baseId:'slayer_effluentspitter', name:'Effluent Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'effluentspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Effluent Spitter.',
  tiers:[ { threshold:5, pillColorId:'sapphire' }, { threshold:20, enemyId:'gildedscarab' }, { threshold:50, itemId:'slayertrophy_effluentspitter' } ] });
addTierSet({ baseId:'slayer_miasmadrone', name:'Miasma Drone Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'miasmadrone',
  desc: n => 'Defeat ' + n + ' of the DNB Miasma Drone.',
  tiers:[ { threshold:5, trinketId:'redoubtrampart' }, { threshold:20, itemId:'gildedeffigy' }, { threshold:50, itemId:'slayertrophy_miasmadrone' } ] });
addTierSet({ baseId:'slayer_gnatveil', name:'Gnat Veil Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gnatveil',
  desc: n => 'Defeat ' + n + ' of the DNB Gnat Veil.',
  tiers:[ { threshold:5, familiarId:'driftknuckle' }, { threshold:20, pillColorId:'aquamarine' }, { threshold:50, itemId:'slayertrophy_gnatveil' } ] });
addTierSet({ baseId:'slayer_tidecharger', name:'Tide Charger Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'tidecharger',
  desc: n => 'Defeat ' + n + ' of the DNB Tide Charger.',
  tiers:[ { threshold:5, enemyId:'sunveilmoth' }, { threshold:20, trinketId:'wardingrampart' }, { threshold:50, itemId:'slayertrophy_tidecharger' } ] });
addTierSet({ baseId:'slayer_weirmortar', name:'Weir Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'weirmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Weir Mortar.',
  tiers:[ { threshold:5, itemId:'ashensignet' }, { threshold:20, familiarId:'palehusk' }, { threshold:50, itemId:'slayertrophy_weirmortar' } ] });
addTierSet({ baseId:'slayer_drownedhulk', name:'Drowned Hulk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'drownedhulk',
  desc: n => 'Defeat ' + n + ' of the DNB Drowned Hulk.',
  tiers:[ { threshold:5, pillColorId:'malachite' }, { threshold:20, enemyId:'cinderchoir' }, { threshold:50, itemId:'slayertrophy_drownedhulk' } ] });
addTierSet({ baseId:'slayer_eddycircler', name:'Eddy Circler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'eddycircler',
  desc: n => 'Defeat ' + n + ' of the DNB Eddy Circler.',
  tiers:[ { threshold:5, trinketId:'thirstyfang' }, { threshold:20, itemId:'ashenrelic' }, { threshold:50, itemId:'slayertrophy_eddycircler' } ] });
addTierSet({ baseId:'slayer_overflowwatcher', name:'Overflow Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'overflowwatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Overflow Watcher.',
  tiers:[ { threshold:5, familiarId:'lunarchit' }, { threshold:20, pillColorId:'moonstone' }, { threshold:50, itemId:'slayertrophy_overflowwatcher' } ] });
addTierSet({ baseId:'slayer_siltmarksman', name:'Silt Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'siltmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Silt Marksman.',
  tiers:[ { threshold:5, enemyId:'pyrecircler' }, { threshold:20, trinketId:'leechingfang' }, { threshold:50, itemId:'slayertrophy_siltmarksman' } ] });
addTierSet({ baseId:'slayer_cisternblink', name:'Cistern Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cisternblink',
  desc: n => 'Defeat ' + n + ' of the DNB Cistern Blink.',
  tiers:[ { threshold:5, itemId:'forsakenamulet' }, { threshold:20, familiarId:'umbercrab' }, { threshold:50, itemId:'slayertrophy_cisternblink' } ] });

/* ==== SLAYER — C-branch Sewers floors 5C / 6C (expand-everything) ====
   66 enemies (33 on each of 5C and 6C), one THREE-RUNG ladder apiece,
   same shape as the 3C/4C Gutters batch above: addTierSet mints
   'slayer_<id>_t1/_t2/_t3', thresholds 5 / 20 / 50, predicate B
   (enemyKills/<id>). ALL THREE rungs carry a reward. The top rung keeps
   its slayertrophy_<id> passive (see data.js); rungs 1 and 2 were
   back-filled from the same five unclaimed pools the Gutters batch drew
   from, continuing from where that batch stopped rather than restarting
   each pool — locked pill colors, locked enemies (bestiary unlocks),
   pendingReward trinkets, and the newest locked items / familiars.
   A given enemy's t1 and t2 always draw from two DIFFERENT pools, and no
   reward id is granted by more than one achievement anywhere in this file.
   ---------------------------------------------------------------------- */
addTierSet({ baseId:'slayer_tunnelrat', name:'Tunnel Rat Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'tunnelrat',
  desc: n => 'Defeat ' + n + ' of the DNB Tunnel Rat.',
  tiers:[ { threshold:5, itemId:'sunkenreliquary' }, { threshold:20, trinketId:'parchedsipper' }, { threshold:50, itemId:'slayertrophy_tunnelrat' } ] });
addTierSet({ baseId:'slayer_sewerflit', name:'Sewer Flit Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sewerflit',
  desc: n => 'Defeat ' + n + ' of the DNB Sewer Flit.',
  tiers:[ { threshold:5, trinketId:'parchedfang' }, { threshold:20, itemId:'sunkenmantle' }, { threshold:50, itemId:'slayertrophy_sewerflit' } ] });
addTierSet({ baseId:'slayer_methanepod', name:'Methane Pod Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'methanepod',
  desc: n => 'Defeat ' + n + ' of the DNB Methane Pod.',
  tiers:[ { threshold:5, familiarId:'bogburr' }, { threshold:20, itemId:'couponcloak' }, { threshold:50, itemId:'slayertrophy_methanepod' } ] });
addTierSet({ baseId:'slayer_corrodedplate', name:'Corroded Plate Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'corrodedplate',
  desc: n => 'Defeat ' + n + ' of the DNB Corroded Plate.',
  tiers:[ { threshold:5, familiarId:'marbleknuckle' }, { threshold:20, trinketId:'wakewreath' }, { threshold:50, itemId:'slayertrophy_corrodedplate' } ] });
addTierSet({ baseId:'slayer_sludgehog', name:'Sludge Hog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sludgehog',
  desc: n => 'Defeat ' + n + ' of the DNB Sludge Hog.',
  tiers:[ { threshold:5, itemId:'woveneffigy' }, { threshold:20, trinketId:'carrionfeather' }, { threshold:50, itemId:'slayertrophy_sludgehog' } ] });
addTierSet({ baseId:'slayer_effluentvalve', name:'Effluent Valve Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'effluentvalve',
  desc: n => 'Defeat ' + n + ' of the DNB Effluent Valve.',
  tiers:[ { threshold:5, itemId:'hallowedrelic' }, { threshold:20, familiarId:'prismnut' }, { threshold:50, itemId:'slayertrophy_effluentvalve' } ] });
addTierSet({ baseId:'slayer_pipeleaper', name:'Pipe Leaper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'pipeleaper',
  desc: n => 'Defeat ' + n + ' of the DNB Pipe Leaper.',
  tiers:[ { threshold:5, trinketId:'scavengedration' }, { threshold:20, familiarId:'cinderhusk' }, { threshold:50, itemId:'slayertrophy_pipeleaper' } ] });
addTierSet({ baseId:'slayer_toxicspitter', name:'Toxic Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'toxicspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Toxic Spitter.',
  tiers:[ { threshold:5, trinketId:'tainteddrop' }, { threshold:20, itemId:'crackedgauntlet' }, { threshold:50, itemId:'slayertrophy_toxicspitter' } ] });
addTierSet({ baseId:'slayer_wastemortar', name:'Waste Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'wastemortar',
  desc: n => 'Defeat ' + n + ' of the DNB Waste Mortar.',
  tiers:[ { threshold:5, familiarId:'onyxbeetle' }, { threshold:20, itemId:'ashencrown' }, { threshold:50, itemId:'slayertrophy_wastemortar' } ] });
addTierSet({ baseId:'slayer_sewereel', name:'Sewer Eel Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sewereel',
  desc: n => 'Defeat ' + n + ' of the DNB Sewer Eel.',
  tiers:[ { threshold:5, familiarId:'runicshard' }, { threshold:20, trinketId:'septicfang' }, { threshold:50, itemId:'slayertrophy_sewereel' } ] });
addTierSet({ baseId:'slayer_manholewatcher', name:'Manhole Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'manholewatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Manhole Watcher.',
  tiers:[ { threshold:5, itemId:'hallowedgauntlet' }, { threshold:20, trinketId:'blightedampule' }, { threshold:50, itemId:'slayertrophy_manholewatcher' } ] });
addTierSet({ baseId:'slayer_fumeswirl', name:'Fume Swirl Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'fumeswirl',
  desc: n => 'Defeat ' + n + ' of the DNB Fume Swirl.',
  tiers:[ { threshold:5, itemId:'quickrelic' }, { threshold:20, familiarId:'thornmite' }, { threshold:50, itemId:'slayertrophy_fumeswirl' } ] });
addTierSet({ baseId:'slayer_grimeborer', name:'Grime Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'grimeborer',
  desc: n => 'Defeat ' + n + ' of the DNB Grime Borer.',
  tiers:[ { threshold:5, trinketId:'concussiveslug' }, { threshold:20, familiarId:'indigosnail' }, { threshold:50, itemId:'slayertrophy_grimeborer' } ] });
addTierSet({ baseId:'slayer_sewermaggots', name:'Sewer Maggots Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sewermaggots',
  desc: n => 'Defeat ' + n + ' of the DNB Sewer Maggots.',
  tiers:[ { threshold:5, trinketId:'leadenchime' }, { threshold:20, itemId:'weatheredcrown' }, { threshold:50, itemId:'slayertrophy_sewermaggots' } ] });
addTierSet({ baseId:'slayer_bilesack', name:'Bile Sack Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'bilesack',
  desc: n => 'Defeat ' + n + ' of the DNB Bile Sack.',
  tiers:[ { threshold:5, familiarId:'saffronnut' }, { threshold:20, itemId:'weatheredeffigy' }, { threshold:50, itemId:'slayertrophy_bilesack' } ] });
addTierSet({ baseId:'slayer_vermincaller', name:'Vermin Caller Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'vermincaller',
  desc: n => 'Defeat ' + n + ' of the DNB Vermin Caller.',
  tiers:[ { threshold:5, familiarId:'tidalknuckle' }, { threshold:20, trinketId:'ringinghammer' }, { threshold:50, itemId:'slayertrophy_vermincaller' } ] });
addTierSet({ baseId:'slayer_slimemender', name:'Slime Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'slimemender',
  desc: n => 'Defeat ' + n + ' of the DNB Slime Mender.',
  tiers:[ { threshold:5, itemId:'sunkentalisman' }, { threshold:20, trinketId:'adoringpetal' }, { threshold:50, itemId:'slayertrophy_slimemender' } ] });
addTierSet({ baseId:'slayer_outfallwarden', name:'Outfall Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'outfallwarden',
  desc: n => 'Defeat ' + n + ' of the DNB Outfall Warden.',
  tiers:[ { threshold:5, itemId:'fondsignet' }, { threshold:20, familiarId:'frostknuckle' }, { threshold:50, itemId:'slayertrophy_outfallwarden' } ] });
addTierSet({ baseId:'slayer_conduitmarksman', name:'Conduit Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'conduitmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Conduit Marksman.',
  tiers:[ { threshold:5, trinketId:'velvetposy' }, { threshold:20, familiarId:'gildedpip' }, { threshold:50, itemId:'slayertrophy_conduitmarksman' } ] });
addTierSet({ baseId:'slayer_siphonblink', name:'Siphon Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'siphonblink',
  desc: n => 'Defeat ' + n + ' of the DNB Siphon Blink.',
  tiers:[ { threshold:5, trinketId:'fondribbon' }, { threshold:20, itemId:'ashenrune' }, { threshold:50, itemId:'slayertrophy_siphonblink' } ] });
addTierSet({ baseId:'slayer_drainlurker', name:'Drain Lurker Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'drainlurker',
  desc: n => 'Defeat ' + n + ' of the DNB Drain Lurker.',
  tiers:[ { threshold:5, familiarId:'solarshard' }, { threshold:20, itemId:'splittingrelic' }, { threshold:50, itemId:'slayertrophy_drainlurker' } ] });
addTierSet({ baseId:'slayer_effluenthulk', name:'Effluent Hulk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'effluenthulk',
  desc: n => 'Defeat ' + n + ' of the DNB Effluent Hulk.',
  tiers:[ { threshold:5, familiarId:'russetsnail' }, { threshold:20, trinketId:'rimedbead' }, { threshold:50, itemId:'slayertrophy_effluenthulk' } ] });
addTierSet({ baseId:'slayer_scumrunner', name:'Scum Runner Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'scumrunner',
  desc: n => 'Defeat ' + n + ' of the DNB Scum Runner.',
  tiers:[ { threshold:5, itemId:'ghostingcharm' }, { threshold:20, trinketId:'rimedlattice' }, { threshold:50, itemId:'slayertrophy_scumrunner' } ] });
addTierSet({ baseId:'slayer_corrosionspitter', name:'Corrosion Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'corrosionspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Corrosion Spitter.',
  tiers:[ { threshold:5, itemId:'fortunateamulet' }, { threshold:20, familiarId:'emberbat' }, { threshold:50, itemId:'slayertrophy_corrosionspitter' } ] });
addTierSet({ baseId:'slayer_gasbladder', name:'Gas Bladder Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gasbladder',
  desc: n => 'Defeat ' + n + ' of the DNB Gas Bladder.',
  tiers:[ { threshold:5, trinketId:'frostbitflake' }, { threshold:20, familiarId:'quartzsprite' }, { threshold:50, itemId:'slayertrophy_gasbladder' } ] });
addTierSet({ baseId:'slayer_sewerbat', name:'Sewer Bat Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sewerbat',
  desc: n => 'Defeat ' + n + ' of the DNB Sewer Bat.',
  tiers:[ { threshold:5, trinketId:'keeningrattle' }, { threshold:20, itemId:'greasedreliquary' }, { threshold:50, itemId:'slayertrophy_sewerbat' } ] });
addTierSet({ baseId:'slayer_ironhog', name:'Iron Hog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ironhog',
  desc: n => 'Defeat ' + n + ' of the DNB Iron Hog.',
  tiers:[ { threshold:5, familiarId:'feraldrake' }, { threshold:20, itemId:'reaperreliquary' }, { threshold:50, itemId:'slayertrophy_ironhog' } ] });
addTierSet({ baseId:'slayer_offalmortar', name:'Offal Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'offalmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Offal Mortar.',
  tiers:[ { threshold:5, familiarId:'mossylobber' }, { threshold:20, trinketId:'shudderingmask' }, { threshold:50, itemId:'slayertrophy_offalmortar' } ] });
addTierSet({ baseId:'slayer_sludgedelver', name:'Sludge Delver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sludgedelver',
  desc: n => 'Defeat ' + n + ' of the DNB Sludge Delver.',
  tiers:[ { threshold:5, itemId:'wovensignet' }, { threshold:20, trinketId:'pallidwail' }, { threshold:50, itemId:'slayertrophy_sludgedelver' } ] });
addTierSet({ baseId:'slayer_vaporcircler', name:'Vapor Circler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'vaporcircler',
  desc: n => 'Defeat ' + n + ' of the DNB Vapor Circler.',
  tiers:[ { threshold:5, itemId:'howlingreliquary' }, { threshold:20, familiarId:'prismspitter' }, { threshold:50, itemId:'slayertrophy_vaporcircler' } ] });
addTierSet({ baseId:'slayer_pipewatcher', name:'Pipe Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'pipewatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Pipe Watcher.',
  tiers:[ { threshold:5, trinketId:'hummingstone' }, { threshold:20, familiarId:'verdantdrake' }, { threshold:50, itemId:'slayertrophy_pipewatcher' } ] });
addTierSet({ baseId:'slayer_overflowshade', name:'Overflow Shade Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'overflowshade',
  desc: n => 'Defeat ' + n + ' of the DNB Overflow Shade.',
  tiers:[ { threshold:5, trinketId:'graspingcoil' }, { threshold:20, itemId:'ogrelocket' }, { threshold:50, itemId:'slayertrophy_overflowshade' } ] });
addTierSet({ baseId:'slayer_scaledbulk', name:'Scaled Bulk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'scaledbulk',
  desc: n => 'Defeat ' + n + ' of the DNB Scaled Bulk.',
  tiers:[ { threshold:5, familiarId:'lichenhornet' }, { threshold:20, enemyId:'nullshade' }, { threshold:50, itemId:'slayertrophy_scaledbulk' } ] });
addTierSet({ baseId:'slayer_mainsrat', name:'Mains Rat Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mainsrat',
  desc: n => 'Defeat ' + n + ' of the DNB Mains Rat.',
  tiers:[ { threshold:5, trinketId:'graspingstone' }, { threshold:20, itemId:'titanlocket' }, { threshold:50, itemId:'slayertrophy_mainsrat' } ] });
addTierSet({ baseId:'slayer_miasmaflit', name:'Miasma Flit Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'miasmaflit',
  desc: n => 'Defeat ' + n + ' of the DNB Miasma Flit.',
  tiers:[ { threshold:5, familiarId:'cobalthornet' }, { threshold:20, enemyId:'slagmarksman' }, { threshold:50, itemId:'slayertrophy_miasmaflit' } ] });
addTierSet({ baseId:'slayer_sourgaspod', name:'Sour Gas Pod Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sourgaspod',
  desc: n => 'Defeat ' + n + ' of the DNB Sour Gas Pod.',
  tiers:[ { threshold:5, trinketId:'fumingkeg' }, { threshold:20, itemId:'fourleafrelic' }, { threshold:50, itemId:'slayertrophy_sourgaspod' } ] });
addTierSet({ baseId:'slayer_slagplate', name:'Slag Plate Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'slagplate',
  desc: n => 'Defeat ' + n + ' of the DNB Slag Plate.',
  tiers:[ { threshold:5, familiarId:'meadowfinch' }, { threshold:20, enemyId:'emberwarden' }, { threshold:50, itemId:'slayertrophy_slagplate' } ] });
addTierSet({ baseId:'slayer_effluenthog', name:'Effluent Hog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'effluenthog',
  desc: n => 'Defeat ' + n + ' of the DNB Effluent Hog.',
  tiers:[ { threshold:5, trinketId:'scatteringhorn' }, { threshold:20, itemId:'hallowedamulet' }, { threshold:50, itemId:'slayertrophy_effluenthog' } ] });
addTierSet({ baseId:'slayer_runoffvalve', name:'Runoff Valve Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'runoffvalve',
  desc: n => 'Defeat ' + n + ' of the DNB Runoff Valve.',
  tiers:[ { threshold:5, familiarId:'claylark' }, { threshold:20, enemyId:'eclipseherald' }, { threshold:50, itemId:'slayertrophy_runoffvalve' } ] });
addTierSet({ baseId:'slayer_conduitleaper', name:'Conduit Leaper Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'conduitleaper',
  desc: n => 'Defeat ' + n + ' of the DNB Conduit Leaper.',
  tiers:[ { threshold:5, trinketId:'blastwidewick' }, { threshold:20, itemId:'shudderinglocket' }, { threshold:50, itemId:'slayertrophy_conduitleaper' } ] });
addTierSet({ baseId:'slayer_acidspitter', name:'Acid Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'acidspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Acid Spitter.',
  tiers:[ { threshold:5, familiarId:'verdantfly' }, { threshold:20, enemyId:'galewraith' }, { threshold:50, itemId:'slayertrophy_acidspitter' } ] });
addTierSet({ baseId:'slayer_slurrymortar', name:'Slurry Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'slurrymortar',
  desc: n => 'Defeat ' + n + ' of the DNB Slurry Mortar.',
  tiers:[ { threshold:5, trinketId:'ghostingcloak' }, { threshold:20, itemId:'wovenvestment' }, { threshold:50, itemId:'slayertrophy_slurrymortar' } ] });
addTierSet({ baseId:'slayer_drainserpent', name:'Drain Serpent Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'drainserpent',
  desc: n => 'Defeat ' + n + ' of the DNB Drain Serpent.',
  tiers:[ { threshold:5, familiarId:'quartzgnat' }, { threshold:20, enemyId:'stormsinger' }, { threshold:50, itemId:'slayertrophy_drainserpent' } ] });
addTierSet({ baseId:'slayer_sluicewatcher', name:'Sluice Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sluicewatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Sluice Watcher.',
  tiers:[ { threshold:5, itemId:'beckoningcirclet' }, { threshold:20, pillColorId:'sunstone' }, { threshold:50, itemId:'slayertrophy_sluicewatcher' } ] });
addTierSet({ baseId:'slayer_toxinswirl', name:'Toxin Swirl Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'toxinswirl',
  desc: n => 'Defeat ' + n + ' of the DNB Toxin Swirl.',
  tiers:[ { threshold:5, trinketId:'fainthem' }, { threshold:20, familiarId:'fengnat' }, { threshold:50, itemId:'slayertrophy_toxinswirl' } ] });
addTierSet({ baseId:'slayer_muckdriller', name:'Muck Driller Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'muckdriller',
  desc: n => 'Defeat ' + n + ' of the DNB Muck Driller.',
  tiers:[ { threshold:5, pillColorId:'tourmaline' }, { threshold:20, enemyId:'thunderhusk' }, { threshold:50, itemId:'slayertrophy_muckdriller' } ] });
addTierSet({ baseId:'slayer_drainmites', name:'Drain Mites Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'drainmites',
  desc: n => 'Defeat ' + n + ' of the DNB Drain Mites.',
  tiers:[ { threshold:5, itemId:'hallowedbracer' }, { threshold:20, trinketId:'shiftingveil' }, { threshold:50, itemId:'slayertrophy_drainmites' } ] });
addTierSet({ baseId:'slayer_tarsack', name:'Tar Sack Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'tarsack',
  desc: n => 'Defeat ' + n + ' of the DNB Tar Sack.',
  tiers:[ { threshold:5, enemyId:'orchidlurker' }, { threshold:20, familiarId:'coppergnat' }, { threshold:50, itemId:'slayertrophy_tarsack' } ] });
addTierSet({ baseId:'slayer_broodtender', name:'Brood Tender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'broodtender',
  desc: n => 'Defeat ' + n + ' of the DNB Brood Tender.',
  tiers:[ { threshold:5, pillColorId:'cinnabar' }, { threshold:20, itemId:'thirstycirclet' }, { threshold:50, itemId:'slayertrophy_broodtender' } ] });
addTierSet({ baseId:'slayer_biofilmmender', name:'Biofilm Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'biofilmmender',
  desc: n => 'Defeat ' + n + ' of the DNB Biofilm Mender.',
  tiers:[ { threshold:5, familiarId:'lunardrake' }, { threshold:20, trinketId:'splittingrift' }, { threshold:50, itemId:'slayertrophy_biofilmmender' } ] });
addTierSet({ baseId:'slayer_sluicewarden', name:'Sluice Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sluicewarden',
  desc: n => 'Defeat ' + n + ' of the DNB Sluice Warden.',
  tiers:[ { threshold:5, enemyId:'plumescreamer' }, { threshold:20, pillColorId:'verdigris' }, { threshold:50, itemId:'slayertrophy_sluicewarden' } ] });
addTierSet({ baseId:'slayer_pipelinemarksman', name:'Pipeline Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'pipelinemarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Pipeline Marksman.',
  tiers:[ { threshold:5, trinketId:'deeprift' }, { threshold:20, itemId:'couponvestment' }, { threshold:50, itemId:'slayertrophy_pipelinemarksman' } ] });
addTierSet({ baseId:'slayer_backwashblink', name:'Backwash Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'backwashblink',
  desc: n => 'Defeat ' + n + ' of the DNB Backwash Blink.',
  tiers:[ { threshold:5, familiarId:'rimepuppet' }, { threshold:20, enemyId:'vinemender' }, { threshold:50, itemId:'slayertrophy_backwashblink' } ] });
addTierSet({ baseId:'slayer_sumpstalker', name:'Sump Stalker Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sumpstalker',
  desc: n => 'Defeat ' + n + ' of the DNB Sump Stalker.',
  tiers:[ { threshold:5, itemId:'wovenpendant' }, { threshold:20, pillColorId:'saffron' }, { threshold:50, itemId:'slayertrophy_sumpstalker' } ] });
addTierSet({ baseId:'slayer_sludgebrute', name:'Sludge Brute Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sludgebrute',
  desc: n => 'Defeat ' + n + ' of the DNB Sludge Brute.',
  tiers:[ { threshold:5, trinketId:'pennychit' }, { threshold:20, familiarId:'ivoryhornet' }, { threshold:50, itemId:'slayertrophy_sludgebrute' } ] });
addTierSet({ baseId:'slayer_toxinskitter', name:'Toxin Skitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'toxinskitter',
  desc: n => 'Defeat ' + n + ' of the DNB Toxin Skitter.',
  tiers:[ { threshold:5, pillColorId:'paprika' }, { threshold:20, enemyId:'idolcircler' }, { threshold:50, itemId:'slayertrophy_toxinskitter' } ] });
addTierSet({ baseId:'slayer_bilespitter', name:'Bile Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'bilespitter',
  desc: n => 'Defeat ' + n + ' of the DNB Bile Spitter.',
  tiers:[ { threshold:5, itemId:'wovencloak' }, { threshold:20, trinketId:'thriftledger' }, { threshold:50, itemId:'slayertrophy_bilespitter' } ] });
addTierSet({ baseId:'slayer_methanedrone', name:'Methane Drone Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'methanedrone',
  desc: n => 'Defeat ' + n + ' of the DNB Methane Drone.',
  tiers:[ { threshold:5, enemyId:'nautilusdrifter' }, { threshold:20, familiarId:'embermoth' }, { threshold:50, itemId:'slayertrophy_methanedrone' } ] });
addTierSet({ baseId:'slayer_drainmoth', name:'Drain Moth Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'drainmoth',
  desc: n => 'Defeat ' + n + ' of the DNB Drain Moth.',
  tiers:[ { threshold:5, pillColorId:'plum' }, { threshold:20, itemId:'blastcapreliquary' }, { threshold:50, itemId:'slayertrophy_drainmoth' } ] });

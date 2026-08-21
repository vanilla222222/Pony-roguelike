'use strict';
// achievements/defs-4.js — split from achievements.js (part 4/6).
addTierSet({ baseId:'slayer_pistonram', name:'Piston Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'pistonram',
  desc: n => 'Defeat ' + n + ' of the DNB Piston Ram.',
  tiers:[ { threshold:5, familiarId:'quartzwren' }, { threshold:20, trinketId:'signedcontract' }, { threshold:50, itemId:'slayertrophy_pistonram' } ] });
addTierSet({ baseId:'slayer_scourmortar', name:'Scour Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'scourmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Scour Mortar.',
  tiers:[ { threshold:5, enemyId:'anglerlantern' }, { threshold:20, pillColorId:'mulberry' }, { threshold:50, itemId:'slayertrophy_scourmortar' } ] });
addTierSet({ baseId:'slayer_greaseborer', name:'Grease Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'greaseborer',
  desc: n => 'Defeat ' + n + ' of the DNB Grease Borer.',
  tiers:[ { threshold:5, trinketId:'threadingbodkin' }, { threshold:20, itemId:'ironhidevest' }, { threshold:50, itemId:'slayertrophy_greaseborer' } ] });
addTierSet({ baseId:'slayer_effluenteddy', name:'Effluent Eddy Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'effluenteddy',
  desc: n => 'Defeat ' + n + ' of the DNB Effluent Eddy.',
  tiers:[ { threshold:5, familiarId:'solarwren' }, { threshold:20, enemyId:'kelpweaver' }, { threshold:50, itemId:'slayertrophy_effluenteddy' } ] });
addTierSet({ baseId:'slayer_outfallwatcher', name:'Outfall Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'outfallwatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Outfall Watcher.',
  tiers:[ { threshold:5, itemId:'threadingcrown' }, { threshold:20, pillColorId:'cherry' }, { threshold:50, itemId:'slayertrophy_outfallwatcher' } ] });
addTierSet({ baseId:'slayer_siphonshade', name:'Siphon Shade Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'siphonshade',
  desc: n => 'Defeat ' + n + ' of the DNB Siphon Shade.',
  tiers:[ { threshold:5, trinketId:'trackingwhisker' }, { threshold:20, familiarId:'tidalbat' }, { threshold:50, itemId:'slayertrophy_siphonshade' } ] });
addTierSet({ baseId:'slayer_ironbulk', name:'Iron Bulk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ironbulk',
  desc: n => 'Defeat ' + n + ' of the DNB Iron Bulk.',
  tiers:[ { threshold:5, pillColorId:'apricot' }, { threshold:20, enemyId:'pearlwarden' }, { threshold:50, itemId:'slayertrophy_ironbulk' } ] });

/* ==== SLAYER — C-branch Rainforest floors 7C / 8C (expand-everything) ====
   66 enemies (33 on each of 7C and 8C), one THREE-RUNG ladder apiece,
   same shape as the 5C/6C Sewers batch above: addTierSet mints
   'slayer_<id>_t1/_t2/_t3', thresholds 5 / 20 / 50, predicate B
   (enemyKills/<id>). ALL THREE rungs carry a reward: t3 is the
   slayertrophy_<id> passive (see data.js), while t1 and t2 each hand
   out one previously-unclaimed locked pill colour / bestiary enemy /
   trinket / item / familiar. A given enemy's t1 and t2 always use two
   DIFFERENT reward types.
   ---------------------------------------------------------------------- */
addTierSet({ baseId:'slayer_jungleprowler', name:'Jungle Prowler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'jungleprowler',
  desc: n => 'Defeat ' + n + ' of the DNB Jungle Prowler.',
  tiers:[ { threshold:5, trinketId:'mistypane' }, { threshold:20, itemId:'wishinglocket' }, { threshold:50, itemId:'slayertrophy_jungleprowler' } ] });
addTierSet({ baseId:'slayer_hornetflit', name:'Hornet Flit Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hornetflit',
  desc: n => 'Defeat ' + n + ' of the DNB Hornet Flit.',
  tiers:[ { threshold:5, itemId:'runiccrown' }, { threshold:20, trinketId:'fulminatenut' }, { threshold:50, itemId:'slayertrophy_hornetflit' } ] });
addTierSet({ baseId:'slayer_puffballpod', name:'Puffball Pod Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'puffballpod',
  desc: n => 'Defeat ' + n + ' of the DNB Puffball Pod.',
  tiers:[ { threshold:5, trinketId:'twinnedchime' }, { threshold:20, itemId:'scatteringrelic' }, { threshold:50, itemId:'slayertrophy_puffballpod' } ] });
addTierSet({ baseId:'slayer_barkplate', name:'Bark Plate Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'barkplate',
  desc: n => 'Defeat ' + n + ' of the DNB Bark Plate.',
  tiers:[ { threshold:5, itemId:'lodeeffigy' }, { threshold:20, trinketId:'breezyknot' }, { threshold:50, itemId:'slayertrophy_barkplate' } ] });
addTierSet({ baseId:'slayer_peccaryram', name:'Peccary Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'peccaryram',
  desc: n => 'Defeat ' + n + ' of the DNB Peccary Ram.',
  tiers:[ { threshold:5, trinketId:'glidingtrefoil' }, { threshold:20, itemId:'sunkenidol' }, { threshold:50, itemId:'slayertrophy_peccaryram' } ] });
addTierSet({ baseId:'slayer_blowdartvine', name:'Blowdart Vine Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'blowdartvine',
  desc: n => 'Defeat ' + n + ' of the DNB Blowdart Vine.',
  tiers:[ { threshold:5, itemId:'boringpendant' }, { threshold:20, trinketId:'oiledlens' }, { threshold:50, itemId:'slayertrophy_blowdartvine' } ] });
addTierSet({ baseId:'slayer_poisonfrog', name:'Poison Frog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'poisonfrog',
  desc: n => 'Defeat ' + n + ' of the DNB Poison Frog.',
  tiers:[ { threshold:5, trinketId:'rosykeg' }, { threshold:20, familiarId:'meadowsprite' }, { threshold:50, itemId:'slayertrophy_poisonfrog' } ] });
addTierSet({ baseId:'slayer_venomspitter', name:'Venom Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'venomspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Venom Spitter.',
  tiers:[ { threshold:5, familiarId:'duskyfly' }, { threshold:20, trinketId:'leviathancog' }, { threshold:50, itemId:'slayertrophy_venomspitter' } ] });
addTierSet({ baseId:'slayer_sapmortar', name:'Sap Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sapmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Sap Mortar.',
  tiers:[ { threshold:5, trinketId:'bulwarkcog' }, { threshold:20, familiarId:'silverwisp' }, { threshold:50, itemId:'slayertrophy_sapmortar' } ] });
addTierSet({ baseId:'slayer_vinesnake', name:'Vine Snake Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'vinesnake',
  desc: n => 'Defeat ' + n + ' of the DNB Vine Snake.',
  tiers:[ { threshold:5, familiarId:'jadeimp' }, { threshold:20, trinketId:'dreadfang' }, { threshold:50, itemId:'slayertrophy_vinesnake' } ] });
addTierSet({ baseId:'slayer_canopywatcher', name:'Canopy Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'canopywatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Canopy Watcher.',
  tiers:[ { threshold:5, trinketId:'auspiciousspyring' }, { threshold:20, familiarId:'slatenewt' }, { threshold:50, itemId:'slayertrophy_canopywatcher' } ] });
addTierSet({ baseId:'slayer_glowswirl', name:'Glow Swirl Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'glowswirl',
  desc: n => 'Defeat ' + n + ' of the DNB Glow Swirl.',
  tiers:[ { threshold:5, familiarId:'ashenkite' }, { threshold:20, trinketId:'ruinouschip' }, { threshold:50, itemId:'slayertrophy_glowswirl' } ] });
addTierSet({ baseId:'slayer_rootborer', name:'Root Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rootborer',
  desc: n => 'Defeat ' + n + ' of the DNB Root Borer.',
  tiers:[ { threshold:5, trinketId:'roaringtally' }, { threshold:20, familiarId:'solarlobber' }, { threshold:50, itemId:'slayertrophy_rootborer' } ] });
addTierSet({ baseId:'slayer_armyants', name:'Army Ants Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'armyants',
  desc: n => 'Defeat ' + n + ' of the DNB Army Ants.',
  tiers:[ { threshold:5, familiarId:'stormlobber' }, { threshold:20, trinketId:'acridtrefoil' }, { threshold:50, itemId:'slayertrophy_armyants' } ] });
addTierSet({ baseId:'slayer_pollensack', name:'Pollen Sack Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'pollensack',
  desc: n => 'Defeat ' + n + ' of the DNB Pollen Sack.',
  tiers:[ { threshold:5, trinketId:'titanbloom' }, { threshold:20, familiarId:'sootynewt' }, { threshold:50, itemId:'slayertrophy_pollensack' } ] });
addTierSet({ baseId:'slayer_antcaller', name:'Ant Caller Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'antcaller',
  desc: n => 'Defeat ' + n + ' of the DNB Ant Caller.',
  tiers:[ { threshold:5, familiarId:'brightsprite' }, { threshold:20, trinketId:'serendipitysole' }, { threshold:50, itemId:'slayertrophy_antcaller' } ] });
addTierSet({ baseId:'slayer_liverwortmender', name:'Liverwort Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'liverwortmender',
  desc: n => 'Defeat ' + n + ' of the DNB Liverwort Mender.',
  tiers:[ { threshold:5, trinketId:'exactinghinge' }, { threshold:20, familiarId:'palegnat' }, { threshold:50, itemId:'slayertrophy_liverwortmender' } ] });
addTierSet({ baseId:'slayer_grovewarden', name:'Grove Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'grovewarden',
  desc: n => 'Defeat ' + n + ' of the DNB Grove Warden.',
  tiers:[ { threshold:5, familiarId:'corallark' }, { threshold:20, trinketId:'focusedwedge' }, { threshold:50, itemId:'slayertrophy_grovewarden' } ] });
addTierSet({ baseId:'slayer_blowgunmarksman', name:'Blowgun Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'blowgunmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Blowgun Marksman.',
  tiers:[ { threshold:5, trinketId:'distantdetent' }, { threshold:20, familiarId:'silverpuppet' }, { threshold:50, itemId:'slayertrophy_blowgunmarksman' } ] });
addTierSet({ baseId:'slayer_mistblink', name:'Mist Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mistblink',
  desc: n => 'Defeat ' + n + ' of the DNB Mist Blink.',
  tiers:[ { threshold:5, familiarId:'runicmoth' }, { threshold:20, trinketId:'hummingsprocket' }, { threshold:50, itemId:'slayertrophy_mistblink' } ] });
addTierSet({ baseId:'slayer_jaguarlurker', name:'Jaguar Lurker Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'jaguarlurker',
  desc: n => 'Defeat ' + n + ' of the DNB Jaguar Lurker.',
  tiers:[ { threshold:5, trinketId:'dotingvoucher' }, { threshold:20, familiarId:'feralimp' }, { threshold:50, itemId:'slayertrophy_jaguarlurker' } ] });
addTierSet({ baseId:'slayer_silverbackbrute', name:'Silverback Brute Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'silverbackbrute',
  desc: n => 'Defeat ' + n + ' of the DNB Silverback Brute.',
  tiers:[ { threshold:5, familiarId:'sootyfly' }, { threshold:20, trinketId:'biliousbarb' }, { threshold:50, itemId:'slayertrophy_silverbackbrute' } ] });
addTierSet({ baseId:'slayer_leafskitter', name:'Leaf Skitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'leafskitter',
  desc: n => 'Defeat ' + n + ' of the DNB Leaf Skitter.',
  tiers:[ { threshold:5, trinketId:'crimsonribbon' }, { threshold:20, familiarId:'amberlark' }, { threshold:50, itemId:'slayertrophy_leafskitter' } ] });
addTierSet({ baseId:'slayer_frogspitter', name:'Frog Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'frogspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Frog Spitter.',
  tiers:[ { threshold:5, familiarId:'gildedsprite' }, { threshold:20, trinketId:'wardinganklet' }, { threshold:50, itemId:'slayertrophy_frogspitter' } ] });
addTierSet({ baseId:'slayer_bombardierbeetle', name:'Bombardier Beetle Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'bombardierbeetle',
  desc: n => 'Defeat ' + n + ' of the DNB Bombardier Beetle.',
  tiers:[ { threshold:5, trinketId:'horizonveil' }, { threshold:20, familiarId:'frostkite' }, { threshold:50, itemId:'slayertrophy_bombardierbeetle' } ] });
addTierSet({ baseId:'slayer_nectarbat', name:'Nectar Bat Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'nectarbat',
  desc: n => 'Defeat ' + n + ' of the DNB Nectar Bat.',
  tiers:[ { threshold:5, familiarId:'cinnabarbell' }, { threshold:20, trinketId:'glidingclapper' }, { threshold:50, itemId:'slayertrophy_nectarbat' } ] });
addTierSet({ baseId:'slayer_rhinobeetle', name:'Rhino Beetle Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rhinobeetle',
  desc: n => 'Defeat ' + n + ' of the DNB Rhino Beetle.',
  tiers:[ { threshold:5, trinketId:'fortunatepawl' }, { threshold:20, familiarId:'cinderlobber' }, { threshold:50, itemId:'slayertrophy_rhinobeetle' } ] });
addTierSet({ baseId:'slayer_fruitmortar', name:'Fruit Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'fruitmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Fruit Mortar.',
  tiers:[ { threshold:5, familiarId:'hollowgnat' }, { threshold:20, trinketId:'whisperingfleck' }, { threshold:50, itemId:'slayertrophy_fruitmortar' } ] });
addTierSet({ baseId:'slayer_grubdelver', name:'Grub Delver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'grubdelver',
  desc: n => 'Defeat ' + n + ' of the DNB Grub Delver.',
  tiers:[ { threshold:5, trinketId:'rapidwisp' }, { threshold:20, familiarId:'lunarnewt' }, { threshold:50, itemId:'slayertrophy_grubdelver' } ] });
addTierSet({ baseId:'slayer_dragonflycircler', name:'Dragonfly Circler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'dragonflycircler',
  desc: n => 'Defeat ' + n + ' of the DNB Dragonfly Circler.',
  tiers:[ { threshold:5, familiarId:'fenmoth' }, { threshold:20, trinketId:'overlooktoken' }, { threshold:50, itemId:'slayertrophy_dragonflycircler' } ] });
addTierSet({ baseId:'slayer_ruinwatcher', name:'Ruin Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ruinwatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Ruin Watcher.',
  tiers:[ { threshold:5, trinketId:'roaringposy' }, { threshold:20, familiarId:'fenimp' }, { threshold:50, itemId:'slayertrophy_ruinwatcher' } ] });
addTierSet({ baseId:'slayer_humidshade', name:'Humid Shade Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'humidshade',
  desc: n => 'Defeat ' + n + ' of the DNB Humid Shade.',
  tiers:[ { threshold:5, familiarId:'clayjay' }, { threshold:20, trinketId:'viciouschit' }, { threshold:50, itemId:'slayertrophy_humidshade' } ] });
addTierSet({ baseId:'slayer_carapacebulk', name:'Carapace Bulk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'carapacebulk',
  desc: n => 'Defeat ' + n + ' of the DNB Carapace Bulk.',
  tiers:[ { threshold:5, trinketId:'concussivelace' }, { threshold:20, familiarId:'copperjay' }, { threshold:50, itemId:'slayertrophy_carapacebulk' } ] });
addTierSet({ baseId:'slayer_rotcrawler', name:'Rot Crawler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rotcrawler',
  desc: n => 'Defeat ' + n + ' of the DNB Rot Crawler.',
  tiers:[ { threshold:5, familiarId:'feralbat' }, { threshold:20, trinketId:'redoubtmark' }, { threshold:50, itemId:'slayertrophy_rotcrawler' } ] });
addTierSet({ baseId:'slayer_venomflit', name:'Venom Flit Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'venomflit',
  desc: n => 'Defeat ' + n + ' of the DNB Venom Flit.',
  tiers:[ { threshold:5, trinketId:'sweethem' }, { threshold:20, familiarId:'lichenspitter' }, { threshold:50, itemId:'slayertrophy_venomflit' } ] });
addTierSet({ baseId:'slayer_toxinbloom', name:'Toxin Bloom Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'toxinbloom',
  desc: n => 'Defeat ' + n + ' of the DNB Toxin Bloom.',
  tiers:[ { threshold:5, familiarId:'duskymole' }, { threshold:20, trinketId:'longplume' }, { threshold:50, itemId:'slayertrophy_toxinbloom' } ] });
addTierSet({ baseId:'slayer_idolplate', name:'Idol Plate Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'idolplate',
  desc: n => 'Defeat ' + n + ' of the DNB Idol Plate.',
  tiers:[ { threshold:5, itemId:'wovenheart' }, { threshold:20, familiarId:'ashenhen' }, { threshold:50, itemId:'slayertrophy_idolplate' } ] });
addTierSet({ baseId:'slayer_tapirram', name:'Tapir Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'tapirram',
  desc: n => 'Defeat ' + n + ' of the DNB Tapir Ram.',
  tiers:[ { threshold:5, familiarId:'lichencell' }, { threshold:20, itemId:'pennylocket' }, { threshold:50, itemId:'slayertrophy_tapirram' } ] });
addTierSet({ baseId:'slayer_thornspire', name:'Thorn Spire Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'thornspire',
  desc: n => 'Defeat ' + n + ' of the DNB Thorn Spire.',
  tiers:[ { threshold:5, itemId:'runicrune' }, { threshold:20, familiarId:'bogbell' }, { threshold:50, itemId:'slayertrophy_thornspire' } ] });
addTierSet({ baseId:'slayer_dartfrog', name:'Dart Frog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'dartfrog',
  desc: n => 'Defeat ' + n + ' of the DNB Dart Frog.',
  tiers:[ { threshold:5, familiarId:'onyxcrow' }, { threshold:20, itemId:'runicamulet' }, { threshold:50, itemId:'slayertrophy_dartfrog' } ] });
addTierSet({ baseId:'slayer_spitcobra', name:'Spitting Cobra Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'spitcobra',
  desc: n => 'Defeat ' + n + ' of the DNB Spitting Cobra.',
  tiers:[ { threshold:5, itemId:'runiccloak' }, { threshold:20, familiarId:'runiccharm' }, { threshold:50, itemId:'slayertrophy_spitcobra' } ] });
addTierSet({ baseId:'slayer_resinmortar', name:'Resin Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'resinmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Resin Mortar.',
  tiers:[ { threshold:5, enemyId:'rasterswarm' }, { threshold:20, itemId:'sharpvestment' }, { threshold:50, itemId:'slayertrophy_resinmortar' } ] });
addTierSet({ baseId:'slayer_boaweaver', name:'Boa Weaver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'boaweaver',
  desc: n => 'Defeat ' + n + ' of the DNB Boa Weaver.',
  tiers:[ { threshold:5, itemId:'ashenreliquary' }, { threshold:20, enemyId:'segfaultmortar' }, { threshold:50, itemId:'slayertrophy_boaweaver' } ] });
addTierSet({ baseId:'slayer_templewatcher', name:'Temple Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'templewatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Temple Watcher.',
  tiers:[ { threshold:5, enemyId:'checksumwarden' }, { threshold:20, itemId:'sunkensigil' }, { threshold:50, itemId:'slayertrophy_templewatcher' } ] });
addTierSet({ baseId:'slayer_pollenswirl', name:'Pollen Swirl Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'pollenswirl',
  desc: n => 'Defeat ' + n + ' of the DNB Pollen Swirl.',
  tiers:[ { threshold:5, itemId:'halegirth' }, { threshold:20, enemyId:'polyrhythm' }, { threshold:50, itemId:'slayertrophy_pollenswirl' } ] });
addTierSet({ baseId:'slayer_taprootborer', name:'Taproot Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'taprootborer',
  desc: n => 'Defeat ' + n + ' of the DNB Taproot Borer.',
  tiers:[ { threshold:5, enemyId:'fermatasentry' }, { threshold:20, itemId:'crackedcirclet' }, { threshold:50, itemId:'slayertrophy_taprootborer' } ] });
addTierSet({ baseId:'slayer_bulletants', name:'Bullet Ants Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'bulletants',
  desc: n => 'Defeat ' + n + ' of the DNB Bullet Ants.',
  tiers:[ { threshold:5, itemId:'grislycloak' }, { threshold:20, enemyId:'syncopehopper' }, { threshold:50, itemId:'slayertrophy_bulletants' } ] });
addTierSet({ baseId:'slayer_venomsack', name:'Venom Sack Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'venomsack',
  desc: n => 'Defeat ' + n + ' of the DNB Venom Sack.',
  tiers:[ { threshold:5, enemyId:'tremorswarm' }, { threshold:20, itemId:'sunkengauntlet' }, { threshold:50, itemId:'slayertrophy_venomsack' } ] });
addTierSet({ baseId:'slayer_broodhivecaller', name:'Brood Hive Caller Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'broodhivecaller',
  desc: n => 'Defeat ' + n + ' of the DNB Brood Hive Caller.',
  tiers:[ { threshold:5, itemId:'slickgauntlet' }, { threshold:20, enemyId:'sumppike' }, { threshold:50, itemId:'slayertrophy_broodhivecaller' } ] });
addTierSet({ baseId:'slayer_lichenmender', name:'Lichen Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'lichenmender',
  desc: n => 'Defeat ' + n + ' of the DNB Lichen Mender.',
  tiers:[ { threshold:5, enemyId:'effluentmite' }, { threshold:20, itemId:'ancienttalisman' }, { threshold:50, itemId:'slayertrophy_lichenmender' } ] });
addTierSet({ baseId:'slayer_idolwarden', name:'Idol Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'idolwarden',
  desc: n => 'Defeat ' + n + ' of the DNB Idol Warden.',
  tiers:[ { threshold:5, itemId:'forsakentalisman' }, { threshold:20, enemyId:'culvertlobber' }, { threshold:50, itemId:'slayertrophy_idolwarden' } ] });
addTierSet({ baseId:'slayer_curaremarksman', name:'Curare Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'curaremarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Curare Marksman.',
  tiers:[ { threshold:5, enemyId:'pipewhistle' }, { threshold:20, itemId:'scavengedtalisman' }, { threshold:50, itemId:'slayertrophy_curaremarksman' } ] });
addTierSet({ baseId:'slayer_canopyblink', name:'Canopy Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'canopyblink',
  desc: n => 'Defeat ' + n + ' of the DNB Canopy Blink.',
  tiers:[ { threshold:5, itemId:'hallowedheart' }, { threshold:20, enemyId:'vaporshade' }, { threshold:50, itemId:'slayertrophy_canopyblink' } ] });
addTierSet({ baseId:'slayer_blackjaguar', name:'Black Jaguar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'blackjaguar',
  desc: n => 'Defeat ' + n + ' of the DNB Black Jaguar.',
  tiers:[ { threshold:5, enemyId:'cisternweaver' }, { threshold:20, itemId:'crackedcloak' }, { threshold:50, itemId:'slayertrophy_blackjaguar' } ] });
addTierSet({ baseId:'slayer_ceibabrute', name:'Ceiba Brute Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ceibabrute',
  desc: n => 'Defeat ' + n + ' of the DNB Ceiba Brute.',
  tiers:[ { threshold:5, itemId:'longeffigy' }, { threshold:20, enemyId:'ductburrower' }, { threshold:50, itemId:'slayertrophy_ceibabrute' } ] });
addTierSet({ baseId:'slayer_toxinrunner', name:'Toxin Runner Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'toxinrunner',
  desc: n => 'Defeat ' + n + ' of the DNB Toxin Runner.',
  tiers:[ { threshold:5, enemyId:'filthmender' }, { threshold:20, itemId:'crackedrune' }, { threshold:50, itemId:'slayertrophy_toxinrunner' } ] });
addTierSet({ baseId:'slayer_toadspitter', name:'Toad Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'toadspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Toad Spitter.',
  tiers:[ { threshold:5, itemId:'hallowedpendant' }, { threshold:20, pillColorId:'honey' }, { threshold:50, itemId:'slayertrophy_toadspitter' } ] });
addTierSet({ baseId:'slayer_hornetbomber', name:'Hornet Bomber Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hornetbomber',
  desc: n => 'Defeat ' + n + ' of the DNB Hornet Bomber.',
  tiers:[ { threshold:5, pillColorId:'caramel' }, { threshold:20, itemId:'deepgauntlet' }, { threshold:50, itemId:'slayertrophy_hornetbomber' } ] });
addTierSet({ baseId:'slayer_harpystriker', name:'Harpy Striker Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'harpystriker',
  desc: n => 'Defeat ' + n + ' of the DNB Harpy Striker.',
  tiers:[ { threshold:5, itemId:'forsakenlocket' }, { threshold:20, pillColorId:'cocoa' }, { threshold:50, itemId:'slayertrophy_harpystriker' } ] });
addTierSet({ baseId:'slayer_caimanram', name:'Caiman Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'caimanram',
  desc: n => 'Defeat ' + n + ' of the DNB Caiman Ram.',
  tiers:[ { threshold:5, pillColorId:'espresso' }, { threshold:20, itemId:'numbingmantle' }, { threshold:50, itemId:'slayertrophy_caimanram' } ] });
addTierSet({ baseId:'slayer_miremortar', name:'Mire Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'miremortar',
  desc: n => 'Defeat ' + n + ' of the DNB Mire Mortar.',
  tiers:[ { threshold:5, itemId:'haleribcage' }, { threshold:20, pillColorId:'vanilla' }, { threshold:50, itemId:'slayertrophy_miremortar' } ] });
addTierSet({ baseId:'slayer_centipededelver', name:'Centipede Delver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'centipededelver',
  desc: n => 'Defeat ' + n + ' of the DNB Centipede Delver.',
  tiers:[ { threshold:5, pillColorId:'celadon' }, { threshold:20, itemId:'forsakensignet' }, { threshold:50, itemId:'slayertrophy_centipededelver' } ] });
addTierSet({ baseId:'slayer_mothcircler', name:'Moth Circler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mothcircler',
  desc: n => 'Defeat ' + n + ' of the DNB Moth Circler.',
  tiers:[ { threshold:5, itemId:'whirringeffigy' }, { threshold:20, pillColorId:'seafoam' }, { threshold:50, itemId:'slayertrophy_mothcircler' } ] });
addTierSet({ baseId:'slayer_glyphwatcher', name:'Glyph Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'glyphwatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Glyph Watcher.',
  tiers:[ { threshold:5, pillColorId:'glacier' }, { threshold:20, itemId:'feintingsigil' }, { threshold:50, itemId:'slayertrophy_glyphwatcher' } ] });
addTierSet({ baseId:'slayer_fogshade', name:'Fog Shade Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'fogshade',
  desc: n => 'Defeat ' + n + ' of the DNB Fog Shade.',
  tiers:[ { threshold:5, itemId:'beckoningvestment' }, { threshold:20, pillColorId:'frost' }, { threshold:50, itemId:'slayertrophy_fogshade' } ] });
addTierSet({ baseId:'slayer_monolithbulk', name:'Monolith Bulk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'monolithbulk',
  desc: n => 'Defeat ' + n + ' of the DNB Monolith Bulk.',
  tiers:[ { threshold:5, pillColorId:'storm' }, { threshold:20, itemId:'ancientmantle' }, { threshold:50, itemId:'slayertrophy_monolithbulk' } ] });

/* ---- C-branch DEEP RAINFOREST Slayer ladders (floors 9C + 10C) ----
   The final enemy-Slayer batch for the C branch: 66 enemies (33 per floor),
   same shape as the 3C/4C, 5C/6C and 7C/8C ladders above — 5/20/50 kills.
   ALL THREE rungs carry a reward: t3 is the slayertrophy_<id> passive (see
   data.js), while t1 and t2 each hand out one previously-unclaimed locked
   pill colour / bestiary enemy / trinket / item / familiar. A given enemy's
   t1 and t2 always use two DIFFERENT reward types. This batch drains the
   five shared pools: after it, 1 trinket, 1 item and 1 familiar remain. */
addTierSet({ baseId:'slayer_blightprowler', name:'Blight Prowler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'blightprowler',
  desc: n => 'Defeat ' + n + ' of the DNB Blight Prowler.',
  tiers:[ { threshold:5, familiarId:'brightbloom' }, { threshold:20, itemId:'broadvest' }, { threshold:50, itemId:'slayertrophy_blightprowler' } ] });
addTierSet({ baseId:'slayer_waspflit', name:'Wasp Flit Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'waspflit',
  desc: n => 'Defeat ' + n + ' of the DNB Wasp Flit.',
  tiers:[ { threshold:5, trinketId:'reaperanklet' }, { threshold:20, familiarId:'marblecoffer' }, { threshold:50, itemId:'slayertrophy_waspflit' } ] });
addTierSet({ baseId:'slayer_sporebulb', name:'Spore Bulb Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sporebulb',
  desc: n => 'Defeat ' + n + ' of the DNB Spore Bulb.',
  tiers:[ { threshold:5, familiarId:'brightcoffer' }, { threshold:20, itemId:'pullingidol' }, { threshold:50, itemId:'slayertrophy_sporebulb' } ] });
addTierSet({ baseId:'slayer_heartwoodplate', name:'Heartwood Plate Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'heartwoodplate',
  desc: n => 'Defeat ' + n + ' of the DNB Heartwood Plate.',
  tiers:[ { threshold:5, trinketId:'clangingquill' }, { threshold:20, familiarId:'brightcell' }, { threshold:50, itemId:'slayertrophy_heartwoodplate' } ] });
addTierSet({ baseId:'slayer_boarram', name:'Boar Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'boarram',
  desc: n => 'Defeat ' + n + ' of the DNB Boar Ram.',
  tiers:[ { threshold:5, familiarId:'ashencrow' }, { threshold:20, itemId:'poppingtalisman' }, { threshold:50, itemId:'slayertrophy_boarram' } ] });
addTierSet({ baseId:'slayer_curarevine', name:'Curare Vine Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'curarevine',
  desc: n => 'Defeat ' + n + ' of the DNB Curare Vine.',
  tiers:[ { threshold:5, trinketId:'parchedgear' }, { threshold:20, familiarId:'coraldynamo' }, { threshold:50, itemId:'slayertrophy_curarevine' } ] });
addTierSet({ baseId:'slayer_mantellafrog', name:'Mantella Frog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mantellafrog',
  desc: n => 'Defeat ' + n + ' of the DNB Mantella Frog.',
  tiers:[ { threshold:5, familiarId:'gildedvessel' }, { threshold:20, itemId:'ashengauntlet' }, { threshold:50, itemId:'slayertrophy_mantellafrog' } ] });
addTierSet({ baseId:'slayer_blightspitter', name:'Blight Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'blightspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Blight Spitter.',
  tiers:[ { threshold:5, familiarId:'sootypoultice' }, { threshold:20, trinketId:'jarringlace' }, { threshold:50, itemId:'slayertrophy_blightspitter' } ] });
addTierSet({ baseId:'slayer_gallmortar', name:'Gall Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gallmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Gall Mortar.',
  tiers:[ { threshold:5, itemId:'ancientcloak' }, { threshold:20, trinketId:'crimsonchunk' }, { threshold:50, itemId:'slayertrophy_gallmortar' } ] });
addTierSet({ baseId:'slayer_anacondaweaver', name:'Anaconda Weaver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'anacondaweaver',
  desc: n => 'Defeat ' + n + ' of the DNB Anaconda Weaver.',
  tiers:[ { threshold:5, itemId:'sleetedcirclet' }, { threshold:20, familiarId:'feralshrew' }, { threshold:50, itemId:'slayertrophy_anacondaweaver' } ] });
addTierSet({ baseId:'slayer_obeliskwatcher', name:'Obelisk Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'obeliskwatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Obelisk Watcher.',
  tiers:[ { threshold:5, trinketId:'dreadtag' }, { threshold:20, familiarId:'palesprite' }, { threshold:50, itemId:'slayertrophy_obeliskwatcher' } ] });
addTierSet({ baseId:'slayer_sporeswirl', name:'Spore Swirl Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sporeswirl',
  desc: n => 'Defeat ' + n + ' of the DNB Spore Swirl.',
  tiers:[ { threshold:5, trinketId:'septicspur' }, { threshold:20, itemId:'lopingreliquary' }, { threshold:50, itemId:'slayertrophy_sporeswirl' } ] });
addTierSet({ baseId:'slayer_heartrootborer', name:'Heartroot Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'heartrootborer',
  desc: n => 'Defeat ' + n + ' of the DNB Heartroot Borer.',
  tiers:[ { threshold:5, familiarId:'frostcharm' }, { threshold:20, itemId:'monarchbracer' }, { threshold:50, itemId:'slayertrophy_heartrootborer' } ] });
addTierSet({ baseId:'slayer_driverants', name:'Driver Ants Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'driverants',
  desc: n => 'Defeat ' + n + ' of the DNB Driver Ants.',
  tiers:[ { threshold:5, familiarId:'jadejar' }, { threshold:20, trinketId:'bulwarkknot' }, { threshold:50, itemId:'slayertrophy_driverants' } ] });
addTierSet({ baseId:'slayer_blightsack', name:'Blight Sack Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'blightsack',
  desc: n => 'Defeat ' + n + ' of the DNB Blight Sack.',
  tiers:[ { threshold:5, itemId:'asheneffigy' }, { threshold:20, trinketId:'bilioustoken' }, { threshold:50, itemId:'slayertrophy_blightsack' } ] });
addTierSet({ baseId:'slayer_brooddrummer', name:'Brood Drummer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'brooddrummer',
  desc: n => 'Defeat ' + n + ' of the DNB Brood Drummer.',
  tiers:[ { threshold:5, itemId:'crackedpendant' }, { threshold:20, familiarId:'copperbell' }, { threshold:50, itemId:'slayertrophy_brooddrummer' } ] });
addTierSet({ baseId:'slayer_mosswortmender', name:'Mosswort Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mosswortmender',
  desc: n => 'Defeat ' + n + ' of the DNB Mosswort Mender.',
  tiers:[ { threshold:5, trinketId:'tollingstub' }, { threshold:20, familiarId:'ivorybalm' }, { threshold:50, itemId:'slayertrophy_mosswortmender' } ] });
addTierSet({ baseId:'slayer_monolithwarden', name:'Monolith Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'monolithwarden',
  desc: n => 'Defeat ' + n + ' of the DNB Monolith Warden.',
  tiers:[ { threshold:5, trinketId:'colossusstub' }, { threshold:20, itemId:'cursedvial' }, { threshold:50, itemId:'slayertrophy_monolithwarden' } ] });
addTierSet({ baseId:'slayer_toxinmarksman', name:'Toxin Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'toxinmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Toxin Marksman.',
  tiers:[ { threshold:5, familiarId:'marblecup' }, { threshold:20, itemId:'wilddraught' }, { threshold:50, itemId:'slayertrophy_toxinmarksman' } ] });
addTierSet({ baseId:'slayer_rotblink', name:'Rot Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rotblink',
  desc: n => 'Defeat ' + n + ' of the DNB Rot Blink.',
  tiers:[ { threshold:5, familiarId:'gildedhare' }, { threshold:20, trinketId:'whisperingnail' }, { threshold:50, itemId:'slayertrophy_rotblink' } ] });
addTierSet({ baseId:'slayer_pumalurker', name:'Puma Lurker Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'pumalurker',
  desc: n => 'Defeat ' + n + ' of the DNB Puma Lurker.',
  tiers:[ { threshold:5, itemId:'boilingtonic' }, { threshold:20, trinketId:'adoringwisp' }, { threshold:50, itemId:'slayertrophy_pumalurker' } ] });
addTierSet({ baseId:'slayer_mahoganybrute', name:'Mahogany Brute Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'mahoganybrute',
  desc: n => 'Defeat ' + n + ' of the DNB Mahogany Brute.',
  tiers:[ { threshold:5, itemId:'glassdraught' }, { threshold:20, familiarId:'brightshrew' }, { threshold:50, itemId:'slayertrophy_mahoganybrute' } ] });
addTierSet({ baseId:'slayer_blightrunner', name:'Blight Runner Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'blightrunner',
  desc: n => 'Defeat ' + n + ' of the DNB Blight Runner.',
  tiers:[ { threshold:5, trinketId:'dotingrivet' }, { threshold:20, familiarId:'indigohen' }, { threshold:50, itemId:'slayertrophy_blightrunner' } ] });
addTierSet({ baseId:'slayer_wartspitter', name:'Wart Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'wartspitter',
  desc: n => 'Defeat ' + n + ' of the DNB Wart Spitter.',
  tiers:[ { threshold:5, trinketId:'reapertooth' }, { threshold:20, itemId:'cinderphial' }, { threshold:50, itemId:'slayertrophy_wartspitter' } ] });
addTierSet({ baseId:'slayer_waspbomber', name:'Wasp Bomber Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'waspbomber',
  desc: n => 'Defeat ' + n + ' of the DNB Wasp Bomber.',
  tiers:[ { threshold:5, familiarId:'copperhare' }, { threshold:20, itemId:'vagrantcharge' }, { threshold:50, itemId:'slayertrophy_waspbomber' } ] });
addTierSet({ baseId:'slayer_macawstriker', name:'Macaw Striker Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'macawstriker',
  desc: n => 'Defeat ' + n + ' of the DNB Macaw Striker.',
  tiers:[ { threshold:5, familiarId:'velvetbell' }, { threshold:20, trinketId:'whirringcleat' }, { threshold:50, itemId:'slayertrophy_macawstriker' } ] });
addTierSet({ baseId:'slayer_crocram', name:'Croc Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'crocram',
  desc: n => 'Defeat ' + n + ' of the DNB Croc Ram.',
  tiers:[ { threshold:5, itemId:'boilingprism' }, { threshold:20, trinketId:'adoringcoil' }, { threshold:50, itemId:'slayertrophy_crocram' } ] });
addTierSet({ baseId:'slayer_fungusmortar', name:'Fungus Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'fungusmortar',
  desc: n => 'Defeat ' + n + ' of the DNB Fungus Mortar.',
  tiers:[ { threshold:5, itemId:'oldbell' }, { threshold:20, familiarId:'cinnabarhen' }, { threshold:50, itemId:'slayertrophy_fungusmortar' } ] });
addTierSet({ baseId:'slayer_wormdelver', name:'Worm Delver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'wormdelver',
  desc: n => 'Defeat ' + n + ' of the DNB Worm Delver.',
  tiers:[ { threshold:5, trinketId:'anchoredchit' }, { threshold:20, familiarId:'mossywick' }, { threshold:50, itemId:'slayertrophy_wormdelver' } ] });
addTierSet({ baseId:'slayer_hornetcircler', name:'Hornet Circler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hornetcircler',
  desc: n => 'Defeat ' + n + ' of the DNB Hornet Circler.',
  tiers:[ { threshold:5, trinketId:'crimsonposy' }, { threshold:20, itemId:'stormlantern' }, { threshold:50, itemId:'slayertrophy_hornetcircler' } ] });
addTierSet({ baseId:'slayer_stelawatcher', name:'Stela Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'stelawatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Stela Watcher.',
  tiers:[ { threshold:5, familiarId:'fenbalm' }, { threshold:20, itemId:'oldwhistle' }, { threshold:50, itemId:'slayertrophy_stelawatcher' } ] });
addTierSet({ baseId:'slayer_rotshade', name:'Rot Shade Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rotshade',
  desc: n => 'Defeat ' + n + ' of the DNB Rot Shade.',
  tiers:[ { threshold:5, familiarId:'palehen' }, { threshold:20, trinketId:'fondedge' }, { threshold:50, itemId:'slayertrophy_rotshade' } ] });
addTierSet({ baseId:'slayer_menhirbulk', name:'Menhir Bulk Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'menhirbulk',
  desc: n => 'Defeat ' + n + ' of the DNB Menhir Bulk.',
  tiers:[ { threshold:5, itemId:'radiantbell' }, { threshold:20, trinketId:'gleamingknuckle' }, { threshold:50, itemId:'slayertrophy_menhirbulk' } ] });
addTierSet({ baseId:'slayer_cursedprowler', name:'Cursed Prowler Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cursedprowler',
  desc: n => 'Defeat ' + n + ' of the DNB Cursed Prowler.',
  tiers:[ { threshold:5, itemId:'glassbeacon' }, { threshold:20, familiarId:'driftpoultice' }, { threshold:50, itemId:'slayertrophy_cursedprowler' } ] });
addTierSet({ baseId:'slayer_plagueflit', name:'Plague Flit Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'plagueflit',
  desc: n => 'Defeat ' + n + ' of the DNB Plague Flit.',
  tiers:[ { threshold:5, trinketId:'bracedwishbone' }, { threshold:20, familiarId:'jadecoffer' }, { threshold:50, itemId:'slayertrophy_plagueflit' } ] });
addTierSet({ baseId:'slayer_cankerbloom', name:'Canker Bloom Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cankerbloom',
  desc: n => 'Defeat ' + n + ' of the DNB Canker Bloom.',
  tiers:[ { threshold:5, trinketId:'dulldram' }, { threshold:20, itemId:'oldhorn' }, { threshold:50, itemId:'slayertrophy_cankerbloom' } ] });
addTierSet({ baseId:'slayer_sanctumplate', name:'Sanctum Plate Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'sanctumplate',
  desc: n => 'Defeat ' + n + ' of the DNB Sanctum Plate.',
  tiers:[ { threshold:5, enemyId:'ocelotlurker' }, { threshold:20, familiarId:'lunarmole' }, { threshold:50, itemId:'slayertrophy_sanctumplate' } ] });
addTierSet({ baseId:'slayer_gaurram', name:'Gaur Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gaurram',
  desc: n => 'Defeat ' + n + ' of the DNB Gaur Ram.',
  tiers:[ { threshold:5, trinketId:'frostbitplume' }, { threshold:20, itemId:'vagrantwhistle' }, { threshold:50, itemId:'slayertrophy_gaurram' } ] });
addTierSet({ baseId:'slayer_hexthorn', name:'Hex Thorn Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hexthorn',
  desc: n => 'Defeat ' + n + ' of the DNB Hex Thorn.',
  tiers:[ { threshold:5, enemyId:'pollencircler' }, { threshold:20, familiarId:'onyxcup' }, { threshold:50, itemId:'slayertrophy_hexthorn' } ] });
addTierSet({ baseId:'slayer_gildedfrog', name:'Gilded Frog Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gildedfrog',
  desc: n => 'Defeat ' + n + ' of the DNB Gilded Frog.',
  tiers:[ { threshold:5, trinketId:'giantanklet' }, { threshold:20, itemId:'sacredcharge' }, { threshold:50, itemId:'slayertrophy_gildedfrog' } ] });
addTierSet({ baseId:'slayer_hexcobra', name:'Hex Cobra Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hexcobra',
  desc: n => 'Defeat ' + n + ' of the DNB Hex Cobra.',
  tiers:[ { threshold:5, enemyId:'termitewarden' }, { threshold:20, familiarId:'tidaljar' }, { threshold:50, itemId:'slayertrophy_hexcobra' } ] });
addTierSet({ baseId:'slayer_cursemortar', name:'Curse Mortar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cursemortar',
  desc: n => 'Defeat ' + n + ' of the DNB Curse Mortar.',
  tiers:[ { threshold:5, trinketId:'scavengedsight' }, { threshold:20, itemId:'emberlantern' }, { threshold:50, itemId:'slayertrophy_cursemortar' } ] });
addTierSet({ baseId:'slayer_constrictorweaver', name:'Constrictor Weaver Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'constrictorweaver',
  desc: n => 'Defeat ' + n + ' of the DNB Constrictor Weaver.',
  tiers:[ { threshold:5, enemyId:'blowgunsniper' }, { threshold:20, familiarId:'mossysprite' }, { threshold:50, itemId:'slayertrophy_constrictorweaver' } ] });
addTierSet({ baseId:'slayer_shrinewatcher', name:'Shrine Watcher Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'shrinewatcher',
  desc: n => 'Defeat ' + n + ' of the DNB Shrine Watcher.',
  tiers:[ { threshold:5, trinketId:'tollingribbon' }, { threshold:20, itemId:'wardenchalice' }, { threshold:50, itemId:'slayertrophy_shrinewatcher' } ] });
addTierSet({ baseId:'slayer_miasmaswirl', name:'Miasma Swirl Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'miasmaswirl',
  desc: n => 'Defeat ' + n + ' of the DNB Miasma Swirl.',
  tiers:[ { threshold:5, enemyId:'carrionmender' }, { threshold:20, familiarId:'ivorybloom' }, { threshold:50, itemId:'slayertrophy_miasmaswirl' } ] });
addTierSet({ baseId:'slayer_deeprootborer', name:'Deeproot Borer Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'deeprootborer',
  desc: n => 'Defeat ' + n + ' of the DNB Deeproot Borer.',
  tiers:[ { threshold:5, trinketId:'blastwideplate' }, { threshold:20, itemId:'wakingbell' }, { threshold:50, itemId:'slayertrophy_deeprootborer' } ] });
addTierSet({ baseId:'slayer_siafuants', name:'Siafu Ants Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'siafuants',
  desc: n => 'Defeat ' + n + ' of the DNB Siafu Ants.',
  tiers:[ { threshold:5, enemyId:'fungusplitter' }, { threshold:20, familiarId:'sootymole' }, { threshold:50, itemId:'slayertrophy_siafuants' } ] });
addTierSet({ baseId:'slayer_cursesack', name:'Curse Sack Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cursesack',
  desc: n => 'Defeat ' + n + ' of the DNB Curse Sack.',
  tiers:[ { threshold:5, pillColorId:'thunder' }, { threshold:20, itemId:'hollowbeacon' }, { threshold:50, itemId:'slayertrophy_cursesack' } ] });
addTierSet({ baseId:'slayer_hivehierophant', name:'Hive Hierophant Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hivehierophant',
  desc: n => 'Defeat ' + n + ' of the DNB Hive Hierophant.',
  tiers:[ { threshold:5, trinketId:'rendingwhorl' }, { threshold:20, enemyId:'plaguegnats' }, { threshold:50, itemId:'slayertrophy_hivehierophant' } ] });
addTierSet({ baseId:'slayer_fungusmender', name:'Fungus Mender Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'fungusmender',
  desc: n => 'Defeat ' + n + ' of the DNB Fungus Mender.',
  tiers:[ { threshold:5, itemId:'heraldprism' }, { threshold:20, familiarId:'indigowick' }, { threshold:50, itemId:'slayertrophy_fungusmender' } ] });
addTierSet({ baseId:'slayer_shrinewarden', name:'Shrine Warden Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'shrinewarden',
  desc: n => 'Defeat ' + n + ' of the DNB Shrine Warden.',
  tiers:[ { threshold:5, pillColorId:'ember' }, { threshold:20, trinketId:'mourningfang' }, { threshold:50, itemId:'slayertrophy_shrinewarden' } ] });
addTierSet({ baseId:'slayer_hexmarksman', name:'Hex Marksman Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'hexmarksman',
  desc: n => 'Defeat ' + n + ' of the DNB Hex Marksman.',
  tiers:[ { threshold:5, familiarId:'indigobalm' }, { threshold:20, enemyId:'graveorchid' }, { threshold:50, itemId:'slayertrophy_hexmarksman' } ] });
addTierSet({ baseId:'slayer_miasmablink', name:'Miasma Blink Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'miasmablink',
  desc: n => 'Defeat ' + n + ' of the DNB Miasma Blink.',
  tiers:[ { threshold:5, itemId:'gravecenser' }, { threshold:20, pillColorId:'magma' }, { threshold:50, itemId:'slayertrophy_miasmablink' } ] });
addTierSet({ baseId:'slayer_ghostjaguar', name:'Ghost Jaguar Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'ghostjaguar',
  desc: n => 'Defeat ' + n + ' of the DNB Ghost Jaguar.',
  tiers:[ { threshold:5, enemyId:'shrikesniper' }, { threshold:20, trinketId:'skimmingrift' }, { threshold:50, itemId:'slayertrophy_ghostjaguar' } ] });
addTierSet({ baseId:'slayer_kapokbrute', name:'Kapok Brute Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'kapokbrute',
  desc: n => 'Defeat ' + n + ' of the DNB Kapok Brute.',
  tiers:[ { threshold:5, familiarId:'verdantmole' }, { threshold:20, itemId:'glasstonic' }, { threshold:50, itemId:'slayertrophy_kapokbrute' } ] });
addTierSet({ baseId:'slayer_cursedrunner', name:'Cursed Runner Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'cursedrunner',
  desc: n => 'Defeat ' + n + ' of the DNB Cursed Runner.',
  tiers:[ { threshold:5, trinketId:'acridveil' }, { threshold:20, pillColorId:'soot' }, { threshold:50, itemId:'slayertrophy_cursedrunner' } ] });
addTierSet({ baseId:'slayer_bufospitter', name:'Bufo Spitter Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'bufospitter',
  desc: n => 'Defeat ' + n + ' of the DNB Bufo Spitter.',
  tiers:[ { threshold:5, enemyId:'bilebrewer' }, { threshold:20, familiarId:'silverdynamo' }, { threshold:50, itemId:'slayertrophy_bufospitter' } ] });
addTierSet({ baseId:'slayer_plaguebomber', name:'Plague Bomber Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'plaguebomber',
  desc: n => 'Defeat ' + n + ' of the DNB Plague Bomber.',
  tiers:[ { threshold:5, pillColorId:'mercury' }, { threshold:20, itemId:'wardenwhistle' }, { threshold:50, itemId:'slayertrophy_plaguebomber' } ] });
addTierSet({ baseId:'slayer_harpyshrieker', name:'Harpy Shrieker Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'harpyshrieker',
  desc: n => 'Defeat ' + n + ' of the DNB Harpy Shrieker.',
  tiers:[ { threshold:5, trinketId:'clangingchip' }, { threshold:20, enemyId:'gildedmantis' }, { threshold:50, itemId:'slayertrophy_harpyshrieker' } ] });
addTierSet({ baseId:'slayer_rootram', name:'Root Ram Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'rootram',
  desc: n => 'Defeat ' + n + ' of the DNB Root Ram.',
  tiers:[ { threshold:5, itemId:'mooncharge' }, { threshold:20, familiarId:'sootynymph' }, { threshold:50, itemId:'slayertrophy_rootram' } ] });

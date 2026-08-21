'use strict';
// data/enemies/types-2.js — split from enemies.js ENEMY_TYPES (part 2/4).
Object.assign(ENEMY_TYPES, {

  // -- 13 — the convergence: the A-side's reach and the B-side's staying power
  // in the same room. Only the mites are cheap; everything else is a real
  // threat on its own, which is the whole difficulty step for this floor --
  onbeatstalker: { id:'onbeatstalker', name:'DNB Onbeat Stalker', hp:5, dmg:2, speed:135, radius:11, color:'#ffd447', dark:'#7a6410',
    behavior:'chaser', contactCooldown:0.45, floorKey:'13' },
  downbeatbrute: { id:'downbeatbrute', name:'DNB Downbeat Brute', hp:12, dmg:3, speed:42, radius:18, color:'#3a3020', dark:'#1a160c',
    behavior:'chaser', contactCooldown:1.1, floorKey:'13' },
  crescendocharger: { id:'crescendocharger', name:'DNB Crescendo Charger', hp:6, dmg:3, speed:62, radius:14, color:'#e0a83a', dark:'#6e501a',
    behavior:'charger', chargeCooldown:1.8, chargeSpeed:7, telegraphTime:0.5, floorKey:'13' },
  apexmarksman: { id:'apexmarksman', name:'DNB Apex Marksman', hp:5, dmg:3, speed:54, radius:10, color:'#ffd447', dark:'#7a6410',
    behavior:'sniper', fireRange:580, telegraphTime:1.1, fireCooldown:2.4, boltSpeed:470,
    boltColor:'#ffe98a', boltRadius:4, weight:0.6, floorKey:'13' },
  codablinker: { id:'codablinker', name:'DNB Coda Blinker', hp:6, dmg:2, speed:0, radius:10, color:'#c9a83a', dark:'#60501a',
    behavior:'teleporter', blinkCooldown:2.9, blinkRange:240, fireRange:440, fireCooldown:1.25, boltSpeed:230,
    boltColor:'#ffe98a', boltRadius:5, floorKey:'13' },
  resonancewarden: { id:'resonancewarden', name:'DNB Resonance Warden', hp:8, dmg:1, speed:48, radius:14, color:'#8a7a4a', dark:'#453c24',
    behavior:'shielder', shieldRadius:150, shieldGrantTime:3, shieldCooldown:4.6, keepDistance:205, weight:0.6, floorKey:'13' },
  finalemortar: { id:'finalemortar', name:'DNB Finale Mortar', hp:7, dmg:2, speed:46, radius:13, color:'#a89040', dark:'#544820',
    behavior:'lobber', lobRange:300, lobTime:0.95, burstRadius:54, fireCooldown:2.1, floorKey:'13' },
  goldenmites: { id:'goldenmites', name:'DNB Golden Mites', hp:3, dmg:1, speed:155, radius:7, color:'#ffe98a', dark:'#7a7040',
    behavior:'swarm', driftAmount:0.65, floorKey:'13' },

  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH A (Crypt + Forest) — BEGIN =====
     20 regular enemies: 10 stage 0 and 10 stage 1, each split 5 new
     archetypes + 5 reskin variants (the skullcharger/sandcharger/hellcharger
     pattern — same `behavior`, recoloured and recalibrated). Every behavior
     string here is one combat.js's updateEnemy switch already dispatches; no
     new AI was added for this batch. hp is on the shared identity scale, so
     these were authored by comparing against the SAME-stage entries above
     (Crypt spans 1-7, Forest 1-9) and not against the deeper rosters.
     Batches B/C/D append AFTER the END marker below. ===== */

  // -- Crypt, batch A: new archetypes. weaver/sentry/splitter had no stage-0
  // representative at all; the other two are new shapes on existing behaviors
  // (a floating bomber, and stage 0's first multi-shot fan via shotCount). --
  pallweaver: { id:'pallweaver', name:'DNB Pall Weaver', hp:4, dmg:2, speed:84, radius:11, color:'#8a7a9c', dark:'#4a4054',
    behavior:'weaver', weaveAmplitude:0.62, weaveFrequency:3.1, xpTier:2, stage:0 },
  ossuarysentry: { id:'ossuarysentry', name:'DNB Ossuary Sentry', hp:5, dmg:1, speed:44, radius:12, color:'#b0a894', dark:'#5e5848',
    behavior:'sentry', sentryThreshold:32, fireRange:410, fireCooldown:1.5, boltSpeed:200,
    boltColor:'#d9d0b0', boltRadius:5, xpTier:2, stage:0 },
  tombbloater: { id:'tombbloater', name:'DNB Tomb Bloater', hp:5, dmg:2, speed:66, radius:13, color:'#7a8a6a', dark:'#3f4a35',
    behavior:'splitter', splitInto:'cryptmite', xpTier:2, stage:0 },
  miasmadrifter: { id:'miasmadrifter', name:'DNB Miasma Drifter', hp:3, dmg:2, speed:86, radius:11, color:'#6a8a70', dark:'#37483a',
    behavior:'bomber', fuseTime:1.3, blastRadius:88, flies:true, xpTier:2, stage:0 },
  dirgechanter: { id:'dirgechanter', name:'DNB Dirge Chanter', hp:3, dmg:1, speed:50, radius:11, color:'#5a4a6a', dark:'#2f2638',
    behavior:'ranged', keepDistance:210, fireCooldown:2.2, boltSpeed:180, shotCount:3, spreadAngle:0.4,
    boltColor:'#c9b4d9', boltRadius:4, xpTier:2, stage:0 },

  // -- Crypt, batch A: reskin variants (source entry noted per line) --
  shroudmoth: { id:'shroudmoth', name:'DNB Shroud Moth', hp:3, dmg:1, speed:92, radius:9, color:'#a89cc9', dark:'#524a6a',
    behavior:'orbiter', flies:true, orbitRadius:120, orbitSpeed:1.35, fireRange:350, fireCooldown:2, boltSpeed:185,
    boltColor:'#c9c0e0', boltRadius:4, xpTier:1, stage:0 }, // <- glowmoth
  charnelmites: { id:'charnelmites', name:'DNB Charnel Mites', hp:2, dmg:1, speed:138, radius:7, color:'#6a5a48', dark:'#3a3026',
    behavior:'swarm', driftAmount:0.5, xpTier:1, stage:0 }, // <- gnatcloud/cryptmite
  cryptleech: { id:'cryptleech', name:'DNB Crypt Leech', hp:3, dmg:2, speed:64, radius:10, color:'#7a3a4a', dark:'#421e28',
    behavior:'leaper', leapCooldown:1.4, leapSpeed:5.2, telegraphTime:0.35, xpTier:2, stage:0 }, // <- direfox
  tombtoller: { id:'tombtoller', name:'DNB Tomb Toller', hp:5, dmg:2, speed:38, radius:13, color:'#5a5a6a', dark:'#30303a',
    behavior:'ranged', keepDistance:150, fireCooldown:2.5, boltSpeed:150,
    boltColor:'#b0a8c9', boltRadius:6, xpTier:2, stage:0 }, // <- creepervine
  boneskitter: { id:'boneskitter', name:'DNB Bone Skitter', hp:2, dmg:2, speed:132, radius:9, color:'#d9d2c0', dark:'#7a7460',
    behavior:'chaser', contactCooldown:0.4, xpTier:2, stage:0 }, // <- venomskitter/ashskitter

  // -- Forest, batch A: new archetypes. shielder/lobber had no stage-1
  // representative; the other three are new shapes — a close-range spread
  // shooter, a fan-firing emplacement, and a summoner that seeds BOMBERS. --
  bramblewarden: { id:'bramblewarden', name:'DNB Bramble Warden', hp:5, dmg:1, speed:52, radius:12, color:'#5a7a3a', dark:'#2e401d',
    behavior:'shielder', shieldRadius:135, shieldGrantTime:2.4, shieldCooldown:5, keepDistance:195, xpTier:1, stage:1 },
  acornmortar: { id:'acornmortar', name:'DNB Acorn Mortar', hp:4, dmg:2, speed:54, radius:12, color:'#93713a', dark:'#4c391c',
    behavior:'lobber', lobRange:265, lobTime:1.1, burstRadius:46, fireCooldown:2.5, xpTier:2, stage:1 },
  bristleback: { id:'bristleback', name:'DNB Bristleback', hp:5, dmg:1, speed:58, radius:13, color:'#72913f', dark:'#39491d',
    behavior:'ranged', keepDistance:130, fireCooldown:2.4, boltSpeed:170, shotCount:5, spreadAngle:0.9,
    boltColor:'#c9e07a', boltRadius:4, xpTier:2, stage:1 },
  thistlepod: { id:'thistlepod', name:'DNB Thistle Pod', hp:5, dmg:1, speed:0, radius:12, color:'#4a7a2a', dark:'#254014',
    behavior:'turret', fireCooldown:2.2, boltSpeed:185, shotCount:3, spreadAngle:0.5,
    boltColor:'#a8d96a', boltRadius:5, xpTier:1, stage:1 },
  hivestump: { id:'hivestump', name:'DNB Hive Stump', hp:6, dmg:1, speed:46, radius:13, color:'#7a5a2a', dark:'#3f2e15',
    behavior:'summoner', summonId:'stingswarm', summonCount:1, summonCooldown:5.5, maxSummons:5, keepDistance:210,
    weight:0.6, xpTier:2, stage:1 },

  // -- Forest, batch A: reskin variants (source entry noted per line) --
  puffcap: { id:'puffcap', name:'DNB Puffcap', hp:3, dmg:2, speed:88, radius:11, color:'#c9b48a', dark:'#6a5f44',
    behavior:'bomber', fuseTime:1.3, blastRadius:86, flies:true, xpTier:2, stage:1 }, // <- miasmadrifter
  loamweaver: { id:'loamweaver', name:'DNB Loam Weaver', hp:5, dmg:2, speed:78, radius:12, color:'#6f5a2e', dark:'#3a2e17',
    behavior:'weaver', weaveAmplitude:0.6, weaveFrequency:3, xpTier:2, stage:1 }, // <- thicketweaver/pallweaver
  oaksentry: { id:'oaksentry', name:'DNB Oak Sentry', hp:6, dmg:1, speed:40, radius:13, color:'#5a4a2a', dark:'#2e2615',
    behavior:'sentry', sentryThreshold:32, fireRange:430, fireCooldown:1.4, boltSpeed:205,
    boltColor:'#c9e07a', boltRadius:5, weight:0.6, xpTier:2, stage:1 }, // <- barkwatcher/ossuarysentry
  burrbloater: { id:'burrbloater', name:'DNB Burr Bloater', hp:6, dmg:2, speed:62, radius:14, color:'#7a9c3a', dark:'#3f501d',
    behavior:'splitter', splitInto:'sprout', xpTier:2, stage:1 }, // <- sapling/tombbloater
  sporechanter: { id:'sporechanter', name:'DNB Spore Chanter', hp:4, dmg:1, speed:52, radius:11, color:'#4a6a3a', dark:'#25351d',
    behavior:'ranged', keepDistance:200, fireCooldown:2.1, boltSpeed:185, shotCount:3, spreadAngle:0.44,
    boltColor:'#b4e08a', boltRadius:4, xpTier:2, stage:1 }, // <- dirgechanter
  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH A (Crypt + Forest) — END ===== */

  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH B (Desert + Inferno) — BEGIN =====
     Same shape as batch A: 20 regular enemies, 10 stage 2 and 10 stage 3,
     each split 5 new archetypes + 5 reskin variants (the
     skullcharger/sandcharger/hellcharger pattern — same `behavior`, recoloured
     and recalibrated for its stage). Every behavior string here is one that
     combat.js's updateEnemy switch already dispatches; no new AI was added.
     hp is on the shared identity scale (enemyHpScale multiplies it at spawn),
     so these were authored by comparing against the SAME-stage entries above —
     Desert against the duneskitter..ironsentinel block, Inferno against the
     emberling..moltensentinel block — never against the deeper floorKey
     rosters. Batches C/D append AFTER the END marker below. ===== */

  // -- Desert, batch B: new archetypes. `splitter` and `ambusher` had no
  // stage-2 representative at all; the other three are new shapes on existing
  // behaviors (desert's first FLYING bomber, its first wide multi-shot fan
  // emplacement, and a summoner that seeds the stage's own locust swarm
  // instead of the generic swarmerdnb every other summoner uses). --
  chitinhusk: { id:'chitinhusk', name:'DNB Chitin Husk', hp:6, dmg:2, speed:72, radius:13, color:'#b08a52', dark:'#5e4828',
    behavior:'splitter', splitInto:'locustfleck', xpTier:2, stage:2 },
  quicksandlurker: { id:'quicksandlurker', name:'DNB Quicksand Lurker', hp:5, dmg:3, speed:54, radius:12, color:'#9a8a5a', dark:'#4e4630',
    behavior:'ambusher', triggerRange:120, chargeSpeed:6.4, dashDuration:0.5, telegraphTime:0.32, chargeCooldown:2.4, xpTier:2, stage:2 },
  glasspiketurret: { id:'glasspiketurret', name:'DNB Glasspike Turret', hp:5, dmg:1, speed:0, radius:12, color:'#8ac9a8', dark:'#46685a',
    behavior:'turret', fireCooldown:2.3, boltSpeed:180, shotCount:4, spreadAngle:0.7,
    boltColor:'#c9e8d6', boltRadius:5, xpTier:1, stage:2 },
  scarabdrone: { id:'scarabdrone', name:'DNB Scarab Drone', hp:3, dmg:2, speed:92, radius:11, color:'#4a8a72', dark:'#24463a',
    behavior:'bomber', fuseTime:1.1, blastRadius:82, flies:true, xpTier:2, stage:2 },
  carrioncaller: { id:'carrioncaller', name:'DNB Carrion Caller', hp:4, dmg:1, speed:52, radius:11, color:'#7a6a3a', dark:'#3d3520',
    behavior:'summoner', summonId:'locustfleck', summonCount:2, summonCooldown:6, maxSummons:5, keepDistance:200,
    weight:0.6, xpTier:2, stage:2 },

  // -- Desert, batch B: reskin variants (source entry noted per line) --
  mirrormoth: { id:'mirrormoth', name:'DNB Mirror Moth', hp:3, dmg:1, speed:96, radius:9, color:'#f0ead0', dark:'#a09468',
    behavior:'orbiter', flies:true, orbitRadius:128, orbitSpeed:1.42, fireRange:380, fireCooldown:1.8, boltSpeed:195,
    boltColor:'#f0e0a8', boltRadius:4, xpTier:1, stage:2 }, // <- shroudmoth/flarecircler
  saltbloater: { id:'saltbloater', name:'DNB Salt Bloater', hp:5, dmg:2, speed:80, radius:12, color:'#dcd6c2', dark:'#7a7466',
    behavior:'splitter', splitInto:'duneskitter', xpTier:2, stage:2 }, // <- chitinhusk
  sandtrapper: { id:'sandtrapper', name:'DNB Sand Trapper', hp:4, dmg:2, speed:62, radius:11, color:'#c9b078', dark:'#6a5c3c',
    behavior:'ambusher', triggerRange:105, chargeSpeed:7, dashDuration:0.42, telegraphTime:0.26, chargeCooldown:2, xpTier:1, stage:2 }, // <- quicksandlurker
  siroccochanter: { id:'siroccochanter', name:'DNB Sirocco Chanter', hp:4, dmg:1, speed:54, radius:11, color:'#d9a878', dark:'#78583c',
    behavior:'ranged', keepDistance:195, fireCooldown:2, boltSpeed:195, shotCount:3, spreadAngle:0.42,
    boltColor:'#f0d68a', boltRadius:4, xpTier:2, stage:2 }, // <- dirgechanter/sporechanter
  basaltpouncer: { id:'basaltpouncer', name:'DNB Basalt Pouncer', hp:6, dmg:3, speed:48, radius:14, color:'#6e6252', dark:'#3a332a',
    behavior:'leaper', leapCooldown:1.8, leapSpeed:4.8, telegraphTime:0.5, xpTier:2, stage:2 }, // <- jackaljumper

  // -- Inferno, batch B: new archetypes. `splitter`, `swarm` and `sniper` all
  // had no stage-3 representative; the other two are new shapes — the stage's
  // first flying bomber, and its first wide multi-shot fan emplacement. --
  slagbloater: { id:'slagbloater', name:'DNB Slag Bloater', hp:7, dmg:2, speed:70, radius:14, color:'#a04a2e', dark:'#542213',
    behavior:'splitter', splitInto:'cindermites', xpTier:2, stage:3 },
  cindermites: { id:'cindermites', name:'DNB Cinder Mites', hp:2, dmg:1, speed:148, radius:7, color:'#ff6a3a', dark:'#8a2e12',
    behavior:'swarm', driftAmount:0.58, xpTier:1, stage:3 },
  pyremarksman: { id:'pyremarksman', name:'DNB Pyre Marksman', hp:4, dmg:2, speed:54, radius:10, color:'#d96a4a', dark:'#6e2e1c',
    behavior:'sniper', fireRange:550, telegraphTime:1.15, fireCooldown:2.6, boltSpeed:440,
    boltColor:'#ffb46a', boltRadius:4, weight:0.6, xpTier:2, stage:3 },
  cinderdrone: { id:'cinderdrone', name:'DNB Cinder Drone', hp:4, dmg:2, speed:104, radius:11, color:'#6a3a2a', dark:'#341c14',
    behavior:'bomber', fuseTime:0.95, blastRadius:88, flies:true, xpTier:2, stage:3 },
  magmaspire: { id:'magmaspire', name:'DNB Magma Spire', hp:6, dmg:1, speed:0, radius:13, color:'#3a1e1a', dark:'#1c0e0c',
    behavior:'turret', fireCooldown:2.1, boltSpeed:195, shotCount:4, spreadAngle:0.75,
    boltColor:'#f0762e', boltRadius:5, xpTier:1, stage:3 },

  // -- Inferno, batch B: reskin variants (source entry noted per line) --
  charhusk: { id:'charhusk', name:'DNB Char Husk', hp:6, dmg:3, speed:58, radius:15, color:'#5a3428', dark:'#2c1812',
    behavior:'splitter', splitInto:'emberling', xpTier:2, stage:3 }, // <- slagbloater
  emberchanter: { id:'emberchanter', name:'DNB Ember Chanter', hp:5, dmg:2, speed:52, radius:11, color:'#b4482e', dark:'#5e2214',
    behavior:'ranged', keepDistance:190, fireCooldown:1.95, boltSpeed:200, shotCount:3, spreadAngle:0.4,
    boltColor:'#f0a03a', boltRadius:4, xpTier:2, stage:3 }, // <- siroccochanter/dirgechanter
  obsidianpouncer: { id:'obsidianpouncer', name:'DNB Obsidian Pouncer', hp:7, dmg:3, speed:46, radius:15, color:'#2e2430', dark:'#161018',
    behavior:'leaper', leapCooldown:1.9, leapSpeed:4.8, telegraphTime:0.5, xpTier:2, stage:3 }, // <- basaltpouncer/magmaleaper
  sootmarksman: { id:'sootmarksman', name:'DNB Soot Marksman', hp:3, dmg:2, speed:64, radius:9, color:'#8a6a60', dark:'#453430',
    behavior:'sniper', fireRange:500, telegraphTime:0.95, fireCooldown:2.2, boltSpeed:460,
    boltColor:'#e0c8b4', boltRadius:4, weight:0.6, xpTier:1, stage:3 }, // <- pyremarksman
  sparkmites: { id:'sparkmites', name:'DNB Spark Mites', hp:3, dmg:1, speed:156, radius:7, color:'#ffb02e', dark:'#8a5c10',
    behavior:'swarm', driftAmount:0.66, xpTier:1, stage:3 }, // <- cindermites
  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH B (Desert + Inferno) — END ===== */

  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH C (9A/9B/10A/10B) — BEGIN =====
     40 regular enemies: 10 apiece for the four BRANCH-FLOOR pools (floorKey,
     not stage), each split 5 new archetypes + 5 reskin variants — the same
     copy-and-recalibrate pattern batches A and B used. Every behavior string
     here is one combat.js's updateEnemy switch already dispatches; no new AI
     was added. These were calibrated against the SAME-floorKey rosters above
     (9A shadow/storm, 9B frost+masonry, 10A glacier, 10B jungle), which sit
     several hp higher than the stage 0-3 rosters because branch floors are
     floorNum 8-9 — so nothing here was compared against a Crypt/Forest entry.
     floorKey pools carry no xpTier by design (see the note on the 9A block);
     `weight:0.6` appears only where the same-pool neighbour already used it.
     Batch D (11A/11B/12A/12B) appends AFTER the END marker below. ===== */

  // -- 9A (shadow / storm / void), batch C: new archetypes. `splitter`,
  // `summoner` and `healer` had no 9A representative at all; the other two are
  // new shapes on existing behaviors (9A's first FLYING bomber, and its first
  // multi-shot fan via shotCount). --
  voidhusk: { id:'voidhusk', name:'DNB Void Husk', hp:7, dmg:2, speed:72, radius:14, color:'#3f3358', dark:'#1f1a2c',
    behavior:'splitter', splitInto:'gloommites', floorKey:'9A' },
  shadecaller: { id:'shadecaller', name:'DNB Shade Caller', hp:5, dmg:1, speed:52, radius:12, color:'#4c3f74', dark:'#261f3a',
    behavior:'summoner', summonId:'gloommites', summonCount:2, summonCooldown:5.5, maxSummons:6, keepDistance:200, floorKey:'9A' },
  duskmender: { id:'duskmender', name:'DNB Dusk Mender', hp:5, dmg:1, speed:74, radius:11, color:'#9c8ad0', dark:'#4c4268',
    behavior:'healer', healAmount:3, healCooldown:2.8, healRadius:155, floorKey:'9A' },
  thunderdrone: { id:'thunderdrone', name:'DNB Thunder Drone', hp:4, dmg:2, speed:106, radius:11, color:'#3a4a86', dark:'#1c2444',
    behavior:'bomber', fuseTime:0.85, blastRadius:86, flies:true, floorKey:'9A' },
  galechanter: { id:'galechanter', name:'DNB Gale Chanter', hp:4, dmg:2, speed:54, radius:11, color:'#7a6ab4', dark:'#3c3358',
    behavior:'ranged', keepDistance:195, fireCooldown:2, boltSpeed:205, shotCount:3, spreadAngle:0.42,
    boltColor:'#c9b4f0', boltRadius:4, floorKey:'9A' },

  // -- 9A, batch C: reskin variants (source entry noted per line) --
  nullmarksman: { id:'nullmarksman', name:'DNB Null Marksman', hp:3, dmg:3, speed:64, radius:9, color:'#221e34', dark:'#100e1a',
    behavior:'sniper', fireRange:500, telegraphTime:0.95, fireCooldown:2.2, boltSpeed:470,
    boltColor:'#e0c9f0', boltRadius:4, weight:0.6, floorKey:'9A' }, // <- voidmarksman
  riftcircler: { id:'riftcircler', name:'DNB Rift Circler', hp:3, dmg:2, speed:112, radius:9, color:'#a06ad9', dark:'#4e3068',
    behavior:'orbiter', flies:true, orbitRadius:115, orbitSpeed:1.55, fireRange:370, fireCooldown:1.5, boltSpeed:215,
    boltColor:'#e0b4ff', boltRadius:4, floorKey:'9A' }, // <- stormcircler
  sableroller: { id:'sableroller', name:'DNB Sable Roller', hp:6, dmg:3, speed:64, radius:13, color:'#2e2a3f', dark:'#161421',
    behavior:'charger', chargeCooldown:1.8, chargeSpeed:7, telegraphTime:0.45, floorKey:'9A' }, // <- gloomroller
  wraithspire: { id:'wraithspire', name:'DNB Wraith Spire', hp:6, dmg:1, speed:0, radius:13, color:'#463f66', dark:'#221e33',
    behavior:'turret', fireCooldown:2.1, boltSpeed:195, shotCount:4, spreadAngle:0.7,
    boltColor:'#b4a0e8', boltRadius:5, floorKey:'9A' }, // <- gloomturret
  hollowdelver: { id:'hollowdelver', name:'DNB Hollow Delver', hp:5, dmg:3, speed:72, radius:12, color:'#5c4a5c', dark:'#2c232c',
    behavior:'burrower', burrowCooldown:2.4, burrowTime:1.2, floorKey:'9A' }, // <- umbraldelver

  // -- 9B (frost + masonry), batch C: new archetypes. `splitter`, `orbiter`
  // and `burrower` had no 9B representative at all; the other two are new
  // shapes — 9B's first FLYING bomber (icebomber walks), and its first
  // multi-shot fan via shotCount. --
  rimehusk: { id:'rimehusk', name:'DNB Rime Husk', hp:7, dmg:2, speed:70, radius:14, color:'#8fb0bc', dark:'#465862',
    behavior:'splitter', splitInto:'flurrymites', floorKey:'9B' },
  cairncircler: { id:'cairncircler', name:'DNB Cairn Circler', hp:4, dmg:1, speed:102, radius:9, color:'#d0dce8', dark:'#68727e',
    behavior:'orbiter', flies:true, orbitRadius:132, orbitSpeed:1.38, fireRange:385, fireCooldown:1.6, boltSpeed:205,
    boltColor:'#eef4fa', boltRadius:4, shotCount:2, spreadAngle:0.24, floorKey:'9B' },
  quarrydelver: { id:'quarrydelver', name:'DNB Quarry Delver', hp:7, dmg:2, speed:64, radius:14, color:'#7a5a48', dark:'#3d2d24',
    behavior:'burrower', burrowCooldown:2.8, burrowTime:1.5, floorKey:'9B' },
  glacierdrone: { id:'glacierdrone', name:'DNB Glacier Drone', hp:4, dmg:2, speed:104, radius:11, color:'#6ac9e0', dark:'#356470',
    behavior:'bomber', fuseTime:0.85, blastRadius:84, flies:true, floorKey:'9B' },
  mortarwright: { id:'mortarwright', name:'DNB Mortar Wright', hp:5, dmg:2, speed:50, radius:12, color:'#b08a72', dark:'#584538',
    behavior:'ranged', keepDistance:190, fireCooldown:2, boltSpeed:200, shotCount:3, spreadAngle:0.44,
    boltColor:'#e0c0a0', boltRadius:4, floorKey:'9B' },

  // -- 9B, batch C: reskin variants (source entry noted per line) --
  masonhusk: { id:'masonhusk', name:'DNB Mason Husk', hp:6, dmg:3, speed:58, radius:15, color:'#96604c', dark:'#4c2f24',
    behavior:'splitter', splitInto:'frostbiter', floorKey:'9B' }, // <- rimehusk
  hoarfrostspire: { id:'hoarfrostspire', name:'DNB Hoarfrost Spire', hp:6, dmg:1, speed:0, radius:13, color:'#a8c4d0', dark:'#54626a',
    behavior:'turret', fireCooldown:2.2, boltSpeed:200, shotCount:4, spreadAngle:0.72,
    boltColor:'#eaf6ff', boltRadius:5, floorKey:'9B' }, // <- sentrytower
  chiselcharger: { id:'chiselcharger', name:'DNB Chisel Charger', hp:6, dmg:3, speed:62, radius:13, color:'#c98a5a', dark:'#664428',
    behavior:'charger', chargeCooldown:1.8, chargeSpeed:7, telegraphTime:0.45, floorKey:'9B' }, // <- palisadecharger
  sleetlurker: { id:'sleetlurker', name:'DNB Sleet Lurker', hp:4, dmg:2, speed:64, radius:11, color:'#dfeef5', dark:'#6f7d84',
    behavior:'ambusher', triggerRange:100, chargeSpeed:7.2, dashDuration:0.42, telegraphTime:0.26, chargeCooldown:2, floorKey:'9B' }, // <- rubblelurker
  brickmender: { id:'brickmender', name:'DNB Brick Mender', hp:6, dmg:1, speed:58, radius:12, color:'#c07a52', dark:'#603c28',
    behavior:'healer', healAmount:2, healCooldown:2.2, healRadius:175, floorKey:'9B' }, // <- hearthtender

  // -- 10A (glacier), batch C: new archetypes. `splitter`, `shielder` and
  // `lobber` had no 10A representative at all; the other two are new shapes —
  // 10A's first FLYING bomber (frostbomber walks), and its first multi-shot
  // fan via shotCount. Bodies run 1 hp heavier than 9A/9B's equivalents to
  // match this pool's own step up (glacierbeast 9, crevassedelver 7). --
  seracbloater: { id:'seracbloater', name:'DNB Serac Bloater', hp:8, dmg:2, speed:68, radius:15, color:'#a8d4e8', dark:'#52697a',
    behavior:'splitter', splitInto:'hailmites', floorKey:'10A' },
  cornicewarden: { id:'cornicewarden', name:'DNB Cornice Warden', hp:7, dmg:1, speed:48, radius:13, color:'#7ab4d0', dark:'#3c5a68',
    behavior:'shielder', shieldRadius:140, shieldGrantTime:2.6, shieldCooldown:4.8, keepDistance:205, floorKey:'10A' },
  avalanchemortar: { id:'avalanchemortar', name:'DNB Avalanche Mortar', hp:6, dmg:2, speed:46, radius:13, color:'#98aebc', dark:'#4c5860',
    behavior:'lobber', lobRange:295, lobTime:1, burstRadius:52, fireCooldown:2.2, floorKey:'10A' },
  frostdrone: { id:'frostdrone', name:'DNB Frost Drone', hp:4, dmg:2, speed:106, radius:11, color:'#5fd0e0', dark:'#2e6670',
    behavior:'bomber', fuseTime:0.85, blastRadius:88, flies:true, floorKey:'10A' },
  glacierchanter: { id:'glacierchanter', name:'DNB Glacier Chanter', hp:5, dmg:2, speed:52, radius:11, color:'#86bcd8', dark:'#42606e',
    behavior:'ranged', keepDistance:195, fireCooldown:2, boltSpeed:205, shotCount:3, spreadAngle:0.42,
    boltColor:'#d6f0ff', boltRadius:4, floorKey:'10A' },

  // -- 10A, batch C: reskin variants (source entry noted per line) --
  floehusk: { id:'floehusk', name:'DNB Floe Husk', hp:6, dmg:3, speed:80, radius:13, color:'#dceef8', dark:'#6c7b84',
    behavior:'splitter', splitInto:'icecrawler', floorKey:'10A' }, // <- seracbloater
  verglaslurker: { id:'verglaslurker', name:'DNB Verglas Lurker', hp:4, dmg:2, speed:66, radius:11, color:'#a0e8f0', dark:'#4e7278',
    behavior:'ambusher', triggerRange:100, chargeSpeed:7.2, dashDuration:0.42, telegraphTime:0.26, chargeCooldown:2, floorKey:'10A' }, // <- driftlurker
  crystalspire: { id:'crystalspire', name:'DNB Crystal Spire', hp:6, dmg:1, speed:0, radius:13, color:'#8ad0e8', dark:'#436672',
    behavior:'turret', fireCooldown:2.1, boltSpeed:200, shotCount:4, spreadAngle:0.7,
    boltColor:'#d6f0ff', boltRadius:5, floorKey:'10A' }, // <- icicleturret
  wintermender: { id:'wintermender', name:'DNB Winter Mender', hp:6, dmg:1, speed:56, radius:12, color:'#5eb4a8', dark:'#2e5a54',
    behavior:'healer', healAmount:2, healCooldown:2.2, healRadius:175, floorKey:'10A' }, // <- thawtender
  seracpouncer: { id:'seracpouncer', name:'DNB Serac Pouncer', hp:6, dmg:3, speed:48, radius:14, color:'#58839c', dark:'#2c414e',
    behavior:'leaper', leapCooldown:1.8, leapSpeed:4.8, telegraphTime:0.5, floorKey:'10A' }, // <- snowpouncer

  // -- 10B (jungle), batch C: new archetypes. `splitter`, `sniper` and
  // `ambusher` had no 10B representative at all; the other two are new shapes
  // — 10B's first FLYING bomber (sporeburster walks), and its first
  // multi-shot fan via shotCount. --
  fruitbloater: { id:'fruitbloater', name:'DNB Fruit Bloater', hp:8, dmg:2, speed:70, radius:15, color:'#8fbb2e', dark:'#48600f',
    behavior:'splitter', splitInto:'midgecloud', floorKey:'10B' },
  bogmarksman: { id:'bogmarksman', name:'DNB Bog Marksman', hp:5, dmg:2, speed:52, radius:10, color:'#4a6a4a', dark:'#243424',
    behavior:'sniper', fireRange:560, telegraphTime:1.2, fireCooldown:2.6, boltSpeed:450,
    boltColor:'#c9f0a8', boltRadius:4, weight:0.6, floorKey:'10B' },
  thicketlurker: { id:'thicketlurker', name:'DNB Thicket Lurker', hp:6, dmg:3, speed:58, radius:13, color:'#2e5a2a', dark:'#173015',
    behavior:'ambusher', triggerRange:120, chargeSpeed:6.8, dashDuration:0.5, telegraphTime:0.3, chargeCooldown:2.2, floorKey:'10B' },
  canopydrone: { id:'canopydrone', name:'DNB Canopy Drone', hp:4, dmg:2, speed:104, radius:11, color:'#b4e04a', dark:'#5a7020',
    behavior:'bomber', fuseTime:0.85, blastRadius:86, flies:true, floorKey:'10B' },
  frondchanter: { id:'frondchanter', name:'DNB Frond Chanter', hp:5, dmg:2, speed:52, radius:11, color:'#6ab45a', dark:'#33582b',
    behavior:'ranged', keepDistance:195, fireCooldown:2, boltSpeed:205, shotCount:3, spreadAngle:0.42,
    boltColor:'#d0f0a0', boltRadius:4, floorKey:'10B' },

  // -- 10B, batch C: reskin variants (source entry noted per line) --
  rotbloater: { id:'rotbloater', name:'DNB Rot Bloater', hp:6, dmg:3, speed:82, radius:13, color:'#7a8a3a', dark:'#3d451c',
    behavior:'splitter', splitInto:'junglestalker', floorKey:'10B' }, // <- fruitbloater
  blightmarksman: { id:'blightmarksman', name:'DNB Blight Marksman', hp:3, dmg:3, speed:66, radius:9, color:'#a8c95a', dark:'#54662c',
    behavior:'sniper', fireRange:510, telegraphTime:0.95, fireCooldown:2.2, boltSpeed:470,
    boltColor:'#eaffc0', boltRadius:4, weight:0.6, floorKey:'10B' }, // <- bogmarksman
  tanglespire: { id:'tanglespire', name:'DNB Tangle Spire', hp:6, dmg:1, speed:0, radius:13, color:'#4e7a2e', dark:'#273d17',
    behavior:'turret', fireCooldown:2.1, boltSpeed:200, shotCount:4, spreadAngle:0.7,
    boltColor:'#c9f0a8', boltRadius:5, floorKey:'10B' }, // <- totemturret
  orchidmender: { id:'orchidmender', name:'DNB Orchid Mender', hp:6, dmg:1, speed:56, radius:12, color:'#d98ac9', dark:'#6a4462',
    behavior:'healer', healAmount:2, healCooldown:2.2, healRadius:175, floorKey:'10B' }, // <- sapmender
  mireshrieker: { id:'mireshrieker', name:'DNB Mire Shrieker', hp:6, dmg:3, speed:64, radius:13, color:'#6e5c3e', dark:'#372e1f',
    behavior:'charger', chargeCooldown:1.8, chargeSpeed:7, telegraphTime:0.45, floorKey:'10B' }, // <- tuskcharger
  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH C (9A/9B/10A/10B) — END ===== */

  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH D (11A/11B/12A/12B) — BEGIN =====
     The last content batch of this update: 10 regular enemies apiece for the
     four DEEPEST branch-floor pools (floorKey, not stage), each split 5 new
     archetypes + 5 reskin variants — same copy-and-recalibrate pattern
     batches A, B and C used. Every behavior string here is one combat.js's
     updateEnemy switch already dispatches; no new AI was added.

     Calibrated against the SAME-floorKey rosters directly above (11A sub-bass
     abyss, 11B flooded bloom, 12A fractured refrain, 12B clipped refrain) and
     nudged by about 1 — NOT re-scaled for depth, because enemyHpScale
     (1.32^floorNum) is already ~16x-27x on these floors and writing "floor 12
     sized" raw numbers would multiply the curve twice. The difficulty step
     comes from COMPOSITION: each of the five new archetypes per pool fills a
     behavior the pool had NO representative of at all.
     floorKey pools carry no xpTier by design; `weight:0.6` appears only where
     a same-pool neighbour already used it. ===== */

  // -- 11A, batch D: new archetypes. `splitter`, `burrower`, `orbiter`,
  // `ranged` and `sentry` had no 11A representative at all — the pool was
  // pure artillery + ambush, so these add a body that fights back on death,
  // one that fights from under the floor, and 11A's first circling flyer. --
  pressurehusk: { id:'pressurehusk', name:'DNB Pressure Husk', hp:8, dmg:2, speed:68, radius:15, color:'#33538f', dark:'#182746',
    behavior:'splitter', splitInto:'undertowmites', floorKey:'11A' },
  trenchdelver: { id:'trenchdelver', name:'DNB Trench Delver', hp:7, dmg:3, speed:64, radius:14, color:'#1f3560', dark:'#0f1a30',
    behavior:'burrower', burrowCooldown:2.6, burrowTime:1.3, floorKey:'11A' },
  sonarcircler: { id:'sonarcircler', name:'DNB Sonar Circler', hp:5, dmg:2, speed:108, radius:10, color:'#7aa4e8', dark:'#3b5074',
    behavior:'orbiter', flies:true, orbitRadius:132, orbitSpeed:1.45, fireRange:395, fireCooldown:1.55, boltSpeed:210,
    boltColor:'#c0dcff', boltRadius:4, floorKey:'11A' },
  basschanter: { id:'basschanter', name:'DNB Bass Chanter', hp:5, dmg:2, speed:52, radius:11, color:'#5a7fc4', dark:'#2c3e62',
    behavior:'ranged', keepDistance:195, fireCooldown:2, boltSpeed:205, shotCount:3, spreadAngle:0.42,
    boltColor:'#b4d0ff', boltRadius:4, floorKey:'11A' },
  depthsentry: { id:'depthsentry', name:'DNB Depth Sentry', hp:8, dmg:2, speed:40, radius:14, color:'#42639c', dark:'#20314e',
    behavior:'sentry', sentryThreshold:34, fireRange:460, fireCooldown:1.2, boltSpeed:230,
    boltColor:'#9cc0ff', boltRadius:5, floorKey:'11A' },

  // -- 11A, batch D: reskin variants (source entry noted per line) --
  hadalturret: { id:'hadalturret', name:'DNB Hadal Turret', hp:7, dmg:1, speed:0, radius:13, color:'#2a3f70', dark:'#141f38',
    behavior:'turret', fireCooldown:2.1, boltSpeed:200, shotCount:4, spreadAngle:0.7,
    boltColor:'#9cc0ff', boltRadius:5, floorKey:'11A' }, // <- crystalspire
  underswellcharger: { id:'underswellcharger', name:'DNB Underswell Charger', hp:7, dmg:3, speed:62, radius:14, color:'#3d6bb8', dark:'#1e355a',
    behavior:'charger', chargeCooldown:1.8, chargeSpeed:7, telegraphTime:0.45, floorKey:'11A' }, // <- peakcharger
  brinemender: { id:'brinemender', name:'DNB Brine Mender', hp:6, dmg:1, speed:58, radius:12, color:'#8ab8e8', dark:'#455c74',
    behavior:'healer', healAmount:2, healCooldown:2.2, healRadius:175, floorKey:'11A' }, // <- tidemender
  sinkerdrone: { id:'sinkerdrone', name:'DNB Sinker Drone', hp:4, dmg:2, speed:106, radius:11, color:'#6a8ec9', dark:'#344764',
    behavior:'bomber', fuseTime:0.85, blastRadius:88, flies:true, floorKey:'11A' }, // <- frostdrone
  leviathanspawn: { id:'leviathanspawn', name:'DNB Leviathan Spawn', hp:6, dmg:3, speed:50, radius:14, color:'#24406e', dark:'#112036',
    behavior:'leaper', leapCooldown:1.7, leapSpeed:5, telegraphTime:0.45, floorKey:'11A' }, // <- stutterleaper

  // -- 11B, batch D: new archetypes. `splitter`, `ambusher`, `sniper`,
  // `shielder` and `teleporter` had no 11B representative at all — the pool
  // was all sustain and numbers with nothing that reached past mid-range, so
  // these give the flooded bloom teeth at distance and a reason to close. --
  polypbloater: { id:'polypbloater', name:'DNB Polyp Bloater', hp:8, dmg:2, speed:68, radius:15, color:'#26b49c', dark:'#0f4a40',
    behavior:'splitter', splitInto:'reefstalker', floorKey:'11B' },
  kelplurker: { id:'kelplurker', name:'DNB Kelp Lurker', hp:6, dmg:3, speed:58, radius:13, color:'#1e6a58', dark:'#0f342c',
    behavior:'ambusher', triggerRange:120, chargeSpeed:6.8, dashDuration:0.5, telegraphTime:0.3, chargeCooldown:2.2, floorKey:'11B' },
  lagoonmarksman: { id:'lagoonmarksman', name:'DNB Lagoon Marksman', hp:5, dmg:2, speed:52, radius:10, color:'#4fd0b0', dark:'#256656',
    behavior:'sniper', fireRange:555, telegraphTime:1.2, fireCooldown:2.5, boltSpeed:450,
    boltColor:'#b4ffe8', boltRadius:4, floorKey:'11B' },
  anemonewarden: { id:'anemonewarden', name:'DNB Anemone Warden', hp:7, dmg:1, speed:46, radius:13, color:'#39c0a0', dark:'#1c6050',
    behavior:'shielder', shieldRadius:145, shieldGrantTime:2.8, shieldCooldown:4.8, keepDistance:200, floorKey:'11B' },
  reefblinker: { id:'reefblinker', name:'DNB Reef Blinker', hp:5, dmg:2, speed:0, radius:10, color:'#66e0c0', dark:'#2f6a5c',
    behavior:'teleporter', blinkCooldown:3.1, blinkRange:230, fireRange:430, fireCooldown:1.3, boltSpeed:225,
    boltColor:'#b4ffe8', boltRadius:5, floorKey:'11B' },

  // -- 11B, batch D: reskin variants (source entry noted per line) --
  spawnmites: { id:'spawnmites', name:'DNB Spawn Mites', hp:2, dmg:1, speed:150, radius:7, color:'#9af0d8', dark:'#48786c',
    behavior:'swarm', driftAmount:0.6, floorKey:'11B' }, // <- undertowmites
  coralspire: { id:'coralspire', name:'DNB Coral Spire', hp:6, dmg:1, speed:0, radius:13, color:'#2f9c8a', dark:'#174e44',
    behavior:'turret', fireCooldown:2.1, boltSpeed:200, shotCount:4, spreadAngle:0.7,
    boltColor:'#b4ffe8', boltRadius:5, floorKey:'11B' }, // <- hadalturret
  surgecharger: { id:'surgecharger', name:'DNB Surge Charger', hp:7, dmg:3, speed:62, radius:14, color:'#1f8a76', dark:'#0f453a',
    behavior:'charger', chargeCooldown:1.8, chargeSpeed:7, telegraphTime:0.45, floorKey:'11B' }, // <- underswellcharger
  tidepoolmortar: { id:'tidepoolmortar', name:'DNB Tidepool Mortar', hp:6, dmg:2, speed:46, radius:13, color:'#4aa890', dark:'#245448',
    behavior:'lobber', lobRange:295, lobTime:1, burstRadius:52, fireCooldown:2.2, floorKey:'11B' }, // <- depthmortar
  siltdelver: { id:'siltdelver', name:'DNB Silt Delver', hp:7, dmg:2, speed:64, radius:14, color:'#5c7a5a', dark:'#2e3d2d',
    behavior:'burrower', burrowCooldown:2.8, burrowTime:1.5, floorKey:'11B' }, // <- trenchdelver

  // -- 12A, batch D: new archetypes. `summoner`, `bomber`, `weaver`,
  // `ranged` and `healer` had no 12A representative at all — the pool was all
  // displacement with zero sustain and nothing that came to YOU, so these add
  // the first bodies that make standing off at range stop working. --
  echocaller: { id:'echocaller', name:'DNB Echo Caller', hp:6, dmg:1, speed:52, radius:12, color:'#a05ad0', dark:'#4e2c66',
    behavior:'summoner', summonId:'swarmerdnb', summonCount:3, summonCooldown:6.2, maxSummons:6, keepDistance:190, floorKey:'12A' },
  staticdrone: { id:'staticdrone', name:'DNB Static Drone', hp:4, dmg:2, speed:108, radius:11, color:'#c96af0', dark:'#623474',
    behavior:'bomber', fuseTime:0.85, blastRadius:88, flies:true, floorKey:'12A' },
  dissonanceweaver: { id:'dissonanceweaver', name:'DNB Dissonance Weaver', hp:5, dmg:2, speed:100, radius:11, color:'#8f4fd0', dark:'#452866',
    behavior:'weaver', weaveAmplitude:0.75, weaveFrequency:3.6, floorKey:'12A' },
  refrainchanter: { id:'refrainchanter', name:'DNB Refrain Chanter', hp:5, dmg:2, speed:52, radius:11, color:'#b47ae0', dark:'#583c6e',
    behavior:'ranged', keepDistance:195, fireCooldown:2, boltSpeed:205, shotCount:3, spreadAngle:0.42,
    boltColor:'#e8c0ff', boltRadius:4, floorKey:'12A' },
  glitchmender: { id:'glitchmender', name:'DNB Glitch Mender', hp:6, dmg:1, speed:58, radius:12, color:'#e0a8f0', dark:'#6e5274',
    behavior:'healer', healAmount:2, healCooldown:2.2, healRadius:175, floorKey:'12A' },

  // -- 12A, batch D: reskin variants (source entry noted per line) --
  loopmites: { id:'loopmites', name:'DNB Loop Mites', hp:2, dmg:1, speed:152, radius:7, color:'#d0a0ff', dark:'#645080',
    behavior:'swarm', driftAmount:0.65, floorKey:'12A' }, // <- wailmites
  skipbrute: { id:'skipbrute', name:'DNB Skip Brute', hp:8, dmg:3, speed:44, radius:16, color:'#6a2ea0', dark:'#33174e',
    behavior:'shielded', shieldTime:2.3, vulnTime:1.7, floorKey:'12A' }, // <- coralguard
  phaselurker: { id:'phaselurker', name:'DNB Phase Lurker', hp:6, dmg:3, speed:60, radius:13, color:'#7a3ac0', dark:'#3c1c5e',
    behavior:'ambusher', triggerRange:125, chargeSpeed:7, dashDuration:0.5, telegraphTime:0.28, chargeCooldown:2.1, floorKey:'12A' }, // <- redlinelurker
  modmortar: { id:'modmortar', name:'DNB Mod Mortar', hp:6, dmg:2, speed:46, radius:13, color:'#a45ad9', dark:'#502c6a',
    behavior:'lobber', lobRange:295, lobTime:0.95, burstRadius:52, fireCooldown:2.2, floorKey:'12A' }, // <- crushmortar
  reversedelver: { id:'reversedelver', name:'DNB Reverse Delver', hp:7, dmg:2, speed:64, radius:14, color:'#5e3a80', dark:'#2e1c40',
    behavior:'burrower', burrowCooldown:2.6, burrowTime:1.3, floorKey:'12A' }, // <- trenchdelver

  // -- 12B, batch D: new archetypes. `splitter`, `sniper`, `leaper`,
  // `orbiter` and `shielded` had no 12B representative at all. Deliberately
  // NO healer / shielder / summoner anywhere in this block: 12B's stated
  // identity is forward pressure with no support, so every addition here is
  // another thing coming at you, just on a different vector. --
  gainsplitter: { id:'gainsplitter', name:'DNB Gain Splitter', hp:8, dmg:2, speed:70, radius:15, color:'#e0304a', dark:'#6e1424',
    behavior:'splitter', splitInto:'wailmites', floorKey:'12B' },
  peakmarksman: { id:'peakmarksman', name:'DNB Peak Marksman', hp:5, dmg:2, speed:52, radius:10, color:'#ff5a7a', dark:'#7a2a3a',
    behavior:'sniper', fireRange:565, telegraphTime:1.1, fireCooldown:2.5, boltSpeed:460,
    boltColor:'#ffc0cc', boltRadius:4, floorKey:'12B' },
  clipleaper: { id:'clipleaper', name:'DNB Clip Leaper', hp:6, dmg:3, speed:62, radius:12, color:'#d43050', dark:'#661828',
    behavior:'leaper', leapCooldown:1.3, leapSpeed:5.4, telegraphTime:0.32, floorKey:'12B' },
  overdrivecircler: { id:'overdrivecircler', name:'DNB Overdrive Circler', hp:5, dmg:2, speed:108, radius:10, color:'#ff8aa4', dark:'#7a4250',
    behavior:'orbiter', flies:true, orbitRadius:130, orbitSpeed:1.55, fireRange:400, fireCooldown:1.5, boltSpeed:215,
    boltColor:'#ffc0cc', boltRadius:4, shotCount:2, spreadAngle:0.26, floorKey:'12B' },
  limiterhulk: { id:'limiterhulk', name:'DNB Limiter Hulk', hp:9, dmg:3, speed:44, radius:16, color:'#7a0c22', dark:'#3c0611',
    behavior:'shielded', shieldTime:2.3, vulnTime:1.7, floorKey:'12B' },

  // -- 12B, batch D: reskin variants (source entry noted per line) --
  saturatorspire: { id:'saturatorspire', name:'DNB Saturator Spire', hp:7, dmg:1, speed:42, radius:13, color:'#b02038', dark:'#54101c',
    behavior:'sentry', sentryThreshold:34, fireRange:460, fireCooldown:1.15, boltSpeed:230,
    boltColor:'#ff9ab0', boltRadius:5, floorKey:'12B' }, // <- refrainsentry
  redlinedrone: { id:'redlinedrone', name:'DNB Redline Drone', hp:4, dmg:2, speed:110, radius:11, color:'#ff4a6a', dark:'#7a2434',
    behavior:'bomber', fuseTime:0.85, blastRadius:88, flies:true, floorKey:'12B' }, // <- staticdrone
  clipblinker: { id:'clipblinker', name:'DNB Clip Blinker', hp:5, dmg:2, speed:0, radius:10, color:'#ec5570', dark:'#722a38',
    behavior:'teleporter', blinkCooldown:3, blinkRange:235, fireRange:430, fireCooldown:1.3, boltSpeed:225,
    boltColor:'#ffc0cc', boltRadius:5, floorKey:'12B' }, // <- warpblinker
  crestcharger: { id:'crestcharger', name:'DNB Crest Charger', hp:7, dmg:3, speed:64, radius:14, color:'#a01830', dark:'#4e0c18',
    behavior:'charger', chargeCooldown:1.8, chargeSpeed:7, telegraphTime:0.45, floorKey:'12B' }, // <- peakcharger
  squarewaveweaver: { id:'squarewaveweaver', name:'DNB Squarewave Weaver', hp:5, dmg:2, speed:98, radius:11, color:'#ff9ab0', dark:'#7a4a56',
    behavior:'weaver', weaveAmplitude:0.75, weaveFrequency:3.6, floorKey:'12B' }, // <- dissonanceweaver
  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH D (11A/11B/12A/12B) — END ===== */

  /* ===== C-BRANCH — THE GUTTERS (3C / 4C) — START =====
     3C is floorNum 2 and 4C is floorNum 3, i.e. the same depth as normal
     floors 3 and 4, so these are calibrated against the stage:0 (crypt) and
     stage:1 (forest) pools — NOT against the 9A/9B floorKey pools, whose
     numbers are floor-9-tier. Theme: storm drains and runoff — silt, rot,
     rust, rats, flood debris. Every one of the 21 non-boss behaviors is
     represented on each floor, plus extra flavors of the common ones. ---- */

  // -- 3C (upper storm drains): one entry per behavior --
  gutterrat: { id:'gutterrat', name:'DNB Gutter Rat', hp:2, dmg:1, speed:128, radius:10, color:'#6a5a44', dark:'#3a3024',
    behavior:'chaser', contactCooldown:0.45, floorKey:'3C' },
  runoffwisp: { id:'runoffwisp', name:'DNB Runoff Wisp', hp:2, dmg:1, speed:104, radius:9, color:'#7aa89c', dark:'#3c5852',
    behavior:'flyer', fireCooldown:2, boltSpeed:180, flies:true, floorKey:'3C' },
  gasbloat: { id:'gasbloat', name:'DNB Gas Bloat', hp:2, dmg:2, speed:98, radius:11, color:'#8a9c4a', dark:'#485224',
    behavior:'bomber', fuseTime:1.1, blastRadius:70, floorKey:'3C' },
  grateguard: { id:'grateguard', name:'DNB Grate Guard', hp:5, dmg:2, speed:48, radius:13, color:'#7a6a5a', dark:'#423a30',
    behavior:'shielded', shieldTime:2, vulnTime:1.8, floorKey:'3C' },
  silthog: { id:'silthog', name:'DNB Silt Hog', hp:5, dmg:3, speed:56, radius:13, color:'#8a6a3a', dark:'#4a381c',
    behavior:'charger', chargeCooldown:2.3, chargeSpeed:6.2, telegraphTime:0.55, floorKey:'3C' },
  drainspout: { id:'drainspout', name:'DNB Drain Spout', hp:5, dmg:1, speed:0, radius:12, color:'#5a6a5a', dark:'#2e3830',
    behavior:'turret', fireCooldown:1.7, boltSpeed:195, floorKey:'3C' },
  gutterhopper: { id:'gutterhopper', name:'DNB Gutter Hopper', hp:3, dmg:2, speed:58, radius:12, color:'#4f8a72', dark:'#2a4a3e',
    behavior:'leaper', leapCooldown:1.6, leapSpeed:5, telegraphTime:0.4, floorKey:'3C' },
  sewerspitter: { id:'sewerspitter', name:'DNB Sewer Spitter', hp:2, dmg:1, speed:55, radius:11, color:'#6a8a4a', dark:'#384a24',
    behavior:'ranged', keepDistance:195, fireCooldown:1.6, boltSpeed:195, floorKey:'3C' },
  sludgemortar: { id:'sludgemortar', name:'DNB Sludge Mortar', hp:4, dmg:2, speed:52, radius:12, color:'#6a5a3a', dark:'#38301c',
    behavior:'lobber', lobRange:270, lobTime:1.1, burstRadius:44, fireCooldown:2.5, floorKey:'3C' },
  eelweaver: { id:'eelweaver', name:'DNB Eel Weaver', hp:4, dmg:2, speed:84, radius:11, color:'#3a6a6a', dark:'#1e3838',
    behavior:'weaver', weaveAmplitude:0.65, weaveFrequency:3.2, floorKey:'3C' },
  gratewatcher: { id:'gratewatcher', name:'DNB Grate Watcher', hp:5, dmg:1, speed:46, radius:12, color:'#6a6248', dark:'#383426',
    behavior:'sentry', sentryThreshold:30, fireRange:420, fireCooldown:1.3, boltSpeed:205,
    boltColor:'#c9d98a', boltRadius:5, floorKey:'3C' },
  gnatswirl: { id:'gnatswirl', name:'DNB Gnat Swirl', hp:2, dmg:1, speed:96, radius:9, color:'#a8b46a', dark:'#565c30',
    behavior:'orbiter', flies:true, orbitRadius:125, orbitSpeed:1.4, fireRange:365, fireCooldown:1.9, boltSpeed:185,
    boltColor:'#d9e0a8', boltRadius:4, floorKey:'3C' },
  mudburrower: { id:'mudburrower', name:'DNB Mud Burrower', hp:6, dmg:2, speed:60, radius:13, color:'#5a4a32', dark:'#30261a',
    behavior:'burrower', burrowCooldown:3.1, burrowTime:1.4, floorKey:'3C' },
  gutterlarvae: { id:'gutterlarvae', name:'DNB Gutter Larvae', hp:1, dmg:1, speed:142, radius:7, color:'#a89a6a', dark:'#5a5232',
    behavior:'swarm', driftAmount:0.6, floorKey:'3C' },
  bloatsack: { id:'bloatsack', name:'DNB Bloat Sack', hp:5, dmg:1, speed:74, radius:12, color:'#7a8a4a', dark:'#404a24',
    behavior:'splitter', splitInto:'gutterlarvae', floorKey:'3C' },
  ratcaller: { id:'ratcaller', name:'DNB Rat Caller', hp:4, dmg:1, speed:54, radius:11, color:'#7a6a52', dark:'#3e362a',
    behavior:'summoner', summonId:'gutterlarvae', summonCount:2, summonCooldown:6.2, maxSummons:6, keepDistance:195, floorKey:'3C' },
  algaemender: { id:'algaemender', name:'DNB Algae Mender', hp:4, dmg:1, speed:72, radius:11, color:'#5a9c6a', dark:'#2e5436',
    behavior:'healer', healAmount:2, healCooldown:3.1, healRadius:145, floorKey:'3C' },
  drainwarden: { id:'drainwarden', name:'DNB Drain Warden', hp:5, dmg:1, speed:52, radius:12, color:'#6a7a8a', dark:'#363e46',
    behavior:'shielder', shieldRadius:140, shieldGrantTime:2.5, shieldCooldown:5, keepDistance:200, floorKey:'3C' },
  pipemarksman: { id:'pipemarksman', name:'DNB Pipe Marksman', hp:3, dmg:2, speed:52, radius:10, color:'#4a5a4a', dark:'#263026',
    behavior:'sniper', fireRange:520, telegraphTime:1.25, fireCooldown:2.8, boltSpeed:425,
    boltColor:'#c9e0b4', boltRadius:4, weight:0.6, floorKey:'3C' },
  overflowblink: { id:'overflowblink', name:'DNB Overflow Blink', hp:3, dmg:1, speed:0, radius:10, color:'#3a7a7a', dark:'#1e4040',
    behavior:'teleporter', blinkCooldown:3.3, blinkRange:205, fireRange:400, fireCooldown:1.4, boltSpeed:205,
    boltColor:'#8ad9d9', boltRadius:5, floorKey:'3C' },
  sumplurker: { id:'sumplurker', name:'DNB Sump Lurker', hp:4, dmg:3, speed:56, radius:12, color:'#3f5a3a', dark:'#213020',
    behavior:'ambusher', triggerRange:118, chargeSpeed:6.4, dashDuration:0.5, telegraphTime:0.3, chargeCooldown:2.4, floorKey:'3C' },

  // -- 3C: extra flavors of behaviors already covered above --
  sludgehulk: { id:'sludgehulk', name:'DNB Sludge Hulk', hp:7, dmg:3, speed:42, radius:16, color:'#4a5a3a', dark:'#26301e',
    behavior:'chaser', contactCooldown:1, floorKey:'3C' },
  drainskitter: { id:'drainskitter', name:'DNB Drain Skitter', hp:2, dmg:2, speed:136, radius:9, color:'#8a7a3a', dark:'#4a401c',
    behavior:'chaser', contactCooldown:0.4, floorKey:'3C' },
  brinespitter: { id:'brinespitter', name:'DNB Brine Spitter', hp:3, dmg:1, speed:44, radius:12, color:'#3a6a5a', dark:'#1e382e',
    behavior:'ranged', keepDistance:155, fireCooldown:2.3, boltSpeed:155, floorKey:'3C' },
  fumedrone: { id:'fumedrone', name:'DNB Fume Drone', hp:2, dmg:2, speed:108, radius:10, color:'#9c8a4a', dark:'#524824',
    behavior:'bomber', fuseTime:0.95, blastRadius:66, flies:true, floorKey:'3C' },
  gutterswoop: { id:'gutterswoop', name:'DNB Gutter Swoop', hp:2, dmg:1, speed:112, radius:8, color:'#a06a3a', dark:'#54381c',
    behavior:'flyer', fireCooldown:1.9, boltSpeed:180, flies:true, floorKey:'3C' },
  rustcharger: { id:'rustcharger', name:'DNB Rust Charger', hp:6, dmg:3, speed:50, radius:14, color:'#a0603a', dark:'#56301c',
    behavior:'charger', chargeCooldown:2.6, chargeSpeed:5.8, telegraphTime:0.6, floorKey:'3C' },
  flotsamlobber: { id:'flotsamlobber', name:'DNB Flotsam Lobber', hp:4, dmg:2, speed:58, radius:12, color:'#8a7a5a', dark:'#4a4230',
    behavior:'lobber', lobRange:250, lobTime:1.2, burstRadius:40, fireCooldown:2.7, floorKey:'3C' },
  gritdelver: { id:'gritdelver', name:'DNB Grit Delver', hp:5, dmg:2, speed:66, radius:12, color:'#6a5a48', dark:'#383026',
    behavior:'burrower', burrowCooldown:2.7, burrowTime:1.2, floorKey:'3C' },
  driftcircler: { id:'driftcircler', name:'DNB Drift Circler', hp:3, dmg:1, speed:88, radius:10, color:'#5a7a6a', dark:'#2e4038',
    behavior:'orbiter', orbitRadius:120, orbitSpeed:1.3, fireRange:360, fireCooldown:1.9, boltSpeed:180, floorKey:'3C' },
  drainwatcher: { id:'drainwatcher', name:'DNB Drain Watcher', hp:5, dmg:1, speed:44, radius:12, color:'#5a6a4a', dark:'#2e3624',
    behavior:'sentry', sentryThreshold:28, fireRange:400, fireCooldown:1.4, boltSpeed:195, floorKey:'3C' },
  culvertmarksman: { id:'culvertmarksman', name:'DNB Culvert Marksman', hp:3, dmg:2, speed:50, radius:10, color:'#6a5a3a', dark:'#382e1e',
    behavior:'sniper', fireRange:500, telegraphTime:1.2, fireCooldown:2.9, boltSpeed:410, floorKey:'3C' },
  puddleblink: { id:'puddleblink', name:'DNB Puddle Blink', hp:3, dmg:1, speed:0, radius:10, color:'#4a6a7a', dark:'#243640',
    behavior:'teleporter', blinkCooldown:3.5, blinkRange:200, fireRange:380, fireCooldown:1.5, boltSpeed:195, floorKey:'3C' },
  // skirmisher (hit-and-run ranged) — see ai-2.js's aiSkirmisher. Calibrated
  // against sewerspitter (ranged, hp2/dmg1/speed55/fireCooldown1.6/
  // boltSpeed195) and pipemarksman (sniper, hp3/dmg2/speed52/fireCooldown2.8/
  // boltSpeed425) elsewhere in this same 3C pool.
  gutterskirmisher: { id:'gutterskirmisher', name:'DNB Gutter Skirmisher', hp:3, dmg:1, speed:76, radius:10, color:'#6a8a5a', dark:'#384a2c',
    behavior:'skirmisher', engageRange:260, retreatRange:130, dashSpeed:1.6, fireCooldown:1.4, boltSpeed:230,
    boltColor:'#c9d98a', boltRadius:4, floorKey:'3C' },

  // -- 4C (flooded lower gutters — one floor deeper than 3C, so a shade
  // tougher, in line with how stage:1 sits above stage:0): one entry per
  // behavior --
  sewerrat: { id:'sewerrat', name:'DNB Sewer Rat', hp:3, dmg:1, speed:130, radius:10, color:'#5a4a38', dark:'#302620',
    behavior:'chaser', contactCooldown:0.45, floorKey:'4C' },
  fetidflier: { id:'fetidflier', name:'DNB Fetid Flier', hp:2, dmg:1, speed:108, radius:9, color:'#6a9c8a', dark:'#365046',
    behavior:'flyer', fireCooldown:1.9, boltSpeed:185, flies:true, floorKey:'4C' },
  rotbladder: { id:'rotbladder', name:'DNB Rot Bladder', hp:3, dmg:2, speed:100, radius:11, color:'#7a9c3a', dark:'#3e521c',
    behavior:'bomber', fuseTime:1, blastRadius:74, floorKey:'4C' },
  rustplate: { id:'rustplate', name:'DNB Rust Plate', hp:6, dmg:2, speed:47, radius:14, color:'#8a5a30', dark:'#4a3018',
    behavior:'shielded', shieldTime:1.9, vulnTime:1.8, floorKey:'4C' },
  brinehog: { id:'brinehog', name:'DNB Brine Hog', hp:5, dmg:3, speed:60, radius:13, color:'#6a5a3a', dark:'#38301c',
    behavior:'charger', chargeCooldown:2.2, chargeSpeed:6.4, telegraphTime:0.55, floorKey:'4C' },
  standpipeturret: { id:'standpipeturret', name:'DNB Standpipe Turret', hp:5, dmg:1, speed:0, radius:12, color:'#4a6a6a', dark:'#243838',
    behavior:'turret', fireCooldown:1.6, boltSpeed:200, floorKey:'4C' },
  culvertleaper: { id:'culvertleaper', name:'DNB Culvert Leaper', hp:3, dmg:2, speed:62, radius:11, color:'#3f8a6a', dark:'#214a38',
    behavior:'leaper', leapCooldown:1.4, leapSpeed:5.2, telegraphTime:0.35, floorKey:'4C' },
  bilgespitter: { id:'bilgespitter', name:'DNB Bilge Spitter', hp:3, dmg:1, speed:56, radius:11, color:'#5a8a3a', dark:'#2e4a1c',
    behavior:'ranged', keepDistance:200, fireCooldown:1.5, boltSpeed:210, floorKey:'4C' },
  refusemortar: { id:'refusemortar', name:'DNB Refuse Mortar', hp:5, dmg:2, speed:54, radius:13, color:'#7a6a44', dark:'#403626',
    behavior:'lobber', lobRange:280, lobTime:1.05, burstRadius:46, fireCooldown:2.4, floorKey:'4C' },
  bilgeweaver: { id:'bilgeweaver', name:'DNB Bilge Weaver', hp:4, dmg:2, speed:88, radius:11, color:'#2e6a6a', dark:'#173838',
    behavior:'weaver', weaveAmplitude:0.68, weaveFrequency:3.3, floorKey:'4C' },
});

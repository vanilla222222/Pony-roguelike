'use strict';
/* ============================================================
   data/enemies/stage7-9-enemies.js — CONTENT GROUP 2 trash enemies.

   Stages 7-9 of the extended main route (see
   feature-research/phase10-metaprogression/stage-content-targets.md):
     stage 7  Ocean          floorNum 21-22
     stage 8  The Sea Floor  floorNum 23-24
     stage 9  Trench         floorNum 25-26

   45 entries, 15 per stage, each with its own behavior routine in
   js/systems/ai-stage7-9.js (registered through combat-3.js's
   ENEMY_BEHAVIOR_HANDLERS, so nothing shared was edited).

   REGISTRATION. Object.assign onto ENEMY_TYPES, exactly like
   types-2/3/4.js. This file loads before data/enemies/lists.js, which
   snapshots ENEMY_LIST = Object.values(ENEMY_TYPES) exactly once — load
   order alone is what merges these in.

   POOL SELECTION. room.js's resolveGenericEnemy filters ENEMY_LIST by
   `stage === stageIndexForFloor(floorNum)`, so `stage:` is the ONLY
   thing that puts a creature on a floor. `floorKey` is the legacy
   branch mechanism and returns null for floorNum 15+; it is unused here.
   Note the documented xpTier parity quirk: the new stages start on an
   ODD floorNum, so within a stage the FIRST floor draws the wider
   tier-2 pool and the second the narrower tier-1 one — inverted from
   the legacy stages. xpTier is therefore used purely to mark "this is a
   heavier creature", never as an intra-stage difficulty ramp.

   STAT CALIBRATION — read this before touching a number.
   `hp` is IDENTITY, not an absolute: growth.js multiplies it by
   enemyHpScale(floorNum) = 1.20^floorNum, which is already ~46x at
   floorNum 21 and ~68x at floorNum 26. The legacy top stage (stage 3,
   the Inferno) sits at hp 2-9 on floors 7-8. These three stages are
   authored at hp 6-16 — a clear step up in identity that COMPOUNDS with
   eight to thirteen more floors of that curve. Authoring "floor 25
   sized" three-digit numbers here would apply the curve twice and put a
   single trash mob past a legacy boss's effective HP.
   `dmg` above 4 is wasted: combat-1.js's playerDamageAmount hard-caps a
   single source at 4 half-hearts. Difficulty comes from hp, speed,
   pattern and room composition — never from inflated dmg.
   ============================================================ */
Object.assign(ENEMY_TYPES, {

  /* =========================================================
     STAGE 7 — OCEAN (floorNum 21-22)

     Open water. The stage's throughline is that your POSITION is not
     yours: surges, passes, suction, drift and wash. Nothing here is
     especially tanky — the Ocean is about being moved, and the Sea
     Floor below is where the attrition starts.
     ========================================================= */

  tidelurcher: { id:'tidelurcher', name:'DNB Tide Lurcher', hp:8, dmg:2, speed:72, radius:13,
    color:'#3d7fa8', dark:'#1c3d52', behavior:'ocSurge', surgePeriod:1.1, contactCooldown:0.7, xpTier:1, stage:7,
    desc:'Swims in shoves, not steps. Each surge is committed — it cannot correct mid-coast, and the coast is your whole window.' },

  driftjelly: { id:'driftjelly', name:'DNB Drift Jelly', hp:7, dmg:2, speed:38, radius:14,
    color:'#a86ad9', dark:'#4e2a70', behavior:'ocJellyPulse', flies:true, pulseCooldown:2.1,
    boltColor:'#d9b0ff', contactCooldown:0.8, xpTier:1, stage:7,
    desc:'Never chases anything. It drifts on the swell and stings the water around itself on a metronome — a moving square of floor you simply cannot be in.' },

  netcaster: { id:'netcaster', name:'DNB Net Caster', hp:9, dmg:2, speed:62, radius:12,
    color:'#5a8a7a', dark:'#2c463c', behavior:'ocNetcast', keepDistance:210, fireCooldown:2.6,
    boltColor:'#cfe8f5', xpTier:2, stage:7,
    desc:'Throws slow, wide, short-lived nets from mid range. One net is a joke. Two overlapping nets is how the Ocean corners you.' },

  bubblemine: { id:'bubblemine', name:'DNB Bubble Mine', hp:5, dmg:3, speed:46, radius:11,
    color:'#bfe8ff', dark:'#5a8aa8', behavior:'ocBubbleMine', flies:true, triggerRange:96, fuseTime:0.85,
    boltColor:'#bfe8ff', xpTier:1, stage:7,
    desc:'Rises without ever looking at you and only turns lethal up close, swelling for a beat before bursting into eight bubbles. Popping it early is always right.' },

  riptidefin: { id:'riptidefin', name:'DNB Riptide Fin', hp:9, dmg:3, speed:96, radius:13,
    color:'#2e5a70', dark:'#152c38', behavior:'ocPassBy', standoff:190, passCooldown:1.5, passDuration:0.75,
    contactCooldown:0.6, xpTier:2, stage:7,
    desc:'A shark\'s pass. It lines up wide, runs a straight committed line through where you stand, overshoots, and swings out to do it again. It never stops on top of you.' },

  krillcloud: { id:'krillcloud', name:'DNB Krill Cloud', hp:3, dmg:1, speed:142, radius:8,
    color:'#e0c8a0', dark:'#7a6a4a', behavior:'ocKrillDrift', driftAmount:0.75, contactCooldown:0.45, xpTier:1, stage:7,
    desc:'Individually nothing. The wobble re-rolls constantly, so a cloud of them spreads and arrives from every bearing at once instead of queueing into one killable line.' },

  lanternangler: { id:'lanternangler', name:'DNB Lantern Angler', hp:10, dmg:3, speed:64, radius:14,
    color:'#3a4a5a', dark:'#1a222c', behavior:'ocLure', triggerRange:170, telegraphTime:0.35, xpTier:2, stage:7,
    desc:'A trap wearing a light. Completely inert until you cross its lure radius, and for the second after that it is the fastest thing in the water.' },

  spouter: { id:'spouter', name:'DNB Spouter', hp:11, dmg:2, speed:0, radius:13,
    color:'#4a7a8a', dark:'#243c46', behavior:'ocSpout', fireCooldown:1.9, boltColor:'#7fd4e8', xpTier:2, stage:7,
    desc:'Anchored. Vents a four-way cross of water and rotates it forty-five degrees each volley, so the safe axes and the safe diagonals swap every time.' },

  barnacleclinger: { id:'barnacleclinger', name:'DNB Barnacle Clinger', hp:12, dmg:3, speed:78, radius:15,
    color:'#8a8478', dark:'#46423a', behavior:'ocClamp', clampTime:2.2, openTime:1.6, contactCooldown:0.9, xpTier:2, stage:7,
    desc:'Clamped it is armoured and motionless; open it is soft and quick. The clock is fixed and countable, and the whole fight is spending your damage inside it.' },

  undertowmaw: { id:'undertowmaw', name:'DNB Undertow Maw', hp:11, dmg:3, speed:34, radius:16,
    color:'#1f4a5e', dark:'#0e242e', behavior:'ocUndertow', pullRange:250, pullStrength:78,
    boltColor:'#2e6a86', contactCooldown:0.8, xpTier:2, stage:7,
    desc:'Barely moves, and does not need to. Inside its radius the water drags you onto it — you are not out-walking the enemy, you are out-walking the ocean.' },

  brinelobber: { id:'brinelobber', name:'DNB Brine Lobber', hp:8, dmg:2, speed:54, radius:12,
    color:'#6a9a5a', dark:'#34502c', behavior:'ocBrineLob', fireCooldown:3.0, burstRadius:52, xpTier:2, stage:7,
    desc:'Aims at where you were, never where you are. Three pools land around your last position and bloom a second later, so it punishes the reflex to hold ground.' },

  gullstrike: { id:'gullstrike', name:'DNB Gull Strike', hp:7, dmg:3, speed:104, radius:11,
    color:'#e8e8e0', dark:'#8a8a80', behavior:'ocDiveBomb', flies:true, circleTime:1.6, groundTime:1.8,
    blastRadius:62, xpTier:2, stage:7,
    desc:'Spends half its life above the waterline, where it can neither hit nor be hit. It marks a spot, drops onto it, and is briefly killable while it shakes the water off.' },

  driftingurchin: { id:'driftingurchin', name:'DNB Drifting Urchin', hp:10, dmg:2, speed:88, radius:11,
    color:'#3a6a5a', dark:'#1c342c', behavior:'ocRicochet', boltColor:'#8ad0c0', contactCooldown:0.7, xpTier:1, stage:7,
    desc:'Rides a straight line until it hits something and sprays spines off the bounce. It has no idea you exist, which is exactly why it is hard to plan around.' },

  eelcoil: { id:'eelcoil', name:'DNB Eel Coil', hp:9, dmg:2, speed:98, radius:11,
    color:'#5a7a2e', dark:'#2c3c16', behavior:'ocEelWeave', weaveAmplitude:0.95, weaveFrequency:5.2,
    boltColor:'#d9f06a', contactCooldown:0.6, xpTier:2, stage:7,
    desc:'Serpentines in so hard its actual arrival time is unreadable, then discharges a tight shock ring the moment it finally gets adjacent.' },

  foamherald: { id:'foamherald', name:'DNB Foam Herald', hp:8, dmg:1, speed:86, radius:12,
    color:'#f0f4f8', dark:'#8a99a8', behavior:'ocFoamWash', keepDistance:230, washCooldown:3.4, xpTier:2, stage:7,
    desc:'Runs, and washes the room behind it — every other enemy on the floor gets shoved a step closer to you. It wrecks the pacing of a fight far harder than its stat line suggests.' },

  /* =========================================================
     STAGE 8 — THE SEA FLOOR (floorNum 23-24)

     Silt and bioluminescence. Where the Ocean moved you, the Sea Floor
     HIDES things from you: burrowers, blink trails, light/dark cycles,
     shoals that scatter out of your burst window. Tougher and more
     attritional than stage 7 across the board.
     ========================================================= */

  siltcrawler: { id:'siltcrawler', name:'DNB Silt Crawler', hp:12, dmg:3, speed:80, radius:13,
    color:'#6a5a3a', dark:'#342c1c', behavior:'sfSiltStalk', burrowCooldown:3.2, burrowTime:1.5,
    burstRadius:50, contactCooldown:0.7, xpTier:2, stage:8,
    desc:'Goes under, closes untouchable, and comes up beneath you — leaving a delayed silt bloom on the spot it dived from, so backtracking is its own mistake.' },

  glowpolyp: { id:'glowpolyp', name:'DNB Glow Polyp', hp:13, dmg:2, speed:0, radius:13,
    color:'#7ae0c0', dark:'#2c6a58', behavior:'sfGlowPulse', fireCooldown:2.4,
    boltColor:'#7ae0c0', boltColor2:'#d9ffe8', xpTier:2, stage:8,
    desc:'Anchored, and deliberately arrhythmic: a dense slow ring, then a sparse fast one. Whatever timing you learned on the first volley is wrong for the second.' },

  pressurecrab: { id:'pressurecrab', name:'DNB Pressure Crab', hp:11, dmg:3, speed:74, radius:13,
    color:'#c05a4a', dark:'#5e2820', behavior:'sfSidleCrab', snapCooldown:2.0, contactCooldown:0.7, xpTier:2, stage:8,
    desc:'Only ever travels sideways, closing the gap in slivers, and snaps in with a short lunge the instant it is lined up. Reading the sidle is reading the snap.' },

  ventworm: { id:'ventworm', name:'DNB Vent Worm', hp:14, dmg:2, speed:0, radius:14,
    color:'#8a3a2a', dark:'#461c14', behavior:'sfVentJet', sweepSpeed:1.15, fireCooldown:0.22,
    boltSpeed:210, boltColor:'#ff9a5a', xpTier:2, stage:8,
    desc:'The one thing down here that fires without pause. Its jet sweeps a slow arc and reverses at random — the turning point of the sweep is where players die.' },

  siltpicker: { id:'siltpicker', name:'DNB Silt Picker', hp:9, dmg:3, speed:92, radius:11,
    color:'#c9c2a8', dark:'#645e4c', behavior:'sfFlank', lungeCooldown:2.6, contactCooldown:0.6, xpTier:2, stage:8,
    desc:'A coward with a knife. It refuses to approach from the front, circling to whichever side you are not facing before it commits.' },

  lanternshoal: { id:'lanternshoal', name:'DNB Lantern Shoal', hp:7, dmg:2, speed:118, radius:9,
    color:'#e0e07a', dark:'#6a6a2c', behavior:'sfShoalScatter', scatterTime:0.85, contactCooldown:0.5, xpTier:1, stage:8,
    desc:'Bolts the instant it is hit and turns around a heartbeat later. A shoal can never be pinned in one place long enough to be burst down at once.' },

  mudlung: { id:'mudlung', name:'DNB Mudlung', hp:14, dmg:3, speed:52, radius:16,
    color:'#7a6a4a', dark:'#3c3424', behavior:'sfBelch', fireCooldown:3.0, telegraphTime:0.85,
    boltColor:'#8a7a4a', contactCooldown:0.9, xpTier:2, stage:8,
    desc:'Inflates in place for the better part of a second, then belches a narrow cone of silt. The cone is thin and the tell is enormous — pure positioning check.' },

  abyssnautilus: { id:'abyssnautilus', name:'DNB Abyss Nautilus', hp:12, dmg:2, speed:84, radius:13,
    color:'#c0a8e0', dark:'#5c4a7a', behavior:'sfSpiralIn', orbitRadius:250, closeRate:42,
    fireCooldown:1.35, boltSpeed:215, boltColor:'#c0a8e0', xpTier:2, stage:8,
    desc:'Its orbit only ever shrinks, resetting wide once it reaches you, and it fires along the tangent — into wherever the spiral is about to take it.' },

  siltsifter: { id:'siltsifter', name:'DNB Silt Sifter', hp:13, dmg:2, speed:66, radius:14,
    color:'#a89a7a', dark:'#544c3c', behavior:'sfPlow', fireCooldown:1.8, boltColor:'#a89a7a',
    contactCooldown:0.8, xpTier:1, stage:8,
    desc:'Plows the floor in straight axis-aligned runs, turning ninety degrees off anything it touches and firing on every turn. It never once looks at you. Corners are its kill zone.' },

  glasseel: { id:'glasseel', name:'DNB Glass Eel', hp:8, dmg:2, speed:0, radius:10,
    color:'#9ae0ff', dark:'#3a6a80', behavior:'sfBlinkTrail', blinkCooldown:1.15, blinkRange:130,
    boltSpeed:190, boltColor:'#9ae0ff', xpTier:2, stage:8,
    desc:'Blinks toward you in short hops and fires backward down the path it just took, so the trail it leaves behind is as dangerous as the body that left it.' },

  pressurepod: { id:'pressurepod', name:'DNB Pressure Pod', hp:10, dmg:4, speed:44, radius:12,
    color:'#4a9a8a', dark:'#244c44', behavior:'sfSwell', swellTime:12, blastRadius:70,
    contactCooldown:0.9, xpTier:2, stage:8,
    desc:'Never attacks. It just grows — bigger, faster, and closer — and detonates enormous if it ever reaches full swell. A soft timer on the entire room.' },

  chitinward: { id:'chitinward', name:'DNB Chitin Ward', hp:11, dmg:1, speed:70, radius:12,
    color:'#5a7a8a', dark:'#2c3c46', behavior:'sfWardPulse', keepDistance:250, wardCooldown:4.6,
    wardTime:2.4, xpTier:2, stage:8,
    desc:'Hands a hard shell to whichever ally is closest to you and wears none itself. Always the correct kill, never the safe one.' },

  deepgrazer: { id:'deepgrazer', name:'DNB Deep Grazer', hp:15, dmg:3, speed:58, radius:16,
    color:'#8a9a5a', dark:'#464c2c', behavior:'sfGraze', rageSpeedMul:1.6,
    boltColor:'#e0a06a', contactCooldown:0.9, xpTier:2, stage:8,
    desc:'Genuinely does not care that you are there, right up until something hits it. From that moment it is permanently faster and permanently pointed at you.' },

  luminlure: { id:'luminlure', name:'DNB Lumin Lure', hp:10, dmg:2, speed:62, radius:12,
    color:'#e0e07a', dark:'#6a6a2c', behavior:'sfHomingSpark', fireCooldown:2.8, homing:1.7,
    boltSpeed:125, boltColor:'#e0e07a', xpTier:2, stage:8,
    desc:'One slow, long-lived spark that keeps steering toward you. Outrunning it works. Standing still and trading damage does not.' },

  benthicmaw: { id:'benthicmaw', name:'DNB Benthic Maw', hp:16, dmg:3, speed:66, radius:17,
    color:'#3a4a3a', dark:'#1c241c', behavior:'sfLungeLine', lungeCooldown:3.0, lungeTime:0.7,
    telegraphTime:0.8, contactCooldown:0.8, xpTier:2, stage:8,
    desc:'Paints a line to where you stand, holds it long enough to read, then travels the whole line at once. The line is locked at the telegraph, so it always hits the ground you left.' },

  /* =========================================================
     STAGE 9 — TRENCH (floorNum 25-26)

     Crushing pressure and no room. The group's hardest stage: patterns
     overlap, safe ground shrinks, and several of these punish standing
     still outright. Paired with the Trench feature rooms, whose
     pressure columns turn every fight into a corridor fight.
     ========================================================= */

  trenchshade: { id:'trenchshade', name:'DNB Trench Shade', hp:12, dmg:3, speed:96, radius:12,
    color:'#9a6ad9', dark:'#4a2c6a', behavior:'trPhaseStrike', phaseTime:1.4, solidTime:1.1,
    boltColor:'#9a6ad9', contactCooldown:0.6, xpTier:2, stage:9,
    desc:'Phased out entirely between strikes. It is hittable only in the instant it commits, which makes it a reaction test rather than a damage race.' },

  crushjaw: { id:'crushjaw', name:'DNB Crush Jaw', hp:18, dmg:3, speed:50, radius:18,
    color:'#7a6a5a', dark:'#3c342c', behavior:'trStomp', stompCooldown:2.0,
    boltColor:'#7a6a5a', contactCooldown:1.0, xpTier:2, stage:9,
    desc:'Every footfall is an attack. It walks slowly and drops a shockwave on a fixed cadence, so the ground it has already crossed stays lethal behind it.' },

  hadalspine: { id:'hadalspine', name:'DNB Hadal Spine', hp:13, dmg:3, speed:0, radius:13,
    color:'#5ae0ff', dark:'#1e5a70', behavior:'trCrossVolley', fireCooldown:1.55,
    boltColor:'#5ae0ff', xpTier:2, stage:9,
    desc:'A four-armed cross that rotates thirty degrees every volley. The safe wedge walks around the room, and the same standing spot is never safe twice.' },

  abyssalcoil: { id:'abyssalcoil', name:'DNB Abyssal Coil', hp:14, dmg:3, speed:92, radius:12,
    color:'#2e4a6a', dark:'#162434', behavior:'trTighten', orbitRadius:230, tightenRate:20,
    minRadius:34, orbitSpeed:2.1, contactCooldown:0.6, xpTier:2, stage:9,
    desc:'Fires nothing at all. It orbits at a radius that only ever shrinks, and simply runs out of room to give you.' },

  pressurewraith: { id:'pressurewraith', name:'DNB Pressure Wraith', hp:13, dmg:3, speed:64, radius:12,
    color:'#c94a6a', dark:'#5e1e30', behavior:'trMirror', mirrorGain:1.05, fireCooldown:2.5,
    boltColor:'#c94a6a', contactCooldown:0.7, xpTier:2, stage:9,
    desc:'Mirrors your movement instead of chasing it, holding station relative to you and cutting off whichever way you commit. Backing off is what closes the gap.' },

  gulperhusk: { id:'gulperhusk', name:'DNB Gulper Husk', hp:16, dmg:3, speed:70, radius:15,
    color:'#4a6a4a', dark:'#243424', behavior:'trGulp', chargeCooldown:2.4, telegraphTime:0.5,
    boltColor:'#6a9a7a', contactCooldown:0.8, xpTier:2, stage:9,
    desc:'Charges, and vents three bolts backward out of its gills as it goes. Slipping behind a charge is the right answer to every other charger in the game; this one is built to punish it.' },

  blacksmoker: { id:'blacksmoker', name:'DNB Black Smoker', hp:15, dmg:3, speed:0, radius:15,
    color:'#2a2a32', dark:'#121218', behavior:'trErupt', eruptCooldown:3.4, eruptRadius:105, xpTier:2, stage:9,
    desc:'An anchored vent. The whole tile-ring around it lights up, then goes off at once a beat later — its danger zone is a donut, and the safe spot is right beside it.' },

  viperfang: { id:'viperfang', name:'DNB Viper Fang', hp:10, dmg:3, speed:120, radius:10,
    color:'#3ac9a0', dark:'#1a604c', behavior:'trZigzag', zigPeriod:0.24, contactCooldown:0.5, xpTier:2, stage:9,
    desc:'Never holds a straight line for longer than a quarter second. A stream of very short, very fast dashes with a random kink on each — it cannot be led.' },

  nullpolyp: { id:'nullpolyp', name:'DNB Null Polyp', hp:12, dmg:1, speed:76, radius:12,
    color:'#c0e0d0', dark:'#5a6a64', behavior:'trStillMend', fleeRange:150, chargeUp:1.2,
    healCooldown:2.6, healAmount:3, healRadius:200, xpTier:2, stage:9,
    desc:'Mends the room, but only while perfectly still. Shoving it out of position with a knockback shot shuts it down more reliably than trying to chase it down.' },

  trenchwarden: { id:'trenchwarden', name:'DNB Trench Warden', hp:15, dmg:3, speed:40, radius:14,
    color:'#e0d47a', dark:'#6a6432', behavior:'trAxisGuard', axisBand:46, fireCooldown:1.3,
    boltColor:'#e0d47a', contactCooldown:0.9, xpTier:2, stage:9,
    desc:'Guards axes, not ground. Share a row or a column with it and a wall comes straight down that line — in the Trench\'s corridors, that is most of the room.' },

  hadalmoth: { id:'hadalmoth', name:'DNB Hadal Moth', hp:11, dmg:2, speed:100, radius:11,
    color:'#b48ad9', dark:'#563a6a', behavior:'trFigureEight', flies:true, figureSpeed:1.25,
    figureRadius:165, dropCooldown:1.5, burstRadius:48, xpTier:2, stage:9,
    desc:'Flies a fixed figure-eight around you and seeds a spore bomb at every crossing. It never reacts to anything — the pattern itself is the threat.' },

  chasmleech: { id:'chasmleech', name:'DNB Chasm Leech', hp:11, dmg:3, speed:104, radius:10,
    color:'#8a2e4a', dark:'#441624', behavior:'trLatch', latchTime:2.6, contactCooldown:0.55, xpTier:2, stage:9,
    desc:'Once it touches you it stops navigating entirely and simply pins itself to your position, riding along and grinding until it is killed or the latch times out.' },

  boneyardcrab: { id:'boneyardcrab', name:'DNB Boneyard Crab', hp:17, dmg:3, speed:68, radius:15,
    color:'#b0a890', dark:'#565248', behavior:'trArmorCycle', armorTime:2.4, softTime:1.2,
    boltColor:'#e08a5a', contactCooldown:0.9, xpTier:2, stage:9,
    desc:'Inverted armour: invulnerable while it walks, soft only during the second it spends firing. Its only damage window is also its only threat window.' },

  sonarhusk: { id:'sonarhusk', name:'DNB Sonar Husk', hp:12, dmg:3, speed:58, radius:12,
    color:'#ff6a9a', dark:'#7a2c48', behavior:'trLeadShot', keepDistance:280, fireCooldown:1.8,
    boltSpeed:330, boltColor:'#ff6a9a', weight:0.6, xpTier:2, stage:9,
    desc:'Samples your velocity and fires at where you are going to be. Holding a clean line is the worst possible answer; a stutter-step beats it outright.' },

  rubblemaw: { id:'rubblemaw', name:'DNB Rubble Maw', hp:16, dmg:3, speed:48, radius:16,
    color:'#5a5248', dark:'#2c2824', behavior:'trCaveIn', collapseCooldown:3.2, ringRadius:90,
    burstRadius:58, contactCooldown:0.9, xpTier:2, stage:9,
    desc:'Drops the ceiling in a ring around you and leaves the middle clear. The one creature in the Trench that rewards standing perfectly still.' },
});

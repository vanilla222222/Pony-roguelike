'use strict';
/* ============================================================
   data/enemies/stage10-13-enemies.js — CONTENT GROUP 3 trash enemies.

   Stages 10-13 of the extended main route — the four DEEPEST stages in
   the game (see feature-research/phase10-metaprogression/stage-content-targets.md):
     stage 10  Trench Depths  floorNum 27-28  'Crush Zone' / 'The Black Vents'
     stage 11  Deep Dark      floorNum 29-30  'No Light Reaches' / 'The Long Quiet'
     stage 12  Meta Realm     floorNum 31-32  'Behind The Curtain' / 'The Author's Margin'
     stage 13  Hyperspace     floorNum 33-34  'Fold' / 'The Last Exit'
   floorNum 34 is MAIN_ROUTE_FINAL_FLOOR — the run's true ending.

   15 enemies per stage, 60 in all. Every single one has its OWN behavior
   function; none of them reuse the shared archetypes in ai-1/ai-2.js.
   The bodies all live in systems/ai-stage10-13.js and register themselves
   into combat-3.js's ENEMY_BEHAVIOR_HANDLERS registry, so this group
   never edits the shared AI dispatch switch. Every `behavior:` string
   below is `g3<Stage><Name>` and has exactly one matching handler there.

   REGISTRATION. Identical to types-2/3/4.js: Object.assign onto the
   ENEMY_TYPES object declared in types-1.js. index.html loads this file
   AFTER types-4.js and BEFORE lists.js, which is what matters — lists.js
   snapshots `ENEMY_LIST = Object.values(ENEMY_TYPES)` once, and every
   roster filter reads that snapshot.

   STATS. `stage:` is the only thing that puts a creature on a floor
   (room.js's resolveGenericEnemy filters on it). `hp` is IDENTITY, not an
   absolute — entities.js multiplies it by enemyHpScale (1.20^floorNum) —
   and the numbers below continue the ramp the coordination pass laid down
   for the ten new stages (stage 4 ~18 rising to stage 9 ~28), escalating
   within this group as well: Trench Depths < Deep Dark < Meta Realm <
   Hyperspace. `dmg` is in half-hearts and combat-1.js's
   playerDamageAmount hard-caps a single source at 4, so nothing here
   exceeds it: the difficulty is in hp, speed and pattern, never in the
   damage number.

   `locked:true` is deliberately NOT set on any of these — there is no
   matching bestiary unlock entry for the new stages yet (see the audit).
   ============================================================ */
Object.assign(ENEMY_TYPES, {

  /* ============================================================
     STAGE 10 — TRENCH DEPTHS (floorNum 27-28)
     Pressure. Everything down here squeezes, erupts or implodes, and
     most of the roster denies AREA rather than aiming at you. The
     stage that teaches you to keep space before Hyperspace takes it.
     ============================================================ */

  tdcrusher: { id:'tdcrusher', name:'DNB Crushjaw', hp:23, dmg:3, speed:74, radius:14, color:'#2c5a86', dark:'#12283e',
    behavior:'g3TdCrusher', contactCooldown:0.7, xpTier:2, weight:1.3, stage:10,
    desc:'A siege body built for the crush zone. It plants, and the water around it detonates.' },
  tdvent: { id:'tdvent', name:'DNB Black Vent', hp:27, dmg:3, speed:0, radius:15, color:'#1c3c5c', dark:'#0a1826',
    behavior:'g3TdVent', contactCooldown:0.8, xpTier:2, stage:10,
    desc:'Rooted to the seam it grew out of. Erupts in a cross, and the cross turns.' },
  tdangler: { id:'tdangler', name:'DNB Angler', hp:21, dmg:4, speed:88, radius:13, color:'#0e2438', dark:'#050d16',
    behavior:'g3TdAngler', contactCooldown:0.7, xpTier:2, stage:10,
    desc:'Invisible until the lure range is crossed. Then it is one straight line, and nothing else.' },
  tdbarbel: { id:'tdbarbel', name:'DNB Barbel', hp:21, dmg:3, speed:82, radius:12, color:'#3f7fc0', dark:'#1c3a5a',
    behavior:'g3TdBarbel', contactCooldown:0.7, xpTier:2, stage:10,
    desc:'It only fires at a back. Retreating from this one is the mistake.' },
  tdimploder: { id:'tdimploder', name:'DNB Imploder', hp:23, dmg:3, speed:66, radius:14, color:'#245070', dark:'#0e2130',
    behavior:'g3TdImploder', contactCooldown:0.7, xpTier:2, weight:1.2, stage:10,
    desc:'Marks the ring you are standing in and collapses it inward. Leave the circle.' },
  tdbrine: { id:'tdbrine', name:'DNB Brine Drifter', hp:20, dmg:3, speed:58, radius:13, color:'#4a7f8c', dark:'#20393f',
    behavior:'g3TdBrine', contactCooldown:0.7, xpTier:1, stage:10,
    desc:'Aims at nothing. Everywhere it has been slowly becomes somewhere you cannot stand.' },
  tdclamp: { id:'tdclamp', name:'DNB Clamp', hp:22, dmg:4, speed:80, radius:12, color:'#5a6a78', dark:'#262e36',
    behavior:'g3TdClamp', contactCooldown:0.55, xpTier:2, stage:10,
    desc:'Latches on in three short hops. One dodge does not shake it loose.' },
  tdsiphon: { id:'tdsiphon', name:'DNB Siphon', hp:28, dmg:2, speed:70, radius:13, color:'#6a8fa8', dark:'#2c3f4c',
    behavior:'g3TdSiphon', contactCooldown:0.8, xpTier:2, stage:10,
    desc:'Heals the room out of its own bar. Every ally it saves makes it easier to kill.' },
  tdspire: { id:'tdspire', name:'DNB Trench Spire', hp:26, dmg:3, speed:0, radius:14, color:'#20415e', dark:'#0c1a26',
    behavior:'g3TdSpire', contactCooldown:0.8, xpTier:2, stage:10,
    desc:'One bolt at a time, along a slowly opening spiral. Three of them make a lattice.' },
  tddrifter: { id:'tddrifter', name:'DNB Trench Drifter', hp:24, dmg:3, speed:96, radius:13, color:'#38708f', dark:'#183342',
    behavior:'g3TdDrifter', contactCooldown:0.7, xpTier:1, stage:10,
    desc:'Does not know you are there. Rules one straight line and bounces off the rest.' },
  tdmarrow: { id:'tdmarrow', name:'DNB Marrow Husk', hp:24, dmg:3, speed:86, radius:13, color:'#8a9099', dark:'#3c4046',
    behavior:'g3TdMarrow', contactCooldown:0.7, xpTier:2, stage:10,
    desc:'Armoured and still, then bare and sprinting. The window to hurt it is the window it hurts you.' },
  tdgulper: { id:'tdgulper', name:'DNB Gulper', hp:25, dmg:4, speed:76, radius:15, color:'#1e4460', dark:'#0a1b27',
    behavior:'g3TdGulper', contactCooldown:0.7, xpTier:2, stage:10,
    desc:'Charges, and if it connects it stops dead to digest. A hit traded for a free window.' },
  tdlamp: { id:'tdlamp', name:'DNB Trench Lantern', hp:21, dmg:3, speed:64, radius:12, color:'#a8c46a', dark:'#4a5a26',
    behavior:'g3TdLamp', contactCooldown:0.7, xpTier:1, stage:10,
    desc:'Pulses on a fixed beat. One ring is a stroll; two overlapping ones are not.' },
  tdnautilus: { id:'tdnautilus', name:'DNB Nautilus', hp:23, dmg:3, speed:84, radius:13, color:'#c4a878', dark:'#5c4c32',
    behavior:'g3TdNautilus', contactCooldown:0.7, xpTier:2, stage:10,
    desc:'Spirals in and fires backwards along its own track. Safety is in front of it.' },
  tdcolumn: { id:'tdcolumn', name:'DNB Crush Column', hp:26, dmg:4, speed:56, radius:15, color:'#16324a', dark:'#081522',
    behavior:'g3TdColumn', contactCooldown:0.8, burstRadius:62, xpTier:2, stage:10,
    desc:'Drops a column of water pressure onto wherever you are standing. Keep walking.' },

  /* ============================================================
     STAGE 11 — DEEP DARK (floorNum 29-30)
     Information. Half of this roster is invisible, dormant, or behind
     you. The Trench Depths denied space; the Deep Dark denies knowing.
     ============================================================ */

  ddstalker: { id:'ddstalker', name:'DNB Unlit Stalker', hp:28, dmg:4, speed:88, radius:14, color:'#12141c', dark:'#06070b',
    behavior:'g3DdStalker', contactCooldown:0.7, xpTier:2, weight:1.3, stage:11,
    desc:'You get to see it for one stride. That stride is the whole fight.' },
  ddpounce: { id:'ddpounce', name:'DNB Pouncer', hp:26, dmg:4, speed:92, radius:13, color:'#1a1c26', dark:'#0a0b10',
    behavior:'g3DdPounce', contactCooldown:0.7, xpTier:2, stage:11,
    desc:'Perfectly still until it has a clear line. Then it crosses the whole room.' },
  ddchorus: { id:'ddchorus', name:'DNB Quiet Chorus', hp:27, dmg:3, speed:52, radius:13, color:'#2f5f8a', dark:'#142a3e',
    behavior:'g3DdChorus', contactCooldown:0.7, xpTier:2, stage:11,
    desc:'Silent while you move. It sings the moment you stop to aim.' },
  ddmaw: { id:'ddmaw', name:'DNB Dark Maw', hp:29, dmg:4, speed:90, radius:15, color:'#101018', dark:'#05050a',
    behavior:'g3DdMaw', contactCooldown:0.7, xpTier:2, stage:11,
    desc:'Runs through you and out the far side, turns, and comes back. Standing still is fatal.' },
  ddleech: { id:'ddleech', name:'DNB Leech', hp:24, dmg:3, speed:104, radius:11, color:'#3a2c3c', dark:'#181218',
    behavior:'g3DdLeech', contactCooldown:0.55, xpTier:1, stage:11,
    desc:'Holds a fixed offset from you and matches every step. It cannot be outrun, only killed.' },
  ddwhisper: { id:'ddwhisper', name:'DNB Whisper', hp:25, dmg:4, speed:60, radius:12, color:'#26283a', dark:'#101119',
    behavior:'g3DdWhisper', contactCooldown:0.7, xpTier:2, stage:11,
    desc:'Always behind you. Every two seconds it corrects for the fact that you turned around.' },
  ddgloom: { id:'ddgloom', name:'DNB Gloom', hp:29, dmg:3, speed:54, radius:14, color:'#1c2430', dark:'#0b0f14',
    behavior:'g3DdGloom', contactCooldown:0.7, xpTier:2, stage:11,
    desc:'Its bolts are not a threat now. They are a threat in ten seconds, once the room is full of them.' },
  ddfang: { id:'ddfang', name:'DNB Fang', hp:24, dmg:3, speed:62, radius:12, color:'#4a3a34', dark:'#201814',
    behavior:'g3DdFang', contactCooldown:0.7, xpTier:1, weight:1.4, stage:11,
    desc:'Slow and timid alone. Kill the escort or fight something twice as fast.' },
  ddmoth: { id:'ddmoth', name:'DNB Blind Moth', hp:23, dmg:3, speed:98, radius:11, color:'#8aa0b8', dark:'#3c4650',
    behavior:'g3DdMoth', contactCooldown:0.7, flies:true, xpTier:1, stage:11,
    desc:'The bolts are slow and they curve. The flight path is what makes them land.' },
  ddhusk: { id:'ddhusk', name:'DNB Lightless Husk', hp:31, dmg:4, speed:70, radius:15, color:'#2a2a30', dark:'#121215',
    behavior:'g3DdHusk', contactCooldown:0.7, xpTier:2, stage:11,
    desc:'Armoured at range, bare up close — the exact opposite of how you want to fight in the dark.' },
  ddbrood: { id:'ddbrood', name:'DNB Brood', hp:30, dmg:3, speed:58, radius:14, color:'#3c2c46', dark:'#1a121f',
    behavior:'g3DdBrood', contactCooldown:0.7, xpTier:2, stage:11,
    desc:'Keeps its distance and hatches. Six crawlers, then it has to fight you itself.' },
  ddveil: { id:'ddveil', name:'DNB Veil', hp:26, dmg:3, speed:56, radius:13, color:'#242c3a', dark:'#0f131a',
    behavior:'g3DdVeil', contactCooldown:0.7, xpTier:2, stage:11,
    desc:'Lays a wall across the line you are walking in on. Come at it from somewhere else.' },
  ddclatter: { id:'ddclatter', name:'DNB Clatter', hp:26, dmg:3, speed:76, radius:12, color:'#4a4a3c', dark:'#20201a',
    behavior:'g3DdClatter', contactCooldown:0.7, xpTier:2, stage:11,
    desc:'Everywhere it walks stays dangerous for ten seconds. It is mining the room, not fighting you.' },
  ddbreath: { id:'ddbreath', name:'DNB Deep Breath', hp:28, dmg:4, speed:66, radius:15, color:'#182430', dark:'#0a0f14',
    behavior:'g3DdBreath', contactCooldown:0.7, xpTier:2, stage:11,
    desc:'It goes completely still to inhale. Perfectly readable, and unsurvivable if you read it late.' },
  ddcrawler: { id:'ddcrawler', name:'DNB Crawler', hp:23, dmg:3, speed:84, radius:11, color:'#30303a', dark:'#141419',
    behavior:'g3DdCrawler', contactCooldown:0.7, xpTier:1, weight:1.3, stage:11,
    desc:'Goes under, comes up beneath you, and does not bother biting.' },

  /* ============================================================
     STAGE 12 — META REALM (floorNum 31-32)
     The game itself misbehaving. Things rewind, stutter, spawn off the
     edge of the room, walk out of bounds, or delete the scenery. Every
     pattern here breaks a rule the first thirty floors established —
     and every one of them is still fair, fixed and readable.
     ============================================================ */

  mrglitch: { id:'mrglitch', name:'DNB Glitch', hp:29, dmg:4, speed:80, radius:13, color:'#00ffa8', dark:'#006944',
    behavior:'g3MrGlitch', contactCooldown:0.7, xpTier:2, weight:1.3, stage:12,
    desc:'Never in one place long enough to be led. Answer it with area, not with aim.' },
  mrclone: { id:'mrclone', name:'DNB Clone', hp:28, dmg:3, speed:86, radius:13, color:'#3ce0a0', dark:'#166046',
    behavior:'g3MrClone', contactCooldown:0.7, xpTier:2, stage:12,
    desc:'Duplicates once when hurt. So does the duplicate. Then it stops — but by then there are four.' },
  mrrewind: { id:'mrrewind', name:'DNB Rewind', hp:31, dmg:4, speed:92, radius:13, color:'#5ae0c0', dark:'#22604e',
    behavior:'g3MrRewind', contactCooldown:0.7, xpTier:2, stage:12,
    desc:'Snaps back to where it stood a second and a half ago. The damage sticks; the position does not.' },
  mrinvert: { id:'mrinvert', name:'DNB Invert', hp:29, dmg:3, speed:78, radius:12, color:'#a0ff5a', dark:'#4a6a20',
    behavior:'g3MrInvert', contactCooldown:0.7, xpTier:2, stage:12,
    desc:'It moves the way you move, not the way you are. Steer it, do not flee it.' },
  mrfourthwall: { id:'mrfourthwall', name:'DNB Fourth Wall', hp:28, dmg:4, speed:60, radius:13, color:'#00d0ff', dark:'#00566a',
    behavior:'g3MrFourthWall', contactCooldown:0.7, xpTier:2, stage:12,
    desc:'Its shots do not come from it. They come in from off the edge of the room, along your axis.' },
  mroutofbounds: { id:'mroutofbounds', name:'DNB Out Of Bounds', hp:30, dmg:4, speed:74, radius:13, color:'#7a00ff', dark:'#34006a',
    behavior:'g3MrOutOfBounds', contactCooldown:0.7, flies:true, xpTier:2, stage:12,
    desc:'Leaves the room entirely, crosses behind the walls, and comes back somewhere else. Cover is not a defence.' },
  mrnull: { id:'mrnull', name:'DNB Null', hp:32, dmg:4, speed:84, radius:14, color:'#0e1418', dark:'#04060a',
    behavior:'g3MrNull', contactCooldown:0.7, xpTier:2, stage:12,
    desc:'Half of it does not exist at any given moment. The half that does is very fast.' },
  mrframeskip: { id:'mrframeskip', name:'DNB Frameskip', hp:29, dmg:4, speed:70, radius:13, color:'#e0ff00', dark:'#606a00',
    behavior:'g3MrFrameskip', contactCooldown:0.7, xpTier:2, stage:12,
    desc:'Does not move. Arrives. One short step closer on every tick of a clock you cannot see.' },
  mroverflow: { id:'mroverflow', name:'DNB Overflow', hp:31, dmg:3, speed:66, radius:14, color:'#00ffa8', dark:'#005a3c',
    behavior:'g3MrOverflow', contactCooldown:0.7, xpTier:2, stage:12,
    desc:'Every volley is one bolt wider than the last, until it wraps back to one and starts over.' },
  mrparser: { id:'mrparser', name:'DNB Parser', hp:30, dmg:3, speed:88, radius:13, color:'#c0ffe0', dark:'#4e6a5c',
    behavior:'g3MrParser', contactCooldown:0.7, xpTier:2, stage:12,
    desc:'Mirrors you across the room. The only way to shake it is to stand in the middle.' },
  mrassert: { id:'mrassert', name:'DNB Assertion', hp:33, dmg:4, speed:54, radius:15, color:'#ff3a3a', dark:'#6a1414',
    behavior:'g3MrAssert', contactCooldown:0.8, burstRadius:46, xpTier:2, stage:12,
    desc:'Stamps three failures across the floor at a time. Nowhere is safe for long; everywhere is safe briefly.' },
  mrghost: { id:'mrghost', name:'DNB Render Ghost', hp:34, dmg:4, speed:46, radius:15, color:'#ff00ff', dark:'#6a006a',
    behavior:'g3MrGhost', contactCooldown:0.8, xpTier:2, stage:12,
    desc:'Walls are a rendering detail. It has never had to care about one.' },
  mrloop: { id:'mrloop', name:'DNB Loop', hp:29, dmg:3, speed:90, radius:12, color:'#00ffd0', dark:'#006a58',
    behavior:'g3MrLoop', contactCooldown:0.7, xpTier:1, stage:12,
    desc:'One perfect circle, forever, firing along the tangent. It has no opinion about you at all.' },
  mrsegfault: { id:'mrsegfault', name:'DNB Segfault', hp:31, dmg:4, speed:82, radius:13, color:'#ff6a00', dark:'#6a2c00',
    behavior:'g3MrSegfault', contactCooldown:0.7, xpTier:2, stage:12,
    desc:'Wanders harmlessly, then crosses the room instantly with no warning at all. Do not stand in open lanes.' },
  mreditor: { id:'mreditor', name:'DNB Editor', hp:33, dmg:3, speed:72, radius:14, color:'#ffffff', dark:'#6a6a6a',
    behavior:'g3MrEditor', contactCooldown:0.7, xpTier:2, stage:12,
    desc:'It is not attacking you. It is deleting the room, and it will get to you when the room is gone.' },

  /* ============================================================
     STAGE 13 — HYPERSPACE (floorNum 33-34)
     Velocity. The last roster in the game: everything is faster than
     anything the player has met, and most of it attacks in lines and
     folds rather than aimed shots. It assumes every earlier lesson
     has been learned, and stacks them.
     ============================================================ */

  hslancer: { id:'hslancer', name:'DNB Lancer', hp:34, dmg:4, speed:104, radius:13, color:'#ff4fd8', dark:'#6a1c5a',
    behavior:'g3HsLancer', contactCooldown:0.7, xpTier:2, weight:1.3, stage:13,
    desc:'Crosses the whole arena in one line, re-aims, does it again. The telegraph is a quarter of a second.' },
  hswarp: { id:'hswarp', name:'DNB Warpshot', hp:32, dmg:4, speed:70, radius:12, color:'#c04fff', dark:'#4e1c6a',
    behavior:'g3HsWarp', contactCooldown:0.7, xpTier:2, stage:13,
    desc:'Blinks and fires in the same instant, always from an angle you were not watching.' },
  hscomet: { id:'hscomet', name:'DNB Comet', hp:33, dmg:4, speed:100, radius:13, color:'#ff8a4f', dark:'#6a3418',
    behavior:'g3HsComet', contactCooldown:0.7, xpTier:2, stage:13,
    desc:'Falls inward, accelerating, trailing fire. Once it commits you step aside or you wear it.' },
  hspulsar: { id:'hspulsar', name:'DNB Pulsar', hp:37, dmg:3, speed:0, radius:15, color:'#ffffff', dark:'#7a7a8a',
    behavior:'g3HsPulsar', contactCooldown:0.8, xpTier:2, stage:13,
    desc:'Six arms, turning forever. Nothing about it is aimed — find the gap and live in it.' },
  hsnova: { id:'hsnova', name:'DNB Nova', hp:38, dmg:4, speed:52, radius:16, color:'#ffe04f', dark:'#6a5a10',
    behavior:'g3HsNova', contactCooldown:0.8, xpTier:2, stage:13,
    desc:'Four seconds of wind-up, everything at once, then two seconds with nothing left. Choose which half to fight.' },
  hsquasar: { id:'hsquasar', name:'DNB Quasar', hp:36, dmg:4, speed:44, radius:14, color:'#4fd8ff', dark:'#1c5a6a',
    behavior:'g3HsQuasar', contactCooldown:0.8, xpTier:2, stage:13,
    desc:'A beam that creeps around the room. Walk with the rotation, or get cut by it.' },
  hsfold: { id:'hsfold', name:'DNB Fold', hp:34, dmg:4, speed:78, radius:13, color:'#ff4fd8', dark:'#5c1a4c',
    behavior:'g3HsFold', contactCooldown:0.7, xpTier:2, stage:13,
    desc:'Lays a wall and then folds itself to the other side of the room, so the wall is never where it was.' },
  hssingularity: { id:'hssingularity', name:'DNB Singularity', hp:35, dmg:4, speed:62, radius:14, color:'#2a1a4a', dark:'#100a20',
    behavior:'g3HsSingularity', contactCooldown:0.7, xpTier:2, stage:13,
    desc:'Collapses a ring onto you, tighter and faster than anything in the trench, and with no wind-up.' },
  hsdrone: { id:'hsdrone', name:'DNB Drone', hp:29, dmg:3, speed:126, radius:9, color:'#ff9ae0', dark:'#6a3e5c',
    behavior:'g3HsDrone', contactCooldown:0.55, flies:true, xpTier:1, weight:1.5, stage:13,
    desc:'Faster than you, cheaper than you, and never alone.' },
  hsecho: { id:'hsecho', name:'DNB Echo', hp:33, dmg:4, speed:80, radius:12, color:'#9a7aff', dark:'#3e2e6a',
    behavior:'g3HsEcho', contactCooldown:0.7, xpTier:2, stage:13,
    desc:'Fires at where you are and where you were. Both holding still and moving predictably are punished.' },
  hsshard: { id:'hsshard', name:'DNB Shard', hp:36, dmg:4, speed:86, radius:14, color:'#e0e0ff', dark:'#5a5a7a',
    behavior:'g3HsShard', contactCooldown:0.7, xpTier:2, stage:13,
    desc:'Sheds drones on a timer instead of on death, and rings the room every time it does.' },
  hsprism: { id:'hsprism', name:'DNB Prism', hp:33, dmg:4, speed:74, radius:13, color:'#4fffb0', dark:'#1c6a4a',
    behavior:'g3HsPrism', contactCooldown:0.7, xpTier:2, stage:13,
    desc:'Three fans in a row, each wider than the last. The first one tells you where the third will not be.' },
  hswake: { id:'hswake', name:'DNB Wake', hp:31, dmg:4, speed:118, radius:12, color:'#ff4f8a', dark:'#6a1c34',
    behavior:'g3HsWake', contactCooldown:0.7, xpTier:2, stage:13,
    desc:'Never attacks. Carves the arena into pieces purely by moving through it.' },
  hszenith: { id:'hszenith', name:'DNB Zenith', hp:39, dmg:4, speed:96, radius:14, color:'#ffd44f', dark:'#6a5410',
    behavior:'g3HsZenith', contactCooldown:0.7, xpTier:2, stage:13,
    desc:'Untouchable while it moves, exposed while it shoots. No randomness anywhere — pure execution.' },
  hsterminus: { id:'hsterminus', name:'DNB Terminus', hp:42, dmg:4, speed:68, radius:16, color:'#ff4fd8', dark:'#4a0c3c',
    behavior:'g3HsTerminus', contactCooldown:0.8, xpTier:2, stage:13,
    desc:'The last ordinary thing in the game, and it fights like a boss: two crossing walls, one seam each, forever.' },
});

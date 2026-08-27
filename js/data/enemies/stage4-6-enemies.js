'use strict';
/* ============================================================
   data/enemies/stage4-6-enemies.js — CONTENT GROUP 1 trash enemies.

   Stages 4-6 of the extended main route (see
   feature-research/phase10-metaprogression/stage-content-targets.md):
     stage 4  Frozen Desert  floorNum 15-16
     stage 5  Badlands       floorNum 17-18
     stage 6  Beach          floorNum 19-20
   15 enemies each, 45 total. Every one has its own behavior function in
   js/systems/ai-stage4-6.js, registered by name into
   ENEMY_BEHAVIOR_HANDLERS — no `behavior:` string below is shared with
   another entry, and none of them route through combat-3.js's switch.

   REGISTRATION. Identical to types-2/3/4.js: Object.assign onto the
   ENEMY_TYPES object declared in types-1.js. index.html loads this file
   AFTER types-4.js and BEFORE lists.js, which is what matters — lists.js
   snapshots `ENEMY_LIST = Object.values(ENEMY_TYPES)` once, and every
   roster filter reads that snapshot.

   STAT BANDS (deliberate, not guessed). `hp` here is IDENTITY on the
   shared scale documented in growth.js — a live enemy's hp is
   `type.hp * 1.20^floorNum`, which at floorNum 15-20 is already 15x-38x.
   Legacy trash sits at 1-6 on that scale; these three stages run 4-9 /
   5-10 / 6-11, i.e. a clear step above the four legacy stages without
   authoring "floor 20 sized" numbers that would then scale twice.
   `dmg` is half-hearts and combat-1.js's playerDamageAmount hard-caps a
   single source at 4, so nothing here exceeds 3 — the difficulty is in
   the patterns (see the AI file), the counts, and the hp curve.
   `xpTier` is NOT an intra-stage difficulty dial here: resolveGenericEnemy
   filters `(xpTier||1) <= 1 + (floorNum % 2)` and the new stages start on
   an ODD floorNum, so the first floor of each pair gets the wider pool.
   Tier 2 is therefore used for "the heavier half of the roster", nothing
   more. `weight` biases room.js's featured-enemy roll (default 1).
   ============================================================ */
Object.assign(ENEMY_TYPES, {

  /* ---- stage 4 — FROZEN DESERT (floorNum 15-16) ----
     A dune sea gone to ice. The stage's whole idea is momentum you don't
     control: things that slide, things buried under the drifts, and
     whiteout shooters that reposition instead of aiming. */
  fdrimestalker: { id:'fdrimestalker', name:'DNB Rime Stalker', hp:6, dmg:2, speed:72, radius:12,
    color:'#bcd4e0', dark:'#5e6e7a', behavior:'fdRimeStalker', contactCooldown:0.7, xpTier:2, stage:4,
    desc:'Walks you down in silence, then roots itself and shatters a ring of rime outward. The approach is the wind-up.' },
  fdglaciercrawler: { id:'fdglaciercrawler', name:'DNB Glacier Crawler', hp:7, dmg:2, speed:96, radius:13,
    color:'#9fc4d9', dark:'#465a68', behavior:'fdGlacierCrawler', contactCooldown:0.6, xpTier:2, stage:4, weight:0.8,
    desc:'Never aims. Slides in a straight line and ricochets off everything it touches, like a curling stone with teeth.' },
  fdsleetspitter: { id:'fdsleetspitter', name:'DNB Sleet Spitter', hp:5, dmg:2, speed:68, radius:11,
    color:'#8fb4cc', dark:'#3c5464', behavior:'fdSleetSpitter', fireCooldown:1.5, xpTier:2, stage:4,
    desc:'Circles as it fires and always leads its shots sideways, so holding still is exactly the wrong answer.' },
  fdfrostmirage: { id:'fdfrostmirage', name:'DNB Frost Mirage', hp:4, dmg:2, speed:0, radius:11,
    color:'#d8ecf7', dark:'#6a8494', behavior:'fdFrostMirage', fireCooldown:1.9, xpTier:2, stage:4, weight:0.7,
    desc:'Does not walk. Blinks between four fixed points around you and fires the instant it lands.' },
  fdicicledrifter: { id:'fdicicledrifter', name:'DNB Icicle Drifter', hp:6, dmg:3, speed:74, radius:12,
    color:'#b0dcf0', dark:'#4a6e80', behavior:'fdIcicleDrifter', contactCooldown:0.7, xpTier:2, stage:4,
    desc:'Accelerates at you and keeps its momentum on the ice — it overshoots, drifts wide, and has to loop back.' },
  fdsnowdriftlurker: { id:'fdsnowdriftlurker', name:'DNB Snowdrift Lurker', hp:8, dmg:3, speed:64, radius:14,
    color:'#e8f2f7', dark:'#7a8894', behavior:'fdSnowdriftLurker', contactCooldown:0.9, xpTier:2, stage:4, weight:0.8,
    desc:'Buried and untouchable under the drifts until you walk over it, then erupts. Reburies if you back away.' },
  fdhailweaver: { id:'fdhailweaver', name:'DNB Hail Weaver', hp:5, dmg:2, speed:86, radius:11,
    color:'#a8c8e8', dark:'#44607c', behavior:'fdHailWeaver', fireCooldown:0.85, xpTier:1, stage:4,
    desc:'Holds a fixed orbit and rakes bolts inward along the tangent. The safe spot is right on top of it.' },
  fdpermafrostshard: { id:'fdpermafrostshard', name:'DNB Permafrost Shard', hp:7, dmg:2, speed:0, radius:12,
    color:'#8fd0ea', dark:'#356070', behavior:'fdPermafrostShard', fireCooldown:1.1, xpTier:1, stage:4,
    desc:'Rooted. Fires a four-way cross that rotates a notch per volley, sweeping the whole room every six seconds.' },
  fdwinterhound: { id:'fdwinterhound', name:'DNB Winter Hound', hp:5, dmg:2, speed:78, radius:11,
    color:'#7f96a8', dark:'#39434e', behavior:'fdWinterHound', contactCooldown:0.6, xpTier:1, stage:4, weight:1.3,
    desc:'Pack hunter. Sprints in short bursts with a hard stop between them — the stops are your entire window.' },
  fdblizzardmoth: { id:'fdblizzardmoth', name:'DNB Blizzard Moth', hp:4, dmg:2, speed:104, radius:9,
    color:'#eef8ff', dark:'#93a6b4', behavior:'fdBlizzardMoth', flies:true, fireCooldown:0.7, xpTier:1, stage:4,
    desc:'Drifts on a wide sine and sheds slow flurry motes behind it, seeding the room with drifting chaff.' },
  fdcryowarden: { id:'fdcryowarden', name:'DNB Cryo Warden', hp:9, dmg:3, speed:44, radius:16,
    color:'#6f8fa8', dark:'#2c3f4e', behavior:'fdCryoWarden', contactCooldown:1, xpTier:2, stage:4, weight:0.7,
    desc:'A slow armoured wall that never shoots. It walks you down and slams, and the slam reaches further than it looks.' },
  fdfrostcallow: { id:'fdfrostcallow', name:'DNB Frost Callow', hp:4, dmg:2, speed:80, radius:10,
    color:'#c4e2f2', dark:'#527486', behavior:'fdFrostCallow', fireCooldown:2.1, xpTier:1, stage:4,
    desc:'A coward with a homing shot — always backing away, and the bolt curves, so distance never saves you.' },
  fdicewinddervish: { id:'fdicewinddervish', name:'DNB Icewind Dervish', hp:6, dmg:2, speed:58, radius:12,
    color:'#dff2ff', dark:'#5c7a8a', behavior:'fdIcewindDervish', fireCooldown:0.16, xpTier:2, stage:4, weight:0.6,
    desc:'Spins without stopping, leaking one bolt per tick off a rotating arm. You walk through the spiral, not around it.' },
  fdthawling: { id:'fdthawling', name:'DNB Thawling', hp:6, dmg:2, speed:66, radius:11,
    color:'#a0d8e8', dark:'#3e6674', behavior:'fdThawling', contactCooldown:0.7, xpTier:1, stage:4,
    desc:'Melts as it takes damage: the lower its health, the faster it moves, and under half it commits to reckless lunges.' },
  fdglassduneskater: { id:'fdglassduneskater', name:'DNB Glassdune Skater', hp:5, dmg:3, speed:88, radius:11,
    color:'#cfe0e8', dark:'#5a6c76', behavior:'fdGlassduneSkater', contactCooldown:0.7, xpTier:2, stage:4, weight:0.8,
    desc:'Locked to the cardinal axes. Lines up on your row or column and rails down it — diagonals are its blind spot.' },

  /* ---- stage 5 — BADLANDS (floorNum 17-18) ----
     Canyon country. Everything here either circles you from above, comes
     up from underneath, or shoots from a rock and reloads. Noticeably
     more ranged pressure than the Frozen Desert, and the first stage
     where the ground itself drags. */
  bldustdevil: { id:'bldustdevil', name:'DNB Dust Devil', hp:6, dmg:2, speed:82, radius:13,
    color:'#c9a86a', dark:'#6a5230', behavior:'blDustDevil', contactCooldown:0.6, xpTier:2, stage:5,
    desc:'A wandering vortex with no projectiles at all — it just drags you inward as it passes, and you cannot walk straight past it.' },
  blrattler: { id:'blrattler', name:'DNB Rattler', hp:7, dmg:3, speed:70, radius:12,
    color:'#a8894a', dark:'#54401c', behavior:'blRattler', contactCooldown:0.7, xpTier:2, stage:5,
    desc:'Burrowed until you cross its row or column, then erupts straight down that line. The rattle is your only warning.' },
  blbuzzard: { id:'blbuzzard', name:'DNB Buzzard', hp:6, dmg:2, speed:92, radius:12,
    color:'#7a6a58', dark:'#3a3028', behavior:'blBuzzard', flies:true, xpTier:2, stage:5,
    desc:'Circles high out of reach, then dives at where you were. It turns badly — dodge late, not early.' },
  blcanyonslinger: { id:'blcanyonslinger', name:'DNB Canyon Slinger', hp:6, dmg:3, speed:60, radius:12,
    color:'#b07a44', dark:'#5c3d20', behavior:'blCanyonSlinger', fireCooldown:2.4, xpTier:2, stage:5,
    desc:'Lobs a rock at the ground you are standing on; it lands a beat later. Keeps its distance the entire fight.' },
  blbandit: { id:'blbandit', name:'DNB Bandit', hp:6, dmg:2, speed:76, radius:11,
    color:'#8a5a3a', dark:'#452a18', behavior:'blBandit', fireCooldown:2.3, xpTier:2, stage:5, weight:1.2,
    desc:'Three fast aimed rounds, then a long reload it spends backpedalling. The reload is the whole fight.' },
  bltumbleweed: { id:'bltumbleweed', name:'DNB Tumbleweed', hp:5, dmg:2, speed:70, radius:12,
    color:'#c2b07a', dark:'#5e5436', behavior:'blTumbleweed', contactCooldown:0.5, xpTier:1, stage:5,
    desc:'Rolls one way forever, faster and faster, bouncing off walls. Harmless to look at until it is doing triple speed.' },
  blsunbaker: { id:'blsunbaker', name:'DNB Sunbaker', hp:5, dmg:3, speed:0, radius:11,
    color:'#d99a3a', dark:'#7a5214', behavior:'blSunbaker', fireCooldown:2.8, xpTier:2, stage:5, weight:0.8,
    desc:'A rooted sniper whose burst is walked across your position, so sidestepping into the next shot is the classic mistake.' },
  blmesaguardian: { id:'blmesaguardian', name:'DNB Mesa Guardian', hp:10, dmg:3, speed:46, radius:16,
    color:'#8a6a4a', dark:'#3e3020', behavior:'blMesaGuardian', contactCooldown:1, xpTier:2, stage:5, weight:0.7,
    desc:'Plated and unhittable most of the time. Every few seconds the plates open for a shockwave — that is your damage window.' },
  blscorpling: { id:'blscorpling', name:'DNB Scorpling', hp:5, dmg:2, speed:84, radius:10,
    color:'#c96a3a', dark:'#66311a', behavior:'blScorpling', contactCooldown:0.6, xpTier:1, stage:5, weight:1.2,
    desc:'Never approaches head-on. Crabs sideways until it has your flank, then stabs with a short stinger lunge.' },
  blcoyote: { id:'blcoyote', name:'DNB Coyote', hp:6, dmg:2, speed:90, radius:11,
    color:'#9a7a5a', dark:'#4a3828', behavior:'blCoyote', contactCooldown:0.6, xpTier:1, stage:5,
    desc:'Runs to the far side of you and only attacks from behind your line of travel. It punishes backing up.' },
  blquicksandmaw: { id:'blquicksandmaw', name:'DNB Quicksand Maw', hp:8, dmg:3, speed:0, radius:15,
    color:'#a8925a', dark:'#4e4224', behavior:'blQuicksandMaw', fireCooldown:2.7, xpTier:2, stage:5, weight:0.6,
    desc:'A rooted mouth in the ground that drags you toward it from a long way out. The danger is whatever else is in the room.' },
  bldynamitehauler: { id:'bldynamitehauler', name:'DNB Dynamite Hauler', hp:7, dmg:3, speed:62, radius:13,
    color:'#b04a3a', dark:'#58231a', behavior:'blDynamiteHauler', fireCooldown:2.2, xpTier:2, stage:5,
    desc:'Chases at walking pace while pitching fat, slow lit sticks. Easy to outrun, miserable to fight in a corridor.' },
  blheathaze: { id:'blheathaze', name:'DNB Heat Haze', hp:5, dmg:2, speed:52, radius:11,
    color:'#e0c07a', dark:'#7a6238', behavior:'blHeatHaze', fireCooldown:1.9, xpTier:1, stage:5,
    desc:'Shimmers a short hop sideways every second, so aimed shots keep missing, and answers with a wide slow fan.' },
  blbonekite: { id:'blbonekite', name:'DNB Bone Kite', hp:5, dmg:2, speed:86, radius:10,
    color:'#e8ddc0', dark:'#8a8068', behavior:'blBoneKite', flies:true, fireCooldown:1.6, xpTier:1, stage:5,
    desc:'Hangs directly above you and rains a downward fan. Get level with it and it cannot point its shots at all.' },
  blpetrifiedrider: { id:'blpetrifiedrider', name:'DNB Petrified Rider', hp:8, dmg:3, speed:74, radius:13,
    color:'#6a5a4a', dark:'#322a22', behavior:'blPetrifiedRider', contactCooldown:0.8, xpTier:2, stage:5, weight:0.7,
    desc:'Jousts. Long straight charges clean across the room with a slow wide turn at each end — it cannot corner.' },

  /* ---- stage 6 — BEACH (floorNum 19-20) ----
     The last of Group 1 and the hardest of its three: shells that have to
     be opened, birds that never land, and water that moves you around
     while everything else shoots. Several of these push or root the
     player outright, which is the stage's signature. */
  bcsandcrab: { id:'bcsandcrab', name:'DNB Sand Crab', hp:8, dmg:3, speed:74, radius:12,
    color:'#e08a6a', dark:'#763c28', behavior:'bcSandCrab', contactCooldown:0.7, xpTier:2, stage:6, weight:1.2,
    desc:'Moves only sideways relative to you, spiralling inward, and claws with a short telegraphed snip.' },
  bcgull: { id:'bcgull', name:'DNB Gull', hp:6, dmg:2, speed:104, radius:10,
    color:'#f4f4ea', dark:'#8a8a80', behavior:'bcGull', flies:true, xpTier:1, stage:6,
    desc:'Swoops in from off to one side in a shallow arc, then peels away out of reach before coming back around.' },
  bcjellydrifter: { id:'bcjellydrifter', name:'DNB Jelly Drifter', hp:7, dmg:2, speed:34, radius:13,
    color:'#8fe0e8', dark:'#3a6a72', behavior:'bcJellyDrifter', fireCooldown:2.4, xpTier:2, stage:6,
    desc:'Barely moves. Pulses an expanding ring of stingers on a slow metronome — a room-control piece, not a chaser.' },
  bctidecaller: { id:'bctidecaller', name:'DNB Tidecaller', hp:7, dmg:3, speed:56, radius:13,
    color:'#4fa8d6', dark:'#25597a', behavior:'bcTidecaller', xpTier:2, stage:6, weight:0.8,
    desc:'Calls a wave: a long telegraph, then a wall of surf that sweeps the room from its side. Get behind it or get wet.' },
  bcsurfer: { id:'bcsurfer', name:'DNB Surfer', hp:7, dmg:3, speed:92, radius:12,
    color:'#3ac9c9', dark:'#186262', behavior:'bcSurfer', contactCooldown:0.6, xpTier:2, stage:6,
    desc:'Carves. Constant high speed with a limited turn rate, so it draws long banking arcs around you and never stops.' },
  bcurchin: { id:'bcurchin', name:'DNB Urchin', hp:9, dmg:3, speed:0, radius:12,
    color:'#8a3ac0', dark:'#451a62', behavior:'bcUrchin', xpTier:1, stage:6,
    desc:'Rooted. Alternates a spined, invulnerable rest state with an open state where it fires eight ways and can be hit.' },
  bchermithusk: { id:'bchermithusk', name:'DNB Hermit Husk', hp:10, dmg:3, speed:58, radius:14,
    color:'#c9a86a', dark:'#5e4c28', behavior:'bcHermitHusk', contactCooldown:0.8, xpTier:2, stage:6, weight:0.8,
    desc:'Walks up armoured inside its shell, pops out for one fast lunge, and is back in the shell before you can answer.' },
  bcpelican: { id:'bcpelican', name:'DNB Pelican', hp:8, dmg:3, speed:80, radius:13,
    color:'#e6e0d0', dark:'#7a7264', behavior:'bcPelican', flies:true, fireCooldown:2, xpTier:2, stage:6, weight:0.7,
    desc:'Flies overhead and drops its catch on your head — a delayed impact at wherever you were when it let go.' },
  bcsandflea: { id:'bcsandflea', name:'DNB Sandflea', hp:4, dmg:2, speed:96, radius:8,
    color:'#b09a72', dark:'#544632', behavior:'bcSandflea', contactCooldown:0.5, xpTier:1, stage:6, weight:1.4,
    desc:'Hops. Tiny, fast, and only dangerous in the instant it lands — between hops it sits perfectly still.' },
  bccorallurker: { id:'bccorallurker', name:'DNB Coral Lurker', hp:7, dmg:3, speed:66, radius:12,
    color:'#e0607a', dark:'#722a3c', behavior:'bcCoralLurker', contactCooldown:0.7, xpTier:2, stage:6,
    desc:'Sits still until you come in reach, ambush-dashes, then relocates somewhere else in the room and waits again.' },
  bcriptidewisp: { id:'bcriptidewisp', name:'DNB Riptide Wisp', hp:6, dmg:2, speed:72, radius:11,
    color:'#6fd0e0', dark:'#2c6470', behavior:'bcRiptideWisp', fireCooldown:1.8, xpTier:2, stage:6,
    desc:'The opposite of a puller — it shoves you away in surges, which is how it parks you in everything else’s line of fire.' },
  bcsaltspitter: { id:'bcsaltspitter', name:'DNB Salt Spitter', hp:6, dmg:2, speed:80, radius:11,
    color:'#f0f6d0', dark:'#8a9068', behavior:'bcSaltSpitter', xpTier:1, stage:6,
    desc:'Advances in short bursts and fires a tight three-shot volley at the end of each, so its shots always arrive on the move.' },
  bcbeachcomber: { id:'bcbeachcomber', name:'DNB Beachcomber', hp:8, dmg:3, speed:64, radius:12,
    color:'#d0c090', dark:'#6a6048', behavior:'bcBeachcomber', fireCooldown:1.2, xpTier:2, stage:6, weight:0.7,
    desc:'Patrols the room’s edge on a fixed circuit and only fires when it happens to line up with you. Ignoring it is usually correct.' },
  bckelptangler: { id:'bckelptangler', name:'DNB Kelp Tangler', hp:9, dmg:3, speed:38, radius:14,
    color:'#3a7a4a', dark:'#1a3a24', behavior:'bcKelpTangler', xpTier:2, stage:6, weight:0.7,
    desc:'A rooted grabber. Winds up a long telegraph and, if you are still in reach when it lands, roots you in place for a moment.' },
  bcsunbleachedhusk: { id:'bcsunbleachedhusk', name:'DNB Sunbleached Husk', hp:11, dmg:3, speed:52, radius:15,
    color:'#e8e0cc', dark:'#847c68', behavior:'bcSunbleachedHusk', contactCooldown:0.9, xpTier:2, stage:6,
    desc:'The closer’s closer. Accelerates for as long as it has a clear run at you, and loses all of it the moment it is blocked.' },
});

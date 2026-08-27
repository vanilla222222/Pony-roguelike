'use strict';
/* ============================================================
   data/enemies/legacy-extra.js — Phase 15. Five new trash enemies for
   EACH of the four legacy stages (Crypt/Whitetail Forest/Sandswept
   Dunes/Inferno — stage 0-3), on top of what types-1..4.js already
   carries. The matching four new bosses (one per stage) live in
   legacy-extra-bosses.js instead, loaded AFTER bosses.js — BOSS_TYPES
   doesn't exist yet at this file's load position (see index.html),
   same reason stage4-6/7-9/10-13's boss files are split from their
   own enemy files.

   Reuses the three new SHARED behaviors from systems/ai-newshared.js
   (pouncer/strafer/splitshot) — same "one function, many recolors
   across every stage" shape the original 17-behavior extended set
   (orbiter/sniper/etc., see types-1..4.js) already uses, deliberately
   NOT the bespoke-per-enemy shape stage4-6/7-9/10-13's content groups
   use, since inventing 20 more fully unique AI functions on top of an
   already enormous roster was judged lower value than reusing three
   solid new archetypes with real stage-appropriate flavor on each.

   STAT BAND. hp here sits at 4-9, matching the existing legacy-stage
   identity range (growth.js's header comment / the pre-existing
   types-1..4.js entries already span roughly 2-9).
   ============================================================ */
Object.assign(ENEMY_TYPES, {
  // ---- Crypt (stage 0) ----
  gravelurker: { id:'gravelurker', name:'DNB Grave Lurker', hp:6, dmg:2, speed:82, radius:12,
    color:'#6a5f52', dark:'#332e26', behavior:'pouncer', pounceRange:160, leapSpeed:5.2, xpTier:2, stage:0,
    desc:'Sits motionless among the headstones until you wander close, then commits to one long pounce.' },
  bonerattler: { id:'bonerattler', name:'DNB Bone Rattler', hp:5, dmg:1, speed:70, radius:11,
    color:'#a89a80', dark:'#5c5240', behavior:'strafer', keepDistance:170, fireCooldown:1.5, boltColor:'#c9c2b0', xpTier:1, stage:0,
    desc:'Circles at a steady range, firing as it goes — never lets you close the distance for free.' },
  sepulchertwin: { id:'sepulchertwin', name:'DNB Sepulcher Twin', hp:5, dmg:1, speed:64, radius:11,
    color:'#5a5266', dark:'#2c2734', behavior:'splitshot', splitAngle:0.5, fireCooldown:2, boltColor:'#8a7fc0', xpTier:2, stage:0,
    desc:'Fires two bolts in a fixed V that widens with range — back up and the gap between them only grows.' },
  coffincrawler: { id:'coffincrawler', name:'DNB Coffin Crawler', hp:7, dmg:2, speed:76, radius:13,
    color:'#4a4438', dark:'#26221c', behavior:'pouncer', pounceRange:140, leapSpeed:4.6, xpTier:2, stage:0, weight:0.8,
    desc:'A heavier ambusher — slower to close once it commits, but the pounce itself hits harder.' },
  wraitharcher: { id:'wraitharcher', name:'DNB Wraith Archer', hp:4, dmg:1, speed:74, radius:10,
    color:'#8a8fa0', dark:'#403f4e', behavior:'strafer', keepDistance:210, fireCooldown:1.2, boltColor:'#c0c8e0', xpTier:1, stage:0,
    desc:'Keeps a wide ring and fires often — individually weak, dangerous mixed into a room with anything else.' },

  // ---- Whitetail Forest (stage 1) ----
  bramblestalker: { id:'bramblestalker', name:'DNB Bramble Stalker', hp:7, dmg:2, speed:80, radius:12,
    color:'#3a5c2a', dark:'#1c3014', behavior:'pouncer', pounceRange:165, leapSpeed:5, xpTier:2, stage:1,
    desc:'Hides in the undergrowth — nearly invisible against the foliage until it\'s already lunging.' },
  vinewhipper: { id:'vinewhipper', name:'DNB Vine Whipper', hp:6, dmg:1, speed:66, radius:11,
    color:'#5c8a3a', dark:'#2c4a1a', behavior:'strafer', keepDistance:160, fireCooldown:1.6, boltColor:'#8ad65a', xpTier:1, stage:1,
    desc:'Weaves along the treeline at a fixed remove, lashing out with a ranged whip-crack of thorns.' },
  twinthorn: { id:'twinthorn', name:'DNB Twin Thorn', hp:5, dmg:1, speed:60, radius:11,
    color:'#4a7a2e', dark:'#264018', behavior:'splitshot', splitAngle:0.45, fireCooldown:2.1, boltColor:'#7fd85a', xpTier:2, stage:1,
    desc:'Splits every shot into a diverging pair of thorns — dodge into the middle, not to either side.' },
  mossambusher: { id:'mossambusher', name:'DNB Moss Ambusher', hp:8, dmg:2, speed:70, radius:13,
    color:'#2e4a24', dark:'#152613', behavior:'pouncer', pounceRange:130, leapSpeed:4.4, xpTier:2, stage:1, weight:0.8,
    desc:'Camouflaged and patient — the tightest pounce range of any lurker in the woods, and the heaviest hit.' },
  canopysniper: { id:'canopysniper', name:'DNB Canopy Sniper', hp:4, dmg:2, speed:58, radius:10,
    color:'#6a9a4a', dark:'#345020', behavior:'strafer', keepDistance:230, fireCooldown:1.9, boltColor:'#a8e07a', xpTier:1, stage:1,
    desc:'Stays as far back as the room allows and pelts you from the canopy — closing the gap is the answer.' },

  // ---- Sandswept Dunes (stage 2) ----
  dunepouncer: { id:'dunepouncer', name:'DNB Dune Pouncer', hp:6, dmg:2, speed:88, radius:12,
    color:'#c9a860', dark:'#6a5326', behavior:'pouncer', pounceRange:175, leapSpeed:5.6, xpTier:2, stage:2,
    desc:'Buried to its eyes in loose sand — a low silhouette that\'s already too late to notice once it moves.' },
  miragestrafer: { id:'miragestrafer', name:'DNB Mirage Strafer', hp:5, dmg:1, speed:78, radius:11,
    color:'#e0c374', dark:'#7a682a', behavior:'strafer', keepDistance:190, fireCooldown:1.4, boltColor:'#f0dca0', xpTier:1, stage:2,
    desc:'Shimmers along a steady ring in the heat haze, firing on rhythm the whole time it circles.' },
  twinfangviper: { id:'twinfangviper', name:'DNB Twin Fang Viper', hp:5, dmg:2, speed:64, radius:11,
    color:'#8a6a2c', dark:'#4a3814', behavior:'splitshot', splitAngle:0.55, fireCooldown:2.2, boltColor:'#d9a83a', xpTier:2, stage:2,
    desc:'A wide diverging bite — the two fangs miss each other by design, so there\'s always a lane, just not where you\'d guess.' },
  sandambusher: { id:'sandambusher', name:'DNB Sand Ambusher', hp:8, dmg:2, speed:72, radius:14,
    color:'#a8894a', dark:'#544522', behavior:'pouncer', pounceRange:145, leapSpeed:4.8, xpTier:2, stage:2, weight:0.8,
    desc:'The heaviest thing that can hide in open sand — its pounce alone is worth respecting from range.' },
  heatwavegunner: { id:'heatwavegunner', name:'DNB Heatwave Gunner', hp:4, dmg:1, speed:66, radius:10,
    color:'#d99a3a', dark:'#7a5218', behavior:'strafer', keepDistance:220, fireCooldown:1.3, boltColor:'#f0b85a', xpTier:1, stage:2,
    desc:'Keeps distance in the shimmering heat and fires steadily — thin but relentless.' },

  // ---- The Inferno (stage 3) ----
  cinderpouncer: { id:'cinderpouncer', name:'DNB Cinder Pouncer', hp:7, dmg:2, speed:92, radius:12,
    color:'#c9482e', dark:'#6a1e11', behavior:'pouncer', pounceRange:170, leapSpeed:5.8, xpTier:2, stage:3,
    desc:'Crouches in the ash until you\'re close, then rockets across the room in one committed lunge.' },
  ashstrafer: { id:'ashstrafer', name:'DNB Ash Strafer', hp:6, dmg:1, speed:80, radius:11,
    color:'#8a3a2c', dark:'#451c15', behavior:'strafer', keepDistance:180, fireCooldown:1.3, boltColor:'#e0602e', xpTier:1, stage:3,
    desc:'Circles through the drifting ash at a fixed range, never letting the pressure up.' },
  twinflameimp: { id:'twinflameimp', name:'DNB Twin Flame Imp', hp:6, dmg:2, speed:66, radius:11,
    color:'#e0662e', dark:'#7a2c10', behavior:'splitshot', splitAngle:0.5, fireCooldown:1.9, boltColor:'#f0a03a', xpTier:2, stage:3,
    desc:'Splits its flame into two diverging jets — corner it and both jets stop missing each other.' },
  slagambusher: { id:'slagambusher', name:'DNB Slag Ambusher', hp:9, dmg:3, speed:74, radius:15,
    color:'#5c2418', dark:'#2a0f0a', behavior:'pouncer', pounceRange:135, leapSpeed:4.6, xpTier:2, stage:3, weight:0.8,
    desc:'The heaviest hitter of the pouncing set — molten and slow to reset, but the pounce alone costs hearts.' },
  embermarksman: { id:'embermarksman', name:'DNB Ember Marksman', hp:5, dmg:2, speed:62, radius:10,
    color:'#f0a03a', dark:'#8a5418', behavior:'strafer', keepDistance:240, fireCooldown:1.7, boltColor:'#ffcf7a', xpTier:1, stage:3,
    desc:'Backs to the far edge of any room it enters and never stops firing from there.' },
});

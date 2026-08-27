'use strict';
/* ============================================================
   data/enemies/crypt-extra.js — Phase 17. Eight new "floor by floor"
   Crypt (stage 0) enemies, each with genuinely new behavior — not the
   Phase 15 "reskin an existing archetype" trash pass. Six of the
   eight needed brand-new shared behaviors (systems/ai-crypt.js:
   flee/wallHugger/cardinalBloat/randomJumper/dvdStrider/haunter);
   the DNB Fire Circler (#8) is the one exception — see its own entry
   below for why 'strafer' already covers it outright.

   #1/#2 (Hive/Bomb Hive) are the one pair here with an on-death
   payload instead of (or alongside) a live threat — spawnFliesOnDeath
   / spawnBombsOnDeath are new generic ENEMY_TYPES fields, read once
   in combat-2.js's handleEnemyDeath, not bespoke to these two ids.
   ============================================================ */
Object.assign(ENEMY_TYPES, {
  crypthive: { id:'crypthive', name:'DNB Crypt Hive', hp:5, dmg:1, speed:60, radius:12,
    color:'#8a7a5a', dark:'#453a24', behavior:'flee', spawnFliesOnDeath:{ id:'dnbfly', count:6, radius:46 },
    xpTier:2, stage:0,
    desc:'Never turns to fight — it only runs. Corner it and killing it is the mistake: six flies boil out of the wound.' },
  cryptbombhive: { id:'cryptbombhive', name:'DNB Crypt Bomb Hive', hp:6, dmg:1, speed:58, radius:12,
    color:'#7a6a4a', dark:'#3a3020', behavior:'flee', spawnBombsOnDeath:3,
    xpTier:2, stage:0,
    desc:'Packed with something volatile. It runs from you its whole life and only detonates once it\'s dead — three live bombs, dropped where it fell.' },
  cryptwallhugger: { id:'cryptwallhugger', name:'DNB Wall Hugger', hp:6, dmg:1, speed:66, radius:11,
    color:'#6a6258', dark:'#332e28', behavior:'wallHugger', fireCooldown:2.0, boltColor:'#c0b8a0', xpTier:2, stage:0,
    desc:'Pinned to whichever wall is nearest, sliding along it to keep level with you — never charges in, just keeps a clean firing lane open.' },
  cryptbloat: { id:'cryptbloat', name:'DNB Crypt Bloat', hp:7, dmg:1, speed:50, radius:13,
    color:'#5c6a48', dark:'#2c3320', behavior:'cardinalBloat', fireCooldown:2.2, boltColor:'#8fae5a', xpTier:2, stage:0, weight:0.8,
    desc:'Drifts with no purpose at all until it suddenly isn\'t — a bolt down each of the four compass lines, whether or not you\'re standing in one.' },
  cryptjumper: { id:'cryptjumper', name:'DNB Crypt Jumper', hp:6, dmg:2, speed:68, radius:12,
    color:'#9a8a6a', dark:'#4a4030', behavior:'randomJumper', aimRange:150, jumpSpeed:5.2, xpTier:2, stage:0,
    desc:'Hops on its own clock no matter what — anywhere, at random, until you wander close enough that the next hop is aimed straight at you.' },
  cryptstrider: { id:'cryptstrider', name:'DNB Crypt Strider', hp:7, dmg:2, speed:100, radius:12,
    color:'#8a5a6a', dark:'#452a34', behavior:'dvdStrider', xpTier:2, stage:0,
    desc:'Picks one heading and never lets go of it — bounces wall to wall to wall for as long as it\'s alive, indifferent to where you are.' },
  crypthaunter: { id:'crypthaunter', name:'DNB Crypt Haunter', hp:5, dmg:1, speed:72, radius:11,
    color:'#a0a8c0', dark:'#4a4e66', behavior:'haunter', flies:true, harmless:true, xpTier:2, stage:0,
    desc:'Drifts harmlessly on its own — until it possesses whatever\'s nearest and turns the room\'s own furniture against you.' },

  // ---- #8: DNB Fire Circler — universal, not Crypt-only. Isaac's Pokey
  // Fly (Flesh Angel? -- read: fast rush to orbit range, then circle and
  // snipe) reduces to exactly what 'strafer' (ai-newshared.js) already
  // does: radial correction pulls it to the ring from ANY starting
  // distance (so a far spawn reads as a fast opening rush), then it holds
  // the ring and fires. A tight keepDistance + a real speed edge over the
  // Crypt roster is the only "new" ingredient this needed.
  dnbfirecircler: { id:'dnbfirecircler', name:'DNB Fire Circler', hp:5, dmg:1, speed:118, radius:10,
    color:'#e0562e', dark:'#7a2410', behavior:'strafer', flies:true, keepDistance:95, fireCooldown:1.1,
    boltSpeed:260, boltColor:'#ff8a3a', xpTier:2, stage:'universal',
    desc:'A cinder-sprite that closes distance fast, then won\'t hold still — circling and spitting fire the whole time it\'s in the room.' },
});

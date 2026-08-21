'use strict';
// data/core.js — split from data.js: tile/block constants, room shapes, classes, pools.
'use strict';
/* ============================================================
   data.js — core static data: tile/block constants, room
   shapes, classes, items, pickups, shop config, obstacles.

   Enemy/boss/superboss tables live in enemies.js; floor-theme
   data lives in stages.js — split out purely so each concern
   has its own short file to open and edit.
   ============================================================ */

const TILE = 32;      // pixel size of one tile
const BLOCK = 10;      // tiles per polyomino "block" (a 1x1 room = 10x10 tiles)

/* ---------------------------------------------------------------
   ROOM SHAPES — polyomino masks, 1-4 blocks. mask[row][col], 1=present
   --------------------------------------------------------------- */
const ROOM_SHAPES = [
  { name:'single',   w:1, blocks:4, mask:[[1]] },
  { name:'wideDom',  w:2, blocks:3, mask:[[1,1]] },
  { name:'tallDom',  w:2, blocks:3, mask:[[1],[1]] },
  { name:'wideTri',  w:2, blocks:2, mask:[[1,1,1]] },
  { name:'tallTri',  w:2, blocks:2, mask:[[1],[1],[1]] },
  { name:'square4',  w:2, blocks:2, mask:[[1,1],[1,1]] },
  { name:'lA',       w:3, blocks:2, mask:[[1,0],[1,1]] },
  { name:'lB',       w:3, blocks:2, mask:[[0,1],[1,1]] },
  { name:'lC',       w:3, blocks:2, mask:[[1,1],[1,0]] },
  { name:'lD',       w:3, blocks:2, mask:[[1,1],[0,1]] },
  { name:'wideQuad', w:4, blocks:1, mask:[[1,1,1,1]] },
  { name:'tallQuad', w:4, blocks:1, mask:[[1],[1],[1],[1]] },
  { name:'tShape',   w:4, blocks:1, mask:[[1,1,1],[0,1,0]] },
  { name:'tShape2',  w:4, blocks:1, mask:[[0,1,0],[1,1,1]] },
  { name:'sShape',   w:4, blocks:1, mask:[[0,1,1],[1,1,0]] },
  { name:'zShape',   w:4, blocks:1, mask:[[1,1,0],[0,1,1]] },
  { name:'lBig1',    w:4, blocks:1, mask:[[1,0],[1,0],[1,1]] },
  { name:'lBig2',    w:4, blocks:1, mask:[[0,1],[0,1],[1,1]] },
];
function pickRoomShape(minBlocks, maxBlocks){
  const pool = ROOM_SHAPES.filter(s => {
    const n = s.mask.flat().reduce((a,b)=>a+b,0);
    return n >= minBlocks && n <= maxBlocks;
  });
  const weighted = pool.map(s => ({ w: s.w, shape: s }));
  return Util.weighted(weighted).shape;
}

/* ---------------------------------------------------------------
   CLASSES
   --------------------------------------------------------------- */
const CLASSES = {
  earth: {
    id:'earth', name:'Earth Pony', color:'#c98a4b', mane:'#6b3f22',
    unlocked:true,
    redMax:6, speed:150, canFly:false,
    attackType:'melee', meleeDamage:2, meleeCooldown:0.4,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'Sturdy hooves, strong melee attacks. No ranged option, but hits hardest.',
  },
  pegasus: {
    id:'pegasus', name:'Pegasus', color:'#7fc1e3', mane:'#e3e3e3',
    unlocked:true,
    redMax:5, speed:175, canFly:true,
    attackType:'melee', meleeDamage:1.25, meleeCooldown:0.36,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'Light on the attack, but flies over rocks and pits with ease.',
  },
  unicorn: {
    id:'unicorn', name:'Unicorn', color:'#b48ce0', mane:'#4a2e73',
    unlocked:true,
    redMax:5, speed:145, canFly:false,
    attackType:'ranged', rangedDamage:1.6, fireCooldown:0.45, boltSpeed:360,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'Casts magic bolts at range. Middling hooves, but never needs to get close.',
  },
  batpony: {
    id:'batpony', name:'Bat Pony', color:'#5a4270', mane:'#1a1420',
    unlocked:false, unlockHint:'Defeat any boss to unlock',
    redMax:4, speed:180, canFly:true,
    attackType:'melee', meleeDamage:1.25, meleeCooldown:0.34,
    startBombs:1, startKeys:0, startCoins:0,
    lifedrinkChance:0.12,
    desc:'A frail flier of the night — but every kill has a 12% chance to mend half a heart.',
  },
  zebra: {
    id:'zebra', name:'Zebra', color:'#e8e4dc', mane:'#161616', stripes:true,
    unlocked:false, unlockHint:'Clear 2 floors in a row without taking damage',
    redMax:4, speed:155, canFly:false,
    attackType:'melee', meleeDamage:2.6, meleeCooldown:0.42,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'Frail but ferocious — the hardest-hitting hoof in Equestria, with two fewer hearts than an earth pony to spare.',
  },
  hypogriff: {
    id:'hypogriff', name:'Hypogriff', color:'#7a5ac9', mane:'#e8d16a',
    unlocked:false, unlockHint:'Defeat Polish DNB on Floor 6',
    redMax:4, speed:190, canFly:true,
    attackType:'melee', meleeDamage:2, meleeCooldown:0.36,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'Eagle-winged and lion-hearted — hits harder and flies faster than any pegasus, with a thinner hide to show for it.',
  },
  seapony: {
    id:'seapony', name:'Sea Pony', color:'#3ab0c9', mane:'#1a6b7a',
    unlocked:false, unlockHint:'Clear Floors 1-6 without taking any damage',
    redMax:6, speed:120, canFly:false,
    attackType:'ranged', rangedDamage:3, fireCooldown:0.72, boltSpeed:300,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'Slow out of water, but every bolt hits like a rolling tide.',
  },
  ponybot: {
    id:'ponybot', name:'Pony Bot', color:'#9a9aa8', mane:'#4fd1c5',
    unlocked:false, unlockHint:'Die to a cactus',
    redMax:0, startBlue:6, speed:145, canFly:false,
    attackType:'ranged', rangedDamage:0.875, fireCooldown:0.24, laser:true, noRedContainers:true,
    // fragile chassis — every hit it takes is scaled up by this, see
    // combat.js's playerDamageAmount. Only Pony Bot carries the field; it is
    // absent (and treated as 1) for every other class.
    damageTakenMult:1.25,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'A jury-rigged automaton. Fires a piercing, room-spanning laser — runs on blue magic alone, can never gain heart containers, and takes 25% more damage from everything.',
  },
  griffin: {
    id:'griffin', name:'Griffin', color:'#c9a35a', mane:'#8a6a3a',
    unlocked:false, unlockHint:'Defeat Pineapple Gatorade DNB on Floor 9A',
    redMax:5, speed:185, canFly:true,
    attackType:'ranged', rangedDamage:1, fireCooldown:0.3, boltSpeed:420,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'A swift aerial hunter — rapid-fire feather volleys trade power for blistering speed.',
  },
  kirin: {
    id:'kirin', name:'Kirin', color:'#e0592f', mane:'#2c0f0a',
    unlocked:false, unlockHint:'Defeat Israel DNB on Floor 9B',
    redMax:0.5, speed:150, canFly:false,
    attackType:'ranged', rangedDamage:3.5, fireCooldown:0.58, boltSpeed:380, noRedContainers:true,
    startBombs:1, startKeys:0, startCoins:0,
    desc:"One hit and it's over — but a Kirin's wrath burns hotter than anything else in Equestria.",
  },
  dragon: {
    id:'dragon', name:'Dragon', color:'#c9522e', mane:'#e0895a',
    unlocked:false, unlockHint:'Defeat Tyrone, the DNB King on Floor 7',
    redMax:7, speed:145, canFly:true,
    // charged/chargeTime — hold the attack button; nothing fires until the
    // charge fills, see combat.js playerChargedBeamAttack. baseRangeTiles
    // is deliberately short — the beam trades range for raw stopping power.
    attackType:'ranged', rangedDamage:3, fireCooldown:0.3, charged:true, chargeTime:0.5, baseRangeTiles:4,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'A young dragon whelp — thick-scaled and tough. Hold the attack to charge a short jet of dragonfire that burns through everything in its path.',
  },
  windigo: {
    id:'windigo', name:'Windigo', color:'#9ac9e0', mane:'#e8f4ff',
    unlocked:false, unlockHint:'Freeze 30 enemies',
    redMax:6, speed:160, canFly:true,
    // innateFreezeChance folds straight into recalcPlayerStats' freezeChance
    // formula alongside Cold Heart/Frostbite/etc — see items.js
    attackType:'ranged', rangedDamage:3, fireCooldown:0.8, boltSpeed:280, innateFreezeChance:0.12,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'A spirit of the bitter cold. Slow, heavy-hitting frost bolts that have a natural 12% chance to freeze on contact.',
  },
  kelpie: {
    id:'kelpie', name:'Kelpie', color:'#2e6e6a', mane:'#0f3a38',
    unlocked:false, unlockHint:'Defeat 300 enemies with melee attacks',
    redMax:7, speed:120, canFly:false,
    attackType:'melee', meleeDamage:2, meleeCooldown:0.42, baseRangeTiles:2.25,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'A hulking water-horse that drags prey down from a distance. Slow on land, but its reach is more than twice any other hoof or claw.',
  },
  breezie: {
    id:'breezie', name:'Breezie', color:'#e07a9c', mane:'#f4d35e', sizeMult:0.62,
    unlocked:false, unlockHint:'Defeat 300 enemies with ranged attacks',
    redMax:2, speed:195, canFly:true,
    // unlimitedRange — its dust-mote bolts never expire from distance, only
    // ever stopped by a wall — see combat.js playerRangedAttack
    attackType:'ranged', rangedDamage:1.2, fireCooldown:0.38, boltSpeed:400, unlimitedRange:true,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'A pixie-sized pony, barely bigger than a hoofprint. The fastest hooves alive and dust motes that never lose momentum — but the thinnest hide of anything that can take a hit at all.',
  },
  dnbpony: {
    id:'dnbpony', name:'DNB Pony', color:'#6a4bd6', mane:'#3ef0e0',
    unlocked:false, unlockHint:'Defeat The One True DNB on floor 13',
    redMax:5, startBlue:1, speed:178, canFly:false,
    // fireCooldown was 0.20 — 2 dmg every 0.20s is ~10 base DPS, against ~3.3
    // for the Griffin and ~4.2 for the Sea Pony, i.e. ~3x the best class in the
    // game. 0.32 lands it at ~6.25 DPS: still comfortably the strongest, which
    // is right for the final unlock, without being in its own category.
    attackType:'ranged', rangedDamage:2, fireCooldown:0.32, boltSpeed:330,
    startBombs:1, startKeys:1, startCoins:0,
    desc:'Born from the drop itself — a blur of violet and neon that fires bass pulses faster than anything alive, each one barely more than a tap.',
  },

  /* -------------------------------------------------------------
     APPEND-ONLY ZONE. achievements.js pairs every class with every
     superboss by walking `for (const classId in CLASSES)` — i.e. in
     this literal's declaration order — and hands each pairing the
     NEXT entry of SUPERBOSS_REWARDS with a strictly-incrementing,
     non-modulo counter. Inserting a class ABOVE this point would
     re-shuffle which reward every later class's pairings hand out.
     New classes go at the BOTTOM, always.
     ------------------------------------------------------------- */
  crystalpony: {
    id:'crystalpony', name:'Crystal Pony', color:'#8fd6e8', mane:'#d8b4f0',
    unlocked:true,
    // the sturdiest hide in the game (one over the Dragon's 7) bought with the
    // second-slowest legs and an attack that has to be charged before it fires
    redMax:8, speed:130, canFly:false,
    // crystalVolley — hold to charge, then three shards fire at once from three
    // points along her flank and CONVERGE on the cursor (see combat.js's
    // playerCrystalVolleyAttack). Shares Dragon's charged/chargeTime plumbing:
    // once chargeTimer fills it autofires, letting go early wastes the charge.
    attackType:'ranged', charged:true, chargeTime:0.7, fireCooldown:0.3,
    rangedDamage:1.0, boltSpeed:260, crystalVolley:true,
    startBombs:1, startKeys:0, startCoins:8,
    desc:'Faceted hide of living gemstone — the toughest thing on four legs. Charges her horn, then looses three crystal shards that converge on wherever you\'re aiming. Starts with a pocketful of coins.',
  },
  mule: {
    id:'mule', name:'Mule', color:'#8a7a6a', mane:'#3a3028', sizeMult:1.18,
    unlocked:true,
    // the pack-animal identity is the starting kit, not the numbers: 3 bombs /
    // 2 keys / 12c is by far the richest opening in the game. 2.2 per 0.48s is
    // 4.58 DPS against the Earth Pony's 5.0, at 132 speed against its 150.
    redMax:7, speed:132, canFly:false,
    attackType:'melee', meleeDamage:2.2, meleeCooldown:0.48,
    startBombs:3, startKeys:2, startCoins:12,
    desc:'Broad-backed and stubborn. Plods where a pony would trot, but hauls a whole prospector\'s kit down with it — three bombs, two keys and coin to spare.',
  },
  alicorn: {
    id:'alicorn', name:'Alicorn', color:'#f0e6f5', mane:'#c98ae0',
    unlocked:false, unlockHint:'Channel 25 stars',
    // wings AND horn — the only class with both. Paid for with the joint-lowest
    // heart count of any full-size class: 4, same as Zebra/Bat Pony/Hypogriff.
    redMax:4, speed:165, canFly:true,
    attackType:'ranged', rangedDamage:1.8, fireCooldown:0.5, boltSpeed:400,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'Wing and horn both — flight and magic in one frame, and a frame far too fine to take a beating for it.',
  },
  changeling: {
    id:'changeling', name:'Changeling', color:'#3a3f46', mane:'#5ae0a0',
    unlocked:false, unlockHint:'Collect 25 familiars',
    // the only class that flies, shoots AND drains: 0.18 lifedrink is the
    // highest in the game (Bat Pony's is 0.12), which is why the bolts are
    // weak and the hide is thin
    redMax:4, speed:170, canFly:true,
    // greenFireAttack — no bolts at all. Holding attack plants a pool of green
    // changeling fire fireZoneRange px ahead of her; it stays anchored where it
    // was planted for as long as the button is held and vanishes the instant
    // it isn't. rangedDamage/fireCooldown are still the damage numbers, just
    // spent continuously: dps = rangedDamage / fireCooldown = 3.5/s, accrued
    // smoothly instead of in discrete shots. See combat.js updateGreenFireAttack.
    attackType:'ranged', rangedDamage:1.4, fireCooldown:0.4,
    greenFireAttack:true, fireZoneRadius:50, fireZoneRange:40,
    lifedrinkChance:0.18,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'A carapaced infiltrator that feeds on what it fells — 18% of kills give back half a heart, the greediest drain in Equestria. Spits a pool of clinging green fire that burns and mires anything standing in it. Flies, but barely holds together.',
  },
  diamonddog: {
    id:'diamonddog', name:'Diamond Dog', color:'#a8926e', mane:'#5a4a32',
    unlocked:false, unlockHint:'Destroy 100 rocks with bombs',
    // the demolition build — 4 bombs and 20c to start, the heaviest single
    // claw among the tanky classes (2.5, still under the Zebra's 2.6 so its
    // "hardest-hitting hoof" claim stands) on the slowest swing in the game
    redMax:7, speed:140, canFly:false,
    // shockwaveAttack — her claw is a pickaxe: the same melee sweep also
    // SHATTERS any rock/tallrock it catches, the only attack in the game that
    // can (see combat.js playerMeleeAttack). Rocks she breaks pay out on their
    // own flat rockCoinChance and nothing else — no prospector passives, no
    // tinted-rock table — and noTintedRocks keeps tinted rocks out of her runs
    // entirely (see room.js rollRockKind), since she'd shatter them for free.
    attackType:'melee', meleeDamage:2.5, meleeCooldown:0.55,
    shockwaveAttack:true, rockCoinChance:0.02, noTintedRocks:true,
    startBombs:4, startKeys:0, startCoins:20,
    desc:'A tunnel-digging gem hound. Slow, ponderous claws that land like a pickaxe — heavy enough to shatter solid rock — and it never goes underground without a satchel of bombs and gems.',
  },
  gargoyle: {
    id:'gargoyle', name:'Gargoyle', color:'#7a8290', mane:'#4a5058',
    unlocked:false, unlockHint:'Mark 50 enemies Vulnerable',
    // stone wings and a ranged bite between Griffin's speed and Hypogriff's
    // weight — see hypogriff/griffin above for the two classes this
    // interpolates between
    redMax:6, speed:165, canFly:true,
    // innateVulnerableChance folds straight into recalcPlayerStats'
    // vulnerableChance formula alongside Hunter's Mark/Quarry Sigil/etc —
    // see items.js, exact same wiring as Windigo's innateFreezeChance above
    attackType:'ranged', rangedDamage:2, fireCooldown:0.5, boltSpeed:320, innateVulnerableChance:0.10,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'A stone sentinel that wakes at nightfall. Grit-hard hide and a natural 10% chance to mark whatever it strikes as easy prey for everything else in the room.',
  },

  /* -------------------------------------------------------------
     PHASE 5A BATCH — 4 more classes, still append-only (see the
     comment above Crystal Pony). Order here is what determines each
     new class's slot in the SUPERBOSS_REWARDS grid.
     ------------------------------------------------------------- */
  changedling: {
    id:'changedling', name:'Changedling', color:'#3f4a44', mane:'#7aeeb0',
    unlocked:false, unlockHint:'Land 150 hits with your innate fire ring',
    // no active attack at all — see innateFireRing below. Speed picked
    // clearly above the ranged-flier norm: Griffin 185, Windigo 160,
    // Alicorn 165 — 190 reads as "faster than any of them" per the brief.
    redMax:4, speed:190, canFly:true,
    // innateFireRing — a smaller, WEAKER version of the Changeling's
    // greenFireAttack that never has to be held: it just always burns,
    // centered on wherever she currently is (see combat.js
    // updateFireRingAttack). attackType/rangedDamage/fireCooldown still set
    // the dps math (dps = rangedDamage/fireCooldown = 2.0/s, well under the
    // Changeling's own 3.5/s — hers is a held, anchored, bigger pool, this
    // one is free and mobile, so it has to hit lighter).
    attackType:'ranged', rangedDamage:1.0, fireCooldown:0.5,
    innateFireRing:true, fireRingRadius:55,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'A changeling who never quite finished the change — caught somewhere between forms, and permanently smouldering because of it. Trails a faint ring of green fire everywhere she flies, no effort required. Quick on the wing, but thin-shelled.',
  },
  changelingqueen: {
    id:'changelingqueen', name:'Changeling Queen', color:'#2f3a35', mane:'#f4d35e',
    unlocked:false, unlockHint:'Summon 40 changeling minions',
    // a summoner, not a duelist — sedate compared to the base Changeling's
    // 170, wings kept for lineage
    redMax:4, speed:160, canFly:true,
    // her OWN attack reuses greenFireAttack verbatim (see the base Changeling
    // entry above for the mechanic) but calibrated meaningfully weaker: base
    // Changeling is rangedDamage:1.4/fireCooldown:0.4 (dps 3.5) over a 50px
    // pool planted 40px out; the Queen is 0.8/0.45 (dps ~1.78, about half)
    // over a smaller 35px pool planted only 30px out. She wins through her
    // hive, not her own horn.
    attackType:'ranged', rangedDamage:0.8, fireCooldown:0.45,
    greenFireAttack:true, fireZoneRadius:35, fireZoneRange:30,
    // summonsChangelings — periodically calls in up to maxChangelingMinions
    // loose-drifting changeling minions, each running its own small copy of
    // the fire-zone tick (see combat.js updateChangelingSummons).
    // changelingMinionDmg is a flat DPS figure (not run through fireCooldown
    // math the way her own attack is, since minions have no cooldown field
    // of their own) — 0.5/s per minion, so two of them together (1.0/s) is
    // still well under her own 1.78/s, exactly as a support summon should be.
    summonsChangelings:true, changelingSummonCooldown:8, maxChangelingMinions:2,
    changelingMinionDmg:0.5, changelingMinionRadius:25,
    startBombs:1, startKeys:0, startCoins:0,
    desc:'The hive-mother herself — her own flame burns low, but she never fights alone. Calls in loose-drifting changeling minions to burn beside her, each carrying a small coal of her own green fire.',
  },
  filly: {
    id:'filly', name:'Filly', color:'#f0a8c9', mane:'#e8d16a', sizeMult:0.8,
    unlocked:false, unlockHint:'Charm 60 enemies',
    // a deliberately weaker Earth Pony variant: meleeDamage down from 2 to
    // 1.4 (-30%), redMax down from 6 to 4 (-2 hearts), meleeCooldown trimmed
    // from 0.4 to 0.36 and speed up from 150 to 175 (+25, +16.7%) — small,
    // quick, and not hitting nearly as hard as a grown mare
    redMax:4, speed:175, canFly:false,
    attackType:'melee', meleeDamage:1.4, meleeCooldown:0.36,
    // innateCharmChance folds straight into recalcPlayerStats' charmChance
    // formula alongside Flirtatious/Direct Charm/etc — see items.js, exact
    // same wiring as Gargoyle's innateVulnerableChance/Windigo's
    // innateFreezeChance above
    innateCharmChance:0.25,
    startBombs:1, startKeys:0, startCoins:0,
    desc:"A plucky young filly, hooves too small for a proper kick — but there's something about her nopony can say no to. 25% of her hits charm the target outright.",
  },
  engineerpony: {
    id:'engineerpony', name:'Engineer Pony', color:'#5a7a9a', mane:'#e0c25a',
    unlocked:false, unlockHint:'Build 30 turrets',
    redMax:5, speed:150, canFly:false,
    // deliberately the softest ranged attack in the game — Breezie's 1.2/0.38
    // (dps 3.16) and Unicorn's 1.6/0.45 (dps 3.56) are the two weakest ranged
    // classes on the books; her 1.0/0.5 (dps 2.0) sits well under both,
    // because her real damage comes from the turrets she builds, not her own horn
    attackType:'ranged', rangedDamage:1.0, fireCooldown:0.5, boltSpeed:300,
    // canBuildTurrets — hold the build key (see main.js's input.build /
    // combat.js updateTurretBuild) to plant a stationary turret that fights
    // alongside her for the rest of the room
    canBuildTurrets:true,
    startBombs:1, startKeys:0, startCoins:0,
    desc:"A tinkerer with a bandolier of spare parts. Holds no grudge against getting her hooves dirty, but would rather let a turret do the shooting — hold the build key to plant one wherever she's standing.",
  },
};

/* ---------------------------------------------------------------
   ITEM POOLS — which containers an item can turn up in. Items can
   (and mostly do) belong to several pools at once. `POOLS_ALL`
   items show up everywhere, including shops and ordinary chests;
   `POOLS_SPECIAL` items are held back for the rooms that already
   guarantee something good — secret rooms, treasure rooms, and
   boss drops — so finding one of those still feels like a find.
   See room.js's pickItemFromPool().

   POOLS_CRYSTAL / POOLS_SOMBRA are narrower still, and NOT part of
   POOLS_ALL — an item tagged with one of these only ever turns up in
   the two rooms its pool names, nowhere else:
     crystal — Crystal (angel) rooms + secret rooms
     sombra  — Sombra (devil) rooms + curse rooms
   --------------------------------------------------------------- */
const POOLS_ALL = ['secret', 'treasure', 'boss', 'chest', 'shop', 'curse', 'challenge'];
const POOLS_SPECIAL = ['secret', 'treasure', 'boss'];
const POOLS_CRYSTAL = ['crystal', 'secret'];
const POOLS_SOMBRA = ['sombra', 'curse'];
// a shrine item also turns up in shops, nowhere else, since it's not in POOLS_ALL
const POOLS_SHRINE = ['shrine', 'shop'];

/* ---------------------------------------------------------------
   ITEMS — active (charge bar, +1 per room cleared) & passive
   --------------------------------------------------------------- */

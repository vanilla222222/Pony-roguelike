'use strict';
// data/collectibles.js — split from data.js: stars, bomb/key pools, obstacles.
const STAR_TYPES = {
  alcyone: { id:'alcyone', name:'Alcyone', icon:'⭐', color:'#f4d35e', desc:'+3 damage for the rest of this room.' },
  atlas:   { id:'atlas', name:'Atlas', icon:'⭐', color:'#5b9ee3', desc:'+2 blue hearts.' },
  electra: { id:'electra', name:'Electra', icon:'⭐', color:'#7fd66a', desc:'+50% speed for the rest of this room.' },
  maia:    { id:'maia', name:'Maia', icon:'⭐', color:'#e35b6a', desc:'Drops 4 hearts on the ground.' },
  merope:  { id:'merope', name:'Merope', icon:'⭐', color:'#dcdcdc', desc:'Drops 2 keys on the ground.' },
  taygeta: { id:'taygeta', name:'Taygeta', icon:'⭐', color:'#e0895a', desc:'Destroys every destructible object in the room.' },
  pleione: { id:'pleione', name:'Pleione', icon:'⭐', color:'#c9a3ff', desc:'Drops 3 bombs on the ground.' },
  celaeno: { id:'celaeno', name:'Celaeno', icon:'⭐', color:'#b48ce0', desc:'Drops 2 pills on the ground.' },

  // ---- 4 new SUPERBOSS REWARDS (see the matching note in ITEMS above) ----
  antares:  { id:'antares', name:'Antares', icon:'🌟', color:'#c9522e', locked:true, desc:'Deal heavy damage to every enemy in the room — scaled to how deep you are.' },
  polaris:  { id:'polaris', name:'Polaris', icon:'🌟', color:'#9ac9e0', locked:true, desc:'Freeze every enemy in the room.' },
  achernar: { id:'achernar', name:'Achernar', icon:'🌟', color:'#e35b6a', locked:true, desc:'+3 red hearts.' },
  vega:     { id:'vega', name:'Vega', icon:'🌟', color:'#e07a9c', locked:true, desc:'+100% speed for the rest of this room.' },

  /* ---- 25 more stars (gameplay update 3). All start locked and are
     unlocked one-for-one by the 'Stars' achievement category (see
     achievements.js) — NOT by the superboss reward pool, which has a
     load-bearing "one reward per (boss × class)" length assertion.
     Every effect below reuses a mechanism that already existed (see
     stars.js applyStarEffect for the dispatch, and room.js for the
     three reroll helpers). ---- */
  // -- the six requested effects --
  deneb:      { id:'deneb', name:'Deneb', icon:'🔄', color:'#8fd0f0', locked:true, desc:'Rerolls one untaken pedestal in this room into something else.' },
  altair:     { id:'altair', name:'Altair', icon:'♻️', color:'#f09a4a', locked:true, desc:'Rerolls every hazard in this room into a different hazard.' },
  capella:    { id:'capella', name:'Capella', icon:'🎲', color:'#d4b03a', locked:true, desc:'Rerolls every enemy in this room into a fresh set.' },
  bellatrix:  { id:'bellatrix', name:'Bellatrix', icon:'👑', color:'#b03a5a', locked:true, desc:'Promotes every enemy in this room to a champion — double health, double damage, better drops.' },
  arcturus:   { id:'arcturus', name:'Arcturus', icon:'🔶', color:'#f0a030', locked:true, desc:'+5 damage for the rest of this room.' },
  aldebaran:  { id:'aldebaran', name:'Aldebaran', icon:'🛡️', color:'#e06a3a', locked:true, desc:'Blocks the next hit you take.' },
  // -- the Big Dipper --
  merak:      { id:'merak', name:'Merak', icon:'🔋', color:'#7ac0d0', locked:true, desc:'Fully recharges your active item.' },
  alkaid:     { id:'alkaid', name:'Alkaid', icon:'✨', color:'#c0d8f0', locked:true, desc:'Invincible for 10 seconds.' },
  dubhe:      { id:'dubhe', name:'Dubhe', icon:'⚔️', color:'#f0e07a', locked:true, desc:'+8 damage for the rest of this room.' },
  phecda:     { id:'phecda', name:'Phecda', icon:'🧊', color:'#6ad0e0', locked:true, desc:'Freezes every enemy in the room for 8 seconds.' },
  megrez:     { id:'megrez', name:'Megrez', icon:'🪞', color:'#a0b8d0', locked:true, desc:'Blocks the next 3 hits you take.' },
  mizar:      { id:'mizar', name:'Mizar', icon:'💗', color:'#f07a90', locked:true, desc:'Fully restores your red hearts.' },
  // -- Orion's belt and shoulders --
  alnitak:    { id:'alnitak', name:'Alnitak', icon:'🗺️', color:'#8a9ae0', locked:true, desc:"Reveals this floor's entire map, secret rooms included." },
  alnilam:    { id:'alnilam', name:'Alnilam', icon:'😱', color:'#6a6ad0', locked:true, desc:'Terrifies every enemy in the room — they flee for 8 seconds.' },
  mintaka:    { id:'mintaka', name:'Mintaka', icon:'💞', color:'#d06ac0', locked:true, desc:'Charms one enemy into fighting for you for 12 seconds.' },
  saiph:      { id:'saiph', name:'Saiph', icon:'💥', color:'#e0c05a', locked:true, desc:'Blasts every enemy in the room away from you.' },
  rigel:      { id:'rigel', name:'Rigel', icon:'☠️', color:'#9ad0f0', locked:true, desc:'Instantly destroys the weakest enemy in the room.' },
  betelgeuse: { id:'betelgeuse', name:'Betelgeuse', icon:'🪙', color:'#e0703a', locked:true, desc:'Drops 6 coins on the ground.' },
  sirius:     { id:'sirius', name:'Sirius', icon:'🌠', color:'#eaf2ff', locked:true, desc:'Sears every enemy in the room and freezes whatever survives.' },
  // -- the rest of the sky --
  procyon:    { id:'procyon', name:'Procyon', icon:'❤️', color:'#f0d0a0', locked:true, desc:'+1 heart container, permanently.' },
  castor:     { id:'castor', name:'Castor', icon:'✴️', color:'#d0d0f0', locked:true, desc:'Drops 2 more stars on the ground.' },
  pollux:     { id:'pollux', name:'Pollux', icon:'🏛️', color:'#f0b060', locked:true, desc:'Spawns a free item pedestal in this room.' },
  regulus:    { id:'regulus', name:'Regulus', icon:'🎁', color:'#c0a0e0', locked:true, desc:'Spawns a treasure chest in this room.' },
  spica:      { id:'spica', name:'Spica', icon:'🍀', color:'#5ad08a', locked:true, desc:'+1 Luck for the rest of the run.' },
  antlia:     { id:'antlia', name:'Antlia', icon:'🧰', color:'#a0a8b0', locked:true, desc:'+2 keys and +2 bombs.' },

  // room-teleport stars (11, one per special room type) — see stars.js's applyStarEffect for the shared teleport dispatch, achievements.js for the unlock ladders (visit that room type 10x)
  teleport_treasure:  { id:'teleport_treasure', name:'Compass — Treasure', icon:'💰', color:'#f0c85a', locked:true, desc:'Teleport straight to the nearest Treasure Room on this floor.' },
  teleport_shop:      { id:'teleport_shop', name:'Compass — Shop', icon:'🛒', color:'#5ad0a8', locked:true, desc:'Teleport straight to the nearest Shop on this floor.' },
  teleport_secret:    { id:'teleport_secret', name:'Compass — Secret', icon:'🗝️', color:'#b0a890', locked:true, desc:'Teleport straight to the nearest Secret Room on this floor.' },
  teleport_petshop:   { id:'teleport_petshop', name:'Compass — Pet Shop', icon:'🐾', color:'#e0a070', locked:true, desc:'Teleport straight to the nearest Pet Shop on this floor.' },
  teleport_curse:     { id:'teleport_curse', name:'Compass — Curse', icon:'💀', color:'#8a6ad0', locked:true, desc:'Teleport straight to the nearest Curse Room on this floor.' },
  teleport_sacrifice: { id:'teleport_sacrifice', name:'Compass — Sacrifice', icon:'🩸', color:'#c0303a', locked:true, desc:'Teleport straight to the nearest Sacrifice Room on this floor.' },
  teleport_vault:     { id:'teleport_vault', name:'Compass — Vault', icon:'🏦', color:'#c9a13a', locked:true, desc:'Teleport straight to the nearest Vault on this floor.' },
  teleport_challenge: { id:'teleport_challenge', name:'Compass — Challenge', icon:'🏟️', color:'#e07a4a', locked:true, desc:'Teleport straight to the nearest Challenge Room on this floor.' },
  teleport_crystal:   { id:'teleport_crystal', name:'Compass — Crystal', icon:'💎', color:'#7fe0e0', locked:true, desc:'Teleport straight to the nearest Crystal Room on this floor.' },
  teleport_sombra:    { id:'teleport_sombra', name:'Compass — Sombra', icon:'🌑', color:'#5a4a70', locked:true, desc:'Teleport straight to the nearest Sombra Room on this floor.' },
  teleport_star:      { id:'teleport_star', name:'Compass — Star', icon:'🌌', color:'#a0b0f0', locked:true, desc:'Teleport straight to the nearest Star Room on this floor.' },

  /* ================= PHASE 7a — reward-pool backfill ==================
     25 new locked stars. Each one drives a REAL effect in stars.js's
     applyStarEffect dispatch (new `case` bodies, not aliases of existing
     ones), built from primitives that already existed there.
     Adding 7 superbosses took the (superboss x class) achievement grid from
     15 x 25 = 375 to 22 x 25 = 550, and SUPERBOSS_REWARDS (achievements/
     defs-1.js) asserts one unique reward per cell. These are part of the 175
     new rewards that close that gap — deliberately spread across FOUR reward
     kinds (trinkets/items/familiars/stars) rather than one bulk trinket dump.
     ==================================================================== */
  vindemiatrix: { id:'vindemiatrix', name:'Vindemiatrix', icon:'🐍', color:'#6fa83a', locked:true, desc:'Poisons every enemy in the room for 10 seconds.' },
  zubeneschamali: { id:'zubeneschamali', name:'Zubeneschamali', icon:'🥁', color:'#e0c25a', locked:true, desc:'Stuns every enemy in the room for 5 seconds.' },
  gacrux: { id:'gacrux', name:'Gacrux', icon:'🎯', color:'#8fa8e0', locked:true, desc:'Marks every enemy in the room Vulnerable for 12 seconds — they take 50% more damage.' },
  acrux: { id:'acrux', name:'Acrux', icon:'💞', color:'#d06ac0', locked:true, desc:'Charms every enemy in the room into fighting for you for 10 seconds.' },
  shaula: { id:'shaula', name:'Shaula', icon:'🩸', color:'#c93a5a', locked:true, desc:'Halves the current health of every enemy in the room.' },
  sabik: { id:'sabik', name:'Sabik', icon:'💙', color:'#5b9ee3', locked:true, desc:'+4 blue hearts.' },
  nunki: { id:'nunki', name:'Nunki', icon:'🧰', color:'#a0a8b0', locked:true, desc:'Drops 3 keys and 3 bombs on the ground.' },
  ascella: { id:'ascella', name:'Ascella', icon:'🏛️', color:'#f0b060', locked:true, desc:'Spawns two free item pedestals in this room.' },
  kausaustralis: { id:'kausaustralis', name:'Kaus Australis', icon:'💥', color:'#e0c05a', locked:true, desc:'Blasts every enemy away from you and sears them on the way out.' },
  rasalhague: { id:'rasalhague', name:'Rasalhague', icon:'❄️', color:'#9ac9e0', locked:true, desc:'Freezes every enemy solid for 12 seconds.' },
  alphecca: { id:'alphecca', name:'Alphecca', icon:'🍀', color:'#5ad08a', locked:true, desc:'+2 Luck for the rest of the run.' },
  izar: { id:'izar', name:'Izar', icon:'🔭', color:'#7fd6e0', locked:true, desc:'+2 tiles of attack range for the rest of the run.' },
  mirfak: { id:'mirfak', name:'Mirfak', icon:'🛡️', color:'#b8c4d8', locked:true, desc:'Blocks the next 5 hits you take.' },
  algol: { id:'algol', name:'Algol', icon:'☠️', color:'#8a3ae0', locked:true, desc:'Instantly destroys the STRONGEST regular enemy in the room.' },
  almach: { id:'almach', name:'Almach', icon:'💝', color:'#f0a8c9', locked:true, desc:'Fully restores your red hearts AND tops you up with 2 blue ones.' },
  hamal: { id:'hamal', name:'Hamal', icon:'❤️', color:'#f0d0a0', locked:true, desc:'+2 heart containers, permanently.' },
  menkar: { id:'menkar', name:'Menkar', icon:'💣', color:'#c9522e', locked:true, desc:'Drops 5 bombs and blows every destructible object in the room apart.' },
  diphda: { id:'diphda', name:'Diphda', icon:'🪙', color:'#e3c15b', locked:true, desc:'Drops 12 coins on the ground.' },
  markab: { id:'markab', name:'Markab', icon:'💊', color:'#b48ce0', locked:true, desc:'Drops 4 pills on the ground.' },
  scheat: { id:'scheat', name:'Scheat', icon:'✨', color:'#c0d8f0', locked:true, desc:'Invincible for 20 seconds.' },
  algenib: { id:'algenib', name:'Algenib', icon:'♻️', color:'#f09a4a', locked:true, desc:'Rerolls every untaken pedestal in this room, one after another.' },
  enif: { id:'enif', name:'Enif', icon:'🗺️', color:'#8a9ae0', locked:true, desc:'Reveals the whole floor AND drops 2 keys to open what it finds.' },
  sadalsuud: { id:'sadalsuud', name:'Sadalsuud', icon:'🌠', color:'#eaf2ff', locked:true, desc:'Drops 3 more stars on the ground.' },
  zosma: { id:'zosma', name:'Zosma', icon:'👑', color:'#b03a5a', locked:true, desc:'Promotes every enemy to a champion, then marks them all Vulnerable.' },
  alphard: { id:'alphard', name:'Alphard', icon:'🗡️', color:'#c93a5a', locked:true, desc:'+12 damage for the rest of this room, but you drop to 1 red heart.' },

  /* ================= PHASE 8e — skill-tree-unlocked stars ==============
     25 more locked stars, id-prefixed `sk8s_` (this content slice runs in
     parallel with three sibling slices minting trinkets/familiars/items —
     the prefix rules out any id collision between them without either side
     having to coordinate). Unlike every earlier locked batch (achievement-
     or superboss-gated), these are unlocked one-for-one by leaf nodes under
     'unlock_stars_hub' in skilltree-unlocks-stars.js — spending a skill
     point sets unlocks.unlockedStars[id] directly (see skilltree.js's
     applySkillTreeUnlockEffect), the exact same bucket isStarUnlocked reads
     regardless of how it got flipped. Every effect below still reuses a
     mechanism that already existed in stars.js's applyStarEffect — see the
     per-case comments there. ==================================== */
  sk8s_pyrrha:       { id:'sk8s_pyrrha', name:'Pyrrha', icon:'🔥', color:'#e2653a', locked:true, desc:'+4 damage for the rest of this room.' },
  sk8s_borealis:     { id:'sk8s_borealis', name:'Borealis', icon:'💨', color:'#7fd6c9', locked:true, desc:'+60% speed for the rest of this room.' },
  sk8s_thessaly:     { id:'sk8s_thessaly', name:'Thessaly', icon:'❤️', color:'#e35b6a', locked:true, desc:'+2 red hearts.' },
  sk8s_wren:         { id:'sk8s_wren', name:'Wren', icon:'💙', color:'#5b9ee3', locked:true, desc:'+3 blue hearts.' },
  sk8s_gilded:       { id:'sk8s_gilded', name:'Gilded', icon:'💫', color:'#f0d878', locked:true, desc:'Fully restores your red hearts AND your blue hearts.' },
  sk8s_cinder:       { id:'sk8s_cinder', name:'Cinder', icon:'☄️', color:'#d0532e', locked:true, desc:'Deal moderate damage to every enemy in the room — scaled to how deep you are.' },
  sk8s_frostbind:    { id:'sk8s_frostbind', name:'Frostbind', icon:'🧊', color:'#6ad0e0', locked:true, desc:'Freezes every enemy in the room for 6 seconds.' },
  sk8s_thornveil:    { id:'sk8s_thornveil', name:'Thornveil', icon:'🛡️', color:'#7aa86a', locked:true, desc:'Blocks the next 2 hits you take.' },
  sk8s_aegis:        { id:'sk8s_aegis', name:'Aegis', icon:'✨', color:'#c0d8f0', locked:true, desc:'Invincible for 15 seconds.' },
  sk8s_venomkiss:    { id:'sk8s_venomkiss', name:'Venomkiss', icon:'🐍', color:'#6fa83a', locked:true, desc:'Poisons every enemy in the room for 8 seconds.' },
  sk8s_dreadhowl:    { id:'sk8s_dreadhowl', name:'Dreadhowl', icon:'😱', color:'#6a6ad0', locked:true, desc:'Terrifies every enemy in the room — they flee for 6 seconds.' },
  sk8s_puppeteer:    { id:'sk8s_puppeteer', name:'Puppeteer', icon:'🎭', color:'#d06ac0', locked:true, desc:'Charms the strongest enemy in the room into fighting for you for 14 seconds.' },
  sk8s_direstrike:   { id:'sk8s_direstrike', name:'Direstrike', icon:'⚔️', color:'#8a3ae0', locked:true, desc:'Deals damage equal to 75% of the strongest enemy\'s current health.' },
  sk8s_gale:         { id:'sk8s_gale', name:'Gale', icon:'💥', color:'#e0c05a', locked:true, desc:'Blasts every enemy in the room away from you.' },
  sk8s_fortune:      { id:'sk8s_fortune', name:'Fortune', icon:'🍀', color:'#5ad08a', locked:true, desc:'+1 Luck for the rest of the run.' },
  sk8s_farsight:     { id:'sk8s_farsight', name:'Farsight', icon:'🔭', color:'#7fd6e0', locked:true, desc:'+1 tile of attack range for the rest of the run.' },
  sk8s_battery:      { id:'sk8s_battery', name:'Battery', icon:'🔋', color:'#7ac0d0', locked:true, desc:'Fully recharges your active item.' },
  sk8s_cartographer: { id:'sk8s_cartographer', name:'Cartographer', icon:'🗺️', color:'#8a9ae0', locked:true, desc:"Reveals this floor's entire map, secret rooms included." },
  sk8s_demolition:   { id:'sk8s_demolition', name:'Demolition', icon:'💣', color:'#c9522e', locked:true, desc:'Destroys every destructible object in the room.' },
  sk8s_prospector:   { id:'sk8s_prospector', name:'Prospector', icon:'🪙', color:'#e3c15b', locked:true, desc:'Drops 5 coins on the ground.' },
  sk8s_medic:        { id:'sk8s_medic', name:'Medic', icon:'💗', color:'#f07a90', locked:true, desc:'Drops 3 hearts on the ground.' },
  sk8s_quartermaster:{ id:'sk8s_quartermaster', name:'Quartermaster', icon:'🧰', color:'#a0a8b0', locked:true, desc:'Drops 2 keys and 2 bombs on the ground.' },
  sk8s_alchemist:    { id:'sk8s_alchemist', name:'Alchemist', icon:'💊', color:'#b48ce0', locked:true, desc:'Drops 3 pills on the ground.' },
  sk8s_pyroclast:    { id:'sk8s_pyroclast', name:'Pyroclast', icon:'🧨', color:'#e0895a', locked:true, desc:'Drops 4 bombs on the ground.' },
  sk8s_shrine:       { id:'sk8s_shrine', name:'Shrine', icon:'🏛️', color:'#f0b060', locked:true, desc:'Spawns a free item pedestal in this room.' },
};
const STAR_LIST = Object.values(STAR_TYPES);

// whenever a *generic* bomb/key pickup resolves, it's re-rolled against these
// so a plain bomb/key occasionally comes out as something better instead —
// see room.js's rollGenericPickupKind(). Forced/hand-placed pickups (room
// editor) skip this re-roll on purpose, so an author's exact choice sticks.
// doublebomb/goldbomb/doublekey/goldkey start locked — see achievements.js's
// isPickupKindUnlocked() / ACHIEVEMENT_PICKUP_KINDS. Same for sack/battery/
// minibattery (SACK_BATTERY_WEIGHTS in room.js), which aren't pool-based.
const BOMB_TIER_POOL = [
  { id:'bomb', w:90 },
  { id:'doublebomb', w:8, locked:true },
  { id:'goldbomb', w:2, locked:true },
];
const KEY_TIER_POOL = [
  { id:'key', w:90 },
  { id:'doublekey', w:8, locked:true },
  { id:'goldkey', w:2, locked:true },
];

const OBSTACLES = {
  rock:         { id:'rock', name:'Rock', desc:'Bombable rubble. Blocks the ground but flies over it.', destructible:true, color:'#7a746a', dark:'#524d46' },
  hardrock:     { id:'hardrock', name:'Hard Rock', desc:'Permanent, indestructible rubble. Flyable.', destructible:false, color:'#4a4640', dark:'#2c2924' },
  pit:          { id:'pit', name:'Pitfall', desc:'A bottomless gap — blocks the ground, but flyers pass right over it.', isPit:true, color:'#0c0c14', dark:'#000' },
  // tall variants also block flight (regular rock/hardrock/pit can all be flown over)
  tallrock:     { id:'tallrock', name:'Tall Rock', desc:'Bombable rubble tall enough to block flight too.', destructible:true, blocksFlight:true, tall:true, color:'#847e70', dark:'#524d46' },
  tallhardrock: { id:'tallhardrock', name:'Tall Hard Rock', desc:'Permanent rubble tall enough to block flight too.', destructible:false, blocksFlight:true, tall:true, color:'#3d392f', dark:'#232019' },
  // `walkable:true` — the obstacle never blocks movement, enemy pathing,
  // line of sight or projectiles, and tiles it sits on still count as free
  // for pickup drops/enemy spawns (see entities.js's Obstacle.isWalkable,
  // combat.js's collidesAt/tileHasObstacle and ai.js's makeIsBlockedFn).
  // It is INDEPENDENT of `hazard` — a hazard is also non-blocking, but that
  // is a side effect of dealing contact damage, not the same property.
  // hazards: non-solid (walk over freely), damage on contact
  cactus:       { id:'cactus', name:'Cactus', desc:'Non-solid hazard — hurts on contact, otherwise walk right through.', hazard:true, dmg:1, color:'#4f8a3f', dark:'#2c5222' },
  yellowfire:   { id:'yellowfire', name:'Yellow Fire', desc:'Hazard flame — 3 hits douses it, with a small chance to drop a heart.', hazard:true, attackable:true, maxHp:3, dmg:1, heartDropChance:0.10, color:'#f0c23a', dark:'#a86a1a' },
  redfire:      { id:'redfire', name:'Red Fire', desc:'Hazard flame that also spits fireballs — 3 hits douses it.', hazard:true, attackable:true, maxHp:3, dmg:1, heartDropChance:0.10,
                  projectile:true, fireCooldown:10, color:'#e0492f', dark:'#8a2318' },
  // Blue/Purple Fire — same hazard flame that spits bolts, but NOT attackable:
  // melee, bolts and Pony Bot's laser all pass right through them (every hit
  // path gates on ob.attackable before calling damageObstacleHit). Only a
  // bomb blast puts one out, via `destructible` in combat.js's explodeAt.
  bluefire:     { id:'bluefire', name:'Blue Fire', desc:'Hazard flame that spits bolts. Attacks do nothing — only a bomb blast puts it out.', hazard:true, attackable:false, destructible:true, dmg:1, heartDropChance:0.10,
                  projectile:true, fireCooldown:10, boltColor:'#6aa8f0', color:'#4a7fd6', dark:'#254a80' },
  // purple's bolts curve toward the player — see updateProjectiles' homing
  // branch for obstacle-fired bolts (owner 'enemy' + a homing value)
  purplefire:   { id:'purplefire', name:'Purple Fire', desc:'Hazard flame whose bolts curve after you. Attacks do nothing — only a bomb blast puts it out.', hazard:true, attackable:false, destructible:true, dmg:1, heartDropChance:0.10,
                  projectile:true, fireCooldown:20, homing:2, boltColor:'#c98af0', color:'#a34fd6', dark:'#4f2570' },
  // Phase 15 — three more colors, each with its own NEW form of shooting
  // (see combat-4.js's updateObstacles, the shared projectile-firing block
  // every colored fire above already goes through):
  greenfire:    { id:'greenfire', name:'Green Fire', desc:'Hazard flame that fires a 3-bolt fan instead of a single shot — 3 hits douses it.',
                  hazard:true, attackable:true, maxHp:3, dmg:1, heartDropChance:0.10,
                  projectile:true, fireCooldown:10, spreadShots:3, spreadAngle:0.5, boltColor:'#6ad65a', color:'#3a9a3a', dark:'#1c5c1c' },
  // explosiveBolt — the bolt itself is ordinary (same range-gated aim as
  // redfire), but detonates a small blast the instant it dies (reuses
  // combat-3.js's detonateExplosiveProjectile, the exact same plumbing an
  // Explosive Tear rides — the first time an OBSTACLE has used it rather
  // than a player/familiar bolt). Not attackable, same "only a bomb puts it
  // out" shape as blue/purple/black fire below.
  whitefire:    { id:'whitefire', name:'White Fire', desc:'Hazard flame whose bolt detonates into a small blast when it burns out. Attacks do nothing — only a bomb blast puts it out.',
                  hazard:true, attackable:false, destructible:true, dmg:1, heartDropChance:0.10,
                  projectile:true, fireCooldown:14, explosiveBolt:true, boltColor:'#f0ece0', color:'#d8d0b8', dark:'#8a8268' },
  // spin — never aims at all, just leaks one bolt per tick off a steadily
  // rotating angle (own ob.spinAngle field, only ever touched here). No
  // range gate either — unlike redfire it threatens the whole room, not
  // just close range, which is why its cooldown is much faster than a
  // targeting/directional turret's but each individual bolt is cheap.
  blackfire:    { id:'blackfire', name:'Black Fire', desc:'Hazard flame that never aims — it just spins, leaking one bolt per tick around a full circle. Attacks do nothing — only a bomb blast puts it out.',
                  hazard:true, attackable:false, destructible:true, dmg:1, heartDropChance:0.10,
                  projectile:true, fireCooldown:0.4, spin:true, boltColor:'#8a3ac9', color:'#3a1c52', dark:'#160a24' },
  // sacrifice rooms only — a fixed, indestructible hazard at room center,
  // deals a full heart on contact (see combat.js's updateObstacles); see
  // combat.js's triggerSacrificeSpike for its per-step reward table
  spike:        { id:'spike', name:'Sacrifice Spike', desc:'Sacrifice Room centerpiece — a full heart per hit, but pays out rewards as you feed it.', hazard:true, sacrifice:true, color:'#c9c2b0', dark:'#5c574a' },
  // a plain version of the sacrifice spike — same look, ordinary hazard
  // damage, no per-step rewards. Placeable anywhere via the room editor.
  spiketrap:    { id:'spiketrap', name:'Spike Trap', desc:'A plain hazard spike — hurts twice as much as a cactus, no reward.', hazard:true, dmg:2, color:'#c9c2b0', dark:'#5c574a' },
  // solid AND a hazard — blocks movement like a rock, but still hurts on
  // contact (see combat.js's collidesAt/updateObstacles). Bombable, like rock.
  spikedrock:   { id:'spikedrock', name:'Spiked Rock', desc:'Solid AND a hazard — blocks the ground and hurts on contact. Bombable.', hazard:true, dmg:2, solid:true, destructible:true, color:'#8a7d70', dark:'#4a4038' },
  // a rock reskin, otherwise identical — see room.js's rollRockKind() for
  // where the 2%-of-rocks substitution happens, and combat.js's bomb-blast
  // obstacle handling for its reward table when destroyed
  tintedrock:   { id:'tintedrock', name:'Tinted Rock', desc:'A rare rock reskin — a much better reward table when bombed.', destructible:true, color:'#9a7dc9', dark:'#5c3d8a' },
  // Whitetail Forest (stage 1, floors 2-3, main path only — see
  // dungeon.js's obstacleAllowedOnFloor) thorny hazard — same "attacks do
  // nothing, only a bomb blast clears it" shape as blue/purple fire above,
  // just without a projectile. Non-solid: walk right through it, just take
  // the hit.
  thornbush:    { id:'thornbush', name:'Thorn Bush', desc:'Hazard bramble — hurts on contact. Attacks do nothing, only a bomb blast clears it.', hazard:true, attackable:false, destructible:true, dmg:1, heartDropChance:0.10, color:'#3a6b2e', dark:'#1c3a16' },
  // usable on any floor (no obstacleAllowedOnFloor gate) — a rock-shaped
  // reward fixture, not a themed hazard. Same "reward table on bomb
  // destruction" mechanism as tintedrock (see combat.js's explodeAt/
  // destroyAllObstacles), just branching to a small luck-flavored bonus
  // instead of tintedrock's better bomb-reward table.
  luckcrystal:  { id:'luckcrystal', name:'Luck Crystal', desc:'A crystalline rock formation — a small luck-flavored bonus when bombed.', destructible:true, color:'#7fe0a0', dark:'#3a8a5c' },
  // patrols the perimeter of whatever wall/rock-patch it starts beside —
  // see combat.js's updateMovingSpike. Ordinary hazard damage, no rewards.
  movingspike:  { id:'movingspike', name:'Moving Spike', desc:'Patrols the perimeter of the wall or rock patch it starts beside.', hazard:true, dmg:2, moving:true, color:'#c96a5a', dark:'#6a2e24' },
  // walkable, NOT a hazard — freezes the player briefly on contact instead
  // of dealing any damage, see combat.js's updateObstacles/updatePlayer
  // (freezeTimer), which drives the freeze off `freeze`, not off `hazard`
  sandtrap:     { id:'sandtrap', name:'Sand Trap', desc:'Freezes you in place briefly on contact — no damage.', freeze:true, freezeDuration:0.5, walkable:true, color:'#d9c47a', dark:'#a8894a' },
  // walkable and non-hazard — just halves the player's speed for as long
  // as they're standing on it, checked fresh every frame (no lingering
  // timer) so it ends the instant they step off, see combat.js's updatePlayer
  mud:          { id:'mud', name:'Mud', desc:'Halves your speed while you stand on it — otherwise harmless.', walkable:true, color:'#5c4a2e', dark:'#3a2e1c' },

  // ---- CURRENTS — "new stuff" pass. Walkable, non-hazard, no damage; while
  // the player overlaps one, a constant push is added to their movement in
  // `pushX`/`pushY`'s direction (see combat.js's updatePlayer). C-branch
  // exclusive — see dungeon.js's obstacleAllowedOnFloor, which refuses to
  // let any room template carrying one of these 4 kinds generate outside
  // floorPath 'C', independent of whatever floor filter the template has. ----
  currentn:     { id:'currentn', name:'Current — North', desc:'A rushing current — pushes you north while you stand in it.', walkable:true, current:true, pushX:0, pushY:-1, color:'#4fa8d6', dark:'#25597a' },
  currents:     { id:'currents', name:'Current — South', desc:'A rushing current — pushes you south while you stand in it.', walkable:true, current:true, pushX:0, pushY:1, color:'#4fa8d6', dark:'#25597a' },
  currente:     { id:'currente', name:'Current — East', desc:'A rushing current — pushes you east while you stand in it.', walkable:true, current:true, pushX:1, pushY:0, color:'#4fa8d6', dark:'#25597a' },
  currentw:     { id:'currentw', name:'Current — West', desc:'A rushing current — pushes you west while you stand in it.', walkable:true, current:true, pushX:-1, pushY:0, color:'#4fa8d6', dark:'#25597a' },

  // ---- Phase 10 PLACEHOLDER — proves the obstacle pipeline can host a new
  // directional-capable kind for the 'floorfeature' rooms (dungeon.js) without
  // any of the per-stage mechanics existing yet. Deliberately inert: walkable,
  // no `current`/`projectile`/`hazard`/`destructible` flag, so every system
  // that dispatches on those (combat-1.js's updatePlayer push, updateObstacles,
  // damageObstacleHit) skips it entirely and it renders as a plain floor
  // decal. `pushX/pushY` are carried at 0 purely to document the shape the
  // real stage objects will fill in. Not referenced by any room template — the
  // one floorfeature template is empty — so it cannot appear in game yet. ----
  floorswitch:  { id:'floorswitch', name:'???', desc:'Placeholder — the stage-specific special objects land in a future content phase.', walkable:true, pushX:0, pushY:0, color:'#6a6a7a', dark:'#3a3a46' },

  /* ---- Phase 10 CONTENT GROUP 1 — the per-stage floorfeature objects for
     the Frozen Desert / Badlands / Beach (floorNum 15-20). All additive:
     every one is built out of a mechanism that already exists, so no
     engine file had to change to support them.

     - ICE SLIDE (x4 facings) reuses the `current` push exactly as the
       C-branch current tiles do (combat-1.js's updatePlayer adds
       pushX/pushY * CURRENT_PUSH_SPEED while the player overlaps one).
       This is the "up to four directional variants" allowance the
       coordination doc grants, spent on ONE object that genuinely needs
       four facings. Push magnitude is 1.25 rather than 1 — pushX/pushY
       are multipliers, not flags — so a slide reads as noticeably
       stronger than a sewer current.
     - QUICKSAND / TIDE POOL reuse the Sand Trap's `freeze` mechanism
       (combat-4.js's updateObstacles, `isFreezeTrap`): walkable, zero
       damage, just a brief loss of control. Quicksand holds longer than
       a Sand Trap; a tide pool is a shorter, nastier tap.
     - DUST VENT reuses the fixed-angle turret pipeline (`projectile` +
       `angles`, combat-4.js) but is walkable, so unlike a real turret it
       never blocks the room — you walk through the grit and eat it.
     - TIDE SURGE (x2 facings) is a stronger, horizontal-only current
       used to build rip channels; two facings, not four, because a
       channel only ever needs east/west.

     None of these are floor-gated in dungeon.js's obstacleAllowedOnFloor
     (which defaults to `true`), so their ONLY gate is the `f:[...]` floor
     filter on the templates that place them — see
     roomTemplates/stage4-6-floorfeature.js, the sole consumer. ---- */
  iceslidan:    { id:'iceslidan', name:'Ice Slide — North', desc:'Polished glacier glass. Skates you north for as long as you are standing on it.', walkable:true, current:true, pushX:0, pushY:-1.25, color:'#bfe4f7', dark:'#4a7a92' },
  iceslidas:    { id:'iceslidas', name:'Ice Slide — South', desc:'Polished glacier glass. Skates you south for as long as you are standing on it.', walkable:true, current:true, pushX:0, pushY:1.25, color:'#bfe4f7', dark:'#4a7a92' },
  iceslidae:    { id:'iceslidae', name:'Ice Slide — East', desc:'Polished glacier glass. Skates you east for as long as you are standing on it.', walkable:true, current:true, pushX:1.25, pushY:0, color:'#bfe4f7', dark:'#4a7a92' },
  iceslidaw:    { id:'iceslidaw', name:'Ice Slide — West', desc:'Polished glacier glass. Skates you west for as long as you are standing on it.', walkable:true, current:true, pushX:-1.25, pushY:0, color:'#bfe4f7', dark:'#4a7a92' },
  quicksand:    { id:'quicksand', name:'Quicksand', desc:'Badlands sink-sand — grabs and holds you for a moment. No damage, but you are not going anywhere while it has you.', freeze:true, freezeDuration:0.85, walkable:true, color:'#c2a663', dark:'#6e5a2c' },
  dustvent:     { id:'dustvent', name:'Dust Vent', desc:'A canyon fissure venting grit on all four diagonals. Walk straight through it if you like — the grit still lands.', projectile:true, fireCooldown:1.8, dmg:1, angles:[Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4, -Math.PI / 4], boltColor:'#e0c089', walkable:true, color:'#b09060', dark:'#5e4a28' },
  tidesurgee:   { id:'tidesurgee', name:'Tide Surge — East', desc:'A rip channel running east. Far stronger than a sewer current — crossing it costs you ground.', walkable:true, current:true, pushX:1.6, pushY:0, color:'#4fc8e0', dark:'#1e6c80' },
  tidesurgew:   { id:'tidesurgew', name:'Tide Surge — West', desc:'A rip channel running west. Far stronger than a sewer current — crossing it costs you ground.', walkable:true, current:true, pushX:-1.6, pushY:0, color:'#4fc8e0', dark:'#1e6c80' },
  tidepool:     { id:'tidepool', name:'Tide Pool', desc:'Ankle-deep undertow. Grabs briefly on contact — shorter than quicksand, and always somewhere you needed to keep moving.', freeze:true, freezeDuration:0.45, walkable:true, color:'#6fd0e0', dark:'#2c6470' },

  /* ---- Phase 10 CONTENT GROUP 2 — the per-stage floorfeature objects for
     the Ocean / The Sea Floor / Trench (floorNum 21-26). Same rule Group 1
     followed: every one is built out of a mechanism that already exists,
     so no engine file changed to support them.

     - RIPTIDE (x4 facings) is the `current` push again (combat-1.js's
       updatePlayer, pushX/pushY * CURRENT_PUSH_SPEED while the player
       overlaps). This is the coordination doc's "up to four directional
       variants" allowance, spent on ONE object that needs four facings —
       the Ocean's identity is a rotating body of water, which cannot be
       built from two. Push is 1.9, the strongest in the game: stronger
       than a Beach tide surge (1.6), which is stronger than an ice slide
       (1.25), which is stronger than a sewer current (1.0). That ordering
       is deliberate and matches the stage ordering.
       These CANNOT reuse the existing currentn/s/e/w kinds: dungeon.js's
       obstacleAllowedOnFloor hard-gates those four to floorPath 'C', and
       dungeon.js is outside this group's file ownership. New kinds fall
       through to that function's default `true` instead.
     - GLOW BLOOM is the Sea Floor's bioluminescent hazard, on the
       thornbush mechanism (`hazard` + `attackable:false` +
       `destructible`): non-solid, so you can walk through it and simply
       take the hit, and immune to attacks — only a bomb blast clears a
       patch. Lights the silt and denies the ground under it.
     - PRESSURE COLUMN is the Trench's crushing-pressure object, on the
       spikedrock mechanism (`hazard` + `solid` + `destructible`): it
       blocks like a rock AND hurts on contact, which is what turns a
       Trench feature room into a genuine corridor — every wall of the
       maze is also a damage source, so brushing one while dodging costs
       you.

     None are floor-gated in obstacleAllowedOnFloor, so their only gate is
     the `f:[...]` filter on the templates that place them — see
     roomTemplates/stage7-9-floorfeature.js, their sole consumer. ---- */
  riptiden:      { id:'riptiden', name:'Riptide — North', desc:'Open-ocean riptide running north. The strongest water in the game — you do not cross this one, you go with it.', walkable:true, current:true, pushX:0, pushY:-1.9, color:'#3d9ad6', dark:'#154a70' },
  riptides:      { id:'riptides', name:'Riptide — South', desc:'Open-ocean riptide running south. The strongest water in the game — you do not cross this one, you go with it.', walkable:true, current:true, pushX:0, pushY:1.9, color:'#3d9ad6', dark:'#154a70' },
  riptidee:      { id:'riptidee', name:'Riptide — East', desc:'Open-ocean riptide running east. The strongest water in the game — you do not cross this one, you go with it.', walkable:true, current:true, pushX:1.9, pushY:0, color:'#3d9ad6', dark:'#154a70' },
  riptidew:      { id:'riptidew', name:'Riptide — West', desc:'Open-ocean riptide running west. The strongest water in the game — you do not cross this one, you go with it.', walkable:true, current:true, pushX:-1.9, pushY:0, color:'#3d9ad6', dark:'#154a70' },
  glowbloom:     { id:'glowbloom', name:'Glow Bloom', desc:'A bed of bioluminescent polyps. Walk through it and it burns — attacks do nothing to it, only a bomb blast clears a patch.', hazard:true, attackable:false, destructible:true, dmg:2, heartDropChance:0.08, color:'#7ae0c0', dark:'#1e5a48' },
  pressurecolumn:{ id:'pressurecolumn', name:'Pressure Column', desc:'A standing column of compressed trench water. Solid as rock and it crushes on contact — every wall down here is also a wound. Bombable.', hazard:true, solid:true, destructible:true, dmg:2, color:'#2a4a62', dark:'#101f2c' },

  /* ---- Phase 10 CONTENT GROUP 3 — the per-stage floorfeature objects for
     the Trench Depths / Deep Dark / Meta Realm / Hyperspace (floorNum
     27-34), the four deepest stages in the game. Same rule Groups 1 and 2
     followed: every one is assembled out of a mechanism that already
     exists, so no engine file changed to support them.

     - CRUSH VENT (Trench Depths) is the fixed-angle turret pipeline
       (`projectile` + `angles`, combat-4.js's updateObstacles) taken to
       eight directions at once, on a solid indestructible body. It is the
       escalation of Group 2's Pressure Column: that one hurt you for
       touching it, this one does not need you to touch it at all. The
       chimney silhouette comes free — with no `current`/hazard/kind-
       specific art branch it falls to Util.drawObstacle's rock body,
       which is exactly what a black smoker looks like.
     - LURE HORN (Deep Dark) is the targeting turret plus purplefire's
       `homing`, on a very long cooldown: one slow bolt that curves after
       you, from something in the dark you cannot see coming. Solid and
       indestructible, so it is also cover — cover that is hunting you.
     - PHANTOM WALL (Meta Realm) is the reality break, and it is pure
       data: `walkable:true` on a body that carries tallhardrock's exact
       colours and `tall` flag, so it renders as a wall (there is no
       kind-specific art branch, and the rock branch keys off `ob.tall`)
       and behaves as open floor for movement, pathing, line of sight and
       projectiles. The room lies about its own geometry; some of the
       maze is not there. Note it is walkable for ENEMIES too (ai-1.js's
       makeIsBlockedFn skips `isWalkable`), which is the point.
     - WARP STREAM (x4 facings) is the `current` push at 2.4, the
       strongest in the game and deliberately the top of the established
       ordering: sewer current 1.0 < ice slide 1.25 < tide surge 1.6 <
       riptide 1.9 < warp stream 2.4. This is the coordination doc's "up
       to four directional variants" allowance, spent on the one object
       that needs four facings — a fold in space has to be able to run in
       any direction or Hyperspace's feature rooms cannot be built.
       It cannot reuse currentn/s/e/w for the reason Group 2 gives above:
       dungeon.js's obstacleAllowedOnFloor hard-gates those four to
       floorPath 'C'.

     None of these are floor-gated in obstacleAllowedOnFloor (which
     defaults to `true`), so their ONLY gate is the `f:[...]` floor filter
     on the templates that place them — see
     roomTemplates/stage10-13-floorfeature.js, their sole consumer. ---- */
  crushvent:    { id:'crushvent', name:'Crush Vent', desc:'A black smoker venting on all eight bearings. It does not need you to touch it — standing anywhere near it is the mistake.', projectile:true, fireCooldown:2.2, dmg:2, angles:[0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, -3 * Math.PI / 4, -Math.PI / 2, -Math.PI / 4], boltColor:'#3f7fc0', destructible:false, color:'#1c3c5c', dark:'#0a1826' },
  lurehorn:     { id:'lurehorn', name:'Lure Horn', desc:'Something in the dark is aiming this. One slow bolt every few seconds, and it curves after you the whole way.', projectile:true, fireCooldown:4.5, dmg:2, targeting:true, homing:2.2, boltColor:'#8aa0b8', destructible:false, color:'#1a1c24', dark:'#0a0b0f' },
  phantomwall:  { id:'phantomwall', name:'Phantom Wall', desc:'Indistinguishable from solid rock, and not there. Walk through it — everything else in the room can too.', walkable:true, tall:true, color:'#3d392f', dark:'#232019' },
  warpstreamn:  { id:'warpstreamn', name:'Warp Stream — North', desc:'A fold in space running north. Nothing in the game pulls harder — you do not walk across this, you arrive on the far side of it.', walkable:true, current:true, pushX:0, pushY:-2.4, color:'#ff4fd8', dark:'#6a1c5a' },
  warpstreams:  { id:'warpstreams', name:'Warp Stream — South', desc:'A fold in space running south. Nothing in the game pulls harder — you do not walk across this, you arrive on the far side of it.', walkable:true, current:true, pushX:0, pushY:2.4, color:'#ff4fd8', dark:'#6a1c5a' },
  warpstreame:  { id:'warpstreame', name:'Warp Stream — East', desc:'A fold in space running east. Nothing in the game pulls harder — you do not walk across this, you arrive on the far side of it.', walkable:true, current:true, pushX:2.4, pushY:0, color:'#ff4fd8', dark:'#6a1c5a' },
  warpstreamw:  { id:'warpstreamw', name:'Warp Stream — West', desc:'A fold in space running west. Nothing in the game pulls harder — you do not walk across this, you arrive on the far side of it.', walkable:true, current:true, pushX:-2.4, pushY:0, color:'#ff4fd8', dark:'#6a1c5a' },

  // ---- TURRETS — solid (non-hazard, so they block movement like a rock),
  // bomb-destructible but NOT attackable (melee/ranged bounce off — a bomb
  // is the only way to take one down). All fire every second at infinite
  // range — see combat.js's updateObstacles for how `angles` vs `targeting`
  // decide the firing pattern, and bumpStat('turretsDestroyed', ...) in
  // combat.js's explodeAt (see achievements.js's turretwrecker/turretdemolisher). ----
  turretn:      { id:'turretn', name:'Turret — North', desc:'Fires straight up every second, infinite range. Only a bomb takes it down.', projectile:true, fireCooldown:2.0, dmg:1, angles:[-Math.PI / 2], boltColor:'#9ac9e0', color:'#5a5548', dark:'#332f28', destructible:true },
  turrete:      { id:'turrete', name:'Turret — East', desc:'Fires right every second, infinite range. Only a bomb takes it down.', projectile:true, fireCooldown:2.0, dmg:1, angles:[0], boltColor:'#9ac9e0', color:'#5a5548', dark:'#332f28', destructible:true },
  turrets:      { id:'turrets', name:'Turret — South', desc:'Fires straight down every second, infinite range. Only a bomb takes it down.', projectile:true, fireCooldown:2.0, dmg:1, angles:[Math.PI / 2], boltColor:'#9ac9e0', color:'#5a5548', dark:'#332f28', destructible:true },
  turretw:      { id:'turretw', name:'Turret — West', desc:'Fires left every second, infinite range. Only a bomb takes it down.', projectile:true, fireCooldown:2.0, dmg:1, angles:[Math.PI], boltColor:'#9ac9e0', color:'#5a5548', dark:'#332f28', destructible:true },
  // '+' — fires N/E/S/W simultaneously
  turretplus:   { id:'turretplus', name:'Turret — Plus', desc:'Fires N/E/S/W simultaneously every second. Only a bomb takes it down.', projectile:true, fireCooldown:2.0, dmg:1, angles:[0, Math.PI / 2, Math.PI, -Math.PI / 2], boltColor:'#9ac9e0', color:'#6a5548', dark:'#3a2f28', destructible:true },
  // 'x' — fires the 4 diagonals simultaneously
  turretx:      { id:'turretx', name:'Turret — X', desc:'Fires all 4 diagonals simultaneously every second. Only a bomb takes it down.', projectile:true, fireCooldown:2.0, dmg:1, angles:[Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4, -Math.PI / 4], boltColor:'#9ac9e0', color:'#6a5548', dark:'#3a2f28', destructible:true },
  // aims at wherever the player currently is, every shot
  turrettarget: { id:'turrettarget', name:'Turret — Targeting', desc:'Aims straight at you every shot, once a second. Only a bomb takes it down.', projectile:true, fireCooldown:1.0, dmg:1, targeting:true, boltColor:'#e35b6a', color:'#7a4548', dark:'#4a2528', destructible:true },

  // ---- BOMB BARRELS — not a hazard, blocks movement like a rock. Not
  // destructible by touch/melee; only 3 ranged/attackable hits (or getting
  // caught in another explosion) destroys it, and doing so detonates it —
  // see combat.js's damageObstacleHit/explodeAt. Chains into anything else
  // caught in the blast, including another barrel.
  bombbarrel:         { id:'bombbarrel', name:'Bomb Barrel', desc:'Blocks the ground. 3 ranged hits (or a nearby blast) destroys and detonates it.', attackable:true, maxHp:3, explodesOnDestroy:true, color:'#3a3a3a', dark:'#1c1c1c' },
  // same as bombbarrel, but pushable — walking into it shoves it one step
  // in your movement direction if the tile beyond is clear; see combat.js's
  // tryPushObstacles
  pushablebombbarrel: { id:'pushablebombbarrel', name:'Pushable Bomb Barrel', desc:'Same as a Bomb Barrel, but you can shove it around by walking into it.', attackable:true, maxHp:3, explodesOnDestroy:true, pushable:true, color:'#4a3a2a', dark:'#241c14' },
};

// base shop prices, before the % discounts (Merchant's Ring/Pocket Ledger)
// and the donation machine's permanent -1c-per-kind unlocks — see shop.js's
// shopPrice(), which is what room.js's addShopSlot actually prices against.
// VERIFIED against the coins-per-floor derivation written out next to
// SHOP_BASE_PRICES in shop.js (~24c on Floor 1 rising to ~60c on Floor 10,
// ~420c for a whole run) and left as they stand: at these three prices the
// average shop slot costs ~11c and a Floor 1 shop takes about two of its
// 3-4 slots, which is the ratio that derivation was aiming for.

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

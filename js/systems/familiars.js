'use strict';
/* ============================================================
   familiars.js — persistent companion update logic. See
   entities.js's Familiar class and data.js's FAMILIAR_TYPES for
   the behaviors: orbiter (contact damage), shooter (fires its own
   bolts), proc (periodic passive benefit), plus the expand-everything
   batch — blocker, thief, grower, detonator, mirror, scavenger,
   berserker, swarmer. Any behavior needing per-instance state
   lazy-inits it inside its own update function (entities.js's
   Familiar constructor is deliberately left alone).
   ============================================================ */

/* ---------------------------------------------------------------
   DEPTH SCALING — the same problem enemies.js's explosionDamage()
   solves, for the same reason. FAMILIAR_TYPES' `dmg:` values are
   IDENTITY numbers (a 3 hits harder than a 1, at every depth), and
   enemy HP now COMPOUNDS with the floor (~1.32^floor, see
   ENEMY_HP_GROWTH). A familiar authored at 2 damage was a real
   contribution on Floor 1 and literally 3% of one on Floor 10 — it
   stopped being an item halfway through every run.

   Deliberately a MUCH gentler curve than either enemy HP (1.32) or
   bombs/poison (BOSS_HP_GROWTH, 1.28): a familiar is free, untargeted,
   always-on DPS that the player does not aim, so it should stay a
   supporting contribution rather than converge on the player's own
   output. At 1.15 a familiar ends a 10-floor run ~3.5x its Floor 1
   self while trash ends it ~15x — so it goes from "kills a Grave Grub
   in a second" to "chips in", never to "clears the room for you".
   --------------------------------------------------------------- */
const FAMILIAR_DMG_GROWTH = 1.15;
function familiarDamage(baseDmg, floorNum){
  return Math.max(1, Math.round((baseDmg || 1) * Math.pow(FAMILIAR_DMG_GROWTH, floorNum || 0)));
}

// Familiar attack/proc-timer multiplier — factored out of the repeated
// `player.trinketId === 'swarmcollar' ? 0.85 : 1` ternary below so
// sk8t_stormcollar (Phase 8e slice 2 — see data/trinkets-2.js) can fold in
// at every one of the same call sites without duplicating them again.
function familiarRateMult(player){
  if (player.trinketId === 'swarmcollar') return 0.85;
  if (player.trinketId === 'sk8t_stormcollar') return 0.88; // 12% more often
  return 1;
}

function updateFamiliars(game, dt){
  for (const f of game.player.familiars) {
    if (f.def.behavior === 'orbiter') updateOrbiterFamiliar(game, f, dt);
    else if (f.def.behavior === 'shooter') updateShooterFamiliar(game, f, dt);
    else if (f.def.behavior === 'proc') updateProcFamiliar(game, f, dt);
    else if (f.def.behavior === 'blocker') updateBlockerFamiliar(game, f, dt);
    else if (f.def.behavior === 'thief') updateThiefFamiliar(game, f, dt);
    else if (f.def.behavior === 'grower') updateGrowerFamiliar(game, f, dt);
    else if (f.def.behavior === 'detonator') updateDetonatorFamiliar(game, f, dt);
    else if (f.def.behavior === 'mirror') updateMirrorFamiliar(game, f, dt);
    else if (f.def.behavior === 'scavenger') updateScavengerFamiliar(game, f, dt);
    else if (f.def.behavior === 'berserker') updateBerserkerFamiliar(game, f, dt);
    else if (f.def.behavior === 'swarmer') updateSwarmerFamiliar(game, f, dt);
  }
}

function updateOrbiterFamiliar(game, f, dt){
  const player = game.player, node = game.currentRoom, def = f.def;
  // Phase 16 — Wasp Whistle's temporary damage buff (items-2.js's
  // useActiveEffect, 'waspwhistle' case). f.buffMult defaults undefined on
  // every familiar that isn't currently buffed, so `* (f.buffMult || 1)`
  // below is a no-op for every familiar in the game except one a Wasp
  // Whistle has actually touched.
  if (f.buffTimer > 0) { f.buffTimer -= dt; if (f.buffTimer <= 0) f.buffMult = 1; }
  f.angle += def.orbitSpeed * dt;
  f.x = player.x + Math.cos(f.angle) * def.radius;
  f.y = player.y + Math.sin(f.angle) * def.radius;
  if (f.contactCooldown > 0) { f.contactCooldown -= dt; return; }
  for (const e of node.enemies) {
    if (e.isDead) continue;
    if (Util.circleIntersect(f.x, f.y, 9, e.x, e.y, e.radius)) {
      const dmg = familiarDamage((def.dmg + (player.trinketId === 'houndwhistle' ? 1 : 0)) * (f.buffMult || 1), game.dungeon.floorNum);
      const applied = e.takeDamage(dmg, (e.x - f.x) * 0.04, (e.y - f.y) * 0.04);
      if (applied) {
        Sound.play('enemyHit');
        game.floatTexts.push(new FloatText(e.x, e.y - 20, String(dmg), '#fff'));
        if (def.freezeChance && Math.random() < def.freezeChance && !e.isBoss) { e.freezeTimer = Math.max(e.freezeTimer, 1.2); bumpStat('enemiesFrozen', 1, game); }
        if (e.isDead) handleEnemyDeath(game, e);
      }
      f.contactCooldown = def.contactCooldown * familiarRateMult(player);
      break;
    }
  }
}

function updateShooterFamiliar(game, f, dt){
  const player = game.player, node = game.currentRoom, def = f.def;
  // Phase 16 — see updateOrbiterFamiliar's matching comment above.
  if (f.buffTimer > 0) { f.buffTimer -= dt; if (f.buffTimer <= 0) f.buffMult = 1; }
  // Drifts in a slow loose orbit so multiple shooters spread out instead of
  // stacking. REVIEWED AND LEFT ALONE during the rebalance: the 0.6rad/s
  // drift and the 30px hover radius are pure presentation — a shooter fires
  // from wherever it happens to be, so neither number touches its damage,
  // its rate, or what it can reach. The actual anti-stacking is the per-
  // familiar starting angle (index * 1.7, see entities.js's Familiar), and
  // 30px keeps the flock inside the player's own silhouette rather than
  // widening the hitbox-looking cluster the player has to read.
  f.angle += 0.6 * dt;
  const homeX = player.x + Math.cos(f.angle) * 30, homeY = player.y + Math.sin(f.angle) * 30 - 10;
  f.x += (homeX - f.x) * Math.min(1, dt * 4);
  f.y += (homeY - f.y) * Math.min(1, dt * 4);
  f.fireTimer -= dt;
  if (f.fireTimer > 0) return;
  let nearest = null, nearestD = Infinity;
  for (const e of node.enemies) {
    if (e.isDead) continue;
    const d = Util.dist2(f.x, f.y, e.x, e.y);
    if (d < nearestD) { nearestD = d; nearest = e; }
  }
  // Acquisition range, CUT from 420px. A ranged class's own base reach is 7
  // tiles = 224px (see entities.js's baseRangeTiles) and a melee class's is
  // 32px, so at 420 a free familiar out-ranged the player it belongs to by
  // ~2x and picked off enemies from most of the way across a room (rooms run
  // ~480-640px wide) that the player could not answer at all. 300px sits
  // just past a ranged player's own reach: the familiar still covers the
  // approach the player is walking into, without playing the room for them.
  if (!nearest || nearestD > 300 * 300) { f.fireTimer = 0.3; return; }
  // Hound Whistle / Swarm Collar (expand-everything trinket batch, see
  // data.js) — the only two trinkets that touch familiars at all. Both are
  // no-ops (+0 damage, x1 cooldown) for every other trinket, and the base
  // dmg still routes through familiarDamage's depth curve either way.
  f.fireTimer = def.cooldown * familiarRateMult(player);
  const ang = Math.atan2(nearest.y - f.y, nearest.x - f.x);
  game.projectiles.push(new Projectile(
    f.x, f.y, Math.cos(ang) * def.boltSpeed, Math.sin(ang) * def.boltSpeed,
    familiarDamage((def.dmg + (player.trinketId === 'houndwhistle' ? 1 : 0)) * (f.buffMult || 1), game.dungeon.floorNum), 'familiar',
    { color: def.color, radius: 4 }
  ));
}

function updateProcFamiliar(game, f, dt){
  const player = game.player, def = f.def;
  const homeX = player.x - 26, homeY = player.y - 30 - f.index * 4;
  f.x += (homeX - f.x) * Math.min(1, dt * 3);
  f.y += (homeY - f.y) * Math.min(1, dt * 3);
  f.procTimer -= dt;
  if (f.procTimer > 0) return;
  f.procTimer = def.interval;
  switch (def.procType) {
    case 'heal':
      if (player.redCurrent < player.redMax) {
        player.heal(def.amount);
        game.floatTexts.push(new FloatText(player.x, player.y - 30, '+heart', '#e35b6a'));
        Sound.play('heart');
      }
      break;
    case 'coin': {
      const spot = findClearFloorSpot(game.currentRoom, Math.floor(player.x / TILE), Math.floor(player.y / TILE));
      game.currentRoom.pickups.push(new Pickup('coin', spot.x, spot.y, Util.weighted(COIN_TYPES)));
      break;
    }
    case 'luckpulse':
      player.luckyPennies += def.amount;
      recalcPlayerStats(player);
      game.floatTexts.push(new FloatText(player.x, player.y - 30, '+' + def.amount + ' Luck', '#7fd66a'));
      Sound.play('itemGet');
      break;
    case 'charge':
      if (player.activeItem && player.activeCharge < player.activeItem.maxCharge) {
        player.activeCharge = Math.min(player.activeItem.maxCharge, player.activeCharge + def.amount);
        game.floatTexts.push(new FloatText(player.x, player.y - 30, '+charge', '#7fd6c9'));
        Sound.play('battery');
      }
      break;
  }
}

/* ---------------------------------------------------------------
   BATCH: eight more behaviors. Each one only ever touches the player,
   game.currentRoom's enemies/pickups, game.projectiles and its own
   familiar instance — no other file's update loop knows they exist.
   --------------------------------------------------------------- */

// blocker — hovers like a proc familiar and periodically tops the player
// back up to `maxShields` shield hits (the same player.shieldHits pool Iron
// Curtain and the Aldebaran/Megrez stars fill, consumed in entities.js's
// takeDamage). Capped rather than additive so it can't stockpile.
function updateBlockerFamiliar(game, f, dt){
  const player = game.player, def = f.def;
  const homeX = player.x + 26, homeY = player.y - 30 - f.index * 4;
  f.x += (homeX - f.x) * Math.min(1, dt * 3);
  f.y += (homeY - f.y) * Math.min(1, dt * 3);
  f.procTimer -= dt;
  if (f.procTimer > 0) return;
  f.procTimer = def.interval;
  const max = def.maxShields || 1;
  if (player.shieldHits >= max) return;
  player.shieldHits = Math.min(max, player.shieldHits + 1);
  game.floatTexts.push(new FloatText(player.x, player.y - 30, '+shield', '#7fd6e0'));
  Sound.play('shieldBlock');
}

// thief — an orbiter that also picks enemies' pockets: full orbiter contact
// damage, plus a `stealChance` roll on each connecting hit to shake a coin
// loose where the enemy is standing (same spawn path proc's 'coin' uses).
function updateThiefFamiliar(game, f, dt){
  const player = game.player, node = game.currentRoom, def = f.def;
  f.angle += def.orbitSpeed * dt;
  f.x = player.x + Math.cos(f.angle) * def.radius;
  f.y = player.y + Math.sin(f.angle) * def.radius;
  if (f.contactCooldown > 0) { f.contactCooldown -= dt; return; }
  for (const e of node.enemies) {
    if (e.isDead) continue;
    if (Util.circleIntersect(f.x, f.y, 9, e.x, e.y, e.radius)) {
      const dmg = familiarDamage(def.dmg + (player.trinketId === 'houndwhistle' ? 1 : 0), game.dungeon.floorNum);
      const applied = e.takeDamage(dmg, (e.x - f.x) * 0.04, (e.y - f.y) * 0.04);
      if (applied) {
        Sound.play('enemyHit');
        game.floatTexts.push(new FloatText(e.x, e.y - 20, String(dmg), '#fff'));
        if (Math.random() < (def.stealChance || 0.1)) {
          const spot = findClearFloorSpot(node, Math.floor(e.x / TILE), Math.floor(e.y / TILE));
          node.pickups.push(new Pickup('coin', spot.x, spot.y, Util.weighted(COIN_TYPES)));
          game.floatTexts.push(new FloatText(e.x, e.y - 32, 'stolen!', '#e3c15b'));
        }
        if (e.isDead) handleEnemyDeath(game, e);
      }
      f.contactCooldown = def.contactCooldown * familiarRateMult(player);
      break;
    }
  }
}

// grower — an orbiter that gets permanently stronger over the RUN. Reads
// game.runKills (game.js startRun / combat.js handleEnemyDeath), so it resets
// with the run, not the room. Capped at maxGrowth (default 3x) so a long run
// can't turn a 2-damage bug into the player's whole damage output.
function updateGrowerFamiliar(game, f, dt){
  const player = game.player, node = game.currentRoom, def = f.def;
  f.angle += def.orbitSpeed * dt;
  f.x = player.x + Math.cos(f.angle) * def.radius;
  f.y = player.y + Math.sin(f.angle) * def.radius;
  if (f.contactCooldown > 0) { f.contactCooldown -= dt; return; }
  const steps = Math.floor((game.runKills || 0) / (def.killsPerGrowth || 15));
  const mult = Math.min(def.maxGrowth || 3, 1 + steps * (def.growthStep || 0.25));
  for (const e of node.enemies) {
    if (e.isDead) continue;
    if (Util.circleIntersect(f.x, f.y, 9, e.x, e.y, e.radius)) {
      const base = (def.dmg + (player.trinketId === 'houndwhistle' ? 1 : 0)) * mult;
      const dmg = familiarDamage(base, game.dungeon.floorNum);
      const applied = e.takeDamage(dmg, (e.x - f.x) * 0.04, (e.y - f.y) * 0.04);
      if (applied) {
        Sound.play('enemyHit');
        game.floatTexts.push(new FloatText(e.x, e.y - 20, String(dmg), '#fff'));
        if (e.isDead) handleEnemyDeath(game, e);
      }
      f.contactCooldown = def.contactCooldown * familiarRateMult(player);
      break;
    }
  }
}

// detonator — drifts loosely near the player and periodically blows up on
// ITSELF: same pulse shape as attackStyles.js's chargeNova, but centered on
// the familiar and routed through familiarDamage's depth curve.
function updateDetonatorFamiliar(game, f, dt){
  const player = game.player, node = game.currentRoom, def = f.def;
  f.angle += 0.8 * dt;
  const homeX = player.x + Math.cos(f.angle) * 34, homeY = player.y + Math.sin(f.angle) * 34;
  f.x += (homeX - f.x) * Math.min(1, dt * 3);
  f.y += (homeY - f.y) * Math.min(1, dt * 3);
  f.procTimer -= dt;
  if (f.procTimer > 0) return;
  f.procTimer = def.interval * familiarRateMult(player);
  const radius = def.radius || 70;
  const dmg = familiarDamage(def.dmg + (player.trinketId === 'houndwhistle' ? 1 : 0), game.dungeon.floorNum);
  Sound.play('bombExplode');
  for (const e of node.enemies) {
    if (e.isDead) continue;
    if (Util.dist(f.x, f.y, e.x, e.y) > radius + e.radius) continue;
    const applied = e.takeDamage(dmg, (e.x - f.x) * 0.05, (e.y - f.y) * 0.05);
    if (applied) {
      game.floatTexts.push(new FloatText(e.x, e.y - 20, String(dmg), '#fff'));
      if (e.isDead) handleEnemyDeath(game, e);
    }
  }
}

// mirror — a shooter that fires where the PLAYER is looking instead of at
// whatever happens to be nearest to itself: among enemies in range it picks
// the one best lined up with player.facing, as seen from the player.
function updateMirrorFamiliar(game, f, dt){
  const player = game.player, node = game.currentRoom, def = f.def;
  f.angle += 0.6 * dt;
  const homeX = player.x + Math.cos(f.angle) * 30, homeY = player.y + Math.sin(f.angle) * 30 - 10;
  f.x += (homeX - f.x) * Math.min(1, dt * 4);
  f.y += (homeY - f.y) * Math.min(1, dt * 4);
  f.fireTimer -= dt;
  if (f.fireTimer > 0) return;
  const aim = Math.atan2(player.facing.y, player.facing.x);
  const range = def.range || 300;
  let best = null, bestDiff = Infinity;
  for (const e of node.enemies) {
    if (e.isDead) continue;
    if (Util.dist2(player.x, player.y, e.x, e.y) > range * range) continue;
    // smallest absolute angle between the player's facing and the enemy,
    // wrapped into [-PI, PI] so a target behind doesn't read as "aligned"
    let diff = Math.atan2(e.y - player.y, e.x - player.x) - aim;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    diff = Math.abs(diff);
    if (diff < bestDiff) { bestDiff = diff; best = e; }
  }
  // outside the cone it just holds fire — the point of a mirror is that it
  // shoots what the player is committing to, not whatever wanders past.
  if (!best || bestDiff > (def.arc || 1.0)) { f.fireTimer = 0.3; return; }
  f.fireTimer = def.cooldown * familiarRateMult(player);
  const ang = Math.atan2(best.y - f.y, best.x - f.x);
  game.projectiles.push(new Projectile(
    f.x, f.y, Math.cos(ang) * def.boltSpeed, Math.sin(ang) * def.boltSpeed,
    familiarDamage(def.dmg + (player.trinketId === 'houndwhistle' ? 1 : 0), game.dungeon.floorNum), 'familiar',
    { color: def.color, radius: 4 }
  ));
}

// scavenger — periodically grabs the nearest loose pickup within `radius` of
// the player, using combat.js's collectPickup() itself (the exact call
// updatePickups makes when you walk over one), so every pickup kind resolves
// identically and updatePickups' own filter sweeps the corpse next frame.
function updateScavengerFamiliar(game, f, dt){
  const player = game.player, node = game.currentRoom, def = f.def;
  const homeX = player.x - 30, homeY = player.y + 18 + f.index * 4;
  f.x += (homeX - f.x) * Math.min(1, dt * 3);
  f.y += (homeY - f.y) * Math.min(1, dt * 3);
  f.procTimer -= dt;
  if (f.procTimer > 0) return;
  f.procTimer = def.interval;
  const radius = def.radius || 120;
  let nearest = null, nearestD = Infinity;
  for (const p of node.pickups) {
    if (p.collected) continue;
    const d = Util.dist2(player.x, player.y, p.x, p.y);
    if (d < nearestD && d < radius * radius) { nearestD = d; nearest = p; }
  }
  if (!nearest) return;
  collectPickup(game, nearest);
  node.pickups = node.pickups.filter(p => !p.collected);
}

// berserker — an orbiter whose contact damage climbs as the player's own
// health falls (bloodPact's risk/reward, as a familiar): x1 at full red
// hearts, up to x(1 + berserkPower) at death's door.
function updateBerserkerFamiliar(game, f, dt){
  const player = game.player, node = game.currentRoom, def = f.def;
  f.angle += def.orbitSpeed * dt;
  f.x = player.x + Math.cos(f.angle) * def.radius;
  f.y = player.y + Math.sin(f.angle) * def.radius;
  if (f.contactCooldown > 0) { f.contactCooldown -= dt; return; }
  const frac = player.redMax > 0 ? Math.max(0, Math.min(1, player.redCurrent / player.redMax)) : 1;
  const mult = 1 + (def.berserkPower || 1) * (1 - frac);
  for (const e of node.enemies) {
    if (e.isDead) continue;
    if (Util.circleIntersect(f.x, f.y, 9, e.x, e.y, e.radius)) {
      const base = (def.dmg + (player.trinketId === 'houndwhistle' ? 1 : 0)) * mult;
      const dmg = familiarDamage(base, game.dungeon.floorNum);
      const applied = e.takeDamage(dmg, (e.x - f.x) * 0.04, (e.y - f.y) * 0.04);
      if (applied) {
        Sound.play('enemyHit');
        game.floatTexts.push(new FloatText(e.x, e.y - 20, String(dmg), '#e35b6a'));
        if (e.isDead) handleEnemyDeath(game, e);
      }
      f.contactCooldown = def.contactCooldown * familiarRateMult(player);
      break;
    }
  }
}

// swarmer — hovers near the player and periodically buds off a few short-
// lived mini-orbs that circle IT and chip anything they touch. The orbs live
// entirely on the familiar instance (f.miniOrbs), lazily created on first
// update, so nothing else in the codebase has to know about them.
function updateSwarmerFamiliar(game, f, dt){
  const player = game.player, node = game.currentRoom, def = f.def;
  if (f.miniOrbs === undefined) f.miniOrbs = [];
  f.angle += 0.7 * dt;
  const homeX = player.x + Math.cos(f.angle) * 32, homeY = player.y + Math.sin(f.angle) * 32;
  f.x += (homeX - f.x) * Math.min(1, dt * 3);
  f.y += (homeY - f.y) * Math.min(1, dt * 3);
  f.procTimer -= dt;
  if (f.procTimer <= 0) {
    f.procTimer = def.interval;
    const count = def.orbCount || 3;
    for (let i = 0; i < count; i++) {
      f.miniOrbs.push({ angle: (Math.PI * 2 / count) * i, life: def.orbLife || 4, cd: 0 });
    }
  }
  if (!f.miniOrbs.length) return;
  const dmg = familiarDamage(def.dmg + (player.trinketId === 'houndwhistle' ? 1 : 0), game.dungeon.floorNum);
  const orbRadius = def.orbRadius || 26;
  for (const orb of f.miniOrbs) {
    orb.life -= dt;
    orb.angle += (def.orbSpeed || 4.5) * dt;
    orb.x = f.x + Math.cos(orb.angle) * orbRadius;
    orb.y = f.y + Math.sin(orb.angle) * orbRadius;
    if (orb.cd > 0) { orb.cd -= dt; continue; }
    for (const e of node.enemies) {
      if (e.isDead) continue;
      if (!Util.circleIntersect(orb.x, orb.y, 6, e.x, e.y, e.radius)) continue;
      const applied = e.takeDamage(dmg, (e.x - orb.x) * 0.03, (e.y - orb.y) * 0.03);
      if (applied) {
        Sound.play('enemyHit');
        game.floatTexts.push(new FloatText(e.x, e.y - 20, String(dmg), '#fff'));
        if (e.isDead) handleEnemyDeath(game, e);
      }
      orb.cd = def.contactCooldown || 0.5;
      break;
    }
  }
  f.miniOrbs = f.miniOrbs.filter(o => o.life > 0);
}

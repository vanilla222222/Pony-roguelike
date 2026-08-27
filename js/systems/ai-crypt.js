'use strict';
/* ============================================================
   systems/ai-crypt.js — Phase 17. Six new SHARED behaviors for the
   Crypt's (stage 0) floor-by-floor "non-stage-unique" enemy pass
   (data/enemies/crypt-extra.js) — one function each, since none of
   the six existing behaviors (nor the Phase 15/16 additions) already
   covered "flee on sight", "hug a wall and track the player along
   it", "wander + cardinal 4-way volley", "hop randomly, aim the hop
   once close", "DVD-logo corner bounce", or "haunt a room object".
   The eighth enemy in this pass (DNB Fire Circler, flies.js-adjacent
   in crypt-extra.js) needed none of these — it reuses 'strafer'
   outright with a tight ring and a speed boost, see that file's
   header comment. Registered through ENEMY_BEHAVIOR_HANDLERS
   (combat-3.js's registry fallback) — no edit to that file's switch.
   ============================================================ */

// FLEE — the inverse of every seek-based behavior: always running, never
// closing. Crypt Hive/Bomb Hive's whole kit is "corner you into killing it,
// then punish the kill" (see their spawnFliesOnDeath/spawnBombsOnDeath
// fields, applied generically in combat-2.js's handleEnemyDeath), so the
// live behavior itself does nothing but run — same "invert seekVector,
// tryMoveEntity away" shape aiSkirmisher's retreat branch already uses,
// just unconditional instead of only inside a retreat radius.
ENEMY_BEHAVIOR_HANDLERS.flee = function(game, e, dt){
  const node = game.currentRoom, player = game.player;
  const v = seekVector(e, player.x, player.y);
  tryMoveEntity(e, node, node.obstacles, -v.x * e.speed * dt, -v.y * e.speed * dt);
};

// WALL HUGGER — picks whichever room wall it's currently nearest and
// teleports straight onto it (Phase 18 — was a walk-there approach; blinking
// reads much cleaner and means it's never caught mid-room looking like it's
// chasing) — then slides along that wall's AXIS to keep pace with the
// player (left/right wall -> tracks the player's y; top/bottom wall ->
// tracks the player's x), firing on its own cooldown the whole time. Only
// crosses to a different wall if it ends up nearer another one — no
// explicit wall-switch logic needed, the nearest-of-four pick just
// re-resolves every frame, and re-snaps (another teleport) the instant it
// does.
ENEMY_BEHAVIOR_HANDLERS.wallHugger = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  const minX = TILE * 1.5, maxX = (node.tileW - 2.5) * TILE;
  const minY = TILE * 1.5, maxY = (node.tileH - 2.5) * TILE;
  const dLeft = e.x - minX, dRight = maxX - e.x, dTop = e.y - minY, dBottom = maxY - e.y;
  const m = Math.min(dLeft, dRight, dTop, dBottom);
  let onVerticalWall = (m === dLeft || m === dRight);
  if (m === dLeft) e.x = minX;
  else if (m === dRight) e.x = maxX;
  else if (m === dTop) e.y = minY;
  else e.y = maxY;
  // the pinned axis just teleported above; the OTHER axis still slides
  // smoothly toward the player's position along the wall, clamped so it
  // can never slide past the wall's own corners
  const trackX = onVerticalWall ? e.x : Util.clamp(player.x, minX, maxX);
  const trackY = onVerticalWall ? Util.clamp(player.y, minY, maxY) : e.y;
  const dx = trackX - e.x, dy = trackY - e.y, len = Math.hypot(dx, dy) || 1;
  tryMoveEntity(e, node, node.obstacles, (dx / len) * e.speed * dt, (dy / len) * e.speed * dt);
  e.fireTimer -= dt;
  if (e.fireTimer <= 0) {
    e.fireTimer = t.fireCooldown || 2.2;
    fireProjectileAt(game, e, player.x, player.y, t.boltSpeed || 200, e.dmg,
      { color: t.boltColor || '#a8a090', radius: t.boltRadius || 5 });
  }
};

// CARDINAL BLOAT — plain aimless wander (aiWander, no seek term at all,
// same as 'aimless') with a fixed 4-bolt volley — N/E/S/W, absolute compass
// angles rather than aimed at the player — on a cooldown. The bloat itself
// never targets you; standing in one of the four lanes when it fires does.
ENEMY_BEHAVIOR_HANDLERS.cardinalBloat = function(game, e, dt){
  aiWander(game, e, dt);
  e.fireTimer -= dt;
  if (e.fireTimer <= 0) {
    e.fireTimer = e.type.fireCooldown || 2.0;
    const opts = { color: e.type.boltColor || '#7a9a5a', radius: e.type.boltRadius || 5 };
    const speed = e.type.boltSpeed || 190;
    fireProjectileAngle(game, e, 0, speed, e.dmg, opts);
    fireProjectileAngle(game, e, Math.PI / 2, speed, e.dmg, opts);
    fireProjectileAngle(game, e, Math.PI, speed, e.dmg, opts);
    fireProjectileAngle(game, e, -Math.PI / 2, speed, e.dmg, opts);
  }
};

// RANDOM JUMPER — hops on a fixed cadence no matter what (telegraph, then
// one committed dash-hop, same shape 'pouncer' uses for its leap), but the
// DIRECTION of each hop depends on range: a random heading while the player
// is far off, an aimed heading the instant they're close enough. Reads as
// "bouncing around at random until it notices you're near, then it's
// aiming its hops at you" — never sits still waiting like 'pouncer' does.
ENEMY_BEHAVIOR_HANDLERS.randomJumper = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  if (e.dashing) {
    tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    e.dashTimer -= dt;
    if (e.dashTimer <= 0) e.dashing = false;
    return;
  }
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    e.hitFlash = (Math.sin(e.telegraph * 24) > 0) ? 0.1 : 0;
    if (e.telegraph <= 0) {
      const d = Util.dist(e.x, e.y, player.x, player.y);
      const ang = (d < (t.aimRange || 150)) ? Math.atan2(player.y - e.y, player.x - e.x) : Math.random() * Math.PI * 2;
      const jumpSpeed = t.jumpSpeed || 5.2;
      e.dashing = true; e.dashTimer = t.jumpDuration || 0.4;
      e.dashVX = Math.cos(ang) * e.speed * jumpSpeed;
      e.dashVY = Math.sin(ang) * e.speed * jumpSpeed;
    }
    return;
  }
  e.attackTimer -= dt;
  if (e.attackTimer <= 0) {
    e.attackTimer = Util.rand(t.jumpCooldownMin || 0.6, t.jumpCooldownMax || 1.2);
    e.telegraph = t.telegraphTime || 0.3;
  }
};

// DVD STRIDER — picks one random heading on spawn and never stops moving
// along it, bouncing independently off whichever axis a wall actually
// blocks (the same per-axis bounce signal aiBossAntlerWarden's charge uses,
// see ai-3.js) — but with no telegraph, no dash timer, and no bounce
// budget: it's not a periodic attack, it's the enemy's entire, permanent
// movement. Ordinary contact damage (combat-3.js) is all the threat it
// needs — it just never, ever stops sliding around the room.
ENEMY_BEHAVIOR_HANDLERS.dvdStrider = function(game, e, dt){
  const node = game.currentRoom, t = e.type;
  if (!e.dashVX && !e.dashVY) {
    const ang = Math.random() * Math.PI * 2;
    const sp = t.striderSpeed || e.speed;
    e.dashVX = Math.cos(ang) * sp; e.dashVY = Math.sin(ang) * sp;
  }
  const moved = tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
  if (!moved.movedX && Math.abs(e.dashVX) > 5) e.dashVX = -e.dashVX;
  if (!moved.movedY && Math.abs(e.dashVY) > 5) e.dashVY = -e.dashVY;
};

// HAUNTER — a flyer that otherwise just orbits the player (aiOrbiter,
// reused directly rather than reinvented) until its haunt timer lands, at
// which point it picks a live room obstacle, flies straight to it, and
// channels an effect THROUGH it. What that effect looks like is read off
// the obstacle's own existing flags (isPit/isHazard/attackable/
// destructible — entities.js's Obstacle constructor) rather than a
// hand-authored table keyed to every individual obstacle id: a pit pulls
// the player toward it, a live hazard fires a bolt at the player from the
// hazard's own position, inert rubble flings a heavier chunk, and anything
// else (decorative/walkable terrain) just pulses if the player's standing
// near it. If the room happens to have no obstacles at all, it haunts a
// point near the player instead, which the fallback branch already covers
// (none of the flag checks match a plain {x,y} object).
ENEMY_BEHAVIOR_HANDLERS.haunter = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  if (e.hauntTimer === undefined) e.hauntTimer = Util.rand(1.5, 2.5);
  if (e.hauntTarget) {
    const ob = e.hauntTarget;
    const d = Util.dist(e.x, e.y, ob.x, ob.y);
    if (d > 8) {
      const dx = ob.x - e.x, dy = ob.y - e.y, len = Math.hypot(dx, dy) || 1;
      tryMoveEntity(e, node, node.obstacles, (dx / len) * e.speed * 2.2 * dt, (dy / len) * e.speed * 2.2 * dt);
      return;
    }
    triggerHaunt(game, e, ob);
    e.hauntTarget = null;
    e.hauntTimer = Util.rand(t.hauntCooldownMin || 3, t.hauntCooldownMax || 5);
    return;
  }
  aiOrbiter(game, e, dt);
  e.hauntTimer -= dt;
  if (e.hauntTimer <= 0) {
    const pool = node.obstacles.filter(o => !o.destroyed);
    e.hauntTarget = pool.length ? Util.choice(pool) : { x: player.x + Util.rand(-70, 70), y: player.y + Util.rand(-70, 70) };
  }
};

function triggerHaunt(game, e, ob){
  const player = game.player;
  const R = 70;
  game.explosions.push(new Explosion(ob.x, ob.y, R * 0.6)); // ghostly pulse marker, reusing the Explosion visual at reduced size
  if (ob.isPit) {
    const dx = player.x - ob.x, dy = player.y - ob.y, d = Math.hypot(dx, dy) || 1;
    if (d < 110) {
      const pull = Math.min(26, d);
      player.x -= (dx / d) * pull; player.y -= (dy / d) * pull;
      if (d < R) damagePlayer(game, playerDamageAmount(game, false, e.dmg), e.type.id);
    }
  } else if (ob.isHazard || ob.attackable) {
    const proxy = { x: ob.x, y: ob.y, isBoss: false };
    fireProjectileAt(game, proxy, player.x, player.y, 220, e.dmg, { color: '#c9a8e0', radius: 5 });
  } else if (ob.destructible) {
    const proxy = { x: ob.x, y: ob.y, isBoss: false };
    fireProjectileAt(game, proxy, player.x, player.y, 260, e.dmg + 1, { color: '#9a9488', radius: 7 });
  } else if (Util.dist(player.x, player.y, ob.x, ob.y) < R) {
    damagePlayer(game, playerDamageAmount(game, false, e.dmg), e.type.id);
  }
}

'use strict';
/* ============================================================
   systems/ai-newshared.js — Phase 15. Three new SHARED trash
   behaviors, in the same spirit as the original 17-behavior extended
   set in ai-1.js/ai-2.js (orbiter/burrower/summoner/healer/sniper/
   swarm/ambusher/teleporter/shielder/lobber/weaver/sentry/skirmisher/
   whiplash/shielded/charger/ranged): ONE function, reused by several
   ENEMY_TYPES entries across every legacy stage (crypt/forest/desert/
   inferno), rather than a bespoke-per-enemy AI like the stage4-6/7-9/
   10-13 content groups use. Registered through ENEMY_BEHAVIOR_HANDLERS
   (combat-3.js's registry fallback) — no edit to that file's switch.
   ============================================================ */

// POUNCER — sits and waits (does not chase) until the player wanders
// within range, then commits to one telegraphed pounce. An ambush archetype,
// distinct from 'ambusher' (which springs a fixed trap once and stays
// triggered) — a pouncer resets and can pounce again every time it's close.
ENEMY_BEHAVIOR_HANDLERS.pouncer = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  if (e.dashing) {
    tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    e.dashTimer -= dt;
    if (e.dashTimer <= 0) e.dashing = false;
    return;
  }
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    e.hitFlash = (Math.sin(e.telegraph * 26) > 0) ? 0.1 : 0;
    if (e.telegraph <= 0) {
      const v = seekVector(e, player.x, player.y);
      const ls = t.leapSpeed || 5.5;
      e.dashing = true; e.dashTimer = t.dashDuration || 0.35;
      e.dashVX = v.x * e.speed * ls; e.dashVY = v.y * e.speed * ls;
    }
    return;
  }
  if (Util.dist(e.x, e.y, player.x, player.y) < (t.pounceRange || 170)) { e.telegraph = t.telegraphTime || 0.4; return; }
  aiWander(game, e, dt); // sits and waits otherwise — the ambush is the whole point
};

// STRAFER — a kiting shooter that circle-strafes at a fixed ring instead of
// backing straight up like 'ranged' does. Reads as "orbiter with a gun":
// same tangent-strafe math as 'orbiter', but firing aimed shots, not just
// circling for a melee bump.
ENEMY_BEHAVIOR_HANDLERS.strafer = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  const v = seekVector(e, player.x, player.y);
  const ring = t.keepDistance || 180;
  const radial = (v.d - ring) * 0.018;
  const tangent = e.orbitDir * 0.85;
  const mx = v.x * radial + -v.y * tangent, my = v.y * radial + v.x * tangent;
  const len = Math.hypot(mx, my) || 1;
  tryMoveEntity(e, node, node.obstacles, (mx / len) * e.speed * dt, (my / len) * e.speed * dt);
  e.fireTimer -= dt;
  if (e.fireTimer <= 0 && v.d < (t.fireRange || 420)) {
    e.fireTimer = t.fireCooldown || 1.4;
    fireProjectileAt(game, e, player.x, player.y, t.boltSpeed || 210, e.dmg, { color: t.boltColor || '#d9895a', radius: t.boltRadius || 5 });
  }
};

// SPLITSHOT — fires two bolts in a fixed diverging V instead of one aimed
// shot or a centered fan (fireSpread). Distinct dodge shape: a spread
// converges toward one aim line and has a gap in the middle you can stand
// in; a V diverges from the shooter and has a gap that WIDENS with range,
// so the safe lane keeps moving the farther you back up.
ENEMY_BEHAVIOR_HANDLERS.splitshot = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  const d = Util.dist(e.x, e.y, player.x, player.y);
  const keep = t.keepDistance || 150;
  if (d < keep - 20) {
    const mx = e.x - player.x, my = e.y - player.y;
    const len = Math.hypot(mx, my) || 1;
    tryMoveEntity(e, node, node.obstacles, (mx / len) * e.speed * dt, (my / len) * e.speed * dt);
  } else if (d > keep + 20) {
    chaseSeek(game, e, player.x, player.y, 1, dt);
  }
  e.fireTimer -= dt;
  if (e.fireTimer <= 0 && d < (t.fireRange || 380)) {
    e.fireTimer = t.fireCooldown || 1.8;
    const aim = Math.atan2(player.y - e.y, player.x - e.x);
    const gap = t.splitAngle || 0.5;
    const opts = { color: t.boltColor || '#d9895a', radius: t.boltRadius || 5 };
    fireProjectileAngle(game, e, aim - gap, t.boltSpeed || 200, e.dmg, opts);
    fireProjectileAngle(game, e, aim + gap, t.boltSpeed || 200, e.dmg, opts);
  }
};

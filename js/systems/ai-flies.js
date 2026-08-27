'use strict';
/* ============================================================
   systems/ai-flies.js — Phase 16. Two new SHARED behaviors for the
   DNB fly/spider family (data/enemies/flies.js). The family's other
   four members (Red Fly/Yellowjacket/Nuclear Fly/Swarm Fly) reuse
   existing behaviors outright (chaser/charger/orbiter/swarm) rather
   than needing anything new — see flies.js's header comment for which
   maps to which and why. Registered through ENEMY_BEHAVIOR_HANDLERS
   (combat-3.js's registry fallback) — no edit to that file's switch.
   ============================================================ */

// AIMLESS — the DNB Fly's whole behavior: pure wander, no player-seeking
// component at all (unlike 'swarm', which blends wander with a seek term).
// Deals no damage (see combat-3.js's e.type.harmless guard) and is excluded
// from every random spawn pool (data/enemies/flies.js's neverRandom:true;
// see room.js's resolveGenericEnemy) — it only ever appears somewhere a
// human hand actually placed it.
ENEMY_BEHAVIOR_HANDLERS.aimless = function(game, e, dt){
  aiWander(game, e, dt);
};

// SKITTER — the DNB Spider: quick, short, randomly-angled bursts toward the
// player with a real pause between them (not a smooth chase, and not the
// telegraph-then-commit shape 'pouncer'/'charger' use — no wind-up at all,
// just start-stop-start scurrying). "acts like it's about to change its
// mind every half second" is the intended read.
ENEMY_BEHAVIOR_HANDLERS.skitter = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  if (e.skitterBurst > 0) {
    e.skitterBurst -= dt;
    tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    return;
  }
  e.skitterPause = (e.skitterPause === undefined) ? 0 : e.skitterPause;
  e.skitterPause -= dt;
  if (e.skitterPause <= 0) {
    const v = seekVector(e, player.x, player.y);
    // a real random jitter on top of the aim, not just a fixed cone —
    // this is what keeps it reading as skittish rather than a slow chaser
    const jitter = Util.rand(-0.7, 0.7);
    const ca = Math.cos(jitter), sa = Math.sin(jitter);
    const jx = v.x * ca - v.y * sa, jy = v.x * sa + v.y * ca;
    const burstSpeed = e.speed * (t.skitterBurstMult || 2.4);
    e.dashVX = jx * burstSpeed; e.dashVY = jy * burstSpeed;
    e.skitterBurst = t.skitterBurstTime || 0.22;
    e.skitterPause = Util.rand(t.skitterPauseMin || 0.15, t.skitterPauseMax || 0.4);
  }
};

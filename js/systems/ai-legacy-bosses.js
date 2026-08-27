'use strict';
/* ============================================================
   systems/ai-legacy-bosses.js — Phase 15. One new bespoke boss per
   legacy stage (crypt/forest/desert/inferno), joining the existing
   extended boss sets in bosses.js. Same "every boss gets its own
   behavior function, none shared" convention as every BOSS_TYPES entry
   in the game — see data/enemies/legacy-extra.js for the four
   ENEMY_TYPES/BOSS_TYPES entries these are wired to.
   ============================================================ */

// ---- Crypt — The Charnel Warden: charge-dash, then a ring of grave spikes ----
ENEMY_BEHAVIOR_HANDLERS.bossCharnelWarden = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  if (e.dashing) {
    tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    e.dashTimer -= dt;
    if (e.dashTimer <= 0) e.dashing = false;
    return;
  }
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    e.hitFlash = (Math.sin(e.telegraph * 22) > 0) ? 0.12 : 0;
    if (e.telegraph <= 0) {
      if (e.pattern === 0) {
        const v = seekVector(e, player.x, player.y);
        e.dashing = true; e.dashTimer = 0.4;
        e.dashVX = v.x * e.speed * 4.4; e.dashVY = v.y * e.speed * 4.4;
      } else {
        for (let i = 0; i < 8; i++) fireProjectileAngle(game, e, (i / 8) * Math.PI * 2, 175, e.dmg, { color:'#c9c2b0', radius:5 });
      }
      e.pattern = (e.pattern + 1) % 2;
      e.attackTimer = 2.2;
    }
    return;
  }
  chaseSeek(game, e, player.x, player.y, 0.65, dt);
  e.attackTimer -= dt;
  if (e.attackTimer <= 0) { e.attackTimer = 999; e.telegraph = 0.55; }
};

// ---- Forest — The Thornmother: roots and grows a rotating thorn cross, then breaks root to reposition ----
ENEMY_BEHAVIOR_HANDLERS.bossThornmother = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  if (e.rooted) {
    e.rootTimer -= dt;
    e.fireTimer -= dt;
    if (e.fireTimer <= 0) {
      e.fireTimer = 0.55;
      e.spinAngle = (e.spinAngle || 0) + 0.35;
      for (let i = 0; i < 5; i++) fireProjectileAngle(game, e, e.spinAngle + (i / 5) * Math.PI * 2, 165, e.dmg, { color:'#5cc96a', radius:5 });
    }
    if (e.rootTimer <= 0) { e.rooted = false; e.attackTimer = 1.6; }
    return;
  }
  chaseSeek(game, e, player.x, player.y, 0.6, dt);
  e.attackTimer -= dt;
  if (e.attackTimer <= 0) { e.rooted = true; e.rootTimer = 3.2; e.fireTimer = 0; }
};

// ---- Desert — The Dune Sovereign: burrows untouchable, erupts under the player, otherwise strafes and fires ----
ENEMY_BEHAVIOR_HANDLERS.bossDuneSovereign = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  e.burrowTimer -= dt;
  if (e.submerged) {
    chaseSeek(game, e, player.x, player.y, 1.7, dt);
    const adjacent = Util.dist(e.x, e.y, player.x, player.y) < e.radius + player.radius + 10;
    if (e.burrowTimer <= 0 || adjacent) {
      e.submerged = false; e.shielded = false; e.hitFlash = 0.14;
      e.burrowTimer = 4.5;
      const R = 62;
      game.explosions.push(new Explosion(e.x, e.y, R));
      if (Util.dist(e.x, e.y, player.x, player.y) < R + player.radius) {
        damagePlayer(game, playerDamageAmount(game, e.isBoss, e.dmg), e.type.id);
      }
    }
    return;
  }
  const v = seekVector(e, player.x, player.y);
  const ring = 190;
  const radial = (v.d - ring) * 0.015;
  const tangent = e.orbitDir * 0.7;
  const mx = v.x * radial + -v.y * tangent, my = v.y * radial + v.x * tangent;
  const len = Math.hypot(mx, my) || 1;
  tryMoveEntity(e, node, node.obstacles, (mx / len) * e.speed * dt, (my / len) * e.speed * dt);
  e.fireTimer -= dt;
  if (e.fireTimer <= 0) {
    e.fireTimer = 1.6;
    fireProjectileAt(game, e, player.x, player.y, 210, e.dmg, { color:'#e0c374', radius:5 });
  }
  if (e.burrowTimer <= 0) { e.submerged = true; e.shielded = true; e.burrowTimer = 1.8; e.navPath = null; e.pathTimer = 0; }
};

// ---- Inferno — The Ashen Colossus: slow chase, leaves an ember trail, periodic big shockwave slam ----
ENEMY_BEHAVIOR_HANDLERS.bossAshenColossus = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    e.hitFlash = (Math.sin(e.telegraph * 18) > 0) ? 0.14 : 0;
    if (e.telegraph <= 0) {
      // deliberately NOT read off t.burstRadius — the ember-trail burst
      // below shares e.lobTimer/lobX/lobY with this same boss, and
      // render.js's drawEnemy already draws a ground-target ring for ANY
      // e.lobTimer > 0 sized off t.burstRadius — using the same field for
      // two very differently-sized bursts would make one of them visually
      // lie about its real radius. Both are hardcoded here instead, kept
      // deliberately in sync with the matching Explosion radius below.
      const R = 80;
      game.explosions.push(new Explosion(e.x, e.y, R));
      if (Util.dist(e.x, e.y, player.x, player.y) < R + player.radius) {
        damagePlayer(game, playerDamageAmount(game, e.isBoss, e.dmg), e.type.id);
      }
      e.attackTimer = 4;
    }
    return;
  }
  chaseSeek(game, e, player.x, player.y, 0.5, dt);
  // ember trail — a delayed ground burst wherever the Colossus happens to be.
  // r2 (44) intentionally matches render.js's OWN fallback for a missing
  // t.burstRadius (`(e.type && e.type.burstRadius) || 44`) — this boss's
  // ENEMY_TYPES entry deliberately has no burstRadius field at all, so the
  // ground-marker ring render.js draws for this burst and the actual blast
  // radius below always agree, without this boss needing a field that would
  // also (wrongly) resize the slam's own Explosion two blocks up.
  e.fireTimer -= dt;
  if (e.fireTimer <= 0) {
    e.fireTimer = 0.5;
    if (e.lobTimer <= 0) { e.lobX = e.x; e.lobY = e.y; e.lobTime = 1; e.lobTimer = e.lobTime; }
  }
  if (e.lobTimer > 0) {
    e.lobTimer -= dt;
    if (e.lobTimer <= 0) {
      const r2 = 44;
      game.explosions.push(new Explosion(e.lobX, e.lobY, r2));
      if (Util.dist(e.lobX, e.lobY, player.x, player.y) < r2 + player.radius) {
        damagePlayer(game, playerDamageAmount(game, e.isBoss, Math.max(1, e.dmg - 1)), e.type.id);
      }
    }
  }
  e.attackTimer -= dt;
  if (e.attackTimer <= 0) { e.attackTimer = 999; e.telegraph = 0.7; }
};

'use strict';
// systems/ai-3.js — split from ai.js (part 3/4).

/* ---------------------------------------------------------------
   9A/9B/10A/10B's 2-apiece regular bosses — a notch lighter than
   the stage bosses above (one attack pattern + one movement quirk,
   no minion waves): these floors already have a superboss as the
   main event, see game.js's onBossDefeated — this is the bonus
   fight in dungeon.js's secondBossNode.
   --------------------------------------------------------------- */
function aiBossShadowStalker(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    if (e.telegraph <= 0) {
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((player.x + Math.cos(ang)*70)/TILE), Math.floor((player.y + Math.sin(ang)*70)/TILE));
      e.x = spot.x * TILE + TILE / 2; e.y = spot.y * TILE + TILE / 2;
      const baseAng = Math.atan2(player.y - e.y, player.x - e.x);
      for (let i = -1; i <= 1; i++) {
        const ang2 = baseAng + i * 0.25;
        game.projectiles.push(new Projectile(e.x, e.y, Math.cos(ang2)*190, Math.sin(ang2)*190, 2, 'enemy', { color:'#2c2840', radius:5, fromBoss:true, source: e }));
      }
      e.attackTimer = Util.rand(2.2, 2.8);
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.7, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) e.telegraph = 0.6;
  }
}

function aiBossStormbringer(game, e, dt){
  const player = game.player;
  chaseSeek(game, e, player.x, player.y, 0.6, dt);
  e.attackTimer -= dt;
  if (e.attackTimer <= 0) {
    e.attackTimer = Util.rand(2.4, 3.0);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      game.projectiles.push(new Projectile(e.x, e.y, Math.cos(ang)*165, Math.sin(ang)*165, 2, 'enemy', { color:'#4a4a70', radius:5, fromBoss:true, source: e }));
    }
  }
}

function aiBossFrostSentinel(game, e, dt){
  const node = game.currentRoom, player = game.player;
  const d = Util.dist(e.x, e.y, player.x, player.y);
  if (d < 190) {
    const v = seekVector(e, player.x, player.y);
    tryMoveEntity(e, node, node.obstacles, -v.x * e.speed * dt, -v.y * e.speed * dt);
  } else {
    chaseSeek(game, e, player.x, player.y, 0.5, dt);
  }
  e.fireTimer -= dt;
  if (e.fireTimer <= 0) {
    e.fireTimer = 1.6;
    const baseAng = Math.atan2(player.y - e.y, player.x - e.x);
    for (let i = -1; i <= 1; i++) {
      const ang = baseAng + i * 0.2;
      game.projectiles.push(new Projectile(e.x, e.y, Math.cos(ang)*195, Math.sin(ang)*195, 2, 'enemy', { color:'#7fa8c9', radius:5, fromBoss:true, source: e }));
    }
  }
}

function aiBossBrickGolem(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.dashing) {
    tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    e.dashTimer -= dt;
    if (e.dashTimer <= 0) e.dashing = false;
  } else if (e.telegraph > 0) {
    e.telegraph -= dt;
    if (e.telegraph <= 0) {
      const v = seekVector(e, player.x, player.y);
      e.dashing = true; e.dashTimer = 0.5;
      e.dashVX = v.x * e.speed * 4.4; e.dashVY = v.y * e.speed * 4.4;
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.6, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) { e.attackTimer = Util.rand(2.4, 3.0); e.telegraph = 0.55; }
  }
}

function aiBossGlacierFiend(game, e, dt){
  const player = game.player;
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    if (e.telegraph <= 0) {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        game.projectiles.push(new Projectile(e.x, e.y, Math.cos(ang)*160, Math.sin(ang)*160, 2, 'enemy', { color:'#9ac9e0', radius:5, fromBoss:true, source: e }));
      }
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.5, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) { e.attackTimer = Util.rand(3.0, 3.8); e.telegraph = 0.65; }
  }
}

function aiBossBlizzardWraith(game, e, dt){
  const node = game.currentRoom, player = game.player;
  e.pathTimer -= dt;
  if (e.pathTimer <= 0 || !e.pathDir) { e.pathDir = { x: Util.rand(-1,1), y: Util.rand(-1,1) }; e.pathTimer = Util.rand(0.5, 1.0); }
  const v = seekVector(e, player.x, player.y);
  const mx = v.x * 0.5 + e.pathDir.x * 0.5, my = v.y * 0.5 + e.pathDir.y * 0.5;
  const len = Math.hypot(mx, my) || 1;
  tryMoveEntity(e, node, node.obstacles, (mx/len) * e.speed * dt, (my/len) * e.speed * dt);
  e.fireTimer -= dt;
  if (e.fireTimer <= 0 && v.d < 400) {
    e.fireTimer = 1.3;
    fireProjectileAt(game, e, player.x, player.y, 210, 2, { color:'#e8f4ff', radius:5 });
  }
}

function aiBossVineHorror(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.dashing) {
    tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    e.dashTimer -= dt;
    if (e.dashTimer <= 0) e.dashing = false;
  } else if (e.telegraph > 0) {
    e.telegraph -= dt;
    if (e.telegraph <= 0) {
      const v = seekVector(e, player.x, player.y);
      e.dashing = true; e.dashTimer = 0.45;
      e.dashVX = v.x * e.speed * 4.5; e.dashVY = v.y * e.speed * 4.5;
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.65, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) { e.attackTimer = Util.rand(2.3, 2.9); e.telegraph = 0.5; }
  }
}

function aiBossCanopyStalker(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.dashing) {
    tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    e.dashTimer -= dt;
    if (e.dashTimer <= 0) e.dashing = false;
  } else if (e.telegraph > 0) {
    e.telegraph -= dt;
    if (e.telegraph <= 0) {
      const v = seekVector(e, player.x, player.y);
      e.dashing = true; e.dashTimer = 0.35;
      e.dashVX = v.x * e.speed * 5.2; e.dashVY = v.y * e.speed * 5.2;
    }
  } else {
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) { e.attackTimer = Util.rand(1.8, 2.4); e.telegraph = 0.4; }
    else chaseSeek(game, e, player.x, player.y, 0.4, dt);
  }
}

/* ---------------------------------------------------------------
   Algae DNB (10A) / Lilac DNB (10B) — the newest superbosses,
   continuing past Pineapple/Israel the same way those two continue
   past Tyrone. Full superboss weight class: 2 attack patterns each,
   2 staggered minion waves, matching Polish/Tyrone/Pineapple/Israel
   above rather than the lighter regular bosses just above this.
   --------------------------------------------------------------- */
function aiBossAlgae(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.submerged) {
    e.telegraph -= dt;
    if (e.telegraph <= 0) {
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((player.x + Math.cos(ang)*60)/TILE), Math.floor((player.y + Math.sin(ang)*60)/TILE));
      e.x = spot.x * TILE + TILE / 2; e.y = spot.y * TILE + TILE / 2;
      e.submerged = false; e.shielded = false;
      const R = 100;
      game.explosions.push(new Explosion(e.x, e.y, R));
      if (Util.dist(e.x, e.y, player.x, player.y) < R + player.radius) damagePlayer(game, playerDamageAmount(game, true, e.dmg), e.type.id);
      e.attackTimer = Util.rand(2.0, 2.6);
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 1, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) {
      e.attackTimer = Util.rand(2.2, 3.0);
      if (Math.random() < 0.5) { e.submerged = true; e.shielded = true; e.telegraph = 1.1; }
      else {
        const baseAng = Math.atan2(player.y - e.y, player.x - e.x);
        for (let i = -2; i <= 2; i++) {
          const ang = baseAng + i * 0.18;
          game.projectiles.push(new Projectile(e.x, e.y, Math.cos(ang)*185, Math.sin(ang)*185, 2, 'enemy', { color:'#4a9c9c', radius:5, fromBoss:true, source: e }));
        }
      }
    }
  }
  if (!e.minionsSpawned && e.hp < e.maxHp * 0.6) {
    e.minionsSpawned = true;
    for (let i = 0; i < 3; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((e.x + Math.cos(ang)*80)/TILE), Math.floor((e.y + Math.sin(ang)*80)/TILE));
      node.enemies.push(new Enemy(ENEMY_TYPES.icecrawler, spot.x, spot.y, game.dungeon.floorNum));
    }
  }
  if (!e.minions2 && e.hp < e.maxHp * 0.25) {
    e.minions2 = true;
    for (let i = 0; i < 2; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((e.x + Math.cos(ang)*80)/TILE), Math.floor((e.y + Math.sin(ang)*80)/TILE));
      node.enemies.push(new Enemy(ENEMY_TYPES.glacierbeast, spot.x, spot.y, game.dungeon.floorNum));
    }
  }
}

function aiBossLilac(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.dashing) {
    tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    e.dashTimer -= dt;
    if (e.dashTimer <= 0) e.dashing = false;
  } else if (e.telegraph > 0) {
    e.telegraph -= dt;
    if (e.telegraph <= 0) {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        game.projectiles.push(new Projectile(e.x, e.y, Math.cos(ang)*170, Math.sin(ang)*170, 2, 'enemy', { color:'#b47ad9', radius:5, fromBoss:true, source: e }));
      }
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.7, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) {
      e.attackTimer = Util.rand(2.6, 3.2);
      if (Math.random() < 0.4) e.telegraph = 0.6;
      else {
        const v = seekVector(e, player.x, player.y);
        e.dashing = true; e.dashTimer = 0.4; e.dashVX = v.x * e.speed * 4.6; e.dashVY = v.y * e.speed * 4.6;
      }
    }
  }
  if (!e.minionsSpawned && e.hp < e.maxHp * 0.6) {
    e.minionsSpawned = true;
    for (let i = 0; i < 3; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((e.x + Math.cos(ang)*80)/TILE), Math.floor((e.y + Math.sin(ang)*80)/TILE));
      node.enemies.push(new Enemy(ENEMY_TYPES.junglestalker, spot.x, spot.y, game.dungeon.floorNum));
    }
  }
  if (!e.minions2 && e.hp < e.maxHp * 0.25) {
    e.minions2 = true;
    for (let i = 0; i < 2; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((e.x + Math.cos(ang)*80)/TILE), Math.floor((e.y + Math.sin(ang)*80)/TILE));
      node.enemies.push(new Enemy(ENEMY_TYPES.canopybeast, spot.x, spot.y, game.dungeon.floorNum));
    }
  }
}

/* ---------------------------------------------------------------
   Extended regular-boss set — 2 more apiece for stages 0-3, taking
   Crypt/Forest/Desert to 4 each and Inferno to 6 (see enemies.js's
   BOSS_TYPES). room.js's resolveGenericBoss picks uniformly inside a
   stage, so with 4 candidates per stage the player meets each of
   these often — every one below is a mechanic no other boss in the
   table has, rather than a re-tuned dash/ring/stomp.

   All per-boss state these read is initialized eagerly in the Enemy
   (and Boss) constructor in entities.js — an undefined field that
   gets `-= dt` goes NaN and freezes the boss silently.
   --------------------------------------------------------------- */

// BONECALLER (Crypt) — the only boss whose invulnerability is tied to its
// adds: raising a wave also raises a ward, and the ward only drops when its
// risen are dead. e.wardTimer is a hard cap on top of that, so a grub stuck
// behind an obstacle can never make the fight unwinnable.
function aiBossBoneCaller(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.shielded) {
    e.wardTimer -= dt;
    let guarded = false;
    for (const o of node.enemies) {
      if (!o.isDead && o.wardOwner === e) { guarded = true; break; }
    }
    if (!guarded || e.wardTimer <= 0) { e.shielded = false; e.wardTimer = 0; }
  }

  const v = seekVector(e, player.x, player.y);
  if (v.d < 200) tryMoveEntity(e, node, node.obstacles, -v.x * e.speed * dt, -v.y * e.speed * dt);
  else chaseSeek(game, e, player.x, player.y, 0.6, dt);

  e.waveTimer -= dt;
  const spawned = e.minionsSpawned || 0; // Boss's constructor seeds this false, so coerce
  if (e.waveTimer <= 0 && spawned < 8) {
    e.waveTimer = Util.rand(6.5, 7.5);
    const n = Math.min(2, 8 - spawned);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((e.x + Math.cos(ang)*70)/TILE), Math.floor((e.y + Math.sin(ang)*70)/TILE));
      const m = new Enemy(ENEMY_TYPES.gravegrub, spot.x, spot.y, game.dungeon.floorNum);
      m.wardOwner = e; // tags THIS boss's risen, so unrelated room enemies can't hold the ward up
      node.enemies.push(m);
    }
    e.minionsSpawned = spawned + n;
    e.shielded = true; e.wardTimer = 6;
  }

  e.attackTimer -= dt;
  if (e.attackTimer <= 0) {
    e.attackTimer = Util.rand(1.9, 2.5);
    fireProjectileAt(game, e, player.x, player.y, 165, 2, { color:'#6a5a7a', radius:7 });
  }
}

// GRAVE CHORUS (Crypt) — a rotating two-armed spiral. Backing off doesn't
// help (the arms sweep the whole room); the counterplay is reading the gap
// between arms and walking with the rotation.
function aiBossGraveChorus(game, e, dt){
  const player = game.player;
  if (e.spinTimer > 0) {
    e.spinTimer -= dt;
    e.spinAngle += 2.6 * dt;
    e.fireTimer -= dt;
    if (e.fireTimer <= 0) {
      e.fireTimer = 0.12;
      fireProjectileAngle(game, e, e.spinAngle, 150, 2, { color:'#9a8fa8', radius:5 });
      fireProjectileAngle(game, e, e.spinAngle + Math.PI, 150, 2, { color:'#9a8fa8', radius:5 });
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.45, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) {
      e.attackTimer = Util.rand(3.4, 4.2);
      e.spinTimer = 2.2;
      e.spinAngle = Math.atan2(player.y - e.y, player.x - e.x); // first arm starts on the player
      e.fireTimer = 0;
    }
  }
}

// ROT BLOOM (Forest) — the only boss whose damage lands somewhere it isn't.
// It seeds three pods in a row at wherever the player is standing; each
// blooms a second later. Standing still is what kills you. The marker is
// drawn by render.js's drawEnemy off e.lobTimer (same path as the `lobber`
// enemies), sized by the type's burstRadius.
function aiBossRotBloom(game, e, dt){
  const node = game.currentRoom, player = game.player;
  const R = (e.type && e.type.burstRadius) || 78;
  if (e.lobTimer > 0) {
    e.lobTimer -= dt;
    if (e.lobTimer <= 0) {
      game.explosions.push(new Explosion(e.lobX, e.lobY, R));
      if (Util.dist(e.lobX, e.lobY, player.x, player.y) < R + player.radius) damagePlayer(game, playerDamageAmount(game, true, e.dmg), e.type.id);
    }
  }

  const v = seekVector(e, player.x, player.y);
  if (v.d < 170) tryMoveEntity(e, node, node.obstacles, -v.x * e.speed * dt, -v.y * e.speed * dt);
  else chaseSeek(game, e, player.x, player.y, 0.55, dt);

  e.attackTimer -= dt;
  if (e.attackTimer <= 0 && e.lobTimer <= 0) {
    if (e.pattern >= 3) { e.pattern = 0; e.attackTimer = Util.rand(2.6, 3.2); }
    else {
      e.pattern++;
      e.attackTimer = 0.85;
      e.lobX = player.x; e.lobY = player.y;
      e.lobTime = 1.0; e.lobTimer = 1.0;
    }
  }
}

// ANTLER WARDEN (Forest) — a charge that doesn't stop at the wall. Every
// blocked axis flips instead of ending the dash, so the room fills with a
// ricocheting battering ram for a couple of seconds and hugging a corner is
// the worst place to be. tryMoveEntity already reports per-axis movement,
// which is exactly the bounce signal.
function aiBossAntlerWarden(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.dashing) {
    const moved = tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    // the magnitude guard keeps a near-axis-aligned charge (one component
    // barely nonzero) from reading as a bounce every frame
    if (!moved.movedX && Math.abs(e.dashVX) > 20) { e.dashVX = -e.dashVX; e.bounces--; }
    if (!moved.movedY && Math.abs(e.dashVY) > 20) { e.dashVY = -e.dashVY; e.bounces--; }
    e.dashTimer -= dt;
    if (e.dashTimer <= 0 || e.bounces <= 0) { e.dashing = false; e.attackTimer = Util.rand(1.4, 2.0); }
  } else if (e.telegraph > 0) {
    e.telegraph -= dt;
    e.hitFlash = 0.1; // paws the ground — same blink tell the chargers use
    if (e.telegraph <= 0) {
      const v = seekVector(e, player.x, player.y);
      e.dashing = true; e.dashTimer = 2.2; e.bounces = 3;
      e.dashVX = v.x * e.speed * 5.0; e.dashVY = v.y * e.speed * 5.0;
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.5, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) { e.attackTimer = Util.rand(2.4, 3.0); e.telegraph = 0.55; }
  }
}

// GLASS SCORPION (Desert) — never closes. It holds a standoff ring and
// strafes around the player (the orbiter's ring-keeping, reused at boss
// scale), then freezes dead still for a long lock-on and lands one very fast
// bolt. The stillness IS the telegraph; below half HP it reverses its strafe
// and the lock-on becomes a tight three-bolt fan.
function aiBossGlassScorpion(game, e, dt){
  const player = game.player;
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    e.hitFlash = 0.1;
    if (e.telegraph <= 0) {
      if (e.enraged) {
        const baseAng = Math.atan2(player.y - e.y, player.x - e.x);
        for (let i = -1; i <= 1; i++) fireProjectileAngle(game, e, baseAng + i * 0.12, 330, 2, { color:'#6ab49a', radius:6 });
      } else {
        fireProjectileAt(game, e, player.x, player.y, 330, 2, { color:'#6ab49a', radius:7 });
      }
    }
  } else {
    const R = 200;
    const bearing = Math.atan2(e.y - player.y, e.x - player.x);
    const ang = bearing + 1.1 * e.orbitDir * 0.35; // lead the bearing, same trick as aiOrbiter
    chaseSeek(game, e, player.x + Math.cos(ang) * R, player.y + Math.sin(ang) * R, 1, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) { e.attackTimer = Util.rand(2.4, 3.0); e.telegraph = 0.9; }
  }
  if (!e.enraged && e.hp < e.maxHp * 0.5) { e.enraged = true; e.orbitDir = -e.orbitDir; }
}

// DUNE RAVAGER (Desert) — the charge is the easy half. It sheds delayed sand
// bursts along the line it ran, each blooming three quarters of a second
// later, so dodging the body puts you in the fuse. Pending bursts live on the
// boss itself (e.pyres) rather than in a global list, so they die with it.
function aiBossDuneRavager(game, e, dt){
  const node = game.currentRoom, player = game.player;
  for (let i = e.pyres.length - 1; i >= 0; i--) {
    const p = e.pyres[i];
    p.t -= dt;
    if (p.t <= 0) {
      const R = 62;
      game.explosions.push(new Explosion(p.x, p.y, R));
      if (Util.dist(p.x, p.y, player.x, player.y) < R + player.radius) damagePlayer(game, playerDamageAmount(game, true, e.dmg), e.type.id);
      e.pyres.splice(i, 1);
    }
  }
  if (e.dashing) {
    tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    e.pyreDrop -= dt;
    if (e.pyreDrop <= 0) { e.pyreDrop = 0.12; e.pyres.push({ x: e.x, y: e.y, t: 0.75 }); }
    e.dashTimer -= dt;
    if (e.dashTimer <= 0) e.dashing = false;
  } else if (e.telegraph > 0) {
    e.telegraph -= dt;
    e.hitFlash = 0.1;
    if (e.telegraph <= 0) {
      const v = seekVector(e, player.x, player.y);
      e.dashing = true; e.dashTimer = 0.6; e.pyreDrop = 0;
      e.dashVX = v.x * e.speed * 4.8; e.dashVY = v.y * e.speed * 4.8;
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.8, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) { e.attackTimer = Util.rand(2.6, 3.2); e.telegraph = 0.45; }
  }
}

// FURNACE HEART (Inferno) — a pressure cycle, not an attack rotation. It
// walks you down, vents three rings in a row (each faster and rotated off the
// last, so the gaps never line up), then hangs exhausted and near-motionless
// for a second and a half. That vent window is the whole fight: everything
// else is repositioning for it.
function aiBossFurnaceHeart(game, e, dt){
  const player = game.player;
  if (e.exhaustTimer > 0) {
    e.exhaustTimer -= dt;
    chaseSeek(game, e, player.x, player.y, 0.15, dt);
  } else if (e.pulseCount > 0) {
    e.pulseTimer -= dt;
    if (e.pulseTimer <= 0) {
      const wave = 3 - e.pulseCount; // 0, 1, 2
      const n = 12, spd = 140 + wave * 35;
      for (let i = 0; i < n; i++) {
        fireProjectileAngle(game, e, (i / n) * Math.PI * 2 + wave * 0.26, spd, 2, { color:'#f0a03a', radius:5 });
      }
      e.pulseCount--;
      e.pulseTimer = 0.45;
      if (e.pulseCount <= 0) e.exhaustTimer = 1.6;
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.55, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) { e.attackTimer = Util.rand(3.6, 4.4); e.pulseCount = 3; e.pulseTimer = 0.5; }
  }
}

// ECLIPSE WRAITH (glass cannon) — same teleport-blink core as
// aiBossShadowStalker above, but the payload on landing alternates via
// e.pattern (0/1, flipped every cycle, same counter shape aiBossRotBloom
// uses): an expanding 9-bolt ring straight off the blink spot, or a single
// slow, heavy, generously-telegraphed bolt aimed at the player once it
// actually fires. The ring's telegraph stays short (0.6s, same as
// shadowStalker's cone) since it's an AoE you just need to not be standing
// on top of; the heavy shot's telegraph is deliberately longer (1.0s) so a
// single big hit stays fair to react to.
function aiBossEclipseWraith(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    if (e.telegraph <= 0) {
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((player.x + Math.cos(ang) * 70) / TILE), Math.floor((player.y + Math.sin(ang) * 70) / TILE));
      e.x = spot.x * TILE + TILE / 2; e.y = spot.y * TILE + TILE / 2;
      if (e.pattern === 0) {
        const n = 9;
        for (let i = 0; i < n; i++) {
          const a2 = (i / n) * Math.PI * 2;
          game.projectiles.push(new Projectile(e.x, e.y, Math.cos(a2) * 200, Math.sin(a2) * 200, 2, 'enemy', { color:'#2c2440', radius:5, fromBoss:true, source: e }));
        }
      } else {
        const baseAng = Math.atan2(player.y - e.y, player.x - e.x);
        game.projectiles.push(new Projectile(e.x, e.y, Math.cos(baseAng) * 150, Math.sin(baseAng) * 150, 4, 'enemy', { color:'#6a2c8a', radius:9, fromBoss:true, source: e }));
      }
      e.pattern = (e.pattern + 1) % 2;
      e.attackTimer = Util.rand(1.6, 2.0);
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.9, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) e.telegraph = (e.pattern === 0) ? 0.6 : 1.0;
  }
}

// IRON BASTION (siege body) — alternates a telegraphed ground-slam AoE
// (identical ground-target-marker + AoE-on-timer-expiry shape as
// aiBossRotBloom: e.lobX/e.lobY/e.lobTime/e.lobTimer, sized off
// e.type.burstRadius, drawn automatically by render.js's ground-target
// marker) with a short charge-dash (aiCharger's telegraph-then-lunge
// shape) whenever it isn't slamming. e.pattern flips 0/1 each time it
// picks a new attack, same counter shape as Eclipse Wraith above.
function aiBossIronBastion(game, e, dt){
  const node = game.currentRoom, player = game.player;
  const R = (e.type && e.type.burstRadius) || 90;
  if (e.dashing) {
    tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    e.dashTimer -= dt;
    if (e.dashTimer <= 0) { e.dashing = false; e.attackTimer = Util.rand(2.0, 2.6); }
    return;
  }
  if (e.lobTimer > 0) {
    e.lobTimer -= dt;
    if (e.lobTimer <= 0) {
      game.explosions.push(new Explosion(e.lobX, e.lobY, R));
      Sound.play('explosion');
      if (Util.dist(e.lobX, e.lobY, player.x, player.y) < R + player.radius) damagePlayer(game, playerDamageAmount(game, true, e.dmg), e.type.id);
      e.attackTimer = Util.rand(2.0, 2.6);
    }
    return;
  }
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    e.hitFlash = (Math.sin(e.telegraph * 30) > 0) ? 0.12 : 0;
    if (e.telegraph <= 0) {
      const v = seekVector(e, player.x, player.y);
      e.dashing = true; e.dashTimer = 0.5;
      e.dashVX = v.x * e.speed * 5.5; e.dashVY = v.y * e.speed * 5.5;
    }
    return;
  }
  chaseSeek(game, e, player.x, player.y, 0.5, dt);
  e.attackTimer -= dt;
  if (e.attackTimer <= 0) {
    e.pattern = (e.pattern + 1) % 2;
    if (e.pattern === 0) { e.lobX = player.x; e.lobY = player.y; e.lobTime = 1.0; e.lobTimer = 1.0; }
    else e.telegraph = 0.5;
  }
}

// SLAGBOUND EFFIGY (Inferno) — the only boss that answers your damage rather
// than a timer. It stores whatever HP it loses and vents a full ring once the
// stored total crosses a threshold, which halves below 40% HP: dumping a
// burst window into it is what fills the meter. Nothing in the codebase
// reports "this boss was just hit" (hitFlash is a duration, not an edge), so
// the previous-frame HP compare is the honest signal. e.prevHp is seeded in

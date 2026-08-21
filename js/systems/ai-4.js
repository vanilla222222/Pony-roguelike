'use strict';
// systems/ai-4.js — split from ai.js (part 4/4).
// the Boss constructor AFTER the boss HP curve is applied, and reassigned
// unconditionally below, so a stale seed self-corrects on frame one.
function aiBossSlagbound(game, e, dt){
  const player = game.player;
  if (e.hp < e.prevHp) e.retaliation += e.prevHp - e.hp;
  e.prevHp = e.hp;
  const threshold = (e.hp < e.maxHp * 0.4) ? 2 : 4;
  if (e.retaliation >= threshold) {
    e.retaliation = 0;
    const n = 14, off = Math.random() * Math.PI * 2;
    for (let i = 0; i < n; i++) fireProjectileAngle(game, e, off + (i / n) * Math.PI * 2, 165, 2, { color:'#9c3ac9', radius:5 });
  }
  chaseSeek(game, e, player.x, player.y, 0.85, dt);
  e.attackTimer -= dt;
  if (e.attackTimer <= 0) {
    e.attackTimer = Util.rand(2.8, 3.6);
    fireProjectileAt(game, e, player.x, player.y, 145, 2, { color:'#9c3ac9', radius:8 });
  }
}

/* ---------------------------------------------------------------
   THE DNB SUPERBOSSES — 11A/11B/12A/12B/13 (enemies.js SUPERBOSSES).
   Theme is rhythm: every one of these fights on an audible cadence
   rather than a random attack roll, so the counterplay is learning
   the bar rather than reacting to a dice throw.

   Everything below composes from the existing vocabulary —
   fireProjectileAngle/fireProjectileAt (never `new Projectile`, or
   the reflect/absorb items break), chaseSeek, tryMoveEntity,
   damagePlayer, Explosion, findNearestFloor — plus the one shared
   ring helper directly below.

   EVERY numeric field these read is initialized eagerly in the Enemy
   constructor (entities.js). An uninitialized field goes NaN on its
   first `-= dt` and freezes the boss forever; that is the #1 way
   boss work breaks in this repo.
   --------------------------------------------------------------- */

// An evenly spaced ring of bolts from `e`, optionally with a walkable gap.
// gapWidth is a count of OMITTED slots starting at gapIdx (0 = solid ring) —
// a ring you're meant to slip through and one you're meant to outrun are the
// same primitive with one argument changed.
function dnbRing(game, e, n, speed, dmg, color, offset, gapIdx, gapWidth){
  for (let i = 0; i < n; i++) {
    if (gapWidth > 0) {
      const off = ((i - gapIdx) % n + n) % n;
      if (off < gapWidth) continue;
    }
    fireProjectileAngle(game, e, offset + (i / n) * Math.PI * 2, speed, dmg, { color: color, radius: 5 });
  }
}

// PLAPPER DNB (11A) — BASSLINE. A strict two-part bar: a rest beat where it
// walks you down, then a downbeat where it roots and machine-guns. Every third
// bar the downbeat is replaced by a shockwave — a gapped ring off its own
// position plus a contact blast — so standing on top of it during the rest is
// what kills you. The cadence is fixed, so the fight is memorizable.
function aiBossPlapper(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    e.hitFlash = 0.1; // winding up the shockwave — rooted, flashing
    if (e.telegraph <= 0) {
      const n = 18;
      dnbRing(game, e, n, 150, 2, '#5a4ae0', Math.random() * Math.PI * 2, Math.floor(Math.random() * n), 2);
      const R = 92;
      game.explosions.push(new Explosion(e.x, e.y, R));
      if (Util.dist(e.x, e.y, player.x, player.y) < R + player.radius) damagePlayer(game, playerDamageAmount(game, true, e.dmg), e.type.id);
      e.beatTimer = Util.rand(1.0, 1.3);
    }
  } else if (e.burstShots > 0) {
    e.shotTimer -= dt;
    if (e.shotTimer <= 0) {
      e.shotTimer = 0.13;
      fireProjectileAt(game, e, player.x, player.y, 250, 2, { color:'#5a4ae0', radius:5 });
      e.burstShots--;
      if (e.burstShots <= 0) e.beatTimer = Util.rand(1.0, 1.3);
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.9, dt);
    e.beatTimer -= dt;
    if (e.beatTimer <= 0) {
      e.barCount++;
      if (e.barCount % 3 === 0) e.telegraph = 0.7;
      else { e.burstShots = 5; e.shotTimer = 0; }
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

// CLAPPER DNB (11B) — SNARE. Blink-clap: it vanishes (the burrower's
// submerged/shielded pair, same as Algae's dive, so render.js already draws
// it correctly), reappears a short offset from the player, and immediately
// throws a solid 8-bolt ring. Low bolt count, high frequency — and below half
// HP the claps come in threes instead of twos. Standing still after a clap is
// the mistake; the reappearance is always near YOU, not near where it was.
function aiBossClapper(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    if (e.telegraph <= 0) {
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((player.x + Math.cos(ang)*95)/TILE), Math.floor((player.y + Math.sin(ang)*95)/TILE));
      e.x = spot.x * TILE + TILE / 2; e.y = spot.y * TILE + TILE / 2;
      e.submerged = false; e.shielded = false;
      dnbRing(game, e, 8, 215, 2, '#e08a3a', Math.atan2(player.y - e.y, player.x - e.x), 0, 0);
      e.clapCount--;
      e.attackTimer = (e.clapCount > 0) ? 0.55 : Util.rand(1.7, 2.3);
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.8, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) {
      if (e.clapCount <= 0) e.clapCount = (e.hp < e.maxHp * 0.5) ? 3 : 2;
      e.submerged = true; e.shielded = true; e.telegraph = 0.45;
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

// NHM DNB (12A) — BUILDUP AND DROP. It stops dead and shakes for two full
// seconds, feeding adds into the room the whole time; that window is the only
// free damage in the fight. Then the drop: four gapped walls in a row, each
// rotated three slots off the last, so the safe lane WALKS and the answer is
// to read it and move with it rather than to find a corner. Adds are capped at
// 8 lifetime via the numeric e.minionsSpawned counter (bonecaller's pattern —
// the Boss constructor seeds that field `false`, hence the `|| 0` coercion).
function aiBossNhm(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.buildTimer > 0) {
    e.buildTimer -= dt;
    e.hitFlash = 0.1; // the buildup tell — rooted and juddering
    const spawned = e.minionsSpawned || 0;
    e.summonTimer -= dt;
    if (e.summonTimer <= 0 && spawned < 8) {
      e.summonTimer = 0.85;
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((e.x + Math.cos(ang)*80)/TILE), Math.floor((e.y + Math.sin(ang)*80)/TILE));
      node.enemies.push(new Enemy(ENEMY_TYPES.icecrawler, spot.x, spot.y, game.dungeon.floorNum));
      e.minionsSpawned = spawned + 1;
    }
    if (e.buildTimer <= 0) {
      e.dropShots = 4; e.shotTimer = 0;
      e.dropAngle = Math.atan2(player.y - e.y, player.x - e.x);
    }
  } else if (e.dropShots > 0) {
    e.shotTimer -= dt;
    if (e.shotTimer <= 0) {
      e.shotTimer = 0.18;
      const n = 14, wave = 4 - e.dropShots;
      dnbRing(game, e, n, 175, 2, '#2ec9a0', e.dropAngle, (wave * 3) % n, 3);
      e.dropShots--;
      if (e.dropShots <= 0) e.attackTimer = Util.rand(2.2, 2.8);
    }
  } else {
    chaseSeek(game, e, player.x, player.y, 0.55, dt);
    e.attackTimer -= dt;
    // attackTimer is deliberately left expired here: the buildup/drop branches
    // above own the boss until the drop finishes and re-arms it.
    if (e.attackTimer <= 0) { e.buildTimer = 2.0; e.summonTimer = 0.5; }
  }
}

// VANILLA DNB (12B) — SMOOTH OPERATOR. A three-armed sweep that rotates
// slowly across the whole arena for three seconds (backing off does nothing;
// you walk WITH the rotation), alternating with a short shielded phase where
// it parks and licks its wounds. The regen is small — ~2.5% of its bar — so
// the shield is a tempo loss to wait out, not a damage race you can lose.
function aiBossVanillaDnb(game, e, dt){
  const player = game.player;
  if (e.shielded) {
    e.regenTimer -= dt;
    e.hitFlash = 0.1;
    chaseSeek(game, e, player.x, player.y, 0.2, dt);
    e.healTimer -= dt;
    if (e.healTimer <= 0) {
      e.healTimer = 0.5;
      e.hp = Math.min(e.maxHp, e.hp + Math.max(1, Math.round(e.maxHp * 0.005)));
    }
    if (e.regenTimer <= 0) { e.shielded = false; e.attackTimer = Util.rand(1.0, 1.6); }
  } else if (e.sweepTimer > 0) {
    e.sweepTimer -= dt;
    e.spinAngle += 1.5 * e.sweepDir * dt;
    e.fireTimer -= dt;
    if (e.fireTimer <= 0) {
      e.fireTimer = 0.1;
      for (let a = 0; a < 3; a++) {
        fireProjectileAngle(game, e, e.spinAngle + a * (Math.PI * 2 / 3), 165, 2, { color:'#f0e0c0', radius:5 });
      }
    }
    if (e.sweepTimer <= 0) e.attackTimer = Util.rand(1.4, 2.0);
  } else {
    chaseSeek(game, e, player.x, player.y, 0.6, dt);
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) {
      if (Math.random() < 0.35) { e.shielded = true; e.regenTimer = 2.4; e.healTimer = 0.5; }
      else {
        e.sweepTimer = 3.0;
        e.sweepDir = Math.random() < 0.5 ? -1 : 1;
        e.spinAngle = Math.atan2(player.y - e.y, player.x - e.x); // first arm starts on the player
        e.fireTimer = 0;
      }
    }
  }
}

// THE ONE TRUE DNB (13) — THE FINALE. Five HP bands, each a compressed
// version of one of the four above, and a last band that layers two of them:
// the sweep never stops while the claps punch through it. Every band change is
// telegraphed the same way — one gold ring pulse, then a full second where it
// stands still and does nothing at all — so the player always gets told the
// rules just changed. Sub-pattern state is wiped on every transition so the
// outgoing phase can never fire a tail into the incoming one.
function aiBossOneTrueDnb(game, e, dt){
  const node = game.currentRoom, player = game.player;
  const frac = e.hp / e.maxHp;
  const want = (frac > 0.78) ? 0 : (frac > 0.56) ? 1 : (frac > 0.34) ? 2 : (frac > 0.15) ? 3 : 4;
  if (want !== e.phaseIndex) {
    e.phaseIndex = want;
    e.phaseShift = 1.0;
    e.burstShots = 0; e.dropShots = 0; e.clapCount = 0;
    e.sweepTimer = 0; e.buildTimer = 0; e.telegraph = 0;
    e.submerged = false; e.shielded = false;
    e.attackTimer = 0.2;
    dnbRing(game, e, 16, 130, 2, '#ffd447', Math.random() * Math.PI * 2, 0, 0);
  }
  if (e.phaseShift > 0) {
    e.phaseShift -= dt;
    e.hitFlash = 0.1;
    return; // the readable beat between phases — it does nothing at all
  }

  if (e.phaseIndex === 0) {
    // BASSLINE, compressed — same bar as Plapper, one beat shorter
    if (e.burstShots > 0) {
      e.shotTimer -= dt;
      if (e.shotTimer <= 0) {
        e.shotTimer = 0.12;
        fireProjectileAt(game, e, player.x, player.y, 260, 2, { color:'#ffd447', radius:5 });
        e.burstShots--;
        if (e.burstShots <= 0) e.attackTimer = Util.rand(1.0, 1.4);
      }
    } else {
      chaseSeek(game, e, player.x, player.y, 0.9, dt);
      e.attackTimer -= dt;
      if (e.attackTimer <= 0) {
        e.barCount++;
        if (e.barCount % 3 === 0) {
          dnbRing(game, e, 18, 155, 2, '#ffd447', Math.random() * Math.PI * 2, Math.floor(Math.random() * 18), 2);
          e.attackTimer = Util.rand(1.2, 1.6);
        } else { e.burstShots = 5; e.shotTimer = 0; }
      }
    }
  } else if (e.phaseIndex === 1) {
    // SNARE, compressed — Clapper's blink-clap, always in pairs
    if (e.telegraph > 0) {
      e.telegraph -= dt;
      if (e.telegraph <= 0) {
        const ang = Math.random() * Math.PI * 2;
        const spot = findNearestFloor(node, Math.floor((player.x + Math.cos(ang)*95)/TILE), Math.floor((player.y + Math.sin(ang)*95)/TILE));
        e.x = spot.x * TILE + TILE / 2; e.y = spot.y * TILE + TILE / 2;
        e.submerged = false; e.shielded = false;
        dnbRing(game, e, 8, 215, 2, '#ffd447', Math.atan2(player.y - e.y, player.x - e.x), 0, 0);
        e.clapCount--;
        e.attackTimer = (e.clapCount > 0) ? 0.55 : Util.rand(1.4, 1.9);
      }
    } else {
      chaseSeek(game, e, player.x, player.y, 0.8, dt);
      e.attackTimer -= dt;
      if (e.attackTimer <= 0) {
        if (e.clapCount <= 0) e.clapCount = 2;
        e.submerged = true; e.shielded = true; e.telegraph = 0.45;
      }
    }
  } else if (e.phaseIndex === 2) {
    // DROP, compressed — NHM's buildup is halved and spawns nothing
    if (e.buildTimer > 0) {
      e.buildTimer -= dt;
      e.hitFlash = 0.1;
      if (e.buildTimer <= 0) {
        e.dropShots = 3; e.shotTimer = 0;
        e.dropAngle = Math.atan2(player.y - e.y, player.x - e.x);
      }
    } else if (e.dropShots > 0) {
      e.shotTimer -= dt;
      if (e.shotTimer <= 0) {
        e.shotTimer = 0.18;
        const n = 14, wave = 3 - e.dropShots;
        dnbRing(game, e, n, 180, 2, '#ffd447', e.dropAngle, (wave * 3) % n, 3);
        e.dropShots--;
        if (e.dropShots <= 0) e.attackTimer = Util.rand(1.8, 2.4);
      }
    } else {
      chaseSeek(game, e, player.x, player.y, 0.55, dt);
      e.attackTimer -= dt;
      if (e.attackTimer <= 0) e.buildTimer = 1.1;
    }
  } else if (e.phaseIndex === 3) {
    // SWEEP, compressed — Vanilla's rotating arm, no shield phase
    if (e.sweepTimer > 0) {
      e.sweepTimer -= dt;
      e.spinAngle += 1.5 * e.sweepDir * dt;
      e.fireTimer -= dt;
      if (e.fireTimer <= 0) {
        e.fireTimer = 0.11;
        for (let a = 0; a < 3; a++) {
          fireProjectileAngle(game, e, e.spinAngle + a * (Math.PI * 2 / 3), 170, 2, { color:'#ffd447', radius:5 });
        }
      }
      if (e.sweepTimer <= 0) e.attackTimer = Util.rand(1.3, 1.8);
    } else {
      chaseSeek(game, e, player.x, player.y, 0.6, dt);
      e.attackTimer -= dt;
      if (e.attackTimer <= 0) {
        e.sweepTimer = 2.6;
        e.sweepDir = Math.random() < 0.5 ? -1 : 1;
        e.spinAngle = Math.atan2(player.y - e.y, player.x - e.x);
        e.fireTimer = 0;
      }
    }
  } else {
    // LAYERED — the sweep never stops, and clap rings punch through it. It
    // barely moves here, so the arena is the enemy rather than the boss.
    e.spinAngle += 1.4 * e.sweepDir * dt;
    e.fireTimer -= dt;
    if (e.fireTimer <= 0) {
      e.fireTimer = 0.12;
      for (let a = 0; a < 3; a++) {
        fireProjectileAngle(game, e, e.spinAngle + a * (Math.PI * 2 / 3), 160, 2, { color:'#ffd447', radius:5 });
      }
    }
    chaseSeek(game, e, player.x, player.y, 0.35, dt);
    if (e.telegraph > 0) {
      e.telegraph -= dt;
      e.hitFlash = 0.1;
      if (e.telegraph <= 0) {
        dnbRing(game, e, 14, 210, 2, '#ffd447', Math.atan2(player.y - e.y, player.x - e.x), 0, 0);
        e.attackTimer = Util.rand(2.2, 2.8);
      }
    } else {
      e.attackTimer -= dt;
      if (e.attackTimer <= 0) e.telegraph = 0.5;
    }
  }

  if (!e.minionsSpawned && e.hp < e.maxHp * 0.56) {
    e.minionsSpawned = true;
    for (let i = 0; i < 3; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((e.x + Math.cos(ang)*90)/TILE), Math.floor((e.y + Math.sin(ang)*90)/TILE));
      node.enemies.push(new Enemy(ENEMY_TYPES.junglestalker, spot.x, spot.y, game.dungeon.floorNum));
    }
  }
  if (!e.minions2 && e.hp < e.maxHp * 0.2) {
    e.minions2 = true;
    for (let i = 0; i < 2; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spot = findNearestFloor(node, Math.floor((e.x + Math.cos(ang)*90)/TILE), Math.floor((e.y + Math.sin(ang)*90)/TILE));
      node.enemies.push(new Enemy(ENEMY_TYPES.glacierbeast, spot.x, spot.y, game.dungeon.floorNum));
    }
  }
}

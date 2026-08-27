'use strict';
/* ============================================================
   systems/ai-crypt2.js — Phase 19. Nine more Crypt enemies, this
   batch built around interacting with something OTHER than the
   player directly — the room's own pickups, another enemy, the
   room's terrain, or the room's own death count — rather than a new
   flavor of chase/shoot/dash. All nine are `onlyFloorNum:0` (see
   room.js's resolveGenericEnemy) — literally the first floor of the
   run, not all of stage 0's two-floor window.
   ============================================================ */

// THIEF — Grave Robber. Beelines for the nearest live pickup in the room;
// on contact, removes it from node.pickups (it just vanishes) and carries
// it while fleeing the player for the rest of its life. Falls back to a
// plain chase if the room has no pickups left to steal. What it's carrying
// gets dropped back at its death spot — see combat-2.js's handleEnemyDeath.
ENEMY_BEHAVIOR_HANDLERS.thief = function(game, e, dt){
  const node = game.currentRoom, player = game.player;
  if (e.stolenPickup) {
    const v = seekVector(e, player.x, player.y);
    tryMoveEntity(e, node, node.obstacles, -v.x * e.speed * dt, -v.y * e.speed * dt);
    return;
  }
  let target = null, bestD = Infinity;
  for (const p of node.pickups) {
    if (p.collected) continue;
    const d = Util.dist2(e.x, e.y, p.x, p.y);
    if (d < bestD) { bestD = d; target = p; }
  }
  if (!target) { aiChase(game, e, dt); return; }
  if (Util.dist(e.x, e.y, target.x, target.y) < e.radius + target.radius + 4) {
    const idx = node.pickups.indexOf(target);
    if (idx !== -1) node.pickups.splice(idx, 1);
    e.stolenPickup = target;
    return;
  }
  chaseSeek(game, e, target.x, target.y, 1, dt);
};

// TRAP LID — Coffin Lid. Inert (no movement, no threat) until the player
// steps inside triggerRange; one telegraph, one committed lunge, then
// e.spent locks it harmless and immobile forever — see combat-3.js's
// suppressPlayerContact. Never resets, unlike 'pouncer' — this is a trap
// you get once, not an archetype that keeps ambushing.
ENEMY_BEHAVIOR_HANDLERS.trapLid = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  if (e.spent) return;
  if (e.dashing) {
    tryMoveEntity(e, node, node.obstacles, e.dashVX * dt, e.dashVY * dt);
    e.dashTimer -= dt;
    if (e.dashTimer <= 0) { e.dashing = false; e.spent = true; }
    return;
  }
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    e.hitFlash = (Math.sin(e.telegraph * 28) > 0) ? 0.14 : 0;
    if (e.telegraph <= 0) {
      const v = seekVector(e, player.x, player.y);
      e.dashing = true; e.dashTimer = t.lungeDuration || 0.5;
      e.dashVX = v.x * e.speed * (t.lungeSpeed || 6);
      e.dashVY = v.y * e.speed * (t.lungeSpeed || 6);
    }
    return;
  }
  if (Util.dist(e.x, e.y, player.x, player.y) < (t.triggerRange || 90)) e.telegraph = t.telegraphTime || 0.35;
};

// CHAINLINK — Chain Rattler. Spawns as a pair (type.groupSize:2, see
// room.js). Chases like an ordinary chaser, plus a tether: if it ever
// drifts past chainLength from its nearest same-type partner, it gets an
// extra pull back toward it on top of its normal movement. The other half
// of the link — dying kills the partner too — lives in combat-2.js's
// handleEnemyDeath (type.linkedDeath), not here.
ENEMY_BEHAVIOR_HANDLERS.chainlink = function(game, e, dt){
  const node = game.currentRoom, t = e.type;
  aiChase(game, e, dt);
  let partner = null, bestD = Infinity;
  for (const other of node.enemies) {
    if (other === e || other.isDead || other.type.id !== e.type.id) continue;
    const d = Util.dist2(e.x, e.y, other.x, other.y);
    if (d < bestD) { bestD = d; partner = other; }
  }
  if (!partner) return;
  const maxD = t.chainLength || 130;
  const d = Math.sqrt(bestD);
  if (d > maxD) {
    const dx = partner.x - e.x, dy = partner.y - e.y, len = d || 1;
    tryMoveEntity(e, node, node.obstacles, (dx / len) * e.speed * 1.4 * dt, (dy / len) * e.speed * 1.4 * dt);
  }
};

// BONE PILER — starts exposed, slowly wanders, and the longer it survives
// unbothered the more of the pile it's built: e.shielded flips on once
// pileTime passes, flips back off for a shorter exposedTime, and repeats.
// Rush it early and it's as soft as anything else in the Crypt; leave it
// alone and it starts tanking hits. On death it always breaks apart into
// 2 Bone Crawlers (spawnFliesOnDeath — generic despite the name, see
// crypt-extra.js's original comment).
ENEMY_BEHAVIOR_HANDLERS.bonepiler = function(game, e, dt){
  const t = e.type;
  if (e.armorTimer === undefined) { e.armorTimer = t.exposedTime || 2.5; e.shielded = false; }
  e.armorTimer -= dt;
  if (e.armorTimer <= 0) {
    e.shielded = !e.shielded;
    e.armorTimer = e.shielded ? (t.pileTime || 5) : (t.exposedTime || 2.5);
  }
  aiWander(game, e, dt);
};

// CURSER — Epitaph Reader. Fully stationary. On a cooldown, opens a
// growing curse (a real radius, grown over curseGrowTime, with a fast
// blink as the tell) centered on itself; if the player is still inside
// that radius the instant it finishes growing, they're frozen briefly
// (player.freezeTimer — the same real mechanic Sand Trap/Quicksand/Tide
// Pool already use, just the first time an ENEMY causes it instead of
// terrain). Area denial by "don't still be there when it closes," not a
// dodgeable bolt.
ENEMY_BEHAVIOR_HANDLERS.curser = function(game, e, dt){
  const player = game.player, t = e.type;
  if (e.curseTimer === undefined) e.curseTimer = Util.rand(1.2, 2);
  if (e.curseActive) {
    e.curseGrow += dt;
    e.hitFlash = (Math.sin(e.curseGrow * 14) > 0) ? 0.12 : 0;
    const growTime = t.curseGrowTime || 1.6;
    if (e.curseGrow >= growTime) {
      if (!e.curseApplied) {
        const R = t.curseMaxRadius || 90;
        if (Util.dist(e.x, e.y, player.x, player.y) < R) {
          player.freezeTimer = Math.max(player.freezeTimer, t.curseFreeze || 0.8);
          Sound.play('statusFreeze');
        }
        e.curseApplied = true;
      }
      e.curseFade = (e.curseFade || 0) + dt;
      if (e.curseFade > 0.4) {
        e.curseActive = false;
        e.curseTimer = Util.rand(t.curseCooldownMin || 3, t.curseCooldownMax || 4.5);
      }
    }
    return;
  }
  e.curseTimer -= dt;
  if (e.curseTimer <= 0) {
    e.curseActive = true; e.curseGrow = 0; e.curseApplied = false; e.curseFade = 0;
    game.explosions.push(new Explosion(e.x, e.y, 20));
    game.floatTexts.push(new FloatText(e.x, e.y - 22, '☠', '#b06ad0'));
  }
};

// MOURNER — harmless-feeling plain chaser (contact damage still applies —
// it's not e.type.harmless) that watches the room's own death count. The
// instant any OTHER enemy in the room dies, it enrages once, permanently
// (e.enraged — the same field the extended boss set already uses for its
// own hp-threshold enrages, just triggered by something outside itself
// instead of its own health).
ENEMY_BEHAVIOR_HANDLERS.mourner = function(game, e, dt){
  const node = game.currentRoom, t = e.type;
  if (e.mournerDeadCount === undefined) e.mournerDeadCount = node.enemies.filter(x => x.isDead).length;
  const deadNow = node.enemies.filter(x => x.isDead).length;
  if (!e.enraged && deadNow > e.mournerDeadCount) {
    e.enraged = true;
    e.speed *= t.enrageSpeedMult || 1.8;
    e.dmg = Math.max(1, Math.round(e.dmg * (t.enrageDmgMult || 1.6)));
    game.floatTexts.push(new FloatText(e.x, e.y - 20, 'Enraged!', '#c93a3a'));
  }
  e.mournerDeadCount = deadNow;
  aiChase(game, e, dt);
};

// SEXTON — wanders like it's tending the grounds, no threat of its own,
// but on a cooldown it silently locks the player's CURRENT position
// (e.lastPX/lastPY — the same fields 'sentry' already carries, see
// entities.js) and starts a long telegraph. Only once that telegraph
// finishes does a real Obstacle('pit') actually open at the spot it
// locked — punishing standing still far more than approaching it, the
// opposite read from every aimed-shot threat in the roster.
ENEMY_BEHAVIOR_HANDLERS.sexton = function(game, e, dt){
  const node = game.currentRoom, player = game.player, t = e.type;
  aiWander(game, e, dt);
  if (e.telegraph > 0) {
    e.telegraph -= dt;
    e.hitFlash = (Math.sin(e.telegraph * 16) > 0) ? 0.1 : 0;
    if (e.telegraph <= 0) {
      const tx = Math.floor(e.lastPX / TILE), ty = Math.floor(e.lastPY / TILE);
      const already = node.obstacles.some(o => !o.destroyed && Math.floor(o.x / TILE) === tx && Math.floor(o.y / TILE) === ty);
      if (!already) {
        const spot = findNearestFloor(node, tx, ty);
        node.obstacles.push(new Obstacle('pit', spot.x, spot.y));
      }
    }
    return;
  }
  e.attackTimer -= dt;
  if (e.attackTimer <= 0) {
    e.attackTimer = Util.rand(t.digCooldownMin || 3, t.digCooldownMax || 4.5);
    e.lastPX = player.x; e.lastPY = player.y;
    e.telegraph = t.telegraphTime || 1.2;
  }
};

// Shared "the lid cracks open and something crawls out" payload for both
// Sarcophagus variants below — a stationary spawner, not a mobile threat.
function sarcophagusOpen(game, e, t){
  const node = game.currentRoom;
  const n = t.flySpawnCount || 3;
  const childType = ENEMY_TYPES[t.spawnFlyId || 'dnbfly'];
  if (!childType) return;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + Math.random() * 0.6;
    const spot = findNearestFloor(node, Math.floor((e.x + Math.cos(ang) * 40) / TILE), Math.floor((e.y + Math.sin(ang) * 40) / TILE));
    node.enemies.push(new Enemy(childType, spot.x, spot.y, game.dungeon.floorNum));
  }
  e.hitFlash = 0.3;
}

// SARCOPHAGUS — fully stationary heavy tank. Periodically cracks open and
// vomits a small handful of DNB flies into the room before sealing back
// up — a themed live spawner, not another mobile attacker.
ENEMY_BEHAVIOR_HANDLERS.sarcophagus = function(game, e, dt){
  const t = e.type;
  e.attackTimer -= dt;
  if (e.attackTimer <= 0) {
    e.attackTimer = Util.rand(t.openCooldownMin || 4, t.openCooldownMax || 6);
    sarcophagusOpen(game, e, t);
  }
};

// ARMORED SARCOPHAGUS — the same stationary spawner, plus its own
// independent shield cycle (e.shielded, toggled directly rather than
// going through the behavior==='shielded' switch case, which this isn't)
// and a nastier fly to vomit (dnbredfly by default instead of the plain
// harmless dnbfly).
ENEMY_BEHAVIOR_HANDLERS.sarcophagusArmored = function(game, e, dt){
  const t = e.type;
  if (e.armorTimer === undefined) { e.armorTimer = t.armorTime || 4; e.shielded = true; }
  e.armorTimer -= dt;
  if (e.armorTimer <= 0) {
    e.shielded = !e.shielded;
    e.armorTimer = e.shielded ? (t.armorTime || 4) : (t.vulnTime || 2.5);
  }
  e.attackTimer -= dt;
  if (e.attackTimer <= 0) {
    e.attackTimer = Util.rand(t.openCooldownMin || 4, t.openCooldownMax || 6);
    sarcophagusOpen(game, e, t);
  }
};

'use strict';
// systems/combat-4.js — split from combat.js (part 4/4).
// once. No knockback, no crit, no on-hit statuses — a plain, predictable
// burst rather than a weapon hit (bosses are immune, same rule every other
// on-hit status already follows — see applyOnHitStatuses).
function damageAllEnemies(game, amount){
  const node = game.currentRoom;
  for (const e of node.enemies) {
    if (e.isDead || e.isBoss) continue;
    const applied = e.takeDamage(amount, 0, 0);
    if (applied) {
      game.floatTexts.push(new FloatText(e.x, e.y - 20, String(amount), '#fff'));
      if (e.isDead) handleEnemyDeath(game, e);
    }
  }
}

// Polaris star — freezes every living, non-boss enemy in the room at once.
function freezeAllEnemies(game, duration){
  const node = game.currentRoom;
  let count = 0;
  for (const e of node.enemies) {
    if (e.isDead || e.isBoss) continue;
    e.freezeTimer = Math.max(e.freezeTimer, duration);
    count++;
  }
  if (count) { bumpStat('enemiesFrozen', count, game); Sound.play('statusFreeze'); }
}

function openSecretPassage(game, slot){
  const node = game.currentRoom;
  if (!slot || slot.type !== 'secret' || slot.opened || !slot.cells) return;
  slot.opened = true;
  for (const c of slot.cells) node.tiles[c.y][c.x] = T_SECRET_OPEN;
  node.tileLayerDirty = true; // baked tile-layer cache (render.js) must redraw this room
  const nSlot = slot.pairedSlot;
  if (nSlot) {
    const neighbor = nSlot.room;
    ensureRoomBuilt(neighbor);
    if (nSlot.type === 'secret' && !nSlot.opened && nSlot.cells) {
      nSlot.opened = true;
      for (const c of nSlot.cells) neighbor.tiles[c.y][c.x] = T_SECRET_OPEN;
      neighbor.tileLayerDirty = true;
    }
    // Note: deliberately not forcing neighbor.doorsOpen here — secret-type
    // doors are gated by their own `opened` flag, not the room's doorsOpen,
    // and a neighbor that's a normal/boss room must stay combat-locked
    // until actually cleared, even if reached backwards via the secret room.
  }
  Sound.play('secretOpen');
  game.toast('A hidden passage crumbles open!');
  bumpStat('secretRoomsFound', 1, game);
}

/* ---------------------------------------------------------------
   Obstacles: hazard contact damage, fire's projectile spit, hitFlash decay
   --------------------------------------------------------------- */
function updateObstacles(game, dt){
  const node = game.currentRoom, player = game.player;
  for (const ob of node.obstacles) {
    if (ob.destroyed) continue;
    if (ob.hitFlash > 0) ob.hitFlash -= dt;
    if (ob.contactCooldownTimer > 0) ob.contactCooldownTimer -= dt;
    if (ob.kind === 'movingspike') updateMovingSpike(node, ob, dt);
    if (ob.isHazard) {
      const isFire = ob.kind === 'yellowfire' || ob.kind === 'redfire';
      const rr = ob.radius + player.radius;
      if (!(isFire && player.trinketId === 'cinderguard') &&
          Util.dist2(ob.x, ob.y, player.x, player.y) < rr * rr && ob.contactCooldownTimer <= 0) {
        // Hazards carry their own `dmg` (half-hearts) in OBSTACLES now, same
        // as enemies do — a cactus brush costs less than a spike trap. The
        // sacrifice spike keeps its old flat full heart regardless of floor,
        // because its damage IS the price list for its reward table (see
        // triggerSacrificeSpike) and must not drift with depth.
        const dmgAmt = ob.kind === 'spike' ? 1 : playerDamageAmount(game, false, ob.def.dmg);
        damagePlayer(game, dmgAmt, ob.kind);
        // sacrifice room spikes trigger less often than a cactus/fire tick —
        // gives the player a beat to see what each step spawned before the
        // next one can land — see triggerSacrificeSpike below
        ob.contactCooldownTimer = ob.kind === 'spike' ? 1.0 : 0.6;
        if (ob.kind === 'spike') triggerSacrificeSpike(game, node, ob);
      }
    }
    if (ob.isFreezeTrap) {
      const rr = ob.radius + player.radius;
      if (Util.dist2(ob.x, ob.y, player.x, player.y) < rr * rr && ob.contactCooldownTimer <= 0) {
        player.freezeTimer = Math.max(player.freezeTimer, ob.def.freezeDuration || 0.5);
        // cooldown deliberately longer than the freeze itself, so the
        // player always gets a window to step off before it can retrigger
        ob.contactCooldownTimer = 1.5;
        Sound.play('statusFreeze');
      }
    }
    if (ob.def.projectile) {
      ob.fireTimer -= dt;
      if (ob.fireTimer <= 0) {
        ob.fireTimer = ob.def.fireCooldown;
        // `homing` (purplefire) makes the bolt curve toward the player — see
        // updateProjectiles' obstacle-bolt homing branch
        const boltOpts = { color: ob.def.boltColor || '#e05a3a', radius: 5, homing: ob.def.homing || 0 };
        if (ob.def.angles) {
          // directional/pattern turrets: fixed compass direction(s), infinite range
          for (const ang of ob.def.angles) fireProjectileAngle(game, ob, ang, 170, ob.def.dmg || 1, boltOpts);
        } else if (ob.def.targeting) {
          // targeting turret: always aims at the player, infinite range
          fireProjectileAt(game, ob, player.x, player.y, 170, ob.def.dmg || 1, boltOpts);
        } else if (Util.dist(ob.x, ob.y, player.x, player.y) < 320) {
          // redfire — the original behavior: aims at the player, but only
          // within range, so it stays a close-quarters threat
          fireProjectileAt(game, ob, player.x, player.y, 170, ob.def.dmg || 1, boltOpts);
        }
      }
    }
  }
}

// Moving Spike — a wall-follower that hugs ONE specific side. Alongside its
// heading (ob.spikeDir) it remembers ob.spikeWallDir: the direction from the
// spike toward the wall/obstacle it is currently tracing. Every step is
// decided against that one side (turn into it when it ends, otherwise
// straight, otherwise turn away from whatever blocks the way ahead), so two
// structures standing next to each other can never quietly hand the spike
// off to one another the way a plain "is this tile next to *something*"
// test did. The wall side is only re-derived when the tile it was hugging
// actually opens up (bombed out), and cleared outright when the spike is
// genuinely away from everything.
const SPIKE_DIRS = [ { x:0, y:-1 }, { x:1, y:0 }, { x:0, y:1 }, { x:-1, y:0 } ]; // N, E, S, W

function spikeTileOpen(node, tx, ty, self){
  if (tx < 0 || ty < 0 || ty >= node.tileH || tx >= node.tileW) return false;
  if (node.tiles[ty][tx] !== T_FLOOR) return false; // stays off doors/secrets/walls/void on purpose
  for (const ob of node.obstacles) {
    if (ob === self || ob.destroyed || ob.isPit) continue; // pits don't block a floor-mounted trap
    if (ob.tx === tx && ob.ty === ty) return false;
  }
  return true;
}

function spikeIsBoundary(node, tx, ty, self){
  for (const d of SPIKE_DIRS) if (!spikeTileOpen(node, tx + d.x, ty + d.y, self)) return true;
  return false;
}

// which side of (tx,ty) is blocked — returns a SPIKE_DIRS index, preferring
// `prefer` and then the sides nearest it, or -1 if the tile touches nothing
function spikeFindWallDir(node, tx, ty, self, prefer){
  const order = prefer == null
    ? [0, 1, 2, 3]
    : [prefer, (prefer + 1) % 4, (prefer + 3) % 4, (prefer + 2) % 4];
  for (const idx of order) {
    const d = SPIKE_DIRS[idx];
    if (!spikeTileOpen(node, tx + d.x, ty + d.y, self)) return idx;
  }
  return -1;
}

// commits a move one tile along `dirIdx`, hugging `wallDirIdx` once there.
// The expected wall side is verified against the DESTINATION tile: if it
// isn't actually blocked (the wall got bombed out from under the spike) the
// side is re-derived there, and if that tile touches nothing at all the hug
// is dropped so the next pick re-acquires from scratch instead of steering
// off a heading that no longer means anything.
function spikeSetTarget(node, ob, dirIdx, wallDirIdx){
  const d = SPIKE_DIRS[dirIdx];
  const ntx = ob.tx + d.x, nty = ob.ty + d.y;
  ob.spikeDir = dirIdx;
  ob.spikeTargetTx = ntx; ob.spikeTargetTy = nty;
  const wd = SPIKE_DIRS[wallDirIdx];
  if (!spikeTileOpen(node, ntx + wd.x, nty + wd.y, ob)) { ob.spikeWallDir = wallDirIdx; return; }
  const alt = spikeFindWallDir(node, ntx, nty, ob, wallDirIdx);
  ob.spikeWallDir = alt >= 0 ? alt : null;
}

// nearest open tile in the room that touches something blocking — used only
// when the spike has lost its wall entirely, so it walks back to one instead
// of drifting around open floor
function nearestSpikeBoundaryTile(node, ob){
  let best = null, bestD = Infinity;
  for (let ty = 0; ty < node.tileH; ty++) {
    for (let tx = 0; tx < node.tileW; tx++) {
      const d = Math.abs(tx - ob.tx) + Math.abs(ty - ob.ty);
      if (d === 0 || d >= bestD) continue;
      if (!spikeTileOpen(node, tx, ty, ob) || !spikeIsBoundary(node, tx, ty, ob)) continue;
      best = { tx: tx, ty: ty }; bestD = d;
    }
  }
  return best;
}

function pickNextSpikeTile(node, ob){
  // (re-)acquire a wall when we don't have one — fresh spike, or one that
  // just lost the structure it was tracing
  if (ob.spikeWallDir == null) {
    const w = spikeFindWallDir(node, ob.tx, ob.ty, ob, ob.spikeDir == null ? null : (ob.spikeDir + 3) % 4);
    if (w >= 0) {
      ob.spikeWallDir = w;
      // the whole state machine below assumes the hugged side sits on the
      // left of the heading, so restore that invariant on every acquire
      // (spikeFindWallDir already preferred the side we were facing away
      // from, which keeps the heading whenever the geometry allows it)
      if (ob.spikeDir == null || (ob.spikeDir + 3) % 4 !== w) ob.spikeDir = (w + 1) % 4;
    }
  }
  if (ob.spikeWallDir != null) {
    const w = ob.spikeWallDir;
    let f = ob.spikeDir != null ? ob.spikeDir : (w + 1) % 4;
    if ((f + 3) % 4 !== w) { f = (w + 1) % 4; ob.spikeDir = f; } // wall re-derived onto another side (it got bombed) — face back along it
    const wd = SPIKE_DIRS[w];
    // the side we were hugging just ended — convex corner, turn into it and
    // keep the same structure on the same side
    if (spikeTileOpen(node, ob.tx + wd.x, ob.ty + wd.y, ob)) { spikeSetTarget(node, ob, w, (w + 3) % 4); return; }
    const fd = SPIKE_DIRS[f];
    // wall still beside us — carry straight on along it
    if (spikeTileOpen(node, ob.tx + fd.x, ob.ty + fd.y, ob)) { spikeSetTarget(node, ob, f, w); return; }
    // blocked ahead — concave corner, that blocker becomes the side we hug
    const r = (f + 1) % 4, rd = SPIKE_DIRS[r];
    if (spikeTileOpen(node, ob.tx + rd.x, ob.ty + rd.y, ob)) { spikeSetTarget(node, ob, r, f); return; }
    // dead end — turn around; what was on our right is the wall now
    const b = (f + 2) % 4, bd = SPIKE_DIRS[b];
    if (spikeTileOpen(node, ob.tx + bd.x, ob.ty + bd.y, ob)) { spikeSetTarget(node, ob, b, (b + 3) % 4); return; }
  }

  // fully boxed in — stay put (checked before the scans below so a walled-in
  // spike never pays for them every frame)
  let hasOpen = false;
  for (const d of SPIKE_DIRS) if (spikeTileOpen(node, ob.tx + d.x, ob.ty + d.y, ob)) { hasOpen = true; break; }
  if (!hasOpen) { ob.spikeTargetTx = ob.tx; ob.spikeTargetTy = ob.ty; return; }

  // no wall touching this tile. Step onto an adjacent tile that does touch
  // one, so the next pick re-acquires immediately.
  const order = ob.spikeDir == null
    ? Util.shuffle([0, 1, 2, 3]) // no heading yet — try every direction in a random order
    : [(ob.spikeDir + 1) % 4, ob.spikeDir, (ob.spikeDir + 3) % 4, (ob.spikeDir + 2) % 4]; // right, straight, left, back
  for (const idx of order) {
    const d = SPIKE_DIRS[idx];
    const ntx = ob.tx + d.x, nty = ob.ty + d.y;
    if (spikeTileOpen(node, ntx, nty, ob) && spikeIsBoundary(node, ntx, nty, ob)) {
      ob.spikeDir = idx; ob.spikeWallDir = null; ob.spikeTargetTx = ntx; ob.spikeTargetTy = nty; return;
    }
  }
  // nothing adjacent either — walk toward the nearest wall in the room
  // rather than dropping the requirement outright
  const goal = nearestSpikeBoundaryTile(node, ob);
  if (goal) {
    let bestIdx = -1, bestD = Infinity;
    for (let idx = 0; idx < 4; idx++) {
      const d = SPIKE_DIRS[idx];
      const ntx = ob.tx + d.x, nty = ob.ty + d.y;
      if (!spikeTileOpen(node, ntx, nty, ob)) continue;
      const dd = Math.abs(ntx - goal.tx) + Math.abs(nty - goal.ty);
      if (dd < bestD) { bestD = dd; bestIdx = idx; }
    }
    if (bestIdx >= 0) {
      const d = SPIKE_DIRS[bestIdx];
      ob.spikeDir = bestIdx; ob.spikeWallDir = null;
      ob.spikeTargetTx = ob.tx + d.x; ob.spikeTargetTy = ob.ty + d.y; return;
    }
  }
  // true last resort: any open tile at all, and we've definitively lost the
  // wall — clear the hug so nothing steers off stale state
  for (const idx of order) {
    const d = SPIKE_DIRS[idx];
    const ntx = ob.tx + d.x, nty = ob.ty + d.y;
    if (spikeTileOpen(node, ntx, nty, ob)) {
      ob.spikeDir = idx; ob.spikeWallDir = null; ob.spikeTargetTx = ntx; ob.spikeTargetTy = nty; return;
    }
  }
  ob.spikeTargetTx = ob.tx; ob.spikeTargetTy = ob.ty; // nowhere to go — stay put
}

function updateMovingSpike(node, ob, dt){
  if (ob.spikeTargetTx === null) pickNextSpikeTile(node, ob);
  const targetPx = ob.spikeTargetTx * TILE + TILE / 2, targetPy = ob.spikeTargetTy * TILE + TILE / 2;
  const dx = targetPx - ob.x, dy = targetPy - ob.y;
  const dist = Math.hypot(dx, dy);
  const speed = 46; // px/s — slower than most enemies, a telegraphed patrol
  if (dist < 2) {
    ob.x = targetPx; ob.y = targetPy;
    ob.tx = ob.spikeTargetTx; ob.ty = ob.spikeTargetTy;
    pickNextSpikeTile(node, ob);
  } else {
    ob.x += dx / dist * Math.min(dist, speed * dt);
    ob.y += dy / dist * Math.min(dist, speed * dt);
  }
}

// Sacrifice room spike — each step (i.e. each time the player takes the
// contact-damage tick above) advances ob.sacrificeStep by one and rolls
// whatever that step's fixed reward slot is, per the room type's design:
//   1: 50% 1 penny · 2: 50% a chest · 3: 50% 2 red hearts · 4: 75% 3 pennies
//   5: always 1 random enemy · 6-10: 50/50 a random pickup or 3 enemies
//   11: 50% a random item · 12+: 50% 1 penny, forever
function triggerSacrificeSpike(game, node, ob){
  ob.sacrificeStep = (ob.sacrificeStep || 0) + 1;
  const step = ob.sacrificeStep;
  const floorNum = game.dungeon.floorNum;
  bumpStat('sacrificeSpikesTriggered', 1, game); // see achievements.js's sacrificenovice/sacrificemaster

  function spot(){ return findClearFloorSpot(node, ob.tx + Util.randi(-2, 2), ob.ty + Util.randi(-2, 2)); }
  function spawnPickups(kind, n){ for (let i = 0; i < n; i++) { const s = spot(); spawnResolvedPickup(node, kind, s.x, s.y); } }
  function spawnEnemies(n){ for (let i = 0; i < n; i++) { const s = spot(); node.enemies.push(new Enemy(resolveGenericEnemy(floorNum, game.floorBranch), s.x, s.y, floorNum)); } }

  if (step === 1) { if (Util.chance(0.5)) spawnPickups('coin:penny', 1); }
  else if (step === 2) { if (Util.chance(0.5)) { const s = spot(); node.chests.push(new Chest(Util.weighted(CHEST_TYPE_POOL).id, s.x, s.y)); } }
  else if (step === 3) { if (Util.chance(0.5)) spawnPickups('heartRed', 2); }
  else if (step === 4) { if (Util.chance(0.75)) spawnPickups('coin:penny', 3); }
  else if (step === 5) { spawnEnemies(1); }
  else if (step >= 6 && step <= 10) { if (Util.chance(0.5)) spawnPickups(rollGenericPickupKind(), 1); else spawnEnemies(3); }
  else if (step === 11) { if (Util.chance(0.5)) { const item = pickItemFromPool('treasure'); if (item) addItemPedestal(node, item, ob.tx, ob.ty - 1); } }
  else { if (Util.chance(0.5)) spawnPickups('coin:penny', 1); } // 12+
}

function updateExplosions(game, dt){
  for (const ex of game.explosions) ex.life -= dt;
  game.explosions = game.explosions.filter(e => e.life > 0);
}

function updateFloatTexts(game, dt){
  for (const f of game.floatTexts) { f.life -= dt; f.y -= dt * 18; }
  game.floatTexts = game.floatTexts.filter(f => f.life > 0);
}

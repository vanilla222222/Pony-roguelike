'use strict';
// systems/combat-1.js — split from combat.js (part 1/4).
'use strict';
/* ============================================================
   combat.js — collision/movement helpers, player input & attacks,
   pickups/chests, enemy death handling, status-effect ticking,
   projectiles/bombs/explosions. Everything here takes the live
   `game` instance (see game.js) so state always reads from
   game.currentRoom / game.player directly — no stale copies.

   Enemy/boss *behavior* (the aiXxx functions) lives in ai.js —
   split out purely to keep "how does a thing move and decide to
   attack" separate from "what happens when it lands a hit".
   ============================================================ */

function normalizeAngle(a){ while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

// "how much does this hit cost the player", derived from whatever actually
// hit them. Every enemy/boss/obstacle def carries a `dmg:` field and the
// Bestiary has always displayed it — this is what finally makes that number
// real for contact/blast damage instead of a flat 0.5.
//
// UNITS: `dmg` is counted in HALF-HEARTS, so the whole system stays on the
// half-heart granularity the HUD draws. dmg:1 = half a heart (exactly the old
// flat non-boss value), dmg:2 = one heart, dmg:3 = a heart and a half.
//
// The late-game step keeps the old escalation intent — the old code doubled
// every hit from floorNum >= 6 (the Inferno) onward, and this adds one extra
// half-heart at the same threshold, which is the *same* number for the dmg:1
// enemies and bosses the old flat scale was implicitly tuned against.
//
// `dmgHalves` is optional: callers with no attacker at all (your own bomb,
// an untagged hazard) fall through to CONTACT_DMG_DEFAULT, which reproduces
// the old flat value exactly.
const CONTACT_DMG_DEFAULT = 1; // half-hearts — a sourceless hit costs what a plain grub used to
const CURRENT_PUSH_SPEED = 90; // px/s — the 4 "current" obstacles' push strength, see updatePlayer
function playerDamageAmount(game, isBoss, dmgHalves){
  let halves = dmgHalves > 0 ? dmgHalves : CONTACT_DMG_DEFAULT;
  if (game.dungeon.floorNum >= 6) halves += 1; // the Inferno onward hits one step harder
  let amount = halves * 0.5;
  // Stonewall — see items.js recalcPlayerStats. Applied before the snap so a
  // reduction can never land the player on a quarter-heart.
  if (isBoss) amount *= game.player.bossDamageTakenMult;
  // per-class fragility (Pony Bot's damageTakenMult, see data.js CLASSES) —
  // applies to every source that routes through here: contact, hazards,
  // bolts, bosses, explosions. 1 (no change) on every other class, so it's a
  // no-op. Phase 8c-2 — reads the per-instance shadow field (entities.js's
  // Player constructor) instead of player.def directly, so a skilltree.js
  // uniqueField node can tune it without ever writing through player.def.
  amount *= game.player.damageTakenMult || 1;
  // Phase 10 — GLOBAL DAMAGE CAP. No single hit, from any source (contact,
  // hazard, bolt, boss, explosion), can ever cost more than 4 hearts, however
  // large the attacker's `dmg` is or how many multipliers stack onto it. This
  // is the one funnel point every damage source in the game routes through, so
  // the cap needs no per-call-site enforcement. Applied AFTER the half-heart
  // snap so the cap value itself stays on the HUD's granularity.
  return Math.min(4, Math.max(0.5, Math.round(amount * 2) / 2)); // snap back onto half-heart granularity, then cap
}

// wraps Player.takeDamage with reactions that need the wider game state (the
// Player class itself has no reference to the room's enemy list) — every
// place the player actually takes a hit should call this instead of
// player.takeDamage() directly.
function damagePlayer(game, amount, source){
  const player = game.player;
  const invulnBefore = player.invulnTimer;
  player.takeDamage(amount, source);
  const hitLanded = player.invulnTimer > invulnBefore; // takeDamage only raises this on a hit that wasn't dodged/blocked/already-invuln
  // a short haptic bump alongside the 'playerHurt' sound (entities.js's
  // takeDamage) on handhelds — deliberately brief, and a silent no-op on
  // every desktop browser, which has no vibrate at all
  if (hitLanded && 'vibrate' in navigator) {
    try { navigator.vibrate(45); } catch (e) { /* best-effort, never break a hit */ }
  }
  if (hitLanded && player.passives.emberheart && Util.chance(0.10 * player.passives.emberheart)) {
    for (const e of game.currentRoom.enemies) {
      if (e.isDead || e.isBoss) continue;
      if (Util.dist(e.x, e.y, player.x, player.y) < 100) e.stunTimer = Math.max(e.stunTimer, 2);
    }
    Sound.play('statusStun');
  }
}

function isTileSolidForEntity(node, tx, ty){
  if (tx < 0 || ty < 0 || tx >= node.tileW || ty >= node.tileH) return true;
  const t = node.tiles[ty][tx];
  if (t === T_VOID || t === T_WALL || t === T_SECRET) return true;
  if (t === T_DOOR) return !node.doorsOpen;
  return false; // FLOOR or T_SECRET_OPEN
}

function findNearestFloor(node, tx, ty){
  if (node.tiles[ty] && node.tiles[ty][tx] === T_FLOOR) return { x: tx, y: ty };
  for (let rad = 1; rad < 24; rad++) {
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
        const nx = tx + dx, ny = ty + dy;
        if (ny < 0 || ny >= node.tileH || nx < 0 || nx >= node.tileW) continue;
        if (node.tiles[ny][nx] === T_FLOOR) return { x: nx, y: ny };
      }
    }
  }
  return { x: tx, y: ty };
}

function tileHasObstacle(node, tx, ty){
  for (const ob of node.obstacles) {
    // walkable obstacles (mud/sand trap) don't occupy their tile as far as
    // pickup drops and enemy spawns are concerned — otherwise the near-fully
    // mud-tiled maze rooms in roomTemplates.js would have nowhere to put
    // anything at all
    if (ob.destroyed || ob.isWalkable) continue;
    if (ob.tx === tx && ob.ty === ty) return true;
  }
  return false;
}

// like findNearestFloor, but also steers clear of rocks/pits/etc so pickups
// never spawn on top of an obstacle
function findClearFloorSpot(node, tx, ty){
  if (node.tiles[ty] && node.tiles[ty][tx] === T_FLOOR && !tileHasObstacle(node, tx, ty)) return { x: tx, y: ty };
  for (let rad = 1; rad < 24; rad++) {
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
        const nx = tx + dx, ny = ty + dy;
        if (ny < 0 || ny >= node.tileH || nx < 0 || nx >= node.tileW) continue;
        if (node.tiles[ny][nx] === T_FLOOR && !tileHasObstacle(node, nx, ny)) return { x: nx, y: ny };
      }
    }
  }
  return findNearestFloor(node, tx, ty); // fall back to ignoring obstacles rather than not spawning at all
}

function collidesAt(entity, x, y, node, obstacles){
  const r = entity.radius;
  const flying = !!(entity.canFly || entity.flies || entity.groundless); // groundless — Earth Pony's own "Skyfurrow" mechanic (Phase 11 un-bleed pass), same terrain-crossing behavior, her own flag rather than borrowing canFly
  const pts = [[0,0],[r*0.9,0],[-r*0.9,0],[0,r*0.9],[0,-r*0.9]];
  for (const [ox, oy] of pts) {
    const tx = Math.floor((x + ox) / TILE), ty = Math.floor((y + oy) / TILE);
    if (isTileSolidForEntity(node, tx, ty)) return true;
  }
  for (const ob of obstacles) {
    // walkable obstacles (mud/sand trap) never block, and hazards never block
    // UNLESS explicitly solid (Spiked Rock) — see entities.js's Obstacle
    // constructor for isWalkable/isHazard/solid
    if (ob.destroyed || ob.isWalkable || (ob.isHazard && !ob.solid)) continue;
    if (flying && !ob.alwaysBlocks) continue; // flight clears everything except tall obstacles
    if (Util.circleIntersect(x, y, r, ob.x, ob.y, ob.radius - 2)) return true;
  }
  return false;
}

// Pushable Bomb Barrel — walking into one shoves it a step in the player's
// movement direction, provided the tile beyond is open floor and clear of
// every other obstacle. Runs before tryMoveEntity so the barrel is already
// out of the way by the time the player's own collision check happens.
function tryPushObstacles(node, player, mx, my){
  if (mx === 0 && my === 0) return;
  for (const ob of node.obstacles) {
    if (ob.destroyed || !ob.pushable) continue;
    if (!Util.circleIntersect(player.x + mx, player.y + my, player.radius, ob.x, ob.y, ob.radius - 2)) continue;
    const nx = ob.x + mx, ny = ob.y + my;
    const tx = Math.floor(nx / TILE), ty = Math.floor(ny / TILE);
    if (isTileSolidForEntity(node, tx, ty)) continue;
    let blocked = false;
    for (const other of node.obstacles) {
      if (other === ob || other.destroyed || other.isPit || other.isWalkable) continue; // pits/mud/sand are flat ground, a barrel slides right over them
      if (Util.circleIntersect(nx, ny, ob.radius - 2, other.x, other.y, other.radius - 2)) { blocked = true; break; }
    }
    if (blocked) continue;
    ob.x = nx; ob.y = ny; ob.tx = tx; ob.ty = ty;
  }
}

function tryMoveEntity(entity, node, obstacles, mx, my){
  const startX = entity.x, startY = entity.y;
  const nx = entity.x + mx;
  if (!collidesAt(entity, nx, entity.y, node, obstacles)) entity.x = nx;
  const ny = entity.y + my;
  if (!collidesAt(entity, entity.x, ny, node, obstacles)) entity.y = ny;
  return { movedX: Math.abs(entity.x - startX) > 0.01, movedY: Math.abs(entity.y - startY) > 0.01 };
}

function clampToRoom(node, x, y){
  const tx = Util.clamp(Math.floor(x / TILE), 1, node.tileW - 2);
  const ty = Util.clamp(Math.floor(y / TILE), 1, node.tileH - 2);
  const f = findNearestFloor(node, tx, ty);
  return { x: f.x * TILE + TILE / 2, y: f.y * TILE + TILE / 2 };
}

/* ---------------------------------------------------------------
   Player
   --------------------------------------------------------------- */
function updatePlayer(game, input, dt){
  const player = game.player, node = game.currentRoom;
  if (player.isDead) { player.fireZone = null; return; } // a dead Changeling's fire goes out with her
  if (player.attackTimer > 0) player.attackTimer -= dt;
  if (player.invulnTimer > 0) player.invulnTimer -= dt;
  if (player.invincibleTimer > 0) player.invincibleTimer -= dt;
  if (player.speedBoostTimer > 0) player.speedBoostTimer -= dt;
  if (player.dmgFlashTimer > 0) player.dmgFlashTimer -= dt;
  if (player.freezeTimer > 0) player.freezeTimer -= dt; // Sand Trap — see combat.js updateObstacles
  // attack-layer styles (see attackStyles.js) — orbitBlades ticks every
  // frame regardless of attacking, delayed actions (echoShot's delayed
  // hit) tick down and fire independently of anything else this frame
  tickOrbitBlades(game, dt);
  tickDelayedActions(player, dt);

  let mx = 0, my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    mx /= len; my /= len;
    if (!input.mouseActive) player.facing = { x: mx, y: my };
  }
  if (input.mouseActive) {
    // input.mouseX/Y are in viewport (camera) space — convert to world space
    const worldMouseX = input.mouseX + game.camX, worldMouseY = input.mouseY + game.camY;
    const ang = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    player.facing = { x: Math.cos(ang), y: Math.sin(ang) };
  }

  // Changeling's green fire is a HELD zone, not a per-press shot, and needs
  // to run on the frames the button is up too (that's what despawns it) — so
  // it's updated here, BEFORE movement, rather than down with the normal
  // press-only attack dispatch. Running it early means the root-in-place
  // speed penalty below (miredInOwnFire) takes effect the same frame the
  // zone spawns or despawns, not one frame late.
  if (player.greenFireAttack) updateGreenFireAttack(game, input, dt);
  // Changedling's fire ring — always on, follows her every frame, no
  // input.attack gate at all (unlike the anchored zone above). Cheap no-op
  // when the flag is off. See updateFireRingAttack below.
  // Phase 11 un-bleed pass — Alicorn's own `innateStarRing` and Windigo's
  // own `innateBlizzardRing` both trigger the same ring mechanic under
  // their own flags rather than sharing Changedling's `innateFireRing`.
  if (player.innateFireRing || player.innateStarRing || player.innateBlizzardRing) updateFireRingAttack(game, dt);
  // Changeling Queen's summoned minions — cheap no-op when the flag is off.
  // See updateChangelingSummons below.
  updateChangelingSummons(game, dt);
  // Engineer Pony's turrets — building (held key, gated on canBuildTurrets)
  // and firing (any existing turrets in the room, gated on the room actually
  // having any) are both cheap no-ops when neither applies. See
  // updateTurretBuild/updatePlayerTurrets below.
  updateTurretBuild(game, dt, input);
  updatePlayerTurrets(game, dt);
  // Arcade room machines — resolves a pressed friendship/tools machine's
  // pre-rolled outcome once its spin delay elapses. Cheap no-op when the
  // current room has no node.machines or none are spinning. See
  // useArcadeMachine/updateArcadeMachines in systems/shop.js.
  updateArcadeMachines(game, dt);

  // Mud — half speed while standing on it; checked fresh every frame (no
  // lingering timer) so the slow ends the instant you step off
  const onMud = node.obstacles.some(ob => !ob.destroyed && ob.kind === 'mud' && Util.circleIntersect(player.x, player.y, player.radius, ob.x, ob.y, ob.radius));
  // Math.max, not multiplied — a timed speed active item and a "for the
  // room" speed star (Electra 1.5x, Vega 2x) don't stack multiplicatively,
  // whichever is stronger just wins for as long as it's in effect
  // Changeling roots herself in place to hold the green fire — same "fresh
  // every frame, no lingering timer" shape as onMud, so it drops the instant
  // the zone despawns (button-up), not on any kind of fade. Gated on
  // greenFireAttack specifically (not just !!player.fireZone) — the
  // Changedling's fire RING reuses the same fireZone field but is meant to
  // follow her at full speed, not root her in place.
  const miredInOwnFire = player.greenFireAttack && !!player.fireZone;
  const spd = player.speed * Math.max(player.speedBoostTimer > 0 ? 1.5 : 1, player.starSpeedMult) * (onMud ? 0.5 : 1) * (miredInOwnFire ? (player.fireZoneRootMult != null ? player.fireZoneRootMult : 0.25) : 1);
  // Sand Trap freezes movement entirely for a moment — aiming/attacking
  // still work, only stepping is locked (see the freezeTimer decrement above)
  player.moving = (mx !== 0 || my !== 0) && player.freezeTimer <= 0; // drives drawPony's walk cycle, see render.js
  if (player.freezeTimer <= 0) {
    let stepX = mx * spd * dt, stepY = my * spd * dt;
    // Currents (C-branch exclusive, see data.js's OBSTACLES) — a constant
    // push while standing in one, same "checked fresh every frame, no
    // lingering timer" shape as mud above. Added straight onto this frame's
    // step so it still goes through tryMoveEntity's collision handling below
    // — a current can push you around a corner but never through a wall —
    // and stacks with player input, so swimming against one is just slower
    // rather than impossible.
    for (const ob of node.obstacles) {
      if (!ob.destroyed && ob.def && ob.def.current && Util.circleIntersect(player.x, player.y, player.radius, ob.x, ob.y, ob.radius)) {
        stepX += ob.def.pushX * CURRENT_PUSH_SPEED * dt;
        stepY += ob.def.pushY * CURRENT_PUSH_SPEED * dt;
      }
    }
    tryPushObstacles(node, player, stepX, stepY);
    tryMoveEntity(player, node, node.obstacles, stepX, stepY);
  }

  // greenFireAttack/innateFireRing were already handled above (before
  // movement) — everyone else's attack still dispatches from the normal
  // press-only gate here.
  if (!player.greenFireAttack && !player.innateFireRing && !player.innateStarRing && !player.innateBlizzardRing) {
    if (input.attack) {
      if (player.attackType === 'melee') playerMeleeAttack(game);
      else if (player.charged) playerChargedBeamAttack(game, dt, input);
      else playerRangedAttack(game);
    } else if (player.charged) {
      player.chargeTimer = 0; // letting go early wastes whatever charge had built up
    }
  }

  checkDoorTransition(game, dt);
  updatePickups(game, dt);
  updateChests(game);
}

function playerMeleeAttack(game){
  const player = game.player, node = game.currentRoom;
  if (player.attackTimer > 0) return;
  player.attackTimer = player.meleeCooldown;
  Sound.play('meleeSwing');
  const ang = Math.atan2(player.facing.y, player.facing.x);
  const originX = player.x + Math.cos(ang) * 14;
  const originY = player.y + Math.sin(ang) * 14;
  game.swingFX = { x: originX, y: originY, ang, life: 0.14 };
  // Mirror Shard widens the swing's cone permanently — see data.js
  const coneHalfWidth = Math.min(Math.PI, Math.PI * 0.65 * (1 + 0.3 * (player.passives.mirrorshard || 0)));
  const layerHits = []; // attack-layer styles (see attackStyles.js) — every enemy this swing actually hit
  for (const e of node.enemies) {
    if (e.isDead) continue;
    const d = Util.dist(originX, originY, e.x, e.y);
    if (d < player.meleeRange + e.radius) {
      const angTo = Math.atan2(e.y - player.y, e.x - player.x);
      if (Math.abs(normalizeAngle(angTo - ang)) < coneHalfWidth) {
        if (dealPlayerDamage(game, e, ang)) {
          layerHits.push(e);
          runHitLayers(game, 'melee', { x: originX, y: originY, ang, hits: [e], dmg: player.meleeDamage });
        }
      }
    }
  }
  for (const ob of node.obstacles) {
    if (ob.destroyed || !ob.attackable) continue;
    const d = Util.dist(originX, originY, ob.x, ob.y);
    if (d < player.meleeRange + ob.radius) {
      const angTo = Math.atan2(ob.y - player.y, ob.x - player.x);
      if (Math.abs(normalizeAngle(angTo - ang)) < coneHalfWidth) damageObstacleHit(game, ob);
    }
  }
  // Diamond Dog's shockwave — the same sweep, same range, same cone, but it
  // also shatters plain rock, which nothing but a blast can normally touch
  // (rocks are destructible but not attackable, so the loop above skips them).
  if (player.shockwaveAttack) {
    for (const ob of node.obstacles) {
      if (ob.destroyed || (ob.kind !== 'rock' && ob.kind !== 'tallrock')) continue;
      const d = Util.dist(originX, originY, ob.x, ob.y);
      if (d >= player.meleeRange + ob.radius) continue;
      const angTo = Math.atan2(ob.y - player.y, ob.x - player.x);
      if (Math.abs(normalizeAngle(angTo - ang)) < coneHalfWidth) shatterRockByShockwave(game, ob);
    }
  }
  runCastLayers(game, 'melee', { x: originX, y: originY, ang, hits: layerHits, dmg: player.meleeDamage });
}

// Diamond Dog's rock-destroy path. Deliberately its OWN function rather than a
// detour through explodeAt's obstacle loop: a rock she claws apart must never
// run the bomb-blast reward code (prospector's pick/chip, the tinted-rock
// table), only her own flat rockCoinChance. Nothing here calls explodeAt and
// explodeAt never calls this, so the two paths can't overlap on one rock —
// whichever gets there first sets ob.destroyed and the other's loop skips it.
function shatterRockByShockwave(game, ob){
  const node = game.currentRoom, player = game.player;
  ob.destroyed = true;
  Sound.play('obstacleDestroy');
  bumpStat('obstaclesDestroyed', 1, game);
  bumpBestiaryCount('objectsDestroyed', ob.kind, 1); // see js/bestiary.js
  // NB: no 'rocksBombed' bump — she didn't bomb it, and that stat gates the
  // Diamond Dog unlock itself (see her unlockHint)
  // Phase 8c-2 — reads the per-instance shadow field instead of player.def
  // directly, so a skilltree.js uniqueField node can tune it (for Diamond Dog
  // herself, or for Earth Pony via a borrowed-mechanic uniqueFlag node).
  if (Util.chance(player.rockCoinChance || 0)) {
    node.pickups.push(new Pickup('coin', ob.tx, ob.ty, Util.weighted(COIN_TYPES)));
  }
}

// attackable hazards (fire) track a hit COUNT, not damage points — "3 hits and it goes out"
function damageObstacleHit(game, ob){
  if (ob.destroyed || !ob.attackable) return;
  ob.hp -= 1;
  ob.hitFlash = 0.15;
  if (ob.hp <= 0) {
    ob.destroyed = true;
    Sound.play('obstacleDestroy');
    bumpStat('obstaclesDestroyed', 1, game);
    bumpBestiaryCount('objectsDestroyed', ob.kind, 1); // see js/bestiary.js
    if (ob.def.heartDropChance && Util.chance(ob.def.heartDropChance)) {
      game.currentRoom.pickups.push(new Pickup('heartRed', ob.tx, ob.ty));
    }
    // Bomb Barrel — 3 hits destroys it, same as fire, but destroying it
    // also detonates it (see explodeAt below)
    if (ob.def.explodesOnDestroy) {
      bumpStat('bombBarrelsDetonated', 1, game); // see achievements.js's barrelpopper/chainbomber
      explodeAt(game, ob.x, ob.y, 92 * (game.player.bombRadiusMult || 1));
    }
  } else {
    Sound.play('obstacleHit');
  }
}

function playerRangedAttack(game){
  const player = game.player;
  if (player.laser) { playerLaserAttack(game); return; } // Pony Bot
  if (player.attackTimer > 0) return;
  player.attackTimer = player.fireCooldown;
  Sound.play('rangedShot');
  bumpStat('shotsFired', 1, game);
  const baseAng = Math.atan2(player.facing.y, player.facing.x);
  const count = 1 + player.multishotExtra;
  const spread = 0.16;
  // Breezie — its bolts never expire from distance, only ever stopped by a
  // wall (see updateProjectiles' isTileSolidForEntity check); 999s is just
  // "forever" in practice, nothing survives that long anyway
  const life = player.unlimitedRange ? 999 : (player.rangeTiles * TILE) / player.boltSpeed; // however long it takes to travel exactly rangeTiles at this bolt's own speed
  const firedBolts = []; // attack-layer styles (see attackStyles.js) — e.g. ricochetBolt tags these
  for (let i = 0; i < count; i++) {
    const ang = baseAng + (count === 1 ? 0 : (i - (count - 1) / 2) * spread);
    const vx = Math.cos(ang) * player.boltSpeed, vy = Math.sin(ang) * player.boltSpeed;
    const proj = new Projectile(
      player.x + Math.cos(ang) * 16, player.y + Math.sin(ang) * 16,
      vx, vy, player.rangedDamage, 'player', { color:'#c9c3ff', radius:6, pierce: player.tearFlags.pierce, life,
        homing: player.tearFlags.homing, spectral: player.tearFlags.spectral, explosive: player.tearFlags.explosive }
    );
    proj.attackTrigger = 'ranged'; // read by updateProjectiles' hit site to fire runHitLayers
    game.projectiles.push(proj);
    firedBolts.push(proj);
  }
  runCastLayers(game, 'ranged', { x: player.x, y: player.y, ang: baseAng, hits: [], dmg: player.rangedDamage, projectiles: firedBolts });
}

// Changeling's signature attack: a pool of green changeling fire. Held, not
// pressed — the pool is planted once, fireZoneRange px ahead of wherever she
// was facing at the moment the button went down, and stays ANCHORED there
// (walking away leaves it behind) until the button comes up, at which point it
// vanishes the same frame. Deliberately NOT an Obstacle: it's plain state on
// the Player, ticked here and drawn in render.js, and never touches
// node.obstacles.
//
// Damage is continuous rather than per-shot: rangedDamage x (1/fireCooldown)
// per second, i.e. exactly the DPS her old bolts had, spread smoothly over the
// frames. Kill credit/on-death effects go through handleEnemyDeath the same as
// every other damage source. Lifesteal (onHitLanded) and the hit sound/float
// text are throttled to one "shot" worth per fireCooldown, so holding the
// button isn't a 60x-a-second lifesteal roll.
function updateGreenFireAttack(game, input, dt){
  const player = game.player, node = game.currentRoom;
  if (!input.attack) { player.fireZone = null; return; } // released → gone this frame, no cooldown, no fade
  // Phase 8c-2 — reads the per-instance shadow fields instead of player.def
  // directly, so a skilltree.js uniqueField node can tune the pool's size/reach.
  const range = player.fireZoneRange || 40;
  if (!player.fireZone) {
    player.fireZone = {
      x: player.x + player.facing.x * range,
      y: player.y + player.facing.y * range,
      radius: player.fireZoneRadius || 50,
      tickTimer: 0,
    };
    Sound.play('rangedShot');
  }
  const zone = player.fireZone;
  const dps = player.rangedDamage * (1 / Math.max(0.01, player.fireCooldown));
  const dmg = dps * dt;
  zone.tickTimer -= dt;
  const feedback = zone.tickTimer <= 0;
  if (feedback) zone.tickTimer = player.fireCooldown;
  const layerHits = []; // attack-layer styles (see attackStyles.js) — throttled to the same feedback tick, not every frame
  for (const e of node.enemies) {
    if (e.isDead) continue;
    if (Util.dist(zone.x, zone.y, e.x, e.y) > zone.radius + e.radius) continue;
    const applied = e.takeDamage(dmg, 0, 0);
    if (!applied) continue;
    if (feedback) {
      player.onHitLanded();
      Sound.play('enemyHit');
      applyOnHitStatuses(game, e);
      game.floatTexts.push(new FloatText(e.x, e.y - 20, (dps * player.fireCooldown).toFixed(1), '#5ae0a0'));
      layerHits.push(e);
      runHitLayers(game, 'firezone', { x: e.x, y: e.y, ang: Math.atan2(player.facing.y, player.facing.x), hits: [e], dmg: dps * player.fireCooldown });
    }
    if (e.isDead) { bumpStat('rangedKills', 1, game); handleEnemyDeath(game, e); }
  }
  if (feedback) runCastLayers(game, 'firezone', { x: zone.x, y: zone.y, ang: Math.atan2(player.facing.y, player.facing.x), hits: layerHits, dmg: dps * player.fireCooldown });
  // attackable obstacles (bomb barrels above all) — obstacles take damage in
  // discrete hit-count steps (see damageObstacleHit), not fractional HP, so
  // this rides the same feedback throttle as the lifesteal/sound proc above
  // rather than firing every frame
  if (feedback) {
    for (const ob of node.obstacles) {
      if (ob.destroyed || !ob.attackable) continue;
      if (Util.dist(zone.x, zone.y, ob.x, ob.y) > zone.radius + ob.radius) continue;
      damageObstacleHit(game, ob);
    }
  }
}

// Changedling's signature attack: the same shape as updateGreenFireAttack
// above, but always on (no input.attack gate at all) and RECOMPUTED to the
// player's own x/y every single frame instead of staying anchored where it
// was planted — that's what makes it read as a ring that follows her rather
// than a pool she leaves behind. Reuses the same player.fireZone field as
// the Changeling's greenFireAttack (only one of the two flags is ever true
// for a given class), so it also benefits for free from the existing
// room-entry/death null-outs (game.js's enterRoom, updatePlayer's isDead
// branch above) — nulling it there is harmless since it's rebuilt fresh
// the very next frame it's active anyway. Dispatch trigger is 'firering',
// not 'firezone', purely so it's distinguishable in any future debugging —
// mechanically any hit-layer handler that isn't gated on the trigger string
// still fires for it exactly like 'firezone'.
function updateFireRingAttack(game, dt){
  const player = game.player, node = game.currentRoom;
  // Phase 8c-2 — reads the per-instance shadow field instead of player.def
  // directly, so a skilltree.js uniqueField node can tune it (for Changedling
  // herself, or for Alicorn via a borrowed-mechanic uniqueFlag node).
  const radius = player.fireRingRadius || 60;
  if (!player.fireZone) {
    player.fireZone = { x: player.x, y: player.y, radius, tickTimer: 0 };
    Sound.play('rangedShot');
  }
  const zone = player.fireZone;
  zone.x = player.x; zone.y = player.y; // follows her every frame, never left behind
  const dps = player.rangedDamage * (1 / Math.max(0.01, player.fireCooldown));
  const dmg = dps * dt;
  zone.tickTimer -= dt;
  const feedback = zone.tickTimer <= 0;
  if (feedback) zone.tickTimer = player.fireCooldown;
  const layerHits = [];
  for (const e of node.enemies) {
    if (e.isDead) continue;
    if (Util.dist(zone.x, zone.y, e.x, e.y) > zone.radius + e.radius) continue;
    const applied = e.takeDamage(dmg, 0, 0);
    if (!applied) continue;
    if (feedback) {
      player.onHitLanded();
      Sound.play('enemyHit');
      applyOnHitStatuses(game, e);
      game.floatTexts.push(new FloatText(e.x, e.y - 20, (dps * player.fireCooldown).toFixed(1), '#7aeeb0'));
      layerHits.push(e);
      bumpStat('fireRingHits', 1, game); // Changedling's unlock counter — see achievements.js
      runHitLayers(game, 'firering', { x: e.x, y: e.y, ang: Math.atan2(player.facing.y, player.facing.x), hits: [e], dmg: dps * player.fireCooldown });
    }
    if (e.isDead) { bumpStat('rangedKills', 1, game); handleEnemyDeath(game, e); }
  }
  if (feedback) runCastLayers(game, 'firering', { x: zone.x, y: zone.y, ang: Math.atan2(player.facing.y, player.facing.x), hits: layerHits, dmg: dps * player.fireCooldown });
  if (feedback) {
    for (const ob of node.obstacles) {
      if (ob.destroyed || !ob.attackable) continue;
      if (Util.dist(zone.x, zone.y, ob.x, ob.y) > zone.radius + ob.radius) continue;
      damageObstacleHit(game, ob);
    }
  }
}

// Changeling Queen's summon — how long a minion sticks around, and how
// often its own little fire-zone deals feedback (lifesteal/sound/float
// text), same "throttled, not every frame" idea as updateGreenFireAttack's
// own fireCooldown-driven tickTimer above. Minions have no cooldown field of
// their own, so this is just a flat constant.
const CHANGELING_MINION_LIFE = 15;
const CHANGELING_MINION_TICK = 0.5;
const CHANGELING_MINION_CHASE_SPEED = 150; // px/s — a touch slower than most trash chasers, it's a fire-zone bearer not a brawler
function updateChangelingSummons(game, dt){
  const player = game.player, node = game.currentRoom;
  // Phase 11 un-bleed pass — Bat Pony (`summonsRoostmates`), Kelpie
  // (`summonsThralls`), Changedling (`summonsBrood`), and the base
  // Changeling (`summonsHive`) each own their own flag now rather than
  // sharing Changeling Queen's `summonsChangelings`; all five drive this
  // same generic orbiting-helper system, which is shared plumbing (like
  // ranged/melee attack) rather than any one character's signature.
  if (!player.summonsChangelings && !player.summonsRoostmates && !player.summonsThralls && !player.summonsHive && !player.summonsBrood) return;
  // spawn — one at a time, gated on both a free slot and the summon cooldown
  if (player._changelingSummonTimer > 0) player._changelingSummonTimer -= dt;
  if (player.changelingMinions.length < player.maxChangelingMinions && player._changelingSummonTimer <= 0) {
    const ang = Math.random() * Math.PI * 2;
    player.changelingMinions.push({
      x: player.x + Math.cos(ang) * 24, y: player.y + Math.sin(ang) * 24,
      angle: ang, life: CHANGELING_MINION_LIFE, tickTimer: 0,
    });
    player._changelingSummonTimer = player.changelingSummonCooldown;
    bumpStat('changelingMinionsSummoned', 1, game); // Changeling Queen's unlock counter — see achievements.js
    Sound.play('rangedShot');
  }
  // tick every living minion — chase the nearest living enemy so it
  // actually fights (falls back to the old player-orbit drift, mirroring
  // the shooter familiar's orbit-drift in familiars.js, only once the room
  // has nothing left to chase), age out, and run its own small fire-zone
  for (let i = player.changelingMinions.length - 1; i >= 0; i--) {
    const m = player.changelingMinions[i];
    m.life -= dt;
    if (m.life <= 0) { player.changelingMinions.splice(i, 1); continue; }

    let target = null, targetD2 = Infinity;
    for (const e of node.enemies) {
      if (e.isDead) continue;
      const d2 = Util.dist2(m.x, m.y, e.x, e.y);
      if (d2 < targetD2) { targetD2 = d2; target = e; }
    }
    if (target) {
      // hover just inside its own damage radius rather than stacking on the
      // enemy's exact center — keeps it in tick range without fighting the
      // enemy's collision/knockback every frame
      const targetD = Math.sqrt(targetD2) || 1;
      const standoff = Math.min(player.changelingMinionRadius * 0.6, targetD);
      const ang = Math.atan2(target.y - m.y, target.x - m.x);
      const goalX = target.x - Math.cos(ang) * standoff, goalY = target.y - Math.sin(ang) * standoff;
      const dx = goalX - m.x, dy = goalY - m.y;
      const distToGoal = Math.hypot(dx, dy);
      const step = CHANGELING_MINION_CHASE_SPEED * dt;
      if (distToGoal <= step || distToGoal < 0.001) { m.x = goalX; m.y = goalY; }
      else { m.x += (dx / distToGoal) * step; m.y += (dy / distToGoal) * step; }
    } else {
      m.angle += 0.6 * dt;
      const homeX = player.x + Math.cos(m.angle) * 34, homeY = player.y + Math.sin(m.angle) * 34;
      m.x += (homeX - m.x) * Math.min(1, dt * 3);
      m.y += (homeY - m.y) * Math.min(1, dt * 3);
    }

    m.tickTimer -= dt;
    const feedback = m.tickTimer <= 0;
    if (feedback) m.tickTimer = CHANGELING_MINION_TICK;
    const dmg = player.changelingMinionDmg * dt;
    const layerHits = [];
    for (const e of node.enemies) {
      if (e.isDead) continue;
      if (Util.dist(m.x, m.y, e.x, e.y) > player.changelingMinionRadius + e.radius) continue;
      const applied = e.takeDamage(dmg, 0, 0);
      if (!applied) continue;
      if (feedback) {
        player.onHitLanded();
        Sound.play('enemyHit');
        applyOnHitStatuses(game, e);
        game.floatTexts.push(new FloatText(e.x, e.y - 20, (player.changelingMinionDmg * CHANGELING_MINION_TICK).toFixed(1), '#5ae0a0'));
        layerHits.push(e);
        runHitLayers(game, 'firezone', { x: e.x, y: e.y, ang: 0, hits: [e], dmg: player.changelingMinionDmg * CHANGELING_MINION_TICK });
      }
      if (e.isDead) { bumpStat('rangedKills', 1, game); handleEnemyDeath(game, e); }
    }
    if (feedback) runCastLayers(game, 'firezone', { x: m.x, y: m.y, ang: 0, hits: layerHits, dmg: player.changelingMinionDmg * CHANGELING_MINION_TICK });
  }
}

// Engineer Pony's turret-build channel. Held, not pressed — accumulates
// player.turretBuildTimer by dt while input.build is held, same "reset on
// release" shape as playerChargedBeamAttack's chargeTimer (see combat-2.js
// and its caller in updatePlayer above): letting go early loses the partial
// progress, it does not pause-and-resume. The "cost" is literally her own
// fireCooldown, reused directly rather than adding a separate build-time
// field — that's the "takes their fire rate to build one" from the brief.
function updateTurretBuild(game, dt, input){
  const player = game.player, node = game.currentRoom;
  // Phase 11 un-bleed pass — Mule (`canPlantMarkers`), Dnbpony
  // (`canDropStacks`), Alicorn (`canConjureWards`), and Crystal Pony
  // (`canPlantSentries`) each own their own flag now rather than sharing
  // Engineer Pony's `canBuildTurrets`; the placement/build-channel/damage
  // system itself is shared plumbing, same as ranged/melee attack.
  if (!player.canBuildTurrets && !player.canPlantMarkers && !player.canDropStacks && !player.canConjureWards && !player.canPlantSentries) return;
  if (!input.build) { player.turretBuildTimer = 0; return; }
  player.turretBuildTimer += dt;
  if (player.turretBuildTimer < player.fireCooldown) return;
  player.turretBuildTimer = 0;
  if (!node.playerTurrets) node.playerTurrets = [];
  // Phase 8c-2 — reads the per-instance shadow field (was a hardcoded 3)
  // so a skilltree.js uniqueField node can raise her turret cap.
  if (node.playerTurrets.length >= player.maxTurrets) {
    Sound.play('uiDeny');
    game.toast('Maximum turrets already built.');
    return;
  }
  // dmg is snapshotted at build time (player.rangedDamage * 0.7) rather than
  // read live off the player every shot — a turret is a standalone fixture
  // once placed, not something later damage-ups retroactively buff
  // Phase 8c-2 — reads the per-instance shadow field (was a hardcoded 0.7)
  // so a skilltree.js uniqueField node can raise built turrets' damage.
  node.playerTurrets.push({ x: player.x, y: player.y, sightRange: 3 * TILE, fireTimer: 0, dmg: player.rangedDamage * player.turretDamageMult, ang: 0 });
  Sound.play('itemGet');
  bumpStat('turretsBuilt', 1, game);
}

// Fires every placed turret in the CURRENT room. Independent 1.0s turret
// cooldown, not tied to the player's own fireCooldown — a turret is its own
// fixture once placed. Bosses are allowed as targets (no reason a stationary
// turret shouldn't be able to plink a boss same as any other enemy).
function updatePlayerTurrets(game, dt){
  const node = game.currentRoom;
  if (!node.playerTurrets || node.playerTurrets.length === 0) return;
  for (const turret of node.playerTurrets) {
    if (turret.fireTimer > 0) { turret.fireTimer -= dt; continue; }
    let nearest = null, nearestD = Infinity;
    for (const e of node.enemies) {
      if (e.isDead) continue;
      const d = Util.dist2(turret.x, turret.y, e.x, e.y);
      if (d < nearestD) { nearestD = d; nearest = e; }
    }
    if (!nearest || nearestD > turret.sightRange * turret.sightRange) continue;
    turret.fireTimer = 1.0;
    const ang = Math.atan2(nearest.y - turret.y, nearest.x - turret.x);
    turret.ang = ang;
    const boltSpeed = 320;
    const proj = new Projectile(
      turret.x, turret.y, Math.cos(ang) * boltSpeed, Math.sin(ang) * boltSpeed,
      turret.dmg, 'player', { color:'#7fc1e3', radius:4 }
    );
    proj.attackTrigger = 'turret'; // critical — see combat-3.js's updateProjectiles hit site
    game.projectiles.push(proj);
    Sound.play('rangedShot');
  }
}

// Pony Bot's signature attack: an instant beam that stretches from the
// player to the nearest wall in their facing direction, damaging every
// enemy it crosses (unlimited range within the room, always pierces).
function playerLaserAttack(game){
  const player = game.player, node = game.currentRoom;
  if (player.attackTimer > 0) return;
  player.attackTimer = player.fireCooldown;
  Sound.play('laserShot');
  bumpStat('shotsFired', 1, game);
  const ang = Math.atan2(player.facing.y, player.facing.x);
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const maxDist = (node.tileW + node.tileH) * TILE; // comfortably covers any room's diagonal
  const step = 6;
  const hitSet = new Set();
  const hitObstacles = new Set(); // one hit per obstacle per cast — the beam pierces, so the ray would otherwise touch the same one many steps running
  let endDist = maxDist;
  for (let dist = 0; dist < maxDist; dist += step) {
    const px = player.x + dx * dist, py = player.y + dy * dist;
    if (isTileSolidForEntity(node, Math.floor(px / TILE), Math.floor(py / TILE))) { endDist = dist; break; }
    for (const e of node.enemies) {
      if (e.isDead || hitSet.has(e)) continue;
      if (Util.dist2(px, py, e.x, e.y) < e.radius * e.radius) hitSet.add(e);
    }
    // same guards updateProjectiles' bolt-vs-obstacle pass uses, except the
    // beam pierces obstacles as well (never sets endDist), exactly as it
    // already pierces enemies
    for (const ob of node.obstacles) {
      if (ob.destroyed || ob.isPit || ob.isWalkable || hitObstacles.has(ob)) continue;
      if (ob.isHazard && !ob.attackable) continue; // cactus etc: hazard but not solid, the beam passes through
      if (!ob.attackable) continue; // rocks/turrets/blue+purple fire: the laser can't hurt them
      if (Util.circleIntersect(px, py, 2, ob.x, ob.y, ob.radius - 2)) hitObstacles.add(ob);
    }
  }
  for (const ob of hitObstacles) damageObstacleHit(game, ob);
  const layerHits = []; // attack-layer styles (see attackStyles.js)
  for (const e of hitSet) {
    let dmg = player.rangedDamage, crit = false;
    if (player.critChance && Math.random() < player.critChance) { dmg *= player.critMultiplier; crit = true; }
    if (e.isBoss && player.bossDamageBonus) dmg *= (1 + player.bossDamageBonus);
    const applied = e.takeDamage(dmg, dx * 3, dy * 3);
    if (applied) {
      player.onHitLanded();
      Sound.play(crit ? 'crit' : 'enemyHit');
      if (crit) { bumpStat('critsLanded', 1, game); e._lastHitCrit = true; } // consumed once by render.js's hit-flash rising edge (drawEnemy) for a distinct crit spark burst
      applyOnHitStatuses(game, e);
      game.floatTexts.push(new FloatText(e.x, e.y - 20, (crit ? 'CRIT ' : '') + dmg, crit ? '#ffcf5c' : '#fff'));
      if (e.isDead) { bumpStat('rangedKills', 1, game); handleEnemyDeath(game, e); }
      layerHits.push(e);
      runHitLayers(game, 'laser', { x: e.x, y: e.y, ang, hits: [e], dmg });
    }
  }
  runCastLayers(game, 'laser', { x: player.x, y: player.y, ang, hits: layerHits, dmg: player.rangedDamage });
  game.laserFX = { x1: player.x, y1: player.y, x2: player.x + dx * endDist, y2: player.y + dy * endDist, life: 0.12, maxLife: 0.12 };
}

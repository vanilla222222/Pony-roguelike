'use strict';
// systems/combat-3.js — split from combat.js (part 3/4).

function checkRoomCleared(game, node){
  if (node.cleared) return false;
  const aliveHostile = node.enemies.some(e => !e.isDead);
  if (aliveHostile) return false;
  // challenge rooms don't unlock between waves — advance to the next wave
  // instead of clearing, until all challengeTotalWaves are spent. See
  // room.js's populateRoom (guaranteed item + wave-state init) and
  // game.js's updateItemPedestal (what actually starts the challenge).
  if (node.type === 'challenge' && node.challengeStarted && node.challengeWave < node.challengeTotalWaves) {
    spawnChallengeWave(game, node);
    return false;
  }
  if (node.type === 'challenge' && node.challengeStarted) bumpStat('challengeRoomsCompleted', 1, game); // see achievements.js's challengenovice/challengemaster
  node.cleared = true; node.doorsOpen = true; return true;
}

// challenge rooms: 5 waves of 3-5 enemies drawn from the floor's normal
// pool, one wave spawned at a time as the previous wave is fully cleared —
// see checkRoomCleared above and startChallengeRoom below.
function spawnChallengeWave(game, node){
  const floorNum = game.dungeon.floorNum;
  node.challengeWave++;
  const n = Util.randi(3, 5);
  const cx = Math.floor(node.tileW / 2), cy = Math.floor(node.tileH / 2);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const spot = findClearFloorSpot(node, cx + Math.round(Math.cos(ang) * 3), cy + Math.round(Math.sin(ang) * 3));
    node.enemies.push(new Enemy(resolveGenericEnemy(floorNum, game.floorBranch), spot.x, spot.y, floorNum));
  }
  game.toast('Wave ' + node.challengeWave + ' / ' + node.challengeTotalWaves + '!');
}

// fires the moment the challenge room's guaranteed item is taken — see
// game.js's updateItemPedestal. Locks the doors and kicks off wave 1;
// the room reopens itself via checkRoomCleared once wave 5 dies.
function startChallengeRoom(game, node){
  if (node.challengeStarted) return;
  node.challengeStarted = true;
  node.doorsOpen = false;
  node.tileLayerDirty = true;
  spawnChallengeWave(game, node);
}

/* ---------------------------------------------------------------
   Enemy update — status-effect ticking, contact damage, and
   dispatch into the aiXxx behavior functions (see ai.js)
   --------------------------------------------------------------- */
// Behaviors we've already complained about. An ENEMY_TYPES entry with a
// typo'd `behavior` used to produce an enemy that just stood there, silently;
// now it falls back to a chaser and says so exactly once per bad string
// (updateEnemy runs every frame per enemy, so this must not be a bare warn).
const _warnedBehaviors = new Set();

function updateEnemy(game, e, dt){
  if (e.isDead) return;
  const node = game.currentRoom;
  if (e.hitFlash > 0) e.hitFlash -= dt;

  if (Math.abs(e.knockX) > 0.15 || Math.abs(e.knockY) > 0.15) {
    tryMoveEntity(e, node, node.obstacles, e.knockX, e.knockY);
    e.knockX *= 0.82; e.knockY *= 0.82;
  } else { e.knockX = 0; e.knockY = 0; }

  updateStatusEffects(game, e, dt);
  if (e.isDead) return; // poison can kill mid-tick

  if (e.behavior === 'shielded') {
    e.shieldTimer -= dt;
    if (e.shieldTimer <= 0) {
      e.shielded = !e.shielded;
      e.shieldTimer = e.shielded ? (e.type.shieldTime || 2) : (e.type.vulnTime || 2);
    }
  } else if (e.grantedShield) {
    // a shield handed out by a 'shielder' (see ai.js aiShielder) — nothing
    // else ticks it down, and a shield that never expires is an invulnerable
    // enemy, so its expiry lives here next to the archetype's own cycle
    e.shieldTimer -= dt;
    if (e.shieldTimer <= 0) { e.shielded = false; e.grantedShield = false; e.shieldTimer = 0; }
  }

  if (e.freezeTimer > 0) {
    // frozen solid: no movement, no attacks at all
  } else if (e.stunTimer > 0) {
    aiWander(game, e, dt); // wanders; ranged/turret types simply don't fire while stunned
  } else if (e.charmTimer > 0) {
    aiCharmed(game, e, dt);
  } else if (e.fearTimer > 0) {
    aiFeared(game, e, dt);
  } else {
    switch (e.behavior) {
      case 'chaser': case 'shielded': aiChase(game, e, dt); break;
      case 'ranged': aiRanged(game, e, dt); break;
      case 'flyer': aiFlyer(game, e, dt); break;
      case 'bomber': aiBomber(game, e, dt); break;
      case 'charger': aiCharger(game, e, dt); break;
      case 'turret': aiTurret(game, e, dt); break;
      case 'leaper': aiLeaper(game, e, dt); break;
      case 'splitter': aiChase(game, e, dt); break; // moves like a chaser; splits on death (see handleEnemyDeath)
      case 'orbiter': aiOrbiter(game, e, dt); break;
      case 'burrower': aiBurrower(game, e, dt); break;
      case 'summoner': aiSummoner(game, e, dt); break;
      case 'healer': aiHealer(game, e, dt); break;
      case 'sniper': aiSniper(game, e, dt); break;
      case 'swarm': aiSwarm(game, e, dt); break;
      case 'ambusher': aiAmbusher(game, e, dt); break;
      case 'teleporter': aiTeleporter(game, e, dt); break;
      case 'shielder': aiShielder(game, e, dt); break;
      case 'lobber': aiLobber(game, e, dt); break;
      case 'weaver': aiWeaver(game, e, dt); break;
      case 'sentry': aiSentry(game, e, dt); break;
      case 'skirmisher': aiSkirmisher(game, e, dt); break;
      case 'whiplash': aiWhiplash(game, e, dt); break;
      case 'bossWarlord': aiBossWarlord(game, e, dt); break;
      case 'bossColossus': aiBossColossus(game, e, dt); break;
      case 'bossHiveMother': aiBossHiveMother(game, e, dt); break;
      case 'bossBoneSentinel': aiBossBoneSentinel(game, e, dt); break;
      case 'bossBrambleQueen': aiBossBrambleQueen(game, e, dt); break;
      case 'bossSandWyrm': aiBossSandWyrm(game, e, dt); break;
      case 'bossPolish': aiBossPolish(game, e, dt); break;
      case 'bossTyrone': aiBossTyrone(game, e, dt); break;
      case 'bossPineapple': aiBossPineapple(game, e, dt); break;
      case 'bossIsrael': aiBossIsrael(game, e, dt); break;
      case 'bossAshTyrant': aiBossAshTyrant(game, e, dt); break;
      case 'bossCinderColossus': aiBossCinderColossus(game, e, dt); break;
      case 'bossMagmaWraith': aiBossMagmaWraith(game, e, dt); break;
      case 'bossBrimstoneHorror': aiBossBrimstoneHorror(game, e, dt); break;
      case 'bossShadowStalker': aiBossShadowStalker(game, e, dt); break;
      case 'bossStormbringer': aiBossStormbringer(game, e, dt); break;
      case 'bossFrostSentinel': aiBossFrostSentinel(game, e, dt); break;
      case 'bossBrickGolem': aiBossBrickGolem(game, e, dt); break;
      case 'bossGlacierFiend': aiBossGlacierFiend(game, e, dt); break;
      case 'bossBlizzardWraith': aiBossBlizzardWraith(game, e, dt); break;
      case 'bossVineHorror': aiBossVineHorror(game, e, dt); break;
      case 'bossCanopyStalker': aiBossCanopyStalker(game, e, dt); break;
      case 'bossAlgae': aiBossAlgae(game, e, dt); break;
      case 'bossLilac': aiBossLilac(game, e, dt); break;
      // DNB superbosses — 11A/11B/12A/12B/13 (see ai.js)
      case 'bossPlapper': aiBossPlapper(game, e, dt); break;
      case 'bossClapper': aiBossClapper(game, e, dt); break;
      case 'bossNhm': aiBossNhm(game, e, dt); break;
      case 'bossVanillaDnb': aiBossVanillaDnb(game, e, dt); break;
      case 'bossOneTrueDnb': aiBossOneTrueDnb(game, e, dt); break;
      // extended regular-boss set — 2 more apiece for stages 0-3 (see ai.js)
      case 'bossBoneCaller': aiBossBoneCaller(game, e, dt); break;
      case 'bossGraveChorus': aiBossGraveChorus(game, e, dt); break;
      case 'bossRotBloom': aiBossRotBloom(game, e, dt); break;
      case 'bossAntlerWarden': aiBossAntlerWarden(game, e, dt); break;
      case 'bossGlassScorpion': aiBossGlassScorpion(game, e, dt); break;
      case 'bossDuneRavager': aiBossDuneRavager(game, e, dt); break;
      case 'bossFurnaceHeart': aiBossFurnaceHeart(game, e, dt); break;
      case 'bossSlagbound': aiBossSlagbound(game, e, dt); break;
      case 'bossEclipseWraith': aiBossEclipseWraith(game, e, dt); break;
      case 'bossIronBastion': aiBossIronBastion(game, e, dt); break;
      default: {
        const key = String(e.behavior);
        if (!_warnedBehaviors.has(key)) {
          _warnedBehaviors.add(key);
          console.warn('updateEnemy: unknown behavior "' + key + '" on enemy type "' +
            ((e.type && e.type.id) || '?') + '" — falling back to chaser');
        }
        aiChase(game, e, dt);
        break;
      }
    }
  }

  if (e.contactCooldown > 0) e.contactCooldown -= dt;
  const player = game.player;
  const rr = e.radius + player.radius;
  const suppressPlayerContact = e.submerged || e.freezeTimer > 0 || e.charmTimer > 0;
  if (!e.isDead && !suppressPlayerContact && Util.dist2(e.x, e.y, player.x, player.y) < rr * rr && e.contactCooldown <= 0) {
    damagePlayer(game, playerDamageAmount(game, e.isBoss, e.dmg), e.type.id); // see the Bestiary's per-enemy death count
    e.contactCooldown = e.isBoss ? 0.6 : (e.type.contactCooldown || 0.7);
    if (player.spikedBarding) {
      // depth-scaled for the same reason poison and blasts are — a flat 1
      // stopped meaning anything the moment enemy HP started compounding
      const applied = e.takeDamage(statusTickDamage(game.dungeon.floorNum), (e.x - player.x) * 0.03, (e.y - player.y) * 0.03);
      if (applied && e.isDead) handleEnemyDeath(game, e);
    }
  } else if (!e.isDead && e.charmTimer > 0 && e.contactCooldown <= 0) {
    // charmed enemies turn on whoever's nearest instead of the player
    for (const other of node.enemies) {
      if (other === e || other.isDead || other.charmTimer > 0) continue;
      const orr = e.radius + other.radius;
      if (Util.dist2(e.x, e.y, other.x, other.y) < orr * orr) {
        const applied = other.takeDamage(e.dmg, (other.x - e.x) * 0.03, (other.y - e.y) * 0.03);
        e.contactCooldown = e.type.contactCooldown || 0.7;
        if (applied && other.isDead) handleEnemyDeath(game, other);
        break;
      }
    }
  }
}

function updateStatusEffects(game, e, dt){
  if (e.poisonTimer > 0) {
    e.poisonTimer = Math.max(0, e.poisonTimer - dt);
    e.poisonTickTimer -= dt;
    if (e.poisonTickTimer <= 0) {
      e.poisonTickTimer = 0.8;
      // depth-scaled, same reason blast damage is (see explodeAt) — a flat 1
      // per tick meant the entire venom item family was dead weight past the
      // Crypt. See enemies.js's statusTickDamage.
      // Synergy B: Rot & Ruin — a target already marked Vulnerable takes 30%
      // more from the poison tick itself, on top of takeDamage's own 1.5x
      // Vulnerable multiplier. player.rotAndRuinActive is computed once in
      // items.js's recalcPlayerStats (see there for the exact condition).
      let tickDmg = statusTickDamage(game.dungeon.floorNum);
      if (e.vulnerableTimer > 0 && game.player.rotAndRuinActive) tickDmg *= 1.3;
      const applied = e.takeDamage(tickDmg, 0, 0);
      if (applied && e.isDead) { handleEnemyDeath(game, e); return; }
    }
  }
  if (e.stunTimer > 0) e.stunTimer = Math.max(0, e.stunTimer - dt);
  if (e.freezeTimer > 0) e.freezeTimer = Math.max(0, e.freezeTimer - dt);
  if (e.fearTimer > 0) e.fearTimer = Math.max(0, e.fearTimer - dt);
  if (e.charmTimer > 0) e.charmTimer = Math.max(0, e.charmTimer - dt);
  if (e.vulnerableTimer > 0) e.vulnerableTimer = Math.max(0, e.vulnerableTimer - dt);
}

/* ---------------------------------------------------------------
   Projectiles
   --------------------------------------------------------------- */
function updateProjectiles(game, dt){
  const node = game.currentRoom, player = game.player;
  for (const pr of game.projectiles) {
    // Homing — gently steers toward the nearest alive enemy every tick,
    // capped turn rate so it reads as "guided", not "teleporting"
    if (pr.homing && (pr.owner === 'player' || pr.owner === 'familiar')) {
      let nearest = null, nd = 260;
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const d = Util.dist(pr.x, pr.y, e.x, e.y);
        if (d < nd) { nd = d; nearest = e; }
      }
      if (nearest) {
        const speed = Math.hypot(pr.vx, pr.vy);
        const curAng = Math.atan2(pr.vy, pr.vx);
        const wantAng = Math.atan2(nearest.y - pr.y, nearest.x - pr.x);
        const turn = Math.min(1, 0.15 * pr.homing) * 5 * dt; // stacks toward a tighter turn radius, capped at ~5 rad/s
        const diff = normalizeAngle(wantAng - curAng);
        const newAng = curAng + Util.clamp(diff, -turn, turn);
        pr.vx = Math.cos(newAng) * speed; pr.vy = Math.sin(newAng) * speed;
      }
    } else if (pr.homing && pr.owner === 'enemy') {
      // Purple Fire's bolts (see OBSTACLES.purplefire) — the mirror image of
      // the above: an enemy/obstacle-fired homing bolt curves toward the
      // player instead, same capped turn rate, and never gives up on range
      const speed = Math.hypot(pr.vx, pr.vy);
      const curAng = Math.atan2(pr.vy, pr.vx);
      const wantAng = Math.atan2(player.y - pr.y, player.x - pr.x);
      const turn = Math.min(1, 0.15 * pr.homing) * 5 * dt;
      const diff = normalizeAngle(wantAng - curAng);
      const newAng = curAng + Util.clamp(diff, -turn, turn);
      pr.vx = Math.cos(newAng) * speed; pr.vy = Math.sin(newAng) * speed;
    }
    const prevX = pr.x, prevY = pr.y;
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    const tx = Math.floor(pr.x / TILE), ty = Math.floor(pr.y / TILE);
    if (isTileSolidForEntity(node, tx, ty)) {
      // ricochetBolt (see attackStyles.js) — bounce off whichever axis
      // actually caused the collision instead of dying, one fewer bounce
      // left each time, otherwise identical to the normal wall-death path.
      // Undo this frame's move first, THEN flip velocity, so next frame's
      // normal `pr.x += pr.vx*dt` carries it away from the wall cleanly
      // instead of compounding the same-frame math.
      if (pr.ricochet > 0) {
        pr.x = prevX; pr.y = prevY;
        const prevTx = Math.floor(prevX / TILE), prevTy = Math.floor(prevY / TILE);
        if (isTileSolidForEntity(node, tx, prevTy)) pr.vx = -pr.vx;
        if (isTileSolidForEntity(node, prevTx, ty)) pr.vy = -pr.vy;
        if (!isTileSolidForEntity(node, tx, prevTy) && !isTileSolidForEntity(node, prevTx, ty)) { pr.vx = -pr.vx; pr.vy = -pr.vy; }
        pr.ricochet--;
      } else {
        pr.dead = true;
      }
    }
    // Spectral — ignores obstacles entirely (walls above still stop it)
    if (!pr.spectral) {
      for (const ob of node.obstacles) {
        if (ob.destroyed || ob.isPit || ob === pr.source) continue; // bolts sail over pits, and never collide with whatever obstacle just fired them
        if (ob.isWalkable) continue; // mud/sand trap: flat on the ground, bolts pass right over
        if (ob.isHazard && !ob.attackable) continue; // cactus: hazard but not solid, bolts pass through
        if (Util.circleIntersect(pr.x, pr.y, pr.radius, ob.x, ob.y, ob.radius - 2)) {
          if (ob.attackable && (pr.owner === 'player' || pr.owner === 'familiar')) damageObstacleHit(game, ob);
          pr.dead = true;
        }
      }
    }
    if (pr.life <= 0) pr.dead = true;
    if (pr.dead) { detonateExplosiveProjectile(game, pr); continue; }
    if (pr.owner === 'player' || pr.owner === 'familiar') {
      const isPlayerBolt = pr.owner === 'player';
      for (const e of node.enemies) {
        if (e.isDead || pr.hitEnemies.includes(e)) continue;
        if (Util.circleIntersect(pr.x, pr.y, pr.radius, e.x, e.y, e.radius)) {
          pr.hitEnemies.push(e);
          if (pr.pierce > 0) pr.pierce--; else pr.dead = true;
          let dmg = pr.damage, crit = false;
          if (isPlayerBolt && player.critChance && Math.random() < player.critChance) { dmg *= player.critMultiplier; crit = true; }
          if (e.isBoss && player.bossDamageBonus) dmg *= (1 + player.bossDamageBonus);
          const applied = e.takeDamage(dmg, pr.vx * 0.01, pr.vy * 0.01);
          if (applied) {
            if (isPlayerBolt) { player.onHitLanded(); applyOnHitStatuses(game, e); }
            Sound.play(crit ? 'crit' : 'enemyHit');
            if (crit) bumpStat('critsLanded', 1, game);
            game.floatTexts.push(new FloatText(e.x, e.y - 20, (crit ? 'CRIT ' : '') + dmg, crit ? '#ffcf5c' : '#fff'));
            if (e.isDead) { if (isPlayerBolt) bumpStat('rangedKills', 1, game); handleEnemyDeath(game, e); }
            // attack-layer styles (see attackStyles.js) — only tagged player
            // bolts trigger this (echo/mirror/fragment-spawned shards are
            // deliberately untagged, so this can never cascade into itself)
            if (isPlayerBolt && pr.attackTrigger) runHitLayers(game, pr.attackTrigger, { x: e.x, y: e.y, ang: Math.atan2(pr.vy, pr.vx), hits: [e], dmg });
          }
          if (pr.dead) break;
        }
      }
    } else {
      if (Util.circleIntersect(pr.x, pr.y, pr.radius, player.x, player.y, player.radius)) {
        pr.dead = true;
        // pr.source is whichever Enemy/Obstacle(turret) fired this bolt — see
        // ai.js's fireProjectileAngle/inline boss attacks — resolved down to
        // a bare id so the Bestiary can credit the right death, same as the
        // contact-damage branch above
        const srcId = pr.source ? (pr.source.type ? pr.source.type.id : pr.source.kind) : null;
        // pr.damage already carries the shooter's own dmg stat in half-hearts:
        // ai.js's fireProjectileAt/fireProjectileAngle pass `e.dmg`, the inline
        // boss volleys pass a literal 2 (= one heart, what a boss bolt has
        // always cost), and updateObstacles passes `ob.def.dmg`. So a bolt now
        // hurts exactly as much as the thing that fired it.
        damagePlayer(game, playerDamageAmount(game, pr.fromBoss, pr.damage), srcId);
      }
    }
    if (pr.dead) detonateExplosiveProjectile(game, pr);
  }
  game.projectiles = game.projectiles.filter(p => !p.dead);
}

/* ---------------------------------------------------------------
   Bombs & explosions
   --------------------------------------------------------------- */
function placeBombAt(game, x, y, owner){
  if (owner === 'player' && !game.player.unlimitedBombsFloor) {
    if (game.player.bombs <= 0) return false;
    game.player.bombs--;
  }
  const bomb = new Bomb(x, y, owner);
  if (game.player.passives.quickfuse) bomb.timer = 0.15; // Quick Fuse — see data.js
  game.bombs.push(bomb);
  Sound.play('bombPlace');
  bumpStat('bombsPlaced', 1, game);
  return true;
}

function updateBombs(game, dt){
  for (const b of game.bombs) {
    if (b.exploded) continue;
    b.timer -= dt;
    if (b.timer <= 0) { b.exploded = true; detonateBomb(game, b); }
  }
  game.bombs = game.bombs.filter(b => !b.exploded);
}

// Explosive tears (tearFlags.explosive — see entities.js/items.js) — a
// player/familiar bolt detonates a small blast wherever it dies, exactly
// once. Deliberately reuses the same explodeAt as bombs/barrels, radius and
// all, so it can bomb rocks, chain into a barrel, or catch the player
// themselves (Blast Plating still protects, same as any other explosion).
function detonateExplosiveProjectile(game, pr){
  if (!pr.explosive || pr.exploded) return;
  pr.exploded = true;
  explodeAt(game, pr.x, pr.y, 22 + 12 * pr.explosive);
}

function detonateBomb(game, bomb){
  const R = 92 * (game.player.bombRadiusMult || 1);
  explodeAt(game, bomb.x, bomb.y, R);
}

// shared explosion logic — used by player bombs (detonateBomb above) and by
// Bomb Barrel, which calls this itself the moment it's destroyed (either by
// 3 attackable hits, see damageObstacleHit, or by getting caught in another
// explosion below — barrels chain into each other and into themselves being
// re-entered here is safe since `ob.destroyed = true` is set before the
// recursive call, so a barrel can never explode twice).
function explodeAt(game, x, y, R){
  const node = game.currentRoom, player = game.player;
  game.explosions.push(new Explosion(x, y, R));
  Sound.play('explosion');

  // Blast damage has to ride the same depth curve enemy HP does, or a bomb
  // stops being a weapon the moment you leave the Crypt. It rides the BOSS
  // curve (the gentler of the two — see enemies.js) on purpose: a bomb should
  // stay a reliable way to wipe a knot of trash without ever becoming the
  // answer to a brute or a boss. See the audit's "already broken" section.
  const blastDmg = explosionDamage(game.dungeon.floorNum);
  for (const e of node.enemies) {
    if (e.isDead) continue;
    if (Util.dist(x, y, e.x, e.y) < R + e.radius) {
      const applied = e.takeDamage(blastDmg, (e.x - x) * 0.06, (e.y - y) * 0.06);
      if (applied && e.isDead) handleEnemyDeath(game, e);
    }
  }
  // no attacker to attribute this to — a player bomb, a bomb barrel, an
  // explosive tear. Deliberately passes no dmg stat, so it falls through to
  // CONTACT_DMG_DEFAULT and costs exactly what self-inflicted blast damage
  // has always cost (half a heart, a full heart from the Inferno on).
  // melee classes are immune to blast damage outright — they have to stand in
  // a bomb barrel's face to fight at all, so eating the pop is not a real
  // choice for them. This is every explosion, not just barrels (own bombs,
  // explosive tears, chains), since they all land here.
  // Blast Ward (expand-everything trinket batch, see data.js) is the trinket
  // equivalent of Blast Plating and reads in exactly the same slot.
  if (!player.passives.blastplating && player.trinketId !== 'blastward'
      && player.attackType !== 'melee' && Util.dist(x, y, player.x, player.y) < R + player.radius) damagePlayer(game, playerDamageAmount(game, false), 'explosion');

  for (const ob of node.obstacles) {
    if (ob.destroyed || (!ob.destructible && !ob.attackable)) continue;
    if (Util.dist(x, y, ob.x, ob.y) < R + ob.radius) {
      ob.destroyed = true;
      Sound.play('obstacleDestroy');
      bumpStat('obstaclesDestroyed', 1, game);
      bumpBestiaryCount('objectsDestroyed', ob.kind, 1); // see js/bestiary.js
      if (ob.def.heartDropChance && Util.chance(ob.def.heartDropChance)) {
        node.pickups.push(new Pickup('heartRed', ob.tx, ob.ty));
      }
      if (ob.kind === 'rock' || ob.kind === 'tallrock') {
        bumpStat('rocksBombed', 1, game);
        if (player.passives.prospectorspick) node.pickups.push(new Pickup('coin', ob.tx, ob.ty, Util.weighted(COIN_TYPES)));
        // Prospector's Chip (expand-everything trinket batch, see data.js) —
        // its own `if`, so it stacks with the pick rather than replacing it.
        else if (player.trinketId === 'prospectorschip' && Util.chance(0.5)) node.pickups.push(new Pickup('coin', ob.tx, ob.ty, Util.weighted(COIN_TYPES)));
      } else if (ob.kind === 'tintedrock') {
        bumpStat('rocksBombed', 1, game);
        const roll = Math.random();
        if (roll < 0.75) {
          for (let i = 0; i < 2; i++) {
            const s = findClearFloorSpot(node, ob.tx + Util.randi(-1, 1), ob.ty + Util.randi(-1, 1));
            node.pickups.push(new Pickup('heartBlue', s.x, s.y));
          }
        } else if (roll < 0.95) {
          node.pickups.push(new Pickup('coin', ob.tx, ob.ty, COIN_TYPES.find(c => c.id === 'dime')));
        } else {
          addItemPedestal(node, ITEMS.damageup, ob.tx, ob.ty);
        }
      // luckcrystal — same reward-hook mechanism as tintedrock just above,
      // branching to a small luck-flavored bonus instead: mostly a couple of
      // coins, occasionally a guaranteed Luckypenny, rarely a free Luck Up.
      // Deliberately bounded — a bonus, not a jackpot (see data.js).
      } else if (ob.kind === 'luckcrystal') {
        bumpStat('rocksBombed', 1, game);
        const roll = Math.random();
        if (roll < 0.70) {
          for (let i = 0; i < 2; i++) {
            const s = findClearFloorSpot(node, ob.tx + Util.randi(-1, 1), ob.ty + Util.randi(-1, 1));
            node.pickups.push(new Pickup('coin', s.x, s.y, Util.weighted(COIN_TYPES)));
          }
        } else if (roll < 0.95) {
          node.pickups.push(new Pickup('coin', ob.tx, ob.ty, COIN_TYPES.find(c => c.id === 'luckypenny')));
        } else {
          addItemPedestal(node, ITEMS.luckup, ob.tx, ob.ty);
        }
      } else if (ob.def.explodesOnDestroy) {
        bumpStat('bombBarrelsDetonated', 1, game); // see achievements.js's barrelpopper/chainbomber
        explodeAt(game, ob.x, ob.y, R);
      } else if (ob.kind.indexOf('turret') === 0) {
        bumpStat('turretsDestroyed', 1, game); // see achievements.js's turretwrecker/turretdemolisher
      }
    }
  }

  for (const slot of node.doorSlots) {
    if (slot.type !== 'secret' || slot.opened || !slot.cells) continue;
    for (const c of slot.cells) {
      const cx = c.x * TILE + TILE / 2, cy = c.y * TILE + TILE / 2;
      if (Util.dist(x, y, cx, cy) < R + 20) { openSecretPassage(game, slot); break; }
    }
  }

  // stone chests don't open on touch — only when caught in a blast
  for (const c of node.chests) {
    if (c.opened || c.def.requires !== 'bomb') continue;
    if (Util.dist(x, y, c.x, c.y) < R + c.radius) openChestContents(game, c);
  }
}

// Taygeta star — clears every destructible/attackable obstacle in the room
// at once, with the same rewards a bomb blast would've given each one (see
// explodeAt just above, which this mirrors the obstacle loop of). Unlike an
// actual explosion this never touches the player, enemies, chests, or secret
// walls — it's a pure convenience clear, not an area attack.
function destroyAllObstacles(game){
  const node = game.currentRoom, player = game.player;
  for (const ob of node.obstacles) {
    if (ob.destroyed || (!ob.destructible && !ob.attackable)) continue;
    ob.destroyed = true;
    Sound.play('obstacleDestroy');
    bumpStat('obstaclesDestroyed', 1, game);
    bumpBestiaryCount('objectsDestroyed', ob.kind, 1); // see js/bestiary.js
    if (ob.def.heartDropChance && Util.chance(ob.def.heartDropChance)) {
      node.pickups.push(new Pickup('heartRed', ob.tx, ob.ty));
    }
    if (ob.kind === 'rock' || ob.kind === 'tallrock') {
      bumpStat('rocksBombed', 1, game);
      if (player.passives.prospectorspick) node.pickups.push(new Pickup('coin', ob.tx, ob.ty, Util.weighted(COIN_TYPES)));
    } else if (ob.kind === 'tintedrock') {
      bumpStat('rocksBombed', 1, game);
      const roll = Math.random();
      if (roll < 0.75) {
        for (let i = 0; i < 2; i++) {
          const s = findClearFloorSpot(node, ob.tx + Util.randi(-1, 1), ob.ty + Util.randi(-1, 1));
          node.pickups.push(new Pickup('heartBlue', s.x, s.y));
        }
      } else if (roll < 0.95) {
        node.pickups.push(new Pickup('coin', ob.tx, ob.ty, COIN_TYPES.find(c => c.id === 'dime')));
      } else {
        addItemPedestal(node, ITEMS.damageup, ob.tx, ob.ty);
      }
    // luckcrystal — mirrors explodeAt's luck-flavored branch just above tintedrock's
    } else if (ob.kind === 'luckcrystal') {
      bumpStat('rocksBombed', 1, game);
      const roll = Math.random();
      if (roll < 0.70) {
        for (let i = 0; i < 2; i++) {
          const s = findClearFloorSpot(node, ob.tx + Util.randi(-1, 1), ob.ty + Util.randi(-1, 1));
          node.pickups.push(new Pickup('coin', s.x, s.y, Util.weighted(COIN_TYPES)));
        }
      } else if (roll < 0.95) {
        node.pickups.push(new Pickup('coin', ob.tx, ob.ty, COIN_TYPES.find(c => c.id === 'luckypenny')));
      } else {
        addItemPedestal(node, ITEMS.luckup, ob.tx, ob.ty);
      }
    } else if (ob.def.explodesOnDestroy) {
      bumpStat('bombBarrelsDetonated', 1, game); // see achievements.js's barrelpopper/chainbomber
      explodeAt(game, ob.x, ob.y, 92 * (player.bombRadiusMult || 1));
    } else if (ob.kind.indexOf('turret') === 0) {
      bumpStat('turretsDestroyed', 1, game); // see achievements.js's turretwrecker/turretdemolisher
    }
  }
}

// Antares star — flat damage to every living, non-boss enemy in the room at

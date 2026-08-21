'use strict';
/* ============================================================
   attackStyles.js — "layered attacks" (the rebalance pass's item
   redesign). A transformative item carries an `attackLayer:{style,...}`
   field on its data.js ITEMS entry instead of (or alongside) an ordinary
   stat bonus — see items.js's recalcPlayerStats, which rebuilds
   `player.attackLayers` from every owned item with one of these fields
   every time stats recalc (items are never lost mid-run, so this is
   just as correct as an imperative push, and stays consistent with how
   every other derived stat in that function already works).

   Layer 1 is the class's own attack (attackType/laser/charged/
   crystalVolley/greenFireAttack/shockwaveAttack, all untouched — see
   entities.js's Player constructor and combat.js's attack functions).
   Layers 2+ are these items. Owning two such items naturally gives you
   layer 2 *and* layer 3 stacked on the same attack, since every owned
   layer's handler fires, not just one.

   Two separate dispatch moments, because ranged damage resolves ASYNC
   (a bolt travels, then hits later in updateProjectiles) while melee/laser
   damage resolves the instant the attack fires:
     - runCastLayers(game, trigger, ctx) — fired once per attack EVENT
       (once per melee swing, once per shot group, once per volley cast),
       from the attack functions themselves. Styles here react to "you
       just attacked", not to any particular hit: echoShot, mirrorConvert,
       ricochetBolt, groundSlam, chargeNova.
     - runHitLayers(game, trigger, ctx) — fired once per enemy actually
       DAMAGED, wherever that resolves (synchronously inside the melee/
       laser functions, or from updateProjectiles' bolt-hits-enemy site for
       ranged/volley). Styles here react to a landed hit: chainLightning,
       knockbackPulse, onKillFragments, bloodPact.
   A style belongs to exactly one table — never both — so nothing can
   double-fire (a hit-time style firing once per cast would undercount a
   multi-target melee swing; a cast-time style firing once per hit would
   fire 3x on Crystal Pony's 3-shard volley landing on one target).

   `trigger` is 'melee'|'ranged'|'laser'|'volley'|'firezone' — the hook a
   style needs to react differently depending on the player's own MAIN
   attack style (e.g. mirrorConvert only adds a bolt on a 'melee' trigger).

   ctx shape (only the fields a given call site actually has are set):
     x, y     — world-space origin of the attack/hit
     ang      — facing/travel angle
     hits     — (cast-time only) every enemy damaged by this event
     dmg      — the damage that just landed (hit-time) or the attack's
                base damage (cast-time)
     projectiles — (cast-time, ranged/volley only) the Projectile
                instances just fired, for styles that need to tag them

   Batch 2 added three more verbs under the same split rule: scatterVolley
   (cast-time — reacts to "you attacked"), frostShatter and impactBurst
   (hit-time — both need the one specific enemy in ctx.hits).
   ============================================================ */

const CAST_ATTACK_STYLES = {
  // ---- echoShot: a true DELAYED weaker repeat of the triggering attack,
  // via player.delayedActions (ticked in combat.js's updatePlayer). Melee
  // echoes as a smaller cone swing, everything else echoes as a single
  // aimed bolt — so it reads as "an echo of what you just did," not a
  // fixed effect bolted onto every class the same way.
  echoShot(game, trigger, ctx, layer){
    const player = game.player;
    const delay = layer.delay || 0.25;
    const power = layer.power || 0.5;
    const ang = ctx.ang, x = ctx.x, y = ctx.y;
    player.delayedActions.push({
      time: delay,
      fn: () => {
        if (game.state !== 'playing') return;
        const node = game.currentRoom;
        if (trigger === 'melee') {
          const coneHalfWidth = Math.PI * 0.5;
          for (const e of node.enemies) {
            if (e.isDead) continue;
            const d = Util.dist(x, y, e.x, e.y);
            if (d >= player.meleeRange + e.radius) continue;
            const angTo = Math.atan2(e.y - y, e.x - x);
            if (Math.abs(normalizeAngle(angTo - ang)) < coneHalfWidth) dealPlayerDamage(game, e, ang, { dmgMult: power });
          }
        } else {
          game.projectiles.push(new Projectile(
            x, y, Math.cos(ang) * player.boltSpeed, Math.sin(ang) * player.boltSpeed,
            player.rangedDamage * power, 'player', { color:'#c9c3ff', radius:5, life:(player.rangeTiles * TILE) / player.boltSpeed }
          ));
        }
        Sound.play('rangedShot');
      },
    });
  },

  // ---- mirrorConvert: crosses the player's OWN main attack style — a
  // melee class also looses a weak bolt on every swing; anyone whose main
  // attack is already ranged/laser/volley/firezone gets a weak melee-range
  // burst instead. The "influenced by the main attack style" shape: the
  // effect is a genuinely different action depending on what class owns it.
  mirrorConvert(game, trigger, ctx, layer){
    const player = game.player, node = game.currentRoom;
    const power = layer.power || 0.4;
    if (trigger === 'melee') {
      game.projectiles.push(new Projectile(
        ctx.x, ctx.y, Math.cos(ctx.ang) * player.boltSpeed, Math.sin(ctx.ang) * player.boltSpeed,
        player.meleeDamage * power, 'player', { color:'#e0c9ff', radius:5, life:(player.rangeTiles * TILE) / player.boltSpeed }
      ));
    } else {
      const coneHalfWidth = Math.PI * 0.5;
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const d = Util.dist(ctx.x, ctx.y, e.x, e.y);
        if (d >= player.meleeRange + e.radius) continue;
        const angTo = Math.atan2(e.y - ctx.y, e.x - ctx.x);
        if (Math.abs(normalizeAngle(angTo - ctx.ang)) < coneHalfWidth) dealPlayerDamage(game, e, ctx.ang, { dmgMult: power });
      }
    }
  },

  // ---- groundSlam: melee-family attacks (melee swing, Diamond Dog's
  // shockwave) also deal a ring of AoE damage centered on the player.
  groundSlam(game, trigger, ctx, layer){
    if (trigger !== 'melee') return;
    const node = game.currentRoom, player = game.player;
    const radius = layer.radius || 70;
    const power = layer.power || 0.4;
    for (const e of node.enemies) {
      if (e.isDead) continue;
      if (Util.dist(player.x, player.y, e.x, e.y) > radius + e.radius) continue;
      const applied = e.takeDamage(player.meleeDamage * power, 0, 0);
      if (applied && e.isDead) handleEnemyDeath(game, e);
    }
  },

  // ---- chargeNova: every Nth attack EVENT (not hit) detonates a bonus
  // damage pulse centered on the player, regardless of trigger type.
  chargeNova(game, trigger, ctx, layer){
    const player = game.player, node = game.currentRoom;
    const key = '_chargeNovaCount_' + layer.itemId;
    player[key] = (player[key] || 0) + 1;
    const every = layer.every || 6;
    if (player[key] < every) return;
    player[key] = 0;
    const radius = layer.radius || 90;
    const power = layer.power || 1.2;
    Sound.play('bombExplode');
    for (const e of node.enemies) {
      if (e.isDead) continue;
      if (Util.dist(player.x, player.y, e.x, e.y) > radius + e.radius) continue;
      const applied = e.takeDamage(player.meleeDamage * power, 0, 0);
      if (applied && e.isDead) handleEnemyDeath(game, e);
    }
  },

  // ---- ricochetBolt: ranged-family projectiles (bolts, volley shards)
  // gain wall-bounces instead of just stopping — tags the projectile
  // itself so updateProjectiles' wall-collision code (see combat.js) can
  // special-case it once rather than this style needing its own per-frame
  // tracking.
  ricochetBolt(game, trigger, ctx, layer){
    if (!ctx.projectiles) return;
    for (const proj of ctx.projectiles) proj.ricochet = (proj.ricochet || 0) + (layer.bounces || 1);
  },

  // ---- orbitBlades: always-on spinning blades around the player, damage
  // on contact, entirely independent of whether you're attacking at all —
  // ticked every frame (trigger 'tick') from combat.js's updatePlayer, not
  // a real attack event. Kept in this table for one source of truth on
  // every style id, even though nothing ever calls it via runCastLayers.
  orbitBlades(game, trigger, ctx, layer){
    if (trigger !== 'tick') return;
    const player = game.player, node = game.currentRoom, dt = ctx.dt;
    const n = layer.blades || 2;
    const radius = layer.radius || 46;
    const speed = layer.spinSpeed || 2.6;
    player._orbitBladeAngle = (player._orbitBladeAngle || 0) + speed * dt;
    player._orbitBladeCooldowns = player._orbitBladeCooldowns || {};
    for (let i = 0; i < n; i++) {
      const ang = player._orbitBladeAngle + (i / n) * Math.PI * 2;
      const bx = player.x + Math.cos(ang) * radius, by = player.y + Math.sin(ang) * radius;
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const key = layer.itemId + ':' + i + ':' + e.id;
        if ((player._orbitBladeCooldowns[key] || 0) > 0) continue;
        if (Util.dist(bx, by, e.x, e.y) < 14 + e.radius) {
          const applied = e.takeDamage((layer.dmg || 0.5) * player.meleeDamage, Math.cos(ang) * 2, Math.sin(ang) * 2);
          if (applied) {
            player._orbitBladeCooldowns[key] = 0.4;
            applyOnHitStatuses(game, e);
            if (e.isDead) { bumpStat('meleeKills', 1, game); handleEnemyDeath(game, e); }
          }
        }
      }
    }
    for (const k in player._orbitBladeCooldowns) if (player._orbitBladeCooldowns[k] > 0) player._orbitBladeCooldowns[k] -= dt;
  },

  // ---- scatterVolley: every attack EVENT also sprays a fan of weak bolts
  // out from the attack's origin, whatever the player's own main attack is
  // (a melee swing scatters shrapnel just as a volley does — the fan scales
  // off whichever damage stat the trigger actually uses). Cast-time, because
  // it reacts to "you attacked", not to any particular hit, and it doesn't
  // need to know what the attack itself connected with. The spawned bolts are
  // deliberately untagged, exactly like onKillFragments' shards, so they can
  // never re-trigger layers off their own hits.
  scatterVolley(game, trigger, ctx, layer){
    const player = game.player;
    const n = layer.bolts || 2;
    const spread = layer.spread || 0.9;
    const power = layer.power || 0.3;
    const base = trigger === 'melee' ? player.meleeDamage : player.rangedDamage;
    for (let i = 0; i < n; i++) {
      // symmetric fan either side of the facing angle, never straight down it
      const off = (i - (n - 1) / 2) * (spread / Math.max(1, n - 1)) + (n === 1 ? spread * 0.5 : 0);
      const ang = ctx.ang + off;
      game.projectiles.push(new Projectile(
        ctx.x, ctx.y, Math.cos(ang) * player.boltSpeed * 0.9, Math.sin(ang) * player.boltSpeed * 0.9,
        base * power, 'player', { color:'#ffb37a', radius:4, life:(player.rangeTiles * TILE) / player.boltSpeed }
      ));
    }
  },

  // ---- skyfall: only reacts to ranged/volley triggers (a melee swing has
  // nothing to aim skyward with). Picks a random living non-boss target and
  // captures its (x,y) at cast time, then queues a delayed strike — same
  // player.delayedActions plumbing echoShot uses, ticked once per frame by
  // tickDelayedActions (see combat.js updatePlayer). Landing at the captured
  // spot (rather than tracking the enemy) means the target dying or moving
  // away before the strike lands doesn't cancel or reposition it.
  skyfall(game, trigger, ctx, layer){
    if (trigger !== 'ranged' && trigger !== 'volley') return;
    if (Math.random() >= (layer.chance || 0.18)) return;
    const node = game.currentRoom, player = game.player;
    const candidates = node.enemies.filter(e => !e.isDead && !e.isBoss);
    if (!candidates.length) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const tx = target.x, ty = target.y;
    const delay = layer.delay || 1.1;
    const radius = layer.radius || 60;
    const power = layer.power || 0.9;
    const dmg = (ctx.dmg || player.rangedDamage) * power;
    player.delayedActions.push({
      time: delay,
      fn: () => {
        if (game.state !== 'playing') return;
        game.explosions.push(new Explosion(tx, ty, radius));
        Sound.play('explosion');
        for (const e of game.currentRoom.enemies) {
          if (e.isDead || e.isBoss) continue;
          if (Util.dist(tx, ty, e.x, e.y) > radius + e.radius) continue;
          const applied = e.takeDamage(dmg, (e.x - tx) * 0.06, (e.y - ty) * 0.06);
          if (applied && e.isDead) handleEnemyDeath(game, e);
        }
      },
    });
  },
};

const HIT_ATTACK_STYLES = {
  // ---- chainLightning: on a landed hit, jump extra damage to one more
  // nearby enemy the attack didn't itself touch.
  chainLightning(game, trigger, ctx, layer){
    const node = game.currentRoom, player = game.player;
    const range = layer.range || 120;
    const power = layer.power || 0.5;
    const source = ctx.hits[0];
    let best = null, bestD = range;
    for (const e of node.enemies) {
      if (e.isDead || e === source) continue;
      const d = Util.dist(source.x, source.y, e.x, e.y);
      if (d < bestD) { best = e; bestD = d; }
    }
    if (best) {
      const applied = best.takeDamage((ctx.dmg || player.meleeDamage) * power, 0, 0);
      if (applied) {
        Sound.play('rangedShot');
        game.floatTexts.push(new FloatText(best.x, best.y - 20, 'zap', '#7fd0ff'));
        if (best.isDead) handleEnemyDeath(game, best);
      }
    }
  },

  // ---- knockbackPulse: every landed hit also shoves its target back
  // hard, reusing the exact 0-damage knockback trick stars.js's Saiph
  // already established (see stars.js knockbackNova).
  knockbackPulse(game, trigger, ctx, layer){
    const strength = layer.strength || 5;
    const e = ctx.hits[0];
    if (e.isDead) return;
    const dx = e.x - ctx.x, dy = e.y - ctx.y;
    const d = Math.hypot(dx, dy) || 1;
    e.takeDamage(0, (dx / d) * strength, (dy / d) * strength);
  },

  // ---- onKillFragments: a killing blow (from ANY trigger) scatters small
  // homing shards that seek out nearby survivors. These spawned shards are
  // deliberately NOT tagged with an attackTrigger — they never re-trigger
  // layers off their own hits, so this can't cascade into itself.
  onKillFragments(game, trigger, ctx, layer){
    const e = ctx.hits[0];
    if (!e.isDead) return;
    const player = game.player;
    const n = layer.fragments || 3;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.6;
      game.projectiles.push(new Projectile(
        e.x, e.y, Math.cos(ang) * 220, Math.sin(ang) * 220,
        player.rangedDamage * (layer.power || 0.35), 'player',
        { color:'#ffd97a', radius:4, life:1.4, homing:1 }
      ));
    }
  },

  // ---- bloodPact: every landed hit also spends a sliver of the player's
  // own HP for bonus damage on THAT SAME hit — the risk/reward "spend your
  // own health" pattern. Never lets the cost drop the player below half a
  // heart, and never re-enters (it adds to the hit that already landed,
  // it doesn't deal a brand new one), so it can't loop.
  bloodPact(game, trigger, ctx, layer){
    const player = game.player;
    const cost = layer.hpCost || 0.1;
    if (player.redCurrent - cost < 0.5) return;
    const e = ctx.hits[0];
    if (e.isDead) return;
    player.redCurrent -= cost;
    const power = layer.power || 0.5;
    const applied = e.takeDamage((ctx.dmg || player.meleeDamage) * power, 0, 0);
    if (applied && e.isDead) handleEnemyDeath(game, e);
  },

  // ---- frostShatter: a landed hit can chill its target solid, reusing the
  // exact freezeTimer field applyOnHitStatuses and familiars.js already set
  // (same boss-immunity rule, same enemiesFrozen stat bump) — and a target
  // that was ALREADY frozen shatters instead, taking bonus damage on that
  // same hit. Hit-time, so it reads one specific enemy out of ctx.hits.
  frostShatter(game, trigger, ctx, layer){
    const player = game.player;
    const e = ctx.hits[0];
    if (e.isDead) return;
    if (e.freezeTimer > 0) {
      const applied = e.takeDamage((ctx.dmg || player.meleeDamage) * (layer.power || 0.4), 0, 0);
      if (applied) {
        game.floatTexts.push(new FloatText(e.x, e.y - 20, 'shatter', '#7fd6e0'));
        if (e.isDead) handleEnemyDeath(game, e);
      }
      return;
    }
    if (e.isBoss) return;
    if (Math.random() >= (layer.chance || 0.2)) return;
    e.freezeTimer = Math.max(e.freezeTimer, layer.duration || 1.2);
    bumpStat('enemiesFrozen', 1, game);
    Sound.play('statusFreeze');
  },

  // ---- impactBurst: a landed hit detonates a small shockwave centred on the
  // TARGET (not the player), splashing every other enemy packed around it.
  // Distinct from chainLightning, which arcs to exactly one extra enemy no
  // matter how crowded the room is. Hit-time — it needs the specific enemy
  // that was struck as its epicentre.
  impactBurst(game, trigger, ctx, layer){
    const node = game.currentRoom, player = game.player;
    const source = ctx.hits[0];
    const radius = layer.radius || 60;
    const power = layer.power || 0.35;
    let anyHit = false;
    for (const e of node.enemies) {
      if (e.isDead || e === source) continue;
      if (Util.dist(source.x, source.y, e.x, e.y) > radius + e.radius) continue;
      const applied = e.takeDamage((ctx.dmg || player.meleeDamage) * power, 0, 0);
      if (applied) {
        anyHit = true;
        if (e.isDead) handleEnemyDeath(game, e);
      }
    }
    if (anyHit) Sound.play('bombExplode');
  },

  // ---- markedForDeath: a landed hit can mark its target Vulnerable (see
  // entities.js Enemy.vulnerableTimer / takeDamage's 1.5x multiplier), and a
  // target that's ALREADY marked takes a bonus burst on this same hit —
  // same shatter-on-reapply shape as frostShatter above, just for the new
  // status. Bosses are immune, matching every other status-touching style.
  markedForDeath(game, trigger, ctx, layer){
    const player = game.player;
    const e = ctx.hits[0];
    if (e.isDead) return;
    if (e.isBoss) return;
    if (e.vulnerableTimer > 0) {
      const applied = e.takeDamage((ctx.dmg || player.meleeDamage) * (layer.power || 0.5), 0, 0);
      if (applied) {
        game.floatTexts.push(new FloatText(e.x, e.y - 20, 'marked!', '#d84a4a'));
        if (e.isDead) handleEnemyDeath(game, e);
      }
      return;
    }
    if (Math.random() >= (layer.chance || 0.25)) return;
    e.vulnerableTimer = Math.max(e.vulnerableTimer, layer.duration || 2.5);
    bumpStat('enemiesMarkedVulnerable', 1, game);
    Sound.play('statusStun');
  },

  // ---- venomBloom: a landed hit can poison its target the normal way, and
  // a target that's ALREADY poisoned "blooms" — bonus damage to it plus a
  // poison spread to every other living non-boss enemy standing nearby.
  // Bosses are immune to receiving poison from this (matching every other
  // status style) but a bloom can still spread poison onto non-boss enemies
  // standing near a boss, same as any other AoE would.
  venomBloom(game, trigger, ctx, layer){
    const node = game.currentRoom, player = game.player;
    const e = ctx.hits[0];
    if (e.isDead) return;
    if (e.isBoss) return;
    const radius = layer.radius || 90;
    if (e.poisonTimer > 0) {
      const applied = e.takeDamage((ctx.dmg || player.meleeDamage) * (layer.power || 0.4), 0, 0);
      if (applied) {
        for (const other of node.enemies) {
          if (other === e || other.isDead || other.isBoss) continue;
          if (Util.dist(e.x, e.y, other.x, other.y) > radius + other.radius) continue;
          other.poisonTimer = Math.max(other.poisonTimer, 3);
          if (other.poisonTickTimer <= 0) other.poisonTickTimer = 0.8;
        }
        game.floatTexts.push(new FloatText(e.x, e.y - 20, 'bloom!', '#8ac93a'));
        if (e.isDead) handleEnemyDeath(game, e);
      }
      return;
    }
    if (Math.random() >= (layer.chance || 0.3)) return;
    e.poisonTimer = Math.max(e.poisonTimer, 4);
    if (e.poisonTickTimer <= 0) e.poisonTickTimer = 0.8;
    Sound.play('statusPoison');
  },
};

// fired once per attack EVENT (see header comment) — echoShot/mirrorConvert/
// groundSlam/chargeNova/ricochetBolt.
function runCastLayers(game, trigger, ctx){
  const player = game.player;
  if (!player.attackLayers || !player.attackLayers.length) return;
  for (const layer of player.attackLayers) {
    const handler = CAST_ATTACK_STYLES[layer.style];
    if (handler) handler(game, trigger, ctx, layer);
  }
}

// fired once per enemy actually DAMAGED (see header comment) —
// chainLightning/knockbackPulse/onKillFragments/bloodPact. ctx.hits is
// always exactly one enemy here (unlike runCastLayers' ctx.hits, which can
// list several) — called once per individual landed hit, not once per event.
function runHitLayers(game, trigger, ctx){
  const player = game.player;
  if (!player.attackLayers || !player.attackLayers.length) return;
  for (const layer of player.attackLayers) {
    const handler = HIT_ATTACK_STYLES[layer.style];
    if (handler) handler(game, trigger, ctx, layer);
  }
}

// orbitBlades is the one style that runs every frame instead of off an
// attack event — called once per frame from combat.js's updatePlayer.
function tickOrbitBlades(game, dt){
  const player = game.player;
  if (!player.attackLayers || !player.attackLayers.length) return;
  for (const layer of player.attackLayers) {
    if (layer.style === 'orbitBlades') CAST_ATTACK_STYLES.orbitBlades(game, 'tick', { dt }, layer);
  }
}

// ticks player.delayedActions (see entities.js) — called once per frame
// from combat.js's updatePlayer, same neighborhood as tickOrbitBlades.
function tickDelayedActions(player, dt){
  if (!player.delayedActions.length) return;
  for (let i = player.delayedActions.length - 1; i >= 0; i--) {
    const a = player.delayedActions[i];
    a.time -= dt;
    if (a.time <= 0) { a.fn(); player.delayedActions.splice(i, 1); }
  }
}

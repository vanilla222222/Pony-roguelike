'use strict';
// systems/combat-2.js — split from combat.js (part 2/4).

// Dragon's hold-to-charge gate — called every frame input.attack is held.
// Nothing fires until chargeTimer fills; releasing the button early (see
// updatePlayer) resets it to 0, so a charge can never be "banked" across
// separate presses. Once full, playerFireBreathAttack does the actual hit
// and the normal attackTimer/fireCooldown governs recovery afterward, same
// as any other ranged class.
function playerChargedBeamAttack(game, dt, input){
  const player = game.player;
  if (player.attackTimer > 0) { player.chargeTimer = 0; return; } // still recovering from the last blast — can't pre-charge through it
  player.chargeTimer += dt;
  if (player.chargeTimer < player.chargeTime) return;
  player.chargeTimer = 0;
  player.attackTimer = player.fireCooldown;
  // the charge plumbing is shared; WHAT a full charge fires is per-class.
  // Phase 11 un-bleed pass — Dragon's own `gemBreath` and Unicorn's own
  // `shardFan` both trigger the same convergent-volley function under
  // their own flag rather than sharing Crystal Pony's `crystalVolley`.
  if (player.crystalVolley || player.gemBreath || player.shardFan) playerCrystalVolleyAttack(game, input);
  else playerFireBreathAttack(game);
}

// Crystal Pony's signature attack: three shards loosed at once from three
// points across her flank (left/centre/right, perpendicular to her facing),
// each aimed at the CURSOR rather than straight ahead — so they converge on
// the point you're aiming at instead of travelling as a parallel wall. Fired
// by playerChargedBeamAttack once her 0.7s charge fills.
// px between adjacent shard start points — the SEED value only: the live
// number is the per-instance player.crystalVolleySpacing shadow field
// (entities.js's Player constructor), so a skilltree.js uniqueField node can
// tune the spread the same way it can tune crystalShardCount.
const CRYSTAL_VOLLEY_SPACING_DEFAULT = 34;
function playerCrystalVolleyAttack(game, input){
  const player = game.player;
  input = input || {};
  // shard count is per-instance (player.crystalShardCount, seeded to 3 in
  // entities.js's Player constructor) rather than a fixed 3-element array,
  // so a skilltree.js uniqueField node can add/subtract shards. Offsets are
  // spread evenly around 0, preserving the exact original [-34, 0, 34]
  // spacing/positions when count is still 3.
  const count = player.crystalShardCount || 0;
  if (count <= 0) return; // guard: no shots fired rather than crashing on a hypothetical 0
  const offsets = [];
  const spacing = player.crystalVolleySpacing || CRYSTAL_VOLLEY_SPACING_DEFAULT;
  for (let i = 0; i < count; i++) offsets.push((i - (count - 1) / 2) * spacing);
  Sound.play('rangedShot');
  bumpStat('shotsFired', 1, game);
  // same viewport→world conversion updatePlayer's facing calc does, recomputed
  // here — the world cursor position isn't stored anywhere
  let focusX, focusY;
  if (input.mouseActive) {
    focusX = input.mouseX + game.camX; focusY = input.mouseY + game.camY;
  } else {
    // keyboard aiming: no cursor, so the focal point is a spot straight ahead
    focusX = player.x + player.facing.x * player.rangeTiles * TILE;
    focusY = player.y + player.facing.y * player.rangeTiles * TILE;
  }
  const px = -player.facing.y, py = player.facing.x; // perpendicular to facing
  // uncapped regardless of player.rangeTiles/unlimitedRange — the shards are
  // meant to travel however far the room actually is, not stop short at her
  // normal ranged-attack range the way a plain bolt would
  const life = 999;
  const firedShards = []; // attack-layer styles (see attackStyles.js)
  for (const off of offsets) {
    const sx = player.x + px * off + player.facing.x * 10;
    const sy = player.y + py * off + player.facing.y * 10;
    // each shard aims from ITS OWN start at the shared focal point
    let dx = focusX - sx, dy = focusY - sy;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) { dx = player.facing.x; dy = player.facing.y; }
    else { dx /= len; dy /= len; }
    const proj = new Projectile(
      sx, sy, dx * player.boltSpeed, dy * player.boltSpeed, player.rangedDamage, 'player',
      { color:'#a8e8ff', radius:6, pierce: player.tearFlags.pierce, life,
        homing: player.tearFlags.homing, spectral: player.tearFlags.spectral, explosive: player.tearFlags.explosive }
    );
    proj.attackTrigger = 'volley'; // read by updateProjectiles' hit site to fire runHitLayers
    game.projectiles.push(proj);
    firedShards.push(proj);
  }
  runCastLayers(game, 'volley', { x: player.x, y: player.y, ang: Math.atan2(player.facing.y, player.facing.x), hits: [], dmg: player.rangedDamage, projectiles: firedShards });
}

// Dragon's signature attack: a short jet of dragonfire — the same
// raycast-and-pierce shape as Pony Bot's laser just above, but capped to a
// short range (see CLASSES.dragon's low baseRangeTiles) instead of spanning
// the whole room.
function playerFireBreathAttack(game){
  const player = game.player, node = game.currentRoom;
  Sound.play('laserShot');
  bumpStat('shotsFired', 1, game);
  const ang = Math.atan2(player.facing.y, player.facing.x);
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const maxDist = player.rangeTiles * TILE;
  const step = 6;
  const hitSet = new Set();
  // same guards playerLaserAttack's ray uses — attackable obstacles (bomb
  // barrels above all) take damage too, once per obstacle per breath; the
  // jet still pierces through them exactly as it already pierces enemies
  const hitObstacles = new Set();
  let endDist = maxDist;
  for (let dist = 0; dist < maxDist; dist += step) {
    const px = player.x + dx * dist, py = player.y + dy * dist;
    if (isTileSolidForEntity(node, Math.floor(px / TILE), Math.floor(py / TILE))) { endDist = dist; break; }
    for (const e of node.enemies) {
      if (e.isDead || hitSet.has(e)) continue;
      if (Util.dist2(px, py, e.x, e.y) < e.radius * e.radius) hitSet.add(e);
    }
    for (const ob of node.obstacles) {
      if (ob.destroyed || ob.isPit || ob.isWalkable || hitObstacles.has(ob)) continue;
      if (!ob.attackable) continue; // rocks/turrets/blue+purple fire: fire breath can't hurt them either
      if (Util.circleIntersect(px, py, 2, ob.x, ob.y, ob.radius - 2)) hitObstacles.add(ob);
    }
  }
  for (const ob of hitObstacles) damageObstacleHit(game, ob);
  for (const e of hitSet) {
    let dmg = player.rangedDamage, crit = false;
    if (player.critChance && Math.random() < player.critChance) { dmg *= player.critMultiplier; crit = true; }
    if (e.isBoss && player.bossDamageBonus) dmg *= (1 + player.bossDamageBonus);
    const applied = e.takeDamage(dmg, dx * 3, dy * 3);
    if (applied) {
      player.onHitLanded();
      Sound.play(crit ? 'crit' : 'enemyHit');
      if (crit) { bumpStat('critsLanded', 1, game); e._lastHitCrit = true; } // see combat-1.js's identical comment — consumed by render.js's drawEnemy
      applyOnHitStatuses(game, e);
      game.floatTexts.push(new FloatText(e.x, e.y - 20, (crit ? 'CRIT ' : '') + dmg, crit ? '#ffcf5c' : '#fff'));
      if (e.isDead) { bumpStat('rangedKills', 1, game); handleEnemyDeath(game, e); }
    }
  }
  game.laserFX = { x1: player.x, y1: player.y, x2: player.x + dx * endDist, y2: player.y + dy * endDist, life: 0.16, maxLife: 0.16, color: '224,122,58', width: 8 };
}

function dealPlayerDamage(game, enemy, ang, opts){
  const player = game.player;
  let dmg = player.attackType === 'melee' ? player.meleeDamage : player.rangedDamage;
  if (opts && opts.dmgMult) dmg *= opts.dmgMult; // attack-layer styles (see attackStyles.js) — a weaker echo/mirror hit
  let crit = false;
  if (player.critChance && Math.random() < player.critChance) { dmg *= player.critMultiplier; crit = true; }
  if (enemy.isBoss && player.bossDamageBonus) dmg *= (1 + player.bossDamageBonus);
  const kx = Math.cos(ang) * 4, ky = Math.sin(ang) * 4;
  const applied = enemy.takeDamage(dmg, kx, ky);
  if (applied) {
    player.onHitLanded();
    Sound.play(crit ? 'crit' : 'enemyHit');
    if (crit) { bumpStat('critsLanded', 1, game); enemy._lastHitCrit = true; } // see combat-1.js's identical comment — consumed by render.js's drawEnemy
    applyOnHitStatuses(game, enemy);
    game.floatTexts.push(new FloatText(enemy.x, enemy.y - 20, (crit ? 'CRIT ' : '') + dmg, crit ? '#ffcf5c' : '#fff'));
    if (enemy.isDead) { bumpStat('meleeKills', 1, game); handleEnemyDeath(game, enemy); }
  }
  return applied; // attack-layer styles (see attackStyles.js) use this to build their hit lists
}

// venom/hard hitter/flirtatious/cold heart/terrifying — luck-scaled, never affect bosses
function applyOnHitStatuses(game, enemy){
  if (enemy.isBoss) return;
  const player = game.player;
  // Hex Brand (expand-everything trinket batch, see data.js) — one shared
  // duration multiplier for all five statuses. 1 for everyone else, so the
  // Math.max() base durations below are byte-for-byte what they always were.
  const sd = player.trinketId === 'hexbrand' ? 1.5 : 1;
  if (player.venomChance && Math.random() < player.venomChance) { enemy.poisonTimer = Math.max(enemy.poisonTimer, 4 * sd); if (enemy.poisonTickTimer <= 0) enemy.poisonTickTimer = 0.8; Sound.play('statusPoison'); }
  if (player.stunChance && Math.random() < player.stunChance) { enemy.stunTimer = Math.max(enemy.stunTimer, 2 * sd); Sound.play('statusStun'); }
  if (player.charmChance && Math.random() < player.charmChance) { enemy.charmTimer = Math.max(enemy.charmTimer, 4 * sd); bumpStat('enemiesCharmed', 1, game); Sound.play('statusCharm'); }
  if (player.freezeChance && Math.random() < player.freezeChance) { enemy.freezeTimer = Math.max(enemy.freezeTimer, 1.5 * sd); bumpStat('enemiesFrozen', 1, game); Sound.play('statusFreeze'); }
  if (player.fearChance && Math.random() < player.fearChance) { enemy.fearTimer = Math.max(enemy.fearTimer, 2.5 * sd); Sound.play('statusFear'); }
  // Vulnerable — the 6th status. No dedicated SFX exists yet, so it reuses
  // statusStun's cue (see items.js recalcPlayerStats for vulnerableChance).
  if (player.vulnerableChance && Math.random() < player.vulnerableChance) { enemy.vulnerableTimer = Math.max(enemy.vulnerableTimer, 3 * sd); bumpStat('enemiesMarkedVulnerable', 1, game); Sound.play('statusStun'); }
}

// treasure/shop rooms don't unlock on combat — they're locked behind a key
// instead. Doors only ever check the room the player is CURRENTLY standing
// in (see the isOpen check below — that's also how the ordinary combat lock
// works: a cleared room's doors are open to leave through no matter what's
// on the other side), so the key lock has to look both ways: is *this* room
// the unopened treasure/shop, or is the one across the door? Returns
// whichever one actually needs a key, or null if neither does.
const KEY_LOCKED_ROOM_TYPES = new Set(['treasure', 'shop', 'vault', 'star']);
function keyLockedRoomFor(node, slot){
  if (KEY_LOCKED_ROOM_TYPES.has(node.type) && !node.doorsOpen) return node;
  const other = slot.pairedSlot && slot.pairedSlot.room;
  if (other && KEY_LOCKED_ROOM_TYPES.has(other.type) && !other.doorsOpen) return other;
  return null;
}

function tryUnlockKeyDoor(game, node, lockedRoom){
  const player = game.player;
  if (player.keys > 0 || player.unlimitedKeysFloor) {
    if (!player.unlimitedKeysFloor) player.keys--;
    lockedRoom.doorsOpen = true;
    lockedRoom.tileLayerDirty = true; // baked tile-layer cache (render.js) must redraw the now-open door
    Sound.play('key');
    game.toast('Used a key to open the door.');
    bumpStat('keysUsed', 1, game);
    if (lockedRoom.type === 'vault') bumpStat('vaultsOpened', 1, game); // see achievements.js's vaultopener/vaultmaster
  } else if (node.keyToastCooldown <= 0) {
    node.keyToastCooldown = 1.5;
    Sound.play('uiDeny');
    game.toast('Locked — need a key.');
  }
}

// Arcade rooms (Phase 4) don't unlock on combat OR a key — they're gated
// behind a flat coin toll instead, same two-sided "which side of this door
// actually needs paying" shape as keyLockedRoomFor above.
const COIN_LOCKED_ROOM_TYPES = new Set(['arcade']);
const ARCADE_TOLL = 1;
function coinLockedRoomFor(node, slot){
  if (COIN_LOCKED_ROOM_TYPES.has(node.type) && !node.doorsOpen) return node;
  const other = slot.pairedSlot && slot.pairedSlot.room;
  if (other && COIN_LOCKED_ROOM_TYPES.has(other.type) && !other.doorsOpen) return other;
  return null;
}

function tryUnlockCoinDoor(game, node, lockedRoom){
  const player = game.player;
  if (player.coins >= ARCADE_TOLL) {
    player.coins -= ARCADE_TOLL;
    lockedRoom.doorsOpen = true;
    lockedRoom.tileLayerDirty = true; // baked tile-layer cache (render.js) must redraw the now-open door
    Sound.play('coin');
    game.toast('Paid 1c to enter.');
    bumpStat('coinsSpent', ARCADE_TOLL, game);
  } else if (node.keyToastCooldown <= 0) {
    // reuses the key-lock's own cooldown field — it's really just "a door
    // deny toast is already showing", not something specific to keys
    node.keyToastCooldown = 1.5;
    Sound.play('uiDeny');
    game.toast('Locked — needs 1 coin.');
  }
}

function checkDoorTransition(game, dt){
  const node = game.currentRoom, player = game.player;
  if (node.keyToastCooldown > 0) node.keyToastCooldown -= dt;
  for (const slot of node.doorSlots) {
    if ((slot.type !== 'normal' && slot.type !== 'secret') || !slot.cells) continue;
    const cx = slot.cells.reduce((a, c) => a + c.x, 0) / slot.cells.length;
    const cy = slot.cells.reduce((a, c) => a + c.y, 0) / slot.cells.length;
    const px = cx * TILE + TILE / 2, py = cy * TILE + TILE / 2;
    const nearDoor = Util.dist(player.x, player.y, px, py) < 16;
    if (!nearDoor) continue;

    if (slot.type === 'normal') {
      const lockedRoom = keyLockedRoomFor(node, slot);
      if (lockedRoom) { tryUnlockKeyDoor(game, node, lockedRoom); return; }
      const coinLockedRoom = coinLockedRoomFor(node, slot);
      if (coinLockedRoom) { tryUnlockCoinDoor(game, node, coinLockedRoom); return; }
    }

    const isOpen = slot.type === 'normal' ? node.doorsOpen : !!slot.opened;
    if (!isOpen) continue;
    game.transitionThroughDoor(slot);
    return;
  }
}

/* ---------------------------------------------------------------
   Pickups & chests
   --------------------------------------------------------------- */
function updatePickups(game, dt){
  const node = game.currentRoom, player = game.player;
  if (player.magnetRadius > 0) {
    for (const p of node.pickups) {
      if (p.collected) continue;
      const d = Util.dist(p.x, p.y, player.x, player.y);
      if (d > 1 && d < player.magnetRadius) {
        const pull = Math.min(d, 240 * dt);
        p.x += (player.x - p.x) / d * pull;
        p.y += (player.y - p.y) / d * pull;
      }
    }
  }
  let changed = false;
  for (const p of node.pickups) {
    if (p.collected) continue;
    if (Util.circleIntersect(p.x, p.y, p.radius, player.x, player.y, player.radius)) {
      collectPickup(game, p);
      changed = true;
    }
  }
  if (changed) node.pickups = node.pickups.filter(p => !p.collected);
}

// which chime a coin plays depends on its tier — see COIN_TYPES in data.js
function coinSoundName(coin){
  if (!coin) return 'coin';
  switch (coin.id) {
    case 'nickel': return 'coinNickel';
    case 'dime': return 'coinDime';
    case 'luckypenny': return 'coinLucky';
    default: return 'coin';
  }
}

// resolves the effect of any pickup kind — used for a world Pickup being
// walked over, for Sack granting 3 of these at once, and for shop purchases
// (see items.js grantPickupKind) — one place to add a new pickup kind.
function grantPickupEffect(game, kind, x, y, coin, pillColor, starId){
  const player = game.player;
  // pickups bestiary tab (see js/bestiary.js) — mark every kind on grant;
  // pill/star mark their own bucket further down and are skipped here.
  if (kind !== 'coin' && kind !== 'pill' && kind !== 'star') markBestiarySeen('seenPickupKinds', kind);
  switch (kind) {
    case 'coin': {
      const c = coin || Util.weighted(COIN_TYPES);
      // 'coin' itself resolves to its actual tier id (penny/nickel/dime/
      // luckypenny/cursedpenny is its own separate kind, not a coin tier) —
      // that's what PICKUP_TYPE_LIST lists, not the generic 'coin' wrapper.
      markBestiarySeen('seenPickupKinds', c.id);
      const coinMult = (player.trinketId === 'cursedcoin' ? 1.2 : player.trinketId === 'copperring' ? 1.1
        : player.trinketId === 'stackedcoin' ? 1.15 : player.trinketId === 'barnaclecluster' ? 1.2
        : player.trinketId === 'wovenboots' ? 1.15 : player.trinketId === 'solarscroll' ? 1.15 : player.trinketId === 'copperbelt' ? 1.1
        : player.trinketId === 'merchantscoin' ? 1.1
        : player.trinketId === 'sk8t_giltclasp' ? 1.12 // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js)
        : 1) + 0.2 * (player.passives.gluttonyscoin || 0)
        // 75-achievement + 25-unlocked batch (see data.js) — coin value contributions
        + 0.15 * (player.passives.overflowingpurse || 0) + 0.25 * (player.passives.misersvault || 0)
        + 0.35 * (player.passives.dragonshoardshard || 0) + 0.15 * (player.passives.coincollectorsglove || 0)
        // supermassive update batch (see data.js)
        + 0.2 * (player.passives.sapphirelocket || 0) + 0.2 * (player.passives.gildedring || 0) + 0.1 * (player.passives.etchedchain || 0)
        + 0.2 * (player.passives.vividcompass || 0);
      const value = Math.round(c.value * coinMult);
      player.coins += value;
      bumpStat('coinsCollected', value, game);
      Sound.play(coinSoundName(c));
      game.floatTexts.push(new FloatText(x, y, '+' + value + 'c', '#e3c15b'));
      if (c.luck) {
        player.luckyPennies += c.luck;
        recalcPlayerStats(player);
        game.floatTexts.push(new FloatText(x, y - 16, '+' + c.luck + ' Luck', '#7fd66a'));
      }
      break;
    }
    // Master Bit / Powder Flask (expand-everything trinket batch, see data.js)
    // only touch the single-pickup cases — the Double/Gold variants are their
    // own reward tier and are deliberately left alone.
    case 'key': { const n = player.trinketId === 'masterbit' ? 2 : 1; player.keys += n; Sound.play('key'); game.floatTexts.push(new FloatText(x, y, '+' + n + ' key' + (n > 1 ? 's' : ''), '#dcdcdc')); break; }
    case 'doublekey': player.keys += 2; Sound.play('key'); game.floatTexts.push(new FloatText(x, y, '+2 keys', '#dcdcdc')); break;
    case 'goldkey': player.unlimitedKeysFloor = true; Sound.play('key'); game.floatTexts.push(new FloatText(x, y, 'Unlimited keys!', '#e3c15b')); break;
    case 'bomb': { const n = (player.trinketId === 'powderflask' || player.trinketId === 'sk8t_direkegcharm') ? 2 : 1; player.bombs += n; Sound.play('bombPickup'); game.floatTexts.push(new FloatText(x, y, '+' + n + ' bomb' + (n > 1 ? 's' : ''), '#dcdcdc')); break; } // sk8t_direkegcharm: Phase 8e slice 2 (see data/trinkets-2.js)
    case 'doublebomb': player.bombs += 2; Sound.play('bombPickup'); game.floatTexts.push(new FloatText(x, y, '+2 bombs', '#dcdcdc')); break;
    case 'goldbomb': player.unlimitedBombsFloor = true; Sound.play('bombPickup'); game.floatTexts.push(new FloatText(x, y, 'Unlimited bombs!', '#e3c15b')); break;
    case 'heartRed': player.heal(player.passives.swiftrecovery ? 1.5 : 1); Sound.play('heart'); game.floatTexts.push(new FloatText(x, y, '+heart', '#e35b6a')); break;
    case 'heartBlue': player.healBlue(1); Sound.play('heart'); game.floatTexts.push(new FloatText(x, y, '+heart', '#5b9ee3')); break;
    case 'halfheartRed': player.heal(player.passives.swiftrecovery ? 0.75 : 0.5); Sound.play('heart'); game.floatTexts.push(new FloatText(x, y, '+½ heart', '#e35b6a')); break;
    case 'halfheartBlue': player.healBlue(0.5); Sound.play('heart'); game.floatTexts.push(new FloatText(x, y, '+½ heart', '#5b9ee3')); break;
    case 'doubleheart': player.heal(player.passives.swiftrecovery ? 3 : 2); Sound.play('heart'); game.floatTexts.push(new FloatText(x, y, '+2 hearts', '#e35b6a')); break;
    case 'heartContainer': player.grantHeartContainer(1); Sound.play('heartContainer'); game.floatTexts.push(new FloatText(x, y, '+container', '#e35b6a')); break;
    // a temporary half-pip that pays off if you reach the next floor without
    // an unshielded hit — see entities.js takeDamage / game.js descend()
    case 'eternalheart':
      if (!player.eternalHeart) {
        player.eternalHeart = true;
        player.redMax += 0.5;
        player.redCurrent = Math.min(player.redMax, player.redCurrent + 0.5);
      }
      Sound.play('heartContainer');
      game.floatTexts.push(new FloatText(x, y, 'Eternal Heart!', '#e8e8e8'));
      break;
    // a held half-heart of "banked" healing — pays out at the end of every
    // room you clear untouched, and is lost by any hit that registers
    // (see entities.js takeDamage / game.js onRoomJustCleared)
    case 'goldheart':
      player.goldHeart = true;
      Sound.play('heart');
      game.floatTexts.push(new FloatText(x, y, 'Gold Heart!', '#f0c85a'));
      break;
    // a pure gamble — six weighted outcomes, one of which bites back
    case 'cursedpenny': {
      const outcome = Util.weighted([
        { id:'plus1', w:20 }, { id:'plus2', w:15 }, { id:'nothing', w:20 },
        { id:'minus1', w:20 }, { id:'minus2', w:15 }, { id:'explode', w:10 },
      ]).id;
      if (outcome === 'plus1') {
        player.coins += 1;
        Sound.play('coin');
        game.floatTexts.push(new FloatText(x, y, '+1 coin', '#e3c15b'));
      } else if (outcome === 'plus2') {
        player.coins += 2;
        Sound.play('coinLucky');
        game.floatTexts.push(new FloatText(x, y, '+2 coins', '#e3c15b'));
      } else if (outcome === 'nothing') {
        Sound.play('coin');
        game.floatTexts.push(new FloatText(x, y, '...nothing happens', '#8a86a0'));
      } else if (outcome === 'minus1') {
        player.coins = Math.max(0, player.coins - 1);
        Sound.play('coin');
        game.floatTexts.push(new FloatText(x, y, '-1 coin', '#a3617f'));
      } else if (outcome === 'minus2') {
        player.coins = Math.max(0, player.coins - 2);
        Sound.play('coin');
        game.floatTexts.push(new FloatText(x, y, '-2 coins', '#a3617f'));
      } else {
        // 0.5 = half a heart pip, same unit heal()/halfheartRed use above
        Sound.play('explosion');
        game.floatTexts.push(new FloatText(x, y, 'It explodes!', '#e0895a'));
        game.toast('Cursed! The penny explodes.');
        player.takeDamage(0.5, 'explosion');
      }
      break;
    }
    case 'battery': {
      const charged = !!player.activeItem;
      if (charged) player.activeCharge = player.activeItem.maxCharge;
      Sound.play('battery');
      game.floatTexts.push(new FloatText(x, y, charged ? 'Charged!' : 'No active item', charged ? '#7fd6c9' : '#8a86a0'));
      break;
    }
    case 'minibattery': {
      const charged = !!player.activeItem;
      if (charged) player.activeCharge = Math.min(player.activeItem.maxCharge, player.activeCharge + 2);
      Sound.play('battery');
      game.floatTexts.push(new FloatText(x, y, charged ? '+2 charge' : 'No active item', charged ? '#7fd6c9' : '#8a86a0'));
      break;
    }
    case 'sack': {
      Sound.play('sack');
      game.floatTexts.push(new FloatText(x, y, 'Sack!', '#e0895a'));
      for (let i = 0; i < 3; i++) grantPickupEffect(game, rollGenericPickupKind(), x, y - 16 - i * 14);
      break;
    }
    // Phase 16 — the friendly fly family's dedicated sack (data/
    // familiars-3.js's friendlybluefly/friendlyyellowfly are
    // `trashBagOnly:true`, so this is genuinely their only source — see
    // room.js's pickFamiliarFromPool). Same "burst open" shape as a plain
    // Sack above, just handing out one specific familiar instead of 3
    // random pickups.
    case 'trashbag': {
      Sound.play('sack');
      const id = Util.chance(0.5) ? 'friendlybluefly' : 'friendlyyellowfly';
      game.floatTexts.push(new FloatText(x, y, 'Trash Bag!', '#8ac95a'));
      hatchFriendlyFly(game, id);
      break;
    }
    case 'pill': {
      const color = pillColor || rollRandomPillColorId(); // room.js — keeps locked swatches out of shop/chest pills too
      const previous = player.pillPocket;
      player.pillPocket = color;
      markBestiarySeen('seenPills', color); // see js/bestiary.js
      Sound.play('itemGet');
      const known = game.pillIdentified[color];
      const label = known ? (PILL_COLORS_BY_ID[color].name + ' (' + PILL_EFFECTS[game.pillEffectMap[color]].name + ')') : PILL_COLORS_BY_ID[color].name;
      game.toast('Picked up a ' + label + '!' + (previous ? ' (previous pill lost)' : ''));
      game.floatTexts.push(new FloatText(x, y, label, '#c9c3ff'));
      break;
    }
    case 'star': {
      // unlike a pill, a star never needs identifying — the name and effect
      // are shown right away, both here and in the HUD (see ui.js)
      const id = starId || rollRandomStarId();
      const previous = player.starPocket;
      player.starPocket = id;
      markBestiarySeen('seenStars', id); // see js/bestiary.js
      Sound.play('itemGet');
      const def = STAR_TYPES[id];
      game.toast('Picked up ' + def.name + '!' + (previous ? ' (previous star lost)' : ''));
      game.floatTexts.push(new FloatText(x, y, def.name, def.color));
      break;
    }
  }
}

function collectPickup(game, p){
  grantPickupEffect(game, p.kind, p.x, p.y - 10, p.coin, p.pillColor, p.starId);
  p.collected = true;
}

function updateChests(game){
  const node = game.currentRoom, player = game.player;
  for (const c of node.chests) {
    if (c.opened) continue;
    if (c.def.requires === 'bomb') continue; // stone chests only open when caught in a bomb blast — see detonateBomb
    const touching = Util.circleIntersect(c.x, c.y, c.radius, player.x, player.y, player.radius + 4);
    // a re-openable Eternal Chest (see openChestContents) is still under the
    // player the frame after it pops back open — without this the next frame
    // would instantly reopen it and drain every key held. Step off, step back.
    if (c.reopenLock) { if (!touching) c.reopenLock = false; continue; }
    if (touching) tryOpenChest(game, c);
  }
}

// touch-opened chests: gold (spend a key), cursed (spend hearts), grey (free)
function tryOpenChest(game, c){
  const player = game.player;
  if (c.def.requires === 'key') {
    if (!player.unlimitedKeysFloor) {
      if (player.keys <= 0) return;
      player.keys--;
    }
  } else if (c.def.requires === 'hearts') {
    const cost = player.passives.cursedlocket ? Math.max(0.5, c.def.heartCost - 1) : c.def.heartCost;
    const avail = player.redCurrent + player.blueCurrent;
    if (avail <= cost) return; // must always have something left over — a chest shouldn't be able to kill you
    player.spendHearts(cost);
  }
  openChestContents(game, c);
}

function openChestContents(game, c){
  const node = game.currentRoom, player = game.player;
  c.opened = true;
  Sound.play('chestOpen');
  const minPickups = player.passives.midastouch ? 3 : 1;
  const n = Util.randi(minPickups, 5);
  for (let i = 0; i < n; i++) {
    const tx = Util.clamp(Math.floor(c.x / TILE) + Util.randi(-1, 1), 1, node.tileW - 2);
    const ty = Util.clamp(Math.floor(c.y / TILE) + Util.randi(-1, 1), 1, node.tileH - 2);
    const spot = findClearFloorSpot(node, tx, ty);
    // a Wooden Chest only ever coughs up consumables — pills and stars, 50/50
    const kind = c.kind === 'wood' ? (Util.chance(0.5) ? 'pill' : 'star') : rollGenericPickupKind();
    spawnResolvedPickup(node, kind, spot.x, spot.y);
  }
  const itemChance = c.def.itemChance + (player.trinketId === 'brasskey' ? 0.05 : 0);
  if (Util.chance(itemChance)) {
    // wood's itemChance is 1.0, so its bonus always fires — and it's always a
    // trinket, never a familiar or an item
    if (c.kind === 'wood') {
      equipTrinket(game, pickTrinketFromPool());
    } else {
      const familiar = Util.chance(0.10) ? pickFamiliarFromPool() : null;
      const trinket = !familiar && Util.chance(0.15) ? pickTrinketFromPool() : null;
      if (familiar) addFamiliar(game, familiar);
      else if (trinket) equipTrinket(game, trinket);
      else applyItemToPlayer(game, pickItemFromPool('chest'));
    }
  }
  game.toast(c.def.name + ' opened!');
  bumpStat('chestsOpened', 1, game);
  if (c.kind === 'cursed') bumpStat('cursedChestsOpened', 1, game);
  if (c.kind === 'gold') bumpStat('goldChestsOpened', 1, game);
  if (c.kind === 'stone') bumpStat('stoneChestsOpened', 1, game);
  // An Eternal Chest half the time refuses to stay shut — un-marking `opened`
  // (set at the top of this function) puts it back in updateChests' rotation,
  // where its requires:'key' gate makes the player pay another key to reopen
  // it. Every other chest kind keeps the plain `opened = true` above.
  if (c.kind === 'eternal' && Util.chance(0.5)) { c.opened = false; c.reopenLock = true; }
}

/* ---------------------------------------------------------------
   Enemy death / drops
   --------------------------------------------------------------- */
function handleEnemyDeath(game, enemy){
  const node = game.currentRoom, player = game.player;
  player.onKill();
  Sound.play(enemy.isBoss ? 'bossDeath' : 'enemyDeath');
  // Phase 12 visual pass — FX.hitStop existed as a fully-wired mechanism
  // (see render.js's FX.hitStop/frozen and game.js's update(), which
  // already checks FX.frozen() and freezes the whole simulation for its
  // duration) but was never actually triggered from anywhere. A boss kill
  // is the one moment big enough in this game to earn a freeze-frame — a
  // brief beat before the death FX/loot drop, distinct from every ordinary
  // enemy kill (which stays untouched, no hitStop, so normal combat never
  // feels laggy from overuse).
  if (enemy.isBoss) FX.hitStop(0.06);
  bumpStat('enemiesKilled', 1, game);
  // first-ever kill of this enemy type gets a one-off Bestiary discovery
  // toast (bosses/superbosses skip it — they already get plenty of fanfare
  // from their own death sound and, for superbosses, an achievement toast)
  if (bumpBestiaryCount('enemyKills', enemy.type.id, 1) && !enemy.isBoss) {
    game.toast('📖 New Bestiary entry: ' + enemy.type.name + '!', false, 'info');
  }
  // Phase 7f — Collection category's scoped breadth achievements over JUST the
  // floorKey '13'/'14' roster (see achievements/defs-7.js). Guarded by the Set
  // check so the 22-id scan only runs on a kill that could actually move it.
  if (HOLLOWCHORUS_FINALWAVEFORM_WATCH_IDS.has(enemy.type.id)) checkHollowChorusFinalWaveformCollection(game);
  // Phase 7g — Collection category's scoped breadth achievements over JUST the
  // floorKey '11C' roster (see achievements/defs-8.js). Same guarded shape.
  if (MANGROVES_WATCH_IDS.has(enemy.type.id)) checkMangrovesCollection(game);
  // Phase 7h — Collection category's scoped breadth achievements over the
  // floorKey '4D'/'5D' roster (see achievements/defs-9.js). Same guarded shape.
  if (OBSERVATORY_WATCH_IDS.has(enemy.type.id)) checkObservatoryCollection(game);
  // Phase 7h (cont.) — Collection category's scoped breadth achievements over
  // the floorKey '6D'/'7D' roster (see achievements/defs-10.js). Same guarded shape.
  if (ORRERY_WATCH_IDS.has(enemy.type.id)) checkOrreryCollection(game);
  // Phase 7h (cont.) — Collection category's scoped breadth achievements over
  // JUST the floorKey '8D' roster (see achievements/defs-11.js). Same guarded shape.
  if (VOIDBETWEEN_WATCH_IDS.has(enemy.type.id)) checkVoidBetweenCollection(game);
  // Phase 7h (cont.) — Collection category's scoped breadth achievements over
  // the floorKey '9D'/'10D' roster plus the `singularity` superboss (see
  // achievements/defs-12.js). Same guarded shape; a companion to the '8D'
  // check directly above, never a replacement for it.
  if (VOIDBETWEEN2_WATCH_IDS.has(enemy.type.id)) checkVoidBetween2Collection(game);
  game.runKills++; // this run's own count — see game.js startRun, shown on pause/end screens
  if (enemy.isBoss) bumpStat('bossesKilled', 1, game);
  if (enemy.type && enemy.type.id === 'swarmerdnb') bumpStat('swarmerdnbKilled', 1, game); // see achievements.js's swarmslayer/swarmexterminator

  if (enemy.behavior === 'splitter' && !enemy.splitDone && enemy.type.splitInto) {
    enemy.splitDone = true;
    const childType = ENEMY_TYPES[enemy.type.splitInto];
    if (childType) {
      for (let i = 0; i < 2; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spot = findNearestFloor(node, Math.floor((enemy.x + Math.cos(ang) * 22) / TILE), Math.floor((enemy.y + Math.sin(ang) * 22) / TILE));
        node.enemies.push(new Enemy(childType, spot.x, spot.y, game.dungeon.floorNum));
      }
    }
  }

  // Phase 17 — DNB Crypt Hive/Bomb Hive (data/enemies/crypt-extra.js).
  // Generic on-death payload fields, not bespoke to those two ids: any
  // enemy type could carry either going forward. spawnFliesOnDeath spawns
  // a ring of a given child enemy id (used for dnbfly, but not tied to it);
  // spawnBombsOnDeath drops N live 'enemy'-owned bombs (placeBombAt already
  // treats owner !== 'player' as free — no bomb-count cost, still hurts the
  // player same as any other bomb, see combat-3.js's explodeAt).
  if (enemy.type.spawnFliesOnDeath) {
    const cfg = enemy.type.spawnFliesOnDeath;
    const childType = ENEMY_TYPES[cfg.id];
    if (childType) {
      for (let i = 0; i < cfg.count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r = Util.rand(cfg.minRadius || 10, cfg.radius || 40);
        const spot = findNearestFloor(node, Math.floor((enemy.x + Math.cos(ang) * r) / TILE), Math.floor((enemy.y + Math.sin(ang) * r) / TILE));
        node.enemies.push(new Enemy(childType, spot.x, spot.y, game.dungeon.floorNum));
      }
    }
  }
  if (enemy.type.spawnBombsOnDeath) {
    for (let i = 0; i < enemy.type.spawnBombsOnDeath; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Util.rand(14, 40);
      placeBombAt(game, enemy.x + Math.cos(ang) * r, enemy.y + Math.sin(ang) * r, 'enemy');
    }
  }

  // Phase 19 — Chain Rattler (data/enemies/crypt-extra2.js): a linked pair,
  // spawned together via groupSize:2. Killing either instantly kills its
  // still-living partner too (found by matching type.id in the same room) —
  // simpler and just as readable as a real shared-HP-pool would have been,
  // and needs no changes to takeDamage. The recursive handleEnemyDeath call
  // terminates on its own: by the time it runs, `enemy.isDead` is already
  // true, so the partner's OWN search (which filters `!isDead`) can never
  // find its way back to it.
  if (enemy.type.linkedDeath) {
    const partner = node.enemies.find(o => o !== enemy && !o.isDead && o.type.id === enemy.type.id);
    if (partner) { partner.isDead = true; handleEnemyDeath(game, partner); }
  }

  // Phase 19 — Grave Robber (data/enemies/crypt-extra2.js's 'thief'
  // behavior): whatever it stole gets dropped back, unchanged, at the spot
  // it died — same Pickup instance (kind/coin-tier/pill-color/star-id all
  // intact), just relocated and un-collected, rather than rolling a fresh
  // random reward in its place.
  if (enemy.stolenPickup) {
    const spot = findClearFloorSpot(node, Math.floor(enemy.x / TILE), Math.floor(enemy.y / TILE));
    const p = enemy.stolenPickup;
    p.x = spot.x; p.y = spot.y; p.collected = false; p.bobPhase = Math.random() * Math.PI * 2;
    node.pickups.push(p);
  }

  if (enemy.isBoss) {
    node.bossDefeated = true;
    const spot = findNearestFloor(node, Math.floor(enemy.x / TILE), Math.floor(enemy.y / TILE));
    addItemPedestal(node, pickItemFromPool('boss'), spot.x, spot.y);
    game.onBossDefeated(enemy);
  } else if (enemy.isMiniboss) {
    // Phase 15 — the miniboss room's drop table, exactly as specified:
    // 25% lucky penny / 25% chest / 25% item / 25% star. A single
    // Util.choice over 4 equal-weight outcomes rather than four independent
    // Util.chance(0.25) rolls — the latter could easily drop nothing at all
    // (or double up), and a miniboss room should never feel like it whiffed
    // after a real fight. Deliberately does NOT call game.onBossDefeated
    // (that fires boss-specific music/achievement/stat hooks a miniboss
    // was never meant to trigger) and does not set any node.xDefeated flag
    // (door-unlock is the fully generic checkRoomCleared path — see
    // room.js's populateRoom miniboss branch).
    const spot = findClearFloorSpot(node, Math.floor(enemy.x / TILE), Math.floor(enemy.y / TILE));
    const drop = Util.choice(['penny', 'chest', 'item', 'star']);
    if (drop === 'penny') {
      node.pickups.push(new Pickup('coin', spot.x, spot.y, COIN_TYPES.find(c => c.id === 'luckypenny') || Util.weighted(COIN_TYPES)));
    } else if (drop === 'chest') {
      node.chests.push(new Chest(Util.weighted(CHEST_TYPE_POOL).id, spot.x, spot.y));
    } else if (drop === 'item') {
      addItemPedestal(node, pickItemFromPool('boss'), spot.x, spot.y);
    } else {
      node.pickups.push(new Pickup('star', spot.x, spot.y, rollRandomStarId()));
    }
  } else if (player.trinketId === 'shinyshell' && Util.chance(0.08)) {
    const spot = findClearFloorSpot(node, Math.floor(enemy.x / TILE), Math.floor(enemy.y / TILE));
    node.pickups.push(new Pickup('heartRed', spot.x, spot.y));
  } else if (player.trinketId === 'gravekeeperstoken' && Util.chance(0.06)) {
    // expand-everything trinket batch (see data.js) — same shape as Shiny
    // Shell above, different pickup. Deliberately part of the same else-if
    // chain: bosses (the leading branch) still never roll these.
    const spot = findClearFloorSpot(node, Math.floor(enemy.x / TILE), Math.floor(enemy.y / TILE));
    node.pickups.push(new Pickup('coin', spot.x, spot.y, Util.weighted(COIN_TYPES)));
  } else if (player.trinketId === 'powderpouch' && Util.chance(0.04)) {
    const spot = findClearFloorSpot(node, Math.floor(enemy.x / TILE), Math.floor(enemy.y / TILE));
    node.pickups.push(new Pickup('bomb', spot.x, spot.y));
  } else if (player.trinketId === 'ossuarykey' && Util.chance(0.04)) {
    const spot = findClearFloorSpot(node, Math.floor(enemy.x / TILE), Math.floor(enemy.y / TILE));
    node.pickups.push(new Pickup('key', spot.x, spot.y));
  } else if (player.trinketId === 'sk8t_boneshakerpouch' && Util.chance(0.05)) {
    // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js) — same shape as Powder
    // Pouch above, different pickup/odds.
    const spot = findClearFloorSpot(node, Math.floor(enemy.x / TILE), Math.floor(enemy.y / TILE));
    node.pickups.push(new Pickup('bomb', spot.x, spot.y));
  }
  if (!enemy.isBoss && player.passives.goldenclover && Util.chance(0.05 * player.passives.goldenclover)) {
    const spot = findClearFloorSpot(node, Math.floor(enemy.x / TILE), Math.floor(enemy.y / TILE));
    node.pickups.push(new Pickup('coin', spot.x, spot.y, Util.weighted(COIN_TYPES)));
  }
  // Phase 16 — Fly Jar / Honeycomb (data/items-7.js), same "!isBoss +
  // Util.chance(base * stacks)" shape as Golden Clover just above, one
  // check per passive so they stack independently of each other.
  if (!enemy.isBoss && player.passives.flyjar && Util.chance(0.02 * player.passives.flyjar)) hatchFriendlyFly(game, 'friendlybluefly');
  if (!enemy.isBoss && player.passives.honeycomb && Util.chance(0.02 * player.passives.honeycomb)) hatchFriendlyFly(game, 'friendlyyellowfly');

  // champions (room.js's post-population promotion — normal rooms only, one
  // per room) pay out one bonus pickup half the time. Its own `if`, like
  // goldenclover above, so it stacks with whatever the ladder already gave.
  if (enemy.isChampion && Util.chance(0.5)) {
    const spot = findClearFloorSpot(node, Math.floor(enemy.x / TILE), Math.floor(enemy.y / TILE));
    spawnResolvedPickup(node, rollGenericPickupKind(), spot.x, spot.y);
  }

  if (checkRoomCleared(game, node)) {
    // Phase 16 — Rotting Carcass (data/items-7.js): a chance to hatch one
    // random friendly fly every time a room is actually cleared, not per
    // kill — a much rarer trigger than Fly Jar/Honeycomb above, so its base
    // chance is deliberately far higher to still feel worth carrying.
    if (player.passives.rottingcarcass && Util.chance(0.25 * player.passives.rottingcarcass)) {
      hatchFriendlyFly(game, Util.chance(0.5) ? 'friendlybluefly' : 'friendlyyellowfly');
    }
    game.onRoomJustCleared();
  }
}

// Phase 16 — the one place that actually adds a friendly fly familiar
// (data/familiars-3.js's friendlybluefly/friendlyyellowfly), shared by the
// Fly Jar/Honeycomb/Rotting Carcass passives above and the Swarm Canister/
// Trash Compactor active items (items-2.js's useActiveEffect) — so every
// fly-spawning effect in the game stays in sync if this ever needs to
// change (a sound, a toast, a stat bump), instead of each call site
// re-implementing "add this familiar" slightly differently.
function hatchFriendlyFly(game, id){
  addFamiliar(game, FAMILIAR_TYPES[id]);
}

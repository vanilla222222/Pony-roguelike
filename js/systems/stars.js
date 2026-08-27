'use strict';
/* ============================================================
   stars.js — named one-shot consumables (Pleiades-themed). Unlike
   a pill (see pills.js), a star's effect is never hidden — its
   name and description show up front, both on pickup and in the
   HUD. Held in a single pocket slot (see player.starPocket) and
   used with the R key. "For the room" effects wear off the instant
   a new room is entered — see game.js enterRoom.
   ============================================================ */

// consumes whatever star is in the player's pocket, if any
function useHeldStar(game){
  const player = game.player;
  if (!player.starPocket) { game.toast('No star to use.'); return; }
  const starId = player.starPocket;
  player.starPocket = null;
  // a star that found nothing to act on (rerolling an empty room, charging a
  // nonexistent active item) hands itself back instead of being burned —
  // applyStarEffect returns false and refundStar has already re-pocketed it
  if (applyStarEffect(game, starId) === false) return;
  bumpStat('starsUsed', 1, game);
}

// see useHeldStar above — puts the star back in the pocket and explains why
function refundStar(game, starId, msg){
  game.player.starPocket = starId;
  game.toast(msg);
  return false;
}

// human-readable names for the Compass stars' "no such room here" message,
// keyed by dungeon.js's SPECIAL_ROOM_TYPES ids. Matches the wording in
// data.js's STAR_TYPES[...].desc so the refund and the description agree.
const TELEPORT_ROOM_NAMES = {
  treasure: 'Treasure Room', shop: 'Shop', secret: 'Secret Room',
  petshop: 'Pet Shop', curse: 'Curse Room', sacrifice: 'Sacrifice Room',
  vault: 'Vault', challenge: 'Challenge Room', crystal: 'Crystal Room',
  sombra: 'Sombra Room', star: 'Star Room'
};

function applyStarEffect(game, starId){
  const player = game.player;
  const star = STAR_TYPES[starId];

  /* ---- the Compass stars (data.js's teleport_* entries, one per special
     room type). All eleven share this one dispatch: find the nearest room of
     the matching type on this floor and walk the player into it via the same
     game.enterRoom(node, null) the run's very first room uses, which drops
     the player in the middle of the room instead of at a door. Nothing here
     is a `case` in the switch below, so on success it simply falls past it
     to the shared Sound.play/toast tail. ---- */
  if (starId.startsWith('teleport_')) {
    const roomType = starId.slice('teleport_'.length);
    let target = null, bestDist = Infinity;
    for (const node of game.dungeon.rooms.values()) {
      // the room the player is already standing in is never a candidate —
      // teleporting into it would burn the star for nothing
      if (node.type !== roomType || node === game.currentRoom) continue;
      const d = Math.hypot(node.gx - game.currentRoom.gx, node.gy - game.currentRoom.gy);
      if (d < bestDist) { bestDist = d; target = node; }
    }
    if (!target) {
      return refundStar(game, starId, 'No ' + (TELEPORT_ROOM_NAMES[roomType] || 'room') + ' found on this floor.');
    }
    game.enterRoom(target, null);
  }

  switch (starId) {
    case 'alcyone': // +3 damage for the rest of this room
      player.starDamageBonus += 3;
      recalcPlayerStats(player);
      break;
    case 'atlas': // +2 blue hearts
      player.healBlue(2);
      break;
    case 'electra': // +50% speed for the rest of this room
      player.starSpeedMult = Math.max(player.starSpeedMult, 1.5); // see combat.js updatePlayer's speed formula
      break;
    case 'maia': // drop 4 hearts on the ground
      scatterStarPickups(game, 'heartRed', 4);
      break;
    case 'merope': // drop 2 keys on the ground
      scatterStarPickups(game, 'key', 2);
      break;
    case 'taygeta': // destroy every object in the room
      destroyAllObstacles(game);
      break;
    case 'pleione': // drop 3 bombs on the ground
      scatterStarPickups(game, 'bomb', 3);
      break;
    case 'celaeno': // drop 2 pills on the ground
      scatterStarPickups(game, 'pill', 2);
      break;
    case 'antares': // room-wide nuke, scaled to the floor
      // A flat 5 was fine against the Crypt's 2-5 HP roster and a rounding
      // error against Floor 10's. Riding enemyHpScale (see enemies.js) keeps
      // it worth exactly the same *fraction* of a room at every depth: enough
      // to wipe the trash outright, never enough to delete a brute or a boss.
      damageAllEnemies(game, Math.max(1, Math.round(4 * enemyHpScale(game.dungeon.floorNum))));
      break;
    case 'polaris': // freeze every enemy in the room
      freezeAllEnemies(game, 3);
      break;
    case 'achernar': // +3 red hearts
      player.heal(3);
      break;
    case 'vega': // +100% speed for the rest of this room
      player.starSpeedMult = Math.max(player.starSpeedMult, 2);
      break;

    /* ---- gameplay update 3: 25 more stars, all achievement-locked (see
       data.js's STAR_TYPES and achievements.js's 'Stars' category). Every
       case below drives a mechanism that already existed somewhere else in
       the game — nothing here adds a new per-frame system, and nothing
       needs a room-entry reset hook it doesn't already have. ---- */

    // -- rerolls (room.js owns the three helpers; see the safety notes there) --
    case 'deneb': { // reroll one untaken pedestal in this room
      const prize = rerollOnePedestal(game.currentRoom);
      if (!prize) return refundStar(game, starId, 'Nothing here to reroll.');
      game.toast('Deneb — rerolled into ' + (prize.icon ? prize.icon + ' ' : '') + prize.name + '!');
      Sound.play('itemGet');
      return;
    }
    case 'altair': { // reroll every hazard in this room into another hazard
      const n = rerollRoomHazards(game.currentRoom);
      if (!n) return refundStar(game, starId, 'No hazards here to reroll.');
      break;
    }
    case 'capella': { // reroll every enemy in this room into a fresh set
      const n = rerollRoomEnemies(game.currentRoom, game.dungeon.floorNum, game.floorBranch);
      if (!n) return refundStar(game, starId, 'No enemies here to reroll.');
      break;
    }
    case 'bellatrix': { // promote every regular enemy to a champion
      const n = championizeRoomEnemies(game.currentRoom);
      if (!n) return refundStar(game, starId, 'No enemies to promote.');
      break;
    }

    // -- temp buffs, all riding an existing field: starDamageBonus (cleared
    //    on room entry by game.js) or one of the item-driven timers --
    case 'arcturus': // +5 damage for the rest of this room — Alcyone's pattern
      player.starDamageBonus += 5;
      recalcPlayerStats(player);
      break;
    case 'dubhe': // +8 damage for the rest of this room
      player.starDamageBonus += 8;
      recalcPlayerStats(player);
      break;
    case 'alkaid': // 10s of invincibility — Panic Whistle's timer (items.js)
      player.invincibleTimer = Math.max(player.invincibleTimer, 10);
      break;

    // -- shields, healing, permanent grants --
    case 'aldebaran': // block the next hit — Iron Curtain's field (entities.js takeDamage)
      player.shieldHits += 1;
      break;
    case 'megrez': // block the next 3 hits
      player.shieldHits += 3;
      break;
    case 'mizar': // full red heal — Meditation Bell / Angel's Tears pattern
      player.redCurrent = player.redMax;
      break;
    case 'procyon': // +1 heart container, permanently
      player.grantHeartContainer(1);
      break;
    case 'spica': // +1 Luck for the rest of the run — Lucky Penny's accumulator
      player.luckyPennies += 1;
      recalcPlayerStats(player);
      break;
    case 'antlia': // +2 keys and +2 bombs
      player.keys += 2;
      player.bombs += 2;
      break;
    case 'merak': // fully recharge the active item — the Charge Up pill's effect
      if (!player.activeItem) return refundStar(game, starId, 'No active item to charge.');
      player.activeCharge = player.activeItem.maxCharge;
      break;
    case 'alnitak': // reveal the whole floor — the All-Seeing Eye's exact pair of
      // flags (items.js), so a later recalcPlayerStats can't undo it
      player.eyeUsed = true;
      player.revealMap = true;
      break;

    // -- room-wide enemy effects --
    case 'phecda': // a longer Polaris
      freezeAllEnemies(game, 8);
      break;
    case 'alnilam': // fear every enemy — the same fearTimer on-hit statuses set
      applyRoomWideStatus(game, 'fearTimer', 8, 'statusFear');
      break;
    case 'mintaka': { // charm ONE enemy — the same charmTimer on-hit statuses set
      const targets = game.currentRoom.enemies.filter(e => !e.isDead && !e.isBoss);
      if (!targets.length) return refundStar(game, starId, 'No one here to charm.');
      const t = Util.choice(targets);
      t.charmTimer = Math.max(t.charmTimer, 12);
      Sound.play('statusCharm');
      break;
    }
    case 'saiph': // knockback nova — a 0-damage hit purely for its knockback
      knockbackNova(game, 6);
      break;
    case 'rigel': { // execute the weakest enemy in the room
      const alive = game.currentRoom.enemies.filter(e => !e.isDead && !e.isBoss);
      if (!alive.length) return refundStar(game, starId, 'Nothing here to strike down.');
      let weakest = alive[0];
      for (const e of alive) if (e.hp < weakest.hp) weakest = e;
      // routed through takeDamage + handleEnemyDeath so death drops, kill
      // credit, bestiary progress and the room-clear check all fire normally
      if (weakest.takeDamage(weakest.hp, 0, 0) && weakest.isDead) handleEnemyDeath(game, weakest);
      break;
    }
    case 'sirius': // sear the room, freeze the survivors
      damageAllEnemies(game, Math.max(1, Math.round(6 * enemyHpScale(game.dungeon.floorNum))));
      freezeAllEnemies(game, 4);
      break;

    // -- spawns --
    case 'betelgeuse': // drop 6 coins
      scatterStarPickups(game, 'coin', 6);
      break;
    case 'castor': // drop 2 more stars
      scatterStarPickups(game, 'star', 2);
      break;
    case 'pollux': { // a free item pedestal, same roll a treasure room makes
      const node = game.currentRoom;
      const spot = findClearFloorSpot(node, Math.floor(player.x / TILE), Math.floor(player.y / TILE) - 1);
      addItemOrTrinketPedestal(node, itemPoolForRoomType(node.type), spot.x, spot.y);
      break;
    }
    case 'regulus': { // a treasure chest, same roll the room-clear reward makes
      const node = game.currentRoom;
      const spot = findClearFloorSpot(node, Math.floor(player.x / TILE), Math.floor(player.y / TILE) - 1);
      node.chests.push(new Chest(Util.weighted(CHEST_TYPE_POOL).id, spot.x, spot.y));
      break;
    }

    /* ---- Phase 7a — 25 more stars, backfilling the superboss reward grid
       (see achievements/defs-1.js's SUPERBOSS_REWARDS). Same rule the batch
       above follows: every case drives a mechanism that already exists in this
       file or in items/combat, and none of them adds a per-frame system or
       needs a room-entry reset hook it doesn't already have. ---- */
    case 'vindemiatrix':
      if (!applyRoomWideStatus(game, 'poisonTimer', 10, 'statusPoison')) return refundStar(game, starId, 'Nothing here to poison.');
      break;
    case 'zubeneschamali':
      if (!applyRoomWideStatus(game, 'stunTimer', 5, 'statusStun')) return refundStar(game, starId, 'Nothing here to stun.');
      break;
    case 'gacrux':
      if (!applyRoomWideStatus(game, 'vulnerableTimer', 12, 'statusVulnerable')) return refundStar(game, starId, 'Nothing here to mark.');
      break;
    case 'acrux':
      if (!applyRoomWideStatus(game, 'charmTimer', 10, 'statusCharm')) return refundStar(game, starId, 'No one here to charm.');
      break;
    case 'shaula':
    { // percentage cut rather than a flat number, so it stays meaningful at any depth
      const alive = game.currentRoom.enemies.filter(e => !e.isDead);
      if (!alive.length) return refundStar(game, starId, 'Nothing here to wound.');
      for (const e of alive) if (e.takeDamage(e.hp / 2, 0, 0) && e.isDead) handleEnemyDeath(game, e);
      break;
    }
    case 'sabik':
      player.healBlue(4);
      break;
    case 'nunki':
      scatterStarPickups(game, 'key', 3);
      scatterStarPickups(game, 'bomb', 3);
      break;
    case 'ascella':
    {
      const node = game.currentRoom;
      for (let i = -1; i <= 1; i += 2) {
        const spot = findClearFloorSpot(node, Math.floor(player.x / TILE) + i * 2, Math.floor(player.y / TILE) - 1);
        addItemOrTrinketPedestal(node, itemPoolForRoomType(node.type), spot.x, spot.y);
      }
      break;
    }
    case 'kausaustralis':
      damageAllEnemies(game, Math.max(1, Math.round(3 * enemyHpScale(game.dungeon.floorNum))));
      knockbackNova(game, 9);
      break;
    case 'rasalhague':
      freezeAllEnemies(game, 12);
      break;
    case 'alphecca':
      player.luckyPennies += 2;
      recalcPlayerStats(player);
      break;
    case 'izar':
      player.starRangeBonus = (player.starRangeBonus || 0) + 2;
      recalcPlayerStats(player);
      break;
    case 'mirfak':
      player.shieldHits += 5;
      break;
    case 'algol':
    { // Rigel's opposite — same execute plumbing, picking the biggest threat instead
      const alive = game.currentRoom.enemies.filter(e => !e.isDead && !e.isBoss);
      if (!alive.length) return refundStar(game, starId, 'Nothing here to strike down.');
      let strongest = alive[0];
      for (const e of alive) if (e.hp > strongest.hp) strongest = e;
      if (strongest.takeDamage(strongest.hp, 0, 0) && strongest.isDead) handleEnemyDeath(game, strongest);
      break;
    }
    case 'almach':
      player.redCurrent = player.redMax;
      player.healBlue(2);
      break;
    case 'hamal':
      player.grantHeartContainer(2);
      break;
    case 'menkar':
      scatterStarPickups(game, 'bomb', 5);
      destroyAllObstacles(game);
      break;
    case 'diphda':
      scatterStarPickups(game, 'coin', 12);
      break;
    case 'markab':
      scatterStarPickups(game, 'pill', 4);
      break;
    case 'scheat':
      player.invincibleTimer = Math.max(player.invincibleTimer, 20);
      break;
    case 'algenib':
    { // Deneb, but exhaustive — keeps rerolling until nothing is left to reroll
      let n = 0, last = null;
      while (n < 12) { const prize = rerollOnePedestal(game.currentRoom); if (!prize) break; last = prize; n++; }
      if (!n) return refundStar(game, starId, 'Nothing here to reroll.');
      game.toast('Algenib — rerolled ' + n + ' pedestal' + (n === 1 ? '' : 's') + ', last into ' + (last.icon ? last.icon + ' ' : '') + last.name + '!');
      Sound.play('itemGet');
      return;
    }
    case 'enif':
      player.eyeUsed = true;
      player.revealMap = true;
      scatterStarPickups(game, 'key', 2);
      break;
    case 'sadalsuud':
      scatterStarPickups(game, 'star', 3);
      break;
    case 'zosma':
    { // Bellatrix's risk with a compensating edge — tougher enemies, but softer to hit
      const n = championizeRoomEnemies(game.currentRoom);
      if (!n) return refundStar(game, starId, 'No enemies to promote.');
      applyRoomWideStatus(game, 'vulnerableTimer', 15, 'statusVulnerable');
      break;
    }
    case 'alphard':
    { // the only star that costs you something — a deliberate all-in
      player.starDamageBonus += 12;
      player.redCurrent = Math.min(player.redCurrent, 1);
      recalcPlayerStats(player);
      break;
    }

    /* ---- Phase 8e — 25 more stars, unlocked via the skill tree (see
       skilltree-unlocks-stars.js's 'unlock_stars_hub' subtree, not the
       achievement/superboss reward ladders the two batches above use).
       Same rule as always: every case below drives a mechanism that
       already exists in this file or in items/combat. ---- */
    case 'sk8s_pyrrha': // +4 damage for the rest of this room — Alcyone's pattern
      player.starDamageBonus += 4;
      recalcPlayerStats(player);
      break;
    case 'sk8s_borealis': // +60% speed for the rest of this room — Electra's pattern
      player.starSpeedMult = Math.max(player.starSpeedMult, 1.6);
      break;
    case 'sk8s_thessaly': // +2 red hearts
      player.heal(2);
      break;
    case 'sk8s_wren': // +3 blue hearts
      player.healBlue(3);
      break;
    case 'sk8s_gilded': // full red heal AND full blue heal — Mizar + Items-2's blueheart-cap pattern
      player.redCurrent = player.redMax;
      player.healBlue(999); // clamps to whatever this class's blue cap actually is
      break;
    case 'sk8s_cinder': // room-wide nuke, scaled to the floor — Antares/Sirius's pattern
      damageAllEnemies(game, Math.max(1, Math.round(3 * enemyHpScale(game.dungeon.floorNum))));
      break;
    case 'sk8s_frostbind': // freeze every enemy for 6 seconds — Polaris/Phecda's pattern
      freezeAllEnemies(game, 6);
      break;
    case 'sk8s_thornveil': // block the next 2 hits
      player.shieldHits += 2;
      break;
    case 'sk8s_aegis': // 15s of invincibility — Alkaid/Scheat's pattern
      player.invincibleTimer = Math.max(player.invincibleTimer, 15);
      break;
    case 'sk8s_venomkiss':
      if (!applyRoomWideStatus(game, 'poisonTimer', 8, 'statusPoison')) return refundStar(game, starId, 'Nothing here to poison.');
      break;
    case 'sk8s_dreadhowl':
      if (!applyRoomWideStatus(game, 'fearTimer', 6, 'statusFear')) return refundStar(game, starId, 'No one here to frighten.');
      break;
    case 'sk8s_puppeteer': { // charm ONLY the strongest enemy — Algol's target-picking, Mintaka's charm
      const targets = game.currentRoom.enemies.filter(e => !e.isDead && !e.isBoss);
      if (!targets.length) return refundStar(game, starId, 'No one here to charm.');
      let strongest = targets[0];
      for (const e of targets) if (e.hp > strongest.hp) strongest = e;
      strongest.charmTimer = Math.max(strongest.charmTimer, 14);
      Sound.play('statusCharm');
      break;
    }
    case 'sk8s_direstrike': { // Algol's target-picking, Shaula's percentage-of-current-hp damage
      const alive = game.currentRoom.enemies.filter(e => !e.isDead && !e.isBoss);
      if (!alive.length) return refundStar(game, starId, 'Nothing here to strike.');
      let strongest = alive[0];
      for (const e of alive) if (e.hp > strongest.hp) strongest = e;
      if (strongest.takeDamage(strongest.hp * 0.75, 0, 0) && strongest.isDead) handleEnemyDeath(game, strongest);
      break;
    }
    case 'sk8s_gale': // a lighter knockback nova — Saiph/Kaus Australis's pattern
      knockbackNova(game, 5);
      break;
    case 'sk8s_fortune': // +1 Luck for the rest of the run — Spica's pattern
      player.luckyPennies += 1;
      recalcPlayerStats(player);
      break;
    case 'sk8s_farsight': // +1 tile of attack range for the rest of the run — Izar's pattern
      player.starRangeBonus = (player.starRangeBonus || 0) + 1;
      recalcPlayerStats(player);
      break;
    case 'sk8s_battery': // fully recharge the active item — Merak's pattern
      if (!player.activeItem) return refundStar(game, starId, 'No active item to charge.');
      player.activeCharge = player.activeItem.maxCharge;
      break;
    case 'sk8s_cartographer': // reveal the whole floor — Alnitak's pattern
      player.eyeUsed = true;
      player.revealMap = true;
      break;
    case 'sk8s_demolition': // destroy every object in the room — Taygeta's pattern
      destroyAllObstacles(game);
      break;
    case 'sk8s_prospector': // drop 5 coins
      scatterStarPickups(game, 'coin', 5);
      break;
    case 'sk8s_medic': // drop 3 hearts
      scatterStarPickups(game, 'heartRed', 3);
      break;
    case 'sk8s_quartermaster': // drop 2 keys and 2 bombs
      scatterStarPickups(game, 'key', 2);
      scatterStarPickups(game, 'bomb', 2);
      break;
    case 'sk8s_alchemist': // drop 3 pills
      scatterStarPickups(game, 'pill', 3);
      break;
    case 'sk8s_pyroclast': // drop 4 bombs
      scatterStarPickups(game, 'bomb', 4);
      break;
    case 'sk8s_shrine': { // a free item pedestal — Pollux's pattern
      const node = game.currentRoom;
      const spot = findClearFloorSpot(node, Math.floor(player.x / TILE), Math.floor(player.y / TILE) - 1);
      addItemOrTrinketPedestal(node, itemPoolForRoomType(node.type), spot.x, spot.y);
      break;
    }
  }
  Sound.play('itemGet');
  game.toast(star.name + ' — ' + star.desc);
}

// Alnilam — sets one of the enemy status timers (see entities.js Enemy and
// combat.js updateEnemy, which ticks them down and dispatches into ai.js's
// aiFeared/aiCharmed) on every living regular enemy at once. Bosses are
// immune, the same rule applyOnHitStatuses already follows.
function applyRoomWideStatus(game, timerField, duration, sfx){
  let count = 0;
  for (const e of game.currentRoom.enemies) {
    if (e.isDead || e.isBoss) continue;
    e[timerField] = Math.max(e[timerField], duration);
    count++;
  }
  if (count && sfx) Sound.play(sfx);
  return count;
}

// Saiph — shoves every living enemy directly away from the player. Runs
// through Enemy.takeDamage with an amount of 0 so it uses the exact same
// knockback plumbing every melee hit and explosion uses (knockX/knockY,
// decayed in combat.js updateEnemy) without dealing, or counting as, damage.
function knockbackNova(game, strength){
  const player = game.player;
  for (const e of game.currentRoom.enemies) {
    if (e.isDead) continue;
    const dx = e.x - player.x, dy = e.y - player.y;
    const d = Math.hypot(dx, dy) || 1;
    e.takeDamage(0, (dx / d) * strength, (dy / d) * strength);
  }
}

// scatters `count` copies of a ground pickup kind in small clear spots near
// the player — used by the "drop N on the ground" star effects (Maia,
// Merope, Pleione, Celaeno). Reuses room.js's spawnResolvedPickup so e.g. a
// scattered "pill" still gets its own random color, same as any other pill.
function scatterStarPickups(game, kind, count){
  const node = game.currentRoom, player = game.player;
  const baseTx = Math.floor(player.x / TILE), baseTy = Math.floor(player.y / TILE);
  for (let i = 0; i < count; i++) {
    const spot = findClearFloorSpot(node, baseTx + Util.randi(-2, 2), baseTy + Util.randi(-2, 2));
    spawnResolvedPickup(node, kind, spot.x, spot.y);
  }
}

'use strict';
// systems/items-2.js — split from items.js (part 2/2).

// equip a trinket, Isaac-style — single slot, picking up a new one replaces
// whatever you're already holding
function equipTrinket(game, trinket){
  const player = game.player;
  const previous = player.trinketId ? TRINKETS[player.trinketId] : null;
  player.trinketId = trinket.id;
  recalcPlayerStats(player);
  Sound.play('itemGet');
  bumpStat('trinketsEquipped', 1, game);
  markBestiarySeen('seenTrinkets', trinket.id); // see js/bestiary.js
  game.toast('Equipped trinket: ' + trinket.name + (previous ? ' (replaced ' + previous.name + ')' : '') + '!');
  game.floatTexts.push(new FloatText(player.x, player.y - 26, trinket.name, trinket.color));
}

function applyPassiveEffect(game, item){
  const player = game.player;
  player.passives[item.id] = (player.passives[item.id] || 0) + 1;
  if (item.id === 'thickmane' || item.id === 'hpup' || item.id === 'thickhide'
    || item.id === 'seraphplume' || item.id === 'ascendantcharm' || item.id === 'sacrificialdevotee' || item.id === 'chosenofthelight'
    // 75-achievement + 25-unlocked batch (see data.js)
    || item.id === 'phoenixfeathershard' || item.id === 'alchemistsformula' || item.id === 'radianthalofragment' || item.id === 'sunkissedpelt'
    || item.id === 'frostboundcloak'
    || item.id === 'sacredgauntlet' || item.id === 'sacredbelt' || item.id === 'ancientvial' || item.id === 'mysticband' || item.id === 'gleamingvial'
    // newrewards-content batch (see data.js)
    || item.id === 'ironhidevest'
    || item.id === 'wovenheart'
    || item.id === 'halegirth'
    || item.id === 'hallowedheart'
    || item.id === 'haleribcage'
    || item.id === 'broadvest'
    // Phase 7g — Tangled Shallows capstone item (see achievements/defs-8.js)
    || item.id === 'tidewardenaegis'
    // Phase 7h — Observatory capstone items (see achievements/defs-9.js)
    || item.id === 'brasswardensplating' || item.id === 'astrolabewardenplate'
    // Phase 7h (cont.) — Orrery capstone items (see achievements/defs-10.js)
    || item.id === 'ringwardenplating' || item.id === 'apexwardenplating' || item.id === 'geartriadcore'
    // Phase 7h (cont.) — The Void Between capstone item (see achievements/defs-11.js)
    || item.id === 'driftwardenplate'
    // Phase 7h (cont.) — The Void Between PART 2 capstone items (see achievements/defs-12.js)
    || item.id === 'darkwardenplating' || item.id === 'horizonwardenplating'
    // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    || item.id === 'sk8i_ironclasp') player.grantHeartContainer(1);
  else if (item.id === 'giantsheart' || item.id === 'saintofsuffering' || item.id === 'sk8i_secondheart') player.grantHeartContainer(2);
  else if ((item.id === 'witheredapple' || item.id === 'blackheart' || item.id === 'souldrain' || item.id === 'soulseller' || item.id === 'cursedwanderer'
    // 75-achievement batch (see data.js)
    || item.id === 'blacklockboxkey' || item.id === 'devilsbargainring' || item.id === 'hexbreakertalisman' || item.id === 'doomwalkerscloak' || item.id === 'sombrasownseal')
    && !player.def.noRedContainers) player.grantHeartContainer(-1);
  else if (item.id === 'luckydie') {
    // fires alongside applyItemToPlayer's own "Found X!" toast (which would
    // otherwise immediately overwrite anything we toast here), so the
    // gamble's actual result rides on a second float text instead
    if (Util.chance(0.5)) { player.luckyPennies += 3; game.floatTexts.push(new FloatText(player.x, player.y - 42, '+3 Luck!', '#7fd66a')); }
    else { player.luckyPennies -= 2; game.floatTexts.push(new FloatText(player.x, player.y - 42, '-2 Luck...', '#e35b6a')); }
  } else if (item.id === 'witchbrew') {
    player.redCurrent = player.redMax;
    player.healBlue(999); // clamps to whatever this class's blue cap actually is
  } else if (item.id === 'charmedpendant') {
    for (const c of PILL_COLORS) game.pillIdentified[c.id] = true;
  }
  recalcPlayerStats(player);
}

function applyItemToPlayer(game, item){
  const player = game.player;
  Sound.play('itemGet');
  bumpStat('itemsCollected', 1, game);
  markBestiarySeen('seenItems', item.id); // see js/bestiary.js
  if (item.type === 'passive') applyPassiveEffect(game, item);
  else player.pickupActiveItem(item);
  game.toast('Found ' + item.name + '!');
  game.floatTexts.push(new FloatText(player.x, player.y - 26, item.name, item.color));
}

// familiars stack — every copy adds another instance rather than a count
function addFamiliar(game, familiarDef){
  const player = game.player;
  player.familiars.push(new Familiar(familiarDef, player, player.familiars.length));
  Sound.play('itemGet');
  bumpStat('familiarsCollected', 1, game);
  markBestiarySeen('seenFamiliars', familiarDef.id); // see js/bestiary.js
  game.toast('A new familiar joins you: ' + familiarDef.name + '!');
  game.floatTexts.push(new FloatText(player.x, player.y - 26, familiarDef.name, familiarDef.color));
}

function useActiveItem(game){
  const player = game.player;
  if (!player.activeItem) { game.toast('No active item equipped.'); return; }
  if (player.activeCharge < player.activeItem.maxCharge) { game.toast('Not charged yet...'); return; }
  player.activeCharge = 0;
  Sound.play('activeUse');
  bumpStat('activeItemUses', 1, game);
  useActiveEffect(game, player.activeItem);
}

function useActiveEffect(game, item){
  const player = game.player, node = game.currentRoom;
  // Every authored damage number in this function is depth-scaled, for
  // exactly the reason enemies.js's explosionDamage() is: these are flat
  // constants and enemy HP now COMPOUNDS (~1.32^floor, see ENEMY_HP_GROWTH).
  // A flat 4 was a whole-room wipe on Floor 1 and a rounding error by Floor
  // 10 — the actives quietly stopped being items halfway through the run.
  // Rides the gentler BOSS curve (~1.28^floor) so a charge-limited button
  // press never out-scales actually aiming, and the authored numbers below
  // stay readable as IDENTITY (a 5 is stronger than a 3, at every depth).
  const depthDmg = (base) => Math.max(1, Math.round(base * bossHpScale(game.dungeon.floorNum)));
  switch (item.id) {
    case 'moonshard': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        if (Util.dist(player.x, player.y, e.x, e.y) < 170) {
          const applied = e.takeDamage(depthDmg(3), (e.x - player.x) * 0.05, (e.y - player.y) * 0.05);
          if (applied && e.isDead) handleEnemyDeath(game, e);
        }
      }
      game.explosions.push(new Explosion(player.x, player.y, 170));
      break;
    }
    case 'thundercloud': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const applied = e.takeDamage(depthDmg(4), 0, 0);
        game.floatTexts.push(new FloatText(e.x, e.y - 18, 'ZAP', '#f4d35e'));
        if (applied && e.isDead) handleEnemyDeath(game, e);
      }
      break;
    }
    case 'blinkcrystal': {
      const ang = Math.atan2(player.facing.y, player.facing.x);
      const nx = player.x + Math.cos(ang) * TILE * 3;
      const ny = player.y + Math.sin(ang) * TILE * 3;
      const spot = clampToRoom(node, nx, ny);
      player.x = spot.x; player.y = spot.y;
      player.invulnTimer = Math.max(player.invulnTimer, 0.4);
      break;
    }
    case 'vialcourage': {
      player.invincibleTimer = 5;
      player.speedBoostTimer = 5;
      break;
    }
    case 'healingdraught': { player.heal(2); break; }
    case 'bombsatchel': { player.bombs += 3; placeBombAt(game, player.x, player.y - 6, 'player-free'); break; }
    case 'largepenny': {
      // nerfed from a guaranteed dime to a heavily penny-weighted roll
      const spot = findClearFloorSpot(node, Math.floor(player.x / TILE), Math.floor(player.y / TILE));
      const coinId = Util.weighted(LARGEPENNY_COIN_WEIGHTS).id;
      node.pickups.push(new Pickup('coin', spot.x, spot.y, COIN_TYPES.find(c => c.id === coinId)));
      break;
    }
    case 'allseeingeye': {
      player.eyeUsed = true;
      player.revealMap = true;
      game.toast('The map is revealed!');
      break;
    }
    case 'giftbox': {
      Sound.play('sack');
      game.toast('A gift box bursts open!');
      for (let i = 0; i < 3; i++) grantPickupEffect(game, rollGenericPickupKind(), player.x, player.y - 26 - i * 14);
      break;
    }
    case 'windfall': {
      // Compressed from 10-16. A floor's total coin income is only ~24c on
      // Floor 1 rising to ~60c by Floor 10 (the derivation lives next to
      // SHOP_BASE_PRICES in shop.js), and at maxCharge:4 this fires 2-3 times
      // on a 12-room floor — at 10-16 a single quality:1 active was matching
      // or beating everything the rest of the floor dropped combined.
      const amount = Util.randi(6, 11);
      player.coins += amount;
      bumpStat('coinsCollected', amount, game);
      Sound.play('coin');
      game.floatTexts.push(new FloatText(player.x, player.y - 26, '+' + amount + 'c', '#e3c15b'));
      break;
    }
    case 'lunaraffinity': {
      const candidates = [
        game.dungeon.bossNode, game.dungeon.treasureNode, game.dungeon.shopNode, game.dungeon.secretNode,
        game.dungeon.petshopNode, game.dungeon.curseNode, game.dungeon.sacrificeNode,
        game.dungeon.vaultNode, game.dungeon.challengeNode, game.dungeon.crystalNode, game.dungeon.sombraNode,
        game.dungeon.shrineNode,
      ].filter(n => n && !n.discovered && !n.revealed);
      if (candidates.length) {
        const pick = Util.choice(candidates);
        pick.revealed = true;
        pick.seen = true;
        game.toast('A special room reveals itself on the map...');
      } else {
        game.toast('Nothing left to reveal.');
      }
      break;
    }
    case 'chronoshard': {
      game.slowTimer = Math.max(game.slowTimer || 0, 4);
      break;
    }
    case 'ironcurtain': {
      player.shieldHits = (player.shieldHits || 0) + 3;
      break;
    }
    case 'flashpowder': {
      for (const e of node.enemies) {
        if (e.isDead || e.isBoss) continue; // bosses shrug off statuses, same rule as on-hit stun
        e.stunTimer = Math.max(e.stunTimer, 3);
      }
      Sound.play('flashpowder');
      break;
    }
    case 'grapplinghoof': {
      const ang = Math.atan2(player.facing.y, player.facing.x);
      const dist = TILE * 3.2, steps = 8;
      const hit = new Set();
      for (let i = 1; i <= steps; i++) {
        const sx = player.x + Math.cos(ang) * (dist * i / steps);
        const sy = player.y + Math.sin(ang) * (dist * i / steps);
        for (const e of node.enemies) {
          if (e.isDead || hit.has(e)) continue;
          if (Util.dist(sx, sy, e.x, e.y) < e.radius + 14) {
            hit.add(e);
            const applied = e.takeDamage(depthDmg(3), Math.cos(ang) * 3, Math.sin(ang) * 3);
            if (applied) { Sound.play('enemyHit'); if (e.isDead) handleEnemyDeath(game, e); }
          }
        }
      }
      const spot = clampToRoom(node, player.x + Math.cos(ang) * dist, player.y + Math.sin(ang) * dist);
      player.x = spot.x; player.y = spot.y;
      player.invulnTimer = Math.max(player.invulnTimer, 0.3);
      break;
    }
    case 'meditationbell': {
      player.redCurrent = player.redMax;
      game.toast('Fully healed!');
      break;
    }
    case 'panicwhistle': {
      player.invincibleTimer = Math.max(player.invincibleTimer, 3);
      break;
    }
    case 'dawnbringer': {
      player.speedBoostTimer = Math.max(player.speedBoostTimer, 4);
      player.shieldHits = (player.shieldHits || 0) + 1;
      break;
    }
    case 'angelstears': {
      player.redCurrent = player.redMax;
      game.toast('Fully healed!');
      break;
    }
    case 'sombrasbargain': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const applied = e.takeDamage(depthDmg(4), 0, 0);
        game.floatTexts.push(new FloatText(e.x, e.y - 18, 'HEX', '#8a2e46'));
        if (applied && e.isDead) handleEnemyDeath(game, e);
      }
      // costs half a heart every use — but never below half a heart left, same
      // "must always have something left over" rule as a cursed chest/deal
      const avail = player.redCurrent + player.blueCurrent;
      const cost = Math.min(0.5, Math.max(0, avail - 0.5));
      player.spendHearts(cost);
      break;
    }

    // ---- 75-achievement batch actives (see data.js) ----
    case 'harbingeroftheend': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        if (Util.dist(player.x, player.y, e.x, e.y) < 200) {
          const applied = e.takeDamage(depthDmg(5), (e.x - player.x) * 0.05, (e.y - player.y) * 0.05);
          if (applied && e.isDead) handleEnemyDeath(game, e);
        }
      }
      game.explosions.push(new Explosion(player.x, player.y, 200));
      break;
    }
    case 'legendsmantle': {
      player.shieldHits = (player.shieldHits || 0) + 3;
      break;
    }
    case 'powderkegheart': {
      player.bombs += 3; placeBombAt(game, player.x, player.y - 6, 'player-free');
      break;
    }
    case 'survivorsscar': { player.heal(2); break; }
    case 'livinglegendscrown': {
      player.redCurrent = player.redMax;
      for (const e of node.enemies) {
        if (e.isDead) continue;
        if (Util.dist(player.x, player.y, e.x, e.y) < 170) {
          const applied = e.takeDamage(depthDmg(4), (e.x - player.x) * 0.05, (e.y - player.y) * 0.05);
          if (applied && e.isDead) handleEnemyDeath(game, e);
        }
      }
      game.explosions.push(new Explosion(player.x, player.y, 170));
      game.toast('Fully healed!');
      break;
    }
    case 'martyrsresolve': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const applied = e.takeDamage(depthDmg(4), 0, 0);
        game.floatTexts.push(new FloatText(e.x, e.y - 18, 'MARTYR', '#4a2458'));
        if (applied && e.isDead) handleEnemyDeath(game, e);
      }
      const martyrAvail = player.redCurrent + player.blueCurrent;
      const martyrCost = Math.min(0.5, Math.max(0, martyrAvail - 0.5));
      player.spendHearts(martyrCost);
      break;
    }
    case 'vaultemperorsseal': {
      Sound.play('sack');
      game.toast('The vault empties itself before you!');
      for (let i = 0; i < 3; i++) grantPickupEffect(game, rollGenericPickupKind(), player.x, player.y - 26 - i * 14);
      break;
    }
    case 'prismshardnecklace': {
      player.redCurrent = player.redMax;
      game.toast('Fully healed!');
      break;
    }
    case 'contractofshadows': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const applied = e.takeDamage(depthDmg(4), 0, 0);
        game.floatTexts.push(new FloatText(e.x, e.y - 18, 'CURSE', '#2c1530'));
        if (applied && e.isDead) handleEnemyDeath(game, e);
      }
      break;
    }

    // ---- 25-unlocked batch actives (see data.js) ----
    case 'sparkvial': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const applied = e.takeDamage(depthDmg(3), 0, 0);
        game.floatTexts.push(new FloatText(e.x, e.y - 18, 'ZAP', '#6ea8e0'));
        if (applied && e.isDead) handleEnemyDeath(game, e);
      }
      break;
    }
    case 'hoofwraps': {
      player.speedBoostTimer = Math.max(player.speedBoostTimer, 3);
      break;
    }
    case 'emergencyrations': { player.heal(1); break; }
    case 'smokebomb': {
      for (const e of node.enemies) {
        if (e.isDead || e.isBoss) continue;
        e.stunTimer = Math.max(e.stunTimer, 2);
      }
      Sound.play('flashpowder');
      break;
    }
    case 'coinpurse': {
      // same compression as Windfall above, held one step below it since
      // Coin Purse recharges faster (maxCharge:3 vs 4)
      const purseAmount = Util.randi(4, 8);
      player.coins += purseAmount;
      bumpStat('coinsCollected', purseAmount, game);
      Sound.play('coin');
      game.floatTexts.push(new FloatText(player.x, player.y - 26, '+' + purseAmount + 'c', '#e3c15b'));
      break;
    }

    // ---- newrewards-content batch actives (see data.js). Every one
    // reuses an effect shape already in this switch — new magnitudes and
    // flavor, no new active mechanics. ----
    case 'cursedvial': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const applied = e.takeDamage(depthDmg(3), 0, 0);
        game.floatTexts.push(new FloatText(e.x, e.y - 18, 'ZAP', '#6ea8e0'));
        if (applied && e.isDead) handleEnemyDeath(game, e);
      }
      break;
    }
    case 'wilddraught': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const applied = e.takeDamage(depthDmg(5), 0, 0);
        game.floatTexts.push(new FloatText(e.x, e.y - 18, 'ZAP', '#7fd6e0'));
        if (applied && e.isDead) handleEnemyDeath(game, e);
      }
      break;
    }
    case 'boilingtonic': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        if (Util.dist(player.x, player.y, e.x, e.y) < 170) {
          const applied = e.takeDamage(depthDmg(3), (e.x - player.x) * 0.05, (e.y - player.y) * 0.05);
          if (applied && e.isDead) handleEnemyDeath(game, e);
        }
      }
      game.explosions.push(new Explosion(player.x, player.y, 170));
      break;
    }
    case 'wildprism': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        if (Util.dist(player.x, player.y, e.x, e.y) < 200) {
          const applied = e.takeDamage(depthDmg(4), (e.x - player.x) * 0.05, (e.y - player.y) * 0.05);
          if (applied && e.isDead) handleEnemyDeath(game, e);
        }
      }
      game.explosions.push(new Explosion(player.x, player.y, 200));
      break;
    }
    case 'glassdraught': { player.heal(1); break; }
    case 'deepflask': { player.heal(2); break; }
    case 'cinderphial': {
      player.redCurrent = player.redMax;
      game.toast('Fully healed!');
      break;
    }
    case 'vagrantcharge': {
      player.invincibleTimer = Math.max(player.invincibleTimer, 3);
      break;
    }
    case 'boilingprism': {
      player.invincibleTimer = Math.max(player.invincibleTimer, 5);
      break;
    }
    case 'oldbell': {
      player.speedBoostTimer = Math.max(player.speedBoostTimer, 4);
      break;
    }
    case 'emberbeacon': {
      player.shieldHits = (player.shieldHits || 0) + 2;
      break;
    }
    case 'stormlantern': {
      player.shieldHits = (player.shieldHits || 0) + 3;
      break;
    }
    case 'oldwhistle': {
      for (const e of node.enemies) {
        if (e.isDead || e.isBoss) continue;
        e.stunTimer = Math.max(e.stunTimer, 2);
      }
      Sound.play('flashpowder');
      break;
    }
    case 'radiantbell': {
      for (const e of node.enemies) {
        if (e.isDead || e.isBoss) continue;
        e.stunTimer = Math.max(e.stunTimer, 3);
      }
      Sound.play('flashpowder');
      break;
    }
    case 'glassbeacon': {
      const amt = Util.randi(4, 8);
      player.coins += amt;
      bumpStat('coinsCollected', amt, game);
      Sound.play('coin');
      game.floatTexts.push(new FloatText(player.x, player.y - 26, '+' + amt + 'c', '#e3c15b'));
      break;
    }
    case 'oldhorn': {
      const amt = Util.randi(6, 11);
      player.coins += amt;
      bumpStat('coinsCollected', amt, game);
      Sound.play('coin');
      game.floatTexts.push(new FloatText(player.x, player.y - 26, '+' + amt + 'c', '#e3c15b'));
      break;
    }
    case 'vagrantwhistle': { player.bombs += 2; break; }
    case 'sacredcharge': {
      game.slowTimer = Math.max(game.slowTimer || 0, 4);
      break;
    }
    case 'emberlantern': {
      const ang = Math.atan2(player.facing.y, player.facing.x);
      const spot = clampToRoom(node, player.x + Math.cos(ang) * TILE * 3, player.y + Math.sin(ang) * TILE * 3);
      player.x = spot.x; player.y = spot.y;
      player.invulnTimer = Math.max(player.invulnTimer, 0.4);
      break;
    }
    case 'wardenchalice': {
      Sound.play('sack');
      for (let i = 0; i < 2; i++) grantPickupEffect(game, rollGenericPickupKind(), player.x, player.y - 26 - i * 14);
      break;
    }
    case 'wakingbell': {
      player.eyeUsed = true;
      player.revealMap = true;
      game.toast('The map is revealed!');
      break;
    }
    case 'hollowbeacon': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const applied = e.takeDamage(depthDmg(3), 0, 0);
        game.floatTexts.push(new FloatText(e.x, e.y - 18, 'ZAP', '#f4d35e'));
        if (applied && e.isDead) handleEnemyDeath(game, e);
      }
      break;
    }
    case 'heraldprism': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        const applied = e.takeDamage(depthDmg(5), 0, 0);
        game.floatTexts.push(new FloatText(e.x, e.y - 18, 'ZAP', '#7fd6e0'));
        if (applied && e.isDead) handleEnemyDeath(game, e);
      }
      break;
    }
    case 'gravecenser': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        if (Util.dist(player.x, player.y, e.x, e.y) < 170) {
          const applied = e.takeDamage(depthDmg(3), (e.x - player.x) * 0.05, (e.y - player.y) * 0.05);
          if (applied && e.isDead) handleEnemyDeath(game, e);
        }
      }
      game.explosions.push(new Explosion(player.x, player.y, 170));
      break;
    }
    case 'glasstonic': {
      for (const e of node.enemies) {
        if (e.isDead) continue;
        if (Util.dist(player.x, player.y, e.x, e.y) < 200) {
          const applied = e.takeDamage(depthDmg(4), (e.x - player.x) * 0.05, (e.y - player.y) * 0.05);
          if (applied && e.isDead) handleEnemyDeath(game, e);
        }
      }
      game.explosions.push(new Explosion(player.x, player.y, 200));
      break;
    }
    case 'wardenwhistle': { player.heal(1); break; }
    case 'mooncharge': { player.heal(2); break; }
    case 'heralddraught': {
      player.redCurrent = player.redMax;
      game.toast('Fully healed!');
      break;
    }
    case 'heraldwhistle': {
      player.invincibleTimer = Math.max(player.invincibleTimer, 3);
      break;
    }
    case 'frostflask': {
      player.invincibleTimer = Math.max(player.invincibleTimer, 5);
      break;
    }
    // ---- Phase 16 — friendly fly family (see data/familiars-3.js) ----
    case 'swarmcanister': {
      hatchFriendlyFly(game, 'friendlybluefly');
      hatchFriendlyFly(game, 'friendlyyellowfly');
      break;
    }
    case 'waspwhistle': {
      // Every currently-owned friendly fly (blue orbiter or yellow shooter)
      // hits twice as hard for 10s. `f.buffMult` is read generically by
      // familiars.js's updateOrbiterFamiliar/updateShooterFamiliar (default
      // 1, so every other familiar in the game is unaffected) rather than
      // this item reaching into those functions itself.
      for (const f of player.familiars) {
        if (f.def.id === 'friendlybluefly' || f.def.id === 'friendlyyellowfly') {
          f.buffMult = 2; f.buffTimer = 10;
        }
      }
      break;
    }
    case 'trashcompactor': {
      // Consumes every friendly fly the player owns for one AoE blast —
      // more flies in, bigger blast out. A baseline hit even at zero flies
      // (Explosion radius 60) so the button is never a total dud the first
      // time it's used before any flies have been hatched yet.
      const flies = player.familiars.filter(f => f.def.id === 'friendlybluefly' || f.def.id === 'friendlyyellowfly');
      player.familiars = player.familiars.filter(f => f.def.id !== 'friendlybluefly' && f.def.id !== 'friendlyyellowfly');
      const R = 60 + flies.length * 24;
      game.explosions.push(new Explosion(player.x, player.y, R));
      for (const e of node.enemies) {
        if (e.isDead) continue;
        if (Util.dist(player.x, player.y, e.x, e.y) < R + e.radius) {
          const applied = e.takeDamage(depthDmg(2 + flies.length * 2), (e.x - player.x) * 0.06, (e.y - player.y) * 0.06);
          if (applied && e.isDead) handleEnemyDeath(game, e);
        }
      }
      break;
    }
  }
}

/* ---------------------------------------------------------------
   Shop
   --------------------------------------------------------------- */
function updateShop(game){
  const node = game.currentRoom, player = game.player;
  if (!node.shopSlots) return;
  for (const slot of node.shopSlots) {
    if (slot.bought) continue;
    const px = slot.x * TILE, py = slot.y * TILE;
    if (Util.dist(player.x, player.y, px, py) < 22) {
      // CAPPED at 70% off. loyaltybadge alone is an unbounded stacking count,
      // and shopDiscountBonus adds another ~7 sources on top of Merchant's
      // Ring + Pocket Ledger, so the raw sum passed 1.0 and every slot in
      // every shop for the rest of the run collapsed to the 1c floor below.
      const discount = Math.min(0.7, (player.passives.merchantsring ? 0.2 : 0) + (player.trinketId === 'pocketledger' ? 0.1 : 0)
    + 0.05 * (player.passives.loyaltybadge || 0) + player.shopDiscountBonus);
      const price = discount > 0 ? Math.max(1, Math.ceil(slot.price * (1 - discount))) : slot.price;
      if (player.coins < price) {
        // a quiet "how much more do I need" nudge instead of nothing at all —
        // shares the room's existing toast throttle (see dungeon.js/combat.js's
        // node.keyToastCooldown) so standing near several unaffordable slots
        // at once doesn't spam a toast per slot per frame
        if (node.keyToastCooldown <= 0) {
          node.keyToastCooldown = 1.5;
          Sound.play('uiDeny');
          game.toast('Need ' + (price - player.coins) + ' more coin' + (price - player.coins === 1 ? '' : 's') + '.');
        }
        continue;
      }
      player.coins -= price;
      slot.bought = true;
      Sound.play('shopBuy');
      bumpStat('coinsSpent', price, game);
      bumpStat('shopPurchases', 1, game);
      if (slot.kind === 'item') applyItemToPlayer(game, slot.item);
      else if (slot.kind === 'trinket') equipTrinket(game, slot.trinket);
      else if (slot.kind === 'familiar') addFamiliar(game, slot.familiar);
      else grantPickupKind(game, slot.pickup);
      game.toast('Purchased!');
      if (player.coins === 0) unlockAchievement('coinflip', game); // Mirror Shard — see data.js
    }
  }
}

function grantPickupKind(game, kind){
  const player = game.player;
  grantPickupEffect(game, kind, player.x, player.y - 26);
}

'use strict';
/* ============================================================
   pills.js — Binding of Isaac-esque unknown pills. A pill's
   color (see data.js's PILL_COLORS) is all you see until you
   use one; what it actually does is decided once per run (see
   game.js startRun's pillEffectMap) and revealed the first time
   that color gets used. Held in a single pocket slot, like a
   trinket — see player.pillPocket — and used with the Q key.
   ============================================================ */

// consumes whatever pill is in the player's pocket, if any
function useHeldPill(game){
  const player = game.player;
  if (!player.pillPocket) { game.toast('No pill to take.'); return; }
  const colorId = player.pillPocket;
  player.pillPocket = null;
  identifyAndApplyPill(game, colorId);
  bumpStat('pillsUsed', 1, game);
}

function identifyAndApplyPill(game, colorId){
  const effectId = game.pillEffectMap[colorId];
  const effect = PILL_EFFECTS[effectId];
  const wasKnown = !!game.pillIdentified[colorId];
  if (!wasKnown) game.pillIdentified[colorId] = true;

  applyPillEffect(game, effectId);

  const colorName = PILL_COLORS_BY_ID[colorId].name;
  const label = wasKnown ? (colorName + ' (' + effect.name + ')') : (colorName + ' was... ' + effect.name + '!');
  Sound.play(effect.good === false ? 'uiDeny' : 'itemGet');
  game.toast(label);
}

// every stat pill (Up or Down) just nudges one of the player's permanent
// pill accumulators and recalculates — see items.js recalcPlayerStats,
// which floors each stat so a long run of bad pulls can't zero you out.
//
// BALANCE NOTE: every "Down" used to be exactly HALF its matching "Up"
// (+0.10 speed vs -0.05, +1 damage vs -0.5, and so on). That made eating
// every pill you found the strictly correct play with no decision attached —
// a pill was a free stat vending machine wearing a gamble's costume. Each
// Down is now 3/4 of its Up: pills still average out positive (they are a
// reward pickup, after all), but a bad identify is now something you can
// actually regret.
function applyPillEffect(game, effectId){
  const player = game.player;
  switch (effectId) {
    case 'fullhealth':
      player.redCurrent = player.redMax;
      break;
    case 'speedup':
      player.pillSpeedBonus += 0.10;
      recalcPlayerStats(player);
      break;
    case 'speeddown':
      player.pillSpeedBonus -= 0.075;
      recalcPlayerStats(player);
      break;
    case 'damageup':
      player.pillDamageBonus += 1;
      recalcPlayerStats(player);
      break;
    case 'damagedown':
      player.pillDamageBonus -= 0.75;
      recalcPlayerStats(player);
      break;
    case 'luckup':
      player.pillLuckBonus += 2;
      recalcPlayerStats(player);
      break;
    case 'luckdown':
      player.pillLuckBonus -= 1.5;
      recalcPlayerStats(player);
      break;
    case 'rangeup':
      player.pillRangeBonus += 1; // +1 tile of range (ranged classes) / +0.25 tile (melee) — see recalcPlayerStats
      recalcPlayerStats(player);
      break;
    case 'rangedown':
      player.pillRangeBonus -= 0.75;
      recalcPlayerStats(player);
      break;
    case 'tearsup':
      player.pillFireRateBonus += 0.15;
      recalcPlayerStats(player);
      break;
    case 'tearsdown':
      player.pillFireRateBonus -= 0.11;
      recalcPlayerStats(player);
      break;
    case 'chargeup':
      if (player.activeItem) player.activeCharge = player.activeItem.maxCharge;
      break;
    case 'heartup':
      player.grantHeartContainer(1);
      break;
    case 'hpdown': {
      // mirrors takeDamage's blue-first drain (entities.js) but deliberately
      // bypasses invuln/shield/dodge — a pill you chose to swallow shouldn't
      // silently do nothing just because you got hit a moment ago. Guarded on
      // redCurrent > 0 so redMax:0 classes (Pony Bot) with no blue left just
      // take nothing rather than dying to a clamp at zero.
      let dmg = 1;
      const fromBlue = Math.min(player.blueCurrent, dmg);
      player.blueCurrent -= fromBlue; dmg -= fromBlue;
      if (dmg > 0 && player.redCurrent > 0) {
        player.redCurrent = Math.max(0, player.redCurrent - dmg);
        if (player.redCurrent <= 0) { player.redCurrent = 0; player.isDead = true; }
      }
      player.dmgFlashTimer = 0.3;
      Sound.play('playerHurt');
      break;
    }
    case 'hpup':
      // classes with no red health at all (Pony Bot's redMax:0) would just
      // eat the heal, so give them a blue heart instead. Kirin's redMax:0.5
      // is still red health and takes the normal branch.
      if (player.redMax > 0) player.heal(1); else player.healBlue(1);
      break;
    case 'mystery': {
      // both pools exclude 'mystery' itself, so this can never recurse
      const goodPool = PILL_EFFECT_LIST.filter(e => e.good === true && e.id !== 'mystery');
      const badPool = PILL_EFFECT_LIST.filter(e => e.good === false && e.id !== 'mystery');
      if (goodPool.length) applyPillEffect(game, Util.choice(goodPool).id);
      if (badPool.length) applyPillEffect(game, Util.choice(badPool).id);
      break;
    }
  }
}

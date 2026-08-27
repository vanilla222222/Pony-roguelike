'use strict';
/* ============================================================
   shop.js — shop pricing (with the donation machine's permanent
   discounts folded in) and the donation machine itself: a fixture
   in every shop room that takes 1 coin at a time, up to 5000c
   lifetime across all your runs. See room.js's addShopSlot (pricing
   + placement), items.js's updateShop (buying a slot), and game.js's
   tryDonate (feeding the machine, bound to the F key in main.js).

   The donation total is just another lifetime stat (see
   achievements.js's bumpStat) — every 50c up to 1000c, then every
   1000c from 1000c to DONATION_CAP, crosses the threshold of one of
   the "Donations" category achievements, which is what actually
   grants the reward (a -1c discount, item, trinket, familiar, or —
   for the four milestones past 1000c, once every -1c discount kind is
   already spoken for — a flat skill-point bonus; see
   unlockAchievement()'s def.skillPoints handling in logic.js) and
   records it in the save. This file only tracks the running total and
   prices things against whatever discounts those achievements have
   unlocked so far — see unlockAchievement()'s def.shopDiscount
   handling.

   Independently of that achievement ladder, every 25c donated also
   pays 1 skill point directly — see awardDonationSkillPoints() in
   achievements/logic.js, called right after bumpStat('donationTotal',
   ...) below. That's a much faster drip than the bestiary tiers, by
   design: the donation machine is a guaranteed, always-available
   skill-point sink for whatever surplus coin a run doesn't spend.

   Persisted alongside the rest of the save data in localStorage's
   'nightfallUnlocks' blob (see main.js loadUnlocks/saveUnlocks):
     unlocks.stats.donationTotal              — lifetime coins fed in,
                                                 capped at DONATION_CAP
     unlocks.stats.donationSkillPointsAwarded — how many of the
                                                 every-25c skill points
                                                 have already been paid,
                                                 so awardDonationSkillPoints
                                                 never double-pays
     unlocks.donationDiscounts   — { buyableKind: true, ... } — which
                                    of the 10 -1c discounts have been
                                    earned (see SHOP_BASE_PRICES; Star
                                    is priced here too but isn't part
                                    of that rotation — no achievement
                                    grants it a discount)
   ============================================================ */

const DONATION_CAP = 5000;
// every 25c donated (independent of the achievement ladder) pays 1 skill
// point — see awardDonationSkillPoints in achievements/logic.js, called
// from tryDonateMachine right below.
const DONATION_SKILL_POINT_INTERVAL = 25;

/* ------------------------------------------------------------------
   WHAT A RUN ACTUALLY EARNS — derived once, here, so nobody has to
   re-derive it to price anything. A price is meaningless without the
   income it is priced against, and this game's income is spread thin
   across a lot of small sources, none of which look like much alone.

   Average value of one coin pickup — COIN_TYPES (data.js), weights
   78/15/6/1 over values 1/5/10/1:                            2.14c

   Coins per cleared NORMAL room:
     room-clear reward     CLEAR_REWARD_CHANCE 63% pickup
                           x 44% coin (PICKUP_POOL 55 of 125)  0.59c
     ...its 12% sack/battery slice (a sack is 3 pickups,
        call it half the rolls)                                0.17c
     ...its 7% chest slice (a chest is randi(1,5) ~ 3
        pickups = 2.82c)                                       0.20c
     30% chance of a procedural chest in the room itself
        (room.js populateRoomProcedural)                       0.85c
                                                        --------------
                                                        ~1.8c, call it
                                                        ~2c with the
                                                        coins hand-
                                                        placed in room
                                                        templates.

   Normal rooms per floor = 10 + 2F (dungeon.js's targetNormal), so:
     Floor 1  = 12 rooms ~ 24c        Floor 10 = 30 rooms ~ 60c
     Whole 10-floor run = 210 rooms  ~ 420c
   None of that counts the coin-value multiplier trinkets/passives
   (combat.js's grantPickupEffect, up to ~+2x on a hoarder build), the
   Coin Sprite/Tip Jar familiars, or Windfall/Coin Purse — every one of
   which is a bonus ON TOP of the figures above, which is exactly why
   those were compressed in the same pass (see items.js and the
   FAMILIAR_TYPES tuning note in data.js).

   PRICED AGAINST THAT: there is exactly one shop per floor with 3-4
   slots (room.js), mixed 35% pickup / 40% item / 12% trinket / 13%
   familiar (SHOP_SLOT_KIND_WEIGHTS — note trinket and familiar both
   fall back to an item when nothing is unlocked yet, so on a fresh
   save a shop is nearly all items). With the prices below the average
   slot costs ~11c and a whole shop holds ~39c of stock, so:
     Floor 1  (~24c) buys ~2 of the 3-4 slots — you choose.
     Floor 10 (~60c) clears the shop, which is fine; by then the
       donation machine (DONATION_CAP, above) is where surplus goes.
   That "a floor's income is about two slots, not the whole shelf" is
   the number to preserve if these are ever retuned again.
   ------------------------------------------------------------------ */

// what a slot of each buyable "kind" costs before the % discounts
// (Merchant's Ring/Pocket Ledger) apply — see items.js's updateShop.
// This table is the ONLY pricing source: data.js's SHOP_PICKUP_PRICES
// carries a `price` field that room.js never reads (it only picks the
// kind out of it and then calls shopPrice() below).
const SHOP_BASE_PRICES = {
  // consumables, laddered by how much a single one actually swings a
  // floor: a red heart is the cheapest thing in the game on purpose
  // (it's the one you buy when you're about to die and have 3c), a
  // battery is the most expensive (it re-fires whatever active you're
  // carrying, and some of those are room-wipes).
  heartRed: 3, heartBlue: 6, bomb: 5, key: 5, pill: 5, star: 7, sack: 8, battery: 9, trashbag: 10,
  item: SHOP_ITEM_PRICE, trinket: SHOP_TRINKET_PRICE, familiar: SHOP_FAMILIAR_PRICE,
};
// human labels for a buyable kind — used both for the donation discount
// toast (achievements.js's unlockAchievement) and its achievements-panel
// reward line (buildAchievementsPanel).
const SHOP_KIND_LABELS = {
  heartRed:'Red Heart', heartBlue:'Blue Heart', bomb:'Bomb', key:'Key', pill:'Pill', star:'Star',
  sack:'Sack', battery:'Battery', trashbag:'Trash Bag', item:'Item', trinket:'Trinket', familiar:'Familiar',
};

function isDonationDiscountUnlocked(kind){
  const unlocks = ensureUnlockShape(loadUnlocks());
  return !!unlocks.donationDiscounts[kind];
}

// the price a shop slot of this kind should actually be listed at — base
// price, minus 1 if this kind's donation-machine discount has been earned.
// This is what room.js's addShopSlot prices every slot against; the %
// discounts (Merchant's Ring, Pocket Ledger) apply on top at purchase time
// — see items.js's updateShop.
// Floor-depth price scaling. Income per floor grows (dungeon.js's targetNormal
// is 10 + 2F rooms, so floor 10 earns ~2.5x what floor 1 does) while the price
// table above was completely flat, which made deep shops trivially clearable.
// This is deliberately much gentler than the income curve — the point is that a
// deep shop feels like a bigger commitment, not that it outruns your wallet.
//   floor 0 -> x1.00      floor 6  -> x1.33      floor 12 -> x1.66
// Applied BEFORE the donation-machine -1c below and before the % discounts
// items.js's updateShop stacks at purchase time, so both still bite on top.
const SHOP_FLOOR_PRICE_STEP = 0.055;
const SHOP_FLOOR_PRICE_MAX_FLOOR = 12; // the last floor of a run (see game.js's descend)
function shopFloorPriceMult(floorNum){
  const f = Util.clamp(floorNum || 0, 0, SHOP_FLOOR_PRICE_MAX_FLOOR);
  return 1 + f * SHOP_FLOOR_PRICE_STEP;
}

function shopPrice(kind, floorNum){
  const base = SHOP_BASE_PRICES[kind] != null ? SHOP_BASE_PRICES[kind] : 8;
  const scaled = Math.max(1, Math.round(base * shopFloorPriceMult(floorNum)));
  return isDonationDiscountUnlocked(kind) ? Math.max(1, scaled - 1) : scaled;
}

// the F-key action (see main.js) — donates 1 coin at a time to the current
// room's donation machine, if any and if the player is standing near it.
// bumpStat does the actual threshold-crossing/achievement-unlocking work.
function tryDonateMachine(game){
  const node = game.currentRoom, player = game.player;
  const machine = node.donationMachine;
  if (!machine) return;
  const px = machine.x * TILE, py = machine.y * TILE;
  if (Util.dist(player.x, player.y, px, py) > 30) return;

  const unlocks = ensureUnlockShape(loadUnlocks());
  if (unlocks.stats.donationTotal >= DONATION_CAP) { game.toast('The donation machine is fully funded.'); return; }
  if (player.coins < 1) { game.toast('No coins to donate.'); return; }

  player.coins -= 1;
  Sound.play('coin');
  game.floatTexts.push(new FloatText(player.x, player.y - 26, '-1c donated', '#e3c15b'));
  bumpStat('donationTotal', 1, game); // its own independent load/save — checks/unlocks the "Donations" achievements
  awardDonationSkillPoints(game); // every 25c drips 1 more skill point, see logic.js
}

/* ------------------------------------------------------------------
   The reroll altar — the shop room's second fixture, sitting in the
   opposite corner from the donation machine (see room.js's populateRoom).
   Pay coins, and every unbought item/trinket/familiar slot in the room
   re-rolls into a fresh pick from the same pools that generated it
   (room.js's rerollShopSlots). Pickup slots never reroll.

   Cost curve, per SHOP VISIT: 3c, 6c, 10c, 15c, then +6c each further
   use. The first pull is cheap enough to always be worth it when the
   shelf is bad; the third already costs more than a trinket, so
   fishing for one specific item is a real, mounting tax rather than
   a formality.

   That escalation lives on the room node (node.rerollAltar.uses), NOT
   on the player or any global: game.js's enterRoom resets it to 0 on
   every entry, so leaving and walking back in restarts the curve, and
   two shops on two different floors are two separate node objects that
   can never share a count.
   ------------------------------------------------------------------ */
const REROLL_ALTAR_COSTS = [3, 6, 10, 15];
const REROLL_ALTAR_COST_STEP = 6; // per use past the end of the table above

function rerollAltarCost(altar){
  const uses = (altar && altar.uses) || 0;
  const last = REROLL_ALTAR_COSTS.length - 1;
  if (uses <= last) return REROLL_ALTAR_COSTS[uses];
  return REROLL_ALTAR_COSTS[last] + REROLL_ALTAR_COST_STEP * (uses - last);
}

// the G-key action (see main.js) — mirrors tryDonateMachine exactly: same
// node lookup, same 30px proximity gate, same coin/sound/float-text feedback.
function tryRerollAltar(game){
  const node = game.currentRoom, player = game.player;
  const altar = node.rerollAltar;
  if (!altar) return;
  const px = altar.x * TILE, py = altar.y * TILE;
  if (Util.dist(player.x, player.y, px, py) > 30) return;

  if (!countRerollableShopSlots(node)) { game.toast('Nothing left on the shelf to reroll.'); Sound.play('uiDeny'); return; }
  const cost = rerollAltarCost(altar);
  if (player.coins < cost) {
    Sound.play('uiDeny');
    game.toast('The altar wants ' + cost + 'c — need ' + (cost - player.coins) + ' more.');
    return;
  }

  player.coins -= cost;
  altar.uses++;
  const n = rerollShopSlots(node);
  Sound.play('itemGet'); // same "the shelf changed" cue stars.js's Deneb reroll uses
  game.floatTexts.push(new FloatText(player.x, player.y - 26, '-' + cost + 'c reroll', '#a98bff'));
  bumpStat('coinsSpent', cost, game);
  bumpStat('rerollAltarUses', 1, game); // only on a reroll that actually happened — see achievements.js's misc_rerollaltar ladder
  game.toast('Rerolled ' + n + ' slot' + (n === 1 ? '' : 's') + ' — next reroll ' + rerollAltarCost(altar) + 'c.');
}

function donationProgressFrac(){
  const unlocks = ensureUnlockShape(loadUnlocks());
  return Util.clamp(unlocks.stats.donationTotal / DONATION_CAP, 0, 1);
}

/* ------------------------------------------------------------------
   Phase 4 overhaul — the Arcade room. A coin-toll-gated room type (see
   combat.js's coinLockedRoomFor/tryUnlockCoinDoor) scattered with 2-4
   filly/machine fixtures (room.js's populateRoom fills node.fillies/
   node.machines). tryArcadeInteract is the single H-key entry point (see
   main.js) — a proximity scan finds whichever fixture, if any, the player
   is standing next to, then dispatches by its `kind`.

   Fillies (node.fillies: {kind,x,y,fedCount,done}) take a resource and
   hand back an immediate reward every feed; coin/bomb/key/heart also have a
   one-time capstone reward at a fedCount threshold, after which `done`
   caps further feeds (battery has no capstone/`done` at all — it's a plain
   repeatable coin sink, same shape as the shop's battery pickup, just
   priced). Machines (node.machines: {kind,x,y}) are a flat coin gamble,
   no persistent state beyond the room instance.
   ------------------------------------------------------------------ */

// curated, id-only reward lists for the Bomb/Key fillies' capstone feeds —
// see data/items-5.js's Arcade batch. pools:[] on all 8 of those items means
// they can ONLY ever be granted from here, never from a generic pool roll.
const ARCADE_BOMB_REWARDS = ['cherrybomb', 'sparkfuse', 'demolitionrig', 'blastmaster'];
const ARCADE_KEY_REWARDS = ['skeletonkeyring', 'brasslockpick', 'vaultcrackerskit', 'mastervaultkey'];
// the Coin Filly's per-feed reward roll — deliberately excludes 'coin' itself
// (a coin-for-coin loop would be pointless) and sack/battery/doublekey-style
// tier variants (kept to the same small, always-useful subset a shop's
// pickup slots draw from — see SHOP_PICKUP_PRICES).
const ARCADE_COIN_FILLY_REWARDS = ['heartRed', 'bomb', 'key', 'pill', 'star'];
// grey/gold/stone only for the Key Filly's per-feed chest — cursed/wood/
// eternal are deliberately excluded (a heart-cost or all-consumable chest
// doesn't fit "spend a key, get a reasonable chest")
const ARCADE_KEY_FILLY_CHEST_KINDS = [{ id:'grey', w:50 }, { id:'gold', w:30 }, { id:'stone', w:20 }];

// finds whichever fixture (filly or machine) is within 30px of the player,
// nearest first — same proximity radius as the donation machine/reroll altar.
function findNearestArcadeFixture(node, player){
  let best = null, bestDist = 30;
  const scan = (list, isFilly) => {
    if (!list) return;
    for (const f of list) {
      const px = f.x * TILE, py = f.y * TILE;
      const d = Util.dist(player.x, player.y, px, py);
      if (d <= bestDist) { best = { obj: f, isFilly }; bestDist = d; }
    }
  };
  scan(node.fillies, true);
  scan(node.machines, false);
  return best;
}

function tryArcadeInteract(game){
  const node = game.currentRoom, player = game.player;
  const found = findNearestArcadeFixture(node, player);
  if (!found) return; // nothing nearby — silent no-op, matching tryDonateMachine's early-out spirit
  if (found.isFilly) feedArcadeFilly(game, found.obj);
  else useArcadeMachine(game, found.obj);
}

function feedArcadeFilly(game, filly){
  const player = game.player;
  switch (filly.kind) {
    case 'coin': {
      if (filly.done) { game.toast('This one looks satisfied.'); return; }
      if (player.coins < 1) { Sound.play('uiDeny'); game.toast('No coins to feed it.'); return; }
      player.coins -= 1;
      filly.fedCount++;
      bumpStat('arcadeFilliesFed', 1, game); // Phase 5b — lifetime feed counter, see achievements.js
      grantPickupEffect(game, Util.choice(ARCADE_COIN_FILLY_REWARDS), player.x, player.y - 26);
      if (filly.fedCount >= 5 && !filly.done) {
        filly.done = true;
        bumpStat('arcadeFillyCapstonesReached', 1, game); // Phase 5b — see achievements.js 'arcade_filly_capstone'
        const item = pickItemFromPool('treasure');
        if (item) applyItemToPlayer(game, item);
        Sound.play('itemGet');
        FX.twinkle(player.x, player.y - 30, '#e3c15b'); // Phase 6b overhaul — capstone reveal flourish
        game.floatTexts.push(new FloatText(player.x, player.y - 46, 'The Coin Filly beams!', '#e3c15b'));
      }
      break;
    }
    case 'bomb': {
      if (filly.done) { game.toast('This one looks satisfied.'); return; }
      if (player.bombs < 1) { Sound.play('uiDeny'); game.toast('No bombs to feed it.'); return; }
      player.bombs -= 1;
      filly.fedCount++;
      bumpStat('arcadeFilliesFed', 1, game);
      const n = Util.randi(1, 3);
      player.coins += n;
      player.heal(0.5);
      Sound.play('coin');
      game.floatTexts.push(new FloatText(player.x, player.y - 26, '+' + n + 'c, +½ heart', '#e3c15b'));
      if (filly.fedCount >= 4 && !filly.done) {
        filly.done = true;
        bumpStat('arcadeFillyCapstonesReached', 1, game);
        const item = ITEMS[Util.choice(ARCADE_BOMB_REWARDS)];
        if (item) applyItemToPlayer(game, item);
        Sound.play('itemGet');
        FX.twinkle(player.x, player.y - 30, '#e0895a'); // Phase 6b overhaul — capstone reveal flourish
        game.floatTexts.push(new FloatText(player.x, player.y - 46, 'The Bomb Filly beams!', '#e0895a'));
      }
      break;
    }
    case 'key': {
      if (filly.done) { game.toast('This one looks satisfied.'); return; }
      if (player.keys < 1) { Sound.play('uiDeny'); game.toast('No keys to feed it.'); return; }
      player.keys -= 1;
      filly.fedCount++;
      bumpStat('arcadeFilliesFed', 1, game);
      const chestKind = Util.weighted(ARCADE_KEY_FILLY_CHEST_KINDS).id;
      const spot = findNearestFloor(game.currentRoom, filly.x, filly.y);
      game.currentRoom.chests.push(new Chest(chestKind, spot.x, spot.y));
      Sound.play('chestOpen');
      game.floatTexts.push(new FloatText(player.x, player.y - 26, 'A chest appears!', '#dcdcdc'));
      if (filly.fedCount >= 4 && !filly.done) {
        filly.done = true;
        bumpStat('arcadeFillyCapstonesReached', 1, game);
        const item = ITEMS[Util.choice(ARCADE_KEY_REWARDS)];
        if (item) applyItemToPlayer(game, item);
        Sound.play('itemGet');
        FX.twinkle(player.x, player.y - 30, '#dcdcdc'); // Phase 6b overhaul — capstone reveal flourish
        game.floatTexts.push(new FloatText(player.x, player.y - 46, 'The Key Filly beams!', '#dcdcdc'));
      }
      break;
    }
    case 'heart': {
      if (filly.done) { game.toast('This one looks satisfied.'); return; }
      // must never be able to kill the player or leave them at 0 hearts —
      // same "must always leave something" rule as tryOpenChest's cursed
      // chest (see entities.js's spendHearts docs)
      if (player.totalHearts() <= 1) { Sound.play('uiDeny'); game.toast("Can't spare your last heart."); return; }
      player.spendHearts(1);
      filly.fedCount++;
      bumpStat('arcadeFilliesFed', 1, game);
      const rewardKind = Util.choice(['pill', 'star', 'trinket', 'blueHeart']);
      if (rewardKind === 'trinket') {
        const trinket = pickTrinketFromPool();
        if (trinket) equipTrinket(game, trinket);
        else grantPickupEffect(game, 'star', player.x, player.y - 26); // nothing unlocked yet — fall back
      } else if (rewardKind === 'blueHeart') {
        grantPickupEffect(game, 'heartBlue', player.x, player.y - 26);
      } else {
        grantPickupEffect(game, rewardKind, player.x, player.y - 26);
      }
      if (filly.fedCount >= 4 && !filly.done) {
        filly.done = true;
        bumpStat('arcadeFillyCapstonesReached', 1, game);
        const item = pickItemFromPool('sombra');
        if (item) applyItemToPlayer(game, item);
        Sound.play('itemGet');
        FX.twinkle(player.x, player.y - 30, '#e35b6a'); // Phase 6b overhaul — capstone reveal flourish
        game.floatTexts.push(new FloatText(player.x, player.y - 46, 'The Heart Filly beams!', '#e35b6a'));
      }
      break;
    }
    case 'battery': {
      // check activeItem BEFORE deducting cost — courtesy the plain battery
      // pickup extends for free (combat.js's grantPickupEffect 'battery'
      // case), but this one costs real coins, so charging for a no-op would
      // be a straight theft the free version never commits
      const charged = !!player.activeItem;
      if (!charged) { Sound.play('uiDeny'); game.toast('No active item.'); return; }
      if (player.coins < 3) { Sound.play('uiDeny'); game.toast('Needs 3 coins to charge.'); return; }
      player.coins -= 3;
      filly.fedCount++;
      bumpStat('arcadeFilliesFed', 1, game); // battery filly has no capstone (never sets filly.done) — see feedArcadeFilly
      player.activeCharge = Math.min(player.activeItem.maxCharge, player.activeCharge + 3);
      Sound.play('battery');
      game.floatTexts.push(new FloatText(player.x, player.y - 26, '+3 charge', '#7fd6c9'));
      break;
    }
  }
}

// Phase 6a overhaul — friendship/tools machines no longer resolve instantly:
// the coin is spent and the outcome is ROLLED AND STORED right here (at
// press-time, so there's nothing to gain by reloading/timing the reveal),
// then machine.spinning/machine.spinTimer defer the actual grant/"nothing"
// toast to updateArcadeMachines below once the spin delay elapses. `dark` is
// guaranteed (no real odds), so it stays instant — no suspense to build.
const ARCADE_SPIN_DELAY = 0.45;

function useArcadeMachine(game, machine){
  const player = game.player;
  switch (machine.kind) {
    case 'friendship': {
      if (player.coins < 1) { Sound.play('uiDeny'); game.toast('No coins to feed it.'); return; }
      player.coins -= 1;
      bumpStat('arcadeMachinesUsed', 1, game); // Phase 5b — lifetime use counter, see achievements.js
      const win = Math.random() < 0.5;
      machine.spinning = true;
      machine.spinTimer = ARCADE_SPIN_DELAY;
      machine.pendingOutcome = win ? { win: true, kind: Util.weighted(COMMON_HEART_POOL).id } : { win: false };
      break;
    }
    case 'tools': {
      if (player.coins < 2) { Sound.play('uiDeny'); game.toast('Needs 2 coins.'); return; }
      player.coins -= 2;
      bumpStat('arcadeMachinesUsed', 1, game);
      const win = Math.random() < 0.5;
      machine.spinning = true;
      machine.spinTimer = ARCADE_SPIN_DELAY;
      machine.pendingOutcome = win ? { win: true, kind: Util.choice(['key', 'bomb']) } : { win: false };
      break;
    }
    case 'dark': {
      if (player.coins < 4) { Sound.play('uiDeny'); game.toast('Needs 4 coins.'); return; }
      player.coins -= 4;
      bumpStat('arcadeMachinesUsed', 1, game);
      grantPickupEffect(game, Util.choice(['pill', 'star']), player.x, player.y - 26);
      break;
    }
  }
}

// Ticks any node.machines entries mid-spin (see useArcadeMachine above) and
// resolves their pre-rolled outcome once spinTimer expires — the reward
// grant/"nothing" toast fires exactly once, here, never at press-time.
// Cheap no-op when the current room has no machines or none are spinning.
function updateArcadeMachines(game, dt){
  const node = game.currentRoom;
  if (!node || !node.machines) return;
  const player = game.player;
  for (const m of node.machines) {
    if (!m.spinning) continue;
    m.spinTimer -= dt;
    if (m.spinTimer > 0) continue;
    m.spinning = false;
    const outcome = m.pendingOutcome;
    m.pendingOutcome = null;
    if (outcome && outcome.win) {
      FX.twinkle(m.x * TILE, m.y * TILE - 14, Theme.machine.spinRing); // Phase 6b overhaul — win reveal flourish
      grantPickupEffect(game, outcome.kind, player.x, player.y - 26);
    } else {
      Sound.play('machineWhiff');
      game.toast('Nothing this time.');
    }
  }
}

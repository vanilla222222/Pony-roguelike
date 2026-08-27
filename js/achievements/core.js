'use strict';
/* ============================================================
   achievements.js — achievement definitions + unlock/tracking
   logic. Every achievement unlocks something new: a character
   (def.classId), a new item (def.itemId, permanently added to
   that item's normal pools for all future runs), a new special
   pickup kind (def.pickupKind — double/gold bomb or key, sack,
   battery), a new trinket (def.trinketId — see data.js's
   TRINKETS and items.js's equipTrinket), a new familiar
   (def.familiarId — see data.js's FAMILIAR_TYPES and
   familiars.js), or a permanent -1c shop discount (def.shopDiscount
   — one of shop.js's SHOP_BASE_PRICES kinds).

   Persisted alongside the rest of the save data in
   localStorage's 'nightfallUnlocks' blob (see main.js
   loadUnlocks/saveUnlocks):
     unlocks.achievements     — { achId: true, ... }
     unlocks.<classId>        — true once that character is unlocked
                                 (read by ui.js buildClassSelect)
     unlocks.unlockedItems    — { itemId: true, ... } (read by
                                 room.js's pickItemFromPool to keep
                                 locked items out of the pools)
     unlocks.unlockedPickups  — { pickupKind: true, ... } (read by
                                 isPickupKindUnlocked() to keep
                                 special pickups out of the rolls)
     unlocks.unlockedTrinkets — { trinketId: true, ... } (read by
                                 isTrinketUnlocked()/room.js's
                                 pickTrinketFromPool())
     unlocks.unlockedFamiliars— { familiarId: true, ... } (read by
                                 isFamiliarUnlocked()/room.js's
                                 pickFamiliarFromPool())
     unlocks.unlockedPillColors—{ pillColorId: true, ... } (read by
                                 isPillColorUnlocked()/room.js's
                                 rollRandomPillColorId())
     unlocks.unlockedEnemies  — { enemyId: true, ... } (read by
                                 isEnemyUnlocked()/room.js's
                                 resolveGenericEnemy())
     unlocks.unlockedPaths    — { C:bool, D:bool } — which alternate
                                 routes have been earned (read by
                                 isPathUnlocked()/dungeon.js's
                                 cpathgate + planetarium gate rooms)
     unlocks.stats            — lifetime counters that misc
                                 achievements threshold against,
                                 including .donationTotal — lifetime
                                 coins fed into a shop's donation
                                 machine (see shop.js)
     unlocks.donationDiscounts— { buyableKind: true, ... } — which
                                 -1c shop discounts have been earned
   ============================================================ */

// special pickup kinds that start locked — see BOMB_TIER_POOL/KEY_TIER_POOL
// in data.js and room.js's SACK_BATTERY_WEIGHTS/rollSackBatteryKind
const ACHIEVEMENT_PICKUP_KINDS = ['doublebomb', 'goldbomb', 'doublekey', 'goldkey', 'sack', 'battery', 'minibattery'];
const PICKUP_KIND_LABELS = {
  doublebomb:'Double Bomb', goldbomb:'Gold Bomb', doublekey:'Double Key', goldkey:'Gold Key',
  sack:'Sack', battery:'Battery', minibattery:'Mini Battery',
};

/* Per-run unlock snapshot. Anything earned mid-run is banked for the NEXT
   run, never handed over or rolled into the current one (see
   unlockAchievement, which no longer grants its reward on the spot). The
   spawn-roll gates below therefore read the unlock state as it was when the
   run STARTED — game.js startRun calls beginRunUnlocks(), and the two run-end
   transitions (win/gameover) call endRunUnlocks(). Outside a run the snapshot
   is null and the live save is read, so menus/bestiary/room-editor previews
   always see the newest unlocks. loadUnlocks() re-parses localStorage on every
   call, so the snapshot is its own object and later saves can't mutate it. */
let _runUnlockSnapshot = null;
function beginRunUnlocks(){ _runUnlockSnapshot = ensureUnlockShape(loadUnlocks()); }
function endRunUnlocks(){ _runUnlockSnapshot = null; }
function currentUnlocks(){ return _runUnlockSnapshot || ensureUnlockShape(loadUnlocks()); }

function isPickupKindUnlocked(kind){
  if (ACHIEVEMENT_PICKUP_KINDS.indexOf(kind) === -1) return true; // ordinary kinds are always available
  return !!currentUnlocks().unlockedPickups[kind];
}

function isTrinketUnlocked(trinketId){
  return !!currentUnlocks().unlockedTrinkets[trinketId];
}

function isFamiliarUnlocked(familiarId){
  return !!currentUnlocks().unlockedFamiliars[familiarId];
}

function isStarUnlocked(starId){
  return !!currentUnlocks().unlockedStars[starId];
}

// pill colors — the 40 `locked:true` swatches at the tail of data.js's
// PILL_COLORS. Read by room.js's rollRandomPillColorId(), which is the single
// place a pill's color is drawn (both the room spawner and combat.js's
// grantPickupEffect go through it), so a locked color can never appear on a
// pedestal, in a shop slot, or in the pocket until it's earned. The original
// 60 colors carry no `locked` field at all and are unaffected.
function isPillColorUnlocked(colorId){
  return !!currentUnlocks().unlockedPillColors[colorId];
}

// enemies — the 60 `locked:true` entries at the tail of enemies.js's
// ENEMY_TYPES. Read by room.js's resolveGenericEnemy at every pool-filter
// step (floorKey pool, stage pool, both fallbacks), so a locked creature is
// invisible to the spawner until earned. All ~619 original enemies carry no
// `locked` field and are unaffected.
function isEnemyUnlocked(enemyId){
  return !!currentUnlocks().unlockedEnemies[enemyId];
}

// alternate routes — 'C' (the drowned path, entered from floor 2's cpathgate
// room) and 'D' (the starlit path, entered from floor 3's planetarium room).
// Phase 10 made both earned: C unlocks by clearing the main route as it stood
// before Phase 10 (stages.js's OLD_MAIN_ROUTE_FINAL_FLOOR), D by clearing the
// C route. Read by dungeon.js's generateDungeon, which simply doesn't attach
// the corresponding gate room while the path is locked — exactly the way a
// locked enemy is filtered out of the spawn pools rather than erroring.
// Reads the run snapshot like every other gate here, so a path earned mid-run
// opens on the NEXT run, never the current one.
function isPathUnlocked(path){
  return !!currentUnlocks().unlockedPaths[path];
}

const ACHIEVEMENTS = [];
// Flipped true once the lookup index below the definitions is built (see
// indexAchievement). Until then addAchievement only fills the array and the
// whole index is built in one pass afterwards; anything added AFTER that point
// folds itself into the index incrementally, so the two can never drift apart.
// Deliberately `var`: addAchievement runs hundreds of times below, long before
// this file reaches the index, and a `let` would sit in its TDZ until then.
var _achvIndexReady = false;
function addAchievement(def){ ACHIEVEMENTS.push(def); if (_achvIndexReady) indexAchievement(def); }

/* ---------------------------------------------------------------
   addTierSet — declares a graduated ladder ("Defeat 10 / 50 / 200 of
   these") in ONE call instead of N near-identical addAchievement
   blocks. Every field the ladder shares lives on the spec; every
   field that differs per rung lives on the tier.

     addTierSet({
       baseId:    'slayer_cryptslinger',  // ids become baseId + '_t1', '_t2', ...
       name:      'Crypt Culler',         // string → auto-suffixed ' I', ' II', ' III'
                                          // (only when there's >1 tier), or a
                                          // function (threshold, index) => string
       icon:      '💀',                   // ladder-wide; a tier may override
       category:  'Slayer',
       desc:      n => 'Defeat ' + n + ' Cryptslingers.',  // or a plain string
       // exactly ONE of these three predicate shapes:
       statKey:   'meleeKills',                              // (a) lifetime stat ladder
       bestiarySection:'enemyKills', bestiaryId:'cryptslinger', // (b) per-id bestiary ladder
       bestiarySection:'seenItems',  distinct:true,            // (c) bestiary breadth ladder
       tiers: [
         { threshold:10,  itemId:'somepassive' },
         { threshold:50,  trinketId:'sometrinket' },
         { threshold:200, familiarId:'somefamiliar' },
       ],
     });

   Tier fields: `threshold` (required — the number this rung wants; it
   becomes `distinctThreshold` when spec.distinct is set), an optional
   `name`/`icon` override, and any ONE reward field, passed through to
   addAchievement untouched: itemId / trinketId / familiarId / starId /
   pickupKind / pillColorId / enemyId / classId / shopDiscount.

   Ids are built from baseId + the 1-based tier INDEX (not the
   threshold) so that retuning a threshold later never orphans a
   player's earned unlock. The '_t<n>' suffix also means an id can only
   collide with an existing achievement if baseId collides, which is
   why baseId should stay category-prefixed ('slayer_', 'mastery_', ...).
   --------------------------------------------------------------- */
const TIER_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
// every reward field unlockAchievement knows how to hand out — see its
// if/else chain further down; addTierSet copies whichever one a tier carries
const TIER_REWARD_KEYS = ['itemId', 'trinketId', 'familiarId', 'starId', 'pickupKind', 'pillColorId', 'enemyId', 'classId', 'shopDiscount'];
function addTierSet(spec){
  const tiers = spec.tiers || [];
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const n = tier.threshold;
    const def = {
      id: spec.baseId + '_t' + (i + 1),
      name: tier.name != null ? tier.name
        : typeof spec.name === 'function' ? spec.name(n, i)
        : (tiers.length > 1 ? spec.name + ' ' + (TIER_NUMERALS[i] || (i + 1)) : spec.name),
      icon: tier.icon || spec.icon,
      desc: typeof spec.desc === 'function' ? spec.desc(n, i) : spec.desc,
      category: spec.category,
    };
    if (spec.statKey) def.statKey = spec.statKey;
    if (spec.bestiarySection) def.bestiarySection = spec.bestiarySection;
    if (spec.bestiaryId) def.bestiaryId = spec.bestiaryId;
    if (spec.distinct) def.distinctThreshold = n; else def.threshold = n;
    for (const key of TIER_REWARD_KEYS) if (tier[key] != null) def[key] = tier[key];
    addAchievement(def);
  }
}

// ---- 1. character unlocks — no item/trinket reward, they already grant a character ----

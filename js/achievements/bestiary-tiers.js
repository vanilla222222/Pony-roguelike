'use strict';
/* ============================================================
   bestiary-tiers.js — Phase 8a, the meta-progression FOUNDATION.

   Every bestiary entry (each individual enemy, item, star, room type,
   ...) has its own 4-rung mastery ladder: copper → silver → gold →
   platinum, thresholded against how many times that ONE id has been
   killed/collected/visited. Crossing a rung awards 1 skill point into
   unlocks.skillTree.points (see achievements/logic.js's
   checkBestiaryTierUp, which is the only caller of bestiaryTierFor in
   the write path).

   NOTE: nothing SPENDS those points yet — the skill tree panel itself is
   a later phase. This file only defines the ladders and the lookup.

   Loaded before achievements/logic.js in index.html.
   ============================================================ */

// Per-category ladders: 4 ascending integers, [copper, silver, gold, platinum].
// The category keys here are bestiary-tier categories, NOT the unlocks.bestiary
// bucket names — one bucket can feed several categories (enemyKills splits into
// enemy/boss/superboss by which data table the id lives in). The mapping from
// bucket → category lives in logic.js's bumpBestiaryCount/markBestiarySeen.
const BESTIARY_TIER_THRESHOLDS = {
  enemy:      [50, 250, 1000, 5000],   // 957 regular enemies (data/enemies/types-1..4.js)
  boss:       [10, 40, 150, 500],      // 64 bosses (data/enemies/bosses.js)
  superboss:  [1, 5, 15, 50],          // 22 superbosses (data/enemies/superbosses.js)
  item:       [3, 10, 30, 100],        // 1934 items (data/items-1..5.js)
  trinket:    [3, 10, 30, 100],        // 607 trinkets (data/trinkets-1..2.js)
  familiar:   [3, 10, 30, 100],        // 401 familiars (data/familiars-1..2.js)
  star:       [3, 10, 30, 100],        // 73 stars (data/collectibles.js)
  pill:       [3, 10, 30, 100],        // 200 pill colors (data/pickups.js)
  object:     [5, 20, 75, 250],        // 32 obstacles (data/collectibles.js)
  pickup:     [10, 40, 150, 500],      // 22 pickup kinds (data/economy.js)
  roomtype:   [3, 10, 30, 100],        // 18 room types (data/economy.js)
  stage:      [1, 3, 10, 30],          // 22 stages (data/stages.js)
};

const BESTIARY_TIER_NAMES = ['copper', 'silver', 'gold', 'platinum'];
// index 0-3 == tier 1-4; tier 0 ("not yet ranked") draws nothing at all
const BESTIARY_TIER_ICONS = { copper:'🟠', silver:'⚪', gold:'🟡', platinum:'💠' };
const BESTIARY_TIER_COLORS = { copper:'#b87333', silver:'#c0c0c0', gold:'#ffd700', platinum:'#e5e4e2' };

// 0 = no tier yet, 1..4 = copper..platinum. Unknown category → 0, so a caller
// passing a bucket that has no ladder (enemyDeaths, objectsSeen) is a silent
// no-op rather than a crash.
function bestiaryTierFor(category, count){
  const ladder = BESTIARY_TIER_THRESHOLDS[category];
  if (!ladder) return 0;
  const n = count || 0;
  let tier = 0;
  for (let i = 0; i < ladder.length; i++) if (n >= ladder[i]) tier = i + 1;
  return tier;
}

// display helpers shared by the bestiary panel (ui/bestiary.js)
function bestiaryTierName(tier){ return tier > 0 ? BESTIARY_TIER_NAMES[tier - 1] : null; }
function bestiaryTierLabel(tier){
  const n = bestiaryTierName(tier);
  return n ? (n.charAt(0).toUpperCase() + n.slice(1) + ' tier') : '';
}

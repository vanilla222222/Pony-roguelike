'use strict';
// achievements/defs-4.js — split from achievements.js (part 4/6).

/* ==== SLAYER — C-branch Rainforest floors 7C / 8C (expand-everything) ====
   66 enemies (33 on each of 7C and 8C), one THREE-RUNG ladder apiece,
   same shape as the 5C/6C Sewers batch above: addTierSet mints
   'slayer_<id>_t1/_t2/_t3', thresholds 5 / 20 / 50, predicate B
   (enemyKills/<id>). ALL THREE rungs carry a reward: t3 is the
   slayertrophy_<id> passive (see data.js), while t1 and t2 each hand
   out one previously-unclaimed locked pill colour / bestiary enemy /
   trinket / item / familiar. A given enemy's t1 and t2 always use two
   DIFFERENT reward types.
   ---------------------------------------------------------------------- */

/* ---- C-branch DEEP RAINFOREST Slayer ladders (floors 9C + 10C) ----
   The final enemy-Slayer batch for the C branch: 66 enemies (33 per floor),
   same shape as the 3C/4C, 5C/6C and 7C/8C ladders above — 5/20/50 kills.
   ALL THREE rungs carry a reward: t3 is the slayertrophy_<id> passive (see
   data.js), while t1 and t2 each hand out one previously-unclaimed locked
   pill colour / bestiary enemy / trinket / item / familiar. A given enemy's
   t1 and t2 always use two DIFFERENT reward types. This batch drains the
   five shared pools: after it, 1 trinket, 1 item and 1 familiar remain. */

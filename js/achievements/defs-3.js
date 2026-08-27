'use strict';
// achievements/defs-3.js — split from achievements.js (part 3/6).


/* ==== SLAYER — C-branch Gutters floors 3C / 4C (expand-everything) ====
   66 enemies (33 on each of 3C and 4C), one THREE-RUNG ladder apiece,
   declared with Slice 1's addTierSet: ids mint as 'slayer_<id>_t1/_t2/_t3'
   and names auto-suffix ' I'/' II'/' III'. Predicate B (enemyKills/<id>).
   Thresholds 5 / 20 / 50 — rung 2 is the flat 20 every pre-existing
   single-shot Slayer entry uses, so a player who already grinds one of
   these to the old bar lands exactly on the middle rung.
   ALL THREE rungs now carry a reward. The top rung keeps its
   slayertrophy_<id> passive (see data.js); rungs 1 and 2 were back-filled
   from the five freshly-authored unclaimed pools — locked pill colors,
   locked enemies (bestiary unlocks), pendingReward trinkets, and the newest
   locked items / familiars. A given enemy's t1 and t2 always draw from two
   DIFFERENT pools, and no reward id is granted by more than one
   achievement anywhere in this file.
   ---------------------------------------------------------------------- */

/* ==== SLAYER — C-branch Sewers floors 5C / 6C (expand-everything) ====
   66 enemies (33 on each of 5C and 6C), one THREE-RUNG ladder apiece,
   same shape as the 3C/4C Gutters batch above: addTierSet mints
   'slayer_<id>_t1/_t2/_t3', thresholds 5 / 20 / 50, predicate B
   (enemyKills/<id>). ALL THREE rungs carry a reward. The top rung keeps
   its slayertrophy_<id> passive (see data.js); rungs 1 and 2 were
   back-filled from the same five unclaimed pools the Gutters batch drew
   from, continuing from where that batch stopped rather than restarting
   each pool — locked pill colors, locked enemies (bestiary unlocks),
   pendingReward trinkets, and the newest locked items / familiars.
   A given enemy's t1 and t2 always draw from two DIFFERENT pools, and no
   reward id is granted by more than one achievement anywhere in this file.
   ---------------------------------------------------------------------- */

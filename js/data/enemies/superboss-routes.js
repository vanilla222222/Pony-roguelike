'use strict';
// data/enemies/superboss-routes.js — which route each SUPERBOSSES entry
// belongs to, for the class-select screen's per-character "superbosses
// beaten" indicator (js/ui/ui.js's buildClassSelect). Not derivable from the
// SUPERBOSSES data itself (no field for it — a superboss is matched to a
// floorNum by a hardcoded dispatch in game.js's descend(), not by data), so
// it's centralized here instead of duplicated per content file. Loaded after
// every file that defines a SUPERBOSSES entry (superbosses.js, then the
// three Phase 10 stageN-M-superbosses.js files) — see index.html.
//
// Three routes, matching game.js's `floorPath` values plus the label the
// user asked for: 'main' covers floorPath === null, i.e. everything on the
// original linear route AND its internal 9A/9B..12A/12B branch-within-a-
// branch (Tyrone's fork) — those two sides are mutually exclusive within one
// run but both still belong to the main route, hence one combined "A/B"
// bucket rather than two.
const SUPERBOSS_ROUTE = {
  // ---- Main route (labelled "A/B") — 23 ----
  polish:'main', tyrone:'main', pineapple:'main', israel:'main', algae:'main', lilac:'main',
  plapper:'main', clapper:'main', nhm:'main', vanilladnb:'main', onetruednb:'main',
  wobbler:'main', subdrop:'main',
  iceagent:'main', mexico:'main', g5:'main', japan:'main', deannb:'main', israelprimeprime:'main',
  palestine:'main', warden:'main', notch:'main', kirkinator:'main',
  // ---- C-branch — 6 ----
  drenched:'C', brazil:'C', israelprime:'C', kirk:'C', monsoon:'C', mangrove:'C',
  // ---- D-branch — 3 ----
  astrolabe:'D', orrery:'D', singularity:'D',
};
const SUPERBOSS_ROUTE_ORDER = ['main', 'C', 'D'];
const SUPERBOSS_ROUTE_LABELS = { main:'A/B', C:'C', D:'D' };

// The order a player actually ENCOUNTERS each route's superbosses in a run —
// i.e. ascending floorNum, per game.js's descend() dispatch (the source of
// truth; there's no floorNum field on SUPERBOSSES itself to sort by). NOT
// the same as SUPERBOSS_LIST's raw object-insertion order, which is wrong in
// two places: onetruednb (floorNum 14) is declared before wobbler/subdrop
// (floorNum 12/13) in superbosses.js, and kirk (floorNum 11, "12C" — moved
// to be the C-branch finale after Phase 7a) is declared before monsoon/
// mangrove (floorNum 9/10) for the same reason — both blocks were appended
// to the object literal in the order they were written, not the order they
// occur in-game. Branch-pair superbosses that share one floorNum (e.g.
// pineapple/israel both at floorNum 8) are listed branch-A-then-B, matching
// game.js's `branch === 'B' ? X : Y` ternaries throughout.
const SUPERBOSS_ROUTE_SEQUENCE = {
  main: [
    'polish', 'tyrone',                 // floorNum 5, 7
    'pineapple', 'israel',              // floorNum 8 (9A/9B)
    'algae', 'lilac',                   // floorNum 9 (10A/10B)
    'plapper', 'clapper',               // floorNum 10 (11A/11B)
    'nhm', 'vanilladnb',                // floorNum 11 (12A/12B)
    'wobbler', 'subdrop', 'onetruednb', // floorNum 12, 13, 14
    'iceagent', 'mexico', 'g5', 'japan', 'deannb', 'israelprimeprime',
    'palestine', 'warden', 'notch', 'kirkinator', // floorNum 16-34, Phase 10
  ],
  C: ['drenched', 'brazil', 'israelprime', 'monsoon', 'mangrove', 'kirk'], // floorNum 5,7,8,9,10,11
  D: ['astrolabe', 'orrery', 'singularity'], // floorNum 4, 6, 9
};

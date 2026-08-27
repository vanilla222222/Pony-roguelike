'use strict';
/* ============================================================
   roomTemplates/dnbfly-rooms.js — Phase 18. More rooms carrying the
   DNB Fly (data/enemies/flies.js's dnbfly) — the harmless, 1hp,
   neverRandom eternal-fly reskin that can ONLY ever appear somewhere
   a template hand-places it (resolveGenericEnemy filters it out of
   every random pool — see room.js). Its own entry never called for
   more than one hand-placed room; this file is exactly that: a
   handful of ordinary trash rooms across every stage (no "f" floor
   gate — it's cosmetic, not a difficulty knob) with 1-2 dnbfly
   floating among the real threats, same "e","f","dnbfly" forced-spawn
   shape every other named-enemy template placement already uses.
   Pushes onto ROOM_TEMPLATES.normal; nothing pre-existing touched.
   ============================================================ */
ROOM_TEMPLATES.normal.push(
  {"m":[[1]],"s":[
    [5,5,"e","f","dnbfly"],
    [2,2,"e","g"],[9,2,"e","g"],[2,9,"e","g"],[9,9,"e","g"],
  ]},
  {"m":[[1]],"s":[
    [3,3,"e","f","dnbfly"],[8,8,"e","f","dnbfly"],
    [5,1,"e","g"],[5,10,"e","g"],
    [1,5,"o","rock"],[10,5,"o","rock"],
  ]},
  {"m":[[1,1]],"s":[
    [10,5,"e","f","dnbfly"],
    [3,3,"e","g"],[18,3,"e","g"],[3,8,"e","g"],[18,8,"e","g"],[10,2,"e","g"],
  ],"d":"EW"},
  {"m":[[1],[1]],"s":[
    [5,9,"e","f","dnbfly"],[6,12,"e","f","dnbfly"],
    [2,2,"e","g"],[9,2,"e","g"],[5,17,"e","g"],[6,17,"e","g"],
    [2,9,"o","rock"],[9,16,"o","rock"],
  ],"d":"NS"},
  {"m":[[1,1],[1,1]],"s":[
    [10,10,"e","f","dnbfly"],[8,7,"e","f","dnbfly"],[13,13,"e","f","dnbfly"],
    [3,3,"e","g"],[18,3,"e","g"],[3,18,"e","g"],[18,18,"e","g"],[10,3,"e","g"],[3,10,"e","g"],
  ]},
  {"m":[[1]],"s":[
    [6,4,"e","f","dnbfly"],
    [2,2,"o","yellowfire"],[9,9,"o","yellowfire"],
    [4,7,"e","g"],[7,3,"e","g"],
  ]},
);

'use strict';
/* ============================================================
   roomTemplates/miniboss.js — Phase 15. 'miniboss' is a 25%-per-floor
   optional room (see systems/dungeon.js's generateDungeon, the same
   coin-flip shape as petshop/challenge) that holds a single tough
   Miniboss (entities.js) — see systems/room.js's populateRoom for what
   spawns inside, and combat-2.js's handleEnemyDeath for its drop table
   (25% lucky penny / 25% chest / 25% item / 25% star).

   A 2x2-block mask, same rough scale as a real 'boss' room
   (room.js's chooseShapeForNode picks 2-4 blocks for 'boss' — this
   pool provides its own fixed mask instead of falling through to that
   function, since attachSpecial always prefers a non-empty template
   pool's own mask over chooseShapeForNode) — a miniboss fight needs
   real space to dodge in, same as a full boss does, not the 1x1 box a
   plain reward/interactive room like petshop/floorfeature gets away with.
   ============================================================ */
ROOM_TEMPLATES.miniboss = [
  {"m":[[1,1],[1,1]]},
];

'use strict';
/* ============================================================
   roomTemplates/floorfeature.js — Phase 10 engine scaffolding.

   'floorfeature' is the room type that will host each new stage's own
   guaranteed interactive object (see dungeon.js's generateDungeon, which
   attaches exactly one on every floor past stages.js's
   OLD_MAIN_ROUTE_FINAL_FLOOR and never on any floor at or below it).

   This pool deliberately holds ONE plain, empty 1x1 layout and nothing
   else. It exists so the room type has a non-empty template pool — an
   empty pool would drop attachSpecial onto its blank-procedural fallback —
   NOT because this is designed content. The real per-stage flavours (one
   object kind per stage, keyed off the floor) land in a later content
   phase, and should be pushed onto this same array in the usual
   ROOM_TEMPLATES.floorfeature.push({...}) room-editor export form.
   ============================================================ */
ROOM_TEMPLATES.floorfeature = [
  {"m":[[1]]},
];

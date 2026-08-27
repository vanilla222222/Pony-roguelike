'use strict';
/* ============================================================
   roomTemplates/stage4-6-floorfeature.js — CONTENT GROUP 1 feature rooms.

   ONE feature room per FLOOR (six total), each built around its stage's
   own interactive object:
     floorNum 15  Frozen Desert  "Slide Hall"    — ice slide corridor
     floorNum 16  Frozen Desert  "The Pinwheel"  — 4-facing slide ring
     floorNum 17  Badlands       "Sink Basin"    — quicksand basin
     floorNum 18  Badlands       "Vent Field"    — dust vents + sink pits
     floorNum 19  Beach          "Rip Channel"   — opposed tide surges
     floorNum 20  Beach          "Tide Flats"    — surge wall + tide pools

   The object kinds themselves (iceslidan/s/e/w, quicksand, dustvent,
   tidesurgee/w, tidepool) are declared in data/collectibles.js's
   OBSTACLES, next to the C-branch `current` tiles they are modelled on;
   the long comment there explains which existing mechanism each one
   reuses. This file is their ONLY consumer, which is also their only
   gate: dungeon.js's obstacleAllowedOnFloor has no case for them and
   defaults to `true`, so the `f:[...]` filter below is what keeps a
   Frozen Desert ice slide out of the Beach.

   REGISTRATION. roomTemplates/floorfeature.js assigns
   `ROOM_TEMPLATES.floorfeature = [...]`; this file PUSHES onto that same
   array, which is both the room-editor export form and the form that
   file's own header asks later phases to use. index.html loads it after
   floorfeature.js (itself after core.js, where ROOM_TEMPLATES lives).

   FLOOR GATING. `f` is floorNums, NOT HUD floor numbers — dungeon.js's
   templateAllowsFloor does `if (tmpl.f && !tmpl.f.includes(floorNum))
   return false`. Each template names exactly one floor, so the two
   floors of a stage get visibly different rooms rather than a coin flip
   between the same two. The base pool's untagged 1x1 template has no `f`
   and stays eligible everywhere, so the pool can never empty.

   `s` entries are [tileX, tileY, 'o'|'e', kind] in a 1x1 room's 12x12
   grid — usable interior is 1..10 on both axes (BLOCK = 10 plus the
   wall ring). 'e','g' is a generic enemy spawn, resolved per-floor by
   room.js's resolveGenericEnemy against the stage pool.
   ============================================================ */
ROOM_TEMPLATES.floorfeature.push(
  /* floorNum 15 — Frozen Desert, "Slide Hall". A two-tile-wide eastbound
     slide runs the width of the room with rock bumpers at both ends and a
     pit just off each lip, so being carried is survivable but being
     carried while fighting is not. Enemies spawn in all four corners,
     i.e. off the slide, so they get to pick their moment. */
  {"m":[[1]],"s":[[2,5,"o","iceslidae"],[2,6,"o","iceslidae"],[3,5,"o","iceslidae"],[3,6,"o","iceslidae"],[4,5,"o","iceslidae"],[4,6,"o","iceslidae"],[5,5,"o","iceslidae"],[5,6,"o","iceslidae"],[6,5,"o","iceslidae"],[6,6,"o","iceslidae"],[7,5,"o","iceslidae"],[7,6,"o","iceslidae"],[8,5,"o","iceslidae"],[8,6,"o","iceslidae"],[9,5,"o","iceslidae"],[9,6,"o","iceslidae"],[10,4,"o","rock"],[10,7,"o","rock"],[1,4,"o","rock"],[1,7,"o","rock"],[5,3,"o","pit"],[6,8,"o","pit"],[2,2,"e","g"],[9,2,"e","g"],[2,9,"e","g"],[9,9,"e","g"]],"f":[15]},

  /* floorNum 16 — Frozen Desert, "The Pinwheel". All four slide facings
     laid as a clockwise ring around a rock-and-pit island: step onto the
     ring anywhere and it carries you around the loop, and the only way
     off is through the middle, where the pits are. This is the room the
     four directional variants exist for. */
  {"m":[[1]],"s":[[3,3,"o","iceslidae"],[4,3,"o","iceslidae"],[5,3,"o","iceslidae"],[6,3,"o","iceslidae"],[7,3,"o","iceslidae"],[8,3,"o","iceslidae"],[8,4,"o","iceslidas"],[8,5,"o","iceslidas"],[8,6,"o","iceslidas"],[8,7,"o","iceslidas"],[8,8,"o","iceslidas"],[3,8,"o","iceslidaw"],[4,8,"o","iceslidaw"],[5,8,"o","iceslidaw"],[6,8,"o","iceslidaw"],[7,8,"o","iceslidaw"],[3,4,"o","iceslidan"],[3,5,"o","iceslidan"],[3,6,"o","iceslidan"],[3,7,"o","iceslidan"],[5,5,"o","pit"],[6,6,"o","pit"],[6,5,"o","rock"],[5,6,"o","rock"],[1,1,"e","g"],[10,1,"e","g"],[1,10,"e","g"],[10,10,"e","g"]],"f":[16]},

  /* floorNum 17 — Badlands, "Sink Basin". A twelve-tile quicksand basin
     shaped as a rounded bowl fills the middle of the room, ringed by
     rocks. Nothing here damages you; the basin just takes your movement
     away in half-second bites, which is a problem because the stage's
     ranged roster is built to punish exactly that. */
  {"m":[[1]],"s":[[5,4,"o","quicksand"],[6,4,"o","quicksand"],[4,5,"o","quicksand"],[5,5,"o","quicksand"],[6,5,"o","quicksand"],[7,5,"o","quicksand"],[4,6,"o","quicksand"],[5,6,"o","quicksand"],[6,6,"o","quicksand"],[7,6,"o","quicksand"],[5,7,"o","quicksand"],[6,7,"o","quicksand"],[3,3,"o","rock"],[8,3,"o","rock"],[3,8,"o","rock"],[8,8,"o","rock"],[1,5,"o","rock"],[2,2,"e","g"],[9,9,"e","g"],[9,2,"e","g"],[2,9,"e","g"]],"f":[17]},

  /* floorNum 18 — Badlands, "Vent Field". Four dust vents on the
     diagonals of the room, each spitting grit along all four diagonals of
     its own — so the crossfire covers the corners and the safest lane is
     straight through the small quicksand patch in the centre. Enemies
     spawn on the cardinal edges, inside the crossfire. */
  {"m":[[1]],"s":[[3,3,"o","dustvent"],[8,3,"o","dustvent"],[3,8,"o","dustvent"],[8,8,"o","dustvent"],[5,5,"o","quicksand"],[6,5,"o","quicksand"],[5,6,"o","quicksand"],[6,6,"o","quicksand"],[1,1,"o","rock"],[10,1,"o","rock"],[1,10,"o","rock"],[10,10,"o","rock"],[5,1,"e","g"],[6,10,"e","g"],[1,6,"e","g"],[10,5,"e","g"]],"f":[18]},

  /* floorNum 19 — Beach, "Rip Channel". Two full-width rip channels
     running in OPPOSITE directions with a still band between them: cross
     north-to-south and the surges hand you off, each one dragging you the
     length of the room before you can plant your feet. The two rocks in
     the still band are the only reliable anchor. */
  {"m":[[1]],"s":[[1,3,"o","tidesurgee"],[1,4,"o","tidesurgee"],[1,7,"o","tidesurgew"],[1,8,"o","tidesurgew"],[2,3,"o","tidesurgee"],[2,4,"o","tidesurgee"],[2,7,"o","tidesurgew"],[2,8,"o","tidesurgew"],[3,3,"o","tidesurgee"],[3,4,"o","tidesurgee"],[3,7,"o","tidesurgew"],[3,8,"o","tidesurgew"],[4,3,"o","tidesurgee"],[4,4,"o","tidesurgee"],[4,7,"o","tidesurgew"],[4,8,"o","tidesurgew"],[5,3,"o","tidesurgee"],[5,4,"o","tidesurgee"],[5,7,"o","tidesurgew"],[5,8,"o","tidesurgew"],[6,3,"o","tidesurgee"],[6,4,"o","tidesurgee"],[6,7,"o","tidesurgew"],[6,8,"o","tidesurgew"],[7,3,"o","tidesurgee"],[7,4,"o","tidesurgee"],[7,7,"o","tidesurgew"],[7,8,"o","tidesurgew"],[8,3,"o","tidesurgee"],[8,4,"o","tidesurgee"],[8,7,"o","tidesurgew"],[8,8,"o","tidesurgew"],[9,3,"o","tidesurgee"],[9,4,"o","tidesurgee"],[9,7,"o","tidesurgew"],[9,8,"o","tidesurgew"],[10,3,"o","tidesurgee"],[10,4,"o","tidesurgee"],[10,7,"o","tidesurgew"],[10,8,"o","tidesurgew"],[5,5,"o","rock"],[6,6,"o","rock"],[3,10,"o","tidepool"],[8,1,"o","tidepool"],[2,1,"e","g"],[9,10,"e","g"],[5,10,"e","g"],[6,1,"e","g"]],"f":[19]},

  /* floorNum 20 — Beach, "Tide Flats", and the last feature room of the
     group. A two-tile surge wall splits the room down the middle and
     pushes OUTWARD from the seam in both directions, so crossing it costs
     real ground in whichever half you started; ten tide pools are
     scattered over both halves to punish the sprint you have to make.
     A rock caps each end of the wall so it can't be walked around. */
  {"m":[[1]],"s":[[2,2,"o","tidepool"],[4,3,"o","tidepool"],[8,2,"o","tidepool"],[9,4,"o","tidepool"],[3,7,"o","tidepool"],[7,8,"o","tidepool"],[9,8,"o","tidepool"],[2,9,"o","tidepool"],[4,10,"o","tidepool"],[8,10,"o","tidepool"],[5,2,"o","tidesurgew"],[6,2,"o","tidesurgee"],[5,3,"o","tidesurgew"],[6,3,"o","tidesurgee"],[5,4,"o","tidesurgew"],[6,4,"o","tidesurgee"],[5,5,"o","tidesurgew"],[6,5,"o","tidesurgee"],[5,6,"o","tidesurgew"],[6,6,"o","tidesurgee"],[5,7,"o","tidesurgew"],[6,7,"o","tidesurgee"],[5,8,"o","tidesurgew"],[6,8,"o","tidesurgee"],[5,9,"o","tidesurgew"],[6,9,"o","tidesurgee"],[5,1,"o","rock"],[6,10,"o","rock"],[1,1,"e","g"],[10,10,"e","g"],[10,1,"e","g"],[1,10,"e","g"],[8,5,"e","g"]],"f":[20]},
);

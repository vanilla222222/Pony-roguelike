'use strict';
/* ============================================================
   roomTemplates/stage7-9-floorfeature.js — CONTENT GROUP 2 feature rooms.

   ONE feature room per FLOOR (six total), each built around its stage's
   own interactive object:
     floorNum 21  Ocean          "Crosscurrent Shelf" — opposed riptide lanes
     floorNum 22  Ocean          "The Gyre"           — 4-facing riptide ring
     floorNum 23  The Sea Floor  "Bloom Field"        — staggered glow blooms
     floorNum 24  The Sea Floor  "The Lantern Walk"   — bloom-walled corridor
     floorNum 25  Trench         "The Squeeze"        — column pinch chamber
     floorNum 26  Trench         "Collapse Chamber"   — column ring + vent core

   The object kinds (riptiden/s/e/w, glowbloom, pressurecolumn) are
   declared in data/collectibles.js's OBSTACLES in one contiguous
   "CONTENT GROUP 2" block, immediately after Group 1's; the comment
   there explains which existing mechanism each reuses and why the
   Ocean could not simply reuse the C-branch `current` tiles.

   REGISTRATION. roomTemplates/floorfeature.js assigns
   `ROOM_TEMPLATES.floorfeature = [...]`; this file PUSHES onto that same
   array (the room-editor export form, and what that file's own header
   asks later phases to use). index.html loads it after floorfeature.js.

   FLOOR GATING. `f` holds floorNums, NOT HUD floor numbers —
   dungeon.js's templateAllowsFloor does
   `if (tmpl.f && !tmpl.f.includes(floorNum)) return false`. Each
   template names exactly one floor, so the two floors of a stage get
   visibly different rooms instead of a coin flip between the same two.
   The base pool's untagged 1x1 template carries no `f` and stays
   eligible everywhere, so the pool can never empty — which matters,
   because generateDungeon attaches a floorfeature room to EVERY floor
   past OLD_MAIN_ROUTE_FINAL_FLOOR.

   `s` entries are [tileX, tileY, kindLetter, ...] in a 1x1 room's 12x12
   grid — usable interior is 1..10 on both axes (BLOCK = 10 plus the
   wall ring). ['e','g'] is a generic enemy resolved per-floor from the
   stage pool; ['e','f','<id>'] forces a specific ENEMY_TYPES key;
   ['p','g'] is a random pickup.
   ============================================================ */
ROOM_TEMPLATES.floorfeature.push(

  /* floorNum 21 — Ocean, "Crosscurrent Shelf". Two two-tile riptide lanes
     run the width of the room in OPPOSITE directions, with a bare rock
     shelf between them. The lanes are the strongest push in the game, so
     crossing the room costs you ground in whichever direction you last
     touched water; the shelf in the middle is the only place a fight can
     actually be held still. Enemies spawn in the four corners, i.e. off
     the water, so they choose when to enter it. */
  {"m":[[1]],"s":[[2,3,"o","riptidee"],[3,3,"o","riptidee"],[4,3,"o","riptidee"],[5,3,"o","riptidee"],[6,3,"o","riptidee"],[7,3,"o","riptidee"],[8,3,"o","riptidee"],[9,3,"o","riptidee"],[2,4,"o","riptidee"],[3,4,"o","riptidee"],[4,4,"o","riptidee"],[5,4,"o","riptidee"],[6,4,"o","riptidee"],[7,4,"o","riptidee"],[8,4,"o","riptidee"],[9,4,"o","riptidee"],[2,7,"o","riptidew"],[3,7,"o","riptidew"],[4,7,"o","riptidew"],[5,7,"o","riptidew"],[6,7,"o","riptidew"],[7,7,"o","riptidew"],[8,7,"o","riptidew"],[9,7,"o","riptidew"],[2,8,"o","riptidew"],[3,8,"o","riptidew"],[4,8,"o","riptidew"],[5,8,"o","riptidew"],[6,8,"o","riptidew"],[7,8,"o","riptidew"],[8,8,"o","riptidew"],[9,8,"o","riptidew"],[5,5,"o","rock"],[6,5,"o","rock"],[5,6,"o","rock"],[6,6,"o","rock"],[1,1,"e","g"],[10,1,"e","g"],[1,10,"e","g"],[10,10,"e","g"]],"f":[21]},

  /* floorNum 22 — Ocean, "The Gyre". All four riptide facings laid as a
     clockwise square ring: step onto it anywhere and it carries you
     around the loop. This is the room the four directional variants
     exist for, and the eye of it is occupied — a forced Spouter sits
     dead centre, anchored, rotating its cross of water while you are
     being carried past it. The generic spawns are outside the ring. */
  {"m":[[1]],"s":[[3,3,"o","riptidee"],[4,3,"o","riptidee"],[5,3,"o","riptidee"],[6,3,"o","riptidee"],[7,3,"o","riptidee"],[8,3,"o","riptidee"],[8,4,"o","riptides"],[8,5,"o","riptides"],[8,6,"o","riptides"],[8,7,"o","riptides"],[8,8,"o","riptides"],[3,8,"o","riptidew"],[4,8,"o","riptidew"],[5,8,"o","riptidew"],[6,8,"o","riptidew"],[7,8,"o","riptidew"],[3,4,"o","riptiden"],[3,5,"o","riptiden"],[3,6,"o","riptiden"],[3,7,"o","riptiden"],[5,5,"e","f","spouter"],[1,1,"e","g"],[10,1,"e","g"],[1,10,"e","g"],[10,10,"e","g"]],"f":[22]},

  /* floorNum 23 — The Sea Floor, "Bloom Field". Sixteen glow blooms in a
     staggered lattice: every row is offset half a step from the one
     above, so there is no straight line across the room and no way to
     shoot the field open — blooms ignore attacks entirely and only a
     bomb clears a patch. Non-solid, so you CAN just walk through and eat
     the burn, which is usually the wrong call and always available. The
     pickup on the far wall is the bait. */
  {"m":[[1]],"s":[[2,2,"o","glowbloom"],[4,2,"o","glowbloom"],[6,2,"o","glowbloom"],[8,2,"o","glowbloom"],[3,4,"o","glowbloom"],[5,4,"o","glowbloom"],[7,4,"o","glowbloom"],[9,4,"o","glowbloom"],[2,6,"o","glowbloom"],[4,6,"o","glowbloom"],[6,6,"o","glowbloom"],[8,6,"o","glowbloom"],[3,8,"o","glowbloom"],[5,8,"o","glowbloom"],[7,8,"o","glowbloom"],[9,8,"o","glowbloom"],[10,5,"p","g"],[1,1,"e","g"],[10,1,"e","g"],[1,10,"e","g"],[10,10,"e","g"]],"f":[23]},

  /* floorNum 24 — The Sea Floor, "The Lantern Walk". Two bloom walls
     offset against each other cut the room into a serpentine: the only
     clean route in is the eastern gap, the only clean route out is the
     western one, and the pickup sits in the middle of the corridor
     between them. A forced Vent Worm is anchored in the corner sweeping
     its jet across the whole walk, so the corridor is timed as well as
     narrow. */
  {"m":[[1]],"s":[[1,4,"o","glowbloom"],[2,4,"o","glowbloom"],[3,4,"o","glowbloom"],[4,4,"o","glowbloom"],[5,4,"o","glowbloom"],[6,4,"o","glowbloom"],[7,4,"o","glowbloom"],[8,4,"o","glowbloom"],[3,7,"o","glowbloom"],[4,7,"o","glowbloom"],[5,7,"o","glowbloom"],[6,7,"o","glowbloom"],[7,7,"o","glowbloom"],[8,7,"o","glowbloom"],[9,7,"o","glowbloom"],[10,7,"o","glowbloom"],[5,5,"p","g"],[1,1,"e","f","ventworm"],[10,10,"e","g"],[9,1,"e","g"],[2,10,"e","g"]],"f":[24]},

  /* floorNum 25 — Trench, "The Squeeze". Two column walls pinch the room
     into a central chamber with four one-tile-wide doorways and two more
     columns planted inside it, so there is barely a straight line left
     anywhere. Pressure columns are solid AND hazardous: every wall of
     this room is also a damage source, which means the usual "hug the
     geometry to dodge" answer costs half a heart every time. */
  {"m":[[1]],"s":[[4,1,"o","pressurecolumn"],[4,2,"o","pressurecolumn"],[4,3,"o","pressurecolumn"],[4,8,"o","pressurecolumn"],[4,9,"o","pressurecolumn"],[4,10,"o","pressurecolumn"],[7,1,"o","pressurecolumn"],[7,2,"o","pressurecolumn"],[7,3,"o","pressurecolumn"],[7,8,"o","pressurecolumn"],[7,9,"o","pressurecolumn"],[7,10,"o","pressurecolumn"],[5,5,"o","pressurecolumn"],[6,6,"o","pressurecolumn"],[2,5,"e","g"],[9,5,"e","g"],[5,2,"e","g"],[6,9,"e","g"]],"f":[25]},

  /* floorNum 26 — Trench, "Collapse Chamber". A column ring with a
     one-tile gap on each side, and a forced Black Smoker anchored in the
     dead centre of it. The smoker's eruption is a donut — the ring of
     tiles AROUND it goes off, not the tile it stands on — so the safest
     square in the room is pressed right against the thing generating the
     danger, inside a ring you cannot leave quickly. The last feature
     room before the Trench Depths, and the most deliberately unpleasant
     of the six. */
  {"m":[[1]],"s":[[2,3,"o","pressurecolumn"],[3,3,"o","pressurecolumn"],[4,3,"o","pressurecolumn"],[7,3,"o","pressurecolumn"],[8,3,"o","pressurecolumn"],[9,3,"o","pressurecolumn"],[2,8,"o","pressurecolumn"],[3,8,"o","pressurecolumn"],[4,8,"o","pressurecolumn"],[7,8,"o","pressurecolumn"],[8,8,"o","pressurecolumn"],[9,8,"o","pressurecolumn"],[2,4,"o","pressurecolumn"],[2,7,"o","pressurecolumn"],[9,4,"o","pressurecolumn"],[9,7,"o","pressurecolumn"],[5,5,"e","f","blacksmoker"],[6,6,"e","g"],[3,5,"e","g"],[8,6,"e","g"]],"f":[26]},
);

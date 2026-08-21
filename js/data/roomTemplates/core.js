'use strict';
'use strict';
/* ============================================================
   roomTemplates.js — hand-authored room layouts.

   NOTE: this is the compact v2 format. Rooms made with the old
   (verbose object) editor will NOT load anymore — re-export them
   from room-editor.html.

   Build rooms with room-editor.html, then paste each exported line
   straight in below (or anywhere in this file) — the exported line
   is a ready-to-run statement, e.g.:
     ROOM_TEMPLATES.normal.push({"m":[[1,1],[1,0]],"s":[[5,5,"e","g"]]});

   When a room slot of a given type is generated in-game, it picks a
   random entry from that type's array here (filtered by the room's
   floor, see "f" below). If the array is empty (or nothing matches
   that floor), room.js falls back to the old procedural generator
   so the game stays playable while you're still building your set.

   Compact template shape:
   {
     m: [[1,1],[1,0]],   // required — polyomino block mask, 1-4 blocks,
                          // same format as ROOM_SHAPES in data.js

     s: [ ... ],          // optional — spawners, each a short array:
       // generic  (resolved randomly at runtime):
       //   [x, y, "e", "g"]   random enemy for the room's floor
       //   [x, y, "e", "b"]   random BOSS for the room's floor
       //   [x, y, "p", "g"]   random pickup
       //   [x, y, "i", "g"]   random item (pedestal, free — drawn from the
       //                      'secret'/'curse'/'challenge'/'crystal'/'sombra'/
       //                      'treasure' pool, picked by the room's own type;
       //                      see room.js's instantiateSpawner)
       //   [x, y, "d", "g"]   random DEAL (pedestal, costs 1 heart — always
       //                      drawn from the 'sombra' pool regardless of the
       //                      room's own type; see room.js's addDealPedestal)
       //   [x, y, "s", "g"]   random shop offer (priced)
       // forced (always the exact thing):
       //   [x, y, "e", "f", "grub"]        ENEMY_TYPES / BOSS_TYPES key
       //   [x, y, "p", "f", "coin:dime"]   "coin:<penny|nickel|dime|luckypenny>",
       //                                   "key", "bomb", "heartRed", "heartBlue", "heartContainer",
       //                                   "chest:<grey|gold|stone|cursed>", "pill" (random color,
       //                                   never a specific one), "star" (random named star, ditto)
       //   [x, y, "i", "f", "ironshoes"]   ITEMS key
       //   [x, y, "d", "f", "ironshoes"]   ITEMS key — still costs 1 heart, forced or not
       //   [x, y, "s", "f", "moonshard"]   ITEMS key or a pickup kind
       //   [x, y, "o", "rock"]             obstacle — always forced, no g/f letter:
       //                                   "rock" | "hardrock" | "pit" | "tallrock" |
       //                                   "tallhardrock" | "cactus" | "yellowfire" | "redfire" |
       //                                   "bluefire" | "purplefire" |
       //                                   "spike" (sacrifice rooms only — see combat.js) |
       //                                   "spiketrap" | "spikedrock" | "tintedrock" | "movingspike" |
       //                                   "sandtrap" | "mud" |
       //                                   "turretn" | "turrete" | "turrets" | "turretw" |
       //                                   "turretplus" | "turretx" | "turrettarget" |
       //                                   "bombbarrel" | "pushablebombbarrel"
       //                                   ("rock" also has a hidden 2% chance to actually
       //                                   come out as "tintedrock" instead — see room.js's
       //                                   rollRockKind())

     f: [0, 2, 4],        // optional — allowed floor indices (0-based, floor 1 = 0).
                          // omitted = any floor.

     d: "NW",             // optional — disabled door sides. Two formats:
                          //   string, e.g. "NW"        legacy: disables that
                          //     direction on EVERY block of the room's mask
                          //   array, e.g. [[0,0,"NW"]]  per-block: disables
                          //     just [col, row]'s N and W sides. This is what
                          //     the editor exports now — see below.
   }

   Coordinates are tile indices into the room's own tile grid, exactly
   as shown in the editor (0 is the outer wall ring, floor starts at
   1). Doors are per-BLOCK, not per-room: every 10x10 block in the
   mask can have a door on each side that isn't shared with another
   block of the same room (a side facing another block of the SAME
   room is an interior opening, never a door). Doors are still wired
   up automatically at runtime based on which rooms end up touching —
   you can't force a door to exist by hand, only disable one with "d".
   The editor draws a small clickable marker on every door-eligible
   block edge; click one to toggle it on/off.
   ============================================================ */

const ROOM_TEMPLATES = {
  start: [
    {"m":[[1]]},
    {"m":[[1]],"s":[[1,1,"o","yellowfire"],[1,10,"o","yellowfire"],[10,10,"o","yellowfire"],[10,1,"o","yellowfire"]]},
    {"m":[[1]],"s":[[10,1,"o","rock"],[10,10,"o","rock"],[1,9,"o","rock"],[2,10,"o","rock"],[3,10,"o","rock"],[1,2,"o","rock"],[2,2,"o","rock"],[3,1,"o","rock"],[9,2,"o","rock"],[10,9,"o","rock"],[9,9,"o","rock"],[9,10,"o","rock"],[8,10,"o","rock"],[10,8,"o","rock"]]},
    {"m":[[1]],"s":[[1,1,"p","g"],[2,1,"o","tallrock"],[2,2,"o","tallrock"],[1,2,"o","tallrock"]]},
  ],
  normal: [],
  boss: [
    {"m":[[1,1]],"s":[[11,5,"e","b"],[2,2,"o","yellowfire"],[2,9,"o","yellowfire"],[19,9,"o","yellowfire"],[19,2,"o","yellowfire"]],"d":"NS"},
    {"m":[[1,1]],"s":[[11,5,"e","b"],[2,2,"o","redfire"],[2,9,"o","redfire"],[19,9,"o","redfire"],[19,2,"o","redfire"]],"d":"NS"},
    {"m":[[1,1]],"s":[[11,5,"e","b"]],"d":"NS"},
    {"m":[[1],[1]],"s":[[5,10,"e","b"]],"d":"EW"},
    {"m":[[1],[1]],"s":[[5,10,"e","b"],[2,2,"o","yellowfire"],[2,19,"o","yellowfire"],[9,19,"o","yellowfire"],[9,2,"o","yellowfire"]],"d":"EW"},
    {"m":[[1],[1]],"s":[[5,10,"e","b"],[2,2,"o","redfire"],[2,19,"o","redfire"],[9,19,"o","redfire"],[9,2,"o","redfire"]],"d":"EW"},
    {"m":[[1,1],[1,1]],"s":[[10,11,"e","b"]]},
    // floor 13 — The One True DNB. Same 4-block mask and same [10,11] spawner
    // coordinate as the entry above (room.js drops opts.bossType there); the
    // obstacles are a perimeter frame only, so the 20x20 middle stays clear for
    // the 3-arm sweep, the clap rings and up to 5 minions.
    {"m":[[1,1],[1,1]],"s":[[10,11,"e","b"],[2,2,"o","tallhardrock"],[3,2,"o","tallhardrock"],[2,3,"o","tallhardrock"],[19,2,"o","tallhardrock"],[18,2,"o","tallhardrock"],[19,3,"o","tallhardrock"],[2,19,"o","tallhardrock"],[3,19,"o","tallhardrock"],[2,18,"o","tallhardrock"],[19,19,"o","tallhardrock"],[18,19,"o","tallhardrock"],[19,18,"o","tallhardrock"],[8,1,"o","turrets"],[20,8,"o","turretw"],[13,20,"o","turretn"],[1,13,"o","turrete"]],"f":[12]},
  ],
  treasure: [
    {"m":[[1],[1]],"s":[[5,10,"i","g"]],"d":"EW"},
    {"m":[[1,1]],"s":[[10,5,"i","g"]],"d":"NS"},
    {"m":[[1]],"s":[[5,6,"i","g"],[2,2,"o","spiketrap"],[9,2,"o","spiketrap"],[9,9,"o","spiketrap"],[2,9,"o","spiketrap"]]},
    {"m":[[1,1]],"s":[[15,5,"i","g"],[14,4,"o","bombbarrel"],[17,4,"o","bombbarrel"],[14,7,"o","bombbarrel"],[17,7,"o","bombbarrel"]]},
    {"m":[[1]],"s":[[5,6,"i","g"]]},
    {"m":[[1],[1]],"s":[[5,5,"i","g"]]},
    {"m":[[1]],"s":[[5,6,"i","g"],[4,4,"o","bombbarrel"],[7,4,"o","bombbarrel"],[4,7,"o","bombbarrel"],[7,7,"o","bombbarrel"]]},
    {"m":[[1,1]],"s":[[15,5,"i","g"]]},
    {"m":[[1,1]],"s":[[5,5,"i","g"]]},
    {"m":[[1]],"s":[[5,6,"i","g"],[3,3,"o","tallhardrock"],[8,3,"o","tallhardrock"],[3,8,"o","tallhardrock"],[8,8,"o","tallhardrock"]]},
    {"m":[[1]],"s":[[5,6,"i","g"],[3,3,"o","spikedrock"],[8,3,"o","spikedrock"],[3,8,"o","spikedrock"],[8,8,"o","spikedrock"]]},
    {"m":[[1]],"s":[[5,6,"i","g"],[1,1,"o","spikedrock"],[10,1,"o","spikedrock"],[10,10,"o","spikedrock"],[1,10,"o","spikedrock"]]},
    {"m":[[1]],"s":[[5,6,"i","g"]]},
    {"m":[[1],[1]],"s":[[5,15,"i","g"]]},
    {"m":[[1,1]],"s":[[5,5,"i","g"],[1,1,"o","bombbarrel"],[2,1,"o","bombbarrel"],[1,2,"o","bombbarrel"],[10,1,"o","bombbarrel"],[9,1,"o","bombbarrel"],[10,2,"o","bombbarrel"],[10,10,"o","bombbarrel"],[9,10,"o","bombbarrel"],[10,9,"o","bombbarrel"],[1,10,"o","bombbarrel"],[2,10,"o","bombbarrel"],[1,9,"o","bombbarrel"]]},
    {"m":[[1,1]],"s":[[15,5,"i","g"]]},
    {"m":[[1,1]],"s":[[5,5,"i","g"],[1,1,"o","movingspike"],[2,1,"o","movingspike"],[1,2,"o","movingspike"],[10,1,"o","movingspike"],[9,1,"o","movingspike"],[10,2,"o","movingspike"],[10,10,"o","movingspike"],[9,10,"o","movingspike"],[10,9,"o","movingspike"],[1,10,"o","movingspike"],[2,10,"o","movingspike"],[1,9,"o","movingspike"]]},
    {"m":[[1],[1]],"s":[[5,5,"i","g"],[7,2,"o","tallhardrock"],[8,4,"o","tallhardrock"],[8,7,"o","tallhardrock"],[7,8,"o","tallhardrock"],[5,10,"o","tallhardrock"],[4,8,"o","tallhardrock"],[2,7,"o","tallhardrock"],[2,4,"o","tallhardrock"],[4,2,"o","tallhardrock"]]},
    {"m":[[1,1]],"s":[[5,5,"i","g"],[9,6,"o","tallhardrock"],[9,7,"o","tallhardrock"],[7,9,"o","tallhardrock"],[4,9,"o","tallhardrock"],[2,7,"o","tallhardrock"],[2,4,"o","tallhardrock"],[4,2,"o","tallhardrock"],[7,2,"o","tallhardrock"],[9,4,"o","tallhardrock"]]},
    {"m":[[1],[1]],"s":[[5,5,"i","g"]]},
    {"m":[[1,1]],"s":[[5,5,"i","g"]]},
    {"m":[[1],[1]],"s":[[5,5,"i","g"],[1,1,"o","tallhardrock"],[2,1,"o","tallhardrock"],[1,2,"o","tallhardrock"],[10,1,"o","tallhardrock"],[9,1,"o","tallhardrock"],[10,2,"o","tallhardrock"],[10,10,"o","tallhardrock"],[9,10,"o","tallhardrock"],[10,9,"o","tallhardrock"],[1,10,"o","tallhardrock"],[2,10,"o","tallhardrock"],[1,9,"o","tallhardrock"]]},
    // Phase 3 overhaul — proving grounds for the 2 new obstacles (see
    // data/collectibles.js's OBSTACLES)
    {"m":[[1]],"s":[[5,6,"i","g"],[3,3,"o","thornbush"],[8,3,"o","thornbush"],[3,8,"o","thornbush"],[8,8,"o","thornbush"]],"f":[2,3]},
    {"m":[[1]],"s":[[5,6,"i","g"],[5,5,"o","luckcrystal"],[6,6,"o","luckcrystal"]]},
  ],
  shop: [
    {"m":[[1,1]],"s":[[7,4,"s","g"],[8,3,"s","g"],[14,4,"s","g"],[13,3,"s","g"],[4,4,"o","yellowfire"],[17,4,"o","yellowfire"],[6,1,"o","yellowfire"],[15,1,"o","yellowfire"]],"d":"NS"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[3,18,"s","g"],[8,18,"s","g"],[8,3,"s","g"],[2,4,"o","yellowfire"],[2,17,"o","yellowfire"],[9,17,"o","yellowfire"],[9,4,"o","yellowfire"]],"d":"EW"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[2,1,"o","redfire"],[9,1,"o","redfire"],[3,13,"s","g"],[8,13,"s","g"],[3,18,"s","g"],[2,11,"o","bluefire"],[9,11,"o","bluefire"]],"d":"EW"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[3,13,"s","g"],[8,13,"s","g"],[3,18,"s","g"],[2,11,"o","yellowfire"],[9,11,"o","yellowfire"]],"d":"EW"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[2,1,"o","purplefire"],[9,1,"o","purplefire"],[3,13,"s","g"],[8,13,"s","g"],[2,11,"o","bluefire"],[9,11,"o","bluefire"]],"d":"EW"},
    {"m":[[1,1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[13,3,"s","g"],[18,3,"s","g"]],"d":"NS"},
    {"m":[[1,1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[2,1,"o","purplefire"],[9,1,"o","purplefire"],[13,3,"s","g"],[18,3,"s","g"],[13,8,"s","g"],[12,1,"o","yellowfire"],[19,1,"o","yellowfire"]],"d":"NS"},
    {"m":[[1,1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[2,1,"o","bluefire"],[9,1,"o","bluefire"],[13,3,"s","g"],[18,3,"s","g"]],"d":"NS"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[3,13,"s","g"],[8,13,"s","g"],[2,11,"o","redfire"],[9,11,"o","redfire"]],"d":"EW"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[2,1,"o","bluefire"],[9,1,"o","bluefire"],[3,13,"s","g"],[8,13,"s","g"],[3,18,"s","g"]],"d":"EW"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[3,8,"s","g"],[2,1,"o","purplefire"],[9,1,"o","purplefire"],[3,13,"s","g"],[8,13,"s","g"],[3,18,"s","g"]],"d":"EW"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[3,8,"s","g"],[2,1,"o","purplefire"],[9,1,"o","purplefire"],[3,13,"s","g"],[8,13,"s","g"],[3,18,"s","g"],[2,11,"o","redfire"],[9,11,"o","redfire"]],"d":"EW"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[2,1,"o","bluefire"],[9,1,"o","bluefire"],[3,13,"s","g"],[8,13,"s","g"]],"d":"EW"},
    {"m":[[1,1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[3,8,"s","g"],[13,3,"s","g"],[18,3,"s","g"],[12,1,"o","yellowfire"],[19,1,"o","yellowfire"]],"d":"NS"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[3,13,"s","g"],[8,13,"s","g"],[3,18,"s","g"],[2,11,"o","bluefire"],[9,11,"o","bluefire"]],"d":"EW"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[3,8,"s","g"],[2,1,"o","redfire"],[9,1,"o","redfire"],[3,13,"s","g"],[8,13,"s","g"],[2,11,"o","redfire"],[9,11,"o","redfire"]],"d":"EW"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[3,13,"s","g"],[8,13,"s","g"],[3,18,"s","g"],[2,11,"o","purplefire"],[9,11,"o","purplefire"]],"d":"EW"},
    {"m":[[1,1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[3,8,"s","g"],[2,1,"o","redfire"],[9,1,"o","redfire"],[13,3,"s","g"],[18,3,"s","g"],[13,8,"s","g"]],"d":"NS"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[3,8,"s","g"],[3,13,"s","g"],[8,13,"s","g"],[3,18,"s","g"]],"d":"EW"},
    {"m":[[1,1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[2,1,"o","yellowfire"],[9,1,"o","yellowfire"],[13,3,"s","g"],[18,3,"s","g"],[13,8,"s","g"],[12,1,"o","yellowfire"],[19,1,"o","yellowfire"]],"d":"NS"},
    {"m":[[1,1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[2,1,"o","yellowfire"],[9,1,"o","yellowfire"],[13,3,"s","g"],[18,3,"s","g"],[13,8,"s","g"],[12,1,"o","redfire"],[19,1,"o","redfire"]],"d":"NS"},
    {"m":[[1],[1]],"s":[[3,3,"s","g"],[8,3,"s","g"],[3,8,"s","g"],[2,1,"o","purplefire"],[9,1,"o","purplefire"],[3,13,"s","g"],[8,13,"s","g"],[3,18,"s","g"]],"d":"EW"},
  ],
  secret: [
    {"m":[[1]],"s":[[5,6,"i","g"]]},
    {"m":[[1]],"s":[[5,6,"p","g"]]},
    {"m":[[1]],"s":[[5,6,"p","g"],[8,3,"p","g"],[2,9,"p","g"]]},
    {"m":[[1]],"s":[[5,6,"p","g"],[8,3,"p","g"],[2,9,"p","g"],[3,3,"e","g"],[8,8,"e","g"]]},
    {"m":[[1]],"s":[[5,6,"p","g"],[8,3,"p","g"],[2,9,"p","g"],[3,3,"e","g"],[8,8,"e","g"]]},
    {"m":[[1]],"s":[[5,6,"i","g"],[8,3,"i","g"],[2,9,"i","g"]]},
    {"m":[[1]],"s":[[5,6,"p","g"],[8,3,"p","g"]]},
    {"m":[[1]],"s":[[5,6,"i","g"]]},
    {"m":[[1]],"s":[[5,6,"p","g"],[3,3,"e","g"],[8,8,"e","g"]]},
    {"m":[[1]],"s":[[5,6,"i","g"],[8,3,"i","g"]]},
    {"m":[[1]],"s":[[5,6,"i","g"],[8,3,"i","g"],[3,3,"e","g"],[8,8,"e","g"]]},
    {"m":[[1]],"s":[[5,6,"p","g"],[8,3,"p","g"],[3,3,"e","g"],[8,8,"e","g"]]},
    {"m":[[1]],"s":[[5,6,"i","g"],[3,3,"e","g"],[8,8,"e","g"]]},
    {"m":[[1]],"s":[[5,6,"p","g"],[8,3,"p","g"],[2,9,"p","g"]]},
    {"m":[[1]],"s":[[9,9,"i","g"],[3,3,"i","g"],[2,9,"i","g"],[8,8,"e","g"]]},
    {"m":[[1]],"s":[[2,9,"i","g"],[8,3,"i","g"],[5,6,"i","g"]]},
    {"m":[[1]],"s":[[2,2,"p","g"],[9,9,"p","g"]]},
    {"m":[[1]],"s":[[5,6,"p","g"],[9,9,"p","g"],[3,3,"p","g"]]},
    {"m":[[1]],"s":[[9,9,"p","g"],[8,3,"p","g"],[5,6,"e","g"]]},
    {"m":[[1]],"s":[[8,3,"p","g"],[2,2,"p","g"],[8,8,"p","g"],[5,6,"e","g"]]},
    {"m":[[1]],"s":[[3,3,"p","g"],[2,2,"p","g"]]},
    {"m":[[1]],"s":[[8,8,"i","g"],[5,6,"i","g"]]},
    {"m":[[1]],"s":[[8,8,"p","g"],[2,9,"p","g"],[3,3,"p","g"],[8,3,"e","g"]]},
    {"m":[[1]],"s":[[2,2,"i","g"]]},
  ],
  // petshop/curse/sacrifice all get their guaranteed content (a free
  // familiar, a pedestal, and the reward spike, respectively) injected
  // automatically by room.js's populateRoom regardless of what's here — see
  // its header comment. Hand-authored entries below are purely decoration
  // (extra obstacles/pickups/enemies) on top of that guarantee.
  petshop: [
    {"m":[[1]],"s":[[1,2,"o","rock"],[1,1,"o","rock"],[2,1,"o","rock"],[10,1,"o","rock"],[9,1,"o","rock"],[10,2,"o","rock"],[10,9,"o","rock"],[10,10,"o","rock"],[9,10,"o","rock"],[1,10,"o","rock"],[1,9,"o","rock"],[2,10,"o","rock"]]},
    {"m":[[1]]},
    {"m":[[1]]},
    {"m":[[1]],"s":[[3,3,"o","tallhardrock"],[8,3,"o","tallhardrock"],[3,8,"o","tallhardrock"],[8,8,"o","tallhardrock"]]},
    {"m":[[1]],"s":[[1,1,"o","rock"],[2,1,"o","rock"],[1,2,"o","rock"],[10,1,"o","rock"],[9,1,"o","rock"],[10,2,"o","rock"],[10,10,"o","rock"],[9,10,"o","rock"],[10,9,"o","rock"],[1,10,"o","rock"],[2,10,"o","rock"],[1,9,"o","rock"]]},
    {"m":[[1]],"s":[[2,2,"o","spiketrap"],[9,2,"o","spiketrap"],[9,9,"o","spiketrap"],[2,9,"o","spiketrap"]]},
    {"m":[[1]],"s":[[2,2,"o","bluefire"],[9,2,"o","bluefire"],[9,9,"o","bluefire"],[2,9,"o","bluefire"]]},
    {"m":[[1]],"s":[[5,5,"o","turretx"],[5,6,"o","turretx"],[6,6,"o","turretx"],[6,5,"o","turretx"]]},
    {"m":[[1]],"s":[[3,3,"o","spikedrock"],[8,3,"o","spikedrock"],[3,8,"o","spikedrock"],[8,8,"o","spikedrock"]]},
    {"m":[[1]],"s":[[5,5,"o","tintedrock"],[6,5,"o","tintedrock"],[5,6,"o","tintedrock"],[6,6,"o","tintedrock"]]},
    {"m":[[1]],"s":[[4,1,"o","hardrock"],[4,2,"o","hardrock"],[7,1,"o","hardrock"],[7,2,"o","hardrock"],[7,9,"o","hardrock"],[7,10,"o","hardrock"],[4,9,"o","hardrock"],[4,10,"o","hardrock"]]},
    {"m":[[1]],"s":[[2,2,"o","redfire"],[9,2,"o","redfire"],[9,9,"o","redfire"],[2,9,"o","redfire"]]},
    {"m":[[1]]},
    {"m":[[1]],"s":[[3,5,"o","hardrock"],[5,3,"o","hardrock"],[6,3,"o","hardrock"],[8,5,"o","hardrock"],[8,6,"o","hardrock"],[5,8,"o","hardrock"],[6,8,"o","hardrock"]]},
    {"m":[[1]],"s":[[3,3,"o","redfire"],[3,8,"o","redfire"],[4,4,"o","redfire"],[5,5,"o","redfire"],[5,6,"o","redfire"],[6,6,"o","redfire"],[6,5,"o","redfire"],[7,7,"o","redfire"],[7,4,"o","redfire"],[8,8,"o","redfire"],[8,3,"o","redfire"],[9,9,"o","redfire"],[9,2,"o","redfire"],[10,1,"o","redfire"]]},
    {"m":[[1]],"s":[[9,7,"o","purplefire"],[7,9,"o","purplefire"],[4,9,"o","purplefire"],[2,7,"o","purplefire"],[2,4,"o","purplefire"],[4,2,"o","purplefire"],[7,2,"o","purplefire"],[9,4,"o","purplefire"]]},
    {"m":[[1]],"s":[[2,2,"o","rock"],[2,8,"o","rock"],[5,8,"o","rock"],[8,2,"o","rock"],[8,5,"o","rock"],[8,8,"o","rock"]]},
    {"m":[[1]],"s":[[8,6,"o","redfire"],[7,7,"o","redfire"],[9,9,"o","redfire"],[6,8,"o","redfire"],[4,7,"o","redfire"],[2,9,"o","redfire"],[4,6,"o","redfire"],[4,4,"o","redfire"],[2,2,"o","redfire"],[6,4,"o","redfire"],[7,4,"o","redfire"],[9,2,"o","redfire"]]},
    {"m":[[1]],"s":[[2,4,"o","rock"],[3,2,"o","rock"],[7,2,"o","rock"],[9,3,"o","rock"],[9,8,"o","rock"],[7,9,"o","rock"],[3,9,"o","rock"],[2,7,"o","rock"]]},
    {"m":[[1]],"s":[[1,1,"o","movingspike"],[2,1,"o","movingspike"],[1,2,"o","movingspike"],[10,1,"o","movingspike"],[9,1,"o","movingspike"],[10,2,"o","movingspike"],[10,10,"o","movingspike"],[9,10,"o","movingspike"],[10,9,"o","movingspike"],[1,10,"o","movingspike"],[2,10,"o","movingspike"],[1,9,"o","movingspike"]]},
    {"m":[[1]],"s":[[3,5,"o","tallhardrock"],[5,3,"o","tallhardrock"],[6,3,"o","tallhardrock"],[8,5,"o","tallhardrock"],[8,6,"o","tallhardrock"],[5,8,"o","tallhardrock"],[6,8,"o","tallhardrock"]]},
    {"m":[[1]],"s":[[7,8,"o","spiketrap"],[8,8,"o","spiketrap"],[8,7,"o","spiketrap"],[2,8,"o","spiketrap"],[2,7,"o","spiketrap"],[8,2,"o","spiketrap"],[8,3,"o","spiketrap"],[9,3,"o","spiketrap"]]},
  ],
  curse: [
    {"m":[[1]],"s":[[5,6,"i","g"]]},
    {"m":[[1]],"s":[[4,7,"p","f","coin:penny"],[6,3,"p","f","coin:penny"],[8,7,"p","f","coin:penny"],[5,5,"p","f","coin:penny"],[2,3,"p","f","coin:penny"]]},
    {"m":[[1]],"s":[[8,3,"p","f","key"],[3,8,"p","f","key"]]},
    {"m":[[1]],"s":[[5,5,"p","f","goldbomb"]]},
    {"m":[[1]],"s":[[3,7,"p","f","heartBlue"],[7,4,"p","f","heartBlue"],[8,8,"p","f","heartBlue"]]},
    {"m":[[1]],"s":[[5,6,"p","f","sack"]]},
    {"m":[[1]],"s":[[5,6,"p","f","coin:luckypenny"]]},
    {"m":[[1]],"s":[[4,4,"p","f","pill"],[7,4,"p","f","pill"],[7,7,"p","f","pill"],[4,7,"p","f","pill"]]},
    {"m":[[1]],"s":[[5,5,"p","g"],[6,5,"p","g"]]},
    {"m":[[1]],"s":[[2,2,"o","cactus"],[9,2,"o","cactus"],[9,9,"o","cactus"],[2,9,"o","cactus"]]},
    {"m":[[1]],"s":[[1,1,"i","f","luckup"],[10,1,"i","f","damageup"],[2,1,"o","tallrock"],[2,2,"o","tallrock"],[1,2,"o","tallrock"],[9,1,"o","tallrock"],[9,2,"o","tallrock"],[10,2,"o","tallrock"],[5,5,"e","f","warlord"]]},
    {"m":[[1]],"s":[[4,7,"p","f","coin:nickel"],[6,3,"p","f","coin:nickel"],[8,7,"p","f","coin:nickel"],[5,5,"p","f","coin:nickel"]]},
    {"m":[[1]],"s":[[4,7,"p","f","key"],[3,3,"o","spikedrock"],[8,3,"o","spikedrock"],[3,8,"o","spikedrock"],[8,8,"o","spikedrock"]]},
    {"m":[[1]],"s":[[4,7,"p","f","coin:nickel"],[6,3,"p","f","coin:nickel"],[3,3,"o","turretplus"],[8,3,"o","turretplus"],[3,8,"o","turretplus"],[8,8,"o","turretplus"]]},
    {"m":[[1]],"s":[[4,7,"p","f","pill"],[6,3,"p","f","pill"],[8,7,"p","f","pill"],[5,5,"p","f","pill"]]},
    {"m":[[1]],"s":[[4,7,"p","f","key"],[6,3,"p","f","key"],[8,7,"p","f","key"],[5,5,"p","f","key"]]},
    {"m":[[1]],"s":[[4,7,"p","f","key"],[6,3,"p","f","key"],[8,7,"p","f","key"]]},
    {"m":[[1]],"s":[[4,7,"p","f","coin:luckypenny"]]},
    {"m":[[1]],"s":[[4,7,"p","f","coin:dime"],[6,3,"p","f","coin:dime"],[8,7,"p","f","coin:dime"]]},
    {"m":[[1]],"s":[[4,7,"p","f","doublebomb"],[6,3,"p","f","doublebomb"],[8,7,"p","f","doublebomb"],[5,5,"p","f","doublebomb"]]},
    {"m":[[1]],"s":[[4,7,"p","f","coin:penny"],[4,4,"o","bombbarrel"],[7,4,"o","bombbarrel"],[7,7,"o","bombbarrel"]]},
    {"m":[[1]],"s":[[5,5,"p","f","doublebomb"],[4,7,"p","f","doublebomb"],[2,3,"p","f","doublebomb"],[7,7,"p","f","doublebomb"],[1,1,"o","redfire"],[2,1,"o","redfire"],[1,2,"o","redfire"],[10,1,"o","redfire"],[9,1,"o","redfire"],[10,2,"o","redfire"],[10,10,"o","redfire"],[9,10,"o","redfire"],[10,9,"o","redfire"],[1,10,"o","redfire"],[2,10,"o","redfire"],[1,9,"o","redfire"]]},
    {"m":[[1]],"s":[[4,7,"p","f","heartBlue"],[7,7,"p","f","heartBlue"],[6,3,"p","f","heartBlue"],[5,5,"p","f","heartBlue"],[7,2,"o","yellowfire"],[8,4,"o","yellowfire"],[8,7,"o","yellowfire"],[7,8,"o","yellowfire"],[4,8,"o","yellowfire"],[2,7,"o","yellowfire"],[2,4,"o","yellowfire"],[4,2,"o","yellowfire"]]},
    {"m":[[1]],"s":[[5,5,"p","f","pill"],[3,8,"p","f","pill"],[2,3,"p","f","pill"],[4,7,"p","f","pill"]]},
    {"m":[[1]],"s":[[3,8,"p","f","star"],[4,7,"p","f","star"],[7,7,"p","f","star"],[5,5,"p","f","star"]]},
    {"m":[[1]],"s":[[5,5,"p","f","goldbomb"]]},
    {"m":[[1]],"s":[[4,7,"p","f","coin:nickel"],[8,7,"p","f","coin:nickel"],[7,7,"p","f","coin:nickel"],[3,8,"p","f","coin:nickel"],[1,1,"o","movingspike"],[2,1,"o","movingspike"],[1,2,"o","movingspike"],[10,1,"o","movingspike"],[9,1,"o","movingspike"],[10,2,"o","movingspike"],[10,10,"o","movingspike"],[9,10,"o","movingspike"],[10,9,"o","movingspike"],[1,10,"o","movingspike"],[2,10,"o","movingspike"],[1,9,"o","movingspike"]]},
    {"m":[[1]],"s":[[7,7,"p","f","pill"],[1,1,"o","purplefire"],[2,1,"o","purplefire"],[1,2,"o","purplefire"],[10,1,"o","purplefire"],[9,1,"o","purplefire"],[10,2,"o","purplefire"],[10,10,"o","purplefire"],[9,10,"o","purplefire"],[10,9,"o","purplefire"],[1,10,"o","purplefire"],[2,10,"o","purplefire"],[1,9,"o","purplefire"]]},
    {"m":[[1]],"s":[[4,7,"p","f","coin:luckypenny"],[5,5,"p","f","coin:luckypenny"],[2,3,"p","f","coin:luckypenny"],[5,5,"e","g"]]},
    {"m":[[1]],"s":[[6,3,"p","f","key"],[4,7,"p","f","key"],[7,2,"o","spikedrock"],[8,4,"o","spikedrock"],[8,7,"o","spikedrock"],[7,8,"o","spikedrock"],[4,8,"o","spikedrock"],[2,7,"o","spikedrock"],[2,4,"o","spikedrock"],[4,2,"o","spikedrock"]]},
    {"m":[[1]],"s":[[5,5,"p","f","pill"]]},
  ],
  sacrifice: [
    {"m":[[1]]},
    {"m":[[1]],"s":[[1,1,"o","rock"],[4,1,"o","rock"],[1,4,"o","rock"],[9,1,"o","rock"],[10,2,"o","rock"],[10,4,"o","rock"],[10,8,"o","rock"],[10,9,"o","rock"],[7,10,"o","rock"],[3,10,"o","rock"],[1,9,"o","rock"],[1,7,"o","rock"],[3,3,"o","redfire"],[8,8,"o","redfire"]]},
    {"m":[[1]],"s":[[1,2,"o","hardrock"],[1,3,"o","hardrock"],[8,1,"o","hardrock"],[9,1,"o","hardrock"],[10,2,"o","hardrock"],[10,3,"o","hardrock"],[10,8,"o","hardrock"],[9,10,"o","hardrock"],[7,10,"o","hardrock"],[2,10,"o","hardrock"],[1,9,"o","hardrock"],[1,7,"o","hardrock"],[8,3,"o","redfire"],[8,8,"o","redfire"]]},
    {"m":[[1]],"s":[[1,4,"o","hardrock"],[10,1,"o","hardrock"],[10,3,"o","hardrock"],[10,4,"o","hardrock"],[10,9,"o","hardrock"],[9,10,"o","hardrock"],[7,10,"o","hardrock"],[4,10,"o","hardrock"],[2,10,"o","hardrock"],[1,10,"o","hardrock"],[1,9,"o","hardrock"],[1,8,"o","hardrock"],[8,3,"o","bluefire"],[8,8,"o","bluefire"]]},
    {"m":[[1]],"s":[[3,1,"o","rock"],[4,1,"o","rock"],[8,1,"o","rock"],[9,1,"o","rock"],[10,1,"o","rock"],[10,4,"o","rock"],[10,8,"o","rock"],[10,10,"o","rock"],[9,10,"o","rock"],[8,10,"o","rock"],[7,10,"o","rock"],[1,9,"o","rock"],[8,3,"o","yellowfire"],[3,8,"o","yellowfire"]]},
    {"m":[[1]]},
    {"m":[[1]],"s":[[1,1,"o","rock"],[3,1,"o","rock"],[1,3,"o","rock"],[7,1,"o","rock"],[10,2,"o","rock"],[10,3,"o","rock"],[10,7,"o","rock"],[10,9,"o","rock"],[10,10,"o","rock"],[8,10,"o","rock"],[2,10,"o","rock"],[1,9,"o","rock"],[1,8,"o","rock"],[1,7,"o","rock"]]},
    {"m":[[1]],"s":[[3,1,"o","rock"],[4,1,"o","rock"],[7,1,"o","rock"],[9,1,"o","rock"],[10,2,"o","rock"],[10,3,"o","rock"],[10,4,"o","rock"],[10,8,"o","rock"],[10,9,"o","rock"],[10,10,"o","rock"],[2,10,"o","rock"],[1,10,"o","rock"],[1,8,"o","rock"],[1,7,"o","rock"]]},
    {"m":[[1]],"s":[[1,1,"o","hardrock"],[3,1,"o","hardrock"],[1,2,"o","hardrock"],[1,3,"o","hardrock"],[8,1,"o","hardrock"],[9,1,"o","hardrock"],[10,1,"o","hardrock"],[10,9,"o","hardrock"],[10,10,"o","hardrock"],[9,10,"o","hardrock"],[1,9,"o","hardrock"],[1,8,"o","hardrock"],[1,7,"o","hardrock"],[8,3,"o","purplefire"]]},
    {"m":[[1]],"s":[[1,1,"o","hardrock"],[3,1,"o","hardrock"],[1,2,"o","hardrock"],[1,4,"o","hardrock"],[8,1,"o","hardrock"],[10,1,"o","hardrock"],[10,4,"o","hardrock"],[10,7,"o","hardrock"],[10,9,"o","hardrock"],[10,10,"o","hardrock"],[7,10,"o","hardrock"],[4,10,"o","hardrock"],[2,10,"o","hardrock"],[1,10,"o","hardrock"]]},
    {"m":[[1]],"s":[[3,3,"o","bluefire"],[8,3,"o","bluefire"],[8,8,"o","bluefire"],[3,8,"o","bluefire"]]},
    {"m":[[1]],"s":[[3,3,"o","redfire"],[8,3,"o","redfire"],[8,8,"o","redfire"],[3,8,"o","redfire"]]},
    {"m":[[1]]},
    {"m":[[1]],"s":[[7,2,"o","rock"],[8,4,"o","rock"],[8,7,"o","rock"],[7,8,"o","rock"],[4,8,"o","rock"],[2,7,"o","rock"],[2,4,"o","rock"],[4,2,"o","rock"],[3,3,"o","purplefire"],[8,3,"o","purplefire"],[8,8,"o","purplefire"],[3,8,"o","purplefire"]]},
    {"m":[[1]],"s":[[1,1,"o","rock"],[2,1,"o","rock"],[1,2,"o","rock"],[10,1,"o","rock"],[9,1,"o","rock"],[10,2,"o","rock"],[9,10,"o","rock"],[10,9,"o","rock"],[1,10,"o","rock"],[2,10,"o","rock"],[3,3,"o","yellowfire"],[8,3,"o","yellowfire"],[8,8,"o","yellowfire"],[3,8,"o","yellowfire"]]},
    {"m":[[1]],"s":[[9,7,"o","rock"],[7,9,"o","rock"],[4,9,"o","rock"],[2,7,"o","rock"],[2,4,"o","rock"],[4,2,"o","rock"],[7,2,"o","rock"],[9,4,"o","rock"],[3,3,"o","yellowfire"],[8,3,"o","yellowfire"],[8,8,"o","yellowfire"],[3,8,"o","yellowfire"]]},
    {"m":[[1]],"s":[[7,2,"o","hardrock"],[8,4,"o","hardrock"],[8,7,"o","hardrock"],[7,8,"o","hardrock"],[4,8,"o","hardrock"],[2,7,"o","hardrock"],[2,4,"o","hardrock"],[4,2,"o","hardrock"],[3,3,"o","redfire"],[8,3,"o","redfire"],[8,8,"o","redfire"],[3,8,"o","redfire"]]},
    {"m":[[1]],"s":[[1,1,"o","hardrock"],[2,1,"o","hardrock"],[1,2,"o","hardrock"],[10,1,"o","hardrock"],[9,1,"o","hardrock"],[10,2,"o","hardrock"],[10,10,"o","hardrock"],[9,10,"o","hardrock"],[10,9,"o","hardrock"],[1,10,"o","hardrock"],[2,10,"o","hardrock"],[1,9,"o","hardrock"]]},
    {"m":[[1]],"s":[[9,7,"o","hardrock"],[7,9,"o","hardrock"],[4,9,"o","hardrock"],[2,7,"o","hardrock"],[2,4,"o","hardrock"],[4,2,"o","hardrock"],[9,4,"o","hardrock"],[3,3,"o","yellowfire"],[8,3,"o","yellowfire"],[8,8,"o","yellowfire"],[3,8,"o","yellowfire"]]},
    {"m":[[1]],"s":[[1,1,"o","hardrock"],[2,1,"o","hardrock"],[10,1,"o","hardrock"],[9,1,"o","hardrock"],[10,2,"o","hardrock"],[10,10,"o","hardrock"],[9,10,"o","hardrock"],[1,10,"o","hardrock"],[2,10,"o","hardrock"],[1,9,"o","hardrock"],[3,3,"o","purplefire"],[8,3,"o","purplefire"],[8,8,"o","purplefire"],[3,8,"o","purplefire"]]},
    {"m":[[1]],"s":[[7,2,"o","hardrock"],[8,4,"o","hardrock"],[8,7,"o","hardrock"],[7,8,"o","hardrock"],[4,8,"o","hardrock"],[2,7,"o","hardrock"],[2,4,"o","hardrock"],[4,2,"o","hardrock"]]},
    {"m":[[1]],"s":[[1,1,"o","rock"],[2,1,"o","rock"],[1,2,"o","rock"],[10,1,"o","rock"],[9,1,"o","rock"],[10,2,"o","rock"],[10,10,"o","rock"],[9,10,"o","rock"],[10,9,"o","rock"],[1,10,"o","rock"],[2,10,"o","rock"],[1,9,"o","rock"]]},
  ],
  // vault — key-locked like treasure/shop, entirely hand-authored (no
  // automatic content — see room.js's populateRoom). Empty until you build some.
  vault: [
    {"m":[[1]],"s":[[3,4,"p","f","chest:grey"],[4,3,"p","f","chest:grey"],[7,3,"p","f","chest:grey"],[8,4,"p","f","chest:grey"]]},
    {"m":[[1]],"s":[[3,4,"p","f","chest:gold"],[4,3,"p","f","chest:gold"],[7,3,"p","f","chest:gold"],[8,4,"p","f","chest:gold"]]},
    {"m":[[1]],"s":[[3,4,"p","f","chest:stone"],[4,3,"p","f","chest:stone"],[7,3,"p","f","chest:stone"],[8,4,"p","f","chest:stone"]]},
    {"m":[[1]],"s":[[3,4,"p","f","chest:cursed"],[4,3,"p","f","chest:cursed"],[7,3,"p","f","chest:cursed"],[8,4,"p","f","chest:cursed"]]},
    {"m":[[1]],"s":[[5,5,"p","f","goldbomb"],[6,6,"p","f","doublebomb"]]},
    {"m":[[1]],"s":[[5,5,"p","f","goldkey"],[6,6,"p","f","key"]]},
    {"m":[[1]],"s":[[5,5,"p","f","coin:dime"],[6,6,"p","f","coin:dime"],[6,5,"p","f","coin:luckypenny"]]},
    {"m":[[1]],"s":[[5,5,"o","tintedrock"],[5,6,"o","tintedrock"],[6,6,"o","tintedrock"],[6,5,"o","tintedrock"]]},
    {"m":[[1]],"s":[[4,6,"p","f","heartBlue"],[8,9,"p","f","heartBlue"],[3,9,"p","f","heartBlue"],[8,4,"p","f","heartBlue"],[4,3,"p","f","heartBlue"],[1,2,"p","f","heartBlue"]]},
    {"m":[[1]],"s":[[5,5,"p","f","heartContainer"]]},
    {"m":[[1]],"s":[[5,4,"p","f","sack"],[8,3,"p","f","sack"],[9,9,"p","f","sack"],[3,7,"p","f","sack"]]},
    {"m":[[1]],"s":[[6,5,"p","f","battery"],[2,9,"p","f","battery"],[2,3,"p","f","battery"],[8,3,"p","f","minibattery"],[9,9,"p","f","minibattery"],[5,8,"p","f","minibattery"]]},
    {"m":[[1]],"s":[[3,3,"p","f","pill"],[8,2,"p","f","pill"],[5,6,"p","f","pill"],[9,9,"p","f","pill"],[2,9,"p","f","pill"]]},
    {"m":[[1]],"s":[[3,4,"p","f","chest:grey"],[4,3,"p","f","chest:grey"],[7,3,"p","f","chest:grey"],[8,4,"p","f","chest:grey"]]},
    {"m":[[1]],"s":[[3,4,"p","f","sack"],[4,3,"p","f","sack"],[7,3,"p","f","sack"]]},
    {"m":[[1]],"s":[[3,4,"p","f","pill"],[4,3,"p","f","pill"],[7,3,"p","f","pill"],[5,5,"o","tintedrock"],[6,5,"o","tintedrock"],[5,6,"o","tintedrock"],[6,6,"o","tintedrock"]]},
    {"m":[[1]],"s":[[3,4,"p","f","chest:grey"],[4,3,"p","f","chest:grey"],[7,3,"p","f","chest:grey"]]},
    {"m":[[1]],"s":[[3,4,"p","f","chest:stone"],[4,3,"p","f","chest:stone"],[7,3,"p","f","chest:stone"]]},
    {"m":[[1]],"s":[[3,4,"p","f","goldkey"]]},
    {"m":[[1]],"s":[[3,4,"p","f","chest:grey"]]},
    {"m":[[1]],"s":[[3,4,"p","f","coin:luckypenny"]]},
    {"m":[[1]],"s":[[3,4,"p","f","chest:gold"],[4,3,"p","f","chest:gold"],[7,3,"p","f","chest:gold"]]},
    {"m":[[1]],"s":[[3,4,"p","f","chest:cursed"],[4,3,"p","f","chest:cursed"],[7,3,"p","f","chest:cursed"],[8,4,"p","f","chest:cursed"]]},
    {"m":[[1]],"s":[[3,7,"p","f","star"]]},
    {"m":[[1]],"s":[[8,7,"p","f","heartBlue"],[3,4,"p","f","heartBlue"],[7,3,"p","f","heartBlue"]]},
    {"m":[[1]],"s":[[8,4,"p","f","chest:wood"],[3,7,"p","f","chest:wood"],[8,7,"p","f","chest:wood"],[7,3,"p","f","chest:wood"]]},
    {"m":[[1]],"s":[[6,6,"p","f","chest:stone"],[4,3,"p","f","chest:stone"],[3,4,"p","f","chest:stone"],[7,3,"p","f","chest:stone"]]},
    {"m":[[1]],"s":[[7,3,"p","f","chest:gold"]]},
    {"m":[[1]],"s":[[6,6,"p","f","pill"],[7,3,"p","f","pill"],[5,5,"o","tintedrock"],[6,5,"o","tintedrock"],[5,6,"o","tintedrock"],[6,6,"o","tintedrock"]]},
    {"m":[[1]],"s":[[5,5,"p","f","chest:eternal"]]},
    {"m":[[1]],"s":[[3,7,"p","f","pill"],[7,3,"p","f","pill"],[6,6,"p","f","pill"]]},
    {"m":[[1]],"s":[[3,7,"p","f","coin:dime"],[8,4,"p","f","coin:luckypenny"],[5,5,"p","f","coin:dime"]]},
    {"m":[[1]],"s":[[3,7,"p","f","goldbomb"],[5,5,"p","f","goldbomb"],[5,5,"o","tintedrock"],[6,5,"o","tintedrock"],[5,6,"o","tintedrock"],[6,6,"o","tintedrock"]]},
  ],
  // challenge — room.js's populateRoom always injects one guaranteed item at
  // the room's center on top of whatever's here (drawn from the 'challenge'
  // item pool). Hand-authored entries below are purely the arena layout —
  // keep it open, since 5 waves of 3-5 enemies spawn from the center once
  // the item is taken (see combat.js's startChallengeRoom/spawnChallengeWave).
  challenge: [
    {"m":[[1]]},
    {"m":[[1,1]]},
    {"m":[[1]]},
    {"m":[[1],[1]]},
    {"m":[[1,1],[1,0]]},
    {"m":[[0,1],[1,1]]},
    {"m":[[1,1,1],[0,1,0]]},
    {"m":[[1,0],[1,1]]},
    {"m":[[1,1,1,1]]},
    {"m":[[1,1],[1,1]]},
    {"m":[[1,1],[0,1]]},
    {"m":[[1,0],[1,1]]},
    {"m":[[1,1]]},
    {"m":[[1]]},
    {"m":[[0,1],[1,1]]},
    {"m":[[1,0],[1,0],[1,1]]},
    {"m":[[1,1,1,1]]},
    {"m":[[1,1,1]]},
    {"m":[[1],[1]]},
    {"m":[[1,1],[0,1]]},
    {"m":[[1],[1],[1]]},
  ],
  // crystal (angel) / sombra (devil) — deal rooms, entirely hand-authored,
  // no automatic content (see room.js's populateRoom). Sombra is where the
  // "Deal" spawner category belongs — a heart-cost item pedestal, see
  // room.js's addDealPedestal — though it's placeable in any room type.
  // Empty until you build some.
  crystal: [
    {"m":[[1]],"s":[[5,5,"i","g"]]},
    {"m":[[1,1]],"s":[[5,5,"i","g"],[2,2,"o","movingspike"],[9,9,"o","movingspike"]]},
    {"m":[[1]],"s":[[5,5,"i","g"]]},
    {"m":[[1]],"s":[[5,4,"i","g"],[3,3,"o","tallrock"],[8,3,"o","tallrock"],[3,8,"o","tallrock"],[8,8,"o","tallrock"]]},
    {"m":[[1],[1]],"s":[[5,5,"i","g"],[6,5,"o","tintedrock"],[5,6,"o","tintedrock"],[6,6,"o","tintedrock"]]},
    {"m":[[1,1]],"s":[[5,5,"i","g"],[11,1,"o","pit"],[12,1,"o","pit"],[11,2,"o","pit"],[20,1,"o","pit"],[19,1,"o","pit"],[20,2,"o","pit"],[20,10,"o","pit"],[19,10,"o","pit"],[20,9,"o","pit"],[11,10,"o","pit"],[12,10,"o","pit"],[11,9,"o","pit"]]},
    {"m":[[1]],"s":[[4,4,"i","g"],[3,3,"o","sandtrap"],[8,3,"o","sandtrap"],[3,8,"o","sandtrap"],[8,8,"o","sandtrap"]]},
    {"m":[[1,1]],"s":[[5,6,"i","g"]]},
    {"m":[[1]],"s":[[6,5,"i","g"],[2,2,"o","cactus"],[9,2,"o","cactus"],[9,9,"o","cactus"],[2,9,"o","cactus"]]},
    {"m":[[1],[1]],"s":[[6,6,"i","g"],[4,1,"o","hardrock"],[4,2,"o","hardrock"],[7,1,"o","hardrock"],[7,2,"o","hardrock"],[7,9,"o","hardrock"],[7,10,"o","hardrock"],[4,9,"o","hardrock"],[4,10,"o","hardrock"],[2,12,"o","cactus"],[9,12,"o","cactus"],[9,19,"o","cactus"],[2,19,"o","cactus"]]},
    {"m":[[1]],"s":[[4,5,"i","g"],[1,1,"o","spikedrock"],[10,1,"o","spikedrock"],[10,10,"o","spikedrock"],[1,10,"o","spikedrock"]]},
    {"m":[[1],[1]],"s":[[5,16,"i","g"],[7,2,"o","movingspike"],[8,4,"o","movingspike"],[8,7,"o","movingspike"],[7,8,"o","movingspike"],[5,10,"o","movingspike"],[4,8,"o","movingspike"],[2,7,"o","movingspike"],[2,4,"o","movingspike"],[4,2,"o","movingspike"]]},
    {"m":[[1,1]],"s":[[6,4,"i","g"]]},
    {"m":[[1],[1]],"s":[[5,6,"i","g"],[2,12,"o","spikedrock"],[2,18,"o","spikedrock"],[5,12,"o","spikedrock"],[5,18,"o","spikedrock"],[8,12,"o","spikedrock"],[8,15,"o","spikedrock"],[8,18,"o","spikedrock"]]},
    {"m":[[1]],"s":[[5,6,"i","g"]]},
    {"m":[[1,1]],"s":[[5,4,"i","g"],[2,9,"o","movingspike"],[3,3,"o","movingspike"],[3,8,"o","movingspike"],[4,4,"o","movingspike"],[4,7,"o","movingspike"],[5,5,"o","movingspike"],[5,6,"o","movingspike"],[6,6,"o","movingspike"],[6,5,"o","movingspike"],[7,7,"o","movingspike"],[8,8,"o","movingspike"],[9,2,"o","movingspike"],[10,10,"o","movingspike"],[10,1,"o","movingspike"],[12,4,"o","bombbarrel"],[13,2,"o","bombbarrel"],[17,2,"o","bombbarrel"],[19,3,"o","bombbarrel"],[19,8,"o","bombbarrel"],[17,9,"o","bombbarrel"],[13,9,"o","bombbarrel"],[12,7,"o","bombbarrel"]]},
    {"m":[[1,1]],"s":[[6,4,"i","g"],[8,6,"o","bluefire"],[10,6,"o","bluefire"],[7,7,"o","bluefire"],[9,9,"o","bluefire"],[6,8,"o","bluefire"],[4,7,"o","bluefire"],[2,9,"o","bluefire"],[4,6,"o","bluefire"],[4,4,"o","bluefire"],[2,2,"o","bluefire"],[7,4,"o","bluefire"],[9,2,"o","bluefire"]]},
    {"m":[[1,1]],"s":[[16,6,"i","g"]]},
    {"m":[[1]],"s":[[5,4,"i","g"]]},
    {"m":[[1,1]],"s":[[15,6,"i","g"]]},
    {"m":[[1]],"s":[[4,6,"i","g"]]},
  ],
  sombra: [
    {"m":[[1]],"s":[[3,8,"d","g"],[3,3,"d","g"],[8,3,"d","g"],[8,8,"d","g"]]},
    {"m":[[1]],"s":[[3,4,"d","g"],[5,4,"d","g"],[7,4,"d","g"]],"d":[[0,0,"N"]]},
    {"m":[[1]],"s":[[3,4,"d","g"],[8,4,"d","g"]]},
    {"m":[[1]],"s":[[3,3,"d","g"],[8,3,"d","g"],[3,8,"d","g"],[8,8,"d","g"]],"d":"S"},
    {"m":[[1]],"s":[[3,3,"d","g"],[8,3,"d","g"],[3,8,"d","g"],[8,8,"d","g"]]},
    {"m":[[1]],"s":[[3,3,"d","g"],[8,3,"d","g"],[3,8,"d","g"]]},
    {"m":[[1]],"s":[[3,3,"d","g"],[8,3,"d","g"]]},
    {"m":[[1]],"s":[[3,3,"d","g"],[8,3,"d","g"],[3,8,"d","g"]],"d":"W"},
    {"m":[[1]],"s":[[3,3,"d","g"],[8,3,"d","g"],[3,8,"d","g"],[8,8,"d","g"]],"d":"N"},
    {"m":[[1]],"s":[[3,3,"d","g"],[8,3,"d","g"],[3,8,"d","g"]],"d":"N"},
    {"m":[[1]],"s":[[3,3,"d","g"],[8,3,"d","g"],[3,8,"d","g"]],"d":"S"},
    {"m":[[1]],"s":[[3,3,"d","g"],[8,3,"d","g"]],"d":"N"},
    {"m":[[1]],"s":[[3,3,"d","g"],[8,3,"d","g"],[3,8,"d","g"]],"d":"E"},
    {"m":[[1]],"s":[[5,5,"d","g"],[8,3,"d","g"],[8,8,"d","g"]]},
    {"m":[[1]],"s":[[3,8,"d","g"],[8,3,"d","g"]]},
    {"m":[[1]],"s":[[5,5,"d","g"],[3,8,"d","g"],[8,8,"d","g"],[3,3,"d","g"]]},
    {"m":[[1]],"s":[[3,8,"d","g"],[3,3,"d","g"]],"d":"W"},
    {"m":[[1]],"s":[[8,8,"d","g"],[8,3,"d","g"],[3,8,"d","g"]]},
    {"m":[[1]],"s":[[3,3,"d","g"],[3,8,"d","g"],[8,3,"d","g"],[5,5,"d","g"]],"d":"E"},
    {"m":[[1]],"s":[[3,3,"d","g"],[8,3,"d","g"]]},
    {"m":[[1]],"s":[[3,8,"d","g"],[3,3,"d","g"]],"d":"N"},
    {"m":[[1]],"s":[[3,8,"d","g"],[8,8,"d","g"],[5,5,"d","g"]],"d":"E"},
    {"m":[[1]],"s":[[8,8,"d","g"],[3,3,"d","g"]]},
  ],
  // Shrine — content is entirely auto-guaranteed by room.js's populateRoom
  // (one coin-cost pedestal at room center, see addShrinePedestal), so these
  // are mostly empty layouts with a light decorative obstacle ring, same
  // density/style as the crystal/sombra sets above. No "i"/"d" spawners
  // needed — an author placing one anyway is free decoration, same as a
  // petshop template placing extra stuff around its guaranteed familiar.
  shrine: [
    {"m":[[1]]},
    {"m":[[1]]},
    {"m":[[1]],"s":[[2,2,"o","hardrock"],[9,2,"o","hardrock"],[2,9,"o","hardrock"],[9,9,"o","hardrock"]]},
    {"m":[[1]],"s":[[1,1,"o","rock"],[10,1,"o","rock"],[1,10,"o","rock"],[10,10,"o","rock"]]},
    {"m":[[1,1]],"s":[[2,2,"o","tallhardrock"],[19,2,"o","tallhardrock"],[2,9,"o","tallhardrock"],[19,9,"o","tallhardrock"]]},
    {"m":[[1],[1]]},
    {"m":[[1]],"s":[[5,2,"o","yellowfire"],[5,9,"o","yellowfire"]]},
    {"m":[[1,1]]},
    {"m":[[1]],"s":[[3,3,"o","spiketrap"],[8,3,"o","spiketrap"],[3,8,"o","spiketrap"],[8,8,"o","spiketrap"]]},
    {"m":[[1]],"s":[[4,4,"o","tallrock"],[7,4,"o","tallrock"],[4,7,"o","tallrock"],[7,7,"o","tallrock"]]},
  ],
};

'use strict';
/* ============================================================
   roomTemplates/stage10-13-floorfeature.js — CONTENT GROUP 3 feature rooms.

   ONE feature room per FLOOR (eight total), each built around its
   stage's own interactive object — the four deepest stages in the game:
     floorNum 27  Trench Depths  "The Crush Zone"      — crossfire of crush vents
     floorNum 28  Trench Depths  "The Black Vents"     — vent gauntlet, no open lane
     floorNum 29  Deep Dark      "No Light Reaches"    — lure horns in a blind maze
     floorNum 30  Deep Dark      "The Long Quiet"      — one horn, walled in, ambushed
     floorNum 31  Meta Realm     "Behind The Curtain"  — half the maze is not there
     floorNum 32  Meta Realm     "The Author's Margin" — a sealed vault that isn't sealed
     floorNum 33  Hyperspace     "Fold"                — a warp pinwheel
     floorNum 34  Hyperspace     "The Last Exit"       — every fold points inward

   The object kinds (crushvent, lurehorn, phantomwall, warpstreamn/s/e/w)
   are declared in data/collectibles.js's OBSTACLES in one contiguous
   "CONTENT GROUP 3" block, after Groups 1 and 2; the comment there
   explains which existing mechanism each reuses and why Hyperspace could
   not reuse the C-branch `current` tiles.

   REGISTRATION. roomTemplates/floorfeature.js assigns
   `ROOM_TEMPLATES.floorfeature = [...]`; this file PUSHES onto that same
   array (the room-editor export form, and what that file's own header
   asks later phases to use). index.html loads it after floorfeature.js.

   FLOOR GATING. `f` holds floorNums, NOT HUD floor numbers —
   dungeon.js's templateAllowsFloor does
   `if (tmpl.f && !tmpl.f.includes(floorNum)) return false`. Each template
   names exactly one floor, so a stage's two floors get visibly different
   rooms instead of a coin flip between the same two. The base pool's
   untagged 1x1 template carries no `f` and stays eligible everywhere, so
   the pool can never empty — which matters, because generateDungeon
   attaches a floorfeature room to EVERY floor past
   OLD_MAIN_ROUTE_FINAL_FLOOR.

   `s` entries are [tileX, tileY, kindLetter, ...] in a 1x1 room's 12x12
   grid — usable interior is 1..10 on both axes (BLOCK = 10 plus the wall
   ring). ['e','g'] is a generic enemy resolved per-floor from the stage
   pool; ['e','f','<id>'] forces a specific ENEMY_TYPES key; ['p','g'] is
   a random pickup; ['o','<kind>'] is always a forced obstacle.
   ============================================================ */
ROOM_TEMPLATES.floorfeature.push(

  /* floorNum 27 — Trench Depths, "The Crush Zone". Four black smokers on
     the diagonals of the room, each venting on all eight bearings every
     couple of seconds, and one block of tall rock in the middle. That
     block is the only real cover in the room and it is also the only
     thing worth standing behind, so the fight compresses onto four
     tiles while sixteen bolt lanes rotate around them. A forced Crushjaw
     comes in from the north to contest exactly that block. */
  {"m":[[1]],"s":[[3,3,"o","crushvent"],[8,3,"o","crushvent"],[3,8,"o","crushvent"],[8,8,"o","crushvent"],[5,5,"o","tallhardrock"],[6,5,"o","tallhardrock"],[5,6,"o","tallhardrock"],[6,6,"o","tallhardrock"],[5,1,"e","f","tdcrusher"],[1,5,"e","g"],[10,6,"e","g"],[6,10,"e","g"],[1,1,"p","g"]],"f":[27]},

  /* floorNum 28 — Trench Depths, "The Black Vents". A gauntlet: vents in
     both corners of each wall and a fifth planted dead centre, with four
     rock pillars offset from all of them. There is no lane across this
     room that is out of every vent's fire at once — the pillars are the
     only shelter, and moving between them is the whole room. A forced
     Crush Column walks the floor dropping pressure on wherever you have
     chosen to shelter. */
  {"m":[[1]],"s":[[2,2,"o","crushvent"],[9,2,"o","crushvent"],[2,9,"o","crushvent"],[9,9,"o","crushvent"],[5,5,"o","crushvent"],[4,3,"o","tallhardrock"],[7,4,"o","tallhardrock"],[3,7,"o","tallhardrock"],[7,8,"o","tallhardrock"],[6,2,"e","f","tdcolumn"],[2,6,"e","g"],[9,6,"e","g"],[6,9,"e","g"]],"f":[28]},

  /* floorNum 29 — Deep Dark, "No Light Reaches". A blind maze of hard
     rock with a lure horn in each corner: four slow homing bolts a
     second apart, curving around corners you cannot see past. The maze
     is what makes them work — you are always breaking line of sight with
     one horn and walking into another's. Two Pouncers are placed IN the
     maze rather than at the spawns, dormant until you round a wall. */
  {"m":[[1]],"s":[[1,1,"o","lurehorn"],[10,1,"o","lurehorn"],[1,10,"o","lurehorn"],[10,10,"o","lurehorn"],[3,2,"o","hardrock"],[3,3,"o","hardrock"],[3,4,"o","hardrock"],[8,2,"o","hardrock"],[8,3,"o","hardrock"],[8,4,"o","hardrock"],[3,7,"o","hardrock"],[3,8,"o","hardrock"],[3,9,"o","hardrock"],[8,7,"o","hardrock"],[8,8,"o","hardrock"],[8,9,"o","hardrock"],[5,3,"o","hardrock"],[6,3,"o","hardrock"],[5,8,"o","hardrock"],[6,8,"o","hardrock"],[4,5,"e","f","ddpounce"],[7,6,"e","f","ddpounce"],[5,5,"p","g"],[1,5,"e","g"],[10,6,"e","g"]],"f":[29]},

  /* floorNum 30 — Deep Dark, "The Long Quiet". One lure horn, walled in
     by a tall-rock ring with a single gap on each side, and a pickup
     sitting next to it. Taking the pickup means standing inside the ring
     with the thing that is aiming at you, in a box you cannot leave in a
     hurry — and an Unlit Stalker and a Whisper are already in the room,
     one of which is behind you by design. */
  {"m":[[1]],"s":[[4,4,"o","tallhardrock"],[5,4,"o","tallhardrock"],[7,4,"o","tallhardrock"],[4,5,"o","tallhardrock"],[7,5,"o","tallhardrock"],[4,7,"o","tallhardrock"],[7,7,"o","tallhardrock"],[4,8,"o","tallhardrock"],[6,8,"o","tallhardrock"],[7,8,"o","tallhardrock"],[5,6,"o","lurehorn"],[6,6,"p","g"],[2,2,"e","f","ddstalker"],[9,9,"e","f","ddwhisper"],[9,2,"e","g"],[2,9,"e","g"]],"f":[30]},

  /* floorNum 31 — Meta Realm, "Behind The Curtain". A lattice of tall
     rock — except every other block of it is a Phantom Wall, which
     carries tallhardrock's exact colours and none of its collision. The
     room looks like a maze and is roughly half open floor, and there is
     no way to tell which half without walking into it. Enemies path
     through the phantom halves too (makeIsBlockedFn skips walkables), so
     the maze does not protect you either. A forced Render Ghost, which
     never cared about walls in the first place, makes the joke explicit. */
  {"m":[[1]],"s":[[2,2,"o","tallhardrock"],[3,2,"o","phantomwall"],[4,2,"o","tallhardrock"],[5,2,"o","phantomwall"],[6,2,"o","tallhardrock"],[7,2,"o","phantomwall"],[8,2,"o","tallhardrock"],[2,4,"o","phantomwall"],[3,4,"o","tallhardrock"],[4,4,"o","phantomwall"],[5,4,"o","tallhardrock"],[6,4,"o","phantomwall"],[7,4,"o","tallhardrock"],[8,4,"o","phantomwall"],[2,6,"o","tallhardrock"],[3,6,"o","phantomwall"],[4,6,"o","tallhardrock"],[5,6,"o","phantomwall"],[6,6,"o","tallhardrock"],[7,6,"o","phantomwall"],[8,6,"o","tallhardrock"],[2,8,"o","phantomwall"],[3,8,"o","tallhardrock"],[4,8,"o","phantomwall"],[5,8,"o","tallhardrock"],[6,8,"o","phantomwall"],[7,8,"o","tallhardrock"],[8,8,"o","phantomwall"],[10,5,"e","f","mrghost"],[1,3,"e","g"],[10,9,"e","g"],[5,10,"e","g"]],"f":[31]},

  /* floorNum 32 — Meta Realm, "The Author's Margin". A vault: a closed
     3x3 box with an item pedestal inside it and no door. The box is
     built entirely out of Phantom Walls, so it is not a box at all — you
     walk straight in. The four real tall-rock blocks sitting outside it
     are the control group, and they are genuinely solid. A forced Editor
     is in the room deleting the scenery, which over the course of the
     fight removes the only walls that were ever real. */
  {"m":[[1]],"s":[[4,4,"o","phantomwall"],[5,4,"o","phantomwall"],[6,4,"o","phantomwall"],[4,5,"o","phantomwall"],[6,5,"o","phantomwall"],[4,6,"o","phantomwall"],[5,6,"o","phantomwall"],[6,6,"o","phantomwall"],[5,5,"i","g"],[2,2,"o","tallhardrock"],[9,2,"o","tallhardrock"],[2,9,"o","tallhardrock"],[9,9,"o","tallhardrock"],[9,5,"e","f","mreditor"],[2,5,"e","g"],[5,10,"e","g"],[5,1,"e","g"]],"f":[32]},

  /* floorNum 33 — Hyperspace, "Fold". A pinwheel: four warp lanes laid
     head-to-tail around the room's edge, each running into the next, so
     stepping onto the perimeter anywhere puts you into a circuit at the
     strongest push in the game. The middle is dead calm and completely
     exposed. A forced Lancer crosses that calm in straight lines while
     you are being carried around the outside of it. */
  {"m":[[1]],"s":[[2,2,"o","warpstreame"],[3,2,"o","warpstreame"],[4,2,"o","warpstreame"],[5,2,"o","warpstreame"],[6,2,"o","warpstreame"],[7,2,"o","warpstreame"],[8,2,"o","warpstreame"],[9,2,"o","warpstreams"],[9,3,"o","warpstreams"],[9,4,"o","warpstreams"],[9,5,"o","warpstreams"],[9,6,"o","warpstreams"],[9,7,"o","warpstreams"],[9,8,"o","warpstreams"],[9,9,"o","warpstreamw"],[8,9,"o","warpstreamw"],[7,9,"o","warpstreamw"],[6,9,"o","warpstreamw"],[5,9,"o","warpstreamw"],[4,9,"o","warpstreamw"],[3,9,"o","warpstreamw"],[2,9,"o","warpstreamn"],[2,8,"o","warpstreamn"],[2,7,"o","warpstreamn"],[2,6,"o","warpstreamn"],[2,5,"o","warpstreamn"],[2,4,"o","warpstreamn"],[2,3,"o","warpstreamn"],[5,5,"e","f","hslancer"],[6,6,"e","g"],[5,7,"e","g"],[6,4,"e","g"],[1,1,"p","g"]],"f":[33]},

  /* floorNum 34 — Hyperspace, "The Last Exit". The final feature room of
     the main route, and the only one whose folds all point the same way:
     inward. Every edge of the room pushes you toward the centre, and the
     centre is where a Terminus is standing laying crossing walls of
     bolts. Leaving is possible and costs ground the whole way; the
     pickup is bait to make you stay. Thirty-four floors of feature rooms
     end on one that will not let you back off. */
  {"m":[[1]],"s":[[3,2,"o","warpstreams"],[4,2,"o","warpstreams"],[5,2,"o","warpstreams"],[6,2,"o","warpstreams"],[7,2,"o","warpstreams"],[8,2,"o","warpstreams"],[3,9,"o","warpstreamn"],[4,9,"o","warpstreamn"],[5,9,"o","warpstreamn"],[6,9,"o","warpstreamn"],[7,9,"o","warpstreamn"],[8,9,"o","warpstreamn"],[2,3,"o","warpstreame"],[2,4,"o","warpstreame"],[2,5,"o","warpstreame"],[2,6,"o","warpstreame"],[2,7,"o","warpstreame"],[2,8,"o","warpstreame"],[9,3,"o","warpstreamw"],[9,4,"o","warpstreamw"],[9,5,"o","warpstreamw"],[9,6,"o","warpstreamw"],[9,7,"o","warpstreamw"],[9,8,"o","warpstreamw"],[6,6,"e","f","hsterminus"],[5,5,"p","g"],[4,4,"e","g"],[7,7,"e","g"],[4,7,"e","g"],[7,4,"e","g"]],"f":[34]},
);

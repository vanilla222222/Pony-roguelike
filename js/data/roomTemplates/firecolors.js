'use strict';
/* ============================================================
   roomTemplates/firecolors.js — Phase 15. New rooms built around the
   three new colored-fire hazards (data/collectibles.js's greenfire/
   whitefire/blackfire — see that file's comment for each one's new
   "form of shooting", and combat-4.js's updateObstacles for how they
   fire). Pushes onto ROOM_TEMPLATES.normal exactly like every existing
   yellowfire/redfire/bluefire/purplefire room in normal-1..4.js — a
   NEW set of rooms, none of the pre-existing ones touched or edited.
   ============================================================ */
// this file is plain JS (not authored JSON, unlike the room-editor exports
// in normal-1..4.js), so the floor gate below can just be computed instead
// of hand-listing every floorNum — "Inferno (stage 3) onward", floorNum 6+
const LATE_FLOORS = Array.from({ length: 30 }, (_, i) => i + 6);
ROOM_TEMPLATES.normal.push(
  // Green Fire — a 3-bolt fan needs room to fan out in; four posts around
  // the walls with generic trash in the middle to press the player toward them.
  {"m":[[1]],"s":[
    [1,1,"o","greenfire"],[10,1,"o","greenfire"],[1,10,"o","greenfire"],[10,10,"o","greenfire"],
    [5,5,"e","g"],[6,5,"e","g"],[5,6,"e","g"],[6,6,"e","g"],
  ]},
  // White Fire — its bolts detonate on burnout, so the room gives the
  // player rubble to hide the blast radius behind instead of open ground.
  {"m":[[1]],"s":[
    [2,2,"o","whitefire"],[9,9,"o","whitefire"],
    [5,2,"o","rock"],[6,2,"o","rock"],[5,3,"o","rock"],[6,3,"o","rock"],
    [5,8,"o","rock"],[6,8,"o","rock"],[5,9,"o","rock"],[6,9,"o","rock"],
    [3,5,"e","g"],[8,6,"e","g"],
  ]},
  // Black Fire — never aims, threatens the whole room from wherever it
  // sits, so it gets the centerpiece with nothing standing between it and
  // the doors; the danger is the constant sweep, not a surprise angle.
  {"m":[[1]],"s":[
    [5,5,"o","blackfire"],[6,5,"o","blackfire"],
    [1,1,"e","g"],[10,1,"e","g"],[1,10,"e","g"],[10,10,"e","g"],
  ],"f":LATE_FLOORS},
  // all three together — a late-run gauntlet room. Floor-gated to stage 3
  // (Inferno) onward via "f" (floorNum, 0-based — see dungeon.js's
  // templateAllowsFloor) so it never shows up as an early ambush before the
  // player has the tools to handle it.
  {"m":[[1,1]],"s":[
    [2,2,"o","greenfire"],[19,2,"o","greenfire"],
    [2,9,"o","whitefire"],[19,9,"o","whitefire"],
    [10,5,"o","blackfire"],[11,5,"o","blackfire"],
    [4,5,"e","g"],[17,5,"e","g"],[7,2,"e","g"],[14,9,"e","g"],
  ],"f":LATE_FLOORS},

  // Phase 18 — more rooms for the three Phase 15 fires, same "push more
  // onto ROOM_TEMPLATES.normal" pattern, no existing entry touched.
  // Green Fire corridor — a long EW hall with a post at each end, so the
  // 3-bolt fan sweeps the exact lane you have to walk down.
  {"m":[[1,1]],"s":[
    [2,5,"o","greenfire"],[19,5,"o","greenfire"],
    [8,2,"e","g"],[13,2,"e","g"],[8,9,"e","g"],[13,9,"e","g"],
  ],"d":"EW"},
  // White Fire pit-ring — the delayed detonation now has to be dodged
  // around a pit as well, not just rubble; less cover, more footwork.
  {"m":[[1]],"s":[
    [5,1,"o","whitefire"],[6,10,"o","whitefire"],
    [5,5,"o","pit"],[6,5,"o","pit"],[5,6,"o","pit"],[6,6,"o","pit"],
    [2,3,"e","g"],[9,8,"e","g"],[2,8,"e","g"],
  ]},
  // Black Fire pair — two spinners on opposite corners instead of one
  // centerpiece, so their sweeps overlap and there's no longer a
  // permanently-safe corner to retreat to.
  {"m":[[1]],"s":[
    [1,1,"o","blackfire"],[10,10,"o","blackfire"],
    [10,1,"o","rock"],[1,10,"o","rock"],
    [5,5,"e","g"],[6,6,"e","g"],
  ],"f":LATE_FLOORS},
  // Green + Black together — the fan has a real gap to stand in, the spin
  // doesn't, so the safe lane keeps moving between the two of them.
  {"m":[[1,1]],"s":[
    [2,2,"o","greenfire"],[19,9,"o","greenfire"],
    [10,5,"o","blackfire"],[11,5,"o","blackfire"],
    [4,8,"e","g"],[17,2,"e","g"],[7,6,"e","g"],
  ],"f":LATE_FLOORS},
);

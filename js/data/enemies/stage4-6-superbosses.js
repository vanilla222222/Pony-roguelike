'use strict';
/* ============================================================
   data/enemies/stage4-6-superbosses.js — CONTENT GROUP 1 superbosses.

   One per stage, names fixed by the coordination doc:
     stage 4  Frozen Desert  floorNum 15-16  ->  ICE Agent DNB
     stage 5  Badlands       floorNum 17-18  ->  Mexico DNB
     stage 6  Beach          floorNum 19-20  ->  G5 DNB

   BESPOKE AI, deliberately. The established convention (see the
   C-branch / Phase-7a comments in superbosses.js) is that a superboss
   REUSES an existing aiBossXxx and differentiates on stats; the
   coordination doc explicitly leaves that call to the content pass for
   these ten marquee fights. Group 1 takes the other option: all three
   below have their own three-phase routine in js/systems/ai-stage4-6.js
   (bossIceAgentDnb / bossMexicoDnb / bossG5Dnb), each visibly changing
   shape mid-fight rather than looping one pattern, because these are
   their stage's signature encounter and stat-reuse would make them read
   as a bigger version of a boss the player just fought.

   REGISTRATION. superbosses.js declares `const SUPERBOSSES = {...}` and
   snapshots `const SUPERBOSS_LIST = Object.values(SUPERBOSSES)` on its
   last line — same shape as bosses.js — so this file does both halves:
   merge into SUPERBOSSES (game.js's floorNum dispatch reads
   `SUPERBOSSES.<id>`) and push into SUPERBOSS_LIST (bestiary and every
   other list-driven consumer read that).

   STILL NOT FLOOR-DISPATCHED. game.js's startFloor hard-codes floorNum
   -> superboss for the legacy routes only and sends every floorNum 15+
   to resolveGenericBoss. Wiring these three to floorNum 16 / 18 / 20 is
   a game.js edit, and game.js is outside this group's file ownership —
   see the audit's open-risks section. The entries exist, register and
   resolve correctly; only the floor hook is missing.

   STATS. `hp` is identity against entities.js's bossHpScale
   (1.36^floorNum), NOT an absolute — authored inside the existing
   superboss band (60-79, see superbosses.js) rather than "floor 20
   sized", or the scaling applies twice. 66/68/70 puts them a clear step
   over Group 1's own regular bosses (46-60) and just past the legacy
   floor-5-to-9 superbosses (60-66), monotonically across the three
   stages. `dmg:4` is the hard ceiling — combat-1.js's playerDamageAmount
   clamps a single source at 4 (8 half hearts) — so it is the one stat
   where these sit above the stage bosses' 3 and cannot go higher.
   ============================================================ */
const STAGE4_6_SUPERBOSSES = {
  iceagent: { id:'iceagent', name:'ICE Agent DNB', hp:66, dmg:4, speed:86, radius:29,
    color:'#bcd4e0', dark:'#5e6e7a', behavior:'bossIceAgentDnb', icon:'🧊',
    desc:'Frozen Desert’s apex. Runs a three-phase raid: pursuit dashes behind a cone of frost, then four corner blinks it is untouchable through, then a stationary counter-rotating double spiral — with a hound wave at 60% and mirages at 30%.' },
  mexico:   { id:'mexico', name:'Mexico DNB', hp:68, dmg:4, speed:88, radius:30,
    color:'#b07a44', dark:'#5c3d20', behavior:'bossMexicoDnb', icon:'🌵',
    desc:'Badlands’ apex, and a gunslinger to the bone: six fast rounds, a stationary reload that is your entire damage window, then three cross-room stampede charges laying grit rings. Bandits at 60%, haulers at 30%.' },
  g5:       { id:'g5', name:'G5 DNB', hp:70, dmg:4, speed:90, radius:30,
    color:'#3ac9c9', dark:'#186262', behavior:'bossG5Dnb', icon:'🏖️',
    desc:'The hardest fight in Group 1. Cycles a rotating five-point star barrage, jetwash passes that shove you and leave surf walls in their wake, and an undertow phase that drags you in while pulsing tight rings.' },
};
Object.assign(SUPERBOSSES, STAGE4_6_SUPERBOSSES);
SUPERBOSS_LIST.push(...Object.values(STAGE4_6_SUPERBOSSES));

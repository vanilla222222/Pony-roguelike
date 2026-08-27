'use strict';
/* ============================================================
   data/enemies/stage10-13-bosses.js — CONTENT GROUP 3 regular bosses.

   Four bosses per stage, sixteen in all, for the four deepest stages
   of the extended main route:
     stage 10  Trench Depths  floorNum 27-28
     stage 11  Deep Dark      floorNum 29-30
     stage 12  Meta Realm     floorNum 31-32
     stage 13  Hyperspace     floorNum 33-34
   room.js's resolveGenericBoss picks uniformly inside a stage, so with
   four candidates each the player meets all of these often — every one
   below is a mechanic no other boss in the table has, not a re-tuned
   dash/ring/stomp. The AI bodies are in systems/ai-stage10-13.js and
   register themselves into combat-3.js's ENEMY_BEHAVIOR_HANDLERS.

   REGISTRATION (both halves are required). bosses.js snapshots
   `BOSS_LIST = Object.values(BOSS_TYPES)` on its own last line, so a
   later file cannot rely on that snapshot: this file Object.assigns onto
   BOSS_TYPES (which id lookups read) *and* pushes onto BOSS_LIST (which
   resolveGenericBoss filters). `stage:` is the only thing that puts a
   boss on a floor.

   STAT CALIBRATION. `hp` here is IDENTITY, not an absolute: entities.js
   multiplies it by bossHpScale (1.36^floorNum), which at floorNum 27-34
   is already astronomically large, so authoring "floor 30 sized" numbers
   would apply the curve twice and produce an unkillable fight. These are
   therefore authored against the EXISTING tables — regular bosses run
   40-58 and superbosses 60-79 — as the tier that sits above every one of
   them without leaving the band: 60-64 for Trench Depths rising to 70-76
   for Hyperspace, with each stage's superboss (see
   stage10-13-superbosses.js) set clearly above its four bosses.
   `dmg` stays at 4 half-hearts, the cap combat-1.js's playerDamageAmount
   enforces on any single source.
   ============================================================ */
const STAGE10_13_BOSS_TYPES = {

  /* ---- STAGE 10 — TRENCH DEPTHS. Pressure bosses: they take the room
     away a piece at a time rather than chasing you around it. ---- */

  abyssalmaw: { id:'abyssalmaw', name:'The Abyssal Maw', hp:64, dmg:4, speed:62, radius:33,
    color:'#1e4460', dark:'#0a1b27', behavior:'g3BossAbyssalMaw', stage:10,
    desc:'The crush zone with teeth. It alternates a planted pressure ring with a committed lunge — and under half its bar it stops choosing and does both.' },
  crushchoir: { id:'crushchoir', name:'The Crush Choir', hp:60, dmg:4, speed:56, radius:29,
    color:'#3f7fc0', dark:'#1a3450', behavior:'g3BossCrushChoir', stage:10,
    desc:'It never comes to you. It closes ring after ring onto wherever you happen to be standing, and salts its own feet every third one so camping it is not free.' },
  hadalanchor: { id:'hadalanchor', name:'The Hadal Anchor', hp:68, dmg:4, speed:38, radius:36,
    color:'#2c3a44', dark:'#12181d', behavior:'g3BossHadalAnchor', stage:10,
    desc:'A fortress that fires a turning cross and hauls itself across the room whenever you get comfortable. Below a third it lets go of the floor entirely.' },
  venttyrant: { id:'venttyrant', name:'The Vent Tyrant', hp:62, dmg:4, speed:52, radius:31,
    color:'#16324a', dark:'#081522', behavior:'g3BossVentTyrant', burstRadius:64, stage:10,
    desc:'Fights by remodelling the seabed. Three marks at a time while it is healthy, five when it is not, and one of them is always underneath you.' },

  /* ---- STAGE 11 — DEEP DARK. Information bosses: what they cost you
     is knowing where they are. ---- */

  unlitthing: { id:'unlitthing', name:'The Unlit Thing', hp:64, dmg:4, speed:76, radius:30,
    color:'#101018', dark:'#050508', behavior:'g3BossUnlit', stage:11,
    desc:'Invisible and untouchable except in the second and a half after it strikes. Every surfacing is announced by a ring — learn the ring or fight a rumour.' },
  longquiet: { id:'longquiet', name:'The Long Quiet', hp:66, dmg:4, speed:44, radius:32,
    color:'#2f5f8a', dark:'#132738', behavior:'g3BossLongQuiet', stage:11,
    desc:'Utterly inert while you move, and it opens wider with every second you hold still. Its escorts want the opposite, so the room forces you to alternate.' },
  blindhunter: { id:'blindhunter', name:'The Blind Hunter', hp:63, dmg:4, speed:88, radius:29,
    color:'#26283a', dark:'#0f1019', behavior:'g3BossBlindHunter', stage:11,
    desc:'It hunts by sound, and it commits: the charge is aimed where you were when it started and never corrected. Bait it, then simply not be there.' },
  gloomweaver: { id:'gloomweaver', name:'The Gloomweaver', hp:67, dmg:4, speed:50, radius:31,
    color:'#1c2430', dark:'#0a0e13', behavior:'g3BossGloomweaver', stage:11,
    desc:'Does not aim. Fills. Rotating spokes of bolts that live for seven seconds, until the room has no comfortable corner left, and it blinks away the moment you find one.' },

  /* ---- STAGE 12 — META REALM. Bosses that break the game's own rules,
     one rule apiece. ---- */

  patchnotes: { id:'patchnotes', name:'Patch Notes', hp:69, dmg:4, speed:66, radius:31,
    color:'#00ffa8', dark:'#00593a', behavior:'g3BossPatchNotes', stage:12,
    desc:'v1.0 is an ordinary fight. v1.1 reworks its movement to teleports, v1.2 moves its projectiles off-screen, and v1.3 is filed as a known issue.' },
  nullpointer: { id:'nullpointer', name:'Null Pointer', hp:66, dmg:4, speed:78, radius:29,
    color:'#0e1418', dark:'#04060a', behavior:'g3BossNullPointer', stage:12,
    desc:'Spends half the fight not existing, and cannot be touched while it does not. A damage-window race, announced both ways by a ring.' },
  renderghost: { id:'renderghost', name:'The Render Ghost', hp:73, dmg:4, speed:40, radius:35,
    color:'#ff00ff', dark:'#6a006a', behavior:'g3BossRenderGhost', stage:12,
    desc:'Untextured, unhurried, and walking through every wall between it and you in a dead straight line. It deletes a piece of cover now and then to make the point.' },
  authorsmargin: { id:'authorsmargin', name:"The Author's Margin", hp:70, dmg:4, speed:60, radius:32,
    color:'#c0ffe0', dark:'#4a6a5c', behavior:'g3BossAuthorsMargin', burstRadius:60, stage:12,
    desc:'It edits the arena instead of attacking it: a line of marks walked straight through where you are standing, while it mirrors you across the room.' },

  /* ---- STAGE 13 — HYPERSPACE. The last regular bosses in the game.
     Faster, denser, and each one a partial dress rehearsal for
     The One True Kirkinator on floorNum 34. ---- */

  foldline: { id:'foldline', name:'The Fold Line', hp:72, dmg:4, speed:58, radius:32,
    color:'#ff4fd8', dark:'#5c1a4c', behavior:'g3BossFoldLine', stage:13,
    desc:'Crossing walls with a single seam, and it folds itself across the room between volleys so the seam is never twice on the same side.' },
  eventhorizon: { id:'eventhorizon', name:'The Event Horizon', hp:74, dmg:4, speed:54, radius:34,
    color:'#2a1a4a', dark:'#100a20', behavior:'g3BossEventHorizon', stage:13,
    desc:'Everything it does converges, and it closes the distance the whole time it does it. The safe ring shrinks on both axes at once.' },
  lightyear: { id:'lightyear', name:'Light Year', hp:70, dmg:4, speed:102, radius:29,
    color:'#ffd44f', dark:'#6a5410', behavior:'g3BossLightYear', stage:13,
    desc:'Pure velocity: three chained passes across the arena, a ring dropped on each arrival, and one full second stood still afterwards. That second is the fight.' },
  lastexit: { id:'lastexit', name:'The Last Exit', hp:76, dmg:4, speed:50, radius:34,
    color:'#ff8adf', dark:'#4a1440', behavior:'g3BossLastExit', stage:13,
    desc:'The final ordinary boss of the run, and a rehearsal for what waits below it: a six-arm sweep that never stops, collapses punched through it, and a third layer once it is wounded.' },
};
Object.assign(BOSS_TYPES, STAGE10_13_BOSS_TYPES);
BOSS_LIST.push(...Object.values(STAGE10_13_BOSS_TYPES));

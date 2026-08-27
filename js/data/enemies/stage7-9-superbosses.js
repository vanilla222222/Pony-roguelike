'use strict';
/* ============================================================
   data/enemies/stage7-9-superbosses.js — CONTENT GROUP 2 superbosses.

   One per stage:
     stage 7  Ocean          floorNum 21-22  ->  Japan DNB
     stage 8  The Sea Floor  floorNum 23-24  ->  DeanNB
     stage 9  Trench         floorNum 25-26  ->  Israel DNB Prime Prime

   REGISTRATION — both halves required, same reason as the boss file:
   superbosses.js snapshots SUPERBOSS_LIST on its last line, so this file
   Object.assigns onto SUPERBOSSES *and* pushes onto SUPERBOSS_LIST.

   BESPOKE AI — A DELIBERATE DEPARTURE FROM CONVENTION. Every superboss
   set to date (the C-branch block and the Phase 7a block in
   superbosses.js both say so explicitly) reuses an existing aiBossXxx
   and differentiates on stats. These three do not: each has its own
   multi-phase routine in js/systems/ai-stage7-9.js. The coordination
   doc left that call to the content implementers, and these are the
   three signature fights of the group's stages, so stat-reuse would
   have made them read as recoloured regular bosses.

   Each runs HP-banded phases with an explicit do-nothing beat on every
   transition — the readability trick aiBossOneTrueDnb already uses, so
   a band change is always visible before it is lethal.

   STAT CALIBRATION. `hp` is identity and gets bossHpScale (1.36^floorNum
   — roughly 1100x at floorNum 21, 3800x at floorNum 26) applied on top
   by entities.js. These sit just above the existing superboss band
   (60-79, topping out at Kirk DNB's 78) rather than at "floor 25 sized"
   numbers, which would scale twice and be unkillable. `dmg` stays at 4:
   playerDamageAmount hard-caps a single source there, and bossDmgScale
   is applied on top of it as well.

   NOT YET FLOOR-DISPATCHED. game.js's startFloor hard-codes floorNum ->
   superboss for the legacy route only and sends every floorNum 15+ to
   resolveGenericBoss. These three register into SUPERBOSSES /
   SUPERBOSS_LIST and are reachable by id, but wiring them to floors 22 /
   24 / 26 is a game.js edit and game.js is outside this group's file
   ownership — see the group audit's open-risks section.

   `israelprimeprime` continues the israel -> israelprime line and is the
   first of the three with AI of its own; the two existing ids are
   untouched.
   ============================================================ */
const STAGE7_9_SUPERBOSSES = {

  japan: { id:'japan', name:'Japan DNB', hp:82, dmg:4, speed:86, radius:32,
    color:'#4fa8d6', dark:'#1f5b80', behavior:'bossJapanDnb', icon:'🌊',
    desc:'Four phases over a rising tide — the pull grows band by band while the patterns tighten. RISING SUN throws wide alternating fans; TSUNAMI walls the room with one walking gap; RIPTIDE crosses in dashes that leave swells behind them; TYPHOON stops moving almost entirely and lets the room do the work.' },

  deannb: { id:'deannb', name:'DeanNB', hp:85, dmg:4, speed:80, radius:33,
    color:'#7ae0c0', dark:'#2c6a58', behavior:'bossDeanNb', burstRadius:60, icon:'🐚',
    desc:'The light is the whole fight. DeanNB is only hittable during its LIT half, and the lit half gets shorter every phase; the dark half is armoured, anchored, and fills the floor with slow bioluminescent walls. Lantern shoals keep the dark from ever being idle time.' },

  israelprimeprime: { id:'israelprimeprime', name:'Israel DNB Prime Prime', hp:88, dmg:4, speed:90, radius:33,
    color:'#1e4a6a', dark:'#0c2434', behavior:'bossIsraelPrimePrime', burstRadius:56, icon:'✡️',
    desc:'Five bands, and it never walks anywhere — it blinks, faster each phase, leaving a parting ring at the spot it left. Cross beams give way to counter-rotating spirals, then columns marching inward, then walls with one gap, and finally every pattern at once at half density.' },
};
Object.assign(SUPERBOSSES, STAGE7_9_SUPERBOSSES);
SUPERBOSS_LIST.push(...Object.values(STAGE7_9_SUPERBOSSES));

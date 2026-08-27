'use strict';
/* ============================================================
   data/enemies/stage7-9-bosses.js — CONTENT GROUP 2 regular bosses.

   Stages 7-9 (Ocean / The Sea Floor / Trench, floorNum 21-26).
   12 entries, 4 per stage, each with its own bespoke aiBossXxx routine
   in js/systems/ai-stage7-9.js — none of them reuse an existing boss
   behavior, and none of them required an edit to combat-3.js's dispatch
   switch (they register through ENEMY_BEHAVIOR_HANDLERS instead).

   REGISTRATION — both halves are required. bosses.js snapshots
   `const BOSS_LIST = Object.values(BOSS_TYPES)` on its own last line, so
   a later file can neither rely on that snapshot nor re-declare the
   const. This file therefore declares a local object, Object.assigns it
   onto BOSS_TYPES (for id lookups) AND pushes its values onto BOSS_LIST
   (which is what room.js's resolveGenericBoss actually filters).

   STAT CALIBRATION. `hp` is identity: entities.js multiplies it by
   bossHpScale(floorNum) = 1.36^floorNum, which is already ~1100x at
   floorNum 21 and ~3800x at floorNum 26. These are authored against the
   EXISTING boss band (stages 0-3 sit at hp 40-58) plus a deliberate
   step, NOT against "floor 25 sized" numbers — the curve is applied on
   top, once, by the constructor.
   `dmg` is capped at 4 by combat-1.js's playerDamageAmount and bosses
   additionally get bossDmgScale on top, so every entry here sits at 3-4
   and the difficulty lives in the patterns.

   `burstRadius` is REQUIRED on any boss whose AoE lands away from its
   own body — render.js's drawEnemy sizes the ground-target marker off
   it, and an unmarked delayed blast is an unfair one. The four bosses
   here that use s79Pyre-style delayed ground bursts all carry it.
   ============================================================ */
const STAGE7_9_BOSS_TYPES = {

  /* ---- STAGE 7 — OCEAN (floorNum 21-22) ------------------------
     Four readings of "the water moves you": a three-beat tide bar, a
     permanent spiral over a pull, a submerged crossing, and an
     artillery boss with an escort. ------------------------------- */

  tidecaller: { id:'tidecaller', name:'The Tide Caller', hp:60, dmg:3, speed:78, radius:29,
    color:'#4fa8d6', dark:'#1f5b80', behavior:'bossTideCaller', stage:7,
    desc:'Beats a three-part bar: an offset ring, a wide aimed fan, then a full-room tide that hauls you toward it for a second and a half while it stands there and fires nothing at all.' },

  maelstrom: { id:'maelstrom', name:'The Maelstrom', hp:58, dmg:3, speed:52, radius:31,
    color:'#2e8ab0', dark:'#123c52', behavior:'bossMaelstrom', stage:7,
    desc:'A two-armed spiral that never stops turning, over a constant inward drag. There is no safe place to stand, only a correct direction to walk: with the spin, against the pull. Below half health it grows a third arm.' },

  leviathanwake: { id:'leviathanwake', name:'The Leviathan Wake', hp:64, dmg:3, speed:74, radius:32,
    color:'#1f5b80', dark:'#0c2c40', behavior:'bossLeviathanWake', burstRadius:62, stage:7,
    desc:'Dives untouchable, crosses the room underneath, and surfaces in a burst. The wake it leaves swells a beat later along the entire line it travelled, so the crossing is a wall and not a dodge.' },

  belldiver: { id:'belldiver', name:'The Bell Diver', hp:62, dmg:3, speed:56, radius:30,
    color:'#8a9aa8', dark:'#424c56', behavior:'bossBellDiver', burstRadius:58, stage:7,
    desc:'Artillery with an escort. It seeds bubble mines around itself on a long clock and walks depth charges onto your feet in between, so you are never fighting only the boss.' },

  /* ---- STAGE 8 — THE SEA FLOOR (floorNum 23-24) ----------------
     Concealment and windows: a burrower, a light/dark cycle, a
     pressure engine and a shell that closes when hurt. --------- */

  siltmonarch: { id:'siltmonarch', name:'The Silt Monarch', hp:66, dmg:3, speed:70, radius:31,
    color:'#a89a7a', dark:'#544c3c', behavior:'bossSiltMonarch', burstRadius:78, stage:8,
    desc:'Above the silt it is a slow, dense ring of thrown grit. Below it, it is untouchable and hunting — and it erupts a geyser at whatever spot it chooses to surface on.' },

  lanternqueen: { id:'lanternqueen', name:'The Lantern Queen', hp:64, dmg:3, speed:84, radius:29,
    color:'#7ae0c0', dark:'#2c6a58', behavior:'bossLanternQueen', stage:8,
    desc:'Lit, she hunts you and fires fast aimed pairs. Dark, she is armoured, anchored, and rings the room with slow walls of light around one rotating gap. Damage only lands in the light.' },

  pressurehulk: { id:'pressurehulk', name:'The Pressure Hulk', hp:72, dmg:4, speed:38, radius:34,
    color:'#4a6a7a', dark:'#22343c', behavior:'bossPressureHulk', stage:8,
    desc:'Fights entirely in shockwaves: three rings back to back, each faster and rotated off the last so the gaps never line up, then a long exhausted window that is the whole fight\'s damage.' },

  eldernautilus: { id:'eldernautilus', name:'The Elder Nautilus', hp:68, dmg:3, speed:76, radius:30,
    color:'#c0a8e0', dark:'#5c4a7a', behavior:'bossElderNautilus', stage:8,
    desc:'Out of the shell it walks a tight orbit, firing along the tangent. Withdrawn it is armoured and spins a double spiral. It swaps on damage taken rather than on a clock, so burst forces the defensive half.' },

  /* ---- STAGE 9 — TRENCH (floorNum 25-26) ----------------------
     The room itself is the weapon: sweeping beams, closing rings,
     erupting columns and a boss that pulls you into its bite. ---- */

  hadalwarden: { id:'hadalwarden', name:'The Hadal Warden', hp:74, dmg:4, speed:70, radius:31,
    color:'#5ae0ff', dark:'#1e5a70', behavior:'bossHadalWarden', stage:9,
    desc:'Plants itself and walks a four-armed cross around the room in fast steps. The arms rotate the whole time, so the safe wedges travel and the room shrinks with every pass. Under 40% it sweeps faster and for longer.' },

  thecrush: { id:'thecrush', name:'The Crush', hp:78, dmg:4, speed:88, radius:32,
    color:'#8a3a4a', dark:'#421c24', behavior:'bossTheCrush', stage:9,
    desc:'Fires nothing at all until it decides to squeeze — and then a ring closes on the entire room with exactly one moving gap in it, opening away from you on purpose. Between squeezes it just walks you down, fast.' },

  smokercolossus: { id:'smokercolossus', name:'The Black Smoker Colossus', hp:80, dmg:4, speed:34, radius:35,
    color:'#2a2a32', dark:'#101016', behavior:'bossSmokerColossus', burstRadius:54, stage:9,
    desc:'Never chases. It erupts delayed column fields in widening rings or walks a line of them straight at you, and keeps a permanent trickle of vents coming, so the pressure is on the room rather than on your position.' },

  trenchmaw: { id:'trenchmaw', name:'The Trenchmaw', hp:76, dmg:4, speed:80, radius:33,
    color:'#6a1e30', dark:'#320e18', behavior:'bossTrenchmaw', stage:9,
    desc:'The trench\'s apex predator drags you toward it for the entire fight. Its bite is a committed two-part run: a wind-up where the pull doubles, then a straight charge that ends in a cone.' },
};
Object.assign(BOSS_TYPES, STAGE7_9_BOSS_TYPES);
BOSS_LIST.push(...Object.values(STAGE7_9_BOSS_TYPES));

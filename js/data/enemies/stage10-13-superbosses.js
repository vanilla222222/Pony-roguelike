'use strict';
/* ============================================================
   data/enemies/stage10-13-superbosses.js — CONTENT GROUP 3 superbosses.

   One superboss per stage, the four deepest in the game:
     stage 10  Trench Depths  floorNum 27-28  ->  Palestine DNB
     stage 11  Deep Dark      floorNum 29-30  ->  Warden DNB
     stage 12  Meta Realm     floorNum 31-32  ->  Notch DNB
     stage 13  Hyperspace     floorNum 33-34  ->  The One True Kirkinator

   THE ONE TRUE KIRKINATOR sits on floorNum 34 (MAIN_ROUTE_FINAL_FLOOR),
   the extended main route's ending — the run's true final boss, reached
   only by clearing every one of the thirty-four floors above it. It is
   authored as the single hardest fight in the game: five HP bands plus a
   sixth layered "everything at once" state, three minion waves, and the
   heaviest stat line in any of these tables.

   BESPOKE AI, ON PURPOSE. The established convention (see the C-branch
   and Phase 7a comment blocks in superbosses.js) is that a superboss may
   reuse an existing aiBossXxx and differentiate on stats. All four here
   deliberately do NOT: each has its own routine in
   systems/ai-stage10-13.js, registered through combat-3.js's
   ENEMY_BEHAVIOR_HANDLERS. These four close out the main route, and a
   restatted Eclipse Wraith is not an ending.

   REGISTRATION. Two halves, both required, exactly like the boss file:
   Object.assign onto SUPERBOSSES (what id lookups read) *and* push onto
   SUPERBOSS_LIST (what the bestiary and roster filters read), because
   superbosses.js snapshots that list on its own last line.

   STAT CALIBRATION. `hp` is IDENTITY — entities.js multiplies it by
   bossHpScale (1.36^floorNum), enormous at floorNum 27-34 — so these are
   authored against the EXISTING superboss band (60-79, topping out at
   Kirk DNB's 78 and The Singularity's 79), not at "floor 30 scale". Each
   sits clearly above its own stage's four regular bosses (60-76, see
   stage10-13-bosses.js) and the four ramp upward across the group, with
   The One True Kirkinator at 96 — the highest authored number in the
   game, and the only one that has any business being there.
   `dmg` is 4 half-hearts for all four: playerDamageAmount caps a single
   source at 4 regardless, so anything higher is silently discarded.

   NOT YET FLOOR-DISPATCHED. game.js's startFloor hard-codes floorNum ->
   superboss for the legacy route only and sends every floorNum 15+ to
   resolveGenericBoss. Wiring these four (and Groups 1 and 2's six) to
   their floors is a single shared edit in game.js that no content group
   owns — see this group's audit for the exact lines it needs.
   ============================================================ */
const STAGE10_13_SUPERBOSSES = {
  palestine:  { id:'palestine', name:'Palestine DNB', hp:84, dmg:4, speed:68, radius:34,
    color:'#16324a', dark:'#0a1824', behavior:'g3SbPalestine', icon:'🕊️',
    desc:'THE CRUSH. Three bands, and each one takes another piece of the floor: rings that collapse onto you, a turning pressure cross layered over them, and finally both at once with a lunge threaded through. It barely leaves the middle of the room — this fight is about where you are allowed to stand.' },
  warden:     { id:'warden', name:'Warden DNB', hp:88, dmg:4, speed:72, radius:33,
    color:'#101018', dark:'#08080c', behavior:'g3SbWarden', icon:'🔒',
    desc:'THE LOCKDOWN. Unlit and untouchable, sweeping a searchlight around itself and mining the dark behind it. The only way to open a damage window is to let the beam find you — so the whole fight has to be walked into on purpose.' },
  notch:      { id:'notch', name:'Notch DNB', hp:92, dmg:4, speed:80, radius:33,
    color:'#5ae08a', dark:'#1e6a3a', behavior:'g3SbNotch', icon:'⛏️',
    desc:'THE BUILDER. It places lattice, deletes the cover you are hiding behind, and rewinds itself out of trouble whenever the exchange goes badly. Under a quarter of its bar it stops pretending to be a creature and simply strips the arena to bare floor.' },
  kirkinator: { id:'kirkinator', name:'The One True Kirkinator', hp:96, dmg:4, speed:92, radius:37,
    color:'#ff4fd8', dark:'#5c1050', behavior:'g3SbKirkinator', icon:'🌀',
    desc:'THE LAST EXIT. Thirty-four floors end here. Five bands — folds, collapses, lances, a pulsar sweep — and then a sixth state where the sweep never stops and the other three take turns punching through it. Every band change is one ring and one full second of stillness, because you deserve to be told the rules changed. Nothing in the game is deeper than this.' },
};
Object.assign(SUPERBOSSES, STAGE10_13_SUPERBOSSES);
SUPERBOSS_LIST.push(...Object.values(STAGE10_13_SUPERBOSSES));

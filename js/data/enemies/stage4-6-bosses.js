'use strict';
/* ============================================================
   data/enemies/stage4-6-bosses.js — CONTENT GROUP 1 regular bosses.

   Stages 4-6 (Frozen Desert / Badlands / Beach, floorNum 15-20), four
   bosses each, twelve total. Every one has its own aiBossXxx in
   js/systems/ai-stage4-6.js, published into ENEMY_BEHAVIOR_HANDLERS by
   name — nothing here touches combat-3.js's dispatch switch.

   REGISTRATION. bosses.js declares `const BOSS_TYPES = {...}` and then
   snapshots `const BOSS_LIST = Object.values(BOSS_TYPES)` on its last
   line, so a file loading after it must do BOTH halves by hand: merge
   into BOSS_TYPES (so id lookups resolve) and push into BOSS_LIST (so
   room.js's resolveGenericBoss, which filters BOSS_LIST by `stage`,
   can actually draw them). Keep this two-step shape.

   STATS. `hp` is identity on entities.js's boss curve (bossHpScale =
   1.36^floorNum), which at floorNum 15-20 is already 100x+ — so these
   are authored against the EXISTING boss table's 44-62 band, not
   against their own depth. Stage 4 runs 46-52, stage 5 50-56, stage 6
   54-60: above the legacy stage-0-3 bosses at every slot, monotonically
   increasing across the three stages, and still inside the band the
   curve was fitted for. `dmg` is half-hearts against combat-1.js's cap
   of 4; 3 is the ceiling used here so the superbosses' 4 still reads as
   a step up. Difficulty comes from the phase patterns instead.
   ============================================================ */
const STAGE4_6_BOSS_TYPES = {

  // ---- stage 4 (Frozen Desert) ----
  fdhoarfrostcolossus: { id:'fdhoarfrostcolossus', name:'The Hoarfrost Colossus', hp:50, dmg:3, speed:62, radius:27,
    color:'#bcd4e0', dark:'#5e6e7a', behavior:'bossFdHoarfrost', burstRadius:150, stage:4,
    desc:'A slam-and-ring bruiser. Alternates an enormous telegraphed ground slam with a rotating shard ring, and whistles up a pack of hounds at half health.' },
  fdwhiteout: { id:'fdwhiteout', name:'The Whiteout', hp:46, dmg:3, speed:80, radius:23,
    color:'#eef8ff', dark:'#93a6b4', behavior:'bossFdWhiteout', stage:4,
    desc:'Vanishes into the storm, reappears somewhere else and spirals bolts outward. There is nothing to hit while the storm is up.' },
  fdpermafrostwyrm: { id:'fdpermafrostwyrm', name:'The Permafrost Wyrm', hp:52, dmg:3, speed:70, radius:29,
    color:'#9fd4ea', dark:'#356070', behavior:'bossFdPermafrostWyrm', burstRadius:96, stage:4,
    desc:'Burrows under the dunes and surfaces directly beneath you, each surfacing throwing a wider ring of shards than the last.' },
  fdsleetmarshal: { id:'fdsleetmarshal', name:'The Sleet Marshal', hp:48, dmg:3, speed:84, radius:24,
    color:'#8fb4cc', dark:'#3c5464', behavior:'bossFdSleetMarshal', stage:4,
    desc:'A three-dash combo with a bolt volley fired at the start of every dash, capped by a full ring and a recovery you can actually punish.' },

  // ---- stage 5 (Badlands) ----
  blmesatyrant: { id:'blmesatyrant', name:'The Mesa Tyrant', hp:56, dmg:3, speed:58, radius:31,
    color:'#8a6a4a', dark:'#3e3020', behavior:'bossBlMesaTyrant', burstRadius:88, stage:5,
    desc:'Long straight charges wall to wall, with lobbed rock impacts in between. The charge is the only thing in the fight that can corner you.' },
  bldustdevilprime: { id:'bldustdevilprime', name:'Dust Devil Prime', hp:50, dmg:3, speed:88, radius:25,
    color:'#c9a86a', dark:'#6a5230', behavior:'bossBlDustDevilPrime', stage:5,
    desc:'Orbits at speed while dragging you inward the whole time, then stalls to unload a full spiral into the space it just pulled you into.' },
  blbuzzardking: { id:'blbuzzardking', name:'The Buzzard King', hp:52, dmg:3, speed:90, radius:26,
    color:'#7a6a58', dark:'#3a3028', behavior:'bossBlBuzzardKing', stage:5,
    desc:'Circles out of reach, dives at where you were, and sheds a feather fan at the apex of every climb.' },
  blrattleback: { id:'blrattleback', name:'Rattleback', hp:54, dmg:3, speed:72, radius:28,
    color:'#a8894a', dark:'#54401c', behavior:'bossBlRattleback', stage:5,
    desc:'A chain of three burrow-lunges along your axis, capped by a full grit ring the moment the chain ends.' },

  // ---- stage 6 (Beach) ----
  bctidewarden: { id:'bctidewarden', name:'The Tide Warden', hp:58, dmg:3, speed:60, radius:30,
    color:'#4fa8d6', dark:'#25597a', behavior:'bossBcTideWarden', stage:6,
    desc:'Walls of surf sweeping the room on a metronome, with a slow relentless walk underneath them. Every wave has exactly one gap, and it is always dead centre.' },
  bccrabking: { id:'bccrabking', name:'The Crab King', hp:60, dmg:3, speed:66, radius:32,
    color:'#e08a6a', dark:'#763c28', behavior:'bossBcCrabKing', burstRadius:132, stage:6,
    desc:'Sidles instead of walking, slams both claws for a wide shockwave, and shells up between slams so the punish window is short.' },
  bcgulltyrant: { id:'bcgulltyrant', name:'The Gull Tyrant', hp:54, dmg:3, speed:96, radius:25,
    color:'#f4f4ea', dark:'#8a8a80', behavior:'bossBcGullTyrant', stage:6,
    desc:'Never lands. Strafing runs across the room that leave a trail of drops behind them, and it is always somewhere above you.' },
  bcjellysovereign: { id:'bcjellysovereign', name:'The Jelly Sovereign', hp:56, dmg:3, speed:40, radius:29,
    color:'#8fe0e8', dark:'#3a6a72', behavior:'bossBcJellySovereign', stage:6,
    desc:'Drifts, and pulses nested rings — an outer one first, then a counter-rotating inner one aimed straight through its gaps.' },
};
Object.assign(BOSS_TYPES, STAGE4_6_BOSS_TYPES);
BOSS_LIST.push(...Object.values(STAGE4_6_BOSS_TYPES));

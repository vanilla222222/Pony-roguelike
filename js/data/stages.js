'use strict';
/* ============================================================
   stages.js — floor themes: which stage/palette is active on
   which floor, and the floor 9A/9B branch palettes. Split out
   of data.js so retheming a stage doesn't mean scrolling past
   enemy/class/item tables.
   ============================================================ */

/* ---------------------------------------------------------------
   STAGES / FLOOR THEMES — the theme changes every 2 floors
   --------------------------------------------------------------- */
const STAGES = [
  {
    id:'crypt', name:'The Crypt',
    palette: {
      floorA:'#38363d', floorB:'#403e46', wall:'#242229', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#100f13', accent:'#9a958c',
    },
  },
  {
    id:'forest', name:'The Whitetail Forest',
    palette: {
      floorA:'#233420', floorB:'#293c26', wall:'#16241a', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#0e1a10', accent:'#7fbf6a',
    },
  },
  {
    id:'desert', name:'The Sandswept Dunes',
    palette: {
      floorA:'#4a3d24', floorB:'#54452a', wall:'#332a19', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#221b0f', accent:'#e0c374',
    },
  },
  {
    id:'inferno', name:'The Inferno',
    palette: {
      floorA:'#421a10', floorB:'#4f2013', wall:'#2c0f0a', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#180705', accent:'#e0592f',
    },
  },
  /* ---------------------------------------------------------------
     Phase 10 — the main route's ten NEW stages (indices 4-13), twenty
     floors past what used to be the finale (see OLD_MAIN_ROUTE_FINAL_FLOOR
     below). These are THEME/PALETTE scaffolding only: their enemy/boss
     rosters are a later content phase, and until those land the new floors
     draw from the generic fallback pools room.js already uses for any
     floorKey with no roster of its own.

     The arc runs cold desert -> broken badlands -> shoreline -> open water
     -> progressively deeper sea -> lightless depths -> outside the game's
     own fiction (Meta Realm) -> Hyperspace. Palettes follow the same
     "darker/more saturated the deeper it goes" rule the 9-15 palettes do,
     with the two final stages breaking to unnatural hues on purpose.
     --------------------------------------------------------------- */
  {
    id:'frozendesert', name:'The Frozen Desert',
    palette: {
      floorA:'#8fa4b0', floorB:'#9cb2be', wall:'#5c707c', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#3c4c56', accent:'#e8f4ff',
    },
  },
  {
    id:'badlands', name:'The Badlands',
    palette: {
      floorA:'#5a3a2a', floorB:'#674433', wall:'#3a2519', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#241610', accent:'#d98a4a',
    },
  },
  {
    id:'beach', name:'The Beach',
    palette: {
      floorA:'#d8c89a', floorB:'#e2d4a8', wall:'#9a8a5e', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#6e6040', accent:'#4fc8e0',
    },
  },
  {
    id:'ocean', name:'The Ocean',
    palette: {
      floorA:'#1e5a78', floorB:'#246a8a', wall:'#123a50', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#0a2230', accent:'#7fe8ff',
    },
  },
  {
    id:'seafloor', name:'The Sea Floor',
    palette: {
      floorA:'#1a4054', floorB:'#204c62', wall:'#0e2836', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#061620', accent:'#8ad4b0',
    },
  },
  {
    id:'trench', name:'The Trench',
    palette: {
      floorA:'#122c40', floorB:'#16344c', wall:'#081a28', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#040e16', accent:'#4fa8d8',
    },
  },
  {
    id:'trenchdepths', name:'The Trench Depths',
    palette: {
      floorA:'#0c1c2e', floorB:'#102338', wall:'#050f1c', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#02070e', accent:'#3f7fc0',
    },
  },
  {
    id:'deepdark', name:'The Deep Dark',
    palette: {
      floorA:'#080a12', floorB:'#0c0e18', wall:'#04050a', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#010204', accent:'#2f5f8a',
    },
  },
  {
    id:'metarealm', name:'The Meta Realm',
    palette: {
      floorA:'#1c1230', floorB:'#241740', wall:'#0e0820', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#050310', accent:'#00ffa8',
    },
  },
  {
    id:'hyperspace', name:'Hyperspace',
    palette: {
      floorA:'#12082a', floorB:'#180c38', wall:'#08041a', voidC:'#000',
      doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#03010c', accent:'#ff4fd8',
    },
  },
];
// stage id -> audio.js MUSIC_TRACKS id, for game.js's startFloor. Deliberately
// a separate small table rather than a `music` field on STAGES itself — most
// stages don't have a track yet, and this keeps "no track for this stage"
// (fall through to Sound.stopMusic()) a simple missing-key lookup rather
// than every STAGES entry needing an explicit `music:null`. Extend this as
// each stage gets a track (see audio.js's MUSIC_TRACKS for the tracks
// themselves).
const STAGE_MUSIC_TRACKS = {
  crypt:'crypt', forest:'forest', desert:'desert', inferno:'inferno',
  frozendesert:'frozendesert', badlands:'badlands', beach:'beach', ocean:'ocean',
  seafloor:'seafloor', trench:'trench', trenchdepths:'trenchdepths', deepdark:'deepdark',
  metarealm:'metarealm', hyperspace:'hyperspace',
};
// How many STAGES entries existed BEFORE Phase 10's ten new stages. The
// pre-existing floors 1-15 must keep resolving to exactly the stage they
// always did, so stageIndexForFloor() clamps to this (not STAGES.length)
// for anything at or below OLD_MAIN_ROUTE_FINAL_FLOOR.
const LEGACY_STAGE_COUNT = 4;
// stages bestiary (see bestiary.js) — same flat {id,name,icon,desc} shape as
// PICKUP_TYPE_LIST/ROOM_TYPE_LIST (data.js), just kept here next to STAGES
// itself instead of data.js. The C-branch has no stage of its own (it uses
// cPaletteFor, never STAGES), so it never shows up as "seen" here.
const STAGE_LIST = [
  { id:'crypt', name:'The Crypt', icon:'💀', desc:'Floors 1-2 — dusty catacombs and bone-strewn crypts.' },
  { id:'forest', name:'The Whitetail Forest', icon:'🌲', desc:'Floors 3-4 — overgrown woodland, sprouts and vines.' },
  { id:'desert', name:'The Sandswept Dunes', icon:'🏜️', desc:'Floors 5-6 — scorching dunes, sand traps and cacti.' },
  { id:'inferno', name:'The Inferno', icon:'🔥', desc:'Floors 7-8 — molten depths, the last floors before the run branches.' },
  // floors 9-12 split into a sticky A/B branch (see game.js's floorBranch) —
  // each floor-branch pair already has its own palette (BRANCH_PALETTES*
  // below) and its own enemy/boss rosters (floorKeyFor's '9A'/'9B'/etc keys,
  // see enemies.js) — these entries just give that existing split a bestiary
  // page. Floor 13 is the single floor both branches converge back into.
  { id:'9a', name:'The Final Reckoning — Branch A', icon:'🅰️', desc:'Floor 9, Branch A — one of two forks the run can take from here.' },
  { id:'9b', name:'The Final Reckoning — Branch B', icon:'🅱️', desc:'Floor 9, Branch B — the other fork.' },
  { id:'10a', name:'The Uncharted Reaches — Branch A', icon:'🅰️', desc:'Floor 10, Branch A.' },
  { id:'10b', name:'The Uncharted Reaches — Branch B', icon:'🅱️', desc:'Floor 10, Branch B.' },
  { id:'11a', name:'The Sunken Frequency — Branch A', icon:'🅰️', desc:'Floor 11, Branch A.' },
  { id:'11b', name:'The Sunken Frequency — Branch B', icon:'🅱️', desc:'Floor 11, Branch B.' },
  { id:'12a', name:'The Shattered Refrain — Branch A', icon:'🅰️', desc:'Floor 12, Branch A — one floor from the convergence.' },
  { id:'12b', name:'The Shattered Refrain — Branch B', icon:'🅱️', desc:'Floor 12, Branch B — one floor from the convergence.' },
  // Phase 7a — the main route gained two LINEAR (no A/B split) stages before
  // the convergence, so what used to be "floor 13, the finale" is now three
  // separate floors: 13 and 14 are new single-superboss stages (same shape as
  // Polish's floorNum 5 / Tyrone's floorNum 7, NOT the A/B-forked 9-12 shape),
  // and 15 is the unchanged One True Descent. The bestiary id '13' therefore
  // now names the NEW floor-13 stage; the finale moved to id '15'.
  { id:'13', name:'The Hollow Chorus', icon:'🕳️', desc:'Floor 13 — the branches have converged; the chorus sings with no voices left.' },
  { id:'14', name:'The Final Waveform', icon:'📉', desc:'Floor 14 — the last full bar before the descent bottoms out.' },
  { id:'15', name:'The One True Descent', icon:'🏁', desc:'Floor 15 — the final fight, whichever branch the run took to get here.' },
  // the C-branch's named regions (see C_PALETTES/cPaletteFor below) —
  // same deal, already-distinct palettes and floorKey-tagged rosters, just
  // never had a bestiary page of their own before now.
  { id:'gutters', name:'The Gutters', icon:'🌊', desc:'C-branch floors 3C-4C — flooded overflow channels.' },
  { id:'sewers', name:'The Sewers', icon:'💧', desc:'C-branch floors 5C-6C — the drowned mix, capped by Drenched DNB.' },
  { id:'rainforest', name:'The Rainforest', icon:'🌴', desc:'C-branch floors 7C-10C — canopy to the storm-lashed crown.' },
  // Phase 7a — the C-branch gained two floors before Kirk, and with them one
  // new region past the rainforest (11C/12C).
  { id:'mangroves', name:'The Mangroves', icon:'🌊', desc:'C-branch floors 11C-12C — brackish tidal roots, and Kirk’s last set.' },
  // Phase 7a — the D-branch (the Planetarium path, entered from a gate room on
  // floor 3 / floorNum 2). Three regions across 4D-10D, its own palettes
  // (D_PALETTES/dPaletteFor) and its own floorKey rosters ('4D'..'10D').
  { id:'observatory', name:'The Observatory', icon:'🔭', desc:'D-branch floors 4D-5D — dust-choked lenses under a broken dome.' },
  { id:'orrery', name:'The Orrery', icon:'🪐', desc:'D-branch floors 6D-7D — brass meridians turning a sky made of gears.' },
  { id:'voidbetween', name:'The Void Between', icon:'🌌', desc:'D-branch floors 8D-10D — the cold drift outside the machine, down to the last light.' },
];
const FLOORS_PER_STAGE = 2;
const BASE_MAX_FLOORS = 6; // run length before Polish DNB has ever been beaten
const FLOOR_NAMES = [
  'Crypt — Upper Catacombs', 'Crypt — Bone Vault',
  'Whitetail Forest — The Eaves', 'Everfree Depths',
  'Dune Sea — Sunburnt Flats', 'The DNB Hive Core',
  'The Inferno — Ashfall Gate', 'The Inferno — Brimstone Throne',
  'The Final Reckoning', 'The Uncharted Reaches',
  'The Sunken Frequency', 'The Shattered Refrain',
  // Phase 7a — floors 13 and 14 are two NEW linear stages (no A/B split; the
  // branch has already converged by here), each with a single superboss, in
  // exactly the shape floorNum 5/7 (Polish/Tyrone) already use. The One True
  // Descent moved down two floors to index 14 and is otherwise unchanged.
  'The Hollow Chorus', 'The Final Waveform',
  'The One True Descent',
  // ---- Phase 10 — twenty NEW main-route floors (index 15-34), two per new
  // STAGES entry (indices 4-13 above). Scaffolding only: no rosters yet.
  // Everything at or below index 14 is untouched, and floorNum 14 remains
  // where descend() still ends a main-route run until a later phase extends
  // it — see OLD_MAIN_ROUTE_FINAL_FLOOR below.
  'Frozen Desert — Rime Flats', 'Frozen Desert — The Drifts',
  'Badlands — Cracked Mesa', 'Badlands — The Rust Gulch',
  'Beach — Bleached Shore', 'Beach — The Tideline',
  'Ocean — The Shelf', 'Ocean — Open Water',
  'The Sea Floor — Silt Plains', 'The Sea Floor — The Wreck Field',
  'Trench — The Descent Wall', 'Trench — Cold Seep',
  'Trench Depths — Crush Zone', 'Trench Depths — The Black Vents',
  'Deep Dark — No Light Reaches', 'Deep Dark — The Long Quiet',
  'Meta Realm — Behind The Curtain', 'Meta Realm — The Author\'s Margin',
  'Hyperspace — Fold', 'Hyperspace — The Last Exit',
];
const MAX_FLOORS = FLOOR_NAMES.length; // absolute ceiling — floors 9-12 (index 8-11) are branches, floors 13/14 (index 12/13) are linear, floor 15 (index 14) is the finale, see game.js
// The main route's LAST floor before Phase 10 appended twenty more — floorNum
// 14, "The One True Descent". Everything that must behave exactly as it did
// before that append (stageIndexForFloor's clamp, dungeon.js's floorfeature
// gate, game.js's C-path unlock grant) keys off this constant rather than a
// literal 14, so the boundary can never drift out of sync.
const OLD_MAIN_ROUTE_FINAL_FLOOR = 14;
// The main route's TRUE last floor after the Phase 10 append — floorNum 34,
// "Hyperspace — The Last Exit" (HUD floor 35). Derived from MAX_FLOORS so it
// tracks FLOOR_NAMES automatically. This, and ONLY this, is what ends a Main
// path run now: game.js's descend() continues past OLD_MAIN_ROUTE_FINAL_FLOOR
// instead of winning there (the unlockPath('C') grant still fires at that
// older boundary, it just no longer coincides with the run's end).
const MAIN_ROUTE_FINAL_FLOOR = MAX_FLOORS - 1;

/* ---------------------------------------------------------------
   THE C-BRANCH — a whole alternate run, entered from a gate room that
   only generates on floor 2 (floorNum 1, see dungeon.js's 'cpathgate'
   special room). Taking it sets game.floorPath = 'C' permanently and
   restarts the descent at floorNum 2, which on this path is labelled
   "3C". It does NOT rejoin the normal path: killing Kirk DNB on 12C
   (floorNum 11) IS the run's ending, a second win condition.

   floorNum 2-11 therefore mean two completely different things
   depending on floorPath, which is why every floorNum-sensitive branch
   (descend, startFloor's pendingBossType chain, isLastFloorOfRun,
   currentPalette, floorKeyFor) checks floorPath === 'C' FIRST and
   never falls through to the normal chain.
   --------------------------------------------------------------- */
const C_FLOOR_NAMES = { // keyed by floorNum, NOT a dense array — see FLOOR_NAMES above for the normal path
  2:'Gutters — Overflow Channels', 3:'Gutters — The Silt Run',
  4:'Sewers — Effluent Mains', 5:'Sewers — The Drowned Mix',
  6:'Rainforest — Canopy Floor', 7:'Rainforest — Emerald Deep',
  8:'Rainforest — The Prime Grove', 9:'Rainforest — The Storm Canopy',
  // Phase 7a — two new C floors before Kirk. Kirk himself is unchanged in
  // every way except which floorNum he lives on: 10C -> 12C.
  10:'Mangroves — The Tangled Shallows', 11:'Mangroves — Kirk\'s Last Set',
};
const C_LAST_FLOORNUM = 11; // 12C — Kirk DNB, and the end of the run

/* ---------------------------------------------------------------
   THE D-BRANCH — the second alternate run (Phase 7a), entered from a
   'planetarium' gate room that only generates on floor 3 (floorNum 2, see
   dungeon.js). Taking it sets game.floorPath = 'D' permanently and
   restarts the descent at floorNum 3, which on this path is labelled
   "4D". Like the C-branch it never rejoins the normal path: killing the
   superboss on 10D (floorNum 9) IS the run's ending, a third win
   condition alongside floor 15's One True DNB and 12C's Kirk.

   Structurally this is a direct mirror of the C-branch — same object-
   keyed-by-floorNum tables, same "check floorPath FIRST and never fall
   through" rule in every floorNum-sensitive function. Its floorNum 3-9
   collide with BOTH the normal path's early/mid floors AND the
   C-branch's, which is exactly why the checks are early returns.
   --------------------------------------------------------------- */
const D_FLOOR_NAMES = { // keyed by floorNum 3-9, NOT a dense array — mirrors C_FLOOR_NAMES
  3:'Observatory — The Dust Lens', 4:'Observatory — The Broken Dome',
  5:'Orrery — Brass Meridians', 6:'Orrery — The Gear Sky',
  7:'The Void Between — Cold Drift', 8:'The Void Between — Event Shore',
  9:'The Void Between — The Last Light',
};
const D_LAST_FLOORNUM = 9; // 10D — the D-branch finale, and the end of the run

// UI label for a floor: "7" on a normal run, "7C" on the C-branch, "7D" on
// the D-branch. Both call sites (ui.js's HUD, main.js's death/win summaries)
// show floorNum + 1.
function floorLabelFor(floorNum, floorPath){
  if (floorPath === 'C') return (floorNum + 1) + 'C';
  if (floorPath === 'D') return (floorNum + 1) + 'D';
  return String(floorNum + 1);
}
function floorNameFor(floorNum, floorPath){
  if (floorPath === 'C') return C_FLOOR_NAMES[floorNum] || 'The Drowned Path';
  if (floorPath === 'D') return D_FLOOR_NAMES[floorNum] || 'The Starlit Path';
  return FLOOR_NAMES[floorNum];
}

// Phase 10 — two ranges, deliberately kept separate so nothing about the
// original floors changed. floorNum <= OLD_MAIN_ROUTE_FINAL_FLOOR resolves
// EXACTLY as it always did (clamped to the last of the original four stages,
// which is why floors 7-15 all still report the Inferno here — floors 9-15
// never used this function for their palette, they have their own tables).
// Past that boundary the same 2-floors-per-stage arithmetic continues into
// the new stage range 4-13, offset from the first new floor.
function stageIndexForFloor(floorNum){
  if (floorNum <= OLD_MAIN_ROUTE_FINAL_FLOOR) return Math.min(LEGACY_STAGE_COUNT - 1, Math.floor(floorNum / FLOORS_PER_STAGE));
  const offset = floorNum - (OLD_MAIN_ROUTE_FINAL_FLOOR + 1);
  return Math.min(STAGES.length - 1, LEGACY_STAGE_COUNT + Math.floor(offset / FLOORS_PER_STAGE));
}

// floorNum 8-11 (9A/9B, 10A/10B, 11A/11B, 12A/12B) can't be told apart by stageIndexForFloor
// alone — same floorNum, different branch — so anything that needs to pick
// branch-specific content for them (enemy/boss pools, see room.js's
// resolveGenericEnemy/resolveGenericBoss) keys off this string instead.
// Returns null for every other floor, meaning "use the normal stage pool".
// The C-branch reuses floorNum 2-9, so its key mapping has to be checked
// BEFORE the normal chain and must never fall through to it.
const C_FLOOR_KEYS = { 2:'3C', 3:'4C', 4:'5C', 5:'6C', 6:'7C', 7:'8C', 8:'9C', 9:'10C', 10:'11C', 11:'12C' };
const D_FLOOR_KEYS = { 3:'4D', 4:'5D', 5:'6D', 6:'7D', 7:'8D', 8:'9D', 9:'10D' };
function floorKeyFor(floorNum, branch, floorPath){
  if (floorPath === 'C') return C_FLOOR_KEYS[floorNum] || null;
  if (floorPath === 'D') return D_FLOOR_KEYS[floorNum] || null;
  if (floorNum === 8) return branch === 'B' ? '9B' : '9A';
  if (floorNum === 9) return branch === 'B' ? '10B' : '10A';
  if (floorNum === 10) return branch === 'B' ? '11B' : '11A';
  if (floorNum === 11) return branch === 'B' ? '12B' : '12A';
  // Phase 7a — floors 13/14/15 are all linear (the A/B branch has converged),
  // so each is a single key with no ternary. Their rosters are a later phase;
  // until those exist these keys resolve to empty pools, which room.js's
  // resolveGenericEnemy/resolveGenericBoss already handle by falling back to
  // the stage pool and then to any unlocked enemy.
  if (floorNum === 12) return '13';
  if (floorNum === 13) return '14';
  if (floorNum === 14) return '15'; // the finale
  return null;
}

// Branch-9 palettes — floor index 8 forks into 9A ("dark and cloudy") or 9B
// ("blue and white and brick") depending on game.floorBranch. Not part of the
// STAGES array since they don't follow the normal 2-floors-per-stage pattern.
const BRANCH_PALETTES = {
  A: {
    floorA:'#23242f', floorB:'#282a37', wall:'#15161e', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#0c0d12', accent:'#8a8ac9',
  },
  B: {
    floorA:'#3a4c60', floorB:'#425670', wall:'#20303e', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#18232d', accent:'#eef0ea',
  },
};

// Branch-10 palettes — floorNum 9, the continuation past 9A/9B (see
// game.js's descend/startFloor). 10A is icy (following the 9A path),
// 10B is jungle (following the 9B path) — see enemies.js's floorKey-tagged
// ENEMY_TYPES/BOSS_TYPES and SUPERBOSSES.algae/lilac for who lives here.
const BRANCH_PALETTES_10 = {
  A: { // 10A — icy tundra
    floorA:'#c8dce8', floorB:'#b0ccdc', wall:'#5a7a90', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#3a5468', accent:'#eaf6ff',
  },
  B: { // 10B — dense jungle
    floorA:'#1e3a24', floorB:'#24462a', wall:'#122a18', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#0c1a10', accent:'#7fe08a',
  },
};

// Floors 11/12/13 — the extended descent past 10A/10B. 11 and 12 stay
// branched (floorBranch is sticky from the floor-9 choice, so an A run never
// sees a B palette), and 13 converges: both branches end on the same floor,
// so FINAL_PALETTE is a plain flat palette rather than an A/B pair. The
// progression is deliberately darker and more saturated the deeper it goes,
// with the A-side staying cold/violet and the B-side staying warm/organic,
// same as the 9/10 pairs do.
const BRANCH_PALETTES_11 = {
  A: { // 11A — drowned abyss, cold and pressurised
    floorA:'#141a2e', floorB:'#19203a', wall:'#0b0f1e', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#05070f', accent:'#4f7fd8',
  },
  B: { // 11B — flooded overgrowth, sickly bioluminescent
    floorA:'#0d2a2e', floorB:'#113438', wall:'#06181c', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#030d10', accent:'#2fe0c4',
  },
};

const BRANCH_PALETTES_12 = {
  A: { // 12A — fractured violet, the refrain coming apart
    floorA:'#1c1030', floorB:'#23143c', wall:'#0f0820', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#070312', accent:'#b04ff0',
  },
  B: { // 12B — raw crimson, the refrain screaming
    floorA:'#2a0c1c', floorB:'#341024', wall:'#180410', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#0c0208', accent:'#ff3d7a',
  },
};

/* C-branch palettes — three themes across the branch's eight floors, and
   unlike the 9/10/11/12 pairs above there is NO A/B split on this path
   (floorBranch is never set on a C run), so these are flat palettes in the
   shape of FINAL_PALETTE rather than {A, B} pairs. Mapped in render.js's
   currentPalette: floorNum 2/3 -> gutters, 4/5 -> sewers, 6/7/8/9 ->
   rainforest (the rainforest run is four floors long because 9C and 10C
   were never given themes of their own — they keep the 7C/8C look and let
   their superbosses carry the escalation). */
const C_PALETTES = {
  gutters: { // 3C/4C — wet concrete and standing rainwater
    floorA:'#3a4038', floorB:'#434a40', wall:'#22271f', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#141812', accent:'#8fb8a0',
  },
  sewers: { // 5C/6C — algae-slick brick under sodium light
    floorA:'#2a3428', floorB:'#31402e', wall:'#161f16', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#0a1009', accent:'#b8d44a',
  },
  rainforest: { // 7C-10C — deep, wet, overgrown green
    floorA:'#123020', floorB:'#173a26', wall:'#0a1e14', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#050f0a', accent:'#4fe08a',
  },
  // Phase 7a — the two new C floors (11C/12C) get a region of their own rather
  // than stretching the rainforest to six floors: brackish tidal water and
  // bleached root wood, the drowned path finally reaching the sea.
  mangroves: { // 11C/12C — silt-brown water under pale, salt-bleached roots
    floorA:'#2a2a1e', floorB:'#333424', wall:'#181a12', voidC:'#000',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#0a0b07', accent:'#d8c88a',
  },
};
function cPaletteFor(floorNum){
  if (floorNum <= 3) return C_PALETTES.gutters;    // 3C, 4C
  if (floorNum <= 5) return C_PALETTES.sewers;     // 5C, 6C
  if (floorNum <= 9) return C_PALETTES.rainforest; // 7C, 8C, 9C, 10C
  return C_PALETTES.mangroves;                     // 11C, 12C
}
// C-branch background music — the audio equivalent of C_PALETTES/
// cPaletteFor above: one audio.js MUSIC_TRACKS id per region, same four
// region names and the same floorNum split as cPaletteFor (kept as two
// separate lookups, exactly like STAGE_MUSIC_TRACKS is separate from
// STAGES, rather than folding music into C_PALETTES itself). See
// game.js's startFloor for the call site.
const C_MUSIC_TRACKS = { gutters:'gutters', sewers:'sewers', rainforest:'rainforest', mangroves:'mangroves' };
function cMusicTrackFor(floorNum){
  if (floorNum <= 3) return C_MUSIC_TRACKS.gutters;    // 3C, 4C
  if (floorNum <= 5) return C_MUSIC_TRACKS.sewers;     // 5C, 6C
  if (floorNum <= 9) return C_MUSIC_TRACKS.rainforest; // 7C, 8C, 9C, 10C
  return C_MUSIC_TRACKS.mangroves;                     // 11C, 12C
}

/* D-branch palettes (Phase 7a) — three regions across floorNum 3-9 (4D-10D),
   flat objects in the same shape as C_PALETTES (no A/B split: floorBranch is
   never set on a D run either).

   DELIBERATE DEPARTURE, documented: every other palette in this file uses a
   pure-black `voidC`. All three D palettes instead use a very dark navy,
   because the Planetarium's visual identity (render.js's rebuildTileLayer
   special case) paints a STARFIELD where walls and void normally go — a
   near-black blue reads as "sky" behind those stars where pure black reads as
   "hole". The whole branch keeps that tone so the gate room doesn't look like
   a one-off. */
const D_PALETTES = {
  observatory: { // 4D/5D — dust, tarnished brass and cracked lens glass
    floorA:'#2b2733', floorB:'#332e3d', wall:'#1a1722', voidC:'#05060f',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#0d0b13', accent:'#c9b06a',
  },
  orrery: { // 6D/7D — polished brass rings turning over deep indigo
    floorA:'#232a44', floorB:'#2a3350', wall:'#141a2e', voidC:'#04050e',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#080b16', accent:'#e0b45a',
  },
  voidbetween: { // 8D-10D — outside the machine: cold, empty, faintly lit
    floorA:'#141426', floorB:'#1a1a30', wall:'#0b0b18', voidC:'#02030a',
    doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#030409', accent:'#9ab8ff',
  },
};
function dPaletteFor(floorNum){
  if (floorNum <= 4) return D_PALETTES.observatory; // 4D, 5D
  if (floorNum <= 6) return D_PALETTES.orrery;      // 6D, 7D
  return D_PALETTES.voidbetween;                    // 8D, 9D, 10D
}
// D-branch background music — the audio equivalent of D_PALETTES/
// dPaletteFor above, same shape as C_MUSIC_TRACKS/cMusicTrackFor: one
// audio.js MUSIC_TRACKS id per region, same three region names and the
// same floorNum split as dPaletteFor. See game.js's startFloor.
const D_MUSIC_TRACKS = { observatory:'observatory', orrery:'orrery', voidbetween:'voidbetween' };
function dMusicTrackFor(floorNum){
  if (floorNum <= 4) return D_MUSIC_TRACKS.observatory; // 4D, 5D
  if (floorNum <= 6) return D_MUSIC_TRACKS.orrery;      // 6D, 7D
  return D_MUSIC_TRACKS.voidbetween;                    // 8D, 9D, 10D
}

/* Floors 13 and 14 (floorNum 12/13) — Phase 7a's two new linear main-route
   stages. Flat palettes, no A/B pair: the branch has already converged by
   here, exactly like FINAL_PALETTE below. Without these two, currentPalette()
   would fall through to STAGES[stageIndexForFloor(12)] and repaint both new
   floors in the Inferno's palette (stageIndexForFloor clamps to the last
   stage), which is why they exist. The progression continues 12A/12B's
   "darker and more saturated the deeper it goes" arc down into FINAL_PALETTE's
   near-black. */
const HOLLOW_CHORUS_PALETTE = { // floor 13 — colour draining out, one cold ember left
  floorA:'#16141c', floorB:'#1c1a24', wall:'#0c0a11', voidC:'#000',
  doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#040308', accent:'#6a7fc9',
};
const FINAL_WAVEFORM_PALETTE = { // floor 14 — the last bar, dark red and flattening out
  floorA:'#1a0e12', floorB:'#211217', wall:'#0e0508', voidC:'#000',
  doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#050203', accent:'#e0604a',
};

// Floor 15 — branch-independent finale. Near-black stone, one blazing accent.
const FINAL_PALETTE = {
  floorA:'#0a0a0c', floorB:'#101014', wall:'#050506', voidC:'#000',
  doorOpen:'#4a3320', doorLocked:'#26201a', grout:'#020202', accent:'#ffd447',
};

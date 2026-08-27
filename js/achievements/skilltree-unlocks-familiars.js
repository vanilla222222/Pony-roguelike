'use strict';
// achievements/skilltree-unlocks-familiars.js — Phase 8e (slice 3/4): the
// familiar-unlock branch of the skill tree, attached under the existing
// `unlock_hub` node (skilltree.js). Pure data, appended onto
// SKILL_TREE_NODES/SKILL_TREE_NODES_BY_ID — no engine logic lives here (see
// skilltree.js for buySkillNode/applySkillTreeUnlockEffect/etc, which already
// handle `{type:'unlock', category:'familiar', id}` generically).
//
// 1 hub (`unlock_familiars_hub`) + 25 leaf nodes, one per new `sk8f_`-
// prefixed familiar defined in data/familiars-1.js. `unlock_hub` currently
// has zero children; this becomes one of its (eventually 4, once the sibling
// stars/trinkets/items slices land) children.
//
// Topology — five hand-shaped sub-branches off unlock_familiars_hub (varied
// width/depth, not one repeated template):
//
//   unlock_familiars_hub
//     +- fam_orbit_hub    "Orbiting Menagerie"  (4 nodes: 4 orbiters, single chain)
//     +- fam_ranged_hub   "Ranged Menagerie"    (6 nodes: 4 shooters + 2 mirrors, two sub-branches)
//     +- fam_support_hub  "Support Menagerie"   (7 nodes: 3 procs + 2 blockers + 2 scavengers, three sub-branches)
//     +- fam_skirmish_hub "Skirmisher Menagerie"(6 nodes: 2 thieves + 2 growers + 1 berserker + 1 swarmer, three sub-branches)
//     +- fam_blast_hub    "Blast Menagerie"     (2 nodes: 2 detonators, flat pair)
//
// 5 hubs + 4+6+7+6+2 = 25 leaves = 30 nodes total under unlock_familiars_hub,
// +1 for the hub itself = 26 new nodes overall, matching the task's "1 hub +
// 25 leaves" count (the five branch hubs below are themselves among the 25
// leaves of unlock_familiars_hub, each also carrying its own unlock effect —
// see the per-node comments).
const SKILL_TREE_UNLOCKS_FAMILIARS_NODES = [
  { id:'unlock_familiars_hub', parent:'unlock_hub', cost:1,
    name:'Menagerie Gate',
    desc:'Unlocks the path to a whole new menagerie of companion familiars.', effect:null },

  // --- Orbiting Menagerie branch (4 nodes, single chain) ---------------
  { id:'fam_orbit_hub', parent:'unlock_familiars_hub', cost:1,
    name:'Glow Moth Pact',
    desc:'Unlocks the Glow Moth, a pale-winged orbiting familiar that nicks anything it grazes.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_glowmoth' } },
  { id:'fam_orbit_cinderclaw', parent:'fam_orbit_hub', cost:1,
    name:'Cinderclaw Pact',
    desc:'Unlocks Cinderclaw, a slow, heavy-clawed orbiting familiar that hits hard.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_cinderclaw' } },
  { id:'fam_orbit_hollowwisp', parent:'fam_orbit_cinderclaw', cost:1,
    name:'Hollow Wisp Pact',
    desc:'Unlocks the Hollow Wisp, an orbiting familiar with a chance to freeze what it touches.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_hollowwisp' } },
  { id:'fam_orbit_briarcub', parent:'sk8f_gate_1', cost:1,
    name:'Briar Cub Pact',
    desc:'Unlocks the Briar Cub, a thicket-born orbiting familiar that damages anything that gets close.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_briarcub' } },

  // --- Ranged Menagerie branch (6 nodes: shooters + mirrors, two sub-branches)
  { id:'fam_ranged_hub', parent:'unlock_familiars_hub', cost:1,
    name:'Glass Finch Pact',
    desc:'Unlocks the Glass Finch, a near-transparent bird familiar that fires quick, thin shots.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_glassfinch' } },
  { id:'fam_ranged_tarpitcher', parent:'fam_ranged_hub', cost:1,
    name:'Tar Pitcher Pact',
    desc:'Unlocks the Tar Pitcher, a hunched familiar that hurls slow, heavy gobs of tar.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_tarpitcher' } },
  { id:'fam_ranged_dunehare', parent:'fam_ranged_hub', cost:1,
    name:'Dune Hare Pact',
    desc:'Unlocks the Dune Hare, a floating familiar that fires bolts at nearby enemies.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_dunehare' } },
  { id:'fam_ranged_stormlark', parent:'fam_ranged_dunehare', cost:1,
    name:'Storm Lark Pact',
    desc:'Unlocks the Storm Lark, a watchful familiar that snipes distant enemies with crackling bolts.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_stormlark' } },
  { id:'fam_ranged_focusgleam', parent:'fam_ranged_stormlark', cost:1,
    name:'Focus Gleam Pact',
    desc:'Unlocks Focus Gleam, a floating familiar that fires at whatever you are aiming at.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_focusgleam' } },
  { id:'fam_ranged_duskmirror', parent:'sk8f_gate_2', cost:1,
    name:'Dusk Mirror Pact',
    desc:'Unlocks the Dusk Mirror, a floating familiar that mirrors your aim with slow, heavy bolts.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_duskmirror' } },

  // --- Support Menagerie branch (7 nodes: procs + blockers + scavengers, three sub-branches)
  { id:'fam_support_hub', parent:'unlock_familiars_hub', cost:1,
    name:'Mossy Kettle Pact',
    desc:'Unlocks the Mossy Kettle, a familiar that every so often mends half a heart.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_mossykettle' } },
  { id:'fam_support_gildedpurse', parent:'fam_support_hub', cost:1,
    name:'Gilded Purse Pact',
    desc:'Unlocks the Gilded Purse, a familiar that every so often conjures a coin.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_gildedpurse' } },
  { id:'fam_support_batterygrub', parent:'sk8f_gate_3', cost:1,
    name:'Battery Grub Pact',
    desc:'Unlocks the Battery Grub, a familiar that every so often tops off your active item.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_batterygrub' } },
  { id:'fam_support_wardencub', parent:'fam_support_hub', cost:1,
    name:'Warden Cub Pact',
    desc:'Unlocks the Warden Cub, a familiar that every so often wraps you in a bubble that blocks one hit.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_wardencub' } },
  { id:'fam_support_bastionmoth', parent:'sk8f_gate_4', cost:1,
    name:'Bastion Moth Pact',
    desc:'Unlocks the Bastion Moth, a familiar that layers on a shield, up to two blocked hits.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_bastionmoth' } },
  { id:'fam_support_packrat', parent:'fam_support_hub', cost:1,
    name:'Packrat Pact',
    desc:'Unlocks the Packrat, a familiar that fetches the nearest loose pickup for you every couple of seconds.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_packrat' } },
  { id:'fam_support_hoardgull', parent:'sk8f_gate_5', cost:1,
    name:'Hoard Gull Pact',
    desc:'Unlocks the Hoard Gull, a familiar that constantly scoops up any pickup that lands close to you.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_hoardgull' } },

  // --- Skirmisher Menagerie branch (6 nodes: thieves + growers + berserker + swarmer, three sub-branches)
  { id:'fam_skirmish_hub', parent:'unlock_familiars_hub', cost:1,
    name:'Ferretling Pact',
    desc:'Unlocks the Ferretling, an orbiting familiar that bites enemies and sometimes picks their pockets.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_ferretling' } },
  { id:'fam_skirmish_ravensnatch', parent:'fam_skirmish_hub', cost:1,
    name:'Raven Snatch Pact',
    desc:'Unlocks Raven Snatch, an orbiting familiar that hits hard and often knocks a coin loose.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_ravensnatch' } },
  { id:'fam_skirmish_seedgrub', parent:'fam_skirmish_hub', cost:1,
    name:'Seed Grub Pact',
    desc:'Unlocks the Seed Grub, a weak orbiting familiar that grows stronger with every 15 kills this run.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_seedgrub' } },
  { id:'fam_skirmish_ironlarva', parent:'sk8f_gate_6', cost:1,
    name:'Iron Larva Pact',
    desc:'Unlocks the Iron Larva, a heavy orbiting familiar that hardens with every 25 kills this run.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_ironlarva' } },
  { id:'fam_skirmish_furyimp', parent:'fam_skirmish_hub', cost:1,
    name:'Fury Imp Pact',
    desc:'Unlocks the Fury Imp, an orbiting familiar that bites harder the closer you are to death.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_furyimp' } },
  { id:'fam_skirmish_gnatswarm', parent:'sk8f_gate_7', cost:1,
    name:'Gnat Swarm Pact',
    desc:'Unlocks the Gnat Swarm, a familiar that buds off three short-lived stinging orbs every few seconds.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_gnatswarm' } },

  // --- Blast Menagerie branch (2 nodes: flat pair) ---------------------
  { id:'fam_blast_hub', parent:'unlock_familiars_hub', cost:1,
    name:'Spark Pod Pact',
    desc:'Unlocks the Spark Pod, a familiar that drifts beside you and detonates every few seconds.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_sparkpod' } },
  { id:'fam_blast_ashcask', parent:'unlock_familiars_hub', cost:1,
    name:'Ash Cask Pact',
    desc:'Unlocks the Ash Cask, a familiar that detonates in a wide, hard blast every ten seconds.',
    effect:{ type:'unlock', category:'familiar', id:'sk8f_ashcask' } },

  // --- Mega A step 4 debuff gates -------------------------------------
  // Every branch of Menagerie Gate that runs two or more steps past a hub now
  // ends behind ONE mandatory cursed gate, spliced between that branch's
  // capstone and the capstone's old parent (the capstone's `parent` field
  // above is the only existing field this step rewrote). Branches whose
  // leaves hang straight off a hub are deliberately left free.
  //
  // These unlock branches are class-agnostic, but skilltree.js's
  // getSkillTreeStatBonus matches `eff.classId === classId` against a REAL
  // class id — the engine has no 'ALL' wildcard and this pass adds no engine
  // code. So each gate's debuff is expressed as an `effects` ARRAY with one
  // identical negative entry per class (skillTreeGlobalDebuffEffects, defined
  // in skilltree-general.js, which index.html loads before this file), making
  // the penalty genuinely universal instead of punishing one arbitrary class.
  // One stat per file at -0.02 each (magnetRadius here) keeps every
  // per-(classId, stat) worst-case sum inside skilltree.js's [-0.25, 0.25]
  // SKILL_TREE_STAT_CAP even with the whole file bought out.
  { id:'sk8f_gate_1', parent:'fam_orbit_hollowwisp', cost:1, cursed:true,
    name:'Crowded Orbit',
    desc:'Too many bodies circling you crowd out anything worth reaching for. Permanently reduces pickup magnet radius by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('magnetRadius', -0.02) },
  { id:'sk8f_gate_2', parent:'fam_ranged_focusgleam', cost:1, cursed:true,
    name:'Scattered Attention',
    desc:'A menagerie this loud pulls your eye off the floor. Permanently reduces pickup magnet radius by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('magnetRadius', -0.02) },
  { id:'sk8f_gate_3', parent:'fam_support_gildedpurse', cost:1, cursed:true,
    name:'Greedy Escort',
    desc:'Your escort reaches the loot before you do. Permanently reduces pickup magnet radius by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('magnetRadius', -0.02) },
  { id:'sk8f_gate_4', parent:'fam_support_wardencub', cost:1, cursed:true,
    name:'Shielded Blind Spot',
    desc:'A guard this close is also a wall this close. Permanently reduces pickup magnet radius by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('magnetRadius', -0.02) },
  { id:'sk8f_gate_5', parent:'fam_support_packrat', cost:1, cursed:true,
    name:'Rival Scavenger',
    desc:'It hoards for itself first and for you second. Permanently reduces pickup magnet radius by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('magnetRadius', -0.02) },
  { id:'sk8f_gate_6', parent:'fam_skirmish_seedgrub', cost:1, cursed:true,
    name:'Trampled Ground',
    desc:'The brood churns the floor into something that swallows what falls on it. Permanently reduces pickup magnet radius by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('magnetRadius', -0.02) },
  { id:'sk8f_gate_7', parent:'fam_skirmish_furyimp', cost:1, cursed:true,
    name:'Buzzing Interference',
    desc:'The swarm gets between you and everything else. Permanently reduces pickup magnet radius by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('magnetRadius', -0.02) },
];

for (const n of SKILL_TREE_UNLOCKS_FAMILIARS_NODES) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

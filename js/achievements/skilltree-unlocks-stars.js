'use strict';
// achievements/skilltree-unlocks-stars.js — Phase 8e (slice 1/4): the 25
// new `sk8s_`-prefixed stars (data/collectibles.js) each get their own
// skill-tree unlock leaf here, all descending from one new hub,
// 'unlock_stars_hub', itself a child of the existing 'unlock_hub'
// (achievements/skilltree.js) — 'unlock_hub' had zero children before this
// slice; sibling slices (trinkets/familiars/items) are adding their own
// hub-children of 'unlock_hub' in parallel and are not touched here.
//
// Every leaf below is a plain `{type:'unlock', category:'star', id:...}`
// effect (see skilltree.js's applySkillTreeUnlockEffect) — buying the node
// sets unlocks.unlockedStars[id] = true, the exact same bucket
// isStarUnlocked() reads regardless of how it got flipped (achievement,
// superboss reward, or here). Pure data, appended onto SKILL_TREE_NODES /
// SKILL_TREE_NODES_BY_ID at the bottom of this file — no engine logic
// lives here (see skilltree.js for buySkillNode / canBuySkillNode / etc,
// and skilltree-general.js for the append-mechanism this file mirrors).
//
// Topology — 26 nodes total (1 hub + 25 leaves, no extra sub-hubs — per
// the Phase 8e brief the 25 leaves ARE the branch structure): 13 branches
// hang directly off unlock_stars_hub, varying from a single leaf to a
// 4-deep chain, so the tree reads as organic rather than one flat row or
// one rigid repeated template:
//
//   unlock_stars_hub ("Stellar Cartography")
//     +- sk8s_pyrrha                                   (leaf)
//     +- sk8s_cinder -> sk8s_direstrike -> sk8s_gale    (chain, depth 3)
//     +- sk8s_pyroclast                                 (leaf)
//     +- sk8s_thessaly -> sk8s_wren -> sk8s_gilded       (chain, depth 3)
//     +- sk8s_medic                                     (leaf)
//     +- sk8s_frostbind -> sk8s_venomkiss                (chain, depth 2)
//     +- sk8s_dreadhowl -> sk8s_puppeteer                (chain, depth 2)
//     +- sk8s_thornveil -> sk8s_aegis                    (chain, depth 2)
//     +- sk8s_battery -> sk8s_farsight -> sk8s_fortune    (chain, depth 3)
//     +- sk8s_cartographer -> sk8s_demolition             (chain, depth 2)
//     +- sk8s_prospector -> sk8s_quartermaster -> sk8s_alchemist (chain, depth 3)
//     +- sk8s_shrine                                     (leaf)
//     +- sk8s_borealis                                   (leaf)
const SKILL_TREE_STARS_NODES = [
  { id:'unlock_stars_hub', parent:'unlock_hub', cost:1,
    name:'Stellar Cartography',
    desc:'Unlocks the path to 25 new stars.', effect:null },

  // --- direct leaf, no children ---
  { id:'sk8s_pyrrha', parent:'unlock_stars_hub', cost:1,
    name:'Pyrrha\'s Fire',
    desc:'Unlocks Pyrrha: +4 damage for the rest of the room.',
    effect:{ type:'unlock', category:'star', id:'sk8s_pyrrha' } },

  // --- Cinder -> Direstrike -> Gale (depth 3) ---
  { id:'sk8s_cinder', parent:'unlock_stars_hub', cost:1,
    name:'Falling Cinder',
    desc:'Unlocks Cinder: moderate damage to every enemy in the room.',
    effect:{ type:'unlock', category:'star', id:'sk8s_cinder' } },
  { id:'sk8s_direstrike', parent:'sk8s_cinder', cost:1,
    name:'Marked for Ruin',
    desc:'Unlocks Direstrike: deals 75% of the strongest enemy\'s current health as damage.',
    effect:{ type:'unlock', category:'star', id:'sk8s_direstrike' } },
  { id:'sk8s_gale', parent:'sk8s_gate_1', cost:1,
    name:'Gale Force',
    desc:'Unlocks Gale: blasts every enemy in the room away from you.',
    effect:{ type:'unlock', category:'star', id:'sk8s_gale' } },

  // --- direct leaf, no children ---
  { id:'sk8s_pyroclast', parent:'unlock_stars_hub', cost:1,
    name:'Pyroclast Cache',
    desc:'Unlocks Pyroclast: drops 4 bombs on the ground.',
    effect:{ type:'unlock', category:'star', id:'sk8s_pyroclast' } },

  // --- Thessaly -> Wren -> Gilded (depth 3) ---
  { id:'sk8s_thessaly', parent:'unlock_stars_hub', cost:1,
    name:'Thessaly\'s Warmth',
    desc:'Unlocks Thessaly: +2 red hearts.',
    effect:{ type:'unlock', category:'star', id:'sk8s_thessaly' } },
  { id:'sk8s_wren', parent:'sk8s_thessaly', cost:1,
    name:'Wren\'s Song',
    desc:'Unlocks Wren: +3 blue hearts.',
    effect:{ type:'unlock', category:'star', id:'sk8s_wren' } },
  { id:'sk8s_gilded', parent:'sk8s_gate_2', cost:1,
    name:'Gilded Renewal',
    desc:'Unlocks Gilded: fully restores your red AND blue hearts.',
    effect:{ type:'unlock', category:'star', id:'sk8s_gilded' } },

  // --- direct leaf, no children ---
  { id:'sk8s_medic', parent:'unlock_stars_hub', cost:1,
    name:'Field Medic',
    desc:'Unlocks Medic: drops 3 hearts on the ground.',
    effect:{ type:'unlock', category:'star', id:'sk8s_medic' } },

  // --- Frostbind -> Venomkiss (depth 2) ---
  { id:'sk8s_frostbind', parent:'unlock_stars_hub', cost:1,
    name:'Frostbind Ward',
    desc:'Unlocks Frostbind: freezes every enemy in the room for 6 seconds.',
    effect:{ type:'unlock', category:'star', id:'sk8s_frostbind' } },
  { id:'sk8s_venomkiss', parent:'sk8s_gate_3', cost:1,
    name:'Venomkiss Fang',
    desc:'Unlocks Venomkiss: poisons every enemy in the room for 8 seconds.',
    effect:{ type:'unlock', category:'star', id:'sk8s_venomkiss' } },

  // --- Dreadhowl -> Puppeteer (depth 2) ---
  { id:'sk8s_dreadhowl', parent:'unlock_stars_hub', cost:1,
    name:'Dreadhowl Chorus',
    desc:'Unlocks Dreadhowl: terrifies every enemy in the room for 6 seconds.',
    effect:{ type:'unlock', category:'star', id:'sk8s_dreadhowl' } },
  { id:'sk8s_puppeteer', parent:'sk8s_gate_4', cost:1,
    name:'Puppeteer\'s String',
    desc:'Unlocks Puppeteer: charms the strongest enemy in the room to fight for you for 14 seconds.',
    effect:{ type:'unlock', category:'star', id:'sk8s_puppeteer' } },

  // --- Thornveil -> Aegis (depth 2) ---
  { id:'sk8s_thornveil', parent:'unlock_stars_hub', cost:1,
    name:'Thornveil Guard',
    desc:'Unlocks Thornveil: blocks the next 2 hits you take.',
    effect:{ type:'unlock', category:'star', id:'sk8s_thornveil' } },
  { id:'sk8s_aegis', parent:'sk8s_gate_5', cost:1,
    name:'Aegis Bulwark',
    desc:'Unlocks Aegis: invincible for 15 seconds.',
    effect:{ type:'unlock', category:'star', id:'sk8s_aegis' } },

  // --- Battery -> Farsight -> Fortune (depth 3) ---
  { id:'sk8s_battery', parent:'unlock_stars_hub', cost:1,
    name:'Charged Cell',
    desc:'Unlocks Battery: fully recharges your active item.',
    effect:{ type:'unlock', category:'star', id:'sk8s_battery' } },
  { id:'sk8s_farsight', parent:'sk8s_battery', cost:1,
    name:'Farsight Lens',
    desc:'Unlocks Farsight: +1 tile of attack range for the rest of the run.',
    effect:{ type:'unlock', category:'star', id:'sk8s_farsight' } },
  { id:'sk8s_fortune', parent:'sk8s_gate_6', cost:1,
    name:'Fortune\'s Favor',
    desc:'Unlocks Fortune: +1 Luck for the rest of the run.',
    effect:{ type:'unlock', category:'star', id:'sk8s_fortune' } },

  // --- Cartographer -> Demolition (depth 2) ---
  { id:'sk8s_cartographer', parent:'unlock_stars_hub', cost:1,
    name:'Cartographer\'s Eye',
    desc:"Unlocks Cartographer: reveals this floor's entire map, secret rooms included.",
    effect:{ type:'unlock', category:'star', id:'sk8s_cartographer' } },
  { id:'sk8s_demolition', parent:'sk8s_gate_7', cost:1,
    name:'Demolition Charge',
    desc:'Unlocks Demolition: destroys every destructible object in the room.',
    effect:{ type:'unlock', category:'star', id:'sk8s_demolition' } },

  // --- Prospector -> Quartermaster -> Alchemist (depth 3) ---
  { id:'sk8s_prospector', parent:'unlock_stars_hub', cost:1,
    name:'Prospector\'s Eye',
    desc:'Unlocks Prospector: drops 5 coins on the ground.',
    effect:{ type:'unlock', category:'star', id:'sk8s_prospector' } },
  { id:'sk8s_quartermaster', parent:'sk8s_prospector', cost:1,
    name:'Quartermaster\'s Ledger',
    desc:'Unlocks Quartermaster: drops 2 keys and 2 bombs on the ground.',
    effect:{ type:'unlock', category:'star', id:'sk8s_quartermaster' } },
  { id:'sk8s_alchemist', parent:'sk8s_gate_8', cost:1,
    name:'Alchemist\'s Satchel',
    desc:'Unlocks Alchemist: drops 3 pills on the ground.',
    effect:{ type:'unlock', category:'star', id:'sk8s_alchemist' } },

  // --- direct leaf, no children ---
  { id:'sk8s_shrine', parent:'unlock_stars_hub', cost:1,
    name:'Wayside Shrine',
    desc:'Unlocks Shrine: spawns a free item pedestal in this room.',
    effect:{ type:'unlock', category:'star', id:'sk8s_shrine' } },

  // --- direct leaf, no children ---
  { id:'sk8s_borealis', parent:'unlock_stars_hub', cost:1,
    name:'Borealis Wind',
    desc:'Unlocks Borealis: +60% speed for the rest of the room.',
    effect:{ type:'unlock', category:'star', id:'sk8s_borealis' } },

  // --- Mega A step 4 debuff gates -------------------------------------
  // Every branch of Stellar Cartography that runs two or more steps past a hub now
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
  // One stat per file at -0.02 each (rangeTiles here) keeps every
  // per-(classId, stat) worst-case sum inside skilltree.js's [-0.25, 0.25]
  // SKILL_TREE_STAT_CAP even with the whole file bought out.
  { id:'sk8s_gate_1', parent:'sk8s_direstrike', cost:1, cursed:true,
    name:'Dimming Constellation',
    desc:'A star this bright leaves the rest of the sky darker. Permanently reduces range by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('rangeTiles', -0.02) },
  { id:'sk8s_gate_2', parent:'sk8s_wren', cost:1, cursed:true,
    name:'Gilded Haze',
    desc:'Gold leaf over the chart hides the far edges of it. Permanently reduces range by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('rangeTiles', -0.02) },
  { id:'sk8s_gate_3', parent:'sk8s_frostbind', cost:1, cursed:true,
    name:'Frostbound Horizon',
    desc:'The rime on the lens shortens everything past it. Permanently reduces range by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('rangeTiles', -0.02) },
  { id:'sk8s_gate_4', parent:'sk8s_dreadhowl', cost:1, cursed:true,
    name:'Howling Static',
    desc:'The howl drowns out anything further off. Permanently reduces range by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('rangeTiles', -0.02) },
  { id:'sk8s_gate_5', parent:'sk8s_thornveil', cost:1, cursed:true,
    name:'Thorn-Choked Sightline',
    desc:'The veil closes in as it protects. Permanently reduces range by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('rangeTiles', -0.02) },
  { id:'sk8s_gate_6', parent:'sk8s_farsight', cost:1, cursed:true,
    name:'Overspent Farsight',
    desc:'Looking that far ahead costs you the middle distance. Permanently reduces range by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('rangeTiles', -0.02) },
  { id:'sk8s_gate_7', parent:'sk8s_cartographer', cost:1, cursed:true,
    name:'Smudged Chart',
    desc:'The chart blurs exactly where you needed it sharpest. Permanently reduces range by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('rangeTiles', -0.02) },
  { id:'sk8s_gate_8', parent:'sk8s_quartermaster', cost:1, cursed:true,
    name:'Cluttered Pack',
    desc:'A pack this full keeps your arms tucked in close. Permanently reduces range by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('rangeTiles', -0.02) },
];

for (const n of SKILL_TREE_STARS_NODES) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

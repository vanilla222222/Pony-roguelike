'use strict';
// achievements/skilltree-unlocks-trinkets.js — Phase 8e (slice 2/4): the 25
// new `sk8t_`-prefixed trinkets (data/trinkets-2.js) each get their own
// skill-tree unlock leaf here, all descending from one new hub,
// 'unlock_trinkets_hub', itself a child of the existing 'unlock_hub'
// (achievements/skilltree.js). Sibling slices (stars/familiars/items) are
// adding their own hub-children of 'unlock_hub' in parallel and are not
// touched here.
//
// Every leaf below is a plain `{type:'unlock', category:'trinket', id:...}`
// effect (see skilltree.js's applySkillTreeUnlockEffect) — buying the node
// sets unlocks.unlockedTrinkets[id] = true, the exact same bucket
// isTrinketUnlocked() reads regardless of how it got flipped (achievement,
// superboss reward, or here). Pure data, appended onto SKILL_TREE_NODES /
// SKILL_TREE_NODES_BY_ID at the bottom of this file — no engine logic
// lives here (see skilltree.js for buySkillNode / canBuySkillNode / etc,
// and skilltree-general.js for the append-mechanism this file mirrors).
//
// Topology — 26 nodes total (1 hub + 25 leaves, no extra sub-hubs — per the
// Phase 8e brief the 25 leaves ARE the branch structure): 12 branches hang
// directly off unlock_trinkets_hub, varying from a single leaf to a 4-deep
// chain, so the tree reads as organic rather than one flat row or one rigid
// repeated template:
//
//   unlock_trinkets_hub ("Curio Cabinet")
//     +- sk8t_ironclasp -> sk8t_glasscannon                              (chain, depth 2)
//     +- sk8t_windveil -> sk8t_leadenlocket -> sk8t_witchhazelcharm       (chain, depth 3)
//     +- sk8t_hairspring -> sk8t_boggedgear                               (chain, depth 2)
//     +- sk8t_farcastbead -> sk8t_narrowscope                             (chain, depth 2)
//     +- sk8t_deadeyeclasp -> sk8t_ricochetcoil                          (chain, depth 2)
//     +- sk8t_fourleafpin                                                 (leaf)
//     +- sk8t_eelskinwrap                                                 (leaf)
//     +- sk8t_lodestonecharm -> sk8t_cinderpouch                         (chain, depth 2)
//     +- sk8t_awlspike -> sk8t_twinnotch                                  (chain, depth 2)
//     +- sk8t_hungryfangcharm -> sk8t_direstingpin -> sk8t_rimeclasp -> sk8t_boneshakerpouch (chain, depth 4)
//     +- sk8t_hagglerspurse -> sk8t_giltclasp                             (chain, depth 2)
//     +- sk8t_stormcollar -> sk8t_direkegcharm                           (chain, depth 2)
const SKILL_TREE_TRINKETS_NODES = [
  { id:'unlock_trinkets_hub', parent:'unlock_hub', cost:1,
    name:'Curio Cabinet',
    desc:'Unlocks the path to 25 new trinkets.', effect:null },

  // --- Ironclasp -> Glasscannon (depth 2) ---
  { id:'sk8t_ironclasp', parent:'unlock_trinkets_hub', cost:1,
    name:"Smith's Reserve",
    desc:'Unlocks Iron Clasp: +1 damage to all attacks, -10% movement speed.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_ironclasp' } },
  { id:'sk8t_glasscannon', parent:'sk8t_gate_1', cost:1,
    name:'Brittle Edge',
    desc:'Unlocks Glass Cannon Shard: +8% critical hit chance, -1 damage to all attacks.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_glasscannon' } },

  // --- Windveil -> Leadenlocket -> Witchhazelcharm (depth 3) ---
  { id:'sk8t_windveil', parent:'unlock_trinkets_hub', cost:1,
    name:"Wanderer's Gale",
    desc:'Unlocks Wind Veil: +9% movement speed.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_windveil' } },
  { id:'sk8t_leadenlocket', parent:'sk8t_windveil', cost:1,
    name:'Heavy Trade',
    desc:'Unlocks Leaden Locket: +14% movement speed, -1 Luck.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_leadenlocket' } },
  { id:'sk8t_witchhazelcharm', parent:'sk8t_gate_2', cost:1,
    name:"Herbalist's Bargain",
    desc:'Unlocks Witch Hazel Charm: +1 Luck, -8% movement speed.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_witchhazelcharm' } },

  // --- Hairspring -> Boggedgear (depth 2) ---
  { id:'sk8t_hairspring', parent:'unlock_trinkets_hub', cost:1,
    name:'Fine Tolerance',
    desc:'Unlocks Hairspring: attacks and shots recharge 6% faster.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_hairspring' } },
  { id:'sk8t_boggedgear', parent:'sk8t_gate_3', cost:1,
    name:'Sluggish Works',
    desc:'Unlocks Bogged Gear: attacks and shots recharge 5% faster, -5% movement speed.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_boggedgear' } },

  // --- Farcastbead -> Narrowscope (depth 2) ---
  { id:'sk8t_farcastbead', parent:'unlock_trinkets_hub', cost:1,
    name:"Scout's Reach",
    desc:'Unlocks Farcast Bead: +1 tile of attack range.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_farcastbead' } },
  { id:'sk8t_narrowscope', parent:'sk8t_gate_4', cost:1,
    name:'Tunnel Vision',
    desc:'Unlocks Narrow Scope: +1 tile of attack range, -5% critical hit chance.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_narrowscope' } },

  // --- Deadeyeclasp -> Ricochetcoil (depth 2) ---
  { id:'sk8t_deadeyeclasp', parent:'unlock_trinkets_hub', cost:1,
    name:"Marksman's Focus",
    desc:'Unlocks Deadeye Clasp: +6% critical hit chance.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_deadeyeclasp' } },
  { id:'sk8t_ricochetcoil', parent:'sk8t_gate_5', cost:1,
    name:'Rebound Instinct',
    desc:'Unlocks Ricochet Coil: critical hits deal even more damage.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_ricochetcoil' } },

  // --- direct leaf, no children ---
  { id:'sk8t_fourleafpin', parent:'unlock_trinkets_hub', cost:1,
    name:"Gambler's Charm",
    desc:'Unlocks Four-Leaf Pin: +2 Luck.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_fourleafpin' } },

  // --- direct leaf, no children ---
  { id:'sk8t_eelskinwrap', parent:'unlock_trinkets_hub', cost:1,
    name:'Slippery Hide',
    desc:'Unlocks Eelskin Wrap: +5% chance to dodge incoming damage entirely.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_eelskinwrap' } },

  // --- Lodestonecharm -> Cinderpouch (depth 2) ---
  { id:'sk8t_lodestonecharm', parent:'unlock_trinkets_hub', cost:1,
    name:"Prospector's Pull",
    desc:'Unlocks Lodestone Charm: pulls nearby pickups toward you from further away.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_lodestonecharm' } },
  { id:'sk8t_cinderpouch', parent:'sk8t_gate_6', cost:1,
    name:"Demolitionist's Kit",
    desc:'Unlocks Cinder Pouch: +12% bomb blast radius.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_cinderpouch' } },

  // --- Awlspike -> Twinnotch (depth 2) ---
  { id:'sk8t_awlspike', parent:'unlock_trinkets_hub', cost:1,
    name:"Fletcher's Grind",
    desc:'Unlocks Awl Spike: ranged bolts pierce through one more enemy.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_awlspike' } },
  { id:'sk8t_twinnotch', parent:'sk8t_gate_7', cost:1,
    name:'Double Draw',
    desc:'Unlocks Twin Notch: ranged attacks fire one extra bolt, -8% movement speed.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_twinnotch' } },

  // --- Hungryfangcharm -> Direstingpin -> Rimeclasp -> Boneshakerpouch (depth 4) ---
  { id:'sk8t_hungryfangcharm', parent:'unlock_trinkets_hub', cost:1,
    name:"Predator's Instinct",
    desc:'Unlocks Hungry Fang Charm: +5% chance any hit heals you half a heart.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_hungryfangcharm' } },
  { id:'sk8t_direstingpin', parent:'sk8t_hungryfangcharm', cost:1,
    name:'Envenomed Barb',
    desc:'Unlocks Dire Sting Pin: +4% flat chance to poison an enemy on hit (not luck-scaled). Bosses are immune.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_direstingpin' } },
  { id:'sk8t_rimeclasp', parent:'sk8t_direstingpin', cost:1,
    name:'Winter Grip',
    desc:'Unlocks Rime Clasp: +4% flat chance to freeze an enemy solid on hit (not luck-scaled). Bosses are immune.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_rimeclasp' } },
  { id:'sk8t_boneshakerpouch', parent:'sk8t_gate_8', cost:1,
    name:"Grave Robber's Luck",
    desc:'Unlocks Boneshaker Pouch: 5% chance an enemy drops a bomb on death.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_boneshakerpouch' } },

  // --- Hagglerspurse -> Giltclasp (depth 2) ---
  { id:'sk8t_hagglerspurse', parent:'unlock_trinkets_hub', cost:1,
    name:"Merchant's Nod",
    desc:'Unlocks Haggler\'s Purse: -8% shop prices.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_hagglerspurse' } },
  { id:'sk8t_giltclasp', parent:'sk8t_gate_9', cost:1,
    name:"Appraiser's Eye",
    desc:'Unlocks Gilt Clasp: +12% coin value.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_giltclasp' } },

  // --- Stormcollar -> Direkegcharm (depth 2) ---
  { id:'sk8t_stormcollar', parent:'unlock_trinkets_hub', cost:1,
    name:"Beastmaster's Drum",
    desc:'Unlocks Storm Collar: your familiars strike and fire 12% more often.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_stormcollar' } },
  { id:'sk8t_direkegcharm', parent:'sk8t_gate_10', cost:1,
    name:"Sapper's Cache",
    desc:'Unlocks Dire Keg Charm: bomb pickups give one extra bomb.',
    effect:{ type:'unlock', category:'trinket', id:'sk8t_direkegcharm' } },

  // --- Mega A step 4 debuff gates -------------------------------------
  // Every branch of Curio Cabinet that runs two or more steps past a hub now
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
  // Each gate is -0.02. This file has ten of them — twice any sibling file's
  // count — so they are split across TWO stats (gates 1-5 on speed, 6-10 on
  // boltSpeed, -0.10 apiece) rather than the single stat the other three
  // unlock files use, keeping every per-(classId, stat) worst-case sum
  // comfortably inside skilltree.js's [-0.25, 0.25] SKILL_TREE_STAT_CAP even
  // with this whole file bought out on top of everything else.
  { id:'sk8t_gate_1', parent:'sk8t_ironclasp', cost:1, cursed:true,
    name:'Leaden Drawer',
    desc:'The drawer sticks, and so do you. Permanently reduces movement speed by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('speed', -0.02) },
  { id:'sk8t_gate_2', parent:'sk8t_leadenlocket', cost:1, cursed:true,
    name:'Tangled Charm Cord',
    desc:'Every charm on the cord drags at the next. Permanently reduces movement speed by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('speed', -0.02) },
  { id:'sk8t_gate_3', parent:'sk8t_hairspring', cost:1, cursed:true,
    name:'Gummed Escapement',
    desc:'The mechanism still turns, but never freely again. Permanently reduces movement speed by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('speed', -0.02) },
  { id:'sk8t_gate_4', parent:'sk8t_farcastbead', cost:1, cursed:true,
    name:'Overloaded Bandolier',
    desc:'Carrying the whole set slows the stride that carries it. Permanently reduces movement speed by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('speed', -0.02) },
  { id:'sk8t_gate_5', parent:'sk8t_deadeyeclasp', cost:1, cursed:true,
    name:'Coiled Weight',
    desc:'The coil holds tension you end up carrying yourself. Permanently reduces movement speed by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('speed', -0.02) },
  { id:'sk8t_gate_6', parent:'sk8t_lodestonecharm', cost:1, cursed:true,
    name:'Lodestone Drag',
    desc:'The lodestone pulls at more than pickups. Permanently reduces bolt speed by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('boltSpeed', -0.02) },
  { id:'sk8t_gate_7', parent:'sk8t_awlspike', cost:1, cursed:true,
    name:'Notched Bootstrap',
    desc:'A strap notched one hole too tight. Permanently reduces bolt speed by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('boltSpeed', -0.02) },
  { id:'sk8t_gate_8', parent:'sk8t_rimeclasp', cost:1, cursed:true,
    name:'Rime-Locked Hinge',
    desc:'Frost creeps out of the clasp and into the joints. Permanently reduces bolt speed by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('boltSpeed', -0.02) },
  { id:'sk8t_gate_9', parent:'sk8t_hagglerspurse', cost:1, cursed:true,
    name:'Heavy Purse',
    desc:'Gold is heavier than it looks when you carry all of it. Permanently reduces bolt speed by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('boltSpeed', -0.02) },
  { id:'sk8t_gate_10', parent:'sk8t_stormcollar', cost:1, cursed:true,
    name:'Storm-Bowed Collar',
    desc:'The collar leans into every step you take. Permanently reduces bolt speed by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('boltSpeed', -0.02) },
];

for (const n of SKILL_TREE_TRINKETS_NODES) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

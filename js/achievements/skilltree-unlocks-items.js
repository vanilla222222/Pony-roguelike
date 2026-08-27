'use strict';
// achievements/skilltree-unlocks-items.js — Phase 8e slice 4: the 25 new
// item-unlock skill nodes, attached under a new `unlock_items_hub` node
// which is itself a child of the existing `unlock_hub` (skilltree.js).
// Pure data, appended onto SKILL_TREE_NODES/SKILL_TREE_NODES_BY_ID — no
// engine logic lives here (see skilltree.js for buySkillNode,
// applySkillTreeUnlockEffect, computeSkillTreeLayout, etc). Every node here
// is a simple one-effect `{type:'unlock', category:'item', id:'sk8i_...'}`,
// cost 1 point, unlocking exactly one of the 25 brand-new items minted in
// js/data/items-5.js (see the "Phase 8e slice 4" comment block there for
// the items themselves; the stat wiring lives in js/systems/items-1.js's
// recalcPlayerStats and js/systems/items-2.js's applyPassiveEffect).
//
// This is one of 4 parallel Phase 8e slices (stars/trinkets/familiars/items)
// each minting their own hub off `unlock_hub` — `unlock_items_hub` does not
// assume anything about the other 3 siblings; it is simply one more child
// of `unlock_hub`.
//
// Topology — four hand-shaped sub-branches off unlock_items_hub (varied
// width/depth, not one repeated template):
//
//   unlock_items_hub  "Forgotten Workshop"
//     +- sk8i_offense_hub   "Offense Cache"     (9 nodes: damage/crit/pierce/rate/multishot + 3 attackLayer combo items)
//     +- sk8i_utility_hub   "Utility Cache"     (5 nodes: speed/range/magnet/bomb/luck)
//     +- sk8i_survival_hub  "Survival Cache"    (6 nodes: heart containers/lifesteal/dodge/onkill-heal + 1 branch split)
//     +- sk8i_onhit_hub     "On-Hit Cache"      (5 nodes: freeze/venom/charm status chances + 2 more attackLayer combo items)
const SKILL_TREE_ITEM_UNLOCK_NODES = [
  { id:'unlock_items_hub', parent:'unlock_hub', cost:1,
    name:'Forgotten Workshop',
    desc:'Unlocks the path to a cache of forgotten prototype items.', effect:null },

  // --- Offense Cache branch (9 nodes) ---------------------------------
  { id:'sk8i_offense_hub', parent:'unlock_items_hub', cost:1,
    name:'Cracked Toolbox',
    desc:'Unlocks Glass Marble: +1 damage to all attacks.',
    effect:{ type:'unlock', category:'item', id:'sk8i_glassmarble' } },
  { id:'sk8i_gamblerbead', parent:'sk8i_offense_hub', cost:1,
    name:"Dealer's Instinct",
    desc:"Unlocks Gambler's Bead: +5% critical hit chance.",
    effect:{ type:'unlock', category:'item', id:'sk8i_gamblerbead' } },
  { id:'sk8i_sharpwhet', parent:'sk8i_gate_1', cost:1,
    name:'Honed Edge',
    desc:'Unlocks Sharp Whetstone: critical hits deal even more damage.',
    effect:{ type:'unlock', category:'item', id:'sk8i_sharpwhet' } },
  { id:'sk8i_hawkloupe', parent:'sk8i_offense_hub', cost:1,
    name:"Loupe-Maker's Trick",
    desc:"Unlocks Hawk's Loupe: ranged bolts pierce through an extra enemy.",
    effect:{ type:'unlock', category:'item', id:'sk8i_hawkloupe' } },
  { id:'sk8i_doubleshot', parent:'sk8i_gate_2', cost:1,
    name:'Twin Barrel Rig',
    desc:'Unlocks Double Shot Rig: ranged attacks fire one extra bolt in a spread.',
    effect:{ type:'unlock', category:'item', id:'sk8i_doubleshot' } },
  { id:'sk8i_ticktock', parent:'sk8i_offense_hub', cost:1,
    name:'Clockwork Tinkering',
    desc:'Unlocks Tick-Tock Gear: attacks and shots recharge faster.',
    effect:{ type:'unlock', category:'item', id:'sk8i_ticktock' } },
  { id:'sk8i_stormtusk', parent:'sk8i_offense_hub', cost:1,
    name:'Beastly Prototype',
    desc:'Unlocks Storm Tusk: +1 damage; landed hits blast their target back.',
    effect:{ type:'unlock', category:'item', id:'sk8i_stormtusk' } },
  { id:'sk8i_shatterfang', parent:'sk8i_gate_3', cost:1,
    name:'Cracked Fang Mold',
    desc:'Unlocks Shatter Fang: +1 damage; melee swings crack the ground around the target.',
    effect:{ type:'unlock', category:'item', id:'sk8i_shatterfang' } },
  { id:'sk8i_fragmentshard', parent:'sk8i_offense_hub', cost:1,
    name:'Shard Refinery',
    desc:'Unlocks Fragment Shard: +1 damage; kills launch homing fragments outward.',
    effect:{ type:'unlock', category:'item', id:'sk8i_fragmentshard' } },

  // --- Utility Cache branch (5 nodes) ---------------------------------
  { id:'sk8i_utility_hub', parent:'unlock_items_hub', cost:1,
    name:'Spare Parts Bin',
    desc:'Unlocks Wind Lace: +15% movement speed.',
    effect:{ type:'unlock', category:'item', id:'sk8i_windlace' } },
  { id:'sk8i_farstep', parent:'sk8i_utility_hub', cost:1,
    name:'Surveyor\'s Notes',
    desc:'Unlocks Far Step Compass: ranged bolts fly farther; melee swings reach a little farther too.',
    effect:{ type:'unlock', category:'item', id:'sk8i_farstep' } },
  { id:'sk8i_pullstone', parent:'sk8i_utility_hub', cost:1,
    name:'Curious Attraction',
    desc:'Unlocks Pull Stone: nearby pickups drift toward you.',
    effect:{ type:'unlock', category:'item', id:'sk8i_pullstone' } },
  { id:'sk8i_bombshell', parent:'sk8i_utility_hub', cost:1,
    name:'Demolition Notes',
    desc:'Unlocks Bomb Shell: +10% bomb blast radius.',
    effect:{ type:'unlock', category:'item', id:'sk8i_bombshell' } },
  { id:'sk8i_luckbead', parent:'sk8i_utility_hub', cost:1,
    name:"Tinkerer's Charm Kit",
    desc:'Unlocks Lucky Bead: +1 Luck.',
    effect:{ type:'unlock', category:'item', id:'sk8i_luckbead' } },
  { id:'sk8i_grandluck', parent:'sk8i_gate_4', cost:1,
    name:'Fortune Distillery',
    desc:'Unlocks Grand Luck Charm: +3 Luck.',
    effect:{ type:'unlock', category:'item', id:'sk8i_grandluck' } },

  // --- Survival Cache branch (6 nodes) --------------------------------
  { id:'sk8i_survival_hub', parent:'unlock_items_hub', cost:1,
    name:'Reinforcement Crate',
    desc:'Unlocks Iron Clasp: +1 heart container.',
    effect:{ type:'unlock', category:'item', id:'sk8i_ironclasp' } },
  { id:'sk8i_secondheart', parent:'sk8i_survival_hub', cost:1,
    name:'Overbuilt Reinforcement',
    desc:'Unlocks Second Heart: +2 heart containers.',
    effect:{ type:'unlock', category:'item', id:'sk8i_secondheart' } },
  { id:'sk8i_swiftdodge', parent:'sk8i_survival_hub', cost:1,
    name:'Evasive Tinkering',
    desc:'Unlocks Swift Dodge Charm: +5% chance to dodge incoming damage entirely.',
    effect:{ type:'unlock', category:'item', id:'sk8i_swiftdodge' } },
  { id:'sk8i_bloodmarble', parent:'unlock_items_hub', cost:1,
    name:'Sanguine Glasswork',
    desc:'Unlocks Blood Marble: 6% chance any hit heals you half a heart.',
    effect:{ type:'unlock', category:'item', id:'sk8i_bloodmarble' } },
  { id:'sk8i_healcharm', parent:'sk8i_gate_5', cost:1,
    name:'Restorative Etching',
    desc:'Unlocks Heal Charm: 5% chance to heal half a heart on a kill.',
    effect:{ type:'unlock', category:'item', id:'sk8i_healcharm' } },
  { id:'sk8i_echobell', parent:'sk8i_gate_6', cost:1,
    name:"Bellmaker's Echo",
    desc:'Unlocks Echo Bell: +1 damage; every attack echoes a moment later at reduced power.',
    effect:{ type:'unlock', category:'item', id:'sk8i_echobell' } },

  // --- On-Hit Cache branch (5 nodes) -----------------------------------
  { id:'sk8i_onhit_hub', parent:'unlock_items_hub', cost:1,
    name:'Alchemist\'s Reagent Box',
    desc:'Unlocks Frost Spindle: 5% chance to freeze an enemy solid on hit.',
    effect:{ type:'unlock', category:'item', id:'sk8i_frostspindle' } },
  { id:'sk8i_venomthorn', parent:'sk8i_onhit_hub', cost:1,
    name:'Thornwork Distillate',
    desc:'Unlocks Venom Thorn: 5% chance to poison an enemy on hit.',
    effect:{ type:'unlock', category:'item', id:'sk8i_venomthorn' } },
  { id:'sk8i_charmreed', parent:'sk8i_onhit_hub', cost:1,
    name:'Reedcraft Tuning',
    desc:'Unlocks Charm Reed: 5% chance to charm an enemy on hit.',
    effect:{ type:'unlock', category:'item', id:'sk8i_charmreed' } },
  { id:'sk8i_ricochetcoin', parent:'sk8i_onhit_hub', cost:1,
    name:'Minted Trickshot',
    desc:'Unlocks Ricochet Coin: your bolts bounce off one wall instead of stopping.',
    effect:{ type:'unlock', category:'item', id:'sk8i_ricochetcoin' } },

  // --- Mega A step 4 debuff gates -------------------------------------
  // Every branch of Forgotten Workshop that runs two or more steps past a hub now
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
  // One stat per file at -0.02 each (critChance here) keeps every
  // per-(classId, stat) worst-case sum inside skilltree.js's [-0.25, 0.25]
  // SKILL_TREE_STAT_CAP even with the whole file bought out.
  { id:'sk8i_gate_1', parent:'sk8i_gamblerbead', cost:1, cursed:true,
    name:'Blunted Bench',
    desc:'The whetstone bench dulls the hand that works it. Permanently reduces critical hit chance by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('critChance', -0.02) },
  { id:'sk8i_gate_2', parent:'sk8i_hawkloupe', cost:1, cursed:true,
    name:'Misaligned Sights',
    desc:'Twinning the barrel throws every shot a hair wide. Permanently reduces critical hit chance by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('critChance', -0.02) },
  { id:'sk8i_gate_3', parent:'sk8i_stormtusk', cost:1, cursed:true,
    name:'Cracked Casting Mold',
    desc:'The mold splits, and the flaw goes into everything cast from it. Permanently reduces critical hit chance by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('critChance', -0.02) },
  { id:'sk8i_gate_4', parent:'sk8i_luckbead', cost:1, cursed:true,
    name:'Weighted Dice',
    desc:'Someone shaved this die long before you found it. Permanently reduces critical hit chance by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('critChance', -0.02) },
  { id:'sk8i_gate_5', parent:'sk8i_bloodmarble', cost:1, cursed:true,
    name:'Bloodied Workbench',
    desc:'The bench has drunk more than its share. Permanently reduces critical hit chance by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('critChance', -0.02) },
  { id:'sk8i_gate_6', parent:'sk8i_bloodmarble', cost:1, cursed:true,
    name:'Cracked Bell Mount',
    desc:'A bell mounted on a fault line never rings quite true. Permanently reduces critical hit chance by 2% for every character. Required to reach the deepest node on this branch.',
    effects: skillTreeGlobalDebuffEffects('critChance', -0.02) },
];

for (const n of SKILL_TREE_ITEM_UNLOCK_NODES) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

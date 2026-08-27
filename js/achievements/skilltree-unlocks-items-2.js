'use strict';
// achievements/skilltree-unlocks-items-2.js — Phase 11 item 4: a second
// item-unlock branch ("Sealed Reliquary"), sibling to Phase 8e's
// unlock_items_hub ("Forgotten Workshop") — same `{type:'unlock',
// category:'item', id}` node shape, same one-way permanent grant via
// applySkillTreeUnlockEffect (skilltree.js), gating the 15 new items minted
// in js/data/items-6.js. Two of the four sub-paths end behind a cursed gate
// (skillTreeGlobalDebuffEffects, from skilltree-general.js — index.html
// loads that file first) so "more cursed nodes" lands here too, not just in
// the per-character trees.
const SKILL_TREE_ITEM2_UNLOCK_NODES = [
  { id:'unlock_items2_hub', parent:'unlock_hub', cost:1,
    name:'Sealed Reliquary',
    desc:'Unlocks Branded Hoofguard: +1 damage to all attacks.',
    effect:{ type:'unlock', category:'item', id:'sk11i_hoofbrand' } },

  // --- free (no gate) — cheap, broadly useful, straight off the hub -----
  { id:'sk11i_n_starcompass', parent:'unlock_items2_hub', cost:1,
    name:"Star-Reader's Cache",
    desc:"Unlocks Wayfarer's Star-Compass: +2 Luck.",
    effect:{ type:'unlock', category:'item', id:'sk11i_starcompass' } },
  { id:'sk11i_n_windveil', parent:'unlock_items2_hub', cost:1,
    name:'Sash-Weaver\'s Cache',
    desc:'Unlocks Windveil Sash: +12% movement speed.',
    effect:{ type:'unlock', category:'item', id:'sk11i_windveil' } },
  { id:'sk11i_n_direarrow', parent:'unlock_items2_hub', cost:1,
    name:'Fletcher\'s Cache',
    desc:'Unlocks Dire Arrowhead: ranged bolts pierce through one more enemy.',
    effect:{ type:'unlock', category:'item', id:'sk11i_direarrow' } },
  { id:'sk11i_n_pulltotem', parent:'unlock_items2_hub', cost:1,
    name:'Totem-Carver\'s Cache',
    desc:'Unlocks Pulling Totem: +25 pickup magnet radius.',
    effect:{ type:'unlock', category:'item', id:'sk11i_pulltotem' } },
  { id:'sk11i_n_lifewell', parent:'unlock_items2_hub', cost:1,
    name:'Well-Sealer\'s Cache',
    desc:'Unlocks Sealed Lifewell: 6% chance any hit heals you half a heart.',
    effect:{ type:'unlock', category:'item', id:'sk11i_lifewell' } },
  { id:'sk11i_n_coinpurse', parent:'unlock_items2_hub', cost:1,
    name:'Purse-Sealer\'s Cache',
    desc:'Unlocks Sealed Coinpurse: -5% shop prices.',
    effect:{ type:'unlock', category:'item', id:'sk11i_coinpurse' } },

  // --- chain A: on-hit status offense, behind a cursed gate -------------
  { id:'sk11i_gate_a', parent:'unlock_items2_hub', cost:1, cursed:true,
    name:'Cracked Reliquary Seal',
    desc:'Breaking the seal costs something everywhere at once. Permanently reduces dodge chance by 2% for every character. Required to reach the status-effect caches beyond it.',
    effects: skillTreeGlobalDebuffEffects('dodgeChance', -0.02) },
  { id:'sk11i_a_hexbead', parent:'sk11i_gate_a', cost:1,
    name:'Knucklebead Cache',
    desc:'Unlocks Hexed Knucklebead: +6% chance to stun an enemy on hit.',
    effect:{ type:'unlock', category:'item', id:'sk11i_hexbead' } },
  { id:'sk11i_a_witheredfang', parent:'sk11i_a_hexbead', cost:1,
    name:'Fang-Keeper\'s Cache',
    desc:'Unlocks Withered Fang: +6% chance to poison an enemy on hit.',
    effect:{ type:'unlock', category:'item', id:'sk11i_witheredfang' } },
  { id:'sk11i_a_ashencrown', parent:'sk11i_a_witheredfang', cost:2,
    name:'Coronet-Sealer\'s Cache',
    desc:'Unlocks Ashen Coronet: +6% critical hit chance.',
    effect:{ type:'unlock', category:'item', id:'sk11i_ashencrown' } },

  // --- chain B: crowd control + defense, behind a second cursed gate ----
  { id:'sk11i_gate_b', parent:'unlock_items2_hub', cost:1, cursed:true,
    name:'Bloodied Reliquary Hinge',
    desc:'The hinge only turns for a price. Permanently reduces fear chance on hit by 2% for every character. Required to reach the defensive caches beyond it.',
    effects: skillTreeGlobalDebuffEffects('fearChance', -0.02) },
  { id:'sk11i_b_duskveil', parent:'sk11i_gate_b', cost:1,
    name:'Mantle-Weaver\'s Cache',
    desc:'Unlocks Duskveil Mantle: +6% chance to make an enemy flee in fear on hit.',
    effect:{ type:'unlock', category:'item', id:'sk11i_duskveil' } },
  { id:'sk11i_b_bombward', parent:'sk11i_b_duskveil', cost:1,
    name:'Sigil-Sealer\'s Cache',
    desc:'Unlocks Bombward Sigil: +12% bomb blast radius.',
    effect:{ type:'unlock', category:'item', id:'sk11i_bombward' } },
  { id:'sk11i_b_dodgering', parent:'sk11i_b_bombward', cost:1,
    name:'Ring-Sealer\'s Cache',
    desc:'Unlocks Dodging Signet-Ring: +6% chance to dodge incoming damage entirely.',
    effect:{ type:'unlock', category:'item', id:'sk11i_dodgering' } },
  { id:'sk11i_b_edgehone', parent:'sk11i_b_dodgering', cost:2,
    name:'Stone-Sealer\'s Cache',
    desc:'Unlocks Honing Edge-Stone: critical hits deal even more damage.',
    effect:{ type:'unlock', category:'item', id:'sk11i_edgehone' } },
  { id:'sk11i_b_healcrest', parent:'sk11i_b_edgehone', cost:1,
    name:'Crest-Sealer\'s Cache',
    desc:'Unlocks Healing Crest: +6% chance to heal half a heart whenever you kill an enemy.',
    effect:{ type:'unlock', category:'item', id:'sk11i_healcrest' } },
];

for (const n of SKILL_TREE_ITEM2_UNLOCK_NODES) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

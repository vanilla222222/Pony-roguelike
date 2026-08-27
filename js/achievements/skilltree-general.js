'use strict';
// achievements/skilltree-general.js — Phase 8d: the 25 general-upgrade skill
// nodes, attached under the existing `general_hub` node (skilltree.js). Pure
// data, appended onto SKILL_TREE_NODES/SKILL_TREE_NODES_BY_ID — no engine
// logic lives here (see skilltree.js for buySkillNode, applySkillTreePoolNudge,
// applySkillTreeStartingPickups, computeSkillTreeLayout, etc).
//
// Unlike the 250 character nodes (skilltree-characters.js/-2.js), these are
// deliberately SIMPLE per the Phase 8d design brief: mostly one `poolWeight`
// or one `startingPickup` effect each, cost 1 point, real hand-written
// name/desc per node. Only two nodes bundle two effects (small, related
// nudges), never an elaborate multi-effect trade-off the way character
// branches do.
//
// Pool-nudge coverage: room.js's spawnClearRoomPickup already wrapped
// COMMON_CATEGORY_POOL/COMMON_PENNY_POOL/COMMON_HEART_POOL/RARE_POOL/
// LEGENDARY_POOL with applySkillTreePoolNudge before this phase. This phase
// additionally wraps BOMB_TIER_POOL/KEY_TIER_POOL/CHEST_TYPE_POOL at their
// room-clear call sites in room.js (the filter for BOMB_TIER_POOL/
// KEY_TIER_POOL's locked kinds now runs BEFORE the nudge clone, since the
// clone only carries {id,w} and would drop the `locked` flag the filter
// needs — see the room.js call sites and applySkillTreePoolNudge's comment
// in skilltree.js). rollGenericPickupKind()'s own BOMB_TIER_POOL/
// KEY_TIER_POOL rolls (the generic-pickup re-roll used by chests/sacks/
// sacrifice spikes, NOT room-clear) are intentionally left unwrapped — this
// phase only targets room-clear reward pools per the design brief.
//
// Topology — five hand-shaped sub-branches off general_hub (varied
// width/depth, not one repeated template):
//
//   general_hub
//     +- gen_loot_hub      "Loot Weights"      (7 nodes: category + coin/heart sub-tier nudges)
//     +- gen_supply_hub    "Supply Drops"      (6 nodes: category + bomb/key tier nudges)
//     +- gen_start_*       "Starting Supplies" (5 nodes: startingPickup effects)
//     +- gen_rare_gate     CURSED GATE (Mega A step 4) -> gen_rare_hub
//     +- gen_leg_gate      CURSED GATE (Mega A step 4) -> gen_leg_hub
//     +- gen_rare_hub      "Rare & Legendary Fortune" (6 nodes: RARE_POOL/LEGENDARY_POOL nudges; now behind the two gates above)
//     +- gen_chest_hub     "Chest Fortune"     (1 node: CHEST_TYPE_POOL nudge)
//
// Weight-nudge sizing: every bonus was picked so that even in the worst
// case — EVERY node targeting a given pool+id bought at once — that entry's
// weight roughly doubles at most (see the per-node comments below for the
// base -> worst-case-stacked arithmetic; the verification harness re-checks
// this against the real economy.js constants).
// Mega A step 4 debuff gates. The two "fortune" sub-branches (Rare &
// Legendary Fortune, and its Legendary half) are the strongest reward-pool
// branches in this file, and both hung straight off `general_hub` for free.
// Each now sits behind one mandatory cursed gate node, exactly the pattern
// achievements/skilltree-characters-3.js uses: the gate takes the hub as its
// parent, the old hub-child is re-pointed at the gate, and the gate carries
// ONLY negative 'stat' effects.
//
// General nodes are class-agnostic, but skilltree.js's getSkillTreeStatBonus
// matches `eff.classId === classId` against a REAL class id — there is no
// 'ALL' wildcard in the engine, and this file must not add one (no engine
// changes in this pass). A genuinely global debuff is therefore expressed the
// only way the engine supports it: an `effects` ARRAY carrying one identical
// negative entry per class id in CLASSES, so every character pays the same
// price. Kept at -0.02 on `luck` (thematically "fortune") — with both gates
// bought that is -0.04 luck for every class, well inside skilltree.js's
// symmetric [-0.25, 0.25] SKILL_TREE_STAT_CAP alongside everything else.
function skillTreeGlobalDebuffEffects(stat, amount){
  return Object.keys(CLASSES).map(classId => ({ type:'stat', classId, stat, amount }));
}

const SKILL_TREE_GENERAL_NODES = [
  // --- Loot Weights branch (7 nodes) ---------------------------------
  // COMMON_CATEGORY_POOL: penny 25, heart 25, bomb 25, key 25 (see Supply
  // Drops branch below for the bomb/key category nudges).
  { id:'gen_loot_hub', parent:'general_hub', cost:1,
    name:'Coin Instinct',
    desc:'Slightly increases the odds of coins from room-clear rewards.',
    effect:{ type:'poolWeight', pool:'COMMON_CATEGORY_POOL', id:'penny', bonus:2 } }, // 25 -> 27
  { id:'gen_loot_coins', parent:'gen_loot_hub', cost:1,
    name:'Sharper Eye for Silver',
    desc:'Slightly increases the odds of a nickel over a plain penny.',
    effect:{ type:'poolWeight', pool:'COMMON_PENNY_POOL', id:'nickel', bonus:2 } }, // 7 -> 9
  { id:'gen_loot_coins2', parent:'gen_loot_coins', cost:1,
    name:'Gilded Instinct',
    desc:'Slightly increases the odds of a dime over a plain penny.',
    effect:{ type:'poolWeight', pool:'COMMON_PENNY_POOL', id:'dime', bonus:1 } }, // 2 -> 3
  { id:'gen_loot_luck', parent:'gen_loot_hub', cost:1,
    name:'Fortunate Find',
    desc:'Slightly increases the odds of a lucky penny over a plain penny.',
    effect:{ type:'poolWeight', pool:'COMMON_PENNY_POOL', id:'luckypenny', bonus:1 } }, // 1 -> 2
  { id:'gen_loot_hearts', parent:'general_hub', cost:1,
    name:'Vital Instinct',
    desc:'Slightly increases the odds of hearts from room-clear rewards.',
    effect:{ type:'poolWeight', pool:'COMMON_CATEGORY_POOL', id:'heart', bonus:2 } }, // 25 -> 27
  { id:'gen_loot_blueheart', parent:'gen_loot_hearts', cost:1,
    name:'Soulbound Affinity',
    desc:'Slightly increases the odds of a blue heart over a red one.',
    effect:{ type:'poolWeight', pool:'COMMON_HEART_POOL', id:'heartBlue', bonus:3 } }, // 25 -> 28
  { id:'gen_loot_doubleheart', parent:'gen_loot_hearts', cost:1,
    name:'Twin Heart Sense',
    desc:'Slightly increases the odds of a double heart from room-clear rewards.',
    effect:{ type:'poolWeight', pool:'COMMON_HEART_POOL', id:'doubleheart', bonus:1 } }, // 3 -> 4

  // --- Supply Drops branch (6 nodes) ---------------------------------
  { id:'gen_supply_hub', parent:'general_hub', cost:1,
    name:"Explosive Instinct",
    desc:'Slightly increases the odds of bombs from room-clear rewards.',
    effect:{ type:'poolWeight', pool:'COMMON_CATEGORY_POOL', id:'bomb', bonus:3 } }, // 25 -> 28
  { id:'gen_supply_doublebomb', parent:'gen_supply_hub', cost:1,
    name:'Twin Fuse',
    desc:'Slightly increases the odds of a double bomb over a plain bomb.',
    effect:{ type:'poolWeight', pool:'BOMB_TIER_POOL', id:'doublebomb', bonus:2 } }, // 8 -> 10
  { id:'gen_supply_goldbomb', parent:'gen_supply_doublebomb', cost:1,
    name:'Golden Fuse',
    desc:'Slightly increases the odds of a golden bomb over a plain bomb.',
    effect:{ type:'poolWeight', pool:'BOMB_TIER_POOL', id:'goldbomb', bonus:1 } }, // 2 -> 3
  { id:'gen_supply_key_hub', parent:'general_hub', cost:1,
    name:"Locksmith's Instinct",
    desc:'Slightly increases the odds of keys from room-clear rewards.',
    effect:{ type:'poolWeight', pool:'COMMON_CATEGORY_POOL', id:'key', bonus:3 } }, // 25 -> 28
  { id:'gen_supply_doublekey', parent:'gen_supply_key_hub', cost:1,
    name:'Twin Ward',
    desc:'Slightly increases the odds of a double key over a plain key.',
    effect:{ type:'poolWeight', pool:'KEY_TIER_POOL', id:'doublekey', bonus:2 } }, // 8 -> 10
  { id:'gen_supply_goldkey', parent:'gen_supply_doublekey', cost:1,
    name:'Golden Ward',
    desc:'Slightly increases the odds of a golden key over a plain key.',
    effect:{ type:'poolWeight', pool:'KEY_TIER_POOL', id:'goldkey', bonus:1 } }, // 2 -> 3

  // --- Starting Supplies branch (5 nodes) -----------------------------
  { id:'gen_start_hub', parent:'general_hub', cost:1,
    name:'Packed Satchel',
    desc:'Start each run with 1 extra bomb.',
    effect:{ type:'startingPickup', pickup:'bombs', amount:1 } },
  { id:'gen_start_keys', parent:'gen_start_hub', cost:1,
    name:'Ready Keyring',
    desc:'Start each run with 1 extra key.',
    effect:{ type:'startingPickup', pickup:'keys', amount:1 } },
  { id:'gen_start_coins', parent:'general_hub', cost:1,
    name:'Spare Change',
    desc:'Start each run with 3 extra coins.',
    effect:{ type:'startingPickup', pickup:'coins', amount:3 } },
  { id:'gen_start_coins2', parent:'gen_start_coins', cost:1,
    name:'Deeper Pockets',
    desc:'Start each run with 2 more extra coins.',
    effect:{ type:'startingPickup', pickup:'coins', amount:2 } },
  { id:'gen_start_blue', parent:'general_hub', cost:1,
    name:'Soul Reserve',
    desc:'Start each run with 1 extra soul (blue) heart.',
    effect:{ type:'startingPickup', pickup:'blue', amount:1 } },

  // --- Rare & Legendary Fortune branch (6 nodes) ----------------------
  { id:'gen_rare_gate', parent:'general_hub', cost:1, cursed:true,
    name:'Toll of the Rare Find',
    desc:'Fortune this good is never free. Permanently reduces luck by 2%. Required to reach the Rare & Legendary Fortune branch.',
    effects: skillTreeGlobalDebuffEffects('luck', -0.02) },
  { id:'gen_rare_hub', parent:'gen_rare_gate', cost:1,
    name:'Starlit Favor',
    desc:'Slightly increases the odds of a star from a rare room-clear reward.',
    effect:{ type:'poolWeight', pool:'RARE_POOL', id:'star', bonus:3 } }, // 20 -> 23
  { id:'gen_rare_sack', parent:'gen_rare_hub', cost:1,
    name:'Bountiful Sack',
    desc:'Slightly increases the odds of a sack from a rare room-clear reward.',
    effect:{ type:'poolWeight', pool:'RARE_POOL', id:'sack', bonus:3 } }, // 20 -> 23
  { id:'gen_rare_battery', parent:'gen_rare_hub', cost:1,
    name:'Charged Instinct',
    desc:'Slightly increases the odds of a battery from a rare room-clear reward.',
    effect:{ type:'poolWeight', pool:'RARE_POOL', id:'battery', bonus:3 } }, // 15 -> 18 (before Generous Recovery below)
  { id:'gen_rare_generous', parent:'gen_rare_battery', cost:1,
    name:'Generous Recovery',
    desc:'Slightly increases the odds of both batteries and half blue hearts from room-clear rewards.',
    effects:[
      { type:'poolWeight', pool:'RARE_POOL', id:'battery', bonus:2 }, // combined with Charged Instinct: 15 -> 20 worst case
      { type:'poolWeight', pool:'COMMON_HEART_POOL', id:'halfheartBlue', bonus:2 }, // 10 -> 12
    ] },
  { id:'gen_leg_gate', parent:'general_hub', cost:1, cursed:true,
    name:'Toll of the Legendary Find',
    desc:'The rarest drops demand the steepest toll. Permanently reduces luck by 2%. Required to reach the legendary half of the Fortune branch.',
    effects: skillTreeGlobalDebuffEffects('luck', -0.02) },
  { id:'gen_leg_hub', parent:'gen_leg_gate', cost:1,
    name:'Trinket Sense',
    desc:'Slightly increases the odds of a trinket from a legendary room-clear reward.',
    effect:{ type:'poolWeight', pool:'LEGENDARY_POOL', id:'trinket', bonus:3 } }, // 48 -> 51
  { id:'gen_leg_familiar', parent:'gen_leg_hub', cost:1,
    name:'Companion Call',
    desc:'Slightly increases the odds of a familiar from a legendary room-clear reward.',
    effect:{ type:'poolWeight', pool:'LEGENDARY_POOL', id:'familiar', bonus:1 } }, // 2 -> 3

  // --- Chest Fortune branch (1 node) ----------------------------------
  { id:'gen_chest_hub', parent:'general_hub', cost:1,
    name:'Cursed Curiosity',
    desc:'Slightly increases the odds of a cursed chest whenever a chest appears.',
    effect:{ type:'poolWeight', pool:'CHEST_TYPE_POOL', id:'cursed', bonus:2 } }, // 10 -> 12
];

for (const n of SKILL_TREE_GENERAL_NODES) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

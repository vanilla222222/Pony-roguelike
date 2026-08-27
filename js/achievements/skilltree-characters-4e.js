'use strict';
// achievements/skilltree-characters-4e.js — Phase 10 Part B, skill tree
// megaupdate, Group 5 of 5: 250 NEW character skill nodes (50 each for
// gargoyle, changedling, changelingqueen, filly, engineerpony). Pure data,
// appended onto the SKILL_TREE_NODES array / SKILL_TREE_NODES_BY_ID map
// defined in skilltree.js — no engine logic lives here.
//
// Branch-letter space reserved for this whole Phase 10 skill-tree pass:
// i, j, k, l (a-h are already used by skilltree-characters.js /
// -characters-2.js / -characters-3.js). Node id convention:
// 'char_' + classId + '_' + key, unchanged from every prior file.
//
// Topology — IDENTICAL for all five characters, four fresh branches hung
// straight off that character's existing char_hub_<classId> node (never
// re-parenting or editing any node from a-h):
//
//   char_hub_<classId>
//     +- i1
//     |    +- i2a -> i3a -> i4a -> i5a -> i6 -> i8      (7-node "a" spine)
//     |    +- i2b -> i3b -> i4b -> i5b -> i7 -> i9      (6-node "b" spine)
//     +- j1   (same 13-node shape as i)
//     +- k1   (same shape, but the b-spine stops at k7 and the a-spine at
//     +- l1    k8 — 12 nodes; l matches k)
//
//   13 (i) + 13 (j) + 12 (k) + 12 (l) = 50 nodes per character.
//
// Design mandate honored here (per the Phase 10 brief):
//  - The MAJORITY of every character's 50 nodes read as character-specific:
//    they amplify, complicate, or add a wrinkle to that class's own unique
//    mechanic (see js/data/core.js for each class def and js/entities/
//    entities.js for the per-instance shadow fields a uniqueField node can
//    legally target), rather than being flat stat sticks. The pure-stat
//    nodes that remain are deliberately themed onto that mechanic's fiction.
//  - Every genuinely powerful addition carries a REAL cost, Soy-Milk style:
//    either a negative 'stat'/'uniqueField' effect bundled into the same
//    node via `effects:[...]`, or a `cursed:true` gate node (the convention
//    from skilltree-characters-3.js: a cursed node carries ONLY negative
//    effects and is the sole parent of everything below it, so the payoff
//    is structurally unreachable without eating the debuff first — see
//    canBuySkillNode in skilltree.js).
//  - Cap discipline: skilltree.js clamps each (classId, stat) summed bonus
//    to +/-SKILL_TREE_STAT_CAP (0.25), except lifestealChance which is
//    capped at 0.10 by SKILL_TREE_STAT_CAP_OVERRIDES. Every stat total in
//    this file was tracked against the totals ALREADY contributed by
//    skilltree-characters{,-2,-3}.js for the same character, so no
//    (classId, stat) pair in this file's worst case (every node bought)
//    exceeds its ceiling. Chance-type stats are deliberately concentrated
//    into a FEW nodes per character rather than sprinkled across all 50.
//    Full per-character table:
//    feature-research/phase10-metaprogression/audit-skilltree-group5.md
//
// Per-character mechanic hooks used here:
//  - gargoyle          innateVulnerableChance (core.js) + the generic
//                      damageTakenMult shadow field (entities.js) as a
//                      two-way "stone hide / sun-cracked shell" knob.
//  - changedling       innateFireRing/fireRingRadius, plus a capstone that
//                      grants her summonsChangelings (uniqueFlag) and then
//                      has to pay for the borrowed hive in ranged damage,
//                      speed and fragility.
//  - changelingqueen   her hive (changelingMinionRadius/changelingMinionDmg,
//                      the two minion knobs skilltree-characters-2.js left
//                      headroom on) AND her own under-used greenFireAttack
//                      pool (fireZoneRadius/fireZoneRange/fireZoneRootMult).
//  - filly             innateCharmChance, plus borrowed shockwaveAttack
//                      (uniqueFlag) + rockCoinChance — the "hooves too small
//                      for a proper kick" filly learning to break rock.
//  - engineerpony      turretDamageMult's remaining headroom, damageTakenMult,
//                      and an unlimitedRange (uniqueFlag) railgun capstone
//                      bought with ranged damage and fire cooldown.

// ---------------------------------------------------------------------------
// Shared topology. Value is the PARENT key within the same character's 50
// (or the sentinel 'hub', meaning char_hub_<classId>).
const SKILL_TREE_TOPOLOGY_4E = {
  i1:'hub', i2a:'i1', i3a:'i2a', i4a:'i3a', i5a:'i4a', i6:'i5a', i8:'i6',
           i2b:'i1', i3b:'i2b', i4b:'i3b', i5b:'i4b', i7:'i5b', i9:'i7',
  j1:'hub', j2a:'j1', j3a:'j2a', j4a:'j3a', j5a:'j4a', j6:'j5a', j8:'j6',
           j2b:'j1', j3b:'j2b', j4b:'j3b', j5b:'j4b', j7:'j5b', j9:'j7',
  k1:'hub', k2a:'k1', k3a:'k2a', k4a:'k3a', k5a:'k4a', k6:'k5a', k8:'k6',
           k2b:'k1', k3b:'k2b', k4b:'k3b', k5b:'k4b', k7:'k5b',
  l1:'hub', l2a:'l1', l3a:'l2a', l4a:'l3a', l5a:'l4a', l6:'l5a', l8:'l6',
           l2b:'l1', l3b:'l2b', l4b:'l3b', l5b:'l4b', l7:'l5b',
};
// Emission order: parents always before their children, purely for
// readability of the generated array (the engine itself is order-agnostic).
const SKILL_TREE_ORDER_4E = [
  'i1','i2a','i3a','i4a','i5a','i6','i8','i2b','i3b','i4b','i5b','i7','i9',
  'j1','j2a','j3a','j4a','j5a','j6','j8','j2b','j3b','j4b','j5b','j7','j9',
  'k1','k2a','k3a','k4a','k5a','k6','k8','k2b','k3b','k4b','k5b','k7',
  'l1','l2a','l3a','l4a','l5a','l6','l8','l2b','l3b','l4b','l5b','l7',
];

const SKILL_TREE_CHARACTER_CONFIG_4E = [
  // =========================================================================
  // GARGOYLE — the stone sentinel. Her whole kit is innateVulnerableChance
  // (10% of hits mark the target as easy prey for everything in the room);
  // skilltree-characters-2.js already pushed vulnerableChance to +0.19, so
  // this pass spends the last 0.06 of that headroom and then expresses
  // "marked prey" through the fields nothing has touched yet (fear, venom,
  // stun, freeze) plus a two-way damageTakenMult stone-hide knob.
  // =========================================================================
  { classId:'gargoyle', nodes:{
    i1:{ name:'Quarried Torpor', desc:'Stone that thick does not hurry. Permanently reduces movement speed by 6%. Nothing further down this path opens without it.', cursed:true,
      effects:[{ type:'stat', classId:'gargoyle', stat:'speed', amount:-0.06 }] },
    i2a:{ name:'Granite Hide', desc:'The grit-hard hide thickens into proper masonry. Take 8% less damage from every source.',
      effects:[{ type:'uniqueField', classId:'gargoyle', field:'damageTakenMult', amount:-0.08, min:-0.35, max:0.5 }] },
    i3a:{ name:'Basalt Plating', desc:'Volcanic glass fused into the shoulders. Take 6% less damage, but the extra mass costs another 2% movement speed.',
      effects:[{ type:'uniqueField', classId:'gargoyle', field:'damageTakenMult', amount:-0.06, min:-0.35, max:0.5 },
               { type:'stat', classId:'gargoyle', stat:'speed', amount:-0.02 }] },
    i4a:{ name:'Weathered Buttress', desc:'A century of rain only ever made her harder to break. Take 6% less damage.',
      effects:[{ type:'uniqueField', classId:'gargoyle', field:'damageTakenMult', amount:-0.06, min:-0.35, max:0.5 }] },
    i5a:{ name:'Cathedral Ballast', desc:'She carries the weight of the whole roofline now. Take 5% less damage; her swing gets 4% lazier for it.',
      effects:[{ type:'uniqueField', classId:'gargoyle', field:'damageTakenMult', amount:-0.05, min:-0.35, max:0.5 },
               { type:'stat', classId:'gargoyle', stat:'meleeCooldown', amount:0.04 }] },
    i6:{ name:'Load-Bearing Wings', desc:'Stone wings that can shrug a blow aside instead of catching it. Increases dodge chance by 6%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'dodgeChance', amount:0.06 }] },
    i8:{ name:'Perch of the Long Night', desc:'She has waited out worse than this. Increases dodge chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'dodgeChance', amount:0.05 }] },
    i2b:{ name:'Sun-Cracked Shell', desc:'Daylight got into the stone and left it spidered through. Permanently take 12% MORE damage. Everything below this branch is bought with that crack.', cursed:true,
      effects:[{ type:'uniqueField', classId:'gargoyle', field:'damageTakenMult', amount:0.12, min:-0.35, max:0.5 }] },
    i3b:{ name:'Fracture Feeding', desc:'The crack has to be fed something. Increases lifesteal chance by 4%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'lifestealChance', amount:0.04 }] },
    i4b:{ name:'Grit in the Wound', desc:'Stone dust packed into every hit she lands, and drawn back out again. Increases lifesteal chance by 3%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'lifestealChance', amount:0.03 }] },
    i5b:{ name:'Rubble Mend', desc:'A fallen enemy is just more material. Increases on-kill heal chance by 6%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'onKillHealChance', amount:0.06 }] },
    i7:{ name:'Sediment Recovery', desc:'Slow, layered, geological repair. Increases on-kill heal chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'onKillHealChance', amount:0.05 }] },
    i9:{ name:'Reassembled at Dawn', desc:'Whatever came apart in the night is back on the parapet by morning. Increases on-kill heal chance by 5% and seals 5% of the sun-crack back up.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'onKillHealChance', amount:0.05 },
               { type:'uniqueField', classId:'gargoyle', field:'damageTakenMult', amount:-0.05, min:-0.35, max:0.5 }] },

    j1:{ name:'Mark Without Malice', desc:'Marking prey for the whole room means less of the kill is hers. Permanently reduces ranged damage by 5%. Required to walk this path.', cursed:true,
      effects:[{ type:'stat', classId:'gargoyle', stat:'rangedDamage', amount:-0.05 }] },
    j2a:{ name:'Quarry Sigil Deepened', desc:'The mark she leaves bites a little further in. Increases vulnerable chance by 3%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'vulnerableChance', amount:0.03 }] },
    j3a:{ name:'Prey-Sense', desc:'She knows which one is already hurt. Increases fear chance by 6%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'fearChance', amount:0.06 }] },
    j4a:{ name:"Predator's Silhouette", desc:'A shape on the roofline that nothing wants to be under. Increases fear chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'fearChance', amount:0.05 }] },
    j5a:{ name:'Terror From the Eaves', desc:'Statues are not supposed to move. Increases fear chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'fearChance', amount:0.05 }] },
    j6:{ name:'Roost Shadow', desc:'Her shadow reaches the floor long before she does. Increases fear chance by 4%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'fearChance', amount:0.04 }] },
    j8:{ name:'Nightfall Panic', desc:'Sundown is when the roofline starts moving. Increases fear chance by 4%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'fearChance', amount:0.04 }] },
    j2b:{ name:'Spread the Word', desc:'One mark, and the whole room agrees on the target. Increases vulnerable chance by 3%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'vulnerableChance', amount:0.03 }] },
    j3b:{ name:'Brittle Concentration', desc:'Holding a mark on everything at once means holding nothing tightly. Permanently reduces ranged damage by 4%. The rest of this branch demands it.', cursed:true,
      effects:[{ type:'stat', classId:'gargoyle', stat:'rangedDamage', amount:-0.04 }] },
    j4b:{ name:'Chipped Fang Venom', desc:'Old stone teeth carry old stone filth. Increases venom chance by 6%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'venomChance', amount:0.06 }] },
    j5b:{ name:'Limestone Toxin', desc:'Powdered rock in an open wound does not sit well. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'venomChance', amount:0.05 }] },
    j7:{ name:'Dust in the Lungs', desc:'They breathe her in with every hit. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'venomChance', amount:0.05 }] },
    j9:{ name:'Erosion Sickness', desc:'Whatever she marks starts wearing away on its own. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'venomChance', amount:0.05 }] },

    k1:{ name:"Sentinel's Vantage", desc:'She was built to watch a whole courtyard at once. Increases range by 6%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'rangeTiles', amount:0.06 }] },
    k2a:{ name:'Long Sightline', desc:'Nothing crosses the square unnoticed. Increases range by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'rangeTiles', amount:0.05 }] },
    k3a:{ name:'Belfry Angle', desc:'Height is its own kind of reach. Increases range by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'rangeTiles', amount:0.05 }] },
    k4a:{ name:"Gargoyle's Reach", desc:'Stone arms are longer than they look. Increases range by 4%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'rangeTiles', amount:0.04 }] },
    k5a:{ name:'Spire Overwatch', desc:'She holds the whole spire, and takes her time about it. Increases range by 4%, but each shot takes 3% longer to come around.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'rangeTiles', amount:0.04 },
               { type:'stat', classId:'gargoyle', stat:'fireCooldown', amount:0.03 }] },
    k6:{ name:'Chisel Bolt', desc:'A shard spat hard enough to cut masonry. Increases bolt speed by 6%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'boltSpeed', amount:0.06 }] },
    k8:{ name:'Ricochet off the Cornice', desc:'She has been bouncing chips off this architecture for centuries. Increases bolt speed by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'boltSpeed', amount:0.05 }] },
    k2b:{ name:'Cracked Jawstone', desc:'Something in the jaw gave out, and the precise bites went with it. Permanently reduces critical hit chance by 5%. The petrifying path opens only past it.', cursed:true,
      effects:[{ type:'stat', classId:'gargoyle', stat:'critChance', amount:-0.05 }] },
    k3b:{ name:'Shrapnel Bite', desc:'What she spits comes apart on impact. Increases stun chance by 6%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'stunChance', amount:0.06 }] },
    k4b:{ name:'Concussive Grit', desc:'A faceful of rock dust ends most arguments. Increases stun chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'stunChance', amount:0.05 }] },
    k5b:{ name:'Petrifying Gaze', desc:'For a moment they forget how to be anything but a statue too. Increases stun chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'stunChance', amount:0.05 }] },
    k7:{ name:'Statuary Stillness', desc:'She stops dead, and so does whatever is looking at her. Increases stun chance by 5%, at the cost of 3% movement speed.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'stunChance', amount:0.05 },
               { type:'stat', classId:'gargoyle', stat:'speed', amount:-0.03 }] },

    l1:{ name:'Daylight Dormancy', desc:'Half of every day is spent as scenery, and fortune does not wait around. Permanently reduces luck by 5%. Required to press on.', cursed:true,
      effects:[{ type:'stat', classId:'gargoyle', stat:'luck', amount:-0.05 }] },
    l2a:{ name:'Moonlit Avarice', desc:'Everything shiny in the courtyard, eventually, ends up on her ledge. Increases pickup magnet radius by 6%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'magnetRadius', amount:0.06 }] },
    l3a:{ name:'Gutterspout Draw', desc:'She was carved as a drain. Everything runs toward her. Increases pickup magnet radius by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'magnetRadius', amount:0.05 }] },
    l4a:{ name:'Rain-Channel Pull', desc:'Centuries of runoff carved grooves that all point one way. Increases pickup magnet radius by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'magnetRadius', amount:0.05 }] },
    l5a:{ name:'Hoard in the Rafters', desc:'Nopony has checked up there in a very long time. Increases pickup magnet radius by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'magnetRadius', amount:0.05 }] },
    l6:{ name:'Cold-Blooded Aim', desc:'No pulse to spoil the shot. Increases critical hit chance by 6%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'critChance', amount:0.06 }] },
    l8:{ name:'Keystone Strike', desc:'She knows exactly which stone the whole thing rests on. Increases critical hit chance by 6%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'critChance', amount:0.06 }] },
    l2b:{ name:'Frost on the Facade', desc:'Winter mornings, and everything she touches keeps the chill. Increases freeze chance by 6%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'freezeChance', amount:0.06 }] },
    l3b:{ name:'Hairline Fracture', desc:'Frost got into the stone and started prying. Permanently reduces luck by 4%. The deepest cold on this branch demands it.', cursed:true,
      effects:[{ type:'stat', classId:'gargoyle', stat:'luck', amount:-0.04 }] },
    l4b:{ name:'Winter Vigil', desc:'She does not mind the cold. Nothing else in the room agrees. Increases freeze chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'freezeChance', amount:0.05 }] },
    l5b:{ name:'Ice in the Joints', desc:'The chill she spreads is the same one slowing her own hinges. Increases freeze chance by 5%, and costs 3% movement speed.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'freezeChance', amount:0.05 },
               { type:'stat', classId:'gargoyle', stat:'speed', amount:-0.03 }] },
    l7:{ name:'Frozen Sentinel', desc:'A statue at the center of a spreading rime. Increases freeze chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'freezeChance', amount:0.05 }] },
  }},

  // =========================================================================
  // CHANGEDLING — the changeling who never finished the change. Her whole
  // identity is innateFireRing: a permanent, mobile, effortless ring of green
  // fire (fireRingRadius, entities.js shadow field), paid for with 4 hearts
  // of shell and half the Changeling's dps. This pass leans on the ring, on
  // her fragility (damageTakenMult), and finishes on a capstone that borrows
  // the Queen's hive outright — at a real price in her own output.
  // =========================================================================
  { classId:'changedling', nodes:{
    i1:{ name:'Smouldering Debt', desc:'A fire that never goes out still has to be paid for. The ring pulses 5% slower forever. Nothing deeper opens without it.', cursed:true,
      effects:[{ type:'stat', classId:'changedling', stat:'fireCooldown', amount:0.05 }] },
    i2a:{ name:'Wider Cinders', desc:'The trailing embers spread a little further from the shell. Widens her fire ring.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'fireRingRadius', amount:3, min:0, max:30 }] },
    i3a:{ name:'Coal-Bright Hem', desc:'The edge of the ring glows properly now instead of guttering. Widens her fire ring.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'fireRingRadius', amount:3, min:0, max:30 }] },
    i4a:{ name:'Ash Bloom', desc:'Every pulse of the ring lands with real heat behind it. Increases ranged damage by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'rangedDamage', amount:0.05 }] },
    i5a:{ name:'Green Sear', desc:'Changeling fire burns colder-looking and hotter-feeling. Increases ranged damage by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'rangedDamage', amount:0.05 }] },
    i6:{ name:'Everburning Trail', desc:'She leaves a scorch line wherever she flies. Increases ranged damage by 4%.',
      effects:[{ type:'stat', classId:'changedling', stat:'rangedDamage', amount:0.04 }] },
    i8:{ name:'Chitin Furnace', desc:'The shell itself is the firebox now — which means the shell is what gets cooked. Increases ranged damage by 4%, and she takes 8% more damage.',
      effects:[{ type:'stat', classId:'changedling', stat:'rangedDamage', amount:0.04 },
               { type:'uniqueField', classId:'changedling', field:'damageTakenMult', amount:0.08, min:-0.3, max:0.5 }] },
    i2b:{ name:'Thin-Shelled', desc:'The change never finished, and neither did the carapace. Permanently take 12% more damage. Everything below is bought with it.', cursed:true,
      effects:[{ type:'uniqueField', classId:'changedling', field:'damageTakenMult', amount:0.12, min:-0.3, max:0.5 }] },
    i3b:{ name:'Molten Marrow', desc:'What burns in her can be topped back up from somepony else. Increases lifesteal chance by 4%.',
      effects:[{ type:'stat', classId:'changedling', stat:'lifestealChance', amount:0.04 }] },
    i4b:{ name:'Fed by the Burn', desc:'The ring takes a little back with every pass. Increases lifesteal chance by 3%.',
      effects:[{ type:'stat', classId:'changedling', stat:'lifestealChance', amount:0.03 }] },
    i5b:{ name:'Cocoon Never Closed', desc:'An unfinished chrysalis is still a chrysalis. Increases on-kill heal chance by 6%.',
      effects:[{ type:'stat', classId:'changedling', stat:'onKillHealChance', amount:0.06 }] },
    i7:{ name:'Ash to Ichor', desc:'She reclaims whatever the fire leaves behind. Increases on-kill heal chance by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'onKillHealChance', amount:0.05 }] },
    i9:{ name:'Half-Made Regeneration', desc:'Being stuck mid-change means she can always change a little further. Increases on-kill heal chance by 5% and hardens the shell back by 10%.',
      effects:[{ type:'stat', classId:'changedling', stat:'onKillHealChance', amount:0.05 },
               { type:'uniqueField', classId:'changedling', field:'damageTakenMult', amount:-0.10, min:-0.3, max:0.5 }] },

    j1:{ name:'Guttering Wick', desc:'Burning constantly is exhausting, and she is the wick. Permanently reduces movement speed by 5%. Required to press deeper.', cursed:true,
      effects:[{ type:'stat', classId:'changedling', stat:'speed', amount:-0.05 }] },
    j2a:{ name:'Corrosive Smoke', desc:'The smoke off her ring eats at whatever it touches. Increases venom chance by 6%.',
      effects:[{ type:'stat', classId:'changedling', stat:'venomChance', amount:0.06 }] },
    j3a:{ name:'Chitin Rot', desc:'Green flame does unpleasant things to an exoskeleton. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'venomChance', amount:0.05 }] },
    j4a:{ name:'Lingering Fumes', desc:'The air behind her stays wrong for a while. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'venomChance', amount:0.05 }] },
    j5a:{ name:'Hive-Sickness', desc:'Whatever she failed to become, they start catching it. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'venomChance', amount:0.05 }] },
    j6:{ name:'Rot Spiral', desc:'The scorch line she trails keeps working long after she has flown on. Increases venom chance by 4%.',
      effects:[{ type:'stat', classId:'changedling', stat:'venomChance', amount:0.04 }] },
    j8:{ name:'Fume Saturation', desc:'Anything standing in her smoke is easier for everything else to hurt. Increases vulnerable chance by 6%.',
      effects:[{ type:'stat', classId:'changedling', stat:'vulnerableChance', amount:0.06 }] },
    j2b:{ name:'Panic in the Firelight', desc:'A burning shape flying straight at you is a lot to process. Increases fear chance by 6%.',
      effects:[{ type:'stat', classId:'changedling', stat:'fearChance', amount:0.06 }] },
    j3b:{ name:'Sputtering Ring', desc:'To burn brighter in one place she has to let the ring pull in. Permanently narrows her fire ring. The rest of this branch demands it.', cursed:true,
      effects:[{ type:'uniqueField', classId:'changedling', field:'fireRingRadius', amount:-2, min:0, max:30 }] },
    j4b:{ name:'Bonfire Terror', desc:'Some instincts predate strategy. Increases fear chance by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'fearChance', amount:0.05 }] },
    j5b:{ name:'Wingbeat Roar', desc:'The ring roars every time she beats her wings. Increases fear chance by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'fearChance', amount:0.05 }] },
    j7:{ name:'Scattered by Flame', desc:'They break formation the moment she crosses it. Increases fear chance by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'fearChance', amount:0.05 }] },
    j9:{ name:'Rout', desc:'One pass, and the room is running. Increases fear chance by 4%, though flying that low costs 3% speed.',
      effects:[{ type:'stat', classId:'changedling', stat:'fearChance', amount:0.04 },
               { type:'stat', classId:'changedling', stat:'speed', amount:-0.03 }] },

    k1:{ name:'Restless Wings', desc:'She was never able to sit still long enough to finish changing. Increases movement speed by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'speed', amount:0.05 }] },
    k2a:{ name:'Erratic Flight', desc:'Nothing about her flight path is predictable, including to her. Increases dodge chance by 6%.',
      effects:[{ type:'stat', classId:'changedling', stat:'dodgeChance', amount:0.06 }] },
    k3a:{ name:'Blur of Green', desc:'By the time they aim at the fire, the fire has moved. Increases dodge chance by 4%.',
      effects:[{ type:'stat', classId:'changedling', stat:'dodgeChance', amount:0.04 }] },
    k4a:{ name:'Weightless Husk', desc:'Half a changeling weighs a good deal less than a whole one. Increases movement speed by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'speed', amount:0.05 }] },
    k5a:{ name:'Never Lands', desc:'She has not touched the ground on purpose in years. Increases pickup magnet radius by 6%.',
      effects:[{ type:'stat', classId:'changedling', stat:'magnetRadius', amount:0.06 }] },
    k6:{ name:'Pollen Draw', desc:'The updraft off a burning ring lifts loose things toward her. Increases pickup magnet radius by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'magnetRadius', amount:0.05 }] },
    k8:{ name:"Scavenger's Loop", desc:'One low circuit of the room collects everything worth taking. Increases pickup magnet radius by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'magnetRadius', amount:0.05 }] },
    k2b:{ name:'Brittle Wing-Case', desc:'The wing-case cracked, and with it went whatever bite she had up close. Permanently reduces melee damage by 5%. Required to charm anything past here.', cursed:true,
      effects:[{ type:'stat', classId:'changedling', stat:'meleeDamage', amount:-0.05 }] },
    k3b:{ name:'Startle Charm', desc:'Halfway between two faces, she can hold either one just long enough. Increases charm chance by 6%.',
      effects:[{ type:'stat', classId:'changedling', stat:'charmChance', amount:0.06 }] },
    k4b:{ name:'Half-Formed Sympathy', desc:'It is hard to fight something that looks like it is still becoming somepony. Increases charm chance by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'charmChance', amount:0.05 }] },
    k5b:{ name:'Mimic Pheromone', desc:'The old changeling trick, running on instinct alone. Increases charm chance by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'charmChance', amount:0.05 }] },
    k7:{ name:'Borrowed Face', desc:'Not a good disguise. Good enough. Increases charm chance by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'charmChance', amount:0.05 }] },

    l1:{ name:'Split Attention', desc:'Learning to call a brood means learning to burn less. Permanently reduces ranged damage by 6%. The hive path opens only past it.', cursed:true,
      effects:[{ type:'stat', classId:'changedling', stat:'rangedDamage', amount:-0.06 }] },
    // Phase 11 un-bleed pass — this used to borrow Changeling Queen's
    // `summonsChangelings` flag outright. Now her own `summonsBrood`,
    // driving the same generic orbiting-helper system under her own name.
    l2a:{ name:'Call of the Unfinished', desc:'She was never a queen, but half-formed things answer half-formed things. Grants a drifting brood of her own, each carrying a coal of her ring — and the effort costs 4% movement speed.',
      effects:[{ type:'uniqueFlag', classId:'changedling', field:'summonsBrood', value:true },
               { type:'uniqueField', classId:'changedling', field:'changelingMinionDmg', amount:0.25, min:0, max:1 },
               { type:'stat', classId:'changedling', stat:'speed', amount:-0.04 }] },
    l3a:{ name:'Coal-Bearers', desc:'She splits her own fire between them. Each minion burns harder.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'changelingMinionDmg', amount:0.20, min:0, max:1 }] },
    l4a:{ name:'Ember Swarm', desc:'The brood arrives faster than it has any right to. Shortens the time between summons.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'changelingSummonCooldown', amount:-1.5, min:-5, max:0 }] },
    l5a:{ name:'Brood Hastened', desc:'One goes down, another is already peeling out of the smoke. Shortens the time between summons further.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'changelingSummonCooldown', amount:-1.5, min:-5, max:0 }] },
    l6:{ name:'Third Sibling', desc:'A third half-formed thing joins the circle. Raises her brood cap by one.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'maxChangelingMinions', amount:1, min:0, max:3 }] },
    l8:{ name:'Fourth Sibling', desc:'A fourth, and there is barely any of her left to go around. Raises her brood cap by one, and she takes 10% more damage for the strain.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'maxChangelingMinions', amount:1, min:0, max:3 },
               { type:'uniqueField', classId:'changedling', field:'damageTakenMult', amount:0.10, min:-0.3, max:0.5 }] },
    l2b:{ name:'Wider Coals', desc:'Each brood-coal spreads instead of smouldering in place. Widens her minions\' burn radius.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'changelingMinionRadius', amount:6, min:0, max:24 }] },
    l3b:{ name:'Shared Flame', desc:'Every coal she hands out is one the ring does not get. Permanently narrows her own fire ring. The rest of the brood path demands it.', cursed:true,
      effects:[{ type:'uniqueField', classId:'changedling', field:'fireRingRadius', amount:-2, min:0, max:30 }] },
    l4b:{ name:'Hungry Coals', desc:'They burn outward looking for something to eat. Widens her minions\' burn radius.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'changelingMinionRadius', amount:6, min:0, max:24 }] },
    l5b:{ name:'Brood Reach', desc:'The swarm covers ground she never has to fly over. Widens her minions\' burn radius.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'changelingMinionRadius', amount:5, min:0, max:24 }] },
    l7:{ name:'Mother in Miniature', desc:'Not a queen. A rehearsal for one. Her minions burn harder still, at another 4% off her own ranged damage.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'changelingMinionDmg', amount:0.20, min:0, max:1 },
               { type:'stat', classId:'changedling', stat:'rangedDamage', amount:-0.04 }] },
  }},

  // =========================================================================
  // CHANGELING QUEEN — the hive-mother. Unlike the Changedling (mobile ring)
  // and the base Changeling (big anchored pool), the Queen's own greenFire
  // pool is deliberately feeble and her real output is summonsChangelings.
  // skilltree-characters-2.js maxed her minion COUNT and summon RATE; this
  // pass takes the two knobs it left alone — changelingMinionRadius and the
  // last of changelingMinionDmg — and then, for the first time, upgrades her
  // own neglected fire pool (fireZoneRadius/fireZoneRange/fireZoneRootMult).
  // =========================================================================
  { classId:'changelingqueen', nodes:{
    i1:{ name:'The Hive Eats First', desc:'Whatever she takes goes to the brood before it goes to her horn. Permanently reduces ranged damage by 2%. Nothing on this path opens without it.', cursed:true,
      effects:[{ type:'stat', classId:'changelingqueen', stat:'rangedDamage', amount:-0.02 }] },
    i2a:{ name:'Wider Coals', desc:'Each minion carries a bigger coal of her flame. Widens her minions\' burn radius.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingMinionRadius', amount:5, min:0, max:30 }] },
    i3a:{ name:'Hungrier Brood', desc:'They range further from her before settling. Widens her minions\' burn radius.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingMinionRadius', amount:5, min:0, max:30 }] },
    i4a:{ name:'Swarm Overlap', desc:'Their pools start touching, and anything caught between them cooks twice. Widens her minions\' burn radius.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingMinionRadius', amount:5, min:0, max:30 }] },
    i5a:{ name:'Encircling Hive', desc:'The brood closes a ring the room cannot step out of. Widens her minions\' burn radius.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingMinionRadius', amount:5, min:0, max:30 }] },
    i6:{ name:'Brood Sovereign', desc:'Her authority burns through every one of them. Each minion deals more damage.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingMinionDmg', amount:0.15, min:0, max:0.6 }] },
    i8:{ name:'Coal of the Queen', desc:'She gives them the good flame and keeps the ember. Each minion deals more damage, at another 3% off her own ranged damage.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingMinionDmg', amount:0.15, min:0, max:0.6 },
               { type:'stat', classId:'changelingqueen', stat:'rangedDamage', amount:-0.03 }] },
    i2b:{ name:'Thin Crown', desc:'A monarch who spends everything on her hive has nothing left for her own hide. Permanently take 12% more damage. Required to press on.', cursed:true,
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'damageTakenMult', amount:0.12, min:-0.3, max:0.5 }] },
    i3b:{ name:'Bodyguard Ring', desc:'The brood drifts between her and everything else. Increases dodge chance by 6%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'dodgeChance', amount:0.06 }] },
    i4b:{ name:'Screen of Wings', desc:'Hard to line up a shot through four sets of wings. Increases dodge chance by 4%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'dodgeChance', amount:0.04 }] },
    i5b:{ name:'Drone Shield', desc:'They will take the hit for her, and they do. Take 8% less damage.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'damageTakenMult', amount:-0.08, min:-0.3, max:0.5 }] },
    i7:{ name:'Chitin Throne', desc:'Layered plate grown out of the hive itself. Take 8% less damage.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'damageTakenMult', amount:-0.08, min:-0.3, max:0.5 }] },
    i9:{ name:'Royal Carapace', desc:'The full regalia, and the full weight of it. Take 6% less damage, but move 4% slower.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'damageTakenMult', amount:-0.06, min:-0.3, max:0.5 },
               { type:'stat', classId:'changelingqueen', stat:'speed', amount:-0.04 }] },

    j1:{ name:"Queen's Restraint", desc:'To hold a pool of flame properly she has to stop moving through it. Permanently reduces movement speed by 5%. Her own fire path opens only past it.', cursed:true,
      effects:[{ type:'stat', classId:'changelingqueen', stat:'speed', amount:-0.05 }] },
    j2a:{ name:'Wider Pool', desc:'Her own green fire finally spreads like a queen\'s should. Widens her fire zone.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRadius', amount:5, min:0, max:25 }] },
    j3a:{ name:'Deeper Green', desc:'The pool burns down instead of just outward. Widens her fire zone.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRadius', amount:5, min:0, max:25 }] },
    j4a:{ name:'Regal Conflagration', desc:'No longer a courtesy flame. Widens her fire zone.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRadius', amount:5, min:0, max:25 }] },
    j5a:{ name:'Throne of Fire', desc:'She holds a whole quarter of the room in green. Widens her fire zone.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRadius', amount:5, min:0, max:25 }] },
    j6:{ name:'Long Reach of the Hive', desc:'She can plant the pool much further out than she used to. Extends her fire zone\'s reach.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRange', amount:6, min:0, max:30 }] },
    j8:{ name:'Cast From the Dais', desc:'A monarch does not close the distance herself. Extends her fire zone\'s reach.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRange', amount:6, min:0, max:30 }] },
    j2b:{ name:'Mired in Her Own Fire', desc:'The bigger the pool, the worse it is to stand in. Permanently roots her harder inside her own flame. Everything below is bought with that.', cursed:true,
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRootMult', amount:-0.10, min:-0.15, max:0.5 }] },
    j3b:{ name:'Hovering Monarch', desc:'She stops standing in it and starts hanging over it. Sharply reduces how badly her own fire slows her.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRootMult', amount:0.20, min:-0.15, max:0.5 }] },
    j4b:{ name:'Untethered Flame', desc:'The pool stops arguing with its owner. Further reduces how badly her own fire slows her.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRootMult', amount:0.15, min:-0.15, max:0.5 }] },
    j5b:{ name:'Pyre Walker', desc:'She can plant it further ahead and simply follow it in. Extends her fire zone\'s reach.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRange', amount:6, min:0, max:30 }] },
    j7:{ name:'Distant Ignition', desc:'She lights it where she is not, which is where she does her best work. Extends her fire zone\'s reach, at 3% off her own ranged damage.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRange', amount:6, min:0, max:30 },
               { type:'stat', classId:'changelingqueen', stat:'rangedDamage', amount:-0.03 }] },
    j9:{ name:'Empress in the Blaze', desc:'She has stopped treating her own fire as terrain. Almost entirely removes the slow from standing in her pool, at another 2% off her ranged damage.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'fireZoneRootMult', amount:0.15, min:-0.15, max:0.5 },
               { type:'stat', classId:'changelingqueen', stat:'rangedDamage', amount:-0.02 }] },

    k1:{ name:'Regal Presence', desc:'A hive-mother does not have to ask twice. Increases charm chance by 6%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'charmChance', amount:0.06 }] },
    k2a:{ name:'Adoring Swarm', desc:'Devotion is the only currency she has ever run on. Increases charm chance by 5%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'charmChance', amount:0.05 }] },
    k3a:{ name:'Devotion Harvest', desc:'Everything in the room is a potential subject. Increases charm chance by 5%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'charmChance', amount:0.05 }] },
    k4a:{ name:'Feed on Affection', desc:'The oldest changeling trade there is. Increases charm chance by 5%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'charmChance', amount:0.05 }] },
    k5a:{ name:'Enthralled Court', desc:'Half the room forgets what it came in here to do. Increases charm chance by 4%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'charmChance', amount:0.04 }] },
    k6:{ name:'Siphon the Willing', desc:'The ones who love her give it up freely. Increases lifesteal chance by 5%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'lifestealChance', amount:0.05 }] },
    k8:{ name:'Royal Tithe', desc:'Every subject pays in. She has stopped fighting with her own hooves entirely. Increases lifesteal chance by 5%, and reduces melee damage by 4%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'lifestealChance', amount:0.05 },
               { type:'stat', classId:'changelingqueen', stat:'meleeDamage', amount:-0.04 }] },
    k2b:{ name:'Isolated on the Throne', desc:'Nopony tells a queen when things are about to go badly. Permanently reduces luck by 5%. The cruel path opens only past it.', cursed:true,
      effects:[{ type:'stat', classId:'changelingqueen', stat:'luck', amount:-0.05 }] },
    k3b:{ name:'Cruel Precision', desc:'She has had centuries to learn exactly where it hurts. Increases critical hit chance by 6%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'critChance', amount:0.06 }] },
    k4b:{ name:"Executioner's Eye", desc:'A queen decides who is finished. Increases critical hit chance by 6%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'critChance', amount:0.06 }] },
    k5b:{ name:'Crown of Fangs', desc:'The regalia is not decorative. Increases critical hit chance by 5%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'critChance', amount:0.05 }] },
    k7:{ name:'Verdict of the Hive', desc:'Sentence, then swarm. Increases critical hit chance by 5%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'critChance', amount:0.05 }] },

    l1:{ name:'Weight of the Crown', desc:'She has not moved quickly since the day she took it. Permanently reduces movement speed by 5%. Required to press deeper.', cursed:true,
      effects:[{ type:'stat', classId:'changelingqueen', stat:'speed', amount:-0.05 }] },
    l2a:{ name:'Dread of the Hive', desc:'It is never just her they are looking at. Increases fear chance by 6%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'fearChance', amount:0.06 }] },
    l3a:{ name:'Chittering Chorus', desc:'The sound of a brood agreeing about you. Increases fear chance by 6%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'fearChance', amount:0.06 }] },
    l4a:{ name:'Shadow of the Swarm', desc:'The room darkens a shade wherever she has minions out. Increases fear chance by 5%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'fearChance', amount:0.05 }] },
    l5a:{ name:"Broodmother's Shriek", desc:'One call, and every drone in the room answers it. Increases fear chance by 5%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'fearChance', amount:0.05 }] },
    l6:{ name:'Marked for the Brood', desc:'She points; the hive remembers. Increases vulnerable chance by 6%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'vulnerableChance', amount:0.06 }] },
    l8:{ name:'Hive Focus', desc:'Four sets of eyes on one target finds every seam in it. Increases vulnerable chance by 6%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'vulnerableChance', amount:0.06 }] },
    l2b:{ name:'Tribute Line', desc:'The brood brings her things without being asked. Increases pickup magnet radius by 6%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'magnetRadius', amount:0.06 }] },
    l3b:{ name:'Cracked Regalia', desc:'The crown has taken more hits than she admits, and the shine is gone. Permanently reduces luck by 4%. The deepest tribute demands it.', cursed:true,
      effects:[{ type:'stat', classId:'changelingqueen', stat:'luck', amount:-0.04 }] },
    l4b:{ name:'Spoils of the Court', desc:'What the hive finds, the hive surrenders. Increases pickup magnet radius by 6%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'magnetRadius', amount:0.06 }] },
    l5b:{ name:'Drone Couriers', desc:'They ferry it in from across the room. Increases pickup magnet radius by 5%.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'magnetRadius', amount:0.05 }] },
    l7:{ name:'Everything Is Hers', desc:'Ownership, in a hive, is not a debate. Increases pickup magnet radius by 3%, and another 4% off a melee she never uses anyway.',
      effects:[{ type:'stat', classId:'changelingqueen', stat:'magnetRadius', amount:0.03 },
               { type:'stat', classId:'changelingqueen', stat:'meleeDamage', amount:-0.04 }] },

  }},

  // =========================================================================
  // FILLY — hooves too small for a proper kick, and a 25% innateCharmChance
  // that nopony can argue with. skilltree-characters-2.js already spent her
  // charm headroom to +0.19, so this pass spends the last 0.06 and otherwise
  // tells the story of a small pony getting bigger: borrowed shockwaveAttack
  // (Diamond Dog's rock-shattering swing, dispatched generically in
  // combat-1.js's playerMeleeAttack) plus rockCoinChance, a real meleeDamage
  // climb, and a damageTakenMult that never lets her forget she is little.
  // =========================================================================
  { classId:'filly', nodes:{
    i1:{ name:'Growing Pains', desc:'Legs that are still arguing about how long they should be. Permanently reduces movement speed by 5%. Nothing further opens without it.', cursed:true,
      effects:[{ type:'stat', classId:'filly', stat:'speed', amount:-0.05 }] },
    // Phase 11 — un-bleed pass: this whole sub-branch used to borrow
    // Diamond Dog's `shockwaveAttack` flag ("found it in a Diamond Dog's
    // satchel") plus three `rockCoinChance` nodes that only meant anything
    // once rocks could be shattered. Replaced with the actual story the
    // branch is telling anyway — a small pony hitting harder than she has
    // any right to, and getting luckier about what she finds.
    i2a:{ name:'Growing Confidence', desc:'She has stopped believing she is too small to matter. Increases melee damage by 5% — but throwing that much of herself into it makes every swing 5% slower.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeDamage', amount:0.05 },
               { type:'stat', classId:'filly', stat:'meleeCooldown', amount:0.05 }] },
    i3a:{ name:'Rock-Splitter Hooves', desc:'Turns out small hooves land harder than they look. Increases melee damage by a further 4%.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeDamage', amount:0.04 }] },
    i4a:{ name:'Coins in the Rubble', desc:'She checks every single thing on the ground, and something always turns up. Increases luck by 4%.',
      effects:[{ type:'stat', classId:'filly', stat:'luck', amount:0.04 }] },
    i5a:{ name:'Treasure in Every Stone', desc:'Optimism, it turns out, is a mining strategy. Increases luck by a further 4%.',
      effects:[{ type:'stat', classId:'filly', stat:'luck', amount:0.04 }] },
    i6:{ name:'Finders Keepers', desc:'The rule, as she understands it, is absolute. Increases pickup magnet radius by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'magnetRadius', amount:0.06 }] },
    i8:{ name:'Pocketful of Pebbles', desc:'And bottlecaps. And one very good stick. Increases pickup magnet radius by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'magnetRadius', amount:0.06 }] },
    i2b:{ name:'Knees Too Weak', desc:'She is going for the big kick anyway, and her knees know it. Permanently take 12% more damage. Everything below this branch is bought with that.', cursed:true,
      effects:[{ type:'uniqueField', classId:'filly', field:'damageTakenMult', amount:0.12, min:-0.3, max:0.5 }] },
    i3b:{ name:'Stubborn Streak', desc:'Being told she is too small has never once worked. Increases melee damage by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeDamage', amount:0.05 }] },
    i4b:{ name:'Full-Body Kick', desc:'If the hoof is small, put the whole filly behind it. Increases melee damage by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeDamage', amount:0.05 }] },
    i5b:{ name:"Little Mare's Hooves", desc:'Almost a proper kick now. Increases melee damage by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeDamage', amount:0.05 }] },
    i7:{ name:'Growth Spurt', desc:'Two inches overnight and no idea where they came from. Increases melee damage by 5% and toughens her up 8%.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeDamage', amount:0.05 },
               { type:'uniqueField', classId:'filly', field:'damageTakenMult', amount:-0.08, min:-0.3, max:0.5 }] },
    i9:{ name:'All Grown Up', desc:'The kick lands like a grown mare\'s at last, and the reckless little sprint is gone with it. Increases melee damage by 2%, reduces movement speed by 3%.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeDamage', amount:0.02 },
               { type:'stat', classId:'filly', stat:'speed', amount:-0.03 }] },

    j1:{ name:'Puppy-Eyes Fatigue', desc:'It works every time, which is exactly why it stops working. Permanently reduces luck by 5%. Required to press deeper.', cursed:true,
      effects:[{ type:'stat', classId:'filly', stat:'luck', amount:-0.05 }] },
    j2a:{ name:'Bat of the Lashes', desc:'Perfected in front of a mirror. Increases charm chance by 3%.',
      effects:[{ type:'stat', classId:'filly', stat:'charmChance', amount:0.03 }] },
    j3a:{ name:'Please?', desc:'Nopony has ever gotten past the second one. Increases charm chance by 3%.',
      effects:[{ type:'stat', classId:'filly', stat:'charmChance', amount:0.03 }] },
    j4a:{ name:'Betrayed Ranks', desc:'Anything she has already turned is easy pickings for everypony else. Increases vulnerable chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'vulnerableChance', amount:0.05 }] },
    j5a:{ name:'Turn on Your Friends', desc:'She does not even have to ask nicely anymore. Increases vulnerable chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'vulnerableChance', amount:0.05 }] },
    j6:{ name:'Playground Politics', desc:'She has run a schoolyard. This is easier. Increases fear chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'fearChance', amount:0.05 }] },
    j8:{ name:'Tattletale', desc:'Everypony finds out what you did. Increases fear chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'fearChance', amount:0.05 }] },
    j2b:{ name:'Sugar Rush', desc:'Nopony was supervising the candy bowl. Increases movement speed by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'speed', amount:0.06 }] },
    j3b:{ name:'Sugar Crash', desc:'And then, inevitably, the other side of it. Every swing is permanently 5% slower. The rest of this branch demands it.', cursed:true,
      effects:[{ type:'stat', classId:'filly', stat:'meleeCooldown', amount:0.05 }] },
    j4b:{ name:'Skipping Gait', desc:'She does not run anywhere, she skips, and it is somehow faster. Increases movement speed by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'speed', amount:0.06 }] },
    j5b:{ name:"Can't Catch Me", desc:'Small target, terrible attention span, excellent instincts. Increases dodge chance by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'dodgeChance', amount:0.06 }] },
    j7:{ name:'Hide and Seek', desc:'She has been undefeated since she was three. Increases dodge chance by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'dodgeChance', amount:0.06 }] },
    j9:{ name:"Tag, You're It", desc:'She decides who is chasing whom. Increases dodge chance by 5%, though playing that hard costs another 3% luck.',
      effects:[{ type:'stat', classId:'filly', stat:'dodgeChance', amount:0.05 },
               { type:'stat', classId:'filly', stat:'luck', amount:-0.03 }] },

    k1:{ name:'Dirt in the Eyes', desc:'Not sporting. Very effective. Increases stun chance by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'stunChance', amount:0.06 }] },
    k2a:{ name:'Hoof to the Shin', desc:'The exact height advantage she has. Increases stun chance by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'stunChance', amount:0.06 }] },
    k3a:{ name:'Headbutt', desc:'It hurts her too. She does it anyway. Increases stun chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'stunChance', amount:0.05 }] },
    k4a:{ name:'Ringing Ears', desc:'Everything goes far away for a second. Increases stun chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'stunChance', amount:0.05 }] },
    k5a:{ name:'Knocked Silly', desc:'They sit down and think about their choices. Increases stun chance by 3%.',
      effects:[{ type:'stat', classId:'filly', stat:'stunChance', amount:0.03 }] },
    k6:{ name:'Lucky Little Kick', desc:'Every so often the small hoof finds exactly the right spot. Increases critical hit chance by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'critChance', amount:0.06 }] },
    k8:{ name:'Right in the Sore Spot', desc:'Children are unerring about this. Increases critical hit chance by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'critChance', amount:0.06 }] },
    k2b:{ name:'Scraped Knees', desc:'She keeps getting up, and she keeps getting scraped up doing it. Permanently take 10% more damage. The mean tricks live past here.', cursed:true,
      effects:[{ type:'uniqueField', classId:'filly', field:'damageTakenMult', amount:0.10, min:-0.3, max:0.5 }] },
    k3b:{ name:'Nettle Sting', desc:'She knows which plants to roll in first. Increases venom chance by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'venomChance', amount:0.06 }] },
    k4b:{ name:'Pocket Full of Burrs', desc:'For emergencies, and for fun. Increases venom chance by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'venomChance', amount:0.06 }] },
    k5b:{ name:'Itching Powder', desc:'She will not say where she got it. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'venomChance', amount:0.05 }] },
    k7:{ name:'Bad Sweets', desc:'She offers them very sweetly. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'venomChance', amount:0.05 }] },

    l1:{ name:'Winter Coat Too Thin', desc:'She insisted she did not need the scarf. Permanently take 10% more damage. Required to press on.', cursed:true,
      effects:[{ type:'uniqueField', classId:'filly', field:'damageTakenMult', amount:0.10, min:-0.3, max:0.5 }] },
    l2a:{ name:'Snowball Ambush', desc:'She had it packed before anypony noticed she had stopped talking. Increases freeze chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'freezeChance', amount:0.05 }] },
    l3a:{ name:'Ice on the Path', desc:'She knows exactly which patch, and she is not telling. Increases freeze chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'freezeChance', amount:0.05 }] },
    l4a:{ name:'Second Wind', desc:'Fillies do not run out, they just pause. Increases on-kill heal chance by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'onKillHealChance', amount:0.06 }] },
    l5a:{ name:'Nap After Recess', desc:'Twenty minutes and she is brand new. Increases on-kill heal chance by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'onKillHealChance', amount:0.06 }] },
    l6:{ name:'Bounce Right Back', desc:'Nothing sticks to her for very long. Increases on-kill heal chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'onKillHealChance', amount:0.05 }] },
    l8:{ name:'Youth Is Wasted on the Young', desc:'Not on this one. Increases on-kill heal chance by 5%, though coasting on it takes 3% off her kick.',
      effects:[{ type:'stat', classId:'filly', stat:'onKillHealChance', amount:0.05 },
               { type:'stat', classId:'filly', stat:'meleeDamage', amount:-0.03 }] },
    l2b:{ name:'Overexcited', desc:'She is not listening, she is already halfway across the room. Permanently reduces luck by 4%. The shiny path opens only past it.', cursed:true,
      effects:[{ type:'stat', classId:'filly', stat:'luck', amount:-0.04 }] },
    l3b:{ name:'Fast Friends', desc:'She has already been given three things by strangers today. Increases pickup magnet radius by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'magnetRadius', amount:0.06 }] },
    l4b:{ name:'Shiny Things', desc:'An unerring instinct for the good pile. Increases pickup magnet radius by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'magnetRadius', amount:0.06 }] },
    l5b:{ name:'Cutie Mark Ambition', desc:'Somewhere in here is the thing she is meant to be. Increases critical hit chance by 6%.',
      effects:[{ type:'stat', classId:'filly', stat:'critChance', amount:0.06 }] },
    l7:{ name:'Best Friends Forever', desc:'Nothing in this dungeon is more dangerous than a filly with backup. Increases critical hit chance by 6% and toughens her up 10%.',
      effects:[{ type:'stat', classId:'filly', stat:'critChance', amount:0.06 },
               { type:'uniqueField', classId:'filly', field:'damageTakenMult', amount:-0.10, min:-0.3, max:0.5 }] },
  }},

  // =========================================================================
  // ENGINEER PONY — the softest ranged attack in the game (dps 2.0) because
  // her real damage is canBuildTurrets. skilltree-characters-2.js already
  // pushed turretDamageMult to +0.34 of its 0.4 ceiling and maxTurrets to its
  // full +2, so this pass spends the last of the turret headroom and then
  // builds outward: emplacement doctrine (range/dodge/armor), a railgun line
  // that ends in a genuine unlimitedRange uniqueFlag bought with her own
  // damage, a chemistry line, and a scrap-economy line.
  // =========================================================================
  { classId:'engineerpony', nodes:{
    i1:{ name:'Hooves Full of Wrenches', desc:'You cannot hold a horn steady and a socket set at the same time. Permanently reduces ranged damage by 5%. Nothing on this path opens without it.', cursed:true,
      effects:[{ type:'stat', classId:'engineerpony', stat:'rangedDamage', amount:-0.05 }] },
    i2a:{ name:'Hardened Mounts', desc:'No more wobble on the recoil. Her turrets hit harder.',
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'turretDamageMult', amount:0.03, min:0, max:0.4 }] },
    i3a:{ name:'Better Barrels', desc:'Machined instead of scavenged, for once. Her turrets hit harder.',
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'turretDamageMult', amount:0.03, min:0, max:0.4 }] },
    i4a:{ name:'Ammo Hoist', desc:'Feed line long enough to cover the whole approach. Increases range by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'rangeTiles', amount:0.06 }] },
    i5a:{ name:'Long Emplacement', desc:'She picks the spot that covers the most ground and settles in. Increases range by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'rangeTiles', amount:0.06 }] },
    i6:{ name:'Overwatch Grid', desc:'Every turret sited so their arcs overlap. Increases range by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'rangeTiles', amount:0.05 }] },
    i8:{ name:'Fields of Fire', desc:'There is no longer a safe angle into the room. Increases range by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'rangeTiles', amount:0.05 }] },
    i2b:{ name:'All Power to the Guns', desc:'Every scrap of plate went into the emplacements instead of onto her. Permanently take 12% more damage. Everything below is bought with that.', cursed:true,
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'damageTakenMult', amount:0.12, min:-0.3, max:0.5 }] },
    i3b:{ name:'Behind the Sandbags', desc:'She built the cover before she built the gun. Increases dodge chance by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'dodgeChance', amount:0.06 }] },
    i4b:{ name:'Cover Fire', desc:'Something else is shooting, so she does not have to stand still. Increases dodge chance by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'dodgeChance', amount:0.06 }] },
    i5b:{ name:'Blast Shield', desc:'Salvaged plate, finally bolted to the right pony. Take 10% less damage.',
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'damageTakenMult', amount:-0.10, min:-0.3, max:0.5 }] },
    i7:{ name:'Riveted Barding', desc:'Ugly, heavy, and it works. Take 8% less damage.',
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'damageTakenMult', amount:-0.08, min:-0.3, max:0.5 }] },
    i9:{ name:'Workshop Discipline', desc:'She never steps anywhere she has not already planned to step. Increases dodge chance by 5%, at 4% off her movement speed.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'dodgeChance', amount:0.05 },
               { type:'stat', classId:'engineerpony', stat:'speed', amount:-0.04 }] },

    j1:{ name:'Capacitor Drain', desc:'Charging a rail takes everything the bandolier has. Every shot is permanently 6% slower to come around. The railgun path opens only past it.', cursed:true,
      effects:[{ type:'stat', classId:'engineerpony', stat:'fireCooldown', amount:0.06 }] },
    j2a:{ name:'Rifled Coil', desc:'A spiral cut into the launch coil, purely by feel. Increases bolt speed by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'boltSpeed', amount:0.06 }] },
    j3a:{ name:'Magnetic Rails', desc:'Two rails, one very unhappy slug. Increases bolt speed by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'boltSpeed', amount:0.06 }] },
    j4a:{ name:'Muzzle Tuning', desc:'Weeks of listening to it and adjusting by a hair. Increases bolt speed by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'boltSpeed', amount:0.05 }] },
    j5a:{ name:'Coilgun Prototype', desc:'It is held together with tape and it is terrifying. Increases bolt speed by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'boltSpeed', amount:0.05 }] },
    j6:{ name:'Beyond the Wall', desc:'Her shots stop falling short — they simply keep going until something stops them. Her range limit is gone entirely, and the power draw takes 6% off her ranged damage forever.',
      effects:[{ type:'uniqueFlag', classId:'engineerpony', field:'unlimitedRange', value:true },
               { type:'stat', classId:'engineerpony', stat:'rangedDamage', amount:-0.06 }] },
    j8:{ name:'Spotter Scope', desc:'Ground glass, a candle, and a great deal of patience. Increases critical hit chance by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'critChance', amount:0.06 }] },
    j2b:{ name:'Overheated Chamber', desc:'She keeps firing through the smell of hot metal. Permanently reduces ranged damage by 4%. The weak-point work lives past here.', cursed:true,
      effects:[{ type:'stat', classId:'engineerpony', stat:'rangedDamage', amount:-0.04 }] },
    j3b:{ name:'Armor-Piercing Slug', desc:'Denser core, uglier exit. Increases vulnerable chance by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'vulnerableChance', amount:0.06 }] },
    j4b:{ name:'Weak-Point Ledger', desc:'She keeps notes on everything she has ever shot. Increases vulnerable chance by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'vulnerableChance', amount:0.06 }] },
    j5b:{ name:'Stress-Fracture Rounds', desc:'Designed to leave a crack for the turrets to widen. Increases vulnerable chance by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'vulnerableChance', amount:0.05 }] },
    j7:{ name:'Structural Analysis', desc:'Everything is a load-bearing member of something. Increases vulnerable chance by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'vulnerableChance', amount:0.05 }] },
    j9:{ name:'Called Shot', desc:'She says where it is going before she fires. Increases critical hit chance by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'critChance', amount:0.06 }] },

    k1:{ name:'Acid Reservoir', desc:'A second tank on the bandolier, clearly labelled DO NOT. Increases venom chance by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'venomChance', amount:0.06 }] },
    k2a:{ name:'Corrosive Payload', desc:'Every slug carries a little of it now. Increases venom chance by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'venomChance', amount:0.06 }] },
    k3a:{ name:'Etching Fluid', desc:'Meant for circuit boards. Works on most things. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'venomChance', amount:0.05 }] },
    k4a:{ name:'Solvent Rounds', desc:'It keeps working long after the shot lands. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'venomChance', amount:0.05 }] },
    k5a:{ name:'Rust Catalyst', desc:'She can make anything metal regret existing. Increases venom chance by 3%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'venomChance', amount:0.03 }] },
    k6:{ name:'Field Transfusion Rig', desc:'Hoses, a pump, and no medical training whatsoever. Increases lifesteal chance by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'lifestealChance', amount:0.05 }] },
    k8:{ name:'Scavenger Coupling', desc:'Whatever is left over goes straight back into her. She has entirely stopped swinging at anything. Increases lifesteal chance by 5%, reduces melee damage by 4%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'lifestealChance', amount:0.05 },
               { type:'stat', classId:'engineerpony', stat:'meleeDamage', amount:-0.04 }] },
    k2b:{ name:'Fumes in the Workshop', desc:'She has stopped noticing the smell, which is the worrying part. Permanently take 10% more damage. The salvage line opens only past it.', cursed:true,
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'damageTakenMult', amount:0.10, min:-0.3, max:0.5 }] },
    k3b:{ name:'Salvage Reclaimer', desc:'Nothing that falls over in front of her goes to waste. Increases on-kill heal chance by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'onKillHealChance', amount:0.06 }] },
    k4b:{ name:'Spare Parts Bin', desc:'Sorted, labelled, and mostly still warm. Increases on-kill heal chance by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'onKillHealChance', amount:0.06 }] },
    k5b:{ name:'Repair Protocol', desc:'She patches herself the way she patches a turret. Increases on-kill heal chance by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'onKillHealChance', amount:0.05 }] },
    k7:{ name:'Self-Maintenance Loop', desc:'Between rooms, she is her own workshop. Increases on-kill heal chance by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'onKillHealChance', amount:0.05 }] },

    l1:{ name:'Heavy Toolbelt', desc:'She refuses to leave a single spanner behind. Permanently reduces movement speed by 6%. Required to press deeper.', cursed:true,
      effects:[{ type:'stat', classId:'engineerpony', stat:'speed', amount:-0.06 }] },
    l2a:{ name:'Scrap Magnet', desc:'A coil, a battery, and no off switch. Increases pickup magnet radius by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'magnetRadius', amount:0.06 }] },
    l3a:{ name:'Induction Coil', desc:'Loose metal within three lengths simply decides to come home. Increases pickup magnet radius by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'magnetRadius', amount:0.06 }] },
    l4a:{ name:'Component Sorter', desc:'It grabs first and sorts later. Increases pickup magnet radius by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'magnetRadius', amount:0.05 }] },
    l5a:{ name:'Salvage Sweep', desc:'One pass and the room is picked clean. Increases pickup magnet radius by 3%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'magnetRadius', amount:0.03 }] },
    l6:{ name:'Blueprint Library', desc:'She has seen a room like this one on paper. Increases luck by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'luck', amount:0.06 }] },
    l8:{ name:'Prototype Luck', desc:'Half of engineering is the thing working for reasons you did not plan. Increases luck by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'luck', amount:0.06 }] },
    l2b:{ name:'Lightened Frame', desc:'Everything non-essential drilled out of everything. Increases movement speed by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'speed', amount:0.06 }] },
    l3b:{ name:'Stripped Gears', desc:'She robbed the turret gearboxes to build her own legs. Her turrets permanently hit weaker. The rest of this branch demands it.', cursed:true,
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'turretDamageMult', amount:-0.05, min:0, max:0.4 }] },
    l4b:{ name:'Powered Hooves', desc:'Servos where the horseshoes used to be. Increases movement speed by 6%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'speed', amount:0.06 }] },
    l5b:{ name:'Servo Assist', desc:'She has not lifted anything under her own power in weeks. Increases movement speed by 5%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'speed', amount:0.05 }] },
    l7:{ name:'Field Efficiency', desc:'She scavenges the emplacements for whatever the run needs next. Increases luck by 5%, at another notch off her turrets\' damage.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'luck', amount:0.05 },
               { type:'uniqueField', classId:'engineerpony', field:'turretDamageMult', amount:-0.03, min:0, max:0.4 }] },
  }},
];

const SKILL_TREE_CHARACTER_NODES_4E = [];
(function buildCharacterSkillNodes4E(){
  for (const cfg of SKILL_TREE_CHARACTER_CONFIG_4E) {
    const classId = cfg.classId;
    for (const key of SKILL_TREE_ORDER_4E) {
      const content = cfg.nodes[key];
      if (!content) continue; // defensive: a key in the shared order this character genuinely omits
      const parentKey = SKILL_TREE_TOPOLOGY_4E[key];
      const node = {
        id: 'char_' + classId + '_' + key,
        parent: parentKey === 'hub' ? ('char_hub_' + classId) : ('char_' + classId + '_' + parentKey),
        cost: 1,
        name: content.name,
        desc: content.desc,
        effects: content.effects,
      };
      if (content.cursed) node.cursed = true;
      SKILL_TREE_CHARACTER_NODES_4E.push(node);
    }
  }
})();

for (const n of SKILL_TREE_CHARACTER_NODES_4E) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

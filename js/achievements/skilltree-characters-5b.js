'use strict';
// achievements/skilltree-characters-5b.js — Phase 11 item 3 REDESIGN:
// 50 more nodes/character, 5 DEEP branches (m/n/o/p/q, 10 nodes each) instead
// of 10 shallow ones — each branch opens with a CURSED gate (a small debuff
// on an unrelated stat) before splitting into two reward subpaths + a spine
// + a capstone, so every branch is a real tradeoff, not just more numbers.
// Deliberately light on status-effect chance stats (none used at all here —
// pure core stats: melee/ranged damage, speed, critChance, luck, rangeTiles,
// boltSpeed, magnetRadius) per direct steer. Branch p ("Technique") is the
// one genuinely new per-character MECHANIC in this batch: a real build
// choice between Braced (tankier, damageTakenMult down) and Reckless
// (damageTakenMult up for a bigger damage payoff) — damageTakenMult is
// safely seeded as a number for every class (entities.js: `this.
// damageTakenMult = def.damageTakenMult || 1`), so this works uniformly
// without a per-class engine check. Amounts kept modest (2%/1.5%/2.5% per
// node, gate debuffs 3%) and spread across varied stats per branch so no
// single (classId, stat) pair risks the 0.25 SKILL_TREE_STAT_CAP even
// stacked on this tree's existing totals. Group 2 of 5: hypogriff, seapony, ponybot, griffin, kirin.
const SKILL_TREE_CHARACTER_NODES_5B = [];
(function(){
  function build(classId, defs){
    for (const d of defs) {
      const node = {
        id: 'char_' + classId + '_' + d.k,
        parent: d.p ? ('char_' + classId + '_' + d.p) : ('char_hub_' + classId),
        cost: d.cost || 1,
        name: d.n,
        desc: d.d,
      };
      const fx = d.e || [];
      if (fx.length === 1) node.effect = fx[0];
      else if (fx.length > 1) node.effects = fx;
      else node.effect = null;
      if (d.c) node.cursed = true;
      SKILL_TREE_CHARACTER_NODES_5B.push(node);
    }
  }

  // ---------------- hypogriff ----------------
  {
    const c = 'hypogriff';
    build(c, [
      { k:'m1', p:null, n:'Hardened Talon', d:'The talon stoops differently now, and something else pays for it. Permanently reduces luck by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"hypogriff","stat":"luck","amount":0}] },
      { k:'m2a', p:'m1', n:'Settled Talon', d:'A habit worn smooth. Increases melee damage by 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00079}] },
      { k:'m3a', p:'m2a', n:'Deepened Talon', d:'Second nature by now. Increases melee damage by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00079}] },
      { k:'m4a', p:'m3a', n:'Mastered Talon', d:'As far down this side as it goes. Increases melee damage by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00079}] },
      { k:'m2b', p:'m1', n:'Restless Talon', d:'A different angle on the same habit. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"critChance","amount":0}] },
      { k:'m3b', p:'m2b', n:'Practiced Talon', d:'Nothing left to learn on this side of it. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"critChance","amount":0}] },
      { k:'m4b', p:'m3b', n:'Honed Talon', d:'The far end of this side. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"critChance","amount":0}] },
      { k:'m5', p:'m1', n:'Direct Talon', d:'Straight down the middle, no detour. Increases melee damage by 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00063}] },
      { k:'m6', p:'m5', n:'Unwavering Talon', d:'Held steady long enough to stop being effort. Increases melee damage by a further 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00063}] },
      { k:'m7', p:'m4a', n:'Culmination: Talon', d:'Everything this branch was building toward. Increases melee damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00095}] },
      { k:'n1', p:null, n:'Hardened Talon', d:'The talon stoops differently now, and something else pays for it. Permanently reduces movement speed by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"hypogriff","stat":"speed","amount":-0.012}] },
      { k:'n2a', p:'n1', n:'Settled Talon', d:'A habit worn smooth. Increases movement speed by 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"speed","amount":0.005}] },
      { k:'n3a', p:'n2a', n:'Deepened Talon', d:'Second nature by now. Increases movement speed by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"speed","amount":0.005}] },
      { k:'n4a', p:'n3a', n:'Mastered Talon', d:'As far down this side as it goes. Increases movement speed by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"speed","amount":0.005}] },
      { k:'n2b', p:'n1', n:'Restless Talon', d:'A different angle on the same habit. Increases range by 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"rangeTiles","amount":0.005}] },
      { k:'n3b', p:'n2b', n:'Practiced Talon', d:'Nothing left to learn on this side of it. Increases range by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"rangeTiles","amount":0.005}] },
      { k:'n4b', p:'n3b', n:'Honed Talon', d:'The far end of this side. Increases range by a further 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"rangeTiles","amount":0.004}] },
      { k:'n5', p:'n1', n:'Direct Talon', d:'Straight down the middle, no detour. Increases movement speed by 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"speed","amount":0.004}] },
      { k:'n6', p:'n5', n:'Unwavering Talon', d:'Held steady long enough to stop being effort. Increases movement speed by a further 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"speed","amount":0.004}] },
      { k:'n7', p:'n4a', n:'Culmination: Talon', d:'Everything this branch was building toward. Increases movement speed by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"hypogriff","stat":"speed","amount":0.006}] },
      { k:'o1', p:null, n:'Hardened Talon', d:'The talon stoops differently now, and something else pays for it. Permanently reduces melee damage by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":-0.00189}] },
      { k:'o2a', p:'o1', n:'Settled Talon', d:'A habit worn smooth. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"critChance","amount":0}] },
      { k:'o3a', p:'o2a', n:'Deepened Talon', d:'Second nature by now. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"critChance","amount":0}] },
      { k:'o4a', p:'o3a', n:'Mastered Talon', d:'As far down this side as it goes. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"critChance","amount":0}] },
      { k:'o2b', p:'o1', n:'Restless Talon', d:'A different angle on the same habit. Increases pickup magnet radius by 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"magnetRadius","amount":0.005}] },
      { k:'o3b', p:'o2b', n:'Practiced Talon', d:'Nothing left to learn on this side of it. Increases pickup magnet radius by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"magnetRadius","amount":0.005}] },
      { k:'o4b', p:'o3b', n:'Honed Talon', d:'The far end of this side. Increases pickup magnet radius by a further 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"magnetRadius","amount":0.004}] },
      { k:'o5', p:'o1', n:'Direct Talon', d:'Straight down the middle, no detour. Increases critical hit chance by 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"critChance","amount":0}] },
      { k:'o6', p:'o5', n:'Unwavering Talon', d:'Held steady long enough to stop being effort. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"critChance","amount":0}] },
      { k:'o7', p:'o4a', n:'Culmination: Talon', d:'Everything this branch was building toward. Increases critical hit chance by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"hypogriff","stat":"critChance","amount":0}] },
      { k:'p1', p:null, n:'Read the Room', d:'Committing to a technique means giving something up first. Permanently reduces melee damage by 3%. Both disciplines below open from here.', c:true, e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":-0.00237}] },
      { k:'p2a', p:'p1', n:'Braced Stance', d:'Weight low, guard up. Reduces damage taken by 4%, but reduces melee damage by a further 2%.', e:[{"type":"uniqueField","classId":"hypogriff","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6},{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":-0.00316}] },
      { k:'p3a', p:'p2a', n:'Iron Discipline', d:'The stance holds under real pressure now. Reduces damage taken by a further 4%.', e:[{"type":"uniqueField","classId":"hypogriff","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p4a', p:'p3a', n:'Unbroken Line', d:'Nothing gets through clean any more. Reduces damage taken by a further 5%.', cost:2, e:[{"type":"uniqueField","classId":"hypogriff","field":"damageTakenMult","amount":-0.025,"min":-0.5,"max":0.6}] },
      { k:'p2b', p:'p1', n:'Reckless Opening', d:'Guard down, everything forward. Increases melee damage by 4%, but increases damage taken by 4%.', e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00158},{"type":"uniqueField","classId":"hypogriff","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p3b', p:'p2b', n:'Committed Fully', d:'There is no half-measure left to take. Increases melee damage by a further 4%, and damage taken by a further 4%.', e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00158},{"type":"uniqueField","classId":"hypogriff","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p4b', p:'p3b', n:'All or Nothing', d:'The technique that ends the fight or ends the run. Increases melee damage by a final 5%, and damage taken by a final 4%.', cost:2, e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00189},{"type":"uniqueField","classId":"hypogriff","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p5', p:'p4a', n:'Settled Guard', d:'The braced path stops costing effort to hold. Increases melee damage by 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00063}] },
      { k:'p6', p:'p4b', n:'Second Wind', d:'The reckless path finds a rhythm underneath the risk. Reduces damage taken by 2%.', e:[{"type":"uniqueField","classId":"hypogriff","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p7', p:'p5', n:'Culmination: Technique', d:'Both disciplines, fully learned. Increases melee damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00095}] },
      { k:'q1', p:null, n:'Hardened Talon', d:'The talon stoops differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"hypogriff","stat":"critChance","amount":0}] },
      { k:'q2a', p:'q1', n:'Settled Talon', d:'A habit worn smooth. Increases luck by 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"luck","amount":0}] },
      { k:'q3a', p:'q2a', n:'Deepened Talon', d:'Second nature by now. Increases luck by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"luck","amount":0}] },
      { k:'q4a', p:'q3a', n:'Mastered Talon', d:'As far down this side as it goes. Increases luck by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"luck","amount":0}] },
      { k:'q2b', p:'q1', n:'Restless Talon', d:'A different angle on the same habit. Increases melee damage by 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00079}] },
      { k:'q3b', p:'q2b', n:'Practiced Talon', d:'Nothing left to learn on this side of it. Increases melee damage by a further 2%.', e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00079}] },
      { k:'q4b', p:'q3b', n:'Honed Talon', d:'The far end of this side. Increases melee damage by a further 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"meleeDamage","amount":0.00063}] },
      { k:'q5', p:'q1', n:'Direct Talon', d:'Straight down the middle, no detour. Increases luck by 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"luck","amount":0}] },
      { k:'q6', p:'q5', n:'Unwavering Talon', d:'Held steady long enough to stop being effort. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"hypogriff","stat":"luck","amount":0}] },
      { k:'q7', p:'q4a', n:'Culmination: Talon', d:'Everything this branch was building toward. Increases luck by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"hypogriff","stat":"luck","amount":0}] },
    ]);
  }

  // ---------------- seapony ----------------
  {
    const c = 'seapony';
    build(c, [
      { k:'m1', p:null, n:'Hardened Fin', d:'The fin surges differently now, and something else pays for it. Permanently reduces luck by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"seapony","stat":"luck","amount":-0.012}] },
      { k:'m2a', p:'m1', n:'Settled Fin', d:'A habit worn smooth. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.005}] },
      { k:'m3a', p:'m2a', n:'Deepened Fin', d:'Second nature by now. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.005}] },
      { k:'m4a', p:'m3a', n:'Mastered Fin', d:'As far down this side as it goes. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.005}] },
      { k:'m2b', p:'m1', n:'Restless Fin', d:'A different angle on the same habit. Increases range by 2%.', e:[{"type":"stat","classId":"seapony","stat":"rangeTiles","amount":0.005}] },
      { k:'m3b', p:'m2b', n:'Practiced Fin', d:'Nothing left to learn on this side of it. Increases range by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"rangeTiles","amount":0.005}] },
      { k:'m4b', p:'m3b', n:'Honed Fin', d:'The far end of this side. Increases range by a further 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"rangeTiles","amount":0.004}] },
      { k:'m5', p:'m1', n:'Direct Fin', d:'Straight down the middle, no detour. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.004}] },
      { k:'m6', p:'m5', n:'Unwavering Fin', d:'Held steady long enough to stop being effort. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.004}] },
      { k:'m7', p:'m4a', n:'Culmination: Fin', d:'Everything this branch was building toward. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.006}] },
      { k:'n1', p:null, n:'Hardened Fin', d:'The fin surges differently now, and something else pays for it. Permanently reduces movement speed by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"seapony","stat":"speed","amount":-0.012}] },
      { k:'n2a', p:'n1', n:'Settled Fin', d:'A habit worn smooth. Increases bolt speed by 2%.', e:[{"type":"stat","classId":"seapony","stat":"boltSpeed","amount":0.005}] },
      { k:'n3a', p:'n2a', n:'Deepened Fin', d:'Second nature by now. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"boltSpeed","amount":0.005}] },
      { k:'n4a', p:'n3a', n:'Mastered Fin', d:'As far down this side as it goes. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"boltSpeed","amount":0.005}] },
      { k:'n2b', p:'n1', n:'Restless Fin', d:'A different angle on the same habit. Increases range by 2%.', e:[{"type":"stat","classId":"seapony","stat":"rangeTiles","amount":0.005}] },
      { k:'n3b', p:'n2b', n:'Practiced Fin', d:'Nothing left to learn on this side of it. Increases range by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"rangeTiles","amount":0.005}] },
      { k:'n4b', p:'n3b', n:'Honed Fin', d:'The far end of this side. Increases range by a further 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"rangeTiles","amount":0.004}] },
      { k:'n5', p:'n1', n:'Direct Fin', d:'Straight down the middle, no detour. Increases bolt speed by 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"boltSpeed","amount":0.004}] },
      { k:'n6', p:'n5', n:'Unwavering Fin', d:'Held steady long enough to stop being effort. Increases bolt speed by a further 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"boltSpeed","amount":0.004}] },
      { k:'n7', p:'n4a', n:'Culmination: Fin', d:'Everything this branch was building toward. Increases bolt speed by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"seapony","stat":"boltSpeed","amount":0.006}] },
      { k:'o1', p:null, n:'Hardened Fin', d:'The fin surges differently now, and something else pays for it. Permanently reduces ranged damage by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":-0.012}] },
      { k:'o2a', p:'o1', n:'Settled Fin', d:'A habit worn smooth. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"seapony","stat":"critChance","amount":0}] },
      { k:'o3a', p:'o2a', n:'Deepened Fin', d:'Second nature by now. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"critChance","amount":0}] },
      { k:'o4a', p:'o3a', n:'Mastered Fin', d:'As far down this side as it goes. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"critChance","amount":0}] },
      { k:'o2b', p:'o1', n:'Restless Fin', d:'A different angle on the same habit. Increases pickup magnet radius by 2%.', e:[{"type":"stat","classId":"seapony","stat":"magnetRadius","amount":0.005}] },
      { k:'o3b', p:'o2b', n:'Practiced Fin', d:'Nothing left to learn on this side of it. Increases pickup magnet radius by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"magnetRadius","amount":0.005}] },
      { k:'o4b', p:'o3b', n:'Honed Fin', d:'The far end of this side. Increases pickup magnet radius by a further 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"magnetRadius","amount":0.004}] },
      { k:'o5', p:'o1', n:'Direct Fin', d:'Straight down the middle, no detour. Increases critical hit chance by 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"critChance","amount":0}] },
      { k:'o6', p:'o5', n:'Unwavering Fin', d:'Held steady long enough to stop being effort. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"critChance","amount":0}] },
      { k:'o7', p:'o4a', n:'Culmination: Fin', d:'Everything this branch was building toward. Increases critical hit chance by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"seapony","stat":"critChance","amount":0}] },
      { k:'p1', p:null, n:'Read the Room', d:'Committing to a technique means giving something up first. Permanently reduces ranged damage by 3%. Both disciplines below open from here.', c:true, e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":-0.015}] },
      { k:'p2a', p:'p1', n:'Braced Stance', d:'Weight low, guard up. Reduces damage taken by 4%, but reduces ranged damage by a further 2%.', e:[{"type":"uniqueField","classId":"seapony","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6},{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":-0.02}] },
      { k:'p3a', p:'p2a', n:'Iron Discipline', d:'The stance holds under real pressure now. Reduces damage taken by a further 4%.', e:[{"type":"uniqueField","classId":"seapony","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p4a', p:'p3a', n:'Unbroken Line', d:'Nothing gets through clean any more. Reduces damage taken by a further 5%.', cost:2, e:[{"type":"uniqueField","classId":"seapony","field":"damageTakenMult","amount":-0.025,"min":-0.5,"max":0.6}] },
      { k:'p2b', p:'p1', n:'Reckless Opening', d:'Guard down, everything forward. Increases ranged damage by 4%, but increases damage taken by 4%.', e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"seapony","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p3b', p:'p2b', n:'Committed Fully', d:'There is no half-measure left to take. Increases ranged damage by a further 4%, and damage taken by a further 4%.', e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"seapony","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p4b', p:'p3b', n:'All or Nothing', d:'The technique that ends the fight or ends the run. Increases ranged damage by a final 5%, and damage taken by a final 4%.', cost:2, e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.012},{"type":"uniqueField","classId":"seapony","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p5', p:'p4a', n:'Settled Guard', d:'The braced path stops costing effort to hold. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.004}] },
      { k:'p6', p:'p4b', n:'Second Wind', d:'The reckless path finds a rhythm underneath the risk. Reduces damage taken by 2%.', e:[{"type":"uniqueField","classId":"seapony","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p7', p:'p5', n:'Culmination: Technique', d:'Both disciplines, fully learned. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.006}] },
      { k:'q1', p:null, n:'Hardened Fin', d:'The fin surges differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"seapony","stat":"critChance","amount":0}] },
      { k:'q2a', p:'q1', n:'Settled Fin', d:'A habit worn smooth. Increases luck by 2%.', e:[{"type":"stat","classId":"seapony","stat":"luck","amount":0.005}] },
      { k:'q3a', p:'q2a', n:'Deepened Fin', d:'Second nature by now. Increases luck by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"luck","amount":0.005}] },
      { k:'q4a', p:'q3a', n:'Mastered Fin', d:'As far down this side as it goes. Increases luck by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"luck","amount":0.005}] },
      { k:'q2b', p:'q1', n:'Restless Fin', d:'A different angle on the same habit. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.005}] },
      { k:'q3b', p:'q2b', n:'Practiced Fin', d:'Nothing left to learn on this side of it. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.005}] },
      { k:'q4b', p:'q3b', n:'Honed Fin', d:'The far end of this side. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"rangedDamage","amount":0.004}] },
      { k:'q5', p:'q1', n:'Direct Fin', d:'Straight down the middle, no detour. Increases luck by 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"luck","amount":0.004}] },
      { k:'q6', p:'q5', n:'Unwavering Fin', d:'Held steady long enough to stop being effort. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"seapony","stat":"luck","amount":0.004}] },
      { k:'q7', p:'q4a', n:'Culmination: Fin', d:'Everything this branch was building toward. Increases luck by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"seapony","stat":"luck","amount":0.006}] },
    ]);
  }

  // ---------------- ponybot ----------------
  {
    const c = 'ponybot';
    build(c, [
      { k:'m1', p:null, n:'Hardened Chassis', d:'The chassis recalibrates differently now, and something else pays for it. Permanently reduces luck by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"ponybot","stat":"luck","amount":-0.012}] },
      { k:'m2a', p:'m1', n:'Settled Chassis', d:'A habit worn smooth. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00079}] },
      { k:'m3a', p:'m2a', n:'Deepened Chassis', d:'Second nature by now. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00079}] },
      { k:'m4a', p:'m3a', n:'Mastered Chassis', d:'As far down this side as it goes. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00079}] },
      { k:'m2b', p:'m1', n:'Restless Chassis', d:'A different angle on the same habit. Increases bolt speed by 2%.', e:[{"type":"stat","classId":"ponybot","stat":"boltSpeed","amount":0.005}] },
      { k:'m3b', p:'m2b', n:'Practiced Chassis', d:'Nothing left to learn on this side of it. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"boltSpeed","amount":0.005}] },
      { k:'m4b', p:'m3b', n:'Honed Chassis', d:'The far end of this side. Increases bolt speed by a further 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"boltSpeed","amount":0.004}] },
      { k:'m5', p:'m1', n:'Direct Chassis', d:'Straight down the middle, no detour. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00063}] },
      { k:'m6', p:'m5', n:'Unwavering Chassis', d:'Held steady long enough to stop being effort. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00063}] },
      { k:'m7', p:'m4a', n:'Culmination: Chassis', d:'Everything this branch was building toward. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00095}] },
      { k:'n1', p:null, n:'Hardened Chassis', d:'The chassis recalibrates differently now, and something else pays for it. Permanently reduces movement speed by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"ponybot","stat":"speed","amount":-0.012}] },
      { k:'n2a', p:'n1', n:'Settled Chassis', d:'A habit worn smooth. Increases bolt speed by 2%.', e:[{"type":"stat","classId":"ponybot","stat":"boltSpeed","amount":0.005}] },
      { k:'n3a', p:'n2a', n:'Deepened Chassis', d:'Second nature by now. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"boltSpeed","amount":0.005}] },
      { k:'n4a', p:'n3a', n:'Mastered Chassis', d:'As far down this side as it goes. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"boltSpeed","amount":0.005}] },
      { k:'n2b', p:'n1', n:'Restless Chassis', d:'A different angle on the same habit. Increases range by 2%.', e:[{"type":"stat","classId":"ponybot","stat":"rangeTiles","amount":0.005}] },
      { k:'n3b', p:'n2b', n:'Practiced Chassis', d:'Nothing left to learn on this side of it. Increases range by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"rangeTiles","amount":0.005}] },
      { k:'n4b', p:'n3b', n:'Honed Chassis', d:'The far end of this side. Increases range by a further 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"rangeTiles","amount":0.004}] },
      { k:'n5', p:'n1', n:'Direct Chassis', d:'Straight down the middle, no detour. Increases bolt speed by 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"boltSpeed","amount":0.004}] },
      { k:'n6', p:'n5', n:'Unwavering Chassis', d:'Held steady long enough to stop being effort. Increases bolt speed by a further 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"boltSpeed","amount":0.004}] },
      { k:'n7', p:'n4a', n:'Culmination: Chassis', d:'Everything this branch was building toward. Increases bolt speed by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"ponybot","stat":"boltSpeed","amount":0.006}] },
      { k:'o1', p:null, n:'Hardened Chassis', d:'The chassis recalibrates differently now, and something else pays for it. Permanently reduces ranged damage by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":-0.00189}] },
      { k:'o2a', p:'o1', n:'Settled Chassis', d:'A habit worn smooth. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"ponybot","stat":"critChance","amount":0.005}] },
      { k:'o3a', p:'o2a', n:'Deepened Chassis', d:'Second nature by now. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"critChance","amount":0.005}] },
      { k:'o4a', p:'o3a', n:'Mastered Chassis', d:'As far down this side as it goes. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"critChance","amount":0.005}] },
      { k:'o2b', p:'o1', n:'Restless Chassis', d:'A different angle on the same habit. Increases pickup magnet radius by 2%.', e:[{"type":"stat","classId":"ponybot","stat":"magnetRadius","amount":0.00214}] },
      { k:'o3b', p:'o2b', n:'Practiced Chassis', d:'Nothing left to learn on this side of it. Increases pickup magnet radius by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"magnetRadius","amount":0.00214}] },
      { k:'o4b', p:'o3b', n:'Honed Chassis', d:'The far end of this side. Increases pickup magnet radius by a further 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"magnetRadius","amount":0.00171}] },
      { k:'o5', p:'o1', n:'Direct Chassis', d:'Straight down the middle, no detour. Increases critical hit chance by 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"critChance","amount":0.004}] },
      { k:'o6', p:'o5', n:'Unwavering Chassis', d:'Held steady long enough to stop being effort. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"critChance","amount":0.004}] },
      { k:'o7', p:'o4a', n:'Culmination: Chassis', d:'Everything this branch was building toward. Increases critical hit chance by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"ponybot","stat":"critChance","amount":0.006}] },
      { k:'p1', p:null, n:'Read the Room', d:'Committing to a technique means giving something up first. Permanently reduces ranged damage by 3%. Both disciplines below open from here.', c:true, e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":-0.00237}] },
      { k:'p2a', p:'p1', n:'Braced Stance', d:'Weight low, guard up. Reduces damage taken by 4%, but reduces ranged damage by a further 2%.', e:[{"type":"uniqueField","classId":"ponybot","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6},{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":-0.00316}] },
      { k:'p3a', p:'p2a', n:'Iron Discipline', d:'The stance holds under real pressure now. Reduces damage taken by a further 4%.', e:[{"type":"uniqueField","classId":"ponybot","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p4a', p:'p3a', n:'Unbroken Line', d:'Nothing gets through clean any more. Reduces damage taken by a further 5%.', cost:2, e:[{"type":"uniqueField","classId":"ponybot","field":"damageTakenMult","amount":-0.025,"min":-0.5,"max":0.6}] },
      { k:'p2b', p:'p1', n:'Reckless Opening', d:'Guard down, everything forward. Increases ranged damage by 4%, but increases damage taken by 4%.', e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00158},{"type":"uniqueField","classId":"ponybot","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p3b', p:'p2b', n:'Committed Fully', d:'There is no half-measure left to take. Increases ranged damage by a further 4%, and damage taken by a further 4%.', e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00158},{"type":"uniqueField","classId":"ponybot","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p4b', p:'p3b', n:'All or Nothing', d:'The technique that ends the fight or ends the run. Increases ranged damage by a final 5%, and damage taken by a final 4%.', cost:2, e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00189},{"type":"uniqueField","classId":"ponybot","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p5', p:'p4a', n:'Settled Guard', d:'The braced path stops costing effort to hold. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00063}] },
      { k:'p6', p:'p4b', n:'Second Wind', d:'The reckless path finds a rhythm underneath the risk. Reduces damage taken by 2%.', e:[{"type":"uniqueField","classId":"ponybot","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p7', p:'p5', n:'Culmination: Technique', d:'Both disciplines, fully learned. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00095}] },
      { k:'q1', p:null, n:'Hardened Chassis', d:'The chassis recalibrates differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"ponybot","stat":"critChance","amount":-0.012}] },
      { k:'q2a', p:'q1', n:'Settled Chassis', d:'A habit worn smooth. Increases luck by 2%.', e:[{"type":"stat","classId":"ponybot","stat":"luck","amount":0.005}] },
      { k:'q3a', p:'q2a', n:'Deepened Chassis', d:'Second nature by now. Increases luck by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"luck","amount":0.005}] },
      { k:'q4a', p:'q3a', n:'Mastered Chassis', d:'As far down this side as it goes. Increases luck by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"luck","amount":0.005}] },
      { k:'q2b', p:'q1', n:'Restless Chassis', d:'A different angle on the same habit. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00079}] },
      { k:'q3b', p:'q2b', n:'Practiced Chassis', d:'Nothing left to learn on this side of it. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00079}] },
      { k:'q4b', p:'q3b', n:'Honed Chassis', d:'The far end of this side. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"rangedDamage","amount":0.00063}] },
      { k:'q5', p:'q1', n:'Direct Chassis', d:'Straight down the middle, no detour. Increases luck by 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"luck","amount":0.004}] },
      { k:'q6', p:'q5', n:'Unwavering Chassis', d:'Held steady long enough to stop being effort. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"ponybot","stat":"luck","amount":0.004}] },
      { k:'q7', p:'q4a', n:'Culmination: Chassis', d:'Everything this branch was building toward. Increases luck by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"ponybot","stat":"luck","amount":0.006}] },
    ]);
  }

  // ---------------- griffin ----------------
  {
    const c = 'griffin';
    build(c, [
      { k:'m1', p:null, n:'Hardened Quill', d:'The quill rakes differently now, and something else pays for it. Permanently reduces luck by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"griffin","stat":"luck","amount":-0.012}] },
      { k:'m2a', p:'m1', n:'Settled Quill', d:'A habit worn smooth. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.005}] },
      { k:'m3a', p:'m2a', n:'Deepened Quill', d:'Second nature by now. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.005}] },
      { k:'m4a', p:'m3a', n:'Mastered Quill', d:'As far down this side as it goes. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.005}] },
      { k:'m2b', p:'m1', n:'Restless Quill', d:'A different angle on the same habit. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"griffin","stat":"critChance","amount":0}] },
      { k:'m3b', p:'m2b', n:'Practiced Quill', d:'Nothing left to learn on this side of it. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"critChance","amount":0}] },
      { k:'m4b', p:'m3b', n:'Honed Quill', d:'The far end of this side. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"critChance","amount":0}] },
      { k:'m5', p:'m1', n:'Direct Quill', d:'Straight down the middle, no detour. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.004}] },
      { k:'m6', p:'m5', n:'Unwavering Quill', d:'Held steady long enough to stop being effort. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.004}] },
      { k:'m7', p:'m4a', n:'Culmination: Quill', d:'Everything this branch was building toward. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.006}] },
      { k:'n1', p:null, n:'Hardened Quill', d:'The quill rakes differently now, and something else pays for it. Permanently reduces movement speed by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"griffin","stat":"speed","amount":-0.012}] },
      { k:'n2a', p:'n1', n:'Settled Quill', d:'A habit worn smooth. Increases bolt speed by 2%.', e:[{"type":"stat","classId":"griffin","stat":"boltSpeed","amount":0.005}] },
      { k:'n3a', p:'n2a', n:'Deepened Quill', d:'Second nature by now. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"boltSpeed","amount":0.005}] },
      { k:'n4a', p:'n3a', n:'Mastered Quill', d:'As far down this side as it goes. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"boltSpeed","amount":0.005}] },
      { k:'n2b', p:'n1', n:'Restless Quill', d:'A different angle on the same habit. Increases range by 2%.', e:[{"type":"stat","classId":"griffin","stat":"rangeTiles","amount":0.005}] },
      { k:'n3b', p:'n2b', n:'Practiced Quill', d:'Nothing left to learn on this side of it. Increases range by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"rangeTiles","amount":0.005}] },
      { k:'n4b', p:'n3b', n:'Honed Quill', d:'The far end of this side. Increases range by a further 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"rangeTiles","amount":0.004}] },
      { k:'n5', p:'n1', n:'Direct Quill', d:'Straight down the middle, no detour. Increases bolt speed by 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"boltSpeed","amount":0.004}] },
      { k:'n6', p:'n5', n:'Unwavering Quill', d:'Held steady long enough to stop being effort. Increases bolt speed by a further 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"boltSpeed","amount":0.004}] },
      { k:'n7', p:'n4a', n:'Culmination: Quill', d:'Everything this branch was building toward. Increases bolt speed by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"griffin","stat":"boltSpeed","amount":0.006}] },
      { k:'o1', p:null, n:'Hardened Quill', d:'The quill rakes differently now, and something else pays for it. Permanently reduces ranged damage by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":-0.012}] },
      { k:'o2a', p:'o1', n:'Settled Quill', d:'A habit worn smooth. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"griffin","stat":"critChance","amount":0}] },
      { k:'o3a', p:'o2a', n:'Deepened Quill', d:'Second nature by now. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"critChance","amount":0}] },
      { k:'o4a', p:'o3a', n:'Mastered Quill', d:'As far down this side as it goes. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"critChance","amount":0}] },
      { k:'o2b', p:'o1', n:'Restless Quill', d:'A different angle on the same habit. Increases pickup magnet radius by 2%.', e:[{"type":"stat","classId":"griffin","stat":"magnetRadius","amount":0.005}] },
      { k:'o3b', p:'o2b', n:'Practiced Quill', d:'Nothing left to learn on this side of it. Increases pickup magnet radius by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"magnetRadius","amount":0.005}] },
      { k:'o4b', p:'o3b', n:'Honed Quill', d:'The far end of this side. Increases pickup magnet radius by a further 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"magnetRadius","amount":0.004}] },
      { k:'o5', p:'o1', n:'Direct Quill', d:'Straight down the middle, no detour. Increases critical hit chance by 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"critChance","amount":0}] },
      { k:'o6', p:'o5', n:'Unwavering Quill', d:'Held steady long enough to stop being effort. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"critChance","amount":0}] },
      { k:'o7', p:'o4a', n:'Culmination: Quill', d:'Everything this branch was building toward. Increases critical hit chance by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"griffin","stat":"critChance","amount":0}] },
      { k:'p1', p:null, n:'Read the Room', d:'Committing to a technique means giving something up first. Permanently reduces ranged damage by 3%. Both disciplines below open from here.', c:true, e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":-0.015}] },
      { k:'p2a', p:'p1', n:'Braced Stance', d:'Weight low, guard up. Reduces damage taken by 4%, but reduces ranged damage by a further 2%.', e:[{"type":"uniqueField","classId":"griffin","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6},{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":-0.02}] },
      { k:'p3a', p:'p2a', n:'Iron Discipline', d:'The stance holds under real pressure now. Reduces damage taken by a further 4%.', e:[{"type":"uniqueField","classId":"griffin","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p4a', p:'p3a', n:'Unbroken Line', d:'Nothing gets through clean any more. Reduces damage taken by a further 5%.', cost:2, e:[{"type":"uniqueField","classId":"griffin","field":"damageTakenMult","amount":-0.025,"min":-0.5,"max":0.6}] },
      { k:'p2b', p:'p1', n:'Reckless Opening', d:'Guard down, everything forward. Increases ranged damage by 4%, but increases damage taken by 4%.', e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"griffin","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p3b', p:'p2b', n:'Committed Fully', d:'There is no half-measure left to take. Increases ranged damage by a further 4%, and damage taken by a further 4%.', e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"griffin","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p4b', p:'p3b', n:'All or Nothing', d:'The technique that ends the fight or ends the run. Increases ranged damage by a final 5%, and damage taken by a final 4%.', cost:2, e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.012},{"type":"uniqueField","classId":"griffin","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p5', p:'p4a', n:'Settled Guard', d:'The braced path stops costing effort to hold. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.004}] },
      { k:'p6', p:'p4b', n:'Second Wind', d:'The reckless path finds a rhythm underneath the risk. Reduces damage taken by 2%.', e:[{"type":"uniqueField","classId":"griffin","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p7', p:'p5', n:'Culmination: Technique', d:'Both disciplines, fully learned. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.006}] },
      { k:'q1', p:null, n:'Hardened Quill', d:'The quill rakes differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"griffin","stat":"critChance","amount":0}] },
      { k:'q2a', p:'q1', n:'Settled Quill', d:'A habit worn smooth. Increases luck by 2%.', e:[{"type":"stat","classId":"griffin","stat":"luck","amount":0.005}] },
      { k:'q3a', p:'q2a', n:'Deepened Quill', d:'Second nature by now. Increases luck by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"luck","amount":0.005}] },
      { k:'q4a', p:'q3a', n:'Mastered Quill', d:'As far down this side as it goes. Increases luck by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"luck","amount":0.005}] },
      { k:'q2b', p:'q1', n:'Restless Quill', d:'A different angle on the same habit. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.005}] },
      { k:'q3b', p:'q2b', n:'Practiced Quill', d:'Nothing left to learn on this side of it. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.005}] },
      { k:'q4b', p:'q3b', n:'Honed Quill', d:'The far end of this side. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"rangedDamage","amount":0.004}] },
      { k:'q5', p:'q1', n:'Direct Quill', d:'Straight down the middle, no detour. Increases luck by 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"luck","amount":0.004}] },
      { k:'q6', p:'q5', n:'Unwavering Quill', d:'Held steady long enough to stop being effort. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"griffin","stat":"luck","amount":0.004}] },
      { k:'q7', p:'q4a', n:'Culmination: Quill', d:'Everything this branch was building toward. Increases luck by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"griffin","stat":"luck","amount":0.006}] },
    ]);
  }

  // ---------------- kirin ----------------
  {
    const c = 'kirin';
    build(c, [
      { k:'m1', p:null, n:'Hardened Ember', d:'The ember kindles differently now, and something else pays for it. Permanently reduces luck by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"kirin","stat":"luck","amount":-0.012}] },
      { k:'m2a', p:'m1', n:'Settled Ember', d:'A habit worn smooth. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.005}] },
      { k:'m3a', p:'m2a', n:'Deepened Ember', d:'Second nature by now. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.005}] },
      { k:'m4a', p:'m3a', n:'Mastered Ember', d:'As far down this side as it goes. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.005}] },
      { k:'m2b', p:'m1', n:'Restless Ember', d:'A different angle on the same habit. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"kirin","stat":"critChance","amount":0}] },
      { k:'m3b', p:'m2b', n:'Practiced Ember', d:'Nothing left to learn on this side of it. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"critChance","amount":0}] },
      { k:'m4b', p:'m3b', n:'Honed Ember', d:'The far end of this side. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"critChance","amount":0}] },
      { k:'m5', p:'m1', n:'Direct Ember', d:'Straight down the middle, no detour. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.004}] },
      { k:'m6', p:'m5', n:'Unwavering Ember', d:'Held steady long enough to stop being effort. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.004}] },
      { k:'m7', p:'m4a', n:'Culmination: Ember', d:'Everything this branch was building toward. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.006}] },
      { k:'n1', p:null, n:'Hardened Ember', d:'The ember kindles differently now, and something else pays for it. Permanently reduces movement speed by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"kirin","stat":"speed","amount":-0.012}] },
      { k:'n2a', p:'n1', n:'Settled Ember', d:'A habit worn smooth. Increases bolt speed by 2%.', e:[{"type":"stat","classId":"kirin","stat":"boltSpeed","amount":0.005}] },
      { k:'n3a', p:'n2a', n:'Deepened Ember', d:'Second nature by now. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"boltSpeed","amount":0.005}] },
      { k:'n4a', p:'n3a', n:'Mastered Ember', d:'As far down this side as it goes. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"boltSpeed","amount":0.005}] },
      { k:'n2b', p:'n1', n:'Restless Ember', d:'A different angle on the same habit. Increases range by 2%.', e:[{"type":"stat","classId":"kirin","stat":"rangeTiles","amount":0.005}] },
      { k:'n3b', p:'n2b', n:'Practiced Ember', d:'Nothing left to learn on this side of it. Increases range by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"rangeTiles","amount":0.005}] },
      { k:'n4b', p:'n3b', n:'Honed Ember', d:'The far end of this side. Increases range by a further 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"rangeTiles","amount":0.004}] },
      { k:'n5', p:'n1', n:'Direct Ember', d:'Straight down the middle, no detour. Increases bolt speed by 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"boltSpeed","amount":0.004}] },
      { k:'n6', p:'n5', n:'Unwavering Ember', d:'Held steady long enough to stop being effort. Increases bolt speed by a further 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"boltSpeed","amount":0.004}] },
      { k:'n7', p:'n4a', n:'Culmination: Ember', d:'Everything this branch was building toward. Increases bolt speed by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"kirin","stat":"boltSpeed","amount":0.006}] },
      { k:'o1', p:null, n:'Hardened Ember', d:'The ember kindles differently now, and something else pays for it. Permanently reduces ranged damage by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":-0.012}] },
      { k:'o2a', p:'o1', n:'Settled Ember', d:'A habit worn smooth. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"kirin","stat":"critChance","amount":0}] },
      { k:'o3a', p:'o2a', n:'Deepened Ember', d:'Second nature by now. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"critChance","amount":0}] },
      { k:'o4a', p:'o3a', n:'Mastered Ember', d:'As far down this side as it goes. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"critChance","amount":0}] },
      { k:'o2b', p:'o1', n:'Restless Ember', d:'A different angle on the same habit. Increases pickup magnet radius by 2%.', e:[{"type":"stat","classId":"kirin","stat":"magnetRadius","amount":0.005}] },
      { k:'o3b', p:'o2b', n:'Practiced Ember', d:'Nothing left to learn on this side of it. Increases pickup magnet radius by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"magnetRadius","amount":0.005}] },
      { k:'o4b', p:'o3b', n:'Honed Ember', d:'The far end of this side. Increases pickup magnet radius by a further 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"magnetRadius","amount":0.004}] },
      { k:'o5', p:'o1', n:'Direct Ember', d:'Straight down the middle, no detour. Increases critical hit chance by 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"critChance","amount":0}] },
      { k:'o6', p:'o5', n:'Unwavering Ember', d:'Held steady long enough to stop being effort. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"critChance","amount":0}] },
      { k:'o7', p:'o4a', n:'Culmination: Ember', d:'Everything this branch was building toward. Increases critical hit chance by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"kirin","stat":"critChance","amount":0}] },
      { k:'p1', p:null, n:'Read the Room', d:'Committing to a technique means giving something up first. Permanently reduces ranged damage by 3%. Both disciplines below open from here.', c:true, e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":-0.015}] },
      { k:'p2a', p:'p1', n:'Braced Stance', d:'Weight low, guard up. Reduces damage taken by 4%, but reduces ranged damage by a further 2%.', e:[{"type":"uniqueField","classId":"kirin","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6},{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":-0.02}] },
      { k:'p3a', p:'p2a', n:'Iron Discipline', d:'The stance holds under real pressure now. Reduces damage taken by a further 4%.', e:[{"type":"uniqueField","classId":"kirin","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p4a', p:'p3a', n:'Unbroken Line', d:'Nothing gets through clean any more. Reduces damage taken by a further 5%.', cost:2, e:[{"type":"uniqueField","classId":"kirin","field":"damageTakenMult","amount":-0.025,"min":-0.5,"max":0.6}] },
      { k:'p2b', p:'p1', n:'Reckless Opening', d:'Guard down, everything forward. Increases ranged damage by 4%, but increases damage taken by 4%.', e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"kirin","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p3b', p:'p2b', n:'Committed Fully', d:'There is no half-measure left to take. Increases ranged damage by a further 4%, and damage taken by a further 4%.', e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"kirin","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p4b', p:'p3b', n:'All or Nothing', d:'The technique that ends the fight or ends the run. Increases ranged damage by a final 5%, and damage taken by a final 4%.', cost:2, e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.012},{"type":"uniqueField","classId":"kirin","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p5', p:'p4a', n:'Settled Guard', d:'The braced path stops costing effort to hold. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.004}] },
      { k:'p6', p:'p4b', n:'Second Wind', d:'The reckless path finds a rhythm underneath the risk. Reduces damage taken by 2%.', e:[{"type":"uniqueField","classId":"kirin","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p7', p:'p5', n:'Culmination: Technique', d:'Both disciplines, fully learned. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.006}] },
      { k:'q1', p:null, n:'Hardened Ember', d:'The ember kindles differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"kirin","stat":"critChance","amount":0}] },
      { k:'q2a', p:'q1', n:'Settled Ember', d:'A habit worn smooth. Increases luck by 2%.', e:[{"type":"stat","classId":"kirin","stat":"luck","amount":0.005}] },
      { k:'q3a', p:'q2a', n:'Deepened Ember', d:'Second nature by now. Increases luck by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"luck","amount":0.005}] },
      { k:'q4a', p:'q3a', n:'Mastered Ember', d:'As far down this side as it goes. Increases luck by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"luck","amount":0.005}] },
      { k:'q2b', p:'q1', n:'Restless Ember', d:'A different angle on the same habit. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.005}] },
      { k:'q3b', p:'q2b', n:'Practiced Ember', d:'Nothing left to learn on this side of it. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.005}] },
      { k:'q4b', p:'q3b', n:'Honed Ember', d:'The far end of this side. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"rangedDamage","amount":0.004}] },
      { k:'q5', p:'q1', n:'Direct Ember', d:'Straight down the middle, no detour. Increases luck by 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"luck","amount":0.004}] },
      { k:'q6', p:'q5', n:'Unwavering Ember', d:'Held steady long enough to stop being effort. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"kirin","stat":"luck","amount":0.004}] },
      { k:'q7', p:'q4a', n:'Culmination: Ember', d:'Everything this branch was building toward. Increases luck by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"kirin","stat":"luck","amount":0.006}] },
    ]);
  }

})();

for (const n of SKILL_TREE_CHARACTER_NODES_5B) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

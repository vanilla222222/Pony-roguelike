'use strict';
// achievements/skilltree-characters-5d.js — Phase 11 item 3 REDESIGN:
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
// stacked on this tree's existing totals. Group 4 of 5: crystalpony, mule, alicorn, changeling, diamonddog.
const SKILL_TREE_CHARACTER_NODES_5D = [];
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
      SKILL_TREE_CHARACTER_NODES_5D.push(node);
    }
  }

  // ---------------- crystalpony ----------------
  {
    const c = 'crystalpony';
    build(c, [
      { k:'m1', p:null, n:'Hardened Facet', d:'The facet refracts differently now, and something else pays for it. Permanently reduces luck by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"crystalpony","stat":"luck","amount":-0.012}] },
      { k:'m2a', p:'m1', n:'Settled Facet', d:'A habit worn smooth. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.005}] },
      { k:'m3a', p:'m2a', n:'Deepened Facet', d:'Second nature by now. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.005}] },
      { k:'m4a', p:'m3a', n:'Mastered Facet', d:'As far down this side as it goes. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.005}] },
      { k:'m2b', p:'m1', n:'Restless Facet', d:'A different angle on the same habit. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"critChance","amount":0.005}] },
      { k:'m3b', p:'m2b', n:'Practiced Facet', d:'Nothing left to learn on this side of it. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"critChance","amount":0.005}] },
      { k:'m4b', p:'m3b', n:'Honed Facet', d:'The far end of this side. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"critChance","amount":0.004}] },
      { k:'m5', p:'m1', n:'Direct Facet', d:'Straight down the middle, no detour. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.004}] },
      { k:'m6', p:'m5', n:'Unwavering Facet', d:'Held steady long enough to stop being effort. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.004}] },
      { k:'m7', p:'m4a', n:'Culmination: Facet', d:'Everything this branch was building toward. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.006}] },
      { k:'n1', p:null, n:'Hardened Facet', d:'The facet refracts differently now, and something else pays for it. Permanently reduces movement speed by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"crystalpony","stat":"speed","amount":-0.012}] },
      { k:'n2a', p:'n1', n:'Settled Facet', d:'A habit worn smooth. Increases bolt speed by 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"boltSpeed","amount":0.005}] },
      { k:'n3a', p:'n2a', n:'Deepened Facet', d:'Second nature by now. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"boltSpeed","amount":0.005}] },
      { k:'n4a', p:'n3a', n:'Mastered Facet', d:'As far down this side as it goes. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"boltSpeed","amount":0.005}] },
      { k:'n2b', p:'n1', n:'Restless Facet', d:'A different angle on the same habit. Increases range by 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangeTiles","amount":0.005}] },
      { k:'n3b', p:'n2b', n:'Practiced Facet', d:'Nothing left to learn on this side of it. Increases range by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangeTiles","amount":0.005}] },
      { k:'n4b', p:'n3b', n:'Honed Facet', d:'The far end of this side. Increases range by a further 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangeTiles","amount":0.004}] },
      { k:'n5', p:'n1', n:'Direct Facet', d:'Straight down the middle, no detour. Increases bolt speed by 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"boltSpeed","amount":0.004}] },
      { k:'n6', p:'n5', n:'Unwavering Facet', d:'Held steady long enough to stop being effort. Increases bolt speed by a further 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"boltSpeed","amount":0.004}] },
      { k:'n7', p:'n4a', n:'Culmination: Facet', d:'Everything this branch was building toward. Increases bolt speed by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"crystalpony","stat":"boltSpeed","amount":0.006}] },
      { k:'o1', p:null, n:'Hardened Facet', d:'The facet refracts differently now, and something else pays for it. Permanently reduces ranged damage by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":-0.012}] },
      { k:'o2a', p:'o1', n:'Settled Facet', d:'A habit worn smooth. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"critChance","amount":0.005}] },
      { k:'o3a', p:'o2a', n:'Deepened Facet', d:'Second nature by now. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"critChance","amount":0.005}] },
      { k:'o4a', p:'o3a', n:'Mastered Facet', d:'As far down this side as it goes. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"critChance","amount":0.005}] },
      { k:'o2b', p:'o1', n:'Restless Facet', d:'A different angle on the same habit. Increases pickup magnet radius by 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"magnetRadius","amount":0.005}] },
      { k:'o3b', p:'o2b', n:'Practiced Facet', d:'Nothing left to learn on this side of it. Increases pickup magnet radius by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"magnetRadius","amount":0.005}] },
      { k:'o4b', p:'o3b', n:'Honed Facet', d:'The far end of this side. Increases pickup magnet radius by a further 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"magnetRadius","amount":0.004}] },
      { k:'o5', p:'o1', n:'Direct Facet', d:'Straight down the middle, no detour. Increases critical hit chance by 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"critChance","amount":0.004}] },
      { k:'o6', p:'o5', n:'Unwavering Facet', d:'Held steady long enough to stop being effort. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"critChance","amount":0.004}] },
      { k:'o7', p:'o4a', n:'Culmination: Facet', d:'Everything this branch was building toward. Increases critical hit chance by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"crystalpony","stat":"critChance","amount":0.006}] },
      { k:'p1', p:null, n:'Read the Room', d:'Committing to a technique means giving something up first. Permanently reduces ranged damage by 3%. Both disciplines below open from here.', c:true, e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":-0.015}] },
      { k:'p2a', p:'p1', n:'Braced Stance', d:'Weight low, guard up. Reduces damage taken by 4%, but reduces ranged damage by a further 2%.', e:[{"type":"uniqueField","classId":"crystalpony","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6},{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":-0.02}] },
      { k:'p3a', p:'p2a', n:'Iron Discipline', d:'The stance holds under real pressure now. Reduces damage taken by a further 4%.', e:[{"type":"uniqueField","classId":"crystalpony","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p4a', p:'p3a', n:'Unbroken Line', d:'Nothing gets through clean any more. Reduces damage taken by a further 5%.', cost:2, e:[{"type":"uniqueField","classId":"crystalpony","field":"damageTakenMult","amount":-0.025,"min":-0.5,"max":0.6}] },
      { k:'p2b', p:'p1', n:'Reckless Opening', d:'Guard down, everything forward. Increases ranged damage by 4%, but increases damage taken by 4%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"crystalpony","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p3b', p:'p2b', n:'Committed Fully', d:'There is no half-measure left to take. Increases ranged damage by a further 4%, and damage taken by a further 4%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"crystalpony","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p4b', p:'p3b', n:'All or Nothing', d:'The technique that ends the fight or ends the run. Increases ranged damage by a final 5%, and damage taken by a final 4%.', cost:2, e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.012},{"type":"uniqueField","classId":"crystalpony","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p5', p:'p4a', n:'Settled Guard', d:'The braced path stops costing effort to hold. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.004}] },
      { k:'p6', p:'p4b', n:'Second Wind', d:'The reckless path finds a rhythm underneath the risk. Reduces damage taken by 2%.', e:[{"type":"uniqueField","classId":"crystalpony","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p7', p:'p5', n:'Culmination: Technique', d:'Both disciplines, fully learned. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.006}] },
      { k:'q1', p:null, n:'Hardened Facet', d:'The facet refracts differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"crystalpony","stat":"critChance","amount":-0.012}] },
      { k:'q2a', p:'q1', n:'Settled Facet', d:'A habit worn smooth. Increases luck by 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"luck","amount":0.005}] },
      { k:'q3a', p:'q2a', n:'Deepened Facet', d:'Second nature by now. Increases luck by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"luck","amount":0.005}] },
      { k:'q4a', p:'q3a', n:'Mastered Facet', d:'As far down this side as it goes. Increases luck by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"luck","amount":0.005}] },
      { k:'q2b', p:'q1', n:'Restless Facet', d:'A different angle on the same habit. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.005}] },
      { k:'q3b', p:'q2b', n:'Practiced Facet', d:'Nothing left to learn on this side of it. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.005}] },
      { k:'q4b', p:'q3b', n:'Honed Facet', d:'The far end of this side. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"rangedDamage","amount":0.004}] },
      { k:'q5', p:'q1', n:'Direct Facet', d:'Straight down the middle, no detour. Increases luck by 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"luck","amount":0.004}] },
      { k:'q6', p:'q5', n:'Unwavering Facet', d:'Held steady long enough to stop being effort. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"crystalpony","stat":"luck","amount":0.004}] },
      { k:'q7', p:'q4a', n:'Culmination: Facet', d:'Everything this branch was building toward. Increases luck by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"crystalpony","stat":"luck","amount":0.006}] },
    ]);
  }

  // ---------------- mule ----------------
  {
    const c = 'mule';
    build(c, [
      { k:'m1', p:null, n:'Hardened Pack', d:'The pack hauls differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"mule","stat":"critChance","amount":-0.012}] },
      { k:'m2a', p:'m1', n:'Settled Pack', d:'A habit worn smooth. Increases melee damage by 2%.', e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'m3a', p:'m2a', n:'Deepened Pack', d:'Second nature by now. Increases melee damage by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'m4a', p:'m3a', n:'Mastered Pack', d:'As far down this side as it goes. Increases melee damage by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'m2b', p:'m1', n:'Restless Pack', d:'A different angle on the same habit. Increases luck by 2%.', e:[{"type":"stat","classId":"mule","stat":"luck","amount":0}] },
      { k:'m3b', p:'m2b', n:'Practiced Pack', d:'Nothing left to learn on this side of it. Increases luck by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"luck","amount":0}] },
      { k:'m4b', p:'m3b', n:'Honed Pack', d:'The far end of this side. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"mule","stat":"luck","amount":0}] },
      { k:'m5', p:'m1', n:'Direct Pack', d:'Straight down the middle, no detour. Increases melee damage by 1.5%.', e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'m6', p:'m5', n:'Unwavering Pack', d:'Held steady long enough to stop being effort. Increases melee damage by a further 1.5%.', e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'m7', p:'m4a', n:'Culmination: Pack', d:'Everything this branch was building toward. Increases melee damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'n1', p:null, n:'Hardened Pack', d:'The pack hauls differently now, and something else pays for it. Permanently reduces movement speed by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"mule","stat":"speed","amount":-0.012}] },
      { k:'n2a', p:'n1', n:'Settled Pack', d:'A habit worn smooth. Increases movement speed by 2%.', e:[{"type":"stat","classId":"mule","stat":"speed","amount":0.005}] },
      { k:'n3a', p:'n2a', n:'Deepened Pack', d:'Second nature by now. Increases movement speed by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"speed","amount":0.005}] },
      { k:'n4a', p:'n3a', n:'Mastered Pack', d:'As far down this side as it goes. Increases movement speed by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"speed","amount":0.005}] },
      { k:'n2b', p:'n1', n:'Restless Pack', d:'A different angle on the same habit. Increases range by 2%.', e:[{"type":"stat","classId":"mule","stat":"rangeTiles","amount":0.005}] },
      { k:'n3b', p:'n2b', n:'Practiced Pack', d:'Nothing left to learn on this side of it. Increases range by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"rangeTiles","amount":0.005}] },
      { k:'n4b', p:'n3b', n:'Honed Pack', d:'The far end of this side. Increases range by a further 1.5%.', e:[{"type":"stat","classId":"mule","stat":"rangeTiles","amount":0.004}] },
      { k:'n5', p:'n1', n:'Direct Pack', d:'Straight down the middle, no detour. Increases movement speed by 1.5%.', e:[{"type":"stat","classId":"mule","stat":"speed","amount":0.004}] },
      { k:'n6', p:'n5', n:'Unwavering Pack', d:'Held steady long enough to stop being effort. Increases movement speed by a further 1.5%.', e:[{"type":"stat","classId":"mule","stat":"speed","amount":0.004}] },
      { k:'n7', p:'n4a', n:'Culmination: Pack', d:'Everything this branch was building toward. Increases movement speed by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"mule","stat":"speed","amount":0.006}] },
      { k:'o1', p:null, n:'Hardened Pack', d:'The pack hauls differently now, and something else pays for it. Permanently reduces melee damage by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'o2a', p:'o1', n:'Settled Pack', d:'A habit worn smooth. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"mule","stat":"critChance","amount":0.005}] },
      { k:'o3a', p:'o2a', n:'Deepened Pack', d:'Second nature by now. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"critChance","amount":0.005}] },
      { k:'o4a', p:'o3a', n:'Mastered Pack', d:'As far down this side as it goes. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"critChance","amount":0.005}] },
      { k:'o2b', p:'o1', n:'Restless Pack', d:'A different angle on the same habit. Increases pickup magnet radius by 2%.', e:[{"type":"stat","classId":"mule","stat":"magnetRadius","amount":0}] },
      { k:'o3b', p:'o2b', n:'Practiced Pack', d:'Nothing left to learn on this side of it. Increases pickup magnet radius by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"magnetRadius","amount":0}] },
      { k:'o4b', p:'o3b', n:'Honed Pack', d:'The far end of this side. Increases pickup magnet radius by a further 1.5%.', e:[{"type":"stat","classId":"mule","stat":"magnetRadius","amount":0}] },
      { k:'o5', p:'o1', n:'Direct Pack', d:'Straight down the middle, no detour. Increases critical hit chance by 1.5%.', e:[{"type":"stat","classId":"mule","stat":"critChance","amount":0.004}] },
      { k:'o6', p:'o5', n:'Unwavering Pack', d:'Held steady long enough to stop being effort. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"mule","stat":"critChance","amount":0.004}] },
      { k:'o7', p:'o4a', n:'Culmination: Pack', d:'Everything this branch was building toward. Increases critical hit chance by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"mule","stat":"critChance","amount":0.006}] },
      { k:'p1', p:null, n:'Read the Room', d:'Committing to a technique means giving something up first. Permanently reduces melee damage by 3%. Both disciplines below open from here.', c:true, e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'p2a', p:'p1', n:'Braced Stance', d:'Weight low, guard up. Reduces damage taken by 4%, but reduces melee damage by a further 2%.', e:[{"type":"uniqueField","classId":"mule","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6},{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'p3a', p:'p2a', n:'Iron Discipline', d:'The stance holds under real pressure now. Reduces damage taken by a further 4%.', e:[{"type":"uniqueField","classId":"mule","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p4a', p:'p3a', n:'Unbroken Line', d:'Nothing gets through clean any more. Reduces damage taken by a further 5%.', cost:2, e:[{"type":"uniqueField","classId":"mule","field":"damageTakenMult","amount":-0.025,"min":-0.5,"max":0.6}] },
      { k:'p2b', p:'p1', n:'Reckless Opening', d:'Guard down, everything forward. Increases melee damage by 4%, but increases damage taken by 4%.', e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0},{"type":"uniqueField","classId":"mule","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p3b', p:'p2b', n:'Committed Fully', d:'There is no half-measure left to take. Increases melee damage by a further 4%, and damage taken by a further 4%.', e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0},{"type":"uniqueField","classId":"mule","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p4b', p:'p3b', n:'All or Nothing', d:'The technique that ends the fight or ends the run. Increases melee damage by a final 5%, and damage taken by a final 4%.', cost:2, e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0},{"type":"uniqueField","classId":"mule","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p5', p:'p4a', n:'Settled Guard', d:'The braced path stops costing effort to hold. Increases melee damage by 1.5%.', e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'p6', p:'p4b', n:'Second Wind', d:'The reckless path finds a rhythm underneath the risk. Reduces damage taken by 2%.', e:[{"type":"uniqueField","classId":"mule","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p7', p:'p5', n:'Culmination: Technique', d:'Both disciplines, fully learned. Increases melee damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'q1', p:null, n:'Hardened Pack', d:'The pack hauls differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"mule","stat":"critChance","amount":-0.012}] },
      { k:'q2a', p:'q1', n:'Settled Pack', d:'A habit worn smooth. Increases luck by 2%.', e:[{"type":"stat","classId":"mule","stat":"luck","amount":0}] },
      { k:'q3a', p:'q2a', n:'Deepened Pack', d:'Second nature by now. Increases luck by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"luck","amount":0}] },
      { k:'q4a', p:'q3a', n:'Mastered Pack', d:'As far down this side as it goes. Increases luck by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"luck","amount":0}] },
      { k:'q2b', p:'q1', n:'Restless Pack', d:'A different angle on the same habit. Increases melee damage by 2%.', e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'q3b', p:'q2b', n:'Practiced Pack', d:'Nothing left to learn on this side of it. Increases melee damage by a further 2%.', e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'q4b', p:'q3b', n:'Honed Pack', d:'The far end of this side. Increases melee damage by a further 1.5%.', e:[{"type":"stat","classId":"mule","stat":"meleeDamage","amount":0}] },
      { k:'q5', p:'q1', n:'Direct Pack', d:'Straight down the middle, no detour. Increases luck by 1.5%.', e:[{"type":"stat","classId":"mule","stat":"luck","amount":0}] },
      { k:'q6', p:'q5', n:'Unwavering Pack', d:'Held steady long enough to stop being effort. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"mule","stat":"luck","amount":0}] },
      { k:'q7', p:'q4a', n:'Culmination: Pack', d:'Everything this branch was building toward. Increases luck by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"mule","stat":"luck","amount":0}] },
    ]);
  }

  // ---------------- alicorn ----------------
  {
    const c = 'alicorn';
    build(c, [
      { k:'m1', p:null, n:'Hardened Wingtip', d:'The wingtip kindles differently now, and something else pays for it. Permanently reduces luck by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"alicorn","stat":"luck","amount":-0.012}] },
      { k:'m2a', p:'m1', n:'Settled Wingtip', d:'A habit worn smooth. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.005}] },
      { k:'m3a', p:'m2a', n:'Deepened Wingtip', d:'Second nature by now. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.005}] },
      { k:'m4a', p:'m3a', n:'Mastered Wingtip', d:'As far down this side as it goes. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.005}] },
      { k:'m2b', p:'m1', n:'Restless Wingtip', d:'A different angle on the same habit. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"alicorn","stat":"critChance","amount":0.005}] },
      { k:'m3b', p:'m2b', n:'Practiced Wingtip', d:'Nothing left to learn on this side of it. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"critChance","amount":0.005}] },
      { k:'m4b', p:'m3b', n:'Honed Wingtip', d:'The far end of this side. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"critChance","amount":0.004}] },
      { k:'m5', p:'m1', n:'Direct Wingtip', d:'Straight down the middle, no detour. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.004}] },
      { k:'m6', p:'m5', n:'Unwavering Wingtip', d:'Held steady long enough to stop being effort. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.004}] },
      { k:'m7', p:'m4a', n:'Culmination: Wingtip', d:'Everything this branch was building toward. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.006}] },
      { k:'n1', p:null, n:'Hardened Wingtip', d:'The wingtip kindles differently now, and something else pays for it. Permanently reduces movement speed by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"alicorn","stat":"speed","amount":-0.012}] },
      { k:'n2a', p:'n1', n:'Settled Wingtip', d:'A habit worn smooth. Increases bolt speed by 2%.', e:[{"type":"stat","classId":"alicorn","stat":"boltSpeed","amount":0}] },
      { k:'n3a', p:'n2a', n:'Deepened Wingtip', d:'Second nature by now. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"boltSpeed","amount":0}] },
      { k:'n4a', p:'n3a', n:'Mastered Wingtip', d:'As far down this side as it goes. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"boltSpeed","amount":0}] },
      { k:'n2b', p:'n1', n:'Restless Wingtip', d:'A different angle on the same habit. Increases range by 2%.', e:[{"type":"stat","classId":"alicorn","stat":"rangeTiles","amount":0.005}] },
      { k:'n3b', p:'n2b', n:'Practiced Wingtip', d:'Nothing left to learn on this side of it. Increases range by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"rangeTiles","amount":0.005}] },
      { k:'n4b', p:'n3b', n:'Honed Wingtip', d:'The far end of this side. Increases range by a further 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"rangeTiles","amount":0.004}] },
      { k:'n5', p:'n1', n:'Direct Wingtip', d:'Straight down the middle, no detour. Increases bolt speed by 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"boltSpeed","amount":0}] },
      { k:'n6', p:'n5', n:'Unwavering Wingtip', d:'Held steady long enough to stop being effort. Increases bolt speed by a further 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"boltSpeed","amount":0}] },
      { k:'n7', p:'n4a', n:'Culmination: Wingtip', d:'Everything this branch was building toward. Increases bolt speed by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"alicorn","stat":"boltSpeed","amount":0}] },
      { k:'o1', p:null, n:'Hardened Wingtip', d:'The wingtip kindles differently now, and something else pays for it. Permanently reduces ranged damage by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":-0.012}] },
      { k:'o2a', p:'o1', n:'Settled Wingtip', d:'A habit worn smooth. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"alicorn","stat":"critChance","amount":0.005}] },
      { k:'o3a', p:'o2a', n:'Deepened Wingtip', d:'Second nature by now. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"critChance","amount":0.005}] },
      { k:'o4a', p:'o3a', n:'Mastered Wingtip', d:'As far down this side as it goes. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"critChance","amount":0.005}] },
      { k:'o2b', p:'o1', n:'Restless Wingtip', d:'A different angle on the same habit. Increases pickup magnet radius by 2%.', e:[{"type":"stat","classId":"alicorn","stat":"magnetRadius","amount":0.005}] },
      { k:'o3b', p:'o2b', n:'Practiced Wingtip', d:'Nothing left to learn on this side of it. Increases pickup magnet radius by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"magnetRadius","amount":0.005}] },
      { k:'o4b', p:'o3b', n:'Honed Wingtip', d:'The far end of this side. Increases pickup magnet radius by a further 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"magnetRadius","amount":0.004}] },
      { k:'o5', p:'o1', n:'Direct Wingtip', d:'Straight down the middle, no detour. Increases critical hit chance by 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"critChance","amount":0.004}] },
      { k:'o6', p:'o5', n:'Unwavering Wingtip', d:'Held steady long enough to stop being effort. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"critChance","amount":0.004}] },
      { k:'o7', p:'o4a', n:'Culmination: Wingtip', d:'Everything this branch was building toward. Increases critical hit chance by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"alicorn","stat":"critChance","amount":0.006}] },
      { k:'p1', p:null, n:'Read the Room', d:'Committing to a technique means giving something up first. Permanently reduces ranged damage by 3%. Both disciplines below open from here.', c:true, e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":-0.015}] },
      { k:'p2a', p:'p1', n:'Braced Stance', d:'Weight low, guard up. Reduces damage taken by 4%, but reduces ranged damage by a further 2%.', e:[{"type":"uniqueField","classId":"alicorn","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6},{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":-0.02}] },
      { k:'p3a', p:'p2a', n:'Iron Discipline', d:'The stance holds under real pressure now. Reduces damage taken by a further 4%.', e:[{"type":"uniqueField","classId":"alicorn","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p4a', p:'p3a', n:'Unbroken Line', d:'Nothing gets through clean any more. Reduces damage taken by a further 5%.', cost:2, e:[{"type":"uniqueField","classId":"alicorn","field":"damageTakenMult","amount":-0.025,"min":-0.5,"max":0.6}] },
      { k:'p2b', p:'p1', n:'Reckless Opening', d:'Guard down, everything forward. Increases ranged damage by 4%, but increases damage taken by 4%.', e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"alicorn","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p3b', p:'p2b', n:'Committed Fully', d:'There is no half-measure left to take. Increases ranged damage by a further 4%, and damage taken by a further 4%.', e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"alicorn","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p4b', p:'p3b', n:'All or Nothing', d:'The technique that ends the fight or ends the run. Increases ranged damage by a final 5%, and damage taken by a final 4%.', cost:2, e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.012},{"type":"uniqueField","classId":"alicorn","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p5', p:'p4a', n:'Settled Guard', d:'The braced path stops costing effort to hold. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.004}] },
      { k:'p6', p:'p4b', n:'Second Wind', d:'The reckless path finds a rhythm underneath the risk. Reduces damage taken by 2%.', e:[{"type":"uniqueField","classId":"alicorn","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p7', p:'p5', n:'Culmination: Technique', d:'Both disciplines, fully learned. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.006}] },
      { k:'q1', p:null, n:'Hardened Wingtip', d:'The wingtip kindles differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"alicorn","stat":"critChance","amount":-0.012}] },
      { k:'q2a', p:'q1', n:'Settled Wingtip', d:'A habit worn smooth. Increases luck by 2%.', e:[{"type":"stat","classId":"alicorn","stat":"luck","amount":0.005}] },
      { k:'q3a', p:'q2a', n:'Deepened Wingtip', d:'Second nature by now. Increases luck by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"luck","amount":0.005}] },
      { k:'q4a', p:'q3a', n:'Mastered Wingtip', d:'As far down this side as it goes. Increases luck by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"luck","amount":0.005}] },
      { k:'q2b', p:'q1', n:'Restless Wingtip', d:'A different angle on the same habit. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.005}] },
      { k:'q3b', p:'q2b', n:'Practiced Wingtip', d:'Nothing left to learn on this side of it. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.005}] },
      { k:'q4b', p:'q3b', n:'Honed Wingtip', d:'The far end of this side. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"rangedDamage","amount":0.004}] },
      { k:'q5', p:'q1', n:'Direct Wingtip', d:'Straight down the middle, no detour. Increases luck by 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"luck","amount":0.004}] },
      { k:'q6', p:'q5', n:'Unwavering Wingtip', d:'Held steady long enough to stop being effort. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"alicorn","stat":"luck","amount":0.004}] },
      { k:'q7', p:'q4a', n:'Culmination: Wingtip', d:'Everything this branch was building toward. Increases luck by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"alicorn","stat":"luck","amount":0.006}] },
    ]);
  }

  // ---------------- changeling ----------------
  {
    const c = 'changeling';
    build(c, [
      { k:'m1', p:null, n:'Hardened Coal', d:'The coal smolders differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"changeling","stat":"critChance","amount":-0.012}] },
      { k:'m2a', p:'m1', n:'Settled Coal', d:'A habit worn smooth. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.005}] },
      { k:'m3a', p:'m2a', n:'Deepened Coal', d:'Second nature by now. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.005}] },
      { k:'m4a', p:'m3a', n:'Mastered Coal', d:'As far down this side as it goes. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.005}] },
      { k:'m2b', p:'m1', n:'Restless Coal', d:'A different angle on the same habit. Increases luck by 2%.', e:[{"type":"stat","classId":"changeling","stat":"luck","amount":0.005}] },
      { k:'m3b', p:'m2b', n:'Practiced Coal', d:'Nothing left to learn on this side of it. Increases luck by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"luck","amount":0.005}] },
      { k:'m4b', p:'m3b', n:'Honed Coal', d:'The far end of this side. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"luck","amount":0.004}] },
      { k:'m5', p:'m1', n:'Direct Coal', d:'Straight down the middle, no detour. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.004}] },
      { k:'m6', p:'m5', n:'Unwavering Coal', d:'Held steady long enough to stop being effort. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.004}] },
      { k:'m7', p:'m4a', n:'Culmination: Coal', d:'Everything this branch was building toward. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.006}] },
      { k:'n1', p:null, n:'Hardened Coal', d:'The coal smolders differently now, and something else pays for it. Permanently reduces movement speed by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"changeling","stat":"speed","amount":-0.012}] },
      { k:'n2a', p:'n1', n:'Settled Coal', d:'A habit worn smooth. Increases bolt speed by 2%.', e:[{"type":"stat","classId":"changeling","stat":"boltSpeed","amount":0.005}] },
      { k:'n3a', p:'n2a', n:'Deepened Coal', d:'Second nature by now. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"boltSpeed","amount":0.005}] },
      { k:'n4a', p:'n3a', n:'Mastered Coal', d:'As far down this side as it goes. Increases bolt speed by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"boltSpeed","amount":0.005}] },
      { k:'n2b', p:'n1', n:'Restless Coal', d:'A different angle on the same habit. Increases range by 2%.', e:[{"type":"stat","classId":"changeling","stat":"rangeTiles","amount":0.005}] },
      { k:'n3b', p:'n2b', n:'Practiced Coal', d:'Nothing left to learn on this side of it. Increases range by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"rangeTiles","amount":0.005}] },
      { k:'n4b', p:'n3b', n:'Honed Coal', d:'The far end of this side. Increases range by a further 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"rangeTiles","amount":0.004}] },
      { k:'n5', p:'n1', n:'Direct Coal', d:'Straight down the middle, no detour. Increases bolt speed by 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"boltSpeed","amount":0.004}] },
      { k:'n6', p:'n5', n:'Unwavering Coal', d:'Held steady long enough to stop being effort. Increases bolt speed by a further 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"boltSpeed","amount":0.004}] },
      { k:'n7', p:'n4a', n:'Culmination: Coal', d:'Everything this branch was building toward. Increases bolt speed by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"changeling","stat":"boltSpeed","amount":0.006}] },
      { k:'o1', p:null, n:'Hardened Coal', d:'The coal smolders differently now, and something else pays for it. Permanently reduces ranged damage by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":-0.012}] },
      { k:'o2a', p:'o1', n:'Settled Coal', d:'A habit worn smooth. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"changeling","stat":"critChance","amount":0.005}] },
      { k:'o3a', p:'o2a', n:'Deepened Coal', d:'Second nature by now. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"critChance","amount":0.005}] },
      { k:'o4a', p:'o3a', n:'Mastered Coal', d:'As far down this side as it goes. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"critChance","amount":0.005}] },
      { k:'o2b', p:'o1', n:'Restless Coal', d:'A different angle on the same habit. Increases pickup magnet radius by 2%.', e:[{"type":"stat","classId":"changeling","stat":"magnetRadius","amount":0.005}] },
      { k:'o3b', p:'o2b', n:'Practiced Coal', d:'Nothing left to learn on this side of it. Increases pickup magnet radius by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"magnetRadius","amount":0.005}] },
      { k:'o4b', p:'o3b', n:'Honed Coal', d:'The far end of this side. Increases pickup magnet radius by a further 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"magnetRadius","amount":0.004}] },
      { k:'o5', p:'o1', n:'Direct Coal', d:'Straight down the middle, no detour. Increases critical hit chance by 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"critChance","amount":0.004}] },
      { k:'o6', p:'o5', n:'Unwavering Coal', d:'Held steady long enough to stop being effort. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"critChance","amount":0.004}] },
      { k:'o7', p:'o4a', n:'Culmination: Coal', d:'Everything this branch was building toward. Increases critical hit chance by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"changeling","stat":"critChance","amount":0.006}] },
      { k:'p1', p:null, n:'Read the Room', d:'Committing to a technique means giving something up first. Permanently reduces ranged damage by 3%. Both disciplines below open from here.', c:true, e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":-0.015}] },
      { k:'p2a', p:'p1', n:'Braced Stance', d:'Weight low, guard up. Reduces damage taken by 4%, but reduces ranged damage by a further 2%.', e:[{"type":"uniqueField","classId":"changeling","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6},{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":-0.02}] },
      { k:'p3a', p:'p2a', n:'Iron Discipline', d:'The stance holds under real pressure now. Reduces damage taken by a further 4%.', e:[{"type":"uniqueField","classId":"changeling","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p4a', p:'p3a', n:'Unbroken Line', d:'Nothing gets through clean any more. Reduces damage taken by a further 5%.', cost:2, e:[{"type":"uniqueField","classId":"changeling","field":"damageTakenMult","amount":-0.025,"min":-0.5,"max":0.6}] },
      { k:'p2b', p:'p1', n:'Reckless Opening', d:'Guard down, everything forward. Increases ranged damage by 4%, but increases damage taken by 4%.', e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"changeling","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p3b', p:'p2b', n:'Committed Fully', d:'There is no half-measure left to take. Increases ranged damage by a further 4%, and damage taken by a further 4%.', e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.01},{"type":"uniqueField","classId":"changeling","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p4b', p:'p3b', n:'All or Nothing', d:'The technique that ends the fight or ends the run. Increases ranged damage by a final 5%, and damage taken by a final 4%.', cost:2, e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.012},{"type":"uniqueField","classId":"changeling","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p5', p:'p4a', n:'Settled Guard', d:'The braced path stops costing effort to hold. Increases ranged damage by 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.004}] },
      { k:'p6', p:'p4b', n:'Second Wind', d:'The reckless path finds a rhythm underneath the risk. Reduces damage taken by 2%.', e:[{"type":"uniqueField","classId":"changeling","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p7', p:'p5', n:'Culmination: Technique', d:'Both disciplines, fully learned. Increases ranged damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.006}] },
      { k:'q1', p:null, n:'Hardened Coal', d:'The coal smolders differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"changeling","stat":"critChance","amount":-0.012}] },
      { k:'q2a', p:'q1', n:'Settled Coal', d:'A habit worn smooth. Increases luck by 2%.', e:[{"type":"stat","classId":"changeling","stat":"luck","amount":0.005}] },
      { k:'q3a', p:'q2a', n:'Deepened Coal', d:'Second nature by now. Increases luck by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"luck","amount":0.005}] },
      { k:'q4a', p:'q3a', n:'Mastered Coal', d:'As far down this side as it goes. Increases luck by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"luck","amount":0.005}] },
      { k:'q2b', p:'q1', n:'Restless Coal', d:'A different angle on the same habit. Increases ranged damage by 2%.', e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.005}] },
      { k:'q3b', p:'q2b', n:'Practiced Coal', d:'Nothing left to learn on this side of it. Increases ranged damage by a further 2%.', e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.005}] },
      { k:'q4b', p:'q3b', n:'Honed Coal', d:'The far end of this side. Increases ranged damage by a further 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"rangedDamage","amount":0.004}] },
      { k:'q5', p:'q1', n:'Direct Coal', d:'Straight down the middle, no detour. Increases luck by 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"luck","amount":0.004}] },
      { k:'q6', p:'q5', n:'Unwavering Coal', d:'Held steady long enough to stop being effort. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"changeling","stat":"luck","amount":0.004}] },
      { k:'q7', p:'q4a', n:'Culmination: Coal', d:'Everything this branch was building toward. Increases luck by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"changeling","stat":"luck","amount":0.006}] },
    ]);
  }

  // ---------------- diamonddog ----------------
  {
    const c = 'diamonddog';
    build(c, [
      { k:'m1', p:null, n:'Hardened Claw', d:'The claw quarries differently now, and something else pays for it. Permanently reduces luck by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"diamonddog","stat":"luck","amount":0}] },
      { k:'m2a', p:'m1', n:'Settled Claw', d:'A habit worn smooth. Increases melee damage by 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'m3a', p:'m2a', n:'Deepened Claw', d:'Second nature by now. Increases melee damage by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'m4a', p:'m3a', n:'Mastered Claw', d:'As far down this side as it goes. Increases melee damage by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'m2b', p:'m1', n:'Restless Claw', d:'A different angle on the same habit. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"critChance","amount":0.00419}] },
      { k:'m3b', p:'m2b', n:'Practiced Claw', d:'Nothing left to learn on this side of it. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"critChance","amount":0.00419}] },
      { k:'m4b', p:'m3b', n:'Honed Claw', d:'The far end of this side. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"critChance","amount":0.00335}] },
      { k:'m5', p:'m1', n:'Direct Claw', d:'Straight down the middle, no detour. Increases melee damage by 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'m6', p:'m5', n:'Unwavering Claw', d:'Held steady long enough to stop being effort. Increases melee damage by a further 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'m7', p:'m4a', n:'Culmination: Claw', d:'Everything this branch was building toward. Increases melee damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'n1', p:null, n:'Hardened Claw', d:'The claw quarries differently now, and something else pays for it. Permanently reduces movement speed by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"diamonddog","stat":"speed","amount":-0.012}] },
      { k:'n2a', p:'n1', n:'Settled Claw', d:'A habit worn smooth. Increases movement speed by 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"speed","amount":0.005}] },
      { k:'n3a', p:'n2a', n:'Deepened Claw', d:'Second nature by now. Increases movement speed by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"speed","amount":0.005}] },
      { k:'n4a', p:'n3a', n:'Mastered Claw', d:'As far down this side as it goes. Increases movement speed by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"speed","amount":0.005}] },
      { k:'n2b', p:'n1', n:'Restless Claw', d:'A different angle on the same habit. Increases range by 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"rangeTiles","amount":0.005}] },
      { k:'n3b', p:'n2b', n:'Practiced Claw', d:'Nothing left to learn on this side of it. Increases range by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"rangeTiles","amount":0.005}] },
      { k:'n4b', p:'n3b', n:'Honed Claw', d:'The far end of this side. Increases range by a further 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"rangeTiles","amount":0.004}] },
      { k:'n5', p:'n1', n:'Direct Claw', d:'Straight down the middle, no detour. Increases movement speed by 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"speed","amount":0.004}] },
      { k:'n6', p:'n5', n:'Unwavering Claw', d:'Held steady long enough to stop being effort. Increases movement speed by a further 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"speed","amount":0.004}] },
      { k:'n7', p:'n4a', n:'Culmination: Claw', d:'Everything this branch was building toward. Increases movement speed by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"diamonddog","stat":"speed","amount":0.006}] },
      { k:'o1', p:null, n:'Hardened Claw', d:'The claw quarries differently now, and something else pays for it. Permanently reduces melee damage by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'o2a', p:'o1', n:'Settled Claw', d:'A habit worn smooth. Increases critical hit chance by 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"critChance","amount":0.00419}] },
      { k:'o3a', p:'o2a', n:'Deepened Claw', d:'Second nature by now. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"critChance","amount":0.00419}] },
      { k:'o4a', p:'o3a', n:'Mastered Claw', d:'As far down this side as it goes. Increases critical hit chance by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"critChance","amount":0.00419}] },
      { k:'o2b', p:'o1', n:'Restless Claw', d:'A different angle on the same habit. Increases pickup magnet radius by 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"magnetRadius","amount":0}] },
      { k:'o3b', p:'o2b', n:'Practiced Claw', d:'Nothing left to learn on this side of it. Increases pickup magnet radius by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"magnetRadius","amount":0}] },
      { k:'o4b', p:'o3b', n:'Honed Claw', d:'The far end of this side. Increases pickup magnet radius by a further 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"magnetRadius","amount":0}] },
      { k:'o5', p:'o1', n:'Direct Claw', d:'Straight down the middle, no detour. Increases critical hit chance by 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"critChance","amount":0.00335}] },
      { k:'o6', p:'o5', n:'Unwavering Claw', d:'Held steady long enough to stop being effort. Increases critical hit chance by a further 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"critChance","amount":0.00335}] },
      { k:'o7', p:'o4a', n:'Culmination: Claw', d:'Everything this branch was building toward. Increases critical hit chance by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"diamonddog","stat":"critChance","amount":0.00503}] },
      { k:'p1', p:null, n:'Read the Room', d:'Committing to a technique means giving something up first. Permanently reduces melee damage by 3%. Both disciplines below open from here.', c:true, e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'p2a', p:'p1', n:'Braced Stance', d:'Weight low, guard up. Reduces damage taken by 4%, but reduces melee damage by a further 2%.', e:[{"type":"uniqueField","classId":"diamonddog","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6},{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'p3a', p:'p2a', n:'Iron Discipline', d:'The stance holds under real pressure now. Reduces damage taken by a further 4%.', e:[{"type":"uniqueField","classId":"diamonddog","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p4a', p:'p3a', n:'Unbroken Line', d:'Nothing gets through clean any more. Reduces damage taken by a further 5%.', cost:2, e:[{"type":"uniqueField","classId":"diamonddog","field":"damageTakenMult","amount":-0.025,"min":-0.5,"max":0.6}] },
      { k:'p2b', p:'p1', n:'Reckless Opening', d:'Guard down, everything forward. Increases melee damage by 4%, but increases damage taken by 4%.', e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0},{"type":"uniqueField","classId":"diamonddog","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p3b', p:'p2b', n:'Committed Fully', d:'There is no half-measure left to take. Increases melee damage by a further 4%, and damage taken by a further 4%.', e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0},{"type":"uniqueField","classId":"diamonddog","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p4b', p:'p3b', n:'All or Nothing', d:'The technique that ends the fight or ends the run. Increases melee damage by a final 5%, and damage taken by a final 4%.', cost:2, e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0},{"type":"uniqueField","classId":"diamonddog","field":"damageTakenMult","amount":0.02,"min":-0.5,"max":0.6}] },
      { k:'p5', p:'p4a', n:'Settled Guard', d:'The braced path stops costing effort to hold. Increases melee damage by 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'p6', p:'p4b', n:'Second Wind', d:'The reckless path finds a rhythm underneath the risk. Reduces damage taken by 2%.', e:[{"type":"uniqueField","classId":"diamonddog","field":"damageTakenMult","amount":-0.01,"min":-0.5,"max":0.6}] },
      { k:'p7', p:'p5', n:'Culmination: Technique', d:'Both disciplines, fully learned. Increases melee damage by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'q1', p:null, n:'Hardened Claw', d:'The claw quarries differently now, and something else pays for it. Permanently reduces critical hit chance by 1%. Nothing on this branch opens without it.', c:true, e:[{"type":"stat","classId":"diamonddog","stat":"critChance","amount":-0.01006}] },
      { k:'q2a', p:'q1', n:'Settled Claw', d:'A habit worn smooth. Increases luck by 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"luck","amount":0}] },
      { k:'q3a', p:'q2a', n:'Deepened Claw', d:'Second nature by now. Increases luck by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"luck","amount":0}] },
      { k:'q4a', p:'q3a', n:'Mastered Claw', d:'As far down this side as it goes. Increases luck by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"luck","amount":0}] },
      { k:'q2b', p:'q1', n:'Restless Claw', d:'A different angle on the same habit. Increases melee damage by 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'q3b', p:'q2b', n:'Practiced Claw', d:'Nothing left to learn on this side of it. Increases melee damage by a further 2%.', e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'q4b', p:'q3b', n:'Honed Claw', d:'The far end of this side. Increases melee damage by a further 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"meleeDamage","amount":0}] },
      { k:'q5', p:'q1', n:'Direct Claw', d:'Straight down the middle, no detour. Increases luck by 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"luck","amount":0}] },
      { k:'q6', p:'q5', n:'Unwavering Claw', d:'Held steady long enough to stop being effort. Increases luck by a further 1.5%.', e:[{"type":"stat","classId":"diamonddog","stat":"luck","amount":0}] },
      { k:'q7', p:'q4a', n:'Culmination: Claw', d:'Everything this branch was building toward. Increases luck by a final 2.5%.', cost:2, e:[{"type":"stat","classId":"diamonddog","stat":"luck","amount":0}] },
    ]);
  }

})();

for (const n of SKILL_TREE_CHARACTER_NODES_5D) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

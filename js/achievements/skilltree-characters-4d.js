'use strict';
// achievements/skilltree-characters-4d.js — Phase 10 Part B, skill-tree
// megaupdate Group 4 of 5: 250 NEW character skill nodes, 50 each for
// crystalpony, mule, alicorn, changeling and diamonddog. Pure data, appended
// onto the SKILL_TREE_NODES array / SKILL_TREE_NODES_BY_ID map defined in
// skilltree.js — no engine logic lives here.
//
// Branch-letter space reserved for this whole Phase 10 skill-tree pass:
// i, j, k, l (a-h are already used by skilltree-characters.js /
// -characters-2.js / -characters-3.js). Node id convention is unchanged:
// 'char_' + classId + '_' + key.
//
// Topology — each of the four new branches hangs straight off that
// character's own char_hub_<classId> and is a 12- or 13-node tree:
//
//   char_hub_<classId>
//     +- x1 -> x2 -+- x3a -> x4a -> x5a -> x6a -> x7 [-> x9]
//                  +- x3b -> x4b -> x5b -> x6b -> x8
//
// with x = i (13 nodes), j (12), k (13), l (12) = 50 per character. Every
// x3b is a `cursed:true` gate in the -characters-3.js sense: a node carrying
// ONLY a negative 'stat' effect, and the sole parent of the whole b-side
// chain beneath it, so that side is structurally unreachable without eating
// the debuff first.
//
// DESIGN MANDATE (from the user, Phase 10):
//  * most nodes must build on each character's UNIQUE mechanic, not be flat
//    stat sticks;
//  * anything genuinely powerful carries a real Soy-Milk-style tradeoff —
//    either a negative 'stat' effect bundled onto the SAME node, or the
//    cursed gate standing in front of it.
//
// The per-character mechanic hooks used here (all of them already-shadowed
// per-instance Player fields — see entities.js's constructor and
// skilltree.js's applySkillTreeUniqueFieldBonuses; a uniqueField targeting an
// UNshadowed field is a silent no-op, so nothing new is invented here):
//
//  crystalpony — `crystalVolleySpacing` (NEW this phase, seeded from
//    CRYSTAL_VOLLEY_SPACING_DEFAULT = 34 in combat-2.js): the px gap between
//    adjacent shard start points along her flank. Branch i COMPRESSES it,
//    which is the user's explicit request — a tight fan means all her shards
//    converge on essentially one point, turning the volley into a single
//    multi-damage stream. Floor is min:-24 (34 -> 10px, deliberately well
//    clear of 0, since playerCrystalVolleyAttack reads
//    `player.crystalVolleySpacing || CRYSTAL_VOLLEY_SPACING_DEFAULT` and a 0
//    would silently snap back to 34). max:+12 leaves room for a widening
//    node later. Also used: `chargeTime` (branch j, in BOTH directions — a
//    longer draw for more damage is the Soy Milk of that branch),
//    `canBuildTurrets` + `turretDamageMult`/`maxTurrets` (branch k, borrowed
//    Engineer mechanic re-flavored as planted crystal sentries — safe here
//    because turret damage is `player.rangedDamage * turretDamageMult` and
//    she is a ranged class), and `damageTakenMult` (branch l, her 8-heart
//    gemhide identity).
//    NOTE `crystalShardCount` is deliberately NOT touched: the existing
//    -characters-2.js c-branch already sums to its own max:3, and the
//    tightest-bounds rule in applySkillTreeUniqueFieldBonuses would make any
//    further node there a no-op (or clamp a negative one away).
//
//  mule — has NO unique flag of her own in data/core.js; her identity is the
//    pack-animal kit. Branch i BORROWS `shockwaveAttack` (rock-shattering
//    melee) + `rockCoinChance`, the prospector fantasy, on the precedent of
//    earth pony's borrowed shockwave node in -characters-2.js. Branch j is
//    the load itself: `damageTakenMult` UP in exchange for haul stats.
//    Branch k spends it back down. `startingPickup` is deliberately NOT used
//    anywhere in this file — that effect type carries no classId and
//    applySkillTreeStartingPickups applies it to EVERY class, so it could
//    never be a mule-specific node.
//
//  alicorn — branch i deepens the `innateFireRing` she was granted by
//    -characters-2.js (`fireRingRadius`, plus the rangedDamage/fireCooldown
//    that the ring's dps is literally computed from in
//    updateFireRingAttack). Branch j borrows `canBuildTurrets` as conjured
//    wards. Branch k is her 4-heart fragility as an explicit dial —
//    `damageTakenMult` up first for offense, then down again far deeper in.
//
//  changeling — branch i grants `summonsChangelings` (the Changeling Queen's
//    mechanic) and then has to BUILD it: her seeded changelingMinionDmg /
//    changelingMinionRadius are 0, so the flag alone does nothing until the
//    branch pays for coals and reach. Branch j is `fireZoneRootMult`, the
//    self-mire multiplier that is her single biggest live drawback (0.25 —
//    she moves at a quarter speed while holding her own pool down); it is
//    the only class the field is even reachable for, since
//    combat-1.js gates miredInOwnFire on `player.greenFireAttack`.
//    Branch k spends the last of the fireZoneRadius/fireZoneRange headroom.
//
//  diamonddog — no borrowed flag: every ranged-damage-driven mechanic
//    (fire ring, green fire, turrets) computes its damage from
//    player.rangedDamage, which is 0 for a melee class, so granting her one
//    would be a dead node. Her branches instead work the knobs her own
//    shockwave identity actually owns — `rockCoinChance`'s last headroom,
//    claw reach via rangeTiles, and `damageTakenMult` as the tunneller's
//    hide — plus rubble-flavored on-hit statuses.
//
// CAP DISCIPLINE — getSkillTreeStatBonus clamps each (classId, stat) sum to
// [-SKILL_TREE_STAT_CAP, +SKILL_TREE_STAT_CAP] (0.25), with
// SKILL_TREE_STAT_CAP_OVERRIDES.lifestealChance = 0.10. Every amount below
// was budgeted against the totals the a-h nodes ALREADY contribute for these
// five characters, so no (classId, stat) pair in the finished tree exceeds
// its ceiling. Two pre-existing saturations are respected by adding NOTHING
// to them here: crystalpony lifestealChance (already 0.15 from
// -characters-3.js) and mule lifestealChance (already 0.24 from
// -characters-2.js). See feature-research/phase10-metaprogression/
// audit-skilltree-group4.md for the full per-stat table.

const SKILL_TREE_CHARACTER_NODES_4D = [];

(function(){
  // key -> parent key; null parent means "hang off char_hub_<classId>"
  function build(classId, defs){
    for (const d of defs) {
      const node = {
        id: 'char_' + classId + '_' + d.k,
        parent: d.p ? ('char_' + classId + '_' + d.p) : ('char_hub_' + classId),
        cost: 1,
        name: d.n,
        desc: d.d,
      };
      const fx = d.e || [];
      if (fx.length === 1) node.effect = fx[0];
      else if (fx.length > 1) node.effects = fx;
      else node.effect = null;
      if (d.c) node.cursed = true;
      SKILL_TREE_CHARACTER_NODES_4D.push(node);
    }
  }

  // ==========================================================
  // CRYSTAL PONY — 50 nodes (i/j/k/l)
  // ==========================================================
  {
    const c = 'crystalpony';
    const st = (stat, amount) => ({ type:'stat', classId:c, stat, amount });
    // her volley spread: seed 34px, floored at 10px, ceiling 46px
    const sp = (amount) => ({ type:'uniqueField', classId:c, field:'crystalVolleySpacing', amount, min:-24, max:12 });
    const ch = (amount) => ({ type:'uniqueField', classId:c, field:'chargeTime', amount, min:-0.3, max:0.25 });
    const dt = (amount) => ({ type:'uniqueField', classId:c, field:'damageTakenMult', amount, min:-0.3, max:0.6 });
    const td = (amount) => ({ type:'uniqueField', classId:c, field:'turretDamageMult', amount, min:0, max:0.5 });
    const mt = (amount) => ({ type:'uniqueField', classId:c, field:'maxTurrets', amount, min:0, max:3 });
    build(c, [
      // --- branch i: Facet Convergence (compresses the volley spread) ---
      { k:'i1', p:null, n:'Narrowed Fan',
        d:'She draws the three firing points in toward her shoulder instead of splaying them across her flank. Tightens her volley spread by 4px, but the rushed alignment costs 3% ranged damage.',
        e:[sp(-4), st('rangedDamage', -0.03)] },
      { k:'i2', p:'i1', n:'Converging Rails',
        d:'The charge runs along shorter rails before it leaves her. Tightens her volley spread by a further 3px.',
        e:[sp(-3)] },
      { k:'i3a', p:'i2', n:'Tightened Muzzle',
        d:'The shards leave from almost the same inch of air. Tightens her volley spread by a further 3px.',
        e:[sp(-3)] },
      { k:'i4a', p:'i3a', n:'Shoulder-Tight Volley',
        d:'Holding the whole fan against her body means carrying it there too. Tightens her volley spread by a further 3px, but reduces movement speed by 3%.',
        e:[sp(-3), st('speed', -0.03)] },
      { k:'i5a', p:'i4a', n:'Single-Point Bloom',
        d:'Three shards, one origin, one wound. Tightens her volley spread by a further 1px.',
        e:[sp(-1)] },
      { k:'i6a', p:'i5a', n:'Needle Cluster',
        d:'A cluster that lands like a single spike. Tightens her volley spread by a further 2px and increases critical hit chance by 5%.',
        e:[sp(-2), st('critChance', 0.05)] },
      { k:'i3b', p:'i2', n:'Fractured Alignment', c:true,
        d:'Realigning the firing points cracks the lattice that held them true. Permanently reduces ranged damage by 4%. Nothing further down this side of the branch opens without it.',
        e:[st('rangedDamage', -0.04)] },
      { k:'i4b', p:'i3b', n:'Braced Convergence',
        d:'A shorter, straighter run to the muzzle. Tightens her volley spread by 2px and increases bolt speed by 5%.',
        e:[sp(-2), st('boltSpeed', 0.05)] },
      { k:'i5b', p:'i4b', n:'Prism Funnel',
        d:'The charge is funneled rather than fanned. Tightens her volley spread by a further 2px and increases critical hit chance by 5%.',
        e:[sp(-2), st('critChance', 0.05)] },
      { k:'i6b', p:'i5b', n:'Zero-Spread Discipline',
        d:'Standing rigid enough to keep the fan closed means standing still enough to be hit. Tightens her volley spread by a further 2px, but she takes 5% more damage.',
        e:[sp(-2), dt(0.05)] },
      { k:'i7', p:'i6a', n:'Lancepoint Volley',
        d:'What was a spread is now a lance. Tightens her volley spread by a further 1px and increases ranged damage by 6%.',
        e:[sp(-1), st('rangedDamage', 0.06)] },
      { k:'i8', p:'i6b', n:'Hairline Fan',
        d:'The gap between shards is barely a hairline now. Increases critical hit chance by 4%.',
        e:[st('critChance', 0.04)] },
      { k:'i9', p:'i7', n:'One Wound, Three Shards',
        d:'Every shard arrives in the same hole. She has to stand square to the target to hold it, and pays for that. Tightens her volley spread by a final 1px, but she takes 8% more damage.',
        e:[sp(-1), dt(0.08)] },

      // --- branch j: The Long Draw (charge time, both directions) ---
      { k:'j1', p:null, n:'Hairtrigger Prism',
        d:'The horn fires the instant the lattice closes. Reduces charge time by 0.03s, but the half-formed crystal loses 3% ranged damage.',
        e:[ch(-0.03), st('rangedDamage', -0.03)] },
      { k:'j2', p:'j1', n:'Deep Draw',
        d:'Holding the charge past the point it wants to fire packs the shard denser. Increases charge time by 0.08s, but increases ranged damage by 8%.',
        e:[ch(0.08), st('rangedDamage', 0.08)] },
      { k:'j3a', p:'j2', n:'Overdrawn Facet',
        d:'Further past the breaking point, for further reward. Increases charge time by a further 0.06s and increases ranged damage by 6%.',
        e:[ch(0.06), st('rangedDamage', 0.06)] },
      { k:'j4a', p:'j3a', n:'Patient Gem',
        d:'A shard that took its time comes out flawless. Increases critical hit chance by 6%.',
        e:[st('critChance', 0.06)] },
      { k:'j5a', p:'j4a', n:'Slow Bloom',
        d:'Every extra heartbeat of charge is another heartbeat of velocity. Increases charge time by a further 0.04s and increases bolt speed by 6%.',
        e:[ch(0.04), st('boltSpeed', 0.06)] },
      { k:'j6a', p:'j5a', n:'Held Light',
        d:'The horn is already refilling before the last shard lands. Reduces fire cooldown by 6%.',
        e:[st('fireCooldown', -0.06)] },
      { k:'j3b', p:'j2', n:'Clouded Core', c:true,
        d:'Rushing the lattice leaves a cloud through the middle of every shard. Permanently reduces ranged damage by 4%. The fast side of this branch demands it.',
        e:[st('rangedDamage', -0.04)] },
      { k:'j4b', p:'j3b', n:'Snap Facet',
        d:'It fires the moment it can, flaw and all. Reduces charge time by a further 0.03s.',
        e:[ch(-0.03)] },
      { k:'j5b', p:'j4b', n:'Quick Refraction',
        d:'Less dead air between volleys. Reduces fire cooldown by 5%.',
        e:[st('fireCooldown', -0.05)] },
      { k:'j6b', p:'j5b', n:'Impatient Prism',
        d:'She stopped waiting for the crystal to be ready. Reduces fire cooldown by a further 5%.',
        e:[st('fireCooldown', -0.05)] },
      { k:'j7', p:'j6a', n:'Culmination: The Long Draw',
        d:'The deepest reward for patience. Increases bolt speed by 5% and luck by 4%.',
        e:[st('boltSpeed', 0.05), st('luck', 0.04)] },
      { k:'j8', p:'j6b', n:'Culmination: The Short Draw',
        d:'The deepest reward for impatience. Reduces fire cooldown by a further 4%.',
        e:[st('fireCooldown', -0.04)] },

      // --- branch k: Crystal Sentries ---
      // Phase 11 un-bleed pass — used to borrow Engineer Pony's
      // `canBuildTurrets` flag outright. Now her own `canPlantSentries`,
      // driving the same generic placement/damage system (shared plumbing,
      // same as ranged/melee attack) under her own name.
      { k:'k1', p:null, n:'Shard Sentry',
        d:'She learns to leave a charged shard standing in the floor, firing on its own. Grants the ability to plant sentries — but splitting her charge between herself and them costs 5% ranged damage.',
        e:[{ type:'uniqueFlag', classId:c, field:'canPlantSentries', value:true }, st('rangedDamage', -0.05)] },
      { k:'k2', p:'k1', n:'Faceted Core',
        d:'A denser core in every planted shard. Increases sentry damage by 10% of her ranged damage.',
        e:[td(0.10)] },
      { k:'k3a', p:'k2', n:'Second Sentry',
        d:'She can hold a second shard standing at once. Raises her sentry limit by 1.',
        e:[mt(1)] },
      { k:'k4a', p:'k3a', n:'Sentry Lattice',
        d:'Planted shards resonate with each other. Increases sentry damage by a further 10% of her ranged damage.',
        e:[td(0.10)] },
      { k:'k5a', p:'k4a', n:'Prism Array',
        d:'A third standing shard, and a third of her attention gone with it. Raises her sentry limit by 1, but she takes 6% more damage.',
        e:[mt(1), dt(0.06)] },
      { k:'k6a', p:'k5a', n:'Sharpened Sentries',
        d:'Every planted shard is ground to a point. Increases sentry damage by a further 10% of her ranged damage.',
        e:[td(0.10)] },
      { k:'k3b', p:'k2', n:'Split Attention', c:true,
        d:'Half her horn is always somewhere else now. Permanently reduces ranged damage by 4%. The rest of this side of the sentry path is closed without it.',
        e:[st('rangedDamage', -0.04)] },
      { k:'k4b', p:'k3b', n:'Anchored Shards',
        d:'Driven deeper into the floor, they fire steadier. Increases sentry damage by 8% of her ranged damage.',
        e:[td(0.08)] },
      { k:'k5b', p:'k4b', n:'Quick Cairn',
        d:'She plants and moves without breaking stride, sweeping loose pickups along. Increases pickup magnet radius by 6%.',
        e:[st('magnetRadius', 0.06)] },
      { k:'k6b', p:'k5b', n:'Sentry Lens',
        d:'Each shard doubles as a lens for her own shots. Increases sentry damage by a further 7% of her ranged damage and range by 5%.',
        e:[td(0.07), st('rangeTiles', 0.05)] },
      { k:'k7', p:'k6a', n:'Crystal Battery',
        d:'She bleeds her own charge into the field to keep them burning. Increases sentry damage by a further 5% of her ranged damage, but she takes 6% more damage.',
        e:[td(0.05), dt(0.06)] },
      { k:'k8', p:'k6b', n:'Watchful Facets',
        d:'One more shard left standing behind her. Raises her sentry limit by 1.',
        e:[mt(1)] },
      { k:'k9', p:'k7', n:'Sentinel Grove',
        d:'A whole grove of standing crystal, and almost nothing left in her horn. Raises her sentry limit by 1, but reduces ranged damage by 3%.',
        e:[mt(1), st('rangedDamage', -0.03)] },

      // --- branch l: Gemhide (the toughest hide in the game, dialed up) ---
      { k:'l1', p:null, n:'Living Gemhide',
        d:'The facets grow thicker and heavier over her withers. Reduces damage taken by 8%, but reduces movement speed by 3%.',
        e:[dt(-0.08), st('speed', -0.03)] },
      { k:'l2', p:'l1', n:'Refracted Blow',
        d:'Some blows simply bend around her. Increases dodge chance by 3%.',
        e:[st('dodgeChance', 0.03)] },
      { k:'l3a', p:'l2', n:'Prism Scar',
        d:'Her cracks fill themselves in with fresh crystal. Increases on-kill heal chance by 4%.',
        e:[st('onKillHealChance', 0.04)] },
      { k:'l4a', p:'l3a', n:'Crystalline Regrowth',
        d:'Every kill feeds the regrowth. Increases on-kill heal chance by a further 4%.',
        e:[st('onKillHealChance', 0.04)] },
      { k:'l5a', p:'l4a', n:'Cold Facets',
        d:'Her hide runs cold enough to lock a limb that touches it. Increases freeze chance by 6%.',
        e:[st('freezeChance', 0.06)] },
      { k:'l6a', p:'l5a', n:'Glacial Shard',
        d:'The chill carries down the shards themselves. Increases freeze chance by a further 6%.',
        e:[st('freezeChance', 0.06)] },
      { k:'l3b', p:'l2', n:'Hollowed Core', c:true,
        d:'Thicker plate, hollower middle — the shards leave her slower for it. Permanently reduces bolt speed by 4%. The deeper armor on this side demands it.',
        e:[st('boltSpeed', -0.04)] },
      { k:'l4b', p:'l3b', n:'Deflecting Angle',
        d:'She learns to meet every blow on a facet edge. Increases dodge chance by 3%.',
        e:[st('dodgeChance', 0.03)] },
      { k:'l5b', p:'l4b', n:'Weight of Gems',
        d:'More stone than pony now. Reduces damage taken by a further 6%, but reduces movement speed by 3%.',
        e:[dt(-0.06), st('speed', -0.03)] },
      { k:'l6b', p:'l5b', n:'Sunk Foundations',
        d:'What she stands on she can feel through her hooves — including the loose coin in it. Increases pickup magnet radius by 6% and luck by 4%.',
        e:[st('magnetRadius', 0.06), st('luck', 0.04)] },
      { k:'l7', p:'l6a', n:'Heart of the Crystal',
        d:'The core of her is solid gem. Reduces damage taken by a further 5% and increases range by 5%.',
        e:[dt(-0.05), st('rangeTiles', 0.05)] },
      { k:'l8', p:'l6b', n:'Unbroken Lattice',
        d:'Not one fault line left anywhere in her. Increases luck by 4% and pickup magnet radius by a further 6%.',
        e:[st('luck', 0.04), st('magnetRadius', 0.06)] },
    ]);
  }

  // ==========================================================
  // MULE — 50 nodes (i/j/k/l)
  // ==========================================================
  {
    const c = 'mule';
    const st = (stat, amount) => ({ type:'stat', classId:c, stat, amount });
    // Phase 11 un-bleed pass — this whole sub-branch used to borrow Diamond
    // Dog's `shockwaveAttack` flag ("kicking rock the way a diamond dog
    // claws it") plus a chain of `rockCoinChance` payouts riding on it.
    // Redefining the shared `rc` helper to grant `luck` instead fixes every
    // call site below in one place, and fits a prospector's actual "gets
    // luckier about what turns up" identity better than a mining flag ever did.
    const rc = (amount) => ({ type:'stat', classId:c, stat:'luck', amount });
    const dt = (amount) => ({ type:'uniqueField', classId:c, field:'damageTakenMult', amount, min:-0.25, max:0.6 });
    build(c, [
      // --- branch i: Prospector's Pick ---
      { k:'i1', p:null, n:'Pick-Hafted Kick',
        d:'She has learned exactly where a kick lands hardest. Increases melee damage by 5%, but the heavier, slower motion increases melee cooldown by 5%.',
        e:[st('meleeDamage', 0.05), st('meleeCooldown', 0.05)] },
      { k:'i2', p:'i1', n:'Coin in the Rubble',
        d:'She knows to look before she moves on. Increases luck by 3%.',
        e:[rc(0.03)] },
      { k:'i3a', p:'i2', n:'Ore Eye',
        d:'She picks which rock to kick. Increases her luck by a further 3%.',
        e:[rc(0.03)] },
      { k:'i4a', p:'i3a', n:'Split the Seam',
        d:'Hitting the fault line instead of the face. Increases her luck by a further 2% and melee damage by 4%.',
        e:[rc(0.02), st('meleeDamage', 0.04)] },
      { k:'i5a', p:'i4a', n:'Rubble Runner',
        d:'She works the debris field as she goes. Increases pickup magnet radius by 4%.',
        e:[st('magnetRadius', 0.04)] },
      { k:'i6a', p:'i5a', n:'Quarry Wages',
        d:'A day of breaking stone should pay like one. Increases her luck by a further 2% and melee damage by 3%.',
        e:[rc(0.02), st('meleeDamage', 0.03)] },
      { k:'i3b', p:'i2', n:'Blunted Iron', c:true,
        d:'Shoes meant for road work are not meant for stone, and it shows. Permanently reduces melee damage by 4%. Everything deeper on this side of the quarry is closed without it.',
        e:[st('meleeDamage', -0.04)] },
      { k:'i4b', p:'i3b', n:'Shatterstep',
        d:'She breaks rock on the way past rather than stopping for it. Increases her luck by a further 3%.',
        e:[rc(0.03)] },
      { k:'i5b', p:'i4b', n:'Dust and Dividends',
        d:'Even the dust is worth sifting. Increases luck by 4%.',
        e:[st('luck', 0.04)] },
      { k:'i6b', p:'i5b', n:'Deep Seam',
        d:'The good stone is always further in. Increases her luck by a further 2%.',
        e:[rc(0.02)] },
      { k:'i7', p:'i6a', n:"Prospector's Payday",
        d:'Nothing she breaks goes unsearched. Increases her luck by a further 2% and pickup magnet radius by 4%.',
        e:[rc(0.02), st('magnetRadius', 0.04)] },
      { k:'i8', p:'i6b', n:'Stone-Splitting Hoof',
        d:'A kick calibrated on granite hits everything else harder too. Increases melee damage by 5%.',
        e:[st('meleeDamage', 0.05)] },
      { k:'i9', p:'i7', n:'The Whole Mountain',
        d:'She will take the mountain apart one kick at a time, and it will take just as long. Increases her luck by a final 3%, but increases melee cooldown by 4%.',
        e:[rc(0.03), st('meleeCooldown', 0.04)] },

      // --- branch j: Overloaded Packs (haul more, take more) ---
      { k:'j1', p:null, n:'Overloaded Panniers',
        d:'She takes on a load no pony would carry — and every hit lands on cargo, not hide. She takes 10% more damage, but gains 5% luck.',
        e:[dt(0.10), st('luck', 0.05)] },
      { k:'j2', p:'j1', n:'Second Saddlebag',
        d:'One more bag, one more thing to catch on a spear. She takes 6% more damage, but gains 4% pickup magnet radius.',
        e:[dt(0.06), st('magnetRadius', 0.04)] },
      { k:'j3a', p:'j2', n:'Everything but the Anvil',
        d:'If it fits, it comes. Reduces movement speed by 5%, but increases melee damage by 4% from the sheer momentum of the load.',
        e:[st('speed', -0.05), st('meleeDamage', 0.04)] },
      { k:'j4a', p:'j3a', n:'Rattling Load',
        d:'Nothing in the packs sits still, and neither does her aim. Reduces movement speed by a further 4%, but increases critical hit chance by 3%.',
        e:[st('speed', -0.04), st('critChance', 0.03)] },
      { k:'j5a', p:'j4a', n:'Packed to the Brim',
        d:'She hauls a little of everything, so a little of everything comes to her. Increases pickup magnet radius by a further 4%.',
        e:[st('magnetRadius', 0.04)] },
      { k:'j6a', p:'j5a', n:'Cinched Straps',
        d:'Properly lashed down, the load stops flapping loose. Reduces damage taken by 6%.',
        e:[dt(-0.06)] },
      { k:'j3b', p:'j2', n:'Dragging Hooves', c:true,
        d:'Weight this far past sensible tells in every stride. Permanently reduces movement speed by 4%. The rest of the load-bearing path is closed without it.',
        e:[st('speed', -0.04)] },
      { k:'j4b', p:'j3b', n:'Counterweight',
        d:'She learns to swing the pack into the blow. Increases melee damage by 5%.',
        e:[st('meleeDamage', 0.05)] },
      { k:'j5b', p:'j4b', n:'Ballast',
        d:'Low, heavy and hard to knock over. Reduces damage taken by 5% and movement speed by a further 2%.',
        e:[dt(-0.05), st('speed', -0.02)] },
      { k:'j6b', p:'j5b', n:"Hauler's Grip",
        d:'A longer reach for hooking things off the ground mid-stride. Increases range by 4%.',
        e:[st('rangeTiles', 0.04)] },
      { k:'j7', p:'j6a', n:'Mule Train',
        d:'She moves like she has three more of herself roped behind her. Increases pickup magnet radius by a further 4%.',
        e:[st('magnetRadius', 0.04)] },
      { k:'j8', p:'j6b', n:'Everything Has a Price',
        d:'She will carry it. She just will not carry it safely. Increases range by a further 4%, but she takes 5% more damage.',
        e:[st('rangeTiles', 0.04), dt(0.05)] },

      // --- branch k: Stubborn Bulwark (spends damageTakenMult back down) ---
      { k:'k1', p:null, n:"Won't Be Moved",
        d:'She plants all four and simply refuses. Reduces damage taken by 10%, but she stops watching anything more than a hoof away — reduces range by 4%.',
        e:[dt(-0.10), st('rangeTiles', -0.04)] },
      { k:'k2', p:'k1', n:'Braced Stance',
        d:'A stance built for absorbing, not avoiding — which turns out to help with avoiding too. Increases dodge chance by 5%.',
        e:[st('dodgeChance', 0.05)] },
      { k:'k3a', p:'k2', n:'Hoof in the Dirt',
        d:'The kick that follows a braced stance rattles skulls. Increases stun chance by 5%.',
        e:[st('stunChance', 0.05)] },
      { k:'k4a', p:'k3a', n:'Bone-Rattling Kick',
        d:'Everything she connects with stops thinking for a moment. Increases stun chance by a further 5%.',
        e:[st('stunChance', 0.05)] },
      { k:'k5a', p:'k4a', n:'Head Down, Ears Back',
        d:'There is a specific look a mule gets, and things flee from it. Increases fear chance by 5%.',
        e:[st('fearChance', 0.05)] },
      { k:'k6a', p:'k5a', n:'Immovable Object',
        d:'She has decided where she is standing. Reduces damage taken by a further 6%.',
        e:[dt(-0.06)] },
      { k:'k3b', p:'k2', n:'Sore Withers', c:true,
        d:'A lifetime of taking the hit instead of dodging it comes due. Permanently reduces melee damage by 4%. The rest of the bulwark path demands it.',
        e:[st('meleeDamage', -0.04)] },
      { k:'k4b', p:'k3b', n:'Thick Hide',
        d:'Callus over callus over callus. Reduces damage taken by a further 6%.',
        e:[dt(-0.06)] },
      { k:'k5b', p:'k4b', n:'Sidestep the Kick',
        d:'Stubborn is not the same as slow-witted. Increases dodge chance by a further 5%.',
        e:[st('dodgeChance', 0.05)] },
      { k:'k6b', p:'k5b', n:'Mule-Headed',
        d:'Nothing about her reads as prey. Increases fear chance by a further 5%.',
        e:[st('fearChance', 0.05)] },
      { k:'k7', p:'k6a', n:'Stone in the Road',
        d:'Everything that hits her comes off worse. Increases stun chance by a further 5% and reduces damage taken by a further 5%.',
        e:[st('stunChance', 0.05), dt(-0.05)] },
      { k:'k8', p:'k6b', n:'Kicks Back Harder',
        d:'Whatever she connects with stays soft where she hit it. Increases vulnerable chance by 5%.',
        e:[st('vulnerableChance', 0.05)] },
      { k:'k9', p:'k7', n:'The Last Mule Standing',
        d:'She outlasts. That is the whole trick, and it costs her the last of her pace. Reduces damage taken by a further 8%, but reduces movement speed by 3%.',
        e:[dt(-0.08), st('speed', -0.03)] },

      // --- branch l: Beast of Burden (the plain, stubborn stat spine) ---
      { k:'l1', p:null, n:'Plodding Endurance',
        d:'She keeps going long after the reason to has gone. Increases on-kill heal chance by 5%.',
        e:[st('onKillHealChance', 0.05)] },
      { k:'l2', p:'l1', n:'Second Wind of a Mule',
        d:'There is always one more mile in her. Increases on-kill heal chance by a further 5%.',
        e:[st('onKillHealChance', 0.05)] },
      { k:'l3a', p:'l2', n:'Heavy Hoof',
        d:'A hoof built for hauling lands like one. Increases melee damage by 4%.',
        e:[st('meleeDamage', 0.04)] },
      { k:'l4a', p:'l3a', n:'Iron Shoes',
        d:'Shod for the worst road there is. Increases melee damage by a further 3%.',
        e:[st('meleeDamage', 0.03)] },
      { k:'l5a', p:'l4a', n:'Long Haul',
        d:'The rhythm never breaks, so it never has to restart. Reduces melee cooldown by 4%.',
        e:[st('meleeCooldown', -0.04)] },
      { k:'l6a', p:'l5a', n:'Steady Rhythm',
        d:'Every kick lands where the last one did. Increases critical hit chance by 5%.',
        e:[st('critChance', 0.05)] },
      { k:'l3b', p:'l2', n:'Worn Frog', c:true,
        d:'The soft of the hoof gives out before the hard of it does. Permanently reduces melee damage by 3%. The rest of this side of the road is closed without it.',
        e:[st('meleeDamage', -0.03)] },
      { k:'l4b', p:'l3b', n:'Set Jaw',
        d:'She commits to the blow completely, and it shows in what it leaves behind. Increases vulnerable chance by 5%.',
        e:[st('vulnerableChance', 0.05)] },
      { k:'l5b', p:'l4b', n:'Patient Aim',
        d:'She waits for the opening rather than making one. Increases critical hit chance by 5%.',
        e:[st('critChance', 0.05)] },
      { k:'l6b', p:'l5b', n:'Old Road Instinct',
        d:'Thirty years of the same roads teaches where to put a hoof. Increases critical hit chance by a further 4%.',
        e:[st('critChance', 0.04)] },
      { k:'l7', p:'l6a', n:'The Mule Abides',
        d:'Whatever it was, she outlived it. Increases on-kill heal chance by a further 5% and melee damage by 3%.',
        e:[st('onKillHealChance', 0.05), st('meleeDamage', 0.03)] },
      { k:'l8', p:'l6b', n:'Never Sets Down the Load',
        d:'Not once, not for anything. Increases vulnerable chance by a further 5%.',
        e:[st('vulnerableChance', 0.05)] },
    ]);
  }

  // ==========================================================
  // ALICORN — 50 nodes (i/j/k/l)
  // ==========================================================
  {
    const c = 'alicorn';
    const st = (stat, amount) => ({ type:'stat', classId:c, stat, amount });
    const fr = (amount) => ({ type:'uniqueField', classId:c, field:'fireRingRadius', amount, min:0, max:30 });
    const dt = (amount) => ({ type:'uniqueField', classId:c, field:'damageTakenMult', amount, min:-0.25, max:0.6 });
    const td = (amount) => ({ type:'uniqueField', classId:c, field:'turretDamageMult', amount, min:0, max:0.5 });
    const mt = (amount) => ({ type:'uniqueField', classId:c, field:'maxTurrets', amount, min:0, max:3 });
    build(c, [
      // --- branch i: Corona (deepens her borrowed fire ring) ---
      { k:'i1', p:null, n:'Wider Corona',
        d:'The ring of light around her pushes further out. Increases her fire ring radius by 4px, but carrying it that wide reduces movement speed by 3%.',
        e:[fr(4), st('speed', -0.03)] },
      { k:'i2', p:'i1', n:'Sunfire Halo',
        d:'Not light any more so much as heat. Increases her fire ring radius by a further 3px.',
        e:[fr(3)] },
      { k:'i3a', p:'i2', n:'Radiant Overspill',
        d:'More of it escapes her than she can hold in. Increases her fire ring radius by a further 3px.',
        e:[fr(3)] },
      { k:'i4a', p:'i3a', n:'Burning Aureole',
        d:'The ring burns as hot as her horn does — because it is the same power. Increases ranged damage by 5%.',
        e:[st('rangedDamage', 0.05)] },
      { k:'i5a', p:'i4a', n:'Steady Flame',
        d:'The ring ticks faster the faster she casts. Reduces fire cooldown by 3%.',
        e:[st('fireCooldown', -0.03)] },
      { k:'i6a', p:'i5a', n:'Coronal Mass',
        d:'She stops holding any of it back, and stops shielding herself with it too. Increases her fire ring radius by a further 2px, but she takes 6% more damage.',
        e:[fr(2), dt(0.06)] },
      { k:'i3b', p:'i2', n:'Dimmed Halo', c:true,
        d:'Spreading the light thin is still spreading it thin. Permanently reduces ranged damage by 4%. The rest of this side of the corona is closed without it.',
        e:[st('rangedDamage', -0.04)] },
      { k:'i4b', p:'i3b', n:'Focused Corona',
        d:'She pulls the burn back toward her horn where it does the most. Increases ranged damage by 5%.',
        e:[st('rangedDamage', 0.05)] },
      { k:'i5b', p:'i4b', n:'Even Burn',
        d:'No flicker between pulses. Reduces fire cooldown by 2%.',
        e:[st('fireCooldown', -0.02)] },
      { k:'i6b', p:'i5b', n:'Halo Bloom',
        d:'One last push outward. Increases her fire ring radius by a further 2px.',
        e:[fr(2)] },
      { k:'i7', p:'i6a', n:'Solar Crown',
        d:'The crown is not metal. Increases ranged damage by 4% and her fire ring radius by a final 2px.',
        e:[st('rangedDamage', 0.04), fr(2)] },
      { k:'i8', p:'i6b', n:'Lingering Light',
        d:'Everything she has already burned stays lit a moment longer. Increases critical hit chance by 5%.',
        e:[st('critChance', 0.05)] },
      { k:'i9', p:'i7', n:'Noon at Midnight',
        d:'She burns like a small sun and is exactly as fragile as one is not. Reduces fire cooldown by a further 2%, but she takes 8% more damage.',
        e:[st('fireCooldown', -0.02), dt(0.08)] },

      // --- branch j: Conjured Wards ---
      // Phase 11 un-bleed pass — used to borrow Engineer Pony's
      // `canBuildTurrets` flag outright. Now her own `canConjureWards`.
      { k:'j1', p:null, n:'Conjured Sentry',
        d:'She learns to leave a fragment of her own magic standing and firing. Grants the ability to plant wards — but the horn she anchors them with loses 5% ranged damage.',
        e:[{ type:'uniqueFlag', classId:c, field:'canConjureWards', value:true }, st('rangedDamage', -0.05)] },
      { k:'j2', p:'j1', n:'Sharpened Wards',
        d:'The bolts they throw come to a proper point. Increases ward damage by 10% of her ranged damage.',
        e:[td(0.10)] },
      { k:'j3a', p:'j2', n:'Twin Wards',
        d:'Two anchors instead of one. Raises her ward limit by 1.',
        e:[mt(1)] },
      { k:'j4a', p:'j3a', n:'Sunlit Sentries',
        d:'Her wards catch the same light her ring does. Increases ward damage by a further 10% of her ranged damage.',
        e:[td(0.10)] },
      { k:'j5a', p:'j4a', n:'Third Ward',
        d:'A third fragment of her, standing somewhere else. Raises her ward limit by 1.',
        e:[mt(1)] },
      { k:'j6a', p:'j5a', n:'Lattice of Wards',
        d:'They feed each other — off her. Increases ward damage by a further 10% of her ranged damage, but she takes 5% more damage.',
        e:[td(0.10), dt(0.05)] },
      { k:'j3b', p:'j2', n:'Divided Focus', c:true,
        d:'A mind split four ways is a mind at quarter strength. Permanently reduces ranged damage by 4%. The rest of this side of the ward path demands it.',
        e:[st('rangedDamage', -0.04)] },
      { k:'j4b', p:'j3b', n:'Anchored Sigils',
        d:'Sigils cut into the floor rather than floated above it. Increases ward damage by 10% of her ranged damage.',
        e:[td(0.10)] },
      { k:'j5b', p:'j4b', n:'Ward Reach',
        d:'She sights through her wards as easily as her own eyes. Increases range by 4%.',
        e:[st('rangeTiles', 0.04)] },
      { k:'j6b', p:'j5b', n:'Fourth Ward',
        d:'One more anchor than any unicorn should manage. Raises her ward limit by 1.',
        e:[mt(1)] },
      { k:'j7', p:'j6a', n:'Sanctum of Wards',
        d:'A ring of her own making, and very little left in the middle of it. Raises her ward limit by 1, but reduces ranged damage by 3%.',
        e:[mt(1), st('rangedDamage', -0.03)] },
      { k:'j8', p:'j6b', n:'Brilliant Wards',
        d:'Each one burns as bright as she can make it. Increases ward damage by a final 10% of her ranged damage.',
        e:[td(0.10)] },

      // --- branch k: Fragile Divinity (4 hearts, as a dial) ---
      { k:'k1', p:null, n:'Gossamer Frame',
        d:'She sheds everything that was not magic. She takes 12% more damage, but gains 6% ranged damage.',
        e:[dt(0.12), st('rangedDamage', 0.06)] },
      { k:'k2', p:'k1', n:'Thin Veil',
        d:'Barely anything between her and the world, in either direction. She takes 8% more damage, but gains 5% critical hit chance.',
        e:[dt(0.08), st('critChance', 0.05)] },
      { k:'k3a', p:'k2', n:'Featherbone',
        d:'Hollow the whole way through, like a bird. Increases movement speed by 5%.',
        e:[st('speed', 0.05)] },
      { k:'k4a', p:'k3a', n:'Aetheric Grace',
        d:'She is halfway to not being there. Increases dodge chance by 6%.',
        e:[st('dodgeChance', 0.06)] },
      { k:'k5a', p:'k4a', n:'Untouchable',
        d:'Things pass through where she was. Increases dodge chance by a further 6%.',
        e:[st('dodgeChance', 0.06)] },
      { k:'k6a', p:'k5a', n:'Warded Frame',
        d:'She finally spends some of her power on herself. Reduces damage taken by 10%.',
        e:[dt(-0.10)] },
      { k:'k3b', p:'k2', n:'Hollow Reserve', c:true,
        d:'There is a floor to how much of yourself you can burn, and she is standing on it. Permanently reduces movement speed by 4%. The rest of this side of the path demands it.',
        e:[st('speed', -0.04)] },
      { k:'k4b', p:'k3b', n:'Divine Attrition',
        d:'She takes a little back from everything she touches. Increases lifesteal chance by 4%.',
        e:[st('lifestealChance', 0.04)] },
      { k:'k5b', p:'k4b', n:'Blood of the Sun',
        d:'What she drains burns going down. Increases lifesteal chance by a further 4%.',
        e:[st('lifestealChance', 0.04)] },
      { k:'k6b', p:'k5b', n:'Charmed Presence',
        d:'Not everything that meets an alicorn wants to fight one. Increases charm chance by 5%.',
        e:[st('charmChance', 0.05)] },
      { k:'k7', p:'k6a', n:'Aegis of the Alicorn',
        d:'A shield woven of the same stuff as her bolts, and just as expensive. Reduces damage taken by a further 10%, but reduces movement speed by 3%.',
        e:[dt(-0.10), st('speed', -0.03)] },
      { k:'k8', p:'k6b', n:'Regal Command',
        d:'She simply tells them to stop. Increases charm chance by a further 5%.',
        e:[st('charmChance', 0.05)] },
      { k:'k9', p:'k7', n:'Immortal Frame',
        d:'Nothing gets through any more. Nothing much gets out either. Reduces damage taken by a further 8%, but reduces ranged damage by 4%.',
        e:[dt(-0.08), st('rangedDamage', -0.04)] },

      // --- branch l: Starlit Horn (the horn itself) ---
      { k:'l1', p:null, n:'Starlit Horn',
        d:'A cleaner light down the length of it. Increases ranged damage by 5%.',
        e:[st('rangedDamage', 0.05)] },
      { k:'l2', p:'l1', n:'Comet Bolt',
        d:'Her bolts leave a tail. Increases bolt speed by 5%.',
        e:[st('boltSpeed', 0.05)] },
      { k:'l3a', p:'l2', n:'Long Sight',
        d:'Wings mean she is used to seeing further than she can reach. Increases range by 4%.',
        e:[st('rangeTiles', 0.04)] },
      { k:'l4a', p:'l3a', n:'Meteor Trail',
        d:'Fast enough that the room lights up behind it. Increases bolt speed by a further 5%.',
        e:[st('boltSpeed', 0.05)] },
      { k:'l5a', p:'l4a', n:'Guiding Star',
        d:'She has always known which way to go. Increases luck by 5%.',
        e:[st('luck', 0.05)] },
      { k:'l6a', p:'l5a', n:"Fortune's Favor",
        d:'It is hard to argue that the universe is not on her side. Increases luck by a further 5%.',
        e:[st('luck', 0.05)] },
      { k:'l3b', p:'l2', n:'Waning Moon', c:true,
        d:'Half of her power answers to something that is not always in the sky. Permanently reduces critical hit chance by 3%. The rest of this side of the horn is closed without it.',
        e:[st('critChance', -0.03)] },
      { k:'l4b', p:'l3b', n:'Astral Pull',
        d:'Loose things drift toward her the way they drift toward anything with real mass. Increases pickup magnet radius by 4%.',
        e:[st('magnetRadius', 0.04)] },
      { k:'l5b', p:'l4b', n:'Nightbringer',
        d:'The other half of the sky, and the other half of the aim. Increases critical hit chance by 5%.',
        e:[st('critChance', 0.05)] },
      { k:'l6b', p:'l5b', n:'Twin Legacy',
        d:'Sun and moon in one frame, which is what an alicorn is for. Increases critical hit chance by a further 5%.',
        e:[st('critChance', 0.05)] },
      { k:'l7', p:'l6a', n:'Crown of Stars',
        d:'The deepest thing on the horn path. Increases luck by a further 5% and ranged damage by 5%.',
        e:[st('luck', 0.05), st('rangedDamage', 0.05)] },
      { k:'l8', p:'l6b', n:"Harmony's Edge",
        d:'Everything lining up at once. Increases critical hit chance by a further 4% and pickup magnet radius by a further 4%.',
        e:[st('critChance', 0.04), st('magnetRadius', 0.04)] },
    ]);
  }

  // ==========================================================
  // CHANGELING — 50 nodes (i/j/k/l)
  // ==========================================================
  {
    const c = 'changeling';
    const st = (stat, amount) => ({ type:'stat', classId:c, stat, amount });
    const md = (amount) => ({ type:'uniqueField', classId:c, field:'changelingMinionDmg', amount, min:0, max:0.6 });
    const mr = (amount) => ({ type:'uniqueField', classId:c, field:'changelingMinionRadius', amount, min:0, max:28 });
    const mn = (amount) => ({ type:'uniqueField', classId:c, field:'maxChangelingMinions', amount, min:0, max:2 });
    const sc = (amount) => ({ type:'uniqueField', classId:c, field:'changelingSummonCooldown', amount, min:-4, max:0 });
    const rm = (amount) => ({ type:'uniqueField', classId:c, field:'fireZoneRootMult', amount, min:0, max:0.6 });
    const fz = (amount) => ({ type:'uniqueField', classId:c, field:'fireZoneRadius', amount, min:0, max:30 });
    const fg = (amount) => ({ type:'uniqueField', classId:c, field:'fireZoneRange', amount, min:0, max:20 });
    const dt = (amount) => ({ type:'uniqueField', classId:c, field:'damageTakenMult', amount, min:-0.25, max:0.6 });
    build(c, [
      // --- branch i: Hive Mother (builds her OWN drone summon) ---
      // Phase 11 un-bleed pass — i1 used to grant the Queen's exact
      // `summonsChangelings` flag. Now her own `summonsHive`, driving the
      // same generic orbiting-helper system under her own name.
      { k:'i1', p:null, n:'Call the Hive',
        d:'She stops working alone. Drones drift in to burn beside her — though they arrive carrying nothing yet, and splitting her essence to call them costs 5% ranged damage.',
        e:[{ type:'uniqueFlag', classId:c, field:'summonsHive', value:true }, st('rangedDamage', -0.05)] },
      { k:'i2', p:'i1', n:'Coal for the Brood',
        d:'Each drone is given a coal of her own green fire. Grants her minions 0.20 damage per second.',
        e:[md(0.20)] },
      { k:'i3a', p:'i2', n:'Wider Brood Flame',
        d:'Their little pools spread further. Increases minion burn radius by 8px.',
        e:[mr(8)] },
      { k:'i4a', p:'i3a', n:'Hotter Coals',
        d:'She feeds them better. Increases minion damage by a further 0.15 per second.',
        e:[md(0.15)] },
      { k:'i5a', p:'i4a', n:'Broader Burn',
        d:'Nothing gets past a drone now. Increases minion burn radius by a further 8px.',
        e:[mr(8)] },
      { k:'i6a', p:'i5a', n:'Third Drone',
        d:'One more of her, drifting. Raises her minion limit by 1.',
        e:[mn(1)] },
      { k:'i3b', p:'i2', n:'Split Essence', c:true,
        d:'Every drone is a piece of her that is not in her any more. Permanently reduces ranged damage by 4%. The rest of the hive path is closed without it.',
        e:[st('rangedDamage', -0.04)] },
      { k:'i4b', p:'i3b', n:'Faster Summoning',
        d:'She calls before the last one has even settled. Reduces her summon interval by 1.5s.',
        e:[sc(-1.5)] },
      { k:'i5b', p:'i4b', n:'Quicker Hatch',
        d:'They come up already burning. Reduces her summon interval by a further 1.5s.',
        e:[sc(-1.5)] },
      { k:'i6b', p:'i5b', n:'Fourth Drone',
        d:'A proper little swarm. Raises her minion limit by 1.',
        e:[mn(1)] },
      { k:'i7', p:'i6a', n:'Brood Fed on Love',
        d:'What she drains, they eat. Increases minion damage by a further 0.15 per second and minion burn radius by 6px.',
        e:[md(0.15), mr(6)] },
      { k:'i8', p:'i6b', n:'Endless Swarm',
        d:'There is always another one coming, and always a little less of her holding together. Reduces her summon interval by a further 1.5s, but she takes 6% more damage.',
        e:[sc(-1.5), dt(0.06)] },
      { k:'i9', p:'i7', n:'Hive Mother',
        d:'She is the hive now, not a member of it. Increases minion damage by a final 0.10 per second, but reduces ranged damage by a further 4%.',
        e:[md(0.10), st('rangedDamage', -0.04)] },

      // --- branch j: Unmired (fixes her worst live drawback) ---
      { k:'j1', p:null, n:'Loosened Mire',
        d:'Her own pool stops holding her quite so hard. Reduces the self-slow from standing in her own fire by 10 points of speed, but the divided attention costs 3% ranged damage.',
        e:[rm(0.10), st('rangedDamage', -0.03)] },
      { k:'j2', p:'j1', n:'Light on the Chitin',
        d:'She learns to skate the surface of it. Reduces the self-slow by a further 10 points.',
        e:[rm(0.10)] },
      { k:'j3a', p:'j2', n:'Hover Above the Pool',
        d:'Wings do most of the work now. Reduces the self-slow by a further 10 points.',
        e:[rm(0.10)] },
      { k:'j4a', p:'j3a', n:'Wingbeat Lift',
        d:'Half a wingbeat between her and her own fire. Increases movement speed by 5%.',
        e:[st('speed', 0.05)] },
      { k:'j5a', p:'j4a', n:'Untethered',
        d:'The pool no longer has any hold on her at all. Reduces the self-slow by a further 10 points.',
        e:[rm(0.10)] },
      { k:'j6a', p:'j5a', n:'Free of Her Own Fire',
        d:'She walks through it as if it were somebody else\'s. Reduces the self-slow by a further 10 points, but she takes 6% more damage.',
        e:[rm(0.10), dt(0.06)] },
      { k:'j3b', p:'j2', n:'Clinging Flame', c:true,
        d:'Something of the pool always comes with her. Permanently reduces movement speed by 4%. The rest of this side of the path is closed without it.',
        e:[st('speed', -0.04)] },
      { k:'j4b', p:'j3b', n:'Skimming the Coals',
        d:'Only the tips of her hooves ever touch it. Reduces the self-slow by a further 10 points.',
        e:[rm(0.10)] },
      { k:'j5b', p:'j4b', n:'Sure-Footed Drone',
        d:'Footing she does not have to think about is footing she can dodge on. Increases dodge chance by 5%.',
        e:[st('dodgeChance', 0.05)] },
      { k:'j6b', p:'j5b', n:'Ash Step',
        d:'She moves best over what she has already burned. Increases movement speed by 4%.',
        e:[st('speed', 0.04)] },
      { k:'j7', p:'j6a', n:'Never Stands Still',
        d:'Plant, drift, plant again. Reduces fire cooldown by 5%.',
        e:[st('fireCooldown', -0.05)] },
      { k:'j8', p:'j6b', n:'Weightless Predator',
        d:'Nothing about her touches the ground for long. Increases dodge chance by a further 5%.',
        e:[st('dodgeChance', 0.05)] },

      // --- branch k: The Deeper Pool (green fire, all the way up) ---
      { k:'k1', p:null, n:'Wider Pool',
        d:'The last of the spread her carapace can push out. Increases her fire pool radius by 3px.',
        e:[fz(3)] },
      { k:'k2', p:'k1', n:'Longer Reach',
        d:'She can plant it further ahead of herself. Increases her fire pool reach by 2px.',
        e:[fg(2)] },
      { k:'k3a', p:'k2', n:'Hungry Flame',
        d:'The fire feeds her back. Increases on-kill heal chance by 7%.',
        e:[st('onKillHealChance', 0.07)] },
      { k:'k4a', p:'k3a', n:'Devouring Green',
        d:'She eats better than any changeling has a right to. Increases on-kill heal chance by a further 7%.',
        e:[st('onKillHealChance', 0.07)] },
      { k:'k5a', p:'k4a', n:'Deeper Pool',
        d:'It sinks into the floor as much as it spreads across it. Increases her fire pool radius by a further 3px.',
        e:[fz(3)] },
      { k:'k6a', p:'k5a', n:'Farther Cast',
        d:'Planted almost out of her own sight. Increases her fire pool reach by a further 2px.',
        e:[fg(2)] },
      { k:'k3b', p:'k2', n:'Guttering Flame', c:true,
        d:'Spread this wide, the green burns thinner everywhere. Permanently reduces ranged damage by 4%. The rest of this side of the pool is closed without it.',
        e:[st('rangedDamage', -0.04)] },
      { k:'k4b', p:'k3b', n:'Feeding Frenzy',
        d:'Anything that dies in it is hers. Increases on-kill heal chance by 6%.',
        e:[st('onKillHealChance', 0.06)] },
      { k:'k5b', p:'k4b', n:'Venomous Coals',
        d:'Something in the green does not wash off. Increases venom chance by 6%.',
        e:[st('venomChance', 0.06)] },
      { k:'k6b', p:'k5b', n:'Chitin Toxin',
        d:'She has started brewing it in her own shell. Increases venom chance by a further 5%.',
        e:[st('venomChance', 0.05)] },
      { k:'k7', p:'k6a', n:'Emerald Conflagration',
        d:'The pool stops being a pool. Increases ranged damage by 8% and reduces fire cooldown by 5%.',
        e:[st('rangedDamage', 0.08), st('fireCooldown', -0.05)] },
      { k:'k8', p:'k6b', n:'Drained Dry',
        d:'She takes a sip out of every hit, not just the killing one. Increases lifesteal chance by 4%.',
        e:[st('lifestealChance', 0.04)] },
      { k:'k9', p:'k7', n:'The Pool That Never Cools',
        d:'It burns whether or not she is holding it, and it burns her too. Increases ranged damage by a further 8%, but she takes 8% more damage.',
        e:[st('rangedDamage', 0.08), dt(0.08)] },

      // --- branch l: Carapace (the infiltrator's shell) ---
      { k:'l1', p:null, n:'Hardened Carapace',
        d:'Plates thick enough to actually stop something. Reduces damage taken by 8%, but reduces movement speed by 3%.',
        e:[dt(-0.08), st('speed', -0.03)] },
      { k:'l2', p:'l1', n:'Green Glass Eyes',
        d:'She sees the soft parts. Increases ranged damage by 5%.',
        e:[st('rangedDamage', 0.05)] },
      { k:'l3a', p:'l2', n:"Mimic's Menace",
        d:'She wears a face they know and it goes badly for them. Increases fear chance by 5%.',
        e:[st('fearChance', 0.05)] },
      { k:'l4a', p:'l3a', n:'Terror of the Hive',
        d:'Whatever they thought she was, she is not. Increases fear chance by a further 5%.',
        e:[st('fearChance', 0.05)] },
      { k:'l5a', p:'l4a', n:'Scavenged Love',
        d:'She takes what she can find, wherever she finds it. Increases luck by 5%.',
        e:[st('luck', 0.05)] },
      { k:'l6a', p:'l5a', n:'Hoarder Instinct',
        d:'Nothing on the floor stays on the floor. Increases pickup magnet radius by 5%.',
        e:[st('magnetRadius', 0.05)] },
      { k:'l3b', p:'l2', n:'Brittle Shell', c:true,
        d:'A shell hardened this fast cracks along every seam. Permanently reduces luck by 3%. The rest of this side of the carapace is closed without it.',
        e:[st('luck', -0.03)] },
      { k:'l4b', p:'l3b', n:'Drone Discipline',
        d:'She fights like something with orders. Increases ranged damage by 5%.',
        e:[st('rangedDamage', 0.05)] },
      { k:'l5b', p:'l4b', n:'Feeding Reflex',
        d:'She drinks without deciding to. Increases lifesteal chance by 4%.',
        e:[st('lifestealChance', 0.04)] },
      { k:'l6b', p:'l5b', n:'Pheromone Trail',
        d:'She leaves a scent that drags loose things after her. Increases pickup magnet radius by 5%.',
        e:[st('magnetRadius', 0.05)] },
      { k:'l7', p:'l6a', n:'Queen in Waiting',
        d:'The shape a changeling becomes if it lives long enough. Reduces damage taken by a further 8% and increases luck by 5%.',
        e:[dt(-0.08), st('luck', 0.05)] },
      { k:'l8', p:'l6b', n:"Infiltrator's Poise",
        d:'Perfectly still until the moment she is not. Increases critical hit chance by 5% and pickup magnet radius by a further 4%.',
        e:[st('critChance', 0.05), st('magnetRadius', 0.04)] },
    ]);
  }

  // ==========================================================
  // DIAMOND DOG — 50 nodes (i/j/k/l)
  // ==========================================================
  {
    const c = 'diamonddog';
    const st = (stat, amount) => ({ type:'stat', classId:c, stat, amount });
    const rc = (amount) => ({ type:'uniqueField', classId:c, field:'rockCoinChance', amount, min:0, max:0.15 });
    const dt = (amount) => ({ type:'uniqueField', classId:c, field:'damageTakenMult', amount, min:-0.25, max:0.6 });
    build(c, [
      // --- branch i: Pickaxe Claw (her rock-shattering swing) ---
      { k:'i1', p:null, n:'Whetted Claw',
        d:'Filed down to something closer to a chisel. Increases melee damage by 4%, but the heavier claw increases melee cooldown by 4%.',
        e:[st('meleeDamage', 0.04), st('meleeCooldown', 0.04)] },
      { k:'i2', p:'i1', n:'Longer Reach',
        d:'She swings from the shoulder, not the elbow. Increases melee reach by 5%.',
        e:[st('rangeTiles', 0.05)] },
      { k:'i3a', p:'i2', n:'Seam Splitter',
        d:'She hits where the stone already wanted to break. Increases the chance a shattered rock pays out a coin by 2%.',
        e:[rc(0.02)] },
      { k:'i4a', p:'i3a', n:'Quarry Sense',
        d:'She knows which wall is worth the effort. Increases luck by 5%.',
        e:[st('luck', 0.05)] },
      { k:'i5a', p:'i4a', n:'Two-Handed Swing',
        d:'Both claws, all the way over. Increases melee damage by a further 4%, but increases melee cooldown by a further 4%.',
        e:[st('meleeDamage', 0.04), st('meleeCooldown', 0.04)] },
      { k:'i6a', p:'i5a', n:'Rubble Sweep',
        d:'The follow-through carries through the debris and out the other side. Increases melee reach by a further 5%.',
        e:[st('rangeTiles', 0.05)] },
      { k:'i3b', p:'i2', n:'Chipped Claw', c:true,
        d:'Stone wins some of the arguments. Permanently reduces melee damage by 4%. Everything deeper on this side of the tunnel is closed without it.',
        e:[st('meleeDamage', -0.04)] },
      { k:'i4b', p:'i3b', n:'Follow-Through',
        d:'She stops pausing at the end of the swing. Reduces melee cooldown by 5%.',
        e:[st('meleeCooldown', -0.05)] },
      { k:'i5b', p:'i4b', n:'Stone Dust in the Air',
        d:'Everything she fights is coughing before it is bleeding. Increases vulnerable chance by 6%.',
        e:[st('vulnerableChance', 0.06)] },
      { k:'i6b', p:'i5b', n:'Pickaxe Precision',
        d:'The same eye that finds a seam finds a joint. Increases critical hit chance by 5%.',
        e:[st('critChance', 0.05)] },
      { k:'i7', p:'i6a', n:'Mountain-Breaker',
        d:'She hits like something that has broken a mountain, and stands like it too. Increases melee damage by a further 3%, but she takes 6% more damage.',
        e:[st('meleeDamage', 0.03), dt(0.06)] },
      { k:'i8', p:'i6b', n:'Wide Arc',
        d:'A swing that covers the whole tunnel mouth. Increases melee reach by a further 5%.',
        e:[st('rangeTiles', 0.05)] },
      { k:'i9', p:'i7', n:'Every Wall Is a Door',
        d:'She stops going around things entirely, which takes time she used to spend running. Increases melee damage by a final 2%, but reduces movement speed by 4%.',
        e:[st('meleeDamage', 0.02), st('speed', -0.04)] },

      // --- branch j: Gem Hoard (the greed) ---
      { k:'j1', p:null, n:'Gem Hunger',
        d:'She goes for the glitter before she goes for cover. Increases pickup magnet radius by 5%, but she takes 6% more damage.',
        e:[st('magnetRadius', 0.05), dt(0.06)] },
      { k:'j2', p:'j1', n:'Glittering Eye',
        d:'She spots the good stuff two rooms early. Increases luck by 5%.',
        e:[st('luck', 0.05)] },
      { k:'j3a', p:'j2', n:'Pocketful of Diamonds',
        d:'Everything loose ends up on her. Increases pickup magnet radius by a further 5%.',
        e:[st('magnetRadius', 0.05)] },
      { k:'j4a', p:'j3a', n:"Appraiser's Nose",
        d:'She can smell a good vein. Increases luck by a further 5%.',
        e:[st('luck', 0.05)] },
      { k:'j5a', p:'j4a', n:'Hoard Instinct',
        d:'Hers is hers. Increases pickup magnet radius by a further 5%.',
        e:[st('magnetRadius', 0.05)] },
      { k:'j6a', p:'j5a', n:'Never Leaves a Gem',
        d:'Not one. Not ever. Increases luck by a further 3%.',
        e:[st('luck', 0.03)] },
      { k:'j3b', p:'j2', n:'Weighed Down by Gems', c:true,
        d:'She will not put any of it down, and it shows in every step. Permanently reduces movement speed by 4%. The rest of the hoard is closed without it.',
        e:[st('speed', -0.04)] },
      { k:'j4b', p:'j3b', n:'Greedy Grip',
        d:'Longer arms for grabbing. Increases pickup magnet radius by a further 5%.',
        e:[st('magnetRadius', 0.05)] },
      { k:'j5b', p:'j4b', n:"Dragon's Habit",
        d:'She has started sleeping on it. Increases critical hit chance by 5%.',
        e:[st('critChance', 0.05)] },
      { k:'j6b', p:'j5b', n:'Gilded Claws',
        d:'Gem dust worked into the claw edge. Increases melee damage by 3%.',
        e:[st('meleeDamage', 0.03)] },
      { k:'j7', p:'j6a', n:'The Whole Hoard',
        d:'Every gem in the tunnel, and no speed left to carry them. Increases luck by a further 5%, but reduces movement speed by 3%.',
        e:[st('luck', 0.05), st('speed', -0.03)] },
      { k:'j8', p:'j6b', n:'Bright Bauble',
        d:'Something in her paw catches the light at exactly the right moment. Increases critical hit chance by a further 5%.',
        e:[st('critChance', 0.05)] },

      // --- branch k: Kennel Hide (the tunneller's armor) ---
      { k:'k1', p:null, n:'Kennel Hide',
        d:'Scar over scar over scar. Reduces damage taken by 10%, but reduces movement speed by 3%.',
        e:[dt(-0.10), st('speed', -0.03)] },
      { k:'k2', p:'k1', n:'Scarred Muzzle',
        d:'She heals rough and fast. Increases on-kill heal chance by 6%.',
        e:[st('onKillHealChance', 0.06)] },
      { k:'k3a', p:'k2', n:'Bury Them in Rubble',
        d:'The swing brings the ceiling with it. Increases stun chance by 5%.',
        e:[st('stunChance', 0.05)] },
      { k:'k4a', p:'k3a', n:'Concussive Claw',
        d:'The blow lands like a collapse. Increases stun chance by a further 5%.',
        e:[st('stunChance', 0.05)] },
      { k:'k5a', p:'k4a', n:'Dust in the Lungs',
        d:'Nothing that breathes fights well down here. Increases venom chance by 5%.',
        e:[st('venomChance', 0.05)] },
      { k:'k6a', p:'k5a', n:'Choking Grit',
        d:'She kicks up the floor deliberately now. Increases venom chance by a further 5%.',
        e:[st('venomChance', 0.05)] },
      { k:'k3b', p:'k2', n:'Cracked Ribs', c:true,
        d:'Something in her chest never set right after the last cave-in. Permanently reduces melee damage by 4%. The rest of the hide is closed without it.',
        e:[st('meleeDamage', -0.04)] },
      { k:'k4b', p:'k3b', n:'Thick Pelt',
        d:'Matted into something closer to felt than fur. Reduces damage taken by a further 8%.',
        e:[dt(-0.08)] },
      { k:'k5b', p:'k4b', n:'Lick the Wound',
        d:'She patches herself between fights and does not stop for it. Increases on-kill heal chance by a further 6%.',
        e:[st('onKillHealChance', 0.06)] },
      { k:'k6b', p:'k5b', n:'Blood in the Tunnel',
        d:'She takes something back out of everything she opens. Increases lifesteal chance by 6%.',
        e:[st('lifestealChance', 0.06)] },
      { k:'k7', p:'k6a', n:"Alpha's Bulk",
        d:'Bigger than anything else in the pack, and slower with it. Reduces damage taken by a further 8%, but increases melee cooldown by 4%.',
        e:[dt(-0.08), st('meleeCooldown', 0.04)] },
      { k:'k8', p:'k6b', n:'Bone-Cracker',
        d:'She knows exactly where a leg gives. Increases stun chance by a further 5%.',
        e:[st('stunChance', 0.05)] },
      { k:'k9', p:'k7', n:'Digs Its Own Grave',
        d:'She fights from inside a hole she made, which is safer and blinder both. Reduces damage taken by a further 8%, but reduces melee reach by 4%.',
        e:[dt(-0.08), st('rangeTiles', -0.04)] },

      // --- branch l: Deep Tunnels (the long dig) ---
      { k:'l1', p:null, n:'Tunnel Legs',
        d:'Built for a mile of crawlway. Increases movement speed by 5%.',
        e:[st('speed', 0.05)] },
      { k:'l2', p:'l1', n:'Night Eyes',
        d:'She has not needed a lamp in years. Increases critical hit chance by 5%.',
        e:[st('critChance', 0.05)] },
      { k:'l3a', p:'l2', n:"Digger's Rhythm",
        d:'Swing, breathe, swing. Reduces melee cooldown by 4%.',
        e:[st('meleeCooldown', -0.04)] },
      { k:'l4a', p:'l3a', n:'Relentless Excavation',
        d:'She does not stop when the rock does. Reduces melee cooldown by a further 4%.',
        e:[st('meleeCooldown', -0.04)] },
      { k:'l5a', p:'l4a', n:'Heavy Blow',
        d:'All of her behind it. Increases melee damage by 4%.',
        e:[st('meleeDamage', 0.04)] },
      { k:'l6a', p:'l5a', n:'Crushing Weight',
        d:'Less a strike than a landslide. Increases melee damage by a further 3%.',
        e:[st('meleeDamage', 0.03)] },
      { k:'l3b', p:'l2', n:'Tunnel Blindness', c:true,
        d:'Too long underground and the wide world stops making sense. Permanently reduces critical hit chance by 3%. The rest of the deep tunnel is closed without it.',
        e:[st('critChance', -0.03)] },
      { k:'l4b', p:'l3b', n:'Deep-Delved',
        d:'Further down than anything else goes. Increases luck by 2%.',
        e:[st('luck', 0.02)] },
      { k:'l5b', p:'l4b', n:'Sharpened Dewclaw',
        d:'The small claw nobody watches for. Increases melee damage by 3%.',
        e:[st('meleeDamage', 0.03)] },
      { k:'l6b', p:'l5b', n:'Second Swing',
        d:'The backhand comes free. Reduces melee cooldown by a further 4%.',
        e:[st('meleeCooldown', -0.04)] },
      { k:'l7', p:'l6a', n:'Bedrock Breaker',
        d:'She has hit the bottom of the world and kept going, which is not fast work. Increases melee damage by a final 2%, but reduces movement speed by a further 4%.',
        e:[st('meleeDamage', 0.02), st('speed', -0.04)] },
      { k:'l8', p:'l6b', n:'The Deepest Tunnel',
        d:'The end of the dig. Increases melee reach by 5% and critical hit chance by a further 5%.',
        e:[st('rangeTiles', 0.05), st('critChance', 0.05)] },
    ]);
  }
})();

for (const n of SKILL_TREE_CHARACTER_NODES_4D) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

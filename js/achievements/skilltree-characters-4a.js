'use strict';
// Phase 10 Part B — skill tree megaupdate, Group 1 of 5.
// 50 new nodes each for: earth, pegasus, unicorn, batpony, zebra (250 total).
// Branch-letter space reserved for this whole Phase 10 skill-tree pass: i, j, k, l
// (a-h are already used by skilltree-characters.js / -characters-2.js / -characters-3.js).
// Node id convention: 'char_' + classId + '_' + key (unchanged from prior files).
//
// Pure data. Appended onto the SKILL_TREE_NODES array / SKILL_TREE_NODES_BY_ID
// map defined in skilltree.js — no engine logic lives here. See skilltree.js
// for canBuySkillNode / buySkillNode / getSkillTreeStatBonus /
// applySkillTreeUniqueFieldBonuses / applySkillTreeUniqueFlagEffects.
//
// ---------------------------------------------------------------------------
// TOPOLOGY
// ---------------------------------------------------------------------------
// Every character gets FOUR fresh branches hung directly off their existing
// char_hub_<classId> node (the way the original a/b branches were), rather
// than grafts onto old leaves the way -characters-3.js's e/f/g/h branches
// were. Branch sizes are i:13, j:13, k:12, l:12 = 50.
//
// Every branch is the same wide, shallow shape (X = i|j|k|l), so no leaf is
// ever more than 5 purchases deep and each branch forks immediately rather
// than being one long chain:
//
//   X1                 (opener, parent = char_hub_<classId>)
//    +- X2             +- X3
//    |   +- X4         |   +- X6
//    |   |   +- X8     |   |   +- X10
//    |   |       +-X12 |   |       +- X13   (13-node branches only)
//    |   +- X5         |   +- X7
//    |       +- X9     |       +- X11
//
// (12-node branches are identical minus X13.)
//
// ---------------------------------------------------------------------------
// DESIGN — build on each class's OWN mechanic, and pay for the big stuff
// ---------------------------------------------------------------------------
// The brief for this pass: most nodes must amplify/modify/extend the thing
// that actually makes the character that character, and anything genuinely
// powerful (a new attack, a new proc, a stat swing that changes how she
// plays) has to carry a real Soy-Milk-style cost. Two mechanisms are used,
// both already established by -characters-3.js and -characters-2.js:
//
//  1. `cursed:true` gate nodes — a pure-debuff node that is the SOLE parent
//     of the payoff beneath it, so the payoff is structurally unreachable
//     without eating the debuff first (canBuySkillNode requires the single
//     `parent` to be owned). One per branch, 20 per character... no: exactly
//     one per branch here (4 per character, 20 across the group), always the
//     sole parent of that branch's biggest single payoff.
//  2. Two-effect trade-off nodes — a `effects:[buff, nerf]` pair on the SAME
//     node, so the cost is inseparable from the gain even without a gate.
//
// Per-character mechanic hooks (the "what makes her her" the branches build
// on), all of them real per-instance shadow fields on `player` seeded in
// entities.js's Player constructor (never `player.def`, see skilltree.js):
//
//  earth       — the immovable ground-bound bruiser. `damageTakenMult`
//                (armour, the one class whose identity is soaking), the
//                `shockwaveAttack` rock-shattering flag, `baseRangeTiles`
//                (melee reach as ground tremor), and a heretical
//                `canFly` grant that costs her the melee weight she's
//                built on.
//  pegasus     — the fast, flimsy flier. `radius` (a genuinely smaller
//                hitbox — "Featherframe"), `baseRangeTiles` as wing-buffet
//                reach, a wing-downdraft `shockwaveAttack` + its
//                `rockCoinChance` payout, and weather-flavored freeze/charm.
//                NOTE: her dodgeChance is already at +0.24 across
//                -characters-2.js, i.e. effectively at the 0.25 cap, so this
//                file deliberately adds NO dodge to her at all.
//  unicorn     — the horn. Branch j is a full attack transformation: the
//                `charged` + `crystalVolley` flags plus a seeded
//                `crystalShardCount` and `chargeTime`, turning her loose
//                bolts into a held-and-released fan of converging shards,
//                then feeding that fan more shards, a shorter gather and
//                faster shard flight. Branch k grants `unlimitedRange`.
//                (The fan's SPACING is deliberately left alone: it is
//                seeded to 0 for any class without def.crystalVolley and
//                combat-2.js falls back to CRYSTAL_VOLLEY_SPACING_DEFAULT
//                on a falsy value, so it is not a useful knob here.)
//  batpony     — the night hunter that feeds. Branch k borrows
//                `summonsChangelings` as a bat roost (with its own
//                changelingMinionDmg/Radius/cooldown/cap, all fed by nodes —
//                they default to 0 damage / 0 radius for non-queen classes,
//                so the grant node MUST seed them or the swarm is inert),
//                branch j pushes her innate lifedrink further, branch i is
//                echolocation-as-reach.
//  zebra       — the apothecary brawler. Branch i is her brew satchel
//                (stun/charm/fear/vulnerable — every chance field her
//                existing tree does NOT already sit near the cap on; her
//                venomChance is already +0.24 from -characters-2.js and is
//                therefore untouched here), branch j is thrown-gourd reach
//                plus pigment-grinding `shockwaveAttack`, branch k is
//                warpaint as real mitigation.
//
// Mechanics deliberately NOT borrowed for the four melee classes here:
// `greenFireAttack`, `innateFireRing` and `canBuildTurrets`. All three
// derive their damage from `player.rangedDamage` (see combat-1.js's
// updateGreenFireAttack / updateFireRingAttack and updateTurretBuild's
// `player.rangedDamage * turretDamageMult` snapshot), which is 0 for every
// melee class — and the first two also suppress the normal attack dispatch
// entirely (`if (!player.greenFireAttack && !player.innateFireRing)`), so
// granting one to Earth/Pegasus/Bat Pony/Zebra would leave her with no
// working attack at all. `redMax` is likewise avoided: it is mutated DURING
// a run (devil deals, eternal heart) and applySkillTreeUniqueFieldBonuses
// rewrites `base + bonus` on every recalc, which would wipe those.
//
// ---------------------------------------------------------------------------
// CAP DISCIPLINE
// ---------------------------------------------------------------------------
// skilltree.js clamps each (classId, stat) summed 'stat' bonus to
// [-cap, +cap] with cap = SKILL_TREE_STAT_CAP (0.25), overridden to 0.10 for
// lifestealChance. Amounts below were authored against the FULL prior total
// for each character (skilltree-characters.js + -2.js + -3.js) so nothing in
// this file is silently clamped away — see the per-character/per-stat table
// in feature-research/phase10-metaprogression/audit-skilltree-group1.md.
// Rules of thumb applied: chance-type fields get at most 3-5 nodes per
// character, ~0.02-0.04 each, and only on fields that character's existing
// tree leaves headroom on; lifestealChance appears on exactly one character
// (batpony) and totals +0.08.
//
// uniqueField bounds: min/max are kept IDENTICAL across every node in this
// file targeting the same classId+field pair (skilltree.js takes the
// TIGHTEST min/max seen across contributing effects, so a mismatch would
// silently retune the whole group).

const SKILL_TREE_CHARACTER_CONFIG_4A = [

  // =========================================================================
  // EARTH PONY — the immovable one. Armour, ground tremors, and one heresy.
  // =========================================================================
  { classId:'earth', nodes:{
    // --- branch i: Bedrock Bulwark (damageTakenMult armour) ---------------
    i1:{ parent:'hub', name:'Hoof-Packed Earth', desc:'She stands the way tilled ground settles: heavy, level, and hard to shift. Reduces damage taken by 4%.',
      effects:[{ type:'uniqueField', classId:'earth', field:'damageTakenMult', amount:-0.04, min:-0.25, max:0.25 }] },
    i2:{ parent:'i1', name:'Ploughshare Hide', desc:'A season behind the plough thickens a coat into something closer to leather. Reduces damage taken by a further 3%.',
      effects:[{ type:'uniqueField', classId:'earth', field:'damageTakenMult', amount:-0.03, min:-0.25, max:0.25 }] },
    i3:{ parent:'i1', name:'Fieldstone Stance', desc:'Braced like a boundary stone nopony has managed to move in two hundred years. Reduces damage taken by a further 3%.',
      effects:[{ type:'uniqueField', classId:'earth', field:'damageTakenMult', amount:-0.03, min:-0.25, max:0.25 }] },
    i4:{ parent:'i2', cursed:true, name:'Dragging Furrow', desc:'All that settled weight has to be dragged somewhere. Permanently reduces movement speed by 4%. The wall beyond it cannot be reached any other way.',
      effects:[{ type:'stat', classId:'earth', stat:'speed', amount:-0.04 }] },
    i5:{ parent:'i2', name:'Loam Cushion', desc:'Soft ground under the hooves takes the sting out of what lands on top of them. Reduces damage taken by a further 2%.',
      effects:[{ type:'uniqueField', classId:'earth', field:'damageTakenMult', amount:-0.02, min:-0.25, max:0.25 }] },
    i6:{ parent:'i3', name:'Windbreak Shoulders', desc:'Built like the hedgerow at the edge of the field — everything breaks against her first. Reduces damage taken by a further 2%.',
      effects:[{ type:'uniqueField', classId:'earth', field:'damageTakenMult', amount:-0.02, min:-0.25, max:0.25 }] },
    i7:{ parent:'i3', cursed:true, name:"Ploughman's Stoop", desc:'A lifetime bent over the traces leaves the shoulders slow to come back up. Permanently increases melee cooldown by 4%. Nothing deeper on this fork opens without it.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeCooldown', amount:0.04 }] },
    i8:{ parent:'i4', name:'Terrace Wall', desc:'The dragged furrow becomes a terrace, and a terrace holds a hillside up. Reduces damage taken by a further 3%.',
      effects:[{ type:'uniqueField', classId:'earth', field:'damageTakenMult', amount:-0.03, min:-0.25, max:0.25 }] },
    i9:{ parent:'i5', name:'Rooted Follow-Through', desc:'A blow thrown from ground that refuses to give lands with all of that ground behind it. Increases melee damage by 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeDamage', amount:0.04 }] },
    i10:{ parent:'i6', name:'Storm-Sheltered', desc:'Whatever the sky throws, the hedge has seen worse. Reduces damage taken by a further 2%.',
      effects:[{ type:'uniqueField', classId:'earth', field:'damageTakenMult', amount:-0.02, min:-0.25, max:0.25 }] },
    i11:{ parent:'i7', name:'Anvil Posture', desc:'The stoop turns out to be exactly the shape a hammer-blow wants. Increases melee damage by 5%, but the planted stance costs 3% movement speed.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeDamage', amount:0.05 }, { type:'stat', classId:'earth', stat:'speed', amount:-0.03 }] },
    i12:{ parent:'i8', name:'Unbudged', desc:'Two centuries of weather have not moved the boundary stone and neither will this. Reduces damage taken by a further 2%.',
      effects:[{ type:'uniqueField', classId:'earth', field:'damageTakenMult', amount:-0.02, min:-0.25, max:0.25 }] },
    i13:{ parent:'i10', name:'Set in the Soil', desc:'At some point she stopped standing on the field and started being part of it. Reduces damage taken by a further 2%, at the cost of 3% movement speed.',
      effects:[{ type:'uniqueField', classId:'earth', field:'damageTakenMult', amount:-0.02, min:-0.25, max:0.25 }, { type:'stat', classId:'earth', stat:'speed', amount:-0.03 }] },

    // --- branch j: Quakestep (reach + ground-slam control) ----------------
    j1:{ parent:'hub', name:'Quakestep', desc:'The hoof lands and the ground carries the rest of the blow outward. Extends her melee reach by 0.3 tiles.',
      effects:[{ type:'uniqueField', classId:'earth', field:'baseRangeTiles', amount:0.3, min:0, max:1.5 }] },
    j2:{ parent:'j1', name:'Tremor Sweep', desc:'One stomp, and everything inside the ripple feels it. Extends her melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'earth', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    // Phase 11 — un-bleed pass: this used to borrow Diamond Dog's
    // `shockwaveAttack` flag outright. Replaced with the tremor the
    // branch's own name already promises — everything nearby feels
    // unsteady after the hoof lands, whether it was rock or not.
    j3:{ parent:'j1', name:'Shattering Hoof', desc:'The ground doesn\'t need to break for the impact to be felt — anything standing nearby is off-balance for a moment after. Increases vulnerable chance by 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'vulnerableChance', amount:0.04 }] },
    j4:{ parent:'j2', name:'Long Furrow', desc:'The ripple runs the length of a ploughed row before it dies. Extends her melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'earth', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    j5:{ parent:'j2', cursed:true, name:'Overreach', desc:'Force spread across a wider ripple is force that stops landing in one place. Permanently reduces melee damage by 5%. The heavy arc below is only reachable through it.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeDamage', amount:-0.05 }] },
    j6:{ parent:'j3', name:'Ringing Impact', desc:'A hoof that cracks stone rattles anything softer than stone considerably harder. Increases stun chance by 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'stunChance', amount:0.04 }] },
    j7:{ parent:'j3', name:'Dust Plume', desc:'Shattered rock throws up a choking cloud, and things in it would rather be elsewhere. Increases fear chance by 3%.',
      effects:[{ type:'stat', classId:'earth', stat:'fearChance', amount:0.03 }] },
    j8:{ parent:'j4', name:'Fault Line', desc:'The furrow finds a seam in the bedrock and follows it. Extends her melee reach by a further 0.25 tiles, but the deeper wind-up costs 4% melee cooldown.',
      effects:[{ type:'uniqueField', classId:'earth', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }, { type:'stat', classId:'earth', stat:'meleeCooldown', amount:0.04 }] },
    j9:{ parent:'j5', name:'Sledge Arc', desc:'Having given up on precision entirely, she simply swings through everything. Increases melee damage by 4% and extends her melee reach by 0.25 tiles.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeDamage', amount:0.04 }, { type:'uniqueField', classId:'earth', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    j10:{ parent:'j6', name:'Bell-Strike Hoof', desc:'Struck right, a skull rings like a struck anvil. Increases stun chance by a further 3%.',
      effects:[{ type:'stat', classId:'earth', stat:'stunChance', amount:0.03 }] },
    j11:{ parent:'j7', name:'Choking Dust', desc:'The plume thickens until nothing in it is sure which way the farm is. Increases fear chance by a further 3%.',
      effects:[{ type:'stat', classId:'earth', stat:'fearChance', amount:0.03 }] },
    j12:{ parent:'j8', name:'Continental Shift', desc:'The seam turns out to run further than anypony had mapped. Extends her melee reach by a further 0.2 tiles.',
      effects:[{ type:'uniqueField', classId:'earth', field:'baseRangeTiles', amount:0.2, min:0, max:1.5 }] },
    j13:{ parent:'j10', name:'Ground Zero', desc:'Everything within a stomp of her loses the argument with the floor. Increases stun chance by a further 3%, at the cost of 3% movement speed.',
      effects:[{ type:'stat', classId:'earth', stat:'stunChance', amount:0.03 }, { type:'stat', classId:'earth', stat:'speed', amount:-0.03 }] },

    // --- branch k: Furrowed Fortune (luck, magnet, openings) --------------
    k1:{ parent:'hub', name:'Harvest Eye', desc:'A farmer knows which row is worth walking twice. Increases luck by 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'luck', amount:0.04 }] },
    k2:{ parent:'k1', name:"Gleaner's Reach", desc:'Nothing gets left lying in the stubble. Increases pickup magnet radius by 5%.',
      effects:[{ type:'stat', classId:'earth', stat:'magnetRadius', amount:0.05 }] },
    k3:{ parent:'k1', name:'Market Day Instinct', desc:'She has haggled enough Saturdays to know when a thing is about to go her way. Increases luck by a further 3%.',
      effects:[{ type:'stat', classId:'earth', stat:'luck', amount:0.03 }] },
    k4:{ parent:'k2', name:'Wide Swath', desc:'A scythe cuts wider than an arm does. Increases pickup magnet radius by a further 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'magnetRadius', amount:0.04 }] },
    k5:{ parent:'k2', cursed:true, name:'Heavy Yoke', desc:'Everything gathered has to be carried, and she is carrying all of it. Permanently reduces movement speed by 4%. The haul below is behind it.',
      effects:[{ type:'stat', classId:'earth', stat:'speed', amount:-0.04 }] },
    k6:{ parent:'k3', name:'Softened Ground', desc:'Anything she has already put on its back stays easy to work with. Increases vulnerable chance by 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'vulnerableChance', amount:0.04 }] },
    k7:{ parent:'k3', name:'Weathered Read', desc:'The same eye that reads a sky reads a stance. Increases critical hit chance by 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'critChance', amount:0.04 }] },
    k8:{ parent:'k4', name:'Nothing Left in the Field', desc:'She walks the row one more time out of pure principle. Increases pickup magnet radius by a further 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'magnetRadius', amount:0.04 }] },
    k9:{ parent:'k5', name:'Bounty Hauled Home', desc:'The yoke was worth it once the cart is unloaded. Increases luck by 3% and pickup magnet radius by 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'luck', amount:0.03 }, { type:'stat', classId:'earth', stat:'magnetRadius', amount:0.04 }] },
    k10:{ parent:'k6', name:'Tenderized', desc:'Struck ground and struck foes both work easier the second time. Increases vulnerable chance by a further 3%.',
      effects:[{ type:'stat', classId:'earth', stat:'vulnerableChance', amount:0.03 }] },
    k11:{ parent:'k7', name:'Split the Seam', desc:'Every log has one place it wants to come apart, and she finds it. Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'earth', stat:'critChance', amount:0.03 }] },
    k12:{ parent:'k10', name:'Ripe for the Reaping', desc:'She has a farmer\'s sense for exactly when a thing is ready to come down — and no patience left for anything else. Increases vulnerable chance by a further 3%, but reduces luck by 3%.',
      effects:[{ type:'stat', classId:'earth', stat:'vulnerableChance', amount:0.03 }, { type:'stat', classId:'earth', stat:'luck', amount:-0.03 }] },

    // --- branch l: Skyfurrow Heresy (and what it costs) -----------
    // Phase 11 un-bleed pass — l2 used to grant `canFly` outright ("flies
    // over rocks and pits like a pegasus"). Now her own `groundless` — she
    // doesn't grow wings, she simply stops being stopped by the ground,
    // which drives the same terrain-crossing behavior under her own name.
    l1:{ parent:'hub', cursed:true, name:'Hollow Bones', desc:'To leave the ground she has to stop being the heaviest thing on it. Permanently reduces melee damage by 5%. Nothing on this branch exists without it.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeDamage', amount:-0.05 }] },
    l2:{ parent:'l1', name:'Skyfurrow', desc:'The one thing an earth pony was never meant to do: she gets so light that rock and pit stop being able to stop her at all. The frame that lets her do it takes 5% more damage.',
      effects:[{ type:'uniqueFlag', classId:'earth', field:'groundless', value:true }, { type:'uniqueField', classId:'earth', field:'damageTakenMult', amount:0.05, min:-0.25, max:0.25 }] },
    l3:{ parent:'l1', name:'Chaff-Light Frame', desc:'What is left of her after the bones went hollow moves considerably quicker. Increases movement speed by 5%.',
      effects:[{ type:'stat', classId:'earth', stat:'speed', amount:0.05 }] },
    l4:{ parent:'l2', name:'Windrow Glide', desc:'She rides the long raked lines of cut hay the way a gull rides a swell. Increases movement speed by a further 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'speed', amount:0.04 }] },
    l5:{ parent:'l2', cursed:true, name:'Ground Sense Lost', desc:'Every instinct she has for timing a blow was calibrated against solid dirt, and the dirt is gone. Permanently increases melee cooldown by 4%. The payload below demands it.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeCooldown', amount:0.04 }] },
    l6:{ parent:'l3', name:'Thermal Furrow', desc:'Warm air comes off a ploughed field in ribbons, and she has learned to read them. Increases movement speed by a further 3%.',
      effects:[{ type:'stat', classId:'earth', stat:'speed', amount:0.03 }] },
    l7:{ parent:'l3', name:'Loose-Soil Landing', desc:'A pony who expects to hit the ground badly gets very good at not quite hitting it. Increases dodge chance by 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'dodgeChance', amount:0.04 }] },
    l8:{ parent:'l4', name:'Kite Tail', desc:'She trails behind herself like something on a string, and string is hard to hit. Increases dodge chance by a further 3%.',
      effects:[{ type:'stat', classId:'earth', stat:'dodgeChance', amount:0.03 }] },
    l9:{ parent:'l5', name:'Payload Drop', desc:'Losing her ground sense turns out not to matter if she simply falls on things from a great height. Increases melee damage by 6%.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeDamage', amount:0.06 }] },
    l10:{ parent:'l6', name:'Fallow Sky', desc:'Nothing planted, nothing owed, nothing holding her down this season. Increases movement speed by a further 3% and luck by 3%.',
      effects:[{ type:'stat', classId:'earth', stat:'speed', amount:0.03 }, { type:'stat', classId:'earth', stat:'luck', amount:0.03 }] },
    l11:{ parent:'l7', name:'Never Lands', desc:'It stopped being a jump some while ago and nopony has told her. Increases dodge chance by a further 3%.',
      effects:[{ type:'stat', classId:'earth', stat:'dodgeChance', amount:0.03 }] },
    l12:{ parent:'l9', name:'Furrow from Above', desc:'She cuts a plough-line through a room without touching the floor once. Increases melee damage by 4%, at the cost of 3% melee cooldown.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeDamage', amount:0.04 }, { type:'stat', classId:'earth', stat:'meleeCooldown', amount:0.03 }] },
  }},

  // =========================================================================
  // PEGASUS — the fast, flimsy flier. Smaller, sharper, weather-touched.
  // (No dodgeChance anywhere here: -characters-2.js already puts her at
  //  +0.24 of the 0.25 cap.)
  // =========================================================================
  { classId:'pegasus', nodes:{
    // --- branch i: Gale Buffet (reach + downdraft) ------------------------
    i1:{ parent:'hub', name:'Gale Buffet', desc:'She stops hitting with the hoof and starts hitting with the air the hoof moves. Extends her melee reach by 0.3 tiles.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'baseRangeTiles', amount:0.3, min:0, max:1.5 }] },
    i2:{ parent:'i1', name:'Wingtip Lash', desc:'The very end of a primary feather is moving faster than anything else on her. Extends her melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    // Phase 11 — un-bleed pass: i3/i6/i10/i13 used to borrow Diamond Dog's
    // `shockwaveAttack` flag ("the way a Diamond Dog's claw does") plus
    // three `rockCoinChance` payouts riding on it. Replaced with the storm
    // theme the branch already leans on elsewhere (i7/i11 stun, i9 damage).
    i3:{ parent:'i1', name:'Downdraft Slam', desc:'A full-body wingbeat lands with enough weight behind it to stagger anything caught underneath. Winding one up costs 4% melee cooldown.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeDamage', amount:0.05 }, { type:'stat', classId:'pegasus', stat:'meleeCooldown', amount:0.04 }] },
    i4:{ parent:'i2', name:'Rolling Gust', desc:'The gust keeps travelling after the wing has already come back. Extends her melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    i5:{ parent:'i2', cursed:true, name:'Thin Air Strain', desc:'Hitting with air instead of bone means there is a great deal less bone in the hit. Permanently reduces melee damage by 4%. The hurricane below is behind it.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeDamage', amount:-0.04 }] },
    i6:{ parent:'i3', name:'Grit in the Gale', desc:'A downdraft that heavy kicks up everything loose on the floor. Increases pickup magnet radius by 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'magnetRadius', amount:0.04 }] },
    i7:{ parent:'i3', name:'Concussive Clap', desc:'Two wings brought together hard enough make a sound that arrives before the air does. Increases stun chance by 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'stunChance', amount:0.04 }] },
    i8:{ parent:'i4', name:'Storm Front Reach', desc:'A weather front does not have a reach so much as a schedule. Extends her melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    i9:{ parent:'i5', name:'Hurricane Hoof', desc:'Enough air, moved fast enough, stops being a breeze and starts being a wall. Increases melee damage by 6%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeDamage', amount:0.06 }] },
    i10:{ parent:'i6', name:'Scoured Rubble', desc:'She sweeps everything the downdraft loosened straight into her own path. Increases pickup magnet radius by a further 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'magnetRadius', amount:0.03 }] },
    i11:{ parent:'i7', name:'Thunderclap', desc:'The clap gets loud enough that the weather team files a complaint. Increases stun chance by a further 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'stunChance', amount:0.03 }] },
    i12:{ parent:'i8', name:'Skyline Sweep', desc:'One pass, wingtip to wingtip, across the whole width of a room. Extends her melee reach by a further 0.25 tiles, but the wide arc costs 3% movement speed.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }, { type:'stat', classId:'pegasus', stat:'speed', amount:-0.03 }] },
    i13:{ parent:'i10', name:'Sky-Panned Gravel', desc:'She has taken to hovering over whatever she kicks up and sorting it by eye. Increases luck by 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'luck', amount:0.04 }] },

    // --- branch j: Featherframe (a genuinely smaller pony) ----------------
    j1:{ parent:'hub', name:'Featherframe', desc:'She trims everything a flier does not strictly need. Shrinks her body radius by 0.4px, so fewer things that come near her actually connect.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'radius', amount:-0.4, min:-3.6, max:3.6 }] },
    j2:{ parent:'j1', name:'Hollow-Boned', desc:'Lighter bones, smaller target, considerably less pony between a blow and the important parts. Shrinks her radius by a further 0.4px, but she takes 4% more damage.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'radius', amount:-0.4, min:-3.6, max:3.6 }, { type:'uniqueField', classId:'pegasus', field:'damageTakenMult', amount:0.04, min:-0.25, max:0.25 }] },
    j3:{ parent:'j1', name:'Streamlined Barrel', desc:'She has been told this is what a barrel is supposed to look like. It is not. Shrinks her radius by a further 0.4px.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'radius', amount:-0.4, min:-3.6, max:3.6 }] },
    j4:{ parent:'j2', name:'Slipthrough', desc:'Gaps that were not gaps last week are gaps now. Shrinks her radius by a further 0.4px.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'radius', amount:-0.4, min:-3.6, max:3.6 }] },
    j5:{ parent:'j2', cursed:true, name:'Brittle Pinions', desc:'There is a point past which trimming stops being clever. Permanently increases damage taken by 5%. Everything below this node is on the far side of it.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'damageTakenMult', amount:0.05, min:-0.25, max:0.25 }] },
    j6:{ parent:'j3', name:'Trim the Feathers', desc:'Half a wing\'s worth of decorative down, gone. Shrinks her radius by a further 0.4px.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'radius', amount:-0.4, min:-3.6, max:3.6 }] },
    j7:{ parent:'j3', name:'Tucked Wings', desc:'Folded tight, she can see the whole line of a strike before she commits to it. Increases critical hit chance by 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'critChance', amount:0.03 }] },
    j8:{ parent:'j4', name:"Needle's Eye", desc:'She has started aiming for gaps out of preference rather than necessity. Shrinks her radius by a further 0.4px.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'radius', amount:-0.4, min:-3.6, max:3.6 }] },
    j9:{ parent:'j5', name:'Untouchable', desc:'Brittle is survivable as long as nothing ever actually catches her square. Reduces damage taken by 5%.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'damageTakenMult', amount:-0.05, min:-0.25, max:0.25 }] },
    j10:{ parent:'j6', name:'Ghostfeather', desc:'What is left of her silhouette is mostly rumour. Shrinks her radius by a further 0.4px.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'radius', amount:-0.4, min:-3.6, max:3.6 }] },
    j11:{ parent:'j7', name:'Loose Harness', desc:'Nothing strapped on, nothing to snag, nothing to slow the return of a strike. Reduces melee cooldown by 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeCooldown', amount:-0.03 }] },
    j12:{ parent:'j8', name:'Barely There', desc:'At this point the wind is doing most of the load-bearing. Shrinks her radius by a further 0.4px, and she takes 4% more damage for it.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'radius', amount:-0.4, min:-3.6, max:3.6 }, { type:'uniqueField', classId:'pegasus', field:'damageTakenMult', amount:0.04, min:-0.25, max:0.25 }] },
    j13:{ parent:'j10', name:'Wisp of a Pony', desc:'Somewhere between a pegasus and a draught under a door. Shrinks her radius by a further 0.4px.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'radius', amount:-0.4, min:-3.6, max:3.6 }] },

    // --- branch k: Weatherworker -----------------------------------------
    k1:{ parent:'hub', name:'Cloud-Seeded Hooves', desc:'She carries a little of the cloud layer down with her on every strike. Increases freeze chance by 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'freezeChance', amount:0.04 }] },
    k2:{ parent:'k1', name:'Hailstone Strike', desc:'The hoof arrives cold and hard and slightly ahead of the weather report. Increases freeze chance by a further 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'freezeChance', amount:0.03 }] },
    k3:{ parent:'k1', name:'Rainbow Sheen', desc:'Light through the mist off her wings is genuinely difficult to look away from. Increases charm chance by 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'charmChance', amount:0.04 }] },
    k4:{ parent:'k2', name:'Frost Wake', desc:'The air closes cold behind her wherever she has just been. Increases freeze chance by a further 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'freezeChance', amount:0.03 }] },
    k5:{ parent:'k2', cursed:true, name:'Numbed Feathers', desc:'Working the cold layer all day leaves the primaries stiff and slow. Permanently reduces movement speed by 4%. The storm below is only reachable through it.',
      effects:[{ type:'stat', classId:'pegasus', stat:'speed', amount:-0.04 }] },
    k6:{ parent:'k3', name:'Dazzling Contrail', desc:'She leaves a stripe of colour that nothing hostile can quite ignore. Increases charm chance by a further 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'charmChance', amount:0.03 }] },
    k7:{ parent:'k3', name:'Fair Weather Fortune', desc:'It is astonishing how often the sky is on her side. Increases luck by 5%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'luck', amount:0.05 }] },
    k8:{ parent:'k4', name:'Winter Crosswind', desc:'A crosswind off a snowfield, delivered at close range. Increases freeze chance by a further 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'freezeChance', amount:0.03 }] },
    k9:{ parent:'k5', name:'Blizzard Runner', desc:'Stiff feathers or not, she has found the fast lane through the front. Increases movement speed by 6%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'speed', amount:0.06 }] },
    k10:{ parent:'k6', name:'Sky-Show Distraction', desc:'Half the room is watching the display instead of the pony making it. Increases charm chance by a further 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'charmChance', amount:0.03 }] },
    k11:{ parent:'k7', name:'Weather Rights', desc:'She has the paperwork for this airspace and she intends to use it. Increases luck by a further 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'luck', amount:0.04 }] },
    k12:{ parent:'k9', name:'Eye of the Storm', desc:'Dead calm in the middle of the worst of it, and nothing reaches her there — but calm is not where the lucky breaks happen. Reduces damage taken by 6%, at the cost of 4% luck.',
      effects:[{ type:'uniqueField', classId:'pegasus', field:'damageTakenMult', amount:-0.06, min:-0.25, max:0.25 }, { type:'stat', classId:'pegasus', stat:'luck', amount:-0.04 }] },

    // --- branch l: Stormchaser -------------------------------------------
    l1:{ parent:'hub', name:'Stormchaser', desc:'She has never once flown away from weather. Increases movement speed by 5%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'speed', amount:0.05 }] },
    l2:{ parent:'l1', name:'Dive Angle', desc:'There is exactly one line into a target from a stoop, and she has memorised it. Increases critical hit chance by 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'critChance', amount:0.04 }] },
    l3:{ parent:'l1', name:'Tailwind Lock', desc:'She finds the pushing air and simply stays in it. Increases movement speed by a further 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'speed', amount:0.04 }] },
    l4:{ parent:'l2', name:'Pinpoint Stoop', desc:'A falcon\'s trick, borrowed badly at first and then rather well. Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'critChance', amount:0.03 }] },
    l5:{ parent:'l2', cursed:true, name:'Tunnel Vision', desc:'Fixed on the line of the dive, she is slow to reset for the next one. Permanently increases melee cooldown by 5%. Terminal velocity is on the other side of it.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeCooldown', amount:0.05 }] },
    l6:{ parent:'l3', name:'Jetstream', desc:'Higher up there is a river of air going her way at all times. Increases movement speed by a further 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'speed', amount:0.03 }] },
    l7:{ parent:'l3', name:'Slipstream Shear', desc:'Passing close enough at speed does damage all by itself. Increases melee damage by 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeDamage', amount:0.04 }] },
    l8:{ parent:'l4', name:'Killing Angle', desc:'The one approach a target can neither see nor turn into. Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'critChance', amount:0.03 }] },
    l9:{ parent:'l5', name:'Terminal Velocity', desc:'She stops flapping halfway down and lets physics finish the argument. Increases melee damage by 7%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeDamage', amount:0.07 }] },
    l10:{ parent:'l6', name:'Never Slows', desc:'Turns are for ponies who intend to stop eventually. Increases movement speed by a further 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'speed', amount:0.03 }] },
    l11:{ parent:'l7', name:'Wingblade', desc:'The leading edge of a folded wing is not far off an edge. Increases melee damage by a further 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeDamage', amount:0.04 }] },
    l12:{ parent:'l9', name:'Sound Barrier', desc:'She goes through the front of the air rather than around it, and the air pushes back on the way through. Increases movement speed by 5%, but she takes 5% more damage.',
      effects:[{ type:'stat', classId:'pegasus', stat:'speed', amount:0.05 }, { type:'uniqueField', classId:'pegasus', field:'damageTakenMult', amount:0.05, min:-0.25, max:0.25 }] },
  }},

  // =========================================================================
  // UNICORN — the horn. Runework, a full attack transformation, and wards.
  // =========================================================================
  { classId:'unicorn', nodes:{
    // --- branch i: Runeforge ---------------------------------------------
    i1:{ parent:'hub', name:'Runeforge', desc:'She stops improvising the glyph every time and starts keeping a good one. Increases ranged damage by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:0.04 }] },
    i2:{ parent:'i1', name:'Etched Focus', desc:'A groove worn into the horn itself, so the magic always leaves along the same line. Increases critical hit chance by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'critChance', amount:0.04 }] },
    i3:{ parent:'i1', name:'Sigil Depth', desc:'Cut the same rune deeper and it holds a great deal more. Increases ranged damage by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:0.03 }] },
    i4:{ parent:'i2', name:'Hairline Fracture Rune', desc:'A glyph that finds the flaw already in a thing and simply widens it. Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'critChance', amount:0.03 }] },
    i5:{ parent:'i2', cursed:true, name:'Overwritten Glyph', desc:'Layer enough runes over one another and the bolt leaves the horn dragging all of them. Permanently reduces bolt speed by 5%. The runebreaker below is behind it.',
      effects:[{ type:'stat', classId:'unicorn', stat:'boltSpeed', amount:-0.05 }] },
    i6:{ parent:'i3', name:'Softening Ward', desc:'A rune that does no damage at all and makes everything after it hurt more. Increases vulnerable chance by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'vulnerableChance', amount:0.04 }] },
    i7:{ parent:'i3', name:'Layered Runes', desc:'A working stacked three deep tends to turn up things nopony was looking for. Increases luck by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'luck', amount:0.04 }] },
    i8:{ parent:'i4', name:'Killing Glyph', desc:'One rune, one purpose, no ornament anywhere on it. Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'critChance', amount:0.03 }] },
    i9:{ parent:'i5', name:'Runebreaker Bolt', desc:'Slow, heavy, and carrying every glyph she has ever cut. Increases ranged damage by 5%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:0.05 }] },
    i10:{ parent:'i6', name:'Unmade Ward', desc:'Whatever a thing had protecting it, the rune quietly unpicks the knot. Increases vulnerable chance by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'vulnerableChance', amount:0.03 }] },
    i11:{ parent:'i7', name:'Third Inscription', desc:'The third layer is where it stops being decorative and starts being expensive. Increases ranged damage by 3%, at the cost of 4% fire cooldown.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:0.03 }, { type:'stat', classId:'unicorn', stat:'fireCooldown', amount:0.04 }] },
    i12:{ parent:'i9', name:'Glyph of Ruin', desc:'The heaviest working she can hold together, and it barely wants to leave the horn. Increases ranged damage by 3%, at the cost of 4% bolt speed.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:0.03 }, { type:'stat', classId:'unicorn', stat:'boltSpeed', amount:-0.04 }] },
    i13:{ parent:'i10', name:'Wide Open', desc:'By the time the ward is gone the target has run out of ideas. Increases vulnerable chance by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'vulnerableChance', amount:0.03 }] },

    // --- branch j: Shardsong (the attack transformation) ------------------
    // Phase 11 un-bleed pass — j2 used to borrow Crystal Pony's
    // `crystalVolley` flag outright. Now her own `shardFan`, driving the
    // same generic convergent-volley system (shared plumbing) under her
    // own name — `charged` itself stays: it's a plain shared input-mode
    // toggle, same as Kirin's/Crystal Pony's own native use of it.
    j1:{ parent:'hub', cursed:true, name:'Held Breath', desc:'Learning to gather a cast instead of flinging it costs her the easy rhythm she had. Permanently increases fire cooldown by 5%. The whole Shardsong path sits behind this node.',
      effects:[{ type:'stat', classId:'unicorn', stat:'fireCooldown', amount:0.05 }] },
    j2:{ parent:'j1', name:'Shardsong Awakening', desc:'Her horn stops firing loose bolts entirely. Hold the attack to gather a charge; releasing it looses a fan of three shards from across her flank, all converging on wherever she is aiming and ignoring range completely. The wind-up is real and each shard bites 5% softer than a bolt did.',
      effects:[
        { type:'uniqueFlag', classId:'unicorn', field:'charged', value:true },
        { type:'uniqueFlag', classId:'unicorn', field:'shardFan', value:true },
        { type:'uniqueField', classId:'unicorn', field:'crystalShardCount', amount:3, min:0, max:5 },
        { type:'uniqueField', classId:'unicorn', field:'chargeTime', amount:0.55, min:0, max:1.2 },
        { type:'stat', classId:'unicorn', stat:'rangedDamage', amount:-0.05 },
      ] },
    j3:{ parent:'j2', name:'Fourth Facet', desc:'She finds room along her flank for one more shard. Adds a fourth shard to the volley.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'crystalShardCount', amount:1, min:0, max:5 }] },
    j4:{ parent:'j2', name:'Quickened Shards', desc:'Every shard leaves the horn harder than the working strictly requires. Increases bolt speed by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'boltSpeed', amount:0.04 }] },
    j5:{ parent:'j2', cursed:true, name:'Long Draw', desc:'To hold more, she has to hold it longer. Permanently increases her charge time by 0.2s. The snapcast release below is only reachable through it.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'chargeTime', amount:0.2, min:0, max:1.2 }] },
    j6:{ parent:'j3', name:'Fifth Facet', desc:'The widest fan a single horn can hold together. Adds a fifth shard to the volley, at the cost of 4% fire cooldown.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'crystalShardCount', amount:1, min:0, max:5 }, { type:'stat', classId:'unicorn', stat:'fireCooldown', amount:0.04 }] },
    j7:{ parent:'j4', name:'Loosed Clean', desc:'Nothing in the release drags on the shards any more. Increases bolt speed by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'boltSpeed', amount:0.03 }] },
    j8:{ parent:'j5', name:'Snapcast Release', desc:'Having learned to hold a charge properly, she learns to stop holding it. Reduces her charge time by 0.3s.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'chargeTime', amount:-0.3, min:0, max:1.2 }] },
    j9:{ parent:'j6', name:'Shard Weight', desc:'Denser shards, thrown by the same working. Increases ranged damage by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:0.04 }] },
    j10:{ parent:'j7', name:'Shardflight', desc:'Five lines that all arrive at the same spot at very nearly the same instant. Increases bolt speed by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'boltSpeed', amount:0.03 }] },
    j11:{ parent:'j8', name:'Practiced Draw', desc:'The gather stops being a thing she does and becomes a thing that has happened. Reduces her charge time by a further 0.15s.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'chargeTime', amount:-0.15, min:0, max:1.2 }] },
    j12:{ parent:'j9', name:'Prismbreak', desc:'Shards that come apart along their own flaw at the moment of impact. Increases critical hit chance by 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'critChance', amount:0.03 }] },
    j13:{ parent:'j11', name:'Instant Kindling', desc:'Barely a gather left at all — though the shards she throws this fast are noticeably thinner. Reduces her charge time by a further 0.1s, at the cost of 3% ranged damage.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'chargeTime', amount:-0.1, min:0, max:1.2 }, { type:'stat', classId:'unicorn', stat:'rangedDamage', amount:-0.03 }] },

    // --- branch k: Farsight ----------------------------------------------
    k1:{ parent:'hub', name:'Farsight', desc:'The working simply refuses to give up as early as it used to. Increases range by 5%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangeTiles', amount:0.05 }] },
    k2:{ parent:'k1', name:'Long Lens Rune', desc:'A glyph ground the way an astronomer grinds glass. Increases range by a further 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangeTiles', amount:0.04 }] },
    k3:{ parent:'k1', name:'Swift Weave', desc:'Fewer knots in the working, less to drag on it. Increases bolt speed by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'boltSpeed', amount:0.04 }] },
    k4:{ parent:'k2', name:'Horizon Glyph', desc:'Written for distance and nothing else at all. Increases range by a further 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangeTiles', amount:0.04 }] },
    k5:{ parent:'k2', cursed:true, name:'Thinned Weave', desc:'Magic stretched that far arrives spread awfully thin. Permanently reduces ranged damage by 4%. The unbounded bolt below demands it.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:-0.04 }] },
    k6:{ parent:'k3', name:'Slick Casting', desc:'The bolt leaves without catching on anything on the way out. Increases bolt speed by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'boltSpeed', amount:0.03 }] },
    k7:{ parent:'k3', name:'Straight Line Rune', desc:'No arc, no drift, no allowance for anything. Increases critical hit chance by 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'critChance', amount:0.03 }] },
    k8:{ parent:'k4', name:'Wall to Wall', desc:'She has started measuring rooms by whether a bolt crosses them. Increases range by a further 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangeTiles', amount:0.04 }] },
    k9:{ parent:'k5', name:'Unbounded Bolt', desc:'Her bolts stop expiring altogether — they travel until a wall stops them, however far that is, the way a Breezie\'s motes do. Holding a working together that long drags 5% off its bolt speed.',
      effects:[{ type:'uniqueFlag', classId:'unicorn', field:'unlimitedRange', value:true }, { type:'stat', classId:'unicorn', stat:'boltSpeed', amount:-0.05 }] },
    k10:{ parent:'k6', name:'Frictionless Weave', desc:'She has found the last three places the working was rubbing. Increases bolt speed by a further 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'boltSpeed', amount:0.04 }] },
    k11:{ parent:'k7', name:'Dead-On', desc:'The line was correct the moment she thought of it. Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'critChance', amount:0.03 }] },
    k12:{ parent:'k9', name:'Room-Spanning Cast', desc:'She has stopped thinking about range as a thing that applies to her, and started thinking about architecture. Increases range by 4%, at the cost of 4% bolt speed.',
      effects:[{ type:'stat', classId:'unicorn', stat:'rangeTiles', amount:0.04 }, { type:'stat', classId:'unicorn', stat:'boltSpeed', amount:-0.04 }] },

    // --- branch l: Wardweave ---------------------------------------------
    l1:{ parent:'hub', name:'Wardweave', desc:'A standing working that quietly puts her half a step from where she was. Increases dodge chance by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'dodgeChance', amount:0.04 }] },
    l2:{ parent:'l1', name:'Mirror Ward', desc:'There are two of her for a fraction of a second, and the wrong one gets hit. Increases dodge chance by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'dodgeChance', amount:0.03 }] },
    l3:{ parent:'l1', name:'Dread Sigil', desc:'A rune that says nothing except that this was a mistake. Increases fear chance by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'fearChance', amount:0.04 }] },
    l4:{ parent:'l2', name:'Blink Step', desc:'A hoofwidth of teleport, which is all a hoofwidth ever needs to be. Increases dodge chance by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'dodgeChance', amount:0.03 }] },
    l5:{ parent:'l2', cursed:true, name:'Thinned Shield', desc:'Every ward she keeps standing is magic not spent on the one that stops things. Permanently increases damage taken by 5%. The mantle below is on the far side of it.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'damageTakenMult', amount:0.05, min:-0.25, max:0.25 }] },
    l6:{ parent:'l3', name:'Terror Glyph', desc:'Written in a script nothing living has ever been taught and everything living understands. Increases fear chance by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'fearChance', amount:0.03 }] },
    l7:{ parent:'l3', name:'Warded Hide', desc:'A workaday shield rune, kept up out of habit. Reduces damage taken by 5%.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'damageTakenMult', amount:-0.05, min:-0.25, max:0.25 }] },
    l8:{ parent:'l4', name:'Displacement Weave', desc:'She is very slightly not where she appears to be, permanently. Shrinks her body radius by 0.5px.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'radius', amount:-0.5, min:-2, max:2 }] },
    l9:{ parent:'l5', name:'Mantle of Wards', desc:'Having spent everything on standing wards, she finally builds the one worth standing behind. Reduces damage taken by 8%.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'damageTakenMult', amount:-0.08, min:-0.25, max:0.25 }] },
    l10:{ parent:'l6', name:'Panic Sigil', desc:'The glyph does not frighten anything. It simply removes the option of not being frightened. Increases fear chance by a further 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'fearChance', amount:0.03 }] },
    l11:{ parent:'l7', name:'Stonehide Rune', desc:'An old, ugly, extremely effective working. Reduces damage taken by a further 4%.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'damageTakenMult', amount:-0.04, min:-0.25, max:0.25 }] },
    l12:{ parent:'l8', name:'Smaller Target', desc:'The displacement gets folded in until there is genuinely less of her to aim at — and holding it costs her a beat between casts. Shrinks her radius by a further 0.5px, at the cost of 4% fire cooldown.',
      effects:[{ type:'uniqueField', classId:'unicorn', field:'radius', amount:-0.5, min:-2, max:2 }, { type:'stat', classId:'unicorn', stat:'fireCooldown', amount:0.04 }] },
  }},

  // =========================================================================
  // BAT PONY — the night hunter that feeds. Echolocation, blood, and a roost.
  // =========================================================================
  { classId:'batpony', nodes:{
    // --- branch i: Echolocation ------------------------------------------
    i1:{ parent:'hub', name:'Echolocation', desc:'She knows exactly where everything in the room is, which turns out to include exactly how far she can reach it. Extends her melee reach by 0.3 tiles.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'baseRangeTiles', amount:0.3, min:0, max:1.5 }] },
    i2:{ parent:'i1', name:'Pitch-Perfect Read', desc:'The returning call tells her which part of a thing is hollow. Increases critical hit chance by 4%.',
      effects:[{ type:'stat', classId:'batpony', stat:'critChance', amount:0.04 }] },
    i3:{ parent:'i1', name:'Wide Sweep Cry', desc:'A broader call that comes back from more of the room at once. Extends her melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    i4:{ parent:'i2', name:'Weak Point Echo', desc:'Bone rings one way and a gap in it rings another. Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'critChance', amount:0.03 }] },
    i5:{ parent:'i2', cursed:true, name:'Deafening Screech', desc:'A call loud enough to map a cavern is loud enough to leave her reeling in it. Permanently reduces movement speed by 4%. Blind fury is on the other side.',
      effects:[{ type:'stat', classId:'batpony', stat:'speed', amount:-0.04 }] },
    i6:{ parent:'i3', name:'Returning Call', desc:'She has learned to strike on the echo rather than on the sight. Extends her melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    i7:{ parent:'i3', name:'Skull-Rattling Shriek', desc:'The call arrives inside the head rather than at the ear. Increases stun chance by 4%.',
      effects:[{ type:'stat', classId:'batpony', stat:'stunChance', amount:0.04 }] },
    i8:{ parent:'i4', name:'Heartbeat Sonar', desc:'At close range she can hear the one thing worth aiming at. Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'critChance', amount:0.03 }] },
    i9:{ parent:'i5', name:'Blind Fury', desc:'Deafened, half-blind and entirely uninterested in stopping. Increases melee damage by 6%.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeDamage', amount:0.06 }] },
    i10:{ parent:'i6', name:'Cavern Mapping', desc:'She holds the whole shape of the room in her head and swings into the part of it nothing is watching. Extends her melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    i11:{ parent:'i7', name:'Bell in the Bones', desc:'Everything struck keeps ringing for a while afterwards. Increases stun chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'stunChance', amount:0.03 }] },
    i12:{ parent:'i9', name:'Silent Kill', desc:'No call, no warning, nothing at all until it is finished — and no rhythm to it either. Increases melee damage by 4%, at the cost of 4% melee cooldown.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeDamage', amount:0.04 }, { type:'stat', classId:'batpony', stat:'meleeCooldown', amount:0.04 }] },
    i13:{ parent:'i10', name:'Full Chamber Sweep', desc:'One pass that touches every corner of the cavern, slowly. Extends her melee reach by a further 0.25 tiles, at the cost of 3% movement speed.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }, { type:'stat', classId:'batpony', stat:'speed', amount:-0.03 }] },

    // --- branch j: Bloodfeast (her innate lifedrink, pushed) --------------
    j1:{ parent:'hub', cursed:true, name:'Thirst', desc:'A hunger that makes her walk into things she would otherwise walk around. Permanently increases damage taken by 5%. Everything she can drink is downstream of it.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'damageTakenMult', amount:0.05, min:-0.25, max:0.25 }] },
    j2:{ parent:'j1', name:'Deep Drink', desc:'She stops sipping. Increases lifesteal chance by 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'lifestealChance', amount:0.03 }] },
    j3:{ parent:'j1', name:'Second Helping', desc:'Her fangs make more of a kill than they used to. Increases on-kill heal chance by 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'onKillHealChance', amount:0.03 }] },
    j4:{ parent:'j2', name:'Bloodwarm', desc:'Something taken mid-fight goes straight where it is needed. Increases lifesteal chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'lifestealChance', amount:0.03 }] },
    j5:{ parent:'j2', cursed:true, name:'Feverish', desc:'Too much, too fast, and the hooves start arriving late. Permanently increases melee cooldown by 4%. The gorging strike below requires it.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeCooldown', amount:0.04 }] },
    j6:{ parent:'j3', name:'Fang Marrow', desc:'She has stopped leaving the good part. Increases on-kill heal chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'onKillHealChance', amount:0.03 }] },
    j7:{ parent:'j3', name:'Tainted Bite', desc:'Something in a bat pony\'s mouth does not agree with anything else\'s blood. Increases venom chance by 4%.',
      effects:[{ type:'stat', classId:'batpony', stat:'venomChance', amount:0.04 }] },
    j8:{ parent:'j4', name:'Sated', desc:'For about four seconds at a time, she is genuinely fine. Increases lifesteal chance by a further 2%.',
      effects:[{ type:'stat', classId:'batpony', stat:'lifestealChance', amount:0.02 }] },
    j9:{ parent:'j5', name:'Gorging Strike', desc:'The fever burns off into one enormous, badly-considered blow. Increases melee damage by 6%.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeDamage', amount:0.06 }] },
    j10:{ parent:'j6', name:'Never Full', desc:'Feeding this well leaves her considerably harder to put down. Reduces damage taken by 8%.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'damageTakenMult', amount:-0.08, min:-0.25, max:0.25 }] },
    j11:{ parent:'j7', name:'Rot in the Wound', desc:'The bite keeps working long after she has moved on. Increases venom chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'venomChance', amount:0.03 }] },
    j12:{ parent:'j9', name:'Blood Frenzy', desc:'Once she tastes it she stops defending herself entirely. Increases melee damage by 4%, and she takes 4% more damage.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeDamage', amount:0.04 }, { type:'uniqueField', classId:'batpony', field:'damageTakenMult', amount:0.04, min:-0.25, max:0.25 }] },
    j13:{ parent:'j11', name:'Withering Fangs', desc:'Whatever she has bitten is not going to get better on its own. Increases venom chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'venomChance', amount:0.03 }] },

    // --- branch k: Roost Swarm -----------------
    // Phase 11 un-bleed pass — k2 used to borrow Changeling Queen's
    // `summonsChangelings` flag outright. Now her own `summonsRoostmates`,
    // driving the same generic orbiting-helper system under her own name.
    k1:{ parent:'hub', cursed:true, name:'Splitting the Colony', desc:'Whatever she gives the roost, she is no longer carrying herself. Permanently reduces melee damage by 5%. The swarm cannot be called without it.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeDamage', amount:-0.05 }] },
    k2:{ parent:'k1', name:'Roost Swarm', desc:'She calls in roostmates. Small bats peel off the ceiling to circle her and gnaw at whatever she is fighting — up to two at a time, replaced as they wear out.',
      effects:[
        { type:'uniqueFlag', classId:'batpony', field:'summonsRoostmates', value:true },
        { type:'uniqueField', classId:'batpony', field:'changelingMinionDmg', amount:0.45, min:0, max:1.0 },
        { type:'uniqueField', classId:'batpony', field:'changelingMinionRadius', amount:22, min:0, max:40 },
      ] },
    k3:{ parent:'k2', name:'Sharper Little Fangs', desc:'The roost has been eating well. Increases each roostmate\'s damage by 0.15/s.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'changelingMinionDmg', amount:0.15, min:0, max:1.0 }] },
    k4:{ parent:'k2', name:'Wider Circling', desc:'They orbit further out and catch more on each pass. Widens each roostmate\'s reach by 6px.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'changelingMinionRadius', amount:6, min:0, max:40 }] },
    k5:{ parent:'k2', cursed:true, name:'Feeding the Roost', desc:'They do not feed themselves, and she is the nearest thing on the menu. Permanently increases damage taken by 5%. The third roostmate is behind it.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'damageTakenMult', amount:0.05, min:-0.25, max:0.25 }] },
    k6:{ parent:'k3', name:'Bloodhungry Brood', desc:'They have picked up her habits. Increases each roostmate\'s damage by a further 0.12/s.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'changelingMinionDmg', amount:0.12, min:0, max:1.0 }] },
    k7:{ parent:'k4', name:'Loose Formation', desc:'A sloppier orbit that happens to cover considerably more floor. Widens each roostmate\'s reach by a further 5px.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'changelingMinionRadius', amount:5, min:0, max:40 }] },
    k8:{ parent:'k5', name:'Third Roostmate', desc:'One more mouth to feed, and one more set of teeth. Raises the number of roostmates she can keep aloft to three.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'maxChangelingMinions', amount:1, min:0, max:1 }] },
    k9:{ parent:'k6', name:'Ravenous Brood', desc:'They have begun taking the first bite before she does — and taking it out of her share. Increases each roostmate\'s damage by a further 0.1/s, at the cost of 4% of her own melee damage.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'changelingMinionDmg', amount:0.1, min:0, max:1.0 }, { type:'stat', classId:'batpony', stat:'meleeDamage', amount:-0.04 }] },
    k10:{ parent:'k7', name:'Swarm Spread', desc:'The orbit stops being an orbit and starts being weather. Widens each roostmate\'s reach by a further 5px.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'changelingMinionRadius', amount:5, min:0, max:40 }] },
    k11:{ parent:'k8', name:'Answering Screech', desc:'The call goes out sooner and the roost answers faster. Reduces the wait between roostmates by 1.5s.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'changelingSummonCooldown', amount:-1.5, min:-4, max:0 }] },
    k12:{ parent:'k11', name:'The Whole Roost Wakes', desc:'By now the ceiling empties out the moment she enters a room. Reduces the wait between roostmates by a further 1s and widens their reach by 2px.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'changelingSummonCooldown', amount:-1.0, min:-4, max:0 }, { type:'uniqueField', classId:'batpony', field:'changelingMinionRadius', amount:2, min:0, max:40 }] },

    // --- branch l: Nightwing ---------------------------------------------
    l1:{ parent:'hub', name:'Nightwing', desc:'Nothing about a bat\'s flight is predictable, including to the bat. Increases dodge chance by 4%.',
      effects:[{ type:'stat', classId:'batpony', stat:'dodgeChance', amount:0.04 }] },
    l2:{ parent:'l1', name:'Fold and Drop', desc:'She simply stops flying for a moment, which is a very hard thing to aim at. Increases dodge chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'dodgeChance', amount:0.03 }] },
    l3:{ parent:'l1', name:'Membrane Trim', desc:'Less wing than a wing strictly needs. Shrinks her body radius by 0.4px.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'radius', amount:-0.4, min:-2, max:2 }] },
    l4:{ parent:'l2', name:'Erratic Flight', desc:'Even she does not know which way the next beat is taking her. Increases dodge chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'dodgeChance', amount:0.03 }] },
    l5:{ parent:'l2', cursed:true, name:'Sun-Blind', desc:'Anything brighter than a torch leaves her guessing. Permanently reduces critical hit chance by 4%. Moonlit precision is only reachable through it.',
      effects:[{ type:'stat', classId:'batpony', stat:'critChance', amount:-0.04 }] },
    l6:{ parent:'l3', name:'Slender Frame', desc:'There was never much of her, and now there is less. Shrinks her radius by a further 0.4px.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'radius', amount:-0.4, min:-2, max:2 }] },
    l7:{ parent:'l3', name:'Cave Drafts', desc:'She rides the cold air that comes up out of the deep parts. Increases movement speed by 4%.',
      effects:[{ type:'stat', classId:'batpony', stat:'speed', amount:0.04 }] },
    l8:{ parent:'l4', name:'Never Where You Swing', desc:'The gap between where she was and where the blow lands has become a habit. Increases dodge chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'dodgeChance', amount:0.03 }] },
    l9:{ parent:'l5', name:'Moonlit Precision', desc:'Blind by day, and by night better than anything with eyes. Increases critical hit chance by 8%.',
      effects:[{ type:'stat', classId:'batpony', stat:'critChance', amount:0.08 }] },
    l10:{ parent:'l6', name:'Whisper-Thin', desc:'She passes through a doorway without the doorway noticing. Shrinks her radius by a further 0.4px.',
      effects:[{ type:'uniqueField', classId:'batpony', field:'radius', amount:-0.4, min:-2, max:2 }] },
    l11:{ parent:'l7', name:'Roost Speed', desc:'The flight home is always the fastest one. Increases movement speed by a further 4%.',
      effects:[{ type:'stat', classId:'batpony', stat:'speed', amount:0.04 }] },
    l12:{ parent:'l9', name:'Hunter of the Dark', desc:'She has stopped hunting cautiously, on the grounds that it was slowing her down. Increases melee damage by 4%, and she takes 4% more damage.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeDamage', amount:0.04 }, { type:'uniqueField', classId:'batpony', field:'damageTakenMult', amount:0.04, min:-0.25, max:0.25 }] },
  }},

  // =========================================================================
  // ZEBRA — the apothecary brawler. Brews, thrown gourds, and warpaint.
  // (No venomChance anywhere here: -characters-2.js already puts her at
  //  +0.24 of the 0.25 cap.)
  // =========================================================================
  { classId:'zebra', nodes:{
    // --- branch i: Apothecary's Satchel -----------------------------------
    i1:{ parent:'hub', name:"Apothecary's Satchel", desc:'Everything she has ever ground, steeped or dried, carried in one bag and applied by hoof. Increases stun chance by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'stunChance', amount:0.04 }] },
    i2:{ parent:'i1', name:'Sleeproot Paste', desc:'A smear along the hoof-edge that ends arguments quietly. Increases stun chance by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'stunChance', amount:0.03 }] },
    i3:{ parent:'i1', name:'Dreamsmoke', desc:'Whatever is in the smoke, things stop wanting to fight her. Increases charm chance by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'charmChance', amount:0.04 }] },
    i4:{ parent:'i2', name:'Numbing Salve', desc:'It does not hurt. That is rather the problem with it. Increases stun chance by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'stunChance', amount:0.03 }] },
    i5:{ parent:'i2', cursed:true, name:'Fumes in the Satchel', desc:'She has been breathing her own workshop for years and it shows in the stride. Permanently reduces movement speed by 4%. The distillate below demands it.',
      effects:[{ type:'stat', classId:'zebra', stat:'speed', amount:-0.04 }] },
    i6:{ parent:'i3', name:'Honeyed Draught', desc:'Sweet enough that nothing questions why it was offered. Increases charm chance by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'charmChance', amount:0.03 }] },
    i7:{ parent:'i3', name:'Ashen Powder', desc:'A pinch thrown into the air, and the room remembers something it would rather not. Increases fear chance by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'fearChance', amount:0.04 }] },
    i8:{ parent:'i4', name:'Weakening Tincture', desc:'It takes the stiffening out of anything it touches. Increases vulnerable chance by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'vulnerableChance', amount:0.04 }] },
    i9:{ parent:'i5', name:'Distilled Ferocity', desc:'She has finally brewed the one she was always going to brew. Increases melee damage by 5%.',
      effects:[{ type:'stat', classId:'zebra', stat:'meleeDamage', amount:0.05 }] },
    i10:{ parent:'i6', name:'Whispered Suggestion', desc:'The brew does the listening; she only has to say it once. Increases charm chance by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'charmChance', amount:0.03 }] },
    i11:{ parent:'i7', name:'Terror Brew', desc:'Bottled, corked, and opened only when a room needs emptying. Increases fear chance by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'fearChance', amount:0.03 }] },
    i12:{ parent:'i8', name:'Solvent Coating', desc:'It eats through hide, plate and resolve at roughly the same rate — and it eats through her hoof-wraps too, so she has to re-dress between blows. Increases vulnerable chance by a further 3%, at the cost of 4% melee cooldown.',
      effects:[{ type:'stat', classId:'zebra', stat:'vulnerableChance', amount:0.03 }, { type:'stat', classId:'zebra', stat:'meleeCooldown', amount:0.04 }] },
    i13:{ parent:'i11', name:'Night-Terror Draught', desc:'The strongest thing in the satchel, and she does not open it lightly. Increases fear chance by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'fearChance', amount:0.03 }] },

    // --- branch j: Gourd and Sling ---------------------------------------
    j1:{ parent:'hub', name:'Gourd and Sling', desc:'A dried gourd of something unpleasant, swung on a cord instead of thrown. Extends her melee reach by 0.3 tiles.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'baseRangeTiles', amount:0.3, min:0, max:1.5 }] },
    j2:{ parent:'j1', name:'Long Sling', desc:'More cord, more arc, more room between her and the thing being hit. Extends her melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    // Phase 11 — un-bleed pass: j3/j6/j10/j13 used to borrow Diamond Dog's
    // `shockwaveAttack` flag ("her strikes shatter rock") plus three
    // rockCoinChance payouts riding on it. Replaced with her own apothecary
    // identity instead — the gourd carries a toxin, not a hammer.
    j3:{ parent:'j1', name:'Pestle Hoof', desc:'She grinds her own pigment, and whatever else is in the gourd goes on the strike too. Increases venom chance by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'venomChance', amount:0.04 }] },
    j4:{ parent:'j2', name:'Whirled Gourd', desc:'Spun overhead until it stops being a container and starts being a weapon. Extends her melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    j5:{ parent:'j2', cursed:true, name:'Overextended Sling', desc:'A blow landed at the end of a cord is a blow she is not standing behind. Permanently reduces melee damage by 5%. The shattering gourd below is behind it.',
      effects:[{ type:'stat', classId:'zebra', stat:'meleeDamage', amount:-0.05 }] },
    j6:{ parent:'j3', name:'Pigment from Stone', desc:'She has learned to read exactly how a body reacts to the mix. Increases venom chance by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'venomChance', amount:0.03 }] },
    j7:{ parent:'j3', name:'Grit Underhoof', desc:'Powdered stone worked into the wrappings makes every strike bite deeper. Increases vulnerable chance by 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'vulnerableChance', amount:0.03 }] },
    j8:{ parent:'j4', name:'Arcing Throw', desc:'Over the heads of the front rank and into the ones behind it. Extends her melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }] },
    j9:{ parent:'j5', name:'Shattering Gourd', desc:'The gourd is not meant to survive the hit and neither is anything under it. Increases melee damage by 6%.',
      effects:[{ type:'stat', classId:'zebra', stat:'meleeDamage', amount:0.06 }] },
    j10:{ parent:'j6', name:'Ochre Seam', desc:'The dose has crept up without her quite meaning it to. Increases venom chance by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'venomChance', amount:0.03 }] },
    j11:{ parent:'j8', name:'Far Toss', desc:'At this length the cord is doing all the work and none of the timing. Extends her melee reach by a further 0.25 tiles, at the cost of 4% melee cooldown.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'baseRangeTiles', amount:0.25, min:0, max:1.5 }, { type:'stat', classId:'zebra', stat:'meleeCooldown', amount:0.04 }] },
    j12:{ parent:'j9', name:'Sling and Strike', desc:'Gourd first, hoof immediately behind it, and she has stopped bothering to recover between the two. Increases critical hit chance by 2%, at the cost of 3% movement speed.',
      effects:[{ type:'stat', classId:'zebra', stat:'critChance', amount:0.02 }, { type:'stat', classId:'zebra', stat:'speed', amount:-0.03 }] },
    j13:{ parent:'j10', name:'Nothing Wasted from the Rubble', desc:'Nothing in the satchel goes to waste, out of pure habit now. Increases venom chance by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'venomChance', amount:0.03 }] },

    // --- branch k: Warpaint ----------------------------------------------
    k1:{ parent:'hub', name:'Warpaint', desc:'The stripes were always there. The paint over them is a decision. Reduces damage taken by 5%.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'damageTakenMult', amount:-0.05, min:-0.25, max:0.25 }] },
    k2:{ parent:'k1', name:'Ash Stripe', desc:'Cold ash worked into the coat, which turns out to be genuinely good armour. Reduces damage taken by a further 4%.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'damageTakenMult', amount:-0.04, min:-0.25, max:0.25 }] },
    k3:{ parent:'k1', name:'Lean Frame', desc:'Nothing carried that she cannot use twice. Shrinks her body radius by 0.4px.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'radius', amount:-0.4, min:-2, max:2 }] },
    k4:{ parent:'k2', name:'Ritual Scarring', desc:'Old marks, deliberately made, over exactly the places that get hit. Reduces damage taken by a further 3%.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'damageTakenMult', amount:-0.03, min:-0.25, max:0.25 }] },
    k5:{ parent:'k2', cursed:true, name:'Paint Runs in the Rain', desc:'A blessing that washes off is a blessing you stop relying on. Permanently reduces luck by 4%. What is underneath it is only reachable through it.',
      effects:[{ type:'stat', classId:'zebra', stat:'luck', amount:-0.04 }] },
    k6:{ parent:'k3', name:'Whittled Down', desc:'Years on the plains take everything off a zebra that is not load-bearing. Shrinks her radius by a further 0.4px.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'radius', amount:-0.4, min:-2, max:2 }] },
    k7:{ parent:'k3', name:'Plains Stride', desc:'A gait built for crossing something enormous without hurrying. Increases movement speed by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'speed', amount:0.04 }] },
    k8:{ parent:'k4', name:'Spirit-Marked Hide', desc:'Something has been asked to watch over this coat, and it has agreed. Reduces damage taken by a further 3%.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'damageTakenMult', amount:-0.03, min:-0.25, max:0.25 }] },
    k9:{ parent:'k5', name:'Blessing Beneath the Paint', desc:'The paint was never the protection. Reduces damage taken by 6%.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'damageTakenMult', amount:-0.06, min:-0.25, max:0.25 }] },
    k10:{ parent:'k6', name:'Sliver of a Zebra', desc:'Stripes edge-on, which is very nearly nothing at all. Shrinks her radius by a further 0.4px.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'radius', amount:-0.4, min:-2, max:2 }] },
    k11:{ parent:'k7', name:'Savanna Pace', desc:'She could keep this up until the horizon changed. Increases movement speed by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'speed', amount:0.03 }] },
    k12:{ parent:'k9', name:'Second Skin', desc:'The paint, the ash and the scars have stopped being separate things — and the whole stiff shell of it slows her swing. Reduces damage taken by a further 3%, at the cost of 4% melee cooldown.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'damageTakenMult', amount:-0.03, min:-0.25, max:0.25 }, { type:'stat', classId:'zebra', stat:'meleeCooldown', amount:0.04 }] },

    // --- branch l: The Bone Toll -----------------------------------------
    l1:{ parent:'hub', cursed:true, name:'The Bone Toll', desc:'The hardest-hitting hoof in Equestria is paid for in hide, and the bill comes every time. Permanently increases damage taken by 6%. Nothing on this branch is available without paying it.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'damageTakenMult', amount:0.06, min:-0.25, max:0.25 }] },
    l2:{ parent:'l1', name:'Killing Stripe', desc:'One mark on the foreleg for each fight that only needed one blow. Increases critical hit chance by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'critChance', amount:0.04 }] },
    l3:{ parent:'l1', name:'Herd-Breaker', desc:'She has learned to swing through the second one before the first has finished falling. Reduces melee cooldown by 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'meleeCooldown', amount:-0.03 }] },
    l4:{ parent:'l2', name:'Marrow Read', desc:'She can hear which bone is going to go. Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'critChance', amount:0.03 }] },
    l5:{ parent:'l2', cursed:true, name:'Ribs Showing', desc:'Everything she has has gone into the blow and none of it into the frame throwing it. Permanently increases damage taken by 5%. The toll below is paid here.',
      effects:[{ type:'uniqueField', classId:'zebra', field:'damageTakenMult', amount:0.05, min:-0.25, max:0.25 }] },
    l6:{ parent:'l3', name:'Full-Weight Kick', desc:'Both hind hooves, no hesitation, nothing held in reserve for the landing. Increases melee damage by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'meleeDamage', amount:0.04 }] },
    l7:{ parent:'l3', name:'Stampede Momentum', desc:'She has stopped stopping between targets, though the wind-up is longer for it. Increases movement speed by 4%, at the cost of 3% melee cooldown.',
      effects:[{ type:'stat', classId:'zebra', stat:'speed', amount:0.04 }, { type:'stat', classId:'zebra', stat:'meleeCooldown', amount:0.03 }] },
    l8:{ parent:'l4', name:'Between the Ribs', desc:'There is a gap, it is always in the same place, and she never misses it twice. Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'critChance', amount:0.03 }] },
    l9:{ parent:'l5', name:'Bone-Toll Reckoning', desc:'Everything the toll was ever paid toward, delivered in a single hoof. Increases melee damage by 7%.',
      effects:[{ type:'stat', classId:'zebra', stat:'meleeDamage', amount:0.07 }] },
    l10:{ parent:'l6', name:'Cracking Blow', desc:'Whatever survives the first one is in no condition to argue with the second. Increases vulnerable chance by 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'vulnerableChance', amount:0.03 }] },
    l11:{ parent:'l7', name:'Long Gallop', desc:'The plains taught her that arriving is most of it. Increases movement speed by a further 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'speed', amount:0.03 }] },
    l12:{ parent:'l9', name:'Last Toll', desc:'She stops keeping anything back for a fight after this one. Increases critical hit chance by 2%, and she takes 4% more damage.',
      effects:[{ type:'stat', classId:'zebra', stat:'critChance', amount:0.02 }, { type:'uniqueField', classId:'zebra', field:'damageTakenMult', amount:0.04, min:-0.25, max:0.25 }] },
  }},
];

// Build. `parent` in the table above is either the literal string 'hub'
// (meaning that character's existing char_hub_<classId> node) or a local key
// within the SAME character's block — never a raw id, so nothing here can
// accidentally reference another character's tree. Cost is 1 point per node,
// same convention as every other skill node in the game.
const SKILL_TREE_CHARACTER_NODES_4A = [];
(function buildCharacterSkillNodes4A(){
  for (const cfg of SKILL_TREE_CHARACTER_CONFIG_4A) {
    const classId = cfg.classId;
    for (const key in cfg.nodes) {
      const content = cfg.nodes[key];
      const node = {
        id: 'char_' + classId + '_' + key,
        parent: content.parent === 'hub' ? 'char_hub_' + classId : 'char_' + classId + '_' + content.parent,
        cost: 1,
        name: content.name,
        desc: content.desc,
        effects: content.effects,
      };
      if (content.cursed) node.cursed = true;
      SKILL_TREE_CHARACTER_NODES_4A.push(node);
    }
  }
})();

for (const n of SKILL_TREE_CHARACTER_NODES_4A) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

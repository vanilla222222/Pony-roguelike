'use strict';
// achievements/skilltree-characters-2.js — Phase 8c-2: 250 MORE character
// skill nodes (10 more per character x 25 classes), branches C and D,
// appended as siblings of the existing A1/B1 openers under the same
// char_hub_<classId> parent already used by skilltree-characters.js (Phase
// 8c). No engine logic lives here — see achievements/skilltree.js for
// canBuySkillNode, buySkillNode, getSkillTreeStatBonus,
// applySkillTreeUniqueFieldBonuses, applySkillTreeUniqueFlagEffects, etc.
//
// Topology (identical shape for every character, attached under that
// character's existing char_hub_<classId> hub node, alongside the existing
// a1/b1 branches from skilltree-characters.js):
//
//   char_hub_<classId>
//     +- a1 / b1  (Phase 8c — generic stat branches, skilltree-characters.js)
//     +- c1 (branch C opener)
//     |    +- c2a (subpath 1) -> c3a (deepest)
//     |    +- c2b (subpath 2) -> c3b (deepest)
//     +- d1 (branch D opener)
//          +- d2a (subpath 1) -> d3a (deepest)
//          +- d2b (subpath 2) -> d3b (deepest)
//
// Every hub now has exactly 4 direct children (a1, b1, c1, d1) and every
// character has 20 non-hub nodes total (10 old + 10 new).
//
// Design (per the Phase 8c-2 brief):
//  - The 15 classes with a real unique mechanic (ponybot, dragon, windigo,
//    kelpie, breezie, crystalpony, changeling, diamonddog, gargoyle,
//    changedling, changelingqueen, filly, engineerpony, batpony, dnbpony)
//    get nodes that tune/trade off that mechanic's REAL parameters —
//    uniqueField effects against shadow fields on `player` (some newly
//    added this pass, see entities.js/combat-1.js), several as two-effect
//    trade-off nodes (a stat nerf paired with a uniqueField buff).
//  - The 10 stat-only classes (earth, pegasus, unicorn, zebra, hypogriff,
//    seapony, griffin, kirin, mule, alicorn) each get a NEW mechanic
//    unlocked via branch C, borrowed from an already-implemented generic
//    on-hit-chance field or another class's mechanic (see the classId ->
//    field mapping in each entry below). Two of them (earth, alicorn) use a
//    genuine uniqueFlag boolean (shockwaveAttack / innateFireRing); the
//    other eight use a plain `stat` effect against a chance field that is
//    already generically aggregated in items-1.js's recalcPlayerStats
//    (venomChance/stunChance/charmChance/freezeChance/vulnerableChance/
//    lifestealChance/onKillHealChance/dodgeChance) — see skilltree.js's new
//    SKILL_TREE_ADDITIVE_STAT_FIELDS: these fields are handled ADDITIVELY
//    (player[stat] += bonus), not multiplicatively, specifically because
//    most classes sit at exactly 0 on them with no items equipped, and a
//    multiplicative bonus on 0 is a no-op.
//
// Amount/cap discipline: for every character, for every 'stat'-type field
// they touch across the FULL 20-node set (10 old + 10 new), the worst-case
// summed bonus stays within skilltree.js's symmetric [-0.25, 0.25] clamp.
// New branches here deliberately target fields the OLD 10 nodes for that
// same character never touch (verified per-class below), so old and new
// sums never combine on the same field except where called out explicitly
// (e.g. a handful of two-effect trade-off nodes that nudge rangedDamage a
// little further down — always checked to stay within bounds combined with
// the old branch's own worst case). uniqueField bounds are chosen per
// mechanic (min/max kept IDENTICAL across every node targeting the same
// classId+field pair, per the Phase 8b-uniquefx audit's own guidance).
// Cost is 1 point per node, same convention as every other skill node.

const SKILL_TREE_CHARACTER_CONFIG_2 = [
  // ---------------------------------------------------------------------
  // 10 stat-only classes — branch C grants/scales a borrowed mechanic,
  // branch D is a generic complementary buff on a field the old 10 nodes
  // for that character never touch.
  // ---------------------------------------------------------------------
  { classId:'earth', nodes:{
    // Phase 11 un-bleed pass — this used to borrow Diamond Dog's
    // `shockwaveAttack` flag outright ("same as Diamond Dog's claw"), a
    // SECOND, earlier grant of the same borrow later repeated in
    // skilltree-characters-4a.js's own j-branch (already fixed). Retargeted
    // to a flat melee damage bump — no flag needed at all, since nothing
    // downstream in this branch depends on rock-shattering specifically.
    c1:{ name:'Pickaxe Instinct', desc:'Her hooves learn a miner\'s trick: every swing lands with the calibrated weight of somepony who has spent years breaking stone. Increases melee damage by 5%.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeDamage', amount:0.05 }] },
    c2a:{ name:"Quarryhand's Rhythm", desc:'Years of swinging a pick teach a faster recovery. Reduces melee cooldown by 5%.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeCooldown', amount:-0.05 }] },
    c3a:{ name:'Practiced Swing', desc:'No wasted motion between hits. Reduces melee cooldown by 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeCooldown', amount:-0.04 }] },
    c2b:{ name:'Steady Cadence', desc:'A workmanlike pace that never falters. Reduces melee cooldown by 5%.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeCooldown', amount:-0.05 }] },
    c3b:{ name:"Well-Oiled Stomp", desc:'Every strike flows straight into the next. Reduces melee cooldown by 4%.',
      effects:[{ type:'stat', classId:'earth', stat:'meleeCooldown', amount:-0.04 }] },
    // Phase 11 un-bleed pass — this whole d-branch used to pay out coins
    // from shattered rocks, downstream of the now-removed shockwaveAttack
    // borrow above. Retargeted to plain luck so nothing here goes dead.
    d1:{ name:'Coin in the Rubble', desc:"An eye for what the ground leaves behind. Increases luck by 2%.",
      effects:[{ type:'stat', classId:'earth', stat:'luck', amount:0.02 }] },
    d2a:{ name:'Glint Among Gravel', desc:'Increases luck by a further 2%.',
      effects:[{ type:'stat', classId:'earth', stat:'luck', amount:0.02 }] },
    d3a:{ name:'Seasoned Prospecting', desc:'Increases luck by a further 2%.',
      effects:[{ type:'stat', classId:'earth', stat:'luck', amount:0.02 }] },
    d2b:{ name:'Sharp-Eyed Digging', desc:'Increases luck by a further 2%.',
      effects:[{ type:'stat', classId:'earth', stat:'luck', amount:0.02 }] },
    d3b:{ name:'Nothing Left Behind', desc:'Increases luck by a further 2%.',
      effects:[{ type:'stat', classId:'earth', stat:'luck', amount:0.02 }] },
  }},
  { classId:'pegasus', nodes:{
    c1:{ name:'Evasive Instinct', desc:'A flier\'s reflex for slipping a hit entirely. Increases dodge chance by 6%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'dodgeChance', amount:0.06 }] },
    c2a:{ name:'Barrel Roll', desc:'A tight roll that puts her somewhere the blow isn\'t. Increases dodge chance by 5%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'dodgeChance', amount:0.05 }] },
    c3a:{ name:'Wingtip Slip', desc:'The smallest wing-flick is enough to slide clear. Increases dodge chance by 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'dodgeChance', amount:0.04 }] },
    c2b:{ name:'Reflexive Bank', desc:'Banking away before the mind even registers the threat. Increases dodge chance by 5%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'dodgeChance', amount:0.05 }] },
    c3b:{ name:'Never There', desc:'By the time a blow lands, she\'s already elsewhere. Increases dodge chance by 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'dodgeChance', amount:0.04 }] },
    d1:{ name:'Snap Jab', desc:'A quick strike thrown and recovered from in a blink. Reduces melee cooldown by 5%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeCooldown', amount:-0.05 }] },
    d2a:{ name:'Quickstrike Wing', desc:'A wingbeat timed into the recovery. Reduces melee cooldown by 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeCooldown', amount:-0.04 }] },
    d3a:{ name:'Feint and Peck', desc:'Never committing fully enough to be caught slow. Reduces melee cooldown by 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeCooldown', amount:-0.03 }] },
    d2b:{ name:'Loose Wrist', desc:'A relaxed strike that snaps back to guard fast. Reduces melee cooldown by 4%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeCooldown', amount:-0.04 }] },
    d3b:{ name:'Flash Combo', desc:'One hit rolling straight into the next. Reduces melee cooldown by 3%.',
      effects:[{ type:'stat', classId:'pegasus', stat:'meleeCooldown', amount:-0.03 }] },
  }},
  { classId:'unicorn', nodes:{
    c1:{ name:'Hypnotic Glimmer', desc:'A shimmer woven into the bolt itself. Increases charm chance by 6%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'charmChance', amount:0.06 }] },
    c2a:{ name:'Beguiling Sigil', desc:'A rune meant to fascinate, not to harm. Increases charm chance by 5%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'charmChance', amount:0.05 }] },
    c3a:{ name:'Entrancing Weave', desc:'Magic braided to catch the eye and hold it. Increases charm chance by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'charmChance', amount:0.04 }] },
    c2b:{ name:'Silvered Suggestion', desc:'A gentle push dressed up as a whim. Increases charm chance by 5%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'charmChance', amount:0.05 }] },
    c3b:{ name:'Perfect Persuasion', desc:'Nothing resists a properly cast suggestion. Increases charm chance by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'charmChance', amount:0.04 }] },
    d1:{ name:'Quickcast Reflex', desc:'The casting glyph fires the instant it completes. Reduces fire cooldown by 5%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'fireCooldown', amount:-0.05 }] },
    d2a:{ name:'Snapping Sigil', desc:'A rune shaped for speed over subtlety. Reduces fire cooldown by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'fireCooldown', amount:-0.04 }] },
    d3a:{ name:'Instant Discharge', desc:'Magic released the moment it\'s ready, no lingering. Reduces fire cooldown by 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'fireCooldown', amount:-0.03 }] },
    d2b:{ name:'Reflexive Weave', desc:'Casting on pure muscle memory. Reduces fire cooldown by 4%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'fireCooldown', amount:-0.03 }] },
    d3b:{ name:'No Wasted Motion', desc:'Every cast flows straight into the next. Reduces fire cooldown by 3%.',
      effects:[{ type:'stat', classId:'unicorn', stat:'fireCooldown', amount:-0.03 }] },
  }},
  { classId:'zebra', nodes:{
    c1:{ name:"Apothecary's Touch", desc:'A hoof dipped in something the plains taught her to brew. Increases venom chance by 6%.',
      effects:[{ type:'stat', classId:'zebra', stat:'venomChance', amount:0.06 }] },
    c2a:{ name:'Bitter Root Coating', desc:'A paste ground from roots that don\'t forgive. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'zebra', stat:'venomChance', amount:0.05 }] },
    c3a:{ name:'Nightshade Edge', desc:'A hoof-edge that carries more than just force. Increases venom chance by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'venomChance', amount:0.04 }] },
    c2b:{ name:'Tribal Toxin', desc:'A recipe passed down for generations. Increases venom chance by 5%.',
      effects:[{ type:'stat', classId:'zebra', stat:'venomChance', amount:0.05 }] },
    c3b:{ name:'Lethal Brew', desc:'The strongest mixture she\'s ever carried. Increases venom chance by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'venomChance', amount:0.04 }] },
    d1:{ name:'Practiced Ferocity', desc:'A savanna hunter\'s efficient strike. Reduces melee cooldown by 5%.',
      effects:[{ type:'stat', classId:'zebra', stat:'meleeCooldown', amount:-0.05 }] },
    d2a:{ name:'Second Strike Instinct', desc:'Never letting a foe recover between hits. Reduces melee cooldown by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'meleeCooldown', amount:-0.04 }] },
    d3a:{ name:'Relentless Assault', desc:'One strike bleeds straight into the next. Reduces melee cooldown by 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'meleeCooldown', amount:-0.03 }] },
    d2b:{ name:'Combat Cadence', desc:'A fighting rhythm honed on the plains. Reduces melee cooldown by 4%.',
      effects:[{ type:'stat', classId:'zebra', stat:'meleeCooldown', amount:-0.03 }] },
    d3b:{ name:'No Hesitation', desc:'Not a wasted heartbeat between blows. Reduces melee cooldown by 3%.',
      effects:[{ type:'stat', classId:'zebra', stat:'meleeCooldown', amount:-0.03 }] },
  }},
  { classId:'hypogriff', nodes:{
    c1:{ name:'Talon Clap', desc:'A stunning blow struck with the flat of a talon. Increases stun chance by 6%.',
      effects:[{ type:'stat', classId:'hypogriff', stat:'stunChance', amount:0.06 }] },
    c2a:{ name:'Concussive Grip', desc:'A grip that rattles the skull as much as it holds. Increases stun chance by 5%.',
      effects:[{ type:'stat', classId:'hypogriff', stat:'stunChance', amount:0.05 }] },
    c3a:{ name:'Rattling Strike', desc:'A hit that shakes loose everything but consciousness — barely. Increases stun chance by 4%.',
      effects:[{ type:'stat', classId:'hypogriff', stat:'stunChance', amount:0.04 }] },
    c2b:{ name:'Skullcrack Talon', desc:'Aimed precisely where it hurts most to think straight. Increases stun chance by 5%.',
      effects:[{ type:'stat', classId:'hypogriff', stat:'stunChance', amount:0.05 }] },
    c3b:{ name:'Bell-Ringer', desc:'A hit that leaves ears ringing and knees weak. Increases stun chance by 4%.',
      effects:[{ type:'stat', classId:'hypogriff', stat:'stunChance', amount:0.04 }] },
    d1:{ name:"Predator Reflex", desc:'Eagle eyes, lion reflexes. Reduces melee cooldown by 5%.',
      effects:[{ type:'stat', classId:'hypogriff', stat:'meleeCooldown', amount:-0.05 }] },
    d2a:{ name:'Snap Pounce', desc:'Committing and recovering in the same breath. Reduces melee cooldown by 4%.',
      effects:[{ type:'stat', classId:'hypogriff', stat:'meleeCooldown', amount:-0.04 }] },
    d3a:{ name:'Relentless Talons', desc:'One strike is never the last. Reduces melee cooldown by 3%.',
      effects:[{ type:'stat', classId:'hypogriff', stat:'meleeCooldown', amount:-0.03 }] },
    d2b:{ name:'Rapid Combo', desc:'A flurry too fast for anything to answer. Reduces melee cooldown by 4%.',
      effects:[{ type:'stat', classId:'hypogriff', stat:'meleeCooldown', amount:-0.03 }] },
    d3b:{ name:'No Recovery Needed', desc:'Predator and pursuit in the same motion. Reduces melee cooldown by 3%.',
      effects:[{ type:'stat', classId:'hypogriff', stat:'meleeCooldown', amount:-0.03 }] },
  }},
  { classId:'seapony', nodes:{
    c1:{ name:'Chill Current', desc:'A bolt drawn up from the coldest depths. Increases freeze chance by 6%.',
      effects:[{ type:'stat', classId:'seapony', stat:'freezeChance', amount:0.06 }] },
    c2a:{ name:'Undertow Frost', desc:'Cold enough to drag the warmth out of a wound. Increases freeze chance by 5%.',
      effects:[{ type:'stat', classId:'seapony', stat:'freezeChance', amount:0.05 }] },
    c3a:{ name:'Glacial Wake', desc:'The water itself seems to slow behind every shot. Increases freeze chance by 4%.',
      effects:[{ type:'stat', classId:'seapony', stat:'freezeChance', amount:0.04 }] },
    c2b:{ name:'Icebound Tide', desc:'A rolling tide with a killing chill underneath. Increases freeze chance by 5%.',
      effects:[{ type:'stat', classId:'seapony', stat:'freezeChance', amount:0.05 }] },
    c3b:{ name:'Absolute Current', desc:'Nothing that current touches stays warm for long. Increases freeze chance by 4%.',
      effects:[{ type:'stat', classId:'seapony', stat:'freezeChance', amount:0.04 }] },
    d1:{ name:'Rolling Barrage', desc:'One wave crests right behind the last. Reduces fire cooldown by 5%.',
      effects:[{ type:'stat', classId:'seapony', stat:'fireCooldown', amount:-0.05 }] },
    d2a:{ name:'Quickened Tide', desc:'A faster ebb and flow to every shot. Reduces fire cooldown by 4%.',
      effects:[{ type:'stat', classId:'seapony', stat:'fireCooldown', amount:-0.04 }] },
    d3a:{ name:'Wave After Wave', desc:'No lull between one bolt and the next. Reduces fire cooldown by 3%.',
      effects:[{ type:'stat', classId:'seapony', stat:'fireCooldown', amount:-0.03 }] },
    d2b:{ name:'Surging Rhythm', desc:'A cadence the sea itself seems to keep. Reduces fire cooldown by 4%.',
      effects:[{ type:'stat', classId:'seapony', stat:'fireCooldown', amount:-0.03 }] },
    d3b:{ name:'Ceaseless Current', desc:'The tide never actually stops moving. Reduces fire cooldown by 3%.',
      effects:[{ type:'stat', classId:'seapony', stat:'fireCooldown', amount:-0.03 }] },
  }},
  { classId:'griffin', nodes:{
    c1:{ name:"Predator's Feast", desc:'A hunter that never wastes a kill. Increases on-kill heal chance by 6%.',
      effects:[{ type:'stat', classId:'griffin', stat:'onKillHealChance', amount:0.06 }] },
    c2a:{ name:'Blood Price', desc:'Every fallen foe pays a little back. Increases on-kill heal chance by 5%.',
      effects:[{ type:'stat', classId:'griffin', stat:'onKillHealChance', amount:0.05 }] },
    c3a:{ name:"Talon's Toll", desc:'Nothing dies without leaving something behind. Increases on-kill heal chance by 4%.',
      effects:[{ type:'stat', classId:'griffin', stat:'onKillHealChance', amount:0.04 }] },
    c2b:{ name:"Scavenger's Mercy", desc:'A hunter\'s old habit of taking what a kill offers. Increases on-kill heal chance by 5%.',
      effects:[{ type:'stat', classId:'griffin', stat:'onKillHealChance', amount:0.05 }] },
    c3b:{ name:'Nothing Wasted', desc:'Every kill counts for something more. Increases on-kill heal chance by 4%.',
      effects:[{ type:'stat', classId:'griffin', stat:'onKillHealChance', amount:0.04 }] },
    d1:{ name:'Rapid Volley', desc:'Feathers loosed almost as fast as they\'re drawn. Reduces fire cooldown by 5%.',
      effects:[{ type:'stat', classId:'griffin', stat:'fireCooldown', amount:-0.05 }] },
    d2a:{ name:'Loose Faster', desc:'A quicker draw on every following shot. Reduces fire cooldown by 4%.',
      effects:[{ type:'stat', classId:'griffin', stat:'fireCooldown', amount:-0.04 }] },
    d3a:{ name:'Reload Reflex', desc:'The next feather is ready before the last one lands. Reduces fire cooldown by 3%.',
      effects:[{ type:'stat', classId:'griffin', stat:'fireCooldown', amount:-0.03 }] },
    d2b:{ name:'Molt and Fire', desc:'Barely a pause between one volley and the next. Reduces fire cooldown by 4%.',
      effects:[{ type:'stat', classId:'griffin', stat:'fireCooldown', amount:-0.03 }] },
    d3b:{ name:"Windrider's Cadence", desc:'A hunting rhythm that never breaks stride. Reduces fire cooldown by 3%.',
      effects:[{ type:'stat', classId:'griffin', stat:'fireCooldown', amount:-0.03 }] },
  }},
  { classId:'kirin', nodes:{
    c1:{ name:'Spirit-Fire Brand', desc:'A mark burned in with wrathful flame. Increases vulnerable chance by 6%.',
      effects:[{ type:'stat', classId:'kirin', stat:'vulnerableChance', amount:0.06 }] },
    c2a:{ name:'Searing Mark', desc:'A brand that leaves a foe open to everything that follows. Increases vulnerable chance by 5%.',
      effects:[{ type:'stat', classId:'kirin', stat:'vulnerableChance', amount:0.05 }] },
    c3a:{ name:'Wrathful Sigil', desc:'Anger given a shape and pressed into the target. Increases vulnerable chance by 4%.',
      effects:[{ type:'stat', classId:'kirin', stat:'vulnerableChance', amount:0.04 }] },
    c2b:{ name:'Smoldering Brand', desc:'A mark that keeps burning long after the shot lands. Increases vulnerable chance by 5%.',
      effects:[{ type:'stat', classId:'kirin', stat:'vulnerableChance', amount:0.05 }] },
    c3b:{ name:'Judgment Flame', desc:'A single mark that decides how the fight ends. Increases vulnerable chance by 4%.',
      effects:[{ type:'stat', classId:'kirin', stat:'vulnerableChance', amount:0.04 }] },
    d1:{ name:'Boiling Point', desc:'Wrath that never has time to cool between shots. Reduces fire cooldown by 5%.',
      effects:[{ type:'stat', classId:'kirin', stat:'fireCooldown', amount:-0.05 }] },
    d2a:{ name:'Quicker Fuse', desc:'Anger that catches faster every time. Reduces fire cooldown by 4%.',
      effects:[{ type:'stat', classId:'kirin', stat:'fireCooldown', amount:-0.04 }] },
    d3a:{ name:'Flashpoint Reflex', desc:'One spark is all it takes now. Reduces fire cooldown by 3%.',
      effects:[{ type:'stat', classId:'kirin', stat:'fireCooldown', amount:-0.03 }] },
    d2b:{ name:'Short Fuse', desc:'There was never much patience to begin with. Reduces fire cooldown by 4%.',
      effects:[{ type:'stat', classId:'kirin', stat:'fireCooldown', amount:-0.03 }] },
    d3b:{ name:'No Time to Cool', desc:'The wrath never really goes out between shots. Reduces fire cooldown by 3%.',
      effects:[{ type:'stat', classId:'kirin', stat:'fireCooldown', amount:-0.03 }] },
  }},
  { classId:'mule', nodes:{
    c1:{ name:'Stubborn Endurance', desc:'Too stubborn to stop even while bleeding. Increases lifesteal chance by 6%.',
      effects:[{ type:'stat', classId:'mule', stat:'lifestealChance', amount:0.06 }] },
    c2a:{ name:"Won't Go Down", desc:'Every hit lands like it barely mattered. Reduces shop prices by 5%.',
      // dead-node fix: mule's c-branch had FIVE lifestealChance nodes (0.06+0.05+0.04+0.05+0.04=0.24)
      // against the 0.10 cap — the worst offender in the whole tree. c1+c3a alone already reach the
      // cap exactly (0.06+0.04=0.10), so c2a/c2b/c3b were all pure waste — retargeted to shopDiscountBonus.
      effects:[{ type:'stat', classId:'mule', stat:'shopDiscountBonus', amount:0.05 }] },
    c3a:{ name:'Iron Constitution', desc:'Built to keep hauling long after anything else would quit. Increases lifesteal chance by 4%.',
      effects:[{ type:'stat', classId:'mule', stat:'lifestealChance', amount:0.04 }] },
    c2b:{ name:'Hardy Stock', desc:'Bred for hard roads and harder work. Reduces shop prices by 5%.',
      effects:[{ type:'stat', classId:'mule', stat:'shopDiscountBonus', amount:0.05 }] },
    // Phase 11 correction — c2a+c2b already sum to the 0.10 shopDiscountBonus
    // cap on their own; this third node would have been dead weight the
    // same way the original lifestealChance nodes were, so it's luck instead.
    c3b:{ name:'Last Legs, Still Standing', desc:'The kind of endurance that doesn\'t know when to quit. Increases luck by 4%.',
      effects:[{ type:'stat', classId:'mule', stat:'luck', amount:0.04 }] },
    d1:{ name:'Steady Labor', desc:'A pack animal\'s tireless working pace. Reduces melee cooldown by 5%.',
      effects:[{ type:'stat', classId:'mule', stat:'meleeCooldown', amount:-0.05 }] },
    d2a:{ name:'Practiced Haul', desc:'A lifetime of hauling teaches efficient motion. Reduces melee cooldown by 4%.',
      effects:[{ type:'stat', classId:'mule', stat:'meleeCooldown', amount:-0.04 }] },
    d3a:{ name:'No Wasted Swing', desc:'Nothing thrown that doesn\'t count. Reduces melee cooldown by 3%.',
      effects:[{ type:'stat', classId:'mule', stat:'meleeCooldown', amount:-0.03 }] },
    d2b:{ name:'Working Rhythm', desc:'A trail-worn cadence that never breaks. Reduces melee cooldown by 4%.',
      effects:[{ type:'stat', classId:'mule', stat:'meleeCooldown', amount:-0.03 }] },
    d3b:{ name:'Never Idle', desc:'There\'s always another swing in her. Reduces melee cooldown by 3%.',
      effects:[{ type:'stat', classId:'mule', stat:'meleeCooldown', amount:-0.03 }] },
  }},
  { classId:'alicorn', nodes:{
    // Phase 11 un-bleed pass — this used to grant Changedling's own
    // `innateFireRing` flag outright ("same as a Changedling's smolder").
    // Now her own `innateStarRing`, driving the same generic ring-attack
    // system (shared plumbing) under her own name/fiction.
    c1:{ name:'Twin Gift Awakening', desc:'Wing and horn magic together kindle a permanent ring of starlight that follows wherever she flies.',
      effects:[{ type:'uniqueFlag', classId:'alicorn', field:'innateStarRing', value:true }] },
    c2a:{ name:'Radiant Aura', desc:'Widens the trailing fire ring\'s radius by 5px.',
      effects:[{ type:'uniqueField', classId:'alicorn', field:'fireRingRadius', amount:5, min:0, max:30 }] },
    c3a:{ name:'Widening Halo', desc:'Widens the trailing fire ring\'s radius by a further 4px.',
      effects:[{ type:'uniqueField', classId:'alicorn', field:'fireRingRadius', amount:4, min:0, max:30 }] },
    c2b:{ name:'Regal Corona', desc:'Widens the trailing fire ring\'s radius by 5px.',
      effects:[{ type:'uniqueField', classId:'alicorn', field:'fireRingRadius', amount:5, min:0, max:30 }] },
    c3b:{ name:'Sunlit Perimeter', desc:'Widens the trailing fire ring\'s radius by a further 4px.',
      effects:[{ type:'uniqueField', classId:'alicorn', field:'fireRingRadius', amount:4, min:0, max:30 }] },
    d1:{ name:'Ceaseless Radiance', desc:'The ring burns hotter and more often. Reduces fire cooldown by 5%.',
      effects:[{ type:'stat', classId:'alicorn', stat:'fireCooldown', amount:-0.05 }] },
    d2a:{ name:'Undying Glow', desc:'Reduces fire cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'alicorn', stat:'fireCooldown', amount:-0.04 }] },
    d3a:{ name:'Ever-Burning', desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'alicorn', stat:'fireCooldown', amount:-0.03 }] },
    d2b:{ name:'Constant Corona', desc:'Reduces fire cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'alicorn', stat:'fireCooldown', amount:-0.03 }] },
    d3b:{ name:'Never Dims', desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'alicorn', stat:'fireCooldown', amount:-0.03 }] },
  }},

  // ---------------------------------------------------------------------
  // 15 classes with a real unique mechanic — branches C and D tune/trade
  // off that mechanic's real parameters.
  // ---------------------------------------------------------------------
  { classId:'ponybot', nodes:{
    c1:{ name:'Reinforced Chassis', desc:'Bolted-on plating takes the edge off every hit. Reduces her damage-taken multiplier by 0.05 (from 1.25x toward 1.20x).',
      effects:[{ type:'uniqueField', classId:'ponybot', field:'damageTakenMult', amount:-0.05, min:-0.15, max:0 }] },
    c2a:{ name:'Patched Plating', desc:'Reduces her damage-taken multiplier by a further 0.03.',
      effects:[{ type:'uniqueField', classId:'ponybot', field:'damageTakenMult', amount:-0.03, min:-0.15, max:0 }] },
    c3a:{ name:'Salvaged Armor Plate', desc:'Reduces her damage-taken multiplier by a further 0.02.',
      effects:[{ type:'uniqueField', classId:'ponybot', field:'damageTakenMult', amount:-0.02, min:-0.15, max:0 }] },
    c2b:{ name:'Overweighted Shielding', desc:'Extra plating costs power that would otherwise reach the laser. Reduces ranged damage by 3%, but reduces her damage-taken multiplier by a further 0.02.',
      effects:[
        { type:'stat', classId:'ponybot', stat:'rangedDamage', amount:-0.03 },
        { type:'uniqueField', classId:'ponybot', field:'damageTakenMult', amount:-0.02, min:-0.15, max:0 },
      ] },
    c3b:{ name:'Scrap-Welded Hull', desc:'Reduces her damage-taken multiplier by a further 0.02.',
      effects:[{ type:'uniqueField', classId:'ponybot', field:'damageTakenMult', amount:-0.02, min:-0.15, max:0 }] },
    d1:{ name:'Redlined Capacitor', desc:'Running the discharge cycle harder than spec. Reduces fire cooldown by 5%.',
      effects:[{ type:'stat', classId:'ponybot', stat:'fireCooldown', amount:-0.05 }] },
    d2a:{ name:'Faster Discharge Cycle', desc:'Reduces fire cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'ponybot', stat:'fireCooldown', amount:-0.04 }] },
    d3a:{ name:'Minimal Recovery Loop', desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'ponybot', stat:'fireCooldown', amount:-0.03 }] },
    d2b:{ name:'Tuned Firing Sequence', desc:'Reduces fire cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'ponybot', stat:'fireCooldown', amount:-0.03 }] },
    d3b:{ name:'Peak Cycle Rate', desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'ponybot', stat:'fireCooldown', amount:-0.03 }] },
  }},
  { classId:'dragon', nodes:{
    c1:{ name:'Impatient Ember', desc:'The fire builds faster than it used to. Reduces charge time by 0.05s.',
      effects:[{ type:'uniqueField', classId:'dragon', field:'chargeTime', amount:-0.05, min:-0.2, max:0 }] },
    c2a:{ name:'Quickened Kindling', desc:'Reduces charge time by a further 0.04s.',
      effects:[{ type:'uniqueField', classId:'dragon', field:'chargeTime', amount:-0.04, min:-0.2, max:0 }] },
    c3a:{ name:'Shortened Fuse', desc:'Reduces charge time by a further 0.03s.',
      effects:[{ type:'uniqueField', classId:'dragon', field:'chargeTime', amount:-0.03, min:-0.2, max:0 }] },
    c2b:{ name:'Eager Flame', desc:'Reduces charge time by a further 0.04s.',
      effects:[{ type:'uniqueField', classId:'dragon', field:'chargeTime', amount:-0.04, min:-0.2, max:0 }] },
    c3b:{ name:'Barely Contained Fire', desc:'Reduces charge time by a further 0.03s.',
      effects:[{ type:'uniqueField', classId:'dragon', field:'chargeTime', amount:-0.03, min:-0.2, max:0 }] },
    d1:{ name:'Long-Necked Breath', desc:'A deeper breath before the release. Increases the dragonfire jet\'s base range by 0.5 tiles.',
      effects:[{ type:'uniqueField', classId:'dragon', field:'baseRangeTiles', amount:0.5, min:0, max:3 }] },
    d2a:{ name:'Extended Gullet', desc:'Increases the jet\'s base range by a further 0.4 tiles.',
      effects:[{ type:'uniqueField', classId:'dragon', field:'baseRangeTiles', amount:0.4, min:0, max:3 }] },
    d3a:{ name:'Reaching Jet', desc:'Increases the jet\'s base range by a further 0.3 tiles.',
      effects:[{ type:'uniqueField', classId:'dragon', field:'baseRangeTiles', amount:0.3, min:0, max:3 }] },
    d2b:{ name:'Deeper Lungs', desc:'Increases the jet\'s base range by a further 0.4 tiles.',
      effects:[{ type:'uniqueField', classId:'dragon', field:'baseRangeTiles', amount:0.4, min:0, max:3 }] },
    d3b:{ name:'Farthest Cinder', desc:'Increases the jet\'s base range by a further 0.3 tiles.',
      effects:[{ type:'uniqueField', classId:'dragon', field:'baseRangeTiles', amount:0.3, min:0, max:3 }] },
  }},
  { classId:'windigo', nodes:{
    c1:{ name:'Bone-Deep Chill', desc:'A cold that reaches further than skin. Increases freeze chance by 5%.',
      effects:[{ type:'stat', classId:'windigo', stat:'freezeChance', amount:0.05 }] },
    c2a:{ name:'Frost That Lingers', desc:'Increases freeze chance by a further 4%.',
      effects:[{ type:'stat', classId:'windigo', stat:'freezeChance', amount:0.04 }] },
    c3a:{ name:'Marrow Frost', desc:'Increases freeze chance by a further 3%.',
      effects:[{ type:'stat', classId:'windigo', stat:'freezeChance', amount:0.03 }] },
    c2b:{ name:'Numbing Gale', desc:'Increases freeze chance by a further 4%.',
      effects:[{ type:'stat', classId:'windigo', stat:'freezeChance', amount:0.04 }] },
    c3b:{ name:'Absolute Stillness', desc:'Increases freeze chance by a further 3%.',
      effects:[{ type:'stat', classId:'windigo', stat:'freezeChance', amount:0.03 }] },
    d1:{ name:"Storm's Own Pace", desc:'Riding the blizzard\'s own rhythm. Reduces fire cooldown by 5%.',
      effects:[{ type:'stat', classId:'windigo', stat:'fireCooldown', amount:-0.05 }] },
    d2a:{ name:'Gale-Driven Volley', desc:'Reduces fire cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'windigo', stat:'fireCooldown', amount:-0.04 }] },
    d3a:{ name:'Blizzard Tempo', desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'windigo', stat:'fireCooldown', amount:-0.03 }] },
    d2b:{ name:'Whiteout Rhythm', desc:'Reduces fire cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'windigo', stat:'fireCooldown', amount:-0.03 }] },
    d3b:{ name:"Winter Never Waits", desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'windigo', stat:'fireCooldown', amount:-0.03 }] },
  }},
  { classId:'kelpie', nodes:{
    c1:{ name:'Longshore Grasp', desc:'Reaching further before the grip even closes. Increases base melee reach by 0.3 tiles.',
      effects:[{ type:'uniqueField', classId:'kelpie', field:'baseRangeTiles', amount:0.3, min:0, max:2 }] },
    c2a:{ name:'Trailing Tendril', desc:'Increases base melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'kelpie', field:'baseRangeTiles', amount:0.25, min:0, max:2 }] },
    c3a:{ name:'Far-Flung Grip', desc:'Increases base melee reach by a further 0.2 tiles.',
      effects:[{ type:'uniqueField', classId:'kelpie', field:'baseRangeTiles', amount:0.2, min:0, max:2 }] },
    c2b:{ name:'Riverwide Pull', desc:'Increases base melee reach by a further 0.25 tiles.',
      effects:[{ type:'uniqueField', classId:'kelpie', field:'baseRangeTiles', amount:0.25, min:0, max:2 }] },
    c3b:{ name:'Bank-to-Bank Reach', desc:'Increases base melee reach by a further 0.2 tiles.',
      effects:[{ type:'uniqueField', classId:'kelpie', field:'baseRangeTiles', amount:0.2, min:0, max:2 }] },
    d1:{ name:'Rapid Drag', desc:'Pulling a foe under and recovering fast. Reduces melee cooldown by 5%.',
      effects:[{ type:'stat', classId:'kelpie', stat:'meleeCooldown', amount:-0.05 }] },
    d2a:{ name:'No Time to Surface', desc:'Reduces melee cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'kelpie', stat:'meleeCooldown', amount:-0.04 }] },
    d3a:{ name:'Relentless Undertow', desc:'Reduces melee cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'kelpie', stat:'meleeCooldown', amount:-0.03 }] },
    d2b:{ name:'Quickening Current', desc:'Reduces melee cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'kelpie', stat:'meleeCooldown', amount:-0.03 }] },
    d3b:{ name:'Never Lets Go', desc:'Reduces melee cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'kelpie', stat:'meleeCooldown', amount:-0.03 }] },
  }},
  { classId:'breezie', nodes:{
    c1:{ name:'Charged Mote', desc:'A little extra static behind every dust mote. Increases ranged damage by 5%.',
      effects:[{ type:'stat', classId:'breezie', stat:'rangedDamage', amount:0.05 }] },
    c2a:{ name:'Sunlit Spark', desc:'Increases ranged damage by a further 4%.',
      effects:[{ type:'stat', classId:'breezie', stat:'rangedDamage', amount:0.04 }] },
    c3a:{ name:'Static-Kissed Dust', desc:'Increases ranged damage by a further 3%.',
      effects:[{ type:'stat', classId:'breezie', stat:'rangedDamage', amount:0.03 }] },
    c2b:{ name:'Denser Pollen', desc:'Increases ranged damage by a further 4%.',
      effects:[{ type:'stat', classId:'breezie', stat:'rangedDamage', amount:0.04 }] },
    c3b:{ name:'Weighted Gossamer', desc:'Increases ranged damage by a further 3%.',
      effects:[{ type:'stat', classId:'breezie', stat:'rangedDamage', amount:0.03 }] },
    d1:{ name:'Pinpoint Drift', desc:'A mote that always seems to catch the perfect gust. Increases critical hit chance by 5%.',
      effects:[{ type:'stat', classId:'breezie', stat:'critChance', amount:0.05 }] },
    d2a:{ name:'Perfect Gust Timing', desc:'Increases critical hit chance by a further 4%.',
      effects:[{ type:'stat', classId:'breezie', stat:'critChance', amount:0.04 }] },
    d3a:{ name:'Threading the Needle', desc:'Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'breezie', stat:'critChance', amount:0.03 }] },
    d2b:{ name:'Precision Flit', desc:'Increases critical hit chance by a further 4%.',
      effects:[{ type:'stat', classId:'breezie', stat:'critChance', amount:0.03 }] },
    d3b:{ name:'Unerring Mote', desc:'Increases critical hit chance by a further 3%.',
      effects:[{ type:'stat', classId:'breezie', stat:'critChance', amount:0.03 }] },
  }},
  { classId:'crystalpony', nodes:{
    c1:{ name:'Overcharged Facet', desc:'Splitting the charge to loose one more shard. Reduces ranged damage by 5%, but adds 1 crystal shard to her volley (capped at 6 total).',
      effects:[
        { type:'stat', classId:'crystalpony', stat:'rangedDamage', amount:-0.05 },
        { type:'uniqueField', classId:'crystalpony', field:'crystalShardCount', amount:1, min:0, max:3 },
      ] },
    c2a:{ name:'Second Facet Bloom', desc:'Adds 1 more crystal shard to her volley (capped at 6 total).',
      effects:[{ type:'uniqueField', classId:'crystalpony', field:'crystalShardCount', amount:1, min:0, max:3 }] },
    c3a:{ name:'Third Facet Bloom', desc:'Adds 1 more crystal shard to her volley (capped at 6 total).',
      effects:[{ type:'uniqueField', classId:'crystalpony', field:'crystalShardCount', amount:1, min:0, max:3 }] },
    c2b:{ name:'Thinner Cut', desc:'Facets ground for speed rather than power. Reduces ranged damage by 3%.',
      effects:[{ type:'stat', classId:'crystalpony', stat:'rangedDamage', amount:-0.03 }] },
    c3b:{ name:'Polished Trajectory', desc:'A smoother-cut shard flies faster. Increases bolt speed by 3%.',
      effects:[{ type:'stat', classId:'crystalpony', stat:'boltSpeed', amount:0.03 }] },
    d1:{ name:'Hair-Trigger Horn', desc:'The charge fills faster than it used to. Reduces charge time by 0.06s.',
      effects:[{ type:'uniqueField', classId:'crystalpony', field:'chargeTime', amount:-0.06, min:-0.3, max:0 }] },
    d2a:{ name:'Quickened Convergence', desc:'Reduces charge time by a further 0.05s.',
      effects:[{ type:'uniqueField', classId:'crystalpony', field:'chargeTime', amount:-0.05, min:-0.3, max:0 }] },
    d3a:{ name:'Rapid Refraction', desc:'Reduces charge time by a further 0.04s.',
      effects:[{ type:'uniqueField', classId:'crystalpony', field:'chargeTime', amount:-0.04, min:-0.3, max:0 }] },
    d2b:{ name:'Rushed Casting', desc:'Casting before the crystal is fully formed costs a little power. Reduces ranged damage by 3%, but reduces charge time by a further 0.05s.',
      effects:[
        { type:'stat', classId:'crystalpony', stat:'rangedDamage', amount:-0.03 },
        { type:'uniqueField', classId:'crystalpony', field:'chargeTime', amount:-0.05, min:-0.3, max:0 },
      ] },
    d3b:{ name:'Snap-Charge Facet', desc:'Reduces charge time by a further 0.04s.',
      effects:[{ type:'uniqueField', classId:'crystalpony', field:'chargeTime', amount:-0.04, min:-0.3, max:0 }] },
  }},
  { classId:'changeling', nodes:{
    c1:{ name:'Spreading Blaze', desc:'The green fire spreads a little wider before it settles. Increases the fire pool\'s radius by 6px.',
      effects:[{ type:'uniqueField', classId:'changeling', field:'fireZoneRadius', amount:6, min:0, max:30 }] },
    c2a:{ name:'Widening Pool', desc:'Increases the fire pool\'s radius by a further 5px.',
      effects:[{ type:'uniqueField', classId:'changeling', field:'fireZoneRadius', amount:5, min:0, max:30 }] },
    c3a:{ name:'Consuming Puddle', desc:'Increases the fire pool\'s radius by a further 4px.',
      effects:[{ type:'uniqueField', classId:'changeling', field:'fireZoneRadius', amount:4, min:0, max:30 }] },
    c2b:{ name:'Hungrier Flame', desc:'Increases the fire pool\'s radius by a further 5px.',
      effects:[{ type:'uniqueField', classId:'changeling', field:'fireZoneRadius', amount:5, min:0, max:30 }] },
    c3b:{ name:'Ever-Widening Fire', desc:'Increases the fire pool\'s radius by a further 4px.',
      effects:[{ type:'uniqueField', classId:'changeling', field:'fireZoneRadius', amount:4, min:0, max:30 }] },
    d1:{ name:'Reaching Ember', desc:'Planting the pool further out ahead of her. Increases the fire pool\'s plant distance by 4px.',
      effects:[{ type:'uniqueField', classId:'changeling', field:'fireZoneRange', amount:4, min:0, max:20 }] },
    d2a:{ name:'Thrown Further', desc:'Increases the fire pool\'s plant distance by a further 3px.',
      effects:[{ type:'uniqueField', classId:'changeling', field:'fireZoneRange', amount:3, min:0, max:20 }] },
    d3a:{ name:'Long-Cast Cinder', desc:'Increases the fire pool\'s plant distance by a further 3px.',
      effects:[{ type:'uniqueField', classId:'changeling', field:'fireZoneRange', amount:3, min:0, max:20 }] },
    d2b:{ name:'Overextended Blaze', desc:'Throwing the pool further costs some of its bite. Reduces ranged damage by 3%, but increases the fire pool\'s plant distance by a further 3px.',
      effects:[
        { type:'stat', classId:'changeling', stat:'rangedDamage', amount:-0.03 },
        { type:'uniqueField', classId:'changeling', field:'fireZoneRange', amount:3, min:0, max:20 },
      ] },
    d3b:{ name:'Distant Kindling', desc:'Increases the fire pool\'s plant distance by a further 3px.',
      effects:[{ type:'uniqueField', classId:'changeling', field:'fireZoneRange', amount:3, min:0, max:20 }] },
  }},
  { classId:'diamonddog', nodes:{
    c1:{ name:"Prospector's Pickaxe", desc:'A claw honed for the vein, not just the fight. Increases the chance a shockwave-shattered rock pays out a coin by 3%.',
      effects:[{ type:'uniqueField', classId:'diamonddog', field:'rockCoinChance', amount:0.03, min:0, max:0.15 }] },
    c2a:{ name:"Vein-Sense Claw", desc:'Increases the chance a shattered rock pays out a coin by a further 3%.',
      effects:[{ type:'uniqueField', classId:'diamonddog', field:'rockCoinChance', amount:0.03, min:0, max:0.15 }] },
    c3a:{ name:'Deep Digging Instinct', desc:'Increases the chance a shattered rock pays out a coin by a further 2%.',
      effects:[{ type:'uniqueField', classId:'diamonddog', field:'rockCoinChance', amount:0.02, min:0, max:0.15 }] },
    c2b:{ name:"Gem Hound's Nose", desc:'Increases the chance a shattered rock pays out a coin by a further 3%.',
      effects:[{ type:'uniqueField', classId:'diamonddog', field:'rockCoinChance', amount:0.03, min:0, max:0.15 }] },
    c3b:{ name:'Nothing Wasted in the Rubble', desc:'Increases the chance a shattered rock pays out a coin by a further 2%.',
      effects:[{ type:'uniqueField', classId:'diamonddog', field:'rockCoinChance', amount:0.02, min:0, max:0.15 }] },
    d1:{ name:'Faster Dig', desc:'A pickaxe swing recovered from in a hurry. Reduces melee cooldown by 5%.',
      effects:[{ type:'stat', classId:'diamonddog', stat:'meleeCooldown', amount:-0.05 }] },
    d2a:{ name:'Practiced Excavation', desc:'Reduces melee cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'diamonddog', stat:'meleeCooldown', amount:-0.04 }] },
    d3a:{ name:'Tunnel Rhythm', desc:'Reduces melee cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'diamonddog', stat:'meleeCooldown', amount:-0.03 }] },
    d2b:{ name:'Quickened Pickaxe', desc:'Reduces melee cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'diamonddog', stat:'meleeCooldown', amount:-0.03 }] },
    d3b:{ name:'No Wasted Strikes', desc:'Reduces melee cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'diamonddog', stat:'meleeCooldown', amount:-0.03 }] },
  }},
  { classId:'gargoyle', nodes:{
    c1:{ name:'Marked for the Hunt', desc:'A sentinel\'s gaze that lingers on the weak spot. Increases vulnerable chance by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'vulnerableChance', amount:0.05 }] },
    c2a:{ name:'Weak Point Reading', desc:'Increases vulnerable chance by a further 4%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'vulnerableChance', amount:0.04 }] },
    c3a:{ name:"Sentinel's Verdict", desc:'Increases vulnerable chance by a further 3%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'vulnerableChance', amount:0.03 }] },
    c2b:{ name:"Watcher's Judgment", desc:'Increases vulnerable chance by a further 4%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'vulnerableChance', amount:0.04 }] },
    c3b:{ name:'No Escaping the Mark', desc:'Increases vulnerable chance by a further 3%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'vulnerableChance', amount:0.03 }] },
    d1:{ name:'Nightfall Reflexes', desc:'Fastest once the sun goes down. Reduces fire cooldown by 5%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'fireCooldown', amount:-0.05 }] },
    d2a:{ name:'Stone-Quick Volley', desc:'Reduces fire cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'fireCooldown', amount:-0.04 }] },
    d3a:{ name:"Gargoyle's Cadence", desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'fireCooldown', amount:-0.03 }] },
    d2b:{ name:'Watchtower Rhythm', desc:'Reduces fire cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'fireCooldown', amount:-0.03 }] },
    d3b:{ name:'Never Resting', desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'gargoyle', stat:'fireCooldown', amount:-0.03 }] },
  }},
  { classId:'changedling', nodes:{
    c1:{ name:'Widening Halo', desc:'The trailing ring of fire spreads a little further out. Increases the fire ring\'s radius by 6px.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'fireRingRadius', amount:6, min:0, max:30 }] },
    c2a:{ name:'Trailing Cinders', desc:'Increases the fire ring\'s radius by a further 5px.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'fireRingRadius', amount:5, min:0, max:30 }] },
    c3a:{ name:'Growing Corona', desc:'Increases the fire ring\'s radius by a further 4px.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'fireRingRadius', amount:4, min:0, max:30 }] },
    c2b:{ name:'Unstable Bloom', desc:'Increases the fire ring\'s radius by a further 5px.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'fireRingRadius', amount:5, min:0, max:30 }] },
    c3b:{ name:'Ever-Spreading Ring', desc:'Increases the fire ring\'s radius by a further 4px.',
      effects:[{ type:'uniqueField', classId:'changedling', field:'fireRingRadius', amount:4, min:0, max:30 }] },
    d1:{ name:'Restless Kindling', desc:'A flame too unstable to burn slowly. Reduces fire cooldown by 5%.',
      effects:[{ type:'stat', classId:'changedling', stat:'fireCooldown', amount:-0.05 }] },
    d2a:{ name:'Flickering Faster', desc:'Reduces fire cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'changedling', stat:'fireCooldown', amount:-0.04 }] },
    d3a:{ name:'Never Settling', desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'changedling', stat:'fireCooldown', amount:-0.03 }] },
    d2b:{ name:'Quickened Smolder', desc:'Reduces fire cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'changedling', stat:'fireCooldown', amount:-0.03 }] },
    d3b:{ name:'Constant Burn', desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'changedling', stat:'fireCooldown', amount:-0.03 }] },
  }},
  { classId:'changelingqueen', nodes:{
    c1:{ name:'First Brood Expansion', desc:'Adds 1 more slot for summoned changeling minions (capped at 7 total).',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'maxChangelingMinions', amount:1, min:0, max:3 }] },
    c2a:{ name:'Second Brood Expansion', desc:'Adds 1 more slot for summoned changeling minions (capped at 7 total).',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'maxChangelingMinions', amount:1, min:0, max:3 }] },
    c3a:{ name:'Third Brood Expansion', desc:'Adds 1 more slot for summoned changeling minions (capped at 7 total).',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'maxChangelingMinions', amount:1, min:0, max:3 }] },
    c2b:{ name:'Delegate the Flame', desc:'Feeding her strength into the brood instead of her own horn. Reduces her own ranged damage by 3%, but increases minion damage by 0.15/s (capped at +0.6/s total).',
      effects:[
        { type:'stat', classId:'changelingqueen', stat:'rangedDamage', amount:-0.03 },
        { type:'uniqueField', classId:'changelingqueen', field:'changelingMinionDmg', amount:0.15, min:0, max:0.6 },
      ] },
    c3b:{ name:'Shared Coal', desc:'Increases minion damage by a further 0.15/s (capped at +0.6/s total).',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingMinionDmg', amount:0.15, min:0, max:0.6 }] },
    d1:{ name:'Hive Urgency', desc:'The hive answers her call faster. Reduces the summon cooldown by 0.5s.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingSummonCooldown', amount:-0.5, min:-2, max:0 }] },
    d2a:{ name:'Faster Brood Call', desc:'Reduces the summon cooldown by a further 0.4s.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingSummonCooldown', amount:-0.4, min:-2, max:0 }] },
    d3a:{ name:'Ever-Ready Swarm', desc:'Reduces the summon cooldown by a further 0.3s.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingSummonCooldown', amount:-0.3, min:-2, max:0 }] },
    d2b:{ name:'Quickened Summons', desc:'Reduces the summon cooldown by a further 0.4s.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingSummonCooldown', amount:-0.4, min:-2, max:0 }] },
    d3b:{ name:'No Idle Hive', desc:'Reduces the summon cooldown by a further 0.3s.',
      effects:[{ type:'uniqueField', classId:'changelingqueen', field:'changelingSummonCooldown', amount:-0.3, min:-2, max:0 }] },
  }},
  { classId:'filly', nodes:{
    c1:{ name:'Puppy-Dog Eyes', desc:'A look nopony can quite say no to. Increases charm chance by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'charmChance', amount:0.05 }] },
    c2a:{ name:'Impossible to Refuse', desc:'Increases charm chance by a further 4%.',
      effects:[{ type:'stat', classId:'filly', stat:'charmChance', amount:0.04 }] },
    c3a:{ name:'Whatever She Wants', desc:'Increases charm chance by a further 3%.',
      effects:[{ type:'stat', classId:'filly', stat:'charmChance', amount:0.03 }] },
    c2b:{ name:'Too Sweet to Say No', desc:'Increases charm chance by a further 4%.',
      effects:[{ type:'stat', classId:'filly', stat:'charmChance', amount:0.04 }] },
    c3b:{ name:"Nopony's Ever Said No", desc:'Increases charm chance by a further 3%.',
      effects:[{ type:'stat', classId:'filly', stat:'charmChance', amount:0.03 }] },
    d1:{ name:'Quick Recovery', desc:'Small hooves bounce back fast. Reduces melee cooldown by 5%.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeCooldown', amount:-0.05 }] },
    d2a:{ name:"Back On Her Hooves", desc:'Reduces melee cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeCooldown', amount:-0.04 }] },
    d3a:{ name:'Never Tired', desc:'Reduces melee cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeCooldown', amount:-0.03 }] },
    d2b:{ name:'Bouncing Back', desc:'Reduces melee cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeCooldown', amount:-0.03 }] },
    d3b:{ name:'Boundless Energy', desc:'Reduces melee cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'filly', stat:'meleeCooldown', amount:-0.03 }] },
  }},
  { classId:'engineerpony', nodes:{
    c1:{ name:'Overtuned Turret Coils', desc:'A retrofit that pushes built turrets harder. Increases turret damage multiplier by 0.08 (from 0.7x toward 1.1x of her ranged damage).',
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'turretDamageMult', amount:0.08, min:0, max:0.4 }] },
    c2a:{ name:'Reinforced Firing Pin', desc:'Increases turret damage multiplier by a further 0.07.',
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'turretDamageMult', amount:0.07, min:0, max:0.4 }] },
    c3a:{ name:'Precision-Machined Barrel', desc:'Increases turret damage multiplier by a further 0.06.',
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'turretDamageMult', amount:0.06, min:0, max:0.4 }] },
    c2b:{ name:'Upgraded Capacitor Bank', desc:'Increases turret damage multiplier by a further 0.07.',
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'turretDamageMult', amount:0.07, min:0, max:0.4 }] },
    c3b:{ name:'Peak Output Turret', desc:'Increases turret damage multiplier by a further 0.06.',
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'turretDamageMult', amount:0.06, min:0, max:0.4 }] },
    d1:{ name:'Second Chassis Blueprint', desc:'Allows building 1 more turret at once (capped at 5 total).',
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'maxTurrets', amount:1, min:0, max:2 }] },
    d2a:{ name:'Third Chassis Blueprint', desc:'Allows building 1 more turret at once (capped at 5 total).',
      effects:[{ type:'uniqueField', classId:'engineerpony', field:'maxTurrets', amount:1, min:0, max:2 }] },
    d3a:{ name:'Shared Schematics', desc:'Better plans mean a stronger horn too, and stronger turrets since their damage is set from it. Increases ranged damage by 3%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'rangedDamage', amount:0.03 }] },
    d2b:{ name:'Faster Assembly Line', desc:'Reduces the time it takes to build a turret. Reduces fire cooldown by 4%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'fireCooldown', amount:-0.04 }] },
    d3b:{ name:'Streamlined Build Cycle', desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'engineerpony', stat:'fireCooldown', amount:-0.03 }] },
  }},
  { classId:'batpony', nodes:{
    c1:{ name:'Second Bite', desc:'Hungrier fangs make the most of every kill. Increases on-kill heal chance by 5%.',
      effects:[{ type:'stat', classId:'batpony', stat:'onKillHealChance', amount:0.05 }] },
    c2a:{ name:'Hungrier Fangs', desc:'Increases on-kill heal chance by a further 4%.',
      effects:[{ type:'stat', classId:'batpony', stat:'onKillHealChance', amount:0.04 }] },
    c3a:{ name:'Never Goes Hungry', desc:'Increases on-kill heal chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'onKillHealChance', amount:0.03 }] },
    c2b:{ name:'Drinking Deep', desc:'Increases on-kill heal chance by a further 4%.',
      effects:[{ type:'stat', classId:'batpony', stat:'onKillHealChance', amount:0.04 }] },
    c3b:{ name:'Feeds on Every Kill', desc:'Increases on-kill heal chance by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'onKillHealChance', amount:0.03 }] },
    d1:{ name:"Night Hunter's Reflex", desc:'Quickest right after a kill lands. Reduces melee cooldown by 5%.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeCooldown', amount:-0.05 }] },
    d2a:{ name:"Predator's Tempo", desc:'Reduces melee cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeCooldown', amount:-0.04 }] },
    d3a:{ name:'Silent, Swift Strikes', desc:'Reduces melee cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeCooldown', amount:-0.03 }] },
    d2b:{ name:'Relentless Claws', desc:'Reduces melee cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeCooldown', amount:-0.03 }] },
    d3b:{ name:'No Pause in the Dark', desc:'Reduces melee cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'batpony', stat:'meleeCooldown', amount:-0.03 }] },
  }},
  { classId:'dnbpony', nodes:{
    c1:{ name:'Drop It Faster', desc:'Cutting the gap before the next pulse. Reduces fire cooldown by 5%.',
      effects:[{ type:'stat', classId:'dnbpony', stat:'fireCooldown', amount:-0.05 }] },
    c2a:{ name:'Tighter Loop', desc:'Reduces fire cooldown by a further 4%.',
      effects:[{ type:'stat', classId:'dnbpony', stat:'fireCooldown', amount:-0.04 }] },
    c3a:{ name:'Sub-Bass Snap', desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'dnbpony', stat:'fireCooldown', amount:-0.03 }] },
    c2b:{ name:'Redline the Deck', desc:'Pushing the tempo past what the pulse can fully carry. Reduces ranged damage by 3%, but reduces fire cooldown by a further 4%.',
      effects:[
        { type:'stat', classId:'dnbpony', stat:'rangedDamage', amount:-0.03 },
        { type:'stat', classId:'dnbpony', stat:'fireCooldown', amount:-0.04 },
      ] },
    c3b:{ name:'No Downtime Between Drops', desc:'Reduces fire cooldown by a further 3%.',
      effects:[{ type:'stat', classId:'dnbpony', stat:'fireCooldown', amount:-0.03 }] },
    d1:{ name:'Sharper Pulse', desc:'A pulse cut clean enough to travel faster. Increases bolt speed by 5%.',
      effects:[{ type:'stat', classId:'dnbpony', stat:'boltSpeed', amount:0.05 }] },
    d2a:{ name:'Velocity Mix', desc:'Increases bolt speed by a further 4%.',
      effects:[{ type:'stat', classId:'dnbpony', stat:'boltSpeed', amount:0.04 }] },
    d3a:{ name:'Overdriven Bassline', desc:'Increases bolt speed by a further 3%.',
      effects:[{ type:'stat', classId:'dnbpony', stat:'boltSpeed', amount:0.03 }] },
    d2b:{ name:'Neon Trail', desc:'Increases bolt speed by a further 4%.',
      effects:[{ type:'stat', classId:'dnbpony', stat:'boltSpeed', amount:0.03 }] },
    d3b:{ name:'Full Send', desc:'Increases bolt speed by a further 3%.',
      effects:[{ type:'stat', classId:'dnbpony', stat:'boltSpeed', amount:0.03 }] },
  }},
];

// Phase 8f-topology — per-character tree SHAPE for branches C/D, the
// counterpart to SKILL_TREE_CHAR_TOPOLOGY in skilltree-characters.js (see
// that table's comment for the full method). Values are FULL parent node
// ids, and — same as the other table — may point at an a*/b* node this file
// doesn't define (grafting a C/D branch under an A/B branch), resolved
// purely by id string once both files have loaded; load order between the
// two files doesn't matter for correctness. Node id/name/desc/effects
// content is completely unchanged from the original template — only this
// parent wiring differs.
const SKILL_TREE_CHAR_TOPOLOGY_2 = {
  earth: { c1:'char_hub_earth', c2a:'char_earth_c1', c3a:'char_earth_c2a', c2b:'char_earth_c2a', c3b:'char_earth_c2b', d1:'char_hub_earth', d2a:'char_earth_d1', d3a:'char_earth_d2b', d2b:'char_earth_d2a', d3b:'char_earth_d2b' },
  pegasus: { c1:'char_hub_pegasus', c2a:'char_pegasus_c1', c3a:'char_pegasus_c2a', c2b:'char_pegasus_c3a', c3b:'char_pegasus_c2b', d1:'char_hub_pegasus', d2a:'char_pegasus_d1', d3a:'char_pegasus_d2a', d2b:'char_pegasus_d1', d3b:'char_pegasus_d2b' },
  unicorn: { c1:'char_hub_unicorn', c2a:'char_unicorn_c1', c3a:'char_unicorn_c2a', c2b:'char_unicorn_c2a', c3b:'char_unicorn_c2b', d1:'char_unicorn_c3a', d2a:'char_unicorn_d1', d3a:'char_unicorn_d2a', d2b:'char_unicorn_d3a', d3b:'char_unicorn_d2b' },
  batpony: { c1:'char_batpony_b3b', c2a:'char_batpony_c1', c3a:'char_batpony_c2b', c2b:'char_batpony_c2a', c3b:'char_batpony_c2b', d1:'char_hub_batpony', d2a:'char_batpony_d1', d3a:'char_batpony_d2a', d2b:'char_batpony_d1', d3b:'char_batpony_d2b' },
  zebra: { c1:'char_zebra_b3a', c2a:'char_zebra_c1', c3a:'char_zebra_c2a', c2b:'char_zebra_c1', c3b:'char_zebra_c2b', d1:'char_zebra_c2a', d2a:'char_zebra_d1', d3a:'char_zebra_d2a', d2b:'char_zebra_d2a', d3b:'char_zebra_d2b' },
  hypogriff: { c1:'char_hub_hypogriff', c2a:'char_hypogriff_c1', c3a:'char_hypogriff_c2b', c2b:'char_hypogriff_c2a', c3b:'char_hypogriff_c2b', d1:'char_hub_hypogriff', d2a:'char_hypogriff_d1', d3a:'char_hypogriff_d2a', d2b:'char_hypogriff_d1', d3b:'char_hypogriff_d2b' },
  seapony: { c1:'char_hub_seapony', c2a:'char_seapony_c1', c3a:'char_seapony_c2a', c2b:'char_seapony_c1', c3b:'char_seapony_c2b', d1:'char_seapony_c2b', d2a:'char_seapony_d1', d3a:'char_seapony_d2a', d2b:'char_seapony_d3a', d3b:'char_seapony_d2b' },
  ponybot: { c1:'char_ponybot_b2b', c2a:'char_ponybot_c1', c3a:'char_ponybot_c2a', c2b:'char_ponybot_c3a', c3b:'char_ponybot_c2b', d1:'char_ponybot_a3a', d2a:'char_ponybot_d1', d3a:'char_ponybot_d2a', d2b:'char_ponybot_d1', d3b:'char_ponybot_d2b' },
  griffin: { c1:'char_griffin_b3b', c2a:'char_griffin_c1', c3a:'char_griffin_c2a', c2b:'char_griffin_c3a', c3b:'char_griffin_c2b', d1:'char_griffin_c3a', d2a:'char_griffin_d1', d3a:'char_griffin_d2a', d2b:'char_griffin_d2a', d3b:'char_griffin_d2b' },
  kirin: { c1:'char_hub_kirin', c2a:'char_kirin_c1', c3a:'char_kirin_c2a', c2b:'char_kirin_c1', c3b:'char_kirin_c2b', d1:'char_hub_kirin', d2a:'char_kirin_d1', d3a:'char_kirin_d2a', d2b:'char_kirin_d2a', d3b:'char_kirin_d2b' },
  dragon: { c1:'char_dragon_a3b', c2a:'char_dragon_c1', c3a:'char_dragon_c2a', c2b:'char_dragon_c2a', c3b:'char_dragon_c2b', d1:'char_hub_dragon', d2a:'char_dragon_d1', d3a:'char_dragon_d2b', d2b:'char_dragon_d2a', d3b:'char_dragon_d2b' },
  windigo: { c1:'char_hub_windigo', c2a:'char_windigo_c1', c3a:'char_windigo_c2a', c2b:'char_windigo_c1', c3b:'char_windigo_c2b', d1:'char_windigo_c2b', d2a:'char_windigo_d1', d3a:'char_windigo_d2a', d2b:'char_windigo_d2a', d3b:'char_windigo_d2b' },
  kelpie: { c1:'char_kelpie_d3b', c2a:'char_kelpie_c1', c3a:'char_kelpie_c2a', c2b:'char_kelpie_c2a', c3b:'char_kelpie_c2b', d1:'char_hub_kelpie', d2a:'char_kelpie_d1', d3a:'char_kelpie_d2a', d2b:'char_kelpie_d1', d3b:'char_kelpie_d2b' },
  breezie: { c1:'char_hub_breezie', c2a:'char_breezie_c1', c3a:'char_breezie_c2a', c2b:'char_breezie_c1', c3b:'char_breezie_c2b', d1:'char_breezie_b2b', d2a:'char_breezie_d1', d3a:'char_breezie_d2a', d2b:'char_breezie_d2a', d3b:'char_breezie_d2b' },
  dnbpony: { c1:'char_hub_dnbpony', c2a:'char_dnbpony_c1', c3a:'char_dnbpony_c2a', c2b:'char_dnbpony_c3a', c3b:'char_dnbpony_c2b', d1:'char_hub_dnbpony', d2a:'char_dnbpony_d1', d3a:'char_dnbpony_d2a', d2b:'char_dnbpony_d1', d3b:'char_dnbpony_d2b' },
  crystalpony: { c1:'char_hub_crystalpony', c2a:'char_crystalpony_c1', c3a:'char_crystalpony_c2a', c2b:'char_crystalpony_c2a', c3b:'char_crystalpony_c2b', d1:'char_crystalpony_b3b', d2a:'char_crystalpony_d1', d3a:'char_crystalpony_d2a', d2b:'char_crystalpony_d1', d3b:'char_crystalpony_d2b' },
  mule: { c1:'char_mule_a2a', c2a:'char_mule_c1', c3a:'char_mule_c2a', c2b:'char_mule_c1', c3b:'char_mule_c2b', d1:'char_mule_b2b', d2a:'char_mule_d1', d3a:'char_mule_d2a', d2b:'char_mule_d2a', d3b:'char_mule_d2b' },
  alicorn: { c1:'char_alicorn_a2a', c2a:'char_alicorn_c1', c3a:'char_alicorn_c2b', c2b:'char_alicorn_c2a', c3b:'char_alicorn_c2b', d1:'char_alicorn_c2b', d2a:'char_alicorn_d1', d3a:'char_alicorn_d2a', d2b:'char_alicorn_d2a', d3b:'char_alicorn_d2b' },
  changeling: { c1:'char_changeling_a2b', c2a:'char_changeling_c1', c3a:'char_changeling_c2b', c2b:'char_changeling_c2a', c3b:'char_changeling_c2b', d1:'char_changeling_b2a', d2a:'char_changeling_d1', d3a:'char_changeling_d2a', d2b:'char_changeling_d3a', d3b:'char_changeling_d2b' },
  diamonddog: { c1:'char_hub_diamonddog', c2a:'char_diamonddog_c1', c3a:'char_diamonddog_c2b', c2b:'char_diamonddog_c2a', c3b:'char_diamonddog_c2b', d1:'char_hub_diamonddog', d2a:'char_diamonddog_d1', d3a:'char_diamonddog_d2a', d2b:'char_diamonddog_d1', d3b:'char_diamonddog_d2b' },
  gargoyle: { c1:'char_gargoyle_a2a', c2a:'char_gargoyle_c1', c3a:'char_gargoyle_c2a', c2b:'char_gargoyle_c2a', c3b:'char_gargoyle_c2b', d1:'char_hub_gargoyle', d2a:'char_gargoyle_d1', d3a:'char_gargoyle_d2a', d2b:'char_gargoyle_d3a', d3b:'char_gargoyle_d2b' },
  changedling: { c1:'char_changedling_b3b', c2a:'char_changedling_c1', c3a:'char_changedling_c2a', c2b:'char_changedling_c2a', c3b:'char_changedling_c2b', d1:'char_changedling_a2a', d2a:'char_changedling_d1', d3a:'char_changedling_d2a', d2b:'char_changedling_d1', d3b:'char_changedling_d2b' },
  changelingqueen: { c1:'char_hub_changelingqueen', c2a:'char_changelingqueen_c1', c3a:'char_changelingqueen_c2a', c2b:'char_changelingqueen_c1', c3b:'char_changelingqueen_c2b', d1:'char_changelingqueen_a3a', d2a:'char_changelingqueen_d1', d3a:'char_changelingqueen_d2a', d2b:'char_changelingqueen_d3a', d3b:'char_changelingqueen_d2b' },
  filly: { c1:'char_hub_filly', c2a:'char_filly_c1', c3a:'char_filly_c2a', c2b:'char_filly_c1', c3b:'char_filly_c2b', d1:'char_hub_filly', d2a:'char_filly_d1', d3a:'char_filly_d2b', d2b:'char_filly_d2a', d3b:'char_filly_d2b' },
  engineerpony: { c1:'char_hub_engineerpony', c2a:'char_engineerpony_c1', c3a:'char_engineerpony_c2a', c2b:'char_engineerpony_c1', c3b:'char_engineerpony_c2b', d1:'char_engineerpony_a2b', d2a:'char_engineerpony_d1', d3a:'char_engineerpony_d2a', d2b:'char_engineerpony_d2a', d3b:'char_engineerpony_d2b' },
};

const SKILL_TREE_CHARACTER_NODES_2 = [];
(function buildCharacterSkillNodes2(){
  const ORDER = ['c1','c2a','c3a','c2b','c3b','d1','d2a','d3a','d2b','d3b'];
  for (const cfg of SKILL_TREE_CHARACTER_CONFIG_2) {
    const classId = cfg.classId;
    for (const key of ORDER) {
      const content = cfg.nodes[key];
      const parentId = SKILL_TREE_CHAR_TOPOLOGY_2[classId][key];
      SKILL_TREE_CHARACTER_NODES_2.push({
        id: 'char_' + classId + '_' + key,
        parent: parentId,
        cost: 1,
        name: content.name,
        desc: content.desc,
        effects: content.effects,
      });
    }
  }
})();

for (const n of SKILL_TREE_CHARACTER_NODES_2) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

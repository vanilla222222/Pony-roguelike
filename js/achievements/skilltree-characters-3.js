'use strict';
// achievements/skilltree-characters-3.js — Phase 9 megaupdate: 526 MORE
// character skill nodes (20 per character x 25 classes, plus the 26 Mega A
// step 4 debuff gates added later in this file), doubling every character's
// skill tree from 20 to 40-42 non-hub nodes. Pure data, appended
// onto the SKILL_TREE_NODES array/SKILL_TREE_NODES_BY_ID map defined in
// skilltree.js — no engine logic lives here.
//
// Topology: each character's 20 new nodes form FOUR new extension branches
// (keys e/f/g/h), each a 5-node chain grafted onto one of that character's
// EXISTING deepest leaf nodes (from the old 20-node set defined across
// skilltree-characters.js and skilltree-characters-2.js) — never onto a
// brand-new standalone branch off the hub, and never re-parenting/editing
// any existing node:
//
//   <existing leaf from old 20>
//     +- e1  (CURSED opener — pure debuff, cost 1, mandatory: e2a/e2b are
//     |        UNREACHABLE without buying it)
//     |    +- e2a -> e3a           (payoff chain)
//     |    +- e2b -> e3b           (payoff chain; e2b is ALSO cursed on
//     |                             ~half of every character's 4 branches,
//     |                             gating e3b as a second mandatory tier)
//   (same shape repeated for f/g/h, each grafted onto a different old leaf)
//
// Cursed-node design (see js/achievements/skilltree.js's nodeEffects/
// getSkillTreeStatBonus for the engine this leans on): every node flagged
// `cursed:true` carries ONLY negative-amount 'stat' effects — no positive
// component, ever — and is the SOLE parent of 1-2 payoff nodes beneath it,
// so those payoffs are structurally unreachable without eating the debuff
// first (canBuySkillNode in skilltree.js requires a node's single `parent`
// to already be owned). Debuff amounts land on fields this character's OLD
// 20 nodes already use in the POSITIVE direction (their branch A/B stat,
// mostly) — see skilltree.js's symmetric [-0.25,0.25] clamp: since the old
// 20 already sit at a positive sum on that field, subtracting a further
// 3-4% per curse has full headroom before ever approaching the negative
// floor. Payoff nodes (and their non-cursed deeper continuations) each
// target ONE fresh SKILL_TREE_STAT_FIELDS entry the character's old 20
// nodes never touch at all, one distinct fresh field per branch (four
// total), so a fully-bought branch's own worst-case sum never comes close
// to the +0.25 ceiling and no two of the four new branches ever compete for
// the same field's headroom.
//
// Cap discipline: recomputed across the FULL 40-node set (old 20 + these 20)
// per character per stat field — verified by the Phase 9 audit harness (see
// feature-research/phase9-megaupdates/audit-skilltree-double-cursed.md) to
// stay within skilltree.js's [-0.25,0.25] clamp for every character/field
// combination, zero failures.
//
// Roughly 8 cursed nodes per character (200 total across all 25) — every
// branch's opener (e1/f1/g1/h1) is always cursed; 2-4 of the 4 branches per
// character (varied by class index for distribution, not uniform) ALSO
// curse their second-tier node (e2b/f2b/g2b/h2b) to gate an even deeper
// payoff, per the brief's "many mandatory gates" ask. Mega A step 4 then
// closed the remaining 26 ungated payoffs by splicing one extra cursed gate
// (char_<classId>_<e|f|g|h>x) between every NON-cursed X2b node and its X3b
// payoff — see SKILL_TREE_CHAR_GATE_CONFIG_3 further down. Net result: all
// 100 payoff leaves in this file now sit behind at least one mandatory curse.

const SKILL_TREE_CHARACTER_CONFIG_3 = [
  { classId:'earth', nodes:{
    e1:{ name:'Blood Price of the Hoofwork', desc:'A cost paid in strength, not coin. Permanently reduces melee damage by 4%. Required to press deeper into this iron path.', cursed:true, effect:{ type:'stat', classId:'earth', stat:'meleeDamage', amount:-0.04 } },
    e2a:{ name:'Iron Hoofwork Rite', desc:'The price of Blood Price pays off. Increases movement speed by 5%.', effect:{ type:'stat', classId:'earth', stat:'speed', amount:0.05 } },
    e3a:{ name:'Quarried Foundation', desc:'A further step down the same path. Increases movement speed by 4%.', effect:{ type:'stat', classId:'earth', stat:'speed', amount:0.04 } },
    e2b:{ name:'Shattered Resolve of the Mineshaft', desc:'Something has to give, and it gives here. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'earth', stat:'meleeDamage', amount:-0.03 } },
    e3b:{ name:'Bedrock Payoff', desc:'Everything the iron path was built toward. Increases movement speed by 6%.', effect:{ type:'stat', classId:'earth', stat:'speed', amount:0.06 } },
    f1:{ name:'Whisper of Doubt of the Grit', desc:'Hesitation creeps in and never quite leaves. Permanently reduces luck by 4%. Required to press deeper into this quarried path.', cursed:true, effect:{ type:'stat', classId:'earth', stat:'luck', amount:-0.04 } },
    f2a:{ name:'Quarried Grit Rite', desc:'The price of Whisper of Doubt pays off. Increases ranged damage by 5%.', effect:{ type:'stat', classId:'earth', stat:'rangedDamage', amount:0.05 } },
    f3a:{ name:'Bedrock Mineshaft', desc:'A further step down the same path. Increases ranged damage by 4%.', effect:{ type:'stat', classId:'earth', stat:'rangedDamage', amount:0.04 } },
    f2b:{ name:'Fraying Nerve of the Hoofwork', desc:'The edge dulls just enough to be felt. Permanently reduces luck by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'earth', stat:'luck', amount:-0.03 } },
    f3b:{ name:'Stonebound Payoff', desc:'Everything the quarried path was built toward. Increases ranged damage by 6%.', effect:{ type:'stat', classId:'earth', stat:'rangedDamage', amount:0.06 } },
    g1:{ name:'Weight of the Debt of the Foundation', desc:'Power borrowed always comes due. Permanently reduces melee damage by 4%. Required to press deeper into this bedrock path.', cursed:true, effect:{ type:'stat', classId:'earth', stat:'meleeDamage', amount:-0.04 } },
    g2a:{ name:'Bedrock Foundation Rite', desc:'The price of Weight of the Debt pays off. Increases critical hit chance by 5%.', effect:{ type:'stat', classId:'earth', stat:'critChance', amount:0.05 } },
    g3a:{ name:'Stonebound Hoofwork', desc:'A further step down the same path. Increases critical hit chance by 4%.', effect:{ type:'stat', classId:'earth', stat:'critChance', amount:0.04 } },
    g2b:{ name:'Iron Mineshaft', desc:'A second path opened by the same sacrifice. Increases critical hit chance by 4%.', effect:{ type:'stat', classId:'earth', stat:'critChance', amount:0.04 } },
    g3b:{ name:'Quarried Culmination', desc:'The final step on this branch. Increases critical hit chance by 3%.', effect:{ type:'stat', classId:'earth', stat:'critChance', amount:0.03 } },
    h1:{ name:'Cracked Foundation of the Mineshaft', desc:'What was solid now has a fault line through it. Permanently reduces luck by 4%. Required to press deeper into this stonebound path.', cursed:true, effect:{ type:'stat', classId:'earth', stat:'luck', amount:-0.04 } },
    h2a:{ name:'Stonebound Mineshaft Rite', desc:'The price of Cracked Foundation pays off. Increases fire cooldown by 5%.', effect:{ type:'stat', classId:'earth', stat:'fireCooldown', amount:0.05 } },
    h3a:{ name:'Iron Grit', desc:'A further step down the same path. Increases fire cooldown by 4%.', effect:{ type:'stat', classId:'earth', stat:'fireCooldown', amount:0.04 } },
    h2b:{ name:'Quarried Hoofwork', desc:'A second path opened by the same sacrifice. Increases fire cooldown by 4%.', effect:{ type:'stat', classId:'earth', stat:'fireCooldown', amount:0.04 } },
    h3b:{ name:'Bedrock Culmination', desc:'The final step on this branch. Increases fire cooldown by 3%.', effect:{ type:'stat', classId:'earth', stat:'fireCooldown', amount:0.03 } },
  }},
  { classId:'pegasus', nodes:{
    e1:{ name:'Shattered Resolve of the Updraft', desc:'Something has to give, and it gives here. Permanently reduces movement speed by 4%. Required to press deeper into this windworn path.', cursed:true, effect:{ type:'stat', classId:'pegasus', stat:'speed', amount:-0.04 } },
    e2a:{ name:'Windworn Updraft Rite', desc:'The price of Shattered Resolve pays off. Increases fire cooldown by 5%.', effect:{ type:'stat', classId:'pegasus', stat:'fireCooldown', amount:0.05 } },
    e3a:{ name:'Cloudbroken Skyline', desc:'A further step down the same path. Increases fire cooldown by 4%.', effect:{ type:'stat', classId:'pegasus', stat:'fireCooldown', amount:0.04 } },
    e2b:{ name:'Whisper of Doubt of the Slipstream', desc:'Hesitation creeps in and never quite leaves. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'pegasus', stat:'speed', amount:-0.03 } },
    e3b:{ name:'Gale-Torn Payoff', desc:'Everything the windworn path was built toward. Increases fire cooldown by 6%.', effect:{ type:'stat', classId:'pegasus', stat:'fireCooldown', amount:0.06 } },
    f1:{ name:'Fraying Nerve of the Wingbeat', desc:'The edge dulls just enough to be felt. Permanently reduces melee damage by 4%. Required to press deeper into this cloudbroken path.', cursed:true, effect:{ type:'stat', classId:'pegasus', stat:'meleeDamage', amount:-0.04 } },
    f2a:{ name:'Cloudbroken Wingbeat Rite', desc:'The price of Fraying Nerve pays off. Increases range by 5%.', effect:{ type:'stat', classId:'pegasus', stat:'rangeTiles', amount:0.05 } },
    f3a:{ name:'Gale-Torn Slipstream', desc:'A further step down the same path. Increases range by 4%.', effect:{ type:'stat', classId:'pegasus', stat:'rangeTiles', amount:0.04 } },
    f2b:{ name:'Weight of the Debt of the Updraft', desc:'Power borrowed always comes due. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'pegasus', stat:'meleeDamage', amount:-0.03 } },
    f3b:{ name:'Featherless Payoff', desc:'Everything the cloudbroken path was built toward. Increases range by 6%.', effect:{ type:'stat', classId:'pegasus', stat:'rangeTiles', amount:0.06 } },
    g1:{ name:'Cracked Foundation of the Skyline', desc:'What was solid now has a fault line through it. Permanently reduces movement speed by 4%. Required to press deeper into this gale-torn path.', cursed:true, effect:{ type:'stat', classId:'pegasus', stat:'speed', amount:-0.04 } },
    g2a:{ name:'Gale-Torn Skyline Rite', desc:'The price of Cracked Foundation pays off. Increases bolt speed by 5%.', effect:{ type:'stat', classId:'pegasus', stat:'boltSpeed', amount:0.05 } },
    g3a:{ name:'Featherless Updraft', desc:'A further step down the same path. Increases bolt speed by 4%.', effect:{ type:'stat', classId:'pegasus', stat:'boltSpeed', amount:0.04 } },
    g2b:{ name:'Faded Conviction of the Wingbeat', desc:'The old certainty isn\'t quite there anymore. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'pegasus', stat:'speed', amount:-0.03 } },
    g3b:{ name:'Windworn Payoff', desc:'Everything the gale-torn path was built toward. Increases bolt speed by 6%.', effect:{ type:'stat', classId:'pegasus', stat:'boltSpeed', amount:0.06 } },
    h1:{ name:'Bitter Bargain of the Slipstream', desc:'Every bargain like this one costs more than it looks. Permanently reduces melee damage by 4%. Required to press deeper into this featherless path.', cursed:true, effect:{ type:'stat', classId:'pegasus', stat:'meleeDamage', amount:-0.04 } },
    h2a:{ name:'Featherless Slipstream Rite', desc:'The price of Bitter Bargain pays off. Increases pickup magnet radius by 5%.', effect:{ type:'stat', classId:'pegasus', stat:'magnetRadius', amount:0.05 } },
    h3a:{ name:'Windworn Wingbeat', desc:'A further step down the same path. Increases pickup magnet radius by 4%.', effect:{ type:'stat', classId:'pegasus', stat:'magnetRadius', amount:0.04 } },
    h2b:{ name:'Cloudbroken Updraft', desc:'A second path opened by the same sacrifice. Increases pickup magnet radius by 4%.', effect:{ type:'stat', classId:'pegasus', stat:'magnetRadius', amount:0.04 } },
    h3b:{ name:'Gale-Torn Culmination', desc:'The final step on this branch. Increases pickup magnet radius by 3%.', effect:{ type:'stat', classId:'pegasus', stat:'magnetRadius', amount:0.03 } },
  }},
  { classId:'unicorn', nodes:{
    e1:{ name:'Whisper of Doubt of the Sigil', desc:'Hesitation creeps in and never quite leaves. Permanently reduces ranged damage by 4%. Required to press deeper into this arcane path.', cursed:true, effect:{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Arcane Sigil Rite', desc:'The price of Whisper of Doubt pays off. Increases pickup magnet radius by 5%.', effect:{ type:'stat', classId:'unicorn', stat:'magnetRadius', amount:0.05 } },
    e3a:{ name:'Runecut Discharge', desc:'A further step down the same path. Increases pickup magnet radius by 4%.', effect:{ type:'stat', classId:'unicorn', stat:'magnetRadius', amount:0.04 } },
    e2b:{ name:'Fraying Nerve of the Convergence', desc:'The edge dulls just enough to be felt. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Overcast Payoff', desc:'Everything the arcane path was built toward. Increases pickup magnet radius by 6%.', effect:{ type:'stat', classId:'unicorn', stat:'magnetRadius', amount:0.06 } },
    f1:{ name:'Weight of the Debt of the Horncraft', desc:'Power borrowed always comes due. Permanently reduces bolt speed by 4%. Required to press deeper into this runecut path.', cursed:true, effect:{ type:'stat', classId:'unicorn', stat:'boltSpeed', amount:-0.04 } },
    f2a:{ name:'Runecut Horncraft Rite', desc:'The price of Weight of the Debt pays off. Increases venom chance by 5%.', effect:{ type:'stat', classId:'unicorn', stat:'venomChance', amount:0.05 } },
    f3a:{ name:'Overcast Convergence', desc:'A further step down the same path. Increases venom chance by 4%.', effect:{ type:'stat', classId:'unicorn', stat:'venomChance', amount:0.04 } },
    f2b:{ name:'Cracked Foundation of the Sigil', desc:'What was solid now has a fault line through it. Permanently reduces bolt speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'unicorn', stat:'boltSpeed', amount:-0.03 } },
    f3b:{ name:'Fraying Payoff', desc:'Everything the runecut path was built toward. Increases venom chance by 6%.', effect:{ type:'stat', classId:'unicorn', stat:'venomChance', amount:0.06 } },
    g1:{ name:'Faded Conviction of the Discharge', desc:'The old certainty isn\'t quite there anymore. Permanently reduces ranged damage by 4%. Required to press deeper into this overcast path.', cursed:true, effect:{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Overcast Discharge Rite', desc:'The price of Faded Conviction pays off. Increases stun chance by 5%.', effect:{ type:'stat', classId:'unicorn', stat:'stunChance', amount:0.05 } },
    g3a:{ name:'Fraying Sigil', desc:'A further step down the same path. Increases stun chance by 4%.', effect:{ type:'stat', classId:'unicorn', stat:'stunChance', amount:0.04 } },
    g2b:{ name:'Bitter Bargain of the Horncraft', desc:'Every bargain like this one costs more than it looks. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:-0.03 } },
    g3b:{ name:'Arcane Payoff', desc:'Everything the overcast path was built toward. Increases stun chance by 6%.', effect:{ type:'stat', classId:'unicorn', stat:'stunChance', amount:0.06 } },
    h1:{ name:'Hollow Reserve of the Convergence', desc:'Something is drawn out and doesn\'t come back. Permanently reduces bolt speed by 4%. Required to press deeper into this fraying path.', cursed:true, effect:{ type:'stat', classId:'unicorn', stat:'boltSpeed', amount:-0.04 } },
    h2a:{ name:'Fraying Convergence Rite', desc:'The price of Hollow Reserve pays off. Increases freeze chance by 5%.', effect:{ type:'stat', classId:'unicorn', stat:'freezeChance', amount:0.05 } },
    h3a:{ name:'Arcane Horncraft', desc:'A further step down the same path. Increases freeze chance by 4%.', effect:{ type:'stat', classId:'unicorn', stat:'freezeChance', amount:0.04 } },
    h2b:{ name:'Splintered Focus of the Discharge', desc:'Attention split is strength divided. Permanently reduces bolt speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'unicorn', stat:'boltSpeed', amount:-0.03 } },
    h3b:{ name:'Runecut Payoff', desc:'Everything the fraying path was built toward. Increases freeze chance by 6%.', effect:{ type:'stat', classId:'unicorn', stat:'freezeChance', amount:0.06 } },
  }},
  { classId:'batpony', nodes:{
    e1:{ name:'Fraying Nerve of the Talon', desc:'The edge dulls just enough to be felt. Permanently reduces melee damage by 4%. Required to press deeper into this moonless path.', cursed:true, effect:{ type:'stat', classId:'batpony', stat:'meleeDamage', amount:-0.04 } },
    e2a:{ name:'Moonless Talon Rite', desc:'The price of Fraying Nerve pays off. Increases charm chance by 5%.', effect:{ type:'stat', classId:'batpony', stat:'charmChance', amount:0.05 } },
    e3a:{ name:'Fanged Rend', desc:'A further step down the same path. Increases charm chance by 4%.', effect:{ type:'stat', classId:'batpony', stat:'charmChance', amount:0.04 } },
    e2b:{ name:'Weight of the Debt of the Wingmembrane', desc:'Power borrowed always comes due. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'batpony', stat:'meleeDamage', amount:-0.03 } },
    e3b:{ name:'Echo-Torn Payoff', desc:'Everything the moonless path was built toward. Increases charm chance by 6%.', effect:{ type:'stat', classId:'batpony', stat:'charmChance', amount:0.06 } },
    f1:{ name:'Cracked Foundation of the Shrieking Cave', desc:'What was solid now has a fault line through it. Permanently reduces movement speed by 4%. Required to press deeper into this fanged path.', cursed:true, effect:{ type:'stat', classId:'batpony', stat:'speed', amount:-0.04 } },
    f2a:{ name:'Fanged Shrieking Cave Rite', desc:'The price of Cracked Foundation pays off. Increases freeze chance by 5%.', effect:{ type:'stat', classId:'batpony', stat:'freezeChance', amount:0.05 } },
    f3a:{ name:'Echo-Torn Wingmembrane', desc:'A further step down the same path. Increases freeze chance by 4%.', effect:{ type:'stat', classId:'batpony', stat:'freezeChance', amount:0.04 } },
    f2b:{ name:'Faded Conviction of the Talon', desc:'The old certainty isn\'t quite there anymore. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'batpony', stat:'speed', amount:-0.03 } },
    f3b:{ name:'Nightbound Payoff', desc:'Everything the fanged path was built toward. Increases freeze chance by 6%.', effect:{ type:'stat', classId:'batpony', stat:'freezeChance', amount:0.06 } },
    g1:{ name:'Bitter Bargain of the Rend', desc:'Every bargain like this one costs more than it looks. Permanently reduces melee damage by 4%. Required to press deeper into this echo-torn path.', cursed:true, effect:{ type:'stat', classId:'batpony', stat:'meleeDamage', amount:-0.04 } },
    g2a:{ name:'Echo-Torn Rend Rite', desc:'The price of Bitter Bargain pays off. Increases fear chance by 5%.', effect:{ type:'stat', classId:'batpony', stat:'fearChance', amount:0.05 } },
    g3a:{ name:'Nightbound Talon', desc:'A further step down the same path. Increases fear chance by 4%.', effect:{ type:'stat', classId:'batpony', stat:'fearChance', amount:0.04 } },
    g2b:{ name:'Moonless Wingmembrane', desc:'A second path opened by the same sacrifice. Increases fear chance by 4%.', effect:{ type:'stat', classId:'batpony', stat:'fearChance', amount:0.04 } },
    g3b:{ name:'Fanged Culmination', desc:'The final step on this branch. Increases fear chance by 3%.', effect:{ type:'stat', classId:'batpony', stat:'fearChance', amount:0.03 } },
    h1:{ name:'Hollow Reserve of the Wingmembrane', desc:'Something is drawn out and doesn\'t come back. Permanently reduces movement speed by 4%. Required to press deeper into this nightbound path.', cursed:true, effect:{ type:'stat', classId:'batpony', stat:'speed', amount:-0.04 } },
    h2a:{ name:'Nightbound Wingmembrane Rite', desc:'The price of Hollow Reserve pays off. Increases vulnerable chance by 5%.', effect:{ type:'stat', classId:'batpony', stat:'vulnerableChance', amount:0.05 } },
    h3a:{ name:'Moonless Shrieking Cave', desc:'A further step down the same path. Increases vulnerable chance by 4%.', effect:{ type:'stat', classId:'batpony', stat:'vulnerableChance', amount:0.04 } },
    h2b:{ name:'Fanged Talon', desc:'A second path opened by the same sacrifice. Increases vulnerable chance by 4%.', effect:{ type:'stat', classId:'batpony', stat:'vulnerableChance', amount:0.04 } },
    h3b:{ name:'Echo-Torn Culmination', desc:'The final step on this branch. Increases vulnerable chance by 3%.', effect:{ type:'stat', classId:'batpony', stat:'vulnerableChance', amount:0.03 } },
  }},
  { classId:'zebra', nodes:{
    e1:{ name:'Weight of the Debt of the Warpaint', desc:'Power borrowed always comes due. Permanently reduces melee damage by 4%. Required to press deeper into this bitterroot path.', cursed:true, effect:{ type:'stat', classId:'zebra', stat:'meleeDamage', amount:-0.04 } },
    e2a:{ name:'Bitterroot Warpaint Rite', desc:'The price of Weight of the Debt pays off. Reduces shop prices by 5%.', effect:{ type:'stat', classId:'zebra', stat:'shopDiscountBonus', amount:0.05 } }, // dead-node fix: e3a+e3b already summed to 0.10, the lifestealChance cap — this node's 0.05 was pure waste, retargeted to shopDiscountBonus (SKILL_TREE_STAT_FIELDS' "no nodes use it yet" field)
    e3a:{ name:'Feverbrewed Stampede', desc:'A further step down the same path. Increases lifesteal chance by 4%.', effect:{ type:'stat', classId:'zebra', stat:'lifestealChance', amount:0.04 } },
    e2b:{ name:'Cracked Foundation of the Bone-Toll', desc:'What was solid now has a fault line through it. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'zebra', stat:'meleeDamage', amount:-0.03 } },
    e3b:{ name:'Tribal Payoff', desc:'Everything the bitterroot path was built toward. Increases lifesteal chance by 6%.', effect:{ type:'stat', classId:'zebra', stat:'lifestealChance', amount:0.06 } },
    f1:{ name:'Faded Conviction of the Brew', desc:'The old certainty isn\'t quite there anymore. Permanently reduces critical hit chance by 4%. Required to press deeper into this feverbrewed path.', cursed:true, effect:{ type:'stat', classId:'zebra', stat:'critChance', amount:-0.04 } },
    f2a:{ name:'Feverbrewed Brew Rite', desc:'The price of Faded Conviction pays off. Increases on-kill heal chance by 5%.', effect:{ type:'stat', classId:'zebra', stat:'onKillHealChance', amount:0.05 } },
    f3a:{ name:'Tribal Bone-Toll', desc:'A further step down the same path. Increases on-kill heal chance by 4%.', effect:{ type:'stat', classId:'zebra', stat:'onKillHealChance', amount:0.04 } },
    f2b:{ name:'Bitter Bargain of the Warpaint', desc:'Every bargain like this one costs more than it looks. Permanently reduces critical hit chance by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'zebra', stat:'critChance', amount:-0.03 } },
    f3b:{ name:'Venomed Payoff', desc:'Everything the feverbrewed path was built toward. Increases on-kill heal chance by 6%.', effect:{ type:'stat', classId:'zebra', stat:'onKillHealChance', amount:0.06 } },
    g1:{ name:'Hollow Reserve of the Stampede', desc:'Something is drawn out and doesn\'t come back. Permanently reduces melee damage by 4%. Required to press deeper into this tribal path.', cursed:true, effect:{ type:'stat', classId:'zebra', stat:'meleeDamage', amount:-0.04 } },
    g2a:{ name:'Tribal Stampede Rite', desc:'The price of Hollow Reserve pays off. Increases dodge chance by 5%.', effect:{ type:'stat', classId:'zebra', stat:'dodgeChance', amount:0.05 } },
    g3a:{ name:'Venomed Warpaint', desc:'A further step down the same path. Increases dodge chance by 4%.', effect:{ type:'stat', classId:'zebra', stat:'dodgeChance', amount:0.04 } },
    g2b:{ name:'Splintered Focus of the Brew', desc:'Attention split is strength divided. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'zebra', stat:'meleeDamage', amount:-0.03 } },
    g3b:{ name:'Bitterroot Payoff', desc:'Everything the tribal path was built toward. Increases dodge chance by 6%.', effect:{ type:'stat', classId:'zebra', stat:'dodgeChance', amount:0.06 } },
    h1:{ name:'Blood Price of the Bone-Toll', desc:'A cost paid in strength, not coin. Permanently reduces critical hit chance by 4%. Required to press deeper into this venomed path.', cursed:true, effect:{ type:'stat', classId:'zebra', stat:'critChance', amount:-0.04 } },
    h2a:{ name:'Venomed Bone-Toll Rite', desc:'The price of Blood Price pays off. Increases movement speed by 5%.', effect:{ type:'stat', classId:'zebra', stat:'speed', amount:0.05 } },
    h3a:{ name:'Bitterroot Brew', desc:'A further step down the same path. Increases movement speed by 4%.', effect:{ type:'stat', classId:'zebra', stat:'speed', amount:0.04 } },
    h2b:{ name:'Feverbrewed Warpaint', desc:'A second path opened by the same sacrifice. Increases movement speed by 4%.', effect:{ type:'stat', classId:'zebra', stat:'speed', amount:0.04 } },
    h3b:{ name:'Tribal Culmination', desc:'The final step on this branch. Increases movement speed by 3%.', effect:{ type:'stat', classId:'zebra', stat:'speed', amount:0.03 } },
  }},
  { classId:'hypogriff', nodes:{
    e1:{ name:'Cracked Foundation of the Talon-Grip', desc:'What was solid now has a fault line through it. Permanently reduces movement speed by 4%. Required to press deeper into this stormtorn path.', cursed:true, effect:{ type:'stat', classId:'hypogriff', stat:'speed', amount:-0.04 } },
    e2a:{ name:'Stormtorn Talon-Grip Rite', desc:'The price of Cracked Foundation pays off. Increases ranged damage by 5%.', effect:{ type:'stat', classId:'hypogriff', stat:'rangedDamage', amount:0.05 } },
    e3a:{ name:'Thermal Skullcrack', desc:'A further step down the same path. Increases ranged damage by 4%.', effect:{ type:'stat', classId:'hypogriff', stat:'rangedDamage', amount:0.04 } },
    e2b:{ name:'Faded Conviction of the Thermal Surge', desc:'The old certainty isn\'t quite there anymore. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'hypogriff', stat:'speed', amount:-0.03 } },
    e3b:{ name:'Rattled Payoff', desc:'Everything the stormtorn path was built toward. Increases ranged damage by 6%.', effect:{ type:'stat', classId:'hypogriff', stat:'rangedDamage', amount:0.06 } },
    f1:{ name:'Bitter Bargain of the Pursuit', desc:'Every bargain like this one costs more than it looks. Permanently reduces melee damage by 4%. Required to press deeper into this thermal path.', cursed:true, effect:{ type:'stat', classId:'hypogriff', stat:'meleeDamage', amount:-0.04 } },
    f2a:{ name:'Thermal Pursuit Rite', desc:'The price of Bitter Bargain pays off. Increases critical hit chance by 5%.', effect:{ type:'stat', classId:'hypogriff', stat:'critChance', amount:0.05 } },
    f3a:{ name:'Rattled Thermal Surge', desc:'A further step down the same path. Increases critical hit chance by 4%.', effect:{ type:'stat', classId:'hypogriff', stat:'critChance', amount:0.04 } },
    f2b:{ name:'Hollow Reserve of the Talon-Grip', desc:'Something is drawn out and doesn\'t come back. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'hypogriff', stat:'meleeDamage', amount:-0.03 } },
    f3b:{ name:'Windswept Payoff', desc:'Everything the thermal path was built toward. Increases critical hit chance by 6%.', effect:{ type:'stat', classId:'hypogriff', stat:'critChance', amount:0.06 } },
    g1:{ name:'Splintered Focus of the Skullcrack', desc:'Attention split is strength divided. Permanently reduces movement speed by 4%. Required to press deeper into this rattled path.', cursed:true, effect:{ type:'stat', classId:'hypogriff', stat:'speed', amount:-0.04 } },
    g2a:{ name:'Rattled Skullcrack Rite', desc:'The price of Splintered Focus pays off. Increases luck by 5%.', effect:{ type:'stat', classId:'hypogriff', stat:'luck', amount:0.05 } },
    g3a:{ name:'Windswept Talon-Grip', desc:'A further step down the same path. Increases luck by 4%.', effect:{ type:'stat', classId:'hypogriff', stat:'luck', amount:0.04 } },
    g2b:{ name:'Blood Price of the Pursuit', desc:'A cost paid in strength, not coin. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'hypogriff', stat:'speed', amount:-0.03 } },
    g3b:{ name:'Stormtorn Payoff', desc:'Everything the rattled path was built toward. Increases luck by 6%.', effect:{ type:'stat', classId:'hypogriff', stat:'luck', amount:0.06 } },
    h1:{ name:'Shattered Resolve of the Thermal Surge', desc:'Something has to give, and it gives here. Permanently reduces melee damage by 4%. Required to press deeper into this windswept path.', cursed:true, effect:{ type:'stat', classId:'hypogriff', stat:'meleeDamage', amount:-0.04 } },
    h2a:{ name:'Windswept Thermal Surge Rite', desc:'The price of Shattered Resolve pays off. Increases fire cooldown by 5%.', effect:{ type:'stat', classId:'hypogriff', stat:'fireCooldown', amount:0.05 } },
    h3a:{ name:'Stormtorn Pursuit', desc:'A further step down the same path. Increases fire cooldown by 4%.', effect:{ type:'stat', classId:'hypogriff', stat:'fireCooldown', amount:0.04 } },
    h2b:{ name:'Whisper of Doubt of the Skullcrack', desc:'Hesitation creeps in and never quite leaves. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'hypogriff', stat:'meleeDamage', amount:-0.03 } },
    h3b:{ name:'Thermal Payoff', desc:'Everything the windswept path was built toward. Increases fire cooldown by 6%.', effect:{ type:'stat', classId:'hypogriff', stat:'fireCooldown', amount:0.06 } },
  }},
  { classId:'seapony', nodes:{
    e1:{ name:'Faded Conviction of the Riptide', desc:'The old certainty isn\'t quite there anymore. Permanently reduces ranged damage by 4%. Required to press deeper into this undertow path.', cursed:true, effect:{ type:'stat', classId:'seapony', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Undertow Riptide Rite', desc:'The price of Faded Conviction pays off. Increases melee cooldown by 5%.', effect:{ type:'stat', classId:'seapony', stat:'meleeCooldown', amount:0.05 } },
    e3a:{ name:'Brinebound Deepwater', desc:'A further step down the same path. Increases melee cooldown by 4%.', effect:{ type:'stat', classId:'seapony', stat:'meleeCooldown', amount:0.04 } },
    e2b:{ name:'Bitter Bargain of the Tidepool', desc:'Every bargain like this one costs more than it looks. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'seapony', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Pressurized Payoff', desc:'Everything the undertow path was built toward. Increases melee cooldown by 6%.', effect:{ type:'stat', classId:'seapony', stat:'meleeCooldown', amount:0.06 } },
    f1:{ name:'Hollow Reserve of the Current', desc:'Something is drawn out and doesn\'t come back. Permanently reduces critical hit chance by 4%. Required to press deeper into this brinebound path.', cursed:true, effect:{ type:'stat', classId:'seapony', stat:'critChance', amount:-0.04 } },
    f2a:{ name:'Brinebound Current Rite', desc:'The price of Hollow Reserve pays off. Increases range by 5%.', effect:{ type:'stat', classId:'seapony', stat:'rangeTiles', amount:0.05 } },
    f3a:{ name:'Pressurized Tidepool', desc:'A further step down the same path. Increases range by 4%.', effect:{ type:'stat', classId:'seapony', stat:'rangeTiles', amount:0.04 } },
    f2b:{ name:'Splintered Focus of the Riptide', desc:'Attention split is strength divided. Permanently reduces critical hit chance by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'seapony', stat:'critChance', amount:-0.03 } },
    f3b:{ name:'Abyssal Payoff', desc:'Everything the brinebound path was built toward. Increases range by 6%.', effect:{ type:'stat', classId:'seapony', stat:'rangeTiles', amount:0.06 } },
    g1:{ name:'Blood Price of the Deepwater', desc:'A cost paid in strength, not coin. Permanently reduces ranged damage by 4%. Required to press deeper into this pressurized path.', cursed:true, effect:{ type:'stat', classId:'seapony', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Pressurized Deepwater Rite', desc:'The price of Blood Price pays off. Increases bolt speed by 5%.', effect:{ type:'stat', classId:'seapony', stat:'boltSpeed', amount:0.05 } },
    g3a:{ name:'Abyssal Riptide', desc:'A further step down the same path. Increases bolt speed by 4%.', effect:{ type:'stat', classId:'seapony', stat:'boltSpeed', amount:0.04 } },
    g2b:{ name:'Undertow Tidepool', desc:'A second path opened by the same sacrifice. Increases bolt speed by 4%.', effect:{ type:'stat', classId:'seapony', stat:'boltSpeed', amount:0.04 } },
    g3b:{ name:'Brinebound Culmination', desc:'The final step on this branch. Increases bolt speed by 3%.', effect:{ type:'stat', classId:'seapony', stat:'boltSpeed', amount:0.03 } },
    h1:{ name:'Shattered Resolve of the Tidepool', desc:'Something has to give, and it gives here. Permanently reduces critical hit chance by 4%. Required to press deeper into this abyssal path.', cursed:true, effect:{ type:'stat', classId:'seapony', stat:'critChance', amount:-0.04 } },
    h2a:{ name:'Abyssal Tidepool Rite', desc:'The price of Shattered Resolve pays off. Increases pickup magnet radius by 5%.', effect:{ type:'stat', classId:'seapony', stat:'magnetRadius', amount:0.05 } },
    h3a:{ name:'Undertow Current', desc:'A further step down the same path. Increases pickup magnet radius by 4%.', effect:{ type:'stat', classId:'seapony', stat:'magnetRadius', amount:0.04 } },
    h2b:{ name:'Brinebound Riptide', desc:'A second path opened by the same sacrifice. Increases pickup magnet radius by 4%.', effect:{ type:'stat', classId:'seapony', stat:'magnetRadius', amount:0.04 } },
    h3b:{ name:'Pressurized Culmination', desc:'The final step on this branch. Increases pickup magnet radius by 3%.', effect:{ type:'stat', classId:'seapony', stat:'magnetRadius', amount:0.03 } },
  }},
  { classId:'ponybot', nodes:{
    e1:{ name:'Bitter Bargain of the Capacitor', desc:'Every bargain like this one costs more than it looks. Permanently reduces ranged damage by 4%. Required to press deeper into this overclocked path.', cursed:true, effect:{ type:'stat', classId:'ponybot', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Overclocked Capacitor Rite', desc:'The price of Bitter Bargain pays off. Increases bolt speed by 5%.', effect:{ type:'stat', classId:'ponybot', stat:'boltSpeed', amount:0.05 } },
    e3a:{ name:'Corroded Coil-Burn', desc:'A further step down the same path. Increases bolt speed by 4%.', effect:{ type:'stat', classId:'ponybot', stat:'boltSpeed', amount:0.04 } },
    e2b:{ name:'Hollow Reserve of the Firmware', desc:'Something is drawn out and doesn\'t come back. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'ponybot', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Redlined Payoff', desc:'Everything the overclocked path was built toward. Increases bolt speed by 6%.', effect:{ type:'stat', classId:'ponybot', stat:'boltSpeed', amount:0.06 } },
    f1:{ name:'Splintered Focus of the Chassis', desc:'Attention split is strength divided. Permanently reduces range by 4%. Required to press deeper into this corroded path.', cursed:true, effect:{ type:'stat', classId:'ponybot', stat:'rangeTiles', amount:-0.04 } },
    f2a:{ name:'Corroded Chassis Rite', desc:'The price of Splintered Focus pays off. Increases pickup magnet radius by 5%.', effect:{ type:'stat', classId:'ponybot', stat:'magnetRadius', amount:0.05 } },
    f3a:{ name:'Redlined Firmware', desc:'A further step down the same path. Increases pickup magnet radius by 4%.', effect:{ type:'stat', classId:'ponybot', stat:'magnetRadius', amount:0.04 } },
    f2b:{ name:'Blood Price of the Capacitor', desc:'A cost paid in strength, not coin. Permanently reduces range by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'ponybot', stat:'rangeTiles', amount:-0.03 } },
    f3b:{ name:'Short-Circuited Payoff', desc:'Everything the corroded path was built toward. Increases pickup magnet radius by 6%.', effect:{ type:'stat', classId:'ponybot', stat:'magnetRadius', amount:0.06 } },
    g1:{ name:'Shattered Resolve of the Coil-Burn', desc:'Something has to give, and it gives here. Permanently reduces ranged damage by 4%. Required to press deeper into this redlined path.', cursed:true, effect:{ type:'stat', classId:'ponybot', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Redlined Coil-Burn Rite', desc:'The price of Shattered Resolve pays off. Increases venom chance by 5%.', effect:{ type:'stat', classId:'ponybot', stat:'venomChance', amount:0.05 } },
    g3a:{ name:'Short-Circuited Capacitor', desc:'A further step down the same path. Increases venom chance by 4%.', effect:{ type:'stat', classId:'ponybot', stat:'venomChance', amount:0.04 } },
    g2b:{ name:'Whisper of Doubt of the Chassis', desc:'Hesitation creeps in and never quite leaves. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'ponybot', stat:'rangedDamage', amount:-0.03 } },
    g3b:{ name:'Overclocked Payoff', desc:'Everything the redlined path was built toward. Increases venom chance by 6%.', effect:{ type:'stat', classId:'ponybot', stat:'venomChance', amount:0.06 } },
    h1:{ name:'Fraying Nerve of the Firmware', desc:'The edge dulls just enough to be felt. Permanently reduces range by 4%. Required to press deeper into this short-circuited path.', cursed:true, effect:{ type:'stat', classId:'ponybot', stat:'rangeTiles', amount:-0.04 } },
    h2a:{ name:'Short-Circuited Firmware Rite', desc:'The price of Fraying Nerve pays off. Increases stun chance by 5%.', effect:{ type:'stat', classId:'ponybot', stat:'stunChance', amount:0.05 } },
    h3a:{ name:'Overclocked Chassis', desc:'A further step down the same path. Increases stun chance by 4%.', effect:{ type:'stat', classId:'ponybot', stat:'stunChance', amount:0.04 } },
    h2b:{ name:'Corroded Capacitor', desc:'A second path opened by the same sacrifice. Increases stun chance by 4%.', effect:{ type:'stat', classId:'ponybot', stat:'stunChance', amount:0.04 } },
    h3b:{ name:'Redlined Culmination', desc:'The final step on this branch. Increases stun chance by 3%.', effect:{ type:'stat', classId:'ponybot', stat:'stunChance', amount:0.03 } },
  }},
  { classId:'griffin', nodes:{
    e1:{ name:'Hollow Reserve of the Barrage', desc:'Something is drawn out and doesn\'t come back. Permanently reduces movement speed by 4%. Required to press deeper into this talon-torn path.', cursed:true, effect:{ type:'stat', classId:'griffin', stat:'speed', amount:-0.04 } },
    e2a:{ name:'Talon-Torn Barrage Rite', desc:'The price of Hollow Reserve pays off. Increases charm chance by 5%.', effect:{ type:'stat', classId:'griffin', stat:'charmChance', amount:0.05 } },
    e3a:{ name:'Windbitten Molt', desc:'A further step down the same path. Increases charm chance by 4%.', effect:{ type:'stat', classId:'griffin', stat:'charmChance', amount:0.04 } },
    e2b:{ name:'Splintered Focus of the Aerie', desc:'Attention split is strength divided. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'griffin', stat:'speed', amount:-0.03 } },
    e3b:{ name:'Feral Payoff', desc:'Everything the talon-torn path was built toward. Increases charm chance by 6%.', effect:{ type:'stat', classId:'griffin', stat:'charmChance', amount:0.06 } },
    f1:{ name:'Blood Price of the Hunting Dive', desc:'A cost paid in strength, not coin. Permanently reduces bolt speed by 4%. Required to press deeper into this windbitten path.', cursed:true, effect:{ type:'stat', classId:'griffin', stat:'boltSpeed', amount:-0.04 } },
    f2a:{ name:'Windbitten Hunting Dive Rite', desc:'The price of Blood Price pays off. Increases freeze chance by 5%.', effect:{ type:'stat', classId:'griffin', stat:'freezeChance', amount:0.05 } },
    f3a:{ name:'Feral Aerie', desc:'A further step down the same path. Increases freeze chance by 4%.', effect:{ type:'stat', classId:'griffin', stat:'freezeChance', amount:0.04 } },
    f2b:{ name:'Shattered Resolve of the Barrage', desc:'Something has to give, and it gives here. Permanently reduces bolt speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'griffin', stat:'boltSpeed', amount:-0.03 } },
    f3b:{ name:'Gale-Cracked Payoff', desc:'Everything the windbitten path was built toward. Increases freeze chance by 6%.', effect:{ type:'stat', classId:'griffin', stat:'freezeChance', amount:0.06 } },
    g1:{ name:'Whisper of Doubt of the Molt', desc:'Hesitation creeps in and never quite leaves. Permanently reduces movement speed by 4%. Required to press deeper into this feral path.', cursed:true, effect:{ type:'stat', classId:'griffin', stat:'speed', amount:-0.04 } },
    g2a:{ name:'Feral Molt Rite', desc:'The price of Whisper of Doubt pays off. Increases fear chance by 5%.', effect:{ type:'stat', classId:'griffin', stat:'fearChance', amount:0.05 } },
    g3a:{ name:'Gale-Cracked Barrage', desc:'A further step down the same path. Increases fear chance by 4%.', effect:{ type:'stat', classId:'griffin', stat:'fearChance', amount:0.04 } },
    g2b:{ name:'Fraying Nerve of the Hunting Dive', desc:'The edge dulls just enough to be felt. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'griffin', stat:'speed', amount:-0.03 } },
    g3b:{ name:'Talon-Torn Payoff', desc:'Everything the feral path was built toward. Increases fear chance by 6%.', effect:{ type:'stat', classId:'griffin', stat:'fearChance', amount:0.06 } },
    h1:{ name:'Weight of the Debt of the Aerie', desc:'Power borrowed always comes due. Permanently reduces bolt speed by 4%. Required to press deeper into this gale-cracked path.', cursed:true, effect:{ type:'stat', classId:'griffin', stat:'boltSpeed', amount:-0.04 } },
    h2a:{ name:'Gale-Cracked Aerie Rite', desc:'The price of Weight of the Debt pays off. Increases vulnerable chance by 5%.', effect:{ type:'stat', classId:'griffin', stat:'vulnerableChance', amount:0.05 } },
    h3a:{ name:'Talon-Torn Hunting Dive', desc:'A further step down the same path. Increases vulnerable chance by 4%.', effect:{ type:'stat', classId:'griffin', stat:'vulnerableChance', amount:0.04 } },
    h2b:{ name:'Cracked Foundation of the Molt', desc:'What was solid now has a fault line through it. Permanently reduces bolt speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'griffin', stat:'boltSpeed', amount:-0.03 } },
    h3b:{ name:'Windbitten Payoff', desc:'Everything the gale-cracked path was built toward. Increases vulnerable chance by 6%.', effect:{ type:'stat', classId:'griffin', stat:'vulnerableChance', amount:0.06 } },
  }},
  { classId:'kirin', nodes:{
    e1:{ name:'Splintered Focus of the Reckoning', desc:'Attention split is strength divided. Permanently reduces ranged damage by 4%. Required to press deeper into this smoldering path.', cursed:true, effect:{ type:'stat', classId:'kirin', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Smoldering Reckoning Rite', desc:'The price of Splintered Focus pays off. Reduces shop prices by 5%.', effect:{ type:'stat', classId:'kirin', stat:'shopDiscountBonus', amount:0.05 } }, // dead-node fix: e3a+e3b already summed to the 0.10 lifestealChance cap
    e3a:{ name:'Wrathbound Firestorm', desc:'A further step down the same path. Increases lifesteal chance by 4%.', effect:{ type:'stat', classId:'kirin', stat:'lifestealChance', amount:0.04 } },
    e2b:{ name:'Blood Price of the Judgment', desc:'A cost paid in strength, not coin. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'kirin', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Cindered Payoff', desc:'Everything the smoldering path was built toward. Increases lifesteal chance by 6%.', effect:{ type:'stat', classId:'kirin', stat:'lifestealChance', amount:0.06 } },
    f1:{ name:'Shattered Resolve of the Ember Vein', desc:'Something has to give, and it gives here. Permanently reduces critical hit chance by 4%. Required to press deeper into this wrathbound path.', cursed:true, effect:{ type:'stat', classId:'kirin', stat:'critChance', amount:-0.04 } },
    f2a:{ name:'Wrathbound Ember Vein Rite', desc:'The price of Shattered Resolve pays off. Increases on-kill heal chance by 5%.', effect:{ type:'stat', classId:'kirin', stat:'onKillHealChance', amount:0.05 } },
    f3a:{ name:'Cindered Judgment', desc:'A further step down the same path. Increases on-kill heal chance by 4%.', effect:{ type:'stat', classId:'kirin', stat:'onKillHealChance', amount:0.04 } },
    f2b:{ name:'Whisper of Doubt of the Reckoning', desc:'Hesitation creeps in and never quite leaves. Permanently reduces critical hit chance by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'kirin', stat:'critChance', amount:-0.03 } },
    f3b:{ name:'Ashen Payoff', desc:'Everything the wrathbound path was built toward. Increases on-kill heal chance by 6%.', effect:{ type:'stat', classId:'kirin', stat:'onKillHealChance', amount:0.06 } },
    g1:{ name:'Fraying Nerve of the Firestorm', desc:'The edge dulls just enough to be felt. Permanently reduces ranged damage by 4%. Required to press deeper into this cindered path.', cursed:true, effect:{ type:'stat', classId:'kirin', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Cindered Firestorm Rite', desc:'The price of Fraying Nerve pays off. Increases dodge chance by 5%.', effect:{ type:'stat', classId:'kirin', stat:'dodgeChance', amount:0.05 } },
    g3a:{ name:'Ashen Reckoning', desc:'A further step down the same path. Increases dodge chance by 4%.', effect:{ type:'stat', classId:'kirin', stat:'dodgeChance', amount:0.04 } },
    g2b:{ name:'Smoldering Judgment', desc:'A second path opened by the same sacrifice. Increases dodge chance by 4%.', effect:{ type:'stat', classId:'kirin', stat:'dodgeChance', amount:0.04 } },
    g3b:{ name:'Wrathbound Culmination', desc:'The final step on this branch. Increases dodge chance by 3%.', effect:{ type:'stat', classId:'kirin', stat:'dodgeChance', amount:0.03 } },
    h1:{ name:'Weight of the Debt of the Judgment', desc:'Power borrowed always comes due. Permanently reduces critical hit chance by 4%. Required to press deeper into this ashen path.', cursed:true, effect:{ type:'stat', classId:'kirin', stat:'critChance', amount:-0.04 } },
    h2a:{ name:'Ashen Judgment Rite', desc:'The price of Weight of the Debt pays off. Increases movement speed by 5%.', effect:{ type:'stat', classId:'kirin', stat:'speed', amount:0.05 } },
    h3a:{ name:'Smoldering Ember Vein', desc:'A further step down the same path. Increases movement speed by 4%.', effect:{ type:'stat', classId:'kirin', stat:'speed', amount:0.04 } },
    h2b:{ name:'Wrathbound Reckoning', desc:'A second path opened by the same sacrifice. Increases movement speed by 4%.', effect:{ type:'stat', classId:'kirin', stat:'speed', amount:0.04 } },
    h3b:{ name:'Cindered Culmination', desc:'The final step on this branch. Increases movement speed by 3%.', effect:{ type:'stat', classId:'kirin', stat:'speed', amount:0.03 } },
  }},
  { classId:'dragon', nodes:{
    e1:{ name:'Blood Price of the Inferno Core', desc:'A cost paid in strength, not coin. Permanently reduces ranged damage by 4%. Required to press deeper into this molten path.', cursed:true, effect:{ type:'stat', classId:'dragon', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Molten Inferno Core Rite', desc:'The price of Blood Price pays off. Increases vulnerable chance by 5%.', effect:{ type:'stat', classId:'dragon', stat:'vulnerableChance', amount:0.05 } },
    e3a:{ name:'Scaleworn Cinder', desc:'A further step down the same path. Increases vulnerable chance by 4%.', effect:{ type:'stat', classId:'dragon', stat:'vulnerableChance', amount:0.04 } },
    e2b:{ name:'Shattered Resolve of the Breath', desc:'Something has to give, and it gives here. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'dragon', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Ashcaked Payoff', desc:'Everything the molten path was built toward. Increases vulnerable chance by 6%.', effect:{ type:'stat', classId:'dragon', stat:'vulnerableChance', amount:0.06 } },
    f1:{ name:'Whisper of Doubt of the Whelp\'s Wrath', desc:'Hesitation creeps in and never quite leaves. Permanently reduces range by 4%. Required to press deeper into this scaleworn path.', cursed:true, effect:{ type:'stat', classId:'dragon', stat:'rangeTiles', amount:-0.04 } },
    f2a:{ name:'Scaleworn Whelp\'s Wrath Rite', desc:'The price of Whisper of Doubt pays off. Reduces shop prices by 5%.', effect:{ type:'stat', classId:'dragon', stat:'shopDiscountBonus', amount:0.05 } }, // dead-node fix: f3a+f3b already summed to the 0.10 lifestealChance cap
    f3a:{ name:'Ashcaked Breath', desc:'A further step down the same path. Increases lifesteal chance by 4%.', effect:{ type:'stat', classId:'dragon', stat:'lifestealChance', amount:0.04 } },
    f2b:{ name:'Fraying Nerve of the Inferno Core', desc:'The edge dulls just enough to be felt. Permanently reduces range by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'dragon', stat:'rangeTiles', amount:-0.03 } },
    f3b:{ name:'Furnace-Bled Payoff', desc:'Everything the scaleworn path was built toward. Increases lifesteal chance by 6%.', effect:{ type:'stat', classId:'dragon', stat:'lifestealChance', amount:0.06 } },
    g1:{ name:'Weight of the Debt of the Cinder', desc:'Power borrowed always comes due. Permanently reduces ranged damage by 4%. Required to press deeper into this ashcaked path.', cursed:true, effect:{ type:'stat', classId:'dragon', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Ashcaked Cinder Rite', desc:'The price of Weight of the Debt pays off. Increases on-kill heal chance by 5%.', effect:{ type:'stat', classId:'dragon', stat:'onKillHealChance', amount:0.05 } },
    g3a:{ name:'Furnace-Bled Inferno Core', desc:'A further step down the same path. Increases on-kill heal chance by 4%.', effect:{ type:'stat', classId:'dragon', stat:'onKillHealChance', amount:0.04 } },
    g2b:{ name:'Cracked Foundation of the Whelp\'s Wrath', desc:'What was solid now has a fault line through it. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'dragon', stat:'rangedDamage', amount:-0.03 } },
    g3b:{ name:'Molten Payoff', desc:'Everything the ashcaked path was built toward. Increases on-kill heal chance by 6%.', effect:{ type:'stat', classId:'dragon', stat:'onKillHealChance', amount:0.06 } },
    h1:{ name:'Faded Conviction of the Breath', desc:'The old certainty isn\'t quite there anymore. Permanently reduces range by 4%. Required to press deeper into this furnace-bled path.', cursed:true, effect:{ type:'stat', classId:'dragon', stat:'rangeTiles', amount:-0.04 } },
    h2a:{ name:'Furnace-Bled Breath Rite', desc:'The price of Faded Conviction pays off. Increases dodge chance by 5%.', effect:{ type:'stat', classId:'dragon', stat:'dodgeChance', amount:0.05 } },
    h3a:{ name:'Molten Whelp\'s Wrath', desc:'A further step down the same path. Increases dodge chance by 4%.', effect:{ type:'stat', classId:'dragon', stat:'dodgeChance', amount:0.04 } },
    h2b:{ name:'Scaleworn Inferno Core', desc:'A second path opened by the same sacrifice. Increases dodge chance by 4%.', effect:{ type:'stat', classId:'dragon', stat:'dodgeChance', amount:0.04 } },
    h3b:{ name:'Ashcaked Culmination', desc:'The final step on this branch. Increases dodge chance by 3%.', effect:{ type:'stat', classId:'dragon', stat:'dodgeChance', amount:0.03 } },
  }},
  { classId:'windigo', nodes:{
    e1:{ name:'Shattered Resolve of the Blizzard', desc:'Something has to give, and it gives here. Permanently reduces ranged damage by 4%. Required to press deeper into this frostbitten path.', cursed:true, effect:{ type:'stat', classId:'windigo', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Frostbitten Blizzard Rite', desc:'The price of Shattered Resolve pays off. Increases luck by 5%.', effect:{ type:'stat', classId:'windigo', stat:'luck', amount:0.05 } },
    e3a:{ name:'Absolute Killing Cold', desc:'A further step down the same path. Increases luck by 4%.', effect:{ type:'stat', classId:'windigo', stat:'luck', amount:0.04 } },
    e2b:{ name:'Whisper of Doubt of the Rime', desc:'Hesitation creeps in and never quite leaves. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'windigo', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Bitter Payoff', desc:'Everything the frostbitten path was built toward. Increases luck by 6%.', effect:{ type:'stat', classId:'windigo', stat:'luck', amount:0.06 } },
    f1:{ name:'Fraying Nerve of the Northern Squall', desc:'The edge dulls just enough to be felt. Permanently reduces bolt speed by 4%. Required to press deeper into this absolute path.', cursed:true, effect:{ type:'stat', classId:'windigo', stat:'boltSpeed', amount:-0.04 } },
    f2a:{ name:'Absolute Northern Squall Rite', desc:'The price of Fraying Nerve pays off. Increases melee cooldown by 5%.', effect:{ type:'stat', classId:'windigo', stat:'meleeCooldown', amount:0.05 } },
    f3a:{ name:'Bitter Rime', desc:'A further step down the same path. Increases melee cooldown by 4%.', effect:{ type:'stat', classId:'windigo', stat:'meleeCooldown', amount:0.04 } },
    f2b:{ name:'Weight of the Debt of the Blizzard', desc:'Power borrowed always comes due. Permanently reduces bolt speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'windigo', stat:'boltSpeed', amount:-0.03 } },
    f3b:{ name:'Hollowing Payoff', desc:'Everything the absolute path was built toward. Increases melee cooldown by 6%.', effect:{ type:'stat', classId:'windigo', stat:'meleeCooldown', amount:0.06 } },
    g1:{ name:'Cracked Foundation of the Killing Cold', desc:'What was solid now has a fault line through it. Permanently reduces ranged damage by 4%. Required to press deeper into this bitter path.', cursed:true, effect:{ type:'stat', classId:'windigo', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Bitter Killing Cold Rite', desc:'The price of Cracked Foundation pays off. Increases range by 5%.', effect:{ type:'stat', classId:'windigo', stat:'rangeTiles', amount:0.05 } },
    g3a:{ name:'Hollowing Blizzard', desc:'A further step down the same path. Increases range by 4%.', effect:{ type:'stat', classId:'windigo', stat:'rangeTiles', amount:0.04 } },
    g2b:{ name:'Faded Conviction of the Northern Squall', desc:'The old certainty isn\'t quite there anymore. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'windigo', stat:'rangedDamage', amount:-0.03 } },
    g3b:{ name:'Frostbitten Payoff', desc:'Everything the bitter path was built toward. Increases range by 6%.', effect:{ type:'stat', classId:'windigo', stat:'rangeTiles', amount:0.06 } },
    h1:{ name:'Bitter Bargain of the Rime', desc:'Every bargain like this one costs more than it looks. Permanently reduces bolt speed by 4%. Required to press deeper into this hollowing path.', cursed:true, effect:{ type:'stat', classId:'windigo', stat:'boltSpeed', amount:-0.04 } },
    h2a:{ name:'Hollowing Rime Rite', desc:'The price of Bitter Bargain pays off. Increases pickup magnet radius by 5%.', effect:{ type:'stat', classId:'windigo', stat:'magnetRadius', amount:0.05 } },
    h3a:{ name:'Frostbitten Northern Squall', desc:'A further step down the same path. Increases pickup magnet radius by 4%.', effect:{ type:'stat', classId:'windigo', stat:'magnetRadius', amount:0.04 } },
    h2b:{ name:'Hollow Reserve of the Killing Cold', desc:'Something is drawn out and doesn\'t come back. Permanently reduces bolt speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'windigo', stat:'boltSpeed', amount:-0.03 } },
    h3b:{ name:'Absolute Payoff', desc:'Everything the hollowing path was built toward. Increases pickup magnet radius by 6%.', effect:{ type:'stat', classId:'windigo', stat:'magnetRadius', amount:0.06 } },
  }},
  { classId:'kelpie', nodes:{
    e1:{ name:'Whisper of Doubt of the Undertow', desc:'Hesitation creeps in and never quite leaves. Permanently reduces melee damage by 4%. Required to press deeper into this waterlogged path.', cursed:true, effect:{ type:'stat', classId:'kelpie', stat:'meleeDamage', amount:-0.04 } },
    e2a:{ name:'Waterlogged Undertow Rite', desc:'The price of Whisper of Doubt pays off. Increases fire cooldown by 5%.', effect:{ type:'stat', classId:'kelpie', stat:'fireCooldown', amount:0.05 } },
    e3a:{ name:'Silt-Deep Snare', desc:'A further step down the same path. Increases fire cooldown by 4%.', effect:{ type:'stat', classId:'kelpie', stat:'fireCooldown', amount:0.04 } },
    e2b:{ name:'Fraying Nerve of the Grasp', desc:'The edge dulls just enough to be felt. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'kelpie', stat:'meleeDamage', amount:-0.03 } },
    e3b:{ name:'Drowning Payoff', desc:'Everything the waterlogged path was built toward. Increases fire cooldown by 6%.', effect:{ type:'stat', classId:'kelpie', stat:'fireCooldown', amount:0.06 } },
    f1:{ name:'Weight of the Debt of the River Maw', desc:'Power borrowed always comes due. Permanently reduces range by 4%. Required to press deeper into this silt-deep path.', cursed:true, effect:{ type:'stat', classId:'kelpie', stat:'rangeTiles', amount:-0.04 } },
    f2a:{ name:'Silt-Deep River Maw Rite', desc:'The price of Weight of the Debt pays off. Increases bolt speed by 5%.', effect:{ type:'stat', classId:'kelpie', stat:'boltSpeed', amount:0.05 } },
    f3a:{ name:'Drowning Grasp', desc:'A further step down the same path. Increases bolt speed by 4%.', effect:{ type:'stat', classId:'kelpie', stat:'boltSpeed', amount:0.04 } },
    f2b:{ name:'Cracked Foundation of the Undertow', desc:'What was solid now has a fault line through it. Permanently reduces range by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'kelpie', stat:'rangeTiles', amount:-0.03 } },
    f3b:{ name:'Riverbound Payoff', desc:'Everything the silt-deep path was built toward. Increases bolt speed by 6%.', effect:{ type:'stat', classId:'kelpie', stat:'boltSpeed', amount:0.06 } },
    g1:{ name:'Faded Conviction of the Snare', desc:'The old certainty isn\'t quite there anymore. Permanently reduces melee damage by 4%. Required to press deeper into this drowning path.', cursed:true, effect:{ type:'stat', classId:'kelpie', stat:'meleeDamage', amount:-0.04 } },
    g2a:{ name:'Drowning Snare Rite', desc:'The price of Faded Conviction pays off. Increases pickup magnet radius by 5%.', effect:{ type:'stat', classId:'kelpie', stat:'magnetRadius', amount:0.05 } },
    g3a:{ name:'Riverbound Undertow', desc:'A further step down the same path. Increases pickup magnet radius by 4%.', effect:{ type:'stat', classId:'kelpie', stat:'magnetRadius', amount:0.04 } },
    g2b:{ name:'Waterlogged Grasp', desc:'A second path opened by the same sacrifice. Increases pickup magnet radius by 4%.', effect:{ type:'stat', classId:'kelpie', stat:'magnetRadius', amount:0.04 } },
    g3b:{ name:'Silt-Deep Culmination', desc:'The final step on this branch. Increases pickup magnet radius by 3%.', effect:{ type:'stat', classId:'kelpie', stat:'magnetRadius', amount:0.03 } },
    h1:{ name:'Bitter Bargain of the Grasp', desc:'Every bargain like this one costs more than it looks. Permanently reduces range by 4%. Required to press deeper into this riverbound path.', cursed:true, effect:{ type:'stat', classId:'kelpie', stat:'rangeTiles', amount:-0.04 } },
    h2a:{ name:'Riverbound Grasp Rite', desc:'The price of Bitter Bargain pays off. Increases venom chance by 5%.', effect:{ type:'stat', classId:'kelpie', stat:'venomChance', amount:0.05 } },
    h3a:{ name:'Waterlogged River Maw', desc:'A further step down the same path. Increases venom chance by 4%.', effect:{ type:'stat', classId:'kelpie', stat:'venomChance', amount:0.04 } },
    h2b:{ name:'Silt-Deep Undertow', desc:'A second path opened by the same sacrifice. Increases venom chance by 4%.', effect:{ type:'stat', classId:'kelpie', stat:'venomChance', amount:0.04 } },
    h3b:{ name:'Drowning Culmination', desc:'The final step on this branch. Increases venom chance by 3%.', effect:{ type:'stat', classId:'kelpie', stat:'venomChance', amount:0.03 } },
  }},
  { classId:'breezie', nodes:{
    e1:{ name:'Fraying Nerve of the Dustmote', desc:'The edge dulls just enough to be felt. Permanently reduces movement speed by 4%. Required to press deeper into this gossamer path.', cursed:true, effect:{ type:'stat', classId:'breezie', stat:'speed', amount:-0.04 } },
    e2a:{ name:'Gossamer Dustmote Rite', desc:'The price of Fraying Nerve pays off. Increases freeze chance by 5%.', effect:{ type:'stat', classId:'breezie', stat:'freezeChance', amount:0.05 } },
    e3a:{ name:'Windborne Pollen Trail', desc:'A further step down the same path. Increases freeze chance by 4%.', effect:{ type:'stat', classId:'breezie', stat:'freezeChance', amount:0.04 } },
    e2b:{ name:'Weight of the Debt of the Sunbeam', desc:'Power borrowed always comes due. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'breezie', stat:'speed', amount:-0.03 } },
    e3b:{ name:'Featherweight Payoff', desc:'Everything the gossamer path was built toward. Increases freeze chance by 6%.', effect:{ type:'stat', classId:'breezie', stat:'freezeChance', amount:0.06 } },
    f1:{ name:'Cracked Foundation of the Zephyr', desc:'What was solid now has a fault line through it. Permanently reduces bolt speed by 4%. Required to press deeper into this windborne path.', cursed:true, effect:{ type:'stat', classId:'breezie', stat:'boltSpeed', amount:-0.04 } },
    f2a:{ name:'Windborne Zephyr Rite', desc:'The price of Cracked Foundation pays off. Increases fear chance by 5%.', effect:{ type:'stat', classId:'breezie', stat:'fearChance', amount:0.05 } },
    f3a:{ name:'Featherweight Sunbeam', desc:'A further step down the same path. Increases fear chance by 4%.', effect:{ type:'stat', classId:'breezie', stat:'fearChance', amount:0.04 } },
    f2b:{ name:'Faded Conviction of the Dustmote', desc:'The old certainty isn\'t quite there anymore. Permanently reduces bolt speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'breezie', stat:'boltSpeed', amount:-0.03 } },
    f3b:{ name:'Static-Kissed Payoff', desc:'Everything the windborne path was built toward. Increases fear chance by 6%.', effect:{ type:'stat', classId:'breezie', stat:'fearChance', amount:0.06 } },
    g1:{ name:'Bitter Bargain of the Pollen Trail', desc:'Every bargain like this one costs more than it looks. Permanently reduces movement speed by 4%. Required to press deeper into this featherweight path.', cursed:true, effect:{ type:'stat', classId:'breezie', stat:'speed', amount:-0.04 } },
    g2a:{ name:'Featherweight Pollen Trail Rite', desc:'The price of Bitter Bargain pays off. Increases vulnerable chance by 5%.', effect:{ type:'stat', classId:'breezie', stat:'vulnerableChance', amount:0.05 } },
    g3a:{ name:'Static-Kissed Dustmote', desc:'A further step down the same path. Increases vulnerable chance by 4%.', effect:{ type:'stat', classId:'breezie', stat:'vulnerableChance', amount:0.04 } },
    g2b:{ name:'Hollow Reserve of the Zephyr', desc:'Something is drawn out and doesn\'t come back. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'breezie', stat:'speed', amount:-0.03 } },
    g3b:{ name:'Gossamer Payoff', desc:'Everything the featherweight path was built toward. Increases vulnerable chance by 6%.', effect:{ type:'stat', classId:'breezie', stat:'vulnerableChance', amount:0.06 } },
    h1:{ name:'Splintered Focus of the Sunbeam', desc:'Attention split is strength divided. Permanently reduces bolt speed by 4%. Required to press deeper into this static-kissed path.', cursed:true, effect:{ type:'stat', classId:'breezie', stat:'boltSpeed', amount:-0.04 } },
    h2a:{ name:'Static-Kissed Sunbeam Rite', desc:'The price of Splintered Focus pays off. Increases lifesteal chance by 5%.', effect:{ type:'stat', classId:'breezie', stat:'lifestealChance', amount:0.05 } },
    h3a:{ name:'Gossamer Zephyr', desc:'A further step down the same path. Increases lifesteal chance by 4%.', effect:{ type:'stat', classId:'breezie', stat:'lifestealChance', amount:0.04 } },
    h2b:{ name:'Windborne Dustmote', desc:'A second path opened by the same sacrifice. Reduces shop prices by 4%.', effect:{ type:'stat', classId:'breezie', stat:'shopDiscountBonus', amount:0.04 } }, // dead-node fix: breezie's h-branch had FOUR lifestealChance nodes (0.05+0.04+0.04+0.03=0.16) against the 0.10 cap; h2a+h3a alone already reach 0.09, so both h2b and h3b were pure waste — retargeted rather than just one node
    h3b:{ name:'Featherweight Culmination', desc:'The final step on this branch. Reduces shop prices by 3%.', effect:{ type:'stat', classId:'breezie', stat:'shopDiscountBonus', amount:0.03 } },
  }},
  { classId:'dnbpony', nodes:{
    e1:{ name:'Weight of the Debt of the Bassline', desc:'Power borrowed always comes due. Permanently reduces ranged damage by 4%. Required to press deeper into this redlined path.', cursed:true, effect:{ type:'stat', classId:'dnbpony', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Redlined Bassline Rite', desc:'The price of Weight of the Debt pays off. Reduces shop prices by 5%.', effect:{ type:'stat', classId:'dnbpony', stat:'shopDiscountBonus', amount:0.05 } }, // dead-node fix: e3a+e3b already summed to the 0.10 lifestealChance cap
    e3a:{ name:'Neon Breakbeat', desc:'A further step down the same path. Increases lifesteal chance by 4%.', effect:{ type:'stat', classId:'dnbpony', stat:'lifestealChance', amount:0.04 } },
    e2b:{ name:'Cracked Foundation of the Violet Blur', desc:'What was solid now has a fault line through it. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'dnbpony', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Subwoofer-Torn Payoff', desc:'Everything the redlined path was built toward. Increases lifesteal chance by 6%.', effect:{ type:'stat', classId:'dnbpony', stat:'lifestealChance', amount:0.06 } },
    f1:{ name:'Faded Conviction of the Drop', desc:'The old certainty isn\'t quite there anymore. Permanently reduces movement speed by 4%. Required to press deeper into this neon path.', cursed:true, effect:{ type:'stat', classId:'dnbpony', stat:'speed', amount:-0.04 } },
    f2a:{ name:'Neon Drop Rite', desc:'The price of Faded Conviction pays off. Increases on-kill heal chance by 5%.', effect:{ type:'stat', classId:'dnbpony', stat:'onKillHealChance', amount:0.05 } },
    f3a:{ name:'Subwoofer-Torn Violet Blur', desc:'A further step down the same path. Increases on-kill heal chance by 4%.', effect:{ type:'stat', classId:'dnbpony', stat:'onKillHealChance', amount:0.04 } },
    f2b:{ name:'Bitter Bargain of the Bassline', desc:'Every bargain like this one costs more than it looks. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'dnbpony', stat:'speed', amount:-0.03 } },
    f3b:{ name:'Overdriven Payoff', desc:'Everything the neon path was built toward. Increases on-kill heal chance by 6%.', effect:{ type:'stat', classId:'dnbpony', stat:'onKillHealChance', amount:0.06 } },
    g1:{ name:'Hollow Reserve of the Breakbeat', desc:'Something is drawn out and doesn\'t come back. Permanently reduces ranged damage by 4%. Required to press deeper into this subwoofer-torn path.', cursed:true, effect:{ type:'stat', classId:'dnbpony', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Subwoofer-Torn Breakbeat Rite', desc:'The price of Hollow Reserve pays off. Increases dodge chance by 5%.', effect:{ type:'stat', classId:'dnbpony', stat:'dodgeChance', amount:0.05 } },
    g3a:{ name:'Overdriven Bassline', desc:'A further step down the same path. Increases dodge chance by 4%.', effect:{ type:'stat', classId:'dnbpony', stat:'dodgeChance', amount:0.04 } },
    g2b:{ name:'Splintered Focus of the Drop', desc:'Attention split is strength divided. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'dnbpony', stat:'rangedDamage', amount:-0.03 } },
    g3b:{ name:'Redlined Payoff', desc:'Everything the subwoofer-torn path was built toward. Increases dodge chance by 6%.', effect:{ type:'stat', classId:'dnbpony', stat:'dodgeChance', amount:0.06 } },
    h1:{ name:'Blood Price of the Violet Blur', desc:'A cost paid in strength, not coin. Permanently reduces movement speed by 4%. Required to press deeper into this overdriven path.', cursed:true, effect:{ type:'stat', classId:'dnbpony', stat:'speed', amount:-0.04 } },
    h2a:{ name:'Overdriven Violet Blur Rite', desc:'The price of Blood Price pays off. Increases melee damage by 5%.', effect:{ type:'stat', classId:'dnbpony', stat:'meleeDamage', amount:0.05 } },
    h3a:{ name:'Redlined Drop', desc:'A further step down the same path. Increases melee damage by 4%.', effect:{ type:'stat', classId:'dnbpony', stat:'meleeDamage', amount:0.04 } },
    h2b:{ name:'Shattered Resolve of the Breakbeat', desc:'Something has to give, and it gives here. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'dnbpony', stat:'speed', amount:-0.03 } },
    h3b:{ name:'Neon Payoff', desc:'Everything the overdriven path was built toward. Increases melee damage by 6%.', effect:{ type:'stat', classId:'dnbpony', stat:'meleeDamage', amount:0.06 } },
  }},
  { classId:'crystalpony', nodes:{
    e1:{ name:'Cracked Foundation of the Shard', desc:'What was solid now has a fault line through it. Permanently reduces ranged damage by 4%. Required to press deeper into this faceted path.', cursed:true, effect:{ type:'stat', classId:'crystalpony', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Faceted Shard Rite', desc:'The price of Cracked Foundation pays off. Reduces shop prices by 5%.', effect:{ type:'stat', classId:'crystalpony', stat:'shopDiscountBonus', amount:0.05 } }, // dead-node fix: e3a+e3b already summed to the 0.10 lifestealChance cap
    e3a:{ name:'Fractured Gemstone', desc:'A further step down the same path. Increases lifesteal chance by 4%.', effect:{ type:'stat', classId:'crystalpony', stat:'lifestealChance', amount:0.04 } },
    e2b:{ name:'Faded Conviction of the Convergence', desc:'The old certainty isn\'t quite there anymore. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'crystalpony', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Prismbound Payoff', desc:'Everything the faceted path was built toward. Increases lifesteal chance by 6%.', effect:{ type:'stat', classId:'crystalpony', stat:'lifestealChance', amount:0.06 } },
    f1:{ name:'Bitter Bargain of the Refraction', desc:'Every bargain like this one costs more than it looks. Permanently reduces luck by 4%. Required to press deeper into this fractured path.', cursed:true, effect:{ type:'stat', classId:'crystalpony', stat:'luck', amount:-0.04 } },
    f2a:{ name:'Fractured Refraction Rite', desc:'The price of Bitter Bargain pays off. Increases on-kill heal chance by 5%.', effect:{ type:'stat', classId:'crystalpony', stat:'onKillHealChance', amount:0.05 } },
    f3a:{ name:'Prismbound Convergence', desc:'A further step down the same path. Increases on-kill heal chance by 4%.', effect:{ type:'stat', classId:'crystalpony', stat:'onKillHealChance', amount:0.04 } },
    f2b:{ name:'Hollow Reserve of the Shard', desc:'Something is drawn out and doesn\'t come back. Permanently reduces luck by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'crystalpony', stat:'luck', amount:-0.03 } },
    f3b:{ name:'Overcharged Payoff', desc:'Everything the fractured path was built toward. Increases on-kill heal chance by 6%.', effect:{ type:'stat', classId:'crystalpony', stat:'onKillHealChance', amount:0.06 } },
    g1:{ name:'Splintered Focus of the Gemstone', desc:'Attention split is strength divided. Permanently reduces ranged damage by 4%. Required to press deeper into this prismbound path.', cursed:true, effect:{ type:'stat', classId:'crystalpony', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Prismbound Gemstone Rite', desc:'The price of Splintered Focus pays off. Increases dodge chance by 5%.', effect:{ type:'stat', classId:'crystalpony', stat:'dodgeChance', amount:0.05 } },
    g3a:{ name:'Overcharged Shard', desc:'A further step down the same path. Increases dodge chance by 4%.', effect:{ type:'stat', classId:'crystalpony', stat:'dodgeChance', amount:0.04 } },
    g2b:{ name:'Faceted Convergence', desc:'A second path opened by the same sacrifice. Increases dodge chance by 4%.', effect:{ type:'stat', classId:'crystalpony', stat:'dodgeChance', amount:0.04 } },
    g3b:{ name:'Fractured Culmination', desc:'The final step on this branch. Increases dodge chance by 3%.', effect:{ type:'stat', classId:'crystalpony', stat:'dodgeChance', amount:0.03 } },
    h1:{ name:'Blood Price of the Convergence', desc:'A cost paid in strength, not coin. Permanently reduces luck by 4%. Required to press deeper into this overcharged path.', cursed:true, effect:{ type:'stat', classId:'crystalpony', stat:'luck', amount:-0.04 } },
    h2a:{ name:'Overcharged Convergence Rite', desc:'The price of Blood Price pays off. Increases movement speed by 5%.', effect:{ type:'stat', classId:'crystalpony', stat:'speed', amount:0.05 } },
    h3a:{ name:'Faceted Refraction', desc:'A further step down the same path. Increases movement speed by 4%.', effect:{ type:'stat', classId:'crystalpony', stat:'speed', amount:0.04 } },
    h2b:{ name:'Fractured Shard', desc:'A second path opened by the same sacrifice. Increases movement speed by 4%.', effect:{ type:'stat', classId:'crystalpony', stat:'speed', amount:0.04 } },
    h3b:{ name:'Prismbound Culmination', desc:'The final step on this branch. Increases movement speed by 3%.', effect:{ type:'stat', classId:'crystalpony', stat:'speed', amount:0.03 } },
  }},
  { classId:'mule', nodes:{
    e1:{ name:'Faded Conviction of the Saddlebag', desc:'The old certainty isn\'t quite there anymore. Permanently reduces melee damage by 4%. Required to press deeper into this overburdened path.', cursed:true, effect:{ type:'stat', classId:'mule', stat:'meleeDamage', amount:-0.04 } },
    e2a:{ name:'Overburdened Saddlebag Rite', desc:'The price of Faded Conviction pays off. Increases luck by 5%.', effect:{ type:'stat', classId:'mule', stat:'luck', amount:0.05 } },
    e3a:{ name:'Stubborn Pack-Weight', desc:'A further step down the same path. Increases luck by 4%.', effect:{ type:'stat', classId:'mule', stat:'luck', amount:0.04 } },
    e2b:{ name:'Bitter Bargain of the Wallop', desc:'Every bargain like this one costs more than it looks. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'mule', stat:'meleeDamage', amount:-0.03 } },
    e3b:{ name:'Trail-Worn Payoff', desc:'Everything the overburdened path was built toward. Increases luck by 6%.', effect:{ type:'stat', classId:'mule', stat:'luck', amount:0.06 } },
    f1:{ name:'Hollow Reserve of the Haul', desc:'Something is drawn out and doesn\'t come back. Permanently reduces pickup magnet radius by 4%. Required to press deeper into this stubborn path.', cursed:true, effect:{ type:'stat', classId:'mule', stat:'magnetRadius', amount:-0.04 } },
    f2a:{ name:'Stubborn Haul Rite', desc:'The price of Hollow Reserve pays off. Increases fire cooldown by 5%.', effect:{ type:'stat', classId:'mule', stat:'fireCooldown', amount:0.05 } },
    f3a:{ name:'Trail-Worn Wallop', desc:'A further step down the same path. Increases fire cooldown by 4%.', effect:{ type:'stat', classId:'mule', stat:'fireCooldown', amount:0.04 } },
    f2b:{ name:'Splintered Focus of the Saddlebag', desc:'Attention split is strength divided. Permanently reduces pickup magnet radius by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'mule', stat:'magnetRadius', amount:-0.03 } },
    f3b:{ name:'Loaded Payoff', desc:'Everything the stubborn path was built toward. Increases fire cooldown by 6%.', effect:{ type:'stat', classId:'mule', stat:'fireCooldown', amount:0.06 } },
    g1:{ name:'Blood Price of the Pack-Weight', desc:'A cost paid in strength, not coin. Permanently reduces melee damage by 4%. Required to press deeper into this trail-worn path.', cursed:true, effect:{ type:'stat', classId:'mule', stat:'meleeDamage', amount:-0.04 } },
    g2a:{ name:'Trail-Worn Pack-Weight Rite', desc:'The price of Blood Price pays off. Increases range by 5%.', effect:{ type:'stat', classId:'mule', stat:'rangeTiles', amount:0.05 } },
    g3a:{ name:'Loaded Saddlebag', desc:'A further step down the same path. Increases range by 4%.', effect:{ type:'stat', classId:'mule', stat:'rangeTiles', amount:0.04 } },
    g2b:{ name:'Shattered Resolve of the Haul', desc:'Something has to give, and it gives here. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'mule', stat:'meleeDamage', amount:-0.03 } },
    g3b:{ name:'Overburdened Payoff', desc:'Everything the trail-worn path was built toward. Increases range by 6%.', effect:{ type:'stat', classId:'mule', stat:'rangeTiles', amount:0.06 } },
    h1:{ name:'Whisper of Doubt of the Wallop', desc:'Hesitation creeps in and never quite leaves. Permanently reduces pickup magnet radius by 4%. Required to press deeper into this loaded path.', cursed:true, effect:{ type:'stat', classId:'mule', stat:'magnetRadius', amount:-0.04 } },
    h2a:{ name:'Loaded Wallop Rite', desc:'The price of Whisper of Doubt pays off. Increases bolt speed by 5%.', effect:{ type:'stat', classId:'mule', stat:'boltSpeed', amount:0.05 } },
    h3a:{ name:'Overburdened Haul', desc:'A further step down the same path. Increases bolt speed by 4%.', effect:{ type:'stat', classId:'mule', stat:'boltSpeed', amount:0.04 } },
    h2b:{ name:'Stubborn Saddlebag', desc:'A second path opened by the same sacrifice. Increases bolt speed by 4%.', effect:{ type:'stat', classId:'mule', stat:'boltSpeed', amount:0.04 } },
    h3b:{ name:'Trail-Worn Culmination', desc:'The final step on this branch. Increases bolt speed by 3%.', effect:{ type:'stat', classId:'mule', stat:'boltSpeed', amount:0.03 } },
  }},
  { classId:'alicorn', nodes:{
    e1:{ name:'Bitter Bargain of the Corona', desc:'Every bargain like this one costs more than it looks. Permanently reduces ranged damage by 4%. Required to press deeper into this solar path.', cursed:true, effect:{ type:'stat', classId:'alicorn', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Solar Corona Rite', desc:'The price of Bitter Bargain pays off. Increases melee cooldown by 5%.', effect:{ type:'stat', classId:'alicorn', stat:'meleeCooldown', amount:0.05 } },
    e3a:{ name:'Lunar Convergence', desc:'A further step down the same path. Increases melee cooldown by 4%.', effect:{ type:'stat', classId:'alicorn', stat:'meleeCooldown', amount:0.04 } },
    e2b:{ name:'Hollow Reserve of the Halo', desc:'Something is drawn out and doesn\'t come back. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'alicorn', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Overreaching Payoff', desc:'Everything the solar path was built toward. Increases melee cooldown by 6%.', effect:{ type:'stat', classId:'alicorn', stat:'meleeCooldown', amount:0.06 } },
    f1:{ name:'Splintered Focus of the Ascent', desc:'Attention split is strength divided. Permanently reduces movement speed by 4%. Required to press deeper into this lunar path.', cursed:true, effect:{ type:'stat', classId:'alicorn', stat:'speed', amount:-0.04 } },
    f2a:{ name:'Lunar Ascent Rite', desc:'The price of Splintered Focus pays off. Increases range by 5%.', effect:{ type:'stat', classId:'alicorn', stat:'rangeTiles', amount:0.05 } },
    f3a:{ name:'Overreaching Halo', desc:'A further step down the same path. Increases range by 4%.', effect:{ type:'stat', classId:'alicorn', stat:'rangeTiles', amount:0.04 } },
    f2b:{ name:'Blood Price of the Corona', desc:'A cost paid in strength, not coin. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'alicorn', stat:'speed', amount:-0.03 } },
    f3b:{ name:'Royal Payoff', desc:'Everything the lunar path was built toward. Increases range by 6%.', effect:{ type:'stat', classId:'alicorn', stat:'rangeTiles', amount:0.06 } },
    g1:{ name:'Shattered Resolve of the Convergence', desc:'Something has to give, and it gives here. Permanently reduces ranged damage by 4%. Required to press deeper into this overreaching path.', cursed:true, effect:{ type:'stat', classId:'alicorn', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Overreaching Convergence Rite', desc:'The price of Shattered Resolve pays off. Increases bolt speed by 5%.', effect:{ type:'stat', classId:'alicorn', stat:'boltSpeed', amount:0.05 } },
    g3a:{ name:'Royal Corona', desc:'A further step down the same path. Increases bolt speed by 4%.', effect:{ type:'stat', classId:'alicorn', stat:'boltSpeed', amount:0.04 } },
    g2b:{ name:'Whisper of Doubt of the Ascent', desc:'Hesitation creeps in and never quite leaves. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'alicorn', stat:'rangedDamage', amount:-0.03 } },
    g3b:{ name:'Solar Payoff', desc:'Everything the overreaching path was built toward. Increases bolt speed by 6%.', effect:{ type:'stat', classId:'alicorn', stat:'boltSpeed', amount:0.06 } },
    h1:{ name:'Fraying Nerve of the Halo', desc:'The edge dulls just enough to be felt. Permanently reduces movement speed by 4%. Required to press deeper into this royal path.', cursed:true, effect:{ type:'stat', classId:'alicorn', stat:'speed', amount:-0.04 } },
    h2a:{ name:'Royal Halo Rite', desc:'The price of Fraying Nerve pays off. Increases pickup magnet radius by 5%.', effect:{ type:'stat', classId:'alicorn', stat:'magnetRadius', amount:0.05 } },
    h3a:{ name:'Solar Ascent', desc:'A further step down the same path. Increases pickup magnet radius by 4%.', effect:{ type:'stat', classId:'alicorn', stat:'magnetRadius', amount:0.04 } },
    h2b:{ name:'Weight of the Debt of the Convergence', desc:'Power borrowed always comes due. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'alicorn', stat:'speed', amount:-0.03 } },
    h3b:{ name:'Lunar Payoff', desc:'Everything the royal path was built toward. Increases pickup magnet radius by 6%.', effect:{ type:'stat', classId:'alicorn', stat:'magnetRadius', amount:0.06 } },
  }},
  { classId:'changeling', nodes:{
    e1:{ name:'Hollow Reserve of the Green Flame', desc:'Something is drawn out and doesn\'t come back. Permanently reduces ranged damage by 4%. Required to press deeper into this hungry path.', cursed:true, effect:{ type:'stat', classId:'changeling', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Hungry Green Flame Rite', desc:'The price of Hollow Reserve pays off. Increases fire cooldown by 5%.', effect:{ type:'stat', classId:'changeling', stat:'fireCooldown', amount:0.05 } },
    e3a:{ name:'Chitinous Molt', desc:'A further step down the same path. Increases fire cooldown by 4%.', effect:{ type:'stat', classId:'changeling', stat:'fireCooldown', amount:0.04 } },
    e2b:{ name:'Splintered Focus of the Carapace', desc:'Attention split is strength divided. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'changeling', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Hive-Fed Payoff', desc:'Everything the hungry path was built toward. Increases fire cooldown by 6%.', effect:{ type:'stat', classId:'changeling', stat:'fireCooldown', amount:0.06 } },
    f1:{ name:'Blood Price of the Swarm', desc:'A cost paid in strength, not coin. Permanently reduces movement speed by 4%. Required to press deeper into this chitinous path.', cursed:true, effect:{ type:'stat', classId:'changeling', stat:'speed', amount:-0.04 } },
    f2a:{ name:'Chitinous Swarm Rite', desc:'The price of Blood Price pays off. Increases melee cooldown by 5%.', effect:{ type:'stat', classId:'changeling', stat:'meleeCooldown', amount:0.05 } },
    f3a:{ name:'Hive-Fed Carapace', desc:'A further step down the same path. Increases melee cooldown by 4%.', effect:{ type:'stat', classId:'changeling', stat:'meleeCooldown', amount:0.04 } },
    f2b:{ name:'Shattered Resolve of the Green Flame', desc:'Something has to give, and it gives here. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'changeling', stat:'speed', amount:-0.03 } },
    f3b:{ name:'Insatiable Payoff', desc:'Everything the chitinous path was built toward. Increases melee cooldown by 6%.', effect:{ type:'stat', classId:'changeling', stat:'meleeCooldown', amount:0.06 } },
    g1:{ name:'Whisper of Doubt of the Molt', desc:'Hesitation creeps in and never quite leaves. Permanently reduces ranged damage by 4%. Required to press deeper into this hive-fed path.', cursed:true, effect:{ type:'stat', classId:'changeling', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Hive-Fed Molt Rite', desc:'The price of Whisper of Doubt pays off. Increases range by 5%.', effect:{ type:'stat', classId:'changeling', stat:'rangeTiles', amount:0.05 } },
    g3a:{ name:'Insatiable Green Flame', desc:'A further step down the same path. Increases range by 4%.', effect:{ type:'stat', classId:'changeling', stat:'rangeTiles', amount:0.04 } },
    g2b:{ name:'Hungry Carapace', desc:'A second path opened by the same sacrifice. Increases range by 4%.', effect:{ type:'stat', classId:'changeling', stat:'rangeTiles', amount:0.04 } },
    g3b:{ name:'Chitinous Culmination', desc:'The final step on this branch. Increases range by 3%.', effect:{ type:'stat', classId:'changeling', stat:'rangeTiles', amount:0.03 } },
    h1:{ name:'Fraying Nerve of the Carapace', desc:'The edge dulls just enough to be felt. Permanently reduces movement speed by 4%. Required to press deeper into this insatiable path.', cursed:true, effect:{ type:'stat', classId:'changeling', stat:'speed', amount:-0.04 } },
    h2a:{ name:'Insatiable Carapace Rite', desc:'The price of Fraying Nerve pays off. Increases bolt speed by 5%.', effect:{ type:'stat', classId:'changeling', stat:'boltSpeed', amount:0.05 } },
    h3a:{ name:'Hungry Swarm', desc:'A further step down the same path. Increases bolt speed by 4%.', effect:{ type:'stat', classId:'changeling', stat:'boltSpeed', amount:0.04 } },
    h2b:{ name:'Chitinous Green Flame', desc:'A second path opened by the same sacrifice. Increases bolt speed by 4%.', effect:{ type:'stat', classId:'changeling', stat:'boltSpeed', amount:0.04 } },
    h3b:{ name:'Hive-Fed Culmination', desc:'The final step on this branch. Increases bolt speed by 3%.', effect:{ type:'stat', classId:'changeling', stat:'boltSpeed', amount:0.03 } },
  }},
  { classId:'diamonddog', nodes:{
    e1:{ name:'Splintered Focus of the Pickaxe', desc:'Attention split is strength divided. Permanently reduces melee damage by 4%. Required to press deeper into this tunnel-deep path.', cursed:true, effect:{ type:'stat', classId:'diamonddog', stat:'meleeDamage', amount:-0.04 } },
    e2a:{ name:'Tunnel-Deep Pickaxe Rite', desc:'The price of Splintered Focus pays off. Increases charm chance by 5%.', effect:{ type:'stat', classId:'diamonddog', stat:'charmChance', amount:0.05 } },
    e3a:{ name:'Bedrock Excavation', desc:'A further step down the same path. Increases charm chance by 4%.', effect:{ type:'stat', classId:'diamonddog', stat:'charmChance', amount:0.04 } },
    e2b:{ name:'Blood Price of the Hoard', desc:'A cost paid in strength, not coin. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'diamonddog', stat:'meleeDamage', amount:-0.03 } },
    e3b:{ name:'Vein-Torn Payoff', desc:'Everything the tunnel-deep path was built toward. Increases charm chance by 6%.', effect:{ type:'stat', classId:'diamonddog', stat:'charmChance', amount:0.06 } },
    f1:{ name:'Shattered Resolve of the Gem Vein', desc:'Something has to give, and it gives here. Permanently reduces pickup magnet radius by 4%. Required to press deeper into this bedrock path.', cursed:true, effect:{ type:'stat', classId:'diamonddog', stat:'magnetRadius', amount:-0.04 } },
    f2a:{ name:'Bedrock Gem Vein Rite', desc:'The price of Shattered Resolve pays off. Increases freeze chance by 5%.', effect:{ type:'stat', classId:'diamonddog', stat:'freezeChance', amount:0.05 } },
    f3a:{ name:'Vein-Torn Hoard', desc:'A further step down the same path. Increases freeze chance by 4%.', effect:{ type:'stat', classId:'diamonddog', stat:'freezeChance', amount:0.04 } },
    f2b:{ name:'Whisper of Doubt of the Pickaxe', desc:'Hesitation creeps in and never quite leaves. Permanently reduces pickup magnet radius by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'diamonddog', stat:'magnetRadius', amount:-0.03 } },
    f3b:{ name:'Cave-In Payoff', desc:'Everything the bedrock path was built toward. Increases freeze chance by 6%.', effect:{ type:'stat', classId:'diamonddog', stat:'freezeChance', amount:0.06 } },
    g1:{ name:'Fraying Nerve of the Excavation', desc:'The edge dulls just enough to be felt. Permanently reduces melee damage by 4%. Required to press deeper into this vein-torn path.', cursed:true, effect:{ type:'stat', classId:'diamonddog', stat:'meleeDamage', amount:-0.04 } },
    g2a:{ name:'Vein-Torn Excavation Rite', desc:'The price of Fraying Nerve pays off. Increases fear chance by 5%.', effect:{ type:'stat', classId:'diamonddog', stat:'fearChance', amount:0.05 } },
    g3a:{ name:'Cave-In Pickaxe', desc:'A further step down the same path. Increases fear chance by 4%.', effect:{ type:'stat', classId:'diamonddog', stat:'fearChance', amount:0.04 } },
    g2b:{ name:'Weight of the Debt of the Gem Vein', desc:'Power borrowed always comes due. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'diamonddog', stat:'meleeDamage', amount:-0.03 } },
    g3b:{ name:'Tunnel-Deep Payoff', desc:'Everything the vein-torn path was built toward. Increases fear chance by 6%.', effect:{ type:'stat', classId:'diamonddog', stat:'fearChance', amount:0.06 } },
    h1:{ name:'Cracked Foundation of the Hoard', desc:'What was solid now has a fault line through it. Permanently reduces pickup magnet radius by 4%. Required to press deeper into this cave-in path.', cursed:true, effect:{ type:'stat', classId:'diamonddog', stat:'magnetRadius', amount:-0.04 } },
    h2a:{ name:'Cave-In Hoard Rite', desc:'The price of Cracked Foundation pays off. Increases vulnerable chance by 5%.', effect:{ type:'stat', classId:'diamonddog', stat:'vulnerableChance', amount:0.05 } },
    h3a:{ name:'Tunnel-Deep Gem Vein', desc:'A further step down the same path. Increases vulnerable chance by 4%.', effect:{ type:'stat', classId:'diamonddog', stat:'vulnerableChance', amount:0.04 } },
    h2b:{ name:'Bedrock Pickaxe', desc:'A second path opened by the same sacrifice. Increases vulnerable chance by 4%.', effect:{ type:'stat', classId:'diamonddog', stat:'vulnerableChance', amount:0.04 } },
    h3b:{ name:'Vein-Torn Culmination', desc:'The final step on this branch. Increases vulnerable chance by 3%.', effect:{ type:'stat', classId:'diamonddog', stat:'vulnerableChance', amount:0.03 } },
  }},
  { classId:'gargoyle', nodes:{
    e1:{ name:'Blood Price of the Watch', desc:'A cost paid in strength, not coin. Permanently reduces ranged damage by 4%. Required to press deeper into this weathered path.', cursed:true, effect:{ type:'stat', classId:'gargoyle', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Weathered Watch Rite', desc:'The price of Blood Price pays off. Increases movement speed by 5%.', effect:{ type:'stat', classId:'gargoyle', stat:'speed', amount:0.05 } },
    e3a:{ name:'Stone-Cold Perch', desc:'A further step down the same path. Increases movement speed by 4%.', effect:{ type:'stat', classId:'gargoyle', stat:'speed', amount:0.04 } },
    e2b:{ name:'Shattered Resolve of the Judgment', desc:'Something has to give, and it gives here. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'gargoyle', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Sentinel Payoff', desc:'Everything the weathered path was built toward. Increases movement speed by 6%.', effect:{ type:'stat', classId:'gargoyle', stat:'speed', amount:0.06 } },
    f1:{ name:'Whisper of Doubt of the Verdict', desc:'Hesitation creeps in and never quite leaves. Permanently reduces critical hit chance by 4%. Required to press deeper into this stone-cold path.', cursed:true, effect:{ type:'stat', classId:'gargoyle', stat:'critChance', amount:-0.04 } },
    f2a:{ name:'Stone-Cold Verdict Rite', desc:'The price of Whisper of Doubt pays off. Increases melee damage by 5%.', effect:{ type:'stat', classId:'gargoyle', stat:'meleeDamage', amount:0.05 } },
    f3a:{ name:'Sentinel Judgment', desc:'A further step down the same path. Increases melee damage by 4%.', effect:{ type:'stat', classId:'gargoyle', stat:'meleeDamage', amount:0.04 } },
    f2b:{ name:'Fraying Nerve of the Watch', desc:'The edge dulls just enough to be felt. Permanently reduces critical hit chance by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'gargoyle', stat:'critChance', amount:-0.03 } },
    f3b:{ name:'Grit-Hard Payoff', desc:'Everything the stone-cold path was built toward. Increases melee damage by 6%.', effect:{ type:'stat', classId:'gargoyle', stat:'meleeDamage', amount:0.06 } },
    g1:{ name:'Weight of the Debt of the Perch', desc:'Power borrowed always comes due. Permanently reduces ranged damage by 4%. Required to press deeper into this sentinel path.', cursed:true, effect:{ type:'stat', classId:'gargoyle', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Sentinel Perch Rite', desc:'The price of Weight of the Debt pays off. Increases luck by 5%.', effect:{ type:'stat', classId:'gargoyle', stat:'luck', amount:0.05 } },
    g3a:{ name:'Grit-Hard Watch', desc:'A further step down the same path. Increases luck by 4%.', effect:{ type:'stat', classId:'gargoyle', stat:'luck', amount:0.04 } },
    g2b:{ name:'Cracked Foundation of the Verdict', desc:'What was solid now has a fault line through it. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'gargoyle', stat:'rangedDamage', amount:-0.03 } },
    g3b:{ name:'Weathered Payoff', desc:'Everything the sentinel path was built toward. Increases luck by 6%.', effect:{ type:'stat', classId:'gargoyle', stat:'luck', amount:0.06 } },
    h1:{ name:'Faded Conviction of the Judgment', desc:'The old certainty isn\'t quite there anymore. Permanently reduces critical hit chance by 4%. Required to press deeper into this grit-hard path.', cursed:true, effect:{ type:'stat', classId:'gargoyle', stat:'critChance', amount:-0.04 } },
    h2a:{ name:'Grit-Hard Judgment Rite', desc:'The price of Faded Conviction pays off. Increases melee cooldown by 5%.', effect:{ type:'stat', classId:'gargoyle', stat:'meleeCooldown', amount:0.05 } },
    h3a:{ name:'Weathered Verdict', desc:'A further step down the same path. Increases melee cooldown by 4%.', effect:{ type:'stat', classId:'gargoyle', stat:'meleeCooldown', amount:0.04 } },
    h2b:{ name:'Bitter Bargain of the Perch', desc:'Every bargain like this one costs more than it looks. Permanently reduces critical hit chance by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'gargoyle', stat:'critChance', amount:-0.03 } },
    h3b:{ name:'Stone-Cold Payoff', desc:'Everything the grit-hard path was built toward. Increases melee cooldown by 6%.', effect:{ type:'stat', classId:'gargoyle', stat:'meleeCooldown', amount:0.06 } },
  }},
  { classId:'changedling', nodes:{
    e1:{ name:'Shattered Resolve of the Ember Trail', desc:'Something has to give, and it gives here. Permanently reduces movement speed by 4%. Required to press deeper into this unstable path.', cursed:true, effect:{ type:'stat', classId:'changedling', stat:'speed', amount:-0.04 } },
    e2a:{ name:'Unstable Ember Trail Rite', desc:'The price of Shattered Resolve pays off. Increases dodge chance by 5%.', effect:{ type:'stat', classId:'changedling', stat:'dodgeChance', amount:0.05 } },
    e3a:{ name:'Half-Formed Ring of Fire', desc:'A further step down the same path. Increases dodge chance by 4%.', effect:{ type:'stat', classId:'changedling', stat:'dodgeChance', amount:0.04 } },
    e2b:{ name:'Whisper of Doubt of the Molt', desc:'Hesitation creeps in and never quite leaves. Permanently reduces movement speed by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'changedling', stat:'speed', amount:-0.03 } },
    e3b:{ name:'Flickering Payoff', desc:'Everything the unstable path was built toward. Increases dodge chance by 6%.', effect:{ type:'stat', classId:'changedling', stat:'dodgeChance', amount:0.06 } },
    f1:{ name:'Fraying Nerve of the Unfinished Flight', desc:'The edge dulls just enough to be felt. Permanently reduces ranged damage by 4%. Required to press deeper into this half-formed path.', cursed:true, effect:{ type:'stat', classId:'changedling', stat:'rangedDamage', amount:-0.04 } },
    f2a:{ name:'Half-Formed Unfinished Flight Rite', desc:'The price of Fraying Nerve pays off. Increases melee damage by 5%.', effect:{ type:'stat', classId:'changedling', stat:'meleeDamage', amount:0.05 } },
    f3a:{ name:'Flickering Molt', desc:'A further step down the same path. Increases melee damage by 4%.', effect:{ type:'stat', classId:'changedling', stat:'meleeDamage', amount:0.04 } },
    f2b:{ name:'Weight of the Debt of the Ember Trail', desc:'Power borrowed always comes due. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'changedling', stat:'rangedDamage', amount:-0.03 } },
    f3b:{ name:'Smoldering Payoff', desc:'Everything the half-formed path was built toward. Increases melee damage by 6%.', effect:{ type:'stat', classId:'changedling', stat:'meleeDamage', amount:0.06 } },
    g1:{ name:'Cracked Foundation of the Ring of Fire', desc:'What was solid now has a fault line through it. Permanently reduces movement speed by 4%. Required to press deeper into this flickering path.', cursed:true, effect:{ type:'stat', classId:'changedling', stat:'speed', amount:-0.04 } },
    g2a:{ name:'Flickering Ring of Fire Rite', desc:'The price of Cracked Foundation pays off. Increases critical hit chance by 5%.', effect:{ type:'stat', classId:'changedling', stat:'critChance', amount:0.05 } },
    g3a:{ name:'Smoldering Ember Trail', desc:'A further step down the same path. Increases critical hit chance by 4%.', effect:{ type:'stat', classId:'changedling', stat:'critChance', amount:0.04 } },
    g2b:{ name:'Unstable Molt', desc:'A second path opened by the same sacrifice. Increases critical hit chance by 4%.', effect:{ type:'stat', classId:'changedling', stat:'critChance', amount:0.04 } },
    g3b:{ name:'Half-Formed Culmination', desc:'The final step on this branch. Increases critical hit chance by 3%.', effect:{ type:'stat', classId:'changedling', stat:'critChance', amount:0.03 } },
    h1:{ name:'Faded Conviction of the Molt', desc:'The old certainty isn\'t quite there anymore. Permanently reduces ranged damage by 4%. Required to press deeper into this smoldering path.', cursed:true, effect:{ type:'stat', classId:'changedling', stat:'rangedDamage', amount:-0.04 } },
    h2a:{ name:'Smoldering Molt Rite', desc:'The price of Faded Conviction pays off. Increases luck by 5%.', effect:{ type:'stat', classId:'changedling', stat:'luck', amount:0.05 } },
    h3a:{ name:'Unstable Unfinished Flight', desc:'A further step down the same path. Increases luck by 4%.', effect:{ type:'stat', classId:'changedling', stat:'luck', amount:0.04 } },
    h2b:{ name:'Half-Formed Ember Trail', desc:'A second path opened by the same sacrifice. Increases luck by 4%.', effect:{ type:'stat', classId:'changedling', stat:'luck', amount:0.04 } },
    h3b:{ name:'Flickering Culmination', desc:'The final step on this branch. Increases luck by 3%.', effect:{ type:'stat', classId:'changedling', stat:'luck', amount:0.03 } },
  }},
  { classId:'changelingqueen', nodes:{
    e1:{ name:'Whisper of Doubt of the Brood Call', desc:'Hesitation creeps in and never quite leaves. Permanently reduces ranged damage by 4%. Required to press deeper into this matriarchal path.', cursed:true, effect:{ type:'stat', classId:'changelingqueen', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Matriarchal Brood Call Rite', desc:'The price of Whisper of Doubt pays off. Increases on-kill heal chance by 5%.', effect:{ type:'stat', classId:'changelingqueen', stat:'onKillHealChance', amount:0.05 } },
    e3a:{ name:'Brood-Deep Nest', desc:'A further step down the same path. Increases on-kill heal chance by 4%.', effect:{ type:'stat', classId:'changelingqueen', stat:'onKillHealChance', amount:0.04 } },
    e2b:{ name:'Fraying Nerve of the Swarm\'s Pull', desc:'The edge dulls just enough to be felt. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'changelingqueen', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Undying Payoff', desc:'Everything the matriarchal path was built toward. Increases on-kill heal chance by 6%.', effect:{ type:'stat', classId:'changelingqueen', stat:'onKillHealChance', amount:0.06 } },
    f1:{ name:'Weight of the Debt of the Coalburn', desc:'Power borrowed always comes due. Permanently reduces pickup magnet radius by 4%. Required to press deeper into this brood-deep path.', cursed:true, effect:{ type:'stat', classId:'changelingqueen', stat:'magnetRadius', amount:-0.04 } },
    f2a:{ name:'Brood-Deep Coalburn Rite', desc:'The price of Weight of the Debt pays off. Increases dodge chance by 5%.', effect:{ type:'stat', classId:'changelingqueen', stat:'dodgeChance', amount:0.05 } },
    f3a:{ name:'Undying Swarm\'s Pull', desc:'A further step down the same path. Increases dodge chance by 4%.', effect:{ type:'stat', classId:'changelingqueen', stat:'dodgeChance', amount:0.04 } },
    f2b:{ name:'Cracked Foundation of the Brood Call', desc:'What was solid now has a fault line through it. Permanently reduces pickup magnet radius by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'changelingqueen', stat:'magnetRadius', amount:-0.03 } },
    f3b:{ name:'Hive-Bound Payoff', desc:'Everything the brood-deep path was built toward. Increases dodge chance by 6%.', effect:{ type:'stat', classId:'changelingqueen', stat:'dodgeChance', amount:0.06 } },
    g1:{ name:'Faded Conviction of the Nest', desc:'The old certainty isn\'t quite there anymore. Permanently reduces ranged damage by 4%. Required to press deeper into this undying path.', cursed:true, effect:{ type:'stat', classId:'changelingqueen', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Undying Nest Rite', desc:'The price of Faded Conviction pays off. Increases movement speed by 5%.', effect:{ type:'stat', classId:'changelingqueen', stat:'speed', amount:0.05 } },
    g3a:{ name:'Hive-Bound Brood Call', desc:'A further step down the same path. Increases movement speed by 4%.', effect:{ type:'stat', classId:'changelingqueen', stat:'speed', amount:0.04 } },
    g2b:{ name:'Bitter Bargain of the Coalburn', desc:'Every bargain like this one costs more than it looks. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'changelingqueen', stat:'rangedDamage', amount:-0.03 } },
    g3b:{ name:'Matriarchal Payoff', desc:'Everything the undying path was built toward. Increases movement speed by 6%.', effect:{ type:'stat', classId:'changelingqueen', stat:'speed', amount:0.06 } },
    h1:{ name:'Hollow Reserve of the Swarm\'s Pull', desc:'Something is drawn out and doesn\'t come back. Permanently reduces pickup magnet radius by 4%. Required to press deeper into this hive-bound path.', cursed:true, effect:{ type:'stat', classId:'changelingqueen', stat:'magnetRadius', amount:-0.04 } },
    h2a:{ name:'Hive-Bound Swarm\'s Pull Rite', desc:'The price of Hollow Reserve pays off. Increases melee damage by 5%.', effect:{ type:'stat', classId:'changelingqueen', stat:'meleeDamage', amount:0.05 } },
    h3a:{ name:'Matriarchal Coalburn', desc:'A further step down the same path. Increases melee damage by 4%.', effect:{ type:'stat', classId:'changelingqueen', stat:'meleeDamage', amount:0.04 } },
    h2b:{ name:'Brood-Deep Brood Call', desc:'A second path opened by the same sacrifice. Increases melee damage by 4%.', effect:{ type:'stat', classId:'changelingqueen', stat:'meleeDamage', amount:0.04 } },
    h3b:{ name:'Undying Culmination', desc:'The final step on this branch. Increases melee damage by 3%.', effect:{ type:'stat', classId:'changelingqueen', stat:'meleeDamage', amount:0.03 } },
  }},
  { classId:'filly', nodes:{
    e1:{ name:'Fraying Nerve of the Growing Spirit', desc:'The edge dulls just enough to be felt. Permanently reduces melee damage by 4%. Required to press deeper into this plucky path.', cursed:true, effect:{ type:'stat', classId:'filly', stat:'meleeDamage', amount:-0.04 } },
    e2a:{ name:'Plucky Growing Spirit Rite', desc:'The price of Fraying Nerve pays off. Increases freeze chance by 5%.', effect:{ type:'stat', classId:'filly', stat:'freezeChance', amount:0.05 } },
    e3a:{ name:'Stubborn Determination', desc:'A further step down the same path. Increases freeze chance by 4%.', effect:{ type:'stat', classId:'filly', stat:'freezeChance', amount:0.04 } },
    e2b:{ name:'Weight of the Debt of the Wishing Star', desc:'Power borrowed always comes due. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'filly', stat:'meleeDamage', amount:-0.03 } },
    e3b:{ name:'Wide-Eyed Payoff', desc:'Everything the plucky path was built toward. Increases freeze chance by 6%.', effect:{ type:'stat', classId:'filly', stat:'freezeChance', amount:0.06 } },
    f1:{ name:'Cracked Foundation of the Charmed Trinket', desc:'What was solid now has a fault line through it. Permanently reduces luck by 4%. Required to press deeper into this stubborn path.', cursed:true, effect:{ type:'stat', classId:'filly', stat:'luck', amount:-0.04 } },
    f2a:{ name:'Stubborn Charmed Trinket Rite', desc:'The price of Cracked Foundation pays off. Increases fear chance by 5%.', effect:{ type:'stat', classId:'filly', stat:'fearChance', amount:0.05 } },
    f3a:{ name:'Wide-Eyed Wishing Star', desc:'A further step down the same path. Increases fear chance by 4%.', effect:{ type:'stat', classId:'filly', stat:'fearChance', amount:0.04 } },
    f2b:{ name:'Faded Conviction of the Growing Spirit', desc:'The old certainty isn\'t quite there anymore. Permanently reduces luck by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'filly', stat:'luck', amount:-0.03 } },
    f3b:{ name:'Overeager Payoff', desc:'Everything the stubborn path was built toward. Increases fear chance by 6%.', effect:{ type:'stat', classId:'filly', stat:'fearChance', amount:0.06 } },
    g1:{ name:'Bitter Bargain of the Determination', desc:'Every bargain like this one costs more than it looks. Permanently reduces melee damage by 4%. Required to press deeper into this wide-eyed path.', cursed:true, effect:{ type:'stat', classId:'filly', stat:'meleeDamage', amount:-0.04 } },
    g2a:{ name:'Wide-Eyed Determination Rite', desc:'The price of Bitter Bargain pays off. Increases vulnerable chance by 5%.', effect:{ type:'stat', classId:'filly', stat:'vulnerableChance', amount:0.05 } },
    g3a:{ name:'Overeager Growing Spirit', desc:'A further step down the same path. Increases vulnerable chance by 4%.', effect:{ type:'stat', classId:'filly', stat:'vulnerableChance', amount:0.04 } },
    g2b:{ name:'Hollow Reserve of the Charmed Trinket', desc:'Something is drawn out and doesn\'t come back. Permanently reduces melee damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'filly', stat:'meleeDamage', amount:-0.03 } },
    g3b:{ name:'Plucky Payoff', desc:'Everything the wide-eyed path was built toward. Increases vulnerable chance by 6%.', effect:{ type:'stat', classId:'filly', stat:'vulnerableChance', amount:0.06 } },
    h1:{ name:'Splintered Focus of the Wishing Star', desc:'Attention split is strength divided. Permanently reduces luck by 4%. Required to press deeper into this overeager path.', cursed:true, effect:{ type:'stat', classId:'filly', stat:'luck', amount:-0.04 } },
    h2a:{ name:'Overeager Wishing Star Rite', desc:'The price of Splintered Focus pays off. Reduces shop prices by 5%.', effect:{ type:'stat', classId:'filly', stat:'shopDiscountBonus', amount:0.05 } }, // dead-node fix: h3a+h3b already summed to the 0.10 lifestealChance cap
    h3a:{ name:'Plucky Charmed Trinket', desc:'A further step down the same path. Increases lifesteal chance by 4%.', effect:{ type:'stat', classId:'filly', stat:'lifestealChance', amount:0.04 } },
    h2b:{ name:'Blood Price of the Determination', desc:'A cost paid in strength, not coin. Permanently reduces luck by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'filly', stat:'luck', amount:-0.03 } },
    h3b:{ name:'Stubborn Payoff', desc:'Everything the overeager path was built toward. Increases lifesteal chance by 6%.', effect:{ type:'stat', classId:'filly', stat:'lifestealChance', amount:0.06 } },
  }},
  { classId:'engineerpony', nodes:{
    e1:{ name:'Weight of the Debt of the Capacitor Bank', desc:'Power borrowed always comes due. Permanently reduces ranged damage by 4%. Required to press deeper into this overtuned path.', cursed:true, effect:{ type:'stat', classId:'engineerpony', stat:'rangedDamage', amount:-0.04 } },
    e2a:{ name:'Overtuned Capacitor Bank Rite', desc:'The price of Weight of the Debt pays off. Increases stun chance by 5%.', effect:{ type:'stat', classId:'engineerpony', stat:'stunChance', amount:0.05 } },
    e3a:{ name:'Jury-Rigged Blueprint', desc:'A further step down the same path. Increases stun chance by 4%.', effect:{ type:'stat', classId:'engineerpony', stat:'stunChance', amount:0.04 } },
    e2b:{ name:'Cracked Foundation of the Salvage', desc:'What was solid now has a fault line through it. Permanently reduces ranged damage by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'engineerpony', stat:'rangedDamage', amount:-0.03 } },
    e3b:{ name:'Scrap-Welded Payoff', desc:'Everything the overtuned path was built toward. Increases stun chance by 6%.', effect:{ type:'stat', classId:'engineerpony', stat:'stunChance', amount:0.06 } },
    f1:{ name:'Faded Conviction of the Turret Frame', desc:'The old certainty isn\'t quite there anymore. Permanently reduces pickup magnet radius by 4%. Required to press deeper into this jury-rigged path.', cursed:true, effect:{ type:'stat', classId:'engineerpony', stat:'magnetRadius', amount:-0.04 } },
    f2a:{ name:'Jury-Rigged Turret Frame Rite', desc:'The price of Faded Conviction pays off. Increases charm chance by 5%.', effect:{ type:'stat', classId:'engineerpony', stat:'charmChance', amount:0.05 } },
    f3a:{ name:'Scrap-Welded Salvage', desc:'A further step down the same path. Increases charm chance by 4%.', effect:{ type:'stat', classId:'engineerpony', stat:'charmChance', amount:0.04 } },
    f2b:{ name:'Bitter Bargain of the Capacitor Bank', desc:'Every bargain like this one costs more than it looks. Permanently reduces pickup magnet radius by 3%. The deepest reward on this branch demands it.', cursed:true, effect:{ type:'stat', classId:'engineerpony', stat:'magnetRadius', amount:-0.03 } },
    f3b:{ name:'Redlined Payoff', desc:'Everything the jury-rigged path was built toward. Increases charm chance by 6%.', effect:{ type:'stat', classId:'engineerpony', stat:'charmChance', amount:0.06 } },
    g1:{ name:'Hollow Reserve of the Blueprint', desc:'Something is drawn out and doesn\'t come back. Permanently reduces ranged damage by 4%. Required to press deeper into this scrap-welded path.', cursed:true, effect:{ type:'stat', classId:'engineerpony', stat:'rangedDamage', amount:-0.04 } },
    g2a:{ name:'Scrap-Welded Blueprint Rite', desc:'The price of Hollow Reserve pays off. Increases freeze chance by 5%.', effect:{ type:'stat', classId:'engineerpony', stat:'freezeChance', amount:0.05 } },
    g3a:{ name:'Redlined Capacitor Bank', desc:'A further step down the same path. Increases freeze chance by 4%.', effect:{ type:'stat', classId:'engineerpony', stat:'freezeChance', amount:0.04 } },
    g2b:{ name:'Overtuned Salvage', desc:'A second path opened by the same sacrifice. Increases freeze chance by 4%.', effect:{ type:'stat', classId:'engineerpony', stat:'freezeChance', amount:0.04 } },
    g3b:{ name:'Jury-Rigged Culmination', desc:'The final step on this branch. Increases freeze chance by 3%.', effect:{ type:'stat', classId:'engineerpony', stat:'freezeChance', amount:0.03 } },
    h1:{ name:'Splintered Focus of the Salvage', desc:'Attention split is strength divided. Permanently reduces pickup magnet radius by 4%. Required to press deeper into this redlined path.', cursed:true, effect:{ type:'stat', classId:'engineerpony', stat:'magnetRadius', amount:-0.04 } },
    h2a:{ name:'Redlined Salvage Rite', desc:'The price of Splintered Focus pays off. Increases fear chance by 5%.', effect:{ type:'stat', classId:'engineerpony', stat:'fearChance', amount:0.05 } },
    h3a:{ name:'Overtuned Turret Frame', desc:'A further step down the same path. Increases fear chance by 4%.', effect:{ type:'stat', classId:'engineerpony', stat:'fearChance', amount:0.04 } },
    h2b:{ name:'Jury-Rigged Capacitor Bank', desc:'A second path opened by the same sacrifice. Increases fear chance by 4%.', effect:{ type:'stat', classId:'engineerpony', stat:'fearChance', amount:0.04 } },
    h3b:{ name:'Scrap-Welded Culmination', desc:'The final step on this branch. Increases fear chance by 3%.', effect:{ type:'stat', classId:'engineerpony', stat:'fearChance', amount:0.03 } },
  }},
];

// Per-character topology: FULL parent node id for each of the 20 new keys.
// e1/f1/g1/h1 each attach directly onto one of that character's EXISTING
// (old 20-node) leaf nodes — never onto each other, never a re-parented
// existing node. e2a/e2b attach onto e1 (mandatory gate through the curse);
// e3a attaches onto e2a; e3b attaches onto e2b (mandatory gate through the
// SECOND curse where e2b is itself cursed). Same shape for f/g/h.
const SKILL_TREE_CHAR_TOPOLOGY_3 = {
  earth: { e1:'char_earth_a3a', e2a:'char_earth_e1', e3a:'char_earth_e2a', e2b:'char_earth_e1', e3b:'char_earth_e2b', f1:'char_earth_a3b', f2a:'char_earth_f1', f3a:'char_earth_f2a', f2b:'char_earth_f1', f3b:'char_earth_f2b', g1:'char_earth_b3b', g2a:'char_earth_g1', g3a:'char_earth_g2a', g2b:'char_earth_g1', g3b:'char_earth_g2b', h1:'char_earth_c3a', h2a:'char_earth_h1', h3a:'char_earth_h2a', h2b:'char_earth_h1', h3b:'char_earth_h2b' },
  pegasus: { e1:'char_pegasus_a3a', e2a:'char_pegasus_e1', e3a:'char_pegasus_e2a', e2b:'char_pegasus_e1', e3b:'char_pegasus_e2b', f1:'char_pegasus_b3a', f2a:'char_pegasus_f1', f3a:'char_pegasus_f2a', f2b:'char_pegasus_f1', f3b:'char_pegasus_f2b', g1:'char_pegasus_b3b', g2a:'char_pegasus_g1', g3a:'char_pegasus_g2a', g2b:'char_pegasus_g1', g3b:'char_pegasus_g2b', h1:'char_pegasus_c3b', h2a:'char_pegasus_h1', h3a:'char_pegasus_h2a', h2b:'char_pegasus_h1', h3b:'char_pegasus_h2b' },
  unicorn: { e1:'char_unicorn_a3a', e2a:'char_unicorn_e1', e3a:'char_unicorn_e2a', e2b:'char_unicorn_e1', e3b:'char_unicorn_e2b', f1:'char_unicorn_a3b', f2a:'char_unicorn_f1', f3a:'char_unicorn_f2a', f2b:'char_unicorn_f1', f3b:'char_unicorn_f2b', g1:'char_unicorn_b3a', g2a:'char_unicorn_g1', g3a:'char_unicorn_g2a', g2b:'char_unicorn_g1', g3b:'char_unicorn_g2b', h1:'char_unicorn_b3b', h2a:'char_unicorn_h1', h3a:'char_unicorn_h2a', h2b:'char_unicorn_h1', h3b:'char_unicorn_h2b' },
  batpony: { e1:'char_batpony_a3b', e2a:'char_batpony_e1', e3a:'char_batpony_e2a', e2b:'char_batpony_e1', e3b:'char_batpony_e2b', f1:'char_batpony_b3a', f2a:'char_batpony_f1', f3a:'char_batpony_f2a', f2b:'char_batpony_f1', f3b:'char_batpony_f2b', g1:'char_batpony_c3a', g2a:'char_batpony_g1', g3a:'char_batpony_g2a', g2b:'char_batpony_g1', g3b:'char_batpony_g2b', h1:'char_batpony_c3b', h2a:'char_batpony_h1', h3a:'char_batpony_h2a', h2b:'char_batpony_h1', h3b:'char_batpony_h2b' },
  zebra: { e1:'char_zebra_a3a', e2a:'char_zebra_e1', e3a:'char_zebra_e2a', e2b:'char_zebra_e1', e3b:'char_zebra_e2b', f1:'char_zebra_a3b', f2a:'char_zebra_f1', f3a:'char_zebra_f2a', f2b:'char_zebra_f1', f3b:'char_zebra_f2b', g1:'char_zebra_b3b', g2a:'char_zebra_g1', g3a:'char_zebra_g2a', g2b:'char_zebra_g1', g3b:'char_zebra_g2b', h1:'char_zebra_c3a', h2a:'char_zebra_h1', h3a:'char_zebra_h2a', h2b:'char_zebra_h1', h3b:'char_zebra_h2b' },
  hypogriff: { e1:'char_hypogriff_a3a', e2a:'char_hypogriff_e1', e3a:'char_hypogriff_e2a', e2b:'char_hypogriff_e1', e3b:'char_hypogriff_e2b', f1:'char_hypogriff_a3b', f2a:'char_hypogriff_f1', f3a:'char_hypogriff_f2a', f2b:'char_hypogriff_f1', f3b:'char_hypogriff_f2b', g1:'char_hypogriff_b3a', g2a:'char_hypogriff_g1', g3a:'char_hypogriff_g2a', g2b:'char_hypogriff_g1', g3b:'char_hypogriff_g2b', h1:'char_hypogriff_b3b', h2a:'char_hypogriff_h1', h3a:'char_hypogriff_h2a', h2b:'char_hypogriff_h1', h3b:'char_hypogriff_h2b' },
  seapony: { e1:'char_seapony_a3a', e2a:'char_seapony_e1', e3a:'char_seapony_e2a', e2b:'char_seapony_e1', e3b:'char_seapony_e2b', f1:'char_seapony_a3b', f2a:'char_seapony_f1', f3a:'char_seapony_f2a', f2b:'char_seapony_f1', f3b:'char_seapony_f2b', g1:'char_seapony_b3a', g2a:'char_seapony_g1', g3a:'char_seapony_g2a', g2b:'char_seapony_g1', g3b:'char_seapony_g2b', h1:'char_seapony_b3b', h2a:'char_seapony_h1', h3a:'char_seapony_h2a', h2b:'char_seapony_h1', h3b:'char_seapony_h2b' },
  ponybot: { e1:'char_ponybot_a3b', e2a:'char_ponybot_e1', e3a:'char_ponybot_e2a', e2b:'char_ponybot_e1', e3b:'char_ponybot_e2b', f1:'char_ponybot_b3a', f2a:'char_ponybot_f1', f3a:'char_ponybot_f2a', f2b:'char_ponybot_f1', f3b:'char_ponybot_f2b', g1:'char_ponybot_b3b', g2a:'char_ponybot_g1', g3a:'char_ponybot_g2a', g2b:'char_ponybot_g1', g3b:'char_ponybot_g2b', h1:'char_ponybot_c3b', h2a:'char_ponybot_h1', h3a:'char_ponybot_h2a', h2b:'char_ponybot_h1', h3b:'char_ponybot_h2b' },
  griffin: { e1:'char_griffin_a3a', e2a:'char_griffin_e1', e3a:'char_griffin_e2a', e2b:'char_griffin_e1', e3b:'char_griffin_e2b', f1:'char_griffin_a3b', f2a:'char_griffin_f1', f3a:'char_griffin_f2a', f2b:'char_griffin_f1', f3b:'char_griffin_f2b', g1:'char_griffin_b3a', g2a:'char_griffin_g1', g3a:'char_griffin_g2a', g2b:'char_griffin_g1', g3b:'char_griffin_g2b', h1:'char_griffin_c3b', h2a:'char_griffin_h1', h3a:'char_griffin_h2a', h2b:'char_griffin_h1', h3b:'char_griffin_h2b' },
  kirin: { e1:'char_kirin_a3a', e2a:'char_kirin_e1', e3a:'char_kirin_e2a', e2b:'char_kirin_e1', e3b:'char_kirin_e2b', f1:'char_kirin_a3b', f2a:'char_kirin_f1', f3a:'char_kirin_f2a', f2b:'char_kirin_f1', f3b:'char_kirin_f2b', g1:'char_kirin_b3a', g2a:'char_kirin_g1', g3a:'char_kirin_g2a', g2b:'char_kirin_g1', g3b:'char_kirin_g2b', h1:'char_kirin_b3b', h2a:'char_kirin_h1', h3a:'char_kirin_h2a', h2b:'char_kirin_h1', h3b:'char_kirin_h2b' },
  dragon: { e1:'char_dragon_a3a', e2a:'char_dragon_e1', e3a:'char_dragon_e2a', e2b:'char_dragon_e1', e3b:'char_dragon_e2b', f1:'char_dragon_b3b', f2a:'char_dragon_f1', f3a:'char_dragon_f2a', f2b:'char_dragon_f1', f3b:'char_dragon_f2b', g1:'char_dragon_c3a', g2a:'char_dragon_g1', g3a:'char_dragon_g2a', g2b:'char_dragon_g1', g3b:'char_dragon_g2b', h1:'char_dragon_c3b', h2a:'char_dragon_h1', h3a:'char_dragon_h2a', h2b:'char_dragon_h1', h3b:'char_dragon_h2b' },
  windigo: { e1:'char_windigo_a3b', e2a:'char_windigo_e1', e3a:'char_windigo_e2a', e2b:'char_windigo_e1', e3b:'char_windigo_e2b', f1:'char_windigo_b3a', f2a:'char_windigo_f1', f3a:'char_windigo_f2a', f2b:'char_windigo_f1', f3b:'char_windigo_f2b', g1:'char_windigo_b3b', g2a:'char_windigo_g1', g3a:'char_windigo_g2a', g2b:'char_windigo_g1', g3b:'char_windigo_g2b', h1:'char_windigo_c3a', h2a:'char_windigo_h1', h3a:'char_windigo_h2a', h2b:'char_windigo_h1', h3b:'char_windigo_h2b' },
  kelpie: { e1:'char_kelpie_a3a', e2a:'char_kelpie_e1', e3a:'char_kelpie_e2a', e2b:'char_kelpie_e1', e3b:'char_kelpie_e2b', f1:'char_kelpie_a3b', f2a:'char_kelpie_f1', f3a:'char_kelpie_f2a', f2b:'char_kelpie_f1', f3b:'char_kelpie_f2b', g1:'char_kelpie_b3b', g2a:'char_kelpie_g1', g3a:'char_kelpie_g2a', g2b:'char_kelpie_g1', g3b:'char_kelpie_g2b', h1:'char_kelpie_c3a', h2a:'char_kelpie_h1', h3a:'char_kelpie_h2a', h2b:'char_kelpie_h1', h3b:'char_kelpie_h2b' },
  breezie: { e1:'char_breezie_a3a', e2a:'char_breezie_e1', e3a:'char_breezie_e2a', e2b:'char_breezie_e1', e3b:'char_breezie_e2b', f1:'char_breezie_a3b', f2a:'char_breezie_f1', f3a:'char_breezie_f2a', f2b:'char_breezie_f1', f3b:'char_breezie_f2b', g1:'char_breezie_b3b', g2a:'char_breezie_g1', g3a:'char_breezie_g2a', g2b:'char_breezie_g1', g3b:'char_breezie_g2b', h1:'char_breezie_c3a', h2a:'char_breezie_h1', h3a:'char_breezie_h2a', h2b:'char_breezie_h1', h3b:'char_breezie_h2b' },
  dnbpony: { e1:'char_dnbpony_a3a', e2a:'char_dnbpony_e1', e3a:'char_dnbpony_e2a', e2b:'char_dnbpony_e1', e3b:'char_dnbpony_e2b', f1:'char_dnbpony_a3b', f2a:'char_dnbpony_f1', f3a:'char_dnbpony_f2a', f2b:'char_dnbpony_f1', f3b:'char_dnbpony_f2b', g1:'char_dnbpony_b3a', g2a:'char_dnbpony_g1', g3a:'char_dnbpony_g2a', g2b:'char_dnbpony_g1', g3b:'char_dnbpony_g2b', h1:'char_dnbpony_b3b', h2a:'char_dnbpony_h1', h3a:'char_dnbpony_h2a', h2b:'char_dnbpony_h1', h3b:'char_dnbpony_h2b' },
  crystalpony: { e1:'char_crystalpony_a3a', e2a:'char_crystalpony_e1', e3a:'char_crystalpony_e2a', e2b:'char_crystalpony_e1', e3b:'char_crystalpony_e2b', f1:'char_crystalpony_a3b', f2a:'char_crystalpony_f1', f3a:'char_crystalpony_f2a', f2b:'char_crystalpony_f1', f3b:'char_crystalpony_f2b', g1:'char_crystalpony_c3a', g2a:'char_crystalpony_g1', g3a:'char_crystalpony_g2a', g2b:'char_crystalpony_g1', g3b:'char_crystalpony_g2b', h1:'char_crystalpony_c3b', h2a:'char_crystalpony_h1', h3a:'char_crystalpony_h2a', h2b:'char_crystalpony_h1', h3b:'char_crystalpony_h2b' },
  mule: { e1:'char_mule_a3b', e2a:'char_mule_e1', e3a:'char_mule_e2a', e2b:'char_mule_e1', e3b:'char_mule_e2b', f1:'char_mule_b3a', f2a:'char_mule_f1', f3a:'char_mule_f2a', f2b:'char_mule_f1', f3b:'char_mule_f2b', g1:'char_mule_b3b', g2a:'char_mule_g1', g3a:'char_mule_g2a', g2b:'char_mule_g1', g3b:'char_mule_g2b', h1:'char_mule_c3a', h2a:'char_mule_h1', h3a:'char_mule_h2a', h2b:'char_mule_h1', h3b:'char_mule_h2b' },
  alicorn: { e1:'char_alicorn_a3a', e2a:'char_alicorn_e1', e3a:'char_alicorn_e2a', e2b:'char_alicorn_e1', e3b:'char_alicorn_e2b', f1:'char_alicorn_a3b', f2a:'char_alicorn_f1', f3a:'char_alicorn_f2a', f2b:'char_alicorn_f1', f3b:'char_alicorn_f2b', g1:'char_alicorn_b3a', g2a:'char_alicorn_g1', g3a:'char_alicorn_g2a', g2b:'char_alicorn_g1', g3b:'char_alicorn_g2b', h1:'char_alicorn_b3b', h2a:'char_alicorn_h1', h3a:'char_alicorn_h2a', h2b:'char_alicorn_h1', h3b:'char_alicorn_h2b' },
  changeling: { e1:'char_changeling_a3a', e2a:'char_changeling_e1', e3a:'char_changeling_e2a', e2b:'char_changeling_e1', e3b:'char_changeling_e2b', f1:'char_changeling_a3b', f2a:'char_changeling_f1', f3a:'char_changeling_f2a', f2b:'char_changeling_f1', f3b:'char_changeling_f2b', g1:'char_changeling_b3a', g2a:'char_changeling_g1', g3a:'char_changeling_g2a', g2b:'char_changeling_g1', g3b:'char_changeling_g2b', h1:'char_changeling_b3b', h2a:'char_changeling_h1', h3a:'char_changeling_h2a', h2b:'char_changeling_h1', h3b:'char_changeling_h2b' },
  diamonddog: { e1:'char_diamonddog_a3a', e2a:'char_diamonddog_e1', e3a:'char_diamonddog_e2a', e2b:'char_diamonddog_e1', e3b:'char_diamonddog_e2b', f1:'char_diamonddog_a3b', f2a:'char_diamonddog_f1', f3a:'char_diamonddog_f2a', f2b:'char_diamonddog_f1', f3b:'char_diamonddog_f2b', g1:'char_diamonddog_b3a', g2a:'char_diamonddog_g1', g3a:'char_diamonddog_g2a', g2b:'char_diamonddog_g1', g3b:'char_diamonddog_g2b', h1:'char_diamonddog_b3b', h2a:'char_diamonddog_h1', h3a:'char_diamonddog_h2a', h2b:'char_diamonddog_h1', h3b:'char_diamonddog_h2b' },
  gargoyle: { e1:'char_gargoyle_a3a', e2a:'char_gargoyle_e1', e3a:'char_gargoyle_e2a', e2b:'char_gargoyle_e1', e3b:'char_gargoyle_e2b', f1:'char_gargoyle_a3b', f2a:'char_gargoyle_f1', f3a:'char_gargoyle_f2a', f2b:'char_gargoyle_f1', f3b:'char_gargoyle_f2b', g1:'char_gargoyle_b3a', g2a:'char_gargoyle_g1', g3a:'char_gargoyle_g2a', g2b:'char_gargoyle_g1', g3b:'char_gargoyle_g2b', h1:'char_gargoyle_b3b', h2a:'char_gargoyle_h1', h3a:'char_gargoyle_h2a', h2b:'char_gargoyle_h1', h3b:'char_gargoyle_h2b' },
  changedling: { e1:'char_changedling_a3a', e2a:'char_changedling_e1', e3a:'char_changedling_e2a', e2b:'char_changedling_e1', e3b:'char_changedling_e2b', f1:'char_changedling_a3b', f2a:'char_changedling_f1', f3a:'char_changedling_f2a', f2b:'char_changedling_f1', f3b:'char_changedling_f2b', g1:'char_changedling_b3a', g2a:'char_changedling_g1', g3a:'char_changedling_g2a', g2b:'char_changedling_g1', g3b:'char_changedling_g2b', h1:'char_changedling_c3a', h2a:'char_changedling_h1', h3a:'char_changedling_h2a', h2b:'char_changedling_h1', h3b:'char_changedling_h2b' },
  changelingqueen: { e1:'char_changelingqueen_a3b', e2a:'char_changelingqueen_e1', e3a:'char_changelingqueen_e2a', e2b:'char_changelingqueen_e1', e3b:'char_changelingqueen_e2b', f1:'char_changelingqueen_b3a', f2a:'char_changelingqueen_f1', f3a:'char_changelingqueen_f2a', f2b:'char_changelingqueen_f1', f3b:'char_changelingqueen_f2b', g1:'char_changelingqueen_c3a', g2a:'char_changelingqueen_g1', g3a:'char_changelingqueen_g2a', g2b:'char_changelingqueen_g1', g3b:'char_changelingqueen_g2b', h1:'char_changelingqueen_c3b', h2a:'char_changelingqueen_h1', h3a:'char_changelingqueen_h2a', h2b:'char_changelingqueen_h1', h3b:'char_changelingqueen_h2b' },
  filly: { e1:'char_filly_a3b', e2a:'char_filly_e1', e3a:'char_filly_e2a', e2b:'char_filly_e1', e3b:'char_filly_e2b', f1:'char_filly_b3a', f2a:'char_filly_f1', f3a:'char_filly_f2a', f2b:'char_filly_f1', f3b:'char_filly_f2b', g1:'char_filly_b3b', g2a:'char_filly_g1', g3a:'char_filly_g2a', g2b:'char_filly_g1', g3b:'char_filly_g2b', h1:'char_filly_c3a', h2a:'char_filly_h1', h3a:'char_filly_h2a', h2b:'char_filly_h1', h3b:'char_filly_h2b' },
  engineerpony: { e1:'char_engineerpony_a3a', e2a:'char_engineerpony_e1', e3a:'char_engineerpony_e2a', e2b:'char_engineerpony_e1', e3b:'char_engineerpony_e2b', f1:'char_engineerpony_a3b', f2a:'char_engineerpony_f1', f3a:'char_engineerpony_f2a', f2b:'char_engineerpony_f1', f3b:'char_engineerpony_f2b', g1:'char_engineerpony_b3b', g2a:'char_engineerpony_g1', g3a:'char_engineerpony_g2a', g2b:'char_engineerpony_g1', g3b:'char_engineerpony_g2b', h1:'char_engineerpony_c3b', h2a:'char_engineerpony_h1', h3a:'char_engineerpony_h2a', h2b:'char_engineerpony_h1', h3b:'char_engineerpony_h2b' },
};

// ---------------------------------------------------------------------------
// Mega A step 4 debuff gates. Before this step, only ~half of every
// character's four payoff leaves (e3b/f3b/g3b/h3b) sat behind a cursed 2b
// parent — on the other 26 (classId, branch) pairs the 2b node was an
// ordinary bonus node, so that branch's deepest payoff cost nothing extra.
// This table mints ONE extra cursed gate node per such pair, spliced between
// that branch's X2b node and its X3b payoff: the gate takes X2b as its own
// parent, and X3b is re-pointed at the gate (done at construction time in
// buildCharacterSkillNodes3 below — no already-built node object is mutated).
// Net effect: EVERY payoff leaf in this file is now behind at least one
// mandatory curse, matching the branches that already had a cursed 2b.
//
// Each gate's debuff lands on the SAME stat that branch's own cursed opener
// (X1) already reduces, at the -0.03 second-tier magnitude the existing
// cursed X2b nodes use — so a gated branch reads as one escalating cost on
// one field rather than a scattering of unrelated penalties, and the
// per-(classId, stat) cap arithmetic stays on the field that branch was
// already budgeted against. `curse` picks a curse-phrase this character's
// tree does not already use; `site` reuses that branch's own 2b site noun.
const SKILL_TREE_CHAR_GATE_CONFIG_3 = {
  earth:            { g:{ curse:'Faded Conviction',  site:'Mineshaft',      stat:'meleeDamage' },
                      h:{ curse:'Bitter Bargain',    site:'Hoofwork',       stat:'luck' } },
  pegasus:          { h:{ curse:'Hollow Reserve',    site:'Updraft',        stat:'meleeDamage' } },
  batpony:          { g:{ curse:'Splintered Focus',  site:'Wingmembrane',   stat:'meleeDamage' },
                      h:{ curse:'Blood Price',       site:'Talon',          stat:'speed' } },
  zebra:            { h:{ curse:'Whisper of Doubt',  site:'Warpaint',       stat:'critChance' } },
  seapony:          { g:{ curse:'Weight of the Debt',site:'Tidepool',       stat:'rangedDamage' },
                      h:{ curse:'Fraying Nerve',     site:'Riptide',        stat:'critChance' } },
  ponybot:          { h:{ curse:'Faded Conviction',  site:'Capacitor',      stat:'rangeTiles' } },
  kirin:            { g:{ curse:'Cracked Foundation',site:'Judgment',       stat:'rangedDamage' },
                      h:{ curse:'Bitter Bargain',    site:'Reckoning',      stat:'critChance' } },
  dragon:           { h:{ curse:'Hollow Reserve',    site:'Inferno Core',   stat:'rangeTiles' } },
  kelpie:           { g:{ curse:'Blood Price',       site:'Grasp',          stat:'meleeDamage' },
                      h:{ curse:'Splintered Focus',  site:'Undertow',       stat:'rangeTiles' } },
  breezie:          { h:{ curse:'Whisper of Doubt',  site:'Dustmote',       stat:'boltSpeed' } },
  crystalpony:      { g:{ curse:'Shattered Resolve', site:'Facets',        stat:'rangedDamage' },
                      h:{ curse:'Fraying Nerve',     site:'Shard',          stat:'luck' } },
  mule:             { h:{ curse:'Weight of the Debt',site:'Saddlebag',      stat:'magnetRadius' } },
  changeling:       { g:{ curse:'Cracked Foundation',site:'Carapace',       stat:'rangedDamage' },
                      h:{ curse:'Bitter Bargain',    site:'Green Flame',    stat:'speed' } },
  diamonddog:       { h:{ curse:'Hollow Reserve',    site:'Pickaxe',        stat:'magnetRadius' } },
  changedling:      { g:{ curse:'Bitter Bargain',    site:'Molt',           stat:'speed' },
                      h:{ curse:'Splintered Focus',  site:'Ember Trail',    stat:'rangedDamage' } },
  changelingqueen:  { h:{ curse:'Blood Price',       site:'Brood Call',     stat:'magnetRadius' } },
  engineerpony:     { g:{ curse:'Whisper of Doubt',  site:'Salvage',        stat:'rangedDamage' },
                      h:{ curse:'Fraying Nerve',     site:'Capacitor Bank', stat:'magnetRadius' } },
};

// Flavor lines + player-facing stat labels, reused verbatim from the curse
// phrasing already established in SKILL_TREE_CHARACTER_CONFIG_3 above so the
// generated gates read identically to the hand-written cursed nodes.
const SKILL_TREE_GATE_CURSE_FLAVOR_3 = {
  'Blood Price': 'A cost paid in strength, not coin.',
  'Shattered Resolve': 'Something has to give, and it gives here.',
  'Whisper of Doubt': 'Hesitation creeps in and never quite leaves.',
  'Fraying Nerve': 'The edge dulls just enough to be felt.',
  'Weight of the Debt': 'Power borrowed always comes due.',
  'Cracked Foundation': 'What was solid now has a fault line through it.',
  'Faded Conviction': 'The old certainty isn\'t quite there anymore.',
  'Bitter Bargain': 'Every bargain like this one costs more than it looks.',
  'Hollow Reserve': 'Something is drawn out and doesn\'t come back.',
  'Splintered Focus': 'Attention split is strength divided.',
};
const SKILL_TREE_GATE_STAT_LABEL_3 = {
  meleeDamage: 'melee damage', rangedDamage: 'ranged damage', speed: 'movement speed',
  critChance: 'critical hit chance', luck: 'luck', rangeTiles: 'range',
  boltSpeed: 'bolt speed', magnetRadius: 'pickup magnet radius',
};

const SKILL_TREE_CHARACTER_NODES_3 = [];
(function buildCharacterSkillNodes3(){
  const ORDER = ["e1","e2a","e3a","e2b","e3b","f1","f2a","f3a","f2b","f3b","g1","g2a","g3a","g2b","g3b","h1","h2a","h3a","h2b","h3b"];
  for (const cfg of SKILL_TREE_CHARACTER_CONFIG_3) {
    const classId = cfg.classId;
    const gates = SKILL_TREE_CHAR_GATE_CONFIG_3[classId] || {};
    for (const key of ORDER) {
      const content = cfg.nodes[key];
      let parentId = SKILL_TREE_CHAR_TOPOLOGY_3[classId][key];
      // Mega A step 4: a payoff leaf whose branch has a gate is re-pointed at
      // that gate, and the gate itself (parented to the leaf's ORIGINAL 2b
      // parent) is emitted immediately before it.
      const gate = (key.length === 3 && key.slice(1) === '3b') ? gates[key[0]] : null;
      if (gate) {
        const gateId = 'char_' + classId + '_' + key[0] + 'x';
        SKILL_TREE_CHARACTER_NODES_3.push({
          id: gateId,
          parent: parentId,
          cost: 1,
          name: gate.curse + ' of the ' + gate.site,
          desc: SKILL_TREE_GATE_CURSE_FLAVOR_3[gate.curse] + ' Permanently reduces ' +
                SKILL_TREE_GATE_STAT_LABEL_3[gate.stat] + ' by 3%. The deepest reward on this branch demands it.',
          effect: { type:'stat', classId: classId, stat: gate.stat, amount: -0.03 },
          cursed: true,
        });
        parentId = gateId;
      }
      const node = {
        id: 'char_' + classId + '_' + key,
        parent: parentId,
        cost: 1,
        name: content.name,
        desc: content.desc,
        effect: content.effect,
      };
      if (content.cursed) node.cursed = true;
      SKILL_TREE_CHARACTER_NODES_3.push(node);
    }
  }
})();

for (const n of SKILL_TREE_CHARACTER_NODES_3) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

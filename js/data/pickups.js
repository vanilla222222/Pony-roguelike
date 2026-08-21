'use strict';
// data/pickups.js — split from data.js: coins, pickup pool, pill colors/effects.
const COIN_TYPES = [
  { id:'penny', value:1, w:78, color:'#b06b3a', radius:6 },
  { id:'nickel', value:5, w:15, color:'#c9c9c9', radius:7 },
  { id:'dime', value:10, w:6, color:'#e8d16a', radius:6 },
  { id:'luckypenny', value:1, w:1, color:'#7fd66a', radius:6, luck:1 },
];

// Large Penny's own roll — nerfed off a guaranteed dime to mostly just a penny
const LARGEPENNY_COIN_WEIGHTS = [
  { id:'penny', w:90 },
  { id:'nickel', w:6 },
  { id:'dime', w:3 },
  { id:'luckypenny', w:1 },
];

// weighted pool for the "generic pickup" spawner category (room-clear reward,
// chest contents, and any "Pickup: random" spawner placed in the room editor)
const PICKUP_POOL = [
  { kind:'coin', w:55 },
  { kind:'bomb', w:20 },
  { kind:'key', w:20 },
  { kind:'heartRed', w:15 },
  { kind:'heartBlue', w:7 },
  { kind:'halfheartRed', w:16 }, // smaller reward than a full heart, so slightly likelier
  { kind:'halfheartBlue', w:8 },
  { kind:'doubleheart', w:5 }, // matches the Double Bomb/Double Key tier weight
  { kind:'eternalheart', w:2 }, // rarest thing in the pool — a floor of protection buys a permanent container
  { kind:'pill', w:4 }, // unlocked by default — no achievement gate, roughly as uncommon as a Sack
  { kind:'star', w:4 }, // unlocked by default too — see STAR_TYPES below
];

/* ---------------------------------------------------------------
   PILLS — Binding of Isaac-esque unknowns. Every pill looks like
   one of a handful of colors; what each color actually *does* is
   randomized once per run (see game.js startRun's pillEffectMap),
   so "Yellow Pill" might be Speed Up in one run and Bad Gas in the
   next. Using one for the first time identifies that color for the
   rest of the run. Picked up into a single pocket slot (like a
   trinket) and used with the Q key — see pills.js.
   --------------------------------------------------------------- */
const PILL_COLORS = [
  { id:'red', name:'Red Pill', color:'#e35b6a' },
  { id:'blue', name:'Blue Pill', color:'#5b9ee3' },
  { id:'yellow', name:'Yellow Pill', color:'#f4d35e' },
  { id:'green', name:'Green Pill', color:'#7fd66a' },
  { id:'orange', name:'Orange Pill', color:'#e0895a' },
  { id:'purple', name:'Purple Pill', color:'#b48ce0' },
  { id:'black', name:'Black Pill', color:'#3a3550' },
  { id:'white', name:'White Pill', color:'#e8e8e8' },
  { id:'spotted', name:'Spotted Pill', color:'#c9a3ff' },
  { id:'chalky', name:'Chalky Pill', color:'#c9c9c9' },
  // ---- expanded palette: 50 more swatches, purely cosmetic. The per-run
  // color->effect draw in game.js startRun is an independent random pick per
  // color (not a shuffle), so with 60 colors over 16 effects most runs will
  // repeat effects across several colors — that's expected, the color is just
  // the disguise, not a promise of uniqueness.
  { id:'crimson', name:'Crimson Pill', color:'#a3162c' },
  { id:'scarlet', name:'Scarlet Pill', color:'#ff3b2e' },
  { id:'rust', name:'Rust Pill', color:'#8c3a1e' },
  { id:'amber', name:'Amber Pill', color:'#ffb300' },
  { id:'gold', name:'Gold Pill', color:'#d4af37' },
  { id:'mustard', name:'Mustard Pill', color:'#c9a227' },
  { id:'lime', name:'Lime Pill', color:'#b6f04a' },
  { id:'mint', name:'Mint Pill', color:'#9ff2c4' },
  { id:'emerald', name:'Emerald Pill', color:'#1f9e5a' },
  { id:'forest', name:'Forest Pill', color:'#245c33' },
  { id:'olive', name:'Olive Pill', color:'#6b7a2e' },
  { id:'teal', name:'Teal Pill', color:'#189a9a' },
  { id:'cyan', name:'Cyan Pill', color:'#4fe3e3' },
  { id:'azure', name:'Azure Pill', color:'#2f7de0' },
  { id:'navy', name:'Navy Pill', color:'#1b2a63' },
  { id:'cobalt', name:'Cobalt Pill', color:'#274bd3' },
  { id:'indigo', name:'Indigo Pill', color:'#4b2fa8' },
  { id:'violet', name:'Violet Pill', color:'#8a3fd1' },
  { id:'lavender', name:'Lavender Pill', color:'#cbb6f2' },
  { id:'magenta', name:'Magenta Pill', color:'#e02fa0' },
  { id:'pink', name:'Pink Pill', color:'#ff9ec4' },
  { id:'rose', name:'Rose Pill', color:'#e2647f' },
  { id:'coral', name:'Coral Pill', color:'#ff7a5c' },
  { id:'peach', name:'Peach Pill', color:'#ffc9a3' },
  { id:'cream', name:'Cream Pill', color:'#f5ecd2' },
  { id:'ivory', name:'Ivory Pill', color:'#fbf7e8' },
  { id:'bone', name:'Bone Pill', color:'#ddd3bd' },
  { id:'ash', name:'Ash Pill', color:'#8d8d96' },
  { id:'slate', name:'Slate Pill', color:'#5a6472' },
  { id:'charcoal', name:'Charcoal Pill', color:'#2b2b33' },
  { id:'copper', name:'Copper Pill', color:'#b4642a' },
  { id:'bronze', name:'Bronze Pill', color:'#9c7a3c' },
  { id:'silver', name:'Silver Pill', color:'#b9c1cc' },
  { id:'pearl', name:'Pearl Pill', color:'#f3f0ff' },
  { id:'opal', name:'Opal Pill', color:'#cfe9ea' },
  { id:'jade', name:'Jade Pill', color:'#4fbf8b' },
  { id:'ruby', name:'Ruby Pill', color:'#d61f5c' },
  { id:'topaz', name:'Topaz Pill', color:'#ffd76a' },
  { id:'onyx', name:'Onyx Pill', color:'#17161f' },
  { id:'marbled', name:'Marbled Pill', color:'#cfd8dc' },
  { id:'speckled', name:'Speckled Pill', color:'#b0a58f' },
  { id:'striped', name:'Striped Pill', color:'#7a5c8f' },
  { id:'swirled', name:'Swirled Pill', color:'#e3a5c0' },
  { id:'dotted', name:'Dotted Pill', color:'#6fa3b8' },
  { id:'glossy', name:'Glossy Pill', color:'#e8f4ff' },
  { id:'dusty', name:'Dusty Pill', color:'#a89a86' },
  { id:'grainy', name:'Grainy Pill', color:'#8b7d58' },
  { id:'fizzy', name:'Fizzy Pill', color:'#a8f0ff' },
  { id:'murky', name:'Murky Pill', color:'#4a5340' },
  { id:'clear', name:'Clear Pill', color:'#c2ebf5' },
    { id:'wine', name:'Wine Pill', color:'#722f37' },
  { id:'burgundy', name:'Burgundy Pill', color:'#800020' },
  { id:'brick', name:'Brick Pill', color:'#b22222' },
  { id:'mahogany', name:'Mahogany Pill', color:'#6e260e' },
  { id:'mahogany2', name:'Dark Mahogany Pill', color:'#4a1c12' },
  { id:'salmon', name:'Salmon Pill', color:'#fa8072' },
  { id:'blush', name:'Blush Pill', color:'#de5d83' },
  { id:'raspberry', name:'Raspberry Pill', color:'#e30b5d' },
  { id:'cranberry', name:'Cranberry Pill', color:'#9e003a' },
  { id:'watermelon', name:'Watermelon Pill', color:'#fc6c85' },
  { id:'tangerine', name:'Tangerine Pill', color:'#f28500' },
  { id:'pumpkin', name:'Pumpkin Pill', color:'#ff7518' },
  { id:'persimmon', name:'Persimmon Pill', color:'#ec5800' },
  { id:'melon', name:'Melon Pill', color:'#fdbcb4' },
  { id:'banana', name:'Banana Pill', color:'#ffe135' },
  { id:'lemon', name:'Lemon Pill', color:'#fff44f' },
  { id:'butter', name:'Butter Pill', color:'#fce883' },
  { id:'sand', name:'Sand Pill', color:'#c2b280' },
  { id:'khaki', name:'Khaki Pill', color:'#c3b091' },
  { id:'beige', name:'Beige Pill', color:'#f5f5dc' },
  { id:'moss', name:'Moss Pill', color:'#8a9a5b' },
  { id:'fern', name:'Fern Pill', color:'#4f7942' },
  { id:'pine', name:'Pine Pill', color:'#01796f' },
  { id:'grass', name:'Grass Pill', color:'#7cfc00' },
  { id:'shamrock', name:'Shamrock Pill', color:'#009e60' },
  { id:'basil', name:'Basil Pill', color:'#5b8c5a' },
  { id:'sage', name:'Sage Pill', color:'#9caf88' },
  { id:'avocado', name:'Avocado Pill', color:'#568203' },
  { id:'pear', name:'Pear Pill', color:'#d1e231' },
  { id:'pistachio', name:'Pistachio Pill', color:'#93c572' },
  { id:'lagoon', name:'Lagoon Pill', color:'#4cb7a5' },
  { id:'aqua', name:'Aqua Pill', color:'#00ffff' },
  { id:'cerulean', name:'Cerulean Pill', color:'#2a52be' },
  { id:'sky', name:'Sky Pill', color:'#87ceeb' },
  { id:'ice', name:'Ice Pill', color:'#d6f5ff' },
  { id:'steel', name:'Steel Pill', color:'#4682b4' },
  { id:'denim', name:'Denim Pill', color:'#1560bd' },
  { id:'midnight', name:'Midnight Pill', color:'#191970' },
  { id:'ocean', name:'Ocean Pill', color:'#0077be' },
  { id:'arctic', name:'Arctic Pill', color:'#d0f0fd' },
  { id:'periwinkle', name:'Periwinkle Pill', color:'#ccccff' },
  { id:'lilac', name:'Lilac Pill', color:'#c8a2c8' },
  { id:'orchid', name:'Orchid Pill', color:'#da70d6' },
  { id:'iris', name:'Iris Pill', color:'#5a4fcf' },
  { id:'eggplant', name:'Eggplant Pill', color:'#614051' },
  { id:'grape', name:'Grape Pill', color:'#6f2da8' },
  { id:'heliotrope', name:'Heliotrope Pill', color:'#df73ff' },
  { id:'wisteria', name:'Wisteria Pill', color:'#c9a0dc' },
  { id:'mauve', name:'Mauve Pill', color:'#e0b0ff' },
  { id:'fuchsia', name:'Fuchsia Pill', color:'#ff00ff' },
  { id:'snow', name:'Snow Pill', color:'#fffafa' },
  { id:'linen', name:'Linen Pill', color:'#faf0e6' },
  { id:'smoke', name:'Smoke Pill', color:'#738276' },
  { id:'graphite', name:'Graphite Pill', color:'#41424c' },
  { id:'jet', name:'Jet Pill', color:'#343434' },
  { id:'ebony', name:'Ebony Pill', color:'#555d50' },
  { id:'shadow', name:'Shadow Pill', color:'#4b4b4b' },
  { id:'mist', name:'Mist Pill', color:'#d3d3d3' },
  { id:'cloud', name:'Cloud Pill', color:'#eef3f8' },
  { id:'smog', name:'Smog Pill', color:'#9099a2' },
  { id:'coffee', name:'Coffee Pill', color:'#6f4e37' },
  { id:'mocha', name:'Mocha Pill', color:'#967969' },
  { id:'latte', name:'Latte Pill', color:'#c8ad7f' },
  { id:'hazelnut', name:'Hazelnut Pill', color:'#b38b6d' },
  { id:'walnut', name:'Walnut Pill', color:'#5d432c' },
  { id:'oak', name:'Oak Pill', color:'#806517' },
  { id:'cedar', name:'Cedar Pill', color:'#8b5a2b' },
  { id:'clay', name:'Clay Pill', color:'#b66a50' },
  { id:'terracotta', name:'Terracotta Pill', color:'#e2725b' },
  { id:'umber', name:'Umber Pill', color:'#635147' },
  { id:'neonred', name:'Neon Red Pill', color:'#ff1744' },
  { id:'neonorange', name:'Neon Orange Pill', color:'#ff6f00' },
  { id:'neonyellow', name:'Neon Yellow Pill', color:'#eeff41' },
  { id:'neongreen', name:'Neon Green Pill', color:'#39ff14' },
  { id:'neoncyan', name:'Neon Cyan Pill', color:'#00ffe5' },
  { id:'neonblue', name:'Neon Blue Pill', color:'#2979ff' },
  { id:'neonpurple', name:'Neon Purple Pill', color:'#b026ff' },
  { id:'neonpink', name:'Neon Pink Pill', color:'#ff10f0' },
  { id:'pastelblue', name:'Pastel Blue Pill', color:'#aec6cf' },
  { id:'pastelgreen', name:'Pastel Green Pill', color:'#77dd77' },
  { id:'pastelyellow', name:'Pastel Yellow Pill', color:'#fdfd96' },
  { id:'pastelpink', name:'Pastel Pink Pill', color:'#ffd1dc' },
  { id:'pastelpurple', name:'Pastel Purple Pill', color:'#b39eb5' },
  { id:'pastelorange', name:'Pastel Orange Pill', color:'#ffb347' },
  { id:'pastelmint', name:'Pastel Mint Pill', color:'#a8e4a0' },
  { id:'metallicred', name:'Metallic Red Pill', color:'#b7413e' },
  { id:'metallicblue', name:'Metallic Blue Pill', color:'#4f86c6' },
  { id:'metallicgreen', name:'Metallic Green Pill', color:'#4c9a6a' },
  { id:'metallicgold', name:'Metallic Gold Pill', color:'#d6b656' },
  { id:'metallicsilver', name:'Metallic Silver Pill', color:'#c0c0c0' },
  { id:'metallicbronze', name:'Metallic Bronze Pill', color:'#cd7f32' },
  { id:'metallicviolet', name:'Metallic Violet Pill', color:'#7f5aa2' },
  { id:'opaline', name:'Opaline Pill', color:'#d9f7ff' },
  { id:'prismatic', name:'Prismatic Pill', color:'#b7e3ff' },
  { id:'rainbow', name:'Rainbow Pill', color:'#ff66cc' },
  { id:'glimmer', name:'Glimmer Pill', color:'#dff8ff' },
  { id:'shimmer', name:'Shimmer Pill', color:'#f4e4ff' },
  { id:'matte', name:'Matte Pill', color:'#9d9d9d' },
  { id:'velvet', name:'Velvet Pill', color:'#7b3f61' },
  { id:'smaragd', name:'Smaragd Pill', color:'#50c878' },
  /* ---- ACHIEVEMENT-LOCKED SWATCHES (40). Same cosmetic-only shape as every
     color above — `locked:true` is the ONLY extra field. Nothing here needs
     an effect authored for it: game.js startRun rebuilds game.pillEffectMap
     by walking every PILL_COLORS entry and drawing one random
     PILL_EFFECT_LIST id per color, so an unlocked swatch joins the same
     per-run disguise lottery the original 60 already ride.
     Gated out of the spawn rolls by room.js's rollRandomPillColorId()
     (`!c.locked || isPillColorUnlocked(c.id)`), exactly like locked
     items/trinkets/familiars/stars. Until an achievement points a
     `pillColorId` at one of these, it simply never rolls — no other system
     changes behavior (the bestiary/ui.js grids still list all of them as
     un-identified, which is what they'd show for an unrolled color anyway). */
  { id:'obsidian', name:'Obsidian Pill', locked:true, color:'#1a1622' },
  { id:'quartz', name:'Quartz Pill', locked:true, color:'#efe9f5' },
  { id:'garnet', name:'Garnet Pill', locked:true, color:'#7a1030' },
  { id:'amethyst', name:'Amethyst Pill', locked:true, color:'#9966cc' },
  { id:'citrine', name:'Citrine Pill', locked:true, color:'#e8b23a' },
  { id:'turquoise', name:'Turquoise Pill', locked:true, color:'#30d5c8' },
  { id:'sapphire', name:'Sapphire Pill', locked:true, color:'#1b3fa0' },
  { id:'aquamarine', name:'Aquamarine Pill', locked:true, color:'#7fffd4' },
  { id:'malachite', name:'Malachite Pill', locked:true, color:'#2f7d44' },
  { id:'moonstone', name:'Moonstone Pill', locked:true, color:'#dfe6ef' },
  { id:'sunstone', name:'Sunstone Pill', locked:true, color:'#e06a2a' },
  { id:'tourmaline', name:'Tourmaline Pill', locked:true, color:'#d02f7a' },
  { id:'cinnabar', name:'Cinnabar Pill', locked:true, color:'#e34234' },
  { id:'verdigris', name:'Verdigris Pill', locked:true, color:'#43b3ae' },
  { id:'saffron', name:'Saffron Pill', locked:true, color:'#f4a900' },
  { id:'paprika', name:'Paprika Pill', locked:true, color:'#c4451c' },
  { id:'plum', name:'Plum Pill', locked:true, color:'#6a2a5a' },
  { id:'mulberry', name:'Mulberry Pill', locked:true, color:'#8f3f6a' },
  { id:'cherry', name:'Cherry Pill', locked:true, color:'#c8102e' },
  { id:'apricot', name:'Apricot Pill', locked:true, color:'#fbb87c' },
  { id:'honey', name:'Honey Pill', locked:true, color:'#e8a92f' },
  { id:'caramel', name:'Caramel Pill', locked:true, color:'#c17a35' },
  { id:'cocoa', name:'Cocoa Pill', locked:true, color:'#5e3b25' },
  { id:'espresso', name:'Espresso Pill', locked:true, color:'#33231a' },
  { id:'vanilla', name:'Vanilla Pill', locked:true, color:'#f6ecc8' },
  { id:'celadon', name:'Celadon Pill', locked:true, color:'#ace1af' },
  { id:'seafoam', name:'Seafoam Pill', locked:true, color:'#8fe3c2' },
  { id:'glacier', name:'Glacier Pill', locked:true, color:'#bfe6f0' },
  { id:'frost', name:'Frost Pill', locked:true, color:'#dff4ff' },
  { id:'storm', name:'Storm Pill', locked:true, color:'#4c586a' },
  { id:'thunder', name:'Thunder Pill', locked:true, color:'#f2e14c' },
  { id:'ember', name:'Ember Pill', locked:true, color:'#ff5a1f' },
  { id:'magma', name:'Magma Pill', locked:true, color:'#9c2109' },
  { id:'soot', name:'Soot Pill', locked:true, color:'#26242a' },
  { id:'tar', name:'Tar Pill', locked:true, color:'#0f0e12' },
  { id:'mercury', name:'Mercury Pill', locked:true, color:'#c7ccd1' },
  { id:'platinum', name:'Platinum Pill', locked:true, color:'#e0e2e5' },
  { id:'brass', name:'Brass Pill', locked:true, color:'#b5a642' },
  { id:'ultraviolet', name:'Ultraviolet Pill', locked:true, color:'#6a0dad' },
  { id:'iridescent', name:'Iridescent Pill', locked:true, color:'#a8e6ff' },
];
const PILL_COLORS_BY_ID = {};
for (const c of PILL_COLORS) PILL_COLORS_BY_ID[c.id] = c;

const PILL_EFFECTS = {
  fullhealth: { id:'fullhealth', name:'Full Health', desc:'Fully heals you.', good:true },
  speedup:    { id:'speedup', name:'Speed Up', desc:'+10% movement speed, permanently.', good:true },
  speeddown:  { id:'speeddown', name:'Speed Down', desc:'-10% movement speed, permanently.', good:false },
  damageup:   { id:'damageup', name:'Damage Up', desc:'+1 damage to all attacks, permanently.', good:true },
  damagedown: { id:'damagedown', name:'Damage Down', desc:'-1 damage to all attacks, permanently.', good:false },
  luckup:     { id:'luckup', name:'Luck Up', desc:'+2 Luck, permanently.', good:true },
  luckdown:   { id:'luckdown', name:'Luck Down', desc:'-2 Luck, permanently.', good:false },
  rangeup:    { id:'rangeup', name:'Range Up', desc:'+1 tile of attack range, permanently (melee only gains 25% as much).', good:true },
  rangedown:  { id:'rangedown', name:'Range Down', desc:'-1 tile of attack range, permanently (melee only loses 25% as much).', good:false },
  tearsup:    { id:'tearsup', name:'Tears Up', desc:'Attacks and shots recharge faster, permanently.', good:true },
  tearsdown:  { id:'tearsdown', name:'Tears Down', desc:'Attacks and shots recharge slower, permanently.', good:false },
  chargeup:   { id:'chargeup', name:'Charge Up', desc:'Fully charges your active item.', good:true },
  heartup:    { id:'heartup', name:'Heart Up', desc:'+1 heart container.', good:true },
  hpdown:     { id:'hpdown', name:'Bad Trip', desc:'Lose 1 heart.', good:false },
  hpup:       { id:'hpup', name:'Patch Up', desc:'Heals 1 heart (a blue one if you have no red health).', good:true },
  // deliberately marked good:true — `good` only picks the toast sound in
  // pills.js, and this one does hand you a real upgrade alongside the sting
  mystery:    { id:'mystery', name:'Mystery', desc:'Applies one random positive and one random negative effect.', good:true },
};
const PILL_EFFECT_LIST = Object.values(PILL_EFFECTS);

/* ---------------------------------------------------------------
   STARS — named one-shot consumables. Unlike a pill, a star is
   never hidden — its name and effect show up front, both on pickup
   and in the HUD. Held in their own single pocket slot (see
   player.starPocket) and used with the R key — see stars.js. "For
   the room" effects (Alcyone, Electra, Vega) wear off the instant a
   new room is entered — see game.js enterRoom.

   The original eight are named after the Pleiades sisters; the four
   locked ones below are superboss-reward stars (see achievements.js's
   SUPERBOSS_REWARDS) and pull their names from elsewhere in the sky
   instead, one per new character — Dragon/Windigo/Kelpie/Breezie.
   Random rolls (room-clear, shop, Sack, Celaeno) skip any star still
   locked — see room.js's rollRandomStarId().
   --------------------------------------------------------------- */

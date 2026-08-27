'use strict';
// data/economy.js — split from data.js: shop prices, chests, reward pools, type lists.
const SHOP_ITEM_PRICE = 16; // flat, passive and active alike — the big-ticket slot
const SHOP_TRINKET_PRICE = 9;  // a trinket occupies one swappable slot, so it's the cheap permanent
const SHOP_FAMILIAR_PRICE = 12; // a familiar stacks forever and never has to be given up — priced above a trinket
// WHICH pickup kinds a shop can stock, NOT what they cost. room.js's
// addShopSlot only reads `kind` out of this list and then prices the slot
// through shop.js's shopPrice() — the `price` fields below are vestigial and
// have drifted out of sync with the real table more than once. They are kept
// (and kept matching SHOP_BASE_PRICES) purely so the room editor's dropdown
// and anyone reading this file aren't shown a number that is a lie.
const SHOP_PICKUP_PRICES = [
  { kind:'heartRed', price:3 },
  { kind:'heartBlue', price:6 },
  { kind:'bomb', price:5 },
  { kind:'key', price:5 },
  { kind:'pill', price:5 },
  { kind:'star', price:7 },  // a star is always a known, always-useful effect — a pill is a gamble
  { kind:'sack', price:8 },
  { kind:'battery', price:9 },
  { kind:'trashbag', price:10 }, // Phase 16 — see combat-2.js's grantPickupEffect 'trashbag' case
];

/* ---------------------------------------------------------------
   CHESTS
   --------------------------------------------------------------- */
const CHEST_TYPES = {
  // itemChance now scales with what the chest costs to open. It used to be a
  // flat 0.05 for all three locked kinds, which made the Cursed Chest strictly
  // dominated — two hearts for the same odds a single bomb buys.
  stone:  { id:'stone', name:'Stone Chest', requires:'bomb',
            color:'#7a746a', dark:'#524d46', lidColor:'#3f3b34', itemChance:0.08 },
  gold:   { id:'gold', name:'Gold Chest', requires:'key',
            color:'#c9a13a', dark:'#8a6a1c', lidColor:'#5c4a1a', itemChance:0.10 },
  grey:   { id:'grey', name:'Chest', requires:'none',
            color:'#8a8578', dark:'#524d46', lidColor:'#403c34', itemChance:0 },
  cursed: { id:'cursed', name:'Cursed Chest', requires:'hearts', heartCost:2,
            color:'#4a2458', dark:'#28122f', lidColor:'#1a0a1f', itemChance:0.16 },
  // 50% chance to stay re-openable after being opened — see combat.js
  // openChestContents (wired by another agent), this file only needs the
  // chest TYPE to exist.
  eternal:{ id:'eternal', name:'Eternal Chest', requires:'key',
            color:'#8fd0f0', dark:'#3a6a8a', lidColor:'#23485e', itemChance:0.10 },
  // contents restricted to pill/star only, bonus roll forced to trinket —
  // see combat.js openChestContents (wired by another agent).
  wood:   { id:'wood', name:'Wooden Chest', requires:'none',
            color:'#9a6b3a', dark:'#5e3f20', lidColor:'#3f2a15', itemChance:1.0 },
};
// weighted pool used wherever a chest kind is picked at random (procedural
// room population, and the 5% "chest" slice of the room-clear reward below)
const CHEST_TYPE_POOL = [
  { id:'grey', w:40 },
  { id:'gold', w:20 },
  { id:'stone', w:20 },
  { id:'cursed', w:10 },
  { id:'eternal', w:5 },
  { id:'wood', w:5 },
];

/* ---------------------------------------------------------------
   ROOM-CLEAR REWARD — rolled once per cleared non-boss room
   (see room.js spawnClearRoomPickup)
   --------------------------------------------------------------- */
// top tier split — sums to 1.0. Rolled first, then the matching pool below
// decides what actually drops. Fortune Shell shifts some `nothing` into
// `legendary` (see room.js spawnClearRoomPickup).
const CLEAR_REWARD_CHANCE = { nothing:0.10, common:0.73, rare:0.15, legendary:0.02 };

// common tier — first a category, then that category's own tier pool.
// (bomb/key reuse the shared BOMB_TIER_POOL/KEY_TIER_POOL above.)
const COMMON_CATEGORY_POOL = [
  { id:'penny', w:25 },
  { id:'heart', w:25 },
  { id:'bomb', w:25 },
  { id:'key', w:25 },
];
const COMMON_PENNY_POOL = [
  { id:'penny', w:85 },
  { id:'nickel', w:7 },
  { id:'cursedpenny', w:5 },
  { id:'dime', w:2 },
  { id:'luckypenny', w:1 },
];
const COMMON_HEART_POOL = [
  { id:'heartRed', w:50 },
  { id:'heartBlue', w:25 },
  { id:'halfheartRed', w:10 },
  { id:'halfheartBlue', w:10 },
  { id:'doubleheart', w:3 },
  { id:'eternalheart', w:1 },
  { id:'goldheart', w:1 },
];
// rare tier — consumables and the sack/battery utility drops
const RARE_POOL = [
  { id:'pill', w:45 },
  { id:'star', w:20 },
  { id:'sack', w:20 },
  { id:'battery', w:15 },
  { id:'trashbag', w:12 }, // Phase 16 — NOT in ACHIEVEMENT_PICKUP_KINDS, so always eligible here
];
// legendary tier — a chest (rolled against CHEST_TYPE_POOL) or a direct
// trinket/familiar grant, same helpers a chest's bonus prize uses
const LEGENDARY_POOL = [
  { id:'chest', w:50 },
  { id:'trinket', w:48 },
  { id:'familiar', w:2 },
];

/* ---------------------------------------------------------------
   BESTIARY METADATA LISTS — flat {id,name,icon,desc} lists shaped
   exactly like STAR_LIST/TRINKET_LIST so bestiary.js's generic
   renderBestiarySimple(wrap, LIST, seenSection) can render them.
   Pills and stars have their own tabs already, so they're not here.
   --------------------------------------------------------------- */
const PICKUP_TYPE_LIST = [
  // -- coins (the five COIN_TYPES tiers; cursedpenny is new) --
  { id:'penny', name:'Penny', icon:'🪙', desc:'Worth 1 coin. The common drop.' },
  { id:'nickel', name:'Nickel', icon:'🥈', desc:'Worth 5 coins.' },
  { id:'dime', name:'Dime', icon:'🥇', desc:'Worth 10 coins.' },
  { id:'luckypenny', name:'Lucky Penny', icon:'🍀', desc:'Worth 1 coin and +1 Luck for the run.' },
  { id:'cursedpenny', name:'Cursed Penny', icon:'🎰', desc:'A gamble — gain coins, lose coins, or nothing at all.' },
  // -- hearts --
  { id:'heartRed', name:'Red Heart', icon:'❤️', desc:'Heals a full heart of red health.' },
  { id:'heartBlue', name:'Blue Heart', icon:'💙', desc:'Adds a full soul heart — spent before your red health.' },
  { id:'halfheartRed', name:'Half Red Heart', icon:'💔', desc:'Heals half a heart of red health.' },
  { id:'halfheartBlue', name:'Half Blue Heart', icon:'🩵', desc:'Adds half a soul heart.' },
  { id:'doubleheart', name:'Double Heart', icon:'💕', desc:'Heals two full red hearts at once.' },
  { id:'heartContainer', name:'Heart Container', icon:'🫀', desc:'Permanently raises your maximum health by one heart.' },
  { id:'eternalheart', name:'Eternal Heart', icon:'🤍', desc:'Survive to the end of the floor holding it and it becomes a permanent heart container.' },
  { id:'goldheart', name:'Gold Heart', icon:'💛', desc:'Heals half a heart at the end of any room you took no damage in. Lost the instant you\'re hit.' },
  // -- bombs --
  { id:'bomb', name:'Bomb', icon:'💣', desc:'Grants 1 bomb.' },
  { id:'doublebomb', name:'Double Bomb', icon:'🧨', desc:'Grants 2 bombs instead of 1.' },
  { id:'goldbomb', name:'Golden Bomb', icon:'✨', desc:'Unlimited bombs for the rest of this floor.' },
  // -- keys --
  { id:'key', name:'Key', icon:'🔑', desc:'Grants 1 key.' },
  { id:'doublekey', name:'Double Key', icon:'🗝️', desc:'Grants 2 keys instead of 1.' },
  { id:'goldkey', name:'Golden Key', icon:'👑', desc:'Unlimited keys for the rest of this floor.' },
  // -- misc --
  { id:'sack', name:'Sack', icon:'🎒', desc:'Bursts open into a random handful of pickups.' },
  { id:'battery', name:'Battery', icon:'🔋', desc:'Fully recharges your active item.' },
  { id:'minibattery', name:'Micro Battery', icon:'🪫', desc:'Partially recharges your active item.' },
];

const ROOM_TYPE_LIST = [
  { id:'normal', name:'Normal Room', icon:'🚪', desc:'A plain room — clear the enemies for a chance at a reward.' },
  { id:'start', name:'Start Room', icon:'🏠', desc:'Where you arrive on each floor. Always empty and safe.' },
  { id:'boss', name:'Boss Room', icon:'👹', desc:"Where the floor's boss awaits. Beating it opens the way down." },
  { id:'treasure', name:'Treasure Room', icon:'💰', desc:'Holds a free item pedestal.' },
  { id:'shop', name:'Shop', icon:'🛒', desc:'Spend coins on items, pickups and consumables.' },
  { id:'secret', name:'Secret Room', icon:'🕳️', desc:'Hidden behind a wall — bomb your way in for whatever is stashed inside.' },
  { id:'petshop', name:'Pet Shop', icon:'🐾', desc:'Offers a free familiar to follow you for the run.' },
  { id:'curse', name:'Cursed Room', icon:'💀', desc:'A reward guarded by a price paid in health.' },
  { id:'sacrifice', name:'Sacrifice Room', icon:'🩸', desc:'Spikes that hurt you — step on them repeatedly for escalating rewards.' },
  { id:'vault', name:'Vault', icon:'🏦', desc:'Requires a key — guards a stash of coins and pickups.' },
  { id:'challenge', name:'Challenge Room', icon:'🏟️', desc:'Take the item and survive the waves of enemies it summons.' },
  { id:'crystal', name:'Crystal Room', icon:'💎', desc:'Offers a blessing — a free pedestal item, no strings attached.' },
  { id:'sombra', name:'Sombra Room', icon:'🌑', desc:'Strikes a costly deal for a powerful boon — items here are paid for in hearts.' },
  { id:'star', name:'Star Room', icon:'🌌', desc:'Key-locked — pick one of two items on offer.' },
  { id:'cpathgate', name:'Storm Drain', icon:'🚧', desc:'A hidden alternate path, found only on Floor 2.' },
  { id:'planetarium', name:'Planetarium', icon:'🔭', desc:'A room with no walls at all, open onto the stars. A second alternate path, found only on Floor 3.' },
  { id:'shrine', name:'Shrine', icon:'🕯️', desc:'Offers a blessing for a price paid in coins, not hearts.' },
  { id:'arcade', name:'Arcade', icon:'🎰', desc:'Costs 1 coin at the door. Feed fillies and machines inside for gambled rewards.' },
];
// room-type id -> audio.js MUSIC_TRACKS id, for game.js's enterRoom — the
// room-scoped equivalent of stages.js's STAGE_MUSIC_TRACKS: overrides the
// floor's own background track for as long as the player is standing in a
// room of that type, then restores the floor track on leaving. Several
// room types deliberately SHARE a track (crystal+shrine both being a
// blessing paid differently; sombra+curse both a costly deal; secret+
// sacrifice both a hidden/risky payoff; shop+petshop both a spend-coins
// stop) rather than each getting its own — see the individual MUSIC_TRACKS
// entries in audio.js for why each pairing makes sense. Any room type with
// no entry here (normal, start, vault, challenge, star, the two gate
// rooms, arcade) just keeps playing the floor's track uninterrupted.
const ROOM_MUSIC_TRACKS = {
  boss:'bossroom',
  crystal:'crystalroom', shrine:'crystalroom',
  sombra:'sombraroom', curse:'sombraroom',
  treasure:'treasureroom',
  secret:'secretroom', sacrifice:'secretroom',
  shop:'shoproom', petshop:'shoproom',
};

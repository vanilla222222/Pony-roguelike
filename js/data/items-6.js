'use strict';
// data/items-6.js — Phase 11 item 4: 15 brand-new items, locked:true, the
// SAME "only route in is a skill tree unlock node" pattern as
// data/items-5.js (Phase 8e slice 4) — see that file's header comment and
// achievements/logic.js's isItemUnlocked. Each item's mechanical effect is
// one appended term on the matching stat formula in js/systems/items-1.js's
// recalcPlayerStats (tagged "Phase 11 item 4" at each insertion point), the
// same generic `+ amount * (p.itemId || 0)` counting convention used by
// every other passive item in the game — no new engine code required.
// Unlocked via achievements/skilltree-unlocks-items-2.js (a second hub,
// "Sealed Reliquary", sibling to Phase 8e's "Forgotten Workshop").
Object.assign(ITEMS, {
  sk11i_hoofbrand: { id:'sk11i_hoofbrand', type:'passive', quality:2, name:'Branded Hoofguard', icon:'🔨', color:'#c9522e', pools:POOLS_ALL,
    locked:true, desc:'+1 damage to all attacks, melee and ranged alike.' },
  sk11i_starcompass: { id:'sk11i_starcompass', type:'passive', quality:2, name:"Wayfarer's Star-Compass", icon:'🧭', color:'#e3c15d', pools:POOLS_ALL,
    locked:true, desc:'+2 Luck.' },
  sk11i_windveil: { id:'sk11i_windveil', type:'passive', quality:2, name:'Windveil Sash', icon:'🎐', color:'#7fd6c9', pools:POOLS_ALL,
    locked:true, desc:'+12% movement speed.' },
  sk11i_direarrow: { id:'sk11i_direarrow', type:'passive', quality:2, name:'Dire Arrowhead', icon:'🏹', color:'#8a7a6a', pools:POOLS_ALL,
    locked:true, desc:'Ranged bolts pierce through one more enemy.' },
  sk11i_hexbead: { id:'sk11i_hexbead', type:'passive', quality:2, name:'Hexed Knucklebead', icon:'💫', color:'#c9a35a', pools:POOLS_ALL,
    locked:true, desc:'+6% chance to stun an enemy on hit.' },
  sk11i_witheredfang: { id:'sk11i_witheredfang', type:'passive', quality:2, name:'Withered Fang', icon:'🦴', color:'#3a8a6a', pools:POOLS_ALL,
    locked:true, desc:'+6% chance to poison an enemy on hit.' },
  sk11i_ashencrown: { id:'sk11i_ashencrown', type:'passive', quality:2, name:'Ashen Coronet', icon:'👑', color:'#e0895a', pools:POOLS_ALL,
    locked:true, desc:'+6% critical hit chance.' },
  sk11i_duskveil: { id:'sk11i_duskveil', type:'passive', quality:2, name:'Duskveil Mantle', icon:'🌑', color:'#4a4640', pools:POOLS_ALL,
    locked:true, desc:'+6% chance to make an enemy flee in fear on hit.' },
  sk11i_pulltotem: { id:'sk11i_pulltotem', type:'passive', quality:2, name:'Pulling Totem', icon:'🌀', color:'#5b9ee3', pools:POOLS_ALL,
    locked:true, desc:'+25 pickup magnet radius.' },
  sk11i_bombward: { id:'sk11i_bombward', type:'passive', quality:2, name:'Bombward Sigil', icon:'💣', color:'#e0895a', pools:POOLS_ALL,
    locked:true, desc:'+12% bomb blast radius.' },
  sk11i_dodgering: { id:'sk11i_dodgering', type:'passive', quality:2, name:'Dodging Signet-Ring', icon:'💍', color:'#c9c3ff', pools:POOLS_ALL,
    locked:true, desc:'+6% chance to dodge incoming damage entirely.' },
  sk11i_edgehone: { id:'sk11i_edgehone', type:'passive', quality:2, name:"Honing Edge-Stone", icon:'🗡️', color:'#8a5ac9', pools:POOLS_ALL,
    locked:true, desc:'Critical hits deal even more damage.' },
  sk11i_lifewell: { id:'sk11i_lifewell', type:'passive', quality:2, name:'Sealed Lifewell', icon:'🩸', color:'#c9522e', pools:POOLS_ALL,
    locked:true, desc:'6% chance any hit heals you half a heart.' },
  sk11i_healcrest: { id:'sk11i_healcrest', type:'passive', quality:2, name:'Healing Crest', icon:'❤️‍🩹', color:'#e35b6a', pools:POOLS_ALL,
    locked:true, desc:'+6% chance to heal half a heart whenever you kill an enemy.' },
  sk11i_coinpurse: { id:'sk11i_coinpurse', type:'passive', quality:2, name:"Sealed Coinpurse", icon:'👛', color:'#e3c15d', pools:POOLS_ALL,
    locked:true, desc:'-5% shop prices.' },
});

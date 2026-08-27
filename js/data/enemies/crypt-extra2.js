'use strict';
/* ============================================================
   data/enemies/crypt-extra2.js — Phase 19. The "any more Crypt
   enemy ideas?" batch — nine enemies built around interacting with
   something other than the player (the room's pickups, another
   enemy, the room's own death count, the terrain itself), each with
   real new AI in systems/ai-crypt2.js. `onlyFloorNum:0` (new,
   room.js's resolveGenericEnemy) restricts every one of them to
   literally the first floor of the run — not stage 0's whole
   two-floor window (see growth.js's FLOORS_PER_STAGE — Crypt is
   floorNum 0-1; this batch is floorNum 0 only, as asked).
   ============================================================ */
Object.assign(ENEMY_TYPES, {
  graverobber: { id:'graverobber', name:'DNB Grave Robber', hp:5, dmg:1, speed:92, radius:11,
    color:'#8a7a4a', dark:'#453a20', behavior:'thief', onlyFloorNum:0, xpTier:1, stage:0,
    desc:'Not here to fight you — it wants whatever\'s on the ground. Kill it fast or watch your loot leave the room.' },
  coffinlid: { id:'coffinlid', name:'DNB Coffin Lid', hp:6, dmg:3, speed:70, radius:13,
    color:'#5a5248', dark:'#2c2820', behavior:'trapLid', triggerRange:90, lungeSpeed:6, onlyFloorNum:0, xpTier:1, stage:0,
    desc:'Looks like just another coffin prop until you\'re close. One real lunge, then it never moves again.' },
  chainrattler: { id:'chainrattler', name:'DNB Chain Rattler', hp:5, dmg:1, speed:78, radius:11,
    color:'#7a746a', dark:'#3a3630', behavior:'chainlink', groupSize:2, chainLength:130, linkedDeath:true,
    contactCooldown:0.5, onlyFloorNum:0, xpTier:1, stage:0,
    desc:'Never spawns alone — put down its other half and this one drops too, wherever it happens to be.' },
  bonepiler: { id:'bonepiler', name:'DNB Bone Piler', hp:8, dmg:1, speed:40, radius:12,
    color:'#a89a80', dark:'#5c5240', behavior:'bonepiler', pileTime:5, exposedTime:2.5,
    spawnFliesOnDeath:{ id:'bonecrawler', count:2, radius:30 }, onlyFloorNum:0, xpTier:1, stage:0, weight:0.8,
    desc:'Soft the moment it wakes up — leave it alone even a few seconds and it\'s built itself real armor. Breaks into two crawlers when it finally goes down.' },
  epitaphreader: { id:'epitaphreader', name:'DNB Epitaph Reader', hp:4, dmg:1, speed:0, radius:11,
    color:'#8a8fa0', dark:'#403f4e', behavior:'curser', curseMaxRadius:90, curseFreeze:0.8, onlyFloorNum:0, xpTier:1, stage:0,
    desc:'Doesn\'t move, doesn\'t chase — just reads, and the ground around it curses shut on anyone still standing there when it finishes.' },
  mourner: { id:'mourner', name:'DNB Mourner', hp:5, dmg:1, speed:66, radius:11,
    color:'#6a6270', dark:'#332e3a', behavior:'mourner', enrageSpeedMult:1.8, enrageDmgMult:1.6, onlyFloorNum:0, xpTier:1, stage:0,
    desc:'Grieves quietly and does nothing much — until something else in the room dies. After that it never calms back down.' },
  sexton: { id:'sexton', name:'DNB Sexton', hp:6, dmg:1, speed:56, radius:12,
    color:'#5c5442', dark:'#2e2a20', behavior:'sexton', digCooldownMin:3, digCooldownMax:4.5, telegraphTime:1.2,
    onlyFloorNum:0, xpTier:1, stage:0,
    desc:'Marks exactly where you\'re standing and starts digging — slowly enough that the pit opens under wherever you WERE, not where you are.' },
  sarcophagus: { id:'sarcophagus', name:'DNB Sarcophagus', hp:3, dmg:2, speed:0, radius:16,
    color:'#c9a13a', dark:'#5c4718', behavior:'sarcophagus', flySpawnCount:3, spawnFlyId:'dnbfly',
    openCooldownMin:8, openCooldownMax:12, onlyFloorNum:0, xpTier:1, stage:0, weight:0.6,
    desc:'A heavy stone lid that never moves — but it doesn\'t need to. It just keeps cracking open and letting more out.' },
  armoredsarcophagus: { id:'armoredsarcophagus', name:'DNB Armored Sarcophagus', hp:6, dmg:2, speed:0, radius:17,
    color:'#8a8578', dark:'#403c34', behavior:'sarcophagusArmored', flySpawnCount:3, spawnFlyId:'dnbredfly',
    armorTime:4, vulnTime:2.5, openCooldownMin:8, openCooldownMax:12, onlyFloorNum:0, xpTier:1, stage:0, weight:0.5,
    desc:'Bound shut in iron banding — armored more often than not, and what it lets out actually bites back.' },

  // ---- Bone Piler's on-death payload — a minion, never rolled on its own
  // (isMinion excludes it from resolveGenericEnemy the same way every
  // other splitter/summon child in the game already is).
  bonecrawler: { id:'bonecrawler', name:'DNB Bone Crawler', hp:2, dmg:1, speed:105, radius:8,
    color:'#c9c2b0', dark:'#5c574a', behavior:'chaser', contactCooldown:0.5, isMinion:true, onlyFloorNum:0, xpTier:1, stage:0 },
});

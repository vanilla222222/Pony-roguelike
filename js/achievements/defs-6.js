'use strict';
// achievements/defs-6.js — split from achievements.js (part 6/6).
addAchievement({ id:'star_merak', name:'Recharged', icon:'🔋',
  desc:'Use your active item 150 times.', category:'Stars', starId:'merak', statKey:'activeItemUses', threshold:150 });
addAchievement({ id:'star_megrez', name:'Vault Breaker', icon:'🪞',
  desc:'Open 10 vaults.', category:'Stars', starId:'megrez', statKey:'vaultsOpened', threshold:10 });
addAchievement({ id:'star_alkaid', name:'Gauntlet Runner', icon:'✨',
  desc:'Complete 10 challenge rooms.', category:'Stars', starId:'alkaid', statKey:'challengeRoomsCompleted', threshold:10 });
addAchievement({ id:'star_phecda', name:'Cold Front', icon:'🧊',
  desc:'Freeze 150 enemies.', category:'Stars', starId:'phecda', statKey:'enemiesFrozen', threshold:150 });
addAchievement({ id:'star_pollux', name:'Chest Devourer', icon:'🏛️',
  desc:'Open 150 chests.', category:'Stars', starId:'pollux', statKey:'chestsOpened', threshold:150 });
addAchievement({ id:'star_alnilam', name:'Something to Fear', icon:'😱',
  desc:'Defeat 400 enemies with melee attacks.', category:'Stars', starId:'alnilam', statKey:'meleeKills', threshold:400 });
addAchievement({ id:'star_mintaka', name:'Winning Smile', icon:'💞',
  desc:'Defeat 400 enemies with ranged attacks.', category:'Stars', starId:'mintaka', statKey:'rangedKills', threshold:400 });
addAchievement({ id:'star_bellatrix', name:'Kingslayer', icon:'👑',
  desc:'Defeat 30 bosses.', category:'Stars', starId:'bellatrix', statKey:'bossesKilled', threshold:30 });
addAchievement({ id:'star_betelgeuse', name:'Deep Pockets', icon:'🪙',
  desc:'Collect 3000 coins.', category:'Stars', starId:'betelgeuse', statKey:'coinsCollected', threshold:3000 });
addAchievement({ id:'star_dubhe', name:'Surgical', icon:'⚔️',
  desc:'Land 600 critical hits.', category:'Stars', starId:'dubhe', statKey:'critsLanded', threshold:600 });
addAchievement({ id:'star_rigel', name:'Swarm Executioner', icon:'☠️',
  desc:'Defeat 300 Swarmer DNBs.', category:'Stars', starId:'rigel', statKey:'swarmerdnbKilled', threshold:300 });
addAchievement({ id:'star_castor', name:'Constellation Keeper', icon:'✴️',
  desc:'Use 100 stars.', category:'Stars', starId:'castor', statKey:'starsUsed', threshold:100 });
addAchievement({ id:'star_sirius', name:'Brightest in the Sky', icon:'🌠',
  desc:'Win the game 3 times.', category:'Stars', starId:'sirius', statKey:'wins', threshold:3 });

/* ==== THE DROWNED PATH — C-branch exploration + completion ====
   The alternate 3C-10C branch (game.js's floorPath === 'C', entered from
   the floor-2 gate room, ended by Kirk DNB on 10C) had no achievement of
   its own outside the sb_<boss>_<class> grid. These eight recognise the
   branch as a PLACE rather than as a set of boss kills.

   Two new counters, both Predicate A, both declared in
   ensureUnlockShape's statDefaults above:
     cBranchFloorsVisited -> game.js startFloor(), inside its existing
       `if (this.floorPath === 'C')` block. One bump per floor entered,
       max 8 per run (3C..10C), never re-bumped by re-entering a room.
     cBranchRunsCompleted -> game.js descend(), in the
       `floorNum >= C_LAST_FLOORNUM` win branch. Exactly one per won run.

   Thresholds: the floor ladder is 8 / 40 / 160 — one full traversal of
   the branch, then five, then twenty. The completion ladder is anchored
   on the existing `wins` rungs (1 / 3 / 5, see 'firstwin'/'championsash'/
   'livinglegendscrown'): rung 1 at the lowest existing rung, then clearly
   past everything already on a win counter.

   Rewards: these were reward-free when written, for the reason section 8b
   gives (the old locked pools were fully spoken for by the Superbosses grid
   and the last shopDiscount kind went to the Star Room ladder). The
   expand-everything content pass added new locked pools, so all eight now
   carry one apiece — the two top rungs and the completion feat take
   `enemyId` bestiary unlocks, which read as "the drowned path gives up more
   of its own", and the rest take new trinkets / items / familiars / a pill
   colour. Every id is verified unclaimed anywhere else in this file. */
addAchievement({ id:'cbranch_entered', name:'Down the Storm Drain', icon:'🌧️',
  desc:'Find the drain on Floor 2 and set hoof on the drowned path (3C).',
  category:'Exploration', statKey:'cBranchFloorsVisited', threshold:1, pillColorId:'tar' });
addTierSet({ baseId:'exploration_cbranchfloors', name:'Drowned Pathfinder', icon:'🌊',
  category:'Exploration', statKey:'cBranchFloorsVisited',
  desc: n => 'Enter ' + n + ' floors of the drowned path (3C-10C).',
  tiers:[
    { threshold:8, trinketId:'frostbittag' },
    { threshold:40, itemId:'deepflask' },
    { threshold:160, enemyId:'boglurker' },
  ] });
addAchievement({ id:'cbranch_complete', name:'Silence at the Source', icon:'🎤',
  desc:'Silence Kirk DNB on 10C and escape the drowned path.',
  category:'Challenge', statKey:'cBranchRunsCompleted', threshold:1, enemyId:'quagmiredelver' });
addTierSet({ baseId:'challenge_cbranchwins', name:'Drowned Path Champion', icon:'🏆',
  category:'Challenge', statKey:'cBranchRunsCompleted',
  desc: n => 'Finish the drowned path (3C-10C) ' + n + ' times.',
  tiers:[
    { threshold:3, trinketId:'ogrehasp' },
    { threshold:10, familiarId:'frostvessel' },
    { threshold:25, enemyId:'doomchoir' },
  ] });

// Phase 3 overhaul — Shrine room ladder (see dungeon.js's attachSpecial,
// room.js's addShrinePedestal). Same shape as the petshop/curse/crystal
// room-visit pairs in defs-1.js/defs-2.js, but declared as a single
// addTierSet instead of N addAchievement calls. Rewards are the Shrine
// batch's own items (see data/items-5.js).
addTierSet({ baseId:'shrine_visits', name:'Shrine Devotee', icon:'🕯️',
  category:'Miscellaneous', statKey:'shrineRoomsVisited',
  desc: n => 'Visit ' + n + ' Shrines.',
  tiers:[
    { threshold:5, itemId:'shrinecandle' },
    { threshold:20, itemId:'faithfulbell' },
    { threshold:50, itemId:'eternaldevotion' },
  ] });

// Phase 4 overhaul — Arcade room ladder (see dungeon.js's attachSpecial,
// combat.js's coinLockedRoomFor/tryUnlockCoinDoor, room.js's populateRoom,
// shop.js's tryArcadeInteract). Same single-addTierSet shape as shrine_visits
// above. Rewards are the Arcade batch's own visit-ladder items (data/items-5.js).
addTierSet({ baseId:'arcade_visits', name:'Arcade Regular', icon:'🎰',
  category:'Miscellaneous', statKey:'arcadeRoomsVisited',
  desc: n => 'Visit ' + n + ' Arcades.',
  tiers:[
    { threshold:5, itemId:'luckytoken' },
    { threshold:15, itemId:'jackpotcharm' },
    { threshold:30, itemId:'arcadecrown' },
  ] });

/* ============================================================
   PHASE 5B — meta-progression / achievement sweep. Covers content from
   Phases 1-4 that had no achievement of its own yet, plus a couple of new
   lifetime tracks. Every new stat this section watches is declared in
   logic.js's statDefaults and bumped at a real gameplay event site — see
   the comment beside each stat there and the Phase 5b section of
   CODE_REFERENCE.md.

   REWARD-ECONOMY NOTE (read before touching this section): before writing
   this batch, an audit of every reward field in EVERY achievement in this
   file (including the ones minted programmatically by the sb_<boss>_<class>
   loop above, via NEW_CLASS_REWARD_ITEMS/_FAMILIARS/_STARS and the
   TRINKET_LIST filter) turned up only 18 never-claimed reward ids in the
   entire game: 1 locked item (`frostflask`) and 17 locked familiars
   (`runiccup`/`wardpuff`/`bulwarkmoth`/`pocketimp`/`huntgrub`/`feastwyrm`/
   `tallystone`/`poppingfungus`/`twinflame`/`shadowtwin`/`fetchhound`/
   `tidymole`/`ragefang`/`bloodhalo`/`scarabofwoe`/`broodmite`/`sporemother`).
   Every locked trinket, pill color, enemy, star, and shopDiscount kind is
   already spoken for. That headroom (not the "roughly 12-18" guidance) is
   what actually caps this batch's size and shape: single-tier achievements
   wherever a 3-rung ladder isn't essential, one ladder only where a real
   progression arc earns the extra reward slots. 16 of the 18 free ids are
   spent below (1 item + 15 familiars); `broodmite`/`sporemother` are left
   unclaimed for whatever comes next.
   ============================================================ */

// -- Phase 1 leftover: Gargoyle's Vulnerable-marking counter (already the
// unlock_gargoyle threshold at 50) gets one real ladder for continued play
// past unlock — same statKey, same shape as mastery_roomscleared above.
// Reachable by anyone with innateVulnerableChance (Gargoyle) OR any
// vulnerableChance source (Hunter's Mark/Quarry Sigil/Warden's Eye/etc, see
// items.js) — the stat is already bumped from applyOnHitStatuses
// generically, not gated to Gargoyle. This is the one ladder in the batch;
// see the reward-economy note above for why the rest are single-tier.
addTierSet({ baseId:'mastery_vulnerable', name:'Marked for Stone', icon:'🗿',
  category:'Mastery', statKey:'enemiesMarkedVulnerable',
  desc: n => 'Mark ' + n + ' enemies Vulnerable.',
  tiers:[
    { threshold:100, familiarId:'runiccup' },
    { threshold:250, familiarId:'wardpuff' },
    { threshold:500, itemId:'frostflask' },
  ] });

// -- Phase 1 leftover: Synergy A (Ecosystem Set). Synergies are recomputed
// live every recalcPlayerStats, not a persistent counter, so this rides a
// new one-shot stat (ecosystemSetActivations) bumped exactly once per run
// the moment all three attackLayer families are represented — see
// items.js recalcPlayerStats and entities.js's player._ecosystemSetSeen.
// Reachable by any class: the three families (markedForDeath/venomBloom/
// skyfall) are all ordinary POOLS_ALL items, no class restriction.
addAchievement({ id:'synergy_ecosystem', name:'Balance of Nature', icon:'🌿',
  desc:'Have the Ecosystem Set active at once (one item each from the mark, poison, and sky-fall families).',
  category:'Mastery', statKey:'ecosystemSetActivations', threshold:1, familiarId:'bulwarkmoth' });

// -- Phase 2 leftovers: the two new Crypt (5C) bosses, same single-tier
// "Hunter" shape as the twelve `slayer_boss_*` entries earlier in this
// file (Predicate B, bestiarySection:'enemyKills', threshold 5 — bosses
// route through the exact same handleEnemyDeath -> bumpBestiaryCount call
// regular enemies do). Reachable by any class that can reach Floor 5C and
// win the fight.

// -- Phase 2 leftover: one representative regular-enemy achievement for
// Phase 2's new `skirmisher` behavior (DNB Gutter Skirmisher, 4C), same
// single-shot shape slayer_boss_* above uses (Predicate B). Not one
// achievement per new enemy id (there are 10 skirmisher/whiplash ids
// across Phases 1-2's floors) — defs-5.js's own distinct-breadth ladder
// ('exploration_fieldguide', bestiarySection:'enemyKills', distinct:true)
// already rewards discovering/killing every new id at least once for
// free, so a full per-id sweep here would be pure volume without new
// coverage; this one achievement stands in for the behavior family.

// -- Phase 3 leftovers: the two Shrine-region obstacles (thornbush,
// luckcrystal), same single-shot "destroy this obstacle kind" shape as
// the 15-kind objectsDestroyed batch in defs-5.js (Predicate B,
// bestiarySection:'objectsDestroyed', threshold 15 — thornbush only takes
// damage from a bomb blast per its `attackable:false` flag, luckcrystal is
// `destructible:true`, both already route through damageObstacleHit's
// existing bumpBestiaryCount('objectsDestroyed', ...) call, no new call
// site needed).
addAchievement({ id:'exploration_destroy_thornbush', name:'Bramble Clearer', icon:'🌵',
  desc:'Destroy 15 Thorn Bushes.', category:'Exploration', familiarId:'tallystone',
  bestiarySection:'objectsDestroyed', bestiaryId:'thornbush', threshold:15 });
addAchievement({ id:'exploration_destroy_luckcrystal', name:'Crystal Cracker', icon:'🍀',
  desc:'Destroy 15 Luck Crystals.', category:'Exploration', familiarId:'poppingfungus',
  bestiarySection:'objectsDestroyed', bestiaryId:'luckcrystal', threshold:15 });

// -- Phase 4 leftovers: Arcade room content beyond the visit ladder above.
// Three new stats (see logic.js statDefaults), all bumped at the real
// feed/use sites in shop.js. Reachable by any class — Arcade rooms and
// their fixtures carry no class restriction.
addAchievement({ id:'arcade_fillies_fed', name:'Filly Whisperer', icon:'🎠',
  desc:'Feed Arcade fillies 75 times total.', category:'Miscellaneous', familiarId:'twinflame',
  statKey:'arcadeFilliesFed', threshold:75 });
addAchievement({ id:'arcade_machines_used', name:'Machine Regular', icon:'🕹️',
  desc:'Use Arcade machines 50 times total.', category:'Miscellaneous', familiarId:'shadowtwin',
  statKey:'arcadeMachinesUsed', threshold:50 });
// a specific "reached a filly's capstone reward" achievement — fires the
// first time ANY single filly's own fedCount crosses its capstone and
// filly.done flips true (see shop.js feedArcadeFilly); threshold 1 since
// this celebrates the first capstone, not a grind ladder.
addAchievement({ id:'arcade_filly_capstone', name:'Best Friends', icon:'💖',
  desc:"Satisfy an Arcade filly all the way to its final gift.", category:'Miscellaneous',
  statKey:'arcadeFillyCapstonesReached', threshold:1, familiarId:'fetchhound' });

// -- New general meta-progression (Phase 5b).
// A "no shop" challenge run — bespoke trigger (Predicate D), same shape as
// onehearted/challenge_onehearted_flawless just above recordWin's other
// checks (see logic.js). player.visitedShopThisRun is set the moment the
// player first steps into a shop room this run (game.js enterRoom) and
// checked once at the win.
addAchievement({ id:'challenge_frugal_run', name:'Not a Single Coin Spent', icon:'🪙',
  desc:'Win a run without ever entering a Shop.', category:'Challenge', familiarId:'tidymole' });

// Phase 5a's three orphaned stats (fireRingHits/changelingMinionsSummoned/
// turretsBuilt — tracked since Phase 5a but deliberately given no
// achievement of their own there, see defs-1.js's comment above
// unlock_changedling, because using them to gate their OWN class's unlock
// would be circular). Now that Changedling/Changeling Queen/Engineer Pony
// are each unlockable through an ordinary universal stat instead, these
// three make fine class-flavoured single-tier MASTERY achievements for
// continued play once a player already owns that class — exactly what
// that comment flagged them as "still available for". Single-class-only
// stats are the norm for this shape (see the windigo/kelpie/breezie
// signature-attack achievements under 1b above), not a reachability
// problem: the class must already be unlocked (via its own achievement,
// above), then these reward playing it.
addAchievement({ id:'mastery_firering', name:'Ever-Smouldering', icon:'🔥',
  desc:"Land 1000 hits with the Changedling's fire ring.", category:'Mastery', familiarId:'ragefang',
  statKey:'fireRingHits', threshold:1000 });
addAchievement({ id:'mastery_changelingsummons', name:'Hive Call', icon:'👑',
  desc:'Summon 200 changeling minions with the Changeling Queen.', category:'Mastery', familiarId:'bloodhalo',
  statKey:'changelingMinionsSummoned', threshold:200 });
addAchievement({ id:'mastery_turretsbuilt', name:'Assembly Line', icon:'🔧',
  desc:'Build 200 turrets with the Engineer Pony.', category:'Mastery', familiarId:'scarabofwoe',
  statKey:'turretsBuilt', threshold:200 });

/* ---------------------------------------------------------------
   Lookup index. bumpStat and bumpBestiaryCount used to linearly scan
   ALL of ACHIEVEMENTS on every single call — and bumpBestiaryCount
   fires on every enemy death, so at ~850 achievements that was ~850
   iterations per kill. These maps pre-group the achievements by the
   thing that could unlock them, so the hot paths only ever walk the
   handful that actually watch the key that just moved. Same sets a
   scan would produce, just without the scan.

   Built in one pass right here, then kept up to date incrementally by
   addAchievement (see _achvIndexReady at the top of the file), so
   later slices can keep declaring achievements above this line —
   or below it — without touching any of this.
   --------------------------------------------------------------- */

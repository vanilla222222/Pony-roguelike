'use strict';
// achievements/defs-5.js — split from achievements.js (part 5/6).

/* ---------------------------------------------------------------
   ==== MASTERY — stat-ladder achievements (Slice 3 of achievements-500) ====
   15 three-rung ladders (45 achievements) over lifetime stat counters
   that already exist in ensureUnlockShape's statDefaults and are
   already written by bumpStat call sites elsewhere — no tracking code
   was added for these. Predicate A (statKey + threshold) throughout,
   declared via Slice 1's addTierSet, which appends ' I'/' II'/' III'
   to each name and mints ids as '<baseId>_t1'/'_t2'/'_t3'.

   Thresholds are calibrated against the pre-existing single-shot
   achievements on the same statKey: tier 1 sits at or just under the
   lowest existing threshold (so a ladder always has an early rung),
   tier 2 lands mid-to-top of the existing spread, tier 3 goes past
   everything that already exists on that key.

   Rewards: tiers 1 and 2 are trophies only. Tier 3 grants exactly one
   item/trinket/familiar, each a previously unclaimed id from
   data.js's ITEMS/TRINKETS/FAMILIAR_TYPES — no id is shared with any
   other achievement in this file, nor between these 15.
   --------------------------------------------------------------- */
addTierSet({ baseId:'mastery_meleekills', name:'Hoof to Hoof', icon:'🗡️',
  category:'Mastery', statKey:'meleeKills',
  desc: n => 'Reach ' + n + ' enemies defeated with melee attacks.',
  tiers:[
    { threshold:150, itemId:'masterytrophy_meleekills_t1' },
    { threshold:600, itemId:'masterytrophy_meleekills_t2' },
    { threshold:1500, itemId:'hardhitter' },
  ] });
addTierSet({ baseId:'mastery_rangedkills', name:'Long Shot', icon:'🏹',
  category:'Mastery', statKey:'rangedKills',
  desc: n => 'Reach ' + n + ' enemies defeated with ranged attacks.',
  tiers:[
    { threshold:150, itemId:'masterytrophy_rangedkills_t1' },
    { threshold:600, itemId:'masterytrophy_rangedkills_t2' },
    { threshold:1500, itemId:'quickdraw' },
  ] });
addTierSet({ baseId:'mastery_critslanded', name:'Precision', icon:'✴️',
  category:'Mastery', statKey:'critsLanded',
  desc: n => 'Reach ' + n + ' critical hits landed.',
  tiers:[
    { threshold:75, itemId:'masterytrophy_critslanded_t1' },
    { threshold:400, itemId:'masterytrophy_critslanded_t2' },
    { threshold:1200, trinketId:'silvermirror' },
  ] });
addTierSet({ baseId:'mastery_bombsplaced', name:'Demolition Habit', icon:'💣',
  category:'Mastery', statKey:'bombsPlaced',
  desc: n => 'Reach ' + n + ' bombs placed.',
  tiers:[
    { threshold:75, itemId:'masterytrophy_bombsplaced_t1' },
    { threshold:300, itemId:'masterytrophy_bombsplaced_t2' },
    { threshold:900, itemId:'bombsatchel' },
  ] });
addTierSet({ baseId:'mastery_shotsfired', name:'Trigger Discipline', icon:'🔫',
  category:'Mastery', statKey:'shotsFired',
  desc: n => 'Reach ' + n + ' shots fired.',
  tiers:[
    { threshold:750, itemId:'masterytrophy_shotsfired_t1' },
    { threshold:3000, itemId:'masterytrophy_shotsfired_t2' },
    { threshold:10000, trinketId:'stormprism' },
  ] });
addTierSet({ baseId:'mastery_obstaclesdestroyed', name:'Wrecking Crew', icon:'🪨',
  category:'Mastery', statKey:'obstaclesDestroyed',
  desc: n => 'Reach ' + n + ' obstacles destroyed.',
  tiers:[
    { threshold:100, itemId:'masterytrophy_obstaclesdestroyed_t1' },
    { threshold:400, itemId:'masterytrophy_obstaclesdestroyed_t2' },
    { threshold:1200, itemId:'bouldershoulder' },
  ] });
addTierSet({ baseId:'mastery_enemiesfrozen', name:'Deep Freeze', icon:'❄️',
  category:'Mastery', statKey:'enemiesFrozen',
  desc: n => 'Reach ' + n + ' enemies frozen.',
  tiers:[
    { threshold:25, itemId:'masterytrophy_enemiesfrozen_t1' },
    { threshold:100, itemId:'masterytrophy_enemiesfrozen_t2' },
    { threshold:300, itemId:'frostbite' },
  ] });
addTierSet({ baseId:'mastery_turretsdestroyed', name:'Sentry Breaker', icon:'🛠️',
  category:'Mastery', statKey:'turretsDestroyed',
  desc: n => 'Reach ' + n + ' turrets destroyed.',
  tiers:[
    { threshold:15, itemId:'masterytrophy_turretsdestroyed_t1' },
    { threshold:75, itemId:'masterytrophy_turretsdestroyed_t2' },
    { threshold:250, trinketId:'fadedgauntlet' },
  ] });
addTierSet({ baseId:'mastery_bombbarrels', name:'Chain Reaction', icon:'🛢️',
  category:'Mastery', statKey:'bombBarrelsDetonated',
  desc: n => 'Reach ' + n + ' bomb barrels detonated.',
  tiers:[
    { threshold:15, itemId:'masterytrophy_bombbarrels_t1' },
    { threshold:75, itemId:'masterytrophy_bombbarrels_t2' },
    { threshold:250, trinketId:'emberbauble' },
  ] });
addTierSet({ baseId:'mastery_swarmerdnb', name:'Swarm Control', icon:'🐝',
  category:'Mastery', statKey:'swarmerdnbKilled',
  desc: n => 'Reach ' + n + ' Swarmer DNBs defeated.',
  tiers:[
    { threshold:40, itemId:'masterytrophy_swarmerdnb_t1' },
    { threshold:200, itemId:'masterytrophy_swarmerdnb_t2' },
    { threshold:700, trinketId:'wildcrown' },
  ] });
addTierSet({ baseId:'mastery_activeitemuses', name:'Button Masher', icon:'🔋',
  category:'Mastery', statKey:'activeItemUses',
  desc: n => 'Reach ' + n + ' active item uses.',
  tiers:[
    { threshold:75, itemId:'masterytrophy_activeitemuses_t1' },
    { threshold:300, itemId:'masterytrophy_activeitemuses_t2' },
    { threshold:900, itemId:'chronoshard' },
  ] });
addTierSet({ baseId:'mastery_itemscollected', name:'Packrat', icon:'🎒',
  category:'Mastery', statKey:'itemsCollected',
  desc: n => 'Reach ' + n + ' items collected.',
  tiers:[
    { threshold:40, itemId:'masterytrophy_itemscollected_t1' },
    { threshold:150, itemId:'masterytrophy_itemscollected_t2' },
    { threshold:450, itemId:'junkyardmagnet' },
  ] });
addTierSet({ baseId:'mastery_trinketsequipped', name:'Charm Collector', icon:'🔩',
  category:'Mastery', statKey:'trinketsEquipped',
  desc: n => 'Reach ' + n + ' trinkets equipped.',
  tiers:[
    { threshold:8, itemId:'masterytrophy_trinketsequipped_t1' },
    { threshold:30, itemId:'masterytrophy_trinketsequipped_t2' },
    { threshold:90, trinketId:'crackedlocket' },
  ] });
addTierSet({ baseId:'mastery_familiarscollected', name:'Menagerie', icon:'🐾',
  category:'Mastery', statKey:'familiarsCollected',
  desc: n => 'Reach ' + n + ' familiars collected.',
  tiers:[
    { threshold:8, itemId:'masterytrophy_familiarscollected_t1' },
    { threshold:25, itemId:'masterytrophy_familiarscollected_t2' },
    { threshold:70, familiarId:'goldenhare' },
  ] });
addTierSet({ baseId:'mastery_roomscleared', name:'Room Sweeper', icon:'🚪',
  category:'Mastery', statKey:'roomsCleared',
  desc: n => 'Reach ' + n + ' rooms cleared.',
  tiers:[
    { threshold:150, itemId:'masterytrophy_roomscleared_t1' },
    { threshold:500, itemId:'masterytrophy_roomscleared_t2' },
    { threshold:1500, itemId:'swiftstep' },
  ] });

/* ---------------------------------------------------------------
   ==== EXPLORATION — bestiary breadth + room-type/dedication ladders (Slice 4 of achievements-500) ====
   39 achievements in four buckets:

     A. 15 single-shot "destroy this obstacle kind" achievements
        (Predicate B — bestiarySection:'objectsDestroyed' + bestiaryId),
        one per OBSTACLES kind that can ACTUALLY be destroyed. No rewards,
        mirroring Slice 2's high-volume-tail policy.
     B. 3 breadth ladders (Predicate C — bestiarySection + distinct:true).
     C. 3 room-type visit ladders (Predicate A — statKey + threshold).
     D. 2 "dedication" ladders (Predicate A).

   No call site was changed and no new stat key or bestiary bucket was
   added — every predicate here rides on bumpStat / bumpBestiaryCount /
   markBestiarySeen calls that already exist elsewhere.

   Rewards: tiers 1 and 2 of every ladder are trophies only; tier 3
   grants exactly one previously unclaimed item/familiar. Bucket A
   grants nothing at all. Trinkets were deliberately avoided — they are
   the scarcest free pool (44 left) and later slices need the headroom.
   --------------------------------------------------------------- */

/* ---- A. per-obstacle-kind destruction (Predicate B) ----
   Only the 15 kinds that can actually reach the objectsDestroyed
   bucket: OBSTACLES entries with destructible:true (bombable) or
   attackable:true (shootable). The other 9 kinds — hardrock, pit,
   tallhardrock, cactus, spike, spiketrap, movingspike, sandtrap, mud —
   are permanent or purely-walkable hazards that nothing ever destroys,
   so an achievement on them would be permanently unearnable. */
addAchievement({ id:'exploration_destroy_rock', name:'Rock Breaker', icon:'💥',
  desc:'Destroy 15 Rocks.', category:'Exploration', itemId:'explorationtrophy_rock',
  bestiarySection:'objectsDestroyed', bestiaryId:'rock', threshold:15 });
addAchievement({ id:'exploration_destroy_tallrock', name:'Tall Order', icon:'💥',
  desc:'Destroy 15 Tall Rocks.', category:'Exploration', itemId:'explorationtrophy_tallrock',
  bestiarySection:'objectsDestroyed', bestiaryId:'tallrock', threshold:15 });
addAchievement({ id:'exploration_destroy_yellowfire', name:'Flame Douser', icon:'💥',
  desc:'Douse 15 Yellow Fires.', category:'Exploration', itemId:'explorationtrophy_yellowfire',
  bestiarySection:'objectsDestroyed', bestiaryId:'yellowfire', threshold:15 });
addAchievement({ id:'exploration_destroy_redfire', name:'Ember Douser', icon:'💥',
  desc:'Douse 15 Red Fires.', category:'Exploration', itemId:'explorationtrophy_redfire',
  bestiarySection:'objectsDestroyed', bestiaryId:'redfire', threshold:15 });
addAchievement({ id:'exploration_destroy_spikedrock', name:'Spike Splitter', icon:'💥',
  desc:'Destroy 15 Spiked Rocks.', category:'Exploration', itemId:'explorationtrophy_spikedrock',
  bestiarySection:'objectsDestroyed', bestiaryId:'spikedrock', threshold:15 });
addAchievement({ id:'exploration_destroy_tintedrock', name:'Tint Hunter', icon:'💥',
  desc:'Destroy 15 Tinted Rocks.', category:'Exploration', itemId:'explorationtrophy_tintedrock',
  bestiarySection:'objectsDestroyed', bestiaryId:'tintedrock', threshold:15 });
addAchievement({ id:'exploration_destroy_turretn', name:'North Turret Buster', icon:'💥',
  desc:'Destroy 15 North Turrets.', category:'Exploration', itemId:'explorationtrophy_turretn',
  bestiarySection:'objectsDestroyed', bestiaryId:'turretn', threshold:15 });
addAchievement({ id:'exploration_destroy_turrete', name:'East Turret Buster', icon:'💥',
  desc:'Destroy 15 East Turrets.', category:'Exploration', itemId:'explorationtrophy_turrete',
  bestiarySection:'objectsDestroyed', bestiaryId:'turrete', threshold:15 });
addAchievement({ id:'exploration_destroy_turrets', name:'South Turret Buster', icon:'💥',
  desc:'Destroy 15 South Turrets.', category:'Exploration', itemId:'explorationtrophy_turrets',
  bestiarySection:'objectsDestroyed', bestiaryId:'turrets', threshold:15 });
addAchievement({ id:'exploration_destroy_turretw', name:'West Turret Buster', icon:'💥',
  desc:'Destroy 15 West Turrets.', category:'Exploration', itemId:'explorationtrophy_turretw',
  bestiarySection:'objectsDestroyed', bestiaryId:'turretw', threshold:15 });
addAchievement({ id:'exploration_destroy_turretplus', name:'Plus Turret Buster', icon:'💥',
  desc:'Destroy 15 Plus Turrets.', category:'Exploration', itemId:'explorationtrophy_turretplus',
  bestiarySection:'objectsDestroyed', bestiaryId:'turretplus', threshold:15 });
addAchievement({ id:'exploration_destroy_turretx', name:'X Turret Buster', icon:'💥',
  desc:'Destroy 15 X Turrets.', category:'Exploration', itemId:'explorationtrophy_turretx',
  bestiarySection:'objectsDestroyed', bestiaryId:'turretx', threshold:15 });
addAchievement({ id:'exploration_destroy_turrettarget', name:'Targeting Turret Buster', icon:'💥',
  desc:'Destroy 15 Targeting Turrets.', category:'Exploration', itemId:'explorationtrophy_turrettarget',
  bestiarySection:'objectsDestroyed', bestiaryId:'turrettarget', threshold:15 });
addAchievement({ id:'exploration_destroy_bombbarrel', name:'Barrel Blaster', icon:'💥',
  desc:'Destroy 15 Bomb Barrels.', category:'Exploration', itemId:'explorationtrophy_bombbarrel',
  bestiarySection:'objectsDestroyed', bestiaryId:'bombbarrel', threshold:15 });
addAchievement({ id:'exploration_destroy_pushablebombbarrel', name:'Push and Boom', icon:'💥',
  desc:'Destroy 15 Pushable Bomb Barrels.', category:'Exploration', itemId:'explorationtrophy_pushablebombbarrel',
  bestiarySection:'objectsDestroyed', bestiaryId:'pushablebombbarrel', threshold:15 });

/* ---- B. bestiary breadth ladders (Predicate C — distinct:true) ----
   objectsSeen tops out at 24 (the whole OBSTACLES table), so its top
   rung is a true completion. The two enemy sections share a 265-id
   space (220 enemies + 34 bosses + 11 superbosses): the kill ladder
   goes all the way to 265, the death ladder deliberately does NOT —
   being killed by 265 different things is not a realistic ask. */
addTierSet({ baseId:'exploration_objectsseen', name:'Cartographer', icon:'🗺️',
  category:'Exploration', bestiarySection:'objectsSeen', distinct:true,
  desc: n => 'Encounter ' + n + ' different kinds of obstacle.',
  tiers:[
    { threshold:8, familiarId:'mapmite' },
    { threshold:16, familiarId:'atlasbeetle' },
    { threshold:24, itemId:'starlitcompass' },
  ] });
addTierSet({ baseId:'exploration_fieldguide', name:'Field Guide', icon:'📖',
  category:'Exploration', bestiarySection:'enemyKills', distinct:true,
  desc: n => 'Defeat ' + n + ' different kinds of foe at least once.',
  tiers:[
    { threshold:80, familiarId:'guidefinch' },
    { threshold:180, familiarId:'tallyowl' },
    { threshold:265, itemId:'allseeingeye' },
  ] });
addTierSet({ baseId:'exploration_causeofdeath', name:'Cause of Death', icon:'☠️',
  category:'Exploration', bestiarySection:'enemyDeaths', distinct:true,
  desc: n => 'Be defeated by ' + n + ' different kinds of foe.',
  tiers:[
    { threshold:10, familiarId:'mournmoth' },
    { threshold:30, familiarId:'revenantsprite' },
    { threshold:60, itemId:'secondwind' },
  ] });

/* ---- C. room-type visit ladders (Predicate A) ----
   These three keys are written by game.js's enterRoom. Thresholds are
   anchored on the pre-existing single-shot achievements on the same
   key (petshops 5/20/35/60, curse 5/20/35/60, crystal 5/15/25/40),
   following Slice 3's rule: tier 1 at the lowest existing rung, tier 2
   mid-band, tier 3 clearly past everything already there.

   The four sibling room keys — sacrificeSpikesTriggered, vaultsOpened,
   challengeRoomsCompleted, sombraDealsTaken — are deliberately left
   alone; see the audit. */
addTierSet({ baseId:'exploration_petshops', name:'Pet Shop Regular', icon:'🐾',
  category:'Exploration', statKey:'petshopsVisited',
  desc: n => 'Visit ' + n + ' Pet Shops.',
  tiers:[
    { threshold:5, familiarId:'kennelpup' },
    { threshold:30, familiarId:'adoptedwhelp' },
    { threshold:100, familiarId:'goldenfirefly' },
  ] });
addTierSet({ baseId:'exploration_curserooms', name:'Curse Seeker', icon:'😈',
  category:'Exploration', statKey:'curseRoomsVisited',
  desc: n => 'Visit ' + n + ' Cursed Rooms.',
  tiers:[
    { threshold:5, familiarId:'hexmite' },
    { threshold:30, familiarId:'cursedimp' },
    { threshold:100, itemId:'cursedhalo' },
  ] });
addTierSet({ baseId:'exploration_crystalrooms', name:'Crystal Pilgrim', icon:'💎',
  category:'Exploration', statKey:'crystalRoomsVisited',
  desc: n => 'Visit ' + n + ' Crystal Rooms.',
  tiers:[
    { threshold:5, familiarId:'geodemote' },
    { threshold:25, familiarId:'crystalwarden' },
    { threshold:75, itemId:'prismveil' },
  ] });
/* Star Rooms — the fourth key written by that same enterRoom chain, added
   with the room type itself. Thresholds mirror the crystal ladder (5/25/75)
   since both are "special room you sometimes get offered a choice in", and
   there are no pre-existing single-shot rungs on this key beyond the 5/15
   pair added alongside it in section 8b. The top tier takes the last
   unclaimed shopDiscount kind ('star'); the lower two were reward-free
   until the expand-everything pass, and now draw one previously-unclaimed
   locked pill colour / trinket from the new pools (see 8b's comment). */
addTierSet({ baseId:'exploration_starrooms', name:'Star Pilgrim', icon:'🌟',
  category:'Exploration', statKey:'starRoomsVisited',
  desc: n => 'Visit ' + n + ' Star Rooms.',
  tiers:[
    { threshold:5, pillColorId:'iridescent' },
    { threshold:25, trinketId:'lightlattice' },
    { threshold:75, shopDiscount:'star' },
  ] });
/* Reroll Altar — shop.js's per-shop-visit-resetting reroll fixture. It is a
   shop stat, not a room stat, so it sits in Miscellaneous with the rest of
   the shop ladders rather than in Exploration. Scale is anchored on the
   shopPurchases rungs (25/60/120): a reroll is cheaper and more repeatable
   than a purchase early on but the cost curve climbs inside every single
   shop visit, so 10/40/120 lands in the same lifetime band. Each rung now
   carries one previously-unclaimed locked trinket / item / familiar. */
addTierSet({ baseId:'misc_rerollaltar', name:'Altar of Second Chances', icon:'🔄',
  category:'Miscellaneous', statKey:'rerollAltarUses',
  desc: n => 'Use a shop Reroll Altar ' + n + ' times.',
  tiers:[
    { threshold:10, trinketId:'airylocket' },
    { threshold:40, itemId:'hallowedsignet' },
    { threshold:120, familiarId:'hearthcell' },
  ] });

/* ---- D. dedication ladders (Predicate A) ----
   totalPlaytime is in SECONDS (main.js bumps it with
   Math.round(game.runElapsed) on every death and every win), so the
   thresholds below are 1 / 5 / 20 hours. runsStarted is bumped once
   per run in game.js.

   NOTE for later slices: deepestFloor and fastestWinSeconds look like
   obvious Exploration material and are NOT usable. Both are written
   exclusively by setStatMax / setStatMin, and neither of those checks
   achievements — only bumpStat does. A statKey achievement on either
   would be silently unearnable forever. */
addTierSet({ baseId:'exploration_playtime', name:'Long Haul', icon:'⏳',
  category:'Exploration', statKey:'totalPlaytime',
  desc: n => 'Play for ' + (n / 3600) + (n === 3600 ? ' hour' : ' hours') + ' in total.',
  tiers:[
    { threshold:3600, familiarId:'hourglassjar' },
    { threshold:18000, familiarId:'vigilbloom' },
    { threshold:72000, itemId:'brokenwatch' },
  ] });
addTierSet({ baseId:'exploration_runsstarted', name:'Again and Again', icon:'🔁',
  category:'Exploration', statKey:'runsStarted',
  desc: n => 'Start ' + n + ' runs.',
  tiers:[
    { threshold:25, familiarId:'startersatchel' },
    { threshold:100, familiarId:'loopwhirl' },
    { threshold:300, itemId:'ironwill' },
  ] });

/* ---------------------------------------------------------------
   ==== COLLECTION — distinct-breadth ladders over seen items/trinkets/familiars/stars/pills (Slice 5 of achievements-500) ====
   14 achievements, all Predicate C (bestiarySection + distinct breadth),
   over the five "seen" bestiary buckets:

     A. seenItems     — 5-tier ladder (pool: 362 ITEMS)
     B. seenTrinkets  — 4-tier ladder (pool: 178 TRINKETS)
     C. seenFamiliars — 3-tier ladder (pool: 94 FAMILIAR_TYPES)
     D. seenStars     — 1 achievement, full completion (pool: 12 STAR_TYPES)
     E. seenPills     — 1 achievement, full completion (pool: 60 PILL_COLORS)

   D and E are plain addAchievement calls rather than ladders: their pools
   are small enough that a single "collect them all" rung is the whole
   story.

   No call site was changed and no new bestiary bucket was added — every
   predicate here rides on markBestiarySeen calls that already exist
   (items.js applyItemToPlayer / equipTrinket / addFamiliar, combat.js
   grantPickupEffect's 'star' and 'pill' cases).

   Rewards: only the FINAL rung of each ladder plus the two singles grant
   anything — 5 rewards across 14 achievements, every other tier a trophy.
   Trinkets were deliberately avoided again: they remain the scarcest free
   pool (44 left) and the Challenge slice still needs the headroom.
   --------------------------------------------------------------- */

/* ---- A. seenItems (pool 362) ---- */
addTierSet({ baseId:'collection_items', name:'Compendium', icon:'📚',
  category:'Collection', bestiarySection:'seenItems', distinct:true,
  desc: n => 'Discover ' + n + ' different items.',
  tiers:[
    { threshold:25, familiarId:'curiomite' },
    { threshold:75, familiarId:'tomefinch' },
    { threshold:150, familiarId:'codexbeetle' },
    { threshold:250, familiarId:'archiveowl' },
    { threshold:340, itemId:'polishedscroll' },
  ] });

/* ---- B. seenTrinkets (pool 178) ---- */
addTierSet({ baseId:'collection_trinkets', name:'Trinket Archivist', icon:'🔩',
  category:'Collection', bestiarySection:'seenTrinkets', distinct:true,
  desc: n => 'Equip ' + n + ' different trinkets.',
  tiers:[
    { threshold:15, familiarId:'charmmite' },
    { threshold:45, familiarId:'keepsakejar' },
    { threshold:90, familiarId:'relicwarden' },
    { threshold:150, itemId:'gildedtrinket' },
  ] });

/* ---- C. seenFamiliars (pool 94) ---- */
addTierSet({ baseId:'collection_familiars', name:'Beast Befriender', icon:'🐾',
  category:'Collection', bestiarySection:'seenFamiliars', distinct:true,
  desc: n => 'Collect ' + n + ' different familiars.',
  tiers:[
    { threshold:12, familiarId:'pactmite' },
    { threshold:35, familiarId:'packleveret' },
    { threshold:70, familiarId:'sacredhare' },
  ] });

/* ---- D/E. seenStars and seenPills — pools of 12 and 10, so one
   completion rung each rather than a ladder. ---- */
// threshold deliberately left at 12 now that STAR_TYPES holds 37 — the extra
// 25 are themselves achievement rewards (see the Stars category below), so
// requiring all of them would gate this behind 25 other achievements
addAchievement({ id:'collection_stars', name:'Constellation', icon:'⭐',
  desc:'Discover 12 different stars.', category:'Collection',
  bestiarySection:'seenStars', distinctThreshold:12, itemId:'moonshard' });
// same reasoning as the star threshold above: left at 60 now that PILL_COLORS
// holds 100 — the extra 40 are `locked:true` achievement rewards themselves,
// and the 60 always-available colors still make this exactly completable
addAchievement({ id:'collection_pills', name:'Full Spectrum', icon:'💊',
  desc:'Sample all 60 pill colors.', category:'Collection',
  bestiarySection:'seenPills', distinctThreshold:60, itemId:'crystalflask' });

/* ==== CHALLENGE — event-based feats, hand-wired call sites (Slice 6 of achievements-500) ====

   Every one of these is Predicate D: no statKey, no bestiarySection, so
   nothing unlocks them automatically. Each has exactly one hand-written
   unlockAchievement() call site, listed below — if you rename an id here
   you MUST rename it there too, or the achievement becomes unearnable.

     challenge_wins_8classes / challenge_wins_allclasses
       -> recordWin(), just below this file's triplethreat check
     challenge_floors_nodamage_4 / _6
       -> game.js descend(), beside the unlock_zebra check
     challenge_bossstreak_2 / _4 / _7
       -> game.js onBossDefeated(), beside the untouchable check
          (streak counter: entities.js Player.bossRoomsNoDamageStreak)
     challenge_onehearted_flawless
       -> recordWin(), just below this file's onehearted check
     challenge_flawless_run
       -> game.js onBossDefeated(), in the onetruednb branch
     challenge_speedrun_20min / _12min / _8min
       -> main.js's game.state === 'win' block, beside the
          setStatMin('fastestWinSeconds', ...) record check

   Because they are Predicate D the panel shows "Not yet earned." with no
   progress line, so each desc has to fully describe the feat on its own.  */

addAchievement({ id:'challenge_wins_8classes', name:'Eightfold Champion', icon:'🏆',
  desc:'Win a run with 8 different characters.', category:'Challenge',
  itemId:'gildedhoof' });
addAchievement({ id:'challenge_wins_allclasses', name:'Every Last Pony', icon:'👑',
  desc:'Win a run with all 20 characters.', category:'Challenge',
  trinketId:'coralcrown' });

addAchievement({ id:'challenge_floors_nodamage_4', name:'Spotless Descent', icon:'🛡️',
  desc:'Clear 4 floors in a row without taking any damage.', category:'Challenge',
  itemId:'guardianhalo' });
addAchievement({ id:'challenge_floors_nodamage_6', name:'Immaculate Descent', icon:'🕊️',
  desc:'Clear 6 floors in a row without taking any damage.', category:'Challenge',
  itemId:'seraphshield' });

addAchievement({ id:'challenge_bossstreak_2', name:'Twice Untouched', icon:'✨',
  desc:'Defeat 2 superbosses in a row without being hit in their boss rooms.', category:'Challenge',
  familiarId:'ironshrew' });
addAchievement({ id:'challenge_bossstreak_4', name:'Four Times Untouched', icon:'💫',
  desc:'Defeat 4 superbosses in a row without being hit in their boss rooms.', category:'Challenge',
  itemId:'wingedgrace' });
addAchievement({ id:'challenge_bossstreak_7', name:'Not a Single Scratch', icon:'🌠',
  desc:"Defeat 7 superbosses in a row without being hit in their boss rooms — every superboss of a full run, untouched.", category:'Challenge',
  trinketId:'radiantring' });

addAchievement({ id:'challenge_onehearted_flawless', name:'Glass Heart', icon:'💔',
  desc:'Win a run with only one red heart of maximum health, without ever taking damage.', category:'Challenge',
  trinketId:'crackedseal' });
addAchievement({ id:'challenge_flawless_run', name:'Flawless Legend', icon:'🌟',
  desc:'Defeat The One True DNB on Floor 13 without taking a single point of damage the whole run.', category:'Challenge',
  trinketId:'ancienthoofguard' });

addAchievement({ id:'challenge_speedrun_20min', name:'Brisk Escape', icon:'⏱️',
  desc:'Win a run in under 20 minutes.', category:'Challenge',
  itemId:'quickstepcharm' });
addAchievement({ id:'challenge_speedrun_12min', name:'Record Pace', icon:'⏲️',
  desc:'Win a run in under 12 minutes.', category:'Challenge',
  itemId:'swiftrecovery' });
addAchievement({ id:'challenge_speedrun_8min', name:'Blur', icon:'⚡',
  desc:'Win a run in under 8 minutes.', category:'Challenge',
  itemId:'speedup' });

/* ---------------------------------------------------------------
   ==== STARS — the 25 new stars' unlock ladder (gameplay update 3) ====

   One achievement per new star in data.js's STAR_TYPES, each granting
   exactly that star via `starId` — the same reward field the four
   superboss stars use, passed straight through by unlockAchievement.

   Deliberately NOT hung off SUPERBOSS_REWARDS: that pool asserts
   length === superbosses × classes, so adding 25 entries to it would
   trip the warning and silently orphan rewards. A plain addAchievement
   with a starId has no such constraint.

   Every predicate here is Predicate A (statKey + threshold) over a
   counter that already exists in ensureUnlockShape's statDefaults and
   is already written by a bumpStat call site elsewhere — no new
   tracking code anywhere in the game. Difficulty is spread on purpose:
   a handful land inside the first few runs (roomsCleared 50, itemsCollected 25),
   most sit in the mid-game, and a few (100 stars used, 3 wins, 600 crits)
   are genuine long-haul goals.
   --------------------------------------------------------------- */
addAchievement({ id:'star_arcturus', name:'Sweeper', icon:'🔶',
  desc:'Clear 50 rooms.', category:'Stars', starId:'arcturus', statKey:'roomsCleared', threshold:50 });
addAchievement({ id:'star_deneb', name:'Second Opinion', icon:'🔄',
  desc:'Collect 25 items.', category:'Stars', starId:'deneb', statKey:'itemsCollected', threshold:25 });
addAchievement({ id:'star_aldebaran', name:'Learn the Hard Way', icon:'🛡️',
  desc:'Die 5 times.', category:'Stars', starId:'aldebaran', statKey:'deaths', threshold:5 });
addAchievement({ id:'star_mizar', name:'Self-Medicated', icon:'💗',
  desc:'Swallow 50 pills.', category:'Stars', starId:'mizar', statKey:'pillsUsed', threshold:50 });
addAchievement({ id:'star_antlia', name:'Key Master', icon:'🧰',
  desc:'Spend 60 keys.', category:'Stars', starId:'antlia', statKey:'keysUsed', threshold:60 });
addAchievement({ id:'star_altair', name:'Hazard Pay', icon:'♻️',
  desc:'Destroy 250 obstacles.', category:'Stars', starId:'altair', statKey:'obstaclesDestroyed', threshold:250 });
addAchievement({ id:'star_capella', name:'Shuffle the Deck', icon:'🎲',
  desc:'Defeat 250 enemies.', category:'Stars', starId:'capella', statKey:'enemiesKilled', threshold:250 });
addAchievement({ id:'star_saiph', name:'Concussive Force', icon:'💥',
  desc:'Place 250 bombs.', category:'Stars', starId:'saiph', statKey:'bombsPlaced', threshold:250 });
addAchievement({ id:'star_alnitak', name:'Every Corner', icon:'🗺️',
  desc:'Discover 25 secret rooms.', category:'Stars', starId:'alnitak', statKey:'secretRoomsFound', threshold:25 });
addAchievement({ id:'star_procyon', name:'Star Gazer', icon:'❤️',
  desc:'Use 25 stars.', category:'Stars', starId:'procyon', statKey:'starsUsed', threshold:25 });
addAchievement({ id:'star_regulus', name:'Gilded Habit', icon:'🎁',
  desc:'Open 25 gold chests.', category:'Stars', starId:'regulus', statKey:'goldChestsOpened', threshold:25 });
addAchievement({ id:'star_spica', name:'Regular Customer', icon:'🍀',
  desc:'Buy 60 things from shops.', category:'Stars', starId:'spica', statKey:'shopPurchases', threshold:60 });

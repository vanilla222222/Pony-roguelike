'use strict';
// achievements/defs-1.js — split from achievements.js (part 1/6).
addAchievement({ id:'unlock_batpony', name:'Creature of the Night', icon:'🦇',
  desc:'Defeat any boss.', category:'Characters', classId:'batpony' });
addAchievement({ id:'unlock_zebra', name:'Untamed Stripes', icon:'🦓',
  desc:'Clear 2 floors in a row without taking damage.', category:'Characters', classId:'zebra' });
addAchievement({ id:'unlock_hypogriff', name:'Sky-Iron Wings', icon:'🦅',
  desc:'Defeat Polish DNB on Floor 6.', category:'Characters', classId:'hypogriff' });
addAchievement({ id:'unlock_seapony', name:'Tide Unbroken', icon:'🌊',
  desc:'Clear Floors 1-6 without taking any damage.', category:'Characters', classId:'seapony' });
addAchievement({ id:'unlock_ponybot', name:'Ghost in the Machine', icon:'🤖',
  desc:'Die to a cactus.', category:'Characters', classId:'ponybot' });
addAchievement({ id:'unlock_griffin', name:'Talon and Feather', icon:'🦢',
  desc:'Defeat Pineapple Gatorade DNB on Floor 9A.', category:'Characters', classId:'griffin' });
addAchievement({ id:'unlock_kirin', name:'Fury Unleashed', icon:'🔥',
  desc:'Defeat Israel DNB on Floor 9B.', category:'Characters', classId:'kirin' });
addAchievement({ id:'unlock_dragon', name:'Wings of Ember', icon:'🐉',
  desc:'Defeat Tyrone, the DNB King on Floor 7.', category:'Characters', classId:'dragon' });
addAchievement({ id:'unlock_windigo', name:'Bitter Chill', icon:'❄️',
  desc:'Freeze 30 enemies.', category:'Characters', classId:'windigo', statKey:'enemiesFrozen', threshold:30 });
addAchievement({ id:'unlock_kelpie', name:'Depths Below', icon:'🌊',
  desc:'Defeat 300 enemies with melee attacks.', category:'Characters', classId:'kelpie', statKey:'meleeKills', threshold:300 });
addAchievement({ id:'unlock_breezie', name:'Featherweight', icon:'🌬️',
  desc:'Defeat 300 enemies with ranged attacks.', category:'Characters', classId:'breezie', statKey:'rangedKills', threshold:300 });
addAchievement({ id:'unlock_dnbpony', name:'Drop the Bass', icon:'🌀',
  desc:'Defeat The One True DNB on Floor 13.', category:'Characters', classId:'dnbpony' });
// The three locked characters below are all gated on lifetime stat ladders
// (statKey + threshold) rather than a scripted boss/floor trigger, exactly
// like Windigo/Kelpie/Breezie above: bumpStat() already fires every watcher
// registered against its key via _ACHV_BY_STATKEY, so these need NO new call
// site anywhere in the codebase. Crystal Pony and Mule are unlocked:true in
// data.js and so get no achievement at all.
addAchievement({ id:'unlock_alicorn', name:'Ascension', icon:'✨',
  desc:'Channel 25 stars.', category:'Characters', classId:'alicorn', statKey:'starsUsed', threshold:25 });
addAchievement({ id:'unlock_changeling', name:'Hive and Hunger', icon:'🪲',
  desc:'Collect 25 familiars.', category:'Characters', classId:'changeling', statKey:'familiarsCollected', threshold:25 });
addAchievement({ id:'unlock_diamonddog', name:'Gems!', icon:'💎',
  desc:'Destroy 100 rocks with bombs.', category:'Characters', classId:'diamonddog', statKey:'rocksBombed', threshold:100 });
addAchievement({ id:'unlock_gargoyle', name:'Marked for Stone', icon:'🗿',
  desc:'Mark 50 enemies Vulnerable.', category:'Characters', classId:'gargoyle', statKey:'enemiesMarkedVulnerable', threshold:50 });
// Phase 5a batch — same statKey+threshold shape as the four above. FIX (see
// audit note): the first draft of these three gated a class's unlock behind
// a stat only that same class's own kit can generate (fireRingHits requires
// innateFireRing, changelingMinionsSummoned requires summonsChangelings,
// turretsBuilt requires canBuildTurrets) — nothing else in the game can ever
// move those counters, so the achievement could never be earned by anyone,
// ever (a permanently-locked class). Every other class-unlock in this file
// (including gargoyle/filly just above) is earnable via ordinary play with
// an ALREADY-unlocked class or item — re-pointed at genuinely universal
// stats to match. fireRingHits/changelingMinionsSummoned/turretsBuilt are
// still tracked (see statDefaults) and still available for a future
// non-unlock achievement/ladder — see Phase 5b.
addAchievement({ id:'unlock_changedling', name:'Half-Changed', icon:'🔥',
  desc:'Defeat 400 enemies.', category:'Characters', classId:'changedling', statKey:'enemiesKilled', threshold:400 });
addAchievement({ id:'unlock_changelingqueen', name:'Hive-Mother', icon:'👑',
  desc:'Collect 40 familiars total.', category:'Characters', classId:'changelingqueen', statKey:'familiarsCollected', threshold:40 });
addAchievement({ id:'unlock_filly', name:'Puppy-Dog Eyes', icon:'🎀',
  desc:'Charm 60 enemies.', category:'Characters', classId:'filly', statKey:'enemiesCharmed', threshold:60 });
addAchievement({ id:'unlock_engineerpony', name:'Turret Tinkerer', icon:'🔧',
  desc:'Place 150 bombs.', category:'Characters', classId:'engineerpony', statKey:'bombsPlaced', threshold:150 });

/* ---- 1b. the three reworked signature attacks (combat.js) ----
   IMPORTANT: these deliberately carry NO `classId` field. `classId` is not a
   "gate this achievement to that class" marker anywhere in this file — it is
   a REWARD key (see TIER_REWARD_KEYS and unlockAchievement, which does
   unlocks[def.classId] = true and toasts "New class unlocked"). Putting
   classId on a second achievement for an already-unlocked class would fire a
   bogus unlock toast, so these are plain statKey ladders that merely LIVE in
   the Characters category and name the class in their flavour text.
   Each key is one the reworked attack itself already bumps, verified in
   combat.js: playerCrystalVolleyAttack -> shotsFired (once per volley, not
   once per shard), updateGreenFireAttack -> rangedKills (on a zone kill),
   shatterRockByShockwave -> obstaclesDestroyed (explicitly NOT rocksBombed,
   see its own comment — that key gates the Diamond Dog unlock above).
   Thresholds slot between the existing rungs on each key. Originally
   reward-free for the same reason as section 8b below; the
   expand-everything pass gave each one a new locked ITEM (still no
   classId — see the warning above, that would fire a bogus unlock). */
addAchievement({ id:'crystalpony_volley', name:'Shardstorm', icon:'💠',
  desc:'Fire 750 ranged shots — the Crystal Pony\'s charged volley counts once per cast.',
  category:'Characters', statKey:'shotsFired', threshold:750, itemId:'wildprism' });
addAchievement({ id:'changeling_greenfire', name:'Green Fire', icon:'🟢',
  desc:'Defeat 500 enemies with ranged attacks — the Changeling\'s fire zone counts every kill it burns down.',
  category:'Characters', statKey:'rangedKills', threshold:500, itemId:'emberbeacon' });
addAchievement({ id:'diamonddog_shockwave', name:'Shockwave', icon:'🐾',
  desc:'Destroy 150 obstacles — the Diamond Dog\'s shockwave shatters rocks without a single bomb.',
  category:'Characters', statKey:'obstaclesDestroyed', threshold:150, itemId:'leadenbracer' });

/* ---------------------------------------------------------------
   2. Superbosses — one achievement per (superboss × character),
   covering all 20 characters across all 15 superbosses (Polish/Tyrone/
   Pineapple/Israel/Algae/Lilac/Plapper/Clapper/NHM/Vanilla DNB/The One
   True DNB, plus the four C-branch bosses Drenched DNB/Brazil DNB/
   Israel DNB Prime/Kirk DNB — see enemies.js's SUPERBOSSES) for
   15 × 20 = 300.
   THE LOAD-BEARING INVARIANT: every one of the 220 gets its own
   exclusive reward, never shared with another achievement — the loop
   below indexes this pool with a strictly-incrementing counter and NO
   modulo, so the pool's length must equal the grid size EXACTLY. Short,
   and the tail achievements silently grant nothing; long, and rewards
   are unreachable. One-to-one, no repeats and no cycling.

   The 300 breaks down as:
     177 trinkets — every trinket that's both locked AND not already
        spoken for by a donation-machine achievement (see donationReward
        in data.js; the supermassive-update-batch trinkets are unlocked
        from the start, so `t.locked` alone already keeps them out of
        this pool without needing their own flag)
     + 7 locked pickup kinds
     + 34 items
     + 72 familiars
     + 12 stars
     = 300.
     (177 = the original 125 + the 52 new C-BRANCH BATCH trinkets;
      34 = the original 4 + 28 items flipped to `locked:true`. The
      familiar and star halves were deliberately NOT grown again —
      both were already fully tapped by the 15 → 20 character
      expansion described below.)

   The item list stayed at 4 on the 15 → 20 character expansion: every
   other `locked` item in data.js's ITEMS is already spoken for by an
   achievement elsewhere in this file, so all 55 new slots had to come
   out of familiars (+47) and stars (+8, i.e. every remaining star).
   Like the late trinkets, some of those familiars/stars are unlocked
   from the start, so their slot is a formality — what the invariant
   below actually protects is that no achievement runs off the END of
   the pool and silently grants nothing.

   The item/familiar/star lists below started as the rewards tied to
   unlocking Dragon/Windigo/Kelpie/Breezie (see data.js). Like everything
   else in this pool, WHICH (boss, character) pair hands out WHICH reward
   is arbitrary/sequential, not curated — the pool is a flat list and the
   grid walks it in order.

   Adding a superboss or a character is a zero-code-change operation
   everywhere else in this file — the nested loop below and the
   Completionist loop below both key off Object.keys(SUPERBOSSES)/
   CLASSES dynamically; only this reward pool's *size* needs to keep
   matching, which is why the trinket half is built from a filter
   instead of a fixed list: new locked, non-donation trinkets join it
   automatically. New familiars do NOT — they have to be named in
   NEW_CLASS_REWARD_FAMILIARS by hand.
   --------------------------------------------------------------- */
const NEW_CLASS_REWARD_ITEMS = ['dragonfirecore', 'frostboundcloak', 'tidecallersscale', 'gustwovenveil',
  // +28 for the four C-branch superbosses (Drenched/Brazil/Israel Prime/Kirk
  // DNB), taking the grid from 11 × 20 = 220 to 15 × 20 = 300. These 28 were
  // flipped from unlocked to `locked:true` in data.js's ITEMS specifically to
  // free up grid slots; like the original four they are gated ONLY by the
  // superboss achievement that grants them (isItemUnlocked reads
  // unlocks.unlockedItems, which unlockAchievement writes for any def with an
  // itemId), and none of them was already spoken for by another achievement.
  // The other 52 of the 80 new slots are brand-new locked trinkets in data.js's
  // C-BRANCH BATCH, which join the pool automatically via the filter below.
  'polishedcloak', 'gildedseal', 'roaringrune', 'forgottenemblem', 'voidwhisper', 'velvetcirclet', 'feraltalisman',
  'rustedcharm', 'jadequill', 'frostedbell', 'runicgauntlet', 'shadowring', 'sapphirelocket', 'gildedring',
  'vividcompass', 'quietorb', 'goldenboots', 'sacredtoken', 'forgottenrune', 'blessedbell', 'ambershard',
  'sacredsash', 'goldenmedallion', 'amberfragment', 'hollowwhistle', 'goldengauntlet', 'sunkenglove', 'wildcloak',
  // +50 for Phase 7a's seven new superbosses (see data/items-5.js's Phase 7a
  // batch). The other 125 of that phase's 175 new grid slots are 60 new locked
  // trinkets (which join the pool automatically via the filter below), 40 new
  // familiars and 25 new stars, named in the two lists after this one.
  'singularityfragment', 'starforgedhoofguard', 'novaanvil', 'coronalance', 'protostarember', 'meteoriteedge',
  'lightsailharness', 'gravitycutter', 'freefallcloak', 'slipstreamrig', 'driftboots', 'fatelensarray',
  'auspiciousorbit', 'wishinghalo', 'lodestarcompass', 'cometdustpouch', 'parallaxsight', 'deadreckoner',
  'transitscope', 'apexcalibration', 'starsightmonocle', 'phaseshiftmantle', 'umbralcloak', 'eventhorizonveil',
  'vacuumshroud', 'nebulaveil', 'pulsargovernor', 'siderealmovement', 'flywheelcore', 'rapidescapement',
  'spinstabilizer', 'accretiondisc', 'gravitonnet', 'tidallock', 'salvagetractor', 'starbreakerdrill',
  'titanfallcharge', 'collapsecatalyst', 'giantsbanealloy', 'siphonarray', 'vitalcondenser', 'redshiftfang',
  'emberdrinkervessel', 'soulcollectorurn', 'reclamationcell', 'cinderharvester', 'stardustreaper', 'cryogenicround',
  'ionbloomcanister', 'shockfrontemitter'];
const NEW_CLASS_REWARD_FAMILIARS = ['cinderwing', 'icedrake', 'ripplefin', 'dustwing',
  // 21 added alongside the 60 new trinkets to take the pool from 84 to the
  // 11 × 15 = 165 grid — see FAMILIAR_TYPES in data.js
  'ashenmite', 'basaltward', 'gildedgnat', 'thistleburr', 'rimemoth', 'slagbeetle', 'duskbramble', 'copperwhorl',
  'emberfinch', 'tidespitter', 'glasswing', 'boulderling', 'sparkfinch', 'thornlobber', 'prismmote', 'cragspitter',
  'mendingmoth', 'almsjar', 'fortunefinch', 'sparkjar', 'balmbloom',
  // +47 for the five classes added alongside Crystal Pony/Mule/Alicorn/
  // Changeling/Diamond Dog, taking the grid from 11 × 15 = 165 to
  // 11 × 20 = 220. See the count breakdown above.
  'vividbeetle', 'stormconstruct', 'stormelemental', 'wildsnail', 'quietotter', 'weatherednymph', 'vividkit', 'sunkennymph',
  'frostedsprite', 'shadowhomunculus', 'sacredsparrow', 'crackedhomunculus', 'mysticpuppet', 'brightsnail', 'frozensylph', 'wildgremlin',
  'hollowgrub', 'roaringhomunculus', 'coralconstruct', 'cursedwisp', 'tangledcrab', 'wovenconstruct', 'quietimp', 'driftingwisp',
  'shatteredsprite', 'sacredhomunculus', 'tangledkit', 'palepup', 'mysticlarva', 'ancientshrew', 'amberhedgehog', 'roaringmole',
  'roaringnymph', 'hollowslug', 'frostednewt', 'shatteredkit', 'duskyhedgehog', 'runicbeetle', 'solarcrab', 'sacredmole',
  'driftinggremlin', 'brightgrub', 'polishedhare', 'thundersentinel', 'palegrub', 'coralsnail', 'ashenmoth',
  // +40 for Phase 7a — see data/familiars-2.js's Phase 7a batch.
  'cometmite', 'ringshepherd', 'gravitonpebble', 'solarflarelet', 'moonlet', 'dustdevilmote',
  'starlingdrone', 'quasarlobber', 'photonwisp', 'orrerygnat', 'nebulaspitter', 'pulsarfinch',
  'voidsniper', 'hearthstar', 'mendingnova', 'mintmote', 'bulliondrifter', 'fortunepulsar',
  'lodestarwisp', 'capacitormoth', 'aegisshard', 'bulwarkmote', 'mirrorplating', 'magpiesatellite',
  'tithecollector', 'scrapjackdaw', 'saplingstar', 'accretionling', 'hungrymote', 'impactorling',
  'novabud', 'flakmite', 'echostar', 'parallaxtwin', 'salvagedrone', 'gleanersprite',
  'direfang', 'lastlighthalo', 'meteorshower', 'sporecluster'];
const NEW_CLASS_REWARD_STARS = ['antares', 'polaris', 'achernar', 'vega',
  // +8 — the whole remainder of STAR_TYPES, which is why the other 47 of the
  // 55 new grid slots had to come out of the familiar list
  'alcyone', 'atlas', 'electra', 'maia', 'merope', 'taygeta', 'pleione', 'celaeno',
  // +25 for Phase 7a — see data/collectibles.js's Phase 7a batch. Unlike the
  // achievement-locked 'Stars' category batch, these ARE grid rewards.
  'vindemiatrix', 'zubeneschamali', 'gacrux', 'acrux', 'shaula', 'sabik',
  'nunki', 'ascella', 'kausaustralis', 'rasalhague', 'alphecca', 'izar',
  'mirfak', 'algol', 'almach', 'hamal', 'menkar', 'diphda',
  'markab', 'scheat', 'algenib', 'enif', 'sadalsuud', 'zosma',
  'alphard'];
// `pendingReward` marks the newrewards-content batch (see data.js): brand-new
// locked trinkets authored as a reward SUPPLY for the reward-less achievements,
// not as grid entries. Without this clause they would join the pool automatically
// and shift every existing (boss × character) reward, breaking the one-to-one
// invariant documented above.
const SUPERBOSS_REWARDS = TRINKET_LIST.filter(t => t.locked && !t.donationReward && !t.pendingReward).map(t => ({ trinketId: t.id })).concat(
  ACHIEVEMENT_PICKUP_KINDS.map(k => ({ pickupKind: k })),
  NEW_CLASS_REWARD_ITEMS.map(id => ({ itemId: id })),
  NEW_CLASS_REWARD_FAMILIARS.map(id => ({ familiarId: id })),
  NEW_CLASS_REWARD_STARS.map(id => ({ starId: id }))
);
let _rewardIndex = 0;
for (const bossId in SUPERBOSSES) {
  const boss = SUPERBOSSES[bossId];
  for (const classId in CLASSES) {
    const cls = CLASSES[classId];
    const achId = 'sb_' + bossId + '_' + classId;
    const reward = SUPERBOSS_REWARDS[_rewardIndex]; // no modulo — every index must be unique, see the count comment above
    _rewardIndex++;
    addAchievement(Object.assign({
      id: achId, name: boss.name + ' — ' + cls.name, icon: boss.icon,
      desc: 'Defeat ' + boss.name + ' while playing as the ' + cls.name + '.',
      category:'Superbosses',
    }, reward));
  }
}
if (_rewardIndex !== SUPERBOSS_REWARDS.length) {
  console.warn('achievements.js: superboss achievement count (' + _rewardIndex + ') does not match the reward pool size (' +
    SUPERBOSS_REWARDS.length + ') — some achievements have no reward, or some rewards are unused. Adjust TRINKET_LIST/ACHIEVEMENT_PICKUP_KINDS/' +
    'NEW_CLASS_REWARD_ITEMS/NEW_CLASS_REWARD_FAMILIARS/NEW_CLASS_REWARD_STARS to match CLASSES × SUPERBOSSES.');
}

/* ---------------------------------------------------------------
   3. Completionist — one per character, not just one overall. Each
   requires defeating every superboss in SUPERBOSSES with that specific
   character — all 11 of them as of the floors 11-13 update (see the
   "gotAll" check in unlockAchievement below, which keys off
   Object.keys(SUPERBOSSES) and so tracks the table automatically).
   They all grant another Champion's Crown, which deliberately
   stacks (see items.js recalcPlayerStats) — every character you
   fully conquer the game with makes the next run a little stronger.
   --------------------------------------------------------------- */
for (const classId in CLASSES) {
  const cls = CLASSES[classId];
  addAchievement({
    id: 'completionist_' + classId, name: 'Completionist: ' + cls.name, icon:'👑',
    desc: 'Defeat every superboss while playing as the ' + cls.name + '.',
    category:'Completionist', itemId:'championscrown',
  });
}

// ---- 4. miscellaneous ----
addAchievement({ id:'deepdiver', name:'Deep Diver', icon:'🕳️',
  desc:'Reach Floor 9.', category:'Miscellaneous', itemId:'voidcharm' });
addAchievement({ id:'secretkeeper', name:'Secret Keeper', icon:'🗝️',
  desc:'Discover 15 secret rooms.', category:'Miscellaneous', itemId:'whisperingkey', statKey:'secretRoomsFound', threshold:15 });
addAchievement({ id:'chestcollector', name:'Chest Collector', icon:'🪙',
  desc:'Open 50 chests.', category:'Miscellaneous', itemId:'midastouch', statKey:'chestsOpened', threshold:50 });
addAchievement({ id:'demolitionexpert', name:'Demolition Expert', icon:'🦺',
  desc:'Destroy 30 rocks with bombs.', category:'Miscellaneous', itemId:'blastplating', statKey:'rocksBombed', threshold:30 });
addAchievement({ id:'untouchable', name:'Untouchable', icon:'🕊️',
  desc:'Defeat a superboss without taking damage during the fight.', category:'Miscellaneous', itemId:'guardianfeather' });
addAchievement({ id:'bigspender', name:'Big Spender', icon:'💰',
  desc:'Spend 300 coins in shops.', category:'Miscellaneous', itemId:'merchantsring', statKey:'coinsSpent', threshold:300 });
addAchievement({ id:'cursedcollector', name:'Iron Stomach', icon:'😈',
  desc:'Open 5 cursed chests.', category:'Miscellaneous', itemId:'cursedlocket', statKey:'cursedChestsOpened', threshold:5 });

// ---- 5. even more miscellaneous — mostly familiars, our first companion-type reward ----
addAchievement({ id:'exterminator', name:'Exterminator', icon:'💀',
  desc:'Defeat 500 enemies.', category:'Miscellaneous', itemId:'marathonscharm', statKey:'enemiesKilled', threshold:500 });
addAchievement({ id:'bosshunter', name:'Boss Hunter', icon:'⚔️',
  desc:'Defeat 20 bosses, superbosses included.', category:'Miscellaneous', itemId:'warhorn', statKey:'bossesKilled', threshold:20 });
addAchievement({ id:'roomclearer', name:'Room Clearer', icon:'🧹',
  desc:'Clear 200 rooms.', category:'Miscellaneous', itemId:'meditationbell', statKey:'roomsCleared', threshold:200 });
addAchievement({ id:'poweruser', name:'Power User', icon:'🔋',
  desc:'Use your active item 100 times.', category:'Miscellaneous', itemId:'panicwhistle', statKey:'activeItemUses', threshold:100 });
addAchievement({ id:'treasurehoarder', name:'Treasure Hoarder', icon:'🪙',
  desc:'Collect 1000 coins.', category:'Miscellaneous', familiarId:'dustmite', statKey:'coinsCollected', threshold:1000 });
addAchievement({ id:'locksmith', name:'Locksmith', icon:'🔑',
  desc:'Open 10 gold chests.', category:'Miscellaneous', familiarId:'stoneguard', statKey:'goldChestsOpened', threshold:10 });
addAchievement({ id:'blastdoctor', name:'Blast Doctor', icon:'🧨',
  desc:'Open 10 stone chests.', category:'Miscellaneous', familiarId:'sparkler', statKey:'stoneChestsOpened', threshold:10 });
addAchievement({ id:'wreckingball', name:'Wrecking Ball', icon:'🪨',
  desc:'Destroy 50 obstacles.', category:'Miscellaneous', familiarId:'moonmoth', statKey:'obstaclesDestroyed', threshold:50 });
addAchievement({ id:'pyromaniac', name:'Pyromaniac', icon:'💣',
  desc:'Place 100 bombs.', category:'Miscellaneous', familiarId:'thornball', statKey:'bombsPlaced', threshold:100 });
addAchievement({ id:'sharpshooter', name:'Sharpshooter', icon:'🎯',
  desc:'Fire 1000 ranged shots.', category:'Miscellaneous', familiarId:'glowbug', statKey:'shotsFired', threshold:1000 });
addAchievement({ id:'precisionstriker', name:'Precision Striker', icon:'✴️',
  desc:'Land 50 critical hits.', category:'Miscellaneous', familiarId:'emberimp', statKey:'critsLanded', threshold:50 });
addAchievement({ id:'collector', name:'Collector', icon:'🧰',
  desc:'Collect 50 items.', category:'Miscellaneous', familiarId:'frostwisp', statKey:'itemsCollected', threshold:50 });
addAchievement({ id:'trinkethoarder', name:'Trinket Hoarder', icon:'🎒',
  desc:'Equip 10 trinkets.', category:'Miscellaneous', familiarId:'seedling', statKey:'trinketsEquipped', threshold:10 });
addAchievement({ id:'menagerie', name:'Menagerie', icon:'🐾',
  desc:'Collect 10 familiars.', category:'Miscellaneous', familiarId:'batling', statKey:'familiarsCollected', threshold:10 });
addAchievement({ id:'persistent', name:'Persistent', icon:'☠️',
  desc:'Die 10 times.', category:'Miscellaneous', familiarId:'stargazer', statKey:'deaths', threshold:10 });
addAchievement({ id:'saviorofequestria', name:'Savior of Equestria', icon:'🌟',
  desc:'Win the game.', category:'Miscellaneous', familiarId:'cinderowl', statKey:'wins', threshold:1 });
addAchievement({ id:'triplethreat', name:'Triple Threat', icon:'🎭',
  desc:'Win the game with 3 different characters.', category:'Miscellaneous', familiarId:'healingsprite' });
addAchievement({ id:'loyalcustomer', name:'Loyal Customer', icon:'🛒',
  desc:'Purchase 25 items from shops.', category:'Miscellaneous', familiarId:'coinsprite', statKey:'shopPurchases', threshold:25 });
addAchievement({ id:'hooftohoof', name:'Hoof to Hoof', icon:'🥊',
  desc:'Defeat 200 enemies with melee attacks.', category:'Miscellaneous', familiarId:'luckycat', statKey:'meleeKills', threshold:200 });
addAchievement({ id:'sharpenedaim', name:'Sharpened Aim', icon:'🏹',
  desc:'Defeat 200 enemies with ranged attacks.', category:'Miscellaneous', familiarId:'chargebot', statKey:'rangedKills', threshold:200 });

// ---- 6. donation machine — every shop room has one, see shop.js's
// tryDonateMachine. 20 tiers, one every 50c up to the old 1000c "fully
// funded" mark: one -1c discount per buyable kind (10, matching shop.js's
// SHOP_BASE_PRICES exactly) plus 4 items / 3 trinkets / 3 familiars, each
// an exclusive reward same as the superboss achievements above. Past
// 1000c the machine keeps taking coin up to its real cap (shop.js's
// DONATION_CAP, 5000c) but new achievement tiers only come once every
// 1000c from here — every -1c discount kind is already spoken for by
// 1000c, so these four pay a flat skill-point bonus instead (see
// logic.js's unlockAchievement def.skillPoints handling). Independently
// of every tier below, every 25c donated (the whole way to 5000c) also
// pays 1 skill point directly on its own drip — see shop.js's
// tryDonateMachine/awardDonationSkillPoints in logic.js. ----
addAchievement({ id:'donation_50', name:'First Contribution', icon:'❤️',
  desc:'Donate 50c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:50, shopDiscount:'heartRed' });
addAchievement({ id:'donation_100', name:"Giant's Blessing", icon:'💖',
  desc:'Donate 100c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:100, itemId:'giantsheart' });
addAchievement({ id:'donation_150', name:'Bulk Discount', icon:'💣',
  desc:'Donate 150c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:150, shopDiscount:'bomb' });
addAchievement({ id:'donation_200', name:'Long Sight', icon:'🔭',
  desc:'Donate 200c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:200, trinketId:'farseeingcharm' });
addAchievement({ id:'donation_250', name:'Keyed In', icon:'🔑',
  desc:'Donate 250c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:250, shopDiscount:'key' });
addAchievement({ id:'donation_300', name:'Spare Change', icon:'🌀',
  desc:'Donate 300c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:300, familiarId:'pennywhirl' });
addAchievement({ id:'donation_350', name:'Blue Blood', icon:'💙',
  desc:'Donate 350c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:350, shopDiscount:'heartBlue' });
addAchievement({ id:'donation_400', name:"Gambler's Luck", icon:'🎰',
  desc:'Donate 400c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:400, itemId:'gamblerscoin' });
addAchievement({ id:'donation_450', name:'Pharmacy Discount', icon:'💊',
  desc:'Donate 450c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:450, shopDiscount:'pill' });
addAchievement({ id:'donation_500', name:'Gilded Grip', icon:'🔶',
  desc:'Donate 500c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:500, trinketId:'gildedcharm' });
addAchievement({ id:'donation_550', name:'Sack Discount', icon:'🎒',
  desc:'Donate 550c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:550, shopDiscount:'sack' });
addAchievement({ id:'donation_600', name:'Vault Keeper', icon:'🏦',
  desc:'Donate 600c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:600, familiarId:'vaultsentinel' });
addAchievement({ id:'donation_650', name:'Battery Discount', icon:'🔋',
  desc:'Donate 650c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:650, shopDiscount:'battery' });
addAchievement({ id:'donation_700', name:'Gift Wrapped', icon:'🎁',
  desc:'Donate 700c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:700, itemId:'giftbox' });
addAchievement({ id:'donation_750', name:'Wholesale', icon:'📦',
  desc:'Donate 750c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:750, shopDiscount:'item' });
addAchievement({ id:'donation_800', name:'Coin Collector', icon:'🪙',
  desc:'Donate 800c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:800, trinketId:'stackedcoin' });
addAchievement({ id:'donation_850', name:'Trinket Discount', icon:'🔩',
  desc:'Donate 850c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:850, shopDiscount:'trinket' });
addAchievement({ id:'donation_900', name:'Tip Well Spent', icon:'🫙',
  desc:'Donate 900c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:900, familiarId:'tipjar' });
addAchievement({ id:'donation_950', name:'Familiar Discount', icon:'🐾',
  desc:'Donate 950c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:950, shopDiscount:'familiar' });
addAchievement({ id:'donation_1000', name:'Philanthropist', icon:'💵',
  desc:'Donate 1000c total to a donation machine — fully funded!', category:'Donations', statKey:'donationTotal', threshold:1000, itemId:'windfall' });
// past 1000c — every -1c discount kind and the last of the item/trinket/
// familiar exclusives are already handed out above, so these four just
// pay a chunky flat skill-point bonus each, on top of the every-25c drip
// that's already been running the whole time (see awardDonationSkillPoints).
addAchievement({ id:'donation_2000', name:'Grand Benefactor', icon:'🌟',
  desc:'Donate 2000c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:2000, skillPoints:10 });
addAchievement({ id:'donation_3000', name:'Pillar of the Community', icon:'🏛️',
  desc:'Donate 3000c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:3000, skillPoints:10 });
addAchievement({ id:'donation_4000', name:'Living Legend', icon:'🗿',
  desc:'Donate 4000c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:4000, skillPoints:10 });
addAchievement({ id:'donation_5000', name:'Boundless Generosity', icon:'♾️',
  desc:'Donate 5000c total to a donation machine — the machine can hold no more.', category:'Donations', statKey:'donationTotal', threshold:5000, skillPoints:15 });

// ---- 7. the 20 newest passives (data.js) — Isaac-style unlock conditions,
// some just a fresh stat threshold, a few bespoke one-off triggers (see
// items.js's recordWin, game.js's onBossDefeated, and items.js's updateShop) ----
addAchievement({ id:'quadrocentury', name:'Quadrocentury', icon:'💋',
  desc:'Defeat 400 enemies total.', category:'Miscellaneous', itemId:'directcharm', statKey:'enemiesKilled', threshold:400 });
addAchievement({ id:'demolitionsquad', name:'Demolition Squad', icon:'👻',
  desc:'Destroy 200 obstacles total.', category:'Miscellaneous', itemId:'directfear', statKey:'obstaclesDestroyed', threshold:200 });
addAchievement({ id:'firecracker', name:'Firecracker', icon:'💥',
  desc:'Place 200 bombs total.', category:'Miscellaneous', itemId:'directstun', statKey:'bombsPlaced', threshold:200 });
addAchievement({ id:'longshot', name:'Longshot', icon:'🦅',
  desc:'Defeat 250 enemies with ranged attacks.', category:'Miscellaneous', itemId:'eagleeye', statKey:'rangedKills', threshold:250 });
addAchievement({ id:'trigger_happy', name:'Trigger Happy', icon:'🪶',
  desc:'Fire 1500 shots total.', category:'Miscellaneous', itemId:'hawkfeather', statKey:'shotsFired', threshold:1500 });
addAchievement({ id:'eagleeyed2', name:'Eagle-Eyed II', icon:'🗡️',
  desc:'Land 200 critical hits total.', category:'Miscellaneous', itemId:'razorwing', statKey:'critsLanded', threshold:200 });
addAchievement({ id:'gettingthehangofit', name:'Getting the Hang of It', icon:'🐢',
  desc:'Die 5 times.', category:'Miscellaneous', itemId:'stonehide', statKey:'deaths', threshold:5 });
addAchievement({ id:'nightowl', name:'Night Owl', icon:'🦏',
  desc:'Clear 200 rooms total.', category:'Miscellaneous', itemId:'thickhide', statKey:'roomsCleared', threshold:200 });
addAchievement({ id:'zengarden', name:'Zen Garden', icon:'💫',
  desc:'Collect 600 coins total.', category:'Miscellaneous', itemId:'doublebarrel', statKey:'coinsCollected', threshold:600 });
addAchievement({ id:'painintolerance', name:'Pain Intolerance', icon:'⚔️',
  desc:'Defeat 20 bosses total.', category:'Miscellaneous', itemId:'bossbane', statKey:'bossesKilled', threshold:20 });
addAchievement({ id:'sharpenedgaze', name:'Sharpened Gaze', icon:'🔎',
  desc:'Land 100 critical hits total.', category:'Miscellaneous', itemId:'directglass', statKey:'critsLanded', threshold:100 });
addAchievement({ id:'webweaver', name:'Web Weaver', icon:'🕸️',
  desc:'Destroy 80 obstacles total.', category:'Miscellaneous', itemId:'spiderring', statKey:'obstaclesDestroyed', threshold:80 });
addAchievement({ id:'pillpopper', name:'Pill Popper', icon:'📿',
  desc:'Use 50 pills total.', category:'Miscellaneous', itemId:'charmedpendant', statKey:'pillsUsed', threshold:50 });
addAchievement({ id:'secretadmirer', name:'Secret Admirer', icon:'🔮',
  desc:'Find 10 secret rooms total.', category:'Miscellaneous', itemId:'spectraltoken', statKey:'secretRoomsFound', threshold:10 });
addAchievement({ id:'onehearted', name:'One-Hearted', icon:'🍎',
  desc:'Win a run with only 1 heart container or less.', category:'Miscellaneous', itemId:'witheredapple' });
addAchievement({ id:'thirstquencher', name:'Thirst Quencher', icon:'🧉',
  desc:'Collect 120 items total.', category:'Miscellaneous', itemId:'witchbrew', statKey:'itemsCollected', threshold:120 });
addAchievement({ id:'unbreakable', name:'Unbreakable', icon:'🔥',
  desc:'Defeat a superboss while at 1 heart or less remaining.', category:'Miscellaneous', itemId:'emberheart' });
addAchievement({ id:'ironhoof2', name:'Iron Hoof II', icon:'🕯️',
  desc:'Defeat 350 enemies with melee attacks.', category:'Miscellaneous', itemId:'calmingincense', statKey:'meleeKills', threshold:350 });
addAchievement({ id:'veteranslayer', name:'Veteran Slayer', icon:'🧱',
  desc:'Defeat 35 bosses total.', category:'Miscellaneous', itemId:'stonewall', statKey:'bossesKilled', threshold:35 });
addAchievement({ id:'coinflip', name:'Coin Flip', icon:'🪞',
  desc:'Spend your very last coin in a shop.', category:'Miscellaneous', itemId:'mirrorshard' });

// ---- 8. the 20 newest passives (data.js) — tied to this session's new room
// types and obstacles: petshop/curse/sacrifice/vault/challenge/crystal/
// sombra rooms, Swarmer DNBs, turrets, Bomb Barrels ----
addAchievement({ id:'petshopregular', name:'Petshop Regular', icon:'🐾',
  desc:'Visit 5 Pet Shops.', category:'Miscellaneous', itemId:'loyalpatron', statKey:'petshopsVisited', threshold:5 });
addAchievement({ id:'petshoptycoon', name:'Petshop Tycoon', icon:'🐕',
  desc:'Visit 20 Pet Shops.', category:'Miscellaneous', itemId:'familiarfriend', statKey:'petshopsVisited', threshold:20 });
addAchievement({ id:'curseexplorer', name:'Curse Explorer', icon:'🩸',
  desc:'Visit 5 Cursed Rooms.', category:'Miscellaneous', itemId:'cursedwanderer', statKey:'curseRoomsVisited', threshold:5 });
addAchievement({ id:'curseveteran', name:'Curse Veteran', icon:'😈',
  desc:'Visit 20 Cursed Rooms.', category:'Miscellaneous', itemId:'damnedsoul', statKey:'curseRoomsVisited', threshold:20 });
addAchievement({ id:'sacrificenovice', name:'Sacrifice Novice', icon:'🔪',
  desc:'Trigger a Sacrifice Room spike 20 times.', category:'Miscellaneous', itemId:'bloodoffering', statKey:'sacrificeSpikesTriggered', threshold:20 });
addAchievement({ id:'sacrificemaster', name:'Sacrifice Master', icon:'🔪',
  desc:'Trigger a Sacrifice Room spike 60 times.', category:'Miscellaneous', itemId:'sacrificialdevotee', statKey:'sacrificeSpikesTriggered', threshold:60 });
addAchievement({ id:'vaultopener', name:'Vault Opener', icon:'🏦',
  desc:'Open 3 Vaults.', category:'Miscellaneous', itemId:'vaultcracker', statKey:'vaultsOpened', threshold:3 });
addAchievement({ id:'vaultmaster', name:'Vault Master', icon:'🏦',
  desc:'Open 10 Vaults.', category:'Miscellaneous', itemId:'mastervaultkeeper', statKey:'vaultsOpened', threshold:10 });
addAchievement({ id:'challengenovice', name:'Gauntlet Novice', icon:'⚔️',
  desc:'Complete 3 Challenge Rooms.', category:'Miscellaneous', itemId:'gauntletrunner', statKey:'challengeRoomsCompleted', threshold:3 });
addAchievement({ id:'challengemaster', name:'Gauntlet Master', icon:'⚔️',
  desc:'Complete 10 Challenge Rooms.', category:'Miscellaneous', itemId:'undefeatedchampion', statKey:'challengeRoomsCompleted', threshold:10 });
addAchievement({ id:'crystalseeker', name:'Crystal Seeker', icon:'💎',
  desc:'Visit 5 Crystal Rooms.', category:'Miscellaneous', itemId:'blessedwanderer', statKey:'crystalRoomsVisited', threshold:5 });
addAchievement({ id:'crystaldevotee', name:'Crystal Devotee', icon:'💎',
  desc:'Visit 15 Crystal Rooms.', category:'Miscellaneous', itemId:'chosenofthelight', statKey:'crystalRoomsVisited', threshold:15 });
addAchievement({ id:'sombranovice', name:'Sombra Novice', icon:'👿',
  desc:'Take 5 devil deals.', category:'Miscellaneous', itemId:'dealmaker', statKey:'sombraDealsTaken', threshold:5 });
addAchievement({ id:'sombraveteran', name:'Sombra Veteran', icon:'👿',
  desc:'Take 15 devil deals.', category:'Miscellaneous', itemId:'soulseller', statKey:'sombraDealsTaken', threshold:15 });
addAchievement({ id:'swarmslayer', name:'Swarm Slayer', icon:'🐛',
  desc:'Defeat 50 Swarmer DNBs.', category:'Miscellaneous', itemId:'swarmbreaker', statKey:'swarmerdnbKilled', threshold:50 });
addAchievement({ id:'swarmexterminator', name:'Swarm Exterminator', icon:'🐛',
  desc:'Defeat 150 Swarmer DNBs.', category:'Miscellaneous', itemId:'pestcontrol', statKey:'swarmerdnbKilled', threshold:150 });
addAchievement({ id:'turretwrecker', name:'Turret Wrecker', icon:'🎯',
  desc:'Destroy 20 turrets.', category:'Miscellaneous', itemId:'turretbuster', statKey:'turretsDestroyed', threshold:20 });
addAchievement({ id:'turretdemolisher', name:'Turret Demolisher', icon:'🎯',
  desc:'Destroy 60 turrets.', category:'Miscellaneous', itemId:'siegebreaker', statKey:'turretsDestroyed', threshold:60 });
addAchievement({ id:'barrelpopper', name:'Barrel Popper', icon:'🛢️',
  desc:'Detonate 20 Bomb Barrels.', category:'Miscellaneous', itemId:'barrelroller', statKey:'bombBarrelsDetonated', threshold:20 });
addAchievement({ id:'chainbomber', name:'Chain Bomber', icon:'🛢️',
  desc:'Detonate 60 Bomb Barrels.', category:'Miscellaneous', itemId:'chainreaction', statKey:'bombBarrelsDetonated', threshold:60 });

/* ---- 8b. Star Rooms + the shop's Reroll Altar ----
   The two newest fixtures that had no achievement recognising them at all.
   Originally reward-free: at the time they were written every locked
   item/trinket/familiar/star id in data.js was already spoken for (the
   Superbosses block claims the entire locked-trinket table via
   TRINKET_LIST.filter(t => t.locked) plus the NEW_CLASS_REWARD_* pools,
   and its _rewardIndex assertion depends on that pool matching
   CLASSES × SUPERBOSSES exactly), leaving only shopDiscount:'star' — the
   only key in shop.js's SHOP_KIND_LABELS with no Donations achievement on
   it — which still goes to the Star Room ladder's top tier below.
   The expand-everything content pass then ADDED fresh locked pools
   (PILL_COLORS, ENEMY_TYPES, and 150 new trinkets/items/familiars each),
   so these now carry a reward drawn from those new pools. The Superbosses
   pool is untouched: its trinkets are filtered by `!t.pendingReward`, and
   every id used here is verified unclaimed anywhere else in this file. */
addAchievement({ id:'starseeker', name:'Star Seeker', icon:'🌟',
  desc:'Visit 5 Star Rooms.', category:'Miscellaneous', statKey:'starRoomsVisited', threshold:5, familiarId:'lunarvessel' });
addAchievement({ id:'stargazer', name:'Stargazer', icon:'🌠',
  desc:'Visit 15 Star Rooms.', category:'Miscellaneous', statKey:'starRoomsVisited', threshold:15, familiarId:'lunarbloom' });
addAchievement({ id:'rerollregular', name:'Second Opinion', icon:'🔄',
  desc:'Use a shop Reroll Altar 25 times.', category:'Miscellaneous', statKey:'rerollAltarUses', threshold:25, trinketId:'fourleafstone' });

// ---- 8c. room-teleport star achievements (11) — "visit this room type 10
// times" unlocks the matching Compass star (see data.js STAR_TYPES's
// teleport_* entries, all locked:true). Seven of the stat keys below are
// new counters bumped from game.js's enterRoom first-visit block; the other
// four (petshopsVisited/curseRoomsVisited/crystalRoomsVisited/
// starRoomsVisited) are the pre-existing ones the ladders above already use.
addAchievement({ id:'compasstreasure', name:'Treasure Sense', icon:'💰',
  desc:'Visit 10 Treasure Rooms.', category:'Exploration', starId:'teleport_treasure', statKey:'treasureRoomsVisited', threshold:10 });
addAchievement({ id:'compassshop', name:'Frequent Shopper', icon:'🛒',
  desc:'Visit 10 Shops.', category:'Exploration', starId:'teleport_shop', statKey:'shopRoomsVisited', threshold:10 });
addAchievement({ id:'compasssecret', name:'Secret Sense', icon:'🗝️',
  desc:'Visit 10 Secret Rooms.', category:'Exploration', starId:'teleport_secret', statKey:'secretRoomsVisited', threshold:10 });
addAchievement({ id:'compasspetshop', name:'Familiar Territory', icon:'🐾',
  desc:'Visit 10 Pet Shops.', category:'Exploration', starId:'teleport_petshop', statKey:'petshopsVisited', threshold:10 });
addAchievement({ id:'compasscurse', name:'Cursed Compass', icon:'💀',
  desc:'Visit 10 Cursed Rooms.', category:'Exploration', starId:'teleport_curse', statKey:'curseRoomsVisited', threshold:10 });
addAchievement({ id:'compasssacrifice', name:'Blood Sense', icon:'🩸',
  desc:'Visit 10 Sacrifice Rooms.', category:'Exploration', starId:'teleport_sacrifice', statKey:'sacrificeRoomsVisited', threshold:10 });
addAchievement({ id:'compassvault', name:'Vault Sense', icon:'🏦',
  desc:'Visit 10 Vaults.', category:'Exploration', starId:'teleport_vault', statKey:'vaultRoomsVisited', threshold:10 });
addAchievement({ id:'compasschallenge', name:'Challenge Sense', icon:'🏟️',
  desc:'Visit 10 Challenge Rooms.', category:'Exploration', starId:'teleport_challenge', statKey:'challengeRoomsVisited', threshold:10 });
addAchievement({ id:'compasscrystal', name:'Crystal Sense', icon:'💎',
  desc:'Visit 10 Crystal Rooms.', category:'Exploration', starId:'teleport_crystal', statKey:'crystalRoomsVisited', threshold:10 });
addAchievement({ id:'compasssombra', name:'Sombra Sense', icon:'🌑',
  desc:'Visit 10 Sombra Rooms.', category:'Exploration', starId:'teleport_sombra', statKey:'sombraRoomsVisited', threshold:10 });
addAchievement({ id:'compassstar', name:'Star Sense', icon:'🌌',
  desc:'Visit 10 Star Rooms.', category:'Exploration', starId:'teleport_star', statKey:'starRoomsVisited', threshold:10 });

// ---- 9. the 75 newest passives (data.js) — two (or three) escalating
// tiers stacked on top of every stat-based achievement already above.
// Every statKey here already exists in statDefaults, so bumpStat()'s
// existing call sites drive these achievements too — no new tracking
// code was needed anywhere else in the game for this batch. ----
addAchievement({ id:'passagefinder', name:'Passage Finder', icon:'🚪',
  desc:'Discover 30 secret rooms.', category:'Miscellaneous', itemId:'hiddenpassagecharm', statKey:'secretRoomsFound', threshold:30 });
addAchievement({ id:'mastercartographer', name:'Master Cartographer', icon:'🗺️',
  desc:'Discover 50 secret rooms.', category:'Miscellaneous', itemId:'cartographerseye', statKey:'secretRoomsFound', threshold:50 });
addAchievement({ id:'lootlord', name:'Loot Lord', icon:'🗝️',
  desc:'Open 100 chests.', category:'Miscellaneous', itemId:'chestwhisperer', statKey:'chestsOpened', threshold:100 });
addAchievement({ id:'grandhoarder', name:'Grand Hoarder', icon:'💰',
  desc:'Open 200 chests.', category:'Miscellaneous', itemId:'hoardersblessing', statKey:'chestsOpened', threshold:200 });
addAchievement({ id:'quarryboss', name:'Quarry Boss', icon:'⛏️',
  desc:'Destroy 75 rocks with bombs.', category:'Miscellaneous', itemId:'quarrymanscharm', statKey:'rocksBombed', threshold:75 });
addAchievement({ id:'stonecrusher', name:'Stone Crusher', icon:'🪨',
  desc:'Destroy 150 rocks with bombs.', category:'Miscellaneous', itemId:'rubblerunner', statKey:'rocksBombed', threshold:150 });
addAchievement({ id:'bigspender2', name:'Frequent Buyer', icon:'🛍️',
  desc:'Spend 600 coins in shops.', category:'Miscellaneous', itemId:'frequentbuyercard', statKey:'coinsSpent', threshold:600 });
addAchievement({ id:'highroller', name:'High Roller', icon:'💳',
  desc:'Spend 1200 coins in shops.', category:'Miscellaneous', itemId:'vipmembershipcard', statKey:'coinsSpent', threshold:1200 });
addAchievement({ id:'darkcollector', name:'Dark Collector', icon:'🗝️',
  desc:'Open 15 cursed chests.', category:'Miscellaneous', itemId:'blacklockboxkey', statKey:'cursedChestsOpened', threshold:15 });
addAchievement({ id:'soulcollector', name:'Soul Collector', icon:'💍',
  desc:'Open 30 cursed chests.', category:'Miscellaneous', itemId:'devilsbargainring', statKey:'cursedChestsOpened', threshold:30 });
addAchievement({ id:'massmurderer', name:'Mass Murderer', icon:'⚔️',
  desc:'Defeat 750 enemies total.', category:'Miscellaneous', itemId:'slayerssigil', statKey:'enemiesKilled', threshold:750 });
addAchievement({ id:'apexpredator', name:'Apex Predator', icon:'💀',
  desc:'Defeat 1000 enemies total.', category:'Miscellaneous', itemId:'executionersmark', statKey:'enemiesKilled', threshold:1000 });
addAchievement({ id:'harbingerslayer', name:'Harbinger Slayer', icon:'👹',
  desc:'Defeat 1500 enemies total.', category:'Miscellaneous', itemId:'harbingeroftheend', statKey:'enemiesKilled', threshold:1500 });
addAchievement({ id:'giantslayer2', name:'Giant Slayer', icon:'🗡️',
  desc:'Defeat 50 bosses total.', category:'Miscellaneous', itemId:'giantslayersbelt', statKey:'bossesKilled', threshold:50 });
addAchievement({ id:'bossconqueror', name:'Boss Conqueror', icon:'🏆',
  desc:'Defeat 75 bosses total.', category:'Miscellaneous', itemId:'trophyrack', statKey:'bossesKilled', threshold:75 });
addAchievement({ id:'legendarian', name:'Legendarian', icon:'🧥',
  desc:'Defeat 100 bosses total.', category:'Miscellaneous', itemId:'legendsmantle', statKey:'bossesKilled', threshold:100 });
addAchievement({ id:'richhoard', name:'Rich Hoard', icon:'👛',
  desc:'Collect 1500 coins total.', category:'Miscellaneous', itemId:'overflowingpurse', statKey:'coinsCollected', threshold:1500 });
addAchievement({ id:'goldenmagnate', name:'Golden Magnate', icon:'🏛️',
  desc:'Collect 2500 coins total.', category:'Miscellaneous', itemId:'misersvault', statKey:'coinsCollected', threshold:2500 });
addAchievement({ id:'dragonhoarder', name:'Dragon\'s Hoarder', icon:'🐉',
  desc:'Collect 4000 coins total.', category:'Miscellaneous', itemId:'dragonshoardshard', statKey:'coinsCollected', threshold:4000 });
addAchievement({ id:'goldenhand', name:'Golden Hand', icon:'🔑',
  desc:'Open 25 gold chests.', category:'Miscellaneous', itemId:'goldenskeletonkey', statKey:'goldChestsOpened', threshold:25 });
addAchievement({ id:'midastoucher', name:'Midas\' Touch', icon:'👆',
  desc:'Open 50 gold chests.', category:'Miscellaneous', itemId:'midasfingertip', statKey:'goldChestsOpened', threshold:50 });
addAchievement({ id:'stonebreaker', name:'Stonebreaker', icon:'🧤',
  desc:'Open 25 stone chests.', category:'Miscellaneous', itemId:'blastproofgloves', statKey:'stoneChestsOpened', threshold:25 });
addAchievement({ id:'graniteveteran', name:'Granite Veteran', icon:'👊',
  desc:'Open 50 stone chests.', category:'Miscellaneous', itemId:'graniteknuckles', statKey:'stoneChestsOpened', threshold:50 });
addAchievement({ id:'pathclearer', name:'Path Clearer', icon:'🧨',
  desc:'Destroy 300 obstacles total.', category:'Miscellaneous', itemId:'demolitionistsbadge', statKey:'obstaclesDestroyed', threshold:300 });
addAchievement({ id:'terraformer', name:'Terraformer', icon:'👑',
  desc:'Destroy 400 obstacles total.', category:'Miscellaneous', itemId:'rubblekingscrown', statKey:'obstaclesDestroyed', threshold:400 });
addAchievement({ id:'worldbreaker', name:'World Breaker', icon:'🌍',
  desc:'Destroy 600 obstacles total.', category:'Miscellaneous', itemId:'worldbreakergauntlet', statKey:'obstaclesDestroyed', threshold:600 });
addAchievement({ id:'bombardier', name:'Bombardier', icon:'🧤',
  desc:'Place 350 bombs total.', category:'Miscellaneous', itemId:'fusemastersglove', statKey:'bombsPlaced', threshold:350 });
addAchievement({ id:'artillerist', name:'Artillerist', icon:'💥',
  desc:'Place 500 bombs total.', category:'Miscellaneous', itemId:'powderkegheart', statKey:'bombsPlaced', threshold:500 });
addAchievement({ id:'sharpshooter2', name:'Sharpshooter II', icon:'🏹',
  desc:'Fire 2500 shots total.', category:'Miscellaneous', itemId:'endlessquiver', statKey:'shotsFired', threshold:2500 });
addAchievement({ id:'marksman2', name:'Marksman II', icon:'🔫',
  desc:'Fire 4000 shots total.', category:'Miscellaneous', itemId:'barragecore', statKey:'shotsFired', threshold:4000 });
addAchievement({ id:'deadlystriker', name:'Deadly Striker', icon:'🗡️',
  desc:'Land 300 critical hits total.', category:'Miscellaneous', itemId:'assassinsedge', statKey:'critsLanded', threshold:300 });
addAchievement({ id:'executioner2', name:'Executioner II', icon:'🎯',
  desc:'Land 450 critical hits total.', category:'Miscellaneous', itemId:'executionersfocus', statKey:'critsLanded', threshold:450 });
addAchievement({ id:'deathsprecision', name:'Death\'s Precision', icon:'💉',
  desc:'Land 650 critical hits total.', category:'Miscellaneous', itemId:'deathsprecisionblade', statKey:'critsLanded', threshold:650 });
addAchievement({ id:'hoarder2', name:'Hoarder II', icon:'🎒',
  desc:'Collect 200 items total.', category:'Miscellaneous', itemId:'collectorssatchel', statKey:'itemsCollected', threshold:200 });
addAchievement({ id:'curator', name:'Curator', icon:'📿',
  desc:'Collect 300 items total.', category:'Miscellaneous', itemId:'curatorspendant', statKey:'itemsCollected', threshold:300 });
addAchievement({ id:'trinketmaster', name:'Trinket Master', icon:'📦',
  desc:'Equip 25 trinkets total.', category:'Miscellaneous', itemId:'trinketcase', statKey:'trinketsEquipped', threshold:25 });
addAchievement({ id:'charmcollector', name:'Charm Collector', icon:'📿',
  desc:'Equip 50 trinkets total.', category:'Miscellaneous', itemId:'charmbracelet', statKey:'trinketsEquipped', threshold:50 });
addAchievement({ id:'beastmaster', name:'Beastmaster', icon:'📯',
  desc:'Collect 20 familiars total.', category:'Miscellaneous', itemId:'beastmasterswhistle', statKey:'familiarsCollected', threshold:20 });
addAchievement({ id:'menageriekeeper', name:'Menagerie Keeper', icon:'🧥',
  desc:'Collect 35 familiars total.', category:'Miscellaneous', itemId:'menageriekeeperscloak', statKey:'familiarsCollected', threshold:35 });
addAchievement({ id:'nearmiss', name:'Near Miss', icon:'🩹',
  desc:'Die 20 times.', category:'Miscellaneous', itemId:'survivorsscar', statKey:'deaths', threshold:20 });
addAchievement({ id:'phoenixborn', name:'Phoenix-Born', icon:'🪶',
  desc:'Die 35 times.', category:'Miscellaneous', itemId:'phoenixfeathershard', statKey:'deaths', threshold:35 });
addAchievement({ id:'threetimechamp', name:'Three-Time Champion', icon:'🎗️',
  desc:'Win the game 3 times.', category:'Miscellaneous', itemId:'championssash', statKey:'wins', threshold:3 });
addAchievement({ id:'livinglegend', name:'Living Legend', icon:'👑',
  desc:'Win the game 5 times.', category:'Miscellaneous', itemId:'livinglegendscrown', statKey:'wins', threshold:5 });
addAchievement({ id:'pathfinder2', name:'Pathfinder II', icon:'🥾',
  desc:'Clear 400 rooms total.', category:'Miscellaneous', itemId:'explorersboots', statKey:'roomsCleared', threshold:400 });
addAchievement({ id:'wanderer2', name:'Wanderer II', icon:'🏃',
  desc:'Clear 700 rooms total.', category:'Miscellaneous', itemId:'wanderersendurance', statKey:'roomsCleared', threshold:700 });
addAchievement({ id:'shopaholic', name:'Shopaholic', icon:'🪙',
  desc:'Purchase 60 items from shops.', category:'Miscellaneous', itemId:'frequentflyercoin', statKey:'shopPurchases', threshold:60 });
addAchievement({ id:'merchantsbestfriend', name:'Merchant\'s Best Friend', icon:'🤝',
  desc:'Purchase 120 items from shops.', category:'Miscellaneous', itemId:'merchantsbestfriendbadge', statKey:'shopPurchases', threshold:120 });
addAchievement({ id:'powerplayer', name:'Power Player', icon:'🔋',
  desc:'Use your active item 250 times.', category:'Miscellaneous', itemId:'overchargedbattery', statKey:'activeItemUses', threshold:250 });
addAchievement({ id:'overcharged2', name:'Overcharged', icon:'⚡',
  desc:'Use your active item 500 times.', category:'Miscellaneous', itemId:'voltaiccore', statKey:'activeItemUses', threshold:500 });
addAchievement({ id:'bruiser2', name:'Bruiser', icon:'🥊',
  desc:'Defeat 500 enemies with melee attacks.', category:'Miscellaneous', itemId:'bruiserswraps', statKey:'meleeKills', threshold:500 });

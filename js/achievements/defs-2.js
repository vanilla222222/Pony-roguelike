'use strict';
// achievements/defs-2.js — split from achievements.js (part 2/6).
addAchievement({ id:'ironhoof3', name:'Iron Hoof III', icon:'🐴',
  desc:'Defeat 750 enemies with melee attacks.', category:'Miscellaneous', itemId:'ironhoofgauntlet', statKey:'meleeKills', threshold:750 });
addAchievement({ id:'longshot2', name:'Longshot II', icon:'🏹',
  desc:'Defeat 400 enemies with ranged attacks.', category:'Miscellaneous', itemId:'longbowstring', statKey:'rangedKills', threshold:400 });
addAchievement({ id:'deadeye2', name:'Deadeye', icon:'🔭',
  desc:'Defeat 600 enemies with ranged attacks.', category:'Miscellaneous', itemId:'deadeyelens', statKey:'rangedKills', threshold:600 });
addAchievement({ id:'pillpopper2', name:'Pill Popper II', icon:'💊',
  desc:'Use 100 pills total.', category:'Miscellaneous', itemId:'apothecaryssatchel', statKey:'pillsUsed', threshold:100 });
addAchievement({ id:'alchemist2', name:'Master Alchemist', icon:'🧪',
  desc:'Use 200 pills total.', category:'Miscellaneous', itemId:'alchemistsformula', statKey:'pillsUsed', threshold:200 });
addAchievement({ id:'critterlover', name:'Critter Lover', icon:'🐹',
  desc:'Visit 35 Pet Shops.', category:'Miscellaneous', itemId:'crittercharm', statKey:'petshopsVisited', threshold:35 });
addAchievement({ id:'beastfriend2', name:'Beastfriend\'s Bond', icon:'🐕‍🦺',
  desc:'Visit 60 Pet Shops.', category:'Miscellaneous', itemId:'beastfriendsbond', statKey:'petshopsVisited', threshold:60 });
addAchievement({ id:'hexwalker', name:'Hex Walker', icon:'🩸',
  desc:'Visit 35 Cursed Rooms.', category:'Miscellaneous', itemId:'hexbreakertalisman', statKey:'curseRoomsVisited', threshold:35 });
addAchievement({ id:'doomwalker2', name:'Doomwalker', icon:'🖤',
  desc:'Visit 60 Cursed Rooms.', category:'Miscellaneous', itemId:'doomwalkerscloak', statKey:'curseRoomsVisited', threshold:60 });
addAchievement({ id:'martyr2', name:'Martyr', icon:'🔪',
  desc:'Trigger a Sacrifice Room spike 100 times.', category:'Miscellaneous', itemId:'martyrsresolve', statKey:'sacrificeSpikesTriggered', threshold:100 });
addAchievement({ id:'saint2', name:'Saint of Suffering', icon:'✝️',
  desc:'Trigger a Sacrifice Room spike 150 times.', category:'Miscellaneous', itemId:'saintofsuffering', statKey:'sacrificeSpikesTriggered', threshold:150 });
addAchievement({ id:'keymaster2', name:'Keymaster II', icon:'🗝️',
  desc:'Open 20 Vaults.', category:'Miscellaneous', itemId:'masterkeyring', statKey:'vaultsOpened', threshold:20 });
addAchievement({ id:'vaultemperor', name:'Vault Emperor', icon:'🏦',
  desc:'Open 35 Vaults.', category:'Miscellaneous', itemId:'vaultemperorsseal', statKey:'vaultsOpened', threshold:35 });
addAchievement({ id:'gauntletveteran', name:'Gauntlet Veteran', icon:'🎖️',
  desc:'Complete 20 Challenge Rooms.', category:'Miscellaneous', itemId:'gauntletveteransmedal', statKey:'challengeRoomsCompleted', threshold:20 });
addAchievement({ id:'arenachampion', name:'Arena Champion', icon:'🏅',
  desc:'Complete 35 Challenge Rooms.', category:'Miscellaneous', itemId:'arenachampionsbelt', statKey:'challengeRoomsCompleted', threshold:35 });
addAchievement({ id:'prismseeker', name:'Prism Seeker', icon:'💎',
  desc:'Visit 25 Crystal Rooms.', category:'Miscellaneous', itemId:'prismshardnecklace', statKey:'crystalRoomsVisited', threshold:25 });
addAchievement({ id:'radiantone', name:'The Radiant One', icon:'😇',
  desc:'Visit 40 Crystal Rooms.', category:'Miscellaneous', itemId:'radianthalofragment', statKey:'crystalRoomsVisited', threshold:40 });
addAchievement({ id:'shadowbargainer', name:'Shadow Bargainer', icon:'📜',
  desc:'Take 25 devil deals.', category:'Miscellaneous', itemId:'contractofshadows', statKey:'sombraDealsTaken', threshold:25 });
addAchievement({ id:'sombrasown', name:'Sombra\'s Own', icon:'👿',
  desc:'Take 40 devil deals.', category:'Miscellaneous', itemId:'sombrasownseal', statKey:'sombraDealsTaken', threshold:40 });
addAchievement({ id:'swarmrepeller', name:'Swarm Repeller', icon:'🐛',
  desc:'Defeat 250 Swarmer DNBs.', category:'Miscellaneous', itemId:'swarmrepellent', statKey:'swarmerdnbKilled', threshold:250 });
addAchievement({ id:'exterminator2', name:'Exterminator II', icon:'🧴',
  desc:'Defeat 400 Swarmer DNBs.', category:'Miscellaneous', itemId:'insecticidevial', statKey:'swarmerdnbKilled', threshold:400 });
addAchievement({ id:'turretbane', name:'Turret Bane', icon:'🛡️',
  desc:'Destroy 100 turrets.', category:'Miscellaneous', itemId:'antiturretplating', statKey:'turretsDestroyed', threshold:100 });
addAchievement({ id:'sentrywrecker', name:'Sentry Wrecker', icon:'👊',
  desc:'Destroy 150 turrets.', category:'Miscellaneous', itemId:'sentrywreckersfist', statKey:'turretsDestroyed', threshold:150 });
addAchievement({ id:'blastexpert', name:'Blast Expert', icon:'🦺',
  desc:'Detonate 100 Bomb Barrels.', category:'Miscellaneous', itemId:'blastresistantvest', statKey:'bombBarrelsDetonated', threshold:100 });
addAchievement({ id:'detonationmaster', name:'Detonation Master', icon:'💥',
  desc:'Detonate 150 Bomb Barrels.', category:'Miscellaneous', itemId:'detonationspecialistbadge', statKey:'bombBarrelsDetonated', threshold:150 });

/* ==== SLAYER — per-enemy bestiary kill counts (Slice 2 of achievements-500) ====
   One entry per killable non-superboss id, Predicate B (enemyKills/<id>/threshold).
   Superbosses are deliberately absent: the sb_<boss>_<class> family plus the
   Superbosses/Completionist categories already cover all 11.
   No rewards anywhere in this category by design — it is a pure trophy case.
   Names are mechanical, not hand-tuned: entry.name minus 'DNB '/leading 'The ',
   plus ' Hunter'. Thresholds are flat 20 (enemy) / 5 (boss), never per-entry.
   ------------------------------------------------------------------------- */

/* -- Bosses. Threshold 5, not 20: a boss is one kill per boss room, so 20 would
   be an order of magnitude past the regular-enemy ask. Their names are proper
   nouns ('The Bone Sentinel', 'Grung, the DNB Warlord') rather than 'DNB <noun>'
   like the enemies above, so the desc uses '<name> 5 times' — 'of the The Bone
   Sentinel' would double the article. Still pluralization-free, still verbatim. -- */

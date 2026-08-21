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
addAchievement({ id:'slayer_gravegrub', name:'Grave Grub Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Grave Grub.', category:'Slayer', itemId:'slayertrophy_gravegrub', bestiarySection:'enemyKills', bestiaryId:'gravegrub', threshold:20 });
addAchievement({ id:'slayer_bonepicker', name:'Bone Picker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Bone Picker.', category:'Slayer', itemId:'slayertrophy_bonepicker', bestiarySection:'enemyKills', bestiaryId:'bonepicker', threshold:20 });
addAchievement({ id:'slayer_cryptslinger', name:'Crypt Slinger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Crypt Slinger.', category:'Slayer', itemId:'slayertrophy_cryptslinger', bestiarySection:'enemyKills', bestiaryId:'cryptslinger', threshold:20 });
addAchievement({ id:'slayer_shellbone', name:'Shellbone Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Shellbone.', category:'Slayer', itemId:'slayertrophy_shellbone', bestiarySection:'enemyKills', bestiaryId:'shellbone', threshold:20 });
addAchievement({ id:'slayer_skullcharger', name:'Skull Charger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Skull Charger.', category:'Slayer', itemId:'slayertrophy_skullcharger', bestiarySection:'enemyKills', bestiaryId:'skullcharger', threshold:20 });
addAchievement({ id:'slayer_graveturret', name:'Grave Turret Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Grave Turret.', category:'Slayer', itemId:'slayertrophy_graveturret', bestiarySection:'enemyKills', bestiaryId:'graveturret', threshold:20 });
addAchievement({ id:'slayer_cryptcrawler', name:'Crypt Crawler Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Crypt Crawler.', category:'Slayer', itemId:'slayertrophy_cryptcrawler', bestiarySection:'enemyKills', bestiaryId:'cryptcrawler', threshold:20 });
addAchievement({ id:'slayer_tombguardian', name:'Tomb Guardian Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Tomb Guardian.', category:'Slayer', itemId:'slayertrophy_tombguardian', bestiarySection:'enemyKills', bestiaryId:'tombguardian', threshold:20 });
addAchievement({ id:'slayer_skeletalarcher', name:'Skeletal Archer Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Skeletal Archer.', category:'Slayer', itemId:'slayertrophy_skeletalarcher', bestiarySection:'enemyKills', bestiaryId:'skeletalarcher', threshold:20 });
addAchievement({ id:'slayer_gravewisp', name:'Grave Wisp Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Grave Wisp.', category:'Slayer', itemId:'slayertrophy_gravewisp', bestiarySection:'enemyKills', bestiaryId:'gravewisp', threshold:20 });
addAchievement({ id:'slayer_deathrattler', name:'Death Rattler Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Death Rattler.', category:'Slayer', itemId:'slayertrophy_deathrattler', bestiarySection:'enemyKills', bestiaryId:'deathrattler', threshold:20 });
addAchievement({ id:'slayer_boneguard', name:'Bone Guard Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Bone Guard.', category:'Slayer', itemId:'slayertrophy_boneguard', bestiarySection:'enemyKills', bestiaryId:'boneguard', threshold:20 });
addAchievement({ id:'slayer_hollowknight', name:'Hollow Knight Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Hollow Knight.', category:'Slayer', itemId:'slayertrophy_hollowknight', bestiarySection:'enemyKills', bestiaryId:'hollowknight', threshold:20 });
addAchievement({ id:'slayer_witchlantern', name:'Witchlantern Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Witchlantern.', category:'Slayer', itemId:'slayertrophy_witchlantern', bestiarySection:'enemyKills', bestiaryId:'witchlantern', threshold:20 });
addAchievement({ id:'slayer_sarcophaguscrawler', name:'Sarcophagus Crawler Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sarcophagus Crawler.', category:'Slayer', itemId:'slayertrophy_sarcophaguscrawler', bestiarySection:'enemyKills', bestiaryId:'sarcophaguscrawler', threshold:20 });
addAchievement({ id:'slayer_wailingspecter', name:'Wailing Specter Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Wailing Specter.', category:'Slayer', itemId:'slayertrophy_wailingspecter', bestiarySection:'enemyKills', bestiaryId:'wailingspecter', threshold:20 });
addAchievement({ id:'slayer_cryptcircler', name:'Crypt Circler Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Crypt Circler.', category:'Slayer', itemId:'slayertrophy_cryptcircler', bestiarySection:'enemyKills', bestiaryId:'cryptcircler', threshold:20 });
addAchievement({ id:'slayer_gravedigger', name:'Gravedigger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Gravedigger.', category:'Slayer', itemId:'slayertrophy_gravedigger', bestiarySection:'enemyKills', bestiaryId:'gravedigger', threshold:20 });
addAchievement({ id:'slayer_bonecaller', name:'Bone Caller Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Bone Caller.', category:'Slayer', itemId:'slayertrophy_bonecaller', bestiarySection:'enemyKills', bestiaryId:'bonecaller', threshold:20 });
addAchievement({ id:'slayer_gravetender', name:'Grave Tender Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Grave Tender.', category:'Slayer', itemId:'slayertrophy_gravetender', bestiarySection:'enemyKills', bestiaryId:'gravetender', threshold:20 });
addAchievement({ id:'slayer_cryptmarksman', name:'Crypt Marksman Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Crypt Marksman.', category:'Slayer', itemId:'slayertrophy_cryptmarksman', bestiarySection:'enemyKills', bestiaryId:'cryptmarksman', threshold:20 });
addAchievement({ id:'slayer_cryptmite', name:'Crypt Mite Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Crypt Mite.', category:'Slayer', itemId:'slayertrophy_cryptmite', bestiarySection:'enemyKills', bestiaryId:'cryptmite', threshold:20 });
addAchievement({ id:'slayer_urnlurker', name:'Urn Lurker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Urn Lurker.', category:'Slayer', itemId:'slayertrophy_urnlurker', bestiarySection:'enemyKills', bestiaryId:'urnlurker', threshold:20 });
addAchievement({ id:'slayer_barrowblink', name:'Barrow Blink Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Barrow Blink.', category:'Slayer', itemId:'slayertrophy_barrowblink', bestiarySection:'enemyKills', bestiaryId:'barrowblink', threshold:20 });
addAchievement({ id:'slayer_cryptwarden', name:'Crypt Warden Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Crypt Warden.', category:'Slayer', itemId:'slayertrophy_cryptwarden', bestiarySection:'enemyKills', bestiaryId:'cryptwarden', threshold:20 });
addAchievement({ id:'slayer_bonelobber', name:'Bone Lobber Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Bone Lobber.', category:'Slayer', itemId:'slayertrophy_bonelobber', bestiarySection:'enemyKills', bestiaryId:'bonelobber', threshold:20 });
addAchievement({ id:'slayer_sporepopper', name:'Spore Popper Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Spore Popper.', category:'Slayer', itemId:'slayertrophy_sporepopper', bestiarySection:'enemyKills', bestiaryId:'sporepopper', threshold:20 });
addAchievement({ id:'slayer_firefly', name:'Firefly Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Firefly.', category:'Slayer', itemId:'slayertrophy_firefly', bestiarySection:'enemyKills', bestiaryId:'firefly', threshold:20 });
addAchievement({ id:'slayer_thornhide', name:'Thornhide Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Thornhide.', category:'Slayer', itemId:'slayertrophy_thornhide', bestiarySection:'enemyKills', bestiaryId:'thornhide', threshold:20 });
addAchievement({ id:'slayer_sapling', name:'Sapling Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sapling.', category:'Slayer', itemId:'slayertrophy_sapling', bestiarySection:'enemyKills', bestiaryId:'sapling', threshold:20 });
addAchievement({ id:'slayer_sprout', name:'Sprout Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sprout.', category:'Slayer', itemId:'slayertrophy_sprout', bestiarySection:'enemyKills', bestiaryId:'sprout', threshold:20 });
addAchievement({ id:'slayer_frogtongue', name:'Frogtongue Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Frogtongue.', category:'Slayer', itemId:'slayertrophy_frogtongue', bestiarySection:'enemyKills', bestiaryId:'frogtongue', threshold:20 });
addAchievement({ id:'slayer_vineslinger', name:'Vine Slinger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Vine Slinger.', category:'Slayer', itemId:'slayertrophy_vineslinger', bestiarySection:'enemyKills', bestiaryId:'vineslinger', threshold:20 });
addAchievement({ id:'slayer_thornbeast', name:'Thornbeast Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Thornbeast.', category:'Slayer', itemId:'slayertrophy_thornbeast', bestiarySection:'enemyKills', bestiaryId:'thornbeast', threshold:20 });
addAchievement({ id:'slayer_mosshide', name:'Mosshide Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Mosshide.', category:'Slayer', itemId:'slayertrophy_mosshide', bestiarySection:'enemyKills', bestiaryId:'mosshide', threshold:20 });
addAchievement({ id:'slayer_willowisp', name:'Willowisp Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Willowisp.', category:'Slayer', itemId:'slayertrophy_willowisp', bestiarySection:'enemyKills', bestiaryId:'willowisp', threshold:20 });
addAchievement({ id:'slayer_stingswarm', name:'Stingswarm Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Stingswarm.', category:'Slayer', itemId:'slayertrophy_stingswarm', bestiarySection:'enemyKills', bestiaryId:'stingswarm', threshold:20 });
addAchievement({ id:'slayer_brambleknight', name:'Brambleknight Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Brambleknight.', category:'Slayer', itemId:'slayertrophy_brambleknight', bestiarySection:'enemyKills', bestiaryId:'brambleknight', threshold:20 });
addAchievement({ id:'slayer_boarrusher', name:'Boar Rusher Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Boar Rusher.', category:'Slayer', itemId:'slayertrophy_boarrusher', bestiarySection:'enemyKills', bestiaryId:'boarrusher', threshold:20 });
addAchievement({ id:'slayer_owlsentinel', name:'Owl Sentinel Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Owl Sentinel.', category:'Slayer', itemId:'slayertrophy_owlsentinel', bestiarySection:'enemyKills', bestiaryId:'owlsentinel', threshold:20 });
addAchievement({ id:'slayer_direfox', name:'Direfox Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Direfox.', category:'Slayer', itemId:'slayertrophy_direfox', bestiarySection:'enemyKills', bestiaryId:'direfox', threshold:20 });
addAchievement({ id:'slayer_fernstalker', name:'Fernstalker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Fernstalker.', category:'Slayer', itemId:'slayertrophy_fernstalker', bestiarySection:'enemyKills', bestiaryId:'fernstalker', threshold:20 });
addAchievement({ id:'slayer_creepervine', name:'Creepervine Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Creepervine.', category:'Slayer', itemId:'slayertrophy_creepervine', bestiarySection:'enemyKills', bestiaryId:'creepervine', threshold:20 });
addAchievement({ id:'slayer_thicketweaver', name:'Thicket Weaver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Thicket Weaver.', category:'Slayer', itemId:'slayertrophy_thicketweaver', bestiarySection:'enemyKills', bestiaryId:'thicketweaver', threshold:20 });
addAchievement({ id:'slayer_barkwatcher', name:'Bark Watcher Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Bark Watcher.', category:'Slayer', itemId:'slayertrophy_barkwatcher', bestiarySection:'enemyKills', bestiaryId:'barkwatcher', threshold:20 });
addAchievement({ id:'slayer_glowmoth', name:'Glowmoth Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Glowmoth.', category:'Slayer', itemId:'slayertrophy_glowmoth', bestiarySection:'enemyKills', bestiaryId:'glowmoth', threshold:20 });
addAchievement({ id:'slayer_rootburrower', name:'Root Burrower Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Root Burrower.', category:'Slayer', itemId:'slayertrophy_rootburrower', bestiarySection:'enemyKills', bestiaryId:'rootburrower', threshold:20 });
addAchievement({ id:'slayer_sporeseeder', name:'Spore Seeder Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Spore Seeder.', category:'Slayer', itemId:'slayertrophy_sporeseeder', bestiarySection:'enemyKills', bestiaryId:'sporeseeder', threshold:20 });
addAchievement({ id:'slayer_mossmender', name:'Moss Mender Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Moss Mender.', category:'Slayer', itemId:'slayertrophy_mossmender', bestiarySection:'enemyKills', bestiaryId:'mossmender', threshold:20 });
addAchievement({ id:'slayer_treelinesniper', name:'Treeline Sniper Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Treeline Sniper.', category:'Slayer', itemId:'slayertrophy_treelinesniper', bestiarySection:'enemyKills', bestiaryId:'treelinesniper', threshold:20 });
addAchievement({ id:'slayer_gnatcloud', name:'Gnat Cloud Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Gnat Cloud.', category:'Slayer', itemId:'slayertrophy_gnatcloud', bestiarySection:'enemyKills', bestiaryId:'gnatcloud', threshold:20 });
addAchievement({ id:'slayer_bramblelurker', name:'Bramble Lurker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Bramble Lurker.', category:'Slayer', itemId:'slayertrophy_bramblelurker', bestiarySection:'enemyKills', bestiaryId:'bramblelurker', threshold:20 });
addAchievement({ id:'slayer_wispblinker', name:'Wisp Blinker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Wisp Blinker.', category:'Slayer', itemId:'slayertrophy_wispblinker', bestiarySection:'enemyKills', bestiaryId:'wispblinker', threshold:20 });
addAchievement({ id:'slayer_duneskitter', name:'Dune Skitter Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Dune Skitter.', category:'Slayer', itemId:'slayertrophy_duneskitter', bestiarySection:'enemyKills', bestiaryId:'duneskitter', threshold:20 });
addAchievement({ id:'slayer_sandshell', name:'Sandshell Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sandshell.', category:'Slayer', itemId:'slayertrophy_sandshell', bestiarySection:'enemyKills', bestiaryId:'sandshell', threshold:20 });
addAchievement({ id:'slayer_cactusturret', name:'Cactus Turret Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Cactus Turret.', category:'Slayer', itemId:'slayertrophy_cactusturret', bestiarySection:'enemyKills', bestiaryId:'cactusturret', threshold:20 });
addAchievement({ id:'slayer_sandcharger', name:'Sand Charger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sand Charger.', category:'Slayer', itemId:'slayertrophy_sandcharger', bestiarySection:'enemyKills', bestiaryId:'sandcharger', threshold:20 });
addAchievement({ id:'slayer_sandwisp', name:'Sandwisp Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sandwisp.', category:'Slayer', itemId:'slayertrophy_sandwisp', bestiarySection:'enemyKills', bestiaryId:'sandwisp', threshold:20 });
addAchievement({ id:'slayer_powderkeg', name:'Powderkeg Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Powderkeg.', category:'Slayer', itemId:'slayertrophy_powderkeg', bestiarySection:'enemyKills', bestiaryId:'powderkeg', threshold:20 });
addAchievement({ id:'slayer_dunestalker', name:'Dune Stalker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Dune Stalker.', category:'Slayer', itemId:'slayertrophy_dunestalker', bestiarySection:'enemyKills', bestiaryId:'dunestalker', threshold:20 });
addAchievement({ id:'slayer_sunbleachedskull', name:'Sunbleached Skull Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sunbleached Skull.', category:'Slayer', itemId:'slayertrophy_sunbleachedskull', bestiarySection:'enemyKills', bestiaryId:'sunbleachedskull', threshold:20 });
addAchievement({ id:'slayer_mirageslinger', name:'Mirage Slinger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Mirage Slinger.', category:'Slayer', itemId:'slayertrophy_mirageslinger', bestiarySection:'enemyKills', bestiaryId:'mirageslinger', threshold:20 });
addAchievement({ id:'slayer_sandwraith', name:'Sand Wraith Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sand Wraith.', category:'Slayer', itemId:'slayertrophy_sandwraith', bestiarySection:'enemyKills', bestiaryId:'sandwraith', threshold:20 });
addAchievement({ id:'slayer_scarabswarm', name:'Scarab Swarm Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Scarab Swarm.', category:'Slayer', itemId:'slayertrophy_scarabswarm', bestiarySection:'enemyKills', bestiaryId:'scarabswarm', threshold:20 });
addAchievement({ id:'slayer_duneguardian', name:'Dune Guardian Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Dune Guardian.', category:'Slayer', itemId:'slayertrophy_duneguardian', bestiarySection:'enemyKills', bestiaryId:'duneguardian', threshold:20 });
addAchievement({ id:'slayer_scorpionrusher', name:'Scorpion Rusher Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Scorpion Rusher.', category:'Slayer', itemId:'slayertrophy_scorpionrusher', bestiarySection:'enemyKills', bestiaryId:'scorpionrusher', threshold:20 });
addAchievement({ id:'slayer_obelisksentinel', name:'Obelisk Sentinel Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Obelisk Sentinel.', category:'Slayer', itemId:'slayertrophy_obelisksentinel', bestiarySection:'enemyKills', bestiaryId:'obelisksentinel', threshold:20 });
addAchievement({ id:'slayer_jackaljumper', name:'Jackal Jumper Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Jackal Jumper.', category:'Slayer', itemId:'slayertrophy_jackaljumper', bestiarySection:'enemyKills', bestiaryId:'jackaljumper', threshold:20 });
addAchievement({ id:'slayer_sandvortex', name:'Sand Vortex Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sand Vortex.', category:'Slayer', itemId:'slayertrophy_sandvortex', bestiarySection:'enemyKills', bestiaryId:'sandvortex', threshold:20 });
addAchievement({ id:'slayer_sandwarden', name:'Sand Warden Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sand Warden.', category:'Slayer', itemId:'slayertrophy_sandwarden', bestiarySection:'enemyKills', bestiaryId:'sandwarden', threshold:20 });
addAchievement({ id:'slayer_sandmortar', name:'Sand Mortar Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sand Mortar.', category:'Slayer', itemId:'slayertrophy_sandmortar', bestiarySection:'enemyKills', bestiaryId:'sandmortar', threshold:20 });
addAchievement({ id:'slayer_sidewinder', name:'Sidewinder Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sidewinder.', category:'Slayer', itemId:'slayertrophy_sidewinder', bestiarySection:'enemyKills', bestiaryId:'sidewinder', threshold:20 });
addAchievement({ id:'slayer_sunsentry', name:'Sun Sentry Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sun Sentry.', category:'Slayer', itemId:'slayertrophy_sunsentry', bestiarySection:'enemyKills', bestiaryId:'sunsentry', threshold:20 });
addAchievement({ id:'slayer_miragedancer', name:'Mirage Dancer Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Mirage Dancer.', category:'Slayer', itemId:'slayertrophy_miragedancer', bestiarySection:'enemyKills', bestiaryId:'miragedancer', threshold:20 });
addAchievement({ id:'slayer_dunediver', name:'Dune Diver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Dune Diver.', category:'Slayer', itemId:'slayertrophy_dunediver', bestiarySection:'enemyKills', bestiaryId:'dunediver', threshold:20 });
addAchievement({ id:'slayer_scarabcaller', name:'Scarab Caller Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Scarab Caller.', category:'Slayer', itemId:'slayertrophy_scarabcaller', bestiarySection:'enemyKills', bestiaryId:'scarabcaller', threshold:20 });
addAchievement({ id:'slayer_oasistender', name:'Oasis Tender Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Oasis Tender.', category:'Slayer', itemId:'slayertrophy_oasistender', bestiarySection:'enemyKills', bestiaryId:'oasistender', threshold:20 });
addAchievement({ id:'slayer_dunemarksman', name:'Dune Marksman Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Dune Marksman.', category:'Slayer', itemId:'slayertrophy_dunemarksman', bestiarySection:'enemyKills', bestiaryId:'dunemarksman', threshold:20 });
addAchievement({ id:'slayer_locustfleck', name:'Locust Fleck Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Locust Fleck.', category:'Slayer', itemId:'slayertrophy_locustfleck', bestiarySection:'enemyKills', bestiaryId:'locustfleck', threshold:20 });
addAchievement({ id:'slayer_emberling', name:'Emberling Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Emberling.', category:'Slayer', itemId:'slayertrophy_emberling', bestiarySection:'enemyKills', bestiaryId:'emberling', threshold:20 });
addAchievement({ id:'slayer_cinderhound', name:'Cinderhound Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Cinderhound.', category:'Slayer', itemId:'slayertrophy_cinderhound', bestiarySection:'enemyKills', bestiaryId:'cinderhound', threshold:20 });
addAchievement({ id:'slayer_ashwraith', name:'Ash Wraith Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Ash Wraith.', category:'Slayer', itemId:'slayertrophy_ashwraith', bestiarySection:'enemyKills', bestiaryId:'ashwraith', threshold:20 });
addAchievement({ id:'slayer_brimstonebomber', name:'Brimstone Bomber Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Brimstone Bomber.', category:'Slayer', itemId:'slayertrophy_brimstonebomber', bestiarySection:'enemyKills', bestiaryId:'brimstonebomber', threshold:20 });
addAchievement({ id:'slayer_infernoguardian', name:'Inferno Guardian Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Inferno Guardian.', category:'Slayer', itemId:'slayertrophy_infernoguardian', bestiarySection:'enemyKills', bestiaryId:'infernoguardian', threshold:20 });
addAchievement({ id:'slayer_hellcharger', name:'Hellcharger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Hellcharger.', category:'Slayer', itemId:'slayertrophy_hellcharger', bestiarySection:'enemyKills', bestiaryId:'hellcharger', threshold:20 });
addAchievement({ id:'slayer_obsidiansentinel', name:'Obsidian Sentinel Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Obsidian Sentinel.', category:'Slayer', itemId:'slayertrophy_obsidiansentinel', bestiarySection:'enemyKills', bestiaryId:'obsidiansentinel', threshold:20 });
addAchievement({ id:'slayer_magmaleaper', name:'Magma Leaper Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Magma Leaper.', category:'Slayer', itemId:'slayertrophy_magmaleaper', bestiarySection:'enemyKills', bestiaryId:'magmaleaper', threshold:20 });
addAchievement({ id:'slayer_emberarcher', name:'Ember Archer Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Ember Archer.', category:'Slayer', itemId:'slayertrophy_emberarcher', bestiarySection:'enemyKills', bestiaryId:'emberarcher', threshold:20 });
addAchievement({ id:'slayer_soulflame', name:'Soulflame Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Soulflame.', category:'Slayer', itemId:'slayertrophy_soulflame', bestiarySection:'enemyKills', bestiaryId:'soulflame', threshold:20 });
addAchievement({ id:'slayer_ashlurker', name:'Ash Lurker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Ash Lurker.', category:'Slayer', itemId:'slayertrophy_ashlurker', bestiarySection:'enemyKills', bestiaryId:'ashlurker', threshold:20 });
addAchievement({ id:'slayer_flamewalker', name:'Flamewalker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Flamewalker.', category:'Slayer', itemId:'slayertrophy_flamewalker', bestiarySection:'enemyKills', bestiaryId:'flamewalker', threshold:20 });
addAchievement({ id:'slayer_cinderwarden', name:'Cinder Warden Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Cinder Warden.', category:'Slayer', itemId:'slayertrophy_cinderwarden', bestiarySection:'enemyKills', bestiaryId:'cinderwarden', threshold:20 });
addAchievement({ id:'slayer_magmamortar', name:'Magma Mortar Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Magma Mortar.', category:'Slayer', itemId:'slayertrophy_magmamortar', bestiarySection:'enemyKills', bestiaryId:'magmamortar', threshold:20 });
addAchievement({ id:'slayer_emberweaver', name:'Ember Weaver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Ember Weaver.', category:'Slayer', itemId:'slayertrophy_emberweaver', bestiarySection:'enemyKills', bestiaryId:'emberweaver', threshold:20 });
addAchievement({ id:'slayer_slagsentry', name:'Slag Sentry Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Slag Sentry.', category:'Slayer', itemId:'slayertrophy_slagsentry', bestiarySection:'enemyKills', bestiaryId:'slagsentry', threshold:20 });
addAchievement({ id:'slayer_flarecircler', name:'Flare Circler Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Flare Circler.', category:'Slayer', itemId:'slayertrophy_flarecircler', bestiarySection:'enemyKills', bestiaryId:'flarecircler', threshold:20 });
addAchievement({ id:'slayer_magmadelver', name:'Magma Delver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Magma Delver.', category:'Slayer', itemId:'slayertrophy_magmadelver', bestiarySection:'enemyKills', bestiaryId:'magmadelver', threshold:20 });
addAchievement({ id:'slayer_pyrecaller', name:'Pyre Caller Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Pyre Caller.', category:'Slayer', itemId:'slayertrophy_pyrecaller', bestiarySection:'enemyKills', bestiaryId:'pyrecaller', threshold:20 });
addAchievement({ id:'slayer_embertender', name:'Ember Tender Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Ember Tender.', category:'Slayer', itemId:'slayertrophy_embertender', bestiarySection:'enemyKills', bestiaryId:'embertender', threshold:20 });
addAchievement({ id:'slayer_shadowcreeper', name:'Shadowcreeper Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Shadowcreeper.', category:'Slayer', itemId:'slayertrophy_shadowcreeper', bestiarySection:'enemyKills', bestiaryId:'shadowcreeper', threshold:20 });
addAchievement({ id:'slayer_stormlurker', name:'Stormlurker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Stormlurker.', category:'Slayer', itemId:'slayertrophy_stormlurker', bestiarySection:'enemyKills', bestiaryId:'stormlurker', threshold:20 });
addAchievement({ id:'slayer_nightflyer', name:'Nightflyer Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Nightflyer.', category:'Slayer', itemId:'slayertrophy_nightflyer', bestiarySection:'enemyKills', bestiaryId:'nightflyer', threshold:20 });
addAchievement({ id:'slayer_voidbomber', name:'Voidbomber Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Voidbomber.', category:'Slayer', itemId:'slayertrophy_voidbomber', bestiarySection:'enemyKills', bestiaryId:'voidbomber', threshold:20 });
addAchievement({ id:'slayer_duskguard', name:'Duskguard Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Duskguard.', category:'Slayer', itemId:'slayertrophy_duskguard', bestiarySection:'enemyKills', bestiaryId:'duskguard', threshold:20 });
addAchievement({ id:'slayer_tempestrusher', name:'Tempest Rusher Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Tempest Rusher.', category:'Slayer', itemId:'slayertrophy_tempestrusher', bestiarySection:'enemyKills', bestiaryId:'tempestrusher', threshold:20 });
addAchievement({ id:'slayer_gloomturret', name:'Gloom Turret Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Gloom Turret.', category:'Slayer', itemId:'slayertrophy_gloomturret', bestiarySection:'enemyKills', bestiaryId:'gloomturret', threshold:20 });
addAchievement({ id:'slayer_shadowleaper', name:'Shadowleaper Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Shadowleaper.', category:'Slayer', itemId:'slayertrophy_shadowleaper', bestiarySection:'enemyKills', bestiaryId:'shadowleaper', threshold:20 });
addAchievement({ id:'slayer_stormcaller', name:'Stormcaller Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Stormcaller.', category:'Slayer', itemId:'slayertrophy_stormcaller', bestiarySection:'enemyKills', bestiaryId:'stormcaller', threshold:20 });
addAchievement({ id:'slayer_voidwhisper', name:'Voidwhisper Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Voidwhisper.', category:'Slayer', itemId:'slayertrophy_voidwhisper', bestiarySection:'enemyKills', bestiaryId:'voidwhisper', threshold:20 });
addAchievement({ id:'slayer_voidmarksman', name:'Void Marksman Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Void Marksman.', category:'Slayer', itemId:'slayertrophy_voidmarksman', bestiarySection:'enemyKills', bestiaryId:'voidmarksman', threshold:20 });
addAchievement({ id:'slayer_gloommites', name:'Gloom Mites Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Gloom Mites.', category:'Slayer', itemId:'slayertrophy_gloommites', bestiarySection:'enemyKills', bestiaryId:'gloommites', threshold:20 });
addAchievement({ id:'slayer_dusklurker', name:'Dusk Lurker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Dusk Lurker.', category:'Slayer', itemId:'slayertrophy_dusklurker', bestiarySection:'enemyKills', bestiaryId:'dusklurker', threshold:20 });
addAchievement({ id:'slayer_voidblinker', name:'Void Blinker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Void Blinker.', category:'Slayer', itemId:'slayertrophy_voidblinker', bestiarySection:'enemyKills', bestiaryId:'voidblinker', threshold:20 });
addAchievement({ id:'slayer_nightwarden', name:'Night Warden Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Night Warden.', category:'Slayer', itemId:'slayertrophy_nightwarden', bestiarySection:'enemyKills', bestiaryId:'nightwarden', threshold:20 });
addAchievement({ id:'slayer_stormmortar', name:'Storm Mortar Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Storm Mortar.', category:'Slayer', itemId:'slayertrophy_stormmortar', bestiarySection:'enemyKills', bestiaryId:'stormmortar', threshold:20 });
addAchievement({ id:'slayer_shadeweaver', name:'Shade Weaver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Shade Weaver.', category:'Slayer', itemId:'slayertrophy_shadeweaver', bestiarySection:'enemyKills', bestiaryId:'shadeweaver', threshold:20 });
addAchievement({ id:'slayer_duskwatcher', name:'Dusk Watcher Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Dusk Watcher.', category:'Slayer', itemId:'slayertrophy_duskwatcher', bestiarySection:'enemyKills', bestiaryId:'duskwatcher', threshold:20 });
addAchievement({ id:'slayer_stormcircler', name:'Storm Circler Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Storm Circler.', category:'Slayer', itemId:'slayertrophy_stormcircler', bestiarySection:'enemyKills', bestiaryId:'stormcircler', threshold:20 });
addAchievement({ id:'slayer_umbraldelver', name:'Umbral Delver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Umbral Delver.', category:'Slayer', itemId:'slayertrophy_umbraldelver', bestiarySection:'enemyKills', bestiaryId:'umbraldelver', threshold:20 });
addAchievement({ id:'slayer_frostbiter', name:'Frostbiter Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Frostbiter.', category:'Slayer', itemId:'slayertrophy_frostbiter', bestiarySection:'enemyKills', bestiaryId:'frostbiter', threshold:20 });
addAchievement({ id:'slayer_masonbrute', name:'Mason Brute Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Mason Brute.', category:'Slayer', itemId:'slayertrophy_masonbrute', bestiarySection:'enemyKills', bestiaryId:'masonbrute', threshold:20 });
addAchievement({ id:'slayer_gustwing', name:'Gustwing Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Gustwing.', category:'Slayer', itemId:'slayertrophy_gustwing', bestiarySection:'enemyKills', bestiaryId:'gustwing', threshold:20 });
addAchievement({ id:'slayer_icebomber', name:'Icebomber Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Icebomber.', category:'Slayer', itemId:'slayertrophy_icebomber', bestiarySection:'enemyKills', bestiaryId:'icebomber', threshold:20 });
addAchievement({ id:'slayer_brickguard', name:'Brickguard Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Brickguard.', category:'Slayer', itemId:'slayertrophy_brickguard', bestiarySection:'enemyKills', bestiaryId:'brickguard', threshold:20 });
addAchievement({ id:'slayer_palisadecharger', name:'Palisade Charger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Palisade Charger.', category:'Slayer', itemId:'slayertrophy_palisadecharger', bestiarySection:'enemyKills', bestiaryId:'palisadecharger', threshold:20 });
addAchievement({ id:'slayer_sentrytower', name:'Sentry Tower Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sentry Tower.', category:'Slayer', itemId:'slayertrophy_sentrytower', bestiarySection:'enemyKills', bestiaryId:'sentrytower', threshold:20 });
addAchievement({ id:'slayer_frostleaper', name:'Frostleaper Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Frostleaper.', category:'Slayer', itemId:'slayertrophy_frostleaper', bestiarySection:'enemyKills', bestiaryId:'frostleaper', threshold:20 });
addAchievement({ id:'slayer_chillarcher', name:'Chillarcher Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Chillarcher.', category:'Slayer', itemId:'slayertrophy_chillarcher', bestiarySection:'enemyKills', bestiaryId:'chillarcher', threshold:20 });
addAchievement({ id:'slayer_gustwhisper', name:'Gustwhisper Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Gustwhisper.', category:'Slayer', itemId:'slayertrophy_gustwhisper', bestiarySection:'enemyKills', bestiaryId:'gustwhisper', threshold:20 });
addAchievement({ id:'slayer_masoncaller', name:'Mason Caller Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Mason Caller.', category:'Slayer', itemId:'slayertrophy_masoncaller', bestiarySection:'enemyKills', bestiaryId:'masoncaller', threshold:20 });
addAchievement({ id:'slayer_hearthtender', name:'Hearth Tender Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Hearth Tender.', category:'Slayer', itemId:'slayertrophy_hearthtender', bestiarySection:'enemyKills', bestiaryId:'hearthtender', threshold:20 });
addAchievement({ id:'slayer_frostmarksman', name:'Frost Marksman Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Frost Marksman.', category:'Slayer', itemId:'slayertrophy_frostmarksman', bestiarySection:'enemyKills', bestiaryId:'frostmarksman', threshold:20 });
addAchievement({ id:'slayer_flurrymites', name:'Flurry Mites Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Flurry Mites.', category:'Slayer', itemId:'slayertrophy_flurrymites', bestiarySection:'enemyKills', bestiaryId:'flurrymites', threshold:20 });
addAchievement({ id:'slayer_rubblelurker', name:'Rubble Lurker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Rubble Lurker.', category:'Slayer', itemId:'slayertrophy_rubblelurker', bestiarySection:'enemyKills', bestiaryId:'rubblelurker', threshold:20 });
addAchievement({ id:'slayer_rimeblinker', name:'Rime Blinker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Rime Blinker.', category:'Slayer', itemId:'slayertrophy_rimeblinker', bestiarySection:'enemyKills', bestiaryId:'rimeblinker', threshold:20 });
addAchievement({ id:'slayer_bulwarkwarden', name:'Bulwark Warden Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Bulwark Warden.', category:'Slayer', itemId:'slayertrophy_bulwarkwarden', bestiarySection:'enemyKills', bestiaryId:'bulwarkwarden', threshold:20 });
addAchievement({ id:'slayer_kilnmortar', name:'Kiln Mortar Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Kiln Mortar.', category:'Slayer', itemId:'slayertrophy_kilnmortar', bestiarySection:'enemyKills', bestiaryId:'kilnmortar', threshold:20 });
addAchievement({ id:'slayer_sleetweaver', name:'Sleet Weaver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sleet Weaver.', category:'Slayer', itemId:'slayertrophy_sleetweaver', bestiarySection:'enemyKills', bestiaryId:'sleetweaver', threshold:20 });
addAchievement({ id:'slayer_parapetsentry', name:'Parapet Sentry Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Parapet Sentry.', category:'Slayer', itemId:'slayertrophy_parapetsentry', bestiarySection:'enemyKills', bestiaryId:'parapetsentry', threshold:20 });
addAchievement({ id:'slayer_icecrawler', name:'Ice Crawler Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Ice Crawler.', category:'Slayer', itemId:'slayertrophy_icecrawler', bestiarySection:'enemyKills', bestiaryId:'icecrawler', threshold:20 });
addAchievement({ id:'slayer_glacierbeast', name:'Glacier Beast Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Glacier Beast.', category:'Slayer', itemId:'slayertrophy_glacierbeast', bestiarySection:'enemyKills', bestiaryId:'glacierbeast', threshold:20 });
addAchievement({ id:'slayer_snowdrifter', name:'Snowdrifter Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Snowdrifter.', category:'Slayer', itemId:'slayertrophy_snowdrifter', bestiarySection:'enemyKills', bestiaryId:'snowdrifter', threshold:20 });
addAchievement({ id:'slayer_frostbomber', name:'Frostbomber Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Frostbomber.', category:'Slayer', itemId:'slayertrophy_frostbomber', bestiarySection:'enemyKills', bestiaryId:'frostbomber', threshold:20 });
addAchievement({ id:'slayer_permafrostguard', name:'Permafrost Guard Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Permafrost Guard.', category:'Slayer', itemId:'slayertrophy_permafrostguard', bestiarySection:'enemyKills', bestiaryId:'permafrostguard', threshold:20 });
addAchievement({ id:'slayer_avalanchecharger', name:'Avalanche Charger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Avalanche Charger.', category:'Slayer', itemId:'slayertrophy_avalanchecharger', bestiarySection:'enemyKills', bestiaryId:'avalanchecharger', threshold:20 });
addAchievement({ id:'slayer_icicleturret', name:'Icicle Turret Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Icicle Turret.', category:'Slayer', itemId:'slayertrophy_icicleturret', bestiarySection:'enemyKills', bestiaryId:'icicleturret', threshold:20 });
addAchievement({ id:'slayer_snowpouncer', name:'Snowpouncer Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Snowpouncer.', category:'Slayer', itemId:'slayertrophy_snowpouncer', bestiarySection:'enemyKills', bestiaryId:'snowpouncer', threshold:20 });
addAchievement({ id:'slayer_frostarcher', name:'Frostarcher Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Frostarcher.', category:'Slayer', itemId:'slayertrophy_frostarcher', bestiarySection:'enemyKills', bestiaryId:'frostarcher', threshold:20 });
addAchievement({ id:'slayer_blizzardcaller', name:'Blizzardcaller Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Blizzardcaller.', category:'Slayer', itemId:'slayertrophy_blizzardcaller', bestiarySection:'enemyKills', bestiaryId:'blizzardcaller', threshold:20 });
addAchievement({ id:'slayer_glacialcircler', name:'Glacial Circler Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Glacial Circler.', category:'Slayer', itemId:'slayertrophy_glacialcircler', bestiarySection:'enemyKills', bestiaryId:'glacialcircler', threshold:20 });
addAchievement({ id:'slayer_crevassedelver', name:'Crevasse Delver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Crevasse Delver.', category:'Slayer', itemId:'slayertrophy_crevassedelver', bestiarySection:'enemyKills', bestiaryId:'crevassedelver', threshold:20 });
addAchievement({ id:'slayer_rimecaller', name:'Rime Caller Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Rime Caller.', category:'Slayer', itemId:'slayertrophy_rimecaller', bestiarySection:'enemyKills', bestiaryId:'rimecaller', threshold:20 });
addAchievement({ id:'slayer_thawtender', name:'Thaw Tender Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Thaw Tender.', category:'Slayer', itemId:'slayertrophy_thawtender', bestiarySection:'enemyKills', bestiaryId:'thawtender', threshold:20 });
addAchievement({ id:'slayer_iciclemarksman', name:'Icicle Marksman Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Icicle Marksman.', category:'Slayer', itemId:'slayertrophy_iciclemarksman', bestiarySection:'enemyKills', bestiaryId:'iciclemarksman', threshold:20 });
addAchievement({ id:'slayer_hailmites', name:'Hail Mites Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Hail Mites.', category:'Slayer', itemId:'slayertrophy_hailmites', bestiarySection:'enemyKills', bestiaryId:'hailmites', threshold:20 });
addAchievement({ id:'slayer_driftlurker', name:'Drift Lurker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Drift Lurker.', category:'Slayer', itemId:'slayertrophy_driftlurker', bestiarySection:'enemyKills', bestiaryId:'driftlurker', threshold:20 });
addAchievement({ id:'slayer_aurorablinker', name:'Aurora Blinker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Aurora Blinker.', category:'Slayer', itemId:'slayertrophy_aurorablinker', bestiarySection:'enemyKills', bestiaryId:'aurorablinker', threshold:20 });
addAchievement({ id:'slayer_floeweaver', name:'Floe Weaver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Floe Weaver.', category:'Slayer', itemId:'slayertrophy_floeweaver', bestiarySection:'enemyKills', bestiaryId:'floeweaver', threshold:20 });
addAchievement({ id:'slayer_glaciersentry', name:'Glacier Sentry Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Glacier Sentry.', category:'Slayer', itemId:'slayertrophy_glaciersentry', bestiarySection:'enemyKills', bestiaryId:'glaciersentry', threshold:20 });
addAchievement({ id:'slayer_junglestalker', name:'Junglestalker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Junglestalker.', category:'Slayer', itemId:'slayertrophy_junglestalker', bestiarySection:'enemyKills', bestiaryId:'junglestalker', threshold:20 });
addAchievement({ id:'slayer_canopybeast', name:'Canopy Beast Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Canopy Beast.', category:'Slayer', itemId:'slayertrophy_canopybeast', bestiarySection:'enemyKills', bestiaryId:'canopybeast', threshold:20 });
addAchievement({ id:'slayer_pollenflyer', name:'Pollenflyer Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Pollenflyer.', category:'Slayer', itemId:'slayertrophy_pollenflyer', bestiarySection:'enemyKills', bestiaryId:'pollenflyer', threshold:20 });
addAchievement({ id:'slayer_sporeburster', name:'Sporeburster Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sporeburster.', category:'Slayer', itemId:'slayertrophy_sporeburster', bestiarySection:'enemyKills', bestiaryId:'sporeburster', threshold:20 });
addAchievement({ id:'slayer_vineguard', name:'Vineguard Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Vineguard.', category:'Slayer', itemId:'slayertrophy_vineguard', bestiarySection:'enemyKills', bestiaryId:'vineguard', threshold:20 });
addAchievement({ id:'slayer_tuskcharger', name:'Tusk Charger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Tusk Charger.', category:'Slayer', itemId:'slayertrophy_tuskcharger', bestiarySection:'enemyKills', bestiaryId:'tuskcharger', threshold:20 });
addAchievement({ id:'slayer_totemturret', name:'Totem Turret Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Totem Turret.', category:'Slayer', itemId:'slayertrophy_totemturret', bestiarySection:'enemyKills', bestiaryId:'totemturret', threshold:20 });
addAchievement({ id:'slayer_foliagepouncer', name:'Foliage Pouncer Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Foliage Pouncer.', category:'Slayer', itemId:'slayertrophy_foliagepouncer', bestiarySection:'enemyKills', bestiaryId:'foliagepouncer', threshold:20 });
addAchievement({ id:'slayer_thornarcher', name:'Thornarcher Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Thornarcher.', category:'Slayer', itemId:'slayertrophy_thornarcher', bestiarySection:'enemyKills', bestiaryId:'thornarcher', threshold:20 });
addAchievement({ id:'slayer_mistcaller', name:'Mistcaller Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Mistcaller.', category:'Slayer', itemId:'slayertrophy_mistcaller', bestiarySection:'enemyKills', bestiaryId:'mistcaller', threshold:20 });
addAchievement({ id:'slayer_canopywarden', name:'Canopy Warden Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Canopy Warden.', category:'Slayer', itemId:'slayertrophy_canopywarden', bestiarySection:'enemyKills', bestiaryId:'canopywarden', threshold:20 });
addAchievement({ id:'slayer_gourdmortar', name:'Gourd Mortar Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Gourd Mortar.', category:'Slayer', itemId:'slayertrophy_gourdmortar', bestiarySection:'enemyKills', bestiaryId:'gourdmortar', threshold:20 });
addAchievement({ id:'slayer_hummerwing', name:'Hummer Wing Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Hummer Wing.', category:'Slayer', itemId:'slayertrophy_hummerwing', bestiarySection:'enemyKills', bestiaryId:'hummerwing', threshold:20 });
addAchievement({ id:'slayer_rootdelver', name:'Root Delver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Root Delver.', category:'Slayer', itemId:'slayertrophy_rootdelver', bestiarySection:'enemyKills', bestiaryId:'rootdelver', threshold:20 });
addAchievement({ id:'slayer_hivecaller', name:'Hive Caller Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Hive Caller.', category:'Slayer', itemId:'slayertrophy_hivecaller', bestiarySection:'enemyKills', bestiaryId:'hivecaller', threshold:20 });
addAchievement({ id:'slayer_sapmender', name:'Sap Mender Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sap Mender.', category:'Slayer', itemId:'slayertrophy_sapmender', bestiarySection:'enemyKills', bestiaryId:'sapmender', threshold:20 });
addAchievement({ id:'slayer_mistblinker', name:'Mist Blinker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Mist Blinker.', category:'Slayer', itemId:'slayertrophy_mistblinker', bestiarySection:'enemyKills', bestiaryId:'mistblinker', threshold:20 });
addAchievement({ id:'slayer_vineweaver', name:'Vine Weaver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Vine Weaver.', category:'Slayer', itemId:'slayertrophy_vineweaver', bestiarySection:'enemyKills', bestiaryId:'vineweaver', threshold:20 });
addAchievement({ id:'slayer_idolsentry', name:'Idol Sentry Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Idol Sentry.', category:'Slayer', itemId:'slayertrophy_idolsentry', bestiarySection:'enemyKills', bestiaryId:'idolsentry', threshold:20 });
addAchievement({ id:'slayer_midgecloud', name:'Midge Cloud Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Midge Cloud.', category:'Slayer', itemId:'slayertrophy_midgecloud', bestiarySection:'enemyKills', bestiaryId:'midgecloud', threshold:20 });
addAchievement({ id:'slayer_subcrawler', name:'Sub Crawler Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sub Crawler.', category:'Slayer', itemId:'slayertrophy_subcrawler', bestiarySection:'enemyKills', bestiaryId:'subcrawler', threshold:20 });
addAchievement({ id:'slayer_bassbreaker', name:'Bass Breaker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Bass Breaker.', category:'Slayer', itemId:'slayertrophy_bassbreaker', bestiarySection:'enemyKills', bestiaryId:'bassbreaker', threshold:20 });
addAchievement({ id:'slayer_pressurelurker', name:'Pressure Lurker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Pressure Lurker.', category:'Slayer', itemId:'slayertrophy_pressurelurker', bestiarySection:'enemyKills', bestiaryId:'pressurelurker', threshold:20 });
addAchievement({ id:'slayer_depthmortar', name:'Depth Mortar Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Depth Mortar.', category:'Slayer', itemId:'slayertrophy_depthmortar', bestiarySection:'enemyKills', bestiaryId:'depthmortar', threshold:20 });
addAchievement({ id:'slayer_abyssmarksman', name:'Abyss Marksman Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Abyss Marksman.', category:'Slayer', itemId:'slayertrophy_abyssmarksman', bestiarySection:'enemyKills', bestiaryId:'abyssmarksman', threshold:20 });
addAchievement({ id:'slayer_fathomblinker', name:'Fathom Blinker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Fathom Blinker.', category:'Slayer', itemId:'slayertrophy_fathomblinker', bestiarySection:'enemyKills', bestiaryId:'fathomblinker', threshold:20 });
addAchievement({ id:'slayer_sonarwarden', name:'Sonar Warden Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Sonar Warden.', category:'Slayer', itemId:'slayertrophy_sonarwarden', bestiarySection:'enemyKills', bestiaryId:'sonarwarden', threshold:20 });
addAchievement({ id:'slayer_undertowmites', name:'Undertow Mites Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Undertow Mites.', category:'Slayer', itemId:'slayertrophy_undertowmites', bestiarySection:'enemyKills', bestiaryId:'undertowmites', threshold:20 });
addAchievement({ id:'slayer_reefstalker', name:'Reef Stalker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Reef Stalker.', category:'Slayer', itemId:'slayertrophy_reefstalker', bestiarySection:'enemyKills', bestiaryId:'reefstalker', threshold:20 });
addAchievement({ id:'slayer_tidebeast', name:'Tide Beast Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Tide Beast.', category:'Slayer', itemId:'slayertrophy_tidebeast', bestiarySection:'enemyKills', bestiaryId:'tidebeast', threshold:20 });
addAchievement({ id:'slayer_echoflyer', name:'Echo Flyer Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Echo Flyer.', category:'Slayer', itemId:'slayertrophy_echoflyer', bestiarySection:'enemyKills', bestiaryId:'echoflyer', threshold:20 });
addAchievement({ id:'slayer_brinebomber', name:'Brine Bomber Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Brine Bomber.', category:'Slayer', itemId:'slayertrophy_brinebomber', bestiarySection:'enemyKills', bestiaryId:'brinebomber', threshold:20 });
addAchievement({ id:'slayer_coralguard', name:'Coral Guard Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Coral Guard.', category:'Slayer', itemId:'slayertrophy_coralguard', bestiarySection:'enemyKills', bestiaryId:'coralguard', threshold:20 });
addAchievement({ id:'slayer_bloomcaller', name:'Bloom Caller Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Bloom Caller.', category:'Slayer', itemId:'slayertrophy_bloomcaller', bestiarySection:'enemyKills', bestiaryId:'bloomcaller', threshold:20 });
addAchievement({ id:'slayer_tidemender', name:'Tide Mender Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Tide Mender.', category:'Slayer', itemId:'slayertrophy_tidemender', bestiarySection:'enemyKills', bestiaryId:'tidemender', threshold:20 });
addAchievement({ id:'slayer_currentweaver', name:'Current Weaver Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Current Weaver.', category:'Slayer', itemId:'slayertrophy_currentweaver', bestiarySection:'enemyKills', bestiaryId:'currentweaver', threshold:20 });
addAchievement({ id:'slayer_glitchstalker', name:'Glitch Stalker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Glitch Stalker.', category:'Slayer', itemId:'slayertrophy_glitchstalker', bestiarySection:'enemyKills', bestiaryId:'glitchstalker', threshold:20 });
addAchievement({ id:'slayer_fracturebrute', name:'Fracture Brute Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Fracture Brute.', category:'Slayer', itemId:'slayertrophy_fracturebrute', bestiarySection:'enemyKills', bestiaryId:'fracturebrute', threshold:20 });
addAchievement({ id:'slayer_stutterleaper', name:'Stutter Leaper Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Stutter Leaper.', category:'Slayer', itemId:'slayertrophy_stutterleaper', bestiarySection:'enemyKills', bestiaryId:'stutterleaper', threshold:20 });
addAchievement({ id:'slayer_phasecircler', name:'Phase Circler Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Phase Circler.', category:'Slayer', itemId:'slayertrophy_phasecircler', bestiarySection:'enemyKills', bestiaryId:'phasecircler', threshold:20 });
addAchievement({ id:'slayer_shardsplitter', name:'Shard Splitter Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Shard Splitter.', category:'Slayer', itemId:'slayertrophy_shardsplitter', bestiarySection:'enemyKills', bestiaryId:'shardsplitter', threshold:20 });
addAchievement({ id:'slayer_discordmarksman', name:'Discord Marksman Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Discord Marksman.', category:'Slayer', itemId:'slayertrophy_discordmarksman', bestiarySection:'enemyKills', bestiaryId:'discordmarksman', threshold:20 });
addAchievement({ id:'slayer_warpblinker', name:'Warp Blinker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Warp Blinker.', category:'Slayer', itemId:'slayertrophy_warpblinker', bestiarySection:'enemyKills', bestiaryId:'warpblinker', threshold:20 });
addAchievement({ id:'slayer_refrainsentry', name:'Refrain Sentry Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Refrain Sentry.', category:'Slayer', itemId:'slayertrophy_refrainsentry', bestiarySection:'enemyKills', bestiaryId:'refrainsentry', threshold:20 });
addAchievement({ id:'slayer_clipstalker', name:'Clip Stalker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Clip Stalker.', category:'Slayer', itemId:'slayertrophy_clipstalker', bestiarySection:'enemyKills', bestiaryId:'clipstalker', threshold:20 });
addAchievement({ id:'slayer_distortionbrute', name:'Distortion Brute Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Distortion Brute.', category:'Slayer', itemId:'slayertrophy_distortionbrute', bestiarySection:'enemyKills', bestiaryId:'distortionbrute', threshold:20 });
addAchievement({ id:'slayer_peakcharger', name:'Peak Charger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Peak Charger.', category:'Slayer', itemId:'slayertrophy_peakcharger', bestiarySection:'enemyKills', bestiaryId:'peakcharger', threshold:20 });
addAchievement({ id:'slayer_screamturret', name:'Scream Turret Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Scream Turret.', category:'Slayer', itemId:'slayertrophy_screamturret', bestiarySection:'enemyKills', bestiaryId:'screamturret', threshold:20 });
addAchievement({ id:'slayer_crushmortar', name:'Crush Mortar Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Crush Mortar.', category:'Slayer', itemId:'slayertrophy_crushmortar', bestiarySection:'enemyKills', bestiaryId:'crushmortar', threshold:20 });
addAchievement({ id:'slayer_feedbackflyer', name:'Feedback Flyer Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Feedback Flyer.', category:'Slayer', itemId:'slayertrophy_feedbackflyer', bestiarySection:'enemyKills', bestiaryId:'feedbackflyer', threshold:20 });
addAchievement({ id:'slayer_redlinelurker', name:'Redline Lurker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Redline Lurker.', category:'Slayer', itemId:'slayertrophy_redlinelurker', bestiarySection:'enemyKills', bestiaryId:'redlinelurker', threshold:20 });
addAchievement({ id:'slayer_wailmites', name:'Wail Mites Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Wail Mites.', category:'Slayer', itemId:'slayertrophy_wailmites', bestiarySection:'enemyKills', bestiaryId:'wailmites', threshold:20 });
addAchievement({ id:'slayer_onbeatstalker', name:'Onbeat Stalker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Onbeat Stalker.', category:'Slayer', itemId:'slayertrophy_onbeatstalker', bestiarySection:'enemyKills', bestiaryId:'onbeatstalker', threshold:20 });
addAchievement({ id:'slayer_downbeatbrute', name:'Downbeat Brute Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Downbeat Brute.', category:'Slayer', itemId:'slayertrophy_downbeatbrute', bestiarySection:'enemyKills', bestiaryId:'downbeatbrute', threshold:20 });
addAchievement({ id:'slayer_crescendocharger', name:'Crescendo Charger Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Crescendo Charger.', category:'Slayer', itemId:'slayertrophy_crescendocharger', bestiarySection:'enemyKills', bestiaryId:'crescendocharger', threshold:20 });
addAchievement({ id:'slayer_apexmarksman', name:'Apex Marksman Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Apex Marksman.', category:'Slayer', itemId:'slayertrophy_apexmarksman', bestiarySection:'enemyKills', bestiaryId:'apexmarksman', threshold:20 });
addAchievement({ id:'slayer_codablinker', name:'Coda Blinker Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Coda Blinker.', category:'Slayer', itemId:'slayertrophy_codablinker', bestiarySection:'enemyKills', bestiaryId:'codablinker', threshold:20 });
addAchievement({ id:'slayer_resonancewarden', name:'Resonance Warden Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Resonance Warden.', category:'Slayer', itemId:'slayertrophy_resonancewarden', bestiarySection:'enemyKills', bestiaryId:'resonancewarden', threshold:20 });
addAchievement({ id:'slayer_finalemortar', name:'Finale Mortar Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Finale Mortar.', category:'Slayer', itemId:'slayertrophy_finalemortar', bestiarySection:'enemyKills', bestiaryId:'finalemortar', threshold:20 });
addAchievement({ id:'slayer_goldenmites', name:'Golden Mites Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Golden Mites.', category:'Slayer', itemId:'slayertrophy_goldenmites', bestiarySection:'enemyKills', bestiaryId:'goldenmites', threshold:20 });
addAchievement({ id:'slayer_swarmerdnb', name:'Swarmer Hunter', icon:'💀',
  desc:'Defeat 20 of the DNB Swarmer.', category:'Slayer', itemId:'slayertrophy_swarmerdnb', bestiarySection:'enemyKills', bestiaryId:'swarmerdnb', threshold:20 });

/* -- Bosses. Threshold 5, not 20: a boss is one kill per boss room, so 20 would
   be an order of magnitude past the regular-enemy ask. Their names are proper
   nouns ('The Bone Sentinel', 'Grung, the DNB Warlord') rather than 'DNB <noun>'
   like the enemies above, so the desc uses '<name> 5 times' — 'of the The Bone
   Sentinel' would double the article. Still pluralization-free, still verbatim. -- */
addAchievement({ id:'slayer_boss_warlord', name:'Grung, the Warlord Hunter', icon:'👹',
  desc:'Defeat Grung, the DNB Warlord 5 times.', category:'Slayer', itemId:'slayertrophy_boss_warlord', bestiarySection:'enemyKills', bestiaryId:'warlord', threshold:5 });
addAchievement({ id:'slayer_boss_bonesentinel', name:'Bone Sentinel Hunter', icon:'👹',
  desc:'Defeat The Bone Sentinel 5 times.', category:'Slayer', itemId:'slayertrophy_boss_bonesentinel', bestiarySection:'enemyKills', bestiaryId:'bonesentinel', threshold:5 });
addAchievement({ id:'slayer_boss_bonecaller', name:'Skrell, the Bonecaller Hunter', icon:'👹',
  desc:'Defeat Skrell, the DNB Bonecaller 5 times.', category:'Slayer', itemId:'slayertrophy_boss_bonecaller', bestiarySection:'enemyKills', bestiaryId:'bonecaller', threshold:5 });
addAchievement({ id:'slayer_boss_gravechorus', name:'Grave Chorus Hunter', icon:'👹',
  desc:'Defeat The Grave Chorus 5 times.', category:'Slayer', itemId:'slayertrophy_boss_gravechorus', bestiarySection:'enemyKills', bestiaryId:'gravechorus', threshold:5 });
addAchievement({ id:'slayer_boss_colossus', name:'Colossus Husk Hunter', icon:'👹',
  desc:'Defeat The Colossus Husk 5 times.', category:'Slayer', itemId:'slayertrophy_boss_colossus', bestiarySection:'enemyKills', bestiaryId:'colossus', threshold:5 });
addAchievement({ id:'slayer_boss_brambleQueen', name:'Bramble Queen Hunter', icon:'👹',
  desc:'Defeat The Bramble Queen 5 times.', category:'Slayer', itemId:'slayertrophy_boss_brambleQueen', bestiarySection:'enemyKills', bestiaryId:'brambleQueen', threshold:5 });
addAchievement({ id:'slayer_boss_rotbloom', name:'Rot Bloom Hunter', icon:'👹',
  desc:'Defeat The Rot Bloom 5 times.', category:'Slayer', itemId:'slayertrophy_boss_rotbloom', bestiarySection:'enemyKills', bestiaryId:'rotbloom', threshold:5 });
addAchievement({ id:'slayer_boss_antlerwarden', name:'Antler Warden Hunter', icon:'👹',
  desc:'Defeat The Antler Warden 5 times.', category:'Slayer', itemId:'slayertrophy_boss_antlerwarden', bestiarySection:'enemyKills', bestiaryId:'antlerwarden', threshold:5 });
addAchievement({ id:'slayer_boss_hivemother', name:'Hive Mother Hunter', icon:'👹',
  desc:'Defeat The Hive Mother 5 times.', category:'Slayer', itemId:'slayertrophy_boss_hivemother', bestiarySection:'enemyKills', bestiaryId:'hivemother', threshold:5 });
addAchievement({ id:'slayer_boss_sandwyrm', name:'Sand Wyrm Hunter', icon:'👹',
  desc:'Defeat The Sand Wyrm 5 times.', category:'Slayer', itemId:'slayertrophy_boss_sandwyrm', bestiarySection:'enemyKills', bestiaryId:'sandwyrm', threshold:5 });
addAchievement({ id:'slayer_boss_glassscorpion', name:'Glass Scorpion Hunter', icon:'👹',
  desc:'Defeat The Glass Scorpion 5 times.', category:'Slayer', itemId:'slayertrophy_boss_glassscorpion', bestiarySection:'enemyKills', bestiaryId:'glassscorpion', threshold:5 });
addAchievement({ id:'slayer_boss_duneravager', name:'Dune Ravager Hunter', icon:'👹',
  desc:'Defeat The Dune Ravager 5 times.', category:'Slayer', itemId:'slayertrophy_boss_duneravager', bestiarySection:'enemyKills', bestiaryId:'duneravager', threshold:5 });
addAchievement({ id:'slayer_boss_ashtyrant', name:'Ash Tyrant Hunter', icon:'👹',
  desc:'Defeat The Ash Tyrant 5 times.', category:'Slayer', itemId:'slayertrophy_boss_ashtyrant', bestiarySection:'enemyKills', bestiaryId:'ashtyrant', threshold:5 });
addAchievement({ id:'slayer_boss_cindercolossus', name:'Cinder Colossus Hunter', icon:'👹',
  desc:'Defeat The Cinder Colossus 5 times.', category:'Slayer', itemId:'slayertrophy_boss_cindercolossus', bestiarySection:'enemyKills', bestiaryId:'cindercolossus', threshold:5 });
addAchievement({ id:'slayer_boss_magmawraith', name:'Magma Wraith Hunter', icon:'👹',
  desc:'Defeat The Magma Wraith 5 times.', category:'Slayer', itemId:'slayertrophy_boss_magmawraith', bestiarySection:'enemyKills', bestiaryId:'magmawraith', threshold:5 });
addAchievement({ id:'slayer_boss_brimstonehorror', name:'Brimstone Horror Hunter', icon:'👹',
  desc:'Defeat The Brimstone Horror 5 times.', category:'Slayer', itemId:'slayertrophy_boss_brimstonehorror', bestiarySection:'enemyKills', bestiaryId:'brimstonehorror', threshold:5 });
addAchievement({ id:'slayer_boss_furnaceheart', name:'Furnace Heart Hunter', icon:'👹',
  desc:'Defeat The Furnace Heart 5 times.', category:'Slayer', itemId:'slayertrophy_boss_furnaceheart', bestiarySection:'enemyKills', bestiaryId:'furnaceheart', threshold:5 });
addAchievement({ id:'slayer_boss_slagbound', name:'Slagbound Effigy Hunter', icon:'👹',
  desc:'Defeat The Slagbound Effigy 5 times.', category:'Slayer', itemId:'slayertrophy_boss_slagbound', bestiarySection:'enemyKills', bestiaryId:'slagbound', threshold:5 });
addAchievement({ id:'slayer_boss_shadowstalker', name:'Shadow Stalker Hunter', icon:'👹',
  desc:'Defeat The Shadow Stalker 5 times.', category:'Slayer', itemId:'slayertrophy_boss_shadowstalker', bestiarySection:'enemyKills', bestiaryId:'shadowstalker', threshold:5 });
addAchievement({ id:'slayer_boss_stormbringer', name:'Stormbringer Hunter', icon:'👹',
  desc:'Defeat The Stormbringer 5 times.', category:'Slayer', itemId:'slayertrophy_boss_stormbringer', bestiarySection:'enemyKills', bestiaryId:'stormbringer', threshold:5 });
addAchievement({ id:'slayer_boss_frostsentinel', name:'Frost Sentinel Hunter', icon:'👹',
  desc:'Defeat The Frost Sentinel 5 times.', category:'Slayer', itemId:'slayertrophy_boss_frostsentinel', bestiarySection:'enemyKills', bestiaryId:'frostsentinel', threshold:5 });
addAchievement({ id:'slayer_boss_brickgolem', name:'Brick Golem Hunter', icon:'👹',
  desc:'Defeat The Brick Golem 5 times.', category:'Slayer', itemId:'slayertrophy_boss_brickgolem', bestiarySection:'enemyKills', bestiaryId:'brickgolem', threshold:5 });
addAchievement({ id:'slayer_boss_glacierfiend', name:'Glacier Fiend Hunter', icon:'👹',
  desc:'Defeat The Glacier Fiend 5 times.', category:'Slayer', itemId:'slayertrophy_boss_glacierfiend', bestiarySection:'enemyKills', bestiaryId:'glacierfiend', threshold:5 });

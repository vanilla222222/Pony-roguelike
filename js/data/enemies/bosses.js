'use strict';
// data/enemies/bosses.js — split from enemies.js: BOSS_TYPES.
const BOSS_TYPES = {
  warlord: { id:'warlord', name:'Grung, the DNB Warlord', hp:46, dmg:2, speed:82, radius:26,
    color:'#8a4b2b', dark:'#552c17', behavior:'bossWarlord', stage:0 },
  bonesentinel: { id:'bonesentinel', name:'The Bone Sentinel', hp:46, dmg:2, speed:62, radius:28,
    color:'#8a8578', dark:'#4a463c', behavior:'bossBoneSentinel', stage:0 },
  // -- Crypt, extended boss set (ai.js) --
  bonecaller: { id:'bonecaller', name:'Skrell, the DNB Bonecaller', hp:46, dmg:2, speed:54, radius:26,
    color:'#6a5a7a', dark:'#3a2f45', behavior:'bossBoneCaller', stage:0 },
  gravechorus: { id:'gravechorus', name:'The Grave Chorus', hp:48, dmg:2, speed:48, radius:27,
    color:'#9a8fa8', dark:'#4e4658', behavior:'bossGraveChorus', stage:0 },
  // -- Crypt, Phase 2 non-summoning pair — one glass cannon, one siege body,
  // joining warlord/bonesentinel/bonecaller/gravechorus above in stage 0's
  // random boss pool (see resolveGenericBoss). Calibrated against warlord
  // (hp46/dmg2/speed82/radius26, the fastest of the four above) and
  // bonesentinel (hp46/dmg2/speed62/radius28, the tankiest): eclipsewraith
  // sits below warlord's speed floor and above its hp floor to read as
  // genuinely glassy rather than just "warlord but weaker"; ironbastion
  // goes wider/slower/tougher than bonesentinel for the same reason on the
  // siege-body side. `burstRadius` is REQUIRED on ironbastion — see
  // render.js's drawEnemy ground-target marker, same as rotbloom below.
  eclipsewraith: { id:'eclipsewraith', name:'The Eclipse Wraith', hp:40, dmg:2, speed:96, radius:24,
    color:'#2c2440', dark:'#16101f', behavior:'bossEclipseWraith', stage:0 },
  ironbastion: { id:'ironbastion', name:'The Iron Bastion', hp:58, dmg:3, speed:36, radius:32,
    color:'#5a5a62', dark:'#2c2c32', behavior:'bossIronBastion', burstRadius:85, stage:0 },


  colossus: { id:'colossus', name:'The Colossus Husk', hp:52, dmg:3, speed:40, radius:34,
    color:'#5e4530', dark:'#382a1c', behavior:'bossColossus', stage:1 },
  brambleQueen: { id:'brambleQueen', name:'The Bramble Queen', hp:48, dmg:2, speed:52, radius:27,
    color:'#4a7a3a', dark:'#274a20', behavior:'bossBrambleQueen', stage:1 },
  // -- Forest, extended boss set (ai.js). `burstRadius` is read by render.js's
  // drawEnemy to size the Rot Bloom's ground-target marker (the same field the
  // `lobber` enemies use) — its AoE is delayed and away from its own body, so
  // the landing spot has to be visible for the fight to be fair.
  rotbloom: { id:'rotbloom', name:'The Rot Bloom', hp:48, dmg:2, speed:46, radius:28,
    color:'#8a9a3a', dark:'#4a5218', behavior:'bossRotBloom', burstRadius:78, stage:1 },
  antlerwarden: { id:'antlerwarden', name:'The Antler Warden', hp:50, dmg:3, speed:52, radius:29,
    color:'#8a6a4a', dark:'#4a3524', behavior:'bossAntlerWarden', stage:1 },


  hivemother: { id:'hivemother', name:'The Hive Mother', hp:50, dmg:2, speed:56, radius:24,
    color:'#7a3f55', dark:'#4a2534', behavior:'bossHiveMother', stage:2 },
  sandwyrm: { id:'sandwyrm', name:'The Sand Wyrm', hp:50, dmg:3, speed:70, radius:26,
    color:'#d9b463', dark:'#8a6e35', behavior:'bossSandWyrm', stage:2 },
  // -- Desert, extended boss set (ai.js) --
  glassscorpion: { id:'glassscorpion', name:'The Glass Scorpion', hp:48, dmg:2, speed:74, radius:24,
    color:'#6ab49a', dark:'#316052', behavior:'bossGlassScorpion', stage:2 },
  duneravager: { id:'duneravager', name:'The Dune Ravager', hp:50, dmg:3, speed:68, radius:27,
    color:'#c98a4a', dark:'#6a4620', behavior:'bossDuneRavager', stage:2 },

  // ---- INFERNO (stage 3) — 4, twice the usual per-stage count, catching
  // this stage up now that it has a real identity (see the enemy roster above) ----
  ashtyrant: { id:'ashtyrant', name:'The Ash Tyrant', hp:52, dmg:3, speed:56, radius:30,
    color:'#c9382e', dark:'#6a1810', behavior:'bossAshTyrant', stage:3 },
  cindercolossus: { id:'cindercolossus', name:'The Cinder Colossus', hp:56, dmg:3, speed:36, radius:36,
    color:'#4a2418', dark:'#240f0a', behavior:'bossCinderColossus', stage:3 },
  magmawraith: { id:'magmawraith', name:'The Magma Wraith', hp:50, dmg:2, speed:66, radius:26,
    color:'#e0762e', dark:'#7a3a14', behavior:'bossMagmaWraith', stage:3 },
  brimstonehorror: { id:'brimstonehorror', name:'The Brimstone Horror', hp:52, dmg:3, speed:50, radius:28,
    color:'#8a3a1a', dark:'#4a1c0c', behavior:'bossBrimstoneHorror', stage:3 },
  // -- Inferno, extended boss set (ai.js) --
  furnaceheart: { id:'furnaceheart', name:'The Furnace Heart', hp:52, dmg:3, speed:44, radius:30,
    color:'#f0a03a', dark:'#8a5418', behavior:'bossFurnaceHeart', stage:3 },
  slagbound: { id:'slagbound', name:'The Slagbound Effigy', hp:54, dmg:3, speed:38, radius:32,
    color:'#9c3ac9', dark:'#52205c', behavior:'bossSlagbound', stage:3 },

  // ---- 9A / 9B / 10A / 10B — 2 apiece, floorKey-tagged (see the note above) ----
  shadowstalker: { id:'shadowstalker', name:'The Shadow Stalker', hp:52, dmg:2, speed:62, radius:24,
    color:'#2c2840', dark:'#15121f', behavior:'bossShadowStalker', floorKey:'9A' },
  stormbringer: { id:'stormbringer', name:'The Stormbringer', hp:52, dmg:2, speed:56, radius:25,
    color:'#4a4a70', dark:'#24243a', behavior:'bossStormbringer', floorKey:'9A' },


  frostsentinel: { id:'frostsentinel', name:'The Frost Sentinel', hp:52, dmg:2, speed:52, radius:24,
    color:'#7fa8c9', dark:'#3e5468', behavior:'bossFrostSentinel', floorKey:'9B' },
  brickgolem: { id:'brickgolem', name:'The Brick Golem', hp:56, dmg:3, speed:42, radius:28,
    color:'#8a5a4a', dark:'#4a2e24', behavior:'bossBrickGolem', floorKey:'9B' },


  glacierfiend: { id:'glacierfiend', name:'The Glacier Fiend', hp:56, dmg:3, speed:40, radius:30,
    color:'#9ac9e0', dark:'#4a6a7a', behavior:'bossGlacierFiend', floorKey:'10A' },
  blizzardwraith: { id:'blizzardwraith', name:'The Blizzard Wraith', hp:52, dmg:2, speed:76, radius:24,
    color:'#e8f4ff', dark:'#8aa8c0', behavior:'bossBlizzardWraith', floorKey:'10A' },


  vinehorror: { id:'vinehorror', name:'The Vine Horror', hp:56, dmg:3, speed:50, radius:29,
    color:'#3a6a2a', dark:'#1e3a15', behavior:'bossVineHorror', floorKey:'10B' },
  canopystalker: { id:'canopystalker', name:'The Canopy Stalker', hp:52, dmg:2, speed:66, radius:25,
    color:'#5a8a3a', dark:'#2e4a1c', behavior:'bossCanopyStalker', floorKey:'10B' },

  // ---- 11A / 11B / 12A / 12B — 2 apiece, floorKey-tagged, filling the second
  // (bonus) boss room those floors get. Floor 13 deliberately has NONE: it is
  // the finale and its single boss room always holds The One True DNB.
  //
  // Every one of these REUSES an existing bossXxx behavior rather than adding
  // AI — the eight picked are the ones no other floorKey boss already uses, and
  // none of them summons (so no off-theme Crypt/Desert minion turns up on a
  // drum-and-bass floor). hp only steps 54 -> 62 past 10A/10B's 52-56 because
  // bossHpScale is already ~13x-21x down here; it stays under the superbosses'
  // authored 68-76 so the floor's own capstone is still the bigger fight. ----
  subdrowner: { id:'subdrowner', name:'The Sub Drowner', hp:58, dmg:3, speed:44, radius:30,
    color:'#4f7fd8', dark:'#1e3468', behavior:'bossFurnaceHeart', floorKey:'11A' },
  pressurechoir: { id:'pressurechoir', name:'The Pressure Choir', hp:56, dmg:2, speed:48, radius:28,
    color:'#2e4a8a', dark:'#16244a', behavior:'bossGraveChorus', floorKey:'11A' },


  // burstRadius is read by ai.js's aiBossRotBloom AND render.js's drawEnemy to
  // size the delayed ground marker — without it the AoE lands unannounced.
  brinebloom: { id:'brinebloom', name:'The Brine Bloom', hp:56, dmg:3, speed:48, radius:28,
    color:'#2fe0c4', dark:'#12604c', behavior:'bossRotBloom', burstRadius:80, floorKey:'11B' },
  glassreef: { id:'glassreef', name:'The Glass Reef', hp:54, dmg:2, speed:76, radius:25,
    color:'#6ae0b4', dark:'#276a54', behavior:'bossGlassScorpion', floorKey:'11B' },


  feedbackeffigy: { id:'feedbackeffigy', name:'The Feedback Effigy', hp:60, dmg:3, speed:40, radius:32,
    color:'#b04ff0', dark:'#4e1c74', behavior:'bossSlagbound', floorKey:'12A' },
  brokenrefrain: { id:'brokenrefrain', name:'The Broken Refrain', hp:58, dmg:3, speed:54, radius:29,
    color:'#8a3ad9', dark:'#42186a', behavior:'bossAntlerWarden', floorKey:'12A' },


  redlineravager: { id:'redlineravager', name:'The Redline Ravager', hp:58, dmg:3, speed:70, radius:28,
    color:'#ff3d7a', dark:'#7a0e34', behavior:'bossDuneRavager', floorKey:'12B' },
  clippingcolossus: { id:'clippingcolossus', name:'The Clipping Colossus', hp:62, dmg:3, speed:38, radius:34,
    color:'#c9203a', dark:'#5c0c18', behavior:'bossColossus', floorKey:'12B' },

  // ---- PHASE 7b — floorKey '13' ("The Hollow Chorus") gets its own 2-boss
  // bonus pool, same glass-cannon/siege-body discipline as every floorKey
  // block above. Both REUSE existing bossXxx behaviors (bossShadowStalker,
  // bossFrostSentinel) — no new AI. hp is interpolated between the two
  // anchor points the plan specifies: the 12A/12B regular-boss floor (58-62)
  // and this floor's own superboss, wobbler (hp73, see superbosses.js) —
  // landing at 64/68 keeps both comfortably under wobbler so the floor's
  // capstone fight still reads as the bigger one. Cold blue-violet palette
  // pulled from HOLLOW_CHORUS_PALETTE (#6a7fc9), desaturated toward grey on
  // the siege body for variety.
  lastovertone: { id:'lastovertone', name:'The Last Overtone', hp:64, dmg:2, speed:84, radius:23,
    color:'#7a8ac0', dark:'#38406a', behavior:'bossShadowStalker', floorKey:'13' },
  hollowcantor: { id:'hollowcantor', name:'The Hollow Cantor', hp:68, dmg:3, speed:44, radius:31,
    color:'#525d80', dark:'#262c40', behavior:'bossFrostSentinel', floorKey:'13' },

  // ---- PHASE 7b — floorKey '14' ("The Final Waveform") gets the matching
  // 2-boss bonus pool, one floor deeper than '13' above. Anchored between
  // that '13' pair (64/68) and this floor's own superboss, subdrop (hp75,
  // see superbosses.js) — 70/73 keeps both under subdrop. Reuses
  // bossBrimstoneHorror (aggressive ranged burst, reads as the glass-cannon
  // role here) and bossCinderColossus (AoE slam siege body), same as the
  // plan specifies. Dark-red palette pulled from FINAL_WAVEFORM_PALETTE
  // (#e0604a), darkening toward near-black on the siege body.
  flatlinewraith: { id:'flatlinewraith', name:'The Flatline Wraith', hp:70, dmg:2, speed:80, radius:26,
    color:'#e0604a', dark:'#7a2e1a', behavior:'bossBrimstoneHorror', floorKey:'14' },
  zeroamplitude: { id:'zeroamplitude', name:'The Zero Amplitude', hp:73, dmg:3, speed:46, radius:34,
    color:'#8a2818', dark:'#3e1008', behavior:'bossCinderColossus', floorKey:'14' },

  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH A (Crypt + Forest) — BEGIN =====
     2 more bosses apiece for stage 0 and stage 1, taking both to 6. Same rule
     the 11A-12B block above follows: every one REUSES an existing bossXxx
     behavior rather than adding AI, and the four picked are ones no second
     boss already borrows AND that spawn no minions — so no off-theme Desert
     or Inferno adds turn up in a Crypt or Forest arena. The bossXxx functions
     hardcode their own pattern constants, so the differentiation levers a
     table entry actually has are hp/dmg/speed/radius — and speed is the big
     one, since every dash in those functions is `e.speed * <multiplier>`.
     Each entry below is therefore deliberately placed in a different weight
     class from the boss it borrows from, not just recoloured. ===== */

  // Crypt: a slow siege ram (bossBrickGolem, normally 9B's Brick Golem at
  // speed 42 / r28). At speed 36 the wind-up dash is ~15% slower but the body
  // is 4px wider than the Colossus Husk's — the arena runs out before it does.
  mausoleumtitan: { id:'mausoleumtitan', name:'The Mausoleum Titan', hp:50, dmg:3, speed:36, radius:32,
    color:'#6a6458', dark:'#38342c', behavior:'bossBrickGolem', stage:0 },
  // Crypt: the blink assassin (bossShadowStalker, normally 9A's Shadow Stalker
  // at hp 52 / speed 62 / r24). Inverted: the lowest boss HP in the game and
  // the smallest Crypt hitbox, but speed 78 makes the between-blink chase a
  // real pursuit instead of a stroll. Glass cannon vs. the Stalker's bruiser.
  sepulchershade: { id:'sepulchershade', name:'The Sepulcher Shade', hp:44, dmg:2, speed:78, radius:22,
    color:'#3f3a52', dark:'#1e1b29', behavior:'bossShadowStalker', stage:0 },

  // Forest: relentless pouncer (bossCanopyStalker, normally 10B's Canopy
  // Stalker at hp 52 / speed 66 / r25). Lighter and faster still — speed 74
  // through the function's 5.2x dash is the quickest lunge of any regular
  // boss — paid for with hp 44 and r22, so it dies if you actually hit it.
  hollowstag: { id:'hollowstag', name:'The Hollow Stag', hp:44, dmg:2, speed:74, radius:22,
    color:'#7a6a4a', dark:'#3f3624', behavior:'bossCanopyStalker', stage:1 },
  // Forest: artillery (bossFrostSentinel, normally 9B's Frost Sentinel at
  // hp 52 / dmg 2 / speed 52 / r24). At speed 40 its "back off" step barely
  // outpaces a walk, so it reads as an emplacement that happens to shuffle —
  // and dmg 3 / r30 makes closing on it the expensive option, which flips the
  // Sentinel's fight (kite it down) into a rush-it-or-eat-fans fight.
  fenwarden: { id:'fenwarden', name:'The Fen Warden', hp:50, dmg:3, speed:40, radius:30,
    color:'#5a7a6a', dark:'#2e4036', behavior:'bossFrostSentinel', stage:1 },
  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH A (Crypt + Forest) — END ===== */

  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH B (Desert + Inferno) — BEGIN =====
     2 more bosses apiece for stage 2 and stage 3, taking Desert to 6 and
     Inferno to 8. Same rule batch A and the 11A-12B block follow: every one
     REUSES an existing bossXxx behavior rather than adding AI, and the four
     picked (bossGlacierFiend, bossStormbringer, bossVineHorror,
     bossBlizzardWraith) are ones NO other boss already borrows AND that spawn
     no minions — so no off-theme Crypt or Forest add turns up in a Desert or
     Inferno arena. The bossXxx functions hardcode their own pattern constants,
     so the only differentiation levers a table entry has are hp/dmg/speed/
     radius — and speed is the big one, since every dash and every retreat step
     in those functions is `e.speed * <multiplier>`. Each entry below is
     therefore deliberately placed in a different weight class from its donor,
     and the two per stage are deliberately opposites of each other: one glass
     cannon, one siege body. ===== */

  // Desert: the glass cannon (bossGlacierFiend, normally 10A's Glacier Fiend
  // at hp 56 / dmg 3 / speed 40 / r30). Inverted wholesale — the lightest body
  // of any Desert boss and the lowest hp, but speed 72 means it is ON you
  // between nova telegraphs instead of lumbering, so the ring goes off at
  // point blank. Kill it fast or eat every ring.
  sunflaredjinn: { id:'sunflaredjinn', name:'The Sunflare Djinn', hp:44, dmg:2, speed:72, radius:22,
    color:'#f0c04a', dark:'#8a6a14', behavior:'bossGlacierFiend', stage:2 },
  // Desert: the siege body (bossStormbringer, normally 9A's Stormbringer at
  // hp 52 / dmg 2 / speed 56 / r25). At speed 34 its 0.6x chase barely closes
  // ground, so the radial bursts become a zoning puzzle rather than a chase —
  // and hp 56 / dmg 3 / r33 makes it the widest, toughest thing in the stage.
  sandstonebehemoth: { id:'sandstonebehemoth', name:'The Sandstone Behemoth', hp:56, dmg:3, speed:34, radius:33,
    color:'#b09060', dark:'#5e4a30', behavior:'bossStormbringer', stage:2 },

  // Inferno: the glass cannon (bossVineHorror, normally 10B's Vine Horror at
  // hp 56 / dmg 3 / speed 50 / r29). The function's lunge is `e.speed * 4.5`,
  // so speed 78 turns a telegraphed shove into a room-crossing pounce — paid
  // for with hp 46 / dmg 2 / r23, the smallest Inferno boss hitbox.
  emberlash: { id:'emberlash', name:'The Emberlash', hp:46, dmg:2, speed:78, radius:23,
    color:'#ff5a2e', dark:'#8a2410', behavior:'bossVineHorror', stage:3 },
  // Inferno: the siege body (bossBlizzardWraith, normally 10A's Blizzard
  // Wraith at hp 52 / dmg 2 / speed 76 / r24 — a fast erratic drifter). Halved
  // in speed to 44, the same wander reads as a slow menacing sweep you can
  // out-walk, so the fight becomes about its bolts rather than its body; hp 58
  // / dmg 3 / r31 makes standing in the way the losing option.
  ashfallleviathan: { id:'ashfallleviathan', name:'The Ashfall Leviathan', hp:58, dmg:3, speed:44, radius:31,
    color:'#5a4a44', dark:'#2c2422', behavior:'bossBlizzardWraith', stage:3 },
  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH B (Desert + Inferno) — END ===== */

  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH C (9A/9B/10A/10B) — BEGIN =====
     2 more bosses apiece for the four branch floors, taking each to 4. Same
     rule batches A and B and the 11A-12B block follow: every one REUSES an
     existing bossXxx behavior rather than adding AI, and none of the eight
     picked spawns minions — so no off-theme Crypt/Desert add turns up on a
     branch floor. The eight donors here are exactly the set the 11A-12B block
     borrows (bossGraveChorus, bossDuneRavager, bossSlagbound,
     bossGlassScorpion, bossFurnaceHeart, bossColossus, bossRotBloom,
     bossAntlerWarden) — deliberately NOT the four batch A borrowed or the
     four batch B borrowed, and never the donor a same-floorKey boss already
     uses. The bossXxx functions hardcode their own pattern constants, so the
     only differentiation levers a table entry has are hp/dmg/speed/radius —
     speed most of all, since every dash and retreat step is
     `e.speed * <multiplier>`. Each pair below is one glass cannon and one
     siege body, and each entry is pushed outside the weight class of BOTH
     existing entries on its donor behavior. hp stays inside 44-62: the
     branch-floor bosses above sit at 52-56 and bossHpScale (1.28^floorNum) is
     already ~8-10x at floorNum 8-9, so the spread is authored small on
     purpose. ===== */

  // 9A: glass cannon (bossGraveChorus — gravechorus hp48/spd48/r27, and 11A's
  // Pressure Choir hp56/spd48/r28; both are slow chanters). At speed 72 the
  // chorus closes between volleys instead of holding station, so its rings
  // land point blank — paid for with hp 46 and the smallest 9A boss body.
  wailingdark: { id:'wailingdark', name:'The Wailing Dark', hp:46, dmg:2, speed:72, radius:22,
    color:'#2a2338', dark:'#13101c', behavior:'bossGraveChorus', floorKey:'9A' },
  // 9A: siege body (bossDuneRavager — duneravager spd68/r27, and 12B's Redline
  // Ravager hp58/spd70/r28; both are sprinters). Halved to speed 40, the same
  // ravage pattern reads as a rolling storm front you can out-walk but not
  // out-trade: hp 60 / dmg 3 / r33 makes standing in it the losing option.
  thunderhead: { id:'thunderhead', name:'The Thunderhead', hp:60, dmg:3, speed:40, radius:33,
    color:'#3f4a86', dark:'#1e2444', behavior:'bossDuneRavager', floorKey:'9A' },

  // 9B: glass cannon (bossSlagbound — slagbound hp54/spd38/r32, and 12A's
  // Feedback Effigy hp60/spd40/r32; both are immobile siege slabs). Inverted
  // wholesale at speed 62 / hp 46 / r24 — the first version of this pattern
  // that actually chases you around its own hazards.
  rimeeffigy: { id:'rimeeffigy', name:'The Rime Effigy', hp:46, dmg:2, speed:62, radius:24,
    color:'#a8d4ec', dark:'#4a6c80', behavior:'bossSlagbound', floorKey:'9B' },
  // 9B: siege body (bossGlassScorpion — glassscorpion hp48/spd74/r24, and 11B's
  // Glass Reef hp54/spd76/r25; both are darters). At speed 44 the dart becomes
  // a shove, and hp 58 / dmg 3 / r31 turns the fight from dodge-the-blur into
  // grind-down-the-wall — the masonry half of 9B's identity, not the ice half.
  rampartcrawler: { id:'rampartcrawler', name:'The Rampart Crawler', hp:58, dmg:3, speed:44, radius:31,
    color:'#9c6448', dark:'#4e3122', behavior:'bossGlassScorpion', floorKey:'9B' },

  // 10A: glass cannon (bossFurnaceHeart — furnaceheart hp52/spd44/r30, and
  // 11A's Sub Drowner hp58/spd44/r30; both are lumbering cores). At speed 72 /
  // hp 46 / r23 the core is a darting mote — the same radial pressure, but you
  // can no longer simply walk out of its footprint.
  whiteoutheart: { id:'whiteoutheart', name:'The Whiteout Heart', hp:46, dmg:2, speed:72, radius:23,
    color:'#eef8ff', dark:'#8fb0c4', behavior:'bossFurnaceHeart', floorKey:'10A' },
  // 10A: mid-weight brawler (bossColossus — colossus hp52/spd40/r34, and 12B's
  // Clipping Colossus hp62/spd38/r34; both are the widest bodies in the game).
  // At r24 / speed 64 this is the first small, quick colossus: hp 48 / dmg 2,
  // so it trades the pattern's usual immovability for genuine pursuit.
  calvingtitan: { id:'calvingtitan', name:'The Calving Titan', hp:48, dmg:2, speed:64, radius:24,
    color:'#6fa8c9', dark:'#345264', behavior:'bossColossus', floorKey:'10A' },

  // 10B: glass cannon (bossRotBloom — rotbloom hp48/spd46/r28, and 11B's Brine
  // Bloom hp56/spd48/r28). speed 74 / hp 46 / r23, and burstRadius 66 (the
  // smallest of the three) so the delayed pool is a precise punish rather than
  // area denial. burstRadius is REQUIRED — ai.js and render.js both read it to
  // size and draw the ground marker; without it the AoE lands unannounced.
  feverblossom: { id:'feverblossom', name:'The Fever Blossom', hp:46, dmg:2, speed:74, radius:23,
    color:'#e0609c', dark:'#7a2a50', behavior:'bossRotBloom', burstRadius:66, floorKey:'10B' },
  // 10B: siege body (bossAntlerWarden — antlerwarden hp50/dmg3/spd52/r29, and
  // 12A's Broken Refrain hp58/spd54/r29). At speed 36 the warden's charge is a
  // slow gore you can sidestep, but hp 62 / r34 makes it the largest and
  // toughest thing on either branch floor — a pure attrition capstone.
  bogtuskwarden: { id:'bogtuskwarden', name:'The Bogtusk Warden', hp:62, dmg:3, speed:36, radius:34,
    color:'#5a4a2e', dark:'#2c2417', behavior:'bossAntlerWarden', floorKey:'10B' },
  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH C (9A/9B/10A/10B) — END ===== */

  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH D (11A/11B/12A/12B) — BEGIN =====
     2 more bosses apiece for the four deepest branch floors, taking each to 4.
     Same rule every earlier block follows: REUSE an existing bossXxx behavior
     rather than adding AI, and never one that spawns minions — a check of
     ai.js says the only non-summoning boss functions in the game are the
     fifteen 9A-10B "bonus boss" patterns plus bossColossus, so the donor pool
     is exactly sixteen. All sixteen were already borrowed once by the base
     11A-12B block and batches A/B/C, so batch D borrows the eight that the
     ORIGINAL 11A-12B block did NOT use (batch A's and batch B's four apiece:
     bossFrostSentinel, bossShadowStalker, bossVineHorror, bossGlacierFiend,
     bossBlizzardWraith, bossStormbringer, bossCanopyStalker, bossBrickGolem)
     — so no boss on any of these floors shares a pattern with its neighbour,
     and every donor across the whole update now carries exactly three users.
     The bossXxx functions hardcode their pattern constants, so hp/dmg/speed/
     radius are the only differentiation levers — speed most of all, since
     every dash and retreat step is `e.speed * <multiplier>`. Each pair is one
     glass cannon and one siege body, and each entry sits outside the weight
     class of BOTH existing users of its donor. hp stays inside 44-62 for the
     same reason batch C's does: bossHpScale (1.28^floorNum) is already ~10x
     down here, and these must stay under the superbosses' authored 68-76. ==*/

  // 11A: glass cannon (bossFrostSentinel — frostsentinel hp52/dmg2/spd52/r24,
  // and batch A's Fen Warden hp50/dmg3/spd40/r30; both hold ground and fan).
  // At speed 76 the "back off" step outruns you, so the fan chases instead of
  // zoning — paid for with hp 44 / r22, the smallest body on the floor.
  sonarlance: { id:'sonarlance', name:'The Sonar Lance', hp:44, dmg:2, speed:76, radius:22,
    color:'#8ab8f0', dark:'#3a5480', behavior:'bossFrostSentinel', floorKey:'11A' },
  // 11A: siege body (bossShadowStalker — shadowstalker hp52/spd62/r24, and
  // batch A's Sepulcher Shade hp44/spd78/r22; both are blink assassins). At
  // speed 36 the between-blink chase is a crawl, so the blink itself becomes
  // the whole threat: hp 62 / dmg 3 / r33 means the reappearance hurts.
  abyssrender: { id:'abyssrender', name:'The Abyss Render', hp:62, dmg:3, speed:36, radius:33,
    color:'#16264a', dark:'#0a1226', behavior:'bossShadowStalker', floorKey:'11A' },

  // 11B: siege body (bossVineHorror — vinehorror hp56/dmg3/spd50/r29, and
  // batch B's Emberlash hp46/dmg2/spd78/r23). The function's lunge is
  // `e.speed * 4.5`, so speed 34 turns the pounce into a slow shove you can
  // sidestep — and hp 62 / r34 makes out-trading it the losing option.
  reefleviathan: { id:'reefleviathan', name:'The Reef Leviathan', hp:62, dmg:3, speed:34, radius:34,
    color:'#137a68', dark:'#093c34', behavior:'bossVineHorror', floorKey:'11B' },
  // 11B: glass cannon (bossGlacierFiend — glacierfiend hp56/dmg3/spd40/r30,
  // and batch B's Sunflare Djinn hp44/dmg2/spd72/r22). Pushed past even the
  // Djinn at speed 84 / r21: the fastest nova carrier in the game, so its
  // rings go off point blank every time. hp 46 is the price.
  tidefiend: { id:'tidefiend', name:'The Tide Fiend', hp:46, dmg:2, speed:84, radius:21,
    color:'#7af0d0', dark:'#2f7a68', behavior:'bossGlacierFiend', floorKey:'11B' },

  // 12A: glass cannon (bossBlizzardWraith — blizzardwraith hp52/dmg2/spd76/
  // r24, and batch B's Ashfall Leviathan hp58/dmg3/spd44/r31). At speed 90 /
  // r20 the erratic drift becomes genuinely unreadable — the fastest and
  // smallest boss body in the game, and hp 44 the lowest.
  fractalwraith: { id:'fractalwraith', name:'The Fractal Wraith', hp:44, dmg:2, speed:90, radius:20,
    color:'#e0b4ff', dark:'#6a5480', behavior:'bossBlizzardWraith', floorKey:'12A' },
  // 12A: siege body (bossStormbringer — stormbringer hp52/dmg2/spd56/r25, and
  // batch B's Sandstone Behemoth hp56/dmg3/spd34/r33). Taken further still:
  // speed 24 through the function's 0.6x chase is effectively stationary, so
  // the radial bursts are pure zoning, and r36 is the widest body in the game.
  monolithofnoise: { id:'monolithofnoise', name:'The Monolith of Noise', hp:62, dmg:3, speed:24, radius:36,
    color:'#4a2a70', dark:'#241338', behavior:'bossStormbringer', floorKey:'12A' },

  // 12B: siege body (bossCanopyStalker — canopystalker hp52/dmg2/spd66/r25,
  // and batch A's Hollow Stag hp44/dmg2/spd74/r22; both are light pouncers).
  // Inverted at speed 38 / hp 62 / dmg 3 / r33 — the pounce lands as a slab
  // instead of a blur, which suits 12B's all-pressure-no-support roster.
  clippingstag: { id:'clippingstag', name:'The Clipping Stag', hp:62, dmg:3, speed:38, radius:33,
    color:'#7a0c26', dark:'#3c0612', behavior:'bossCanopyStalker', floorKey:'12B' },
  // 12B: glass cannon (bossBrickGolem — brickgolem hp56/dmg3/spd42/r28, and
  // batch A's Mausoleum Titan hp50/dmg3/spd36/r32; both are siege rams). The
  // first fast one: speed 80 / hp 44 / dmg 2 / r21 turns the wind-up dash into
  // a room-crossing snap, so the tell you used to walk away from now lands.
  transientgolem: { id:'transientgolem', name:'The Transient Golem', hp:44, dmg:2, speed:80, radius:21,
    color:'#ffb0c0', dark:'#7a5058', behavior:'bossBrickGolem', floorKey:'12B' },
  /* ===== GAMEPLAY UPDATE 2 — CONTENT BATCH D (11A/11B/12A/12B) — END ===== */
};
const BOSS_LIST = Object.values(BOSS_TYPES);

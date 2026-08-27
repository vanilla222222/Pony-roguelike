'use strict';
// systems/items-1.js — split from items.js (part 1/2).
'use strict';
/* ============================================================
   items.js — passive/active item effects, stat recalculation,
   and shop purchase logic.
   ============================================================ */

function recalcPlayerStats(player){
  const p = player.passives;
  const t = player.trinketId; // single-slot trinket effect — see equipTrinket() below
  const crown = p.championscrown || 0; // Completionist capstone reward
  // Synergy A: Ecosystem Set — own at least one item from each of the three
  // new attackLayer families (markedForDeath/venomBloom/skyfall, see data.js
  // and attackStyles.js) and both melee/ranged damage get a small flat bump,
  // folded into meleeDamage/rangedDamage's own expressions above/below.
  // Computed early since meleeDamage is one of the first stats built below.
  // Mega A step 5: the condition, the flag name and the +0.3 numbers now live
  // in SYNERGY_COMBOS (systems/items-synergy.js) — this call evaluates that
  // registry entry here, at the exact point the hand-written boolean used to
  // sit, and stores player.ecosystemSetActive. See that file's LEGACY STAGE
  // note for why legacy combos keep their evaluation position.
  const ecosystemSetActive = applySynergyComboFlag(player, 'ecosystemSet');
  // Phase 5b — one-shot lifetime stat the first time this run's player
  // actually assembles the Ecosystem Set, backing the 'synergy_ecosystem'
  // achievement. recalcPlayerStats only runs on item/pill/star/familiar
  // pickup events (never per-frame — see the call sites), so this is not a
  // hot path; player._ecosystemSetSeen guards it to exactly once per run
  // even though the synergy can flicker on/off as items come and go.
  if (ecosystemSetActive && !player._ecosystemSetSeen) {
    player._ecosystemSetSeen = true;
    bumpStat('ecosystemSetActivations', 1);
  }
  // Phase 6a overhaul — each synergy is stored as a named boolean so the HUD
  // synergy badges (ui.js SYNERGY_BADGES) can read it without duplicating the
  // condition. applySynergyComboFlag (above/here) is what sets them now.
  // Synergy D: Pack Bond — 3+ familiars. Synergy E: Twin Fangs — own both
  // Fang Guard and Quiverstring at once (flag-only, no stat bonus).
  applySynergyComboFlag(player, 'packBond');
  applySynergyComboFlag(player, 'twinFangs');

  // luck first — status chances below scale off it
  player.luck = player.luckyPennies + 3 * (p.luckyclover || 0) + 1 * (p.luckup || 0) + 2 * crown + 2 * (p.gamblerscoin || 0)
    // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js) — luck contributions
    + 1 * (p.sk8i_luckbead || 0) + 3 * (p.sk8i_grandluck || 0)
    + 2 * (p.sk11i_starcompass || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — luck contributions
    + (t === 'astrallodestone' ? 2 : 0) + (t === 'cometgrit' ? 1 : 0) + (t === 'quasarpip' ? 2 : 0)
    + (t === 'zenithchit' ? 1 : 0) + (t === 'starchartscrap' ? 1 : 0) + 2 * (p.fatelensarray || 0)
    + 1 * (p.auspiciousorbit || 0) + 1 * (p.wishinghalo || 0) + 2 * (p.lodestarcompass || 0)
    + 1 * (p.cometdustpouch || 0)
    + 1 * (p.fourleafclover || 0)
    + 2 * (p.puritycharm || 0) + 1 * (p.ascendantcharm || 0) - 1 * (p.hollowsoul || 0) + 1 * (p.cursedhalo || 0)
    + 1 * (p.familiarfriend || 0) + 1 * (p.blessedwanderer || 0) + 1 * (p.chainreaction || 0)
    + (t === 'luckypaw' ? 2 : 0) + (t === 'luckyhorseshoe' ? 1 : 0) - (t === 'cursedcoin' ? 1 : 0) - (t === 'gildedcharm' ? 1 : 0)
    // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js) — luck contributions
    + (t === 'sk8t_fourleafpin' ? 2 : 0) + (t === 'sk8t_witchhazelcharm' ? 1 : 0) - (t === 'sk8t_leadenlocket' ? 1 : 0)
    // 75-achievement + 25-unlocked batch (see data.js) — luck contributions
    + 2 * (p.hiddenpassagecharm || 0) + 1 * (p.cartographerseye || 0) + 2 * (p.hoardersblessing || 0)
    + 1 * (p.vipmembershipcard || 0) + 1 * (p.dragonshoardshard || 0) + 2 * (p.goldenskeletonkey || 0)
    + 2 * (p.midasfingertip || 0) + 1 * (p.collectorssatchel || 0) + 2 * (p.curatorspendant || 0)
    + 1 * (p.charmbracelet || 0) + 1 * (p.menageriekeeperscloak || 0) + 1 * (p.apothecaryssatchel || 0)
    + 2 * (p.alchemistsformula || 0) + 1 * (p.crittercharm || 0) + 2 * (p.beastfriendsbond || 0)
    + 2 * (p.radianthalofragment || 0) + 2 * (p.gildedcompass || 0) + 1 * (p.moonkissedpelt || 0)
    + 1 * (p.feralfragment || 0) + 2 * (p.frostedbell || 0) + 1 * (p.roaringbrooch || 0)
    + 2 * (p.runicgauntlet || 0) + 2 * (p.shadowring || 0) + 1 * (p.onyxwisp || 0)
    + 1 * (p.lunarshard || 0) + (t === 'solarorb' ? 2 : 0) + (t === 'runicchain' ? 1 : 0)
    + (t === 'wildcrown' ? 2 : 0)
    + (t === 'fourleafbadge' ? 2 : 0) + (t === 'starlitpendant' ? 1 : 0)
    // 81-reward superboss-grid batch (see data.js) — luck contributions
    + (t === 'starweaveband' ? 2 : 0) + (t === 'gleamingacorn' ? 1 : 0) + (t === 'wishboneshard' ? 2 : 0)
    + (t === 'cloverpin' ? 1 : 0) + (t === 'fortunesthimble' ? 1 : 0) + (t === 'magpiefeather' ? 2 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — luck contributions
    + 1 * (p.masterytrophy_meleekills_t1 || 0) + 1 * (p.masterytrophy_turretsdestroyed_t2 || 0) + 1 * (p.explorationtrophy_rock || 0)
    // expand-everything batch (see data.js) — luck contributions
    + (t === 'fortunebead' ? 2 : 0) + (t === 'charmedpebble' ? 1 : 0) + (t === 'trefoiltoken' ? 2 : 0)
    - (t === 'grindstonechip' ? 1 : 0)
    // C-branch batch (see data.js) — luck contributions
    + (t === 'stormdrainpenny' ? 2 : 0) + (t === 'mossagate' ? 1 : 0) + (t === 'canopycharm' ? 2 : 0)
    + (t === 'gutterdice' ? 1 : 0)
    // newrewards-content batch trinkets (see data.js) — luck contributions
    + (t === 'fourleafpip' ? 1 : 0) + (t === 'fourleafdram' ? 1 : 0) + (t === 'auspiciouschit' ? 2 : 0)
    + (t === 'serendipitysprig' ? 2 : 0) + (t === 'auspiciousknot' ? 1 : 0) + (t === 'breezyknot' ? 1 : 0)
    + (t === 'glidingtrefoil' ? 1 : 0) + (t === 'auspiciousspyring' ? 1 : 0) + (t === 'acridtrefoil' ? 1 : 0)
    + (t === 'serendipitysole' ? 1 : 0) + (t === 'fortunatepawl' ? 2 : 0) + (t === 'whisperingfleck' ? 1 : 0)
    + (t === 'overlooktoken' ? 1 : 0) + (t === 'viciouschit' ? 1 : 0) + (t === 'fourleafstone' ? 1 : 0)
    + (t === 'bulwarkknot' ? 1 : 0) + (t === 'bilioustoken' ? 1 : 0) + (t === 'gleamingknuckle' ? 1 : 0)
    + (t === 'bracedwishbone' ? 1 : 0) + (t === 'dulldram' ? 1 : 0)
    // newrewards-content batch passives (see data.js) — luck contributions
    + 1 * (p.fortunaterelic || 0) + 1 * (p.ashencloak || 0) + 1 * (p.hallowedcharm || 0)
    + 1 * (p.sunkenreliquary || 0) + 1 * (p.hallowedgauntlet || 0) + 1 * (p.fortunateamulet || 0)
    + 1 * (p.fourleafrelic || 0) + 1 * (p.wishinglocket || 0)
    // Phase 1 overhaul (see data.js) — luck contributions
    + 2 * (p.quarrysigil || 0) + 1 * (p.bloomrot || 0) + 1 * (p.stormcaller || 0) + 2 * (p.celestialfall || 0)
    + 2 * (p.packwhistle || 0) + 1 * (p.quarryhoundtag || 0)
    + (t === 'slatependant' ? 2 : 0) + (t === 'hollowstonecoin' ? 1 : 0) + (t === 'crumblingsigil' ? 1 : 0) // Gargoyle superboss-grid batch (see data.js)
    // Phase 3 overhaul — Shrine batch (see data.js) — luck contributions
    + 1 * (p.shrinecandle || 0) + 2 * (p.eternaldevotion || 0)
    // Phase 4 overhaul — Arcade batch (see data/items-5.js) — luck contributions
    + 1 * (p.sparkfuse || 0) + 1 * (p.skeletonkeyring || 0) + 2 * (p.luckytoken || 0)
    + 1 * (p.jackpotcharm || 0) + 2 * (p.arcadecrown || 0)
    // Phase 7f — Hollow Chorus / Final Waveform trophy batch (see achievements/defs-7.js) — luck contributions
      + 1 * (p.hcfwtrophy_challenge_hc_floor_nodamage || 0)
    + 1 * (p.hcfwtrophy_challenge_fw_speedkill || 0) + 1 * (p.hcfwtrophy_exploration_meet_flatlinewraith || 0) + 1 * (p.hcfwtrophy_exploration_meet_flatlineburrower || 0)
    + 1 * (p.hcfwtrophy_collection_hc_roster_t1 || 0)
    // Phase 7g — Tangled Shallows trophy batch (see achievements/defs-8.js) — luck contributions
    + 1 * (p.mgtrophy_exploration_floor11c || 0) + 1 * (p.mgtrophy_meet_saltheron || 0) + 1 * (p.mgtrophy_meet_crabmortar || 0)
    + 1 * (p.mgtrophy_meet_mudlobster || 0) + 1 * (p.mgtrophy_collection_roster_t1 || 0)
    // Phase 7h — Observatory trophy batch (see achievements/defs-9.js) — luck contributions
    + 1 * (p.obstrophy_exploration_floor4d || 0) + 1 * (p.obstrophy_meet_starshard || 0) + 1 * (p.obstrophy_meet_gravitymortar || 0)
    + 1 * (p.obstrophy_meet_brassaegis || 0) + 1 * (p.obstrophy_meet_astrariumwatcher || 0)
    // Phase 7h (cont.) — Orrery trophy batch (see achievements/defs-10.js) — luck contributions
    + 1 * (p.ortrophy_exploration_floor6d || 0) + 1 * (p.ortrophy_meet_sparkcog || 0) + 1 * (p.ortrophy_meet_gearslinger || 0)
    + 1 * (p.ortrophy_meet_ironplate || 0) + 1 * (p.ortrophy_meet_heavygyro || 0)
    // Phase 7h (cont.) — The Void Between trophy batch (see achievements/defs-11.js) — luck contributions
      + 1 * (p.vbtrophy_meet_wreckspark || 0)
    + 1 * (p.vbtrophy_meet_voidslinger || 0) + 1 * (p.vbtrophy_collection_t2 || 0)
    // Phase 7h (cont.) — The Void Between PART 2 trophy batch (see achievements/defs-12.js) — luck contributions
    + 1 * (p.vbtrophy2_exploration_floor9d || 0) + 1 * (p.vbtrophy2_meet_fadingnova || 0) + 1 * (p.vbtrophy2_meet_witherslinger || 0)
    + 1 * (p.vbtrophy2_meet_horizonplate || 0) + 1 * (p.vbtrophy2_meet_gravmortar || 0)
    // Mega Update A step 5 — items-5.js tradeoff drawbacks (see data/items-5.js) — luck penalties
    - 1 * (p.blessedhalo || 0) - 1 * (p.forsakensignet || 0) - 1 * (p.crackedpendant || 0)
    + player.pillLuckBonus;
  const luckBonus = player.luck * 0.006; // +0.6% to on-hit status chances per luck point

  // pill "Up"/"Down" pairs are permanent and stack without limit, so every
  // formula they touch gets a floor — a long run of unlucky pulls should
  // still leave you playable, not negative-damage or unable to move.
  //
  // CEILING TOO, and this one is a correctness bound, not a taste call.
  // tryMoveEntity (combat.js) is a single-step collision test with no
  // substepping, and main.js clamps dt at 0.05s. A step longer than
  // TILE + 2*playerRadius (32 + 24 = 56px) can start on one side of a
  // one-tile wall and land clear on the other, i.e. walk through it. There
  // are ~35 additive speed sources below plus a x2 speed star (Vega), so the
  // old uncapped product was unbounded: 195 base * 5 * 2 = ~1950px/s = 97px
  // per worst-case frame, straight through geometry. 2.2 keeps the worst
  // case at 195 * 2.2 * 2 = 858px/s = 43px/frame, comfortably under 56.
  player.speed = player.baseSpeed * Util.clamp(1 + 0.15 * (p.downyfeather || 0) + 0.15 * (p.speedup || 0) + 0.10 * crown
    + 0.15 * (p.sk8i_windlace || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + 0.12 * (p.sk11i_windveil || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — speed contributions
    + (t === 'orbitalspur' ? 0.1 : 0) + (t === 'driftsole' ? 0.08 : 0) + (t === 'lightsailscrap' ? 0.1 : 0)
    + (t === 'escapevelocitypin' ? 0.08 : 0) + (t === 'meteorheel' ? 0.08 : 0) + 0.1 * (p.lightsailharness || 0)
    + 0.08 * (p.gravitycutter || 0) + 0.08 * (p.freefallcloak || 0) + 0.12 * (p.slipstreamrig || 0)
    + 0.08 * (p.driftboots || 0)
    + 0.10 * (p.swiftstep || 0) + 0.08 * (p.nimblegait || 0) - 0.08 * (p.gildedhoof || 0) - 0.10 * (p.brokenwatch || 0) - 0.10 * (p.witchbrew || 0)
    + 0.10 * (p.blessedhoof || 0) + 0.10 * (p.gildedwing || 0) - 0.08 * (p.demonhoof || 0) + 0.10 * (p.shadowstep || 0)
    + 0.05 * (p.familiarfriend || 0) + 0.05 * (p.undefeatedchampion || 0) + 0.10 * (p.pestcontrol || 0)
    + (t === 'mothwing' ? 0.12 : 0) - (t === 'rustybolt' ? 0.08 : 0) - (t === 'stackedcoin' ? 0.05 : 0)
    // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js) — speed contributions
    + (t === 'sk8t_windveil' ? 0.09 : 0) + (t === 'sk8t_leadenlocket' ? 0.14 : 0)
    - (t === 'sk8t_ironclasp' ? 0.10 : 0) - (t === 'sk8t_boggedgear' ? 0.05 : 0)
    - (t === 'sk8t_witchhazelcharm' ? 0.08 : 0) - (t === 'sk8t_twinnotch' ? 0.08 : 0)
    // 75-achievement + 25-unlocked batch (see data.js) — speed contributions
    + 0.08 * (p.beastmasterswhistle || 0) + 0.12 * (p.menageriekeeperscloak || 0) + 0.1 * (p.championssash || 0)
    + 0.1 * (p.explorersboots || 0) + 0.15 * (p.wanderersendurance || 0) + 0.1 * (p.ironhoofgauntlet || 0)
    + 0.08 * (p.crittercharm || 0) + 0.12 * (p.beastfriendsbond || 0) + 0.05 * (p.gauntletveteransmedal || 0)
    + 0.1 * (p.arenachampionsbelt || 0) + 0.1 * (p.swarmrepellent || 0) + 0.15 * (p.insecticidevial || 0)
    + 0.12 * (p.windsweptcloak || 0)
    // superboss rewards for Dragon/Windigo/Kelpie/Breezie (see data.js)
    + 0.15 * (p.gustwovenveil || 0) + (t === 'zephyrcharm' ? 0.10 : 0) - (t === 'scaledtalisman' ? 0.10 : 0)
    + 0.12 * (p.amberfragment || 0) + 0.08 * (p.sapphiretoken || 0) + 0.1 * (p.thunderfragment || 0)
    + 0.1 * (p.goldengauntlet || 0) + 0.1 * (p.lunarrune || 0) + 0.06 * (p.restlesschain || 0)
    + 0.08 * (p.velvetmedallion || 0) + 0.06 * (p.feralquill || 0) + 0.1 * (p.hollowwhistle || 0)
    + (t === 'astralquill' ? 0.1 : 0) + (t === 'tangledscroll' ? 0.1 : 0) + (t === 'coraltalisman' ? 0.1 : 0)
    + (t === 'windlacedcharm' ? 0.10 : 0) + (t === 'hurriedhoof' ? 0.08 : 0) + (t === 'restlessspur' ? 0.09 : 0)
    // 81-reward superboss-grid batch (see data.js) — speed contributions
    + (t === 'swiftbriar' ? 0.08 : 0) + (t === 'quicksilverspur' ? 0.10 : 0) + (t === 'breezyribbon' ? 0.07 : 0)
    + (t === 'fleetfootcharm' ? 0.09 : 0) + (t === 'galepin' ? 0.06 : 0) + (t === 'lightstepbead' ? 0.08 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — speed contributions
    + 0.05 * (p.masterytrophy_meleekills_t2 || 0) + 0.05 * (p.masterytrophy_bombbarrels_t1 || 0) + 0.05 * (p.explorationtrophy_tallrock || 0)
    // expand-everything batch (see data.js) — speed contributions
    + (t === 'tailwindcharm' ? 0.10 : 0) + (t === 'lightfoottoken' ? 0.07 : 0) + (t === 'swiftmark' ? 0.09 : 0)
    - (t === 'ironpin' ? 0.08 : 0)
    // C-branch batch (see data.js) — speed contributions
    + (t === 'slicksole' ? 0.12 : 0) + (t === 'runoffcurrent' ? 0.10 : 0) + (t === 'vinerunnersband' ? 0.14 : 0)
    + (t === 'wadingboot' ? 0.08 : 0)
    // newrewards-content batch trinkets (see data.js) — speed contributions
    + (t === 'nimbleribbon' ? 0.1 : 0) + (t === 'dartingribbon' ? 0.1 : 0) + (t === 'fleetquill' ? 0.1 : 0)
    + (t === 'swiftlace' ? 0.1 : 0) + (t === 'skimmingwisp' ? 0.1 : 0) + (t === 'breezyknot' ? 0.14 : 0)
    + (t === 'glidingtrefoil' ? 0.08 : 0) + (t === 'serendipitysole' ? 0.06 : 0) + (t === 'crimsonribbon' ? 0.06 : 0)
    + (t === 'wardinganklet' ? 0.08 : 0) + (t === 'glidingclapper' ? 0.08 : 0) + (t === 'rapidwisp' ? 0.1 : 0)
    + (t === 'concussivelace' ? 0.1 : 0) + (t === 'longplume' ? 0.1 : 0) + (t === 'airylocket' ? 0.06 : 0)
    + (t === 'lightlattice' ? 0.08 : 0) + (t === 'reaperanklet' ? 0.08 : 0) + (t === 'clangingquill' ? 0.08 : 0)
    + (t === 'jarringlace' ? 0.08 : 0) + (t === 'adoringwisp' ? 0.08 : 0) + (t === 'frostbitplume' ? 0.06 : 0)
    + (t === 'giantanklet' ? 0.06 : 0) + (t === 'skimmingrift' ? 0.08 : 0) + (t === 'drainingquill' ? 0.08 : 0)
    // newrewards-content batch passives (see data.js) — speed contributions
    + 0.08 * (p.airymedallion || 0) + 0.08 * (p.breezylocket || 0) + 0.08 * (p.splittingrelic || 0)
    + 0.08 * (p.runiccloak || 0) + 0.1 * (p.ancienttalisman || 0) + 0.1 * (p.deepgauntlet || 0)
    + 0.15 * (p.lopingreliquary || 0)
    + (t === 'stonewingcharm' ? 0.08 : 0) - (t === 'weatheredtalon' ? 0.06 : 0) // Gargoyle superboss-grid batch (see data.js)
    + 0.05 * (p.pilgrimssandals || 0) // Phase 3 overhaul — Shrine batch (see data.js)
    + 0.05 * (p.brasslockpick || 0) // Phase 4 overhaul — Arcade batch (see data/items-5.js)
    // Phase 7f — Hollow Chorus / Final Waveform trophy batch (see achievements/defs-7.js) — speed contributions
      + 0.05 * (p.hcfwtrophy_challenge_fw_floor_nodamage || 0)
    + 0.05 * (p.hcfwtrophy_exploration_floor13 || 0) + 0.05 * (p.hcfwtrophy_exploration_meet_zeroamplitude || 0) + 0.05 * (p.hcfwtrophy_exploration_meet_silencestalker || 0)
    + 0.05 * (p.hcfwtrophy_collection_fw_roster_t1 || 0)
    // Phase 7g — Tangled Shallows trophy batch (see achievements/defs-8.js) — speed contributions
    + 0.05 * (p.mgtrophy_challenge_floor_nodamage || 0) + 0.05 * (p.mgtrophy_exploration_meet_mangrove || 0) + 0.05 * (p.mgtrophy_meet_tidebloat || 0)
    + 0.05 * (p.mgtrophy_meet_mireloper || 0) + 0.05 * (p.mgtrophy_meet_shellbulk || 0) + 0.05 * (p.mgtrophy_collection_roster_t2 || 0)
    // Phase 7h — Observatory trophy batch (see achievements/defs-9.js) — speed contributions
    + 0.05 * (p.obstrophy_exploration_floor5d || 0) + 0.05 * (p.obstrophy_meet_brassbulwark || 0) + 0.05 * (p.obstrophy_meet_domewatcher || 0)
    + 0.05 * (p.obstrophy_meet_meteortusk || 0) + 0.05 * (p.obstrophy_collection_4d_t1 || 0)
    // Phase 7h (cont.) — Orrery trophy batch (see achievements/defs-10.js) — speed contributions
    + 0.05 * (p.ortrophy_exploration_floor7d || 0) + 0.05 * (p.ortrophy_meet_brassplate || 0) + 0.05 * (p.ortrophy_meet_gyromortar || 0)
    + 0.05 * (p.ortrophy_meet_zenithram || 0) + 0.05 * (p.ortrophy_collection_6d_t1 || 0)
    // Phase 7h (cont.) — The Void Between trophy batch (see achievements/defs-11.js) — speed contributions
     + 0.05 * (p.vbtrophy_challenge_nodamage || 0) + 0.05 * (p.vbtrophy_meet_hullplate || 0)
    + 0.05 * (p.vbtrophy_meet_wreckmortar || 0)
    // Phase 7h (cont.) — The Void Between PART 2 trophy batch (see achievements/defs-12.js) — speed contributions
    + 0.05 * (p.vbtrophy2_exploration_floor10d || 0) + 0.05 * (p.vbtrophy2_meet_darkplate || 0) + 0.05 * (p.vbtrophy2_meet_nullmortar || 0)
    + 0.05 * (p.vbtrophy2_meet_gravram || 0) + 0.05 * (p.vbtrophy2_collection_9d_t1 || 0)
    + (t === 'rootboundtalon' ? 0.05 : 0) // Phase 7g capstone trinket (see achievements/defs-8.js)
    + (t === 'splitscarcasing' ? 0.05 : 0) // Phase 7f capstone trinket (see achievements/defs-7.js)
    // Mega Update A step 5 — items-5.js tradeoff drawbacks (see data/items-5.js) — speed penalties
    - 0.06 * (p.beckoningvestment || 0) - 0.06 * (p.feintingsigil || 0) - 0.05 * (p.haleribcage || 0)
    - 0.05 * (p.mastervaultkey || 0) - 0.08 * (p.sleetedcirclet || 0)
    // Mega Update A step 5, items-1 slice — Soy-Milk-style tradeoff drawbacks (Brimstone Vial; Thundercloud while held as the
    // active item — activeItem is not a `passives` entry, so it is read
    // straight off the player here).
    - 0.10 * (p.brimstonevial || 0)
    - (player.activeItem && player.activeItem.id === 'thundercloud' ? 0.10 : 0)
    + player.pillSpeedBonus
    + comboBonus(player, 'packBond', 'speedMult'), 0.25, 2.2); // Synergy D: Pack Bond (amount lives in SYNERGY_COMBOS, systems/items-synergy.js)
  player.meleeDamage = Math.max(0.5, player.baseMeleeDamage + (p.ironshoes || 0) + 1 * (p.damageup || 0) + crown
    // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js) — damage contributions
    + 1 * (p.sk8i_glassmarble || 0) + 1 * (p.sk8i_stormtusk || 0) + 1 * (p.sk8i_shatterfang || 0)
    + 1 * (p.sk8i_echobell || 0) + 1 * (p.sk8i_fragmentshard || 0)
    + 1 * (p.sk11i_hoofbrand || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — damage contributions
    + (t === 'collapsarcore' ? 2 : 0) + (t === 'starironshard' ? 1 : 0) + (t === 'novasplinter' ? 2 : 0)
    + (t === 'gravitywell' ? 1 : 0) + (t === 'solarflarechip' ? 1 : 0) + 2 * (p.singularityfragment || 0)
    + 1 * (p.starforgedhoofguard || 0) + 2 * (p.novaanvil || 0) + 1 * (p.coronalance || 0)
    + 1 * (p.protostarember || 0) + 1 * (p.meteoriteedge || 0)
    + (p.dragonfirecore || 0) + (t === 'scaledtalisman' ? 1 : 0)
    + 1 * (p.ironwill || 0) + 1 * (p.gildedhoof || 0) + 2 * (p.witheredapple || 0) - 1 * (p.spiderring || 0)
    + 1 * (p.sacredlight || 0) + 1 * (p.haloedcrown || 0) + 1 * (p.blackheart || 0) + 1 * (p.demonhoof || 0)
    + 2 * (p.hollowsoul || 0) + 1 * (p.cinderclaw || 0) + 2 * (p.wrathfulhorn || 0) + 1 * (p.cursedhalo || 0)
    + 1 * (p.cursedwanderer || 0) + 1 * (p.undefeatedchampion || 0) + 1 * (p.chosenofthelight || 0) + 2 * (p.soulseller || 0)
    + 1 * (p.swarmbreaker || 0) + 1 * (p.turretbuster || 0) + 2 * (p.siegebreaker || 0) + 1 * (p.chainreaction || 0)
    + (t === 'rustybolt' ? 1 : 0) + (t === 'gildedcharm' ? 1 : 0)
    // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js) — damage contributions
    + (t === 'sk8t_ironclasp' ? 1 : 0) - (t === 'sk8t_glasscannon' ? 1 : 0)
    // 75-achievement + 25-unlocked batch (see data.js) — damage contributions
    + 1 * (p.chestwhisperer || 0) + 1 * (p.hoardersblessing || 0) + 1 * (p.rubblerunner || 0)
    + 1 * (p.blacklockboxkey || 0) + 2 * (p.devilsbargainring || 0) + 1 * (p.slayerssigil || 0)
    + 2 * (p.executionersmark || 0) + 1 * (p.midasfingertip || 0) + 1 * (p.graniteknuckles || 0)
    + 1 * (p.rubblekingscrown || 0) + 2 * (p.worldbreakergauntlet || 0) + 1 * (p.curatorspendant || 0)
    + 1 * (p.championssash || 0) + 1 * (p.overchargedbattery || 0) + 2 * (p.voltaiccore || 0)
    + 1 * (p.bruiserswraps || 0) + 2 * (p.ironhoofgauntlet || 0) + 1 * (p.hexbreakertalisman || 0)
    + 2 * (p.doomwalkerscloak || 0) + 1 * (p.gauntletveteransmedal || 0) + 2 * (p.arenachampionsbelt || 0)
    + 2 * (p.sombrasownseal || 0) + 1 * (p.insecticidevial || 0) + 2 * (p.sentrywreckersfist || 0)
    + 1 * (p.blastresistantvest || 0) + 2 * (p.detonationspecialistbadge || 0) + 1 * (p.embercharm || 0)
    + 1 * (p.goldencoin || 0) + 1 * (p.emeraldquill || 0) + 1 * (p.hollowtoken || 0)
    + 1 * (p.runicbauble || 0) + 1 * (p.goldenbrooch || 0) + 1 * (p.gildedtrinket || 0)
    + 1 * (p.polishedscroll || 0) + 1 * (p.palebrooch || 0) + 1 * (p.stormlocket || 0)
    + (t === 'wanderingtrinket' ? 1 : 0) + (t === 'stormprism' ? 1 : 0) + (t === 'crackedlocket' ? 1 : 0)
    + (t === 'cinderbrand' ? 1 : 0) + (t === 'stonefist' ? 1 : 0) + (t === 'jaggedtooth' ? 1 : 0)
    // 81-reward superboss-grid batch (see data.js) — damage contributions
    + (t === 'heavypommel' ? 1 : 0) + (t === 'chippedfang' ? 1 : 0) + (t === 'warscarredtoken' ? 1 : 0)
    + (t === 'boneknuckle' ? 1 : 0) + (t === 'sharpenedshard' ? 1 : 0) + (t === 'grudgestone' ? 1 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — damage contributions
    + 1 * (p.masterytrophy_rangedkills_t1 || 0) + 1 * (p.masterytrophy_bombbarrels_t2 || 0) + 1 * (p.explorationtrophy_yellowfire || 0)
    // expand-everything batch (see data.js) — damage contributions
    + (t === 'ironpin' ? 1 : 0) + (t === 'grindstonechip' ? 1 : 0) + (t === 'battlefang' ? 1 : 0)
    // C-branch batch (see data.js) — damage contributions
    + (t === 'rebarshank' ? 2 : 0) + (t === 'drainpipeclub' ? 1 : 0) + (t === 'machetetooth' ? 2 : 0)
    + (t === 'subwoofermagnet' ? 1 : 0) + (t === 'carnivalhorn' ? 1 : 0)
    // newrewards-content batch trinkets (see data.js) — damage contributions
    + (t === 'heavywedge' ? 1 : 0) + (t === 'irontooth' ? 1 : 0) + (t === 'roughspur' ? 1 : 0)
    + (t === 'brutalrivet' ? 2 : 0) + (t === 'brutalcleat' ? 1 : 0) + (t === 'focusedwedge' ? 1 : 0)
    + (t === 'ogrehasp' ? 1 : 0) + (t === 'septicspur' ? 1 : 0) + (t === 'dotingrivet' ? 1 : 0)
    + (t === 'reapertooth' ? 1 : 0) + (t === 'whirringcleat' ? 1 : 0) + (t === 'gleamingknuckle' ? 1 : 0)
    + (t === 'mourningfang' ? 1 : 0)
    // newrewards-content batch passives (see data.js) — damage contributions
    + 1 * (p.heavyamulet || 0) + 1 * (p.bluntsignet || 0) + 1 * (p.chippedamulet || 0)
    + 1 * (p.sunkentalisman || 0) + 1 * (p.ashenrune || 0) + 1 * (p.ogrelocket || 0)
    // Mega Update A step 5 (items-4.js slice) — tradeoff drawback: Long Shot
    // Trophy II buys its 5% faster recharge with a point of damage on every
    // attack (the Math.max floor above still applies). Stated in its desc.
    - 1 * (p.masterytrophy_rangedkills_t2 || 0)
    + player.pillDamageBonus + player.starDamageBonus
    + 1 * (p.fangguard || 0) // Synergy E support item: Fang Guard — the melee-flavored half of Twin Fangs
    + 1 * (p.meteorcrest || 0) // Phase 1 overhaul — Meteor Crest is "+1 all attacks"
    + 1 * (p.votivecoin || 0) // Phase 3 overhaul — Shrine batch: Votive Coin is "+1 all attacks"
    // Phase 4 overhaul — Arcade batch (see data/items-5.js) — "+1 all attacks" items
    + 1 * (p.blastmaster || 0) + 1 * (p.mastervaultkey || 0) + 1 * (p.arcadecrown || 0)
    + (t === 'graniteperch' ? 2 : 0) + (t === 'weatheredtalon' ? 1 : 0) + (t === 'crumblingsigil' ? 1 : 0) // Gargoyle superboss-grid batch (see data.js)
    // Phase 7f — Hollow Chorus / Final Waveform trophy batch (see achievements/defs-7.js) — damage contributions
      + 1 * (p.hcfwtrophy_challenge_hc_onehearted || 0)
    + 1 * (p.hcfwtrophy_exploration_floor14 || 0) + 1 * (p.hcfwtrophy_exploration_meet_wobbler || 0) + 1 * (p.hcfwtrophy_exploration_meet_decrescendosplitter || 0)
    + 1 * (p.hcfwtrophy_collection_mainroute_sb || 0)
    // Phase 7g — Tangled Shallows trophy batch (see achievements/defs-8.js) — damage contributions
    + 1 * (p.mgtrophy_challenge_onehearted || 0) + 1 * (p.mgtrophy_meet_mudtuskram || 0) + 1 * (p.mgtrophy_meet_saltspitter || 0)
    + 1 * (p.mgtrophy_collection_originals || 0)
    + 1 * (p.barnaclecrown || 0) + 1 * (p.viperscoil || 0) + 1 * (p.tidalclock || 0) + 1 * (p.mangrovecanopyheart || 0)
    + (t === 'stillbrackwater' ? 1 : 0) // Phase 7g capstone items/trinkets (see achievements/defs-8.js)
    + 1 * (p.lastchord || 0) + 1 * (p.zeroline || 0) + 1 * (p.metronomecharm || 0) + 1 * (p.cadencewatch || 0)
    + (t === 'splitscarcasing' ? 1 : 0) + (t === 'stilledchord' ? 1 : 0) // Phase 7f capstone items/trinkets (see achievements/defs-7.js)
    // Phase 7h — Observatory trophy batch (see achievements/defs-9.js) — damage contributions
      + 1 * (p.obstrophy_challenge_floor_nodamage || 0)
    + 1 * (p.obstrophy_exploration_meet_astrolabe || 0) + 1 * (p.obstrophy_meet_comettusk || 0) + 1 * (p.obstrophy_meet_astrolabestalker || 0)
    + 1 * (p.obstrophy_meet_opticturret || 0) + 1 * (p.obstrophy_collection_4d_t2 || 0)
    // Phase 7h capstone items/trinkets (see achievements/defs-9.js) — "+1 all
    // attacks" capstones (brasswardensplating/astrolabewardenplate grant a heart
    // container instead — see items-2.js's applyPassiveEffect — so they are
    // deliberately absent from this damage formula)
    + 1 * (p.starchartrelic || 0) + 1 * (p.stardriftanchor || 0) + 1 * (p.nebulacoreshard || 0) + 1 * (p.voidriftanchor || 0)
    + 1 * (p.brasschronometer || 0) + 1 * (p.astrolabechronometer || 0) + 1 * (p.lensarrayheart || 0) + 1 * (p.astrolabecoreheart || 0)
    + (t === 'stillorbit' ? 1 : 0)
    // Phase 7h (cont.) — Orrery trophy batch (see achievements/defs-10.js) — damage contributions
      + 1 * (p.ortrophy_challenge_floor_nodamage || 0)
    + 1 * (p.ortrophy_exploration_meet_orrery || 0) + 1 * (p.ortrophy_meet_ringrammer || 0) + 1 * (p.ortrophy_meet_zenithhound || 0)
    + 1 * (p.ortrophy_meet_apexturret || 0) + 1 * (p.ortrophy_collection_6d_t2 || 0)
    // Phase 7h (cont.) capstone items/trinkets (see achievements/defs-10.js) — "+1
    // all attacks" capstones (ringwardenplating/apexwardenplating/geartriadcore
    // grant a heart container instead — see items-2.js's applyPassiveEffect —
    // so they are deliberately absent from this damage formula)
    + 1 * (p.gearclutchcore || 0) + 1 * (p.gearblinkanchor || 0) + 1 * (p.ringblinkanchor || 0)
    + 1 * (p.brassringchronometer || 0) + 1 * (p.apexchronometer || 0) + 1 * (p.gearworkheart || 0) + 1 * (p.orreryheart || 0)
    + (t === 'stillmechanism' ? 1 : 0)
    // Phase 7h (cont.) — The Void Between trophy batch (see achievements/defs-11.js) — damage contributions
     + 1 * (p.vbtrophy_exploration_floor8d || 0) + 1 * (p.vbtrophy_meet_driftram || 0)
    + 1 * (p.vbtrophy_meet_stardrift || 0)
    // Phase 7h (cont.) capstone items/trinkets (see achievements/defs-11.js) — "+1 all
    // attacks" capstones (driftwardenplate grants a heart container instead —
    // see items-2.js's applyPassiveEffect — so it is deliberately absent here)
    + 1 * (p.hullshardcore || 0) + 1 * (p.hullblinkanchor || 0) + 1 * (p.voidchronometer || 0) + 1 * (p.voidbetweenheart || 0)
    // Phase 7h (cont.) — The Void Between PART 2 trophy batch (see achievements/defs-12.js) — damage contributions
      + 1 * (p.vbtrophy2_challenge_floor_nodamage || 0)
    + 1 * (p.vbtrophy2_exploration_meet_singularity || 0) + 1 * (p.vbtrophy2_meet_nullram || 0) + 1 * (p.vbtrophy2_meet_collapsehound || 0)
    + 1 * (p.vbtrophy2_meet_collapseturret || 0) + 1 * (p.vbtrophy2_collection_9d_t2 || 0)
    // Phase 7h (cont.) capstone items (see achievements/defs-12.js) — "+1 all
    // attacks" capstones (darkwardenplating/horizonwardenplating grant a heart
    // container instead — see items-2.js's applyPassiveEffect — so they are
    // deliberately absent here)
    + 1 * (p.emberhuskcore || 0) + 1 * (p.nullblinkanchor || 0) + 1 * (p.horizonhuskcore || 0)
    + 1 * (p.eventblinkanchor || 0) + 1 * (p.emberchronometer || 0) + 1 * (p.eventchronometer || 0)
    + 1 * (p.lastlightheart || 0) + 1 * (p.eventhorizonheart || 0)
    + (t === 'collapsedmoment' ? 1 : 0)
    // Synergy A: Ecosystem Set / Synergy D: Pack Bond — amounts live in
    // SYNERGY_COMBOS (systems/items-synergy.js); read here, inside this
    // Math.max floor, exactly where they have always been applied.
    // Mega Update A step 5 — items-5.js tradeoff drawbacks (see data/items-5.js) — damage penalties
    - 0.5 * (p.emberwick || 0) - 0.5 * (p.lopingreliquary || 0)
    // Mega Update A step 5, items-1 slice — Soy-Milk-style tradeoff drawback (Second Wind).
    - 1 * (p.secondwind || 0)
    + comboBonus(player, 'ecosystemSet', 'meleeDamage')
    + comboBonus(player, 'packBond', 'meleeDamage'));
  player.rangedDamage = Math.max(0.5, player.baseRangedDamage + (p.ironshoes || 0) + 1 * (p.damageup || 0) + crown
    // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js) — damage contributions
    + 1 * (p.sk8i_glassmarble || 0) + 1 * (p.sk8i_stormtusk || 0) + 1 * (p.sk8i_shatterfang || 0)
    + 1 * (p.sk8i_echobell || 0) + 1 * (p.sk8i_fragmentshard || 0)
    + 1 * (p.sk11i_hoofbrand || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — damage contributions
    + (t === 'collapsarcore' ? 2 : 0) + (t === 'starironshard' ? 1 : 0) + (t === 'novasplinter' ? 2 : 0)
    + (t === 'gravitywell' ? 1 : 0) + (t === 'solarflarechip' ? 1 : 0) + 2 * (p.singularityfragment || 0)
    + 1 * (p.starforgedhoofguard || 0) + 2 * (p.novaanvil || 0) + 1 * (p.coronalance || 0)
    + 1 * (p.protostarember || 0) + 1 * (p.meteoriteedge || 0)
    + (p.dragonfirecore || 0) + (t === 'scaledtalisman' ? 1 : 0)
    + 1 * (p.ironwill || 0) + 1 * (p.gildedhoof || 0) + 2 * (p.witheredapple || 0) - 1 * (p.spiderring || 0)
    + 1 * (p.sacredlight || 0) + 1 * (p.haloedcrown || 0) + 1 * (p.blackheart || 0) + 1 * (p.demonhoof || 0)
    + 2 * (p.hollowsoul || 0) + 1 * (p.cinderclaw || 0) + 2 * (p.wrathfulhorn || 0) + 1 * (p.cursedhalo || 0)
    + 1 * (p.cursedwanderer || 0) + 1 * (p.undefeatedchampion || 0) + 1 * (p.chosenofthelight || 0) + 2 * (p.soulseller || 0)
    + 1 * (p.swarmbreaker || 0) + 1 * (p.turretbuster || 0) + 2 * (p.siegebreaker || 0) + 1 * (p.chainreaction || 0)
    + (t === 'rustybolt' ? 1 : 0) + (t === 'gildedcharm' ? 1 : 0)
    // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js) — damage contributions
    + (t === 'sk8t_ironclasp' ? 1 : 0) - (t === 'sk8t_glasscannon' ? 1 : 0)
    // 75-achievement + 25-unlocked batch (see data.js) — damage contributions
    + 1 * (p.chestwhisperer || 0) + 1 * (p.hoardersblessing || 0) + 1 * (p.rubblerunner || 0)
    + 1 * (p.blacklockboxkey || 0) + 2 * (p.devilsbargainring || 0) + 1 * (p.slayerssigil || 0)
    + 2 * (p.executionersmark || 0) + 1 * (p.midasfingertip || 0) + 1 * (p.graniteknuckles || 0)
    + 1 * (p.rubblekingscrown || 0) + 2 * (p.worldbreakergauntlet || 0) + 1 * (p.curatorspendant || 0)
    + 1 * (p.championssash || 0) + 1 * (p.overchargedbattery || 0) + 2 * (p.voltaiccore || 0)
    + 1 * (p.bruiserswraps || 0) + 2 * (p.ironhoofgauntlet || 0) + 1 * (p.hexbreakertalisman || 0)
    + 2 * (p.doomwalkerscloak || 0) + 1 * (p.gauntletveteransmedal || 0) + 2 * (p.arenachampionsbelt || 0)
    // sombrasownseal was +2 melee but +3 ranged — the same item paying ranged
    // 50% more than melee for the same heart-container cost. +2 both ways.
    + 2 * (p.sombrasownseal || 0) + 1 * (p.insecticidevial || 0) + 2 * (p.sentrywreckersfist || 0)
    + 1 * (p.blastresistantvest || 0) + 2 * (p.detonationspecialistbadge || 0) + 1 * (p.embercharm || 0)
    + 1 * (p.goldencoin || 0) + 1 * (p.emeraldquill || 0) + 1 * (p.hollowtoken || 0)
    + 1 * (p.runicbauble || 0) + 1 * (p.goldenbrooch || 0) + 1 * (p.gildedtrinket || 0)
    + 1 * (p.polishedscroll || 0) + 1 * (p.palebrooch || 0) + 1 * (p.stormlocket || 0)
    + (t === 'wanderingtrinket' ? 1 : 0) + (t === 'stormprism' ? 1 : 0) + (t === 'crackedlocket' ? 1 : 0)
    + (t === 'cinderbrand' ? 1 : 0) + (t === 'stonefist' ? 1 : 0) + (t === 'jaggedtooth' ? 1 : 0)
    // 81-reward superboss-grid batch (see data.js) — damage contributions
    + (t === 'heavypommel' ? 1 : 0) + (t === 'chippedfang' ? 1 : 0) + (t === 'warscarredtoken' ? 1 : 0)
    + (t === 'boneknuckle' ? 1 : 0) + (t === 'sharpenedshard' ? 1 : 0) + (t === 'grudgestone' ? 1 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — damage contributions
    + 1 * (p.masterytrophy_rangedkills_t1 || 0) + 1 * (p.masterytrophy_bombbarrels_t2 || 0) + 1 * (p.explorationtrophy_yellowfire || 0)
    // expand-everything batch (see data.js) — damage contributions
    + (t === 'ironpin' ? 1 : 0) + (t === 'grindstonechip' ? 1 : 0) + (t === 'battlefang' ? 1 : 0)
    // C-branch batch (see data.js) — damage contributions
    + (t === 'rebarshank' ? 2 : 0) + (t === 'drainpipeclub' ? 1 : 0) + (t === 'machetetooth' ? 2 : 0)
    + (t === 'subwoofermagnet' ? 1 : 0) + (t === 'carnivalhorn' ? 1 : 0)
    // newrewards-content batch trinkets (see data.js) — damage contributions
    + (t === 'heavywedge' ? 1 : 0) + (t === 'irontooth' ? 1 : 0) + (t === 'roughspur' ? 1 : 0)
    + (t === 'brutalrivet' ? 2 : 0) + (t === 'brutalcleat' ? 1 : 0) + (t === 'focusedwedge' ? 1 : 0)
    + (t === 'ogrehasp' ? 1 : 0) + (t === 'septicspur' ? 1 : 0) + (t === 'dotingrivet' ? 1 : 0)
    + (t === 'reapertooth' ? 1 : 0) + (t === 'whirringcleat' ? 1 : 0) + (t === 'gleamingknuckle' ? 1 : 0)
    + (t === 'mourningfang' ? 1 : 0)
    // newrewards-content batch passives (see data.js) — damage contributions
    + 1 * (p.heavyamulet || 0) + 1 * (p.bluntsignet || 0) + 1 * (p.chippedamulet || 0)
    + 1 * (p.sunkentalisman || 0) + 1 * (p.ashenrune || 0) + 1 * (p.ogrelocket || 0)
    // Mega Update A step 5 (items-4.js slice) — tradeoff drawback: Long Shot
    // Trophy II buys its 5% faster recharge with a point of damage on every
    // attack (the Math.max floor above still applies). Stated in its desc.
    - 1 * (p.masterytrophy_rangedkills_t2 || 0)
    + player.pillDamageBonus + player.starDamageBonus
    + 1 * (p.quiverstring || 0) // Synergy E support item: Quiverstring — the ranged-flavored half of Twin Fangs
    + 1 * (p.cometshard || 0) + 1 * (p.skyrend || 0) + 1 * (p.meteorcrest || 0) // Phase 1 overhaul — skyfall family's ranged flat damage
    + 1 * (p.votivecoin || 0) // Phase 3 overhaul — Shrine batch: Votive Coin is "+1 all attacks"
    // Phase 4 overhaul — Arcade batch (see data/items-5.js) — "+1 all attacks" items
    + 1 * (p.blastmaster || 0) + 1 * (p.mastervaultkey || 0) + 1 * (p.arcadecrown || 0)
    + (t === 'graniteperch' ? 2 : 0) + (t === 'weatheredtalon' ? 1 : 0) + (t === 'crumblingsigil' ? 1 : 0) // Gargoyle superboss-grid batch (see data.js)
    // Phase 7f — Hollow Chorus / Final Waveform trophy batch (see achievements/defs-7.js) — damage contributions
      + 1 * (p.hcfwtrophy_challenge_fw_onehearted || 0)
    + 1 * (p.hcfwtrophy_exploration_meet_lastovertone || 0) + 1 * (p.hcfwtrophy_exploration_meet_subdrop || 0) + 1 * (p.hcfwtrophy_exploration_meet_polyrhythm || 0)
    // Phase 7g — Tangled Shallows trophy batch (see achievements/defs-8.js) — damage contributions
    + 1 * (p.mgtrophy_challenge_speedkill || 0) + 1 * (p.mgtrophy_meet_mudskipper || 0) + 1 * (p.mgtrophy_meet_bloatbladder || 0)
    + 1 * (p.barnaclecrown || 0) + 1 * (p.viperscoil || 0) + 1 * (p.tidalclock || 0) + 1 * (p.mangrovecanopyheart || 0)
    + (t === 'stillbrackwater' ? 1 : 0) // Phase 7g capstone items/trinkets (see achievements/defs-8.js)
    + 1 * (p.lastchord || 0) + 1 * (p.zeroline || 0) + 1 * (p.metronomecharm || 0) + 1 * (p.cadencewatch || 0)
    + (t === 'splitscarcasing' ? 1 : 0) + (t === 'stilledchord' ? 1 : 0) // Phase 7f capstone items/trinkets (see achievements/defs-7.js)
    // Phase 7h — Observatory trophy batch (see achievements/defs-9.js) — damage contributions
      + 1 * (p.obstrophy_challenge_onehearted || 0)
    + 1 * (p.obstrophy_meet_lensdrifter || 0) + 1 * (p.obstrophy_meet_spyglassturret || 0) + 1 * (p.obstrophy_meet_cometwisp || 0)
    + 1 * (p.obstrophy_meet_starhopper || 0) + 1 * (p.obstrophy_collection_5d_t1 || 0)
    // Phase 7h capstone items/trinkets (see achievements/defs-9.js) — same
    // "+1 all attacks" set as the meleeDamage formula above
    + 1 * (p.starchartrelic || 0) + 1 * (p.stardriftanchor || 0) + 1 * (p.nebulacoreshard || 0) + 1 * (p.voidriftanchor || 0)
    + 1 * (p.brasschronometer || 0) + 1 * (p.astrolabechronometer || 0) + 1 * (p.lensarrayheart || 0) + 1 * (p.astrolabecoreheart || 0)
    + (t === 'stillorbit' ? 1 : 0)
    // Phase 7h (cont.) — Orrery trophy batch (see achievements/defs-10.js) — damage contributions
      + 1 * (p.ortrophy_challenge_onehearted || 0)
    + 1 * (p.ortrophy_meet_gearhound || 0) + 1 * (p.ortrophy_meet_meridianturret || 0) + 1 * (p.ortrophy_meet_starcog || 0)
    + 1 * (p.ortrophy_meet_springcoil || 0) + 1 * (p.ortrophy_collection_7d_t1 || 0)
    // Phase 7h (cont.) capstone items/trinkets (see achievements/defs-10.js) — same
    // "+1 all attacks" set as the meleeDamage formula above
    + 1 * (p.gearclutchcore || 0) + 1 * (p.gearblinkanchor || 0) + 1 * (p.ringblinkanchor || 0)
    + 1 * (p.brassringchronometer || 0) + 1 * (p.apexchronometer || 0) + 1 * (p.gearworkheart || 0) + 1 * (p.orreryheart || 0)
    + (t === 'stillmechanism' ? 1 : 0)
    // Phase 7h (cont.) — The Void Between trophy batch (see achievements/defs-11.js) — damage contributions
     + 1 * (p.vbtrophy_meet_voidwisp || 0) + 1 * (p.vbtrophy_meet_silentturret || 0)
    + 1 * (p.vbtrophy_meet_hulkwatcher || 0)
    // Phase 7h (cont.) capstone items/trinkets (see achievements/defs-11.js) — same
    // "+1 all attacks" set as the meleeDamage formula above
    + 1 * (p.hullshardcore || 0) + 1 * (p.hullblinkanchor || 0) + 1 * (p.voidchronometer || 0) + 1 * (p.voidbetweenheart || 0)
    // Phase 7h (cont.) — The Void Between PART 2 trophy batch (see achievements/defs-12.js) — damage contributions
      + 1 * (p.vbtrophy2_challenge_onehearted || 0)
    + 1 * (p.vbtrophy2_meet_starvedhound || 0) + 1 * (p.vbtrophy2_meet_lastlightturret || 0) + 1 * (p.vbtrophy2_meet_lastlightmoth || 0)
    + 1 * (p.vbtrophy2_meet_abyssleaper || 0) + 1 * (p.vbtrophy2_collection_10d_t1 || 0)
    // Phase 7h (cont.) capstone items (see achievements/defs-12.js) — same
    // "+1 all attacks" set as the meleeDamage formula above
    + 1 * (p.emberhuskcore || 0) + 1 * (p.nullblinkanchor || 0) + 1 * (p.horizonhuskcore || 0)
    + 1 * (p.eventblinkanchor || 0) + 1 * (p.emberchronometer || 0) + 1 * (p.eventchronometer || 0)
    + 1 * (p.lastlightheart || 0) + 1 * (p.eventhorizonheart || 0)
    + (t === 'collapsedmoment' ? 1 : 0)
    // Synergy A: Ecosystem Set / Synergy D: Pack Bond — see the meleeDamage
    // formula above; amounts live in SYNERGY_COMBOS (systems/items-synergy.js).
    // Mega Update A step 5 — items-5.js tradeoff drawbacks (see data/items-5.js) — damage penalties
    - 0.5 * (p.emberwick || 0) - 0.5 * (p.lopingreliquary || 0)
    - 0.5 * (p.crackedrune || 0) - 0.5 * (p.asheneffigy || 0)
    // Mega Update A step 5, items-1 slice — Soy-Milk-style tradeoff drawbacks (Second Wind, Multi Shot's split bolts).
    - 1 * (p.secondwind || 0) - 0.5 * (p.multishot || 0)
    + comboBonus(player, 'ecosystemSet', 'rangedDamage')
    + comboBonus(player, 'packBond', 'rangedDamage'));
  const rateDenom = Math.max(0.25, 1 + 0.15 * (p.firerateup || 0) + 0.15 * (p.quickdraw || 0) + 0.20 * (p.brokenwatch || 0)
    + 0.15 * (p.sk8i_ticktock || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    - 0.10 * (p.wrathfulhorn || 0) + 0.15 * (p.featherweight || 0) + 0.15 * (p.gauntletrunner || 0)
    + (t === 'quicksilverdrop' ? 0.15 : 0)
    // 75-achievement + 25-unlocked batch (see data.js) — fire rate contributions
    + 0.15 * (p.fusemastersglove || 0) + 0.1 * (p.barragecore || 0) + 0.1 * (p.wanderersendurance || 0)
    + 0.1 * (p.quickstepcharm || 0) + (t === 'zephyrcharm' ? 0.10 : 0)
    + 0.1 * (p.sunkenglove || 0) + 0.08 * (p.wildcloak || 0) + 0.1 * (p.brightband || 0)
    + 0.1 * (p.palesigil || 0) + 0.1 * (p.crystalflask || 0) + 0.12 * (p.cursedfragment || 0)
    + 0.08 * (p.forgottengauntlet || 0) + (t === 'duskytrinket' ? 0.12 : 0) + (t === 'crystalwhistle' ? 0.1 : 0)
    + (t === 'radiantbadge' ? 0.08 : 0)
    + (t === 'hastyfuse' ? 0.06 : 0) + (t === 'swiftgear' ? 0.06 : 0)
    // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js) — fire rate contributions
    + (t === 'sk8t_hairspring' ? 0.06 : 0) + (t === 'sk8t_boggedgear' ? 0.05 : 0)
    // 81-reward superboss-grid batch (see data.js) — fire rate contributions
    + (t === 'oiledspring' ? 0.06 : 0) + (t === 'tickingcog' ? 0.05 : 0) + (t === 'rapidprimer' ? 0.08 : 0)
    + (t === 'nimbletrigger' ? 0.07 : 0) + (t === 'greasedhinge' ? 0.05 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — fire rate contributions
    + 0.05 * (p.masterytrophy_rangedkills_t2 || 0) + 0.05 * (p.masterytrophy_swarmerdnb_t1 || 0) + 0.05 * (p.explorationtrophy_redfire || 0)
    // expand-everything batch (see data.js) — fire rate contributions
    + (t === 'slickcog' ? 0.06 : 0) + (t === 'snapspring' ? 0.07 : 0) + (t === 'primerpin' ? 0.05 : 0)
    // C-branch batch (see data.js) — fire rate contributions
    + (t === 'rapidrunoff' ? 0.10 : 0) + (t === 'tremolochip' ? 0.06 : 0) + (t === 'hummingbirdplume' ? 0.10 : 0)
    // newrewards-content batch trinkets (see data.js) — fire rate contributions
    + (t === 'clickingratchet' ? 0.08 : 0) + (t === 'snappytrigger' ? 0.05 : 0) + (t === 'quickratchet' ? 0.07 : 0)
    + (t === 'clickingescapement' ? 0.05 : 0) + (t === 'oiledlens' ? 0.04 : 0) + (t === 'leviathancog' ? 0.05 : 0)
    + (t === 'bulwarkcog' ? 0.05 : 0) + (t === 'exactinghinge' ? 0.05 : 0) + (t === 'distantdetent' ? 0.04 : 0)
    + (t === 'hummingsprocket' ? 0.05 : 0) + (t === 'fortunatepawl' ? 0.05 : 0) + (t === 'rapidwisp' ? 0.05 : 0)
    + (t === 'parchedgear' ? 0.05 : 0) + (t === 'whirringcleat' ? 0.05 : 0) + (t === 'concussiveescapement' ? 0.05 : 0)
    // newrewards-content batch passives (see data.js) — fire rate contributions
    + 0.05 * (p.runicrelic || 0) + 0.05 * (p.ashentalisman || 0) + 0.05 * (p.widecirclet || 0)
    + 0.05 * (p.woundcharm || 0) + 0.05 * (p.ashenrelic || 0) + 0.05 * (p.woveneffigy || 0)
    + 0.05 * (p.quickrelic || 0) + 0.05 * (p.greasedreliquary || 0) + 0.05 * (p.runiccrown || 0)
    + 0.05 * (p.pennylocket || 0) + 0.08 * (p.crackedcirclet || 0) + 0.08 * (p.slickgauntlet || 0)
    + 0.1 * (p.whirringeffigy || 0)
    + (t === 'belfrycharm' ? 0.05 : 0) // Gargoyle superboss-grid batch (see data.js)
    + 0.08 * (p.emberwick || 0) // Phase 3 overhaul — Shrine batch (see data.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — rate contributions
    + (t === 'escapementgear' ? 0.06 : 0) + (t === 'siderealtick' ? 0.05 : 0) + (t === 'pulsarmetronome' ? 0.07 : 0)
    + (t === 'clockdrivepin' ? 0.05 : 0) + (t === 'spinuprotor' ? 0.06 : 0) + 0.1 * (p.pulsargovernor || 0)
    + 0.08 * (p.siderealmovement || 0) + 0.08 * (p.flywheelcore || 0) + 0.05 * (p.rapidescapement || 0)
    + 0.08 * (p.spinstabilizer || 0)
    // Phase 7f — Hollow Chorus / Final Waveform trophy batch (see achievements/defs-7.js) — rate contributions
      + 0.03 * (p.hcfwtrophy_challenge_hc_speedkill || 0)
    + 0.03 * (p.hcfwtrophy_exploration_meet_hollowcantor || 0) + 0.03 * (p.hcfwtrophy_exploration_meet_deadaircoda || 0) + 0.03 * (p.hcfwtrophy_exploration_meet_tremorswarm || 0)
    + (t === 'cantorbell' ? 0.06 : 0) // Phase 7f capstone trinket (see achievements/defs-7.js)
    // Phase 7g — Tangled Shallows trophy batch (see achievements/defs-8.js) — rate contributions
    + 0.03 * (p.mgtrophy_meet_eelspitter || 0) + 0.03 * (p.mgtrophy_meet_siltboar || 0)
    // Phase 7h — Observatory trophy batch (see achievements/defs-9.js) — rate contributions
      + 0.03 * (p.obstrophy_challenge_speedkill || 0)
    + 0.03 * (p.obstrophy_meet_dustmote || 0) + 0.03 * (p.obstrophy_meet_astralhopper || 0) + 0.03 * (p.obstrophy_meet_quasarshard || 0)
    + 0.03 * (p.obstrophy_meet_novamortar || 0) + 0.03 * (p.obstrophy_collection_5d_t2 || 0)
    + (t === 'cometshadowveil' ? 0.08 : 0) + (t === 'eclipseveilcloak' ? 0.08 : 0) // Phase 7h capstone trinkets (see achievements/defs-9.js)
    // Phase 7h (cont.) — Orrery trophy batch (see achievements/defs-10.js) — rate contributions
      + 0.03 * (p.ortrophy_challenge_speedkill || 0)
    + 0.03 * (p.ortrophy_meet_cogmoth || 0) + 0.03 * (p.ortrophy_meet_cogspring || 0) + 0.03 * (p.ortrophy_meet_novagear || 0)
    + 0.03 * (p.ortrophy_meet_zenithslinger || 0) + 0.03 * (p.ortrophy_collection_7d_t2 || 0)
    + (t === 'shadowcogveil' ? 0.08 : 0) + (t === 'nightgearveil' ? 0.08 : 0) // Phase 7h (cont.) capstone trinkets (see achievements/defs-10.js)
    // Phase 7h (cont.) — The Void Between trophy batch (see achievements/defs-11.js) — rate contributions
     + 0.03 * (p.vbtrophy_meet_derelictmoth || 0) + 0.03 * (p.vbtrophy_meet_driftleaper || 0)
    + 0.03 * (p.vbtrophy_collection_t1 || 0)
    + (t === 'shadowhulkveil' ? 0.08 : 0) // Phase 7h (cont.) capstone trinket (see achievements/defs-11.js)
    // Phase 7h (cont.) — The Void Between PART 2 trophy batch (see achievements/defs-12.js) — rate contributions
      + 0.03 * (p.vbtrophy2_challenge_speedkill || 0)
    + 0.03 * (p.vbtrophy2_meet_dyingember || 0) + 0.03 * (p.vbtrophy2_meet_voidleaper || 0) + 0.03 * (p.vbtrophy2_meet_eventspark || 0)
    + 0.03 * (p.vbtrophy2_meet_eventslinger || 0) + 0.03 * (p.vbtrophy2_collection_10d_t2 || 0)
    + (t === 'hollowstalkerveil' ? 0.08 : 0) + (t === 'silentstalkerveil' ? 0.08 : 0) // Phase 7h (cont.) capstone trinkets (see achievements/defs-12.js)
    // Mega Update A step 5 — items-5.js tradeoff drawbacks (see data/items-5.js) — recharge penalties (negative here = slower)
    - 0.08 * (p.longeffigy || 0) - 0.06 * (p.numbingmantle || 0)
    // Mega Update A step 5, items-1 slice — Soy-Milk-style tradeoff drawback (Radiant Burst).
    - 0.10 * (p.radiantburst || 0)
    + player.pillFireRateBonus);
  const rateMult = Util.clamp(1 / rateDenom, 0.35, 3);
  player.meleeCooldown = player.meleeCooldownBase * rateMult;
  player.fireCooldown = player.fireCooldownBase * rateMult;
  // Range: ranged classes gain/lose a full tile per Range Up/Down source,
  // melee classes only 25% of a tile (see entities.js's baseRangeTiles) —
  // "more range" reads as a much smaller nudge on a swing than on a bolt's
  // flight. Bent Nail is a separate flat melee-only multiplier on top;
  // Farseeing Charm is a separate flat RANGED-only tile, unscaled, with no
  // effect on melee at all; Eagle Eye is the same but applies to BOTH.
  const rangeBonusTiles = (p.rangeup || 0) + (p.tidecallersscale || 0) + player.pillRangeBonus
    + 1 * (p.sk8i_farstep || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + 1 * (p.solarfeather || 0) + 1 * (p.radiantwhistle || 0) + 1 * (p.sapphiretiara || 0)
    + 1 * (p.moltenscroll || 0) + 1 * (p.obsidiantalisman || 0) + (t === 'ambercoin' ? 1 : 0)
    + (t === 'polishedbadge' ? 1 : 0) + (t === 'crackedseal' ? 1 : 0)
    + (t === 'longshotlens' ? 1 : 0) + (t === 'farsightedcharm' ? 1 : 0)
    // 81-reward superboss-grid batch (see data.js) — range contributions
    + (t === 'farcastprism' ? 1 : 0) + (t === 'hawkseyebead' ? 1 : 0) + (t === 'longreachrod' ? 1 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — range contributions
    + 1 * (p.masterytrophy_critslanded_t1 || 0) + 1 * (p.masterytrophy_swarmerdnb_t2 || 0) + 1 * (p.explorationtrophy_spikedrock || 0)
    // expand-everything batch (see data.js) — range contributions
    // newrewards-content batch trinkets (see data.js) — range contributions
    + (t === 'longglass' ? 1 : 0) + (t === 'outreachglass' ? 1 : 0) + (t === 'horizonspan' ? 1 : 0)
    + (t === 'auspiciousspyring' ? 1 : 0) + (t === 'distantdetent' ? 1 : 0) + (t === 'horizonveil' ? 1 : 0)
    + (t === 'overlooktoken' ? 1 : 0) + (t === 'longplume' ? 1 : 0)
    // newrewards-content batch passives (see data.js) — range contributions
    + 1 * (p.overlookcrown || 0) + 1 * (p.gildedeffigy || 0) + 1 * (p.wovensignet || 0)
    + 1 * (p.hallowedbracer || 0) + 1 * (p.runiccloak || 0) + 1 * (p.scavengedtalisman || 0)
    + 1 * (p.longeffigy || 0)
    + 1 * (p.devotedrelic || 0) // Phase 3 overhaul — Shrine batch (see data.js)
    + (t === 'spyglasslens' ? 1 : 0) + (t === 'longsightbead' ? 1 : 0)
    // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js) — range contributions
    + (t === 'sk8t_farcastbead' ? 1 : 0) + (t === 'sk8t_narrowscope' ? 1 : 0)
    // Mega Update A step 5 (items-4.js slice) — tradeoff drawback: Hoof to Hoof
    // Trophy II pays for its +5% movement speed with a tile of reach (melee, as
    // always, only feels 25% of it via rangeScale). Stated in the item's desc.
    - 1 * (p.masterytrophy_meleekills_t2 || 0);
  const rangeScale = player.attackType === 'melee' ? 0.25 : 1;
  const farseeingBonus = (t === 'farseeingcharm' && player.attackType !== 'melee') ? 1 : 0;
  const eagleEyeBonus = 0.5 * (p.eagleeye || 0);
  // CAPPED at 12 tiles. Rooms top out well under 24 tiles across, so past
  // ~12 tiles a ranged build simply deletes every room from the doorway
  // without the room ever getting a turn, and a melee swing at that reach
  // stops being a melee swing at all. 13 additive sources feed this.
  player.rangeTiles = Util.clamp(player.baseRangeTiles + rangeBonusTiles * rangeScale + farseeingBonus + eagleEyeBonus, 0.25, 12);
  player.meleeRange = player.rangeTiles * TILE * (t === 'bentnail' ? 1.2 : 1);
  player.boltSpeed = player.def.boltSpeed || 340; // flat per-class flavor — see rangeTiles for how far it actually travels
  // Mega Update A step 5, items-1 slice — Prism Veil's tradeoff drawback: bolts
  // that pass through walls pass through the air just as loosely. Floored so no
  // stack of copies can stall a bolt outright.
  if (p.prismveil) player.boltSpeed = Math.max(120, player.boltSpeed - 40 * p.prismveil);
  // CAPPED at +100%. ~20 additive sources at 0.05-0.15 each, several of them
  // stacking counts, so the uncapped sum reached +200% and beyond — at which
  // point bosses (which already grow slower than trash, see enemies.js's
  // BOSS_HP_GROWTH) die faster than the room they're standing in. Doubling
  // your damage against the thing the floor is named after is still a lot.
  player.bossDamageBonus = Math.min(1, 0.15 * (p.voidcharm || 0) + 0.08 * (p.bossbane || 0) - 0.10 * (p.stonewall || 0) + (t === 'voidshard' ? 0.10 : 0)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — bossdmg contributions
    + (t === 'giantslayerbead' ? 0.08 : 0) + (t === 'supernovaseal' ? 0.1 : 0) + (t === 'titanfallmark' ? 0.06 : 0)
    + (t === 'collapsesigil' ? 0.08 : 0) + (t === 'starbreakerpin' ? 0.06 : 0) + 0.12 * (p.starbreakerdrill || 0)
    + 0.1 * (p.titanfallcharge || 0) + 0.08 * (p.collapsecatalyst || 0) + 0.12 * (p.giantsbanealloy || 0)
    + 0.10 * (p.martyrsvow || 0) // Phase 3 overhaul — Shrine batch (see data.js)
    + 0.12 * (p.voidwhisper || 0) + 0.10 * (p.damnedsoul || 0)
    + 0.1 * (p.giantslayersbelt || 0) + 0.15 * (p.trophyrack || 0) + 0.08 * (p.sombrasownseal || 0)     + 0.05 * (p.radiantglove || 0) + 0.08 * (p.gildedseal || 0) + 0.05 * (p.roaringrune || 0)
    + 0.1 * (p.polishedcloak || 0) + 0.05 * (p.forgottenemblem || 0) + (t === 'wanderingfragment' ? 0.05 : 0)
    + (t === 'vividscroll' ? 0.1 : 0) + (t === 'radiantlantern' ? 0.08 : 0)
    + 0.08 * (p.huntersfocus || 0)
    + (t === 'giantsbane' ? 0.10 : 0) + (t === 'dragonslayerscoin' ? 0.08 : 0)
    // 81-reward superboss-grid batch (see data.js) — boss damage contributions
    + (t === 'titanbanetooth' ? 0.10 : 0) + (t === 'colossusmark' ? 0.08 : 0) + (t === 'monsterhuntertag' ? 0.06 : 0)
    + (t === 'behemothsigil' ? 0.08 : 0) + (t === 'ogresgrudge' ? 0.05 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — boss damage contributions
    + 0.05 * (p.masterytrophy_critslanded_t2 || 0) + 0.05 * (p.masterytrophy_activeitemuses_t1 || 0) + 0.05 * (p.explorationtrophy_tintedrock || 0)
    // expand-everything batch (see data.js) — boss damage contributions
    + (t === 'titanmark' ? 0.10 : 0) + (t === 'hulkbanetoken' ? 0.06 : 0)
    // C-branch batch (see data.js) — boss damage contributions
    // newrewards-content batch trinkets (see data.js) — boss damage contributions
    + (t === 'leviathanbane' ? 0.1 : 0) + (t === 'behemothtag' ? 0.08 : 0) + (t === 'ogretag' ? 0.08 : 0)
    + (t === 'colossussigil' ? 0.1 : 0) + (t === 'leviathancog' ? 0.06 : 0) + (t === 'titanbloom' ? 0.06 : 0)
    + (t === 'redoubtmark' ? 0.05 : 0) + (t === 'frostbittag' ? 0.06 : 0) + (t === 'ogrehasp' ? 0.06 : 0)
    + (t === 'dreadtag' ? 0.05 : 0) + (t === 'colossusstub' ? 0.05 : 0) + (t === 'giantanklet' ? 0.06 : 0)
    // newrewards-content batch passives (see data.js) — boss damage contributions
    + 0.05 * (p.leviathanpendant || 0) + 0.05 * (p.sunkentalisman || 0) + 0.05 * (p.ogrelocket || 0)
    + 0.05 * (p.titanlocket || 0) + 0.08 * (p.wovenvestment || 0) + 0.08 * (p.runicrune || 0)
    + 0.15 * (p.ancientcloak || 0) + 0.1 * (p.lopingreliquary || 0) + 0.15 * (p.monarchbracer || 0)
    + (t === 'drenchedsigil' ? 0.12 : 0) + (t === 'amazonbrand' ? 0.10 : 0) + (t === 'kirksignet' ? 0.15 : 0)
    + (t === 'lastbarritual' ? 0.05 : 0)); // Phase 7f capstone trinket (see achievements/defs-7.js)
  // Stonewall — -25% damage taken from bosses, see combat.js playerDamageAmount.
  // Bulwark Shard (expand-everything batch) is the first trinket to join it.
  // C-branch batch (see data.js) — Storm Grate and Bark Plate join Bulwark Shard here.
  player.bossDamageTakenMult = Math.max(0.25, 1 - 0.25 * (p.stonewall || 0) - (t === 'bulwarkshard' ? 0.15 : 0)
    // newrewards-content batch trinkets (see data.js) — boss damage taken contributions
    - (t === 'redoubtslab' ? 0.08 : 0) - (t === 'redoubtrampart' ? 0.1 : 0) - (t === 'wardingrampart' ? 0.12 : 0)
    - (t === 'bulwarkcog' ? 0.12 : 0) - (t === 'wardinganklet' ? 0.08 : 0) - (t === 'redoubtmark' ? 0.08 : 0)
    - (t === 'crimsonchunk' ? 0.06 : 0) - (t === 'bulwarkknot' ? 0.08 : 0) - (t === 'anchoredchit' ? 0.08 : 0)
    - (t === 'bracedwishbone' ? 0.12 : 0) - (t === 'blastwideplate' ? 0.06 : 0)
    // newrewards-content batch passives (see data.js) — boss damage taken contributions
    - 0.08 * (p.hallowedamulet || 0) - 0.08 * (p.wovencloak || 0) - 0.08 * (p.forsakentalisman || 0)
    - 0.12 * (p.ashengauntlet || 0)
    - (t === 'stormgrate' ? 0.12 : 0) - (t === 'barkplate' ? 0.10 : 0)
    // Mega Update A step 5 — items-5.js tradeoff drawbacks (see data/items-5.js) — boss damage TAKEN penalties (positive here = take more)
    + 0.10 * (p.blastmaster || 0) + 0.10 * (p.martyrsvow || 0) + 0.12 * (p.ancientcloak || 0)
    // Mega Update A step 5 (items-4.js slice) — tradeoff drawback: Precision
    // Trophy II fights bosses from inside their reach, so it ADDS 10% to the
    // damage they deal you (the Math.max(0.25, …) floor is a floor on the
    // multiplier, so this term is never clipped). Stated in its desc.
    + 0.10 * (p.masterytrophy_critslanded_t2 || 0));
  player.spikedBarding = (p.spikedbard || 0) > 0 || t === 'thornedvine';
  // CAPPED at 40%. 15 additive sources at 0.05-0.08, so the uncapped sum
  // crossed 1.0 — every single hit healing half a heart, against a game
  // whose contact damage is half a heart. That isn't a lifesteal build, it
  // is immortality with extra steps.
  player.lifestealChance = Math.min(0.4, 0.08 * (p.vampfang || 0) + 0.08 * (p.crystalfang || 0) + 0.06 * (p.bloodpact || 0) + (t === 'gildedfang' ? 0.05 : 0)
    + 0.06 * (p.sk8i_bloodmarble || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + 0.06 * (p.sk11i_lifewell || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    + (t === 'sk8t_hungryfangcharm' ? 0.05 : 0) // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — lifesteal contributions
    + (t === 'siphonprism' ? 0.06 : 0) + (t === 'emberdrinker' ? 0.05 : 0) + (t === 'vitalarc' ? 0.05 : 0)
    + (t === 'redshifttooth' ? 0.06 : 0) + (t === 'sanguinestar' ? 0.05 : 0) + 0.08 * (p.siphonarray || 0)
    + 0.06 * (p.vitalcondenser || 0) + 0.06 * (p.redshiftfang || 0) + 0.05 * (p.emberdrinkervessel || 0)
    + 0.05 * (p.goldenboots || 0) + 0.06 * (p.quietorb || 0) + 0.05 * (p.weatheredquill || 0)
    + 0.05 * (p.ambersigil || 0) + 0.05 * (p.rustedwhistle || 0) + (t === 'astraltalisman' ? 0.06 : 0)
    + (t === 'lunarband' ? 0.06 : 0) + (t === 'radiantanklet' ? 0.06 : 0)
    + 0.06 * (p.bloodstoneamulet || 0)
    + (t === 'hungrymaw' ? 0.05 : 0) + (t === 'thirstyroot' ? 0.05 : 0)
    // 81-reward superboss-grid batch (see data.js) — lifesteal contributions
    + (t === 'crimsonleech' ? 0.05 : 0) + (t === 'sanguinebead' ? 0.04 : 0)
    + (t === 'vampiricthorn' ? 0.06 : 0) + (t === 'redthirstpin' ? 0.04 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — lifesteal contributions
    + 0.04 * (p.masterytrophy_bombsplaced_t1 || 0) + 0.04 * (p.masterytrophy_activeitemuses_t2 || 0) + 0.04 * (p.explorationtrophy_turretn || 0)
    // expand-everything batch (see data.js) — lifesteal contributions
    + (t === 'bloodthorn' ? 0.05 : 0) + (t === 'leechbead' ? 0.04 : 0)
    // C-branch batch (see data.js) — lifesteal contributions
    // newrewards-content batch trinkets (see data.js) — lifesteal contributions
    + (t === 'thirstyfang' ? 0.05 : 0) + (t === 'leechingfang' ? 0.06 : 0) + (t === 'parchedsipper' ? 0.05 : 0)
    + (t === 'parchedfang' ? 0.06 : 0) + (t === 'dreadfang' ? 0.03 : 0) + (t === 'biliousbarb' ? 0.03 : 0)
    + (t === 'crimsonribbon' ? 0.06 : 0) + (t === 'parchedgear' ? 0.05 : 0) + (t === 'crimsonchunk' ? 0.04 : 0)
    + (t === 'adoringcoil' ? 0.03 : 0) + (t === 'crimsonposy' ? 0.04 : 0) + (t === 'drainingquill' ? 0.05 : 0)
    // newrewards-content batch passives (see data.js) — lifesteal contributions
    + 0.04 * (p.gildedcrown || 0) + 0.04 * (p.wovenvestment || 0) + 0.05 * (p.thirstycirclet || 0)
    + 0.05 * (p.wovenpendant || 0) + 0.05 * (p.sunkengauntlet || 0) + 0.04 * (p.forsakentalisman || 0)
    + (t === 'leechcoil' ? 0.06 : 0) + (t === 'bloodorchid' ? 0.05 : 0));
  // CAPPED. Every term below is additive, most are stacking counts rather than
  // booleans, and `luckBonus` itself is unbounded (luck * 0.006, and luck has no
  // ceiling either) — so the old uncapped sum could and did cross 1.0, at which
  // point every single hit crits and critMultiplier becomes a flat global damage
  // multiplier. 0.75 keeps crit a spike, not a baseline.
  player.critChance = Math.min(0.75, 0.10 * (p.stormbarrel || 0) + 0.08 * (p.boxer || 0) + 0.05 * (p.gamblerscoin || 0) + 0.05 * (p.directhit || 0) + luckBonus
    + 0.05 * (p.sk8i_gamblerbead || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + 0.06 * (p.sk11i_ashencrown || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — crit contributions
    + (t === 'parallaxlens' ? 0.06 : 0) + (t === 'crosshaircluster' ? 0.05 : 0) + (t === 'sightingbead' ? 0.06 : 0)
    + (t === 'apexreticle' ? 0.05 : 0) + (t === 'transitmark' ? 0.05 : 0) + 0.06 * (p.parallaxsight || 0)
    + 0.08 * (p.deadreckoner || 0) + 0.06 * (p.transitscope || 0) + 0.05 * (p.apexcalibration || 0)
    + 0.05 * (p.starsightmonocle || 0)
    + 0.05 * (p.faithfulbell || 0) // Phase 3 overhaul — Shrine batch (see data.js)
    // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js) — crit contributions
    + (t === 'sk8t_deadeyeclasp' ? 0.06 : 0) + (t === 'sk8t_glasscannon' ? 0.08 : 0) - (t === 'sk8t_narrowscope' ? 0.05 : 0)
    + 0.05 * (p.haloedcrown || 0) + 0.05 * (p.graceofthedawn || 0) + 0.10 * (p.souldrain || 0) + 0.05 * (p.bloodoffering || 0)
    + (t === 'crackedlens' ? 0.08 : 0) + (t === 'moltencore' ? 0.05 : 0)
    // 75-achievement + 25-unlocked batch (see data.js) — crit chance contributions
    + 0.05 * (p.cartographerseye || 0) + 0.05 * (p.assassinsedge || 0) + 0.08 * (p.executionersfocus || 0)
    + 0.1 * (p.deathsprecisionblade || 0) + 0.05 * (p.voltaiccore || 0) + 0.05 * (p.deadeyelens || 0)
    + 0.08 * (p.velvetcirclet || 0) + 0.06 * (p.jadequill || 0) + 0.08 * (p.feraltalisman || 0)
    + 0.08 * (p.rustedcharm || 0) + 0.05 * (p.sacredbauble || 0) + 0.05 * (p.etchedhoofguard || 0)
    + 0.05 * (p.frostedband || 0) + (t === 'frostedsigil' ? 0.08 : 0) + (t === 'frozenband' ? 0.05 : 0)
    + (t === 'forgottenboots' ? 0.06 : 0)
    + 0.08 * (p.radianthalofragment || 0) + 0.05 * (p.keeneye || 0)
    + (t === 'precisionring' ? 0.06 : 0) + (t === 'honedblade' ? 0.06 : 0)
    // 81-reward superboss-grid batch (see data.js) — crit chance contributions
    + (t === 'keenedge' ? 0.06 : 0) + (t === 'splittingpin' ? 0.05 : 0) + (t === 'weakpointmap' ? 0.07 : 0)
    + (t === 'focusinglens' ? 0.05 : 0) + (t === 'hairtriggerpin' ? 0.08 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — crit chance contributions
    + 0.05 * (p.masterytrophy_bombsplaced_t2 || 0) + 0.05 * (p.masterytrophy_itemscollected_t1 || 0) + 0.05 * (p.explorationtrophy_turrete || 0)
    // expand-everything batch (see data.js) — crit chance contributions
    + (t === 'sharpsight' ? 0.06 : 0) + (t === 'flawpin' ? 0.05 : 0) + (t === 'truestrikebead' ? 0.07 : 0)
    // C-branch batch (see data.js) — crit chance contributions
    + (t === 'crackedmanhole' ? 0.08 : 0) + (t === 'piranhafang' ? 0.10 : 0) + (t === 'glassgrit' ? 0.06 : 0)
    // newrewards-content batch trinkets (see data.js) — crit chance contributions
    + (t === 'exactingsight' ? 0.08 : 0) + (t === 'sharpedge' ? 0.05 : 0) + (t === 'keenfacet' ? 0.08 : 0)
    + (t === 'exactingfacet' ? 0.07 : 0) + (t === 'hairlinesplinter' ? 0.07 : 0) + (t === 'oiledlens' ? 0.05 : 0)
    + (t === 'exactinghinge' ? 0.07 : 0) + (t === 'focusedwedge' ? 0.06 : 0) + (t === 'fondedge' ? 0.04 : 0)
    + (t === 'scavengedsight' ? 0.05 : 0)
    // newrewards-content batch passives (see data.js) — crit chance contributions
    + 0.05 * (p.runicpendant || 0) + 0.05 * (p.hallowedmantle || 0) + 0.05 * (p.runictalisman || 0)
    + 0.05 * (p.woundcharm || 0) + 0.05 * (p.wovencloak || 0) + 0.06 * (p.sharpvestment || 0)
    + (t === 'spinecactusbarb' ? 0.08 : 0)
    + (t === 'crocshadefang' ? 0.06 : 0) // Phase 7g capstone trinket (see achievements/defs-8.js)
    + 0.05 * (p.keenmark || 0) + 0.03 * (p.quarryhoundtag || 0)
    + (t === 'nightperchring' ? 0.05 : 0) // Gargoyle superboss-grid batch (see data.js)
    + 0.06 * (p.jackpotcharm || 0) // Phase 4 overhaul — Arcade batch (see data/items-5.js)
    + (t === 'shatteredlensfragment' ? 0.06 : 0) // Phase 7h capstone trinket (see achievements/defs-9.js)
    // Synergy E: Twin Fangs — own both the melee- and ranged-flavored Twin
    // Fangs support items (Fang Guard / Quiverstring, see data.js) at once.
    // Membership + amount live in SYNERGY_COMBOS (systems/items-synergy.js).
    // Mega Update A step 5 — items-5.js tradeoff drawbacks (see data/items-5.js) — crit chance penalties
    - 0.05 * (p.deepgauntlet || 0) - 0.04 * (p.forsakenlocket || 0)
    - 0.04 * (p.whirringeffigy || 0) - 0.06 * (p.monarchbracer || 0)
    // Mega Update A step 5, items-1 slice — Soy-Milk-style tradeoff drawback (Lucky Clover).
    - 0.05 * (p.luckyclover || 0)
    + comboBonus(player, 'twinFangs', 'critChance'));
  player.revealMap = (p.nightlens || 0) > 0 || player.eyeUsed || t === 'foxfirelantern';
  player.hasSecondWind = (p.secondwind || 0) > 0 || t === 'emberphylactery';
  // Thirst Fang (expand-everything batch) — the first non-class source of the
  // on-kill heal roll. Rebuilt from def every recalc so it can never compound.
  player.onKillHealChance = (player.def.lifedrinkChance || 0) + (t === 'thirstfang' ? 0.06 : 0)
    + 0.05 * (p.sk8i_healcharm || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + 0.06 * (p.sk11i_healcrest || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — onkill contributions
    + 0.08 * (p.soulcollectorurn || 0) + 0.06 * (p.reclamationcell || 0) + 0.06 * (p.cinderharvester || 0)
    + 0.05 * (p.stardustreaper || 0)
    + 0.06 * (p.blessedhalo || 0) // Phase 3 overhaul — Shrine batch (see data.js)
    // C-branch batch (see data.js) — on-kill heal contributions
    // newrewards-content batch trinkets (see data.js) — on-kill heal contributions
    + (t === 'wakewreath' ? 0.05 : 0) + (t === 'carrionfeather' ? 0.05 : 0) + (t === 'scavengedration' ? 0.05 : 0)
    + (t === 'roaringtally' ? 0.04 : 0) + (t === 'titanbloom' ? 0.04 : 0) + (t === 'reaperanklet' ? 0.05 : 0)
    + (t === 'reapertooth' ? 0.05 : 0) + (t === 'scavengedsight' ? 0.04 : 0) + (t === 'mourningfang' ? 0.05 : 0)
    // newrewards-content batch passives (see data.js) — on-kill heal contributions
    + 0.04 * (p.weatheredgauntlet || 0) + 0.04 * (p.crackedgauntlet || 0) + 0.04 * (p.weatheredeffigy || 0)
    + 0.04 * (p.reaperreliquary || 0) + 0.04 * (p.wovensignet || 0) + 0.04 * (p.sunkenidol || 0)
    + 0.04 * (p.runicrune || 0) + 0.05 * (p.sunkensigil || 0) + 0.05 * (p.scavengedtalisman || 0)
    + 0.06 * (p.crackedcloak || 0)
    + (t === 'carrionbloom' ? 0.06 : 0) + (t === 'vulturecharm' ? 0.05 : 0)
    + 0.08 * (p.lastwaveformcore || 0); // Phase 7f capstone item (see achievements/defs-7.js)

  // on-hit status chances (statuses never affect bosses — see combat.js applyOnHitStatuses).
  // The "direct"/flat items below are deliberately NOT luck-scaled, unlike
  // their luck-scaled counterparts above — a flat, simple alternative source.
  //
  // ALL FIVE CAPPED. Each is a ~12-source additive sum whose lead term is
  // itself a stacking count times luckBonus, and luck has no ceiling — so
  // every one of these could reach 1.0 and stay there. The ceilings differ
  // by how much the status actually takes away from the enemy:
  //   stun (0.30) / freeze (0.35) — a hard lock; at 1.0 nothing in a non-boss
  //     room ever gets a turn again, which is the single most degenerate
  //     state in the build space. Freeze gets the looser of the two only
  //     because the Windigo spends 0.12 of it before picking up a single
  //     item (innateFreezeChance, see data.js) and its whole class identity
  //     is stacking that.
  //   charm (0.35) — doesn't just disable, it converts: the room clears
  //     itself while you stand still.
  //   fear (0.40) — disables offence but the enemy is still alive and moving.
  //   venom (0.50) — pure damage-over-time, the least removal of agency, so
  //     it gets the loosest ceiling.
  player.venomChance = Math.min(0.5, (p.venom ? 0.12 * p.venom + luckBonus : 0) + 0.05 * (p.venomfang || 0) + 0.06 * (p.plaguebreath || 0) + (t === 'emberdust' ? 0.05 : 0)
    + 0.05 * (p.sk8i_venomthorn || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + 0.06 * (p.sk11i_witheredfang || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    + (t === 'sk8t_direstingpin' ? 0.04 : 0) // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — venom contributions
    + (t === 'ionbloomvial' ? 0.05 : 0) + 0.06 * (p.ionbloomcanister || 0)
    + 0.04 * (p.thundercloak || 0) + 0.06 * (p.hollowcompass || 0) + 0.06 * (p.obsidianwisp || 0)
    + 0.06 * (p.roaringcoin || 0) + 0.05 * (p.ancientring || 0) + (t === 'vividseal' ? 0.05 : 0)
    + (t === 'mysticfeather' ? 0.04 : 0) + (t === 'twilightorb' ? 0.05 : 0)
    + 0.06 * (p.venomouskiss || 0) + (t === 'venomvial' ? 0.05 : 0)
    + (t === 'blightedthorn' ? 0.05 : 0) + (t === 'toxicbead' ? 0.04 : 0) + (t === 'seepingvial' ? 0.05 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — venom contributions
    + 0.04 * (p.masterytrophy_shotsfired_t1 || 0) + 0.04 * (p.masterytrophy_itemscollected_t2 || 0) + 0.04 * (p.explorationtrophy_turrets || 0)
    // C-branch Deep Rainforest slayer-trophy batch (see data.js) — venom contributions
    + (t === 'blightbead' ? 0.05 : 0)
    // newrewards-content batch trinkets (see data.js) — venom contributions
    + (t === 'tainteddrop' ? 0.06 : 0) + (t === 'septicfang' ? 0.05 : 0) + (t === 'blightedampule' ? 0.07 : 0)
    + (t === 'acridtrefoil' ? 0.06 : 0) + (t === 'biliousbarb' ? 0.04 : 0) + (t === 'septicspur' ? 0.07 : 0)
    + (t === 'bilioustoken' ? 0.04 : 0) + (t === 'acridveil' ? 0.04 : 0)
    // newrewards-content batch passives (see data.js) — venom contributions
    + 0.04 * (p.ashentalisman || 0) + 0.04 * (p.ancientrune || 0) + 0.04 * (p.hallowedlocket || 0)
    + 0.04 * (p.weatheredreliquary || 0) + 0.04 * (p.forsakenamulet || 0) + 0.04 * (p.sunkenmantle || 0)
    + 0.04 * (p.ashencrown || 0) + 0.06 * (p.ancientmantle || 0)
    + (t === 'sewergasvial' ? 0.06 : 0) // C-branch batch (see data.js)
    // Phase 1 overhaul (see data.js) — venomBloom family + Ecosystem Set capstone
    + 0.04 * (p.plaguebud || 0) + 0.05 * (p.witherpetal || 0) + 0.05 * (p.plaguebloom || 0)
    + 0.06 * (p.rotcrown || 0) + 0.03 * (p.ecosystemtotem || 0)
    + (t === 'chippedgargle' ? 0.04 : 0)); // Gargoyle superboss-grid batch (see data.js)
  player.stunChance = Math.min(0.3, (p.hardhitter ? 0.10 * p.hardhitter + luckBonus : 0) + 0.05 * (p.directstun || 0) + 0.05 * (p.directmalice || 0) + (t === 'frostedpetal' ? 0.05 : 0)
    + 0.06 * (p.sk11i_hexbead || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — stun contributions
    + (t === 'concussionwave' ? 0.05 : 0) + 0.06 * (p.shockfrontemitter || 0)
    + 0.05 * (p.jadelantern || 0) + 0.06 * (p.whisperingidol || 0) + 0.04 * (p.radiantquill || 0)
    + 0.05 * (p.coralinsignia || 0) + 0.05 * (p.gleaminghoofguard || 0) + (t === 'emeraldchain' ? 0.04 : 0)
    + (t === 'thundercompass' ? 0.06 : 0) + (t === 'copperbadge' ? 0.05 : 0)
    + 0.06 * (p.shockcollar || 0) + (t === 'stunbadge' ? 0.05 : 0)
    + (t === 'concussivebell' ? 0.05 : 0) + (t === 'ringingchime' ? 0.04 : 0) + (t === 'stunningclasp' ? 0.04 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — stun contributions
    + 0.04 * (p.masterytrophy_shotsfired_t2 || 0) + 0.04 * (p.masterytrophy_trinketsequipped_t1 || 0) + 0.04 * (p.explorationtrophy_turretw || 0)
    // C-branch Deep Rainforest slayer-trophy batch (see data.js) — stun contributions
    + (t === 'knellchime' ? 0.05 : 0)
    // newrewards-content batch trinkets (see data.js) — stun contributions
    + (t === 'concussiveslug' ? 0.06 : 0) + (t === 'leadenchime' ? 0.05 : 0) + (t === 'ringinghammer' ? 0.05 : 0)
    + (t === 'glidingclapper' ? 0.04 : 0) + (t === 'concussivelace' ? 0.06 : 0) + (t === 'clangingquill' ? 0.04 : 0)
    + (t === 'jarringlace' ? 0.04 : 0) + (t === 'tollingstub' ? 0.04 : 0) + (t === 'dulldram' ? 0.04 : 0)
    + (t === 'tollingribbon' ? 0.04 : 0) + (t === 'clangingchip' ? 0.04 : 0) + (t === 'concussiveescapement' ? 0.06 : 0)
    // newrewards-content batch passives (see data.js) — stun contributions
    + 0.04 * (p.weatheredidol || 0) + 0.04 * (p.tollinglocket || 0) + 0.04 * (p.hallowedrelic || 0)
    + 0.05 * (p.feintingsigil || 0) + 0.06 * (p.leadenbracer || 0)
    + (t === 'floodstunner' ? 0.06 : 0) // C-branch batch (see data.js)
    + (t === 'cracklecharm' ? 0.04 : 0) // Gargoyle superboss-grid batch (see data.js)
    + (t === 'flatlinedcoil' ? 0.06 : 0) // Phase 7f capstone trinket (see achievements/defs-7.js)
    + (t === 'brackishvariant' ? 0.06 : 0) // Phase 7g capstone trinket (see achievements/defs-8.js)
    + (t === 'astralbeaconchit' ? 0.06 : 0) // Phase 7h capstone trinket (see achievements/defs-9.js)
    + (t === 'meridiansummonschit' ? 0.06 : 0) + (t === 'zenithsummonschit' ? 0.06 : 0) // Phase 7h (cont.) capstone trinkets (see achievements/defs-10.js)
    + (t === 'voidsummonschit' ? 0.06 : 0) // Phase 7h (cont.) capstone trinket (see achievements/defs-11.js)
    + (t === 'nullsummonschit' ? 0.06 : 0) + (t === 'eventsummonschit' ? 0.06 : 0)); // Phase 7h (cont.) capstone trinkets (see achievements/defs-12.js)
  player.charmChance = Math.min(0.35, (player.def.innateCharmChance || 0) // Filly — starts with a natural chance to charm on hit, same wiring as Gargoyle's innateVulnerableChance/Windigo's innateFreezeChance
    + 0.05 * (p.sk8i_charmreed || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + (p.flirtatious ? 0.10 * p.flirtatious + luckBonus : 0) + 0.05 * (p.directcharm || 0) + 0.06 * (p.envyshard || 0) + (t === 'lovecharm' ? 0.05 : 0)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — charm contributions
    + (t === 'sirensignal' ? 0.05 : 0)
    + 0.04 * (p.coralgauntlet || 0) + 0.06 * (p.shadowsigil || 0) + 0.05 * (p.mysticcloak || 0)
    + 0.05 * (p.emeraldfeather || 0) + 0.04 * (p.ancienttrinket || 0) + (t === 'jadewisp' ? 0.04 : 0)
    + (t === 'emberbauble' ? 0.05 : 0) + (t === 'radiantring' ? 0.05 : 0)
    + 0.06 * (p.mesmerizingveil || 0) + (t === 'charmedlocket' ? 0.05 : 0)
    + (t === 'sweettalkpin' ? 0.05 : 0) + (t === 'doeeyedcharm' ? 0.04 : 0) + (t === 'honeyedtoken' ? 0.04 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — charm contributions
    + 0.04 * (p.masterytrophy_obstaclesdestroyed_t1 || 0) + 0.04 * (p.masterytrophy_trinketsequipped_t2 || 0) + 0.04 * (p.explorationtrophy_turretplus || 0)
    // C-branch Deep Rainforest slayer-trophy batch (see data.js) — charm contributions
    + (t === 'sirenpin' ? 0.05 : 0)
    // newrewards-content batch trinkets (see data.js) — charm contributions
    + (t === 'adoringpetal' ? 0.05 : 0) + (t === 'velvetposy' ? 0.06 : 0) + (t === 'fondribbon' ? 0.06 : 0)
    + (t === 'rosykeg' ? 0.04 : 0) + (t === 'dotingvoucher' ? 0.04 : 0) + (t === 'roaringposy' ? 0.04 : 0)
    + (t === 'sweethem' ? 0.04 : 0) + (t === 'airylocket' ? 0.04 : 0) + (t === 'adoringwisp' ? 0.07 : 0)
    + (t === 'dotingrivet' ? 0.06 : 0) + (t === 'adoringcoil' ? 0.04 : 0) + (t === 'crimsonposy' ? 0.04 : 0)
    + (t === 'fondedge' ? 0.04 : 0) + (t === 'tollingribbon' ? 0.04 : 0)
    // newrewards-content batch passives (see data.js) — charm contributions
    + 0.04 * (p.ashensigil || 0) + 0.04 * (p.fondsignet || 0) + 0.04 * (p.reaperreliquary || 0)
    + 0.05 * (p.runicamulet || 0)
    + (t === 'sambaflower' ? 0.06 : 0)); // C-branch batch (see data.js)
  player.freezeChance = Math.min(0.35, (player.def.innateFreezeChance || 0) // Windigo — starts with a natural chance to freeze on contact
    + 0.05 * (p.sk8i_frostspindle || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + (p.coldheart ? 0.10 * p.coldheart + luckBonus : 0) + 0.05 * (p.frostbite || 0) + (t === 'staticcharm' ? 0.06 : 0)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — freeze contributions
    + (t === 'absolutezerobead' ? 0.06 : 0) + 0.06 * (p.cryogenicround || 0)
    + 0.06 * (p.frozenthorn || 0)     + 0.05 * (p.braidedinsignia || 0) + 0.06 * (p.stormseal || 0) + 0.05 * (p.stormwhistle || 0)
    + 0.04 * (p.roaringanklet || 0) + 0.05 * (p.mysticgauntlet || 0) + (t === 'silvermirror' ? 0.06 : 0)
    + (t === 'coralrune' ? 0.06 : 0) + (t === 'silveranklet' ? 0.05 : 0)
    + 0.06 * (p.frostboundcloak || 0) + (t === 'frostneedle' ? 0.06 : 0) + (t === 'rimefrostcharm' ? 0.05 : 0)
    + (t === 'hoarfrostbead' ? 0.05 : 0) + (t === 'chillsplinter' ? 0.04 : 0) + (t === 'glacialpin' ? 0.04 : 0)
    + (t === 'sk8t_rimeclasp' ? 0.04 : 0) // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — freeze contributions
    + 0.04 * (p.masterytrophy_obstaclesdestroyed_t2 || 0) + 0.04 * (p.masterytrophy_familiarscollected_t1 || 0) + 0.04 * (p.explorationtrophy_turretx || 0)
    // C-branch Deep Rainforest slayer-trophy batch (see data.js) — freeze contributions
    + (t === 'rimebead' ? 0.05 : 0)
    // newrewards-content batch trinkets (see data.js) — freeze contributions
    + (t === 'rimedbead' ? 0.05 : 0) + (t === 'rimedlattice' ? 0.05 : 0) + (t === 'frostbitflake' ? 0.06 : 0)
    + (t === 'lightlattice' ? 0.04 : 0) + (t === 'frostbittag' ? 0.04 : 0) + (t === 'whisperingnail' ? 0.04 : 0)
    + (t === 'frostbitplume' ? 0.05 : 0) + (t === 'hagglersplinter' ? 0.04 : 0)
    // newrewards-content batch passives (see data.js) — freeze contributions
    + 0.04 * (p.gildedcrown || 0) + 0.06 * (p.numbingmantle || 0) + 0.08 * (p.sleetedcirclet || 0)
    + 0.08 * (p.crackedpendant || 0)
    + (t === 'meltwaterbead' ? 0.06 : 0)); // C-branch batch (see data.js)
  player.fearChance = Math.min(0.4, (p.terrifying ? 0.12 * p.terrifying + luckBonus : 0) + 0.05 * (p.directfear || 0) + 0.06 * (p.despairtoken || 0) + (t === 'spectralveil' ? 0.05 : 0)
    + 0.06 * (p.sk11i_duskveil || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — fear contributions
    + (t === 'darkmatterdread' ? 0.05 : 0)
    + 0.04 * (p.braidedbadge || 0) + 0.04 * (p.duskyboots || 0) + 0.04 * (p.paleinsignia || 0)
    + 0.04 * (p.ironprism || 0) + (t === 'twilightamulet' ? 0.06 : 0) + (t === 'obsidianamulet' ? 0.04 : 0)
    + 0.06 * (p.dreadcloak || 0) + (t === 'dreadfulmask' ? 0.05 : 0)
    + (t === 'grimwhisper' ? 0.05 : 0) + (t === 'hollowmask' ? 0.04 : 0) + (t === 'shudderstone' ? 0.04 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — fear contributions
    + 0.04 * (p.masterytrophy_enemiesfrozen_t1 || 0) + 0.04 * (p.masterytrophy_familiarscollected_t2 || 0) + 0.04 * (p.explorationtrophy_turrettarget || 0)
    // C-branch Deep Rainforest slayer-trophy batch (see data.js) — fear contributions
    + (t === 'dreadbead' ? 0.05 : 0)
    // newrewards-content batch trinkets (see data.js) — fear contributions
    + (t === 'keeningrattle' ? 0.05 : 0) + (t === 'shudderingmask' ? 0.05 : 0) + (t === 'pallidwail' ? 0.06 : 0)
    + (t === 'dreadfang' ? 0.04 : 0) + (t === 'whisperingfleck' ? 0.04 : 0) + (t === 'dreadtag' ? 0.04 : 0)
    + (t === 'whisperingnail' ? 0.04 : 0)
    // newrewards-content batch passives (see data.js) — fear contributions
    + 0.04 * (p.crackedamulet || 0) + 0.04 * (p.pallidcirclet || 0) + 0.04 * (p.sunkenmantle || 0)
    + 0.04 * (p.howlingreliquary || 0) + 0.04 * (p.titanlocket || 0) + 0.05 * (p.shudderinglocket || 0)
    + 0.05 * (p.grislycloak || 0) + 0.05 * (p.longeffigy || 0)
    + (t === 'howlermask' ? 0.06 : 0) // C-branch batch (see data.js)
    + (t === 'gargoylewhisper' ? 0.05 : 0)); // Gargoyle superboss-grid batch (see data.js)

  // Vulnerable — the 6th on-hit status (see combat.js applyOnHitStatuses /
  // entities.js's Enemy.takeDamage 1.5x multiplier). Capped like its five
  // siblings above for the same reason: an uncapped stacking sum could reach
  // 1.0 and every hit would carry the multiplier permanently.
  player.vulnerableChance = Math.min(0.4, (player.def.innateVulnerableChance || 0) // Gargoyle — starts with a natural chance to mark prey vulnerable
    + 0.06 * (p.huntersmark || 0) + 0.04 * (p.quarrysigil || 0) + 0.06 * (p.wardenseye || 0)
    + 0.08 * (p.branderstag || 0) + 0.07 * (p.snareglyph || 0)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — vuln contributions
    + (t === 'targetinglattice' ? 0.06 : 0)
    + 0.05 * (p.predatorseye || 0) + 0.03 * (p.ecosystemtotem || 0)
    + (t === 'duskstonemark' ? 0.05 : 0) + (t === 'stonefeathertag' ? 0.05 : 0)); // Gargoyle superboss-grid batch (see data.js)
  // Synergy B: Rot & Ruin — computed once here, read at the poison-tick site
  // in combat.js's updateStatusEffects (poison ticks hit 30% harder against a
  // target that's also Vulnerable).
  // Condition lives in SYNERGY_COMBOS (systems/items-synergy.js); evaluated
  // HERE because it reads vulnerableChance/venomChance as recalc computes
  // them, before skilltree.js's later multipliers.
  applySynergyComboFlag(player, 'rotAndRuin');

  // CAPPED at 220px. Rooms are ~15-20 tiles across (480-640px), so an
  // uncapped stack of the 12 sources below (~400px) vacuums the entire room
  // from the doorway — every pickup in the level walks itself to you and the
  // whole "go and get it, past the thing guarding it" layer stops existing.
  player.magnetRadius = Math.min(220, (p.coinmagnet ? 55 + 15 * (p.coinmagnet - 1) : 0) + 30 * (p.magnethorseshoe || 0) + (t === 'brokencompass' ? 40 : 0)
    + 25 * (p.sk8i_pullstone || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + 25 * (p.sk11i_pulltotem || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    + (t === 'sk8t_lodestonecharm' ? 30 : 0) // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — magnet contributions
    + (t === 'tidalpull' ? 30 : 0) + (t === 'accretionring' ? 25 : 0) + (t === 'gravitonbead' ? 20 : 0)
    + (t === 'orbitcapture' ? 30 : 0) + (t === 'perigeecharm' ? 20 : 0) + 30 * (p.accretiondisc || 0)
    + 40 * (p.gravitonnet || 0) + 20 * (p.tidallock || 0) + 30 * (p.salvagetractor || 0)
    + 20 * (p.offeringbowl || 0) // Phase 3 overhaul — Shrine batch (see data.js)
    + 20 * (p.solartrinket || 0) + 25 * (p.etchedseal || 0) + 25 * (p.duskygauntlet || 0)
    + 30 * (p.amberhorseshoe || 0) + (t === 'rustedvial' ? 25 : 0) + (t === 'feralboots' ? 30 : 0)
    + (t === 'ivorycompass' ? 25 : 0)
    + 30 * (p.junkyardmagnet || 0) + (t === 'pullstone' ? 40 : 0)
    + (t === 'draweringot' ? 40 : 0) + (t === 'lodestonechip' ? 25 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — magnet radius contributions
    + 20 * (p.masterytrophy_enemiesfrozen_t2 || 0) + 20 * (p.masterytrophy_roomscleared_t1 || 0) + 20 * (p.explorationtrophy_bombbarrel || 0)
    // C-branch Deep Rainforest slayer-trophy batch (see data.js) — magnet radius contributions
    + (t === 'pullbead' ? 25 : 0)
    // newrewards-content batch trinkets (see data.js) — magnet radius contributions
    + (t === 'hummingstone' ? 30 : 0) + (t === 'graspingcoil' ? 30 : 0) + (t === 'graspingstone' ? 30 : 0)
    + (t === 'ruinouschip' ? 25 : 0) + (t === 'hummingsprocket' ? 35 : 0) + (t === 'fourleafstone' ? 25 : 0)
    + (t === 'rendingwhorl' ? 20 : 0) + (t === 'clangingchip' ? 25 : 0) + (t === 'graspingcasing' ? 20 : 0)
    // newrewards-content batch passives (see data.js) — magnet radius contributions
    + 20 * (p.pullingsignet || 0) + 25 * (p.beckoningcirclet || 0) + 25 * (p.runiccrown || 0)
    + 25 * (p.lodeeffigy || 0) + 30 * (p.hallowedpendant || 0) + 30 * (p.forsakensignet || 0)
    + 30 * (p.beckoningvestment || 0) + 30 * (p.pullingidol || 0)
    + (t === 'lodedrainmagnet' ? 40 : 0) + (t === 'siphonhose' ? 30 : 0) // C-branch batch (see data.js)
    + (t === 'eaveperchmark' ? 20 : 0)); // Gargoyle superboss-grid batch (see data.js)
  // CAPPED at 2.5x. Base blast radius is 92px (see combat.js's explodeAt),
  // and there are ~22 additive sources at 0.1-0.3 below — uncapped that is a
  // 400px+ blast, i.e. one bomb clears every enemy, rock, and chest in the
  // room from wherever you happen to be standing, with explosionDamage()
  // now riding the depth curve behind it.
  player.bombRadiusMult = Math.min(2.5, 1 + 0.25 * (p.bombrangeup || 0) + 0.10 * (p.blastcharm || 0) + 0.15 * (p.moonlitpetal || 0)
    + 0.10 * (p.sk8i_bombshell || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + 0.12 * (p.sk11i_bombward || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — bomb contributions
    + (t === 'impactorfuse' ? 0.15 : 0) + (t === 'cratercharm' ? 0.1 : 0) + (t === 'airburstcap' ? 0.12 : 0)
    + (t === 'shockfrontchip' ? 0.1 : 0) + (t === 'ejectapebble' ? 0.1 : 0)
    + 0.10 * (p.sanctifiedwax || 0) // Phase 3 overhaul — Shrine batch (see data.js)
    + 0.20 * (p.barrelroller || 0) + (t === 'sootyfeather' ? 0.10 : 0)
    // 75-achievement + 25-unlocked batch (see data.js) — bomb radius contributions
    + 0.15 * (p.quarrymanscharm || 0) + 0.25 * (p.rubblerunner || 0) + 0.15 * (p.blastproofgloves || 0)
    + 0.15 * (p.graniteknuckles || 0) + 0.2 * (p.demolitionistsbadge || 0) + 0.3 * (p.rubblekingscrown || 0)
    + 0.3 * (p.worldbreakergauntlet || 0) + 0.2 * (p.blastresistantvest || 0)
    + 0.2 * (p.wanderingchain || 0) + 0.2 * (p.sacredtoken || 0) + 0.1 * (p.jadecrown || 0)
    + 0.2 * (p.forgottenrune || 0) + 0.15 * (p.blessedbell || 0) + (t === 'fadedgauntlet' ? 0.1 : 0)
    + (t === 'coralcrown' ? 0.2 : 0) + (t === 'forgottensigil' ? 0.1 : 0)
    + 0.3 * (p.detonationspecialistbadge || 0) + 0.2 * (p.bouldershoulder || 0) + 0.10 * (p.dragonfirecore || 0)
    + (t === 'cinderkeg' ? 0.15 : 0)
    + (t === 'sk8t_cinderpouch' ? 0.12 : 0) // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js)
    // Phase 4 overhaul — Arcade batch (see data/items-5.js) — bomb radius contributions
    + 0.12 * (p.cherrybomb || 0) + 0.10 * (p.sparkfuse || 0) + 0.20 * (p.demolitionrig || 0) + 0.20 * (p.blastmaster || 0)
    // 81-reward superboss-grid batch (see data.js) — bomb radius contributions
    + (t === 'powderhorn' ? 0.15 : 0) + (t === 'fusedcasing' ? 0.10 : 0) + (t === 'blastwidener' ? 0.12 : 0)
    // Slice 8 mastery/exploration-trophy batch (see data.js) — bomb radius contributions
    + 0.1 * (p.masterytrophy_turretsdestroyed_t1 || 0) + 0.1 * (p.masterytrophy_roomscleared_t2 || 0) + 0.1 * (p.explorationtrophy_pushablebombbarrel || 0)
    // C-branch Deep Rainforest slayer-trophy batch (see data.js) — bomb radius contributions
    + (t === 'kegchip' ? 0.12 : 0)
    // newrewards-content batch trinkets (see data.js) — bomb radius contributions
    + (t === 'fumingkeg' ? 0.15 : 0) + (t === 'scatteringhorn' ? 0.2 : 0) + (t === 'blastwidewick' ? 0.1 : 0)
    + (t === 'rosykeg' ? 0.1 : 0) + (t === 'roaringtally' ? 0.08 : 0) + (t === 'roaringposy' ? 0.08 : 0)
    + (t === 'blastwideplate' ? 0.08 : 0) + (t === 'graspingcasing' ? 0.1 : 0)
    // newrewards-content batch passives (see data.js) — bomb radius contributions
    + 0.1 * (p.runicpendant || 0) + 0.1 * (p.widecirclet || 0) + 0.1 * (p.weatheredcharm || 0)
    + 0.1 * (p.scatteringeffigy || 0) + 0.15 * (p.scatteringrelic || 0) + 0.2 * (p.sleetedcirclet || 0)
    + (t === 'methanepocket' ? 0.20 : 0) + (t === 'brazilnutcharge' ? 0.15 : 0) + (t === 'sludgecharge' ? 0.25 : 0) // C-branch batch (see data.js)
    // Mega Update A step 5 (items-4.js slice) — tradeoff drawback: Demolition
    // Habit Trophy II trades powder for aim — its +5% crit chance costs 15% of
    // your blast radius. Stated in its desc.
    - 0.15 * (p.masterytrophy_bombsplaced_t2 || 0));
  // tearFlags — see entities.js's Player constructor. pierce absorbs every
  // item that used to write its own separate pierceCount field; homing/
  // spectral/explosive are new mechanics, driven entirely by items that set
  // them here (the crystal/sombra pool pair for each — see data.js)
  player.tearFlags.pierce = (p.piercingshot || 0) + (p.hawkfeather || 0) + (p.spiderring || 0) + (t === 'ironfilings' ? 1 : 0)
    + (p.sk8i_hawkloupe || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + (p.sk11i_direarrow || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    + 1 * (p.whisperingband || 0) + 1 * (p.goldenmedallion || 0) + 1 * (p.ambershard || 0)
    + 1 * (p.sacredsash || 0) + (t === 'ancienthoofguard' ? 1 : 0) + (t === 'moltencoin' ? 1 : 0)
    + (t === 'crackedcoin' ? 1 : 0) + (t === 'piercingneedle' ? 1 : 0)
    + (t === 'sk8t_awlspike' ? 1 : 0) // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js)
    + (p.endlessquiver || 0) + (p.barragecore || 0) + (p.longbowstring || 0)
    + (t === 'awlneedle' ? 1 : 0)
    // newrewards-content batch trinkets (see data.js) — pierce contributions
    + (t === 'threadingbodkin' ? 1 : 0)
    // newrewards-content batch passives (see data.js) — pierce contributions
    + (p.threadingcrown || 0) + (p.boringpendant || 0) + (p.hallowedsignet || 0)
    + (p.asheneffigy || 0)
    + (t === 'rustedharpoon' ? 1 : 0); // C-branch batch (see data.js)
  // the three flags below gained their first trinket sources in the
  // expand-everything batch (see data.js) — Lodestar Sight / Ghost Quill /
  // Blastcap Seed. One count each, exactly like a single item copy.
  player.tearFlags.homing = (p.haloguidance || 0) + (p.hexedtracker || 0) + (p.deadeyelens || 0) + (t === 'lodestarsight' ? 1 : 0)
    // newrewards-content batch trinkets (see data.js) — homing contributions
    + (t === 'trackingwhisker' ? 1 : 0)
    + (t === 'trackerbeetle' ? 1 : 0); // C-branch batch (see data.js)
  player.tearFlags.spectral = (p.prismveil || 0) + (p.wraithrounds || 0) + (t === 'ghostquill' ? 1 : 0)
    // newrewards-content batch trinkets (see data.js) — spectral contributions
    + (t === 'mistypane' ? 1 : 0)
    + (t === 'mistbolt' ? 1 : 0); // C-branch batch (see data.js)
  player.tearFlags.explosive = (p.radiantburst || 0) + (p.brimstonevial || 0) + (t === 'blastcapseed' ? 1 : 0)
    // newrewards-content batch trinkets (see data.js) — explosive bolts contributions
    + (t === 'fulminatenut' ? 1 : 0)
    // newrewards-content batch passives (see data.js) — explosive bolts contributions
    + (p.blastcapreliquary || 0) + (p.ashenreliquary || 0) + (p.crackedrune || 0)
    + (p.poppingtalisman || 0)
    + (t === 'seedpodshell' ? 1 : 0); // C-branch batch (see data.js)
  // Multishot used to grant TWO extra bolts per copy — i.e. one pickup tripled
  // your ranged damage output, stacking multiplicatively with every flat +damage
  // item on top. It was the definition of "the run is decided by whether you
  // find one specific item". One extra bolt per copy still makes it the best
  // offensive item in the pool; it just no longer ends the balance conversation.
  // ...and CAPPED at 4 extra (5 bolts). Each copy is a straight multiplier on
  // ranged output — the one stat in the game that compounds with every flat
  // +damage item at once — and Multi Shot/Double Barrel both stack without
  // limit. 5 bolts at the 0.16rad spread in combat.js's playerRangedAttack is
  // also about where the fan stops reading as a fan and starts being a wall.
  player.multishotExtra = Math.min(4, (p.multishot || 0) + (p.doublebarrel || 0) + (t === 'silverbell' ? 1 : 0)
    + (p.sk8i_doubleshot || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + (t === 'sk8t_twinnotch' ? 1 : 0) // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js)
    // newrewards-content batch trinkets (see data.js) — multishot contributions
    + (t === 'twinnedchime' ? 1 : 0)
    + (t === 'tripleoutfall' ? 1 : 0)); // C-branch batch (see data.js)
  // CAPPED for the same reason crit is, except the degenerate end state here is
  // strictly worse: dodgeChance >= 1 means the player simply cannot be hit by
  // anything, ever. 0.6 is still an enormous defensive stat.
  player.dodgeChance = Math.min(0.6, 0.10 * (p.guardianhalo || 0) + 0.04 * (p.stonehide || 0) + 0.06 * (p.wingedgrace || 0) + 0.05 * (p.gildedwing || 0)
    + 0.05 * (p.sk8i_swiftdodge || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + 0.06 * (p.sk11i_dodgering || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — dodge contributions
    + (t === 'phaseveil' ? 0.06 : 0) + (t === 'eventshoreveil' ? 0.05 : 0) + (t === 'umbralshroud' ? 0.06 : 0)
    + (t === 'slipstreamsash' ? 0.05 : 0) + (t === 'nulltrace' ? 0.05 : 0) + 0.08 * (p.phaseshiftmantle || 0)
    + 0.06 * (p.umbralcloak || 0) + 0.08 * (p.eventhorizonveil || 0) + 0.05 * (p.vacuumshroud || 0)
    + 0.06 * (p.nebulaveil || 0)
    + (t === 'crackedhoofprint' ? 0.05 : 0) + (t === 'goldenfeather' ? 0.05 : 0)
    // 75-achievement + 25-unlocked batch (see data.js) — dodge chance contributions
    + 0.05 * (p.trinketcase || 0) + 0.08 * (p.charmbracelet || 0) + 0.08 * (p.doomwalkerscloak || 0)
    + 0.08 * (p.antiturretplating || 0) + 0.08 * (p.sentrywreckersfist || 0) + 0.06 * (p.hardenedscales || 0)
    + 0.05 * (p.moonkissedpelt || 0) + (t === 'nimbleanklet' ? 0.05 : 0)
    + (t === 'sk8t_eelskinwrap' ? 0.05 : 0) // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js)
    + (t === 'duskveil' ? 0.05 : 0)
    // newrewards-content batch trinkets (see data.js) — dodge contributions
    + (t === 'ghostingcloak' ? 0.06 : 0) + (t === 'fainthem' ? 0.05 : 0) + (t === 'shiftingveil' ? 0.07 : 0)
    + (t === 'horizonveil' ? 0.04 : 0) + (t === 'sweethem' ? 0.04 : 0) + (t === 'acridveil' ? 0.04 : 0)
    // newrewards-content batch passives (see data.js) — dodge contributions
    + 0.04 * (p.scatteringeffigy || 0) + 0.04 * (p.wispinggauntlet || 0) + 0.04 * (p.ghostingcharm || 0)
    + 0.05 * (p.sunkenidol || 0) + 0.06 * (p.forsakenlocket || 0) + 0.06 * (p.feintingsigil || 0)
    + 0.06 * (p.monarchbracer || 0)
    + (t === 'eelskinwrap' ? 0.06 : 0) + (t === 'mistcloak' ? 0.05 : 0) + (t === 'leafveil' ? 0.07 : 0) // C-branch batch (see data.js)
    // Mega Update A step 5 — items-5.js tradeoff drawbacks (see data/items-5.js) — dodge penalties
    - 0.04 * (p.crackedcloak || 0) - 0.04 * (p.hallowedpendant || 0)
    // Mega Update A step 5, items-1 slice — Soy-Milk-style tradeoff drawback (Blink Crystal while held as the active item).
    - (player.activeItem && player.activeItem.id === 'blinkcrystal' ? 0.06 : 0)
    + (t === 'rooststonebead' ? 0.08 : 0) + (t === 'hollowstonecoin' ? 0.04 : 0)); // Gargoyle superboss-grid batch (see data.js)
  // Synergy C: Marksman's Eye — a high crit chance backed by any Vulnerable
  // source at all. Computed here (needs critChance/vulnerableChance, both
  // already set above) and stored as a named boolean (see ecosystemSetActive/
  // rotAndRuinActive) so the HUD synergy badge (ui.js) can read it without
  // duplicating the condition.
  // Condition lives in SYNERGY_COMBOS (systems/items-synergy.js); evaluated
  // HERE for the same reason as rotAndRuin above.
  applySynergyComboFlag(player, 'marksmansEye');
  // CAPPED, and Razor Focus knocked from +1 to +0.5. At +1 per copy it was
  // worth more than every other crit-multiplier item in the game combined, and
  // it stacks — two copies used to take a x2 crit to x4, which on top of an
  // uncapped crit CHANCE was the single most degenerate interaction in the build
  // space. x4 is now the ceiling rather than the mid-point.
  player.critMultiplier = Math.min(4, 2 + 0.5 * (p.razorfocus || 0) + 0.3 * (p.razorwing || 0) + (t === 'steadyhand' ? 0.5 : 0)
    + 0.3 * (p.sk8i_sharpwhet || 0) // Phase 8e slice 4 — Skill Tree item-unlock batch (see data/items-5.js)
    + 0.3 * (p.sk11i_edgehone || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    + (t === 'sk8t_ricochetcoil' ? 0.4 : 0) // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — critmult contributions
    + (t === 'killshotcalibrator' ? 0.5 : 0) + (t === 'penetratorcore' ? 0.3 : 0)
    + 0.2 * (p.executionersfocus || 0) + 0.4 * (p.deathsprecisionblade || 0)
    // newrewards-content batch trinkets (see data.js) — crit multiplier contributions
    + (t === 'splittingrift' ? 0.4 : 0) + (t === 'deeprift' ? 0.3 : 0) + (t === 'ruinouschip' ? 0.3 : 0)
    + (t === 'viciouschit' ? 0.3 : 0) + (t === 'rendingwhorl' ? 0.2 : 0) + (t === 'skimmingrift' ? 0.2 : 0)
    // newrewards-content batch passives (see data.js) — crit multiplier contributions
    + 0.2 * (p.heavyamulet || 0) + 0.2 * (p.viciousrune || 0) + 0.2 * (p.splittingrelic || 0)
    + 0.4 * (p.deepgauntlet || 0)
    + (t === 'bassdropcore' ? 0.5 : 0) + (t === 'talonpick' ? 0.3 : 0) // C-branch batch (see data.js)
    // Synergy C: Marksman's Eye — see player.marksmansEyeActive above; the
    // +0.4 lives in SYNERGY_COMBOS and is read here, inside this Math.min(4)
    // cap, exactly where it has always been applied.
    + comboBonus(player, 'marksmansEye', 'critMultiplier'));
  player.canFly = player.def.canFly || (p.borrowedwings || 0) > 0 || t === 'kitestring';
  // devil deals cost less with Deal Maker — see game.js's updateItemPedestal,
  // which already floors the final cost at half a heart, so this can never
  // make a deal free. CAPPED at one heart of discount anyway: past two copies
  // every deal in the game is pinned to that 0.5 floor regardless of what it
  // was priced at, which erases the "this one is expensive" signal entirely.
  player.dealDiscount = Math.min(1, 0.5 * (p.dealmaker || 0) + (t === 'pawnbrokerschit' ? 0.5 : 0)
    // newrewards-content batch trinkets (see data.js) — devil deal discount contributions
    + (t === 'signedcontract' ? 0.5 : 0)
    // newrewards-content batch passives (see data.js) — devil deal discount contributions
    + 0.5 * (p.hallowedbracer || 0)
    + (t === 'drownedcontract' ? 0.5 : 0)); // C-branch batch (see data.js)
  // shop discounts — see items.js's updateShop below (loyaltybadge pattern).
  // The individual bonus is capped here and the COMBINED discount is capped
  // again at purchase time in updateShop, since Merchant's Ring and Pocket
  // Ledger are added on top of this and the three together could exceed 100%.
  player.shopDiscountBonus = Math.min(0.5, 0.05 * (p.loyalpatron || 0) + 0.10 * (p.mastervaultkeeper || 0)
    + 0.05 * (p.sk11i_coinpurse || 0) // Phase 11 item 4 — Skill Tree item-unlock batch 2 (see data/items-6.js)
    // Phase 7a batch (see data/trinkets-2.js / data/items-5.js) — shop contributions
    + (t === 'bartertoken' ? 0.05 : 0) + (t === 'freightmanifest' ? 0.05 : 0)
    // 75-achievement + 25-unlocked batch (see data.js) — shop discount contributions
    + 0.05 * (p.frequentbuyercard || 0) + 0.1 * (p.vipmembershipcard || 0) + 0.05 * (p.frequentflyercoin || 0)
    + 0.1 * (p.merchantsbestfriendbadge || 0) + 0.05 * (p.masterkeyring || 0) + 0.05 * (p.discountcharm || 0)
    + (t === 'sk8t_hagglerspurse' ? 0.08 : 0) // Phase 8e slice 2 (sk8t_ — see data/trinkets-2.js)
    + (t === 'hagglerstag' ? 0.1 : 0)
    // newrewards-content batch trinkets (see data.js) — shop discount contributions
    + (t === 'pennychit' ? 0.08 : 0) + (t === 'thriftledger' ? 0.1 : 0) + (t === 'dotingvoucher' ? 0.06 : 0)
    + (t === 'tollingstub' ? 0.06 : 0) + (t === 'colossusstub' ? 0.06 : 0) + (t === 'anchoredchit' ? 0.06 : 0)
    + (t === 'hagglersplinter' ? 0.06 : 0)
    // newrewards-content batch passives (see data.js) — shop discount contributions
    + 0.05 * (p.ashensigil || 0) + 0.05 * (p.ashensignet || 0) + 0.05 * (p.couponcloak || 0)
    + 0.05 * (p.weatheredcrown || 0) + 0.08 * (p.couponvestment || 0) + 0.08 * (p.pennylocket || 0)
    + 0.05 * (p.runicamulet || 0) + 0.05 * (p.sunkensigil || 0)
    + (t === 'scavengerstoken' ? 0.10 : 0) + (t === 'barterbead' ? 0.08 : 0) // C-branch batch (see data.js)
    + 0.05 * (p.tithepurse || 0) // Phase 3 overhaul — Shrine batch (see data.js)
    + 0.05 * (p.vaultcrackerskit || 0) // Phase 4 overhaul — Arcade batch (see data/items-5.js)
    + (t === 'threadbarepurse' ? 0.05 : 0) // Phase 7f capstone trinket (see achievements/defs-7.js)
    + (t === 'emptycreel' ? 0.05 : 0) // Phase 7g capstone trinket (see achievements/defs-8.js)
    + (t === 'emptylenscase' ? 0.05 : 0) // Phase 7h capstone trinket (see achievements/defs-9.js)
    + (t === 'emptygearbox' ? 0.05 : 0) // Phase 7h (cont.) capstone trinket (see achievements/defs-10.js)
    + (t === 'hollowdriftpouch' ? 0.05 : 0) // Phase 7h (cont.) capstone trinket (see achievements/defs-11.js)
    + (t === 'emptyeventpurse' ? 0.05 : 0)); // Phase 7h (cont.) capstone trinket (see achievements/defs-12.js)
  // Cursed rooms deal no entry/exit damage tax at all with Holy Water — see
  // game.js's transitionThroughDoor
  player.curseImmune = (p.holywater || 0) > 0 || t === 'blessedcenser';

  // "layered attacks" pass (see js/attackStyles.js) — a transformative item
  // carries an `attackLayer:{style,...params}` field on its data.js entry
  // instead of (or alongside) ordinary stat bonuses. Rebuilt from scratch
  // every recalc, same as every other derived stat above, rather than
  // pushed imperatively at pickup time — items are never lost mid-run, so
  // this is just as correct and stays consistent with how the rest of this
  // function already works. `count` carries how many copies are owned, for
  // any style that wants to scale with stacking.
  player.attackLayers = [];
  for (const it of ITEM_LIST) {
    if (!it.attackLayer) continue;
    const count = p[it.id] || 0;
    if (count > 0) player.attackLayers.push(Object.assign({ itemId: it.id, count }, it.attackLayer));
  }

  // Phase 8b — skill tree stat bonuses, applied last so they multiply the
  // fully-derived value above rather than being overwritten by it. See
  // achievements/skilltree.js's applySkillTreeStatBonuses.
  applySkillTreeStatBonuses(player);

  // Mega Update A step 5 — per-class item bonuses (`classSynergy` on an item's
  // data entry) and non-legacy item-item combos (SYNERGY_COMBOS). Both use the
  // shadow-base/clamp pattern so repeated recalcs never compound. See
  // systems/items-synergy.js.
  applyItemClassSynergyBonuses(player);
  applyItemComboSynergies(player);
}

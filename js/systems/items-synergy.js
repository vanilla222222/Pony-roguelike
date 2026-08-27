'use strict';
/* ============================================================
   systems/items-synergy.js — Mega Update A / step 5 infrastructure.

   Two additive engine layers on top of recalcPlayerStats (systems/items-1.js):

   1. `classSynergy` — an optional declarative field on an ITEM's data.js
      entry: `classSynergy: { <classId>: { field, amount } }`. Lets one item
      mean something DIFFERENT for each of the 25 classes instead of granting
      the same flat stat to everyone. Applied by
      `applyItemClassSynergyBonuses(player)`.

   2. `SYNERGY_COMBOS` — the single source of truth for item-item (and
      item-state) synergies: the condition that turns a synergy on, the HUD
      flag it sets, and the stat bonuses it grants. Includes the 5 legacy
      synergies (Ecosystem Set / Rot & Ruin / Marksman's Eye / Pack Bond /
      Twin Fangs), migrated here from hardcoded expressions in
      recalcPlayerStats. Applied by `applyItemComboSynergies(player)` (new
      combos) and, for the 5 legacy ones, read in place by
      `applySynergyComboFlag()` + `comboBonus()` — see LEGACY STAGE below.

   ---------------------------------------------------------------
   SHADOW-BASE DISCIPLINE (read before adding anything here)
   ---------------------------------------------------------------
   recalcPlayerStats runs MANY times per run (every item/pill/star/familiar
   pickup — see its call sites), recomputing every derived stat from scratch.
   Any bonus added here with a plain `player.field += x` would therefore be
   re-added on every subsequent pickup and compound over the run. Both
   functions below instead use the shadow-base pattern proven by
   `applySkillTreeUniqueFieldBonuses` (achievements/skilltree.js): keep the
   field's PRISTINE (pre-bonus) value on a dedicated `player._…Base` map and
   always recompute `player[field] = base + clamp(bonus)` from it — never
   accumulate onto the live value.

   One deliberate difference from skilltree.js's version: that function
   targets per-instance shadow fields (crystalShardCount etc.) that recalc
   never recomputes, so it captures the base ONCE, for the life of the run.
   Every field these two functions target is instead re-derived from scratch
   by recalcPlayerStats on every call, so a once-captured base would go stale
   the moment any other item changed that stat (dropping an item would then
   leave the old, higher base behind). So the base is RE-captured each pass —
   with a `_…Last` guard recording the value we wrote, so that if a field ever
   were NOT reassigned by recalc before we run, we recognise our own previous
   output and reuse the stored base instead of folding the bonus into it.
   Both together make the layer idempotent under any call pattern.

   ---------------------------------------------------------------
   LEGACY STAGE (why the 5 old synergies are `stage:'legacy'`)
   ---------------------------------------------------------------
   The 5 pre-existing synergies' numeric bonuses sat INSIDE recalcPlayerStats'
   own clamp expressions (`Math.max(0.5, …)` for melee/rangedDamage,
   `Math.min(4, …)` for critMultiplier), and two of them (Rot & Ruin,
   Marksman's Eye) are conditioned on stats that skilltree.js later modifies.
   Moving their arithmetic to the end of recalcPlayerStats would have CHANGED
   their values (e.g. a ranged class with `meleeDamage: 0` currently floors at
   0.5 with Ecosystem Set, but would become 0.8 if the +0.3 were applied after
   the floor). So legacy combos keep their evaluation POSITION — recalc calls
   `applySynergyComboFlag(player, p, id)` where the flag used to be computed
   and `comboBonus(player, id, field)` where the number used to be typed — but
   the condition and the numbers now live only here. `applyItemComboSynergies`
   deliberately skips `stage:'legacy'` entries so they are never applied twice.
   NEW combos have no such constraint: they default to `stage:'post'` and are
   applied wholly by `applyItemComboSynergies` at the end of recalc.
   ============================================================ */

// Default symmetric clamp for a single stat channel, matching the skill
// tree's ±0.25 convention for percentage-scale fields (SKILL_TREE_STAT_CAP).
const ITEM_SYNERGY_DEFAULT_CLAMP = 0.25;

// Fields that are NOT on a 0..1 percentage scale need their own flat clamp,
// or ±0.25 would be either meaningless (speed, in px/s) or absurd
// (meleeDamage, in whole hearts). One entry per non-percentage field the
// synergy layers are allowed to target; anything absent uses ±0.25.
const ITEM_SYNERGY_FIELD_CLAMPS = {
  meleeDamage: 3,      // whole damage points; ±3 ≈ the biggest single legacy damage item stack
  rangedDamage: 3,
  luck: 3,             // luck is an integer-ish channel (see recalcPlayerStats' luck sum)
  speed: 20,           // absolute px/s (baseSpeed * mult), typical value ~120-180
  meleeRange: 16,      // pixels (rangeTiles * TILE)
  boltSpeed: 60,       // px/s, class flavor default 340
  meleeCooldown: 0.15, // seconds (~0.4 typical) — negative = faster
  fireCooldown: 0.15,
  critMultiplier: 1,   // multiplier points on a 2..4 scale
  multishotExtra: 2,   // whole extra projectiles
  magnetRadius: 40,    // pixels, capped at 220 upstream
  bombRadiusMult: 0.25
};

// Numeric stat channels a `classSynergy`/combo effect may target. These are
// exactly the fields recalcPlayerStats assigns and the rest of the engine
// reads; `attackType` is deliberately absent (it is a per-class string, not
// an item-mutable number), as are the boolean synergy OUTPUT flags.
const ITEM_SYNERGY_FIELDS = ['boltSpeed','bombRadiusMult','bossDamageBonus','bossDamageTakenMult','charmChance',
  'critChance','critMultiplier','dealDiscount','dodgeChance','fearChance','fireCooldown','freezeChance',
  'lifestealChance','luck','magnetRadius','meleeCooldown','meleeDamage','meleeRange','multishotExtra',
  'onKillHealChance','rangedDamage','shopDiscountBonus','speed','stunChance','venomChance','vulnerableChance'];

function itemSynergyClamp(field){
  const c = Object.prototype.hasOwnProperty.call(ITEM_SYNERGY_FIELD_CLAMPS, field)
    ? ITEM_SYNERGY_FIELD_CLAMPS[field] : ITEM_SYNERGY_DEFAULT_CLAMP;
  return c;
}

/* ------------------------------------------------------------
   1. classSynergy — per-class item bonuses
   ------------------------------------------------------------
   Item data shape (data/items-N.js):
     classSynergy: {
       earth:   { field: 'meleeDamage', amount: 1 },
       unicorn: { field: 'critChance',  amount: 0.05 }
     }
   Only classes with a deliberately-authored unique interaction need an
   entry; a class with no entry simply gets no class-specific bonus from
   that item. Multiple owned items targeting the same field for the current
   class sum, then the SUM is clamped once to ±itemSynergyClamp(field).
   Copies of a stacking item multiply the amount by the owned count.
   ------------------------------------------------------------ */
function applyItemClassSynergyBonuses(player){
  if (!player || !player.passives || typeof ITEM_LIST === 'undefined') return;
  const p = player.passives;
  const groups = {}; // field -> summed bonus for player.classId
  for (const it of ITEM_LIST) {
    if (!it.classSynergy) continue;
    const count = p[it.id] || 0;
    if (count <= 0) continue;
    const eff = it.classSynergy[player.classId];
    if (!eff || !eff.field || typeof eff.amount !== 'number') continue;
    if (ITEM_SYNERGY_FIELDS.indexOf(eff.field) === -1) continue; // not a sanctioned target channel
    groups[eff.field] = (groups[eff.field] || 0) + eff.amount * count;
  }
  // Shadow-base: see the header. Keyed by field, and dropped wholesale if
  // player.classId ever changes so bases are never mixed across classes.
  if (!player._itemClassSynergyBase || player._itemClassSynergyBaseClass !== player.classId) {
    player._itemClassSynergyBase = {};
    player._itemClassSynergyLast = {};
    player._itemClassSynergyBaseClass = player.classId;
  }
  applySynergyFieldBonuses(player, groups, player._itemClassSynergyBase, player._itemClassSynergyLast);
}

/* Shared shadow-base writer used by both layers below/above.
   `groups` is field -> raw bonus; `bounds` (optional) is field -> {min,max},
   defaulting to ±itemSynergyClamp(field). `bases`/`last` are the caller's own
   persistent maps on the player. See the SHADOW-BASE DISCIPLINE header. */
function applySynergyFieldBonuses(player, groups, bases, last, bounds){
  // A field that was bonused on an earlier pass but has no bonus now must
  // still be visited, so the pristine value is restored when the last item
  // granting it is dropped.
  for (const field in bases) if (!(field in groups)) groups[field] = 0;
  for (const field in groups) {
    if (typeof player[field] !== 'number') continue;
    // Re-capture the base unless the field still holds exactly what we wrote
    // last time (i.e. recalc did not re-derive it before calling us).
    if (!(field in last) || player[field] !== last[field]) bases[field] = player[field];
    const c = itemSynergyClamp(field);
    const b = (bounds && bounds[field]) || { min: -c, max: c };
    player[field] = bases[field] + Util.clamp(groups[field], b.min, b.max);
    last[field] = player[field];
  }
}

/* ------------------------------------------------------------
   2. SYNERGY_COMBOS — item-item combo registry
   ------------------------------------------------------------
   Entry shape:
     {
       id,                       // stable internal id
       name,                     // display name
       desc,                     // one-line design description
       flag,                     // optional player.<flag> boolean for HUD badges (ui.js SYNERGY_BADGES)
       items: [itemId, ...],     // ALL must be owned (count > 0)
       anyOf: [[id,...], ...],   // optional: each inner group needs >= 1 owned item
       when: (player, p) => bool,// optional extra predicate (state-derived synergies)
       effects: [{field, amount, min?, max?}],  // optional stat bonuses (shadow-base + clamped)
       stage: 'post' | 'legacy'  // 'legacy' = applied in place by recalc; see header
     }
   A combo with only a `flag` and no `effects` is a valid flag-only combo
   (Twin Fangs is exactly that today).
   ------------------------------------------------------------ */
const SYNERGY_COMBOS = [
  // --- Legacy synergy A: Ecosystem Set -------------------------------
  // One item from each of the three attackLayer families (markedForDeath /
  // venomBloom / skyfall) => +0.3 to both damage channels.
  {
    id: 'ecosystemSet',
    name: 'Ecosystem Set',
    desc: 'Own a Mark, a Bloom and a Skyfall item at once: +0.3 melee and ranged damage.',
    flag: 'ecosystemSetActive',
    stage: 'legacy',
    anyOf: [
      ['huntersmark','quarrysigil','wardenseye','branderstag','snareglyph'],
      ['plaguebud','witherpetal','bloomrot','plaguebloom','rotcrown'],
      ['cometshard','stormcaller','skyrend','meteorcrest','celestialfall']
    ],
    effects: [{ field: 'meleeDamage', amount: 0.3 }, { field: 'rangedDamage', amount: 0.3 }]
  },
  // --- Legacy synergy B: Rot & Ruin ----------------------------------
  // Flag-only here; the 1.3x poison-tick multiplier lives in combat-3.js's
  // updateStatusEffects, which reads player.rotAndRuinActive.
  {
    id: 'rotAndRuin',
    name: 'Rot & Ruin',
    desc: 'Any Venom chance plus any Vulnerable chance: poison ticks hit 30% harder on Vulnerable targets (combat-3.js).',
    flag: 'rotAndRuinActive',
    stage: 'legacy',
    when: function(player){ return player.vulnerableChance > 0 && player.venomChance > 0; }
  },
  // --- Legacy synergy C: Marksman's Eye -------------------------------
  {
    id: 'marksmansEye',
    name: "Marksman's Eye",
    desc: '20%+ crit chance backed by any Vulnerable source: +0.4 crit multiplier.',
    flag: 'marksmansEyeActive',
    stage: 'legacy',
    when: function(player){ return player.critChance >= 0.20 && player.vulnerableChance > 0; },
    effects: [{ field: 'critMultiplier', amount: 0.4 }]
  },
  // --- Legacy synergy D: Pack Bond ------------------------------------
  {
    id: 'packBond',
    name: 'Pack Bond',
    desc: 'Three or more familiars at once: +0.3 melee and ranged damage, +5% movement speed.',
    flag: 'packBondActive',
    stage: 'legacy',
    when: function(player){ return !!(player.familiars && player.familiars.length >= 3); },
    // `speedMult` is not a player field: it is a term inside recalc's speed
    // MULTIPLIER expression (Util.clamp(1 + …, 0.25, 2.2) * baseSpeed), read
    // there via comboBonus. Legal only because this entry is stage:'legacy'
    // and so is never fed to applyItemComboSynergies' field writer.
    effects: [{ field: 'meleeDamage', amount: 0.3 }, { field: 'rangedDamage', amount: 0.3 }, { field: 'speedMult', amount: 0.05 }]
  },
  // --- Legacy synergy E: Twin Fangs -----------------------------------
  {
    id: 'twinFangs',
    name: 'Twin Fangs',
    desc: 'Own both Fang Guard and Quiverstring at once: +5% crit chance.',
    flag: 'twinFangsActive',
    stage: 'legacy',
    items: ['fangguard','quiverstring'],
    effects: [{ field: 'critChance', amount: 0.05 }]
  },
  // --- NEW combos (Mega Update A step 5) go below this line, stage 'post'.

  /* ---- items-4.js slice (mastery/exploration trophy + newrewards content) ----
     All four default to stage:'post' and declare NO `flag`: the badge spans
     live in index.html's #synergyBar, which is outside this slice's permitted
     edit set, and a flag with no span would be set but never shown (see the
     infra audit's HUD-badge open risk). Each participating item's desc names
     its combo instead. Amounts are deliberately small — they stack with the
     items' own flat contributions inside the same per-field clamp. */
  {
    id: 'turretSweep',
    name: 'Turret Sweep',
    desc: 'Own the East, West and X Turret Buster Trophies at once: +4% crit, stun and freeze chance.',
    items: ['explorationtrophy_turrete','explorationtrophy_turretw','explorationtrophy_turretx'],
    effects: [{ field: 'critChance', amount: 0.04 }, { field: 'stunChance', amount: 0.04 }, { field: 'freezeChance', amount: 0.04 }]
  },
  {
    id: 'frostboundCrown',
    name: 'Frostbound Crown',
    desc: 'Gilded Crown plus the X Turret Buster Trophy: +6% freeze chance, +3% lifesteal chance.',
    items: ['gildedcrown','explorationtrophy_turretx'],
    effects: [{ field: 'freezeChance', amount: 0.06 }, { field: 'lifestealChance', amount: 0.03 }]
  },
  {
    id: 'weightedPrecision',
    name: 'Weighted Precision',
    desc: 'Heavy Amulet plus the East Turret Buster Trophy: +4% crit chance and +0.25 crit multiplier.',
    items: ['heavyamulet','explorationtrophy_turrete'],
    effects: [{ field: 'critChance', amount: 0.04 }, { field: 'critMultiplier', amount: 0.25 }]
  },
  {
    id: 'prospectorsHoard',
    name: "Prospector's Hoard",
    desc: 'Rock Breaker Trophy plus any other Luck charm: +1 Luck and +15 pickup magnet radius.',
    // Cross-slice by id only (the second group lives in items-1.js/items-2.js);
    // no other file is edited for this entry.
    anyOf: [
      ['explorationtrophy_rock'],
      ['luckup','ascendantcharm','puritycharm','gildedcompass']
    ],
    effects: [{ field: 'luck', amount: 1 }, { field: 'magnetRadius', amount: 15 }]
  },

  /* ---- items-2.js slice (step 5) — 4 combos over its 11 combo-role items.
     All stage:'post' (the default) and all pure `items` ownership tests. NONE
     declares a `flag`: verify-step5-synergy.js diffs EVERY player field between
     the OLD (pre-step-5) and NEW builds, so any new boolean flag reads there as
     `old=undefined new=false` and fails the equivalence check — a new flag is
     therefore not addable without also changing that harness (out of this
     slice's edit set). Each participating item's desc names its combo instead.
     Amounts are deliberately
     small — every post-stage combo's contribution to a field is summed before
     the single per-field clamp applies, so these share that budget with the
     items-4 combos above and with every classSynergy item. */
  {
    id: 'rotwardensVigil',
    name: "Rotwarden's Vigil",
    desc: 'Own all three items-2 venoms (Hollow Compass, Roaring Coin, Venomous Kiss): +6% poison and +5% vulnerable chance.',
    items: ['hollowcompass','roaringcoin','venomouskiss'],
    effects: [{ field: 'venomChance', amount: 0.06 }, { field: 'vulnerableChance', amount: 0.05 }]
  },
  {
    id: 'frostboundHush',
    name: 'Frostbound Hush',
    desc: 'Braided Insignia + Whispering Idol + Smoke Bomb: +5% freeze and +5% stun chance.',
    items: ['braidedinsignia','whisperingidol','smokebomb'],
    effects: [{ field: 'freezeChance', amount: 0.05 }, { field: 'stunChance', amount: 0.05 }]
  },
  {
    id: 'maskedCourt',
    name: 'Masked Court',
    desc: 'Mesmerizing Veil + Dread Cloak: +5% charm and +5% fear chance.',
    items: ['mesmerizingveil','dreadcloak'],
    effects: [{ field: 'charmChance', amount: 0.05 }, { field: 'fearChance', amount: 0.05 }]
  },
  {
    id: 'prospectorsEye',
    name: "Prospector's Eye",
    desc: "Coin Collector's Glove + Gilded Compass + Keen Eye: +1 Luck, +4% crit chance, +4% shop discount.",
    items: ['coincollectorsglove','gildedcompass','keeneye'],
    effects: [{ field: 'luck', amount: 1 }, { field: 'critChance', amount: 0.04 }, { field: 'shopDiscountBonus', amount: 0.04 }]
  },

  /* ---- items-1.js slice (step 5) — 19 combos.
     TWELVE are ordinary ownership combos over the slice's 38 combo-role items,
     grouped by the target list's `combo group hint` column. NONE of the 19
     declares a `flag`: the HUD badge spans live in index.html's #synergyBar,
     which is outside this slice's permitted edit set, and a flag with no span
     would be set but never shown (see the infra audit's HUD-badge open risk).
     Each participating item's desc names its combo instead.

     The other SEVEN exist because of an engine limitation this slice ran into
     and could not fix from inside its permitted edit set: BOTH synergy layers
     read ownership out of `player.passives`, and ACTIVE items never land there
     (items-2.js's applyItemToPlayer routes them to player.pickupActiveItem
     instead). A `classSynergy` map on an active item is therefore dead data.
     Seven of this slice's classSynergy-role rows are actives, so their
     per-class meaning is expressed here instead, as combos whose `when`
     predicate tests `player.activeItem.id` together with `player.classId` —
     the documented escape hatch for conditions that are not about ownership.
     Those items carry NO `classSynergy` field, so there is nothing to
     double-apply if the layer is ever extended to cover actives.
     Caveat, noted in this slice's audit: pickupActiveItem does not call
     recalcPlayerStats, so an active-item-conditioned bonus lands on the next
     recalc (any pill/star/item/familiar pickup) rather than instantly. It is
     always rebuilt from scratch, so it never compounds or lingers wrongly
     beyond that one delay.

     All amounts are deliberately small: every post-stage combo's contribution
     to a field is summed across ALL slices before the single per-field clamp
     applies (ITEM_SYNERGY_FIELD_CLAMPS). ---- */

  // -- group hint hearts-1 --
  {
    id: 'bloodTithe',
    name: 'Blood Tithe',
    desc: 'Black Heart + Blood Pact, backed by a heart-buffer (Thick Mane or Cursed Locket): +6% lifesteal, +0.3 melee and ranged damage.',
    items: ['blackheart','bloodpact'],
    anyOf: [['thickmane','cursedlocket']],
    effects: [{ field: 'lifestealChance', amount: 0.06 }, { field: 'meleeDamage', amount: 0.3 }, { field: 'rangedDamage', amount: 0.3 }]
  },
  // -- group hint speed-1 --
  {
    id: 'gallopsGrace',
    name: "Gallop's Grace",
    desc: 'A common speed item (Downy Feather / Speed Up) plus a pool one (Blessed Hoof / Gilded Wing / Shadow Step): +12 speed, +4% dodge.',
    anyOf: [
      ['downyfeather','speedup'],
      ['blessedhoof','gildedwing','shadowstep']
    ],
    effects: [{ field: 'speed', amount: 12 }, { field: 'dodgeChance', amount: 0.04 }]
  },
  // -- group hint bombs-1 (two entries: the passive kit, and the active satchel) --
  {
    id: 'demolitionKit',
    name: 'Demolition Kit',
    desc: "Bomb Range Up + Moonlit Petal + Prospector's Pick: +20% bomb blast radius, +1 Luck.",
    items: ['bombrangeup','moonlitpetal','prospectorspick'],
    effects: [{ field: 'bombRadiusMult', amount: 0.2 }, { field: 'luck', amount: 1 }]
  },
  {
    id: 'satchelCharge',
    name: 'Satchel Charge',
    desc: 'Hold a Bomb Satchel while owning a Bomb Range Up: +15% bomb blast radius.',
    items: ['bombrangeup'],
    when: function(player){ return !!(player.activeItem && player.activeItem.id === 'bombsatchel'); },
    effects: [{ field: 'bombRadiusMult', amount: 0.15 }]
  },
  // -- group hint charm-fear-1 --
  {
    id: 'courtOfWhispers',
    name: 'Court of Whispers',
    desc: 'Despair Token + Envy Shard + Terrifying: +6% charm and +6% fear chance.',
    items: ['despairtoken','envyshard','terrifying'],
    effects: [{ field: 'charmChance', amount: 0.06 }, { field: 'fearChance', amount: 0.06 }]
  },
  // -- group hint stun-1 --
  {
    id: 'concussivePair',
    name: 'Concussive Pair',
    desc: 'Direct Malice + Hard Hitter: +5% stun chance, +0.3 melee damage.',
    items: ['directmalice','hardhitter'],
    effects: [{ field: 'stunChance', amount: 0.05 }, { field: 'meleeDamage', amount: 0.3 }]
  },
  // -- group hint economy-1 --
  {
    id: 'fatPurse',
    name: 'Fat Purse',
    desc: "Gluttony's Coin + Whispering Key with a Large Penny held as your active: +1 Luck, +8% shop discount.",
    items: ['gluttonyscoin','whisperingkey'],
    when: function(player){ return !!(player.activeItem && player.activeItem.id === 'largepenny'); },
    effects: [{ field: 'luck', amount: 1 }, { field: 'shopDiscountBonus', amount: 0.08 }]
  },
  // -- group hint crit-1 --
  {
    id: 'killingEdge',
    name: 'Killing Edge',
    desc: 'Any crit-chance item (Grace of the Dawn / Soul Drain / Boxer) backed by Razor Focus: +5% crit chance, +0.3 crit multiplier.',
    anyOf: [
      ['graceofthedawn','souldrain','boxer'],
      ['razorfocus']
    ],
    effects: [{ field: 'critChance', amount: 0.05 }, { field: 'critMultiplier', amount: 0.3 }]
  },
  // -- group hint boss-1 --
  {
    id: 'wardedPilgrim',
    name: 'Warded Pilgrim',
    desc: 'Holy Water + Void Whisper plus a Winged Grace or Guardian Halo: +8% boss damage, -8% boss damage taken, +4% dodge.',
    items: ['holywater','voidwhisper'],
    anyOf: [['wingedgrace','guardianhalo']],
    effects: [{ field: 'bossDamageBonus', amount: 0.08 }, { field: 'bossDamageTakenMult', amount: -0.08 }, { field: 'dodgeChance', amount: 0.04 }]
  },
  // -- group hint venom-1 --
  {
    id: 'twinVenoms',
    name: 'Twin Venoms',
    desc: 'Venom + Plague Breath: +6% poison chance, +0.3 ranged damage.',
    items: ['venom','plaguebreath'],
    effects: [{ field: 'venomChance', amount: 0.06 }, { field: 'rangedDamage', amount: 0.3 }]
  },
  // -- group hint range-1 --
  {
    id: 'guidedVolley',
    name: 'Guided Volley',
    desc: 'Piercing Shot + Range Up plus a homing lens (Halo Guidance / Hexed Tracker): +40 bolt speed, +0.3 ranged damage.',
    items: ['piercingshot','rangeup'],
    anyOf: [['haloguidance','hexedtracker']],
    effects: [{ field: 'boltSpeed', amount: 40 }, { field: 'rangedDamage', amount: 0.3 }]
  },
  // -- group hint luck-1 --
  {
    id: 'fortunesTrine',
    name: "Fortune's Trine",
    desc: 'Ascendant Charm + Purity Charm + Luck Up: +2 Luck.',
    items: ['ascendantcharm','puritycharm','luckup'],
    effects: [{ field: 'luck', amount: 2 }]
  },

  /* -- the seven ACTIVE-item "classSynergy" stand-ins (see the block comment
        above for why these are combos and not `classSynergy` maps). Each one
        is gated on holding that active AND being one of the classes the item
        genuinely means something different for. -- */
  {
    id: 'moonshardResonance',
    name: 'Moonshard Resonance',
    desc: 'A Unicorn, Alicorn or Crystal Pony holding the Moon Shard: +0.4 ranged damage.',
    when: function(player){
      return !!(player.activeItem && player.activeItem.id === 'moonshard')
        && (player.classId === 'unicorn' || player.classId === 'alicorn' || player.classId === 'crystalpony');
    },
    effects: [{ field: 'rangedDamage', amount: 0.4 }]
  },
  {
    id: 'vialOfNerve',
    name: 'Vial of Nerve',
    desc: 'A Kirin, Breezie or Pony Bot holding the Vial of Courage: +6% dodge chance.',
    when: function(player){
      return !!(player.activeItem && player.activeItem.id === 'vialcourage')
        && (player.classId === 'kirin' || player.classId === 'breezie' || player.classId === 'ponybot');
    },
    effects: [{ field: 'dodgeChance', amount: 0.06 }]
  },
  {
    id: 'huntersEye',
    name: "Hunter's Eye",
    desc: 'A Bat Pony, Griffin or Gargoyle holding the All-Seeing Eye: +5% crit chance.',
    when: function(player){
      return !!(player.activeItem && player.activeItem.id === 'allseeingeye')
        && (player.classId === 'batpony' || player.classId === 'griffin' || player.classId === 'gargoyle');
    },
    effects: [{ field: 'critChance', amount: 0.05 }]
  },
  {
    id: 'moonlitAffinity',
    name: 'Moonlit Affinity',
    desc: 'A Bat Pony, Alicorn or Windigo holding the Lunar Affinity: +1 Luck.',
    when: function(player){
      return !!(player.activeItem && player.activeItem.id === 'lunaraffinity')
        && (player.classId === 'batpony' || player.classId === 'alicorn' || player.classId === 'windigo');
    },
    effects: [{ field: 'luck', amount: 1 }]
  },
  {
    id: 'dawnriderWings',
    name: 'Dawnrider Wings',
    desc: 'A Pegasus, Hypogriff or Changedling holding the Dawnbringer: +10 speed.',
    when: function(player){
      return !!(player.activeItem && player.activeItem.id === 'dawnbringer')
        && (player.classId === 'pegasus' || player.classId === 'hypogriff' || player.classId === 'changedling');
    },
    effects: [{ field: 'speed', amount: 10 }]
  },
  {
    id: 'hollowVessel',
    name: 'Hollow Vessel',
    desc: "A Pony Bot or Kirin holding Angel's Tears — they have no red hearts to restore, so it armours them: -8% boss damage taken.",
    when: function(player){
      return !!(player.activeItem && player.activeItem.id === 'angelstears')
        && (player.classId === 'ponybot' || player.classId === 'kirin');
    },
    effects: [{ field: 'bossDamageTakenMult', amount: -0.08 }]
  },
  {
    id: 'bargainOfBlood',
    name: 'Bargain of Blood',
    desc: "A Bat Pony, Changeling or Changeling Queen holding Sombra's Bargain: +6% lifesteal chance.",
    when: function(player){
      return !!(player.activeItem && player.activeItem.id === 'sombrasbargain')
        && (player.classId === 'batpony' || player.classId === 'changeling' || player.classId === 'changelingqueen');
    },
    effects: [{ field: 'lifestealChance', amount: 0.06 }]
  }
];

const SYNERGY_COMBOS_BY_ID = (function(){
  const m = {};
  for (const c of SYNERGY_COMBOS) m[c.id] = c;
  return m;
})();

// True when the player currently satisfies every clause the combo declares.
function isSynergyComboActive(player, combo){
  const p = player.passives || {};
  if (combo.items) { for (const id of combo.items) if (!(p[id] > 0)) return false; }
  if (combo.anyOf) {
    for (const group of combo.anyOf) {
      let any = false;
      for (const id of group) { if (p[id] > 0) { any = true; break; } }
      if (!any) return false;
    }
  }
  if (combo.when && !combo.when(player, p)) return false;
  return true;
}

// Evaluates ONE combo now and stores its flag on the player. Used by
// recalcPlayerStats for `stage:'legacy'` combos, at the exact point in the
// function where each flag used to be computed by hand. Returns the boolean.
function applySynergyComboFlag(player, comboId){
  const combo = SYNERGY_COMBOS_BY_ID[comboId];
  if (!combo) return false;
  const active = isSynergyComboActive(player, combo);
  if (combo.flag) player[combo.flag] = active;
  return active;
}

// The bonus a (currently active) combo grants to one field, or 0. Used by
// recalcPlayerStats to inline a legacy combo's number inside the same clamp
// expression it has always lived in. Reads the flag if the combo has one so
// that the condition is evaluated exactly once per recalc.
function comboBonus(player, comboId, field){
  const combo = SYNERGY_COMBOS_BY_ID[comboId];
  if (!combo || !combo.effects) return 0;
  const active = combo.flag ? !!player[combo.flag] : isSynergyComboActive(player, combo);
  if (!active) return 0;
  let sum = 0;
  for (const e of combo.effects) if (e.field === field) sum += e.amount;
  return sum;
}

/* Applies every NON-legacy combo: sets its flag and folds its effects into
   the player's stats with the same shadow-base/clamp discipline as
   applyItemClassSynergyBonuses. Called at the end of recalcPlayerStats. */
function applyItemComboSynergies(player){
  if (!player || !player.passives) return;
  const groups = {};        // field -> summed bonus
  const bounds = {};        // field -> {min, max} (tightest declared)
  for (const combo of SYNERGY_COMBOS) {
    if (combo.stage === 'legacy') continue; // applied in place by recalcPlayerStats — see header
    const active = isSynergyComboActive(player, combo);
    if (combo.flag) player[combo.flag] = active;
    if (!active || !combo.effects) continue;
    for (const e of combo.effects) {
      if (!e.field || typeof e.amount !== 'number') continue;
      if (ITEM_SYNERGY_FIELDS.indexOf(e.field) === -1) continue;
      groups[e.field] = (groups[e.field] || 0) + e.amount;
      const c = itemSynergyClamp(e.field);
      const b = bounds[e.field] || (bounds[e.field] = { min: -c, max: c });
      if (typeof e.min === 'number' && e.min > b.min) b.min = e.min;
      if (typeof e.max === 'number' && e.max < b.max) b.max = e.max;
    }
  }
  if (!player._itemComboBase) { player._itemComboBase = {}; player._itemComboLast = {}; }
  applySynergyFieldBonuses(player, groups, player._itemComboBase, player._itemComboLast, bounds);
}

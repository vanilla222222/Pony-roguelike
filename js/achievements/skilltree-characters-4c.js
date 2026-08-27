'use strict';
// achievements/skilltree-characters-4c.js — Phase 10 Part B, skill tree
// megaupdate, Group 3 of 5: 250 new character skill nodes (50 each for
// dragon, windigo, kelpie, breezie, dnbpony). Pure data, appended onto the
// SKILL_TREE_NODES array / SKILL_TREE_NODES_BY_ID map defined in
// skilltree.js — no engine logic lives here.
//
// Branch-letter space reserved for this whole Phase 10 skill-tree pass:
// i, j, k, l (a-h are already used by skilltree-characters.js /
// -characters-2.js / -characters-3.js). Node id convention:
// 'char_' + classId + '_' + key, unchanged from every prior file.
//
// Topology: each character gets FOUR new branches hanging directly off its
// existing char_hub_<classId> node (siblings of the old a1/b1/c1/d1
// openers), sized 13/13/12/12 = 50. Within a branch the chain forks once
// near the top so a player picks a side before the branch converges on its
// deepest nodes; every `parent` is either the hub (p:null below) or another
// key in the SAME branch, so no node in this file ever depends on, or
// re-parents, a node defined anywhere else.
//
// DESIGN MANDATE (Phase 10 Part B brief). Most nodes here amplify, bend, or
// bolt a wrinkle onto the character's OWN unique mechanic rather than being
// flat stat sticks:
//
//   dragon   — hold-to-charge fire breath (def.charged/chargeTime, short
//              def.baseRangeTiles). Branch i tunes the charge itself via
//              uniqueField chargeTime; branch j trades hide toughness on
//              the damageTakenMult shadow field; branch k stretches the
//              deliberately-short jet; branch l is the PRISMATIC MAW
//              conversion — uniqueFlag crystalVolley, turning the piercing
//              beam into a cursor-converging shard fan (see combat-2.js's
//              playerChargedBeamAttack, which dispatches on that flag).
//   windigo  — innate 12% freeze on slow, heavy frost bolts. Branch i
//              leans on freeze/vulnerable/stun; branch j fights the 0.8s
//              fire cooldown; branch k is the bodiless spirit (dodge/
//              damageTakenMult); branch l is THE BLIZZARD'S WAKE —
//              uniqueFlag innateFireRing, which REPLACES her bolts
//              entirely with a permanent self-centred whiteout (combat-1.js
//              gates the normal attack dispatch on that same flag).
//   kelpie   — melee with more than double anyone else's reach, slow and
//              heavy. Branch i is reach vs. swing speed; branch j is the
//              luring song (charm/fear); branch k is brackish hide
//              (damageTakenMult/venom); branch l is THE DROWNED THRALLS —
//              uniqueFlag summonsChangelings plus the minion damage/radius/
//              cap/cooldown shadow fields, i.e. a train of drowned riders.
//   breezie  — pixie-sized, 2 red hearts, fastest hooves alive, dust motes
//              with unlimitedRange. Branch i is the endless flurry; branch
//              j is survival on a 2-heart frame (dodge + damageTakenMult);
//              branch k is the pollen trail (charm/magnet/luck); branch l
//              is BORROWED EMBER — she swallows a dragon's coal, gaining
//              uniqueFlag charged while LOSING unlimitedRange.
//   dnbpony  — the game's DNB capstone unlock: fastest fire rate, bass
//              pulses, starts with a blue heart. Branch i is the bassline
//              (its huge rangedDamage headroom + stun); branch j is tempo;
//              branch k is the subwoofer (charm/fear/damageTakenMult);
//              branch l is SPEAKER STACKS — uniqueFlag canBuildTurrets plus
//              the turretDamageMult/maxTurrets shadow fields.
//
// TRADEOFF DISCIPLINE (Soy-Milk rule): every powerful addition is paid for.
// Two shapes are used, both already established by -characters-3.js:
//   * `cursed:true` gate nodes — ONLY negative effects, and the sole parent
//     of everything below them, so the payoff is structurally unreachable
//     without eating the debuff (canBuySkillNode requires the single
//     `parent` to be owned).
//   * two-effect trade nodes — a real upside paired with a real negative in
//     the same `effects:[...]` array.
// Each branch's l4-tier transformation node is the biggest of these: it
// hands over a whole borrowed mechanic AND takes something away in the same
// breath (the dragon loses its piercing jet, the windigo loses the ability
// to fire at all, the breezie loses infinite bolt range, the kelpie and the
// dnbpony pay in movement speed).
//
// CAP DISCIPLINE. skilltree.js clamps the summed skill-tree bonus per
// (classId, stat) to +/-SKILL_TREE_STAT_CAP (0.25), with
// SKILL_TREE_STAT_CAP_OVERRIDES.lifestealChance = 0.10. Those sums include
// the a-h nodes from the three earlier files, so every amount below was
// authored against the EXISTING per-character totals, not from zero. Two
// consequences worth spelling out:
//   * dragon / breezie / dnbpony already sit at 0.15-0.16 lifestealChance
//     from the a-h files, i.e. already past the 0.10 override — this file
//     adds ZERO lifestealChance for those three. Only kelpie (at 0) takes
//     any, and only +0.04.
//   * chance-type bonuses are concentrated in a handful of nodes per
//     character rather than sprinkled over all 50, per the brief.
// See feature-research/phase10-metaprogression/audit-skilltree-group3.md for
// the full per-(classId, stat) table including the a-h baselines.
//
// uniqueField min/max are kept IDENTICAL across every node targeting the
// same (classId, field) pair, per the Phase 8b-uniquefx audit's guidance
// (applySkillTreeUniqueFieldBonuses otherwise takes the tightest bounds
// seen, which makes the effective ceiling depend on purchase order).

// Per-(classId, field) uniqueField bounds for this file. Referenced by the
// UF() helper below so a pair's bounds can never drift between nodes.
const SKILL_TREE_UF_BOUNDS_4C = {
  // NOTE: skilltree-characters-2.js already declares dragon|chargeTime as
  // [-0.2, 0] and already sums to -0.19 against it, i.e. that pair is
  // effectively SATURATED on the buff side. These bounds are reproduced
  // verbatim (never widened) so applySkillTreeUniqueFieldBonuses' tightest-
  // bounds merge can't make the ceiling depend on purchase order, and this
  // file therefore only ever pushes dragon|chargeTime in the PENALTY
  // direction — its four penalty amounts sum to exactly +0.19, so a fully
  // cursed dragon lands back on the stock 0.5s charge and not one of those
  // four nodes is a no-op. Charge-speed BUFFS are left to -characters-2.js.
  'dragon|chargeTime':                 { min:-0.2,  max:0 },
  'dragon|damageTakenMult':            { min:-0.30, max:0.60 },
  'dragon|crystalShardCount':          { min:0,     max:6 },
  'windigo|damageTakenMult':           { min:-0.30, max:0.60 },
  'windigo|fireRingRadius':            { min:0,     max:60 },
  'kelpie|damageTakenMult':            { min:-0.30, max:0.60 },
  'kelpie|changelingMinionDmg':        { min:0,     max:6 },
  'kelpie|changelingMinionRadius':     { min:0,     max:70 },
  'kelpie|maxChangelingMinions':       { min:0,     max:2 },
  'kelpie|changelingSummonCooldown':   { min:-5,    max:4 },
  'breezie|damageTakenMult':           { min:-0.40, max:0.60 },
  'breezie|chargeTime':                { min:0,     max:0.60 },
  'dnbpony|damageTakenMult':           { min:-0.30, max:0.60 },
  'dnbpony|turretDamageMult':          { min:0,     max:0.60 },
  'dnbpony|maxTurrets':                { min:0,     max:2 },
};

// Effect-literal shorthands. ST = a plain 'stat' effect; UF = a
// 'uniqueField' effect with its bounds looked up from the table above; FL =
// a 'uniqueFlag' effect. These exist purely so 250 nodes of data stay
// readable — the objects they produce are the exact shapes skilltree.js's
// nodeEffects consumers already handle, with no engine change of any kind.
function ST(classId, stat, amount){ return { type:'stat', classId, stat, amount }; }
function UF(classId, field, amount){
  const b = SKILL_TREE_UF_BOUNDS_4C[classId + '|' + field];
  return { type:'uniqueField', classId, field, amount, min:b.min, max:b.max };
}
function FL(classId, field, value){ return { type:'uniqueFlag', classId, field, value }; }

// Node entries: { k:<branch key>, p:<parent branch key or null for the hub>,
// name, desc, cursed?, e:<one effect> | es:[<effects>] }. The builder at the
// bottom turns each into the canonical node shape.
const SKILL_TREE_CHARACTER_CONFIG_4C = {

  // =======================================================================
  // DRAGON — the charged fire-breath whelp.
  // =======================================================================
  dragon: [
    // --- branch i: Furnace Breath (the charge itself) -------------------
    { k:'i1', p:null, name:'Kindling Gland', desc:'A second gland behind the jaw keeps a coal permanently lit, and everything downstream of it runs hotter. Increases ranged damage by 4%.', e:ST('dragon','rangedDamage',0.04) },
    { k:'i2', p:'i1', name:'Bellows Lung', desc:'Lungs that fill in one enormous pull instead of three. Reduces fire cooldown by 4%.', e:ST('dragon','fireCooldown',-0.04) },
    { k:'i3', p:'i2', name:'Pilot Flame', desc:'A guttering pilot light means nothing has to be struck from cold. Reduces fire cooldown by 4%.', e:ST('dragon','fireCooldown',-0.04) },
    { k:'i4', p:'i3', name:'Overpressured Gullet', desc:'You hold more than the plumbing was built for. Reduces fire cooldown by 4%, but everything that hits you hits 10% harder while the pressure is up.', es:[ST('dragon','fireCooldown',-0.04), UF('dragon','damageTakenMult',0.10)] },
    { k:'i5', p:'i4', name:'Sootlung', desc:'Years of your own smoke, settled where air should be. Permanently reduces ranged damage by 4%. Nothing deeper in this furnace opens without it.', cursed:true, e:ST('dragon','rangedDamage',-0.04) },
    { k:'i6', p:'i5', name:'Held Inferno', desc:'The longer it sits behind your teeth, the worse it is for whatever it lands on. Increases ranged damage by 6%.', e:ST('dragon','rangedDamage',0.06) },
    { k:'i7', p:'i5', name:'Hair-Trigger Spark', desc:'You stop waiting for a full breath and just let it go. Increases ranged damage by 4%, but the recovery afterward is 4% longer.', es:[ST('dragon','rangedDamage',0.04), ST('dragon','fireCooldown',0.04)] },
    { k:'i8', p:'i6', name:'Magma Throat', desc:'The jet leaves you hotter than the rock it melts. Increases ranged damage by 4%.', e:ST('dragon','rangedDamage',0.04) },
    { k:'i9', p:'i7', name:'Snapfire Reflex', desc:'Breath, blast, breath again, with nothing wasted between. Reduces fire cooldown by 4%.', e:ST('dragon','fireCooldown',-0.04) },
    { k:'i10', p:'i8', name:'Slow Burn', desc:'You learn to sit on it until it genuinely hurts to hold. Increases ranged damage by 5%, but the charge takes 0.06s longer to fill.', es:[ST('dragon','rangedDamage',0.05), UF('dragon','chargeTime',0.06)] },
    { k:'i11', p:'i9', name:'Cinder Economy', desc:'Not one ember spent on anything that was already dead. Reduces fire cooldown by 3%.', e:ST('dragon','fireCooldown',-0.03) },
    { k:'i12', p:'i10', name:"Whelp's Impatience", desc:'You are young, and you keep releasing before the breath is truly ready. The charge permanently takes 0.05s longer. The last blast on this branch demands it.', cursed:true, e:UF('dragon','chargeTime',0.05) },
    { k:'i13', p:'i12', name:'Detonating Exhale', desc:'The jet arrives with a concussion in front of it. Increases ranged damage by 4% and stun chance by 5%.', es:[ST('dragon','rangedDamage',0.04), ST('dragon','stunChance',0.05)] },

    // --- branch j: Scaled Hide (damageTakenMult + terror) ---------------
    { k:'j1', p:null, name:'Thickening Scales', desc:'Another year of growth, another layer of plate. Reduces all damage you take by 6%.', e:UF('dragon','damageTakenMult',-0.06) },
    { k:'j2', p:'j1', name:'Molten Underplate', desc:'Beneath the scales, something that has never cooled. Reduces all damage you take by 5%.', e:UF('dragon','damageTakenMult',-0.05) },
    { k:'j3', p:'j2', name:'Ashen Callus', desc:'Hardened pads that skate over scorched ground. Increases movement speed by 5%.', e:ST('dragon','speed',0.05) },
    { k:'j4', p:'j3', name:'Brittle Scale Rot', desc:'Heat that never leaves eventually cracks what holds it in. You permanently take 14% more damage. Everything below this point is bought with that.', cursed:true, e:UF('dragon','damageTakenMult',0.14) },
    { k:'j5', p:'j4', name:'Furnace Heart', desc:'The rot burns out from the inside and leaves something denser. Reduces all damage you take by 10% and fire cooldown by 3%.', es:[UF('dragon','damageTakenMult',-0.10), ST('dragon','fireCooldown',-0.03)] },
    { k:'j6', p:'j4', name:'Terror of the Wyrm', desc:'Even rotting, you are still the largest thing in the room. Increases fear chance by 6%.', e:ST('dragon','fearChance',0.06) },
    { k:'j7', p:'j5', name:'Cauterized Wounds', desc:'Your own heat closes what claws open. Increases on-kill heal chance by 5%.', e:ST('dragon','onKillHealChance',0.05) },
    { k:'j8', p:'j6', name:'Roar of the Deep Hoard', desc:'A sound that belongs to a much older, much richer dragon. Increases fear chance by 5%.', e:ST('dragon','fearChance',0.05) },
    { k:'j9', p:'j7', name:'Hoard-Fat and Slow', desc:'You are carrying too much gold to be caught, and too much to run. Reduces all damage you take by 8%, but movement speed by 6%.', es:[UF('dragon','damageTakenMult',-0.08), ST('dragon','speed',-0.06)] },
    { k:'j10', p:'j8', name:'Smoke-Choked Lungs', desc:'Every roar costs a little of the fire that made it. Permanently reduces ranged damage by 3%. The deepest hide on this branch demands it.', cursed:true, e:ST('dragon','rangedDamage',-0.03) },
    { k:'j11', p:'j9', name:'Adamant Belly Plates', desc:'The one soft spot in the old stories, closed for good. Reduces all damage you take by 5%.', e:UF('dragon','damageTakenMult',-0.05) },
    { k:'j12', p:'j10', name:'Wyrmfright', desc:'Nothing that has smelled you wants to stay. Increases fear chance by 4%.', e:ST('dragon','fearChance',0.04) },
    { k:'j13', p:'j11', name:'Living Forge', desc:'You become the anvil as well as the flame. Reduces all damage you take by 6%, but all that extra mass costs 5% movement speed.', es:[UF('dragon','damageTakenMult',-0.06), ST('dragon','speed',-0.05)] },

    // --- branch k: The Short Jet (rangeTiles) ---------------------------
    { k:'k1', p:null, name:'Lengthened Jet', desc:'The dragonfire stops falling apart quite so soon. Increases range by 4%.', e:ST('dragon','rangeTiles',0.04) },
    { k:'k2', p:'k1', name:'Focused Cone', desc:'Less spray, more spear. Increases range by 4%.', e:ST('dragon','rangeTiles',0.04) },
    { k:'k3', p:'k2', name:'Narrowed Throat', desc:'Squeezing the aperture throws the fire further and starves the burn between blasts. Increases range by 5%, but increases fire cooldown by 4%.', es:[ST('dragon','rangeTiles',0.05), ST('dragon','fireCooldown',0.04)] },
    { k:'k4', p:'k3', name:'Cinder Carry', desc:'The tail end of the jet still has teeth. Increases range by 2%.', e:ST('dragon','rangeTiles',0.02) },
    { k:'k5', p:'k4', name:'Guttering Flame', desc:'Reaching that far leaves the jet thin at the far end. Permanently reduces range by 4%. Required to press further down the burning column.', cursed:true, e:ST('dragon','rangeTiles',-0.04) },
    { k:'k6', p:'k5', name:'Reignition', desc:'What guttered relights at exactly the wrong moment for whatever is standing there. Increases critical hit chance by 5%.', e:ST('dragon','critChance',0.05) },
    { k:'k7', p:'k5', name:'Blast Furnace Pressure', desc:'You stop rationing the pressure entirely. Reduces fire cooldown by 4%.', e:ST('dragon','fireCooldown',-0.04) },
    { k:'k8', p:'k6', name:'Ember Eye', desc:'You can see the weak seam through your own flame. Increases critical hit chance by 4%.', e:ST('dragon','critChance',0.04) },
    { k:'k9', p:'k7', name:'Pressure Vent', desc:'Bleeding the excess between blasts instead of holding it. Reduces fire cooldown by 3%.', e:ST('dragon','fireCooldown',-0.03) },
    { k:'k10', p:'k8', name:'Point-Blank Doctrine', desc:'You stop pretending this is a ranged attack at all. Increases critical hit chance by 4%, but reduces range by 5%.', es:[ST('dragon','critChance',0.04), ST('dragon','rangeTiles',-0.05)] },
    { k:'k11', p:'k9', name:'Sustained Column', desc:'One long pour instead of a burst. Increases range by 3%.', e:ST('dragon','rangeTiles',0.03) },
    { k:'k12', p:'k11', name:'Wyrmfire Lance', desc:'A jet with a point on it, thrown like a spear. Increases range by 3%, but focusing it that hard leaves your flank open — you take 6% more damage.', es:[ST('dragon','rangeTiles',0.03), UF('dragon','damageTakenMult',0.06)] },

    // --- branch l: Prismatic Maw -------------
    // Phase 11 un-bleed pass — l4 used to borrow Crystal Pony's
    // `crystalVolley` flag outright. Now her own `gemBreath`, driving the
    // same generic convergent-volley system under her own name.
    { k:'l1', p:null, name:'Gemflecked Gullet', desc:'Swallowed hoard-gems have started growing where soft tissue should be. Permanently reduces ranged damage by 3%. Everything on this branch grows out of that.', cursed:true, e:ST('dragon','rangedDamage',-0.03) },
    { k:'l2', p:'l1', name:'Crystalline Slag', desc:'Your breath now carries a grit that rings when it lands. Increases stun chance by 5%.', e:ST('dragon','stunChance',0.05) },
    { k:'l3', p:'l2', name:'Shardsong', desc:'A high, glassy note travels ahead of the blast. Increases stun chance by 4%.', e:ST('dragon','stunChance',0.04) },
    { k:'l4', p:'l3', name:'The Prismatic Maw', desc:'The gems win. Your charged breath is no longer fire at all — it becomes a fan of three crystal shards that converge on wherever you are aiming and cross the whole room. You lose the piercing jet entirely, and the heavier mouthful takes 0.05s more to charge.', es:[FL('dragon','gemBreath',true), UF('dragon','crystalShardCount',3), UF('dragon','chargeTime',0.05)] },
    { k:'l5', p:'l4', name:'Fourth Facet', desc:'One more shard grows in along the jaw. Your volley fires an additional shard.', e:UF('dragon','crystalShardCount',1) },
    { k:'l6', p:'l4', name:'Keener Shards', desc:'Each gem is loosed harder than the last set. Increases bolt speed by 5%.', e:ST('dragon','boltSpeed',0.05) },
    { k:'l7', p:'l5', name:'Fifth Facet', desc:'A fifth shard, at the cost of the mass behind each one. Fires an additional shard, but reduces ranged damage by 4%.', es:[UF('dragon','crystalShardCount',1), ST('dragon','rangedDamage',-0.04)] },
    { k:'l8', p:'l6', name:'Faceted Points', desc:'Every shard ends in an edge that finds the seam. Increases critical hit chance by 5%.', e:ST('dragon','critChance',0.05) },
    { k:'l9', p:'l7', name:'Splinter Storm', desc:'Growing a mouth full of glass is not quick. The charge permanently takes 0.03s longer. The last facets demand it.', cursed:true, e:UF('dragon','chargeTime',0.03) },
    { k:'l10', p:'l9', name:'Sixth Facet', desc:'The maw is now more gem than dragon. Fires an additional shard.', e:UF('dragon','crystalShardCount',1) },
    { k:'l11', p:'l8', name:'Refractive Edge', desc:'Each shard splits the light and whatever is behind it. Increases stun chance by 4%.', e:ST('dragon','stunChance',0.04) },
    { k:'l12', p:'l10', name:'Kaleidoscope Jaw', desc:'A hinge that opens wider than any jaw should, and throws what it holds correspondingly harder. Increases bolt speed by 5%, but the unarmoured hinge makes you take 8% more damage.', es:[ST('dragon','boltSpeed',0.05), UF('dragon','damageTakenMult',0.08)] },
  ],

  // =======================================================================
  // WINDIGO — innate freeze, slow heavy frost bolts.
  // =======================================================================
  windigo: [
    // --- branch i: Killing Frost (freeze / vulnerable / stun) -----------
    { k:'i1', p:null, name:'Deepening Chill', desc:'The cold gets under the shell before the bolt does. Increases vulnerable chance by 5%.', e:ST('windigo','vulnerableChance',0.05) },
    { k:'i2', p:'i1', name:'Rime on the Wound', desc:'Ice forms in the cut and keeps it open. Increases vulnerable chance by 4%.', e:ST('windigo','vulnerableChance',0.04) },
    { k:'i3', p:'i2', name:'Hoarfrost Bolt', desc:'A denser, faster-flying core of packed frost. Increases bolt speed by 4%.', e:ST('windigo','boltSpeed',0.04) },
    { k:'i4', p:'i3', name:'Thawed Core', desc:'Spending this much cold outward leaves the centre of you merely cool. Permanently reduces freeze chance by 3%. Nothing deeper in the killing frost opens without it.', cursed:true, e:ST('windigo','freezeChance',-0.03) },
    { k:'i5', p:'i4', name:'Absolute Zero', desc:'A stillness nothing warm survives touching. Increases freeze chance by 5%.', e:ST('windigo','freezeChance',0.05) },
    { k:'i6', p:'i4', name:'Brittle Flesh', desc:'Frozen tissue does not bend, it breaks. Increases vulnerable chance by 4%.', e:ST('windigo','vulnerableChance',0.04) },
    { k:'i7', p:'i5', name:'Frozen Solid', desc:'Sometimes the cold simply stops them where they stand. Increases stun chance by 5%.', e:ST('windigo','stunChance',0.05) },
    { k:'i8', p:'i6', name:'Glass-Bone Curse', desc:'Bone chilled through rings like a struck icicle. Increases vulnerable chance by 4%.', e:ST('windigo','vulnerableChance',0.04) },
    { k:'i9', p:'i7', name:'Locked Joints', desc:'Nothing hinges properly at this temperature. Increases stun chance by 4%.', e:ST('windigo','stunChance',0.04) },
    { k:'i10', p:'i8', name:'Frost-Numbed Hooves', desc:'Numb prey is soft prey — and the numbness reaches you too. Increases vulnerable chance by 4%, but reduces movement speed by 5%.', es:[ST('windigo','vulnerableChance',0.04), ST('windigo','speed',-0.05)] },
    { k:'i11', p:'i9', name:'Shatterpoint', desc:'You aim for the seam instead of the mass. Increases stun chance by 4%, but reduces ranged damage by 3%.', es:[ST('windigo','stunChance',0.04), ST('windigo','rangedDamage',-0.03)] },
    { k:'i12', p:'i10', name:'Killing Winter', desc:'The season that does not intend anything to still be here in spring. Increases freeze chance by 3%.', e:ST('windigo','freezeChance',0.03) },
    { k:'i13', p:'i12', name:'Everfrost', desc:'What you touch does not thaw afterward. Increases vulnerable chance by 2%.', e:ST('windigo','vulnerableChance',0.02) },

    // --- branch j: The Long Winter (fire rate vs. bolt weight) ----------
    { k:'j1', p:null, name:'Quickening Gale', desc:'The wind at your back finally starts pushing the shots out. Reduces fire cooldown by 3%.', e:ST('windigo','fireCooldown',-0.03) },
    { k:'j2', p:'j1', name:'Blizzard Cadence', desc:'Many small flakes instead of one thrown stone. Reduces fire cooldown by 4%, but ranged damage by 4%.', es:[ST('windigo','fireCooldown',-0.04), ST('windigo','rangedDamage',-0.04)] },
    { k:'j3', p:'j2', name:'Weight of Winter', desc:'Each bolt arrives with a whole season behind it. Increases ranged damage by 4%.', e:ST('windigo','rangedDamage',0.04) },
    { k:'j4', p:'j3', name:'Frostbitten Grip', desc:'You cannot feel your own hooves anymore, and it shows in the gallop. Permanently reduces movement speed by 4%. The long winter is paid for here.', cursed:true, e:ST('windigo','speed',-0.04) },
    { k:'j5', p:'j4', name:'Glacial Mass', desc:'Slow, enormous, and entirely unarguable. Increases ranged damage by 5%.', e:ST('windigo','rangedDamage',0.05) },
    { k:'j6', p:'j4', name:"Windigo's Hunger", desc:'Every death feeds the thing wearing your shape. Increases on-kill heal chance by 5%.', e:ST('windigo','onKillHealChance',0.05) },
    { k:'j7', p:'j5', name:'Avalanche Bolt', desc:'It does not travel fast. It travels inevitably. Increases ranged damage by 5%, but reduces bolt speed by 6%.', es:[ST('windigo','rangedDamage',0.05), ST('windigo','boltSpeed',-0.06)] },
    { k:'j8', p:'j6', name:'Feeding on Fear', desc:'The old stories were right about what you actually eat. Increases on-kill heal chance by 4%.', e:ST('windigo','onKillHealChance',0.04) },
    { k:'j9', p:'j7', name:'Leaden Snow', desc:'Snow this heavy takes its own time falling. Permanently increases fire cooldown by 5%. The deepest weight on this branch demands it.', cursed:true, e:ST('windigo','fireCooldown',0.05) },
    { k:'j10', p:'j8', name:'Famine Spirit', desc:'What you are is a hunger with weather around it. Increases on-kill heal chance by 4%.', e:ST('windigo','onKillHealChance',0.04) },
    { k:'j11', p:'j9', name:'Whiteout Volley', desc:'They stop being able to tell how many are coming. Increases ranged damage by 3%.', e:ST('windigo','rangedDamage',0.03) },
    { k:'j12', p:'j10', name:'Hungering Cold', desc:'The cold takes some of what would have hit you. Reduces all damage you take by 6%.', e:UF('windigo','damageTakenMult',-0.06) },
    { k:'j13', p:'j11', name:'The Long Dark', desc:'A winter that stops counting months. Increases ranged damage by 3%, but reduces movement speed by 4%.', es:[ST('windigo','rangedDamage',0.03), ST('windigo','speed',-0.04)] },

    // --- branch k: Heart of Ice (bodiless spirit) -----------------------
    { k:'k1', p:null, name:'Bodiless Chill', desc:'There is less of you there to hit than there looks. Reduces all damage you take by 5%.', e:UF('windigo','damageTakenMult',-0.05) },
    { k:'k2', p:'k1', name:'Wind-Woven Form', desc:'Half of you is just moving air. Increases dodge chance by 6%.', e:ST('windigo','dodgeChance',0.06) },
    { k:'k3', p:'k2', name:'Snowblind', desc:'They are aiming at glare. You are not. Increases critical hit chance by 5%.', e:ST('windigo','critChance',0.05) },
    { k:'k4', p:'k3', name:'Anchored to the Storm', desc:'To hold the blizzard you have to hold still inside it. You permanently take 12% more damage. The heart below is bought with that.', cursed:true, e:UF('windigo','damageTakenMult',0.12) },
    { k:'k5', p:'k4', name:'Heart of Ice', desc:'Nothing in there to bruise. Reduces all damage you take by 12%.', e:UF('windigo','damageTakenMult',-0.12) },
    { k:'k6', p:'k4', name:'Frozen Aim', desc:'A perfectly steady thing does not miss. Increases critical hit chance by 4%.', e:ST('windigo','critChance',0.04) },
    { k:'k7', p:'k5', name:'Insubstantial', desc:'Their hooves pass through where you were. Increases dodge chance by 5%.', e:ST('windigo','dodgeChance',0.05) },
    { k:'k8', p:'k6', name:'Icicle Point', desc:'Every bolt comes to a single needling tip. Increases critical hit chance by 4%.', e:ST('windigo','critChance',0.04) },
    { k:'k9', p:'k7', name:'Gale Body', desc:'You let yourself come further apart to be harder to catch. Increases dodge chance by 4%, but reduces ranged damage by 3%.', es:[ST('windigo','dodgeChance',0.04), ST('windigo','rangedDamage',-0.03)] },
    { k:'k10', p:'k8', name:'Cold Precision', desc:'The unhurried aim of something that is never cold. Increases critical hit chance by 3%.', e:ST('windigo','critChance',0.03) },
    { k:'k11', p:'k9', name:'Windborne', desc:'You stop walking and simply drift where the storm goes. Increases movement speed by 5%.', e:ST('windigo','speed',0.05) },
    { k:'k12', p:'k11', name:'Spirit of the Blizzard', desc:'Barely present enough to hurt. Reduces all damage you take by 6%, but there is nothing solid left to strike with — melee damage drops 5%.', es:[UF('windigo','damageTakenMult',-0.06), ST('windigo','meleeDamage',-0.05)] },

    // --- branch l: The Blizzard's Wake ------
    // Phase 11 un-bleed pass — l4 used to borrow Changedling's
    // `innateFireRing` flag outright. Now her own `innateBlizzardRing`,
    // driving the same generic ring-attack system under her own name.
    { k:'l1', p:null, name:'Frost Corona', desc:'A permanent shimmer of ice hangs a hoof-length off your coat, and it drags on everything you throw. Permanently reduces bolt speed by 4%. The whiteout below starts here.', cursed:true, e:ST('windigo','boltSpeed',-0.04) },
    { k:'l2', p:'l1', name:'Stormcloak', desc:'Loose snow follows you and brings things with it. Increases pickup magnet radius by 4%.', e:ST('windigo','magnetRadius',0.04) },
    { k:'l3', p:'l2', name:'Gathering Squall', desc:'The weather starts arranging itself around you without being asked. Increases luck by 4%.', e:ST('windigo','luck',0.04) },
    { k:'l4', p:'l3', name:"The Blizzard's Wake", desc:'You stop being something that shoots and become something that simply IS the storm. A permanent whiteout howls around you, tearing at everything inside it for as long as it stands there — but you can no longer fire a single frost bolt, ever, and holding a blizzard open costs you: you take 10% more damage.', es:[FL('windigo','innateBlizzardRing',true), UF('windigo','fireRingRadius',10), UF('windigo','damageTakenMult',0.10)] },
    { k:'l5', p:'l4', name:'Widening Whiteout', desc:'The edge of the storm keeps finding new ground. Widens your blizzard by 12px.', e:UF('windigo','fireRingRadius',12) },
    { k:'l6', p:'l4', name:'Denser Squall', desc:'Not bigger — meaner. The whiteout draws its bite from the same well your bolts did, so it hurts more. Increases ranged damage by 4%.', e:ST('windigo','rangedDamage',0.04) },
    { k:'l7', p:'l5', name:'Eye of the Storm', desc:'Standing at the centre means the centre goes where you go, slowly. Widens your blizzard by 14px, but reduces movement speed by 5%.', es:[UF('windigo','fireRingRadius',14), ST('windigo','speed',-0.05)] },
    { k:'l8', p:'l6', name:'Faster Pulse', desc:'The storm beats quicker, and everything caught in it feels each beat. Reduces fire cooldown by 3%.', e:ST('windigo','fireCooldown',-0.03) },
    { k:'l9', p:'l7', name:'Endless Winter', desc:'It has been going on so long nobody remembers it starting. Widens your blizzard by 10px.', e:UF('windigo','fireRingRadius',10) },
    { k:'l10', p:'l8', name:'Cold That Follows', desc:'The storm shields as well as it savages. Reduces all damage you take by 5%.', e:UF('windigo','damageTakenMult',-0.05) },
    { k:'l11', p:'l9', name:'Howling Perimeter', desc:'To push the wall out that far you have to stop holding any of it around yourself. You permanently take 10% more damage. The final reach demands it.', cursed:true, e:UF('windigo','damageTakenMult',0.10) },
    { k:'l12', p:'l11', name:'Wake of the Windigo', desc:'Whole valleys learn to be somewhere else. Widens your blizzard by 14px and increases pickup magnet radius by 3%.', es:[UF('windigo','fireRingRadius',14), ST('windigo','magnetRadius',0.03)] },
  ],

  // =======================================================================
  // KELPIE — long-reach melee water-horse, slow and heavy.
  // =======================================================================
  kelpie: [
    // --- branch i: The Long Reach --------------------------------------
    { k:'i1', p:null, name:'Sodden Mane', desc:'Waterlogged hair that keeps going after the neck stops. Increases range by 4%.', e:ST('kelpie','rangeTiles',0.04) },
    { k:'i2', p:'i1', name:'Weed-Wrapped Fetlocks', desc:'Trailing river weed counts as part of you now. Increases range by 4%.', e:ST('kelpie','rangeTiles',0.04) },
    { k:'i3', p:'i2', name:'Undertow Lunge', desc:'The whole body commits to the grab. Increases melee damage by 4%.', e:ST('kelpie','meleeDamage',0.04) },
    { k:'i4', p:'i3', name:'Overextended', desc:'Reaching that far means taking your time getting back. Permanently increases melee cooldown by 5%. The long reach is bought here.', cursed:true, e:ST('kelpie','meleeCooldown',0.05) },
    { k:'i5', p:'i4', name:'Riverlength Grasp', desc:'You are as long as the crossing is wide. Increases range by 5%.', e:ST('kelpie','rangeTiles',0.05) },
    { k:'i6', p:'i4', name:'Dredging Blow', desc:'A strike that comes up from the silt. Increases melee damage by 4%.', e:ST('kelpie','meleeDamage',0.04) },
    { k:'i7', p:'i5', name:'Drag-Down', desc:'Whatever you touch is already halfway under. Increases range by 3%.', e:ST('kelpie','rangeTiles',0.03) },
    { k:'i8', p:'i6', name:'Waterlogged Strength', desc:'Weight is a weapon if you are patient with it. Increases melee damage by 3%.', e:ST('kelpie','meleeDamage',0.03) },
    { k:'i9', p:'i7', name:'Shortened Tether', desc:'You stop reaching and start snapping. Reduces melee cooldown by 5%, but range by 4%.', es:[ST('kelpie','meleeCooldown',-0.05), ST('kelpie','rangeTiles',-0.04)] },
    { k:'i10', p:'i8', name:'Silt-Heavy Hooves', desc:'You bring the riverbed with you. Increases melee damage by 4%, but reduces movement speed by 5%.', es:[ST('kelpie','meleeDamage',0.04), ST('kelpie','speed',-0.05)] },
    { k:'i11', p:'i9', name:'Reeling In', desc:'Nothing wasted between the grab and the next one. Reduces melee cooldown by 4%.', e:ST('kelpie','meleeCooldown',-0.04) },
    { k:'i12', p:'i10', name:'Bloated Bulk', desc:'Whatever you have been eating is not helping the gallop. Permanently reduces movement speed by 5%. The last of the reach demands it.', cursed:true, e:ST('kelpie','speed',-0.05) },
    { k:'i13', p:'i12', name:'Reach of the Drowned', desc:'Longer than anything standing on the bank believes possible. Increases range by 3% and melee damage by 3%.', es:[ST('kelpie','rangeTiles',0.03), ST('kelpie','meleeDamage',0.03)] },

    // --- branch j: The Luring Song (charm / fear) -----------------------
    { k:'j1', p:null, name:'Glamoured Coat', desc:'For a moment you look exactly like the horse someone wanted. Increases charm chance by 5%.', e:ST('kelpie','charmChance',0.05) },
    { k:'j2', p:'j1', name:'Invitation to Ride', desc:'The oldest trick in the water-horse book, and it still works. Increases charm chance by 4%.', e:ST('kelpie','charmChance',0.04) },
    { k:'j3', p:'j2', name:'Adhesive Hide', desc:'They realise, far too late, that they cannot get off. Increases fear chance by 5%.', e:ST('kelpie','fearChance',0.05) },
    { k:'j4', p:'j3', name:'Hollow Promise', desc:'Keeping the glamour up leaves nothing behind the teeth. Permanently reduces melee damage by 4%. The rest of the song is bought with it.', cursed:true, e:ST('kelpie','meleeDamage',-0.04) },
    { k:'j5', p:'j4', name:"Rider's Doom", desc:'Nobody who mounts you ever gets home. Increases charm chance by 4%.', e:ST('kelpie','charmChance',0.04) },
    { k:'j6', p:'j4', name:'Scream Beneath the Water', desc:'A sound that carries much further than it should. Increases fear chance by 4%.', e:ST('kelpie','fearChance',0.04) },
    { k:'j7', p:'j5', name:'Bridle of Weeds', desc:'A halter woven from the shallows, and it fits anyone. Increases charm chance by 3%.', e:ST('kelpie','charmChance',0.03) },
    { k:'j8', p:'j6', name:'Cold Grip of Panic', desc:'They stop being able to remember which way the bank was. Increases fear chance by 4%.', e:ST('kelpie','fearChance',0.04) },
    { k:'j9', p:'j7', name:'False Kindness', desc:'You get very good at lying and correspondingly worse at everything honest. Increases charm chance by 3%, but reduces luck by 4%.', es:[ST('kelpie','charmChance',0.03), ST('kelpie','luck',-0.04)] },
    { k:'j10', p:'j8', name:'Terror of the Ford', desc:'The crossing gets a name, and then nobody uses it. Increases fear chance by 3%.', e:ST('kelpie','fearChance',0.03) },
    { k:'j11', p:'j9', name:'Whispering Shallows', desc:'The water tells you things about who is coming. Increases luck by 5%.', e:ST('kelpie','luck',0.05) },
    { k:'j12', p:'j10', name:'Drowning Dread', desc:'You start carrying the dread you deal in. Permanently reduces movement speed by 4%. The last verse demands it.', cursed:true, e:ST('kelpie','speed',-0.04) },
    { k:'j13', p:'j12', name:"Ferryman's Toll", desc:'Everything that crosses pays you something. Increases on-kill heal chance by 5% and fear chance by 3%.', es:[ST('kelpie','onKillHealChance',0.05), ST('kelpie','fearChance',0.03)] },

    // --- branch k: Brackish Hide (damageTakenMult / venom) --------------
    { k:'k1', p:null, name:'Riverbed Scales', desc:'Plating that has been under a river for a very long time. Reduces all damage you take by 6%.', e:UF('kelpie','damageTakenMult',-0.06) },
    { k:'k2', p:'k1', name:'Brine-Cured Flesh', desc:'Salt-hardened all the way through. Reduces all damage you take by 5%.', e:UF('kelpie','damageTakenMult',-0.05) },
    { k:'k3', p:'k2', name:'Stagnant Water', desc:'Everything that lives in you is bad for everything that does not. Increases venom chance by 4%.', e:ST('kelpie','venomChance',0.04) },
    { k:'k4', p:'k3', name:'Rot in the Lungs', desc:'Water that never moves eventually gets inside. You permanently take 14% more damage. The hide below is bought with that.', cursed:true, e:UF('kelpie','damageTakenMult',0.14) },
    { k:'k5', p:'k4', name:"Bottom-Feeder's Constitution", desc:'You have survived worse than this and eaten it. Reduces all damage you take by 10%.', e:UF('kelpie','damageTakenMult',-0.10) },
    { k:'k6', p:'k4', name:'Fen Poison', desc:'The rot goes out as readily as it came in. Increases venom chance by 3%.', e:ST('kelpie','venomChance',0.03) },
    { k:'k7', p:'k5', name:'Barnacled Plate', desc:'Something else has armoured you for free. Reduces all damage you take by 5%.', e:UF('kelpie','damageTakenMult',-0.05) },
    { k:'k8', p:'k6', name:'Marsh Fever', desc:'Whatever you kill was already sickening. Increases on-kill heal chance by 4%.', e:ST('kelpie','onKillHealChance',0.04) },
    { k:'k9', p:'k7', name:'Anchored in Mud', desc:'Nothing shifts you. That includes you. Reduces all damage you take by 8%, but reduces movement speed by 5%.', es:[UF('kelpie','damageTakenMult',-0.08), ST('kelpie','speed',-0.05)] },
    { k:'k10', p:'k8', name:'Bilge Blood', desc:'You take a little of theirs back with the bite. Increases lifesteal chance by 4%.', e:ST('kelpie','lifestealChance',0.04) },
    { k:'k11', p:'k9', name:'Silt Lung', desc:'Breathing through a riverbed costs you the force behind a strike. Permanently reduces melee damage by 3%. The old hide demands it.', cursed:true, e:ST('kelpie','meleeDamage',-0.03) },
    { k:'k12', p:'k11', name:'Hide of the Old River', desc:'A century of sediment, worn as armour. Reduces all damage you take by 5%, but the crust stiffens your reach — range drops 3%.', es:[UF('kelpie','damageTakenMult',-0.05), ST('kelpie','rangeTiles',-0.03)] },

    // --- branch l: The Drowned Thralls ------------
    // Phase 11 un-bleed pass — l4 used to borrow Changeling Queen's
    // `summonsChangelings` flag outright. Now her own `summonsThralls`,
    // driving the same generic orbiting-helper system under her own name.
    { k:'l1', p:null, name:'Names of the Taken', desc:'You start keeping a list, and the list starts keeping you. Permanently reduces luck by 4%. The drowned below answer to it.', cursed:true, e:ST('kelpie','luck',-0.04) },
    { k:'l2', p:'l1', name:'Weed-Bound Effigy', desc:'A shape of river-weed that pulls loose things toward the water. Increases pickup magnet radius by 4%.', e:ST('kelpie','magnetRadius',0.04) },
    { k:'l3', p:'l2', name:'Cold Water Keeps Them', desc:'Nothing down there decays, and nothing down there is slow. Increases dodge chance by 5%.', e:ST('kelpie','dodgeChance',0.05) },
    { k:'l4', p:'l3', name:'The Drowned Thralls', desc:'The list is long enough to call from. Riders you took years ago rise and follow you, hunting on their own and gnawing at whatever they reach. Wading everywhere with a train of corpses behind you costs 5% movement speed.', es:[FL('kelpie','summonsThralls',true), UF('kelpie','changelingMinionDmg',3), UF('kelpie','changelingMinionRadius',34), ST('kelpie','speed',-0.05)] },
    { k:'l5', p:'l4', name:'Deeper Draft', desc:'You call the ones from further down, where the cold is older. Your thralls gnaw harder.', e:UF('kelpie','changelingMinionDmg',1.5) },
    { k:'l6', p:'l4', name:'Wider Gnaw', desc:'They spread out instead of crowding one throat. Widens each thrall\'s reach by 14px.', e:UF('kelpie','changelingMinionRadius',14) },
    { k:'l7', p:'l5', name:'Third Drowned', desc:'One more name off the list, and one more thing dividing your attention. Raises your thrall limit by one, but you take 8% more damage.', es:[UF('kelpie','maxChangelingMinions',1), UF('kelpie','damageTakenMult',0.08)] },
    { k:'l8', p:'l6', name:'Quicker Summoning', desc:'They stop waiting to be asked twice. Calls a new thrall 1.5s sooner.', e:UF('kelpie','changelingSummonCooldown',-1.5) },
    { k:'l9', p:'l7', name:'Grave-Cold Bite', desc:'A century under the water sharpens the grudge. Your thralls gnaw harder.', e:UF('kelpie','changelingMinionDmg',1.5) },
    { k:'l10', p:'l8', name:'Toll of the Ferry', desc:'Every name you call is one you can no longer trade to anything else. Permanently reduces luck by 4%. The last of the drowned demand it.', cursed:true, e:ST('kelpie','luck',-0.04) },
    { k:'l11', p:'l10', name:'Fourth Drowned', desc:'The oldest one on the list finally surfaces. Raises your thrall limit by one.', e:UF('kelpie','maxChangelingMinions',1) },
    { k:'l12', p:'l11', name:'The River Never Gives Back', desc:'Everything it took is still down there, and it is all yours. Widens each thrall\'s reach by 22px and calls new ones 1.5s sooner.', es:[UF('kelpie','changelingMinionRadius',22), UF('kelpie','changelingSummonCooldown',-1.5)] },
  ],

  // =======================================================================
  // BREEZIE — pixie-sized, 2 red hearts, unlimitedRange dust motes.
  // =======================================================================
  breezie: [
    // --- branch i: Motes That Never Fall -------------------------------
    { k:'i1', p:null, name:'Weightless Dust', desc:'Nothing about a mote should take effort to throw. Reduces fire cooldown by 4%.', e:ST('breezie','fireCooldown',-0.04) },
    { k:'i2', p:'i1', name:'Featherborne Motes', desc:'They leave the wing already at speed. Increases bolt speed by 4%.', e:ST('breezie','boltSpeed',0.04) },
    { k:'i3', p:'i2', name:'Pollen Drift', desc:'Loose things drift toward you the way pollen drifts toward a flower. Increases pickup magnet radius by 5%.', e:ST('breezie','magnetRadius',0.05) },
    { k:'i4', p:'i3', name:'Scattered Attention', desc:'Throwing this many at once means aiming none of them properly. Permanently reduces ranged damage by 4%. The flurry below is bought with it.', cursed:true, e:ST('breezie','rangedDamage',-0.04) },
    { k:'i5', p:'i4', name:'Unerring Mote', desc:'One in every handful goes exactly where it was meant to. Increases critical hit chance by 4%.', e:ST('breezie','critChance',0.04) },
    { k:'i6', p:'i4', name:'Ceaseless Flurry', desc:'You simply stop pausing. Reduces fire cooldown by 5%.', e:ST('breezie','fireCooldown',-0.05) },
    { k:'i7', p:'i5', name:'Pinprick Precision', desc:'Small enough to fit through the gap in anything. Increases critical hit chance by 2%.', e:ST('breezie','critChance',0.02) },
    { k:'i8', p:'i6', name:'Blurwing', desc:'The wings stop being individually visible. Reduces fire cooldown by 4%.', e:ST('breezie','fireCooldown',-0.04) },
    { k:'i9', p:'i7', name:'Thin Air', desc:'You climb to where nothing slows a mote down and nothing shields you either. Reduces fire cooldown by 4%, but you take 10% more damage.', es:[ST('breezie','fireCooldown',-0.04), UF('breezie','damageTakenMult',0.10)] },
    { k:'i10', p:'i8', name:'Sting of the Small', desc:'Everything this size that survives is poisonous. Increases venom chance by 5%.', e:ST('breezie','venomChance',0.05) },
    { k:'i11', p:'i9', name:'Overexcited Wings', desc:'You burn the beat and have to find it again. Permanently increases fire cooldown by 5%. The end of the flurry demands it.', cursed:true, e:ST('breezie','fireCooldown',0.05) },
    { k:'i12', p:'i10', name:'Nettle Dust', desc:'Ground from something that did not want to be ground. Increases venom chance by 4%.', e:ST('breezie','venomChance',0.04) },
    { k:'i13', p:'i12', name:'Endless Swarm', desc:'There stops being a gap between one mote and the next. Reduces fire cooldown by 4% and increases bolt speed by 4%.', es:[ST('breezie','fireCooldown',-0.04), ST('breezie','boltSpeed',0.04)] },

    // --- branch j: Thistledown Hide (surviving on two hearts) -----------
    { k:'j1', p:null, name:'Hard to Hit', desc:'You are the size of a hoofprint and you use it. Increases dodge chance by 6%.', e:ST('breezie','dodgeChance',0.06) },
    { k:'j2', p:'j1', name:'Hoofprint-Sized', desc:'Most swings are aimed at where a pony would be. Increases dodge chance by 5%.', e:ST('breezie','dodgeChance',0.05) },
    { k:'j3', p:'j2', name:'Gust-Borne', desc:'You let the room\'s own draughts carry you. Increases movement speed by 5%.', e:ST('breezie','speed',0.05) },
    { k:'j4', p:'j3', name:'Paper Wings', desc:'Getting this light means getting this fragile. You permanently take 15% more damage — on two hearts. Everything below is bought at that price.', cursed:true, e:UF('breezie','damageTakenMult',0.15) },
    { k:'j5', p:'j4', name:'Thistledown Padding', desc:'A whole coat of seedfluff between you and the world. Reduces all damage you take by 15%.', e:UF('breezie','damageTakenMult',-0.15) },
    { k:'j6', p:'j4', name:'Impossible Angle', desc:'Nothing your size should be able to turn like that. Increases dodge chance by 4%.', e:ST('breezie','dodgeChance',0.04) },
    { k:'j7', p:'j5', name:'Chitin Bloom', desc:'Something harder than skin finally grows in. Reduces all damage you take by 10%.', e:UF('breezie','damageTakenMult',-0.10) },
    { k:'j8', p:'j6', name:'Vanishing Act', desc:'They lose you against the wallpaper. Increases dodge chance by 4%.', e:ST('breezie','dodgeChance',0.04) },
    { k:'j9', p:'j7', name:'Heavier Than Air', desc:'You put on enough mass to stop being blown apart, and enough to stop being quick. Reduces all damage you take by 10%, but movement speed by 6%.', es:[UF('breezie','damageTakenMult',-0.10), ST('breezie','speed',-0.06)] },
    { k:'j10', p:'j8', name:'Zigzag Instinct', desc:'You have never once flown in a straight line. Increases dodge chance by 3%.', e:ST('breezie','dodgeChance',0.03) },
    { k:'j11', p:'j9', name:'Sap-Thick Blood', desc:'What you lose, you get back from whatever lost more. Increases on-kill heal chance by 5%.', e:ST('breezie','onKillHealChance',0.05) },
    { k:'j12', p:'j10', name:'Overconfidence', desc:'Surviving this long convinces you nothing can land, which is when things start landing. Permanently reduces dodge chance by 3%. The last of the hide demands it.', cursed:true, e:ST('breezie','dodgeChance',-0.03) },
    { k:'j13', p:'j12', name:'Untouchable', desc:'You stop being a thing that gets hit. Increases dodge chance by 5%, but the concentration costs 4% movement speed.', es:[ST('breezie','dodgeChance',0.05), ST('breezie','speed',-0.04)] },

    // --- branch k: Pollen Trail ----------------------------------------
    { k:'k1', p:null, name:'Sweet Trail', desc:'Everything loose follows the smell. Increases pickup magnet radius by 5%.', e:ST('breezie','magnetRadius',0.05) },
    { k:'k2', p:'k1', name:'Flower-Friend', desc:'It is very hard to stay angry at something this small and this polite. Increases charm chance by 5%.', e:ST('breezie','charmChance',0.05) },
    { k:'k3', p:'k2', name:'Breezie Glamour', desc:'An old, small, extremely effective magic. Increases charm chance by 4%.', e:ST('breezie','charmChance',0.04) },
    { k:'k4', p:'k3', name:'Sneezing Fit', desc:'You are, it turns out, allergic to your own ammunition. Permanently increases fire cooldown by 4%. The rest of the trail demands it.', cursed:true, e:ST('breezie','fireCooldown',0.04) },
    { k:'k5', p:'k4', name:'Beloved of Small Things', desc:'Everything smaller than a bread loaf is on your side. Increases charm chance by 4%.', e:ST('breezie','charmChance',0.04) },
    { k:'k6', p:'k4', name:'Lucky Little Thing', desc:'Nothing this fragile gets this far without help. Increases luck by 5%.', e:ST('breezie','luck',0.05) },
    { k:'k7', p:'k5', name:'Honeyed Motes', desc:'The dust tastes like something worth staying for. Increases charm chance by 3%.', e:ST('breezie','charmChance',0.03) },
    { k:'k8', p:'k6', name:'Four-Petal Fortune', desc:'You find the good flower every single time. Increases luck by 4%.', e:ST('breezie','luck',0.04) },
    { k:'k9', p:'k7', name:'Cloying Pollen', desc:'Laying it on thick enough to stick to you too. Increases charm chance by 3%, but reduces movement speed by 4%.', es:[ST('breezie','charmChance',0.03), ST('breezie','speed',-0.04)] },
    { k:'k10', p:'k8', name:'Nectar Sense', desc:'You can smell a dropped coin across a room. Increases pickup magnet radius by 5%.', e:ST('breezie','magnetRadius',0.05) },
    { k:'k11', p:'k9', name:'Hive-Mind Whisper', desc:'Something small tells you where the soft parts were. Increases on-kill heal chance by 4%.', e:ST('breezie','onKillHealChance',0.04) },
    { k:'k12', p:'k11', name:'The Whole Meadow Follows', desc:'You do not gather things anymore. They arrive. Increases pickup magnet radius by 5% and luck by 4%.', es:[ST('breezie','magnetRadius',0.05), ST('breezie','luck',0.04)] },

    // --- branch l: Kindled Ember (a charge-and-release mode of her own) ---
    // Phase 11 un-bleed pass — this used to explicitly frame itself as
    // "swallowing a dragon's coal." `charged` itself is a plain shared
    // input-mode toggle (Kirin and Crystal Pony both natively use it, same
    // as any class's melee/ranged dispatch), so the flag stays — only the
    // borrowed FICTION is gone: this is her own ember now, not dragon's.
    { k:'l1', p:null, name:'Ash on the Wing', desc:'You have been carrying a coal of your own too close for too long, and the soot has weight. Permanently reduces bolt speed by 4%. The ember below starts here.', cursed:true, e:ST('breezie','boltSpeed',-0.04) },
    { k:'l2', p:'l1', name:'Spark in the Chest', desc:'Something small and hot that was not there last week. Increases ranged damage by 3%.', e:ST('breezie','rangedDamage',0.03) },
    { k:'l3', p:'l2', name:'Kindled Motes', desc:'The dust arrives already alight, and things run from it. Increases fear chance by 5%.', e:ST('breezie','fearChance',0.05) },
    { k:'l4', p:'l3', name:'Kindled Ember', desc:'The coal in your chest finally catches properly. Hold the attack to charge, then breathe a jet that burns straight through a line of enemies. The price is your birthright: your motes lose their endless momentum and now expire at ordinary range, and the charge takes 0.35s to fill. Range matters to you again.', es:[FL('breezie','charged',true), FL('breezie','unlimitedRange',false), UF('breezie','chargeTime',0.35), ST('breezie','rangeTiles',0.05)] },
    { k:'l5', p:'l4', name:'Quicker Kindling', desc:'The coal catches sooner every time you use it. Charges 0.08s faster.', e:UF('breezie','chargeTime',-0.08) },
    { k:'l6', p:'l4', name:'Longer Breath', desc:'You learn how far the jet actually wants to go. Increases range by 5%.', e:ST('breezie','rangeTiles',0.05) },
    { k:'l7', p:'l5', name:'Bellows Wings', desc:'You fan the coal with the same wings that keep you up, and stop dodging while you do it. Charges 0.08s faster, but you take 8% more damage.', es:[UF('breezie','chargeTime',-0.08), UF('breezie','damageTakenMult',0.08)] },
    { k:'l8', p:'l6', name:'Farsight Ember', desc:'The jet still has bite at the far end. Increases range by 4%.', e:ST('breezie','rangeTiles',0.04) },
    { k:'l9', p:'l7', name:'Coal-Choked', desc:'A dragon\'s coal is genuinely too big for you and always will be. Permanently increases fire cooldown by 5%. The hottest ember demands it.', cursed:true, e:ST('breezie','fireCooldown',0.05) },
    { k:'l10', p:'l8', name:'Hotter Coal', desc:'You bank it instead of spending it. Increases ranged damage by 3%.', e:ST('breezie','rangedDamage',0.03) },
    { k:'l11', p:'l9', name:'Snapkindle', desc:'Breath, blast, and back to hovering. Charges 0.06s faster.', e:UF('breezie','chargeTime',-0.06) },
    { k:'l12', p:'l11', name:'Emberheart', desc:'The coal stops being borrowed. Increases range by 4%, but there is no cold left anywhere in you — freeze chance drops 5%.', es:[ST('breezie','rangeTiles',0.04), ST('breezie','freezeChance',-0.05)] },
  ],

  // =======================================================================
  // DNBPONY — the DNB capstone: fastest fire rate, bass pulses.
  // =======================================================================
  dnbpony: [
    // --- branch i: Bassline --------------------------------------------
    { k:'i1', p:null, name:'Sub-Frequency', desc:'You drop the pulse below where ears work and into where ribs do. Increases ranged damage by 4%.', e:ST('dnbpony','rangedDamage',0.04) },
    { k:'i2', p:'i1', name:'Reese Growl', desc:'Two detuned pulses beating against each other. Increases ranged damage by 3%.', e:ST('dnbpony','rangedDamage',0.03) },
    { k:'i3', p:'i2', name:'Kick Weight', desc:'The transient hits before the note does. Increases stun chance by 5%.', e:ST('dnbpony','stunChance',0.05) },
    { k:'i4', p:'i3', name:'Clipped Signal', desc:'Pushing the rail this hard flattens the top off every pulse. Permanently reduces ranged damage by 4%. The rest of the bassline is bought with it.', cursed:true, e:ST('dnbpony','rangedDamage',-0.04) },
    { k:'i5', p:'i4', name:'Wall of Bass', desc:'Not a shot. A pressure front. Increases ranged damage by 4%.', e:ST('dnbpony','rangedDamage',0.04) },
    { k:'i6', p:'i4', name:'Concussive Kick', desc:'Something in them loses the beat. Increases stun chance by 4%.', e:ST('dnbpony','stunChance',0.04) },
    { k:'i7', p:'i5', name:'Doubled Sub', desc:'Two subs, one octave apart, arriving together. Increases ranged damage by 4%.', e:ST('dnbpony','rangedDamage',0.04) },
    { k:'i8', p:'i6', name:'Stagger Step', desc:'They try to move on the wrong half of the bar. Increases stun chance by 4%.', e:ST('dnbpony','stunChance',0.04) },
    { k:'i9', p:'i7', name:'Blown Cone', desc:'You push past what the driver can actually do. Increases ranged damage by 4%, but the rig needs 5% longer between pulses.', es:[ST('dnbpony','rangedDamage',0.04), ST('dnbpony','fireCooldown',0.05)] },
    { k:'i10', p:'i8', name:'Amen Break', desc:'The one break everything else was built out of. Increases stun chance by 3%.', e:ST('dnbpony','stunChance',0.03) },
    { k:'i11', p:'i9', name:'Overdriven Rail', desc:'Running the whole rig this hot means standing next to a bomb. You permanently take 12% more damage. The drop below demands it.', cursed:true, e:UF('dnbpony','damageTakenMult',0.12) },
    { k:'i12', p:'i10', name:'Rolling Bassline', desc:'It stops having gaps in it. Increases ranged damage by 2%.', e:ST('dnbpony','rangedDamage',0.02) },
    { k:'i13', p:'i12', name:'The Drop', desc:'Everything the build was for, arriving all at once. Increases ranged damage by 4% and stun chance by 3%.', es:[ST('dnbpony','rangedDamage',0.04), ST('dnbpony','stunChance',0.03)] },

    // --- branch j: Tempo -----------------------------------------------
    { k:'j1', p:null, name:'174 BPM', desc:'The only speed there has ever been. Increases movement speed by 4%.', e:ST('dnbpony','speed',0.04) },
    { k:'j2', p:'j1', name:'Tight Snare', desc:'Nothing smears. Everything lands. Increases critical hit chance by 5%.', e:ST('dnbpony','critChance',0.05) },
    { k:'j3', p:'j2', name:'Rolling Break', desc:'You stop stopping. Increases movement speed by 3%.', e:ST('dnbpony','speed',0.03) },
    { k:'j4', p:'j3', name:'Rushed Timing', desc:'Playing ahead of the click means playing in front of your own aim. Permanently reduces critical hit chance by 3%. The pocket below is bought with it.', cursed:true, e:ST('dnbpony','critChance',-0.03) },
    { k:'j5', p:'j4', name:'On the One', desc:'You find the beat again and never lose it. Increases critical hit chance by 5%.', e:ST('dnbpony','critChance',0.05) },
    { k:'j6', p:'j4', name:'Double Time', desc:'Half the bar, twice the ground. Increases movement speed by 3%.', e:ST('dnbpony','speed',0.03) },
    { k:'j7', p:'j5', name:'Ghost Note', desc:'The hit they never heard coming was between the ones they did. Increases critical hit chance by 4%.', e:ST('dnbpony','critChance',0.04) },
    { k:'j8', p:'j6', name:'Halftime Pocket', desc:'You sit back in the groove — more ground covered, longer between pulses. Increases movement speed by 4%, but fire cooldown by 4%.', es:[ST('dnbpony','speed',0.04), ST('dnbpony','fireCooldown',0.04)] },
    { k:'j9', p:'j7', name:'Perfect Quantize', desc:'Every single pulse lands exactly on the grid. Increases critical hit chance by 4%.', e:ST('dnbpony','critChance',0.04) },
    { k:'j10', p:'j8', name:'Legwork', desc:'The footwork was always the point. Increases movement speed by 3%.', e:ST('dnbpony','speed',0.03) },
    { k:'j11', p:'j9', name:'Snare Rush', desc:'The roll accelerates and so do you. Reduces fire cooldown by 3%.', e:ST('dnbpony','fireCooldown',-0.03) },
    { k:'j12', p:'j10', name:'Dropped Beat', desc:'One bar of nothing, and you never quite get it back. Permanently reduces movement speed by 4%. The groove below demands it.', cursed:true, e:ST('dnbpony','speed',-0.04) },
    { k:'j13', p:'j12', name:'Locked Groove', desc:'It loops forever and it never drifts. Increases movement speed by 3% and critical hit chance by 3%.', es:[ST('dnbpony','speed',0.03), ST('dnbpony','critChance',0.03)] },

    // --- branch k: Subwoofer -------------------------------------------
    { k:'k1', p:null, name:'Hypnotic Wobble', desc:'Nobody has ever walked away from a good wobble. Increases charm chance by 5%.', e:ST('dnbpony','charmChance',0.05) },
    { k:'k2', p:'k1', name:'Neurofunk Snarl', desc:'A sound with actual teeth in it. Increases fear chance by 5%.', e:ST('dnbpony','fearChance',0.05) },
    { k:'k3', p:'k2', name:'Cab Rattle', desc:'The whole cabinet moves, and so does everything it throws. Increases bolt speed by 4%.', e:ST('dnbpony','boltSpeed',0.04) },
    { k:'k4', p:'k3', name:'Ear Bleed', desc:'You have been standing in front of the stack for years. You permanently take 12% more damage. Everything below is bought at that volume.', cursed:true, e:UF('dnbpony','damageTakenMult',0.12) },
    { k:'k5', p:'k4', name:'Bass Cushion', desc:'A standing pressure wave that shoves incoming things off line. Reduces all damage you take by 12%.', e:UF('dnbpony','damageTakenMult',-0.12) },
    { k:'k6', p:'k4', name:'Rave Trance', desc:'They forget entirely what they came in here to do. Increases charm chance by 4%.', e:ST('dnbpony','charmChance',0.04) },
    { k:'k7', p:'k5', name:'Dread Sub', desc:'Below hearing, above bearing. Increases fear chance by 4%.', e:ST('dnbpony','fearChance',0.04) },
    { k:'k8', p:'k6', name:'Crowd Control', desc:'You have the whole floor moving your way. Increases charm chance by 4%.', e:ST('dnbpony','charmChance',0.04) },
    { k:'k9', p:'k7', name:'Pressure Wave', desc:'You trade the punch of each pulse for the terror of the whole room shaking. Increases fear chance by 4%, but reduces ranged damage by 3%.', es:[ST('dnbpony','fearChance',0.04), ST('dnbpony','rangedDamage',-0.03)] },
    { k:'k10', p:'k8', name:'Skanking Fit', desc:'Involuntary, and entirely on your beat. Increases charm chance by 3%.', e:ST('dnbpony','charmChance',0.03) },
    { k:'k11', p:'k9', name:'Low-End Anchor', desc:'Something that heavy is hard to knock over. Reduces all damage you take by 8%.', e:UF('dnbpony','damageTakenMult',-0.08) },
    { k:'k12', p:'k11', name:'Subwoofer Heart', desc:'The rig and the ribcage stop being separate. Reduces all damage you take by 6% and increases fear chance by 3%.', es:[UF('dnbpony','damageTakenMult',-0.06), ST('dnbpony','fearChance',0.03)] },

    // --- branch l: Speaker Stacks --------------------
    // Phase 11 un-bleed pass — l4 used to borrow Engineer Pony's
    // `canBuildTurrets` flag outright. Now her own `canDropStacks`.
    { k:'l1', p:null, name:'Cable Run', desc:'There is now several hundred metres of XLR between you and anywhere. Permanently reduces bolt speed by 4%. The stacks below plug into it.', cursed:true, e:ST('dnbpony','boltSpeed',-0.04) },
    { k:'l2', p:'l1', name:'Roadie Instinct', desc:'You can find a dropped jack plug in a dark room. Increases pickup magnet radius by 5%.', e:ST('dnbpony','magnetRadius',0.05) },
    { k:'l3', p:'l2', name:'Rig Check', desc:'Nothing goes wrong that you did not already check for. Increases luck by 5%.', e:ST('dnbpony','luck',0.05) },
    { k:'l4', p:'l3', name:'Speaker Stacks', desc:'Hold the build key to drop a stack where you are standing. It holds the frequency on its own and keeps firing bass pulses at whatever comes near, long after you have moved on. Hauling cabinets around costs you 5% movement speed.', es:[FL('dnbpony','canDropStacks',true), UF('dnbpony','turretDamageMult',0.10), ST('dnbpony','speed',-0.05)] },
    { k:'l5', p:'l4', name:'Bigger Drivers', desc:'Eighteen inches instead of twelve. Your stacks hit considerably harder.', e:UF('dnbpony','turretDamageMult',0.10) },
    { k:'l6', p:'l4', name:'Fourth Stack', desc:'One more cabinet than the room was rated for. Raises your stack limit by one.', e:UF('dnbpony','maxTurrets',1) },
    { k:'l7', p:'l5', name:'Blown Tweeters', desc:'You give the stacks the top end you were using yourself. They hit harder, but your own pulses lose 4% ranged damage.', es:[UF('dnbpony','turretDamageMult',0.12), ST('dnbpony','rangedDamage',-0.04)] },
    { k:'l8', p:'l6', name:'Wall of Sound', desc:'Standing inside your own rig is not survivable and you do it anyway. You permanently take 10% more damage. The rest of the stack demands it.', cursed:true, e:UF('dnbpony','damageTakenMult',0.10) },
    { k:'l9', p:'l8', name:'Fifth Stack', desc:'At this point it is structural. Raises your stack limit by one.', e:UF('dnbpony','maxTurrets',1) },
    { k:'l10', p:'l7', name:'Crossover Network', desc:'Every driver finally doing only its own job. Your stacks hit harder.', e:UF('dnbpony','turretDamageMult',0.10) },
    { k:'l11', p:'l9', name:'Feedback Loop', desc:'You let the stacks feed each other, and rigging that takes time you do not have mid-set. Your stacks hit harder, but fire cooldown — and therefore how long a stack takes to build — rises 5%.', es:[UF('dnbpony','turretDamageMult',0.08), ST('dnbpony','fireCooldown',0.05)] },
    { k:'l12', p:'l11', name:'Headline Set', desc:'The whole field, the whole rig, the whole night. Your stacks hit harder, but there is nowhere left to stand that is safe — you take 8% more damage.', es:[UF('dnbpony','turretDamageMult',0.10), UF('dnbpony','damageTakenMult',0.08)] },
  ],
};

// Builder — turns the config above into canonical node objects. `p:null`
// resolves to that character's existing hub node; any other `p` is a branch
// key within the SAME character, so no parent can ever dangle outside this
// file's own data plus the hub that skilltree.js itself defines. Cost is 1
// point per node, matching every other character node in the tree.
const SKILL_TREE_CHARACTER_NODES_4C = [];
(function buildCharacterSkillNodes4C(){
  for (const classId in SKILL_TREE_CHARACTER_CONFIG_4C) {
    for (const entry of SKILL_TREE_CHARACTER_CONFIG_4C[classId]) {
      const node = {
        id: 'char_' + classId + '_' + entry.k,
        parent: entry.p == null ? ('char_hub_' + classId) : ('char_' + classId + '_' + entry.p),
        cost: 1,
        name: entry.name,
        desc: entry.desc,
      };
      if (entry.es) node.effects = entry.es;
      else node.effect = entry.e || null;
      if (entry.cursed) node.cursed = true;
      SKILL_TREE_CHARACTER_NODES_4C.push(node);
    }
  }
})();

for (const n of SKILL_TREE_CHARACTER_NODES_4C) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

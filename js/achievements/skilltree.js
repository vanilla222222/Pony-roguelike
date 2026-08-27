'use strict';
// achievements/skilltree.js — Phase 8b: skill tree engine. Points are earned
// via bestiary tiers (see achievements/bestiary-tiers.js + logic.js's
// checkBestiaryTierUp) and spent here on nodes. This file is pure
// scaffolding: it defines the start node + the 27 category hub nodes, and a
// fully generic purchase/effect engine. The 375 leaf nodes (10/character x25,
// 100 unlock, 25 general upgrade) are content for later phases (8c/8d/8e) and
// are NOT defined here — they just need to be appended to SKILL_TREE_NODES
// using the node shapes below; the engine does not change. The 250
// character nodes (10/character x25) now live in
// achievements/skilltree-characters.js (Phase 8c); the 25 general-upgrade
// nodes now live in achievements/skilltree-general.js (Phase 8d); the 100
// unlock nodes remain for Phase 8e.

const SKILL_TREE_STAT_FIELDS = ['speed','meleeDamage','rangedDamage','critChance','luck','fireCooldown','meleeCooldown','rangeTiles','boltSpeed','magnetRadius',
  // Phase 8c-2 — on-hit/utility CHANCE fields (see items-1.js recalcPlayerStats,
  // which assigns every one of these BEFORE calling applySkillTreeStatBonuses,
  // its own last statement — so a bonus here always lands on top of that
  // class's already-computed value, item-driven or innate, for any classId).
  // These are handled ADDITIVELY, not multiplicatively — see
  // SKILL_TREE_ADDITIVE_STAT_FIELDS below for why.
  'venomChance','stunChance','charmChance','freezeChance','fearChance','vulnerableChance','lifestealChance','onKillHealChance','dodgeChance',
  // Engine expansion pass — registers an ALREADY-EXISTING player field
  // (see items-1.js's recalcPlayerStats, which reassigns
  // player.shopDiscountBonus fresh from items/passives every call, exactly
  // like every stat above) as a skill-tree target. No new nodes use it yet;
  // this just turns the field "on" for a future node the same way the
  // comment above SKILL_TREE_STAT_FIELDS describes for uniqueField.
  'shopDiscountBonus'];
const SKILL_TREE_STAT_CAP = 0.25; // hard ceiling: combined skill-tree bonus on any one stat, for any one character, across ALL owned nodes, never exceeds +25%
// Phase 10 — per-stat ceilings that differ from the flat cap above. Only the
// stats listed here behave differently; every other stat (including every
// OTHER chance field) keeps the 25% ceiling exactly as before, so this table
// is a no-op for all of them.
//
// lifestealChance is the one field where 25% is genuinely too strong: it is
// additive (see SKILL_TREE_ADDITIVE_STAT_FIELDS) and scales with attack rate
// rather than with damage, so +25 percentage points of lifesteal on a fast
// class effectively removes attrition from the run entirely. 10 points is the
// most the tree may ever contribute to it.
// shopDiscountBonus gets the same tighter treatment as lifestealChance —
// see the comment above SKILL_TREE_ADDITIVE_STAT_FIELDS for why.
const SKILL_TREE_STAT_CAP_OVERRIDES = { lifestealChance: 0.10, shopDiscountBonus: 0.10 };
// Phase 8c-2 — chance-type fields above are already a probability, not a
// %-of-base multiplier the way meleeDamage/speed/etc are: most classes sit at
// exactly 0 on most of these with no items equipped (e.g. a fresh Pegasus's
// dodgeChance), so applySkillTreeStatBonuses' normal `player[stat] *= (1 +
// bonus)` would multiply 0 by anything and stay 0 — silently doing nothing.
// Fields listed here get `player[stat] += bonus` instead, so a node granting
// e.g. 0.08 genuinely adds an 8-percentage-point chance regardless of what
// items the run has (or hasn't) found. Every field in this list must also be
// in SKILL_TREE_STAT_FIELDS above.
const SKILL_TREE_ADDITIVE_STAT_FIELDS = ['venomChance','stunChance','charmChance','freezeChance','fearChance','vulnerableChance','lifestealChance','onKillHealChance','dodgeChance',
  // shopDiscountBonus starts at 0 for most runs (only items/passives raise
  // it) exactly like the chance fields above, so it needs the same additive
  // treatment rather than `*= (1+bonus)` silently doing nothing on 0.
  'shopDiscountBonus'];
// Same headroom concern as lifestealChance (see SKILL_TREE_STAT_CAP_OVERRIDES
// above): shopDiscountBonus is already fed by ~25 item/passive sources
// individually capped at 0.5 and re-capped again at 0.7 in items-2.js's
// updateShop purchase-time clamp, so the tree's own contribution should stay
// modest whenever a future node targets it — a nice-to-have on top of an
// already-strong economy stat, not a build-defining source of it.

// Node shape:
// { id, parent, cost, name, desc, effect: null | {type:'stat', classId, stat, amount}
//                                        | {type:'unlock', category, id}
//                                        | {type:'poolWeight', pool, id, bonus}
//                                        | {type:'startingPickup', pickup, amount}
//                                        | {type:'uniqueField', classId, field, amount, min, max}
//                                        | {type:'uniqueFlag', classId, field, value}
//                                        | {type:'globalStat', stat, amount}
//                                        | {type:'runModifier', classId, key, value} }
//
// Engine expansion pass — two new effect types, infrastructure only (no
// node in any content file uses either yet, same "turns on" pattern as an
// unshadowed uniqueField target above):
//   'globalStat'   — identical accounting to 'stat' (same
//                    SKILL_TREE_STAT_FIELDS whitelist, same additive/
//                    multiplicative split, same cap) EXCEPT it applies to
//                    EVERY class rather than one — no `classId` field at
//                    all, see getSkillTreeStatBonus's second accumulation
//                    pass below. For a future "general path" node meant to
//                    help every character a little rather than one
//                    character a lot (skilltree-general.js's 25 existing
//                    nodes currently only reach pools/starting pickups —
//                    this is the missing "a flat stat, for everyone" case).
//   'runModifier'  — an arbitrary namespaced key/value bag rather than a
//                    real player field: writes into
//                    `player.skillTreeMods[key] = value` (see
//                    applySkillTreeRunModifiers below) instead of any
//                    existing stat/flag. Lets a FUTURE gameplay system
//                    (anything that doesn't exist as a player field yet —
//                    a new proc trigger, a mode toggle, a tuning knob) read
//                    `player.skillTreeMods.someKey` without the skill-tree
//                    engine itself needing a new effect TYPE for every
//                    such system as it's built. Last write for a given key
//                    wins if two owned nodes both target it (no summing —
//                    a value here isn't assumed numeric).
// `parent` is the single node id this one requires to already be owned (null only for the start node).
//
// A node may instead (or additionally) carry `effects: [...]` — an array of
// any of the above effect objects — for a node with more than one effect.
// `effect` (singular) remains fully supported for backward compatibility
// (all 250 existing nodes in skilltree-characters.js use it and are never
// migrated); use nodeEffects(node) everywhere rather than reading either
// field directly, so both shapes are handled uniformly.
function nodeEffects(node){
  return node.effects || (node.effect ? [node.effect] : []);
}
const SKILL_TREE_NODES = [
  { id:'start', parent:null, cost:0, name:'Awakening', desc:'The root of your meta-progression.', effect:null },
  // one hub per class, cost 1, gates that class's future 10 nodes
  ...Object.keys(CLASSES).map(classId => ({
    id:'char_hub_' + classId, parent:'start', cost:1,
    name:CLASSES[classId].name + ' Path',
    desc:'Unlocks this character\'s upgrade path.', effect:null,
  })),
  { id:'unlock_hub', parent:'start', cost:1, name:'Unlocks Path', desc:'Unlocks the path to new content.', effect:null },
  { id:'general_hub', parent:'start', cost:1, name:'General Path', desc:'Unlocks the path to general upgrades.', effect:null },
];
const SKILL_TREE_NODES_BY_ID = {};
for (const n of SKILL_TREE_NODES) SKILL_TREE_NODES_BY_ID[n.id] = n;

function isSkillNodeOwned(unlocks, nodeId){
  return nodeId === 'start' || !!(unlocks.skillTree.unlockedNodes && unlocks.skillTree.unlockedNodes[nodeId]);
}

function canBuySkillNode(unlocks, nodeId){
  const node = SKILL_TREE_NODES_BY_ID[nodeId];
  if (!node) return false;
  if (isSkillNodeOwned(unlocks, nodeId)) return false;
  if (node.parent && !isSkillNodeOwned(unlocks, node.parent)) return false;
  return unlocks.skillTree.points >= node.cost;
}

function buySkillNode(nodeId){
  const unlocks = ensureUnlockShape(loadUnlocks());
  if (!canBuySkillNode(unlocks, nodeId)) return false;
  const node = SKILL_TREE_NODES_BY_ID[nodeId];
  unlocks.skillTree.points -= node.cost;
  unlocks.skillTree.spent[nodeId] = node.cost;
  unlocks.skillTree.unlockedNodes[nodeId] = true;
  for (const eff of nodeEffects(node)) {
    if (eff.type === 'unlock') applySkillTreeUnlockEffect(unlocks, eff);
  }
  saveUnlocks(unlocks);
  return true;
}

// Sell-back — refunds a mistakenly-bought node in full. Deliberately
// restricted to the FRONTIER only (leaves with no owned children), the same
// direction fog-of-war already enforces for buying: you can only ever
// undo the most recent purchase along a given branch, never yank a node out
// from under something built on top of it. `'unlock'` effects (star/
// trinket/familiar/item grants) are excluded entirely — those permanently
// flip a SEPARATE unlocks bucket (unlockedStars/etc, see
// applySkillTreeUnlockEffect below) rather than being recomputed live from
// unlockedNodes the way stat/uniqueField/uniqueFlag/poolWeight/
// startingPickup effects all are, so there's no clean way to "un-grant" one
// without risking clawing back content the player has already used
// elsewhere. `start` (free, cost 0) is never sellable — there's nothing to
// refund and every other node ultimately roots through it.
function nodeHasOwnedChildren(unlocks, nodeId){
  for (const n of SKILL_TREE_NODES) {
    if (n.parent === nodeId && isSkillNodeOwned(unlocks, n.id)) return true;
  }
  return false;
}
function canSellSkillNode(unlocks, nodeId){
  if (nodeId === 'start') return false;
  const node = SKILL_TREE_NODES_BY_ID[nodeId];
  if (!node || !node.cost) return false;
  if (!isSkillNodeOwned(unlocks, nodeId)) return false;
  if (nodeEffects(node).some(e => e.type === 'unlock')) return false;
  if (nodeHasOwnedChildren(unlocks, nodeId)) return false;
  return true;
}
function sellSkillNode(nodeId){
  const unlocks = ensureUnlockShape(loadUnlocks());
  if (!canSellSkillNode(unlocks, nodeId)) return false;
  const node = SKILL_TREE_NODES_BY_ID[nodeId];
  unlocks.skillTree.points += node.cost;
  delete unlocks.skillTree.unlockedNodes[nodeId];
  if (unlocks.skillTree.spent) delete unlocks.skillTree.spent[nodeId];
  saveUnlocks(unlocks);
  return true;
}

function applySkillTreeUnlockEffect(unlocks, effect){
  // mirrors achievements/logic.js's unlockAchievement grant pattern
  const bucket = { star:'unlockedStars', trinket:'unlockedTrinkets', familiar:'unlockedFamiliars', item:'unlockedItems' }[effect.category];
  if (!bucket || !unlocks[bucket]) return;
  if (unlocks[bucket][effect.id]) return; // already unlocked, don't double-grant
  unlocks[bucket][effect.id] = true;
}

function getSkillTreeStatBonus(unlocks, classId, stat){
  let total = 0;
  for (const n of SKILL_TREE_NODES) {
    if (!isSkillNodeOwned(unlocks, n.id)) continue;
    for (const eff of nodeEffects(n)) {
      if (eff.type === 'stat' && eff.classId === classId && eff.stat === stat) total += eff.amount;
      // 'globalStat' — same accumulation, no classId gate: every owned
      // globalStat node targeting this `stat` contributes regardless of
      // which character is playing. See the node-shape comment above.
      else if (eff.type === 'globalStat' && eff.stat === stat) total += eff.amount;
    }
  }
  // symmetric clamp: a node may apply a genuine NEGATIVE bonus (a
  // trade-off node, or a reduction on fireCooldown/meleeCooldown) without
  // being floored to 0 — see applySkillTreeStatBonuses below for why a
  // negative bonus here correctly REDUCES a cooldown field.
  // per-stat ceiling where one is declared (currently lifestealChance only),
  // the flat 25% everywhere else — see SKILL_TREE_STAT_CAP_OVERRIDES
  const cap = SKILL_TREE_STAT_CAP_OVERRIDES[stat] != null ? SKILL_TREE_STAT_CAP_OVERRIDES[stat] : SKILL_TREE_STAT_CAP;
  return Util.clamp(total, -cap, cap);
}

// last statement of recalcPlayerStats (js/systems/items-1.js) — applied after
// every other stat derivation so the +% multiplies the fully-derived value
function applySkillTreeStatBonuses(player){
  const unlocks = ensureUnlockShape(loadUnlocks());
  for (const stat of SKILL_TREE_STAT_FIELDS) {
    if (typeof player[stat] !== 'number') continue;
    const bonus = getSkillTreeStatBonus(unlocks, player.classId, stat);
    if (bonus === 0) continue;
    if (SKILL_TREE_ADDITIVE_STAT_FIELDS.indexOf(stat) !== -1) player[stat] += bonus; // chance-type field: bonus IS the delta, not a %-of-base multiplier — see the const's comment above
    else player[stat] *= (1 + bonus); // bonus may now be negative (e.g. a cooldown reduction) — see getSkillTreeStatBonus
  }
  applySkillTreeUniqueFieldBonuses(player);
  applySkillTreeUniqueFlagEffects(player);
  applySkillTreeRunModifiers(player);
}

// Phase 8b-uniquefx — sums+clamps `uniqueField` bonuses (per classId+field,
// using THAT effect's own [min,max]) and adds the clamped total onto a
// per-instance shadow field on `player`. Never writes onto `player.def`:
// `player.def` is a direct reference to the shared CLASSES[classId] object
// (see entities.js's Player constructor), so mutating it would permanently
// corrupt that class for every future run/character. Only classes with a
// shadow field actually seeded in the Player constructor (see there) can be
// targeted meaningfully today — targeting an unshadowed field is a silent
// no-op (the field simply doesn't exist on player to add onto), which is
// intentional: a future content pass adding a shadow field is what "turns
// on" a new uniqueField target, per the pattern established here.
function applySkillTreeUniqueFieldBonuses(player){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const groups = {}; // key "classId|field" -> { sum, min, max }
  for (const n of SKILL_TREE_NODES) {
    if (!isSkillNodeOwned(unlocks, n.id)) continue;
    for (const eff of nodeEffects(n)) {
      if (eff.type !== 'uniqueField' || eff.classId !== player.classId) continue;
      const key = eff.classId + '|' + eff.field;
      const g = groups[key] || (groups[key] = { sum: 0, min: eff.min, max: eff.max });
      g.sum += eff.amount;
      // every contributing effect is required to carry its own min/max; use
      // the tightest bounds seen across contributing effects for this key
      if (eff.min > g.min) g.min = eff.min;
      if (eff.max < g.max) g.max = eff.max;
    }
  }
  // Bug fix: recalcPlayerStats (and therefore this function) runs many times
  // per run — every item/pill/star/familiar pickup, not just once at spawn
  // (see call sites in game.js/items-2.js/pills.js/stars.js/familiars.js/
  // combat-2.js). A plain `player[field] += bonus` here would re-add the
  // same skill-tree bonus on every one of those calls, compounding it over
  // the run instead of applying it once. Fix: capture each field's PRISTINE
  // (pre-bonus) value the first time it's ever seen, on a dedicated shadow
  // map, and always recompute `player[field] = base + clampedBonus` from
  // that captured base — never accumulate onto the field's current value.
  if (!player._skillTreeFieldBase) player._skillTreeFieldBase = {};
  for (const key in groups) {
    const field = key.split('|')[1];
    if (typeof player[field] !== 'number') continue; // no shadow field seeded for this class/field yet — no-op
    if (!(field in player._skillTreeFieldBase)) player._skillTreeFieldBase[field] = player[field];
    const g = groups[key];
    player[field] = player._skillTreeFieldBase[field] + Util.clamp(g.sum, g.min, g.max);
  }
}

// Phase 8b-uniquefx — grants a whole borrowed mechanic flag: if any owned
// node for player.classId has a uniqueFlag effect, force player[field] =
// value. Runs as the LAST step of applySkillTreeStatBonuses (itself the
// last statement of recalcPlayerStats), so it can override a class's own
// `def`-derived flag or grant one the class's def never sets at all (e.g.
// giving Earth Pony access to shockwaveAttack, a mechanic her class doesn't
// natively have but whose dispatch code checks `player.shockwaveAttack`
// generically regardless of class).
function applySkillTreeUniqueFlagEffects(player){
  const unlocks = ensureUnlockShape(loadUnlocks());
  for (const n of SKILL_TREE_NODES) {
    if (!isSkillNodeOwned(unlocks, n.id)) continue;
    for (const eff of nodeEffects(n)) {
      if (eff.type === 'uniqueFlag' && eff.classId === player.classId) player[eff.field] = eff.value;
    }
  }
}

// Engine expansion pass — a generic namespaced key/value bag for future
// systems, distinct from uniqueFlag (which only ever sets a real, already-
// existing player field by name). Rebuilt fresh every call (like every
// other apply* function here, all called every recalcPlayerStats), so a
// key never lingers after its granting node is sold — see sellSkillNode.
// `player.skillTreeMods` is created once and then cleared+refilled in
// place rather than reassigned to a new object, so any external code that
// captured a reference to it keeps seeing live data.
function applySkillTreeRunModifiers(player){
  const unlocks = ensureUnlockShape(loadUnlocks());
  if (!player.skillTreeMods) player.skillTreeMods = {};
  else for (const k in player.skillTreeMods) delete player.skillTreeMods[k];
  for (const n of SKILL_TREE_NODES) {
    if (!isSkillNodeOwned(unlocks, n.id)) continue;
    for (const eff of nodeEffects(n)) {
      if (eff.type === 'runModifier' && eff.classId === player.classId) player.skillTreeMods[eff.key] = eff.value;
    }
  }
}

// called from room.js's reward-pool call sites (Util.weighted(pool) ->
// Util.weighted(applySkillTreePoolNudge(pool, 'PoolName'))). Returns the
// exact same array reference, unmodified, when no owned node targets
// `poolName` — see achievements/skilltree-general.js (Phase 8d) for the 25
// general-upgrade nodes that now target several of these pools.
function applySkillTreePoolNudge(pool, poolName){
  const unlocks = ensureUnlockShape(loadUnlocks());
  let out = null;
  for (const n of SKILL_TREE_NODES) {
    if (!isSkillNodeOwned(unlocks, n.id)) continue;
    for (const eff of nodeEffects(n)) {
      if (eff.type !== 'poolWeight' || eff.pool !== poolName) continue;
      if (!out) out = pool.map(e => ({ id:e.id, w:e.w }));
      const entry = out.find(e => e.id === eff.id);
      if (entry) entry.w += eff.bonus;
    }
  }
  return out || pool;
}

// called from game.js's startRun, right after `new Player(classId)`
function applySkillTreeStartingPickups(player){
  const unlocks = ensureUnlockShape(loadUnlocks());
  for (const n of SKILL_TREE_NODES) {
    if (!isSkillNodeOwned(unlocks, n.id)) continue;
    for (const eff of nodeEffects(n)) {
      if (eff.type !== 'startingPickup') continue;
      const field = { bombs:'bombs', keys:'keys', coins:'coins', blue:'blueCurrent' }[eff.pickup];
      if (field && typeof player[field] === 'number') player[field] += eff.amount;
    }
  }
}

// ---------------------------------------------------------------------------
// Visual tree layout (Phase 8b-visual). Pure function, no DOM: takes the
// module-level SKILL_TREE_NODES (or an equivalent array passed in for test
// harnesses) and returns a tidy-tree layout — one {x,y} slot per node (x/y
// in abstract column/row units, not pixels) plus the parent->child edge
// list. A general Reingold-Tilford-style algorithm: any node may have any
// number of children, and children may themselves branch arbitrarily deep —
// today's data is only 2 levels (start -> 27 hubs) but later phases will
// append 3-5+ level branching subtrees under each hub without this function
// needing to change.
function computeSkillTreeLayout(nodes){
  nodes = nodes || SKILL_TREE_NODES;
  const byId = {};
  for (const n of nodes) byId[n.id] = n;
  const childrenOf = {};
  let root = null;
  for (const n of nodes) {
    if (n.parent == null) { root = n.id; continue; }
    (childrenOf[n.parent] || (childrenOf[n.parent] = [])).push(n.id);
  }
  const positions = {};
  let nextColumn = 0;
  // Post-order: assign each leaf the next free column; each internal node's
  // x is the average of its children's x; subtree width = sum of children's
  // widths (min 1). Depth (y) is tracked top-down as we recurse.
  function place(id, depth){
    const kids = childrenOf[id];
    if (!kids || kids.length === 0) {
      const x = nextColumn++;
      positions[id] = { x, y: depth };
      return x;
    }
    let sum = 0;
    for (const kidId of kids) sum += place(kidId, depth + 1);
    const x = sum / kids.length;
    positions[id] = { x, y: depth };
    return x;
  }
  if (root != null) place(root, 0);
  const edges = [];
  for (const n of nodes) {
    if (n.parent != null) edges.push({ from: n.parent, to: n.id });
  }
  return { positions, edges };
}

// Pixel-space constants for the renderer below.
const SKILL_TREE_COLUMN_WIDTH = 130;
// Row height has extra headroom vs. SKILL_TREE_NODE_SIZE beyond just visual
// spacing: each node's name renders as a label BELOW the circle (see
// .skilltree-node-label), so the gap between rows also has to fit that
// label's text.
const SKILL_TREE_ROW_HEIGHT = 130;
const SKILL_TREE_NODE_SIZE = 74; // width == height — the node button is a true circle
const SKILL_TREE_PADDING = 50;
// Extra bottom margin so the last row's below-circle label isn't clipped by
// the canvas's own computed height.
const SKILL_TREE_BOTTOM_LABEL_ROOM = 40;

// Pan+zoom state (Phase 8b-visual, persisted per Phase-8f camera fix): a
// single CSS `transform: translate(panX,panY) scale(zoom)` on the canvas,
// entirely replacing native scrolling (.skilltree-scroll is overflow:hidden
// — see style.css) so translate/scale are the only thing ever positioning
// the canvas; no native scroll offset to fight with. These live at module
// scope (not as locals inside buildSkillTreePanel) so a purchase-triggered
// rebuild — buildSkillTreePanel() called again from the buy-button handler
// below — reuses wherever the player last panned/zoomed to instead of
// snapping back to the default view. `null` is the "unset" sentinel: only
// when zoom is still null does buildSkillTreePanel compute+apply the
// default centered-on-`start` view. Call resetSkillTreeCamera() (wired from
// main.js's openOverlay call sites) to restore that sentinel on a genuine
// fresh panel OPEN, as opposed to an internal rebuild.
let skillTreeZoom = null;
let skillTreePanX = 0, skillTreePanY = 0;
// Id of the node most recently bought this panel-session, so
// buildSkillTreePanel can give the freshly-created button for it a one-shot
// "just bought" flash animation (see .skilltree-node.just-bought in
// style.css) — cleared on a genuine fresh open so it never replays a stale
// flash from before the panel was last closed.
let skillTreeLastBoughtId = null;
// Which node filter is currently active (toolbar buttons below the search
// row) — persists across a rebuild the same way pan/zoom/search do, so
// buying a node or panning doesn't silently reset the filter the player
// picked. Non-matching nodes stay in the DOM (still take their layout slot,
// edges still draw) but get `.dimmed` instead of being removed, so the tree
// shape never jumps around just because a filter is on.
let skillTreeFilter = 'all';
// Whether #skillTreeOverviewPanel is currently expanded — persists across a
// rebuild the same way the filter does, so a purchase made while it's open
// doesn't silently close it.
let skillTreeOverviewOpen = false;
// Live reference to the CURRENT build's applyTransform closure, so a
// document-independent keyboard handler (bound once, see
// bindSkillTreeKeyboardNav below) can always reach whichever build is
// presently on screen without re-binding a fresh listener on every rebuild
// (which would stack duplicate handlers and make panning accelerate).
let skillTreeApplyTransform = null;
function resetSkillTreeCamera(){
  skillTreeZoom = null;
  skillTreePanX = 0;
  skillTreePanY = 0;
  skillTreeLastBoughtId = null;
}

// Human-readable one-line summary of a single effect object, used by the
// detail panel (showSkillNodeDetail) so a node's full mechanical effect is
// readable without parsing raw data. Percent-style fields (everything in
// SKILL_TREE_STAT_FIELDS) render as a signed percentage; uniqueField/
// uniqueFlag effects describe themselves in plain terms.
// uniqueField targets are NOT uniformly percentages — unlike SKILL_TREE_STAT_FIELDS
// (always a %-of-base multiplier or an additive probability), a uniqueField's
// `amount` is whatever unit that specific shadow field on `player` happens to
// use: damageTakenMult/rockCoinChance/turretDamageMult/fireZoneRootMult really
// are percentage-style multipliers, but baseRangeTiles is tiles,
// crystalVolleySpacing/radius/fireZoneRadius/fireZoneRange/fireRingRadius/
// changelingMinionRadius are pixels, chargeTime/changelingSummonCooldown are
// seconds, changelingMinionDmg is flat damage, and maxTurrets/
// maxChangelingMinions/crystalShardCount are plain counts (see each field's
// own comment where it's seeded in entities.js). Table below drives
// formatUniqueFieldAmount so every one of these renders in its OWN real
// unit instead of every uniqueField effect being mislabeled as a percentage.
const SKILL_TREE_UNIQUE_FIELD_UNITS = {
  damageTakenMult: 'percent', rockCoinChance: 'percent', turretDamageMult: 'percent', fireZoneRootMult: 'percent',
  baseRangeTiles: 'tiles', crystalVolleySpacing: 'px', chargeTime: 'seconds',
  fireRingRadius: 'px', fireZoneRadius: 'px', fireZoneRange: 'px', radius: 'px', changelingMinionRadius: 'px',
  changelingSummonCooldown: 'seconds', changelingMinionDmg: 'dmg',
  maxTurrets: 'count', maxChangelingMinions: 'count', crystalShardCount: 'count',
};
function formatUniqueFieldAmount(field, amount){
  const unit = SKILL_TREE_UNIQUE_FIELD_UNITS[field] || 'raw';
  if (unit === 'percent') {
    const pct = Math.round(amount * 1000) / 10;
    return (pct >= 0 ? '+' : '') + pct + '%';
  }
  const rounded = Math.round(amount * 100) / 100;
  const sign = rounded >= 0 ? '+' : '';
  if (unit === 'tiles') return sign + rounded + ' tiles';
  if (unit === 'px') return sign + rounded + ' px';
  if (unit === 'seconds') return sign + rounded + 's';
  if (unit === 'dmg') return sign + rounded + ' dmg';
  return sign + rounded; // 'count' and unrecognized fields — a plain signed number, no invented unit
}

function describeSkillEffect(eff){
  if (eff.type === 'stat') {
    const pct = Math.round(eff.amount * 1000) / 10; // one decimal, e.g. 4.5%
    const sign = pct >= 0 ? '+' : '';
    return sign + pct + '% ' + eff.stat;
  }
  if (eff.type === 'uniqueField') {
    return formatUniqueFieldAmount(eff.field, eff.amount) + ' ' + eff.field + ' (unique)';
  }
  if (eff.type === 'uniqueFlag') return 'Grants ' + eff.field;
  if (eff.type === 'unlock') return 'Unlocks ' + eff.category + ': ' + eff.id;
  if (eff.type === 'poolWeight') return 'Nudges ' + eff.pool + ' pool weighting';
  if (eff.type === 'startingPickup') return '+' + eff.amount + ' starting ' + eff.pickup;
  if (eff.type === 'globalStat') {
    const pct = Math.round(eff.amount * 1000) / 10;
    const sign = pct >= 0 ? '+' : '';
    return sign + pct + '% ' + eff.stat + ' (every character)';
  }
  if (eff.type === 'runModifier') return 'Sets ' + eff.key + ' = ' + eff.value;
  return eff.type;
}

// Second line under a 'stat' effect row — the CURRENT summed total for that
// (classId, stat) pair across every owned node (already includes this
// node's own contribution if it's owned), against its cap, so the player
// can see at a glance how close a stat is to `SKILL_TREE_STAT_CAP` (or its
// override) without hunting through every other node that touches it.
// Returns null for non-'stat' effect types (uniqueField has its own
// per-key [min,max] window instead of a flat cap, and isn't worth the same
// treatment here since it's already stated as an absolute in its own row).
// `node` is optional (older call sites can omit it) — when given AND not
// yet owned, this also projects what the total would become if bought:
// sums every OWNED node's raw (unclamped) contribution for the same
// (classId, stat) pair, adds this node's own `eff.amount`, then clamps —
// the exact same raw-sum-then-clamp order getSkillTreeStatBonus itself
// uses, so the projection can never disagree with what actually happens
// after the purchase. Flags the "would be wasted" case explicitly (the
// projected total doesn't move past the current one) so the player isn't
// surprised to find a stat already maxed out only after spending the point.
function describeSkillEffectTotal(unlocks, eff, node){
  if (eff.type === 'stat') return describeStatTotal(unlocks, eff, node);
  if (eff.type === 'uniqueField') return describeUniqueFieldTotal(unlocks, eff, node);
  return null;
}
function describeStatTotal(unlocks, eff, node){
  const cap = SKILL_TREE_STAT_CAP_OVERRIDES[eff.stat] != null ? SKILL_TREE_STAT_CAP_OVERRIDES[eff.stat] : SKILL_TREE_STAT_CAP;
  const capPct = Math.round(cap * 1000) / 10;
  const current = getSkillTreeStatBonus(unlocks, eff.classId, eff.stat);
  const curPct = Math.round(current * 1000) / 10;
  const owned = node && isSkillNodeOwned(unlocks, node.id);
  if (owned) return 'Current total: ' + curPct + '% / ' + capPct + '% cap';
  let rawTotal = 0;
  for (const n of SKILL_TREE_NODES) {
    if (!isSkillNodeOwned(unlocks, n.id)) continue;
    for (const e of nodeEffects(n)) {
      if (e.type === 'stat' && e.classId === eff.classId && e.stat === eff.stat) rawTotal += e.amount;
    }
  }
  rawTotal += eff.amount;
  const afterPct = Math.round(Util.clamp(rawTotal, -cap, cap) * 1000) / 10;
  if (afterPct === curPct) return 'Current total: ' + curPct + '% / ' + capPct + '% cap (already at cap — this would add nothing)';
  return 'Current: ' + curPct + '% → after buying: ' + afterPct + '% / ' + capPct + '% cap';
}
// Mirrors describeStatTotal but for a uniqueField effect: there's no flat
// cap here — applySkillTreeUniqueFieldBonuses clamps to the TIGHTEST
// [min,max] window seen across every contributing node for this
// (classId, field) pair (see that function's own comment in skilltree.js),
// so this recomputes that same tightest window (starting from THIS effect's
// own min/max, exactly like the real function does) rather than assuming
// every contributing node shares identical bounds.
function describeUniqueFieldTotal(unlocks, eff, node){
  let sum = 0, min = eff.min, max = eff.max;
  for (const n of SKILL_TREE_NODES) {
    if (!isSkillNodeOwned(unlocks, n.id)) continue;
    for (const e of nodeEffects(n)) {
      if (e.type !== 'uniqueField' || e.classId !== eff.classId || e.field !== eff.field) continue;
      sum += e.amount;
      if (e.min > min) min = e.min;
      if (e.max < max) max = e.max;
    }
  }
  const owned = node && isSkillNodeOwned(unlocks, node.id);
  const curClamped = Util.clamp(sum, min, max);
  const fmt = (v) => formatUniqueFieldAmount(eff.field, v).replace(/^\+/, ''); // total lines show bare magnitude, not a leading '+'
  if (owned) return 'Current total: ' + fmt(curClamped);
  const afterClamped = Util.clamp(sum + eff.amount, min, max);
  if (afterClamped === curClamped) return 'Current total: ' + fmt(curClamped) + ' (already at its limit — this would add nothing)';
  return 'Current: ' + fmt(curClamped) + ' → after buying: ' + fmt(afterClamped);
}

// Populates #skillTreeDetailPanel from a node (or hides it when passed
// null). Called on hover/click from the per-node listeners in
// buildSkillTreePanel below; not tied to any one build's closures so it's
// safe to call from anywhere once the panel DOM exists.
function showSkillNodeDetail(node){
  const panel = document.getElementById('skillTreeDetailPanel');
  if (!panel) return;
  if (!node) { panel.classList.add('hidden'); return; }
  const unlocks = ensureUnlockShape(loadUnlocks());
  const nameEl = document.getElementById('skillTreeDetailName');
  const costEl = document.getElementById('skillTreeDetailCost');
  const descEl = document.getElementById('skillTreeDetailDesc');
  const effEl = document.getElementById('skillTreeDetailEffects');
  if (nameEl) nameEl.textContent = node.name + (node.cursed ? ' ☠' : '') + (/_capstone$/.test(node.id) ? ' ♛' : '') + (/_ascension$/.test(node.id) ? ' ⚡' : '');
  if (costEl) costEl.textContent = node.cost ? node.cost + ' pt' : 'Free';
  if (descEl) descEl.textContent = node.desc || '';
  if (effEl) {
    effEl.innerHTML = '';
    const effs = nodeEffects(node);
    for (const eff of effs) {
      const row = document.createElement('div');
      row.className = 'skilltree-detail-effect-row';
      row.textContent = describeSkillEffect(eff);
      const totalNote = describeSkillEffectTotal(unlocks, eff, node);
      if (totalNote) {
        const sub = document.createElement('span');
        sub.className = 'skilltree-detail-effect-total';
        sub.textContent = totalNote;
        row.appendChild(sub);
      }
      effEl.appendChild(row);
    }
    if (!effs.length) {
      const row = document.createElement('div');
      row.className = 'skilltree-detail-effect-row';
      row.textContent = 'No direct effect — unlocks its children.';
      effEl.appendChild(row);
    }
  }
  panel.classList.remove('hidden');
  panel.classList.toggle('detail-cursed', !!node.cursed);
  panel.classList.toggle('detail-owned', isSkillNodeOwned(unlocks, node.id));
}

// Bound exactly once (module-level guard) rather than once per
// buildSkillTreePanel call — a listener on `document` would otherwise stack
// a fresh copy every rebuild (every purchase triggers one) and panning
// would silently accelerate. Reads skillTreeApplyTransform/skillTreePanX/Y/
// skillTreeZoom live, so it always affects whichever build is currently on
// screen. No-ops entirely whenever the skill tree screen isn't open, or
// while the player is typing in the search box.
let skillTreeKeyboardBound = false;
function bindSkillTreeKeyboardNav(){
  if (skillTreeKeyboardBound) return;
  skillTreeKeyboardBound = true;
  const PAN_STEP = 60;
  document.addEventListener('keydown', (e) => {
    const screen = document.getElementById('skillTreeScreen');
    if (!screen || screen.classList.contains('hidden')) return;
    if (!skillTreeApplyTransform || skillTreeZoom == null) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    // Escape closes the build overview panel if it's open — mirrors the
    // search box's own Escape-to-clear behavior (that one's handled locally
    // on the input, since it needs the input focused; this one fires from
    // anywhere on the screen since the overview panel has no input to focus).
    if (e.key === 'Escape') {
      if (skillTreeOverviewOpen) {
        skillTreeOverviewOpen = false;
        const panel = document.getElementById('skillTreeOverviewPanel');
        if (panel) panel.classList.add('hidden');
      }
      return;
    }
    let handled = true;
    if (e.key === 'ArrowLeft') skillTreePanX += PAN_STEP;
    else if (e.key === 'ArrowRight') skillTreePanX -= PAN_STEP;
    else if (e.key === 'ArrowUp') skillTreePanY += PAN_STEP;
    else if (e.key === 'ArrowDown') skillTreePanY -= PAN_STEP;
    else if (e.key === '+' || e.key === '=') skillTreeStepZoomAtCenter(1);
    else if (e.key === '-' || e.key === '_') skillTreeStepZoomAtCenter(-1);
    else handled = false;
    if (handled) { e.preventDefault(); skillTreeApplyTransform(); }
  });
}
// Shared by the keyboard +/- handler above; zooms toward the CENTER of the
// current viewport (the scroller's own clientWidth/Height, read fresh each
// call so this stays correct across a rebuild) rather than the cursor —
// there's no cursor position to anchor to from a keypress. Uses the same
// [0.4, 2] range / 0.1 step as the wheel-zoom handler in
// buildSkillTreePanel so keyboard and mouse zoom feel identical.
function skillTreeStepZoomAtCenter(dir){
  const scroller = document.querySelector('#skillTreeList .skilltree-scroll');
  const viewportW = (scroller && scroller.clientWidth) || 800;
  const viewportH = (scroller && scroller.clientHeight) || 600;
  const newZoom = Util.clamp(skillTreeZoom + dir * 0.1, 0.4, 2);
  if (newZoom === skillTreeZoom) return;
  const worldX = (viewportW / 2 - skillTreePanX) / skillTreeZoom;
  const worldY = (viewportH / 2 - skillTreePanY) / skillTreeZoom;
  skillTreePanX = viewportW / 2 - worldX * newZoom;
  skillTreePanY = viewportH / 2 - worldY * newZoom;
  skillTreeZoom = newZoom;
}

function buildSkillTreePanel(){
  const wrap = document.getElementById('skillTreeList');
  if (!wrap) return;
  wrap.innerHTML = '';
  const unlocks = ensureUnlockShape(loadUnlocks());
  const summaryEl = document.getElementById('skillTreeSummary');
  const ownedCount = Object.keys(unlocks.skillTree.unlockedNodes).length + 1; // +1 for the free start node
  if (summaryEl) {
    summaryEl.textContent = unlocks.skillTree.points + ' points available — ' + ownedCount + ' / ' + SKILL_TREE_NODES.length + ' nodes unlocked'
      + (unlocks.skillTree.lifetimeEarned ? ' — ' + unlocks.skillTree.lifetimeEarned + ' lifetime earned' : '');
  }

  // Fog of war: a node is only ever considered if it's owned, or its direct
  // parent is owned (i.e. it's the frontier the player can currently see/
  // buy into). Everything deeper stays completely out of the picture — not
  // just unrendered, but never even given LAYOUT SPACE — until its own
  // parent is bought, at which point it pops into view on the next rebuild
  // (buySkillNode always triggers one). `start` and the hub nodes
  // (parent:'start', always owned) are therefore always visible.
  //
  // Every visible node's parent is guaranteed to ALSO be visible (owned
  // nodes can only ever have owned parents, since buying requires the
  // parent to already be owned, and nothing is ever un-owned) — so this
  // filtered list is a well-formed sub-forest on its own, safe to hand
  // straight to computeSkillTreeLayout instead of the full 2000+-node tree.
  // That's what actually condenses the canvas: laying out only the visible
  // set means a node whose real children are all still fogged gets treated
  // as a LEAF for column-width purposes (computeSkillTreeLayout only knows
  // about the children it was given), instead of silently reserving empty
  // horizontal space for a whole hidden subtree the way laying out the full
  // tree and then hiding nodes at render time used to.
  function isVisible(nodeId){
    if (isSkillNodeOwned(unlocks, nodeId)) return true;
    const node = SKILL_TREE_NODES_BY_ID[nodeId];
    return !!(node && node.parent && isSkillNodeOwned(unlocks, node.parent));
  }
  const visibleNodes = SKILL_TREE_NODES.filter(n => isVisible(n.id));

  const { positions, edges } = computeSkillTreeLayout(visibleNodes);
  let maxX = 0, maxY = 0;
  for (const id in positions) {
    const p = positions[id];
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const toPx = (p) => ({
    left: SKILL_TREE_PADDING + p.x * SKILL_TREE_COLUMN_WIDTH,
    top: SKILL_TREE_PADDING + p.y * SKILL_TREE_ROW_HEIGHT,
  });
  const canvasW = SKILL_TREE_PADDING * 2 + maxX * SKILL_TREE_COLUMN_WIDTH + SKILL_TREE_NODE_SIZE;
  const canvasH = SKILL_TREE_PADDING * 2 + maxY * SKILL_TREE_ROW_HEIGHT + SKILL_TREE_NODE_SIZE + SKILL_TREE_BOTTOM_LABEL_ROOM;

  const scroller = document.createElement('div');
  scroller.className = 'skilltree-scroll';
  const canvas = document.createElement('div');
  canvas.className = 'skilltree-canvas';
  canvas.style.width = canvasW + 'px';
  canvas.style.height = canvasH + 'px';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'skilltree-svg');
  svg.setAttribute('width', canvasW);
  svg.setAttribute('height', canvasH);
  for (const edge of edges) {
    // edges already only connects nodes within visibleNodes — see above —
    // so no isVisible re-check is needed here any more.
    const from = positions[edge.from], to = positions[edge.to];
    if (!from || !to) continue;
    const fromPx = toPx(from), toPx2 = toPx(to);
    const x1 = fromPx.left + SKILL_TREE_NODE_SIZE / 2;
    const y1 = fromPx.top + SKILL_TREE_NODE_SIZE;
    const x2 = toPx2.left + SKILL_TREE_NODE_SIZE / 2;
    const y2 = toPx2.top;
    const owned = isSkillNodeOwned(unlocks, edge.to);
    const toNode = SKILL_TREE_NODES_BY_ID[edge.to];
    const toCursed = !!(toNode && toNode.cursed);
    // Soft S-curve (single cubic bezier, control points pulled halfway down
    // between the two nodes) instead of a straight line — reads as a more
    // organic "branch" than a ruler-straight connector, and incidentally
    // makes it easier to visually trace one specific lineage through a
    // crowded cluster of siblings than dead-straight lines converging on the
    // same point would.
    const midY = (y1 + y2) / 2;
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + midY + ', ' + x2 + ' ' + midY + ', ' + x2 + ' ' + y2);
    path.setAttribute('fill', 'none');
    path.setAttribute('class', 'skilltree-edge' + (owned ? ' owned' : '') + (toCursed ? ' to-cursed' : ''));
    svg.appendChild(path);
  }
  canvas.appendChild(svg);

  // Collected alongside the main render loop below (same visible set, same
  // per-node state) and consumed by drawMinimap() further down — avoids a
  // second full pass just for the minimap.
  const minimapPoints = [];

  for (const node of visibleNodes) {
    const pos = positions[node.id];
    if (!pos) continue; // shouldn't happen — every visibleNodes entry gets a position — defensive only
    const px = toPx(pos);
    const owned = isSkillNodeOwned(unlocks, node.id);
    // "buyable" used to mean just "parent owned" and lumped together both
    // "you can afford this right now" and "you can't afford this yet" under
    // one dim gray look — indistinguishable from a node you hadn't reached
    // at all. Now that unreached nodes are hidden entirely (fog of war,
    // above), split the remaining not-yet-owned/visible case into
    // affordable (real buyable state) vs. revealed-but-too-expensive, so the
    // player can tell "I can't afford this yet" apart from "I haven't
    // unlocked this yet" at a glance.
    const parentOwned = owned || !node.parent || isSkillNodeOwned(unlocks, node.parent);
    const affordable = !owned && parentOwned && canBuySkillNode(unlocks, node.id);
    const unaffordable = !owned && parentOwned && !affordable;
    const cursed = !!node.cursed;
    // Capstone nodes (achievements/skilltree-capstones.js — one per
    // character, cost 3, always the deepest leaf of that character's tree)
    // are id-tagged rather than flagged with their own field, so this is the
    // one place that needs to recognize them: the `_capstone` id suffix is
    // authored by buildCapstoneNodes() and never reused elsewhere.
    const isCapstone = /_capstone$/.test(node.id);
    // Ascension nodes (achievements/skilltree-ascensions.js — one per
    // character, cost 5, always the direct child of that character's own
    // capstone) get the same id-suffix recognition treatment as capstones.
    const isAscension = /_ascension$/.test(node.id);
    const sellable = owned && canSellSkillNode(unlocks, node.id);
    const filterState = owned ? 'owned' : affordable ? 'buyable' : 'unaffordable';
    const isUniqueMechanic = nodeEffects(node).some(e => e.type === 'uniqueField' || e.type === 'uniqueFlag');
    // The "Capstone" filter button deliberately also matches Ascension nodes
    // — both read as "endgame" content to a player filtering for them, and
    // splitting them into two separate filter buttons for 25+25 nodes out
    // of 2350+ wasn't worth the extra toolbar clutter.
    const matchesFilter = skillTreeFilter === 'all'
      || skillTreeFilter === filterState
      || (skillTreeFilter === 'cursed' && cursed)
      || (skillTreeFilter === 'unique' && isUniqueMechanic)
      || (skillTreeFilter === 'capstone' && (isCapstone || isAscension));
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'skilltree-node'
      + (owned ? ' owned' : affordable ? ' buyable' : unaffordable ? ' unaffordable' : '')
      + (cursed ? ' cursed' : '')
      + (isCapstone ? ' capstone' : '')
      + (isAscension ? ' ascension' : '')
      + (sellable ? ' sellable' : '')
      + (matchesFilter ? '' : ' dimmed')
      + (node.id === skillTreeLastBoughtId ? ' just-bought' : '');
    el.style.left = px.left + 'px';
    el.style.top = px.top + 'px';
    el.style.width = SKILL_TREE_NODE_SIZE + 'px';
    el.style.height = SKILL_TREE_NODE_SIZE + 'px';
    // A node whose effects include uniqueField/uniqueFlag changes HOW the
    // character plays (a new ability, a tuned-up mechanic) rather than just
    // nudging a stat — worth flagging visually so it stands out from the
    // sea of plain stat nodes across a 2000+-node tree.
    el.title = node.name + (node.cost ? ' (' + node.cost + ' pt)' : '') + ' — ' + node.desc
      + (unaffordable ? ' [need ' + node.cost + ' pt, have ' + unlocks.skillTree.points + ']' : '')
      + (cursed ? ' [CURSED — permanent drawback]' : '')
      + (isUniqueMechanic ? ' [unique mechanic]' : '')
      + (sellable ? ' [click to sell back for ' + node.cost + ' pt]' : '');
    // The circle itself only holds a compact one-letter glyph (most node
    // names are too long to fit legibly inside a 74px circle); the full
    // name renders as a label pinned just below the circle instead.
    const glyph = document.createElement('span');
    glyph.className = 'skilltree-node-glyph';
    glyph.textContent = isAscension ? '⚡' : isCapstone ? '♛' : (node.name || '?').trim().charAt(0).toUpperCase();
    el.appendChild(glyph);
    if (node.cost) {
      const costBadge = document.createElement('span');
      costBadge.className = 'skilltree-node-cost'; // reddened via the .unaffordable ancestor selector in style.css
      costBadge.textContent = node.cost;
      el.appendChild(costBadge);
    }
    if (isUniqueMechanic) {
      const uniqueBadge = document.createElement('span');
      uniqueBadge.className = 'skilltree-node-unique';
      uniqueBadge.textContent = '✦'; // ✦ four-pointed star — "this changes how you play"
      el.appendChild(uniqueBadge);
    }
    if (sellable) {
      // Bottom-right corner — the two other corners already carry the cost
      // badge (top-right) and unique badge (top-left), and bottom-center is
      // where the name label attaches, so this is the one free corner.
      const refundBadge = document.createElement('span');
      refundBadge.className = 'skilltree-node-refund';
      refundBadge.textContent = '↩';
      el.appendChild(refundBadge);
    }
    const label = document.createElement('span');
    label.className = 'skilltree-node-label';
    label.textContent = node.name;
    el.appendChild(label);
    if (affordable) {
      el.addEventListener('click', () => {
        if (buySkillNode(node.id)) {
          Sound.play(isAscension ? 'ascensionChime' : isCapstone ? 'achievement' : 'shopBuy');
          skillTreeLastBoughtId = node.id;
          buildSkillTreePanel();
        }
      });
    } else if (sellable) {
      // Native confirm() dialog rather than a custom pinned popover —
      // sidesteps every hover/mouseleave-timing headache a bespoke confirm
      // UI would introduce (see showSkillNodeDetail's own mouseleave
      // handling above) for an action that's rare and deliberately
      // shouldn't be a single accidental click away.
      el.disabled = false;
      el.addEventListener('click', () => {
        if (!confirm('Sell "' + node.name + '" back for ' + node.cost + ' point' + (node.cost === 1 ? '' : 's') + '?')) return;
        if (sellSkillNode(node.id)) { Sound.play('coin'); buildSkillTreePanel(); }
        else Sound.play('uiDeny');
      });
    } else {
      el.disabled = !owned; // owned-but-not-sellable nodes stay clickable-looking but inert
    }
    // Detail panel — every node, regardless of state, shows its full
    // name/cost/desc/effect breakdown on hover (and stays pinned on click,
    // since `disabled` buttons don't fire mouse events reliably in every
    // browser — the button itself already handles the buy click above for
    // affordable nodes, so this listener is purely additive).
    el.addEventListener('mouseenter', () => showSkillNodeDetail(node));
    el.dataset.nodeId = node.id;
    canvas.appendChild(el);
    minimapPoints.push({
      x: px.left + SKILL_TREE_NODE_SIZE / 2,
      y: px.top + SKILL_TREE_NODE_SIZE / 2,
      state: owned ? 'owned' : affordable ? 'buyable' : 'unaffordable',
      cursed,
      endgame: isCapstone || isAscension,
      endgameColor: isAscension ? '#4fd8ff' : '#e3c15d',
    });
  }

  scroller.appendChild(canvas);
  wrap.appendChild(scroller);

  // Pan+zoom: see the module-level skillTreeZoom/skillTreePanX/skillTreePanY
  // declaration above for why these persist across an internal rebuild
  // (triggered by a purchase) instead of resetting every call. Only compute
  // the default centered-on-'start' view when skillTreeZoom is still the
  // unset sentinel (null) — i.e. this is a genuinely fresh panel open (see
  // resetSkillTreeCamera, wired from main.js's openOverlay call sites) —
  // otherwise reuse whatever the player last panned/zoomed to.
  const SKILL_TREE_ZOOM_MIN = 0.4;
  const SKILL_TREE_ZOOM_MAX = 2;
  const SKILL_TREE_ZOOM_STEP = 0.1;
  const zoomReadoutEl = document.getElementById('skillTreeZoomReadout');
  function applyTransform(){
    canvas.style.transform = 'translate(' + skillTreePanX.toFixed(2) + 'px,' + skillTreePanY.toFixed(2) + 'px) scale(' + skillTreeZoom.toFixed(3) + ')';
    if (zoomReadoutEl) zoomReadoutEl.textContent = Math.round(skillTreeZoom * 100) + '%';
    drawMinimap();
  }
  // Published for the module-level keyboard handler (bound once, see
  // bindSkillTreeKeyboardNav) so it can always reach whichever build is
  // currently on screen.
  skillTreeApplyTransform = applyTransform;

  // ---- minimap: whole-tree overview + click-to-jump ----------------------
  // Static per node (world position + state) across a rebuild, so the only
  // thing that changes frame-to-frame is the viewport rectangle — but since
  // repaints only happen on rebuild/pan/zoom/drag (not continuously), just
  // redrawing everything each call is simplest and still cheap: the visible
  // (fog-of-war-filtered) point count is a few hundred at most, nowhere near
  // enough to matter for a 170x130 canvas.
  const minimapCanvas = document.getElementById('skillTreeMinimap');
  const minimapCtx = minimapCanvas && minimapCanvas.getContext && minimapCanvas.getContext('2d');
  const MINIMAP_COLORS = { owned:'#e3c15d', buyable:'#8b5cf6', unaffordable:'#6b6b78' };
  let minimapScale = 1, minimapOffsetX = 0, minimapOffsetY = 0;
  function drawMinimap(){
    if (!minimapCtx) return;
    const mw = minimapCanvas.width, mh = minimapCanvas.height;
    minimapCtx.clearRect(0, 0, mw, mh);
    if (!canvasW || !canvasH) return;
    const pad = 8;
    minimapScale = Math.min((mw - pad * 2) / canvasW, (mh - pad * 2) / canvasH);
    minimapOffsetX = (mw - canvasW * minimapScale) / 2;
    minimapOffsetY = (mh - canvasH * minimapScale) / 2;
    for (const p of minimapPoints) {
      minimapCtx.fillStyle = MINIMAP_COLORS[p.state] || MINIMAP_COLORS.unaffordable;
      minimapCtx.beginPath();
      minimapCtx.arc(minimapOffsetX + p.x * minimapScale, minimapOffsetY + p.y * minimapScale,
        (p.cursed || p.endgame) ? 2.2 : 1.6, 0, Math.PI * 2);
      minimapCtx.fill();
      if (p.cursed) {
        minimapCtx.strokeStyle = '#ff4d4d';
        minimapCtx.lineWidth = 0.8;
        minimapCtx.stroke();
      } else if (p.endgame) {
        // Capstone/Ascension dots get their own colored ring (gold/cyan,
        // matching the node's own on-canvas palette) so a build's endpoints
        // are spottable on the minimap even at a zoomed-way-out glance.
        minimapCtx.strokeStyle = p.endgameColor;
        minimapCtx.lineWidth = 0.8;
        minimapCtx.stroke();
      }
    }
    // Viewport rectangle: invert the current pan/zoom to find which world
    // region the visible scroller area currently shows, in the same
    // world-pixel space `positions`/`toPx` already use — worldX = (screenX
    // - panX) / zoom, same inversion the wheel-zoom handler below already
    // relies on for its own cursor-anchoring math.
    const viewportW = scroller.clientWidth || canvasW;
    const viewportH = scroller.clientHeight || canvasH;
    const worldLeft = -skillTreePanX / skillTreeZoom;
    const worldTop = -skillTreePanY / skillTreeZoom;
    const worldW = viewportW / skillTreeZoom;
    const worldH = viewportH / skillTreeZoom;
    minimapCtx.strokeStyle = '#4fd8ff';
    minimapCtx.lineWidth = 1.2;
    minimapCtx.strokeRect(
      minimapOffsetX + worldLeft * minimapScale, minimapOffsetY + worldTop * minimapScale,
      worldW * minimapScale, worldH * minimapScale
    );
  }
  if (minimapCanvas) {
    minimapCanvas.onclick = (e) => {
      const rect = minimapCanvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (minimapCanvas.width / rect.width);
      const my = (e.clientY - rect.top) * (minimapCanvas.height / rect.height);
      if (!minimapScale) return;
      const worldX = (mx - minimapOffsetX) / minimapScale;
      const worldY = (my - minimapOffsetY) / minimapScale;
      Sound.play('uiClick');
      centerOnWorldPixel(worldX, worldY);
    };
  }

  if (skillTreeZoom == null) {
    skillTreeZoom = 1;
    skillTreePanX = 0;
    skillTreePanY = 0;
    const rootPos = positions['start'];
    if (rootPos) {
      const rootPx = toPx(rootPos);
      const rootCenterX = rootPx.left + SKILL_TREE_NODE_SIZE / 2;
      const viewportW = scroller.clientWidth || canvasW;
      skillTreePanX = viewportW / 2 - rootCenterX;
      skillTreePanY = 40 - rootPx.top; // small top margin so the root node isn't flush against the edge
    }
  }
  applyTransform();

  // ---- toolbar: jump-to-character dropdown + name/desc search -----------
  // Both live in index.html's #skillTreeToolbar (outside #skillTreeList, so
  // they survive innerHTML='' at the top of this function) and are rewired
  // fresh on every rebuild since `positions`/`canvas`/`scroller` are locals.
  function centerOnWorldPixel(worldX, worldY){
    const viewportW = scroller.clientWidth || canvasW;
    const viewportH = scroller.clientHeight || canvasH;
    skillTreePanX = viewportW / 2 - worldX * skillTreeZoom;
    skillTreePanY = viewportH / 2 - worldY * skillTreeZoom;
    applyTransform();
  }
  function centerOnNode(nodeId){
    const pos = positions[nodeId];
    if (!pos) return false;
    const px = toPx(pos);
    centerOnWorldPixel(px.left + SKILL_TREE_NODE_SIZE / 2, px.top + SKILL_TREE_NODE_SIZE / 2);
    return true;
  }

  const jumpSelect = document.getElementById('skillTreeJumpSelect');
  if (jumpSelect) {
    const prevValue = jumpSelect.value;
    jumpSelect.innerHTML = '<option value="">Jump to character…</option>';
    const classIds = Object.keys(CLASSES).sort((a, b) => (CLASSES[a].name || a).localeCompare(CLASSES[b].name || b));
    for (const classId of classIds) {
      // Per-character owned/total, shown right in the dropdown label so the
      // player can see at a glance which trees still have unspent room —
      // 'char_' + classId + '_' is a safe unambiguous prefix even for
      // classIds that are substrings of each other (e.g. changeling /
      // changelingqueen) because every real node id has an underscore
      // immediately after the classId, which a prefix match without that
      // trailing underscore would not require.
      const prefix = 'char_' + classId + '_';
      let owned = 0, total = 0;
      for (const n of SKILL_TREE_NODES) {
        if (n.id.indexOf(prefix) !== 0) continue;
        total++;
        if (isSkillNodeOwned(unlocks, n.id)) owned++;
      }
      const opt = document.createElement('option');
      opt.value = 'char_hub_' + classId;
      opt.textContent = (CLASSES[classId].name || classId) + (total ? ' (' + owned + '/' + total + ')' : '');
      jumpSelect.appendChild(opt);
    }
    jumpSelect.value = prevValue || '';
    jumpSelect.onchange = () => { if (jumpSelect.value) { Sound.play('uiClick'); centerOnNode(jumpSelect.value); } };
  }

  const recenterBtn = document.getElementById('skillTreeRecenterBtn');
  if (recenterBtn) recenterBtn.onclick = () => { Sound.play('uiClick'); centerOnNode('start'); };

  // ---- undo last purchase (Phase 11 item 4 QOL) --------------------------
  // One-click shortcut for "oops, wrong node" — just calls the SAME
  // sellSkillNode/canSellSkillNode a manual sell-back click already uses, on
  // skillTreeLastBoughtId (the id buySkillNode's own click handler above
  // already tracks for the "just bought" flash animation), so it inherits
  // every existing safety rule for free: only the untouched FRONTIER is
  // sellable (a node with an owned child can't be undone until that child is
  // sold first), and `{type:'unlock'}` grants (star/trinket/familiar/item)
  // are never sellable at all — see canSellSkillNode's own comment. No
  // confirm() dialog here (unlike the per-node sell-back button) since this
  // only ever targets the ONE node the player just bought a moment ago, not
  // an arbitrary deep node picked by mis-click. Disabled/hidden whenever
  // there's nothing eligible: no purchase yet this panel-session, the node
  // already has an owned child, or it was itself a no-refund unlock grant.
  const undoBtn = document.getElementById('skillTreeUndoBtn');
  if (undoBtn) {
    const undoable = !!skillTreeLastBoughtId && canSellSkillNode(unlocks, skillTreeLastBoughtId);
    undoBtn.classList.toggle('hidden', !undoable);
    undoBtn.disabled = !undoable;
    undoBtn.onclick = () => {
      if (!skillTreeLastBoughtId || !canSellSkillNode(unlocks, skillTreeLastBoughtId)) return;
      const undoneNode = SKILL_TREE_NODES_BY_ID[skillTreeLastBoughtId];
      if (sellSkillNode(skillTreeLastBoughtId)) {
        Sound.play('coin');
        skillTreeLastBoughtId = null;
        buildSkillTreePanel();
        showSkillNodeDetail(undoneNode || null);
      } else {
        Sound.play('uiDeny');
      }
    };
  }

  // ---- build overview: every character with >=1 owned node, most points
  // invested first. Rebuilt every call (cheap — one pass over 25 classes'
  // worth of nodes) so it always reflects the latest purchase/sale; open/
  // closed state persists via the module-level skillTreeOverviewOpen flag.
  const overviewPanel = document.getElementById('skillTreeOverviewPanel');
  const overviewList = document.getElementById('skillTreeOverviewList');
  const overviewBtn = document.getElementById('skillTreeOverviewBtn');
  const overviewCloseBtn = document.getElementById('skillTreeOverviewCloseBtn');
  if (overviewList) {
    overviewList.innerHTML = '';
    const rows = [];
    for (const classId in CLASSES) {
      const prefix = 'char_' + classId + '_';
      let owned = 0, total = 0, spent = 0, hasCapstone = false, hasAscension = false;
      for (const n of SKILL_TREE_NODES) {
        if (n.id.indexOf(prefix) !== 0) continue;
        total++;
        if (isSkillNodeOwned(unlocks, n.id)) {
          owned++;
          spent += n.cost || 0;
          if (/_capstone$/.test(n.id)) hasCapstone = true;
          if (/_ascension$/.test(n.id)) hasAscension = true;
        }
      }
      if (owned > 0) rows.push({ classId, owned, total, spent, hasCapstone, hasAscension });
    }
    rows.sort((a, b) => b.spent - a.spent);
    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'skilltree-overview-empty';
      empty.textContent = 'No nodes owned yet — spend a point to get started.';
      overviewList.appendChild(empty);
    } else {
      for (const r of rows) {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'skilltree-overview-row';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'skilltree-overview-name';
        nameSpan.textContent = (CLASSES[r.classId].name || r.classId) + (r.hasCapstone ? ' ♛' : '') + (r.hasAscension ? ' ⚡' : '');
        const statsSpan = document.createElement('span');
        statsSpan.className = 'skilltree-overview-stats';
        statsSpan.textContent = r.owned + '/' + r.total + ' · ' + r.spent + ' pt';
        row.appendChild(nameSpan);
        row.appendChild(statsSpan);
        row.addEventListener('click', () => { Sound.play('uiClick'); centerOnNode('char_hub_' + r.classId); });
        overviewList.appendChild(row);
      }
    }
  }
  if (overviewPanel) overviewPanel.classList.toggle('hidden', !skillTreeOverviewOpen);
  if (overviewBtn) overviewBtn.onclick = () => {
    Sound.play('uiClick');
    skillTreeOverviewOpen = !skillTreeOverviewOpen;
    if (overviewPanel) overviewPanel.classList.toggle('hidden', !skillTreeOverviewOpen);
  };
  if (overviewCloseBtn) overviewCloseBtn.onclick = () => {
    Sound.play('uiClick');
    skillTreeOverviewOpen = false;
    if (overviewPanel) overviewPanel.classList.add('hidden');
  };

  // ---- filter bar: dim everything except the selected state --------------
  // Rebuilds the whole panel on click (same pattern buySkillNode already
  // uses) rather than toggling `.dimmed` in place — simpler, and camera/
  // search state all persist across a rebuild already (module-level vars),
  // so nothing is lost by doing it this way.
  const filterBar = document.getElementById('skillTreeFilterBar');
  if (filterBar) {
    filterBar.querySelectorAll('.skilltree-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === skillTreeFilter);
      btn.onclick = () => { Sound.play('uiClick'); skillTreeFilter = btn.dataset.filter; buildSkillTreePanel(); };
    });
  }
  bindSkillTreeKeyboardNav();

  // Search only ever matches VISIBLE nodes — i.e. respects the same fog of
  // war as the render above, so searching can't be used to peek at content
  // behind an unbought parent.
  const searchInput = document.getElementById('skillTreeSearchInput');
  const searchCountEl = document.getElementById('skillTreeSearchCount');
  const searchPrevBtn = document.getElementById('skillTreeSearchPrevBtn');
  const searchNextBtn = document.getElementById('skillTreeSearchNextBtn');
  let searchMatches = [];
  let searchIndex = -1;
  function updateSearchUI(){
    canvas.querySelectorAll('.skilltree-node.search-match').forEach(el => el.classList.remove('search-match'));
    if (searchCountEl) searchCountEl.textContent = !searchMatches.length ? (searchInput && searchInput.value ? '0 / 0' : '') : (searchIndex + 1) + ' / ' + searchMatches.length;
    if (searchIndex >= 0) {
      const id = searchMatches[searchIndex];
      const el = canvas.querySelector('.skilltree-node[data-node-id="' + id + '"]');
      if (el) el.classList.add('search-match');
      centerOnNode(id);
    }
  }
  function runSearch(){
    const q = ((searchInput && searchInput.value) || '').trim().toLowerCase();
    if (!q) { searchMatches = []; searchIndex = -1; updateSearchUI(); return; }
    searchMatches = SKILL_TREE_NODES.filter(n => isVisible(n.id) &&
      (((n.name || '').toLowerCase().indexOf(q) !== -1) || ((n.desc || '').toLowerCase().indexOf(q) !== -1))
    ).map(n => n.id);
    searchIndex = searchMatches.length ? 0 : -1;
    updateSearchUI();
  }
  function stepSearch(dir){
    if (!searchMatches.length) return;
    searchIndex = (searchIndex + dir + searchMatches.length) % searchMatches.length;
    updateSearchUI();
  }
  if (searchInput) {
    searchInput.oninput = runSearch;
    if (searchInput.value) runSearch(); // re-run across a purchase-triggered rebuild
    // Enter/Shift+Enter step through matches without leaving the keyboard;
    // Escape clears the query and hands focus back to the canvas so the
    // player can immediately pan/zoom again.
    searchInput.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); stepSearch(e.shiftKey ? -1 : 1); }
      else if (e.key === 'Escape') { searchInput.value = ''; runSearch(); searchInput.blur(); }
    };
  }
  if (searchPrevBtn) searchPrevBtn.onclick = () => { Sound.play('uiClick'); stepSearch(-1); };
  if (searchNextBtn) searchNextBtn.onclick = () => { Sound.play('uiClick'); stepSearch(1); };

  // Scroll-wheel zoom toward the cursor: convert the cursor's viewport
  // position into the canvas's current (pre-zoom) world-space coordinate —
  // world = (cursor - pan) / zoom — then, after picking the new zoom level,
  // solve pan so that same world point maps back under the cursor again:
  // cursor = pan' + world * zoom'  =>  pan' = cursor - world * zoom'. Doing
  // this for both axes keeps the point under the mouse visually stationary
  // while everything around it scales. preventDefault (with a non-passive
  // listener) stops the wheel from also scrolling the page behind it.
  scroller.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = scroller.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const dir = e.deltaY < 0 ? 1 : -1;
    const newZoom = Util.clamp(skillTreeZoom + dir * SKILL_TREE_ZOOM_STEP, SKILL_TREE_ZOOM_MIN, SKILL_TREE_ZOOM_MAX);
    if (newZoom === skillTreeZoom) return;
    const worldX = (cursorX - skillTreePanX) / skillTreeZoom;
    const worldY = (cursorY - skillTreePanY) / skillTreeZoom;
    skillTreePanX = cursorX - worldX * newZoom;
    skillTreePanY = cursorY - worldY * newZoom;
    skillTreeZoom = newZoom;
    applyTransform();
  }, { passive: false });

  // Click-and-drag panning. Only starts when the mousedown target is empty
  // canvas/SVG space, not a node button (or a descendant of one, e.g. its
  // glyph/label span) — otherwise dragging would eat the click needed to
  // buy a node. Listeners live on `scroller`, a fresh element created by
  // this call each time the panel (re)builds, so they're discarded along
  // with it on the next rebuild rather than accumulating.
  let dragging = false;
  let dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;
  scroller.addEventListener('mousedown', (e) => {
    if (e.target.closest && e.target.closest('.skilltree-node')) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panStartX = skillTreePanX;
    panStartY = skillTreePanY;
    scroller.classList.add('skilltree-dragging');
  });
  scroller.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    skillTreePanX = panStartX + (e.clientX - dragStartX);
    skillTreePanY = panStartY + (e.clientY - dragStartY);
    applyTransform();
  });
  function endDrag(){
    if (!dragging) return;
    dragging = false;
    scroller.classList.remove('skilltree-dragging');
  }
  scroller.addEventListener('mouseup', endDrag);
  scroller.addEventListener('mouseleave', endDrag);
  // Detail panel only makes sense while hovering an actual node — hide it
  // once the cursor leaves the canvas entirely so stale info from the last
  // hovered node doesn't linger after the player pans away.
  scroller.addEventListener('mouseleave', () => showSkillNodeDetail(null));
}

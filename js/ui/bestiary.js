'use strict';
/* ============================================================
   bestiary.js — the Bestiary panel: 10 tabs (Enemies/Items/Stars/
   Pills/Trinkets/Familiars/Objects/Pickups/Room Types/Stages), each
   listing every entry in that category as a CARD in a responsive
   grid (Phase 20 — was a stacked single-column row list reusing the
   Achievements panel's .achv-row; the Bestiary now has its own
   .best-card/.best-grid classes so this revamp never touches how
   Achievements/Music Test/Skill Tree render their own rows). Anything
   never encountered/found/killed still renders as a "?" card — same
   idea as before, just a card instead of a row.

   All tracking that feeds this lives in achievements.js's
   ensureUnlockShape (unlocks.bestiary.*), written to via
   bumpBestiaryCount/markBestiarySeen — see that file's header
   comment on unlocks.bestiary for the full list of call sites
   (combat.js, items.js, game.js).

   Phase 20 — Enemies/Bosses/Superbosses are now split into per-stage
   sub-groups within each category. Three different "what stage is
   this" systems exist in the data and this file bridges all three:
     - a numeric `stage` field (0-3 legacy Crypt/Forest/Desert/Inferno,
       4-13 the Phase 10 post-finale stages — STAGES array, stages.js)
     - a `floorKey` field (the 9A/9B..12A/12B branch pairs, the linear
       13/14/15 floors, and the C-branch/D-branch regions — matched
       against BESTIARY_FLOORKEY_STAGE_LABEL below)
     - `stage:'universal'` (Phase 16 — DNB flies etc., eligible on
       every floor, no single stage to file it under)
   Superbosses carry NONE of the above (matched to a floorNum by a
   hardcoded dispatch in game.js's descend(), not by data — see
   superboss-routes.js's own header comment) — those are grouped by
   SUPERBOSS_ROUTE/SUPERBOSS_ROUTE_SEQUENCE instead, the one piece of
   real per-superboss routing data that already exists.
   ============================================================ */

const BESTIARY_TABS = [
  { id:'enemies', label:'Enemies', icon:'💀' },
  { id:'items', label:'Items', icon:'🎒' },
  { id:'stars', label:'Stars', icon:'⭐' },
  { id:'pills', label:'Pills', icon:'💊' },
  { id:'trinkets', label:'Trinkets', icon:'🔩' },
  { id:'familiars', label:'Familiars', icon:'🐾' },
  { id:'objects', label:'Objects', icon:'🪨' },
  { id:'pickups', label:'Pickups', icon:'🎁' },
  { id:'roomtypes', label:'Room Types', icon:'🚪' },
  { id:'stages', label:'Stages', icon:'🗺️' },
];

function loadBestiaryTabPref(){
  try {
    const v = localStorage.getItem('nightfallBestiaryTab');
    return BESTIARY_TABS.some(t => t.id === v) ? v : 'enemies';
  } catch (e) { return 'enemies'; }
}
let _bestiaryTab = loadBestiaryTabPref();

/* ---------------------------------------------------------------
   Stage grouping — see the header comment above for why there are
   three separate systems being bridged here.
   --------------------------------------------------------------- */
const BESTIARY_FLOORKEY_STAGE_LABEL = {
  '9A':'The Final Reckoning — Branch A', '9B':'The Final Reckoning — Branch B',
  '10A':'The Uncharted Reaches — Branch A', '10B':'The Uncharted Reaches — Branch B',
  '11A':'The Sunken Frequency — Branch A', '11B':'The Sunken Frequency — Branch B',
  '12A':'The Shattered Refrain — Branch A', '12B':'The Shattered Refrain — Branch B',
  '13':'The Hollow Chorus', '14':'The Final Waveform', '15':'The One True Descent',
  '3C':'The Gutters', '4C':'The Gutters',
  '5C':'The Sewers', '6C':'The Sewers',
  '7C':'The Rainforest', '8C':'The Rainforest', '9C':'The Rainforest', '10C':'The Rainforest',
  '11C':'The Mangroves', '12C':'The Mangroves',
  '4D':'The Observatory', '5D':'The Observatory',
  '6D':'The Orrery', '7D':'The Orrery',
  '8D':'The Void Between', '9D':'The Void Between', '10D':'The Void Between',
};
// encounter order along the main/C/D routes — used only to ORDER the
// floorKey groups against each other, not to label them (labels above)
const BESTIARY_FLOORKEY_ORDER = [
  '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B', '13', '14', '15',
  '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', '11C', '12C',
  '4D', '5D', '6D', '7D', '8D', '9D', '10D',
];

function bestiaryStageLabel(e){
  if (e.stage === 'universal') return 'Universal (Every Floor)';
  if (typeof e.stage === 'number') return (STAGES[e.stage] && STAGES[e.stage].name) || ('Stage ' + (e.stage + 1));
  if (e.floorKey) return BESTIARY_FLOORKEY_STAGE_LABEL[e.floorKey] || ('Floor ' + e.floorKey);
  return 'Other';
}
function bestiaryStageSortKey(e){
  if (e.stage === 'universal') return -1; // shows first — it belongs everywhere
  if (typeof e.stage === 'number') return e.stage < LEGACY_STAGE_COUNT ? e.stage : 1000 + e.stage;
  if (e.floorKey) return 100 + BESTIARY_FLOORKEY_ORDER.indexOf(e.floorKey);
  return 9999;
}
// groups a flat enemy/boss list into [{label, sortKey, items}], sorted into
// run order — Universal, then Crypt/Forest/Desert/Inferno, then the 9A..D
// branch/region floorKey groups in the order a run actually reaches them,
// then the Phase 10 post-finale stages, then anything unrecognized last
function bestiaryStageGroups(list){
  const groups = new Map();
  for (const e of list) {
    const label = bestiaryStageLabel(e);
    let g = groups.get(label);
    if (!g) { g = { label, sortKey: bestiaryStageSortKey(e), items: [] }; groups.set(label, g); }
    g.items.push(e);
  }
  return Array.from(groups.values()).sort((a, b) => a.sortKey - b.sortKey);
}
// superbosses have no stage/floorKey field at all — grouped by
// SUPERBOSS_ROUTE (main/C/D, superboss-routes.js) instead, each route's
// members ordered by SUPERBOSS_ROUTE_SEQUENCE (the real in-run encounter
// order — NOT SUPERBOSS_LIST's raw declaration order, which is out of
// sequence in two places per that file's own header comment)
function bestiarySuperbossStageGroups(list){
  const groups = new Map();
  for (const e of list) {
    const route = SUPERBOSS_ROUTE[e.id] || 'main';
    const label = 'Route ' + (SUPERBOSS_ROUTE_LABELS[route] || route);
    let g = groups.get(label);
    if (!g) { g = { label, sortKey: SUPERBOSS_ROUTE_ORDER.indexOf(route), seq: SUPERBOSS_ROUTE_SEQUENCE[route] || [], items: [] }; groups.set(label, g); }
    g.items.push(e);
  }
  const out = Array.from(groups.values());
  for (const g of out) g.items.sort((a, b) => g.seq.indexOf(a.id) - g.seq.indexOf(b.id));
  return out.sort((a, b) => a.sortKey - b.sortKey);
}

/* ---------------------------------------------------------------
   Card DOM — one card per entry, shared by every tab below. `dotColor`
   draws a plain colored circle instead of `icon` — used for enemies/
   objects/pills, none of which have their own emoji glyph the way
   items/trinkets/familiars/stars do. `chips` is the new (Phase 20)
   row of small stat pills under the description — omitted entirely
   for categories with nothing meaningful to show there.
   --------------------------------------------------------------- */
function bestiaryCard(opts){
  const card = document.createElement('div');
  card.className = 'best-card' + (opts.seen ? ' done' : '');

  const head = document.createElement('div');
  head.className = 'best-card-head';
  const icon = document.createElement('div');
  icon.className = 'best-card-icon';
  if (opts.seen && opts.dotColor) {
    icon.classList.add('best-dot');
    icon.style.background = opts.dotColor;
  } else {
    icon.textContent = opts.seen ? opts.icon : '❓';
  }
  head.appendChild(icon);

  const name = document.createElement('div');
  name.className = 'best-card-name';
  name.textContent = opts.seen ? opts.name : '???';
  // Phase 8a — mastery tier badge (copper/silver/gold/platinum). Tier 0 draws
  // nothing at all, so an entry that's merely been discovered looks exactly as
  // it did before.
  if (opts.seen && opts.tier > 0) {
    const badge = document.createElement('span');
    const tierName = BESTIARY_TIER_NAMES[opts.tier - 1];
    badge.className = 'best-tier';
    badge.textContent = ' ' + BESTIARY_TIER_ICONS[tierName];
    badge.style.color = BESTIARY_TIER_COLORS[tierName];
    badge.title = bestiaryTierLabel(opts.tier);
    name.appendChild(badge);
  }
  head.appendChild(name);
  card.appendChild(head);

  const lines = opts.seen ? (opts.lines || []) : ['Not yet discovered.'];
  for (const line of lines) {
    if (!line) continue;
    const d = document.createElement('div');
    d.className = 'best-card-desc';
    d.textContent = line;
    card.appendChild(d);
  }

  if (opts.seen && opts.chips && opts.chips.length) {
    const chipRow = document.createElement('div');
    chipRow.className = 'best-card-chips';
    for (const c of opts.chips) {
      if (!c) continue;
      const chip = document.createElement('span');
      chip.className = 'best-chip';
      chip.textContent = c;
      chipRow.appendChild(chip);
    }
    card.appendChild(chipRow);
  }

  if (opts.seen && opts.extra) {
    const ex = document.createElement('div');
    ex.className = 'best-card-tally';
    ex.textContent = opts.extra;
    card.appendChild(ex);
  }
  return card;
}

function bestiaryCategoryHeader(wrap, label, done, total){
  const h = document.createElement('h3');
  h.className = 'achv-category';
  h.textContent = label + ' (' + done + '/' + total + ')';
  wrap.appendChild(h);
}
// a lighter sub-header for a stage/route group NESTED under a category
// header above — visually smaller and indented so the two-level hierarchy
// (category -> stage) reads clearly at a glance
function bestiarySubHeader(wrap, label, done, total){
  const h = document.createElement('h4');
  h.className = 'best-subcategory';
  h.textContent = label + ' (' + done + '/' + total + ')';
  wrap.appendChild(h);
}
function bestiaryGrid(){
  const grid = document.createElement('div');
  grid.className = 'best-grid';
  return grid;
}

/* ---------------------------------------------------------------
   Chip builders — one per category shape. Every field checked is
   optional on the underlying data (behaviors vary wildly), so each
   just no-ops (returns nothing for that chip) when absent.
   --------------------------------------------------------------- */
function enemyChips(e){
  const chips = ['HP ' + e.hp, 'DMG ' + e.dmg];
  chips.push(e.speed > 0 ? ('SPD ' + e.speed) : 'Stationary');
  if (e.radius) chips.push('R' + e.radius);
  if (e.behavior) chips.push(e.behavior);
  if (e.flies) chips.push('✈ Flies');
  if (e.harmless) chips.push('Harmless');
  if (e.groupSize) chips.push('Group ×' + e.groupSize);
  if (e.xpTier) chips.push('Tier ' + e.xpTier);
  if (e.isMinion) chips.push('Summon Only');
  if (e.onlyFloorNum !== undefined) chips.push('Floor ' + (e.onlyFloorNum + 1) + ' Only');
  return chips;
}

/* ---------------------------------------------------------------
   Per-tab renderers
   --------------------------------------------------------------- */
function renderBestiaryEnemies(wrap){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const kills = unlocks.bestiary.enemyKills, deaths = unlocks.bestiary.enemyDeaths;
  const groups = [
    { label:'Enemies', list: ENEMY_LIST, tierCat:'enemy', stageGroups: bestiaryStageGroups },
    { label:'Bosses', list: BOSS_LIST, tierCat:'boss', stageGroups: bestiaryStageGroups },
    { label:'Superbosses', list: SUPERBOSS_LIST, tierCat:'superboss', stageGroups: bestiarySuperbossStageGroups },
  ];
  for (const g of groups) {
    const done = g.list.filter(e => kills[e.id]).length;
    bestiaryCategoryHeader(wrap, g.label, done, g.list.length);
    for (const stageGroup of g.stageGroups(g.list)) {
      const sDone = stageGroup.items.filter(e => kills[e.id]).length;
      bestiarySubHeader(wrap, stageGroup.label, sDone, stageGroup.items.length);
      const stageWrap = document.createElement('div');
      stageWrap.className = 'best-stage-group';
      const grid = bestiaryGrid();
      for (const e of stageGroup.items) {
        const seen = !!kills[e.id];
        const k = kills[e.id] || 0, d = deaths[e.id] || 0;
        const tally = 'Defeated ' + Util.formatNum(k) + ' time' + (k === 1 ? '' : 's') + ' · Killed you ' + Util.formatNum(d) + ' time' + (d === 1 ? '' : 's');
        grid.appendChild(bestiaryCard({
          seen, icon: e.icon || '💀', dotColor: e.icon ? null : e.color, name: e.name,
          lines: [e.desc || null], chips: enemyChips(e), extra: tally,
          tier: bestiaryTierFor(g.tierCat, k),
        }));
      }
      stageWrap.appendChild(grid);
      wrap.appendChild(stageWrap);
    }
  }
}

function renderBestiaryItems(wrap){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const seenMap = unlocks.bestiary.seenItems;
  const counts = unlocks.bestiary.itemsCollectedCount || {};
  const groups = [
    { label:'Passive Items', list: PASSIVE_ITEMS },
    { label:'Active Items', list: ACTIVE_ITEMS },
  ];
  for (const g of groups) {
    const done = g.list.filter(i => seenMap[i.id]).length;
    bestiaryCategoryHeader(wrap, g.label, done, g.list.length);
    const grid = bestiaryGrid();
    for (const item of g.list) {
      const seen = !!seenMap[item.id];
      const chips = [item.type === 'active' ? 'Active' : 'Passive'];
      if (item.maxCharge) chips.push('Charge ' + item.maxCharge);
      if (item.locked) chips.push('🔒 Locked');
      grid.appendChild(bestiaryCard({
        seen, icon: item.icon, name: item.name,
        lines: [item.desc], chips,
        extra: item.quality ? ('★'.repeat(item.quality) + '☆'.repeat(4 - item.quality)) : null,
        tier: bestiaryTierFor('item', counts[item.id] || 0),
      }));
    }
    wrap.appendChild(grid);
  }
}

function renderBestiarySimple(wrap, list, seenSection, extraFn, chipsFn){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const seenMap = unlocks.bestiary[seenSection] || {};
  // Phase 8a — the seen-section → tier-category/count-bucket table lives in
  // achievements/logic.js, the same one markBestiarySeen writes through, so
  // the panel can't drift out of sync with what's actually being counted.
  const tierInfo = _BESTIARY_SEEN_TIER_MAP[seenSection];
  const counts = tierInfo ? (unlocks.bestiary[tierInfo.countBucket] || {}) : {};
  const grid = bestiaryGrid();
  for (const entry of list) {
    const seen = !!seenMap[entry.id];
    grid.appendChild(bestiaryCard({
      seen, icon: entry.icon, name: entry.name,
      lines: [entry.desc],
      chips: chipsFn ? chipsFn(entry) : null,
      extra: extraFn ? extraFn(entry) : null,
      tier: tierInfo ? bestiaryTierFor(tierInfo.category, counts[entry.id] || 0) : 0,
    }));
  }
  wrap.appendChild(grid);
}

function renderBestiaryFamiliars(wrap){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const seenMap = unlocks.bestiary.seenFamiliars;
  const counts = unlocks.bestiary.familiarsCollectedCount || {};
  const groups = [
    { label:'Orbiters', behavior:'orbiter' },
    { label:'Shooters', behavior:'shooter' },
    { label:'Procs', behavior:'proc' },
    { label:'Swarmers', behavior:'swarmer' },
  ];
  // Phase 20 — 'swarmer' (Phase 16's Fly Hive/Maggot Nest) had no group of
  // its own before and was silently falling out of every one of the three
  // original buckets; anything else unmatched by all four still gets a
  // catch-all group below rather than vanishing the same way.
  const bucketed = new Set(groups.map(g => g.behavior));
  for (const g of groups) {
    const list = FAMILIAR_LIST.filter(f => f.behavior === g.behavior);
    if (!list.length) continue;
    const done = list.filter(f => seenMap[f.id]).length;
    bestiaryCategoryHeader(wrap, g.label, done, list.length);
    const grid = bestiaryGrid();
    for (const f of list) {
      const seen = !!seenMap[f.id];
      const chips = [];
      if (f.behavior === 'orbiter') chips.push('DMG ' + f.dmg, 'Orbit Speed ' + f.orbitSpeed);
      else if (f.behavior === 'shooter') chips.push('DMG ' + f.dmg, 'Fires every ' + f.cooldown + 's');
      else if (f.behavior === 'proc') chips.push('Every ' + f.interval + 's');
      else if (f.behavior === 'swarmer') chips.push('DMG ' + f.dmg, 'Every ' + f.interval + 's', '×' + f.orbCount + ' orbs');
      grid.appendChild(bestiaryCard({ seen, icon: f.icon, name: f.name, lines: [f.desc], chips, tier: bestiaryTierFor('familiar', counts[f.id] || 0) }));
    }
    wrap.appendChild(grid);
  }
  const other = FAMILIAR_LIST.filter(f => !bucketed.has(f.behavior));
  if (other.length) {
    const done = other.filter(f => seenMap[f.id]).length;
    bestiaryCategoryHeader(wrap, 'Other', done, other.length);
    const grid = bestiaryGrid();
    for (const f of other) {
      const seen = !!seenMap[f.id];
      grid.appendChild(bestiaryCard({ seen, icon: f.icon, name: f.name, lines: [f.desc], chips: [f.behavior], tier: bestiaryTierFor('familiar', counts[f.id] || 0) }));
    }
    wrap.appendChild(grid);
  }
}

function renderBestiaryPills(wrap){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const seenMap = unlocks.bestiary.seenPills;
  const pillCounts = unlocks.bestiary.pillsDrunkCount || {};

  // pill colors don't map to a fixed effect (re-randomized every run — see
  // game.js startRun's pillEffectMap), so instead of a per-color effect
  // (which would just be stale/wrong outside the run it was seen in), this
  // tab shows the full universe of possible effects once, up top
  const note = document.createElement('p');
  note.className = 'bestiary-note';
  note.textContent = "A color's actual effect is re-randomized every run, so the same pill won't always do the same thing twice. Every possible effect: " +
    PILL_EFFECT_LIST.map(e => e.name).join(', ') + '.';
  wrap.appendChild(note);

  const grid = bestiaryGrid();
  for (const c of PILL_COLORS) {
    const seen = !!seenMap[c.id];
    const n = pillCounts[c.id] || 0;
    grid.appendChild(bestiaryCard({
      seen, dotColor: c.color, icon:'💊', name: c.name,
      lines: [],
      extra: n ? ('Taken ' + Util.formatNum(n) + ' time' + (n === 1 ? '' : 's') + '.') : 'Taken at least once.',
      tier: bestiaryTierFor('pill', n),
    }));
  }
  wrap.appendChild(grid);
}

function renderBestiaryObjects(wrap){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const seenMap = unlocks.bestiary.objectsSeen, destroyedMap = unlocks.bestiary.objectsDestroyed;
  const grid = bestiaryGrid();
  for (const ob of Object.values(OBSTACLES)) {
    const seen = !!seenMap[ob.id];
    const canBeDestroyed = !!(ob.destructible || ob.attackable);
    const n = destroyedMap[ob.id] || 0;
    const chips = [];
    if (ob.hazard) chips.push('⚠ Hazard');
    if (ob.dmg) chips.push('DMG ' + ob.dmg);
    if (ob.attackable) chips.push('Attackable');
    if (ob.destructible) chips.push('Bombable');
    if (ob.blocksFlight) chips.push('Blocks Flight');
    if (ob.walkable) chips.push('Walk-Over');
    if (ob.projectile) chips.push('Fires');
    const line2 = canBeDestroyed ? ('Destroyed ' + Util.formatNum(n) + ' time' + (n === 1 ? '' : 's')) : 'Indestructible.';
    // only destructible obstacles have a tiered count — objectsSeen is a plain
    // boolean with no repeat-count meaning, see logic.js's Phase 8a note
    grid.appendChild(bestiaryCard({ seen, dotColor: ob.color, icon:'🪨', name: ob.name, lines: [ob.desc], chips, extra: line2, tier: canBeDestroyed ? bestiaryTierFor('object', n) : 0 }));
  }
  wrap.appendChild(grid);
}

/* ---------------------------------------------------------------
   Totals (tab-button counts, overall summary, the "NEW" badge)
   --------------------------------------------------------------- */
function bestiaryDiscoveredTotals(){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const b = unlocks.bestiary;
  const enemyList = ENEMY_LIST.concat(BOSS_LIST, SUPERBOSS_LIST);
  return {
    enemies: { done: enemyList.filter(e => b.enemyKills[e.id]).length, total: enemyList.length },
    items: { done: ITEM_LIST.filter(i => b.seenItems[i.id]).length, total: ITEM_LIST.length },
    stars: { done: STAR_LIST.filter(s => b.seenStars[s.id]).length, total: STAR_LIST.length },
    pills: { done: PILL_COLORS.filter(p => b.seenPills[p.id]).length, total: PILL_COLORS.length },
    trinkets: { done: TRINKET_LIST.filter(t => b.seenTrinkets[t.id]).length, total: TRINKET_LIST.length },
    familiars: { done: FAMILIAR_LIST.filter(f => b.seenFamiliars[f.id]).length, total: FAMILIAR_LIST.length },
    objects: { done: Object.values(OBSTACLES).filter(o => b.objectsSeen[o.id]).length, total: Object.keys(OBSTACLES).length },
    pickups: { done: PICKUP_TYPE_LIST.filter(p => (b.seenPickupKinds || {})[p.id]).length, total: PICKUP_TYPE_LIST.length },
    roomtypes: { done: ROOM_TYPE_LIST.filter(r => (b.seenRoomTypes || {})[r.id]).length, total: ROOM_TYPE_LIST.length },
    stages: { done: STAGE_LIST.filter(s => (b.seenStages || {})[s.id]).length, total: STAGE_LIST.length },
  };
}
function bestiaryTotalDiscovered(){
  const totals = bestiaryDiscoveredTotals();
  let sum = 0;
  for (const k in totals) sum += totals[k].done;
  return sum;
}

function buildBestiaryPanel(){
  const wrap = document.getElementById('bestiaryList');
  if (!wrap) return;
  wrap.innerHTML = '';
  const totals = bestiaryDiscoveredTotals();

  const tabsWrap = document.getElementById('bestiaryTabs');
  if (tabsWrap) {
    tabsWrap.innerHTML = '';
    for (const tab of BESTIARY_TABS) {
      const t = totals[tab.id];
      const btn = document.createElement('button');
      btn.classList.toggle('active', tab.id === _bestiaryTab);
      btn.textContent = tab.icon + ' ' + tab.label + ' (' + t.done + '/' + t.total + ')';
      btn.addEventListener('click', () => {
        if (_bestiaryTab === tab.id) return;
        _bestiaryTab = tab.id;
        try { localStorage.setItem('nightfallBestiaryTab', tab.id); } catch (e) { /* ignore */ }
        Sound.play('uiClick');
        buildBestiaryPanel();
      });
      tabsWrap.appendChild(btn);
    }
  }

  const summaryEl = document.getElementById('bestiarySummary');
  if (summaryEl) {
    let done = 0, total = 0;
    for (const k in totals) { done += totals[k].done; total += totals[k].total; }
    summaryEl.textContent = done + ' / ' + total + ' discovered';
  }

  switch (_bestiaryTab) {
    case 'enemies': renderBestiaryEnemies(wrap); break;
    case 'items': renderBestiaryItems(wrap); break;
    case 'stars': renderBestiarySimple(wrap, STAR_LIST, 'seenStars'); break;
    case 'pills': renderBestiaryPills(wrap); break;
    case 'trinkets': renderBestiarySimple(wrap, TRINKET_LIST, 'seenTrinkets', null, t => t.locked ? ['🔒 Locked'] : null); break;
    case 'familiars': renderBestiaryFamiliars(wrap); break;
    case 'objects': renderBestiaryObjects(wrap); break;
    case 'pickups': renderBestiarySimple(wrap, PICKUP_TYPE_LIST, 'seenPickupKinds'); break;
    case 'roomtypes': renderBestiarySimple(wrap, ROOM_TYPE_LIST, 'seenRoomTypes'); break;
    case 'stages': renderBestiarySimple(wrap, STAGE_LIST, 'seenStages'); break;
  }
}

// "something new since you last opened this" badge on the menu/pause
// buttons — same pattern as main.js's Achievements badge (see
// refreshAchievementsBadge/markAchievementsSeen)
function markBestiarySeenBadge(){
  try { localStorage.setItem('nightfallBestiarySeenCount', String(bestiaryTotalDiscovered())); } catch (e) { /* ignore */ }
  const badge = document.getElementById('bestiaryNewBadge');
  if (badge) badge.classList.add('hidden');
}
function refreshBestiaryBadge(){
  const badge = document.getElementById('bestiaryNewBadge');
  if (!badge) return;
  const doneCount = bestiaryTotalDiscovered();
  let seenCount = 0;
  try { seenCount = parseInt(localStorage.getItem('nightfallBestiarySeenCount') || '0', 10); } catch (e) { /* ignore */ }
  badge.classList.toggle('hidden', doneCount <= seenCount);
}

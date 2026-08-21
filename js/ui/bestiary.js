'use strict';
/* ============================================================
   bestiary.js — the Bestiary panel: 9 tabs (Enemies/Items/Stars/
   Pills/Trinkets/Familiars/Objects/Pickups/Room Types), each listing every entry in
   that category. Anything never encountered/found/killed renders
   as a "?" row — same visual language as the Achievements panel
   (reuses its .achv-summary/.achv-filter/.achv-list/.achv-category/
   .achv-grid/.achv-row/.achv-icon/.achv-text/.achv-name/.achv-desc/
   .achv-reward CSS classes — see style.css's "Achievements panel"
   section and achievements.js's buildAchievementsPanel for the
   pattern this mirrors), just re-skinned as tabs instead of a
   All/Unlocked/Locked filter.

   All tracking that feeds this lives in achievements.js's
   ensureUnlockShape (unlocks.bestiary.*), written to via
   bumpBestiaryCount/markBestiarySeen — see that file's header
   comment on unlocks.bestiary for the full list of call sites
   (combat.js, items.js, game.js).
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

// one row's worth of DOM, shared by every tab below. `dotColor` draws a
// plain colored circle instead of `icon` — used for enemies/objects/pills,
// none of which have their own emoji glyph the way items/trinkets/
// familiars/stars do.
function bestiaryRow(opts){
  const row = document.createElement('div');
  row.className = 'achv-row' + (opts.seen ? ' done' : '');
  const icon = document.createElement('div');
  icon.className = 'achv-icon';
  if (opts.seen && opts.dotColor) {
    icon.classList.add('best-dot');
    icon.style.background = opts.dotColor;
  } else {
    icon.textContent = opts.seen ? opts.icon : '❓';
  }
  row.appendChild(icon);

  const text = document.createElement('div');
  text.className = 'achv-text';
  const name = document.createElement('div');
  name.className = 'achv-name';
  name.textContent = opts.seen ? opts.name : '???';
  text.appendChild(name);
  const lines = opts.seen ? (opts.lines || []) : ['Not yet discovered.'];
  for (const line of lines) {
    if (!line) continue;
    const d = document.createElement('div');
    d.className = 'achv-desc';
    d.textContent = line;
    text.appendChild(d);
  }
  if (opts.seen && opts.extra) {
    const ex = document.createElement('div');
    ex.className = 'achv-reward';
    ex.textContent = opts.extra;
    text.appendChild(ex);
  }
  row.appendChild(text);
  return row;
}

function bestiaryCategoryHeader(wrap, label, done, total){
  const h = document.createElement('h3');
  h.className = 'achv-category';
  h.textContent = label + ' (' + done + '/' + total + ')';
  wrap.appendChild(h);
}

/* ---------------------------------------------------------------
   Per-tab renderers
   --------------------------------------------------------------- */
function renderBestiaryEnemies(wrap){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const kills = unlocks.bestiary.enemyKills, deaths = unlocks.bestiary.enemyDeaths;
  const groups = [
    { label:'Enemies', list: ENEMY_LIST },
    { label:'Bosses', list: BOSS_LIST },
    { label:'Superbosses', list: SUPERBOSS_LIST },
  ];
  for (const g of groups) {
    const done = g.list.filter(e => kills[e.id]).length;
    bestiaryCategoryHeader(wrap, g.label, done, g.list.length);
    const grid = document.createElement('div');
    grid.className = 'achv-grid';
    for (const e of g.list) {
      const seen = !!kills[e.id];
      const k = kills[e.id] || 0, d = deaths[e.id] || 0;
      const stats = 'HP ' + e.hp + ' · DMG ' + e.dmg + ' · SPD ' + e.speed + (e.flies ? ' · Flies' : '') + ' · ' + e.behavior;
      const tally = 'Defeated ' + Util.formatNum(k) + ' time' + (k === 1 ? '' : 's') + ' · Killed you ' + Util.formatNum(d) + ' time' + (d === 1 ? '' : 's');
      grid.appendChild(bestiaryRow({
        seen, icon: e.icon || '💀', dotColor: e.icon ? null : e.color, name: e.name,
        lines: [stats, tally],
      }));
    }
    wrap.appendChild(grid);
  }
}

function renderBestiaryItems(wrap){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const seenMap = unlocks.bestiary.seenItems;
  const groups = [
    { label:'Passive Items', list: PASSIVE_ITEMS },
    { label:'Active Items', list: ACTIVE_ITEMS },
  ];
  for (const g of groups) {
    const done = g.list.filter(i => seenMap[i.id]).length;
    bestiaryCategoryHeader(wrap, g.label, done, g.list.length);
    const grid = document.createElement('div');
    grid.className = 'achv-grid';
    for (const item of g.list) {
      const seen = !!seenMap[item.id];
      grid.appendChild(bestiaryRow({
        seen, icon: item.icon, name: item.name,
        lines: [item.desc],
        extra: item.quality ? ('★'.repeat(item.quality) + '☆'.repeat(4 - item.quality)) : null,
      }));
    }
    wrap.appendChild(grid);
  }
}

function renderBestiarySimple(wrap, list, seenSection, extraFn){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const seenMap = unlocks.bestiary[seenSection] || {};
  const grid = document.createElement('div');
  grid.className = 'achv-grid';
  for (const entry of list) {
    const seen = !!seenMap[entry.id];
    grid.appendChild(bestiaryRow({
      seen, icon: entry.icon, name: entry.name,
      lines: [entry.desc],
      extra: extraFn ? extraFn(entry) : null,
    }));
  }
  wrap.appendChild(grid);
}

function renderBestiaryFamiliars(wrap){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const seenMap = unlocks.bestiary.seenFamiliars;
  const groups = [
    { label:'Orbiters', behavior:'orbiter' },
    { label:'Shooters', behavior:'shooter' },
    { label:'Procs', behavior:'proc' },
  ];
  for (const g of groups) {
    const list = FAMILIAR_LIST.filter(f => f.behavior === g.behavior);
    const done = list.filter(f => seenMap[f.id]).length;
    bestiaryCategoryHeader(wrap, g.label, done, list.length);
    const grid = document.createElement('div');
    grid.className = 'achv-grid';
    for (const f of list) {
      const seen = !!seenMap[f.id];
      let statLine = '';
      if (f.behavior === 'orbiter') statLine = 'DMG ' + f.dmg + ' · Orbit Speed ' + f.orbitSpeed;
      else if (f.behavior === 'shooter') statLine = 'DMG ' + f.dmg + ' · Fires every ' + f.cooldown + 's';
      else if (f.behavior === 'proc') statLine = 'Every ' + f.interval + 's';
      grid.appendChild(bestiaryRow({ seen, icon: f.icon, name: f.name, lines: [f.desc, statLine] }));
    }
    wrap.appendChild(grid);
  }
}

function renderBestiaryPills(wrap){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const seenMap = unlocks.bestiary.seenPills;

  // pill colors don't map to a fixed effect (re-randomized every run — see
  // game.js startRun's pillEffectMap), so instead of a per-color effect
  // (which would just be stale/wrong outside the run it was seen in), this
  // tab shows the full universe of possible effects once, up top
  const note = document.createElement('p');
  note.className = 'bestiary-note';
  note.textContent = "A color's actual effect is re-randomized every run, so the same pill won't always do the same thing twice. Every possible effect: " +
    PILL_EFFECT_LIST.map(e => e.name).join(', ') + '.';
  wrap.appendChild(note);

  const grid = document.createElement('div');
  grid.className = 'achv-grid';
  for (const c of PILL_COLORS) {
    const seen = !!seenMap[c.id];
    grid.appendChild(bestiaryRow({ seen, dotColor: c.color, icon:'💊', name: c.name, lines: ['Taken at least once.'] }));
  }
  wrap.appendChild(grid);
}

function renderBestiaryObjects(wrap){
  const unlocks = ensureUnlockShape(loadUnlocks());
  const seenMap = unlocks.bestiary.objectsSeen, destroyedMap = unlocks.bestiary.objectsDestroyed;
  const grid = document.createElement('div');
  grid.className = 'achv-grid';
  for (const ob of Object.values(OBSTACLES)) {
    const seen = !!seenMap[ob.id];
    const canBeDestroyed = !!(ob.destructible || ob.attackable);
    const n = destroyedMap[ob.id] || 0;
    const line2 = canBeDestroyed ? ('Destroyed ' + Util.formatNum(n) + ' time' + (n === 1 ? '' : 's')) : 'Indestructible.';
    grid.appendChild(bestiaryRow({ seen, dotColor: ob.color, icon:'🪨', name: ob.name, lines: [ob.desc, line2] }));
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
    case 'trinkets': renderBestiarySimple(wrap, TRINKET_LIST, 'seenTrinkets'); break;
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

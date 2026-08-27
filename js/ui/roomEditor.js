'use strict';
/* ============================================================
   roomEditor.js — logic for room-editor.html.
   Reuses the real buildRoomTiles()/decodeSpawner() from room.js so
   previews (and the exported/imported data) are guaranteed to match
   what the game itself builds and reads at runtime.
   ============================================================ */

let TILE_PX = 16; // editor's on-screen pixels per tile (game uses TILE=32) — changeable via Zoom
const CATEGORY_COLORS = { enemy:'#e35b6a', pickup:'#e3c15b', item:'#8b5cf6', deal:'#7a1f2e', shop:'#4fd1c5', obstacle:'#7a746a' };

let workingMask = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
workingMask[0][0] = 1;

let spawnerMap = new Map(); // "x,y" -> spawner
let selectedCategory = 'enemy';
let currentGrid = null, gridW = 0, gridH = 0;
// doors are per-block now (see dungeon.js's computeDoorSlots) — this holds
// which specific block-edges have been clicked off, keyed "col,row,dir"
const disabledDoorSlots = new Set();
let previewDoorSlots = []; // the current mask's door-eligible slots, refreshed by rebuildGrid()
let floorState = new Array(MAX_FLOORS).fill(true); // true = allowed on that floor
let hoverTile = null;

const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');

function makeEmptyMask(){ return [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]; }

function isMaskConnected(mask){
  const cells = [];
  for (let r = 0; r < mask.length; r++) for (let c = 0; c < mask[r].length; c++) if (mask[r][c]) cells.push(r + ',' + c);
  if (cells.length <= 1) return true;
  const set = new Set(cells);
  const visited = new Set([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    const [rs, cs] = stack.pop().split(',').map(Number);
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const k = (rs + dr) + ',' + (cs + dc);
      if (set.has(k) && !visited.has(k)) { visited.add(k); stack.push(k); }
    }
  }
  return visited.size === cells.length;
}

function trimMaskWithOffset(mask){
  let minR = 99, maxR = -1, minC = 99, maxC = -1;
  for (let r = 0; r < mask.length; r++) {
    for (let c = 0; c < mask[r].length; c++) {
      if (mask[r][c]) { minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
    }
  }
  if (maxR < 0) return null;
  const out = [];
  for (let r = minR; r <= maxR; r++) {
    const row = [];
    for (let c = minC; c <= maxC; c++) row.push(mask[r][c] ? 1 : 0);
    out.push(row);
  }
  return { mask: out, offR: minR, offC: minC };
}

/* ================================================================
   Undo / redo — snapshot the whole editable state (mask, spawners,
   disabled doors, floor restriction) before every discrete action.
   A drag-paint gesture counts as ONE step, not one per tile.
   ================================================================ */
const MAX_UNDO = 80;
let undoStack = [];
let redoStack = [];

function snapshotState(){
  return {
    mask: workingMask.map((r) => r.slice()),
    spawners: Array.from(spawnerMap.entries()).map(([k, v]) => [k, { ...v }]),
    disabledDoorSlots: Array.from(disabledDoorSlots),
    floorState: floorState.slice(),
    roomType: document.getElementById('roomType').value,
  };
}

function restoreState(snap){
  workingMask = snap.mask.map((r) => r.slice());
  spawnerMap = new Map(snap.spawners.map(([k, v]) => [k, { ...v }]));
  disabledDoorSlots.clear();
  snap.disabledDoorSlots.forEach((d) => disabledDoorSlots.add(d));
  floorState = snap.floorState.slice();
  document.getElementById('roomType').value = snap.roomType;
  renderBlockGrid();
  renderFloorButtons();
  rebuildGrid();
  updateStatsAndWarnings();
}

function pushUndo(){
  undoStack.push(snapshotState());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
  updateUndoRedoButtons();
}

function undo(){
  if (!undoStack.length) return;
  redoStack.push(snapshotState());
  restoreState(undoStack.pop());
  updateUndoRedoButtons();
}

function redo(){
  if (!redoStack.length) return;
  undoStack.push(snapshotState());
  restoreState(redoStack.pop());
  updateUndoRedoButtons();
}

function updateUndoRedoButtons(){
  document.getElementById('undoBtn').disabled = undoStack.length === 0;
  document.getElementById('redoBtn').disabled = redoStack.length === 0;
}
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

window.addEventListener('keydown', (e) => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return; // don't hijack while typing
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
  if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); return; }
  const catKeys = { '1':'enemy', '2':'pickup', '3':'item', '4':'deal', '5':'shop', '6':'obstacle', '7':'erase' };
  if (catKeys[e.key]) {
    selectedCategory = catKeys[e.key];
    categoryBtns.forEach((b) => b.classList.toggle('active', b.dataset.cat === selectedCategory));
    populateSpecificSelect();
  }
});

/* ---------------- block grid ---------------- */
function renderBlockGrid(){
  const el = document.getElementById('blockGrid');
  el.innerHTML = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const cell = document.createElement('div');
      cell.className = 'blockcell' + (workingMask[r][c] ? ' on' : '');
      cell.addEventListener('click', () => {
        pushUndo();
        workingMask[r][c] = workingMask[r][c] ? 0 : 1;
        renderBlockGrid();
        rebuildGrid();
      });
      el.appendChild(cell);
    }
  }
  const count = workingMask.flat().reduce((a, b) => a + b, 0);
  const countEl = document.getElementById('blockCount');
  let msg = count + ' block' + (count === 1 ? '' : 's');
  let warn = count < 1 || count > 4;
  if (count < 1) msg += ' — need at least 1';
  if (count > 4) msg += ' — recommended max is 4';
  if (count > 1 && !isMaskConnected(workingMask)) { msg += ' — not all connected!'; warn = true; }
  countEl.textContent = msg;
  countEl.className = warn ? 'warn' : 'ok';
}

/* ---------------- tile grid + canvas ---------------- */
function rebuildGrid(){
  const count = workingMask.flat().reduce((a, b) => a + b, 0);
  if (count < 1) {
    currentGrid = null; gridW = 0; gridH = 0;
    canvas.width = 260; canvas.height = 70;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e3c15b'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Toggle at least one block above', 130, 38);
    document.getElementById('canvasInfo').textContent = '';
    return;
  }
  previewDoorSlots = buildPreviewDoorSlots(workingMask, disabledDoorsField(0, 0, workingMask));
  const fakeNode = { shape: { mask: workingMask }, doorSlots: previewDoorSlots };
  const built = buildRoomTiles(fakeNode);
  currentGrid = built.grid; gridW = built.tileW; gridH = built.tileH;
  renderCanvas();
  updateStatsAndWarnings();
}

// groups the flat "col,row,dir" disabledDoorSlots keys back into the
// per-block [col,row,dirLetters] format computeDoorSlots()/export expect,
// shifting by (offC,offR) and dropping anything outside `mask` (stale
// entries left over from a block that's since been removed/moved).
function disabledDoorsField(offC, offR, mask){
  offC = offC || 0; offR = offR || 0;
  const groups = new Map();
  for (const key of disabledDoorSlots) {
    const parts = key.split(',');
    const c = Number(parts[0]) - offC, r = Number(parts[1]) - offR, dir = parts[2];
    if (mask && (!mask[r] || !mask[r][c])) continue;
    const gk = c + ',' + r;
    if (!groups.has(gk)) groups.set(gk, new Set());
    groups.get(gk).add(dir);
  }
  const out = [];
  for (const [gk, dirs] of groups) {
    const [c, r] = gk.split(',').map(Number);
    out.push([c, r, Array.from(dirs).join('')]);
  }
  return out;
}

// door-eligible slots for `mask`, using the shared game logic (dungeon.js)
// so the preview always matches how the room will actually connect at
// runtime. Slots not disabled are marked type:'normal' so buildRoomTiles
// carves them as doors in the preview grid.
function buildPreviewDoorSlots(mask, doorField){
  const template = { d: doorField || [] };
  const slots = computeDoorSlots(mask, 0, 0, template, null);
  for (const s of slots) if (!s.disabled) s.type = 'normal';
  return slots;
}

// the on-canvas pixel center of a door slot's clickable marker — the
// midpoint between its two door cells (see room.js's doorSlotCells).
function doorMarkerCenter(slot){
  const cells = doorSlotCells(slot);
  const tx = (cells[0].x + cells[1].x + 1) / 2;
  const ty = (cells[0].y + cells[1].y + 1) / 2;
  return { x: tx * TILE_PX, y: ty * TILE_PX };
}

function findDoorSlotAtEvent(e){
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  const hitR = Math.max(6, TILE_PX * 0.4);
  for (const slot of previewDoorSlots) {
    const { x, y } = doorMarkerCenter(slot);
    if (Util.dist(mx, my, x, y) <= hitR) return slot;
  }
  return null;
}

function toggleDoorSlot(slot){
  const key = slot.localCol + ',' + slot.localRow + ',' + slot.dir;
  if (disabledDoorSlots.has(key)) disabledDoorSlots.delete(key); else disabledDoorSlots.add(key);
  rebuildGrid();
}

const OBSTACLE_GLYPHS = {
  rock:'R', hardrock:'H', pit:'P', tallrock:'r', tallhardrock:'h', cactus:'C', yellowfire:'Y', redfire:'F', bluefire:'f', purplefire:'p', spike:'S',
  greenfire:'G', whitefire:'W', blackfire:'K', // Phase 15 — 'K' not 'B': bombbarrel already owns 'B'
  spiketrap:'s', spikedrock:'k', tintedrock:'t', movingspike:'M', sandtrap:'D', mud:'U', thornbush:'b', luckcrystal:'l',
  turretn:'^', turrete:'>', turrets:'v', turretw:'<', turretplus:'+', turretx:'X', turrettarget:'@',
  bombbarrel:'B', pushablebombbarrel:'b',
};
function spawnerGlyph(sp){
  if (sp.category === 'obstacle') return OBSTACLE_GLYPHS[sp.specific] || '?';
  if (sp.kind === 'genericBoss') return 'B';
  if (sp.kind === 'generic') return '?';
  return sp.category[0].toUpperCase();
}

function renderCanvas(){
  if (!currentGrid) return;
  canvas.width = gridW * TILE_PX;
  canvas.height = gridH * TILE_PX;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const t = currentGrid[y][x];
      const px = x * TILE_PX, py = y * TILE_PX;
      if (t === T_VOID) { ctx.fillStyle = '#000'; ctx.fillRect(px, py, TILE_PX, TILE_PX); continue; }
      if (t === T_WALL || t === T_SECRET) { ctx.fillStyle = '#242138'; ctx.fillRect(px, py, TILE_PX, TILE_PX); continue; }
      if (t === T_DOOR) {
        ctx.fillStyle = '#463a5e'; ctx.fillRect(px, py, TILE_PX, TILE_PX);
        ctx.strokeStyle = '#e3c15b'; ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_PX - 1, TILE_PX - 1);
        continue;
      }
      ctx.fillStyle = ((x + y) % 2 === 0) ? '#1c1a2b' : '#201e31';
      ctx.fillRect(px, py, TILE_PX, TILE_PX);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let x = 0; x <= gridW; x++) { ctx.beginPath(); ctx.moveTo(x * TILE_PX, 0); ctx.lineTo(x * TILE_PX, canvas.height); ctx.stroke(); }
  for (let y = 0; y <= gridH; y++) { ctx.beginPath(); ctx.moveTo(0, y * TILE_PX); ctx.lineTo(canvas.width, y * TILE_PX); ctx.stroke(); }

  // door markers — click one to enable/disable a door on that block's edge.
  // Green = door open here; red = disabled (plain wall). Enabled slots also
  // already render as a gold-bordered T_DOOR tile underneath (see above).
  const doorR = Math.max(4, TILE_PX * 0.32);
  for (const slot of previewDoorSlots) {
    const { x: mx, y: my } = doorMarkerCenter(slot);
    ctx.beginPath();
    ctx.arc(mx, my, doorR, 0, Math.PI * 2);
    ctx.fillStyle = slot.disabled ? '#5a2436' : '#2f7a52';
    ctx.fill();
    ctx.strokeStyle = slot.disabled ? '#ff5a5a' : '#8effc1';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // placed spawners — anything "forced" (a specific, non-random pick) gets
  // a real preview of what it actually is; "generic"/"genericBoss" spawners
  // keep the plain glyph since what they resolve to isn't decided yet.
  const glyphSize = Math.max(8, Math.floor(TILE_PX * 0.6));
  for (const sp of spawnerMap.values()) {
    const px = sp.x * TILE_PX, py = sp.y * TILE_PX;
    const pv = sp.kind === 'forced' ? toolPreviewDef({ category: sp.category, kind: 'forced', specific: sp.specific }) : null;
    if (pv) {
      drawPreviewAt(ctx, px + TILE_PX / 2, py + TILE_PX / 2, pv);
      continue;
    }
    ctx.fillStyle = CATEGORY_COLORS[sp.category] || '#fff';
    ctx.fillRect(px + 1, py + 1, TILE_PX - 2, TILE_PX - 2);
    ctx.fillStyle = '#000';
    ctx.font = glyphSize + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(spawnerGlyph(sp), px + TILE_PX / 2, py + TILE_PX / 2 + 1);
  }

  if (hoverTile && !isPainting) {
    const { x, y } = hoverTile;
    if (y >= 0 && y < gridH && x >= 0 && x < gridW && currentGrid[y][x] === T_FLOOR) {
      const px = x * TILE_PX, py = y * TILE_PX;
      const tool = currentTool();
      ctx.globalAlpha = 0.6;
      if (tool.erase) {
        ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, TILE_PX - 4, TILE_PX - 4);
      } else {
        const pv = toolPreviewDef(tool);
        if (pv) {
          drawPreviewAt(ctx, px + TILE_PX / 2, py + TILE_PX / 2, pv);
        } else {
          ctx.fillStyle = CATEGORY_COLORS[tool.category] || '#fff';
          ctx.fillRect(px + 1, py + 1, TILE_PX - 2, TILE_PX - 2);
        }
      }
      ctx.globalAlpha = 1;
    }
  }
}

function canvasToTile(e){
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  return { x: Math.floor(mx / TILE_PX), y: Math.floor(my / TILE_PX) };
}

function currentTool(){
  if (selectedCategory === 'erase') return { erase: true };
  const sel = document.getElementById('specificSelect');
  const val = sel.value;
  if (selectedCategory === 'obstacle') return { category: 'obstacle', kind: 'forced', specific: val };
  if (val === 'generic') return { category: selectedCategory, kind: 'generic' };
  if (val === 'generic-boss') return { category: 'enemy', kind: 'genericBoss' };
  return { category: selectedCategory, kind: 'forced', specific: val };
}

/* ---------------- real previews for anything non-random ----------------
   A "forced" tool/spawner names one exact enemy/item/pickup/obstacle, so
   there's something concrete to show — unlike "generic"/"genericBoss",
   which only resolve to something specific once the game actually rolls
   it at runtime. toolPreviewDef() normalizes any forced selection into a
   small descriptor drawPreviewAt() knows how to render, reusing the exact
   same Util drawers the live game paints with (see utils.js). */
function toolPreviewDef(tool){
  if (!tool || tool.erase || tool.kind !== 'forced') return null;
  const specific = tool.specific;
  if (tool.category === 'enemy') {
    const def = ENEMY_TYPES[specific] || BOSS_TYPES[specific] || SUPERBOSSES[specific];
    return def ? { renderKind: 'enemy', def } : null;
  }
  if (tool.category === 'pickup') {
    if (specific.indexOf('chest:') === 0) return { renderKind: 'chest', chestKind: specific.split(':')[1] };
    return { renderKind: 'pickup', pickupKind: specific };
  }
  if (tool.category === 'item' || tool.category === 'shop' || tool.category === 'deal') {
    if (ITEMS[specific]) return { renderKind: 'item', def: ITEMS[specific] };
    // shop-only: can also force a trinket or a familiar (see room.js's
    // addShopSlot) — both share {color, icon, desc} with items, so the same
    // drawItemIcon/previewDescFor code paths already handle them for free
    if (tool.category === 'shop' && TRINKETS[specific]) return { renderKind: 'item', def: TRINKETS[specific] };
    if (tool.category === 'shop' && FAMILIAR_TYPES[specific]) return { renderKind: 'item', def: FAMILIAR_TYPES[specific] };
    return { renderKind: 'pickup', pickupKind: specific }; // shop-only: a priced pickup, not an item/trinket/familiar
  }
  if (tool.category === 'obstacle') {
    const def = OBSTACLES[specific];
    return def ? { renderKind: 'obstacle', kind: specific, def } : null;
  }
  return null;
}

// builds just enough of a Pickup-shaped object for Util.drawPickupIcon
function fakePickupFor(kindStr){
  if (kindStr.indexOf('coin:') === 0) {
    const tier = kindStr.split(':')[1];
    return { kind: 'coin', coin: COIN_TYPES.find((c) => c.id === tier) || COIN_TYPES[0], x: 0, y: 0 };
  }
  if (kindStr === 'pill') return { kind: 'pill', pillColor: PILL_COLORS[0].id, x: 0, y: 0 }; // pill color is rolled per-run in-game; just show one for preview
  if (kindStr === 'star') return { kind: 'star', starId: STAR_LIST[0].id, x: 0, y: 0 }; // star is rolled at spawn time; just show one for preview
  return { kind: kindStr, x: 0, y: 0 };
}

// draws a toolPreviewDef() descriptor centered at (x,y). `sizeHint` scales
// the enemy/obstacle sprite radius (which varies a lot def-to-def) to fit
// whatever canvas this is drawn on — defaults to the room canvas's own
// zoom level, but the small fixed-size tool-preview card passes its own.
function drawPreviewAt(ctx, x, y, pv, sizeHint){
  const s = sizeHint || TILE_PX;
  if (pv.renderKind === 'enemy') {
    const d = pv.def;
    const r = Util.clamp(d.radius, s * 0.3, s * 0.62);
    Util.drawBrownHumanoid(ctx, { x, y, radius: r, color: d.color, dark: d.dark, behavior: d.behavior, maxHp: 0 }, false);
  } else if (pv.renderKind === 'pickup') {
    const p = fakePickupFor(pv.pickupKind); p.x = x; p.y = y;
    Util.drawPickupIcon(ctx, p, 0);
  } else if (pv.renderKind === 'chest') {
    Util.drawChestIcon(ctx, { x, y, opened: false, def: CHEST_TYPES[pv.chestKind] || CHEST_TYPES.grey });
  } else if (pv.renderKind === 'item') {
    Util.drawItemIcon(ctx, x, y, pv.def);
  } else if (pv.renderKind === 'obstacle') {
    const r = Util.clamp(Util.obstacleRadius(pv.kind), s * 0.3, s * 0.62);
    const ob = { x, y, kind: pv.kind, tall: !!pv.def.tall, radius: r, hitFlash: 0, hp: pv.def.maxHp || 0, def: pv.def };
    Util.drawObstacle(ctx, ob, performance.now());
  }
}

/* ---------------- tool preview card (shows what you're about to place) ---------------- */
const toolPreviewCanvas = document.getElementById('toolPreviewCanvas');
const toolPreviewCtx = toolPreviewCanvas.getContext('2d');
const toolPreviewRow = document.getElementById('toolPreviewRow');
const toolPreviewNameEl = document.getElementById('toolPreviewName');
const toolPreviewDescEl = document.getElementById('toolPreviewDesc');

function previewDescFor(pv){
  if (pv.renderKind === 'enemy') {
    const d = pv.def;
    return 'HP ' + d.hp + ' · DMG ' + d.dmg + ' · SPD ' + d.speed + (d.behavior ? ' · ' + d.behavior : '');
  }
  if (pv.renderKind === 'item') return pv.def.desc || '';
  return '';
}

function updateToolPreviewCard(){
  const pv = toolPreviewDef(currentTool());
  toolPreviewCtx.clearRect(0, 0, toolPreviewCanvas.width, toolPreviewCanvas.height);
  if (!pv) { toolPreviewRow.style.display = 'none'; return; }
  toolPreviewRow.style.display = '';
  drawPreviewAt(toolPreviewCtx, toolPreviewCanvas.width / 2, toolPreviewCanvas.height / 2, pv, 40);
  const sel = document.getElementById('specificSelect');
  const opt = sel.options[sel.selectedIndex];
  toolPreviewNameEl.textContent = opt ? opt.textContent : '';
  toolPreviewDescEl.textContent = previewDescFor(pv);
}
document.getElementById('specificSelect').addEventListener('change', updateToolPreviewCard);

/* ---------------- drag-to-paint ---------------- */
let isPainting = false;
let paintErasing = false;
let paintGestureStarted = false;
let lastPaintedKey = null;

function paintAt(x, y, erasing){
  if (!currentGrid) return;
  if (y < 0 || y >= gridH || x < 0 || x >= gridW) return;
  if (currentGrid[y][x] !== T_FLOOR) {
    const info = document.getElementById('canvasInfo');
    if (!erasing) info.textContent = `(${x},${y}) is not open floor — pick a lit tile.`;
    return;
  }
  const key = x + ',' + y;
  if (key === lastPaintedKey) return;
  lastPaintedKey = key;
  if (!paintGestureStarted) { pushUndo(); paintGestureStarted = true; }

  const info = document.getElementById('canvasInfo');
  if (erasing) {
    spawnerMap.delete(key);
    info.textContent = `Erased (${x},${y}).`;
  } else {
    const tool = currentTool();
    if (tool.erase) {
      spawnerMap.delete(key);
      info.textContent = `Erased (${x},${y}).`;
    } else {
      const sp = { x, y, category: tool.category, kind: tool.kind };
      if (tool.specific) sp.specific = tool.specific;
      spawnerMap.set(key, sp);
      const label = tool.specific ? ':' + tool.specific : (tool.kind === 'genericBoss' ? ' (random boss)' : ' (generic)');
      info.textContent = `Placed ${tool.category}${label} at (${x},${y}).`;
    }
  }
  renderCanvas();
  updateStatsAndWarnings();
}

canvas.addEventListener('mousedown', (e) => {
  if (!currentGrid) return;
  e.preventDefault();
  const doorSlot = findDoorSlotAtEvent(e);
  if (doorSlot) { pushUndo(); toggleDoorSlot(doorSlot); return; }
  isPainting = true;
  paintErasing = e.button === 2;
  paintGestureStarted = false;
  lastPaintedKey = null;
  const { x, y } = canvasToTile(e);
  paintAt(x, y, paintErasing);
});
window.addEventListener('mouseup', () => {
  isPainting = false;
  paintGestureStarted = false;
  lastPaintedKey = null;
  renderCanvas();
});
canvas.addEventListener('mousemove', (e) => {
  const { x, y } = canvasToTile(e);
  hoverTile = { x, y };
  if (isPainting) paintAt(x, y, paintErasing);
  else renderCanvas();
});
canvas.addEventListener('mouseleave', () => { hoverTile = null; renderCanvas(); });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

/* ---------------- stats + warnings ---------------- */
function updateStatsAndWarnings(){
  const counts = { enemy:0, pickup:0, item:0, deal:0, shop:0, obstacle:0 };
  for (const sp of spawnerMap.values()) if (counts[sp.category] !== undefined) counts[sp.category]++;
  document.getElementById('statsReadout').textContent =
    `${counts.enemy} enemy · ${counts.pickup} pickup · ${counts.item} item · ${counts.deal} deal · ${counts.shop} shop · ${counts.obstacle} obstacle`;

  const roomType = document.getElementById('roomType').value;
  const warnEl = document.getElementById('roomWarning');
  const hasBossSpawner = Array.from(spawnerMap.values()).some((sp) => {
    if (sp.category !== 'enemy') return false;
    if (sp.kind === 'genericBoss') return true;
    if (sp.kind === 'forced' && sp.specific) {
      const id = resolveEnemyTypeId(sp.specific);
      return !!(BOSS_TYPES[id] || SUPERBOSSES[id]);
    }
    return false;
  });
  warnEl.className = 'warn';
  if ((roomType === 'normal' || roomType === 'boss') && counts.enemy === 0) {
    warnEl.textContent = 'No enemy spawner placed — the game will auto-unlock this room\'s doors with nothing to fight.';
  } else if (roomType === 'boss' && !hasBossSpawner) {
    warnEl.textContent = 'No boss spawner ("Random Boss", or a forced specific boss) placed — a random boss will be forced in as a fallback.';
  } else if (roomType === 'petshop') {
    warnEl.textContent = 'A free familiar pedestal is always added automatically — anything placed here is extra decoration.';
    warnEl.className = 'ok';
  } else if (roomType === 'curse') {
    warnEl.textContent = 'Nothing is added automatically — design this room\'s contents entirely by hand. Doors already cost half a heart to cross, both ways, regardless of what\'s placed here.';
    warnEl.className = 'ok';
  } else if (roomType === 'sacrifice') {
    warnEl.textContent = 'A Spike fixture is always added automatically at the room\'s center if you don\'t place one yourself.';
    warnEl.className = 'ok';
  } else if (roomType === 'vault') {
    warnEl.textContent = 'Nothing is added automatically — design this room\'s contents entirely by hand. Key-locked like treasure/shop.';
    warnEl.className = 'ok';
  } else if (roomType === 'challenge') {
    warnEl.textContent = 'A free item pedestal is always added automatically at the room\'s center. Taking it locks the room for 5 waves of 3-5 enemies each — keep the layout open, since waves spawn from the center.';
    warnEl.className = 'ok';
  } else if (roomType === 'crystal') {
    warnEl.textContent = 'Nothing is added automatically — design this room\'s contents entirely by hand. Item spawners here draw from the \'crystal\' pool.';
    warnEl.className = 'ok';
  } else if (roomType === 'sombra') {
    warnEl.textContent = 'Nothing is added automatically — design this room\'s contents entirely by hand. Use the "Deal" category for a heart-cost item pedestal (the \'sombra\' pool); item spawners here also draw from \'sombra\'.';
    warnEl.className = 'ok';
  } else if (roomType === 'shrine') {
    warnEl.textContent = 'A shrine pedestal (coin-cost, not heart-cost) is always added automatically if none is placed — anything placed here is extra decoration.';
    warnEl.className = 'ok';
  } else if (roomType === 'arcade') {
    warnEl.textContent = '2-4 random filly/machine fixtures are always auto-placed, scattered around the room — anything placed here is extra decoration. Doors are coin-toll gated (1c), not key-locked.';
    warnEl.className = 'ok';
  } else {
    warnEl.textContent = '';
  }
}
document.getElementById('roomType').addEventListener('change', updateStatsAndWarnings);

/* ---------------- tool palette ---------------- */
function populateSpecificSelect(){
  const sel = document.getElementById('specificSelect');
  const label = document.getElementById('specificLabel');
  sel.innerHTML = '';
  if (selectedCategory === 'erase') {
    sel.style.display = 'none'; label.style.display = 'none';
    document.getElementById('toolHint').textContent = 'Click/drag over a placed spawner to remove it (or right-click-drag with any tool).';
    updateToolPreviewCard();
    return;
  }
  sel.style.display = ''; label.style.display = '';
  document.getElementById('toolHint').textContent = 'Click-drag to paint tiles. Right-click-drag always erases. Ctrl+Z/Ctrl+Y undo/redo.';

  const opts = [];
  if (selectedCategory !== 'obstacle') opts.push({ value:'generic', label:'Random (generic)' });
  if (selectedCategory === 'enemy') {
    opts.push({ value:'generic-boss', label:'Random Boss (this floor)' });
    for (const k in ENEMY_TYPES) opts.push({ value:k, label: ENEMY_TYPES[k].name });
    for (const k in BOSS_TYPES) opts.push({ value:k, label: BOSS_TYPES[k].name + ' (boss)' });
    for (const k in SUPERBOSSES) opts.push({ value:k, label: SUPERBOSSES[k].name + ' (superboss)' });
  } else if (selectedCategory === 'pickup') {
    opts.push({ value:'coin:penny', label:'Coin: Penny' });
    opts.push({ value:'coin:nickel', label:'Coin: Nickel' });
    opts.push({ value:'coin:dime', label:'Coin: Dime' });
    opts.push({ value:'coin:luckypenny', label:'Coin: Lucky Penny' });
    opts.push({ value:'key', label:'Key' });
    opts.push({ value:'doublekey', label:'Double Key' });
    opts.push({ value:'goldkey', label:'Gold Key (unlimited keys, this floor)' });
    opts.push({ value:'bomb', label:'Bomb' });
    opts.push({ value:'doublebomb', label:'Double Bomb' });
    opts.push({ value:'goldbomb', label:'Gold Bomb (unlimited bombs, this floor)' });
    opts.push({ value:'heartRed', label:'Red Heart' });
    opts.push({ value:'heartBlue', label:'Blue Heart' });
    opts.push({ value:'halfheartRed', label:'Half Red Heart' });
    opts.push({ value:'halfheartBlue', label:'Half Blue Heart' });
    opts.push({ value:'doubleheart', label:'Double Heart (+2)' });
    opts.push({ value:'heartContainer', label:'Heart Container' });
    opts.push({ value:'eternalheart', label:'Eternal Heart (survive a floor → container)' });
    opts.push({ value:'sack', label:'Sack (3 random pickups)' });
    opts.push({ value:'battery', label:'Battery (full active charge)' });
    opts.push({ value:'trashbag', label:'Trash Bag (a friendly fly familiar)' });
    opts.push({ value:'minibattery', label:'Mini Battery (+2 charge)' });
    opts.push({ value:'pill', label:'Pill (unknown effect)' });
    opts.push({ value:'star', label:'Star (random named effect)' });
    opts.push({ value:'chest:grey', label:'Chest: Grey (opens free)' });
    opts.push({ value:'chest:gold', label:'Chest: Gold (needs a key)' });
    opts.push({ value:'chest:stone', label:'Chest: Stone (needs a bomb)' });
    opts.push({ value:'chest:cursed', label:'Chest: Cursed (costs 2 hearts)' });
  } else if (selectedCategory === 'item') {
    for (const it of ITEM_LIST) opts.push({ value: it.id, label: it.name + ' (' + it.type + ')' });
  } else if (selectedCategory === 'deal') {
    // devil-deal pedestal — costs 1 heart to take, drawn from the 'sombra'
    // pool (or a forced specific item, still at the same heart cost). See
    // room.js's addDealPedestal / game.js's updateItemPedestal.
    for (const it of ITEM_LIST) if (it.pools && it.pools.includes('sombra')) opts.push({ value: it.id, label: it.name + ' (' + it.type + ')' });
  } else if (selectedCategory === 'shop') {
    // shop slots can force an item, a trinket, a familiar, or a priced
    // pickup — see room.js's addShopSlot, which already supports all four;
    // this used to only expose items+pickups here
    for (const it of ITEM_LIST) opts.push({ value: it.id, label: it.name + ' (' + it.type + ')' });
    for (const t of TRINKET_LIST) opts.push({ value: t.id, label: t.name + ' (trinket)' });
    for (const f of FAMILIAR_LIST) opts.push({ value: f.id, label: f.name + ' (familiar)' });
    for (const p of SHOP_PICKUP_PRICES) opts.push({ value: p.kind, label: p.kind + ' pickup' });
  } else if (selectedCategory === 'obstacle') {
    opts.push({ value:'rock', label:'Rock (bombable, flyable)' });
    opts.push({ value:'hardrock', label:'Hard Rock (permanent, flyable)' });
    opts.push({ value:'pit', label:'Pitfall (full-tile, flyable)' });
    opts.push({ value:'tallrock', label:'Tall Rock (bombable, blocks flight)' });
    opts.push({ value:'tallhardrock', label:'Tall Hard Rock (permanent, blocks flight)' });
    opts.push({ value:'cactus', label:'Cactus (hazard, hurts on touch)' });
    opts.push({ value:'yellowfire', label:'Yellow Fire (3 hits to douse, 10% heart)' });
    opts.push({ value:'redfire', label:'Red Fire (3 hits to douse, spits fireballs)' });
    opts.push({ value:'bluefire', label:'Blue Fire (spits bolts, attack-proof — only a bomb douses it)' });
    opts.push({ value:'purplefire', label:'Purple Fire (bolts home in on you, attack-proof — only a bomb douses it)' });
    opts.push({ value:'greenfire', label:'Green Fire (3 hits to douse, fires a 3-bolt fan)' });
    opts.push({ value:'whitefire', label:'White Fire (bolts explode on burnout, attack-proof — only a bomb douses it)' });
    opts.push({ value:'blackfire', label:'Black Fire (never aims, spins a bolt around a full circle, attack-proof — only a bomb douses it)' });
    opts.push({ value:'spike', label:'Sacrifice Spike (full heart, reward trigger — sacrifice rooms)' });
    opts.push({ value:'spiketrap', label:'Spike Trap (hazard, no reward)' });
    opts.push({ value:'spikedrock', label:'Spiked Rock (hazard AND solid, bombable)' });
    opts.push({ value:'tintedrock', label:'Tinted Rock (rock reskin — normally a 2% rock swap, reward on bomb)' });
    opts.push({ value:'thornbush', label:'Thorn Bush (hazard, attack-proof — only a bomb clears it — Whitetail Forest only)' });
    opts.push({ value:'luckcrystal', label:'Luck Crystal (rock reskin, luck-flavored reward on bomb)' });
    opts.push({ value:'movingspike', label:'Moving Spike (hazard, patrols the wall/rocks it starts beside)' });
    opts.push({ value:'sandtrap', label:'Sand Trap (freezes the player for 0.5s, no damage)' });
    opts.push({ value:'mud', label:'Mud (half speed while standing on it, walkable)' });
    opts.push({ value:'turretn', label:'Turret — North (fires up, every 1s, infinite range)' });
    opts.push({ value:'turrete', label:'Turret — East (fires right, every 1s, infinite range)' });
    opts.push({ value:'turrets', label:'Turret — South (fires down, every 1s, infinite range)' });
    opts.push({ value:'turretw', label:'Turret — West (fires left, every 1s, infinite range)' });
    opts.push({ value:'turretplus', label:'Turret — Plus (4 shots N/E/S/W at once, every 1s)' });
    opts.push({ value:'turretx', label:'Turret — X (4 diagonal shots at once, every 1s)' });
    opts.push({ value:'turrettarget', label:'Turret — Targeting (aims at the player, every 1s)' });
    opts.push({ value:'bombbarrel', label:'Bomb Barrel (solid, 3 hits or a nearby blast detonates it)' });
    opts.push({ value:'pushablebombbarrel', label:'Pushable Bomb Barrel (same, but you can shove it around)' });
  }
  for (const o of opts) {
    const opt = document.createElement('option');
    opt.value = o.value; opt.textContent = o.label;
    sel.appendChild(opt);
  }
  updateToolPreviewCard();
}

const categoryBtns = Array.from(document.querySelectorAll('#categoryBtns button'));
categoryBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    selectedCategory = btn.dataset.cat;
    categoryBtns.forEach((b) => b.classList.toggle('active', b === btn));
    populateSpecificSelect();
  });
});
categoryBtns[0].classList.add('active');

/* ---------------- zoom ---------------- */
const zoomBtns = Array.from(document.querySelectorAll('#zoomBtns button'));
zoomBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    TILE_PX = parseInt(btn.dataset.px, 10);
    zoomBtns.forEach((b) => b.classList.toggle('active', b === btn));
    rebuildGrid();
  });
});
zoomBtns[1].classList.add('active'); // default M (16px)

/* ---------------- floor restriction controls ---------------- */
// door toggling now happens by clicking the markers drawn on the canvas
// itself (see findDoorSlotAtEvent/toggleDoorSlot) — one per door-eligible
// block edge, rather than 4 room-wide buttons.
function renderFloorButtons(){
  const el = document.getElementById('floorBtns');
  el.innerHTML = '';
  for (let i = 0; i < MAX_FLOORS; i++) {
    const btn = document.createElement('button');
    btn.textContent = 'Floor ' + (i + 1);
    btn.className = floorState[i] ? 'active' : '';
    btn.addEventListener('click', () => {
      pushUndo();
      floorState[i] = !floorState[i];
      btn.classList.toggle('active', floorState[i]);
    });
    el.appendChild(btn);
  }
}

/* ---------------- reset buttons ---------------- */
document.getElementById('resetSpawnersBtn').addEventListener('click', () => {
  pushUndo();
  spawnerMap.clear();
  renderCanvas();
  updateStatsAndWarnings();
});
document.getElementById('resetAllBtn').addEventListener('click', () => {
  pushUndo();
  workingMask = makeEmptyMask();
  workingMask[0][0] = 1;
  spawnerMap.clear();
  disabledDoorSlots.clear();
  floorState = new Array(MAX_FLOORS).fill(true);
  renderFloorButtons();
  renderBlockGrid();
  rebuildGrid();
});

/* ---------------- import ---------------- */
document.getElementById('importBtn').addEventListener('click', () => {
  const hintEl = document.getElementById('importHint');
  const raw = document.getElementById('importArea').value.trim();
  if (!raw) { hintEl.textContent = 'Paste an exported room line first.'; hintEl.className = 'warn'; return; }

  let jsonText = raw;
  let detectedType = null;
  const wrapped = raw.match(/ROOM_TEMPLATES\.(\w+)\.push\(([\s\S]*)\)\s*;?\s*$/);
  if (wrapped) { detectedType = wrapped[1]; jsonText = wrapped[2]; }

  let obj;
  try { obj = JSON.parse(jsonText); }
  catch (err) { hintEl.textContent = 'Could not parse that as JSON — paste the exported line as-is.'; hintEl.className = 'err'; return; }
  if (!obj || !Array.isArray(obj.m)) { hintEl.textContent = 'That doesn\'t look like a room template (missing "m").'; hintEl.className = 'err'; return; }

  const hasContent = spawnerMap.size > 0 || workingMask.flat().reduce((a, b) => a + b, 0) > 1;
  if (hasContent && !confirm('Load this room into the editor? It will replace what\'s on the canvas (Undo will bring it back).')) return;

  pushUndo();

  workingMask = makeEmptyMask();
  for (let r = 0; r < obj.m.length && r < 4; r++) {
    for (let c = 0; c < obj.m[r].length && c < 4; c++) {
      if (obj.m[r][c]) workingMask[r][c] = 1;
    }
  }

  spawnerMap.clear();
  for (const rawSp of (obj.s || [])) {
    const sp = decodeSpawner(rawSp);
    spawnerMap.set(sp.x + ',' + sp.y, sp);
  }

  floorState = new Array(MAX_FLOORS).fill(true);
  if (obj.f) { floorState.fill(false); obj.f.forEach((i) => { if (i >= 0 && i < MAX_FLOORS) floorState[i] = true; }); }

  disabledDoorSlots.clear();
  if (obj.d) {
    if (typeof obj.d === 'string') {
      // legacy room-wide format — disable every currently-eligible slot facing that direction
      const slots = computeDoorSlots(workingMask, 0, 0, null, null);
      for (const s of slots) if (obj.d.includes(s.dir)) disabledDoorSlots.add(s.localCol + ',' + s.localRow + ',' + s.dir);
    } else {
      for (const entry of obj.d) for (const ch of entry[2]) disabledDoorSlots.add(entry[0] + ',' + entry[1] + ',' + ch);
    }
  }

  if (detectedType) document.getElementById('roomType').value = detectedType;

  renderBlockGrid();
  renderFloorButtons();
  rebuildGrid();
  hintEl.textContent = 'Loaded' + (detectedType ? ' as "' + detectedType + '"' : ' — double check the Type dropdown, it wasn\'t in the pasted data') + '.';
  hintEl.className = 'ok';
});

/* ---------------- export (compact format — see data/roomTemplates/core.js header) ---------------- */
const SPAWNER_CATEGORY_ENCODE = { enemy:'e', pickup:'p', item:'i', deal:'d', shop:'s', obstacle:'o' };
function encodeSpawner(sp){
  const cat = SPAWNER_CATEGORY_ENCODE[sp.category] || sp.category;
  if (sp.category === 'obstacle') return [sp.x, sp.y, 'o', sp.specific];
  if (sp.kind === 'generic') return [sp.x, sp.y, cat, 'g'];
  if (sp.kind === 'genericBoss') return [sp.x, sp.y, cat, 'b'];
  return [sp.x, sp.y, cat, 'f', sp.specific];
}

function exportTemplate(){
  const hintEl = document.getElementById('exportHint');
  const trimmed = trimMaskWithOffset(workingMask);
  if (!trimmed) { hintEl.textContent = 'Toggle at least one block first.'; return; }

  const blockCount = trimmed.mask.flat().reduce((a, b) => a + b, 0);
  let hint = '';
  if (blockCount > 4) hint += 'More than 4 blocks (outside the usual 1-4 range). ';
  if (blockCount > 1 && !isMaskConnected(trimmed.mask)) hint += 'Warning: blocks are not fully connected. ';

  const doorField = disabledDoorsField(trimmed.offC, trimmed.offR, trimmed.mask);
  const fakeNode = { shape: { mask: trimmed.mask }, doorSlots: buildPreviewDoorSlots(trimmed.mask, doorField) };
  const built = buildRoomTiles(fakeNode);

  const offX = trimmed.offC * BLOCK, offY = trimmed.offR * BLOCK;
  const spawners = [];
  let dropped = 0;
  for (const sp of spawnerMap.values()) {
    const nx = sp.x - offX, ny = sp.y - offY;
    if (ny < 0 || ny >= built.tileH || nx < 0 || nx >= built.tileW || built.grid[ny][nx] !== T_FLOOR) { dropped++; continue; }
    spawners.push(encodeSpawner({ x: nx, y: ny, category: sp.category, kind: sp.kind, specific: sp.specific }));
  }
  if (dropped) hint += dropped + ' spawner(s) fell outside the trimmed shape and were dropped. ';
  hintEl.textContent = hint;

  const roomType = document.getElementById('roomType').value;
  const template = { m: trimmed.mask };
  if (spawners.length) template.s = spawners;
  if (floorState.some((v) => !v)) template.f = floorState.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  if (doorField.length) template.d = doorField;

  const text = 'ROOM_TEMPLATES.' + roomType + '.push(' + JSON.stringify(template) + ');';
  document.getElementById('exportArea').value = text;
}
document.getElementById('exportBtn').addEventListener('click', exportTemplate);
document.getElementById('copyBtn').addEventListener('click', () => {
  const ta = document.getElementById('exportArea');
  if (!ta.value) exportTemplate();
  ta.select();
  try { document.execCommand('copy'); } catch (e) { /* ignore */ }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).catch(() => {});
});

/* ---------------- init ---------------- */
renderFloorButtons();
renderBlockGrid();
rebuildGrid();
populateSpecificSelect();
updateUndoRedoButtons();
updateStatsAndWarnings();

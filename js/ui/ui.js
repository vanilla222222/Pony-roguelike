'use strict';
/* ============================================================
   ui.js — HUD, minimap, toasts, class-select menu
   ============================================================ */

function roomTypeColor(type){
  switch (type) {
    case 'start': return '#4fd1c5';
    case 'boss': return '#e35b6a';
    case 'treasure': return '#e3c15b';
    case 'shop': return '#8b5cf6';
    case 'secret': return '#c9a3ff';
    case 'petshop': return '#5ba050';
    case 'curse': return '#8a2e46';
    case 'sacrifice': return '#4a2458';
    case 'vault': return '#3a6e8a';
    case 'challenge': return '#a85a2e';
    case 'crystal': return '#8fd6f0';
    case 'sombra': return '#7a1f2e';
    case 'star': return '#f5a623';
    case 'cpathgate': return '#4a8f7a'; // the C-branch storm drain (floor 2 only)
    case 'planetarium': return '#6a5ce0'; // the D-branch planetarium (floor 3 only) — matches Theme.door.planetarium
    case 'shrine': return '#d4af37'; // matches votivecoin's icon color
    case 'arcade': return '#c93f6b'; // matches Theme.door.arcade's open color
    default: return '#8b86a8';
  }
}

const ROOM_TYPE_ICON = {
  start: '🏠',
  boss: '💀',
  treasure: '💰',
  shop: '🛒',
  secret: '❓',
  petshop: '🐾',
  curse: '🩸',
  sacrifice: '🔪',
  vault: '🏦',
  challenge: '⚔️',
  crystal: '💎',
  sombra: '👿',
  star: '⭐',
  cpathgate: '🕳️',
  planetarium: '🔭',
  shrine: '🕯️',
  arcade: '🎰',
};

// friendly labels for the minimap legend toggle (see toggleMinimapLegend
// below) — same room types as ROOM_TYPE_ICON, just spelled out
const ROOM_TYPE_LEGEND = {
  start: 'Start Room', boss: 'Boss Room', treasure: 'Treasure Room', shop: 'Shop',
  secret: 'Secret Room', petshop: 'Pet Shop', curse: 'Cursed Room', sacrifice: 'Sacrifice Room',
  vault: 'Vault (key-locked)', challenge: 'Challenge Room', crystal: 'Crystal Room (blessing)', sombra: 'Sombra Room (devil deal)',
  star: 'Star Room (key-locked, pick 1 of 2)',
  cpathgate: 'Storm Drain (floor 2 only — takes the C-branch)',
  planetarium: 'Planetarium (floor 3 only — takes the D-branch)',
  shrine: 'Shrine (blessing paid in coins)',
  arcade: 'Arcade (coin-toll gambling machines)',
};

// the small "?" button beside the minimap — a lot of the room-type icons
// (petshop/vault/crystal/sombra especially) aren't self-explanatory the
// first time you see them on the map, before ever having walked into one
function toggleMinimapLegend(){
  const el = document.getElementById('minimapLegend');
  if (!el) return;
  if (!el.classList.contains('hidden')) { el.classList.add('hidden'); return; }
  el.innerHTML = '';
  for (const type in ROOM_TYPE_LEGEND) {
    const row = document.createElement('div');
    row.className = 'legend-row';
    row.textContent = ROOM_TYPE_ICON[type] + ' ' + ROOM_TYPE_LEGEND[type];
    el.appendChild(row);
  }
  const ring = document.createElement('div');
  ring.className = 'legend-row';
  ring.textContent = '◌ pulsing ring — the room you\'re standing in';
  el.appendChild(ring);
  el.classList.remove('hidden');
}

// average block position of a room's mask, in global block coords — used to
// place one icon/marker per room regardless of how many blocks it spans.
// NOTE: block squares are drawn centered directly on their integer (bx,by)
// — see the fillRect below — so this must NOT add a +0.5 offset, or the
// marker ends up drawn half a cell off from the room it's meant to label.
function roomCentroidBlock(node){
  const mask = node.shape.mask;
  let sx = 0, sy = 0, n = 0;
  for (let r = 0; r < mask.length; r++) {
    for (let c = 0; c < mask[r].length; c++) {
      if (!mask[r][c]) continue;
      sx += node.gx + c; sy += node.gy + r; n++;
    }
  }
  return n ? { bx: sx / n, by: sy / n } : { bx: node.gx, by: node.gy };
}

// everything still uncollected in a visited room — pedestal items/trinkets/
// familiars, loose pickups (coins, hearts, keys, bombs, sacks...), unopened
// chests — each becomes one small icon in the minimap's loot marker below.
function roomLootEntries(node){
  const entries = [];
  if (node.itemPedestals) for (const p of node.itemPedestals) if (!p.taken) entries.push({ kind:'item', item: p.item });
  if (node.pickups) for (const p of node.pickups) if (!p.collected) entries.push({ kind:'pickup', kindId: p.kind, coin: p.coin, pillColor: p.pillColor, starId: p.starId });
  if (node.chests) for (const c of node.chests) if (!c.opened) entries.push({ kind:'chest', def: c.def });
  return entries;
}

function drawLootEntry(ctx, entry, x, y){
  if (entry.kind === 'item') Util.drawItemIcon(ctx, x, y, entry.item);
  else if (entry.kind === 'pickup') Util.drawPickupIcon(ctx, { kind: entry.kindId, coin: entry.coin, pillColor: entry.pillColor, starId: entry.starId, x, y }, 0);
  else if (entry.kind === 'chest') Util.drawChestIcon(ctx, { x, y, opened: false, def: entry.def });
}

// draws every entry as a small real icon (reusing the exact same drawers the
// live game uses — see utils.js) in a grid capped at 3 columns, centered on
// (cx,cy) regardless of row/column count. Icons are drawn at a fraction of
// their normal in-game size via a canvas transform, since the icon drawers
// themselves are sized for the 32px-tile game canvas, not a 13px map cell.
function drawLootMarkers(ctx, entries, cx, cy){
  if (!entries.length) return;
  const cols = Math.min(3, entries.length);
  const rows = Math.ceil(entries.length / cols);
  const pitch = 9, scale = 0.4;
  const gridW = (cols - 1) * pitch, gridH = (rows - 1) * pitch;
  ctx.save();
  ctx.translate(cx - gridW / 2, cy - gridH / 2);
  ctx.scale(scale, scale);
  entries.forEach((entry, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    drawLootEntry(ctx, entry, (col * pitch) / scale, (row * pitch) / scale);
  });
  ctx.restore();
}

// updateHUD runs every single tick (see game.js's update(), including its
// freeze-timer and hit-stop early-return paths), but the values behind the
// hearts strip and the coin/key/bomb counters only change occasionally. These
// remember what was last actually drawn so an unchanged frame can skip the
// hearts canvas clear+redraw and the DOM text/class writes entirely. Purely a
// redundant-work skip — any real change still redraws exactly as it did before.
const _hudCache = { hearts: null, coins: null, keys: null, bombs: null, leftPanel: null, familiars: null, turrets: null, minions: null, synergy: null };

// Phase 6a overhaul — one entry per synergy badge span (index.html's
// #synergyBar), the player.<flag>Active field it reads (see items.js's
// recalcPlayerStats), matching id -> flag pairs so updateHUD can loop
// instead of repeating the same 5-way toggle by hand.
const SYNERGY_BADGES = [
  { id: 'synEcosystem', flag: 'ecosystemSetActive' },
  { id: 'synRotRuin', flag: 'rotAndRuinActive' },
  { id: 'synMarksman', flag: 'marksmansEyeActive' },
  { id: 'synPackBond', flag: 'packBondActive' },
  { id: 'synTwinFangs', flag: 'twinFangsActive' },
];

// one "Name — description" block for the left panel, or a muted "None" line.
// thing is any {name, desc, icon} — item, trinket or star all qualify.
function hudPanelEntry(label, thing){
  const body = thing
    ? '<div class="hudPanelName">' + (thing.icon ? thing.icon + ' ' : '') + thing.name + '</div>'
      + '<div class="hudPanelDesc">' + thing.desc + '</div>'
    : '<div class="hudPanelEmpty">None</div>';
  return '<div class="hudPanelTitle">' + label + '</div>' + body;
}

// the pill-identification readout: every color you've already identified this
// run, spelled out with its effect, plus a single tally line for the rest.
// PILL_COLORS is 100 entries long (see data.js) — listing them all as "???" would
// bury the handful that actually matter, so the unknowns collapse to a count.
function hudPillReadout(game){
  let html = '<div class="hudPanelTitle">Pills</div>';
  let unknown = 0, known = 0;
  for (const c of PILL_COLORS) {
    if (!(game.pillIdentified && game.pillIdentified[c.id])) { unknown++; continue; }
    const effect = PILL_EFFECTS[game.pillEffectMap[c.id]];
    if (!effect) { unknown++; continue; }
    known++;
    html += '<div class="hudPillRow">'
      + '<span class="hudPillSwatch" style="background:' + c.color + '"></span>'
      + '<span class="hudPillName">' + c.name + '</span>'
      + '<span class="hudPillEffect ' + (effect.good ? 'good' : 'bad') + '" title="' + effect.desc + '">' + effect.name + '</span>'
      + '</div>';
  }
  if (!known) html += '<div class="hudPanelEmpty">None identified yet</div>';
  if (unknown) html += '<div class="hudPillRow"><span class="hudPillEffect unknown">??? — ' + unknown + ' unknown</span></div>';
  return html;
}

function updateHUD(game){
  const player = game.player;

  let canvas = document.getElementById('heartsCanvas');
  let freshCanvas = false;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'heartsCanvas';
    canvas.height = 22;
    document.getElementById('hearts').appendChild(canvas);
    freshCanvas = true; // a brand-new canvas is blank, so it always needs a draw
  }
  const heartsKey = player.redMax + '|' + player.redCurrent + '|' + player.blueCurrent + '|' + (player.eternalHeart ? 1 : 0);
  if (freshCanvas || heartsKey !== _hudCache.hearts) {
    _hudCache.hearts = heartsKey;
    const blueWhole = Math.ceil(player.blueCurrent);
    // Math.ceil: a fractional redMax (Kirin starts at 0.5, an Eternal Heart
    // adds another 0.5) still owns a trailing half pip, and `i < redMax`
    // alone would silently never draw it
    const redPips = Math.ceil(player.redMax);
    canvas.width = Math.max(1, (redPips + blueWhole) * 20);
    const hctx = canvas.getContext('2d');
    hctx.clearRect(0, 0, canvas.width, canvas.height);
    let idx = 0;
    for (let i = 0; i < redPips; i++) {
      const frac = Util.clamp(player.redCurrent - i, 0, 1);
      // the Eternal Heart's temporary pip is always the trailing one — drawn
      // pale so it reads as "not really yours yet" (entities.js takeDamage)
      const eternal = player.eternalHeart && i === redPips - 1;
      Util.drawHeart(hctx, idx * 20, 2, 18, frac, eternal ? '#e8e8e8' : '#e35b6a', eternal ? '#2a2430' : '#160b0d');
      idx++;
    }
    let remBlue = player.blueCurrent;
    while (remBlue > 0.001) {
      const frac = Util.clamp(remBlue, 0, 1);
      Util.drawHeart(hctx, idx * 20, 2, 18, frac, '#5b9ee3', '#0b1420');
      remBlue -= 1; idx++;
    }
  }

  // a pulsing red edge-vignette once you're down to a heart or less — the
  // heart display itself is easy to lose track of mid-fight, this isn't
  const canvasWrap = document.getElementById('canvasWrap');
  if (canvasWrap) canvasWrap.classList.toggle('low-health', player.totalHearts() <= 1);

  if (player.coins !== _hudCache.coins) {
    _hudCache.coins = player.coins;
    document.querySelector('#resCoins b').textContent = Util.formatNum(player.coins);
  }
  const keysEl = document.getElementById('resKeys'), bombsEl = document.getElementById('resBombs');
  // the '∞' forms fold the unlimited-floor flags into the cached string, so a
  // flag flipping is itself a change the dirty-check catches
  const keysText = player.unlimitedKeysFloor ? '∞' : String(player.keys);
  if (keysText !== _hudCache.keys) {
    _hudCache.keys = keysText;
    keysEl.querySelector('b').textContent = keysText;
    // a quiet "you're out" cue instead of just a silent 0 — see style.css .res-empty
    keysEl.classList.toggle('res-empty', !player.unlimitedKeysFloor && player.keys === 0);
  }
  const bombsText = player.unlimitedBombsFloor ? '∞' : String(player.bombs);
  if (bombsText !== _hudCache.bombs) {
    _hudCache.bombs = bombsText;
    bombsEl.querySelector('b').textContent = bombsText;
    bombsEl.classList.toggle('res-empty', !player.unlimitedBombsFloor && player.bombs === 0);
  }
  // floorLabelFor/floorNameFor (stages.js) so a C-branch run reads '7C — Rainforest ...' rather than the normal floor of the same floorNum
  document.querySelector('#resFloor b').textContent = floorLabelFor(game.dungeon.floorNum, game.floorPath) + ' — ' + floorNameFor(game.dungeon.floorNum, game.floorPath);

  // Engineer Pony turret / Changeling Queen minion counters — only visible
  // for the class that can actually use them (player.canBuildTurrets /
  // player.summonsChangelings, see data/core.js's CLASSES), hidden via the
  // shared .hidden utility class for every other class.
  const turretsEl = document.getElementById('resTurrets');
  if (turretsEl) {
    turretsEl.classList.toggle('hidden', !player.canBuildTurrets);
    if (player.canBuildTurrets) {
      const count = (game.currentRoom.playerTurrets || []).length;
      const turretsText = count + '/3';
      if (turretsText !== _hudCache.turrets) {
        _hudCache.turrets = turretsText;
        turretsEl.querySelector('b').textContent = turretsText;
      }
    }
  }
  const minionsEl = document.getElementById('resMinions');
  if (minionsEl) {
    minionsEl.classList.toggle('hidden', !player.summonsChangelings);
    if (player.summonsChangelings) {
      const minionsText = (player.changelingMinions || []).length + '/' + player.maxChangelingMinions;
      if (minionsText !== _hudCache.minions) {
        _hudCache.minions = minionsText;
        minionsEl.querySelector('b').textContent = minionsText;
      }
    }
  }

  // synergy badges — dirty-checked as one joined key, same shape as the
  // familiar bank's famKey above
  const synKey = SYNERGY_BADGES.map(s => player[s.flag] ? '1' : '0').join('');
  if (synKey !== _hudCache.synergy) {
    _hudCache.synergy = synKey;
    for (const s of SYNERGY_BADGES) {
      const el = document.getElementById(s.id);
      if (el) el.classList.toggle('active', !!player[s.flag]);
    }
  }

  const iconEl = document.getElementById('activeItemIcon');
  const pipsEl = document.getElementById('activeItemPips');
  if (player.activeItem) {
    iconEl.textContent = player.activeItem.icon;
    iconEl.title = player.activeItem.name + ': ' + player.activeItem.desc;
    pipsEl.innerHTML = '';
    for (let i = 0; i < player.activeItem.maxCharge; i++) {
      const pip = document.createElement('div');
      pip.className = 'pip' + (i < player.activeCharge ? ' full' : '');
      pipsEl.appendChild(pip);
    }
    // a soft pulse once it's actually usable (E), so "ready" reads at a glance
    // instead of having to count pips — see style.css .ready-glow
    iconEl.classList.toggle('ready-glow', player.activeCharge >= player.activeItem.maxCharge);
  } else {
    iconEl.textContent = '—'; iconEl.title = ''; pipsEl.innerHTML = '';
    iconEl.classList.remove('ready-glow');
  }

  const trinketEl = document.getElementById('trinketIcon');
  if (trinketEl) {
    const trinket = player.trinketId ? TRINKETS[player.trinketId] : null;
    trinketEl.textContent = trinket ? trinket.icon : '—';
    trinketEl.title = trinket ? (trinket.name + ': ' + trinket.desc) : 'No trinket equipped';
    trinketEl.classList.toggle('empty', !trinket);
  }

  const pillEl = document.getElementById('pillIcon');
  if (pillEl) {
    const colorId = player.pillPocket;
    const color = colorId ? PILL_COLORS_BY_ID[colorId] : null;
    pillEl.textContent = color ? '💊' : '—';
    pillEl.style.color = color ? color.color : '';
    if (color) {
      const known = game.pillIdentified && game.pillIdentified[colorId];
      pillEl.title = known ? (color.name + ': ' + PILL_EFFECTS[game.pillEffectMap[colorId]].name + ' (Q to use)') : (color.name + ': unknown effect (Q to use)');
    } else {
      pillEl.title = 'No pill held';
    }
    pillEl.classList.toggle('empty', !color);
    pillEl.classList.toggle('ready-glow', !!color);
  }

  const starEl = document.getElementById('starIcon');
  if (starEl) {
    const starId = player.starPocket;
    const star = starId ? STAR_TYPES[starId] : null;
    starEl.textContent = star ? star.icon : '—';
    starEl.style.color = star ? star.color : '';
    starEl.title = star ? (star.name + ': ' + star.desc + ' (R to use)') : 'No star held';
    starEl.classList.toggle('empty', !star);
    starEl.classList.toggle('ready-glow', !!star);
  }

  const cooldown = player.attackType === 'melee' ? player.meleeCooldown : player.fireCooldown;
  const dmg = player.attackType === 'melee' ? player.meleeDamage : player.rangedDamage;
  document.querySelector('#statSpeed b').textContent = Util.formatNum(player.speed);
  document.querySelector('#statRate b').textContent = (1 / cooldown).toFixed(1) + '/s';
  document.querySelector('#statDamage b').textContent = Util.formatNum(dmg * 10) / 10; // one decimal, comma-grouped once it gets big
  document.querySelector('#statLuck b').textContent = Util.formatNum(player.luck);
  const rangeEl = document.querySelector('#statRange b');
  if (player.laser) { rangeEl.textContent = '∞'; rangeEl.parentElement.title = 'Pony Bot\'s laser ignores Range entirely.'; }
  else if (player.unlimitedRange) { rangeEl.textContent = '∞'; rangeEl.parentElement.title = "Breezie's bolts never run out of range — only a wall stops them."; }
  else { rangeEl.textContent = player.rangeTiles.toFixed(2).replace(/\.?0+$/, ''); rangeEl.parentElement.title = 'Attack range, in tiles.'; }

  const passivesBar = document.getElementById('passivesBar');
  passivesBar.innerHTML = '';
  for (const id in player.passives) {
    const item = ITEMS[id];
    const count = player.passives[id];
    const chip = document.createElement('div');
    chip.className = 'passive-chip';
    chip.textContent = item.icon;
    chip.title = item.name + (count > 1 ? ' x' + count : '') + ' — ' + item.desc;
    passivesBar.appendChild(chip);
  }

  // familiar bank — player.familiars is an ARRAY of live Familiar instances
  // (one per copy owned), not a count-map like passives, so tally per type
  // first and render one chip with a count badge, mirroring the item bank.
  const familiarBar = document.getElementById('familiarBar');
  if (familiarBar) {
    const counts = {};
    const order = [];
    for (const f of player.familiars) {
      if (!f.def) continue;
      if (!counts[f.def.id]) { counts[f.def.id] = 0; order.push(f.def); }
      counts[f.def.id]++;
    }
    const famKey = order.map(d => d.id + ':' + counts[d.id]).join(',');
    if (famKey !== _hudCache.familiars) {
      _hudCache.familiars = famKey;
      familiarBar.innerHTML = '';
      for (const def of order) {
        const chip = document.createElement('div');
        chip.className = 'familiar-chip';
        chip.textContent = def.icon;
        chip.title = def.name + (counts[def.id] > 1 ? ' x' + counts[def.id] : '') + ' — ' + def.desc;
        if (counts[def.id] > 1) {
          const badge = document.createElement('span');
          badge.className = 'chip-count';
          badge.textContent = counts[def.id];
          chip.appendChild(badge);
        }
        familiarBar.appendChild(chip);
      }
    }
  }

  // left side panel — active item / trinket / star / pill readout. Rebuilt
  // only when one of those actually changes (same dirty-check idea as the
  // hearts strip above), since it's a fair chunk of innerHTML per pass.
  const leftActiveEl = document.getElementById('leftPanelActive');
  if (leftActiveEl) {
    const trinket = player.trinketId ? TRINKETS[player.trinketId] : null;
    const star = player.starPocket ? STAR_TYPES[player.starPocket] : null;
    let idKey = (player.activeItem ? player.activeItem.id : '-') + '|' + (player.trinketId || '-') + '|' + (player.starPocket || '-') + '|';
    // the identified pill's EFFECT goes in the key, not just a seen/unseen
    // flag — pillEffectMap is re-rolled per run, so the same set of colors can
    // mean something different in the next one
    for (const c of PILL_COLORS) idKey += (game.pillIdentified && game.pillIdentified[c.id]) ? (game.pillEffectMap[c.id] || '?') : '0';
    if (idKey !== _hudCache.leftPanel) {
      _hudCache.leftPanel = idKey;
      leftActiveEl.innerHTML = hudPanelEntry('Active Item', player.activeItem || null);
      document.getElementById('leftPanelTrinket').innerHTML = hudPanelEntry('Trinket', trinket);
      document.getElementById('leftPanelStar').innerHTML = hudPanelEntry('Star', star);
      document.getElementById('leftPanelPills').innerHTML = hudPillReadout(game);
    }
  }
}

// The static half of the minimap (door connections + room-footprint squares)
// is identical from frame to frame until the map is actually revealed further
// or the player changes room, but it used to be redrawn from scratch every
// tick. It's baked into this offscreen canvas instead and blitted, following
// the same offscreen-caching pattern render.js uses for tile layers. The
// animated bits (the pulsing "you are here" ring, room icons, loot markers)
// still draw live on top, in their original order, so the result is identical.
let _mmCanvas = null;
let _mmDungeon = null;
let _mmKey = '';

// everything the baked layer depends on: which dungeon, where it's centred,
// and how much of it is currently known
function minimapCacheKey(game){
  let key = game.currentRoom.id + '|' + (game.player.revealMap ? 1 : 0);
  for (const node of game.dungeon.rooms.values()) {
    if (node.discovered) key += 'd';
    else if (node.revealed) key += 'r';
    else if (node.seen) key += 's';
    else key += '.';
  }
  return key;
}

function drawMinimap(game){
  const canvas = document.getElementById('minimap');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const dungeon = game.dungeon;
  const curNode = game.currentRoom;
  const cellSize = 13;
  const originX = canvas.width / 2, originY = canvas.height / 2;
  const toScreen = (bx, by) => ({ x: originX + (bx - curNode.gx) * cellSize, y: originY + (by - curNode.gy) * cellSize });

  // discovered = physically visited; revealed = Lunar Affinity spotlighted it;
  // seen = adjacent room's existence is known but not its type;
  // player.revealMap = Night Vision Lens / All-Seeing Eye (shows everything, incl. secret rooms)
  const knowsExistence = (node) => node.discovered || node.seen || node.revealed || game.player.revealMap;
  const knowsType = (node) => node.discovered || node.revealed || game.player.revealMap;

  const key = minimapCacheKey(game);
  if (!_mmCanvas || _mmDungeon !== dungeon || _mmKey !== key
      || _mmCanvas.width !== canvas.width || _mmCanvas.height !== canvas.height) {
    _mmDungeon = dungeon;
    _mmKey = key;
    if (!_mmCanvas) _mmCanvas = document.createElement('canvas');
    if (_mmCanvas.width !== canvas.width) _mmCanvas.width = canvas.width;
    if (_mmCanvas.height !== canvas.height) _mmCanvas.height = canvas.height;
    const bctx = _mmCanvas.getContext('2d');
    bctx.clearRect(0, 0, _mmCanvas.width, _mmCanvas.height);

    // door connections — drawn first so the room squares sit on top of them.
    // Only shown between two rooms whose existence is already known, and only
    // real doors (not still-hidden secret walls) — see dungeon.js's doorSlots.
    bctx.strokeStyle = 'rgba(255,255,255,.3)';
    bctx.lineWidth = 2;
    for (const node of dungeon.rooms.values()) {
      if (!knowsExistence(node)) continue;
      for (const slot of node.doorSlots) {
        if (slot.type !== 'normal' || !slot.pairedSlot) continue;
        const other = slot.pairedSlot.room;
        if (other.id < node.id || !knowsExistence(other)) continue; // draw each connection once
        const a = toScreen(slot.bx, slot.by);
        const b = toScreen(slot.pairedSlot.bx, slot.pairedSlot.by);
        bctx.beginPath(); bctx.moveTo(a.x, a.y); bctx.lineTo(b.x, b.y); bctx.stroke();
      }
    }

    // draws one small square per occupied BLOCK, not per room, so a room's real
    // footprint (its polyomino shape/size) is what actually shows up on the map
    for (const node of dungeon.rooms.values()) {
      if (!knowsExistence(node)) continue;
      const color = knowsType(node) ? roomTypeColor(node.type) : '#2c2847';
      const mask = node.shape.mask;
      for (let r = 0; r < mask.length; r++) {
        for (let c = 0; c < mask[r].length; c++) {
          if (!mask[r][c]) continue;
          const { x: px, y: py } = toScreen(node.gx + c, node.gy + r);
          if (px < -cellSize || py < -cellSize || px > canvas.width + cellSize || py > canvas.height + cellSize) continue;
          const s = cellSize - 2;
          bctx.fillStyle = color;
          bctx.fillRect(px - s / 2, py - s / 2, s, s);
        }
      }
    }
  }
  ctx.drawImage(_mmCanvas, 0, 0);

  for (const node of dungeon.rooms.values()) {
    if (!knowsExistence(node)) continue;
    const mask = node.shape.mask;
    if (node === curNode) {
      for (let r = 0; r < mask.length; r++) {
        for (let c = 0; c < mask[r].length; c++) {
          if (!mask[r][c]) continue;
          const { x: px, y: py } = toScreen(node.gx + c, node.gy + r);
          if (px < -cellSize || py < -cellSize || px > canvas.width + cellSize || py > canvas.height + cellSize) continue;
          const s = cellSize - 2;
          // a gentle pulsing ring instead of a static border, so "you are
          // here" reads at a glance on a busy map full of same-colored cells
          const pulse = 0.5 + 0.5 * Math.sin((game.now || 0) / 260);
          ctx.strokeStyle = `rgba(255,255,255,${0.6 + pulse * 0.4})`;
          ctx.lineWidth = 1.5 + pulse;
          ctx.strokeRect(px - s / 2 + 0.5, py - s / 2 + 0.5, s - 1, s - 1);
        }
      }
    }

    // room-type icon + "what's still lying around here" marker, once per
    // room at its centroid rather than once per block. Special rooms (boss/
    // treasure/shop/secret) show their icon as soon as the room's mere
    // EXISTENCE is known — same as the block itself lighting up dark-grey
    // — rather than waiting for a full visit, so you know a shop/treasure/
    // boss is nearby before ever walking in.
    const centroid = roomCentroidBlock(node);
    const { x: icx, y: icy } = toScreen(centroid.bx, centroid.by);
    const hasTypeIcon = !!ROOM_TYPE_ICON[node.type];
    if (hasTypeIcon) {
      ctx.font = 'bold ' + Math.floor(cellSize * 0.9) + 'px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(10,8,20,.85)';
      ctx.fillText(ROOM_TYPE_ICON[node.type], icx, icy + 1);
    }
    // anything still uncollected in a room you've already been to — shows
    // the actual pickups/items/chest, tiled 3-wide and centered on the
    // room (or nudged below the type icon, for a special room that also
    // has loot), so nothing's missable just from walking past it
    if (node.discovered) {
      const lootY = hasTypeIcon ? icy + cellSize * 0.85 : icy;
      drawLootMarkers(ctx, roomLootEntries(node), icx, lootY);
    }
  }
}

// queued, not clobbered — a fast run of pickups/achievements firing in the
// same frame used to just stomp each other's text (only the last one was
// ever actually readable); now each waits its turn. `long` (achievement
// unlocks) gets more time on screen since there's more to read.
let _toastTimer = null;
let _toastQueue = [];
let _toastShowing = false;
function toast(msg, long){
  _toastQueue.push({ msg, long });
  if (!_toastShowing) advanceToastQueue();
}
function advanceToastQueue(){
  const el = document.getElementById('toast');
  const next = _toastQueue.shift();
  if (!next) { _toastShowing = false; return; }
  _toastShowing = true;
  el.textContent = next.msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(advanceToastQueue, 180); // brief gap so consecutive toasts don't visually blur together
  }, next.long ? 3200 : 2200);
}

let _bannerTimer = null;
function showRoomBanner(text){
  const el = document.getElementById('roomBanner');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(_bannerTimer);
  _bannerTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

// Binding of Isaac "external item descriptions"-style tooltip — pass the
// itemPedestal you're standing near (see game.js's updateItemExamine), or
// null/undefined to hide it. Works for items, trinkets, and familiars alike
// since they all ride the same pedestal shape — see room.js.
function showItemExamine(ped){
  const el = document.getElementById('itemExamine');
  if (!ped) { el.classList.remove('show'); return; }
  const thing = ped.item;
  const kindLabel = ped.isTrinket ? 'Trinket' : ped.isFamiliar ? 'Familiar' : ped.isStar ? 'Star' : (thing.type === 'active' ? 'Active Item' : 'Passive Item');
  document.getElementById('itemExamineIcon').textContent = thing.icon;
  document.getElementById('itemExamineName').textContent = thing.name;
  document.getElementById('itemExamineQuality').textContent = thing.quality
    ? kindLabel + ' — ' + '★'.repeat(thing.quality) + '☆'.repeat(4 - thing.quality)
    : kindLabel;
  document.getElementById('itemExamineDesc').textContent = thing.desc;
  el.classList.add('show');
}

function buildClassSelect(onPick){
  const wrap = document.getElementById('classSelect');
  wrap.innerHTML = '';
  const unlocks = loadUnlocks();
  for (const id in CLASSES) {
    const def = CLASSES[id];
    const unlocked = def.unlocked || !!unlocks[id];
    const card = document.createElement('div');
    card.className = 'class-card' + (unlocked ? '' : ' locked');

    const canvas = document.createElement('canvas');
    canvas.width = 120; canvas.height = 90;
    const cctx = canvas.getContext('2d');
    if (unlocked) {
      Util.drawPony(cctx, 60, 55, 62 * (def.sizeMult || 1), Object.assign({}, Util.classPonyOpts(def), { facing: { x: 0, y: -1 } }));
    } else {
      cctx.fillStyle = '#4a4560';
      cctx.font = '42px sans-serif';
      cctx.textAlign = 'center';
      cctx.fillText('?', 60, 68);
    }
    card.appendChild(canvas);

    const h = document.createElement('h3');
    h.textContent = unlocked ? def.name : '???';
    card.appendChild(h);

    const p = document.createElement('p');
    if (unlocked) {
      p.textContent = def.desc;
    } else {
      // live progress on stat-based unlocks ("Freeze 30 enemies (12/30)")
      // instead of just the static requirement text — same idea as the
      // achievements panel's own progress line, see achievements.js
      const unlockAchv = ACHIEVEMENTS.find(a => a.classId === id);
      const stats = ensureUnlockShape(unlocks).stats;
      const progress = unlockAchv && unlockAchv.statKey
        ? ' (' + Util.formatNum(stats[unlockAchv.statKey] || 0) + '/' + Util.formatNum(unlockAchv.threshold) + ')'
        : '';
      p.textContent = def.unlockHint + progress;
    }
    card.appendChild(p);
    // .class-card.locked::after already draws the 🔒 corner badge — see style.css

    if (unlocked) {
      card.addEventListener('click', () => { Sound.unlock(); Sound.play('uiClick'); onPick(id); });
    } else {
      card.addEventListener('click', () => { Sound.unlock(); Sound.play('uiDeny'); });
    }
    wrap.appendChild(card);
  }
}

function buildSuperbossTrophies(){
  const wrap = document.getElementById('trophyRow');
  if (!wrap) return;
  wrap.innerHTML = '';
  const unlocks = loadUnlocks();
  const defeats = unlocks.superbossDefeats || {};
  for (const boss of SUPERBOSS_LIST) {
    const count = defeats[boss.id] || 0;
    const beaten = count > 0;
    const card = document.createElement('div');
    card.className = 'trophy' + (beaten ? ' beaten' : ' locked');

    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = beaten ? boss.icon : '❓';
    card.appendChild(icon);

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = beaten ? boss.name : '???';
    card.appendChild(name);

    if (beaten) {
      const countEl = document.createElement('div');
      countEl.className = 'count';
      countEl.textContent = count + 'x beaten';
      card.appendChild(countEl);
    }
    wrap.appendChild(card);
  }
}

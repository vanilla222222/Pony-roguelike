'use strict';
/* ============================================================
   dungeon.js — procedural map graph generation (Isaac-style),
   on a shared BLOCK grid: every room reserves the exact set of
   10x10-tile blocks its shape occupies, so a room's size actually
   shapes the map instead of always taking one map slot.

   Doors are per-BLOCK, not per-room: every block in a room's mask
   can have up to 4 door-eligible sides (N/E/S/W), one per side that
   faces outside the room's own shape — a side facing another block
   of the SAME room is an interior opening, not a door candidate.
   See computeDoorSlots(). Two rooms that end up touching get a door
   wherever both sides' slots are enabled and still unpaired, so a
   wide shared wall between two multi-block ORDINARY rooms can end up
   with several doors along it — except special rooms (boss/treasure/
   shop/secret/petshop/curse/sacrifice/vault/challenge/crystal/sombra),
   which are always capped at exactly one entrance no matter how many
   blocks they span — see connectRoomDoors().

   boss/treasure/shop always attach; secret tries its best-connectivity
   spot; petshop/curse/sacrifice/vault/challenge are per-floor coin
   flips (25%/50%/50%/10%/25%) — see generateDungeon() and room.js's
   populateRoom() for contents. vault is key-locked like treasure/shop
   and entirely hand-authored (no auto content, see room.js); challenge
   gets one guaranteed item at generation and locks itself once that
   item is taken, then runs 5 waves of enemies before reopening.
   crystal/sombra don't roll at all: they appear on every SECOND floor
   (HUD Floor 2, 4, 6...) and nowhere else, always attached directly to
   the boss room, guaranteed on a qualifying floor. They're entirely
   hand-authored too — sombra is where a "Deal" spawner (room-editor.html's
   own category, see room.js's addDealPedestal) belongs: an item that
   costs a heart to take instead of being free.

   Compact template fields consumed here (see room-editor.html):
     m — mask (required)
     f — allowed floor indices, 0-based (optional; omitted = any floor)
     d — disabled door sides (optional). Two formats:
           string, e.g. "NW"        — legacy: disables every exterior
                                       block-edge facing that direction
           array,  e.g. [[0,0,"NW"]] — per-block: [col, row, dirLetters]
   ============================================================ */

const DIRS = [
  { d:'N', o:'S', dx:0, dy:-1 },
  { d:'E', o:'W', dx:1, dy:0 },
  { d:'S', o:'N', dx:0, dy:1 },
  { d:'W', o:'E', dx:-1, dy:0 },
];

// every "special" room type is always capped at exactly 1 entrance, however
// many blocks it spans — see connectRoomDoors()/makeRoomInstance() below.
// Centralized here (instead of a long `type === 'x' || type === 'y' || ...`
// chain repeated inline) so adding a new special room type in the future is
// a one-line edit to a list, not a hunt through every place that needs to
// agree on what counts as "special".
const SPECIAL_ROOM_TYPES = new Set([
  'boss', 'treasure', 'shop', 'secret', 'petshop', 'curse', 'sacrifice', 'vault', 'challenge', 'crystal', 'sombra', 'star',
  'cpathgate', // floor 2 only — the C-branch entrance, see below
  'planetarium', // floor 3 only — the D-branch entrance (Phase 7a), same deal as cpathgate
  'shrine', // per-floor coin flip, see attachSpecial below — pays in coins, not hearts
  'arcade', // Phase 4 overhaul — per-floor coin flip, coin-toll gated (see combat.js's coinLockedRoomFor), NOT auto-open
]);
// the subset of room types whose doors start open at creation — everything
// else (boss/treasure/shop/vault/arcade) starts locked behind combat, a key,
// or (arcade only) a coin toll — see combat.js's keyLockedRoomFor/
// coinLockedRoomFor and room.js's populateRoom's safety net.
const AUTO_OPEN_ROOM_TYPES = new Set([
  'start', 'secret', 'petshop', 'curse', 'sacrifice', 'challenge', 'crystal', 'sombra', 'cpathgate', 'planetarium', 'shrine',
]);

let _roomIdSeq = 1;

function blockKey(x, y){ return x + ',' + y; }

function isDoorDisabled(template, col, row, dir){
  const d = template && template.d;
  if (!d) return false;
  if (typeof d === 'string') return d.includes(dir);
  for (const entry of d) {
    if (entry[0] === col && entry[1] === row && entry[2].includes(dir)) return true;
  }
  return false;
}

// obstacle-kind floor/path gating ("new stuff" pass) — independent of which
// template an obstacle kind is baked into, so it retroactively applies to
// every hand-authored AND procedurally-generated ROOM_TEMPLATES entry
// without editing any of them. Everything not listed here is floor-agnostic,
// same as before. See templateAllowsFloor below for where this is enforced.
function obstacleAllowedOnFloor(kind, floorNum, floorPath){
  if (kind === 'sandtrap' || kind === 'cactus') {
    // stage 3 (The Sandswept Dunes) only — floors 5-6, main path
    return floorPath !== 'C' && (floorNum === 4 || floorNum === 5);
  }
  if (kind === 'mud') {
    // stage 2 (Whitetail Forest, floors 3-4) OR the Sewers (5C/6C)
    return (floorPath !== 'C' && (floorNum === 2 || floorNum === 3))
        || (floorPath === 'C' && (floorNum === 4 || floorNum === 5));
  }
  if (kind === 'currentn' || kind === 'currents' || kind === 'currente' || kind === 'currentw') {
    // the streaming-current hazard — C-branch exclusive, any C floor
    return floorPath === 'C';
  }
  if (kind === 'thornbush') {
    // Whitetail Forest (stage 1) only — floors 2-3, main path
    return floorPath !== 'C' && (floorNum === 2 || floorNum === 3);
  }
  // luckcrystal gets no gate here on purpose — it's a decorative/reward
  // fixture, not a themed hazard, so it falls through to plain `true` below
  return true;
}

// `tmpl.p` (path) is a new, optional per-template tag: 'C' means the
// template is C-branch EXCLUSIVE (never eligible on the main path), and its
// absence means "eligible on any path" — unchanged behavior for every
// template authored before this tag existed, so the C-branch keeps drawing
// from the full shared pool it always has. Only templates that place a
// path-exclusive obstacle kind (see obstacleAllowedOnFloor above) need "p".
function templateAllowsFloor(tmpl, floorNum){
  if (tmpl.f && !tmpl.f.includes(floorNum)) return false;
  const floorPath = currentFloorPath();
  if (tmpl.p === 'C' && floorPath !== 'C') return false;
  if (tmpl.s) {
    for (const sp of tmpl.s) {
      if (sp[2] === 'o' && !obstacleAllowedOnFloor(sp[3], floorNum, floorPath)) return false;
    }
  }
  return true;
}

// Every block in `mask` gets one door slot per side that faces outside the
// shape. Slots start paired/typed as null (no door yet) unless disabled by
// the template — connectRoomDoors() is what actually links two facing slots
// from different rooms into a usable door.
function computeDoorSlots(mask, originBx, originBy, template, room){
  const slots = [];
  for (let r = 0; r < mask.length; r++) {
    for (let c = 0; c < mask[r].length; c++) {
      if (!mask[r][c]) continue;
      for (const dir of DIRS) {
        const nr = r + dir.dy, nc = c + dir.dx;
        const interior = nr >= 0 && nr < mask.length && nc >= 0 && nc < mask[r].length && mask[nr][nc];
        if (interior) continue;
        slots.push({
          room, localCol: c, localRow: r, dir: dir.d,
          bx: originBx + c, by: originBy + r,
          disabled: isDoorDisabled(template, c, r, dir.d),
          type: null, pairedSlot: null, opened: false, cells: null,
        });
      }
    }
  }
  return slots;
}

// links two facing slots (from different rooms) into one real door
function connectDoorSlots(a, b, type){
  a.type = type; b.type = type;
  a.pairedSlot = b; b.pairedSlot = a;
}

// number of DISTINCT other rooms `room` currently has a door (of any kind)
// to — a multi-block room touching one neighbor along several block edges
// still only counts as one entrance.
function countRoomConnections(room){
  const ids = new Set();
  for (const s of room.doorSlots) if (s.pairedSlot) ids.add(s.pairedSlot.room.id);
  return ids.size;
}

// pairs `room`'s own open (enabled, unpaired) door slots against whatever
// already occupies the far side of each slot in blockGrid — this is how two
// rooms that merely end up touching (not just the one a placement attempt
// targeted) end up connected, and it naturally supports several doors along
// one shared multi-block wall — UNLESS either side has a maxDoors cap
// (special rooms are capped at 1, see makeRoomInstance), enforced from both
// ends so neither this room nor the one it's pairing with can be pushed
// over its own limit. Special rooms shuffle their candidates first so the
// one entrance they DO get isn't always whichever the mask happened to
// scan first (north/west-biased).
function connectRoomDoors(room, blockGrid, rooms, doorType){
  if (countRoomConnections(room) >= room.maxDoors) return;

  const candidates = [];
  for (const slot of room.doorSlots) {
    if (slot.disabled || slot.pairedSlot) continue;
    const dir = DIRS.find(dd => dd.d === slot.dir);
    const nbx = slot.bx + dir.dx, nby = slot.by + dir.dy;
    const otherId = blockGrid.get(blockKey(nbx, nby));
    if (otherId == null || otherId === room.id) continue;
    const other = rooms.get(otherId);
    const oppSlot = other.doorSlots.find(s => s.bx === nbx && s.by === nby && s.dir === dir.o && !s.disabled && !s.pairedSlot);
    if (!oppSlot) continue;
    candidates.push({ slot, oppSlot, other });
  }
  if (room.maxDoors < Infinity) Util.shuffle(candidates);

  for (const c of candidates) {
    if (countRoomConnections(room) >= room.maxDoors) break;
    if (countRoomConnections(c.other) >= c.other.maxDoors) continue; // far side is already at its own cap
    connectDoorSlots(c.slot, c.oppSlot, doorType);
  }
}

function makeRoomInstance(type, originBx, originBy, mask, template){
  const room = {
    id: _roomIdSeq++,
    type,
    gx: originBx, gy: originBy, // origin block (top-left of the mask's bounding box)
    shape: { mask },
    template: template || null,
    doorSlots: null,
    // start/secret rooms never lock; treasure/shop lock behind a key (see
    // combat.js's keyLockedRoomFor) until unlocked, which must happen here
    // at creation, not lazily in ensureRoomBuilt — that only runs the FIRST
    // time a room is entered, which for a treasure/shop room is always
    // AFTER it's already been unlocked, and re-deriving doorsOpen from type
    // there would silently re-lock it the moment its tiles get built.
    // petshop/curse/sacrifice/challenge/crystal/sombra doors start open like
    // start/secret — none of them are key-gated (vault joins treasure/shop
    // instead — see combat.js's keyLockedRoomFor), and none of them have
    // enemies guaranteed to trigger the normal/boss combat-clear auto-unlock
    // at generation time (see populateRoom's safety net) — challenge locks
    // itself later, once its guaranteed item is actually taken, see
    // room.js/combat.js
    tiles: null, doorsOpen: AUTO_OPEN_ROOM_TYPES.has(type), tileW: 0, tileH: 0,
    discovered: false, seen: false, revealed: false, visited: false, cleared: (type === 'start'),
    populated: false,
    enemies: null, obstacles: null, pickups: null, chests: null,
    itemPedestals: null, shopSlots: null, bossDefeated: false, stairsSpot: null,
    keyToastCooldown: 0, // throttles the "locked — need a key"/"not enough hearts" toast, see combat.js/game.js
    // special rooms only ever get one entrance, however many blocks they
    // span — see connectRoomDoors
    maxDoors: SPECIAL_ROOM_TYPES.has(type) ? 1 : Infinity,
  };
  room.doorSlots = computeDoorSlots(mask, originBx, originBy, template, room);
  return room;
}

function roomBlockCells(room){
  const mask = room.shape.mask;
  const cells = [];
  for (let r = 0; r < mask.length; r++) {
    for (let c = 0; c < mask[r].length; c++) {
      if (mask[r][c]) cells.push({ bx: room.gx + c, by: room.gy + r });
    }
  }
  return cells;
}

function pickMaskForType(type, floorNum){
  const pool = (ROOM_TEMPLATES[type] || []).filter(t => templateAllowsFloor(t, floorNum));
  if (pool.length) {
    const tmpl = Util.choice(pool);
    return { mask: tmpl.m, template: tmpl };
  }
  const shape = chooseShapeForNode({ type });
  return { mask: shape.mask, template: null };
}

function canPlace(blockGrid, room, radius){
  const cells = roomBlockCells(room);
  if (!cells.length) return false;
  for (const cell of cells) {
    if (Math.max(Math.abs(cell.bx), Math.abs(cell.by)) > radius) return false;
    if (blockGrid.has(blockKey(cell.bx, cell.by))) return false;
  }
  return true;
}

function commitPlace(blockGrid, rooms, room){
  rooms.set(room.id, room);
  for (const cell of roomBlockCells(room)) blockGrid.set(blockKey(cell.bx, cell.by), room.id);
}

// try to attach a new room of `mask` to `fromRoom`'s `dir` side. Tries every
// valid (attachment-slot, mask-boundary-cell) pairing in random order and
// commits the first one that doesn't collide with anything already placed,
// then wires up doors to everything it ends up touching (see connectRoomDoors).
function tryPlaceAdjacent(blockGrid, rooms, fromRoom, dir, mask, template, type, radius){
  const fromSlots = Util.shuffle(fromRoom.doorSlots.filter(s => s.dir === dir.d && !s.disabled && !s.pairedSlot));
  if (!fromSlots.length) return null;

  const maskCells = [];
  for (let r = 0; r < mask.length; r++) for (let c = 0; c < mask[r].length; c++) if (mask[r][c]) maskCells.push({ mx: c, my: r });
  const maskSet = new Set(maskCells.map(p => blockKey(p.mx, p.my)));
  const oppEntry = DIRS.find(d => d.d === dir.o);
  const maskBoundary = Util.shuffle(maskCells.filter(p =>
    !maskSet.has(blockKey(p.mx + oppEntry.dx, p.my + oppEntry.dy)) &&
    !isDoorDisabled(template, p.mx, p.my, dir.o)
  ));
  if (!maskBoundary.length) return null;

  for (const slot of fromSlots) {
    const targetX = slot.bx + dir.dx, targetY = slot.by + dir.dy;
    for (const mc of maskBoundary) {
      const originBx = targetX - mc.mx, originBy = targetY - mc.my;
      const candidate = makeRoomInstance(type, originBx, originBy, mask, template);
      if (canPlace(blockGrid, candidate, radius)) {
        commitPlace(blockGrid, rooms, candidate);
        connectRoomDoors(candidate, blockGrid, rooms, 'normal');
        return candidate;
      }
    }
  }
  return null;
}

function attachSecretRoom(rooms, blockGrid, radius, floorNum){
  const pool = (ROOM_TEMPLATES.secret || []).filter(t => templateAllowsFloor(t, floorNum));
  const pick = pool.length ? Util.choice(pool) : null;
  const mask = pick ? pick.m : [[1]];

  let best = null, bestScore = -1;
  for (let ox = -radius; ox <= radius; ox++) {
    for (let oy = -radius; oy <= radius; oy++) {
      const candidate = makeRoomInstance('secret', ox, oy, mask, pick);
      if (!canPlace(blockGrid, candidate, radius)) continue;
      const touching = new Set();
      for (const cell of roomBlockCells(candidate)) {
        for (const dir of DIRS) {
          const nid = blockGrid.get(blockKey(cell.bx + dir.dx, cell.by + dir.dy));
          if (nid != null) touching.add(nid);
        }
      }
      if (touching.size === 0) continue;
      const score = touching.size + Math.random() * 0.5;
      if (score > bestScore) { bestScore = score; best = candidate; }
    }
  }
  if (!best) return null;
  commitPlace(blockGrid, rooms, best);
  connectRoomDoors(best, blockGrid, rooms, 'secret');
  return best;
}

function generateDungeon(floorNum){
  const rooms = new Map();
  const blockGrid = new Map();
  // grows every floor (not just every other) so later maps sprawl out
  // further, keeping pace with the bigger normal-room target below
  const radius = 8 + floorNum;

  const startPick = pickMaskForType('start', floorNum);
  const startRoom = makeRoomInstance('start', 0, 0, startPick.mask, startPick.template);
  commitPlace(blockGrid, rooms, startRoom);

  // minimum normal-room count, not counting boss/treasure/shop/secret/
  // petshop/curse/sacrifice: 10 + 2F, where F is the 1-based floor number
  // shown in the HUD (floorNum is 0-based, so F = floorNum + 1)
  const targetNormal = 10 + 2 * (floorNum + 1);
  let normalCount = 0;
  const frontier = [startRoom];
  let guard = 0;
  while (frontier.length && normalCount < targetNormal && guard < 3000) {
    guard++;
    const idx = Util.randi(0, frontier.length - 1);
    const cur = frontier[idx];
    let placedHere = false;
    for (const dir of Util.shuffle(DIRS.slice())) {
      if (normalCount >= targetNormal) break;
      if (Math.random() >= 0.6) continue;
      const pick = pickMaskForType('normal', floorNum);
      const placed = tryPlaceAdjacent(blockGrid, rooms, cur, dir, pick.mask, pick.template, 'normal', radius);
      if (placed) { frontier.push(placed); normalCount++; placedHere = true; }
    }
    if (!placedHere) frontier.splice(idx, 1);
  }

  // every floor forces exactly one group of 5 low-HP Swarmer DNBs into a
  // single random normal room, decided here once at generation time — see
  // room.js's populateRoom (node.forceSwarm)
  const normalRooms = [...rooms.values()].filter(r => r.type === 'normal');
  if (normalRooms.length) Util.choice(normalRooms).forceSwarm = true;

  const distances = new Map([[startRoom.id, 0]]);
  const bq = [startRoom];
  let bh = 0;
  while (bh < bq.length) {
    const cur = bq[bh++];
    const d = distances.get(cur.id);
    for (const slot of cur.doorSlots) {
      if (!slot.pairedSlot || slot.type === 'secret') continue; // distances only follow real doors, not secret walls
      const nid = slot.pairedSlot.room.id;
      if (distances.has(nid)) continue;
      distances.set(nid, d + 1);
      bq.push(slot.pairedSlot.room);
    }
  }

  // "degree" = number of distinct other rooms this room has a real door to
  // (a multi-block room can have several doors to the same neighbor, which
  // should still only count once).
  function degree(room){
    const ids = new Set();
    for (const s of room.doorSlots) if (s.pairedSlot && s.type !== 'secret') ids.add(s.pairedSlot.room.id);
    return ids.size;
  }
  function farthestLeaves(){
    return [...rooms.values()]
      .filter(r => r.type === 'normal' && degree(r) === 1)
      .sort((a, b) => (distances.get(b.id) || 0) - (distances.get(a.id) || 0));
  }

  function attachSpecial(type){
    const leaves = farthestLeaves();
    const rawPool = (ROOM_TEMPLATES[type] || []).filter(t => templateAllowsFloor(t, floorNum));
    const templatePool = rawPool.length ? Util.shuffle(rawPool.slice()) : [null];
    for (const leaf of leaves) {
      for (const dir of Util.shuffle(DIRS.slice())) {
        for (const tmpl of templatePool) {
          const mask = tmpl ? tmpl.m : chooseShapeForNode({ type }).mask;
          const placed = tryPlaceAdjacent(blockGrid, rooms, leaf, dir, mask, tmpl, type, radius);
          if (placed) return placed;
        }
      }
    }
    // last-resort: force a room wherever there's any free side, so the floor
    // is never unwinnable. BUG FIX: this used to hardcode a blank [[1]] mask
    // with no template, meaning any special room that fell through here (very
    // common once petshop/curse/sacrifice/vault/challenge are all competing
    // for the same limited pool of degree-1 leaves) silently lost access to
    // its own ROOM_TEMPLATES entirely, no matter how many existed — it would
    // always land as an empty procedural room. Now it still tries the real
    // template pool first (a 1x1 template mask fits almost anywhere), only
    // dropping to a truly blank room if nothing — not even [[1]] — fits.
    for (const room of rooms.values()) {
      for (const dir of DIRS) {
        for (const tmpl of templatePool) {
          const mask = tmpl ? tmpl.m : [[1]];
          const placed = tryPlaceAdjacent(blockGrid, rooms, room, dir, mask, tmpl, type, radius + 3);
          if (placed) return placed;
        }
      }
    }
    return null;
  }

  const bossNode = attachSpecial('boss');
  const treasureNode = attachSpecial('treasure');
  const shopNode = attachSpecial('shop');
  const secretNode = attachSecretRoom(rooms, blockGrid, radius, floorNum);
  // petshop/curse/sacrifice/vault/challenge are all optional, per-floor coin
  // flips (unlike boss/treasure/shop, which always attach) — see room.js for
  // what each one actually contains once it lands
  const petshopNode = Util.chance(0.25) ? attachSpecial('petshop') : null;
  const curseNode = Util.chance(0.50) ? attachSpecial('curse') : null;
  const sacrificeNode = Util.chance(0.50) ? attachSpecial('sacrifice') : null;
  const vaultNode = Util.chance(0.10) ? attachSpecial('vault') : null;
  const challengeNode = Util.chance(0.25) ? attachSpecial('challenge') : null;
  const starNode = Util.chance(0.30) ? attachSpecial('star') : null;
  const shrineNode = Util.chance(0.20) ? attachSpecial('shrine') : null;
  // Phase 4 overhaul — arcade: a coin-toll-gated room full of scattered
  // filly/machine fixtures (see room.js's populateRoom, shop.js's
  // tryArcadeInteract). Same coin-flip shape as the rooms above; unlike them
  // it does NOT auto-open (see AUTO_OPEN_ROOM_TYPES) — its doors start
  // locked and only open once the toll is paid at the door.
  const arcadeNode = Util.chance(0.18) ? attachSpecial('arcade') : null;
  // The C-branch gate — the ONLY room in the game gated on a specific floor
  // NUMBER rather than a coin flip or a branch flag. It generates on floor 2
  // (floorNum 1) and nowhere else; walking onto the pit inside it calls
  // descend('C') and diverts the whole run onto the 3C-10C path (see
  // game.js's descend/floorPath and stages.js's C_FLOOR_KEYS). Always
  // attaches when the floor is right, so the choice is never randomly denied.
  const cpathgateNode = floorNum === 1 ? attachSpecial('cpathgate') : null;
  // The D-branch gate (Phase 7a) — the same idea one floor lower down: it
  // generates on floor 3 (floorNum 2) and nowhere else, and stepping onto the
  // platform inside it calls descend('D') and diverts the whole run onto the
  // 4D-10D starlit path (see game.js's descend/floorPath and stages.js's
  // D_FLOOR_KEYS). Also unconditional on its floor, for the same reason:
  // the choice is never randomly denied.
  //
  // Both gates deliberately sit on floors the OTHER gate can't appear on, so a
  // single run is never offered both at once. Neither can generate once a run
  // has already left the normal path — floorPath is sticky and the C/D floor
  // numbering never revisits floorNum 1 or 2 — but the guard is explicit
  // anyway rather than relying on that coincidence.
  const planetariumNode = (floorNum === 2 && !currentFloorPath()) ? attachSpecial('planetarium') : null;

  // attachSpecial() targets the map's farthest degree-1 leaves — this variant
  // instead tries every free side of one specific anchor room, and returns
  // null rather than falling back to attachSpecial's leaf search — a room
  // that must be beside its anchor simply doesn't spawn if it can't fit there.
  function attachNextTo(anchor, type){
    if (!anchor) return null;
    const rawPool = (ROOM_TEMPLATES[type] || []).filter(t => templateAllowsFloor(t, floorNum));
    const templatePool = rawPool.length ? Util.shuffle(rawPool.slice()) : [null];
    for (const dir of Util.shuffle(DIRS.slice())) {
      for (const tmpl of templatePool) {
        const mask = tmpl ? tmpl.m : chooseShapeForNode({ type }).mask;
        const placed = tryPlaceAdjacent(blockGrid, rooms, anchor, dir, mask, tmpl, type, radius);
        if (placed) return placed;
      }
    }
    return null;
  }

  // Crystal (angel) / Sombra (devil) — deal rooms. Both hand-authored only
  // (no automatic content, same as vault/curse); Sombra rooms are where the
  // "Deal" spawner category belongs, see room.js's addDealPedestal.
  // Isaac-style placement: these two only ever exist on every SECOND floor
  // (HUD Floor 2, 4, 6...), and only ever hanging directly off the boss room.
  // On a qualifying floor they are GUARANTEED — no spawn roll at all — and on
  // any other floor they simply don't exist. There is deliberately NO
  // attachSpecial() fallback: if there's no room left beside the boss to put
  // one, it just doesn't spawn that floor rather than drifting off somewhere
  // else on the map.
  const everySecondFloor = (floorNum % 2) === 1; // floorNum is 0-based: HUD Floor 2 = floorNum 1, Floor 4 = floorNum 3, ...
  let crystalNode = null, sombraNode = null;
  if (bossNode && everySecondFloor) {
    // boss rooms are always capped at exactly 1 entrance (see
    // SPECIAL_ROOM_TYPES/makeRoomInstance) — that single door was already
    // spent on however the boss room itself first connected to the map, so
    // without this it'd never actually have a free slot left: connectRoomDoors
    // would silently commit the new room's blocks with zero usable doors the
    // instant its only touching neighbor turned out to be the boss room.
    // We need room for BOTH attaches on top of that original entrance, so the
    // cap goes to 3 for the duration and is then always restored to 1 — which
    // both re-seals the boss room against anything attaching later (the second
    // boss room on floorNum 8/9 below, in particular) and keeps its saved
    // shape identical to every other special room's.
    bossNode.maxDoors = 3;
    // order is shuffled because most boss templates only leave ONE usable
    // free side: 6 of the 7 boss entries in roomTemplates.js disable a whole
    // axis (d:"NS"/"EW"), so a 2-block boss room has just 2 door slots and one
    // of them is already the boss's own entrance. A fixed order would mean
    // whichever type went first effectively always won that last slot and the
    // other essentially never spawned.
    for (const type of Util.shuffle(['crystal', 'sombra'])) {
      const placed = attachNextTo(bossNode, type);
      if (type === 'crystal') crystalNode = placed; else sombraNode = placed;
    }
    bossNode.maxDoors = 1;
  }

  // 9A/9B/10A/10B/11A/11B/12A/12B (floorNum 8/9/10/11) each get a SECOND boss room, on top of the
  // one `bossNode` above (which game.js's startFloor/enterRoom always force
  // to that floor's superboss — see enemies.js's floorKey-tagged BOSS_TYPES
  // entries for what spawns here instead, via the normal resolveGenericBoss
  // fallback). This is a bonus fight, not a gate: game.js's onBossDefeated
  // deliberately withholds a stairsSpot here so clearing it can't let you
  // skip the floor's real superboss, but its loot/achievement/kill-count
  // all still count completely normally. Floor 13 (floorNum 12) is the finale
  // and deliberately gets a single boss room, so it is NOT in this list — keep
  // this in lockstep with game.js's onBossDefeated/isBonusBossRoom condition.
  // Phase 7a bug fix: this used to test floorNum alone. The C-branch's floorNum
  // 8/9 (9C/10C) incidentally satisfied it and generated a bonus boss room that
  // was never meant to exist on that path — and the C-branch's new 11C/12C plus
  // the whole D-branch (floorNum 3-9) would have widened the collision further.
  // The bonus boss room is a MAIN-ROUTE-ONLY mechanic (it exists because 9A/9B
  // through 12A/12B each have a superboss AND a spare branch-tagged boss
  // roster), so it is now gated on being on no alternate path at all. Keep this
  // in lockstep with game.js's onBossDefeated isBonusBossRoom check, which is
  // written to exactly the same shape.
  const secondBossNode = (!currentFloorPath() && (floorNum === 8 || floorNum === 9 || floorNum === 10 || floorNum === 11))
    ? attachSpecial('boss') : null;

  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  for (const r of rooms.values()) {
    minX = Math.min(minX, r.gx); maxX = Math.max(maxX, r.gx);
    minY = Math.min(minY, r.gy); maxY = Math.max(maxY, r.gy);
  }

  return {
    rooms, start: startRoom, bossNode, treasureNode, shopNode, secretNode,
    petshopNode, curseNode, sacrificeNode, vaultNode, challengeNode, starNode, crystalNode, sombraNode, secondBossNode,
    cpathgateNode, planetariumNode, shrineNode, arcadeNode,
    bounds: { minX, maxX, minY, maxY },
    floorNum,
  };
}

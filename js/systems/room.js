'use strict';
/* ============================================================
   room.js — turns a room node's polyomino shape into a tile grid,
   places doors/secret walls, and populates room contents.
   ============================================================ */

const T_VOID = 0, T_FLOOR = 1, T_WALL = 2, T_DOOR = 3, T_SECRET = 4, T_SECRET_OPEN = 5;

function chooseShapeForNode(node){
  if (node.type === 'start') return { name:'single', w:1, mask:[[1]] };
  if (node.type === 'boss') return pickRoomShape(2, 4);
  if (node.type === 'treasure' || node.type === 'shop' || node.type === 'secret'
      || node.type === 'petshop' || node.type === 'curse' || node.type === 'sacrifice'
      || node.type === 'star' || node.type === 'cpathgate' || node.type === 'planetarium') {
    return Math.random() < 0.65 ? pickRoomShape(1, 1) : pickRoomShape(2, 2);
  }
  return pickRoomShape(1, 4);
}

// the 2 tile positions a door slot occupies, in its own room's local tile
// grid — always the middle 2 tiles of that block's own 10-tile wall edge
// (see dungeon.js's computeDoorSlots for how slots themselves are derived).
function doorSlotCells(slot){
  const c = slot.localCol, r = slot.localRow;
  if (slot.dir === 'N' || slot.dir === 'S') {
    const y = slot.dir === 'N' ? r * BLOCK : (r + 1) * BLOCK + 1;
    const x0 = 1 + c * BLOCK + 4;
    return [{ x: x0, y }, { x: x0 + 1, y }];
  }
  const x = slot.dir === 'W' ? c * BLOCK : (c + 1) * BLOCK + 1;
  const y0 = 1 + r * BLOCK + 4;
  return [{ x, y: y0 }, { x, y: y0 + 1 }];
}

function buildRoomTiles(node){
  const shape = node.shape;
  const mask = shape.mask;
  const blockH = mask.length, blockW = mask[0].length;
  const tileW = blockW * BLOCK + 2;
  const tileH = blockH * BLOCK + 2;

  const grid = [];
  for (let y = 0; y < tileH; y++) grid.push(new Array(tileW).fill(T_VOID));

  for (let by = 0; by < blockH; by++) {
    for (let bx = 0; bx < blockW; bx++) {
      if (!mask[by][bx]) continue;
      for (let ty = 0; ty < BLOCK; ty++) {
        for (let tx = 0; tx < BLOCK; tx++) {
          grid[1 + by * BLOCK + ty][1 + bx * BLOCK + tx] = T_FLOOR;
        }
      }
    }
  }
  // wall ring: void tiles orthogonally touching floor become walls
  for (let y = 0; y < tileH; y++) {
    for (let x = 0; x < tileW; x++) {
      if (grid[y][x] !== T_VOID) continue;
      const touchesFloor =
        (y > 0 && grid[y - 1][x] === T_FLOOR) || (y < tileH - 1 && grid[y + 1][x] === T_FLOOR) ||
        (x > 0 && grid[y][x - 1] === T_FLOOR) || (x < tileW - 1 && grid[y][x + 1] === T_FLOOR);
      if (touchesFloor) grid[y][x] = T_WALL;
    }
  }

  // carve one 2-tile door per active (typed) slot, centered on that block's
  // own edge — mutates node.doorSlots in place (each slot's own `cells`),
  // rather than building a separate parallel doors structure.
  for (const slot of (node.doorSlots || [])) {
    if (slot.type !== 'normal' && slot.type !== 'secret') { slot.cells = null; continue; }
    const cells = doorSlotCells(slot).filter(c => c.x >= 0 && c.y >= 0 && c.x < tileW && c.y < tileH);
    slot.cells = cells;
    for (const c of cells) grid[c.y][c.x] = slot.type === 'normal' ? T_DOOR : T_SECRET;
  }

  return { grid, tileW, tileH };
}

function ensureRoomBuilt(node){
  // node.shape (and node.template, if any) are already assigned by
  // generateDungeon() — the generator has to know each room's footprint
  // up front so room sizes can actually shape the map. This just turns
  // that shape into an actual tile grid + doors the first time it's visited.
  if (node.tiles) return;
  const built = buildRoomTiles(node);
  node.tiles = built.grid;
  node.tileW = built.tileW;
  node.tileH = built.tileH;
  // doorsOpen is set at room creation, not here — see dungeon.js's
  // makeRoomInstance for why
}

function roomFloorTiles(node, opts){
  opts = opts || {};
  const list = [];
  const cx = node.tileW / 2, cy = node.tileH / 2;
  for (let y = 1; y < node.tileH - 1; y++) {
    for (let x = 1; x < node.tileW - 1; x++) {
      if (node.tiles[y][x] !== T_FLOOR) continue;
      if (opts.avoidCenter && Util.dist(x, y, cx, cy) < opts.avoidCenter) continue;
      if (opts.avoidDoors) {
        let nearDoor = false;
        for (const slot of node.doorSlots) {
          if (!slot.cells) continue;
          for (const c of slot.cells) if (Util.dist(x, y, c.x, c.y) < opts.avoidDoors) nearDoor = true;
        }
        if (nearDoor) continue;
      }
      list.push({ x, y });
    }
  }
  return list;
}

function tileToPx(t){ return t * TILE + TILE / 2; }

/* ------------------------------------------------------------
   Room population — enemies, obstacles, pickups, chests, items.
   A room either comes from a hand-authored ROOM_TEMPLATES entry
   (see room-editor.html) or, until one exists for that slot, from
   the procedural fallback below. Pickups are NOT scattered here —
   they only ever come from chests, shops, treasure/item spawners,
   and the room-clear reward (see spawnClearRoomPickup).
   ------------------------------------------------------------ */
function populateRoom(node, dungeon, opts){
  if (node.populated) return;
  node.populated = true;
  node.enemies = [];
  node.obstacles = [];
  node.pickups = [];
  node.chests = [];
  node.itemPedestals = [];
  node.shopSlots = null;
  node.donationMachine = null;
  node.rerollAltar = null;
  node.fillies = [];
  node.machines = [];

  // fresh per-room enemy bias — both population paths below funnel their
  // generic enemy spawns through resolveGenericEnemy, which builds the roll
  // lazily off the first spawn's eligible pool. See rollRoomEnemyBias.
  resetRoomEnemyBias();

  if (node.template) populateRoomFromTemplate(node, dungeon, opts);
  else populateRoomProcedural(node, dungeon, opts);

  // every shop room gets a donation machine, hand-authored template or not
  // — parked toward a corner so it stays clear of however the room's own
  // shop slots ended up laid out. See shop.js's tryDonateMachine.
  if (node.type === 'shop') {
    const spot = findNearestFloor(node, Math.floor(node.tileW * 0.82), Math.floor(node.tileH * 0.82));
    node.donationMachine = { x: spot.x, y: spot.y };
    // ...and its counterpart, the reroll altar — mirrored into the OPPOSITE
    // bottom corner so the two fixtures can never overlap or share a
    // proximity radius, and both stay off the shop slots' centre row.
    // `uses` is this-visit-only state: game.js's enterRoom zeroes it every
    // time you walk back in, so the cost curve (shop.js's rerollAltarCost)
    // always restarts at 3c. It lives on the room node, so two shops on two
    // different floors each keep their own count — nothing is on the player.
    let aSpot = findNearestFloor(node, Math.floor(node.tileW * 0.18), Math.floor(node.tileH * 0.82));
    // paranoia for oddly-shaped shop polyominoes: if the only floor tile near
    // that corner is the one the machine already took, fall back to the top-left
    if (aSpot.x === spot.x && aSpot.y === spot.y) {
      aSpot = findNearestFloor(node, Math.floor(node.tileW * 0.18), Math.floor(node.tileH * 0.18));
    }
    node.rerollAltar = { x: aSpot.x, y: aSpot.y, uses: 0 };
  }

  // petshop always contains exactly one free familiar, hand-authored
  // template or not — same "guaranteed regardless of template" pattern as
  // the shop's donation machine above. Falls back to a free item if every
  // familiar is still locked (early on, that's entirely possible).
  if (node.type === 'petshop' && !node.itemPedestals.some(p => p.isFamiliar)) {
    const spot = findNearestFloor(node, Math.floor(node.tileW / 2), Math.floor(node.tileH / 2));
    const familiar = pickFamiliarFromPool();
    if (familiar) addFamiliarPedestal(node, familiar, spot.x, spot.y);
    else addItemPedestal(node, pickItemFromPool('treasure'), spot.x, spot.y);
  }

  // shrine always contains exactly one guaranteed offer, hand-authored
  // template or not — same "guaranteed regardless of template" pattern as
  // petshop's free familiar above, except this one is priced in coins (see
  // addShrinePedestal/game.js's updateItemPedestal). Cost scales gently with
  // depth, capped at 30c — mirrors shop.js's own per-floor price curve.
  if (node.type === 'shrine' && !node.itemPedestals.some(p => p.isShrine)) {
    const spot = findNearestFloor(node, Math.floor(node.tileW / 2), Math.floor(node.tileH / 2));
    const coinCost = Math.min(30, 8 + dungeon.floorNum * 3);
    addShrinePedestal(node, pickItemFromPool('shrine'), spot.x, spot.y, coinCost);
  }

  // Phase 4 overhaul — arcade always contains 2-4 scattered filly/machine
  // fixtures, hand-authored template or not — same "guaranteed regardless of
  // template" pattern as shop's donation machine / petshop's familiar above.
  // No hand-authored arcade templates exist yet, so this always fires; a
  // future template that pre-populates node.fillies/node.machines would be
  // respected by the `!node.fillies.length && !node.machines.length` guard.
  // See shop.js's tryArcadeInteract for what each kind actually does.
  if (node.type === 'arcade' && !node.fillies.length && !node.machines.length) {
    const FILLY_KINDS = ['coin', 'bomb', 'key', 'heart', 'battery'];
    const MACHINE_KINDS = ['friendship', 'tools', 'dark'];
    const allKinds = Util.shuffle(FILLY_KINDS.concat(MACHINE_KINDS));
    const count = Util.randi(2, 4);
    const picks = allKinds.slice(0, count);
    // 8 scattered candidate spots (grid thirds, minus dead-center) — shuffled
    // and consumed one per fixture so nothing stacks on the same tile.
    const spotFracs = Util.shuffle([
      { x:0.25, y:0.25 }, { x:0.75, y:0.25 }, { x:0.25, y:0.75 }, { x:0.75, y:0.75 },
      { x:0.5, y:0.25 }, { x:0.25, y:0.5 }, { x:0.75, y:0.5 }, { x:0.5, y:0.75 },
    ]);
    const takenSpots = [];
    for (let i = 0; i < picks.length; i++) {
      const frac = spotFracs[i % spotFracs.length];
      let spot = findNearestFloor(node, Math.floor(node.tileW * frac.x), Math.floor(node.tileH * frac.y));
      // paranoia for tiny/odd-shaped arcade polyominoes: if that candidate
      // collapsed onto a spot another fixture already took, nudge outward
      // through the remaining radius search rather than double-placing.
      if (takenSpots.some(s => s.x === spot.x && s.y === spot.y)) {
        spot = findNearestFloor(node, spot.x + (i % 2 === 0 ? 1 : -1), spot.y + (i < 2 ? 1 : -1));
      }
      takenSpots.push(spot);
      const kind = picks[i];
      if (FILLY_KINDS.includes(kind)) {
        // battery has no capstone (see shop.js's tryArcadeInteract) — fedCount
        // still tracks for flavor/consistency, `done` is simply never set for it
        node.fillies.push({ kind, x: spot.x, y: spot.y, fedCount: 0, done: false });
      } else {
        node.machines.push({ kind, x: spot.x, y: spot.y });
      }
    }
  }

  // curse rooms get no automatic content — unlike petshop/sacrifice, they're
  // meant to be hand-designed per room in the room editor (the entry/exit
  // damage tax is applied purely on the door crossing, see game.js's
  // transitionThroughDoor, so it doesn't depend on the room having anything
  // in it). With no template yet, a curse room is just an empty room.

  // vault rooms get no automatic content either — key-locked like
  // treasure/shop (see combat.js's keyLockedRoomFor), but entirely
  // hand-designed per room, same as curse.

  // crystal (angel) / sombra (devil) rooms — same deal as curse/vault, no
  // automatic content, entirely hand-designed. Sombra rooms are the intended
  // home of the "Deal" spawner category (room.js's addDealPedestal) — an
  // item pedestal that costs a heart instead of being free — but nothing
  // stops an author placing one anywhere else too.

  // challenge rooms always have exactly one guaranteed item at their center,
  // drawn from the dedicated 'challenge' pool — taking it locks the room and
  // starts a 5-wave gauntlet (see game.js's updateItemPedestal and
  // combat.js's startChallengeRoom/spawnChallengeWave/checkRoomCleared).
  if (node.type === 'challenge') {
    if (!node.itemPedestals.length) {
      const spot = findNearestFloor(node, Math.floor(node.tileW / 2), Math.floor(node.tileH / 2));
      addItemPedestal(node, pickItemFromPool('challenge'), spot.x, spot.y);
    }
    node.challengeStarted = false;
    node.challengeWave = 0;
    node.challengeTotalWaves = 5;
  }

  // sacrifice rooms always have exactly one Spike fixture at their center —
  // see combat.js's triggerSacrificeSpike for the per-step reward table.
  if (node.type === 'sacrifice' && !node.obstacles.some(o => o.kind === 'spike')) {
    const spot = findNearestFloor(node, Math.floor(node.tileW / 2), Math.floor(node.tileH / 2));
    node.obstacles.push(new Obstacle('spike', spot.x, spot.y));
  }

  // this floor's forced Swarmer DNB group — always exactly 5, added on top
  // of whatever the room already has (template or procedural) — see
  // dungeon.js's generateDungeon (node.forceSwarm is set once per floor,
  // on a single random normal room)
  if (node.forceSwarm) {
    const cx = Math.floor(node.tileW / 2), cy = Math.floor(node.tileH / 2);
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const s = findClearFloorSpot(node, cx + Math.round(Math.cos(ang) * 2), cy + Math.round(Math.sin(ang) * 2));
      node.enemies.push(new Enemy(ENEMY_TYPES.swarmerdnb, s.x, s.y, dungeon.floorNum));
    }
  }

  // Champion enemy — at most ONE per normal room, on a 5% room roll. Lives
  // here in the post-population block (rather than in either spawn loop) for
  // the same reason forceSwarm above does: this runs after BOTH
  // populateRoomProcedural and instantiateSpawner have finished, so one
  // piece of code covers both spawn paths. The doubling is applied to the
  // hp/dmg the constructor already produced — floor curve AND difficulty
  // baked in — never re-derived from type.hp/type.dmg.
  // Bosses are excluded outright: champion is a regular-enemy mechanic.
  if (node.type === 'normal' && !node.enemies.some(e => e.isChampion) && Util.chance(0.05)) {
    const candidates = node.enemies.filter(e => !e.isBoss && !e.isDead);
    if (candidates.length) {
      const champ = Util.choice(candidates);
      champ.isChampion = true;
      champ.hp = champ.maxHp = champ.hp * 2;
      champ.dmg = champ.dmg * 2;
    }
  }

  // Safety net: 'normal'/'boss' rooms start combat-locked (see ensureRoomBuilt)
  // and only unlock on an enemy-death event. A template with no enemies would
  // otherwise never fire that event and lock the player out permanently.
  if ((node.type === 'normal' || node.type === 'boss') && node.enemies.length === 0) {
    node.doorsOpen = true;
    node.cleared = true;
  }

  computePitMasks(node);
}

/* ------------------------------------------------------------
   Pit connectivity.

   Pits are immutable for a room's whole lifetime — they're never
   destroyed, never created after population, and `isPit` is set once in
   the Obstacle constructor. So each pit's 4-neighbour "is my neighbour
   also a pit" bitmask can be computed exactly ONCE, here, right after
   the obstacle list is final, and cached on the instance. The renderer
   (utils.js drawObstacle) reads `_pitMask` to skip the rim on shared
   edges so adjacent pits read as one continuous void; an obstacle
   without a mask (the room editor's synthetic preview object, which has
   no tx/ty and never goes through here) falls back to the old flat
   single-square look.
   ------------------------------------------------------------ */
function computePitMasks(node){
  const pits = node.obstacles.filter(o => o.isPit);
  if (!pits.length) return;
  const at = new Set();
  for (const p of pits) at.add(p.tx + ',' + p.ty);
  for (const p of pits) {
    let m = 0;
    if (at.has(p.tx + ',' + (p.ty - 1))) m |= PIT_N;
    if (at.has((p.tx + 1) + ',' + p.ty)) m |= PIT_E;
    if (at.has(p.tx + ',' + (p.ty + 1))) m |= PIT_S;
    if (at.has((p.tx - 1) + ',' + p.ty)) m |= PIT_W;
    p._pitMask = m;
  }
}

function populateRoomProcedural(node, dungeon, opts){
  const floorNum = dungeon.floorNum;
  const floorBranch = opts && opts.floorBranch;
  const spots = roomFloorTiles(node, { avoidDoors: 2.5, avoidCenter: node.type === 'start' ? 0 : 1.2 });
  Util.shuffle(spots);

  function takeSpot(){ return spots.length ? spots.pop() : { x: Math.floor(node.tileW/2), y: Math.floor(node.tileH/2) }; }

  function scatterObstacles(count){
    for (let i = 0; i < count; i++) {
      if (!spots.length) break;
      const s = takeSpot();
      const roll = Math.random();
      const kind = roll < 0.55 ? rollRockKind('rock', node.type) : (roll < 0.8 ? 'pit' : 'hardrock');
      node.obstacles.push(new Obstacle(kind, s.x, s.y));
    }
  }

  if (node.type === 'normal') {
    const budget = Util.clamp(2 + Math.floor(floorNum * 1.3) + Util.randi(0, 2), 2, 8);
    for (let i = 0; i < budget; i++) {
      if (!spots.length) break;
      const s = takeSpot();
      node.enemies.push(new Enemy(resolveGenericEnemy(floorNum, floorBranch), s.x, s.y, floorNum));
    }
    scatterObstacles(Util.randi(0, 4));
    if (Util.chance(0.30)) {
      const s = takeSpot();
      node.chests.push(new Chest(Util.weighted(CHEST_TYPE_POOL).id, s.x, s.y));
    }
  } else if (node.type === 'boss') {
    const bossType = (opts && opts.bossType) || resolveGenericBoss(floorNum, floorBranch);
    const center = findNearestFloor(node, Math.floor(node.tileW / 2), Math.floor(node.tileH / 2));
    const boss = new Boss(bossType, center.x, center.y, floorNum);
    node.enemies.push(boss);
    node.bossDefeated = false;
  } else if (node.type === 'treasure') {
    addItemOrTrinketPedestal(node, 'treasure', Math.floor(node.tileW / 2), Math.floor(node.tileH / 2), 0.55);
  } else if (node.type === 'shop') {
    // 3-4 slots as always, plus one deeper-floor bonus slot at floor 5 and a
    // second at floor 9, capped at SHOP_MAX_SLOTS. The evenly-spaced frac
    // layout below is unchanged — it divides the room's interior width into
    // nSlots+1 gaps, so even 6 slots on the narrowest shop shape (tileW 12)
    // land on distinct tiles (x = 2,4,5,7,8,10) and stay off both walls.
    const nSlots = Math.min(SHOP_MAX_SLOTS, Util.randi(3, 4) + shopBonusSlots(floorNum));
    for (let i = 0; i < nSlots; i++) {
      const frac = (i + 1) / (nSlots + 1);
      const x = Math.round(1 + frac * (node.tileW - 2));
      const y = Math.floor(node.tileH / 2);
      addShopSlot(node, { kind: 'generic' }, x, y, floorNum);
    }
  } else if (node.type === 'star') {
    // two stars side by side, take one — picking either overwrites whatever
    // star you were already carrying, same as any other star pickup
    const id1 = rollRandomStarId();
    let id2 = rollRandomStarId();
    let guard = 0;
    while (id2 === id1 && guard++ < 8) id2 = rollRandomStarId();
    const cx = Math.floor(node.tileW / 2), cy = Math.floor(node.tileH / 2);
    // findNearestFloor keeps both pedestals in-bounds and off walls even on
    // the 1x1 shape (12 tiles wide, so cx±2 is always inside) and on the
    // irregular 2x2 polyominoes
    const left = findNearestFloor(node, cx - 2, cy);
    const right = findNearestFloor(node, cx + 2, cy);
    addStarPedestal(node, id1, left.x, left.y);
    addStarPedestal(node, id2, right.x, right.y);
  } else if (node.type === 'cpathgate') {
    // The C-branch gate (dungeon.js, floor 2 only). Deliberately reuses the
    // EXISTING branchSpots mechanism rather than inventing a second kind of
    // interactive floor spot: game.js's checkStairs already walks branchSpots
    // and calls descend(b.branch), and render.js's drawStairs already draws
    // them, so one spot with branch 'C' is the entire interaction. Nothing
    // else lives in this room — it is a doorway, not a fight.
    const cx = Math.floor(node.tileW / 2), cy = Math.floor(node.tileH / 2);
    const spot = findNearestFloor(node, cx, cy);
    node.branchSpots = [{ x: spot.x, y: spot.y, branch: 'C', label: '3C' }];
  } else if (node.type === 'planetarium') {
    // The D-branch gate (dungeon.js, floor 3 only) — Phase 7a. Structurally
    // identical to the cpathgate branch directly above: one branchSpot, reusing
    // the existing branchSpots plumbing (checkStairs -> descend(b.branch),
    // render.js's drawStairs), nothing else in the room. Only the branch letter
    // and label differ.
    //
    // The room's UNIQUE LOOK is keyed off `node.type === 'planetarium'`
    // directly in render.js's rebuildTileLayer — no extra flag is set here, so
    // there is exactly one source of truth for "is this the star room".
    const cx = Math.floor(node.tileW / 2), cy = Math.floor(node.tileH / 2);
    const spot = findNearestFloor(node, cx, cy);
    node.branchSpots = [{ x: spot.x, y: spot.y, branch: 'D', label: '4D' }];
  } else if (node.type === 'secret') {
    // a secret room is a rare enough find to always be worth the detour
    addItemOrTrinketPedestal(node, 'secret', Math.floor(node.tileW / 2), Math.floor(node.tileH / 2));
    if (Util.chance(0.4) && spots.length) {
      const s = takeSpot();
      node.chests.push(new Chest(Util.weighted(CHEST_TYPE_POOL).id, s.x, s.y));
    }
  }
}

/* ------------------------------------------------------------
   Template-driven population + spawner resolution. This is also
   what backs the "generic"/"forced" spawners placed in the room
   editor, and the universal room-clear pickup reward.
   ------------------------------------------------------------ */
// Compact on-disk spawner encoding (see room-editor.html):
//   [x, y, 'e'|'p'|'i'|'d'|'s', 'g'|'b'|'f', specific?] — enemy/pickup/item/deal/shop
//   [x, y, 'o', specificObstacleKind]                  — obstacle (always forced)
const SPAWNER_CATEGORY_DECODE = { e:'enemy', p:'pickup', i:'item', d:'deal', s:'shop', o:'obstacle' };
function decodeSpawner(arr){
  const category = SPAWNER_CATEGORY_DECODE[arr[2]] || arr[2];
  if (category === 'obstacle') return { x: arr[0], y: arr[1], category, kind: 'forced', specific: arr[3] };
  const kindCode = arr[3];
  if (kindCode === 'g') return { x: arr[0], y: arr[1], category, kind: 'generic' };
  if (kindCode === 'b') return { x: arr[0], y: arr[1], category, kind: 'genericBoss' };
  return { x: arr[0], y: arr[1], category, kind: 'forced', specific: arr[4] };
}

function populateRoomFromTemplate(node, dungeon, opts){
  const floorNum = dungeon.floorNum;
  const tmpl = node.template;
  for (const raw of (tmpl.s || [])) instantiateSpawner(node, dungeon, floorNum, decodeSpawner(raw), opts);
  if (node.type === 'boss' && !node.enemies.some(e => e.isBoss)) {
    // safety net: template forgot to place a boss — the floor must stay winnable
    const bossType = (opts && opts.bossType) || resolveGenericBoss(floorNum, opts && opts.floorBranch);
    const center = findNearestFloor(node, Math.floor(node.tileW / 2), Math.floor(node.tileH / 2));
    node.enemies.push(new Boss(bossType, center.x, center.y, floorNum));
  }
  if (node.type === 'boss') node.bossDefeated = false;
}

function instantiateSpawner(node, dungeon, floorNum, sp, opts){
  const tx = sp.x, ty = sp.y;
  switch (sp.category) {
    case 'enemy': {
      if (sp.kind === 'genericBoss') {
        // respect a floor's forced boss (superbosses, or the floor's pre-rolled pick) if one was passed in
        const bossType = (opts && opts.bossType) || resolveGenericBoss(floorNum, opts && opts.floorBranch);
        node.enemies.push(new Boss(bossType, tx, ty, floorNum));
        break;
      }
      const specificId = sp.specific ? resolveEnemyTypeId(sp.specific) : null;
      const type = sp.kind === 'forced' ? (ENEMY_TYPES[specificId] || BOSS_TYPES[specificId]) : resolveGenericEnemy(floorNum, opts && opts.floorBranch);
      if (!type) return;
      const isBossType = sp.kind === 'forced' && !!BOSS_TYPES[specificId];
      node.enemies.push(isBossType ? new Boss(type, tx, ty, floorNum) : new Enemy(type, tx, ty, floorNum));
      break;
    }
    case 'pickup': {
      const kind = sp.kind === 'forced' ? sp.specific : rollGenericPickupKind();
      spawnResolvedPickup(node, kind, tx, ty);
      break;
    }
    case 'item': {
      const poolName = node.type === 'secret' ? 'secret'
        : node.type === 'curse' ? 'curse'
        : node.type === 'challenge' ? 'challenge'
        : node.type === 'crystal' ? 'crystal'
        : node.type === 'sombra' ? 'sombra'
        : 'treasure';
      const item = sp.kind === 'forced' ? ITEMS[sp.specific] : pickItemFromPool(poolName);
      if (item) addItemPedestal(node, item, tx, ty);
      break;
    }
    // devil-deal pedestal — always drawn from the 'sombra' pool (even a
    // forced pick still costs the same heart, see addDealPedestal below)
    case 'deal': {
      const item = sp.kind === 'forced' ? ITEMS[sp.specific] : pickItemFromPool('sombra');
      if (item) addDealPedestal(node, item, tx, ty);
      break;
    }
    case 'shop': {
      addShopSlot(node, sp, tx, ty, floorNum);
      break;
    }
    case 'obstacle': {
      const kind = rollRockKind(sp.specific, node.type);
      if (OBSTACLES[kind]) node.obstacles.push(new Obstacle(kind, tx, ty));
      break;
    }
  }
}

/* ------------------------------------------------------------
   Per-room enemy bias.

   Each stage's pool is ~26 enemies deep now (see enemies.js). Picking
   uniformly per spawn meant an 8-enemy room was eight unrelated
   creatures with no readable theme — you couldn't learn a room, only
   survive it. So each room rolls a FEATURED set of 1-2 types out of
   whatever pool it's eligible for, and those carry most of the spawns
   while the rest of the pool stays rare garnish.

   The roll is lazy (built on the first resolveGenericEnemy call for a
   room) and reset at the top of populateRoom, which is the single
   point both the template and the procedural path go through. Room
   population is synchronous, so module-level state is safe here.
   ------------------------------------------------------------ */
// how much likelier a featured type is than an unfeatured one. 12 against a
// ~26-strong pool with 2 featured puts roughly half a room's spawns on the
// featured pair, which is the intended "this is the spider room" feel.
const ROOM_FEATURED_WEIGHT = 12;
// chance the room features exactly ONE type instead of two — a coin flip, so
// half the rooms read as a single-species den and half as a pairing
const ROOM_SINGLE_FEATURE_CHANCE = 0.5;
let _roomEnemyBias = null; // Set of featured type ids for the room being populated

function resetRoomEnemyBias(){ _roomEnemyBias = null; }

// picks the featured ids out of the pool resolveGenericEnemy just computed, so
// the xpTier / floorKey filtering is respected — a type that can't spawn on
// this floor can't be featured on it either.
function rollRoomEnemyBias(pool){
  const want = Util.chance(ROOM_SINGLE_FEATURE_CHANCE) ? 1 : 2;
  const bias = new Set();
  if (pool.length <= want) return bias; // too small to bias — stays uniform
  let guard = 0;
  while (bias.size < want && guard++ < 20) bias.add(Util.choice(pool).id);
  return bias;
}

function pickBiasedEnemy(pool){
  if (!_roomEnemyBias) _roomEnemyBias = rollRoomEnemyBias(pool);
  if (!_roomEnemyBias.size) return Util.choice(pool); // degraded to uniform
  let total = 0;
  for (const e of pool) total += (e.weight || 1) * (_roomEnemyBias.has(e.id) ? ROOM_FEATURED_WEIGHT : 1);
  let r = Math.random() * total;
  for (const e of pool) {
    const w = (e.weight || 1) * (_roomEnemyBias.has(e.id) ? ROOM_FEATURED_WEIGHT : 1);
    if (r < w) return e;
    r -= w;
  }
  return pool[pool.length - 1];
}

// `branch` only matters on floorNum 8/9 (9A/9B, 10A/10B) — see stages.js's
// floorKeyFor. Every other floor ignores it and falls straight through to
// the normal stage-based pool, exactly as before.
//
// The C-branch (floorPath 'C') is different: it re-uses floorNum 2-9 for its
// own '3C'-'10C' keys, so it has to be known here too. Rather than thread a
// third argument through all ~8 call sites — every one of which is already
// inside a live run — it is read off the running game by default, and can
// still be passed explicitly (the room editor passes nothing and has no
// `game`, hence the typeof guard).
function currentFloorPath(explicit){
  if (explicit !== undefined) return explicit;
  return (typeof game !== 'undefined' && game) ? game.floorPath : null;
}

function resolveGenericEnemy(floorNum, branch, floorPath){
  // the 60 `locked:true` entries at the tail of ENEMY_TYPES only join the
  // pools once their achievement is earned — applied at EVERY step below,
  // including the last-ditch whole-ENEMY_LIST fallback, so there is no path
  // through this function that can spawn a locked creature. The unlock state
  // is the run's start-of-run snapshot (achievements.js currentUnlocks).
  const avail = e => !e.locked || isEnemyUnlocked(e.id);
  const floorKey = floorKeyFor(floorNum, branch, currentFloorPath(floorPath));
  if (floorKey) {
    const fkPool = ENEMY_LIST.filter(e => e.floorKey === floorKey && !e.isMinion && avail(e));
    if (fkPool.length) return pickBiasedEnemy(fkPool);
  }
  const stage = stageIndexForFloor(floorNum);
  const floorInStage = floorNum % FLOORS_PER_STAGE;
  let pool = ENEMY_LIST.filter(e => e.stage === stage && !e.isMinion && avail(e) && (e.xpTier || 1) <= 1 + floorInStage);
  if (!pool.length) pool = ENEMY_LIST.filter(e => e.stage === stage && !e.isMinion && avail(e));
  // final fallback keeps its "any enemy at all" breadth, minus the locked ones
  // (every stage has plenty of always-unlocked entries, so this can't empty out)
  if (!pool.length) pool = ENEMY_LIST.filter(avail);
  return pickBiasedEnemy(pool.length ? pool : ENEMY_LIST);
}

function resolveGenericBoss(floorNum, branch, floorPath){
  const floorKey = floorKeyFor(floorNum, branch, currentFloorPath(floorPath));
  if (floorKey) {
    const fkPool = BOSS_LIST.filter(b => b.floorKey === floorKey);
    if (fkPool.length) return Util.choice(fkPool);
  }
  const stage = stageIndexForFloor(floorNum);
  const pool = BOSS_LIST.filter(b => b.stage === stage);
  return Util.choice(pool.length ? pool : BOSS_LIST);
}

// any time a plain 'rock' obstacle is about to be created — procedural
// scatter or a hand-authored "rock" spawner alike — there's a small chance
// it's secretly a Tinted Rock instead (see data.js's tintedrock and
// combat.js's bomb-blast handling for its reward table when destroyed).
// Diamond Dog (noTintedRocks) is the exception: her claw shatters plain rock
// for free, so a tinted rock would just be a free item pedestal every time one
// spawned — she never gets them at all.
function rollRockKind(kind, roomType){
  if (kind !== 'rock') return kind;
  // start rooms never roll tinted — you shouldn't be able to open a run on a
  // free item pedestal before you've even picked a fight (see roomTemplates.js
  // header comment / the "new stuff" pass that added this restriction)
  if (roomType === 'start') return kind;
  // reaches the live run the same way bestiary/achievement code does, via
  // achievements.js's activeGame() — guarded because room.js also runs in the
  // room editor, where neither achievements.js nor a run exists
  let p = null;
  try { p = (typeof activeGame === 'function' && activeGame()) ? activeGame().player : null; } catch (e) { p = null; }
  if (p && p.def && p.def.noTintedRocks) return kind;
  // was 0.02 — halved as part of the same "new stuff" pass, tinted rocks were
  // showing up too often for how good their reward table is
  return Util.chance(0.01) ? 'tintedrock' : kind;
}

// picks a base kind from PICKUP_POOL, then — only for the generic/unforced
// path — re-rolls a plain bomb/key against its tier pool so it occasionally
// comes out as a double/gold variant instead. See BOMB_TIER_POOL/KEY_TIER_POOL.
function rollGenericPickupKind(){
  const kind = Util.weighted(PICKUP_POOL).kind;
  if (kind === 'bomb') return Util.weighted(BOMB_TIER_POOL.filter(t => !t.locked || isPickupKindUnlocked(t.id))).id;
  if (kind === 'key') return Util.weighted(KEY_TIER_POOL.filter(t => !t.locked || isPickupKindUnlocked(t.id))).id;
  return kind;
}

// the 10% "sack/battery" slice of the room-clear reward — battery further
// splits into a 50/50 full-charge vs 2-slot mini-charge (see CLEAR_REWARD_CHANCE).
// All three start locked (see achievements.js); returns null if none are
// unlocked yet so the caller can fall back to an ordinary pickup instead.
const SACK_BATTERY_WEIGHTS = { sack:50, minibattery:25, battery:25 };
function rollSackBatteryKind(){
  const candidates = Object.keys(SACK_BATTERY_WEIGHTS).filter(isPickupKindUnlocked).map(id => ({ id, w: SACK_BATTERY_WEIGHTS[id] }));
  if (!candidates.length) return null;
  return Util.weighted(candidates).id;
}

// picks a random item from a named pool ('secret'|'treasure'|'boss'|'chest'|'shop').
// Items can belong to several pools at once — see data.js's ITEMS table
// (POOLS_ALL / POOLS_SPECIAL). Keeps the existing roughly-50/50 passive/active
// split; passiveChance lets a caller nudge that (treasure rooms skew passive).
function pickItemFromPool(poolName, passiveChance){
  const available = i => !i.locked || isItemUnlocked(i.id);
  // active items used to be an even 50/50 against passives; that made them
  // show up more often than felt right given how much heavier an active
  // slot commitment is (single active-item slot, competes with charge
  // management) — default nudged down to a 32% active / 68% passive split.
  // passiveChance is still an explicit per-caller override (e.g. treasure
  // rooms' 0.55) and takes priority over this default when given.
  const wantType = Math.random() < (passiveChance !== undefined ? passiveChance : 0.68) ? 'passive' : 'active';
  let candidates = ITEM_LIST.filter(i => available(i) && i.pools && i.pools.includes(poolName) && i.type === wantType);
  if (!candidates.length) candidates = ITEM_LIST.filter(i => available(i) && i.pools && i.pools.includes(poolName));
  if (!candidates.length) candidates = (wantType === 'passive' ? PASSIVE_ITEMS : ACTIVE_ITEMS).filter(available);
  if (!candidates.length) candidates = ITEM_LIST.filter(available); // last-ditch: shouldn't happen with 90+ unlocked items
  return pickByQuality(candidates);
}

// items are weighted by quality (1-4, see data.js) whenever they spawn:
// 40% quality 1, 30% quality 2, 20% quality 3, 10% quality 4. Rolls a tier
// first, then picks uniformly among whatever's available at that tier —
// falling back to a plain uniform pick across every candidate if nothing's
// currently available at the rolled tier (e.g. every quality-4 item in this
// pool still locked early on), so the roll never comes up empty.
const ITEM_QUALITY_WEIGHTS = [ { q:1, w:40 }, { q:2, w:30 }, { q:3, w:20 }, { q:4, w:10 } ];
function pickByQuality(candidates){
  if (!candidates.length) return null;
  const tier = Util.weighted(ITEM_QUALITY_WEIGHTS).q;
  const atTier = candidates.filter(i => (i.quality || 1) === tier);
  return Util.choice(atTier.length ? atTier : candidates);
}

function spawnResolvedPickup(node, kindOrCoin, tx, ty){
  if (kindOrCoin === 'coin') { node.pickups.push(new Pickup('coin', tx, ty, Util.weighted(COIN_TYPES))); return; }
  if (typeof kindOrCoin === 'string' && kindOrCoin.indexOf('coin:') === 0) {
    const tier = kindOrCoin.split(':')[1];
    const coin = COIN_TYPES.find(c => c.id === tier) || Util.weighted(COIN_TYPES);
    node.pickups.push(new Pickup('coin', tx, ty, coin));
    return;
  }
  if (kindOrCoin === 'pill') { node.pickups.push(new Pickup('pill', tx, ty, rollRandomPillColorId())); return; }
  if (kindOrCoin === 'star') { node.pickups.push(new Pickup('star', tx, ty, rollRandomStarId())); return; }
  if (typeof kindOrCoin === 'string' && kindOrCoin.indexOf('chest:') === 0) {
    const chestKind = kindOrCoin.split(':')[1];
    node.chests.push(new Chest(CHEST_TYPES[chestKind] ? chestKind : 'grey', tx, ty));
    return;
  }
  node.pickups.push(new Pickup(kindOrCoin, tx, ty));
}

function addItemPedestal(node, item, tx, ty){
  if (!node.itemPedestals) node.itemPedestals = [];
  node.itemPedestals.push({ item, taken: false, x: tx, y: ty });
}

// devil-deal pedestal — rides the same pedestal plumbing as a normal item,
// but costs a heart to take instead of being free; `isDeal`/`heartCost` are
// what tell game.js's updateItemPedestal() to charge for it. Placeable in
// the room editor under its own "Deal" category — see roomEditor.js.
function addDealPedestal(node, item, tx, ty){
  if (!node.itemPedestals) node.itemPedestals = [];
  node.itemPedestals.push({ item, taken: false, x: tx, y: ty, isDeal: true, heartCost: 1 });
}

// shrine pedestal — same pedestal plumbing again, but priced in COINS instead
// of hearts (a deal can never kill you; a shrine offer just gets declined if
// you're broke). `isShrine`/`coinCost` are what tell game.js's
// updateItemPedestal() to charge coins for it instead of taking it free.
function addShrinePedestal(node, item, tx, ty, coinCost){
  if (!node.itemPedestals) node.itemPedestals = [];
  node.itemPedestals.push({ item, taken: false, x: tx, y: ty, isShrine: true, coinCost });
}

// trinkets ride on the exact same pedestal (and pickup-on-touch) plumbing as
// items — `isTrinket` is the only thing that tells game.js's
// updateItemPedestal() to equip it instead of adding it to the passives bag.
function addTrinketPedestal(node, trinket, tx, ty){
  if (!node.itemPedestals) node.itemPedestals = [];
  node.itemPedestals.push({ item: trinket, taken: false, x: tx, y: ty, isTrinket: true });
}

// stars ride the same pedestal plumbing as items/trinkets/familiars too —
// `isStar` tells game.js's updateItemPedestal() to hand the star to
// combat.js's grantPickupEffect (which fills player.starPocket, overwriting
// whatever star was held) instead of adding an item. `item` is the
// STAR_TYPES def itself, so the generic pedestal renderer (render.js's
// drawItemPedestal → Util.drawItemIcon) and the examine tooltip (ui.js's
// showItemExamine) already read the right icon/color/name/desc with no
// changes of their own. `starId` is what actually gets granted.
function addStarPedestal(node, starId, tx, ty){
  if (!node.itemPedestals) node.itemPedestals = [];
  node.itemPedestals.push({ item: STAR_TYPES[starId], taken: false, x: tx, y: ty, isStar: true, starId });
}

function pickTrinketFromPool(){
  const candidates = TRINKET_LIST.filter(t => !t.locked || isTrinketUnlocked(t.id));
  return candidates.length ? Util.choice(candidates) : null;
}

// familiars ride the same pedestal plumbing too — `isFamiliar` tells
// game.js's updateItemPedestal() to add a companion instead
function addFamiliarPedestal(node, familiar, tx, ty){
  if (!node.itemPedestals) node.itemPedestals = [];
  node.itemPedestals.push({ item: familiar, taken: false, x: tx, y: ty, isFamiliar: true });
}

function pickFamiliarFromPool(){
  const candidates = FAMILIAR_LIST.filter(f => !f.locked || isFamiliarUnlocked(f.id));
  return candidates.length ? Util.choice(candidates) : null;
}

// same locked-filtering idea as the two pools above, but returns just the id
// (not the def) since that's all Pickup/grantPickupEffect need — see
// spawnResolvedPickup's 'star' case below and combat.js's grantPickupEffect
function rollRandomStarId(){
  const candidates = STAR_LIST.filter(s => !s.locked || isStarUnlocked(s.id));
  return (candidates.length ? Util.choice(candidates) : Util.choice(STAR_LIST)).id;
}

// ...and the same for pill colors (data.js's PILL_COLORS — the last 40 are
// `locked:true`). The ONLY place a pill's color gets drawn: spawnResolvedPickup
// below and combat.js's grantPickupEffect (the shop/chest path, which hands in
// no explicit color) both call this, so a locked swatch can't leak in through
// either. Returns an id, like rollRandomStarId, since that's all Pickup and
// player.pillPocket ever carry. The 60 original colors are unlocked (no
// `locked` field), so the candidate list is never empty in practice — the
// fallback is belt-and-braces only.
function rollRandomPillColorId(){
  const candidates = PILL_COLORS.filter(c => !c.locked || isPillColorUnlocked(c.id));
  return (candidates.length ? Util.choice(candidates) : Util.choice(PILL_COLORS)).id;
}

/* ------------------------------------------------------------
   Reroll mechanics — Deneb / Altair / Capella (see stars.js).

   All three live here rather than in stars.js because they're room
   CONTENT manipulation, and they reuse this file's own spawn helpers
   (pickItemFromPool, resolveGenericEnemy, roomFloorTiles) directly.

   The load-bearing rule for all three: a reroll must never be able to
   leave a room unsolvable. Concretely that means
     - never touching room geometry (walls, doors, pits, rocks) —
       see REROLLABLE_HAZARD_KINDS below,
     - never changing the number of living enemies in a combat-locked
       room (the doors only open on an enemy-death event, so dropping
       the count to zero without going through handleEnemyDeath would
       lock the player in forever),
     - never touching a boss.
   ------------------------------------------------------------ */

// which item pool a pedestal rerolled in this room should draw from —
// same mapping instantiateSpawner's 'item' case uses, kept in one place
function itemPoolForRoomType(type){
  return type === 'secret' ? 'secret'
    : type === 'curse' ? 'curse'
    : type === 'challenge' ? 'challenge'
    : type === 'crystal' ? 'crystal'
    : type === 'sombra' ? 'sombra'
    : 'treasure';
}

// Deneb — rerolls ONE untaken pedestal in the room into a different
// prize of the same KIND (an item pedestal stays an item pedestal, a
// trinket stays a trinket, a devil deal stays a deal and still costs its
// heart). Purely a swap of the pedestal's `item` reference: position,
// taken-state and flags are untouched, so this can't affect pathing or
// the room's lock state at all. Returns the new prize, or null if there
// was nothing to reroll.
function rerollOnePedestal(node){
  const list = (node.itemPedestals || []).filter(p => !p.taken);
  if (!list.length) return null;
  const ped = Util.choice(list);
  let next = null;
  if (ped.isFamiliar) next = pickFamiliarFromPool();
  else if (ped.isTrinket) next = pickTrinketFromPool();
  else if (ped.isDeal) next = pickItemFromPool('sombra');
  else next = pickItemFromPool(itemPoolForRoomType(node.type));
  if (!next) return null; // pool came up empty (everything still locked) — leave the pedestal alone
  ped.item = next;
  return next;
}

/* Altair — the reroll pool AND the eligibility filter, deliberately the
   same list. An obstacle is only rerolled if its kind is in here, and it
   can only ever become another kind from in here, so no reroll can add
   or remove a solid/structural obstacle:

     included — cactus, the four fires, spiketrap, movingspike (all
       `hazard:true` and non-solid: walk-over damage, nothing more) plus
       sandtrap and mud (`walkable:true`, explicitly non-blocking).
     excluded — rock/hardrock/tallrock/tallhardrock/tintedrock/pit
       (room layout and pathing), turrets and bomb barrels (solid, and
       barrels are a puzzle element), spikedrock (`solid:true` — a
       hazard, but a BLOCKING one), and `spike` (the sacrifice room's
       fixed centerpiece, a room mechanic rather than a hazard).

   Every kind in the list is non-blocking in both directions, so swapping
   any of them for any other never opens or closes a path. */
const REROLLABLE_HAZARD_KINDS = ['cactus', 'yellowfire', 'redfire', 'bluefire', 'purplefire',
  'spiketrap', 'movingspike', 'sandtrap', 'mud'];

function rerollRoomHazards(node){
  let count = 0;
  for (let i = 0; i < node.obstacles.length; i++) {
    const ob = node.obstacles[i];
    if (ob.destroyed || REROLLABLE_HAZARD_KINDS.indexOf(ob.kind) === -1) continue;
    let kind = Util.choice(REROLLABLE_HAZARD_KINDS);
    if (kind === ob.kind) kind = Util.choice(REROLLABLE_HAZARD_KINDS); // one re-roll so it usually actually changes
    // a fresh Obstacle re-derives def/color/hp/flags from the new kind —
    // same tile, so the room's layout is bit-for-bit identical
    node.obstacles[i] = new Obstacle(kind, ob.tx, ob.ty);
    markBestiarySeen('objectsSeen', kind); // see js/bestiary.js — it's in the room now
    count++;
  }
  return count;
}

// Capella — swaps every living regular enemy for a freshly rolled one of
// the same COUNT. The outgoing enemies are removed silently (no
// handleEnemyDeath): a reroll shouldn't pay kill credit, loot or bestiary
// progress, or the star would just be a farm button. Because the count is
// preserved and the swap is synchronous, the room never momentarily reads
// as cleared, so a combat-locked room stays locked and then unlocks
// normally when the NEW set dies.
// Refuses outright in a room holding a living boss — bosses are never
// rerolled, and a boss room's other enemies are the boss's own minions.
function rerollRoomEnemies(node, floorNum, floorBranch){
  if (node.enemies.some(e => e.isBoss && !e.isDead)) return 0;
  const living = node.enemies.filter(e => !e.isDead && !e.isBoss);
  if (!living.length) return 0;
  node.enemies = node.enemies.filter(e => living.indexOf(e) === -1);
  const spots = roomFloorTiles(node, { avoidDoors: 2.5, avoidCenter: 1.2 });
  Util.shuffle(spots);
  resetRoomEnemyBias(); // the new set rolls its own featured types, same as a fresh room
  for (let i = 0; i < living.length; i++) {
    const s = spots.length ? spots.pop()
      : findClearFloorSpot(node, Math.floor(node.tileW / 2), Math.floor(node.tileH / 2));
    node.enemies.push(new Enemy(resolveGenericEnemy(floorNum, floorBranch), s.x, s.y, floorNum));
  }
  return living.length;
}

// Bellatrix — the same promotion room.js's own 5%-per-room champion roll
// applies (see populateRoom), applied to everything at once. Doubling the
// hp/dmg the constructor already produced, never re-derived from the type,
// so the floor curve and difficulty stay baked in. Bosses excluded.
function championizeRoomEnemies(node){
  let count = 0;
  for (const e of node.enemies) {
    if (e.isDead || e.isBoss || e.isChampion) continue;
    e.isChampion = true;
    e.hp = e.maxHp = e.hp * 2;
    e.dmg = e.dmg * 2;
    count++;
  }
  return count;
}

// a small independent chance for a "found an item" moment to be a trinket
// or familiar instead — used by treasure/secret rooms and chests
function addItemOrTrinketPedestal(node, poolName, tx, ty, passiveChance){
  const familiar = Util.chance(0.10) ? pickFamiliarFromPool() : null;
  const trinket = !familiar && Util.chance(0.15) ? pickTrinketFromPool() : null;
  if (familiar) addFamiliarPedestal(node, familiar, tx, ty);
  else if (trinket) addTrinketPedestal(node, trinket, tx, ty);
  else addItemPedestal(node, pickItemFromPool(poolName, passiveChance), tx, ty);
}

// generic-roll odds for a shop slot's kind — see shop.js's shopPrice() for
// what each kind actually costs (base price, minus any donation-machine
// discount earned for that kind).
const SHOP_SLOT_KIND_WEIGHTS = [
  { kind:'pickup', w:35 },
  { kind:'item', w:40 },
  { kind:'trinket', w:12 },
  { kind:'familiar', w:13 },
];

// Deeper shops are physically bigger, not just pricier — one extra slot from
// floor 5 on, a second from floor 9 on. Only the procedural shop layout uses
// this (a hand-authored template shop places exactly the spawners it draws);
// SHOP_MAX_SLOTS is the hard ceiling the narrowest shop shape can lay out
// without two slots landing on the same tile — see populateRoomProcedural.
const SHOP_MAX_SLOTS = 6;
const SHOP_BONUS_SLOT_FLOORS = [5, 9];
function shopBonusSlots(floorNum){
  const f = floorNum || 0;
  let n = 0;
  for (const threshold of SHOP_BONUS_SLOT_FLOORS) if (f >= threshold) n++;
  return n;
}

// floorNum is threaded through purely for pricing — see shop.js's
// shopFloorPriceMult. It's optional (0 = no scaling) so any older/editor call
// site that doesn't know the floor still prices at the flat base table.
function addShopSlot(node, sp, tx, ty, floorNum){
  if (!node.shopSlots) node.shopSlots = [];
  node.shopFloorNum = floorNum || 0; // remembered so a reroll re-prices at the same depth
  if (sp.kind === 'forced' && sp.specific) {
    if (ITEMS[sp.specific]) {
      const item = ITEMS[sp.specific];
      node.shopSlots.push({ kind: 'item', item, price: shopPrice('item', floorNum), x: tx, y: ty, bought: false });
    } else if (TRINKETS[sp.specific]) {
      const trinket = TRINKETS[sp.specific];
      node.shopSlots.push({ kind: 'trinket', trinket, price: shopPrice('trinket', floorNum), x: tx, y: ty, bought: false });
    } else if (FAMILIAR_TYPES[sp.specific]) {
      const familiar = FAMILIAR_TYPES[sp.specific];
      node.shopSlots.push({ kind: 'familiar', familiar, price: shopPrice('familiar', floorNum), x: tx, y: ty, bought: false });
    } else {
      node.shopSlots.push({ kind: 'pickup', pickup: sp.specific, price: shopPrice(sp.specific, floorNum), x: tx, y: ty, bought: false });
    }
    return;
  }

  const roll = Util.weighted(SHOP_SLOT_KIND_WEIGHTS).kind;
  if (roll === 'trinket') {
    const trinket = pickTrinketFromPool();
    if (trinket) { node.shopSlots.push({ kind: 'trinket', trinket, price: shopPrice('trinket', floorNum), x: tx, y: ty, bought: false }); return; }
  } else if (roll === 'familiar') {
    const familiar = pickFamiliarFromPool();
    if (familiar) { node.shopSlots.push({ kind: 'familiar', familiar, price: shopPrice('familiar', floorNum), x: tx, y: ty, bought: false }); return; }
  } else if (roll === 'pickup') {
    const p = Util.choice(SHOP_PICKUP_PRICES);
    node.shopSlots.push({ kind: 'pickup', pickup: p.kind, price: shopPrice(p.kind, floorNum), x: tx, y: ty, bought: false });
    return;
  }
  // roll === 'item', or the trinket/familiar pool was empty (nothing unlocked yet)
  const item = pickItemFromPool('shop');
  node.shopSlots.push({ kind: 'item', item, price: shopPrice('item', floorNum), x: tx, y: ty, bought: false });
}

/* ------------------------------------------------------------
   Reroll altar support — the reroll fixture (see shop.js's
   tryRerollAltar) re-rolls every unbought item/trinket/familiar
   slot in place. Pickup slots are deliberately left alone: they're
   the cheap "I need a heart RIGHT NOW" safety valve, and letting a
   reroll churn them would make the altar a way to launder 3c into
   a guaranteed item slot.
   ------------------------------------------------------------ */
// same weights as SHOP_SLOT_KIND_WEIGHTS minus the pickup slice, renormalized
// by Util.weighted's own total — a reroll never turns a slot into a pickup.
const SHOP_REROLL_KIND_WEIGHTS = [
  { kind:'item', w:40 },
  { kind:'trinket', w:12 },
  { kind:'familiar', w:13 },
];

// how many slots this room has that a reroll would actually touch
function countRerollableShopSlots(node){
  if (!node.shopSlots) return 0;
  let n = 0;
  for (const slot of node.shopSlots) {
    if (slot.bought) continue;
    if (slot.kind === 'item' || slot.kind === 'trinket' || slot.kind === 'familiar') n++;
  }
  return n;
}

// rerolls in place (keeps x/y, so nothing can move out of the room's layout)
// and re-prices at this shop's own floor depth. Returns how many changed.
function rerollShopSlots(node){
  if (!node.shopSlots) return 0;
  const floorNum = node.shopFloorNum || 0;
  let n = 0;
  for (const slot of node.shopSlots) {
    if (slot.bought) continue;
    if (slot.kind !== 'item' && slot.kind !== 'trinket' && slot.kind !== 'familiar') continue;
    const roll = Util.weighted(SHOP_REROLL_KIND_WEIGHTS).kind;
    let trinket = null, familiar = null;
    if (roll === 'trinket') trinket = pickTrinketFromPool();
    else if (roll === 'familiar') familiar = pickFamiliarFromPool();
    slot.item = null; slot.trinket = null; slot.familiar = null;
    if (trinket) { slot.kind = 'trinket'; slot.trinket = trinket; }
    else if (familiar) { slot.kind = 'familiar'; slot.familiar = familiar; }
    else { slot.kind = 'item'; slot.item = pickItemFromPool('shop'); }
    slot.price = shopPrice(slot.kind, floorNum);
    n++;
  }
  return n;
}

/* ------------------------------------------------------------
   The universal room-clear reward (see game.onRoomJustCleared):
   15% nothing, 65% common, 15% rare, 5% legendary — see
   CLEAR_REWARD_CHANCE and the COMMON_CATEGORY_POOL / COMMON_PENNY_POOL /
   COMMON_HEART_POOL / RARE_POOL / LEGENDARY_POOL tables in data.js.
   ------------------------------------------------------------ */
function spawnClearRoomPickup(game){
  const node = game.currentRoom;
  if (node.type === 'boss') return; // the stairs already spawn dead-center; don't stack a reward under them
  let c = CLEAR_REWARD_CHANCE;
  if (game.player.passives.fortuneshell) {
    // Fortune Shell — shifts some of the "nothing" chance into the legendary
    // chance instead (chests now live inside that tier), see data.js
    const shift = c.nothing * 0.6;
    c = { nothing: c.nothing - shift, common: c.common, rare: c.rare, legendary: c.legendary + shift };
  }
  const tier = Util.weighted(Object.keys(c).map(id => ({ id, w: c[id] }))).id;
  if (tier === 'nothing') return;
  const spot = findClearFloorSpot(node, Math.floor(node.tileW / 2), Math.floor(node.tileH / 2));

  if (tier === 'common') {
    const cat = Util.weighted(COMMON_CATEGORY_POOL).id;
    if (cat === 'penny') {
      const coin = Util.weighted(COMMON_PENNY_POOL).id;
      // cursedpenny is a plain Pickup kind, not one of the COIN_TYPES tiers
      spawnResolvedPickup(node, coin === 'cursedpenny' ? 'cursedpenny' : 'coin:' + coin, spot.x, spot.y);
    } else if (cat === 'heart') {
      spawnResolvedPickup(node, Util.weighted(COMMON_HEART_POOL).id, spot.x, spot.y);
    } else if (cat === 'bomb') {
      spawnResolvedPickup(node, Util.weighted(BOMB_TIER_POOL.filter(t => !t.locked || isPickupKindUnlocked(t.id))).id, spot.x, spot.y);
    } else {
      spawnResolvedPickup(node, Util.weighted(KEY_TIER_POOL.filter(t => !t.locked || isPickupKindUnlocked(t.id))).id, spot.x, spot.y);
    }
    return;
  }

  if (tier === 'rare') {
    // 'pill'/'star' get their random color/id resolved inside the helper;
    // sack/battery fall through to a plain Pickup — both are achievement-gated
    // kinds (ACHIEVEMENT_PICKUP_KINDS), so filter the same way the common
    // tier's bomb/key rolls already do above.
    const candidates = RARE_POOL.filter(t => !ACHIEVEMENT_PICKUP_KINDS.includes(t.id) || isPickupKindUnlocked(t.id));
    if (!candidates.length) return;
    spawnResolvedPickup(node, Util.weighted(candidates).id, spot.x, spot.y);
    return;
  }

  // tier === 'legendary'
  const leg = Util.weighted(LEGENDARY_POOL).id;
  if (leg === 'trinket') {
    const trinket = pickTrinketFromPool();
    // equipTrinket/addFamiliar handle their own sound + toast + float text
    // (see items.js) — same convention combat.js's openChestContents uses
    if (trinket) { equipTrinket(game, trinket); return; }
  } else if (leg === 'familiar') {
    const familiar = pickFamiliarFromPool();
    if (familiar) { addFamiliar(game, familiar); return; }
  }
  // leg === 'chest', or the trinket/familiar pool was empty (nothing unlocked yet)
  node.chests.push(new Chest(Util.weighted(CHEST_TYPE_POOL).id, spot.x, spot.y));
}

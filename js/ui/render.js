'use strict';
/* ============================================================
   render.js — all canvas drawing for Game (methods bolted onto
   Game.prototype). Split out of game.js so state/logic and
   pixels don't have to live in one file.

   PERFORMANCE NOTES — this is the "heavily optimized" pass:

   1. Static tile-layer caching. drawTiles() used to re-run a
      fillRect/strokeRect (and occasionally a string-concat
      fillStyle) for *every tile in the room, every frame*,
      even though a room's floor/wall/door layout only actually
      changes twice in its life: when its doors unlock and when
      a secret passage crumbles open. That's now baked once to
      an offscreen <canvas> cached on the room (`node._tileCanvas`)
      and re-blitted with a single drawImage() per frame; the
      expensive per-tile loop only re-runs when doorsOpen flips
      or something explicitly marks the room dirty (see
      `node.tileLayerDirty`, set in combat.js's openSecretPassage).
      For a big 3-4 block room that's the difference between a
      few hundred draw calls a frame and one.

   2. DPR-aware backing store. The canvas is rendered at
      devicePixelRatio (capped — see MAX_DPR in game.js) instead
      of 1:1 logical pixels, so it stays crisp on retina/high-DPI
      screens instead of being upscaled-blurry by CSS. The tile
      cache is rendered at the same physical resolution so it
      doesn't get blown back up to blurry when blitted.

   3. One `game.now` timestamp per tick instead of every bob /
      flicker animation calling performance.now() itself.

   4. drawWorldSorted() reuses a scratch array (and a pool of
      {y,kind,ref} records) instead of allocating a new
      filtered+spread array every single frame.

   5. Pre-baked enemy sprites. The static half of every raider
      body — torso, head, arms, eyes, archetype gear — is baked
      once per (archetype, colour, size, flash) to a small
      offscreen canvas and blitted, exactly like the tile layer
      above. The animated half (legs, wings, fuses, boss auras)
      still draws live every frame, so nothing about the motion
      changed. See Util._humanoidSprite.

   6. Cached gradients. Util.shadeColor is memoized and
      Util.bodyShadeLocal caches the body-shading radial gradient
      per (colour, offset, radius) for the callers that draw in a
      translated local space, instead of building a fresh gradient
      (plus three colour-string parses) per fill per frame.

   7. The vignette gradient is built once, not per frame.
   ============================================================ */

/* ============================================================
   FX — screen shake, hit-stop and the particle pool.

   Deliberately self-contained and driven from the render path, so
   nothing outside this file has to change for it to work. Everything
   here is also a *public trigger*: combat.js can call FX.shake(),
   FX.hitStop(), FX.sparks() etc. directly whenever it likes — see
   feature-research/graphics/audit.md for the exact call sites.

   The pool is fixed-size and preallocated at load: spawning never
   allocates, it just recycles the oldest slot in a ring. That matters
   because particle bursts happen exactly when the frame is already
   busy (a bomb going off, a boss dying).
   ============================================================ */
// style.css already honours the OS-level "reduce motion" setting for its DOM
// animations; this extends that same intent to the FX that live in JS and it
// can't reach. Screen shake is dropped outright (the one effect most likely to
// actually make someone ill) and particle bursts are thinned rather than
// removed, so an impact still reads — just calmer. Live-updating, so flipping
// the OS setting mid-run takes effect without a reload.
const _reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
let prefersReducedMotion = !!(_reducedMotionQuery && _reducedMotionQuery.matches);
if (_reducedMotionQuery && _reducedMotionQuery.addEventListener) {
  _reducedMotionQuery.addEventListener('change', (e) => { prefersReducedMotion = e.matches; });
}
// identity when the preference isn't set — default output stays pixel-identical
function reducedCount(n){ return prefersReducedMotion ? Math.max(1, Math.round(n * 0.35)) : n; }

const FX = {
  MAX: 260,
  _p: null,
  _next: 0,
  shakeX: 0, shakeY: 0,
  _shakeMag: 0, _shakeT: 0, _shakeDur: 1,
  hitStopTimer: 0,

  init(){
    if (this._p) return;
    const p = new Array(this.MAX);
    for (let i = 0; i < this.MAX; i++) {
      p[i] = { life: 0, maxLife: 1, x: 0, y: 0, vx: 0, vy: 0, grav: 0, drag: 2.2, size: 1, color: '#fff', kind: 0 };
    }
    this._p = p;
  },

  // wipe everything — called on a room change so a transition never carries
  // the previous room's sparks/shake across the fade
  reset(){
    this.init();
    for (let i = 0; i < this.MAX; i++) this._p[i].life = 0;
    this._shakeT = 0; this._shakeMag = 0; this.shakeX = 0; this.shakeY = 0;
    this.hitStopTimer = 0;
  },

  _take(){
    const q = this._p[this._next];
    this._next = (this._next + 1) % this.MAX;
    return q;
  },

  // low-level spawn. Positional args rather than an options object so a
  // 12-particle burst doesn't allocate 12 short-lived objects.
  emit(x, y, vx, vy, life, size, color, kind, grav, drag){
    const q = this._take();
    q.x = x; q.y = y; q.vx = vx; q.vy = vy;
    q.life = life; q.maxLife = life;
    q.size = size; q.color = color; q.kind = kind || 0;
    q.grav = grav || 0; q.drag = drag === undefined ? 2.2 : drag;
    return q;
  },

  /* ---- public spawns ---- */

  // a quick spray of streaks — an impact landed here
  sparks(x, y, color, count){
    this.init();
    const n = reducedCount(count || 5);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 110;
      this.emit(x, y, Math.cos(a) * s, Math.sin(a) * s - 20, 0.16 + Math.random() * 0.12,
        1.2 + Math.random(), color || Theme.particle.hitSpark, 1, 240, 3.4);
    }
  },

  // a slow expanding cloud — something just died / broke here
  puff(x, y, color, count){
    this.init();
    const n = reducedCount(count || 8);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 8 + Math.random() * 30;
      this.emit(x, y + Util.rand(-4, 4), Math.cos(a) * s, Math.sin(a) * s - 22,
        0.32 + Math.random() * 0.24, 2 + Math.random() * 2.4, color || Theme.particle.bloodPuff, 2, -14, 1.6);
    }
  },

  // scuffed-up floor grit under a moving body
  dust(x, y){
    this.init();
    const a = Math.random() * Math.PI * 2;
    this.emit(x, y, Math.cos(a) * 10, Math.sin(a) * 5 - 6, 0.3 + Math.random() * 0.2,
      1.1 + Math.random() * 1.1, Theme.particle.dustSolid, 3, -8, 2.6);
  },

  // a slow rising glint off something worth picking up
  sparkle(x, y, color){
    this.init();
    this.emit(x, y, Util.rand(-6, 6), -14 - Math.random() * 10, 0.5 + Math.random() * 0.3,
      1 + Math.random() * 0.8, color || Theme.particle.sparkle, 3, -6, 1.2);
  },

  // Phase 6b overhaul — a quick ring of tiny rising motes for a "reward just
  // revealed" beat (arcade machine win, filly capstone) — distinct from
  // sparkle's single slow glint (idle floor shimmer) and burst's punchy
  // outward explosion; this one is springier/brighter and stays close to
  // its origin, reading as "good news" rather than "impact".
  twinkle(x, y, color, count){
    this.init();
    const n = reducedCount(count || 7);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      const s = 26 + Math.random() * 34;
      this.emit(x, y, Math.cos(a) * s, Math.sin(a) * s - 30, 0.34 + Math.random() * 0.22,
        1.1 + Math.random() * 1.2, color || Theme.particle.sparkle, 3, -10, 1.7);
    }
  },

  // generic radial burst (explosions)
  burst(x, y, color, count, speed){
    this.init();
    const n = reducedCount(count || 10), sp = speed || 120;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const s = sp * (0.5 + Math.random() * 0.7);
      this.emit(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.26 + Math.random() * 0.2,
        1.6 + Math.random() * 1.8, color, 1, 60, 3);
    }
  },

  // amount is a peak offset in logical px; the strongest request wins so a
  // small hit can't stomp on a boss explosion that's already shaking
  shake(amount, duration){
    if (prefersReducedMotion) return; // no screen shake at all under reduce-motion
    const d = duration || 0.2;
    const current = this._shakeMag * Math.max(0, this._shakeT / this._shakeDur);
    if (amount <= current) return;
    this._shakeMag = amount; this._shakeDur = d; this._shakeT = d;
  },

  // brief freeze-frame. The mechanism lives here; making the *simulation*
  // stop needs one line in game.js's update() — see the audit.
  hitStop(seconds){
    if (seconds > this.hitStopTimer) this.hitStopTimer = seconds;
  },
  frozen(){ return this.hitStopTimer > 0; },

  update(dt){
    this.init();
    if (this.hitStopTimer > 0) { this.hitStopTimer -= dt; return; }
    if (this._shakeT > 0) {
      this._shakeT -= dt;
      if (this._shakeT <= 0) { this._shakeT = 0; this._shakeMag = 0; this.shakeX = 0; this.shakeY = 0; }
      else {
        // quadratic falloff — a sharp snap that settles, not a long wobble
        const k = this._shakeT / this._shakeDur, a = this._shakeMag * k * k;
        this.shakeX = (Math.random() * 2 - 1) * a;
        this.shakeY = (Math.random() * 2 - 1) * a;
      }
    }
    const p = this._p;
    for (let i = 0; i < this.MAX; i++) {
      const q = p[i];
      if (q.life <= 0) continue;
      q.life -= dt;
      if (q.life <= 0) continue;
      q.vy += q.grav * dt;
      const d = 1 - Math.min(0.95, q.drag * dt);
      q.vx *= d; q.vy *= d;
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
  },

  draw(ctx){
    const p = this._p;
    if (!p) return;
    for (let i = 0; i < this.MAX; i++) {
      const q = p[i];
      if (q.life <= 0) continue;
      const t = q.life / q.maxLife;
      ctx.globalAlpha = t < 0.4 ? t / 0.4 : 1;
      if (q.kind === 1) { // spark — a short streak trailing its own velocity
        ctx.strokeStyle = q.color; ctx.lineWidth = q.size;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x - q.vx * 0.022, q.y - q.vy * 0.022);
        ctx.stroke();
      } else if (q.kind === 2) { // puff — grows as it thins out
        ctx.fillStyle = q.color;
        ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1.9 - t), 0, Math.PI * 2); ctx.fill();
      } else { // dot — dust, sparkles
        ctx.fillStyle = q.color;
        ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (0.4 + t * 0.6), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  },
};
FX.init();

// obstacle kinds that are holes/stains in the floor rather than things
// standing on it — they're drawn in a flat ground pass before the y-sort so
// nothing can ever sort "behind" a puddle. See drawGroundObstacles.
const GROUND_OBSTACLES = { pit: 1, mud: 1, sandtrap: 1 };
// pickup kinds worth an idle shimmer (see updateAmbientFX)
const SPARKLE_PICKUPS = { coin: 1, goldkey: 1, goldbomb: 1, star: 1, heartContainer: 1 };
// hoisted so the per-frame depth sort doesn't allocate a fresh comparator
const SORT_BY_Y = (a, b) => a.y - b.y;

// One door tile: the flat fill it always had, plus a dark recess line around
// the opening and an inset panel carrying the same bevel the wall blocks get
// (light top/left, dark bottom/right) — so a doorway reads as a panel set
// into the wall instead of a flat colored square. Baked into the tile layer
// exactly where the old fillRect was, both for T_DOOR tiles and for the
// special-room door slots below. Colors are all derived from the existing
// palette/DOOR_COLORS entry via shadeColor — no new hex values.
function paintDoorTile(ctx, px, py, color){
  ctx.fillStyle = color;
  ctx.fillRect(px, py, TILE, TILE);
  const i = 4; // panel inset
  ctx.fillStyle = Util.shadeColor(color, 0.07);
  ctx.fillRect(px + i, py + i, TILE - i * 2, TILE - i * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = Util.shadeColor(color, 0.22);
  ctx.beginPath();
  ctx.moveTo(px + i + 0.5, py + TILE - i - 0.5);
  ctx.lineTo(px + i + 0.5, py + i + 0.5);
  ctx.lineTo(px + TILE - i - 0.5, py + i + 0.5);
  ctx.stroke();
  ctx.strokeStyle = Util.shadeColor(color, -0.3);
  ctx.beginPath();
  ctx.moveTo(px + TILE - i - 0.5, py + i + 0.5);
  ctx.lineTo(px + TILE - i - 0.5, py + TILE - i - 0.5);
  ctx.lineTo(px + i + 0.5, py + TILE - i - 0.5);
  ctx.stroke();
  // recess: dark keyline right at the tile edge so the door sits *in* the wall
  ctx.strokeStyle = Util.shadeColor(color, -0.45);
  ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
}

// One PORTAL door tile — the Planetarium's replacement for paintDoorTile's
// panel-in-a-wall look (Phase 7a). A doorway in a room with no walls can't
// read as a panel set into anything, so it reads as an opening in space
// instead: a radial gradient core fading to transparent, plus a thin bright
// ring at the tile edge.
//
// BAKED STATIC into the room's cached tile canvas, exactly like every other
// door in the game — no live overlay pass. The tile cache is the entire reason
// room tiles cost nothing per frame (see rebuildTileLayer/drawTiles), and an
// animated door would have to either dirty that cache every frame or add a
// second per-frame pass over every door cell; neither is worth it for a room
// the player crosses once. Hence no `now` parameter: nothing here moves.
function paintPortalTile(ctx, px, py, color){
  const cx = px + TILE / 2, cy = py + TILE / 2, r = TILE / 2;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, Util.shadeColor(color, 0.45));
  g.addColorStop(0.55, color);
  g.addColorStop(1, Util.shadeColor(color, -0.55));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = Util.shadeColor(color, 0.6);
  ctx.beginPath(); ctx.arc(cx, cy, r - 2.5, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = Util.shadeColor(color, -0.35);
  ctx.beginPath(); ctx.arc(cx, cy, r - 0.75, 0, Math.PI * 2); ctx.stroke();
}

// One starfield tile — what the Planetarium paints wherever a wall or a void
// tile would normally go (Phase 7a). Deliberately built from the same
// deterministic tileRand(x, y, salt) streams the stone/floor texture uses, so
// the stars stay put across tile-layer rebakes (a door unlocking re-bakes the
// whole canvas) instead of resampling into a different sky each time.
//
// Cost is bounded and tiny: a flat fill, plus 0-3 sub-3px dots per tile, baked
// once per room. `depth` tints the base fill so the ring of tiles just outside
// the floor reads as slightly nearer than the far corners.
function paintStarfieldTile(ctx, px, py, tx, ty, pal, depth){
  ctx.fillStyle = Util.shadeColor(pal.voidC, depth);
  ctx.fillRect(px, py, TILE, TILE);
  const n = tileRand(tx, ty, 101) < 0.42 ? 0 : tileRand(tx, ty, 102) < 0.72 ? 1 : tileRand(tx, ty, 103) < 0.92 ? 2 : 3;
  for (let i = 0; i < n; i++) {
    const sx = px + 2 + tileRand(tx, ty, 110 + i) * (TILE - 4);
    const sy = py + 2 + tileRand(tx, ty, 120 + i) * (TILE - 4);
    const mag = tileRand(tx, ty, 130 + i); // "magnitude" — most stars faint, a few bright
    const rr = 0.5 + mag * mag * 1.9;
    // brightest stars pick up the palette accent, the rest stay near-white
    ctx.fillStyle = mag > 0.9 ? pal.accent : 'rgba(226,232,255,' + (0.25 + mag * 0.6).toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(sx, sy, rr, 0, Math.PI * 2); ctx.fill();
    if (mag > 0.93) { // a faint halo on the few brightest
      ctx.fillStyle = 'rgba(226,232,255,0.10)';
      ctx.beginPath(); ctx.arc(sx, sy, rr * 2.6, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function pickupIconChar(kind){
  return { bomb: 'B', key: 'K', heartRed: '♥', heartBlue: '♥', star: '★' }[kind] || '?';
}

// deterministic per-tile pseudo-random in [0,1) — same (x,y,salt) always
// gives the same value, so wall/floor texture detail (see rebuildTileLayer)
// stays put across tile-layer rebakes instead of shimmering when a door
// unlocks or a secret passage opens. `salt` picks a different independent
// stream out of the same (x,y) so e.g. a tile's shade variance and its
// crack placement don't end up correlated.
function tileRand(x, y, salt){
  let h = (x * 374761393 + y * 668265263 + salt * 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

Object.assign(Game.prototype, {

  currentPalette(){
    // C-branch first and unconditionally — its floorNum 2-9 collide with the
    // normal path's, so it must never reach the chain below. See stages.js.
    if (this.floorPath === 'C') return cPaletteFor(this.dungeon.floorNum);
    // D-branch, same rule and the same reason — its floorNum 3-9 collide with
    // both of the other two paths' meanings for those numbers.
    if (this.floorPath === 'D') return dPaletteFor(this.dungeon.floorNum);
    if (this.dungeon.floorNum === 8) return BRANCH_PALETTES[this.floorBranch === 'B' ? 'B' : 'A'];
    if (this.dungeon.floorNum === 9) return BRANCH_PALETTES_10[this.floorBranch === 'B' ? 'B' : 'A'];
    if (this.dungeon.floorNum === 10) return BRANCH_PALETTES_11[this.floorBranch === 'B' ? 'B' : 'A'];
    if (this.dungeon.floorNum === 11) return BRANCH_PALETTES_12[this.floorBranch === 'B' ? 'B' : 'A'];
    // Phase 7a — floors 13/14/15 are all linear (no branch split), and each has
    // its own flat palette. Without these three lines stageIndexForFloor would
    // clamp all of them to the Inferno's.
    if (this.dungeon.floorNum === 12) return HOLLOW_CHORUS_PALETTE;
    if (this.dungeon.floorNum === 13) return FINAL_WAVEFORM_PALETTE;
    if (this.dungeon.floorNum === 14) return FINAL_PALETTE; // floor 15 — the finale
    return STAGES[stageIndexForFloor(this.dungeon.floorNum)].palette;
  },

  render(){
    if (this.state !== 'playing') return;
    const ctx = this.ctx;
    // Smoothing is now an explicit decision rather than whatever the browser
    // defaulted to: everything this game draws is anti-aliased vector art, and
    // the only drawImage() calls (the tile cache, the baked enemy sprites) are
    // blitted at exactly 1:1 device pixels, so smoothing costs nothing there
    // and keeps sub-pixel edges from hardening. See style.css's #game rule for
    // the matching decision about the CSS upscale.
    if (!this._ctxTuned) {
      ctx.imageSmoothingEnabled = true;
      if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
      this._ctxTuned = true;
    }

    // FX run off game.now, which update() only advances while actually
    // playing — so pausing freezes particles and shake for free.
    const fxDt = this._fxLastNow ? Math.min(0.05, (this.now - this._fxLastNow) / 1000) : 0;
    this._fxLastNow = this.now;
    if (this._fxRoom !== this.currentRoom) { FX.reset(); this._fxRoom = this.currentRoom; }
    // ROOM_FREEZE_TIME / the room-fade veil own the screen during a
    // transition — don't shake or spawn anything underneath them
    if (this.freezeTimer > 0 || this.paused) { FX.shakeX = 0; FX.shakeY = 0; }
    else { FX.update(fxDt); this.updateAmbientFX(fxDt); }

    // reset+apply the dpr scale fresh every frame (cheaper & safer than tracking
    // whether it's already applied) — everything below this line draws in logical
    // (un-scaled) camera-space pixels, exactly as before this optimization pass
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, CAMERA_W, CAMERA_H);
    ctx.save();
    // screen shake rides on top of the camera, rounded the same way the camera
    // is so the tile layer keeps landing on whole pixels
    ctx.translate(-Math.round(this.camX) + Math.round(FX.shakeX), -Math.round(this.camY) + Math.round(FX.shakeY));
    this.drawTiles();
    this.drawGroundObstacles();
    this.drawItemPedestal();
    this.drawShop();
    this.drawDonationMachineFixture();
    this.drawRerollAltarFixture();
    this.drawArcadeFixtures();
    this.drawPlayerTurrets();
    this.drawStairs();
    this.drawGreenFireZone(); // on the floor, under everything that stands in it
    this.drawChangelingMinions();
    this.drawWorldSorted();
    this.drawProjectiles();
    this.drawBombsExplosions();
    this.drawSwingFX();
    this.drawLaserFX();
    FX.draw(ctx);
    this.drawFloatTexts();
    ctx.restore();
    // screen-space passes, in deliberate order: the vignette is world lighting
    // so it goes first; the boss bar and the transition veil are UI and sit on
    // top of it (which is what keeps the vignette from tinting readouts).
    this.drawVignette();
    if (this.currentRoom.type === 'boss' && !this.currentRoom.cleared) this.drawBossHealthBar();
    if (this.roomFadeTimer > 0) {
      const a = Util.clamp(this.roomFadeTimer / ROOM_FADE_TIME, 0, 1);
      ctx.fillStyle = Theme.rgba(Theme.rgb.fadeVeil, a * 0.65);
      ctx.fillRect(0, 0, CAMERA_W, CAMERA_H);
    }
  },

  // A soft dark falloff toward the corners — "the torch doesn't quite reach
  // the edges of the room". Built once (it only depends on the camera size)
  // and reused, since a full-screen gradient per frame would be the single
  // most expensive thing in this file.
  drawVignette(){
    if (!Theme.vignette.enabled) return;
    const ctx = this.ctx;
    let g = this._vignetteGrad;
    if (!g) {
      const cx = CAMERA_W / 2, cy = CAMERA_H / 2;
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(cx, cy));
      for (const [at, col] of Theme.vignette.stops) g.addColorStop(at, col);
      this._vignetteGrad = g;
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CAMERA_W, CAMERA_H);
  },

  // The FX that this file can drive on its own, without combat.js having to
  // call anything: everything below is derived from state that is already
  // observable at draw time (a rising hitFlash, an enemy flipped to isDead, a
  // fresh Explosion in the list). combat.js calling the FX triggers directly
  // would be crisper still — see the audit — but this keeps the effects
  // working with zero changes to files this pass doesn't own.
  updateAmbientFX(dt){
    const p = this.player, node = this.currentRoom;

    // scuff dust off the player's hooves while moving
    this._fxDustT = (this._fxDustT || 0) - dt;
    if (p.moving && this._fxDustT <= 0) {
      this._fxDustT = 0.085;
      FX.dust(p.x + Util.rand(-4, 4), p.y + p.radius * 0.6);
    }

    // idle shimmer on loot that's worth walking over to
    this._fxSparkT = (this._fxSparkT || 0) - dt;
    if (this._fxSparkT <= 0) {
      this._fxSparkT = 0.2;
      const list = node.pickups;
      if (list.length) {
        const pk = list[(Math.random() * list.length) | 0];
        if (SPARKLE_PICKUPS[pk.kind]) FX.sparkle(pk.x + Util.rand(-7, 7), pk.y + Util.rand(-8, 4));
      }
    }

    // death puffs — dead enemies stay in node.enemies (see combat.js's
    // handleEnemyDeath), so the isDead flip is observable exactly once
    for (const e of node.enemies) {
      if (e.isDead && !e._fxDeath) {
        e._fxDeath = true;
        FX.puff(e.x, e.y, e.dark || e.color, e.isBoss ? 18 : 9);
        FX.shake(e.isBoss ? 5 : 1.4, e.isBoss ? 0.4 : 0.12);
      }
    }

    // explosions get a real kick plus an outward spray of embers
    for (const ex of this.explosions) {
      if (!ex._fxSeen) {
        ex._fxSeen = true;
        FX.shake(6, 0.3);
        FX.burst(ex.x, ex.y, Theme.particle.hitSpark, 12, 170);
      }
    }
  },

  // (Re)bakes the room's static floor/wall/door tiles to an offscreen canvas
  // cached on the room node. Only called from drawTiles() when the cache is
  // missing or stale — see the staleness check there.
  // The Planetarium's whole tile layer (Phase 7a) — the one room in the game
  // that doesn't paint walls. Everything a wall or void tile would have been
  // becomes starfield, the floor becomes a lit platform floating in it, and the
  // doors become portals. Called from rebuildTileLayer's early special case, so
  // it inherits the exact same caching (bakes once into node._tileCanvas) and
  // the exact same staleness rules as every other room.
  //
  // Deliberately does NOT touch buildRoomTiles's grid: node.tiles is read
  // exactly as-is, so walkability, door geometry and collision are bit-for-bit
  // identical to a normal room. Only the paint step differs.
  rebuildPlanetariumTiles(node, pal, ctx){
    // distance-from-floor drives the sky's depth tint: tiles right against the
    // platform are lifted slightly, far corners sink toward pure voidC
    const nearFloor = (tx, ty) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const y = ty + dy, x = tx + dx;
        if (y < 0 || y >= node.tileH || x < 0 || x >= node.tileW) continue;
        const t = node.tiles[y][x];
        if (t === T_FLOOR || t === T_SECRET_OPEN) return true;
      }
      return false;
    };
    for (let y = 0; y < node.tileH; y++) {
      for (let x = 0; x < node.tileW; x++) {
        const t = node.tiles[y][x];
        const px = x * TILE, py = y * TILE;
        // walls, secret walls and void all become the same sky — this is the
        // "no walls" half of the room's identity
        if (t === T_VOID || t === T_WALL || t === T_SECRET) {
          paintStarfieldTile(ctx, px, py, x, y, pal, nearFloor(x, y) ? 0.10 : 0);
          continue;
        }
        if (t === T_DOOR) {
          paintStarfieldTile(ctx, px, py, x, y, pal, 0.10); // sky behind the portal's soft edge
          paintPortalTile(ctx, px, py, node.doorsOpen ? Theme.door.planetarium.open : Theme.door.planetarium.locked);
          continue;
        }
        // the platform — same checkerboard the rest of the game uses so it
        // still reads as a floor, but lifted and rimmed rather than sunken:
        // there is nothing above it to cast the usual ambient occlusion
        const baseFloor = ((x + y) % 2 === 0) ? pal.floorA : pal.floorB;
        ctx.fillStyle = Util.shadeColor(baseFloor, 0.06 + (tileRand(x, y, 41) - 0.5) * 0.10);
        ctx.fillRect(px, py, TILE, TILE);
        // rim light on every platform edge that faces open sky
        const openAt = (tx, ty) => {
          if (ty < 0 || ty >= node.tileH || tx < 0 || tx >= node.tileW) return true;
          const tt = node.tiles[ty][tx];
          return tt === T_WALL || tt === T_SECRET || tt === T_VOID;
        };
        ctx.fillStyle = 'rgba(180,200,255,0.20)';
        const rw = Theme.shadow.aoWidth;
        if (openAt(x, y - 1)) ctx.fillRect(px, py, TILE, rw);
        if (openAt(x, y + 1)) ctx.fillRect(px, py + TILE - rw, TILE, rw);
        if (openAt(x - 1, y)) ctx.fillRect(px, py, rw, TILE);
        if (openAt(x + 1, y)) ctx.fillRect(px + TILE - rw, py, rw, TILE);
        // a sparse dusting of the same speckle the normal floor gets, so the
        // platform isn't perfectly flat colour
        if (tileRand(x, y, 7) < 0.14) {
          ctx.fillStyle = pal.accent + '22';
          const dx = 5 + tileRand(x, y, 50) * 22, dy = 5 + tileRand(x, y, 60) * 22;
          ctx.beginPath(); ctx.arc(px + dx, py + dy, 1 + tileRand(x, y, 70) * 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    // Special-room door slots, same pass the normal path runs — but every one
    // of them is painted as a portal here regardless of which room type it
    // leads to, because a panel-style door would break the "no walls" read.
    // The destination's own colour is still used, so the signposting survives.
    for (const slot of node.doorSlots) {
      if (slot.type !== 'normal' || !slot.cells) continue;
      const neighbor = slot.pairedSlot ? slot.pairedSlot.room : null;
      const destType = neighbor ? neighbor.type : 'normal';
      const table = DOOR_COLORS[destType] || DOOR_COLORS.normal;
      const col = node.doorsOpen ? table.open : table.locked;
      for (const c of slot.cells) {
        paintStarfieldTile(ctx, c.x * TILE, c.y * TILE, c.x, c.y, pal, 0.10);
        paintPortalTile(ctx, c.x * TILE, c.y * TILE, col);
      }
    }
  },

  rebuildTileLayer(node, pal){
    const w = node.tileW * TILE, h = node.tileH * TILE;
    let cv = node._tileCanvas;
    if (!cv) { cv = document.createElement('canvas'); node._tileCanvas = cv; }
    const pw = Math.ceil(w * this.dpr), ph = Math.ceil(h * this.dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Phase 7a — the Planetarium (the D-branch gate room) paints nothing the
    // way the rest of the game does: no beveled stone, starfield instead of
    // walls and void, portal doors. Handled entirely in its own method and
    // returned early, so the normal path below is untouched by it. The three
    // bookkeeping fields at the bottom of this function are still set, because
    // drawTiles' staleness check reads them for every room alike.
    if (node.type === 'planetarium') {
      this.rebuildPlanetariumTiles(node, pal, ctx);
      node._tileLayerDoorsOpen = node.doorsOpen;
      node._tileLayerPalette = pal;
      node.tileLayerDirty = false;
      return;
    }

    // a wall/void tile blocks light for the floor-edge ambient-occlusion
    // pass below — hoisted out of the loop, out-of-room counts as solid too
    const isSolid = (tx, ty) => {
      if (ty < 0 || ty >= node.tileH || tx < 0 || tx >= node.tileW) return true;
      const tt = node.tiles[ty][tx];
      return tt === T_WALL || tt === T_SECRET || tt === T_VOID;
    };
    for (let y = 0; y < node.tileH; y++) {
      for (let x = 0; x < node.tileW; x++) {
        const t = node.tiles[y][x];
        const px = x * TILE, py = y * TILE;
        if (t === T_VOID) { ctx.fillStyle = pal.voidC; ctx.fillRect(px, py, TILE, TILE); continue; }
        if (t === T_WALL || t === T_SECRET) {
          // per-block shade variance so a wall reads as individual stones,
          // not one flat-colored grid — deterministic per tile coordinate
          // so it stays put across tile-layer rebakes (door unlocks, etc.)
          const shade = (tileRand(x, y, 11) - 0.5) * 0.22;
          ctx.fillStyle = Util.shadeColor(pal.wall, shade);
          ctx.fillRect(px, py, TILE, TILE);
          // beveled edge — light top/left, dark bottom/right — so each
          // block reads as a slightly raised stone instead of a flat square
          ctx.strokeStyle = Util.shadeColor(pal.wall, shade + 0.2);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 0.5, py + TILE - 0.5); ctx.lineTo(px + 0.5, py + 0.5); ctx.lineTo(px + TILE - 0.5, py + 0.5);
          ctx.stroke();
          ctx.strokeStyle = Util.shadeColor(pal.wall, shade - 0.22);
          ctx.beginPath();
          ctx.moveTo(px + TILE - 0.5, py + 0.5); ctx.lineTo(px + TILE - 0.5, py + TILE - 0.5); ctx.lineTo(px + 0.5, py + TILE - 0.5);
          ctx.stroke();
          ctx.strokeStyle = pal.grout;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
          // sparse weathering — a crack on some blocks, moss/grime speck on
          // others, nothing on most — same tile-seeded determinism as above
          const wear = tileRand(x, y, 29);
          if (wear < 0.1) {
            ctx.strokeStyle = Util.shadeColor(pal.wall, -0.45); ctx.lineWidth = 1;
            const cx1 = px + 6 + tileRand(x, y, 3) * 20, cy1 = py + 4 + tileRand(x, y, 4) * 6;
            ctx.beginPath();
            ctx.moveTo(cx1, cy1);
            ctx.lineTo(cx1 + 4 - tileRand(x, y, 5) * 8, cy1 + 10 + tileRand(x, y, 6) * 8);
            ctx.lineTo(cx1 + 2 - tileRand(x, y, 7) * 6, cy1 + 18 + tileRand(x, y, 8) * 6);
            ctx.stroke();
          } else if (wear > 0.88) {
            ctx.fillStyle = pal.accent + '25';
            const sx = px + 6 + tileRand(x, y, 9) * 20, sy = py + 6 + tileRand(x, y, 10) * 20;
            ctx.beginPath(); ctx.arc(sx, sy, 2 + tileRand(x, y, 12) * 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + 3, sy + 2, 1.4, 0, Math.PI * 2); ctx.fill();
          }
          continue;
        }
        if (t === T_DOOR) {
          paintDoorTile(ctx, px, py, node.doorsOpen ? pal.doorOpen : pal.doorLocked);
          continue;
        }
        if (t === T_SECRET_OPEN) { ctx.fillStyle = Theme.world.secretOpen; ctx.fillRect(px, py, TILE, TILE); continue; }

        // floor — checkerboard base, plus per-tile shade variance so it
        // doesn't read as a perfectly regular 2-color grid
        const baseFloor = ((x + y) % 2 === 0) ? pal.floorA : pal.floorB;
        ctx.fillStyle = Util.shadeColor(baseFloor, (tileRand(x, y, 41) - 0.5) * 0.14);
        ctx.fillRect(px, py, TILE, TILE);

        // ambient occlusion — darken whichever edges touch a wall/void so
        // the room reads as a sunken floor instead of a flat color fill
        const aoW = Theme.shadow.aoWidth;
        ctx.fillStyle = Theme.shadow.ao;
        if (isSolid(x, y - 1)) ctx.fillRect(px, py, TILE, aoW);
        if (isSolid(x, y + 1)) ctx.fillRect(px, py + TILE - aoW, TILE, aoW);
        if (isSolid(x - 1, y)) ctx.fillRect(px, py, aoW, TILE);
        if (isSolid(x + 1, y)) ctx.fillRect(px + TILE - aoW, py, aoW, TILE);

        // grit speckles — a couple of small varied dots instead of one
        // uniform square, plus a rare thin crack for extra texture
        const sv = tileRand(x, y, 7);
        if (sv < 0.16) {
          ctx.fillStyle = pal.accent + '20';
          const n = sv < 0.05 ? 2 : 1;
          for (let i = 0; i < n; i++) {
            const dx = 5 + tileRand(x, y, 50 + i) * 22, dy = 5 + tileRand(x, y, 60 + i) * 22;
            const rr = 1 + tileRand(x, y, 70 + i) * 1.6;
            ctx.beginPath(); ctx.arc(px + dx, py + dy, rr, 0, Math.PI * 2); ctx.fill();
          }
        }
        if (tileRand(x, y, 91) > 0.965) {
          ctx.strokeStyle = Util.shadeColor(baseFloor, -0.35); ctx.lineWidth = 1;
          const sx = px + 6 + tileRand(x, y, 92) * 8, sy = py + 6 + tileRand(x, y, 93) * 8;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + 8 + tileRand(x, y, 94) * 10, sy + 10 + tileRand(x, y, 95) * 8);
          ctx.stroke();
        }
      }
    }
    // special rooms get special doors (secret walls stay disguised as plain walls above)
    for (const slot of node.doorSlots) {
      if (slot.type !== 'normal' || !slot.cells) continue;
      const neighbor = slot.pairedSlot ? slot.pairedSlot.room : null;
      const destType = neighbor ? neighbor.type : 'normal';
      const table = DOOR_COLORS[destType] || DOOR_COLORS.normal;
      const col = node.doorsOpen ? table.open : table.locked;
      for (const c of slot.cells) paintDoorTile(ctx, c.x * TILE, c.y * TILE, col);
    }

    node._tileLayerDoorsOpen = node.doorsOpen;
    node._tileLayerPalette = pal;
    node.tileLayerDirty = false;
  },

  drawTiles(){
    const node = this.currentRoom;
    const pal = this.currentPalette();
    const stale = !node._tileCanvas || node.tileLayerDirty ||
      node._tileLayerDoorsOpen !== node.doorsOpen || node._tileLayerPalette !== pal;
    if (stale) this.rebuildTileLayer(node, pal);
    this.ctx.drawImage(node._tileCanvas, 0, 0, node.tileW * TILE, node.tileH * TILE);
  },

  // pits/mud/sand — floor features, not things standing on the floor, so they
  // stay in a flat pass under everything instead of joining the y-sort
  drawGroundObstacles(){
    const ctx = this.ctx;
    for (const ob of this.currentRoom.obstacles) {
      if (ob.destroyed || !GROUND_OBSTACLES[ob.kind]) continue;
      Util.drawObstacle(ctx, ob, this.now);
    }
  },

  drawItemPedestal(){
    const node = this.currentRoom;
    if (!node.itemPedestals) return;
    const ctx = this.ctx;
    for (const ped of node.itemPedestals) {
      const px = ped.x * TILE, py = ped.y * TILE;
      // "rebalance" pass — trinkets spawn loose on the floor, no pedestal
      // fixture (per the request: pick-up-or-leave, same as any other
      // ground item). Pickup radius/examine-tooltip range are unchanged —
      // both already key off itemPedestals generically (see game.js's
      // updateItemPedestal/updateItemExamine), so this is purely visual.
      if (ped.isTrinket) {
        if (!ped.taken) {
          ctx.fillStyle = Theme.shadow.pedestal;
          ctx.beginPath(); ctx.ellipse(px, py + 8, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
          const bob = Math.sin(this.now / 260 + px) * 3;
          Util.drawItemIcon(ctx, px, py - 4 + bob, ped.item, this.now);
        }
        continue;
      }
      ctx.fillStyle = Theme.shadow.pedestal;
      ctx.beginPath(); ctx.ellipse(px, py + 12, 17, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = Theme.world.pedestalBase; Util.drawRoundedRect(ctx, px - 16, py + 6, 32, 10, 2); ctx.fill();
      ctx.fillStyle = Util.bodyShade(ctx, px, py + 3, 14, Theme.world.pedestalTop); Util.drawRoundedRect(ctx, px - 12, py - 2, 24, 10, 2); ctx.fill();
      if (!ped.taken) {
        const bob = Math.sin(this.now / 260 + px) * 3;
        Util.drawItemIcon(ctx, px, py - 16 + bob, ped.item, this.now);
      }
    }
  },

  drawShop(){
    const node = this.currentRoom;
    if (!node.shopSlots) return;
    const ctx = this.ctx;
    for (const slot of node.shopSlots) {
      const px = slot.x * TILE, py = slot.y * TILE;
      ctx.fillStyle = Util.bodyShade(ctx, px, py + 11, 14, Theme.world.pedestalBase); Util.drawRoundedRect(ctx, px - 16, py + 6, 32, 10, 2); ctx.fill();
      if (slot.bought) continue;
      const bob = Math.sin(this.now / 260 + px) * 3;
      ctx.save();
      ctx.translate(px, py - 10 + bob);
      if (slot.kind === 'item' || slot.kind === 'trinket' || slot.kind === 'familiar') {
        const thing = slot.item || slot.trinket || slot.familiar;
        const glow = thing.quality ? Util.qualityGlow(thing.quality) : null;
        if (glow) { ctx.shadowColor = glow.color; ctx.shadowBlur = glow.blur; }
        ctx.fillStyle = Util.bodyShadeLocal(ctx, 0, 0, 12, thing.color);
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = Theme.ui.onIcon; ctx.fillText(thing.icon, 0, 1);
      } else {
        ctx.fillStyle = Util.bodyShadeLocal(ctx, 0, 0, 10, Theme.world.shopPickup);
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = Theme.ui.onIconSoft; ctx.fillText(pickupIconChar(slot.pickup), 0, 1);
      }
      ctx.restore();
      ctx.fillStyle = this.player.coins >= slot.price ? Theme.ui.gold : Theme.ui.goldDim;
      ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(slot.price + 'c', px, py + 30);
    }
  },

  drawDonationMachineFixture(){
    const node = this.currentRoom;
    if (!node.donationMachine) return;
    const ctx = this.ctx;
    const px = node.donationMachine.x * TILE, py = node.donationMachine.y * TILE;
    Util.drawDonationMachine(ctx, px, py, donationProgressFrac());
    // a plain "342 / 1000c" readout under the fill bar — the bar alone makes
    // it hard to tell exactly how close the next -1c discount tier is
    const unlocks = ensureUnlockShape(loadUnlocks());
    ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = Theme.ui.textDim;
    ctx.fillText(Util.formatNum(unlocks.stats.donationTotal) + ' / ' + Util.formatNum(DONATION_CAP) + 'c', px, py + 28);
  },

  drawRerollAltarFixture(){
    const node = this.currentRoom;
    if (!node.rerollAltar) return;
    const ctx = this.ctx;
    const px = node.rerollAltar.x * TILE, py = node.rerollAltar.y * TILE;
    Util.drawRerollAltar(ctx, px, py, this.now);
    // price + keybind readout, same placement as the donation machine's
    // "342 / 1000c" line. Greys out when the shelf has nothing rerollable left.
    const live = countRerollableShopSlots(node) > 0;
    const cost = rerollAltarCost(node.rerollAltar);
    ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = live && this.player.coins >= cost ? Theme.ui.gold : Theme.ui.textDim;
    ctx.fillText('[G] Reroll ' + cost + 'c', px, py + 24);
  },

  // Phase 4 overhaul — arcade room fixtures (see room.js's populateRoom's
  // node.fillies/node.machines, shop.js's tryArcadeInteract). Same
  // unconditional per-frame draw shape as drawDonationMachineFixture/
  // drawRerollAltarFixture above, just looped over two arrays instead of a
  // single optional fixture — guarded on the arrays existing since only
  // arcade rooms ever populate them.
  drawArcadeFixtures(){
    const node = this.currentRoom;
    const ctx = this.ctx;
    if (node.fillies) {
      for (const f of node.fillies) {
        Util.drawFilly(ctx, f.x * TILE, f.y * TILE, f.kind, this.now);
      }
    }
    if (node.machines) {
      for (const m of node.machines) {
        const px = m.x * TILE, py = m.y * TILE;
        if (m.kind === 'friendship') Util.drawFriendshipMachine(ctx, px, py, m, this.now);
        else if (m.kind === 'tools') Util.drawToolsMachine(ctx, px, py, m, this.now);
        else if (m.kind === 'dark') Util.drawDarkMachine(ctx, px, py);
      }
    }
  },

  // Phase 5a overhaul — Engineer Pony's built turrets (see combat.js's
  // updatePlayerTurrets/node.playerTurrets). Same unconditional per-frame
  // guarded-array shape as drawArcadeFixtures above. Coordinates are already
  // world pixels (unlike node.fillies/node.machines), no TILE multiply.
  drawPlayerTurrets(){
    const node = this.currentRoom;
    if (!node.playerTurrets) return;
    const ctx = this.ctx;
    for (const turret of node.playerTurrets) Util.drawPlayerTurret(ctx, turret, this.now);
  },

  // Changeling Queen's summoned minions (see combat.js's
  // updateChangelingSummons/player.changelingMinions) — drawn right after
  // the green fire zone since a minion's own attack is a smaller version of
  // that same effect. player.changelingMinions is eagerly initialized to []
  // on every Player (see entities.js), so this is a safe no-op for every
  // other class.
  drawChangelingMinions(){
    const minions = this.player && this.player.changelingMinions;
    if (!minions || !minions.length) return;
    const ctx = this.ctx;
    for (const m of minions) Util.drawChangelingMinion(ctx, m, this.now);
  },

  drawStairs(){
    const node = this.currentRoom;
    const ctx = this.ctx;
    if (node.branchSpots) {
      for (const b of node.branchSpots) {
        const px = b.x * TILE, py = b.y * TILE;
        ctx.fillStyle = Theme.world.stairsPit;
        ctx.beginPath(); ctx.ellipse(px, py, 24, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = b.branch === 'B' ? Theme.world.branchB : Theme.world.branchA; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(b.label, px, py + 34);
      }
      return;
    }
    if (!node.stairsSpot) return;
    const px = node.stairsSpot.x * TILE, py = node.stairsSpot.y * TILE;
    ctx.fillStyle = Theme.world.stairsPit;
    ctx.beginPath(); ctx.ellipse(px, py, 26, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = Theme.world.stairsRing; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = Theme.world.stairsRing; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(this.isLastFloorOfRun() ? 'ESCAPE' : 'DOWN', px, py + 34);
  },

  // one pooled {y, kind, ref} record per sortable thing. The pool grows to the
  // busiest frame the run has seen and then stops allocating entirely — same
  // spirit as the scratch array this replaces, just carrying a type tag too.
  _drawEntry(i){
    const pool = this._drawPool || (this._drawPool = []);
    return pool[i] || (pool[i] = { y: 0, kind: 0, ref: null });
  },

  // The depth pass. Obstacles, pickups, chests, enemies, familiars and the
  // player all sort against each other by y, so a tall rock actually stands
  // in front of whatever is behind it instead of the draw order deciding.
  // (Before this, only enemies and the player were sorted, and everything
  // else was layered by whichever draw call happened to run first.)
  drawWorldSorted(){
    const node = this.currentRoom, ctx = this.ctx;
    const list = this._entityDrawScratch;
    list.length = 0;
    let n = 0;
    for (const ob of node.obstacles) {
      if (ob.destroyed || GROUND_OBSTACLES[ob.kind]) continue;
      const en = this._drawEntry(n++); en.kind = 0; en.ref = ob; en.y = ob.y; list.push(en);
    }
    for (const pk of node.pickups) {
      const en = this._drawEntry(n++); en.kind = 1; en.ref = pk; en.y = pk.y; list.push(en);
    }
    for (const c of node.chests) {
      const en = this._drawEntry(n++); en.kind = 2; en.ref = c; en.y = c.y; list.push(en);
    }
    for (const e of node.enemies) {
      if (e.isDead) continue;
      const en = this._drawEntry(n++); en.kind = 3; en.ref = e; en.y = e.y; list.push(en);
    }
    for (const f of this.player.familiars) {
      const en = this._drawEntry(n++); en.kind = 4; en.ref = f; en.y = f.y; list.push(en);
    }
    const pe = this._drawEntry(n++); pe.kind = 5; pe.ref = this.player; pe.y = this.player.y; list.push(pe);

    list.sort(SORT_BY_Y);
    for (const en of list) {
      switch (en.kind) {
        case 0: Util.drawObstacle(ctx, en.ref, this.now); break;
        case 1: Util.drawPickupIcon(ctx, en.ref, Math.sin(this.now / 300 + en.ref.bobPhase) * 2); break;
        case 2: Util.drawChestIcon(ctx, en.ref); break;
        case 3: this.drawEnemy(en.ref); break;
        case 4: this.drawFamiliar(en.ref); break;
        default: this.drawPlayer(); break;
      }
    }
  },

  drawFamiliar(f){
    const ctx = this.ctx;
    const bob = f.def.behavior === 'orbiter' ? 0 : Math.sin(this.now / 260 + f.index) * 2;
    ctx.save();
    ctx.fillStyle = Theme.shadow.ground;
    ctx.beginPath(); ctx.ellipse(f.x, f.y + 9, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = f.def.color;
    ctx.beginPath(); ctx.arc(f.x, f.y + bob, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = Theme.rgba(Theme.rgb.white, .35); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = Theme.ui.onIcon;
    ctx.fillText(f.def.icon, f.x, f.y + bob + 1);
    ctx.restore();
    // swarmer's mini-orbs (see familiars.js's updateSwarmerFamiliar) — live
    // entirely on the familiar instance, so they need their own draw pass
    // here rather than a separate entry in the y-sort list; they deal real
    // damage, so leaving them invisible would be a real bug, not just polish
    if (f.def.behavior === 'swarmer' && f.miniOrbs && f.miniOrbs.length) {
      for (const orb of f.miniOrbs) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, orb.life);
        ctx.fillStyle = f.def.color;
        ctx.beginPath(); ctx.arc(orb.x, orb.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = Theme.rgba(Theme.rgb.white, .5); ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      }
    }
  },

  drawPlayer(){
    const ctx = this.ctx, p = this.player;
    const flash = p.invulnTimer > 0 && Math.floor(this.now / 80) % 2 === 0;
    // a rising invulnTimer is the one render-side tell that a hit just landed
    // on the player (combat.js only raises it on a hit that actually stuck —
    // see damagePlayer's invulnBefore check)
    const inv = p.invulnTimer || 0;
    if (inv > (this._fxPlayerInvuln || 0)) {
      FX.shake(4.5, 0.22);
      FX.sparks(p.x, p.y, Theme.floatText.playerHurt, 7);
    }
    this._fxPlayerInvuln = inv;
    ctx.save();
    if (p.invincibleTimer > 0) { ctx.shadowColor = Theme.status.invincibleGlow; ctx.shadowBlur = 16; }
    Util.drawPony(ctx, p.x, p.y, 34 * (p.def.sizeMult || 1), Object.assign({}, Util.classPonyOpts(p.def), {
      // p.canFly (not def.canFly) so Borrowed Wings still visually grants
      // wings to classes that can't normally fly, same as it does in play
      hasWings: p.canFly,
      facing: p.facing, flash, moving: p.moving, now: this.now,
    }));
    ctx.restore();
    if (p.freezeTimer > 0) { // Sand Trap — same icy-ring look enemies get, see drawStatusEffects
      ctx.strokeStyle = Theme.status.freezeRing; ctx.lineWidth = Theme.status.freezeWidth;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = Theme.status.freezeFillPlayer;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    }
    if (p.charged && p.chargeTimer > 0) { // Dragon — a small building ember while the beam charges up
      const frac = Util.clamp(p.chargeTimer / p.chargeTime, 0, 1);
      const ex = p.x + p.facing.x * 20, ey = p.y + p.facing.y * 20;
      ctx.save();
      ctx.globalAlpha = 0.5 + frac * 0.5;
      ctx.shadowColor = Theme.fx.emberGlow; ctx.shadowBlur = 6 + frac * 10;
      ctx.fillStyle = Util.bodyShade(ctx, ex, ey, 4 + frac * 6, Theme.fx.ember);
      ctx.beginPath(); ctx.arc(ex, ey, 4 + frac * 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  },

  drawEnemy(e){
    const ctx = this.ctx;
    // cheap frame-diff "is this thing actually moving" check, entirely
    // self-contained here so no behavior in ai.js has to track it — feeds
    // drawBrownHumanoid's walk-cycle/wing-flap animation
    const moving = e._lastX !== undefined && (Math.abs(e.x - e._lastX) > 0.05 || Math.abs(e.y - e._lastY) > 0.05);
    e._lastX = e.x; e._lastY = e.y;
    // hitFlash goes up only when combat.js lands a hit, so its rising edge is
    // a free "something just connected here" signal
    const hit = e.hitFlash > 0;
    if (hit && !e._fxHit) FX.sparks(e.x, e.y - e.radius * 0.25, Theme.particle.hitSpark, 5);
    e._fxHit = hit;
    // lobber landing marker — a ground-target burst is only fair if the spot
    // is visible, so the ring is drawn before (under) the body and fills as
    // the fuse runs down. See ai.js's aiLobber.
    if (e.lobTimer > 0) {
      const R = (e.type && e.type.burstRadius) || 44;
      const frac = 1 - Util.clamp(e.lobTimer / (e.lobTime || 1), 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.4 * frac;
      ctx.fillStyle = Theme.shadow.outlineSoft;
      ctx.beginPath(); ctx.arc(e.lobX, e.lobY, R * frac, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = Theme.fx.fuseHot; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.lobX, e.lobY, R, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    if (e.submerged) ctx.globalAlpha = Theme.enemy.submergedAlpha;
    // this.dpr opts into the pre-baked sprite path — see Util._humanoidSprite
    Util.drawBrownHumanoid(ctx, e, hit, this.player.passives.directglass > 0, this.now, moving, this.dpr);
    if (e.shielded && !e.submerged) {
      ctx.strokeStyle = Theme.status.shieldRing; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 5, 0, Math.PI * 2); ctx.stroke();
    }
    this.drawStatusEffects(e);
    ctx.restore();
  },

  drawStatusEffects(e){
    const ctx = this.ctx;
    const ringR = e.radius + 8;
    if (e.freezeTimer > 0) {
      ctx.strokeStyle = Theme.status.freezeRing; ctx.lineWidth = Theme.status.freezeWidth;
      ctx.beginPath(); ctx.arc(e.x, e.y, ringR, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = Theme.status.freezeFill;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
    } else if (e.stunTimer > 0) {
      ctx.fillStyle = Theme.status.stun; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('☆', e.x, e.y - e.radius - 12 + Math.sin(this.now / 120) * 2);
    } else if (e.charmTimer > 0) {
      ctx.fillStyle = Theme.status.charm; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('♥', e.x, e.y - e.radius - 12 + Math.sin(this.now / 150) * 2);
    } else if (e.fearTimer > 0) {
      ctx.strokeStyle = Theme.status.fearRing; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y, ringR, 0, Math.PI * 2); ctx.stroke();
    }
    if (e.poisonTimer > 0) {
      ctx.fillStyle = Theme.status.poisonAura;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = Theme.status.poisonBlob;
      ctx.beginPath(); ctx.arc(e.x + e.radius * 0.6, e.y - e.radius * 0.9, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (e.vulnerableTimer > 0) {
      const pulse = 0.5 + Math.sin(this.now / 100) * 0.5;
      ctx.strokeStyle = Theme.status.vulnerableRing; ctx.lineWidth = 1.5 + pulse;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 4, 0, Math.PI * 2); ctx.stroke();
      const cs = 4;
      ctx.strokeStyle = Theme.status.vulnerableMark; ctx.lineWidth = 2;
      const mx = e.x, my = e.y - e.radius - 12;
      ctx.beginPath();
      ctx.moveTo(mx - cs, my - cs); ctx.lineTo(mx + cs, my + cs);
      ctx.moveTo(mx + cs, my - cs); ctx.lineTo(mx - cs, my + cs);
      ctx.stroke();
    }
  },

  drawBossHealthBar(){
    const boss = this.currentRoom.enemies.find(e => e.isBoss && !e.isDead);
    if (!boss) return;
    const ctx = this.ctx;
    const w = CAMERA_W * 0.7, x = (CAMERA_W - w) / 2, y = 10;
    ctx.fillStyle = Theme.ui.bossBarBack; ctx.fillRect(x - 2, y - 2, w + 4, 14);
    ctx.fillStyle = Theme.ui.bossBarEmpty; ctx.fillRect(x, y, w, 10);
    ctx.fillStyle = Theme.ui.bossBarFill; ctx.fillRect(x, y, w * Util.clamp(boss.hp / boss.maxHp, 0, 1), 10);
    ctx.fillStyle = Theme.ui.text; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(boss.name, CAMERA_W / 2, y + 24);
  },

  drawProjectiles(){
    const ctx = this.ctx;
    for (const pr of this.projectiles) {
      // a soft glow instead of a flat disc — cheap (one shadow property, no
      // per-frame gradient allocation) since there can be a lot of these on
      // screen at once with multishot/pierce builds
      ctx.save();
      ctx.shadowColor = pr.color; ctx.shadowBlur = pr.explosive ? Theme.projectile.glowBlurBig : Theme.projectile.glowBlur;
      ctx.fillStyle = pr.color;
      ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = Theme.projectile.glint;
      ctx.beginPath(); ctx.arc(pr.x - pr.radius * 0.3, pr.y - pr.radius * 0.3, pr.radius * 0.35, 0, Math.PI * 2); ctx.fill();
    }
  },

  drawBombsExplosions(){
    const ctx = this.ctx;
    for (const b of this.bombs) {
      const pulse = 1 + Math.sin(this.now / 100) * 0.15;
      ctx.fillStyle = Theme.shadow.groundSoft;
      ctx.beginPath(); ctx.ellipse(b.x, b.y + b.radius * 0.7, b.radius * 0.8, b.radius * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = Util.bodyShade(ctx, b.x - b.radius * 0.2, b.y - b.radius * 0.2, b.radius * pulse, Theme.fx.bombBody);
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * pulse, 0, Math.PI * 2); ctx.fill();
      const fuseCol = b.timer < 0.5 ? Theme.fx.fuseHot : Theme.fx.fuse;
      ctx.strokeStyle = fuseCol; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x + 3, b.y - 6); ctx.lineTo(b.x + 7, b.y - 12); ctx.stroke();
      ctx.save();
      ctx.shadowColor = fuseCol; ctx.shadowBlur = b.timer < 0.5 ? 8 : 4;
      ctx.fillStyle = fuseCol;
      ctx.beginPath(); ctx.arc(b.x + 7, b.y - 12, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    for (const ex of this.explosions) {
      const t = 1 - ex.life / ex.maxLife;
      const r = ex.radius * Util.clamp(t * 1.4, 0, 1);
      const alpha = ex.life / ex.maxLife;
      const grad = ctx.createRadialGradient(ex.x, ex.y, Math.max(0.1, r * 0.1), ex.x, ex.y, r);
      grad.addColorStop(0, `rgba(${Theme.fx.blastCore},${alpha * 0.9})`);
      grad.addColorStop(0.45, `rgba(${Theme.fx.blastMidR},${Theme.fx.blastMidG + Math.floor(Theme.fx.blastMidGRamp * (1 - t))},${Theme.fx.blastMidB},${alpha * 0.6})`);
      grad.addColorStop(1, Theme.fx.blastEdge);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(${Theme.fx.blastRing},${alpha * 0.5})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ex.x, ex.y, r * 0.96, 0, Math.PI * 2); ctx.stroke();
    }
  },

  // Changeling's held pool of green fire (combat.js updateGreenFireAttack).
  // Purely cosmetic and purely transient — player.fireZone is null on every
  // frame the attack button isn't held, so this draws nothing for anyone else.
  drawGreenFireZone(){
    const z = this.player && this.player.fireZone;
    if (!z) return;
    const ctx = this.ctx;
    const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    ctx.save();
    const grad = ctx.createRadialGradient(z.x, z.y, z.radius * 0.15, z.x, z.y, z.radius);
    grad.addColorStop(0, 'rgba(180,255,210,.55)');
    grad.addColorStop(0.5, 'rgba(90,224,160,.35)');
    grad.addColorStop(1, 'rgba(40,140,90,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill();
    // a few licking tongues of flame around the rim so it reads as fire and
    // not a flat decal — deterministic per-index angles, animated off the clock
    ctx.fillStyle = 'rgba(140,255,190,.5)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t * 1.2;
      const r = z.radius * (0.45 + 0.35 * Math.abs(Math.sin(t * 3 + i)));
      const fx = z.x + Math.cos(a) * r, fy = z.y + Math.sin(a) * r;
      ctx.beginPath(); ctx.arc(fx, fy, 5 + 3 * Math.abs(Math.cos(t * 4 + i)), 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(90,224,160,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  },

  drawSwingFX(){
    if (!this.swingFX) return;
    const ctx = this.ctx, fx = this.swingFX;
    const alpha = Util.clamp(fx.life / 0.14, 0, 1);
    const rad = this.player.meleeRange * 0.7;
    // a couple of fading trail arcs behind the leading edge, instead of one
    // flat stroke — reads as a quick slash instead of a static line
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(${Theme.rgb.swingTrail},${alpha * 0.35})`;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(fx.x, fx.y, rad, fx.ang - 0.7, fx.ang + 0.55); ctx.stroke();
    ctx.strokeStyle = `rgba(${Theme.rgb.white},${alpha * 0.85})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(fx.x, fx.y, rad, fx.ang - 0.7, fx.ang + 0.7); ctx.stroke();
    ctx.lineCap = 'butt';
  },

  // shared by Pony Bot's laser and Dragon's fire breath — fx.color (an
  // "r,g,b" string) and fx.width let a caller reskin the beam; both default
  // to the original cyan laser look when omitted
  drawLaserFX(){
    if (!this.laserFX) return;
    const ctx = this.ctx, fx = this.laserFX;
    const alpha = Util.clamp(fx.life / (fx.maxLife || 0.12), 0, 1);
    const rgb = fx.color || Theme.rgb.laser;
    ctx.save();
    ctx.strokeStyle = `rgba(${rgb},${alpha * 0.9})`;
    ctx.lineWidth = fx.width || 5;
    ctx.shadowColor = `rgba(${rgb},.8)`; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(fx.x1, fx.y1); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
    ctx.strokeStyle = `rgba(${Theme.rgb.white},${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(fx.x1, fx.y1); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
    ctx.restore();
  },

  drawFloatTexts(){
    const ctx = this.ctx;
    for (const f of this.floatTexts) {
      const alpha = Util.clamp(f.life / f.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = f.color; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  },

});

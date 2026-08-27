'use strict';
// core/utils-1.js — split from utils.js: pit bit constants + Util (part 1/2).
'use strict';
/* ============================================================
   utils.js — math helpers, rng, and small canvas drawing utils
   ============================================================ */

/* Pit connectivity bits — set on each pit Obstacle as `_pitMask` once its
   room finishes populating (see room.js computePitMasks) and read by
   Util.drawObstacle to skip the rim on edges shared with another pit, so
   adjacent pits read as one continuous void. Declared here because both
   index.html and room-editor.html load utils.js before room.js. */
const PIT_N = 1, PIT_E = 2, PIT_S = 4, PIT_W = 8;

const Util = {
  rand(min, max){ return Math.random() * (max - min) + min; },
  randi(min, max){ return Math.floor(Util.rand(min, max + 1)); },
  choice(arr){ return arr[Math.floor(Math.random() * arr.length)]; },
  chance(p){ return Math.random() < p; },
  clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); },
  lerp(a, b, t){ return a + (b - a) * t; },
  // Engine expansion pass — easing curves for anything that wants a
  // non-linear lerp (UI transitions, future FX) without hand-writing the
  // curve inline every time. `t` is 0..1 in, 0..1 out for all three.
  easeOutCubic(t){ const p = 1 - Util.clamp(t, 0, 1); return 1 - p * p * p; },
  easeInOutQuad(t){ t = Util.clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  easeOutElastic(t){
    t = Util.clamp(t, 0, 1);
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  // Signed-number formatting — several call sites across achievements/
  // skilltree.js hand-roll `(v >= 0 ? '+' : '') + v` inline; these two give
  // future code a one-call version rather than re-deriving the sign logic
  // (existing call sites are left as-is, not refactored, to avoid touching
  // already-verified display code).
  formatSigned(n, decimals = 0){
    const r = Number(n.toFixed(decimals));
    return (r >= 0 ? '+' : '') + r;
  },
  formatSignedPercent(frac, decimals = 1){
    return Util.formatSigned(frac * 100, decimals) + '%';
  },
  dist(ax, ay, bx, by){ return Math.hypot(ax - bx, ay - by); },
  dist2(ax, ay, bx, by){ const dx = ax-bx, dy = ay-by; return dx*dx+dy*dy; },
  angleTo(ax, ay, bx, by){ return Math.atan2(by - ay, bx - ax); },

  // thousands-separated number for HUD/stat readouts once numbers get big
  // (coin totals, lifetime stats) — e.g. formatNum(12345) -> "12,345"
  formatNum(n){ return Math.round(n).toLocaleString('en-US'); },

  // m:ss (or h:mm:ss past an hour) — used for run/lifetime playtime displays
  formatDuration(seconds){
    seconds = Math.max(0, Math.floor(seconds));
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  },

  // weighted pick: items = [{w:number, ...}]
  weighted(items){
    let total = 0;
    for (const it of items) total += it.w;
    let r = Math.random() * total;
    for (const it of items) {
      if (r < it.w) return it;
      r -= it.w;
    }
    return items[items.length - 1];
  },

  shuffle(arr){
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  circleIntersect(ax, ay, ar, bx, by, br){
    return Util.dist2(ax, ay, bx, by) <= (ar + br) * (ar + br);
  },

  // draws a heart shape at (x,y) top-left, size = width/height box.
  // fillFrac 0..1 partial horizontal fill (used for half hearts), color = fill color
  drawHeart(ctx, x, y, size, fillFrac, fillColor, outlineColor){
    ctx.save();
    ctx.translate(x, y);
    const s = size / 16; // path authored on a 16x16 grid
    ctx.scale(s, s);

    const path = new Path2D(
      'M8 14 C8 14 1 9.6 1 5.2 C1 2.4 3 0.8 5.2 0.8 C6.8 0.8 7.6 1.6 8 2.4 ' +
      'C8.4 1.6 9.2 0.8 10.8 0.8 C13 0.8 15 2.4 15 5.2 C15 9.6 8 14 8 14 Z'
    );

    ctx.lineWidth = 1.1;
    ctx.strokeStyle = outlineColor || Theme.ui.onIcon;
    ctx.fillStyle = Theme.shadow.outline;
    ctx.fill(path);
    ctx.stroke(path);

    if (fillFrac > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 16 * Util.clamp(fillFrac, 0, 1), 16);
      ctx.clip();
      ctx.fillStyle = fillColor;
      ctx.fill(path);
      // Phase 12 visual pass — a small glossy highlight in the upper-left
      // lobe, same idea as the sheen every other filled shape in this game
      // gets (projectile glint, coin glint, boss bar). Low, fixed opacity
      // white so it reads as a highlight on ANY fillColor this function is
      // ever called with (10+ call sites — pickup icons, HUD hearts, chest
      // rewards, machine signage) rather than needing per-caller tuning.
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.ellipse(4.4, 4.2, 1.5, 0.9, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },

  drawRoundedRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  key(x, y){ return x + ',' + y; },

  // lighten (pct > 0) or darken (pct < 0) a '#rrggbb' color by pct (0..1).
  // Used everywhere below to turn a flat def.color into cheap gradient
  // shading without needing a second "light"/"dark" color authored per
  // thing — one real color in data.js, shaded on the fly at draw time.
  //
  // MEMOIZED. This runs several times per drawn body and once or twice per
  // *tile* during a tile-layer bake, and every call used to cost a parseInt
  // plus a fresh template string. Keys are exact (no quantization), so the
  // returned string is byte-identical to what the uncached version produced.
  // The working set is tiny in practice — a stage palette plus the colors of
  // whatever's in the room — so the cap below is really just a leak guard
  // against the tile bake's continuous per-tile shade variance.
  _shadeCache: new Map(),
  shadeColor(hex, pct){
    const key = hex + '|' + pct;
    const hit = Util._shadeCache.get(key);
    if (hit !== undefined) return hit;
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
    if (pct >= 0) { r += (255 - r) * pct; g += (255 - g) * pct; b += (255 - b) * pct; }
    else { r *= (1 + pct); g *= (1 + pct); b *= (1 + pct); }
    const out = `rgb(${Util.clamp(Math.round(r), 0, 255)},${Util.clamp(Math.round(g), 0, 255)},${Util.clamp(Math.round(b), 0, 255)})`;
    if (Util._shadeCache.size > 4096) Util._shadeCache.clear();
    Util._shadeCache.set(key, out);
    return out;
  },

  // a small top-lit radial gradient centered on (cx,cy) — the one shading
  // trick reused by every body/rock/coin/chest fill below so flat vector
  // shapes read as gently rounded instead of paper-flat. Cheap enough to
  // build fresh per draw call at this game's on-screen entity counts (a
  // handful of enemies/pickups per room) — the actual per-frame cost this
  // file guards against (see the header comment) is per-*tile* work, which
  // still only happens once per room via the cached tile canvas.
  bodyShade(ctx, cx, cy, r, color){
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, Math.max(0.1, r * 0.1), cx, cy, r * 1.15);
    g.addColorStop(0, Util.shadeColor(color, 0.4));
    g.addColorStop(0.6, color);
    g.addColorStop(1, Util.shadeColor(color, -0.3));
    return g;
  },

  // Cached companion to bodyShade, for the callers that draw in a *translated*
  // local space (drawPony, drawItemIcon, render.js's shop slots) where cx/cy
  // are small constants relative to the thing being drawn rather than live
  // world coordinates.
  //
  // A CanvasGradient's coordinates are resolved in the user space in effect
  // when it is *painted*, not when it is created — which is exactly why
  // `Util.bodyShade(ctx, 0, 0, ...)` under a ctx.translate() already worked.
  // That's what makes caching possible at all: a gradient authored around a
  // fixed local offset lands wherever the caller happens to be translated to,
  // so the same object can be reused every frame instead of a fresh gradient
  // (plus three color-string parses) being built per body, per fill.
  //
  // Keyed per-context (a WeakMap) so the tile-bake canvas, the minimap, the
  // class-select previews and the room editor never share gradient objects
  // across contexts. Keys are exact; the working set is bounded because both
  // cx/cy and r are derived from a fixed sprite size, not from world position.
  _bodyGradCache: new WeakMap(),
  bodyShadeLocal(ctx, cx, cy, r, color){
    let m = Util._bodyGradCache.get(ctx);
    if (!m) { m = new Map(); Util._bodyGradCache.set(ctx, m); }
    const key = color + '|' + cx + '|' + cy + '|' + r;
    let g = m.get(key);
    if (g === undefined) {
      if (m.size > 512) m.clear();
      g = Util.bodyShade(ctx, cx, cy, r, color);
      m.set(key, g);
    }
    return g;
  },

  // item quality (1-4, see data.js) -> a quick-glance rarity tell wherever
  // ITEMS show up in the world (pedestals, shop slots, minimap loot icons).
  // Quality 1 (the common case) gets nothing so the glow stays meaningful.
  qualityGlow(q){
    if (q >= 4) return Theme.quality.q4;
    if (q === 3) return Theme.quality.q3;
    if (q === 2) return Theme.quality.q2;
    return null;
  },

  // maps a CLASSES def to drawPony()'s accessory opts — one place for this
  // so render.js's live player and ui.js's class-select preview never draw
  // a mismatched pony (a bug this fixed: every ranged class used to render
  // a unicorn horn just because attackType==='ranged', including the sea
  // pony, pony bot, kirin and griffin).
  classPonyOpts(def){
    const id = def.id;
    return {
      bodyColor: def.color, maneColor: def.mane,
      hasWings: !!def.canFly,
      // alicorn/changeling are the only classes that carry a horn AND wings
      // (hasWings follows canFly, which both have) — that pairing is their
      // whole silhouette, so no new drawPony trait was needed for either
      hasHorn: id === 'unicorn' || id === 'dnbpony' || id === 'alicorn' || id === 'changeling' || id === 'crystalpony',
      hasStripes: !!def.stripes,
      hasFangs: id === 'batpony' || id === 'changeling',
      hasBeak: id === 'griffin' || id === 'hypogriff',
      // the Diamond Dog is the only talon-bearer without a beak or wings —
      // reads as digging claws rather than a raptor's foot
      hasTalons: id === 'griffin' || id === 'diamonddog',
      hasFinTail: id === 'seapony' || id === 'kelpie',
      isRobot: id === 'ponybot',
      // the jagged mane doubles as DNB Pony's neon "waveform" crest — same
      // spiked shape, drawn in whatever def.mane is, so it reads as sound
      // rather than fire without needing its own drawPony branch
      flameMane: id === 'kirin' || id === 'dnbpony',
      // gargoyle reuses the scales flag for its rough stone hide — no new
      // drawPony trait needed, same reuse-only rule as every class above
      hasScales: id === 'kirin' || id === 'dragon' || id === 'kelpie' || id === 'changeling' || id === 'gargoyle',
      // windigo = spirit; crystal pony = light passing through faceted gem —
      // same translucency, read differently by the body colour it's drawn in
      ghostly: id === 'windigo' || id === 'crystalpony',
      // NOTE: the Mule deliberately takes no accessory flags at all — its
      // silhouette is its size (def.sizeMult 1.18, applied by render.js and
      // ui.js), which is what separates it from the Earth Pony on screen.
    };
  },

  /* --------------------------------------------------------------
     Shared world-icon drawers — pure (ctx, ...) functions so both
     render.js (the live game) and roomEditor.js (the room-creation
     tool) draw enemies/pickups/items/obstacles identically. This is
     what lets the editor preview exactly what a spawner will look
     like in-game instead of a generic placeholder glyph.
     -------------------------------------------------------------- */

  // Radial "depth" gradient for one pit tile. Pits never move, so the
  // gradient is built once and cached on the obstacle — the per-frame cost
  // stays a plain fillRect. Re-built if drawn onto a different canvas.
  pitGrad(ctx, ob){
    if (ob._pitGrad && ob._pitGradCtx === ctx) return ob._pitGrad;
    const g = ctx.createRadialGradient(ob.x, ob.y, 1, ob.x, ob.y, TILE * 0.8);
    g.addColorStop(0, Theme.world.pitFill);
    g.addColorStop(1, Util.shadeColor(Theme.world.pitFill, 0.16));
    ob._pitGrad = g; ob._pitGradCtx = ctx;
    return g;
  },

  // rock/hardrock/pit/tallrock/tallhardrock use this fixed radius; only
  // pits (a full floor tile) are sized differently — see entities.js's
  // Obstacle constructor, which uses the same rule.
  obstacleRadius(kind){ return kind === 'pit' ? TILE / 2 : 14; },

  drawObstacle(ctx, ob, now){
    const flash = ob.hitFlash > 0;
    const HIT = Theme.obstacle.flash, HIT_SOFT = Theme.obstacle.flashSoft;
    if (ob.kind === 'pit') {
      const x0 = ob.x - TILE / 2, y0 = ob.y - TILE / 2;
      const m = ob._pitMask;
      if (typeof m !== 'number') {
        // no room context — the room editor's synthetic preview obstacle has
        // no tx/ty and never went through room.js's mask pass. Original flat
        // single-square look, unchanged.
        ctx.fillStyle = Theme.world.pitFill;
        ctx.fillRect(x0, y0, TILE, TILE);
        ctx.strokeStyle = Theme.world.pitEdge; ctx.lineWidth = 1;
        ctx.strokeRect(x0 + 0.5, y0 + 0.5, TILE - 1, TILE - 1);
      } else {
        // connected pits: the fill darkens toward the middle so the tile
        // reads as a shaft with depth, the far (north) wall of that shaft is
        // drawn as a lighter lip, and rims are stroked ONLY on edges that
        // face something other than another pit — so a cluster reads as one
        // continuous void instead of a grid of outlined squares.
        ctx.fillStyle = Util.pitGrad(ctx, ob);
        ctx.fillRect(x0, y0, TILE, TILE);
        if (!(m & PIT_N)) {
          ctx.fillStyle = Util.shadeColor(Theme.world.pitEdge, -0.4);
          ctx.fillRect(x0, y0, TILE, 5);
        }
        ctx.strokeStyle = Theme.world.pitEdge; ctx.lineWidth = 1;
        ctx.beginPath();
        if (!(m & PIT_N)) { ctx.moveTo(x0, y0 + 0.5); ctx.lineTo(x0 + TILE, y0 + 0.5); }
        if (!(m & PIT_E)) { ctx.moveTo(x0 + TILE - 0.5, y0); ctx.lineTo(x0 + TILE - 0.5, y0 + TILE); }
        if (!(m & PIT_S)) { ctx.moveTo(x0, y0 + TILE - 0.5); ctx.lineTo(x0 + TILE, y0 + TILE - 0.5); }
        if (!(m & PIT_W)) { ctx.moveTo(x0 + 0.5, y0); ctx.lineTo(x0 + 0.5, y0 + TILE); }
        ctx.stroke();
      }
    } else if (ob.kind === 'cactus') {
      ctx.fillStyle = Theme.shadow.ground;
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y + 9, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? HIT : Util.bodyShade(ctx, ob.x, ob.y, 10, ob.def.color);
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y, 7, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ob.x - 9, ob.y + 2, 4, 8, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ob.x + 9, ob.y + 2, 4, 8, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = flash ? HIT : ob.def.dark; ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(ob.x + i * 4, ob.y - 10); ctx.lineTo(ob.x + i * 4, ob.y - 6); ctx.stroke(); }
    // all seven flames share one shape and read purely off def.color/def.dark;
    // blue/purple/white/black have no maxHp, so `frac` below just pins to 1
    // for them (Phase 15 added green/white/black onto the original four)
    } else if (ob.kind === 'yellowfire' || ob.kind === 'redfire' || ob.kind === 'bluefire' || ob.kind === 'purplefire'
        || ob.kind === 'greenfire' || ob.kind === 'whitefire' || ob.kind === 'blackfire') {
      const frac = ob.def.maxHp ? Util.clamp(ob.hp / ob.def.maxHp, 0.25, 1) : 1;
      const flick = Math.sin((now || 0) / 70 + ob.x) * 3;
      ctx.fillStyle = Theme.shadow.groundSoft;
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y + 9, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.55 + frac * 0.45;
      ctx.fillStyle = flash ? HIT : ob.def.dark;
      // soft ambient glow around the flame — scales down with remaining HP
      // so a nearly-spent fire visibly dims, not just shrinks its flicker
      if (!flash) { ctx.shadowColor = ob.def.color; ctx.shadowBlur = 7 * frac; }
      ctx.beginPath();
      ctx.moveTo(ob.x, ob.y + 10);
      ctx.quadraticCurveTo(ob.x - 10, ob.y - 2, ob.x - 3, ob.y - 16 - flick * frac);
      ctx.quadraticCurveTo(ob.x, ob.y - 8, ob.x + 3, ob.y - 16 - flick * frac);
      ctx.quadraticCurveTo(ob.x + 10, ob.y - 2, ob.x, ob.y + 10);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = flash ? HIT : ob.def.color;
      ctx.beginPath();
      ctx.moveTo(ob.x, ob.y + 8);
      ctx.quadraticCurveTo(ob.x - 6, ob.y - 2, ob.x - 2, ob.y - 12 - flick * frac * 0.6);
      ctx.quadraticCurveTo(ob.x, ob.y - 6, ob.x + 2, ob.y - 12 - flick * frac * 0.6);
      ctx.quadraticCurveTo(ob.x + 6, ob.y - 2, ob.x, ob.y + 8);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (ob.kind === 'spike' || ob.kind === 'spiketrap' || ob.kind === 'spikedrock' || ob.kind === 'movingspike') {
      // an 8-point jagged star, not a circle with nubs — reads as an actual
      // spike ball/trap at a glance instead of a colored disc
      ctx.fillStyle = Theme.shadow.groundSoft;
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y + 8, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? HIT : ob.def.dark;
      ctx.beginPath(); ctx.arc(ob.x, ob.y, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? HIT_SOFT : ob.def.color;
      const points = 8, outerR = 13, innerR = 4.5;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const ang = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const px = ob.x + Math.cos(ang) * r, py = ob.y + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = flash ? Theme.shadow.outlineHard : ob.def.dark;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (ob.kind.indexOf('turret') === 0) {
      ctx.fillStyle = Theme.shadow.groundSoft;
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y + 9, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? HIT : ob.def.dark;
      ctx.beginPath(); ctx.arc(ob.x, ob.y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? HIT_SOFT : Util.bodyShade(ctx, ob.x, ob.y, 9, ob.def.color);
      ctx.beginPath(); ctx.arc(ob.x, ob.y, 9, 0, Math.PI * 2); ctx.fill();
      // barrels — one per firing direction, so N/E/S/W read as pointing the
      // way they shoot and +/x read as their namesake pattern
      ctx.strokeStyle = ob.def.boltColor || Theme.projectile.turretBolt;
      ctx.lineWidth = 3;
      for (const ang of (ob.def.angles || [])) {
        ctx.beginPath();
        ctx.moveTo(ob.x + Math.cos(ang) * 6, ob.y + Math.sin(ang) * 6);
        ctx.lineTo(ob.x + Math.cos(ang) * 16, ob.y + Math.sin(ang) * 16);
        ctx.stroke();
      }
      if (ob.def.targeting) {
        ctx.fillStyle = ob.def.boltColor || Theme.projectile.turretEye;
        ctx.beginPath(); ctx.arc(ob.x, ob.y, 3.5, 0, Math.PI * 2); ctx.fill();
      }
    } else if (ob.kind === 'thornbush') {
      // a squat spiny bush — like cactus's silhouette but rounder and lower,
      // with a ring of thorn spikes instead of cactus's straight ribs
      ctx.fillStyle = Theme.shadow.ground;
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y + 9, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? HIT : Util.bodyShade(ctx, ob.x, ob.y, 11, ob.def.color);
      ctx.beginPath(); ctx.arc(ob.x, ob.y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = flash ? HIT : ob.def.dark; ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const ix = ob.x + Math.cos(ang) * 8, iy = ob.y + Math.sin(ang) * 8;
        const ox = ob.x + Math.cos(ang) * 13, oy = ob.y + Math.sin(ang) * 13;
        ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ox, oy); ctx.stroke();
      }
    } else if (ob.kind === 'luckcrystal') {
      // a faceted crystal cluster — three overlapping diamonds, brighter at
      // the tips, reading as a gem formation rather than a plain rock
      ctx.fillStyle = Theme.shadow.groundSoft;
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y + 9, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      const facets = [{ dx:0, dy:-2, s:1 }, { dx:-6, dy:3, s:0.7 }, { dx:6, dy:3, s:0.75 }];
      // Phase 12 visual pass (canvas batch) — a soft ambient glow behind the
      // whole cluster, same "this is special" tell every gem/star pickup
      // in the game gets (drawStarIcon, quality glow rings) that this one
      // was missing despite being a literal crystal.
      if (!flash) { ctx.save(); ctx.shadowColor = ob.def.color; ctx.shadowBlur = 8; }
      for (const f of facets) {
        const fx = ob.x + f.dx, fy = ob.y + f.dy, r = 11 * f.s;
        ctx.fillStyle = flash ? HIT : ob.def.dark;
        ctx.beginPath();
        ctx.moveTo(fx, fy - r); ctx.lineTo(fx + r * 0.6, fy); ctx.lineTo(fx, fy + r); ctx.lineTo(fx - r * 0.6, fy);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = flash ? HIT_SOFT : ob.def.color;
        ctx.beginPath();
        ctx.moveTo(fx, fy - r * 0.7); ctx.lineTo(fx + r * 0.4, fy); ctx.lineTo(fx, fy + r * 0.5); ctx.lineTo(fx - r * 0.4, fy);
        ctx.closePath(); ctx.fill();
        // a tiny bright glint at each facet's tip, echoing the coin/key
        // metal-glint convention used everywhere else in this file
        if (!flash) {
          ctx.fillStyle = Theme.shadow.glint;
          ctx.beginPath(); ctx.arc(fx, fy - r * 0.55, 1, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (!flash) ctx.restore();
    } else if (ob.kind === 'mud') {
      // a radial gradient (darker toward the middle) instead of a flat
      // fill — reads as a puddle with actual depth rather than a color chip
      if (!flash) {
        const g = ctx.createRadialGradient(ob.x, ob.y, 1, ob.x, ob.y, 14);
        g.addColorStop(0, Util.shadeColor(ob.def.color, -0.15));
        g.addColorStop(1, Util.shadeColor(ob.def.color, 0.1));
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = HIT;
      }
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? HIT_SOFT : ob.def.dark;
      ctx.beginPath(); ctx.ellipse(ob.x - 4, ob.y - 2, 3, 2, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ob.x + 5, ob.y + 2, 4, 2.5, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y + 4, 2.5, 1.5, 0.2, 0, Math.PI * 2); ctx.fill();
      // a small sky-reflection glint — a puddle catches light, a flat brown
      // ellipse doesn't
      if (!flash) {
        ctx.fillStyle = 'rgba(255,255,255,.18)';
        ctx.beginPath(); ctx.ellipse(ob.x - 6, ob.y - 5, 3, 1.2, -0.4, 0, Math.PI * 2); ctx.fill();
      }
    } else if (ob.kind === 'sandtrap') {
      ctx.fillStyle = flash ? HIT : ob.def.color;
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = flash ? HIT : ob.def.dark; ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.ellipse(ob.x, ob.y + i * 3, 10 - Math.abs(i) * 2, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (ob.kind === 'bombbarrel' || ob.kind === 'pushablebombbarrel') {
      ctx.fillStyle = Theme.shadow.groundSoft;
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y + 10, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? HIT : ob.def.dark;
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y, 11, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? HIT_SOFT : Util.bodyShade(ctx, ob.x, ob.y, 11, ob.def.color);
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y, 9.5, 11.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = flash ? Theme.shadow.outlineHard : ob.def.dark; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y - 5, 9, 2.4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y + 5, 9, 2.4, 0, 0, Math.PI * 2); ctx.stroke();
      // fuse
      ctx.strokeStyle = Theme.fx.fuseCord; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ob.x, ob.y - 12); ctx.quadraticCurveTo(ob.x + 4, ob.y - 17, ob.x + 1, ob.y - 20); ctx.stroke();
      ctx.fillStyle = flash ? HIT : Theme.fx.fuseSpark;
      ctx.beginPath(); ctx.arc(ob.x + 1, ob.y - 20, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (ob.def && ob.def.current) {
      // Currents — a walkable tinted tile with 3 chevrons streaming in the
      // push direction, animated via `now` so they visibly flow instead of
      // just sitting there as a static arrow (see combat.js's updatePlayer
      // for the actual push, data.js's OBSTACLES for pushX/pushY).
      const ang = Math.atan2(ob.def.pushY, ob.def.pushX);
      ctx.save();
      ctx.fillStyle = ob.def.color; ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.ellipse(ob.x, ob.y, 15, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.translate(ob.x, ob.y); ctx.rotate(ang);
      const scroll = ((now || 0) / 260) % 12;
      ctx.strokeStyle = flash ? HIT : ob.def.dark;
      ctx.lineWidth = 2.5;
      for (let i = -1; i <= 1; i++) {
        const cx = -12 + ((i * 12 + scroll) % 24 + 24) % 24 - 12;
        ctx.beginPath();
        ctx.moveTo(cx - 4, -6); ctx.lineTo(cx + 4, 0); ctx.lineTo(cx - 4, 6);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // rock / hardrock / tallrock / tallhardrock
      const tall = ob.tall;
      const cy = ob.y - (tall ? 6 : 0);
      ctx.fillStyle = ob.def.dark;
      ctx.beginPath(); ctx.arc(ob.x, ob.y + 3, ob.radius * 0.9, 0, Math.PI * 2); ctx.fill();
      if (tall) { ctx.beginPath(); ctx.ellipse(ob.x, ob.y - 6, ob.radius * 0.85, ob.radius * 1.05, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = flash ? HIT : Util.bodyShade(ctx, ob.x, cy, ob.radius, ob.def.color);
      ctx.beginPath(); ctx.arc(ob.x, cy, ob.radius, 0, Math.PI * 2); ctx.fill();
      if (ob.kind === 'hardrock' || ob.kind === 'tallhardrock') { ctx.strokeStyle = Theme.obstacle.hardOutline; ctx.lineWidth = 2; ctx.stroke(); }
      // top-lit rim facet — previously tall-rock-only; every rock kind is by
      // far the most common obstacle in the game, so giving short rocks the
      // same sunlit-edge cue adds a cheap but constant depth read. Skipped
      // during hit-flash so the flash reads as a clean flat silhouette.
      if (!flash) {
        ctx.strokeStyle = Theme.shadow.rim; ctx.lineWidth = tall ? 2 : 1.4;
        ctx.beginPath(); ctx.arc(ob.x, cy, ob.radius * (tall ? 0.6 : 0.72), Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
      }
    }
  },

  drawKeyIcon(ctx, x, y, color){
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x - 4, y, 4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y);
    ctx.moveTo(x + 5, y); ctx.lineTo(x + 5, y + 4);
    ctx.moveTo(x + 8, y); ctx.lineTo(x + 8, y + 4);
    ctx.stroke();
    // Phase 12 visual pass (canvas batch) — a small bright glint on the
    // bow, same "reads as polished metal" tell every other metal pickup
    // (coins, goldkey/goldbomb glow) already gets.
    ctx.fillStyle = Theme.shadow.glint;
    ctx.beginPath(); ctx.arc(x - 5.5, y - 1.5, 1.1, 0, Math.PI * 2); ctx.fill();
  },

  drawBombIcon(ctx, x, y, bodyColor, fuseColor){
    // was a flat fillStyle — every other bomb-shaped body in this game
    // (world bombs, bomb barrels) already uses the lit-sphere gradient.
    ctx.fillStyle = Util.bodyShade(ctx, x, y + 2, 8, bodyColor);
    ctx.beginPath(); ctx.arc(x, y + 2, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = fuseColor; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 3, y - 6); ctx.lineTo(x + 7, y - 11); ctx.stroke();
  },

  // Phase 16 — bodyColor/seamColor are optional (default the plain tan
  // Sack), so the Trash Bag pickup (data/collectibles.js's 'trashbag')
  // can reuse this exact shape/gradient/seam-stroke treatment tinted green
  // (Theme.icon.trashBag/trashBagSeam) instead of needing its own draw
  // function — same silhouette, different material, like a lot of this
  // game's recolored fixtures already do.
  drawSackIcon(ctx, x, y, bodyColor, seamColor){
    // was a flat fillStyle — same lit-sphere gradient treatment as every
    // other round pickup body in this game.
    ctx.fillStyle = Util.bodyShade(ctx, x, y, 10, bodyColor || Theme.icon.sack);
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 2);
    ctx.quadraticCurveTo(x - 10, y + 10, x, y + 11);
    ctx.quadraticCurveTo(x + 10, y + 10, x + 8, y - 2);
    ctx.quadraticCurveTo(x + 6, y - 8, x, y - 8);
    ctx.quadraticCurveTo(x - 6, y - 8, x - 8, y - 2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = seamColor || Theme.icon.sackSeam; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = Theme.icon.sackTie; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 5, y - 8); ctx.lineTo(x + 5, y - 8); ctx.stroke();
  },

  drawBatteryIcon(ctx, x, y, frac){
    const w = 12, h = 18 * frac;
    ctx.fillStyle = Theme.icon.batteryShell;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    // a small glow behind the charge cell — reads as "powered" rather than
    // a flat teal rectangle, echoing the goldGlow treatment gold pickups get
    ctx.save();
    ctx.shadowColor = Theme.icon.batteryCharge; ctx.shadowBlur = 4;
    ctx.fillStyle = Theme.icon.batteryCharge;
    ctx.fillRect(x - w / 2 + 2, y - h / 2 + 2, w - 4, Math.max(0, h - 4));
    ctx.restore();
    ctx.fillStyle = Theme.icon.batteryShell;
    ctx.fillRect(x - 3, y - h / 2 - 4, 6, 4);
  },

  drawPillIcon(ctx, x, y, color){
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = Theme.icon.pillHalf; ctx.fillRect(x - 9, y - 9, 9, 18);
    ctx.fillStyle = color; ctx.fillRect(x, y - 9, 9, 18);
    // a small capsule-sheen streak across both halves — a plain flat split
    // reads as two paint chips; the highlight sells it as a glossy capsule
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.beginPath(); ctx.ellipse(x - 3, y - 4, 4, 1.6, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = Theme.shadow.outline; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke();
  },

  // a plain 5-point star, filled with the given color and given a small
  // glow so it reads as a "special" pickup distinct from a plain pill
  drawStarIcon(ctx, x, y, color){
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 6;
    ctx.fillStyle = Util.bodyShade(ctx, x, y, 10, color);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 === 0 ? 10 : 4.2;
      const px = x + Math.cos(ang) * r, py = y + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = Theme.shadow.outline; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  },

  // p = {kind, coin?, pillColor?, starId?} — see entities.js's Pickup. bob is an
  // optional vertical offset in px (the live game animates it; a static
  // preview just passes 0/omits it).
  drawPickupIcon(ctx, p, bob){
    const x = p.x !== undefined ? p.x : 0, y = (p.y !== undefined ? p.y : 0) + (bob || 0);
    switch (p.kind) {
      case 'coin':
        ctx.fillStyle = Util.bodyShade(ctx, x, y, p.coin.radius, p.coin.color);
        ctx.beginPath(); ctx.arc(x, y, p.coin.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = Theme.shadow.groundHard; ctx.stroke();
        // a tiny bright glint so it still reads as shiny metal at this size
        ctx.fillStyle = Theme.shadow.glint;
        ctx.beginPath(); ctx.arc(x - p.coin.radius * 0.32, y - p.coin.radius * 0.32, p.coin.radius * 0.22, 0, Math.PI * 2); ctx.fill();
        break;
      case 'key': Util.drawKeyIcon(ctx, x, y, Theme.icon.key); break;
      case 'doublekey':
        Util.drawKeyIcon(ctx, x - 3, y - 2, Theme.icon.key);
        Util.drawKeyIcon(ctx, x + 3, y + 2, Theme.icon.key);
        break;
      case 'goldkey':
        ctx.save(); ctx.shadowColor = Theme.icon.keyGold; ctx.shadowBlur = Theme.icon.goldGlowBlur;
        Util.drawKeyIcon(ctx, x, y, Theme.icon.keyGold);
        ctx.restore();
        break;
      case 'bomb': Util.drawBombIcon(ctx, x, y, Theme.icon.bombBody, Theme.icon.bombFuse); break;
      case 'doublebomb':
        Util.drawBombIcon(ctx, x - 5, y + 2, Theme.icon.bombBody, Theme.icon.bombFuse);
        Util.drawBombIcon(ctx, x + 5, y - 2, Theme.icon.bombBody, Theme.icon.bombFuse);
        break;
      case 'goldbomb':
        ctx.save(); ctx.shadowColor = Theme.icon.keyGold; ctx.shadowBlur = Theme.icon.goldGlowBlur;
        Util.drawBombIcon(ctx, x, y, Theme.icon.bombBodyGold, Theme.icon.bombFuseGold);
        ctx.restore();
        break;
      case 'heartRed': Util.drawHeart(ctx, x - 9, y - 9, 18, 1, Theme.icon.heartRed, Theme.icon.heartRedLine); break;
      case 'heartBlue': Util.drawHeart(ctx, x - 9, y - 9, 18, 1, Theme.icon.heartBlue, Theme.icon.heartBlueLine); break;
      case 'halfheartRed': Util.drawHeart(ctx, x - 9, y - 9, 18, 0.5, Theme.icon.heartRed, Theme.icon.heartRedLine); break;
      case 'halfheartBlue': Util.drawHeart(ctx, x - 9, y - 9, 18, 0.5, Theme.icon.heartBlue, Theme.icon.heartBlueLine); break;
      case 'doubleheart': // same offset pair the double key/bomb icons use
        Util.drawHeart(ctx, x - 12, y - 7, 18, 1, Theme.icon.heartRed, Theme.icon.heartRedLine);
        Util.drawHeart(ctx, x - 6, y - 11, 18, 1, Theme.icon.heartRed, Theme.icon.heartRedLine);
        break;
      case 'heartContainer': Util.drawHeart(ctx, x - 11, y - 11, 22, 1, Theme.icon.heartContainer, Theme.icon.heartRedLine); break;
      // pale/white heart — matches the pale HUD pip it grants (ui.js)
      case 'eternalheart': Util.drawHeart(ctx, x - 9, y - 9, 18, 1, Theme.icon.pillHalf, Theme.icon.heartRedLine); break;
      case 'sack': Util.drawSackIcon(ctx, x, y); break;
      case 'trashbag': Util.drawSackIcon(ctx, x, y, Theme.icon.trashBag, Theme.icon.trashBagSeam); break;
      case 'battery': Util.drawBatteryIcon(ctx, x, y, 1); break;
      case 'minibattery': Util.drawBatteryIcon(ctx, x, y, 0.7); break;
      case 'pill': Util.drawPillIcon(ctx, x, y, PILL_COLORS_BY_ID[p.pillColor].color); break;
      case 'star': Util.drawStarIcon(ctx, x, y, STAR_TYPES[p.starId].color); break;
    }
  },

  // c = {x, y, opened, def:{color, dark, lidColor, requires}} — see entities.js's Chest.
  drawChestIcon(ctx, c){
    const def = c.def;
    const baseColor = c.opened ? def.dark : def.color;
    const grad = ctx.createLinearGradient(c.x, c.y - 9, c.x, c.y + 9);
    grad.addColorStop(0, Util.shadeColor(baseColor, 0.3));
    grad.addColorStop(1, Util.shadeColor(baseColor, -0.2));
    ctx.fillStyle = grad;
    ctx.fillRect(c.x - 13, c.y - 9, 26, 18);
    ctx.fillStyle = def.lidColor;
    ctx.fillRect(c.x - 13, c.y - 9, 26, 5);
    if (!c.opened) {
      // a thin bright seam under the lid — a quick metallic/wood-sheen tell
      ctx.strokeStyle = Theme.shadow.sheen; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c.x - 12, c.y - 3.5); ctx.lineTo(c.x + 12, c.y - 3.5); ctx.stroke();
    }
    if (c.opened) return;
    ctx.strokeStyle = Theme.shadow.outline; ctx.lineWidth = 1;
    ctx.strokeRect(c.x - 13 + 0.5, c.y - 9 + 0.5, 25, 17);
    if (def.requires === 'bomb') {
      ctx.fillStyle = Theme.chest.lockBomb;
      ctx.beginPath(); ctx.arc(c.x, c.y + 2, 3.5, 0, Math.PI * 2); ctx.fill();
      // a small keyhole notch — a plain filled disc reads as a rivet, not a lock
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.beginPath(); ctx.arc(c.x, c.y + 1.2, 1, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(c.x - 0.6, c.y + 1.5, 1.2, 2);
    } else if (def.requires === 'key') {
      ctx.fillStyle = Theme.chest.lockKey;
      ctx.beginPath(); ctx.arc(c.x, c.y + 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.beginPath(); ctx.arc(c.x, c.y + 1.2, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(c.x - 0.5, c.y + 1.4, 1, 1.8);
    } else if (def.requires === 'hearts') {
      ctx.fillStyle = Theme.chest.lockHeart; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('♥', c.x, c.y + 3);
    } else {
      ctx.fillStyle = Theme.chest.lockPlain;
      ctx.beginPath(); ctx.arc(c.x, c.y + 2, 3, 0, Math.PI * 2); ctx.fill();
    }
  },

  // items/trinkets/familiars all share {color, icon} — the little pedestal
  // circle-plus-emoji look used both on their world pedestal and here.
  // `now` (optional) drives a slow pulse on the rarity glow ring for items
  // with a `quality` (see Util.qualityGlow) — omit it for a static preview
  // (loot-list icons, the room editor) and it still draws a glow, just still.
  drawItemIcon(ctx, x, y, item, now){
    const q = item.quality || 0;
    const glow = q ? Util.qualityGlow(q) : null;
    ctx.save();
    ctx.translate(x, y);
    if (glow) {
      const pulse = 1 + Math.sin((now || 0) / 260) * 0.12;
      if (glow.ring) {
        // the ring scales with the tier instead of being one flat intensity
        // for everything: a q4 gets a thicker, brighter ring plus a faint
        // outer halo, so "walk over to this one" reads from across the room
        const top = q >= 4;
        ctx.strokeStyle = glow.color;
        ctx.globalAlpha = top ? 0.7 : 0.5; ctx.lineWidth = top ? 3 : 2;
        ctx.beginPath(); ctx.arc(0, 0, 17 * pulse, 0, Math.PI * 2); ctx.stroke();
        if (top) {
          ctx.globalAlpha = 0.22; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(0, 0, 21 * pulse, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ctx.shadowColor = glow.color; ctx.shadowBlur = glow.blur;
    }
    ctx.fillStyle = Util.bodyShadeLocal(ctx, 0, 0, 13, item.color);
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // plate bevel — a lit upper-left arc, a shadowed lower-right one and a
    // small specular smear, so the disc reads as a raised plate rather than
    // a flat colored circle
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = Theme.shadow.rim;
    ctx.beginPath(); ctx.arc(0, 0, 11.6, Math.PI * 0.85, Math.PI * 1.75); ctx.stroke();
    ctx.strokeStyle = Theme.shadow.outlineSoft;
    ctx.beginPath(); ctx.arc(0, 0, 11.6, Math.PI * -0.15, Math.PI * 0.75); ctx.stroke();
    ctx.fillStyle = Theme.shadow.sheen;
    ctx.beginPath(); ctx.ellipse(-4.5, -5.5, 3.6, 2.2, -0.6, 0, Math.PI * 2); ctx.fill();
    // outer ring — tinted by tier when the item has one (this is the only
    // tell a q2 gets, since its glow has no ring), plain otherwise
    ctx.lineWidth = 1;
    ctx.strokeStyle = glow ? glow.color : Theme.icon.itemRing;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = Theme.ui.onIcon;
    // a cheap drop-shadow behind the emoji so it stays legible over busy
    // backgrounds/mid-combat clutter — doesn't touch the disc's size/position
    ctx.shadowColor = Theme.shadow.groundHard; ctx.shadowBlur = 2;
    ctx.fillText(item.icon, 0, 1);
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  // e = {x, y, radius, color, dark, behavior, hp?, maxHp?, hitFlash?, type?}
  // — the shared "brown humanoid raider" enemy/boss sprite (see entities.js's
  // Enemy/Boss). forceHealthBar is Direct Glass's effect — always show the
  // bar, not just above the usual maxHp>3 threshold. now/moving (optional)
  // drive a small walk cycle + wing flap/rune pulse; omitting them renders a
  // static idle pose (the room editor's spawner preview does this).
  //
  // Every archetype shares the same base humanoid build, but `behavior`
  // (see enemies.js) layers on raider "gear" so a shielded guard, a horned
  // charger, a hooded slinger, a bomb-strapped bomber and a flying scout all
  // read as different threats at a glance instead of same-blob-different-
  // color. Turrets (speed:0) skip the humanoid build entirely in favor of a
  // planted totem, since "walking raider" reads wrong for something that
  // never moves. Bosses get an ornamented crown + aura; superbosses (the
  // ones with a `type.icon`) add their emoji as a crest so they're
  // unmistakable even at a glance mid-fight.
  /* ---- pre-baked enemy sprites ---------------------------------
     drawBrownHumanoid is (by entity count) the most-drawn thing in the
     game: two dozen vector ops per enemy per frame, most of which
     produce exactly the same pixels every frame. The static half of the
     body is baked once to a small offscreen canvas — the same trick
     render.js's rebuildTileLayer uses for room tiles — and blitted with
     a single drawImage after that.

     WHAT IS NOT BAKED, and why: the shadow (one ellipse, and it has to
     sit *under* the legs), the legs/wings (animated every frame), the
     bomber's strapped charge (its glow tracks a live fuse timer), boss
     ornamentation (the aura pulses under the crown, and there's only
     ever one boss on screen), the turret's charging eye (pulses), and
     the health bar. Baking only the static layer keeps every animation
     perfectly smooth — the alternative, baking N discrete animation
     frames, would have quantized the walk cycle.
     -------------------------------------------------------------- */
  _humanoidSprites: new Map(),

  _humanoidSprite(e, flash, scale){
    const tuft = !!(e.type && (e.type.id === 'sapling' || e.type.id === 'sprout'));
    const key = (e.behavior || '') + '|' + e.color + '|' + e.dark + '|' + e.radius + '|' +
      (flash ? 1 : 0) + '|' + (e.shielded ? 1 : 0) + '|' + (tuft ? 1 : 0) + '|' + scale;
    let sp = Util._humanoidSprites.get(key);
    if (sp) return sp;
    const r = e.radius;
    const turret = (e.behavior || '') === 'turret';
    // bake box, in radii, measured off the widest/tallest gear each build can
    // wear: shielded's shield reaches +1.16r sideways, the arms ±1.01r, the
    // ranged hood's apex -1.60r, the body's bottom +0.85r. Padded a little.
    // the anchor offsets are rounded up to whole device pixels so the sprite's
    // antialiasing phase is canonical (it never depends on where the enemy
    // happened to be standing when the bake ran) and the blit stays integral
    const up = (v) => Math.ceil(v * scale) / scale;
    const ox = up(turret ? r * 1.05 : r * 1.4);
    const oyTop = up(turret ? r * 1.05 : r * 1.95);
    const oyBot = up(turret ? r * 1.05 : r * 1.15);
    const cv = document.createElement('canvas');
    // physical size first, then derive the logical blit size back off it, so
    // drawImage always maps the sprite 1:1 onto device pixels (no resampling)
    const pw = Math.max(1, Math.ceil(ox * 2 * scale)), ph = Math.max(1, Math.ceil((oyTop + oyBot) * scale));
    cv.width = pw; cv.height = ph;
    const bctx = cv.getContext('2d');
    bctx.setTransform(scale, 0, 0, scale, 0, 0);
    // the body drawers below work in absolute world coordinates off e.x/e.y,
    // so rather than rewriting them into a local space, translate the bake
    // canvas so (e.x, e.y) lands on the sprite's anchor point
    bctx.translate(ox - e.x, oyTop - e.y);
    if (turret) Util._turretStatic(bctx, e, flash); else Util._humanoidStatic(bctx, e, flash);
    sp = { cv, ox, oy: oyTop, w: pw / scale, h: ph / scale };
    // Cap raised from 96 as the roster grew: distinct (behavior, palette,
    // radius) combinations now comfortably exceed the old cap on a busy
    // floor, and the old "clear everything" eviction meant re-baking every
    // sprite on screen every frame once it tripped. A Map iterates in
    // insertion order, so dropping the first key evicts the oldest entry —
    // one bake lost instead of all of them.
    while (Util._humanoidSprites.size >= 256) {
      Util._humanoidSprites.delete(Util._humanoidSprites.keys().next().value);
    }
    Util._humanoidSprites.set(key, sp);
    return sp;
  },

  _blitSprite(ctx, sp, e, scale){
    // snap to whole device pixels so the baked antialiasing is reproduced
    // exactly instead of being resampled a second time
    ctx.drawImage(sp.cv,
      Math.round((e.x - sp.ox) * scale) / scale,
      Math.round((e.y - sp.oy) * scale) / scale,
      sp.w, sp.h);
  },
};

# Nightfall Charge — Code Reference

Generated reference for every file, object, and function in `js/`. This exists so
a future edit — yours or another agent's — doesn't require re-reading 28,000
lines of source to find out what something does or who calls it.

## How this codebase is put together

- **No build step, no modules.** Every `js/**/*.js` file is loaded via a plain
  `<script>` tag in `index.html` (and a smaller subset in `room-editor.html`).
  All files share **one global JS scope** — a `const`/`function` declared in
  one file is a bare global name usable from every file loaded after it.
  There is no `import`/`export`, no bundler, no `window.X =` namespacing.
- **Load order is load-bearing.** A file that references `ITEMS` at its own
  top level (not inside a function body) will throw if it loads before the
  file that declares `ITEMS`. `index.html` and `room-editor.html` encode the
  real dependency order — see their `<script>` lists directly rather than
  assuming folder names imply order.
- **File boundaries are mechanical, not logical.** The codebase was
  originally ~24 files; each got too large to comfortably navigate, so it was
  split into the current 64-file tree purely by physical size. A single
  logical unit (one big object literal, one sequence of related function
  declarations) is often spread across several `-1.js`/`-2.js`/…/`-N.js`
  files. Splits use one of two mechanical patterns you'll see repeatedly:
  - **Object continuation:** file 1 declares `const ITEMS = { ...first chunk... };`;
    files 2+ do `Object.assign(ITEMS, { ...next chunk... });`.
  - **Array continuation:** the base file declares `ROOM_TEMPLATES.normal = []`
    (or similar); continuation files do `ROOM_TEMPLATES.normal.push(...)`.
  Every section below documents the *logical* unit first and lists which
  physical files it spans — treat a `-1.js`/`-2.js` group as one file when
  editing; there is no meaningful difference between "editing items-3.js"
  and "editing items.js" used to be.
- **Verification note:** the split was mechanically generated and verified
  against the pre-split originals via a combined-context `vm` sandbox diff —
  every data table and the full top-level function set came back byte-identical.
  This document was written by reading the *current* split files directly, so
  it describes the code as it actually is, not as it's remembered to have been.

## Folder map

| Folder | Contents |
|---|---|
| `js/core/` | Math/rng helpers, canvas-draw helpers (`Util`), theming (`Theme`), synthesized audio (`Sound`) |
| `js/data/` | Static data: items, trinkets, familiars, classes, pickups, economy, stages |
| `js/data/enemies/` | Enemy/boss/superboss definitions + HP/damage growth curves |
| `js/data/roomTemplates/` | The hand-authored + procedurally-generated room layout database |
| `js/achievements/` | Achievement definitions, unlock tracking/persistence, achievements panel UI |
| `js/systems/` | Dungeon generation, room population, combat, the layered-attack system, AI, familiars, pills, stars, player stat calculation, shop |
| `js/entities/` | The `Player`/`Enemy`/`Boss`/`Projectile`/`Obstacle`/… runtime classes |
| `js/ui/` | Canvas rendering, HUD/panel UI, bestiary panel, the standalone room-editor tool |
| `js/game.js`, `js/main.js` | The `Game` class (run/frame lifecycle) and bootstrap/persistence — kept at root, not split |

## Table of contents

1. [core/ and entities/](#part-1) — math/rng/draw/audio helpers and the runtime entity classes
2. [data/](#part-2) — items, trinkets, familiars, classes, pickups, economy, stages
3. [data/enemies/ and data/roomTemplates/](#part-3) — enemy/boss data and the room-layout format
4. [achievements/](#part-4) — achievement definitions, unlock logic, panel UI
5. [systems/ part 1](#part-5) — dungeon generation, room population, layered attacks, core combat
6. [systems/ part 2](#part-6) — AI, familiars, pills, stars, player stats, shop
7. [ui/, game.js, main.js](#part-7) — the Game class, rendering, HUD UI, room editor, bootstrap

---

<a id="part-1"></a>

# Part 1 — core/ and entities/

## core/ — math, rng, canvas-draw helpers, theming, audio, and the Entity/Player/Enemy/Boss/Projectile/Obstacle classes

### core/theme.js

**Purpose.** The game's semantic colour palette for everything the *renderer* decides on its own (HUD bars, status-effect rings, projectile glows, explosion gradients, shadows/ambient occlusion, world fixtures, character-sprite detail colours). Per-item/per-enemy identity colours (`color`/`dark` on ITEMS, enemy types, obstacles, etc. in data.js/enemies.js) deliberately stay out of this file — only colours the renderer itself picks up live here, so retheming or auditing "do these two things actually match" is a value edit instead of a hex-grepping exercise. Complements (does not replace) the STAGES terrain-palette system. **Load order: must be the first script on the page, before utils.js**, because utils.js reads `Theme` at definition time (e.g. `_shadeCache`/gradient helpers reference `Theme.*` tokens as default args/branches). Consumed heavily by `core/utils-1.js`/`utils-2.js`'s icon/sprite drawers, `ui/render.js`, and `systems/ai-1.js`.

- **`Theme`** — a single large object literal, namespaced into sub-objects. Every leaf value is either a finished CSS colour string (hex or `rgba(...)`), a raw `"r,g,b"` triplet (only in `Theme.rgb`, for colours that need a *varying* alpha), or a small numeric constant (blur radii, line widths). Sub-objects (all fixed, small, enumerated below since each is well under 20 keys):
  - `rgb` — raw `"r,g,b"` triplets for colours drawn at varying alpha: `black`, `white`, `fadeVeil` (room-transition veil), `ice`, `iceFill`, `shield`, `fear`, `poison`, `laser` (Pony Bot's beam default tint), `swingTrail`, `emberRing`.
  - `rgba(triplet, a)` — a **method**, not data: `'rgba(' + triplet + ',' + a + ')'`. Turns a `Theme.rgb.*` triplet into a CSS `rgba()` string at a call-supplied alpha. Called from `ui/render.js` and `systems/ai-1.js`.
  - `ui` — HUD/on-canvas UI colours: `text`, `textDim`, `onIcon`/`onIconSoft` (glyph-on-disc text colour), `gold`/`goldDim` (prices, stairs, donation meter; dim = can't afford), `bossBarBack`/`bossBarEmpty`/`bossBarFill`, `hpBarBack`/`hpBarFill`.
  - `floatText` — canonical colours for `FloatText` instances (`damage`, `crit`, `heal`, `shield`, `playerHurt`, `coin`, `curse`, `neutral`, `muted`, `arcane`, `stun`). Comment notes combat.js currently passes some of these as literals rather than referencing the token — a known migration debt, not a bug.
  - `projectile` — renderer-side bolt defaults/highlight: `player`, `enemy`, `familiar`, `turretBolt`, `turretEye`, `glint`, plus `glowBlur`/`glowBlurBig` (shadow-blur px for normal vs. explosive bolts).
  - `status` — status-effect visuals: `freezeRing`/`freezeFill`/`freezeFillPlayer`/`freezeWidth`, `stun`, `charm`, `fearRing`, `poisonAura`/`poisonBlob`, `vulnerableRing`/`vulnerableMark` (Phase 6a overhaul — a crimson ring + small crosshair mark for `e.vulnerableTimer`, the first visual it's ever had), `shieldRing`, `invincibleGlow`.
  - `quality` — rarity glow tiers keyed `q2`/`q3`/`q4`, each `{color, blur, ring:bool}`. Quality 1 intentionally has no entry (`Util.qualityGlow` returns `null`) so the glow stays a meaningful "worth walking over to" signal.
  - `fx` — explosions/fire/bombs/embers: `blastCore`, `blastMidR`/`blastMidG`/`blastMidGRamp`/`blastMidB` (explosion radial-gradient mid stop, G channel ramps with particle age), `blastEdge`, `blastRing`, `bombBody`/`bombBodyDark`, `fuse`/`fuseHot`/`fuseCord`/`fuseSpark`, `ember`/`emberGlow`.
  - `shadow` — drop-shadow/AO/outline/highlight tokens shared by every body/rock/coin/chest: `ground`/`groundSoft`/`groundHard`, `pedestal`, `ao`/`aoWidth`, `outline`/`outlineSoft`/`outlineHard`, `rim`, `sheen`, `glint`.
  - `vignette` — `{enabled:bool, stops:[[offset,color], ...]}`, a 4-stop radial gradient definition for the screen-space darkening vignette drawn after the world.
  - `particle` — FX particle default colours: `hitSpark`, `critSpark`, `bloodPuff`, `dust`, `dustSolid`, `sparkle`, `heal`.
  - `door` — object keyed by room-destination type (`boss`, `treasure`, `shop`, `petshop`, `curse`, `sacrifice`, `vault`, `challenge`, `crystal`, `sombra`, `normal`, and — Phase 4 overhaul — `arcade`), each value `{open, locked}` hex colours. This is the one piece of terrain colouring the renderer owns (a door colour is a signpost, not floor terrain). Note: `shrine` has no entry here (pre-existing gap from Phase 3 — falls back to `DOOR_COLORS.normal` via the `|| DOOR_COLORS.normal` in `ui/render.js`).
  - `world` — misc world-fixture colours: `secretOpen`, `pedestalBase`/`pedestalTop`, `shopPickup`, `stairsPit`/`stairsRing`, `branchA`/`branchB`, `pitFill`/`pitEdge`.
  - `icon` — small pickup-icon colours: key/gold-key, bomb body/fuse (plain + gold variants), `goldGlowBlur`, heart red/blue (+ outline variants), `heartContainer`, sack body/seam/tie, battery shell/charge, `pillHalf`, `itemRing`.
  - `chest` — chest lock-icon colours keyed by `def.requires`: `lockBomb`, `lockKey`, `lockHeart`, `lockPlain`.
  - `machine` — shop-room fixture colours for the donation machine (`body`, `frame`, `meterBg`, `meterFill`, `slot`, `label`) and the reroll altar (`altarBody`, `altarFrame`, `altarGlow`); and — Phase 4 overhaul — the arcade room's 3 machines (`friendshipBody`/`friendshipFrame`, `toolsBody`/`toolsFrame`, `darkBody`/`darkFrame`) plus the arcade filly sign (`fillySign`, `fillySignEdge`); and — Phase 6a overhaul — `spinRing`, the friendship/tools machines' spin-anticipation flourish colour (see `Util.drawMachineSpinFlourish`).
  - `pony` — shared character-sprite detail colours (all classes/enemies): `flash` (hit-flash silhouette), `beak`, `talon`, `fang`, `horn`, `chargerHorn`, `eyeWhite`, `pupil`, `eyeGlint`, `robotEye`, `robotSeam`, `ghostAlpha` (Windigo/Crystal Pony translucency).
  - `enemy` — `flash`, `flashSoft`, `eye`, `submergedAlpha` (burrower dig-under alpha).
  - `obstacle` — `flash`, `flashSoft`, `hardOutline`.
- **`DOOR_COLORS`** — `const DOOR_COLORS = Theme.door;`, a thin backward-compatible alias so old call sites referencing the pre-Theme name keep working. Used by `game.js` and `ui/render.js`. Phase 7a added a `planetarium` entry (`open:'#6a5ce0'`, `locked:'#2e2870'`), read two ways: as the colour a neighbouring room's door takes when it opens onto the star room, and (via `paintPortalTile`) as the portal colour painted inside the star room itself.

**Gotchas.** Tokens are semantic, not descriptive (`Theme.status.freezeRing`, never `Theme.blue3`) — a future retheme should stay a value edit. Don't add per-item/per-enemy identity colours here; those belong in data.js/enemies.js. Must load before `utils.js`.

### core/utils-1.js + core/utils-2.js (utils.js, split across 2 files)

**Purpose.** The math/rng grab-bag (`Util`), plus every shared canvas icon/sprite drawer used identically by the live game (`ui/render.js`) and the standalone room-editor tool (`ui/roomEditor.js`) so the editor's preview never diverges from what a spawner actually looks like in-game. Also declares the `PIT_*` bit constants and, at the bottom of part 2, the grid BFS pathfinding helpers used by AI chase logic. `utils-2.js` continues the `Util` object via `Object.assign(Util, {...})` — the two files are one logical unit. Nearly every other file in the codebase calls into `Util` for something (rng, clamping, distance, colour shading, or one of the `draw*` helpers).

- **`PIT_N`, `PIT_E`, `PIT_S`, `PIT_W`** = `1, 2, 4, 8` — bitmask constants for pit-tile edge connectivity. Set on a pit `Obstacle` as `_pitMask` once its room finishes populating (`systems/room.js`'s `computePitMasks`), read by `Util.drawObstacle`/`Util.pitGrad` to skip rims on edges shared with another pit so adjacent pits read as one continuous void. Declared here (not in room.js) because both `index.html` and `room-editor.html` load utils.js before room.js.
- **`Util`** — object literal (methods below), plus two private caches (`_shadeCache: Map`, `_bodyGradCache: WeakMap`) and a sprite cache (`_humanoidSprites: Map`).
  - `rand(min, max)` → random float in `[min, max)`. `Math.random()`-based.
  - `randi(min, max)` → random integer in `[min, max]` inclusive (floors `rand(min, max+1)`).
  - `choice(arr)` → random element of `arr`.
  - `chance(p)` → boolean, `true` with probability `p`.
  - `clamp(v, lo, hi)` → `v` bounded to `[lo, hi]`.
  - `lerp(a, b, t)` → linear interpolation.
  - `dist(ax, ay, bx, by)` / `dist2(...)` → Euclidean distance / squared distance (cheap circle-overlap check).
  - `angleTo(ax, ay, bx, by)` → `atan2` angle from a to b.
  - `formatNum(n)` → thousands-separated string via `toLocaleString('en-US')`, for HUD/stat readouts.
  - `formatDuration(seconds)` → `"m:ss"` or `"h:mm:ss"` past an hour, for run/lifetime playtime.
  - `weighted(items)` — `items = [{w:number, ...}]`; returns one item chosen with probability proportional to its `w`.
  - `shuffle(arr)` — in-place Fisher–Yates shuffle, returns `arr`.
  - `circleIntersect(ax,ay,ar,bx,by,br)` → boolean circle-circle overlap test (via `dist2`).
  - `drawHeart(ctx, x, y, size, fillFrac, fillColor, outlineColor)` — draws a heart `Path2D` (authored on a 16×16 grid, scaled) at top-left `(x,y)`; `fillFrac` 0..1 clips a partial horizontal fill for half-hearts. Always strokes an outline and fills a dark base first.
  - `drawRoundedRect(ctx, x, y, w, h, r)` — builds (but does not fill/stroke) a rounded-rect path via `arcTo`.
  - `key(x, y)` → `"x,y"` string, used as a Set/Map key by the BFS helpers.
  - `shadeColor(hex, pct)` — lightens (`pct>0`) or darkens (`pct<0`) a `'#rrggbb'` colour, returns an `'rgb(r,g,b)'` string. **Memoized** in `Util._shadeCache` (exact string key `hex+'|'+pct`; cleared entirely once size exceeds 4096 — a leak guard, not an LRU). This is the mechanism that turns one flat `def.color` per game object into cheap on-the-fly gradient shading without authoring separate light/dark colours in data.js.
  - `bodyShade(ctx, cx, cy, r, color)` → builds and returns a fresh `CanvasGradient` (radial, top-lit, centred at `(cx,cy)` with light offset), used by rock/coin/chest/body fills. Not cached itself.
  - `bodyShadeLocal(ctx, cx, cy, r, color)` — cached wrapper around `bodyShade`, keyed per-`ctx` via a `WeakMap` (so tile-bake canvas, minimap, class-select preview, room editor never share gradient objects) and then by `color+cx+cy+r` in an inner `Map` (cleared at 512 entries). Relies on the fact a `CanvasGradient`'s coordinates resolve in the *painted* user space, not the creation space, so a gradient authored once under a fixed local translate can be reused every frame under any `ctx.translate()`. Used by `drawItemIcon`, `drawPony`, and `ui/render.js`'s shop slots.
  - `qualityGlow(q)` → `Theme.quality.q4/q3/q2` for `q>=4/===3/===2`, else `null` (quality 1 gets no glow). Used by item-icon drawing wherever ITEMS render in the world.
  - `classPonyOpts(def)` — maps a `CLASSES` def to the accessory-flags object `drawPony()` expects: `{bodyColor, maneColor, hasWings, hasHorn, hasStripes, hasFangs, hasBeak, hasTalons, hasFinTail, isRobot, flameMane, hasScales, ghostly}`, decided by `def.id`/`def.canFly`/`def.stripes`. Exists so `ui/render.js` (live player) and `ui/ui.js` (class-select preview) never draw a mismatched pony. Gargoyle (Phase 1 overhaul) reuses `hasScales` for its rough stone hide — same "reuse an existing trait flag, no new `drawPony` branch" rule every class in this function follows; it also gets `hasWings` (follows `canFly`, which it has).
  - `pitGrad(ctx, ob)` — builds (once) and caches on the obstacle itself (`ob._pitGrad`/`ob._pitGradCtx`) a radial "depth" gradient for a pit tile; rebuilt only if drawn onto a different canvas.
  - `obstacleRadius(kind)` → `TILE/2` for `'pit'`, else `14`. Mirrored by `entities.js`'s `Obstacle` constructor (same rule duplicated, not called — a gotcha for future edits: keep both in sync).
  - `drawObstacle(ctx, ob, now)` — the big obstacle-kind dispatcher: draws pits (flat or connected via `_pitMask`+`PIT_*`), cactus, the four fire kinds (yellow/red/blue/purple, HP-scaled flicker), spike/trap variants (8-point jagged star), any `kind` starting with `'turret'`, mud, sandtrap, bomb barrels (with animated fuse spark), `def.current` tiles (flowing chevrons per `pushX`/`pushY`), and the default rock/hardrock/tallrock/tallhardrock path. Reads `ob.hitFlash`, `ob.def`, `ob._pitMask`, `ob.tall`, `ob.radius`; `now` drives flame flicker and current-tile scroll animation.
  - `drawKeyIcon`, `drawBombIcon`, `drawSackIcon`, `drawBatteryIcon(ctx,x,y,frac)`, `drawPillIcon` — small fixed-shape pickup icon drawers, each taking explicit colours (batteryIcon takes a fill fraction instead).
  - `drawStarIcon(ctx, x, y, color)` — 5-point star with a glow, for star pickups.
  - `drawPickupIcon(ctx, p, bob)` — dispatches on `p.kind` (`coin`, `key`, `doublekey`, `goldkey`, `bomb`, `doublebomb`, `goldbomb`, `heartRed`/`heartBlue`/half variants, `doubleheart`, `heartContainer`, `eternalheart`, `sack`, `battery`, `minibattery`, `pill`, `star`) to the icon drawers above, applying `bob` as a vertical offset. Pill/star lookups pull colour from `PILL_COLORS_BY_ID`/`STAR_TYPES` (defined elsewhere, in data files).
  - `drawChestIcon(ctx, c)` — draws a chest box + lid with a linear gradient, a lock glyph chosen by `c.def.requires` (`'bomb'`/`'key'`/`'hearts'`/plain), skipping the lock once `c.opened`.
  - `drawItemIcon(ctx, x, y, item, now)` — draws the pedestal/shop/loot-list item disc: optional rarity glow ring (pulses if `now` given, via `Util.qualityGlow`), a shaded disc (`bodyShadeLocal`), bevel highlight/shadow arcs, an outer ring (tinted by rarity tier if any), and the item's emoji `icon`.
  - `_humanoidSprites` (Map, sprite cache) + `_humanoidSprite(e, flash, scale)` — bakes the **static** half of a "brown humanoid raider" enemy body (arms/torso/head/tufts/eyes/non-animated gear) to a small offscreen canvas once per distinct `(behavior, color, dark, radius, flash, shielded, tuft, scale)` key, returns `{cv, ox, oy, w, h}`. Eviction is FIFO via Map insertion order once size hits 256 (one bake dropped at a time, not a full clear). This is a perf optimization: `drawBrownHumanoid` is the most-drawn thing in the game.
  - `_blitSprite(ctx, sp, e, scale)` — `drawImage`s a baked sprite at `e.x/e.y`, snapped to whole device pixels so the pre-baked antialiasing isn't resampled.

  (continuing in `utils-2.js`, all still `Util.*` via `Object.assign`)
  - `_turretStatic(ctx, e, flash)` — draws a stationary totem body (not a raider) for `behavior:'turret'` enemies.
  - `_humanoidStatic(ctx, e, flash)` — the bakeable half of a raider body: base ellipse torso/head, arms, eyes, optional sapling/sprout leaf tufts, and then one `if/else if` chain over `e.behavior` (`shielded`, `charger`, `ranged`, `orbiter`, `burrower`, `summoner`, `healer`, `sniper`, `swarm`, `ambusher`, `teleporter`, `shielder`, `lobber`, `weaver`, `sentry`, and — Phase 2's addition — `skirmisher`/`whiplash`) drawing a small distinguishing "gear" mark per archetype so all fourteen+ behaviors are visually distinct at a glance. `skirmisher` gets a double chevron on the chest (the hit-and-run "dash in/out" tell); `whiplash` gets a long curved "lash" line trailing off one side (its extended melee reach). Both are static-only marks (no live "gear flourish" companion in `drawBrownHumanoid`, unlike e.g. `weaver`/`sentry`'s animated accents) — simple enough to read at a glance without an animated tell. Called from `_humanoidSprite` (the baking path) and directly from `drawBrownHumanoid` when not baked.
  - `drawBrownHumanoid(ctx, e, flash, forceHealthBar, now, moving, bakeScale)` — the main enemy/boss/turret renderer. Draws the shadow, then legs (walk cycle if `moving`, idle sway otherwise) or wings (if `e.flies`/`behavior==='flyer'`) *underneath* the body, then blits the baked static sprite (if `bakeScale` given and not a boss) or calls `_humanoidStatic` live, then layers "live gear flourishes" per `behavior` (animated accents — pulsing horns, orbiting bead, breathing halo, scanning sentry eye, etc.) that intentionally stay outside the bake because they're time-varying, then bomber fuse/charge visuals, then boss ornamentation (pulsing ring, crown spikes, superboss emoji crest via `e.type.icon`), then the health bar (`Util.drawEnemyHealthBar`) unless `isBoss`. Reads `e.radius/x/y/color/dark/behavior/flies/isBoss/type/shielded/lobTimer/lobTime/healTimer/arming/fuseTimer/hp/maxHp` and more; mutates nothing on `e` itself. Called from `ui/render.js` and `ui/roomEditor.js` (which omits `bakeScale`, forcing the always-live path).
  - `drawEnemyHealthBar(ctx, e)` — a plain black-backed green bar above the enemy sized off `e.radius`/`e.hp`/`e.maxHp`.
  - `drawDonationMachine(ctx, x, y, frac)` — shop-room fixture: framed slab with a rising fill meter (`frac` 0..1) and a `$` slot label. See `systems/shop.js`.
  - `drawRerollAltar(ctx, x, y, now)` — the shop's other fixture: a squat violet slab topped with a slowly rotating arrow ring (`now` drives rotation).
  - `drawFilly(ctx, x, y, kind, now)` — Phase 4 overhaul, arcade room fixture: a small muted pony (`drawPony` with flat beggar-flavored colours, no `opts` reuse from `classPonyOpts`) plus a floating sign above its head showing what it wants fed, drawn via the same icon helpers `drawPickupIcon` uses (`drawKeyIcon`/`drawBombIcon`/`drawHeart`/`drawBatteryIcon`; `'coin'` gets a small inline gold circle+glint, matching `drawPickupIcon`'s own `'coin'` case rather than calling it directly since fillies have no `Pickup` coin-tier object). `kind` is one of `coin`/`bomb`/`key`/`heart`/`battery`. See `systems/shop.js`'s `tryArcadeInteract`.
  - `drawFriendshipMachine(ctx, x, y, machine, now)` / `drawToolsMachine(ctx, x, y, machine, now)` / `drawDarkMachine(ctx, x, y)` — Phase 4 overhaul, the arcade room's 3 machines: same shadow-ellipse + framed-slab silhouette family as `drawDonationMachine`/`drawRerollAltar`, one small distinguishing glyph each (a heart via `drawHeart`, a key via `drawKeyIcon`, a star via `drawStarIcon`), colours from `Theme.machine.friendship*`/`tools*`/`dark*`. Phase 6a overhaul: Friendship/Tools additionally take the machine object and `this.now` (optional — `drawDarkMachine`'s signature is unchanged, it never spins) and forward them to `drawMachineSpinFlourish` below.
  - `drawMachineSpinFlourish(ctx, x, y, machine, now)` — Phase 6a overhaul: no-op unless `machine.spinning` is true; draws a small spinning dashed ring (`Theme.machine.spinRing`) over the machine's glyph, angle driven by `now`, as the anticipation beat between a Friendship/Tools machine press and its reveal. See `systems/shop.js`'s `useArcadeMachine`/`updateArcadeMachines`.
  - `drawPony(ctx, x, y, size, opts)` — the full player/preview character sprite: shadow, legs (walk-cycle or idle sway), optional wings (flap animated by `now`/`opts.moving`), tail (plain ellipse or fin-shaped for `hasFinTail`), body ellipse (shaded, optionally scaled with `opts.ghostly` alpha), optional scales/stripes overlay, optional robot seam lines, head (cranium + muzzle, or beak instead of muzzle), ears (longer/pointier if `hasFangs`), fangs, horn, mane (plain ellipse or jagged "flame" shape for `flameMane`), eyes (white+pupil+glint, or robot glowing eye), and talons. All conditional on the `opts` flags built by `Util.classPonyOpts`. Reads `opts.facing` for orientation, `opts.now`/`opts.moving` for animation, `opts.flash` to swap every colour to `Theme.pony.flash`. Called by `ui/render.js` (live player) and `ui/ui.js` (class-select preview).

- **`bfsPath(cols, rows, isBlocked, startX, startY, goalX, goalY)`** (top-level function, `utils-2.js`) — grid-tile breadth-first search. `isBlocked(x,y) => bool` is a caller-supplied predicate; the goal tile is always allowed through even if blocked. Returns `[]` if start===goal, an ordered array of `{x,y}` waypoints (start excluded, goal included) on success, or `null` if no route is found within a 2500-iteration budget. Mutates nothing global; local `visited` Set + queue only. Called by `systems/ai-1.js`'s `chaseSeek()`.
- **`bfsNextStep(cols, rows, isBlocked, startX, startY, goalX, goalY)`** — convenience wrapper: returns just `bfsPath(...)`'s first waypoint, or `null`. Same caller (`systems/ai-1.js`).

**Gotchas / invariants.**
- `Util.shadeColor`'s cache key is the exact `hex+pct` string — no quantization — so callers must pass consistent hex casing/format or the cache silently duplicates entries (bounded by the 4096-entry clear anyway).
- `Util.bodyShadeLocal`'s gradient reuse only works because callers translate the canvas rather than passing live world coordinates; don't call it with varying world-space `cx/cy` or the cache will thrash and the correctness trick (gradient resolved at paint time) breaks down as a cache, not as a correctness issue.
- `Util.obstacleRadius(kind)`'s `'pit' ? TILE/2 : 14` rule is duplicated by hand in `entities.js`'s `Obstacle` constructor rather than called — keep both in sync if it ever changes.
- `Util._humanoidSprite`'s cache key intentionally excludes anything time-varying (no `now`/`moving`) — any behavior mark that needs per-frame variation must live in `drawBrownHumanoid`'s live "gear flourishes" section, not in `_humanoidStatic`, or it will freeze at its first-baked frame.
- `PIT_N/E/S/W` must be defined before `systems/room.js` runs its mask pass, and before any renderer draws a pit — enforced purely by script load order in `index.html`/`room-editor.html`.

### core/audio.js

**Purpose.** A self-contained synthesized SFX engine built on the Web Audio API — every effect is generated from oscillators and filtered noise, so the project ships with zero audio asset files. Exposes a single global `Sound` singleton. Called from most gameplay systems (`achievements/logic.js`, `game.js`, `main.js`, `systems/attackStyles.js`, `systems/combat-1..4.js`, `systems/familiars.js`, `systems/items-2.js`, `systems/pills.js`, `systems/shop.js`, `systems/stars.js`, `ui/bestiary.js`, `ui/ui.js`, and `entities/entities.js` itself for `playerHurt`/`shieldBlock`/`dodge`) to fire named one-shot sounds.

- **`Sound`** — an IIFE-built singleton object: `{ play, unlock, suspend, resume, toggleMute, isMuted, setVolume, getVolume }`. Internal (non-exported) state: `ctx` (lazily-created `AudioContext`), `master` (a `GainNode` all sounds route through), `noiseBuffer` (one shared 2-second white-noise buffer, generated once on first `ensureCtx()` and re-sliced per noise burst so frequent sounds never allocate fresh audio data), `BASE_VOLUME = 0.55` (what a 100% volume-slider setting maps to), `muted`/`volume` (persisted to `localStorage` under `nightfallMuted`/`nightfallVolume`).
  - `loadMutePref()` / `saveMutePref(v)` — read/write `localStorage['nightfallMuted']` as `'1'`/`'0'`, swallowing any storage errors (private-browsing, quota).
  - `loadVolumePref()` / `saveVolumePref(v)` — read/write `localStorage['nightfallVolume']` as a `0..1` float (`Util.clamp`'d on load; `NaN` falls back to `1`).
  - `ensureCtx()` — lazily creates the `AudioContext` (`window.AudioContext || window.webkitAudioContext`; returns `null` if unsupported), wires `master` gain (initial value `muted ? 0 : BASE_VOLUME*volume`) to `ctx.destination`, and builds the shared `noiseBuffer`. Idempotent — returns the existing `ctx` on subsequent calls.
  - `unlock()` — calls `ensureCtx()` then `resume()`s the context if `suspended`. Meant to be wired into the page's first real keydown/click handler (browsers block audio before a user gesture) — done in `main.js`/`ui.js`.
  - `suspend()` — suspends a `running` context, wrapped in try/catch. Called when the tab goes hidden (`main.js`'s `visibilitychange` handler). Never creates a context and never touches `muted`.
  - `resume()` — resumes a `suspended` context **only if not muted**, wrapped in try/catch. Counterpart to `suspend()` on tab-visible.
  - `setMuted(v)` — sets `muted`, persists it, and ramps `master.gain` to 0 or `BASE_VOLUME*volume` via `setTargetAtTime` (10 ms time-constant, avoids a click).
  - `toggleMute()` → flips `setMuted`, returns the new `muted` state.
  - `isMuted()` → current `muted`.
  - `setVolume(v)` — clamps `v` to `0..1`, persists it, and (if not muted) ramps `master.gain` to `BASE_VOLUME*volume`. `v` is expected pre-divided from a 0-100 UI slider by the caller (`main.js`'s `#volumeSlider`).
  - `getVolume()` → current `volume`.
  - `tone(freq, opts)` (private) — plays a single oscillator with attack/release gain envelope; `opts`: `type` ('sine' default), `dur`, `gain`, `attack`, `release`, `detune`, `sweepTo` (exponential frequency ramp), `delay`, `filterFreq`/`filterType` (optional biquad filter inserted before the gain stage). Schedules via `AudioContext.currentTime`-relative timestamps; auto-stops the oscillator after `dur+release+0.05`s.
  - `chord(freqs, opts)` (private) — fires several `tone()` calls staggered by `opts.stagger` (default 0.045s) starting at `opts.delay`, i.e. a quick arpeggio, for chimes/fanfares.
  - `noise(opts)` (private) — plays a random-offset slice of the shared `noiseBuffer` through a `BiquadFilterNode` (`filterFreq`/`filterType`/`filterQ`, optional `filterSweepTo`) and a gain envelope; used for whooshes/thuds/crunches/explosions.
  - **`SFX`** (private) — object literal, ~46 named zero-arg functions (`coin`, `coinNickel`, `coinDime`, `coinLucky`, `key`, `bombPickup`, `heart`, `heartContainer`, `itemGet`, `sack`, `battery`, `chestOpen`, `shopBuy`, `activeUse`, `meleeSwing`, `rangedShot`, `laserShot`, `enemyHit`, `crit`, `enemyDeath`, `bossDeath`, `playerHurt`, `shieldBlock`, `dodge`, `flashpowder`, `bombPlace`, `explosion`, `obstacleHit`, `obstacleDestroy`, `statusPoison`, `statusStun`, `statusFreeze`, `statusFear`, `statusCharm`, `roomClear`, `secretOpen`, `bossIntro`, `unlock`, `achievement`, `descend`, `gameOver`, `winFanfare`, `uiClick`, `uiDeny`, `machineWhiff` — Phase 6a overhaul, a soft descending `tone()` for an arcade Friendship/Tools machine's fair-gamble loss, deliberately distinct from `uiDeny`'s flat buzz which stays reserved for genuine insufficient-funds denials), each composed from one or more `tone()`/`chord()`/`noise()` calls. This table is the single place to add or tweak a sound.
  - `play(name)` — no-ops if `muted`; looks up `SFX[name]`, calls it inside a try/catch so a synth failure can never break gameplay (comment: "audio is best-effort"). This is the only entry point other files use (`Sound.play('coin')` etc.).

**Gotchas / invariants.** No sound will actually play until a user gesture calls `Sound.unlock()` — this is a browser policy, not a bug. `suspend()`/`resume()` are the tab-visibility pair and deliberately don't touch the mute flag, so a muted player coming back from a hidden tab stays muted. Status-effect SFX (`statusPoison` etc.) are documented as "never fired for bosses" by the calling code in combat.js, not by anything in audio.js itself. Adding a new sound = add one function to `SFX` and call `Sound.play('name')`.

### entities/entities.js

**Purpose.** Defines every core game-object class: `Player`, `Enemy`, `Boss` (extends `Enemy`), `Projectile`, `Obstacle`, `Pickup`, `Chest`, `Bomb`, `Explosion`, `FloatText`, `Familiar`. These are the plain-data-plus-a-little-behavior objects that `systems/room.js` spawns, `systems/combat-*.js`/`systems/ai-*.js` update every tick, and `ui/render.js` draws. They rely on globals defined elsewhere: `CLASSES`, `TILE`, `tileToPx`, `Sound`, `Util`, `enemyHpScale`/`bossHpScale`/`bossDmgScale`, `difficultyStatMult`, `unlockAchievement`, `OBSTACLES`, `CHEST_TYPES`.

- **`class Player`**
  - `constructor(classId)` — looks up `CLASSES[classId]` and copies a large set of base stats/flags off the class def (speed, melee/ranged damage, cooldowns, `boltSpeed`, `laser`, `charged`/`chargeTime`, `crystalVolley`, `greenFireAttack`, `shockwaveAttack`, `unlimitedRange`, starting coins/keys/bombs, `redMax`/`blueCurrent`, etc.), then initializes every runtime stat (`speed`, `meleeDamage`, `rangedDamage`, `critChance`, `luck`, on-hit status chances, `tearFlags` bag `{pierce,homing,spectral,explosive}`, `multishotExtra`, `dodgeChance`, `critMultiplier`, timers, per-floor/per-room/per-run "took damage" flags, etc.) to defaults later overwritten by `recalcPlayerStats` (items.js) each time equipment changes. `baseRangeTiles` defaults to 7 (ranged) or 1 (melee) unless `def.baseRangeTiles` overrides it, and is 0 for laser classes (room-spanning, ignores range). Notable fields: `attackLayers` (item-granted secondary/tertiary attack effects, rebuilt by `recalcPlayerStats`, dispatched by `systems/attackStyles.js`), `delayedActions` (generic `{time, fn}` queue ticked in `combat.js`'s `updatePlayer`, used by echoShot), `familiars` (array of `Familiar` instances), `pillPocket`/`pill*Bonus` fields (permanent, accumulate over the run), `starPocket`/`star*Bonus`/`starSpeedMult` (room-scoped, cleared on room entry by `game.js`'s `enterRoom`).
  - `totalHearts()` → `redCurrent + blueCurrent`.
  - `takeDamage(amount, source)` — the core damage pipeline. Early-outs on `invulnTimer>0`/`invincibleTimer>0`/`isDead`. Consumes one `shieldHits` charge if present (plays `'shieldBlock'`, no damage). Rolls `dodgeChance` (plays `'dodge'`, no damage). Otherwise plays `'playerHurt'`; spends `eternalHeart` (only if `blueCurrent<=0`, i.e. it's the first hit blue isn't soaking) by permanently shaving 0.5 off `redMax`; records `lastDamageSource` (used by the Bestiary's death-credit and the Pony Bot "die to a cactus" achievement, via `unlockAchievement('unlock_ponybot', null)` on `source==='cactus'`); sets four "took damage" flags and clears `goldHeart`. Damage is absorbed by `blueCurrent` first, then `redCurrent`; if `redCurrent` would drop to ≤0 and `hasSecondWind && !secondWindUsedThisFloor`, it clamps to 0.5 and marks the Second Wind used instead of dying; otherwise sets `isDead = true`. Finishes by recomputing `invulnTimer`, capped at 1.8s, from a base 0.85s plus additive bonuses from `foolsfeather` trinket and four stacking passive counts (`temperedsteel`, `seraphshield`, `phoenixfeathershard`, `steadfastheart`) — explicitly capped because several of those bonuses stack with themselves. Sets `dmgFlashTimer = 0.3`. Mutates: `blueCurrent`, `redCurrent`, `redMax`, `isDead`, `eternalHeart`, `goldHeart`, `secondWindUsedThisFloor`, `lastDamageSource`, four "took damage" flags, `invulnTimer`, `dmgFlashTimer`. Reads global `unlockAchievement`, `Sound`. Called throughout `systems/combat-*.js` and `systems/ai-*.js` wherever the player is hit.
  - `spendHearts(cost)` — draws down `cost` hearts, blue first then red, no minimum-remaining check (callers, e.g. `combat.js`'s `tryOpenChest`, are responsible for enforcing "must always leave something"). Sets `dmgFlashTimer = 0.3`. Used by cursed chests, devil deals, Sombra's Bargain, Martyr's Resolve.
  - `heal(amount)` — clamps `redCurrent` up to `redMax`.
  - `healBlue(amount)` — clamps `blueCurrent` into `[0, max(0, 20-redMax)]` (blue+red hearts share a 20-heart hard cap).
  - `grantHeartContainer(n)` — no-ops if `def.noRedContainers`; raises `redMax` toward `min(20-blueCurrent, redMax+n)` and heals the actual gained amount.
  - `onKill()` — rolls `onKillHealChance` (lifedrink), heals 0.5 if it hits and player isn't full.
  - `onHitLanded()` — rolls `lifestealChance`, same heal-0.5-if-not-full behavior.
  - `gainRoomClearCharge()` — increments `activeCharge` by 1, capped at `activeItem.maxCharge`, no-op if no active item.
  - `pickupActiveItem(item)` — sets `activeItem`, resets `activeCharge` to 0.
  - Instantiated only in `game.js` (`new Player(classId)`).
- **`class Enemy`**
  - `constructor(type, tx, ty, floorNum)` — positions via `tileToPx`, copies `type.radius/speed/flies/behavior/color/dark` etc. HP/damage are floor- and difficulty-scaled: `hp = round(type.hp * enemyHpScale(floorNum) * diffMult)`, `dmg = round(type.dmg * diffMult)` where `diffMult = difficultyStatMult()` if that global function exists, else 1 (comment: enemy HP scaling is multiplicative so relative toughness stays constant across floors, unlike an old flat-add formula). Initializes a very large set of per-behavior state fields eagerly (never lazily) covering: generic charger/leaper/turret/splitter fields, the extended behavior set (orbiter/burrower/summoner/healer/sniper/swarm/ambusher/teleporter/shielder/lobber/weaver/sentry — driven by `systems/ai-*.js`), the extended regular-boss set (bonecaller/gravechorus/rotbloom/antlerwarden/glassscorpion/duneravager/furnaceheart/slagbound), and the DNB superboss set (plapper/clapper/nhm/vanilladnb/onetruednb). The comments stress this eager-init is deliberate: any lazily-initialized timer would `NaN` on its first `-= dt` and freeze that boss's fight. This is also why Phase 2's two new regular-enemy behaviors (`skirmisher`/`whiplash`, see `systems/ai-2.js`) needed **no** new fields here at all — they read off `fireTimer`/`attackTimer`/`telegraph`, all three already eagerly initialized generically above. Also initializes status-effect timers — now **6**, not 5: poison/stun/freeze/fear/charm plus `vulnerableTimer` (Phase 1 overhaul's "Vulnerable" status, see the dedicated note below) — never applied to bosses per combat.js.
  - `takeDamage(amount, kx, ky)` — no-ops (`return false`) if `this.shielded`; otherwise, if `vulnerableTimer > 0`, multiplies `amount` by 1.5 first (the Vulnerable status's whole effect lives in this one line); then subtracts `hp`, sets `hitFlash = 0.15`, accumulates knockback into `knockX/knockY`, sets `isDead` if `hp<=0`, returns `true`. Called throughout `systems/combat-*.js`.
  - Instantiated in `systems/ai-1..4.js`, `systems/combat-2/3/4.js`, and `systems/room.js` (initial spawn).
- **`class Boss extends Enemy`**
  - `constructor(type, tx, ty, floorNum)` — calls `super(...)` then overwrites `hp`/`maxHp` using `bossHpScale(floorNum)` (a gentler curve than the plain-enemy one) and `dmg` using `bossDmgScale(floorNum)`, both re-applying `difficultyStatMult()` (thrown away from the parent's enemy-curve computation). Re-seeds `prevHp = this.hp` (read by `ai.js`'s `aiBossSlagbound` as a hit signal — must reflect the boss curve, not the discarded enemy curve). Sets `isBoss=true`, boss-specific timers (`attackTimer`, `pattern`, `minionsSpawned`, dash/telegraph state), and always starts `shielded=false`, `enraged=false`.
  - Instantiated only in `systems/room.js`.
- **`class Projectile`**
  - `constructor(x, y, vx, vy, damage, owner, opts)` — `owner` is `'player'` or `'enemy'` (default colour picked accordingly if `opts.color` omitted). `opts`: `radius` (default 5), `life` (default 2.5s), `pierce` (extra enemies it can pass through, tracked via `hitEnemies[]` to avoid double-hits), `fromBoss` (boss-sourced enemy bolts, read by `combat.js`'s `playerDamageAmount`), `source` (the firing enemy/obstacle, so `updateProjectiles`' obstacle-collision pass skips colliding a shot against its own shooter — only relevant for obstacle-sourced shots since enemies aren't in `node.obstacles`), and a snapshot of the firing player's `tearFlags` (`homing`, `spectral`, `explosive`) taken at fire time. `exploded` guards explosive bolts against detonating twice.
  - Instantiated in `systems/ai-1/2/3.js`, `systems/attackStyles.js`, `systems/combat-1/2.js`, `systems/familiars.js`.
- **`class Obstacle`**
  - `constructor(kind, tx, ty)` — looks up `OBSTACLES[kind]` as `this.def`; `radius` is `TILE/2` for `'pit'` else `14` (duplicate of `Util.obstacleRadius` — kept in sync by hand, not by calling it). Copies a long list of booleans off `def`: `destructible`, `alwaysBlocks` (`def.blocksFlight`), `tall`, `isHazard` (`def.hazard`), `attackable`, `solid` (explicit override so a hazard like Spiked Rock still blocks movement while hurting on contact), `isWalkable` (`def.walkable` — Mud/Sand Trap: never blocks movement/pathing/LOS/projectiles, independent of `isHazard`), `isFreezeTrap` (`def.freeze`, Sand Trap only), `pushable` (`def.pushable`, pushable Bomb Barrel). `hp = def.maxHp||0`; `fireTimer` randomized off `def.fireCooldown` if present. Moving Spike patrol fields (`spikeDir`, `spikeWallDir`, `spikeTargetTx/Ty`) are declared `null` here and lazily populated on first update tick by `combat.js`'s `updateMovingSpike` (needs the room grid, unavailable in this constructor).
  - Instantiated only in `systems/room.js`.
- **`class Pickup`** — `constructor(kind, tx, ty, extra)`: positions via `tileToPx`, fixed `radius=9`; `extra` is stashed as `this.coin` (coin-tier object) when `kind==='coin'`, as `this.pillColor` when `kind==='pill'`, or as `this.starId` when `kind==='star'`. `bobPhase` randomizes the idle bob animation phase per pickup. Instantiated in `game.js`, `systems/combat-1/2/3.js`, `systems/familiars.js`, `systems/items-2.js`, `systems/room.js`.
- **`class Chest`** — `constructor(kind, tx, ty)`: `def = CHEST_TYPES[kind] || CHEST_TYPES.grey`, fixed `radius=13`, `opened=false`. Instantiated in `systems/combat-4.js`, `systems/room.js`, `systems/stars.js`.
- **`class Bomb`** — `constructor(x, y, owner)`: fixed 1.7s `timer`, `radius=8`, `exploded=false`. Instantiated only in `systems/combat-3.js`.
- **`class Explosion`** — `constructor(x, y, radius)`: fixed `life=maxLife=0.35`s, a pure visual/hit-window effect. Instantiated in `systems/ai-1/2/3/4.js`, `systems/combat-3.js`, `systems/items-2.js`.
- **`class FloatText`** — `constructor(x, y, text, color)`: `color` defaults to `'#fff'` (note: several call sites pass `Theme.floatText.*` literals directly rather than always defaulting here — see theme.js's migration-debt comment). Fixed `life=maxLife=0.9`s. Instantiated very widely: `game.js`, `systems/ai-1.js`, `systems/attackStyles.js`, `systems/combat-1/2/3/4.js`, `systems/familiars.js`, `systems/items-2.js`, `systems/shop.js`.
- **`class Familiar`** — `constructor(def, player, index)`: a persistent companion that follows the player between rooms/floors for the rest of the run. Starts at the player's position; `angle = (index*1.7) % 2π` staggers multiple familiars so they don't stack exactly on top of each other; `fireTimer`/`procTimer` randomized off `def.cooldown`/`def.interval`. Behavior lives in `systems/familiars.js`, drawing in `ui/render.js`. Instantiated only in `systems/items-2.js`.

**The Vulnerable status effect (Phase 1 overhaul's 6th on-hit status).** A
marked enemy takes 50% more damage from *every* source (`Enemy.takeDamage`'s
1.5x multiplier above) for the duration of `vulnerableTimer` — eager-init 0,
same shape as the other five status timers. It follows the exact same
boss-immunity rule the other five do (nothing ever sets it on a boss, so the
multiplier is simply never live there): rolled per-hit against
`player.vulnerableChance` in `combat-2.js`'s `applyOnHitStatuses` (alongside
venom/stun/charm/freeze/fear, bumping the `enemiesMarkedVulnerable`
achievement-counter stat and reusing `statusStun`'s SFX since no dedicated
cue exists yet), decayed every frame in `combat-3.js`'s `updateStatusEffects`
(`e.vulnerableTimer = Math.max(0, e.vulnerableTimer - dt)`, same pattern as
the other four non-poison timers). `player.vulnerableChance` itself is built
in `items-1.js`'s `recalcPlayerStats`, sourced from the Gargoyle class's
`def.innateVulnerableChance` plus a set of new items (Hunter's Mark, Quarry
Sigil, Warden's Eye, Brander's Tag, Snare Glyph, Predator's Eye, Ecosystem
Totem) and trinkets (Duskstone Mark, Stonefeather Tag), capped at 0.4 like
its five siblings. See attackStyles.js below for the two attack-layer
families (`markedForDeath`, `venomBloom`) built around this status, and the
new Synergy subsection under items.js for how it composes with poison.

**Gotchas / invariants.**
- Every per-behavior/per-boss-archetype state field on `Enemy` is initialized eagerly in the constructor even though most behaviors never use most fields — this is intentional (see comments throughout) to guarantee no AI routine ever does arithmetic on `undefined` and silently freezes a fight, especially for the timer-driven DNB superboss fights.
- `Boss`'s constructor throws away and recomputes `hp`/`dmg`/`prevHp` after calling `super()` — anyone editing `Enemy`'s HP/damage formula should check whether `Boss` needs the equivalent edit, since it does not reuse `Enemy`'s computation.
- `Obstacle.radius`'s `'pit' ? TILE/2 : 14` rule and `Util.obstacleRadius`'s identical rule are two independent copies — not a shared call — so keep them in sync by hand.
- `Player.takeDamage`'s Eternal Heart check happens *before* blue is drained, deliberately, to see blue's pre-hit value; reordering this would break the "spent by the first hit blue doesn't fully absorb" rule.
- `Player.invulnTimer` is explicitly capped at 1.8s because several contributing passives/trinkets stack with themselves — removing the cap would let a heavily-built run buy functional immunity.


---

<a id="part-2"></a>

# Part 2 — data/

## data/ — item, trinket, familiar, class, and pickup/economy definitions

This is the game's static data layer: no functions of consequence beyond a
handful of small lookup/helper functions in `core.js` and `stages.js`. Every
file here is loaded as a plain global `const`, sharing one global scope with
every other `js/*.js` file — there is no module system. Several of these
`const`s are mechanically split across multiple files purely so no single
file is enormous; each split is documented below as one logical unit, in the
order it was actually assembled (`Object.assign(X, {...})` continuation
files literally append more keys onto the first file's object at load time,
so file order matters and all parts must load before anything reads `X`).

### data/core.js — TILE/BLOCK constants, ROOM_SHAPES, CLASSES, POOLS_*

**`TILE`** (=32) and **`BLOCK`** (=10) — pixel size of one tile, and tiles
per polyomino "block" (a 1×1 room is 10×10 tiles). Referenced throughout
`render.js`/`room.js`/`dungeon.js` for coordinate math.

**`ROOM_SHAPES`** — an array of polyomino masks used by the dungeon
generator to lay out multi-block rooms. Each entry: `{ name, w (width in
blocks), blocks (weight — actually the *inverse* of block count: `mask`'s
flattened 1-count is the real block count, `blocks` is a display weight),
mask (2D array of 0/1, row-major, 1 = block present) }`. `pickRoomShape(min,
max)` filters `ROOM_SHAPES` to masks whose flattened 1-count falls in
`[min,max]`, then does a `Util.weighted` pick keyed on each shape's `w`
(so wider shapes are proportionally more likely). Consumed by the dungeon
generator (`dungeon.js`) when placing rooms bigger than 1 block.

**`CLASSES`** — object keyed by class id, one entry per playable pony
(25 total as of this file: earth, pegasus, unicorn, batpony, zebra,
hypogriff, seapony, ponybot, griffin, kirin, dragon, windigo, kelpie,
breezie, dnbpony, then an **APPEND-ONLY ZONE** with crystalpony, mule,
alicorn, changeling, diamonddog, Phase 1 overhaul's gargoyle (locked,
unlocks via the `unlock_gargoyle` achievement: mark 50 enemies Vulnerable;
ranged/flying, sits statwise between Hypogriff and Griffin, carries
`innateVulnerableChance:0.10` — see `innateFreezeChance` below for the
identical wiring pattern this reuses), and — Phase 5a's addition — 4 more:
`changedling`, `changelingqueen`, `filly`, `engineerpony` (see the
dedicated Phase 5a note right after this list for what each one does).
The append-only comment is load-bearing:
`achievements.js` iterates `for (const classId in CLASSES)` in declaration
order to pair every class with every superboss and hand out
`SUPERBOSS_REWARDS` entries via a strictly-incrementing, non-modulo
counter — inserting a class anywhere but the bottom would re-shuffle every
later class's superboss-reward assignment.

Fields on a class entry (not every class has every field):
- `id`, `name` — identifier and display name.
- `color`, `mane` — hex colors used by the sprite renderer.
- `stripes` (zebra only) — bool, renderer draws stripe pattern.
- `sizeMult` (breezie 0.62, mule 1.18) — sprite/hitbox scale multiplier.
- `unlocked` — bool; classes without it are locked by default and carry
  `unlockHint` (string shown in the class-select UI) describing how to
  unlock them (tied to `achievements.js`).
- `redMax` — starting red heart containers (0 for ponybot/kirin, which run
  on blue magic only — see `noRedContainers`).
- `startBlue` (ponybot 6, dnbpony 1) — starting blue soul hearts.
- `speed` — base movement speed (px/s).
- `canFly` — bool; flying classes cross pits/rocks freely.
- `attackType` — `'melee'` or `'ranged'`. Drives which attack function
  `combat.js` calls every frame.
- Melee classes: `meleeDamage`, `meleeCooldown` (seconds between swings),
  optionally `baseRangeTiles` (kelpie's long reach).
- Ranged classes: `rangedDamage`, `fireCooldown`, `boltSpeed`. Special
  ranged variants:
  - `laser:true` (ponybot) — piercing room-spanning laser instead of bolts.
  - `charged:true` + `chargeTime` (dragon, crystalpony) — hold-to-charge
    attack; `baseRangeTiles` on dragon shortens its beam range.
  - `crystalVolley:true` (crystalpony) — three converging shards fired at
    once, reuses the charged/chargeTime plumbing.
  - `unlimitedRange:true` (breezie) — bolts never expire from distance.
  - `greenFireAttack:true` + `fireZoneRadius`/`fireZoneRange` (changeling)
    — plants a damage-over-time fire zone instead of firing bolts.
- `noRedContainers` (ponybot, kirin) — can never gain heart containers.
- `damageTakenMult` (ponybot only, 1.25) — multiplies incoming damage;
  absent (treated as 1) for every other class. Read by `combat.js`'s
  `playerDamageAmount`.
- `lifedrinkChance` (batpony 0.12, changeling 0.18) — per-kill chance to
  heal half a heart.
- `innateFreezeChance` (windigo 0.12) — folds into `recalcPlayerStats`'s
  freeze-chance formula alongside items like Cold Heart/Frostbite.
- `innateVulnerableChance` (gargoyle 0.10) — same wiring, one level up:
  folds into `recalcPlayerStats`'s `vulnerableChance` formula (the 6th
  on-hit status, see the "Vulnerable status effect" note under
  entities.js and attackStyles.js below) alongside Hunter's Mark/Quarry
  Sigil/Warden's Eye/etc.
- `shockwaveAttack:true` + `rockCoinChance`/`noTintedRocks` (diamonddog) —
  melee also shatters rocks/tallrocks; rocks it breaks use a flat coin
  chance instead of the normal rock-reward table, and tinted rocks never
  spawn on her runs.
- `startBombs`, `startKeys`, `startCoins` — starting inventory (every class
  has `startBombs:1`; most have 0 keys/coins, but crystalpony starts with
  8 coins, mule with 3 bombs/2 keys/12 coins, dnbpony with 1 key).
- `desc` — flavor text shown on the class-select screen.

**`POOLS_ALL`** = `['secret','treasure','boss','chest','shop','curse','challenge']`
— an item tagged with any of these pool names can appear via that room
type. **`POOLS_SPECIAL`** = `['secret','treasure','boss']` — held-back
pool for items reserved for already-guaranteed-good rooms. **`POOLS_CRYSTAL`**
= `['crystal','secret']` and **`POOLS_SOMBRA`** = `['sombra','curse']` are
narrower still and NOT part of `POOLS_ALL` — an item tagged with one of
these only turns up in the two room types its pool names, nowhere else.
**`POOLS_SHRINE`** (Phase 3 overhaul) = `['shrine','shop']` — same shape,
also not part of `POOLS_ALL`: a shrine item also turns up in shops, nowhere
else. Consumed by `systems/room.js`'s `pickItemFromPool(poolName, passiveChance)`,
which filters `ITEM_LIST` on `i.pools.includes(poolName)`.

#### Phase 5a overhaul — 4 new classes, their mechanics, the 60-trinket superboss backfill, and the corrected unlock achievements

Four new locked classes were appended to `CLASSES` (growing it from 21 to
25 entries — see the append-only-zone note above; this is also why the
`SUPERBOSS_REWARDS` grid grew from 15×21=315 to 15×25=375, see
`data/trinkets-2.js` below). All four are `unlocked:false` with an
`unlockHint`; every mechanic below reuses an EXISTING dispatch path rather
than adding a new one, per the brief.

- **`changedling`** (`js/data/core.js`) — an always-on, weaker,
  player-following version of the Changeling's `greenFireAttack`. Carries
  `innateFireRing:true` + `fireRingRadius:55` instead of `greenFireAttack`;
  `attackType`/`rangedDamage:1.0`/`fireCooldown:0.5` still set the DPS math
  (2.0/s, vs. the base Changeling's held 3.5/s). No `input.attack` gate at
  all — `systems/combat-1.js`'s `updateFireRingAttack(game, dt)` is called
  unconditionally every frame whenever `player.innateFireRing` is true
  (`combat-1.js`'s `updatePlayer`, right after the `greenFireAttack`
  branch). It reuses the exact same `player.fireZone` field the
  Changeling's own `updateGreenFireAttack` uses (only one of
  `greenFireAttack`/`innateFireRing` is ever true for a given class) and is
  a near-verbatim copy of that function's damage-tick loop (continuous
  `dps = rangedDamage / fireCooldown`, damage/lifesteal/sound/float-text
  throttled to one "shot" per `fireCooldown` via a `tickTimer`, same
  `runHitLayers`/`runCastLayers` calls) — the one structural difference is
  that `zone.x`/`zone.y` are reassigned to `player.x`/`player.y` every
  single frame instead of being planted once, which is what makes it read
  as a ring that follows her rather than a pool she leaves behind. Dispatch
  trigger string is `'firering'`, not `'firezone'` (any hit-layer handler
  not specifically gated on the trigger string still fires for it exactly
  like `'firezone'` — this is purely for future-debugging distinguishability).
  Each feedback tick also bumps `bumpStat('fireRingHits', 1, game)` — the
  Changedling's dedicated lifetime counter (see `mastery_firering` below).
- **`changelingqueen`** — a summoner. Her own attack reuses
  `greenFireAttack:true` verbatim (the base Changeling's own mechanic) but
  calibrated meaningfully weaker (`rangedDamage:0.8`/`fireCooldown:0.45`,
  `fireZoneRadius:35`/`fireZoneRange:30`, dps ≈1.78 vs. the base
  Changeling's 3.5). On top of that she carries `summonsChangelings:true`,
  `changelingSummonCooldown:8`, `maxChangelingMinions:2`,
  `changelingMinionDmg:0.5`, `changelingMinionRadius:25` — periodically
  (every 8s, capped at `maxChangelingMinions` alive at once) summons a
  small drifting changeling minion. `combat-1.js`'s
  `updateChangelingSummons(game, dt)` (called unconditionally every frame,
  no-ops if `!player.summonsChangelings`) handles both spawning (pushed
  onto `player.changelingMinions`, each `{x,y,angle,life,tickTimer}`,
  `CHANGELING_MINION_LIFE = 15`s) and, per living minion, a loose
  orbit-drift toward a point near the player (mirrors the shooter
  familiar's drift in `familiars.js`) plus its OWN small fire-zone damage
  tick (`CHANGELING_MINION_TICK = 0.5`s, flat `changelingMinionDmg * dt`
  DPS, not run through any cooldown math since minions have no cooldown
  field of their own) — dispatched through the SAME `'firezone'` trigger
  the player's own fire zone uses, via the same `runHitLayers`/
  `runCastLayers` calls, so any item that reacts to `'firezone'` also
  reacts to minion hits for free. Each new minion spawn bumps
  `bumpStat('changelingMinionsSummoned', 1, game)` (see
  `mastery_changelingsummons` below). Minions are not room-scoped the way
  Engineer Pony's turrets are — they simply age out on their own `life`
  timer regardless of room transitions, so no equivalent clear-on-exit fix
  was needed for them.
- **`filly`** — a deliberately weaker Earth Pony variant:
  `meleeDamage:1.4` (vs. Earth Pony's 2, -30%), `redMax:4` (vs. 6),
  `meleeCooldown:0.36` (vs. 0.4), `speed:175` (vs. 150, +16.7%),
  `sizeMult:0.8`. Carries `innateCharmChance:0.25`, which folds straight
  into `recalcPlayerStats`'s `charmChance` formula (`items-1.js`) alongside
  Flirtatious/Direct Charm/etc — the exact same wiring pattern as
  Gargoyle's `innateVulnerableChance`/Windigo's `innateFreezeChance`. No
  new call site needed: `combat-2.js`'s existing charm-roll code already
  bumps `bumpStat('enemiesCharmed', 1, game)` on every charm proc,
  regardless of source.
- **`engineerpony`** — the softest ranged attack on the books
  (`rangedDamage:1.0`/`fireCooldown:0.5`, dps 2.0 — below even Breezie's
  3.16 and Unicorn's 3.56), because her real damage comes from turrets, not
  her own horn. Carries `canBuildTurrets:true`. Holding the bound build key
  (`input.build`, wired in `main.js`, a NEW key binding alongside the
  existing move/attack/bomb keys) channels `player.turretBuildTimer` up by
  `dt` every frame while held (`combat-1.js`'s
  `updateTurretBuild(game, dt, input)`, no-ops if `!player.canBuildTurrets`,
  resets to 0 on release — same "reset on release, not pause-and-resume"
  shape as the Dragon/Crystal Pony charge attack); once the timer reaches
  `player.fireCooldown` (literally her own fire rate — "takes their fire
  rate to build one" per the brief) it plants a turret: `{x, y,
  sightRange: 3*TILE, fireTimer: 0, dmg: player.rangedDamage * 0.7, ang:
  0}` pushed onto `node.playerTurrets` (lazily created per room, capped at
  3 — a 4th attempt plays `uiDeny` and toasts "Maximum turrets already
  built."). `dmg` is snapshotted at build time, not read live off the
  player every shot — a turret is a standalone fixture once placed, not
  something a later damage-up retroactively buffs. Bumps
  `bumpStat('turretsBuilt', 1, game)` (see `mastery_turretsbuilt` below).
  `combat-1.js`'s `updatePlayerTurrets(game, dt)` (called unconditionally
  every frame) fires every placed turret in the CURRENT room at its
  nearest in-range enemy (bosses included) on an independent 1.0s
  per-turret cooldown (NOT tied to the player's own `fireCooldown` — a
  turret is its own fixture): it constructs a plain `Projectile(...,
  'player', {...})` and — this is the load-bearing line — sets
  `proj.attackTrigger = 'turret'` before pushing it. `combat-3.js`'s
  `updateProjectiles` hit-resolution code already does
  `if (isPlayerBolt && pr.attackTrigger) runHitLayers(game, pr.attackTrigger,
  ...)` for every player-owned projectile regardless of its source — this
  is the SAME generic dispatch normal player shots use (their own
  `attackTrigger` is set from `player.attackLayers`), so tagging a
  turret-fired bolt with `attackTrigger:'turret'` makes every existing
  item synergy that reacts to `attackTrigger` apply to turret damage for
  free, with zero new plumbing. Turrets are ROOM-scoped by design spec
  ("resets when leaving room") — since rooms persist in memory for the
  rest of the run and `room.js`'s `populateRoom` is a no-op on a second
  visit, nothing would ever clear a stale `node.playerTurrets` array on its
  own. `game.js`'s `transitionThroughDoor` now explicitly clears the
  DEPARTING room's turrets (`if (this.currentRoom &&
  this.currentRoom.playerTurrets) this.currentRoom.playerTurrets.length =
  0;`, right before it calls `enterRoom` on the destination) — clearing the
  room being LEFT, not the one being entered, so that returning to that
  same room later finds it empty rather than re-populated. This was one of
  two fixes the orchestrator made directly after the implementer that
  originally wrote Phase 5a was killed mid-task (see below for the other).
  Phase 6a overhaul: `updateArcadeMachines(game, dt)` (`systems/shop.js`) is
  called right after `updatePlayerTurrets` in this same per-frame block —
  see the arcade room section below (§ `systems/shop.js`) for what it does.

**`data/trinkets-2.js` — the Phase 5a superboss-grid batch (60 trinkets).**
Same exact idiom as the earlier Gargoyle batch immediately above it in the
file: `locked:true` with NEITHER `donationReward` NOR `pendingReward` set,
matching the precise filter `achievements.js` uses to build the
`SUPERBOSS_REWARDS` pool (`TRINKET_LIST.filter(t => t.locked &&
!t.donationReward && !t.pendingReward)`). Plain reskins (flat stat bumps
folding into existing `recalcPlayerStats` expressions), grouped into four
15-entry runs loosely themed per new class purely for authoring sanity —
the grid itself doesn't care which class "owns" which trinket. This widens
the trinket pool by 60 so `SUPERBOSS_REWARDS` can grow from 15×21=315 to
15×25=375 now that 4 more classes exist. **Verified**: `TRINKET_LIST`'s
count of entries matching that exact filter is unchanged by anything in
Phase 5b (see the Phase 5b section's reward-economy note under
`achievements/defs-6.js` below) — `SUPERBOSS_REWARDS.length === 375` still
holds.

**The two fixes the orchestrator made directly, after the implementer that
wrote the rest of Phase 5a was killed mid-task** (both verified against the
live code, not assumed):

1. **`js/achievements/defs-1.js`**, the 4 class-unlock achievements
   (`unlock_changedling`/`unlock_changelingqueen`/`unlock_filly`/
   `unlock_engineerpony`) — a comment immediately above them explains why
   they were re-pointed away from a first draft: that draft gated each new
   class's unlock behind a stat only that SAME class's own kit could ever
   generate (`fireRingHits` requires `innateFireRing`, i.e. the Changedling
   herself; `changelingMinionsSummoned` requires `summonsChangelings`, i.e.
   the Changeling Queen herself; `turretsBuilt` requires
   `canBuildTurrets`, i.e. Engineer Pony herself) — nothing else in the
   game could ever move those three counters, so those three achievements
   could never be earned by anyone, ever (a permanently-locked class,
   exactly the class of bug this whole audit exists to catch). Every OTHER
   class-unlock achievement in the file (including Gargoyle's, right above
   this batch) is earnable via ordinary play with an ALREADY-unlocked class
   or item, so the fix re-points these three at genuinely universal stats
   to match that pattern: `unlock_changedling` → `enemiesKilled >= 400`,
   `unlock_changelingqueen` → `familiarsCollected >= 40`, `unlock_filly` →
   `enemiesCharmed >= 60` (this one was always reachable via any
   charm-chance source, not just Filly's own kit — Filly's unlock threshold
   was simply raised from whatever the first draft had, since charm can
   already be procced by Flirtatious/Direct Charm/etc), `unlock_engineerpony`
   → `bombsPlaced >= 150`. `fireRingHits`/`changelingMinionsSummoned`/
   `turretsBuilt` are still tracked in `statDefaults` (they were never the
   problem — using them as an UNLOCK gate was) and were left explicitly
   flagged in the comment as "still available for a future non-unlock
   achievement/ladder" — which Phase 5b's `mastery_firering`/
   `mastery_changelingsummons`/`mastery_turretsbuilt` (see the Phase 5b
   section below) now fill in.
2. **`js/game.js`'s `transitionThroughDoor`** — now clears
   `this.currentRoom.playerTurrets` (if present, `.length = 0`) right
   before calling `enterRoom` on the destination room, documented above
   under Engineer Pony.

**A third, previously-uncaught bug found and fixed during this Phase 5b
pass** (not one of the orchestrator's original two, but the exact same
class of defect — a mechanic gated on something nothing in the codebase
ever produces): `combat-1.js`'s `updateTurretBuild` reads `input.build`,
and both its own comment and `entities.js`/`data/core.js`'s comments all
said "see main.js's `input.build`" — but `main.js`'s `input` object never
declared a `build` field, and neither its `keydown` nor `keyup` listener
had a case that ever set one. Every other held-input field (`up`/`down`/
`left`/`right`/`attack`) has a real key bound to it; `build` had none, so
`input.build` was permanently `undefined` (falsy) and Engineer Pony could
never build a turret under any circumstance — a fully non-functional
class mechanic that this Phase 5a pass's own verification apparently
missed. Fixed by binding it to `KeyV` (the nearest unused letter key —
B/E/Q/R/F/G/H/M/T/C/W/S/A/D/Space were all already taken): `input.build =
true` added to the input object's initializer, plus a `keydown`
`case 'KeyV': input.build = true;` and a matching `keyup`
`case 'KeyV': input.build = false;`, both held (not one-shot) like
`attack`, not the `tryX()` one-shot pattern the other action keys use.
Also added to both in-page control-hint `<p class="hint">` strings in
`index.html` ("Build Turret (hold): V").

### data/items-1.js … items-5.js — ITEMS (1120 entries, one logical unit)

`ITEMS` is declared as `const ITEMS = {...}` in `items-1.js`; `items-2.js`
through `items-5.js` each do `Object.assign(ITEMS, {...})`, so all five
files must load in order before anything reads `ITEMS`. `data/lists.js`
then derives `ITEM_LIST = Object.values(ITEMS)`, `PASSIVE_ITEMS`, and
`ACTIVE_ITEMS` from the finished object.

**Schema — every field an ITEMS entry can carry:**

| field | type | meaning |
|---|---|---|
| `id` | string | matches its object key; used everywhere as the stable reference |
| `type` | `'passive'` \| `'active'` | passives apply automatically on pickup; actives sit in the active-item slot and are triggered with a button, building charge as rooms clear |
| `quality` | 1-4 | rarity tier, drives the weighted roll in `pickByQuality` (`systems/room.js`: 40/30/20/10% for tiers 1-4) |
| `name` | string | display name |
| `icon` | string (emoji) | UI icon |
| `color` | hex string | UI accent color (pedestal glow, HUD icon border, etc.) |
| `pools` | array of pool-name strings | which room types the item can spawn from — see `POOLS_ALL`/`POOLS_SPECIAL`/`POOLS_CRYSTAL`/`POOLS_SOMBRA`/`POOLS_SHRINE` above; read by `room.js`'s `pickItemFromPool` |
| `desc` | string | player-facing tooltip/description text |
| `maxCharge` | integer (active only) | rooms-cleared needed to fully recharge the active item |
| `locked` | bool | item excluded from normal pool rolls until unlocked |
| `unlockedBy` | string | achievement id (or `'donation'`) that unlocks this item — see `achievements.js`/`shop.js` |
| `attackLayer` | object | optional "layered attack" sub-object — see below |

Locked items fall into a few provenance groups (see "Batches/history"
below): achievement rewards (`unlockedBy: <achievement id>`), donation
machine rewards (`unlockedBy:'donation'`, see `shop.js`), and items that are
simply rare because of *where* they spawn (Crystal/Sombra pool items are
unlocked by default — their rarity comes entirely from `pools`, not from
`locked`).

**`attackLayer` sub-object** — turns an item into a "layered attack": rather
than (or in addition to) a stat bonus, the item adds an extra behavior onto
every attack the player makes. `items.js`'s `recalcPlayerStats` rebuilds
`player.attackLayers` from every owned item carrying this field each time
stats recalc. It always has a `style` field naming one of 16 verbs
implemented as handler functions in `systems/attackStyles.js`, split across
two dispatch tables by *when* they fire:

- **`CAST_ATTACK_STYLES`** (fires once per attack **event** — once per melee
  swing, once per shot group, once per volley cast): `echoShot`,
  `mirrorConvert`, `groundSlam`, `chargeNova`, `ricochetBolt`,
  `orbitBlades`, `scatterVolley`, and — Phase 1 overhaul's addition —
  `skyfall` (ranged/volley-only: a landed cast has a chance to queue a
  delayed strike on a random living non-boss target's captured position).
- **`HIT_ATTACK_STYLES`** (fires once per enemy actually **damaged**):
  `chainLightning`, `knockbackPulse`, `onKillFragments`, `bloodPact`,
  `frostShatter`, `impactBurst`, and — Phase 1 overhaul's addition —
  `markedForDeath` (chance to mark the target Vulnerable; a hit against an
  already-marked target deals bonus damage instead) and `venomBloom` (same
  shape for poison — a hit against an already-poisoned target deals bonus
  damage AND spreads the poison to nearby non-boss enemies).

A style belongs to exactly one table, never both, so nothing double-fires.
The remaining `attackLayer` fields are style-specific parameters, e.g.
`radius`/`power` (groundSlam, impactBurst), `every`/`radius`/`power`
(chargeNova — triggers every Nth attack), `hpCost`/`power` (bloodPact —
spends player HP for bonus damage), `chance`/`duration`/`power`
(frostShatter, markedForDeath), `strength` (knockbackPulse), `blades`/
`radius`/`dmg` (orbitBlades — permanent orbiting blades, no trigger
needed), `bounces` (ricochetBolt), `fragments`/`power` (onKillFragments),
`delay`/`power` (echoShot), `range`/`power` (chainLightning), `bolts`/
`spread`/`power` (scatterVolley), `chance`/`radius`/`power` (venomBloom),
`chance`/`delay`/`radius`/`power` (skyfall — `delay` before the strike
lands, `radius`/`power` are the strike's own AoE). Two or more owned
layered items stack — every owned layer's handler fires on the relevant
trigger, not just one.

**Example entries (verbatim):**
```js
ironshoes: { id:'ironshoes', type:'passive', quality:1, name:'Iron Horseshoes', icon:'🥾', color:'#9a9a9a', pools:POOLS_ALL,
  desc:'+1 damage to all attacks. Melee swings also crack the ground for a small burst of damage all around you.',
  attackLayer:{ style:'groundSlam', radius:55, power:0.25 } },

thundercloud:{ id:'thundercloud', type:'active', quality:3, name:'Thundercloud', icon:'⛈️', color:'#6ea8e0', maxCharge:5, pools:POOLS_ALL,
  desc:'Strike every enemy in the room with lightning.' },

championscrown:{ id:'championscrown', type:'passive', quality:4, name:"Champion's Crown", icon:'👑', color:'#e3c15b', pools:POOLS_ALL,
  locked:true, unlockedBy:'completionist_<any character>', desc:"+2 Luck, +1 damage, +10% speed each (stacks). Three heavy blades orbit you, cutting anything they touch.",
  attackLayer:{ style:'orbitBlades', blades:3, radius:56, dmg:0.65 } },
```

**Batches/history (section markers found inside the ITEMS table, in file
order):**
- `items-1.js`: PASSIVE ; ACTIVE (maxCharge = rooms-cleared to recharge) ;
  ACHIEVEMENT REWARDS ; DONATION MACHINE REWARDS ; MORE PASSIVES PART 1
  (pure stat sticks) ; MORE PASSIVES PART 2 (Isaac-style quirks/tradeoffs/
  procs) ; CRYSTAL POOL (20) ; SOMBRA POOL (20) ; 20 MORE ACHIEVEMENT
  REWARDS (new room types/obstacles) ; 75 MORE ACHIEVEMENT REWARDS
  (escalating tiers on existing achievements).
- `items-2.js`: 25 MORE PASSIVES PART 3 ; 4 new SUPERBOSS REWARDS ;
  SUPERMASSIVE UPDATE BATCH (100 new items).
- `items-3.js`/`items-4.js`: continuation of the SUPERMASSIVE UPDATE BATCH
  and further locked reward items (mostly stat-stick reskins, no new
  section markers).
- `items-5.js`: final tail of locked items/actives — reskins for lifesteal,
  crit, freeze/stun/charm/fear-on-hit, boss damage, plus a long run of
  locked `active` consumables (zap/blast/heal/invincibility/speed/block/
  coins/bombs/map-reveal reskins at varying `maxCharge`); then, tail-end of
  the file, the **PHASE 1 OVERHAUL** batch — 22 new items introducing the
  Vulnerable status and its two attackLayer families, a third unrelated
  attackLayer family, and support passives for the 5 recalcPlayerStats
  synergies (see the Synergies subsection under items.js below): 5
  `markedForDeath`-family passives (Hunter's Mark, Quarry Sigil, Warden's
  Eye, Brander's Tag, Snare Glyph — marking/hunting flavor, calibrated
  against the existing frostShatter item family at comparable qualities); 5
  `venomBloom`-family passives (Plague Bud, Wither Petal, Bloomrot,
  Plaguebloom, Rot Crown — poison/plague/bloom flavor, calibrated against
  the existing chainLightning/impactBurst AoE-on-hit items); 5 `skyfall`-
  family passives (Comet Shard, Stormcaller, Skyrend, Meteor Crest,
  Celestial Fall — sky/meteor/comet/storm flavor, ranged-only, calibrated
  against groundSlam's radius/power scale, sized up since the strike is
  delayed and rarer than an always-on melee AoE); and 7 plain-passive
  synergy-support items with no `attackLayer` of their own (Fang Guard,
  Quiverstring — the melee/ranged halves of Synergy E "Twin Fangs";
  Ecosystem Totem — a small Vulnerable+poison chance source that also feeds
  Synergy A; Keen Mark, Predator's Eye, Pack Whistle, Quarry Hound Tag —
  plain crit/Vulnerable/luck stat sticks); then, further tail-end, the
  **PHASE 3 OVERHAUL — Shrine batch** — 12 new `pools:POOLS_SHRINE`-only
  items (shrine and shop, nowhere else) for the new Shrine room type
  (blessing/devotion/coin/faith flavor): 4 quality-1 (Shrine Candle +1 Luck,
  Votive Coin +1 all-attack damage, Pilgrim's Sandals +5% speed, Offering
  Bowl +20 magnet radius), 4 quality-2 (Faithful Bell +5% crit, Devoted
  Relic +1 range tile, Sanctified Wax +10% bomb radius, Tithe Purse -5%
  shop prices), 3 quality-3 (Martyr's Vow +10% boss damage, Blessed Halo 6%
  on-kill-heal chance, Ember Wick +8% fire rate), and 1 quality-4 (Eternal
  Devotion +2 Luck). Every one is a plain passive stat term, no new
  mechanic — each just adds into an existing `recalcPlayerStats` channel at
  that channel's usual magnitude for the item's quality tier, calibrated
  against the nearest same-quality item already on that channel (bossbane
  q1 = +8% boss damage vs. Martyr's Vow q3 = +10%; loyalpatron/
  mastervaultkeeper q1 = +5%/+10% shop discount vs. Tithe Purse q2 = -5%
  shop prices; see `items.js`'s `recalcPlayerStats` comments tagged "Phase
  3 overhaul — Shrine batch" for every insertion point).
  Further tail-end, the **PHASE 4 OVERHAUL — Arcade batch** — 11 new items
  for the new Arcade room type (see the arcade write-up in Part 3): 8
  `pools:[]` curated-only items, never drawn by any generic pool roll,
  handed out purely by id from the Bomb/Key fillies' capstone feeds —
  `ARCADE_BOMB_REWARDS` (Cherry Bomb q1 +12% bomb radius, Spark Fuse q1
  +10% bomb radius/+1 Luck, Demolition Rig q2 +20% bomb radius, Blastmaster
  q3 +1 all-attack damage/+20% bomb radius, calibrated against the nearest
  same-quality bomb-radius items already in the game) and
  `ARCADE_KEY_REWARDS` (Skeleton Keyring q1 +1 Luck, Brass Lockpick q1 +5%
  speed, Vaultcracker's Kit q2 -5% shop prices, Master Vault Key q3 +1
  all-attack damage — no dedicated "key" mechanic exists to hook, so these
  ride the same generic stat channels the Shrine batch above already
  established at their quality tier); plus 3 ordinary `pools:POOLS_ALL`
  visit-ladder reward items backing the `arcade_visits` `addTierSet`
  (`defs-6.js`) — Lucky Token q1 +2 Luck, Jackpot Charm q2 +6% crit/+1
  Luck, Arcade Crown q3 +1 all-attack damage/+2 Luck. All 11 are wired into
  `items.js`'s `recalcPlayerStats` under "Phase 4 overhaul — Arcade batch"
  comment markers across the luck/speed/melee-damage/ranged-damage/
  crit-chance/bomb-radius/shop-discount channels — same insertion pattern
  as the Shrine batch, just spread wider since the Arcade batch touches
  more channels per item on average.

### data/trinkets-1.js, trinkets-2.js — TRINKETS (455 entries)

`TRINKETS` is declared in `trinkets-1.js`; `trinkets-2.js` does
`Object.assign(TRINKETS, {...})`. Trinkets occupy a single swappable pocket
slot (unlike items, which stack permanently) — picking up a new one swaps
out whichever one you're carrying.

**Schema:**
| field | type | meaning |
|---|---|---|
| `id` | string | stable reference id |
| `name` | string | display name |
| `icon` | string (emoji) | UI icon |
| `color` | hex string | UI accent color |
| `locked` | bool | almost every trinket in this file is `locked:true` by default — trinkets are overwhelmingly an unlock-gated system, unlike items |
| `donationReward` | bool | marks a trinket as already earmarked by a specific donation-tier achievement (`donation_200`/`500`/`800`), which excludes it from the superboss-reward pool so it doesn't eat one of that pool's exclusive slots |
| `desc` | string | player-facing description |

Unlike `ITEMS`, trinkets carry **no mechanical fields of their own** (no
`attackLayer`, no `pools`, no `quality`) — every trinket's actual effect is
implemented by checking `player.trinketId === '<id>'` (or
`player.passives.<id>`-style flags) directly in the consuming system:
`items.js`'s `recalcPlayerStats` for stat-shaping trinkets, `game.js` for
per-floor/per-room hooks, `combat.js` for kill/pickup/blast hooks, and
`familiars.js` for companion-boosting trinkets. `desc` is therefore the
only place a trinket's behavior is spelled out in this file; the mechanism
itself lives in whichever system file's `if` statement matches the id.

**Example entries:**
```js
rustybolt: { id:'rustybolt', name:'Rusty Bolt', icon:'🔩', color:'#8a7a6a', locked:true,
  desc:'+1 damage to all attacks, -8% movement speed.' },

farseeingcharm:{ id:'farseeingcharm', name:'Farseeing Charm', icon:'🔭', color:'#7fd6c9', locked:true, donationReward:true,
  desc:'+1 tile of range for ranged attacks only — no effect on melee.' },

kitestring: { id:'kitestring', name:'Kite String', icon:'🪁', color:'#7fd6e0',
  desc:'You can fly, crossing gaps and hazard tiles freely.' },
```

**Batches/history:**
- `trinkets-1.js`: ~30 base unlockable trinkets (no marker, top of file) ;
  DONATION MACHINE REWARDS (3) ; 4 new SUPERBOSS REWARDS ; SUPERMASSIVE
  UPDATE BATCH (100 new) ; 28 new locked trinkets (sized to grow the
  superboss reward pool from 56→84 pairings) ; 60 new locked trinkets
  (superboss pool 84→165 pairings) ; EXPAND-EVERYTHING BATCH (new effects,
  grouped by which system consumes them: build-shaping flags in
  `items.js`, per-floor/per-room hooks in `game.js`, kill/pickup/blast
  hooks in `combat.js`, companion hooks in `familiars.js`) ; then reskins
  grouped by stat channel: flat damage (3), movement speed (3), luck (3),
  fire rate (3), crit chance (3), range (2), boss damage (2).
- `trinkets-2.js`: more reskins — lifesteal (2), on-hit statuses (5),
  utility (4) ; a themed block tied to the C-branch ("Gutters/Sewers/
  Rainforest") covering luck (4), movement speed (4), flat damage (5),
  crit chance (4), crit damage (2), lifesteal (2), on-hit statuses (5),
  boss damage dealt (3), boss damage taken (2), dodge (3), pickup
  magnetism (2), bomb radius (3), bolt flags (4), multishot (1), economy
  (3), on-kill heal (2), fire rate (3) ; then the **GARGOYLE SUPERBOSS-GRID
  BATCH** — 15 more `locked:true` trinkets with no `donationReward`/
  `pendingReward` field (same filter shape as the other superboss-reward
  batches), existing purely to widen `SUPERBOSS_REWARDS`' pool by 15 so the
  grid can grow from 15×20=300 to 15×21=315 once Gargoyle joins `CLASSES`.
  Plain reskins, same idiom as the C-branch batch above, spread across
  several stat channels rather than dumped onto one: movement speed (1),
  flat damage (2), the new Vulnerable-on-hit chance (2, Duskstone Mark/
  Stonefeather Tag), stun-on-hit (1), luck (1), fear-on-hit (1), dodge (2),
  crit chance (1), poison-on-hit (1), fire rate (1), damage+luck (1),
  pickup magnetism (1).
- Additionally, both files carry two very large generated families visible
  only via id prefix rather than a comment marker: `explorationtrophy_*`
  (one per obstacle kind — bombbarrel, pushablebombbarrel, redfire, rock,
  spikedrock, tallrock, tintedrock, the 6 turret variants, yellowfire) and
  `slayertrophy_*` (one per enemy id, including a `slayertrophy_boss_*`
  subset) — these are per-enemy/per-obstacle "defeated/destroyed N of
  these" achievement-reward trinkets, hundreds of entries, all following
  the identical `{id, name, icon, color, locked:true, desc}` shape.

### data/familiars-1.js, familiars-2.js — FAMILIAR_TYPES (381 entries)

`FAMILIAR_TYPES` is declared in `familiars-1.js`; `familiars-2.js` does
`Object.assign(FAMILIAR_TYPES, {...})`. `FAMILIAR_LIST = Object.values(FAMILIAR_TYPES)`
is computed at the end of `familiars-2.js`. Familiars are permanent
companions that follow the player and act on their own every frame (driven
by `familiars.js`, not documented in this file).

**Schema** — common fields on every entry: `id`, `name`, `icon`, `color`,
`locked` (bool — most are locked; a handful of the newest additions per
batch are left unlocked), `behavior` (dispatch key — see below), `desc`.
The remaining fields are **behavior-specific**:

| `behavior` | fields | meaning |
|---|---|---|
| `orbiter` | `dmg`, `radius`, `orbitSpeed`, `contactCooldown`, optional `freezeChance` | circles the player, damages on contact |
| `shooter` | `dmg`, `cooldown`, `boltSpeed` | fires bolts at the nearest enemy periodically |
| `proc` | `procType` (`'heal'`\|`'coin'`\|`'luckpulse'`\|`'charge'`), `interval`, `amount` | passive periodic benefit, no combat |
| `blocker` | `interval`, `maxShields` | periodically restocks a hit-blocking shield, up to `maxShields` stacks |
| `thief` | `dmg`, `radius`, `orbitSpeed`, `contactCooldown`, `stealChance` | orbiter variant that can steal a coin from what it hits |
| `grower` | `dmg`, `radius`, `orbitSpeed`, `contactCooldown`, `killsPerGrowth`, `growthStep`, `maxGrowth` | orbiter that permanently strengthens every N kills this run, up to `maxGrowth`x |
| `detonator` | `dmg`, `interval`, `radius` | drifts beside the player, periodically blasts everything nearby |
| `mirror` | `dmg`, `cooldown`, `boltSpeed`, `range`, `arc` | shooter that fires wherever the player is currently aiming |
| `scavenger` | `interval`, `radius` | periodically auto-collects the nearest loose pickup within `radius` |
| `berserker` | `dmg`, `radius`, `orbitSpeed`, `contactCooldown`, `berserkPower` | orbiter whose damage scales up as the player's health drops |
| `swarmer` | `dmg`, `interval`, `orbCount`, `orbLife`, `orbRadius`, `orbSpeed`, `contactCooldown` | periodically buds off several short-lived mini-orbiters |

**Example entries:**
```js
dustmite: { id:'dustmite', name:'Dust Mite', icon:'🐛', color:'#8a7a5a', locked:true, behavior:'orbiter',
  dmg:1, radius:40, orbitSpeed:3.2, contactCooldown:0.45, desc:'A tiny orbiting familiar that bites anything that gets close.' },

healingsprite:{ id:'healingsprite', name:'Healing Sprite', icon:'💗', color:'#e35b6a', locked:true, behavior:'proc',
  procType:'heal', interval:50, amount:0.5, desc:'Every so often, mends half a heart.' },

fusegremlin: { id:'fusegremlin', name:'Fuse Gremlin', icon:'🧨', color:'#e05a3a', locked:true, behavior:'detonator',
  dmg:2, interval:6, radius:70, desc:'Drifts beside you and detonates every few seconds, hurting nearby enemies.' },
```

**Batches/history:**
- `familiars-1.js`: orbiters (7) ; shooters (7) ; procs (5, no combat) ;
  4 new SUPERBOSS REWARDS ; SUPERMASSIVE UPDATE BATCH (100 new — mostly
  more orbiters/shooters/procs, no new behaviors) ; 21 new SUPERBOSS
  REWARDS (the other half of an 81-reward expansion split across trinkets
  and familiars — these 21 needed listing in `NEW_CLASS_REWARD_FAMILIARS`,
  unlike the trinket half) ; then a further orbiters (14) / shooters (13) /
  procs (13) block.
- `familiars-2.js`: continuation of shooters/procs (unmarked, top of file),
  then the batch that introduced the newer behaviors as named sections:
  blockers, thieves, growers, detonators, mirrors, scavengers, berserkers,
  swarmers (4 entries each).

### data/lists.js — derived ITEMS lists

Three one-line derived constants, computed once `ITEMS` is fully assembled:
`ITEM_LIST = Object.values(ITEMS)`, `PASSIVE_ITEMS = ITEM_LIST.filter(i =>
i.type === 'passive')`, `ACTIVE_ITEMS = ITEM_LIST.filter(i => i.type ===
'active')`. No functions.

### data/pickups.js — coins, generic pickup pool, pills

**`COIN_TYPES`** — weighted array for ordinary coin drops: `{id, value, w
(spawn weight), color, radius, luck? }`. Four entries: penny (1c, w:78),
nickel (5c, w:15), dime (10c, w:6), luckypenny (1c + `luck:1`, w:1).

**`LARGEPENNY_COIN_WEIGHTS`** — a separate, nerfed weight table used only
by the Large Penny item's own coin roll (mostly penny, rarely better).

**`PICKUP_POOL`** — weighted `{kind, w}` pool for the generic "random
pickup" spawner category (room-clear reward, chest contents, room-editor
"random" pickups): coin(55), bomb(20), key(20), heartRed(15),
heartBlue(7), halfheartRed(16), halfheartBlue(8), doubleheart(5),
eternalheart(2), pill(4), star(4).

**`PILL_COLORS`** — array of `{id, name, color, locked?}`. 60 unlocked
swatches (10 original + 50 "expanded palette", purely cosmetic) followed by
40 `locked:true` swatches gated the same way as locked items/trinkets
(gameplay tied to a pill *color* is randomized once per run — see
`PILL_COLORS_BY_ID`, an id-keyed lookup built from the array, and
`game.js`'s `startRun`, which draws one random `PILL_EFFECT_LIST` entry per
color into `game.pillEffectMap` — so a color's real effect is not fixed
data, it's rolled fresh each run). Gated out of spawn rolls by
`room.js`'s `rollRandomPillColorId()`.

**`PILL_EFFECTS`** — object keyed by effect id, each `{id, name, desc,
good (bool — only picks the toast sound in `pills.js`)}`: fullhealth,
speedup/speeddown, damageup/damagedown, luckup/luckdown, rangeup/rangedown,
tearsup/tearsdown, chargeup, heartup, hpdown, hpup, mystery (applies one
random positive + one random negative effect, marked `good:true` anyway
since it does hand a real upgrade). `PILL_EFFECT_LIST = Object.values(PILL_EFFECTS)`.

No functions in this file.

### data/collectibles.js — STAR_TYPES, BOMB_TIER_POOL/KEY_TIER_POOL, OBSTACLES

**`STAR_TYPES`** — object keyed by star id, each `{id, name, icon, color,
locked?, desc}`. Stars are named one-shot consumables held in their own
pocket slot (`player.starPocket`, used with R — see `stars.js`), unlike a
pill their effect is always shown up front. Groups, in file order: the
original 8 (named after the Pleiades — alcyone, atlas, electra, maia,
merope, taygeta, pleione, celaeno), 4 new SUPERBOSS REWARDS (antares,
polaris, achernar, vega — named from elsewhere in the sky, one per new
character), then 25 more (gameplay update 3, all `locked:true`, unlocked
one-for-one by the "Stars" achievement category): six requested effects
(deneb, altair, capella, bellatrix, arcturus, aldebaran), the Big Dipper
(merak, alkaid, dubhe, phecda, megrez, mizar), Orion's belt/shoulders
(alnitak, alnilam, mintaka, saiph, rigel, betelgeuse, sirius), "the rest of
the sky" (procyon, castor, pollux, regulus, spica, antlia), and 11
room-teleport "compass" stars, one per special room type
(`teleport_treasure`, `_shop`, `_secret`, `_petshop`, `_curse`,
`_sacrifice`, `_vault`, `_challenge`, `_crystal`, `_sombra`, `_star`).
`STAR_LIST = Object.values(STAR_TYPES)`. **Phase 7a** appends 25 more locked stars as reward-grid supply (see `SUPERBOSS_REWARDS`); unlike the achievement-locked "Stars" category batch these ARE grid rewards, and each drives a genuinely new `case` in `stars.js`'s `applyStarEffect` (room-wide poison/stun/Vulnerable/charm, a percentage HP cut, a strongest-enemy execute mirroring Rigel's weakest, an exhaustive pedestal reroll, a two-pedestal spawn, and an all-in damage buff that costs you every red heart but one) built from primitives that already existed in that file.

**`BOMB_TIER_POOL`** / **`KEY_TIER_POOL`** — weighted `{id, w, locked?}`
re-roll tables: `bomb`(90)/`doublebomb`(8, locked)/`goldbomb`(2, locked),
and the key equivalents. Used by `room.js`'s `rollGenericPickupKind()`
whenever a *generic* bomb/key pickup resolves, so a plain drop occasionally
comes out as a better tier. Hand-placed/forced pickups (room editor) skip
this re-roll on purpose.

**`OBSTACLES`** — object keyed by obstacle id, the schema is the most
varied of any table in this file since it's a grab-bag of unrelated
mechanics sharing one object. Common fields: `id`, `name`, `desc`, `color`,
`dark` (shadowed/variant render color). Flag fields (all optional, default
falsy):
- `destructible` — bombable.
- `blocksFlight` + `tall` — tall variants also block flying classes
  (plain rock/hardrock/pit are flyable-over).
- `isPit` — bottomless gap.
- `walkable` — never blocks movement/pathing/line-of-sight/projectiles;
  tiles it sits on still count as free for spawns. Independent of `hazard`.
- `hazard` + `dmg` — non-solid, deals contact damage (cactus, fire
  variants, spikes).
- `attackable` + `maxHp` — can be destroyed by ordinary hits (not just
  bombs); yellow/red fire are attackable, blue/purple fire explicitly are
  not (`attackable:false`) and can only be put out by a bomb blast.
- `heartDropChance` — chance an attackable hazard drops a heart when
  destroyed.
- `projectile` + `fireCooldown` (+ `angles` array or `targeting:true`, +
  `boltColor`) — obstacle fires bolts; `homing` (purplefire, value 2) bends
  its bolts toward the player in flight.
- `sacrifice` — Sacrifice Room centerpiece spike; per-hit reward table
  lives in `combat.js`'s `triggerSacrificeSpike`.
- `solid` — blocks movement like a rock even though it's also a `hazard`
  (spikedrock).
- `moving` — patrols the perimeter of the wall/rock patch it starts beside.
- `freeze` + `freezeDuration` — freezes the player briefly on contact
  instead of dealing damage (sandtrap); driven off `freeze`, not `hazard`.
- `current` + `pushX`/`pushY` — walkable current tiles that constantly push
  the player; C-branch exclusive (`dungeon.js`'s `obstacleAllowedOnFloor`
  refuses these outside `floorPath === 'C'`).
- `explodesOnDestroy` (+ `pushable`) — Bomb Barrels: not destructible by
  touch/melee, only 3 ranged/attackable hits or a nearby blast destroys
  and detonates it, chaining into anything else caught in the blast.

Notable named groups within `OBSTACLES`: plain rock/hardrock/pit and their
tall variants; the fire hazards (cactus, yellow/red/blue/purple fire);
sacrifice spike + plain spike trap + spiked rock; tinted rock (a rare rock
reskin with a better bomb-reward table); moving spike; sand trap; mud;
4 directional currents (C-branch only); 6 turret variants
(turretn/e/s/w/plus/x/target — all `destructible:true`, fire every second
at infinite range); 2 bomb barrel variants; and, Phase 3 overhaul, 2 more:
- **`thornbush`** — same shape as blue/purple fire: `hazard:true,
  attackable:false, destructible:true, dmg:1, heartDropChance:0.10` — attacks
  do nothing, only a bomb blast clears it. Gated to Whitetail Forest only
  (`dungeon.js`'s `obstacleAllowedOnFloor`: `floorPath !== 'C' && (floorNum
  === 2 || floorNum === 3)`). Drawn as a round spiny bush (`Util.drawObstacle`
  in `core/utils-1.js`).
- **`luckcrystal`** — a rock reskin like `tintedrock`, `destructible:true`,
  no other flags. **No** `obstacleAllowedOnFloor` gate — usable on any floor,
  since it's a decorative/reward fixture, not a themed hazard. Destroying it
  (bomb blast, `combat.js`'s `explodeAt`/`destroyAllObstacles`) reuses
  `tintedrock`'s exact reward-hook `else if (ob.kind === ...)` branch shape,
  just rolling a luck-flavored table instead: 70% two scattered coins, 25% a
  guaranteed Luckypenny, 5% a free `ITEMS.luckup` pedestal — deliberately
  bounded, a bonus rather than a jackpot. Drawn as a 3-facet crystal cluster
  (`Util.drawObstacle`).

No functions besides the implicit lookups other systems perform against
these tables.

### data/economy.js — shop prices, chests, room-clear reward tables, bestiary lists

**`SHOP_ITEM_PRICE`** (16), **`SHOP_TRINKET_PRICE`** (9),
**`SHOP_FAMILIAR_PRICE`** (12) — flat base prices before any discount
trinkets/items apply, read by `shop.js`'s `shopPrice()`.

**`SHOP_PICKUP_PRICES`** — array of `{kind, price}` for what pickup kinds a
shop slot *can* stock (heartRed 3, heartBlue 6, bomb 5, key 5, pill 5,
star 7, sack 8, battery 9). The comment notes these `price` fields are
vestigial/informational only — `room.js`'s `addShopSlot` reads `kind` from
here but always prices the slot through `shop.js`'s real `shopPrice()`.

**`CHEST_TYPES`** — object keyed by chest id: `{id, name, requires
('bomb'|'key'|'none'|'hearts'), heartCost? (cursed chest, 2), color, dark,
lidColor, itemChance (odds the chest's contents include an item, scales
with what the chest costs to open)}`. Six kinds: stone (bomb-opened),
gold (key-opened), grey (free, itemChance 0), cursed (2 hearts,
itemChance 0.16 — highest), eternal (key, 50% chance to stay re-openable),
wood (free, itemChance 1.0 but contents restricted to pill/star + a forced
bonus trinket roll — see `combat.js`'s `openChestContents`).

**`CHEST_TYPE_POOL`** — weighted pool for randomly picking a chest kind:
grey(40), gold(20), stone(20), cursed(10), eternal(5), wood(5).

**Room-clear reward tables** (rolled once per cleared non-boss room, see
`room.js`'s `spawnClearRoomPickup`): **`CLEAR_REWARD_CHANCE`** = top-tier
split summing to 1.0 — `nothing:0.15, common:0.65, rare:0.15,
legendary:0.05` (Fortune Shell shifts some `nothing` into `legendary`).
Then, per tier: **`COMMON_CATEGORY_POOL`** (penny/heart/bomb/key, 25 each)
→ **`COMMON_PENNY_POOL`** (penny 85, nickel 7, cursedpenny 5, dime 2,
luckypenny 1) or **`COMMON_HEART_POOL`** (heartRed 50, heartBlue 25,
halfheartRed 10, halfheartBlue 10, doubleheart 3, eternalheart 1,
goldheart 1) — bomb/key reuse `BOMB_TIER_POOL`/`KEY_TIER_POOL` from
`collectibles.js`. **`RARE_POOL`** — pill(45), star(20), sack(20),
battery(15). **`LEGENDARY_POOL`** — chest(50, rolled against
`CHEST_TYPE_POOL`), trinket(48), familiar(2).

**Bestiary metadata lists** — flat `{id, name, icon, desc}` arrays shaped
to match `STAR_LIST`/`TRINKET_LIST` so `bestiary.js`'s generic
`renderBestiarySimple` can render them (pills/stars have their own tabs and
aren't duplicated here): **`PICKUP_TYPE_LIST`** (every coin/heart/bomb/key
variant plus sack/battery/minibattery — 21 entries) and
**`ROOM_TYPE_LIST`** (17 entries — normal, start, boss, treasure, shop,
secret, petshop, curse, sacrifice, vault, challenge, crystal, sombra,
star, cpathgate/"Storm Drain", planetarium/"Planetarium" (Phase 7a — the
D-branch gate, Floor 3 only), shrine, and — Phase 4 overhaul —
arcade/"🎰", coin-toll gated, fed by fillies and machines).

No functions.

### data/stages.js — floor themes and the branch/C-path palette system

**`STAGES`** — array of 4 theme objects `{id, name, palette:{floorA,
floorB, wall, voidC, doorOpen, doorLocked, grout, accent}}` covering the
normal run's first 8 floors two-at-a-time: crypt, forest, desert, inferno.

**`STAGE_LIST`** — bestiary-shaped `{id, name, icon, desc}` list: the 4
`STAGES` entries, the branch pairs 9a/9b through 12a/12b, the three linear
late floors `13`/`14`/`15` (Phase 7a — "The Hollow Chorus", "The Final
Waveform", and "The One True Descent", which moved from floor 13 to 15),
the 4 C-branch regions (gutters, sewers, rainforest, and Phase 7a's
mangroves), and the 3 D-branch regions (observatory, orrery, voidbetween).

**`FLOORS_PER_STAGE`** (=2), **`BASE_MAX_FLOORS`** (=6 — run length before
Polish DNB has ever been beaten), **`FLOOR_NAMES`** (array of 15 display
names, one per floor index), **`MAX_FLOORS`** = `FLOOR_NAMES.length` (15 —
absolute ceiling; floors 9-12, index 8-11, are A/B branches; floors 13 and
14, index 12/13, are Phase 7a's two new LINEAR stages, each with a single
superboss in the same shape floorNum 5/7 already use; floor 15, index 14,
is the finale). Note `MAX_FLOORS` is display-only and is never a runtime
gate — `descend()`'s hardcoded per-floorNum chain is what actually advances
the extended path past `maxFloorsThisRun`.

**The C-branch** — a whole alternate run entered from a gate room that only
generates on floor 2 (floorNum 1). Taking it sets `game.floorPath = 'C'`
permanently and restarts the descent at floorNum 2, relabeled "3C" — it
does NOT rejoin the normal path; killing Kirk DNB on 12C (floorNum 11) is a
second, separate win condition. Because floorNum 2-11 means two different
things depending on `floorPath`, every floorNum-sensitive function must
check `floorPath === 'C'` first and never fall through: **`C_FLOOR_NAMES`**
(object keyed by floorNum 2-11, NOT a dense array), **`C_LAST_FLOORNUM`**
(=11 as of Phase 7a — was 9; two new floors, 10C/11C, were inserted and
Kirk relocated unchanged from 10C to 12C), **`C_FLOOR_KEYS`**
(floorNum→branch-key map, e.g. `2:'3C'` … `11:'12C'`).

**The D-branch** *(Phase 7a)* — the second alternate run, a structural
mirror of the C-branch entered from a `planetarium` gate room that only
generates on floor 3 (floorNum 2). Taking it sets `game.floorPath = 'D'`
permanently and restarts the descent at floorNum 3, relabeled "4D"; killing
the superboss on 10D (floorNum 9) is a third, separate win condition. Its
floorNum 3-9 collide with BOTH the normal path's and the C-branch's meaning
for those numbers, so the same "check the path FIRST, never fall through"
rule applies: **`D_FLOOR_NAMES`** (object keyed by floorNum 3-9, NOT a dense
array — three regions: Observatory 3-4, Orrery 5-6, The Void Between 7-9),
**`D_LAST_FLOORNUM`** (=9), **`D_FLOOR_KEYS`** (floorNum→branch-key map,
`3:'4D'` … `9:'10D'`).

**Functions:**
- `floorLabelFor(floorNum, floorPath)` — UI label: `"7"` on a normal run,
  `"7C"` on the C-branch, `"7D"` on the D-branch (both HUD and death/win
  summaries call it with `floorNum + 1`).
- `floorNameFor(floorNum, floorPath)` — looks up `C_FLOOR_NAMES`,
  `D_FLOOR_NAMES` or `FLOOR_NAMES` depending on path.
- `stageIndexForFloor(floorNum)` — `min(STAGES.length-1, floor(floorNum /
  FLOORS_PER_STAGE))`.
- `floorKeyFor(floorNum, branch, floorPath)` — the branch-aware key used to
  pick enemy/boss rosters (`enemies.js`) and palettes: checks `floorPath
  === 'C'` first (returns `C_FLOOR_KEYS[floorNum]`), then `floorPath === 'D'`
  (returns `D_FLOOR_KEYS[floorNum]`), otherwise maps floorNum 8-11 to
  `'9A'/'9B'` … `'12A'/'12B'` based on `branch`, and floorNum 12/13/14 to
  `'13'`/`'14'`/`'15'` (no split — the branch has converged), else `null`
  (use the normal stage pool). The rosters behind Phase 7a's new keys
  (`'11C'`, `'12C'`, `'4D'`-`'10D'`, `'13'`-`'15'`) are a later phase; until
  they exist those pools are empty, which room.js's
  `resolveGenericEnemy`/`resolveGenericBoss` already handle by falling back
  to the stage pool and then to any unlocked enemy.
- `cPaletteFor(floorNum)` — floorNum ≤3 → gutters, ≤5 → sewers, ≤9 →
  rainforest, else → mangroves (Phase 7a's 11C/12C region).
- `dPaletteFor(floorNum)` *(Phase 7a)* — the D-branch mirror: floorNum ≤4 →
  observatory, ≤6 → orrery, else → voidbetween.

**Branch palette objects** (all flat `{floorA, floorB, wall, voidC,
doorOpen, doorLocked, grout, accent}` records, `{A,B}`-paired except where
noted): `BRANCH_PALETTES` (floor index 8, 9A "dark and cloudy" vs 9B "blue
and white and brick"), `BRANCH_PALETTES_10` (floorNum 9, 10A icy tundra vs
10B jungle), `BRANCH_PALETTES_11` (floorNum 10, 11A cold/pressurised vs
11B sickly bioluminescent), `BRANCH_PALETTES_12` (floorNum 11, 12A
fractured violet vs 12B raw crimson) — each pair deliberately gets darker/
more saturated deeper in, A staying cold/violet and B staying warm/organic.
`C_PALETTES` — flat (no A/B split, since `floorBranch` is never set on a C
run) object keyed `gutters`/`sewers`/`rainforest`/`mangroves` (the last
added in Phase 7a for 11C/12C). **`D_PALETTES`** *(Phase 7a)* — the same
flat shape, keyed `observatory`/`orrery`/`voidbetween`; all three
deliberately depart from every other palette's pure-black `voidC` in favour
of a very dark navy, because the Planetarium paints a starfield where walls
and void normally go and a near-black blue reads as sky where pure black
reads as a hole. **`HOLLOW_CHORUS_PALETTE`** / **`FINAL_WAVEFORM_PALETTE`**
*(Phase 7a)* — flat palettes for the two new linear main-route floors 13/14
(floorNum 12/13); without them `currentPalette` would fall through to
`STAGES[stageIndexForFloor(12)]`, which clamps to the Inferno.
`FINAL_PALETTE` — a single flat palette for floor 15 (floorNum 14),
branch-independent (near-black stone, one blazing gold accent), used
regardless of which branch the run took to get there.


---

<a id="part-3"></a>

# Part 3 — data/enemies/ and data/roomTemplates/

## data/enemies/ and data/roomTemplates/ — enemy/boss/superboss definitions and the room-template format

This part covers the two biggest pure-data corners of the codebase: the enemy/boss/superboss
tables (`js/data/enemies/*`) and the hand-authored room layouts (`js/data/roomTemplates/*`).
Both were mechanically split out of former monoliths (`enemies.js`, `roomTemplates.js`); file
boundaries (`types-1.js`..`types-4.js`, `normal-1.js`..`normal-4.js`) do not mean anything
semantically — `ENEMY_TYPES` is one object literal continued across 4 files via
`Object.assign(ENEMY_TYPES, {...})`, and `ROOM_TEMPLATES.normal` is one array continued across
4 files via `ROOM_TEMPLATES.normal.push(...)`. Both are treated below as single logical units.

### js/data/enemies/growth.js — depth/HP/damage scaling curves

95 lines, all comment-preamble and four tiny functions. This is where a table entry's authored
`hp`/`dmg` numbers (which are pure *identity* — "how tough is this relative to every other
enemy in the game", the same at any depth) turn into a live entity's actual numbers on floor N.
The header comment explains the design intent at length: the growth is **multiplicative**, not
additive, specifically so that two enemies' HP ratio stays constant across the whole run (a
Mosshide, identity 9, always has 3x a Grave Grub's identity-3 HP no matter what floor). The old
(pre-rewrite) formula added a flat per-floor HP amount, which squashed ratios toward 1:1 by
late game — that old constant is explicitly *not* recorded anywhere in this file (the comment
says so) because it's not recoverable from history.

- **`enemyHpScale(floorNum)`** — `Math.pow(ENEMY_HP_GROWTH, floorNum || 0)`, where
  `ENEMY_HP_GROWTH = 1.20` (regular/trash enemies; comment notes it was retuned down from an
  earlier 1.32 in a "make it easier" rebalance pass — trash HP growth is deliberately the
  gentlest curve in the file). Rounding is deliberate: final max HP is always a whole number
  (integers read better on an HP bar and against `hp <= 0`), but *incoming damage* stays
  fractional.
- **`bossHpScale(floorNum)`** — `Math.pow(BOSS_HP_GROWTH, floorNum || 0)`, where
  `BOSS_HP_GROWTH = 1.36`. Deliberately outpaces trash growth (comment: was 1.28, then raised)
  so bosses are the run's real difficulty spike rather than just a bigger trash mob.
- **`bossDmgScale(floorNum)`** — `Math.pow(BOSS_DMG_GROWTH, floorNum || 0)`, where
  `BOSS_DMG_GROWTH = 1.06`. Boss damage used to not scale with floor *at all* (only
  `bossHpScale` did) — this is a new, deliberately gentle curve (hearts are the most punishing
  resource to scale) added so a floor-12 boss actually hits harder than a floor-1 boss:
  `1.06^12` ≈ 2x by the last normal-path floor.
- **`explosionDamage(floorNum)`** — `Math.max(1, Math.round(4 * bossHpScale(floorNum)))`. Any
  player-side damage that isn't the player's own weapon stat (bomb blasts etc.) has to scale or
  it silently becomes irrelevant late-game; rides the gentler boss curve, not the trash curve.
- **`statusTickDamage(floorNum)`** — `Math.max(1, Math.round(0.6 * bossHpScale(floorNum)))`.
  Used for poison ticks and Spiked Barding contact damage — same reasoning as above.

Callers (grepped across `js/`):
- `enemyHpScale` / `bossHpScale` — read only by `entities/entities.js`'s `Enemy` and `Boss`
  constructors respectively (the sole place authored `hp` becomes live max HP).
- `bossDmgScale` — read by `entities/entities.js`'s `Boss` constructor to scale `dmg`.
- `explosionDamage` — called from `systems/combat-*.js` wherever a bomb/blast computes its
  damage.
- `statusTickDamage` — called from `systems/combat-3.js`'s `updateStatusEffects` (poison ticks)
  and from the enemy-contact-damage path in `systems/combat-3.js`'s `updateEnemy` (Spiked
  Barding reflect damage).

`dmg:` on an enemy/boss table entry is explicitly **not** touched by growth.js — floor scaling
for incoming enemy damage is applied separately in `combat.js`'s `playerDamageAmount`, so "the
whole damage curve lives in one place" per the file's own comment.

### js/data/enemies/types-1.js .. types-4.js — `ENEMY_TYPES` (693 entries, one logical object)

`types-1.js` declares `const ENEMY_TYPES = { ... }`; `types-2.js`/`types-3.js`/`types-4.js` each
continue it with `Object.assign(ENEMY_TYPES, { ... })`. Treat all four as one big object keyed
by enemy id.

#### Full field schema

Every entry has an id/name/hp/dmg/speed/radius/color/dark core, then a `behavior` string plus
whatever fields that behavior's AI function reads:

| field | meaning |
|---|---|
| `id` | key repeated as a string field (matches the object key) |
| `name` | display name, always `"DNB <Something>"` for regular enemies |
| `hp` | identity-scale HP (see growth.js above) — NOT the live max HP |
| `dmg` | half-hearts of contact damage, NOT floor-scaled here |
| `speed` | px/sec base move speed; `0` for stationary types (turret/teleporter-while-idle) |
| `radius` | collision/hitbox radius in px |
| `color` / `dark` | light-mode and dark-mode render colors |
| `behavior` | dispatch key — see the AI table below |
| `contactCooldown` | (chaser/shielded) seconds between repeat contact-damage ticks |
| `xpTier` | 1 or 2 — gates it into a stage's floor-1 pool (tier 1) vs needing `floorInStage>=1` (tier 2); see `resolveGenericEnemy` below. Only used on `stage`-based (0-3) pools — floorKey pools carry no xpTier "by design" per repeated in-file comments |
| `stage` | 0=Crypt, 1=Forest, 2=Desert, 3=Inferno — which of the 4 main-path stages' random pool this belongs to |
| `floorKey` | alternative to `stage` for floors that don't fit the "2 floors per stage" model: branch floors (`'9A'`/`'9B'`/`'10A'`/`'10B'`/`'11A'`/`'11B'`/`'12A'`/`'12B'`/`'13'`/`'14'`) and the whole C-branch (`'3C'`..`'10C'`). An entry has `stage` XOR `floorKey`, never both, never neither (except `swarmerdnb`, see below) |
| `locked` | `true` for achievement-gated entries (roughly 60 of them, all added at the tail of types-4.js) — excluded from every spawn pool until unlocked (`isEnemyUnlocked`) |
| `isMinion` | excludes the entry from `resolveGenericEnemy`'s random pools entirely (used for `sprout`, `swarmerdnb`, etc. — things only ever spawned by name, via `splitInto`/`summonId`/forced room spawners) |
| `weight` | optional; base weight in the per-room FEATURED bias roll (`room.js`'s `pickBiasedEnemy`); default 1. A few sniper/teleporter/shielder-type entries set it to `0.6` to appear less often as the "featured" species of a room |
| `flies` | true for airborne types (affects things like pit/obstacle interaction elsewhere) |
| behavior-specific fields | see below |

Per-behavior tuning fields actually read by the AI functions (from `systems/ai-1.js`/`ai-2.js`):
`keepDistance`/`fireCooldown`/`boltSpeed`/`boltColor`/`boltRadius`/`shotCount`/`spreadAngle`
(ranged/turret/sniper/lobber-adjacent), `chargeCooldown`/`chargeSpeed`/`telegraphTime`
(charger/ambusher), `shieldTime`/`vulnTime` (shielded), `leapCooldown`/`leapSpeed` (leaper),
`orbitRadius`/`orbitSpeed`/`fireRange` (orbiter), `burrowCooldown`/`burrowTime` (burrower),
`summonId`/`summonCount`/`summonCooldown`/`maxSummons` (summoner), `healAmount`/`healCooldown`/
`healRadius` (healer), `driftAmount` (swarm), `triggerRange`/`dashDuration` (ambusher),
`blinkCooldown`/`blinkRange` (teleporter), `shieldRadius`/`shieldGrantTime` (shielder),
`lobRange`/`lobTime`/`burstRadius` (lobber), `weaveAmplitude`/`weaveFrequency` (weaver),
`sentryThreshold` (sentry), `splitInto` (splitter — id of the enemy it spawns on death),
`engageRange`/`retreatRange`/`dashSpeed` (skirmisher, Phase 2 — plus the shared
`fireCooldown`/`boltSpeed`/`boltColor`/`boltRadius` group above), `whipRange`/`whipCooldown`/
`whipTelegraph`/`whipDamageMult` (whiplash, Phase 2).

#### `behavior` → AI function dispatch

`systems/combat-3.js`'s `updateEnemy` runs a `switch (e.behavior)` that calls the matching
`aiXxx(game, e, dt)` function (all defined in `systems/ai-1.js`/`ai-2.js`):

```
chaser, shielded  -> aiChase        ranged     -> aiRanged      flyer    -> aiFlyer
bomber             -> aiBomber       charger    -> aiCharger     turret   -> aiTurret
leaper              -> aiLeaper       splitter   -> aiChase (moves like a chaser; splits on death — see combat.js handleEnemyDeath)
orbiter              -> aiOrbiter      burrower   -> aiBurrower   summoner -> aiSummoner
healer                -> aiHealer      sniper     -> aiSniper     swarm    -> aiSwarm
ambusher                -> aiAmbusher   teleporter -> aiTeleporter shielder -> aiShielder
lobber                    -> aiLobber    weaver     -> aiWeaver    sentry   -> aiSentry
```
Any unrecognized `behavior` string falls back to `aiChase` with a one-time `console.warn`.
Before this switch runs, `updateEnemy` special-cases status effects: frozen enemies don't act at
all, stunned enemies run `aiWander`, charmed enemies run `aiCharmed`, feared enemies run
`aiFeared` — these override whatever `behavior` says.

`'shielded'` is special: it also gets its own always-on shield-cycle tick (independent of the
AI switch) in `updateEnemy` — alternates `e.shielded` on a `shieldTime`/`vulnTime` timer read
straight off `e.type`.

`'splitter'` behaves exactly like a chaser during life; the split itself happens in
`systems/combat-2.js`'s death handling (`enemy.behavior === 'splitter' && !enemy.splitDone &&
enemy.type.splitInto`), spawning a `splitInto`-named enemy.

#### `stage` vs `floorKey`

`stage`-based entries belong to a floor per `FLOORS_PER_STAGE = 2` (`data/stages.js`):
`stageIndexForFloor(floorNum) = min(STAGES.length-1, floor(floorNum/2))`. `floorKey`-based
entries exist because several floors don't fit that "2 floors per stage" pattern at all —
branch forks (floorNum 8 → `'9A'`/`'9B'` by `game.floorBranch`, 9→`'10A'`/`'10B'`, 10→`'11A'`/
`'11B'`, 11→`'12A'`/`'12B'`, 12→`'13'` for both branches) and the entirely separate C-branch
path (`floorPath === 'C'`, floors re-using floorNum 2-9 as keys `'3C'`..`'10C'` via a
`C_FLOOR_KEYS` lookup) — see `data/stages.js`'s `floorKeyFor(floorNum, branch, floorPath)`.

Enemy/boss selection, in `systems/room.js`'s `resolveGenericEnemy`/`resolveGenericBoss`:
1. Compute `floorKey = floorKeyFor(...)`. If non-null, filter `ENEMY_LIST`/`BOSS_LIST` to that
   `floorKey` (enemies also exclude `isMinion`) — if that pool is non-empty, pick from it and
   stop.
2. Otherwise (or if the floorKey pool was empty) fall through to the `stage`-based pool:
   `stage === stageIndexForFloor(floorNum)`, additionally filtered by `xpTier <= 1 +
   floorInStage` (tier-1 enemies available immediately, tier-2 only once past the stage's first
   floor) — if that's empty, drop the xpTier filter; if still empty, fall back to every
   unlocked enemy of any stage (documented in-code as the historical Inferno bug where an empty
   stage-3 pool silently mixed in Crypt/Forest/Desert enemies — stage 3 now has its own full
   roster so this path is effectively dead for enemies, but the fallback chain remains).
3. `avail(e) = !e.locked || isEnemyUnlocked(e.id)` is applied at every step.

`swarmerdnb` (bottom of types-4.js) is the one entry with **neither** `stage` nor `floorKey` —
it's `isMinion:true` and only ever spawned explicitly by `dungeon.js`'s forced-swarm room logic
(`room.forceSwarm`), never through the generic pool.

Per-room "featured" bias: `room.js`'s `pickBiasedEnemy`/`rollRoomEnemyBias` picks 1-2 types out
of whatever pool `resolveGenericEnemy` computed and gives them `ROOM_FEATURED_WEIGHT = 12`x the
normal `weight`, so most rooms read as "the spider room" rather than a random smear — this is
computed lazily per room and reset each `populateRoom` call.

#### Example entries (verbatim)

```js
gravegrub: { id:'gravegrub', name:'DNB Grave Grub', hp:3, dmg:1, speed:70, radius:11, color:'#8a5a3b', dark:'#5c3a22',
  behavior:'chaser', contactCooldown:0.8, xpTier:1, stage:0 },

bonecaller: { id:'bonecaller', name:'DNB Bone Caller', hp:4, dmg:1, speed:55, radius:11, color:'#b0a48c', dark:'#63594a',
  behavior:'summoner', summonId:'swarmerdnb', summonCount:2, summonCooldown:6.5, maxSummons:6, keepDistance:200, xpTier:2, stage:0 },

shadowcreeper: { id:'shadowcreeper', name:'DNB Shadowcreeper', hp:3, dmg:1, speed:120, radius:11, color:'#3a3555', dark:'#1c1a2c',
  behavior:'chaser', contactCooldown:0.45, floorKey:'9A' },

swarmerdnb: { id:'swarmerdnb', name:'DNB Swarmer', hp:1, dmg:1, speed:135, radius:8, color:'#a8955a', dark:'#5c4e2c',
  behavior:'chaser', contactCooldown:0.45, xpTier:1, isMinion:true },
```

The 4 files are a straight linear archive of content additions, marked with `/* =====
GAMEPLAY UPDATE 2 — CONTENT BATCH A/B/C/D — BEGIN/END ===== */` comment blocks: batch A adds 20
enemies to Crypt+Forest, B adds 20 to Desert+Inferno, C adds 40 across the four floorNum-8/9
branch pools, D adds 40 across the four deepest branch pools (11A/11B/12A/12B). types-3.js is
almost entirely the C-branch content (floorKeys `'3C'`..`'10C'`, the "Gutters"/"Sewers"/
"Rainforest" themed floors), and types-4.js's first ~170 lines are all `locked:true`
achievement-unlock enemies grouped by stage/floorKey, ending with the standalone `swarmerdnb`.

**Phase 7b** gives floorKey `'14'` ("The Final Waveform") its first enemy roster — floorKey `'13'`
("The Hollow Chorus") already had a full roster (a mix of unlocked and `locked:true` entries,
12 total) from Phase 7a and is untouched. 4 new entries land in types-4.js right after the
`'13'` block, each picking a `behavior` not already used by `'13'`'s roster (weaver/sentry/
leaper/swarm) — sniper/burrower/ambusher/splitter instead — and stats run ~10-15% above `'13'`'s
baseline (relative scaling only; `growth.js`'s curves handle absolute floor-depth scaling):

| id | name | behavior | hp/dmg/spd/r |
|---|---|---|---|
| `deadaircoda` | DNB Dead Air Coda | `sniper` | 6/3/54/10 |
| `flatlineburrower` | DNB Flatline Burrower | `burrower` | 6/2/70/12 |
| `silencestalker` | DNB Silence Stalker | `ambusher` | 7/3/66/12 |
| `decrescendosplitter` | DNB Decrescendo Splitter | `splitter` (`splitInto:'swarmerdnb'`) | 7/2/88/12 |

Palette is `FINAL_WAVEFORM_PALETTE`'s dark-red family (`#e0604a`), matching floorKey `'13'`'s
existing roster drawing from `HOLLOW_CHORUS_PALETTE`'s cold blue-violet (`#6a7fc9`).

**Phase 7c** extends the C-branch with floorKey `'11C'` ("Mangroves — The Tangled Shallows",
floorNum 10) — brand new, `C_LAST_FLOORNUM` raised to 11 in a prior phase. Its 33-entry roster
lands in types-3.js right after the `'10C'` block, following the exact same "one entry per
generic AI behavior" convention `'9C'`/`'10C'` already use (21 base entries, one per behavior,
plus 12 "extra flavor" entries repeating the same behaviors `'9C'`→`'10C'` also doubled up on:
`chaser`×2 extra, one extra each for `ranged`/`bomber`/`flyer`/`charger`/`lobber`/`burrower`/
`orbiter`/`sentry`/`teleporter`/`shielded`). Stats are each a small step up from the
corresponding `'10C'` entry (same behavior, same relative deltas `'10C'` used over `'9C'` —
relative scaling only; `growth.js`'s curves handle absolute floor-depth scaling). Palette sits
around the `mangroves` stage palette's `accent:'#d8c88a'` (pale salt-bleached) plus dark
wet-root browns/teals, varied per entry the way `'9C'` varies greens:

| id | name | behavior | hp/dmg/spd/r |
|---|---|---|---|
| `rootwraith` | DNB Root Wraith | `chaser` | 9/4/154/11 |
| `saltheron` | DNB Salt Heron | `flyer` | 8/5/138/9 |
| `tidebloat` | DNB Tide Bloat | `bomber` | 9/4/124/11 |
| `brineplate` | DNB Brine Plate | `shielded` | 16/4/50/14 |
| `mudtuskram` | DNB Mudtusk Ram | `charger` | 16/5/72/13 |
| `barnaclespike` | DNB Barnacle Spike | `turret` | 12/4/0/12 |
| `mudskipper` | DNB Mudskipper | `leaper` | 10/4/76/11 |
| `eelspitter` | DNB Eel Spitter | `ranged` | 9/4/68/11 |
| `crabmortar` | DNB Crab Mortar | `lobber` | 12/4/58/13 |
| `mangroveviper` | DNB Mangrove Viper | `weaver` | 11/4/114/12 |
| `tidewatcher` | DNB Tide Watcher | `sentry` | 14/4/44/12 |
| `siltswirl` | DNB Silt Swirl | `orbiter` | 9/5/122/9 |
| `fiddlerborer` | DNB Fiddler Borer | `burrower` | 17/4/76/13 |
| `silthopper` | DNB Silt Hopper | `swarm` | 5/3/162/7 |
| `brinesack` | DNB Brine Sack | `splitter` (`splitInto:'silthopper'`) | 14/4/84/13 |
| `hivewader` | DNB Hive Wader | `summoner` (`summonId:'silthopper'`) | 11/5/66/11 |
| `mangrovemender` | DNB Mangrove Mender | `healer` | 11/3/86/11 |
| `tidewarden` | DNB Tide Warden | `shielder` | 14/4/54/13 |
| `heronmarksman` | DNB Heron Marksman | `sniper` | 10/5/64/10 |
| `brackblink` | DNB Brack Blink | `teleporter` | 10/4/0/11 |
| `crocshade` | DNB Croc Shade | `ambusher` | 13/5/74/12 |
| `mireloper` | DNB Mire Loper | `chaser` (extra, brute) | 23/5/48/17 |
| `tidedasher` | DNB Tide Dasher | `chaser` (extra, fast) | 8/4/166/9 |
| `saltspitter` | DNB Salt Spitter | `ranged` (extra) | 10/4/54/12 |
| `bloatbladder` | DNB Bloat Bladder | `bomber` (extra) | 9/4/134/10 |
| `mangrovebat` | DNB Mangrove Bat | `flyer` (extra) | 8/5/144/9 |
| `siltboar` | DNB Silt Boar | `charger` (extra) | 17/5/62/15 |
| `mudmortar` | DNB Mud Mortar | `lobber` (extra) | 12/4/66/12 |
| `mudlobster` | DNB Mud Lobster | `burrower` (extra) | 16/4/82/12 |
| `duskcircler` | DNB Dusk Circler | `orbiter` (extra) | 10/5/114/10 |
| `rootsentinel` | DNB Root Sentinel | `sentry` (extra) | 14/4/46/12 |
| `brackmist` | DNB Brack Mist | `teleporter` (extra) | 10/4/0/11 |
| `shellbulk` | DNB Shell Bulk | `shielded` (extra) | 20/5/44/15 |

`'11C'` gets **no `BOSS_TYPES` entries** — the C-branch has never had a dedicated per-floorKey
mid-boss (bonus-fight) roster at any floor, branch-wide (unlike the A/B branches and `'13'`/`'14'`
above, which all get one). Every C-branch floor's boss comes exclusively from one `SUPERBOSSES`
entry per region instead — `'11C'`'s is `mangrove` (see superbosses.js below). Future C-branch
phases should preserve this convention rather than adding a `BOSS_TYPES` pool for a C-branch
floorKey.

**Phase 7d** gives the D-branch's first region, The Observatory, its first regular rosters —
floorKeys `'4D'` and `'5D'` (floorNum 3/4) had zero enemy and zero boss entries before this phase.
Both 33-entry rosters land in types-4.js, right after the achievement-locked creature block and
`swarmerdnb`, following the exact same "one entry per generic AI behavior" convention `'9C'`/
`'10C'`/`'11C'` use in types-3.js (21 base entries, one per behavior, plus 12 "extra flavor"
entries doubling up on `chaser`×2, `ranged`, `bomber`, `flyer`, `charger`, `lobber`, `burrower`,
`orbiter`, `sentry`, `teleporter`, `shielded` — the same pattern `'11C'` used over `'10C'`). `'4D'`
is calibrated similar in weight to `'11C'`'s own numbers (same depth tier, different branch), and
`'5D'` steps up ~5-10% from `'4D'` (relative scaling only; `growth.js`'s curves handle absolute
floor-depth scaling). Palette sits around `D_PALETTES.observatory`'s `accent:'#c9b06a'` (tarnished
brass/gold) plus dusty purples/greys pulled from its `floorA:'#2b2733'`/`floorB:'#332e3d'`, varied
per entry the way `'11C'` varies its own accent. Theme: dusty brass telescopes, cracked lens
glass, drifting star-dust, faded constellations — `'5D'` leans slightly further into precision-
instrument/void-rift naming, reading as a small step toward the floor's own superboss, `astrolabe`
(see superbosses.js below):

| id | name | behavior | hp/dmg/spd/r |
|---|---|---|---|
| `lensdrifter` | DNB Lens Drifter | `chaser` | 9/4/150/11 |
| `dustmote` | DNB Dust Mote | `flyer` | 8/4/136/9 |
| `starshard` | DNB Star Shard | `bomber` | 9/4/122/11 |
| `brassbulwark` | DNB Brass Bulwark | `shielded` | 16/4/50/14 |
| `comettusk` | DNB Comet Tusk | `charger` | 16/5/70/13 |
| `spyglassturret` | DNB Spyglass Turret | `turret` | 12/4/0/12 |
| `astralhopper` | DNB Astral Hopper | `leaper` | 10/4/75/11 |
| `novaslinger` | DNB Nova Slinger | `ranged` | 9/4/66/11 |
| `gravitymortar` | DNB Gravity Mortar | `lobber` | 12/4/58/13 |
| `constellationweaver` | DNB Constellation Weaver | `weaver` | 11/4/112/12 |
| `domewatcher` | DNB Dome Watcher | `sentry` | 14/4/44/12 |
| `planetcircler` | DNB Planet Circler | `orbiter` | 9/5/120/9 |
| `dustborer` | DNB Dust Borer | `burrower` | 17/4/76/13 |
| `starmites` | DNB Star Mites | `swarm` | 5/3/162/7 |
| `dustcluster` | DNB Dust Cluster | `splitter` (`splitInto:'starmites'`) | 14/4/84/13 |
| `constellationcaller` | DNB Constellation Caller | `summoner` (`summonId:'starmites'`) | 11/5/66/11 |
| `lensmender` | DNB Lens Mender | `healer` | 11/3/86/11 |
| `brasswarden` | DNB Brass Warden | `shielder` | 14/4/54/13 |
| `telescopemarksman` | DNB Telescope Marksman | `sniper` | 10/5/64/10 |
| `stardriftblink` | DNB Stardrift Blink | `teleporter` | 10/4/0/11 |
| `shadowcomet` | DNB Shadow Comet | `ambusher` | 13/5/74/12 |
| `duststrider` | DNB Dust Strider | `chaser` (extra, brute) | 23/5/48/17 |
| `cometsprinter` | DNB Comet Sprinter | `chaser` (extra, fast) | 8/4/166/9 |
| `glassslinger` | DNB Glass Slinger | `ranged` (extra) | 10/4/54/12 |
| `meteorspark` | DNB Meteor Spark | `bomber` (extra) | 9/4/134/10 |
| `dustmoth` | DNB Dust Moth | `flyer` (extra) | 8/4/144/9 |
| `brassram` | DNB Brass Ram | `charger` (extra) | 17/5/62/15 |
| `stardustmortar` | DNB Stardust Mortar | `lobber` (extra) | 12/4/66/12 |
| `lensborer` | DNB Lens Borer | `burrower` (extra) | 16/4/82/12 |
| `satellitecircler` | DNB Satellite Circler | `orbiter` (extra) | 10/5/114/10 |
| `telescopesentinel` | DNB Telescope Sentinel | `sentry` (extra) | 14/4/46/12 |
| `novablink` | DNB Nova Blink | `teleporter` (extra) | 10/4/0/11 |
| `domebulwark` | DNB Dome Bulwark | `shielded` (extra) | 20/5/44/15 |
| `astrolabestalker` | DNB Astrolabe Stalker | `chaser` | 10/4/156/11 |
| `cometwisp` | DNB Comet Wisp | `flyer` | 9/5/142/9 |
| `quasarshard` | DNB Quasar Shard | `bomber` | 10/4/128/11 |
| `brassaegis` | DNB Brass Aegis | `shielded` | 17/4/50/14 |
| `meteortusk` | DNB Meteor Tusk | `charger` | 17/5/74/13 |
| `opticturret` | DNB Optic Turret | `turret` | 13/4/0/12 |
| `starhopper` | DNB Star Hopper | `leaper` | 11/4/78/11 |
| `gravslinger` | DNB Grav Slinger | `ranged` | 10/4/68/11 |
| `novamortar` | DNB Nova Mortar | `lobber` | 13/4/58/13 |
| `nebulaweaver` | DNB Nebula Weaver | `weaver` | 12/4/116/12 |
| `astrariumwatcher` | DNB Astrarium Watcher | `sentry` | 15/4/44/12 |
| `ringcircler` | DNB Ring Circler | `orbiter` | 10/5/124/9 |
| `gravityborer` | DNB Gravity Borer | `burrower` | 18/4/78/13 |
| `cosmicmites` | DNB Cosmic Mites | `swarm` | 5/3/166/7 |
| `nebulacluster` | DNB Nebula Cluster | `splitter` (`splitInto:'cosmicmites'`) | 15/4/86/13 |
| `astralcaller` | DNB Astral Caller | `summoner` (`summonId:'cosmicmites'`) | 12/5/68/11 |
| `glassmender` | DNB Glass Mender | `healer` | 12/3/88/11 |
| `astrolabewarden` | DNB Astrolabe Warden | `shielder` | 15/4/56/13 |
| `precisionmarksman` | DNB Precision Marksman | `sniper` | 11/5/66/10 |
| `voidblink` | DNB Void Blink | `teleporter` | 11/4/0/11 |
| `eclipsecomet` | DNB Eclipse Comet | `ambusher` | 14/5/76/12 |
| `gravitybrute` | DNB Gravity Brute | `chaser` (extra, brute) | 25/5/50/17 |
| `starstreak` | DNB Star Streak | `chaser` (extra, fast) | 9/4/172/9 |
| `prismslinger` | DNB Prism Slinger | `ranged` (extra) | 11/4/56/12 |
| `fluxshard` | DNB Flux Shard | `bomber` (extra) | 10/4/138/10 |
| `astralmoth` | DNB Astral Moth | `flyer` (extra) | 9/5/150/9 |
| `brassjuggernaut` | DNB Brass Juggernaut | `charger` (extra) | 18/5/64/15 |
| `cometmortar` | DNB Comet Mortar | `lobber` (extra) | 13/4/68/12 |
| `duskborer` | DNB Dusk Borer | `burrower` (extra) | 17/4/86/12 |
| `mooncircler` | DNB Moon Circler | `orbiter` (extra) | 11/5/118/10 |
| `opticsentinel` | DNB Optic Sentinel | `sentry` (extra) | 15/4/48/12 |
| `riftblink` | DNB Rift Blink | `teleporter` (extra) | 11/4/0/11 |
| `astralbulwark` | DNB Astral Bulwark | `shielded` (extra) | 22/5/46/15 |

Rows above the `astrolabestalker` row are `'4D'`; `astrolabestalker` through `astralbulwark` are
`'5D'`. Neither floorKey gets a `BOSS_TYPES` entry — the D-branch follows the same branch-wide
convention as the C-branch: one `SUPERBOSSES` entry per region and no per-floorKey mid-boss pool.
`'5D'`'s superboss is `astrolabe` (see superbosses.js below); `'4D'` has none of its own, feeding
straight into `'5D'`'s.

**Phase 7d**'s second slice gives the D-branch's second region, The Orrery, its first regular
rosters — floorKeys `'6D'` and `'7D'` (floorNum 5/6) had zero enemy and zero boss entries before
this. Both 33-entry rosters land in types-4.js, right after the `'5D'` block, same "one entry per
generic AI behavior" convention (21 base entries plus 12 "extra flavor" entries doubling up on
`chaser`×2, `ranged`, `bomber`, `flyer`, `charger`, `lobber`, `burrower`, `orbiter`, `sentry`,
`teleporter`, `shielded`). `'6D'` steps up from `'5D'`'s own numbers (relative scaling only —
`growth.js`'s curves handle absolute floor-depth), and `'7D'` steps up further from `'6D'`, so the
whole region reads modestly tougher than the Observatory. Palette sits around
`D_PALETTES.orrery`'s `accent:'#e0b45a'` (warm brass) plus deep indigo/blue pulled from its
`floorA:'#232a44'`/`floorB:'#2a3350'`, varied per entry. Theme: polished brass clockwork rings,
turning gears, orbiting mechanisms, deep indigo sky — `'7D'` leans into the mechanism's grander,
apex-most parts (zeniths, apex gearworks, iron-bound rings), a notch closer to the region's
capping superboss, `orrery` (see superbosses.js below):

| id | name | behavior | hp/dmg/spd/r |
|---|---|---|---|
| `gearhound` | DNB Gearhound | `chaser` | 11/4/160/11 |
| `cogmoth` | DNB Cogmoth | `flyer` | 9/5/146/9 |
| `sparkcog` | DNB Spark Cog | `bomber` | 10/4/132/11 |
| `brassplate` | DNB Brass Plate | `shielded` | 18/4/50/14 |
| `ringrammer` | DNB Ring Rammer | `charger` | 18/5/76/14 |
| `meridianturret` | DNB Meridian Turret | `turret` | 14/4/0/12 |
| `cogspring` | DNB Cog Spring | `leaper` | 12/4/80/11 |
| `gearslinger` | DNB Gearslinger | `ranged` | 11/4/70/11 |
| `gyromortar` | DNB Gyro Mortar | `lobber` | 14/4/60/13 |
| `ringweaver` | DNB Ring Weaver | `weaver` | 13/4/120/12 |
| `clockwatcher` | DNB Clock Watcher | `sentry` | 16/4/42/12 |
| `epicycler` | DNB Epicycler | `orbiter` | 11/5/128/9 |
| `gearworm` | DNB Gearworm | `burrower` | 19/4/82/13 |
| `cogmites` | DNB Cog Mites | `swarm` | 6/3/170/7 |
| `geartwin` | DNB Gear Twin | `splitter` (`splitInto:'cogmites'`) | 16/4/88/13 |
| `meridiancaller` | DNB Meridian Caller | `summoner` (`summonId:'cogmites'`) | 13/5/70/11 |
| `gearmender` | DNB Gear Mender | `healer` | 13/3/90/11 |
| `ringwarden` | DNB Ring Warden | `shielder` | 16/4/58/13 |
| `meridianmarksman` | DNB Meridian Marksman | `sniper` | 12/5/64/10 |
| `gearblink` | DNB Gear Blink | `teleporter` | 12/4/0/11 |
| `shadowcog` | DNB Shadow Cog | `ambusher` | 15/5/78/12 |
| `ironhound` | DNB Iron Hound | `chaser` (extra, brute) | 27/5/52/18 |
| `sparkrunner` | DNB Spark Runner | `chaser` (extra, fast) | 10/4/178/9 |
| `cogslinger` | DNB Cog Slinger | `ranged` (extra) | 12/4/58/12 |
| `fusegear` | DNB Fuse Gear | `bomber` (extra) | 11/4/142/10 |
| `ringmoth` | DNB Ring Moth | `flyer` (extra) | 10/5/154/9 |
| `bronzeram` | DNB Bronze Ram | `charger` (extra) | 19/5/66/16 |
| `orbitmortar` | DNB Orbit Mortar | `lobber` (extra) | 14/4/70/13 |
| `cogtunneler` | DNB Cog Tunneler | `burrower` (extra) | 18/4/90/12 |
| `ringsatellite` | DNB Ring Satellite | `orbiter` (extra) | 12/5/122/10 |
| `gearsentinel` | DNB Gear Sentinel | `sentry` (extra) | 16/4/50/12 |
| `cogblink` | DNB Cog Blink | `teleporter` (extra) | 12/4/0/11 |
| `bronzebulwark` | DNB Bronze Bulwark | `shielded` (extra) | 24/5/48/16 |
| `zenithhound` | DNB Zenith Hound | `chaser` | 12/4/164/11 |
| `starcog` | DNB Star Cog | `flyer` | 10/5/150/9 |
| `novagear` | DNB Nova Gear | `bomber` | 11/4/136/11 |
| `ironplate` | DNB Iron Plate | `shielded` | 19/4/52/14 |
| `zenithram` | DNB Zenith Ram | `charger` | 19/5/78/14 |
| `apexturret` | DNB Apex Turret | `turret` | 15/4/0/12 |
| `springcoil` | DNB Spring Coil | `leaper` | 13/4/82/11 |
| `zenithslinger` | DNB Zenith Slinger | `ranged` | 12/4/72/11 |
| `heavygyro` | DNB Heavy Gyro | `lobber` | 15/4/62/13 |
| `braidring` | DNB Braid Ring | `weaver` | 14/4/124/12 |
| `apexwatcher` | DNB Apex Watcher | `sentry` | 17/4/40/12 |
| `grandepicycler` | DNB Grand Epicycler | `orbiter` | 12/5/132/9 |
| `ironworm` | DNB Iron Worm | `burrower` | 20/4/86/13 |
| `meridianmites` | DNB Meridian Mites | `swarm` | 6/3/174/7 |
| `geartriad` | DNB Gear Triad | `splitter` (`splitInto:'meridianmites'`) | 17/4/92/13 |
| `zenithcaller` | DNB Zenith Caller | `summoner` (`summonId:'meridianmites'`) | 14/5/72/11 |
| `ringmender` | DNB Ring Mender | `healer` | 14/3/92/11 |
| `apexwarden` | DNB Apex Warden | `shielder` | 17/4/60/13 |
| `apexsniper` | DNB Apex Sniper | `sniper` | 13/5/66/10 |
| `ringblink` | DNB Ring Blink | `teleporter` | 13/4/0/11 |
| `nightgear` | DNB Night Gear | `ambusher` | 16/5/80/12 |
| `titanhound` | DNB Titan Hound | `chaser` (extra, brute) | 29/5/54/18 |
| `cometrunner` | DNB Comet Runner | `chaser` (extra, fast) | 11/4/182/9 |
| `apexslinger` | DNB Apex Slinger | `ranged` (extra) | 13/4/60/12 |
| `shrapnelgear` | DNB Shrapnel Gear | `bomber` (extra) | 12/4/146/10 |
| `duskcog` | DNB Dusk Cog | `flyer` (extra) | 11/5/158/9 |
| `ironram` | DNB Iron Ram | `charger` (extra) | 20/5/68/16 |
| `apexmortar` | DNB Apex Mortar | `lobber` (extra) | 15/4/72/13 |
| `irontunneler` | DNB Iron Tunneler | `burrower` (extra) | 19/4/94/12 |
| `grandsatellite` | DNB Grand Satellite | `orbiter` (extra) | 13/5/126/10 |
| `zenithsentinel` | DNB Zenith Sentinel | `sentry` (extra) | 17/4/52/12 |
| `apexblink` | DNB Apex Blink | `teleporter` (extra) | 13/4/0/11 |
| `ironbulwark` | DNB Iron Bulwark | `shielded` (extra) | 26/5/50/16 |

Rows above the `zenithhound` row are `'6D'`; `zenithhound` through `ironbulwark` are `'7D'`.
Neither floorKey gets a `BOSS_TYPES` entry — same branch-wide convention as `'4D'`/`'5D'`. `'7D'`'s
superboss is `orrery` (see superbosses.js below); `'6D'` has none of its own, feeding straight into
`'7D'`'s. Two id collisions surfaced during authoring against types-2.js's existing `sparkmites`
and `apexmarksman` and were renamed before landing — `'7D'`'s swarm entry became `meridianmites`
and its sniper entry became `apexsniper`; see feature-research/phase7d-dbranch/audit-orrery.md for
the full collision-check trail.

**Phase 7d**'s third and final slice gives the D-branch's third and last region, The Void Between,
its first regular rosters — floorKeys `'8D'`, `'9D'`, and `'10D'` (floorNum 7/8/9) had zero enemy
and zero boss entries before this. All three 33-entry rosters land in types-4.js, right after the
`'7D'` block, same "one entry per generic AI behavior" convention (21 base entries plus 12 "extra
flavor" entries doubling up on `chaser`×2, `ranged`, `bomber`, `flyer`, `charger`, `lobber`,
`burrower`, `orbiter`, `sentry`, `teleporter`, `shielded`). `'8D'` steps up from `'7D'`'s own
numbers (Orrery's toughest), `'9D'` a further step up from `'8D'`, and `'10D'` the toughest
regular-enemy tier in the whole game — relative scaling only, same convention as every prior
floor-to-floor step in this branch. Palette sits around `D_PALETTES.voidbetween`'s
`accent:'#9ab8ff'` (cold pale blue) plus near-black indigo pulled from its `floorA:'#141426'`,
`floorB:'#1a1a30'`, `wall:'#0b0b18'`, and `voidC:'#02030a'`, varied per entry — `'10D'` leans
darkest, with a few near-white event-horizon-glow accents. Theme: cold, empty, isolated deep
space, drifting derelict wreckage, faint dying starlight, the loneliness before a black hole —
`'8D'` reads as drifting wreckage and rust, `'9D'` as dimmer/colder dying starlight, and `'10D'`
escalates into genuine dread and scale (collapse, event horizon, gravity itself), distinct from
`'4D'`-`'7D'`'s more "instrument/machinery" flavor and leading straight into `'10D'`'s own capping
superboss, `singularity` (see superbosses.js below):

| id | name | behavior | hp/dmg/spd/r |
|---|---|---|---|
| `voidwisp` | DNB Void Wisp | `chaser` | 13/4/166/11 |
| `derelictmoth` | DNB Derelict Moth | `flyer` | 11/5/152/9 |
| `wreckspark` | DNB Wreck Spark | `bomber` | 12/4/138/11 |
| `hullplate` | DNB Hull Plate | `shielded` | 21/4/53/14 |
| `driftram` | DNB Drift Ram | `charger` | 21/5/79/14 |
| `silentturret` | DNB Silent Turret | `turret` | 16/4/0/12 |
| `driftleaper` | DNB Drift Leaper | `leaper` | 14/4/83/11 |
| `voidslinger` | DNB Void Slinger | `ranged` | 13/4/73/11 |
| `wreckmortar` | DNB Wreck Mortar | `lobber` | 16/4/63/13 |
| `stardrift` | DNB Star Drift | `weaver` | 15/4/126/12 |
| `hulkwatcher` | DNB Hulk Watcher | `sentry` | 18/4/41/12 |
| `debrissatellite` | DNB Debris Satellite | `orbiter` | 13/5/134/9 |
| `hulltunneler` | DNB Hull Tunneler | `burrower` | 22/4/87/13 |
| `driftmites` | DNB Drift Mites | `swarm` | 6/3/177/7 |
| `wreckhusk` | DNB Wreck Husk | `splitter` (`splitInto:'driftmites'`) | 18/4/93/13 |
| `voidcaller` | DNB Void Caller | `summoner` (`summonId:'driftmites'`) | 15/5/73/11 |
| `hullmender` | DNB Hull Mender | `healer` | 15/3/93/11 |
| `driftwarden` | DNB Drift Warden | `shielder` | 18/4/61/13 |
| `hulkmarksman` | DNB Hulk Marksman | `sniper` | 14/5/67/10 |
| `hullblink` | DNB Hull Blink | `teleporter` | 14/4/0/11 |
| `shadowhulk` | DNB Shadow Hulk | `ambusher` | 17/5/81/12 |
| `derelicthound` | DNB Derelict Hound | `chaser` (extra, brute) | 31/5/55/18 |
| `comethusk` | DNB Comet Husk | `chaser` (extra, fast) | 12/4/185/9 |
| `wreckslinger` | DNB Wreck Slinger | `ranged` (extra) | 14/4/61/12 |
| `hullspark` | DNB Hull Spark | `bomber` (extra) | 13/4/148/10 |
| `duskmoth` | DNB Dusk Moth | `flyer` (extra) | 12/5/160/9 |
| `hulkram` | DNB Hulk Ram | `charger` (extra) | 22/5/69/16 |
| `driftmortar` | DNB Drift Mortar | `lobber` (extra) | 16/4/73/13 |
| `wrecktunneler` | DNB Wreck Tunneler | `burrower` (extra) | 21/4/95/12 |
| `driftsatellite` | DNB Drift Satellite | `orbiter` (extra) | 14/5/128/10 |
| `derelictsentinel` | DNB Derelict Sentinel | `sentry` (extra) | 18/4/53/12 |
| `driftblink` | DNB Drift Blink | `teleporter` (extra) | 14/4/0/11 |
| `hullbulwark` | DNB Hull Bulwark | `shielded` (extra) | 28/5/51/16 |
| `starvedhound` | DNB Starved Hound | `chaser` | 14/4/170/12 |
| `dyingember` | DNB Dying Ember | `flyer` | 12/5/155/10 |
| `fadingnova` | DNB Fading Nova | `bomber` | 13/4/141/12 |
| `darkplate` | DNB Dark Plate | `shielded` | 22/4/54/15 |
| `nullram` | DNB Null Ram | `charger` | 22/5/81/15 |
| `lastlightturret` | DNB Last Light Turret | `turret` | 17/4/0/13 |
| `voidleaper` | DNB Void Leaper | `leaper` | 15/4/85/12 |
| `witherslinger` | DNB Wither Slinger | `ranged` | 14/4/75/12 |
| `nullmortar` | DNB Null Mortar | `lobber` | 17/4/64/14 |
| `fainttrail` | DNB Faint Trail | `weaver` | 16/4/128/13 |
| `darkwatcher` | DNB Dark Watcher | `sentry` | 20/4/41/13 |
| `dyingsatellite` | DNB Dying Satellite | `orbiter` | 14/5/137/10 |
| `nulltunneler` | DNB Null Tunneler | `burrower` | 23/4/89/14 |
| `embermites` | DNB Ember Mites | `swarm` | 7/3/180/8 |
| `fadinghusk` | DNB Fading Husk | `splitter` (`splitInto:'embermites'`) | 20/4/95/14 |
| `nullcaller` | DNB Null Caller | `summoner` (`summonId:'embermites'`) | 16/5/75/12 |
| `emberkeeper` | DNB Ember Keeper | `healer` | 16/3/95/12 |
| `darkwarden` | DNB Dark Warden | `shielder` | 20/4/62/14 |
| `nightmarksman` | DNB Night Marksman | `sniper` | 15/5/68/11 |
| `nullblink` | DNB Null Blink | `teleporter` | 15/4/0/12 |
| `hollowstalker` | DNB Hollow Stalker | `ambusher` | 19/5/83/13 |
| `nullhound` | DNB Null Hound | `chaser` (extra, brute) | 34/5/56/19 |
| `faintrunner` | DNB Faint Runner | `chaser` (extra, fast) | 13/4/188/10 |
| `darkslinger` | DNB Dark Slinger | `ranged` (extra) | 15/4/62/13 |
| `nullspark` | DNB Null Spark | `bomber` (extra) | 14/4/151/11 |
| `witherwisp` | DNB Wither Wisp | `flyer` (extra) | 13/5/164/10 |
| `darkram` | DNB Dark Ram | `charger` (extra) | 23/5/70/17 |
| `faintmortar` | DNB Faint Mortar | `lobber` (extra) | 17/4/75/14 |
| `darktunneler` | DNB Dark Tunneler | `burrower` (extra) | 22/4/97/13 |
| `nullsatellite` | DNB Null Satellite | `orbiter` (extra) | 15/5/130/11 |
| `fadingsentinel` | DNB Fading Sentinel | `sentry` (extra) | 20/4/54/13 |
| `darkblink` | DNB Dark Blink | `teleporter` (extra) | 15/4/0/12 |
| `nullbulwark` | DNB Null Bulwark | `shielded` (extra) | 30/5/52/17 |
| `collapsehound` | DNB Collapse Hound | `chaser` | 16/5/173/12 |
| `lastlightmoth` | DNB Last Light Moth | `flyer` | 13/6/158/10 |
| `eventspark` | DNB Event Spark | `bomber` | 14/5/144/12 |
| `horizonplate` | DNB Horizon Plate | `shielded` | 25/5/55/15 |
| `gravram` | DNB Grav Ram | `charger` | 25/6/82/15 |
| `collapseturret` | DNB Collapse Turret | `turret` | 20/5/0/13 |
| `abyssleaper` | DNB Abyss Leaper | `leaper` | 17/5/87/12 |
| `eventslinger` | DNB Event Slinger | `ranged` | 16/5/76/12 |
| `gravmortar` | DNB Grav Mortar | `lobber` | 20/5/65/14 |
| `silenttrail` | DNB Silent Trail | `weaver` | 18/5/131/13 |
| `horizonwatcher` | DNB Horizon Watcher | `sentry` | 22/5/42/13 |
| `collapsesatellite` | DNB Collapse Satellite | `orbiter` | 16/6/139/10 |
| `eventtunneler` | DNB Event Tunneler | `burrower` | 26/5/91/14 |
| `collapsemites` | DNB Collapse Mites | `swarm` | 8/4/184/8 |
| `horizonhusk` | DNB Horizon Husk | `splitter` (`splitInto:'collapsemites'`) | 22/5/97/14 |
| `eventcaller` | DNB Event Caller | `summoner` (`summonId:'collapsemites'`) | 18/6/76/12 |
| `lastkeeper` | DNB Last Keeper | `healer` | 18/4/97/12 |
| `horizonwarden` | DNB Horizon Warden | `shielder` | 22/5/63/14 |
| `gravmarksman` | DNB Grav Marksman | `sniper` | 17/6/70/11 |
| `eventblink` | DNB Event Blink | `teleporter` | 17/5/0/12 |
| `silentstalker` | DNB Silent Stalker | `ambusher` | 21/6/84/13 |
| `gravhound` | DNB Grav Hound | `chaser` (extra, brute) | 38/6/57/19 |
| `collapserunner` | DNB Collapse Runner | `chaser` (extra, fast) | 14/5/192/10 |
| `abyssslinger` | DNB Abyss Slinger | `ranged` (extra) | 17/5/63/13 |
| `horizonspark` | DNB Horizon Spark | `bomber` (extra) | 16/5/154/11 |
| `eventmoth` | DNB Event Moth | `flyer` (extra) | 14/6/167/10 |
| `horizonram` | DNB Horizon Ram | `charger` (extra) | 26/6/72/17 |
| `abyssmortar` | DNB Abyss Mortar | `lobber` (extra) | 20/5/76/14 |
| `gravtunneler` | DNB Grav Tunneler | `burrower` (extra) | 25/5/99/13 |
| `eventsatellite` | DNB Event Satellite | `orbiter` (extra) | 17/6/133/11 |
| `collapsesentinel` | DNB Collapse Sentinel | `sentry` (extra) | 22/5/55/13 |
| `horizonblink` | DNB Horizon Blink | `teleporter` (extra) | 17/5/0/12 |
| `eventbulwark` | DNB Event Bulwark | `shielded` (extra) | 34/6/53/17 |

Rows above the `starvedhound` row are `'8D'`; `starvedhound` through `nullbulwark` are `'9D'`;
`collapsehound` through `eventbulwark` are `'10D'`. None of the three floorKeys gets a
`BOSS_TYPES` entry — same branch-wide convention as every prior D-branch floor. `'10D'`'s
superboss is `singularity` (see superbosses.js below); `'8D'` and `'9D'` have none of their own,
both feeding straight into `'10D'`'s. Two ids were renamed before landing to avoid silent
`Object.assign` overwrites of pre-existing types-1.js entries — the sniper base entries for `'8D'`
and `'10D'` were originally `voidmarksman` and `abyssmarksman` (both already used by types-1.js),
renamed to `hulkmarksman` and `gravmarksman`; all 99 candidate ids were grepped against the full
codebase before landing, and none of the other 97 collided. See
feature-research/phase7d-dbranch/audit-voidbetween.md for the full collision-check trail and
verification numbers.

**Phase 7d is now complete** — all seven D-branch floorKeys (`'4D'` through `'10D'`) have their
regular enemy rosters, each region capped by its own SUPERBOSSES entry (`astrolabe`, `orrery`,
`singularity`), and no floorKey in the branch carries a `BOSS_TYPES` mid-boss pool.

### js/data/enemies/lists.js — `ENEMY_LIST`, `LEGACY_ENEMY_ALIASES`, `resolveEnemyTypeId`

```js
const ENEMY_LIST = Object.values(ENEMY_TYPES);

const LEGACY_ENEMY_ALIASES = {
  grub:'gravegrub', scrapper:'bonepicker', slinger:'cryptslinger', brute:'thornhide',
  bomber:'sporepopper', wisp:'firefly', shellback:'shellbone',
};
function resolveEnemyTypeId(id){
  return ENEMY_TYPES[id] ? id : (LEGACY_ENEMY_ALIASES[id] || id);
}
```

- `ENEMY_LIST` is simply the array form of `ENEMY_TYPES`, used everywhere a pool needs to be
  filtered/iterated (`resolveGenericEnemy`, achievement/bestiary code, etc.).
- `LEGACY_ENEMY_ALIASES` maps 7 pre-"stage rework" short ids (from before enemies were
  reorganized by stage, per the file's comment) to their current canonical ids, so any room
  template still hand-authored with a forced `"specific":"grub"` spawner resolves to something
  real instead of silently failing.
- `resolveEnemyTypeId(id)` — if `id` is already a valid `ENEMY_TYPES` key, return it unchanged;
  otherwise look it up in `LEGACY_ENEMY_ALIASES` (falling back to returning `id` itself if even
  that misses, i.e. an unrecognized id passes through unresolved and will fail elsewhere).
  Called from `systems/room.js`'s `instantiateSpawner` on every forced enemy spawner's
  `specific` id before looking it up in `ENEMY_TYPES`/`BOSS_TYPES`.

### js/data/enemies/bosses.js — `BOSS_TYPES` (64 entries) + `BOSS_LIST`

Same object shape as `ENEMY_TYPES` but simpler — no `xpTier`, no movement-behavior tuning
fields beyond what each specific `bossXxx` AI function hardcodes internally (per repeated
in-file comments: "the bossXxx functions hardcode their own pattern constants, so the
differentiation levers a table entry actually has are hp/dmg/speed/radius"). Fields:
`id`, `name`, `hp`, `dmg`, `speed`, `radius`, `color`, `dark`, `behavior` (a boss-specific
string, `'bossWarlord'` etc.), and either `stage` or `floorKey` (same semantics as
`ENEMY_TYPES`). A few entries also carry `burstRadius` — read by both `ai.js`'s
`aiBossRotBloom` and `render.js`'s `drawEnemy` to size/draw the delayed ground-target marker for
that boss's AoE (documented explicitly as "REQUIRED... without it the AoE lands unannounced").

`BOSS_LIST = Object.values(BOSS_TYPES)` at the bottom, mirroring `ENEMY_LIST`.

#### `behavior` → boss AI dispatch

Same `switch (e.behavior)` in `combat-3.js`'s `updateEnemy` also has one `case 'bossXxx':` per
boss behavior string, each calling the identically-named `aiBossXxx(game, e, dt)` function.
These live in `systems/ai-2.js` (base per-stage bosses + the 6 SUPERBOSSES that predate the
finale set), `systems/ai-3.js` (the "extended boss set" reused across many floorKeys — 17
non-summoning patterns as of Phase 2's `bossEclipseWraith`/`bossIronBastion` addition), and
`systems/ai-4.js` (the 5 drum-and-bass finale superboss patterns).
Notably: many `BOSS_TYPES` entries **reuse** an existing `bossXxx` behavior string rather than
getting new AI — e.g. `mausoleumtitan` (stage 0) uses `behavior:'bossBrickGolem'`, the same
function `brickgolem` (floorKey `'9B'`) uses, just with different hp/dmg/speed/radius numbers to
put it in a different "weight class" (a slow siege body vs. the original's different profile).
Extensive in-file comments explain the reasoning per content batch: batches A-D and the base
11A-12B block deliberately spread which of the ~16 non-summoning `bossXxx` functions each
floorKey/stage borrows, so no two bosses on the same floor/stage share a behavior, and each pair
per pool is designed as one "glass cannon" (low hp, high speed) and one "siege body" (high hp,
low speed, wide radius).

#### Example entries (verbatim)

```js
warlord: { id:'warlord', name:'Grung, the DNB Warlord', hp:46, dmg:2, speed:82, radius:26,
  color:'#8a4b2b', dark:'#552c17', behavior:'bossWarlord', stage:0 },

rotbloom: { id:'rotbloom', name:'The Rot Bloom', hp:48, dmg:2, speed:46, radius:28,
  color:'#8a9a3a', dark:'#4a5218', behavior:'bossRotBloom', burstRadius:78, stage:1 },

subdrowner: { id:'subdrowner', name:'The Sub Drowner', hp:58, dmg:3, speed:44, radius:30,
  color:'#4f7fd8', dark:'#1e3468', behavior:'bossFurnaceHeart', floorKey:'11A' },
```

**Phase 7b** gives floorKey `'13'` and `'14'` their first regular-boss (bonus-fight) pools, 2
apiece, same glass-cannon/siege-body discipline and full AI reuse as every block above. hp is
interpolated between two anchors per the plan: the 12A/12B regular-boss floor (58-62) and each
floor's own superboss (`wobbler` hp73 for `'13'`, `subdrop` hp75 for `'14'`, see
superbosses.js) — so `'13'`'s pair (64/68) sits under `wobbler` and `'14'`'s pair (70/73) sits
under `subdrop`, keeping each floor's superboss the biggest fight in its own room:

| id | name | floorKey | hp/dmg/spd/r | reused AI | role |
|---|---|---|---|---|---|
| `lastovertone` | The Last Overtone | `'13'` | 64/2/84/23 | `bossShadowStalker` | glass cannon |
| `hollowcantor` | The Hollow Cantor | `'13'` | 68/3/44/31 | `bossFrostSentinel` | siege body |
| `flatlinewraith` | The Flatline Wraith | `'14'` | 70/2/80/26 | `bossBrimstoneHorror` | glass cannon |
| `zeroamplitude` | The Zero Amplitude | `'14'` | 73/3/46/34 | `bossCinderColossus` | siege body |

Palettes match the enemy rosters: `'13'`'s pair pulls cold blue-violet from
`HOLLOW_CHORUS_PALETTE`, `'14'`'s pair pulls dark red from `FINAL_WAVEFORM_PALETTE`.

### js/data/enemies/superbosses.js — `SUPERBOSSES` (22 entries) + `SUPERBOSS_LIST`

Structurally like `BOSS_TYPES` but every entry additionally has an `icon` (a single emoji shown
in the boss UI) instead of `stage`/`floorKey` gating by the normal pool mechanism — superbosses
are placed by forced spawners / specific room logic rather than drawn randomly from
`resolveGenericBoss`'s stage/floorKey pools (grep shows `SUPERBOSSES`/`SUPERBOSS_LIST` are
consumed by dedicated code, not `BOSS_LIST`'s callers). Split into three groups by the header
comments: 6 base superbosses (`polish`, `tyrone`, `pineapple`, `israel`, `algae`, `lilac`), the
5-entry "drum-and-bass finale set" for floors 11A/11B/12A/12B/13 (`plapper`, `clapper`, `nhm`,
`vanilladnb`, `onetruednb` — note `onetruednb` is also the boss forced into the floor-13 boss
room template, see below), and 4 C-branch superbosses (`drenched`, `brazil`, `israelprime`,
`kirk`) whose hp is explicitly authored against the *floorNum* their C-branch floor actually
runs on (since `bossHpScale` is floorNum-driven, not label-driven) rather than against the
11-13 set. Every superboss `behavior` reuses an existing `bossXxx` AI function — no new AI code
was written for any superboss.

**Phase 7a** adds 7 more under one shared header comment, following every rule above (AI reuse,
identity-scale hp authored against the existing superbosses at a comparable *relative* position
rather than a comparable depth, `dmg` capped at 4 half-hearts since `playerDamageAmount` adds
its own +1 past the Inferno). Where two share a region they are deliberately paired as one
glass cannon (lower hp, higher speed, smaller radius, an evasive/blink behavior) and one siege
body (higher hp, lower speed, larger radius, a slam/charge behavior), the same discipline the
A/B branch pairs use:

| id | name | floor | hp/dmg/spd/r | reused AI | role |
|---|---|---|---|---|---|
| `wobbler` | WobblerDNB | floor 13 (floorNum 12) | 73/4/94/27 | `bossEclipseWraith` | glass cannon |
| `subdrop` | SubdropDNB | floor 14 (floorNum 13) | 75/4/58/35 | `bossIronBastion` | siege body (`burstRadius:100`) |
| `monsoon` | Monsoon DNB | 10C (floorNum 9) | 74/4/90/28 | `bossBlizzardWraith` | glass cannon |
| `mangrove` | Mangrove DNB | 11C (floorNum 10) | 76/4/64/34 | `bossVineHorror` | siege body |
| `astrolabe` | Astrolabe DNB | 5D (floorNum 4) | 63/3/88/27 | `bossGlassScorpion` | glass cannon |
| `orrery` | Orrery DNB | 7D (floorNum 6) | 70/4/60/34 | `bossBrickGolem` | siege body |
| `singularity` | The Singularity | 10D (floorNum 9) | 79/4/80/35 | `bossSlagbound` | D-branch finale |

`subdrop` is the only one carrying an extra tuning field: `bossIronBastion` reads
`e.type.burstRadius` for its ground-slam AoE (defaulting to 90 when absent).

```js
onetruednb: { id:'onetruednb', name:'The One True DNB', hp:76, dmg:4, speed:82, radius:34,
  color:'#ffd447', dark:'#8a6a10', behavior:'bossOneTrueDnb', icon:'🌀' },

israelprime:{ id:'israelprime', name:'Israel DNB Prime', hp:72, dmg:4, speed:80, radius:32,
  color:'#5a8ee0', dark:'#22407a', behavior:'bossIsrael', icon:'✡️' },
```

---

### js/data/roomTemplates/core.js and normal-1.js..normal-4.js — `ROOM_TEMPLATES` (room-generation data)

#### Overall shape

`ROOM_TEMPLATES` is one object, keyed by room type, each value an array of "compact v2"
template objects:

```
start, normal, boss, treasure, shop, secret, petshop, curse, sacrifice, vault, challenge, crystal, sombra
```

`core.js` declares the object literal and hand-authors every key except `normal` (which starts
as `[]` in core.js and is populated purely by `.push(...)` calls in `normal-1.js`..
`normal-4.js` — by far the largest bucket, ~1883 entries across the 4 files). When a room slot
of a given type is generated in-game, `systems/dungeon.js` picks a random template from that
type's array (filtered by floor/path eligibility — see below); if the filtered pool is empty,
`room.js` falls back to the old procedural room generator so the game stays playable while a
type's template set is still sparse (this is explicitly why `vault` and `crystal` have header
comments noting they're mostly/entirely hand-authored placeholders).

#### Compact template schema

```
{
  "m": [[1,1],[1,0]],  // required: polyomino block mask, 1-4 blocks. Same format as
                        // ROOM_SHAPES in data/core.js (mask[row][col], 1=block present).
                        // Each "block" is a 10x10-tile (BLOCK=10, TILE=32px) chunk of room.
  "s": [ ... ],         // optional: spawners (see below)
  "f": [0, 2, 4],       // optional: allowed floor indices, 0-based (floor 1 = index 0).
                        // Omitted = any floor. Checked by dungeon.js's templateAllowsFloor.
  "d": "NW" | [[0,0,"NW"], ...], // optional: disabled door sides (see below)
  "p": "C",             // optional: path-exclusivity tag, currently only "C" is used
}
```

**`m` (mask)** — identical format to `ROOM_SHAPES` in `data/core.js` (the same 18 predefined
polyomino shapes used by the procedural generator's `pickRoomShape`, e.g. `single: [[1]]`,
`wideDom: [[1,1]]`, `lA: [[1,0],[1,1]]`). `mask[row][col] === 1` marks a present 10x10-tile
block; up to 4 blocks total.

**`s` (spawners)** — array of short positional arrays `[x, y, categoryCode, ...]`. Coordinates
are tile indices into the room's own grid as shown in the room editor (tile 0 is the outer wall
ring; floor tiles start at 1). Category codes are decoded by `room.js`'s
`SPAWNER_CATEGORY_DECODE = { e:'enemy', p:'pickup', i:'item', d:'deal', s:'shop', o:'obstacle'
}` (the room editor's `ui/roomEditor.js` encodes the reverse direction with
`SPAWNER_CATEGORY_ENCODE = { enemy:'e', pickup:'p', item:'i', deal:'d', shop:'s', obstacle:'o' }`).
For every category except `obstacle`, the 4th element is a "kind" code:
  - `"g"` — generic/random, resolved at spawn time (random enemy-for-floor, random pickup,
    random item from the room type's own pool, random shop offer).
  - `"b"` — enemy-category only: generic BOSS for the room's floor (`resolveGenericBoss`).
  - `"f"` — forced: a 5th array element gives the exact thing:
    - enemy: `ENEMY_TYPES`/`BOSS_TYPES` key, e.g. `"grub"` (resolved through
      `resolveEnemyTypeId` first, so legacy aliases still work)
    - pickup: `"coin:<penny|nickel|dime|luckypenny>"`, `"key"`, `"bomb"`, `"heartRed"`,
      `"heartBlue"`, `"heartContainer"`, `"chest:<grey|gold|stone|cursed|wood|eternal>"`,
      `"pill"` (random color), `"star"` (random named star)
    - item (`i`): an `ITEMS` key, e.g. `"ironshoes"`
    - deal (`d`): an `ITEMS` key — a deal pedestal always costs 1 heart whether forced or not,
      and is always drawn from the `'sombra'` item pool regardless of the room's own type
      (`room.js`'s `addDealPedestal`) when generic
    - shop (`s`): an `ITEMS` key or a pickup kind
  - Obstacle spawners have no g/f code at all — they're always forced:
    `[x, y, "o", specificObstacleKind]`, one of: `rock`, `hardrock`, `pit`, `tallrock`,
    `tallhardrock`, `cactus`, `yellowfire`, `redfire`, `bluefire`, `purplefire`, `spike`
    (sacrifice rooms only), `spiketrap`, `spikedrock`, `tintedrock`, `movingspike`, `sandtrap`,
    `mud`, `turretn`/`turrete`/`turrets`/`turretw`/`turretplus`/`turretx`/`turrettarget`,
    `bombbarrel`, `pushablebombbarrel`. `"rock"` additionally has a hidden 2% chance to actually
    come out as `"tintedrock"` (`room.js`'s `rollRockKind`).

**`f` (floor restriction)** — optional array of 0-based floor indices this template is eligible
on; omitted means any floor. Checked in `systems/dungeon.js`'s `templateAllowsFloor`.

**`d` (door disable)** — two formats:
  - string, e.g. `"NW"` — legacy: disables that side on **every** block of the room's mask.
  - array of `[col, row, sides]` triples, e.g. `[[0,0,"NW"],[1,0,"NS"]]` — per-block: disables
    just the named sides of block `[col,row]`. This is what the room editor now exports.
  Doors are inherently per-block, not per-room: every 10x10 block can have a door on each side
  not already shared with another block of the same room (a side facing a same-room block is an
  interior opening, never a door). "d" can only *disable* a door that would otherwise form;
  doors are still wired up automatically at runtime based on which rooms end up adjacent — you
  cannot force a door into existence by hand.

**`p` (path flag)** — currently the only value used is `"C"`, meaning the template is **C-branch
exclusive** and never eligible on the main path (`systems/dungeon.js`'s `templateAllowsFloor`:
`if (tmpl.p === 'C' && floorPath !== 'C') return false;`). Its absence means eligible on any
path — this is why the vast majority of `normal-1..3.js` templates (authored before this tag
existed) have no `p` field and are shared by the main path and the C-branch alike. It exists
specifically for templates that place a path-exclusive obstacle kind — `dungeon.js`'s
`obstacleAllowedOnFloor` independently gates certain obstacle kinds (`mud`, `sandtrap`/`cactus`,
the `current*` hazards) to specific floor+path combinations, and any template using one of those
needs `"p":"C"` (or the matching floor restriction) so it isn't offered where the obstacle
wouldn't render correctly.

#### Room editor connection

`js/ui/roomEditor.js` is a standalone visual room-building tool (`room-editor.html`) that
exports templates in exactly this compact format as ready-to-paste `ROOM_TEMPLATES.<type>.push
({...})` statements — the header comment in `core.js` says explicitly: "Build rooms with
room-editor.html, then paste each exported line straight in below (or anywhere in this file)".
`roomEditor.js`'s `SPAWNER_CATEGORY_ENCODE` and `encodeSpawner` are the write-side mirror of
`room.js`'s `SPAWNER_CATEGORY_DECODE`/`decodeSpawner`. The old verbose (pre-v2) template format
is explicitly unsupported — templates must be re-exported from the current editor.

#### Example entries (verbatim)

Simple template, no obstacles, generic enemies only:
```js
{"m":[[1]],"s":[[5,5,"e","g"],[5,6,"e","g"],[6,6,"e","g"],[6,5,"e","g"]]}
```

With obstacles and a door disabled (legacy string form):
```js
{"m":[[1]],"s":[[5,1,"e","g"],[6,1,"e","g"],[5,10,"e","g"],[6,10,"e","g"],
  [4,1,"o","rock"],[4,2,"o","rock"],[7,2,"o","rock"],[7,1,"o","rock"],
  [7,9,"o","rock"],[7,10,"o","rock"],[4,9,"o","rock"],[4,10,"o","rock"]],"d":"NS"}
```

Floor-restricted, forced enemies, per-block door-disable array (2-block mask):
```js
{"m":[[1,1]],"s":[[4,1,"e","f","graveturret"],[7,1,"e","f","graveturret"],
  [14,1,"e","f","graveturret"],[17,1,"e","f","graveturret"],[17,10,"e","f","graveturret"],
  [14,10,"e","f","graveturret"],[7,10,"e","f","graveturret"],[4,10,"e","f","graveturret"],
  [3,10,"o","hardrock"], /* ...more hardrock obstacles... */
  ],"f":[0,1],"d":[[0,0,"NS"],[1,0,"NS"]]}
```

Floor-13 finale boss room — 4-block mask, forced boss spawner (room.js drops `opts.bossType`
there), perimeter-only obstacles so the 20x20 middle stays clear for the boss fight, plus 4
`turret*` obstacles as an added hazard:
```js
{"m":[[1,1],[1,1]],"s":[[10,11,"e","b"],
  [2,2,"o","tallhardrock"],[3,2,"o","tallhardrock"],[2,3,"o","tallhardrock"],
  [19,2,"o","tallhardrock"],[18,2,"o","tallhardrock"],[19,3,"o","tallhardrock"],
  [2,19,"o","tallhardrock"],[3,19,"o","tallhardrock"],[2,18,"o","tallhardrock"],
  [19,19,"o","tallhardrock"],[18,19,"o","tallhardrock"],[19,18,"o","tallhardrock"],
  [8,1,"o","turrets"],[20,8,"o","turretw"],[13,20,"o","turretn"],[1,13,"o","turrete"]],
  "f":[12]}
```

C-branch-exclusive template (`mud` obstacle, `"p":"C"`, restricted to floorNum 4-5 which is
5C/6C on that path):
```js
{"m":[[1,1],[1,0]],"s":[[10,5,"e","g"],[5,10,"e","g"],[12,5,"e","g"],[14,5,"e","g"],
  [16,5,"e","g"],[18,5,"e","g"],[11,5,"o","mud"],[11,6,"o","mud"],[12,6,"o","mud"],
  /* ...more mud obstacles... */ ],"f":[4,5],"p":"C"}
```

#### Notes on the 13 non-`normal` types (all in core.js)

- **`start`** — 4 entries, always a single `[[1]]` block; simple obstacle-framing variants plus
  one with a forced pickup.
- **`boss`** — 8 entries. Six are 2-block masks with a `"e","b"` (generic boss) spawner and
  `"d":"NS"`/`"d":"EW"` to force the boss room's doors to only open on two opposite sides; the
  last two are the 4-block `[[1,1],[1,1]]` mask used for the game's biggest boss arenas,
  including the floor-13 finale room shown above.
- **`treasure`**, **`shop`**, **`secret`** — sizeable hand-authored pools (20+ entries each) of
  single/double-block rooms with `"i","g"` (treasure), `"s","g"` (shop offer slots), or mixed
  `"p"/"i"/"e","g"` (secret) spawners plus decorative obstacle rings.
- **`petshop`/`curse`/`sacrifice`** — per a shared header comment, these three room types get
  their *guaranteed* content (a free familiar, a devil-deal-style pedestal, and the reward spike
  respectively) injected automatically by `room.js`'s `populateRoom` regardless of what the
  template contains — the hand-authored entries here are purely extra decoration (obstacle
  rings, forced pickups) layered on top of that guarantee.
- **`vault`** — key-locked like treasure/shop but **entirely** hand-authored, no automatic
  content; mostly forced pickup spawners (`chest:*`, `heartContainer`, `sack`, `battery`, etc.).
- **`challenge`** — room.js's `populateRoom` always injects one guaranteed item at room center
  (from the `'challenge'` item pool) on top of whatever's here; the ~20 hand-authored entries
  here are pure arena-shape layouts (varied masks, most with no `"s"` at all) kept open because
  5 waves of 3-5 enemies spawn from the center once the item is taken
  (`combat.js`'s `startChallengeRoom`/`spawnChallengeWave`).
- **`crystal`** (angel) / **`sombra`** (devil) — deal rooms, entirely hand-authored, no
  automatic content. `sombra` is specifically where the `"d"` (deal) spawner category
  conventionally lives — a heart-cost item pedestal via `room.js`'s `addDealPedestal` — though
  it's placeable in any room type's template.
- **`shrine`** (Phase 3 overhaul) — a 13th special room type: a per-floor 20% coin flip in
  `dungeon.js`'s `generateDungeon` (`Util.chance(0.20) ? attachSpecial('shrine') : null`, alongside
  the petshop/curse/vault/challenge/star flips), in both `SPECIAL_ROOM_TYPES` (capped at one
  entrance) and `AUTO_OPEN_ROOM_TYPES` (doors start open, no combat/key gate). Follows petshop's
  *guaranteed content* pattern, not curse's *hand-authored only* one: `room.js`'s `populateRoom`
  always adds exactly one pedestal at room center via `addShrinePedestal` if the template (or lack
  of one) didn't already place one, drawn from `pickItemFromPool('shrine')` (the new `'shrine'`
  pool — see `data/core.js`'s `POOLS_SHRINE`). Unlike every other pedestal type, a shrine offer is
  priced in **coins**, not hearts or a free take — `coinCost = Math.min(30, 8 + floorNum * 3)`,
  mirroring shop.js's own per-floor price curve. `game.js`'s `updateItemPedestal()` has a matching
  `ped.isShrine` branch (parallel to the existing `ped.isDeal` heart-cost branch): denies with a
  toast + `uiDeny` sound and `continue`s (pedestal stays untaken) if `player.coins < ped.coinCost`,
  otherwise deducts the coins and falls through to the normal `applyItemToPlayer` path. 10
  hand-authored templates in `roomTemplates/core.js`'s new `ROOM_TEMPLATES.shrine` array — mostly
  empty/lightly-decorated single/double-block layouts (no `"i"`/`"d"` spawners needed, since
  content is auto-guaranteed), same density as the crystal/sombra sets. First-visit stat
  (`shrineRoomsVisited`, bumped in `game.js`'s `enterRoom`) backs a 3-tier `addTierSet` ladder
  (`shrine_visits_t1..t3`, `defs-6.js`, alongside the C-branch ladders) and a `ROOM_TYPE_LIST`
  entry (`data/economy.js`). Room editor support: a `<select id="roomType">` option
  (`room-editor.html`) and an `updateStatsAndWarnings()` branch (`ui/roomEditor.js`) explaining the
  guaranteed-pedestal behavior, matching petshop's.
- **`arcade`** (Phase 4 overhaul) — a coin-toll-gated room type, NOT key-locked and NOT auto-open
  (the one exception to the "special rooms are either auto-open or key-locked" split). Per-floor 18%
  coin flip in `dungeon.js`'s `generateDungeon` (`Util.chance(0.18) ? attachSpecial('arcade') : null`),
  in `SPECIAL_ROOM_TYPES` (capped at one entrance) but deliberately **not** in `AUTO_OPEN_ROOM_TYPES` —
  its doors start locked and stay locked until paid. `combat.js` adds a parallel gate to the existing
  key-lock machinery: `COIN_LOCKED_ROOM_TYPES = new Set(['arcade'])`, `ARCADE_TOLL = 1`,
  `coinLockedRoomFor(node, slot)` (identical two-sided shape to `keyLockedRoomFor`) and
  `tryUnlockCoinDoor(game, node, lockedRoom)` (mirrors `tryUnlockKeyDoor`: deducts `ARCADE_TOLL` coins,
  opens the door, `Sound.play('coin')`, toasts "Paid 1c to enter.", `bumpStat('coinsSpent', ...)`; on
  insufficient coins, debounced via the same `node.keyToastCooldown` field the key-lock deny path
  already uses — it's really just "a door-deny toast is already showing", not key-specific — toasts
  "Locked — needs 1 coin."). `checkDoorTransition` runs `coinLockedRoomFor` as a second check right
  after `keyLockedRoomFor`'s, order doesn't matter since a room is only ever one type.

  Contents: `room.js`'s `populateRoom` always scatters 2-4 random fixtures (`Util.randi(2, 4)`) across
  8 possible kinds — fillies (`coin`/`bomb`/`key`/`heart`/`battery`, pushed into `node.fillies` as
  `{kind, x, y, fedCount, done}`, TILE coordinates) and machines (`friendship`/`tools`/`dark`, pushed
  into `node.machines` as `{kind, x, y}`) — picked via `Util.shuffle(...).slice(0, count)` and placed
  at 8 shuffled grid-third candidate spots (deduped against overlap) via `findNearestFloor`. Guarded on
  `!node.fillies.length && !node.machines.length` so a future hand-authored template that pre-populates
  either array is respected; no such template exists yet, so this always fires today. No hand-authored
  `ROOM_TEMPLATES.arcade` entries exist this phase — every arcade room is currently the same "empty
  shell + scattered fixtures" shape regardless of mask.

  Interaction is a single H-key entry point, `systems/shop.js`'s `tryArcadeInteract(game)` (bound via
  `game.js`'s `tryArcadeInteract()` wrapper — same name as the global function it delegates to; this
  works because a class method's bare name isn't a lexical binding inside its own body, so the call
  resolves to the module-scope function, not infinite recursion — and `main.js`'s `case 'KeyH'`, guarded
  `!e.repeat` since feeds cost real resources). `findNearestArcadeFixture(node, player)` scans both
  `node.fillies` and `node.machines` for whichever is nearest and within 30px (same radius as the
  donation machine/reroll altar); no match is a silent no-op. Dispatches to `feedArcadeFilly`/
  `useArcadeMachine`:
  - **Coin Filly** — 1 coin/feed → `grantPickupEffect` with a kind from `ARCADE_COIN_FILLY_REWARDS`
    (`['heartRed','bomb','key','pill','star']`, deliberately excludes `'coin'` itself). At `fedCount===5`:
    one-time `pickItemFromPool('treasure')` via `applyItemToPlayer`, `done=true` caps further feeds
    ("This one looks satisfied.").
  - **Bomb Filly** — 1 bomb/feed → `Util.randi(1,3)` coins + `player.heal(0.5)`. At `fedCount===4`:
    one curated item from `ARCADE_BOMB_REWARDS` (shop.js, id list: `cherrybomb`/`sparkfuse`/
    `demolitionrig`/`blastmaster`), `done=true`.
  - **Key Filly** — 1 key/feed → spawns `new Chest(kind, tx, ty)` into `node.chests` near the filly via
    `findNearestFloor`, `kind` weighted among `grey`(50)/`gold`(30)/`stone`(20) only (`ARCADE_KEY_FILLY_CHEST_KINDS`
    — cursed/wood/eternal excluded). At `fedCount===4`: one curated item from `ARCADE_KEY_REWARDS`
    (`skeletonkeyring`/`brasslockpick`/`vaultcrackerskit`/`mastervaultkey`), `done=true`.
  - **Heart Filly** — 1 heart/feed, guarded `player.totalHearts() <= 1` (deny, "Can't spare your last
    heart.") so it can never reach 0 hearts (mirrors `tryOpenChest`'s cursed-chest "must always leave
    something" rule) → `player.spendHearts(1)`, then one of `pill`/`star`/`trinket`/`blueHeart` via
    `Util.choice` (trinket via `equipTrinket(game, pickTrinketFromPool())`, falling back to a `'star'`
    grant if nothing's unlocked; blueHeart via `grantPickupEffect(game, 'heartBlue', ...)`). At
    `fedCount===4`: `pickItemFromPool('sombra')`, `done=true`.
  - **Battery Filly** — 3 coins/feed, **but checks `player.activeItem` truthiness BEFORE deducting the
    cost** (a no-op active-less feed costs nothing — the plain shop battery pickup is free for the same
    no-op, this one just also costs when it actually works) → `+3` charge, capped at
    `player.activeItem.maxCharge` (same idiom as `combat.js`'s `minibattery` case, scaled up for the
    coin cost). No capstone/`done` — a plain repeatable coin sink.
  - **Friendship Machine** — 1 coin, 50% roll, **Phase 6a overhaul**: the coin is deducted and the
    win/lose outcome (plus, on a win, exactly which `COMMON_HEART_POOL` kind) is rolled and stored
    on the machine object (`machine.pendingOutcome = {win, kind}`) at press-time — nothing is granted
    yet. `machine.spinning = true; machine.spinTimer = ARCADE_SPIN_DELAY` (0.45s) arms a short
    anticipation beat; `updateArcadeMachines(game, dt)` below resolves it once the timer expires,
    granting the reward via `grantPickupEffect` on a win, or on a lose playing the new `Sound.play('machineWhiff')`
    cue + "Nothing this time." toast (distinct from `uiDeny`, which stays reserved for the genuine
    insufficient-funds early return above).
  - **Tools Machine** — 2 coins, 50% roll: same press-time-roll/spin-delay/reveal shape as Friendship,
    winning kind `Util.choice(['key','bomb'])`.
  - **Dark Machine** — 4 coins, guaranteed `Util.choice(['pill','star'])`, unchanged — resolves instantly,
    no spin delay (nothing to gamble, no suspense to build).

  `updateArcadeMachines(game, dt)` (`systems/shop.js`) — ticks every `node.machines` entry with
  `spinning:true`, decrementing `spinTimer`; once it expires, resolves the pre-rolled `pendingOutcome`
  exactly once (grant-or-whiff), clears `spinning`/`pendingOutcome`. Cheap no-op when the current room
  has no `node.machines` or none are mid-spin. Called every frame from `systems/combat-1.js`'s
  `updatePlayer`, right after `updatePlayerTurrets`.

  Rendering: `Util.drawFilly`/`drawFriendshipMachine`/`drawToolsMachine`/`drawDarkMachine`
  (`core/utils-2.js`), wired via `ui/render.js`'s `drawArcadeFixtures()` (called unconditionally every
  frame alongside `drawDonationMachineFixture`/`drawRerollAltarFixture`, guarded on `node.fillies`/
  `node.machines` existing) — Phase 6a overhaul: `drawFriendshipMachine`/`drawToolsMachine` now also take
  the `machine` object and `this.now`, forwarded to a shared `Util.drawMachineSpinFlourish(ctx, x, y,
  machine, now)` helper that draws a small spinning dashed ring (`Theme.machine.spinRing`) over the
  glyph while `machine.spinning` is true; `drawDarkMachine`'s signature is unchanged (no spin state).
  `Theme.door.arcade` and 9 `Theme.machine.*` tokens (see the theme.js section above, now including
  `spinRing`). First-visit stat `arcadeRoomsVisited` (bumped in `game.js`'s `enterRoom`, same chain
  as the other `*RoomsVisited` counters) backs a 3-tier `addTierSet` ladder (`arcade_visits_t1..t3`,
  `defs-6.js`, right after `shrine_visits`) and a `ROOM_TYPE_LIST` entry (`data/economy.js`). Room
  editor support: a `<select id="roomType">` option (`room-editor.html`) and an
  `updateStatsAndWarnings()` branch (`ui/roomEditor.js`) explaining the auto-placed fixtures.

  8 new curated, id-only reward items (`ARCADE_BOMB_REWARDS`/`ARCADE_KEY_REWARDS` above) plus 3 new
  ordinary `POOLS_ALL` visit-ladder reward items, all in `data/items-5.js`'s Arcade batch:
  `cherrybomb`/`sparkfuse`/`demolitionrig`/`blastmaster` (bomb-radius/all-attack-damage flavor, `pools:[]`),
  `skeletonkeyring`/`brasslockpick`/`vaultcrackerskit`/`mastervaultkey` (luck/speed/shop-discount/damage
  flavor — no dedicated "key" mechanic exists to hook, so these ride existing generic stat channels at
  their quality tier, `pools:[]`), and `luckytoken`/`jackpotcharm`/`arcadecrown` (the visit-ladder
  rewards, `pools:POOLS_ALL` since — unlike the 8 curated ones — they can also show up in normal pool
  draws once unlocked). `pools:[]` relies on `pickItemFromPool`'s `i.pools.includes(poolName)` filter,
  which an empty array never satisfies — the ONLY way to obtain those 8 is the matching filly's
  capstone feed. All 11 are wired into `systems/items-1.js`'s `recalcPlayerStats` under their own
  "Phase 4 overhaul — Arcade batch" comment markers across the luck/speed/melee-damage/ranged-damage/
  crit-chance/bomb-radius/shop-discount channels.


---

<a id="part-4"></a>

# Part 4 — achievements/

## achievements/ — achievement definitions, unlock tracking, and the achievements panel UI

This directory is the mechanical split of what used to be one `achievements.js`: `core.js` (helpers + the two data-generating factories), `defs-1.js` through `defs-6.js` (1709 `addAchievement`/`addTierSet` calls, executed in file order, all pushing into the same `ACHIEVEMENTS` array), and `logic.js` (the lookup index, unlock/save logic, and the panel-building UI). All files share one global scope and rely on load order: `core.js` first (declares `ACHIEVEMENTS`, `addAchievement`, `addTierSet`), then `defs-1..6.js` populate it, then `logic.js` builds the index over the finished array and defines everything that reads/writes `localStorage`.

### achievements/core.js

Header comment documents the whole `nightfallUnlocks` localStorage shape (the `unlocks` object): `unlocks.achievements` (`{achId:true}`), `unlocks.<classId>` (character unlocked flags, read by `ui.js buildClassSelect`), `unlocks.unlockedItems`/`unlockedPickups`/`unlockedTrinkets`/`unlockedFamiliars`/`unlockedPillColors`/`unlockedEnemies` (each `{id:true}`, read by the matching `isXUnlocked` helper and by `room.js`'s pool-filtering functions to keep locked content out of spawn rolls), `unlocks.stats` (lifetime counters), and `unlocks.donationDiscounts` (`{buyableKind:true}`).

- **`ACHIEVEMENT_PICKUP_KINDS`** — `['doublebomb', 'goldbomb', 'doublekey', 'goldkey', 'sack', 'battery', 'minibattery']`, the special pickup kinds that start locked (see `data.js`'s `BOMB_TIER_POOL`/`KEY_TIER_POOL` and `room.js`'s `SACK_BATTERY_WEIGHTS`/`rollSackBatteryKind`).
- **`PICKUP_KIND_LABELS`** — display-name map for those seven kinds, used in unlock toasts and the panel's reward line.
- **Run-scoped unlock snapshot** (`_runUnlockSnapshot`, `beginRunUnlocks`, `endRunUnlocks`, `currentUnlocks`): while a run is live, spawn-roll gates must not see anything unlocked mid-run — an achievement earned during a run is banked for the *next* run only. `game.js`'s `startRun` calls `beginRunUnlocks()`, which snapshots `ensureUnlockShape(loadUnlocks())` into `_runUnlockSnapshot`; the two run-end transitions (win/gameover) call `endRunUnlocks()` to null it out again. `currentUnlocks()` returns the snapshot if one exists, otherwise re-reads live storage — so menus/bestiary/room-editor previews outside a run always see the newest unlocks, while in-run pool rolls stay frozen to what existed at `startRun`. Because `loadUnlocks()` reparses JSON from localStorage every call, the snapshot object is independent of whatever `saveUnlocks()` writes later, so a mid-run unlock genuinely cannot leak into the snapshot.
- **`isPickupKindUnlocked(kind)`** — non-achievement pickup kinds (not in `ACHIEVEMENT_PICKUP_KINDS`) are always available (`true`); the seven listed ones check `currentUnlocks().unlockedPickups[kind]`.
- **`isTrinketUnlocked`/`isFamiliarUnlocked`/`isStarUnlocked`/`isPillColorUnlocked`/`isEnemyUnlocked`** — identical one-liner pattern, each checking the matching `currentUnlocks().unlockedX[id]` bucket. `isPillColorUnlocked` gates the 40 `locked:true` swatches at the tail of `data.js`'s `PILL_COLORS` (read by `room.js`'s `rollRandomPillColorId`, the single chokepoint both the room spawner and `grantPickupEffect` go through). `isEnemyUnlocked` gates the 60 `locked:true` tail entries of `enemies.js`'s `ENEMY_TYPES` (read by `room.js`'s `resolveGenericEnemy` at every pool-filter step).
- **`ACHIEVEMENTS`** — the master array, empty in `core.js`; every `defs-*.js` file pushes into it via `addAchievement`.
- **`_achvIndexReady`** (`var`, deliberately not `let`) — a flag that starts `false`. `addAchievement` only pushes to the array while it's false; `logic.js` builds `ACHIEVEMENTS_BY_ID` and the `_ACHV_BY_*` Maps in one pass over the finished array and then sets this to `true`. From then on, `addAchievement` also calls `indexAchievement(def)` for anything pushed afterward, so the array and the index can never drift apart regardless of where new `addAchievement`/`addTierSet` calls are later added (before or after `logic.js` runs). It must be `var`, not `let`: `addAchievement` runs hundreds of times across `defs-1..6.js`, all of which load *before* `logic.js` — a `let` binding would sit in its temporal dead zone until `logic.js`'s declaration executes, throwing on every earlier read.
- **`addAchievement(def)`** — `ACHIEVEMENTS.push(def); if (_achvIndexReady) indexAchievement(def);`. The single append point for every achievement definition, single or tier-generated.
- **`TIER_NUMERALS`** — `['I','II',...,'XII']`, used to auto-suffix tier names (`' I'`, `' II'`, ...) when a tier count exceeds 12 it falls back to `(i+1)`.
- **`TIER_REWARD_KEYS`** — `['itemId','trinketId','familiarId','starId','pickupKind','pillColorId','enemyId','classId','shopDiscount']`, every reward field `unlockAchievement`'s if/else chain knows how to grant; `addTierSet` copies whichever one each tier object carries, untouched, onto the generated def.
- **`addTierSet(spec)`** — declares a graduated ladder ("defeat 10/50/200 of X") in one call instead of N near-identical `addAchievement` blocks. For each entry `tier` in `spec.tiers` (0-indexed as `i`), it builds one def:
  - `id`: `spec.baseId + '_t' + (i+1)` — built from the tier's 1-based **index**, not its threshold, so retuning a threshold later never orphans a player's already-earned unlock (an id never changes just because the number attached to it changed).
  - `name`: `tier.name` if given, else `spec.name(n, i)` if `spec.name` is a function, else `spec.name` with `' ' + TIER_NUMERALS[i]` appended (only when `tiers.length > 1`).
  - `icon`: `tier.icon || spec.icon`.
  - `desc`: `spec.desc(n, i)` if a function, else the plain string.
  - `category`: `spec.category`.
  - Exactly one predicate shape is copied onto the def depending on what `spec` carries: `statKey` (a plain lifetime-stat ladder — `def.threshold = n`), or `bestiarySection` + `bestiaryId` (a per-id bestiary ladder — `def.threshold = n`), or `bestiarySection` + `distinct:true` (a bestiary-breadth ladder — `def.distinctThreshold = n` instead of `def.threshold`).
  - Every key in `TIER_REWARD_KEYS` present on the tier object is copied onto the def as-is.
  - The finished def is pushed via `addAchievement(def)`.
  Because ids are `baseId + '_t<n>'`, an id can only collide with another achievement if `baseId` itself collides — which is why every `baseId` stays category-prefixed (`'slayer_'`, `'exploration_'`, ...).
- **`NEW_CLASS_REWARD_ITEMS` / `NEW_CLASS_REWARD_FAMILIARS` / `NEW_CLASS_REWARD_STARS`** *(declared in `defs-1.js`, not `core.js` — see note below)* — flat id lists feeding `SUPERBOSS_REWARDS`. Items: 4 original (Dragon/Windigo/Kelpie/Breezie era) + 28 more added for the four C-branch superbosses, flipped from unlocked to `locked:true` in `data.js`, + 50 new locked items (Phase 7a, `data/items-5.js`). Familiars: 4 original + 21 (trinket-expansion era) + 47 (the 15→20 character expansion) + 40 (Phase 7a, `data/familiars-2.js`). Stars: 4 original + 8 (the remainder of `STAR_TYPES` at the time) + 25 (Phase 7a, `data/collectibles.js`). Phase 7a's remaining 60 of its 175 slots are new locked trinkets, which join the pool automatically via the `TRINKET_LIST` filter rather than being named here.
- **`SUPERBOSS_REWARDS`** *(also `defs-1.js`)* — one flat array built by concatenating: every locked, non-donation, non-`pendingReward` trinket from `TRINKET_LIST` (mapped to `{trinketId:t.id}`), the 7 `ACHIEVEMENT_PICKUP_KINDS` (mapped to `{pickupKind:k}`), then the three `NEW_CLASS_REWARD_*` lists (mapped to `{itemId}`/`{familiarId}`/`{starId}`). Its length must exactly equal `SUPERBOSSES × CLASSES` — **22 × 25 = 550 as of Phase 7a**, which added 7 superbosses and therefore 175 new reward slots — see the loop below.
- **Superboss/completionist generating loops** *(also in `defs-1.js`, immediately after the reward pool — the doc comment at the top of `core.js` calls these out as belonging to `core.js` logically, but they physically live in `defs-1.js` since the mechanical split didn't separate "helpers" from "the first slice of definitions" cleanly)*:
  - The **superboss grid**: `for (const bossId in SUPERBOSSES) for (const classId in CLASSES)` — one achievement per (superboss × character) pair, id `'sb_' + bossId + '_' + classId`, category `'Superbosses'`, name `boss.name + ' — ' + cls.name`. A module-level counter `_rewardIndex` walks `SUPERBOSS_REWARDS` with **no modulo** — every reward must be used exactly once, so the pool's length must match the grid size exactly; a mismatch logs a `console.warn`. This makes adding a superboss or character a zero-code-change operation everywhere else *except* this reward pool's size, which must be kept in sync by hand.
  - The **completionist loop**: `for (const classId in CLASSES)` — one achievement per character, id `'completionist_' + classId`, category `'Completionist'`, reward always `itemId:'championscrown'` (an item that stacks, so beating the game fully with every character keeps compounding). `unlockAchievement` itself (in `logic.js`) checks after every `'Superbosses'`-category unlock whether all `Object.keys(SUPERBOSSES)` are now unlocked for that `classId`, and if so calls `unlockAchievement('completionist_' + classId, game)` — so both loops key off `SUPERBOSSES`/`CLASSES` dynamically and stay in sync automatically as bosses/characters are added, aside from the reward-pool-size caveat above.

### achievements/defs-1.js through defs-11.js — the achievement definitions

Treat these eleven files as one logical unit: sequential `addAchievement(def)` / `addTierSet(spec)` calls executed at load time, each appending to `ACHIEVEMENTS` (2627 entries total as of Phase 7h's Void Between PART 1 sub-batch). The split across files is purely mechanical (file size), not thematic — e.g. `defs-1.js` covers character unlocks, superbosses, completionist, and most of the original "Miscellaneous" batch, while later files add "Slayer"/"Mastery"/"Exploration"/"Collection"/"Challenge"/"Stars" content layered on in later passes; `addTierSet` usage is concentrated in `defs-3.js` (125 calls), `defs-4.js` (133), `defs-5.js` (34), `defs-6.js` (4: `shrine_visits` from Phase 3 overhaul, plus Phase 4 overhaul's `arcade_visits`), `defs-7.js` (20 — see the Phase 7f subsection below), `defs-8.js` (33 — see the Phase 7g subsection below), `defs-9.js` (66 — see the Phase 7h Observatory subsection below), `defs-10.js` (66 — see the Phase 7h Orrery subsection below), and `defs-11.js` (33 — see the Phase 7h Void Between PART 1 subsection below), while `defs-1.js`/`defs-2.js` use plain `addAchievement` only.

**Distinct `category` values found** (grep for `category:`): `Characters`, `Superbosses`, `Completionist`, `Slayer`, `Mastery`, `Exploration`, `Collection`, `Challenge`, `Donations`, `Stars`, `Miscellaneous`. (`ACHIEVEMENT_CATEGORY_ORDER` in `logic.js` lists all of these except `Stars`, which — like any category not in that list — still renders, appended after the listed ones by `buildAchievementsPanel`'s "leftovers" pass.)

**Schema — every field observed across the definitions:**

- `id` (string, required, unique) — persisted as the localStorage key in `unlocks.achievements`; must never change once shipped, which is exactly why `addTierSet` mints ids from tier *index* rather than *threshold*.
- `name` (string, required) — display name shown once earned; `'???'` is shown instead while locked.
- `icon` (string, required) — an emoji; shown once earned, `'❓'` shown instead while locked.
- `desc` (string, required) — flavour text / unlock condition, shown once earned.
- `category` (string, required) — the panel's grouping key; also the value `unlockAchievement` checks (`=== 'Superbosses'`) to drive the completionist cascade.
- **Predicate fields** (a def carries exactly one of these three shapes, indexed by `logic.js`'s `indexAchievement`):
  - `statKey` + `threshold` — watched by `bumpStat`; unlocks once `unlocks.stats[statKey] >= threshold`.
  - `bestiarySection` + `bestiaryId` + `threshold` — watched by `checkBestiaryAchievements`'s per-id path; unlocks once `unlocks.bestiary[bestiarySection][bestiaryId] >= threshold`. Used for "defeat this specific enemy N times" ladders.
  - `bestiarySection` + `distinctThreshold` (no `bestiaryId`) — watched by `checkBestiaryAchievements`'s breadth path; unlocks once `Object.keys(unlocks.bestiary[bestiarySection]).length >= distinctThreshold`. Used for "have seen N different X" achievements.
  - Some achievements (boss/floor triggers, "win with 1 heart", "spend your last coin", the three character-unlock boss-kill triggers, etc.) carry **none** of these — they're unlocked by a bespoke one-off `unlockAchievement(id, game)` call from elsewhere in the codebase (e.g. `game.js`'s `onBossDefeated`, `recordWin`, `shop.js`'s purchase logic) rather than a threshold sweep.
- **Reward fields** (a def carries at most one; `unlockAchievement` grants whichever is present, `buildAchievementsPanel` renders whichever is present):
  - `classId` — unlocks a playable character (`unlocks[classId] = true`); used only in the "Characters" category. **Never** combine with another reward field or with an already-unlocked class — see the explicit warning in `defs-1.js` about the three "reworked signature attack" achievements deliberately omitting `classId` even though they live in the Characters category, because their class is already unlocked by a different achievement and a second `classId` grant would fire a bogus "New class unlocked" toast.
  - `itemId` — permanently unlocks an item into `data.js`'s `ITEMS` pools (`unlocks.unlockedItems[itemId] = true`).
  - `trinketId` — unlocks a trinket (`unlocks.unlockedTrinkets`).
  - `familiarId` — unlocks a familiar (`unlocks.unlockedFamiliars`).
  - `starId` — unlocks a star (`unlocks.unlockedStars`).
  - `pillColorId` — unlocks one of the 40 locked pill-color swatches (`unlocks.unlockedPillColors`).
  - `enemyId` — unlocks one of the 60 locked enemy types (`unlocks.unlockedEnemies`).
  - `pickupKind` — unlocks one of the 7 special pickup kinds (`unlocks.unlockedPickups`).
  - `shopDiscount` — grants a permanent -1c shop discount for one `SHOP_BASE_PRICES` kind (`unlocks.donationDiscounts[shopDiscount] = true`); used only by the "Donations" category ladder.
- **`addTierSet`-only artifacts**: entries generated by `addTierSet` differ from hand-written `addAchievement` calls in that (a) their `id` always ends in `_t1`/`_t2`/`_t3`... rather than a hand-chosen suffix; (b) their `name` is usually auto-suffixed with a roman numeral (`' I'`, `' II'`, `' III'`) rather than spelled out per-tier; (c) `desc` is typically a function of the threshold (`n => '...' + n + '...'`) so the three rungs share one template instead of three hand-typed strings; (d) they always carry either `threshold` or `distinctThreshold` (never a bespoke no-predicate trigger — `addTierSet` has no way to express that).

**Example entries, verbatim:**

A simple single-tier achievement with a stat predicate and item reward (`defs-1.js`):
```js
addAchievement({ id:'deepdiver', name:'Deep Diver', icon:'🕳️',
  desc:'Reach Floor 9.', category:'Miscellaneous', itemId:'voidcharm' });
```
(Note: this one has *no* `statKey`/`threshold` at all — it's floor-reached, a bespoke trigger fired from elsewhere.) A genuine stat-threshold example:
```js
addAchievement({ id:'secretkeeper', name:'Secret Keeper', icon:'🗝️',
  desc:'Discover 15 secret rooms.', category:'Miscellaneous', itemId:'whisperingkey', statKey:'secretRoomsFound', threshold:15 });
```

A tiered ladder generated by `addTierSet`, three rungs, each with a different reward type (`defs-3.js`):
```js
addTierSet({ baseId:'slayer_gutterrat', name:'Gutter Rat Hunter', icon:'💀',
  category:'Slayer', bestiarySection:'enemyKills', bestiaryId:'gutterrat',
  desc: n => 'Defeat ' + n + ' of the DNB Gutter Rat.',
  tiers:[ { threshold:5, trinketId:'heavywedge' }, { threshold:20, itemId:'ashensigil' }, { threshold:50, itemId:'slayertrophy_gutterrat' } ] });
```
This expands into three defs with ids `slayer_gutterrat_t1`/`_t2`/`_t3`, names `'Gutter Rat Hunter I'`/`' II'`/`' III'`.

A bestiary-breadth (`distinct:true`) tiered ladder (`defs-5.js`):
```js
addTierSet({ baseId:'exploration_objectsseen', name:'Cartographer', icon:'🗺️',
  category:'Exploration', bestiarySection:'objectsSeen', distinct:true,
  desc: n => 'Encounter ' + n + ' different kinds of obstacle.',
  tiers:[
    { threshold:8, familiarId:'mapmite' },
    { threshold:16, familiarId:'atlasbeetle' },
    { threshold:24, itemId:'starlitcompass' },
  ] });
```
(`spec.distinct` makes `addTierSet` write each tier's `threshold` into `distinctThreshold` on the generated def instead.)

A `pillColorId`-rewarding, no-predicate trigger achievement (`defs-3.js`):
```js
addAchievement({ id:'cbranch_entered', name:'Down the Storm Drain', icon:'🌧️',
  desc:'Find the drain on Floor 2 and set hoof on the drowned path (3C).',
  category:'Exploration', statKey:'cBranchFloorsVisited', threshold:1, pillColorId:'tar' });
```

A `shopDiscount`-rewarding Donations-ladder entry (`defs-1.js`):
```js
addAchievement({ id:'donation_50', name:'First Contribution', icon:'❤️',
  desc:'Donate 50c total to a donation machine.', category:'Donations', statKey:'donationTotal', threshold:50, shopDiscount:'heartRed' });
```

The superboss grid's programmatically-built entries look like (one of 375 as of Phase 5a — 15 superbosses × 25 classes, up from 300 before Phase 5a's 4 new classes — expanded by the loop in `defs-1.js`):
```js
{ id:'sb_polish_batpony', name:'Polish DNB — Bat Pony', icon:'<boss icon>',
  desc:'Defeat Polish DNB while playing as the Bat Pony.', category:'Superbosses', trinketId:'<some locked trinket id>' }
```

#### Phase 5b overhaul — meta-progression / achievement sweep (`defs-6.js`)

Appended just before the lookup-index build (same insertion point
`shrine_visits`/`arcade_visits` used). 14 `addAchievement`/`addTierSet`
calls, expanding to 16 achievement entries total, filling in coverage gaps
across Phases 1-4 plus 3 new lifetime tracks — see the header comment
directly above this block in `defs-6.js` for the full list and each one's
reachability trace. Highlights:

- **Reward-economy discovery**: before writing this batch, an audit of
  every reward field across ALL ~1816 achievements (including the ones the
  `sb_<boss>_<class>` loop mints programmatically via
  `NEW_CLASS_REWARD_ITEMS`/`_FAMILIARS`/`_STARS` and the `TRINKET_LIST`
  filter — these don't show up as a literal `itemId:'...'` string in the
  source, so a naive grep for that pattern misses them) found the game's
  entire reward economy nearly fully claimed: only 18 never-granted reward
  ids exist anywhere (1 locked item, 17 locked familiars) — every locked
  trinket, pill color, locked enemy, star, and `shopDiscount` kind is
  already spoken for by an existing achievement. That headroom, not the
  "roughly 12-18" sizing guidance, is what actually shaped this batch: one
  real 3-tier `addTierSet` ladder (`mastery_vulnerable`, spending 3 of the
  18 free ids) and 13 single-tier `addAchievement` entries (13 more),
  leaving 2 ids (`broodmite`/`sporemother`) still unclaimed. Verified with
  a full duplicate-grant sweep over every achievement's reward field after
  writing this batch: zero new collisions (the only duplicate grant found
  anywhere in the game is `championscrown`, shared by design across all 25
  pre-existing `completionist_<class>` achievements).
- **Phase 1 leftovers**: `mastery_vulnerable` (3-tier ladder, reuses the
  existing `enemiesMarkedVulnerable` stat past Gargoyle's own unlock
  threshold); `synergy_ecosystem` (Synergy A / Ecosystem Set going active,
  backed by a NEW one-shot stat `ecosystemSetActivations` — synergies are
  recomputed live every `recalcPlayerStats` call rather than being a
  persistent counter, so `items-1.js`'s `recalcPlayerStats` now bumps this
  stat exactly once per run, guarded by a new `player._ecosystemSetSeen`
  flag, the first time `ecosystemSetActive` is seen true).
- **Phase 2 leftovers**: `slayer_boss_eclipsewraith`/`slayer_boss_ironbastion`
  (the two new Crypt/5C bosses, same single-tier Predicate B shape the
  twelve pre-existing `slayer_boss_*` entries use — bosses already route
  through the same `handleEnemyDeath` → `bumpBestiaryCount('enemyKills',
  ...)` call regular enemies do, no new call site needed); one
  representative achievement (`slayer_gutterskirmisher`) for Phase 2's new
  `skirmisher` behavior family rather than one per new enemy id (10
  skirmisher/whiplash ids exist across Phases 1-2 — the pre-existing
  distinct-breadth ladder `exploration_fieldguide` already rewards
  discovering/killing every new id at least once for free, so a full
  per-id sweep would be pure volume without new coverage).
- **Phase 3 leftovers**: `exploration_destroy_thornbush`/
  `exploration_destroy_luckcrystal`, same single-shot "destroy this
  obstacle kind" shape (Predicate B, `bestiarySection:'objectsDestroyed'`)
  as the existing 15-kind batch in `defs-5.js` — both obstacles already
  route through `damageObstacleHit`'s existing `bumpBestiaryCount` call.
- **Phase 4 leftovers**: three NEW stats, all in `logic.js`'s
  `statDefaults` and all bumped at real call sites in `shop.js`:
  `arcadeFilliesFed` (every successful `feedArcadeFilly` feed, all 5
  filly kinds including battery, which has no capstone), `arcadeMachinesUsed`
  (every successful `useArcadeMachine` use, all 3 machine kinds),
  `arcadeFillyCapstonesReached` (every time any filly's `fedCount` crosses
  its own capstone and `filly.done` flips true — 4 of the 5 kinds have one,
  battery doesn't). Backing achievements: `arcade_fillies_fed` (threshold
  75), `arcade_machines_used` (threshold 50), `arcade_filly_capstone`
  (threshold 1 — first capstone of any kind, not a grind ladder).
- **New general meta-progression**: `challenge_frugal_run` — win a run
  without ever entering a Shop. Bespoke Predicate-D trigger (no `statKey`),
  same shape as `onehearted`/`challenge_onehearted_flawless`: a new
  `player.visitedShopThisRun` flag (entities.js), set the first time
  `game.js`'s `enterRoom` sees a first-visit `type === 'shop'`, checked
  once in `logic.js`'s `recordWin`. `mastery_firering`/
  `mastery_changelingsummons`/`mastery_turretsbuilt` — single-tier
  achievements for Phase 5a's three "orphaned" stats
  (`fireRingHits`/`changelingMinionsSummoned`/`turretsBuilt`), which were
  deliberately left without any achievement of their own in Phase 5a
  precisely because using them to gate their OWN class's unlock would have
  been circular (see the Phase 5a section above) — that comment explicitly
  flagged them as "still available for a future non-unlock
  achievement/ladder," which these three now are. Single-class-only stats
  are not a reachability problem here, same reasoning as the pre-existing
  Windigo/Kelpie/Breezie signature-attack ladders: the class must already
  be unlocked (via its own, now-corrected, universal-stat achievement)
  before a player can rack up hits/summons/turrets to earn these.

**A pre-existing staleness note, found but NOT fixed (flagged for a future
pass, out of this task's scope)**: `defs-5.js`'s `challenge_wins_allclasses`
("Every Last Pony") still reads `Object.keys(unlocks.winsByClass).length >=
20` with flavour text "Win a run with all 20 characters" — both the
threshold and the text predate Phase 5a's 4 new classes and were never
updated, so as of this file the achievement now unlocks 5 classes short of
literally "all" of them (20 of 25). It is still reachable and still fires
correctly at its own threshold; the `20` is now just stale relative to
`CLASSES`'s real size, not a broken predicate — left alone here since
correcting the intended threshold is a design judgement call beyond a
docs/achievement-coverage pass.

#### Phase 7f — Hollow Chorus / Final Waveform main-route achievement batch (`defs-7.js`)

New file, loaded after `defs-6.js` and before `logic.js` (index.html script order). 92 achievements across 4 categories, covering Phase 7b's two new main-route floors — floorKey `'13'` ("The Hollow Chorus") and floorKey `'14'` ("The Final Waveform") — and their 4 new regular bosses (`lastovertone`/`hollowcantor`/`flatlinewraith`/`zeroamplitude`). Does **not** touch the pre-existing `sb_wobbler_<class>`/`sb_subdrop_<class>` superboss grid (`defs-1.js`'s `SUPERBOSS_REWARDS` loop). Full design rationale, the reward-economy grep evidence, and exact verification output live in `feature-research/phase7f-mainroute-achievements/audit.md`.

- **Reward-economy finding that shaped the whole batch**: `shopDiscount` (11/11 kinds already claimed), `pillColorId` (40/40 `locked:true` `PILL_COLORS` claimed) and `enemyId` (60/60 `locked:true` `ENEMY_TYPES` claimed) are all fully exhausted — none is usable without silently colliding with an existing achievement's grant. So the batch mints 78 brand-new single-purpose "trophy" passive items (`hcfwtrophy_*`, appended to `items-5.js`, `locked:true`/`unlockedBy:'<achId>'`, same shape as the Slice 7/8 trophy batches) for the bulk of the rungs — genuinely collision-free since every id is freshly minted — and 14 freshly-minted capstone pickups (6 trinkets in `trinkets-2.js` with `pendingReward:true` so `SUPERBOSS_REWARDS`'s `TRINKET_LIST.filter` sweep skips them, 5 items in `items-5.js`, 3 `behavior:'orbiter'` familiars in `familiars-2.js`) for the ladder-capstone/hardest-Challenge/full-completion rungs. Every one of the 78 trophies and 14 capstones is wired into a real `recalcPlayerStats` formula term in `items-1.js` (5 round-robined channels for the trophies: luck/speed/meleeDamage/rangedDamage/fire-rate at that channel's smallest existing magnitude; each capstone into its own thematically-matched channel — see the `// Phase 7f` comments throughout `items-1.js`) — none is a name-only inert reward.
- **Slayer (60 achievements, 20 `addTierSet` calls)**: (A) 3-tier ladders (8/30/80) for the 4 brand-new floorKey `'14'` regular enemies; (B) 3-tier ladders (3/10/25) for the 4 brand-new bosses; (C) floorKey `'13'`'s 8 regular + 4 reskin enemies already had a Slayer achievement from an earlier phase (`defs-2.js` single T20 / `defs-4.js` 5/20/50 ladder) — rather than re-touch those ids, a SECOND 3-tier ladder on fresh `slayer2_*`-prefixed ids (60/150/300 for the 8 regulars, 100/250/500 for the 4 reskins) picks up past where the originals leave off.
- **Challenge (12 achievements, hand-wired Predicate D)**: every condition reuses an existing per-player/per-run flag — `tookDamageThisBossRoom`/`tookDamageThisFloor`/`tookDamageThisRun`/`redMax`/`visitedShopThisRun`/`game.runElapsed` — no new stat anywhere. Call sites: a new `if (superbossId === 'wobbler')`/`'subdrop'` block in `game.js`'s `onBossDefeated()` (mirrors the existing `polish`/`onetruednb` blocks) covers 10 of the 12; a new pair of `floorNum === 12`/`13` checks in `game.js`'s `startFloor()` (exact shape of the existing `deepdiver` `floorNum === 8` check) covers the remaining 2 (`challenge_hollowchorus_speedrun`/`challenge_finalwaveform_speedrun`).
- **Exploration (14 achievements)**: 2 floor-reach milestones (Predicate D, same `startFloor()` hook as the Challenge speedrun pair above) plus 12 Predicate B "first encounter" achievements (`bestiarySection:'enemyKills'`, `threshold:1`) over the 4 new bosses, `wobbler`/`subdrop`, the 4 new floorKey `'14'` enemies, and 2 of floorKey `'13'`'s reskin enemies — all riding the existing `handleEnemyDeath` → `bumpBestiaryCount` call, no new code.
- **Collection (6 achievements)**: distinct-breadth over JUST the floorKey `'13'`/`'14'` roster. No existing infra fits — `addTierSet`'s `distinct:true` predicate counts `Object.keys()` over an ENTIRE bestiary section bucket, not a scoped id subset, and `checkBestiaryAchievements` has no id-list parameter. So this is a small bespoke addition: three id-list consts (`HOLLOWCHORUS_ROSTER_IDS` (14), `FINALWAVEFORM_ROSTER_IDS` (6), `MAINROUTE_1314_SUPERBOSS_IDS` (2)) and one new function, `checkHollowChorusFinalWaveformCollection(game)`, both declared in `defs-7.js`; a new one-line hook in `combat-2.js`'s `handleEnemyDeath`, guarded by `HOLLOWCHORUS_FINALWAVEFORM_WATCH_IDS.has(enemy.type.id)` (a 22-id `Set`), calls it on every kill that could actually move the count. It reads the exact same `unlocks.bestiary.enemyKills` bucket `bumpBestiaryCount` already writes — no new stat, no new bestiary bucket.
- **Verified** (Node harness loading every `index.html` `<script>` except `main.js`/`ui.js`/`render.js`/`roomEditor.js`/`bestiary.js`, plus a live functional smoke test simulating kills through the real `bumpBestiaryCount`/`unlockAchievement` code path): `ACHIEVEMENTS.length` 1991 → 2083 (delta 92, exact); zero duplicate `id`s across the full array; zero reward-target collisions among this batch's `itemId`/`trinketId`/`familiarId` grants (the one pre-existing collision found game-wide, `championscrown` shared by all 25 `completionist_<class>` achievements, predates this batch and is intentional by design, see the `defs-1.js` comment); all 92 new minted pickups (78 trophies + 14 capstones) each referenced by exactly one achievement; none of the 6 new trinkets appear in `SUPERBOSS_REWARDS`'s consumed set.

#### Phase 7g — The Tangled Shallows (floor `'11C'`) C-branch achievement batch (`defs-8.js`)

New file, loaded after `defs-7.js` and before `logic.js`. 93 achievements across 4 categories, covering Phase 7c's new C-branch floor — floorKey `'11C'` ("Mangroves — The Tangled Shallows"), its 33-entry themed enemy roster, and superboss `mangrove`. Does **not** touch the pre-existing `sb_mangrove_<class>` superboss grid (`defs-1.js`'s `SUPERBOSS_REWARDS` loop). Follows Phase 7f's precedent closely (same reward-economy finding, same trophy-item strategy, same scoped-Collection-breadth approach). Full breakdown and verification trail: `feature-research/phase7g-cbranch-achievements/audit.md`.

- **Reward-economy**: `shopDiscount`/`pillColorId`/`enemyId` reward pools re-confirmed exhausted (same finding as Phase 7f). 80 freshly-minted single-purpose `mgtrophy_*` trophy items (`items-5.js`) for the Slayer/Exploration bulk, plus 13 freshly-minted capstone pickups — 5 trinkets in `trinkets-2.js` (`pendingReward:true`, skipped by `SUPERBOSS_REWARDS`'s `TRINKET_LIST.filter` sweep), 5 items in `items-5.js`, 3 `familiars-2.js` familiars — for ladder-capstone/Collection-grand/hardest-Challenge rungs. All 93 wired into real `recalcPlayerStats` formula terms in `items-1.js` — none inert.
- **Slayer (66 achievements, 33 `addTierSet` calls, 2 tiers each)**: bestiary kill-count ladders (`slayer_<enemyid>_t1`/`_t2`) over all 33 `'11C'` roster entries.
- **Exploration (14 achievements)**: `exploration_reach_11c` (floor-reach milestone, floorNum 10 hook in `startFloor()`), `exploration_meet_mangrove`, plus 12 Predicate-B "First Sight" achievements (`bestiarySection:'enemyKills'`, `threshold:1`) over a representative slice of the roster.
- **Challenge (7 achievements, hand-wired Predicate D)**: `challenge_mangrove_flawless`/`_floor_nodamage`/`_onehearted`/`_speedkill`/`_frugal`/`_untouched_run` (all in a new `superbossId === 'mangrove'` block in `onBossDefeated()`, reusing existing `tookDamageThisBossRoom`/`tookDamageThisFloor`/`tookDamageThisRun`/`redMax`/`visitedShopThisRun` — no new stat) plus `challenge_mangroves_speedrun` (floorNum 10 `startFloor()` check reusing `game.runElapsed`).
- **Collection (6 achievements)**: `collection_mangroves_roster_t1`/`_t2`/`_t3` (11/22/33 of the roster), `_flavors` (all 12 flavor variants), `_originals` (all 21 base behaviors), `_grand` (all 33 + `mangrove` = 34) — backed by a new bespoke `checkMangrovesCollection(game)` function (declared in `defs-8.js`, hooked into `combat-2.js`'s `handleEnemyDeath` via a Mangroves-scoped watch-id `Set`), reading the existing `unlocks.bestiary.enemyKills` bucket — no new stat, exact mirror of Phase 7f's `checkHollowChorusFinalWaveformCollection` pattern.
- **Verified** (same methodology as Phase 7f, re-run independently by the orchestrator after the implementer was cut off mid-session by an API limit — see the audit's provenance note): `ACHIEVEMENTS.length` 2083 → 2176 (delta 93, exact); zero duplicate `id`s across the full array; zero *new* reward-target collisions (the only collisions found, 24 on `itemId:championscrown`, are the pre-existing `completionist_<class>` share, unrelated to this batch); all 93 referenced reward-target ids cross-checked against their data-table definitions — zero missing/dangling references.

#### Phase 7h — The Observatory (floors `'4D'`/`'5D'`) D-branch achievement batch (`defs-9.js`)

New file, loaded after `defs-8.js` and before `logic.js`. 180 achievements across 4 categories, covering Phase 7d's first D-branch region — floorKey `'4D'` and floorKey `'5D'` ("The Observatory"), 33-entry themed enemy rosters on EACH floorKey (66 total), and superboss `astrolabe`. Does **not** touch the pre-existing `sb_astrolabe_<class>` superboss grid (`defs-1.js`'s `SUPERBOSS_REWARDS` loop). Follows Phase 7f/7g's precedent closely (same reward-economy finding, same trophy-item strategy, same scoped-Collection-breadth approach), scaled up for covering two floorKeys instead of one. Full breakdown and verification trail: `feature-research/phase7h-dbranch-achievements/audit-observatory.md`.

- **Reward-economy**: `shopDiscount`/`pillColorId`/`enemyId` reward pools re-confirmed exhausted (same finding as Phase 7f/7g). 160 freshly-minted single-purpose `obstrophy_*` trophy items (`items-5.js`) for the Slayer/Challenge/Exploration/Collection bulk, plus 20 freshly-minted capstone pickups — 6 trinkets in `trinkets-2.js` (`pendingReward:true`, skipped by `SUPERBOSS_REWARDS`'s `TRINKET_LIST.filter` sweep), 10 items in `items-5.js`, 4 `familiars-2.js` orbiter familiars — for ladder-capstone/Collection-grand/hardest-Challenge rungs. All 180 wired into real effects: 160 trophies round-robin across the same five `recalcPlayerStats` channels Phase 7f/7g used (luck/speed/meleeDamage/rangedDamage/fire-rate, 32 each); the 20 capstones land in whichever channel matches their flavor text (`+1 all attacks` in melee+ranged, `+1 heart container` via a new `items-2.js` `applyPassiveEffect` chain entry for `brasswardensplating`/`astrolabewardenplate`, crit chance for `shatteredlensfragment`, flat stun chance for `astralbeaconchit`, fire-rate for `cometshadowveil`/`eclipseveilcloak`, shop discount for `emptylenscase`) — none inert.
- **Slayer (144 achievements, 66 `addTierSet` calls)**: 2-tier ladders (10/40) for all 66 roster entries across both floorKeys (33 `'4D'` + 33 `'5D'`); 12 flagship enemies (6 per floorKey, one per distinct AI behavior family — splitter/summoner/shielder/ambusher/sniper/teleporter) get a 3rd tier (threshold 100) granting a unique capstone reward instead of another trophy.
- **Challenge (8 achievements, hand-wired Predicate D)**: `challenge_astrolabe_flawless`/`_floor_nodamage`/`_onehearted`/`_speedkill`/`_frugal`/`_untouched_run` (all in a new `superbossId === 'astrolabe'` block in `onBossDefeated()`, reusing existing `tookDamageThisBossRoom`/`tookDamageThisFloor`/`tookDamageThisRun`/`redMax`/`visitedShopThisRun` — no new stat) plus `challenge_observatory_4d_speedrun`/`_5d_speedrun` (floorNum 3/4 `startFloor()` checks reusing `game.runElapsed`, mirroring Phase 7f/7g's own speedrun checkpoints).
- **Exploration (21 achievements)**: `exploration_reach_4d`/`_5d` (floorNum 3/4 hooks in `startFloor()`), `exploration_meet_astrolabe`, plus 18 Predicate-B "First Sight" achievements (`bestiarySection:'enemyKills'`, `threshold:1`) over a representative slice of both rosters (9 per floorKey).
- **Collection (7 achievements)**: `collection_observatory_4d_t1`/`_t2`/`_t3` (11/22/33 of the `'4D'` roster) and the mirrored `_5d_t1`/`_t2`/`_t3` for `'5D'`, plus `collection_observatory_grand` (all 66 + `astrolabe` = 67) — backed by a new bespoke `checkObservatoryCollection(game)` function (declared in `defs-9.js`, hooked into `combat-2.js`'s `handleEnemyDeath` via an Observatory-scoped `OBSERVATORY_WATCH_IDS` `Set`), reading the existing `unlocks.bestiary.enemyKills` bucket — no new stat, exact mirror of Phase 7f/7g's collection-checker pattern, now split per-floorKey as well as combined.
- **Verified** (same Node-harness + functional-smoke-test methodology as Phase 7f/7g): `ACHIEVEMENTS.length` 2176 → 2356 (delta 180, exact — 144 Slayer + 8 Challenge + 21 Exploration + 7 Collection); zero duplicate `id`s across the full array; zero *new* reward-target collisions (the only collision found, `itemId:championscrown` shared by all 25 `completionist_<class>` achievements, predates this batch); all 180 new minted pickups (160 trophies + 20 capstones) each referenced by exactly one achievement; none of the 6 new trinkets appear in `SUPERBOSS_REWARDS`'s consumed set; functional smoke test confirmed a real kill sequence unlocking a Slayer rung, a Collection breadth tier, and the astrolabe Challenge block, each granting its real `recalcPlayerStats`-visible reward (luck/speed/heart-container all independently verified against a live `Player` instance).

#### Phase 7h (cont.) — The Orrery (floors `'6D'`/`'7D'`) D-branch achievement batch (`defs-10.js`)

New file, loaded after `defs-9.js` and before `logic.js`. 180 achievements across 4 categories, covering Phase 7's second D-branch region — floorKey `'6D'` and floorKey `'7D'` ("The Orrery"), 33-entry themed enemy rosters on EACH floorKey (66 total, polished brass clockwork rings and deep indigo sky, accent `#e0b45a`), and superboss `orrery` (siege body, reuses `bossBrickGolem` AI, icon 🪐). Does **not** touch the pre-existing `sb_orrery_<class>` superboss grid (`defs-1.js`'s `SUPERBOSS_REWARDS` loop — those 25 achievements are auto-generated from `SUPERBOSSES` and already reward-wired). Identical shape to Phase 7h's Observatory sub-batch (`defs-9.js`) — same reward-economy finding, same trophy-item strategy, same scoped-Collection-breadth approach, same 2-floorKey/66-enemy/1-superboss scale. Full breakdown and verification trail: `feature-research/phase7h-dbranch-achievements/audit-orrery.md`.

- **Reward-economy**: `shopDiscount`/`pillColorId`/`enemyId` reward pools re-confirmed exhausted (same finding as Phase 7f/7g/7h Observatory). 160 freshly-minted single-purpose `ortrophy_*` trophy items (`items-5.js`) for the Slayer/Challenge/Exploration/Collection bulk, plus 20 freshly-minted capstone pickups — 6 trinkets in `trinkets-2.js` (`pendingReward:true`, skipped by `SUPERBOSS_REWARDS`'s `TRINKET_LIST.filter` sweep), 10 items in `items-5.js`, 4 `familiars-2.js` orbiter familiars — for ladder-capstone/Collection-grand/hardest-Challenge rungs. All 180 wired into real effects: 160 trophies round-robin across the same five `recalcPlayerStats` channels earlier D-branch batches used (luck/speed/meleeDamage/rangedDamage/fire-rate, 32 each); the 20 capstones land in whichever channel matches their flavor text (`+1 all attacks` in melee+ranged for `gearclutchcore`/`gearblinkanchor`/`ringblinkanchor`/`brassringchronometer`/`apexchronometer`/`gearworkheart`/`orreryheart`/`stillmechanism`, `+1 heart container` via a new `items-2.js` `applyPassiveEffect` chain entry for `ringwardenplating`/`apexwardenplating`/`geartriadcore`, flat stun chance for `meridiansummonschit`/`zenithsummonschit`, fire-rate for `shadowcogveil`/`nightgearveil`, shop discount for `emptygearbox`; the two sniper-flagship familiars, `meridianmarksmandrone`/`apexsniperdrone`, carry their own `dmg`/`orbitSpeed` fields like every other familiar and need no `recalcPlayerStats` entry) — none inert.
- **Slayer (144 achievements, 66 `addTierSet` calls)**: 2-tier ladders (10/40) for all 66 roster entries across both floorKeys (33 `'6D'` + 33 `'7D'`); 12 flagship enemies (6 per floorKey, one per distinct AI behavior family — splitter/summoner/shielder/ambusher/sniper/teleporter: `geartwin`/`meridiancaller`/`ringwarden`/`shadowcog`/`meridianmarksman`/`gearblink` on `'6D'`, `geartriad`/`zenithcaller`/`apexwarden`/`nightgear`/`apexsniper`/`ringblink` on `'7D'`) get a 3rd tier (threshold 100) granting a unique capstone reward instead of another trophy.
- **Challenge (8 achievements, hand-wired Predicate D)**: `challenge_orrery_flawless`/`_floor_nodamage`/`_onehearted`/`_speedkill`/`_frugal`/`_untouched_run` (all in a new `superbossId === 'orrery'` block in `onBossDefeated()`, reusing existing `tookDamageThisBossRoom`/`tookDamageThisFloor`/`tookDamageThisRun`/`redMax`/`visitedShopThisRun` — no new stat) plus `challenge_orrery_6d_speedrun`/`_7d_speedrun` (floorNum 5/6 `startFloor()` checks reusing `game.runElapsed`, mirroring Phase 7h Observatory's own speedrun checkpoints).
- **Exploration (21 achievements)**: `exploration_reach_6d`/`_7d` (floorNum 5/6 hooks in `startFloor()`), `exploration_meet_orrery`, plus 18 Predicate-B "First Sight" achievements (`bestiarySection:'enemyKills'`, `threshold:1`) over a representative slice of both rosters (9 per floorKey).
- **Collection (7 achievements)**: `collection_orrery_6d_t1`/`_t2`/`_t3` (11/22/33 of the `'6D'` roster) and the mirrored `_7d_t1`/`_t2`/`_t3` for `'7D'`, plus `collection_orrery_grand` (all 66 + `orrery` = 67) — backed by a new bespoke `checkOrreryCollection(game)` function (declared in `defs-10.js`, hooked into `combat-2.js`'s `handleEnemyDeath` via an Orrery-scoped `ORRERY_WATCH_IDS` `Set`), reading the existing `unlocks.bestiary.enemyKills` bucket — no new stat, exact mirror of Phase 7h Observatory's collection-checker pattern.
- **Verified** (same Node-harness + functional-smoke-test methodology as Phase 7f/7g/7h Observatory): `ACHIEVEMENTS.length` 2356 → 2536 (delta 180, exact — 144 Slayer + 8 Challenge + 21 Exploration + 7 Collection); `node --check` clean on every touched file and on a full repo-wide sweep; zero duplicate `id`s across the full array; zero *new* reward-target collisions (the only collision found, `itemId:championscrown` shared by all 25 `completionist_<class>` achievements, predates this batch); all 180 new minted pickups (160 trophies + 20 capstones) each referenced by exactly one achievement; none of the 6 new trinkets appear in `SUPERBOSS_REWARDS`'s consumed set; every reward-target id referenced in `defs-10.js` cross-checked against its data-table definition — zero dangling references; functional smoke test confirmed a real kill sequence unlocking a Slayer rung (`slayer_gearhound_t1`) and a Collection breadth tier (`collection_orrery_6d_t1`), a direct `challenge_orrery_flawless` unlock, and `recalcPlayerStats` correctly applying a trophy's luck bonus, a heart-only capstone's damage-formula exclusion, a `+1 all attacks` item capstone, and a `+1 all attacks` trinket capstone — all independently verified against a live `Player`-shaped object.

#### Phase 7h (cont.) — The Void Between, PART 1 (floorKey `'8D'`) D-branch achievement batch (`defs-11.js`)

New file, loaded after `defs-10.js` and before `logic.js`. 91 achievements across 4 categories, covering the THIRD of ~4 sequential sub-batches for Phase 7's third D-branch region, The Void Between — this slice is JUST floorKey `'8D'` (floorNum 7), a 33-entry themed enemy roster (cold, empty, drifting derelict wreckage, dying starlight, accent `#9ab8ff`). Unlike defs-9.js's Observatory batch and defs-10.js's Orrery batch (each 2 floorKeys + 1 superboss, 180 achievements), `'8D'` has **no superboss of its own** — the region's superboss, `singularity`, sits on `'10D'` (floorNum 9) and belongs to the next sub-batch. Scaled down proportionally (roughly half of Observatory/Orrery's per-floorKey-plus-superboss shape, minus the superboss-adjacent Challenge content). Does **not** touch any superboss reward grid (there is none for this floorKey). Full breakdown and verification trail: `feature-research/phase7h-dbranch-achievements/audit-voidbetween-1.md`.

- **Reward-economy**: `shopDiscount`/`pillColorId`/`enemyId` reward pools re-confirmed exhausted (12/12 shop kinds, 40/40 pill colors, 60/60 locked enemies — same finding as every prior Phase 7f/7g/7h batch). 81 freshly-minted single-purpose `vbtrophy_*` trophy items (`items-5.js`) for the Slayer/Challenge/Exploration/Collection bulk, plus 10 freshly-minted capstone pickups — 3 trinkets in `trinkets-2.js` (`pendingReward:true`, skipped by `SUPERBOSS_REWARDS`'s `TRINKET_LIST.filter` sweep), 5 items in `items-5.js`, 2 `familiars-2.js` orbiter familiars — for the 6 flagship Slayer capstones, the 3 non-nodamage Challenge capstones, and the Collection grand (full-roster) capstone. All 91 wired into real effects: the 81 trophies round-robin across the same five `recalcPlayerStats` channels earlier D-branch batches used (luck/speed/meleeDamage/rangedDamage/fire-rate, ~16-17 each); the 10 capstones land in whichever channel matches their flavor text (`+1 all attacks` in melee+ranged for `hullshardcore`/`hullblinkanchor`/`voidchronometer`/`voidbetweenheart`, `+1 heart container` via a new `items-2.js` `applyPassiveEffect` chain entry for `driftwardenplate`, flat stun chance for `voidsummonschit`, fire-rate for `shadowhulkveil`, shop discount for `hollowdriftpouch`; `hulkmarksmandrone`/`coldstarwisp` carry their own `dmg`/`orbitSpeed` fields like every other familiar and need no `recalcPlayerStats` entry) — none inert.
- **Slayer (72 achievements, 33 `addTierSet` calls)**: 2-tier ladders (10/40) for all 33 roster entries; 6 flagship enemies (one per distinct AI behavior family not already showcased on a single trophy rung: splitter/summoner/shielder/sniper/teleporter/ambusher — `wreckhusk`/`voidcaller`/`driftwarden`/`hulkmarksman`/`hullblink`/`shadowhulk`) get a 3rd tier (threshold 100) granting a unique capstone reward instead of another trophy.
- **Challenge (4 achievements, hand-wired Predicate D)**: since `'8D'` has no superboss to anchor an `onBossDefeated()` block to, all 4 are floorKey-scoped instead — `challenge_voidbetween_8d_speedrun` (floorNum 7 `startFloor()` check reusing `game.runElapsed`, mirroring Phase 7h Observatory/Orrery's own speedrun checkpoints) plus `challenge_voidbetween_8d_nodamage`/`_frugal`/`_untouched` (a new `floorPath==='D' && dungeon.floorNum===7` block in `descend()`, placed right after the existing `floorsClearedNoDamage` bump — i.e. still on `'8D'`, one line before the D-branch progression advances `floorNum` — reusing existing `player.tookDamageThisFloor`/`visitedShopThisRun`/`tookDamageThisRun` — no new stat).
- **Exploration (12 achievements)**: `exploration_reach_8d` (floorNum 7 hook in `startFloor()`), plus 11 Predicate-B "First Sight" achievements (`bestiarySection:'enemyKills'`, `threshold:1`) over a representative slice (1/3) of the roster.
- **Collection (3 achievements)**: `collection_voidbetween_t1`/`_t2`/`_t3` (11/22/33 of the `'8D'` roster — 3 tiers rather than the per-floorKey-plus-region split defs-9/10 needed for their 2-floorKey slices, since this is a single floorKey with no region-wide grand tier) — backed by a new bespoke `checkVoidBetweenCollection(game)` function (declared in `defs-11.js`, hooked into `combat-2.js`'s `handleEnemyDeath` via a `'8D'`-scoped `VOIDBETWEEN_WATCH_IDS` `Set`), reading the existing `unlocks.bestiary.enemyKills` bucket — no new stat, exact mirror of Phase 7h Observatory/Orrery's collection-checker pattern.
- **Verified** (same Node-harness + functional-smoke-test methodology as Phase 7f/7g/7h Observatory/Orrery): `ACHIEVEMENTS.length` 2536 → 2627 (delta 91, exact — 72 Slayer + 4 Challenge + 12 Exploration + 3 Collection); `node --check` clean on every touched file and on a full repo-wide sweep; zero duplicate `id`s across the full array; zero *new* reward-target collisions (the only collision found, `itemId:championscrown` shared by all 25 `completionist_<class>` achievements, predates this batch); all 91 new minted pickups (81 trophies + 10 capstones) each referenced by exactly one achievement; none of the 3 new trinkets appear in `SUPERBOSS_REWARDS`'s consumed set; every reward-target id referenced in `defs-11.js` cross-checked against its data-table definition — zero dangling references; functional smoke test confirmed a real kill sequence unlocking a Slayer rung (`slayer_voidwisp_t1`) and a Collection breadth tier (`collection_voidbetween_t1`), a direct `challenge_voidbetween_8d_speedrun` unlock, and `recalcPlayerStats`/`applyPassiveEffect` correctly applying a trophy's luck bonus, a `+1 all attacks` item capstone (melee and ranged both verified), and a heart-container capstone's actual `redMax` increase — all independently verified against a live `Player` instance.

### achievements/logic.js

- **`ACHIEVEMENTS_BY_ID`** — plain object, `{id: def}`, built by `indexAchievement`.
- **`_ACHV_BY_STATKEY`** (Map: `statKey -> [def,...]`), **`_ACHV_BY_BESTIARY_ID`** (Map: `'section/id' -> [def,...]`, per-id count predicates only), **`_ACHV_BY_BESTIARY_SECTION`** (Map: `section -> [def,...]`, distinct-breadth predicates only), **`_ACHV_BY_CATEGORY`** (Map: `category -> [def,...]`, panel grouping) — the four lookup indexes that replace a linear scan of all ~1709 defs on every gameplay event.
- **`_indexPush(map, key, def)`** — helper: appends `def` to `map.get(key)`, creating the array on first use.
- **`indexAchievement(def)`** — populates all four structures for one def: always sets `ACHIEVEMENTS_BY_ID[def.id]`; pushes into `_ACHV_BY_STATKEY` if `def.statKey`; if `def.bestiarySection`, pushes into `_ACHV_BY_BESTIARY_ID` (keyed `section+'/'+bestiaryId`) when both `bestiaryId` and `threshold` are set, and/or into `_ACHV_BY_BESTIARY_SECTION` when `distinctThreshold` is set; always pushes into `_ACHV_BY_CATEGORY` keyed by `def.category || 'Miscellaneous'`. A top-level `for (const a of ACHIEVEMENTS) indexAchievement(a);` runs this over every def already pushed by `defs-1..6.js`, then `_achvIndexReady = true;` flips the flag so any *later* `addAchievement` call (there are none after this point in the normal load order, but the mechanism is generic) indexes itself immediately instead of waiting for a rebuild.
- **`ensureUnlockShape(unlocks)`** — the full localStorage save-shape definition; called on every read (`currentUnlocks`, `beginRunUnlocks`) and every write (`unlockAchievement`, `bumpStat`, etc.), so an old save missing any of these keys gets them filled in on first touch, migration-free. It ensures: `unlocks.achievements`, `.unlockedItems`, `.unlockedPickups`, `.unlockedTrinkets`, `.unlockedFamiliars`, `.unlockedStars`, `.unlockedPillColors`, `.unlockedEnemies`, `.winsByClass`, `.donationDiscounts` all default to `{}`; `unlocks.bestiary` defaults to `{}` and within it: `enemyKills`, `enemyDeaths` (both `{id:count}`), `objectsSeen`, `objectsDestroyed`, `seenItems`, `seenTrinkets`, `seenFamiliars`, `seenStars`, `seenPills`, `seenPickupKinds`, `seenRoomTypes`, `seenStages` (mostly `{id:true}` "seen" sets, a couple counts) each default to `{}`. It then merges `unlocks.stats` against a large `statDefaults` object via `Object.assign({}, statDefaults, unlocks.stats || {})` (existing progress is preserved, new counters default to 0/null) — the full counter list includes `secretRoomsFound`, `chestsOpened`, `rocksBombed`, `coinsSpent`, `cursedChestsOpened`, `enemiesKilled`, `bossesKilled`, `coinsCollected`, `goldChestsOpened`, `stoneChestsOpened`, `obstaclesDestroyed`, `bombsPlaced`, `shotsFired`, `critsLanded`, `itemsCollected`, `trinketsEquipped`, `familiarsCollected`, `deaths`, `wins`, `roomsCleared`, `shopPurchases`, `activeItemUses`, `meleeKills`, `rangedKills`, `donationTotal`, `pillsUsed`, `keysUsed`, `starsUsed`, `petshopsVisited`, `curseRoomsVisited`, `sacrificeSpikesTriggered`, `vaultsOpened`, `challengeRoomsCompleted`, `crystalRoomsVisited`, `sombraDealsTaken`, `swarmerdnbKilled`, `turretsDestroyed`, `bombBarrelsDetonated`, `treasureRoomsVisited`, `shopRoomsVisited`, `secretRoomsVisited`, `sacrificeRoomsVisited`, `vaultRoomsVisited`, `challengeRoomsVisited`, `sombraRoomsVisited`, `starRoomsVisited`, `shrineRoomsVisited` (Phase 3 overhaul — bumped in `game.js`'s `enterRoom`, same first-visit chain as the other `*RoomsVisited` counters, backing the `shrine_visits` `addTierSet` ladder in `defs-6.js`), `arcadeRoomsVisited` (Phase 4 overhaul — same chain, backing `arcade_visits` in `defs-6.js`), `rerollAltarUses`, `cBranchFloorsVisited`, `cBranchRunsCompleted`, `dBranchFloorsVisited`/`dBranchRunsCompleted` (Phase 7a — exact mirrors of the two C-branch counters, bumped from the same two places: `startFloor`'s `floorPath === 'D'` block once per D floor entered, and `descend`'s single `floorNum >= D_LAST_FLOORNUM` win branch once per won D run), `enemiesFrozen`, `enemiesMarkedVulnerable` (Phase 1 overhaul — the Gargoyle's `unlock_gargoyle` achievement counter, bumped alongside every Vulnerable-marking roll: `applyOnHitStatuses`, the `markedForDeath` attack-layer style), `runsStarted`, `totalPlaytime`, plus two "best of" (max/min, not additive) records `deepestFloor` (default 0) and `fastestWinSeconds` (default `null`). Finally it one-time-migrates a legacy top-level `unlocks.donationTotal` field into `unlocks.stats.donationTotal` (taking the max of the two) and deletes the old field. Returns the (mutated in place) `unlocks` object.
- **`isItemUnlocked(itemId)`** — `!!currentUnlocks().unlockedItems[itemId]`; reads the run-scoped snapshot while a run is live, per `currentUnlocks()`'s semantics from `core.js`.
- **`unlockAchievement(achId, game)`** — the core unlock-trigger function, idempotent (safe to call every time its condition holds true, not just once):
  1. Looks up `def = ACHIEVEMENTS_BY_ID[achId]`; bails silently if not found.
  2. Loads live storage (`ensureUnlockShape(loadUnlocks())`); bails if `unlocks.achievements[achId]` is already true (already earned).
  3. Sets `unlocks.achievements[achId] = true`.
  4. Grants exactly one reward via an if/else chain checking, in order: `def.classId` (sets `unlocks[classId] = true`), `def.itemId` (sets `unlocks.unlockedItems[itemId]`, remembers `rewardItem = ITEMS[itemId]`), `def.pickupKind` (sets `unlocks.unlockedPickups[kind]`), `def.trinketId`, `def.familiarId`, `def.starId`, `def.pillColorId`, `def.enemyId`, `def.shopDiscount` (sets `unlocks.donationDiscounts[shopDiscount]`) — each branch also stashes the resolved reward object (`rewardTrinket`/`rewardFamiliar`/etc.) for the toast built afterward.
  5. `saveUnlocks(unlocks)` persists immediately.
  6. Plays a sound and shows a toast: character unlocks get `Sound.play('unlock')` + `'New class unlocked: <name>!'`; everything else gets `Sound.play('achievement')` + a `'🏆 Achievement: <name> — unlocked <icon> <label>'` toast, where the icon/label are derived from whichever reward field fired (pill colors get a fixed `💊` stand-in icon, enemies get `👾`, since neither carries its own `icon` field the way an item/trinket/familiar/star does).
  7. Explicitly does **not** hand the reward to the player mid-run — the comment stresses this is by design: the reward becomes available for every run from now on, but the run in progress keeps consulting the unlock snapshot taken at `startRun`, so a mid-run unlock can't retroactively appear in that same run's spawns.
  8. **Completionist cascade**: if `def.category === 'Superbosses'`, it extracts `classId` from the achievement id (`achId.slice(achId.lastIndexOf('_') + 1)`), checks whether `unlocks.achievements['sb_' + bossId + '_' + classId]` is true for every `bossId` in `Object.keys(SUPERBOSSES)`, and if so recursively calls `unlockAchievement('completionist_' + classId, game)`.
- **`bumpStat(key, amount, game)`** — loads storage, adds `amount` to `unlocks.stats[key]` (defaulting missing keys to 0), saves, then looks up `_ACHV_BY_STATKEY.get(key)` and calls `unlockAchievement(a.id, game)` for every watcher whose `threshold` is now met — an index lookup instead of a scan of all ~1709 defs.
- **`setStatMax(key, value)` / `setStatMin(key, value)`** — "best of" records that only ever move in one direction (not additive, unlike `bumpStat`). Each loads storage, and only if `value` improves on the stored one does it write+save and return `true` (so callers — `game.js`'s `descend`/`main.js`'s win handling — can flash a "New personal best!" toast exactly when a record is actually broken); otherwise returns `false` without writing.
- **`bumpBestiaryCount(section, id, amount, game)`** — no-ops if `id` is falsy; loads storage, reads `bucket = unlocks.bestiary[section]`, computes `wasNew = !bucket[id]` (true the very first time this id is recorded in this section), adds `amount` to `bucket[id]`, saves, then calls `checkBestiaryAchievements(section, id, bucket, game, true)` (`checkCount=true`, so both per-id and breadth predicates are evaluated), and returns `wasNew` — used by `combat.js`'s `handleEnemyDeath` to fire a one-off "New Bestiary entry" toast only on an enemy's first kill.
- **`markBestiarySeen(section, id, game)`** — idempotent "have I seen this" flag, cheap to call on every pickup/encounter. No-ops if `id` is falsy or already `bucket[id]` truthy; otherwise sets `bucket[id] = true`, saves, and calls `checkBestiaryAchievements(section, id, bucket, game, false)` (`checkCount=false` — only breadth predicates matter here, since the bucket holds booleans, not counts, so a per-id-count predicate would be meaningless).
- **`activeGame()`** — returns the module-level `game` global from `main.js` if it exists, else `null`, wrapped in try/catch because `achievements.js` loads *before* `main.js` and `game` would otherwise be a TDZ reference error. Exists because `combat.js`/`game.js`/`items.js` call `bumpBestiaryCount`/`markBestiarySeen` without threading a `game` argument through; without this fallback a bestiary achievement would still unlock and still permanently join the pools, it just wouldn't hand the reward to the *current* run's state the way stat achievements do.
- **`checkBestiaryAchievements(section, id, bucket, game, checkCount)`** — the bestiary equivalent of `bumpStat`'s threshold sweep, called by both `bumpBestiaryCount` and `markBestiarySeen`. Resolves `g = game || activeGame()`. If `checkCount` is true, looks up `_ACHV_BY_BESTIARY_ID.get(section+'/'+id)` and unlocks every watcher whose `threshold <= bucket[id]`. Always (regardless of `checkCount`) looks up `_ACHV_BY_BESTIARY_SECTION.get(section)`; if present, computes `distinct = Object.keys(bucket).length` once and unlocks every watcher whose `distinctThreshold <= distinct`.
- **`recordWin(game, classId)`** — called on a run win. Calls `bumpStat('wins', 1, game)`, sets `unlocks.winsByClass[classId] = true` and saves, then checks the size of `winsByClass`: `>= 3` unlocks `'triplethreat'`, `>= 8` unlocks `'challenge_wins_8classes'`, `>= 20` unlocks `'challenge_wins_allclasses'` (20 = every key in `CLASSES`). Also checks `game.player.redMax <= 1` to unlock `'onehearted'` (Witheredapple), and additionally `!game.player.tookDamageThisRun` to unlock `'challenge_onehearted_flawless'`.
- **`ACHIEVEMENT_CATEGORY_ORDER`** — `['Characters', 'Superbosses', 'Completionist', 'Slayer', 'Mastery', 'Exploration', 'Collection', 'Challenge', 'Donations', 'Miscellaneous']`. The only place category display order is declared; `index.html`'s `#achievementsFilter` is All/Unlocked/Locked only, with no per-category buttons. Any category not listed here (e.g. `'Stars'`) still renders — `buildAchievementsPanel` appends unlisted categories found in `_ACHV_BY_CATEGORY` after these.
- **`_achvFilter`** — module-level string (`'all'`/`'unlocked'`/`'locked'`), the current panel filter, toggled by the click handler at the bottom of the file.
- **`buildAchievementsPanel()`** — rebuilds `#achievementsList`'s DOM from scratch:
  - Bails if `#achievementsList` isn't in the DOM.
  - Clears `wrap.innerHTML`, loads storage.
  - Writes `#achievementsSummary`'s text to `'<earned> / <total> unlocked'`.
  - Builds the category display order: `ACHIEVEMENT_CATEGORY_ORDER` plus any category found in `_ACHV_BY_CATEGORY` that isn't already listed.
  - `distinctSeen(section)` — a per-build memo (`distinctCounts` object) so `Object.keys(unlocks.bestiary[section])` is computed once per section per panel build rather than once per row.
  - Assembles the whole panel into a `DocumentFragment` (`frag`) before one single `wrap.appendChild(frag)` — the comment explains this replaced an earlier per-header live `appendChild` that forced a browser relayout partway through every filter click at ~850 rows (now ~1709).
  - Per category: gathers `inCat = _ACHV_BY_CATEGORY.get(cat)`, computes `catDone`, filters `shown` by `_achvFilter` (`all`/`unlocked && done`/`locked && !done`); skips the whole category (`continue`) if nothing survives the filter. Otherwise appends an `<h3 class="achv-category">` reading `'<cat> (<catDone>/<inCat.length>)'`, then a `<div class="achv-grid">` of rows.
  - Per achievement row (`<div class="achv-row done?">`): an icon div (`❓` if locked, `a.icon` if done), a text div containing: name div (`'???'` if locked, `a.name` if done); desc div — if done shows `a.desc`; if locked and `a.statKey` shows live progress `'<current> / <threshold>'` via `Util.formatNum`; if locked and it's a per-id bestiary predicate (`bestiarySection && bestiaryId != null && threshold != null`) shows `'<bucket[bestiaryId]> / <threshold>'`; if locked and it's a breadth predicate (`bestiarySection && distinctThreshold != null`) shows `'<distinctSeen(section)> / <distinctThreshold>'`; otherwise (no-predicate trigger achievements, still locked) shows `'Not yet earned.'`; and — only if the def carries any reward field (`classId`/`itemId`/`pickupKind`/`trinketId`/`familiarId`/`starId`/`shopDiscount`) — a reward div describing the specific unlocked item/trinket/familiar/star/discount by name+icon when done, or a generic placeholder ("a new character" / "an item" / etc.) when still locked, so the reward type is never a spoiler before it's earned.
- **The `#achievementsFilter` button click listener** (bottom of file) — for every `<button>` inside `#achievementsFilter` (index.html's achievementsScreen), on click: sets `_achvFilter = btn.dataset.filter`, toggles the `.active` class so only the clicked button has it, plays `Sound.play('uiClick')`, and calls `buildAchievementsPanel()` to redraw with the new filter.

### How this system fits together

A gameplay event never touches `ACHIEVEMENTS` or `ACHIEVEMENTS_BY_ID` directly — it calls one of the narrow tracking entry points (`bumpStat`, `bumpBestiaryCount`, `markBestiarySeen`), which do the storage write and then delegate threshold-checking to the pre-built Maps from `indexAchievement`. Concretely: `systems/combat-2.js`'s `handleEnemyDeath(game, enemy)` calls `bumpStat('enemiesKilled', 1, game)` unconditionally, then `bumpBestiaryCount('enemyKills', enemy.type.id, 1)` (feeding the per-id "defeat this specific boss/enemy N times" Slayer ladders), then conditionally `bumpStat('bossesKilled', 1, game)` / `bumpStat('swarmerdnbKilled', 1, game)` for special cases; the same file's ranged/melee attack-resolution code calls `bumpStat('rangedKills'|'meleeKills', 1, game)` and `bumpStat('critsLanded', 1, game)` inline as hits land, and `bumpStat('shotsFired', 1, game)` per shot fired. `game.js`'s `enterRoom`/`startFloor` call `bumpStat` for first-visit room-type counters (`petshopsVisited`, `curseRoomsVisited`, `cBranchFloorsVisited`, etc.) directly from the room-type dispatch. Each `bumpStat`/`bumpBestiaryCount`/`markBestiarySeen` call is O(1) plus O(watchers), not O(all achievements): `bumpStat('meleeKills', ...)` only iterates the handful of defs in `_ACHV_BY_STATKEY.get('meleeKills')`, and `bumpBestiaryCount('enemyKills', 'gutterrat', ...)` only iterates `_ACHV_BY_BESTIARY_ID.get('enemyKills/gutterrat')` plus (once) `_ACHV_BY_BESTIARY_SECTION.get('enemyKills')` for the breadth ladder — this is exactly why `indexAchievement` exists, since a linear scan of ~1709 defs on every single kill/shot/hit would be the alternative. Once a watcher's threshold is crossed, `unlockAchievement(id, game)` is called, which persists the earned flag, grants the reward into the appropriate `unlocks.unlockedX` bucket (available starting *next* run, per `currentUnlocks`'s run-snapshot semantics), toasts the player, and — for `'Superbosses'`-category unlocks specifically — recursively checks/unlocks the matching per-character `'Completionist'` achievement. The panel (`buildAchievementsPanel`) is purely a read-side view over the same `unlocks` blob and the same `ACHIEVEMENTS`/`_ACHV_BY_CATEGORY` structures; it never mutates unlock state itself.


---

<a id="part-5"></a>

# Part 5 — systems/ (dungeon, room, attack layers, combat)

## systems/ (part 1) — dungeon generation, room population, the layered-attack system, and core combat

### dungeon.js — procedural map graph generation

Header comment summary: the dungeon is built on a shared BLOCK grid (each block is `BLOCK` tiles square). Every room reserves the exact set of blocks its shape (polyomino `mask`) occupies, so a room's size actually shapes the map. Doors are per-BLOCK, not per-room: every block edge that faces *outside* the room's own shape is a door-slot candidate; an edge facing another block of the *same* room is an interior opening, not a candidate. Two rooms that end up touching get a door wherever both sides still have open, unpaired, un-disabled slots — so a wide shared wall between two ordinary rooms can end up with several doors — except "special" rooms (boss/treasure/shop/secret/petshop/curse/sacrifice/vault/challenge/crystal/sombra/star/cpathgate), which are always capped at exactly one entrance regardless of how many blocks they span.

Compact template fields consumed here (produced by room-editor.html): `m` (mask, required), `f` (allowed floor indices, 0-based, optional), `d` (disabled door sides — either a legacy direction string like `"NW"` disabling that whole facing across the template, or an array of `[col,row,dirLetters]` per-block entries), `p` (path tag: `'C'` means C-branch exclusive), `s` (spawners, consumed by room.js).

**Module state / constants**
- `DIRS` — the 4 compass directions as `{d,o,dx,dy}` (`d`=this direction, `o`=opposite).
- `SPECIAL_ROOM_TYPES` (Set) — every room type capped at exactly 1 door: boss, treasure, shop, secret, petshop, curse, sacrifice, vault, challenge, crystal, sombra, star, cpathgate, shrine, — Phase 4 overhaul — arcade, and — Phase 7a — planetarium (the D-branch gate, matching cpathgate's membership in both sets exactly). Centralizing this avoids a long `type==='x'||...` chain scattered through the code.
- `AUTO_OPEN_ROOM_TYPES` (Set) — room types whose doors start open at creation: start, secret, petshop, curse, sacrifice, challenge, crystal, sombra, cpathgate, planetarium (Phase 7a), shrine. Everything else (normal/boss/treasure/shop/vault, and — Phase 4 overhaul — arcade) starts locked (normal/boss lock behind combat via the safety net in room.js's `populateRoom`; treasure/shop/vault lock behind a key via combat.js's `keyLockedRoomFor`; arcade locks behind a flat coin toll via combat.js's `coinLockedRoomFor`/`tryUnlockCoinDoor` — the one special type that is neither auto-open nor key-locked).
- `let _roomIdSeq = 1` — monotonically-incrementing room id counter, consumed by `makeRoomInstance`.

**`blockKey(x, y)`** → `x + ',' + y`. String key for the `blockGrid`/pit `Map`s used throughout. Called everywhere a block-grid or per-cell lookup happens in this file.

**`isDoorDisabled(template, col, row, dir)`** → boolean. Reads `template.d`. If it's a string, checks `.includes(dir)` (legacy whole-facing disable). If it's an array, scans entries `[col, row, dirLetters]` for one matching this `(col,row)` whose `dirLetters` includes `dir`. Returns `false` if the template has no `d` at all. Called by `computeDoorSlots` and `tryPlaceAdjacent`.

**`obstacleAllowedOnFloor(kind, floorNum, floorPath)`** — THOROUGH. This is the "new stuff" pass's obstacle-kind floor/path gating, deliberately independent of which template an obstacle kind happens to be baked into, so it retroactively applies to every ROOM_TEMPLATES entry (hand-authored or procedural) without editing any of them. Logic:
  - `kind === 'sandtrap' || kind === 'cactus'` → allowed only when `floorPath !== 'C'` AND (`floorNum === 4 || floorNum === 5`) — i.e. stage 3 "The Sandswept Dunes" (floors 5-6 in HUD terms), main path only.
  - `kind === 'mud'` → allowed when (`floorPath !== 'C'` AND (`floorNum === 2 || floorNum === 3`)) OR (`floorPath === 'C'` AND (`floorNum === 4 || floorNum === 5`)) — stage 2 (Whitetail Forest) on the main path, or the Sewers on the C-branch.
  - `kind` is one of `'currentn'|'currents'|'currente'|'currentw'` (the streaming-current hazard) → allowed only when `floorPath === 'C'` (any C floor).
  - Everything else → always `true` (floor-agnostic, unchanged legacy behavior).
  Reads nothing global except its own params. Called only from `templateAllowsFloor`.

**`templateAllowsFloor(tmpl, floorNum)`** — THOROUGH. Gate that decides whether a ROOM_TEMPLATES entry is eligible for a given floor:
  1. `if (tmpl.f && !tmpl.f.includes(floorNum)) return false;` — respects the template's own explicit floor list.
  2. `const floorPath = currentFloorPath();` then `if (tmpl.p === 'C' && floorPath !== 'C') return false;` — a template tagged `p:'C'` is C-branch exclusive.
  3. If `tmpl.s` (spawners) exists, scans every spawner entry; for any obstacle spawner (`sp[2] === 'o'`) whose `obstacleAllowedOnFloor(sp[3], floorNum, floorPath)` returns false, the whole template is rejected. This is how a template that merely *contains* a path/floor-exclusive obstacle spawner gets excluded on floors/paths where that obstacle can't appear, without the template author having to separately set `f`/`p`.
  Reads: `currentFloorPath()` (defined below, or in room.js — see note), `obstacleAllowedOnFloor`. Called by `pickMaskForType`, `attachSecretRoom`, `attachSpecial`, `attachNextTo` — i.e. every place a template pool is filtered before picking.

**`computeDoorSlots(mask, originBx, originBy, template, room)`** — THOROUGH. For every occupied cell `(c,r)` in `mask`, for every one of the 4 `DIRS`, checks whether the neighboring cell in that direction is *interior* (in-bounds and also occupied by the mask) — if so, skip (no door slot there, it's inside the room's own shape). Otherwise pushes a slot object: `{ room, localCol, localRow, dir, bx, by, disabled, type:null, pairedSlot:null, opened:false, cells:null }`, where `bx/by` are the slot's absolute block coordinates (`originBx+c`, `originBy+r`) and `disabled` comes from `isDoorDisabled`. Returns the array of slots. This is the per-block door-eligibility computation the whole doors system is built on. Called by `makeRoomInstance`.

**`connectDoorSlots(a, b, type)`** — mutates: sets `a.type=b.type=type`, `a.pairedSlot=b`, `b.pairedSlot=a`. The only place two slots actually become "one door."

**`countRoomConnections(room)`** → number of *distinct* other rooms `room` has any paired door to (a Set of `pairedSlot.room.id`, so multiple doors to the same neighbor still count once). Called by `connectRoomDoors`.

**`connectRoomDoors(room, blockGrid, rooms, doorType)`** — THOROUGH. Called right after a room is placed to wire up doors to whatever it now touches:
  1. Bails immediately if `countRoomConnections(room) >= room.maxDoors`.
  2. Builds a `candidates` list: for every open (`!disabled && !pairedSlot`) slot on `room`, looks up the block on the far side in `blockGrid`; if it belongs to a different room, finds that other room's matching opposite-facing open slot at the same cell; if found, adds `{slot, oppSlot, other}`.
  3. If `room.maxDoors < Infinity` (a special room), shuffles the candidates — so which single entrance a special room gets isn't always whichever slot the mask happened to scan first (north/west-biased).
  4. Iterates candidates, connecting each pair via `connectDoorSlots` unless doing so would push `room` over its own cap OR push the far room over *its* own cap (checked from both ends, so neither side can be forced over its limit by the other's placement).
  Reads `blockKey`, `DIRS`, `Util.shuffle`. Mutates door slots via `connectDoorSlots`. Called by `tryPlaceAdjacent` and `attachSecretRoom`.

**`makeRoomInstance(type, originBx, originBy, mask, template)`** — constructs and returns a full room node object: `id` (from `_roomIdSeq++`), `type`, `gx/gy` (origin block), `shape:{mask}`, `template`, `doorSlots` (computed via `computeDoorSlots`), `tiles:null` (built lazily by room.js's `ensureRoomBuilt`), `doorsOpen: AUTO_OPEN_ROOM_TYPES.has(type)`, various state flags (`discovered/seen/revealed/visited/cleared` — `cleared` is `true` only for `type==='start'`), `populated:false`, empty content arrays (`enemies/obstacles/pickups/chests/itemPedestals`), `shopSlots:null`, `bossDefeated:false`, `stairsSpot:null`, `keyToastCooldown:0`, and `maxDoors: SPECIAL_ROOM_TYPES.has(type) ? 1 : Infinity`. Called by every placement function in this file (`tryPlaceAdjacent`, `attachSecretRoom`, `generateDungeon`'s start room, `attachSpecial`'s fallback loop).

**`roomBlockCells(room)`** → array of `{bx,by}` for every occupied mask cell, in absolute block coordinates. Called by `canPlace`, `commitPlace`, `attachSecretRoom`.

**`pickMaskForType(type, floorNum)`** → `{mask, template}`. Filters `ROOM_TEMPLATES[type]` through `templateAllowsFloor`; if any survive, picks one via `Util.choice` and returns its mask+template; otherwise falls back to `chooseShapeForNode({type})` (room.js) with `template:null`. Reads global `ROOM_TEMPLATES`. Called by `generateDungeon` (for `start` and repeatedly for `normal` rooms).

**`canPlace(blockGrid, room, radius)`** → boolean. `false` if the room has no cells, if any cell exceeds the Chebyshev `radius` bound (`Math.max(|bx|,|by|) > radius`), or if any cell is already occupied in `blockGrid`. Called by `tryPlaceAdjacent`, `attachSecretRoom`.

**`commitPlace(blockGrid, rooms, room)`** — mutates: adds `room` to the `rooms` Map keyed by id, and stamps every cell of `room` into `blockGrid` keyed by `blockKey`. Called by `tryPlaceAdjacent`, `attachSecretRoom`, `generateDungeon`.

**`tryPlaceAdjacent(blockGrid, rooms, fromRoom, dir, mask, template, type, radius)`** — THOROUGH. Attempts to attach a new room of the given `mask/template/type` to `fromRoom`'s `dir` side:
  1. Collects `fromRoom`'s own open door slots facing `dir` (`!disabled && !pairedSlot`), shuffled.
  2. Computes the new mask's own boundary cells that face the opposite direction (`dir.o`) and aren't door-disabled there, also shuffled.
  3. For every `(fromSlot, maskBoundaryCell)` pairing (nested loop, from-slots outer), computes the candidate room's origin so that boundary cell lands directly across from the from-slot, builds the room via `makeRoomInstance`, and if `canPlace` succeeds, commits it (`commitPlace`) and wires its doors via `connectRoomDoors(candidate, blockGrid, rooms, 'normal')`, returning the new room immediately (first successful placement wins — this is how the frontier-growth BFS-ish loop in `generateDungeon` places rooms one attempt at a time).
  4. Returns `null` if nothing fit.
  Called by `generateDungeon`'s normal-room growth loop, `attachSpecial`, and `attachNextTo`.

**`attachSecretRoom(rooms, blockGrid, radius, floorNum)`** — Picks a secret-room template (filtered by `templateAllowsFloor`) or falls back to a bare `[[1]]` mask. Rather than attaching to a specific existing room's door slot (like `tryPlaceAdjacent`), it brute-force scans every `(ox,oy)` in `[-radius,radius]^2`, builds a candidate room instance there, and if `canPlace` succeeds, scores it by how many *distinct* existing rooms it touches (`touching.size`) plus a small random jitter (`Math.random()*0.5`) to break ties without always favoring the first-scanned position; keeps the best-scoring candidate. Commits the winner and wires doors with `connectRoomDoors(..., 'secret')` (secret-type doors, i.e. hidden walls rather than ordinary doors). Returns the placed room or `null`. Called once by `generateDungeon`.

**`generateDungeon(floorNum)`** — THOROUGH, the top-level entry point. Algorithm:
  1. `radius = 8 + floorNum` — grows every floor (not just every other), keeping pace with the growing normal-room target.
  2. Places the start room at block `(0,0)` via `pickMaskForType('start', floorNum)` + `makeRoomInstance` + `commitPlace`.
  3. `targetNormal = 10 + 2*(floorNum+1)` normal rooms (floorNum is 0-based; `floorNum+1` is the HUD-displayed floor number).
  4. Frontier-growth loop (bounded by `guard < 3000`): picks a random room from the growing `frontier` array; for each of the 4 shuffled directions, with 60% probability (`Math.random() < 0.6`... actually the code is `if (Math.random() >= 0.6) continue;` so a 60% chance to attempt), picks a normal-type mask/template via `pickMaskForType` and tries `tryPlaceAdjacent`; on success pushes the new room onto the frontier and increments `normalCount`. If a room produced no successful placement in any direction, it's spliced out of the frontier (dead branch pruning).
  5. Picks one random normal room and flags `.forceSwarm = true` — every floor forces exactly one group of 5 low-HP Swarmer DNBs into a single random normal room, consumed later by room.js's `populateRoom`.
  6. BFS from the start room over paired doors (excluding `type==='secret'` doors, since distances should reflect the real traversable graph, not hidden walls) to compute `distances` (room.id → hop count from start) — used to find "farthest leaves."
  7. Local helper `degree(room)` — count of distinct neighbors via non-secret doors. `farthestLeaves()` — every `normal` room with `degree===1` (a dead end), sorted by descending distance from start (farthest-first).
  8. Local helper `attachSpecial(type)` — for each floor number's farthest-first leaf, for each shuffled direction, for each shuffled template in the type's filtered pool (or `[null]` if none), tries `tryPlaceAdjacent`; returns the first success. If nothing at any leaf fit, falls back to a last-resort pass over *every* room in the map with radius `+3`, still trying the real template pool first before ever dropping to a truly blank `[[1]]` mask — a documented bug fix: previously the fallback always dropped straight to a blank mask with no template, silently losing that special type's actual hand-authored content whenever it fell through here (common once petshop/curse/sacrifice/vault/challenge compete for the same limited leaf pool).
  9. Sequentially attaches: `bossNode` (always), `treasureNode` (always), `shopNode` (always), `secretNode` via `attachSecretRoom` (always attempted). Then per-floor coin-flip optionals via `Util.chance`: petshop 25%, curse 50%, sacrifice 50%, vault 10%, challenge 25%, star 30%.
  10. `cpathgateNode` — only on `floorNum === 1` (HUD Floor 2), the sole room in the game gated on a specific floor number rather than a coin flip. Always attaches when the floor is right (never randomly denied). Walking onto its pit calls `descend('C')` (game.js), diverting the run onto the 3C-10C branch.
  11. Local helper `attachNextTo(anchor, type)` — like `attachSpecial` but tries only the specific `anchor` room's free sides (no leaf search, no fallback) — returns `null` outright if nothing fits beside the anchor.
  12. Crystal/Sombra ("deal room") placement: only on `everySecondFloor = (floorNum % 2) === 1` (HUD floors 2,4,6…) AND only if `bossNode` exists. Because boss rooms are capped at `maxDoors:1` and that one door is already spent connecting the boss room to the map, `bossNode.maxDoors` is temporarily raised to 3 to allow room for both a crystal and sombra attach on top of the existing entrance, then always restored to 1 afterward (both re-sealing the boss room against later attaches — e.g. the second boss room on floorNum 8/9 — and keeping its saved shape identical to any other special room). The `['crystal','sombra']` attach order is shuffled because 6 of 7 boss templates disable a whole axis, leaving only one free door slot on a 2-block boss room — a fixed order would let whichever type went first always win that slot.
  13. `secondBossNode` — attached via `attachSpecial('boss')` only on `floorNum` 8/9/10/11 (9A/9B..12A/12B in HUD terms) **and only when `currentFloorPath()` is null** — a bonus, optional fight on top of the floor's real superboss. Deliberately not on floors 13/14/15 (floorNum 12/13/14), which get a single boss room only. The `currentFloorPath()` guard is a **Phase 7a bug fix**: the condition used to test floorNum alone, so the C-branch's floorNum 8/9 (9C/10C) incidentally satisfied it and generated a bonus boss room that path was never meant to have — and Phase 7a's new C floors (11C/12C) plus the whole D-branch (floorNum 3-9) would have widened the collision. The mechanic is main-route-only by design (it exists because 9A/9B..12A/12B each have a superboss *and* a spare branch-tagged boss roster). game.js's `onBossDefeated` withholds a `stairsSpot` here so clearing it can't skip the floor, and its `isBonusBossRoom` check is written to exactly the same shape — **keep the two in lockstep**.
  14. `planetariumNode` *(Phase 7a)* — the D-branch gate. Only on `floorNum === 2` (HUD Floor 3) and only when `currentFloorPath()` is null; like `cpathgateNode` it always attaches when the floor is right, so the choice is never randomly denied. The two gates deliberately sit on floors the other cannot appear on, so one run is never offered both. Stepping onto its platform calls `descend('D')` (game.js), diverting the run onto the 4D-10D branch. Its room is also the game's one room with a completely bespoke tile-layer paint pass — see render.js's `rebuildPlanetariumTiles`.
  14. Computes map `bounds` (`minX/maxX/minY/maxY`) by scanning every room's `gx/gy`.
  15. Returns `{ rooms, start, bossNode, treasureNode, shopNode, secretNode, petshopNode, curseNode, sacrificeNode, vaultNode, challengeNode, starNode, crystalNode, sombraNode, secondBossNode, cpathgateNode, planetariumNode, shrineNode, arcadeNode, bounds, floorNum }`.
  Reads: `ROOM_TEMPLATES` (indirectly), `Util.choice/shuffle/chance/randi`. Mutates: builds the entire `rooms` Map and `blockGrid` from scratch. Called by game.js (once per floor, presumably from `startFloor`/`descend`).

---

### room.js — tile-grid construction and room population

Header: turns a room node's polyomino shape into a tile grid, places doors/secret walls, and populates room contents.

**Tile constants**: `T_VOID=0, T_FLOOR=1, T_WALL=2, T_DOOR=3, T_SECRET=4, T_SECRET_OPEN=5`.

**`chooseShapeForNode(node)`** → `{name, w, mask}`-ish shape descriptor. `start` type always returns a fixed 1x1 `[[1]]`. `boss` picks `pickRoomShape(2,4)` (2-4 blocks, defined elsewhere — presumably utils/shapes). Treasure/shop/secret/petshop/curse/sacrifice/star/cpathgate/planetarium roll 65% chance of a 1-block shape (`pickRoomShape(1,1)`) vs 35% a 2-block shape (`pickRoomShape(2,2)`). Everything else (normal) gets `pickRoomShape(1,4)`. Called by `dungeon.js`'s `pickMaskForType` and `attachSpecial`/`attachNextTo` as the no-template fallback.

**`doorSlotCells(slot)`** — THOROUGH. Converts a door slot (block-space, from dungeon.js) into the exact 2 tile coordinates it occupies in its own room's *local* tile grid — always the middle 2 tiles of that block's 10-tile (`BLOCK`-tile) wall edge. For N/S doors: `y = dir==='N' ? r*BLOCK : (r+1)*BLOCK+1`, `x0 = 1 + c*BLOCK + 4`, returns `[{x0,y},{x0+1,y}]`. For E/W: mirrored on x/y. Called by `buildRoomTiles` (to carve door tiles) and by combat.js's `checkDoorTransition` (indirectly via `slot.cells`, which is populated by `buildRoomTiles` using this function).

**`buildRoomTiles(node)`** — Builds the actual 2D tile grid from `node.shape.mask`: sizes it `blockW*BLOCK+2` by `blockH*BLOCK+2` (1-tile void border all around), fills every occupied block's `BLOCK x BLOCK` footprint with `T_FLOOR`, then a second pass turns every `T_VOID` tile that orthogonally touches a `T_FLOOR` tile into `T_WALL` (the wall ring). Then, for every door slot on `node.doorSlots` whose `type` is `'normal'` or `'secret'`, computes its 2 cells via `doorSlotCells`, clips them to the grid bounds, stores them back onto the slot (`slot.cells = cells` — mutates the slot in place rather than a separate parallel doors structure), and stamps those grid cells `T_DOOR` or `T_SECRET` accordingly (slots with no live door get `slot.cells = null`). Returns `{grid, tileW, tileH}`. Called by `ensureRoomBuilt`.

**`ensureRoomBuilt(node)`** — Idempotent (`if (node.tiles) return;`). Calls `buildRoomTiles`, stores `node.tiles/tileW/tileH`. Note: `doorsOpen` is deliberately NOT set here (it's set at room creation time in dungeon.js's `makeRoomInstance`) — see header comment explaining why (treasure/shop rooms must already be correctly unlocked/relocked *before* their tiles are first built, since `ensureRoomBuilt` only runs on first entry, which for treasure/shop is always after the unlock already happened). Called by game.js (on entering a room) and combat.js's `openSecretPassage` (to force-build the neighbor room behind a just-opened secret wall).

**`roomFloorTiles(node, opts)`** → array of `{x,y}` floor-tile coordinates. Optionally excludes tiles within `opts.avoidCenter` of room center, and/or within `opts.avoidDoors` of any door slot's cells. Called by `populateRoomProcedural` (spot picking) and `rerollRoomEnemies` (reroll spot picking).

**`tileToPx(t)`** → `t*TILE + TILE/2`. Tiny helper, seemingly unused elsewhere in this file's own logic (present for callers wanting a quick tile→pixel-center conversion — not found being called from these 4 files' bodies besides its own definition, but kept as small shared utility).

**Room population — `populateRoom(node, dungeon, opts)`** — THOROUGH. The single entry point for filling a room with content, idempotent via `node.populated`.
  1. Resets all content arrays (`enemies/obstacles/pickups/chests/itemPedestals`), `shopSlots/donationMachine/rerollAltar = null`, and — Phase 4 overhaul — `fillies/machines = []`.
  2. `resetRoomEnemyBias()` — clears the module-level featured-enemy bias so this room rolls its own fresh bias on its first `resolveGenericEnemy` call.
  3. Dispatches to `populateRoomFromTemplate` if `node.template` exists, else `populateRoomProcedural`.
  4. Shop rooms always get a `donationMachine` (parked near one corner via `findNearestFloor`) and a `rerollAltar` (mirrored into the opposite corner, `uses:0`), regardless of whether the room came from a template — guaranteed fixtures independent of the shop's layout.
  5. Petshop rooms always get exactly one free familiar pedestal if the template didn't already place one (falls back to a free treasure-pool item if every familiar is still locked).
  5b. Shrine rooms (Phase 3 overhaul) — same "guaranteed regardless of template" pattern as petshop, but priced in coins: if no `isShrine` pedestal exists yet, adds one via `addShrinePedestal(node, pickItemFromPool('shrine'), spot.x, spot.y, coinCost)` at room center, `coinCost = Math.min(30, 8 + floorNum*3)` (mirrors shop.js's own per-floor price curve).
  5c. Arcade rooms (Phase 4 overhaul) — same "guaranteed regardless of template" pattern, guarded on `!node.fillies.length && !node.machines.length`: picks `Util.randi(2,4)` fixture kinds from the 8-kind pool (5 filly kinds + 3 machine kinds) via `Util.shuffle(...).slice(0,count)`, places each at a distinct spot from 8 shuffled grid-third candidates (deduped) via `findNearestFloor`, and pushes fillies (`{kind,x,y,fedCount:0,done:false}`) into `node.fillies` / machines (`{kind,x,y}`) into `node.machines`. See `systems/shop.js`'s `tryArcadeInteract` for what each kind does.
  6. Curse/vault/crystal/sombra rooms get NO automatic content — deliberately left to hand-authored templates only (comments explain why for each).
  7. Challenge rooms: if no item pedestal exists yet, adds one guaranteed item from the `'challenge'` pool at room center, and initializes `challengeStarted=false, challengeWave=0, challengeTotalWaves=5`.
  8. Sacrifice rooms: if no `spike` obstacle exists yet, adds one `Obstacle('spike', ...)` at room center.
  9. `node.forceSwarm` (set once per floor by dungeon.js's `generateDungeon` on one random normal room): spawns exactly 5 `swarmerdnb` enemies in a ring around room center, on top of whatever the room already has.
  10. Champion roll: for `normal` rooms only, if none of the room's enemies is already a champion, 5% chance to pick a random living non-boss enemy, flip `isChampion=true`, and double its already-constructed `hp/maxHp/dmg` (never re-derived from base type stats, so floor-curve/difficulty scaling stays baked in). Deliberately runs here (post-population) rather than in either spawn path, so it covers both template and procedural rooms with one piece of code.
  11. Safety net: for `normal`/`boss` rooms with zero enemies (e.g. an empty/broken template), forces `doorsOpen=true, cleared=true` immediately — otherwise the room would stay combat-locked forever since it never fires an enemy-death unlock event.
  12. Calls `computePitMasks(node)`.
  Reads: `resolveGenericEnemy`... indirectly via helpers, `findNearestFloor`, `pickFamiliarFromPool`, `addFamiliarPedestal`, `addItemPedestal`, `pickItemFromPool`, `Enemy`, `ENEMY_TYPES`, `Obstacle`. Mutates: everything on `node`. Called by game.js when a room is first entered (presumably paired with `ensureRoomBuilt`).

**`computePitMasks(node)`** — For every pit obstacle (`isPit`), computes a 4-neighbor bitmask (`PIT_N/E/S/W`) of which adjacent tiles are *also* pits, cached on `p._pitMask`. Since pits are immutable for a room's whole lifetime, this only ever needs to run once, right after population. Consumed by the renderer (utils.js `drawObstacle`) to skip rim edges shared between adjacent pits so they read as one continuous void. Called once from `populateRoom`.

**`populateRoomProcedural(node, dungeon, opts)`** — The non-template content generator, branching on `node.type`:
  - `normal`: enemy budget `clamp(2 + floor(floorNum*1.3) + randi(0,2), 2, 8)`, each spawned via `resolveGenericEnemy`; then `scatterObstacles(randi(0,4))` (each obstacle 55% a rock via `rollRockKind`, 25% a pit, 20% hardrock — note: the comment thresholds map to `roll<0.55` rock, `roll<0.8` pit, else hardrock); 30% chance of one chest with a weighted `CHEST_TYPE_POOL` kind.
  - `boss`: places a single `Boss` at room center (`opts.bossType` or `resolveGenericBoss`), `bossDefeated=false`.
  - `treasure`: one `addItemOrTrinketPedestal(node, 'treasure', cx, cy, 0.55)` (passive-skewed).
  - `shop`: 3-4 slots + `shopBonusSlots(floorNum)` extra (capped at `SHOP_MAX_SLOTS=6`), evenly spaced across room width, each via `addShopSlot`.
  - `star`: two star pedestals side-by-side with guaranteed-distinct ids (loops re-rolling id2 up to 8 times against id1) via `addStarPedestal`, positions from `findNearestFloor`.
  - `cpathgate`: places one `branchSpots` entry `{x,y,branch:'C',label:'3C'}` at room center — deliberately reuses the existing `branchSpots` mechanism game.js's `checkStairs` and render.js's `drawStairs` already understand, rather than inventing new interaction plumbing.
  - `planetarium` *(Phase 7a)*: structurally identical to `cpathgate` directly above — one `branchSpots` entry `{x,y,branch:'D',label:'4D'}` at room center and nothing else (it is a doorway, not a fight; it is not in the enemy-spawning branch, so it stays empty). No extra flag is set on the node: the room's unique look is keyed off `node.type === 'planetarium'` directly in render.js's `rebuildTileLayer`, so there is exactly one source of truth for "is this the star room".
  - `secret`: one `addItemOrTrinketPedestal(node,'secret',...)` (uncapped passive chance) plus a 40% chance of one bonus chest.
  Reads: `resolveGenericEnemy/resolveGenericBoss`, `rollRockKind`, `Util.*`, `Enemy/Boss/Obstacle/Chest`, `CHEST_TYPE_POOL`. Called by `populateRoom`.

**Template-driven population**: `SPAWNER_CATEGORY_DECODE = {e:'enemy',p:'pickup',i:'item',d:'deal',s:'shop',o:'obstacle'}`. `decodeSpawner(arr)` unpacks the compact on-disk `[x,y,cat,kindCode,specific?]` encoding into `{x,y,category,kind,specific?}` (obstacles are always `kind:'forced'`; kindCode `'g'`→generic, `'b'`→genericBoss, else forced with `specific` at index 4).

**`populateRoomFromTemplate(node, dungeon, opts)`** — Iterates `tmpl.s` (spawner array), calling `instantiateSpawner` for each decoded entry. Safety net: if `node.type==='boss'` and no enemy in the resulting list is a boss, force-adds one via `resolveGenericBoss`/`opts.bossType` — a template that forgot to place a boss can't leave the floor unwinnable. Also sets `bossDefeated=false` for boss rooms. Called by `populateRoom`.

**`instantiateSpawner(node, dungeon, floorNum, sp, opts)`** — Switches on `sp.category`:
  - `enemy`: `genericBoss` kind → `resolveGenericBoss` (respecting `opts.bossType`, e.g. a superboss); otherwise resolves a specific or generic type (`resolveEnemyTypeId` + `ENEMY_TYPES`/`BOSS_TYPES` lookup, or `resolveGenericEnemy`) and pushes either a `Boss` or `Enemy`.
  - `pickup`: forced specific kind or `rollGenericPickupKind()`, via `spawnResolvedPickup`.
  - `item`: picks the item pool by room type (`secret/curse/challenge/crystal/sombra` map to themselves, else `'treasure'`), either forced (`ITEMS[sp.specific]`) or `pickItemFromPool(poolName)`, added via `addItemPedestal`.
  - `deal`: always draws from the `'sombra'` pool even when forced, added via `addDealPedestal` (costs a heart).
  - `shop`: delegates straight to `addShopSlot`.
  - `obstacle`: rolls the specific kind through `rollRockKind` (so a hand-authored "rock" spawner still has its small tinted-rock chance) and pushes an `Obstacle` if `OBSTACLES[kind]` exists.
  Called only from `populateRoomFromTemplate`.

**Per-room enemy bias** — a room rolls 1-2 "featured" enemy type ids (coin flip between 1 and 2, `ROOM_SINGLE_FEATURE_CHANCE=0.5`) out of whatever pool is eligible, so an 8-enemy room reads as a themed den rather than 8 unrelated creatures. `ROOM_FEATURED_WEIGHT=12` — a featured type is 12x as likely per spawn as an unfeatured one. `_roomEnemyBias` (module-level `Set|null`) is reset per room by `resetRoomEnemyBias()` (called from `populateRoom`) and lazily built on the first `resolveGenericEnemy` call for the room (via `pickBiasedEnemy`, off whatever pool that first call computed — so xpTier/floorKey filtering is respected in what can be featured). `rollRoomEnemyBias(pool)` picks `want` (1 or 2) distinct ids from `pool` (bails to an empty Set if the pool is too small, degrading to uniform). `pickBiasedEnemy(pool)` does a weighted pick where featured ids get `weight * ROOM_FEATURED_WEIGHT`.

**`currentFloorPath(explicit)`** → if `explicit !== undefined` returns it as-is, else reads `game.floorPath` if a global `game` exists (guarded with `typeof game !== 'undefined'` because room.js also runs standalone in the room editor, where there is no live `game`). Called by `resolveGenericEnemy`, `resolveGenericBoss`, and dungeon.js's `templateAllowsFloor`.

**`resolveGenericEnemy(floorNum, branch, floorPath)`** — THOROUGH. Central "what enemy spawns here" resolver:
  1. `avail(e) = !e.locked || isEnemyUnlocked(e.id)` — the 60 locked-by-default `ENEMY_TYPES` tail entries only join pools once their achievement is earned (checked against the run's start-of-run unlock snapshot), applied at every fallback tier below so nothing can ever leak a locked enemy through any path.
  2. `floorKey = floorKeyFor(floorNum, branch, currentFloorPath(floorPath))` — floorKey only differs from the plain stage pool on floorNum 8/9 (9A/9B, 10A/10B) and on the C-branch (which reuses floorNum 2-9 as its own `'3C'..'10C'` keys). If a floorKey pool exists and is non-empty (excluding `isMinion` entries), pick from it via `pickBiasedEnemy`.
  3. Otherwise falls to the stage's pool filtered by `xpTier <= 1 + floorInStage` (harder enemies gated to later floors within a stage); if empty, drops the xpTier filter; if still empty, falls to "any available enemy at all" (`ENEMY_LIST.filter(avail)`), and ultimately `ENEMY_LIST` itself as the last-ditch fallback (guaranteed non-empty).
  Reads: `ENEMY_LIST`, `isEnemyUnlocked`, `floorKeyFor`, `stageIndexForFloor`, `FLOORS_PER_STAGE`, `currentFloorPath`, `pickBiasedEnemy`. Called by: room.js internally (procedural spawns, forceSwarm, sacrifice spike, rerollRoomEnemies), combat-3.js's `spawnChallengeWave`, combat-4.js's `triggerSacrificeSpike`, achievements/core.js.

**`resolveGenericBoss(floorNum, branch, floorPath)`** — Same floorKey-first shape as `resolveGenericEnemy` but simpler (no bias, no unlock filtering — boss list has no locked entries): floorKey pool (`BOSS_LIST` filtered by `floorKey`) if non-empty, else the stage's `BOSS_LIST` pool, else the whole `BOSS_LIST`. Called by room.js internally (`populateRoomProcedural`/`populateRoomFromTemplate`) and game.js.

**`rollRockKind(kind, roomType)`** — Only affects `kind==='rock'` (passthrough for everything else). Start rooms never roll tinted (`roomType==='start'` → passthrough) so a run can't open on a free item pedestal. Reads the live player via `activeGame()` (guarded try/catch since room.js also runs in the room editor with no run); if the player's class def has `noTintedRocks` (Diamond Dog, whose claw shatters plain rock for free), passthrough. Otherwise 1% chance (`Util.chance(0.01)`, halved from an earlier 0.02) to become `'tintedrock'`. Called from `populateRoomProcedural`'s `scatterObstacles`, `instantiateSpawner`'s obstacle case, and externally from data/roomTemplates and data/collectibles.

**`rollGenericPickupKind()`** — Weighted pick from `PICKUP_POOL`; if the result is `'bomb'` or `'key'`, re-rolls against `BOMB_TIER_POOL`/`KEY_TIER_POOL` (filtered by unlock) so it occasionally comes back as a double/gold variant. Called widely (chest contents, sack pickup, sacrifice spike steps, champion bonus drop, etc.) both in this file and combat.js.

**`SACK_BATTERY_WEIGHTS`** and **`rollSackBatteryKind()`** — the achievement-gated 10% "sack/battery" slice of the room-clear reward; returns `null` if none of sack/minibattery/battery are unlocked yet (defined but its only visible caller within these 4 files is documentation-adjacent — actual room-clear reward logic in `spawnClearRoomPickup` uses the broader pool tables directly, not this specific helper, per the code read).

**`pickItemFromPool(poolName, passiveChance)`** — THOROUGH. Filters `ITEM_LIST` to unlocked items whose `pools` includes `poolName`, further filtered by a rolled `wantType` (`'active'` 32% / `'passive'` 68% by default, `passiveChance` overrides — e.g. treasure rooms pass 0.55). Cascading fallbacks if that's empty: drop the type filter (any pool member), then fall to the global `PASSIVE_ITEMS`/`ACTIVE_ITEMS` list filtered by availability, then finally any available item at all. Delegates the actual pick to `pickByQuality`. Called extremely widely — item/deal/challenge/star-pool pedestals, chest contents, room-clear rewards, shop slots, rerolls — both within this file and from combat.js/data/core.js.

**`ITEM_QUALITY_WEIGHTS`** and **`pickByQuality(candidates)`** — items are weighted by quality 1-4 (40/30/20/10%); rolls a tier, filters candidates to that tier, uniform-picks among them, falling back to a uniform pick over all candidates if the rolled tier is empty (e.g. every quality-4 item in that pool still locked). Called by `pickItemFromPool` and `rerollOnePedestal`.

**`spawnResolvedPickup(node, kindOrCoin, tx, ty)`** — Dispatches a resolved pickup "kind" string into an actual `Pickup`/`Chest` push onto `node.pickups`/`node.chests`: `'coin'` (weighted `COIN_TYPES`), `'coin:<tier>'` (specific tier), `'pill'` (random color), `'star'` (random id), `'chest:<kind>'` (spawns a Chest instead of a Pickup), else a plain `Pickup(kindOrCoin, tx, ty)`. Called throughout room.js and combat.js wherever a resolved pickup kind needs to actually land in the world.

**Pedestal helpers** — `addItemPedestal`, `addDealPedestal` (adds `isDeal:true, heartCost:1`), `addShrinePedestal` (Phase 3 overhaul — adds `isShrine:true, coinCost`; same shape as `addDealPedestal` but priced in coins, not hearts), `addTrinketPedestal` (`isTrinket:true`), `addStarPedestal` (`isStar:true, starId`), `addFamiliarPedestal` (`isFamiliar:true`) — all push a `{item, taken:false, x, y, ...flags}` object onto `node.itemPedestals` (lazily initialized). These flags are what game.js's `updateItemPedestal` reads to decide whether to add to passives, equip a trinket, add a familiar, grant a star, or charge a heart/coins.

**Pool pickers** — `pickTrinketFromPool()`, `pickFamiliarFromPool()`, `rollRandomStarId()`, `rollRandomPillColorId()` — each filters the relevant `*_LIST` by unlock state and picks uniformly, with a `Util.choice` over the *unfiltered* list as belt-and-braces fallback.

**Reroll mechanics (Deneb/Altair/Capella/Bellatrix — stars.js consumers)** — header explains the invariant: a reroll must never leave a room unsolvable (never touch geometry, never change the living-enemy count in a combat-locked room, never touch a boss).
  - **`itemPoolForRoomType(type)`** — same pool-name mapping `instantiateSpawner`'s item case uses.
  - **`rerollOnePedestal(node)`** (Deneb) — picks one random untaken pedestal, swaps its `item` reference for a new one of the *same kind* (familiar stays familiar, trinket stays trinket, deal stays deal and keeps its heart cost) — purely a reference swap, position/taken/flags untouched, so it can't affect pathing or lock state. Returns the new prize or `null` if the relevant pool came up empty.
  - **`REROLLABLE_HAZARD_KINDS`** — the fixed whitelist of non-blocking hazard obstacle kinds (`cactus, yellowfire, redfire, bluefire, purplefire, spiketrap, movingspike, sandtrap, mud`), deliberately excluding anything solid/structural (rocks/pits/turrets/barrels/spikedrock/`spike`).
  - **`rerollRoomHazards(node)`** (Altair) — for every obstacle whose `kind` is in the whitelist, rerolls it to a different whitelisted kind (one extra reroll if it lands on the same kind), replacing it with a *fresh* `Obstacle` at the same tile (so layout is bit-identical), marking it seen in the bestiary. Returns count changed.
  - **`rerollRoomEnemies(node, floorNum, floorBranch)`** (Capella) — refuses outright if any living boss is present; otherwise removes every living non-boss enemy silently (no `handleEnemyDeath` — no kill credit/loot/bestiary, or the star becomes a farm button) and replaces them with the same COUNT of freshly `resolveGenericEnemy`-rolled enemies at fresh spots, resetting the room's enemy bias so the new set rolls its own featured pair. Returns the count swapped.
  - **`championizeRoomEnemies(node)`** (Bellatrix) — applies the same champion promotion `populateRoom`'s 5% roll does, to every living non-boss/non-champion enemy at once (doubles constructed `hp/maxHp/dmg`). Returns count promoted.

**`addItemOrTrinketPedestal(node, poolName, tx, ty, passiveChance)`** — small independent chance (10% familiar, else 15% trinket) for a "found an item" moment to instead be a familiar/trinket pedestal; otherwise a normal item pedestal via `pickItemFromPool`. Used by treasure/secret procedural population.

**Shop slot construction** — `SHOP_SLOT_KIND_WEIGHTS` (pickup 35 / item 40 / trinket 12 / familiar 13). `SHOP_MAX_SLOTS=6`, `SHOP_BONUS_SLOT_FLOORS=[5,9]`, `shopBonusSlots(floorNum)` counts how many thresholds have been crossed (0/1/2 bonus slots). `addShopSlot(node, sp, tx, ty, floorNum)` — stamps `node.shopFloorNum` (remembered so a later reroll re-prices at the same depth); handles a forced-specific spawner (resolving whether the id is an item/trinket/familiar/pickup and pushing the matching slot shape with `shopPrice(...)`), otherwise rolls a kind from the weight table and falls back gracefully to `'item'` if the rolled trinket/familiar pool is empty. Called by `populateRoomProcedural` (shop layout) and `instantiateSpawner`'s shop case.

**Reroll-altar support** — `SHOP_REROLL_KIND_WEIGHTS` (item/trinket/familiar only, no pickup — pickups are the cheap "need a heart now" valve and are deliberately excluded from rerolling so the altar can't launder coins into a guaranteed item). `countRerollableShopSlots(node)` counts unbought item/trinket/familiar slots. `rerollShopSlots(node)` rerolls every unbought item/trinket/familiar slot's contents in place (keeps x/y) and re-prices at the shop's remembered floor depth via `shopPrice`; returns count changed. Called by shop.js's `tryRerollAltar` (per the header comment).

**`spawnClearRoomPickup(game)`** — THOROUGH. The universal room-clear reward: skipped outright for boss rooms (stairs already spawn there). Rolls a tier from `CLEAR_REWARD_CHANCE` (15% nothing / 65% common / 15% rare / 5% legendary by default), adjusted by Fortune Shell (`player.passives.fortuneshell`) which shifts 60% of the "nothing" slice into "legendary" instead. `common` tier rolls a category from `COMMON_CATEGORY_POOL` (penny/heart/bomb/key) and resolves via `spawnResolvedPickup`. `rare` tier filters `RARE_POOL` by achievement-pickup-kind unlock state and spawns one. `legendary` tier rolls `LEGENDARY_POOL`: `'trinket'`/`'familiar'` grant directly via `equipTrinket`/`addFamiliar` (items.js, which handle their own sound/toast/float-text), else (including trinket/familiar pool exhaustion) falls to a chest. Called by game.js's `onRoomJustCleared`.

---

### attackStyles.js — the layered-attack subsystem

Header context: this is the rebalance pass's item-redesign mechanism. A transformative item can carry an `attackLayer:{style,...}` field on its `data.js` `ITEMS` entry instead of (or alongside) a plain stat bonus. items.js's `recalcPlayerStats` rebuilds `player.attackLayers` from every owned item with such a field on every stats recalc (not imperative — items are never lost mid-run, so a full rebuild is just as correct and stays consistent with every other derived stat). "Layer 1" is always the player's own class attack (melee/ranged/laser/charged/crystalVolley/greenFire/shockwave — untouched, defined in entities.js/combat.js); layers 2+ are these items, and owning two such items naturally stacks both layers on the same underlying attack event since every owned layer's handler fires.

**The CAST-vs-HIT split rationale** (documented dedicated paragraph, per the assignment): There are two separate dispatch tables/moments because damage resolution timing differs by attack type. Melee and laser (and the beam-style attacks) resolve damage *synchronously*, the instant the attack function runs — every enemy the swing/beam actually touches is known immediately. Ranged and volley attacks instead spawn `Projectile` instances that travel and resolve their hits *later*, inside `updateProjectiles`, potentially many frames after the attack was fired, and potentially never (a miss). `runCastLayers(game, trigger, ctx)` fires once per attack EVENT — once per melee swing, once per shot group, once per volley cast — from the attack functions themselves, and its styles (echoShot, mirrorConvert, ricochetBolt, groundSlam, chargeNova, scatterVolley) react to "you just attacked," not to any particular hit; this is the only table that can be called even when an attack ultimately connects with nothing. `runHitLayers(game, trigger, ctx)` fires once per enemy actually DAMAGED, wherever that resolves — synchronously inside melee/laser/firezone, or from `updateProjectiles`' bolt-hits-enemy site for ranged/volley bolts — and its styles (chainLightning, knockbackPulse, onKillFragments, bloodPact, frostShatter, impactBurst) react to a landed hit. A style belongs to exactly one table, never both, specifically so nothing can double-fire: a hit-time style firing once per cast would undercount a multi-target melee swing (which can hit several enemies in one event), while a cast-time style firing once per hit would fire 3x on Crystal Pony's 3-shard volley landing on a single target. `trigger` is one of `'melee'|'ranged'|'laser'|'volley'|'firezone'` (plus the synthetic `'tick'` for orbitBlades), letting a style read which of the player's own attack styles is active and react differently (e.g. mirrorConvert only adds a projectile on a `'melee'` trigger). `ctx` carries whichever of `{x, y, ang, hits, dmg, projectiles}` a given call site actually has.

**`CAST_ATTACK_STYLES`** — object keyed by style id, each handler `(game, trigger, ctx, layer)`:
  - **`echoShot(game, trigger, ctx, layer)`** — Schedules a genuinely delayed weaker repeat of the triggering attack via `player.delayedActions.push({time: layer.delay||0.25, fn})`, ticked in combat.js's `updatePlayer` via `tickDelayedActions`. When it fires: if `trigger==='melee'`, re-runs a cone sweep (`Math.PI*0.5` half-width) over `node.enemies`, calling `dealPlayerDamage(game, e, ang, {dmgMult: layer.power||0.5})`; otherwise fires one aimed `Projectile` at `player.rangedDamage * power`. Bails if `game.state !== 'playing'` by the time it fires. Reads/mutates `player.delayedActions`.
  - **`mirrorConvert(game, trigger, ctx, layer)`** — Crosses the player's own main attack style: on a `'melee'` trigger, fires one weak `Projectile`; otherwise (ranged/laser/volley/firezone) does a weak melee-range cone burst via `dealPlayerDamage`.
  - **`groundSlam(game, trigger, ctx, layer)`** — Only fires on `trigger==='melee'`. Deals a ring of AoE damage (`layer.radius||70`) centered on the player, calling `e.takeDamage` directly and `handleEnemyDeath` on kill.
  - **`chargeNova(game, trigger, ctx, layer)`** — Per-item counter keyed `'_chargeNovaCount_'+layer.itemId` stashed on `player`; every `layer.every||6` attack EVENTS (any trigger type), fires a bonus damage pulse (`layer.radius||90`, `layer.power||1.2`) centered on the player.
  - **`ricochetBolt(game, trigger, ctx, layer)`** — Tags every projectile in `ctx.projectiles` with `proj.ricochet = (proj.ricochet||0) + (layer.bounces||1)`, consumed later by `updateProjectiles`' wall-collision code (combat.js) rather than tracked here per-frame.
  - **`orbitBlades(game, trigger, ctx, layer)`** — Only runs on the synthetic `trigger==='tick'`, called every frame from `tickOrbitBlades`, not via `runCastLayers`. Spins `layer.blades||2` blades around the player at `layer.radius||46` px, `layer.spinSpeed||2.6` rad/s, tracked via `player._orbitBladeAngle`. Each blade has its own per-enemy cooldown map (`player._orbitBladeCooldowns`, keyed `itemId:bladeIndex:enemyId`) so a blade can't multi-hit the same enemy every frame; on a live contact it deals `(layer.dmg||0.5) * player.meleeDamage`, applies knockback, calls `applyOnHitStatuses` and `handleEnemyDeath` on kill, and sets that pair's cooldown to 0.4s.
  - **`scatterVolley(game, trigger, ctx, layer)`** — Every attack event also sprays `layer.bolts||2` weak bolts in a symmetric fan (`layer.spread||0.9`) around the attack's own facing angle, at `layer.power||0.3` of whichever base damage the trigger uses (melee or ranged damage stat). Bolts are deliberately left untagged (no `attackTrigger`) so they can never re-trigger `runHitLayers` off their own hits — same anti-cascade pattern `onKillFragments` uses.
  - **`skyfall(game, trigger, ctx, layer)`** (Phase 1 overhaul) — Only reacts to `'ranged'`/`'volley'` triggers (bails immediately otherwise — a melee swing has nothing to aim skyward with). `layer.chance||0.18` roll per cast; on a hit, picks a random living non-boss enemy in the room and captures its `(x,y)` at cast time (not a live reference), then queues a delayed strike via the same `player.delayedActions` plumbing `echoShot` uses (`layer.delay||1.1`s). When it fires: pushes an `Explosion` at the captured spot, plays `'explosion'`, and deals `(ctx.dmg||player.rangedDamage) * (layer.power||0.9)` to every living non-boss enemy within `layer.radius||60`, routing kills through `handleEnemyDeath`. Landing at the captured spot rather than tracking the target means the target dying or walking away before the strike lands doesn't cancel or reposition it.

**`HIT_ATTACK_STYLES`** — object keyed by style id, each handler `(game, trigger, ctx, layer)`, where `ctx.hits` is always exactly one enemy (`ctx.hits[0]`):
  - **`chainLightning(game, trigger, ctx, layer)`** — On a landed hit, finds the single nearest OTHER living enemy within `layer.range||120` and deals it `(ctx.dmg||player.meleeDamage) * (layer.power||0.5)` bonus damage, with a zap float text and sound. Only ever jumps to exactly one extra enemy, unlike `impactBurst`.
  - **`knockbackPulse(game, trigger, ctx, layer)`** — Every landed hit also shoves its target with a pure 0-damage knockback (`e.takeDamage(0, dx*strength, dy*strength)`), reusing the same trick stars.js's Saiph star uses.
  - **`onKillFragments(game, trigger, ctx, layer)`** — Fires only if the hit enemy `isDead`; scatters `layer.fragments||3` small untagged homing (`homing:1`) player-owned `Projectile`s outward from the corpse, dealing `player.rangedDamage * (layer.power||0.35)` each. Untagged so they can't cascade into more `onKillFragments` triggers.
  - **`bloodPact(game, trigger, ctx, layer)`** — Spends `layer.hpCost||0.1` of the player's own `redCurrent` for `(ctx.dmg||player.meleeDamage) * (layer.power||0.5)` bonus damage on the SAME hit that already landed (never a new hit, so it can't loop); refuses if the cost would drop the player below half a heart (`redCurrent - cost < 0.5`).
  - **`frostShatter(game, trigger, ctx, layer)`** — Reuses the standard `freezeTimer` field. If the target is already frozen, it "shatters" instead: bonus damage `(ctx.dmg||player.meleeDamage) * (layer.power||0.4)` plus a shatter float text. Otherwise (and never on a boss), `layer.chance||0.2` chance to freeze it for `layer.duration||1.2`s, bumping the `enemiesFrozen` stat, same boss-immunity rule and stat bump as `applyOnHitStatuses`'s own freeze proc.
  - **`impactBurst(game, trigger, ctx, layer)`** — A landed hit detonates a small shockwave (`layer.radius||60`) centered on the STRUCK enemy (not the player), splashing `(ctx.dmg||player.meleeDamage) * (layer.power||0.35)` to every other enemy packed within range — distinct from `chainLightning`'s single-jump behavior.
  - **`markedForDeath(game, trigger, ctx, layer)`** (Phase 1 overhaul) — Bails on a dead or boss target (bosses immune, matching every other status-touching style). If the target is ALREADY Vulnerable (`e.vulnerableTimer > 0`), deals bonus damage instead of re-rolling: `(ctx.dmg||player.meleeDamage) * (layer.power||0.5)`, a "marked!" float text, and routes a kill through `handleEnemyDeath`. Otherwise `layer.chance||0.25` roll to set `e.vulnerableTimer = Math.max(e.vulnerableTimer, layer.duration||2.5)`, bumping `enemiesMarkedVulnerable` and reusing `statusStun`'s SFX — same shape and stat bump as `combat-2.js`'s own Vulnerable roll in `applyOnHitStatuses`.
  - **`venomBloom(game, trigger, ctx, layer)`** (Phase 1 overhaul) — Same "already-marked reapplication deals bonus damage" shape as `markedForDeath`/`frostShatter`, but for poison, plus a spread: if the target is already poisoned, deals `(ctx.dmg||player.meleeDamage) * (layer.power||0.4)` bonus damage AND sets `poisonTimer`/`poisonTickTimer` on every other living non-boss enemy within `layer.radius||90` of it (a "bloom!" float text on the struck target) — the AoE can still land on non-boss enemies standing near a boss, same as any other AoE would, even though the boss itself is immune to receiving poison from this style. Otherwise `layer.chance||0.3` roll to poison the target the normal way (`poisonTimer = Math.max(poisonTimer, 4)`, `poisonTickTimer` armed to 0.8 if not already running).

**`runCastLayers(game, trigger, ctx)`** — Iterates `player.attackLayers` (bails immediately if empty/absent), dispatching each `layer.style` through `CAST_ATTACK_STYLES` if a handler exists. Called from combat-1.js's `playerMeleeAttack`/`playerRangedAttack`, combat-2.js's `playerCrystalVolleyAttack`, and combat-1.js's `updateGreenFireAttack` (on its throttled feedback tick). Not called for laser (laser instead calls `runHitLayers` per-target and its own cast dispatch — checking combat-1.js's `playerLaserAttack`, it does call `runCastLayers(game, 'laser', ...)` at the end too).

**`runHitLayers(game, trigger, ctx)`** — Same iteration shape over `HIT_ATTACK_STYLES`. `ctx.hits` here is always exactly one enemy per call (called once per individual landed hit), unlike `runCastLayers`' `ctx.hits` which can list several. Called from combat-1.js (`playerMeleeAttack`'s per-enemy loop, `playerLaserAttack`'s per-enemy loop, `updateGreenFireAttack`'s feedback tick) and combat-3.js's `updateProjectiles` (the player-bolt-hits-enemy site, only for bolts carrying `pr.attackTrigger`).

**`tickOrbitBlades(game, dt)`** — Iterates `player.attackLayers` looking specifically for `style==='orbitBlades'` and invokes it directly with `trigger:'tick'` — the one style that runs every frame regardless of any attack event. Called once per frame from combat-1.js's `updatePlayer`.

**`tickDelayedActions(player, dt)`** — Iterates `player.delayedActions` backward (safe splice-during-iterate), decrementing each entry's `.time`; when it hits ≤0, calls `.fn()` and splices the entry out. This is the generic delayed-action queue `echoShot` schedules onto. Called once per frame from combat-1.js's `updatePlayer`, right alongside `tickOrbitBlades`.

---

### combat.js (split across 4 files: combat-1.js .. combat-4.js) — core per-frame combat loop

Header (combat-1.js): collision/movement helpers, player input & attacks, pickups/chests, enemy death handling, status-effect ticking, projectiles/bombs/explosions. Everything here takes the live `game` instance so state always reads from `game.currentRoom`/`game.player` directly, never stale copies. Enemy/boss AI behavior (`aiXxx` functions) deliberately lives in ai.js, split out to separate "how a thing moves/decides to attack" from "what happens when it lands a hit."

**Damage-amount helpers**

**`normalizeAngle(a)`** → wraps an angle into `(-π, π]`. Used throughout for facing/cone comparisons.

**`playerDamageAmount(game, isBoss, dmgHalves)`** — THOROUGH. Converts a raw half-heart count into the actual heart-damage amount the player takes: `halves = dmgHalves>0 ? dmgHalves : CONTACT_DMG_DEFAULT` (default 1 half-heart, reproducing the old flat non-boss value for sourceless hits like an untagged hazard or your own bomb); `if (floorNum >= 6) halves += 1` (the Inferno-onward escalation — same net number the old code's "double every hit from floor 6" used for `dmg:1` sources); `amount = halves * 0.5`; if `isBoss`, multiplied by `player.bossDamageTakenMult` (Stonewall item, applied before the half-heart snap); then multiplied by the class's own `damageTakenMult` (Pony Bot's fragility, absent/1 elsewhere); finally snapped to half-heart granularity and floored at a minimum of 0.5 (`Math.max(0.5, Math.round(amount*2)/2)`). Called from nearly every damage-to-player site across combat.js and ai.js (contact damage, hazards, bolts, bosses, explosions).

**`damagePlayer(game, amount, source)`** — Wraps `player.takeDamage` with game-wide reactions the bare `Player` class can't do itself (no access to the room's enemy list). Detects whether the hit actually "landed" by comparing `invulnTimer` before/after (only rises on a real, non-dodged/non-blocked hit). On a landed hit: a brief `navigator.vibrate(45)` haptic (best-effort, silently no-ops where unsupported); Ember Heart passive (`player.passives.emberheart`) — `10% * stacks` chance to stun every non-boss enemy within 100px for 2s. This is the canonical entry point — "every place the player actually takes a hit should call this instead of `player.takeDamage()` directly" per the header comment. Called throughout combat.js/ai.js.

**Tile/collision helpers**

**`isTileSolidForEntity(node, tx, ty)`** — Out-of-bounds, `T_VOID`, `T_WALL`, `T_SECRET` are always solid; `T_DOOR` is solid only if `!node.doorsOpen`; floor/open-secret are passable. Called pervasively (movement, projectile walls, laser/breath raycasts).

**`findNearestFloor(node, tx, ty)`** — Expanding ring search (Chebyshev radius 1..23) for the nearest `T_FLOOR` tile to `(tx,ty)`, falling back to the input coords if nothing found within range. Called throughout room.js and combat.js and ai.js wherever a spawn/placement point needs to land on real floor (very widely called — enemy split spawns, boss pedestal placement, clamping, etc.).

**`tileHasObstacle(node, tx, ty)`** — True if any non-destroyed, non-walkable obstacle occupies that tile (walkable ones like mud/sand don't block spawn placement).

**`findClearFloorSpot(node, tx, ty)`** — Like `findNearestFloor` but also avoids obstacle-occupied tiles, falling back to `findNearestFloor` (ignoring obstacles) if nothing clear is found in range. Used for pickup/enemy/chest spawn placement virtually everywhere content is dropped mid-combat (challenge waves, sacrifice spike rewards, room-clear pickup, drop-on-kill trinket procs, chest contents).

**`collidesAt(entity, x, y, node, obstacles)`** — Samples 5 points around the entity's circle (center + 4 cardinal offsets at `radius*0.9`) against tile solidity, then checks circle-intersection against every non-destroyed, non-walkable, (non-hazard-unless-solid) obstacle; flying entities (`canFly`/`flies`) skip every obstacle except ones flagged `alwaysBlocks`. Called by `tryMoveEntity`.

**`tryPushObstacles(node, player, mx, my)`** — Pushable Bomb Barrel mechanic: walking into a `pushable` obstacle shoves it one step in the movement direction, provided the destination tile is open and no other (non-pit, non-walkable) obstacle blocks it there. Runs BEFORE `tryMoveEntity` so the barrel is already clear by the time the player's own collision check runs. Mutates `ob.x/y/tx/ty`.

**`tryMoveEntity(entity, node, obstacles, mx, my)`** — Axis-separated movement (tries X then Y independently against `collidesAt`), so sliding along a wall works. Returns `{movedX, movedY}`. Called for the player (`updatePlayer`) and enemies (`updateEnemy`'s knockback resolution) and elsewhere.

**`clampToRoom(node, x, y)`** — Clamps a pixel position into room tile bounds then snaps to the nearest actual floor tile via `findNearestFloor`. 

**Player update loop**

**`updatePlayer(game, input, dt)`** — THOROUGH, the per-frame player tick. Order of operations:
  1. Early-out if `player.isDead` (clears `fireZone` so a dead Changeling's fire zone goes out with her).
  2. Decrements timers: `attackTimer, invulnTimer, invincibleTimer, speedBoostTimer, dmgFlashTimer, freezeTimer`.
  3. `tickOrbitBlades(game, dt)` and `tickDelayedActions(player, dt)` — attack-layer per-frame ticks (attackStyles.js), run every frame regardless of whether the player is attacking.
  4. Reads WASD/arrow `input` into a normalized `mx,my` movement vector, updating `player.facing` from it unless mouse-aim is active, in which case `player.facing` is derived from the world-space mouse position (`input.mouseX/Y + game.camX/camY`).
  5. `if (player.greenFireAttack) updateGreenFireAttack(game, input, dt);` — Changeling's held-zone attack runs BEFORE movement (deliberately) so the root-in-place speed penalty (`miredInOwnFire`) applies the same frame the zone spawns/despawns, not one frame late.
  6. Computes speed multiplier: `onMud` (0.5x, re-checked every frame, no lingering timer) and `miredInOwnFire` (0.25x while holding green fire) both apply on top of `player.speed * max(speedBoostTimer>0?1.5:1, player.starSpeedMult)` — Note: speed-boost item and star speed bonus use `Math.max`, not multiplication, so they don't stack multiplicatively.
  7. If not frozen (`freezeTimer<=0`), computes the frame's step, adds Current obstacle push (`CURRENT_PUSH_SPEED=90` px/s, C-branch exclusive hazard, checked fresh every frame like mud), then `tryPushObstacles` then `tryMoveEntity`.
  8. Dispatches the press-only attack (skipped if `greenFireAttack`, already handled above): melee → `playerMeleeAttack`; charged (Dragon/Crystal Pony) → `playerChargedBeamAttack`; else → `playerRangedAttack`. If charged and the button isn't held, resets `chargeTimer=0` (letting go early wastes the charge).
  9. `checkDoorTransition(game, dt)`, `updatePickups(game, dt)`, `updateChests(game)`.
  Reads/mutates: essentially all of `player` and `node`. Called once per frame from game.js's main loop.

**`playerMeleeAttack(game)`** — Gated by `attackTimer`; sets `attackTimer = meleeCooldown`. Computes swing origin 14px ahead of the player along facing angle, sets `game.swingFX` for rendering. Cone half-width scales with Mirror Shard stacks (`Math.PI*0.65*(1+0.3*stacks)`, capped at `Math.PI`). For every living enemy within `meleeRange+radius` and inside the cone, calls `dealPlayerDamage`; on a successful hit, pushes it to `layerHits` and immediately calls `runHitLayers(game,'melee',...)` for that single enemy. Also sweeps `attackable` obstacles in the same cone via `damageObstacleHit`. If `player.shockwaveAttack` (Diamond Dog), additionally sweeps plain `rock`/`tallrock` obstacles (which aren't normally `attackable`) via `shatterRockByShockwave`. Finally calls `runCastLayers(game,'melee', {..., hits: layerHits, ...})` once for the whole event.

**`shatterRockByShockwave(game, ob)`** — Diamond Dog's dedicated rock-destroy path, deliberately separate from `explodeAt`'s obstacle loop so a clawed-apart rock never triggers bomb-blast reward logic (prospector's pick, tinted-rock table) — only her flat `player.def.rockCoinChance`. Destroys the obstacle, plays sound, bumps `obstaclesDestroyed`/bestiary stats (explicitly NOT `rocksBombed`, since that stat gates her own unlock hint).

**`damageObstacleHit(game, ob)`** — Attackable-hazard hit-count damage (not HP points — "3 hits and it goes out"). Decrements `ob.hp`, flashes, and on death: destroys it, plays sound, bumps stats, rolls `heartDropChance`, and — critically — if `ob.def.explodesOnDestroy` (Bomb Barrel), calls `explodeAt(game, ob.x, ob.y, 92 * bombRadiusMult)`, chaining barrel detonations.

**`playerRangedAttack(game)`** — If `player.laser`, redirects entirely to `playerLaserAttack` and returns. Otherwise gated by `attackTimer`; fires `1 + multishotExtra` bolts in a spread fan (`spread=0.16` rad) with a computed `life` (Breezie's `unlimitedRange` → 999s "forever," else `rangeTiles*TILE/boltSpeed`). Each `Projectile` carries `tearFlags` (pierce/homing/spectral/explosive) and is tagged `proj.attackTrigger = 'ranged'` (read later by `updateProjectiles`' hit site to invoke `runHitLayers`). Calls `runCastLayers(game,'ranged', {..., projectiles: firedBolts})` once at the end.

**`updateGreenFireAttack(game, input, dt)`** — Changeling's signature held attack. On button-release, `player.fireZone = null` immediately (no cooldown/fade). On first press, plants a fixed zone `fireZoneRange` (default 40) ahead of the player's facing at that instant, ANCHORED there (doesn't follow the player), `radius: fireZoneRadius||50`. Damage is continuous: `dps = rangedDamage * (1/fireCooldown)`, applied fractionally every frame (`dmg = dps*dt`) to every enemy inside the zone via `e.takeDamage`. Feedback (lifesteal via `player.onHitLanded()`, sound, float text, `applyOnHitStatuses`, `runHitLayers`) is throttled to once per `fireCooldown` interval via `zone.tickTimer`, so holding the button isn't a 60x/sec lifesteal roll. On that same throttled tick also calls `runCastLayers(game,'firezone',...)` and damages any attackable obstacle in range via `damageObstacleHit`. Kills route through `handleEnemyDeath` same as any other source.

**`playerLaserAttack(game)`** — Pony Bot's instant beam. Steps a ray (6px increments) from the player along facing angle until it hits a solid tile (`isTileSolidForEntity`) or `maxDist` (room diagonal), accumulating a `hitSet` of enemies and `hitObstacles` (only `attackable` ones — hazard-but-not-solid obstacles like cactus are passed through, non-attackable ones like rocks/turrets/blue+purple fire block nothing and take no damage) touched along the way — the beam always pierces every enemy and (attackable) obstacle it crosses. After the raycast, damages every hit obstacle once (`damageObstacleHit`) and every hit enemy once, with independent crit rolls and boss-damage-bonus per target, calling `runHitLayers` per enemy and `runCastLayers` once for the whole cast. Sets `game.laserFX` for rendering.

**`playerChargedBeamAttack(game, dt, input)`** (combat-2.js) — Dragon/Crystal Pony's hold-to-charge gate. If still recovering (`attackTimer>0`), resets `chargeTimer=0` and returns (no pre-charging through cooldown). Accumulates `chargeTimer += dt`; once it reaches `chargeTime`, resets it, sets `attackTimer=fireCooldown`, and dispatches to whichever class-specific full-charge attack applies: `playerCrystalVolleyAttack` if `player.crystalVolley`, else `playerFireBreathAttack`. Called every frame `input.attack` is held, from `updatePlayer`.

**`playerCrystalVolleyAttack(game, input)`** — Crystal Pony's 3-shard volley, fired from 3 points across her flank (`CRYSTAL_VOLLEY_OFFSETS = [-34,0,34]`, perpendicular to facing), each independently aimed at a shared focal point (mouse cursor world position, or a point straight ahead for keyboard aiming) so the shards converge rather than travel parallel. `life=999` uncapped regardless of `rangeTiles`/`unlimitedRange` — travels however far the room actually is. Each shard tagged `attackTrigger='volley'`. Ends with one `runCastLayers(game,'volley',...)` call.

**`playerFireBreathAttack(game)`** — Dragon's signature attack: identical raycast-and-pierce shape to `playerLaserAttack`, but capped to `player.rangeTiles*TILE` (Dragon's low `baseRangeTiles`) instead of spanning the whole room. Notably does NOT call `runCastLayers`/`runHitLayers` (no attack-layer integration on this specific function, unlike the laser's equivalent) — per-target crit/boss-bonus/kill handling mirrors the laser otherwise.

**`dealPlayerDamage(game, enemy, ang, opts)`** — THOROUGH. The shared single-target damage-application helper used by melee-family hits (direct melee swings, echoShot's melee echo, mirrorConvert's melee burst). Base damage is `player.attackType==='melee' ? meleeDamage : rangedDamage`; `opts.dmgMult` (used by attack-layer styles for weaker echo/mirror hits) multiplies it; then an independent crit roll (`critChance`/`critMultiplier`) and boss-damage-bonus multiplier; applies knockback proportional to `ang`; calls `enemy.takeDamage(dmg, kx, ky)`. On a successful hit (`applied`): `player.onHitLanded()`, sound, crit stat bump, `applyOnHitStatuses`, float text, and on kill, `meleeKills` stat + `handleEnemyDeath`. Returns `applied` (boolean) — this is what attack-layer styles use to build their hit lists. Called by `playerMeleeAttack`, `echoShot`, `mirrorConvert` (attackStyles.js).

**`applyOnHitStatuses(game, enemy)`** — Rolls the 5 luck-scaled on-hit status effects (venom/poison, stun, charm, freeze, fear) against the player's respective `*Chance` stats, never affecting bosses (`if (enemy.isBoss) return;` up front). Hex Brand trinket (`sd=1.5`) multiplies every status's base duration uniformly. Also rolls a 6th, non-luck-scaled status here — Vulnerable (Phase 1 overhaul): `if (player.vulnerableChance && Math.random() < player.vulnerableChance)` sets `enemy.vulnerableTimer = Math.max(enemy.vulnerableTimer, 3*sd)`, bumps `enemiesMarkedVulnerable`, and reuses `statusStun`'s SFX (no dedicated cue exists for it yet) — still gated by the same `enemy.isBoss` early return every other status here is. Called after virtually every successful player hit across combat.js.

**Door/key mechanics**

**`KEY_LOCKED_ROOM_TYPES = Set(['treasure','shop','vault','star'])`** — room types locked behind a key rather than combat.

**`keyLockedRoomFor(node, slot)`** — Determines which of the two rooms a given door slot connects (the current room, or the paired room across it) is actually a key-locked, still-unopened room — needed because door checks only ever look at the room the player currently stands in, but the key lock has to consider both sides.

**`tryUnlockKeyDoor(game, node, lockedRoom)`** — Spends a key (unless `unlimitedKeysFloor`), opens `lockedRoom.doorsOpen=true`, marks its `tileLayerDirty` for redraw, plays sound/toast, bumps stats (`keysUsed`, plus `vaultsOpened` specifically for vault rooms). If no key available, throttled (`keyToastCooldown`) deny toast/sound.

**`COIN_LOCKED_ROOM_TYPES = Set(['arcade'])`** / **`ARCADE_TOLL = 1`** (Phase 4 overhaul) — the arcade room's coin-toll gate, parallel to `KEY_LOCKED_ROOM_TYPES` above.

**`coinLockedRoomFor(node, slot)`** — identical two-sided shape to `keyLockedRoomFor`, checked against `COIN_LOCKED_ROOM_TYPES` instead.

**`tryUnlockCoinDoor(game, node, lockedRoom)`** — mirrors `tryUnlockKeyDoor`: if `player.coins >= ARCADE_TOLL`, deducts, opens `lockedRoom.doorsOpen=true`, marks `tileLayerDirty`, `Sound.play('coin')`, toasts "Paid 1c to enter.", `bumpStat('coinsSpent', ARCADE_TOLL, game)`. Otherwise reuses the same `node.keyToastCooldown` field for its own throttled deny toast ("Locked — needs 1 coin.") — not key-specific, just "a door-deny toast is already showing".

**`checkDoorTransition(game, dt)`** — Per-frame: decrements `node.keyToastCooldown`; for each door slot with live `cells`, computes the door's pixel center and checks proximity (<16px) to the player. Normal-type doors first check `keyLockedRoomFor` and route to `tryUnlockKeyDoor` if locked, then (Phase 4 overhaul) check `coinLockedRoomFor` and route to `tryUnlockCoinDoor` if locked — order between the two doesn't matter since a room is only ever one type; otherwise checks whether the door is actually open (`node.doorsOpen` for normal, `slot.opened` for secret) and, if so, calls `game.transitionThroughDoor(slot)`.

**Pickups & chests**

**`updatePickups(game, dt)`** — Magnet pull (`player.magnetRadius`) steers nearby uncollected pickups toward the player at up to `240*dt` px/frame; then collects any pickup actually touching the player via `collectPickup`, filtering collected ones out of `node.pickups`.

**`coinSoundName(coin)`** — Maps coin tier id to its specific chime sound name (nickel/dime/luckypenny get distinct sounds, everything else the generic `'coin'`).

**`grantPickupEffect(game, kind, x, y, coin, pillColor, starId)`** — THOROUGH. The single resolver for every pickup kind's actual effect — used for world pickups being walked over, Sack granting 3 at once, and shop purchases (items.js `grantPickupKind`). A large switch over `kind`: `coin` (applies a long chain of trinket/passive coin-value multipliers additively, rounds, adds to `player.coins`, bumps stats, handles `luck` bonus via `recalcPlayerStats`); `key`/`doublekey`/`goldkey`; `bomb`/`doublebomb`/`goldbomb`; the 6 heart variants (`heartRed/heartBlue/halfheartRed/halfheartBlue/doubleheart/heartContainer`), each respecting Swift Recovery's heal bonus where applicable; `eternalheart` (one-time +0.5 max/current red, flagged so it can't stack); `goldheart` (banked heal that pays out at end-of-room-untouched, tracked in game.js); `cursedpenny` (a 6-outcome weighted gamble table including a self-damaging explosion outcome); `battery`/`minibattery` (charges the active item if one is equipped); `sack` (grants 3 more `rollGenericPickupKind()` results recursively via itself); `pill` (assigns `pillPocket`, shows identified/unidentified name via `game.pillIdentified`); `star` (assigns `starPocket`, shows name/effect immediately, unlike pills). Marks bestiary "seen" state throughout. Mutates `player` extensively.

**`collectPickup(game, p)`** — Thin wrapper: calls `grantPickupEffect` with the pickup's own fields, marks `p.collected=true`.

**`updateChests(game)`** — For each unopened chest not requiring `'bomb'` (stone chests only open via blast), checks touch-proximity and calls `tryOpenChest`; handles the special `reopenLock` state (an Eternal Chest that reopened itself must have the player step fully off it before it can be touched again, to avoid an instant re-open/re-drain the very next frame).

**`tryOpenChest(game, c)`** — Spends the resource a chest's `def.requires` demands: `'key'` (or free if `unlimitedKeysFloor`), or `'hearts'` (cost reduced by Cursed Locket, refuses if it would leave the player with nothing — `avail<=cost` — so a chest can never kill you). Calls `openChestContents`.

**`openChestContents(game, c)`** — THOROUGH. Marks opened, plays sound. Spawns `n` pickups (`randi(minPickups,5)`, `minPickups=3` with Midas Touch else 1) scattered around the chest position via `findClearFloorSpot`; a Wooden chest's pickups are always 50/50 pill/star, otherwise `rollGenericPickupKind()`. Then rolls `c.def.itemChance` (+0.05 with Brass Key trinket) for a bonus prize: Wooden chests always grant a trinket (`itemChance` is 1.0 for wood, and its bonus is always a trinket, never familiar/item); other chest kinds roll 10% familiar / 15% trinket / else a pooled item (`pickItemFromPool('chest')`) via `applyItemToPlayer`. Bumps `chestsOpened` plus per-kind stats (cursed/gold/stone). Eternal chests (`c.kind==='eternal'`) have a 50% chance to un-mark `opened` and set `reopenLock=true`, putting them back into `updateChests`' rotation for another key-gated open.

**Enemy death / drops**

**`handleEnemyDeath(game, enemy)`** — THOROUGH. The canonical "an enemy just died" handler, called from every damage-application site across combat.js/attackStyles.js/ai.js/stars.js/familiars.js/items-2.js:
  1. `player.onKill()`, death sound, `enemiesKilled` stat, first-kill bestiary discovery toast (non-boss only — bosses already get their own fanfare).
  2. `game.runKills++`; boss kill stat; special swarmerdnb kill stat (achievement gating).
  3. Splitter behavior: if not already split and the type has a `splitInto` child type, spawns 2 children nearby via `findNearestFloor`.
  4. Boss death: `node.bossDefeated=true`, spawns a guaranteed boss-pool item pedestal at the boss's spot, and calls `game.onBossDefeated(enemy)`.
  5. Non-boss trinket procs (mutually exclusive else-if chain): Shiny Shell (8% heart drop), Gravekeeper's Token (6% coin drop), Powder Pouch (4% bomb drop), Ossuary Key (4% key drop).
  6. Independent (own `if`, stacks with the trinket procs): Golden Clover passive (`5%*stacks` coin drop).
  7. Independent: Champion enemies pay out one bonus generic pickup 50% of the time.
  8. Finally: `if (checkRoomCleared(game, node)) game.onRoomJustCleared();`
  Reads/mutates: `player`, `node.pickups`, bestiary/stat systems, `game.runKills`.

**`checkRoomCleared(game, node)`** (combat-3.js) — Returns `false` immediately if already `node.cleared` or if any enemy is still alive. Special-cases `challenge` rooms: if a challenge is in progress and waves remain, calls `spawnChallengeWave` instead of clearing and returns `false` (so the room never registers as cleared mid-gauntlet); on the final wave's clear, bumps `challengeRoomsCompleted`. Otherwise sets `node.cleared=true, node.doorsOpen=true` and returns `true`. Called by `handleEnemyDeath`.

**`spawnChallengeWave(game, node)`** — Increments `node.challengeWave`, spawns `randi(3,5)` enemies in a ring around room center via `resolveGenericEnemy`/`findClearFloorSpot`, toasts the wave number. Called by `checkRoomCleared` and `startChallengeRoom`.

**`startChallengeRoom(game, node)`** — Fires when the challenge room's guaranteed item is taken (game.js's `updateItemPedestal`). Idempotent via `node.challengeStarted`. Locks the doors, marks `tileLayerDirty`, kicks off wave 1 via `spawnChallengeWave`. The room self-reopens later via `checkRoomCleared` once wave 5 is cleared.

**Enemy update / status ticking**

**`updateEnemy(game, e, dt)`** — THOROUGH. Per-frame per-enemy tick, called from game.js's main loop for every enemy in the current room:
  1. Skips dead enemies. Decays `hitFlash`.
  2. Resolves knockback: if `|knockX|>0.15 || |knockY|>0.15`, moves the enemy by its knock vector (via `tryMoveEntity`) and decays it (`*0.82`); otherwise zeroes it.
  3. `updateStatusEffects(game, e, dt)` — may kill the enemy mid-tick (poison), in which case returns early.
  4. Shield-cycle logic: `behavior==='shielded'` types toggle `shielded` on a timer between `type.shieldTime`/`type.vulnTime`; a `grantedShield` (handed out by a `'shielder'` ally, see ai.js) decays independently and clears both `shielded` and `grantedShield` on expiry (an unlimited grantedShield would otherwise be a permanently invulnerable enemy).
  5. Behavior dispatch, gated by status priority: frozen (no movement/attacks at all) > stunned (`aiWander`, ranged/turret types simply don't fire while stunned) > charmed (`aiCharmed`) > feared (`aiFeared`) > else a giant `switch(e.behavior)` dispatching into the corresponding `aiXxx` function from ai.js (huge list covering every regular archetype — chaser/ranged/flyer/bomber/charger/turret/leaper/splitter(moves as chaser)/orbiter/burrower/summoner/healer/sniper/swarm/ambusher/teleporter/shielder/lobber/weaver/sentry/skirmisher/whiplash (the last two, Phase 2) — and every named boss behavior across all stages/superbosses, ~42 boss cases total including Phase 2's `bossEclipseWraith`/`bossIronBastion`). An unrecognized `behavior` string logs a one-time (`_warnedBehaviors` Set, deduped per bad string since this runs every frame per enemy) console warning and falls back to `aiChase`.
  6. Contact damage: decrements `contactCooldown`; if not dead, not `submerged`/frozen/charmed, and within contact radius of the player with cooldown expired, calls `damagePlayer(game, playerDamageAmount(game, e.isBoss, e.dmg), e.type.id)`, sets a boss-specific (0.6s) or type-specific (`contactCooldown||0.7`) cooldown, and if the player has Spiked Barding, deals `statusTickDamage(floorNum)` back to the enemy (with a chance to kill and route through `handleEnemyDeath`).
  7. Else-branch: a charmed enemy attacks the nearest OTHER enemy instead of the player, dealing `e.dmg` and routing kills through `handleEnemyDeath`.

**`updateStatusEffects(game, e, dt)`** — Ticks down `poisonTimer/stunTimer/freezeTimer/fearTimer/charmTimer/vulnerableTimer`. Poison additionally ticks damage on its own sub-timer (`poisonTickTimer`, 0.8s cadence) via `statusTickDamage(floorNum)` (depth-scaled, per the header comment — a flat-1 tick became dead weight past the Crypt), routing a kill through `handleEnemyDeath` and returning early. Synergy B (Rot & Ruin, see the Synergies subsection under items.js below): if the target's `vulnerableTimer > 0` AND `player.rotAndRuinActive`, this same poison tick is multiplied by an extra 1.3x, on top of `takeDamage`'s own Vulnerable 1.5x.

**Projectiles**

**`updateProjectiles(game, dt)`** — THOROUGH, the per-frame projectile tick over `game.projectiles`. Per projectile:
  1. Homing steering (only if `pr.homing` set): player/familiar-owned bolts steer toward the nearest enemy within 260px; enemy-owned bolts (Purple Fire) steer toward the player — both capped at a turn rate of `min(1,0.15*homing)*5` rad/s via `normalizeAngle`+`Util.clamp`, so it reads as "guided" rather than teleporting.
  2. Integrates position (`pr.x/y += vx/vy*dt`), decrements `pr.life`.
  3. Wall collision + ricochet physics — DOCUMENT THOROUGHLY per the assignment: if the new tile is solid, and `pr.ricochet > 0` (set by attackStyles.js's `ricochetBolt`), the projectile's position is rewound to its pre-move `(prevX,prevY)` FIRST, then the collision axis is diagnosed by testing the two single-axis tiles independently: `(tx, prevTy)` solid → flip `vx`; `(prevTx, ty)` solid → flip `vy`; if NEITHER single-axis tile is solid (a corner case — the diagonal move itself is what's blocked) both `vx` and `vy` are flipped. `pr.ricochet` is decremented. Rewinding before flipping (rather than flipping in place) means next frame's ordinary `pr.x += pr.vx*dt` carries it cleanly away from the wall instead of compounding on the same-frame math. If `pr.ricochet` is 0/absent, the projectile just dies (`pr.dead=true`) as normal.
  4. Obstacle collision (skipped entirely if `pr.spectral`): for each non-destroyed, non-pit obstacle that isn't the projectile's own source, walkable ones and non-attackable hazards (e.g. cactus) are passed through; on a real hit, attackable obstacles take damage (`damageObstacleHit`, player/familiar bolts only) and the projectile dies.
  5. `pr.life<=0` also kills it; if dead at this point, calls `detonateExplosiveProjectile` and `continue`s to the next projectile (skipping enemy/player hit checks — a bolt that died on a wall/obstacle/timeout this frame can't also land a hit the same frame).
  6. Player/familiar-owned bolts: for each living enemy not already in `pr.hitEnemies`, on circle-intersect, records the hit, consumes one `pierce` charge or kills the bolt, rolls crit/boss-bonus, applies damage via `e.takeDamage`; on a successful hit: lifesteal/statuses (player bolts only), sound, float text, kill handling (`rangedKills` stat + `handleEnemyDeath`), and — only for player bolts carrying `pr.attackTrigger` (i.e. tagged 'ranged'/'volley', excluding untagged echo/fragment/scatter shards) — `runHitLayers(game, pr.attackTrigger, ...)`. Breaks the enemy loop once the bolt itself dies (non-piercing).
  7. Enemy-owned bolts: on touching the player, dies and calls `damagePlayer(game, playerDamageAmount(game, pr.fromBoss, pr.damage), srcId)` — `pr.damage` already carries the shooter's own `dmg` stat in half-hearts (set by ai.js's fire functions or literal boss-volley values), so a bolt now costs exactly what its shooter's stat says.
  8. Final `detonateExplosiveProjectile` call for anything still dead after the enemy/player loop, then filters `game.projectiles` to remove dead ones.

**Bombs & explosions**

**`placeBombAt(game, x, y, owner)`** — Spends a player bomb (unless `unlimitedBombsFloor`), constructs a `Bomb`, applies Quick Fuse's shortened timer (0.15s), pushes to `game.bombs`, plays sound, bumps `bombsPlaced` stat. Returns `false` if the player had no bombs to spend.

**`updateBombs(game, dt)`** — Ticks every bomb's `timer`; on expiry, calls `detonateBomb` and filters exploded bombs out.

**`detonateExplosiveProjectile(game, pr)`** — Explosive tears (`tearFlags.explosive`): idempotent via `pr.exploded`; calls `explodeAt(game, pr.x, pr.y, 22 + 12*pr.explosive)` — deliberately reuses the exact same `explodeAt` bombs/barrels use, so an explosive bolt can bomb rocks, chain into a barrel, or catch the player themselves.

**`detonateBomb(game, bomb)`** — `explodeAt(game, bomb.x, bomb.y, 92 * (bombRadiusMult||1))`.

**`explodeAt(game, x, y, R)`** — THOROUGH, the shared explosion-resolution function used by player bombs, bomb barrels (both on 3-hit destruction and on being caught in another explosion — recursion-safe since `ob.destroyed=true` is set before any recursive call, so a barrel can never explode twice), and Taygeta-adjacent obstacle-clear logic.
  1. Pushes an `Explosion` visual, plays sound.
  2. Blast damage via `explosionDamage(floorNum)` — deliberately rides the BOSS damage curve (the gentler of the two depth curves) so a bomb stays reliable against trash without ever becoming the answer to a brute/boss. Applied to every enemy within `R+radius`, with knockback, routing kills through `handleEnemyDeath`.
  3. Self-damage: melee classes are outright immune to blast damage (they have to stand in a barrel's face to fight at all — "eating the pop is not a real choice for them"); everyone else, unless `blastplating` passive or `blastward` trinket, takes `playerDamageAmount(game,false)` if within range — deliberately no attacker id passed, so it falls through to `CONTACT_DMG_DEFAULT` (half a heart, a full heart from the Inferno on) since there's no single attacker to attribute a blast to.
  4. Obstacle destruction: every destructible/attackable obstacle within range is destroyed, with per-kind extra effects: rock/tallrock → `rocksBombed` stat + Prospector's Pick/Chip coin drops; tintedrock → a weighted 3-outcome table (75% two blue hearts, 20% a dime coin, 5% a guaranteed `damageup` item pedestal); `explodesOnDestroy` (barrels) → recursive `explodeAt` chain; turret kinds → `turretsDestroyed` stat.
  5. Secret door slots: any unopened secret door slot with cells within `R+20` of the blast center gets opened via `openSecretPassage`.
  6. Stone chests (`requires:'bomb'`) within range open via `openChestContents` directly (they never open on touch).

**`destroyAllObstacles(game)`** — Taygeta star: mirrors `explodeAt`'s obstacle-destruction loop (identical per-kind reward logic) over EVERY destructible/attackable obstacle in the room at once, but deliberately never touches the player, enemies, chests, or secret walls — a pure convenience clear, not an area attack.

**`damageAllEnemies(game, amount)`** (combat-4.js) — Antares star: flat, predictable damage to every living non-boss enemy once — no knockback, no crit, no on-hit statuses (bosses immune, same rule `applyOnHitStatuses` follows). Routes kills through `handleEnemyDeath`.

**`freezeAllEnemies(game, duration)`** — Polaris star: freezes every living non-boss enemy for `duration`, bumping `enemiesFrozen` by the count actually frozen and playing the freeze sound once if any were.

**`openSecretPassage(game, slot)`** — Idempotent guard (`slot.opened`). Marks the slot open, stamps its cells to `T_SECRET_OPEN` in the current room's tile grid, marks `tileLayerDirty`. If the slot's paired neighbor exists, force-builds that neighbor room's tiles via `ensureRoomBuilt` (it may never have been visited yet) and, if its OWN facing slot is also still-unopened secret type, opens it too — but deliberately does NOT force `neighbor.doorsOpen`, since secret-type doors are gated purely by their own `opened` flag, and a normal/boss neighbor reached backward through a secret passage must stay combat-locked until actually cleared. Plays sound, toasts, bumps `secretRoomsFound` stat. Called by `explodeAt` (blast radius secret-wall discovery) and elsewhere (e.g. an active item that reveals secrets, per typical usage — confirmed callers are combat-3.js/combat-4.js internal only within these files, i.e. `explodeAt`).

**Obstacle per-frame tick**

**`updateObstacles(game, dt)`** — Per obstacle: decays `hitFlash`/`contactCooldownTimer`; dispatches Moving Spike movement via `updateMovingSpike`; hazard contact damage (skips redfire/yellowfire for Cinderguard trinket holders) — hazards carry their own `dmg` (half-hearts) like enemies now, EXCEPT the sacrifice-room `spike` fixture which keeps a flat full heart (1) regardless of floor, because its damage IS the price of admission for its reward table (`triggerSacrificeSpike`) and must not drift with depth-scaling; sets contact cooldown (1.0s for sacrifice spike — slower, giving the player a beat to see the reward before the next step; 0.6s for everything else), and for the sacrifice spike specifically, calls `triggerSacrificeSpike`. Freeze-trap obstacles apply `player.freezeTimer` with a deliberately-longer cooldown than the freeze itself (so the player always gets a window to step off). Turret/projectile-spitting obstacles (`ob.def.projectile`) fire on their own `fireTimer`/`fireCooldown`, dispatching to `fireProjectileAngle` (fixed-direction/pattern turrets, infinite range) or `fireProjectileAt` (targeting turrets always aim at the player, infinite range; redfire aims at the player only within 320px, a close-quarters-only threat) — `homing` flag from `ob.def.homing` (purplefire) is passed through to the projectile.

**Moving Spike wall-following state machine** — `SPIKE_DIRS` (N/E/S/W). `spikeTileOpen(node,tx,ty,self)` — floor-only (not doors/secrets/walls/void), and clear of every other non-pit obstacle. `spikeIsBoundary(node,tx,ty,self)` — true if any of the 4 neighbors is NOT open (i.e. this tile touches a wall/obstacle). `spikeFindWallDir(node,tx,ty,self,prefer)` — finds which side is blocked, preferring a given side and its neighbors in rotational order, or -1 if the tile touches nothing. `spikeSetTarget(node,ob,dirIdx,wallDirIdx)` — commits a one-tile move along `dirIdx`, re-deriving the hugged wall side at the destination if the expected side turned out not to actually be blocked there (the wall got bombed out from under it), or dropping the hug entirely if the destination touches nothing. `nearestSpikeBoundaryTile(node,ob)` — Manhattan-nearest open+boundary tile in the whole room, used only when the spike has fully lost its wall. `pickNextSpikeTile(node,ob)` — the core decision function: (re-)acquires a wall if it doesn't have one; if it has one, follows a classic left-hand-rule wall-hugging state machine (convex corner → turn into the gap; wall still beside it → go straight; blocked ahead → concave corner, that blocker becomes the new hugged side; dead end → turn around); if fully boxed in, stays put; if it touches no wall at all, steps onto an adjacent boundary tile to re-acquire, or as a last resort walks toward the nearest boundary tile in the room, or truly last-resort takes any open tile and drops the hug state entirely. `updateMovingSpike(node,ob,dt)` — moves the obstacle toward its current target tile at 46px/s (a deliberately slow, telegraphed patrol speed), calling `pickNextSpikeTile` when it arrives or when it has no target yet.

**`triggerSacrificeSpike(game, node, ob)`** — Increments `ob.sacrificeStep` and resolves a fixed per-step reward table (documented in-code): step 1: 50% one penny; step 2: 50% a chest; step 3: 50% two red hearts; step 4: 75% three pennies; step 5: always one random enemy; steps 6-10: 50/50 one random pickup vs three enemies; step 11: 50% a random treasure-pool item; step 12+: 50% one penny forever. Bumps `sacrificeSpikesTriggered` stat. Local helpers `spot()` (via `findClearFloorSpot` near the spike), `spawnPickups(kind,n)`, `spawnEnemies(n)` (via `resolveGenericEnemy`). Called by `updateObstacles` on every sacrifice-spike contact tick.

**`updateExplosions(game, dt)`** — Decays and filters `game.explosions` by `life`.

**`updateFloatTexts(game, dt)`** — Decays `life` and rises `y` (`-=dt*18`) for every `game.floatTexts` entry, filtering expired ones.

---

**Cross-file call notes** (from a tree-wide grep):
- `generateDungeon` is called from game.js (floor generation entry point).
- `populateRoom`/`ensureRoomBuilt` are called from game.js when a room is entered.
- `handleEnemyDeath` is called from combat-1/2/3/4.js, attackStyles.js, ai-1.js, familiars.js, stars.js, and items-2.js — i.e. every damage source in the game (player attacks, familiar attacks, star active effects, on-hit item effects) funnels kills through this one function.
- `damagePlayer`/`playerDamageAmount` are called from combat-1/3/4.js and ai-1/2/3/4.js (every enemy/boss attack that can hit the player) and entities/entities.js.
- `findNearestFloor`/`findClearFloorSpot` are called extremely widely: game.js, all of ai-1..4.js, room.js, familiars.js, stars.js, items-2.js, and combat-1/2/3/4.js — the shared "give me a valid floor tile near here" primitive for the whole game.
- `computeDoorSlots`/`doorSlotCells` are also called from ui/roomEditor.js (the room editor reuses the exact same slot/cell math to preview doors while authoring templates).
- `resolveGenericEnemy` is also called from achievements/core.js (likely for bestiary/preview purposes).
- `pickItemFromPool` is also called from data/core.js.
- `rollRockKind` is also called from data/collectibles.js and data/roomTemplates/core.js.


---

<a id="part-6"></a>

# Part 6 — systems/ (AI, familiars, pills, stars, items, shop)

## systems/ (part 2) — enemy/boss AI, familiars, pills, stars, player stat recalculation, and the shop

### ai.js (split across 4 files: ai-1.js–ai-4.js)

The enemy/boss "brain" layer. combat.js's `updateEnemy()` looks at an enemy's
`e.behavior` string (regular enemies) or its boss-specific behavior key and
dispatches into one `function aiXxx(game, e, dt)` / `function aiBossXxx(game, e, dt)`
per archetype, defined here. This file is purely "how a thing decides to
move/attack" — combat.js owns "what happens when hits land" (damage
resolution, contact damage, status ticking). Every numeric per-enemy field
these read (`e.pathTimer`, `e.attackTimer`, `e.telegraph`, etc.) is eagerly
initialized in the `Enemy`/`Boss` constructor in entities.js; an uninitialized
field going through `-= dt` turns to `NaN` and silently freezes the enemy
forever, which is called out repeatedly in the source comments as the #1 way
boss work breaks in this codebase.

#### Shared helper functions

- **`seekVector(e, tx, ty)`** — returns `{x, y, d}`, the unit vector from `e`
  toward `(tx,ty)` plus the raw distance `d`. The basic building block every
  other movement helper composes from.

- **`makeIsBlockedFn(node, e)`** — returns a `(tx,ty) => bool` closure for use
  with `bfsPath` (utils.js). Blocked if the tile is solid for this entity
  (`isTileSolidForEntity`), or (for non-flying entities) if a non-destroyed,
  non-walkable obstacle occupies that tile. Walkable obstacles (mud/sand
  traps) are deliberately crossed rather than routed around.

- **`hasLineOfSight(node, e, tx, ty)`** — cheap straight-line raycast in world
  pixels: walks from `e` to `(tx,ty)` in `TILE*0.5`-sized steps, returning
  `false` the moment a step lands on a solid tile or intersects a non-hazard,
  non-walkable obstacle (obstacles with `alwaysBlocks` still block flying
  entities; other obstacles don't block fliers at all). Used as an early-out
  so `chaseSeek` only pays for a full BFS search when something is actually in
  the way.

- **`chaseSeek(game, e, tx, ty, speedMul, dt)`** — the workhorse "walk toward a
  point, routing around walls" helper used by nearly every regular and boss
  behavior. On a jittered ~0.3-0.5s throttle (`e.pathTimer`) it re-checks line
  of sight; if clear it drops any cached path (`e.navPath = null`), otherwise
  it computes a fresh `bfsPath` route and caches it on `e.navPath`. Each frame
  it advances along the cached waypoint list (popping a waypoint once within
  `TILE*0.45` of it) or falls back to `seekVector` straight at the target if no
  path is cached. Applies **Calming Incense** (`player.passives.calmingincense`):
  enemies within 150px of the player move at 0.85x while the aura is active.
  Finally calls `tryMoveEntity(e, node, node.obstacles, vx, vy)` with
  `e.speed * dt * speedMul * auraMult`. Committed dash/charge/leap attacks
  intentionally bypass this and call `tryMoveEntity` directly with a fixed
  velocity, so a telegraphed charge still reads as a straight, dodgeable line.

- **`fireProjectileAt(game, shooter, tx, ty, speed, damage, opts)`** — computes
  the angle from `shooter` to `(tx,ty)` and delegates to `fireProjectileAngle`.

- **`fireProjectileAngle(game, shooter, ang, speed, damage, opts)`** — pushes a
  `new Projectile(...)` at a fixed angle (rather than aimed at a point);
  merges `{ fromBoss: !!shooter.isBoss, source: shooter }` into `opts` so
  reflect/absorb items and boss-damage-bonus math can identify the source.
  Also used directly by combat.js's directional/pattern turret obstacles.

- **`fireSpread(game, shooter, tx, ty, speed, damage, opts)`** — the shot-shaping
  layer nearly every ranged regular-enemy behavior fires through. Reads
  `shooter.type.shotCount` (default 1) and `shooter.type.spreadAngle` (total
  fan width in radians; defaults to `DEFAULT_SPREAD_PER_BOLT (0.18) * (n-1)` if
  omitted) off the `ENEMY_TYPES` entry, and emits `n` evenly-spaced
  `fireProjectileAngle` calls symmetric about the aim angle. With
  `shotCount === 1` this degenerates to exactly `fireProjectileAt`, so a
  multi-shot enemy is purely a data change on its `ENEMY_TYPES` entry.

- **`dnbRing(game, e, n, speed, dmg, color, offset, gapIdx, gapWidth)`**
  (ai-4.js) — fires an evenly-spaced ring of `n` bolts from `e`. `gapWidth` is
  a count of *omitted* slots starting at `gapIdx` (0 = solid ring), so a
  ring you're meant to slip through and one you're meant to outrun are the
  same primitive with one argument changed. Used only by the DNB superbosses.

#### Regular enemy behaviors (`aiXxx`)

- **`aiWander`** — no target-seeking at all: picks a random direction
  (`e.pathDir`) every 0.6-1.4s and walks it via `tryMoveEntity` at half speed.
  Used for idle/passive enemies and as the fallback for `aiCharmed`.

- **`aiFeared`** — walks directly *away* from the player at full `e.speed`
  (negated `seekVector`); set by on-hit fear statuses, not chosen by
  `e.behavior` directly.

- **`aiCharmed`** — just calls `aiWander`; a charmed enemy drifts aimlessly
  rather than attacking.

- **`aiChase`** — the simplest aggressive behavior: `chaseSeek` straight at the
  player at full speed, no attack of its own (relies on contact damage).

- **`aiRanged`** — kites at `t.keepDistance` (default 160): backs straight away
  if closer than `keep-20`, `chaseSeek`s in if farther than `keep+20`, holds
  otherwise. Fires `fireSpread` at the player when `e.fireTimer` expires and
  distance is under `t.fireRange` (default 420), using `t.boltSpeed`/`t.fireCooldown`/`t.boltColor`/`t.boltRadius`.

- **`aiFlyer`** — blends a seek vector toward the player (0.6 weight) with a
  wandering `e.pathDir` (0.4 weight, re-rolled every 0.5-1.2s) for a drifting
  flight path, moving at full `e.speed`. Fires `fireSpread` within
  `t.fireRange` (default 380) on its own `fireTimer`/`fireCooldown`.

- **`aiBomber`** — chases the player until within 34px, then arms
  (`e.arming = true`, `e.fuseTimer = t.fuseTime || 0.9`) and blinks
  (`hitFlash`) while counting down. On fuse expiry it self-destructs
  (`e.isDead = true`), spawns an `Explosion` of `t.blastRadius` (default 72),
  damages the player if in range via `damagePlayer`, and calls
  `handleEnemyDeath`.

- **`aiCharger`** — three-state: normal `chaseSeek` at 0.7x speed while its
  `attackTimer` counts down; once expired and in range (<260px) it enters a
  `telegraph` window (blinking `hitFlash`); on telegraph expiry it commits to
  a fixed-velocity dash (`e.dashing`, `e.dashVX/VY = seekVector * e.speed * t.chargeSpeed`)
  for `t.dashDuration` (default 0.4s), via raw `tryMoveEntity` (bypassing
  `chaseSeek`, per the "committed dashes ignore pathfinding" convention).

- **`aiTurret`** — completely stationary; only fires `fireSpread` at the
  player within `t.fireRange` on its own cooldown. No movement code at all.

- **`aiLeaper`** — like `aiCharger` but the dash ("leap") is shorter
  (`t.dashDuration` default 0.3s, `t.leapSpeed` default 5) and it only
  slow-walks (`chaseSeek` at 0.3x) while its `attackTimer` is still counting
  down, standing still once armed and telegraphing.

- **`aiOrbiter`** — holds a standoff ring of radius `t.orbitRadius` (default
  120) around the player by chasing a point on the ring led ahead by
  `t.orbitSpeed * e.orbitDir` (an alternating +1/-1 direction set at spawn),
  so continuous circling falls out of "chase a moving target point" rather
  than explicit angular integration. Fires `fireSpread` within `t.fireRange`
  (default 400).

- **`aiBurrower`** — dive/surface cycle using `e.submerged`/`e.shielded` (the
  latter makes `Enemy.takeDamage` refuse hits — see entities.js). While
  submerged it closes distance at 1.5x speed, unhittable, and resurfaces
  (`submerged = false; shielded = false; hitFlash = 0.12`) either on
  `e.burrowTimer` expiry or once adjacent to the player. While surfaced it
  chases normally and re-submerges when `burrowTimer` expires.

- **`aiSummoner`** — keeps a standoff distance (`t.keepDistance`, default 190,
  backing away below it, approaching at 0.7x above `keep+60`) and periodically
  spawns minions from `ENEMY_TYPES[t.summonId || 'swarmerdnb']` near itself, up
  to a lifetime cap tracked on `e.minionsSpawned` (`t.maxSummons`, default 6).
  Spawn spot found via `findNearestFloor`.

- **`aiHealer`** — flees the player under 200px (via `aiWander` beyond that),
  and on `e.healTimer` expiry heals any wounded, non-boss, non-self ally
  within `t.healRadius` (default 140) by `t.healAmount` (default 2) each,
  pushing a `+N` green `FloatText`; only re-arms its cooldown
  (`t.healCooldown`, default 3) if it actually healed something. Never heals
  itself.

- **`aiSniper`** — the stillness-is-the-tell archetype. Outside its telegraph
  window it either backs off (distance < 35% of `t.fireRange`), approaches
  (distance > 90% of range), or — once `fireTimer` expires, distance is under
  `t.fireRange` (default 520) and it has line of sight — enters a long
  telegraph (`t.telegraphTime`, default 1.2s) with blinking `hitFlash`, fully
  rooted. On telegraph expiry fires one fast `fireSpread` bolt
  (`t.boltSpeed` default 420) and re-arms `fireCooldown` (default 2.6s).

- **`aiSwarm`** — cheap ground-based erratic mover: blends a seek vector
  toward the player with a wandering `e.pathDir` weighted by
  `t.driftAmount` (clamped 0-0.9, default 0.5), re-rolling drift every
  0.25-0.6s. No pathfinding (unlike `aiFlyer`'s equivalent), so packs fan out
  rather than queuing single-file behind a wall.

- **`aiAmbusher`** — dormant/inert (`e.triggered = false`: no movement, no
  drift at all) until the player crosses `t.triggerRange` (default 110), at
  which point it telegraphs and then dash-charges exactly like `aiCharger`,
  staying aggressive (re-telegraphing on cooldown) once woken.

- **`aiTeleporter`** — never walks. On `e.blinkTimer` expiry (default 3.5s)
  it blinks to a random legal floor tile within `t.blinkRange` (default 200,
  floored at 70) of the player via `findNearestFloor` (guaranteeing it can
  never land inside a wall), clears any cached path, flashes, and sets a
  0.3s arrival beat (`fireTimer = 0.3`) so it can't blink-and-shoot in the
  same frame. Fires `fireSpread` within `t.fireRange` otherwise.

- **`aiShielder`** — a support piece that keeps standoff distance
  (`t.keepDistance`, default 200) and, on `attackTimer` expiry, grants a
  temporary shield (`o.shielded = true; o.grantedShield = true; o.shieldTimer = t.shieldGrantTime`,
  default 2.5s) to every unshielded, unsubmerged, non-boss, non-self,
  non-`'shielded'`-archetype ally within `t.shieldRadius` (default 130). The
  granted shield's own expiry tick lives in combat.js's `updateEnemy`.

- **`aiLobber`** — indirect attacker: instead of a straight bolt it marks the
  player's *current* tile (`e.lobX/Y = player.x/y`) and detonates an
  `Explosion` there after `t.lobTime` (default 1.0s), holding position while
  the shell is airborne. Counterplay is moving, not dodging sideways.
  Otherwise chases in beyond `t.lobRange*0.85` and backs off under
  `range*0.35`.

- **`aiWeaver`** — closes distance along a serpentine path: swings a target
  point perpendicular to the player line by `sin(e.weavePhase) * t.weaveAmplitude
  * min(distance, 140)` (phase advanced by `t.weaveFrequency`, default 3
  rad/s) and `chaseSeek`s that point; the swing naturally collapses to zero as
  it nears the player so it still actually arrives.

- **`aiSentry`** — punishes standing still: samples the player's own speed
  frame-to-frame (`e.lastPX/PY`) rather than reading anything off the player
  object. Fires `fireSpread` only while the player's speed is under
  `t.sentryThreshold` (default 30) and in range; otherwise it `chaseSeek`s and
  forces a minimum 0.25s re-settle delay on `fireTimer` before it can fire
  again once the player stops.

- **`aiSkirmisher`** (Phase 2) — hit-and-run ranged: `chaseSeek`s in
  (`t.dashSpeed`-scaled weight, default 1.6x) whenever farther than
  `t.engageRange` (default 260) from the player, backs straight off (same
  invert-the-seek `tryMoveEntity` trick `aiSniper`/`aiLobber` use to kite)
  whenever closer than `t.retreatRange` (default 140), and — whenever it
  isn't outright too far to threaten — fires `fireSpread` on its own
  `fireTimer`/`fireCooldown` regardless of whether it's currently dashing in
  or holding the gap. Needed no new `Enemy` fields at all: reuses the
  already-generically-eager-init'd `fireTimer`.

- **`aiWhiplash`** (Phase 2) — melee reach-attacker: `chaseSeek`s at full
  speed until within `t.whipRange` (default 90, deliberately longer than an
  ordinary chaser's contact radius), then plants and counts down a telegraph
  (`e.telegraph`, same blinking-`hitFlash` shape `aiCharger` uses for its
  dash wind-up) of `t.whipTelegraph` (default 0.5s); on expiry, if the
  player is still within `whipRange`, deals `e.dmg * (t.whipDamageMult||1)`
  via `damagePlayer(game, playerDamageAmount(game, false, ...), e.type.id)`
  — the same call convention every other contact/telegraphed hit in ai.js
  uses — then re-arms `e.attackTimer = t.whipCooldown` (default 1.6s) before
  resuming the chase. Also reuses existing generic `Enemy` fields
  (`telegraph`, `attackTimer`) — no new constructor state needed.

#### Boss-specific behaviors (`aiBossXxx`)

All read `e.attackTimer`/`e.telegraph`/`e.dashing` etc. the same way the
regular archetypes do, layering in `e.minionsSpawned`/`e.minions2` one-shot
HP-threshold minion waves (`if (!e.minionsSpawned && e.hp < e.maxHp * X)`).

| Function | Pattern |
|---|---|
| `aiBossWarlord` | Chase + periodic fixed-velocity dash charge; spawns 2 gravegrubs at 50% HP. |
| `aiBossColossus` | Chase; alternates a rooted AoE stomp telegraph/explosion with a slow lobbed shot. |
| `aiBossHiveMother` | Keeps 220px standoff; fires a 5-bolt fan at the player; spawns 3 sandwisps at 60% HP. |
| `aiBossBoneSentinel` | 3-hit dash combo then a shielded regroup phase; spawns 2 graveturrets at 50% HP. |
| `aiBossBrambleQueen` | Alternates a full-ring burst telegraph with a 3-bolt aimed volley; spawns 2 saplings at 55% HP. |
| `aiBossSandWyrm` | Submerges, teleports near player, resurfaces with an AoE burst; spawns 2 duneskitters at 50% HP. |
| `aiBossPolish` (superboss, floor 6) | Chase + dash-or-5-bolt-fan coinflip; spawns 3 duneskitters at 50% HP; speed boost + "second phase" flag at 25% HP. |
| `aiBossTyrone` (superboss) | Chase; 3-way roll between AoE stomp, dash, and single aimed shot; two staggered minion waves (sandchargers at 50%, skullchargers at 20%). |
| `aiBossPineapple` (superboss) | Keeps 200px standoff; fires a wide 7-bolt fan; two staggered minion waves (sandwisps at 60%, fireflies at 25%). |
| `aiBossIsrael` (superboss) | Alternates a shielded regroup with a 12-bolt full ring; spawns 3 cryptslingers at 50% HP. |
| `aiBossAshTyrant` (Inferno) | Chase + periodic dash charge; spawns 2 emberlings at 50% HP. |
| `aiBossCinderColossus` (Inferno) | Rooted AoE stomp telegraph or slow lobbed shot; spawns 2 cinderhounds at 50% HP. |
| `aiBossMagmaWraith` (Inferno) | Submerge → teleport near player → AoE burst on resurface; spawns 2 magmaleapers at 50% HP. |
| `aiBossBrimstoneHorror` (Inferno) | Keeps 210px standoff; fires a 5-bolt fan; spawns 2 brimstonebombers at 60% HP. |
| `aiBossShadowStalker` (9A/9B/10A/10B secondary) | Teleport-blink near player then fire a tight 3-bolt fan; no minions. |
| `aiBossStormbringer` | Chase at 0.6x; periodic 8-bolt full ring; no minions. |
| `aiBossFrostSentinel` | Keeps 190px standoff; fires a steady 3-bolt fan on a flat 1.6s cooldown. |
| `aiBossBrickGolem` | Chase + telegraphed dash charge, single-hit (no bounce). |
| `aiBossGlacierFiend` | Rooted 10-bolt full-ring telegraph on a long cooldown; otherwise slow chase. |
| `aiBossBlizzardWraith` | Drifting flier movement (`aiFlyer`-style blend) + single aimed bolt. |
| `aiBossVineHorror` | Chase + telegraphed dash charge, single-hit. |
| `aiBossCanopyStalker` | Fast telegraphed dash charge (5.2x speed) with a short windup; otherwise slow approach. |
| `aiBossAlgae` (superboss, 10A) | Submerge/resurface AoE burst or 5-bolt fan coinflip; two staggered minion waves (icecrawlers at 60%, glacierbeasts at 25%). |
| `aiBossLilac` (superboss, 10B) | Chase; telegraph-ring or dash-charge coinflip; two staggered minion waves (junglestalkers at 60%, canopybeasts at 25%). |
| `aiBossBoneCaller` (Crypt) | Invulnerability tied to its own adds: raising a wave of gravegrubs (tagged `wardOwner`) also raises a shield that only drops once every tagged minion is dead (or `e.wardTimer` caps it); also fires single aimed bolts. |
| `aiBossGraveChorus` (Crypt) | Rotating two-armed spiral of bolts (`e.spinAngle`) for a fixed 2.2s window, then a slow reposition. |
| `aiBossRotBloom` (Forest) | Seeds delayed damage pods at the player's *current* position (up to 3 in a row, `lobber`-style), the counterplay being to keep moving. |
| `aiBossAntlerWarden` (Forest) | A charge that *bounces* off walls instead of stopping (`e.bounces` decremented per axis reflect via `tryMoveEntity`'s per-axis movement report), turning the room into a ricocheting battering ram for ~2s. |
| `aiBossGlassScorpion` (Desert) | Never closes: holds an orbiting standoff ring (reuses `aiOrbiter`'s bearing-lead trick at boss scale), freezes for a long lock-on, then fires one very fast bolt (a 3-bolt fan once enraged below 50% HP, which also reverses its strafe direction). |
| `aiBossDuneRavager` (Desert) | Charges while dropping a trail of delayed sand-burst "pyres" (`e.pyres`, each detonating 0.75s later) along the path it ran. |
| `aiBossFurnaceHeart` (Inferno) | Pressure cycle: walks the player down, vents 3 rotated rings back-to-back (each faster/wider-angled), then hangs nearly motionless exhausted for 1.6s. |
| `aiBossSlagbound` (Inferno) | Answers damage taken rather than a timer: accumulates `e.retaliation` from HP lost since the last frame (via a `prevHp` compare) and vents a 14-bolt ring once a threshold (4, halved to 2 below 40% HP) is crossed; also fires periodic single aimed shots. |
| `aiBossPlapper` (11A, DNB "bassline") | Fixed 2-part bar: rest beat (walks the player down) then downbeat (5-shot burst at the player), with every 3rd downbeat replaced by a gapped-ring shockwave + contact blast; two staggered minion waves. |
| `aiBossClapper` (11B, DNB "snare") | Blink-clap: submerges/reappears near the player then immediately fires a solid 8-bolt ring, in pairs (threes below 50% HP); two staggered minion waves. |
| `aiBossNhm` (12A, DNB "buildup and drop") | Rooted 2s buildup phase spawning adds (icecrawlers, capped at 8 lifetime) then a 4-shot rotating gapped-ring "drop" where the safe lane visibly walks. |
| `aiBossVanillaDnb` (12B, DNB "smooth operator") | A slowly-rotating 3-armed sweep (3s) alternating with a small-heal shielded regroup phase (~2.5%/tick). |
| `aiBossOneTrueDnb` (13, finale) | 5 HP-band phases, each a compressed version of Plapper/Clapper/Nhm/Vanilla's patterns, with the final band layering the sweep and clap patterns simultaneously; every phase transition is telegraphed with one gold ring pulse + a full second of stillness and wipes all sub-pattern state; two staggered minion waves. |
| `aiBossEclipseWraith` (Phase 2, Crypt glass cannon) | Same teleport-blink core as `aiBossShadowStalker`, but the landing payload alternates via `e.pattern` (0/1, flipped every cycle — same counter shape `aiBossRotBloom` uses): a 9-bolt expanding ring (short 0.6s telegraph) or one slow, heavy, generously-telegraphed single bolt aimed at the player (1.0s telegraph, bigger radius/damage). No minions. |
| `aiBossIronBastion` (Phase 2, Crypt siege body) | Alternates a telegraphed ground-slam AoE — identical `e.lobX/lobY/lobTime/lobTimer` + `burstRadius`-sized ground-target-marker shape `aiBossRotBloom` uses — with a short telegraphed charge-dash (`aiCharger`'s wind-up-then-lunge shape), picked via the same `e.pattern` 0/1 flip. No minions; `burstRadius` REQUIRED on its `BOSS_TYPES` entry (see below) or the slam lands unannounced. |

### familiars.js

Persistent companion update logic. `entities.js`'s `Familiar` class and
`data.js`'s `FAMILIAR_TYPES` define the static data (`f.def`); this file is
the per-frame behavior dispatch and every behavior's actual logic.

**`FAMILIAR_DMG_GROWTH = 1.15`** and **`familiarDamage(baseDmg, floorNum)`** —
`Math.max(1, Math.round((baseDmg||1) * Math.pow(1.15, floorNum||0)))`. Every
familiar damage number in the file routes through this. It exists for the
same reason `enemies.js`'s `explosionDamage()` does: `FAMILIAR_TYPES.dmg` is an
*identity* number (a 3 hits harder than a 1, at every depth) but enemy HP
compounds at ~1.32^floor. 1.15 is deliberately gentler than both enemy HP
growth (1.32) and the bomb/active-item curve (`BOSS_HP_GROWTH`, 1.28): a
familiar is free, untargeted DPS the player doesn't aim, so by design it ends
a 10-floor run only ~3.5x its Floor-1 self (vs. trash ending it ~15x) — it
stays "chips in," never "clears the room for you."

**`updateFamiliars(game, dt)`** — iterates `game.player.familiars` and
dispatches each on `f.def.behavior`: `orbiter`, `shooter`, `proc`, `blocker`,
`thief`, `grower`, `detonator`, `mirror`, `scavenger`, `berserker`, `swarmer`.

- **`updateOrbiterFamiliar`** — orbits the player at `def.radius` with angular
  speed `def.orbitSpeed`; on contact with a live enemy (circle intersect
  radius 9), deals `familiarDamage(def.dmg + (Hound Whistle ? 1 : 0), floorNum)`
  through `e.takeDamage`, pushes a white float text, rolls `def.freezeChance`
  to freeze non-boss targets, calls `handleEnemyDeath` on kill, then sets
  `f.contactCooldown = def.contactCooldown` (x0.85 with Swarm Collar trinket).

- **`updateShooterFamiliar`** — hovers in a loose 30px orbit around the player
  (pure presentation drift, explicitly left untouched in a rebalance pass;
  the actual anti-stacking trick is each familiar's distinct starting angle
  set in the `Familiar` constructor). Acquires the nearest live enemy within
  300px (cut down from an original 420px, since that out-ranged the player's
  own base reach ~2x) and fires a homing-free `Projectile` at it on
  `def.cooldown` (x0.85 with Swarm Collar), damage via `familiarDamage`.

- **`updateProcFamiliar`** — hovers at a fixed offset behind the player
  (`player.x-26, player.y-30-index*4`) and on `def.interval` dispatches on
  `def.procType`: `'heal'` (heals `def.amount` red hearts if not full),
  `'coin'` (drops a coin pickup at a clear spot near the player), `'luckpulse'`
  (`player.luckyPennies += def.amount; recalcPlayerStats(player)`), or
  `'charge'` (tops up `player.activeCharge` by `def.amount`, capped at
  `activeItem.maxCharge`).

- **`updateBlockerFamiliar`** — hovers opposite the proc familiar's offset; on
  `def.interval` tops the player's `player.shieldHits` pool up to `def.maxShields`
  (default 1) by +1 if under cap — the same shield pool Iron Curtain and the
  Aldebaran/Megrez stars fill.

- **`updateThiefFamiliar`** — identical orbiter contact-damage logic, plus a
  `def.stealChance` (default 0.1) roll per connecting hit to drop a coin
  pickup where the enemy stood (reuses proc's `'coin'` spawn path) and pushes
  a "stolen!" float text.

- **`updateGrowerFamiliar`** — an orbiter whose damage permanently scales with
  `game.runKills` (reset per-run, not per-room): `steps = floor(runKills / def.killsPerGrowth)`
  (default 15), `mult = min(def.maxGrowth (default 3), 1 + steps * def.growthStep (default 0.25))`,
  applied to `def.dmg` before `familiarDamage`.

- **`updateDetonatorFamiliar`** — drifts near the player in a small 34px loop
  and, on `def.interval` (x0.85 with Swarm Collar), pulses AoE damage
  (`def.radius`, default 70) to every enemy in range around *itself* — same
  pulse shape as `attackStyles.js`'s `chargeNova`, but centered on the
  familiar.

- **`updateMirrorFamiliar`** — a shooter variant that targets by the
  *player's facing* rather than nearest-to-self: among enemies within
  `def.range` (default 300) it picks whichever has the smallest angular
  difference from `player.facing`, holding fire entirely if the best
  candidate is outside `def.arc` (default 1.0 rad) — "it shoots what you're
  committing to."

- **`updateScavengerFamiliar`** — hovers near the player and, on
  `def.interval`, grabs the nearest uncollected pickup within `def.radius`
  (default 120) via combat.js's own `collectPickup()` (the exact call
  `updatePickups` makes on player walkover), so every pickup kind resolves
  identically; then filters collected pickups out of `node.pickups`.

- **`updateBerserkerFamiliar`** — an orbiter whose contact-damage multiplier
  climbs as the player's own red HP falls: `mult = 1 + def.berserkPower (default 1) * (1 - redFraction)`,
  i.e. x1 at full health up to x(1+berserkPower) at death's door (Blood
  Pact's risk/reward, as a familiar).

- **`updateSwarmerFamiliar`** — hovers near the player and, on `def.interval`,
  buds off `def.orbCount` (default 3) short-lived mini-orbs
  (`f.miniOrbs`, lazily created, `def.orbLife` default 4s) that circle the
  familiar itself at `def.orbSpeed` (default 4.5 rad/s) and independently
  chip any enemy they touch (own `orb.cd` per-orb cooldown, `def.contactCooldown`
  default 0.5s). Expired orbs are filtered out of `f.miniOrbs` each frame.

### pills.js

Binding-of-Isaac-style unknown pills. A pill's color (see `data.js`'s
`PILL_COLORS`) is all the player sees until used; the color→effect mapping is
randomized once per run (`game.pillEffectMap`, built in `game.js`'s
`startRun`) and revealed permanently in `game.pillIdentified` the first time
that color is used. Held in a single pocket slot (`player.pillPocket`), used
with Q.

- **`useHeldPill(game)`** — pops whatever's in `player.pillPocket` (toasts "No
  pill to take" if empty), calls `identifyAndApplyPill`, bumps the
  `pillsUsed` stat.

- **`identifyAndApplyPill(game, colorId)`** — looks up `effectId =
  game.pillEffectMap[colorId]` and `effect = PILL_EFFECTS[effectId]`, marks
  `game.pillIdentified[colorId] = true` if not already known, calls
  `applyPillEffect`, then toasts either just the color name (if already
  known) or `"<color> was... <effect>!"` (first reveal), playing `uiDeny` for
  a bad pill or `itemGet` for a good one.

- **`applyPillEffect(game, effectId)`** — the actual effect switch, on
  `effectId`:
  - `fullhealth` — `redCurrent = redMax`.
  - `speedup` / `speeddown` — `player.pillSpeedBonus += 0.10` / `-= 0.075`,
    then `recalcPlayerStats`.
  - `damageup` / `damagedown` — `pillDamageBonus += 1` / `-= 0.75`.
  - `luckup` / `luckdown` — `pillLuckBonus += 2` / `-= 1.5`.
  - `rangeup` / `rangedown` — `pillRangeBonus += 1` / `-= 0.75` (translates to
    +1 tile on ranged classes, +0.25 tile on melee, per `recalcPlayerStats`'s
    `rangeScale`).
  - `tearsup` / `tearsdown` — `pillFireRateBonus += 0.15` / `-= 0.11`.
  - `chargeup` — instantly fills `player.activeCharge` to max, if an active
    item is equipped.
  - `heartup` — `player.grantHeartContainer(1)`.
  - `hpdown` — deals exactly 1 damage, blue-first (mirrors `takeDamage`'s
    drain order) but deliberately bypasses invuln/shield/dodge so a
    deliberately-swallowed pill can't silently whiff; guarded so `redMax:0`
    classes with no blue left take nothing rather than dying to a zero clamp.
  - `hpup` — `player.heal(1)` if `redMax > 0`, else `player.healBlue(1)` (for
    classes like Pony Bot with no red health).
  - `mystery` — recursively applies one random good effect and one random bad
    effect (both pools exclude `'mystery'` itself, so it can never recurse
    into itself).
  - Every "Down" pill is intentionally 3/4 the magnitude of its matching "Up"
    (used to be exactly half), so eating every pill found still averages
    positive but a bad identify is no longer a non-event.

### stars.js

Named, always-visible one-shot consumables (Pleiades-themed) — unlike a pill,
a star's name/description are shown up front on pickup and in the HUD. Held
in `player.starPocket`, used with R. "For the room" effects are cleared on
room entry by `game.js`'s `enterRoom`.

- **`useHeldStar(game)`** — pops `player.starPocket` (toasts if empty), calls
  `applyStarEffect`; if it returns `false` (nothing to act on — e.g.
  rerolling an empty room) the star is **not** consumed and `starsUsed` is
  not bumped, since `refundStar` already re-pocketed it.

- **`refundStar(game, starId, msg)`** — re-pockets the star, toasts `msg`,
  returns `false`.

- **`TELEPORT_ROOM_NAMES`** — id→label map for the Compass stars' failure
  toast, keyed to match `dungeon.js`'s `SPECIAL_ROOM_TYPES` and `data.js`'s
  `STAR_TYPES[...].desc` wording.

- **`applyStarEffect(game, starId)`** — dispatch function, returns `undefined`
  (truthy-ish, i.e. "consumed") on success or `false` via `refundStar` on
  failure.
  - **Compass stars** (`starId.startsWith('teleport_')`, 11 of them, one per
    special room type): finds the nearest not-current room of the matching
    type on the floor (by grid distance) and calls `game.enterRoom(target,
    null)` (drops the player centered rather than at a door). Refunds if no
    such room exists. Falls through into the shared toast/sound tail rather
    than being a `case` in the switch below.
  - Then a `switch(starId)` over ~30 named stars, grouped by mechanism:
    - **Flat stat/room buffs**: `alcyone`/`arcturus`/`dubhe` (+3/+5/+8 damage
      for the room, via `starDamageBonus` + `recalcPlayerStats`),
      `electra`/`vega` (+50%/+100% speed for the room, via
      `starSpeedMult`), `alkaid` (10s invincibility, reuses Panic Whistle's
      `invincibleTimer`).
    - **Healing/shields/permanent grants**: `atlas` (+2 blue), `achernar`
      (+3 red), `mizar` (full red heal), `aldebaran`/`megrez` (+1/+3
      `shieldHits`), `procyon` (+1 heart container), `spica` (+1 permanent
      luck), `antlia` (+2 keys, +2 bombs), `merak` (fully recharge active
      item, refunds if none equipped), `alnitak` (reveal the floor —
      `eyeUsed`/`revealMap`, the same pair All-Seeing Eye sets).
    - **Rerolls** (delegate to `room.js` helpers): `deneb` (reroll one
      untaken pedestal), `altair` (reroll room hazards), `capella` (reroll
      room enemies), `bellatrix` (championize room enemies) — all refund if
      nothing qualifies.
    - **Room-wide enemy effects**: `phecda` (8s freeze, a longer Polaris),
      `alnilam` (fear all, via `applyRoomWideStatus`), `mintaka` (charm one
      random enemy), `saiph` (0-damage knockback nova via `knockbackNova`),
      `rigel` (execute the weakest living enemy, routed through
      `takeDamage`+`handleEnemyDeath` so death bookkeeping fires normally),
      `sirius` (depth-scaled damage-all + freeze).
    - **Base stars** (unlockless): `maia`/`merope`/`pleione`/`celaeno`
      (scatter 4 hearts/2 keys/3 bombs/2 pills via `scatterStarPickups`),
      `taygeta` (`destroyAllObstacles`), `antares` (depth-scaled damage-all
      via `enemyHpScale`), `polaris` (3s freeze-all).
    - **Spawns**: `betelgeuse` (6 coins), `castor` (2 more stars), `pollux`
      (a free item/trinket pedestal via `addItemOrTrinketPedestal`),
      `regulus` (a treasure chest via `Chest`+`CHEST_TYPE_POOL`).
  - Ends with a shared `Sound.play('itemGet')` + `game.toast(star.name + ' — ' + star.desc)`.

- **`applyRoomWideStatus(game, timerField, duration, sfx)`** — sets a named
  status timer field (e.g. `'fearTimer'`) to at least `duration` on every
  living non-boss enemy in the room; used by `alnilam`.

- **`knockbackNova(game, strength)`** — calls `e.takeDamage(0, dx, dy)` on
  every living enemy, pushing them directly away from the player through the
  exact same knockback plumbing melee/explosions use, without dealing (or
  counting as) damage.

- **`scatterStarPickups(game, kind, count)`** — drops `count` copies of a
  ground pickup kind at small random clear spots near the player via
  `room.js`'s `spawnResolvedPickup`, so e.g. a scattered `'pill'` still rolls
  its own random color like any other pill.

### items.js (split across 2 files: items-1.js, items-2.js)

Passive/active item effects, the player stat-recalculation engine, and shop
purchase logic.

#### `recalcPlayerStats(player)`

The single most important function in the game — a ~980-line pure function
that recomputes **every** derived player stat from scratch on each call,
reading `player.passives` (a `{itemId: count}` map, abbreviated `p`),
`player.trinketId` (abbreviated `t`, single-slot), the Completionist capstone
count (`crown = p.championscrown || 0`), and iterating `ITEM_LIST` (data.js)
for the attack-layers pass. Nothing here is incremental — every stat is a sum
of `(count || 0) * weight` terms across every item/trinket/achievement-trophy
that touches it, so recalculating fully is what keeps behavior correct
regardless of pickup order and lets a run always be re-derived cleanly.

**When/where it's called** (every mutation site that changes something this
function reads must call it, or the change is invisible until the next
natural call):
- `game.js` — once in `startRun()` right after `new Player(classId)`, and
  again in room-entry cleanup whenever a "for the room" star buff
  (`starDamageBonus`/`starSpeedMult`) needs clearing on entering a new room.
- `systems/items-2.js` — `equipTrinket`, `applyPassiveEffect` (every passive
  pickup), `updateShop`'s pickup-kind purchases indirectly via those.
- `systems/pills.js` — every stat pill (`speedup/down`, `damageup/down`,
  `luckup/down`, `rangeup/down`, `tearsup/down`) and the `mystery` pill's
  recursive resolution.
- `systems/stars.js` — `alcyone`/`arcturus`/`dubhe` (damage buffs) and
  `spica` (permanent luck).
- `systems/familiars.js` — the proc familiar's `'luckpulse'` effect.
- `systems/combat-2.js` — coin pickups that carry a `c.luck` bonus
  (`collectPickup`'s coin-collection path).

**What it computes, and every `player.*` field it assigns** (the canonical
list of "what player stats exist"):

- `player.luck` — base `luckyPennies` plus a very long weighted sum of luck
  passives/trinkets/achievement trophies (Lucky Clover, Luck Up pill,
  Completionist crown, dozens of `slayertrophy_*`/`masterytrophy_*`/
  `explorationtrophy_*` achievement rewards, and many single-copy trinkets).
  Derives `luckBonus = luck * 0.006` (+0.6% to on-hit status chances per luck
  point), used by several stats below.
- `player.speed` — `baseSpeed * clamp(1 + Σ(speed sources), 0.25, 2.2)`. The
  2.2 ceiling is a **correctness** bound, not balance: `tryMoveEntity` is a
  single-step collision test with no substepping and `main.js` clamps
  `dt ≤ 0.05s`; a step longer than `TILE + 2*playerRadius` (56px) can tunnel
  through a one-tile wall, and the uncapped sum of ~35 additive sources plus
  the x2 Vega star could reach ~1950px/s (97px/frame) — the cap keeps the
  worst case at ~858px/s (43px/frame), under the 56px tunneling threshold.
- `player.meleeDamage` and `player.rangedDamage` — near-identical formulas:
  `max(0.5, base*Damage + Σ(damage sources))`, both reading the same huge set
  of passives/trinkets/trophies (Iron Shoes, Damage Up pill, crown, Dragon
  Fire Core, dozens more) plus `player.pillDamageBonus + player.starDamageBonus`.
  No cap (unlike most other stats here — flat damage additions don't compound
  multiplicatively the way percentage stats do).
- `player.meleeCooldown` / `player.fireCooldown` — both
  `base*Cooldown * rateMult`, where `rateMult = clamp(1/rateDenom, 0.35, 3)`
  and `rateDenom = max(0.25, 1 + Σ(fire-rate sources) + player.pillFireRateBonus)`.
- `player.rangeTiles` — `clamp(baseRangeTiles + rangeBonusTiles*rangeScale +
  farseeingBonus + eagleEyeBonus, 0.25, 12)`, where `rangeScale` is 0.25 for
  melee classes and 1 for ranged (a "range" nudge reads as much smaller on a
  swing than a bolt's flight), Farseeing Charm only applies to non-melee, and
  Eagle Eye applies to both. Capped at 12 tiles so a ranged build can't delete
  every room from the doorway.
- `player.meleeRange` — `rangeTiles * TILE * (Bent Nail trinket ? 1.2 : 1)`.
- `player.boltSpeed` — flat per-class flavor, `player.def.boltSpeed || 340`.
- `player.bossDamageBonus` — `min(1, Σ(boss-damage sources))`. Capped at
  +100% since ~20 additive 0.05-0.15 sources could otherwise exceed +200%,
  which would out-scale even the gentler boss HP growth curve.
- `player.bossDamageTakenMult` — `max(0.25, 1 - Σ(damage-reduction sources))`
  (Stonewall, Bulwark Shard, and several C-branch/newrewards trinkets/passives).
- `player.spikedBarding` — boolean, `(p.spikedbard||0) > 0 || t === 'thornedvine'`.
- `player.lifestealChance` — `min(0.4, Σ(lifesteal sources))`. Capped hard:
  15 additive 0.05-0.08 sources could sum past 1.0, which against a game
  whose contact damage is half a heart would mean every hit healing half a
  heart — "immortality with extra steps."
- `player.critChance` — `min(0.75, Σ(crit sources) including luckBonus)`.
- `player.revealMap` — boolean, `(p.nightlens||0)>0 || player.eyeUsed || t === 'foxfirelantern'`.
- `player.hasSecondWind` — boolean, `(p.secondwind||0)>0 || t === 'emberphylactery'`.
- `player.onKillHealChance` — `player.def.lifedrinkChance + Σ(on-kill-heal trinkets/passives)`.
- `player.venomChance` / `player.stunChance` / `player.charmChance` /
  `player.freezeChance` / `player.fearChance` — five parallel on-hit-status
  formulas (statuses never affect bosses, per combat.js's
  `applyOnHitStatuses`), each independently capped at a value chosen by how
  much agency the status removes: stun 0.30 and freeze 0.35 (hard locks —
  freeze gets the slightly looser cap because Windigo's whole class identity
  is stacking `innateFreezeChance`), charm 0.35 (converts rather than merely
  disables), fear 0.40 (disables offense but the enemy still moves), venom
  0.50 (pure DoT, least removal of agency). Each formula sums a "luck-scaled"
  lead term (`count * 0.10-0.12 + luckBonus`) plus many flat/direct trinket
  and trophy sources.
- `player.vulnerableChance` (Phase 1 overhaul) — the 6th on-hit status
  formula, but a different shape from the five above: `min(0.4,
  player.def.innateVulnerableChance + Σ(flat trinket/item chances))`, with
  **no luck-scaled lead term** — every source is a flat, non-luck-scaled
  percentage (the items/trinkets themselves say so in their `desc`).
  Sourced from the Gargoyle class's `innateVulnerableChance` plus Hunter's
  Mark/Quarry Sigil/Warden's Eye/Brander's Tag/Snare Glyph/Predator's Eye/
  Ecosystem Totem and the Duskstone Mark/Stonefeather Tag trinkets. Capped
  at 0.4 for the same reason its five siblings are capped — an uncapped
  stacking sum could reach 1.0 and every hit would carry the 1.5x
  Vulnerable damage multiplier permanently. Also sets `player.rotAndRuinActive
  = player.vulnerableChance > 0 && player.venomChance > 0` (Synergy B, see
  the Synergies subsection immediately below) — computed once here and read
  later at `combat-3.js`'s poison-tick site.
- `player.magnetRadius` — `min(220, Σ(magnet sources))`. Capped so an
  uncapped stack (~400px) wouldn't vacuum an entire ~480-640px room from the
  doorway.
- `player.bombRadiusMult` — `min(2.5, 1 + Σ(bomb-radius sources))`.
- `player.tearFlags.pierce` / `.homing` / `.spectral` / `.explosive` — each a
  simple additive count (not percentage-capped) of items/trinkets/passives
  that grant that tear behavior; read by combat.js's projectile-firing code
  (see entities.js's `Player` constructor for the `tearFlags` shape).
- `player.multishotExtra` — `min(4, (p.multishot||0) + (p.doublebarrel||0) + ...)`.
  Capped at 4 extra bolts (5 total): Multi Shot used to grant 2 bolts per copy
  uncapped, "the definition of the run being decided by one specific item."
- `player.dodgeChance` — `min(0.6, Σ(dodge sources))`. The degenerate end
  state here (`dodgeChance ≥ 1`) is worse than crit's — total unhittability —
  hence the tight cap.
- `player.critMultiplier` — `min(4, 2 + Σ(crit-multiplier sources))`. Razor
  Focus was rebalanced from +1/copy to +0.5/copy specifically because
  uncapped it combined with uncapped crit chance into "the single most
  degenerate interaction in the build space."
- `player.canFly` — boolean, `player.def.canFly || (p.borrowedwings||0)>0 || t === 'kitestring'`.
- `player.dealDiscount` — `min(1, 0.5*(p.dealmaker||0) + ...)`; discounts
  Devil Deal costs (floored elsewhere at half a heart in `game.js`'s
  `updateItemPedestal`).
- `player.shopDiscountBonus` — `min(0.5, Σ(shop-discount sources))`; combined
  again with Merchant's Ring/Pocket Ledger and re-capped at purchase time in
  `updateShop` below.
- `player.curseImmune` — boolean, `(p.holywater||0)>0 || t === 'blessedcenser'`
  (no entry/exit damage tax in cursed rooms).
- `player.attackLayers` — the **layered-attacks** construction loop: rebuilt
  from scratch every call (not pushed imperatively at pickup time, since
  items are never lost mid-run). Iterates `ITEM_LIST`; for every item entry
  carrying an `attackLayer: {style, ...params}` field with `count = p[it.id] > 0`,
  pushes `Object.assign({ itemId: it.id, count }, it.attackLayer)` onto the
  array. This is the data bridge to `systems/attackStyles.js`, which reads
  `player.attackLayers` at fire time to layer extra attack behaviors (novas,
  orbit rings, etc.) on top of the player's normal shot/swing — see that
  file for what each `style` actually does.

#### Synergies (Phase 1 overhaul) — a new pattern in `recalcPlayerStats`

Five small bonuses, each folded directly into an existing stat's own
expression at its point of use (the numeric contribution is still an inline
ternary/condition in each case — Phase 6a overhaul did NOT move any of that
math). Each is an ownership-combo, stat-threshold, or familiar-count
condition — a genuinely new shape for this function, which until Phase 1
only ever summed flat per-item/per-trinket weights. Search the file for
`Synergy A` through `Synergy E` to find every site a given synergy touches
(several touch more than one stat).

Phase 6a overhaul: every synergy's "is it currently active" boolean is now
ALSO stored as a named `player.<name>Active` field (`ecosystemSetActive`,
`rotAndRuinActive`, `marksmansEyeActive`, `packBondActive`, `twinFangsActive`)
— before this phase only `rotAndRuinActive` was a stored field (the other
four were purely inline conditions with no field to read from outside this
function). This was added so `ui/ui.js`'s new HUD synergy badge row
(`SYNERGY_BADGES`/`updateHUD`) has something to read without duplicating
each condition; the original inline conditions at each stat's point of use
are UNCHANGED (Ecosystem Set's `meleeDamage`/`rangedDamage` bonuses still
read the local `ecosystemSetActive` const computed near the top of the
function, not the newly-stored `player.ecosystemSetActive` field — both hold
the same value, just two different call sites reading it).

- **Synergy A — Ecosystem Set.** `ecosystemSetActive` is computed once, near
  the top of the function (before `meleeDamage`/`rangedDamage`, which are
  among the first stats it feeds), and also stored as `player.ecosystemSetActive`:
  own at least one item from **all three** new attackLayer families at once
  (any `markedForDeath` item AND any `venomBloom` item AND any `skyfall`
  item — see data/items-5.js). When true, adds a flat +0.3 to both
  `meleeDamage` and `rangedDamage`.
- **Synergy B — Rot & Ruin.** `player.rotAndRuinActive = vulnerableChance>0
  && venomChance>0`, computed once right after `vulnerableChance` is built.
  Read at the poison-tick site in `combat-3.js`'s `updateStatusEffects`: a
  target that's already Vulnerable takes 30% more from each poison tick, on
  top of `takeDamage`'s own Vulnerable 1.5x multiplier — the one synergy
  whose payoff fires in a different file than the one that computes it.
- **Synergy C — Marksman's Eye.** `player.marksmansEyeActive = player.critChance
  >= 0.20 && player.vulnerableChance > 0`, computed once right before
  `critMultiplier` (which needs both `critChance` and `vulnerableChance`,
  already built by that point) and read inline in that same expression
  (`+ (player.marksmansEyeActive ? 0.4 : 0)`) — a high crit chance backed by
  any Vulnerable source at all hits noticeably harder. A stat-threshold-AND-
  ownership condition, not a pure ownership one like the others.
- **Synergy D — Pack Bond.** `player.packBondActive = !!(player.familiars &&
  player.familiars.length >= 3)`, computed once near the top of the function
  and stored, though the three numeric call sites (`speed` +0.05,
  `meleeDamage`/`rangedDamage` +0.3 each) still re-check
  `player.familiars.length >= 3` inline rather than reading the new field —
  the one synergy keyed off a count of a *different system's* collection
  (`player.familiars`, familiars.js) rather than an item/trinket owned.
- **Synergy E — Twin Fangs.** `player.twinFangsActive = (p.fangguard||0)>0
  && (p.quiverstring||0)>0`, computed once near the top of the function and
  stored, though `critChance`'s own +0.05 contribution still re-checks the
  same condition inline rather than reading the new field. Own both halves
  of a matched melee/ranged support-item pair at once: Fang Guard
  (`p.fangguard`, melee-flavored) AND Quiverstring (`p.quiverstring`,
  ranged-flavored). Fang Guard and Quiverstring are otherwise plain +1
  melee/+1 ranged damage stat sticks on their own — the synergy is the
  entire reason either exists beyond that.

#### Other items.js functions

- **`equipTrinket(game, trinket)`** — single-slot swap: replaces
  `player.trinketId`, calls `recalcPlayerStats`, plays `itemGet`, bumps
  `trinketsEquipped`, marks bestiary seen, toasts (naming the replaced
  trinket if any), and pushes a name float text.

- **`applyPassiveEffect(game, item)`** — increments `player.passives[item.id]`,
  then a long `if/else if` chain of item-id-specific one-time side effects:
  heart-container grants (+1 for a long list of ids including `thickmane`,
  `hpup`, `seraphplume`, etc.; +2 for `giantsheart`/`saintofsuffering`; -1 for
  a "costs a red container" list like `witheredapple`/`blackheart`/`soulseller`,
  guarded by `!player.def.noRedContainers`), `luckydie` (50/50 gamble: +3 luck
  or -2 luck, its own float text since `applyItemToPlayer`'s "Found X!" toast
  would otherwise overwrite it), `witchbrew` (full red heal + `healBlue(999)`,
  clamped to the class's actual blue cap), `charmedpendant` (identifies every
  pill color at once). Always ends with `recalcPlayerStats`.

- **`applyItemToPlayer(game, item)`** — the top-level pickup entry point:
  plays `itemGet`, bumps `itemsCollected`, marks bestiary seen, then dispatches
  to `applyPassiveEffect` (type `'passive'`) or `player.pickupActiveItem(item)`
  (active items — see entities.js), toasts "Found X!" and pushes a name float
  text.

- **`addFamiliar(game, familiarDef)`** — pushes a `new Familiar(...)` onto
  `player.familiars` (familiars stack — every copy is a separate instance,
  not a count), plays sound, bumps `familiarsCollected`, marks bestiary seen,
  toasts, pushes float text.

- **`useActiveItem(game)`** — the space/whatever-key entry point: no-ops with
  a toast if no active item or not fully charged, otherwise zeroes
  `activeCharge`, plays `activeUse`, bumps `activeItemUses`, and calls
  `useActiveEffect`.

- **`useActiveEffect(game, item)`** — the active-item dispatch `switch` on
  `item.id`, ~50 cases. Every damage number inside routes through the local
  `depthDmg(base) = max(1, round(base * bossHpScale(floorNum)))` closure (the
  gentler boss curve, ~1.28^floor, chosen so a charge-limited button press
  never out-scales actually aiming), for the same reason
  `familiarDamage`/`explosionDamage` exist — flat active-item damage would
  otherwise be a room-wipe on Floor 1 and a rounding error by Floor 10. The
  switch's cases fall into a handful of reused shapes (many ids share nearly
  identical bodies, differing only in id/flavor/magnitude):
  - **Room-wide nuke, centered on player** (`moonshard`, `harbingeroftheend`,
    `livinglegendscrown`, `martyrsresolve`/`contractofshadows`-style,
    `boilingtonic`, `wildprism`, `gravecenser`, `glasstonic`, etc.) — damages
    every enemy within a fixed radius, pushes an `Explosion` visual.
  - **Room-wide flat damage, no radius check** (`thundercloud`,
    `sombrasbargain`, `sparkvial`, `wilddraught`, `hollowbeacon`,
    `heraldprism`, etc.) — damages every living enemy regardless of position,
    some (`sombrasbargain`/`martyrsresolve`) also spend up to half a heart of
    the player's own health (floored so the player always keeps ≥0.5 heart,
    same rule as a cursed chest/deal).
  - **Blink/teleport** (`blinkcrystal`, `grapplinghoof`, `emberlantern`) —
    moves the player along their facing direction (clamped to the room),
    grants brief `invulnTimer`; `grapplinghoof` additionally hits every enemy
    along the travel line.
  - **Heal** (`healingdraught`, `survivorsscar`, `glassdraught`, `deepflask`,
    `emergencyrations`, `wardenwhistle`, `mooncharge` — partial; `meditationbell`,
    `angelstears`, `prismshardnecklace`, `cinderphial`, `heralddraught` — full
    heal + toast).
  - **Invincibility/speed/shield windows** (`vialcourage`, `panicwhistle`,
    `dawnbringer`, `vagrantcharge`, `boilingprism`, `oldbell`, `emberbeacon`,
    `stormlantern`, `heraldwhistle`, `frostflask`, `hoofwraps`) — set
    `invincibleTimer`/`speedBoostTimer`/`shieldHits` to at least some floor
    value.
  - **Bomb drop** (`bombsatchel`, `powderkegheart`, `vagrantwhistle`) — grants
    bombs and/or places one immediately via `placeBombAt`.
  - **Coin grant** (`windfall`, `coinpurse`, `glassbeacon`, `oldhorn`) —
    random coin amount in a compressed range (explicitly derived against the
    per-floor income model documented in shop.js — see below).
  - **Map reveal** (`allseeingeye`, `wakingbell`) — sets `eyeUsed`/`revealMap`.
  - **Multi-pickup burst** (`giftbox`, `vaultemperorsseal`, `wardenchalice`) —
    grants 2-3 random pickups via `grantPickupEffect(rollGenericPickupKind())`.
  - **Room-freeze/stun** (`flashpowder`, `smokebomb`, `oldwhistle`,
    `radiantbell`) — stuns every non-boss enemy for a few seconds.
  - **`lunaraffinity`** — reveals one random undiscovered special-room node on
    the map.
  - **`chronoshard`/`sacredcharge`** — sets `game.slowTimer`.
  - **`ironcurtain`/`legendsmantle`/`stormlantern`** — grants flat
    `shieldHits`.
  - **`largepenny`** — spawns one coin, weighted toward pennies (nerfed from a
    guaranteed dime).

- **`updateShop(game)`** — per-frame proximity check against every
  `node.shopSlots` entry: computes a combined percentage `discount`
  (Merchant's Ring 0.2, Pocket Ledger trinket 0.1, Loyalty Badge
  0.05/stack, `player.shopDiscountBonus`), **capped at 0.7** (uncapped sum
  could exceed 1.0 and collapse every slot to the 1c floor for the rest of
  the run), applies it to `slot.price`. If the player can't afford it, throttles
  a "need N more coin(s)" toast via `node.keyToastCooldown`. On purchase:
  deducts coins, marks `slot.bought`, plays `shopBuy`, bumps
  `coinsSpent`/`shopPurchases`, and dispatches by `slot.kind` — `item` →
  `applyItemToPlayer`, `trinket` → `equipTrinket`, `familiar` → `addFamiliar`,
  else → `grantPickupKind`. Unlocks the `coinflip` achievement ("Mirror
  Shard") if the purchase leaves the player at exactly 0 coins.

- **`grantPickupKind(game, kind)`** — thin wrapper calling
  `grantPickupEffect(game, kind, player.x, player.y - 26)` (the shared
  pickup-resolution function, defined in combat.js).

### shop.js

Shop slot pricing (including the donation machine's permanent per-kind
discounts) plus the donation machine and reroll altar fixtures themselves.
Room placement/slot generation lives in `room.js` (`addShopSlot`,
`rerollShopSlots`); purchase logic lives in `items.js`'s `updateShop` above.

- **`DONATION_CAP = 1000`** — lifetime cap (across all runs) on coins fed to
  the donation machine.

- **A large derivation comment** documents what a run actually earns in coin
  income (~2.14c average pickup value; ~1.8-2c per cleared normal room
  factoring room-clear-reward chance, sacks/chests, and procedural chests;
  ~24c on Floor 1 rising to ~60c on Floor 10; ~420c across a full 10-floor
  run) and prices the shop against it: with `SHOP_BASE_PRICES` below, a shop
  averages ~11c/slot and ~39c total stock, so Floor 1's ~24c buys about 2 of
  3-4 slots (a real choice) while Floor 10's ~60c can clear the whole shop
  (fine, since by then the donation machine is where surplus goes).

- **`SHOP_BASE_PRICES`** — the **only** pricing source (a `price` field also
  exists on `data.js`'s `SHOP_PICKUP_PRICES` but is never read — `room.js`
  only pulls the `kind` from it and calls `shopPrice()`): `heartRed:3,
  heartBlue:6, bomb:5, key:5, pill:5, star:7, sack:8, battery:9, item:
  SHOP_ITEM_PRICE, trinket: SHOP_TRINKET_PRICE, familiar: SHOP_FAMILIAR_PRICE`
  (the last three pulled from `data/economy.js`). Priced by how much a single
  copy actually swings a floor — a red heart is the cheapest thing in the
  game (bought when about to die with 3c); a battery is the most expensive
  (re-fires an active item, some of which are room-wipes).

- **`SHOP_KIND_LABELS`** — human labels for each buyable kind, used by the
  donation-discount unlock toast and the achievements panel.

- **`isDonationDiscountUnlocked(kind)`** — reads
  `ensureUnlockShape(loadUnlocks()).donationDiscounts[kind]` (persisted save
  data, `main.js`'s `loadUnlocks`/`saveUnlocks`).

- **`SHOP_FLOOR_PRICE_STEP = 0.055`**, **`SHOP_FLOOR_PRICE_MAX_FLOOR = 12`**,
  **`shopFloorPriceMult(floorNum)`** — `1 + clamp(floorNum,0,12) * 0.055`, so
  prices scale from x1.00 at floor 0 to x1.66 at floor 12. Deliberately much
  gentler than the ~2.5x income curve across the same range, so deep shops
  feel like a bigger commitment without outrunning the player's wallet.

- **`shopPrice(kind, floorNum)`** — `base = SHOP_BASE_PRICES[kind] ?? 8`;
  `scaled = max(1, round(base * shopFloorPriceMult(floorNum)))`; then -1c
  (floored at 1) if `isDonationDiscountUnlocked(kind)`. This is what
  `room.js`'s `addShopSlot` prices every slot at; the percentage discounts
  (Merchant's Ring, Pocket Ledger, Loyalty Badge, `shopDiscountBonus`) stack
  on top at purchase time in `items.js`'s `updateShop`.

- **`tryDonateMachine(game)`** — the F-key action (bound in `main.js`).
  Requires the room to have a `node.donationMachine` and the player within
  30px of it. No-ops with a toast if the cap is already reached or the
  player has no coins. Otherwise deducts 1 coin, plays `coin`, pushes a
  float text, and calls `bumpStat('donationTotal', 1, game)` — that stat's
  own threshold-crossing logic (every 50c) unlocks the "Donations"
  achievement category (`achievements.js`), which is what actually grants
  each kind's -1c discount and records it via `unlockAchievement`'s
  `def.shopDiscount` handling.

- **Reroll altar** — the shop room's second fixture (opposite corner from
  the donation machine, placed by `room.js`'s `populateRoom`). Pays coins to
  re-roll every unbought item/trinket/familiar slot in the room (pickup slots
  never reroll) via `room.js`'s `rerollShopSlots`.
  - **`REROLL_ALTAR_COSTS = [3, 6, 10, 15]`**, **`REROLL_ALTAR_COST_STEP = 6`** —
    cost ladder per shop visit: the 5th and later use costs
    `15 + 6*(uses-3)`.
  - **`rerollAltarCost(altar)`** — looks up `altar.uses` (defaults to 0)
    against the table, extrapolating past the end with the step.
  - **`tryRerollAltar(game)`** — the G-key action, mirroring
    `tryDonateMachine`'s shape exactly (same 30px proximity gate, same
    coin/sound/float-text feedback). No-ops with a toast if nothing
    reroll-able remains (`countRerollableShopSlots`) or the player can't
    afford `rerollAltarCost(altar)`. On success: deducts coins, increments
    `altar.uses`, calls `rerollShopSlots(node)`, plays `itemGet` (the same
    "shelf changed" cue Deneb's star reroll uses), bumps
    `coinsSpent`/`rerollAltarUses`, toasts the new next-reroll price. The
    escalating `uses` count lives on the room node itself (not the player or
    any global), reset to 0 by `game.js`'s `enterRoom` on every entry — so
    leaving and re-entering restarts the curve, and two shops on two
    different floors never share a count.

- **`donationProgressFrac()`** — `clamp(unlocks.stats.donationTotal /
  DONATION_CAP, 0, 1)`, used to render the donation machine's fill level in
  the UI.

- **Arcade room fixtures** (Phase 4 overhaul) — see the arcade write-up in
  Part 3 above for the full per-kind reward table; this is the shop.js-side
  index.
  - **`ARCADE_BOMB_REWARDS`** / **`ARCADE_KEY_REWARDS`** — flat id-only
    arrays (4 items each, `data/items-5.js`) for the Bomb/Key fillies'
    capstone feeds.
  - **`ARCADE_COIN_FILLY_REWARDS`** — `['heartRed','bomb','key','pill','star']`,
    the Coin Filly's per-feed reward roll (excludes `'coin'`).
  - **`ARCADE_KEY_FILLY_CHEST_KINDS`** — `[{id:'grey',w:50},{id:'gold',w:30},{id:'stone',w:20}]`,
    the Key Filly's per-feed `Util.weighted` chest-kind roll.
  - **`findNearestArcadeFixture(node, player)`** — scans `node.fillies` then
    `node.machines`, returns `{obj, isFilly}` for whichever is nearest and
    within 30px, or `null`.
  - **`tryArcadeInteract(game)`** — the H-key action (bound in `main.js`).
    No-op if nothing's in range; otherwise dispatches to `feedArcadeFilly` or
    `useArcadeMachine`.
  - **`feedArcadeFilly(game, filly)`** — per-`filly.kind` switch (`coin`/
    `bomb`/`key`/`heart`/`battery`). Each capstone-bearing kind (all but
    `battery`) guards `if (filly.done) return` first.
  - **`useArcadeMachine(game, machine)`** — per-`machine.kind` switch
    (`friendship`/`tools`/`dark`).


---

<a id="part-7"></a>

# Part 7 — ui/, game.js, main.js

## ui/, game.js, main.js — the Game class, rendering, HUD/panel UI, the room editor tool, and bootstrap

### game.js

Defines the central `Game` class (constructor + `Object.assign(Game.prototype, {...})` for the rest of the state/lifecycle methods — note render.js bolts *more* methods onto `Game.prototype` the same way, via its own `Object.assign(Game.prototype, {...})` block, so `Game` is assembled from two files). This file owns *state* (run/floor/room lifecycle, camera, input-trigger glue, the per-frame `update()`); all canvas drawing is in render.js.

Module-level constants: `CAMERA_TILES=12`, `CAMERA_W`/`CAMERA_H` (camera size in px), `ROOM_FREEZE_TIME=0.4`, `ROOM_FADE_TIME=0.4`, `MAX_DPR=2`, `ROOM_LABELS` (room-type → banner text lookup, mirrors ui.js's `ROOM_TYPE_ICON`/`roomTypeColor` and render.js's `DOOR_COLORS`).

- **`roomLabel(node)`** → `ROOM_LABELS[node.type] || ''`. Used by `enterRoom` to show a banner via `showRoomBanner` (ui.js) on entering a special room.

#### `Game` constructor(canvas)
Sets up `canvas`/`ctx`, `dpr` (capped devicePixelRatio), sizes the backing store to `CAMERA_W/H * dpr`. Instance fields it initializes: `state` ('idle'|'playing'|'gameover'|'win'), `player`, `dungeon`, `currentRoom`, `projectiles`/`bombs`/`explosions`/`floatTexts` (all arrays), `swingFX`, `laserFX`, `paused`, `camX`/`camY`, `freezeTimer`, `roomFadeTimer`, `slowTimer` (Chrono Shard slow-mo), `now` (sampled once/frame), `_entityDrawScratch` (reused array for render.js's `drawWorldSorted`). Called only from main.js's `startGameWithClass`.

#### Prototype methods (state/lifecycle — this file)

- **`startRun(classId)`** — begins a new run: builds `new Player(classId)`, `recalcPlayerStats`, sets `state='playing'`, resets `floorsClearedNoDamage`/`floorBranch`/`floorPath`/`runElapsed`/`runKills`, bumps the `runsStarted` stat, calls `beginRunUnlocks()` (freezes which items/pickups this run may roll), rolls `pillEffectMap` (color→effect, fresh per run) and resets `pillIdentified`, reads `loadUnlocks()` to set `maxFloorsThisRun` (8 if Polish DNB defeated, else `BASE_MAX_FLOORS`), then calls `this.startFloor(0)`. Called by main.js's `startGameWithClass`.

- **`startFloor(floorNum)`** — generates the dungeon (`generateDungeon(floorNum)`), marks the current stage seen in the bestiary (branches on `floorPath==='C'`, `floorNum===12`, floor 8+ branch, or normal `STAGES` lookup — see `stageIndexForFloor`), applies Night Owl's Feather/Spectral Token/compass trinkets to pre-reveal room "seen" flags, resets several per-floor player flags (`secondWindUsedThisFloor`, `tookDamageThisFloor`, `unlimitedKeysFloor`, `unlimitedBombsFloor`), grants various floor-entry trinket/passive bonuses (Whispering Key, Vault Cracker, Guardian Feather, Blast Cap, Tiny Battery, Warding Sigil, Skeleton Pin, Toll Pouch, Soul Candle, Pilgrim's Flask), updates the lifetime `deepestFloor` stat (toasts a personal-best), unlocks `deepdiver` achievement at floor 8 (only when `floorPath` is null — floorNum 8 is 9C on the C-branch and 9D on the D-branch), then resolves `pendingBossType`: if `floorPath==='C'` it bumps `cBranchFloorsVisited` and maps floorNum 5/7/8/9/10/11 to Drenched/Brazil/Israel Prime/Monsoon/Mangrove/Kirk (Phase 7a inserted 10C/11C and moved Kirk, unchanged, from 10C to 12C); if `floorPath==='D'` it bumps `dBranchFloorsVisited` and maps floorNum 4/6/9 to Astrolabe/Orrery/The Singularity — one superboss at the end of each of the branch's three regions; otherwise a long if/else chain keyed on `floorNum` (5/7/8/9/10/11 per branch, then Phase 7a's linear 12 → Wobbler, 13 → Subdrop, 14 → The One True DNB). Every path falls back to `resolveGenericBoss` for its unscripted floors. Finishes by calling `this.enterRoom(this.dungeon.start, null)`.

- **`enterRoom(node, enteredSlot)`** — the workhorse for moving the player into any room: calls `ensureRoomBuilt(node)` (room.js), clears `player.fireZone` (Changeling green fire), determines if this is the dungeon's one true designated boss room and calls `populateRoom(node, dungeon, {floorBranch, bossType?})`, sets `currentRoom = node`, resets the reroll-altar use counter, re-arms Sprinter's Band's `speedBoostTimer`, marks encountered obstacle kinds seen in the bestiary, clears any expired "for-the-room" star buffs (`starDamageBonus`/`starSpeedMult`, calls `recalcPlayerStats`), resets `tookDamageThisRoom`, tracks `firstVisit`/`discovered`/`visited` flags and bumps first-visit room-type stats (petshop/curse/crystal/star/treasure/shop/secret/sacrifice/vault/challenge/sombra), calls `markBestiarySeen('seenRoomTypes', node.type, this)` unconditionally (idempotent), marks paired-slot neighbor rooms `seen`, clears all transient per-room arrays (`projectiles`/`bombs`/`explosions`/`floatTexts`/`swingFX`/`laserFX`), positions the player at the entered door slot (or room center if none), then — Phase 6a overhaul, immediately after both position-setting branches, unconditionally — hard-snaps every `player.familiars` entry and every `player.changelingMinions` entry's `x`/`y` to the player's freshly-set spawn position (a plain loop, safe no-op on the empty arrays every other class has; fixes a pre-existing bug where familiars/minions previously only closed a room-change gap via their slow per-frame lerp in `entities.js`, visibly crossing the map over 1-2 seconds after every door), calls `this.updateCamera()`, sets `freezeTimer`/`roomFadeTimer`, plays `bossIntro` sound and resets `tookDamageThisBossRoom` on undefeated boss rooms, and shows the room banner via `roomLabel`/`showRoomBanner`. Called from `startFloor` and `transitionThroughDoor`.

- **`transitionThroughDoor(slot)`** — crosses a door to `slot.pairedSlot.room`; applies the curse-room half-heart tax both ways (via `damagePlayer(this, 0.5, 'curse')`) unless `player.curseImmune`, then calls `enterRoom`. Called from combat.js's player-movement code (door-crossing detection — not in this file's scope, cross-file caller not grepped exhaustively but implied by the pattern).

- **`fitCanvas()`** — reads `#canvasWrap`'s client size, computes a `scale` against the logical `CAMERA_W/H` (capped at 2.2x), sets `canvas.style.width/height`, and calls `this._positionHudPanels(wrap, CAMERA_W*scale)`. Called from main.js (`startGameWithClass`, the `ResizeObserver`/`resize` listener, `fullscreenchange` listener).

- **`_positionHudPanels(wrap, canvasPxW)`** — sizes/positions `#leftPanel`/`#rightPanel` to whatever side space is actually available next to the canvas (clamped 130-190px), hiding them (`.hud-panel-hidden`/`.hud-panel-fallback` classes) if even the minimum won't fit.

- **`updateCamera()`** — recomputes `camX`/`camY` centered on the player, clamped to the room's pixel bounds (or centered if the room is smaller than the camera). Called every `update()` tick and once on room entry.

- **`tryPlaceBomb()` / `tryUseActive()` / `tryUsePill()` / `tryUseStar()` / `tryDonate()` / `tryReroll()` / `tryArcadeInteract()`** — thin guarded wrappers (no-op unless `state==='playing'`, not paused, not mid-freeze) that call into other systems' files: `placeBombAt` (combat.js family), `useActiveItem`/`useHeldPill`/`useHeldStar` (items.js/pills.js/stars.js), `tryDonateMachine`/`tryRerollAltar`/`tryArcadeInteract` (shop.js — the last one shares its name with the global function it delegates to; this works because a class method's bare name isn't a lexical binding visible inside its own body, so the unqualified call resolves to the module-scope function). Called from main.js's `keydown` handler (B/E/Q/R/F/G/H keys) and pointerdown (right-click → `tryPlaceBomb`).

- **`toast(msg)`** — thin passthrough to ui.js's global `toast()`.

- **`onRoomJustCleared()`** — plays `roomClear` sound, calls `player.gainRoomClearCharge()`, bumps `roomsCleared` stat, calls `spawnClearRoomPickup(this)`, heals 0.5 (Gold Heart, if undamaged this room), and applies several trinket procs (Tithe Bell coin drop, Mending Chime heal, Tin Whistle active-charge) with a toast. Called from combat.js when the last enemy in a room dies (not in scope of this doc's files).

- **`onBossDefeated(enemy)`** — sets `node.stairsSpot` unless this is a "bonus second boss room" (floors 8-11's extra boss room that shouldn't grant stairs), grants Trophy Chain coin drops, tracks `unlocks.superbossDefeats[id]` counts and saves via `saveUnlocks`, toasts on Polish DNB's first defeat and Tyrone's 3rd defeat, sets up `node.branchSpots` (9A/9B fork) once Tyrone has been beaten 3+ times prior to this run, and unlocks a long chain of achievements (`unlock_batpony`, `sb_<id>_<classId>`, `untouchable`, `challenge_bossstreak_*`, `unbreakable`, class-unlock achievements per superboss, `challenge_flawless_run`). Called from combat.js on boss-death.

- **`updateItemPedestal()`** — for each un-taken pedestal in the current room, checks proximity (<22px) to the player; handles devil-deal heart cost (`ped.isDeal`, denies with a toast if insufficient hearts, else `player.spendHearts`), then — Phase 3 overhaul — handles shrine coin cost the same way (`ped.isShrine`, denies with a toast + `uiDeny` and `continue`s if `player.coins < ped.coinCost`, else `player.coins -= ped.coinCost`), then routes to `equipTrinket`/`addFamiliar`/`grantPickupEffect('star', ...)`/`applyItemToPlayer` depending on `ped.isTrinket`/`ped.isFamiliar`/`ped.isStar`/plain item (a shrine pedestal falls through to the plain `applyItemToPlayer` path once paid), and starts the challenge-room wave sequence (`startChallengeRoom`) if applicable. Called every `update()` tick.

- **`updateItemExamine()`** — finds the nearest unclaimed pedestal within 70px and calls `showItemExamine(nearest)` (ui.js) to show/hide the tooltip. Called every `update()` tick.

- **`checkStairs()`** — if `node.branchSpots` exists, checks proximity to each branch spot and calls `this.descend(branch)`; else checks proximity to `node.stairsSpot` and calls `this.descend()`. Called every `update()` tick.

- **`descend(branch)`** — the floor-transition dispatcher. Tracks `floorsClearedNoDamage` streak (unlocks `unlock_zebra`/`challenge_floors_nodamage_4`/`_6`), plays the descend sound, converts a live Eternal Heart into a permanent heart container, then branches, in this order: `branch==='C'` sets `floorPath='C'` and calls `startFloor(2)` (the storm-drain path); `branch==='D'` sets `floorPath='D'` and calls `startFloor(3)` (Phase 7a, the Planetarium path); any other truthy `branch` sets `floorBranch` and calls `startFloor(8)` (9A/9B fork); if already on the C-branch, either ends the run in a win (at `C_LAST_FLOORNUM`, bumping `cBranchRunsCompleted`) or advances `floorNum+1`; if on the D-branch, the identical block against `D_LAST_FLOORNUM`/`dBranchRunsCompleted`; otherwise walks the normal chain (floorNum 8→9→10→11→12→13→14 fixed steps, then `next>=maxFloorsThisRun` triggers a win, else `startFloor(next)`).

  The fixed per-floorNum steps are load-bearing, not redundant: `maxFloorsThisRun` is only ever 6 or 8, so without an explicit line a floor past 8 would win the run instead of advancing. Phase 7a's floorNum 12 and 13 needed their own lines for exactly that reason; floorNum 14 (floor 15, the finale) deliberately has none and falls through to the win check. Called from `checkStairs`.

- **`isLastFloorOfRun()`** — mirrors `descend`'s branch logic to answer whether standing on the current floor's stairs would end the run (used by render.js's `drawStairs` to label "DOWN" vs "ESCAPE"). C-branch returns `f >= C_LAST_FLOORNUM`, D-branch `f >= D_LAST_FLOORNUM`, floorNum 8-13 always return false (each has a hardcoded next floor in `descend`), else `f + 1 >= maxFloorsThisRun`. **Must be kept in lockstep with `descend`'s chain** — an out-of-sync list mislabels the stairs.

- **`update(input, dt)`** — the per-frame simulation tick, no-ops unless `state==='playing'` and not paused. Samples `this.now`, accumulates `runElapsed`. Early-returns (after still calling `updateHUD`/`drawMinimap`) while `roomFadeTimer>0` or `FX.frozen()` (hit-stop). Otherwise: `updatePlayer`, decrements `slowTimer` and computes `enemyDt` (Chrono Shard 0.35x slow), calls `updateEnemy` per enemy, `updateFamiliars`, `updateObstacles`, `updateProjectiles`, `updateBombs`, `updateExplosions`, `updateFloatTexts`, `updateShop`, `this.updateItemPedestal()`, `this.updateItemExamine()`, `this.updateCamera()`, decrements `swingFX`/`laserFX` life, `this.checkStairs()`, checks `player.isDead` → `state='gameover'` + `endRunUnlocks()`, then `updateHUD(this)` and `drawMinimap(this)`. Called every animation frame from main.js's `loop()`.

---

### render.js

All canvas-drawing methods, bolted onto `Game.prototype` via a second `Object.assign(Game.prototype, {...})` block (separate from game.js's state methods — same class, two files). Also defines the standalone `FX` particle/screen-shake/hit-stop system and a few free functions.

**Header performance notes** (documented in-file): static tile-layer caching per room (`node._tileCanvas`, rebuilt only when `doorsOpen` flips or `tileLayerDirty`), DPR-aware backing store, one `game.now` timestamp/tick, a reused scratch array + object pool in `drawWorldSorted`, pre-baked enemy sprites (`Util._humanoidSprite`), cached gradients (`Util.shadeColor`/`Util.bodyShadeLocal`), and a vignette gradient built once.

#### `FX` object (particle/shake/hit-stop system)
Fixed-size (`MAX=260`) preallocated particle pool, ring-buffer recycled (`_take`). Respects `prefers-reduced-motion` (`reducedCount(n)` thins particle counts to ~35%, `shake()` is a no-op outright under reduced motion).

- `init()` — lazily allocates the particle pool.
- `reset()` — wipes all particles/shake/hit-stop; called by `render()` on room change.
- `_take()` — pulls the next pool slot.
- `emit(x,y,vx,vy,life,size,color,kind,grav,drag)` — low-level positional-arg spawn (no object allocation).
- `sparks(x,y,color,count)` — streak burst (impact).
- `puff(x,y,color,count)` — slow expanding cloud (death/break).
- `dust(x,y)` — single ground-scuff particle.
- `sparkle(x,y,color)` — rising glint (loot idle shimmer).
- `twinkle(x,y,color,count)` — Phase 6b overhaul: a quick ring of tiny rising motes for a "reward just revealed" beat — distinct from `sparkle`'s single slow glint (idle floor shimmer) and `burst`'s punchy outward explosion; springier and stays close to its origin, reading as "good news" rather than "impact". Wired at the 4 arcade filly capstone reveals and the arcade Friendship/Tools machine win reveal (`systems/shop.js`'s `feedArcadeFilly`/`updateArcadeMachines`).
- `burst(x,y,color,count,speed)` — generic radial burst (explosions).
- `shake(amount,duration)` — screen shake request; strongest pending request wins.
- `hitStop(seconds)` — freeze-frame request; longest pending wins.
- `frozen()` — true while `hitStopTimer>0`.
- `update(dt)` — advances shake decay (quadratic falloff) and all live particles (gravity+drag integration); consumes `hitStopTimer` first and skips everything else while it's active.
- `draw(ctx)` — draws each live particle per its `kind` (1=spark streak, 2=puff circle, 3=dot).

`FX` is a public trigger surface — combat.js and other systems call `FX.shake()`/`FX.hitStop()`/`FX.sparks()` etc. directly (grep confirms wide external use, not enumerated here since it's outside this doc's file set).

#### Free functions/constants
- `GROUND_OBSTACLES` = `{pit,mud,sandtrap}` — obstacle kinds drawn as flat ground features rather than in the y-sort.
- `SPARKLE_PICKUPS` — pickup kinds eligible for idle shimmer.
- `SORT_BY_Y` — hoisted comparator for the depth sort.
- **`paintDoorTile(ctx,px,py,color)`** — draws one door tile (base fill + inset beveled panel + dark recess outline), called from `rebuildTileLayer`.

- **`paintPortalTile(ctx,px,py,color)`** *(Phase 7a)* — the Planetarium's replacement for `paintDoorTile`: a radial-gradient core with a bright inner ring and a dark outer keyline, so a doorway in a room with no walls reads as an opening in space rather than a panel set into stone. Baked **statically** into the cached tile canvas exactly like every other door — deliberately no `now` parameter and no live overlay pass, because the tile cache is the whole reason room tiles cost nothing per frame and an animated door would have to dirty it every frame. Called only from `rebuildPlanetariumTiles`.

- **`paintStarfieldTile(ctx,px,py,tx,ty,pal,depth)`** *(Phase 7a)* — paints one sky tile: a `depth`-tinted `pal.voidC` fill plus 0-3 tile-seeded stars (radius and alpha driven by a per-star "magnitude", the brightest few picking up `pal.accent` and a faint halo). Uses the same `tileRand(x,y,salt)` streams as the stone/floor texture, so the sky stays put across tile-layer rebakes instead of resampling whenever a door unlocks. Called only from `rebuildPlanetariumTiles`.
- **`pickupIconChar(kind)`** — maps a pickup kind to a single glyph char for shop-slot pickup rendering (`{bomb:'B',key:'K',heartRed/heartBlue:'♥',star:'★'}`), used by `drawShop`.
- **`tileRand(x,y,salt)`** — deterministic per-tile pseudo-random hash (so wall/floor texture detail is stable across tile-layer rebakes), used throughout `rebuildTileLayer`.

#### `Game.prototype` drawing methods

- **`currentPalette()`** — resolves the active room palette, checking the two alternate paths first and unconditionally (their floorNums collide with the normal path's): C-branch (`cPaletteFor`), D-branch (`dPaletteFor`, Phase 7a), then floorNum 8-11's branch palettes (`BRANCH_PALETTES`/`_10`/`_11`/`_12`), then the three linear late floors — floorNum 12 (`HOLLOW_CHORUS_PALETTE`), 13 (`FINAL_WAVEFORM_PALETTE`), 14 (`FINAL_PALETTE`) — else `STAGES[stageIndexForFloor(...)].palette`.

- **`render()`** — the top-level per-frame draw entry (called from main.js's `loop()` after `update()`). No-ops unless `state==='playing'`. Tunes `ctx.imageSmoothingEnabled/Quality` once, computes `fxDt`, resets `FX` on room change, updates `FX`/ambient FX unless frozen/paused, applies the DPR transform, clears the canvas, translates by camera position + screen shake, then calls in order: `drawTiles`, `drawGroundObstacles`, `drawItemPedestal`, `drawShop`, `drawDonationMachineFixture`, `drawRerollAltarFixture`, `drawArcadeFixtures`, `drawStairs`, `drawGreenFireZone`, `drawWorldSorted`, `drawProjectiles`, `drawBombsExplosions`, `drawSwingFX`, `drawLaserFX`, `FX.draw`, `drawFloatTexts`; then (screen-space, outside the camera translate) `drawVignette`, `drawBossHealthBar` (if in an uncleared boss room), and the room-fade veil.

- **`drawVignette()`** — builds (once, cached on `this._vignetteGrad`) and fills a radial darkening gradient from `Theme.vignette`.

- **`updateAmbientFX(dt)`** — derives FX purely from observable state changes with no other file needing to call anything: hoof dust while `player.moving`, idle sparkle on `SPARKLE_PICKUPS` in the room, death puffs+shake on enemies whose `isDead` just flipped (tracks `e._fxDeath`), and explosion kick+ember burst on new `Explosion`s (tracks `ex._fxSeen`).

- **`rebuildPlanetariumTiles(node, pal, ctx)`** *(Phase 7a)* — the entire tile-layer paint pass for the one room in the game that has no walls (`node.type === 'planetarium'`, the D-branch gate). Every `T_VOID`/`T_WALL`/`T_SECRET` tile becomes starfield (`paintStarfieldTile`, tiles adjacent to the platform tinted slightly nearer); `T_FLOOR` keeps the usual checkerboard but is *lifted and rim-lit* on every edge facing open sky instead of receiving the normal sunken ambient occlusion; every door — both `T_DOOR` tiles and the special-room door slots — is drawn with `paintPortalTile`, in the destination room type's own colour so the signposting survives. Called from `rebuildTileLayer`'s early special case, so it inherits the identical caching and staleness rules as every other room. **Reads `node.tiles` exactly as-is and never touches `buildRoomTiles`'s grid-carving, `doorSlotCells`, or `checkDoorTransition`** — walkability, door geometry and collision are bit-for-bit identical to a normal room; only the paint step differs.

- **`rebuildTileLayer(node, pal)`** — (re)bakes the room's static floor/wall/door tiles into an offscreen canvas cached at `node._tileCanvas`, sized to `dpr`. Phase 7a: if `node.type === 'planetarium'` it delegates to `rebuildPlanetariumTiles` and returns early (still setting the three staleness-bookkeeping fields), leaving the normal path below untouched. Draws per-tile: void fill, wall/secret (shaded + beveled + tile-seeded cracks/moss), door (`paintDoorTile`), floor (checkerboard + shade variance + ambient-occlusion darkening on solid-adjacent edges + grit speckles/cracks), then paints special-room door colors from `DOOR_COLORS[destType]`. Records `node._tileLayerDoorsOpen`/`_tileLayerPalette`/`tileLayerDirty=false` so `drawTiles` can detect staleness. Reads `node.tiles`, `node.doorSlots`, `node.doorsOpen`.

- **`drawTiles()`** — checks staleness (`!node._tileCanvas || tileLayerDirty || doorsOpen/palette changed`), calls `rebuildTileLayer` if needed, then blits the cached canvas with one `drawImage`.

- **`drawGroundObstacles()`** — draws every non-destroyed `GROUND_OBSTACLES` (pit/mud/sandtrap) via `Util.drawObstacle`, in a flat pass under the y-sort.

- **`drawItemPedestal()`** — draws every `node.itemPedestals` entry. **Special-cases `ped.isTrinket`**: trinkets spawn loose on the floor (no pedestal fixture) — just a shadow ellipse + bobbing item icon (`Util.drawItemIcon`) if untaken. Non-trinket pedestals (items/familiars/stars/deals) get a full pedestal base+top drawn via `Util.drawRoundedRect`/`Util.bodyShade`, with the bobbing icon on top if untaken. Reads `ped.x/y/item/taken/isTrinket`.

- **`drawShop()`** — draws every `node.shopSlots` entry: pedestal base, then (if not `bought`) a bobbing colored circle+icon for item/trinket/familiar slots (with a quality glow via `Util.qualityGlow`) or a plain circle+glyph (`pickupIconChar`) for pickup slots, plus the price text (colored gold/dim by whether the player can afford it).

- **`drawDonationMachineFixture()`** — draws the donation machine fixture (`Util.drawDonationMachine`) plus a "X / 1000c" progress readout under it, reading `unlocks.stats.donationTotal`.

- **`drawRerollAltarFixture()`** — draws the reroll altar (`Util.drawRerollAltar`) plus a "[G] Reroll Nc" readout, greyed out once `countRerollableShopSlots(node)===0`.

- **`drawArcadeFixtures()`** (Phase 4 overhaul) — unconditional per-frame loop over `node.fillies`/`node.machines` (guarded on the arrays existing), drawing `Util.drawFilly(ctx, f.x*TILE, f.y*TILE, f.kind, this.now)` per filly and the matching `Util.drawFriendshipMachine`/`drawToolsMachine`/`drawDarkMachine` per machine. Phase 6a overhaul: the Friendship/Tools calls now also pass the machine object `m` and `this.now`, so `drawMachineSpinFlourish` can read `m.spinning`.

- **`drawStairs()`** — draws either the branch-spot pits (`node.branchSpots`, labeled '9A'/'9B' in branch-colored rings) or the single `node.stairsSpot` pit, labeled "ESCAPE" (via `this.isLastFloorOfRun()`) or "DOWN".

- **`_drawEntry(i)`** — pooled `{y,kind,ref}` record accessor for the depth-sort scratch list (grows to the busiest-frame-seen size, then stops allocating).

- **`drawWorldSorted()`** — the y-depth sort/draw pass: collects non-ground obstacles (kind 0), pickups (kind 1), chests (kind 2), live enemies (kind 3), player familiars (kind 4), and the player (kind 5) into `this._entityDrawScratch`, sorts by `y` (`SORT_BY_Y`), then dispatches each to `Util.drawObstacle`/`Util.drawPickupIcon`/`Util.drawChestIcon`/`this.drawEnemy`/`this.drawFamiliar`/`this.drawPlayer` respectively.

- **`drawFamiliar(f)`** — draws a familiar's shadow, colored orb body (bob offset unless `behavior==='orbiter'`), and icon glyph. **Also draws swarmer mini-orbs**: if `f.def.behavior==='swarmer'` and `f.miniOrbs.length`, draws each mini-orb as a small fading circle (fades via `orb.life`) — noted in-code as necessary because these deal real damage, not just polish. Reads `f.x/y/def/index/miniOrbs`.

- **`drawPlayer()`** — draws the player pony via `Util.drawPony` with `classPonyOpts`, flashing (`invulnTimer`) and glowing (`invincibleTimer`) states; triggers `FX.shake`/`FX.sparks` on a fresh invuln hit (tracked via `_fxPlayerInvuln`); draws a freeze ring/fill if `freezeTimer>0` (Sand Trap); draws a charging ember effect if `p.charged && p.chargeTimer>0` (Dragon class beam charge-up). Reads `player.x/y/def/facing/moving/invulnTimer/invincibleTimer/freezeTimer/charged/chargeTimer/chargeTime/canFly`.

- **`drawEnemy(e)`** — computes a frame-diff `moving` flag (tracks `e._lastX/_lastY`), triggers hit-spark FX on a fresh `hitFlash` (tracks `e._fxHit`), draws a lobber's landing-zone ring (`e.lobTimer`), draws the enemy body via `Util.drawBrownHumanoid` (submerged alpha handling), a shield ring if `e.shielded`, then `this.drawStatusEffects(e)`.

- **`drawStatusEffects(e)`** — draws freeze ring+fill, stun "☆", charm "♥", or fear ring (mutually exclusive `if`/`else if` chain, keyed off `e.freezeTimer/stunTimer/charmTimer/fearTimer`), then poison aura+blob (`e.poisonTimer`) as a separate always-checked `if` that layers on top of whichever of the four fired (or none), then — Phase 6a overhaul — Vulnerable (`e.vulnerableTimer`) as a THIRD separate always-checked `if`, same tier as poison, not part of the exclusive chain: a pulsing crimson ring (`Theme.status.vulnerableRing`, radius `e.radius+4`, distinct from the freeze/fear ring's `e.radius+8` so the two never visually alias when both are up) plus a small crimson crosshair "X" mark (`Theme.status.vulnerableMark`, drawn with `moveTo`/`lineTo`) above the enemy, pulsing via `Math.sin(this.now/100)` same idiom as the stun/charm glyphs. Renders simultaneously with poison and with any one of the exclusive four (Rot & Ruin synergy explicitly combines Vulnerable + poison).

- **`drawBossHealthBar()`** — finds the live boss in `currentRoom.enemies`, draws a top-centered HP bar + name text. Called from `render()` only while `currentRoom.type==='boss' && !cleared`.

- **`drawProjectiles()`** — draws each `this.projectiles` entry as a glowing disc with a glint highlight.

- **`drawBombsExplosions()`** — draws each `this.bombs` (pulsing body + fuse spark, hot fuse color under 0.5s) and each `this.explosions` (expanding radial-gradient blast + ring, driven by `ex.life/maxLife`).

- **`drawGreenFireZone()`** — draws the Changeling's held green-fire pool (`player.fireZone`) as a radial gradient with animated licking-flame dots around the rim; purely cosmetic, draws nothing when `fireZone` is null.

- **`drawSwingFX()`** — draws the melee swing arc (`this.swingFX`) as two fading trail arcs.

- **`drawLaserFX()`** — draws a beam (`this.laserFX`), shared by Pony Bot's laser and Dragon's fire breath; `fx.color`/`fx.width` let the caller reskin it (default cyan).

- **`drawFloatTexts()`** — draws each `this.floatTexts` entry as fading text.

---

### ui/ui.js

HUD, minimap, toasts, and the main-menu class-select/trophy panels.

- **`roomTypeColor(type)`** — room-type → hex color lookup, used by minimap drawing. Phase 6a overhaul: added `shrine` (`#d4af37`, matching `votivecoin`'s icon color) and `arcade` (`#c93f6b`, matching `Theme.door.arcade`'s `open` color) — both were previously falling through to the generic `default: '#8b86a8'` on the minimap. Phase 7a: added `planetarium` (`#6a5ce0`, matching `Theme.door.planetarium`'s `open` color).
- **`ROOM_TYPE_ICON`** — room-type → emoji lookup, used by minimap icons and (indirectly) `toggleMinimapLegend`. Phase 6a overhaul: added `shrine: '🕯️'` / `arcade: '🎰'`, matching the icons already used for these two types in `data/economy.js`'s `ROOM_TYPE_LIST`. Phase 7a: added `planetarium: '🔭'`, same rule.
- **`ROOM_TYPE_LEGEND`** — room-type → friendly label text, for the legend popup. Phase 6a overhaul: added `shrine`/`arcade` entries (both were missing, same gap as the two lookups above). Phase 7a: added `planetarium` ("Planetarium (floor 3 only — takes the D-branch)"), keeping all three lookups in sync.
- **`toggleMinimapLegend()`** — builds/toggles the `#minimapLegend` popup listing every `ROOM_TYPE_LEGEND` entry plus the "pulsing ring" hint. Called from main.js's `minimapLegendBtn` click handler.
- **`roomCentroidBlock(node)`** — average block position of a room's mask (for placing one icon per room regardless of shape/size). Returns `{bx,by}`.
- **`roomLootEntries(node)`** — collects all uncollected loot (pedestal items, pickups, unopened chests) in a room into a flat array of `{kind, ...}` descriptors, for minimap loot markers.
- **`drawLootEntry(ctx,entry,x,y)`** — draws one loot entry via the matching `Util.draw*Icon` function.
- **`drawLootMarkers(ctx,entries,cx,cy)`** — draws up to a 3-column grid of loot icons (scaled 0.4x) centered on `(cx,cy)`. Called by `drawMinimap`.
- **`_hudCache`** — dirty-check cache object (`hearts/coins/keys/bombs/leftPanel/familiars`, plus — Phase 6a overhaul — `turrets`/`minions`/`synergy`) so `updateHUD` can skip redundant DOM/canvas writes on unchanged frames.
- **`SYNERGY_BADGES`** (Phase 6a overhaul) — array of `{id, flag}` pairs mapping each `#synergyBar` badge span id (`synEcosystem`/`synRotRuin`/`synMarksman`/`synPackBond`/`synTwinFangs`) to the `player.<flag>Active` boolean `updateHUD` reads for it (`ecosystemSetActive`/`rotAndRuinActive`/`marksmansEyeActive`/`packBondActive`/`twinFangsActive`, all set in `systems/items-1.js`'s `recalcPlayerStats`). Lets `updateHUD` loop over the 5 badges instead of repeating the same toggle by hand.
- **`hudPanelEntry(label, thing)`** — builds one "Name — description" HTML block (or "None") for the left HUD panel; `thing` is any `{name,desc,icon}`-shaped object (item/trinket/star).
- **`hudPillReadout(game)`** — builds the pill-identification HTML list: identified colors show their real effect, unidentified ones collapse into a single "??? — N unknown" line. Reads `game.pillIdentified`/`game.pillEffectMap`.
- **`updateHUD(game)`** — the main per-tick HUD sync function (called every frame from `Game.prototype.update`, including its early-return freeze/hit-stop paths). Lazily creates `#heartsCanvas`; redraws the hearts strip (via `Util.drawHeart`) only when the dirty-check key changes (handles fractional red pips, the Eternal Heart's pale trailing pip, and blue pips); toggles `.low-health` vignette class; updates `#resCoins`/`#resKeys`/`#resBombs`/`#resFloor` text (with `∞` for unlimited-floor flags); updates the active-item icon+charge pips (`#activeItemIcon`/`#activeItemPips`, `.ready-glow` when full); updates the trinket/pill/star HUD icons; updates the speed/rate/damage/luck/range stat readouts (`#statSpeed` etc, laser/unlimitedRange show `∞`); rebuilds `#passivesBar` chips every call (one per owned passive, count in the title); rebuilds `#familiarBar` chips only on change (tallies `player.familiars` by `def.id`, shows a count badge for duplicates); rebuilds the left side panel (`#leftPanelActive/Trinket/Star/Pills`) only on change via `hudPanelEntry`/`hudPillReadout`. Phase 6a overhaul: toggles `#resTurrets`/`#resMinions`'s shared `.hidden` utility class based on `player.canBuildTurrets`/`player.summonsChangelings` (only Engineer Pony/Changeling Queen ever see them), and when shown, sets dirty-checked text `(game.currentRoom.playerTurrets||[]).length + '/3'` / `(player.changelingMinions||[]).length + '/' + player.maxChangelingMinions`; also loops `SYNERGY_BADGES` to toggle each `#synergyBar` span's `.active` class off `player[flag]`, dirty-checked as one joined `'1'/'0'` key string (same shape as the familiar bank's `famKey`). Reads/writes many `#`-ids in index.html and reads `game.player`, `game.dungeon.floorNum`, `game.floorPath`, `game.pillIdentified`, `game.pillEffectMap`.
- **`minimapCacheKey(game)`** — builds a string key from `currentRoom.id`, `player.revealMap`, and every room's discovered/revealed/seen state, used to detect when the minimap's baked layer needs a rebuild.
- **`drawMinimap(game)`** — draws the minimap onto `#minimap`. Bakes the static half (door-connection lines + per-block room-footprint squares) to an offscreen canvas (`_mmCanvas`, module-level cache keyed by `_mmDungeon`/`_mmKey`) and blits it, then draws the animated parts live every call: a pulsing "you are here" ring on the current room's blocks, a room-type icon per room (as soon as its existence is known — `knowsExistence`), and loot markers (`drawLootMarkers`) on discovered rooms. Reads `game.dungeon.rooms`, `game.currentRoom`, `game.player.revealMap`, `game.now`. Called every `update()` tick from game.js.
- **`toast(msg, long)`** / **`advanceToastQueue()`** — a queued (not clobbered) toast system; `long` extends on-screen time for achievement-unlock toasts. Called from many files across the codebase (game.js, main.js, combat/items/shop/etc — grep confirms wide usage).
- **`showRoomBanner(text)`** — shows the `#roomBanner` room-name banner for 1.6s. Called by game.js's `enterRoom`.
- **`showItemExamine(ped)`** — shows/hides the `#itemExamine` tooltip for a nearby pedestal (item/trinket/familiar all share the same pedestal shape). Called by game.js's `updateItemExamine`.
- **`buildClassSelect(onPick)`** — builds the `#classSelect` card grid: each unlocked class gets a drawn pony preview (`Util.drawPony`) and its real name/desc/click-to-pick handler; locked classes show a "?" placeholder, `???`, and live unlock progress (reading the matching `ACHIEVEMENTS` entry's `statKey`/`threshold`) plus a deny-sound click handler. Called from main.js on load and from `returnToMenu()`.
- **`buildSuperbossTrophies()`** — builds the `#trophyRow` grid from `SUPERBOSS_LIST`, showing beaten bosses' icon/name/defeat-count and `❓`/`???` for undefeated ones. Called from main.js on load and `returnToMenu()`.

---

### ui/roomEditor.js

Standalone logic for `room-editor.html` (a separate tool page, not part of the live game's script set, but shares game code like `buildRoomTiles`/`decodeSpawner`/`computeDoorSlots` from room.js/dungeon.js so its previews and exported data are guaranteed to match runtime behavior).

**State**: `TILE_PX` (editor zoom level), `CATEGORY_COLORS`, `workingMask` (4x4 block grid), `spawnerMap` (Map of `"x,y"`→spawner), `selectedCategory`, `currentGrid`/`gridW`/`gridH` (built tile grid), `disabledDoorSlots` (Set of `"col,row,dir"`), `previewDoorSlots`, `floorState` (per-floor allow array), `hoverTile`.

**Mask/shape editing**
- `makeEmptyMask()` — fresh 4x4 zero grid.
- `isMaskConnected(mask)` — flood-fill connectivity check.
- `trimMaskWithOffset(mask)` — trims a mask to its bounding box, returns `{mask, offR, offC}` (used on export).
- `renderBlockGrid()` — draws the 4x4 block-toggle UI, shows block count + connectivity warnings; click handler pushes undo and toggles a block, then `rebuildGrid()`.
- `rebuildGrid()` — rebuilds `currentGrid`/`gridW`/`gridH` from `workingMask` via `buildPreviewDoorSlots` + `buildRoomTiles` (shared with the real game), or shows a placeholder if no blocks are set. Calls `renderCanvas()`/`updateStatsAndWarnings()`.
- `disabledDoorsField(offC,offR,mask)` — converts the flat `disabledDoorSlots` Set into the per-block `[col,row,dirLetters]` format the exporter/`computeDoorSlots` expect, dropping stale entries outside `mask`.
- `buildPreviewDoorSlots(mask, doorField)` — calls the shared `computeDoorSlots`, marking non-disabled slots `type:'normal'`.
- `doorMarkerCenter(slot)` / `findDoorSlotAtEvent(e)` / `toggleDoorSlot(slot)` — hit-testing and toggling of door markers drawn on the canvas (click a marker to enable/disable a door on that block edge).

**Spawner placement**
- `OBSTACLE_GLYPHS` — obstacle-kind → single-char glyph map for the plain (non-preview) render fallback.
- `spawnerGlyph(sp)` — resolves a spawner's fallback glyph.
- `renderCanvas()` — full canvas redraw: tiles (void/wall/door/floor coloring), grid lines, door markers (green=open/red=disabled), placed spawners (real preview via `toolPreviewDef`+`drawPreviewAt` for forced spawners, else a colored square+glyph), and a hover preview of the current tool.
- `canvasToTile(e)` / `currentTool()` — pointer→tile coords; resolves the active category+select-value into a `{category,kind,specific?}` tool descriptor (`kind` is `'generic'`, `'genericBoss'`, or `'forced'`).
- `toolPreviewDef(tool)` — normalizes a forced tool selection into a `{renderKind,...}` descriptor (enemy/pickup/chest/item/obstacle) for real rendering, reusing `ENEMY_TYPES`/`BOSS_TYPES`/`SUPERBOSSES`/`ITEMS`/`TRINKETS`/`FAMILIAR_TYPES`/`OBSTACLES` lookups.
- `fakePickupFor(kindStr)` — builds a minimal Pickup-shaped object for `Util.drawPickupIcon` preview purposes.
- `drawPreviewAt(ctx,x,y,pv,sizeHint)` — dispatches a `toolPreviewDef` descriptor to the matching real `Util.draw*` function, sized to fit the given canvas.
- `previewDescFor(pv)` / `updateToolPreviewCard()` — builds and renders the small "what you're about to place" preview card (`#toolPreviewCanvas`/Name/Desc).
- Drag-to-paint: `paintAt(x,y,erasing)` (places/erases a spawner on a floor tile, pushes one undo per drag gesture not per tile), plus `mousedown`/`mouseup`/`mousemove`/`mouseleave`/`contextmenu` listeners on `#editorCanvas` wiring door-click, paint, and erase (right-click-drag) behavior.

**Stats/warnings**
- `updateStatsAndWarnings()` — updates the `#statsReadout` counts and a room-type-specific `#roomWarning` message (e.g. "no enemy spawner", "no boss spawner", auto-added-fixture notices for petshop/sacrifice/challenge, hand-design notices for curse/vault/crystal/sombra).

**Tool palette**
- `populateSpecificSelect()` — rebuilds `#specificSelect`'s options for the selected category (enemy list incl. generic/random-boss/bosses/superbosses; pickup list of every coin/key/bomb/heart/pill/star/chest variant; item list from `ITEM_LIST`; deal list filtered to items with `pools.includes('sombra')`; shop list of items+trinkets+familiars+priced pickups; obstacle list of every obstacle kind with descriptive labels).
- Category/zoom button click wiring (`categoryBtns`, `zoomBtns`).
- `renderFloorButtons()` — per-floor allow/disallow toggle buttons.

**Undo/redo**
- `snapshotState()` / `restoreState(snap)` / `pushUndo()` / `undo()` / `redo()` / `updateUndoRedoButtons()` — full-state (mask+spawners+disabled doors+floor state+room type) undo stack, capped at `MAX_UNDO=80`. Ctrl+Z/Ctrl+Y keybindings wired at module scope (skipped while typing in a text field).

**Reset buttons**: `#resetSpawnersBtn` (clears `spawnerMap` only) and `#resetAllBtn` (clears everything back to a single default block).

**Import**: `#importBtn` handler parses a pasted `ROOM_TEMPLATES.<type>.push({...})` line (or bare JSON) via regex + `JSON.parse`, validates it has a mask (`obj.m`), then loads `workingMask`/`spawnerMap` (via `decodeSpawner`)/`floorState`/`disabledDoorSlots` (handles both the legacy room-wide door-direction-string format and the new per-block array format) from it, and sets the Type dropdown if detectable.

**Export** — `exportTemplate()`, the function that generates `ROOM_TEMPLATES.<type>.push(...)` text: trims the mask (`trimMaskWithOffset`), warns on >4 blocks / disconnected blocks, rebuilds the door field and tile grid for the trimmed shape, remaps every spawner's coordinates into the trimmed offset (dropping — with a count in the hint — any spawner that lands outside the trimmed floor), encodes each surviving spawner via `encodeSpawner`, and assembles `{m, s?, f?, d?}` into `'ROOM_TEMPLATES.' + roomType + '.push(' + JSON.stringify(template) + ');'`, written to `#exportArea`.
- **`SPAWNER_CATEGORY_ENCODE`** = `{enemy:'e', pickup:'p', item:'i', deal:'d', shop:'s', obstacle:'o'}` — the one-letter category codes used in the exported/compact spawner format (`[x,y,category,kind,specific?]`, where `kind` is further compacted to `'g'`=generic, `'b'`=genericBoss, `'f'`=forced with an explicit `specific` value; obstacles always encode as `['o', specific]` since they have no generic/boss variant).
- `encodeSpawner(sp)` — applies the above encoding to one spawner.
- `#copyBtn` handler — copies `#exportArea`'s text to the clipboard (generating it first if empty), via both `document.execCommand('copy')` and `navigator.clipboard.writeText`.

Init block at the bottom calls `renderFloorButtons()`, `renderBlockGrid()`, `rebuildGrid()`, `populateSpecificSelect()`, `updateUndoRedoButtons()`, `updateStatsAndWarnings()` to set up the initial page state.

---

### main.js

Bootstrap: persistence helpers, global input state + event wiring, pause/overlay screens, difficulty selection, fullscreen/wake-lock/visibility handling, the main-menu/end-screen flow, and the `requestAnimationFrame` game loop.

**Persistence**
- **`loadUnlocks()`** — `JSON.parse(localStorage.getItem('nightfallUnlocks') || '{}')`, try/catch returns `{}` on error. The single source-of-truth read for all cross-run unlock/stat/bestiary state (shape defined/normalized by achievements.js's `ensureUnlockShape`). Called extremely widely across the codebase (game.js, ui.js, achievements.js, combat/items/etc).
- **`saveUnlocks(u)`** — `localStorage.setItem('nightfallUnlocks', JSON.stringify(u))`.
- localStorage keys used directly in this file: `nightfallUnlocks` (main save blob), `nightfallAchvSeenCount`, `nightfallDifficulty`, `nightfallBestiaryTab` (read in bestiary.js but the same storage namespace).

**Global state**: `game` (the live `Game` instance or `null`), `input` (`{left,right,up,down,attack,mouseX,mouseY,mouseActive}`), `canvas` (`#game` element reference).

**Input wiring**
- `toggleMuteUI()` — toggles `Sound`'s mute state, syncs the mute button, toasts.
- `keydown` listener on `window` — WASD/arrows → `input.*`, Space→`attack`, B/E/Q/R/F/G/H → `game.tryPlaceBomb/tryUseActive/tryUsePill/tryUseStar/tryDonate/tryReroll/tryArcadeInteract` (G and H are both guarded against key-repeat so holding them doesn't drain coins/bombs/keys/hearts), M→`toggleMuteUI`, T→bestiary-style toggle of the Achievements overlay, C→toggle the Bestiary overlay, Escape→closes an open overlay if any, else `togglePause()`. Also calls `Sound.unlock()` on every keydown (first real user gesture).
- `keyup` listener — clears the WASD/arrow/attack flags.
- `pointermove`/`pointerleave`/`pointerdown`/`pointerup`/`contextmenu` on `canvas`/`window` — converts pointer position to logical camera-space pixels (`input.mouseX/mouseY`), sets `input.mouseActive`, left-click→`attack`, right-click→`game.tryPlaceBomb()`, and suppresses the context menu.

**Pause/overlay screens**
- **`togglePause()`** — no-ops unless `game && game.state==='playing'`; flips `game.paused`, toggles `#pauseScreen`'s hidden class, releases/requests the wake lock accordingly, and (while pausing) fills `#pauseStats` (class/floor/coins/keys/bombs/kills/duration) and `#pauseEquipped` (active item/trinket/pill/star icons+names) from live `game.player` state. Wired to the Escape key and `#resumeBtn`.
- `#quitBtn` handler — confirms via `confirm()`, bumps `totalPlaytime`, hides the pause screen, calls `returnToMenu()`.
- **`openOverlay(id, buildFn, markSeenFn)`** — plays a click sound, calls `buildFn()` (e.g. `buildAchievementsPanel`/`buildBestiaryPanel`), unhides the overlay, resets its scroll, calls `markSeenFn()`. Shared entry point for every button/keybind that opens the Achievements or Bestiary overlay.
- **`toggleOverlay(id, buildFn, markSeenFn)`** — open-or-close variant used by the T/C keybinds.
- Backdrop-click-to-close wiring for `achievementsScreen`/`bestiaryScreen`.
- Button wiring: `pauseAchievementsBtn`/`pauseBestiaryBtn`/`achievementsBtn`/`bestiaryBtn` (open), `retryBtn`/`winBtn` (return to menu), `achievementsCloseBtn`/`bestiaryCloseBtn` (close).
- **`markAchievementsSeen()`** / **`refreshAchievementsBadge()`** — persist/read `nightfallAchvSeenCount` to show/hide the `#achievementsNewBadge` "NEW" indicator based on `unlocks.achievements` count.
- Mute button (`muteBtn`) and volume slider (`volumeSlider`) wiring, syncing to `Sound`'s state via `syncMuteBtn()`.

**Difficulty**
- **`DIFFICULTY_IDS`** = `['easy','normal','hard']`.
- **`loadDifficultyPref()`** / **`saveDifficultyPref(d)`** — reads/writes `localStorage['nightfallDifficulty']`, defaulting to `'normal'`.
- `currentDifficulty` — module-level cached value (not re-read from localStorage per enemy spawn).
- **`difficultyStatMult()`** — returns `0.75`/`1`/`1.5` for easy/normal/hard. Read once per Enemy/Boss construction in entities.js to scale hp+dmg; nothing else (player, items, drops) looks at it.
- `syncDifficultyBtns()` — toggles `.active` on `#difficultySelect`'s buttons to match `currentDifficulty`.
- `#difficultySelect` click handler — updates `currentDifficulty`, persists it, re-syncs buttons.

**Fullscreen**
- `FULLSCREEN_SUPPORTED` — feature-detect via `document.documentElement.requestFullscreen`.
- `syncFullscreenBtn()` — updates `#fullscreenBtn`'s title/aria-pressed/`.active` class.
- Click handler toggles fullscreen (swallows rejection); `fullscreenchange` listener re-syncs the button and calls `game.fitCanvas()`.

**Wake lock**
- **`requestWakeLock()`** — requests a `navigator.wakeLock` screen lock, guarded by feature-detect, current game state (`playing`, not paused), and `document.hidden`; releases immediately if the run ended during the async request.
- **`releaseWakeLock()`** — releases the held lock if any.

**Visibility/lifecycle**
- `visibilitychange` listener — stops the render loop (`stopLoop()`), suspends `Sound`, releases the wake lock while hidden; resumes all three when visible again.
- `blur` listener on `window` — auto-pauses an in-progress run.
- `beforeunload` listener — shows the browser's native "leave site?" prompt while a run is in progress.

**Menu tips**
- **`MENU_TIPS`** — array of rotating tip strings.
- **`showMenuTip()`** — picks a random tip into `#mainMenuTip`. Called from `updateLifetimeStatsDisplay()`.

**Screen/run transitions**
- **`startGameWithClass(classId)`** — hides menu/end/pause screens, shows `#gameScreen`, constructs `new Game(canvas)`, calls `game.startRun(classId)`, `game.fitCanvas()`, `requestWakeLock()`. Passed as the `onPick` callback to `buildClassSelect` (ui.js).
- **`returnToMenu()`** — releases the wake lock, nulls `game`, hides all game/end/pause screens, shows `#mainMenu`, rebuilds `buildClassSelect`/`buildSuperbossTrophies`/`updateLifetimeStatsDisplay`.
- **`updateLifetimeStatsDisplay()`** — fills `#lifetimeStats` with a one-line summary (runs/wins/playtime/enemies defeated/deepest floor/fastest win) from `unlocks.stats`, and calls `refreshAchievementsBadge()`/`refreshBestiaryBadge()`/`showMenuTip()`.

**Shareable run summary**
- `_runSummary` — module-level snapshot string (captured at end-screen time since `game` is torn down before the Copy button could be clicked).
- `CLIPBOARD_SUPPORTED` — feature-detect.
- **`buildRunSummary(won)`** — builds the shareable text (class, outcome incl. the C-branch's distinct ending text, coins/kills/duration).
- **`wireCopyBtn(id)`** — wires a Copy button to write `_runSummary` to the clipboard with a brief "✅ Copied!"/"Copy failed" label swap; hides the button outright if clipboard isn't supported. Called for `copyRunBtn`/`copyWinRunBtn`.
- **`showGameOver()`** / **`showWin()`** — fill `#gameOverStats`/`#winStats` with the run's outcome text (via `floorLabelFor`/`floorNameFor` from stages.js) and unhide the respective end screen; both set `_runSummary`.

**Canvas resize wiring** — a `ResizeObserver` on `#canvasWrap` (falling back to a `window resize` listener) calls `game.fitCanvas()` on layout changes.

**The main loop**
- `lastTime`, `lastState` — loop-local timing/state-transition tracking.
- **`loop(now)`** — the `requestAnimationFrame` callback: computes a clamped `dt` (max 0.05s), calls `game.update(input, dt)` then `game.render()` if `game` exists, and on a `game.state` transition: releases the wake lock and (on `gameover`) calls `showGameOver()`, plays the game-over sound, bumps `deaths`/`totalPlaytime` stats, and credits the killer to the bestiary (`bumpBestiaryCount('enemyDeaths', src, 1)`) if `player.lastDamageSource` is a real enemy/boss/superboss id; on `win`, calls `showWin()`, plays the win fanfare, `recordWin(game, classId)`, bumps `totalPlaytime`, checks/toasts a new fastest-win personal best (`setStatMin`), and unlocks the three speedrun achievements (`challenge_speedrun_20min/12min/8min`) independently based on `game.runElapsed`. Reschedules itself via `requestAnimationFrame`.
- **`rafId`** — doubles as both the pending frame handle and the "is the loop running" flag.
- **`startLoop()`** / **`stopLoop()`** — start/stop the rAF loop; `startLoop` resets `lastTime` so a long hidden gap doesn't arrive as one giant `dt`.
- Bottom of file: calls `startLoop()`, `buildClassSelect(startGameWithClass)`, `buildSuperbossTrophies()`, `updateLifetimeStatsDisplay()` to boot the page.

---

### ui/bestiary.js

The Bestiary panel: 9-10 tabs (Enemies/Items/Stars/Pills/Trinkets/Familiars/Objects/Pickups/Room Types/Stages), each listing every entry in that category — undiscovered entries render as a "?" row. Reuses the Achievements panel's CSS classes (`.achv-summary`/`.achv-filter`/`.achv-list`/`.achv-category`/`.achv-grid`/`.achv-row`/`.achv-icon`/`.achv-text`/`.achv-name`/`.achv-desc`/`.achv-reward`). All the underlying tracking (`unlocks.bestiary.*`) is written via `markBestiarySeen`/`bumpBestiaryCount` (defined in achievements/logic.js, called from game.js, systems/combat-*.js, systems/items-2.js, systems/room.js — this file only *reads* that state via `loadUnlocks()`/`ensureUnlockShape`).

- **`BESTIARY_TABS`** — the 10 tab definitions (`{id,label,icon}`).
- **`loadBestiaryTabPref()`** — reads/validates the persisted `nightfallBestiaryTab` localStorage key, defaulting to `'enemies'`.
- `_bestiaryTab` — module-level current-tab state.
- **`bestiaryRow(opts)`** — shared per-entry row builder: draws either an emoji icon or a `dotColor` colored circle (for enemies/objects/pills, which have no fixed glyph) when `seen`, else a "❓"/"???"/"Not yet discovered." placeholder; appends `opts.lines` as description lines and an optional `opts.extra` reward-style line. Used by every tab renderer below.
- **`bestiaryCategoryHeader(wrap, label, done, total)`** — appends an `<h3>` "Label (done/total)" section header.
- **`renderBestiaryEnemies(wrap)`** — three sub-groups (Enemies/Bosses/Superbosses from `ENEMY_LIST`/`BOSS_LIST`/`SUPERBOSS_LIST`), each row showing HP/DMG/SPD/flies/behavior stats and a "Defeated N times · Killed you N times" tally from `unlocks.bestiary.enemyKills`/`enemyDeaths`.
- **`renderBestiaryItems(wrap)`** — two sub-groups (Passive/Active from `PASSIVE_ITEMS`/`ACTIVE_ITEMS`), each row showing the item's desc and a star-rating (`★`/`☆` repeated by `item.quality`) as the `extra` line.
- **`renderBestiarySimple(wrap, list, seenSection, extraFn)`** — generic single-grid renderer used for Stars, Trinkets, Pickups, Room Types, and Stages (each just icon+name+desc, no sub-grouping).
- **`renderBestiaryFamiliars(wrap)`** — three sub-groups by `behavior` (Orbiters/Shooters/Procs from `FAMILIAR_LIST`), each row's stat line varying by behavior (DMG+orbit speed / DMG+cooldown / interval).
- **`renderBestiaryPills(wrap)`** — prepends a note explaining pill colors are re-randomized per run (lists every `PILL_EFFECT_LIST` name), then a flat grid of `PILL_COLORS` (dot-colored, "Taken at least once." line).
- **`renderBestiaryObjects(wrap)`** — flat grid over `OBSTACLES`, showing the obstacle's desc plus either "Destroyed N times" (if `destructible`/`attackable`) or "Indestructible." from `unlocks.bestiary.objectsDestroyed`.
- **`bestiaryDiscoveredTotals()`** — computes `{done,total}` per tab id by cross-referencing each category's master list against the matching `unlocks.bestiary.*` seen-map. Used for both the tab-button counts and the overall summary line.
- **`bestiaryTotalDiscovered()`** — sums every tab's `done` count into one number. Used by `markBestiarySeenBadge`/`refreshBestiaryBadge` and (per grep) by main.js's badge logic indirectly via those two functions.
- **`buildBestiaryPanel()`** — the main panel builder: clears `#bestiaryList`, rebuilds `#bestiaryTabs` buttons (each showing `icon label (done/total)`, click switches `_bestiaryTab`, persists it, plays a click sound, rebuilds), fills `#bestiarySummary` with the grand total, and dispatches to the matching `renderBestiary*` function based on `_bestiaryTab`. Called from main.js's `openOverlay`/`toggleOverlay` wiring (the C key and Achievements/Bestiary buttons).
- **`markBestiarySeenBadge()`** — persists `nightfallBestiarySeenCount` and hides `#bestiaryNewBadge`. Called on overlay open.
- **`refreshBestiaryBadge()`** — shows/hides `#bestiaryNewBadge` by comparing the current total against the persisted seen-count. Called from main.js's `updateLifetimeStatsDisplay()`.


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
- **Phase 12 visual pass (canvas batch, ~30 small additive touches across utils-1.js/utils-2.js/render.js)** — a systematic sweep for icon/fixture draws that were still flat single-color fills while everything else in the game had long since moved to `Util.bodyShade`/gradients/glow. Fixed: `drawKeyIcon` (metal glint), `drawBombIcon`/`drawSackIcon` (now `bodyShade` instead of flat fill), `drawBatteryIcon` (charge-cell glow), `drawPillIcon` (capsule sheen), `drawObstacle`'s `luckcrystal` (ambient glow + per-facet glint, previously the one gem-flavored obstacle with no sparkle at all) and `mud` (radial gradient + a reflection glint, was a flat ellipse), `drawChestIcon`'s bomb/key locks (a keyhole notch instead of a bare filled disc), `drawEnemyHealthBar` (gradient fill + keyline, deliberately no `shadowBlur` since many can be on screen at once — see its own comment), all 5 shop/arcade machine fixture bodies (`drawDonationMachine`/`drawRerollAltar`/`drawFriendshipMachine`/`drawToolsMachine`/`drawDarkMachine`, a shared top-lit linear-gradient chassis sheen instead of a flat `fillRect`, plus a glow on the donation meter fill and the reroll altar's spinning ring), `render.js`'s freeze/fear/vulnerable/shield status rings (glow) and stun/charm glyphs (dark-keyline `strokeText`, matching `drawFloatTexts`' new treatment), poison (a second smaller bubble), and `drawStairs`' branch/exit labels (keyline). Each was checked against the file's own stated perf discipline before landing — `drawEnemyHealthBar` specifically got a CHEAPER treatment (gradient, no glow) than the single-instance fixtures (which got a real `shadowBlur`), since it can run once per on-screen enemy per frame rather than once per room.
  - `rand(min, max)` → random float in `[min, max)`. `Math.random()`-based.
  - `randi(min, max)` → random integer in `[min, max]` inclusive (floors `rand(min, max+1)`).
  - `choice(arr)` → random element of `arr`.
  - `chance(p)` → boolean, `true` with probability `p`.
  - `clamp(v, lo, hi)` → `v` bounded to `[lo, hi]`.
  - `lerp(a, b, t)` → linear interpolation.
  - **Engine expansion pass, new**: `easeOutCubic(t)`, `easeInOutQuad(t)`, `easeOutElastic(t)` — 0..1-in/0..1-out easing curves for anything that wants a non-linear `lerp` (UI transitions, future FX) without hand-writing the curve inline. `formatSigned(n, decimals=0)` → `n` rounded to `decimals` places with a leading `+` for non-negative values (e.g. `formatSigned(4.567,1)` → `"+4.6"`); `formatSignedPercent(frac, decimals=1)` → `formatSigned(frac*100, decimals) + '%'`. Both are additive-only — no existing call site was refactored to use them, since several places (e.g. `achievements/skilltree.js`'s `describeSkillEffect`) already hand-roll equivalent sign logic inline and were left alone to avoid touching verified display code; these exist for future code to call directly instead of re-deriving the same sign logic yet again.
  - `dist(ax, ay, bx, by)` / `dist2(...)` → Euclidean distance / squared distance (cheap circle-overlap check).
  - `angleTo(ax, ay, bx, by)` → `atan2` angle from a to b.
  - `formatNum(n)` → thousands-separated string via `toLocaleString('en-US')`, for HUD/stat readouts.
  - `formatDuration(seconds)` → `"m:ss"` or `"h:mm:ss"` past an hour, for run/lifetime playtime.
  - `weighted(items)` — `items = [{w:number, ...}]`; returns one item chosen with probability proportional to its `w`.
  - `shuffle(arr)` — in-place Fisher–Yates shuffle, returns `arr`.
  - `circleIntersect(ax,ay,ar,bx,by,br)` → boolean circle-circle overlap test (via `dist2`).
  - `drawHeart(ctx, x, y, size, fillFrac, fillColor, outlineColor)` — draws a heart `Path2D` (authored on a 16×16 grid, scaled) at top-left `(x,y)`; `fillFrac` 0..1 clips a partial horizontal fill for half-hearts. Always strokes an outline and fills a dark base first. **Phase 12 visual pass**: a filled heart also gets a small fixed-opacity white glossy highlight ellipse in the upper-left lobe (clipped by the same `fillFrac` rect the fill itself uses, so it naturally disappears on a near-empty partial fill rather than needing its own visibility check) — one change reaches all 10+ call sites (HUD hearts, pickup icons, chest rewards, arcade filly signage) since they all funnel through this one function.
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

- **`Sound`** — an IIFE-built singleton object: `{ play, unlock, suspend, resume, toggleMute, isMuted, setVolume, getVolume, startAmbient, stopAmbient, startMusic, stopMusic, listMusicTracks, currentMusicTrackId, tone, noise, fm, pluck, chord, bass, perc, strings, mallet, choir, piano, trumpet, zunpet, banjo, growl, stab, icechime, harmonica, flute, whalecall, gong, sonarping, ringmod, voidhum, glitch, warpsynth, drip, sludge, birdcall, creak, stardust, clockwork, drift }`. The 33 primitives/instruments (`tone`/`noise`/`fm`/`pluck`/`chord`/`bass`/`perc`/`strings`/`mallet`/`choir`/`piano`/`trumpet`/`zunpet`/`banjo`/`growl`/`stab`/`icechime`/`harmonica`/`flute`/`whalecall`/`gong`/`sonarping`/`ringmod`/`voidhum`/`glitch`/`warpsynth`/`drip`/`sludge`/`birdcall`/`creak`/`stardust`/`clockwork`/`drift`) are exposed directly (each wrapped in a `guardMute()` closure so calling them bypasses `play()`'s SFX-table lookup but NOT the mute check) — for systems that want a one-off sound tuned to live data (e.g. a pitch derived from floor number) without adding a canned `SFX` entry for every possible value. Internal (non-exported) state: `ctx` (lazily-created `AudioContext`), `master` (a `GainNode` all sounds route through), `noiseBuffer` (one shared 2-second white-noise buffer, generated once on first `ensureCtx()` and re-sliced per noise burst so frequent sounds never allocate fresh audio data), `BASE_VOLUME = 0.55` (what a 100% volume-slider setting maps to), `muted`/`volume` (persisted to `localStorage` under `nightfallMuted`/`nightfallVolume`), `ambient` (the currently-running ambient drone's node bundle, or `null` — see `startAmbient`/`stopAmbient` below), `reverbNode` (lazily-built shared `ConvolverNode`, see `ensureReverb()` below), `_periodicWaves` (cache of custom `PeriodicWave`s, see `periodicWave()` below), `musicState` (the currently-playing background track's scheduler state, or `null` — see the music sequencer below).
  - **Engine expansion pass** — four sound-generation forms now coexist: subtractive (`tone`/`noise`, unchanged in spirit), FM synthesis (`fm`, new), custom additive periodic waves (`periodicWave`, new — selectable as `tone`'s `type`), and physical modeling (`pluck`, new — Karplus-Strong plucked string). All four (plus `chord`, which is just staggered `tone()` calls) now share one output stage, `routeOut()`, giving every primitive stereo `pan`, a shared algorithmic `reverb` send, and (second engine-expansion pass) an optional `bus` — for free.
  - **Second engine-expansion pass** — two more **instruments** built on top of the four forms (not new forms themselves) plus a full **music sequencer**:
    - **`bass(freq, opts)`** (private, new) — a sustained low end: a lowpass-filtered sine at `freq` for weight, plus a much quieter sine one octave up (`gain * 0.22`) so the pitch still reads on small speakers. `opts`: `dur` (default 0.4), `gain`, `attack` (0.015), `release` (0.2), `delay`, `pan`, `reverb`, `bus`, `filterFreq` (320), `filterType` ('lowpass'). Distinct from a plain `tone(freq,{type:'sine'})` mainly in its default envelope (longer attack/release, meant to sit under a melody) plus the layering.
    - **`perc(kind, opts)`** (private, new) — short percussive hits dispatched by `kind`: `'kick'` (a fast downward sine sweep, 808-style), `'snare'` (bandpass noise + a touch of triangle body), `'hat'` (a tiny highpass noise tick), `'bonehit'` (a heavily-damped, low-pitched `pluck()` at 700Hz/damping 550 — lowered from an original 1200Hz/900 after "less high pitches" feedback — a dull struck-bone/woodblock knock built from the physical-modeling primitive rather than noise). `opts`: `gain`, `delay`, `pan`, `reverb`, `bus`.
  - **Third engine-expansion pass ("add more instruments... don't use what it currently is")** — three more instruments, each a genuinely different technique from every earlier one, not a retune of `bass`/`perc`:
    - **`strings(freq, opts)`** (private, new) — UNISON/"supersaw" stacking: `opts.voices` (default 5) real oscillators at the SAME `freq`, each detuned across `±opts.detune` cents (default 9) and summed (per-voice gain divided by `√voices` to keep total loudness roughly constant regardless of voice count). The richness comes from live phase interference between near-identical simultaneous oscillators — a real string section is many slightly-out-of-tune players, which nothing single-oscillator (even a rich `periodicWave`) can reproduce. `opts`: `dur`(2), `gain`(0.15), `attack`(0.4), `release`(1), `delay`, `pan`, `reverb`, `bus`, `voices`, `detune`, `type`('sawtooth'), `filterFreq`(1800), `filterType`('lowpass').
    - **`mallet(freq, opts)`** (private, new) — STRUCK-BAR partials via `MALLET_PARTIALS = [{ratio:1,gain:1,decayMul:1}, {ratio:3.0,gain:0.35,decayMul:0.55}, {ratio:6.4,gain:0.12,decayMul:0.32}]` — 3 sine `tone()` bursts at ~1x/3x/6.4x the fundamental (rounded from real marimba/xylophone bar acoustics), each proportionally quieter AND faster-decaying than the last (`dur`/`release` scaled by `decayMul`) — a fast bright "ping" on top of a duller "thonk" that outlasts it. These ratios are INHARMONIC (not integer multiples), which `periodicWave()` cannot express at all (a `PeriodicWave` is inherently a harmonic series) — the reason this needed its own instrument rather than a fourth `tone()` timbre. `opts`: `dur`(0.5), `gain`(0.22), `attack`(0.002), `release`(0.4), `delay`, `pan`, `reverb`, `bus`, `filterFreq`(null — unfiltered by default), `filterType`.
    - **`choir(freq, opts)`** (private, new) — FORMANT-ish vocal pad: a plain sine fundamental plus two narrow-bandpass slices of the shared `noiseBuffer` tuned as rough "formants" relative to `freq` (~4x at `filterQ:6`, ~9x at `filterQ:8`). The airy, breathy, near-vowel-like color comes entirely from filtered noise, not from any additional pitched source — a texture none of `strings`/`mallet`/`periodicWave` can reach on their own. `opts`: `dur`(2), `gain`(0.12), `attack`(0.5), `release`(1.2), `delay`, `pan`, `reverb`, `bus`. Not wired to any track yet — available for a future track that wants a vocal/atmospheric layer.
  - **`tone()`'s new `vibrato`/`vibratoDepth` option** (fourth engine-expansion pass, "piano, trumpet, and zunpet") — general-purpose pitch vibrato added to `tone()` itself, not a one-off: when both `opts.vibrato` (Hz, wobble rate) and `opts.vibratoDepth` (cents) are nonzero, a dedicated LFO oscillator is connected straight into the note's own `osc.detune` `AudioParam` (the same additive-modulation trick `startAmbient` already uses for its amplitude "breathing," just targeting pitch instead of gain), started/stopped alongside the main oscillator. Any `tone()` call — not just a named instrument — can opt into this.
  - **Fourth engine-expansion pass ("piano, trumpet, and zunpet")** — three more instruments, each combining an earlier technique with a distinctive ATTACK TRANSIENT (a percussive/breathy/buzzy onset being what actually makes a struck-or-blown instrument recognizable, the sustained body alone rarely being enough):
    - **`piano(freq, opts)`** (private, new) — a struck string: a very short filtered-noise "hammer" click at onset (`noise({dur:0.008, filterFreq:2500, filterType:'bandpass', ...})` — impossible from a pitched oscillator alone), then a near-instant-attack (`attack:0.004`), long-tail body of 3 harmonically-related `tone()` layers (fundamental `'triangle'` + a quiet octave + a faintly-quieter 2-octaves-up shimmer), each layer's `dur`/`release` shortened relative to the one below it (real piano strings lose their higher partials fastest too). `opts`: `dur`(1.2), `gain`(0.2), `release`(1.0), `delay`, `pan`, `reverb`, `bus`, `filterFreq`(3200), `filterType`.
    - **`trumpet(freq, opts)`** (private, new) — a blown brass note: a short buzzy "chiff" (narrow-bandpass noise around `freq*2`, simulating the lips' initial buzz before the horn's resonance settles), a brief pitch "scoop" sliding up into the target note via a 0.05s grace `tone()` using `sweepTo` (the lip-slur articulation a trumpet embouchure makes), then the sustained body — the `'brass'` periodic wave through `tone()`, now carrying real per-note pitch vibrato via the new `vibrato`/`vibratoDepth` option. `opts`: `dur`(0.5), `gain`(0.2), `attack`(0.03), `release`(0.15), `delay`, `pan`, `reverb`, `bus`, `vibrato`(5.5), `vibratoDepth`(8).
    - **`zunpet(freq, opts)`** (private, new) — **not modeled on any real instrument**, an invented, deliberately goofy voice for flavor/comic-relief cues: `fm()` at an unusually low modulation ratio (`0.5`, vs. `fm()`'s own default `2`) through a square carrier gives a reedy, nasal "kazoo/duck-call" quality, layered with a fast/wide-vibrato square-wave `tone()` on top (`vibrato:14, vibratoDepth:40` — pushed hard enough to read as comic rather than musical). `opts`: `dur`(0.3), `gain`(0.18), `delay`, `pan`, `reverb`, `bus`.
    - **`banjo(freq, opts)`** (private, new — added for the Desert-track redo, see below) — a bright, short-sustain plucked string: a quick highpass-noise "pick" transient at onset (brighter/snappier than `piano()`'s duller hammer click), then `pluck()` itself (the same Karplus-Strong primitive the melodic instruments already share) tuned brighter and faster-decaying than any earlier use of it (`damping` up around 3000+, `decay` a bit further below 1) — a banjo's whole character is a short, ringing, metallic "plink," not a sustained tone. `opts`: `dur`(0.35), `gain`(0.2), `damping`(3200), `decay`(0.93), `delay`, `pan`, `reverb`, `bus`.
    - **`growl(freq, opts)`** (private, new — added for the Inferno track, see below) — introduces **waveshaping distortion**, a synthesis technique nothing else in the file uses: a detuned two-oscillator sawtooth stack (`detuneCents`, default ±9) runs through a `WaveShaperNode` (`distortionCurve(amount)`, a soft-clip curve — `((1+k)*x)/(1+k*|x|)`, cheaper than `tanh` but the same shape) then a lowpass filter to tame the extra harmonics down to "gritty" rather than harsh (the same "raw high-harmonic content reads as ear-screeching" lesson the reverb-IR fix taught). A gritty, aggressive lead for molten/intense settings. `opts`: `dur`(0.3), `gain`(0.16), `attack`(0.01), `release`(0.12), `delay`, `drive`(6, the waveshaper's clip amount), `filterFreq`(1400), `detuneCents`(9), `pan`, `reverb`, `bus`.
    - **`stab(freq, opts)`** (private, new — added for the Boss Room redo, see below) — a dramatic percussive chord hit: three detuned sawtooth oscillators (root/fifth/octave — a "power chord") share ONE `distortionCurve` waveshaper stage (same helper `growl()` uses, but driving a chord instead of a single melodic voice) plus a sharp highpass-`noise()` crash transient at onset — a horror-movie-stinger hit meant for downbeat accents, not a sustained lead. `opts`: `dur`(0.25), `gain`(0.18), `delay`, `drive`(8), `filterFreq`(2200), `pan`, `reverb`(0.12), `bus`.
    - **`icechime(freq, opts)`** (private, new — added for the Frozen Desert track, see below) — a bright, slowly-shimmering bell: two sine partials at an inharmonic ratio (1 and 2.4 — the same "not a clean overtone" idea `mallet()`'s `MALLET_PARTIALS` uses, just two voices, pitched higher, and ringing much longer) plus a slow **tremolo** LFO on the *output gain* (amplitude modulation — distinct from every `vibrato` use elsewhere, which all modulate pitch/detune instead) for a shimmering "light through ice" waver rather than a flat ring. A short highpass-noise "wind" transient at onset. `opts`: `dur`(1.1), `gain`(0.14), `attack`(0.01), `release`(1.4), `delay`, `tremolo`(4.5, Hz), `tremoloDepth`(0.35), `pan`, `reverb`(0.2), `bus`.
    - **`harmonica(freq, opts)`** (private, new — added for the Badlands track, see below) — a reedy, dusty voice: two `tone()` square-wave voices a few cents apart beat gently against each other through a shared bandpass filter (the same close-detune-beating idea `strings()` uses for its unison pad, just two voices instead of a stack), one of them bent up into the target note from just below via `sweepTo` — standing in for a harmonica's characteristic blues "draw bend" — the other held flat and detuned sharp. A short bandpass-noise "breath chiff" at onset. `opts`: `dur`(0.4), `gain`(0.16), `attack`(0.02), `release`(0.15), `delay`, `detuneCents`(12), `filterFreq`(null → `freq*2.2`), `pan`, `reverb`, `bus`.
    - **`flute(freq, opts)`** (private, new — added for the Beach track, see below) — a breezy, airy voice: a pure sine `tone()` (light pitch vibrato) layered over a bandpass-filtered `noise()` bed running the SAME full note length rather than a short attack transient — every other instrument in the file uses `noise()` as a percussive click/chiff at onset only; here it's a continuous textural "breath" layer under the pitched tone for the whole note, a new *use* of an existing primitive rather than a new primitive itself. `opts`: `dur`(0.5), `gain`(0.16), `attack`(0.05), `release`(0.25), `delay`, `vibrato`(4.5), `vibratoDepth`(6), `breath`(0.35, the noise bed's level relative to `gain`), `pan`, `reverb`, `bus`.
    - **`whalecall(freq, opts)`** (private, new — added for the Ocean track, see below) — a long, drifting cry: a sine `tone()` glides continuously from `freq` up to `glideTo` (default `freq*1.15`) across the whole note via `tone()`'s own `sweepTo`, but stretched over a long `dur`/slow `attack`/`release` "call" envelope rather than a quick grace-note flourish (contrast `trumpet()`'s use of the same option), plus gentle vibrato. A handful of short bandpass-`noise()` "bubbles" fire at random delays across the note — the first instrument here to schedule several independently-timed noise bursts from one call rather than a single fixed attack transient. `opts`: `dur`(1.6), `gain`(0.13), `attack`(0.3), `release`(0.6), `delay`, `glideTo`(null), `vibrato`(3), `vibratoDepth`(15), `bubbles`(2, count), `pan`, `reverb`(0.25), `bus`.
    - **`gong(freq, opts)`** (private, new — added for the Sea Floor track, see below) — a deep, swelling, metallic resonance: several inharmonic sine partials (`GONG_PARTIALS`, like `mallet()`'s struck-bar model but more of them and rung out much longer) each pass through their OWN `BiquadFilterNode` that slowly closes across the whole decay (`exponentialRampToValueAtTime` on `filt.frequency` from `damping` down to `damping*0.3` by the note's end) — a per-note filter automation nothing else in the file does (`mallet()`'s `filterFreq` is static) — so the strike loses its shimmer and darkens as it rings out. A soft bandpass-`noise()` strike transient at onset. `opts`: `dur`(2.2), `gain`(0.12), `attack`(0.05), `release`(2.5), `delay`, `damping`(1600), `pan`, `reverb`(0.3), `bus`.
    - **`sonarping(freq, opts)`** (private, new — added for the Trench track, see below) — a fading echo-blip: a downward-settling sine ping feeds a real feedback **delay line** (a `DelayNode` whose output both reaches the mix and feeds back into its own input through a sub-unity `feedback` gain) rather than the shared `ensureReverb()` convolver everything else uses — a genuine discrete echo train (ping...ping...ping, decaying) instead of a diffuse wash; `reverb` is still available on top for extra distance-blur. `opts`: `dur`(0.15), `gain`(0.16), `attack`(0.005), `release`(0.3), `delay`, `echoTime`(0.28), `feedback`(0.42), `echoes`(4, just controls how long the oscillator is kept alive for the tail), `pan`, `reverb`, `bus`.
    - **`ringmod(freq, opts)`** (private, new — added for the Trench Depths track, see below) — an eerie, metallic, unstable tone via TRUE audio-rate **ring modulation**: a carrier oscillator connects into a `GainNode`'s audio input while an independent modulator oscillator connects into that same node's `gain` AudioParam (base value 0) — since a `GainNode`'s output is `input * gain(t)` and the modulator alone drives `gain(t)`, the output is the two waveforms multiplied sample-for-sample, not summed. Different mechanism from every earlier "LFO into a param" trick in the file (`tone()`'s vibrato / `icechime()`'s tremolo both ADD onto an existing param value) — multiplication from a zero base is what produces ring mod's inharmonic sidebands instead of a smooth wobble. `opts`: `dur`(0.5), `gain`(0.14), `attack`(0.02), `release`(0.6), `delay`, `modRatio`(1.4, the modulator's frequency as a multiple of `freq`), `pan`, `reverb`, `bus`.
    - **`voidhum(freq, opts)`** (private, new — added for the Deep Dark track, see below) — a directionless, pressurized hum via **granular synthesis**: a long, barely-audible sine anchor at `freq` beneath a cloud of `grains` very short, quiet, randomly-delayed/detuned/panned `noise()` bursts scattered across the note's whole length — every earlier instrument fires `noise()` as one deliberate transient or sustained bed; this is dozens of independent scattered grains instead. `opts`: `dur`(3), `gain`(0.05), `delay`, `grains`(14), `pan`, `reverb`(0.3), `bus`.
    - **`glitch(freq, opts)`** (private, new — added for the Meta Realm track, see below) — a jittery, digital voice that, unlike every instrument above, plays more than one note per call: a **self-contained internal micro-sequence** of `steps` short square blips fired `stepGap` seconds apart from within the single call, each `freq * ratio` for a plain, still-consonant interval (unison/fifth/octave, from `ratios`) — a chiptune-style stutter/arpeggio baked into the instrument itself rather than built from separate step-array entries. The "wrongness" is entirely rhythmic; the pitch content stays as plain as everything else. `opts`: `dur`(0.06, each blip), `gain`(0.14), `delay`, `steps`(4), `stepGap`(0.045), `ratios`([1, 1.5, 2, 1]), `pan`, `reverb`(0.15), `bus`.
    - **`warpsynth(freq, opts)`** (private, new — added for the Hyperspace track, see below) — a rising, opening lead: a sawtooth oscillator's pitch rises continuously from `freq` to `riseTo` (default an octave up) across the whole note, while a lowpass filter OPENS upward alongside it (`filterFrom` → `filterTo`) — the mirror image of `gong()`'s filter, which slowly closes across a note's decay; here it opens across a note's rise, for an uplifting sci-fi "warp" sweep. `opts`: `dur`(1.2), `gain`(0.14), `attack`(0.05), `release`(0.5), `delay`, `riseTo`(null → `freq*2`), `filterFrom`(300), `filterTo`(4000), `pan`, `reverb`(0.2), `bus`.
    - **`drip(freq, opts)`** (private, new — added for the C-branch Gutters track, see below) — a single water droplet: a sharp downward pitch chirp feeds a short delay line whose OWN `delayTime` is continuously modulated by an LFO — **chorus**, a new modulation target (every earlier modulated-param instrument targets detune/gain/filter-frequency; this is the first to modulate a `DelayNode`'s `delayTime` itself), making the echoed tap slide in and out of phase with the dry signal for a subtly shifting "wet echo off stone" rather than `sonarping()`'s clean discrete repeats. `opts`: `dur`(0.12), `gain`(0.15), `delay`, `chorusRate`(5, Hz), `chorusDepth`(0.004, seconds), `chorusBase`(0.012, seconds), `pan`, `reverb`(0.2), `bus`.
    - **`sludge(freq, opts)`** (private, new — added for the C-branch Sewers track, see below) — a murky, sickly voice: a sawtooth through a high-Q bandpass filter, with a second LFO continuously pushing the filter's center frequency back and forth (an **auto-wah**) rather than sweeping it one-directionally like `gong()`'s close or `warpsynth()`'s open — the filter keeps oscillating for as long as the note rings, a queasy/unstable color instead of a settled trajectory. `opts`: `dur`(0.4), `gain`(0.15), `attack`(0.02), `release`(0.3), `delay`, `wahRate`(3.2, Hz), `wahDepth`(500, Hz), `filterBase`(900), `pan`, `reverb`(0.1), `bus`.
    - **`birdcall(freq, opts)`** (private, new — added for the C-branch Rainforest track, see below) — a bright chirping trill: a sine's pitch swoops UP then back DOWN across the note (two chained `exponentialRampToValueAtTime` calls — a "V"-shaped contour, a new envelope shape; every earlier pitch move in the file is a single directional ramp) with a fast/deep `trill` vibrato (well above every other instrument's default vibrato rate) riding on top for the chirp texture. `opts`: `dur`(0.12), `gain`(0.13), `delay`, `peakMul`(1.6, how far up the "V" swoops), `trill`(22, Hz), `trillDepth`(60, cents), `pan`, `reverb`(0.25), `bus`.
    - **`creak(freq, opts)`** (private, new — added for the C-branch Mangroves track, see below) — a groaning, resonant wood/rope sound: a high-Q bandpass filter sweeps slowly across a slice of the shared `noiseBuffer` rather than an oscillator — every earlier filter sweep (`gong()`'s close, `warpsynth()`'s open) shapes a pitched tone; sweeping a narrow resonance across broadband noise instead gives this its non-pitched, groaning creak rather than a clean glide. `opts`: `dur`(0.6), `gain`(0.14), `delay`, `filterFrom`(null → `freq*0.8`), `filterTo`(null → `freq*1.6`), `filterQ`(12), `pan`, `reverb`(0.2), `bus`.
    - **`stardust(freq, opts)`** (private, new — added for the D-branch Observatory track, see below) — shimmering starlight: a quiet sine anchor at `freq` beneath a cluster of `twinkles` short, quiet, randomly-timed sine grains at HARMONIC ratios of `freq` (2x/3x/4x/5x/6x from `ratios`) — consonant overtones, unlike `voidhum()`'s inharmonic-filtered noise grains — scattered across the note. `opts`: `dur`(1.5), `gain`(0.05), `delay`, `twinkles`(10), `ratios`([2,3,4,5,6]), `pan`, `reverb`(0.3), `bus`.
    - **`clockwork(freq, opts)`** (private, new — added for the D-branch Orrery track, see below) — ticking brass gears: a self-contained click train of `ticks` short bandpass-`noise()` clicks whose inter-tick GAP shrinks geometrically each repeat (`gapRatio` < 1) — a winding-down mechanical accelerando, a different self-scheduling shape from `glitch()`'s fixed `stepGap` — under a soft triangle `tone()` "chime" body for the gear assembly's resonance. `opts`: `gain`(0.13), `delay`, `ticks`(5), `startGap`(0.09, seconds), `gapRatio`(0.7), `filterFreq`(null → `freq*3`), `pan`, `reverb`(0.12), `bus`.
    - **`drift(freq, opts)`** (private, new — added for the D-branch Void Between track, see below) — a cold, isolated tone: a long sine held under a `StereoPannerNode` whose `pan` is continuously driven by an LFO (`panRate`/`panDepth`) — a slow left-right drift across the whole note. Every other instrument's stereo position is a single fixed value (`routeOut`'s own `pan` option); this is the first to modulate pan over time, so it builds its own output routing (gain → panner → dest/reverb-send) rather than calling `routeOut`, whose panner is always static. `opts`: `dur`(4), `gain`(0.04), `attack`(1.5), `release`(2), `delay`, `panRate`(0.15, Hz), `panDepth`(0.6), `reverb`(0.35), `bus`.
    - **Music sequencer** (`stepArray`, `MUSIC_TRACKS`, `MUSIC_LOOKAHEAD = 0.12`, `MUSIC_SCHEDULE_INTERVAL = 30`, `playMusicNote`, `scheduleMusicStep`, `scheduleMusicTick`, `startMusic(trackId)`, `stopMusic()`, all private except the last two) — turns a short repeating step pattern into audio using the standard **lookahead scheduler** pattern: a `setInterval` every `MUSIC_SCHEDULE_INTERVAL`ms calls `scheduleMusicTick`, which schedules every step whose absolute time falls within `MUSIC_LOOKAHEAD` seconds of `ctx.currentTime` — the JS timer only decides WHEN to schedule, never WHEN to sound (every note's real trigger is an exact `AudioContext` timestamp converted to a `delay` and handed to the underlying primitive), so tempo stays sample-accurate regardless of any timer jitter. `stepArray(len, entries)` builds a sparse `Array(len).fill(null)` from an `{index:value}` map — easier to read/tune than typing dozens of `null`s. A **track** is `{ bpm, stepsPerBeat, parts:[{instrument, steps, opts}, ...] }` — `steps` is a `stepArray` where each entry is `null` (rest), a number (a frequency, or for `instrument:'perc'` a kind string), or an array of either (a chord/multi-hit on that step). `playMusicNote(instrument, note, opts, delay)` dispatches by `instrument` name to `perc`/`pluck`/`fm`/`bass`, or falls through to `tone(note, {...opts, type:instrument})` for anything else (so `'sine'`/`'bell'`/`'organ'`/`'brass'`/etc. all work as an `instrument` name too). `startMusic(trackId)` is idempotent for the SAME track (a repeated call while it's already playing no-ops, same shape as `startAmbient`) and cleanly swaps to a different one via `stopMusic()` first; creates one dedicated `bus` `GainNode` (fades in over 2s, connected to `master`) that every note in the track routes through via `routeOut`'s `opts.bus`, so the whole track fades as one unit regardless of how many instruments/notes are sounding. `stopMusic()` fades that bus to 0 over 1.5s, `clearInterval`s the scheduler, and is a safe no-op if nothing is playing.
      - **"Sound more musical" pass** (all in `scheduleMusicStep`, driven off `stepIndex`/`track` alone — no track's authored step data had to change to pick any of this up): (1) **humanization** — every note gets a small random timing jitter (±12ms via `Util.rand`), so the mechanical step grid reads as played rather than sequenced; (2) **velocity accenting** — bar downbeats (`beatPos===0` AND on beat 0 of a 4-beat bar) get `gain*1.15`, other on-beats `*1.0`, off-beat subdivisions `*0.88`, each with an extra `0.94-1.06` random jitter on top, for natural phrasing a flat unaccented loop never has; (3) **swing** — off-beat subdivisions land `track.swing * secPerStep * 0.33` seconds late; defaults to a light `0.1` for any track that doesn't set its own `swing`, and a handful of mechanically-precise tracks (`bossroom`/`inferno`/`orrery`/`metarealm`/`hyperspace`) explicitly set `swing: 0` to stay tight instead; (4) **algorithmic percussion fill** — every 4th time a `perc` part's pattern loops (`loopIndex%4===3`), the last 4 steps get a `'hat'` filled into whatever rests are already there (kicks/snares written into those steps are left alone), a small "roll into the next bar" with no hand-authored fill data needed; (5) **pad breathing** — `strings`/`choir` parts get an extra `0.88 + 0.12*sin(stepIndex*0.05)` gain multiplier, a slow continuous swell keyed off the ever-increasing `stepIndex` (never resets on a loop boundary) rather than a per-loop cycle, so a sustained chord feels alive across the whole piece instead of repeating identically. Velocity accenting/humanization/breathing only touch `opts.gain` when a part's `opts` sets one numerically (true for every part in every track). (6) **A/B sections** — added for the Boss Room redo: a part can carry an optional `altSteps` (same length as `steps`); every `track.altSectionLoops` loops (4 by default) through the pattern, playback swaps to `altSteps` for the same span, then swaps back — `inAltSection = part.altSteps && Math.floor(loopIndex / (track.altSectionLoops || 4)) % 2 === 1`. Real verse/chorus musical FORM instead of one bar repeating forever, entirely opt-in per part (no `altSteps` = unaffected, which is every track except `bossroom` so far).
    - **`listMusicTracks()`** — read-only listing for UI, `[{id, name}, ...]` for every key in `MUSIC_TRACKS` (`name` falls back to the id if a track has no `name` field). Never returns the raw `MUSIC_TRACKS` object, so a caller can't mutate step data through it. Used by `ui/music-test.js`'s preview panel.
    - **`currentMusicTrackId()`** — `musicState ? musicState.trackId : null`. Also used by the preview panel to know which row to highlight.
    - **`MUSIC_TRACKS.crypt`** — Stage 0/The Crypt (floors 1-2 on the plain main route, see `stages.js`'s `STAGES[0]` and `game.js`'s `startFloor`). 72 BPM, 8th-note steps (`stepsPerBeat:2`), a 32-step/4-bar loop (~13.3s). Four parts, all in A natural minor: `bass` (`CRYPT_BASS_STEPS`, a sparse two-note walking line — A2/G2/A2/F2 on the downbeat of each bar), `mallet` (`CRYPT_MELODY_STEPS`, a sparse off-beat melody — see the third-pass entry just below for why this is `mallet` and not `pluck`), `perc` (`CRYPT_PERC_STEPS` — `'kick'` on beats 1/3 of the loop, `'bonehit'` accents on the off-beats), `strings` (`CRYPT_PAD_STEPS` — one A2+C3+G3 chord swelled once per loop for atmosphere — see the third-pass entry for why this is `strings` and not `organ`).
    - **`MUSIC_TRACKS.forest`** — Stage 1/The Whitetail Forest (floors 3-4, see `stages.js`'s `STAGES[1]`). Brighter and livelier than the Crypt (96 BPM vs. 72) but deliberately kept in the same low-register discipline the Crypt settled on after the "less high pitches" feedback. Four parts, D major: `bass` (`FOREST_BASS_STEPS` — D2/A2/G2/D2, a I-V-IV-I walking line), `piano` (`FOREST_PIANO_STEPS` — an 8-note rolling up-and-down arpeggio D3-F#3-A3-D4-A3-F#3-D3-A2, topping at D4/294Hz, same ceiling as the Crypt's melody), `trumpet` (`FOREST_TRUMPET_STEPS` — a sparse 3-note-per-loop distant horn-call motif, A3/D4/F#3, with light vibrato), `perc` (`FOREST_PERC_STEPS` — `'kick'`/`'hat'` for footsteps/twig-snaps rather than the Crypt's `'bonehit'` bone percussion). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `forest: 'forest'`.
    - **`MUSIC_TRACKS.desert`** — Stage 2/The Sandswept Dunes (floors 5-6, see `stages.js`'s `STAGES[2]`). **Redone from scratch** after direct feedback ("never use this music style again, it hurts") on the original version, which used E Phrygian dominant (an exotic scale with an augmented-2nd F→G# step). The lesson taken: exotic/dissonant scales are off the table for this project's music regardless of how well-motivated the theming seems — every track from here on stays in a plain, consonant key. The redo uses **G major pentatonic** (G, A, B, D, E — no 4th, no 7th, so there is no half-step/dissonant interval anywhere in the scale at all) and introduces the new `banjo` instrument (see above) for a warm, upbeat, distinctly Americana/folk desert-travel feel instead of the original's heat-mirage exoticism. 84 BPM (up from the original's 66 — jaunty rather than drowsy). Four parts: `bass` (`DESERT_BASS_STEPS` — G2/D2/G2/C2, a plain I-V-I-IV walking line), `banjo` (`DESERT_MELODY_STEPS` — G3-B3-D4-B3-A3-G3-B3-A3, a continuous rolling pentatonic "banjo roll" pick pattern, 8 notes/loop), `perc` (`DESERT_PERC_STEPS` — `'kick'`/`'hat'`, same shape as the Forest track's), `strings` (`DESERT_PAD_STEPS` — a plain G2+B2+D3 major triad swell, replacing the original's `choir` heat-haze pad). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `desert: 'desert'`.
    - **`MUSIC_TRACKS.inferno`** — Stage 3/The Inferno (floors 7-8, the last stage before the run branches — see `stages.js`'s `STAGES[3]`). The most aggressive track yet: 108 BPM (up from the Crypt's 72), a punchy 16-step riff repeated twice per loop, and a driving four-on-the-floor `kick`/`snare`/`hat` pattern (busier than any earlier track's percussion). Introduces the new `growl` instrument (see above) for the lead — a distorted voice standing in for the din/heat of molten depths — while staying in plain **A natural minor** throughout (A-B-C-D-E-F-G, no augmented 2nd, no exotic interval anywhere), per the standing "never use an exotic/dissonant scale again" rule from the Sandswept Dunes redo. Four parts: `bass` (`INFERNO_BASS_STEPS` — A2/F2/G2/A2, i-VI-VII-i), `growl` (`INFERNO_GROWL_STEPS` — A3-C4-B3-A3-F3-G3, a 6-note riff played twice per loop), `perc` (`INFERNO_PERC_STEPS` — kick+snare+hat on every beat/off-beat), `strings` (`INFERNO_PAD_STEPS` — a plain A2+C3+E3 minor triad swell). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `inferno: 'inferno'`.
    - **`MUSIC_TRACKS.frozendesert`** — Stage 4/The Frozen Desert (floors 9-10 of Phase 10's new post-Inferno arc — see `stages.js`'s `STAGES[4]`; scaffolding-only stage, not yet reachable through normal play, but the track hook is generic via `STAGE_MUSIC_TRACKS` so it's wired the same as every other stage). The coldest, sparsest track yet: 66 BPM, long silences between notes, no kick at all (just an occasional soft `hat` standing in for footsteps crunching snow). Introduces the new `icechime` instrument (see above) for a glassy, slowly-shimmering high melody — the one track where real brightness is the point of the instrument, kept safe from the "less high pitches" lesson by being sparse (long decays, wide gaps, never more than one note ringing at once) rather than loud or busy. Plain **C major pentatonic** throughout (C, D, E, G, A — no 4th, no 7th, no dissonant interval anywhere), the same "can't sound bad" 5-note family the Sandswept Dunes redo settled on. Four parts: `bass` (`FROZENDESERT_BASS_STEPS` — a bare C2/G2 I-V, nothing more), `icechime` (`FROZENDESERT_ICECHIME_STEPS` — G4/A4/E4/G4, 4 notes/loop, long-ringing with wide gaps), `perc` (`FROZENDESERT_PERC_STEPS` — 2 sparse `hat` hits/loop only), `strings` (`FROZENDESERT_PAD_STEPS` — a plain C2+G2+E3 major triad, brighter filter than the other pads for an airy/icy quality). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `frozendesert: 'frozendesert'`.
    - **`MUSIC_TRACKS.badlands`** — Stage 5 of Phase 10's new arc (see `stages.js`'s `STAGES[5]`; scaffolding-only stage like Frozen Desert, wired the same generic way). Rugged and dusty, a moderate 80 BPM trudge. Introduces the new `harmonica` instrument (see above) for a lone, bending, travel-worn lead. Plain **D natural minor** throughout (D-E-F-G-A-Bb-C, no exotic interval anywhere). Four parts: `bass` (`BADLANDS_BASS_STEPS` — D2/Bb1/C2/D2, i-VI-VII-i), `harmonica` (`BADLANDS_HARMONICA_STEPS` — D3-F3-G3-A3-D3-Bb3-G3-F3, a sparse bending riff), `perc` (`BADLANDS_PERC_STEPS` — `'kick'`/`'hat'`), `strings` (`BADLANDS_PAD_STEPS` — a plain D2+F2+A2 minor triad). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `badlands: 'badlands'`.
    - **`MUSIC_TRACKS.beach`** — Stage 6 of Phase 10's new arc (see `stages.js`'s `STAGES[6]`; scaffolding-only stage, wired the same generic way). The arc's first bright/breezy track, a relaxed 92 BPM shoreline stroll. Introduces the new `flute` instrument (see above) for a long, airy, legato melody. Plain **A major pentatonic** throughout (A, B, C#, E, F# — no 4th, no 7th, no dissonant interval anywhere) — a different pentatonic key from the Sandswept Dunes' G or the Frozen Desert's C, so no two tracks repeat the same key. Four parts: `bass` (`BEACH_BASS_STEPS` — A2/E2/F#2/A2, I-V-vi-I), `flute` (`BEACH_FLUTE_STEPS` — A3-C#4-E4-F#4-E4-C#4-B3, a long flowing phrase), `perc` (`BEACH_PERC_STEPS` — light `'kick'`/`'hat'`), `strings` (`BEACH_PAD_STEPS` — a plain A2+C#3+E3 major triad, brighter filter for an airy quality). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `beach: 'beach'`.
    - **`MUSIC_TRACKS.ocean`** — Stage 7 of Phase 10's new arc (see `stages.js`'s `STAGES[7]`; scaffolding-only stage, wired the same generic way). Open water, flowing and slow (76 BPM). Introduces the new `whalecall` instrument (see above) for a sparse, drifting long-form melody — only 3 calls across the whole loop, each gliding upward and ringing out well past the next step. Plain **E natural minor** throughout (E-F#-G-A-B-C-D, no exotic interval anywhere). Four parts: `bass` (`OCEAN_BASS_STEPS` — E2/C2/D2/E2, i-VI-VII-i), `whalecall` (`OCEAN_WHALECALL_STEPS` — E3/G3/B3, 3 wide-spaced calls), `perc` (`OCEAN_PERC_STEPS` — sparse `'kick'`/`'hat'`), `strings` (`OCEAN_PAD_STEPS` — a plain E2+G2+B2 minor triad). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `ocean: 'ocean'`.
    - **`MUSIC_TRACKS.seafloor`** — Stage 8 of Phase 10's new arc (see `stages.js`'s `STAGES[8]`; scaffolding-only stage, wired the same generic way). Deeper, darker, and sparser than The Ocean: a slow 60 BPM crawl with no continuous melody at all, just three widely-spaced `gong` strikes (see above) per loop ringing into long silence. Plain **C natural minor** throughout (C-D-Eb-F-G-Ab-Bb, no exotic interval anywhere), a new key from any earlier track. Four parts: `bass` (`SEAFLOOR_BASS_STEPS` — C2/Bb1/Ab1/C2, i-VII-VI-i), `gong` (`SEAFLOOR_GONG_STEPS` — C3/Eb3/G2, 3 widely-spaced strikes), `perc` (`SEAFLOOR_PERC_STEPS` — 2 sparse `'hat'` hits only, same discipline as the Frozen Desert's), `strings` (`SEAFLOOR_PAD_STEPS` — a plain C2+Eb2+G2 minor triad, the darkest/lowest-filtered pad of any track). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `seafloor: 'seafloor'`.
    - **`MUSIC_TRACKS.trench`** — Stage 9 of Phase 10's new arc (see `stages.js`'s `STAGES[9]`; scaffolding-only stage, wired the same generic way). Deeper and more tense than The Ocean (70 BPM). Introduces the new `sonarping` instrument (see above) for an echoing sonar-blip lead. Plain **G natural minor** throughout (G-A-Bb-C-D-Eb-F, no exotic interval anywhere), a new key from any earlier track. Four parts: `bass` (`TRENCH_BASS_STEPS` — G2/Eb2/F2/G2, i-VI-VII-i), `sonarping` (`TRENCH_SONARPING_STEPS` — G3/Bb3/C4/G3), `perc` (`TRENCH_PERC_STEPS` — sparse `'kick'`/`'hat'`), `strings` (`TRENCH_PAD_STEPS` — a plain G2+Bb2+D3 minor triad). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `trench: 'trench'`.
    - **`MUSIC_TRACKS.trenchdepths`** — Stage 10 of Phase 10's new arc (see `stages.js`'s `STAGES[10]`; scaffolding-only stage, wired the same generic way). Deeper still, unstable and eerie (58 BPM). Introduces the new `ringmod` instrument (see above) for a metallic, ring-modulated lead. Plain **F# natural minor** throughout (F#-G#-A-B-C#-D-E, no exotic interval anywhere). Four parts: `bass` (`TRENCHDEPTHS_BASS_STEPS` — F#2/D2/E2/F#2, i-VI-VII-i), `ringmod` (`TRENCHDEPTHS_RINGMOD_STEPS` — F#3/A3/C#4/F#3, sparse and wide-spaced), `perc` (`TRENCHDEPTHS_PERC_STEPS` — 2 sparse `'hat'` hits only), `strings` (`TRENCHDEPTHS_PAD_STEPS` — a plain F#2+A2+C#3 minor triad). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `trenchdepths: 'trenchdepths'`.
    - **`MUSIC_TRACKS.deepdark`** — Stage 11 of Phase 10's new arc (see `stages.js`'s `STAGES[11]`; scaffolding-only stage, wired the same generic way). Lightless and oppressive, the slowest and sparsest track in the whole game (54 BPM). Introduces the new `voidhum` instrument (see above) for a directionless granular texture standing in for a melody. Plain **F natural minor** throughout (F-G-Ab-Bb-C-Db-Eb, no exotic interval anywhere). Four parts: `bass` (`DEEPDARK_BASS_STEPS` — F2/Db2/Eb2/F2, i-VI-VII-i), `voidhum` (`DEEPDARK_VOIDHUM_STEPS` — F3/Db3, just two long grainy swells per loop), `perc` (`DEEPDARK_PERC_STEPS` — a single `'hat'` hit per loop, the sparsest percussion of any track), `strings` (`DEEPDARK_PAD_STEPS` — a plain F2+Ab2+C3 minor triad, the darkest-filtered pad of any track). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `deepdark: 'deepdark'`.
    - **`MUSIC_TRACKS.metarealm`** — Stage 12 of Phase 10's new arc (see `stages.js`'s `STAGES[12]`; scaffolding-only stage, wired the same generic way). Outside the game's own fiction, unnervingly bright and energetic against everything leading up to it (100 BPM). Introduces the new `glitch` instrument (see above) for a jittery, self-arpeggiating lead — the wrongness is entirely rhythmic (`METAREALM_PERC_STEPS` lands its kicks deliberately off-grid: steps 0/14/16/30, a "broken meter"), never the pitch content. Plain **D major pentatonic** throughout (D, E, F#, A, B — no dissonant interval anywhere) — the first MAJOR-key pad in this back half of the arc, deliberately jarring against the five minor-key stages before it. Four parts: `bass` (`METAREALM_BASS_STEPS` — D2/A1/B1/D2, I-V-vi-I), `glitch` (`METAREALM_GLITCH_STEPS` — D4/F#4/A4/B3), `perc` (`METAREALM_PERC_STEPS` — off-grid `'kick'`s), `strings` (`METAREALM_PAD_STEPS` — a plain D2+F#2+A2 major triad). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `metarealm: 'metarealm'`.
    - **`MUSIC_TRACKS.hyperspace`** — Stage 13, the arc's final stage (see `stages.js`'s `STAGES[13]`; scaffolding-only stage, wired the same generic way). The fastest, most energetic track in the game (118 BPM). Introduces the new `warpsynth` instrument (see above) for a rising, filter-opening lead sweep. Plain **E major pentatonic** throughout (E, F#, G#, B, C# — no dissonant interval anywhere). Four parts: `bass` (`HYPERSPACE_BASS_STEPS` — E2/B1/C#2/E2, I-V-vi-I), `warpsynth` (`HYPERSPACE_WARPSYNTH_STEPS` — E3/G#3/B3/C#4, each rising/opening across its own step), `perc` (`HYPERSPACE_PERC_STEPS` — four-on-the-floor `'kick'`/`'hat'`), `strings` (`HYPERSPACE_PAD_STEPS` — a plain E2+G#2+B2 major triad). Registered in `stages.js`'s `STAGE_MUSIC_TRACKS` as `hyperspace: 'hyperspace'`. This is the last stage in `STAGES`, so every stage on the main route now has a background track.
    - **C-branch tracks** (`MUSIC_TRACKS.gutters`/`.sewers`/`.rainforest`/`.mangroves`) — the whole alternate run entered from the floor-2 gate room (floorNum 2-11, labelled 3C-12C; see stages.js's `C_PALETTES`/`C_MUSIC_TRACKS`/`cMusicTrackFor` and game.js's `startFloor`), four regions across those ten floors, same region split as `cPaletteFor`'s (3C/4C, 5C/6C, 7C-10C, 11C/12C). Same "plain, consonant scale only" rule as every Part A track.
      - **`MUSIC_TRACKS.gutters`** — wet concrete and standing rainwater, the branch's opening region (68 BPM). Introduces the new `drip` instrument (see above) for a sparse, deliberately irregularly-spaced dripping melody (not on a clean grid, the way real drips aren't). Plain **B natural minor** throughout (B-C#-D-E-F#-G-A). Four parts: `bass` (`GUTTERS_BASS_STEPS` — B1/G1/A1/B1, i-VI-VII-i), `drip` (`GUTTERS_DRIP_STEPS` — D3/F#3/A3/D3/F#3/B3 at irregular step positions), `perc` (`GUTTERS_PERC_STEPS` — `'hat'` only, no kick at all), `strings` (`GUTTERS_PAD_STEPS` — a plain B1+D2+F#2 minor triad). Registered as `gutters: 'gutters'`.
      - **`MUSIC_TRACKS.sewers`** — algae-slick brick under sodium light, murkier and slower (64 BPM). Introduces the new `sludge` instrument (see above) for a sickly, auto-wah lead. Plain **D natural minor** throughout (D-E-F-G-A-Bb-C). Four parts: `bass` (`SEWERS_BASS_STEPS` — D2/Bb1/C2/D2, i-VI-VII-i), `sludge` (`SEWERS_SLUDGE_STEPS` — D3/F3/G3/E3), `perc` (`SEWERS_PERC_STEPS` — `'kick'`/`'hat'`), `strings` (`SEWERS_PAD_STEPS` — a plain D2+F2+A2 minor triad). Registered as `sewers: 'sewers'`.
      - **`MUSIC_TRACKS.rainforest`** — canopy to storm-lashed crown, the branch's longest region at four floors and its liveliest tempo (88 BPM). Introduces the new `birdcall` instrument (see above) for a dense, chirpy canopy melody. Plain **C# natural minor** throughout (C#-D#-E-F#-G#-A-B). Four parts: `bass` (`RAINFOREST_BASS_STEPS` — C#2/A1/B1/C#2, i-VI-VII-i), `birdcall` (`RAINFOREST_BIRDCALL_STEPS` — a 9-note chirpy phrase), `perc` (`RAINFOREST_PERC_STEPS` — `'kick'`/`'hat'`, the busiest of the branch), `strings` (`RAINFOREST_PAD_STEPS` — a plain C#2+E2+G#2 minor triad). Registered as `rainforest: 'rainforest'`.
      - **`MUSIC_TRACKS.mangroves`** — brackish tidal water and salt-bleached roots, the branch's final region and Kirk's set (62 BPM). Introduces the new `creak` instrument (see above) for slow, widely-spaced groaning wood/rope hits. Plain **G# natural minor** throughout (G#-A#-B-C#-D#-E-F#). Four parts: `bass` (`MANGROVES_BASS_STEPS` — G#2/E2/F#2/G#2, i-VI-VII-i), `creak` (`MANGROVES_CREAK_STEPS` — G#3/D#3, two widely-spaced groans per loop), `perc` (`MANGROVES_PERC_STEPS` — 2 sparse `'hat'` hits only), `strings` (`MANGROVES_PAD_STEPS` — a plain G#2+B2+D#3 minor triad). Registered as `mangroves: 'mangroves'`.
    - **D-branch tracks** (`MUSIC_TRACKS.observatory`/`.orrery`/`.voidbetween`) — the second alternate run, entered from the floor-3 planetarium gate room (floorNum 3-9, labelled 4D-10D; see stages.js's `D_PALETTES`/`D_MUSIC_TRACKS`/`dMusicTrackFor` and game.js's `startFloor`), three regions across those seven floors, same region split as `dPaletteFor`'s (4D/5D, 6D/7D, 8D-10D). Same "plain, consonant scale only" rule as every earlier track.
      - **`MUSIC_TRACKS.observatory`** — dust, tarnished brass, cracked lens glass, the branch's opening region (72 BPM). Introduces the new `stardust` instrument (see above) for a sparse, shimmering starlight melody. Plain **Bb natural minor** throughout (Bb-C-Db-Eb-F-Gb-Ab). Four parts: `bass` (`OBSERVATORY_BASS_STEPS` — Bb1/Gb1/Ab1/Bb1, i-VI-VII-i), `stardust` (`OBSERVATORY_STARDUST_STEPS` — Bb3/Db4/Eb4/Bb3), `perc` (`OBSERVATORY_PERC_STEPS` — 2 sparse `'hat'` hits only, "dusty stillness"), `strings` (`OBSERVATORY_PAD_STEPS` — a plain Bb1+Db2+F2 minor triad). Registered as `observatory: 'observatory'`.
      - **`MUSIC_TRACKS.orrery`** — polished brass rings turning over deep indigo, the branch's mechanical heart (96 BPM). Introduces the new `clockwork` instrument (see above) for a ticking, self-arpeggiating gear melody. Plain **F major pentatonic** throughout (F, G, A, C, D — no dissonant interval anywhere), the first bright/major D-branch region, fitting "polished brass" against the branch's otherwise dust/void darkness. Four parts: `bass` (`ORRERY_BASS_STEPS` — F2/C2/D2/F2, I-V-vi-I), `clockwork` (`ORRERY_CLOCKWORK_STEPS` — F3/A3/C4/D4), `perc` (`ORRERY_PERC_STEPS` — `'kick'`/`'hat'`, the busiest of the branch), `strings` (`ORRERY_PAD_STEPS` — a plain F2+A2+C3 major triad). Registered as `orrery: 'orrery'`.
      - **`MUSIC_TRACKS.voidbetween`** — outside the machine, cold, empty, faintly lit, the branch's final and longest region and its superboss's set (56 BPM, the branch's slowest). Introduces the new `drift` instrument (see above) for a long, cold, continuously-panning drone standing in for a melody. Plain **Eb natural minor** throughout (Eb-F-Gb-Ab-Bb-Cb-Db). Four parts: `bass` (`VOIDBETWEEN_BASS_STEPS` — Eb2/B1(Cb2)/Db2/Eb2, i-VI-VII-i), `drift` (`VOIDBETWEEN_DRIFT_STEPS` — Eb3/Db3, two long drifting swells per loop), `perc` (`VOIDBETWEEN_PERC_STEPS` — a single `'hat'` hit per loop, as sparse as the Deep Dark's), `strings` (`VOIDBETWEEN_PAD_STEPS` — a plain Eb2+Gb2+Bb2 minor triad, the darkest-filtered pad of the branch). Registered as `voidbetween: 'voidbetween'`.
    - **Room-type tracks** (`MUSIC_TRACKS.bossroom`/`.crystalroom`/`.sombraroom`/`.treasureroom`/`.secretroom`/`.shoproom`) — see economy.js's `ROOM_MUSIC_TRACKS` and game.js's `enterRoom`: these override whichever floor/region track is currently playing for as long as the player stands in a room of that type, then hand back to the floor track on leaving. Shorter, tighter loops than the floor tracks (rooms are brief visits — several use a 16-step loop instead of 32), and reuse the EXISTING instrument palette rather than adding new ones (not every batch of tracks needs a new instrument). Same "plain, consonant scale only" rule throughout.
      - **`MUSIC_TRACKS.bossroom`** — **redone entirely** (the original was one static 16-hit `growl` riff over wall-to-wall kick/snare, repeating identically forever with no development). This version has real musical FORM via the new `altSteps`/`altSectionLoops` mechanism (see `scheduleMusicStep` above): every part carries a `steps` ("GRIND", loops 0-3, restrained 8th-notes) and an `altSteps` ("ASSAULT", loops 4-7, breaks loose), swapping every `altSectionLoops` (4) loops through the pattern via `track.altSectionLoops: 4`. 136 BPM (up from 130), plain **A natural minor** — the same key Crypt/Inferno already made "the villain's key," so every boss fight now ties back to that one dark identity instead of inventing a new key. `swing: 0` (set on the track) keeps it mechanically tight throughout. Five parts: `bass` (`BOSSROOM_BASS_GRIND`/`_ASSAULT` — a once-per-bar i-VI-VII-i that becomes a walking every-beat line under the assault), `growl` (`BOSSROOM_GROWL_GRIND` — an 8th-note riff / `_ASSAULT` — every single 16th-note step filled, a full run breaking loose from the grind's restraint), `perc` (`BOSSROOM_PERC_GRIND` — kick/snare only / `_ASSAULT` — the same kick/snare skeleton with a hat filled into every remaining step, reading as "doubled-time"), `stab` (see above; `BOSSROOM_STAB_SILENT` — silent during the grind / `BOSSROOM_STAB_ASSAULT` — a power-chord hit landing on each bar of the assault, the only part that's ever fully silent for half the piece), `strings` pad (`BOSSROOM_PAD_GRIND` — a plain A1+C2+E2 minor triad / `BOSSROOM_PAD_ASSAULT` — a borrowed vi chord, A1+C2+F2, for a brief tension shift, still plain/consonant). Registered as `boss: 'bossroom'`.
      - **`MUSIC_TRACKS.crystalroom`** (also used for Shrine) — a sparse blessing: gentle `icechime` sparkle (`CRYSTALROOM_ICECHIME_STEPS`) over a `choir` pad — a CHORD fed straight into `choir()` (three simultaneous formant voices, the lushest/only chorded-choir pad in the game, `CRYSTALROOM_PAD_STEPS`). Plain **C major** (70 BPM). `bass` (`CRYSTALROOM_BASS_STEPS` — a bare C2/G2 I-V), `perc` (`CRYSTALROOM_PERC_STEPS` — 2 sparse `'hat'` hits). Registered as `crystal: 'crystalroom'`, `shrine: 'crystalroom'`.
      - **`MUSIC_TRACKS.sombraroom`** (also used for Cursed Room) — a costly deal: sparse, unsettling `ringmod` (`SOMBRAROOM_RINGMOD_STEPS`, `modRatio:1.6` — a different flavor from Trench Depths' `1.4`) over a slow tense pulse. Plain **F# natural minor**, the same key as Trench Depths, `ringmod`'s original home track (66 BPM). `bass` (`SOMBRAROOM_BASS_STEPS` — a bare F#2/D2 i-VI), `perc` (`SOMBRAROOM_PERC_STEPS` — a single `'kick'`+`'hat'`), `strings` pad (`SOMBRAROOM_PAD_STEPS` — a plain F#2+A2+C#3 triad). Registered as `sombra: 'sombraroom'`, `curse: 'sombraroom'`.
      - **`MUSIC_TRACKS.treasureroom`** — a short triumphant fanfare: `trumpet` (`TREASUREROOM_TRUMPET_STEPS`) over a bright walking bass. Plain **A major** (100 BPM). `bass` (`TREASUREROOM_BASS_STEPS` — A2/C#3/F#2/A2), `perc` (`TREASUREROOM_PERC_STEPS` — `'kick'`/`'hat'`), `strings` pad (`TREASUREROOM_PAD_STEPS` — a plain A2+C#3+E3 triad). Registered as `treasure: 'treasureroom'`.
      - **`MUSIC_TRACKS.secretroom`** (also used for Sacrifice Room) — quiet and mysterious: a sparse `mallet` melody (`SECRETROOM_MALLET_STEPS` — the struck-bar "bone xylophone" plink, not previously used as a room track's lead) over a dark, still pad. Plain **B natural minor** (64 BPM). `bass` (`SECRETROOM_BASS_STEPS` — a bare B1/G1 i-VI), `perc` (`SECRETROOM_PERC_STEPS` — a single `'hat'`), `strings` pad (`SECRETROOM_PAD_STEPS` — a plain B1+D2+F#2 triad). Registered as `secret: 'secretroom'`, `sacrifice: 'secretroom'`.
      - **`MUSIC_TRACKS.shoproom`** (also used for Pet Shop) — a cheerful, bouncy jingle: a rolling `piano` arpeggio (`SHOP_PIANO_STEPS`) over a bright walking bass. Plain **G major** (108 BPM). `bass` (`SHOP_BASS_STEPS` — G2/D2/C2/G2, I-V-IV-I), `perc` (`SHOP_PERC_STEPS` — `'kick'`/`'hat'`), `strings` pad (`SHOP_PAD_STEPS` — a plain G2+B2+D3 triad). Registered as `shop: 'shoproom'`, `petshop: 'shoproom'`.
      - **Retuned after first-listen feedback ("ear screeching noise")**: on top of the engine-level bug fixes above (limiter, filtered/quieter reverb), the track's own settings were pushed too hot for a first pass — `pluck`'s `decay` this close to 1 makes a Karplus-Strong voice ring for a long time, and with a note landing every few hundred ms that meant several ringing voices stacking into a dissonant, metallic cluster rather than a clean melody. Fixed by: (1) thinning `CRYPT_MELODY_STEPS` from 8 notes/loop to 4, giving each voice room to decay before the next lands; (2) dropping `pluck`'s `decay` `0.985→0.9` and `damping` `1600→900` (faster decay, darker/duller timbre — reads as a dull knock rather than a struck wire); (3) dropping `CRYPT_PERC_STEPS` from 6 hits/loop to 4 (removed 2 of the 4 `'bonehit'` accents — too busy against the still-audible pluck decay); (4) cutting every part's `gain`/`reverb` well below their original values, and the pad's `dur` `7.5→6`.
      - **Second retune ("less on the high pitches please")**: three more brightness sources pulled down. `CRYPT_MELODY_STEPS` moved out of `220-330Hz` (A3-E4) into a narrow `164.81-220Hz` band (E3/F3/G3/A3, `196, 174.61, 220, 164.81`) — a plucked voice's harmonic content skews brighter at higher pitches AND a shorter Karplus-Strong delay line is inherently more metallic, so this isn't just "a lower note," it changes the timbre too; `pluck`'s `damping` dropped again, `900→650`. `perc`'s `'bonehit'` case (in `perc()` itself, not track-specific — see above) dropped from `1200Hz`/`damping:900` to `700Hz`/`damping:550`. The `organ` pad's `filterFreq` dropped `550→400`, darkening its harmonic stack further.
      - **Third pass ("add more instruments... don't use what it currently is")**: the melody and pad parts no longer reuse `pluck`/`organ` at all. Melody is now `mallet` — `opts:{dur:0.7, gain:0.15, attack:0.003, release:0.5, reverb:0.15, pan:-0.15, filterFreq:1400}` — a fast, clean struck-bar attack instead of a ringing Karplus-Strong string, which sidesteps the earlier "voices ring into a dissonant cluster" issue at its root rather than continuing to tame `pluck`'s settings; the `filterFreq:1400` lowpass additionally tames `mallet`'s brightest partial (`220Hz * 6.4 ≈ 1408Hz`, right at the cutoff). Pad is now `strings` — `opts:{dur:6, gain:0.045, attack:1.5, release:2, reverb:0.18, voices:4, detune:6, type:'triangle', filterFreq:420}` — a soft swelling unison wash instead of a single static organ chord; `type:'triangle'` (much weaker harmonics than the default `'sawtooth'`) plus the `420Hz` lowpass keep it dark, continuing the same "less high pitches" direction. `bass`/`perc` are unchanged — neither was ever the source of the earlier complaints. Still marked in-code as an attempt meant to be iterated on further from real listening, not final — the engine-level fixes (limiter, filtered reverb IR) matter more than any of these specific numbers and apply to every future track too.
  - **`ensureReverb(c)`** (private) — lazily builds and caches one shared `ConvolverNode`, fed a synthesized (not sampled) impulse response: a 1.6s stereo buffer of noise shaped by `Math.pow(1 - i/len, 2.2)` per-sample decay. **Bug fix, first-listen feedback ("ear screeching noise")**: the noise is no longer raw/full-band — a one-pole lowpass (`lp += (raw - lp) * 0.12` run once per sample as the buffer is built) darkens it first. Raw white noise has equal energy at every frequency including the top of the audible range, so convolving anything against it (especially percussive transients, like the music sequencer's `pluck`/`perc` hits) smeared into a hissy, metallic wash — a real room's reflections lose high frequencies fastest, so filtering the IR itself is what a believable algorithmic reverb needs on top of the existing time-decay envelope. That decaying, filtered-noise buffer IS the "room" being convolved against — still no audio file. Connected straight to `master` (not to any `bus` — see `routeOut` below for why that's an accepted, inaudible-in-practice imprecision for the music sequencer specifically).
  - **`routeOut(c, gainNode, opts)`** (private) — the shared output stage every primitive below ends on instead of connecting to `master` directly. `opts.pan` (-1..1) inserts a `StereoPannerNode` between the dry gain and the destination (only if `createStereoPanner` exists). `opts.reverb` (0..1) taps a separate send `GainNode` (value = `reverb * 0.35` — **lowered from `0.6`, same "ear screeching noise" bug fix**: the old multiplier let reverb get loud enough to smear into the dry signal rather than sit behind it) off the *pre-pan* gain node into `ensureReverb(c)`'s convolver, which always feeds `master` directly — sent pre-pan since reverb is meant to read as diffuse/ambient, not track the dry signal's stereo position. `opts.bus` (second engine-expansion pass) — a `GainNode` to use as the destination instead of `master` (used by the music sequencer so a whole track can fade as one unit); the reverb send still always goes to `master` regardless of `bus`, which means a track's reverb tail slightly outlives `stopMusic`'s fade — accepted as inaudible in practice since the impulse response itself only runs ~1.6s.
  - **`periodicWave(c, name)`** (private) — returns (and caches) a `PeriodicWave` built via `createPeriodicWave` for `'bell'` (inharmonic partials — non-integer multiples of the fundamental, what makes it read as metallic rather than "a wavy sine"), `'organ'` (a harmonic drawbar stack: 1/2/3/4/6/8), or `'brass'` (a dense 12-harmonic stack with gentle rolloff); returns `null` for anything else (the 4 built-in waveform names fall through to `osc.type = type` in `tone()` as before).
  - `loadMutePref()` / `saveMutePref(v)` — read/write `localStorage['nightfallMuted']` as `'1'`/`'0'`, swallowing any storage errors (private-browsing, quota).
  - `loadVolumePref()` / `saveVolumePref(v)` — read/write `localStorage['nightfallVolume']` as a `0..1` float (`Util.clamp`'d on load; `NaN` falls back to `1`).
  - `ensureCtx()` — lazily creates the `AudioContext` (`window.AudioContext || window.webkitAudioContext`; returns `null` if unsupported), wires `master` gain (initial value `muted ? 0 : BASE_VOLUME*volume`) through a **limiter** (new, bug fix — see below) to `ctx.destination`, and builds the shared `noiseBuffer`. Idempotent — returns the existing `ctx` on subsequent calls.
    - **Limiter — bug fix, first-listen feedback on the Crypt track ("ear screeching noise").** `master` no longer connects straight to `ctx.destination`; it goes through a `DynamicsCompressorNode` first (`threshold:-6dB, knee:2, ratio:20, attack:0.003, release:0.15` — a near-brickwall limiter, not a musical compressor). With several synth voices (and their reverb sends) able to sound at once — the music sequencer especially, 4 parts, sometimes overlapping — their summed amplitude could exceed 0..1 and hit a hard digital clip, which is exactly what reads as harsh/screechy rather than "loud". The limiter squashes peaks smoothly instead; every existing SFX still routes through `master` first exactly as before, so this is a pure safety net, inaudible unless something would actually have clipped.
  - `unlock()` — calls `ensureCtx()` then `resume()`s the context if `suspended`. Meant to be wired into the page's first real keydown/click handler (browsers block audio before a user gesture) — done in `main.js`/`ui.js`.
  - `suspend()` — suspends a `running` context, wrapped in try/catch. Called when the tab goes hidden (`main.js`'s `visibilitychange` handler). Never creates a context and never touches `muted`.
  - `resume()` — resumes a `suspended` context **only if not muted**, wrapped in try/catch. Counterpart to `suspend()` on tab-visible.
  - `setMuted(v)` — sets `muted`, persists it, and ramps `master.gain` to 0 or `BASE_VOLUME*volume` via `setTargetAtTime` (10 ms time-constant, avoids a click).
  - `toggleMute()` → flips `setMuted`, returns the new `muted` state.
  - `isMuted()` → current `muted`.
  - `setVolume(v)` — clamps `v` to `0..1`, persists it, and (if not muted) ramps `master.gain` to `BASE_VOLUME*volume`. `v` is expected pre-divided from a 0-100 UI slider by the caller (`main.js`'s `#volumeSlider`).
  - `getVolume()` → current `volume`.
  - `tone(freq, opts)` (private) — plays a single oscillator with attack/release gain envelope; `opts`: `type` ('sine' default — also accepts `'bell'`/`'organ'`/`'brass'`, see `periodicWave()`), `dur`, `gain`, `attack`, `release`, `detune`, `sweepTo` (exponential frequency ramp), `delay`, `filterFreq`/`filterType` (optional biquad filter inserted before the gain stage), `pan`/`reverb`/`bus` (forwarded to `routeOut()`). Schedules via `AudioContext.currentTime`-relative timestamps; auto-stops the oscillator after `dur+release+0.05`s.
  - `chord(freqs, opts)` (private) — fires several `tone()` calls staggered by `opts.stagger` (default 0.045s) starting at `opts.delay`, i.e. a quick arpeggio, for chimes/fanfares. `pan`/`reverb`/`bus` in `opts` flow through to every staggered `tone()` call via its `...rest` spread.
  - `noise(opts)` (private) — plays a random-offset slice of the shared `noiseBuffer` through a `BiquadFilterNode` (`filterFreq`/`filterType`/`filterQ`, optional `filterSweepTo`) and a gain envelope; used for whooshes/thuds/crunches/explosions. `opts.pan`/`opts.reverb`/`opts.bus` forwarded to `routeOut()`.
  - `fm(carrierFreq, opts)` (private) — FM synthesis: a carrier oscillator (`opts.carrierType`, default 'sine') has its frequency modulated by a second oscillator at `carrierFreq * opts.ratio` (default 2), through a modulation-index gain that starts at `opts.index` (default 200) and exponentially decays to 1 over `opts.dur` — bright/complex attack settling into a plainer tail, the classic FM-bell envelope shape. `opts`: `ratio`, `index`, `dur`, `gain`, `attack`, `release`, `delay`, `pan`, `reverb`, `bus`, `carrierType`. A genuinely different synthesis technique from `tone()`'s subtractive shaping — the timbre comes from the modulation ratio/index, not a waveform or filter.
  - `pluck(freq, opts)` (private) — Karplus-Strong physical modeling: a noise burst exactly one period (`1/freq`) long is fed once into a `DelayNode` tuned to that period, whose output recirculates through a lowpass "damping" filter (`opts.damping`, default 2200Hz) and a sub-unity feedback gain (`opts.decay`, default 0.988) back into the delay — every round trip both darkens and quietens the signal, matching how a real plucked string decays. `opts`: `dur`, `gain`, `damping`, `decay`, `delay`, `pan`, `reverb`, `bus`. The feedback loop has no natural stop (only the outer `outGain` exponential ramp silences it audibly), so a `setTimeout` disconnects the loop's nodes ~120ms after `dur` elapses to stop it actually processing audio in the background.
  - **`SFX`** (private) — object literal, ~50 named functions (mostly zero-arg; `stringPluck(freq)` optionally takes one) — `coin`, `coinNickel`, `coinDime`, `coinLucky`, `key`, `bombPickup`, `heart`, `heartContainer`, `itemGet`, `sack`, `battery`, `chestOpen`, `shopBuy`, `activeUse`, `meleeSwing`, `rangedShot`, `laserShot`, `enemyHit`, `crit`, `enemyDeath`, `bossDeath`, `playerHurt`, `shieldBlock`, `dodge`, `flashpowder`, `bombPlace`, `explosion`, `bombExplode`, `obstacleHit`, `obstacleDestroy`, `statusPoison`, `statusStun`, `statusFreeze`, `statusFear`, `statusCharm`, `roomClear`, `secretOpen`, `bossIntro`, `unlock`, `achievement`, `descend`, `gameOver`, `winFanfare`, `uiClick`, `uiDeny`, `machineWhiff` (Phase 6a overhaul, a soft descending `tone()` for an arcade Friendship/Tools machine's fair-gamble loss, distinct from `uiDeny`'s flat buzz), `skillPointGain`, `ascensionChime`, `stringPluck`. Each composed from one or more `tone()`/`chord()`/`noise()`/`fm()`/`pluck()` calls. This table is the single place to add or tweak a sound.
    - **`bombExplode` — new, fixes a real silent-no-op bug.** Called from `systems/familiars.js` and `systems/attackStyles.js` (charge-nova procs, familiar burst AoEs — 3 call sites) but never defined in `SFX` until this pass, so every one of those triggers had been playing nothing since whenever they were written. A tighter/punchier cousin of `explosion` (shorter `dur`/`release`) rather than a straight alias — these are short-range instant AoE bursts, not the bomb item's own slower blast.
    - **Second engine-expansion "redo every audio" pass** — every entry above was revisited. Combat-timing-critical sounds (`meleeSwing`/`rangedShot`/`laserShot`/`enemyHit`/`crit`/`playerHurt`/`shieldBlock`/`dodge`/`flashpowder`/`bombPlace`/`obstacleHit`/UI sounds) kept their exact original `dur`/`gain`/`sweepTo` timing — untouched, since these fire constantly and responsiveness can't be traded away — but 5 of them (`meleeSwing`/`rangedShot`/`laserShot`/`enemyHit`/`crit`) gained a small random stereo `pan` via a new `scatterPan(spread)` helper (`Util.rand(-spread, spread)`) so repeated hits don't all sound dead-center. Reward/fanfare-flavored sounds — fired rarely enough that a richer, slightly-longer sound reads as "special" rather than getting in the way — were re-timbred with the engine-expansion pass's new forms: `coinLucky` (FM bell instead of a sine chord), `heart`/`heartContainer` (`'bell'` periodic wave), `itemGet` (`'organ'`), `chestOpen`'s chime (`'bell'`), `bossDeath`'s chord (`'brass'`), `statusFreeze` (`'bell'`, for an icier shimmer), `roomClear`/`achievement`/`unlock`/`gameOver`/`winFanfare` (`'brass'`/`'bell'`/`'organ'` as fits each, `achievement` additionally gaining an `fm()` top note), `bossIntro` (an added low `fm()` hit under the existing sawtooth chord for extra dread). Most of these also gained a `reverb` amount (0.1-0.3) for space/weight. `winFanfare` specifically is the one sound that most wanted a literal brass-fanfare timbre, and now has one.
  - `play(name, ...args)` — no-ops if `muted`; looks up `SFX[name]`, calls it as `fn(...args)` inside a try/catch so a synth failure can never break gameplay (comment: "audio is best-effort"). Extra args forward straight to the SFX function (e.g. `Sound.play('stringPluck', 660)`), so a dynamic-pitch effect doesn't need its own bespoke `Sound.<verb>()` export. This is the primary entry point other files use (`Sound.play('coin')` etc.); see also the directly-exposed primitives (`Sound.tone`/`noise`/`fm`/`pluck`/`chord`/`bass`/`perc`) above for one-off sounds outside the named table.
  - **`startAmbient()`/`stopAmbient()`** *(post-megaupdate main-menu polish pass)* — a sustained ambient drone, distinct from every `SFX` entry above (those are all one-shot, scheduled-and-forgotten sounds; this is a long-running node graph that stays alive until explicitly stopped) and from the music sequencer above (a fixed pad, not a step sequence). `startAmbient()` is idempotent (no-ops if `ambient` is already set, so call sites never need to track "is it already running" themselves) and builds: a three-voice pad (root 55Hz sine + fifth 82.5Hz sine + soft octave 110Hz triangle — plain/consonant, deliberately not a melody) → a lowpass filter (900Hz, keeps it soft/distant) → a dedicated gain node that fades in over 3s (never a hard start) → `master` (so mute/volume affect it exactly like every SFX). A slow LFO (0.06Hz, ~16.7s per cycle) connects straight into that gain node's own `AudioParam`, additively "breathing" the pad's amplitude ±0.02 on top of whatever the fade-in ramp has it at — the standard Web Audio tremolo-via-AudioParam-modulation pattern, not a JS-side timer. `stopAmbient()` ramps the same gain to 0 over 1.2s (never a hard cut) then `.stop()`s every oscillator ~100ms later via `setTimeout`, and clears `ambient`. Wired from `main.js`: `startAmbient()` at initial page boot and inside `returnToMenu()`; `stopAmbient()` inside `startGameWithClass()` — i.e. it plays only while the main menu is the visible screen, silent (like everything else) until the first `unlock()`-triggering user gesture, and tab-hide/show already suspends/resumes it for free since it's routed through the same `ctx`/`master` as everything else. Never runs at the same time as `startMusic`'s Crypt track (`main.js`'s `startGameWithClass` calls `stopAmbient()` before a run starts; `returnToMenu()` calls both `stopMusic()` and `startAmbient()` on the way back).

**Gotchas / invariants.** No sound will actually play until a user gesture calls `Sound.unlock()` — this is a browser policy, not a bug. `suspend()`/`resume()` are the tab-visibility pair and deliberately don't touch the mute flag, so a muted player coming back from a hidden tab stays muted. Status-effect SFX (`statusPoison` etc.) are documented as "never fired for bosses" by the calling code in combat.js, not by anything in audio.js itself. Adding a new one-shot sound = add one function to `SFX` and call `Sound.play('name')`; adding a new background track = add one entry to `MUSIC_TRACKS` and call `Sound.startMusic('id')`/`Sound.stopMusic()` from wherever that context begins/ends (see `game.js`'s `startFloor` for the Crypt track's hook). No automated test can verify how any of this actually *sounds* — everything here was verified only via a Node.js Web-Audio-API stub (mocking every node/method used, asserting the graph construction and scheduling logic run without throwing across a simulated multi-loop playthrough) since this environment has no browser; a first real listen is still owed.

### entities/entities.js

**Purpose.** Defines every core game-object class: `Player`, `Enemy`, `Boss` (extends `Enemy`), `Projectile`, `Obstacle`, `Pickup`, `Chest`, `Bomb`, `Explosion`, `FloatText`, `Familiar`. These are the plain-data-plus-a-little-behavior objects that `systems/room.js` spawns, `systems/combat-*.js`/`systems/ai-*.js` update every tick, and `ui/render.js` draws. They rely on globals defined elsewhere: `CLASSES`, `TILE`, `tileToPx`, `Sound`, `Util`, `enemyHpScale`/`bossHpScale`/`bossDmgScale`, `difficultyStatMult`, `unlockAchievement`, `OBSTACLES`, `CHEST_TYPES`.

- **`class Player`**
  - `constructor(classId)` — looks up `CLASSES[classId]` and copies a large set of base stats/flags off the class def (speed, melee/ranged damage, cooldowns, `boltSpeed`, `laser`, `charged`/`chargeTime`, `crystalVolley`, `greenFireAttack`, `shockwaveAttack`, `unlimitedRange`, starting coins/keys/bombs, `redMax`/`blueCurrent`, etc.), then initializes every runtime stat (`speed`, `meleeDamage`, `rangedDamage`, `critChance`, `luck`, on-hit status chances, `tearFlags` bag `{pierce,homing,spectral,explosive}`, `multishotExtra`, `dodgeChance`, `critMultiplier`, timers, per-floor/per-room/per-run "took damage" flags, etc.) to defaults later overwritten by `recalcPlayerStats` (items.js) each time equipment changes. `baseRangeTiles` defaults to 7 (ranged) or 1 (melee) unless `def.baseRangeTiles` overrides it, and is 0 for laser classes (room-spanning, ignores range). Notable fields: `attackLayers` (item-granted secondary/tertiary attack effects, rebuilt by `recalcPlayerStats`, dispatched by `systems/attackStyles.js`), `delayedActions` (generic `{time, fn}` queue ticked in `combat.js`'s `updatePlayer`, used by echoShot), `familiars` (array of `Familiar` instances), `pillPocket`/`pill*Bonus` fields (permanent, accumulate over the run), `starPocket`/`star*Bonus`/`starSpeedMult` (room-scoped, cleared on room entry by `game.js`'s `enterRoom`).
    - **Phase 8b-uniquefx shadow fields** — `this.def` is a **direct reference** to the shared `CLASSES[classId]` object (`this.def = def;`, not a copy), so any code writing onto `player.def.*` would permanently corrupt that class for every future run/character. Any ability knob a skill-tree `uniqueField` node needs to tune must instead be shadowed as its own per-instance `Player` field, seeded from the def/hardcoded default in the constructor, and read from `player.<field>` (never `player.def.<field>`) at the call site. Two such fields exist so far: `crystalShardCount` (`def.crystalVolley ? 3 : 0` — Crystal Pony's charged-volley shard count, previously a fixed 3-element array in `combat-2.js`) and `fireZoneRootMult` (`0.25` — the Changeling's root-in-place speed multiplier while standing in her own fire zone, previously a hardcoded constant in `combat-1.js`'s `updatePlayer`). Other classes' ability params that are *already* read live via `player.def.field || fallback` (e.g. `fireZoneRadius`/`fireZoneRange`, Dragon's `chargeTime`, Changeling Queen's `changelingMinionDmg`/`maxChangelingMinions`/`changelingMinionRadius`, Windigo's `innateFreezeChance`, Gargoyle's `innateVulnerableChance`, Filly's `innateCharmChance`, Pony Bot's `damageTakenMult`, Diamond Dog's `rockCoinChance`) are safe to *read* today (no mutation happens) but are **not yet shadowed** — a future content pass that wants a skill node to bonus one of them needs to add the same shadow-field treatment first, following this exact pattern.
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
  - `constructor(type, tx, ty, floorNum)` — positions via `tileToPx`, copies `type.radius/speed/flies/behavior/color/dark` etc. HP/damage are floor- and difficulty-scaled: `hp = round(type.hp * enemyHpScale(floorNum) * stageMult * diffMult)`, `dmg = round(type.dmg * stageDamageMult(floorNum) * diffMult)`, `speed = type.speed * stageAggressionMult(floorNum)` where `diffMult = difficultyStatMult()` if that global function exists, else 1, and the `stage*` factors come from growth.js's stage-keyed difficulty layer (1.0 on stages 0-1 — see "Stage difficulty multiplier" under growth.js below). The `type` parameter is also reassigned through `stageTunedType(type, floorNum)` before `this.type = type`, so `*Cooldown` tunings the `ai-*.js` functions read off the type object are shortened on the affected stages (comment: enemy HP scaling is multiplicative so relative toughness stays constant across floors, unlike an old flat-add formula). Initializes a very large set of per-behavior state fields eagerly (never lazily) covering: generic charger/leaper/turret/splitter fields, the extended behavior set (orbiter/burrower/summoner/healer/sniper/swarm/ambusher/teleporter/shielder/lobber/weaver/sentry — driven by `systems/ai-*.js`), the extended regular-boss set (bonecaller/gravechorus/rotbloom/antlerwarden/glassscorpion/duneravager/furnaceheart/slagbound), and the DNB superboss set (plapper/clapper/nhm/vanilladnb/onetruednb). The comments stress this eager-init is deliberate: any lazily-initialized timer would `NaN` on its first `-= dt` and freeze that boss's fight. This is also why Phase 2's two new regular-enemy behaviors (`skirmisher`/`whiplash`, see `systems/ai-2.js`) needed **no** new fields here at all — they read off `fireTimer`/`attackTimer`/`telegraph`, all three already eagerly initialized generically above. Also initializes status-effect timers — now **6**, not 5: poison/stun/freeze/fear/charm plus `vulnerableTimer` (Phase 1 overhaul's "Vulnerable" status, see the dedicated note below) — never applied to bosses per combat.js.
  - `takeDamage(amount, kx, ky)` — no-ops (`return false`) if `this.shielded`; otherwise, if `vulnerableTimer > 0`, multiplies `amount` by 1.5 first (the Vulnerable status's whole effect lives in this one line); then subtracts `hp`, sets `hitFlash = 0.15`, accumulates knockback into `knockX/knockY`, sets `isDead` if `hp<=0`, returns `true`. Called throughout `systems/combat-*.js`.
  - Instantiated in `systems/ai-1..4.js`, `systems/combat-2/3/4.js`, and `systems/room.js` (initial spawn).
- **`class Boss extends Enemy`**
  - `constructor(type, tx, ty, floorNum)` — calls `super(...)` then overwrites `hp`/`maxHp` using `bossHpScale(floorNum)` (a gentler curve than the plain-enemy one) **times `stageDifficultyMult(floorNum)`**, re-derived here because `super()` already discarded the enemy-curve `hp` — bosses climb in lockstep with trash — and `dmg` using `bossDmgScale(floorNum)` (no stage factor: the 4-heart cap in `playerDamageAmount` already swallows it), both re-applying `difficultyStatMult()` (thrown away from the parent's enemy-curve computation). Re-seeds `prevHp = this.hp` (read by `ai.js`'s `aiBossSlagbound` as a hit signal — must reflect the boss curve, not the discarded enemy curve). Sets `isBoss=true`, boss-specific timers (`attackTimer`, `pattern`, `minionsSpawned`, dash/telegraph state), and always starts `shielded=false`, `enraged=false`.
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
- **Phase 8e slice 2/4** appends 25 more `locked:true` trinkets, every id prefixed `sk8t_` (e.g. `sk8t_ironclasp`) — the same parallel-slice namespacing convention as the sibling `sk8s_`/`sk8f_`/`sk8i_` batches (stars/familiars/items). Unlike every earlier locked batch, these are unlocked one-for-one by leaf nodes under `unlock_trinkets_hub` in the new `achievements/skilltree-unlocks-trinkets.js` (spending a skill point flips `unlocks.unlockedTrinkets[id]` directly via `applySkillTreeUnlockEffect`), not an achievement ladder or a superboss reward roll. Mostly single-slot stat trade-offs (speed, damage, fire rate, range, crit, luck, dodge, magnet, bomb radius, pierce, multishot, lifesteal, flat venom/freeze chance, shop discount) wired into `items-1.js`'s `recalcPlayerStats`; a handful touch `combat-2.js` (coin value, an on-kill bomb-drop chance, an extra-bomb pickup) or `familiars.js` (familiar attack-rate speedup) instead. See that file's own `### achievements/skilltree-unlocks-trinkets.js` entry below for the full list/topology.
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
- **Phase 8e slice 3/4 — 25 `sk8f_`-prefixed familiars** (end of
  `familiars-1.js`): 4 orbiter / 4 shooter / 3 proc / 2 blocker / 2 thief /
  2 grower / 2 detonator / 2 mirror / 2 scavenger / 1 berserker / 1 swarmer.
  Every id is prefixed `sk8f_` (this slice's collision-safety convention,
  used because three sibling Phase 8e slices — stars/trinkets/items — were
  minting content in parallel). Pure data, no new `behavior` string. Each
  is `locked:true` and gated behind its own leaf node in the new
  `achievements/skilltree-unlocks-familiars.js` (see that file's own
  section below). Verification harness + full id/behavior/flavor list:
  `feature-research/phase8-metaprogression/audit-skilltree-unlocks-familiars.md`.
- **Phase 8e slice 4/4** appends a fourth, final locked batch to `data/items-5.js`: 25 items, every id prefixed `sk8i_` (e.g. `sk8i_glassmarble`) — the same collision-safety convention as the sibling stars/trinkets/familiars slices, since all four ran in parallel. Mostly ordinary quality-1..3 single-stat passives (damage, speed, luck, pierce, fire rate, range, magnet radius, lifesteal/freeze/venom/charm/on-kill-heal chance, crit chance/multiplier, bomb radius, multishot, dodge, heart containers), plus 5 that reuse an existing `attackLayer` style (`knockbackPulse`/`impactBurst`/`echoShot`/`ricochetBolt`/`onKillFragments`). `locked:true`, gated one-for-one behind leaf nodes under `unlock_items_hub` in the new `achievements/skilltree-unlocks-items.js` (not by an achievement ladder). See `js/systems/items-1.js`'s `recalcPlayerStats` for the stat wiring and that file's own CODE_REFERENCE section below for the skill-tree side.

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

**Phase 8e** appends a fourth, final locked batch: 25 stars, every id prefixed `sk8s_` (e.g. `sk8s_pyrrha`) — a namespacing convention adopted because this content slice ran in parallel with three sibling slices minting trinkets/familiars/items at the same time, and the prefix rules out any id collision between them without coordination. Unlike every earlier locked batch, these are unlocked one-for-one by leaf nodes under `unlock_stars_hub` in the new `achievements/skilltree-unlocks-stars.js` (spending a skill point flips `unlocks.unlockedStars[id]` directly via `applySkillTreeUnlockEffect`), not by an achievement ladder or a superboss reward roll. Effects span damage buffs, healing (red/blue/full), room-wide status effects (freeze/poison/fear/charm), a single-target percentage-of-current-HP strike, a knockback nova, permanent run-wide luck/range grants, active-item recharge, map reveal, object destruction, and several "drop N pickups" spawns — every one reusing a mechanism `applyStarEffect` already had. See `stars.js`'s `case 'sk8s_...'` block for the 25 implementations.

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

**`ROOM_MUSIC_TRACKS`** — room-type id → `audio.js` `MUSIC_TRACKS` id, the
room-scoped equivalent of `stages.js`'s `STAGE_MUSIC_TRACKS`, read by
game.js's `enterRoom`. Several room types deliberately share one track:
`{ boss:'bossroom', crystal:'crystalroom', shrine:'crystalroom',
sombra:'sombraroom', curse:'sombraroom', treasure:'treasureroom',
secret:'secretroom', sacrifice:'secretroom', shop:'shoproom',
petshop:'shoproom' }`. Any room type with no entry (normal, start, vault,
challenge, star, the two gate rooms, arcade) leaves the floor's own track
playing uninterrupted.

No functions.

### data/stages.js — floor themes and the branch/C-path palette system

**`STAGES`** — array of 4 theme objects `{id, name, palette:{floorA,
floorB, wall, voidC, doorOpen, doorLocked, grout, accent}}` covering the
normal run's first 8 floors two-at-a-time: crypt, forest, desert, inferno.

**`STAGE_MUSIC_TRACKS`** — every `STAGES` entry now maps to a track: `{ crypt:'crypt', forest:'forest', desert:'desert', inferno:'inferno', frozendesert:'frozendesert', badlands:'badlands', beach:'beach', ocean:'ocean', seafloor:'seafloor', trench:'trench', trenchdepths:'trenchdepths', deepdark:'deepdark', metarealm:'metarealm', hyperspace:'hyperspace' }`. Maps a
`STAGES`/`STAGE_LIST` stage id to an `audio.js` `MUSIC_TRACKS` id, read by
`game.js`'s `startFloor`. A deliberately separate small table rather than a
`music` field on `STAGES` itself — most stages don't have a track yet, and
this keeps "no track for this stage" (falls through to `Sound.stopMusic()`)
a plain missing-key lookup instead of every `STAGES` entry needing an
explicit `music:null`. Extend this as each stage gets a track.

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
- `C_MUSIC_TRACKS`/`cMusicTrackFor(floorNum)` — the audio equivalent of
  `C_PALETTES`/`cPaletteFor` right above: same four region names
  (`gutters`/`sewers`/`rainforest`/`mangroves`), same floorNum split, each
  mapping to the identically-named `audio.js` `MUSIC_TRACKS` entry. Kept as
  its own small lookup rather than folded into `C_PALETTES`, mirroring why
  `STAGE_MUSIC_TRACKS` is separate from `STAGES`. Read by game.js's
  `startFloor` whenever `floorPath === 'C'`.
- `dPaletteFor(floorNum)` *(Phase 7a)* — the D-branch mirror: floorNum ≤4 →
  observatory, ≤6 → orrery, else → voidbetween.
- `D_MUSIC_TRACKS`/`dMusicTrackFor(floorNum)` — the audio equivalent of
  `D_PALETTES`/`dPaletteFor` right above, same shape as
  `C_MUSIC_TRACKS`/`cMusicTrackFor`: same three region names
  (`observatory`/`orrery`/`voidbetween`), same floorNum split, each
  mapping to the identically-named `audio.js` `MUSIC_TRACKS` entry. Read
  by game.js's `startFloor` whenever `floorPath === 'D'`.

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

#### Stage difficulty multiplier (Phase 10 rebalance) — a second, stage-keyed layer

The curves above are smooth and content-blind: they know a floor number, not which *stage* you
are standing in. The stage layer added on top exists so the back half of the game is harder than
its authored numbers alone imply, making the expanded skill tree necessary rather than optional.
It is a pure multiplier layer — **no** enemy/boss/superboss table entry was edited, so it stays
one central knob.

- **`STAGE_DIFFICULTY_HP`** — the curve itself, indexed by `stages.js`'s
  `stageIndexForFloor(floorNum)`:

  | stage | content | multiplier |
  |---|---|---|
  | 0 | Crypt (floors 0-1) | **1.00** — hard constraint, early game untouched |
  | 1 | Forest (floors 2-3) | **1.00** — hard constraint, early game untouched |
  | 2 | Desert (floors 4-5) | 1.18 |
  | 3 | Inferno + every branch floor (6-14, the clamp) | 1.30 |
  | 4-13 | the Phase 10 stages (floors 15-34) | 1.34 → 1.70, **+0.04 per stage** |

  The legacy stages 2-3 take the real step because they were authored against a much shorter run.
  Stages 4+ get only +4%/stage: their authored stats already escalate steeply *and* sit on
  `enemyHpScale`/`bossHpScale` (~1.20^30 / ~1.36^30 down there), so a big multiplier there would
  be slapstick rather than difficulty.
- **`stageDifficultyMult(floorNum)`** — looks the curve up; returns exactly `1` for stage index
  &lt; 2, and clamps past the end of the table. Guarded with `typeof stageIndexForFloor === 'function'`
  because `index.html` loads growth.js *before* stages.js (irrelevant at call time, but it means a
  future load-order change degrades to "no multiplier" instead of throwing mid-spawn).
- **`stageAggressionMult(floorNum)`** — `1 + (mult - 1) * STAGE_AGGRESSION_SHARE` where the share
  is **0.35**. Aggression is far more punishing per point than HP, so it takes a share, not the
  whole thing (stage 3 → +10.5% speed, stage 13 → +24.5%).
- **`stageDamageMult(floorNum)`** — `1 + (mult - 1) * STAGE_DAMAGE_SHARE`, share **0.5**. Trash
  `dmg` only. Boss `dmg` is deliberately left alone: `combat-1.js`'s `playerDamageAmount` hard-caps
  any single hit at 4 hearts and `bossDmgScale` alone is already far past that cap by the Inferno,
  so points added there would just be discarded.
- **`stageTunedType(type, floorNum)`** — the AI functions read cooldown tunings straight off the
  shared type object (`t.fireCooldown || 1.5`, in a few hundred places across `ai-*.js`), so the
  only non-invasive way to speed a stage's roster up is to hand the spawned entity a retuned
  **copy** of its type. Shallow copy, every own key preserved, only numeric keys whose name ends
  in `Cooldown` divided by the aggression multiplier (this includes `contactCooldown`, which
  `combat-3.js`'s `updateEnemy` re-arms from `e.type`, so contact re-hit rate speeds up too).
  When the multiplier is exactly 1 it returns the **original object by reference**, so stages 0-1
  allocate nothing and cannot drift by even a float.

Call sites (all in `entities/entities.js`): the `Enemy` constructor computes `stageMult` /
`stageAggro`, reassigns its `type` parameter through `stageTunedType` *before* `this.type = type`,
folds `stageMult` into the `hp` product, `stageDamageMult` into `dmg`, and `stageAggro` into
`speed`. The `Boss` constructor re-derives `stageDifficultyMult` (its `super()` call already threw
away the enemy-curve `hp`) and folds it into the boss `hp` product, so bosses climb in lockstep
with trash; its `speed` and `*Cooldown` fields were already tuned by `super()`.

This composes as a plain extra factor alongside `main.js`'s `difficultyStatMult`
(easy 0.75 / normal 1 / hard 1.5) — the two multiply, neither replaces the other.

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

### achievements/defs-1.js through defs-12.js — the achievement definitions

Treat these twelve files (plus `defs-mastery.js`, added in Phase 9 — see below) as one logical unit: sequential `addAchievement(def)` / `addTierSet(spec)` calls executed at load time, each appending to `ACHIEVEMENTS` (1712 entries total as of Phase 9's Slayer-category removal; was 2807 as of Phase 7h's Void Between PART 2 sub-batch — see the Phase 9 note below for the delta). The split across files is purely mechanical (file size), not thematic — e.g. `defs-1.js` covers character unlocks, superbosses, completionist, and most of the original "Miscellaneous" batch, while later files add "Mastery"/"Exploration"/"Collection"/"Challenge"/"Stars" content layered on in later passes (the historical batch write-ups below still describe their content as "Slayer" since that was its category at the time — it has since been migrated to `Mastery`/deleted, see the Phase 9 note); `addTierSet` usage is concentrated in `defs-3.js` (125 calls, now fewer post-Phase-9-deletion), `defs-4.js` (133), `defs-5.js` (34), `defs-6.js` (4: `shrine_visits` from Phase 3 overhaul, plus Phase 4 overhaul's `arcade_visits`), `defs-7.js` (20 — see the Phase 7f subsection below), `defs-8.js` (33 — see the Phase 7g subsection below), `defs-9.js` (66 — see the Phase 7h Observatory subsection below), `defs-10.js` (66 — see the Phase 7h Orrery subsection below), `defs-11.js` (33 — see the Phase 7h Void Between PART 1 subsection below), and `defs-12.js` (66 — see the Phase 7h Void Between PART 2 subsection below), while `defs-1.js`/`defs-2.js` use plain `addAchievement` only. (Call counts above are the ORIGINAL as-authored counts from each phase's own batch — several of those files lost their `category:'Slayer'` calls in Phase 9; see the Phase 9 note for exact per-file deletion counts.)

**Distinct `category` values found** (grep for `category:`): `Characters`, `Superbosses`, `Completionist`, `Mastery`, `Exploration`, `Collection`, `Challenge`, `Donations`, `Stars`, `Miscellaneous`. (`ACHIEVEMENT_CATEGORY_ORDER` in `logic.js` lists all of these except `Stars`, which — like any category not in that list — still renders, appended after the listed ones by `buildAchievementsPanel`'s "leftovers" pass. `Slayer` was removed in Phase 9 — see below.)

#### Phase 9 — Slayer category removed, real rewards migrated to Mastery

The `'Slayer'` achievement category (every `category:'Slayer'` `addAchievement`/`addTierSet` call across `defs-2.js` through `defs-12.js`, 805 source statements expanding to **1679** real `ACHIEVEMENTS` entries post-tier-expansion) was deleted outright. Of those 1679:

- **1095 were TROPHY-reward** (an `itemId` matching one of the naming patterns `slayertrophy_*`, `hcfwtrophy_*`, `mgtrophy_*`, `obstrophy_slayer_*`, `ortrophy_slayer_*`, `vbtrophy_slayer_*`, `vbtrophy2_slayer_*` — but note these prefix families are ALSO used by other still-live categories, e.g. `hcfwtrophy_challenge_*`/`hcfwtrophy_exploration_*` belong to `'Challenge'`/`'Exploration'`, not `'Slayer'`; only the 1095 ids actually granted by a Slayer achievement were touched, confirmed via a real classification scan, not by pattern-matching alone). All 1095 trophy item defs were deleted from `js/data/items-2.js`–`items-5.js` (each was exclusively referenced by a Slayer achievement, verified before deletion), and their now-dead `(p.<trophyId> || 0)` terms (1132 occurrences, since a few ids appeared in more than one `recalcPlayerStats` formula line) were stripped from `js/systems/items-1.js`'s luck formula, including orphaned "trophy batch" header comments left with no code beneath them.
- **584 were REAL-reward** (`itemId` of a genuine functional item / `trinketId` / `familiarId` / `enemyId` / `pillColorId` — no `starId`/`pickupKind`/`classId`/`shopDiscount` rewards were found among Slayer's real entries). Every one of these was migrated 1:1 into a brand-new `js/achievements/defs-mastery.js` file, under a new `category:'Mastery'`, with an identical trigger (`bestiarySection:'enemyKills'`, same `bestiaryId`, same `threshold` — every real Slayer entry turned out to be a per-enemy bestiary kill-count ladder, no `statKey`/distinct-breadth entries among them) and identical reward field/value. Ids transform `slayer_<x>_t<n>` → `mastery_<x>_t<n>` (a straight `id.replace(/^slayer/, 'mastery')`, unique/collision-free against the pre-existing `Mastery` entries); names transform `'... Hunter ...'` → `'... Mastery ...'`; icons remap `💀`→`🎖️`, `👹`→`🔬`, `👑`→`🏵️`. `defs-mastery.js`'s `<script>` tag sits in `index.html` right after `defs-12.js` and before `bestiary-tiers.js`.
- **0 were unclassifiable** — every Slayer entry's reward field was one of `itemId`/`trinketId`/`familiarId`/`enemyId`/`pillColorId`.

`'Mastery'` was already a real, non-empty category before this change (20 source statements / 52 expanded entries, pre-existing from an earlier phase, using `masterytrophy_*`/`explorationtrophy_*` reward items that are NOT part of the Slayer trophy-deletion set and were left untouched) — the migrated 584 land alongside those, for **636** total `Mastery` entries. `ACHIEVEMENT_CATEGORY_ORDER` in `logic.js` had `'Slayer'` removed (it no longer needs a reserved slot — `'Mastery'` is no longer "reserved and empty" either, now that it holds real content).

**`ACHIEVEMENTS.length`: 2807 → 1712** (delta **-1095**, exactly the trophy-only count — the 584 real entries were migrated, not net-removed, so the whole delta is trophy deletions: -1679 Slayer entries +584 new Mastery entries = -1095).

Full classification-script output, verification-harness output (including the mandatory "every real Slayer reward still granted somewhere" regression check — zero missing), and the file-by-file diff summary live in `feature-research/phase9-megaupdates/audit-remove-slayer.md`.

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
  - `skillPoints` — grants a flat one-time bonus of that many skill points straight into `unlocks.skillTree.points`/`lifetimeEarned`; used only by the four donation milestones past 1000c (`donation_2000`/`3000`/`4000`/`5000` in `defs-1.js`), once every `shopDiscount` kind is already spoken for.
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

#### Phase 7h (cont.) — The Void Between, PART 2 (floorKeys `'9D'`/`'10D'` + `singularity`) D-branch achievement batch (`defs-12.js`)

New file, loaded after `defs-11.js` and before `logic.js`. 180 achievements across 4 categories, covering the FOURTH and final sub-batch of Phase 7's D-branch allocation — the second half of The Void Between: floorKey `'9D'` (floorNum 8, guttering embers and dying light) and floorKey `'10D'` (floorNum 9, the event horizon and total collapse), 33-entry themed enemy rosters on EACH floorKey (66 total, accent `#9ab8ff`), plus the D-branch finale superboss `singularity` ("The Singularity", hp 79, reuses `bossSlagbound` AI, icon 🌌) which lives on `'10D'`. Structurally this is defs-10.js's Orrery shape (2 floorKeys + 1 superboss = 180), NOT defs-11.js's smaller single-floorKey PART 1 shape. Does **not** touch the pre-existing `sb_singularity_<class>` superboss grid (`defs-1.js`'s `SUPERBOSS_REWARDS` loop — those 25 achievements are auto-generated from `SUPERBOSSES` and already reward-wired), and does not touch PART 1's `'8D'` content. All new ids/names carry a `voidbetween2` infix and a `vbtrophy2_` trophy prefix, and the Collection checker is a distinct `checkVoidBetween2Collection`/`VOIDBETWEEN2_WATCH_IDS` pair, so the two companion Void Between batches can never collide. Full breakdown and verification trail: `feature-research/phase7h-dbranch-achievements/audit-voidbetween-2.md`.

- **Reward-economy**: `shopDiscount`/`pillColorId`/`enemyId` reward pools re-confirmed exhausted (12/12 shop kinds, 40/40 pill colors, 60/60 locked enemies — same finding as every prior Phase 7f/7g/7h batch). 160 freshly-minted single-purpose `vbtrophy2_*` trophy items (`items-5.js`) for the Slayer/Challenge/Exploration/Collection bulk, plus 20 freshly-minted capstone pickups — 6 trinkets in `trinkets-2.js` (`pendingReward:true`, skipped by `SUPERBOSS_REWARDS`'s `TRINKET_LIST.filter` sweep), 10 items in `items-5.js`, 4 `familiars-2.js` orbiter familiars — for ladder-capstone/Collection-grand/hardest-Challenge rungs. All 180 wired into real effects: 160 trophies round-robin across the same five `recalcPlayerStats` channels earlier D-branch batches used (luck/speed/meleeDamage/rangedDamage/fire-rate, 32 each); the 20 capstones land in whichever channel matches their flavor text (`+1 all attacks` in melee+ranged for `emberhuskcore`/`nullblinkanchor`/`horizonhuskcore`/`eventblinkanchor`/`emberchronometer`/`eventchronometer`/`lastlightheart`/`eventhorizonheart`/`collapsedmoment`, `+1 heart container` via two new `items-2.js` `applyPassiveEffect` chain entries for `darkwardenplating`/`horizonwardenplating`, flat stun chance for `nullsummonschit`/`eventsummonschit`, fire-rate for `hollowstalkerveil`/`silentstalkerveil`, shop discount for `emptyeventpurse`; the two sniper-flagship familiars `nightmarksmandrone`/`gravmarksmandrone` and the two wisps `horizonwisp`/`singularitywisp` carry their own `dmg`/`orbitSpeed`/`radius`/`contactCooldown` fields like every other familiar and need no `recalcPlayerStats` entry) — none inert.
- **Slayer (144 achievements, 66 `addTierSet` calls)**: 2-tier ladders (10/40) for all 66 roster entries across both floorKeys (33 `'9D'` + 33 `'10D'`); 12 flagship enemies (6 per floorKey, one per distinct AI behavior family — splitter/summoner/shielder/sniper/teleporter/ambusher: `fadinghusk`/`nullcaller`/`darkwarden`/`nightmarksman`/`nullblink`/`hollowstalker` on `'9D'`, `horizonhusk`/`eventcaller`/`horizonwarden`/`gravmarksman`/`eventblink`/`silentstalker` on `'10D'`) get a 3rd tier (threshold 100) granting a unique capstone reward instead of another trophy.
- **Challenge (8 achievements, hand-wired Predicate D)**: `challenge_voidbetween2_flawless`/`_floor_nodamage`/`_onehearted`/`_speedkill`/`_frugal`/`_untouched_run` (all in a new `superbossId === 'singularity'` block in `onBossDefeated()`, mirroring the `astrolabe`/`orrery` blocks and reusing existing `tookDamageThisBossRoom`/`tookDamageThisFloor`/`tookDamageThisRun`/`redMax`/`visitedShopThisRun` — no new stat) plus `challenge_voidbetween2_9d_speedrun`/`_10d_speedrun` (floorNum 8/9 `startFloor()` checks reusing `game.runElapsed`, mirroring every prior D-branch batch's speedrun checkpoints).
- **Exploration (21 achievements)**: `exploration_reach_9d`/`_10d` (floorNum 8/9 hooks in `startFloor()`), `exploration_meet_singularity`, plus 18 Predicate-B "First Sight" achievements (`bestiarySection:'enemyKills'`, `threshold:1`) over a representative slice of both rosters (9 per floorKey).
- **Collection (7 achievements)**: `collection_voidbetween2_9d_t1`/`_t2`/`_t3` (11/22/33 of the `'9D'` roster) and the mirrored `_10d_t1`/`_t2`/`_t3` for `'10D'`, plus `collection_voidbetween2_grand` (all 66 + `singularity` = 67) — backed by a new bespoke `checkVoidBetween2Collection(game)` function (declared in `defs-12.js`, hooked into `combat-2.js`'s `handleEnemyDeath` via a `VOIDBETWEEN2_WATCH_IDS` `Set` added right beside — never replacing — PART 1's `VOIDBETWEEN_WATCH_IDS` check), reading the existing `unlocks.bestiary.enemyKills` bucket — no new stat, exact mirror of Phase 7h Observatory/Orrery's collection-checker pattern.
- **Verified** (same Node-harness + functional-smoke-test methodology as Phase 7f/7g/7h Observatory/Orrery/Void Between PART 1): `ACHIEVEMENTS.length` 2627 → 2807 (delta 180, exact — 144 Slayer + 8 Challenge + 21 Exploration + 7 Collection); `node --check` clean on every touched file and on a full repo-wide sweep; zero duplicate `id`s across the full array; zero *new* reward-target collisions (the only collision found, `itemId:championscrown` shared by all 25 `completionist_<class>` achievements, predates this batch); all 180 new minted pickups (160 trophies + 20 capstones) each referenced by exactly one achievement; none of the 6 new trinkets appear in `SUPERBOSS_REWARDS`'s consumed set; every reward-target id referenced in `defs-12.js` cross-checked against its data-table definition — zero dangling references; functional smoke test confirmed a real kill sequence unlocking a Slayer rung (`slayer_starvedhound_t1`) and a Collection breadth tier (`collection_voidbetween2_9d_t1`), a direct `challenge_voidbetween2_flawless` unlock granting its `collapsedmoment` trinket, and `recalcPlayerStats`/`applyPassiveEffect` correctly applying a trophy's luck bonus (0 → 1), a `+1 all attacks` item capstone (`emberhuskcore`: melee 2 → 3, ranged 0.5 → 1), and both heart-container capstones' actual `redMax` increase (6 → 7) — all independently verified against a live `Player` instance.

**Phase 7h is now complete** — all D-branch achievement batches (Observatory, Orrery, Void Between
PARTs 1 and 2) are done, closing out Phase 7's achievement backfill.

### achievements/bestiary-tiers.js

*(Phase 8a — the bestiary-tiers foundation of the Phase 8 meta-progression overhaul. `unlocks.skillTree.points` accumulates correctly here; the engine and panel that *spend* it were added in Phase 8b — see `achievements/skilltree.js` below. Full write-up: `feature-research/phase8-metaprogression/audit-bestiary-tiers.md` (8a) and `audit-skilltree-scaffold.md` (8b).)*

New file, loaded immediately before `achievements/logic.js` in `index.html`'s script list (it has no dependencies of its own — `logic.js` is what calls into it). The premise: every individual bestiary entry — each specific enemy, item, star, room type, … — carries its own 4-rung mastery ladder thresholded against how many times *that one id* has been killed/collected/visited, and crossing a rung pays 1 skill point.

- **`BESTIARY_TIER_THRESHOLDS`** — `{category: [copper, silver, gold, platinum]}`, twelve categories, each four ascending integers. `enemy` `[50,250,1000,5000]` (957 ids), `boss` `[10,40,150,500]` (64), `superboss` `[1,5,15,50]` (22), `item`/`trinket`/`familiar`/`star`/`pill`/`roomtype` all `[3,10,30,100]` (1934/607/401/73/200/18), `object` `[5,20,75,250]` (32), `pickup` `[10,40,150,500]` (22), `stage` `[1,3,10,30]` (22). The keys are *tier categories*, not `unlocks.bestiary` bucket names — one bucket can feed several categories (`enemyKills` splits three ways by data table), and the bucket→category mapping lives in `logic.js` (`_BESTIARY_SEEN_TIER_MAP`, `bestiaryTierCategoryForEnemy`), not here.
- **`BESTIARY_TIER_NAMES`** — `['copper','silver','gold','platinum']`; index 0-3 corresponds to tier 1-4, since tier 0 means "unranked" and draws nothing at all.
- **`BESTIARY_TIER_ICONS`** / **`BESTIARY_TIER_COLORS`** — `{copper:'🟠', silver:'⚪', gold:'🟡', platinum:'💠'}` and `{copper:'#b87333', silver:'#c0c0c0', gold:'#ffd700', platinum:'#e5e4e2'}`, both keyed by tier *name*. Read only by `ui/bestiary.js`'s row badge.
- **`bestiaryTierFor(category, count)`** — walks that category's ladder and returns 0-4 (0 = no tier yet). An unknown category returns 0, so passing a bucket that has no ladder (`enemyDeaths`, `objectsSeen`) is a silent no-op rather than a crash.
- **`bestiaryTierName(tier)` / `bestiaryTierLabel(tier)`** — display helpers: the lowercase name (or `null` at tier 0), and the capitalised `'Platinum tier'` string used as the badge's `title` tooltip (empty string at tier 0).

### achievements/logic.js

- **`ACHIEVEMENTS_BY_ID`** — plain object, `{id: def}`, built by `indexAchievement`.
- **`_ACHV_BY_STATKEY`** (Map: `statKey -> [def,...]`), **`_ACHV_BY_BESTIARY_ID`** (Map: `'section/id' -> [def,...]`, per-id count predicates only), **`_ACHV_BY_BESTIARY_SECTION`** (Map: `section -> [def,...]`, distinct-breadth predicates only), **`_ACHV_BY_CATEGORY`** (Map: `category -> [def,...]`, panel grouping) — the four lookup indexes that replace a linear scan of all ~1709 defs on every gameplay event.
- **`_indexPush(map, key, def)`** — helper: appends `def` to `map.get(key)`, creating the array on first use.
- **`indexAchievement(def)`** — populates all four structures for one def: always sets `ACHIEVEMENTS_BY_ID[def.id]`; pushes into `_ACHV_BY_STATKEY` if `def.statKey`; if `def.bestiarySection`, pushes into `_ACHV_BY_BESTIARY_ID` (keyed `section+'/'+bestiaryId`) when both `bestiaryId` and `threshold` are set, and/or into `_ACHV_BY_BESTIARY_SECTION` when `distinctThreshold` is set; always pushes into `_ACHV_BY_CATEGORY` keyed by `def.category || 'Miscellaneous'`. A top-level `for (const a of ACHIEVEMENTS) indexAchievement(a);` runs this over every def already pushed by `defs-1..6.js`, then `_achvIndexReady = true;` flips the flag so any *later* `addAchievement` call (there are none after this point in the normal load order, but the mechanism is generic) indexes itself immediately instead of waiting for a rebuild.
- **`ensureUnlockShape(unlocks)`** — the full localStorage save-shape definition; called on every read (`currentUnlocks`, `beginRunUnlocks`) and every write (`unlockAchievement`, `bumpStat`, etc.), so an old save missing any of these keys gets them filled in on first touch, migration-free. It ensures: `unlocks.achievements`, `.unlockedItems`, `.unlockedPickups`, `.unlockedTrinkets`, `.unlockedFamiliars`, `.unlockedStars`, `.unlockedPillColors`, `.unlockedEnemies`, `.winsByClass`, `.donationDiscounts` all default to `{}`; `unlocks.bestiary` defaults to `{}` and within it: `enemyKills`, `enemyDeaths` (both `{id:count}`), `objectsSeen`, `objectsDestroyed`, `seenItems`, `seenTrinkets`, `seenFamiliars`, `seenStars`, `seenPills`, `seenPickupKinds`, `seenRoomTypes`, `seenStages` (mostly `{id:true}` "seen" sets, a couple counts) each default to `{}`. It then merges `unlocks.stats` against a large `statDefaults` object via `Object.assign({}, statDefaults, unlocks.stats || {})` (existing progress is preserved, new counters default to 0/null) — the full counter list includes `secretRoomsFound`, `chestsOpened`, `rocksBombed`, `coinsSpent`, `cursedChestsOpened`, `enemiesKilled`, `bossesKilled`, `coinsCollected`, `goldChestsOpened`, `stoneChestsOpened`, `obstaclesDestroyed`, `bombsPlaced`, `shotsFired`, `critsLanded`, `itemsCollected`, `trinketsEquipped`, `familiarsCollected`, `deaths`, `wins`, `roomsCleared`, `shopPurchases`, `activeItemUses`, `meleeKills`, `rangedKills`, `donationTotal`, `pillsUsed`, `keysUsed`, `starsUsed`, `petshopsVisited`, `curseRoomsVisited`, `sacrificeSpikesTriggered`, `vaultsOpened`, `challengeRoomsCompleted`, `crystalRoomsVisited`, `sombraDealsTaken`, `swarmerdnbKilled`, `turretsDestroyed`, `bombBarrelsDetonated`, `treasureRoomsVisited`, `shopRoomsVisited`, `secretRoomsVisited`, `sacrificeRoomsVisited`, `vaultRoomsVisited`, `challengeRoomsVisited`, `sombraRoomsVisited`, `starRoomsVisited`, `shrineRoomsVisited` (Phase 3 overhaul — bumped in `game.js`'s `enterRoom`, same first-visit chain as the other `*RoomsVisited` counters, backing the `shrine_visits` `addTierSet` ladder in `defs-6.js`), `arcadeRoomsVisited` (Phase 4 overhaul — same chain, backing `arcade_visits` in `defs-6.js`), `rerollAltarUses`, `cBranchFloorsVisited`, `cBranchRunsCompleted`, `dBranchFloorsVisited`/`dBranchRunsCompleted` (Phase 7a — exact mirrors of the two C-branch counters, bumped from the same two places: `startFloor`'s `floorPath === 'D'` block once per D floor entered, and `descend`'s single `floorNum >= D_LAST_FLOORNUM` win branch once per won D run), `enemiesFrozen`, `enemiesMarkedVulnerable` (Phase 1 overhaul — the Gargoyle's `unlock_gargoyle` achievement counter, bumped alongside every Vulnerable-marking roll: `applyOnHitStatuses`, the `markedForDeath` attack-layer style), `runsStarted`, `totalPlaytime`, plus two "best of" (max/min, not additive) records `deepestFloor` (default 0) and `fastestWinSeconds` (default `null`). Finally it one-time-migrates a legacy top-level `unlocks.donationTotal` field into `unlocks.stats.donationTotal` (taking the max of the two) and deletes the old field. Returns the (mutated in place) `unlocks` object. **Phase 8a** extends the `unlocks.bestiary` block with eight parallel COUNT buckets — `itemsCollectedCount`, `trinketsEquippedCount`, `familiarsCollectedCount`, `starsUsedCount`, `pillsDrunkCount`, `pickupKindsCollectedCount`, `roomTypesVisitedCount`, `stagesVisitedCount`, all `{id:count}`, each mirroring the same-named boolean `seenX` set above it (the boolean set stays authoritative for "discovered"; the count exists solely to threshold the tier ladders, since a `{id:true}` set can't express "collected this 30 times") — plus `bestiary.tiersAwarded` (`{'category/id': highestTierPaidOut 0-4}`, the ledger that stops a rung paying its skill point twice) and a new top-level `unlocks.skillTree = { points:0, spent:{}, unlockedNodes:{} }`, whose three fields are each individually backfilled so a partially-written `skillTree` can't yield `undefined.points`. Note `objectsSeen` deliberately gets *no* count mirror — `objectsDestroyed` already covers the tiered case for obstacles — and neither does `enemyDeaths`.
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
- **`awardDonationSkillPoints(game)`** — the every-25c donation skill-point drip, independent of `bumpStat`'s threshold watchers. `eligible = floor(unlocks.stats.donationTotal / DONATION_SKILL_POINT_INTERVAL)`; pays `eligible - unlocks.stats.donationSkillPointsAwarded` points into `unlocks.skillTree.points`/`lifetimeEarned`, updates the awarded counter, saves, and (if `gained > 0`) toasts. Called from `shop.js`'s `tryDonateMachine` right after `bumpStat('donationTotal', ...)`. `game` optional, used only for the toast.
- **`setStatMax(key, value)` / `setStatMin(key, value)`** — "best of" records that only ever move in one direction (not additive, unlike `bumpStat`). Each loads storage, and only if `value` improves on the stored one does it write+save and return `true` (so callers — `game.js`'s `descend`/`main.js`'s win handling — can flash a "New personal best!" toast exactly when a record is actually broken); otherwise returns `false` without writing.
- **`bumpBestiaryCount(section, id, amount, game)`** — no-ops if `id` is falsy; loads storage, reads `bucket = unlocks.bestiary[section]`, computes `wasNew = !bucket[id]` (true the very first time this id is recorded in this section), adds `amount` to `bucket[id]`, runs the Phase 8a tier pass (below), saves, then calls `checkBestiaryAchievements(section, id, bucket, game, true)` (`checkCount=true`, so both per-id and breadth predicates are evaluated), and returns `wasNew` — used by `combat.js`'s `handleEnemyDeath` to fire a one-off "New Bestiary entry" toast only on an enemy's first kill. The tier pass fires for exactly two sections: `'enemyKills'` (category resolved per-id by `bestiaryTierCategoryForEnemy`) and `'objectsDestroyed'` (category `'object'`); `'enemyDeaths'` is deliberately excluded, since it measures how often something killed *you*, not player progress.
- **`markBestiarySeen(section, id, game)`** — idempotent "have I seen this" flag, cheap to call on every pickup/encounter. No-ops if `id` is falsy; sets `bucket[id] = true` on the first sighting only, and calls `checkBestiaryAchievements(section, id, bucket, game, false)` on that first sighting only (`checkCount=false` — only breadth predicates matter here, since the bucket holds booleans, not counts, so a per-id-count predicate would be meaningless). **Phase 8a** adds a second half that runs on *every* call: if `section` appears in `_BESTIARY_SEEN_TIER_MAP`, the paired count bucket is bumped by 1 and `checkBestiaryTierUp` is run against it. Consequence worth knowing: for those eight sections this function now writes to localStorage on every call rather than only the first, because the count has to persist — still exactly one `saveUnlocks` per invocation, and `objectsSeen` (not in the map) keeps the old first-call-only behaviour verbatim.
- **`_BESTIARY_SEEN_TIER_MAP`** *(Phase 8a)* — the `{seenSection: {category, countBucket}}` table wiring the eight boolean-seen sections to their tier category and count mirror: `seenItems`→`item`/`itemsCollectedCount`, `seenTrinkets`→`trinket`/`trinketsEquippedCount`, `seenFamiliars`→`familiar`/`familiarsCollectedCount`, `seenStars`→`star`/`starsUsedCount`, `seenPills`→`pill`/`pillsDrunkCount`, `seenPickupKinds`→`pickup`/`pickupKindsCollectedCount`, `seenRoomTypes`→`roomtype`/`roomTypesVisitedCount`, `seenStages`→`stage`/`stagesVisitedCount`. Also read by `ui/bestiary.js`'s `renderBestiarySimple`, so the panel derives a row's category and count bucket from the same table the writer uses and can't drift out of sync with it.
- **`bestiaryTierCategoryForEnemy(id)`** *(Phase 8a)* — `enemyKills` is one bucket holding three tier categories; which one an id belongs to is decided by the data table it was declared in: `SUPERBOSSES[id]` → `'superboss'`, else `BOSS_TYPES[id]` → `'boss'`, else `'enemy'`. Both lookups are `typeof`-guarded so the function is safe in a headless/partial load.
- **`checkBestiaryTierUp(unlocks, category, id, count)`** *(Phase 8a)* — the single choke point that mints skill points. Reads `prevTier = unlocks.bestiary.tiersAwarded[category+'/'+id] || 0`, computes `newTier = bestiaryTierFor(category, count)`, and if it's higher records the new tier and adds `newTier - prevTier` to `unlocks.skillTree.points` (so a jump clearing several rungs at once pays for *every* rung crossed), returning the new tier — or 0 if no rung was crossed. Also adds the same amount onto `unlocks.skillTree.lifetimeEarned` (post-capstone polish pass — a pure "how far have I come" counter, never decremented by spending or by `sellSkillNode`'s refund, backfilled once for pre-existing saves in `ensureUnlockShape` as `points + sum(spent)` so it isn't just 0 for anyone with an existing wallet; surfaced in `buildSkillTreePanel`'s `#skillTreeSummary` line). It only mutates the passed `unlocks` object; the caller's single pre-existing `saveUnlocks` persists it, which is why neither `bumpBestiaryCount` nor `markBestiarySeen` gained a second write. Hooking it here rather than at the ~10 gameplay call sites (`combat-1/2/3.js`, `main.js`, `game.js`, `room.js`, `items-2.js`) means no call site needed touching. Note it does *not* retroactively award tiers for counts already banked before Phase 8a — `tiersAwarded` starts empty and the ledger only catches up the next time that id is bumped, at which point the multi-rung logic pays all four rungs at once.
- **`activeGame()`** — returns the module-level `game` global from `main.js` if it exists, else `null`, wrapped in try/catch because `achievements.js` loads *before* `main.js` and `game` would otherwise be a TDZ reference error. Exists because `combat.js`/`game.js`/`items.js` call `bumpBestiaryCount`/`markBestiarySeen` without threading a `game` argument through; without this fallback a bestiary achievement would still unlock and still permanently join the pools, it just wouldn't hand the reward to the *current* run's state the way stat achievements do.
- **`checkBestiaryAchievements(section, id, bucket, game, checkCount)`** — the bestiary equivalent of `bumpStat`'s threshold sweep, called by both `bumpBestiaryCount` and `markBestiarySeen`. Resolves `g = game || activeGame()`. If `checkCount` is true, looks up `_ACHV_BY_BESTIARY_ID.get(section+'/'+id)` and unlocks every watcher whose `threshold <= bucket[id]`. Always (regardless of `checkCount`) looks up `_ACHV_BY_BESTIARY_SECTION.get(section)`; if present, computes `distinct = Object.keys(bucket).length` once and unlocks every watcher whose `distinctThreshold <= distinct`.
- **`recordWin(game, classId)`** — called on a run win. Calls `bumpStat('wins', 1, game)`, sets `unlocks.winsByClass[classId] = true` and saves, then checks the size of `winsByClass`: `>= 3` unlocks `'triplethreat'`, `>= 8` unlocks `'challenge_wins_8classes'`, `>= 20` unlocks `'challenge_wins_allclasses'` (20 = every key in `CLASSES`). Also checks `game.player.redMax <= 1` to unlock `'onehearted'` (Witheredapple), and additionally `!game.player.tookDamageThisRun` to unlock `'challenge_onehearted_flawless'`.
- **`ACHIEVEMENT_CATEGORY_ORDER`** — `['Characters', 'Superbosses', 'Completionist', 'Mastery', 'Exploration', 'Collection', 'Challenge', 'Donations', 'Miscellaneous']` (`'Slayer'` removed in Phase 9 — see the Phase 9 note above). The only place category display order is declared; `index.html`'s `#achievementsFilter` is All/Unlocked/Locked only, with no per-category buttons. Any category not listed here (e.g. `'Stars'`) still renders — `buildAchievementsPanel` appends unlisted categories found in `_ACHV_BY_CATEGORY` after these.
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

### achievements/skilltree.js

*(Phase 8b — the skill tree engine: what **spends** the `unlocks.skillTree.points` that Phase 8a's bestiary tiers mint. **This is scaffolding only.** It ships the free `start` node plus the 27 category hub nodes (25 per-character hubs, one keyed `char_hub_<classId>` for every `CLASSES` entry, plus `unlock_hub` and `general_hub`), and a fully generic node-purchase/effect engine that already handles every effect shape the later content phases will need. The 375 leaf nodes — 10 per character × 25 characters, 100 unlock-type nodes, 25 general-upgrade nodes — are content for Phase 8c/8d/8e and are **not defined here**; they are appended to `SKILL_TREE_NODES` using the node shapes below, and none of the engine functions need to change to support them.)*

New file, loaded in `index.html` immediately after `achievements/logic.js` and before `main.js` — it needs `ensureUnlockShape`/`loadUnlocks`/`saveUnlocks` (`main.js`) only at call time, not at parse time, so this ordering is just "definitions before `main.js` runs its bootstrap", not a hard dependency edge.

- **Node shape** — every entry in `SKILL_TREE_NODES` is `{ id, parent, cost, name, desc, effect }` (legacy singular shape) or, since Phase 8b-uniquefx, `{ id, parent, cost, name, desc, effects:[...] }` (an array, for a node with more than one effect). `parent` is the single node id that must already be owned before this one is buyable (`null` only for `'start'`, which is always considered owned without ever being purchased). `effect`/`effects` entries are `null` (the `start` node and all 27 hub nodes use singular `effect:null`) or one of:
  - `{type:'stat', classId, stat, amount}` — a flat fractional bonus (e.g. `0.05` = +5%, or a negative amount for a trade-off/reduction) to one `SKILL_TREE_STAT_FIELDS` field, scoped to one class. Summed and symmetric-clamped by `getSkillTreeStatBonus`.
  - `{type:'unlock', category, id}` — grants an id into one of the existing unlock-gating buckets (`category` one of `star`/`trinket`/`familiar`/`item`, mapped to `unlockedStars`/`unlockedTrinkets`/`unlockedFamiliars`/`unlockedItems`). Applied once, at purchase time, by `applySkillTreeUnlockEffect`.
  - `{type:'poolWeight', pool, id, bonus}` — adds `bonus` to one entry's weight (matched by `id`) in a named room-clear reward pool. Read live (not applied at purchase time) by `applySkillTreePoolNudge`.
  - `{type:'startingPickup', pickup, amount}` — grants `amount` more of a starting resource (`pickup` one of `bombs`/`keys`/`coins`/`blue`, the last mapping to `player.blueCurrent`) at the start of every run. Read live by `applySkillTreeStartingPickups`.
  - `{type:'uniqueField', classId, field, amount, min, max}` — Phase 8b-uniquefx. Sums `amount` across every owned node targeting the same `classId`+`field`, clamps the sum to that effect's own `[min,max]` (**required on every such effect, no implicit default** — forces each node author to think about bounds), and sets a per-instance shadow field on `player` (e.g. `player.crystalShardCount`) to `pristineBase + clampedBonus`. **Mutation-safety rule: this must never write onto `player.def`** — `player.def` is a direct reference to the shared `CLASSES[classId]` object (see `entities.js`'s `Player` constructor, `this.def = def;`), so writing to it would permanently corrupt that class for every future run/character. Only fields that have an actual shadow field seeded in the `Player` constructor are meaningfully targetable; targeting an unshadowed field is a silent no-op. Applied by `applySkillTreeUniqueFieldBonuses`. **Idempotency bug fixed post-Phase-9** — this used to do `player[field] += clampedBonus`, which re-added the same bonus every time `recalcPlayerStats` ran (every item/pill/star/familiar pickup in a run, not just once at spawn), silently compounding the bonus over a long run. Fixed by lazily capturing each field's pristine value into `player._skillTreeFieldBase` the first time it's seen, and always recomputing from that captured base rather than accumulating onto the field's live value.
  - `{type:'uniqueFlag', classId, field, value}` — Phase 8b-uniquefx. If any owned node for `classId` carries this effect, forces `player[field] = value` (almost always `value:true`) — the mechanism for granting a class a mechanic it doesn't natively have (e.g. Earth Pony gaining `shockwaveAttack`), since the mechanic's own dispatch code (e.g. `if (player.shockwaveAttack) {...}` in `combat-1.js`) checks the `player` field generically regardless of class/`def`. Applied by `applySkillTreeUniqueFlagEffects`, which runs LAST (after the stat-bonus and uniqueField passes) so it can override anything derived earlier in `recalcPlayerStats`.
  - `{type:'globalStat', stat, amount}` — **engine expansion pass, infrastructure only, no node uses it yet.** Identical accounting to `'stat'` (same `SKILL_TREE_STAT_FIELDS` allowlist, same additive-vs-multiplicative split, same cap) but with no `classId` — every owned `globalStat` effect for a `stat` contributes regardless of which character is currently playing (see `getSkillTreeStatBonus`'s second accumulation pass). Meant for a future "general path" node that helps every character a little, filling the gap `skilltree-general.js`'s existing 25 nodes leave (those only reach pool weights/starting pickups, never a flat cross-character stat).
  - `{type:'runModifier', classId, key, value}` — **engine expansion pass, infrastructure only, no node uses it yet.** Doesn't touch any real `player` field — writes into a namespaced bag, `player.skillTreeMods[key] = value`, rebuilt fresh every `applySkillTreeStatBonuses` call (see `applySkillTreeRunModifiers`). Lets a future gameplay system read `player.skillTreeMods.someKey` without the engine needing a brand new effect TYPE for every future system; last write wins if two owned nodes target the same key (no summing — the value isn't assumed numeric).
- **`nodeEffects(node)`** — `node.effects || (node.effect ? [node.effect] : [])`. Every engine function that reads a node's effect(s) goes through this helper rather than touching `.effect`/`.effects` directly, so both the legacy singular shape (all 250 nodes in `skilltree-characters.js`, untouched) and the new array shape are handled uniformly.
- **`SKILL_TREE_STAT_FIELDS`** — the allowlist of numeric `Player` fields a `'stat'` (or `'globalStat'`) effect may target: `speed`, `meleeDamage`, `rangedDamage`, `critChance`, `luck`, `fireCooldown`, `meleeCooldown`, `rangeTiles`, `boltSpeed`, `magnetRadius`, the 9 on-hit/utility chance fields (`venomChance`/`stunChance`/`charmChance`/`freezeChance`/`fearChance`/`vulnerableChance`/`lifestealChance`/`onKillHealChance`/`dodgeChance`), and — as of the engine-expansion pass — `shopDiscountBonus` (registers the already-existing `items-1.js`-derived economy field as a skill-tree target; no node uses it yet). Only fields on this list are ever read/multiplied by `applySkillTreeStatBonuses` — future leaf-node content must pick a `stat` from this list (or the list itself extended in the same pass that adds a node targeting a new field). `SKILL_TREE_ADDITIVE_STAT_FIELDS` — the subset (the 9 chance fields plus `shopDiscountBonus`) that get `player[stat] += bonus` instead of `*= (1+bonus)`, since they commonly sit at exactly 0 with no items equipped and a multiplicative bonus on 0 is a silent no-op. `SKILL_TREE_STAT_CAP_OVERRIDES` — per-stat ceilings tighter than the flat `SKILL_TREE_STAT_CAP` (`0.25`): `lifestealChance: 0.10` and (engine-expansion pass) `shopDiscountBonus: 0.10`, since both are already strongly fed by items/passives and a flat-25%-from-the-tree-alone would be excessive on top.
- **`SKILL_TREE_STAT_CAP`** — `0.25`. Hard ceiling: the combined skill-tree bonus magnitude on any one stat, for any one character, across every owned node, never exceeds `0.25` in either direction — as of Phase 8b-uniquefx the clamp in `getSkillTreeStatBonus` is **symmetric** (`[-SKILL_TREE_STAT_CAP, SKILL_TREE_STAT_CAP]`, previously `[0, SKILL_TREE_STAT_CAP]`), so a node summing to a net-negative bonus for a stat is no longer floored to 0. This is what makes `fireCooldown`/`meleeCooldown` viable REDUCTION-only targets going forward: `applySkillTreeStatBonuses` still does `player[stat] *= (1 + bonus)`, and with `bonus` now able to be negative that correctly shrinks a cooldown field (e.g. `0.4 * (1 + -0.1) = 0.36`) instead of being a guaranteed no-op like before.
- **`SKILL_TREE_NODES_BY_ID`** — `{id: node}`, built once at load from `SKILL_TREE_NODES`, for O(1) lookups by the functions below.
- **`isSkillNodeOwned(unlocks, nodeId)`** — `true` for `'start'` unconditionally, else `!!unlocks.skillTree.unlockedNodes[nodeId]`.
- **`canBuySkillNode(unlocks, nodeId)`** — `false` if the id doesn't exist, is already owned, or its `parent` isn't owned yet; otherwise `unlocks.skillTree.points >= node.cost`.
- **`buySkillNode(nodeId)`** — loads live storage itself (no `unlocks` param — this is the actual mutating entry point, called from the panel's button handler); re-checks `canBuySkillNode`, bails `false` if it fails (so a stale/double click can't double-spend); otherwise deducts `node.cost` from `unlocks.skillTree.points`, records `unlocks.skillTree.spent[nodeId] = node.cost`, sets `unlocks.skillTree.unlockedNodes[nodeId] = true`, applies the node's `'unlock'`-type effect (if any) via `applySkillTreeUnlockEffect`, `saveUnlocks(unlocks)`, returns `true`.
- **`applySkillTreeUnlockEffect(unlocks, effect)`** — mirrors `achievements/logic.js`'s `unlockAchievement` grant pattern for the one relevant branch: maps `effect.category` to the matching `unlockedX` bucket and sets `bucket[effect.id] = true`, no-op (not even a bucket-miss crash) if the category doesn't map or the id is already granted.
- **`getSkillTreeStatBonus(unlocks, classId, stat)`** — sums every owned node's `'stat'`-type effect (via `nodeEffects`) matching both `classId` and `stat`, **plus** (engine-expansion pass) every owned `'globalStat'`-type effect matching just `stat` (no `classId` gate — contributes regardless of which character owns it), then `Util.clamp`s the combined total to `[-cap, cap]` (symmetric as of Phase 8b-uniquefx — `cap` is `SKILL_TREE_STAT_CAP_OVERRIDES[stat]` if one exists, else `SKILL_TREE_STAT_CAP`).
- **`applySkillTreeStatBonuses(player)`** — called as the very last statement inside `systems/items-1.js`'s `recalcPlayerStats(player)`, after every other derived-stat term, so the bonus multiplies the fully-derived value rather than being clobbered by a later assignment. For every field in `SKILL_TREE_STAT_FIELDS` that's actually numeric on `player`, applies `getSkillTreeStatBonus(unlocks, player.classId, stat)` — additively (`+=`) for fields in `SKILL_TREE_ADDITIVE_STAT_FIELDS`, multiplicatively (`*= (1+bonus)`) for everything else — whenever that bonus is nonzero (positive or negative). Then calls, in order, `applySkillTreeUniqueFieldBonuses(player)`, `applySkillTreeUniqueFlagEffects(player)`, and (engine-expansion pass) `applySkillTreeRunModifiers(player)` — see those entries and the `uniqueField`/`uniqueFlag`/`runModifier` effect shapes above.
- **`applySkillTreeRunModifiers(player)`** — **engine expansion pass, infrastructure only, no node uses it yet.** Ensures `player.skillTreeMods` exists (created once, never reassigned — cleared and refilled in place each call so any external code holding a reference keeps seeing live data), then for every owned `'runModifier'` effect matching `player.classId` sets `player.skillTreeMods[eff.key] = eff.value`. Reruns on every `recalcPlayerStats` call like every other `apply*` function here, so a key never lingers after its granting node is sold.
- **`applySkillTreeUniqueFieldBonuses(player)`** — Phase 8b-uniquefx. Groups every owned `uniqueField` effect for `player.classId` by `field`, sums each group's `amount`s, clamps the sum to the tightest `[min,max]` seen among that group's contributing effects, and (only if `player[field]` is already a number, i.e. a shadow field exists) sets it to `player._skillTreeFieldBase[field] + clampedBonus` — never touches `player.def`. `player._skillTreeFieldBase` is a lazily-populated map (created on this player instance the first time any field is processed) capturing each targeted field's PRISTINE pre-bonus value the first time it's seen, so repeated calls within the same run (this function reruns on every `recalcPlayerStats`, i.e. every item/pill/star/familiar pickup) always recompute from that fixed base instead of accumulating onto the field's current, already-bonused value. (Fixed post-Phase-9 — see the effect-shape entry above for the bug this replaced.)
- **`applySkillTreeUniqueFlagEffects(player)`** — Phase 8b-uniquefx. For every owned `uniqueFlag` effect matching `player.classId`, sets `player[field] = value`. Runs last so it can grant a flag a class's own `def` never sets.
- **`applySkillTreePoolNudge(pool, poolName)`** — called from `systems/room.js`'s `spawnClearRoomPickup` around every `Util.weighted(...)` reward-pool call (`COMMON_CATEGORY_POOL`, `COMMON_PENNY_POOL`, `COMMON_HEART_POOL`, `RARE_POOL`, `LEGENDARY_POOL`), wrapping the pool argument: `Util.weighted(applySkillTreePoolNudge(COMMON_CATEGORY_POOL, 'COMMON_CATEGORY_POOL'))`. Scans `SKILL_TREE_NODES` for an owned `'poolWeight'` effect whose `pool` matches `poolName`; if none exists, returns the **exact same array reference** passed in (a true no-op, not just an equal-by-value copy) — which is always the case today, since no leaf nodes exist yet. If at least one matching owned node is found, returns a shallow `{id,w}` clone of the pool with each matched entry's `id`'s weight bumped by that node's `bonus` (only cloning, and only once, the first time a match is found). `CLEAR_REWARD_CHANCE`'s own top-tier roll (nothing/common/rare/legendary, including the Fortune Shell shift) is untouched by this — only the pool *within* a tier is nudgeable.
- **`applySkillTreeStartingPickups(player)`** — called from `game.js`'s `startRun(classId)` right after `new Player(classId)` (before `recalcPlayerStats`, though order doesn't matter — it only touches pickup counters, not derived stats). For every owned `'startingPickup'` node, adds `amount` to the matching `player` field.
- **`computeSkillTreeLayout(nodes)`** — Phase 8b-visual. Pure function, no DOM: defaults `nodes` to the module-level `SKILL_TREE_NODES` (a param exists so test harnesses can pass a synthetic extended array). Builds a parent→children adjacency map from every node's `parent` field, then recursively (post-order) assigns each node a `{x, y}` slot in abstract column/row units — a tidy/Reingold-Tilford-style tree layout that handles arbitrary branching and depth, not just today's 2-level (`start`→hub) shape: a leaf (no children) claims the next free integer column via a shared counter; an internal node's `x` is the plain average of its children's `x`; `y` is recursion depth (root = 0). Returns `{positions: {nodeId: {x,y}}, edges: [{from,to}]}` where `edges` has one entry per non-root node (`from` = its `parent`, `to` = its `id`). This is the function later content phases (8c/8d/8e, which add 3-5+ level branching subtrees under each hub) rely on to never need the renderer touched again.
- **`SKILL_TREE_COLUMN_WIDTH`/`SKILL_TREE_ROW_HEIGHT`/`SKILL_TREE_NODE_SIZE`/`SKILL_TREE_PADDING`/`SKILL_TREE_BOTTOM_LABEL_ROOM`** — pixel constants (`130`/`130`/`74`/`50`/`40`) `buildSkillTreePanel` uses to convert `computeSkillTreeLayout`'s abstract column/row units into actual `left`/`top` pixel offsets. `SKILL_TREE_NODE_SIZE` is used for both width and height, so the node button is always a true circle; `SKILL_TREE_ROW_HEIGHT` carries extra headroom (vs. earlier `110`) and `SKILL_TREE_BOTTOM_LABEL_ROOM` pads the canvas's computed height so the below-circle name label (see below) has room and isn't clipped.
- **`buildSkillTreePanel()`** — rebuilds `#skillTreeList`'s DOM from scratch. Writes `#skillTreeSummary` exactly as before (`'<points> points available — <owned> / <total> nodes unlocked'`), then renders an actual visual tree instead of the old flat `.achv-row` list: calls `computeSkillTreeLayout()`, finds the layout's bounding box (`maxX`/`maxY`), and builds a `.skilltree-scroll` (scrollable both axes) containing one `.skilltree-canvas` sized to the full bounding box in pixels. Inside the canvas: an absolutely-positioned `.skilltree-svg` layer drawn first, with one `<line>` per edge (parent's bottom-center to child's top-center, `.owned` class — gold — when the child is owned, otherwise the neutral border color), then one absolutely-positioned `.skilltree-node` button per node on top, positioned via inline `style.left`/`style.top`/equal `style.width`/`style.height` (`SKILL_TREE_NODE_SIZE`, so it renders as a true circle via `border-radius:50%`), classed per state (see the Phase 10 UX-overhaul entry below — `.owned`/`.buyable`/`.unaffordable`/`.cursed`), with a `title` attribute carrying the name/cost/desc as a native tooltip. Each node's visible content is split in three: a compact one-letter `.skilltree-node-glyph` centered inside the circle, an optional `.skilltree-node-cost` badge pinned to the top-right corner (only when `node.cost` is truthy), and the full node name as `.skilltree-node-label` — a separate absolutely-positioned child pinned just below the circle (`top:100%`) — since most node names don't fit legibly inside a 74px circle. A `.buyable` node's click handler calls `buySkillNode` and, on success, rebuilds the whole panel in place (`buildSkillTreePanel()` again) — identical purchase flow to before, just a different DOM shape. Non-owned/non-buyable nodes are rendered `disabled`; `.owned` nodes are plain (non-disabled) buttons with no click handler, so they're inert but still hoverable for the tooltip.
  - **Phase 10 skill-tree panel UX overhaul** (post-megaupdate, once the tree grew to 2300+ nodes across 8 content files): three changes to `buildSkillTreePanel`, plus matching `style.css`/`index.html` additions.
    1. **Fog of war** — a new local `isVisible(nodeId)` helper (owned, OR its single `parent` is owned) gates both the node-render loop and the edge-render loop. A node whose parent isn't owned yet is no longer rendered *at all* (previously every node in `SKILL_TREE_NODES` was always rendered, just dimmed via `.locked`) — this is both the "children hidden until bought" behavior and a real perf win, since only the owned set plus one ring of buyable/unaffordable frontier nodes is ever in the DOM (a few hundred, not 2300+). Start/hub nodes (`parent:'start'`, always owned) are therefore always visible, unchanged from before.
    2. **Buyable split into `.buyable` (affordable) vs `.unaffordable`** — the old `.locked` class conflated "haven't reached this yet" (now handled by fog of war, above — not rendered) and "reached it but can't afford it" into one dim look. Now a visible-but-unbought node is `.buyable` (green light: `canBuySkillNode` true — parent owned AND enough points) or `.unaffordable` (parent owned, not enough points — still visible, still disabled, distinct dimmer styling, cost badge turns red, tooltip states exactly how many points are missing).
    3. **`.cursed` styling** — any node with `node.cursed === true` (the debuff-gate convention from `skilltree-characters-3.js` onward) gets a `.cursed` class. Rendered in `style.css` as a jagged 14-spike disc in a blood-red palette instead of a plain circle, via a `::before` pseudo-element carrying a `clip-path: polygon(...)` — **not** applied to `.skilltree-node` itself, because clip-path also clips out-of-flow descendants, and both `.skilltree-node-label` (positioned below the circle) and `.skilltree-node-cost` (positioned above-right of it) paint outside the node's own 0%–100% box and would otherwise silently vanish on every cursed node.
    4. **Condensed layout** (follow-up fix — fog of war alone still hid non-visible nodes at RENDER time, but `computeSkillTreeLayout` was still called with the full `SKILL_TREE_NODES`, so every hidden subtree still silently reserved real column width, spreading the visible nodes out over mostly-empty canvas). Fixed by building `const visibleNodes = SKILL_TREE_NODES.filter(n => isVisible(n.id))` right after `isVisible` is defined (moved earlier in the function, before layout instead of after) and calling `computeSkillTreeLayout(visibleNodes)` instead of the full list — a node whose real children are all still fogged is now treated as a LEAF for column-allocation purposes, since `computeSkillTreeLayout` only ever sees the children it's given. This works because the visible set is closed under "take parent" (an owned node's parent must already be owned; a buyable/unaffordable node's parent must be owned by the visibility rule itself), so it's a well-formed sub-forest safe to lay out on its own — verified by data-level test: a fresh save's canvas column count drops from 523 (laying out all 2302 nodes) to 24 (laying out just the 26 visible ones); a mid-game save (all 25 hubs owned + a 5-deep chain into one character) drops to 164. The edge-render loop and node-render loop were simplified to iterate `edges`/`visibleNodes` directly (both already pre-filtered) instead of re-checking `isVisible` per element.
    - **New toolbar** (`#skillTreeToolbar` in `index.html`, wired at the end of `buildSkillTreePanel`, right after `applyTransform()`): a `#skillTreeJumpSelect` dropdown (one option per `CLASSES` entry, value `char_hub_<classId>`, label includes a live `(owned/total)` count computed by prefix-matching `'char_' + classId + '_'` against `SKILL_TREE_NODES`) that calls a new `centerOnNode(nodeId)` helper to pan+zoom the camera onto any node by id; a `#skillTreeRecenterBtn` that calls `centerOnNode('start')`; and a name/desc search (`#skillTreeSearchInput` + prev/next buttons + a `#skillTreeSearchCount` "n / total" readout) that filters `SKILL_TREE_NODES` by `isVisible(...)` (search can never reveal fogged content) and cycles matches with a pulsing `.search-match` outline, Enter/Shift+Enter, and Escape-to-clear.
    - **Purchase flash** — a new module-level `skillTreeLastBoughtId` (reset to `null` in `resetSkillTreeCamera`, set right before the purchase-triggered `buildSkillTreePanel()` call in the `.buyable` click handler) adds a one-shot `.just-bought` class to the freshly-created button for that id, playing a quick scale+glow burst (`@keyframes skillNodeJustBought`) so a purchase reads as a visible event.
    - **`.skilltree-node-unique` badge** — a small cyan `✦` pinned top-left (mirroring the cost badge's top-right) on any node whose `nodeEffects(node)` includes a `uniqueField`/`uniqueFlag` effect — i.e. a node that changes HOW the character plays (grants/tunes a real mechanic) rather than just nudging a stat, worth being able to spot at a glance across a huge tree.
    - **Minimap** (`#skillTreeMinimap`, a bare `<canvas width=170 height=130>` placed as a SIBLING of `#skillTreeList` in `index.html`, not a child — `buildSkillTreePanel` does `wrap.innerHTML=''` on `#skillTreeList` every rebuild, which would delete a minimap canvas living inside it; positioned `position:absolute` against `#skillTreeScreen`, which is itself `position:absolute` via `.overlay`, so no extra positioning wrapper was needed). `drawMinimap()` (called from `applyTransform`, so every rebuild/pan/zoom/drag repaints it) redraws the whole thing from scratch each call — one dot per node in `minimapPoints` (collected inline during the main node-render loop, same fog-of-war-filtered visible set, `{x,y,state,cursed,endgame,endgameColor}` — `endgame`/`endgameColor` added once capstone/ascension nodes existed, see below; cursed nodes get a red-ringed slightly larger dot, endgame nodes (capstone OR ascension) get the same larger-dot treatment ringed in their own on-canvas color — gold for capstone, cyan for ascension — instead of red), colored by state (`MINIMAP_COLORS`), scaled/centered to fit the canvas via a `minimapScale`/`minimapOffsetX`/`minimapOffsetY` computed from the full `canvasW`/`canvasH` bounding box, plus a cyan stroked rectangle showing the current viewport (found by inverting the pan/zoom transform: `worldLeft = -panX/zoom`, `worldW = viewportW/zoom`, the same inversion the wheel-zoom cursor-anchoring math already uses). Clicking the minimap converts the click position back to world-space through the same scale/offset and calls the new `centerOnWorldPixel(worldX, worldY)` helper — `centerOnNode(nodeId)` is now a thin wrapper over that same helper (looks up the node's world position, then calls it), refactored out of what used to be `centerOnNode`'s own inline math.
    - **`#skillTreeLegend`** (`index.html`, styled via `.skilltree-legend`/`.sk-swatch` in `style.css`) — a static reference row under the canvas explaining the swatch colors/shapes and the "buy a node to reveal its children" fog-of-war rule, since that behavior isn't otherwise self-explanatory on first use. Now includes a `.sk-swatch.capstone` entry (see #5 below).
    5. **Post-capstone polish pass** (once `skilltree-capstones.js` existed) — five further additions to `buildSkillTreePanel`, all additive/non-breaking to the structures above.
       - **Curved edges** — the SVG edge loop now emits a `<path d="M x1,y1 C x1,midY, x2,midY, x2,y2">` cubic bezier (control points pulled to the vertical midpoint between parent/child) instead of a straight `<line>`, purely cosmetic (`.skilltree-edge`'s stroke styling is unchanged, just applied to a `path fill="none"` now). An edge whose CHILD (`edge.to`) is a `cursed` node also gets a `.to-cursed` class (dashed, red-tinted) — a one-hop-early warning before the spiked cursed shape itself is visible, useful at low zoom.
       - **Capstone styling** — a node is recognized as a capstone purely by an `/_capstone$/` id-suffix test (no new data field; matches exactly the 25 ids `buildCapstoneNodes` in `skilltree-capstones.js` creates), gets a `.capstone` class (wider double-ring gold border, bigger glow, `.capstone.buyable` gets its own pulse animation distinct from the normal `.buyable` one) and a crown glyph (`♛`) in place of the usual first-letter glyph.
       - **Filter bar** (`#skillTreeFilterBar` in `index.html`, six buttons: All/Affordable/Owned/Cursed/Unique/Endgame — the last one's `data-filter` value is still `"capstone"`, matching both capstone AND ascension nodes once `skilltree-ascensions.js` existed, see that file's entry) — a new module-level `skillTreeFilter` var (persists across rebuilds the same way pan/zoom/search do) drives a `matchesFilter` check per node in the render loop; a non-matching node gets `.dimmed` (opacity .16, `pointer-events:none`) rather than being removed from the DOM, so switching filters never reflows the tree or touches layout/edges. Buttons rebuild the whole panel on click (same pattern the buy handler already uses) and get `.active` styling for whichever filter is currently selected.
       - **Hover/click detail panel** (`#skillTreeDetailPanel`, pinned bottom-left, sibling of `#skillTreeList` for the same reason as the minimap) — every node gets a `mouseenter` listener calling the new **`showSkillNodeDetail(node)`**, which fills in name/cost/description plus a **`describeSkillEffect(eff)`**-rendered line per effect (e.g. `+5% rangedDamage`, `Grants shockwaveAttack`, `Unlocks star: id`) — a full, always-legible breakdown that doesn't depend on the browser's native tooltip timing/truncation the way the existing `title` attribute does (that `title` is kept as-is, unchanged, purely as a redundant fallback). A `'stat'`-type effect row also gets a second, dimmer line from **`describeSkillEffectTotal(unlocks, eff, node)`**, a small dispatcher over two implementations:
      - **`describeStatTotal`** (for `'stat'` effects) — for an OWNED node it's just the current summed `getSkillTreeStatBonus(unlocks, eff.classId, eff.stat)` against its cap (`SKILL_TREE_STAT_CAP_OVERRIDES[stat]` or the flat `SKILL_TREE_STAT_CAP`). For a NOT-yet-owned node (the more useful case) it instead PROJECTS the purchase: sums every owned node's raw (unclamped) contribution to that same (classId, stat) pair, adds this node's own `eff.amount`, then clamps — the identical raw-sum-then-clamp order `getSkillTreeStatBonus` itself uses, so the shown "after buying" number can never disagree with what actually happens post-purchase — and reads `"Current: X% → after buying: Y% / cap%"`, or explicitly `"...(already at cap — this would add nothing)"` when the projected total doesn't move past the current one, so a player never spends a point only to discover afterward it did nothing.
      - **`describeUniqueFieldTotal`** (for `'uniqueField'` effects) — same before/after projection idea, but against that (classId, field) pair's own tightest `[min,max]` window (recomputed the same way `applySkillTreeUniqueFieldBonuses` itself does — starting from THIS effect's own min/max and tightening against every other contributing owned node — rather than assuming every node sharing that field uses identical bounds) instead of a flat cap.
      - **Fixed a real unit bug while building this**: `describeSkillEffect`'s own single-effect line for `'uniqueField'` used to multiply every `uniqueField` amount by 100 and append `%`, silently assuming every uniqueField target is a percentage-of-base multiplier the way `SKILL_TREE_STAT_FIELDS` always are. That's true for `damageTakenMult`/`rockCoinChance`/`turretDamageMult`/`fireZoneRootMult` but flatly wrong for the rest: `baseRangeTiles` is tiles, `crystalVolleySpacing`/`radius`/`fireZoneRadius`/`fireZoneRange`/`fireRingRadius`/`changelingMinionRadius` are pixels, `chargeTime`/`changelingSummonCooldown` are seconds, `changelingMinionDmg` is flat damage, `maxTurrets`/`maxChangelingMinions`/`crystalShardCount` are plain counts — e.g. a genuine `+0.3 baseRangeTiles` (0.3 tiles) was rendering as `"+30% baseRangeTiles"`, actively misleading. Fixed with a new **`SKILL_TREE_UNIQUE_FIELD_UNITS`** lookup table + **`formatUniqueFieldAmount(field, amount)`** helper that renders each field in its own real unit (`'+0.3 tiles'`, `'+34 px'`, `'-2s'`, `'+3 dmg'`, or a bare signed number for counts/unrecognized fields — never an invented `%`); both `describeSkillEffect` and `describeUniqueFieldTotal` now go through it. Verified against a hand-built mock tree confirming the projection math (sum-then-clamp) matches the real engine function's own order. `showSkillNodeDetail(null)` hides the panel; wired on `scroller`'s `mouseleave` so it doesn't linger with stale content after the cursor leaves the canvas. Border color reflects the hovered node's state via `.detail-owned`/`.detail-cursed`.
       - **Keyboard pan/zoom** — arrow keys pan, `+`/`-` zoom (toward the current viewport CENTER rather than a cursor position, via the new **`skillTreeStepZoomAtCenter(dir)`** helper, which reuses the same `[0.4, 2]`/`0.1`-step math the wheel handler already used). Bound via **`bindSkillTreeKeyboardNav()`**, a `document`-level `keydown` listener guarded by a module-level `skillTreeKeyboardBound` flag so it's attached exactly ONCE ever (calling `buildSkillTreePanel()` again — e.g. every purchase — does NOT re-bind it, which would otherwise stack duplicate listeners and make panning silently accelerate); the handler reads pan/zoom state live off the module-level vars and calls a published **`skillTreeApplyTransform`** reference (reassigned to the current build's local `applyTransform` closure on every `buildSkillTreePanel()` call) so it always affects whichever build is currently on screen. No-ops whenever `#skillTreeScreen` is hidden or the focused element is an `INPUT`/`TEXTAREA`/`SELECT` (so typing in the search box, or a class-jump selection, never gets eaten by arrow-key panning). The same listener also handles `Escape`: closes `#skillTreeOverviewPanel` if it's open (returns immediately after, so Escape never ALSO pans/zooms), independent of the search box's own local Escape-to-clear handler (which only fires while that input is focused).
       - CSS: `.skilltree-scroll` also gained a static (non-panning) decorative dotted-grid + radial-vignette background so the canvas doesn't read as empty flat black while panning/zooming.
       - **Purchase + toolbar sounds** — buying a node now plays `Sound.play('shopBuy')` (or `'achievement'`, the bigger fanfare, for a capstone) from inside the `.buyable` click handler; previously a purchase, and every toolbar interaction (jump-to-character, recenter, filter buttons, search prev/next, minimap click), was completely silent. All now play `'uiClick'`, matching the sound convention every other button in the game already follows.
    6. **Sell-back** — undoes a mistaken purchase. New core functions alongside `buySkillNode`:
       - **`nodeHasOwnedChildren(unlocks, nodeId)`** — true if any node's `parent` is `nodeId` and that child is owned.
       - **`canSellSkillNode(unlocks, nodeId)`** — false for `'start'`, a non-owned node, a node with an `'unlock'`-type effect (a star/trinket/familiar/item grant — a SEPARATE `unlocks` bucket, not recomputed live from `unlockedNodes` the way every other effect type is, so there's no clean way to un-grant one; see `applySkillTreeUnlockEffect`), or a node with any owned child. Otherwise true — i.e. only the current FRONTIER of owned leaves is ever sellable, same direction fog-of-war already enforces for buying.
       - **`sellSkillNode(nodeId)`** — guarded by `canSellSkillNode`; refunds `node.cost` onto `unlocks.skillTree.points`, deletes the node from `unlocks.skillTree.unlockedNodes`/`.spent`, saves.
       - **UI**: `buildSkillTreePanel`'s render loop computes `sellable = owned && canSellSkillNode(unlocks, node.id)`; a sellable node gets a `.sellable` class (pointer cursor), a small `↩` `.skilltree-node-refund` badge (bottom-right corner — the only corner not already claimed by the cost badge/top-right or unique badge/top-left), an updated `title` noting the refund, and a click handler that raises a native `confirm()` before calling `sellSkillNode` + `Sound.play('coin')` (or `'uiDeny'` on an unexpected failure) + rebuild — a native dialog rather than a bespoke pinned popover, specifically to avoid any hover/mouseleave-timing interaction with the detail panel above.
    7. **Build overview panel** (`#skillTreeOverviewPanel`, top-right — the one corner the minimap/bottom-right and detail panel/bottom-left leave free — toggled by a new `#skillTreeOverviewBtn` in the toolbar) — built inline inside `buildSkillTreePanel` (not a standalone function) specifically so its rows' click handlers can call the same closure-local `centerOnNode` the jump-select dropdown uses. Walks every `CLASSES` entry, prefix-matching `'char_' + classId + '_'` against `SKILL_TREE_NODES` to tally `{owned, total, spent, hasCapstone}`, keeps only classes with `owned > 0`, and sorts by `spent` descending — a one-glance "where have I actually put points" view across the whole 2300+-node tree, complementary to the jump dropdown's alphabetical everything-listed view. Each row is a button reading `"<Name> [♛ if capstone owned] — owned/total · spent pt"`; clicking one calls `centerOnNode('char_hub_' + classId)`. Open/closed state persists across a rebuild via a module-level `skillTreeOverviewOpen` flag, the same pattern `skillTreeFilter` already uses.
    8. **Zoom readout + capstone shimmer** — a small `#skillTreeZoomReadout` pill pinned directly above the minimap now shows the live zoom percentage (`Math.round(skillTreeZoom * 100) + '%'`, updated every `applyTransform()` call — i.e. every pan/zoom/drag tick, not just on rebuild). Owned capstone nodes (`.capstone.owned`) also get a slow 4s idle shimmer (`@keyframes skillNodeCapstoneShimmer`) distinct from the more urgent `.buyable` pulse, so reaching one keeps a small visual payoff instead of going fully static.
  - **Pan/zoom persistence (Phase 8f-camera)** — `zoom`/`panX`/`panY` are now **module-level** variables (`skillTreeZoom`/`skillTreePanX`/`skillTreePanY`, declared above `buildSkillTreePanel`), not locals recreated on every call, specifically so a purchase-triggered rebuild (the `.buyable` click handler calling `buildSkillTreePanel()` again) reuses wherever the player last panned/zoomed to instead of snapping back to the default view. `skillTreeZoom` doubles as an "unset" sentinel: it starts (and is reset to) `null`; `buildSkillTreePanel()` only computes+applies the default centered-on-`start` view (`zoom 1`, `panX`/`panY` centering the root node near the top of the viewport) when `skillTreeZoom == null` — otherwise it reuses the persisted values untouched. **`resetSkillTreeCamera()`** sets all three back to their sentinel (`null`/`0`/`0`) and is the function that should be called on a genuine fresh panel OPEN (as opposed to an internal rebuild); the wheel-zoom and click-drag-pan handlers both read/write these same module-level variables directly (not local shadow copies), so panning or zooming, then buying a node, then panning again, all accumulate onto the one persisted camera state. The zoom-toward-cursor math (`world = (cursor - pan) / zoom` then `pan' = cursor - world * zoom'`) and the drag-panning mousedown/mousemove/mouseup/mouseleave listener set are unchanged from the prior pass, just reading/writing the hoisted variables instead of function-local ones.

Wired into `index.html`/`main.js` like the Achievements/Bestiary overlays but sized differently: `#skillTreeScreen` carries `.screen.hidden.overlay.achv-overlay.skilltree-overlay` — the extra `.skilltree-overlay` class overrides `.achv-overlay`'s centered/padded sizing so the panel fills the whole viewport instead (header and Close button pinned in normal flex flow, `#skillTreeList` given all remaining space), while Achievements/Bestiary keep the original `.achv-overlay` sizing untouched. Opened by `#skillTreeBtn` (main menu), `#pauseSkillTreeBtn` (pause menu), and the `KeyK` keybind, all now via `openOverlay('skillTreeScreen', () => { resetSkillTreeCamera(); buildSkillTreePanel(); })`/`toggleOverlay(...)` with the same wrapper — **only these fresh-open call sites reset the camera** (Phase 8f-camera); the purchase-triggered rebuild inside `buildSkillTreePanel` itself calls `buildSkillTreePanel()` directly, with no reset, so the camera survives a purchase. Closed by `#skillTreeCloseBtn` or backdrop click, and included in the Escape-handler's open-overlay search array. `#skillTreePointsBadge` (reuses `.new-badge` styling) shows the live point count on the main menu's Skill Tree button, refreshed by `refreshSkillTreeBadge()` (hidden when `points <= 0`) alongside `refreshAchievementsBadge`/`refreshBestiaryBadge` in `updateLifetimeStatsDisplay()`.

### achievements/skilltree-characters.js

*(Phase 8c — the 250 character skill nodes, 10 per character × 25 `CLASSES` entries, bringing `SKILL_TREE_NODES` to 278 total. Pure data appended onto `skilltree.js`'s arrays; no engine function changed. Loaded in `index.html` immediately after `achievements/skilltree.js`.)*

- **Topology (Phase 8f-topology — hand-varied per character, no longer a repeated template)** — originally every character used the identical rigid shape (two branch openers `a1`/`b1`, each forking into two 2-node subpaths). As of Phase 8f, **`SKILL_TREE_CHAR_TOPOLOGY`** — a `{classId: {key: fullParentNodeId}}` table sitting just above `buildCharacterSkillNodes` — replaces that single global parent-lookup with a hand-designed one per `classId`, so each character's tree has a genuinely different branch count/width/depth (some hubs have 4 direct children, some 1-3 with branches nested/grafted inside each other; individual branches render as a plain Y-fork, a single-file 5-node chain, a late fork, or a wide partway fork). The one hard invariant preserved per character: within each of the four original 5-node "branches" (opener + two 2-node subpath chains), a node that was deeper in its ORIGINAL chain still requires strictly more prior purchases to reach than a shallower one in that same original chain — i.e. relative power-vs-depth ordering survives even though the branch's absolute position/shape doesn't. `SKILL_TREE_CHAR_TOPOLOGY`'s values are **full** parent node ids (not bare local keys), which lets a node here be grafted under a `c*`/`d*`-branch node this file doesn't even define (from `skilltree-characters-2.js`) — resolution is purely by id-string lookup at build time, so the two files' load order doesn't matter. Node `id`/`name`/`desc`/`effect` content is completely unchanged; only this parent wiring differs. `computeSkillTreeLayout` (`skilltree.js`) needed no changes — it already handled arbitrary branching/depth. See `feature-research/phase8-metaprogression/audit-skilltree-topology-camera.md` for the full per-character shape-signature table and verification harness output. `skilltree-characters-2.js`'s analogous **`SKILL_TREE_CHAR_TOPOLOGY_2`** table (covering that file's `c*`/`d*` keys) works identically and is designed as one combined 20-node shape per character together with this file's table.
- **Stats/amounts** — each character picks exactly 2 `SKILL_TREE_STAT_FIELDS` stats (one per branch); both subpaths within a branch target the same stat as their branch's opener, so a branch is one specialization told two flavor-different ways, not two different stats. Cost is `1` per node uniformly. Amounts are the same fixed split for every character: opener `0.05`, each depth-2 subpath node `0.04`, each depth-3 leaf `0.03`. `fireCooldown`/`meleeCooldown` are deliberately never used here — at the time this file was authored, `getSkillTreeStatBonus` clamped a stat's summed bonus to `[0, SKILL_TREE_STAT_CAP]`, so a cooldown-*reducing* negative amount would just get floored to 0, leaving no way to author a genuinely helpful cooldown node. **This restriction no longer holds**: Phase 8b-uniquefx made the clamp symmetric (`[-SKILL_TREE_STAT_CAP, SKILL_TREE_STAT_CAP]`), so a future content pass *can* author a negative-amount `fireCooldown`/`meleeCooldown` node that actually reduces the cooldown — this file's existing 250 nodes are simply never retroactively edited to add any.
- **Cap design rule** — for every character × stat, the worst-case sum (opener + *both* full subpath chains, i.e. all 5 nodes in a branch bought) is `0.05+0.04+0.04+0.03+0.03 = 0.19`, safely under `SKILL_TREE_STAT_CAP` (`0.25`) with margin to spare.
- **`SKILL_TREE_CHARACTER_CONFIG`** — the 25-entry authoring table (`classId`, `statA`, `statB`, and hand-written `{name, desc}` per of the 10 node keys `a1/a2a/a3a/a2b/a3b/b1/b2a/b3a/b2b/b3b`) that `SKILL_TREE_CHARACTER_NODES` is mechanically expanded from (ids/parents/costs/effects are derived from the template; only the flavor text is authored per node). Ids follow `char_<classId>_<key>` (e.g. `char_earth_a2a`).
- At load, a closing loop pushes every entry of `SKILL_TREE_CHARACTER_NODES` onto `SKILL_TREE_NODES` and registers it in `SKILL_TREE_NODES_BY_ID`, the same append pattern `skilltree.js` itself uses for the hub nodes.

Full stat-pairing table (classId → branch A stat / branch B stat) and verification harness output: `feature-research/phase8-metaprogression/audit-skilltree-characters.md`.

### achievements/skilltree-characters-3.js

*(Phase 9 megaupdate step 3 — doubles every character's skill tree from 20 to 40 non-hub nodes: 500 new nodes, 20 per character × 25 `CLASSES` entries. **Mega A step 4** then added 26 more cursed gate nodes in the same file, so it now contributes 526 nodes and brings `SKILL_TREE_NODES` to 1054 total (528 + 526). Pure data appended onto `skilltree.js`'s arrays; no engine function changed. Loaded in `index.html` immediately after `achievements/skilltree-characters-2.js` and before `achievements/skilltree-general.js`.)*

- **Topology** — each character's 20 new nodes form four new 5-node extension branches (keys `e/f/g/h`), each grafted onto one of that character's existing deepest leaf nodes from the old 20-node set (defined across `skilltree-characters.js`'s `a*`/`b*` keys and `skilltree-characters-2.js`'s `c*`/`d*` keys) — never a brand-new branch off `char_hub_<classId>`, and the old 20 nodes/their parents are never edited. **`SKILL_TREE_CHAR_TOPOLOGY_3`** (`{classId: {key: fullParentNodeId}}`, same shape as the two prior topology tables) drives the grafting.
- **`SKILL_TREE_CHARACTER_CONFIG_3`** — the 25-entry authoring table (`classId` + hand-written `{name, desc, effect, cursed?}` per of the 20 node keys `e1/e2a/e3a/e2b/e3b/f1/.../h3b`) that `SKILL_TREE_CHARACTER_NODES_3` is expanded from. Ids follow `char_<classId>_<key>` (e.g. `char_earthpony_e2a`).
- **Cursed mandatory-gate nodes** — the "many mandatory gates" cursed-node design from this megaupdate: 174 of the 500 new nodes carry `cursed: true` and a pure-debuff (all-negative-amount) `stat` effect, and each is the sole `parent` of at least one further node in its branch — since `canBuySkillNode`'s existing single-parent-required purchase logic already enforces "must own parent to buy child," a cursed node's descendants are automatically gated behind accepting its debuff first, with no engine change needed. The remaining ~326 new nodes are ungated normal stat payoffs, for build variety.
- **`SKILL_TREE_CHAR_GATE_CONFIG_3` (Mega A step 4)** — after step 3, only ~half of the 100 payoff leaves (`e3b/f3b/g3b/h3b`) sat behind a cursed `X2b` parent; the other 26 `(classId, branch)` pairs reached their branch's deepest payoff for free. This table adds ONE extra cursed gate per such pair — id `char_<classId>_<e|f|g|h>x`, `cost:1`, `cursed:true`, a single negative `stat` effect — spliced between that branch's `X2b` node and its `X3b` payoff: the gate takes `X2b` as its parent and `X3b` is emitted with the gate as its parent (done inside `buildCharacterSkillNodes3`, so no already-built node object is mutated; `SKILL_TREE_CHAR_TOPOLOGY_3` itself is untouched). Each entry is `{curse, site, stat}`: `curse` is a curse-phrase that character's tree doesn't already use, `site` reuses that branch's own `2b` site noun, and `stat` is the SAME field that branch's cursed opener (`X1`) already reduces, at `-0.03` (the magnitude the existing cursed `X2b` nodes use) — so a gated branch reads as one escalating cost on one field. `name`/`desc` are generated from `SKILL_TREE_GATE_CURSE_FLAVOR_3` + `SKILL_TREE_GATE_STAT_LABEL_3`, reusing the exact phrasing of the hand-written cursed nodes. Net result: **all 100 payoff leaves in this file are now behind at least one mandatory curse**, and the file's cursed-node count is 200 of 526.
- **Effect types used** — 100% `stat`-type (both the cursed debuffs and their payoff descendants); no `unique*`/`unlock`/`poolWeight` content in this batch, which was scoped purely to node-count doubling + cursed gating, not new per-class mechanics (those were Phase 8c-2's job).
- **Cap discipline** — worst-case per-(classId, stat) sum across the *full* 40-node set (old 20 + new 20, every node bought including cursed negatives) verified to stay within `getSkillTreeStatBonus`'s symmetric `[-0.25, 0.25]` clamp for all 25 characters.
- At load, a closing loop pushes every entry of `SKILL_TREE_CHARACTER_NODES_3` onto `SKILL_TREE_NODES` and registers it in `SKILL_TREE_NODES_BY_ID`, same append pattern as the two prior character-node files.

Verification harness output (dupe/parent/cap/cursed-gate/layout checks) and recovery notes (this phase's implementer was cut off mid-task by a session rate limit; the file it had already written was independently verified complete and correct, and only the script tag + this audit were still needed): `feature-research/phase9-megaupdates/audit-skilltree-double-cursed.md`.

### achievements/skilltree-general.js

*(Phase 8d — the 25 general-upgrade skill nodes, attached under the existing `general_hub` node; **Mega A step 4** added 2 cursed gate nodes, so this file now contributes 27. At the time this file was written `SKILL_TREE_NODES` totaled 553 (528 + 25); Phase 9's `skilltree-characters-3.js` — loaded before this file — plus step 4 have since brought the running total to 1081 (1054 + 27) by the time this file's nodes are appended. Pure data appended onto `skilltree.js`'s arrays; no engine function changed. Loaded in `index.html` immediately after `achievements/skilltree-characters-3.js`.)*

- **Design** — deliberately simple compared to the character branches: 24 of the 25 nodes carry exactly one `poolWeight` or `startingPickup` effect; one node (`gen_rare_generous`) bundles two related `poolWeight` nudges. Cost `1` per node uniformly, real hand-written `name`/`desc` per node, each `desc` stated in terms of the actual effect (no templated flavor text).
- **Topology** — five hand-shaped sub-branches off `general_hub` (varied width/depth, not a repeated template):
  - **Loot Weights** (7 nodes, `gen_loot_*`) — `COMMON_CATEGORY_POOL` penny/heart category nudges, each forking into `COMMON_PENNY_POOL`/`COMMON_HEART_POOL` sub-tier nudges (nickel, dime, luckypenny, heartBlue, doubleheart).
  - **Supply Drops** (6 nodes, `gen_supply_*`) — `COMMON_CATEGORY_POOL` bomb/key category nudges, each chaining into `BOMB_TIER_POOL`/`KEY_TIER_POOL` double/gold tier nudges.
  - **Starting Supplies** (5 nodes, `gen_start_*`) — `startingPickup` effects: +1 bomb, +1 key, +3 then +2 more coins (two-node chain), +1 blue heart.
  - **Rare & Legendary Fortune** (6 nodes, `gen_rare_*`/`gen_leg_*`) — `RARE_POOL` (star/sack/battery) and `LEGENDARY_POOL` (trinket/familiar) nudges; `gen_rare_generous` is the one two-effect node, nudging both `RARE_POOL.battery` and `COMMON_HEART_POOL.halfheartBlue` together ("Generous Recovery").
  - **Chest Fortune** (1 node, `gen_chest_hub`) — a single `CHEST_TYPE_POOL.cursed` nudge, a deliberately small standalone branch (organic width variation, not padded out to match the others).
- **Cursed gates + `skillTreeGlobalDebuffEffects(stat, amount)` (Mega A step 4)** — the two strongest reward-pool sub-branches used to hang free off `general_hub`; each now sits behind one mandatory cursed gate spliced in between (`gen_rare_gate` → `gen_rare_hub`, `gen_leg_gate` → `gen_leg_hub`; each gate's `parent` is `general_hub` and the hub node's `parent` was re-pointed at its gate — the only existing field this step rewrote in the file). Both gates are `cost:1`, `cursed:true`, `-0.02` on `luck`. Because `getSkillTreeStatBonus` matches `eff.classId === classId` against a **real** class id — the engine has no `'ALL'` wildcard and this pass added no engine code — a genuinely class-agnostic debuff is expressed via **`skillTreeGlobalDebuffEffects(stat, amount)`**, a tiny module-level helper defined at the top of this file that returns `Object.keys(CLASSES).map(classId => ({type:'stat', classId, stat, amount}))`, i.e. an `effects` ARRAY with one identical negative entry per class. The four `skilltree-unlocks-*.js` files (all loaded after this one) reuse the same helper for their own gates.
- **Weight-sizing rule** — every `poolWeight` bonus was sized so that the worst case (every node targeting a given pool+id bought at once) leaves that entry's weight at roughly ≤2x its base (e.g. `COMMON_CATEGORY_POOL.penny` 25→27, `RARE_POOL.battery` 15→20 combining `gen_rare_battery`+`gen_rare_generous`, `COMMON_PENNY_POOL.luckypenny` 1→2 exactly at the 2x line since it's a single node on an already-negligible-weight entry). Verified by harness (`feature-research/phase8-metaprogression/audit-skilltree-general.md`).

### achievements/skilltree-unlocks-familiars.js

*(Phase 8e slice 3/4 — 1 hub (`unlock_familiars_hub`, child of `unlock_hub`) + 25 leaf nodes, one per new `sk8f_`-prefixed familiar in `data/familiars-1.js`; **Mega A step 4** added 7 cursed gate nodes (`sk8f_gate_1..7`), so this file now contributes 33. Pure data appended onto `skilltree.js`'s arrays; no engine function changed — `applySkillTreeUnlockEffect` already handled `{type:'unlock', category:'familiar', id}` generically. Loaded in `index.html` immediately after `achievements/skilltree-general.js`.)*

- **Topology** — five hand-shaped sub-branches off `unlock_familiars_hub` (varied width/depth, not a repeated template): Orbiting Menagerie (`fam_orbit_*`, 4 nodes, single chain), Ranged Menagerie (`fam_ranged_*`, 6 nodes: 4 shooters then 2 mirrors grafted on), Support Menagerie (`fam_support_*`, 7 nodes: 3 procs / 2 blockers / 2 scavengers in three sub-branches), Skirmisher Menagerie (`fam_skirmish_*`, 6 nodes: 2 thieves / 2 growers / 1 berserker+1 swarmer in three sub-branches), Blast Menagerie (`fam_blast_*`, 2 nodes, a flat sibling pair). Each leaf carries exactly one `{type:'unlock', category:'familiar', id:'sk8f_...'}` effect, cost 1, real hand-written name/desc describing that familiar's actual behavior/stats.
- **Cursed capstone gates (Mega A step 4)** — every branch here that runs two or more steps past a hub now ends behind ONE mandatory cursed gate, spliced between that branch's deepest leaf ("capstone") and the capstone's old parent; the capstone's `parent` field is the only existing field the step rewrote. Leaves that hang straight off a hub (`fam_ranged_tarpitcher`, `fam_skirmish_ravensnatch`) are deliberately left free. 7 gates: `sk8f_gate_1..7`, `cost:1`, `cursed:true`, `-0.02` `magnetRadius` each (one stat for the whole file, so the worst case with everything bought is `-0.14` — comfortably inside `getSkillTreeStatBonus`'s `[-0.25, 0.25]` clamp). Because the engine has no `'ALL'` classId wildcard, each gate's penalty is a genuinely universal one built with **`skillTreeGlobalDebuffEffects`** (defined in `skilltree-general.js`, which `index.html` loads before this file) — an `effects` array with one identical negative entry per class, rather than punishing one arbitrary class.
- Verification harness (loads the real data/achievements files via `node:vm`, checks id collisions, behavior-string validity against `familiars.js`'s real dispatch, tree connectivity/no-cycles/no-orphans, and every unlock effect resolving to a real familiar) + full 25-id/behavior/flavor table: `feature-research/phase8-metaprogression/audit-skilltree-unlocks-familiars.md`.
- **Pool-nudge coverage extended** — `js/systems/room.js`'s `spawnClearRoomPickup` previously left `BOMB_TIER_POOL`/`KEY_TIER_POOL` (common-tier bomb/key rolls) and `CHEST_TYPE_POOL` (legendary-tier chest roll) unwrapped. This phase wraps those three room-clear call sites with `applySkillTreePoolNudge(pool, 'PoolName')`, matching the pattern already used for `COMMON_CATEGORY_POOL`/`COMMON_PENNY_POOL`/`COMMON_HEART_POOL`/`RARE_POOL`/`LEGENDARY_POOL`. For `BOMB_TIER_POOL`/`KEY_TIER_POOL` the existing `.filter(t => !t.locked || isPickupKindUnlocked(t.id))` now runs **before** the nudge (the nudge's cloned array only carries `{id,w}` and would silently drop the `locked` flag the filter needs). `rollGenericPickupKind()`'s own `BOMB_TIER_POOL`/`KEY_TIER_POOL` rolls (the generic-pickup re-roll used by chests/sacks/sacrifice spikes — not room-clear) and the two procedural room-population `CHEST_TYPE_POOL` rolls (also not room-clear) are intentionally left unwrapped, out of scope for "room-clear reward pool" nodes.
- **`startingPickup` fields** — `bombs`/`keys`/`coins`/`blue`, matching `applySkillTreeStartingPickups`'s exact recognized set (`blue` maps to `player.blueCurrent`).

Full node-by-node table and verification harness output: `feature-research/phase8-metaprogression/audit-skilltree-general.md`.

### achievements/skilltree-unlocks-stars.js

*(Phase 8e, slice 1/4 — 26 nodes, now 34 after **Mega A step 4** added 8 cursed gate nodes (`sk8s_gate_1..8`): one new hub, `unlock_stars_hub` (child of the previously-childless `unlock_hub`), plus 25 leaves, one per new `sk8s_`-prefixed locked star in `data/collectibles.js`. Sibling slices add their own `unlock_hub` children in parallel for trinkets/familiars/items and are not touched here. Pure data appended onto `skilltree.js`'s `SKILL_TREE_NODES`/`SKILL_TREE_NODES_BY_ID`, same append pattern as `skilltree-general.js`. Loaded in `index.html` immediately after `achievements/skilltree-general.js`.)*

- Every leaf is a single `{type:'unlock', category:'star', id:'sk8s_...'}` effect, cost `1`, real hand-written `name`/`desc` describing that star's actual effect.
- **Topology** — deliberately no extra sub-hub nodes (only 26 nodes exist: 1 hub + 25 leaves); "organic branching" instead comes from letting some of the 25 leaves parent other leaves. 13 branches hang directly off `unlock_stars_hub`, ranging from a single standalone leaf (e.g. `sk8s_pyrrha`, `sk8s_medic`, `sk8s_shrine`, `sk8s_borealis`) up to 3-deep chains (e.g. `sk8s_cinder → sk8s_direstrike → sk8s_gale`, `sk8s_prospector → sk8s_quartermaster → sk8s_alchemist`).
- **Cursed capstone gates (Mega A step 4)** — every chain here that runs two or more steps past `unlock_stars_hub` now ends behind ONE mandatory cursed gate, spliced between that chain's deepest leaf and its old parent (the capstone's `parent` field is the only existing field the step rewrote); the standalone hub-level leaves are left free. 8 gates: `sk8s_gate_1..8`, `cost:1`, `cursed:true`, `-0.02` `rangeTiles` each (one stat for the whole file → `-0.16` worst case, inside the `[-0.25, 0.25]` clamp), each built with **`skillTreeGlobalDebuffEffects`** from `skilltree-general.js` so the penalty applies to every class rather than one arbitrary one (the engine has no `'ALL'` classId wildcard).
- Full branch layout, the 25 star ids, and verification harness output (id-collision check against pre-existing `STAR_TYPES`, reachability/no-cycles/no-orphans/no-duplicate-ids over the 26 nodes, `effect.category==='star'`+`effect.id` validity, and a `case`-label-vs-node-id cross-check against `stars.js`): `feature-research/phase8-metaprogression/audit-skilltree-unlocks-stars.md`.

### achievements/skilltree-unlocks-items.js

*(Phase 8e slice 4/4 — 1 hub (`unlock_items_hub`, child of `unlock_hub`) + 25 leaf nodes, one per new `sk8i_`-prefixed item appended to `data/items-5.js`; **Mega A step 4** added 6 cursed gate nodes (`sk8i_gate_1..6`), so this file now contributes 32. Pure data appended onto `skilltree.js`'s arrays; no engine function changed — `applySkillTreeUnlockEffect` already handled `{type:'unlock', category:'item', id}` generically (it's the same bucket, `unlocks.unlockedItems`, that `room.js`'s normal `!i.locked || isItemUnlocked(i.id)` pool filter already reads — no new gating mechanism needed). Loaded in `index.html` after the other three sibling `skilltree-unlocks-*.js` files.)*

- Every leaf is a single `{type:'unlock', category:'item', id:'sk8i_...'}` effect, cost `1`, real hand-written `name`/`desc` describing that item's actual effect.
- **Topology** — four hand-shaped sub-branches off `unlock_items_hub`: Offense Cache (`sk8i_offense_hub`, 9 nodes — damage/crit/pierce/rate/multishot plus 3 `attackLayer` combo items), Utility Cache (`sk8i_utility_hub`, 6 nodes — speed/range/magnet/bomb-radius/luck), Survival Cache (`sk8i_survival_hub`, 6 nodes — heart containers/lifesteal/dodge/on-kill-heal, split into two chains), On-Hit Cache (`sk8i_onhit_hub`, 4 nodes — freeze/venom/charm chances plus a ricochet-bolt item).
- The 25 items are ordinary quality-1..3 passives calibrated against existing items at the same quality (mostly single flat stat bumps like `ironshoes`/`speedup`/`luckup`; 5 reuse an existing `attackLayer` style — `knockbackPulse`, `impactBurst`, `echoShot`, `ricochetBolt`, `onKillFragments` — rather than inventing a new mechanic). Stat wiring lives in `js/systems/items-1.js`'s `recalcPlayerStats` (one `N * (p.sk8i_id || 0)` term per item at the correct existing formula site) except the two heart-container items (`sk8i_ironclasp` +1, `sk8i_secondheart` +2), which are special-cased in `js/systems/items-2.js`'s `applyPassiveEffect` alongside `hpup`/`giantsheart`.
- **Cursed capstone gates (Mega A step 4)** — this file's sub-hubs (`sk8i_offense_hub` etc.) mean "depth" is measured past a hub: every branch running two or more steps past a hub now ends behind ONE mandatory cursed gate, spliced between that branch's capstone and the capstone's old parent (the capstone's `parent` field is the only existing field the step rewrote); the many leaves hanging straight off a sub-hub are left free. 6 gates: `sk8i_gate_1..6`, `cost:1`, `cursed:true`, `-0.02` `critChance` each (one stat for the whole file → `-0.12` worst case, inside the `[-0.25, 0.25]` clamp), each built with **`skillTreeGlobalDebuffEffects`** from `skilltree-general.js` so the penalty is universal across classes (the engine has no `'ALL'` classId wildcard). Note `sk8i_bloodmarble` forks into two capstones (`sk8i_healcharm`, `sk8i_echobell`) and therefore gets two separate gates (`sk8i_gate_5`/`sk8i_gate_6`), one per fork.
- Full item/node table and verification harness output (id-collision check against the full `ITEMS` table, reachability/no-cycles/no-orphans/no-duplicate-ids over the 26 nodes, `effect.category==='item'`+`effect.id` validity, and a grep cross-check that every `sk8i_` id has a `recalcPlayerStats` stat term or an equivalent `applyPassiveEffect`/`attackLayer` wiring): `feature-research/phase8-metaprogression/audit-skilltree-unlocks-items.md`.

### achievements/skilltree-unlocks-trinkets.js

*(Phase 8e slice 2/4 — 1 hub (`unlock_trinkets_hub`, child of `unlock_hub`) + 25 leaf nodes, one per new `sk8t_`-prefixed trinket appended to `data/trinkets-2.js`; **Mega A step 4** added 10 cursed gate nodes (`sk8t_gate_1..10`), so this file now contributes 36 and `SKILL_TREE_NODES` totals **1216** once every skill-tree file has loaded. Pure data appended onto `skilltree.js`'s arrays; no engine function changed — `applySkillTreeUnlockEffect` already handled `{type:'unlock', category:'trinket', id}` generically (the same `unlocks.unlockedTrinkets` bucket every other trinket-gating path already reads/writes). Loaded in `index.html` after the other three sibling `skilltree-unlocks-*.js` files.)*

- Every leaf is a single `{type:'unlock', category:'trinket', id:'sk8t_...'}` effect, cost `1`, real hand-written `name`/`desc` describing that trinket's actual effect.
- **Topology** — no extra sub-hub nodes (only 26 nodes exist: 1 hub + 25 leaves); organic branching comes from letting leaves parent other leaves. 12 branches hang directly off `unlock_trinkets_hub`, ranging from single standalone leaves (`sk8t_fourleafpin`, `sk8t_eelskinwrap`) up to a 4-deep chain (`sk8t_hungryfangcharm → sk8t_direstingpin → sk8t_rimeclasp → sk8t_boneshakerpouch`).
- The 25 trinkets are mostly single-slot stat trade-offs in the same tone as the file's existing entries (a buff paired with a small drawback, e.g. `sk8t_ironclasp` +1 damage/-10% speed, `sk8t_glasscannon` +8% crit/-1 damage) wired as `t === 'sk8t_...'` terms into `js/systems/items-1.js`'s `recalcPlayerStats` (speed, melee/ranged damage, fire rate, range, crit chance/multiplier, luck, dodge, magnet radius, bomb radius, pierce, multishot, lifesteal, flat venom/freeze chance, shop discount). A handful (4) touch a different effect shape instead: coin value (`sk8t_giltclasp`, `combat-2.js`'s coin-pickup `coinMult` ternary), an on-kill bomb-drop chance (`sk8t_boneshakerpouch`, `combat-2.js`'s kill-drop `else if` chain, same shape as `powderpouch`), an extra-bomb-per-pickup (`sk8t_direkegcharm`, `combat-2.js`'s `case 'bomb'`, same shape as `powderflask`), and a familiar attack/proc-rate speedup (`sk8t_stormcollar`, `familiars.js` — factored the pre-existing repeated `swarmcollar` ternary out into a shared `familiarRateMult(player)` helper so both trinkets fold into the same 7 call sites without duplicating them).
- **Cursed capstone gates (Mega A step 4)** — all 10 chains here run two or more steps past `unlock_trinkets_hub` except the two standalone leaves, so all 10 now end behind ONE mandatory cursed gate spliced between the chain's deepest leaf and its old parent (the capstone's `parent` field is the only existing field the step rewrote). 10 gates: `sk8t_gate_1..10`, `cost:1`, `cursed:true`, `-0.02` each, built with **`skillTreeGlobalDebuffEffects`** from `skilltree-general.js` (universal across classes — the engine has no `'ALL'` classId wildcard). This file has twice any sibling's gate count, so unlike the other three it splits them across **two** stats — `sk8t_gate_1..5` on `speed`, `sk8t_gate_6..10` on `boltSpeed`, `-0.10` apiece — keeping every per-(classId, stat) worst-case sum well inside the `[-0.25, 0.25]` clamp instead of parking a single stat at `-0.20`.
- Full trinket/node table and verification harness output (id-collision check against the full `TRINKETS` table, reachability/no-cycles/no-orphans/no-duplicate-ids over the 26 nodes, `effect.category==='trinket'`+`effect.id` validity, and a grep cross-check that every `sk8t_` id has a `recalcPlayerStats`/combat/familiar wiring): `feature-research/phase8-metaprogression/audit-skilltree-unlocks-trinkets.md`.

### achievements/skilltree-characters-4a.js … -4e.js — Phase 10 Part B (25 more nodes/character)

*(5 files, 5 characters each, same `build(classId, defs)`-registration convention throughout: each file is a self-contained IIFE that pushes its group's nodes straight onto `SKILL_TREE_NODES`/`SKILL_TREE_NODES_BY_ID`. Loaded in `index.html` immediately after `skilltree-characters-3.js`. Full per-group design notes and cap-safety audits: `feature-research/phase10-metaprogression/audit-skilltree-group{1-5}.md`.)*

### achievements/skilltree-characters-5a.js … -5e.js — Phase 11 item 3 (50 more nodes/character, redesigned)

*(Same 5-file/5-characters-each split and `build(classId, defs)` convention as the `4a`-`4e` files above; 1250 nodes total, generated from `feature-research/phase11-skilltree-v2/`'s scratch generator rather than hand-authored — see that phase's `scope.md` for the full design log.)*

- **Topology per character**: exactly 5 branches (`m/n/o/p/q`), 10 nodes deep each — a cursed gate opener, two 3-node reward subpaths, a 2-node spine, and a cost-2 capstone. Branches `m/n/o/q` are plain stat branches (core stats only — melee/ranged damage, speed, critChance, luck, rangeTiles, boltSpeed, magnetRadius; deliberately **no status-effect chance stats** in this batch). Branch `p` ("Technique") is the one new per-character mechanic: a real Braced-vs-Reckless build choice using `uniqueField:'damageTakenMult'` (safely seeded as a real number for every class in `entities.js`'s `Player` constructor, so it needed no per-class engine work). 125 cursed gate nodes total (5/character).
- **Cap-safety**: the generator's final pass (`capacityFit` in `gen_phase11b.js`) computes each character's own new positive contribution per `(classId, stat)`, looks up the exact pre-existing sum for that pair from every OTHER skill-tree file, and scales down ONLY the stats that would actually break `SKILL_TREE_STAT_CAP` once stacked — leaving every stat with headroom untouched. Result: this batch contributes **zero** new stat-cap overages; the 11 (classId,stat) pairs that remain over cap anywhere in the full tree are confirmed 100% pre-existing (inherited from Phases 8c/9/10, predating this pass).

### data/items-6.js + achievements/skilltree-unlocks-items-2.js — Phase 11 item 4 (2nd item-unlock branch)

*(15 new `locked:true` passive items, `sk11i_`-prefixed, appended to `ITEMS` in `data/items-6.js`; unlocked one-for-one by leaf nodes under a new hub, `unlock_items2_hub` ("Sealed Reliquary"), sibling to Phase 8e's `unlock_items_hub`. Same generic gating as every other locked item — `room.js`'s `!i.locked || isItemUnlocked(i.id)` pool filter, no new engine code. `data/items-6.js` loaded in `index.html` right after `items-5.js`; `skilltree-unlocks-items-2.js` loaded right after `skilltree-unlocks-items.js`.)*

- **Topology**: hub + 6 free single-node caches (Luck/speed/pierce/magnet/lifesteal/shop-discount — cheap, broadly useful, no gate) + two 3-5-node chains each behind its own cursed gate (chain A: stun→venom→crit, gated by a universal `-2% dodgeChance`; chain B: fear→bomb-radius→dodge→crit-multiplier→on-kill-heal, gated by a universal `-2% fearChance`), both gates built with `skillTreeGlobalDebuffEffects` (`skilltree-general.js`) the same way every other cursed unlock-branch gate in the game is.
- **Stat wiring**: every item is one appended `+ amount * (p.sk11i_id || 0)` term on the matching stat's existing formula line in `js/systems/items-1.js`'s `recalcPlayerStats` (tagged `// Phase 11 item 4` at each site) — the exact same generic per-item-id counting convention `sk8i_`/every other passive item uses; no new formula lines, no `applyPassiveEffect` special-casing needed since none of the 15 is a heart-container or other non-formula effect.
- Full node/item table, generator scripts, and cap-safety verification output: `feature-research/phase11-skilltree-v2/scope.md` (Item 3 + Item 4 sections).

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

**`spawnClearRoomPickup(game)`** — THOROUGH. The universal room-clear reward: skipped outright for boss rooms (stairs already spawn there). Rolls a tier from `CLEAR_REWARD_CHANCE` (15% nothing / 65% common / 15% rare / 5% legendary by default), adjusted by Fortune Shell (`player.passives.fortuneshell`) which shifts 60% of the "nothing" slice into "legendary" instead. `common` tier rolls a category from `COMMON_CATEGORY_POOL` (penny/heart/bomb/key) and resolves via `spawnResolvedPickup`. `rare` tier filters `RARE_POOL` by achievement-pickup-kind unlock state and spawns one. `legendary` tier rolls `LEGENDARY_POOL`: `'trinket'`/`'familiar'` grant directly via `equipTrinket`/`addFamiliar` (items.js, which handle their own sound/toast/float-text), else (including trinket/familiar pool exhaustion) falls to a chest. Called by game.js's `onRoomJustCleared`. **Phase 8b, extended Phase 8d**: every `Util.weighted(...)` call against `COMMON_CATEGORY_POOL`/`COMMON_PENNY_POOL`/`COMMON_HEART_POOL`/`RARE_POOL`/`LEGENDARY_POOL`/`BOMB_TIER_POOL`/`KEY_TIER_POOL`/`CHEST_TYPE_POOL` in this function is wrapped with `applySkillTreePoolNudge(pool, 'PoolName')` (`achievements/skilltree.js`), letting an owned general-upgrade skill node (`achievements/skilltree-general.js`, Phase 8d) nudge one entry's weight up. `BOMB_TIER_POOL`/`KEY_TIER_POOL`'s `.filter(t => !t.locked || isPickupKindUnlocked(t.id))` runs before the nudge so the clone (which only carries `{id,w}`) doesn't lose the `locked` flag the filter needs. `CLEAR_REWARD_CHANCE`'s own tier roll and the Fortune Shell shift are untouched.

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
  6. Computes speed multiplier: `onMud` (0.5x, re-checked every frame, no lingering timer) and `miredInOwnFire` (`player.fireZoneRootMult`, defaulting to `0.25` — a per-instance field as of Phase 8b-uniquefx, was a hardcoded `0.25` constant — while holding green fire) both apply on top of `player.speed * max(speedBoostTimer>0?1.5:1, player.starSpeedMult)` — Note: speed-boost item and star speed bonus use `Math.max`, not multiplication, so they don't stack multiplicatively.
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

**`playerCrystalVolleyAttack(game, input)`** — Crystal Pony's shard volley, fired from `player.crystalShardCount` points across her flank (perpendicular to facing), each independently aimed at a shared focal point (mouse cursor world position, or a point straight ahead for keyboard aiming) so the shards converge rather than travel parallel. As of Phase 8b-uniquefx, shard count is a per-instance `Player` field (`crystalShardCount`, seeded to `3` in the constructor when `def.crystalVolley` is set — see entities.js's shadow-field note above) rather than a fixed array: offsets are computed as `(i - (count-1)/2) * CRYSTAL_VOLLEY_SPACING` for `i` in `0..count-1` (`CRYSTAL_VOLLEY_SPACING = 34`), which reproduces the original `[-34, 0, 34]` exactly when `count` is still `3`. `count <= 0` bails with no shots fired (defensive, not currently reachable — base is always `3` for Crystal Pony). `life=999` uncapped regardless of `rangeTiles`/`unlimitedRange` — travels however far the room actually is. Each shard tagged `attackTrigger='volley'`. Ends with one `runCastLayers(game,'volley',...)` call.

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
  1. `player.onKill()`, death sound, `enemiesKilled` stat, first-kill bestiary discovery toast (non-boss only — bosses already get their own fanfare). **Phase 12 visual pass** — a boss kill also calls `FX.hitStop(0.06)`: `render.js`'s hit-stop mechanism (a brief full-simulation freeze, `game.js`'s `update()` already checks `FX.frozen()`) existed fully wired end-to-end but had never actually been triggered from anywhere until this. Deliberately boss-only, not every kill/crit — those happen far too often on a fast build for a freeze-frame to feel good rather than laggy; a boss death is rare and big enough to earn it.
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
for the attack-layers pass. **Phase 8b**: the very last statement in the
function body is `applySkillTreeStatBonuses(player)` (`achievements/
skilltree.js`), which multiplies each of `SKILL_TREE_STAT_FIELDS` by
`1 + <owned skill-tree bonus for this class/stat, clamped to ±25%>` —
applied last so it scales the fully-derived value rather than being
overwritten by anything above it. Nothing here is incremental — every stat is a sum
of `(count || 0) * weight` terms across every item/trinket/achievement-trophy
that touches it, so recalculating fully is what keeps behavior correct
regardless of pickup order and lets a run always be re-derived cleanly.

**Phase 9 balance audit**: a script-driven statistical outlier pass ran over
every `ITEMS`/`TRINKETS` coefficient in `recalcPlayerStats` (grouped by
quality tier + target stat for items, by target stat for trinkets) and every
hand-authored skill-tree `stat`-type node (`skilltree-characters-2.js`,
grouped by target stat) — flagging anything >2.5 stdev from its group mean
AND >=2x the group mean. One genuine outlier was found and fixed
(`downyfeather`'s speed coefficient, 0.20→0.15, matched to its direct peer
item `speedup`); everything else in scope was already consistent. See
`feature-research/phase9-megaupdates/audit-balance-pass.md` for the full
extraction-script output, group data, and verification — not duplicated here.

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

Mega Update A step 5 update: all five conditions and all five sets of numbers
now live in `SYNERGY_COMBOS` (see `systems/items-synergy.js` below). The five
`player.<name>Active` fields are set by `applySynergyComboFlag()` at the same
points in `recalcPlayerStats` where they used to be computed by hand, and each
numeric site (including Pack Bond's speed-multiplier term and Twin Fangs'
`critChance` term, which used to re-check their conditions inline) now reads
`comboBonus(player, comboId, field)` instead of a hardcoded literal. The
values are unchanged — verified byte-identical old-vs-new by
`feature-research/phase9-megaupdates/verify-step5-synergy.js`.

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

#### Mega Update A step 5 — `systems/items-synergy.js`

New file, loaded in `index.html` between `systems/items-1.js` and
`systems/items-2.js`. Two additive layers on top of `recalcPlayerStats`, plus
the registry the 5 legacy synergies above were migrated into. **All five
synergy descriptions above still describe the live behaviour exactly — the
conditions and numbers simply live in `SYNERGY_COMBOS` now instead of being
typed into `recalcPlayerStats`.**

- **`SYNERGY_COMBOS`** — the single source of truth for item-item (and
  item-state) synergies. Entry shape:
  `{ id, name, desc, flag?, items?, anyOf?, when?, effects?, stage? }`.
  `items` = every listed id must be owned (`player.passives[id] > 0`);
  `anyOf` = an array of groups, each needing at least one owned item;
  `when(player, p)` = an extra predicate for state-derived synergies (stat
  thresholds, familiar counts); `flag` = the `player.<flag>` boolean the HUD
  synergy badges read (`ui/ui.js`'s `SYNERGY_BADGES`); `effects` =
  `[{field, amount, min?, max?}]` stat bonuses. A combo with only a `flag`
  and no `effects` is a valid flag-only combo. Seeded with the 5 legacy
  synergies (`ecosystemSet`, `rotAndRuin`, `marksmansEye`, `packBond`,
  `twinFangs`), all `stage:'legacy'`.
- **`stage: 'legacy'` vs `'post'` (default)** — legacy entries keep their
  original evaluation POSITION inside `recalcPlayerStats`, because their
  numbers sat inside that function's own clamp expressions
  (`Math.max(0.5, …)` on melee/rangedDamage, `Math.min(4, …)` on
  critMultiplier, `Util.clamp(1 + …, 0.25, 2.2)` on the speed multiplier) and
  two of their conditions read stats `skilltree.js` later modifies. Moving
  them to the end of the function would have changed their values (a ranged
  class with `meleeDamage: 0` floors at 0.5 today, but would become 0.8).
  So recalc calls `applySynergyComboFlag()` where each flag used to be
  computed and `comboBonus()` where each number used to be typed;
  `applyItemComboSynergies` skips `stage:'legacy'` entries entirely so they
  can never be applied twice. NEW combos are `stage:'post'` and are applied
  wholly at the end of recalc.
- **`applySynergyComboFlag(player, comboId)`** — evaluates one combo now,
  stores `player[combo.flag]`, returns the boolean.
- **`comboBonus(player, comboId, field)`** — the summed `effects` amount that
  combo grants to one field right now, or 0 when inactive. Reads the stored
  flag when the combo has one, so the condition is evaluated once per recalc.
  Legacy entries may name a pseudo-field here (`packBond`'s `speedMult` is a
  term in recalc's speed MULTIPLIER, not a player field) — legal only because
  `stage:'legacy'` entries never reach the field writer.
- **`isSynergyComboActive(player, combo)`** — the `items`/`anyOf`/`when`
  evaluator shared by all of the above.
- **`applyItemComboSynergies(player)`** — called at the end of
  `recalcPlayerStats`: sets every non-legacy combo's flag and folds its
  effects into the player's stats through the shadow-base writer.
- **`classSynergy` (new optional item data field)** — declared on an item's
  `data/items-N.js` entry as
  `classSynergy: { <classId>: { field, amount } }`. Lets one item mean
  something different for each of the 25 classes instead of granting the same
  flat stat to everyone. Only classes with a deliberately-authored unique
  interaction need an entry; a class with no entry gets no class-specific
  bonus from that item. Amounts are multiplied by the owned count.
- **`applyItemClassSynergyBonuses(player)`** — called at the end of
  `recalcPlayerStats` (right before `applyItemComboSynergies`): walks
  `ITEM_LIST`, sums every owned item's `classSynergy[player.classId]` entry
  per field, clamps the SUM once, and writes it through the shadow-base
  writer. Bases are dropped wholesale if `player.classId` ever changes.
- **`ITEM_SYNERGY_FIELDS`** — the sanctioned numeric target channels (the 26
  stats `recalcPlayerStats` assigns exactly once each, unconditionally).
  Anything else in a `classSynergy`/combo effect is ignored. `attackType` is
  deliberately absent (a per-class string, not an item-mutable number), as
  are the boolean synergy OUTPUT flags.
- **`ITEM_SYNERGY_DEFAULT_CLAMP` / `ITEM_SYNERGY_FIELD_CLAMPS` /
  `itemSynergyClamp(field)`** — clamp discipline. Percentage-scale fields use
  the skill tree's ±0.25 convention (`SKILL_TREE_STAT_CAP`); non-percentage
  fields carry their own flat clamp (`meleeDamage`/`rangedDamage`/`luck` ±3,
  `speed` ±20 px/s, `meleeRange` ±16 px, `boltSpeed` ±60, `meleeCooldown`/
  `fireCooldown` ±0.15 s, `critMultiplier` ±1, `multishotExtra` ±2,
  `magnetRadius` ±40, `bombRadiusMult` ±0.25). The clamp applies to the SUM
  of all contributions to that field, per layer.
- **`applySynergyFieldBonuses(player, groups, bases, last, bounds)`** — the
  shared shadow-base writer. `recalcPlayerStats` runs on every pickup, so a
  plain `player.field += x` would compound over the run; this instead keeps
  the pristine value on the caller's `_…Base` map and recomputes
  `player[field] = base + clamp(bonus)`. Unlike
  `skilltree.js`'s `applySkillTreeUniqueFieldBonuses` (which captures ONCE,
  because it targets shadow fields recalc never rebuilds), every field these
  layers target IS rebuilt from scratch each recalc, so the base is
  **re-captured each pass**, guarded by a `_…Last` map holding the value the
  layer last wrote: if a field still holds exactly that, the layer recognises
  its own output and reuses the stored base instead of folding the bonus into
  it. Fields that were bonused on an earlier pass but have no bonus now are
  still visited, so dropping the last contributing item restores the pristine
  value.

Scope contract for the step-5 content slices:
`feature-research/phase9-megaupdates/step5-target-items.md` lists the exact
250 items in scope and each one's assigned role
(`classSynergy` / `combo` / `tradeoff`). Slice implementers add item
`classSynergy` fields and new `SYNERGY_COMBOS` entries only; the core
functions in `items-synergy.js` are not theirs to change.

##### Step-5 content slice — `data/items-4.js` (40 items)

The `items-4.js` slice of the 250-item redesign. Every item in this file is
`locked:true` (achievement-gated), which is in scope by the step-5 deviation
note — the trophies are ordinary flat-stat items that simply need an unlock
first, so they are redesigned like any other.

- **30 `classSynergy` rows** — the mastery tier-1 / exploration trophies plus
  five `newrewards`-batch charms (`ashencloak`, `ashensigil`, `ashentalisman`,
  `crackedamulet`, `fortunaterelic`, `runicpendant`, `runicrelic`,
  `weatheredidol`). Each carries 3-4 class entries chosen for classes the item
  genuinely reads differently for (Kirin/Zebra cure poison, Windigo turns dread
  to frost, Engineer Pony repacks powder, Mule refuses to hurry and leans in,
  and so on); classes with no entry are the intended default. Amount bands, all
  well inside `ITEM_SYNERGY_FIELD_CLAMPS`: chance fields 0.04-0.06, `luck` 1,
  `speed` 8-10 px/s, `meleeDamage`/`rangedDamage` 0.5-0.6, `meleeRange` 8 px,
  `boltSpeed` 30-40, `meleeCooldown`/`fireCooldown` -0.03 to -0.04 s,
  `critMultiplier` 0.25, `magnetRadius` 20, `bombRadiusMult` 0.08-0.12,
  `bossDamageBonus` 0.05-0.06, `bossDamageTakenMult` -0.05. Every desc names
  the classes and the number in-fiction.
- **4 new `SYNERGY_COMBOS` entries** (all default `stage:'post'`, appended
  below the `// --- NEW combos` marker): `turretSweep` (East + West + X Turret
  Buster Trophies -> +4% crit/stun/freeze), `frostboundCrown`
  (`gildedcrown` + X trophy -> +6% freeze, +3% lifesteal), `weightedPrecision`
  (`heavyamulet` + East trophy -> +4% crit, +0.25 crit multiplier), and
  `prospectorsHoard` (`anyOf`: the Rock Breaker Trophy plus any one of
  `luckup`/`ascendantcharm`/`puritycharm`/`gildedcompass` -> +1 Luck, +15
  magnet radius — cross-slice by id string only, no other data file edited).
  **None declares a `flag`**: the badge spans live in `index.html`'s
  `#synergyBar`, outside this slice's permitted edit set, and a flag with no
  span would be set but never shown. Each participating item's desc names its
  combo instead.
- **4 `tradeoff` rows** — quality-3 mastery tier-2 trophies, each given a real
  Soy-Milk drawback as an additive negative term in `recalcPlayerStats`
  (`systems/items-1.js`, all tagged `Mega Update A step 5 (items-4.js slice)`),
  and each drawback stated in the item's `desc`:
  `masterytrophy_meleekills_t2` -1 tile in `rangeBonusTiles` (melee feels 25%
  of it via `rangeScale`), `masterytrophy_rangedkills_t2` -1 in BOTH the
  `meleeDamage` and `rangedDamage` sums, `masterytrophy_critslanded_t2`
  **+0.10** on `bossDamageTakenMult` (the one term in that formula that adds
  rather than subtracts — its `Math.max(0.25, …)` is a floor on the multiplier,
  so the penalty is never clipped), `masterytrophy_bombsplaced_t2` -0.15 on
  `bombRadiusMult`.

##### Step-5 content slice — `data/items-2.js` (40 items)

The `items-2.js` slice of the 250-item redesign: **29 `classSynergy` rows +
11 `combo` rows, no `tradeoff` rows** (this file has only 2 quality-3 items, so
the step-5 selection redistributed its tradeoff share to `items-5.js` — see the
infra audit's deviation 4).

- **29 `classSynergy` rows** — grouped by what the item physically is rather
  than by which stat it grants, so each one reads differently for a handful of
  the 25 classes and is deliberately silent for the rest: mobility charms favour
  the slow-legged (`amberfragment`) or the winged (`gustwovenveil`), plating and
  magnets favour the machine-framed (`antiturretplating`, `junkyardmagnet`),
  drain trinkets favour the drinker breeds (`bloodstoneamulet`, `quietorb`),
  horn-worn range items favour casters (`sapphiretiara`, `etchedseal`), and the
  heart/invulnerability items reroute to `dodgeChance` for the classes that
  physically cannot use them (`sunkissedpelt` for Pony Bot and Kirin, both
  `noRedContainers`; `emergencyrations` likewise). Amount bands, all inside
  `ITEM_SYNERGY_FIELD_CLAMPS`: chance fields 0.04-0.08, `speed` 6-8 px/s,
  `meleeDamage`/`rangedDamage` 0.4-0.6, `meleeRange` 6-10 px, `boltSpeed` 25-45,
  `meleeCooldown`/`fireCooldown` -0.03 to -0.04 s, `magnetRadius` 20-30,
  `bombRadiusMult` 0.1-0.15, `multishotExtra` 1, `bossDamageBonus` 0.06-0.08,
  `bossDamageTakenMult` -0.05, `luck` unused here. Every desc names the classes
  in-fiction.
- **One deliberately NEGATIVE `classSynergy`** — `swarmrepellent` gives
  Changeling / Changedling / Changeling Queen `speed: -4` (the repellent works
  on bug-blooded ponies too) while Breezie and Filly gain +8. It is stated in
  the desc. This is per-class asymmetry, not a `tradeoff`-role drawback.
- **4 new `SYNERGY_COMBOS` entries** (all default `stage:'post'`, appended below
  the `// --- NEW combos` marker, all plain `items` ownership tests):
  `rotwardensVigil` (`hollowcompass` + `roaringcoin` + `venomouskiss` -> +6%
  venom, +5% vulnerable), `frostboundHush` (`braidedinsignia` +
  `whisperingidol` + `smokebomb` -> +5% freeze, +5% stun), `maskedCourt`
  (`mesmerizingveil` + `dreadcloak` -> +5% charm, +5% fear), and
  `prospectorsEye` (`coincollectorsglove` + `gildedcompass` + `keeneye` -> +1
  Luck, +4% crit, +4% shop discount). Each participating item's desc names its
  combo by name.
- **No new combo declares a `flag`, and `ui/ui.js` is unchanged.** Not (only)
  because the badge spans live in `index.html`: `verify-step5-synergy.js`'s
  OLD-vs-NEW section diffs **every** field on the player object, and the OLD
  build omits `items-synergy.js` entirely, so any new flag shows up there as
  `old=undefined new=false` and fails equivalence (measured: 4 flags x 5 classes
  x 2 saves x 2 calls = 80 failures). **A new combo flag is therefore not
  addable without also updating that harness** — noted for whoever owns it.
- **Clamp note (by design, not a bug):** a player owning *every* item in this
  slice at once would exceed the per-field clamp on 5 class/field pairs
  (Crystal Pony and Alicorn `magnetRadius` 45 vs 40, Alicorn `boltSpeed` 70 vs
  60, Kelpie `meleeRange` 18 vs 16, Diamond Dog `bombRadiusMult` 0.30 vs 0.25).
  The clamp applies to the summed layer, so those simply cap out — the budget is
  shared across the whole `classSynergy` channel exactly as documented.

##### Step-5 content slice — `data/items-5.js` (105 items)

The largest slice of the 250-item redesign: **82 `classSynergy` rows +
23 `tradeoff` rows, no `combo` rows.** `items-5.js` absorbed `items-2.js`'s
tradeoff share (infra-audit deviation 4), which is why its tradeoff count is
23 rather than the base 5-ish — every one is a quality-3/4 item that was pure
upside before this pass.

- **82 `classSynergy` rows** — authored by what the item *is* rather than by
  which stat line it prints, so each names 2-3 classes and is deliberately
  silent for the other 22+: the trophy/stat charms favour the class whose
  identity that stat already is (Sea Pony and Windigo, the two slowest casters,
  get the recharge trophies; Kelpie and Crystal Pony, the slowest legs, get the
  speed trophies), the actives reroute to whatever the class can actually use,
  and the **heart-container items reroute entirely for the classes that
  physically cannot take a container** — `halegirth` gives Pony Bot and Kirin
  (`noRedContainers`) `bossDamageTakenMult: -0.1` instead, `hallowedheart`
  likewise for Pony Bot / Kirin / Breezie. Amount bands, all inside
  `ITEM_SYNERGY_FIELD_CLAMPS`: chance fields 0.04-0.06, `luck` 1-2, `speed`
  5-10 px/s, `meleeDamage`/`rangedDamage` 0.4-1, `meleeRange` 8 px, `boltSpeed`
  30-40, `meleeCooldown`/`fireCooldown` -0.02 to -0.06 s, `critMultiplier`
  0.2-0.4, `magnetRadius` 20-25, `bombRadiusMult` 0.08-0.15,
  `bossDamageBonus` 0.05-0.08, `bossDamageTakenMult` -0.05 to -0.1,
  `dealDiscount` 0.25, `shopDiscountBonus` 0.05-0.08. Every desc names the
  classes in-fiction.
- **No new `SYNERGY_COMBOS` entries and no `ui/ui.js` change** — the step-5
  target list assigns this file **zero `combo`-role rows** (82 + 23 = 105), so
  the registry and the HUD badge list are untouched by this slice.
- **23 `tradeoff` rows** — each drawback is an additive **negative term in
  `recalcPlayerStats`** (`systems/items-1.js`, eight blocks all tagged
  `Mega Update A step 5 — items-5.js tradeoff drawbacks`), and each is stated in
  the item's `desc`. By channel:
  - *speed multiplier* -0.05 to -0.08: `beckoningvestment`, `feintingsigil`,
    `haleribcage`, `mastervaultkey`, `sleetedcirclet`.
  - *`meleeDamage` and `rangedDamage`* -0.5: `emberwick`, `lopingreliquary`
    (both channels); `crackedrune`, `asheneffigy` (ranged only — the
    `Math.max(0.5, …)` floor means a melee class simply never feels these).
  - *`rateDenom`* -0.06 to -0.08: `longeffigy`, `numbingmantle`. `rateDenom` is
    the **divisor** (`rateMult = 1 / rateDenom`), so a negative term here makes
    attacks *slower* — the opposite sign convention from every other penalty.
  - *`luck`* -1: `blessedhalo`, `forsakensignet`, `crackedpendant` (each also
    costs -0.6% on every luck-scaled on-hit status via `luckBonus`).
  - *`dodgeChance`* -0.04: `crackedcloak`, `hallowedpendant`.
  - *`critChance`* -0.04 to -0.06: `deepgauntlet`, `forsakenlocket`,
    `whirringeffigy`, `monarchbracer`.
  - *`bossDamageTakenMult`* **+0.10/+0.12**: `blastmaster`, `martyrsvow`,
    `ancientcloak` — the same add-don't-subtract trick the `items-4.js` slice
    documents above; that formula's `Math.max(0.25, …)` is a floor on the
    multiplier, so the penalty is never clipped.

##### Step-5 content slice — `data/items-1.js` (65 items)

The `items-1.js` slice of the 250-item redesign: **19 `classSynergy` rows +
38 `combo` rows + 8 `tradeoff` rows**. It is the only slice whose quota spans
all three roles and whose rows include **active** items, which is what makes it
the slice that ran into the layers' one structural limit (below).

- **The active-item limitation.** Both synergy layers resolve ownership out of
  `player.passives`, and an ACTIVE item never lands there — `items-2.js`'s
  `applyItemToPlayer` routes `type:'active'` to `player.pickupActiveItem(item)`
  instead, and nothing else ever writes `player.passives`. A `classSynergy` map
  on an active item is therefore **dead data**, and so is any combo that names
  an active in `items`/`anyOf`. Eleven of this slice's 65 rows are actives
  (7 `classSynergy`, 2 `combo`, 2 `tradeoff`), so they are handled through the
  two documented escape hatches instead:
  - the 7 active `classSynergy` rows carry **no `classSynergy` field** and are
    expressed as `SYNERGY_COMBOS` entries whose `when` predicate tests
    `player.activeItem.id` together with `player.classId` (nothing to
    double-apply if the layer is ever extended to cover actives);
  - the 2 active `combo` rows (`bombsatchel`, `largepenny`) join combos that
    keep their passive members in `items` and add the active as a `when` clause;
  - the 2 active `tradeoff` rows (`thundercloud`, `blinkcrystal`) get additive
    negative terms in `recalcPlayerStats` guarded on
    `player.activeItem && player.activeItem.id === '…'`.
  **Caveat, by construction:** `pickupActiveItem` does not call
  `recalcPlayerStats`, so an active-item-conditioned bonus or penalty lands on
  the *next* recalc (any pill/star/item/familiar pickup) rather than instantly.
  It is rebuilt from scratch every pass, so it never compounds and never
  lingers past that one delay.
- **12 `classSynergy` rows** (the passive ones): `spikedbard`, `nightlens`,
  `damageup`, `firerateup`, `hpup`, `coinmagnet`, `seraphplume`,
  `seraphshield`, `starlitcompass`, `infernalcompass`, `featherweight`,
  `wraithrounds`. Each names exactly 3 classes and is deliberately silent for
  the other 22. The recurring design move is **rerouting an item the class
  physically cannot use**: `hpup` and `seraphplume` give Pony Bot and Kirin
  (`noRedContainers`) `bossDamageTakenMult`/`dodgeChance` instead of a heart;
  `firerateup` gives the charge-attackers (Dragon, Crystal Pony) ranged damage
  instead of pace, since a charged shot barely feels a cooldown cut;
  `wraithrounds` is silent for every melee class because spectral bolts mean
  nothing to them. Amount bands, all inside `ITEM_SYNERGY_FIELD_CLAMPS`: chance
  fields 0.04-0.08, `luck` 1-2, `speed` 8-12 px/s, `meleeDamage`/`rangedDamage`
  0.3-0.8, `boltSpeed` 40, `fireCooldown`/`meleeCooldown` -0.02 to -0.04 s,
  `magnetRadius` 30, `shopDiscountBonus` 0.05, `bossDamageBonus` 0.08,
  `bossDamageTakenMult` -0.06 to -0.08. Every desc names its classes and
  numbers in-fiction.
- **19 new `SYNERGY_COMBOS` entries** (all default `stage:'post'`, appended
  below the `// --- NEW combos` marker). Twelve are ordinary ownership combos
  over the 38 `combo`-role items, grouped by the target list's
  `combo group hint` column: `bloodTithe` (hearts-1), `gallopsGrace` (speed-1),
  `demolitionKit` + `satchelCharge` (bombs-1), `courtOfWhispers`
  (charm-fear-1), `concussivePair` (stun-1), `fatPurse` (economy-1),
  `killingEdge` (crit-1), `wardedPilgrim` (boss-1), `twinVenoms` (venom-1),
  `guidedVolley` (range-1), `fortunesTrine` (luck-1). The other seven are the
  active-item class stand-ins described above: `moonshardResonance`,
  `vialOfNerve`, `huntersEye`, `moonlitAffinity`, `dawnriderWings`,
  `hollowVessel`, `bargainOfBlood`. **None declares a `flag` and `ui/ui.js` is
  unchanged** — for the reason the `items-2.js` slice documents above (a new
  flag reads as `old=undefined` / `new=false` in `verify-step5-synergy.js`'s
  OLD-vs-NEW field diff and fails equivalence), and because the badge spans
  live in `index.html`, outside the slice's permitted edit set. Each
  participating item's desc names its combo by name instead.
- **8 `tradeoff` rows** — quality-3/4 items that were pure upside, each given a
  Soy-Milk drawback as an additive negative term in `recalcPlayerStats`
  (`systems/items-1.js`, all tagged
  `Mega Update A step 5, items-1 slice — … tradeoff drawback`), and each
  drawback stated in the item's `desc`:
  - `secondwind` -1 in BOTH the `meleeDamage` and `rangedDamage` sums.
  - `multishot` -0.5 on `rangedDamage` only — the classic split-shot cost.
  - `luckyclover` -0.05 on `critChance`.
  - `radiantburst` -0.10 on `rateDenom` (the **divisor**, so a negative term
    makes attacks *slower* — same inverted sign convention the `items-5.js`
    slice notes above).
  - `brimstonevial` -0.10 inside the `speed` multiplier.
  - `prismveil` -40 on `boltSpeed`. `boltSpeed` is a **flat assignment**
    (`player.def.boltSpeed || 340`), not a sum, so this one rides on its own
    follow-up line right after that assignment, floored at 120 so no stack of
    copies can stall a bolt outright.
  - `thundercloud` -0.10 inside the `speed` multiplier and `blinkcrystal` -0.06
    on `dodgeChance`, both guarded on `player.activeItem.id` (see the
    active-item limitation above).
  Two of these can drive a stat negative on a character with no other source
  (`critChance`, `dodgeChance`). That is harmless — `Util.chance(p)` is
  `Math.random() < p`, false for any negative — and it is the intended shape:
  the drawback only truly costs you once you have the stat to lose.

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

- **`DONATION_CAP = 5000`** — lifetime cap (across all runs) on coins fed to
  the donation machine (raised from 1000 in the meta-progression engine pass).

- **`DONATION_SKILL_POINT_INTERVAL = 25`** — every 25c ever donated (tracked
  independently of the achievement ladder below) pays 1 skill point via
  `achievements/logic.js`'s `awardDonationSkillPoints(game)`, called from
  `tryDonateMachine` right after `bumpStat('donationTotal', ...)`.

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
  float text, calls `bumpStat('donationTotal', 1, game)` — that stat's own
  threshold-crossing logic (every 50c up to 1000c, then every 1000c up to
  `DONATION_CAP`) unlocks the "Donations" achievement category
  (`achievements/defs-1.js`), which grants each kind's -1c discount (up to
  1000c) or a flat skill-point bonus (the four milestones past 1000c) via
  `unlockAchievement`'s `def.shopDiscount`/`def.skillPoints` handling — then
  calls `awardDonationSkillPoints(game)`, which independently pays 1 skill
  point per full `DONATION_SKILL_POINT_INTERVAL` (25c) of lifetime
  `donationTotal`, tracked against `unlocks.stats.donationSkillPointsAwarded`
  so it can never double-pay across saves/reloads.

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

- **`startRun(classId)`** — begins a new run: builds `new Player(classId)`, then (Phase 8b) `applySkillTreeStartingPickups(this.player)` (`achievements/skilltree.js` — grants any owned `'startingPickup'`-type skill node's bonus bombs/keys/coins/blue hearts), then `recalcPlayerStats`, sets `state='playing'`, resets `floorsClearedNoDamage`/`floorBranch`/`floorPath`/`runElapsed`/`runKills`, bumps the `runsStarted` stat, calls `beginRunUnlocks()` (freezes which items/pickups this run may roll), rolls `pillEffectMap` (color→effect, fresh per run) and resets `pillIdentified`, reads `loadUnlocks()` to set `maxFloorsThisRun` (8 if Polish DNB defeated, else `BASE_MAX_FLOORS`), then calls `this.startFloor(0)`. Called by main.js's `startGameWithClass`.

- **`startFloor(floorNum)`** — generates the dungeon (`generateDungeon(floorNum)`), marks the current stage seen in the bestiary (branches on `floorPath==='C'`, `floorNum===12`, floor 8+ branch, or normal `STAGES` lookup — see `stageIndexForFloor`), then resolves and stashes the floor's background track on `this.currentFloorTrackId`: `if (!this.floorPath) { this.currentFloorTrackId = STAGE_MUSIC_TRACKS[STAGES[stageIndexForFloor(floorNum)].id] || null; } else if (this.floorPath === 'C') { this.currentFloorTrackId = cMusicTrackFor(floorNum); } else if (this.floorPath === 'D') { this.currentFloorTrackId = dMusicTrackFor(floorNum); } else { this.currentFloorTrackId = null; } if (this.currentFloorTrackId) Sound.startMusic(this.currentFloorTrackId); else Sound.stopMusic();` — stashed rather than just called unconditionally like it used to be, because `enterRoom` (below) now overrides this with a room-type track (`ROOM_MUSIC_TRACKS`, `economy.js`) for as long as the player stands in a themed room, and needs to know what to restore on leaving; `startFloor` itself still starts the floor's track directly since every start-of-floor entry is into the start room, which has no `ROOM_MUSIC_TRACKS` entry, so `enterRoom`'s own logic would resolve to the same track anyway — this just avoids a redundant double lookup on floor 0. The plain-route branch covers the WHOLE route now (no `floorNum <= OLD_MAIN_ROUTE_FINAL_FLOOR` gate any more): that gate used to stop the lookup short of the Phase 10 stages (frozendesert..hyperspace), leaving their `MUSIC_TRACKS` entries wired but unreachable in an actual run, since `STAGE_MUSIC_TRACKS`/`stageIndexForFloor` already handle the full floorNum range safely on their own. The C-branch calls `cMusicTrackFor(floorNum)`, the D-branch calls `dMusicTrackFor(floorNum)` (both `stages.js`), the audio equivalents of `cPaletteFor`/`dPaletteFor`'s region splits. Any stage/region with no entry in its table falls through to `stopMusic()` — currently unreachable for all three tables since every entry in each is now filled, but kept as each table's designed fallback for anything added later without a track yet. Both `startMusic`/`stopMusic` are idempotent (see their own doc comments in `audio.js`), so this runs unconditionally on every floor transition without needing its own "already playing" tracking: two floors of the same stage never restart the loop, and leaving for any other stage/branch fades it out exactly once. Applies Night Owl's Feather/Spectral Token/compass trinkets to pre-reveal room "seen" flags, resets several per-floor player flags (`secondWindUsedThisFloor`, `tookDamageThisFloor`, `unlimitedKeysFloor`, `unlimitedBombsFloor`), grants various floor-entry trinket/passive bonuses (Whispering Key, Vault Cracker, Guardian Feather, Blast Cap, Tiny Battery, Warding Sigil, Skeleton Pin, Toll Pouch, Soul Candle, Pilgrim's Flask), updates the lifetime `deepestFloor` stat (toasts a personal-best), unlocks `deepdiver` achievement at floor 8 (only when `floorPath` is null — floorNum 8 is 9C on the C-branch and 9D on the D-branch), then resolves `pendingBossType`: if `floorPath==='C'` it bumps `cBranchFloorsVisited` and maps floorNum 5/7/8/9/10/11 to Drenched/Brazil/Israel Prime/Monsoon/Mangrove/Kirk (Phase 7a inserted 10C/11C and moved Kirk, unchanged, from 10C to 12C); if `floorPath==='D'` it bumps `dBranchFloorsVisited` and maps floorNum 4/6/9 to Astrolabe/Orrery/The Singularity — one superboss at the end of each of the branch's three regions; otherwise a long if/else chain keyed on `floorNum` (5/7/8/9/10/11 per branch, then Phase 7a's linear 12 → Wobbler, 13 → Subdrop, 14 → The One True DNB). Every path falls back to `resolveGenericBoss` for its unscripted floors. Finishes by calling `this.enterRoom(this.dungeon.start, null)`.

- **`enterRoom(node, enteredSlot)`** — the workhorse for moving the player into any room: calls `ensureRoomBuilt(node)` (room.js), clears `player.fireZone` (Changeling green fire), determines if this is the dungeon's one true designated boss room and calls `populateRoom(node, dungeon, {floorBranch, bossType?})`, sets `currentRoom = node`, resets the reroll-altar use counter, re-arms Sprinter's Band's `speedBoostTimer`, marks encountered obstacle kinds seen in the bestiary, clears any expired "for-the-room" star buffs (`starDamageBonus`/`starSpeedMult`, calls `recalcPlayerStats`), resets `tookDamageThisRoom`, tracks `firstVisit`/`discovered`/`visited` flags and bumps first-visit room-type stats (petshop/curse/crystal/star/treasure/shop/secret/sacrifice/vault/challenge/sombra), calls `markBestiarySeen('seenRoomTypes', node.type, this)` unconditionally (idempotent), marks paired-slot neighbor rooms `seen`, clears all transient per-room arrays (`projectiles`/`bombs`/`explosions`/`floatTexts`/`swingFX`/`laserFX`), positions the player at the entered door slot (or room center if none), then — Phase 6a overhaul, immediately after both position-setting branches, unconditionally — hard-snaps every `player.familiars` entry and every `player.changelingMinions` entry's `x`/`y` to the player's freshly-set spawn position (a plain loop, safe no-op on the empty arrays every other class has; fixes a pre-existing bug where familiars/minions previously only closed a room-change gap via their slow per-frame lerp in `entities.js`, visibly crossing the map over 1-2 seconds after every door), calls `this.updateCamera()`, sets `freezeTimer`/`roomFadeTimer`, plays `bossIntro` sound and resets `tookDamageThisBossRoom` on undefeated boss rooms, then room-type background music: `const roomTrackId = ROOM_MUSIC_TRACKS[node.type]; if (roomTrackId) Sound.startMusic(roomTrackId); else if (this.currentFloorTrackId) Sound.startMusic(this.currentFloorTrackId); else Sound.stopMusic();` — `ROOM_MUSIC_TRACKS` (`economy.js`) overrides the floor's track for the six room-type tracks (boss/crystal+shrine/sombra+curse/treasure/secret+sacrifice/shop+petshop), falling back to `this.currentFloorTrackId` (set by `startFloor`, see below) for every other room type, so walking out of a themed room seamlessly resumes the floor/region track — and finally shows the room banner via `roomLabel`/`showRoomBanner`. Called from `startFloor` and `transitionThroughDoor`.

- **`transitionThroughDoor(slot)`** — crosses a door to `slot.pairedSlot.room`; applies the curse-room half-heart tax both ways (via `damagePlayer(this, 0.5, 'curse')`) unless `player.curseImmune`, then calls `enterRoom`. Called from combat.js's player-movement code (door-crossing detection — not in this file's scope, cross-file caller not grepped exhaustively but implied by the pattern).

- **`fitCanvas()`** — reads `#canvasWrap`'s client size, computes a `scale` against the logical `CAMERA_W/H` (capped at 2.2x), sets `canvas.style.width/height`, and calls `this._positionHudPanels(wrap, CAMERA_W*scale)`. Called from main.js (`startGameWithClass`, the `ResizeObserver`/`resize` listener, `fullscreenchange` listener).

- **`_positionHudPanels(wrap, canvasPxW)`** — sizes/positions `#leftPanel`/`#rightPanel` to whatever side space is actually available next to the canvas (clamped 130-190px), hiding them (`.hud-panel-hidden`/`.hud-panel-fallback` classes) if even the minimum won't fit.

- **`updateCamera()`** — recomputes `camX`/`camY` centered on the player, clamped to the room's pixel bounds (or centered if the room is smaller than the camera). Called every `update()` tick and once on room entry.

- **`tryPlaceBomb()` / `tryUseActive()` / `tryUsePill()` / `tryUseStar()` / `tryDonate()` / `tryReroll()` / `tryArcadeInteract()`** — thin guarded wrappers (no-op unless `state==='playing'`, not paused, not mid-freeze) that call into other systems' files: `placeBombAt` (combat.js family), `useActiveItem`/`useHeldPill`/`useHeldStar` (items.js/pills.js/stars.js), `tryDonateMachine`/`tryRerollAltar`/`tryArcadeInteract` (shop.js — the last one shares its name with the global function it delegates to; this works because a class method's bare name isn't a lexical binding visible inside its own body, so the unqualified call resolves to the module-scope function). Called from main.js's `keydown` handler (B/E/Q/R/F/G/H keys) and pointerdown (right-click → `tryPlaceBomb`).

- **`toast(msg, long, kind)`** — thin passthrough to ui.js's global `toast()`. `kind` (Phase 12 visual pass) is new — see that entry below.

- **`onRoomJustCleared()`** — plays `roomClear` sound, calls `player.gainRoomClearCharge()`, bumps `roomsCleared` stat, calls `spawnClearRoomPickup(this)`, heals 0.5 (Gold Heart, if undamaged this room), and applies several trinket procs (Tithe Bell coin drop, Mending Chime heal, Tin Whistle active-charge) with a toast. Called from combat.js when the last enemy in a room dies (not in scope of this doc's files).

- **`onBossDefeated(enemy)`** — sets `node.stairsSpot` unless this is a "bonus second boss room" (floors 8-11's extra boss room that shouldn't grant stairs), grants Trophy Chain coin drops, tracks `unlocks.superbossDefeats[id]` counts and saves via `saveUnlocks`, toasts on Polish DNB's first defeat and Tyrone's 3rd defeat, sets up `node.branchSpots` (9A/9B fork) once Tyrone has been beaten 3+ times prior to this run, and unlocks a long chain of achievements (`unlock_batpony`, `sb_<id>_<classId>`, `untouchable`, `challenge_bossstreak_*`, `unbreakable`, class-unlock achievements per superboss, `challenge_flawless_run`). Called from combat.js on boss-death.
  - **Phase 10** — right alongside the existing global `unlocks.superbossDefeats[id]` bump, also lazily creates/increments `unlocks.classSuperbossDefeats[this.player.classId][superbossId]` — a genuinely separate per-class structure (the global counter is shared across every character and can't answer "did THIS class beat this boss"). Read by `ui.js`'s `buildClassSelect` for the per-character, per-route superboss indicator — see that entry below.

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

- **`paintStarfieldTile(ctx,px,py,tx,ty,pal,depth)`** *(Phase 7a)* — paints one sky tile: a `depth`-tinted `pal.voidC` fill plus 0-3 tile-seeded stars (radius and alpha driven by a per-star "magnitude", the brightest few picking up `pal.accent` and a faint halo). Uses the same `tileRand(x,y,salt)` streams as the stone/floor texture, so the sky stays put across tile-layer rebakes instead of resampling whenever a door unlocks. Called only from `rebuildPlanetariumTiles`. Phase 7d overhaul: also called from `rebuildTileLayer`'s `T_VOID` branch (with `depth` 0) whenever `floorPath === 'D'`, so every real D-branch floor (4D-10D) hangs in the same sky the gate room does, not just the one-off gate. Walls, doors and floors on those floors keep painting as normal room geometry; only the void/background tiles change.
- **`pickupIconChar(kind)`** — maps a pickup kind to a single glyph char for shop-slot pickup rendering (`{bomb:'B',key:'K',heartRed/heartBlue:'♥',star:'★'}`), used by `drawShop`.
- **`tileRand(x,y,salt)`** — deterministic per-tile pseudo-random hash (so wall/floor texture detail is stable across tile-layer rebakes), used throughout `rebuildTileLayer`.

#### `Game.prototype` drawing methods

- **`currentPalette()`** — resolves the active room palette, checking the two alternate paths first and unconditionally (their floorNums collide with the normal path's): C-branch (`cPaletteFor`), D-branch (`dPaletteFor`, Phase 7a), then floorNum 8-11's branch palettes (`BRANCH_PALETTES`/`_10`/`_11`/`_12`), then the three linear late floors — floorNum 12 (`HOLLOW_CHORUS_PALETTE`), 13 (`FINAL_WAVEFORM_PALETTE`), 14 (`FINAL_PALETTE`) — else `STAGES[stageIndexForFloor(...)].palette`.

- **`render()`** — the top-level per-frame draw entry (called from main.js's `loop()` after `update()`). No-ops unless `state==='playing'`. Tunes `ctx.imageSmoothingEnabled/Quality` once, computes `fxDt`, resets `FX` on room change, updates `FX`/ambient FX unless frozen/paused, applies the DPR transform, clears the canvas, translates by camera position + screen shake, then calls in order: `drawTiles`, `drawGroundObstacles`, `drawItemPedestal`, `drawShop`, `drawDonationMachineFixture`, `drawRerollAltarFixture`, `drawArcadeFixtures`, `drawStairs`, `drawGreenFireZone`, `drawWorldSorted`, `drawProjectiles`, `drawBombsExplosions`, `drawSwingFX`, `drawLaserFX`, `FX.draw`, `drawFloatTexts`; then (screen-space, outside the camera translate) `drawVignette`, `drawBossHealthBar` (if in an uncleared boss room), and the room-fade veil.

- **`drawVignette()`** — builds (once, cached on `this._vignetteGrad`) and fills a radial darkening gradient from `Theme.vignette`.

- **`updateAmbientFX(dt)`** — derives FX purely from observable state changes with no other file needing to call anything: hoof dust while `player.moving`, idle sparkle on `SPARKLE_PICKUPS` in the room, death puffs+shake on enemies whose `isDead` just flipped (tracks `e._fxDeath`), and explosion kick+ember burst on new `Explosion`s (tracks `ex._fxSeen`).

- **`rebuildPlanetariumTiles(node, pal, ctx)`** *(Phase 7a)* — the entire tile-layer paint pass for the one room in the game that has no walls (`node.type === 'planetarium'`, the D-branch gate). Every `T_VOID`/`T_WALL`/`T_SECRET` tile becomes starfield (`paintStarfieldTile`, tiles adjacent to the platform tinted slightly nearer); `T_FLOOR` keeps the usual checkerboard but is *lifted and rim-lit* on every edge facing open sky instead of receiving the normal sunken ambient occlusion; every door — both `T_DOOR` tiles and the special-room door slots — is drawn with `paintPortalTile`, in the destination room type's own colour so the signposting survives. Called from `rebuildTileLayer`'s early special case, so it inherits the identical caching and staleness rules as every other room. **Reads `node.tiles` exactly as-is and never touches `buildRoomTiles`'s grid-carving, `doorSlotCells`, or `checkDoorTransition`** — walkability, door geometry and collision are bit-for-bit identical to a normal room; only the paint step differs.

- **`rebuildTileLayer(node, pal)`** — (re)bakes the room's static floor/wall/door tiles into an offscreen canvas cached at `node._tileCanvas`, sized to `dpr`. Phase 7a: if `node.type === 'planetarium'` it delegates to `rebuildPlanetariumTiles` and returns early (still setting the three staleness-bookkeeping fields), leaving the normal path below untouched. Phase 7d overhaul: in the normal path, the `T_VOID` branch paints `paintStarfieldTile` instead of the flat `pal.voidC` fill when `floorPath === 'D'`, extending the Planetarium sky across all of 4D-10D. Draws per-tile: void fill, wall/secret (shaded + beveled + tile-seeded cracks/moss), door (`paintDoorTile`), floor (checkerboard + shade variance + ambient-occlusion darkening on solid-adjacent edges + grit speckles/cracks), then paints special-room door colors from `DOOR_COLORS[destType]`. Records `node._tileLayerDoorsOpen`/`_tileLayerPalette`/`tileLayerDirty=false` so `drawTiles` can detect staleness. Reads `node.tiles`, `node.doorSlots`, `node.doorsOpen`.

- **`drawTiles()`** — checks staleness (`!node._tileCanvas || tileLayerDirty || doorsOpen/palette changed`), calls `rebuildTileLayer` if needed, then blits the cached canvas with one `drawImage`.

- **`drawGroundObstacles()`** — draws every non-destroyed `GROUND_OBSTACLES` (pit/mud/sandtrap) via `Util.drawObstacle`, in a flat pass under the y-sort.

- **`drawItemPedestal()`** — draws every `node.itemPedestals` entry. **Special-cases `ped.isTrinket`**: trinkets spawn loose on the floor (no pedestal fixture) — just a shadow ellipse + bobbing item icon (`Util.drawItemIcon`) if untaken. Non-trinket pedestals (items/familiars/stars/deals) get a full pedestal base+top drawn via `Util.drawRoundedRect`/`Util.bodyShade`, with the bobbing icon on top if untaken. Reads `ped.x/y/item/taken/isTrinket`.

- **`drawShop()`** — draws every `node.shopSlots` entry: pedestal base, then (if not `bought`) a bobbing colored circle+icon for item/trinket/familiar slots (with a quality glow via `Util.qualityGlow`) or a plain circle+glyph (`pickupIconChar`) for pickup slots, plus the price text (colored gold/dim by whether the player can afford it). Phase 12 visual pass: the price text now gets a thin dark `Theme.shadow.outline` keyline (`ctx.strokeText` before `fillText`) for legibility over a bright floor tile, matching every other small-text/icon keyline in the game.

- **`drawDonationMachineFixture()`** — draws the donation machine fixture (`Util.drawDonationMachine`) plus a "X / 5000c" progress readout under it (`DONATION_CAP`), reading `unlocks.stats.donationTotal`.

- **`drawRerollAltarFixture()`** — draws the reroll altar (`Util.drawRerollAltar`) plus a "[G] Reroll Nc" readout, greyed out once `countRerollableShopSlots(node)===0`.

- **`drawArcadeFixtures()`** (Phase 4 overhaul) — unconditional per-frame loop over `node.fillies`/`node.machines` (guarded on the arrays existing), drawing `Util.drawFilly(ctx, f.x*TILE, f.y*TILE, f.kind, this.now)` per filly and the matching `Util.drawFriendshipMachine`/`drawToolsMachine`/`drawDarkMachine` per machine. Phase 6a overhaul: the Friendship/Tools calls now also pass the machine object `m` and `this.now`, so `drawMachineSpinFlourish` can read `m.spinning`.

- **`drawStairs()`** — draws either the branch-spot pits (`node.branchSpots`, labeled '9A'/'9B' in branch-colored rings) or the single `node.stairsSpot` pit, labeled "ESCAPE" (via `this.isLastFloorOfRun()`) or "DOWN". **Phase 12 visual pass**: the actual pit/ring drawing was factored out into a shared `drawStairsPit(ctx, px, py, rx, ry, ringColor)` helper — a radial gradient (void-dark center fading to the ring color) replaces the old flat single-color ellipse fill, and the ring itself now pulses via `shadowBlur` (`this.now`-driven sine, same convention as the minimap's "you are here" ring) instead of a static thin stroke. Both the branch-spot and single-stairs call sites now go through this one helper instead of duplicating the drawing logic.

- **`_drawEntry(i)`** — pooled `{y,kind,ref}` record accessor for the depth-sort scratch list (grows to the busiest-frame-seen size, then stops allocating).

- **`drawWorldSorted()`** — the y-depth sort/draw pass: collects non-ground obstacles (kind 0), pickups (kind 1), chests (kind 2), live enemies (kind 3), player familiars (kind 4), and the player (kind 5) into `this._entityDrawScratch`, sorts by `y` (`SORT_BY_Y`), then dispatches each to `Util.drawObstacle`/`Util.drawPickupIcon`/`Util.drawChestIcon`/`this.drawEnemy`/`this.drawFamiliar`/`this.drawPlayer` respectively.

- **`drawFamiliar(f)`** — draws a familiar's shadow, colored orb body (bob offset unless `behavior==='orbiter'`), and icon glyph. **Also draws swarmer mini-orbs**: if `f.def.behavior==='swarmer'` and `f.miniOrbs.length`, draws each mini-orb as a small fading circle (fades via `orb.life`) — noted in-code as necessary because these deal real damage, not just polish. Reads `f.x/y/def/index/miniOrbs`. **Phase 12 visual pass**: the body and each mini-orb now fill with `Util.bodyShade(ctx, x, y, r, color)` instead of a flat `fillStyle = color` — the same lit-sphere gradient every other moving body in the game already uses (bombs, obstacles); `bodyShade` (the uncached variant, not `bodyShadeLocal`) is explicitly documented as cheap enough to build fresh per draw call at this game's on-screen entity counts, which a "handful of familiars/orbs per room" comfortably is.

- **`drawPlayer()`** — draws the player pony via `Util.drawPony` with `classPonyOpts`, flashing (`invulnTimer`) and glowing (`invincibleTimer`) states; triggers `FX.shake`/`FX.sparks` on a fresh invuln hit (tracked via `_fxPlayerInvuln`); draws a freeze ring/fill if `freezeTimer>0` (Sand Trap); draws a charging ember effect if `p.charged && p.chargeTimer>0` (Dragon class beam charge-up). Reads `player.x/y/def/facing/moving/invulnTimer/invincibleTimer/freezeTimer/charged/chargeTimer/chargeTime/canFly`.

- **`drawEnemy(e)`** — computes a frame-diff `moving` flag (tracks `e._lastX/_lastY`), triggers hit-spark FX on a fresh `hitFlash` (tracks `e._fxHit`), draws a lobber's landing-zone ring (`e.lobTimer`), draws the enemy body via `Util.drawBrownHumanoid` (submerged alpha handling), a shield ring if `e.shielded`, then `this.drawStatusEffects(e)`.
  - **Phase 12 visual pass — crit-specific hit spark.** `Theme.particle.critSpark` existed in `theme.js` but was never referenced anywhere; the hit-flash rising-edge branch now checks a new `e._lastHitCrit` flag (set once, at the same site `crit` is computed, by each of the four player-damage call sites in `combat-1.js`/`combat-2.js` (×2)/`combat-3.js` — search `_lastHitCrit` for all of them) and, if set, fires a bigger `FX.sparks` (9 vs the normal 5) plus an `FX.twinkle` ring, both in `critSpark`'s brighter gold-white tone, then clears the flag — so it can never leak onto a later non-crit hit on the same enemy. A normal (non-crit) hit is completely unchanged from before.

- **`drawStatusEffects(e)`** — draws freeze ring+fill, stun "☆", charm "♥", or fear ring (mutually exclusive `if`/`else if` chain, keyed off `e.freezeTimer/stunTimer/charmTimer/fearTimer`), then poison aura+blob (`e.poisonTimer`) as a separate always-checked `if` that layers on top of whichever of the four fired (or none), then — Phase 6a overhaul — Vulnerable (`e.vulnerableTimer`) as a THIRD separate always-checked `if`, same tier as poison, not part of the exclusive chain: a pulsing crimson ring (`Theme.status.vulnerableRing`, radius `e.radius+4`, distinct from the freeze/fear ring's `e.radius+8` so the two never visually alias when both are up) plus a small crimson crosshair "X" mark (`Theme.status.vulnerableMark`, drawn with `moveTo`/`lineTo`) above the enemy, pulsing via `Math.sin(this.now/100)` same idiom as the stun/charm glyphs. Renders simultaneously with poison and with any one of the exclusive four (Rot & Ruin synergy explicitly combines Vulnerable + poison). **Phase 12 visual pass (canvas batch)**: freeze/fear/vulnerable rings and the stun/charm glyphs were all flat/glowless — freeze and fear rings now carry a `shadowBlur` glow in their own status color, the vulnerable X mark the same, and freeze/poison each gained 1-2 small white/dark glint dots so "frozen"/"poisoned" reads as icy/bubbling rather than a flat colored disc; the stun "☆"/charm "♥" glyphs gained the same dark-keyline `strokeText` treatment `drawFloatTexts` got. `drawEnemy`'s shield ring (above) got the identical glow treatment. All additions are single extra draw calls per status, not new per-frame allocations — safe at this game's enemy-count scale.

- **`drawBossHealthBar()`** — finds the live boss in `currentRoom.enemies`, draws a top-centered HP bar + name text. Called from `render()` only while `currentRoom.type==='boss' && !cleared`. **Phase 12 visual pass** — was three flat `fillRect`s; now: a glowing backing frame (`shadowBlur` in `Theme.ui.bossBarFill`) plus a thin white keyline border, a lagging "ghost" segment (`this._bossBarGhost`) that eases down toward the real HP fraction over ~2.8s instead of the bar just being instantly shorter next frame — so a big hit reads as a visible red chunk carved out rather than a silent snap — a 3-stop linear-gradient sheen on the live fill instead of one flat color, and a drop-shadowed name label. The ghost state is self-contained (tracks its own frame delta off `this.now`, since `render()` has no `dt` parameter) and resets whenever `this._bossBarBoss` differs from the current boss reference — covers both "entered a new boss room" and "multi-phase fight swapped enemies" — and is also cleared when there's no live boss at all (room cleared / player left), so it can never carry a stale ghost value into a later, unrelated fight. **Batch 3 addition**: under 25% HP the whole frame switches to a harder, faster-pulsing red "bloodied" glow (`shadowBlur`/`strokeStyle` driven by a `this.now`-based sine) instead of the calm default treatment, so a boss on the ropes reads as urgent from the corner of the eye without needing to actually read the bar's fill level.

- **`drawProjectiles()`** — draws each `this.projectiles` entry as a glowing disc with a glint highlight.

- **`drawBombsExplosions()`** — draws each `this.bombs` (pulsing body + fuse spark, hot fuse color under 0.5s) and each `this.explosions` (expanding radial-gradient blast + ring, driven by `ex.life/maxLife`).

- **`drawGreenFireZone()`** — draws the Changeling's held green-fire pool (`player.fireZone`) as a radial gradient with animated licking-flame dots around the rim; purely cosmetic, draws nothing when `fireZone` is null.

- **`drawSwingFX()`** — draws the melee swing arc (`this.swingFX`) as two fading trail arcs.

- **`drawLaserFX()`** — draws a beam (`this.laserFX`), shared by Pony Bot's laser and Dragon's fire breath; `fx.color`/`fx.width` let the caller reskin it (default cyan).

- **`drawFloatTexts()`** — draws each `this.floatTexts` entry as fading text. **Phase 12 visual pass (canvas batch)** — every entry now gets a `strokeText` dark keyline (`Theme.shadow.outline`, `lineWidth`/`strokeStyle` set once outside the loop) before its `fillText`, the same small-text legibility convention used everywhere else in the game — damage numbers/"CRIT"/pickup labels stay readable over any floor palette instead of relying on the text's own (sometimes light) color alone.

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
- **`toast(msg, long, kind)`** / **`advanceToastQueue()`** — a queued (not clobbered) toast system; `long` extends on-screen time for achievement-unlock toasts. Called from many files across the codebase (game.js, main.js, combat/items/shop/etc — grep confirms wide usage). **Phase 12 visual pass** — optional 3rd arg `kind` (`'good'|'bad'|'info'`) adds a `toast-<kind>` class (style.css: a colored left-accent border + matching glow, omitted entirely for an untagged call — the original plain look) so a toast can read as "this happened TO you" at a glance. Wired at 4 call sites so far: achievement unlock + class unlock (`'good'`, `achievements/logic.js`), personal-best floor (`'good'`, `game.js`), first-ever bestiary discovery (`'info'`, `combat-2.js`) — every other existing `toast()`/`game.toast()` call across the codebase is untouched and keeps its original neutral look.
- **`showRoomBanner(text, roomType)`** (ui.js) — **Phase 12 visual pass**: also prefixes the room's `ROOM_TYPE_ICON` glyph (the same one the minimap uses) onto the banner text when `roomType` is given and has an icon; room types with no icon (normal, gate rooms, arcade) render exactly as before.
- **Synergy badges "just activated" flash** (ui.js's `updateHUD`, style.css's `.synergy-badge.just-activated`) — **Phase 12 visual pass**. The existing `synKey` dirty-check only detected "something about the joined synergy state changed"; it's now compared per-badge against the PREVIOUS key so only a badge that just flipped from inactive to active (not one that was already lit) gets a one-shot bright ring-burst animation, force-restarted via remove+reflow+re-add (`classList.add` alone is a no-op if the class already lingers from a rapid double-toggle).
- **`showRoomBanner(text, roomType)`** — shows the `#roomBanner` room-name banner for 1.6s. `roomType` is optional (Phase 12 visual pass): when given, sets the `--banner-color` CSS custom property to `roomTypeColor(roomType)` (the same lookup the minimap uses) inline on the element, so a boss room's banner glows red, a shop's violet, etc., instead of every room type sharing the original flat gold; an empty/omitted `roomType` cleanly falls back to gold via CSS's `var(--banner-color, var(--gold))` (an empty custom property is invalid-at-computed-value-time for `color`, which is exactly what triggers a `var()` fallback). Called by game.js's `enterRoom` as `showRoomBanner(label, node.type)`.
- **`showItemExamine(ped)`** — shows/hides the `#itemExamine` tooltip for a nearby pedestal (item/trinket/familiar all share the same pedestal shape). Called by game.js's `updateItemExamine`.
- **`buildClassSelect(onPick)`** — builds the `#classSelect` card grid: each unlocked class gets a drawn pony preview (`Util.drawPony`) and its real name/desc/click-to-pick handler; locked classes show a "?" placeholder, `???`, and live unlock progress (reading the matching `ACHIEVEMENTS` entry's `statKey`/`threshold`) plus a deny-sound click handler. Called from main.js on load and from `returnToMenu()`.
  - **Phase 10 — per-route superboss indicator.** Every UNLOCKED card additionally gets a `.class-superboss-routes` footer row of three small pill badges, one per `SUPERBOSS_ROUTE_ORDER` entry (`data/enemies/superboss-routes.js`: `'main'` labelled "A/B" — the original linear route plus its internal 9A/9B..12A/12B branch-within-a-branch, both sides counted together since they're mutually exclusive within one run but both still "the main route" — `'C'`, `'D'`), each reading `"<label> <beaten>/<total>"` for superbosses THAT CLASS has personally killed. Counts come from `unlocks.classSuperbossDefeats[classId][superbossId]` (new in `game.js`'s `onBossDefeated`, written right alongside — but as a genuinely separate structure from — the older global `unlocks.superbossDefeats[superbossId]` counter `buildSuperbossTrophies` below already reads; the global counter has no per-class dimension, so it couldn't answer "which of MY runs on THIS character beat this boss"). A badge's `title` lists every superboss in that route with a ✓/· prefix, **in the order the player actually encounters them** (ascending floorNum) via the new `SUPERBOSS_ROUTE_SEQUENCE` export — deliberately NOT `SUPERBOSS_LIST.filter(...)`'s raw object-insertion order, which gets two spots wrong: `onetruednb` (floorNum 14) is declared before `wobbler`/`subdrop` (floorNum 12/13) in `superbosses.js`, and `kirk` (floorNum 11, the C-branch finale as of Phase 7a) is declared before `monsoon`/`mangrove` (floorNum 9/10) for the same reason — both appended to the object literal in write-order, not encounter-order. `SUPERBOSS_ROUTE_SEQUENCE[route]` is a hand-verified array of ids in floorNum order (branch-pair bosses sharing one floorNum, e.g. `pineapple`/`israel` at 8, listed branch-A-then-B); a data-level test confirms its id set exactly matches `SUPERBOSS_ROUTE`'s per-route membership for all 32 current superbosses, so the two structures can't silently drift apart. Badge gets `.has-progress` (subtle purple) once `beaten>0`, `.complete` (gold glow) once the whole route is cleared by that class. `data/enemies/superboss-routes.js` also exports `SUPERBOSS_ROUTE` (`{id: 'main'|'C'|'D'}`, all 32 current superbosses, verified exhaustive) and `SUPERBOSS_ROUTE_LABELS`; loaded after every file that defines a `SUPERBOSSES` entry (`superbosses.js`, then the three Phase 10 `stageN-M-superbosses.js` files) since none of this is derivable from the superboss data itself — a superboss is tied to a floorNum/route by a hardcoded dispatch in `game.js`'s `descend()`, not by a data field.
- **`buildSuperbossTrophies()`** — builds the global `#trophyRow` at the bottom of the main menu (`<h2 class="trophyTitle">Superbosses</h2>`) showing beaten bosses' icon/name/defeat-count and `❓`/`???` for undefeated ones. **Phase 10 — route split.** Rewritten to group the trophies into three `.trophy-route-group` sections (one per `SUPERBOSS_ROUTE_ORDER` entry, headed by a `.trophy-route-label` reading `"<label> route"`) instead of one flat row — `index.html`'s `#trophyRow` div changed class from `.trophy-row` to `.trophy-routes` (the new outer flex-column container; each group still holds its own inner `.trophy-row`). Each group's bosses come from `SUPERBOSS_ROUTE_SEQUENCE[route].map(id => SUPERBOSSES[id])` — the same hand-verified encounter-order array `buildClassSelect`'s per-route indicator uses (see that entry above) — rather than filtering `SUPERBOSS_LIST` directly, so both UI surfaces share one correctly-ordered source of truth instead of each re-deriving (or mis-deriving) the order. Reads the pre-existing global `unlocks.superbossDefeats` (not the per-class `classSuperbossDefeats` `buildClassSelect` uses) since this row is account-wide, not per-character. Called from main.js on load and `returnToMenu()`.

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
- `keydown` listener on `window` — WASD/arrows → `input.*`, Space→`attack`, B/E/Q/R/F/G/H → `game.tryPlaceBomb/tryUseActive/tryUsePill/tryUseStar/tryDonate/tryReroll/tryArcadeInteract` (G and H are both guarded against key-repeat so holding them doesn't drain coins/bombs/keys/hearts), M→`toggleMuteUI`, T→bestiary-style toggle of the Achievements overlay, C→toggle the Bestiary overlay, K→toggle the Skill Tree overlay (Phase 8b), Escape→closes an open overlay if any, else `togglePause()`. Also calls `Sound.unlock()` on every keydown (first real user gesture).
- `keyup` listener — clears the WASD/arrow/attack flags.
- **`bindTouchControls()` (Phase 12 mobile pass)** — an IIFE run once at load, right after the canvas pointer wiring. Two pieces, both purely additive on top of the existing keyboard/pointer input — neither one is ever referenced from anywhere except the DOM elements it binds:
  - **Virtual joystick** (`#touchJoystick`/`#touchJoystickKnob`) — `pointerdown` on the ring captures that pointer (`setPointerCapture`) and remembers its `pointerId`; `pointermove` (which then keeps firing on the ring element even once the finger drags outside it, because of the capture) computes the drag vector from the ring's center, clamps it to a 38px radius, moves the knob via CSS `transform`, and sets `input.up/down/left/right` from a ±10px deadzone on each axis independently — so a diagonal drag sets two directions at once, exactly like holding two WASD keys. `pointerup`/`pointercancel`/`lostpointercapture` all reset every direction flag and snap the knob back to center.
  - **Action buttons** — `#touchBombBtn/#touchActiveBtn/#touchPillBtn/#touchStarBtn/#touchDonateBtn/#touchRerollBtn/#touchArcadeBtn` are one-shot `pointerdown` → the SAME `game.tryX()` calls the keyboard shortcuts use (`tryPlaceBomb/tryUseActive/tryUsePill/tryUseStar/tryDonate/tryReroll/tryArcadeInteract`), so a touch button can never drift out of sync with what its key does. `#touchTurretBtn` is held (`input.build = true` on `pointerdown`, `false` on `pointerup`/`pointercancel`/`pointerleave`) to mirror `KeyV`'s hold-to-channel behavior exactly. `#touchPauseBtn` calls the existing `togglePause()`. Every handler also calls `Sound.unlock()`, same reasoning as the keydown listener.
  - Visibility is entirely CSS-driven (`.touch-only` in style.css, gated on `not (hover:hover) and (pointer:fine)` — a real touchscreen, not just a small desktop window), except `#touchTurretBtn`, which ALSO needs `js/ui/ui.js`'s `updateHUD` to toggle a `.hidden` class on it (mirroring the desktop `#resTurrets` chip's `hasTurretAbility` check) since turret-building is class-gated, not universal.
- `pointermove`/`pointerleave`/`pointerdown`/`pointerup`/`contextmenu` on `canvas`/`window` — converts pointer position to logical camera-space pixels (`input.mouseX/mouseY`), sets `input.mouseActive`, left-click→`attack`, right-click→`game.tryPlaceBomb()`, and suppresses the context menu.

**Pause/overlay screens**
- **`togglePause()`** — no-ops unless `game && game.state==='playing'`; flips `game.paused`, toggles `#pauseScreen`'s hidden class, releases/requests the wake lock accordingly, and (while pausing) fills `#pauseStats` (class/floor/coins/keys/bombs/kills/duration) and `#pauseEquipped` (active item/trinket/pill/star icons+names) from live `game.player` state. Wired to the Escape key and `#resumeBtn`.
- `#quitBtn` handler — confirms via `confirm()`, bumps `totalPlaytime`, hides the pause screen, calls `returnToMenu()`.
- **`openOverlay(id, buildFn, markSeenFn)`** — plays a click sound, calls `buildFn()` (e.g. `buildAchievementsPanel`/`buildBestiaryPanel`/`buildSkillTreePanel`), unhides the overlay, resets its scroll, calls `markSeenFn()` if one was passed (the Skill Tree overlay passes none — see below). Shared entry point for every button/keybind that opens the Achievements, Bestiary, or (Phase 8b) Skill Tree overlay.
- **`toggleOverlay(id, buildFn, markSeenFn)`** — open-or-close variant used by the T/C/K keybinds.
- Backdrop-click-to-close wiring for `achievementsScreen`/`bestiaryScreen`/`skillTreeScreen`.
- Button wiring: `pauseAchievementsBtn`/`pauseBestiaryBtn`/`pauseSkillTreeBtn`/`achievementsBtn`/`bestiaryBtn`/`skillTreeBtn` (open), `retryBtn`/`winBtn` (return to menu), `achievementsCloseBtn`/`bestiaryCloseBtn`/`skillTreeCloseBtn` (close). The Escape handler's open-overlay search array also includes `skillTreeScreen`.
- **`markAchievementsSeen()`** / **`refreshAchievementsBadge()`** — persist/read `nightfallAchvSeenCount` to show/hide the `#achievementsNewBadge` "NEW" indicator based on `unlocks.achievements` count.
- **`refreshSkillTreeBadge()`** *(Phase 8b)* — no seen/unseen tracking (unlike the two above); just mirrors `unlocks.skillTree.points` as `#skillTreePointsBadge`'s text and hides the badge when `points <= 0`. Also sets the badge's `title` to `"<lifetimeEarned> points earned over your lifetime"` when that counter is nonzero (post-capstone polish pass — see `checkBestiaryTierUp`'s entry above). Called alongside `refreshAchievementsBadge`/`refreshBestiaryBadge` from `updateLifetimeStatsDisplay()`, so it refreshes both at initial page load and every `returnToMenu()`.
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
- **`startGameWithClass(classId)`** — stops the main-menu ambient drone (`Sound.stopAmbient()` — see `core/audio.js`), hides menu/end/pause screens, shows `#gameScreen`, constructs `new Game(canvas)`, calls `game.startRun(classId)`, `game.fitCanvas()`, `requestWakeLock()`. Passed as the `onPick` callback to `buildClassSelect` (ui.js).
- **`returnToMenu()`** — releases the wake lock, stops any in-progress background track (`Sound.stopMusic()` — safe no-op if none is playing; covers a run ending mid-Crypt, e.g. dying there, where `game.js`'s `startFloor` never gets a later floor transition to fade it out itself), nulls `game`, hides all game/end/pause screens, shows `#mainMenu`, rebuilds `buildClassSelect`/`buildSuperbossTrophies`/`updateLifetimeStatsDisplay`, restarts the ambient drone (`Sound.startAmbient()`).
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
- **`loop(now)`** — the `requestAnimationFrame` callback: computes a clamped `dt` (max 0.05s), calls `game.update(input, dt)` then `game.render()` if `game` exists, and on a `game.state` transition: releases the wake lock and (on `gameover`) calls `showGameOver()`, plays the game-over sound, bumps `deaths`/`totalPlaytime` stats, and credits the killer to the bestiary (`bumpBestiaryCount('enemyDeaths', src, 1)`) if `player.lastDamageSource` is a real enemy/boss/superboss id; on `win`, calls `showWin()`, plays the win fanfare, `recordWin(game, classId)`, bumps `totalPlaytime`, checks/toasts a new fastest-win personal best (`setStatMin`), and unlocks the three speedrun achievements (`challenge_speedrun_20min/12min/8min`) independently based on `game.runElapsed`. **Post-megaupdate main-menu polish pass**: the `else` branch (`game` is `null`, i.e. exactly while the main menu is the visible screen) now calls **`renderMenuBackdrop(dt)`** (`ui/menu-backdrop.js`) — so the ambient-mote canvas only ever costs a frame while it's actually visible. Reschedules itself via `requestAnimationFrame`.
- **`rafId`** — doubles as both the pending frame handle and the "is the loop running" flag.
- **`startLoop()`** / **`stopLoop()`** — start/stop the rAF loop; `startLoop` resets `lastTime` so a long hidden gap doesn't arrive as one giant `dt`.
- Bottom of file: calls `startLoop()`, `buildClassSelect(startGameWithClass)`, `buildSuperbossTrophies()`, `updateLifetimeStatsDisplay()`, `Sound.startAmbient()` to boot the page.

---

### ui/menu-backdrop.js

*(Post-megaupdate main-menu polish pass.)* Slow-drifting ambient motes rendered onto `#menuBackdrop`, a `position:fixed; inset:0; z-index:-1` `<canvas>` in `index.html` sitting behind `#app` (a sibling of it, not a child — outside `#app` so its full-viewport sizing never fights `#app`'s own layout; painted below `#app` regardless of DOM/z-index-tie order because `#app` is `position:relative`, which per CSS stacking rules always paints above any negative-z-index sibling). Purely decorative — additive to the pre-existing static `body::before`/`body::after` gradient-drift+twinkle layers in `style.css` (those are fixed-position, non-moving CSS glows; these are canvas particles that actually drift, giving the menu a sense of depth/motion the static layers alone couldn't).

- **`MENU_BACKDROP_PALETTE`** — the same five DNB-neon accent colors used across the rest of the UI (`--accent`/`--accent2`/`--gold`/`--red`/`--blue`). **`MENU_BACKDROP_COUNT`** = 46 particles.
- **`ensureMenuBackdropSized()`** — lazily grabs the canvas/context, and re-syncs `canvas.width`/`canvas.height` to `window.innerWidth`/`innerHeight` every call (cheap — two property reads in the common no-resize case, so no separate `resize` listener is needed). A canvas's `width`/`height` ATTRIBUTES define its internal pixel grid — plain CSS sizing alone can't do this, hence doing it here instead of in `style.css`. A size change reseeds `menuBackdropParticles = null` rather than trying to reconcile old positions against new bounds (a mote or two popping to a new spot after a resize is imperceptible).
- **`seedMenuBackdropParticles()`** — builds 46 particles, each with a random `x`/`y`, radius, upward drift `speed`, sideways `sway` amplitude/phase/speed (for organic non-linear movement, not straight-line drift), a random palette color, and an independent alpha-twinkle phase/speed.
- **`renderMenuBackdrop(dt)`** — called from `main.js`'s `loop()`, only in the `else` branch of `if (game)` (i.e. only while the main menu is the visible screen — see that entry). Clears the canvas, then per particle: moves `y` upward by `speed*dt`, wraps back in at the bottom (fresh random `x`) once it drifts above the top edge, computes a `sin()`-based horizontal sway offset and a `sin()`-based alpha twinkle (both driven off a shared `menuBackdropTime` accumulator, not per-particle `setTimeout`s), and draws a filled circle. Zero cost during actual gameplay/pause/end-screens since it's never called while `game` is truthy.
- Respects `prefers-reduced-motion:reduce` — `style.css` sets `#menuBackdrop{ display:none; }` under that media query (matching the same treatment already given to `.title`'s pulse and `body::before`/`::after`'s drift/twinkle), so the canvas keeps costing nothing per-frame for players who've asked for less motion (the JS itself still runs harmlessly against a `display:none` canvas — no separate JS-side reduced-motion check was needed).

---

### ui/music-test.js

A preview panel for `audio.js`'s background tracks (`Sound.startMusic`/`stopMusic`/`listMusicTracks`/`currentMusicTrackId`), reachable from the main menu's `#musicTestBtn` (`"🎵 Music Test"`, in the `.menu-btn-row` alongside Achievements/Bestiary/Skill Tree). Lets a track be auditioned without starting a run. Follows the exact same overlay-panel shape as achievements/bestiary/skill tree (`main.js`'s `openOverlay`/`toggleOverlay` and the backdrop-click-to-close wiring) and reuses their `.achv-summary`/`.achv-list`/`.achv-row`/`.achv-icon`/`.achv-text`/`.achv-name`/`.achv-desc` classes rather than inventing a parallel set — only two new CSS rules of its own (`.music-test-row.playing`, `.music-test-btn`, see `style.css`).

- **`buildMusicTestPanel()`** — rebuilds `#musicTestList` from scratch: one `.achv-row.music-test-row` per `Sound.listMusicTracks()` entry, comparing each `id` against `Sound.currentMusicTrackId()` to decide the row's `.playing` class, icon (🔊 vs 🎵), description text, and its `.music-test-btn`'s label (`⏹ Stop` vs `▶ Play`). The button's click handler: if that track is the one currently playing, `Sound.stopMusic()` + `Sound.startAmbient()` (bringing the menu drone back); otherwise `Sound.stopAmbient()` (never layers a track under the drone) + `Sound.startMusic(t.id)` — either way finishes by calling `buildMusicTestPanel()` again so the whole panel's playing-row highlight/icon/button label relabel immediately rather than only on next open.
- **`closeMusicTestPanel()`** — called from both `main.js`'s `#musicTestCloseBtn` handler and the panel's own backdrop-click handler (a separate listener from the shared `achievementsScreen`/`bestiaryScreen`/`skillTreeScreen` loop, since none of those need to stop anything on close). If a track is currently previewing, stops it and restarts the ambient drone — so leaving the panel never leaves a preview track looping silently behind the main menu.

---

### ui/bestiary.js

The Bestiary panel: 9-10 tabs (Enemies/Items/Stars/Pills/Trinkets/Familiars/Objects/Pickups/Room Types/Stages), each listing every entry in that category — undiscovered entries render as a "?" row. Reuses the Achievements panel's CSS classes (`.achv-summary`/`.achv-filter`/`.achv-list`/`.achv-category`/`.achv-grid`/`.achv-row`/`.achv-icon`/`.achv-text`/`.achv-name`/`.achv-desc`/`.achv-reward`). All the underlying tracking (`unlocks.bestiary.*`) is written via `markBestiarySeen`/`bumpBestiaryCount` (defined in achievements/logic.js, called from game.js, systems/combat-*.js, systems/items-2.js, systems/room.js — this file only *reads* that state via `loadUnlocks()`/`ensureUnlockShape`). **Phase 8a** adds a per-row mastery tier badge (copper/silver/gold/platinum) to every category that tracks a per-id count — see `bestiaryRow` below and `achievements/bestiary-tiers.js` for the ladders. `bestiaryDiscoveredTotals` was deliberately left alone: the tab counters and summary line stay *discovery* counts, not tier counts.

- **`BESTIARY_TABS`** — the 10 tab definitions (`{id,label,icon}`).
- **`loadBestiaryTabPref()`** — reads/validates the persisted `nightfallBestiaryTab` localStorage key, defaulting to `'enemies'`.
- `_bestiaryTab` — module-level current-tab state.
- **`bestiaryRow(opts)`** — shared per-entry row builder: draws either an emoji icon or a `dotColor` colored circle (for enemies/objects/pills, which have no fixed glyph) when `seen`, else a "❓"/"???"/"Not yet discovered." placeholder; appends `opts.lines` as description lines and an optional `opts.extra` reward-style line. Used by every tab renderer below. **Phase 8a** adds an optional `opts.tier` (0-4): when it's above 0 on a discovered row, a small `<span class="best-tier">` is appended after the entry name carrying that tier's `BESTIARY_TIER_ICONS` glyph, its `BESTIARY_TIER_COLORS` colour set inline, and a `title` of `bestiaryTierLabel(tier)` ("Gold tier"). Tier 0 draws nothing whatsoever, so an unranked or undiscovered row renders byte-identically to before; `.best-tier` in `style.css` is a single font-size/vertical-align/margin rule next to the existing `.best-dot`.
- **`bestiaryCategoryHeader(wrap, label, done, total)`** — appends an `<h3>` "Label (done/total)" section header.
- **`renderBestiaryEnemies(wrap)`** — three sub-groups (Enemies/Bosses/Superbosses from `ENEMY_LIST`/`BOSS_LIST`/`SUPERBOSS_LIST`), each row showing HP/DMG/SPD/flies/behavior stats and a "Defeated N times · Killed you N times" tally from `unlocks.bestiary.enemyKills`/`enemyDeaths`. Each group carries a `tierCat` (`enemy`/`boss`/`superboss`) so the row's Phase 8a tier badge is computed from the kill count against the right ladder.
- **`renderBestiaryItems(wrap)`** — two sub-groups (Passive/Active from `PASSIVE_ITEMS`/`ACTIVE_ITEMS`), each row showing the item's desc and a star-rating (`★`/`☆` repeated by `item.quality`) as the `extra` line, plus a Phase 8a tier badge from `unlocks.bestiary.itemsCollectedCount`.
- **`renderBestiarySimple(wrap, list, seenSection, extraFn)`** — generic single-grid renderer used for Stars, Trinkets, Pickups, Room Types, and Stages (each just icon+name+desc, no sub-grouping). Phase 8a looks `seenSection` up in `logic.js`'s `_BESTIARY_SEEN_TIER_MAP` to find both the tier category and the count bucket for the badge, so all five of these tabs are covered without a per-tab table here.
- **`renderBestiaryFamiliars(wrap)`** — three sub-groups by `behavior` (Orbiters/Shooters/Procs from `FAMILIAR_LIST`), each row's stat line varying by behavior (DMG+orbit speed / DMG+cooldown / interval), plus a Phase 8a tier badge from `unlocks.bestiary.familiarsCollectedCount`.
- **`renderBestiaryPills(wrap)`** — prepends a note explaining pill colors are re-randomized per run (lists every `PILL_EFFECT_LIST` name), then a flat grid of `PILL_COLORS` (dot-colored). Phase 8a gave pills a real per-color count (`unlocks.bestiary.pillsDrunkCount`), so the second line now reads the actual tally ("Taken 12 times.") instead of the old flat "Taken at least once.", and the row carries a tier badge.
- **`renderBestiaryObjects(wrap)`** — flat grid over `OBSTACLES`, showing the obstacle's desc plus either "Destroyed N times" (if `destructible`/`attackable`) or "Indestructible." from `unlocks.bestiary.objectsDestroyed`. Only destructible obstacles get a Phase 8a tier badge — `objectsSeen` is a plain boolean with no repeat-count meaning, so `objectsDestroyed` is the only object ladder.
- **`bestiaryDiscoveredTotals()`** — computes `{done,total}` per tab id by cross-referencing each category's master list against the matching `unlocks.bestiary.*` seen-map. Used for both the tab-button counts and the overall summary line.
- **`bestiaryTotalDiscovered()`** — sums every tab's `done` count into one number. Used by `markBestiarySeenBadge`/`refreshBestiaryBadge` and (per grep) by main.js's badge logic indirectly via those two functions.
- **`buildBestiaryPanel()`** — the main panel builder: clears `#bestiaryList`, rebuilds `#bestiaryTabs` buttons (each showing `icon label (done/total)`, click switches `_bestiaryTab`, persists it, plays a click sound, rebuilds), fills `#bestiarySummary` with the grand total, and dispatches to the matching `renderBestiary*` function based on `_bestiaryTab`. Called from main.js's `openOverlay`/`toggleOverlay` wiring (the C key and Achievements/Bestiary buttons).
- **`markBestiarySeenBadge()`** — persists `nightfallBestiarySeenCount` and hides `#bestiaryNewBadge`. Called on overlay open.
- **`refreshBestiaryBadge()`** — shows/hides `#bestiaryNewBadge` by comparing the current total against the persisted seen-count. Called from main.js's `updateLifetimeStatsDisplay()`.


---

<a id="phase-10-engine-scaffolding"></a>

# Phase 10 — engine scaffolding (extended main route, damage cap, path gating)

Cross-cutting pass that adds the *engine* for Phase 10's content without any of the content itself: no new enemies, bosses, superbosses or skill-tree nodes land here. Everything below is deliberately inert or additive on the floors that already existed.

### The extended main route — `data/stages.js`

- **`OLD_MAIN_ROUTE_FINAL_FLOOR`** = **`14`** — the main route's last floor *before* this pass ("The One True Descent", HUD floor 15). Every rule that must behave exactly as it did before the append keys off this constant instead of a literal: `stageIndexForFloor`'s legacy clamp, `dungeon.js`'s `floorfeature` gate, and `game.js`'s C-path unlock grant.
- **`LEGACY_STAGE_COUNT`** = `4` — how many `STAGES` entries existed before this pass. `stageIndexForFloor` clamps to this (not `STAGES.length`) for `floorNum <= OLD_MAIN_ROUTE_FINAL_FLOOR`, which is what keeps floors 7-15 resolving to the Inferno exactly as they always did.
- **`STAGES` indices 4-13** — ten new themed stages, palette-only (same `{id,name,palette:{floorA,floorB,wall,voidC,doorOpen,doorLocked,grout,accent}}` shape as the original four): `frozendesert` (The Frozen Desert), `badlands` (The Badlands), `beach` (The Beach), `ocean` (The Ocean), `seafloor` (The Sea Floor), `trench` (The Trench), `trenchdepths` (The Trench Depths), `deepdark` (The Deep Dark), `metarealm` (The Meta Realm), `hyperspace` (Hyperspace). They have **no** `STAGE_LIST` bestiary pages and **no** enemy/boss rosters yet — both are later content phases.
- **`FLOOR_NAMES` indices 15-34** — twenty new floor slots, two per new stage ("Frozen Desert — Rime Flats"/"— The Drifts", … "Hyperspace — Fold"/"— The Last Exit"). `MAX_FLOORS` stays `FLOOR_NAMES.length` (now `35`); the only other consumer of it is `ui/roomEditor.js`'s per-floor toggle grid, which is derived and simply grows.
- **`stageIndexForFloor(floorNum)`** — now two ranges. `floorNum <= OLD_MAIN_ROUTE_FINAL_FLOOR` → `Math.min(LEGACY_STAGE_COUNT-1, floor(floorNum/FLOORS_PER_STAGE))` (byte-for-byte the old behavior). Above it → `Math.min(STAGES.length-1, LEGACY_STAGE_COUNT + floor((floorNum - (OLD_MAIN_ROUTE_FINAL_FLOOR+1))/FLOORS_PER_STAGE))`, so 15/16 → stage 4 … 33/34 → stage 13, clamped past that. `floorKeyFor`, all branch palettes and every floor 8-14 special case are untouched.
- Not wired: `game.js`'s `descend` still ends a main-route run at `floorNum 14`. Reaching floors 15+ is a later phase; until then the new stages/floors are data only, and `room.js`'s existing empty-pool fallbacks already cover them.

### Global damage cap — `systems/combat-1.js`

**`playerDamageAmount(game, isBoss, dmgHalves)`** now ends `return Math.min(4, Math.max(0.5, Math.round(amount*2)/2));` — **no single hit from any source can ever cost more than 4 hearts**, however large the attacker's `dmg` or how many multipliers stack. This is the one funnel point every damage source routes through, so no call site changed.

### Per-floor special object hook — `systems/dungeon.js`, `data/roomTemplates/floorfeature.js`, `data/collectibles.js`

- **`'floorfeature'`** — new room type, added to both `SPECIAL_ROOM_TYPES` (capped at one entrance like every other special) and `AUTO_OPEN_ROOM_TYPES` (it holds a stage object, not a reward behind a lock — same class as `crystal`/`sombra`/`shrine`).
- `generateDungeon` attaches exactly one, guaranteed, via `floorfeatureNode = floorNum > OLD_MAIN_ROUTE_FINAL_FLOOR ? attachSpecial('floorfeature') : null;` and returns it alongside the other `*Node` fields. It can therefore **never** appear on any pre-existing floor.
- **`ROOM_TEMPLATES.floorfeature`** (new file `js/data/roomTemplates/floorfeature.js`, loaded in `index.html` right after `normal-4.js`) holds one plain empty `{"m":[[1]]}` layout — present purely so the pool is non-empty; the per-stage flavours are a later phase.
- **`OBSTACLES.floorswitch`** — placeholder obstacle kind (`name:'???'`, `walkable:true`, `pushX:0`, `pushY:0`), carrying the directional shape the real stage objects will fill in. It has no `current`/`projectile`/`hazard`/`destructible` flag, so every dispatching system skips it, and no template references it, so it cannot spawn yet. It does add one row to the Bestiary's Objects tab total (the `exploration_objectsseen` ladder tops out at 24 and is unaffected).

### Skill-tree engine bits — `achievements/skilltree.js`, `entities/entities.js`, `systems/combat-2.js`

- **`SKILL_TREE_STAT_CAP_OVERRIDES`** = `{ lifestealChance: 0.10 }` — per-stat ceiling table. `getSkillTreeStatBonus` clamps to `SKILL_TREE_STAT_CAP_OVERRIDES[stat]` when one exists and to the unchanged flat `SKILL_TREE_STAT_CAP` (0.25) otherwise, so **only** `lifestealChance` behaves differently; every other stat, chance fields included, is untouched. Existing character branches that summed above 10 points of lifesteal (e.g. 0.05+0.04+0.06) now cap at 10.
- **`Player.crystalVolleySpacing`** (entities.js, right beside `crystalShardCount`) — shadow field seeded to `CRYSTAL_VOLLEY_SPACING_DEFAULT` when `def.crystalVolley` is set, else `0`. `combat-2.js`'s module constant was renamed `CRYSTAL_VOLLEY_SPACING` → **`CRYSTAL_VOLLEY_SPACING_DEFAULT`** (seed value only) and `playerCrystalVolleyAttack` now spreads offsets by `player.crystalVolleySpacing || CRYSTAL_VOLLEY_SPACING_DEFAULT`. Behavior is identical at the default 34px; the point is that a future `uniqueField` node can tune the fan the same way one can tune shard count. No such node exists yet.
- Reserved for the next phase: skill-tree branch letters **`i` through `l`** (continuing past the existing `a`-`h` in `skilltree-characters*.js`) — do not use them for anything else.

### Path gating — `achievements/core.js`, `achievements/logic.js`, `game.js`, `systems/dungeon.js`

The two alternate routes are now **earned** rather than always offered.

- **`unlocks.unlockedPaths`** = `{ C:bool, D:bool }` — new save field, defaulted in `ensureUnlockShape` exactly like `unlockedEnemies` etc, so saves predating it get it filled on first touch.
- **`isPathUnlocked(path)`** (core.js) — gate helper mirroring `isEnemyUnlocked`; reads `currentUnlocks()`, so a path earned mid-run opens on the **next** run.
- **`unlockPath(path, game)`** (logic.js, beside `bumpStat`) — idempotent granter; writes the live save, never the run snapshot, and toasts.
- Granted in `game.js`'s `descend()`: **C** from the main-route win branch when `!this.floorPath && this.dungeon.floorNum >= OLD_MAIN_ROUTE_FINAL_FLOOR` (the floorNum test is what stops the short 6/8-floor pre-Polish runs from unlocking anything); **D** from the C-branch win branch (`floorNum >= C_LAST_FLOORNUM`), beside `bumpStat('cBranchRunsCompleted', …)`.
- Enforced in `generateDungeon`: `cpathgateNode = (floorNum === 1 && isPathUnlocked('C')) ? … : null;` and `planetariumNode = (floorNum === 2 && !currentFloorPath() && isPathUnlocked('D')) ? … : null;`. A locked path simply means the gate room doesn't generate — the same "filter it out of the pool" convention locked enemies use, not a new failure mode.
- **Known one-time cost:** there is no way to tell from an existing save whether a player had already used C or D, so `unlockedPaths` starts `false` for everyone. Players with old saves must clear the main route once more under this build to re-open C (and the C route to re-open D). Deliberately not worked around with a save-migration heuristic.

## Phase 10 — stage content coordination pass

Infra-only pass that turns the data-only extended route into a route you can actually
walk, and lays down the file skeletons three parallel content implementers fill in.
No real enemy/boss/superboss content — every entry added here is a placeholder.

### Floor 14 no longer ends the run — `data/stages.js`, `game.js`

- **`MAIN_ROUTE_FINAL_FLOOR`** (stages.js) = `MAX_FLOORS - 1` = **34** — the Main path's
  true last floor ("Hyperspace — The Last Exit"). Derived, so it tracks `FLOOR_NAMES`.
- **`descend()`** gained one range block, directly after the hardcoded `floorNum 8..13`
  advance lines and before the `next >= maxFloorsThisRun` win check:
  `if (floorNum >= OLD_MAIN_ROUTE_FINAL_FLOOR && floorNum < MAIN_ROUTE_FINAL_FLOOR) { if (floorNum === OLD_MAIN_ROUTE_FINAL_FLOOR) unlockPath('C', this); this.startFloor(floorNum + 1); return; }`
  So floorNum 14 → 15 → … → 34, and only floorNum 34 falls through to the win branch.
  The `unlockPath('C')` grant fires on the **same** trigger it always did (taking the
  stairs of floorNum 14 on the Main path) — it just moved out of the win branch, which
  that boundary no longer reaches. `unlockPath` is idempotent and the win branch keeps
  its own identical guard, so the grant can never be lost.
- **`isLastFloorOfRun()`** gained the matching line `if (f >= OLD_MAIN_ROUTE_FINAL_FLOOR) return f >= MAIN_ROUTE_FINAL_FLOOR;`
  so the stairs read "DOWN" on floorNum 14-33 and "ESCAPE" only on 34.
- **Unchanged:** floors 0-13 (short 6/8-floor runs still end via `maxFloorsThisRun`
  exactly as before), the C-branch block (`C_LAST_FLOORNUM`) and the D-branch block
  (`D_LAST_FLOORNUM`) — both return before the main chain is ever reached.
- **`startFloor`'s bestiary line** gained a leading `else if (floorNum > OLD_MAIN_ROUTE_FINAL_FLOOR)`
  branch that marks `STAGES[stageIndexForFloor(floorNum)].id`. Without it, floorNum 15+
  would have fallen into the `floorNum >= 12` case (minting ids like `'16'`) or the
  sticky-`floorBranch` case (`'16a'`). Floors 12/13/14 keep their `'13'/'14'/'15'` ids.
- Superboss dispatch for floorNum 15+ is deliberately **not** wired: `startFloor`'s final
  `else` sends them to `resolveGenericBoss`, which falls back to the `stage`-tagged
  `BOSS_LIST` pool (`floorKeyFor` returns `null` out there). Wiring is the content pass's.

### Content-group skeleton files (9 new + 3 new room-template files)

Three groups, each owning four files nobody else edits. Placeholder entries only.

| Group | Stages (floorNum) | Superbosses |
| --- | --- | --- |
| 1 | 4 frozendesert (15-16), 5 badlands (17-18), 6 beach (19-20) | ICE Agent DNB, Mexico DNB, G5 DNB |
| 2 | 7 ocean (21-22), 8 seafloor (23-24), 9 trench (25-26) | Japan DNB, DeanNB, Israel DNB Prime Prime |
| 3 | 10 trenchdepths (27-28), 11 deepdark (29-30), 12 metarealm (31-32), 13 hyperspace (33-34) | Palestine DNB, Warden DNB, Notch DNB, The One True Kirkinator |

- `js/data/enemies/stage{4-6,7-9,10-13}-enemies.js` — `Object.assign(ENEMY_TYPES, {...})`,
  same as `types-2/3/4.js`. Loaded in `index.html` **above `lists.js`**, which snapshots
  `ENEMY_LIST = Object.values(ENEMY_TYPES)` exactly once.
- `js/data/enemies/stage{4-6,7-9,10-13}-bosses.js` — declare a local
  `STAGEn_m_BOSS_TYPES` object, then `Object.assign(BOSS_TYPES, X)` **and**
  `BOSS_LIST.push(...Object.values(X))`. Both halves are required, because `bosses.js`
  snapshots `BOSS_LIST` on its own last line and `resolveGenericBoss` reads the list.
  Loaded **below `bosses.js`**.
- `js/data/enemies/stage{4-6,7-9,10-13}-superbosses.js` — identical two-step against
  `SUPERBOSSES` / `SUPERBOSS_LIST`; loaded below `superbosses.js`.
- `js/data/roomTemplates/stage{4-6,7-9,10-13}-floorfeature.js` —
  `ROOM_TEMPLATES.floorfeature.push({"m":[[1]],"f":[<floorNums>]})`, one per stage, floor
  gated by the existing `tmpl.f` filter in `dungeon.js`'s `templateAllowsFloor`. Loaded
  below `floorfeature.js`, whose untagged `{"m":[[1]]}` stays as the never-empty fallback.

Every placeholder id is prefixed `placeholder_` and reuses an existing behavior
(`'chaser'` / `'bossWarlord'`) so it is valid but obviously not designed content.
Content targets, difficulty ordering, the `dmg`-cap-4 rule and where new `aiXxx` /
`aiBossXxx` behaviors must be registered:
`feature-research/phase10-metaprogression/stage-content-targets.md`.

### Enemy behavior registry — `systems/combat-3.js`

`ENEMY_BEHAVIOR_HANDLERS` (module-level `{}` near the top of `combat-3.js`, next
to `_warnedBehaviors`) lets a content file register a new enemy/boss AI without
editing `updateEnemy`'s shared `switch (e.behavior)`: `ENEMY_BEHAVIOR_HANDLERS.myBehavior
= function(game, e, dt) { ... };` at load time. The switch's `default` case checks
this registry before falling back to `aiChase` with a one-time console warning.
Added for Phase 10's stage-content pass so the three parallel per-stage-group
implementers (each authoring their own new `aiXxx`/`aiBossXxx` functions) never
need to touch `combat-3.js` — each group's new AI file just populates the
registry instead of adding switch cases.

## Phase 10 — stage content GROUP 1 (stages 4-6: Frozen Desert / Badlands / Beach)

Replaces group 1's four skeleton files with real content, plus one new AI file.
floorNum 15-20, the easiest three of the ten new stages but authored a clear step
above the four legacy stages.

| Stage | id (floorNum) | Enemies | Bosses | Superboss |
| --- | --- | --- | --- | --- |
| 4 | `frozendesert` (15-16) | 15 | 4 | ICE Agent DNB (`iceagent`) |
| 5 | `badlands` (17-18) | 15 | 4 | Mexico DNB (`mexico`) |
| 6 | `beach` (19-20) | 15 | 4 | G5 DNB (`g5`) |

### `systems/ai-stage4-6.js` — new

All 60 behavior functions for the group (45 `aiFd*`/`aiBl*`/`aiBc*` trash, 12
`aiBossFd*`/`aiBossBl*`/`aiBossBc*`, 3 superboss routines `aiBossIceAgentDnb` /
`aiBossMexicoDnb` / `aiBossG5Dnb`). Nothing is added to `combat-3.js`'s
`switch (e.behavior)` — the file ends with one `Object.assign(ENEMY_BEHAVIOR_HANDLERS,
{...})` of all 60 keys, which is what the switch's `default` case consults. Registered
in `index.html` after `ai-4.js` (needs `ENEMY_BEHAVIOR_HANDLERS` from `combat-3.js` at
load time, and `chaseSeek`/`seekVector`/`fireProjectileAngle`/`tryMoveEntity`/
`findNearestFloor` at call time).

Shared internal helpers (prefix `g1`, so they can't collide with another group's file):
`g1Ring`, `g1Fan`, `g1AimAtPlayer`, `g1Dash`/`g1StartDash` (committed-dash state),
`g1Blink`, `g1Boom`, `g1Spawn`, `g1Retreat`, `g1Strafe`, and `g1ShovePlayer` — the last
one being `tryMoveEntity` applied to `game.player`, which is how every pull/riptide
pattern in the group moves the player without bypassing collision.

Behavior naming: `fd*` / `bl*` / `bc*` for trash, `bossFd*` / `bossBl*` / `bossBc*` for
bosses, one key per creature — no behavior string is shared between two entries.
Only Enemy-constructor-initialized fields are used for arithmetic; extra per-behavior
state uses `g1`-prefixed properties defaulted on first touch (`e.g1phase || 0`).

### Data files

- `data/enemies/stage4-6-enemies.js` — 45 entries. `hp` identity bands 4-9 / 5-10 / 6-11
  (legacy trash is 1-6 on the same `enemyHpScale` curve); `dmg` never above 3.
- `data/enemies/stage4-6-bosses.js` — 12 entries, `hp` 46-52 / 50-56 / 54-60 against the
  existing 44-62 boss band, `dmg` 3.
- `data/enemies/stage4-6-superbosses.js` — 3 entries, `hp` 66/68/70 in the existing 60-79
  superboss band, `dmg` 4 (the `playerDamageAmount` cap). **Bespoke AI, not the usual
  stat-reuse convention** — each runs an explicit 3-phase cycle. Still not wired to a
  floorNum: `game.js`'s `startFloor` is outside group 1's file ownership.

### Floor-feature rooms and their objects

`data/roomTemplates/stage4-6-floorfeature.js` — **six** templates, one per floor
(`f:[15]` … `f:[20]`), so the two floors of a stage get different rooms:
Slide Hall / The Pinwheel (ice), Sink Basin / Vent Field (badlands), Rip Channel /
Tide Flats (beach).

Nine new `OBSTACLES` kinds in `data/collectibles.js`, all additive reuses of existing
mechanisms (no engine file changed):

- `iceslidan` / `iceslidas` / `iceslidae` / `iceslidaw` — the `current` push
  (`combat-1.js`'s `updatePlayer`, `pushX/pushY * CURRENT_PUSH_SPEED`) at magnitude 1.25.
  The four-facing allowance spent on one object, used as a ring in The Pinwheel.
- `quicksand`, `tidepool` — the Sand Trap `freeze` mechanism (`combat-4.js`,
  `isFreezeTrap`), 0.85s and 0.45s holds, walkable and damageless.
- `dustvent` — the fixed-`angles` turret pipeline, but `walkable:true`, so it spits grit
  on all four diagonals without ever blocking the room.
- `tidesurgee` / `tidesurgew` — stronger horizontal-only currents (1.6) for rip channels.

None are gated in `dungeon.js`'s `obstacleAllowedOnFloor` (which defaults `true`); their
only gate is the `f:[...]` filter on the six templates, which are their sole consumer.

---

## Phase 10 — stage content GROUP 2 (stages 7-9: Ocean / The Sea Floor / Trench)

Second of the three parallel content passes. Same shape as Group 1's above: four data
files owned outright, one new AI file, and an additive block in `data/collectibles.js`.
Nothing shared was edited — no `combat-3.js`, no `ai-1..4.js`, no `types-*.js`, no
`bosses.js`/`superbosses.js`, no `dungeon.js`.

| Stage | id (floorNum) | Enemies | Bosses | Superboss |
| --- | --- | --- | --- | --- |
| 7 | `ocean` (21-22) | 15 | 4 | Japan DNB (`japan`) |
| 8 | `seafloor` (23-24) | 15 | 4 | DeanNB (`deannb`) |
| 9 | `trench` (25-26) | 15 | 4 | Israel DNB Prime Prime (`israelprimeprime`) |

### `systems/ai-stage7-9.js` — new

All 60 behavior functions for the group: 45 trash (`aiOc*` / `aiSf*` / `aiTr*`), 12
regular bosses (`aiBossTideCaller`, `aiBossMaelstrom`, `aiBossLeviathanWake`,
`aiBossBellDiver`, `aiBossSiltMonarch`, `aiBossLanternQueen`, `aiBossPressureHulk`,
`aiBossElderNautilus`, `aiBossHadalWarden`, `aiBossTheCrush`, `aiBossSmokerColossus`,
`aiBossTrenchmaw`) and 3 superbosses (`aiBossJapanDnb`, `aiBossDeanNb`,
`aiBossIsraelPrimePrime`). The file ends with one
`Object.assign(ENEMY_BEHAVIOR_HANDLERS, {...})` of all 60 keys, which is what
`combat-3.js`'s `switch (e.behavior)` `default` case consults. Registered in `index.html`
directly after `ai-stage4-6.js` (needs `ENEMY_BEHAVIOR_HANDLERS` at load time; every
other global — `chaseSeek`, `seekVector`, `tryMoveEntity`, `fireProjectileAt/Angle`,
`findNearestFloor`, `Projectile`, `Explosion`, `damagePlayer`, `playerDamageAmount`,
`handleEnemyDeath`, `Enemy`, `ENEMY_TYPES`, `aiWander` — only at call time).

Shared internal helpers, prefixed `s79` so they cannot collide with Group 1's `g1*` or
Group 3's set: `s79Init` (lazy per-entity state seed), `s79Aim`, `s79Ring`, `s79Arc`,
`s79Drag` (suction — `tryMoveEntity` applied to `game.player`, so a pull obeys walls and
can never yank the player through geometry), `s79Pyre`/`s79Pyres` (delayed ground bursts
queued on the enemy's own `pyres` array, the field `aiBossDuneRavager` already uses, so
pending blasts die with their owner), `s79Warp`, `s79Spawn`, and `s79Phase` (the HP-band
phase machine with a one-second do-nothing transition beat, the readability trick
`aiBossOneTrueDnb` uses).

Behavior naming: `oc*` / `sf*` / `tr*` for trash, `boss*` for bosses and superbosses,
one key per creature — no behavior string is shared between two entries, and none
collides with an existing `case` in `combat-3.js` or with another group's keys.
`entities.js` is out of scope for this group, so any state not on the Enemy/Boss
constructor's eager list is seeded through `s79Init` on first tick rather than assumed.

### Data files

- `data/enemies/stage7-9-enemies.js` — 45 entries. `hp` identity bands 3-12 / 7-16 /
  10-18 against Group 1's 4-11 and legacy stage 3's 2-9 on the same `enemyHpScale`
  (1.20^floorNum) curve; `dmg` never above 4. Three ids are also minion sources for
  bosses in this group: `bubblemine` (Bell Diver), `lanternshoal` (DeanNB) and
  `blacksmoker` (Black Smoker Colossus, which is also force-placed in a feature room).
- `data/enemies/stage7-9-bosses.js` — 12 entries, `hp` 58-64 / 64-72 / 74-80 against the
  existing 40-58 boss band and Group 1's 46-60; `dmg` 3-4. `burstRadius` is set on the
  four whose AoE lands away from their own body (`leviathanwake`, `belldiver`,
  `siltmonarch`, `smokercolossus`) so `render.js` can draw the ground-target marker.
- `data/enemies/stage7-9-superbosses.js` — 3 entries, `hp` 82/85/88, `dmg` 4.
  **Bespoke AI, deliberately departing from the stat-reuse convention** the C-branch and
  Phase 7a blocks in `superbosses.js` describe: 4, 4 and 5 HP-banded phases respectively.
  Not wired to a floorNum — `game.js`'s `startFloor` is outside this group's ownership.

Every entry in all three files carries a `desc`, matching what `bestiary.js`'s
`renderBestiarySimple` reads.

### Floor-feature rooms and their objects

`data/roomTemplates/stage7-9-floorfeature.js` — **six** templates, one per floor
(`f:[21]` … `f:[26]`): Crosscurrent Shelf / The Gyre (ocean), Bloom Field / The Lantern
Walk (sea floor), The Squeeze / Collapse Chamber (trench). Two of them force a specific
anchored enemy into the room's focal point (`spouter` in the eye of The Gyre,
`blacksmoker` in the centre of Collapse Chamber, `ventworm` overlooking The Lantern
Walk).

Six new `OBSTACLES` kinds in `data/collectibles.js`, appended as one contiguous
"CONTENT GROUP 2" block after Group 1's, all additive reuses of existing mechanisms:

- `riptiden` / `riptides` / `riptidee` / `riptidew` — the `current` push at magnitude
  1.9, the strongest in the game (riptide 1.9 > Beach tide surge 1.6 > ice slide 1.25 >
  sewer current 1.0, matching the stage ordering). The four-facing allowance spent on one
  object, used as a rotating ring in The Gyre. These **cannot** reuse the existing
  `currentn/s/e/w` kinds: `dungeon.js`'s `obstacleAllowedOnFloor` hard-gates those four to
  `floorPath === 'C'`, and `dungeon.js` is not this group's file.
- `glowbloom` — the thornbush mechanism (`hazard` + `attackable:false` + `destructible`):
  non-solid, walk through and take the hit, immune to attacks, only a bomb clears it.
- `pressurecolumn` — the spikedrock mechanism (`hazard` + `solid` + `destructible`):
  blocks like a rock and hurts on contact, which is what makes a Trench feature room a
  corridor where every wall is also a damage source.

None are gated in `obstacleAllowedOnFloor` (default `true`); their only gate is the
`f:[...]` filter on the six templates, which are their sole consumer.

---

## Phase 10 — stage content GROUP 3 (stages 10-13: Trench Depths / Deep Dark / Meta Realm / Hyperspace)

Third and last of the three parallel content passes, and the deepest tier in the game:
floorNum 27-34, ending on `MAIN_ROUTE_FINAL_FLOOR` (34, "Hyperspace — The Last Exit").
Same shape as Groups 1 and 2: four data files owned outright, one new AI file, and an
additive block in `data/collectibles.js`. Nothing shared was edited — no `combat-3.js`,
no `ai-1..4.js`, no `types-*.js`, no `bosses.js`/`superbosses.js`, no `dungeon.js`, no
`game.js`, no `entities.js`.

| Stage | id (floorNum) | Enemies | Bosses | Superboss |
| --- | --- | --- | --- | --- |
| 10 | `trenchdepths` (27-28) | 15 | 4 | Palestine DNB (`palestine`) |
| 11 | `deepdark` (29-30) | 15 | 4 | Warden DNB (`warden`) |
| 12 | `metarealm` (31-32) | 15 | 4 | Notch DNB (`notch`) |
| 13 | `hyperspace` (33-34) | 15 | 4 | The One True Kirkinator (`kirkinator`) |

Stage identities, one idea each: Trench Depths = **pressure** (area denial around a
point), Deep Dark = **information** (invisible, dormant, or behind you), Meta Realm =
**the game misbehaving** (rewinds, off-screen spawns, walls that are not there), and
Hyperspace = **velocity** (lines and folds rather than aimed shots).

### `systems/ai-stage10-13.js` — new

All 80 behavior functions for the group: 60 trash (`aiG3Td*` / `aiG3Dd*` / `aiG3Mr*` /
`aiG3Hs*`), 16 regular bosses (`aiG3BossAbyssalMaw`, `aiG3BossCrushChoir`,
`aiG3BossHadalAnchor`, `aiG3BossVentTyrant`, `aiG3BossUnlit`, `aiG3BossLongQuiet`,
`aiG3BossBlindHunter`, `aiG3BossGloomweaver`, `aiG3BossPatchNotes`,
`aiG3BossNullPointer`, `aiG3BossRenderGhost`, `aiG3BossAuthorsMargin`,
`aiG3BossFoldLine`, `aiG3BossEventHorizon`, `aiG3BossLightYear`, `aiG3BossLastExit`)
and 4 superbosses (`aiG3SbPalestine`, `aiG3SbWarden`, `aiG3SbNotch`,
`aiG3SbKirkinator`). Each is published with a single
`ENEMY_BEHAVIOR_HANDLERS.g3Xxx = function aiG3Xxx(game, e, dt){...};` — a *named*
function expression, so stack traces and profiles read like `ai-1..4.js`'s plain
declarations — which is what `combat-3.js`'s `switch (e.behavior)` `default` case
consults. Registered in `index.html` directly after `ai-stage7-9.js`: it needs
`ENEMY_BEHAVIOR_HANDLERS` (a `const` in `combat-3.js`) at load time, and everything else
only at call time.

Shared internal helpers, prefixed `g3` so they cannot collide with Group 1's or Group 2's
`s79*` set: `g3(e)` (the lazily-created per-entity scratch bag — one object holding
`t/t2/t3`, `n/n2`, `a/a2`, `dir`, `on/on2`, `x/y`, `hist`), `g3Blast`, `g3Converge` (a
ring of bolts spawned *on* the player's radius and aimed inward — the inverse of
`dnbRing`, and this group's signature "the room closes on you" attack), `g3Wall` (a line
of bolts perpendicular to their own travel, with one seam), `g3Blink`, `g3Spawn`,
`g3Waves` (the two staggered minion waves, latched on the engine's own
`minionsSpawned`/`minions2`), and `g3Back`.

`entities.js` is out of scope for this group, so **no new Enemy/Boss constructor field
was added**: everything not on that constructor's eager-init list lives in `g3(e)`, which
is created on first touch with every numeric field already 0. Engine fields that *are*
eagerly initialized are still used directly where their meaning matches — in particular
`lobTimer`/`lobTime`/`lobX`/`lobY`, because `render.js`'s `drawEnemy` draws the
ground-target ring off them (`tdcolumn`, `mrassert`, `venttyrant` and `authorsmargin` all
telegraph through it).

Two behaviors deliberately bypass the collision pass — `g3MrGhost` and
`g3BossRenderGhost` move by writing `e.x`/`e.y` directly, clamped to the room bounds, so
walls genuinely do not apply to them. Two others mutate the room: `g3MrEditor` and
`g3BossRenderGhost` set `ob.destroyed = true` on obstacles they reach (and
`node.tileLayerDirty`), and `aiG3SbNotch` strips the arena outright once below 25%.

### Data files

- `data/enemies/stage10-13-enemies.js` — 60 entries, `hp` 29-42 (stage 10) rising to
  44-64 (stage 13), continuing the ramp the coordination pass laid down for the ten new
  stages and escalating inside the group; `dmg` 2-4, never above the
  `playerDamageAmount` cap. `burstRadius` set on the two whose AoE lands away from their
  body (`tdcolumn`, `mrassert`).
- `data/enemies/stage10-13-bosses.js` — 16 entries, `hp` 60-68 / 63-67 / 66-73 / 70-76
  across the four stages, authored against the *existing* 40-58 boss band rather than at
  "floor 30 scale" (`bossHpScale` is 1.36^floorNum and would otherwise apply twice);
  `dmg` 4. `burstRadius` on `venttyrant` and `authorsmargin`.
- `data/enemies/stage10-13-superbosses.js` — 4 entries, `hp` 84/88/92/96, `dmg` 4. All
  four get **bespoke AI**, departing from the stat-reuse convention the C-branch and
  Phase 7a blocks in `superbosses.js` describe, for the same reason Group 2 did.
  `kirkinator` (96) is the highest authored `hp` in the game: five HP bands plus a sixth
  layered "everything at once" state, and a third minion wave at 12% that no other fight
  has. Not wired to a floorNum — `game.js`'s `startFloor` is outside this group's
  ownership (see the group's audit).

Every entry in all three files carries a `desc`, matching what `bestiary.js`'s
`renderBestiarySimple` reads.

### Floor-feature rooms and their objects

`data/roomTemplates/stage10-13-floorfeature.js` — **eight** templates, one per floor
(`f:[27]` … `f:[34]`): The Crush Zone / The Black Vents, No Light Reaches / The Long
Quiet, Behind The Curtain / The Author's Margin, Fold / The Last Exit. Six of them force
a specific enemy into the room's focal point (`tdcrusher`, `tdcolumn`, `ddpounce` ×2 in
the maze itself, `ddstalker`+`ddwhisper`, `mrghost`, `mreditor`, `hslancer`,
`hsterminus`).

Seven new `OBSTACLES` kinds in `data/collectibles.js`, appended as one contiguous
"CONTENT GROUP 3" block after Group 2's, all additive reuses of existing mechanisms:

- `crushvent` — the fixed-angle turret pipeline (`projectile` + `angles`) taken to all
  eight bearings on a solid indestructible body. With no `current`/hazard/kind-specific
  art branch it falls through `Util.drawObstacle` to the rock body, which is what a black
  smoker should look like anyway.
- `lurehorn` — the targeting turret plus purplefire's `homing`, on a 4.5s cooldown: one
  slow curving bolt from something in the dark. Solid, so it is also cover that hunts.
- `phantomwall` — the reality break, and pure data: `walkable:true` on a body carrying
  `tallhardrock`'s exact colours and `tall` flag, so it *renders* as a wall (the rock
  branch keys off `ob.tall`) and *behaves* as open floor for movement, enemy pathing,
  line of sight and projectiles. Note it is walkable for enemies too — `ai-1.js`'s
  `makeIsBlockedFn` skips `isWalkable` — which is the point.
- `warpstreamn` / `warpstreams` / `warpstreame` / `warpstreamw` — the `current` push at
  magnitude 2.4, the strongest in the game and the top of the established ordering
  (sewer current 1.0 < ice slide 1.25 < tide surge 1.6 < riptide 1.9 < warp stream 2.4).
  The four-facing allowance spent on one object; like Group 2's riptides they cannot
  reuse `currentn/s/e/w`, which `obstacleAllowedOnFloor` hard-gates to `floorPath 'C'`.

None are gated in `obstacleAllowedOnFloor` (default `true`); their only gate is the
`f:[...]` filter on the eight templates, which are their sole consumer.

### Skill tree — Phase 10 Part B, Group 1 (`achievements/skilltree-characters-4a.js`)

250 new character nodes, **50 each** for `earth`, `pegasus`, `unicorn`, `batpony`,
`zebra`. Pure data appended onto `SKILL_TREE_NODES` / `SKILL_TREE_NODES_BY_ID`; no engine
change. Branch letters **i / j / k / l** (a–h belong to
`skilltree-characters{,-2,-3}.js`), ids `char_<classId>_<key>`.

Four fresh branches per character hung directly off `char_hub_<classId>` — no a–h node is
re-parented or edited. All four branches share one wide, shallow shape (max depth 5), so
no leaf costs more than five purchases and every branch forks immediately:

```
X1                       (X = i|j|k|l; parent = char_hub_<classId>)
 +- X2                    +- X3
 |   +- X4                |   +- X6
 |   |   +- X8            |   |   +- X10
 |   |       +- X12       |   |       +- X13   (13-node branches only)
 |   +- X5                |   +- X7
 |       +- X9            |       +- X11
```

Branch sizes are **i:13, j:13, k:12, l:12 = 50**.

Authoring shape: `SKILL_TREE_CHARACTER_CONFIG_4A` is an array of
`{ classId, nodes:{ key:{ parent, name, desc, cursed?, effects:[...] } } }`, expanded by
**`buildCharacterSkillNodes4A`** into `SKILL_TREE_CHARACTER_NODES_4A`. `parent` is either
the literal string `'hub'` or a branch key **within the same character**, so a parent
reference can never dangle outside this file plus the hub `skilltree.js` defines. Every
node uses the plural `effects:[...]` shape and costs 1 point.

`cursed:true` follows the `-characters-3.js` convention — debuff-only, and the sole
parent of the payoff beneath it, so that payoff is structurally unreachable without
eating the cost. **26 cursed nodes** here (one per branch, plus a second on
`earth_i7`/`earth_l1`, `unicorn_j1`, `batpony_j1`/`batpony_k1`, `zebra_l1` where the
branch opener itself is the price of entry). On cooldown fields a *positive* amount is
the debuff direction, so several cursed nodes carry positive `meleeCooldown`/
`fireCooldown` and are still pure penalties. Anything genuinely powerful that is not
behind a curse instead carries its cost inline as a second negative effect on the same
node (~20 such two-effect trade-off nodes).

Per-character mechanic hooks (the majority of each 50 is class-specific):

- **earth** — the immovable bruiser. Branch **i** is a real armour line
  (`damageTakenMult` `uniqueField`, −0.23 summed across 10 nodes, paid for with speed and
  melee cooldown); **j** grants `shockwaveAttack` (her swing shatters rock) and turns
  melee reach into a ground tremor via `baseRangeTiles` (+1.5, the group's only branch to
  hit its own bound exactly); **l** is *Skyfurrow*, a `canFly` `uniqueFlag` grant — the
  one thing an earth pony is not — gated behind a cursed −5% melee node and carrying
  +5% `damageTakenMult` on the grant node itself.
- **pegasus** — the fast, flimsy flier. Branch **j** *Featherframe* shrinks her actual
  `player.radius` (12px → 8.4px across 9 nodes) while stacking +13% `damageTakenMult`:
  a genuinely smaller hitbox bought with fragility. Branch **i** gives her a wing-downdraft
  `shockwaveAttack` plus its own `rockCoinChance` payout. **She gets zero dodgeChance
  here on purpose** — `-characters-2.js` already puts her at +0.24 of the 0.25 cap.
- **unicorn** — the horn. Branch **j** *Shardsong* is a full attack transformation on a
  single node: `charged` + `crystalVolley` `uniqueFlag`s plus a `crystalShardCount` seed
  of 3 and `chargeTime` +0.55s, so her loose bolts become a hold-and-release fan of
  converging shards that ignore range; later nodes add a 4th/5th shard, claw the charge
  time back down to ~0.2s and speed the shards up. Branch **k** grants `unlimitedRange`.
  The volley's *spacing* is deliberately untouched: `crystalVolleySpacing` seeds to 0 for
  any class without `def.crystalVolley` and `combat-2.js` falls back to
  `CRYSTAL_VOLLEY_SPACING_DEFAULT` on a falsy value, so it is not a usable knob here.
- **batpony** — the night hunter that feeds. Branch **k** *Roost Swarm* borrows
  `summonsChangelings` as a bat roost; because `changelingMinionDmg`/`Radius` default to
  **0** for every non-queen class, the grant node must seed them itself (0.45 dps / 22px)
  or the swarm is inert — later nodes take it to 0.82 dps / 40px, three roostmates
  (`maxChangelingMinions` +1) and a 5.5s recall. Branch **j** pushes her innate lifedrink
  (the only `lifestealChance` in the group, +0.08 against the 0.10 override cap); branch
  **i** is echolocation-as-`baseRangeTiles`.
- **zebra** — the apothecary brawler. Branch **i** is her brew satchel across the four
  chance fields her existing tree leaves headroom on (stun/charm/fear/vulnerable);
  **j** is thrown-gourd reach plus pigment-grinding `shockwaveAttack` + `rockCoinChance`;
  **k** turns warpaint into real mitigation (−0.24 `damageTakenMult`); **l** *The Bone
  Toll* buys her signature melee spikes with +0.15 `damageTakenMult` across three nodes.
  **She gets zero venomChance here on purpose** — already +0.24 from `-characters-2.js`.

Mechanics deliberately **not** borrowed for the four melee classes: `greenFireAttack`,
`innateFireRing` and `canBuildTurrets`. All three derive damage from
`player.rangedDamage` (0 for every melee class), and the first two also suppress the
normal attack dispatch entirely (`if (!player.greenFireAttack && !player.innateFireRing)`
in `combat-1.js`'s `updatePlayer`) — granting one would leave the character with no
working attack. `redMax` is likewise avoided: it is mutated *during* a run (devil deals,
eternal heart) and `applySkillTreeUniqueFieldBonuses` rewrites `base + bonus` on every
recalc, which would wipe those.

Cap discipline: every `(classId, stat)` sum was recomputed across the **full** prior tree
(`skilltree-characters.js` + `-2.js` + `-3.js`) plus this file. No stat this file
contributes to is clamped; the highest are `batpony onKillHealChance` at exactly 0.25 and
`pegasus speed`/`zebra speed` at 0.24. `uniqueField` `min`/`max` are identical across
every node in this file targeting the same `classId|field` pair, since
`applySkillTreeUniqueFieldBonuses` takes the tightest bounds it sees. Full table in
`feature-research/phase10-metaprogression/audit-skilltree-group1.md`.

### Skill tree — Phase 10 Part B, Group 3 (`achievements/skilltree-characters-4c.js`)

250 new character nodes, **50 each** for `dragon`, `windigo`, `kelpie`, `breezie`,
`dnbpony`. Pure data appended onto `SKILL_TREE_NODES` / `SKILL_TREE_NODES_BY_ID`; no
engine change. Branch letters **i / j / k / l** (a–h belong to
`skilltree-characters{,-2,-3}.js`), ids `char_<classId>_<key>`.

Four fresh branches per character, hung directly off `char_hub_<classId>` — no a–h node
is re-parented or edited. Each branch is a chain that forks once near the top, then the
two sides run to their own depths:

```
char_hub_<classId>
  +- i1 -> i2 -> i3 -> i4 -+- i5 (or i5/i6 pair) ...   (13-node branch)
  |                        +- ...
  +- j1  (13 nodes)
  +- k1  (12 nodes)
  +- l1  (12 nodes)                       13+13+12+12 = 50
```

Authoring shape differs from Group 5's: nodes are written as a compact
`{ k, p, name, desc, cursed?, e | es }` config (`SKILL_TREE_CHARACTER_CONFIG_4C`, keyed
by classId) and expanded by `buildCharacterSkillNodes4C`. `p:null` means "parent is the
hub"; any other `p` is a branch key **within the same character**, so a parent can never
dangle outside this file plus the hub `skilltree.js` itself defines. Three effect-literal
helpers keep 250 nodes readable and are the only new functions here:

- **`ST(classId, stat, amount)`** — a plain `{type:'stat'}` effect.
- **`UF(classId, field, amount)`** — a `{type:'uniqueField'}` effect whose `min`/`max` are
  looked up from **`SKILL_TREE_UF_BOUNDS_4C`** (keyed `'<classId>|<field>'`), so a pair's
  bounds physically cannot drift between nodes — `applySkillTreeUniqueFieldBonuses` takes
  the *tightest* bounds it sees, which would otherwise make the ceiling depend on purchase
  order.
- **`FL(classId, field, value)`** — a `{type:'uniqueFlag'}` effect.

`cursed:true` follows the `-characters-3.js` convention: debuff-only, and the sole parent
of everything below it, so the payoff is structurally unreachable without eating the cost.
Note that on cooldown fields a *positive* amount is the debuff direction
(`fireCooldown`/`meleeCooldown` rise = worse), so five cursed nodes here carry a positive
amount and are still pure penalties.

Per-character mechanic hooks (the majority of each 50 is class-specific, not stat sticks):

- **dragon** — the hold-to-charge jet. Branch **l** is the biggest swing in the group:
  *The Prismatic Maw* grants `crystalVolley` (`uniqueFlag`) plus a `crystalShardCount`
  seed of 3, converting the piercing fire beam into a cursor-converging shard fan
  (`combat-2.js`'s `playerChargedBeamAttack` dispatches on that flag; `crystalShardCount`
  seeds to 0 for non-Crystal-Pony classes, so the seed is mandatory), and three *Facet*
  nodes take it to the clamp of 6. `crystalVolleySpacing` is deliberately **not** targeted
  — it also seeds to 0 for dragon, so a bonus there would fight
  `CRYSTAL_VOLLEY_SPACING_DEFAULT`'s `||` fallback rather than widen anything. Branches
  i/j/k tune `damageTakenMult` (hide), the deliberately-short `rangeTiles`, and fire rate.
- **windigo** — branch **l**, *The Blizzard's Wake*, grants `innateFireRing`
  (`uniqueFlag`) plus `fireRingRadius`, i.e. she stops firing **entirely**
  (`combat-1.js` gates the normal attack dispatch on that same flag) in exchange for a
  permanent self-centred whiteout, taken to its 60px clamp by four widening nodes. Because
  the ring's DPS is `rangedDamage / fireCooldown`, the branch's own ranged-damage and
  cooldown nodes keep working after the conversion. Branches i/j/k spend her last 0.05 of
  `freezeChance` headroom and build the vulnerable/stun/dodge spirit around it.
- **kelpie** — branch **l**, *The Drowned Thralls*, grants `summonsChangelings` plus
  `changelingMinionDmg`/`changelingMinionRadius` seeds (both 0 for her, so both are
  mandatory), with `maxChangelingMinions` and `changelingSummonCooldown` sub-lines. Branch
  i is the reach-vs-swing-speed trade on her 2.25-tile melee; j is the luring song
  (charm/fear); k is `damageTakenMult` brackish hide.
- **breezie** — branch **l**, *Borrowed Ember*, is the only node in the tree that turns a
  `uniqueFlag` **off**: it grants `charged` and revokes `unlimitedRange`, so her dust
  motes stop being infinite-range and she gains a dragon's charged jet instead, with
  `chargeTime` seeded to +0.35 (her def has none) and `rangeTiles` suddenly mattering.
  Branch j is survival on a two-heart frame — the cursed *Paper Wings* (+15%
  `damageTakenMult`) gates the entire padding/dodge spine.
- **dnbpony** — branch **l**, *Speaker Stacks*, grants `canBuildTurrets` plus
  `turretDamageMult` (to its 0.60 clamp) and `maxTurrets` (+2, i.e. 5). Note the build
  interval **is** `fireCooldown` (`updateTurretBuild`), so *Feedback Loop*'s +5%
  `fireCooldown` is a genuine double cost. Branch i exploits the huge `rangedDamage`
  headroom a–h left him; j is tempo; k is the subwoofer (`charm`/`fear`/`damageTakenMult`).

Cap discipline: every `(classId, stat)` total was recomputed across **all** skilltree
files (a–h plus this one) and stays inside `SKILL_TREE_STAT_CAP` (0.25); every
`uniqueField` group stays inside its own tightest `[min,max]`. Two pre-existing
conditions are worked around rather than added to: `dragon`/`breezie`/`dnbpony` were
**already** past `SKILL_TREE_STAT_CAP_OVERRIDES.lifestealChance` (0.10) at 0.15–0.16 from
the a–h files, so this file adds **zero** lifesteal for those three (only `kelpie`, at 0,
takes any — +0.04); and `dragon|chargeTime` was already saturated at −0.19 against
`-characters-2.js`'s `[-0.2, 0]` bounds, so this file reproduces those bounds verbatim and
only ever pushes that field in the **penalty** direction (four nodes summing to exactly
+0.19, landing a fully-cursed dragon back on the stock 0.5s charge with no dead node).
Chance-type stats are concentrated into a few nodes per character rather than spread
across all 50. Full table:
`feature-research/phase10-metaprogression/audit-skilltree-group3.md`.

### Skill tree — Phase 10 Part B, Group 5 (`achievements/skilltree-characters-4e.js`)

250 new character nodes, **50 each** for `gargoyle`, `changedling`, `changelingqueen`,
`filly`, `engineerpony`. Pure data appended onto `SKILL_TREE_NODES` /
`SKILL_TREE_NODES_BY_ID`; no engine change. Branch letters **i / j / k / l** (a–h belong
to `skilltree-characters{,-2,-3}.js`), ids `char_<classId>_<key>`.

Shared topology (`SKILL_TREE_TOPOLOGY_4E`, emission order `SKILL_TREE_ORDER_4E`), four
fresh branches hung directly off `char_hub_<classId>` — no a–h node is re-parented or
edited:

```
char_hub_<classId>
  +- i1 -+- i2a -> i3a -> i4a -> i5a -> i6 -> i8      (13-node branch)
  |      +- i2b -> i3b -> i4b -> i5b -> i7 -> i9
  +- j1  (same 13-node shape)
  +- k1  (same shape minus k9; 12 nodes)
  +- l1  (same shape minus l9; 12 nodes)          13+13+12+12 = 50
```

Every node uses the `effects:[...]` (plural) shape. `cursed:true` follows the
`-characters-3.js` convention: debuff-only, and the sole parent of everything below it,
so the payoff is structurally unreachable without eating the cost first.

Per-character mechanic hooks (the majority of each 50 is class-specific, not stat sticks):

- **gargoyle** — `innateVulnerableChance` spent to its last 0.06 of headroom, then the
  "marked prey" fiction carried by fresh fields (fear/venom/stun/freeze). Branch i is a
  two-way `damageTakenMult` knob: *Granite Hide* → *Cathedral Ballast* buys armor with
  speed and swing time; the cursed *Sun-Cracked Shell* (+12% damage taken) gates a
  lifesteal/on-kill-heal spine instead.
- **changedling** — `fireRingRadius` (the always-on mobile ring), `damageTakenMult` for
  her unfinished shell, and a branch-l capstone that grants her `summonsChangelings`
  (`uniqueFlag`) plus a `changelingMinionDmg` seed — she has no minion damage of her own —
  paid for in ranged damage, speed and fragility. Two cursed nodes shrink the ring itself.
- **changelingqueen** — the two hive knobs `-characters-2.js` left headroom on
  (`changelingMinionRadius`, the last 0.30 of `changelingMinionDmg`) plus, for the first
  time, her neglected personal pool: `fireZoneRadius` / `fireZoneRange` /
  `fireZoneRootMult`. The cursed *Mired in Her Own Fire* deepens the self-root before the
  *Hovering Monarch* line lifts it back out.
- **filly** — the last 0.06 of `innateCharmChance`, a real `meleeDamage` climb ("hooves
  too small for a proper kick" growing up), and *Borrowed Pickaxe*: `shockwaveAttack` via
  `uniqueFlag` (dispatched generically in `combat-1.js`'s `playerMeleeAttack`) bought with
  +5% `meleeCooldown`, feeding a `rockCoinChance` sub-line.
- **engineerpony** — the last 0.06 of `turretDamageMult`, `damageTakenMult` emplacement
  armor, and *Beyond the Wall*: `unlimitedRange` via `uniqueFlag` bought with −6% ranged
  damage on top of the branch's cursed +6% `fireCooldown` opener. Branch l's cursed
  *Stripped Gears* pays for her own mobility out of turret damage.

Cap discipline: every `(classId, stat)` total was recomputed across **all** skilltree
files (a–h plus this one) and stays inside `SKILL_TREE_STAT_CAP` (0.25) /
`SKILL_TREE_STAT_CAP_OVERRIDES.lifestealChance` (0.10); every `uniqueField` group stays
inside its own tightest `[min,max]`. Chance-type stats are concentrated into a few nodes
per character rather than spread across all 50. Full table:
`feature-research/phase10-metaprogression/audit-skilltree-group5.md`.

### Skill tree — Phase 10 Part B, Group 4 (`achievements/skilltree-characters-4d.js`)

250 new character nodes, **50 each** for `crystalpony`, `mule`, `alicorn`, `changeling`,
`diamonddog`. Pure data appended onto `SKILL_TREE_NODES` / `SKILL_TREE_NODES_BY_ID`; no
engine change. Branch letters **i / j / k / l** (a–h belong to
`skilltree-characters{,-2,-3}.js`), ids `char_<classId>_<key>`.

Topology — four fresh branches hung directly off `char_hub_<classId>`; no a–h node is
re-parented or edited. Built by a local `build(classId, defs)` helper inside the file's
IIFE (`d.k` = key, `d.p` = parent key or `null` for "hang off the hub", `d.c` = cursed);
a single-effect node emits `effect`, a multi-effect node emits `effects:[...]`:

```
char_hub_<classId>
  +- x1 -> x2 -+- x3a -> x4a -> x5a -> x6a -> x7 [-> x9]
               +- x3b -> x4b -> x5b -> x6b -> x8

x = i (13 nodes), j (12), k (13), l (12)        13+12+13+12 = 50
```

Every `x3b` is a `cursed:true` gate in the `-characters-3.js` sense — one negative `stat`
effect and nothing else, and the sole parent of the whole b-side chain beneath it, so
that side is structurally unreachable without eating the debuff first. 20 cursed nodes
across the 250 (four per character).

Per-character mechanic hooks (the majority of each 50 is class-specific, not stat sticks;
every hook is an already-shadowed `Player` field — a `uniqueField` on an unshadowed field
is a silent no-op, so nothing new is invented here):

- **crystalpony** — branch **i, `crystalVolleySpacing`, is the user's explicitly requested
  feature**: eleven nodes that COMPRESS the px gap between her three shard start points
  (seeded from `CRYSTAL_VOLLEY_SPACING_DEFAULT` = 34 in `combat-2.js`), summing to exactly
  `-24` against a `min:-24, max:12` bound — 34px → a 10px floor, deliberately clear of 0
  because `playerCrystalVolleyAttack` reads `player.crystalVolleySpacing ||
  CRYSTAL_VOLLEY_SPACING_DEFAULT` and a 0 would silently snap back to 34. A fully
  compressed fan makes all her shards converge on effectively one point — a single
  multi-damage stream — so it is paid for throughout the branch: −3% ranged damage and
  −3% speed on the way in, +13% `damageTakenMult` across *Zero-Spread Discipline* and the
  *One Wound, Three Shards* capstone. Branch **j** works `chargeTime` in BOTH directions
  (*Deep Draw* / *Overdrawn Facet* buy ranged damage with a longer draw — the branch's Soy
  Milk — while the cursed *Clouded Core* gates a snap-fire line). Branch **k** borrows
  `canBuildTurrets` as planted crystal sentries (+`turretDamageMult` to its 0.5 max,
  `maxTurrets` +3 after clamp), safe because turret damage is `player.rangedDamage *
  turretDamageMult` and she is ranged. Branch **l** is `damageTakenMult` downward — her
  8-heart gemhide. `crystalShardCount` is deliberately untouched: `-characters-2.js`
  already sums it to its own `max:3`, and `applySkillTreeUniqueFieldBonuses`' tightest-
  bounds rule would make any further node there a no-op.
- **mule** — has no unique flag in `data/core.js` at all, so branch **i** borrows
  `shockwaveAttack` (rock-shattering melee, dispatched generically in `playerMeleeAttack`)
  bought with +5% `meleeCooldown`, feeding a `rockCoinChance` prospector line to its 0.15
  max. Branch **j** is the load itself — `damageTakenMult` UP for haul stats (luck, magnet,
  reach) — and branch **k** spends it back down to the `-0.25` floor at the cost of speed,
  reach and swing time. `startingPickup` is deliberately unused anywhere in this file:
  that effect type carries no `classId` and `applySkillTreeStartingPickups` applies it to
  every class, so it could never be a mule-specific node.
- **alicorn** — branch **i** deepens the `innateFireRing` `-characters-2.js` granted her:
  `fireRingRadius` to its 30 ceiling, plus the `rangedDamage`/`fireCooldown` the ring's dps
  is literally computed from in `updateFireRingAttack`. Branch **j** borrows
  `canBuildTurrets` as conjured wards. Branch **k** makes her 4-heart fragility an explicit
  dial — `damageTakenMult` +20% early for offense (*Gossamer Frame*, *Thin Veil*), −28%
  much deeper in (*Warded Frame* → *Immortal Frame*, the last paid in ranged damage).
- **changeling** — branch **i** grants `summonsChangelings` (the Queen's mechanic) and then
  has to BUILD it: her seeded `changelingMinionDmg`/`changelingMinionRadius` are 0, so the
  flag alone does nothing until the branch pays for coals (0.6/s), reach (22px), two extra
  drones and −4s of summon interval, at −13% ranged damage and +6% damage taken. Branch
  **j** is `fireZoneRootMult`, her single biggest live drawback (0.25 — quarter speed while
  holding her own pool down) lifted to 0.85; she is the only class it is reachable for,
  since `combat-1.js` gates `miredInOwnFire` on `player.greenFireAttack`. Branch **k**
  spends the last of the `fireZoneRadius`/`fireZoneRange` headroom (both land exactly on
  their 30/20 ceilings).
- **diamonddog** — no borrowed flag on purpose: every ranged-damage-driven mechanic (fire
  ring, green fire, turrets) computes damage from `player.rangedDamage`, which is 0 for a
  melee class, so granting her one would be a dead node. Her branches work what her own
  shockwave identity owns — `rockCoinChance`'s last 0.02 of headroom (lands exactly on
  0.15), claw reach via `rangeTiles`, `damageTakenMult` as the tunneller's hide (−0.22),
  and rubble-flavored on-hit statuses (stun/venom/vulnerable).

Cap discipline: every `(classId, stat)` total was recomputed across **all** skilltree
files (a–h plus this one) and stays inside `SKILL_TREE_STAT_CAP` (0.25) /
`SKILL_TREE_STAT_CAP_OVERRIDES.lifestealChance` (0.10); every `uniqueField` group stays
inside its own tightest `[min,max]`. Chance-type stats are concentrated into 2–3 nodes per
character rather than spread across all 50. Two pre-existing a–h saturations are respected
by adding **exactly 0** here: `crystalpony.lifestealChance` (already 0.15 from
`-characters-3.js`) and `mule.lifestealChance` (already 0.24 from `-characters-2.js`), both
of which the engine clamps to 0.10 at read time. Full table:
`feature-research/phase10-metaprogression/audit-skilltree-group4.md`.

### Skill tree — Phase 10 Part B, Group 2 (`achievements/skilltree-characters-4b.js`)

250 new character nodes, **50 each** for `hypogriff`, `seapony`, `ponybot`, `griffin`,
`kirin`. Pure data appended onto `SKILL_TREE_NODES` / `SKILL_TREE_NODES_BY_ID`; no engine
change. Branch letters **i / j / k / l** (a–h belong to
`skilltree-characters{,-2,-3}.js`), ids `char_<classId>_<key>`.

Shared topology (`SKILL_TREE_PARENT_4B`, emission order `SKILL_TREE_ORDER_4B` — one
key→parent-key map reused by all five characters), four fresh branches hung directly off
`char_hub_<classId>`; no a–h node is re-parented or edited:

```
char_hub_<classId>
  +- i1 -> i2 -> i3 -+- i4 (CURSED gate) -+- i5a -> i6a -> i7a   (payoff chain)
  |                  |                    +- i5b -> i6b -> i7b   (payoff chain)
  |                  +- i8 -> i9 -> i10                          (ungated spur)
  +- j1  (same 13-node shape)
  +- k1  (same shape minus the spur's third node; 12 nodes)
  +- l1  (same shape minus the spur's third node; 12 nodes)   13+13+12+12 = 50
```

Node content lives in `SKILL_TREE_CHARACTER_CONFIG_4B` keyed by branch key;
`buildCharacterSkillNodes4B` emits the id/parent/cost and copies `effects` (plural) when
a node has one, `effect` (singular) otherwise. `cursed:true` follows the
`-characters-3.js` convention — debuff-only, and the sole parent of both payoff chains
below it, so neither is reachable without eating the cost. Capstones cost 2–3 points
instead of 1.

Per-character mechanic hooks (the majority of each 50 is class-specific, not stat sticks;
every borrowed mechanic pays for itself inside its own node):

- **hypogriff** — the fastest flier swinging the heaviest hoof on the thinnest hide.
  *Stonesplitter Talons* grants `shockwaveAttack` (`uniqueFlag`; dispatched generically
  in `combat-1.js`'s `playerMeleeAttack`) for +4% `meleeCooldown`, feeding a
  `rockCoinChance` sub-line (*Gemsight Gullet*, −4% magnet). `damageTakenMult` is used in
  BOTH directions on one character: *Ironed Feathers* (−10%) and *Scar Lattice* (−8%)
  against *Glass Stoop* (+8% melee damage for +12% damage taken).
- **seapony** — slow legs, heavy slow tide-bolts. *The Tide That Never Breaks* grants
  `unlimitedRange` for −5% bolt speed; *Waterspout Ascent* grants `canFly` for −6% ranged
  damage; *Abyssal Lance* grants `laser` for +10% `fireCooldown`. Branch l is an explicit
  rate-vs-weight trade (*Riptide Cadence* buys cooldown with damage in one node).
- **ponybot** — `redMax:0` / `noRedContainers` / `damageTakenMult:1.25`. Nothing in its 50
  touches `onKillHealChance` or `lifestealChance` (dead stats for it), and nothing touches
  its `damageTakenMult` either: `-characters-2.js` already sums that field to −0.14 inside
  a `[-0.15, 0]` window, so a further node would clamp to nothing. Survivability instead
  runs through `startingPickup 'blue'` (*Reserve Cell Bank* +2 blue for +6% `fireCooldown`,
  *Backup Core* +1 blue for −3% speed) and dodge. Branch k is a drone foundry:
  `canBuildTurrets` via `uniqueFlag` (−6% ranged damage), then `turretDamageMult` +0.15
  and `maxTurrets` +2, each paid for separately.
- **griffin** — rapid-fire feather volleys. *Raking Feather Line* fuses the storm into
  `laser` (+8% `fireCooldown`, −4% ranged damage) and *Planted Pinions* buys the rate back
  with −5% speed; *Feathers That Never Fall* grants `unlimitedRange` for −6% bolt speed;
  *Bone-Cracker Quills* is the anti-griffin node (+10% ranged damage, +10% `fireCooldown`).
  Deliberately does **not** borrow `crystalVolley`/`crystalShardCount`/
  `crystalVolleySpacing` — those shadow fields are seeded off `def.crystalVolley` in
  `entities.js` and there is no griffin-side volley mechanic to hang them on.
- **kirin** — half a heart of hide, hottest wrath. *Nirik Ignition* grants `charged` +
  `chargeTime` +0.5 (`playerChargedBeamAttack` → `playerFireBreathAttack`) for +8% ranged
  damage, with the charge requirement and the fire-jet's short reach as the real cost;
  *Flashpoint Temper* buys −0.15s of that charge back for −5% ranged damage. *Sunline
  Beam* grants `laser` for −10% ranged damage, *Wildfire Unbounded* grants
  `unlimitedRange` for −6% bolt speed, and *Ember-Cooled Hide* is a −20% `damageTakenMult`
  — the single most valuable node in the group on a class where one hit ends the run.
  No healing nodes (redMax 0.5 makes them near-dead).

Cap discipline: every `(classId, stat)` total was recomputed across **all** skilltree
files (a–h plus 4a–4e) and stays inside `SKILL_TREE_STAT_CAP` (0.25) /
`SKILL_TREE_STAT_CAP_OVERRIDES.lifestealChance` (0.10); every `uniqueField` group stays
inside its own tightest `[min,max]` (all five characters use one consistent `[min,max]`
pair per field, since `applySkillTreeUniqueFieldBonuses` intersects them). Chance stats
are concentrated into a handful of nodes per character, and four (classId, stat) pairs the
a–h nodes already left at 0.24 are untouched here: hypogriff `stunChance`, seapony
`freezeChance`, griffin `onKillHealChance`, kirin `vulnerableChance`. Full table:
`feature-research/phase10-metaprogression/audit-skilltree-group2.md`.

### Skill tree — capstone nodes (`achievements/skilltree-capstones.js`)

Post-megaupdate polish pass: one extra "capstone" node per character (25 total, one per
`CLASSES` entry), `cost:3` instead of the usual 1. Loaded last of every
`skilltree-characters*.js` file (`index.html`, right before `skilltree-ascensions.js`), and
deliberately data-only/generic rather than another 25-way hand-authored `parent:` table:

- **`buildCapstoneNodes()`** (IIFE, runs at load) — for each `classId` in
  `SKILL_TREE_CAPSTONE_CONFIG`, filters the already-fully-built `SKILL_TREE_NODES` down to
  that class's own `char_<classId>_*` nodes, walks a `depthOf(id)` BFS-via-memoized-
  recursion from `char_hub_<classId>`, and grafts the capstone onto whichever node comes
  back DEEPEST (ties broken by lowest id string, for determinism). This means the capstone
  always sits at the true end of that character's longest existing chain no matter which
  content file built it or how deep any given branch happens to run — nothing here
  hardcodes a leaf id, so it can never silently point at a stale/renamed node.
- **Content** (`SKILL_TREE_CAPSTONE_CONFIG[classId]` — `name`/`desc`/`effects`) — every
  capstone is exactly two `stat` effects on the SAME node: one buff to that character's
  own signature stat (their `attackType`'s damage stat for 21 of 25 characters; the
  remaining 4 — hypogriff/ponybot/mule/diamonddog — use a chance-type stat instead because
  their damage stat had under 0.03 of cap headroom left) paired with a real drawback on
  the SAME node — never a pure upside, per the mega-a-step5 Soy-Milk-tradeoff convention.
  Drawback is always either that character's own `meleeCooldown`/`fireCooldown` (matching
  `attackType` — the field their attack actually uses, so it's never a dead-stat no-op)
  pushed the WORSENING direction (a **positive** amount — cooldown is worse when higher,
  unlike every other stat here), or `speed` pushed negative.
- **Cap discipline** — both the buff and the drawback amount for every one of the 25
  entries were picked by summing that `(classId, stat)`'s FULL prior total across every
  `skilltree-characters*.js` file (a–h plus 4a–4e) and leaving at least 0.01 of headroom
  under `SKILL_TREE_STAT_CAP` (0.25) before adding this node's own amount — verified via a
  Node harness loading the real combined data and confirming zero `(classId, stat)` pairs
  exceed cap after this file is added (the pre-existing `lifestealChance` overshoots on
  zebra/kirin/dragon/breezie/dnbpony/crystalpony/mule/filly, left over from the 5-group
  Phase 10 Part B pass and silently absorbed by `getSkillTreeStatBonus`'s clamp, are
  untouched by this file — it never targets `lifestealChance`).

### Skill tree — ascension nodes (`achievements/skilltree-ascensions.js`)

One more tier beyond the capstone pass: an "Ascension" node per character (25 total),
`cost:5` — the single most expensive node in the game, more than a capstone's own 3.
Loaded immediately after `skilltree-capstones.js` (`index.html`, right before
`skilltree-general.js`), and unlike the capstone pass's dynamically-discovered-deepest-leaf
parent, this one's parent is trivially deterministic: always `'char_' + classId +
'_capstone'` (the exact id `buildCapstoneNodes` creates), since every character has
exactly one capstone by the time this file loads. `buildAscensionNodes()` (IIFE) still
defensively no-ops per class if that capstone id isn't found in
`SKILL_TREE_NODES_BY_ID`, rather than assuming load order.

- **Content** (`SKILL_TREE_ASCENSION_CONFIG[classId]` — `name`/`desc`/`effects`) — same
  shape as a capstone: exactly two `stat` effects on the same node, one buff (+6%, one
  point stronger than a capstone's own +5%) paired with one drawback (`meleeCooldown`/
  `fireCooldown` matching `attackType`, pushed positive/worsening, or `speed` pushed
  negative — identical convention to the capstone pass).
- **Buff stat selection** — by the time a character has 50 base nodes + 1 capstone spent,
  most "obvious" stats (the character's own damage stat, dodge, crit) are already close to
  capped, so this pass draws from a WIDER pool than the capstone pass did: every chance-
  type stat (`critChance`/`luck`/`magnetRadius`/`dodgeChance`/`vulnerableChance`/
  `venomChance`/`charmChance`/`stunChance`/`fearChance`/`freezeChance`/
  `onKillHealChance`), plus `rangeTiles`/`boltSpeed` — but ONLY for `attackType:'ranged'`
  characters; both fields govern bolt travel distance/speed (`combat-2.js`) and are dead
  stats on a melee-only character (this exclusion is why `diamonddog`, melee, lands on
  `dodgeChance` rather than the higher-headroom-on-paper `boltSpeed` a naive headroom-only
  pick would have chosen — verified against the actual `player.boltSpeed`/`player.rangeTiles`
  read sites in `combat-1.js`/`combat-2.js` before finalizing the picker).
- **Cap discipline** — same method as the capstone pass, run one step later: totals summed
  across every `skilltree-characters*.js` file PLUS `skilltree-capstones.js` itself (so
  each capstone's own contribution is already counted before this file's amount is added),
  at least 0.01 headroom left under cap for every one of the 25 (classId, stat, buff) and
  (classId, stat, debuff) pairs. Re-verified with the same Node harness used for the
  capstone pass, now including this file: zero new `(classId, stat)` overshoots — the only
  entries over cap are the same pre-existing `lifestealChance` ones the capstone pass
  already documented, which this file never touches.
- **UI recognition** (`buildSkillTreePanel` in `skilltree.js`) — an `isAscension = /_ascension$/.test(node.id)` test alongside the existing `isCapstone` one: `.ascension` class (electric cyan/violet double-ring, distinct from the capstone's gold — `skillNodePulseAscension`/`skillNodeAscensionShimmer` keyframes), `⚡` glyph in place of the first-letter default, `Sound.play('achievement')` on purchase (same fanfare a capstone gets, upgraded from `'shopBuy'`), a `⚡` suffix on the detail panel's name line, and inclusion in the filter bar's `data-filter="capstone"` button (relabelled "Endgame" in `index.html` since it now matches both tiers) and in the build-overview panel's per-row `hasAscension` marker.

### Phase 13 visual pass (batch 1) — HUD micro-feedback + screenshot button

New JS-driven visual feedback layered onto the existing HUD (`js/ui/ui.js`'s `updateHUD`), plus one
new floating button, added in direct response to a "100 new GUI/visual things" request after the
Phase 12 canvas-drawing pass (~29 items, documented above under `core/utils-1.js + core/utils-2.js`)
had already covered the canvas side. This batch is GUI/HTML/CSS + the small JS hooks needed to drive
it, since the codebase's canvas rendering and existing GUI chrome (skill tree, achievements, touch
controls, HUD panels) were already extensively polished across Phase 11/12 — genuinely new, safe,
non-duplicate surface area is real but finite, so this batch (~10 items) is honestly the size it is
rather than padded to a literal 100.

- **Resource "bump" pop** (`style.css` `.res-bump`/`resBump`, `js/ui/ui.js` `_hudBump()` helper) — a
  quick gold scale-and-glow on `#resCoins`/`#resKeys`/`#resBombs` the moment their number goes UP
  (not down — spending a resource never bumps, only gaining one does, tracked via
  `_hudCache._prevCoins`/`_prevKeys`/`_prevBombs`). `_hudBump(el, cls)` restarts a CSS animation via
  the same remove → `void el.offsetWidth` reflow → re-add pattern already used for
  `.item-examine-icon.examine-pop`, so it replays correctly even mid-animation.
- **Floor counter flash** (`style.css` `#resFloor.floor-bump`/`floorBump`) — `#resFloor` gets a gold
  text-shadow flash on every floor change (`_hudCache.floor` dirty-check in `updateHUD`), skipped on
  the very first HUD paint so starting a run doesn't flash immediately.
- **Hit-flash overlay** (`style.css` `#canvasWrap.hit-flash::before`/`hitFlash`, `js/entities/entities.js`
  `takeDamage()`, `js/ui/ui.js` `updateHUD`) — a sharp one-shot red radial flash across the whole
  canvas the instant a hit actually lands, stamped as `player._hitFlashAt = Date.now()` inside
  `takeDamage()` past the invuln/shield/dodge guards (so a blocked/dodged hit never flashes), diffed
  against `_hudCache.hitFlash` each frame. Deliberately distinct from the pre-existing
  `.low-health` ambient pulse: that one loops for as long as HP is critical, this one fires once per
  landed hit regardless of current HP.
- **Screenshot button** (`index.html` `#screenshotBtn`, `style.css` `.screenshot-btn`, `js/main.js`) —
  fourth floating button past mute/volume/fullscreen. Only visible mid-run: `updateHUD` un-hides it
  every in-run frame, `returnToMenu()` re-hides it explicitly (the HUD loop that would otherwise keep
  showing it stops the instant `game = null`). Click handler calls `canvas.toBlob(...,'image/png')`
  and downloads it via a throwaway `<a download>` + `URL.createObjectURL`/`revokeObjectURL`, wrapped
  in try/catch (a tainted canvas or missing `toBlob` just silently no-ops rather than throwing). A
  white ring-flash (`.screenshot-btn.flash`/`screenshotFlash`) confirms the capture on click.
- **Achievements panel entrance stagger** (`style.css` `.achv-grid .achv-row`/`achvRowIn`) — the first
  12 rows of any category rise in with a small per-row delay when the panel opens, instead of the
  whole dense list popping in at once. Deliberately animates ONLY `transform:translateY`, never
  `opacity` — an early draft animated opacity 0→1 too, which would have used the animation's `fill-mode:
  both` to permanently pin every row (including still-locked ones) at `opacity:1`, silently breaking
  the pre-existing locked/unlocked `.achv-row`/`.achv-row.done` opacity distinction. Caught and fixed
  before shipping.
- **Crosshair cursor** (`style.css` `#game{cursor:crosshair}`) — the play canvas now visually reads as
  an aiming surface instead of showing the default arrow.

### Phase 14 visual pass — enemy + character canvas drawing overhaul

New systemic (behavior-independent) animation layered onto `js/core/utils-2.js`'s `drawBrownHumanoid`
(every raider/turret enemy) and `drawPony` (every player class), plus `js/ui/render.js`'s `drawPlayer`.
Requested as "50 improvements between enemies and characters" — landed at 8 distinct mechanisms rather
than a literal 50, but each one applies to every single enemy behavior and every player class
simultaneously (not a one-off per archetype the way the Phase 10-13 passes' per-behavior gear/flourish
pairs were), so the actual before/after visual delta is broad. The remaining per-behavior static+live
gear pairs (`_humanoidStatic`/`drawBrownHumanoid`'s "live gear flourishes" block) were already
exhaustively covered — every one of the 12+ AI behaviors already has both a baked gear mark and its own
live animated flourish — so this pass deliberately went for shared, universal mechanics instead of
padding with more per-behavior duplicates.

- **Enemy facing flip** (`drawBrownHumanoid`) — mirrors the whole enemy body horizontally to face its
  actual direction of travel. `e.vx`/`e.vy` are NOT reliably maintained by most AI scripts (they mostly
  move via direct `tryMoveEntity(dx,dy)`, not a persisted velocity), so facing is derived independently
  here from frame-to-frame `e.x` movement (`e._faceSignPrevX`/`e._faceSign`), with a small deadzone so a
  barely-jittering enemy doesn't flicker between poses. Excluded for bosses/superbosses — mirroring a
  superboss would also mirror its `fillText` icon glyph into backwards text, and the baked-sprite path
  already treats bosses as a separate always-live case.
- **Enemy hit-squash** (`drawBrownHumanoid`) — a brief squash-and-stretch keyed off `e.hitFlash`
  counting down (shared signal with several AI telegraph "wind-up" tells in `ai-1/3/4.js`, so it reads
  as "something just happened here" consistently with the existing flash recolor, which already makes
  no distinction between the two causes).
- **Enemy idle breathing** — a small ambient scale pulse (`Math.sin(now/900+phase)`), faded out while
  the hit-squash is active so the two never fight. Folded into the same transform as the facing flip and
  squash (one `ctx.save/scale/restore` per enemy per frame, not three).
- **Enemy blink** — periodic closed-lid overlay drawn live over the baked default eye position (baking
  it would freeze the eyes at whichever open/closed frame got baked first), desynced per-enemy via the
  existing `phase` value. Skipped for `behavior:'sentry'`, which already draws its own oversized
  gaze-tracking eye over the default pair — a small lid at the default eye position would sit stranded
  on top of that much bigger shape.
- **Pony blink** (`drawPony`) — same technique, single fixed cycle (only one pony on screen, no
  lockstep-room desync concern), skipped for `opts.isRobot` (a glowing mechanical lens has no lid).
- **Pony tail sway** (`drawPony`) — the tail angle, previously rigidly `angle + Math.PI`, now carries a
  continuous sway term (wider/faster while `opts.moving`).
- **Pony ear twitch** (`drawPony`) — each ear's outer tip carries its own small independent sine offset
  (different phase per ear) instead of both ears being perfectly static.
- **Player hit-squash** (`js/ui/render.js` `drawPlayer`) — same squash-and-stretch as the enemy version,
  stamped via `this._playerSquashAt` on the same invuln rising-edge that already triggers `FX.shake`/
  `FX.sparks`, decaying over a fixed 250ms rather than lasting the full (usually much longer) invuln
  blink window.

Two correctness issues caught and fixed before shipping in this same pass: the sentry-blink stacking
bug described above, and an initial squash-transform ordering that (before the facing-flip's `isBoss`
exclusion was added) would have also mirrored a boss's `fillText` icon glyph into unreadable backwards
text — caught by tracing through what the transform wraps before verifying, not after.

### Phase 15 — bug fix, miniboss room, colored-fire expansion, legacy-stage content

Five separate asks in one turn: (1) fix a persistent-red-overlay bug, (2-3) more enemies/bosses "per
stage, every stage including branches", (4) 3 new colored-fire hazards + rooms + shooting forms, (5) a
new "miniboss" room type with 10 bespoke minibosses. Item 5 and item 4 are delivered at full spec.
Items 2-3 are honestly scoped down to the 4 legacy stages (Crypt/Forest/Desert/Inferno) rather than
all ~21 stages/floorKeys — see the closing chat message for the disclosed reasoning; this section
documents what actually shipped.

- **Bugfix — `#canvasWrap.hit-flash` stuck visible** (`style.css`) — the Phase 13 hit-flash overlay's
  keyframe animated `opacity: 1 → 0` but never set `animation-fill-mode: forwards`, so the instant the
  0.3s animation finished the browser snapped the pseudo-element back to its un-animated default
  (`opacity: 1`, since none was set outside the keyframes) — i.e. the screen went solid red on the
  very first hit taken and stayed that way for the rest of the run, since the class is never removed
  by JS (only re-triggered). Fixed by adding `forwards` to the animation shorthand.

- **Miniboss room** (new room type `'miniboss'`, 25%-per-floor coin flip, same shape as petshop/
  challenge — `dungeon.js`'s `generateDungeon`) — `js/entities/entities.js`'s `Miniboss extends Enemy`
  (does NOT set `isBoss`, so it never hijacks the big boss health bar, `bossesKilled` stat, or
  `game.onBossDefeated`, and gets the Phase 14 facing-flip/squash/breathing treatment like any trash
  enemy) on its own growth curve (`growth.js`'s `minibossHpScale` 1.28 / `minibossDmgScale` = reuses
  `bossDmgScale`). `js/data/enemies/minibosses.js` — 10 bespoke `MINIBOSS_TYPES` entries (stage-
  agnostic pool, `resolveMiniboss()` picks uniformly regardless of floor), each with a bespoke behavior
  in `js/systems/ai-minibosses.js` (Rustfang Prowler/Chainbound Reaver/Cinderbrand Duke/Static Choir/
  Marrow Colossus/Nightglass Duelist/Verdant Warden/Riptide Hexer/Cinderwing Reaper/Hollow Sentinel).
  `js/data/roomTemplates/miniboss.js` — a 2x2-block template (boss-room scale). `room.js`'s
  `populateRoom`/`populateRoomFromTemplate` — new `node.type === 'miniboss'` branches (both the
  procedural and hand-authored-template paths). `combat-2.js`'s `handleEnemyDeath` — new
  `enemy.isMiniboss` branch: drop table is a single `Util.choice(['penny','chest','item','star'])`
  (equal 25% each, exactly the spec) rather than four independent `Util.chance(0.25)` rolls, since the
  latter could drop nothing at all. Door-unlock needs no custom flag at all — it rides the fully
  generic `checkRoomCleared` (`combat-3.js`) path, same as every other combat-locked room type.
  `ui.js`'s `ROOM_TYPE_ICON`/`ROOM_TYPE_LEGEND` — a `☠️` minimap icon, distinct from boss's `💀`.

- **Three new colored fires** (`js/data/collectibles.js`'s `OBSTACLES`) — `greenfire`/`whitefire`/
  `blackfire`, joining the existing yellow/red/blue/purple. Each has a genuinely NEW form of shooting,
  added to the shared projectile-firing block in `combat-4.js`'s `updateObstacles` (extending the
  existing `angles`/`targeting`/range-gated-aim branches, not replacing them): `greenfire` fires a
  3-bolt fan (`spreadShots`/`spreadAngle`, range-gated); `whitefire` fires an ordinary range-gated bolt
  that DETONATES on death (`explosiveBolt` → `Projectile.explosive`, reusing
  `combat-3.js`'s `detonateExplosiveProjectile` — the same plumbing an Explosive Tear rides, the first
  time an obstacle rather than a player/familiar bolt has used it); `blackfire` never aims at all, just
  leaks one bolt per tick off a continuously rotating angle (`spin`, no range gate). Rendering —
  `utils-1.js`'s `drawObstacle` — extended the existing 4-color flame-flicker whitelist to include all
  3. Also wired into `room.js`'s `REROLLABLE_HAZARD_KINDS` and `roomEditor.js`'s obstacle picker/glyph
  map (`'K'` for blackfire, not `'B'` — that's already `bombbarrel`'s glyph). Five new room templates
  in `js/data/roomTemplates/firecolors.js` (pushed onto `ROOM_TEMPLATES.normal`, none of the existing
  yellowfire/redfire/etc. templates touched) — one room per new color plus a floor-gated (`floorNum`
  6+, Inferno onward) three-color gauntlet room.

- **Legacy-stage content** (`js/data/enemies/legacy-extra.js` + `legacy-extra-bosses.js` +
  `js/systems/ai-newshared.js` + `ai-legacy-bosses.js`) — 5 new trash enemies per legacy stage (20
  total: Crypt/Forest/Desert/Inferno), reusing 3 new SHARED behaviors (`pouncer`/`strafer`/`splitshot`
  in `ai-newshared.js`) rather than 20 bespoke functions — same "one function, many stage recolors"
  shape the original 17-behavior extended set (orbiter/sniper/etc.) already established in
  `types-1..4.js`, deliberately NOT the bespoke-per-enemy shape the stage4-6/7-9/10-13 content groups
  use. Plus 1 new bespoke boss per legacy stage (4 total — Charnel Warden/Thornmother/Dune Sovereign/
  Ashen Colossus, `ai-legacy-bosses.js`), staying on the boss convention's "always bespoke, never
  shared" rule. `legacy-extra-bosses.js` loads AFTER `bosses.js` and does the required two-step
  `BOSS_TYPES` merge + `BOSS_LIST.push` (same pattern `stage4-6-bosses.js` uses) since `BOSS_LIST` is a
  one-time snapshot, not a live view. Caught and fixed before shipping: The Ashen Colossus's ember-
  trail burst and its full-room slam both would have shared a single `type.burstRadius` field (the one
  `render.js` reads to size ANY `e.lobTimer > 0` ground-marker ring) despite needing very different
  radii — fixed by hardcoding both values directly rather than giving the type a field that would have
  made one of the two visually lie about its real blast radius.

### Phase 16 — DNB fly/spider family + friendly fly ecosystem

Six new stage-agnostic hostile "insects" plus a full friendly-fly sub-ecosystem (2 base familiars +
2 familiars that spawn more + 3 passives + 3 actives + a new sack pickup).

- **`stage:'universal'`** (new, `room.js`'s `resolveGenericEnemy`) — a third option alongside a numeric
  stage index: eligible on every main-route floor rather than one stage's two-floor window. All 5
  random-eligible fly/spider entries use it.
- **`neverRandom:true`** (new, same function) — opts an `ENEMY_TYPES` entry out of every filter step,
  including the ultimate fallback (previously unguarded — `: ENEMY_LIST` skipped `avail()` entirely,
  dead in practice but now closed too). Used by `dnbfly` alone.
- **`e.type.harmless`** (new, `combat-3.js`'s contact-damage guard) — a real bug avoided before
  shipping: `dnbfly` needed `dmg:0`, but `playerDamageAmount`'s `dmgHalves > 0 ? dmgHalves :
  CONTACT_DMG_DEFAULT` treats a falsy/zero dmg as "unset" and substitutes the default contact damage —
  `dmg:0` alone would NOT have made it harmless. `harmless:true` folds into the existing
  `suppressPlayerContact` check instead.
- **`type.groupSize`** (new, `room.js`'s `populateRoom` 'normal' branch) — a rolled type with this field
  spawns that many copies at one tile (small pixel jitter) instead of one, counted against the room's
  enemy budget accordingly. Used by `dnbnuclearfly` (4) and `dnbswarmfly` (6) — "a group of them always
  spawns" / "the whole swarm follows you as a whole", the latter satisfied by the existing 'swarm'
  behavior's per-instance wander-blended seek once several spawn together, no new movement code needed.
- **Enemies** (`js/data/enemies/flies.js`, `js/systems/ai-flies.js`) — dnbfly (aimless/harmless/
  neverRandom), dnbredfly ('chaser'+flies, zero new code), dnbyellowjacket ('charger'+flies, zero new
  code), dnbnuclearfly ('orbiter'+flies+groupSize, zero new code — its tangent-strafe already reads as
  "always perpendicular"), dnbswarmfly ('swarm'+flies+groupSize, zero new code), dnbspider (new
  'skitter' behavior — erratic burst-pause-burst movement, no telegraph, distinct from every dash-with-
  wind-up behavior already in the game).
- **Friendly fly familiars** (`js/data/familiars-3.js`) — `friendlybluefly` ('orbiter') and
  `friendlyyellowfly` ('shooter'), both `trashBagOnly:true` (new flag, filtered in
  `room.js`'s `pickFamiliarFromPool` — their only source is the Trash Bag). `flyhive`/`maggotnest`
  reuse the existing 'swarmer' behavior wholesale as "familiars that spawn them" — its self-contained
  `f.miniOrbs` array already is exactly that mechanic.
- **`f.buffMult`/`f.buffTimer`** (new, `familiars.js`'s `updateOrbiterFamiliar`/`updateShooterFamiliar`)
  — a generic temporary damage multiplier, defaults to a no-op (`|| 1`) for every familiar in the game
  except one Wasp Whistle has touched.
- **Items** (`js/data/items-7.js`) — passives Fly Jar / Honeycomb (2% per kill, `combat-2.js`'s
  `handleEnemyDeath`, same shape as the existing Golden Clover) / Rotting Carcass (25% per room clear);
  actives Swarm Canister (grants one of each fly) / Wasp Whistle (buff) / Trash Compactor (consumes all
  owned flies for a scaling AoE blast, `items-2.js`'s `useActiveEffect`). All six route through
  `combat-2.js`'s new `hatchFriendlyFly(game, id)` — the one place that actually calls `addFamiliar`.
- **Trash Bag** (new pickup kind `'trashbag'`) — `combat-2.js`'s `grantPickupEffect` grants one random
  friendly fly. Wired into `economy.js`'s `RARE_POOL` (the room-clear reward tier that ACTUALLY fires —
  found, and left documented rather than silently fixed, that the pre-existing `SACK_BATTERY_WEIGHTS`/
  `rollSackBatteryKind()` this would naturally have joined is dead code nothing calls; `RARE_POOL` is
  the real mechanism `spawnClearRoomPickup` reads) and into `shop.js`'s `SHOP_BASE_PRICES`/
  `SHOP_KIND_LABELS`. Rendered via `utils-1.js`'s `drawSackIcon`, extended with an optional tint pair
  (`Theme.icon.trashBag`/`trashBagSeam`, green) rather than a bespoke draw function — same silhouette,
  different material, matching how this game already recolors shared fixture shapes elsewhere.

### Phase 17 — Crypt "floor by floor" unique-AI pass (crypt-extra.js / ai-crypt.js)
Eight new stage-0 (Crypt) enemies, each meant to carry genuinely new behavior rather than reuse an
existing archetype — the opposite intent from Phase 15's legacy-extra.js trash pass. Six new shared
behaviors were needed; the eighth enemy needed zero new code.
- **`ai-crypt.js`** — six new `ENEMY_BEHAVIOR_HANDLERS` entries: `flee` (unconditional invert-seek,
  same shape `aiSkirmisher`'s retreat branch already used, just always-on), `wallHugger` (pins to
  whichever of the four room walls — via `node.tileW`/`tileH` — is currently nearest, tracks the
  player along that wall's axis, fires on cooldown), `cardinalBloat` (`aiWander` + a fixed N/E/S/W
  4-bolt volley at absolute compass angles, not aimed), `randomJumper` (telegraph-then-hop on a fixed
  cadence like `pouncer`'s leap, but the hop's heading is random until the player is within
  `aimRange`, then aimed), `dvdStrider` (one random heading on spawn, permanent per-axis wall bounce —
  `aiBossAntlerWarden`'s bounce math with no telegraph, no dash timer, no bounce budget: it's the
  enemy's whole movement, not a periodic attack), `haunter` (`aiOrbiter` while idle; on a timer, flies
  to a random live room `Obstacle` and channels an effect read off that obstacle's own flags —
  `isPit`→pulls the player in, `isHazard`/`attackable`→fires a bolt from the obstacle's position,
  `destructible`→flings a heavier chunk, anything else→a proximity pulse; no obstacles in the room ⇒
  haunts a point near the player instead, falling through to the same proximity-pulse branch).
- **`type.spawnFliesOnDeath:{id,count,radius}`** / **`type.spawnBombsOnDeath:N`** (new, generic —
  `combat-2.js`'s `handleEnemyDeath`, same block as the existing splitter handling) — any enemy type
  can carry either going forward, not bespoke to the two ids that currently use them.
  `spawnBombsOnDeath` calls `placeBombAt(..., 'enemy')`, which already skips the player's bomb-count
  cost for a non-player owner and still damages the player same as any other bomb.
- **Enemies** (`crypt-extra.js`) — `crypthive` (`flee` + `spawnFliesOnDeath`: 6× dnbfly on death),
  `cryptbombhive` (`flee` + `spawnBombsOnDeath`: 3), `cryptwallhugger` (`wallHugger`), `cryptbloat`
  (`cardinalBloat`), `cryptjumper` (`randomJumper`), `cryptstrider` (`dvdStrider`), `crypthaunter`
  (`haunter`, `flies:true`, `harmless:true` — its only threat is the haunt itself, no contact damage),
  and `dnbfirecircler` (stage:`'universal'`, `flies:true`, reuses `strafer` outright with a tight
  `keepDistance` and a speed edge over the rest of the roster — its radial-correction term already
  reads as "rushes in fast from anywhere, then holds the ring and fires," zero new AI code needed).

### Phase 18 — wall-hugger teleport, stuck-enemy safety net, fire burns enemies, more rooms
- **Wall Hugger teleports onto its wall** (`ai-crypt.js`) — the perpendicular "pin" axis now snaps
  straight to the nearest wall every frame instead of walking there; only the axis tracking the
  player along the wall still slides smoothly via `tryMoveEntity`. Switching to a different nearest
  wall re-snaps (blinks) immediately.
- **Generic stuck-in-a-tile safety net** (`combat-3.js`'s `updateEnemy`, top of the function, every
  enemy, every frame) — if `collidesAt(e, e.x, e.y, ...)` reads true (the enemy's own current spot
  overlaps something solid — knockback shove, a teleport landing badly, a future behavior bug) for
  more than 0.75s straight, it's teleported to `findNearestFloor` and its dash/knockback state is
  cleared. `e.stuckTimer` is a lazily-initialized ad-hoc field, same convention as `dnbspider`'s
  `skitterPause`/`skitterBurst` — no `entities.js` edit needed.
- **Fire burns enemies too** (`combat-4.js`'s `updateObstacles`) — any `isHazard` obstacle whose
  `kind` contains `'fire'` (all 7 yellow/red/blue/purple/green/white/black variants, present and
  future) now damages enemies it touches, not just the player, on its own per-enemy 0.6s cooldown
  (`e.fireContactTimer`, same lazy-field convention). Depth-scaled via `statusTickDamage`, same
  reasoning as poison/blast damage. Flying enemies (`e.flies`/`e.canFly`) are exempt — they already
  pass over every other ground hazard via `collidesAt`'s flying check, and a flame at ankle height
  shouldn't touch something with no ankles. Non-fire hazards (cactus/spike/thornbush/etc.) were
  deliberately left player-only — this was scoped to fire specifically, not every hazard.
- **More rooms** — `firecolors.js` gained 4 more templates (a Green Fire corridor, a White Fire +
  pit ring, a two-Black-Fire room, a Green+Black combo), same `ROOM_TEMPLATES.normal.push` pattern as
  the original Phase 15 four. New `roomTemplates/dnbfly-rooms.js` — 6 ordinary trash rooms (every
  stage, no floor gate — it's cosmetic, not a difficulty knob) with 1-3 hand-placed `dnbfly` floating
  among real threats, using the same `["e","f","dnbfly"]` forced-spawn shape every other named-enemy
  template placement already uses (dnbfly's `neverRandom:true` means a template is its ONLY way in).

### Phase 19 — nine more Crypt enemies, all floor-1-only (crypt-extra2.js / ai-crypt2.js)
Interacts-with-something-other-than-the-player batch: the room's pickups, another enemy, the room's
own death count, or the terrain itself, each a real new mechanic rather than a chase/shoot reskin.
- **`e.onlyFloorNum`** (new — `room.js`'s `resolveGenericEnemy` `avail()`) — restricts a type to one
  literal `floorNum`, applied at every pool step including the ultimate fallback. "The first floor"
  means `floorNum === 0` specifically, not all of stage 0's two-floor window (`FLOORS_PER_STAGE = 2`).
  Every entry in this file also had to go to `xpTier:1` — the existing `xpTier <= 1 + floorInStage`
  gate would otherwise have silently kept anything `xpTier:2`+ out of floorNum 0's own pool forever
  (caught before shipping: `onlyFloorNum:0` + `xpTier:2` together meant "never spawns, anywhere").
  The two Sarcophagus variants lean on `weight` instead to stay rare despite the low xpTier.
- **`thief`** (Grave Robber) — hunts the nearest live `node.pickups` entry instead of the player,
  removes it on contact (steals it — the pickup just vanishes), then flees carrying it. Falls back to
  a plain chase if the room's out of pickups. Drops the *exact same* `Pickup` instance back on death
  (`combat-2.js`'s `handleEnemyDeath`, `enemy.stolenPickup`) — same coin tier/pill color/star id, not
  a fresh roll.
- **`e.spent`** (new, `combat-3.js`'s `suppressPlayerContact`) — per-INSTANCE harmless flag (as
  opposed to `e.type.harmless`, which is per-type) for **Coffin Lid** (`trapLid`): one telegraph, one
  committed lunge, then permanently inert and harmless — never resets like `pouncer` does.
- **`type.linkedDeath`** (new, `handleEnemyDeath`) — killing one instance instantly kills its
  still-living same-`type.id` partner too. **Chain Rattler** (`chainlink`) pairs this with
  `groupSize:2` (spawns as a pair) and a tether pull past `chainLength`; `render.js`'s
  `drawWorldSorted` draws a dashed rope between any two linked-death partners as a first pre-pass,
  under everything else.
- **`bonepiler`** — starts unshielded, flips `e.shielded` on after `pileTime` unbothered (armoring up
  the longer it survives), flips back off for a shorter `exposedTime`, repeats — rush it early, it's
  soft; leave it, it tanks. Reuses `spawnFliesOnDeath` (generic despite the name — any enemy id) to
  break into 2 `bonecrawler` minions on death.
- **`curser`** (Epitaph Reader) — fully stationary; grows a real-radius curse centered on itself over
  `curseGrowTime`, and if the player's still inside when it finishes, applies `player.freezeTimer` —
  the same mechanic Sand Trap/Quicksand/Tide Pool already use, just the first time an ENEMY (not
  terrain) causes it. Area denial via "don't still be there," not a dodgeable bolt.
- **`mourner`** — ordinary chaser that watches `node.enemies`' own dead-count each frame; the instant
  ANY other enemy in the room dies, it enrages once, permanently (`e.enraged` — same field the
  extended boss set already uses for hp-threshold enrages, just triggered externally here).
- **`sexton`** — wanders harmlessly, but on a cooldown snapshots the player's CURRENT position into
  `e.lastPX`/`lastPY` (the same fields `'sentry'` already carries) and opens a long telegraph; only
  once that finishes does a real `new Obstacle('pit', ...)` open at the spot it locked — punishing
  standing still, not approaching it.
- **`sarcophagus`** / **`sarcophagusArmored`** — fully stationary tanks (`speed:0`) that periodically
  vomit a handful of a configurable fly id (`spawnFlyId`) via a shared `sarcophagusOpen()` helper —
  plain Sarcophagus spawns harmless `dnbfly`, Armored Sarcophagus spawns real `dnbredfly` AND runs its
  own independent shield cycle (`e.shielded` toggled directly, not via `behavior==='shielded'`).

### Phase 20 — Bestiary panel revamp: card grid + per-stage splits
Full rewrite of `bestiary.js`'s rendering — was a single-column stack of `.achv-row`s (shared with
Achievements/Music Test/Skill Tree); now its own `.best-card`/`.best-grid` classes (`style.css`), so
this never touched how those other three panels render. `#bestiaryList` keeps `.achv-list` too (tab
styling, entrance animation) but is widened to 1180px via ID selector, since a card grid wants more
width than one column of rows did.
- **`bestiaryCard(opts)`** (was `bestiaryRow`) — same discovered/undiscovered "?" placeholder logic
  and tier badge, restructured into a card: icon+name header, description line(s), a NEW `opts.chips`
  row of small stat pills (`.best-chip`), then an optional tally/extra line pinned to the card's
  bottom via `margin-top:auto`.
- **Per-stage splits** (Enemies/Bosses/Superbosses, as asked) — `bestiaryStageGroups(list)` groups a
  flat `ENEMY_LIST`/`BOSS_LIST` into stage-labeled sub-groups, bridging THREE separate "what stage is
  this" systems that exist in the data: a numeric `stage` field (0-3 legacy, 4-13 the Phase 10
  post-finale `STAGES` entries), a `floorKey` field (9A/9B..12A/12B branch pairs, linear 13/14/15,
  C-branch/D-branch regions — `BESTIARY_FLOORKEY_STAGE_LABEL`), and `stage:'universal'` (shown first,
  own pseudo-group). Sorted into real run order via `bestiaryStageSortKey`, not object-declaration
  order. Superbosses carry NONE of the above (matched to a floorNum by a hardcoded dispatch in
  `game.js`'s `descend()`, not by data — see `superboss-routes.js`'s own header comment), so
  `bestiarySuperbossStageGroups` groups by `SUPERBOSS_ROUTE` (main/C/D) instead, ordering each route's
  members by `SUPERBOSS_ROUTE_SEQUENCE` — the one real per-superboss ordering that already existed,
  not `SUPERBOSS_LIST`'s raw (and admittedly out-of-order, per that file's own comment) declaration
  order. Verified against the live data (Node `vm` sandbox, not the browser): all ~1150 enemies land in
  a real stage bucket except exactly one (`swarmerdnb`, which has neither field — falls into a
  catch-all "Other" group rather than silently vanishing), and every superboss lands in its correct
  route in true encounter order.
- **`enemyChips(e)`** — HP/DMG/SPD (or "Stationary" for `speed:0`), radius, behavior, Flies, Harmless,
  Group ×N, xpTier, Summon Only, Floor-N-Only — whichever fields are actually present on that type.
- **Familiars tab** — gained a `swarmer` bucket it never had before (Phase 16's Fly Hive/Maggot Nest
  were silently falling out of all three original orbiter/shooter/proc groups) plus a catch-all
  "Other" bucket for any future behavior that doesn't match one of the four named groups, so nothing
  can go missing from the tab again the way swarmer did.
- **Objects tab** — new chips (⚠ Hazard, DMG, Attackable, Bombable, Blocks Flight, Walk-Over, Fires)
  read straight off each `OBSTACLES` entry's own flags.
- **Items tab** — new Active/Passive chip plus Charge N (from `maxCharge`) for actives; **Trinkets
  tab** — new 🔒 Locked chip via `renderBestiarySimple`'s new optional `chipsFn` parameter.

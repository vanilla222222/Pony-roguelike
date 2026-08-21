'use strict';
/* ============================================================
   theme.js — the game's semantic colour palette.

   WHY THIS EXISTS
   ---------------
   Terrain was already centralised (STAGES[].palette / BRANCH_PALETTES
   in stages.js) but everything the *renderer* decides on its own —
   HUD bars, status-effect rings, projectile glows, explosion
   gradients, shadows, ambient occlusion — was a thousand-odd hex
   literals scattered through render.js and utils.js. Retinting the
   game (or checking that two things that are meant to match actually
   do) meant grepping for hex codes.

   WHAT THIS IS NOT
   ----------------
   A dump of every colour in the project. Per-item and per-enemy
   `color:` / `dark:` values in data.js and enemies.js are *identity*
   — a Ruby Heart is red because it is a ruby heart, not because a
   token said so — and deliberately stay where they are. Only colours
   the renderer picks for itself live here.

   Tokens are SEMANTIC (Theme.status.freezeRing), not descriptive
   (Theme.blue3), so a retheme is a value edit rather than a hunt.

   This file complements the STAGES palette system; it does not
   replace it. Floor terrain still comes from STAGES[].palette —
   see Theme.door below, which is the one piece of terrain colouring
   that was living in render.js instead.

   LOAD ORDER: must be the first script on the page (before utils.js),
   because utils.js reads Theme at definition time in places.
   ============================================================ */

const Theme = {

  /* ------------------------------------------------------------
     Raw "r,g,b" triplets — only for colours the renderer needs at a
     *varying* alpha (fades, pulses, life-based falloff). Everything
     else below is a finished CSS colour string so call sites never
     have to do string maths.
     ------------------------------------------------------------ */
  rgb: {
    black:      '0,0,0',
    white:      '255,255,255',
    fadeVeil:   '6,5,10',    // room-transition veil
    ice:        '140,220,255',
    iceFill:    '160,225,255',
    shield:     '120,200,255',
    fear:       '138,90,201',
    poison:     '111,168,58',
    laser:      '140,225,255', // Pony Bot's beam — the default drawLaserFX tint
    swingTrail: '255,220,160',
    emberRing:  '255,200,120',
  },

  // rgba('12,34,56', .5) -> 'rgba(12,34,56,.5)'
  rgba(triplet, a){ return 'rgba(' + triplet + ',' + a + ')'; },

  /* ---------------- HUD / on-canvas UI ---------------- */
  ui: {
    text:         '#fff',
    textDim:      'rgba(255,255,255,.75)',
    onIcon:       '#000',      // emoji/glyph drawn inside a coloured disc
    onIconSoft:   '#222',      // ...on a light disc
    gold:         '#e3c15b',   // prices, stairs, donation meter
    goldDim:      '#8a7a4a',   // price you can't afford
    bossBarBack:  'rgba(0,0,0,.5)',
    bossBarEmpty: '#7a2030',
    bossBarFill:  '#e35b6a',
    hpBarBack:    '#000',
    hpBarFill:    '#7fd66a',
  },

  /* ---------------- damage / heal / crit float text ----------------
     combat.js currently passes these as literals to `new FloatText`;
     these tokens are the canonical values so a retheme has one place
     to change and combat.js can migrate to them (see the audit). */
  floatText: {
    damage:   '#fff',
    crit:     '#ffcf5c',
    heal:     '#7fd66a',
    shield:   '#7fd6c9',
    playerHurt:'#e35b6a',
    coin:     '#e3c15b',
    curse:    '#8a2e46',
    neutral:  '#dcdcdc',
    muted:    '#8a86a0',
    arcane:   '#c9c3ff',
    stun:     '#f4d35e',
  },

  /* ---------------- projectiles ----------------
     Individual weapons/enemies still carry their own bolt colour
     (that's identity); these are the renderer-side defaults and the
     shared highlight that makes every bolt read as a lit sphere. */
  projectile: {
    player:    '#9ac9e0',
    enemy:     '#e35b6a',
    familiar:  '#c9a3ff',
    turretBolt:'#9ac9e0',
    turretEye: '#e35b6a',
    glint:     'rgba(255,255,255,.65)',
    glowBlur:      6,
    glowBlurBig:  10,   // explosive bolts
  },

  /* ---------------- status effects ---------------- */
  status: {
    freezeRing: 'rgba(140,220,255,.85)',
    freezeFill: 'rgba(160,225,255,.25)',
    freezeFillPlayer: 'rgba(160,225,255,.2)',
    freezeWidth: 3,
    stun:       '#f4d35e',
    charm:      '#e07a9c',
    fearRing:   'rgba(138,90,201,.75)',
    poisonAura: 'rgba(111,168,58,.3)',
    poisonBlob: '#6fa83a',
    vulnerableRing: 'rgba(217,30,50,.8)',
    vulnerableMark: '#d91e32',
    shieldRing: 'rgba(120,200,255,.7)',
    invincibleGlow: '#ffd76e',
  },

  /* ---------------- rarity / quality glow tiers ----------------
     Mirrors Util.qualityGlow — quality 1 deliberately gets nothing so
     the glow stays a meaningful "this is worth walking over to" tell. */
  quality: {
    q4: { color: '#f4d35e', blur: 15, ring: true },
    q3: { color: '#c9a3ff', blur: 9,  ring: true },
    q2: { color: '#9ac9e0', blur: 5,  ring: false },
  },

  /* ---------------- explosions, fire, beams ---------------- */
  fx: {
    // explosion radial gradient, inside -> out
    blastCore:  '255,255,220',
    blastMidR:  255,          // mid stop is 'rgb(255, 140+G, 60)' — G ramps with age
    blastMidG:  140,
    blastMidGRamp: 80,
    blastMidB:  60,
    blastEdge:  'rgba(120,30,10,0)',
    blastRing:  '255,200,120',

    bombBody:   '#2a2a2a',
    bombBodyDark:'#1a1a1a',   // the enemy bomber's strapped-on charge
    fuse:       '#e07a3a',
    fuseHot:    '#ff5a3a',    // <0.5s left / armed
    fuseCord:   '#5c4a2e',
    fuseSpark:  '#e0492f',

    ember:      '#e07a3a',    // Dragon's charge-up ember
    emberGlow:  '#f4a13a',
    // the melee swing arc fades over its life, so it builds its colour from
    // Theme.rgb.swingTrail / Theme.rgb.white — see render.js drawSwingFX
  },

  /* ---------------- shadows / ambient occlusion ----------------
     One place for "how dark is contact shadow in this game", so a
     rock, a pony and a bomb all sit on the floor the same way. */
  shadow: {
    ground:     'rgba(0,0,0,.25)',   // default drop shadow under a body
    groundSoft: 'rgba(0,0,0,.3)',    // heavier — obstacles, machines
    groundHard: 'rgba(0,0,0,.4)',
    pedestal:   'rgba(0,0,0,.25)',
    ao:         'rgba(0,0,0,.22)',   // floor-edge ambient occlusion in the tile bake
    aoWidth:    5,
    outline:    'rgba(0,0,0,.35)',   // thin dark keyline around small icons
    outlineSoft:'rgba(0,0,0,.25)',
    outlineHard:'rgba(0,0,0,.5)',    // keyline that has to survive a hit-flash
    rim:        'rgba(255,255,255,.15)', // top-lit rim highlight on tall rocks
    sheen:      'rgba(255,255,255,.3)',  // chest-lid / shield seam highlight
    glint:      'rgba(255,255,255,.55)', // coin sparkle
  },

  /* ---------------- screen-space lighting ----------------
     A soft dark vignette drawn after the world, before the HUD-ish
     overlays. Deliberately subtle: it should read as "the torch
     doesn't quite reach the corners", not as a filter. */
  vignette: {
    enabled: true,
    // radial stops, centre -> corner, as [offset, color]
    stops: [
      [0,    'rgba(0,0,0,0)'],
      [0.55, 'rgba(0,0,0,.05)'],
      [0.82, 'rgba(2,2,6,.17)'],
      [1,    'rgba(4,3,8,.36)'],
    ],
  },

  /* ---------------- particles ----------------
     Defaults for FX (see render.js). Individual spawns can override. */
  particle: {
    hitSpark:   '#ffd9a0',
    critSpark:  '#fff2c0',
    bloodPuff:  '#3a2430',   // enemy death puff base (tinted by enemy colour)
    dust:       'rgba(190,180,200,.45)',
    dustSolid:  '#bcb4c8',
    sparkle:    '#ffe9a8',
    heal:       '#7fd66a',
  },

  /* ---------------- world fixtures ----------------
     Doors used to live in render.js's DOOR_COLORS; a special room's
     door colour is a *renderer* decision (it's a signpost), unlike a
     floor's terrain palette, so it belongs here. */
  door: {
    boss:      { open:'#8a2530', locked:'#4a151c' },
    treasure:  { open:'#c9a13a', locked:'#6b551f' },
    shop:      { open:'#6a3fa8', locked:'#3a2258' },
    petshop:   { open:'#3f7a3f', locked:'#1e3a1e' },
    curse:     { open:'#7a2a44', locked:'#3a1420' },
    sacrifice: { open:'#5a2a70', locked:'#2a1438' },
    vault:     { open:'#2f6080', locked:'#183040' },
    challenge: { open:'#a05a2e', locked:'#502c16' },
    crystal:   { open:'#5a9ab8', locked:'#2c4d5c' },
    sombra:    { open:'#5c1420', locked:'#2c0a10' },
    normal:    { open:'#4a3320', locked:'#26201a' },
    // Phase 7a — the D-branch gate room (floor 3 only). Read both ways: as the
    // colour a NEIGHBOURING room's door takes when it opens onto the star room,
    // and (via render.js's paintPortalTile) as the colour of the portal doors
    // painted inside the star room itself.
    planetarium: { open:'#6a5ce0', locked:'#2e2870' },
    arcade:    { open:'#c93f6b', locked:'#5c1a30' }, // Phase 4 overhaul — coin-toll gated, see combat.js's coinLockedRoomFor
  },

  world: {
    secretOpen:   '#463a5e',   // a crumbled secret passage's floor
    pedestalBase: '#38334f',
    pedestalTop:  '#4a4468',
    shopPickup:   '#c9c3d8',
    stairsPit:    '#0c0c14',
    stairsRing:   '#e3c15b',
    branchA:      '#8a8ac9',
    branchB:      '#3a6ec9',
    pitFill:      '#050508',
    pitEdge:      '#2a2a3a',
  },

  /* ---------------- pickups / small icons ---------------- */
  icon: {
    key:          '#e3d98a',
    keyGold:      '#e3c15b',
    bombBody:     '#262626',
    bombBodyGold: '#8a6a1c',
    bombFuse:     '#e07a3a',
    bombFuseGold: '#e3c15b',
    goldGlowBlur: 8,
    heartRed:     '#e35b6a',
    heartRedLine: '#160b0d',
    heartBlue:    '#5b9ee3',
    heartBlueLine:'#0b1420',
    heartContainer:'#ff8fa0',
    sack:         '#a97c4f',
    sackSeam:     '#6b4a2c',
    sackTie:      '#5c3f22',
    batteryShell: '#33304f',
    batteryCharge:'#4fd1c5',
    pillHalf:     '#e8e8e8',
    itemRing:     'rgba(255,255,255,.4)',
  },

  chest: {
    lockBomb:  '#1a1a1a',
    lockKey:   '#3a2e10',
    lockHeart: '#e07a9c',
    lockPlain: '#4a4640',
  },

  machine: {
    body:    '#3a3454',
    frame:   '#231f38',
    meterBg: '#1c1930',
    meterFill:'#e3c15b',
    slot:    '#161228',
    label:   '#e3c15b',
    // the reroll altar (shop.js) — same fixture family as the donation
    // machine above, deliberately a cold arcane violet instead of gold so the
    // two are never confused at a glance across a shop room
    altarBody:  '#2f2a4e',
    altarFrame: '#6d4fd6',
    altarGlow:  '#a98bff',
    // Phase 4 overhaul — arcade room machines (see shop.js's tryArcadeInteract,
    // room.js's populateRoom). Same shadow-ellipse + framed-slab silhouette
    // family as body/frame and altarBody/altarFrame above, one color pair per
    // machine kind so the three read as distinct fixtures at a glance.
    friendshipBody:  '#4a2a3a',
    friendshipFrame: '#c9527a',
    toolsBody:       '#3a3a2a',
    toolsFrame:      '#a8934a',
    darkBody:        '#221a30',
    darkFrame:       '#5a4a8a',
    // arcade filly sign — the little placard above each beggar pony showing
    // what it wants fed (see Util.drawFilly)
    fillySign:     '#5c4a38',
    fillySignEdge: '#8a6a4a',
    // Phase 6a overhaul — spin-anticipation flourish on friendship/tools
    // machines while machine.spinning is true, see Util.drawMachineSpinFlourish
    spinRing: '#f0e0a0',
  },

  /* ---------------- character sprite details ----------------
     Shared across every class/enemy, so they're renderer decisions
     rather than per-character identity. */
  pony: {
    flash:     '#ffffff',   // the hit-flash silhouette
    beak:      '#e0a83a',
    talon:     '#e0a83a',
    fang:      '#f2f0e8',
    horn:      '#ece4cc',
    chargerHorn:'#e8e4dc',
    eyeWhite:  '#f5f0e6',
    pupil:     '#171220',
    eyeGlint:  'rgba(255,255,255,.85)',
    robotEye:  '#4fd1c5',
    robotSeam: 'rgba(0,0,0,.25)',
    ghostAlpha: 0.78,
  },

  enemy: {
    flash:     '#ffffff',
    flashSoft: '#eeeeee',
    eye:       '#1a1420',
    submergedAlpha: 0.25,
  },

  obstacle: {
    flash:      '#fff',
    flashSoft:  '#eee',
    hardOutline:'#000',
  },
};

/* The renderer only ever asks for a door colour by destination room
   type; keep the old DOOR_COLORS name working as a thin alias so
   nothing that referenced it has to change. */
const DOOR_COLORS = Theme.door;

'use strict';
// ui/menu-backdrop.js — slow-drifting ambient motes rendered on
// #menuBackdrop, a fixed full-viewport <canvas> sitting behind #app (see
// style.css). Purely decorative, additive to the existing static
// body::before/::after gradient+twinkle layers in style.css: those are
// fixed-position CSS glows that never move, so the main menu had no sense
// of depth or motion beyond the title's own pulse. These motes actually
// drift upward with a gentle sideways sway and a slow twinkle, which the
// pure-CSS layers can't provide on their own.
//
// renderMenuBackdrop(dt) is called from main.js's loop() only in the
// `else` branch of `if (game)` — i.e. only while `game` is null, which is
// exactly the condition under which the main menu is the visible screen
// (see startGameWithClass/returnToMenu) — so there is zero per-frame cost
// during actual gameplay, pause, game-over, or win screens.
const MENU_BACKDROP_PALETTE = ['#8b5cf6', '#4fd1c5', '#e3c15b', '#e35b6a', '#5b9ee3'];
const MENU_BACKDROP_COUNT = 46;

let menuBackdropCanvas = null;
let menuBackdropCtx = null;
let menuBackdropParticles = null;
let menuBackdropTime = 0;

// Lazily grabs the canvas/context and keeps its pixel size matched to the
// viewport — cheap to poll every frame (just two property reads in the
// common case where nothing changed) so no separate resize listener is
// needed. Returns false if the canvas isn't in the DOM for some reason
// (defensive only — it's always present in index.html).
function ensureMenuBackdropSized(){
  if (!menuBackdropCanvas) menuBackdropCanvas = document.getElementById('menuBackdrop');
  if (!menuBackdropCanvas) return false;
  if (!menuBackdropCtx) menuBackdropCtx = menuBackdropCanvas.getContext('2d');
  const w = window.innerWidth, h = window.innerHeight;
  if (menuBackdropCanvas.width !== w || menuBackdropCanvas.height !== h) {
    menuBackdropCanvas.width = w;
    menuBackdropCanvas.height = h;
    // A resize invalidates old particle positions relative to the new
    // viewport in a way that isn't worth reconciling (a mote or two
    // popping to a new spot after a resize is imperceptible) — simplest
    // correct fix is just reseeding against the new bounds.
    menuBackdropParticles = null;
  }
  return true;
}

function seedMenuBackdropParticles(){
  const w = menuBackdropCanvas.width, h = menuBackdropCanvas.height;
  menuBackdropParticles = [];
  for (let i = 0; i < MENU_BACKDROP_COUNT; i++) {
    menuBackdropParticles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.8 + Math.random() * 1.8,
      speed: 6 + Math.random() * 14,       // px/sec, drifting upward
      sway: 8 + Math.random() * 18,        // px, horizontal sway amplitude
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.15 + Math.random() * 0.25,
      color: Util.choice(MENU_BACKDROP_PALETTE),
      alphaPhase: Math.random() * Math.PI * 2,
      alphaSpeed: 0.3 + Math.random() * 0.5,
    });
  }
}

function renderMenuBackdrop(dt){
  if (!ensureMenuBackdropSized()) return;
  if (!menuBackdropParticles) seedMenuBackdropParticles();
  menuBackdropTime += dt;
  const ctx = menuBackdropCtx;
  const w = menuBackdropCanvas.width, h = menuBackdropCanvas.height;
  ctx.clearRect(0, 0, w, h);
  for (const p of menuBackdropParticles) {
    p.y -= p.speed * dt;
    if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; } // wrap back in at the bottom, fresh x
    const sway = Math.sin(menuBackdropTime * p.swaySpeed + p.swayPhase) * p.sway;
    const alpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(menuBackdropTime * p.alphaSpeed + p.alphaPhase));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x + sway, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

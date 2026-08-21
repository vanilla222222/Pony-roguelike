'use strict';
/* ============================================================
   main.js — bootstrap: persistence, input wiring, main loop,
   menu/screen transitions.
   ============================================================ */

function loadUnlocks(){
  try { return JSON.parse(localStorage.getItem('nightfallUnlocks') || '{}'); }
  catch (e) { return {}; }
}
function saveUnlocks(u){ localStorage.setItem('nightfallUnlocks', JSON.stringify(u)); }

let game = null;

// build: Engineer Pony's turret-build channel (see data/core.js's
// canBuildTurrets, systems/combat-1.js's updateTurretBuild). Held, not
// pressed — same shape as `attack`, not the one-shot tryX() pattern the
// KeyB/KeyE/etc handlers below use.
const input = { left:false, right:false, up:false, down:false, attack:false, build:false, mouseX:0, mouseY:0, mouseActive:false };

const canvas = document.getElementById('game');

function toggleMuteUI(){
  const muted = Sound.toggleMute();
  syncMuteBtn();
  toast(muted ? 'Sound muted' : 'Sound unmuted');
}

window.addEventListener('keydown', (e) => {
  Sound.unlock(); // a keydown is a real user gesture — safe place to wake the AudioContext up
  switch (e.code) {
    case 'KeyW': case 'ArrowUp': input.up = true; break;
    case 'KeyS': case 'ArrowDown': input.down = true; break;
    case 'KeyA': case 'ArrowLeft': input.left = true; break;
    case 'KeyD': case 'ArrowRight': input.right = true; break;
    case 'Space': input.attack = true; e.preventDefault(); break;
    // Engineer Pony's turret-build channel — held, see the `input.build`
    // comment above. Harmless no-op for every other class (updateTurretBuild
    // bails immediately on !player.canBuildTurrets).
    case 'KeyV': input.build = true; break;
    case 'KeyB': if (game) game.tryPlaceBomb(); break;
    case 'KeyE': if (game) game.tryUseActive(); break;
    case 'KeyQ': if (game) game.tryUsePill(); break;
    case 'KeyR': if (game) game.tryUseStar(); break;
    case 'KeyF': if (game) game.tryDonate(); break;
    // reroll altar, shop rooms only — see shop.js. Unlike Donate (1c a tap),
    // a reroll is 3c+ and escalating, so held-key auto-repeat must NOT drain
    // the wallet: one charge per real press.
    case 'KeyG': if (game && !e.repeat) game.tryReroll(); break;
    // arcade room fixtures (fillies + machines) — see shop.js's
    // tryArcadeInteract. Feeds cost real resources (coins/bombs/keys/hearts),
    // so held-key auto-repeat must NOT drain them: one interaction per press.
    case 'KeyH': if (game && !e.repeat) game.tryArcadeInteract(); break;
    case 'KeyM': toggleMuteUI(); break;
    case 'KeyT': toggleOverlay('achievementsScreen', buildAchievementsPanel, markAchievementsSeen); break;
    case 'KeyC': toggleOverlay('bestiaryScreen', buildBestiaryPanel, markBestiarySeenBadge); break;
    case 'Escape': {
      // closing an open overlay takes priority over the pause toggle — lets
      // Escape act as a universal "back out of whatever's open" key instead
      // of only ever doing one specific thing
      const openScreen = ['achievementsScreen', 'bestiaryScreen']
        .map(id => document.getElementById(id))
        .find(el => el && !el.classList.contains('hidden'));
      if (openScreen) { Sound.play('uiClick'); openScreen.classList.add('hidden'); }
      else togglePause();
      break;
    }
    default: return;
  }
});
window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW': case 'ArrowUp': input.up = false; break;
    case 'KeyS': case 'ArrowDown': input.down = false; break;
    case 'KeyA': case 'ArrowLeft': input.left = false; break;
    case 'KeyD': case 'ArrowRight': input.right = false; break;
    case 'Space': input.attack = false; break;
    case 'KeyV': input.build = false; break;
  }
});

// pointer events rather than mouse events: same clientX/clientY/button fields
// (PointerEvent extends MouseEvent, so the handler bodies are unchanged), but
// pen and touch contacts come through the same path for free
canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  // convert to *logical* camera-space pixels (CAMERA_W/H), not the dpr-scaled
  // physical backing size — game logic (aim angle, camX/camY) all works in
  // logical pixels, same as before the retina-crispness pass in render.js
  input.mouseX = (e.clientX - rect.left) * (CAMERA_W / rect.width);
  input.mouseY = (e.clientY - rect.top) * (CAMERA_H / rect.height);
  input.mouseActive = true;
});
canvas.addEventListener('pointerleave', () => { input.mouseActive = false; });
canvas.addEventListener('pointerdown', (e) => {
  Sound.unlock(); // likewise a real gesture — covers mouse-first players who never touch a key
  if (e.button === 0) input.attack = true;
  if (e.button === 2 && game) game.tryPlaceBomb();
});
window.addEventListener('pointerup', (e) => { if (e.button === 0) input.attack = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function togglePause(){
  if (!game || (game.state !== 'playing')) return;
  game.paused = !game.paused;
  document.getElementById('pauseScreen').classList.toggle('hidden', !game.paused);
  // no reason to hold the screen awake while sitting on the pause menu
  if (game.paused) releaseWakeLock(); else requestWakeLock();
  if (game.paused) {
    const player = game.player;
    document.getElementById('pauseStats').textContent =
      `${CLASSES[player.classId].name} · Floor ${game.dungeon.floorNum + 1} · ${Util.formatNum(player.coins)}c · ${player.keys} keys · ${player.bombs} bombs · ` +
      `${game.runKills} kills · ${Util.formatDuration(game.runElapsed)} played`;
    // what's actually equipped right now, at a glance — the HUD icons are
    // easy to lose track of mid-run, see index.html's #pauseEquipped
    const eqEl = document.getElementById('pauseEquipped');
    if (eqEl) {
      const bits = [];
      if (player.activeItem) bits.push(player.activeItem.icon + ' ' + player.activeItem.name);
      if (player.trinketId) bits.push(TRINKETS[player.trinketId].icon + ' ' + TRINKETS[player.trinketId].name);
      if (player.pillPocket) bits.push('💊 ' + PILL_COLORS_BY_ID[player.pillPocket].name);
      if (player.starPocket) bits.push(STAR_TYPES[player.starPocket].icon + ' ' + STAR_TYPES[player.starPocket].name);
      eqEl.textContent = bits.join('   ·   ');
    }
  }
}
document.getElementById('resumeBtn').addEventListener('click', () => { Sound.play('uiClick'); togglePause(); });
document.getElementById('quitBtn').addEventListener('click', () => {
  // an in-progress run is gone for good once you back out — a stray misclick
  // shouldn't be able to eat a run you were still in the middle of
  if (!confirm('Quit to the main menu? Your current run will be lost.')) return;
  Sound.play('uiClick');
  bumpStat('totalPlaytime', Math.round(game.runElapsed), game);
  document.getElementById('pauseScreen').classList.add('hidden');
  returnToMenu();
});
// shared open logic for the Achievements and Bestiary overlays — every
// button that opens one (main menu, pause screen) and the T/C keybinds
// (see the keydown handler above) all funnel through here, so scroll-reset
// and badge-clearing can't drift out of sync between the various entry
// points. Opens unconditionally (used by buttons, which are only ever
// clickable while the overlay is already closed); toggleOverlay below is
// the open-OR-close variant used by the keybinds.
function openOverlay(id, buildFn, markSeenFn){
  Sound.play('uiClick');
  buildFn();
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.scrollTop = 0; // always open scrolled to the top, regardless of where it was left last time
  if (markSeenFn) markSeenFn();
}
function toggleOverlay(id, buildFn, markSeenFn){
  const el = document.getElementById(id);
  if (!el) return;
  if (el.classList.contains('hidden')) openOverlay(id, buildFn, markSeenFn);
  else { Sound.play('uiClick'); el.classList.add('hidden'); }
}
// clicking the dimmed backdrop (not any of the panel's own content) closes
// it — a lot of players instinctively try this before hunting for Close
for (const id of ['achievementsScreen', 'bestiaryScreen']) {
  document.getElementById(id).addEventListener('click', (e) => {
    if (e.target.id === id) { Sound.play('uiClick'); e.target.classList.add('hidden'); }
  });
}

document.getElementById('pauseAchievementsBtn').addEventListener('click', () => openOverlay('achievementsScreen', buildAchievementsPanel, markAchievementsSeen));
document.getElementById('pauseBestiaryBtn').addEventListener('click', () => openOverlay('bestiaryScreen', buildBestiaryPanel, markBestiarySeenBadge));
document.getElementById('retryBtn').addEventListener('click', () => { Sound.play('uiClick'); returnToMenu(); });
document.getElementById('winBtn').addEventListener('click', () => { Sound.play('uiClick'); returnToMenu(); });

document.getElementById('achievementsBtn').addEventListener('click', () => openOverlay('achievementsScreen', buildAchievementsPanel, markAchievementsSeen));
document.getElementById('bestiaryBtn').addEventListener('click', () => openOverlay('bestiaryScreen', buildBestiaryPanel, markBestiarySeenBadge));

// a small "NEW" badge on the main menu's Achievements button whenever
// something unlocked since the last time that panel was actually opened —
// otherwise a run that quietly earns 3 achievements gives no signal at all
// until you happen to go looking
function markAchievementsSeen(){
  const unlocks = ensureUnlockShape(loadUnlocks());
  try { localStorage.setItem('nightfallAchvSeenCount', String(Object.keys(unlocks.achievements).length)); } catch (e) { /* ignore */ }
  const badge = document.getElementById('achievementsNewBadge');
  if (badge) badge.classList.add('hidden');
}
function refreshAchievementsBadge(){
  const badge = document.getElementById('achievementsNewBadge');
  if (!badge) return;
  const unlocks = ensureUnlockShape(loadUnlocks());
  const doneCount = Object.keys(unlocks.achievements).length;
  let seenCount = 0;
  try { seenCount = parseInt(localStorage.getItem('nightfallAchvSeenCount') || '0', 10); } catch (e) { /* ignore */ }
  badge.classList.toggle('hidden', doneCount <= seenCount);
}
document.getElementById('achievementsCloseBtn').addEventListener('click', () => {
  Sound.play('uiClick');
  document.getElementById('achievementsScreen').classList.add('hidden');
});
document.getElementById('bestiaryCloseBtn').addEventListener('click', () => {
  Sound.play('uiClick');
  document.getElementById('bestiaryScreen').classList.add('hidden');
});

const muteBtn = document.getElementById('muteBtn');
function syncMuteBtn(){
  if (!muteBtn) return;
  const muted = Sound.isMuted();
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.title = (muted ? 'Unmute' : 'Mute') + ' (M)';
  muteBtn.classList.toggle('muted', muted);
}
if (muteBtn) muteBtn.addEventListener('click', () => { Sound.unlock(); toggleMuteUI(); });
syncMuteBtn();

const volumeSlider = document.getElementById('volumeSlider');
if (volumeSlider) {
  volumeSlider.value = String(Math.round(Sound.getVolume() * 100));
  volumeSlider.addEventListener('input', () => { Sound.setVolume(volumeSlider.value / 100); });
  volumeSlider.addEventListener('change', () => { Sound.unlock(); Sound.play('uiClick'); });
}

/* ---------------- difficulty ---------------- */
// Purely an enemy knob: the multiplier is read once per Enemy/Boss
// construction (entities.js) and scales their hp + dmg. Nothing about the
// player, items or drops looks at it. Persisted with the same try/catch
// localStorage pattern as the audio prefs (audio.js's loadMutePref).
const DIFFICULTY_IDS = ['easy', 'normal', 'hard'];
function loadDifficultyPref(){
  try {
    const d = localStorage.getItem('nightfallDifficulty');
    return DIFFICULTY_IDS.indexOf(d) >= 0 ? d : 'normal';
  } catch (e) { return 'normal'; }
}
function saveDifficultyPref(d){
  try { localStorage.setItem('nightfallDifficulty', d); } catch (e) { /* ignore */ }
}
let currentDifficulty = loadDifficultyPref();
// cached in memory rather than re-read from localStorage per spawn — a room
// can construct a dozen enemies at once
function difficultyStatMult(){
  return currentDifficulty === 'easy' ? 0.75 : currentDifficulty === 'hard' ? 1.5 : 1;
}

const difficultySelect = document.getElementById('difficultySelect');
function syncDifficultyBtns(){
  if (!difficultySelect) return;
  const btns = difficultySelect.querySelectorAll('button[data-difficulty]');
  for (let i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].dataset.difficulty === currentDifficulty);
  }
}
if (difficultySelect) {
  difficultySelect.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-difficulty]');
    if (!btn || DIFFICULTY_IDS.indexOf(btn.dataset.difficulty) < 0) return;
    currentDifficulty = btn.dataset.difficulty;
    saveDifficultyPref(currentDifficulty);
    syncDifficultyBtns();
    Sound.play('uiClick');
  });
  syncDifficultyBtns();
}

const minimapLegendBtn = document.getElementById('minimapLegendBtn');
if (minimapLegendBtn) minimapLegendBtn.addEventListener('click', () => { Sound.play('uiClick'); toggleMinimapLegend(); });

/* ---------------- fullscreen toggle ---------------- */
// same floating-chrome treatment as the mute button — see style.css's
// .mute-btn / .fullscreen-btn. Hidden outright where the API doesn't exist
// (older iOS Safari) rather than left as a button that does nothing.
const fullscreenBtn = document.getElementById('fullscreenBtn');
const FULLSCREEN_SUPPORTED = !!document.documentElement.requestFullscreen;
function syncFullscreenBtn(){
  if (!fullscreenBtn) return;
  const on = !!document.fullscreenElement;
  // one glyph in both states (nothing exotic that could land as tofu) — the
  // state reads through the title/aria-pressed and the .active accent, the
  // same way .mute-btn.muted carries the muted state
  fullscreenBtn.title = on ? 'Exit fullscreen' : 'Fullscreen';
  fullscreenBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  fullscreenBtn.classList.toggle('active', on);
}
if (fullscreenBtn) {
  if (!FULLSCREEN_SUPPORTED) fullscreenBtn.classList.add('hidden');
  else {
    fullscreenBtn.addEventListener('click', () => {
      Sound.play('uiClick');
      // requestFullscreen/exitFullscreen both reject if the browser refuses
      // (permissions policy, no user gesture) — nothing to do but ignore it
      if (document.fullscreenElement) { const p = document.exitFullscreen(); if (p && p.catch) p.catch(() => {}); }
      else { const p = document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
    });
    document.addEventListener('fullscreenchange', () => {
      syncFullscreenBtn();
      if (game) game.fitCanvas(); // the viewport just changed size under us
    });
    syncFullscreenBtn();
  }
}

/* ---------------- screen wake lock ---------------- */
// a controller-only stretch of a run (no keyboard/mouse events for a while)
// would otherwise let the screen dim mid-fight. Held only while actually
// playing — released on pause, on the end screens, and whenever the tab goes
// away — and silently skipped where the API doesn't exist.
let wakeLock = null;
function requestWakeLock(){
  if (!('wakeLock' in navigator) || wakeLock || document.hidden) return;
  if (!game || game.state !== 'playing' || game.paused) return;
  try {
    navigator.wakeLock.request('screen').then((lock) => {
      // the run may have ended during the await — don't hold a stale lock
      if (!game || game.state !== 'playing' || game.paused || document.hidden) {
        try { const p = lock.release(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
        return;
      }
      wakeLock = lock;
      lock.addEventListener('release', () => { if (wakeLock === lock) wakeLock = null; });
    }).catch(() => { /* rejected (low battery, no gesture, policy) — just go without */ });
  } catch (e) { /* ignore */ }
}
function releaseWakeLock(){
  if (!wakeLock) return;
  const lock = wakeLock;
  wakeLock = null;
  try { const p = lock.release(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
}

/* ---------------- tab visibility ---------------- */
// a hidden tab can't show a frame, so stop scheduling them at all instead of
// riding the browser's throttled rAF, park the AudioContext alongside, and
// drop the wake lock. Everything comes back on the way in.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopLoop();
    Sound.suspend();
    releaseWakeLock();
  } else {
    startLoop();
    Sound.resume(); // no-op while muted — see audio.js
    requestWakeLock();
  }
});

// tabbing/alt-tabbing away mid-run auto-pauses instead of leaving you open
// to free damage while you weren't even looking at the screen
window.addEventListener('blur', () => {
  if (game && game.state === 'playing' && !game.paused) togglePause();
});

// a stray tab-close/refresh mid-run is otherwise silent — the browser's own
// "leave site?" prompt is the only thing that can warn about that
window.addEventListener('beforeunload', (e) => {
  if (game && game.state === 'playing') { e.preventDefault(); e.returnValue = ''; }
});

// a small rotating tip on the main menu, re-rolled every time it's shown —
// a cheap way to surface systems a player might not have stumbled onto yet
const MENU_TIPS = [
  'Press R to use a held Star — unlike pills, its effect is always shown up front.',
  'The Bestiary (C) fills in as you play: kills, pickups, and destroyed objects all count toward it.',
  'Crystal and Sombra rooms have a better chance of spawning right next to the boss room on even floors.',
  'Standing near an item pedestal shows what it does before you commit to grabbing it.',
  'Donation machines cap at 1000c lifetime — across every run, never reset.',
  'Achievements (T) show live progress toward anything with a numeric threshold.',
  'A Cursed Chest costs hearts to open, but is far more likely to hold an item.',
  'Bombs destroy rocks, hazards, turrets, and stone chests alike — always worth carrying a few.',
  'The minimap\'s "?" button explains every room-type icon.',
  'Losing focus on the tab (alt-tab, switching windows) auto-pauses your run.',
];
function showMenuTip(){
  const el = document.getElementById('mainMenuTip');
  if (el) el.textContent = '💡 ' + Util.choice(MENU_TIPS);
}

function startGameWithClass(classId){
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('winScreen').classList.add('hidden');
  document.getElementById('pauseScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');
  game = new Game(canvas);
  game.startRun(classId);
  game.fitCanvas();
  requestWakeLock();
}

function returnToMenu(){
  releaseWakeLock();
  game = null;
  document.getElementById('gameScreen').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('winScreen').classList.add('hidden');
  document.getElementById('pauseScreen').classList.add('hidden');
  document.getElementById('mainMenu').classList.remove('hidden');
  buildClassSelect(startGameWithClass);
  buildSuperbossTrophies();
  updateLifetimeStatsDisplay();
}

// a quiet one-line summary of everything banked across every run so far —
// see achievements.js's statDefaults (runsStarted/totalPlaytime/wins)
function updateLifetimeStatsDisplay(){
  const el = document.getElementById('lifetimeStats');
  if (el) {
    const unlocks = ensureUnlockShape(loadUnlocks());
    const s = unlocks.stats;
    if (!s.runsStarted) { el.textContent = ''; }
    else {
      const best = s.deepestFloor ? ` · deepest: Floor ${Util.formatNum(s.deepestFloor)}` : '';
      const fastest = s.fastestWinSeconds != null ? ` · fastest win: ${Util.formatDuration(s.fastestWinSeconds)}` : '';
      el.textContent = `${Util.formatNum(s.runsStarted)} runs · ${Util.formatNum(s.wins)} wins · ${Util.formatDuration(s.totalPlaytime)} played · ${Util.formatNum(s.enemiesKilled)} enemies defeated${best}${fastest}`;
    }
  }
  refreshAchievementsBadge();
  refreshBestiaryBadge();
  showMenuTip();
}

/* ---------------- shareable run summary ---------------- */
// snapshotted when the end screen goes up rather than read on click, since
// `game` is torn down the moment the player heads back to the menu
let _runSummary = '';
const CLIPBOARD_SUPPORTED = !!(navigator.clipboard && navigator.clipboard.writeText);
function buildRunSummary(won){
  const p = game.player;
  // the C-branch has its own ending (Kirk DNB on 10C, see game.js's descend)
  const outcome = won
    ? (game.floorPath === 'C' ? `silenced Kirk DNB at the end of the drowned path` : `banished the DNBs`)
    : `fell on Floor ${floorLabelFor(game.dungeon.floorNum, game.floorPath)} (${floorNameFor(game.dungeon.floorNum, game.floorPath)})`;
  return `Nightfall Charge — ${CLASSES[p.classId].name} ${outcome}\n`
    + `${Util.formatNum(p.coins)} coins · ${game.runKills} kills · ${Util.formatDuration(game.runElapsed)} played`;
}
// brief in-button confirmation, then back to the original label — the same
// "say it and get out of the way" idea as ui.js's toast, but anchored to the
// thing that was clicked
function wireCopyBtn(id){
  const btn = document.getElementById(id);
  if (!btn) return;
  if (!CLIPBOARD_SUPPORTED) { btn.classList.add('hidden'); return; }
  const label = btn.textContent;
  let resetTimer = null;
  btn.addEventListener('click', () => {
    Sound.play('uiClick');
    navigator.clipboard.writeText(_runSummary).then(() => {
      btn.textContent = '✅ Copied!';
    }).catch(() => {
      btn.textContent = 'Copy failed';
    }).then(() => {
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { btn.textContent = label; }, 1600);
    });
  });
}
wireCopyBtn('copyRunBtn');
wireCopyBtn('copyWinRunBtn');

function showGameOver(){
  document.getElementById('gameOverStats').textContent =
    `${CLASSES[game.player.classId].name} · reached Floor ${floorLabelFor(game.dungeon.floorNum, game.floorPath)} (${floorNameFor(game.dungeon.floorNum, game.floorPath)}) · ` +
    `${Util.formatNum(game.player.coins)} coins collected · ${game.runKills} kills · ${Util.formatDuration(game.runElapsed)} played`;
  _runSummary = buildRunSummary(false);
  document.getElementById('gameOverScreen').classList.remove('hidden');
}
function showWin(){
  // one clause per win condition — floor 15's One True DNB (the normal path),
  // 12C's Kirk DNB (the C-branch), and 10D's Singularity (the D-branch, Phase 7a)
  const deed = game.floorPath === 'C' ? 'silenced Kirk DNB'
    : game.floorPath === 'D' ? 'snuffed out the last light'
    : 'banished the DNBs';
  document.getElementById('winStats').textContent =
    `${CLASSES[game.player.classId].name} ${deed} with ${Util.formatNum(game.player.coins)} coins and ${game.player.totalHearts()} hearts remaining! ` +
    `${game.runKills} kills · ${Util.formatDuration(game.runElapsed)} played`;
  _runSummary = buildRunSummary(true);
  document.getElementById('winScreen').classList.remove('hidden');
}

// watches the element fitCanvas() actually measures (#canvasWrap), so a
// layout change that resizes it without resizing the window — entering
// fullscreen, a mobile URL bar collapsing — gets picked up too
const canvasWrap = document.getElementById('canvasWrap');
if (window.ResizeObserver && canvasWrap) {
  new ResizeObserver(() => { if (game) game.fitCanvas(); }).observe(canvasWrap);
} else {
  window.addEventListener('resize', () => { if (game) game.fitCanvas(); });
}

let lastTime = performance.now();
let lastState = 'idle';
function loop(now){
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (game) {
    game.update(input, dt);
    game.render();
    if (game.state !== lastState) {
      lastState = game.state;
      if (game.state === 'gameover' || game.state === 'win') releaseWakeLock();
      if (game.state === 'gameover') {
        showGameOver(); Sound.play('gameOver'); bumpStat('deaths', 1, game); bumpStat('totalPlaytime', Math.round(game.runElapsed), game);
        // credit whatever actually landed the killing blow, for the
        // Bestiary's "Killed you N times" line — see entities.js's
        // takeDamage/combat.js's damagePlayer call sites for what ends up
        // here; only real enemy/boss/superboss ids count (an obstacle kind
        // or 'curse'/'explosion' string is not a Bestiary enemy entry)
        const src = game.player.lastDamageSource;
        if (src && (ENEMY_TYPES[src] || BOSS_TYPES[src] || SUPERBOSSES[src])) bumpBestiaryCount('enemyDeaths', src, 1);
      }
      if (game.state === 'win') {
        showWin(); Sound.play('winFanfare'); recordWin(game, game.player.classId);
        bumpStat('totalPlaytime', Math.round(game.runElapsed), game);
        // lifetime "fastest win" record — see main.js's lifetime stats line
        if (setStatMin('fastestWinSeconds', game.runElapsed)) {
          toast('🏅 New personal best! Fastest win: ' + Util.formatDuration(game.runElapsed) + '.', true);
        }
        // speedrun tiers — game.runElapsed is this run's played seconds (pause
        // excluded, see game.js update()). Checked independently, not as an
        // either/or ladder, so one very fast win awards all three at once.
        if (game.runElapsed <= 1200) unlockAchievement('challenge_speedrun_20min', game);
        if (game.runElapsed <= 720) unlockAchievement('challenge_speedrun_12min', game);
        if (game.runElapsed <= 480) unlockAchievement('challenge_speedrun_8min', game);
      }
    }
  }
  rafId = requestAnimationFrame(loop);
}
// the loop is stopped outright while the tab is hidden (see the
// visibilitychange handler above) — rafId is both the pending frame's handle
// and the "is the loop running?" flag, so resuming can never double-schedule.
let rafId = null;
function startLoop(){
  if (rafId !== null) return;
  lastTime = performance.now(); // a long hidden gap must not arrive as one giant dt
  rafId = requestAnimationFrame(loop);
}
function stopLoop(){
  if (rafId === null) return;
  cancelAnimationFrame(rafId);
  rafId = null;
}
startLoop();

buildClassSelect(startGameWithClass);
buildSuperbossTrophies();
updateLifetimeStatsDisplay();

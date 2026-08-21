'use strict';
/* ============================================================
   audio.js — a tiny synthesized SFX engine (Web Audio API).

   There are no sound files anywhere in this project — every
   effect below is generated on the fly from oscillators/filtered
   noise. That means nothing to download, nothing to license, and
   nothing to keep in sync with asset files. Add a new sound by
   adding a short function to the SFX table at the bottom and
   calling Sound.play('yourName') from wherever it happens.

   Browsers refuse to make sound before a user gesture, so
   Sound.unlock() (safe to call repeatedly) is wired into the
   first real keydown/click handlers in main.js/ui.js.
   ============================================================ */

const Sound = (() => {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  const BASE_VOLUME = 0.55; // what a volume slider value of 100% maps to

  function loadMutePref(){
    try { return localStorage.getItem('nightfallMuted') === '1'; } catch (e) { return false; }
  }
  function saveMutePref(v){
    try { localStorage.setItem('nightfallMuted', v ? '1' : '0'); } catch (e) { /* ignore */ }
  }
  let muted = loadMutePref();

  // 0..1 multiplier on top of BASE_VOLUME — see main.js's #volumeSlider
  function loadVolumePref(){
    try {
      const v = parseFloat(localStorage.getItem('nightfallVolume'));
      return isNaN(v) ? 1 : Util.clamp(v, 0, 1);
    } catch (e) { return 1; }
  }
  function saveVolumePref(v){
    try { localStorage.setItem('nightfallVolume', String(v)); } catch (e) { /* ignore */ }
  }
  let volume = loadVolumePref();

  function ensureCtx(){
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : BASE_VOLUME * volume;
    master.connect(ctx.destination);
    // one shared noise buffer, re-sliced by every burst — generated once so
    // frequent sounds (melee swings, enemy deaths) never allocate audio data
    const len = ctx.sampleRate * 2;
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function unlock(){
    const c = ensureCtx();
    if (c && c.state === 'suspended') c.resume();
  }

  // parked while the tab is hidden — see main.js's visibilitychange handler.
  // Never *creates* a context (that stays gesture-driven, via unlock()) and
  // never touches the muted state: a muted player stays muted on the way back.
  function suspend(){
    if (ctx && ctx.state === 'running') { try { ctx.suspend(); } catch (e) { /* ignore */ } }
  }
  function resume(){
    if (ctx && !muted && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
  }

  function setMuted(v){
    muted = v;
    saveMutePref(v);
    if (master) master.gain.setTargetAtTime(muted ? 0 : BASE_VOLUME * volume, ctx.currentTime, 0.01);
  }
  function toggleMute(){ setMuted(!muted); return muted; }
  function isMuted(){ return muted; }

  // v is 0..1 — see main.js's #volumeSlider (0-100 range, divided down)
  function setVolume(v){
    volume = Util.clamp(v, 0, 1);
    saveVolumePref(volume);
    if (master && !muted) master.gain.setTargetAtTime(BASE_VOLUME * volume, ctx.currentTime, 0.01);
  }
  function getVolume(){ return volume; }

  /* ---------------- synth primitives ---------------- */

  // a single oscillator with an attack/release envelope, optional pitch sweep
  function tone(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      type = 'sine', dur = 0.15, gain = 0.3, attack = 0.005, release = 0.08,
      detune = 0, sweepTo = null, delay = 0, filterFreq = null, filterType = 'lowpass',
    } = opts;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (detune) osc.detune.setValueAtTime(detune, t0);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    let tail = osc;
    if (filterFreq) {
      const f = c.createBiquadFilter();
      f.type = filterType; f.frequency.setValueAtTime(filterFreq, t0);
      osc.connect(f); tail = f;
    }
    tail.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + release + 0.05);
  }

  // several tones fired in a quick staggered run — chimes, chords, fanfares
  function chord(freqs, opts = {}){
    const { stagger = 0.045, delay = 0, ...rest } = opts;
    freqs.forEach((f, i) => tone(f, { ...rest, delay: delay + i * stagger }));
  }

  // a slice of the shared noise buffer through a filter + envelope —
  // whooshes, thuds, crunches, explosions
  function noise(opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.15, gain = 0.3, attack = 0.002, release = 0.1,
      filterFreq = 1200, filterType = 'bandpass', filterQ = 1,
      filterSweepTo = null, delay = 0,
    } = opts;
    const t0 = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const startOffset = Math.max(0, Math.random() * (noiseBuffer.duration - dur - 0.1));
    const f = c.createBiquadFilter();
    f.type = filterType; f.Q.value = filterQ;
    f.frequency.setValueAtTime(filterFreq, t0);
    if (filterSweepTo) f.frequency.exponentialRampToValueAtTime(Math.max(1, filterSweepTo), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0, startOffset); src.stop(t0 + dur + release + 0.05);
  }

  /* ---------------- the sound table ---------------- */
  // one short function per named effect — this is the single place to look
  // to tweak or add a sound.
  const SFX = {
    // pickups
    coin(){ tone(760, { type:'triangle', dur:0.05, gain:0.22, sweepTo:1100, release:0.06 }); },
    coinNickel(){ chord([620,900], { type:'triangle', gain:0.22, dur:0.06, release:0.08, stagger:0.03 }); },
    coinDime(){ chord([700,980,1300], { type:'triangle', gain:0.2, dur:0.06, release:0.1, stagger:0.035 }); },
    coinLucky(){
      chord([880,1180,1560], { type:'sine', gain:0.18, dur:0.09, release:0.18, stagger:0.05 });
      tone(1760, { type:'sine', gain:0.1, dur:0.12, delay:0.1, release:0.2 });
    },
    key(){
      noise({ dur:0.03, gain:0.18, filterFreq:3200, filterType:'highpass', release:0.05 });
      tone(1400, { type:'square', dur:0.04, gain:0.12, delay:0.02, release:0.05 });
    },
    bombPickup(){ tone(160, { type:'sine', dur:0.09, gain:0.28, sweepTo:110, release:0.05 }); },
    heart(){ chord([520,780], { type:'sine', gain:0.22, dur:0.1, release:0.14, stagger:0.06 }); },
    heartContainer(){ chord([520,780,1040], { type:'sine', gain:0.24, dur:0.12, release:0.2, stagger:0.06 }); },
    itemGet(){ chord([660,880,1100,1320], { type:'sine', gain:0.16, dur:0.1, release:0.22, stagger:0.055 }); },
    sack(){
      noise({ dur:0.06, gain:0.14, filterFreq:600, filterType:'lowpass', release:0.06 });
      chord([500,700,900], { type:'triangle', gain:0.14, dur:0.07, delay:0.05, release:0.14, stagger:0.045 });
    },
    battery(){ chord([440,660], { type:'square', gain:0.14, dur:0.08, release:0.16, stagger:0.06, detune:-6 }); },

    // chest / shop
    chestOpen(){
      noise({ dur:0.18, gain:0.2, filterFreq:400, filterType:'lowpass', filterSweepTo:900, release:0.1 });
      chord([700,1050], { type:'triangle', gain:0.16, dur:0.08, delay:0.12, release:0.15, stagger:0.05 });
    },
    shopBuy(){ chord([660,990], { type:'triangle', gain:0.18, dur:0.07, release:0.12, stagger:0.05 }); },
    activeUse(){ chord([500,760,1020], { type:'sine', gain:0.18, dur:0.1, release:0.2, stagger:0.04 }); },

    // combat
    meleeSwing(){ noise({ dur:0.06, gain:0.16, filterFreq:2200, filterType:'bandpass', filterSweepTo:600, filterQ:0.7, release:0.03 }); },
    rangedShot(){ tone(900, { type:'sawtooth', dur:0.07, gain:0.14, sweepTo:280, release:0.04 }); },
    laserShot(){
      tone(1800, { type:'sawtooth', dur:0.1, gain:0.12, sweepTo:900, release:0.06 });
      noise({ dur:0.08, gain:0.08, filterFreq:4000, filterType:'highpass', release:0.05 });
    },
    enemyHit(){ noise({ dur:0.04, gain:0.16, filterFreq:1400, filterType:'bandpass', release:0.03 }); },
    crit(){
      noise({ dur:0.05, gain:0.2, filterFreq:1800, filterType:'bandpass', release:0.03 });
      tone(1500, { type:'square', dur:0.04, gain:0.1, delay:0.01, release:0.04 });
    },
    enemyDeath(){
      noise({ dur:0.12, gain:0.22, filterFreq:900, filterType:'lowpass', filterSweepTo:150, release:0.1 });
      tone(220, { type:'sawtooth', dur:0.1, gain:0.12, sweepTo:60, release:0.08 });
    },
    bossDeath(){
      noise({ dur:0.4, gain:0.3, filterFreq:1200, filterType:'lowpass', filterSweepTo:80, release:0.35 });
      chord([180,140,90], { type:'sawtooth', gain:0.2, dur:0.3, release:0.3, stagger:0.09 });
    },
    playerHurt(){ noise({ dur:0.08, gain:0.24, filterFreq:1000, filterType:'lowpass', filterSweepTo:300, release:0.08 }); },
    shieldBlock(){
      tone(500, { type:'square', dur:0.05, gain:0.18, sweepTo:800, release:0.05 });
      noise({ dur:0.04, gain:0.1, filterFreq:2500, filterType:'highpass', release:0.03 });
    },
    dodge(){ tone(700, { type:'sine', dur:0.06, gain:0.14, sweepTo:1100, release:0.08 }); },
    flashpowder(){ noise({ dur:0.1, gain:0.24, filterFreq:3000, filterType:'highpass', release:0.12 }); },

    // bombs / obstacles
    bombPlace(){ tone(300, { type:'square', dur:0.04, gain:0.12, sweepTo:500, release:0.04 }); },
    explosion(){
      noise({ dur:0.32, gain:0.32, filterFreq:1400, filterType:'lowpass', filterSweepTo:90, release:0.3 });
      tone(90, { type:'sine', dur:0.28, gain:0.2, release:0.3 });
    },
    obstacleHit(){ noise({ dur:0.05, gain:0.16, filterFreq:2000, filterType:'bandpass', release:0.04 }); },
    obstacleDestroy(){ noise({ dur:0.16, gain:0.22, filterFreq:800, filterType:'lowpass', filterSweepTo:200, release:0.14 }); },

    // status effects landing (never fired for bosses — see combat.js)
    statusPoison(){ tone(320, { type:'sine', dur:0.09, gain:0.12, sweepTo:220, release:0.1 }); },
    statusStun(){ chord([1200,900], { type:'square', gain:0.1, dur:0.04, release:0.06, stagger:0.05 }); },
    statusFreeze(){ chord([1600,2000,2400], { type:'sine', gain:0.1, dur:0.06, release:0.12, stagger:0.03 }); },
    statusFear(){ tone(180, { type:'sawtooth', dur:0.14, gain:0.12, sweepTo:90, release:0.12 }); },
    statusCharm(){ chord([900,1200], { type:'sine', gain:0.12, dur:0.08, release:0.14, stagger:0.06 }); },

    // rooms / progression
    roomClear(){ chord([523,659,784,1046], { type:'triangle', gain:0.2, dur:0.12, release:0.22, stagger:0.07 }); },
    secretOpen(){ noise({ dur:0.35, gain:0.2, filterFreq:500, filterType:'lowpass', filterSweepTo:150, release:0.3 }); },
    bossIntro(){ chord([110,146,110], { type:'sawtooth', gain:0.22, dur:0.3, release:0.2, stagger:0.14 }); },
    unlock(){ chord([660,880,1100,1320,1600], { type:'triangle', gain:0.18, dur:0.14, release:0.26, stagger:0.06 }); },
    achievement(){
      chord([523,659,784], { type:'triangle', gain:0.2, dur:0.13, release:0.18, stagger:0.08 });
      tone(1046, { type:'sine', gain:0.16, dur:0.2, delay:0.24, release:0.3 });
    },
    descend(){ tone(500, { type:'sine', dur:0.22, gain:0.16, sweepTo:160, release:0.14 }); },
    gameOver(){ chord([392,349,294,220], { type:'sine', gain:0.22, dur:0.28, release:0.3, stagger:0.18 }); },
    winFanfare(){ chord([523,659,784,1046,1318], { type:'triangle', gain:0.22, dur:0.18, release:0.3, stagger:0.11 }); },

    // UI
    uiClick(){ tone(700, { type:'square', dur:0.02, gain:0.1, sweepTo:900, release:0.03 }); },
    uiDeny(){ tone(160, { type:'square', dur:0.08, gain:0.14, release:0.05 }); },
    // Phase 6a overhaul — arcade machine's "fair loss" (see shop.js's
    // updateArcadeMachines) — a soft descending tone, deliberately distinct
    // from uiDeny's flat buzz so a gambled loss doesn't read as "you can't
    // do that".
    machineWhiff(){ tone(500, { type:'sine', dur:0.14, gain:0.14, sweepTo:260, release:0.12 }); },
  };

  function play(name){
    if (muted) return;
    const fn = SFX[name];
    if (!fn) return;
    try { fn(); } catch (e) { /* audio is best-effort; never let it break gameplay */ }
  }

  return { play, unlock, suspend, resume, toggleMute, isMuted, setVolume, getVolume };
})();

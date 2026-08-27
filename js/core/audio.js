'use strict';
/* ============================================================
   audio.js — a synthesized audio engine (Web Audio API).

   There are no sound files anywhere in this project — every
   effect below is generated on the fly. That means nothing to
   download, nothing to license, and nothing to keep in sync with
   asset files. Add a new sound by adding a short function to the
   SFX table at the bottom and calling Sound.play('yourName') from
   wherever it happens.

   Browsers refuse to make sound before a user gesture, so
   Sound.unlock() (safe to call repeatedly) is wired into the
   first real keydown/click handlers in main.js/ui.js.

   Engine expansion pass — four distinct sound-generation FORMS now
   live side by side, each suited to a different kind of effect:
     1. subtractive synthesis  — tone()/noise(): oscillator or
        filtered-noise source shaped by an envelope. The original
        primitives, still the workhorse for punchy/percussive SFX.
     2. FM synthesis           — fm(): one oscillator's frequency
        modulated by another, `index` decaying over the note's life.
        Gives metallic/bell/electric timbres a plain oscillator can't
        reach — see the SFX table's `skillPointGain`/`ascensionChime`.
     3. custom periodic waves  — periodicWave(): arbitrary Fourier
        series fed to createPeriodicWave, selectable as tone()'s
        `type` ('bell'/'organ'/'brass') alongside the 4 built-in
        waveforms. Additive synthesis under the hood, reached through
        the same envelope path as every other tone().
     4. physical modeling      — pluck(): Karplus-Strong plucked
        string (a noise burst recirculated through a tuned delay +
        damping filter). Sounds like a struck/plucked object, which
        no amount of oscillator-shaping reproduces convincingly.
   On top of the four forms, every primitive now shares one output
   stage (routeOut()) offering stereo `pan`, a shared algorithmic
   `reverb` send (ensureReverb() — a generated decaying-noise impulse
   response, no file, fed to a ConvolverNode), and an optional `bus`
   (route through a caller-supplied GainNode instead of straight to
   `master` — see the music engine below) — see "output routing".

   Second engine-expansion pass — two more "instruments" built ON TOP
   of the four forms above (not new forms themselves): bass() (a
   filtered sine+sub-octave pair, tuned for a sustained low end) and
   perc('kick'|'snare'|'hat'|'bonehit', opts) (short percussive hits,
   'bonehit' built from pluck() heavily damped for a struck-bone/
   woodblock character). Plus a full MUSIC SEQUENCER
   (startMusic/stopMusic/MUSIC_TRACKS below) — turns a short repeating
   step pattern into audio using a standard lookahead scheduler
   (schedule slightly ahead of AudioContext.currentTime on a fast JS
   interval, so playback timing doesn't depend on setTimeout accuracy),
   so a "track" is just data (bpm + a few instrument step-arrays), not
   bespoke playback code. `crypt` is the first track, for Stage 0/The
   Crypt (see game.js's startFloor).

   Third engine-expansion pass ("add more instruments... don't use what
   it currently is") — three more instruments, each its own genuinely
   distinct technique rather than a retune of bass()/perc():
     - strings() — UNISON stacking: several real oscillators at the same
       pitch, detuned a few cents apart, summed. The richness comes from
       live phase interference between near-identical oscillators, which
       nothing single-oscillator (even a rich periodicWave) can produce.
     - mallet()  — STRUCK-BAR partials: ~1x/3x/6.4x the fundamental (real
       marimba/xylophone bar ratios, INHARMONIC — impossible to express
       via periodicWave, which is inherently a harmonic series), each
       partial quieter and decaying faster than the last.
     - choir()   — FORMANT noise: a sine fundamental plus narrow bandpass
       slices of the shared noise buffer at ~4x/9x, for an airy, breathy,
       almost-vowel-like texture no combination of clean oscillators can
       reach on their own.
   `MUSIC_TRACKS.crypt`'s melody/pad now use mallet()/strings() instead of
   pluck()/tone(type:'organ') — see the track's own comment for why.
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
    // Bug fix (post-crypt-track feedback: "ear screeching noise") — with
    // several synth voices/reverb sends able to sound at once (the music
    // sequencer especially — 4 parts, some overlapping), their summed
    // amplitude could exceed 0..1 and hit the browser's hard digital clip,
    // which is exactly what reads as harsh/screechy rather than "loud".
    // A limiter (a DynamicsCompressorNode driven hard, near-brickwall
    // settings) sits between `master` and the destination so peaks get
    // squashed smoothly instead of clipping. Every existing SFX still
    // routes through `master` first exactly as before — this is purely a
    // safety net at the very end of the chain, inaudible unless something
    // actually would have clipped.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;  // dB — start limiting well before 0dBFS
    limiter.knee.value = 2;        // narrow knee: closer to a true limiter than a gentle compressor
    limiter.ratio.value = 20;      // steep — anything past the threshold is squashed hard
    limiter.attack.value = 0.003;  // fast enough to catch short percussive transients
    limiter.release.value = 0.15;
    master.connect(limiter);
    limiter.connect(ctx.destination);
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

  /* ---------------- output routing (pan + reverb send) ---------------- */
  // A generated algorithmic reverb — a ConvolverNode fed a 1.6s stereo
  // buffer of white noise shaped by a steep power-curve decay envelope.
  // That decaying-noise buffer IS the impulse response; convolving any
  // sound against it is what a real reverb plugin does with a recorded
  // room, except this "room" is synthesized instead of sampled. Built
  // lazily (needs a real AudioContext) and cached — every voice that
  // wants reverb shares the one ConvolverNode.
  let reverbNode = null;
  function ensureReverb(c){
    if (reverbNode) return reverbNode;
    reverbNode = c.createConvolver();
    const len = Math.floor(c.sampleRate * 1.6);
    const impulse = c.createBuffer(2, len, c.sampleRate);
    // Bug fix ("ear screeching noise" feedback on the Crypt track) — RAW
    // white noise as a convolution impulse response is genuinely harsh: it
    // has equal energy at every frequency including the top of the audible
    // range, so convolving anything against it (especially percussive
    // transients — the pluck/perc hits) smears in a hissy, metallic wash.
    // A real room's reflections lose high frequencies fastest (air/surface
    // absorption), so a believable-sounding algorithmic IR needs the SAME
    // decay-over-time behavior as before but ALSO darkening over time — a
    // simple one-pole lowpass run over the raw noise before the decay
    // envelope is applied, cheap and just needs to happen once at IR-build
    // time, not per voice.
    const lpAlpha = 0.12; // lower = darker; tuned by ear-equivalent judgment, not measurement — revisit if it still reads bright/harsh
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const raw = Math.random() * 2 - 1;
        lp += (raw - lp) * lpAlpha; // one-pole lowpass smoothing — tames the harsh full-band hiss
        data[i] = lp * Math.pow(1 - i / len, 2.2);
      }
    }
    reverbNode.buffer = impulse;
    reverbNode.connect(master);
    return reverbNode;
  }

  // Every synth primitive below (tone/noise/fm/pluck) ends its envelope
  // gain node here instead of connecting to `master` directly — the one
  // place `pan` (StereoPannerNode) and `reverb` (a send into the
  // convolver above, 0..1 wet amount) are applied, so every sound-
  // generation form gets both features for free rather than each
  // primitive re-implementing panning/sends on its own.
  // `opts.bus` (a GainNode) routes the dry signal there instead of straight
  // to `master` — used by the music sequencer below so a whole track can
  // fade in/out as one unit (its bus node's own gain ramp) regardless of
  // how many individual notes are still ringing out, exactly the same
  // trick startAmbient/stopAmbient already use for the menu drone. The
  // reverb send still always feeds the shared convolver straight into
  // `master`, not the bus — its own ~1.6s decay tail is short enough that
  // this is never noticeable, and it means one shared reverb space for
  // absolutely everything rather than a duplicate per bus.
  function routeOut(c, gainNode, opts){
    const pan = opts.pan || 0, reverbAmt = opts.reverb || 0, dest = opts.bus || master;
    let dry = gainNode;
    if (pan && c.createStereoPanner) {
      const p = c.createStereoPanner();
      p.pan.setValueAtTime(Util.clamp(pan, -1, 1), c.currentTime);
      gainNode.connect(p);
      dry = p;
    }
    dry.connect(dest);
    if (reverbAmt > 0) {
      const send = c.createGain();
      // Lowered from 0.6 — feedback on the Crypt track ("ear screeching
      // noise") plus the now-filtered-but-still-diffuse IR above meant the
      // old multiplier let reverb get loud enough to smear into the dry
      // signal instead of sitting behind it.
      send.gain.value = Util.clamp(reverbAmt, 0, 1) * 0.35;
      gainNode.connect(send); // sent pre-pan: reverb is diffuse, doesn't need to track the dry signal's stereo position
      send.connect(ensureReverb(c));
    }
  }

  /* ---------------- custom periodic waves ---------------- */
  // createPeriodicWave lets an oscillator's `type` be an arbitrary Fourier
  // series instead of just sine/square/sawtooth/triangle — additive
  // synthesis, reached through the exact same tone()/envelope path as
  // every built-in waveform. Built lazily and cached (a PeriodicWave is
  // reusable across any number of oscillators).
  const _periodicWaves = {};
  function periodicWave(c, name){
    if (_periodicWaves[name]) return _periodicWaves[name];
    let real, imag;
    if (name === 'bell') {
      // inharmonic partials (not integer multiples of the fundamental) —
      // exactly what makes a bell/glockenspiel sound metallic instead of
      // just "a wavy sine". Amplitudes fall off fast, like a real strike.
      const partials = [1, 2.01, 2.98, 4.2, 5.4, 6.8];
      const amps =     [1, 0.55, 0.35, 0.22, 0.14, 0.09];
      const top = Math.ceil(partials[partials.length - 1]) + 1;
      real = new Float32Array(top + 1); imag = new Float32Array(top + 1);
      partials.forEach((p, i) => { const h = Math.round(p); if (h > 0 && h < imag.length) imag[h] += amps[i]; });
    } else if (name === 'organ') {
      // a harmonic drawbar stack (fundamental, octave, twelfth, two
      // octaves, ...) — classic additive-organ tone, all integer partials
      // so it stays consonant/sustained rather than clangy like 'bell'.
      const harmonics = [1, 2, 3, 4, 6, 8];
      const amps =       [1, 0.5, 0.33, 0.25, 0.15, 0.1];
      real = new Float32Array(9); imag = new Float32Array(9);
      harmonics.forEach((h, i) => { imag[h] = amps[i]; });
    } else if (name === 'brass') {
      // dense odd+even harmonic stack with a gentle rolloff — a buzzy,
      // fanfare-ready timbre a plain sawtooth doesn't quite reach.
      const n = 12;
      real = new Float32Array(n + 1); imag = new Float32Array(n + 1);
      for (let h = 1; h <= n; h++) imag[h] = (1 / h) * (h <= 4 ? 1 : 0.5);
    } else {
      return null;
    }
    const wave = c.createPeriodicWave(real, imag, { disableNormalization: false });
    _periodicWaves[name] = wave;
    return wave;
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

  // a single oscillator with an attack/release envelope, optional pitch
  // sweep. `type` accepts the 4 built-in waveforms plus 'bell'/'organ'/
  // 'brass' (custom periodic waves, see periodicWave() above). `pan`
  // (-1..1) and `reverb` (0..1 wet) are forwarded to routeOut().
  function tone(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      type = 'sine', dur = 0.15, gain = 0.3, attack = 0.005, release = 0.08,
      detune = 0, sweepTo = null, delay = 0, filterFreq = null, filterType = 'lowpass',
      pan = 0, reverb = 0, bus = null, vibrato = 0, vibratoDepth = 0,
    } = opts;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const customWave = periodicWave(c, type);
    if (customWave) osc.setPeriodicWave(customWave); else osc.type = type;
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
    tail.connect(g); routeOut(c, g, { pan, reverb, bus });
    // Pitch vibrato — `vibrato` (Hz, the wobble rate) and `vibratoDepth`
    // (cents) — a dedicated LFO oscillator connected straight into `osc`'s
    // own `detune` AudioParam, the same additive-modulation trick
    // startAmbient already uses for its "breathing" amplitude (see
    // above), just targeting pitch instead of gain. General-purpose: any
    // tone() call can opt into this, not just a specific instrument — see
    // trumpet()/zunpet() below for two that do.
    let lfo = null;
    if (vibrato > 0 && vibratoDepth > 0) {
      lfo = c.createOscillator();
      lfo.frequency.value = vibrato;
      const lfoGain = c.createGain();
      lfoGain.gain.value = vibratoDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      lfo.start(t0);
    }
    osc.start(t0); osc.stop(t0 + dur + release + 0.05);
    if (lfo) lfo.stop(t0 + dur + release + 0.05);
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
      filterSweepTo = null, delay = 0, pan = 0, reverb = 0, bus = null,
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
    src.connect(f); f.connect(g); routeOut(c, g, { pan, reverb, bus });
    src.start(t0, startOffset); src.stop(t0 + dur + release + 0.05);
  }

  // FM synthesis: `carrier`'s frequency is modulated by a second oscillator
  // at `carrierFreq * ratio`, through a modulation-index gain that decays
  // from `index` down to ~1 over the note — the classic FM-bell/electric-
  // piano envelope shape, where the timbre starts bright/complex and
  // settles into something closer to the pure carrier tone. A different
  // synthesis technique from tone()'s subtractive shaping entirely: the
  // timbre comes from the modulation ratio/index, not a waveform or filter.
  function fm(carrierFreq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      ratio = 2, index = 200, dur = 0.25, gain = 0.25, attack = 0.005, release = 0.18,
      delay = 0, pan = 0, reverb = 0, bus = null, carrierType = 'sine',
    } = opts;
    const t0 = c.currentTime + delay;
    const carrier = c.createOscillator();
    carrier.type = carrierType;
    carrier.frequency.setValueAtTime(carrierFreq, t0);
    const modulator = c.createOscillator();
    modulator.frequency.setValueAtTime(carrierFreq * ratio, t0);
    const modGain = c.createGain();
    modGain.gain.setValueAtTime(Math.max(1, index), t0);
    modGain.gain.exponentialRampToValueAtTime(1, t0 + dur); // index decay: bright attack -> plainer tail
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    carrier.connect(g); routeOut(c, g, { pan, reverb, bus });
    carrier.start(t0); carrier.stop(t0 + dur + release + 0.05);
    modulator.start(t0); modulator.stop(t0 + dur + release + 0.05);
  }

  // Karplus-Strong plucked string — physical modeling, a completely
  // different generation technique from every primitive above: a single
  // burst of noise, exactly one period long, is fed once into a delay
  // line tuned to that period; the delay's output is fed back into itself
  // through a lowpass ("damping") filter and a sub-unity gain, so every
  // round trip both darkens (the filter) and quietens (the gain) the
  // signal — which is exactly how a real plucked string decays, brightest
  // and loudest right after the pluck. `decay` (0..1, closer to 1 = longer
  // sustain) and `damping` (the feedback lowpass cutoff — lower = duller,
  // more "muted string") shape the character.
  function pluck(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const { dur = 0.6, gain = 0.3, damping = 2200, decay = 0.988, delay = 0, pan = 0, reverb = 0, bus = null } = opts;
    const t0 = c.currentTime + delay;
    const period = 1 / Math.max(20, freq);
    const burst = c.createBufferSource();
    burst.buffer = noiseBuffer;
    const startOffset = Math.max(0, Math.random() * (noiseBuffer.duration - period - 0.1));
    const burstGain = c.createGain();
    burstGain.gain.setValueAtTime(gain, t0);
    burstGain.gain.setValueAtTime(0, t0 + period); // the excitation lasts exactly one period, like a real pluck
    const dly = c.createDelay(1);
    dly.delayTime.value = period;
    const damp = c.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = damping;
    const fb = c.createGain();
    fb.gain.value = decay;
    const outGain = c.createGain();
    outGain.gain.setValueAtTime(1, t0);
    outGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); // overall envelope on top of the loop's own natural decay
    burst.connect(burstGain);
    burstGain.connect(dly);
    dly.connect(damp);
    damp.connect(fb);
    fb.connect(dly); // the feedback loop — this is what makes it Karplus-Strong
    damp.connect(outGain);
    routeOut(c, outGain, { pan, reverb, bus });
    burst.start(t0, startOffset); burst.stop(t0 + period + 0.02);
    // the feedback loop has no natural stop (only the exponential outGain
    // ramp silences it in practice) — disconnect the loop nodes once the
    // envelope has run out so they don't keep processing audio forever.
    setTimeout(() => { try { dly.disconnect(); damp.disconnect(); fb.disconnect(); outGain.disconnect(); } catch (e) { /* ignore */ } }, (delay + dur) * 1000 + 120);
  }

  /* ---------------- higher-level "instruments" ---------------- */
  // Not new synthesis forms — built entirely from tone()/noise()/pluck()
  // above — but each has its own tuned envelope/layering, so a caller
  // picks a NAME ('bass'/'perc') the way `type:'bell'` already picks a
  // timbre for tone(), rather than re-deriving the layering every time.

  // A sustained low end: a lowpass-filtered sine at `freq` for weight,
  // plus a much quieter sine one octave up so the note still reads as a
  // pitch on small speakers that can't reproduce the fundamental cleanly.
  // Distinct from a plain `tone(freq,{type:'sine'})` in its default
  // envelope (longer attack/release, meant to sit under a melody, not
  // punctuate one) as much as in the layering.
  function bass(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.4, gain = 0.22, attack = 0.015, release = 0.2, delay = 0,
      pan = 0, reverb = 0, bus = null, filterFreq = 320, filterType = 'lowpass',
    } = opts;
    tone(freq, { type:'sine', dur, gain, attack, release, delay, pan, reverb, bus, filterFreq, filterType });
    tone(freq * 2, { type:'sine', dur, gain: gain * 0.22, attack, release, delay, pan, reverb, bus });
  }

  // Short percussive hits, picked by `kind`: 'kick' (a fast downward sine
  // sweep — the same trick a real 808 uses), 'snare' (bandpass noise + a
  // touch of tone body), 'hat' (a tiny highpass noise tick), or 'bonehit'
  // (a heavily-damped, low-pitched pluck() — a dull struck-bone/woodblock
  // knock built from the physical-modeling primitive rather than noise,
  // for the Crypt track's percussion — see MUSIC_TRACKS below. Lowered
  // pitch/damping after "less high pitches" feedback.)
  function perc(kind, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const { gain = 1, delay = 0, pan = 0, reverb = 0, bus = null } = opts;
    if (kind === 'kick') {
      tone(120, { type:'sine', dur:0.08, gain:0.3 * gain, sweepTo:45, release:0.12, delay, pan, reverb, bus });
    } else if (kind === 'snare') {
      noise({ dur:0.06, gain:0.22 * gain, filterFreq:1800, filterType:'bandpass', release:0.08, delay, pan, reverb, bus });
      tone(200, { type:'triangle', dur:0.04, gain:0.08 * gain, release:0.05, delay, pan, bus });
    } else if (kind === 'hat') {
      noise({ dur:0.02, gain:0.12 * gain, filterFreq:7000, filterType:'highpass', release:0.03, delay, pan, reverb, bus });
    } else if (kind === 'bonehit') {
      // Lowered from 1200Hz/damping 900 ("less high pitches" feedback) — a
      // deeper, duller knock instead of a bright clack.
      pluck(700, { dur:0.1, gain:0.18 * gain, damping:550, decay:0.85, delay, pan, reverb, bus });
    }
  }

  // Third engine-expansion pass ("add more instruments... don't use what
  // it currently is") — three more instruments, each a genuinely
  // different technique from bass()/perc() and from each other, not just
  // bass()/pluck() retuned again:

  // UNISON/"supersaw" stacking — `voices` real oscillators at the SAME
  // pitch, each detuned a few cents apart and summed. A real string
  // section is many slightly-out-of-tune players, not one clean tone; a
  // single oscillator (even through a rich periodic wave) can't reproduce
  // that because the richness here comes from PHASE INTERFERENCE between
  // near-identical live oscillators, which only exists with more than one
  // real oscillator running. Distinct from every earlier instrument: not
  // modulation (fm), not feedback (pluck), not a fixed harmonic spectrum
  // (periodicWave) — just detuned unison.
  function strings(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 2, gain = 0.15, attack = 0.4, release = 1, delay = 0,
      pan = 0, reverb = 0, bus = null, voices = 5, detune = 9, type = 'sawtooth',
      filterFreq = 1800, filterType = 'lowpass',
    } = opts;
    const perVoiceGain = gain / Math.sqrt(voices); // keeps total loudness roughly constant as `voices` changes
    for (let i = 0; i < voices; i++) {
      const spread = voices === 1 ? 0 : (i / (voices - 1)) * 2 - 1; // -1..1 across the voices
      tone(freq, { type, dur, gain: perVoiceGain, attack, release, delay, pan, reverb, bus, detune: spread * detune, filterFreq, filterType });
    }
  }

  // STRUCK-BAR partials — unlike a string (harmonic, integer-ratio
  // overtones — see pluck()) a rigid bar's natural resonant modes are
  // INHARMONIC, and each higher partial both quieter AND decays faster
  // than the fundamental (the higher modes lose energy to the air/mallet
  // faster). Approximated here with 3 sine bursts at ~1x/3x/6.4x the
  // fundamental (rounded from real marimba/xylophone bar acoustics), each
  // with its own proportionally-shortened `dur`/`release` — a fast bright
  // "ping" on top of a duller "thonk" that outlasts it. periodicWave()
  // can't express this (a PeriodicWave is inherently a HARMONIC series —
  // only integer multiples of the fundamental are representable at all),
  // which is exactly why this needed its own instrument rather than a
  // fourth `tone()` timbre.
  const MALLET_PARTIALS = [ { ratio:1, gain:1, decayMul:1 }, { ratio:3.0, gain:0.35, decayMul:0.55 }, { ratio:6.4, gain:0.12, decayMul:0.32 } ];
  function mallet(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.5, gain = 0.22, attack = 0.002, release = 0.4, delay = 0,
      pan = 0, reverb = 0, bus = null, filterFreq = null, filterType = 'lowpass',
    } = opts;
    for (const p of MALLET_PARTIALS) {
      tone(freq * p.ratio, {
        type:'sine', dur: dur * p.decayMul, gain: gain * p.gain, attack, release: release * p.decayMul,
        delay, pan, reverb, bus, filterFreq, filterType,
      });
    }
  }

  // FORMANT-ish vocal pad — a plain sine fundamental plus two narrow
  // bandpass slices of the shared noise buffer, tuned as rough "formants"
  // relative to `freq` (~4x and ~9x). Noise carved by a narrow filter is
  // what gives this an airy, breathy, almost-vowel-like color that no
  // combination of clean oscillators (strings/mallet/periodicWave) can
  // reach — the texture comes from filtered noise, not from any pitched
  // source at all beyond the one sine anchoring the fundamental.
  function choir(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const { dur = 2, gain = 0.12, attack = 0.5, release = 1.2, delay = 0, pan = 0, reverb = 0, bus = null } = opts;
    tone(freq, { type:'sine', dur, gain: gain * 0.6, attack, release, delay, pan, reverb, bus });
    noise({ dur, gain: gain * 0.5, attack, release, filterFreq: freq * 4, filterType:'bandpass', filterQ:6, delay, pan, reverb, bus });
    noise({ dur, gain: gain * 0.3, attack, release, filterFreq: freq * 9, filterType:'bandpass', filterQ:8, delay, pan, reverb, bus });
  }

  // Fourth engine-expansion pass ("piano, trumpet, and zunpet") — three
  // more instruments, each combining an earlier technique with a
  // distinctive ATTACK TRANSIENT, since a percussive/breathy/buzzy onset
  // is what makes a struck or blown instrument recognizable — the
  // sustained body alone is rarely enough (compare mallet(), which is
  // built entirely from its attack/decay shape with no sustain at all).

  // PIANO — a struck string: a very short filtered-noise "hammer" click at
  // onset (impossible from a pitched oscillator alone), then a near-
  // instant-attack, long-tail body of 3 harmonically-related layers (the
  // fundamental plus a quiet octave and a faintly quieter 2-octaves-up
  // shimmer, each decaying faster than the one below it — real piano
  // strings lose their higher partials fastest too). Distinct from bass()
  // (long swelling attack, meant to sit UNDER a melody) in envelope shape
  // as much as in the hammer click.
  function piano(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 1.2, gain = 0.2, release = 1.0, delay = 0,
      pan = 0, reverb = 0, bus = null, filterFreq = 3200, filterType = 'lowpass',
    } = opts;
    noise({ dur:0.008, gain: gain * 0.35, attack:0.001, release:0.01, filterFreq:2500, filterType:'bandpass', delay, pan, bus });
    tone(freq, { type:'triangle', dur, gain, attack:0.004, release, delay, pan, reverb, bus, filterFreq, filterType });
    tone(freq * 2, { type:'sine', dur: dur * 0.6, gain: gain * 0.18, attack:0.004, release: release * 0.6, delay, pan, reverb, bus });
    tone(freq * 4, { type:'sine', dur: dur * 0.3, gain: gain * 0.06, attack:0.002, release: release * 0.3, delay, pan, bus });
  }

  // TRUMPET — a blown brass note: a short buzzy "chiff" (narrow-bandpass
  // noise around the fundamental, simulating the lips' initial buzz
  // before the horn's resonance settles — real brass has an audible onset
  // texture a clean oscillator never has on its own), a very brief pitch
  // "scoop" sliding up into the target note (the lip-slur articulation a
  // trumpet player's embouchure makes — reuses tone()'s `sweepTo`, no
  // dedicated technique needed), then the sustained body: the 'brass'
  // periodic wave with real per-note pitch vibrato via tone()'s new
  // `vibrato`/`vibratoDepth` option (the same LFO-into-detune trick the
  // menu ambient drone uses for its amplitude "breathing," here reaching a
  // per-note pitch wobble instead).
  function trumpet(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.5, gain = 0.2, attack = 0.03, release = 0.15, delay = 0,
      pan = 0, reverb = 0, bus = null, vibrato = 5.5, vibratoDepth = 8,
    } = opts;
    noise({ dur:0.02, gain: gain * 0.22, attack:0.001, release:0.02, filterFreq: freq * 2, filterType:'bandpass', filterQ:4, delay, pan, bus });
    tone(freq * 0.92, { type:'brass', dur:0.05, gain: gain * 0.6, attack:0.005, sweepTo: freq, release:0.02, delay, pan, bus });
    tone(freq, { type:'brass', dur, gain, attack, release, delay: delay + 0.03, pan, reverb, bus, vibrato, vibratoDepth });
  }

  // ZUNPET — not modeled on any real instrument. An invented, deliberately
  // goofy voice: FM synthesis at an unusually low modulation ratio (0.5,
  // vs. fm()'s own default of 2) gives it a reedy, nasal "kazoo/duck-call"
  // quality, layered with a fast, wide pitch-vibrato square-wave voice on
  // top (tone()'s vibrato again, pushed hard — 14Hz/40 cents, a wobble
  // fast and deep enough to read as comic rather than musical). For
  // flavor/comic-relief cues, not "real" instrumentation.
  function zunpet(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const { dur = 0.3, gain = 0.18, delay = 0, pan = 0, reverb = 0, bus = null } = opts;
    fm(freq, { ratio:0.5, index:340, dur, gain, attack:0.008, release:0.12, delay, pan, reverb, bus, carrierType:'square' });
    tone(freq * 1.01, { type:'square', dur: dur * 0.8, gain: gain * 0.35, attack:0.01, release:0.1, delay, pan, bus, vibrato:14, vibratoDepth:40 });
  }

  // BANJO — a bright, short-sustain plucked string: a quick highpass-noise
  // "pick" transient right at onset (simulating a plectrum/fingerpick
  // striking a metal string — brighter and snappier than piano()'s duller,
  // lower hammer click), then the string itself via pluck() (Karplus-
  // Strong physical modeling, same primitive the melodic instruments
  // already use) tuned brighter and faster-decaying than any earlier use
  // of it — a banjo's whole character is a short, ringing, metallic
  // "plink" rather than a sustained tone. Reuses two existing techniques
  // (subtractive noise + physical modeling) combined with a distinct
  // attack/decay signature, the same composition pattern piano()/
  // trumpet() already use.
  function banjo(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.35, gain = 0.2, damping = 3200, decay = 0.93, delay = 0,
      pan = 0, reverb = 0, bus = null,
    } = opts;
    noise({ dur:0.006, gain: gain * 0.3, attack:0.001, release:0.008, filterFreq:4500, filterType:'highpass', delay, pan, bus });
    pluck(freq, { dur, gain, damping, decay, delay, pan, reverb, bus });
  }

  // GROWL — a gritty, aggressive lead for The Inferno. Introduces
  // waveshaping distortion, a synthesis technique nothing above uses yet
  // (subtractive tone()/noise(), FM fm(), physical-modeling pluck(), and
  // choir()'s formant-filtered noise are all spectrally "clean" by
  // comparison): a detuned two-oscillator sawtooth stack is driven through
  // a WaveShaperNode with a fixed soft-clip curve (tanh-shaped, `k`
  // controls how hard it clips), which adds odd harmonics the way an
  // overdriven amp does — the same "push a clean signal into nonlinear
  // saturation" idea real distortion pedals use, just built from a curve
  // array instead of analog circuitry. A lowpass filter after the
  // waveshaper tames the extra harmonics down to "gritty" rather than
  // "harsh white noise" (the same lesson the reverb IR fix taught: raw
  // high-harmonic content reads as ear-screeching, filtered content reads
  // as texture). Kept low-register and filtered dark by default in line
  // with the project's "less on the high pitches" standing feedback.
  function distortionCurve(amount){
    const k = amount, n = 256, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); // soft-clip, cheaper than tanh
    }
    return curve;
  }
  function growl(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.3, gain = 0.16, attack = 0.01, release = 0.12, delay = 0,
      drive = 6, filterFreq = 1400, detuneCents = 9,
      pan = 0, reverb = 0, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    const shaper = c.createWaveShaper();
    shaper.curve = distortionCurve(drive);
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.setValueAtTime(filterFreq, t0);
    shaper.connect(filt);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    filt.connect(g); routeOut(c, g, { pan, reverb, bus });
    const stopAt = t0 + dur + release + 0.05;
    for (const det of [-detuneCents, detuneCents]) {
      const osc = c.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t0);
      osc.detune.setValueAtTime(det, t0);
      osc.connect(shaper);
      osc.start(t0); osc.stop(stopAt);
    }
  }

  // STAB — a dramatic percussive chord hit for Boss Room's redo. Three
  // detuned sawtooth oscillators (root, fifth, octave — a "power chord")
  // share ONE waveshaper distortion stage (`distortionCurve`, same helper
  // growl() uses) rather than growl's single melodic voice, plus a sharp
  // highpass-noise crash transient at onset — a horror-movie-stinger hit
  // for downbeat accents, not a sustained lead.
  function stab(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.25, gain = 0.18, delay = 0, drive = 8, filterFreq = 2200,
      pan = 0, reverb = 0.12, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    noise({ dur:0.03, gain: gain * 0.5, attack:0.001, release:0.05, filterFreq:5000, filterType:'highpass', delay, pan, bus });
    const shaper = c.createWaveShaper();
    shaper.curve = distortionCurve(drive);
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.setValueAtTime(filterFreq, t0);
    shaper.connect(filt);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.15);
    filt.connect(g); routeOut(c, g, { pan, reverb, bus });
    const stopAt = t0 + dur + 0.2;
    for (const ratio of [1, 1.5, 2]) {
      const osc = c.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * ratio, t0);
      osc.connect(shaper);
      osc.start(t0); osc.stop(stopAt);
    }
  }

  // ICECHIME — a bright, slowly-shimmering bell for The Frozen Desert.
  // Two sine partials at an inharmonic ratio (1 and ~2.4, the same "not a
  // clean overtone" idea mallet()'s MALLET_PARTIALS uses for a struck bar,
  // just two voices instead of three and pitched much higher/longer) give
  // it a glassy, non-vocal character, and a slow tremolo LFO on the output
  // gain (amplitude modulation, distinct from every vibrato use above,
  // which all modulate pitch/detune instead) makes it shimmer/waver like
  // light through ice rather than just ringing flat. A short breathy
  // highpass-noise transient stands in for the "wind" at onset.
  function icechime(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 1.1, gain = 0.14, attack = 0.01, release = 1.4, delay = 0,
      tremolo = 4.5, tremoloDepth = 0.35,
      pan = 0, reverb = 0.2, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    noise({ dur:0.03, gain: gain * 0.25, attack:0.002, release:0.05, filterFreq:6000, filterType:'highpass', delay, pan, bus });
    const out = c.createGain();
    out.gain.setValueAtTime(1, t0); // tremolo LFO rides on top of this; partial envelopes below stay separate
    routeOut(c, out, { pan, reverb, bus });
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(tremolo, t0);
    const lfoGain = c.createGain();
    lfoGain.gain.value = tremoloDepth;
    lfo.connect(lfoGain); lfoGain.connect(out.gain);
    lfo.start(t0); lfo.stop(t0 + dur + release + 0.05);
    const partials = [{ ratio:1, g:1 }, { ratio:2.4, g:0.3 }];
    for (const p of partials) {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * p.ratio, t0);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain * p.g, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
      osc.connect(g); g.connect(out);
      osc.start(t0); osc.stop(t0 + dur + release + 0.05);
    }
  }

  // HARMONICA — a reedy, dusty voice for The Badlands. Two square-wave
  // tone() voices a fraction apart in pitch (one bent up from just below
  // the target note via `sweepTo`, standing in for a harmonica's
  // characteristic blues "draw bend"; the other held flat but detuned a
  // few cents sharp) beat gently against each other through a shared
  // bandpass filter — the same close-detune-beating idea strings() uses
  // for its unison pad, just two voices instead of a stack, and paired
  // with the bend rather than a static wash. A short bandpass-noise
  // "breath chiff" stands in for the reed catching air at onset.
  function harmonica(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.4, gain = 0.16, attack = 0.02, release = 0.15, delay = 0,
      detuneCents = 12, filterFreq = null,
      pan = 0, reverb = 0, bus = null,
    } = opts;
    const bandpass = filterFreq || freq * 2.2;
    noise({ dur:0.015, gain: gain * 0.2, attack:0.001, release:0.02, filterFreq: freq * 1.5, filterType:'bandpass', filterQ:3, delay, pan, bus });
    tone(freq * 0.985, { type:'square', dur, gain: gain * 0.55, attack, release, sweepTo: freq, delay, pan, reverb, bus, filterFreq: bandpass, filterType:'bandpass' });
    tone(freq, { type:'square', dur, gain: gain * 0.5, attack, release, delay, pan, reverb, bus, filterFreq: bandpass, filterType:'bandpass', detune: detuneCents });
  }

  // FLUTE — a breezy, airy voice for The Beach. A pure sine tone() (light
  // pitch vibrato) layered over a bandpass-filtered noise() bed running
  // the SAME full note length rather than a short attack transient — every
  // other instrument above uses noise() as a percussive click/chiff at
  // onset only; here it's a continuous textural "breath" layer under the
  // pitched tone for the whole note, the actual airy component of a real
  // flute's sound. A new use of an existing primitive rather than a new
  // primitive itself.
  function flute(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.5, gain = 0.16, attack = 0.05, release = 0.25, delay = 0,
      vibrato = 4.5, vibratoDepth = 6, breath = 0.35,
      pan = 0, reverb = 0, bus = null,
    } = opts;
    noise({ dur, gain: gain * breath, attack, release, filterFreq: freq * 1.6, filterType:'bandpass', filterQ:1.2, delay, pan, bus });
    tone(freq, { type:'sine', dur, gain, attack, release, delay, pan, reverb, bus, vibrato, vibratoDepth });
  }

  // WHALECALL — a long, drifting cry for The Ocean. A sine tone() glides
  // continuously from `freq` up to `glideTo` across the ENTIRE note (via
  // tone()'s own `sweepTo`, but stretched over a long `dur`/slow `attack`/
  // `release` "call" envelope rather than a quick grace-note flourish the
  // way trumpet() uses it) with gentle vibrato riding on top, plus a
  // handful of short bandpass-noise "bubbles" scattered at random delays
  // across the note — the first instrument here to fire several
  // independently-timed noise bursts from a single call rather than one
  // fixed attack transient.
  function whalecall(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 1.6, gain = 0.13, attack = 0.3, release = 0.6, delay = 0,
      glideTo = null, vibrato = 3, vibratoDepth = 15, bubbles = 2,
      pan = 0, reverb = 0.25, bus = null,
    } = opts;
    const target = glideTo || freq * 1.15;
    tone(freq, { type:'sine', dur, gain, attack, release, delay, pan, reverb, bus, sweepTo: target, vibrato, vibratoDepth });
    for (let i = 0; i < bubbles; i++) {
      const bd = delay + Util.rand(0.1, Math.max(0.15, dur * 0.7));
      noise({ dur:0.03, gain: gain * 0.15, attack:0.002, release:0.04, filterFreq: Util.rand(1800, 3200), filterType:'bandpass', filterQ:5, delay: bd, pan, bus });
    }
  }

  // GONG — a deep, swelling, metallic resonance for The Sea Floor.
  // Several inharmonic sine partials (like mallet()'s struck-bar model,
  // but more of them and much longer) each pass through their OWN
  // lowpass filter that slowly closes across the whole decay — a
  // per-note filter automation nothing above uses (mallet's filterFreq is
  // static) — so the strike loses its shimmer and darkens as it rings
  // out, standing in for sound swallowed by pressure and depth. A soft
  // bandpass-noise strike transient at onset.
  const GONG_PARTIALS = [
    { ratio:1, gain:1 }, { ratio:1.8, gain:0.4 }, { ratio:2.75, gain:0.22 }, { ratio:3.4, gain:0.12 },
  ];
  function gong(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 2.2, gain = 0.12, attack = 0.05, release = 2.5, delay = 0,
      damping = 1600, pan = 0, reverb = 0.3, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    const stopAt = t0 + dur + release + 0.05;
    noise({ dur:0.04, gain: gain * 0.3, attack:0.001, release:0.05, filterFreq: freq * 3, filterType:'bandpass', delay, pan, bus });
    for (const p of GONG_PARTIALS) {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * p.ratio, t0);
      const filt = c.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(damping, t0);
      filt.frequency.exponentialRampToValueAtTime(Math.max(200, damping * 0.3), t0 + dur + release);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain * p.gain, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
      osc.connect(filt); filt.connect(g); routeOut(c, g, { pan, reverb, bus });
      osc.start(t0); osc.stop(stopAt);
    }
  }

  // SONARPING — a fading echo-blip for The Trench. A downward-settling
  // sine ping feeds a real feedback DELAY LINE (a `DelayNode` whose output
  // both reaches the mix and feeds back into its own input through a
  // sub-unity gain) rather than the shared convolution reverb everything
  // else uses — a genuine discrete echo train (ping...ping...ping,
  // decaying) instead of a diffuse wash. `ensureReverb`'s convolver is
  // still available via `reverb` on top for extra distance-blur.
  function sonarping(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.15, gain = 0.16, attack = 0.005, release = 0.3, delay = 0,
      echoTime = 0.28, feedback = 0.42, echoes = 4,
      pan = 0, reverb = 0, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq * 0.6), t0 + dur + release);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    osc.connect(g);
    const echoDelay = c.createDelay(1);
    echoDelay.delayTime.setValueAtTime(echoTime, t0);
    const fbGain = c.createGain();
    fbGain.gain.setValueAtTime(feedback, t0);
    g.connect(echoDelay);
    echoDelay.connect(fbGain);
    fbGain.connect(echoDelay); // feedback loop — each pass round trip is quieter, giving a natural decaying echo train
    routeOut(c, g, { pan, reverb, bus });
    routeOut(c, echoDelay, { pan, reverb, bus });
    osc.start(t0); osc.stop(t0 + dur + release + echoTime * echoes + 0.1);
  }

  // RINGMOD — an eerie, metallic, unstable tone for The Trench Depths.
  // TRUE audio-rate ring modulation: a carrier oscillator connects into a
  // GainNode's audio input while a second, independent modulator
  // oscillator connects into that SAME GainNode's `gain` AudioParam (base
  // value 0) — since a GainNode's output is literally `input * gain(t)`,
  // and the modulator is the only thing driving `gain(t)`, the output is
  // the two waveforms multiplied together sample-for-sample, not summed.
  // This is a different mechanism from every earlier "connect an LFO into
  // a param" trick in the file (tone()'s vibrato/icechime's tremolo both
  // ADD an oscillator's value onto an existing param) — here the base
  // gain is zero, so it's pure multiplication, which is what produces
  // ring modulation's inharmonic, robotic sidebands instead of a smooth
  // wobble.
  function ringmod(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.5, gain = 0.14, attack = 0.02, release = 0.6, delay = 0,
      modRatio = 1.4, pan = 0, reverb = 0, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    const carrier = c.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(freq, t0);
    const ring = c.createGain();
    ring.gain.setValueAtTime(0, t0);
    carrier.connect(ring);
    const modulator = c.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(freq * modRatio, t0);
    modulator.connect(ring.gain);
    const env = c.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    ring.connect(env);
    routeOut(c, env, { pan, reverb, bus });
    const stopAt = t0 + dur + release + 0.05;
    carrier.start(t0); carrier.stop(stopAt);
    modulator.start(t0); modulator.stop(stopAt);
  }

  // VOIDHUM — a directionless, pressurized hum for The Deep Dark.
  // GRANULAR synthesis: a long, barely-audible sine anchor at `freq`,
  // beneath a cloud of many (`grains`) very short, quiet, randomly-
  // delayed and randomly-detuned-and-panned noise bursts scattered across
  // the note's whole length — a genuinely different texture-generation
  // idea from any earlier instrument, all of which fire noise() as one
  // deliberate transient/bed rather than dozens of independent
  // scattered grains.
  function voidhum(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 3, gain = 0.05, delay = 0, grains = 14,
      pan = 0, reverb = 0.3, bus = null,
    } = opts;
    tone(freq, { type:'sine', dur, gain: gain * 1.4, attack: dur * 0.4, release: dur * 0.5, delay, pan, reverb, bus });
    for (let i = 0; i < grains; i++) {
      const gd = delay + Util.rand(0, dur);
      noise({ dur:0.05, gain: gain * 0.4, attack:0.01, release:0.08, filterFreq: freq * Util.rand(0.5, 2), filterType:'bandpass', filterQ:6, delay: gd, pan: Util.clamp(pan + Util.rand(-0.2, 0.2), -1, 1), bus });
    }
  }

  // GLITCH — a jittery, digital voice for The Meta Realm. Where every
  // instrument above plays exactly one note per call, this schedules a
  // SELF-CONTAINED internal micro-sequence: `steps` short square blips
  // fired `stepGap` seconds apart from within a single call, each one
  // freq*ratio for a plain, still-consonant interval (unison/fifth/
  // octave, from `ratios`) — a chiptune-style stutter/arpeggio baked
  // into the instrument itself rather than something the caller has to
  // build out of separate step-array entries. Deliberately reads as
  // "outside the game's own fiction" through jittery RHYTHM, never
  // through the pitch content, which stays as plain as everything else.
  function glitch(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.06, gain = 0.14, delay = 0, steps = 4, stepGap = 0.045,
      ratios = [1, 1.5, 2, 1], pan = 0, reverb = 0.15, bus = null,
    } = opts;
    for (let i = 0; i < steps; i++) {
      const r = ratios[i % ratios.length];
      tone(freq * r, { type:'square', dur, gain: gain * (0.5 + 0.5 * Math.random()), attack:0.002, release:0.03, delay: delay + i * stepGap, pan, reverb, bus });
    }
  }

  // WARPSYNTH — a rising, opening lead for Hyperspace. A sawtooth
  // oscillator's pitch rises continuously from `freq` to `riseTo`
  // (default an octave up) across the whole note, WHILE a lowpass filter
  // opens upward alongside it (`filterFrom` → `filterTo`) — the exact
  // mirror image of gong()'s filter, which slowly CLOSES across a note's
  // decay; here it OPENS across a note's rise, for an uplifting sci-fi
  // "warp" sweep rather than a darkening resonance.
  function warpsynth(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 1.2, gain = 0.14, attack = 0.05, release = 0.5, delay = 0,
      riseTo = null, filterFrom = 300, filterTo = 4000,
      pan = 0, reverb = 0.2, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    const target = riseTo || freq * 2;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, target), t0 + dur);
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(filterFrom, t0);
    filt.frequency.exponentialRampToValueAtTime(Math.max(200, filterTo), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    osc.connect(filt); filt.connect(g); routeOut(c, g, { pan, reverb, bus });
    osc.start(t0); osc.stop(t0 + dur + release + 0.05);
  }

  // DRIP — a single water droplet for The Gutters (C-branch). A sharp
  // downward pitch chirp (a real drop's falling-pitch "plink") feeds a
  // short delay line whose OWN delayTime is continuously modulated by an
  // LFO — CHORUS, a new modulation target: every earlier modulated-param
  // instrument targets detune (vibrato), gain (tremolo/ring-mod), or
  // filter frequency (auto-wah/sweeps); this is the first to modulate a
  // DelayNode's `delayTime` itself, which makes the echoed tap constantly
  // slide in and out of phase with the dry signal — a subtly shifting,
  // doubled "wet echo off stone" rather than sonarping()'s clean discrete
  // repeats or a flat blend.
  function drip(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.12, gain = 0.15, delay = 0,
      chorusRate = 5, chorusDepth = 0.004, chorusBase = 0.012,
      pan = 0, reverb = 0.2, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.4, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq * 0.5), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.25);
    osc.connect(g);
    const chorusDelay = c.createDelay(1);
    chorusDelay.delayTime.setValueAtTime(chorusBase, t0);
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(chorusRate, t0);
    const lfoGain = c.createGain();
    lfoGain.gain.value = chorusDepth;
    lfo.connect(lfoGain); lfoGain.connect(chorusDelay.delayTime);
    g.connect(chorusDelay);
    routeOut(c, g, { pan, reverb, bus });
    routeOut(c, chorusDelay, { pan, reverb, bus });
    const stopAt = t0 + dur + 0.3;
    osc.start(t0); osc.stop(stopAt);
    lfo.start(t0); lfo.stop(stopAt);
  }

  // SLUDGE — a murky, sickly voice for The Sewers (C-branch). A sawtooth
  // through a high-Q bandpass filter, with a second LFO continuously
  // pushing the filter's center frequency back and forth (an "auto-wah")
  // rather than sweeping it one-directionally like gong()'s closing decay
  // or warpsynth()'s opening rise — the filter oscillates for as long as
  // the note rings, giving a queasy, unstable color instead of a settled
  // trajectory.
  function sludge(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.4, gain = 0.15, attack = 0.02, release = 0.3, delay = 0,
      wahRate = 3.2, wahDepth = 500, filterBase = 900,
      pan = 0, reverb = 0.1, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t0);
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass'; filt.Q.value = 6;
    filt.frequency.setValueAtTime(filterBase, t0);
    const wah = c.createOscillator();
    wah.type = 'sine';
    wah.frequency.setValueAtTime(wahRate, t0);
    const wahGain = c.createGain();
    wahGain.gain.value = wahDepth;
    wah.connect(wahGain); wahGain.connect(filt.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    osc.connect(filt); filt.connect(g); routeOut(c, g, { pan, reverb, bus });
    const stopAt = t0 + dur + release + 0.05;
    osc.start(t0); osc.stop(stopAt);
    wah.start(t0); wah.stop(stopAt);
  }

  // BIRDCALL — a bright chirping trill for The Rainforest (C-branch). A
  // sine's pitch swoops UP then back DOWN across the note — a "V"-shaped
  // contour built from two chained ramps, a new envelope shape (every
  // earlier pitch move in the file — sweepTo, warpsynth's rise, gong's
  // decay filter — is a single directional ramp) — with a fast, deep
  // vibrato (`trill`, defaulting well above every other instrument's
  // vibrato rate) riding on top for the actual chirp/trill texture.
  function birdcall(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.12, gain = 0.13, delay = 0,
      peakMul = 1.6, trill = 22, trillDepth = 60,
      pan = 0, reverb = 0.25, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(freq * peakMul, t0 + dur * 0.4);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq * 0.9), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.08);
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(trill, t0);
    const lfoGain = c.createGain();
    lfoGain.gain.value = trillDepth;
    lfo.connect(lfoGain); lfoGain.connect(osc.detune);
    osc.connect(g); routeOut(c, g, { pan, reverb, bus });
    const stopAt = t0 + dur + 0.15;
    osc.start(t0); osc.stop(stopAt);
    lfo.start(t0); lfo.stop(stopAt);
  }

  // CREAK — a groaning, resonant wood/rope sound for The Mangroves
  // (C-branch). A high-Q bandpass filter sweeps slowly across a slice of
  // the shared NOISE buffer rather than an oscillator — every earlier
  // filter sweep (gong's close, warpsynth's open) shapes a pitched tone;
  // sweeping a narrow resonance across broadband noise instead is what
  // gives this its groaning, non-pitched creak rather than a clean glide.
  function creak(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 0.6, gain = 0.14, delay = 0,
      filterFrom = null, filterTo = null, filterQ = 12,
      pan = 0, reverb = 0.2, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    const from = filterFrom || freq * 0.8;
    const to = filterTo || freq * 1.6;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const startOffset = Math.max(0, Math.random() * (noiseBuffer.duration - dur - 0.1));
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass'; filt.Q.value = filterQ;
    filt.frequency.setValueAtTime(from, t0);
    filt.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.3);
    src.connect(filt); filt.connect(g); routeOut(c, g, { pan, reverb, bus });
    src.start(t0, startOffset); src.stop(t0 + dur + 0.35);
  }

  // STARDUST — shimmering starlight for the D-branch's Observatory. A
  // quiet sine anchor at `freq`, beneath a cluster of `twinkles` short,
  // quiet, randomly-timed sine grains at HARMONIC ratios of `freq` (2x,
  // 3x, 4x...) — consonant overtones, unlike voidhum()'s inharmonic-
  // filtered NOISE grains — scattered across the note, standing in for
  // starlight twinkling through a cracked observatory lens.
  function stardust(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 1.5, gain = 0.05, delay = 0, twinkles = 10, ratios = [2, 3, 4, 5, 6],
      pan = 0, reverb = 0.3, bus = null,
    } = opts;
    tone(freq, { type:'sine', dur, gain: gain * 1.2, attack: dur * 0.3, release: dur * 0.5, delay, pan, reverb, bus });
    for (let i = 0; i < twinkles; i++) {
      const r = ratios[Math.floor(Util.rand(0, ratios.length))];
      const td = delay + Util.rand(0, dur * 0.8);
      tone(freq * r, { type:'sine', dur:0.04, gain: gain * 0.5, attack:0.005, release:0.1, delay: td, pan: Util.clamp(pan + Util.rand(-0.15, 0.15), -1, 1), bus });
    }
  }

  // CLOCKWORK — ticking brass gears for the D-branch's Orrery. A
  // self-contained click train (like glitch()'s internal micro-sequence,
  // but shaped differently): `ticks` short bandpass-noise clicks whose
  // inter-tick GAP shrinks geometrically each repeat (`gapRatio` < 1) — a
  // winding-down mechanical accelerando rather than glitch()'s fixed
  // interval — under a soft triangle "chime" body standing in for the
  // gear assembly's resonance.
  function clockwork(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      gain = 0.13, delay = 0, ticks = 5, startGap = 0.09, gapRatio = 0.7,
      filterFreq = null, pan = 0, reverb = 0.12, bus = null,
    } = opts;
    const ff = filterFreq || freq * 3;
    let t = delay, gap = startGap;
    for (let i = 0; i < ticks; i++) {
      noise({ dur:0.01, gain: gain * (1 - (i / ticks) * 0.4), attack:0.001, release:0.02, filterFreq: ff, filterType:'bandpass', filterQ:8, delay: t, pan, reverb, bus });
      t += gap;
      gap *= gapRatio;
    }
    tone(freq, { type:'triangle', dur:0.15, gain: gain * 0.5, attack:0.005, release:0.3, delay, pan, reverb, bus });
  }

  // DRIFT — a cold, isolated tone for the D-branch's Void Between. A long
  // sine held under a `StereoPannerNode` whose `pan` is continuously
  // driven by an LFO — a slow left-right drift across the whole note.
  // Every other instrument's stereo position is a single fixed value
  // (routeOut's own `pan` option); this is the first to modulate pan
  // over time, standing in for something adrift with no fixed position
  // at all. Built with its own routing (not routeOut) since routeOut's
  // panner is always static.
  function drift(freq, opts = {}){
    const c = ensureCtx(); if (!c) return;
    const {
      dur = 4, gain = 0.04, attack = 1.5, release = 2, delay = 0,
      panRate = 0.15, panDepth = 0.6, reverb = 0.35, bus = null,
    } = opts;
    const t0 = c.currentTime + delay;
    const dest = bus || master;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    osc.connect(g);
    const panner = c.createStereoPanner();
    panner.pan.setValueAtTime(0, t0);
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(panRate, t0);
    const lfoGain = c.createGain();
    lfoGain.gain.value = panDepth;
    lfo.connect(lfoGain); lfoGain.connect(panner.pan);
    g.connect(panner); panner.connect(dest);
    if (reverb > 0) {
      const send = c.createGain();
      send.gain.value = Util.clamp(reverb, 0, 1) * 0.35;
      g.connect(send);
      send.connect(ensureReverb(c));
    }
    const stopAt = t0 + dur + release + 0.05;
    osc.start(t0); osc.stop(stopAt);
    lfo.start(t0); lfo.stop(stopAt);
  }

  /* ---------------- ambient main-menu drone ---------------- */
  // A very quiet sustained pad — a root + fifth + soft octave, slowly
  // "breathing" via an LFO modulating the whole thing's gain — rather than
  // a one-shot effect. Routed through `master` exactly like every SFX
  // above, so the mute button and volume slider affect it identically; no
  // separate volume control needed. Idempotent: calling startAmbient()
  // again while already running is a no-op, so main.js's call sites (main
  // menu open) don't need to track their own "is it already going" state.
  let ambient = null;
  function startAmbient(){
    const c = ensureCtx(); if (!c || ambient) return;
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 900; // keeps it soft/distant, no harsh upper harmonics
    filt.connect(master);

    const ambGain = c.createGain();
    ambGain.gain.setValueAtTime(0, c.currentTime);
    ambGain.gain.linearRampToValueAtTime(0.07, c.currentTime + 3); // slow fade-in, never a hard start
    ambGain.connect(filt);

    // root / perfect-fifth / soft octave — a plain, consonant pad, not a
    // melody; the point is texture, not something a player would hum
    const ROOT = 55; // A1
    const voices = [
      { type: 'sine', freq: ROOT, gain: 0.5 },
      { type: 'sine', freq: ROOT * 1.5, gain: 0.3 },
      { type: 'triangle', freq: ROOT * 2, gain: 0.15 },
    ];
    const nodes = [];
    for (const v of voices) {
      const osc = c.createOscillator();
      osc.type = v.type;
      osc.frequency.value = v.freq;
      const g = c.createGain();
      g.gain.value = v.gain;
      osc.connect(g); g.connect(ambGain);
      osc.start();
      nodes.push(osc);
    }
    // slow LFO "breathing" the pad's overall amplitude — connecting an
    // oscillator straight into another node's AudioParam continuously adds
    // its oscillating value on top of whatever that param is already
    // scheduled to (here, the fade-in ramp above), so the breathing rides
    // naturally on top of the fade-in instead of fighting it.
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.06; // ~16.7s per breath
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.02; // modulation depth
    lfo.connect(lfoGain);
    lfoGain.connect(ambGain.gain);
    lfo.start();
    nodes.push(lfo);

    ambient = { ambGain, nodes };
  }
  function stopAmbient(){
    if (!ambient || !ctx) return;
    const { ambGain, nodes } = ambient;
    const t = ctx.currentTime;
    ambGain.gain.cancelScheduledValues(t);
    ambGain.gain.setValueAtTime(ambGain.gain.value, t);
    ambGain.gain.linearRampToValueAtTime(0, t + 1.2); // fade out, never a hard cut
    setTimeout(() => { for (const n of nodes) { try { n.stop(); } catch (e) { /* ignore */ } } }, 1300);
    ambient = null;
  }

  /* ---------------- music sequencer ---------------- */
  // Turns a short repeating step pattern into audio using the same
  // tone()/noise()/fm()/pluck()/bass()/perc() primitives as every SFX
  // above — a "track" is just DATA (bpm + a handful of per-instrument
  // step arrays), not bespoke playback code, so a second track is just a
  // second MUSIC_TRACKS entry.
  //
  // Uses the standard "lookahead" scheduler pattern (schedule audio events
  // a fixed window ahead of AudioContext.currentTime on a fast-but-sloppy
  // JS interval, rather than trying to setTimeout each individual note):
  // the JS timer only decides WHEN to schedule, never WHEN to actually
  // sound — every note's real trigger time is an exact AudioContext
  // timestamp handed to the primitive's own `delay`, so playback stays
  // sample-accurate regardless of any timer jitter. See scheduleMusicTick.

  // helper: a sparse step array of length `len`, `entries` an
  // {index:value} map for the few steps that aren't a rest — much easier
  // to read/tune than typing out 32 `null`s by hand.
  function stepArray(len, entries){
    const arr = new Array(len).fill(null);
    for (const idx in entries) arr[idx] = entries[idx];
    return arr;
  }

  // The Crypt (Stage 0, floors 1-2, see stages.js/game.js's startFloor) —
  // slow and sparse: a two-note walking bassline, an unhurried plucked
  // melody (deliberately NOT guitar-like — same pluck() primitive as the
  // percussion's 'bonehit', so the melody and the percussion share one
  // "bone on stone" timbral family), and a distant kick + bone-clack pulse
  // instead of a real drum kit. A natural-minor (A) palette throughout.
  // 72 BPM, 8th-note steps, 32 steps = 4 bars = ~13.3s per loop.
  //
  // Retuned after first-listen feedback ("ear screeching noise") — the
  // actual bugs (raw-white-noise reverb IR, no output limiter) are fixed
  // at the engine level above (ensureCtx's limiter, ensureReverb's
  // filtering).
  //
  // Second retune ("less on the high pitches please") — melody pulled into
  // a narrow low register (164-220Hz) and 'bonehit' percussion darkened
  // (see perc()).
  //
  // Third pass ("add more instruments... don't use what it currently
  // is") — the melody and pad no longer reuse `pluck`/`organ`. Melody is
  // now `mallet` (struck-bar partials — see mallet() above; a fast, clean
  // "bone xylophone" attack instead of a ringing plucked string, which
  // sidesteps the earlier dissonant-ringing issue at its root rather than
  // just taming `pluck`'s settings again) and the pad is now `strings`
  // (detuned unison — see strings() above; a soft swelling wash instead of
  // a single static organ chord). `bass`/`perc` unchanged — neither was
  // ever the problem.
  const CRYPT_BASS_STEPS = stepArray(32, { 0: 110.00, 8: 98.00, 16: 110.00, 24: 87.31 }); // A2, G2, A2, F2
  const CRYPT_MELODY_STEPS = stepArray(32, {
    2: 196.00, 9: 174.61, 18: 220.00, 26: 164.81,
  }); // G3, F3, A3, E3 — narrow low-register phrase (164-220Hz)
  const CRYPT_PERC_STEPS = stepArray(32, { 0: 'kick', 16: 'kick', 12: 'bonehit', 28: 'bonehit' });
  const CRYPT_PAD_STEPS = stepArray(32, { 0: [110.00, 130.81, 196.00] }); // A2+C3+G3, an open, unsettled dark chord
  // The Whitetail Forest (Stage 1, floors 3-4, see stages.js's STAGES[1])
  // — brighter and warmer than the Crypt, but deliberately not "high": a
  // walking bass outlining a friendly I-V-IV-I in D major (D-A-G-D), a
  // gentle rolling `piano` arpeggio (D3-F#3-A3-D4, same low-register
  // discipline the Crypt's melody settled on after "less high pitches"
  // feedback), a sparse `trumpet` motif standing in for a distant horn
  // call through the trees, and light `perc` (`'kick'`/`'hat'`) for
  // footsteps/twig-snaps rather than the Crypt's dead/bone percussion.
  // 96 BPM (livelier than the Crypt's 72), 8th-note steps, 32-step/4-bar
  // loop (~10s).
  const FOREST_BASS_STEPS = stepArray(32, { 0: 73.42, 8: 110.00, 16: 98.00, 24: 73.42 }); // D2, A2, G2, D2 — I-V-IV-I
  const FOREST_PIANO_STEPS = stepArray(32, {
    2: 146.83, 6: 185.00, 10: 220.00, 14: 293.66, 18: 220.00, 22: 185.00, 26: 146.83, 30: 110.00,
  }); // D3 F#3 A3 D4 A3 F#3 D3 A2 — a rolling up-and-down arpeggio, topping at D4/294Hz
  const FOREST_TRUMPET_STEPS = stepArray(32, { 4: 220.00, 20: 293.66, 28: 185.00 }); // A3, D4, F#3 — a sparse, distant horn-call motif
  const FOREST_PERC_STEPS = stepArray(32, { 0: 'kick', 16: 'kick', 4: 'hat', 12: 'hat', 20: 'hat', 28: 'hat' });

  // The Sandswept Dunes (Stage 2, floors 5-6, see stages.js's STAGES[2]).
  //
  // REDONE FROM SCRATCH after direct feedback ("never use this music
  // style again, it hurts") on the first attempt, which used E Phrygian
  // dominant (the augmented-2nd F->G# step meant to read as "exotic
  // desert caravan") — the takeaway is that this project's music wants
  // plain, consonant, comfortable scales, full stop; exotic/dissonant
  // intervals are OFF THE TABLE regardless of how well-motivated the
  // theming seemed. This version uses G major PENTATONIC (G, A, B, D, E —
  // no 4th, no 7th, so there's no half-step/dissonant interval ANYWHERE
  // in the scale; it's the same "can't really sound bad" 5-note set folk/
  // country banjo tunes lean on) and a warm major-key `strings` pad in
  // place of the old `choir`/drone atmosphere. Upbeat rather than heat-
  // drowsy — a jaunty banjo roll across the dunes instead of a mirage. 84
  // BPM (livelier than the old 66).
  const DESERT_BASS_STEPS = stepArray(32, { 0: 98.00, 8: 73.42, 16: 98.00, 24: 65.41 }); // G2, D2, G2, C2 — I-V-I-IV, about as plain a progression as exists
  const DESERT_MELODY_STEPS = stepArray(32, {
    2: 196.00, 6: 246.94, 10: 293.66, 14: 246.94, 18: 220.00, 22: 196.00, 26: 246.94, 30: 220.00,
  }); // G3 B3 D4 B3 A3 G3 B3 A3 — a continuous rolling pentatonic pick pattern, the classic banjo "roll" feel; G major pentatonic throughout, nothing outside it
  const DESERT_PERC_STEPS = stepArray(32, { 0: 'kick', 16: 'kick', 4: 'hat', 12: 'hat', 20: 'hat', 28: 'hat' });
  const DESERT_PAD_STEPS = stepArray(32, { 0: [98.00, 123.47, 146.83] }); // G2+B2+D3 — a plain, warm G major triad

  // The Inferno (Stage 3, floors 7-8, see stages.js's STAGES[3]) — the
  // last stage before the run branches, so it's the most aggressive track
  // yet: faster (108 BPM vs. the Crypt's 72), a punchy 16-step riff
  // repeated twice per loop, and a four-on-the-floor kick/hat/snare
  // pattern instead of any of the sparser percussion the earlier stages
  // use. Introduces `growl` (see above) for the lead — a gritty distorted
  // voice standing in for the din/heat of molten depths — while staying
  // in plain A NATURAL MINOR throughout (A-B-C-D-E-F-G, no augmented 2nd,
  // no exotic interval anywhere) per the standing "never use an exotic/
  // dissonant scale again" rule from the Sandswept Dunes redo.
  const INFERNO_BASS_STEPS = stepArray(32, { 0: 110.00, 8: 87.31, 16: 98.00, 24: 110.00 }); // A2, F2, G2, A2 — i-VI-VII-i
  const INFERNO_GROWL_STEPS = stepArray(32, {
    0: 220.00, 3: 261.63, 6: 246.94, 8: 220.00, 11: 174.61, 14: 196.00,
    16: 220.00, 19: 261.63, 22: 246.94, 24: 220.00, 27: 174.61, 30: 196.00,
  }); // A3 C4 B3 A3 F3 G3, twice per loop — a punchy repeated riff, all within A natural minor
  const INFERNO_PERC_STEPS = stepArray(32, {
    0: 'kick', 8: 'kick', 16: 'kick', 24: 'kick',
    4: 'snare', 12: 'snare', 20: 'snare', 28: 'snare',
    2: 'hat', 6: 'hat', 10: 'hat', 14: 'hat', 18: 'hat', 22: 'hat', 26: 'hat', 30: 'hat',
  }); // driving four-on-the-floor — the busiest percussion of any track so far, matching the stage's intensity
  const INFERNO_PAD_STEPS = stepArray(32, { 0: [110.00, 130.81, 164.81] }); // A2+C3+E3 — a plain A minor triad

  // The Frozen Desert (Stage 4, floors 9-10 of Phase 10's new arc, see
  // stages.js's STAGES[4]) — the coldest, sparsest track yet: slow (66
  // BPM), long silences between notes, no kick at all (just an occasional
  // soft hat standing in for footsteps crunching snow). Introduces
  // `icechime` (see above) for a glassy, slowly-shimmering high melody —
  // the one track where real brightness is the whole point of the
  // instrument, but kept safe from the "less high pitches" lesson by
  // being sparse (long decays, wide gaps, never more than one note
  // ringing at a time) rather than loud or busy. Plain C MAJOR
  // PENTATONIC throughout (C, D, E, G, A — no 4th, no 7th, so no
  // dissonant interval anywhere), the same "can't sound bad" 5-note
  // family the Sandswept Dunes redo settled on.
  const FROZENDESERT_BASS_STEPS = stepArray(32, { 0: 65.41, 16: 98.00 }); // C2, G2 — a bare I-V, nothing more
  const FROZENDESERT_ICECHIME_STEPS = stepArray(32, {
    2: 392.00, 10: 440.00, 18: 329.63, 26: 392.00,
  }); // G4, A4, E4, G4 — sparse, long-ringing, wide gaps between notes
  const FROZENDESERT_PERC_STEPS = stepArray(32, { 0: 'hat', 16: 'hat' }); // barely there — snow-crunch, not a beat
  const FROZENDESERT_PAD_STEPS = stepArray(32, { 0: [65.41, 98.00, 164.81] }); // C2+G2+E3 — a plain C major triad

  // The Badlands (Stage 5 of Phase 10's new arc, see stages.js's
  // STAGES[5]) — rugged and dusty, a moderate trudging tempo (80 BPM).
  // Introduces `harmonica` (see above) for a dusty, bending lead voice —
  // a lone travel-worn reed over broken ground. Plain D NATURAL MINOR
  // throughout (D-E-F-G-A-Bb-C, no augmented 2nd, no exotic interval
  // anywhere), per the standing "never use an exotic/dissonant scale
  // again" rule.
  const BADLANDS_BASS_STEPS = stepArray(32, { 0: 73.42, 8: 58.27, 16: 65.41, 24: 73.42 }); // D2, Bb1, C2, D2 — i-VI-VII-i
  const BADLANDS_HARMONICA_STEPS = stepArray(32, {
    0: 146.83, 4: 174.61, 8: 196.00, 12: 220.00, 16: 146.83, 20: 233.08, 24: 196.00, 28: 174.61,
  }); // D3 F3 G3 A3 D3 Bb3 G3 F3 — a sparse bending riff, all within D natural minor
  const BADLANDS_PERC_STEPS = stepArray(32, { 0: 'kick', 16: 'kick', 4: 'hat', 8: 'hat', 12: 'hat', 20: 'hat', 24: 'hat', 28: 'hat' });
  const BADLANDS_PAD_STEPS = stepArray(32, { 0: [73.42, 87.31, 110.00] }); // D2+F2+A2 — a plain D minor triad

  // The Beach (Stage 6 of Phase 10's new arc, see stages.js's STAGES[6])
  // — the first bright, breezy track in the new arc, a relaxed shoreline
  // stroll (92 BPM). Introduces `flute` (see above) for a long, airy,
  // legato melody — sea breeze rather than any percussive attack. Plain
  // A MAJOR PENTATONIC throughout (A, B, C#, E, F# — no 4th, no 7th, so
  // no dissonant interval anywhere), a different pentatonic key from the
  // Sandswept Dunes' G or the Frozen Desert's C so it doesn't repeat
  // either.
  const BEACH_BASS_STEPS = stepArray(32, { 0: 110.00, 8: 82.41, 16: 92.50, 24: 110.00 }); // A2, E2, F#2, A2 — I-V-vi-I
  const BEACH_FLUTE_STEPS = stepArray(32, {
    0: 220.00, 6: 277.18, 12: 329.63, 18: 369.99, 22: 329.63, 26: 277.18, 30: 246.94,
  }); // A3 C#4 E4 F#4 E4 C#4 B3 — a long, flowing legato phrase
  const BEACH_PERC_STEPS = stepArray(32, { 0: 'kick', 16: 'kick', 6: 'hat', 14: 'hat', 22: 'hat', 30: 'hat' });
  const BEACH_PAD_STEPS = stepArray(32, { 0: [110.00, 138.59, 164.81] }); // A2+C#3+E3 — a plain A major triad

  // The Ocean (Stage 7 of Phase 10's new arc, see stages.js's STAGES[7])
  // — open water, flowing and slow (76 BPM). Introduces `whalecall` (see
  // above) for a sparse, drifting long-form melody — only 3 calls across
  // the whole loop, each gliding upward and left ringing out well past
  // the next step. Plain E NATURAL MINOR throughout (E-F#-G-A-B-C-D, no
  // exotic interval anywhere), a new key from any earlier track.
  const OCEAN_BASS_STEPS = stepArray(32, { 0: 82.41, 8: 65.41, 16: 73.42, 24: 82.41 }); // E2, C2, D2, E2 — i-VI-VII-i
  const OCEAN_WHALECALL_STEPS = stepArray(32, { 2: 164.81, 14: 196.00, 24: 246.94 }); // E3, G3, B3 — sparse, wide-spaced calls
  const OCEAN_PERC_STEPS = stepArray(32, { 0: 'kick', 16: 'kick', 8: 'hat', 24: 'hat' });
  const OCEAN_PAD_STEPS = stepArray(32, { 0: [82.41, 98.00, 123.47] }); // E2+G2+B2 — a plain E minor triad

  // The Sea Floor (Stage 8 of Phase 10's new arc, see stages.js's
  // STAGES[8]) — deeper, darker, and even sparser than The Ocean: a slow
  // 60 BPM crawl, no continuous melody at all, just three widely-spaced
  // `gong` strikes per loop (see above) ringing out into long silence —
  // sound swallowed by pressure and depth. Plain C NATURAL MINOR
  // throughout (C-D-Eb-F-G-Ab-Bb, no exotic interval anywhere), a new
  // key from any earlier track.
  const SEAFLOOR_BASS_STEPS = stepArray(32, { 0: 65.41, 8: 58.27, 16: 51.91, 24: 65.41 }); // C2, Bb1, Ab1, C2 — i-VII-VI-i
  const SEAFLOOR_GONG_STEPS = stepArray(32, { 0: 130.81, 16: 155.56, 24: 98.00 }); // C3, Eb3, G2 — three widely-spaced deep strikes
  const SEAFLOOR_PERC_STEPS = stepArray(32, { 0: 'hat', 20: 'hat' }); // barely there, same discipline as the Frozen Desert's
  const SEAFLOOR_PAD_STEPS = stepArray(32, { 0: [65.41, 77.78, 98.00] }); // C2+Eb2+G2 — a plain C minor triad

  // The Trench (Stage 9 of Phase 10's new arc, see stages.js's STAGES[9])
  // — deeper and more tense than The Ocean (70 BPM). Introduces
  // `sonarping` (see above) for an echoing sonar-blip lead. Plain G
  // NATURAL MINOR throughout (G-A-Bb-C-D-Eb-F, no exotic interval
  // anywhere), a new key from any earlier track.
  const TRENCH_BASS_STEPS = stepArray(32, { 0: 98.00, 8: 77.78, 16: 87.31, 24: 98.00 }); // G2, Eb2, F2, G2 — i-VI-VII-i
  const TRENCH_SONARPING_STEPS = stepArray(32, { 0: 196.00, 10: 233.08, 20: 261.63, 28: 196.00 }); // G3, Bb3, C4, G3
  const TRENCH_PERC_STEPS = stepArray(32, { 0: 'kick', 16: 'kick', 8: 'hat', 24: 'hat' });
  const TRENCH_PAD_STEPS = stepArray(32, { 0: [98.00, 116.54, 146.83] }); // G2+Bb2+D3 — a plain G minor triad

  // The Trench Depths (Stage 10 of Phase 10's new arc, see stages.js's
  // STAGES[10]) — deeper still, unstable and eerie (58 BPM). Introduces
  // `ringmod` (see above) for an unsettling, metallic lead — true audio-
  // rate ring modulation, not just a filter/vibrato retune. Plain F#
  // NATURAL MINOR throughout (F#-G#-A-B-C#-D-E, no exotic interval
  // anywhere).
  const TRENCHDEPTHS_BASS_STEPS = stepArray(32, { 0: 92.50, 8: 73.42, 16: 82.41, 24: 92.50 }); // F#2, D2, E2, F#2 — i-VI-VII-i
  const TRENCHDEPTHS_RINGMOD_STEPS = stepArray(32, { 2: 185.00, 14: 220.00, 22: 277.18, 28: 185.00 }); // F#3, A3, C#4, F#3 — sparse, wide-spaced, unsettling
  const TRENCHDEPTHS_PERC_STEPS = stepArray(32, { 0: 'hat', 20: 'hat' }); // barely there, same discipline as Sea Floor's
  const TRENCHDEPTHS_PAD_STEPS = stepArray(32, { 0: [92.50, 110.00, 138.59] }); // F#2+A2+C#3 — a plain F# minor triad

  // The Deep Dark (Stage 11 of Phase 10's new arc, see stages.js's
  // STAGES[11]) — lightless, oppressive, the slowest and sparsest track
  // in the whole game (54 BPM). Introduces `voidhum` (see above) for a
  // directionless granular texture standing in for a melody. Plain F
  // NATURAL MINOR throughout (F-G-Ab-Bb-C-Db-Eb, no exotic interval
  // anywhere).
  const DEEPDARK_BASS_STEPS = stepArray(32, { 0: 87.31, 8: 69.30, 16: 77.78, 24: 87.31 }); // F2, Db2, Eb2, F2 — i-VI-VII-i
  const DEEPDARK_VOIDHUM_STEPS = stepArray(32, { 0: 174.61, 16: 138.59 }); // F3, Db3 — just two long grainy swells per loop
  const DEEPDARK_PERC_STEPS = stepArray(32, { 16: 'hat' }); // a single hit per loop — the sparsest percussion of any track
  const DEEPDARK_PAD_STEPS = stepArray(32, { 0: [87.31, 103.83, 130.81] }); // F2+Ab2+C3 — a plain F minor triad, filtered darkest of any pad

  // The Meta Realm (Stage 12 of Phase 10's new arc, see stages.js's
  // STAGES[12]) — outside the game's own fiction, unnervingly bright and
  // energetic against everything that came before (100 BPM). Introduces
  // `glitch` (see above) for a jittery, self-arpeggiating lead — the
  // "wrongness" comes entirely from stutter/rhythm, not from the scale.
  // Plain D MAJOR PENTATONIC throughout (D, E, F#, A, B — no 4th, no
  // 7th, no dissonant interval anywhere) and the first MAJOR-key pad in
  // this whole back half of the arc, deliberately jarring against the
  // five minor-key stages leading up to it.
  const METAREALM_BASS_STEPS = stepArray(32, { 0: 73.42, 8: 55.00, 16: 61.74, 24: 73.42 }); // D2, A1, B1, D2 — I-V-vi-I
  const METAREALM_GLITCH_STEPS = stepArray(32, { 0: 293.66, 8: 369.99, 16: 440.00, 24: 246.94 }); // D4, F#4, A4, B3
  const METAREALM_PERC_STEPS = stepArray(32, { 0: 'kick', 14: 'kick', 16: 'kick', 30: 'kick' }); // deliberately off-grid, "broken meter"
  const METAREALM_PAD_STEPS = stepArray(32, { 0: [73.42, 92.50, 110.00] }); // D2+F#2+A2 — a plain D major triad

  // Hyperspace (Stage 13, the arc's final stage, see stages.js's
  // STAGES[13]) — the fastest, most energetic track in the game (118
  // BPM). Introduces `warpsynth` (see above) for a rising, filter-opening
  // lead sweep. Plain E MAJOR PENTATONIC throughout (E, F#, G#, B, C# —
  // no 4th, no 7th, no dissonant interval anywhere).
  const HYPERSPACE_BASS_STEPS = stepArray(32, { 0: 82.41, 8: 61.74, 16: 69.30, 24: 82.41 }); // E2, B1, C#2, E2 — I-V-vi-I
  const HYPERSPACE_WARPSYNTH_STEPS = stepArray(32, { 0: 164.81, 8: 207.65, 16: 246.94, 24: 277.18 }); // E3, G#3, B3, C#4, each rising/opening across its own step
  const HYPERSPACE_PERC_STEPS = stepArray(32, { 0: 'kick', 8: 'kick', 16: 'kick', 24: 'kick', 4: 'hat', 12: 'hat', 20: 'hat', 28: 'hat' });
  const HYPERSPACE_PAD_STEPS = stepArray(32, { 0: [82.41, 103.83, 123.47] }); // E2+G#2+B2 — a plain E major triad

  /* ---------------- C-branch tracks (see stages.js's C_PALETTES/
     C_MUSIC_TRACKS/cMusicTrackFor — this is the whole alternate run
     entered from the floor-2 gate room, floorNum 2-11 / labels 3C-12C,
     four regions across those ten floors). Same "plain, consonant scale
     only" rule as every Part A track. ---------------- */

  // Gutters (3C/4C) — wet concrete, standing rainwater, the C-branch's
  // opening region (68 BPM). Introduces `drip` (see above) for a sparse,
  // irregularly-spaced dripping melody — deliberately NOT on a clean grid,
  // the way real drips aren't. Plain B NATURAL MINOR throughout (B-C#-D-
  // E-F#-G-A, no exotic interval anywhere).
  const GUTTERS_BASS_STEPS = stepArray(32, { 0: 61.74, 8: 49.00, 16: 55.00, 24: 61.74 }); // B1, G1, A1, B1 — i-VI-VII-i
  const GUTTERS_DRIP_STEPS = stepArray(32, { 3: 146.83, 9: 185.00, 15: 220.00, 19: 146.83, 25: 185.00, 29: 246.94 }); // D3 F#3 A3 D3 F#3 B3, irregular spacing
  const GUTTERS_PERC_STEPS = stepArray(32, { 6: 'hat', 14: 'hat', 22: 'hat', 30: 'hat' }); // trickling water, no kick at all
  const GUTTERS_PAD_STEPS = stepArray(32, { 0: [61.74, 73.42, 92.50] }); // B1+D2+F#2 — a plain B minor triad

  // Sewers (5C/6C) — algae-slick brick under sodium light, murkier and
  // slower than Gutters (64 BPM). Introduces `sludge` (see above) for a
  // sickly, unstable auto-wah lead. Plain D NATURAL MINOR throughout
  // (D-E-F-G-A-Bb-C, no exotic interval anywhere).
  const SEWERS_BASS_STEPS = stepArray(32, { 0: 73.42, 8: 58.27, 16: 65.41, 24: 73.42 }); // D2, Bb1, C2, D2 — i-VI-VII-i
  const SEWERS_SLUDGE_STEPS = stepArray(32, { 0: 146.83, 10: 174.61, 20: 196.00, 28: 164.81 }); // D3, F3, G3, E3
  const SEWERS_PERC_STEPS = stepArray(32, { 0: 'kick', 16: 'kick', 8: 'hat', 24: 'hat' });
  const SEWERS_PAD_STEPS = stepArray(32, { 0: [73.42, 87.31, 110.00] }); // D2+F2+A2 — a plain D minor triad

  // Rainforest (7C-10C) — canopy to storm-lashed crown, the C-branch's
  // longest and liveliest region at four floors (88 BPM, the brightest
  // tempo of the whole branch). Introduces `birdcall` (see above) for a
  // dense, chirpy canopy melody. Plain C# NATURAL MINOR throughout
  // (C#-D#-E-F#-G#-A-B, no exotic interval anywhere).
  const RAINFOREST_BASS_STEPS = stepArray(32, { 0: 69.30, 8: 55.00, 16: 61.74, 24: 69.30 }); // C#2, A1, B1, C#2 — i-VI-VII-i
  const RAINFOREST_BIRDCALL_STEPS = stepArray(32, {
    0: 207.65, 3: 246.94, 6: 277.18, 10: 329.63, 14: 246.94, 18: 207.65, 22: 277.18, 26: 369.99, 30: 246.94,
  }); // G#3 B3 C#4 E4 B3 G#3 C#4 F#4 B3 — a dense, chirpy phrase
  const RAINFOREST_PERC_STEPS = stepArray(32, { 0: 'kick', 16: 'kick', 4: 'hat', 8: 'hat', 12: 'hat', 20: 'hat', 24: 'hat', 28: 'hat' });
  const RAINFOREST_PAD_STEPS = stepArray(32, { 0: [69.30, 82.41, 103.83] }); // C#2+E2+G#2 — a plain C# minor triad

  // Mangroves (11C/12C) — brackish tidal water and salt-bleached roots,
  // the C-branch's final region and Kirk's set (62 BPM). Introduces
  // `creak` (see above) for slow, widely-spaced groaning wood/rope hits.
  // Plain G# NATURAL MINOR throughout (G#-A#-B-C#-D#-E-F#, no exotic
  // interval anywhere).
  const MANGROVES_BASS_STEPS = stepArray(32, { 0: 103.83, 8: 82.41, 16: 92.50, 24: 103.83 }); // G#2, E2, F#2, G#2 — i-VI-VII-i
  const MANGROVES_CREAK_STEPS = stepArray(32, { 0: 207.65, 16: 155.56 }); // G#3, D#3 — two widely-spaced groans per loop
  const MANGROVES_PERC_STEPS = stepArray(32, { 0: 'hat', 20: 'hat' }); // barely there, same discipline as the Frozen Desert's
  const MANGROVES_PAD_STEPS = stepArray(32, { 0: [103.83, 123.47, 155.56] }); // G#2+B2+D#3 — a plain G# minor triad

  /* ---------------- D-branch tracks (see stages.js's D_PALETTES/
     D_MUSIC_TRACKS/dMusicTrackFor — the second alternate run, entered
     from the floor-3 planetarium gate room, floorNum 3-9 / labels 4D-10D,
     three regions across those seven floors). Same "plain, consonant
     scale only" rule as every earlier track. ---------------- */

  // Observatory (4D/5D) — dust, tarnished brass, cracked lens glass, the
  // D-branch's opening region (72 BPM). Introduces `stardust` (see above)
  // for a sparse, shimmering starlight melody. Plain Bb NATURAL MINOR
  // throughout (Bb-C-Db-Eb-F-Gb-Ab, no exotic interval anywhere).
  const OBSERVATORY_BASS_STEPS = stepArray(32, { 0: 58.27, 8: 46.25, 16: 51.91, 24: 58.27 }); // Bb1, Gb1, Ab1, Bb1 — i-VI-VII-i
  const OBSERVATORY_STARDUST_STEPS = stepArray(32, { 0: 233.08, 10: 277.18, 20: 311.13, 28: 233.08 }); // Bb3, Db4, Eb4, Bb3
  const OBSERVATORY_PERC_STEPS = stepArray(32, { 0: 'hat', 16: 'hat' }); // dusty stillness
  const OBSERVATORY_PAD_STEPS = stepArray(32, { 0: [58.27, 69.30, 87.31] }); // Bb1+Db2+F2 — a plain Bb minor triad

  // Orrery (6D/7D) — polished brass rings turning over deep indigo, the
  // D-branch's mechanical heart (96 BPM). Introduces `clockwork` (see
  // above) for a ticking, self-arpeggiating gear melody. Plain F MAJOR
  // PENTATONIC throughout (F, G, A, C, D — no dissonant interval
  // anywhere), the first bright/major D-branch region, fitting "polished
  // brass" rather than the branch's otherwise dust/void darkness.
  const ORRERY_BASS_STEPS = stepArray(32, { 0: 87.31, 8: 65.41, 16: 73.42, 24: 87.31 }); // F2, C2, D2, F2 — I-V-vi-I
  const ORRERY_CLOCKWORK_STEPS = stepArray(32, { 0: 174.61, 8: 220.00, 16: 261.63, 24: 293.66 }); // F3, A3, C4, D4
  const ORRERY_PERC_STEPS = stepArray(32, { 0: 'kick', 16: 'kick', 4: 'hat', 8: 'hat', 12: 'hat', 20: 'hat', 24: 'hat', 28: 'hat' });
  const ORRERY_PAD_STEPS = stepArray(32, { 0: [87.31, 110.00, 130.81] }); // F2+A2+C3 — a plain F major triad

  // The Void Between (8D-10D) — outside the machine, cold, empty, faintly
  // lit, the D-branch's final and longest region and its superboss's set
  // (56 BPM, the branch's slowest). Introduces `drift` (see above) for a
  // long, cold, continuously-panning drone standing in for a melody.
  // Plain Eb NATURAL MINOR throughout (Eb-F-Gb-Ab-Bb-Cb-Db, no exotic
  // interval anywhere).
  const VOIDBETWEEN_BASS_STEPS = stepArray(32, { 0: 77.78, 8: 61.74, 16: 69.30, 24: 77.78 }); // Eb2, B1(Cb2), Db2, Eb2 — i-VI-VII-i
  const VOIDBETWEEN_DRIFT_STEPS = stepArray(32, { 0: 155.56, 16: 138.59 }); // Eb3, Db3 — two long drifting swells per loop
  const VOIDBETWEEN_PERC_STEPS = stepArray(32, { 16: 'hat' }); // a single hit per loop — as sparse as the Deep Dark's
  const VOIDBETWEEN_PAD_STEPS = stepArray(32, { 0: [77.78, 92.50, 116.54] }); // Eb2+Gb2+Bb2 — a plain Eb minor triad, filtered darkest of the branch

  /* ---------------- room-type tracks (see economy.js's ROOM_MUSIC_TRACKS
     and game.js's enterRoom — these override whichever floor/region track
     is currently playing for as long as the player stands in a room of
     that type, then hand back to it on leaving). Shorter, tighter loops
     than the floor tracks (rooms are brief visits), reusing the existing
     instrument palette rather than adding new ones — same "plain,
     consonant scale only" rule throughout. ---------------- */

  // Boss Room — REDONE ENTIRELY. The original was one static 16-hit growl
  // riff over wall-to-wall kick/snare, repeating identically forever — no
  // actual musical development, just density. This version has real FORM:
  // two alternating sections (`altSteps`/`altSectionLoops`, see
  // scheduleMusicStep) — a restrained "GRIND" (loops 0-3) that holds back,
  // and an "ASSAULT" (loops 4-7) that breaks loose into a 16th-note growl
  // run, doubled percussion, and the new `stab` instrument (see above)
  // landing power-chord hits on the strong beats — before dropping back to
  // the grind. 136 BPM (up from 130), plain A NATURAL MINOR (the same key
  // Crypt/Inferno already made "the villain's key" — ties every boss
  // fight back to that same dark identity rather than inventing a new
  // one). `swing: 0` still applies (set on the track entry) — nothing
  // here should ever feel shuffled.
  const BOSSROOM_BASS_GRIND = stepArray(32, { 0: 55.00, 8: 43.65, 16: 49.00, 24: 55.00 }); // A1, F1, G1, A1 — i-VI-VII-i, held back
  const BOSSROOM_BASS_ASSAULT = stepArray(32, {
    0: 55.00, 4: 65.41, 8: 43.65, 12: 49.00, 16: 55.00, 20: 65.41, 24: 43.65, 28: 49.00,
  }); // A1 C2 F1 G1, walking every beat instead of once per bar — noticeably busier under the assault
  const BOSSROOM_GROWL_GRIND = stepArray(32, {
    0: 220.00, 2: 261.63, 4: 246.94, 6: 220.00, 8: 174.61, 10: 196.00, 12: 220.00, 14: 246.94,
    16: 220.00, 18: 261.63, 20: 246.94, 22: 220.00, 24: 174.61, 26: 196.00, 28: 220.00, 30: 246.94,
  }); // A3 C4 B3 A3 F3 G3 A3 B3, twice per loop — restrained, 8th-notes only
  const BOSSROOM_GROWL_ASSAULT = stepArray(32, {
    0: 220.00, 1: 246.94, 2: 261.63, 3: 293.66, 4: 261.63, 5: 246.94, 6: 220.00, 7: 196.00,
    8: 220.00, 9: 246.94, 10: 261.63, 11: 293.66, 12: 329.63, 13: 293.66, 14: 261.63, 15: 246.94,
    16: 220.00, 17: 246.94, 18: 261.63, 19: 293.66, 20: 261.63, 21: 246.94, 22: 220.00, 23: 196.00,
    24: 220.00, 25: 246.94, 26: 261.63, 27: 293.66, 28: 329.63, 29: 293.66, 30: 261.63, 31: 246.94,
  }); // every single step filled — A3-B4 range, a full 16th-note run, breaking completely loose from the grind's restraint
  const BOSSROOM_PERC_GRIND = stepArray(32, {
    0: 'kick', 4: 'kick', 8: 'kick', 12: 'kick', 16: 'kick', 20: 'kick', 24: 'kick', 28: 'kick',
    2: 'snare', 6: 'snare', 10: 'snare', 14: 'snare', 18: 'snare', 22: 'snare', 26: 'snare', 30: 'snare',
  }); // wall-to-wall kick/snare, but nothing busier than 8th-notes
  const BOSSROOM_PERC_ASSAULT = stepArray(32, (() => {
    // every step gets a hat; kick lands on the bar, snare on the backbeat,
    // exactly like the grind — the hats are what make this read as
    // "doubled-time" under the same underlying kick/snare skeleton
    const o = {};
    for (let i = 0; i < 32; i++) o[i] = 'hat';
    for (let i = 0; i < 32; i += 8) o[i] = 'kick';
    for (let i = 4; i < 32; i += 8) o[i] = 'snare';
    return o;
  })());
  const BOSSROOM_STAB_SILENT = stepArray(32, {}); // stab is silent during the grind — see BOSSROOM_STAB_ASSAULT
  const BOSSROOM_STAB_ASSAULT = stepArray(32, { 0: [220.00, 329.63, 440.00], 8: [196.00, 293.66, 392.00], 16: [220.00, 329.63, 440.00], 24: [246.94, 369.99, 493.88] }); // A/G/A/B power-chord stabs landing on each bar of the assault
  const BOSSROOM_PAD_GRIND = stepArray(32, { 0: [55.00, 65.41, 82.41] }); // A1+C2+E2 — a plain A minor triad, kept very quiet under the riff
  const BOSSROOM_PAD_ASSAULT = stepArray(32, { 0: [55.00, 65.41, 87.31] }); // A1+C2+F2 — a borrowed vi chord for a brief tension shift under the assault, still plain/consonant

  // Crystal Room (also Shrine) — a sparse blessing: gentle `icechime`
  // sparkle over a `choir` pad (a chord fed straight into choir() — three
  // simultaneous formant voices, the lushest pad texture in the game,
  // reserved for this one track). Plain C MAJOR (70 BPM).
  const CRYSTALROOM_BASS_STEPS = stepArray(16, { 0: 65.41, 8: 98.00 }); // C2, G2 — a bare I-V
  const CRYSTALROOM_ICECHIME_STEPS = stepArray(16, { 0: 392.00, 5: 329.63, 10: 261.63, 13: 329.63 }); // G4, E4, C4, E4 — sparse, long-ringing
  const CRYSTALROOM_PERC_STEPS = stepArray(16, { 0: 'hat', 8: 'hat' });
  const CRYSTALROOM_PAD_STEPS = stepArray(16, { 0: [130.81, 164.81, 196.00] }); // C3+E3+G3 — a plain C major triad, played by choir() for a vocal "blessing" texture

  // Sombra Room (also Cursed Room) — a costly deal: sparse, unsettling
  // `ringmod` over a slow tense pulse. Plain F# NATURAL MINOR, the same
  // key as Trench Depths, ringmod's original home track (66 BPM).
  const SOMBRAROOM_BASS_STEPS = stepArray(16, { 0: 92.50, 8: 73.42 }); // F#2, D2 — a bare i-VI
  const SOMBRAROOM_RINGMOD_STEPS = stepArray(16, { 0: 185.00, 6: 220.00, 11: 277.18 }); // F#3, A3, C#4 — sparse, wide-spaced
  const SOMBRAROOM_PERC_STEPS = stepArray(16, { 0: 'kick', 10: 'hat' });
  const SOMBRAROOM_PAD_STEPS = stepArray(16, { 0: [92.50, 110.00, 138.59] }); // F#2+A2+C#3 — a plain F# minor triad

  // Treasure Room — a short triumphant fanfare: `trumpet` over a bright
  // walking bass. Plain A MAJOR (100 BPM).
  const TREASUREROOM_BASS_STEPS = stepArray(16, { 0: 110.00, 4: 138.59, 8: 92.50, 12: 110.00 }); // A2, C#3, F#2, A2 — I-vi-IV-ish, a plain fanfare progression
  const TREASUREROOM_TRUMPET_STEPS = stepArray(16, { 0: 220.00, 4: 277.18, 8: 329.63, 14: 220.00 }); // A3, C#4, E4, A3 — a short fanfare motif
  const TREASUREROOM_PERC_STEPS = stepArray(16, { 0: 'kick', 8: 'kick', 4: 'hat', 12: 'hat' });
  const TREASUREROOM_PAD_STEPS = stepArray(16, { 0: [110.00, 138.59, 164.81] }); // A2+C#3+E3 — a plain A major triad

  // Secret Room (also Sacrifice Room) — quiet and mysterious: a sparse
  // `mallet` melody (the struck-bar "bone xylophone" plink, not yet used
  // as a room track's lead) over a dark, still pad. Plain B NATURAL MINOR
  // (64 BPM).
  const SECRETROOM_BASS_STEPS = stepArray(16, { 0: 61.74, 8: 49.00 }); // B1, G1 — a bare i-VI
  const SECRETROOM_MALLET_STEPS = stepArray(16, { 0: 146.83, 7: 185.00, 12: 220.00 }); // D3, F#3, A3 — sparse and irregular
  const SECRETROOM_PERC_STEPS = stepArray(16, { 12: 'hat' }); // barely there
  const SECRETROOM_PAD_STEPS = stepArray(16, { 0: [61.74, 73.42, 92.50] }); // B1+D2+F#2 — a plain B minor triad

  // Shop (also Pet Shop) — a cheerful, bouncy jingle: a rolling `piano`
  // arpeggio over a bright walking bass. Plain G MAJOR (108 BPM).
  const SHOP_BASS_STEPS = stepArray(16, { 0: 98.00, 4: 73.42, 8: 65.41, 12: 98.00 }); // G2, D2, C2, G2 — I-V-IV-I
  const SHOP_PIANO_STEPS = stepArray(16, { 0: 196.00, 2: 246.94, 4: 293.66, 6: 246.94, 8: 196.00, 10: 246.94, 12: 293.66, 14: 246.94 }); // G3 B3 D4 B3, twice per loop — a rolling arpeggio
  const SHOP_PERC_STEPS = stepArray(16, { 0: 'kick', 8: 'kick', 4: 'hat', 12: 'hat' });
  const SHOP_PAD_STEPS = stepArray(16, { 0: [98.00, 123.47, 146.83] }); // G2+B2+D3 — a plain G major triad

  // Every entry below is a plain step-array track; the "sound more
  // musical" pass (humanization/accenting/swing/fills/pad-breathing) lives
  // entirely in scheduleMusicStep and applies automatically to all of
  // them from `stepIndex`/`track.bpm`/`track.stepsPerBeat` alone — no
  // track needed new authored data for it. The one opt-in field a track
  // CAN set is `swing` (default 0.1 if omitted); a handful of
  // mechanically-precise tracks (bossroom, inferno, orrery, metarealm,
  // hyperspace) set `swing: 0` explicitly to stay tight instead.
  const MUSIC_TRACKS = {
    crypt: {
      name: 'The Crypt',
      bpm: 72, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: CRYPT_BASS_STEPS,   opts:{ dur:0.9, gain:0.18, attack:0.02, release:0.5, filterFreq:260 } },
        { instrument:'mallet',  steps: CRYPT_MELODY_STEPS, opts:{ dur:0.7, gain:0.15, attack:0.003, release:0.5, reverb:0.15, pan:-0.15, filterFreq:1400 } },
        { instrument:'perc',    steps: CRYPT_PERC_STEPS,   opts:{ gain:0.6, reverb:0.06 } },
        { instrument:'strings', steps: CRYPT_PAD_STEPS,    opts:{ dur:6, gain:0.045, attack:1.5, release:2, reverb:0.18, voices:4, detune:6, type:'triangle', filterFreq:420 } },
      ],
    },
    forest: {
      name: 'The Whitetail Forest',
      bpm: 96, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: FOREST_BASS_STEPS,    opts:{ dur:0.7, gain:0.16, attack:0.02, release:0.4, filterFreq:300 } },
        { instrument:'piano',   steps: FOREST_PIANO_STEPS,   opts:{ dur:0.8, gain:0.12, release:0.6, reverb:0.12, filterFreq:2600, pan:-0.1 } },
        { instrument:'trumpet', steps: FOREST_TRUMPET_STEPS, opts:{ dur:0.6, gain:0.13, attack:0.03, release:0.2, reverb:0.2, pan:0.15, vibrato:5, vibratoDepth:6 } },
        { instrument:'perc',    steps: FOREST_PERC_STEPS,    opts:{ gain:0.45, reverb:0.05 } },
      ],
    },
    desert: {
      name: 'The Sandswept Dunes',
      bpm: 84, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: DESERT_BASS_STEPS,   opts:{ dur:0.7, gain:0.15, attack:0.02, release:0.4, filterFreq:280 } },
        { instrument:'banjo',   steps: DESERT_MELODY_STEPS, opts:{ dur:0.3, gain:0.15, damping:3000, decay:0.92, reverb:0.12, pan:0.1 } },
        { instrument:'perc',    steps: DESERT_PERC_STEPS,   opts:{ gain:0.5, reverb:0.06 } },
        { instrument:'strings', steps: DESERT_PAD_STEPS,    opts:{ dur:5, gain:0.04, attack:1.3, release:1.8, reverb:0.15, voices:4, detune:5, type:'triangle', filterFreq:500 } },
      ],
    },
    inferno: {
      name: 'The Inferno',
      bpm: 108, stepsPerBeat: 2, swing: 0, // aggressive four-on-the-floor stays mechanically tight, not shuffled
      parts: [
        { instrument:'bass',    steps: INFERNO_BASS_STEPS,  opts:{ dur:0.5, gain:0.17, attack:0.015, release:0.3, filterFreq:320 } },
        { instrument:'growl',   steps: INFERNO_GROWL_STEPS, opts:{ dur:0.22, gain:0.14, attack:0.008, release:0.1, drive:7, filterFreq:1600, reverb:0.08, pan:-0.1 } },
        { instrument:'perc',    steps: INFERNO_PERC_STEPS,  opts:{ gain:0.5, reverb:0.05 } },
        { instrument:'strings', steps: INFERNO_PAD_STEPS,   opts:{ dur:4.5, gain:0.04, attack:1.1, release:1.5, reverb:0.15, voices:4, detune:6, type:'sawtooth', filterFreq:450 } },
      ],
    },
    frozendesert: {
      name: 'The Frozen Desert',
      bpm: 66, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',     steps: FROZENDESERT_BASS_STEPS,     opts:{ dur:1.2, gain:0.12, attack:0.05, release:0.7, filterFreq:240 } },
        { instrument:'icechime', steps: FROZENDESERT_ICECHIME_STEPS, opts:{ dur:1.1, gain:0.13, release:1.6, tremolo:4.5, tremoloDepth:0.35, reverb:0.25, pan:0.1 } },
        { instrument:'perc',     steps: FROZENDESERT_PERC_STEPS,     opts:{ gain:0.25, reverb:0.1 } },
        { instrument:'strings',  steps: FROZENDESERT_PAD_STEPS,      opts:{ dur:6, gain:0.035, attack:1.8, release:2.2, reverb:0.22, voices:4, detune:4, type:'triangle', filterFreq:900 } },
      ],
    },
    badlands: {
      name: 'The Badlands',
      bpm: 80, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',      steps: BADLANDS_BASS_STEPS,      opts:{ dur:0.6, gain:0.16, attack:0.02, release:0.35, filterFreq:280 } },
        { instrument:'harmonica', steps: BADLANDS_HARMONICA_STEPS, opts:{ dur:0.45, gain:0.15, detuneCents:12, reverb:0.1, pan:-0.1 } },
        { instrument:'perc',      steps: BADLANDS_PERC_STEPS,      opts:{ gain:0.42, reverb:0.05 } },
        { instrument:'strings',   steps: BADLANDS_PAD_STEPS,       opts:{ dur:4.5, gain:0.04, attack:1.2, release:1.6, reverb:0.15, voices:4, detune:5, type:'triangle', filterFreq:480 } },
      ],
    },
    beach: {
      name: 'The Beach',
      bpm: 92, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: BEACH_BASS_STEPS,  opts:{ dur:0.65, gain:0.14, attack:0.02, release:0.4, filterFreq:300 } },
        { instrument:'flute',   steps: BEACH_FLUTE_STEPS, opts:{ dur:0.9, gain:0.13, attack:0.06, release:0.35, breath:0.3, reverb:0.16, pan:0.1, vibrato:4, vibratoDepth:5 } },
        { instrument:'perc',    steps: BEACH_PERC_STEPS,  opts:{ gain:0.35, reverb:0.08 } },
        { instrument:'strings', steps: BEACH_PAD_STEPS,   opts:{ dur:5.5, gain:0.04, attack:1.4, release:1.9, reverb:0.18, voices:4, detune:5, type:'triangle', filterFreq:700 } },
      ],
    },
    ocean: {
      name: 'The Ocean',
      bpm: 76, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',      steps: OCEAN_BASS_STEPS,      opts:{ dur:0.8, gain:0.15, attack:0.03, release:0.5, filterFreq:260 } },
        { instrument:'whalecall', steps: OCEAN_WHALECALL_STEPS, opts:{ dur:2.4, gain:0.12, attack:0.4, release:0.8, bubbles:2, reverb:0.28, pan:-0.1, vibrato:2.5, vibratoDepth:12 } },
        { instrument:'perc',      steps: OCEAN_PERC_STEPS,      opts:{ gain:0.3, reverb:0.1 } },
        { instrument:'strings',   steps: OCEAN_PAD_STEPS,       opts:{ dur:6, gain:0.04, attack:1.6, release:2, reverb:0.2, voices:4, detune:5, type:'triangle', filterFreq:550 } },
      ],
    },
    seafloor: {
      name: 'The Sea Floor',
      bpm: 60, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: SEAFLOOR_BASS_STEPS, opts:{ dur:1.1, gain:0.13, attack:0.05, release:0.7, filterFreq:220 } },
        { instrument:'gong',    steps: SEAFLOOR_GONG_STEPS, opts:{ dur:2.2, gain:0.11, damping:1400, reverb:0.32, pan:0.1 } },
        { instrument:'perc',    steps: SEAFLOOR_PERC_STEPS, opts:{ gain:0.22, reverb:0.12 } },
        { instrument:'strings', steps: SEAFLOOR_PAD_STEPS,  opts:{ dur:7, gain:0.035, attack:2, release:2.5, reverb:0.25, voices:4, detune:4, type:'triangle', filterFreq:380 } },
      ],
    },
    trench: {
      name: 'The Trench',
      bpm: 70, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',      steps: TRENCH_BASS_STEPS,      opts:{ dur:0.8, gain:0.15, attack:0.03, release:0.5, filterFreq:250 } },
        { instrument:'sonarping', steps: TRENCH_SONARPING_STEPS, opts:{ dur:0.15, gain:0.15, echoTime:0.3, feedback:0.4, echoes:4, reverb:0.12, pan:-0.1 } },
        { instrument:'perc',      steps: TRENCH_PERC_STEPS,      opts:{ gain:0.32, reverb:0.1 } },
        { instrument:'strings',   steps: TRENCH_PAD_STEPS,       opts:{ dur:6, gain:0.04, attack:1.6, release:2, reverb:0.2, voices:4, detune:5, type:'triangle', filterFreq:500 } },
      ],
    },
    trenchdepths: {
      name: 'The Trench Depths',
      bpm: 58, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: TRENCHDEPTHS_BASS_STEPS,    opts:{ dur:1, gain:0.14, attack:0.04, release:0.6, filterFreq:230 } },
        { instrument:'ringmod', steps: TRENCHDEPTHS_RINGMOD_STEPS, opts:{ dur:0.5, gain:0.12, modRatio:1.4, reverb:0.2, pan:0.1 } },
        { instrument:'perc',    steps: TRENCHDEPTHS_PERC_STEPS,    opts:{ gain:0.24, reverb:0.12 } },
        { instrument:'strings', steps: TRENCHDEPTHS_PAD_STEPS,     opts:{ dur:6.5, gain:0.038, attack:1.8, release:2.2, reverb:0.24, voices:4, detune:4, type:'triangle', filterFreq:420 } },
      ],
    },
    deepdark: {
      name: 'The Deep Dark',
      bpm: 54, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: DEEPDARK_BASS_STEPS,    opts:{ dur:1.3, gain:0.12, attack:0.06, release:0.8, filterFreq:200 } },
        { instrument:'voidhum', steps: DEEPDARK_VOIDHUM_STEPS, opts:{ dur:4, gain:0.05, grains:16, reverb:0.35, pan:0 } },
        { instrument:'perc',    steps: DEEPDARK_PERC_STEPS,    opts:{ gain:0.2, reverb:0.14 } },
        { instrument:'strings', steps: DEEPDARK_PAD_STEPS,     opts:{ dur:8, gain:0.032, attack:2.2, release:2.8, reverb:0.28, voices:4, detune:4, type:'triangle', filterFreq:320 } },
      ],
    },
    metarealm: {
      name: 'The Meta Realm',
      bpm: 100, stepsPerBeat: 2, swing: 0, // glitch()'s jitter IS the rhythm; a swung grid under it would blur that effect
      parts: [
        { instrument:'bass',    steps: METAREALM_BASS_STEPS,   opts:{ dur:0.6, gain:0.15, attack:0.02, release:0.35, filterFreq:320 } },
        { instrument:'glitch',  steps: METAREALM_GLITCH_STEPS, opts:{ gain:0.13, steps:4, stepGap:0.045, reverb:0.15, pan:0 } },
        { instrument:'perc',    steps: METAREALM_PERC_STEPS,   opts:{ gain:0.4, reverb:0.08 } },
        { instrument:'strings', steps: METAREALM_PAD_STEPS,    opts:{ dur:4, gain:0.045, attack:1, release:1.4, reverb:0.16, voices:4, detune:6, type:'triangle', filterFreq:650 } },
      ],
    },
    hyperspace: {
      name: 'Hyperspace',
      bpm: 118, stepsPerBeat: 2, swing: 0, // driving four-on-the-floor finale, stays mechanically tight
      parts: [
        { instrument:'bass',      steps: HYPERSPACE_BASS_STEPS,      opts:{ dur:0.45, gain:0.16, attack:0.015, release:0.25, filterFreq:340 } },
        { instrument:'warpsynth', steps: HYPERSPACE_WARPSYNTH_STEPS, opts:{ dur:0.55, gain:0.14, filterFrom:300, filterTo:3800, reverb:0.18, pan:0.1 } },
        { instrument:'perc',      steps: HYPERSPACE_PERC_STEPS,      opts:{ gain:0.48, reverb:0.06 } },
        { instrument:'strings',   steps: HYPERSPACE_PAD_STEPS,       opts:{ dur:3.6, gain:0.045, attack:0.9, release:1.2, reverb:0.16, voices:4, detune:6, type:'triangle', filterFreq:700 } },
      ],
    },
    gutters: {
      name: 'The Gutters',
      bpm: 68, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: GUTTERS_BASS_STEPS, opts:{ dur:0.8, gain:0.15, attack:0.03, release:0.5, filterFreq:260 } },
        { instrument:'drip',    steps: GUTTERS_DRIP_STEPS, opts:{ dur:0.12, gain:0.15, chorusRate:5, chorusDepth:0.004, reverb:0.22, pan:-0.1 } },
        { instrument:'perc',    steps: GUTTERS_PERC_STEPS, opts:{ gain:0.28, reverb:0.1 } },
        { instrument:'strings', steps: GUTTERS_PAD_STEPS,  opts:{ dur:6, gain:0.04, attack:1.6, release:2, reverb:0.2, voices:4, detune:5, type:'triangle', filterFreq:460 } },
      ],
    },
    sewers: {
      name: 'The Sewers',
      bpm: 64, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: SEWERS_BASS_STEPS,   opts:{ dur:0.9, gain:0.15, attack:0.04, release:0.55, filterFreq:240 } },
        { instrument:'sludge',  steps: SEWERS_SLUDGE_STEPS, opts:{ dur:0.5, gain:0.13, wahRate:3.2, wahDepth:500, filterBase:900, reverb:0.12, pan:0.1 } },
        { instrument:'perc',    steps: SEWERS_PERC_STEPS,   opts:{ gain:0.34, reverb:0.08 } },
        { instrument:'strings', steps: SEWERS_PAD_STEPS,    opts:{ dur:6.5, gain:0.038, attack:1.7, release:2.1, reverb:0.18, voices:4, detune:5, type:'triangle', filterFreq:350 } },
      ],
    },
    rainforest: {
      name: 'The Rainforest',
      bpm: 88, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',     steps: RAINFOREST_BASS_STEPS,     opts:{ dur:0.6, gain:0.15, attack:0.02, release:0.35, filterFreq:300 } },
        { instrument:'birdcall', steps: RAINFOREST_BIRDCALL_STEPS, opts:{ gain:0.12, trill:22, trillDepth:60, reverb:0.22, pan:0.15 } },
        { instrument:'perc',     steps: RAINFOREST_PERC_STEPS,     opts:{ gain:0.4, reverb:0.08 } },
        { instrument:'strings',  steps: RAINFOREST_PAD_STEPS,      opts:{ dur:4.5, gain:0.042, attack:1.2, release:1.6, reverb:0.2, voices:4, detune:6, type:'triangle', filterFreq:520 } },
      ],
    },
    mangroves: {
      name: 'The Mangroves',
      bpm: 62, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: MANGROVES_BASS_STEPS,  opts:{ dur:1, gain:0.14, attack:0.04, release:0.6, filterFreq:250 } },
        { instrument:'creak',   steps: MANGROVES_CREAK_STEPS, opts:{ dur:0.7, gain:0.13, filterQ:12, reverb:0.24, pan:-0.1 } },
        { instrument:'perc',    steps: MANGROVES_PERC_STEPS,  opts:{ gain:0.24, reverb:0.12 } },
        { instrument:'strings', steps: MANGROVES_PAD_STEPS,   opts:{ dur:6.5, gain:0.038, attack:1.8, release:2.2, reverb:0.22, voices:4, detune:5, type:'triangle', filterFreq:440 } },
      ],
    },
    observatory: {
      name: 'Observatory',
      bpm: 72, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',     steps: OBSERVATORY_BASS_STEPS,     opts:{ dur:0.8, gain:0.15, attack:0.03, release:0.5, filterFreq:250 } },
        { instrument:'stardust', steps: OBSERVATORY_STARDUST_STEPS, opts:{ dur:1.3, gain:0.05, twinkles:8, reverb:0.28, pan:0.1 } },
        { instrument:'perc',     steps: OBSERVATORY_PERC_STEPS,     opts:{ gain:0.26, reverb:0.12 } },
        { instrument:'strings',  steps: OBSERVATORY_PAD_STEPS,      opts:{ dur:6, gain:0.038, attack:1.6, release:2, reverb:0.22, voices:4, detune:5, type:'triangle', filterFreq:420 } },
      ],
    },
    orrery: {
      name: 'Orrery',
      bpm: 96, stepsPerBeat: 2, swing: 0, // clockwork()'s ticking IS precision; a swung grid would fight that
      parts: [
        { instrument:'bass',      steps: ORRERY_BASS_STEPS,      opts:{ dur:0.6, gain:0.15, attack:0.02, release:0.35, filterFreq:310 } },
        { instrument:'clockwork', steps: ORRERY_CLOCKWORK_STEPS, opts:{ gain:0.13, ticks:5, startGap:0.09, gapRatio:0.7, reverb:0.12, pan:-0.1 } },
        { instrument:'perc',      steps: ORRERY_PERC_STEPS,      opts:{ gain:0.4, reverb:0.06 } },
        { instrument:'strings',   steps: ORRERY_PAD_STEPS,       opts:{ dur:4, gain:0.045, attack:1, release:1.4, reverb:0.16, voices:4, detune:6, type:'triangle', filterFreq:600 } },
      ],
    },
    voidbetween: {
      name: 'The Void Between',
      bpm: 56, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: VOIDBETWEEN_BASS_STEPS,  opts:{ dur:1.2, gain:0.13, attack:0.05, release:0.7, filterFreq:210 } },
        { instrument:'drift',   steps: VOIDBETWEEN_DRIFT_STEPS, opts:{ dur:4, gain:0.045, panRate:0.15, panDepth:0.6, reverb:0.34, } },
        { instrument:'perc',    steps: VOIDBETWEEN_PERC_STEPS,  opts:{ gain:0.2, reverb:0.14 } },
        { instrument:'strings', steps: VOIDBETWEEN_PAD_STEPS,   opts:{ dur:7.5, gain:0.032, attack:2.1, release:2.6, reverb:0.26, voices:4, detune:4, type:'triangle', filterFreq:340 } },
      ],
    },
    bossroom: {
      name: 'Boss Room',
      bpm: 136, stepsPerBeat: 2, swing: 0, altSectionLoops: 4, // grind/assault sections swap every 4 loops through the 32-step pattern — see BOSSROOM_* above
      parts: [
        { instrument:'bass',    steps: BOSSROOM_BASS_GRIND,   altSteps: BOSSROOM_BASS_ASSAULT,   opts:{ dur:0.32, gain:0.17, attack:0.01, release:0.18, filterFreq:340 } },
        { instrument:'growl',   steps: BOSSROOM_GROWL_GRIND,  altSteps: BOSSROOM_GROWL_ASSAULT,  opts:{ dur:0.13, gain:0.13, attack:0.004, release:0.07, drive:7, filterFreq:1700, reverb:0.06, pan:0 } },
        { instrument:'perc',    steps: BOSSROOM_PERC_GRIND,   altSteps: BOSSROOM_PERC_ASSAULT,   opts:{ gain:0.5, reverb:0.04 } },
        { instrument:'stab',    steps: BOSSROOM_STAB_SILENT,  altSteps: BOSSROOM_STAB_ASSAULT,   opts:{ dur:0.2, gain:0.16, drive:8, filterFreq:2400, reverb:0.1, pan:0 } },
        { instrument:'strings', steps: BOSSROOM_PAD_GRIND,    altSteps: BOSSROOM_PAD_ASSAULT,    opts:{ dur:3.5, gain:0.025, attack:0.8, release:1, reverb:0.1, voices:4, detune:6, type:'sawtooth', filterFreq:400 } },
      ],
    },
    crystalroom: {
      name: 'Crystal Room',
      bpm: 70, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',     steps: CRYSTALROOM_BASS_STEPS,     opts:{ dur:1, gain:0.12, attack:0.05, release:0.6, filterFreq:280 } },
        { instrument:'icechime', steps: CRYSTALROOM_ICECHIME_STEPS, opts:{ dur:1, gain:0.13, release:1.3, tremolo:4, tremoloDepth:0.3, reverb:0.28, pan:0.05 } },
        { instrument:'perc',     steps: CRYSTALROOM_PERC_STEPS,     opts:{ gain:0.22, reverb:0.14 } },
        { instrument:'choir',    steps: CRYSTALROOM_PAD_STEPS,      opts:{ dur:5, gain:0.05, attack:1.3, release:1.8, reverb:0.26 } },
      ],
    },
    sombraroom: {
      name: 'Sombra Room',
      bpm: 66, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: SOMBRAROOM_BASS_STEPS,    opts:{ dur:1, gain:0.13, attack:0.04, release:0.6, filterFreq:230 } },
        { instrument:'ringmod', steps: SOMBRAROOM_RINGMOD_STEPS, opts:{ dur:0.5, gain:0.11, modRatio:1.6, reverb:0.2, pan:-0.1 } },
        { instrument:'perc',    steps: SOMBRAROOM_PERC_STEPS,    opts:{ gain:0.28, reverb:0.12 } },
        { instrument:'strings', steps: SOMBRAROOM_PAD_STEPS,     opts:{ dur:5, gain:0.036, attack:1.5, release:2, reverb:0.22, voices:4, detune:5, type:'triangle', filterFreq:400 } },
      ],
    },
    treasureroom: {
      name: 'Treasure Room',
      bpm: 100, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: TREASUREROOM_BASS_STEPS,    opts:{ dur:0.6, gain:0.15, attack:0.02, release:0.35, filterFreq:320 } },
        { instrument:'trumpet', steps: TREASUREROOM_TRUMPET_STEPS, opts:{ dur:0.5, gain:0.15, attack:0.03, release:0.18, reverb:0.2, pan:0.1, vibrato:5, vibratoDepth:6 } },
        { instrument:'perc',    steps: TREASUREROOM_PERC_STEPS,    opts:{ gain:0.42, reverb:0.08 } },
        { instrument:'strings', steps: TREASUREROOM_PAD_STEPS,     opts:{ dur:3.5, gain:0.045, attack:0.9, release:1.2, reverb:0.16, voices:4, detune:6, type:'triangle', filterFreq:650 } },
      ],
    },
    secretroom: {
      name: 'Secret Room',
      bpm: 64, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: SECRETROOM_BASS_STEPS,   opts:{ dur:1, gain:0.12, attack:0.04, release:0.6, filterFreq:220 } },
        { instrument:'mallet',  steps: SECRETROOM_MALLET_STEPS, opts:{ dur:0.6, gain:0.13, attack:0.003, release:0.45, reverb:0.2, pan:-0.1, filterFreq:1200 } },
        { instrument:'perc',    steps: SECRETROOM_PERC_STEPS,   opts:{ gain:0.22, reverb:0.12 } },
        { instrument:'strings', steps: SECRETROOM_PAD_STEPS,    opts:{ dur:5.5, gain:0.034, attack:1.6, release:2, reverb:0.22, voices:4, detune:4, type:'triangle', filterFreq:360 } },
      ],
    },
    shoproom: {
      name: 'Shop',
      bpm: 108, stepsPerBeat: 2,
      parts: [
        { instrument:'bass',    steps: SHOP_BASS_STEPS,  opts:{ dur:0.5, gain:0.15, attack:0.015, release:0.3, filterFreq:320 } },
        { instrument:'piano',   steps: SHOP_PIANO_STEPS, opts:{ dur:0.5, gain:0.12, release:0.4, reverb:0.1, filterFreq:2600, pan:0.05 } },
        { instrument:'perc',    steps: SHOP_PERC_STEPS,  opts:{ gain:0.4, reverb:0.06 } },
        { instrument:'strings', steps: SHOP_PAD_STEPS,   opts:{ dur:3, gain:0.045, attack:0.7, release:1, reverb:0.14, voices:4, detune:6, type:'triangle', filterFreq:700 } },
      ],
    },
  };

  const MUSIC_LOOKAHEAD = 0.12; // seconds of audio scheduled ahead of "now" on every tick
  const MUSIC_SCHEDULE_INTERVAL = 30; // ms between scheduler wake-ups — comfortably inside the lookahead window
  let musicState = null; // { trackId, track, secPerStep, bus, nextStepTime, stepIndex, timerId }

  // Dispatches one note onto whichever instrument primitive it names.
  // `note` is a frequency (number) for every instrument except 'perc',
  // where it's a kind string ('kick'/'snare'/'hat'/'bonehit'). `delay` is
  // already a seconds-from-now value (converted by the caller from the
  // note's absolute AudioContext schedule time), forwarded straight
  // through to whichever primitive ends up playing it.
  function playMusicNote(instrument, note, opts, delay){
    const merged = { ...opts, delay };
    if (instrument === 'perc') perc(note, merged);
    else if (instrument === 'pluck') pluck(note, merged);
    else if (instrument === 'fm') fm(note, merged);
    else if (instrument === 'bass') bass(note, merged);
    else if (instrument === 'strings') strings(note, merged);
    else if (instrument === 'mallet') mallet(note, merged);
    else if (instrument === 'choir') choir(note, merged);
    else if (instrument === 'piano') piano(note, merged);
    else if (instrument === 'trumpet') trumpet(note, merged);
    else if (instrument === 'zunpet') zunpet(note, merged);
    else if (instrument === 'banjo') banjo(note, merged);
    else if (instrument === 'growl') growl(note, merged);
    else if (instrument === 'stab') stab(note, merged);
    else if (instrument === 'icechime') icechime(note, merged);
    else if (instrument === 'harmonica') harmonica(note, merged);
    else if (instrument === 'flute') flute(note, merged);
    else if (instrument === 'whalecall') whalecall(note, merged);
    else if (instrument === 'gong') gong(note, merged);
    else if (instrument === 'sonarping') sonarping(note, merged);
    else if (instrument === 'ringmod') ringmod(note, merged);
    else if (instrument === 'voidhum') voidhum(note, merged);
    else if (instrument === 'glitch') glitch(note, merged);
    else if (instrument === 'warpsynth') warpsynth(note, merged);
    else if (instrument === 'drip') drip(note, merged);
    else if (instrument === 'sludge') sludge(note, merged);
    else if (instrument === 'birdcall') birdcall(note, merged);
    else if (instrument === 'creak') creak(note, merged);
    else if (instrument === 'stardust') stardust(note, merged);
    else if (instrument === 'clockwork') clockwork(note, merged);
    else if (instrument === 'drift') drift(note, merged);
    else tone(note, { ...merged, type: instrument }); // 'sine'/'triangle'/'organ'/'bell'/'brass'/etc, via tone()'s own periodic-wave dispatch
  }

  // Schedules every part's note (if any — most steps are rests) for one
  // step index at absolute AudioContext time `t0`. A step's value may be a
  // single note or an array of notes (a chord, e.g. CRYPT_PAD_STEPS[0]).
  //
  // Also where the whole engine's "sound more musical, less sequenced"
  // pass lives — four additions layered on top of the plain step-array
  // playback, all driven off `stepIndex`/`track` alone so no existing
  // track's authored data had to change to pick them up:
  //   1. HUMANIZATION — a small random timing jitter (±12ms, never enough
  //      to blur the beat) on every note, so the mechanical step grid
  //      reads as played rather than sequenced.
  //   2. VELOCITY ACCENTING — bar downbeats hit hardest, on-beats
  //      moderate, off-beat subdivisions softest (plus a touch of random
  //      jitter on top), the natural phrasing a flat, unaccented loop
  //      never has.
  //   3. SWING — off-beat subdivisions land a little late, for a
  //      shuffled groove. Defaults ON (a light 0.1) for every track;
  //      individual MUSIC_TRACKS entries opt OUT with an explicit
  //      `swing: 0` where the mechanical precision IS the point (see
  //      bossroom/inferno/orrery/metarealm/hyperspace below).
  //   4. PAD BREATHING — `strings`/`choir` parts get a slow gain swell
  //      keyed off the ever-increasing `stepIndex` (never resets on a
  //      loop boundary), so a sustained chord breathes continuously
  //      across the whole piece instead of repeating on a hard cycle.
  //   5. A/B SECTIONS — a part can carry an optional `altSteps` (same
  //      length as `steps`); every `track.altSectionLoops` loops (4 by
  //      default) through the pattern, playback swaps to `altSteps`
  //      instead for the same span, then swaps back — real verse/chorus
  //      musical FORM instead of one bar repeating forever, opt-in per
  //      part so most tracks are unaffected (see bossroom's `growl`/
  //      `perc`/`stab`/`strings` parts for the one track using it so far).
  function scheduleMusicStep(track, stepIndex, t0, bus, secPerStep){
    const nowDelay = Math.max(0, t0 - ctx.currentTime);
    const stepsPerBeat = track.stepsPerBeat || 1;
    const beatPos = stepIndex % stepsPerBeat;
    const isOnBeat = beatPos === 0;
    const isDownbeat = isOnBeat && Math.floor(stepIndex / stepsPerBeat) % 4 === 0;
    const accent = isDownbeat ? 1.15 : isOnBeat ? 1.0 : 0.88;
    const swingAmt = track.swing !== undefined ? track.swing : 0.1;
    const swingDelay = (!isOnBeat && swingAmt) ? swingAmt * secPerStep * 0.33 : 0;
    const timingJitter = Util.rand(-0.012, 0.012);
    for (const part of track.parts) {
      const len = part.steps.length;
      const idx = stepIndex % len;
      const loopIndex = Math.floor(stepIndex / len);
      const inAltSection = part.altSteps && Math.floor(loopIndex / (track.altSectionLoops || 4)) % 2 === 1;
      const activeSteps = inAltSection ? part.altSteps : part.steps;
      let step = activeSteps[idx];
      // Algorithmic percussion fill — every 4th time through the
      // pattern, the last 4 steps get a hat filled into whatever rests
      // are there, a small "roll into the next bar" so the percussion
      // doesn't loop perfectly identically forever. Only touches actual
      // rests; kicks/snares already written into those steps are left
      // alone.
      if (part.instrument === 'perc' && step == null) {
        if (loopIndex % 4 === 3 && idx >= len - 4) step = 'hat';
      }
      if (step == null) continue; // rest
      const notes = Array.isArray(step) ? step : [step];
      let gainMul = accent * (0.94 + Math.random() * 0.12);
      if (part.instrument === 'strings' || part.instrument === 'choir') {
        gainMul *= 0.88 + 0.12 * Math.sin(stepIndex * 0.05);
      }
      for (const note of notes) {
        const opts = { ...part.opts, bus };
        if (typeof opts.gain === 'number') opts.gain *= gainMul;
        playMusicNote(part.instrument, note, opts, nowDelay + timingJitter + swingDelay);
      }
    }
  }

  // The scheduler tick itself: fills the lookahead window with however
  // many steps fit, then returns — called on a fast setInterval so it
  // runs several times per step even at a brisk tempo, keeping the window
  // topped up. `musicState.nextStepTime` always advances by exactly
  // `secPerStep` per step regardless of how ragged the JS timer firing is,
  // which is what keeps the tempo itself rock-steady.
  function scheduleMusicTick(){
    if (!musicState) return;
    while (musicState.nextStepTime < ctx.currentTime + MUSIC_LOOKAHEAD) {
      scheduleMusicStep(musicState.track, musicState.stepIndex, musicState.nextStepTime, musicState.bus, musicState.secPerStep);
      musicState.nextStepTime += musicState.secPerStep;
      musicState.stepIndex++;
    }
  }

  // Starts (or, if a DIFFERENT track was already playing, cleanly swaps
  // to) a looping background track by id from MUSIC_TRACKS. Idempotent
  // for the SAME track — calling it again while already playing is a
  // no-op — so a call site like game.js's startFloor (once per floor) can
  // just call this unconditionally without tracking "is this already
  // going" itself, the same idempotency startAmbient already offers for
  // the menu drone. Routes every note in the track through one dedicated
  // bus GainNode (see routeOut's `opts.bus`) that fades in over 2s, so the
  // whole track — however many instruments/notes are sounding at once —
  // fades as a single unit.
  function startMusic(trackId){
    const c = ensureCtx(); if (!c) return;
    if (musicState && musicState.trackId === trackId) return;
    if (musicState) stopMusic();
    const track = MUSIC_TRACKS[trackId];
    if (!track) return;
    const bus = c.createGain();
    bus.gain.setValueAtTime(0, c.currentTime);
    bus.gain.linearRampToValueAtTime(1, c.currentTime + 2); // slow fade-in, never a hard start — same spirit as startAmbient
    bus.connect(master);
    const secPerStep = (60 / track.bpm) / (track.stepsPerBeat || 1);
    musicState = { trackId, track, secPerStep, bus, nextStepTime: c.currentTime + 0.1, stepIndex: 0, timerId: null };
    musicState.timerId = setInterval(scheduleMusicTick, MUSIC_SCHEDULE_INTERVAL);
    scheduleMusicTick(); // fill the first lookahead window immediately, don't wait for the first interval tick
  }

  // Fades the current track's bus to 0 over 1.5s (never a hard cut — any
  // note already scheduled just past the stop simply rings out under the
  // fade) and stops the scheduler interval. Safe to call when nothing is
  // playing (matches stopAmbient's shape).
  function stopMusic(){
    if (!musicState) return;
    const { bus, timerId } = musicState;
    clearInterval(timerId);
    if (ctx) {
      const t = ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0, t + 1.5);
      setTimeout(() => { try { bus.disconnect(); } catch (e) { /* ignore */ } }, 1600);
    }
    musicState = null;
  }

  // Read-only listing for UI (see ui/music-test.js's test/preview panel) —
  // `[{id, name}, ...]` for every registered track, `name` falling back to
  // `id` for a track with no `name` field. Never returns the raw
  // `MUSIC_TRACKS` object itself, so a caller can't accidentally mutate a
  // track's step data through it.
  function listMusicTracks(){
    return Object.keys(MUSIC_TRACKS).map(id => ({ id, name: MUSIC_TRACKS[id].name || id }));
  }
  function currentMusicTrackId(){ return musicState ? musicState.trackId : null; }

  /* ---------------- the sound table ---------------- */
  // one short function per named effect — this is the single place to look
  // to tweak or add a sound.
  // Small helper for the redo pass below — a few percussive combat SFX
  // (melee/ranged/hit feedback) get a touch of random stereo spread so
  // repeated hits don't all sit dead-center; never affects timing/gain,
  // purely spatial. Not used on anything where left/right movement should
  // read as meaningful (UI, fanfares, ambient — those stay `pan:0`).
  function scatterPan(spread){ return Util.rand(-spread, spread); }

  const SFX = {
    // ---- pickups ----
    // Combat-critical/high-frequency sounds (coin, key, bombPickup) keep
    // their exact original timing/gain — only a light reverb tail was
    // added, which can't affect responsiveness since it starts exactly
    // when the dry sound does. Reward-flavored pickups (coinLucky, heart,
    // heartContainer, itemGet) were re-timbred with the engine-expansion
    // pass's new forms — bell/organ periodic waves, FM — since those fire
    // rarely enough that a richer, slightly longer sound reads as "special"
    // rather than getting in the way of moment-to-moment pacing.
    coin(){ tone(760, { type:'triangle', dur:0.05, gain:0.22, sweepTo:1100, release:0.06, reverb:0.08 }); },
    coinNickel(){ chord([620,900], { type:'triangle', gain:0.22, dur:0.06, release:0.08, stagger:0.03, reverb:0.1 }); },
    coinDime(){ chord([700,980,1300], { type:'triangle', gain:0.2, dur:0.06, release:0.1, stagger:0.035, reverb:0.12 }); },
    // redone: the sparkle chord is now an FM bell (rarer pickup, brighter
    // metallic "cha-ching") instead of a plain sine chord, through reverb.
    coinLucky(){
      fm(880, { ratio:1.5, index:120, dur:0.14, gain:0.16, release:0.22, reverb:0.3 });
      fm(1318, { ratio:1.5, index:100, dur:0.12, gain:0.12, delay:0.06, release:0.2, reverb:0.3 });
      tone(1760, { type:'sine', gain:0.08, dur:0.12, delay:0.12, release:0.2, reverb:0.2 });
    },
    key(){
      noise({ dur:0.03, gain:0.18, filterFreq:3200, filterType:'highpass', release:0.05, reverb:0.08 });
      tone(1400, { type:'square', dur:0.04, gain:0.12, delay:0.02, release:0.05 });
    },
    bombPickup(){ tone(160, { type:'sine', dur:0.09, gain:0.28, sweepTo:110, release:0.05 }); },
    // redone: 'bell' periodic wave instead of a plain sine chord — a heal
    // reads as a warm chime now rather than a generic pip.
    heart(){ chord([520,780], { type:'bell', gain:0.2, dur:0.14, release:0.18, stagger:0.06, reverb:0.2 }); },
    heartContainer(){ chord([520,780,1040], { type:'bell', gain:0.22, dur:0.16, release:0.24, stagger:0.06, reverb:0.25 }); },
    // redone: 'organ' chord — a fuller, more "solid" pickup feel for
    // items/trinkets/familiars than the old plain sine arpeggio.
    itemGet(){ chord([660,880,1100,1320], { type:'organ', gain:0.15, dur:0.12, release:0.24, stagger:0.055, reverb:0.22 }); },
    sack(){
      noise({ dur:0.06, gain:0.14, filterFreq:600, filterType:'lowpass', release:0.06 });
      chord([500,700,900], { type:'triangle', gain:0.14, dur:0.07, delay:0.05, release:0.14, stagger:0.045, reverb:0.1 });
    },
    battery(){ chord([440,660], { type:'square', gain:0.14, dur:0.08, release:0.16, stagger:0.06, detune:-6 }); },

    // ---- chest / shop ----
    // redone: chestOpen's chime is now 'bell' with real reverb — a chest
    // creaking open in a stone room should sound like it, not a dry pip.
    chestOpen(){
      noise({ dur:0.18, gain:0.2, filterFreq:400, filterType:'lowpass', filterSweepTo:900, release:0.1 });
      chord([700,1050], { type:'bell', gain:0.15, dur:0.1, delay:0.12, release:0.2, stagger:0.05, reverb:0.3 });
    },
    shopBuy(){ chord([660,990], { type:'triangle', gain:0.18, dur:0.07, release:0.12, stagger:0.05, reverb:0.12 }); },
    activeUse(){ chord([500,760,1020], { type:'sine', gain:0.18, dur:0.1, release:0.2, stagger:0.04, reverb:0.15 }); },

    // ---- combat ----
    // Every timing/gain/sweep value below is UNCHANGED from before this
    // pass — these fire constantly and have to stay tight. The only
    // additions are `pan` (a little organic stereo scatter via
    // scatterPan(), so a run of hits doesn't sound like it's coming from
    // one fixed point) and, on the two "something died/got hurt" sounds
    // that already had headroom (enemyDeath/bossDeath), a touch of reverb
    // for weight.
    meleeSwing(){ noise({ dur:0.06, gain:0.16, filterFreq:2200, filterType:'bandpass', filterSweepTo:600, filterQ:0.7, release:0.03, pan:scatterPan(0.25) }); },
    rangedShot(){ tone(900, { type:'sawtooth', dur:0.07, gain:0.14, sweepTo:280, release:0.04, pan:scatterPan(0.2) }); },
    laserShot(){
      tone(1800, { type:'sawtooth', dur:0.1, gain:0.12, sweepTo:900, release:0.06, pan:scatterPan(0.2) });
      noise({ dur:0.08, gain:0.08, filterFreq:4000, filterType:'highpass', release:0.05 });
    },
    enemyHit(){ noise({ dur:0.04, gain:0.16, filterFreq:1400, filterType:'bandpass', release:0.03, pan:scatterPan(0.3) }); },
    crit(){
      noise({ dur:0.05, gain:0.2, filterFreq:1800, filterType:'bandpass', release:0.03, pan:scatterPan(0.3) });
      tone(1500, { type:'square', dur:0.04, gain:0.1, delay:0.01, release:0.04 });
    },
    enemyDeath(){
      noise({ dur:0.12, gain:0.22, filterFreq:900, filterType:'lowpass', filterSweepTo:150, release:0.1, reverb:0.1, pan:scatterPan(0.3) });
      tone(220, { type:'sawtooth', dur:0.1, gain:0.12, sweepTo:60, release:0.08 });
    },
    // redone: the death chord is now 'brass' instead of plain sawtooth —
    // more weight/gravity for a boss kill specifically — through reverb.
    bossDeath(){
      noise({ dur:0.4, gain:0.3, filterFreq:1200, filterType:'lowpass', filterSweepTo:80, release:0.35, reverb:0.25 });
      chord([180,140,90], { type:'brass', gain:0.18, dur:0.32, release:0.35, stagger:0.09, reverb:0.3 });
    },
    playerHurt(){ noise({ dur:0.08, gain:0.24, filterFreq:1000, filterType:'lowpass', filterSweepTo:300, release:0.08 }); },
    shieldBlock(){
      tone(500, { type:'square', dur:0.05, gain:0.18, sweepTo:800, release:0.05 });
      noise({ dur:0.04, gain:0.1, filterFreq:2500, filterType:'highpass', release:0.03 });
    },
    dodge(){ tone(700, { type:'sine', dur:0.06, gain:0.14, sweepTo:1100, release:0.08 }); },
    flashpowder(){ noise({ dur:0.1, gain:0.24, filterFreq:3000, filterType:'highpass', release:0.12 }); },

    // ---- bombs / obstacles ----
    bombPlace(){ tone(300, { type:'square', dur:0.04, gain:0.12, sweepTo:500, release:0.04 }); },
    explosion(){
      noise({ dur:0.32, gain:0.32, filterFreq:1400, filterType:'lowpass', filterSweepTo:90, release:0.3, reverb:0.2 });
      tone(90, { type:'sine', dur:0.28, gain:0.2, release:0.3 });
    },
    // NEW — was called from familiars.js/attackStyles.js (charge-nova
    // procs, familiar burst AoEs) but never defined, so every one of those
    // triggers has been a silent no-op. A tighter, punchier cousin of
    // `explosion` rather than a straight alias — these are short-range
    // proc bursts, not the bomb item's own blast, so the sound reads as
    // "quick shockwave" (fast attack, shorter tail) instead of a slow boom.
    bombExplode(){
      noise({ dur:0.14, gain:0.28, filterFreq:1600, filterType:'lowpass', filterSweepTo:200, release:0.16, reverb:0.15 });
      tone(140, { type:'sine', dur:0.12, gain:0.18, sweepTo:55, release:0.12 });
    },
    obstacleHit(){ noise({ dur:0.05, gain:0.16, filterFreq:2000, filterType:'bandpass', release:0.04 }); },
    obstacleDestroy(){ noise({ dur:0.16, gain:0.22, filterFreq:800, filterType:'lowpass', filterSweepTo:200, release:0.14, reverb:0.1 }); },

    // ---- status effects landing (never fired for bosses — see combat.js) ----
    statusPoison(){ tone(320, { type:'sine', dur:0.09, gain:0.12, sweepTo:220, release:0.1 }); },
    statusStun(){ chord([1200,900], { type:'square', gain:0.1, dur:0.04, release:0.06, stagger:0.05 }); },
    // redone: 'bell' instead of plain sine — an icy shimmer fits freeze
    // better than a soft chord did.
    statusFreeze(){ chord([1600,2000,2400], { type:'bell', gain:0.09, dur:0.08, release:0.14, stagger:0.03, reverb:0.15 }); },
    statusFear(){ tone(180, { type:'sawtooth', dur:0.14, gain:0.12, sweepTo:90, release:0.12 }); },
    statusCharm(){ chord([900,1200], { type:'sine', gain:0.12, dur:0.08, release:0.14, stagger:0.06, reverb:0.1 }); },

    // ---- rooms / progression ----
    // redone: 'brass' instead of triangle — room clear now reads as a
    // small proper fanfare rather than an arpeggiated pip.
    roomClear(){ chord([523,659,784,1046], { type:'brass', gain:0.16, dur:0.14, release:0.24, stagger:0.07, reverb:0.2 }); },
    secretOpen(){ noise({ dur:0.35, gain:0.2, filterFreq:500, filterType:'lowpass', filterSweepTo:150, release:0.3, reverb:0.3 }); },
    // redone: added a low fm() hit under the existing sawtooth chord for
    // extra dread on a boss room's opening sting.
    bossIntro(){
      chord([110,146,110], { type:'sawtooth', gain:0.2, dur:0.3, release:0.2, stagger:0.14 });
      fm(55, { ratio:0.5, index:60, dur:0.4, gain:0.14, release:0.3, reverb:0.25 });
    },
    // redone: 'bell' ascending chord — reads as a magical unlock chime
    // rather than a plain triangle arpeggio.
    unlock(){ chord([660,880,1100,1320,1600], { type:'bell', gain:0.15, dur:0.16, release:0.28, stagger:0.06, reverb:0.28 }); },
    // redone: 'brass' chord underneath, FM bell on top (was a plain sine).
    achievement(){
      chord([523,659,784], { type:'brass', gain:0.17, dur:0.15, release:0.2, stagger:0.08, reverb:0.22 });
      fm(1046, { ratio:1.4, index:130, gain:0.14, dur:0.2, delay:0.24, release:0.3, reverb:0.22 });
    },
    descend(){ tone(500, { type:'sine', dur:0.22, gain:0.16, sweepTo:160, release:0.14, reverb:0.18 }); },
    // redone: 'organ' instead of plain sine — a more mournful, weighty
    // descending chord for a run actually ending.
    gameOver(){ chord([392,349,294,220], { type:'organ', gain:0.2, dur:0.3, release:0.32, stagger:0.18, reverb:0.3 }); },
    // redone: 'brass' — this is the one sound in the whole table that most
    // wants an actual brass-fanfare timbre, and now it has one.
    winFanfare(){ chord([523,659,784,1046,1318], { type:'brass', gain:0.19, dur:0.2, release:0.32, stagger:0.11, reverb:0.28 }); },

    // ---- UI ----
    // Left exactly as before — these need to read as instant/neutral
    // feedback, and reverb or retiming would work against that.
    uiClick(){ tone(700, { type:'square', dur:0.02, gain:0.1, sweepTo:900, release:0.03 }); },
    uiDeny(){ tone(160, { type:'square', dur:0.08, gain:0.14, release:0.05 }); },
    // Phase 6a overhaul — arcade machine's "fair loss" (see shop.js's
    // updateArcadeMachines) — a soft descending tone, deliberately distinct
    // from uiDeny's flat buzz so a gambled loss doesn't read as "you can't
    // do that".
    machineWhiff(){ tone(500, { type:'sine', dur:0.14, gain:0.14, sweepTo:260, release:0.12 }); },

    // engine-expansion pass — new sound-generation forms in use:
    // meta-progression skill points earned (donation drip, bestiary tiers
    // going forward) — a bright, decaying FM bell, deliberately distinct
    // from both 'achievement' (chord fanfare) and 'unlock' (ascending
    // chord) so a passive point trickling in doesn't compete for the same
    // "big moment" attention.
    skillPointGain(){
      fm(1046, { ratio:1.4, index:180, dur:0.16, gain:0.16, release:0.22, reverb:0.25 });
      fm(1568, { ratio:1.4, index:140, dur:0.14, gain:0.1, delay:0.05, release:0.2, reverb:0.25 });
    },
    // capstone/ascension node purchase — a warm periodic-wave organ chord
    // through the reverb send, reads as "a bigger, resonant unlock" next
    // to the plain 'shopBuy'/'achievement' cues ordinary nodes use.
    ascensionChime(){
      chord([220,330,440], { type:'organ', gain:0.16, dur:0.22, release:0.4, stagger:0.06, reverb:0.35 });
    },
    // a plucked-string flourish available for UI moments that want a
    // tactile, physical "pluck" rather than a synthesized tone — e.g. a
    // future harp/string-based cue. Not wired to any event yet; exposed
    // here as the pluck() form's reference SFX.
    stringPluck(freq){ pluck(freq || 440, { dur:0.5, gain:0.22, reverb:0.3 }); },
  };

  // extra args forward straight to the named SFX function (e.g.
  // Sound.play('stringPluck', 660) picks the pitch at the call site)
  // rather than every dynamic-pitch effect needing its own bespoke
  // Sound.<verb>() export.
  function play(name, ...args){
    if (muted) return;
    const fn = SFX[name];
    if (!fn) return;
    try { fn(...args); } catch (e) { /* audio is best-effort; never let it break gameplay */ }
  }

  // The four synth primitives (tone/noise/fm/pluck) plus chord are exposed
  // directly, not just through the named SFX table — lets other systems
  // synthesize a one-off sound tuned to live data (e.g. a pitch derived
  // from floor number or combo count) without needing a canned SFX entry
  // for every possible value. Unlike the table's entries (gated by mute
  // inside play() before fn() is ever called), these run outside play(),
  // so each gets its own mute guard here rather than silently bypassing
  // the mute toggle.
  function guardMute(fn){ return (...args) => { if (!muted) fn(...args); }; }

  return {
    play, unlock, suspend, resume, toggleMute, isMuted, setVolume, getVolume, startAmbient, stopAmbient,
    startMusic, stopMusic, listMusicTracks, currentMusicTrackId,
    tone: guardMute(tone), noise: guardMute(noise), fm: guardMute(fm), pluck: guardMute(pluck), chord: guardMute(chord),
    bass: guardMute(bass), perc: guardMute(perc),
    strings: guardMute(strings), mallet: guardMute(mallet), choir: guardMute(choir),
    piano: guardMute(piano), trumpet: guardMute(trumpet), zunpet: guardMute(zunpet), banjo: guardMute(banjo),
    growl: guardMute(growl), stab: guardMute(stab), icechime: guardMute(icechime),
    harmonica: guardMute(harmonica), flute: guardMute(flute),
    whalecall: guardMute(whalecall), gong: guardMute(gong),
    sonarping: guardMute(sonarping), ringmod: guardMute(ringmod), voidhum: guardMute(voidhum),
    glitch: guardMute(glitch), warpsynth: guardMute(warpsynth),
    drip: guardMute(drip), sludge: guardMute(sludge), birdcall: guardMute(birdcall), creak: guardMute(creak),
    stardust: guardMute(stardust), clockwork: guardMute(clockwork), drift: guardMute(drift),
  };
})();

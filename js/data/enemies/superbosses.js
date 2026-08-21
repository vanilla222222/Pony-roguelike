'use strict';
// data/enemies/superbosses.js — split from enemies.js: SUPERBOSSES.
const SUPERBOSSES = {
  polish:    { id:'polish', name:'Polish DNB', hp:60, dmg:3, speed:80, radius:30,
    color:'#c9a35a', dark:'#8a6a2e', behavior:'bossPolish', icon:'🥊' },
  tyrone:    { id:'tyrone', name:'Tyrone, the DNB King', hp:62, dmg:3, speed:68, radius:33,
    color:'#9c3a3a', dark:'#5c1f1f', behavior:'bossTyrone', icon:'👑' },
  pineapple: { id:'pineapple', name:'Pineapple Gatorade DNB', hp:64, dmg:3, speed:82, radius:29,
    color:'#e0d23a', dark:'#8a7a1e', behavior:'bossPineapple', icon:'🍍' },
  israel:    { id:'israel', name:'Israel DNB', hp:64, dmg:3, speed:82, radius:29,
    color:'#3a6ec9', dark:'#1e3a7a', behavior:'bossIsrael', icon:'⭐' },
  algae:     { id:'algae', name:'Algae DNB', hp:66, dmg:4, speed:72, radius:31,
    color:'#4a9c9c', dark:'#1e4a4a', behavior:'bossAlgae', icon:'🧊' },
  lilac:     { id:'lilac', name:'Lilac DNB', hp:66, dmg:4, speed:76, radius:29,
    color:'#b47ad9', dark:'#5c2e7a', behavior:'bossLilac', icon:'🌸' },

  // ---- 11A / 11B / 12A / 12B / 13 — the drum-and-bass finale set. Raw hp
  // only steps 68 -> 70 -> 76 past Algae/Lilac's 66 ON PURPOSE: bossHpScale
  // (1.28^floorNum) is already ~13x/~17x/~22x at these depths, so authoring
  // "floor 13 sized" numbers here would multiply twice. dmg stays at 4 half-
  // hearts across all five for the same reason — playerDamageAmount adds its
  // own +1 half past the Inferno, so 4 is already 2.5 hearts on contact. ----
  plapper:    { id:'plapper', name:'PlapperDNB', hp:68, dmg:4, speed:74, radius:31,
    color:'#5a4ae0', dark:'#2a1e7a', behavior:'bossPlapper', icon:'🔊' },
  clapper:    { id:'clapper', name:'ClapperDNB', hp:68, dmg:4, speed:88, radius:27,
    color:'#e08a3a', dark:'#7a4414', behavior:'bossClapper', icon:'👏' },
  nhm:        { id:'nhm', name:'NHMDNB', hp:70, dmg:4, speed:60, radius:33,
    color:'#2ec9a0', dark:'#12604c', behavior:'bossNhm', icon:'🎧' },
  vanilladnb: { id:'vanilladnb', name:'VanillaDNB', hp:70, dmg:4, speed:78, radius:30,
    color:'#f0e0c0', dark:'#a08a5a', behavior:'bossVanillaDnb', icon:'🍦' },
  onetruednb: { id:'onetruednb', name:'The One True DNB', hp:76, dmg:4, speed:82, radius:34,
    color:'#ffd447', dark:'#8a6a10', behavior:'bossOneTrueDnb', icon:'🌀' },

  /* ---- C-BRANCH — the alternate path entered from a gate room on floor 2
     (see game.js's descend('C')/floorPath). Its eight floors are labelled
     3C-10C but run on floorNum 2-9, so bossHpScale (1.28^floorNum) hits
     these four at EXACTLY the same multiplier it hits Polish (floorNum 5),
     Tyrone (7), Pineapple (8) and Algae/Lilac (9) — the numbers below are
     therefore authored against those four, a few points hotter each, not
     against the floors-11-13 set. dmg tops out at 4 half-hearts for the
     same reason as the finale set above.
     Every `behavior` here reuses an existing routine from ai.js: no new
     boss AI was written for this branch. ---- */
  drenched:   { id:'drenched', name:'Drenched DNB', hp:62, dmg:3, speed:78, radius:31,
    color:'#4a86c9', dark:'#1e3f6a', behavior:'bossStormbringer', icon:'🌊' },
  brazil:     { id:'brazil', name:'Brazil DNB', hp:68, dmg:4, speed:84, radius:30,
    color:'#3aa85a', dark:'#1a5c2e', behavior:'bossCanopyStalker', icon:'🇧🇷' },
  israelprime:{ id:'israelprime', name:'Israel DNB Prime', hp:72, dmg:4, speed:80, radius:32,
    color:'#5a8ee0', dark:'#22407a', behavior:'bossIsrael', icon:'✡️' },
  kirk:       { id:'kirk', name:'Kirk DNB', hp:78, dmg:4, speed:86, radius:34,
    color:'#c95a3a', dark:'#6a2412', behavior:'bossOneTrueDnb', icon:'🎤' },

  /* ================= PHASE 7a =================================
     Seven new superbosses across three paths. Every `behavior` below reuses
     an existing routine from ai-2/3/4.js — no new boss AI was written, same
     rule the C-branch set above follows.

     STAT CALIBRATION. `hp` here is IDENTITY, not an absolute: entities.js
     multiplies it by bossHpScale (1.28^floorNum), so a number authored
     "floor-sized" would be scaled twice. Each entry below is therefore
     authored against the EXISTING superbosses that sit at a comparable
     relative position, not at a comparable depth:
       - the two main-route entries (floorNum 12/13) sit between the 12A/12B
         pair (hp 70) and The One True DNB (hp 76), so they interpolate;
       - the two C-branch entries (floorNum 9/10) sit between Israel Prime
         (hp 72, floorNum 8) and Kirk (hp 78, now floorNum 11);
       - the three D-branch entries sit at floorNum 4/6/9, i.e. shallower
         than anything above except Polish/Tyrone, so region 1 is authored
         near Polish (hp 60) and the finale near Kirk/One True DNB.
     `dmg` stays at 4 half-hearts at depth for the reason the finale-set
     comment above gives: playerDamageAmount adds its own +1 half past the
     Inferno, so 4 already lands as 2.5 hearts on contact.

     PAIRING DISCIPLINE (same as the branch pairs): where two of these share
     a region, one is the glass cannon (lower hp, higher speed, smaller
     radius, an evasive/blink behavior) and one is the siege body (higher
     hp, lower speed, larger radius, a slam/charge behavior). ============ */

  // ---- Main route, floors 13 and 14 (floorNum 12/13) ----
  wobbler:    { id:'wobbler', name:'WobblerDNB', hp:73, dmg:4, speed:94, radius:27, // glass cannon — blinks, never stands still
    color:'#8a3ae0', dark:'#3e1470', behavior:'bossEclipseWraith', icon:'〰️' },
  subdrop:    { id:'subdrop', name:'SubdropDNB', hp:75, dmg:4, speed:58, radius:35, // siege body — ground slams and charge-dashes
    color:'#c93a5a', dark:'#5e1226', behavior:'bossIronBastion', burstRadius:100, icon:'🔻' },

  // ---- C-branch, 10C and 11C (floorNum 9/10). Kirk keeps 12C. ----
  monsoon:    { id:'monsoon', name:'Monsoon DNB', hp:74, dmg:4, speed:90, radius:28, // glass cannon — fast, erratic, ranged
    color:'#3ac0e0', dark:'#12546a', behavior:'bossBlizzardWraith', icon:'🌀' },
  mangrove:   { id:'mangrove', name:'Mangrove DNB', hp:76, dmg:4, speed:64, radius:34, // siege body — roots you down and grinds
    color:'#8a9c3a', dark:'#3e4a12', behavior:'bossVineHorror', icon:'🌿' },

  /* ---- D-branch — the Planetarium path (4D-10D, floorNum 3-9, see
     stages.js's D_FLOOR_KEYS). One superboss at the END of each of the three
     regions. Star/cosmos flavour throughout, matching D_FLOOR_NAMES.
     Astrolabe (floorNum 4) is authored against Polish (hp 60, floorNum 5) and
     Orrery (floorNum 6) against Tyrone (hp 62, floorNum 7) — the same
     multiplier hits them — while The Singularity is a genuine run finale and
     is authored level with Kirk (78) and above The One True DNB (76). ---- */
  astrolabe:  { id:'astrolabe', name:'Astrolabe DNB', hp:63, dmg:3, speed:88, radius:27, // glass cannon — darting, precise
    color:'#c9b06a', dark:'#6a5a24', behavior:'bossGlassScorpion', icon:'🧭' },
  orrery:     { id:'orrery', name:'Orrery DNB', hp:70, dmg:4, speed:60, radius:34, // siege body — a slow turning machine
    color:'#e0b45a', dark:'#7a5c14', behavior:'bossBrickGolem', icon:'🪐' },
  singularity:{ id:'singularity', name:'The Singularity', hp:79, dmg:4, speed:80, radius:35, // finale — heavy, and it answers damage
    color:'#9ab8ff', dark:'#2a3a7a', behavior:'bossSlagbound', icon:'🌌' },
};
const SUPERBOSS_LIST = Object.values(SUPERBOSSES);

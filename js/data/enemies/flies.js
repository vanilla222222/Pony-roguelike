'use strict';
/* ============================================================
   data/enemies/flies.js — Phase 16. A small stage-agnostic "insect"
   family, requested as six specific archetypes with an explicit Isaac
   reference apiece. `stage:'universal'` (new — see room.js's
   resolveGenericEnemy) makes the five random-eligible ones spawnable
   on ANY main-route floor rather than one stage's two-floor window;
   dnbfly alone opts fully out via `neverRandom:true`.

   Behavior mapping — four of the six needed nothing new at all, only
   a fresh coat of paint on an existing shared behavior:
     dnbredfly      -> 'chaser'  (flies:true)  — the plain slow follow
     dnbyellowjacket -> 'charger' (flies:true) — follow + periodic dash
     dnbnuclearfly  -> 'orbiter' (flies:true)  — tangent-biased strafing
                        reads as "always moving perpendicular to you"
     dnbswarmfly    -> 'swarm'   (flies:true)  — per-instance wander-
                        blended seek already reads as a loose cluster
                        moving toward you as a whole once several spawn
                        together (see `groupSize` below)
   Two new ones (systems/ai-flies.js):
     dnbfly    -> 'aimless' — pure wander, zero seek component at all
     dnbspider -> 'skitter' — erratic start-stop-start bursts, no
                  telegraph, distinct from every dash-with-wind-up
                  behavior already in the game

   `groupSize` (new field, see room.js's populateRoom 'normal' branch)
   — dnbnuclearfly/dnbswarmfly always spawn as a cluster (4 and 6
   respectively) rather than a lone roll, exactly as specified
   ("a group of them always spawns" / "a group ... the whole swarm").

   STAT BAND. All six are meant to read as genuinely weak/fast trash —
   hp 1-3, well under even the lightest legacy roster entry (2-9,
   growth.js) — the threat here is numbers and unpredictability, not
   individual toughness, matching every one of the Isaac archetypes
   they're modeled on.
   ============================================================ */
Object.assign(ENEMY_TYPES, {
  dnbfly: { id:'dnbfly', name:'DNB Fly', hp:1, dmg:0, harmless:true, neverRandom:true, speed:36, radius:6,
    color:'#d8d4c8', dark:'#8a8678', behavior:'aimless', flies:true, xpTier:1, stage:'universal',
    desc:'Deals no damage at all and never appears on its own — it just drifts. Never rolled by a random room; only ever placed deliberately.' },
  dnbredfly: { id:'dnbredfly', name:'DNB Red Fly', hp:2, dmg:1, speed:48, radius:8,
    color:'#c9382e', dark:'#6a1810', behavior:'chaser', flies:true, contactCooldown:0.6, xpTier:1, stage:'universal',
    desc:'A slow, patient follow — nothing more. Weak alone, a real problem once three or four have caught up to you at once.' },
  dnbyellowjacket: { id:'dnbyellowjacket', name:'DNB Yellowjacket', hp:3, dmg:2, speed:58, radius:9,
    color:'#e0c23a', dark:'#7a5e14', behavior:'charger', flies:true, contactCooldown:0.6,
    chargeCooldown:2.4, telegraphTime:0.4, dashDuration:0.3, chargeSpeed:5.2, xpTier:1, stage:'universal',
    desc:'Follows exactly like a Red Fly right up until it doesn\'t — a short telegraph, then a hard committed dash.' },
  dnbnuclearfly: { id:'dnbnuclearfly', name:'DNB Nuclear Fly', hp:2, dmg:2, speed:74, radius:8,
    color:'#8fe030', dark:'#3e6e10', behavior:'orbiter', flies:true, groupSize:4, weight:0.5, contactCooldown:0.5, xpTier:2, stage:'universal',
    desc:'Never approaches head-on — it strafes a tight ring around you, always moving perpendicular to your position. Always found in a pack of four.' },
  dnbswarmfly: { id:'dnbswarmfly', name:'DNB Swarm Fly', hp:1, dmg:1, speed:82, radius:6,
    color:'#e8d23a', dark:'#7a6a18', behavior:'swarm', flies:true, groupSize:6, weight:0.5, driftAmount:0.45, contactCooldown:0.4, xpTier:1, stage:'universal',
    desc:'Spawns six at once and moves as one loose, drifting cloud toward you — individually nothing, together a real problem to stand still near.' },
  dnbspider: { id:'dnbspider', name:'DNB Spider', hp:2, dmg:1, speed:64, radius:8,
    color:'#6a2418', dark:'#2e0f0a', behavior:'skitter', skitterBurstMult:2.6, skitterBurstTime:0.2, skitterPauseMin:0.12, skitterPauseMax:0.35,
    contactCooldown:0.5, xpTier:1, stage:'universal',
    desc:'Scurries at you in quick, erratic bursts with real pauses between them — no wind-up, no telegraph, just start and stop.' },
});

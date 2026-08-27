'use strict';
/* ============================================================
   data/enemies/minibosses.js — Phase 15. The 'miniboss' room's
   occupant pool (see systems/dungeon.js's attachSpecial('miniboss'),
   room.js's populateRoom node.type==='miniboss' branch, and
   entities.js's Miniboss class).

   A miniboss room is a 25%-per-floor OPTIONAL side room (same coin-
   flip shape as petshop/challenge — see dungeon.js's generateDungeon),
   stage-AGNOSTIC on purpose: unlike the trash/boss rosters, which are
   filtered to the current floor's stage, resolveMiniboss() below picks
   uniformly from the full 10-entry roster regardless of what floor
   you're on, and entities.js's Miniboss class (minibossHpScale/
   minibossDmgScale, growth.js) does the actual floor-scaling — so the
   SAME ten can show up on floor 2 or floor 14 and still feel
   appropriately dangerous for that depth. This intentionally mirrors
   how STAR_TYPES/trinkets are floor-agnostic pools already.

   STAT BAND. `hp` here is IDENTITY, exactly like every other roster in
   this directory (see growth.js's header comment) — the four core
   trash rosters top out around 9-11, and BOSS_TYPES sits at 40-58; 16-22
   here is a deliberate step above ANY trash mob and well under a real
   boss, which is the whole point of minibossHpScale being its own
   in-between curve (1.28, vs trash's 1.20 and a boss's 1.36). `dmg` is
   half-hearts, same 4-cap as everywhere else (combat-1.js's
   playerDamageAmount) — 3 is the practical ceiling used here, matching
   the toughest trash and most bosses.

   Behavior functions live in systems/ai-minibosses.js and register
   through ENEMY_BEHAVIOR_HANDLERS (see combat-3.js's registry
   fallback) — no edit to combat-3.js's switch was needed, same as
   every stage4-6/7-9/10-13 content file.
   ============================================================ */
const MINIBOSS_TYPES = {
  mbrustfangprowler: { id:'mbrustfangprowler', name:'The Rustfang Prowler', hp:17, dmg:2, speed:98, radius:17,
    color:'#a8482c', dark:'#4e1e11', behavior:'mbRustfangProwler', xpTier:2,
    desc:'Circles at range, feinting closer, then commits to one long telegraphed lunge before peeling straight back out to range.' },
  mbchainreaver: { id:'mbchainreaver', name:'The Chainbound Reaver', hp:19, dmg:2, speed:66, radius:18,
    color:'#5a5a68', dark:'#26262e', behavior:'mbChainReaver', fireCooldown:2.6, xpTier:2,
    desc:'Keeps its distance and volleys three aimed rounds — but closes into a full charging dash the instant you get near it.' },
  mbcinderduke: { id:'mbcinderduke', name:'Cinderbrand, the Ember Duke', hp:18, dmg:2, speed:60, radius:17,
    color:'#e0662e', dark:'#7a2c10', behavior:'mbCinderDuke', xpTier:2,
    desc:'Walks a slow patrol and drops a smoldering ember behind itself every step — the floor it already crossed is the real threat.' },
  mbstaticchoir: { id:'mbstaticchoir', name:'The Static Choir', hp:16, dmg:2, speed:74, radius:16,
    color:'#8a5ac9', dark:'#3e2668', behavior:'mbStaticChoir', fireCooldown:0.5, xpTier:1,
    desc:'Holds a fixed orbit around you and leaks one crackling bolt per tick off its rotating arm, tracing a slow spiral of shots.' },
  mbmarrowcolossus: { id:'mbmarrowcolossus', name:'The Marrow Colossus', hp:22, dmg:3, speed:38, radius:22,
    color:'#8a8272', dark:'#3e3a30', behavior:'mbMarrowColossus', burstRadius:70, xpTier:2, weight:0.8,
    desc:'A lumbering wall. Every few seconds it winds up and slams, sending a shockwave out and shrapnel flying in every direction.' },
  mbnightglassduelist: { id:'mbnightglassduelist', name:'The Nightglass Duelist', hp:16, dmg:3, speed:80, radius:16,
    color:'#2a2438', dark:'#120e1c', behavior:'mbNightglassDuelist', blinkCooldown:2.4, xpTier:2,
    desc:'Blinks to a point beside you, telegraphs one heavy lunge, then blinks away again before you can answer it.' },
  mbverdantwarden: { id:'mbverdantwarden', name:'The Verdant Warden', hp:20, dmg:2, speed:0, radius:19,
    color:'#3a8a4a', dark:'#194a22', behavior:'mbVerdantWarden', fireCooldown:1.3, xpTier:1, weight:0.8,
    desc:'Rooted. Fires a four-way cross of thorns that rotates a notch each volley, sweeping the whole room over time.' },
  mbriptidehexer: { id:'mbriptidehexer', name:'The Riptide Hexer', hp:17, dmg:2, speed:88, radius:16,
    color:'#3a92c9', dark:'#18415a', behavior:'mbRiptideHexer', fireCooldown:1.9, xpTier:2,
    desc:'Dashes to a fresh spot along the room\'s edge, plants, and fires a wide fanned burst before dashing off to the next one.' },
  mbcinderwingreaper: { id:'mbcinderwingreaper', name:'The Cinderwing Reaper', hp:16, dmg:3, speed:70, radius:16,
    color:'#c9384a', dark:'#5c141e', behavior:'mbCinderwingReaper', flies:true, chargeCooldown:2.2, xpTier:2, weight:0.8,
    desc:'Circles high overhead, then folds its wings into one long diving charge clean across the room before climbing again.' },
  mbhollowsentinel: { id:'mbhollowsentinel', name:'The Hollow Sentinel', hp:18, dmg:2, speed:0, radius:19,
    color:'#8a8a94', dark:'#3e3e46', behavior:'mbHollowSentinel', fireCooldown:0.35, xpTier:1,
    desc:'Rooted and armoured; nothing you throw at it lands. Wait for the plates to open — that\'s the only window it can be hurt in, and the only window it fires back in.' },
};
const MINIBOSS_LIST = Object.values(MINIBOSS_TYPES);

// stage-agnostic on purpose — see the header comment above
function resolveMiniboss(floorNum){
  return Util.choice(MINIBOSS_LIST);
}

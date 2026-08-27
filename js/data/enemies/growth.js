'use strict';
// data/enemies/growth.js — split from enemies.js: hp/dmg growth curves.
'use strict';
/* ============================================================
   enemies.js — enemy, boss, and superboss tables (DNBs — tiny
   brown humanoid raiders). Split out of data.js so tuning a
   monster's stats never means scrolling past classes/items.
   26 enemies per stage for stage 0-2 (6 original + 10 + 10 added),
   plus 2 bosses each: stage 0 = Crypt, stage 1 = Forest, stage 2 =
   Desert. Stage 3 = Inferno (floors 7-9) has 20 enemies of its own —
   it used to have none at all, silently falling back to
   resolveGenericEnemy's "no pool for this stage" branch (any enemy
   from any stage); still has no dedicated bosses of its own for the
   same reason, so resolveGenericBoss's non-superboss Inferno boss
   rooms still draw from every stage's boss pool — see room.js.
   With pools this deep, a uniform per-spawn pick would make every
   room an unreadable smear of eight unrelated creatures, so room.js's
   resolveGenericEnemy rolls a per-room FEATURED bias (1-2 types carry
   most of a room's spawns, the rest stay garnish) — the optional
   `weight` field below is that roll's base weight, default 1.
   behavior keys: chaser, ranged, flyer, bomber, shielded, charger,
   turret, splitter, leaper, plus the extended set — orbiter,
   burrower, summoner, healer, sniper, swarm, ambusher, teleporter,
   shielder, lobber, weaver, sentry. See ai.js for the aiXxx
   functions these dispatch to, and which optional tuning fields
   (shotCount/spreadAngle/boltColor/boltRadius/fireRange/dashDuration
   and the per-behavior ones) each of them actually reads.
   --------------------------------------------------------------- */
/* ---------------------------------------------------------------
   DEPTH SCALING — how a table entry's authored numbers turn into a
   live entity's numbers on floor N. See entities.js's Enemy/Boss
   constructors, which are the only callers.

   The `hp:` values in the tables below are IDENTITY, not absolutes:
   a number on one shared scale that says how tough this thing is
   *relative to every other enemy in the game*, at any depth. A
   Grave Grub is a 3 and a Mosshide is a 9 whether you meet them on
   Floor 1 or Floor 10 — the floor multiplies both, so the Mosshide
   stays exactly 3x the wall the Grub is. That is the whole point of
   making this multiplicative: the old formula ADDED a flat per-floor
   amount to `type.hp`, i.e. the same number of HP to a 2 HP wisp as
   to a 12 HP brute, which squashed their identity ratio toward 1:1
   by the end of a run — and the late-game tables had already been
   hand-authored around that squash, spanning only a few HP across a
   whole roster. (The old formula's exact per-floor constant is NOT
   recoverable — no history in this repo, and the line is already
   replaced — so no figure is cited here. Earlier drafts of this
   comment guessed one; that guess has been removed rather than
   propagated. Same note as entities.js's Enemy constructor.)

   Rounding is deliberate: max HP is always a whole number, because
   the HP bar and `hp <= 0` both read better against integers, while
   incoming damage stays fractional (a 1.5-damage bolt is fine).

   `dmg:` is NOT scaled here — it is a half-heart count and depth is
   applied to it in combat.js's playerDamageAmount instead, so the
   whole damage curve lives in one place.
   --------------------------------------------------------------- */

// Regular enemies: +32% per floor. Fitted, not guessed — with the
// retuned tables below it puts the whole run's total enemy HP at 98%
// of the pre-rebalance game, and Floor 1 / Floor 9 / Floor 10 each
// within 5% of their old room totals. This REDISTRIBUTES difficulty,
// it does not inflate it. It also compounds with the room's enemy
// COUNT budget (room.js: 2 -> 8 enemies over a run), which is why the
// per-enemy rate is this modest.
// "rebalance to make it easier" pass — trash HP growth cut from 1.32 to
// 1.20 (explicit number), so a floor 9 pack ends up at roughly half the
// compounded HP it had before, while floor 1-2 barely moves.
const ENEMY_HP_GROWTH = 1.20;
function enemyHpScale(floorNum){ return Math.pow(ENEMY_HP_GROWTH, floorNum || 0); }

// Bosses now OUTPACE trash growth on purpose (was 1.28, deliberately kept
// close to trash's old 1.32 so the ratio held "roughly steady" — see the
// removed comment below; that's the opposite of what's wanted now). Bosses
// are meant to be the actual difficulty spike, not just a bigger trash mob.
const BOSS_HP_GROWTH = 1.36;
function bossHpScale(floorNum){ return Math.pow(BOSS_HP_GROWTH, floorNum || 0); }
// Boss damage never used to scale with floor at all (see entities.js's Boss
// constructor) — only bossHpScale did, so a floor 1 boss and a floor 12 boss
// hit for the exact same half-hearts, which is a big part of why bosses
// didn't feel like the run's real spike. Kept much gentler than the HP curve
// (hearts are the most punishing resource in the game to scale) — 1.06^12
// is ~2x by the last normal-path floor, 1.06^9 ~1.7x by floor 9A/9B.
const BOSS_DMG_GROWTH = 1.06;
function bossDmgScale(floorNum){ return Math.pow(BOSS_DMG_GROWTH, floorNum || 0); }

// Phase 15 — the miniboss room's occupant (entities.js's Miniboss class)
// sits on its own curve, deliberately between trash (1.20) and a real boss
// (1.36): a miniboss room is optional (25% per floor) and rarer than either
// a guaranteed boss room or the several-per-floor trash packs, so it should
// read as "a real spike, but not THE spike" — hp grows faster than trash so
// it can't be authored as "just a big trash mob", but stays under the boss
// rate so a floor's actual Boss room is never overshadowed by an optional
// side room. Damage reuses bossDmgScale outright — hearts are punishing
// enough that a second, only-slightly-different damage curve isn't worth
// authoring, and "hits about as hard as a boss, but has less HP" is exactly
// the intended miniboss identity (a glass-cannon-ish detour, not a wall).
const MINIBOSS_HP_GROWTH = 1.28;
function minibossHpScale(floorNum){ return Math.pow(MINIBOSS_HP_GROWTH, floorNum || 0); }
function minibossDmgScale(floorNum){ return bossDmgScale(floorNum); }

// Player-side damage that isn't the player's own attack stat has to ride a
// depth curve too, or it silently dies out: a flat 4-damage bomb is a room
// wipe on Floor 1 and a rounding error on Floor 10. Both ride the gentler
// BOSS curve so they stay useful without ever out-scaling actually aiming.
function explosionDamage(floorNum){ return Math.max(1, Math.round(4 * bossHpScale(floorNum))); }
// poison ticks (combat.js updateStatusEffects) and Spiked Barding contact
function statusTickDamage(floorNum){ return Math.max(1, Math.round(0.6 * bossHpScale(floorNum))); }

/* ============================================================
   STAGE DIFFICULTY MULTIPLIER — a second, stage-keyed layer that
   rides ON TOP of the per-floor curves above.

   WHY: the per-floor curves are smooth and content-blind; they say
   nothing about *which* stage you are standing in. The skill tree
   is meant to stop being optional flavor somewhere around the
   Desert, and the only honest way to say that is to make the back
   half of the game harder than its authored numbers alone imply.
   This layer is the single central knob for that, so retuning it
   never means touching one of the ~hundreds of authored enemy,
   boss, or superboss table entries — those stay pure identity.

   THE CURVE (indexed by stages.js's stageIndexForFloor):
     stage 0 (Crypt, floors 0-1)   1.00  <- hard constraint: no change
     stage 1 (Forest, floors 2-3)  1.00  <- hard constraint: no change
     stage 2 (Desert, floors 4-5)  1.18
     stage 3 (Inferno + every branch floor 6-14) 1.30
     stages 4-13 (the Phase 10 floors 15-34)  1.34 .. 1.70, +0.04/stage

   Why the jump 1.00 -> 1.18 -> 1.30 and then only +0.04 a stage: the
   legacy stages 2-3 were authored against a much shorter run and are
   the place the difficulty complaint actually bites, so they take the
   real step. The Phase 10 stages already carry their own steeply
   escalating AUTHORED stats on top of enemyHpScale/bossHpScale (which
   are themselves ~1.20^30 / ~1.36^30 down there); multiplying an
   already-extreme number by another 1.5x would be slapstick, not
   difficulty. The gentle +4%/stage keeps the "later is harder than its
   own baseline" promise without compounding into nonsense.

   WHAT IT TOUCHES: hp (full multiplier), speed and every `*Cooldown`
   tuning field (a 35% share of it, see stageAggressionMult), and trash
   `dmg` (a 50% share, see stageDamageMult). It deliberately does NOT
   push boss dmg: combat-1.js's playerDamageAmount hard-caps ANY single
   hit at 4 hearts, and bossDmgScale alone is already far past that cap
   by the Inferno, so every extra point there would be discarded.

   It composes as a plain extra FACTOR alongside main.js's
   difficultyStatMult (easy 0.75 / normal 1 / hard 1.5) — the two
   multiply, they do not replace each other.
   ------------------------------------------------------------ */
const STAGE_DIFFICULTY_HP = [
  1.00, 1.00,                                     // 0 Crypt, 1 Forest — untouched
  1.18, 1.30,                                     // 2 Desert, 3 Inferno + branches
  1.34, 1.38, 1.42, 1.46, 1.50,                   // 4-8   (Phase 10)
  1.54, 1.58, 1.62, 1.66, 1.70                    // 9-13  (Phase 10)
];
// how much of the HP multiplier's "extra" carries into speed / fire rate.
// Aggression is far more punishing per point than HP is, so it takes a
// share, not the whole thing: at stage 3's 1.30 that is +10.5% speed.
const STAGE_AGGRESSION_SHARE = 0.35;
// and how much carries into trash contact/bolt damage — see the cap note above.
const STAGE_DAMAGE_SHARE = 0.5;

// Defensive `typeof` guard: index.html loads growth.js BEFORE stages.js.
// Function declarations make that irrelevant at call time (nothing here runs
// during load), but the guard means a future load-order change degrades to
// "no stage multiplier" instead of throwing mid-spawn.
function stageDifficultyMult(floorNum){
  if (typeof stageIndexForFloor !== 'function') return 1;
  const si = stageIndexForFloor(floorNum || 0);
  if (!(si >= 2)) return 1; // stages 0-1 are byte-for-byte unchanged
  const m = STAGE_DIFFICULTY_HP[si];
  return (typeof m === 'number') ? m : STAGE_DIFFICULTY_HP[STAGE_DIFFICULTY_HP.length - 1];
}
function stageAggressionMult(floorNum){
  return 1 + (stageDifficultyMult(floorNum) - 1) * STAGE_AGGRESSION_SHARE;
}
function stageDamageMult(floorNum){
  return 1 + (stageDifficultyMult(floorNum) - 1) * STAGE_DAMAGE_SHARE;
}

// The AI functions read cooldown tunings straight off the shared type object
// (`t.fireCooldown || 1.5`, in a few hundred places across ai-*.js), so the
// only non-invasive way to speed a stage's roster up is to hand the spawned
// entity a retuned COPY of its type. Shallow copy, every own key preserved,
// only `*Cooldown` numbers divided — nothing in the codebase compares enemy
// type objects by identity (checked), and `name`/`behavior`/everything else
// come across untouched.
// On stages 0-1 the multiplier is exactly 1 and the ORIGINAL object is
// returned by reference, so the early game allocates nothing new and cannot
// drift by even a float.
function stageTunedType(type, floorNum){
  const a = stageAggressionMult(floorNum);
  if (!type || !(a > 1)) return type;
  const out = {};
  const keys = Object.keys(type);
  for (let i = 0; i < keys.length; i++){
    const k = keys[i], v = type[k];
    out[k] = (typeof v === 'number' && k.length > 8 && k.slice(-8) === 'Cooldown') ? v / a : v;
  }
  return out;
}


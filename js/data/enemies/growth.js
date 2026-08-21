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

// Player-side damage that isn't the player's own attack stat has to ride a
// depth curve too, or it silently dies out: a flat 4-damage bomb is a room
// wipe on Floor 1 and a rounding error on Floor 10. Both ride the gentler
// BOSS curve so they stay useful without ever out-scaling actually aiming.
function explosionDamage(floorNum){ return Math.max(1, Math.round(4 * bossHpScale(floorNum))); }
// poison ticks (combat.js updateStatusEffects) and Spiked Barding contact
function statusTickDamage(floorNum){ return Math.max(1, Math.round(0.6 * bossHpScale(floorNum))); }


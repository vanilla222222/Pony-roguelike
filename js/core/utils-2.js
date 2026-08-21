'use strict';
// core/utils-2.js — split from utils.js: Util (part 2/2) + bfs helpers.
Object.assign(Util, {

  // TURRET — a stationary totem, not a raider. See enemies.js's
  // graveturret/cactusturret (behavior:'turret', speed:0).
  _turretStatic(ctx, e, flash){
    const col = flash ? Theme.enemy.flash : e.color;
    const dark = flash ? Theme.enemy.flashSoft : e.dark;
    const r = e.radius;
    ctx.fillStyle = Theme.shadow.groundSoft;
    ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.75, r * 0.7, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flash ? Theme.enemy.flashSoft : Util.bodyShade(ctx, e.x, e.y + r * 0.35, r * 0.5, dark);
    ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.5, r * 0.5, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flash ? Theme.enemy.flash : Util.bodyShade(ctx, e.x, e.y, r * 0.7, col);
    ctx.beginPath();
    ctx.moveTo(e.x - r * 0.45, e.y + r * 0.5);
    ctx.lineTo(e.x - r * 0.3, e.y - r * 0.6);
    ctx.lineTo(e.x + r * 0.3, e.y - r * 0.6);
    ctx.lineTo(e.x + r * 0.45, e.y + r * 0.5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.stroke();
  },

  // the bakeable half of a raider: arms, torso, head, tufts, eyes and the
  // archetype's non-animated gear. Everything animated stays in the caller.
  _humanoidStatic(ctx, e, flash){
    const col = flash ? Theme.enemy.flash : e.color;
    const dark = flash ? Theme.enemy.flashSoft : e.dark;
    const r = e.radius;
    const behavior = e.behavior || '';

    ctx.strokeStyle = dark; ctx.lineWidth = Math.max(2, r * 0.22);
    ctx.beginPath(); ctx.moveTo(e.x - r * 0.55, e.y - r * 0.1); ctx.lineTo(e.x - r * 0.9, e.y + r * 0.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(e.x + r * 0.55, e.y - r * 0.1); ctx.lineTo(e.x + r * 0.9, e.y + r * 0.35); ctx.stroke();

    const bodyFill = flash ? col : Util.bodyShade(ctx, e.x, e.y - r * 0.3, r, col);
    ctx.fillStyle = bodyFill;
    ctx.beginPath(); ctx.ellipse(e.x, e.y, r * 0.62, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    const hx = e.x, hy = e.y - r * 0.75;
    ctx.beginPath(); ctx.arc(hx, hy, r * 0.5, 0, Math.PI * 2); ctx.fill();

    // a soft top-lit rim stroke on the torso — same "sunlit facet" touch
    // added to rocks/items this pass, cheap here since it's baked once per
    // sprite rather than drawn live. Placed before the behavior-gear chain
    // below so gear always draws on top of it, never under.
    if (!flash) {
      ctx.strokeStyle = Theme.shadow.rim; ctx.lineWidth = Math.max(1, r * 0.1);
      ctx.beginPath(); ctx.ellipse(e.x, e.y, r * 0.6, r * 0.82, 0, Math.PI * 1.12, Math.PI * 1.62); ctx.stroke();
    }

    // leafy tufts — Sapling/Sprout only, a small nod to their plant flavor
    // without abandoning the shared raider silhouette
    if (!flash && e.type && (e.type.id === 'sapling' || e.type.id === 'sprout')) {
      ctx.fillStyle = Util.shadeColor(col, 0.35);
      ctx.beginPath(); ctx.ellipse(hx - r * 0.2, hy - r * 0.4, r * 0.16, r * 0.08, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx + r * 0.2, hy - r * 0.4, r * 0.16, r * 0.08, 0.5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = Theme.enemy.eye;
    ctx.beginPath(); ctx.arc(e.x - r * 0.18, e.y - r * 0.78, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.x + r * 0.18, e.y - r * 0.78, r * 0.08, 0, Math.PI * 2); ctx.fill();

    // ---- behavior gear, drawn on top of the base body/head ----
    if (behavior === 'shielded') {
      // helmet band always shows (marks the archetype); the physical shield
      // itself only shows up while actually shielded, so its vulnerable
      // window (see combat.js) reads as "shield's down", not just a color ring
      ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1.5, r * 0.12);
      ctx.beginPath(); ctx.arc(hx, hy, r * 0.53, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      if (e.shielded) {
        const sx = e.x + r * 0.68, sy = e.y + r * 0.05;
        ctx.fillStyle = flash ? Theme.enemy.flashSoft : Util.bodyShade(ctx, sx, sy, r * 0.48, dark);
        ctx.beginPath(); ctx.arc(sx, sy, r * 0.48, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = Theme.shadow.sheen; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = flash ? Theme.enemy.flash : col; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx - r * 0.28, sy); ctx.lineTo(sx + r * 0.28, sy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx, sy - r * 0.28); ctx.lineTo(sx, sy + r * 0.28); ctx.stroke();
      }
    } else if (behavior === 'charger') {
      ctx.fillStyle = flash ? Theme.enemy.flashSoft : Theme.pony.chargerHorn;
      ctx.beginPath(); ctx.moveTo(hx - r * 0.35, hy - r * 0.15); ctx.lineTo(hx - r * 0.6, hy - r * 0.48); ctx.lineTo(hx - r * 0.12, hy - r * 0.32); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx + r * 0.35, hy - r * 0.15); ctx.lineTo(hx + r * 0.6, hy - r * 0.48); ctx.lineTo(hx + r * 0.12, hy - r * 0.32); ctx.closePath(); ctx.fill();
    } else if (behavior === 'ranged') {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(hx - r * 0.48, hy - r * 0.08);
      ctx.lineTo(hx, hy - r * 0.85);
      ctx.lineTo(hx + r * 0.48, hy - r * 0.08);
      ctx.quadraticCurveTo(hx, hy - r * 0.22, hx - r * 0.48, hy - r * 0.08);
      ctx.fill();
      ctx.fillStyle = Util.shadeColor(dark, 0.25);
      ctx.beginPath(); ctx.ellipse(e.x - r * 0.75, e.y + r * 0.25, r * 0.2, r * 0.26, 0.3, 0, Math.PI * 2); ctx.fill();

    /* ---- marks for the extended behavior set (see ai.js) ----
       Without these every one of the twelve renders as the identical
       default raider and the player can't tell a healer from a chaser,
       which is a readability problem, not a cosmetic one. Deliberately
       cheap — a handful of paths each. Every one is keyed off `behavior`
       alone (plus col/dark/r, which are already in the sprite cache key),
       so nothing here can serve a stale bake. No raw colour literals:
       tints are derived from the enemy's own col/dark, or come from an
       existing Theme token where the mark has a shared meaning. */
    } else if (behavior === 'orbiter') {
      // a tilted ring around the head — it circles you, so it wears a circle
      ctx.strokeStyle = flash ? Theme.enemy.flashSoft : Util.shadeColor(col, 0.45);
      ctx.lineWidth = Math.max(1.2, r * 0.1);
      ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.15, r * 0.78, r * 0.3, -0.35, 0, Math.PI * 2); ctx.stroke();
    } else if (behavior === 'burrower') {
      // outsized digging claws either side of the body
      ctx.fillStyle = flash ? Theme.enemy.flashSoft : Util.shadeColor(dark, 0.3);
      ctx.beginPath(); ctx.moveTo(e.x - r * 0.75, e.y + r * 0.1); ctx.lineTo(e.x - r * 1.15, e.y + r * 0.5); ctx.lineTo(e.x - r * 0.6, e.y + r * 0.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(e.x + r * 0.75, e.y + r * 0.1); ctx.lineTo(e.x + r * 1.15, e.y + r * 0.5); ctx.lineTo(e.x + r * 0.6, e.y + r * 0.5); ctx.closePath(); ctx.fill();
    } else if (behavior === 'summoner') {
      // a staff with a lit orb — the "it makes more of them" tell
      ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1.5, r * 0.13);
      ctx.beginPath(); ctx.moveTo(e.x + r * 0.9, e.y + r * 0.55); ctx.lineTo(e.x + r * 0.72, hy - r * 0.5); ctx.stroke();
      ctx.fillStyle = flash ? Theme.enemy.flash : Util.shadeColor(col, 0.55);
      ctx.beginPath(); ctx.arc(e.x + r * 0.72, hy - r * 0.62, r * 0.2, 0, Math.PI * 2); ctx.fill();
    } else if (behavior === 'healer') {
      // a plain cross on the chest, in the shared heal green
      ctx.fillStyle = flash ? Theme.enemy.flashSoft : Theme.particle.heal;
      ctx.fillRect(e.x - r * 0.09, e.y - r * 0.32, r * 0.18, r * 0.6);
      ctx.fillRect(e.x - r * 0.3, e.y - r * 0.11, r * 0.6, r * 0.18);
    } else if (behavior === 'sniper') {
      // a long barrel braced across the body
      ctx.strokeStyle = flash ? Theme.enemy.flashSoft : Util.shadeColor(dark, 0.2);
      ctx.lineWidth = Math.max(1.5, r * 0.16);
      ctx.beginPath(); ctx.moveTo(e.x - r * 1.0, e.y + r * 0.35); ctx.lineTo(e.x + r * 1.1, e.y - r * 0.35); ctx.stroke();
      ctx.fillStyle = flash ? Theme.enemy.flash : Util.shadeColor(col, 0.5);
      ctx.beginPath(); ctx.arc(e.x + r * 0.35, e.y - r * 0.12, r * 0.13, 0, Math.PI * 2); ctx.fill();
    } else if (behavior === 'swarm') {
      // a few motes buzzing over the head
      ctx.fillStyle = flash ? Theme.enemy.flashSoft : Util.shadeColor(col, 0.5);
      ctx.beginPath(); ctx.arc(hx - r * 0.42, hy - r * 0.62, r * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + r * 0.06, hy - r * 0.84, r * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + r * 0.46, hy - r * 0.55, r * 0.1, 0, Math.PI * 2); ctx.fill();
    } else if (behavior === 'ambusher') {
      // hunched back spines — reads as "coiled", not "patrolling"
      ctx.fillStyle = flash ? Theme.enemy.flashSoft : Util.shadeColor(dark, 0.15);
      for (let i = 0; i < 3; i++) {
        const sx = e.x + (i - 1) * r * 0.42, sy = e.y - r * 0.35;
        ctx.beginPath(); ctx.moveTo(sx - r * 0.13, sy); ctx.lineTo(sx, sy - r * 0.42); ctx.lineTo(sx + r * 0.13, sy); ctx.closePath(); ctx.fill();
      }
    } else if (behavior === 'teleporter') {
      // floating diamonds — one over the head, one on the chest
      ctx.fillStyle = flash ? Theme.enemy.flash : Util.shadeColor(col, 0.55);
      const diamond = (cx, cy, s) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s * 0.62, cy); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s * 0.62, cy);
        ctx.closePath(); ctx.fill();
      };
      diamond(hx, hy - r * 0.78, r * 0.26);
      diamond(e.x, e.y, r * 0.2);
    } else if (behavior === 'shielder') {
      // a full ring around the body — the aura it projects onto its allies.
      // (distinct from 'shielded', which wears a helmet band and a buckler)
      ctx.strokeStyle = flash ? Theme.enemy.flashSoft : Theme.status.shieldRing;
      ctx.lineWidth = Math.max(1.2, r * 0.1);
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 1.05, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = flash ? Theme.enemy.flash : Util.shadeColor(col, 0.4); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.86, 0, Math.PI * 2); ctx.stroke();
    } else if (behavior === 'lobber') {
      // a stubby mortar tube canted skyward
      ctx.strokeStyle = flash ? Theme.enemy.flashSoft : Util.shadeColor(dark, 0.1);
      ctx.lineWidth = Math.max(2, r * 0.26);
      ctx.beginPath(); ctx.moveTo(e.x + r * 0.25, e.y + r * 0.4); ctx.lineTo(e.x + r * 0.85, e.y - r * 0.5); ctx.stroke();
      ctx.fillStyle = flash ? Theme.enemy.flash : Util.shadeColor(col, 0.45);
      ctx.beginPath(); ctx.arc(e.x + r * 0.92, e.y - r * 0.62, r * 0.16, 0, Math.PI * 2); ctx.fill();
    } else if (behavior === 'weaver') {
      // a sine squiggle across the chest — the shape of its approach
      ctx.strokeStyle = flash ? Theme.enemy.flashSoft : Util.shadeColor(col, 0.5);
      ctx.lineWidth = Math.max(1.2, r * 0.11);
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const px = e.x - r * 0.5 + (r * i) / 12;
        const py = e.y - r * 0.05 + Math.sin((i / 12) * Math.PI * 2) * r * 0.24;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (behavior === 'sentry') {
      // one big unblinking eye — it's watching whether you move
      ctx.fillStyle = flash ? Theme.enemy.flashSoft : Theme.pony.eyeWhite;
      ctx.beginPath(); ctx.ellipse(e.x, e.y - r * 0.05, r * 0.4, r * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? Theme.enemy.flash : Theme.pony.pupil;
      ctx.beginPath(); ctx.arc(e.x, e.y - r * 0.05, r * 0.15, 0, Math.PI * 2); ctx.fill();
    } else if (behavior === 'skirmisher') {
      // a double chevron on the chest — the hit-and-run "dash in, dash out" tell
      ctx.strokeStyle = flash ? Theme.enemy.flashSoft : Util.shadeColor(col, 0.5);
      ctx.lineWidth = Math.max(1.2, r * 0.11);
      ctx.beginPath(); ctx.moveTo(e.x - r * 0.3, e.y - r * 0.25); ctx.lineTo(e.x, e.y - r * 0.02); ctx.lineTo(e.x - r * 0.3, e.y + r * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(e.x + r * 0.05, e.y - r * 0.25); ctx.lineTo(e.x + r * 0.35, e.y - r * 0.02); ctx.lineTo(e.x + r * 0.05, e.y + r * 0.2); ctx.stroke();
    } else if (behavior === 'whiplash') {
      // a long trailing lash line off one side — the extended reach it hits with
      ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1.5, r * 0.1);
      ctx.beginPath();
      ctx.moveTo(e.x + r * 0.6, e.y + r * 0.2);
      ctx.quadraticCurveTo(e.x + r * 1.3, e.y - r * 0.1, e.x + r * 1.55, e.y - r * 0.55);
      ctx.stroke();
    }
  },

  // `bakeScale` (optional) is the caller's device pixel scale — pass it to opt
  // into the pre-baked sprite path above. Callers that omit it (the room
  // editor) get the original all-live drawing, unchanged.
  drawBrownHumanoid(ctx, e, flash, forceHealthBar, now, moving, bakeScale){
    now = now || 0;
    const col = flash ? Theme.enemy.flash : e.color;
    const dark = flash ? Theme.enemy.flashSoft : e.dark;
    const r = e.radius;
    const behavior = e.behavior || '';
    const isBoss = !!e.isBoss;
    const isSuper = isBoss && e.type && !!e.type.icon;
    const baked = !!bakeScale && !isBoss;

    if (behavior === 'turret') {
      if (baked) Util._blitSprite(ctx, Util._humanoidSprite(e, flash, bakeScale), e, bakeScale);
      else Util._turretStatic(ctx, e, flash);
      const pulse = 0.6 + Math.sin(now / 200) * 0.4;
      const glowCol = flash ? Theme.enemy.flash : Util.shadeColor(col, 0.6);
      ctx.save();
      ctx.shadowColor = glowCol; ctx.shadowBlur = 6 + 6 * pulse;
      ctx.fillStyle = glowCol;
      ctx.beginPath(); ctx.arc(e.x, e.y - r * 0.55, Math.max(1, r * 0.16 * pulse), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if ((e.maxHp > 3 || (forceHealthBar && e.maxHp > 0)) && !isBoss) Util.drawEnemyHealthBar(ctx, e);
      return;
    }

    // `flies` (entities.js copies it off the type) is the authority on being
    // airborne — orbiters carry it too, and used to get a grounded walk cycle
    const flyer = behavior === 'flyer' || !!e.flies;
    // shadow — flyers float, so their shadow sits lower/smaller (reads as
    // airborne) than a grounded raider's
    ctx.fillStyle = Theme.shadow.ground;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + r * (flyer ? 0.95 : 0.7), r * (flyer ? 0.55 : 0.8), r * (flyer ? 0.16 : 0.28), 0, 0, Math.PI * 2);
    ctx.fill();

    const phase = (e.x + e.y) * 0.05;
    if (flyer) {
      // wings instead of legs — small membrane flaps, faster when moving
      const flap = Math.sin(now / (moving ? 90 : 260) + phase) * (moving ? 0.45 : 0.15);
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = flash ? Theme.enemy.flash : Util.shadeColor(col, -0.1);
      ctx.beginPath(); ctx.ellipse(e.x - r * 0.55, e.y - r * 0.15, r * 0.42, r * 0.18, -0.5 + flap, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(e.x + r * 0.55, e.y - r * 0.15, r * 0.42, r * 0.18, 0.5 - flap, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // legs — a small walk cycle while moving, a gentle idle sway otherwise
      const swing = moving ? Math.sin(now / 110 + phase) * r * 0.22 : Math.sin(now / 700 + phase) * r * 0.03;
      ctx.fillStyle = flash ? Theme.enemy.flashSoft : Util.shadeColor(dark, -0.15);
      ctx.beginPath(); ctx.ellipse(e.x - r * 0.3, e.y + r * 0.55 + swing, r * 0.22, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(e.x + r * 0.3, e.y + r * 0.55 - swing, r * 0.22, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }

    if (baked) Util._blitSprite(ctx, Util._humanoidSprite(e, flash, bakeScale), e, bakeScale);
    else Util._humanoidStatic(ctx, e, flash);

    const hx = e.x, hy = e.y - r * 0.75;

    /* ---- live gear flourishes ------------------------------------
       One small animated accent per behavior, drawn ON TOP of the body
       (blitted or live) so it composes either way. These deliberately
       live here and not in _humanoidStatic: anything time-varying baked
       into the sprite would freeze on its first frame, and anything that
       widened the sprite-cache key would multiply the bake count.
       They use only `now` and the existing `phase` de-sync value (plus
       AI timers that already exist on the entity), so no new per-enemy
       state is introduced — and every one is sane at now === 0, which is
       what the room editor passes.
       -------------------------------------------------------------- */
    const gearLit = flash ? Theme.enemy.flash : Util.shadeColor(col, 0.55);
    if (behavior === 'shielded') {
      // a sheen sweeping around the buckler rim
      if (e.shielded) {
        const sx = e.x + r * 0.68, sy = e.y + r * 0.05;
        const a = now / 900 + phase;
        ctx.save();
        ctx.strokeStyle = Theme.shadow.sheen; ctx.lineWidth = Math.max(1.2, r * 0.1);
        ctx.beginPath(); ctx.arc(sx, sy, r * 0.36, a, a + 0.7); ctx.stroke();
        ctx.restore();
      }
    } else if (behavior === 'charger') {
      // horns simmering — an alpha/glow pulse traced over the static pair
      const p = 0.5 + 0.5 * Math.sin(now / 260 + phase);
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.35 * p;
      ctx.strokeStyle = flash ? Theme.enemy.flash : Theme.pony.chargerHorn;
      ctx.lineWidth = Math.max(1, r * 0.08);
      ctx.shadowColor = Theme.pony.chargerHorn; ctx.shadowBlur = 3 + 5 * p;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(hx + s * r * 0.35, hy - r * 0.15);
        ctx.lineTo(hx + s * r * 0.6, hy - r * 0.48);
        ctx.lineTo(hx + s * r * 0.12, hy - r * 0.32);
        ctx.closePath(); ctx.stroke();
      }
      ctx.restore();
    } else if (behavior === 'ranged') {
      // two arrow shafts poking out of the quiver, swaying as it walks
      const qx = e.x - r * 0.75, qy = e.y + r * 0.25;
      const sway = Math.sin(now / 420 + phase) * r * 0.07;
      ctx.save();
      ctx.strokeStyle = flash ? Theme.enemy.flashSoft : Util.shadeColor(dark, 0.4);
      ctx.lineWidth = Math.max(1, r * 0.07); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(qx - r * 0.06, qy - r * 0.16); ctx.lineTo(qx - r * 0.06 + sway, qy - r * 0.46); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(qx + r * 0.08, qy - r * 0.14); ctx.lineTo(qx + r * 0.08 + sway * 0.65, qy - r * 0.4); ctx.stroke();
      ctx.restore();
    } else if (behavior === 'orbiter') {
      // a bead running around the static tilted ring — the ring reads as
      // spinning without re-stroking the whole ellipse every frame
      const a = now / 600 + phase;
      const ux = Math.cos(a) * r * 0.78, uy = Math.sin(a) * r * 0.3;
      const ct = 0.9394, st = -0.3428; // cos/sin of the ring's -0.35 tilt
      const bx = hx + ux * ct - uy * st, by = hy - r * 0.15 + ux * st + uy * ct;
      ctx.save();
      ctx.fillStyle = gearLit; ctx.shadowColor = gearLit; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(bx, by, r * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (behavior === 'burrower') {
      // claw tips flexing open and shut
      const tw = Math.sin(now / 200 + phase) * 0.18;
      ctx.save();
      ctx.strokeStyle = flash ? Theme.enemy.flash : Util.shadeColor(dark, 0.45);
      ctx.lineWidth = Math.max(1, r * 0.1); ctx.lineCap = 'round';
      for (const s of [-1, 1]) {
        const bx2 = e.x + s * r * 0.7, by2 = e.y + r * 0.2;
        const a = s === 1 ? 0.5 + tw : Math.PI - 0.5 - tw;
        ctx.beginPath(); ctx.moveTo(bx2, by2); ctx.lineTo(bx2 + Math.cos(a) * r * 0.42, by2 + Math.sin(a) * r * 0.42); ctx.stroke();
      }
      ctx.restore();
    } else if (behavior === 'summoner') {
      // the staff orb breathing
      const pulse = 0.6 + Math.sin(now / 240 + phase) * 0.4;
      ctx.save();
      ctx.fillStyle = gearLit; ctx.shadowColor = gearLit; ctx.shadowBlur = 5 + 7 * pulse;
      ctx.beginPath(); ctx.arc(e.x + r * 0.72, hy - r * 0.62, Math.max(1, r * 0.14 * pulse), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (behavior === 'healer') {
      // a halo over the chest cross. ai.js counts e.healTimer down to 0 and
      // only resets it when it actually heals someone, so <= 0 means "pumping
      // right now" — beat faster and brighter then. undefined (room editor)
      // falls through to the calm ambient rate.
      const ready = typeof e.healTimer === 'number' && e.healTimer <= 0;
      const pulse = 0.5 + 0.5 * Math.sin(now / (ready ? 160 : 460) + phase);
      ctx.save();
      ctx.globalAlpha = (ready ? 0.3 : 0.16) + 0.3 * pulse;
      ctx.strokeStyle = flash ? Theme.enemy.flashSoft : Theme.particle.heal;
      ctx.lineWidth = Math.max(1, r * 0.09);
      ctx.shadowColor = Theme.particle.heal; ctx.shadowBlur = 4 + 6 * pulse;
      ctx.beginPath(); ctx.arc(e.x, e.y, r * (0.44 + 0.08 * pulse), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    } else if (behavior === 'sniper') {
      // the scope lens catching the light every couple of seconds
      const t = ((now + phase * 400) % 2400) / 2400;
      if (t < 0.12) {
        const k = Math.sin((t / 0.12) * Math.PI);
        ctx.save();
        ctx.globalAlpha = k;
        ctx.fillStyle = Theme.shadow.glint; ctx.shadowColor = Theme.shadow.glint; ctx.shadowBlur = 6 * k;
        ctx.beginPath(); ctx.arc(e.x + r * 0.35, e.y - r * 0.12, r * 0.07, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    } else if (behavior === 'swarm') {
      // motes actually circling the head (the static trio reads as the rest
      // of the cloud they're weaving through)
      ctx.save();
      ctx.fillStyle = gearLit;
      for (let i = 0; i < 3; i++) {
        const a = now / 520 + phase + (i * Math.PI * 2) / 3;
        const mx2 = hx + Math.cos(a) * r * 0.5;
        const my2 = hy - r * 0.68 + Math.sin(a) * r * 0.22;
        ctx.beginPath(); ctx.arc(mx2, my2, r * 0.09, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    } else if (behavior === 'ambusher') {
      // back spines shimmering, staggered so the ripple travels along them
      ctx.save();
      ctx.fillStyle = flash ? Theme.enemy.flash : Util.shadeColor(dark, 0.5);
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.12 + 0.3 * (0.5 + 0.5 * Math.sin(now / 300 + phase + i * 0.9));
        const sx = e.x + (i - 1) * r * 0.42, sy = e.y - r * 0.35;
        ctx.beginPath(); ctx.moveTo(sx - r * 0.13, sy); ctx.lineTo(sx, sy - r * 0.42); ctx.lineTo(sx + r * 0.13, sy); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    } else if (behavior === 'teleporter') {
      // each diamond sheds an expanding, fading echo — the blink, telegraphed
      const t = ((now / 1100 + phase) % 1 + 1) % 1;
      ctx.save();
      ctx.globalAlpha = 0.55 * (1 - t);
      ctx.strokeStyle = gearLit; ctx.lineWidth = Math.max(1, r * 0.06);
      const echo = (cx, cy, s) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s * 0.62, cy); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s * 0.62, cy);
        ctx.closePath(); ctx.stroke();
      };
      echo(hx, hy - r * 0.78, r * (0.26 + 0.34 * t));
      echo(e.x, e.y, r * (0.2 + 0.26 * t));
      ctx.restore();
    } else if (behavior === 'shielder') {
      // the projected aura breathing between its two static rings
      const p = 0.5 + 0.5 * Math.sin(now / 520 + phase);
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.4 * (1 - p);
      ctx.strokeStyle = flash ? Theme.enemy.flash : Theme.status.shieldRing;
      ctx.lineWidth = Math.max(1, r * 0.08);
      ctx.beginPath(); ctx.arc(e.x, e.y, r * (0.86 + 0.19 * p), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    } else if (behavior === 'lobber') {
      // muzzle glow — hot right after a shell goes up (ai.js sets lobTimer to
      // lobTime on fire and counts it down while it's in the air), ambient
      // otherwise. Missing timers (room editor) just give the ambient pulse.
      const hot = e.lobTimer > 0 ? Util.clamp(e.lobTimer / (e.lobTime || 1), 0, 1) : 0;
      const pulse = 0.5 + 0.5 * Math.sin(now / 300 + phase);
      const glow = flash ? Theme.enemy.flash : (hot > 0 ? Theme.fx.fuseHot : gearLit);
      ctx.save();
      ctx.fillStyle = glow; ctx.shadowColor = glow; ctx.shadowBlur = 4 + 5 * pulse + 10 * hot;
      ctx.beginPath(); ctx.arc(e.x + r * 0.92, e.y - r * 0.62, r * (0.1 + 0.05 * pulse + 0.12 * hot), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (behavior === 'weaver') {
      // a pulse travelling along the static sine — the squiggle reads as
      // scrolling without re-stroking (and double-stroking) the polyline
      const u = ((now / 900 + phase) % 1 + 1) % 1;
      const px = e.x - r * 0.5 + r * u;
      const py = e.y - r * 0.05 + Math.sin(u * Math.PI * 2) * r * 0.24;
      ctx.save();
      ctx.fillStyle = gearLit; ctx.shadowColor = gearLit; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(px, py, r * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (behavior === 'sentry') {
      // the gaze drifting. The call site has no player position and the
      // signature is shared with the room editor, so this is an ambient
      // sweep rather than real tracking — threading a target through
      // drawBrownHumanoid would be a signature change for a cosmetic.
      const gx = Math.sin(now / 1300 + phase) * r * 0.16;
      const gy = Math.sin(now / 900 + phase * 1.7) * r * 0.05;
      ctx.save();
      ctx.fillStyle = flash ? Theme.enemy.flashSoft : Theme.pony.eyeWhite;
      ctx.beginPath(); ctx.ellipse(e.x, e.y - r * 0.05, r * 0.4, r * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? Theme.enemy.flash : Theme.pony.pupil;
      ctx.beginPath(); ctx.arc(e.x + gx, e.y - r * 0.05 + gy, r * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    if (behavior === 'bomber') {
      const bx = e.x, by = e.y + r * 0.1;
      const armed = e.arming || e.fuseTimer > 0;
      const glowT = armed ? Util.clamp(1 - (e.fuseTimer || 0) / 1.2, 0, 1) : 0;
      ctx.save();
      if (armed) { ctx.shadowColor = Theme.fx.fuseHot; ctx.shadowBlur = 6 + glowT * 10; }
      ctx.fillStyle = Theme.fx.bombBodyDark;
      ctx.beginPath(); ctx.arc(bx, by, r * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const fuseCol = armed ? Theme.fx.fuseHot : Theme.fx.fuse;
      ctx.strokeStyle = fuseCol; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx + r * 0.15, by - r * 0.35); ctx.lineTo(bx + r * 0.3, by - r * 0.55); ctx.stroke();
      ctx.fillStyle = fuseCol;
      ctx.beginPath(); ctx.arc(bx + r * 0.3, by - r * 0.55, r * 0.1, 0, Math.PI * 2); ctx.fill();
    }

    // ---- boss / superboss ornamentation ----
    if (isBoss) {
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(now / 300) * 0.1;
      ctx.strokeStyle = Util.shadeColor(col, 0.5); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 1.1, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = dark;
      const spikes = 5;
      for (let i = 0; i < spikes; i++) {
        const t = i / (spikes - 1) - 0.5;
        const sx = hx + t * r * 0.95, syBase = hy - r * 0.42;
        const tall = i === Math.floor(spikes / 2) ? 0.5 : 0.32;
        ctx.beginPath();
        ctx.moveTo(sx - r * 0.08, syBase);
        ctx.lineTo(sx, syBase - r * tall);
        ctx.lineTo(sx + r * 0.08, syBase);
        ctx.closePath(); ctx.fill();
      }
      if (isSuper) {
        ctx.font = Math.round(r * 0.6) + 'px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(e.type.icon, e.x, e.y - r * 1.4);
      }
    }

    if ((e.maxHp > 3 || (forceHealthBar && e.maxHp > 0)) && !isBoss) Util.drawEnemyHealthBar(ctx, e);
  },

  drawEnemyHealthBar(ctx, e){
    const w = e.radius * 1.8;
    ctx.fillStyle = Theme.ui.hpBarBack; ctx.fillRect(e.x - w / 2, e.y - e.radius - 14, w, 4);
    ctx.fillStyle = Theme.ui.hpBarFill; ctx.fillRect(e.x - w / 2, e.y - e.radius - 14, w * Util.clamp(e.hp / e.maxHp, 0, 1), 4);
  },

  // a small vending-machine fixture — every shop room's donation machine
  // (see shop.js). frac (0..1) is how full its lifetime 1000c cap is,
  // shown as a rising fill bar so there's always visible progress toward
  // the next 50c unlock.
  drawDonationMachine(ctx, x, y, frac){
    const w = 28, h = 34;
    ctx.fillStyle = Theme.shadow.groundSoft;
    ctx.beginPath(); ctx.ellipse(x, y + h / 2 + 3, w * 0.5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = Theme.machine.body;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeStyle = Theme.machine.frame; ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    const meterX = x - w / 2 + 4, meterW = 6, meterTop = y - h / 2 + 3, meterH = h - 6;
    ctx.fillStyle = Theme.machine.meterBg;
    ctx.fillRect(meterX, meterTop, meterW, meterH);
    const fillH = meterH * Util.clamp(frac, 0, 1);
    ctx.fillStyle = Theme.machine.meterFill;
    ctx.fillRect(meterX, meterTop + meterH - fillH, meterW, fillH);
    ctx.fillStyle = Theme.machine.slot;
    ctx.fillRect(x - 1, y - h / 2 + 8, 3, 10);
    ctx.fillStyle = Theme.machine.label;
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('$', x + 7, y + 3);
  },

  // the shop room's other fixture — the reroll altar (see shop.js). Same
  // silhouette family as drawDonationMachine above (shadow ellipse + framed
  // slab) but squatter, violet, and topped with a spinning arrow ring, so the
  // two read as different fixtures from across the room at a glance.
  drawRerollAltar(ctx, x, y, now){
    const w = 30, h = 22;
    ctx.fillStyle = Theme.shadow.groundSoft;
    ctx.beginPath(); ctx.ellipse(x, y + h / 2 + 3, w * 0.5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = Theme.machine.altarBody;
    Util.drawRoundedRect(ctx, x - w / 2, y - h / 2, w, h, 3); ctx.fill();
    ctx.strokeStyle = Theme.machine.altarFrame; ctx.lineWidth = 2;
    Util.drawRoundedRect(ctx, x - w / 2, y - h / 2, w, h, 3); ctx.stroke();
    // slowly rotating open ring floating above the slab — the "reroll" motif
    ctx.save();
    ctx.translate(x, y - h / 2 - 7);
    ctx.rotate(((now || 0) / 700) % (Math.PI * 2));
    ctx.strokeStyle = Theme.machine.altarGlow; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 7, 0.5, Math.PI * 1.75); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, -2.5); ctx.lineTo(4, 2); ctx.lineTo(10, 2); ctx.closePath();
    ctx.fillStyle = Theme.machine.altarGlow; ctx.fill();
    ctx.restore();
  },

  // Phase 4 overhaul — an arcade filly (see shop.js's tryArcadeInteract,
  // room.js's populateRoom's node.fillies). A small, muted beggar-flavored
  // pony (reuses drawPony rather than a bespoke silhouette — cheap enough to
  // draw up to 4 at once) with a little sign above its head showing what it
  // wants fed, via the SAME icon helpers the pickup HUD/world icons already
  // use (drawKeyIcon/drawBombIcon/drawHeart/drawBatteryIcon; coin gets a
  // small inline glint circle, matching drawPickupIcon's own 'coin' case).
  drawFilly(ctx, x, y, kind, now){
    Util.drawPony(ctx, x, y, 22, {
      bodyColor: '#8a8578', maneColor: '#5e5648',
      facing: { x: 0, y: 1 }, now: now || 0,
    });
    // sign: small plank floating above the pony's head
    const signY = y - 30;
    ctx.fillStyle = Theme.machine.fillySign;
    Util.drawRoundedRect(ctx, x - 9, signY - 9, 18, 18, 3); ctx.fill();
    ctx.strokeStyle = Theme.machine.fillySignEdge; ctx.lineWidth = 1.5;
    Util.drawRoundedRect(ctx, x - 9, signY - 9, 18, 18, 3); ctx.stroke();
    switch (kind) {
      case 'coin':
        ctx.fillStyle = Util.bodyShade(ctx, x, signY, 6, '#e3c15b');
        ctx.beginPath(); ctx.arc(x, signY, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = Theme.shadow.groundHard; ctx.stroke();
        ctx.fillStyle = Theme.shadow.glint;
        ctx.beginPath(); ctx.arc(x - 2, signY - 2, 1.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'bomb': Util.drawBombIcon(ctx, x, signY, Theme.icon.bombBody, Theme.icon.bombFuse); break;
      case 'key': Util.drawKeyIcon(ctx, x, signY, Theme.icon.key); break;
      case 'heart': Util.drawHeart(ctx, x - 6, signY - 6, 12, 1, Theme.icon.heartRed, Theme.icon.heartRedLine); break;
      case 'battery': Util.drawBatteryIcon(ctx, x, signY, 1); break;
    }
  },

  // the arcade room's 3 machine fixtures — same shadow-ellipse + framed-slab
  // silhouette family as drawDonationMachine/drawRerollAltar above, one
  // small decorative glyph each so the three read apart at a glance.
  // `machine`/`now` are optional (only passed by drawArcadeFixtures) — when
  // machine.spinning is true a spinning ring flourish is drawn over the
  // glyph for the anticipation beat between press and reveal (see
  // updateArcadeMachines/useArcadeMachine in systems/shop.js).
  drawFriendshipMachine(ctx, x, y, machine, now){
    const w = 28, h = 34;
    ctx.fillStyle = Theme.shadow.groundSoft;
    ctx.beginPath(); ctx.ellipse(x, y + h / 2 + 3, w * 0.5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = Theme.machine.friendshipBody;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeStyle = Theme.machine.friendshipFrame; ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    Util.drawHeart(ctx, x - 7, y - 8, 14, 1, Theme.machine.friendshipFrame, Theme.machine.friendshipBody);
    Util.drawMachineSpinFlourish(ctx, x, y, machine, now);
  },

  drawToolsMachine(ctx, x, y, machine, now){
    const w = 28, h = 34;
    ctx.fillStyle = Theme.shadow.groundSoft;
    ctx.beginPath(); ctx.ellipse(x, y + h / 2 + 3, w * 0.5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = Theme.machine.toolsBody;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeStyle = Theme.machine.toolsFrame; ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    Util.drawKeyIcon(ctx, x, y - 2, Theme.machine.toolsFrame);
    Util.drawMachineSpinFlourish(ctx, x, y, machine, now);
  },

  drawDarkMachine(ctx, x, y){
    const w = 28, h = 34;
    ctx.fillStyle = Theme.shadow.groundSoft;
    ctx.beginPath(); ctx.ellipse(x, y + h / 2 + 3, w * 0.5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = Theme.machine.darkBody;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeStyle = Theme.machine.darkFrame; ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    Util.drawStarIcon(ctx, x, y - 2, Theme.machine.darkFrame);
  },

  // shared anticipation-ring flourish for the friendship/tools machines
  // while machine.spinning is true (see useArcadeMachine/updateArcadeMachines
  // in systems/shop.js) — a small spinning dashed ring over the glyph. Cheap:
  // one arc, no-op unless machine.spinning.
  drawMachineSpinFlourish(ctx, x, y, machine, now){
    if (!machine || !machine.spinning) return;
    const ang = (now || 0) / 90;
    ctx.save();
    ctx.strokeStyle = Theme.machine.spinRing || '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 8, 10, ang, ang + Math.PI * 1.2);
    ctx.stroke();
    ctx.restore();
  },

  // Engineer Pony's built turret (systems/combat-1.js's updatePlayerTurrets/
  // node.playerTurrets). Same silhouette family as the enemy turret obstacle
  // branch in drawObstacle (shadow ellipse, dark body arc, shaded highlight
  // arc, one barrel line, a small "eye" dot) but recolored friendly steel-
  // blue so it never reads as a hostile turret, and the barrel always points
  // at `turret.ang` (last fired direction) instead of a fixed set of angles.
  // turret.x/turret.y are already world pixels, NOT tile coords — unlike
  // node.fillies/node.machines, do not multiply by TILE when calling this.
  drawPlayerTurret(ctx, turret, now){
    const x = turret.x, y = turret.y;
    ctx.fillStyle = Theme.shadow.groundSoft;
    ctx.beginPath(); ctx.ellipse(x, y + 9, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#243a4a';
    ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = Util.bodyShade(ctx, x, y, 9, '#5a7a9a');
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7fc1e3'; // matches updatePlayerTurrets' own bolt color
    ctx.lineWidth = 3;
    const ang = turret.ang || 0;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * 6, y + Math.sin(ang) * 6);
    ctx.lineTo(x + Math.cos(ang) * 16, y + Math.sin(ang) * 16);
    ctx.stroke();
    ctx.fillStyle = '#7fc1e3';
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
  },

  // Changeling Queen's summoned minion (systems/combat-1.js's
  // updateChangelingSummons/player.changelingMinions) — a small simplified
  // bug-pony blob with a faint green fire-glow ring around it, echoing
  // drawGreenFireZone's palette (render.js) since a minion's attack IS a
  // smaller version of that same fire-zone effect. Deliberately cheap (no
  // baked sprite, no drawPony call) since up to maxChangelingMinions of
  // these can be on screen and drift every frame. m.x/m.y are world pixels.
  drawChangelingMinion(ctx, m, now){
    const x = m.x, y = m.y;
    const pulse = 0.7 + 0.3 * Math.abs(Math.sin((now || 0) / 260));
    ctx.save();
    ctx.globalAlpha = 0.55 * pulse;
    ctx.fillStyle = 'rgba(90,224,160,.4)';
    ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = Theme.shadow.groundSoft;
    ctx.beginPath(); ctx.ellipse(x, y + 8, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c2420';
    ctx.beginPath(); ctx.ellipse(x, y, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = Util.bodyShade(ctx, x, y, 6, '#2f3a35');
    ctx.beginPath(); ctx.ellipse(x, y, 6, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4d35e';
    ctx.beginPath(); ctx.arc(x, y - 5, 2.2, 0, Math.PI * 2); ctx.fill();
  },

  // stylized pony sprite: body, head, ears, mane, tail, optional wings/horn/
  // class-specific accessories — see Util.classPonyOpts for the id->opts
  // mapping both render.js's live player and ui.js's class-select preview
  // pull from. now/moving (optional) drive a small walk cycle + idle
  // breathing sway; omitting them renders a static idle pose.
  drawPony(ctx, x, y, size, opts){
    opts = opts || {};
    const facing = opts.facing || { x: 0, y: 1 };
    const angle = Math.atan2(facing.y, facing.x);
    const now = opts.now || 0;
    const bodyColor = opts.flash ? Theme.pony.flash : opts.bodyColor;
    const maneColor = opts.flash ? Theme.pony.flash : opts.maneColor;
    const bob = Math.sin(now / 250) * size * 0.015; // always-on idle breathing sway
    ctx.save();
    ctx.translate(x, y + bob);
    if (opts.ghostly) ctx.globalAlpha = Theme.pony.ghostAlpha; // Windigo — a translucent, spectral look

    ctx.fillStyle = Theme.shadow.ground;
    ctx.beginPath(); ctx.ellipse(0, size * 0.42, size * 0.42, size * 0.13, 0, 0, Math.PI * 2); ctx.fill();

    // legs — small walk-cycle when moving, gentle idle sway otherwise
    const legPhase = opts.moving ? Math.sin(now / 100) * size * 0.1 : Math.sin(now / 900) * size * 0.02;
    ctx.fillStyle = opts.flash ? Theme.pony.flash : Util.shadeColor(bodyColor, -0.35);
    ctx.beginPath(); ctx.ellipse(-size * 0.22, size * 0.32 + legPhase, size * 0.1, size * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(size * 0.22, size * 0.32 - legPhase, size * 0.1, size * 0.16, 0, 0, Math.PI * 2); ctx.fill();

    if (opts.hasWings) {
      const baseAlpha = opts.ghostly ? Theme.pony.ghostAlpha : 1; // restore to ghostly's alpha, not always fully opaque
      ctx.globalAlpha = baseAlpha * 0.9;
      ctx.fillStyle = bodyColor;
      const flap = opts.moving ? Math.sin(now / 90) * 0.3 : Math.sin(now / 400) * 0.08;
      ctx.beginPath();
      ctx.ellipse(-size * 0.28, -size * 0.02, size * 0.30, size * 0.16, angle * 0.2 - 0.3 - flap, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(size * 0.28, -size * 0.02, size * 0.30, size * 0.16, -angle * 0.2 + 0.3 + flap, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = baseAlpha;
    }

    // tail — a small curved flag opposite the facing direction; sea ponies
    // get a fin-shaped variant instead of the plain ellipse
    const tailAng = angle + Math.PI;
    const tx = Math.cos(tailAng) * size * 0.46, ty = Math.sin(tailAng) * size * 0.3 + size * 0.1;
    ctx.fillStyle = maneColor;
    if (opts.hasFinTail) {
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + Math.cos(tailAng - 0.5) * size * 0.22, ty + Math.sin(tailAng - 0.5) * size * 0.22 - size * 0.08);
      ctx.lineTo(tx + Math.cos(tailAng + 0.5) * size * 0.22, ty + Math.sin(tailAng + 0.5) * size * 0.22 + size * 0.08);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(tx, ty, size * 0.14, size * 0.2, tailAng, 0, Math.PI * 2);
      ctx.fill();
    }

    const bodyGrad = opts.flash ? bodyColor : Util.bodyShadeLocal(ctx, 0, size * 0.06, size * 0.5, bodyColor);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.06, size * 0.5, size * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    // a soft top-lit rim stroke on the body — the same subtle "sunlit facet"
    // touch given to rocks/enemies this pass, tuned faint here since the
    // pony is the single most-seen sprite in the game and this is meant to
    // read as a little more volume, not a new outline
    if (!opts.flash) {
      ctx.strokeStyle = Theme.shadow.rim; ctx.lineWidth = size * 0.02;
      ctx.beginPath(); ctx.ellipse(0, size * 0.06, size * 0.46, size * 0.32, 0, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    }

    if (opts.hasScales && !opts.flash) {
      ctx.strokeStyle = Util.shadeColor(bodyColor, -0.25); ctx.lineWidth = size * 0.02;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * size * 0.14, size * 0.02, size * 0.08, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
    }

    if (opts.hasStripes && !opts.flash) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, size * 0.06, size * 0.5, size * 0.36, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = opts.maneColor;
      ctx.lineWidth = size * 0.055;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * size * 0.16, -size * 0.34);
        ctx.lineTo(i * size * 0.16 + size * 0.09, size * 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (opts.isRobot && !opts.flash) {
      ctx.strokeStyle = Theme.pony.robotSeam; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-size * 0.2, -size * 0.05); ctx.lineTo(-size * 0.2, size * 0.28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(size * 0.2, -size * 0.05); ctx.lineTo(size * 0.2, size * 0.28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-size * 0.3, size * 0.1); ctx.lineTo(size * 0.3, size * 0.1); ctx.stroke();
    }

    const hx = Math.cos(angle) * size * 0.42, hy = Math.sin(angle) * size * 0.42 - size * 0.05;
    ctx.fillStyle = bodyGrad;
    // cranium
    ctx.beginPath();
    ctx.arc(hx, hy, size * 0.27, 0, Math.PI * 2);
    ctx.fill();
    // muzzle — a smaller bump pushed out in the facing direction so the
    // head actually tapers into a snout instead of reading as a plain ball.
    // Beaked classes skip it — the beak below reads better growing straight
    // out of the cranium.
    if (!opts.hasBeak) {
      const mx = hx + Math.cos(angle) * size * 0.2, my = hy + Math.sin(angle) * size * 0.2;
      ctx.beginPath();
      ctx.ellipse(mx, my, size * 0.15, size * 0.125, angle, 0, Math.PI * 2);
      ctx.fill();
      if (!opts.flash) {
        // nostril
        ctx.fillStyle = Util.shadeColor(bodyColor, -0.4);
        const nAng = angle + 1.3;
        ctx.beginPath();
        ctx.arc(mx + Math.cos(angle) * size * 0.09 + Math.cos(nAng) * size * 0.06,
          my + Math.sin(angle) * size * 0.09 + Math.sin(nAng) * size * 0.06, size * 0.022, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ears — bat pony gets taller, pointier ones
    ctx.fillStyle = bodyGrad;
    const earLen = opts.hasFangs ? 0.48 : 0.4;
    ctx.beginPath();
    ctx.moveTo(hx - size * 0.16, hy - size * 0.2);
    ctx.lineTo(hx - size * 0.26, hy - size * earLen);
    ctx.lineTo(hx - size * 0.04, hy - size * 0.28);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + size * 0.16, hy - size * 0.2);
    ctx.lineTo(hx + size * 0.26, hy - size * earLen);
    ctx.lineTo(hx + size * 0.04, hy - size * 0.28);
    ctx.closePath(); ctx.fill();

    if (opts.hasBeak) {
      ctx.fillStyle = Theme.pony.beak;
      ctx.beginPath();
      ctx.moveTo(hx + Math.cos(angle) * size * 0.28, hy + Math.sin(angle) * size * 0.28 - size * 0.02);
      ctx.lineTo(hx + Math.cos(angle) * size * 0.44, hy + Math.sin(angle) * size * 0.44);
      ctx.lineTo(hx + Math.cos(angle) * size * 0.28, hy + Math.sin(angle) * size * 0.28 + size * 0.06);
      ctx.closePath(); ctx.fill();
    }

    if (opts.hasFangs && !opts.flash) {
      ctx.fillStyle = Theme.pony.fang;
      const fx = hx + Math.cos(angle) * size * 0.24, fy = hy + Math.sin(angle) * size * 0.24;
      ctx.beginPath(); ctx.moveTo(fx - size * 0.05, fy); ctx.lineTo(fx - size * 0.03, fy + size * 0.08); ctx.lineTo(fx - size * 0.01, fy); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(fx + size * 0.05, fy); ctx.lineTo(fx + size * 0.03, fy + size * 0.08); ctx.lineTo(fx + size * 0.01, fy); ctx.closePath(); ctx.fill();
    }

    if (opts.hasHorn) {
      ctx.fillStyle = Theme.pony.horn;
      ctx.beginPath();
      ctx.moveTo(hx, hy - size * 0.28);
      ctx.lineTo(hx - size * 0.045, hy - size * 0.48);
      ctx.lineTo(hx + size * 0.045, hy - size * 0.48);
      ctx.closePath(); ctx.fill();
    }

    // mane — kirin and DNB pony get a jagged "flame" mane instead of the
    // plain ellipse (it's drawn in maneColor, so it reads as flame on the
    // kirin and as a neon waveform crest on the DNB pony)
    ctx.fillStyle = opts.flash ? Theme.pony.flash : maneColor;
    if (opts.flameMane && !opts.flash) {
      const mx = hx - Math.cos(angle) * size * 0.08, my = hy - Math.sin(angle) * size * 0.08 - size * 0.04;
      const flick = Math.sin(now / 140) * size * 0.03;
      ctx.beginPath();
      ctx.moveTo(mx - size * 0.14, my + size * 0.14);
      ctx.lineTo(mx - size * 0.16 + flick, my - size * 0.1);
      ctx.lineTo(mx - size * 0.04, my - size * 0.02);
      ctx.lineTo(mx + size * 0.02 - flick, my - size * 0.26);
      ctx.lineTo(mx + size * 0.1, my - size * 0.06);
      ctx.lineTo(mx + size * 0.16 + flick, my - size * 0.18);
      ctx.lineTo(mx + size * 0.12, my + size * 0.14);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(hx - Math.cos(angle) * size * 0.08, hy - Math.sin(angle) * size * 0.08 - size * 0.04,
        size * 0.16, size * 0.22, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!opts.flash) {
      // a proper white-plus-pupil-plus-glint eye instead of a flat dot —
      // reads as expressive at this size instead of a blank stare.
      // Both eyes: the ±1.2 offset mirrors the pair across the facing axis,
      // the same way the ears/talons above mirror across the head.
      for (const s of [-1, 1]) {
        const ex = hx + Math.cos(angle) * size * 0.1 + Math.cos(angle + s * 1.2) * size * 0.12;
        const ey = hy + Math.sin(angle) * size * 0.1 + Math.sin(angle + s * 1.2) * size * 0.12;
        if (!opts.isRobot) {
          ctx.fillStyle = Theme.pony.eyeWhite;
          ctx.beginPath(); ctx.ellipse(ex, ey, size * 0.062, size * 0.05, angle, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = opts.isRobot ? Theme.pony.robotEye : Theme.pony.pupil;
        if (opts.isRobot) { ctx.shadowColor = Theme.pony.robotEye; ctx.shadowBlur = 5; }
        ctx.beginPath();
        ctx.arc(ex + Math.cos(angle) * size * 0.012, ey, size * (opts.isRobot ? 0.045 : 0.036), 0, Math.PI * 2);
        ctx.fill();
        if (opts.isRobot) ctx.shadowBlur = 0;
        else {
          ctx.fillStyle = Theme.pony.eyeGlint;
          ctx.beginPath(); ctx.arc(ex - size * 0.018, ey - size * 0.018, size * 0.015, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    if (opts.hasTalons && !opts.flash) {
      ctx.strokeStyle = Theme.pony.talon; ctx.lineWidth = size * 0.02;
      for (const s of [-1, 1]) {
        const lx = s * size * 0.22, ly = size * 0.42;
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + i * size * 0.03, ly + size * 0.07); ctx.stroke(); }
      }
    }
    ctx.restore();
  },
});

// grid-tile BFS pathing. grid coords are tile indices, isBlocked(x,y) => bool.
// Returns the full route as an array of {x,y} waypoints (start cell excluded,
// goal cell included), [] if already there, or null if no route was found
// within the search budget — see ai.js's chaseSeek(), which is what actually
// walks entities along it.
function bfsPath(cols, rows, isBlocked, startX, startY, goalX, goalY){
  if (startX === goalX && startY === goalY) return [];
  const visited = new Set();
  visited.add(Util.key(startX, startY));
  const q = [{ x: startX, y: startY, parent: null }];
  let head = 0;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  let iterations = 0;
  while (head < q.length && iterations < 2500) {
    iterations++;
    const cur = q[head++];
    if (cur.x === goalX && cur.y === goalY) {
      const path = [];
      for (let n = cur; n.parent; n = n.parent) path.push({ x: n.x, y: n.y });
      path.reverse();
      return path;
    }
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const k = Util.key(nx, ny);
      if (visited.has(k)) continue;
      if (isBlocked(nx, ny) && !(nx === goalX && ny === goalY)) continue;
      visited.add(k);
      q.push({ x: nx, y: ny, parent: cur });
    }
  }
  return null;
}

// convenience: just the first waypoint of bfsPath, or null.
function bfsNextStep(cols, rows, isBlocked, startX, startY, goalX, goalY){
  const path = bfsPath(cols, rows, isBlocked, startX, startY, goalX, goalY);
  return path && path.length ? path[0] : null;
}

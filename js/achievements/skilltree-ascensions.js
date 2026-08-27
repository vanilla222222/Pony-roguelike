'use strict';
// achievements/skilltree-ascensions.js — one "Ascension" node per character,
// the true end of every tree: parent is always that character's own
// capstone (`char_<classId>_capstone`, from skilltree-capstones.js, loaded
// immediately before this file — see index.html), cost 5 (the single most
// expensive node in the game). Same Soy-Milk-tradeoff shape as a capstone —
// one real buff, one real drawback on the same node — just one tier further
// out and roughly 20% stronger, for the player who has already committed a
// capstone's worth of points to one character and wants somewhere further
// to put the next five.
//
// Every (classId, stat) pair was chosen the same way the capstone pass
// chose its own: by summing that stat's FULL total across EVERY node that
// exists by this point in the load order — every skilltree-characters*.js
// file AND skilltree-capstones.js itself — and picking whichever candidate
// stat has the most headroom left under its cap (SKILL_TREE_STAT_CAP 0.25,
// or SKILL_TREE_STAT_CAP_OVERRIDES for lifestealChance, untouched by this
// file same as the capstone pass). The buff candidate pool is wider than
// the capstone pass's own (every chance-type field, not just a handful) —
// by the time a character has spent 50+3 points already, most of the
// "obvious" stats are closer to capped, so casting a wider net was
// necessary to still find real headroom everywhere. `rangeTiles`/
// `boltSpeed` (bolt travel distance/speed, see combat-2.js) are excluded
// from the buff pool entirely for melee-attackType characters — they're
// dead stats on a character that never fires a bolt, the same reasoning
// `skilltree-capstones.js` already applies to its own cooldown-drawback
// pairing. Drawback is always that character's own `meleeCooldown`/
// `fireCooldown` (matching `attackType`, pushed the WORSENING/positive
// direction — cooldown is worse when higher) or `speed` pushed negative,
// exactly like the capstone pass.
const SKILL_TREE_ASCENSION_CONFIG = {
  earth: {
    name: 'Rootrot Bloom', desc: 'Whatever she plants a hoof on eventually rots from the inside — a lingering toxin left in the wake of every impact. Venom chance +6%, movement speed -5%.',
    effects: [{ type:'stat', classId:'earth', stat:'venomChance', amount:0.06 }, { type:'stat', classId:'earth', stat:'speed', amount:-0.05 }],
  },
  pegasus: {
    name: 'Talon of the Storm', desc: 'Every graze she lands finds the gap in the armor first — a trick borrowed from harder-hitting cousins in the flock. Vulnerable chance +6%, movement speed -5%.',
    effects: [{ type:'stat', classId:'pegasus', stat:'vulnerableChance', amount:0.06 }, { type:'stat', classId:'pegasus', stat:'speed', amount:-0.05 }],
  },
  unicorn: {
    name: 'Residual Casting', desc: 'Every kill leaves a trace of magic hanging in the air, if she\'s fast enough to reabsorb it before it fades. On-kill heal chance +6%, movement speed -5%.',
    effects: [{ type:'stat', classId:'unicorn', stat:'onKillHealChance', amount:0.06 }, { type:'stat', classId:'unicorn', stat:'speed', amount:-0.05 }],
  },
  batpony: {
    name: 'Nocturnal Instinct', desc: 'Starving sharpens more than the fangs — it sharpens the instinct for which shadow is actually worth diving into. Luck +6%, melee cooldown +5%.',
    effects: [{ type:'stat', classId:'batpony', stat:'luck', amount:0.06 }, { type:'stat', classId:'batpony', stat:'meleeCooldown', amount:0.05 }],
  },
  zebra: {
    name: 'Omen Reading', desc: 'The same trance that guides her hoof reads the room before she throws it. Luck +6%, movement speed -5%.',
    effects: [{ type:'stat', classId:'zebra', stat:'luck', amount:0.06 }, { type:'stat', classId:'zebra', stat:'speed', amount:-0.05 }],
  },
  hypogriff: {
    name: 'Frostbitten Wound', desc: 'Something about a strike that hard leaves the wound cold long after the talon has already moved on. Freeze chance +6%, melee cooldown +5%.',
    effects: [{ type:'stat', classId:'hypogriff', stat:'freezeChance', amount:0.06 }, { type:'stat', classId:'hypogriff', stat:'meleeCooldown', amount:0.05 }],
  },
  seapony: {
    name: "The Tide's Lull", desc: 'A bolt that hits like a rolling tide also carries an undertow nothing much wants to swim against. Charm chance +6%, fire cooldown +5%.',
    effects: [{ type:'stat', classId:'seapony', stat:'charmChance', amount:0.06 }, { type:'stat', classId:'seapony', stat:'fireCooldown', amount:0.05 }],
  },
  ponybot: {
    name: 'Salvage Protocol', desc: 'Every kill it scores gets stripped for spare parts on the spot, patched straight back into the chassis before the next shot. On-kill heal chance +6%, fire cooldown +5%.',
    effects: [{ type:'stat', classId:'ponybot', stat:'onKillHealChance', amount:0.06 }, { type:'stat', classId:'ponybot', stat:'fireCooldown', amount:0.05 }],
  },
  griffin: {
    name: 'Skull-Rattler', desc: 'The barrage doesn\'t just land anymore — it rattles something loose behind the eyes. Stun chance +6%, fire cooldown +5%.',
    effects: [{ type:'stat', classId:'griffin', stat:'stunChance', amount:0.06 }, { type:'stat', classId:'griffin', stat:'fireCooldown', amount:0.05 }],
  },
  kirin: {
    name: 'Wrath Preceding', desc: 'Nothing waits around to find out whether the next hit is the one that ends it. Fear chance +6%, fire cooldown +5%.',
    effects: [{ type:'stat', classId:'kirin', stat:'fearChance', amount:0.06 }, { type:'stat', classId:'kirin', stat:'fireCooldown', amount:0.05 }],
  },
  dragon: {
    name: 'Hoard-Sense', desc: 'A dragon always knows, somehow, exactly when the good stuff is close by. Luck +6%, fire cooldown +5%.',
    effects: [{ type:'stat', classId:'dragon', stat:'luck', amount:0.06 }, { type:'stat', classId:'dragon', stat:'fireCooldown', amount:0.05 }],
  },
  windigo: {
    name: 'Outrunning the Storm', desc: "The frost stops waiting for the wind to carry it — it moves faster than the storm that made it. Bolt speed +6%, fire cooldown +5%.",
    effects: [{ type:'stat', classId:'windigo', stat:'boltSpeed', amount:0.06 }, { type:'stat', classId:'windigo', stat:'fireCooldown', amount:0.05 }],
  },
  kelpie: {
    name: "The Drag Knows Best", desc: 'What the grip decides is worth keeping, it keeps for a reason nopony else gets to argue with. Luck +6%, melee cooldown +5%.',
    effects: [{ type:'stat', classId:'kelpie', stat:'luck', amount:0.06 }, { type:'stat', classId:'kelpie', stat:'meleeCooldown', amount:0.05 }],
  },
  breezie: {
    name: 'Every Mote Rattles', desc: 'Even a dust mote lands somewhere soft enough to matter, if enough of them go out at once. Stun chance +6%, fire cooldown +5%.',
    effects: [{ type:'stat', classId:'breezie', stat:'stunChance', amount:0.06 }, { type:'stat', classId:'breezie', stat:'fireCooldown', amount:0.05 }],
  },
  dnbpony: {
    name: 'Nothing Standing Right', desc: 'Whatever is still on its feet after the drop is standing wrong, and everything after that lands easier. Vulnerable chance +6%, movement speed -5%.',
    effects: [{ type:'stat', classId:'dnbpony', stat:'vulnerableChance', amount:0.06 }, { type:'stat', classId:'dnbpony', stat:'speed', amount:-0.05 }],
  },
  crystalpony: {
    name: 'Beyond Full Discharge', desc: "There was never really a hard limit on the charge — only on how much of herself she was willing to spend on one volley. Ranged damage +6%, fire cooldown +5%.",
    effects: [{ type:'stat', classId:'crystalpony', stat:'rangedDamage', amount:0.06 }, { type:'stat', classId:'crystalpony', stat:'fireCooldown', amount:0.05 }],
  },
  mule: {
    name: 'The Pack Knows the Way', desc: "Enough time hauling other creatures' burdens teaches a mule exactly which look gets her what she actually needs. Charm chance +6%, melee cooldown +5%.",
    effects: [{ type:'stat', classId:'mule', stat:'charmChance', amount:0.06 }, { type:'stat', classId:'mule', stat:'meleeCooldown', amount:0.05 }],
  },
  alicorn: {
    name: 'The Aurora Finds the Seam', desc: 'Magic poured out at that scale finds every weak point in whatever it touches, whether she\'s aiming for one or not. Vulnerable chance +6%, fire cooldown +5%.',
    effects: [{ type:'stat', classId:'alicorn', stat:'vulnerableChance', amount:0.06 }, { type:'stat', classId:'alicorn', stat:'fireCooldown', amount:0.05 }],
  },
  changeling: {
    name: "The Hunger Marks Its Meal", desc: 'Anything the fire pool touches is easier to finish off after, one way or another. Vulnerable chance +6%, movement speed -5%.',
    effects: [{ type:'stat', classId:'changeling', stat:'vulnerableChance', amount:0.06 }, { type:'stat', classId:'changeling', stat:'speed', amount:-0.05 }],
  },
  diamonddog: {
    name: 'Tunnel-Trained Reflex', desc: 'Years spent reading a tunnel for the next collapse translate, it turns out, quite well into reading a fight. Dodge chance +6%, melee cooldown +5%.',
    effects: [{ type:'stat', classId:'diamonddog', stat:'dodgeChance', amount:0.06 }, { type:'stat', classId:'diamonddog', stat:'meleeCooldown', amount:0.05 }],
  },
  gargoyle: {
    name: 'The Long Stare', desc: 'Something about being looked at by a gargoyle for that long makes a creature forget it was ever planning to say no. Charm chance +6%, fire cooldown +5%.',
    effects: [{ type:'stat', classId:'gargoyle', stat:'charmChance', amount:0.06 }, { type:'stat', classId:'gargoyle', stat:'fireCooldown', amount:0.05 }],
  },
  changedling: {
    name: 'Full Smoulder, Full Rattle', desc: 'The ring around her doesn\'t just burn now — it shakes something loose in whatever it catches. Stun chance +6%, fire cooldown +5%.',
    effects: [{ type:'stat', classId:'changedling', stat:'stunChance', amount:0.06 }, { type:'stat', classId:'changedling', stat:'fireCooldown', amount:0.05 }],
  },
  changelingqueen: {
    name: "A Queen's Fortune", desc: 'A hive survives on knowing which risk pays off, and she has never once been wrong about it in front of her subjects. Luck +6%, fire cooldown +5%.',
    effects: [{ type:'stat', classId:'changelingqueen', stat:'luck', amount:0.06 }, { type:'stat', classId:'changelingqueen', stat:'fireCooldown', amount:0.05 }],
  },
  filly: {
    name: 'Charmed Life', desc: 'There is something a foal has that nopony can quite name, and hers has never once let her down when it mattered. Luck +6%, melee cooldown +5%.',
    effects: [{ type:'stat', classId:'filly', stat:'luck', amount:0.06 }, { type:'stat', classId:'filly', stat:'meleeCooldown', amount:0.05 }],
  },
  engineerpony: {
    name: 'Overtuned Beyond Spec', desc: 'She keeps stripping parts that weren\'t feeding the horn, well past the point any safety manual would call sensible. Ranged damage +6%, movement speed -5%.',
    effects: [{ type:'stat', classId:'engineerpony', stat:'rangedDamage', amount:0.06 }, { type:'stat', classId:'engineerpony', stat:'speed', amount:-0.05 }],
  },
};

(function buildAscensionNodes(){
  for (const classId in SKILL_TREE_ASCENSION_CONFIG) {
    const capstoneId = 'char_' + classId + '_capstone';
    if (!SKILL_TREE_NODES_BY_ID[capstoneId]) continue; // defensive — every class has one by this point in load order
    const cfg = SKILL_TREE_ASCENSION_CONFIG[classId];
    const node = {
      id: 'char_' + classId + '_ascension',
      parent: capstoneId,
      cost: 5,
      name: cfg.name,
      desc: cfg.desc,
      effects: cfg.effects,
    };
    SKILL_TREE_NODES.push(node);
    SKILL_TREE_NODES_BY_ID[node.id] = node;
  }
})();

'use strict';
// achievements/skilltree-capstones.js — one signature capstone node per
// character, appended after every other skilltree-characters*.js file has
// already built its own 50 nodes (see index.html — this loads last, right
// before skilltree-general.js). Each capstone is a real end-of-branch payoff:
// cost 3 (triple the normal node), a single meaningful buff to that
// character's own signature stat, paired with a genuine drawback on the
// SAME node (Soy-Milk-style — see mega-a-step5-item-redesign-vision memory),
// never a pure upside.
//
// Parent is computed programmatically, not hardcoded: buildCapstoneNodes
// below walks the already-fully-built SKILL_TREE_NODES array for each
// classId, finds the single deepest existing leaf in that character's tree
// (via a BFS-style depth walk from char_hub_<classId>), and grafts the
// capstone directly onto it. That means this file can never silently
// reference a stale/renamed leaf id no matter how the character files above
// it get edited — it always finds whatever the deepest node actually is at
// load time. Ties broken by id string so the result is deterministic.
//
// Every (classId, stat) pair below was chosen by walking the FULL prior
// total for that stat (every existing node across every
// skilltree-characters*.js file) and picking whichever of that character's
// signature-offense stat / a short shortlist of chance-type stats still has
// at least 0.03 of headroom under skilltree.js's cap (SKILL_TREE_STAT_CAP,
// 0.25 flat, 0.10 for lifestealChance — none of these touch lifesteal), and
// separately whichever of {own attack's cooldown, speed} has headroom in the
// WORSENING direction for the paired drawback (cooldown fields are worse
// when INCREASED — lower is always better for a cooldown — so the drawback
// there is a positive amount; speed is worse when DECREASED, so the drawback
// there is a negative amount). See feature-research scratch work; nothing
// here pushes any character over the existing cap, so nothing is silently
// clamped away.
const SKILL_TREE_CAPSTONE_CONFIG = {
  earth: {
    name: 'Bedrock Root', desc: 'She stops bracing against the ground and simply becomes part of it. Nothing rooted that deep moves quickly, but nothing that deep hits soft either. Melee damage +5%, movement speed -4%.',
    effects: [{ type:'stat', classId:'earth', stat:'meleeDamage', amount:0.05 }, { type:'stat', classId:'earth', stat:'speed', amount:-0.04 }],
  },
  pegasus: {
    name: 'Stormfront Wingbeat', desc: "She trades the one thing that made her a pegasus — speed — for a strike with real weight finally behind it. Melee damage +2%, movement speed -4%.",
    effects: [{ type:'stat', classId:'pegasus', stat:'meleeDamage', amount:0.02 }, { type:'stat', classId:'pegasus', stat:'speed', amount:-0.04 }],
  },
  unicorn: {
    name: 'Unbound Overcharge', desc: "She stops holding anything back in the casting. The bolt that leaves her horn hits harder than any spell reasonably should, but the horn needs longer to recover before it can do it again. Ranged damage +5%, fire cooldown +4%.",
    effects: [{ type:'stat', classId:'unicorn', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'unicorn', stat:'fireCooldown', amount:0.04 }],
  },
  batpony: {
    name: 'Starving Fang', desc: "She swings like something that hasn't fed properly in weeks — because she hasn't. Melee damage +4%, melee cooldown +4%.",
    effects: [{ type:'stat', classId:'batpony', stat:'meleeDamage', amount:0.04 }, { type:'stat', classId:'batpony', stat:'meleeCooldown', amount:0.04 }],
  },
  zebra: {
    name: 'Warpaint Trance', desc: "The trance that lets her hit harder than anything else in Equestria has never once let her hit fast. Melee damage +2%, movement speed -4%.",
    effects: [{ type:'stat', classId:'zebra', stat:'meleeDamage', amount:0.02 }, { type:'stat', classId:'zebra', stat:'speed', amount:-0.04 }],
  },
  hypogriff: {
    name: 'Envenomed Talon', desc: "The scratch that used to just bleed now festers — a talon dragged through something it shouldn't have been near. Venom chance +5%, movement speed -4%.",
    effects: [{ type:'stat', classId:'hypogriff', stat:'venomChance', amount:0.05 }, { type:'stat', classId:'hypogriff', stat:'speed', amount:-0.04 }],
  },
  seapony: {
    name: 'Undertow Surge', desc: "Every bolt now carries the weight of a full tide behind it — and a tide that heavy is considerably slower getting out of the water. Ranged damage +5%, movement speed -4%.",
    effects: [{ type:'stat', classId:'seapony', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'seapony', stat:'speed', amount:-0.04 }],
  },
  ponybot: {
    name: 'Overclocked Targeting Array', desc: "Its targeting laser burns a mark into anything it grazes, softening every hit that lands after — but the extra processing draws hard on the leg servos. Vulnerable chance +5%, movement speed -4%.",
    effects: [{ type:'stat', classId:'ponybot', stat:'vulnerableChance', amount:0.05 }, { type:'stat', classId:'ponybot', stat:'speed', amount:-0.04 }],
  },
  griffin: {
    name: 'Full Wingspan Volley', desc: "She stops rationing the barrage — every feather she has goes out at once, and the reload after that is not a quick one. Ranged damage +5%, fire cooldown +4%.",
    effects: [{ type:'stat', classId:'griffin', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'griffin', stat:'fireCooldown', amount:0.04 }],
  },
  kirin: {
    name: 'Unchained Wrath', desc: "The one hit and it's over now hits considerably harder — but wrath burning that hot takes it out of her legs first. Ranged damage +5%, movement speed -4%.",
    effects: [{ type:'stat', classId:'kirin', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'kirin', stat:'speed', amount:-0.04 }],
  },
  dragon: {
    name: 'Full Reserve Breath', desc: "She lets the charge run past where instinct says to stop. The jet that comes out could gut a room, but the chest needs longer to refill after. Ranged damage +5%, fire cooldown +4%.",
    effects: [{ type:'stat', classId:'dragon', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'dragon', stat:'fireCooldown', amount:0.04 }],
  },
  windigo: {
    name: 'Absolute Zero', desc: "The frost bolt she throws now carries the full cold of her, completely undiluted — and undiluted cold takes longer to gather back up. Ranged damage +5%, fire cooldown +4%.",
    effects: [{ type:'stat', classId:'windigo', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'windigo', stat:'fireCooldown', amount:0.04 }],
  },
  kelpie: {
    name: 'Drowning Grip', desc: "She stops letting go between strikes. The grip that drags prey under doesn't loosen until it's finished, which means it takes its time getting there. Melee damage +5%, melee cooldown +4%.",
    effects: [{ type:'stat', classId:'kelpie', stat:'meleeDamage', amount:0.05 }, { type:'stat', classId:'kelpie', stat:'meleeCooldown', amount:0.04 }],
  },
  breezie: {
    name: 'Every Mote at Once', desc: "She stops firing one dust-mote at a time and simply lets the whole cloud go — glorious, and considerably slower to gather back up afterward. Ranged damage +3%, fire cooldown +4%.",
    effects: [{ type:'stat', classId:'breezie', stat:'rangedDamage', amount:0.03 }, { type:'stat', classId:'breezie', stat:'fireCooldown', amount:0.04 }],
  },
  dnbpony: {
    name: 'Drop the Bass', desc: "She stops tapping and starts dropping — every pulse hits like the whole track landed at once, and a beat that heavy is not one she can outrun. Ranged damage +5%, movement speed -4%.",
    effects: [{ type:'stat', classId:'dnbpony', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'dnbpony', stat:'speed', amount:-0.04 }],
  },
  crystalpony: {
    name: 'Full Facet Discharge', desc: "All three shards leave at once, and this time none of the charge is held back for the next volley. Ranged damage +5%, fire cooldown +4%.",
    effects: [{ type:'stat', classId:'crystalpony', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'crystalpony', stat:'fireCooldown', amount:0.04 }],
  },
  mule: {
    name: 'Foul-Tempered Kick', desc: "Carry enough of a prospector's kit long enough and some of it starts to go bad — a kick from her now leaves something behind that festers. Venom chance +5%, melee cooldown +4%.",
    effects: [{ type:'stat', classId:'mule', stat:'venomChance', amount:0.05 }, { type:'stat', classId:'mule', stat:'meleeCooldown', amount:0.04 }],
  },
  alicorn: {
    name: 'Unrestrained Aurora', desc: "She stops metering the magic through wing and horn both and simply lets it go — devastating, and the frame needs a real moment to recover from carrying that much at once. Ranged damage +5%, fire cooldown +4%.",
    effects: [{ type:'stat', classId:'alicorn', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'alicorn', stat:'fireCooldown', amount:0.04 }],
  },
  changeling: {
    name: 'Full Hive Hunger', desc: "The fire pool she plants burns hungrier than anything a lone changeling should manage on her own — hungry enough that flying while it's lit is no longer easy. Ranged damage +5%, movement speed -4%.",
    effects: [{ type:'stat', classId:'changeling', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'changeling', stat:'speed', amount:-0.04 }],
  },
  diamonddog: {
    name: 'Tunnel Sense', desc: "Years underground taught her to feel a strike coming before it lands. Reading it that well takes a beat the claw doesn't have to spare. Dodge chance +5%, melee cooldown +4%.",
    effects: [{ type:'stat', classId:'diamonddog', stat:'dodgeChance', amount:0.05 }, { type:'stat', classId:'diamonddog', stat:'meleeCooldown', amount:0.04 }],
  },
  gargoyle: {
    name: 'Stone-Cracking Bite', desc: "She stops holding the bite at half-strength — full stone-cracking force behind every shot, and stone cracked that hard needs longer to knit back together before the next one. Ranged damage +5%, fire cooldown +4%.",
    effects: [{ type:'stat', classId:'gargoyle', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'gargoyle', stat:'fireCooldown', amount:0.04 }],
  },
  changedling: {
    name: 'Full Smoulder', desc: "The ring around her stops being a smoulder and starts being a real fire — glorious, and glorious fire needs a moment to bank back down before it can flare again. Ranged damage +5%, fire cooldown +4%.",
    effects: [{ type:'stat', classId:'changedling', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'changedling', stat:'fireCooldown', amount:0.04 }],
  },
  changelingqueen: {
    name: "Sovereign's Flame", desc: "The pool she plants burns with the full weight of a hive behind it, not just her own share of one. Carrying that much magic is not something she does quickly. Ranged damage +5%, movement speed -4%.",
    effects: [{ type:'stat', classId:'changelingqueen', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'changelingqueen', stat:'speed', amount:-0.04 }],
  },
  filly: {
    name: 'Lucky Streak', desc: "There's something a foal has that nopony can quite name, and hers is running hot tonight — but the swing that goes with it still telegraphs like a foal's. Luck +5%, melee cooldown +4%.",
    effects: [{ type:'stat', classId:'filly', stat:'luck', amount:0.05 }, { type:'stat', classId:'filly', stat:'meleeCooldown', amount:0.04 }],
  },
  engineerpony: {
    name: 'Overtuned Chassis', desc: "She strips out anything not directly feeding the horn, herself included. The shot lands harder, but there is considerably less pony left to move fast. Ranged damage +5%, movement speed -4%.",
    effects: [{ type:'stat', classId:'engineerpony', stat:'rangedDamage', amount:0.05 }, { type:'stat', classId:'engineerpony', stat:'speed', amount:-0.04 }],
  },
};

(function buildCapstoneNodes(){
  for (const classId in SKILL_TREE_CAPSTONE_CONFIG) {
    const hub = 'char_hub_' + classId;
    const prefix = 'char_' + classId + '_';
    const nodesForClass = SKILL_TREE_NODES.filter(n => n.id.indexOf(prefix) === 0);
    if (!nodesForClass.length) continue; // defensive — every real classId has 50 nodes by this point
    const byId = {};
    for (const n of nodesForClass) byId[n.id] = n;
    const depthCache = {};
    function depthOf(id){
      if (id === hub) return 0;
      if (depthCache[id] != null) return depthCache[id];
      const n = byId[id];
      if (!n) return 0; // shouldn't happen — every node's parent is either hub or another node of the same class
      const d = 1 + depthOf(n.parent);
      depthCache[id] = d;
      return d;
    }
    let deepestId = null, deepestDepth = -1;
    for (const n of nodesForClass) {
      const d = depthOf(n.id);
      if (d > deepestDepth || (d === deepestDepth && (deepestId === null || n.id < deepestId))) {
        deepestDepth = d;
        deepestId = n.id;
      }
    }
    if (!deepestId) continue;
    const cfg = SKILL_TREE_CAPSTONE_CONFIG[classId];
    const node = {
      id: 'char_' + classId + '_capstone',
      parent: deepestId,
      cost: 3,
      name: cfg.name,
      desc: cfg.desc,
      effects: cfg.effects,
    };
    SKILL_TREE_NODES.push(node);
    SKILL_TREE_NODES_BY_ID[node.id] = node;
  }
})();

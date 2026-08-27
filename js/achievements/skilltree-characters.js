'use strict';
// achievements/skilltree-characters.js — Phase 8c: the 250 character skill
// nodes (10 per character x 25 classes). Pure data, appended onto the
// SKILL_TREE_NODES array/SKILL_TREE_NODES_BY_ID map defined in skilltree.js —
// no engine logic lives here, see skilltree.js for canBuySkillNode,
// buySkillNode, getSkillTreeStatBonus, computeSkillTreeLayout, etc.
//
// Topology (identical shape for every character, attached under that
// character's existing char_hub_<classId> hub node):
//
//   char_hub_<classId>
//     +- a1 (branch A opener)
//     |    +- a2a (subpath 1) -> a3a (deepest)
//     |    +- a2b (subpath 2) -> a3b (deepest)
//     +- b1 (branch B opener)
//          +- b2a (subpath 1) -> b3a (deepest)
//          +- b2b (subpath 2) -> b3b (deepest)
//
// 10 nodes per character: a1,a2a,a3a,a2b,a3b,b1,b2a,b3a,b2b,b3b.
//
// Stat design: each character picks exactly 2 stats from
// SKILL_TREE_STAT_FIELDS (skilltree.js) — one for branch A, one for branch
// B. Both subpaths within a branch target the SAME stat as their branch's
// opener (alternate flavor routes to the same specialization, not
// different stats). fireCooldown/meleeCooldown are deliberately never
// picked here: getSkillTreeStatBonus clamps a stat's summed bonus to
// [0, SKILL_TREE_STAT_CAP] before use, so a negative (cooldown-reducing)
// amount would just get floored to 0 — there is no way to author a
// cooldown-lowering (i.e. actually beneficial) node with the engine as
// written, so those two fields are skipped in favor of the other 8.
//
// Amounts, cost 1/node uniformly: opener 0.05, each depth-2 (a2a/a2b/b2a/
// b2b) 0.04, each depth-3 leaf (a3a/a3b/b3a/b3b) 0.03. Worst case for one
// branch — opener + BOTH subpath chains all bought (5 nodes) — sums to
// 0.05+0.04+0.04+0.03+0.03 = 0.19, safely under SKILL_TREE_STAT_CAP (0.25).

const SKILL_TREE_CHARACTER_CONFIG = [
  { classId:'earth', statA:'meleeDamage', statB:'luck', nodes:{
    a1:{ name:'Iron Hoof', desc:'Permanently increases melee damage by 5%.' },
    a2a:{ name:'Reinforced Kick', desc:'A heavier stomping technique. Increases melee damage by 4%.' },
    a3a:{ name:'Quarry Breaker', desc:'Strikes calibrated to shatter stone. Increases melee damage by 3%.' },
    a2b:{ name:'Sharpened Shoe', desc:'A honed edge on every horseshoe. Increases melee damage by 4%.' },
    a3b:{ name:'Anvil Strike', desc:'Hits with the weight of a smithy behind them. Increases melee damage by 3%.' },
    b1:{ name:"Prospector's Instinct", desc:'A knack for finding what others miss. Increases luck by 5%.' },
    b2a:{ name:'Four-Leaf Trot', desc:'An old farm superstition that keeps paying off. Increases luck by 4%.' },
    b3a:{ name:'Golden Horseshoe', desc:'Lucky metal, lucky hoof. Increases luck by 3%.' },
    b2b:{ name:'Earthy Fortune', desc:'The ground itself seems to favor an earth pony. Increases luck by 4%.' },
    b3b:{ name:'Buried Treasure Sense', desc:'A feel for where the good stuff is hiding. Increases luck by 3%.' },
  }},
  { classId:'pegasus', statA:'speed', statB:'meleeDamage', nodes:{
    a1:{ name:'Tailwind', desc:'A favorable gust that never quite dies down. Increases movement speed by 5%.' },
    a2a:{ name:'Cloudline Sprint', desc:'Skimming the cloud deck at a full gallop. Increases movement speed by 4%.' },
    a3a:{ name:'Sonic Trot', desc:'Pushing right up against the boom. Increases movement speed by 3%.' },
    a2b:{ name:'Featherlight Step', desc:'Barely touching the ground between strides. Increases movement speed by 4%.' },
    a3b:{ name:'Updraft Glide', desc:'Catching every rising current along the way. Increases movement speed by 3%.' },
    b1:{ name:'Wingtip Jab', desc:'A quick strike thrown from a banking turn. Increases melee damage by 5%.' },
    b2a:{ name:'Diving Strike', desc:'Momentum from a stoop channeled into the hit. Increases melee damage by 4%.' },
    b3a:{ name:'Skybound Talon', desc:'Striking from an angle no ground-bound foe expects. Increases melee damage by 3%.' },
    b2b:{ name:'Feathered Fist', desc:'A wingbeat timed into every swing. Increases melee damage by 4%.' },
    b3b:{ name:'Cloudcutter Blow', desc:'A strike sharp enough to part a cloudbank. Increases melee damage by 3%.' },
  }},
  { classId:'unicorn', statA:'rangedDamage', statB:'boltSpeed', nodes:{
    a1:{ name:'Focused Casting', desc:'Tighter control over the horn\'s output. Increases ranged damage by 5%.' },
    a2a:{ name:'Arcane Overcharge', desc:'Pushing a bolt past its usual limit. Increases ranged damage by 4%.' },
    a3a:{ name:'Piercing Sigil', desc:'A rune etched for maximum penetration. Increases ranged damage by 3%.' },
    a2b:{ name:'Runed Horn', desc:'Permanent glyphwork along the horn\'s length. Increases ranged damage by 4%.' },
    a3b:{ name:'Convergent Bolt', desc:'Magic folded tighter at the point of impact. Increases ranged damage by 3%.' },
    b1:{ name:'Kinetic Weave', desc:'Spellwork that launches bolts harder off the horn. Increases bolt speed by 5%.' },
    b2a:{ name:'Quickcast Rune', desc:'A shortcut etched straight into the casting glyph. Increases bolt speed by 4%.' },
    b3a:{ name:'Velocity Sigil', desc:'A rune tuned purely for launch speed. Increases bolt speed by 3%.' },
    b2b:{ name:'Streamlined Bolt', desc:'Magic shaped to cut the air more cleanly. Increases bolt speed by 4%.' },
    b3b:{ name:'Snapcast Discharge', desc:'Releasing the spell the instant it forms. Increases bolt speed by 3%.' },
  }},
  { classId:'batpony', statA:'meleeDamage', statB:'speed', nodes:{
    a1:{ name:'Nightclaw', desc:'Claws honed for a night hunter\'s strike. Increases melee damage by 5%.' },
    a2a:{ name:'Fang and Talon', desc:'Every strike lands with bared teeth behind it. Increases melee damage by 4%.' },
    a3a:{ name:'Midnight Rend', desc:'A tearing strike saved for the deepest dark. Increases melee damage by 3%.' },
    a2b:{ name:'Echolocated Strike', desc:'Hearing exactly where to land the blow. Increases melee damage by 4%.' },
    a3b:{ name:'Silent Predator', desc:'The last sound a foe hears is nothing at all. Increases melee damage by 3%.' },
    b1:{ name:'Nocturnal Dash', desc:'Quicker on the wing once the sun goes down. Increases movement speed by 5%.' },
    b2a:{ name:'Batwing Burst', desc:'A sudden snap of the wings for extra speed. Increases movement speed by 4%.' },
    b3a:{ name:'Moonlit Sprint', desc:'Fastest under a full moon\'s light. Increases movement speed by 3%.' },
    b2b:{ name:'Cave Draft', desc:'Riding the updrafts of a home cavern. Increases movement speed by 4%.' },
    b3b:{ name:'Shadowglide', desc:'Slipping between patches of darkness at speed. Increases movement speed by 3%.' },
  }},
  { classId:'zebra', statA:'meleeDamage', statB:'critChance', nodes:{
    a1:{ name:'Savanna Fury', desc:'The ferocity of the plains, unleashed in a hoof. Increases melee damage by 5%.' },
    a2a:{ name:'War Paint Strike', desc:'Ritual markings that sharpen every blow. Increases melee damage by 4%.' },
    a3a:{ name:'Bone-Breaker Kick', desc:'A kick meant to end a fight in one blow. Increases melee damage by 3%.' },
    a2b:{ name:'Tribal Ferocity', desc:'Generations of hard-won strength behind the strike. Increases melee damage by 4%.' },
    a3b:{ name:'Stampede Hoof', desc:'Hits with the force of a herd on the run. Increases melee damage by 3%.' },
    b1:{ name:"Hunter's Focus", desc:'A predator\'s eye for the perfect opening. Increases critical hit chance by 5%.' },
    b2a:{ name:'Predatory Instinct', desc:'Knowing exactly where a foe is weakest. Increases critical hit chance by 4%.' },
    b3a:{ name:'Killing Stripe', desc:'A strike aimed with lethal precision. Increases critical hit chance by 3%.' },
    b2b:{ name:'Vital Point Sense', desc:'An instinct for the spot that ends the fight fastest. Increases critical hit chance by 4%.' },
    b3b:{ name:'Precision Strike', desc:'No wasted motion, no wasted force. Increases critical hit chance by 3%.' },
  }},
  { classId:'hypogriff', statA:'speed', statB:'meleeDamage', nodes:{
    a1:{ name:"Lion's Bound", desc:'A leaping stride borrowed from the big cats. Increases movement speed by 5%.' },
    a2a:{ name:'Eagle Dive', desc:'Folding into a stoop and pulling out at a sprint. Increases movement speed by 4%.' },
    a3a:{ name:'Windswept Pursuit', desc:'Outrunning the very air currents used to fly. Increases movement speed by 3%.' },
    a2b:{ name:'Talon Sprint', desc:'Digging in with claws for extra push-off. Increases movement speed by 4%.' },
    a3b:{ name:'Thermal Surge', desc:'Riding a rising column of warm air for a burst of speed. Increases movement speed by 3%.' },
    b1:{ name:'Raptor Strike', desc:'A hooked, tearing blow. Increases melee damage by 5%.' },
    b2a:{ name:'Rending Claw', desc:'Talons that don\'t just hit, they tear. Increases melee damage by 4%.' },
    b3a:{ name:'Apex Predator Bite', desc:'The bite of something at the top of the food chain. Increases melee damage by 3%.' },
    b2b:{ name:'Crushing Beak', desc:'A beak strike with real weight behind it. Increases melee damage by 4%.' },
    b3b:{ name:'Savage Pounce', desc:'All four limbs committed to a single devastating strike. Increases melee damage by 3%.' },
  }},
  { classId:'seapony', statA:'rangedDamage', statB:'critChance', nodes:{
    a1:{ name:'Tidal Surge', desc:'A bolt driven forward like a rising tide. Increases ranged damage by 5%.' },
    a2a:{ name:'Rolling Wave Bolt', desc:'Building force the way a wave builds toward shore. Increases ranged damage by 4%.' },
    a3a:{ name:'Undertow Strike', desc:'A blow that drags a foe down with it. Increases ranged damage by 3%.' },
    a2b:{ name:'Pressurized Jet', desc:'Water compressed to a punishing point. Increases ranged damage by 4%.' },
    a3b:{ name:'Abyssal Force', desc:'Pressure drawn up from the deepest trench. Increases ranged damage by 3%.' },
    b1:{ name:'Current Reading', desc:'Sensing exactly where the flow favors a strike. Increases critical hit chance by 5%.' },
    b2a:{ name:'Riptide Instinct', desc:'A sudden, unseen pull toward the weak point. Increases critical hit chance by 4%.' },
    b3a:{ name:'Deepwater Precision', desc:'Aim honed in crushing, lightless depths. Increases critical hit chance by 3%.' },
    b2b:{ name:"School's Eye", desc:'A shoal\'s instinct for exactly where to strike. Increases critical hit chance by 4%.' },
    b3b:{ name:'Pearl-Sharp Focus', desc:'A single flawless moment of clarity. Increases critical hit chance by 3%.' },
  }},
  { classId:'ponybot', statA:'rangedDamage', statB:'rangeTiles', nodes:{
    a1:{ name:'Overclocked Coils', desc:'Running the laser well past factory spec. Increases ranged damage by 5%.' },
    a2a:{ name:'Amplified Emitter', desc:'A retrofit that pumps more power through every shot. Increases ranged damage by 4%.' },
    a3a:{ name:'Reactor Surge', desc:'Diverting every spare watt into the beam. Increases ranged damage by 3%.' },
    a2b:{ name:'Focused Capacitor', desc:'Discharging stored power all at once. Increases ranged damage by 4%.' },
    a3b:{ name:'Peak Output Routine', desc:'A firmware tweak that squeezes out a little more. Increases ranged damage by 3%.' },
    b1:{ name:'Extended Beam Array', desc:'A longer emitter housing for a longer reach. Increases range by 5%.' },
    b2a:{ name:'Long-Focus Lens', desc:'A lens ground for distance over spread. Increases range by 4%.' },
    b3a:{ name:'Horizon Calibration', desc:'Recalibrated to track a target across the whole room. Increases range by 3%.' },
    b2b:{ name:'Wide-Beam Housing', desc:'A housing that keeps the beam coherent further out. Increases range by 4%.' },
    b3b:{ name:'Full-Room Sweep', desc:'Tuned to cover a room from corner to corner. Increases range by 3%.' },
  }},
  { classId:'griffin', statA:'speed', statB:'boltSpeed', nodes:{
    a1:{ name:'Hunting Dive', desc:'A predator\'s burst of speed the instant prey is sighted. Increases movement speed by 5%.' },
    a2a:{ name:'Gale Wingbeat', desc:'Wingbeats timed to a strong tailwind. Increases movement speed by 4%.' },
    a3a:{ name:'Aerial Chase', desc:'Built for closing distance fast and staying on target. Increases movement speed by 3%.' },
    a2b:{ name:'Sharp Turn Instinct', desc:'Cutting corners no straight-line flier could manage. Increases movement speed by 4%.' },
    a3b:{ name:'Talon-First Rush', desc:'Committing fully to the charge. Increases movement speed by 3%.' },
    b1:{ name:'Feather Volley Tempo', desc:'A faster release on every volley. Increases bolt speed by 5%.' },
    b2a:{ name:'Rapid Molt Release', desc:'Loosing feathers the instant they\'re ready. Increases bolt speed by 4%.' },
    b3a:{ name:'Barrage Rhythm', desc:'A practiced cadence that never slows the volley. Increases bolt speed by 3%.' },
    b2b:{ name:'Whipcrack Feather', desc:'A snap of the wing that sends feathers out fast. Increases bolt speed by 4%.' },
    b3b:{ name:'Hurricane Volley', desc:'Feathers loosed with storm-force behind them. Increases bolt speed by 3%.' },
  }},
  { classId:'kirin', statA:'rangedDamage', statB:'critChance', nodes:{
    a1:{ name:'Smoldering Wrath', desc:'Heat building toward the breaking point. Increases ranged damage by 5%.' },
    a2a:{ name:'Cinder Vein', desc:'Fire running just beneath the surface. Increases ranged damage by 4%.' },
    a3a:{ name:'Firestorm Core', desc:'A concentrated blaze at the very center of the wrath. Increases ranged damage by 3%.' },
    a2b:{ name:'Molten Focus', desc:'Channeling heat instead of letting it escape. Increases ranged damage by 4%.' },
    a3b:{ name:'Blazing Reckoning', desc:'The final release, held back as long as possible. Increases ranged damage by 3%.' },
    b1:{ name:'Vengeful Precision', desc:'One shot, aimed to matter. Increases critical hit chance by 5%.' },
    b2a:{ name:"Ember's Eye", desc:'Sighting a target through the heat haze. Increases critical hit chance by 4%.' },
    b3a:{ name:'Wrathful Strike', desc:'Every ounce of anger aimed at a single point. Increases critical hit chance by 3%.' },
    b2b:{ name:'Fury Unleashed', desc:'Nothing held in reserve. Increases critical hit chance by 4%.' },
    b3b:{ name:'One Chance, One Kill', desc:'There is no second shot, so the first one counts. Increases critical hit chance by 3%.' },
  }},
  { classId:'dragon', statA:'rangedDamage', statB:'rangeTiles', nodes:{
    a1:{ name:'Draconic Fury', desc:'Old, deep power behind every charged shot. Increases ranged damage by 5%.' },
    a2a:{ name:'Molten Breath', desc:'A hotter core to the charge before release. Increases ranged damage by 4%.' },
    a3a:{ name:"Whelp's Wrath", desc:'Young, but already burning fiercer than most. Increases ranged damage by 3%.' },
    a2b:{ name:'Scaled Intensity', desc:'Thicker scales let more heat build before release. Increases ranged damage by 4%.' },
    a3b:{ name:'Inferno Core', desc:'A furnace at the center of every charge. Increases ranged damage by 3%.' },
    b1:{ name:'Extended Jet', desc:'Pushing the short-range jet a little further out. Increases range by 5%.' },
    b2a:{ name:'Reaching Flame', desc:'Sustained heat that carries further before fading. Increases range by 4%.' },
    b3a:{ name:'Long Fire Lungs', desc:'Deeper breath, longer flame. Increases range by 3%.' },
    b2b:{ name:'Wide Firebreath', desc:'A broader jet that still carries its punch. Increases range by 4%.' },
    b3b:{ name:'Farthrown Cinder', desc:'Embers that travel further than they have any right to. Increases range by 3%.' },
  }},
  { classId:'windigo', statA:'rangedDamage', statB:'boltSpeed', nodes:{
    a1:{ name:'Frostbitten Fury', desc:'Cold sharpened into something that hits harder. Increases ranged damage by 5%.' },
    a2a:{ name:'Bitter Chill', desc:'A deeper cold packed into every bolt. Increases ranged damage by 4%.' },
    a3a:{ name:'Absolute Zero', desc:'Cold with nothing left to give. Increases ranged damage by 3%.' },
    a2b:{ name:'Howling Frost', desc:'A screaming wind wrapped around the bolt. Increases ranged damage by 4%.' },
    a3b:{ name:'Killing Cold', desc:'Cold enough that it stops being just a chill. Increases ranged damage by 3%.' },
    b1:{ name:"Blizzard's Haste", desc:'Riding the storm\'s own speed. Increases bolt speed by 5%.' },
    b2a:{ name:'Wind-Driven Bolt', desc:'Letting the gale do some of the work. Increases bolt speed by 4%.' },
    b3a:{ name:'Gale Force Frost', desc:'A frost bolt thrown with real wind behind it. Increases bolt speed by 3%.' },
    b2b:{ name:'Icy Slipstream', desc:'A frictionless path cut through the air. Increases bolt speed by 4%.' },
    b3b:{ name:'Northern Squall', desc:'The full fury of a winter storm behind the throw. Increases bolt speed by 3%.' },
  }},
  { classId:'kelpie', statA:'meleeDamage', statB:'rangeTiles', nodes:{
    a1:{ name:'Drowning Grip', desc:'A grip that doesn\'t let go once it finds purchase. Increases melee damage by 5%.' },
    a2a:{ name:'Undertow Crush', desc:'Pulling a foe under before the strike lands. Increases melee damage by 4%.' },
    a3a:{ name:'River Maw', desc:'Jaws that have dragged down far larger prey. Increases melee damage by 3%.' },
    a2b:{ name:'Waterlogged Fury', desc:'Weight and momentum from a lifetime in deep water. Increases melee damage by 4%.' },
    a3b:{ name:'Silt-Deep Grasp', desc:'A grip forged in the riverbed itself. Increases melee damage by 3%.' },
    b1:{ name:'Extended Reach', desc:'A longer pull from further out. Increases range by 5%.' },
    b2a:{ name:'Longshore Drag', desc:'Dragging prey in from well beyond arm\'s length. Increases range by 4%.' },
    b3a:{ name:'Riverbed Sprawl', desc:'A reach that spans the whole width of a stream. Increases range by 3%.' },
    b2b:{ name:'Trailing Current', desc:'Letting the current itself extend the grasp. Increases range by 4%.' },
    b3b:{ name:'Farshore Snare', desc:'Reaching all the way to the far bank. Increases range by 3%.' },
  }},
  { classId:'breezie', statA:'speed', statB:'boltSpeed', nodes:{
    a1:{ name:'Windborne Flit', desc:'Barely more than a mote on the breeze. Increases movement speed by 5%.' },
    a2a:{ name:'Pollen Dash', desc:'Darting the way pollen skips on a gust. Increases movement speed by 4%.' },
    a3a:{ name:'Gossamer Sprint', desc:'Lighter than anything else in Equestria. Increases movement speed by 3%.' },
    a2b:{ name:'Featherweight Dart', desc:'A quick zigzag too fast to track. Increases movement speed by 4%.' },
    a3b:{ name:'Zephyr Step', desc:'A stride that catches the smallest gust and rides it. Increases movement speed by 3%.' },
    b1:{ name:'Dustmote Acceleration', desc:'Motes that never lose momentum, only gain it. Increases bolt speed by 5%.' },
    b2a:{ name:'Sunbeam Rider', desc:'Riding a shaft of light out into the room. Increases bolt speed by 4%.' },
    b3a:{ name:'Motes on the Wind', desc:'Letting the air itself carry the shot faster. Increases bolt speed by 3%.' },
    b2b:{ name:'Static Charge', desc:'A tiny spark that sends the mote flying. Increases bolt speed by 4%.' },
    b3b:{ name:'Breeze-Caught Spark', desc:'Caught in a gust and thrown further and faster. Increases bolt speed by 3%.' },
  }},
  { classId:'dnbpony', statA:'rangedDamage', statB:'speed', nodes:{
    a1:{ name:'Bass Drop', desc:'A pulse that hits like the drop itself. Increases ranged damage by 5%.' },
    a2a:{ name:'Amplified Pulse', desc:'Turning the gain up past the redline. Increases ranged damage by 4%.' },
    a3a:{ name:'Subwoofer Surge', desc:'Low-end power that shakes the whole room. Increases ranged damage by 3%.' },
    a2b:{ name:'Neon Overdrive', desc:'Violet light overloaded into raw force. Increases ranged damage by 4%.' },
    a3b:{ name:'Peak Frequency', desc:'Hitting the exact frequency that hurts most. Increases ranged damage by 3%.' },
    b1:{ name:'Drop the Beat', desc:'Moving to a tempo nothing else can match. Increases movement speed by 5%.' },
    b2a:{ name:'Breakbeat Rush', desc:'A stutter-step pattern that\'s somehow faster than running straight. Increases movement speed by 4%.' },
    b3a:{ name:'Tempo Overclock', desc:'Pushing the beat past what a body should handle. Increases movement speed by 3%.' },
    b2b:{ name:'Violet Blur', desc:'Moving fast enough to leave a trail of color. Increases movement speed by 4%.' },
    b3b:{ name:'Rave Momentum', desc:'Never quite stopping once the music starts. Increases movement speed by 3%.' },
  }},
  { classId:'crystalpony', statA:'rangedDamage', statB:'luck', nodes:{
    a1:{ name:'Faceted Focus', desc:'Every facet of the horn aimed at one point. Increases ranged damage by 5%.' },
    a2a:{ name:'Prism Convergence', desc:'Light and magic bent to meet at a single spot. Increases ranged damage by 4%.' },
    a3a:{ name:'Diamond-Hard Shard', desc:'A shard cut harder than anything else in the flank. Increases ranged damage by 3%.' },
    a2b:{ name:'Refracted Volley', desc:'Splitting and reforming the charge for extra bite. Increases ranged damage by 4%.' },
    a3b:{ name:'Gemstone Overcharge', desc:'Pushing a crystal shard past its normal limit. Increases ranged damage by 3%.' },
    b1:{ name:'Crystalline Fortune', desc:'The Empire\'s old magic still favors its own. Increases luck by 5%.' },
    b2a:{ name:'Radiant Gleam', desc:'A shine that seems to catch the eye of fortune itself. Increases luck by 4%.' },
    b3a:{ name:"Empire's Blessing", desc:'An old blessing, faceted and worn close to the heart. Increases luck by 3%.' },
    b2b:{ name:'Shimmering Omen', desc:'A glint that always seems to mean something good. Increases luck by 4%.' },
    b3b:{ name:"Prospector's Facet", desc:'A cut gem that seems to find more of its kind. Increases luck by 3%.' },
  }},
  { classId:'mule', statA:'meleeDamage', statB:'magnetRadius', nodes:{
    a1:{ name:"Pack Animal's Kick", desc:'A kick backed by a lifetime of hauling heavy loads. Increases melee damage by 5%.' },
    a2a:{ name:'Stubborn Haul', desc:'Refusing to pull a punch any more than a cart. Increases melee damage by 4%.' },
    a3a:{ name:'Loaded Wallop', desc:'All that saddlebag weight, put behind a single swing. Increases melee damage by 3%.' },
    a2b:{ name:'Full Saddlebag Swing', desc:'Momentum from a fully loaded pack. Increases melee damage by 4%.' },
    a3b:{ name:'Overburdened Stomp', desc:'A stomp that lands like the whole cart came down with it. Increases melee damage by 3%.' },
    b1:{ name:"Prospector's Reach", desc:'An eye trained to spot every last coin on the ground. Increases pickup magnet radius by 5%.' },
    b2a:{ name:'Wide Gathering Stride', desc:'A wider sweep with every pass through a room. Increases pickup magnet radius by 4%.' },
    b3a:{ name:'Deep Pocket Pull', desc:'Never leaving a satchel with room to spare. Increases pickup magnet radius by 3%.' },
    b2b:{ name:'Sturdy Satchel Draw', desc:'A satchel built to catch what a lesser pack would miss. Increases pickup magnet radius by 4%.' },
    b3b:{ name:'Trailside Scavenging', desc:'Years on the trail teach a mule to miss nothing. Increases pickup magnet radius by 3%.' },
  }},
  { classId:'alicorn', statA:'rangedDamage', statB:'speed', nodes:{
    a1:{ name:'Twin Gift Casting', desc:'Wing and horn magic braided into one bolt. Increases ranged damage by 5%.' },
    a2a:{ name:'Celestial Charge', desc:'Power drawn from sun and sky alike. Increases ranged damage by 4%.' },
    a3a:{ name:'Solar Overcharge', desc:'A bolt burning as bright as it can go. Increases ranged damage by 3%.' },
    a2b:{ name:'Lunar Focus', desc:'A cooler, more precise channel of magic. Increases ranged damage by 4%.' },
    a3b:{ name:'Starlight Convergence', desc:'Every point of light bent toward a single strike. Increases ranged damage by 3%.' },
    b1:{ name:'Wingborne Grace', desc:'Flight and stride moving as one. Increases movement speed by 5%.' },
    b2a:{ name:'Skybound Trot', desc:'A gait that barely remembers the ground. Increases movement speed by 4%.' },
    b3a:{ name:'Windswept Ascent', desc:'Rising into open air at the first opportunity. Increases movement speed by 3%.' },
    b2b:{ name:'Effortless Flight', desc:'Wingbeats that cost almost nothing to keep up. Increases movement speed by 4%.' },
    b3b:{ name:'Royal Momentum', desc:'A pace that simply doesn\'t slow down. Increases movement speed by 3%.' },
  }},
  { classId:'changeling', statA:'rangedDamage', statB:'speed', nodes:{
    a1:{ name:'Hungry Flame', desc:'Fire that burns hotter the longer it feeds. Increases ranged damage by 5%.' },
    a2a:{ name:'Feeding Fire', desc:'Every kill stokes the green flame a little higher. Increases ranged damage by 4%.' },
    a3a:{ name:'Insatiable Blaze', desc:'A fire that never quite has enough. Increases ranged damage by 3%.' },
    a2b:{ name:'Chitinous Focus', desc:'A carapace that channels more than it deflects. Increases ranged damage by 4%.' },
    a3b:{ name:'Hive-Fed Inferno', desc:'Drawing on strength the whole hive shares. Increases ranged damage by 3%.' },
    b1:{ name:"Infiltrator's Speed", desc:'Quick enough to be gone before anypony notices. Increases movement speed by 5%.' },
    b2a:{ name:'Buzzing Wingbeat', desc:'A rapid, near-silent flutter. Increases movement speed by 4%.' },
    b3a:{ name:'Silent Approach', desc:'Closing distance without ever being seen coming. Increases movement speed by 3%.' },
    b2b:{ name:'Disguised Dash', desc:'Moving fastest right when nopony expects it. Increases movement speed by 4%.' },
    b3b:{ name:'Swarm Instinct', desc:'A hive\'s reflexes, borrowed for a burst of speed. Increases movement speed by 3%.' },
  }},
  { classId:'diamonddog', statA:'meleeDamage', statB:'magnetRadius', nodes:{
    a1:{ name:'Pickaxe Claw', desc:'A claw that lands like it was forged for mining, not fighting. Increases melee damage by 5%.' },
    a2a:{ name:'Tunnel Breaker', desc:'A strike built to bring a shaft down. Increases melee damage by 4%.' },
    a3a:{ name:'Bedrock Shatter', desc:'Enough force to crack the deepest stone. Increases melee damage by 3%.' },
    a2b:{ name:"Gem Hound's Fury", desc:'Nothing gets between a diamond dog and the vein. Increases melee damage by 4%.' },
    a3b:{ name:'Cave-In Force', desc:'A blow with the weight of a collapsing tunnel. Increases melee damage by 3%.' },
    b1:{ name:'Gem Sense', desc:'A nose that can find gemstones through solid rock. Increases pickup magnet radius by 5%.' },
    b2a:{ name:'Buried Treasure Nose', desc:'Sniffing out loot buried well out of sight. Increases pickup magnet radius by 4%.' },
    b3a:{ name:'Deep Vein Instinct', desc:'Knowing exactly where the richest seam runs. Increases pickup magnet radius by 3%.' },
    b2b:{ name:'Satchel of Spoils', desc:'A bag that never seems to miss a haul. Increases pickup magnet radius by 4%.' },
    b3b:{ name:"Hoarder's Grasp", desc:'An instinct to pull in everything shiny nearby. Increases pickup magnet radius by 3%.' },
  }},
  { classId:'gargoyle', statA:'rangedDamage', statB:'critChance', nodes:{
    a1:{ name:'Stone Bite', desc:'A bite with the weight of granite behind it. Increases ranged damage by 5%.' },
    a2a:{ name:'Nightfall Volley', desc:'Strongest just as the sun goes down. Increases ranged damage by 4%.' },
    a3a:{ name:"Gargoyle's Judgment", desc:'A verdict delivered from a rooftop perch. Increases ranged damage by 3%.' },
    a2b:{ name:'Weathered Fury', desc:'Centuries of standing watch, released all at once. Increases ranged damage by 4%.' },
    a3b:{ name:'Grit-Hard Barrage', desc:'Every shot as unyielding as stone. Increases ranged damage by 3%.' },
    b1:{ name:'Marked Prey Instinct', desc:'A sentinel\'s eye for exactly where to strike. Increases critical hit chance by 5%.' },
    b2a:{ name:'Vulnerable Point Sense', desc:'Reading a target\'s weak spot before it moves. Increases critical hit chance by 4%.' },
    b3a:{ name:"Sentinel's Precision", desc:'Centuries of watching teach exactly where to strike. Increases critical hit chance by 3%.' },
    b2b:{ name:"Predator's Eye", desc:'A gaze that misses nothing worth marking. Increases critical hit chance by 4%.' },
    b3b:{ name:'Stalking Strike', desc:'A strike that only comes after the mark is set. Increases critical hit chance by 3%.' },
  }},
  { classId:'changedling', statA:'speed', statB:'rangedDamage', nodes:{
    a1:{ name:'Half-Formed Speed', desc:'Moving fastest of anything still caught between forms. Increases movement speed by 5%.' },
    a2a:{ name:'Restless Wingbeat', desc:'Wings that never quite settle into a steady rhythm. Increases movement speed by 4%.' },
    a3a:{ name:'Unfinished Flight', desc:'A flight pattern too erratic to predict, and too fast to catch. Increases movement speed by 3%.' },
    a2b:{ name:'Smoldering Haste', desc:'Heat that pushes every wingbeat a little further. Increases movement speed by 4%.' },
    a3b:{ name:'Flickering Pace', desc:'A stride that seems to blur at the edges. Increases movement speed by 3%.' },
    b1:{ name:'Ember Trail', desc:'A permanent ring of fire, burning a little hotter. Increases ranged damage by 5%.' },
    b2a:{ name:'Ring of Embers', desc:'The smoldering ring drawn in tighter and hotter. Increases ranged damage by 4%.' },
    b3a:{ name:'Perpetual Smolder', desc:'A flame that never has to catch, because it never went out. Increases ranged damage by 3%.' },
    b2b:{ name:'Caught Mid-Change', desc:'The unstable form burns hotter than either shape it\'s between. Increases ranged damage by 4%.' },
    b3b:{ name:'Unstable Flame', desc:'Fire that flares unpredictably, and always upward. Increases ranged damage by 3%.' },
  }},
  { classId:'changelingqueen', statA:'rangedDamage', statB:'magnetRadius', nodes:{
    a1:{ name:"Hive Mother's Flame", desc:'A low flame with the whole hive\'s strength behind it. Increases ranged damage by 5%.' },
    a2a:{ name:"Matriarch's Fire", desc:'Fire that answers to her will alone. Increases ranged damage by 4%.' },
    a3a:{ name:"Queen's Wrath", desc:'Rarely shown, but unmistakable when it is. Increases ranged damage by 3%.' },
    a2b:{ name:'Coalburning Focus', desc:'A steady, banked heat that never quite goes out. Increases ranged damage by 4%.' },
    a3b:{ name:'Undying Ember', desc:'A coal that has outlasted every challenger to the hive. Increases ranged damage by 3%.' },
    b1:{ name:'Hive Gathering', desc:'Everything the hive finds eventually comes back to her. Increases pickup magnet radius by 5%.' },
    b2a:{ name:"Swarm's Pull", desc:'Minions drawn to gather what she cannot reach herself. Increases pickup magnet radius by 4%.' },
    b3a:{ name:'Colony Instinct', desc:'An instinct for provisioning shared by the whole hive. Increases pickup magnet radius by 3%.' },
    b2b:{ name:'Brood Call', desc:'A summons that brings resources as well as minions. Increases pickup magnet radius by 4%.' },
    b3b:{ name:'Nest Provisioning', desc:'A queen never lets her hive go without. Increases pickup magnet radius by 3%.' },
  }},
  { classId:'filly', statA:'meleeDamage', statB:'luck', nodes:{
    a1:{ name:'Determined Kick', desc:'Small hooves, but a lot of determination behind them. Increases melee damage by 5%.' },
    a2a:{ name:'Stubborn Stomp', desc:'Refusing to hit any softer than a grown mare would. Increases melee damage by 4%.' },
    a3a:{ name:'Growing Spirit', desc:'Getting a little stronger with every fight. Increases melee damage by 3%.' },
    a2b:{ name:'Plucky Swing', desc:'A swing thrown with more heart than technique, and it works. Increases melee damage by 4%.' },
    a3b:{ name:'Nopony Says No', desc:'Somehow, the hit always lands exactly where it needs to. Increases melee damage by 3%.' },
    b1:{ name:"Foal's Fortune", desc:'The unearned luck of somepony too young to know better. Increases luck by 5%.' },
    b2a:{ name:'Wishing Star', desc:'A wish made on the first star of the night. Increases luck by 4%.' },
    b3a:{ name:'Charmed Horseshoe', desc:'A trinket kept for good luck, and it seems to work. Increases luck by 4%.' },
    b2b:{ name:'Lucky Trinket', desc:'A little charm kept in a saddlebag for good measure. Increases luck by 4%.' },
    b3b:{ name:'Innocent Charm', desc:'Things just seem to go right when she\'s around. Increases luck by 3%.' },
  }},
  { classId:'engineerpony', statA:'rangedDamage', statB:'magnetRadius', nodes:{
    a1:{ name:'Calibrated Bolt', desc:'A shot tuned with real workshop precision. Increases ranged damage by 5%.' },
    a2a:{ name:'Overtuned Capacitor', desc:'Squeezing extra output past the rated limit. Increases ranged damage by 4%.' },
    a3a:{ name:'Precision Engineering', desc:'Every part machined to exact tolerances. Increases ranged damage by 3%.' },
    a2b:{ name:'Spare Parts Cannon', desc:'A jury-rigged boost cobbled from the bandolier. Increases ranged damage by 4%.' },
    a3b:{ name:'Workshop Overclock', desc:'Running hot, but hitting harder for it. Increases ranged damage by 3%.' },
    b1:{ name:'Scrap Magnet Rig', desc:'A retrofit that pulls in loose parts from further away. Increases pickup magnet radius by 5%.' },
    b2a:{ name:'Salvage Sense', desc:'An eye trained to spot useful scrap at a glance. Increases pickup magnet radius by 4%.' },
    b3a:{ name:'Bandolier of Parts', desc:'A bandolier built to hold more than it should. Increases pickup magnet radius by 3%.' },
    b2b:{ name:"Tinkerer's Pull", desc:'A small magnetic rig, soldered on as an afterthought that works too well. Increases pickup magnet radius by 4%.' },
    b3b:{ name:'Efficient Collection', desc:'Nothing useful gets left behind on a supply run. Increases pickup magnet radius by 3%.' },
  }},
];

// Phase 8f-topology — per-character tree SHAPE. Each of the 25 characters'
// 20 nodes (10 here + 10 more in skilltree-characters-2.js) used to follow
// one identical rigid template (every branch a 5-node opener+2-subpaths Y).
// This table replaces that single global parent-lookup with a hand-designed,
// per-classId one, so each character's tree has a genuinely different shape
// (branch count, width, depth) — see the design notes at the top of
// design_topology.js (feature-research/phase8-metaprogression/ audit) for
// the method: each of the four original 5-node "branches" (opener + two
// 2-node subpath chains) is still internally order-preserving (a node that
// was deeper in its own original chain still requires strictly more prior
// purchases to reach — see the module comment above), but WHERE each branch
// attaches (directly to the hub, or nested/grafted under another branch's
// node — including nodes defined in skilltree-characters-2.js, resolved
// purely by id string so file load order doesn't matter) and its internal
// shape (a straight Y, a single-file chain, a late fork, or a wide
// partway-fork) are freely varied per character. Values are the FULL parent
// node id (either 'char_hub_<classId>' or another 'char_<classId>_<key>'),
// not just a local key, precisely so a node here can be grafted under a
// node this file doesn't even define (a c*/d* key from the -2 file).
// Node id/name/desc/effect content is completely unchanged from the
// original template — only this parent wiring differs.
const SKILL_TREE_CHAR_TOPOLOGY = {
  earth: { a1:'char_hub_earth', a2a:'char_earth_a1', a3a:'char_earth_a2a', a2b:'char_earth_a1', a3b:'char_earth_a2b', b1:'char_hub_earth', b2a:'char_earth_b1', b3a:'char_earth_b2a', b2b:'char_earth_b3a', b3b:'char_earth_b2b' },
  pegasus: { a1:'char_hub_pegasus', a2a:'char_pegasus_a1', a3a:'char_pegasus_a2a', a2b:'char_pegasus_a1', a3b:'char_pegasus_a2b', b1:'char_pegasus_a3b', b2a:'char_pegasus_b1', b3a:'char_pegasus_b2a', b2b:'char_pegasus_b2a', b3b:'char_pegasus_b2b' },
  unicorn: { a1:'char_hub_unicorn', a2a:'char_unicorn_a1', a3a:'char_unicorn_a2b', a2b:'char_unicorn_a2a', a3b:'char_unicorn_a2b', b1:'char_unicorn_a2a', b2a:'char_unicorn_b1', b3a:'char_unicorn_b2a', b2b:'char_unicorn_b1', b3b:'char_unicorn_b2b' },
  batpony: { a1:'char_hub_batpony', a2a:'char_batpony_a1', a3a:'char_batpony_a2a', a2b:'char_batpony_a1', a3b:'char_batpony_a2b', b1:'char_batpony_a3a', b2a:'char_batpony_b1', b3a:'char_batpony_b2a', b2b:'char_batpony_b2a', b3b:'char_batpony_b2b' },
  zebra: { a1:'char_hub_zebra', a2a:'char_zebra_a1', a3a:'char_zebra_a2a', a2b:'char_zebra_a1', a3b:'char_zebra_a2b', b1:'char_zebra_a2b', b2a:'char_zebra_b1', b3a:'char_zebra_b2a', b2b:'char_zebra_b3a', b3b:'char_zebra_b2b' },
  hypogriff: { a1:'char_hub_hypogriff', a2a:'char_hypogriff_a1', a3a:'char_hypogriff_a2a', a2b:'char_hypogriff_a2a', a3b:'char_hypogriff_a2b', b1:'char_hub_hypogriff', b2a:'char_hypogriff_b1', b3a:'char_hypogriff_b2a', b2b:'char_hypogriff_b1', b3b:'char_hypogriff_b2b' },
  seapony: { a1:'char_hub_seapony', a2a:'char_seapony_a1', a3a:'char_seapony_a2a', a2b:'char_seapony_a1', a3b:'char_seapony_a2b', b1:'char_hub_seapony', b2a:'char_seapony_b1', b3a:'char_seapony_b2a', b2b:'char_seapony_b2a', b3b:'char_seapony_b2b' },
  ponybot: { a1:'char_hub_ponybot', a2a:'char_ponybot_a1', a3a:'char_ponybot_a2b', a2b:'char_ponybot_a2a', a3b:'char_ponybot_a2b', b1:'char_hub_ponybot', b2a:'char_ponybot_b1', b3a:'char_ponybot_b2a', b2b:'char_ponybot_b2a', b3b:'char_ponybot_b2b' },
  griffin: { a1:'char_hub_griffin', a2a:'char_griffin_a1', a3a:'char_griffin_a2a', a2b:'char_griffin_a1', a3b:'char_griffin_a2b', b1:'char_hub_griffin', b2a:'char_griffin_b1', b3a:'char_griffin_b2a', b2b:'char_griffin_b1', b3b:'char_griffin_b2b' },
  kirin: { a1:'char_hub_kirin', a2a:'char_kirin_a1', a3a:'char_kirin_a2a', a2b:'char_kirin_a1', a3b:'char_kirin_a2b', b1:'char_hub_kirin', b2a:'char_kirin_b1', b3a:'char_kirin_b2a', b2b:'char_kirin_b1', b3b:'char_kirin_b2b' },
  dragon: { a1:'char_hub_dragon', a2a:'char_dragon_a1', a3a:'char_dragon_a2a', a2b:'char_dragon_a1', a3b:'char_dragon_a2b', b1:'char_hub_dragon', b2a:'char_dragon_b1', b3a:'char_dragon_b2a', b2b:'char_dragon_b3a', b3b:'char_dragon_b2b' },
  windigo: { a1:'char_hub_windigo', a2a:'char_windigo_a1', a3a:'char_windigo_a2a', a2b:'char_windigo_a3a', a3b:'char_windigo_a2b', b1:'char_windigo_a2a', b2a:'char_windigo_b1', b3a:'char_windigo_b2a', b2b:'char_windigo_b1', b3b:'char_windigo_b2b' },
  kelpie: { a1:'char_kelpie_b3a', a2a:'char_kelpie_a1', a3a:'char_kelpie_a2a', a2b:'char_kelpie_a1', a3b:'char_kelpie_a2b', b1:'char_kelpie_c2a', b2a:'char_kelpie_b1', b3a:'char_kelpie_b2b', b2b:'char_kelpie_b2a', b3b:'char_kelpie_b2b' },
  breezie: { a1:'char_hub_breezie', a2a:'char_breezie_a1', a3a:'char_breezie_a2a', a2b:'char_breezie_a1', a3b:'char_breezie_a2b', b1:'char_breezie_a2a', b2a:'char_breezie_b1', b3a:'char_breezie_b2a', b2b:'char_breezie_b3a', b3b:'char_breezie_b2b' },
  dnbpony: { a1:'char_hub_dnbpony', a2a:'char_dnbpony_a1', a3a:'char_dnbpony_a2b', a2b:'char_dnbpony_a2a', a3b:'char_dnbpony_a2b', b1:'char_hub_dnbpony', b2a:'char_dnbpony_b1', b3a:'char_dnbpony_b2a', b2b:'char_dnbpony_b2a', b3b:'char_dnbpony_b2b' },
  crystalpony: { a1:'char_hub_crystalpony', a2a:'char_crystalpony_a1', a3a:'char_crystalpony_a2a', a2b:'char_crystalpony_a1', a3b:'char_crystalpony_a2b', b1:'char_hub_crystalpony', b2a:'char_crystalpony_b1', b3a:'char_crystalpony_b2a', b2b:'char_crystalpony_b3a', b3b:'char_crystalpony_b2b' },
  mule: { a1:'char_hub_mule', a2a:'char_mule_a1', a3a:'char_mule_a2a', a2b:'char_mule_a3a', a3b:'char_mule_a2b', b1:'char_hub_mule', b2a:'char_mule_b1', b3a:'char_mule_b2a', b2b:'char_mule_b1', b3b:'char_mule_b2b' },
  alicorn: { a1:'char_hub_alicorn', a2a:'char_alicorn_a1', a3a:'char_alicorn_a2a', a2b:'char_alicorn_a1', a3b:'char_alicorn_a2b', b1:'char_hub_alicorn', b2a:'char_alicorn_b1', b3a:'char_alicorn_b2a', b2b:'char_alicorn_b1', b3b:'char_alicorn_b2b' },
  changeling: { a1:'char_changeling_d3b', a2a:'char_changeling_a1', a3a:'char_changeling_a2a', a2b:'char_changeling_a2a', a3b:'char_changeling_a2b', b1:'char_hub_changeling', b2a:'char_changeling_b1', b3a:'char_changeling_b2a', b2b:'char_changeling_b1', b3b:'char_changeling_b2b' },
  diamonddog: { a1:'char_hub_diamonddog', a2a:'char_diamonddog_a1', a3a:'char_diamonddog_a2a', a2b:'char_diamonddog_a2a', a3b:'char_diamonddog_a2b', b1:'char_hub_diamonddog', b2a:'char_diamonddog_b1', b3a:'char_diamonddog_b2a', b2b:'char_diamonddog_b1', b3b:'char_diamonddog_b2b' },
  gargoyle: { a1:'char_hub_gargoyle', a2a:'char_gargoyle_a1', a3a:'char_gargoyle_a2a', a2b:'char_gargoyle_a1', a3b:'char_gargoyle_a2b', b1:'char_hub_gargoyle', b2a:'char_gargoyle_b1', b3a:'char_gargoyle_b2a', b2b:'char_gargoyle_b1', b3b:'char_gargoyle_b2b' },
  changedling: { a1:'char_hub_changedling', a2a:'char_changedling_a1', a3a:'char_changedling_a2b', a2b:'char_changedling_a2a', a3b:'char_changedling_a2b', b1:'char_hub_changedling', b2a:'char_changedling_b1', b3a:'char_changedling_b2a', b2b:'char_changedling_b1', b3b:'char_changedling_b2b' },
  changelingqueen: { a1:'char_changelingqueen_b3b', a2a:'char_changelingqueen_a1', a3a:'char_changelingqueen_a2a', a2b:'char_changelingqueen_a2a', a3b:'char_changelingqueen_a2b', b1:'char_hub_changelingqueen', b2a:'char_changelingqueen_b1', b3a:'char_changelingqueen_b2a', b2b:'char_changelingqueen_b1', b3b:'char_changelingqueen_b2b' },
  filly: { a1:'char_hub_filly', a2a:'char_filly_a1', a3a:'char_filly_a2a', a2b:'char_filly_a3a', a3b:'char_filly_a2b', b1:'char_hub_filly', b2a:'char_filly_b1', b3a:'char_filly_b2a', b2b:'char_filly_b2a', b3b:'char_filly_b2b' },
  engineerpony: { a1:'char_engineerpony_c3a', a2a:'char_engineerpony_a1', a3a:'char_engineerpony_a2b', a2b:'char_engineerpony_a2a', a3b:'char_engineerpony_a2b', b1:'char_engineerpony_d3b', b2a:'char_engineerpony_b1', b3a:'char_engineerpony_b2a', b2b:'char_engineerpony_b3a', b3b:'char_engineerpony_b2b' },
};

const SKILL_TREE_CHARACTER_NODES = [];
(function buildCharacterSkillNodes(){
  const AMOUNT = { a1:0.05, a2a:0.04, a2b:0.04, a3a:0.03, a3b:0.03, b1:0.05, b2a:0.04, b2b:0.04, b3a:0.03, b3b:0.03 };
  const ORDER = ['a1','a2a','a3a','a2b','a3b','b1','b2a','b3a','b2b','b3b'];
  for (const cfg of SKILL_TREE_CHARACTER_CONFIG) {
    const classId = cfg.classId;
    for (const key of ORDER) {
      const stat = key[0] === 'a' ? cfg.statA : cfg.statB;
      const content = cfg.nodes[key];
      const parentId = SKILL_TREE_CHAR_TOPOLOGY[classId][key];
      SKILL_TREE_CHARACTER_NODES.push({
        id: 'char_' + classId + '_' + key,
        parent: parentId,
        cost: 1,
        name: content.name,
        desc: content.desc,
        effect: { type:'stat', classId, stat, amount: AMOUNT[key] },
      });
    }
  }
})();

for (const n of SKILL_TREE_CHARACTER_NODES) {
  SKILL_TREE_NODES.push(n);
  SKILL_TREE_NODES_BY_ID[n.id] = n;
}

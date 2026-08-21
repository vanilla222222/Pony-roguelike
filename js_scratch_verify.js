const fs=require('fs');
const files=[
'js/core/theme.js','js/core/utils-1.js','js/core/utils-2.js','js/core/audio.js',
'js/data/core.js','js/data/items-1.js','js/data/items-2.js','js/data/items-3.js','js/data/items-4.js','js/data/items-5.js',
'js/data/trinkets-1.js','js/data/trinkets-2.js','js/data/familiars-1.js','js/data/familiars-2.js','js/data/lists.js',
'js/data/pickups.js','js/data/collectibles.js','js/data/economy.js',
'js/data/enemies/growth.js','js/data/enemies/types-1.js','js/data/enemies/types-2.js','js/data/enemies/types-3.js','js/data/enemies/types-4.js',
'js/data/enemies/lists.js','js/data/enemies/bosses.js','js/data/enemies/superbosses.js',
'js/data/stages.js',
'js/achievements/core.js','js/achievements/defs-1.js','js/achievements/defs-2.js','js/achievements/defs-3.js','js/achievements/defs-4.js','js/achievements/defs-5.js','js/achievements/defs-6.js','js/achievements/logic.js',
'js/data/roomTemplates/core.js','js/data/roomTemplates/normal-1.js','js/data/roomTemplates/normal-2.js','js/data/roomTemplates/normal-3.js','js/data/roomTemplates/normal-4.js',
'js/systems/dungeon.js','js/systems/room.js','js/entities/entities.js','js/systems/attackStyles.js',
'js/systems/combat-1.js','js/systems/combat-2.js','js/systems/combat-3.js','js/systems/combat-4.js',
'js/systems/ai-1.js','js/systems/ai-2.js','js/systems/ai-3.js','js/systems/ai-4.js',
'js/systems/familiars.js','js/systems/pills.js','js/systems/stars.js',
'js/systems/items-1.js','js/systems/items-2.js','js/systems/shop.js',
'js/ui/bestiary.js','js/ui/ui.js','js/game.js','js/ui/render.js','js/main.js'
];
let src='';
for (const f of files) src += fs.readFileSync(f,'utf8') + '\n';
const fakeEl = { addEventListener(){}, getContext:()=>fakeCtx, style:{}, classList:{add(){},remove(){},toggle(){}}, appendChild(){}, setAttribute(){}, getAttribute(){}, remove(){}, dataset:{}, children:[], querySelectorAll:()=>[], querySelector:()=>null, focus(){}, blur(){}, value:'' };
const fakeCtx = new Proxy({}, { get(t,p){ if (p in t) return t[p]; return function(){ return fakeCtx; }; } });
fakeCtx.createLinearGradient = () => ({addColorStop(){}});
fakeCtx.createRadialGradient = () => ({addColorStop(){}});
fakeCtx.measureText = () => ({width:0});
global.window = global;
global.localStorage = { getItem: ()=>null, setItem: ()=>{}, removeItem(){} };
global.document = {
  createElement: () => fakeEl,
  getElementById: () => fakeEl,
  addEventListener(){},
  querySelectorAll: () => [],
  querySelector: () => null,
  body: fakeEl,
  documentElement: fakeEl,
};
global.Audio = function(){ return { play(){return Promise.resolve();}, pause(){}, cloneNode:()=>({play(){return Promise.resolve();}}) }; };
global.requestAnimationFrame = function(fn){ return 0; };
global.cancelAnimationFrame = function(){};
global.navigator = { userAgent: 'node' };
global.addEventListener=function(){};
global.removeEventListener=function(){};
global.innerWidth=1024;global.innerHeight=768;
global.performance = { now: () => Date.now() };
global.AudioContext = function(){ return { createGain:()=>({connect(){},gain:{value:0}}), createOscillator:()=>({connect(){},start(){},stop(){},frequency:{value:0}}), destination:{}, resume(){return Promise.resolve();} }; };
src += "\nconsole.log('OK - loaded without throwing');\n";
src += "console.log('CLASSES count', Object.keys(CLASSES).length);\n";
src += "console.log('SUPERBOSSES count', Object.keys(SUPERBOSSES).length);\n";
src += "console.log('SUPERBOSS_REWARDS.length', SUPERBOSS_REWARDS.length);\n";
src += "console.log('expected', Object.keys(SUPERBOSSES).length * Object.keys(CLASSES).length);\n";
try {
  eval(src);
} catch(e){ console.error('ERR', e); }

'use strict';
// data/enemies/lists.js — split from enemies.js: ENEMY_LIST, legacy aliases.
const ENEMY_LIST = Object.values(ENEMY_TYPES);

// old enemy ids (pre-stage-rework) — kept so any room templates already
// authored with a forced "specific" enemy id still resolve to something sane
const LEGACY_ENEMY_ALIASES = {
  grub:'gravegrub', scrapper:'bonepicker', slinger:'cryptslinger', brute:'thornhide',
  bomber:'sporepopper', wisp:'firefly', shellback:'shellbone',
};
function resolveEnemyTypeId(id){
  return ENEMY_TYPES[id] ? id : (LEGACY_ENEMY_ALIASES[id] || id);
}

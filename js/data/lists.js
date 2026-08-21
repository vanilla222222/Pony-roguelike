'use strict';
// data/lists.js — split from data.js: derived item lists.
const ITEM_LIST = Object.values(ITEMS);
const PASSIVE_ITEMS = ITEM_LIST.filter(i => i.type === 'passive');
const ACTIVE_ITEMS = ITEM_LIST.filter(i => i.type === 'active');

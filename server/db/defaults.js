/* ============================================================
   Loads the 26 default products straight from the frontend
   data file (assets/js/data.js) so there is ONE source of
   truth for the seed — no duplicated hardcoded list.
   ============================================================ */
const path = require('path');

function loadDefaults(){
  // data.js is a browser file (assigns window.MAT). Fake `window`
  // and (harmlessly) a `localStorage` so it evaluates under Node.
  global.window = {};
  global.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
  const dataPath = require.resolve('../../assets/js/data.js');
  delete require.cache[dataPath];
  require(dataPath);
  const MAT = global.window.MAT || {};

  return Object.keys(MAT)
    .filter(k => !MAT[k].hidden)
    .map(k => {
      const m = MAT[k];
      return {
        slug: k, name: m.name, code: m.code, coll: m.coll, desc: m.desc,
        veinText: m.veinText || '', grain: m.grain || '',
        finish: m.finish || 'Polished', thickness: m.thickness || '20 · 30 mm',
        apps: m.apps || [],
        base: m.base, vein: m.vein, glow: m.glow,
        seed: m.seed, flow: m.flow, sharp: m.sharp, dark: m.dark,
        images: ['', '', '', '']   // defaults have no photos → auto-marble fallback
      };
    });
}

module.exports = { loadDefaults };

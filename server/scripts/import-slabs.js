/* ============================================================
   ARTIZIA — one-off import of the 2026 slab library
   ------------------------------------------------------------
   Reads the material folders under assets/img/<Series>/<Material>/,
   optimises each photo into server/uploads/, and creates one product
   per material.

   Products already in the database are SKIPPED — never overwritten.

   Run a dry run first:   node server/scripts/import-slabs.js --dry
   Then for real:         node server/scripts/import-slabs.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', '..');
const IMG = path.join(ROOT, 'assets', 'img');
const UPLOADS = path.join(__dirname, '..', 'uploads');
const DRY = process.argv.includes('--dry');

const Product = require('../models/Product');

/* the sheet: [collection, code, name, folder, veinLabel, description]
   collection uses the names already in the database, so nothing new is invented. */
const SHEET = [
  ['Essentials', '3050', 'Desert Wind',       'Basic Series/Desert Wind',                       'Fine Grain',
   'A wind-blown neutral — pale sand flecked with fine mineral grain. Quiet enough for any room, warm enough to feel lived in.'],
  ['Essentials', '1630', 'Grey Sparkle',      'Basic Series/Grey Sparkle',                      'Crystalline',
   'Deep charcoal shot through with crystalline sparkle — a dark surface that catches light rather than swallowing it.'],
  ['Essentials', '1510', 'Iced White',        'Basic Series/Iced White',                        'Crystalline',
   'Clean, cold white with a faint crystal shimmer. The most forgiving white quartz slab we make.'],
  ['Essentials', '1210', 'Linen',             'Basic Series/Linen',                             'Fine Grain',
   'The soft, woven neutral of natural linen — a pale warm grey that lets the rest of the room speak.'],
  ['Essentials', '1610', 'Sparkle White',     'Basic Series/Sparkle White',                     'Crystalline',
   'Bright white, dense with reflective quartz grain — a surface that lifts the light in a kitchen.'],
  ['Essentials', '3060', 'Simply Beige',      'Basic Series/Simply Beige',                      'Fine Grain',
   'An unfussy warm beige with a fine speckle. Solid, honest and endlessly pairable.'],

  ['Classic',    '1790', 'Classic Beige',     'Solid Series/Classic Beige',                     'Solid',
   'A warm, even beige with no veining to distract — a calm, solid tone for contemporary interiors.'],

  ['Luxury',     '4030', 'Carrara Bianco',    'Carrara Series/CARRARA BIANCO',                  'Fine Vein, Natural',
   'Fine grey threading across a soft white ground — the restraint of Carrara, engineered never to stain or need sealing.'],
  ['Luxury',     '1780', 'Fossil',            'Carrara Series/Fossil',                          'Solid',
   'Deep espresso brown, dense and unbroken — a grounding dark surface for islands and table tops.'],
  ['Luxury',     '3307', 'Beige Romano',      'Carrara Series/Beige Romano',                    'Clouded',
   'A soft Roman beige, quietly clouded. Warm without ever turning yellow.'],
  ['Luxury',     '3303', 'Milano Grey',       'Carrara Series/Milano_Grey',                     'Clouded',
   'Mid-grey with a subtle cloud drift — urban, understated and forgiving in daily use.'],

  ['Premium',    '3169', 'Venetian Pearl',    'Natural Series/Venetian Pearl',                  'Fine Grain',
   'A pale pearl ground scattered with fine mineral flecks — soft light, gentle depth.'],
  ['Premium',    '3162', 'Oyster Pearl',      'Natural Series/Oyster Pearl',                    'Fine Grain',
   'Oyster-shell white with a delicate speckle — warm under lamplight, cool by day.'],

  ['Signature',  '9003', 'Acadia Gold',       'Calacatta & Exotic Series/ACADIA GOLD',          'Long Vein, Natural',
   'A white ground drawn with fine gold and grey veins — restrained Calacatta drama for a modern kitchen.'],
  ['Signature',  '1720', 'Black Markina',     'Calacatta & Exotic Series/BLACK MARKINA',        'Bold Vein',
   'Near-black, fractured by bright white veining that runs the length of the slab. Our most theatrical surface.'],
  ['Signature',  '1740', 'Calacatta Alphi',   'Calacatta & Exotic Series/CALACATTA ALPHI',      'Long Vein, Natural',
   'A charcoal ground threaded with fine white veining — dark, dramatic, and unexpectedly soft up close.'],
  ['Signature',  '4465', 'Enigma Gold',       'Calacatta & Exotic Series/ENIGMA GOLD',          'Long Vein, Natural',
   'Soft white broken by warm golden veining — the quartz slab with golden veins our customers ask for by name.'],
  ['Signature',  '4470', 'Gaviota',           'Calacatta & Exotic Series/GAVIOTA',              'Fine Vein, Natural',
   'White with a quiet grey vein — subtle enough for a whole kitchen, characterful enough for an island.'],
  ['Signature',  '5350', 'Iris Grey',         'Calacatta & Exotic Series/IRIS GREY',            'Fine Vein, Natural',
   'Cool white laced with fine grey veining, like frost drawn across glass.'],
  ['Signature',  '9002', 'Staturio Ultra',    'Calacatta & Exotic Series/STATURIO ULTRA',       'Bold Vein',
   'The Statuario language — crisp white, decisive grey veins — engineered to outlast the marble it echoes.'],
  ['Signature',  '4330', 'Aurelia Gold',      'Calacatta & Exotic Series/Aurelia Gold',         'Fine Vein, Natural',
   'A luminous white ground with delicate golden threads. Understated luxury for a bathroom vanity or island.'],
  ['Signature',  '3230', 'Crema Nuvola',      'Calacatta & Exotic Series/Crema Nuvola',         'Clouded',
   'Warm cream clouded with soft brown movement — a slab with weather in it.'],
  ['Signature',  '3240', 'Patina Grey',       'Calacatta & Exotic Series/Patina Grey',          'Clouded',
   'An oxidised verdigris patina in soft teal and grey — our most unusual surface, and the one people photograph.'],
  ['Signature',  '4471', 'Calacatta Bella',   'Calacatta & Exotic Series/CALACATTA BELLA',      'Bold Vein',
   'Bold grey veining over a bright white ground — the classic Calacatta silhouette.'],
  ['Signature',  '4490', 'Calacatta Eternia', 'Calacatta & Exotic Series/CALACATTA ETERNIA',    'Long Vein, Natural',
   'White with sweeping grey veins that run the full length of the slab — made for super jumbo islands.'],
  ['Signature',  '4482', 'Eros Gold',         'Calacatta & Exotic Series/EROS GOLD',            'Fine Vein, Natural',
   'Fine golden veining drifting across a warm white ground.'],
  ['Signature',  '4750', 'Nagoya',            'Calacatta & Exotic Series/NAGOYA',               'Long Vein, Natural',
   'Cream with a soft network of golden veins — warm, quiet and forgiving.']
];

/* Which file fills which slot. Resolved from the folder listing:
   full = the slab in one frame, close = macro texture.
   Where the filenames don't say, these were classified by eye. */
const PICK = {
  'Desert Wind':       { full: 'MQJ_0723_13-F.jpg', close: ['MQJ_0723_13-Z.jpg', 'MQJ_0723_13-M.jpg'] },
  'Grey Sparkle':      { full: 'MQJ_0723_31-F.jpg', close: ['MQJ_0723_31-Z.jpg', 'MQJ_0723_31-M.jpg'] },
  'Iced White':        { full: 'MQJ_0723_26-F.jpg', close: ['MQJ_0723_26-Z.jpg', 'MQJ_0723_26-M.jpg'] },
  'Linen':             { full: 'MQJ_0723_06-F.jpg', close: ['MQJ_0723_06-Z.jpg', 'MQJ_0723_06-M.jpg'] },
  'Sparkle White':     { full: 'MQJ_1124_32-F.jpg', close: ['MQJ_1124_32-M1.jpg', 'MQJ_1124_32-M2.jpg', 'MQJ_1124_32-M3.jpg'] },
  'Simply Beige':      { full: 'DSC01253.JPG', close: ['DSC01254.JPG'] },
  'Classic Beige':     { full: 'DSC01255.JPG', close: ['DSC01256.JPG'] },
  'Carrara Bianco':    { full: 'CARRARA BIANCO_FULL.jpg', close: ['CARRARA BIANCO_ZOOM.jpg'] },
  'Fossil':            { full: 'Fossil_Full_Image_1.jpg.jpeg', close: [] },
  'Beige Romano':      { full: 'DSC01257.JPG', close: ['DSC01259.JPG', 'DSC01260.JPG'] },
  'Milano Grey':       { full: 'DSC01250.JPG', close: ['DSC01251.JPG', 'DSC01252.JPG'] },
  'Venetian Pearl':    { full: 'Venetian_pearl_full.jpeg', close: ['Venetian_pearl_closeup.jpeg'] },
  'Oyster Pearl':      { full: 'Oyster_pearl_full.jpeg', close: ['Oyster_pearl_closeup.jpeg'] },
  'Acadia Gold':       { full: 'Acadia_gold_full.jpeg', close: ['Acadia_gold (3).jpeg', 'Acadia_gold (4).jpeg', 'Acadia_gold (5).jpeg'] },
  'Black Markina':     { full: 'DSC01261.JPG', close: ['DSC01264.JPG', 'DSC01265.JPG'], extra: ['DSC01263.JPG'] },
  'Calacatta Alphi':   { full: 'CALACATTA ALPHI_FULL.jpeg', close: ['CALACATTA ALPHI_ZOOM.jpeg'] },
  'Enigma Gold':       { full: 'ENIGMA GOLD_FULL.jpg', close: ['ENIGMA GOLD_ZOOM.jpg'] },
  'Gaviota':           { full: 'GAVIOTA_FULL.jpg', close: ['GAVIOTA_ZOOM.jpg'] },
  'Iris Grey':         { full: 'Iris_grey_full.jpeg', close: ['Iris_grey_closeup (3).jpeg', 'Iris_grey_closeup (4).jpeg', 'Iris_grey_closeup (5).jpeg'] },
  'Staturio Ultra':    { full: 'STATURIO ULTRA_FULL.JPG', close: ['STATURIO ULTRA_ZOOM.JPG'] },
  'Aurelia Gold':      { full: 'Aurelia Gold 3 (1).jpeg', close: ['Aurelia Gold 1.jpeg', 'Aurelia Gold 2.jpeg'] },
  'Crema Nuvola':      { full: 'Crema Nuvola full.jpeg', close: ['Creama Nuvola closeup.jpeg'] },
  'Patina Grey':       { full: 'Patina Grey 2.jpeg', close: ['Patina Grey.jpeg'] },   /* "- Copy" is a byte-duplicate, ignored */
  'Calacatta Bella':   { full: 'CALACATTA BELLA_FULL.jpg', close: ['CALACATTA BELLA_ZOOM.jpg'] },
  'Calacatta Eternia': { full: 'Calacatta_eternia (3).jpeg', close: ['Calacatta_eternia closeup (1).jpeg', 'Calacatta_eternia closeup (2).jpeg', 'Calacatta_eternia closeup (3).jpeg'] },
  'Eros Gold':         { full: 'Eros_gold_Full.jpeg', close: ['Eros_gold_closeup (1).jpeg', 'Eros_gold_closeup (2).jpeg', 'Eros_gold_closeup (3).jpeg', 'Eros_gold_closeup (4).jpeg'] },
  'Nagoya':            { full: 'Nagoya  (1).jpg', close: ['Nagoya  (2).jpg', 'Nagoya (1).jpg', 'Nagoya (2).jpg'] }
};

const APPS = ['Kitchen Countertop', 'Bathroom Vanity', 'Shower Surround', 'Interior Cladding', 'Fireplace Mantel', 'Furniture Tops'];
const slugify = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/* The generated-marble fallback only shows when a product has no photo, but a
   sane palette still drives the accent tints — derive it from the slab itself. */
async function palette(file) {
  const st = await sharp(file).stats();
  const d = st.dominant;
  const lum = 0.299 * d.r + 0.587 * d.g + 0.114 * d.b;
  const k = lum > 128 ? 0.74 : 1.75;                    // veins go darker on light stone, lighter on dark
  return {
    base: hex(d.r, d.g, d.b),
    vein: hex(d.r * k, d.g * k, d.b * k),
    glow: hex(d.r * 1.06 + 12, d.g * 1.02 + 6, d.b * 0.94)   // a warm highlight
  };
}

/* Same treatment the admin upload route applies: bake EXIF rotation, cap the
   long edge, re-encode. The originals are 6-25 MB each and must never ship. */
async function optimise(file) {
  const buf = await sharp(file).rotate().resize({ width: 1500, height: 1500, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  const name = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}.jpg`;
  if (!DRY) fs.writeFileSync(path.join(UPLOADS, name), buf);
  return { url: `/uploads/${name}`, kb: buf.length / 1024 };
}

(async () => {
  fs.mkdirSync(UPLOADS, { recursive: true });
  let made = 0, skipped = 0, srcBytes = 0, outBytes = 0, imgs = 0;
  const problems = [];

  for (const [coll, code, name, folder, veinLabel, desc] of SHEET) {
    const slug = slugify(name);
    if (Product.exists(slug)) { console.log(`  SKIP    ${name} — already in database`); skipped++; continue; }

    const dir = path.join(IMG, folder);
    const pick = PICK[name];
    if (!pick || !fs.existsSync(dir)) { problems.push(`${name}: folder missing`); continue; }

    const fullPath = path.join(dir, pick.full);
    if (!fs.existsSync(fullPath)) { problems.push(`${name}: full image "${pick.full}" missing`); continue; }

    /* slot order matches the product page gallery: full, close-up, application, detail */
    const chosen = [fullPath,
      ...(pick.close || []).map(f => path.join(dir, f)),
      ...(pick.extra || []).map(f => path.join(dir, f))].filter(fs.existsSync);

    const urls = [];
    for (const f of chosen.slice(0, 4)) {
      srcBytes += fs.statSync(f).size;
      const r = await optimise(f);
      outBytes += r.kb * 1024; imgs++;
      urls.push(r.url);
    }
    while (urls.length < 4) urls.push('');

    /* Sample the palette from a close-up, not the full shot: several "full"
       images are the slab standing in the warehouse, so the dominant colour
       there is the white wall behind it, not the stone. Black Markina came out
       #f8f8f8 that way — the opposite of the truth. */
    const swatch = (pick.close && pick.close.length && fs.existsSync(path.join(dir, pick.close[0])))
      ? path.join(dir, pick.close[0]) : fullPath;
    const pal = await palette(swatch);
    const product = {
      slug, code, name, coll, desc,
      veinText: veinLabel, grain: 'Medium', finish: 'Polished', thickness: '20 · 30 mm',
      apps: APPS, images: urls,
      base: pal.base, vein: pal.vein, glow: pal.glow,
      seed: Math.floor(Math.random() * 20), flow: 0.65, sharp: 0.7, dark: 0.55
    };

    if (!DRY) Product.create(product);
    made++;
    console.log(`  ${DRY ? 'WOULD ADD' : 'ADDED   '} ${name.padEnd(19)} ${code}  ${coll.padEnd(11)} ${urls.filter(Boolean).length} img  base ${pal.base}`);
  }

  console.log(`\n  ${DRY ? '[DRY RUN — nothing written]' : '[committed]'}`);
  console.log(`  created ${made}   skipped ${skipped}   images ${imgs}`);
  console.log(`  ${(srcBytes / 1048576).toFixed(0)} MB of originals -> ${(outBytes / 1048576).toFixed(1)} MB optimised`);
  if (problems.length) { console.log('\n  PROBLEMS:'); problems.forEach(p => console.log('   ! ' + p)); }
  console.log(`  products in database: ${Product.count()}`);
})();

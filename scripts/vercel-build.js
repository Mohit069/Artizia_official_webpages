/* ============================================================
   Assembles the static half of the site into public/ for Vercel.

   Why a build step at all: with no output directory, Vercel serves the
   WHOLE repository as static files — which would publish server/ source
   code and, worse, server/db/artizia.db (admin password hash, enquiries)
   at a guessable URL. Building an explicit public/ folder means only what
   is copied here is ever reachable.

   Run automatically by Vercel (buildCommand in vercel.json). Harmless to
   run locally: it only writes into public/.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public');

/* Directories that exist only as import sources for the product photos.
   They are not referenced by any page and are ~880MB — they must never be
   deployed. They are also git-ignored, so normally they aren't even here. */
const SKIP_DIRS = new Set([
  'Calacatta & Exotic Series', 'Basic Series', 'Solid Series',
  'Carrara Series', 'Natural Series'
]);

/* Straight-off-the-camera originals, 5–12MB each. The pages reference the
   compressed copies (assets/img/process/01-raw-materials.jpg, …), never these.
   Verified with a reference sweep — if you add one to a page, delete it here. */
const SKIP_FILES = new Set([
  'Raw_material.JPG', 'Precision_engineering.png', 'Breton_technology.JPG',
  'Quality_inspection.JPG', 'Surface_finishing.JPG', 'Global_delivery.JPG',
  'sparkle_white_essential_collection.jpg', 'Albestor_concrete_solid_collection.jpg',
  'Concret_classic_collection.jpg', 'CARRARA BIANCO_FULL_premium_collection.jpg',
  'CALACATTA GOLD_FULL.jpg', 'Grigio_Cloud_Luxury_collection.jpeg'
]);

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    if (entry.isFile() && SKIP_FILES.has(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

/* every page at the root of the project */
let pages = 0;
for (const f of fs.readdirSync(ROOT)) {
  if (f.endsWith('.html')) { fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f)); pages++; }
}

/* stylesheets, scripts, brand and site imagery */
copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));

/* product images + the catalogue file, served from /uploads/... by the CDN */
copyDir(path.join(ROOT, 'server', 'uploads'), path.join(OUT, 'uploads'));

const count = dir => {
  let n = 0;
  const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : n++; };
  if (fs.existsSync(dir)) walk(dir);
  return n;
};
console.log(`  public/ built — ${pages} pages, ${count(path.join(OUT, 'assets'))} asset files, ${count(path.join(OUT, 'uploads'))} uploads`);

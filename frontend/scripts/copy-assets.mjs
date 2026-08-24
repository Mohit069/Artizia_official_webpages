/* Copies the shared, verbatim assets (css, img, js vendor scripts, video) from
   the project's existing ../assets folder into public/assets so Vite serves them
   unchanged in dev and copies them into dist/ on build. Nothing here is processed
   or rewritten — styles.css and the marble/worldmap/map scripts stay byte-identical.

   Exclusions mirror scripts/vercel-build.js exactly: the ~880MB import-source
   photo folders and the straight-off-the-camera originals are NOT referenced by
   any page and must never ship. Copying them would balloon dist/ to ~1GB. */
import { cp, rm, mkdir, readdir, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(here, '..', '..') // d:/Artizia New Website
const srcAssets = join(projectRoot, 'assets')
const destAssets = join(here, '..', 'public', 'assets')

// Import-source photo folders — not referenced by any page (git-ignored originals).
const SKIP_DIRS = new Set([
  'Calacatta & Exotic Series', 'Basic Series', 'Solid Series', 'Carrara Series', 'Natural Series',
])
// Straight-off-the-camera originals; pages reference the compressed copies instead.
const SKIP_FILES = new Set([
  'Raw_material.JPG', 'Precision_engineering.png', 'Breton_technology.JPG',
  'Quality_inspection.JPG', 'Surface_finishing.JPG', 'Global_delivery.JPG',
  'sparkle_white_essential_collection.jpg', 'Albestor_concrete_solid_collection.jpg',
  'Concret_classic_collection.jpg', 'CARRARA BIANCO_FULL_premium_collection.jpg',
  'CALACATTA GOLD_FULL.jpg', 'Grigio_Cloud_Luxury_collection.jpeg',
])

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true })
  for (const entry of await readdir(src, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue
    if (entry.isFile() && SKIP_FILES.has(entry.name)) continue
    const s = join(src, entry.name)
    const d = join(dest, entry.name)
    if (entry.isDirectory()) await copyDir(s, d)
    else await copyFile(s, d)
  }
}

if (existsSync(destAssets)) await rm(destAssets, { recursive: true, force: true })
await copyDir(srcAssets, destAssets)
console.log('[copy-assets] ../assets -> public/assets (source originals excluded)')

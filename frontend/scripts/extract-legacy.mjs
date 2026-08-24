/* Extracts the verbatim <style>, body markup and inline <script> from the two
   heavily-imperative legacy pages (index.html = homepage, admin.html = CMS) so
   they can run unchanged inside their React routes. No hand-transcription = exact
   parity. Runs at prebuild/predev. The vendor <script src> tags (marble/map/
   worldmap/blocks) are loaded separately by the React page; app.js and pageedit.js
   are intentionally NOT re-run (React provides the chrome + a compat bridge). */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const outDir = join(here, '..', 'src', 'generated')
await mkdir(outDir, { recursive: true })

function extract(html) {
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n')
  // inline scripts only (skip <script src=...>), in document order (head config + body IIFE)
  const js = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n;\n')
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  let body = bodyMatch ? bodyMatch[1] : ''
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '')
  return { css, html: body.trim(), js }
}

for (const [name, file] of [
  ['home', 'index.html'],
  ['admin', 'admin.html'],
]) {
  const src = await readFile(join(root, file), 'utf8')
  await writeFile(join(outDir, name + '.json'), JSON.stringify(extract(src)))
}
console.log('[extract-legacy] wrote src/generated/home.json, admin.json')

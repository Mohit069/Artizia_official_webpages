/* ============================================================
   Product model — all SQL access to the products table.
   Isolated here so the storage engine can be swapped later.
   API objects use the same field names as the frontend data
   model (coll, desc, veinText, apps, images[], palette…) so
   the frontend needs minimal changes.
   ============================================================ */
const { db } = require('../db/connection');

const num = v => (v === undefined || v === null || v === '') ? null : Number(v);
function safeJSON(s){ try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } }

/* DB row -> API object */
function toApi(row){
  if (!row) return null;
  return {
    slug: row.slug,
    code: row.code || '',
    name: row.name,
    coll: row.collection || '',
    desc: row.description || '',
    veinText: row.vein || '',
    grain: row.grain || '',
    finish: row.finish || 'Polished',
    thickness: row.thickness || '20 · 30 mm',
    apps: safeJSON(row.applications),
    images: [ row.image_full_slab || '', row.image_closeup || '', row.image_application || '', row.image_detail || '' ],
    // auto-marble fallback palette
    base: row.pal_base || undefined,
    vein: row.pal_vein || undefined,
    glow: row.pal_glow || undefined,
    seed: row.pal_seed == null ? undefined : row.pal_seed,
    flow: row.pal_flow == null ? undefined : row.pal_flow,
    sharp: row.pal_sharp == null ? undefined : row.pal_sharp,
    dark: row.pal_dark == null ? undefined : row.pal_dark,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/* API object -> column values */
function fromApi(o){
  const img = o.images || [];
  return {
    slug: o.slug,
    code: o.code || '',
    name: o.name,
    collection: o.coll || '',
    description: o.desc || '',
    vein: o.veinText || '',
    grain: o.grain || '',
    finish: o.finish || 'Polished',
    thickness: o.thickness || '20 · 30 mm',
    applications: JSON.stringify(o.apps || []),
    image_full_slab: img[0] || null,
    image_closeup: img[1] || null,
    image_application: img[2] || null,
    image_detail: img[3] || null,
    pal_base: o.base || null,
    pal_vein: o.vein || null,
    pal_glow: o.glow || null,
    pal_seed: num(o.seed),
    pal_flow: num(o.flow),
    pal_sharp: num(o.sharp),
    pal_dark: num(o.dark)
  };
}

const COLS = ['slug','code','name','collection','description','vein','grain','finish','thickness','applications',
  'image_full_slab','image_closeup','image_application','image_detail',
  'pal_base','pal_vein','pal_glow','pal_seed','pal_flow','pal_sharp','pal_dark'];

function all(collection){
  const rows = collection
    ? db.prepare('SELECT * FROM products WHERE collection = ? ORDER BY id').all(collection)
    : db.prepare('SELECT * FROM products ORDER BY id').all();
  return rows.map(toApi);
}
function bySlug(slug){ return toApi(db.prepare('SELECT * FROM products WHERE slug = ?').get(slug)); }
function rawBySlug(slug){ return db.prepare('SELECT * FROM products WHERE slug = ?').get(slug); }
function exists(slug){ return !!db.prepare('SELECT 1 FROM products WHERE slug = ?').get(slug); }
function count(){ return db.prepare('SELECT COUNT(*) AS n FROM products').get().n; }

function create(o){
  const f = fromApi(o);
  db.prepare(`INSERT INTO products (${COLS.join(',')}) VALUES (${COLS.map(()=>'?').join(',')})`)
    .run(...COLS.map(c => f[c]));
  return bySlug(f.slug);
}

function update(slug, o){
  o = Object.assign({}, o, { slug });
  const f = fromApi(o);
  const setCols = COLS.filter(c => c !== 'slug');
  db.prepare(`UPDATE products SET ${setCols.map(c=>c+'=?').join(',')}, updated_at = datetime('now') WHERE slug = ?`)
    .run(...setCols.map(c => f[c]), slug);
  return bySlug(slug);
}

function remove(slug){
  const info = db.prepare('DELETE FROM products WHERE slug = ?').run(slug);
  return info.changes > 0;
}

module.exports = { toApi, fromApi, all, bySlug, rawBySlug, exists, count, create, update, remove };

/* ============================================================
   Enquiries — contact-form messages, sample requests and quote requests
   submitted from the public site.
   ============================================================ */
const { db } = require('../db/connection');

const COLS = ['type', 'name', 'email', 'phone', 'subject', 'message',
  'address', 'project_type', 'area', 'products'];

const TYPES = ['contact', 'sample', 'quote'];
const STATUSES = ['new', 'read', 'archived'];

function toApi(r) {
  if (!r) return null;
  let products = [];
  try { products = JSON.parse(r.products || '[]'); } catch { products = []; }
  return {
    id: r.id, type: r.type, name: r.name, email: r.email, phone: r.phone,
    subject: r.subject, message: r.message, address: r.address,
    projectType: r.project_type, area: r.area, products,
    status: r.status, createdAt: r.created_at
  };
}

/* Everything here is attacker-supplied. Cap the lengths so a submission
   cannot bloat the database, and only accept the fields we know about. */
const clip = (v, n) => (v == null ? null : String(v).slice(0, n));

function create(body = {}) {
  const type = TYPES.includes(body.type) ? body.type : 'contact';
  const products = Array.isArray(body.products)
    ? JSON.stringify(body.products.slice(0, 8).map(p => String(p).slice(0, 80)))
    : '[]';
  const vals = {
    type,
    name: clip(body.name, 120),
    email: clip(body.email, 160),
    phone: clip(body.phone, 40),
    subject: clip(body.subject, 160),
    message: clip(body.message, 4000),
    address: clip(body.address, 400),
    project_type: clip(body.projectType, 60),
    area: clip(body.area, 40),
    products
  };
  const info = db.prepare(
    `INSERT INTO enquiries (${COLS.join(',')}) VALUES (${COLS.map(() => '?').join(',')})`
  ).run(...COLS.map(c => vals[c]));
  return byId(info.lastInsertRowid);
}

const byId = id => toApi(db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id));

function all({ status, type } = {}) {
  const where = [], args = [];
  if (STATUSES.includes(status)) { where.push('status = ?'); args.push(status); }
  if (TYPES.includes(type)) { where.push('type = ?'); args.push(type); }
  const sql = 'SELECT * FROM enquiries'
    + (where.length ? ' WHERE ' + where.join(' AND ') : '')
    + ' ORDER BY datetime(created_at) DESC, id DESC';
  return db.prepare(sql).all(...args).map(toApi);
}

const counts = () => ({
  total: db.prepare('SELECT COUNT(*) c FROM enquiries').get().c,
  unread: db.prepare("SELECT COUNT(*) c FROM enquiries WHERE status = 'new'").get().c
});

function setStatus(id, status) {
  if (!STATUSES.includes(status)) return null;
  db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(status, id);
  return byId(id);
}

const remove = id => db.prepare('DELETE FROM enquiries WHERE id = ?').run(id).changes > 0;

module.exports = { create, all, byId, counts, setStatus, remove, TYPES, STATUSES };

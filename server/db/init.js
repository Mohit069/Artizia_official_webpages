/* ============================================================
   Schema application + seeding.
   ensureSchema()  — creates the products table if missing
   seedIfEmpty()   — seeds the 26 defaults ONLY when the table
                     is empty, so admin-added products and edits
                     are never overwritten on restart.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { db } = require('./connection');
const Product = require('../models/Product');
const { loadDefaults } = require('./defaults');

function ensureSchema(){
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  migrate();
}

/* schema.sql uses CREATE TABLE IF NOT EXISTS, so it never alters a table that
   already exists. Columns added after the first release need an explicit,
   idempotent ALTER here. Additive only — nothing is dropped or rewritten, so
   this is safe to run on every boot against live data. */
function migrate(){
  const cols = db.prepare('PRAGMA table_info(enquiries)').all().map(c => c.name);
  if (!cols.includes('role')) {
    db.exec('ALTER TABLE enquiries ADD COLUMN role TEXT');
    console.log('[db] enquiries.role added');
  }
}

function seedDefaults(){
  const defs = loadDefaults();
  db.exec('BEGIN');
  try {
    for (const d of defs) if (!Product.exists(d.slug)) Product.create(d);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  return defs.length;
}

function seedIfEmpty(){
  if (Product.count() > 0) return { seeded: 0, skipped: true };
  const n = seedDefaults();
  return { seeded: n, skipped: false };
}

module.exports = { ensureSchema, seedDefaults, seedIfEmpty };

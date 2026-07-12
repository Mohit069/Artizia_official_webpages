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

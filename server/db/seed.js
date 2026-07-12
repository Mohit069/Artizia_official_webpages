/* ============================================================
   CLI seeder:  npm run seed          (seed only if empty)
                npm run seed -- --force  (wipe + reseed defaults)
   ============================================================ */
require('dotenv').config();
const { db } = require('./connection');
const { ensureSchema, seedDefaults, seedIfEmpty } = require('./init');
const Product = require('./../models/Product');

const force = process.argv.includes('--force');
ensureSchema();

if (force) {
  db.exec('DELETE FROM products');
  const n = seedDefaults();
  console.log(`⟳ Force reseed: inserted ${n} default products.`);
} else {
  const before = Product.count();
  const res = seedIfEmpty();
  if (res.skipped) console.log(`✓ Table already has ${before} products — seeding skipped (your data is preserved).`);
  else console.log(`✓ Seeded ${res.seeded} default products.`);
}
console.log(`Total products in database: ${Product.count()}`);

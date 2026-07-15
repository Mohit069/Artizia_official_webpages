/* ============================================================
   ARTIZIA — local / self-hosted entry point.
   Builds the app (server/app.js) and listens on a port.
   Serverless hosts import the app directly instead — see api/index.js.
   ============================================================ */
const app = require('./app');
const { ping, DB_PATH } = require('./db/connection');
const Product = require('./models/Product');

const PORT = process.env.PORT || 3000;
const seedResult = app.seedResult || {};

app.listen(PORT, () => {
  console.log(`\n  ARTIZIA server running`);
  console.log(`  → Site:   http://localhost:${PORT}/`);
  console.log(`  → Health: http://localhost:${PORT}/api/health`);
  console.log(`  → DB:     ${DB_PATH} (SQLite ${ping()})`);
  console.log(`  → Data:   ${Product.count()} products` + (seedResult.skipped ? ' (existing data preserved)' : ` (seeded ${seedResult.seeded} defaults)`) + `\n`);
});

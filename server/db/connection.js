/* ============================================================
   SQLite connection (Node built-in node:sqlite driver)
   Kept isolated so it can be swapped for PostgreSQL later.
   ============================================================ */
const { DatabaseSync } = require('node:sqlite');
const { DB_PATH, ensureDb } = require('../paths');

/* on a read-only serverless filesystem this copies the shipped database
   into /tmp first; on a normal server it is a no-op mkdir */
ensureDb();

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function ping() {
  return db.prepare('SELECT sqlite_version() AS version').get().version;
}

module.exports = { db, ping, DB_PATH };

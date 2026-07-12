/* ============================================================
   SQLite connection (Node built-in node:sqlite driver)
   Kept isolated so it can be swapped for PostgreSQL later.
   ============================================================ */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'artizia.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function ping() {
  return db.prepare('SELECT sqlite_version() AS version').get().version;
}

module.exports = { db, ping, DB_PATH };

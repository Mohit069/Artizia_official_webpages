/* ============================================================
   Admin users.

   Passwords are never stored. Each user gets a random salt and we keep
   scrypt(password, salt) — so a leaked database still does not hand over
   anyone's password. Verification is a timing-safe compare.
   ============================================================ */
const crypto = require('crypto');
const { db } = require('../db/connection');

const KEYLEN = 64;

function hash(password, salt) {
  return crypto.scryptSync(String(password), salt, KEYLEN).toString('hex');
}

function makeHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: hash(password, salt) };
}

/* constant-time — never leak "how wrong" the password was via timing */
function verifyPassword(password, row) {
  if (!row) return false;
  const a = Buffer.from(hash(password, row.pass_salt), 'hex');
  const b = Buffer.from(row.pass_hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const toApi = r => r && {
  id: r.id, username: r.username, role: r.role,
  createdAt: r.created_at, lastLogin: r.last_login
};

const count = () => db.prepare('SELECT COUNT(*) c FROM users').get().c;
const all = () => db.prepare('SELECT * FROM users ORDER BY id').all().map(toApi);
const byId = id => toApi(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
const rawByUsername = u => db.prepare('SELECT * FROM users WHERE username = ?').get(String(u || '').trim());
const exists = u => !!rawByUsername(u);

function create({ username, password, role }) {
  const { salt, hash: h } = makeHash(password);
  const info = db.prepare(
    'INSERT INTO users (username, pass_hash, pass_salt, role) VALUES (?,?,?,?)'
  ).run(String(username).trim(), h, salt, role === 'editor' ? 'editor' : 'admin');
  return byId(info.lastInsertRowid);
}

function setPassword(id, password) {
  const { salt, hash: h } = makeHash(password);
  db.prepare('UPDATE users SET pass_hash = ?, pass_salt = ? WHERE id = ?').run(h, salt, id);
  return byId(id);
}

function setRole(id, role) {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role === 'editor' ? 'editor' : 'admin', id);
  return byId(id);
}

const touchLogin = id => db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(id);
const remove = id => db.prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;

/* Seed the first account from .env so an existing install keeps working.
   Only ever runs when the table is empty — it will not resurrect a user
   that an admin has deliberately deleted. */
function seedIfEmpty() {
  if (count() > 0) return { seeded: false };
  const username = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.warn('[users] no users and no ADMIN_USER/ADMIN_PASSWORD — nobody can log in');
    return { seeded: false };
  }
  create({ username, password, role: 'admin' });
  console.log(`[users] seeded first admin "${username}" from .env`);
  return { seeded: true, username };
}

module.exports = {
  all, byId, create, exists, count, remove, setPassword, setRole,
  rawByUsername, verifyPassword, touchLogin, seedIfEmpty
};

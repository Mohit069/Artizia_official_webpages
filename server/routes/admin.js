/* ============================================================
   Admin auth: login / logout / me, plus user management.
   Credentials live in the users table now, not in .env — .env only seeds
   the very first account so an existing install keeps working.
   ============================================================ */
const express = require('express');
const { setAuthCookie, clearAuthCookie, currentUser, requireAdmin } = require('../auth');
const User = require('../models/User');

const router = express.Router();

// POST /api/admin/login  { username, password }
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const row = User.rawByUsername(username);
  /* Same message and same work either way — do not reveal whether the
     username exists. Hash even on a miss so the timing does not tell. */
  if (!User.verifyPassword(password || '', row || { pass_salt: 'x', pass_hash: '00' })) {
    return res.status(401).json({ ok: false, error: 'Invalid username or password.' });
  }
  User.touchLogin(row.id);
  setAuthCookie(res, { u: row.username, id: row.id, role: row.role });
  res.json({ ok: true, user: row.username, role: row.role });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => { clearAuthCookie(res); res.json({ ok: true }); });

// GET /api/admin/me
router.get('/me', (req, res) => {
  const u = currentUser(req);
  res.json({ authenticated: !!u, user: u ? u.u : null, role: u ? u.role : null, id: u ? u.id : null });
});

/* ---------- users ---------- */

// GET /api/admin/users
router.get('/users', requireAdmin, (req, res) => res.json({ users: User.all() }));

// POST /api/admin/users  { username, password, role }
router.post('/users', requireAdmin, (req, res) => {
  const { username, password, role } = req.body || {};
  const name = String(username || '').trim();
  if (name.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  if (String(password || '').length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (User.exists(name)) return res.status(409).json({ error: 'That username is already taken.' });
  res.status(201).json(User.create({ username: name, password, role }));
});

// PUT /api/admin/users/:id  { password?, role? }
router.put('/users/:id', requireAdmin, (req, res) => {
  const id = +req.params.id;
  if (!User.byId(id)) return res.status(404).json({ error: 'User not found.' });
  const { password, role } = req.body || {};
  if (password != null) {
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    User.setPassword(id, password);
  }
  if (role != null) User.setRole(id, role);
  res.json(User.byId(id));
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, (req, res) => {
  const id = +req.params.id;
  const me = currentUser(req);
  if (!User.byId(id)) return res.status(404).json({ error: 'User not found.' });
  /* two ways to lock everyone out of the admin panel, both blocked here */
  if (me && me.id === id) return res.status(400).json({ error: 'You cannot delete the account you are signed in with.' });
  if (User.count() <= 1) return res.status(400).json({ error: 'Cannot delete the last remaining user.' });
  User.remove(id);
  res.json({ ok: true, deleted: id });
});

module.exports = router;

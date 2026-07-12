/* ============================================================
   Admin auth routes: login / logout / me
   ============================================================ */
const express = require('express');
const crypto = require('crypto');
const { setAuthCookie, clearAuthCookie, currentUser } = require('../auth');

const router = express.Router();

function safeEqual(a, b){
  const ba = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// POST /api/admin/login  { username, password }
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const okUser = safeEqual(username || '', process.env.ADMIN_USER || '');
  const okPass = safeEqual(password || '', process.env.ADMIN_PASSWORD || '');
  if (okUser && okPass) {
    setAuthCookie(res, process.env.ADMIN_USER);
    return res.json({ ok: true, user: process.env.ADMIN_USER });
  }
  res.status(401).json({ ok: false, error: 'Invalid username or password.' });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => { clearAuthCookie(res); res.json({ ok: true }); });

// GET /api/admin/me
router.get('/me', (req, res) => {
  const u = currentUser(req);
  res.json({ authenticated: !!u, user: u ? u.u : null });
});

module.exports = router;

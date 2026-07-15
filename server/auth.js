/* ============================================================
   Lightweight admin auth — signed HTTP-only cookie session.
   No external dependency: HMAC-SHA256 token signed with
   SESSION_SECRET. Anyone can read products; only a logged-in
   admin can create/update/delete.
   ============================================================ */
const crypto = require('crypto');

const COOKIE = 'artizia_admin';
const SECRET = process.env.SESSION_SECRET || 'insecure-dev-secret';
const TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

const b64url = b => Buffer.from(b).toString('base64url');
const unb64url = s => Buffer.from(s, 'base64url').toString('utf8');

function sign(payload){
  const body = b64url(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}
function verify(token){
  if (!token || token.indexOf('.') < 0) return null;
  const [body, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  // constant-time compare
  const a = Buffer.from(mac); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(unb64url(body));
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}

function parseCookies(req){
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('='); if (i < 0) return;
    out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

/* user: { u: username, id, role } — the id/role ride along so routes can tell
   who is acting without a database hit on every request */
function setAuthCookie(res, user){
  const who = typeof user === 'string' ? { u: user } : (user || {});
  const token = sign({ ...who, exp: Date.now() + TTL_MS });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `${COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${Math.floor(TTL_MS/1000)}; SameSite=Lax${secure}`);
}
function clearAuthCookie(res){
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}
function currentUser(req){
  return verify(parseCookies(req)[COOKIE]);
}
function requireAdmin(req, res, next){
  if (currentUser(req)) return next();
  res.status(401).json({ error: 'Not authorized. Please log in.' });
}

module.exports = { setAuthCookie, clearAuthCookie, currentUser, requireAdmin };

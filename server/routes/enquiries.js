/* ============================================================
   Enquiries.
     POST   /api/enquiries      public  — the contact + sample/quote forms
     GET    /api/enquiries      admin   — list (?status= &type=)
     GET    /api/enquiries/counts  admin
     PATCH  /api/enquiries/:id  admin   — { status }
     DELETE /api/enquiries/:id  admin
   ============================================================ */
const express = require('express');
const { requireAdmin } = require('../auth');
const Enquiry = require('../models/Enquiry');

const router = express.Router();

/* The POST is open to the world, so it needs a floor under it: a per-IP
   rate limit, and a honeypot field no human ever fills in. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const rec = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  rec.push(now);
  hits.set(ip, rec);
  if (hits.size > 5000) hits.clear();          // crude bound on memory
  return rec.length > MAX_PER_WINDOW;
}

router.post('/', (req, res) => {
  const b = req.body || {};

  // honeypot: a hidden input the form leaves empty; bots fill everything
  if (b.website) return res.status(201).json({ ok: true });

  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many messages. Please try again a little later.' });
  }

  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim();
  if (!name) return res.status(400).json({ error: 'Please tell us your name.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

  const saved = Enquiry.create(b);
  console.log(`[enquiry] ${saved.type} from ${saved.name} <${saved.email}>`);
  res.status(201).json({ ok: true, id: saved.id });
});

router.get('/', requireAdmin, (req, res) => {
  res.json({ enquiries: Enquiry.all({ status: req.query.status, type: req.query.type }), ...Enquiry.counts() });
});

router.get('/counts', requireAdmin, (req, res) => res.json(Enquiry.counts()));

router.patch('/:id', requireAdmin, (req, res) => {
  const updated = Enquiry.setStatus(+req.params.id, (req.body || {}).status);
  if (!updated) return res.status(400).json({ error: 'Unknown enquiry or status.' });
  res.json(updated);
});

router.delete('/:id', requireAdmin, (req, res) => {
  if (!Enquiry.remove(+req.params.id)) return res.status(404).json({ error: 'Enquiry not found.' });
  res.json({ ok: true, deleted: +req.params.id });
});

module.exports = router;

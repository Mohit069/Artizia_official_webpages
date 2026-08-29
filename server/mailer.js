/* ============================================================
   Outbound mail — notifies the team when a customer submits an
   enquiry, sample request or quote request.

   Everything here is env-gated. With no SMTP_* variables set the
   module reports itself unconfigured and every send becomes a no-op,
   so local development and any deployment without credentials keep
   working exactly as before.

   MAIL ROUTING NOTE
   artizia.co.in receives on Zoho (mx.zoho.in / mx2 / mx3) and its SPF
   record is `v=spf1 include:dc-8e814c8572._spfm.artizia.co.in ~all`.
   The web server's own IP is NOT in that record, so mail handed to a
   local sendmail would fail SPF at the receiving end and be filed as
   spam. Sending has to go out through Zoho's authenticated SMTP, and
   the From address has to be the mailbox we authenticate as — Zoho
   rejects a From it has not authorised for the account.
   ============================================================ */
const nodemailer = require('nodemailer');

const env = (k, d = '') => (process.env[k] || d).trim();

const HOST = env('SMTP_HOST');
const PORT = Number(env('SMTP_PORT', '465'));
const USER = env('SMTP_USER');
const PASS = env('SMTP_PASS');
/* Port 465 is implicit TLS; 587 upgrades with STARTTLS. Default from the
   port so a mis-set flag cannot silently downgrade the connection. */
const SECURE = env('SMTP_SECURE') ? env('SMTP_SECURE') === '1' : PORT === 465;

const FROM = env('MAIL_FROM') || (USER ? `"Artizia Website" <${USER}>` : '');
const TO = env('MAIL_TO')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const configured = Boolean(HOST && USER && PASS && TO.length);

let transport = null;
function getTransport() {
  if (!configured) return null;
  if (!transport) {
    transport = nodemailer.createTransport({
      host: HOST,
      port: PORT,
      secure: SECURE,
      auth: { user: USER, pass: PASS },
      /* A hung SMTP dial must never pile up behind form submissions. */
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }
  return transport;
}

const TYPE_LABEL = {
  contact: 'Contact message',
  sample: 'Sample request',
  quote: 'Quote request',
};

const esc = s =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* Only the fields that were actually filled in are rendered; a quote request
   carries address/area/products while a contact message carries none of them,
   and empty rows make the mail harder to scan. */
function rows(e) {
  const out = [
    ['Name', e.name],
    ['Email', e.email],
    ['Phone', e.phone],
    ['I am an', e.role],
    ['Subject', e.subject],
    ['Project type', e.projectType],
    ['Area', e.area],
    ['Address', e.address],
    ['Products', Array.isArray(e.products) && e.products.length ? e.products.join(', ') : ''],
  ];
  return out.filter(([, v]) => v != null && String(v).trim() !== '');
}

function buildText(e, label) {
  const lines = rows(e).map(([k, v]) => `${k}: ${v}`);
  if (e.message) lines.push('', 'Message:', String(e.message));
  lines.push('', `Type: ${e.type}`, `Reference: #${e.id}`, `Received: ${e.createdAt || new Date().toISOString()}`);
  return `${label} from the Artizia website\n\n${lines.join('\n')}\n`;
}

function buildHtml(e, label) {
  const cells = rows(e)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 14px 7px 0;color:#6b6b73;font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;white-space:nowrap;vertical-align:top">${esc(
          k,
        )}</td><td style="padding:7px 0;color:#14141a;font:14px/1.55 -apple-system,Segoe UI,Roboto,sans-serif">${esc(v)}</td></tr>`,
    )
    .join('');

  const message = e.message
    ? `<div style="margin:22px 0 0;padding:16px 18px;background:#f6f5f2;border-left:3px solid #b9a06a;border-radius:3px">
         <div style="color:#6b6b73;font:12px/1 -apple-system,Segoe UI,Roboto,sans-serif;text-transform:uppercase;letter-spacing:.09em;margin-bottom:9px">Message</div>
         <div style="color:#14141a;font:14px/1.65 -apple-system,Segoe UI,Roboto,sans-serif;white-space:pre-wrap">${esc(e.message)}</div>
       </div>`
    : '';

  return `<div style="background:#f0eee9;padding:26px 14px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e3e0d9;border-radius:6px;overflow:hidden">
    <div style="padding:18px 24px;border-bottom:1px solid #e3e0d9">
      <div style="color:#b9a06a;font:11px/1 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.16em;text-transform:uppercase">Artizia &middot; Website</div>
      <div style="color:#14141a;font:19px/1.3 Georgia,serif;margin-top:7px">${esc(label)}</div>
    </div>
    <div style="padding:20px 24px">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse">${cells}</table>
      ${message}
      <div style="margin-top:24px;padding-top:14px;border-top:1px solid #eceae5;color:#8a8a92;font:12px/1.6 -apple-system,Segoe UI,Roboto,sans-serif">
        Reference #${esc(e.id)} &middot; ${esc(e.createdAt || '')}<br>
        Reply to this email to answer ${esc(e.name || 'the customer')} directly.
      </div>
    </div>
  </div>
</div>`;
}

/**
 * Notify the team about one enquiry.
 *
 * Resolves to { sent: boolean, reason?, messageId? } and never rejects. The
 * caller has already persisted the enquiry; the admin panel remains the
 * source of truth, so a mail failure must never turn into a failed
 * submission for the customer.
 */
async function sendEnquiryNotification(enquiry) {
  const t = getTransport();
  if (!t) return { sent: false, reason: 'not-configured' };

  const label = TYPE_LABEL[enquiry.type] || 'Enquiry';
  const who = enquiry.name ? ` — ${enquiry.name}` : '';

  try {
    const info = await t.sendMail({
      from: FROM,
      to: TO,
      /* Replying goes to the customer, not back to the website mailbox. */
      replyTo: enquiry.email ? `"${String(enquiry.name || '').replace(/"/g, '')}" <${enquiry.email}>` : undefined,
      subject: `[Artizia] ${label}${who}`,
      text: buildText(enquiry, label),
      html: buildHtml(enquiry, label),
    });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    return { sent: false, reason: err && err.message ? err.message : String(err) };
  }
}

/** Prove the credentials work without sending anything. */
async function verify() {
  const t = getTransport();
  if (!t) return { ok: false, reason: 'not-configured' };
  try {
    await t.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err && err.message ? err.message : String(err) };
  }
}

module.exports = {
  configured,
  sendEnquiryNotification,
  verify,
  settings: { host: HOST, port: PORT, secure: SECURE, user: USER, from: FROM, to: TO },
};

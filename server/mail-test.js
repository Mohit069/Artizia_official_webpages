#!/usr/bin/env node
/* ============================================================
   Mail check —  npm run mail:test  [recipient@example.com]

   1. Prints the resolved SMTP settings (never the password).
   2. Opens the connection and authenticates, without sending.
   3. Sends one sample enquiry so the formatting can be checked.

   Run it on the server after filling in the SMTP_* variables in .env.
   ============================================================ */
require('dotenv').config();
const mailer = require('./mailer');

(async () => {
  const s = mailer.settings;
  console.log('SMTP settings');
  console.log('  host   :', s.host || '(unset)');
  console.log('  port   :', s.port, s.secure ? '(implicit TLS)' : '(STARTTLS)');
  console.log('  user   :', s.user || '(unset)');
  console.log('  from   :', s.from || '(unset)');
  console.log('  to     :', s.to.length ? s.to.join(', ') : '(unset)');
  console.log('  ready  :', mailer.configured);

  if (!mailer.configured) {
    console.error('\nSMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_TO in .env');
    process.exit(1);
  }

  process.stdout.write('\nAuthenticating... ');
  const v = await mailer.verify();
  if (!v.ok) {
    console.error('FAILED\n  ' + v.reason);
    console.error('\nOn Zoho this usually means the password is a normal account password.');
    console.error('Generate an app-specific password instead: Zoho Mail -> My Account ->');
    console.error('Security -> App Passwords. Two-factor accounts REQUIRE one.');
    process.exit(1);
  }
  console.log('ok');

  const to = process.argv[2];
  if (to) mailer.settings.to.splice(0, mailer.settings.to.length, to);

  process.stdout.write('Sending a sample quote request... ');
  const r = await mailer.sendEnquiryNotification({
    id: 0,
    type: 'quote',
    name: 'Test Customer',
    email: 'test.customer@example.com',
    phone: '+91 98765 43210',
    subject: 'Kitchen countertop enquiry',
    message: 'This is a test message sent by npm run mail:test.\nIf you can read this, notifications are working.',
    address: 'Mahindra World City, Jaipur',
    projectType: 'Residential',
    area: '120 sq ft',
    products: ['Calacatta Gold', 'Carrara Bianco'],
    createdAt: new Date().toISOString(),
  });

  if (r.sent) {
    console.log('sent');
    console.log('  message id:', r.messageId);
    console.log('\nCheck the inbox (and the spam folder) of:', mailer.settings.to.join(', '));
  } else {
    console.error('FAILED\n  ' + r.reason);
    process.exit(1);
  }
})();

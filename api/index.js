/* ============================================================
   Vercel serverless entry point.
   Vercel turns every file in /api into a function; vercel.json routes
   /api/* (and any uploaded-at-runtime image) here. The Express app is
   itself a (req, res) handler, so it can be exported as-is.

   The static site — HTML, CSS, JS, and the images that shipped with the
   deployment — is served by the CDN and never touches this function.
   ============================================================ */
module.exports = require('../server/app');

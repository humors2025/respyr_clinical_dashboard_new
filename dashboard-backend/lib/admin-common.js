// ---------------------------------------------------------------------------
// Shared by the internal admin pages (routes/admin.js, routes/admin-logs.js).
//
// Access is the ADMIN_KEY env var (16+ characters), sent by the pages in the
// X-Admin-Key header. Without ADMIN_KEY configured every admin API refuses, so
// a deploy that forgot the key is closed, not open. The header is not in the
// CORS allow-list (server.js), so these APIs only work from the pages' own
// origin.
// ---------------------------------------------------------------------------
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MIN_ADMIN_KEY_LENGTH = 16;

// Compares digests so the check takes the same time whatever was typed.
function adminKeyMatches(supplied) {
    const a = crypto.createHash('sha256').update(String(supplied || '')).digest();
    const b = crypto.createHash('sha256').update(process.env.ADMIN_KEY || '').digest();
    return crypto.timingSafeEqual(a, b);
}

function requireAdminKey(req, res, next) {
    res.set('Cache-Control', 'no-store');
    if ((process.env.ADMIN_KEY || '').length < MIN_ADMIN_KEY_LENGTH) {
        return res.status(503).json({
            status: 'error',
            message: `Admin pages are switched off. Set ADMIN_KEY (${MIN_ADMIN_KEY_LENGTH}+ characters) in the Lambda environment.`,
        });
    }
    if (!adminKeyMatches(req.get('x-admin-key'))) {
        return res.status(401).json({ status: 'error', message: 'Wrong admin key.' });
    }
    next();
}

// The pages' files live in admin/ and are read once per container.
const ASSET_DIR = path.join(__dirname, '..', 'admin');
const readAsset = (name) => fs.readFileSync(path.join(ASSET_DIR, name), 'utf8');

const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Script and styles come only from this backend (plus Google Fonts), and the
// pages cannot be framed: they handle the admin key, passwords and logs.
const PAGE_HEADERS = {
    'Cache-Control': 'no-store',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': [
        "default-src 'none'",
        "script-src 'self'",
        "style-src 'self' https://fonts.googleapis.com",
        'font-src https://fonts.gstatic.com',
        "img-src 'self' data:",
        "connect-src 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "base-uri 'none'",
    ].join('; '),
};

// GET routes for one page: /admin/<name>, /admin/<name>.css, /admin/<name>.js
function servePage(router, name, html) {
    const css = readAsset(`${name}.css`);
    const js = readAsset(`${name}.js`);
    router.get(`/${name}`, (req, res) => res.set(PAGE_HEADERS).type('html').send(html));
    router.get(`/${name}.css`, (req, res) => res.set('Cache-Control', 'no-cache').type('css').send(css));
    router.get(`/${name}.js`, (req, res) => res.set('Cache-Control', 'no-cache').type('js').send(js));
}

module.exports = { requireAdminKey, readAsset, escapeHtml, servePage, MIN_ADMIN_KEY_LENGTH };

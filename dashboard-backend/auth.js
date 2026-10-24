// ---------------------------------------------------------------------------
// Auth for the DASHBOARD backend.
//
// This service only ever sees web-dashboard tokens, so unlike the app backend
// there is a single secret here. The app's JWT_SECRET is deliberately absent:
// an app token must not open a dashboard route.
// ---------------------------------------------------------------------------
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Refuse to boot in a real deployment without the secret configured.
if (process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.DASHBOARD_JWT_SECRET) {
    throw new Error('DASHBOARD_JWT_SECRET must be set in the Lambda environment');
}

// No baked-in fallback: a secret written in the source ships in every deploy
// zip, and anyone holding the zip could mint a login token for any clinic.
// Outside Lambda (local dev) a random per-process secret is generated instead,
// so logins work with zero config but die with the process — fine for dev,
// and any other unconfigured deployment fails safe the same way.
const DASHBOARD_JWT_SECRET = process.env.DASHBOARD_JWT_SECRET
    || crypto.randomBytes(32).toString('hex');

function checkDashboardToken(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Missing token' });
    }
    try {
        req.dashboardUser = jwt.verify(token, DASHBOARD_JWT_SECRET);
    } catch (e) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
    // Password-reset tokens share the secret but are not login sessions.
    if (req.dashboardUser.purpose) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
    req.user = req.dashboardUser; // shared handlers read req.user
    return next();
}

// Every clinic identifier in the request must match the token's own clinic.
// Checking only the first one found used to let a caller pass its own login_id
// while a handler read clinic_name, returning another clinic's data.
function enforceOwnClinic(req, res, next) {
    const own = String(req.dashboardUser?.login_id || req.user?.login_id || '').trim();
    if (!own) return next();
    const supplied = [
        req.body?.login_id, req.query?.login_id,
        req.body?.clinic_name, req.query?.clinic_name,
    ].map((v) => String(v ?? '').trim()).filter(Boolean);
    if (supplied.some((v) => v !== own)) {
        return res.status(403).json({ status: 'error', message: 'Token does not match requested clinic' });
    }
    next();
}

module.exports = { checkDashboardToken, enforceOwnClinic, DASHBOARD_JWT_SECRET };

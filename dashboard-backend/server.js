// ---------------------------------------------------------------------------
// RESPYR CLINICAL — DASHBOARD BACKEND
//
// This is the web dashboard's own service. It is the Node port of the PHP
// backend that shipped in clinical-required/api/ (data-weeks.php,
// age-gender-diversity.php, encrp-trends-history.php, opd-login_v2.php, ...),
// reading the PLAINTEXT clinical_scores_details table so no decryption key is
// needed.
//
// It is deployed SEPARATELY from the mobile app's backend. The two share only
// the MySQL database (same clinic data, two windows onto it) — never a process,
// a URL, a deploy or a token secret. Changing anything here cannot affect the
// installed app.
// ---------------------------------------------------------------------------
const express = require('express');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// The dashboard is served from a different origin than this API.
// Set DASHBOARD_ORIGIN in production; '*' is only sensible for local work.
const ALLOWED_ORIGIN = process.env.DASHBOARD_ORIGIN || '*';
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.get('/ping', (req, res) => res.json({ status: 'success', service: 'dashboard-backend' }));

// Full check: MySQL reachable, tables present, clinic data loaded. 200 or 503.
const { runHealthChecks } = require('./lib/health');
app.get('/health', async (req, res) => {
    const report = await runHealthChecks();
    res.set('Cache-Control', 'no-store');
    res.status(report.status === 'ok' ? 200 : 503).json(report);
});

app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/clinic', require('./routes/clinic'));
app.use('/api/profiles', require('./routes/profiles'));

// Internal admin pages, protected by ADMIN_KEY: create a clinic login, app
// logs, raw sensor data.
app.use('/admin', require('./routes/admin'));
app.use('/admin', require('./routes/admin-logs'));
app.use('/admin', require('./routes/admin-sensors'));
app.use('/admin', require('./routes/admin-usb'));

// Anything else is not part of this service — the app's endpoints live in the
// app backend, and saying so plainly beats a generic 404 during the split.
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `No route for ${req.method} ${req.path} on the dashboard backend.`,
    });
});

// Never leak SQL/driver text to the browser; log it instead.
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
});

module.exports = app;

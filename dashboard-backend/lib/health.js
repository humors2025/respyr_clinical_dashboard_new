// ---------------------------------------------------------------------------
// Health check behind GET /health.
//
// /ping only proves the code starts. This proves the whole path the dashboard
// depends on: Lambda reaches MySQL, logs in, sees every table the routes use,
// and finds clinic data in them. A failing check carries its reason (the same
// readable text db.js writes to CloudWatch), so a broken deploy can be
// diagnosed from a browser.
//
// It is public, like /ping, so it reports pass/fail only — no row counts, no
// data and no secrets.
// ---------------------------------------------------------------------------
const pool = require('../db');
const { isConfigured: mailConfigured } = require('./mailer');

// Every table a dashboard route reads or writes.
const REQUIRED_TABLES = [
    'table_clinics', 'clinical_scores_details', 'data_personal_info',
    'table_clinical_profiles', 'test_allow', 'encryp_clinical_scores_details',
];
// Created by lib/throttle.js on first start; needs the CREATE grant.
const THROTTLE_TABLE = 'dashboard_login_attempts';

// Never throws: every failure becomes a failed check in the report.
async function runHealthChecks() {
    const started = Date.now();
    const checks = {};
    let conn;
    try {
        try {
            conn = await pool.getConnection();
            const [[v]] = await conn.query('SELECT VERSION() AS version');
            const [tls] = await conn.query("SHOW SESSION STATUS LIKE 'Ssl_cipher'");
            checks.database = {
                ok: true,
                latency_ms: Date.now() - started,
                version: v.version,
                tls: tls[0]?.Value || 'off',
            };
        } catch (err) {
            checks.database = { ok: false, error: err.message || err.code || 'Unknown database error' };
            return report(checks);
        }

        try {
            // information_schema lists only tables this user has privileges on,
            // so a missing grant shows up here as a missing table.
            const [found] = await conn.query(
                `SELECT table_name AS t FROM information_schema.tables
                 WHERE table_schema = DATABASE() AND table_name IN (?)`,
                [[...REQUIRED_TABLES, THROTTLE_TABLE]]
            );
            const have = new Set(found.map((r) => r.t));
            const missing = REQUIRED_TABLES.filter((t) => !have.has(t));
            checks.tables = { ok: missing.length === 0, missing };

            if (have.has('table_clinics')) {
                const [rows] = await conn.query('SELECT 1 FROM table_clinics LIMIT 1');
                checks.clinic_data = rows.length
                    ? { ok: true }
                    : { ok: false, error: 'table_clinics is empty — was the data copied?' };
            } else {
                checks.clinic_data = { ok: false, error: 'table_clinics is missing' };
            }

            // Informational: login still works without it, only rate limiting stops.
            checks.login_throttle_table = have.has(THROTTLE_TABLE)
                ? { ok: true }
                : { ok: false, note: 'Created on first start. If it stays missing, grant CREATE to the DB user.' };
        } catch (err) {
            checks.tables = { ok: false, error: err.message || err.code || 'Unknown database error' };
        }
    } finally {
        if (conn) conn.release();
    }
    return report(checks);
}

function report(checks) {
    // The throttle table is a warning, not a failure.
    const ok = ['database', 'tables', 'clinic_data'].every((k) => checks[k]?.ok);
    return {
        status: ok ? 'ok' : 'error',
        service: 'dashboard-backend',
        time: new Date().toISOString(),
        checks,
        config: {
            node: process.version,
            db_name: process.env.DB_NAME || 'respyrpartnersbb',
            db_ssl: (process.env.DB_SSL || 'rds').toLowerCase(),
            dashboard_origin: process.env.DASHBOARD_ORIGIN || '* (any — set DASHBOARD_ORIGIN before going live)',
            send_pdf_email: mailConfigured() ? 'configured' : 'off (RESPYR_SMTP_PASS not set)',
        },
    };
}

module.exports = { runHealthChecks };

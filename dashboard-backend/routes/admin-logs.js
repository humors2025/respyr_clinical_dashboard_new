// ===========================================================================
// Admin: app log viewer  (mounted at /admin)
//
//   GET /admin/logs                  the page (admin/logs.{html,css,js})
//   GET /admin/api/logs              one page of entries, newest first, + total
//   GET /admin/api/logs/facets       values for the filter dropdowns
//   GET /admin/api/logs/:id          one entry with its full message and stack
//
// Reads clinical_app_logs, which the APP backend writes (its routes/logs.js:
// POST /api/logs/batch, 60-day retention, level is error | warn | info).
// Entries can be posted before login without a token, so every field is
// untrusted text: the page renders it with textContent only.
//
// Times go out as epoch seconds so the page can show them in IST:
// received_at is MySQL NOW(), converted with UNIX_TIMESTAMP (correct whatever
// the server's zone); happened_at is the device time, which the writer stores
// as UTC.
// ===========================================================================
const express = require('express');
const pool = require('../db');
const { requireAdminKey, readAsset, servePage } = require('../lib/admin-common');

const router = express.Router();

servePage(router, 'logs', readAsset('logs.html'));

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const PREVIEW_CHARS = 300;   // the list carries a preview; :id carries the rest
const FACET_DAYS = 30;

// Exact-match filters, clipped to their column widths.
const EXACT_FILTERS = {
    level: 8, login_id: 100, profile_id: 100, install_id: 64,
    platform: 64, app_version: 32, tag: 64,
};

const utcToEpoch = (s) => {
    if (!s) return null;
    const t = Date.parse(`${String(s).replace(' ', 'T')}Z`);
    return Number.isNaN(t) ? null : Math.floor(t / 1000);
};

// Backslash is MySQL's default LIKE escape character.
const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function buildFilter(query) {
    const where = [];
    const args = [];
    for (const [col, max] of Object.entries(EXACT_FILTERS)) {
        const v = String(query[col] ?? '').trim().slice(0, max);
        if (v) {
            where.push(`${col} = ?`);
            args.push(v);
        }
    }
    const q = String(query.q ?? '').trim().slice(0, 200);
    if (q) {
        const like = `%${escapeLike(q)}%`;
        where.push('(message LIKE ? OR stack LIKE ? OR tag LIKE ?)');
        args.push(like, like, like);
    }
    // Range on received_at, as epoch seconds: [from, to)
    const from = Number.parseInt(query.from, 10);
    const to = Number.parseInt(query.to, 10);
    if (from > 0) {
        where.push('received_at >= FROM_UNIXTIME(?)');
        args.push(from);
    }
    if (to > 0) {
        where.push('received_at < FROM_UNIXTIME(?)');
        args.push(to);
    }
    return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', args };
}

function shapeRow(r) {
    const { happened_at, ...rest } = r;
    const out = {
        ...rest,
        received_ts: Number(r.received_ts) || null,
        happened_ts: utcToEpoch(happened_at),
    };
    if ('has_stack' in r) out.has_stack = Boolean(Number(r.has_stack));
    if ('message_length' in r) out.message_length = Number(r.message_length) || 0;
    return out;
}

function sendError(res, err, where) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(404).json({
            status: 'error',
            message: 'The clinical_app_logs table does not exist yet. The app backend creates it the first time it starts.',
        });
    }
    console.error(`admin logs ${where}:`, err);
    // Behind the admin key, so the database's own reason is shown.
    res.status(500).json({ status: 'error', message: `Could not read the logs: ${err.sqlMessage || err.message}` });
}

router.get('/api/logs', requireAdminKey, async (req, res) => {
    try {
        const limit = Math.min(MAX_LIMIT, Math.max(10, Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
        let page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const filter = buildFilter(req.query);

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM clinical_app_logs ${filter.sql}`, filter.args
        );
        const pages = Math.max(1, Math.ceil(Number(total) / limit));
        if (page > pages) page = pages;   // a narrower filter can shrink the result below the current page

        // ORDER BY matches the (login_id, received_at) / (install_id, received_at)
        // indexes, so the common filters page without a sort.
        const [rows] = await pool.query(
            `SELECT id, UNIX_TIMESTAMP(received_at) AS received_ts, happened_at,
                    login_id, profile_id, install_id, app_version, platform, level, tag,
                    LEFT(message, ${PREVIEW_CHARS}) AS message,
                    CHAR_LENGTH(message) AS message_length,
                    (stack IS NOT NULL AND stack <> '') AS has_stack
             FROM clinical_app_logs ${filter.sql}
             ORDER BY received_at DESC, id DESC
             LIMIT ? OFFSET ?`,
            [...filter.args, limit, (page - 1) * limit]
        );
        res.json({ status: 'success', page, limit, total: Number(total), pages, data: rows.map(shapeRow) });
    } catch (err) {
        sendError(res, err, 'list');
    }
});

// Distinct values seen recently, most frequent first, for the dropdowns.
router.get('/api/logs/facets', requireAdminKey, async (req, res) => {
    try {
        const out = {};
        for (const col of ['platform', 'app_version', 'tag']) {
            const [rows] = await pool.query(
                `SELECT ${col} AS value, COUNT(*) AS n FROM clinical_app_logs
                 WHERE received_at >= NOW() - INTERVAL ${FACET_DAYS} DAY AND ${col} IS NOT NULL AND ${col} <> ''
                 GROUP BY ${col} ORDER BY n DESC LIMIT 100`
            );
            out[col] = rows.map((r) => ({ value: r.value, count: Number(r.n) }));
        }
        res.json({ status: 'success', days: FACET_DAYS, ...out });
    } catch (err) {
        sendError(res, err, 'facets');
    }
});

router.get('/api/logs/:id', requireAdminKey, async (req, res) => {
    const id = String(req.params.id);
    if (!/^\d{1,19}$/.test(id)) return res.status(400).json({ status: 'error', message: 'Invalid log id.' });
    try {
        const [rows] = await pool.query(
            `SELECT id, UNIX_TIMESTAMP(received_at) AS received_ts, happened_at,
                    login_id, profile_id, install_id, device_id, app_version, platform,
                    level, tag, message, stack
             FROM clinical_app_logs WHERE id = ?`,
            [id]
        );
        if (!rows.length) {
            return res.status(404).json({
                status: 'error',
                message: 'This entry no longer exists. Logs are kept for 60 days.',
            });
        }
        res.json({ status: 'success', data: shapeRow(rows[0]) });
    } catch (err) {
        sendError(res, err, 'detail');
    }
});

module.exports = router;

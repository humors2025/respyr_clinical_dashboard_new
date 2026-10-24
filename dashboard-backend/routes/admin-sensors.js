// ===========================================================================
// Admin: raw sensor data viewer  (mounted at /admin)
//
//   GET /admin/sensors                the page (admin/sensors.{html,css,js})
//   GET /admin/api/sensors            one page of readings, newest first, + total
//   GET /admin/api/sensors/:id        one reading with every column
//   GET /admin/api/sensors.csv        the current filter as a CSV download
//
// Reads new_test_new_sensors_acetone_data, which the device/app writes one row
// per blow. The row is wide (40+ columns, including the Blow_fvc_fev_json
// blob), so the list carries only the headline columns; the rest comes with
// :id, and the CSV export carries everything.
//
// Access: ADMIN_KEY, checked by lib/admin-common.js (same key and sessionStorage
// slot as the other admin pages). Every value is untrusted device text: the
// page renders with textContent only, and the CSV quotes every field.
// ===========================================================================
const express = require('express');
const pool = require('../db');
const { requireAdminKey, readAsset, servePage } = require('../lib/admin-common');

const router = express.Router();

servePage(router, 'sensors', readAsset('sensors.html'));

const TABLE = 'new_test_new_sensors_acetone_data';
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// A Function URL cannot return more than ~6MB, and one full row can run to a
// few KB with the FVC blob, so the export is capped. The page says so.
const CSV_MAX_ROWS = 2000;

// Every column, in the table's own order (the shape the analysis scripts know).
const ALL_COLUMNS = [
    'id', 'login_details', 'base_raw_value', 'final_raw_value', 'base_ags', 'final_ags',
    'h2_raw_base', 'h2_raw_final', 'vo', 'base_temp', 'final_temp', 'base_humid',
    'final_humid', 'acetone_mv', 'Acetone_Original_VS_V0', 'Adjusted_Acetone_VS_V0',
    'acetone_ppm', 'Compensated_Rs_Ro_ratio', 'Correction_factor_H2_RS_R0',
    'Correction_factor_ETHANOL_Vs_V0', 'Ethanol_PPM', 'Correction_factor_Acetone_VS_V0',
    'H2_PPM', 'Ro', 'Rs', 'Rs_Ro_ratio', 'Vout_in', 'Vout_out', 'base_press',
    'final_press', 'Blow_fvc_fev_json', 'Device_FEV1', 'Predicted_FEV1', 'PPM_MEMS',
    'PPM_MEMS_with_factor', 'T_Ref_air', 'RH_Ref_air', 'ac_hwid_factor', 'dttm',
    'tstammp', 'hwid',
];
const COLUMN_SQL = ALL_COLUMNS.map((c) => `\`${c}\``).join(', ');

// Backslash is MySQL's default LIKE escape character.
const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

// Contains-search on the two identifying columns. Both can be combined.
function buildFilter(query) {
    const where = [];
    const args = [];
    const login = String(query.login ?? '').trim().slice(0, 100);
    if (login) {
        where.push('login_details LIKE ?');
        args.push(`%${escapeLike(login)}%`);
    }
    const hwid = String(query.hwid ?? '').trim().slice(0, 100);
    if (hwid) {
        where.push('hwid LIKE ?');
        args.push(`%${escapeLike(hwid)}%`);
    }
    return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', args };
}

function sendError(res, err, where) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(404).json({
            status: 'error',
            message: `The ${TABLE} table does not exist in this database.`,
        });
    }
    console.error(`admin sensors ${where}:`, err);
    // Behind the admin key, so the database's own reason is shown.
    res.status(500).json({ status: 'error', message: `Could not read the sensor data: ${err.sqlMessage || err.message}` });
}

router.get('/api/sensors', requireAdminKey, async (req, res) => {
    try {
        const limit = Math.min(MAX_LIMIT, Math.max(10, Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
        let page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const filter = buildFilter(req.query);

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM ${TABLE} ${filter.sql}`, filter.args
        );
        const pages = Math.max(1, Math.ceil(Number(total) / limit));
        if (page > pages) page = pages;   // a narrower filter can shrink the result below the current page

        // Headline columns only: the full row (with the FVC blob) comes via :id.
        const [rows] = await pool.query(
            `SELECT id, login_details, hwid, acetone_ppm, Ethanol_PPM, H2_PPM,
                    vo, base_temp, final_temp, base_humid, final_humid,
                    dttm, tstammp,
                    (Blow_fvc_fev_json IS NOT NULL AND Blow_fvc_fev_json <> '') AS has_fvc
             FROM ${TABLE} ${filter.sql}
             ORDER BY id DESC
             LIMIT ? OFFSET ?`,
            [...filter.args, limit, (page - 1) * limit]
        );
        const data = rows.map((r) => ({ ...r, has_fvc: Boolean(Number(r.has_fvc)) }));
        res.json({ status: 'success', page, limit, total: Number(total), pages, data });
    } catch (err) {
        sendError(res, err, 'list');
    }
});

// The current filter as a file. Streaming is pointless under the Function URL's
// response cap, so the CSV is built in memory and the row count is capped.
router.get('/api/sensors.csv', requireAdminKey, async (req, res) => {
    try {
        const filter = buildFilter(req.query);
        const [rows] = await pool.query(
            `SELECT ${COLUMN_SQL} FROM ${TABLE} ${filter.sql}
             ORDER BY id DESC LIMIT ${CSV_MAX_ROWS + 1}`,
            filter.args
        );
        const truncated = rows.length > CSV_MAX_ROWS;
        if (truncated) rows.length = CSV_MAX_ROWS;

        // Every field is quoted. A leading =, @ or tab is prefixed with a quote
        // so a value cannot run as a spreadsheet formula; +/- are left alone
        // because the table is full of genuine negative readings.
        const cell = (v) => {
            let s = v === null || v === undefined ? '' : String(v);
            if (/^[=@\t]/.test(s)) s = `'${s}`;
            return `"${s.replace(/"/g, '""')}"`;
        };
        const lines = [ALL_COLUMNS.map(cell).join(',')];
        for (const r of rows) lines.push(ALL_COLUMNS.map((c) => cell(r[c])).join(','));

        const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
        res.set({
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="sensor-data-${stamp}.csv"`,
            'Cache-Control': 'no-store',
            // The page reads this to tell the admin the export hit the cap.
            'X-Truncated': truncated ? String(CSV_MAX_ROWS) : '0',
        });
        res.send(lines.join('\r\n') + '\r\n');
    } catch (err) {
        sendError(res, err, 'csv');
    }
});

router.get('/api/sensors/:id', requireAdminKey, async (req, res) => {
    const id = String(req.params.id);
    if (!/^\d{1,19}$/.test(id)) return res.status(400).json({ status: 'error', message: 'Invalid reading id.' });
    try {
        const [rows] = await pool.query(
            `SELECT ${COLUMN_SQL} FROM ${TABLE} WHERE id = ?`, [id]
        );
        if (!rows.length) {
            return res.status(404).json({ status: 'error', message: 'This reading no longer exists.' });
        }
        res.json({ status: 'success', data: rows[0] });
    } catch (err) {
        sendError(res, err, 'detail');
    }
});

module.exports = router;

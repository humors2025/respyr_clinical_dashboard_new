// ===========================================================================
// Admin: create a clinic login  (mounted at /admin)
//
// Node port of the internal page admin/create_clinic.php and the PHP endpoint
// it posted to (humorstech.com/.../create_clinic_id1.php), so creating a clinic
// no longer touches PHP.
//
//   GET  /admin/create_clinic   the form (admin/create_clinic.{html,css,js})
//   POST /admin/create_clinic   creates the clinic; header X-Admin-Key required
//
// Access: ADMIN_KEY, checked by lib/admin-common.js (shared with the log viewer).
//
// The PHP source was not available, so the inserts are built from the live
// table definitions (information_schema) rather than a hard-coded column list:
// only columns that exist are written, logos are stored in the form their
// column can hold, and a NOT NULL column this code does not fill is reported
// by name instead of failing with a bare SQL error.
// ===========================================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const pool = require('../db');
const { requireAdminKey, readAsset, escapeHtml, servePage } = require('../lib/admin-common');

const router = express.Router();

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

// The page. The dashboard link used in the welcome message is filled in here
// so the page needs no config of its own.
const DASHBOARD_URL = process.env.DASHBOARD_LOGIN_URL
    || process.env.DASHBOARD_ORIGIN
    || 'https://portal.respyr.in/clinical/';
servePage(router, 'create_clinic', readAsset('create_clinic.html')
    .replace('__DASHBOARD_URL__', () => escapeHtml(DASHBOARD_URL)));

// ---------------------------------------------------------------------------
// Creating the clinic
// ---------------------------------------------------------------------------
class InputError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const uploadLogos = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_LOGO_BYTES, files: 2, fields: 20 },
}).fields([{ name: 'logo_src', maxCount: 1 }, { name: 'report_logo_src', maxCount: 1 }]);

const parseUpload = (req, res) => new Promise((resolve, reject) => {
    uploadLogos(req, res, (err) => (err ? reject(err) : resolve()));
});

// The dashboard (routes/clinic.js) and the app recognise PNG and JPEG bytes only.
function imageKind(buf) {
    if (buf.length > 8 && buf[0] === 0x89 && buf.slice(1, 4).toString() === 'PNG') return 'png';
    if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg';
    return null;
}

// Validates the form. Rules match admin/create_clinic.js and what the logins
// expect: the dashboard trims the password it is given, and bcrypt only uses
// the first 72 bytes.
function readInput(req) {
    const b = req.body || {};
    const text = (k) => String(b[k] ?? '').trim();

    const clinic_name = text('clinic_name');
    if (clinic_name.length < 2 || clinic_name.length > 100) {
        throw new InputError(400, 'The clinic login ID must be 2–100 characters.');
    }
    if (/[\u0000-\u001f\u007f]/.test(clinic_name)) {
        throw new InputError(400, 'The clinic login ID contains invalid characters.');
    }

    const phone_no = text('phone_no').replace(/[\s-]/g, '');
    if (!/^\+?\d{7,15}$/.test(phone_no)) throw new InputError(400, 'Enter a valid phone number.');

    const email = text('email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
        throw new InputError(400, 'Enter a valid email address.');
    }

    const location = text('location');
    if (!location || location.length > 255) throw new InputError(400, 'Enter the location (up to 255 characters).');

    const password = text('password');
    if (password.length < 6) throw new InputError(400, 'Password must be at least 6 characters.');
    if (Buffer.byteLength(password) > 72) throw new InputError(400, 'Password must be 72 characters or fewer.');

    const allow = text('test_allow');
    if (allow !== 'true' && allow !== 'false') throw new InputError(400, 'Choose a test limit.');
    const test_allow = allow === 'true';
    const test_no = test_allow ? Number(text('test_no')) : 0;
    if (test_allow && (!Number.isInteger(test_no) || test_no < 1 || test_no > 1000000)) {
        throw new InputError(400, 'Enter the number of tests allowed (a whole number, 1 or more).');
    }

    const logo = (field, label) => {
        const file = req.files?.[field]?.[0];
        if (!file || !file.buffer.length) return null;
        const kind = imageKind(file.buffer);
        if (!kind) throw new InputError(400, `The ${label} must be a PNG or JPEG image.`);
        return { buffer: file.buffer, kind };
    };

    return {
        clinic_name, phone_no, email, location, password, test_allow, test_no,
        logo: logo('logo_src', 'dashboard logo'),
        reportLogo: logo('report_logo_src', 'report logo'),
    };
}

const BINARY_TYPES = new Set(['tinyblob', 'blob', 'mediumblob', 'longblob', 'binary', 'varbinary']);
const NUMERIC_TYPES = new Set(['tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint', 'bit', 'decimal']);
const DATE_TYPES = new Set(['datetime', 'timestamp', 'date']);

async function loadColumns(conn) {
    const [rows] = await conn.query(
        `SELECT table_name AS t, column_name AS c, data_type AS type, is_nullable AS nullable,
                column_default AS def, extra AS extra, character_maximum_length AS maxlen
         FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name IN ('table_clinics', 'test_allow')`
    );
    const tables = { table_clinics: new Map(), test_allow: new Map() };
    for (const r of rows) tables[r.t]?.set(r.c, { ...r, type: String(r.type).toLowerCase() });
    return tables;
}

// NOT NULL, no default, not filled in by MySQL itself.
const isRequired = (col) => col.nullable === 'NO' && col.def === null
    && !/auto_increment|DEFAULT_GENERATED/i.test(col.extra || '');

// A logo goes in as raw bytes when the column is binary (what the app reads),
// otherwise as a data: URI, which routes/clinic.js also understands.
function logoValue(col, logo, label) {
    if (!col) return undefined;
    if (!logo) return isRequired(col) ? (BINARY_TYPES.has(col.type) ? Buffer.alloc(0) : '') : undefined;
    const value = BINARY_TYPES.has(col.type)
        ? logo.buffer
        : `data:image/${logo.kind};base64,${logo.buffer.toString('base64')}`;
    const max = Number(col.maxlen) || 0;
    if (max && value.length > max) {
        const kb = (n) => Math.ceil(n / 1024);
        throw new InputError(400, `The ${label} is too large for the database (${kb(value.length)} KB; `
            + `the ${col.c} column holds at most ${kb(max)} KB). Please upload a smaller image.`);
    }
    return value;
}

// INSERT for the given values, restricted to columns that exist. Required
// date columns are stamped with NOW(); any other required column this code
// does not know about is returned in `missing` so the caller can say so.
function buildInsert(table, cols, values) {
    const names = [];
    const marks = [];
    const params = [];
    for (const [name, value] of Object.entries(values)) {
        if (value === undefined || !cols.has(name)) continue;
        names.push(name);
        marks.push('?');
        params.push(value);
    }
    const missing = [];
    for (const col of cols.values()) {
        if (names.includes(col.c) || !isRequired(col)) continue;
        if (DATE_TYPES.has(col.type)) {
            names.push(col.c);
            marks.push('NOW()');
        } else {
            missing.push(col.c);
        }
    }
    const list = names.map((n) => `\`${n}\``).join(', ');
    return { sql: `INSERT INTO ${table} (${list}) VALUES (${marks.join(', ')})`, params, missing };
}

router.post('/create_clinic', requireAdminKey, async (req, res) => {
    let conn;
    let inTransaction = false;
    try {
        try {
            await parseUpload(req, res);
        } catch (err) {
            throw new InputError(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
                err.code === 'LIMIT_FILE_SIZE' ? 'Each logo must be 2 MB or smaller.' : 'The upload could not be read.');
        }
        const input = readInput(req);

        conn = await pool.getConnection();
        const cols = await loadColumns(conn);
        const clinics = cols.table_clinics;
        if (!clinics.size) throw new InputError(500, 'table_clinics was not found in this database.');

        const nameMax = Number(clinics.get('clinic_name')?.maxlen) || 0;
        if (nameMax && input.clinic_name.length > nameMax) {
            throw new InputError(400, `The clinic login ID can be at most ${nameMax} characters.`);
        }

        // Both logins look clinics up by these, so a second row with the same
        // name or phone would let its password open the existing clinic.
        const [byName] = await conn.query(
            'SELECT 1 FROM table_clinics WHERE clinic_name = ? LIMIT 1', [input.clinic_name]
        );
        if (byName.length) {
            throw new InputError(409, `A clinic with the login ID "${input.clinic_name}" already exists. Choose a different one.`);
        }
        if (clinics.has('phone_no')) {
            const [byPhone] = await conn.query(
                'SELECT clinic_name FROM table_clinics WHERE phone_no = ? LIMIT 1', [input.phone_no]
            );
            if (byPhone.length) {
                throw new InputError(409, `The phone number ${input.phone_no} is already used by "${byPhone[0].clinic_name}". `
                    + 'Each clinic needs its own number for the app login.');
            }
        }

        const clinicInsert = buildInsert('table_clinics', clinics, {
            clinic_name: input.clinic_name,
            password: await bcrypt.hash(input.password, 10),
            phone_no: input.phone_no,
            location: input.location,
            username: input.email,   // the old form's email field; no table had a separate one
            email: input.email,      // written only if such a column exists
            logo_src: logoValue(clinics.get('logo_src'), input.logo, 'dashboard logo'),
            report_logo_src: logoValue(clinics.get('report_logo_src'), input.reportLogo, 'report logo'),
        });
        if (clinicInsert.missing.length) {
            throw new InputError(500, `table_clinics has required column(s) this form does not fill: `
                + `${clinicInsert.missing.join(', ')}. Nothing was created.`);
        }

        // test_allow stores the PHP form's 'true'/'false' unless the column is numeric.
        const limits = cols.test_allow;
        const allowCol = limits.get('test_allow');
        const allowValue = allowCol && NUMERIC_TYPES.has(allowCol.type)
            ? (input.test_allow ? 1 : 0)
            : (input.test_allow ? 'true' : 'false');
        let limitInsert = null;
        let limitExists = false;
        if (limits.has('login_id')) {
            const [existing] = await conn.query(
                'SELECT 1 FROM test_allow WHERE login_id = ? LIMIT 1', [input.clinic_name]
            );
            limitExists = existing.length > 0;
            if (!limitExists) {
                limitInsert = buildInsert('test_allow', limits, {
                    login_id: input.clinic_name, test_allow: allowValue, test_no: input.test_no,
                });
                if (limitInsert.missing.length) {
                    throw new InputError(500, `test_allow has required column(s) this form does not fill: `
                        + `${limitInsert.missing.join(', ')}. Nothing was created.`);
                }
            }
        }

        // Both rows or neither.
        await conn.beginTransaction();
        inTransaction = true;
        const [created] = await conn.query(clinicInsert.sql, clinicInsert.params);
        let testAllowRow = 'skipped (test_allow table not found)';
        if (limitInsert) {
            await conn.query(limitInsert.sql, limitInsert.params);
            testAllowRow = 'created';
        } else if (limitExists) {
            const sets = ['test_allow', 'test_no'].filter((c) => limits.has(c));
            const vals = { test_allow: allowValue, test_no: input.test_no };
            if (sets.length) {
                await conn.query(
                    `UPDATE test_allow SET ${sets.map((c) => `\`${c}\` = ?`).join(', ')} WHERE login_id = ?`,
                    [...sets.map((c) => vals[c]), input.clinic_name]
                );
            }
            testAllowRow = 'updated (a row for this login ID already existed)';
        }
        await conn.commit();
        inTransaction = false;

        console.log(`admin: created clinic "${input.clinic_name}" (clinical_id ${created.insertId || '?'})`);
        res.json({
            status: 'success',
            message: `Clinic "${input.clinic_name}" created.`,
            clinic_name: input.clinic_name,
            clinical_id: created.insertId || null,
            test_limit: input.test_allow ? `${input.test_no} tests` : 'Unlimited',
            test_allow_row: testAllowRow,
            logos: { dashboard: Boolean(input.logo), report: Boolean(input.reportLogo) },
        });
    } catch (err) {
        if (inTransaction) await conn.rollback().catch(() => {});
        if (err instanceof InputError) {
            if (err.status >= 500) console.error('admin create_clinic:', err.message);
            return res.status(err.status).json({ status: 'error', message: err.message });
        }
        console.error('admin create_clinic:', err);
        // The page is behind the admin key, so the database's own reason is
        // shown: it is what an admin needs to fix a grant or a schema mismatch.
        const reason = err.sqlMessage || err.message || 'Unknown error';
        res.status(500).json({ status: 'error', message: `Could not create the clinic: ${reason}` });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;

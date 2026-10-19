// ===========================================================================
// Web-dashboard data routes  (mounted at /api/dashboard)
//
// These serve the PHP admin dashboard (clinical-required) once it is repointed
// off the old humorstech.com PHP and onto this Node backend — local DB now, the
// same Lambda + RDS later, exactly like the mobile app.
//
// IMPORTANT: the original PHP endpoints decrypt `encryp_clinical_scores_details`
// via /var/www/helpers/crypto_helper.php (a server-only file we don't have).
// We sidestep that the same way the app migration did: read the PLAINTEXT
// `clinical_scores_details` mirror instead. No decryption key required.
// ===========================================================================
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const throttle = require('../lib/throttle');
const multer = require('multer');
const { sendReportEmail, isConfigured: mailConfigured } = require('../lib/mailer');

// One definition of the signing secret for this whole service (auth.js also
// refuses to boot on Lambda without it configured).
const { DASHBOARD_JWT_SECRET } = require('../auth');

// ---------------------------------------------------------------------------
// Every dashboard route now REQUIRES a valid dashboard JWT (Bearer header),
// except /login itself. A token may only read its OWN clinic's data.
// ---------------------------------------------------------------------------
router.use((req, res, next) => {
    if (req.path === '/login' || req.path.startsWith('/forgot-password/')) return next();

    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token) return res.status(401).json({ status: 'error', message: 'Missing token' });
    try {
        req.dashboardUser = jwt.verify(token, DASHBOARD_JWT_SECRET);
    } catch (e) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }

    // EVERY clinic identifier in the request must match the token. Checking only
    // the first one found let a caller pass its own login_id while a handler
    // read clinic_name (or the query string) and returned another clinic's data.
    const own = String(req.dashboardUser.login_id || '').trim();
    const supplied = [req.body?.login_id, req.query?.login_id, req.body?.clinic_name, req.query?.clinic_name]
        .map((v) => String(v ?? '').trim())
        .filter(Boolean);
    if (own && supplied.some((v) => v !== own)) {
        return res.status(403).json({ status: 'error', message: 'Token does not match requested clinic' });
    }
    next();
});

// Today's date in Asia/Kolkata as mm/dd/yyyy (the DB's dttm format).
function todayMMDDYYYY() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const g = t => parts.find(p => p.type === t).value;
    return `${g('month')}/${g('day')}/${g('year')}`;
}

// Ports api/opd-encry-age-gender-diversity-v2.php.
// Body (form-encoded or JSON): login_id (required), date (dd/mm/yyyy, optional -> today).
// Returns an ARRAY: the latest reading per patient for that day, with demographics
// (name/gender/age/height/weight) joined in and a count_taken. Empty array if none.
router.post('/age-gender-diversity', async (req, res) => {
    try {
        const login_id = (req.body?.login_id || '').trim();
        if (!login_id) {
            return res.status(400).json({ error: 'Missing login_id' });
        }

        // date arrives dd/mm/yyyy (frontend) -> convert to mm/dd/yyyy to match DB dttm.
        const raw = (req.body?.date || '').trim();
        let dateFormatted;
        if (raw) {
            const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (!m) return res.status(400).json({ error: 'Invalid date format' });
            const [, dd, mm, yyyy] = m;
            dateFormatted = `${mm.padStart(2, '0')}/${dd.padStart(2, '0')}/${yyyy}`;
        } else {
            dateFormatted = todayMMDDYYYY();
        }
        const dateLike = `${dateFormatted}%`;

        // That day's score rows for this clinic, joined to demographics. Reads the
        // plaintext table, so the score fields come back ready to use (no decrypt).
        const [rows] = await pool.query(
            `SELECT s.*, d.name, d.gender, d.age, d.height, d.weight
             FROM clinical_scores_details s
             LEFT JOIN data_personal_info d
               ON d.login_id = s.login_id AND d.profile_id = s.profile_id
             WHERE s.login_id = ? AND s.dttm LIKE ?`,
            [login_id, dateLike]
        );

        // Keep the latest row per (login_id||profile_id) and count the day's readings.
        const latest = {};
        const counts = {};
        for (const r of rows) {
            const key = `${r.login_id}||${r.profile_id}`;
            counts[key] = (counts[key] || 0) + 1;
            const ts = parseInt(r.timestamp, 10) || 0;
            if (!latest[key] || ts > (parseInt(latest[key].timestamp, 10) || 0)) {
                latest[key] = r;
            }
        }

        const round1 = (v) => { const n = parseFloat(v); return isNaN(n) ? v : Math.round(n * 10) / 10; };
        const scoreFields = ['Db_Score', 'Gut_Score_per', 'liver_score', 'Blow_Score',
                             'acetone_ppm', 'ethnol_ppm', 'h2_ppm'];

        const out = Object.keys(latest).map((key) => {
            const r = { ...latest[key], count_taken: counts[key] };
            for (const f of scoreFields) {
                if (r[f] !== null && r[f] !== undefined && r[f] !== '') r[f] = round1(r[f]);
            }
            // These columns existed only in the encrypted table; the dashboard's score
            // selector may reference them, so expose them as null rather than undefined.
            if (r.Overall_Vital_Score === undefined) r.Overall_Vital_Score = null;
            if (r.Dibetic_value === undefined) r.Dibetic_value = null;
            return r;
        });

        // Newest first (mirrors the PHP usort by timestamp desc).
        out.sort((a, b) => (parseInt(b.timestamp, 10) || 0) - (parseInt(a.timestamp, 10) || 0));

        res.json(out);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Ports api/opd-encry-data-weeks_v2.php — every reading for a clinic (plaintext),
// with name/gender joined. Feeds the weekly "Test Taken" chart (renderChart).
// The big text blobs (blow_raw_values, respiratory_fvc_json) are left out: the
// chart only needs dates + scores, and a clinic can have thousands of rows.
router.post('/data-weeks', async (req, res) => {
    try {
        const login_id = (req.body?.login_id || req.query?.login_id || '').trim();
        if (!login_id) return res.status(400).json({ error: 'Missing login_id' });

        // Optional: only rows at/after this unix second. The dashboard uses it to
        // top up after a live "test completed" event instead of re-downloading
        // the clinic's whole history.
        const fromRaw = req.body?.from ?? req.query?.from;
        const from = Number.parseInt(fromRaw, 10);
        const since = Number.isFinite(from) ? from : null;

        // data_personal_info holds one row PER EDIT, so joining it directly
        // duplicated tests (4,663 rows for 4,652 tests) and inflated the day
        // counts and the test log. Join only each subject's newest row.
        const [rows] = await pool.query(
            `SELECT s.id, s.login_id, s.profile_id, s.Db_Score, s.Gut_Score_per,
                    s.liver_score, s.Blow_Score, s.acetone_ppm, s.ethnol_ppm, s.h2_ppm,
                    s.dttm, s.timestamp, s.hwd, d.name, d.gender
             FROM clinical_scores_details s
             LEFT JOIN (
                 SELECT p.login_id, p.profile_id, p.name, p.gender
                 FROM data_personal_info p
                 INNER JOIN (
                     SELECT login_id, profile_id, MAX(id) AS mid
                     FROM data_personal_info WHERE login_id = ? GROUP BY login_id, profile_id
                 ) pm ON pm.mid = p.id
             ) d ON d.login_id = s.login_id AND d.profile_id = s.profile_id
             WHERE s.login_id = ?${since !== null ? ' AND CAST(s.timestamp AS UNSIGNED) >= ?' : ''}`,
            since !== null ? [login_id, login_id, since] : [login_id, login_id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Ports api/opd-onboard-pat_v2.php — count of distinct onboarded patients.
// Response shape: { onboarded: <count> }.
router.post('/onboarded', async (req, res) => {
    try {
        const login_id = (req.body?.login_id || req.query?.login_id || '').trim();
        if (!login_id) return res.status(400).json({ error: 'Missing login_id' });
        const [r] = await pool.query(
            `SELECT COUNT(DISTINCT profile_id) AS onboarded FROM data_personal_info WHERE login_id = ?`,
            [login_id]
        );
        res.json({ onboarded: r[0].onboarded });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Ports api/encrp_testallow_v2.php — total tests done + allowance, for the
// "Total Test Taken" card. Counts the plaintext table (no decryption needed).
// Accepts GET ?login_id=... (how the dashboard calls it) or a POST body.
async function testAllowHandler(req, res) {
    try {
        const login_id = (req.query?.login_id || req.body?.login_id || '').trim();
        if (!login_id) {
            return res.json({ status: 'error', message: 'login_id parameter is required.' });
        }
        const [c] = await pool.query(
            `SELECT COUNT(*) AS total FROM clinical_scores_details WHERE login_id = ?`, [login_id]
        );
        const [t] = await pool.query(
            `SELECT test_no, test_allow FROM test_allow WHERE login_id = ? LIMIT 1`, [login_id]
        );
        res.json({
            status: 'success',
            login_id,
            clinical_score_count: c[0].total,
            test_no: t.length ? t[0].test_no : null,
            test_allow: t.length ? t[0].test_allow : null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
router.get('/test-allow', testAllowHandler);
router.post('/test-allow', testAllowHandler);

// Latest reading per patient + test count + demographics — PAGINATED and
// searchable server-side (shipping all subjects at once made Test history
// slow). Feeds data_table.php. Response: { status, data, page, limit, total }.
async function scoresHandler(req, res) {
    try {
        const src = { ...(req.query || {}), ...(req.body || {}) };
        const login_id = String(src.login_id || '').trim();
        if (!login_id) return res.status(400).json({ error: 'Missing login_id' });
        const page = Math.max(1, parseInt(src.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(src.limit, 10) || 20));
        const search = String(src.search || '').trim();
        const like = `%${search}%`;
        const searchSql = search ? ' AND (s.profile_id LIKE ? OR d.name LIKE ?)' : '';
        const searchArgs = search ? [like, like] : [];

        // data_personal_info holds one row PER EDIT, so joining it directly
        // multiplied every subject (a subject edited twice appeared 3x and
        // inflated `total`). Join only that subject's newest row.
        // Pin each subject to the single newest row by ID. Matching on
        // MAX(timestamp) alone can return two rows if a subject tested twice in
        // the same second, and the GROUP BY that used to paper over that cost
        // ~1.8s per page; joining on the primary key is ~9ms.
        const joinSql =
            `FROM clinical_scores_details s
             INNER JOIN (
                 SELECT profile_id, MAX(id) AS keep_id
                 FROM clinical_scores_details
                 WHERE login_id = ?
                   AND (profile_id, timestamp) IN (
                       SELECT profile_id, MAX(timestamp)
                       FROM clinical_scores_details WHERE login_id = ? GROUP BY profile_id
                   )
                 GROUP BY profile_id
             ) latest ON s.id = latest.keep_id
             LEFT JOIN (
                 SELECT p.login_id, p.profile_id, p.name, p.gender, p.age, p.height, p.weight
                 FROM data_personal_info p
                 INNER JOIN (
                     SELECT login_id, profile_id, MAX(id) AS mid
                     FROM data_personal_info WHERE login_id = ? GROUP BY login_id, profile_id
                 ) pm ON pm.mid = p.id
             ) d ON d.login_id = s.login_id AND d.profile_id = s.profile_id
             WHERE s.login_id = ?${searchSql}`;

        // Count at the PROFILE level, never joining back into the wide score
        // rows — counting through the full join made every page load ~2s.
        // COUNT DISTINCT: the personal_info join can still match several rows
        // per subject here, and without DISTINCT the page count came out wrong.
        const countSearchSql = search ? ' WHERE (g.profile_id LIKE ? OR d.name LIKE ?)' : '';
        const [t] = await pool.query(
            `SELECT COUNT(DISTINCT g.profile_id) AS total
                 FROM (SELECT profile_id FROM clinical_scores_details
                       WHERE login_id = ? GROUP BY profile_id) g
                 LEFT JOIN data_personal_info d
                     ON d.login_id = ? AND d.profile_id = g.profile_id
                 ${countSearchSql}`,
            [login_id, login_id, ...searchArgs]
        );

        const [rows] = await pool.query(
            `SELECT s.id, s.login_id, s.profile_id, s.Db_Score, s.Gut_Score_per,
                    s.liver_score, s.Blow_Score, s.dttm, s.timestamp, s.hwd,
                    s.acetone_ppm, s.ethnol_ppm, s.h2_ppm,
                    s.blow_raw_values, s.respiratory_fvc_json,
                    d.name, d.gender, d.age, d.height, d.weight
             ${joinSql}
             ORDER BY CAST(s.timestamp AS UNSIGNED) DESC
             LIMIT ? OFFSET ?`,
            [login_id, login_id, login_id, login_id, ...searchArgs, limit, (page - 1) * limit]
        );

        // test counts only for the profiles on this page
        const counts = {};
        const ids = rows.map((r) => r.profile_id);
        if (ids.length) {
            const [cnt] = await pool.query(
                `SELECT profile_id, COUNT(*) AS c FROM clinical_scores_details
                 WHERE login_id = ? AND profile_id IN (?) GROUP BY profile_id`,
                [login_id, ids]
            );
            for (const r of cnt) counts[r.profile_id] = r.c;
        }

        const data = rows.map((r) => ({ ...r, count_taken: counts[r.profile_id] || 0 }));
        res.json({ status: 'success', data, page, limit, total: t[0].total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
router.get('/scores', scoresHandler);
router.post('/scores', scoresHandler);

// Paginated + searchable subjects list for the Subjects page.
// (The app keeps using /api/profiles/clinic-subjects, whose bare-array shape
// must not change — the dashboard gets its own wrapped, paginated route.)
async function subjectsListHandler(req, res) {
    try {
        const src = { ...(req.query || {}), ...(req.body || {}) };
        const clinic_name = String(src.clinic_name || '').trim();
        if (!clinic_name) return res.status(400).json({ error: 'Missing clinic_name' });
        const page = Math.max(1, parseInt(src.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(src.limit, 10) || 20));
        const search = String(src.search || '').trim();
        const like = `%${search}%`;
        const where = 'WHERE clinic_name = ?' + (search ? ' AND (subject_id LIKE ? OR profile_name LIKE ?)' : '');
        const args = search ? [clinic_name, like, like] : [clinic_name];

        const [t] = await pool.query(`SELECT COUNT(*) AS total FROM table_clinical_profiles ${where}`, args);
        const [rows] = await pool.query(
            `SELECT id, subject_id, clinic_name, profile_name, gender, age, height, weight, dttm
             FROM table_clinical_profiles ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
            [...args, limit, (page - 1) * limit]
        );

        // tests taken, counted only for the subjects on this page (same shape
        // as /scores' count_taken so both pages report identical numbers)
        const counts = {};
        const ids = rows.map((r) => r.subject_id);
        if (ids.length) {
            const [cnt] = await pool.query(
                `SELECT profile_id, COUNT(*) AS c FROM clinical_scores_details
                 WHERE login_id = ? AND profile_id IN (?) GROUP BY profile_id`,
                [clinic_name, ids]
            );
            for (const r of cnt) counts[r.profile_id] = r.c;
        }
        const data = rows.map((r) => ({ ...r, count_taken: counts[r.subject_id] || 0 }));

        res.json({ status: 'success', data, page, limit, total: t[0].total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
router.get('/subjects', subjectsListHandler);
router.post('/subjects', subjectsListHandler);

// Distinct dates (YYYY-MM-DD) on which this clinic has readings — used to mark
// those days in the dashboard date picker.
async function testDatesHandler(req, res) {
    try {
        const login_id = (req.query?.login_id || req.body?.login_id || '').trim();
        if (!login_id) return res.status(400).json({ error: 'Missing login_id' });
        const [rows] = await pool.query(
            `SELECT DISTINCT DATE_FORMAT(STR_TO_DATE(dttm, '%m/%d/%Y %H:%i:%s'), '%Y-%m-%d') AS d
             FROM clinical_scores_details
             WHERE login_id = ? AND dttm IS NOT NULL AND dttm <> ''`,
            [login_id]
        );
        res.json(rows.map((r) => r.d).filter(Boolean));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
router.get('/test-dates', testDatesHandler);
router.post('/test-dates', testDatesHandler);

// ---------------------------------------------------------------------------
// Forgot-password flow — SERVER-side OTP.
// The legacy PHP returned the OTP to the browser and the page compared it in
// JavaScript (visible in DevTools; and the old update_password.php would reset
// any account with no OTP at all). Here the OTP never leaves the server:
// hashed at rest, 5-minute expiry, 5 attempts, and the reset itself requires a
// short-lived signed token that only a correct OTP can mint.
// ---------------------------------------------------------------------------
pool.query(
    `CREATE TABLE IF NOT EXISTS dashboard_password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinic_name VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_resets_clinic (clinic_name)
    )`
).catch((e) => console.error('password_resets table:', e.message));

function maskEmail(e) {
    const [u, d] = String(e || '').split('@');
    if (!d) return '';
    return (u.length <= 2 ? u[0] + '*' : u.slice(0, 2) + '***') + '@' + d;
}

// Step 1: generate + email the OTP. Email delivery still goes through the
// legacy PHP mailer (we have no SMTP here), but the OTP it returns stays on
// THIS server — the browser only learns a masked email address.
router.post('/forgot-password/send', async (req, res) => {
    try {
        const username = (req.body?.username || '').trim();
        if (!username) return res.status(400).json({ success: false, message: 'Username required' });

        const [clinics] = await pool.query(
            `SELECT clinic_name FROM table_clinics WHERE clinic_name = ? LIMIT 1`, [username]
        );
        // same answer whether or not the clinic exists (no enumeration)
        if (!clinics.length) return res.json({ success: false, message: 'Could not send OTP. Try again.' });

        const resp = await fetch(
            `https://humorstech.com/humors_app/app_final/clinical/forgot-password/send_otp2.php?username=${encodeURIComponent(username)}`
        );
        const data = await resp.json();
        if (!data.success || !data.otp) {
            return res.json({ success: false, message: data.message || 'Could not send OTP' });
        }

        const otpHash = bcrypt.hashSync(String(data.otp), 10);
        await pool.query(`DELETE FROM dashboard_password_resets WHERE clinic_name = ?`, [username]);
        await pool.query(
            `INSERT INTO dashboard_password_resets (clinic_name, otp_hash, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
            [username, otpHash]
        );

        res.json({ success: true, email: maskEmail(data.email) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Could not send OTP. Try again.' });
    }
});

// Step 2: verify the OTP server-side; a correct code mints a 10-minute
// single-purpose reset token.
router.post('/forgot-password/verify', async (req, res) => {
    try {
        const username = (req.body?.username || '').trim();
        const otp = String(req.body?.otp || '').trim();
        if (!username || !otp) return res.status(400).json({ success: false, message: 'Missing fields' });

        const [rows] = await pool.query(
            `SELECT * FROM dashboard_password_resets
             WHERE clinic_name = ? ORDER BY id DESC LIMIT 1`, [username]
        );
        const row = rows[0];
        if (!row) return res.json({ success: false, message: 'No OTP requested. Send a new one.' });
        if (new Date(row.expires_at) < new Date()) {
            return res.json({ success: false, message: 'OTP expired. Send a new one.' });
        }
        if (row.attempts >= 5) {
            return res.json({ success: false, message: 'Too many attempts. Send a new OTP.' });
        }

        if (!bcrypt.compareSync(otp, row.otp_hash)) {
            await pool.query(`UPDATE dashboard_password_resets SET attempts = attempts + 1 WHERE id = ?`, [row.id]);
            return res.json({ success: false, message: 'Entered invalid OTP.' });
        }

        await pool.query(`DELETE FROM dashboard_password_resets WHERE id = ?`, [row.id]);
        const reset_token = jwt.sign(
            { login_id: username, purpose: 'pwreset' },
            DASHBOARD_JWT_SECRET,
            { expiresIn: '10m' }
        );
        res.json({ success: true, reset_token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Verification failed. Try again.' });
    }
});

// Step 3: set the new password — only with a valid reset token.
router.post('/forgot-password/reset', async (req, res) => {
    try {
        const reset_token = (req.body?.reset_token || '').trim();
        const new_password = String(req.body?.new_password || '');
        if (!reset_token || !new_password) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        if (new_password.length < 6) {
            return res.json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(reset_token, DASHBOARD_JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ success: false, message: 'Reset link expired. Start again.' });
        }
        if (decoded.purpose !== 'pwreset' || !decoded.login_id) {
            return res.status(401).json({ success: false, message: 'Invalid reset token.' });
        }

        const hash = bcrypt.hashSync(new_password, 10);
        const [r] = await pool.query(
            `UPDATE table_clinics SET password = ? WHERE clinic_name = ?`,
            [hash, decoded.login_id]
        );
        if (!r.affectedRows) return res.json({ success: false, message: 'Account not found.' });

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update password.' });
    }
});

// Ports clinical-v2/login-api.php + api/opd-login_v2.php — dashboard admin
// login. Validates clinic_name + bcrypt password against table_clinics and
// returns the HS256 token the dashboard's auth guards expect.
// Unlike the PHP (which only checked the FIRST matching row), this checks
// every row for the name — some clinics (e.g. OFFC) have more than one.
router.post('/login', async (req, res) => {
    try {
        const username = (req.body?.username || '').trim();
        const password = (req.body?.password || '').trim();
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // One message for "no such clinic" and "wrong password". Distinct
        // messages let anyone enumerate which clinic names exist.
        const GENERIC = 'Invalid username or password';

        // Brute force protection: unlimited guesses used to be possible.
        if (await throttle.isLockedOut(username)) {
            return res.status(429).json({
                error: `Too many failed attempts. Try again in ${throttle.WINDOW_MINUTES} minutes.`,
            });
        }

        const [rows] = await pool.query(
            `SELECT clinical_id, clinic_name, password FROM table_clinics WHERE clinic_name = ?`,
            [username]
        );

        let match = null;
        for (const r of rows) {
            try {
                if (r.password && bcrypt.compareSync(password, r.password)) { match = r; break; }
            } catch (e) { /* non-bcrypt row — skip */ }
        }
        if (!match) {
            await throttle.recordFailure(username);
            return res.status(401).json({ error: GENERIC });
        }

        await throttle.clearFailures(username);
        const token = jwt.sign(
            { login_id: match.clinic_name, username: match.clinic_name },
            DASHBOARD_JWT_SECRET,
            { expiresIn: '12h' }
        );
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// Clinic account details for the admin-profile page (ports get_clinic_data2.php).
// Unlike the old PHP (and /api/clinic/data), this never returns the password hash.
async function clinicInfoHandler(req, res) {
    try {
        const clinic_name = (req.body?.clinic_name || req.query?.clinic_name || '').trim();
        if (!clinic_name) return res.status(400).json({ error: 'Missing clinic_name' });
        const [rows] = await pool.query(
            `SELECT clinical_id, clinic_name, location, username, phone_no
             FROM table_clinics WHERE clinic_name = ? LIMIT 1`,
            [clinic_name]
        );
        res.json(rows[0] || {});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
router.get('/clinic-info', clinicInfoHandler);
router.post('/clinic-info', clinicInfoHandler);

// Ports api/data-interp_v1.php — latest demographics row for one profile.
// view-profile.php curls this server-side for the profile card + BMI/BMR.
async function profileInfoHandler(req, res) {
    try {
        const login_id = (req.query?.login_id || req.body?.login_id || '').trim();
        const profile_id = (req.query?.profile_id || req.body?.profile_id || '').trim();
        if (!login_id || !profile_id) return res.status(400).json({ error: 'Missing login_id/profile_id' });
        const [rows] = await pool.query(
            `SELECT * FROM data_personal_info WHERE login_id = ? AND profile_id = ? ORDER BY id DESC LIMIT 1`,
            [login_id, profile_id]
        );
        res.json(rows[0] || {});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
router.get('/profile-info', profileInfoHandler);
router.post('/profile-info', profileInfoHandler);

// Rounds every numeric-looking value to 1 decimal, exactly like the PHP did.
function roundRowNumerics(row) {
    const out = { ...row };
    for (const k of Object.keys(out)) {
        const v = out[k];
        if (v === null || v === undefined || v === '') continue;
        const n = Number(v);
        if (!isNaN(n) && isFinite(n) && String(v).trim() !== '') {
            out[k] = Math.round(n * 10) / 10;
        }
    }
    return out;
}

// Ports api/encrp-trends-history-v2.php — last 40 readings of ONE profile,
// plus a derived FEV1_L pulled out of respiratory_fvc_json. Reads the
// PLAINTEXT table (the PHP decrypted the encrypted mirror server-side).
// Feeds the view-profile trend chart + per-score test history list.
async function trendsHistoryHandler(req, res) {
    try {
        const login_id = (req.query?.login_id || req.body?.login_id || '').trim();
        const profile_id = (req.query?.profile_id || req.body?.profile_id || '').trim();
        if (!login_id || !profile_id) return res.status(400).json({ error: 'Missing login_id/profile_id' });
        // Paged + windowed: the rows carry the big breath blobs, so a window is
        // always applied. Two modes:
        //   default  — the last 90 days (what the 1W/1M/3M buttons need)
        //   from/to  — an explicit range in unix seconds, which IGNORES the
        //              90-day cap so older months stay reachable from the
        //              "Older" month picker.
        const offset = Math.max(0, parseInt(req.query?.offset ?? req.body?.offset, 10) || 0);
        const fromRaw = req.query?.from ?? req.body?.from;
        const toRaw = req.query?.to ?? req.body?.to;
        const from = Number.parseInt(fromRaw, 10);
        const to = Number.parseInt(toRaw, 10);
        const explicit = Number.isFinite(from) && Number.isFinite(to) && to > from;

        const where = explicit
            ? 'login_id = ? AND profile_id = ? AND CAST(timestamp AS UNSIGNED) BETWEEN ? AND ?'
            : 'login_id = ? AND profile_id = ? AND CAST(timestamp AS UNSIGNED) >= ?';
        const args = explicit
            ? [login_id, profile_id, from, to]
            : [login_id, profile_id, Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60];

        const [cnt] = await pool.query(
            `SELECT COUNT(*) AS total FROM clinical_scores_details WHERE ${where}`,
            args
        );
        const [rows] = await pool.query(
            `SELECT * FROM clinical_scores_details WHERE ${where}
             ORDER BY id DESC LIMIT 180 OFFSET ?`,
            [...args, offset]
        );
        const out = rows.map((raw) => {
            const r = roundRowNumerics(raw);
            // keep the long text fields untouched
            r.dttm = raw.dttm;
            r.blow_raw_values = raw.blow_raw_values;
            r.respiratory_fvc_json = raw.respiratory_fvc_json;
            try {
                const fvc = raw.respiratory_fvc_json ? JSON.parse(raw.respiratory_fvc_json) : null;
                const fev1 = fvc?.Respyr_Measured?.['FEV1(L)'];
                if (fev1 !== undefined && fev1 !== null) r.FEV1_L = Math.round(parseFloat(fev1) * 100) / 100;
            } catch (e) { /* bad json on one row must not break the page */ }
            if (r.Overall_Vital_Score === undefined) r.Overall_Vital_Score = null;
            if (r.Dibetic_value === undefined) r.Dibetic_value = null;
            return r;
        });
        res.json({ status: 'success', total: cnt[0].total, offset, limit: 180, data: out });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
// Months (all time) in which a subject has tests, newest first, with a count.
// Feeds the profile page's "Older" month picker so it can only offer months
// that actually contain data.
async function profileMonthsHandler(req, res) {
    try {
        const login_id = (req.query?.login_id || req.body?.login_id || '').trim();
        const profile_id = (req.query?.profile_id || req.body?.profile_id || '').trim();
        if (!login_id || !profile_id) return res.status(400).json({ error: 'Missing login_id/profile_id' });

        const [rows] = await pool.query(
            `SELECT DATE_FORMAT(FROM_UNIXTIME(CAST(timestamp AS UNSIGNED)), '%Y-%m') AS ym,
                    COUNT(*) AS n,
                    MIN(CAST(timestamp AS UNSIGNED)) AS first_ts,
                    MAX(CAST(timestamp AS UNSIGNED)) AS last_ts
             FROM clinical_scores_details
             WHERE login_id = ? AND profile_id = ?
             GROUP BY ym
             ORDER BY ym DESC`,
            [login_id, profile_id]
        );
        const [tot] = await pool.query(
            `SELECT COUNT(*) AS total FROM clinical_scores_details WHERE login_id = ? AND profile_id = ?`,
            [login_id, profile_id]
        );
        res.json({ status: 'success', total: tot[0].total, months: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
router.get('/profile-months', profileMonthsHandler);
router.post('/profile-months', profileMonthsHandler);

router.get('/trends-history', trendsHistoryHandler);
router.post('/trends-history', trendsHistoryHandler);

// Ports fetch/trend_7_days.php — the report page's four mini trend charts.
// Shape: newest-first rows with dttm + the four scores (page reverses them).
async function trend7DaysHandler(req, res) {
    try {
        const login_id = (req.query?.login_id || req.body?.login_id || '').trim();
        const profile_id = (req.query?.profile_id || req.body?.profile_id || '').trim();
        if (!login_id || !profile_id) return res.status(400).json({ error: 'Missing login_id/profile_id' });
        const [rows] = await pool.query(
            `SELECT dttm, Db_Score, Gut_Score_per, liver_score, Blow_Score
             FROM clinical_scores_details
             WHERE login_id = ? AND profile_id = ? ORDER BY id DESC LIMIT 7`,
            [login_id, profile_id]
        );
        res.json(rows.map(roundRowNumerics).map((r, i) => ({ ...r, dttm: rows[i].dttm })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
router.get('/trend-7-days', trend7DaysHandler);
router.post('/trend-7-days', trend7DaysHandler);

// ---------------------------------------------------------------------------
// Report email  (ports report/send_email1.php — the last PHP backend file)
//
// The PDF is rendered in the browser and posted here as multipart, so it is
// held in memory only: a Lambda has no writable disk worth staging it on, and
// the bytes should not outlive the request in any case.
// ---------------------------------------------------------------------------

// A Function URL rejects a request body over ~6MB before it ever reaches this
// code, so the limit here is deliberately lower: a 5MB cap produces our own
// readable message instead of the platform's opaque 413.
const MAX_PDF_BYTES = 5 * 1024 * 1024;

const uploadPdf = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PDF_BYTES, files: 1, fields: 10 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') return cb(null, true);
        cb(new Error('ONLY_PDF'));
    },
}).single('pdf');

router.post('/send-report-email', (req, res) => {
    uploadPdf(req, res, async (uploadErr) => {
        if (uploadErr) {
            // Matches the wording the report page already special-cases, so the
            // existing "too large to email" toast keeps working.
            const tooBig = uploadErr.code === 'LIMIT_FILE_SIZE';
            return res.status(tooBig ? 413 : 400).json({
                success: false,
                message: tooBig
                    ? 'Missing PDF or email - the report exceeded the upload limit.'
                    : 'The attachment must be a PDF.',
            });
        }

        // A password-reset token is a valid dashboard JWT but must not be able
        // to send mail; the router's own check only establishes the signature.
        if (req.dashboardUser?.purpose === 'pwreset') {
            return res.status(403).json({ success: false, message: 'Not authorised to send reports.' });
        }

        const email = String(req.body?.email || '').trim();
        const name = String(req.body?.name || 'User').trim();
        if (!req.file?.buffer?.length || !email) {
            return res.status(400).json({ success: false, message: 'Missing PDF or email' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'That email address looks invalid.' });
        }

        if (!mailConfigured()) {
            console.error('send-report-email: RESPYR_SMTP_PASS is not set');
            return res.status(503).json({ success: false, message: 'Email is not configured on the server.' });
        }

        // The sender name comes from the token, not the request. The PHP version
        // took it from a `brand_name` form field, which let any signed-in clinic
        // send mail branded as another one.
        const brandName = String(req.dashboardUser?.login_id || '').trim() || 'Humors Tech';

        try {
            await sendReportEmail({ to: email, name, brandName, pdf: req.file.buffer });
            res.json({ success: true, message: 'Email sent successfully.' });
        } catch (err) {
            console.error('send-report-email:', err.message);
            res.status(502).json({ success: false, message: 'Could not send the email. Please try again.' });
        }
    });
});

module.exports = router;

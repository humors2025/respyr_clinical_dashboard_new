// ---------------------------------------------------------------------------
// Clinic account routes — the subset the web dashboard calls.
//
// Extracted from the app backend so the dashboard has no runtime dependency on
// it. Logic is unchanged; only the auth middleware differs (dashboard tokens
// only). The app keeps its own copy of these routes in its own service.
// ---------------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { checkDashboardToken, enforceOwnClinic } = require('../auth');
const bcrypt = require('bcryptjs');

router.post('/logos', checkDashboardToken, enforceOwnClinic, async (req, res) => {
    try {
        const login_id = req.body?.login_id || '';

        if (!login_id) {
            return res.json({ status: 'error', message: 'Missing login_id parameter' });
        }

        const [rows] = await pool.query(
            `SELECT logo_src, report_logo_src FROM table_clinics WHERE clinic_name = ?`,
            [login_id]
        );

        const basePath = 'https://portal.respyr.in/logos/';

        // PHP's normalizeLogoPath: empty→null; starts with 'http'→unchanged; else prepend basePath
        function normalizeLogoPath(value) {
            if (value === null || value === undefined || value.length === 0) return null;

            // The column holds EITHER a path string OR the image bytes themselves
            // (some clinics store a PNG/JPEG BLOB). Treating bytes as a path produced
            // "https://portal.respyr.in/logos/<binary>", which no browser can load.
            if (Buffer.isBuffer(value)) {
                const png = value.length > 8 && value[0] === 0x89 && value.slice(1, 4).toString() === 'PNG';
                const jpg = value.length > 3 && value[0] === 0xff && value[1] === 0xd8;
                if (png || jpg) {
                    return 'data:image/' + (png ? 'png' : 'jpeg') + ';base64,' + value.toString('base64');
                }
            }

            const str = value.toString();
            if (str.indexOf('data:') === 0 || str.indexOf('http') === 0) return str;
            return basePath + str.replace(/^[/]+/, ''); // ltrim('/')
        }

        if (rows.length > 0) {
            const row = rows[0];
            row.logo_src = normalizeLogoPath(row.logo_src);
            row.report_logo_src = normalizeLogoPath(row.report_logo_src);
            res.json({ status: 'success', data: row });
        } else {
            res.json({ status: 'error', message: 'No clinic found for the given login_id' });
        }
    } catch (err) {
        console.error(err);
        res.json({ status: 'error', message: 'Something went wrong. Please try again.' });
    }
});

router.post('/change-password', checkDashboardToken, enforceOwnClinic, async (req, res) => {
    try {
        const clinic_name = req.body?.clinic_name || '';
        const current_password = req.body?.current_password || '';
        const new_password = req.body?.new_password || '';

        if (!clinic_name || !current_password || !new_password) {
            return res.json({ status: 'error', message: 'Missing parameters' });
        }

        // Look up the clinic's stored hash
        // clinic_name is NOT unique (some clinics have several operator rows),
        // so match the row whose CURRENT password verifies and update only that
        // one — updating by name overwrote every operator's password.
        const [rows] = await pool.query(
            `SELECT clinical_id, password FROM table_clinics WHERE clinic_name = ?`,
            [clinic_name]
        );

        if (rows.length === 0) {
            return res.json({ status: 'error', message: 'Clinic not found' });
        }

        let matched = null;
        for (const row of rows) {
            if (await bcrypt.compare(current_password, row.password || '')) { matched = row; break; }
        }
        if (!matched) {
            return res.json({ status: 'error', message: 'Incorrect current password' });
        }

        // Hash the NEW password (bcrypt cost 10 = PHP's PASSWORD_DEFAULT) and store it
        const newHashed = await bcrypt.hash(new_password, 10);
        const [result] = await pool.query(
            `UPDATE table_clinics SET password = ? WHERE clinical_id = ?`,
            [newHashed, matched.clinical_id]
        );

        // affectedRows >= 0 is always true, so a failed update used to report success
        if (result.affectedRows > 0) {
            res.json({ status: 'success', message: 'Password updated successfully' });
        } else {
            res.json({ status: 'error', message: 'Failed to update password' });
        }
    } catch (err) {
        console.error(err);
        res.json({ status: 'error', message: 'Failed to update password' });
    }
});

module.exports = router;

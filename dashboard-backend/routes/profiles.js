// ---------------------------------------------------------------------------
// Subject (profile) routes — the subset the web dashboard calls.
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

router.post('/update', checkDashboardToken, enforceOwnClinic, async (req, res) => {
    try {
        const login_id = req.body?.login_id || '';
        const profile_id = req.body?.profile_id || '';
        const age = req.body?.age ?? '';
        const height = req.body?.height ?? '';
        const weight = req.body?.weight ?? '';

        if (!login_id || !profile_id || age === '' || height === '' || weight === '') {
            return res.json({ status: 'error', message: 'All fields are required.' });
        }

        // same bounds the dashboard form enforces — never trust the client alone
        const a = Number(age), h = Number(height), w = Number(weight);
        if (!Number.isFinite(a) || a < 1 || a > 120) {
            return res.json({ status: 'error', message: 'Age must be between 1 and 120.' });
        }
        if (!Number.isFinite(h) || h < 50 || h > 250) {
            return res.json({ status: 'error', message: 'Height must be between 50 and 250 cm.' });
        }
        if (!Number.isFinite(w) || w < 2 || w > 300) {
            return res.json({ status: 'error', message: 'Weight must be between 2 and 300 kg.' });
        }

        const [result1] = await pool.query(
            `UPDATE table_clinical_profiles SET age = ?, height = ?, weight = ?
       WHERE clinic_name = ? AND subject_id = ?`,
            [age, height, weight, login_id, profile_id]
        );

        // data_personal_info keeps one row PER EDIT, and every reader joins
        // only the newest row (MAX(id)). Updating every row silently rewrote
        // that whole history, so touch only the newest row.
        const [result2] = await pool.query(
            `UPDATE data_personal_info SET age = ?, height = ?, weight = ?
       WHERE login_id = ? AND profile_id = ?
       ORDER BY id DESC LIMIT 1`,
            [age, height, weight, login_id, profile_id]
        );

        // affectedRows, not changedRows: MySQL reports 0 changed when the saved
        // values equal the stored ones, which made a no-op save look like an error.
        if (result1.affectedRows > 0 || result2.affectedRows > 0) {
            res.json({ status: 'success', message: 'Record(s) updated successfully.' });
        } else {
            res.json({ status: 'error', message: 'No matching record found for this subject.' });
        }
    } catch (err) {
        console.error(err);
        res.json({ status: 'error', message: 'Something went wrong. Please try again.' });
    }
});

router.post('/delete', checkDashboardToken, enforceOwnClinic, async (req, res) => {
    let conn;
    let inTransaction = false;
    try {
        const login_id = req.body?.login_id || '';
        const profile_id = req.body?.profile_id || '';
        const name = req.body?.name || '';

        if (!login_id || !profile_id || !name) {
            return res.json({ status: 'error', message: 'login_id, profile_id, and name are required.' });
        }

        // All four tables or none. Running the deletes separately could leave a
        // half-deleted subject (profile gone, scores still counted) whenever a
        // later statement failed.
        conn = await pool.getConnection();
        await conn.beginTransaction();
        inTransaction = true;

        const [r1] = await conn.query(
            `DELETE FROM table_clinical_profiles WHERE clinic_name = ? AND subject_id = ?`,
            [login_id, profile_id]
        );
        const [r2] = await conn.query(
            `DELETE FROM data_personal_info WHERE login_id = ? AND profile_id = ?`,
            [login_id, profile_id]
        );
        const [r3] = await conn.query(
            `DELETE FROM encryp_clinical_scores_details WHERE login_id = ? AND profile_id = ?`,
            [login_id, profile_id]
        );
        const [r4] = await conn.query(
            `DELETE FROM clinical_scores_details WHERE login_id = ? AND profile_id = ?`,
            [login_id, profile_id]
        );

        await conn.commit();
        inTransaction = false;

        const totalDeleted = r1.affectedRows + r2.affectedRows + r3.affectedRows + r4.affectedRows;
        if (totalDeleted > 0) {
            res.json({ status: 'success', message: `${name} profile has been deleted.` });
        } else {
            res.json({ status: 'error', message: `No matching profile found for ${name}.` });
        }
    } catch (err) {
        if (inTransaction) await conn.rollback().catch(() => {});
        console.error(err);
        res.json({ status: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;

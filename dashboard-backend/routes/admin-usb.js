// ===========================================================================
// Admin: USB access list  (mounted at /admin)
//
//   GET    /admin/usb              the page (admin/usb.{html,css,js})
//   GET    /admin/api/usb          every allowed clinic login id
//   POST   /admin/api/usb          { login_id } -> add one
//   DELETE /admin/api/usb/:id      remove one (id = the login id)
//
// The clinical app hides its "USB cable" test option unless the clinic's
// login id is in `usb_allowed_logins` (old devices with no Bluetooth). The
// app backend only SELECTs from the table; THIS backend owns it and creates
// it on boot, because this database user has DDL and the app Lambda's
// lambda_app user does not.
//
// Access: ADMIN_KEY via lib/admin-common.js, same as the other admin pages.
// Login ids are untrusted text: the page renders them with textContent only.
// ===========================================================================
const express = require('express');
const pool = require('../db');
const { requireAdminKey, readAsset, servePage } = require('../lib/admin-common');

const router = express.Router();

servePage(router, 'usb', readAsset('usb.html'));

pool.query(
    `CREATE TABLE IF NOT EXISTS usb_allowed_logins (
        login_id VARCHAR(100) NOT NULL PRIMARY KEY,
        added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
).catch((e) => console.error('usb_allowed_logins table:', e.message));

// The app's clinic login ids are short codes (e.g. OFFC). '$' is forbidden
// because the app joins login and profile ids with it.
function cleanLoginId(raw) {
    const id = String(raw ?? '').trim();
    if (!id || id.length > 100 || id.includes('$')) return null;
    return id;
}

router.get('/api/usb', requireAdminKey, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT login_id, added_at FROM usb_allowed_logins ORDER BY login_id'
        );
        res.json({ status: 'success', data: rows });
    } catch (err) {
        console.error('admin usb list:', err);
        res.status(500).json({ status: 'error', message: `Could not read the list: ${err.sqlMessage || err.message}` });
    }
});

router.post('/api/usb', requireAdminKey, async (req, res) => {
    const loginId = cleanLoginId(req.body && req.body.login_id);
    if (!loginId) {
        return res.status(400).json({ status: 'error', message: 'Enter a clinic login id (up to 100 characters, no $).' });
    }
    try {
        const [result] = await pool.query(
            'INSERT IGNORE INTO usb_allowed_logins (login_id) VALUES (?)', [loginId]
        );
        const added = result.affectedRows > 0;
        res.json({
            status: 'success',
            added,
            message: added ? `${loginId} can now see the USB option.` : `${loginId} is already on the list.`,
        });
    } catch (err) {
        console.error('admin usb add:', err);
        res.status(500).json({ status: 'error', message: `Could not add it: ${err.sqlMessage || err.message}` });
    }
});

router.delete('/api/usb/:id', requireAdminKey, async (req, res) => {
    const loginId = cleanLoginId(req.params.id);
    if (!loginId) return res.status(400).json({ status: 'error', message: 'Invalid login id.' });
    try {
        const [result] = await pool.query(
            'DELETE FROM usb_allowed_logins WHERE login_id = ?', [loginId]
        );
        if (!result.affectedRows) {
            return res.status(404).json({ status: 'error', message: `${loginId} was not on the list.` });
        }
        res.json({ status: 'success', message: `${loginId} removed — Bluetooth only from their next app start.` });
    } catch (err) {
        console.error('admin usb remove:', err);
        res.status(500).json({ status: 'error', message: `Could not remove it: ${err.sqlMessage || err.message}` });
    }
});

module.exports = router;

// ---------------------------------------------------------------------------
// Login throttling, stored in MySQL.
//
// An in-memory counter is useless on Lambda: each container keeps its own, so
// an attacker spread across containers is barely slowed. Keeping the counter in
// the database makes the limit real regardless of how many instances are warm.
// ---------------------------------------------------------------------------
const pool = require('../db');

const MAX_ATTEMPTS = 8;        // failures allowed inside the window
const WINDOW_MINUTES = 15;     // rolling window / lockout length

pool.query(
    `CREATE TABLE IF NOT EXISTS dashboard_login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attempt_key VARCHAR(255) NOT NULL,
        failures INT NOT NULL DEFAULT 0,
        first_failure DATETIME NOT NULL,
        last_failure DATETIME NOT NULL,
        UNIQUE KEY uq_attempt_key (attempt_key),
        INDEX idx_attempt_last (last_failure)
    )`
).catch((e) => console.error('login_attempts table:', e.message));

// Is this key currently locked out? Never throws — a throttle that errors must
// not become a login outage.
async function isLockedOut(key) {
    try {
        const [rows] = await pool.query(
            `SELECT failures, last_failure FROM dashboard_login_attempts
             WHERE attempt_key = ? AND last_failure > (NOW() - INTERVAL ? MINUTE)`,
            [key, WINDOW_MINUTES]
        );
        return rows.length > 0 && rows[0].failures >= MAX_ATTEMPTS;
    } catch (e) {
        console.error('throttle check failed:', e.message);
        return false;
    }
}

async function recordFailure(key) {
    try {
        await pool.query(
            `INSERT INTO dashboard_login_attempts (attempt_key, failures, first_failure, last_failure)
             VALUES (?, 1, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                failures = IF(last_failure < (NOW() - INTERVAL ? MINUTE), 1, failures + 1),
                first_failure = IF(last_failure < (NOW() - INTERVAL ? MINUTE), NOW(), first_failure),
                last_failure = NOW()`,
            [key, WINDOW_MINUTES, WINDOW_MINUTES]
        );
    } catch (e) {
        console.error('throttle record failed:', e.message);
    }
}

async function clearFailures(key) {
    try {
        await pool.query(`DELETE FROM dashboard_login_attempts WHERE attempt_key = ?`, [key]);
    } catch (e) {
        console.error('throttle clear failed:', e.message);
    }
}

module.exports = { isLockedOut, recordFailure, clearFailures, MAX_ATTEMPTS, WINDOW_MINUTES };

// ---------------------------------------------------------------------------
// Shared helpers used across the route modules.
//
// These were originally defined inline in server.js. They are pulled out here so
// each domain router (routes/*.js) can import exactly what it needs without
// depending on server.js, which now only wires middleware and mounts routers.
// ---------------------------------------------------------------------------

// Formats a Date as PHP's date("d-m-Y h:i a") in India time, e.g. "24-08-2026 03:45 pm"
function formatDateIST(d) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    }).formatToParts(d);
    const get = t => parts.find(p => p.type === t).value;
    return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')} ${get('dayPeriod').toLowerCase()}`;
}

// Formats a Date as MySQL's "YYYY-MM-DD HH:MM:SS" (PHP's date('Y-m-d H:i:s')), India time
function formatDateSQL(d) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(d);
    const get = t => parts.find(p => p.type === t).value;
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

// Absolute URL the app should call to fetch a ticket's image bytes. Defaults to
// the legacy PHP endpoint so nothing breaks mid-migration; once this backend is
// the source of truth, set PUBLIC_BASE_URL to its own URL and these links point
// at the new GET /api/support/image route instead of back at the old server.
const IMAGE_BASE_URL = process.env.PUBLIC_BASE_URL
    ? `${process.env.PUBLIC_BASE_URL.replace(/\/+$/, '')}/api/support/image`
    : 'https://humorstech.com/humors_app/app_final/clinical/api/fetch/get_issue_image.php';

module.exports = { formatDateIST, formatDateSQL, IMAGE_BASE_URL };

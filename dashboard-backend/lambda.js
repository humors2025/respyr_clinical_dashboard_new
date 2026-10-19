// AWS Lambda entry point for the DASHBOARD backend — its own function, its own
// Function URL, deployed independently of the app backend.
const serverlessExpress = require('@codegenie/serverless-express');
const app = require('./server');
const pool = require('./db');

const handler = serverlessExpress({
    app,
    // 'multipart/form-data' matters for /api/dashboard/send-report-email: the
    // report PDF arrives as an upload, and without it the body is handed to
    // Express as a UTF-8 string, which corrupts the attachment bytes.
    binarySettings: {
        contentTypes: [
            'image/*',
            'application/octet-stream',
            'application/pdf',
            'multipart/form-data',
        ],
    },
    logSettings: { level: process.env.LOG_LEVEL || 'error' },
});

exports.handler = async (event, context) => {
    // Return as soon as the response is written; the pooled MySQL sockets are
    // kept alive deliberately between invocations.
    context.callbackWaitsForEmptyEventLoop = false;
    return handler(event, context);
};

process.on('SIGTERM', async () => {
    try { await pool.end(); } catch (err) { console.error('Error closing MySQL pool:', err); }
    process.exit(0);
});

const mysql = require('mysql2/promise');

// ---------------------------------------------------------------------------
// Connection pool, tuned for AWS Lambda.
//
// This module is evaluated ONCE per Lambda execution environment (container),
// not once per request, so the pool survives between warm invocations and we
// avoid paying the TCP + TLS + MySQL handshake on every call.
//
// connectionLimit is deliberately tiny: a Lambda container serves exactly one
// request at a time, so one connection is all a container can ever use. With
// N concurrent Lambdas you would otherwise open N x 10 sockets and blow past
// RDS's max_connections. Keep this at 1-2 and let concurrency scale by adding
// containers, not connections.
// ---------------------------------------------------------------------------

const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'respyrpartnersbb',

    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_SIZE || (isLambda ? '2' : '10'), 10),
    queueLimit: 0,

    // Fail fast instead of letting Lambda burn its whole timeout on a socket
    // that will never connect (wrong security group is the classic cause).
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '10000', 10),

    // Keep idle sockets alive between warm invocations so the next request
    // reuses them rather than reconnecting.
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,

    // Recycle connections before RDS's idle timeout can silently kill them.
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '60000', 10),

    timezone: process.env.DB_TIMEZONE || 'Z',
    dateStrings: true,
};

// TLS mode. DB_SSL:
//   'rds' (default) - verify against Amazon's RDS certificate authority
//   'proxy'         - same, for connections through RDS Proxy
//   'no-verify'     - ENCRYPT the connection but do not verify the certificate.
//                     Use for self-managed MySQL (e.g. on EC2), which presents a
//                     self-signed cert that no public CA will ever validate.
//                     Stops passive sniffing of patient data on the wire; does
//                     not defend against an active man-in-the-middle.
//   'false' / 'off' - no TLS at all. Traffic is plaintext.
const sslMode = (process.env.DB_SSL || 'rds').toLowerCase();
if (sslMode === 'no-verify' || sslMode === 'noverify' || sslMode === 'insecure') {
    config.ssl = { rejectUnauthorized: false };
} else if (sslMode !== 'false' && sslMode !== 'off') {
    const awsCa = require('aws-ssl-profiles');
    config.ssl = {
        rejectUnauthorized: true,
        ca: sslMode === 'proxy' ? awsCa.proxyBundle.ca : awsCa.ca,
    };
}

const pool = mysql.createPool(config);

// ---------------------------------------------------------------------------
// Readable connection errors.
//
// When Node cannot reach the host it throws an AggregateError whose .message is
// an EMPTY STRING -- the real causes sit in .errors[]. Every route in server.js
// reports failures as `err.message`, so a misconfigured security group, subnet,
// or DB_HOST surfaces to the app as {"status":"error","message":""} with nothing
// to act on. That is the single most common Lambda-to-RDS misconfiguration, so
// we rewrite those errors into something that names the actual cause.
// ---------------------------------------------------------------------------
function describe(err) {
    if (err && err.message === '' && Array.isArray(err.errors) && err.errors.length) {
        const inner = err.errors[0];
        err.message = `Cannot reach MySQL at ${config.host}:${config.port} (${inner.code}). `
            + 'Check DB_HOST, the Lambda VPC subnets, and that the RDS security group '
            + "allows inbound 3306 from the Lambda's security group.";
    } else if (err && err.code === 'ETIMEDOUT') {
        err.message = `Timed out connecting to MySQL at ${config.host}:${config.port}. `
            + 'This is almost always a VPC/security-group issue rather than a credentials issue.';
    }
    return err;
}

const wrap = (fn, ctx) => async (...args) => {
    try {
        return await fn.apply(ctx, args);
    } catch (err) {
        throw describe(err);
    }
};

pool.query = wrap(pool.query, pool);
pool.execute = wrap(pool.execute, pool);
pool.getConnection = wrap(pool.getConnection, pool);

module.exports = pool;

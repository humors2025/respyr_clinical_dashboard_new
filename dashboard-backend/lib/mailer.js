// ---------------------------------------------------------------------------
// Outgoing mail for the dashboard.
//
// This is the Node port of clinical-dashboard_v2/report/send_email1.php, which
// was the last piece of PHP backend logic in the product. Same mailbox, same
// SMTP host, same message — only the runtime changed, so there is no DNS, SPF
// or DKIM work attached to this move.
//
// NOTE ON NETWORKING: unlike every other module here, this one talks to the
// public internet (smtp.zoho.in:465) rather than to MySQL. A Lambda attached to
// a VPC has no route out unless its subnets go through a NAT gateway — see the
// networking note in DEPLOY-LAMBDA.md.
// ---------------------------------------------------------------------------
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.RESPYR_SMTP_HOST || 'smtp.zoho.in';
const SMTP_PORT = Number(process.env.RESPYR_SMTP_PORT || 465);
const SMTP_USER = process.env.RESPYR_SMTP_USER || 'connect@humorstech.com';
const SMTP_PASS = process.env.RESPYR_SMTP_PASS || '';

// The PHP version carried the password as a source-code fallback. Keeping that
// habit would put the credential in the deployment zip, so there is no fallback
// here: on Lambda the env var is required, and locally mail simply reports that
// it is not configured instead of failing deep inside the SMTP handshake.
if (process.env.AWS_LAMBDA_FUNCTION_NAME && !SMTP_PASS) {
    throw new Error('RESPYR_SMTP_PASS must be set in the Lambda environment');
}

// One transport for the whole container. `pool: true` lets a warm Lambda reuse
// the authenticated connection across invocations instead of re-handshaking
// TLS for every report, which is most of the latency of a send.
let transport = null;
function getTransport() {
    if (!transport) {
        transport = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,   // SMTPS on 465, STARTTLS on 587
            auth: { user: SMTP_USER, pass: SMTP_PASS },
            pool: true,
            maxConnections: 2,
            connectionTimeout: 15000,
            greetingTimeout: 15000,
        });
    }
    return transport;
}

function isConfigured() {
    return Boolean(SMTP_PASS);
}

// Kept byte-for-byte in line with the PHP template so the mail subjects and
// bodies already in clinics' inboxes do not suddenly look different.
function reportBodyHtml(name) {
    const safeName = String(name || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8" />
        <title>Respyr Health Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
    </head>
    <body style="margin:0; padding:0; background:#f2f4f6; font-family:'Poppins', sans-serif;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 0 15px rgba(0,0,0,0.1); font-family:'Poppins', sans-serif;">
        <div style="padding:30px 20px; text-align:center;">
          <img src="https://respyr.in/assetsnew/img/logo/logo.svg" alt="Respyr Logo" style="max-width:160px;" />
          <h1 style="color:#1a73e8; font-size:24px; margin-top:20px; margin-bottom:0;">Your Health Report is Ready!</h1>
        </div>
        <div style="padding:30px 25px; color:#333333;">
          <p style="font-size:16px; margin-bottom:20px;">Hi <span style="font-weight:600; color:#1a73e8;"> ${safeName}  </span>,</p>
          <p style="font-size:16px; line-height:1.6; margin-bottom:20px;">
            Your latest health screening report powered by <strong>Respyr</strong> is now available and attached to this email.
          </p>
          <div style="background:#f1f6ff; border-left:4px solid #1a73e8; padding:15px 20px; border-radius:6px; margin-bottom:25px;">
            <p style="margin:0; font-size:16px; font-weight:600;">What&rsquo;s Inside?</p>
            <ul style="margin:10px 0 0 20px; padding:0; font-size:15px;">
              <li>Sugar, liver, gut &amp; respiratory analysis</li>
            </ul>
          </div>
          <p style="font-size:16px; line-height:1.6; margin-bottom:25px;">
             If you have any questions, feel free to reply to this email.
          </p>
          <p style="font-size:16px; margin-bottom:0;">Stay healthy,</p>
          <p style="font-size:16px; font-weight:600; margin-top:5px;">&mdash; Team Respyr</p>
        </div>
        <div style="padding:25px 20px; background:#f9f9f9; text-align:center; font-size:13px; color:#888888;">
          <p style="margin:5px 0;">&copy; 2025 Respyr. All rights reserved.</p>
          <p style="margin:5px 0;">
            <a href="https://respyr.in" style="color:#1a73e8; text-decoration:none;">www.respyr.in</a> |
            <a href="https://respyr.in/terms-conditions/" style="color:#1a73e8; text-decoration:none;">Terms</a> |
            <a href="https://respyr.in/privacy_policy/" style="color:#1a73e8; text-decoration:none;">Privacy</a>
          </p>
          <div style="margin-top:10px;">
            <a href="https://www.instagram.com/respyr.in/?igsh=MTJzdGhpbmVtMHNwNg%3D%3D" style="margin:0 8px; text-decoration:none;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" style="width:22px; height:22px;" />
            </a>
            <a href="https://www.linkedin.com/company/103016113/admin/page-posts/published/" style="margin:0 8px; text-decoration:none;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" style="width:22px; height:22px;" />
            </a>
            <a href="https://www.youtube.com/@respyr" style="margin:0 8px; text-decoration:none;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" alt="YouTube" style="height:22px;" />
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
}

// Sends the screening report. `pdf` is the raw bytes, not a path: on Lambda the
// upload only ever exists in memory, there being no writable disk to stage it on.
async function sendReportEmail({ to, name, brandName, pdf }) {
    await getTransport().sendMail({
        from: { name: brandName || 'Humors Tech', address: SMTP_USER },
        to,
        subject: 'Your Respyr Health Report',
        html: reportBodyHtml(name),
        attachments: [{ filename: 'Health_Report.pdf', content: pdf, contentType: 'application/pdf' }],
    });
}

module.exports = { sendReportEmail, isConfigured, SMTP_HOST, SMTP_PORT, SMTP_USER };

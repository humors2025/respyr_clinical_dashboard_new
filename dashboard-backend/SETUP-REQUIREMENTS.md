# Respyr Dashboard Backend — what we need to deploy it

This is the Node.js backend for the Respyr Clinical **web dashboard**. It replaces
every PHP backend file the dashboard used (the old `api/*.php`, and the report
email sender). It is a **separate service from the mobile app's backend** — they
share only the MySQL database and must stay on separate Lambda functions with
separate secrets.

Full step-by-step runbook: **`DEPLOY-LAMBDA.md`** (included in the zip and
alongside this file). This page is the summary: the Lambda settings, the
environment variables, and the four things we need answered or done by whoever
administers the server.

---

## Lambda settings

| Setting | Value |
|---|---|
| Function name | `respyr-dashboard-backend` |
| Region | `ap-south-1` (Mumbai) |
| Runtime | `nodejs20.x` |
| Handler | `lambda.handler` |
| Timeout | 30 s |
| Memory | 512 MB |
| Function URL | Auth type **NONE**, CORS **left unticked** (the app sends its own CORS headers — enabling it here double-sends them and browsers reject that) |

The zip is deploy-ready: upload it as-is (code files + `node_modules`, no
wrapping folder). `npm audit` is clean as of 19 Oct 2026.

---

## Environment variables

Set these on the Lambda (Configuration → Environment variables). The function
**refuses to boot** if either of the two secrets is missing — that is
deliberate, so no secret ever lives in the source code.

| Variable | Value | Required |
|---|---|---|
| `DASHBOARD_JWT_SECRET` | 64-hex random string — generate with the command below. Must NOT be reused from the app backend. | **Yes** |
| `RESPYR_SMTP_PASS` | the (rotated — see below) password of `connect@humorstech.com` at Zoho | **Yes** |
| `DASHBOARD_ORIGIN` | the exact origin the dashboard is served from, e.g. `https://portal.respyr.in` — scheme + host, no trailing slash, no path | **Yes** |
| `DB_HOST` | MySQL hostname reachable **from Lambda** (see question 1) | **Yes** |
| `DB_PORT` | `3306` | Yes |
| `DB_USER` | a dedicated MySQL user (see question 2 — not `root`) | **Yes** |
| `DB_PASSWORD` | that user's password | **Yes** |
| `DB_NAME` | `respyrpartnersbb` | **Yes** |
| `DB_SSL` | `rds` for RDS · `no-verify` for self-managed MySQL with a self-signed cert · never `off` in production | Recommended |
| `RESPYR_SMTP_USER` | defaults to `connect@humorstech.com` | Optional |
| `RESPYR_SMTP_HOST` / `RESPYR_SMTP_PORT` | default `smtp.zoho.in` / `465` | Optional |
| `LOG_LEVEL` | `error` | Optional |

Generate the JWT secret (PowerShell, Node, or any machine with Node installed):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Four things we need from the server admin

### 1. How can Lambda reach MySQL? *(blocking — nothing deploys without this)*

Every old PHP file connected with `mysqli_connect('localhost', ...)`, i.e. MySQL
runs **on the same machine as the PHP website**. A Lambda is not on that machine,
so one of the following has to be true before this backend can run:

| Option | Trade-off |
|---|---|
| The MySQL on that box gets a network-reachable endpoint (bind address + firewall allow on 3306) | Quickest; exposes the DB port, so restrict by source and use a scoped user + TLS |
| The data moves to RDS (ap-south-1) | The clean long-term answer; ~₹1,500+/month and a migration |
| The Lambda joins that machine's VPC (only possible if it is an EC2 you control) | Free, **but** a Lambda inside a VPC has no internet route, and this service sends the report email to `smtp.zoho.in` — that then needs a NAT gateway (~₹2,700/month) or a switch to Amazon SES |

Please tell us which situation applies: **is the MySQL host an EC2 instance in a
VPC, or shared hosting?** That answer picks the path.

### 2. A dedicated MySQL user — please do not give Lambda `root`

The old PHP connected as `root`. This service needs only:

```sql
CREATE USER 'respyr_dash'@'%' IDENTIFIED BY '<strong password>';
GRANT SELECT, INSERT, UPDATE, DELETE ON respyrpartnersbb.* TO 'respyr_dash'@'%';
-- it also creates two small tables of its own on first boot
GRANT CREATE ON respyrpartnersbb.* TO 'respyr_dash'@'%';
```

(Read/write on `respyrpartnersbb` only. It never touches other schemas.)

### 3. Rotate the Zoho mailbox password

The current password of `connect@humorstech.com` sat in PHP source code
(`send_email1.php`) in every copy of the project, so treat it as public.
Change it in the Zoho admin console, then use the new value for
`RESPYR_SMTP_PASS`. The old PHP mailer is retired, so nothing else needs it.

*Note: outbound SMTP is blocked on our office network, so the mailbox
credentials could not be test-authenticated from here. The first "Send pdf"
from the deployed Lambda is the real test — please try it during verification.*

### 4. Confirm the dashboard's production origin

Whatever domain serves the PHP pages (e.g. `https://portal.respyr.in`) is the
value for `DASHBOARD_ORIGIN`, and the Function URL from the deploy gets written
into 5 frontend files (7 places) — the exact list is Step 10 of
`DEPLOY-LAMBDA.md`.

---

## Smoke tests after deploy (no frontend needed)

```bash
curl https://<function-url>/ping
# {"status":"success","service":"dashboard-backend"}

curl -X POST https://<function-url>/api/dashboard/login \
  -H "Content-Type: application/json" \
  -d '{"login_id":"OFFC","password":"definitely-wrong"}'
# {"status":"error","message":"Invalid username or password"}  <- proves DB works

curl -i -X POST https://<function-url>/api/dashboard/send-report-email
# HTTP 401 {"status":"error","message":"Missing token"}        <- mail route deployed
```

A timeout on the second call = Lambda cannot reach MySQL (question 1).

---

## Already done / verified on our side

- All 19 endpoints the dashboard frontend calls exist and respond
- Report email ported from PHP to Node (same Zoho mailbox, same message);
  9-case test suite passes, including auth, upload limits, and token scoping
- Clinic logos on reports now come from this backend, not the old server
- **No live page calls humorstech.com any more** — once this is deployed, the
  old PHP API server is not a runtime dependency for the dashboard
- `npm audit`: 0 vulnerabilities

Not yet verified (needs production): Zoho SMTP login, and the report logo
against a real clinic row.

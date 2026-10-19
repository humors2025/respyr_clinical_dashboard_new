# Deploying the dashboard backend to AWS Lambda

Step-by-step setup for `respyr-dashboard-backend` as its **own** Lambda function
with its **own** Function URL.

> **This is not the app backend.** `D:\Clinical\function` serves the Flutter app
> and is already deployed at
> `https://ruewg5tlnwxpe4k43u77aeg4ka0qiqwj.lambda-url.ap-south-1.on.aws/`.
> Do not deploy this code over that function, and do not reuse that URL. The two
> services share only the MySQL database. Keeping them apart is the whole point:
> a dashboard change can then never break the installed mobile app.

---

## Before you start

### Things you need

- An AWS account with permission to create Lambda functions and IAM roles
- The region: **ap-south-1 (Mumbai)** — same as the app backend and the database
- Node.js 20 installed locally (this guide was written against v20.17.0)
- The production MySQL host, port, database name, user and password

### One decision to make first: where does MySQL live?

This determines whether the Lambda needs VPC configuration, and it is the single
most common thing to get wrong.

| Your database | What to do |
|---|---|
| **RDS inside a VPC** (not publicly accessible) | The Lambda must be attached to the **same VPC**, to **private subnets**, with a security group allowed inbound on 3306 by the RDS security group. See Step 6. |
| **MySQL on EC2 or RDS with a public endpoint** | No VPC configuration needed. Leave the Lambda outside a VPC — it is simpler and avoids needing a NAT gateway. |

> **This decision now also affects email.** Since the report mail moved out of
> PHP and into this service, the function makes one outbound call to the public
> internet (`smtp.zoho.in:465`). A Lambda **outside** a VPC has that already. A
> Lambda **inside** a VPC does not, and needs either a NAT gateway (around
> ₹2,700/month) or a switch to Amazon SES, which can be reached privately
> through a VPC endpoint at no such cost. Everything else here works either way
> — only "Send pdf" depends on it.

If you are not sure, ask whoever set up the database. Guessing here produces a
Lambda that times out on every request with no useful error.

`db.js` already rewrites the two classic failures into readable messages, so if
you get this wrong the response will tell you:

```
Cannot reach MySQL at <host>:3306 (ETIMEDOUT). Check DB_HOST, the Lambda VPC
subnets, and that the RDS security group allows inbound 3306 from the Lambda's
security group.
```

---

## Step 1 — Generate a production JWT secret

The secret in `auth.js` is a **local development fallback only**. It is visible
in the source, so it must never be the production value.

Generate a new one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the output somewhere safe — you will need it twice: once for the Lambda
environment, once for the PHP web server (Step 10).

Two things to know about this secret:

- The service **refuses to boot on Lambda** if `DASHBOARD_JWT_SECRET` is unset.
  That is deliberate, so it can never silently sign tokens with the public
  development value.
- Changing it later **logs out every dashboard user**. Existing tokens stop
  verifying. Pick it once and keep it.

---

## Step 2 — Build the deployment zip

From a clean copy of the backend, install production dependencies only:

```bash
cd D:\Clinical\dashboard-backend
npm install --omit=dev
```

Then zip the folder **contents** — not the folder itself. `lambda.js` must sit at
the root of the zip, otherwise the handler will not be found.

PowerShell (`tar` is built into Windows 10+):

```powershell
cd D:\Clinical\dashboard-backend
tar -a -cf ..\dashboard-backend.zip *
```

> **Do not use `Compress-Archive`** from Windows PowerShell 5.1 for this. It
> writes zip entries with backslash separators (`routes\dashboard.js`), which
> breaks the zip spec — Lambda's unzip then treats each entry as one flat
> filename instead of a folder path, and the function dies on boot with
> `Cannot find module`. `tar`, 7-Zip, and PowerShell 7's `Compress-Archive`
> all produce correct zips.
>
> Run the `tar` command from **PowerShell or cmd**, not Git Bash — in Git Bash,
> `tar` is GNU tar, which cannot write zip files; the one built into Windows
> (`C:\Windows\System32\tar.exe`) is what you want, and PowerShell finds it
> automatically.

The zip must contain, at its top level:

```
lambda.js   server.js   auth.js   db.js   package.json   routes/   lib/   node_modules/
```

`node_modules` is about 8.6 MB, so the whole zip stays well under Lambda's 50 MB
direct-upload limit. `local.js` is harmless to include — Lambda never runs it.

---

## Step 3 — Create the function

AWS Console → Lambda → **Create function** → *Author from scratch*.

| Field | Value |
|---|---|
| Function name | `respyr-dashboard-backend` |
| Runtime | **Node.js 20.x** |
| Architecture | `x86_64` (or `arm64` — slightly cheaper, both work) |
| Execution role | Create a new role with basic Lambda permissions |

Create it, then **Upload from → .zip file** and select `dashboard-backend.zip`.

---

## Step 4 — Set the handler

Configuration → General configuration → Edit → **Handler**:

```
lambda.handler
```

This means "the `handler` export in `lambda.js`". If it is left at the default
`index.handler` the function fails with a module-not-found error.

---

## Step 5 — Set timeout and memory

Same screen:

| Setting | Value | Why |
|---|---|---|
| Timeout | **30 seconds** | The default 3s is far too short. `db.js` alone allows 10s just to connect. |
| Memory | **512 MB** | Comfortable for this workload. More memory also means more CPU, so this is often *cheaper* than 256 MB because requests finish sooner. |

---

## Step 6 — VPC (only if your MySQL is private)

Skip this entirely if the database has a public endpoint.

Configuration → VPC → Edit:

- **VPC**: the one the database is in
- **Subnets**: the *private* subnets
- **Security group**: one that the database's security group allows inbound on
  port 3306

Then add the **`AWSLambdaVPCAccessExecutionRole`** managed policy to the
function's execution role, or it will fail to create network interfaces.

> A Lambda inside a VPC has **no internet access** unless the subnets route
> through a NAT gateway. That now matters: alongside MySQL this service also
> sends the report email over SMTP, which is an internet call. Without a NAT
> gateway every other endpoint works and only "Send pdf" fails, timing out
> after 15 seconds. See the note under "where does MySQL live?" above for the
> two ways round it.

---

## Step 7 — Environment variables

Configuration → Environment variables. These are read by `auth.js`, `server.js`
and `db.js`.

| Variable | Value | Required |
|---|---|---|
| `DASHBOARD_JWT_SECRET` | the secret from Step 1 | **Yes** — the function throws on boot without it |
| `DASHBOARD_ORIGIN` | the dashboard's origin, e.g. `https://portal.respyr.in` | **Yes** in production — otherwise CORS falls back to `*` |
| `DB_HOST` | MySQL hostname | **Yes** |
| `DB_PORT` | `3306` | Yes |
| `DB_USER` | MySQL user | **Yes** |
| `DB_PASSWORD` | MySQL password | **Yes** |
| `DB_NAME` | `respyrpartnersbb` | **Yes** |
| `DB_SSL` | see below | Recommended |
| `RESPYR_SMTP_PASS` | the mailbox password | **Yes** — the function throws on boot without it |
| `RESPYR_SMTP_USER` | `connect@humorstech.com` | Optional — this is the default |
| `RESPYR_SMTP_HOST` | `smtp.zoho.in` | Optional — this is the default |
| `RESPYR_SMTP_PORT` | `465` | Optional — this is the default. Use `587` if 465 is blocked; the code switches to STARTTLS on its own |
| `LOG_LEVEL` | `error` | Optional |

### `DB_SSL`

| Value | Use when |
|---|---|
| `rds` (default) | RDS — verifies against Amazon's certificate authority |
| `proxy` | connecting through RDS Proxy |
| `no-verify` | self-managed MySQL on EC2 with a self-signed certificate. Encrypts the traffic but does not stop an active man-in-the-middle |
| `off` | no encryption at all — **subject data travels in plaintext.** Do not use in production |

`DASHBOARD_ORIGIN` must be the **exact** origin — scheme and host, no trailing
slash and no path. `https://portal.respyr.in` is right; `https://portal.respyr.in/`
and `portal.respyr.in` are not.

---

## Step 8 — Create the Function URL

Configuration → Function URL → **Create function URL**.

| Setting | Value |
|---|---|
| Auth type | **NONE** |
| Configure cross-origin resource sharing (CORS) | **Leave unticked** |

Two things worth understanding here:

**Why auth type NONE.** The dashboard calls this from the browser, where there
are no AWS credentials to sign with. Authentication is the dashboard's own JWT.
Router-level middleware at the top of `routes/dashboard.js` verifies the token
on every request *and* checks that every clinic identifier in it — `login_id`
and `clinic_name`, in both the body and the query string — matches the token's
own clinic, so one clinic cannot read another's data.

Four paths are reachable without a token, all necessarily so:

| Path | Why it must be open |
|---|---|
| `/ping` | health check |
| `/api/dashboard/login` | rate limited to 8 failures per 15 minutes |
| `/api/dashboard/forgot-password/send` · `/verify` · `/reset` | you cannot hold a token if you have forgotten your password |

`/api/clinic/*` and `/api/profiles/*` require a token on every route with no
exceptions.

**Why CORS must stay unticked.** `server.js` already sends the CORS headers from
`DASHBOARD_ORIGIN`. If you also enable CORS on the Function URL, every response
carries **two** `Access-Control-Allow-Origin` headers, and browsers reject that
outright — the dashboard would fail with a CORS error that looks like a code bug
but is purely configuration.

Copy the URL it gives you. It looks like:

```
https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx.lambda-url.ap-south-1.on.aws/
```

---

## Step 9 — Smoke-test the backend before touching the website

```bash
curl https://<your-new-url>/ping
```

Expected:

```json
{"status":"success","service":"dashboard-backend"}
```

If that works, test the database path — a login with deliberately wrong
credentials. You want to see a clean rejection, which proves it reached MySQL:

```bash
curl -X POST https://<your-new-url>/api/dashboard/login \
  -H "Content-Type: application/json" \
  -d "{\"login_id\":\"OFFC\",\"password\":\"definitely-wrong\"}"
```

Expected:

```json
{"status":"error","message":"Invalid username or password"}
```

A timeout here instead means the database is unreachable — go back to Step 6.

Finally check the mail route exists and is guarded. With no token it must
refuse, which proves the route is deployed without sending anything:

```bash
curl -i -X POST https://<your-new-url>/api/dashboard/send-report-email
```

Expected — a `401` with:

```json
{"status":"error","message":"Missing token"}
```

A `404` here means the zip predates the mail route; rebuild it (Step 2).

> The first request after deployment creates the `dashboard_login_attempts`
> table automatically. The MySQL user therefore needs **CREATE** privilege. If
> it does not have it, the function still works but login throttling silently
> does nothing, and you will see `login_attempts table: ...` in CloudWatch.

---

## Step 10 — Point the website at the new URL

Five files hold the URL, in seven places. All paths are relative to
`clinical-required/`.

**1. `clinical-dashboard_v2/head.php`** — lines 7–8. This one feeds
`window.NODE_API`, which most dashboard pages use:

```php
// window.NODE_API = "http://localhost:3001";          // local testing
window.NODE_API = "https://<your-new-url>";
```

**2. `clinical-dashboard_v2/report/user_report.php`** — **three** hardcoded
fallbacks inside fetches, around lines 1495, 1781 and 1840. This page does not
include `head.php`, so it carries its own fallback at each call:

```js
`${window.NODE_API || "https://<your-new-url>"}/api/clinic/logos`
`${window.NODE_API || "https://<your-new-url>"}/api/dashboard/send-report-email`
`${window.NODE_API || "https://<your-new-url>"}/api/dashboard/trend-7-days?...`
```

> Miss the first one and the report still renders — it just loses the clinic
> logo, because the fetch fails and the slot hides itself.

**3. `clinical-v2/login-port/index.html`** — line 279
**4. `clinical-v2/login-port/forgot-password/index.php`** — line 179
**5. `clinical-v2/login-port/change-password/index.php`** — line 216

Each of the last three has its own constant:

```js
const NODE_API = "https://<your-new-url>";
```

The login-port files need their own copy because they run **before** login, so
`head.php` has not been included yet.

> `view-profile.php` does **not** need changing — it reads `window.NODE_API`
> from `head.php`. (An older note in `README.md` mentions a `$NODE_API` variable
> there; that is out of date, the file no longer has one.)

---

## Step 11 — Rotate the SMTP password

**Nothing goes on the web server.** There is no PHP backend any more: the report
mail used to be sent by `clinical-dashboard_v2/report/send_email1.php`, which has
been ported to this service and moved to `_unused/report/`. PHP now serves only
HTML pages, so the only place that needs configuring is Lambda, in Step 7.

What is left here is a credential to replace. `send_email1.php` carried the
mailbox password as a source-code fallback:

```php
$mail->Password = getenv('RESPYR_SMTP_PASS') ?: '<the real mailbox password>';
```

That means the real password has travelled with every copy and zip of the
project, so treat it as public:

1. Change the password on the `connect@humorstech.com` mailbox at Zoho
2. Set `RESPYR_SMTP_PASS` on the Lambda to the new value (Step 7)

The Node version has **no fallback** — `lib/mailer.js` throws on boot if
`RESPYR_SMTP_PASS` is missing, so the credential cannot drift back into source.

> Zoho's SMTP is kept exactly as it was: same mailbox, same host, same message
> body. Only the runtime changed, so there is no DNS, SPF or DKIM work attached
> to this step.

---

## Step 12 — Verify end to end

In a browser, not with curl, so CORS is genuinely exercised:

1. Open the dashboard and log in as a real clinic
2. Check the dashboard loads counts and the trend chart
3. Open **Test history** — search and paging
4. Open **Subjects** — search, and the edit dialog
5. Open a **profile**, try `1W` / `1M` / `3M` and the **Older** month picker
6. Open a **report**, then **Download pdf** and **Send pdf**
7. Open the browser console (F12) and confirm there are **no CORS errors**

A CORS error at this point almost always means either `DASHBOARD_ORIGIN` does
not exactly match the site's origin, or CORS got enabled on the Function URL in
Step 8.

---

## Rolling back

Lambda keeps every uploaded version. To go back, upload the previous zip, or
publish versions and point an alias at the last good one.

Faster, if the dashboard is broken but the old local setup still works: revert
the five files in Step 10. The frontend is the only thing that knows the URL, so
reverting those immediately stops traffic to the new function.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `Cannot find module 'lambda'` | Handler is not `lambda.handler`, or the zip has a wrapping folder (Step 2/4) |
| `DASHBOARD_JWT_SECRET must be set in the Lambda environment` | Step 7 — this one is intentional |
| Every request times out after 30s | Database unreachable: VPC, subnets or security group (Step 6) |
| `{"status":"error","message":""}` | An older build. Current `db.js` rewrites these into readable messages |
| CORS error in the browser console | `DASHBOARD_ORIGIN` mismatch, or CORS enabled on the Function URL (Step 8) |
| Login always fails with correct credentials | Wrong `DB_NAME`, or pointing at a database without the clinic rows |
| Everything works except "Send pdf", times out after ~15s | The Lambda is in a VPC with no NAT gateway, so it cannot reach `smtp.zoho.in` (Step 6) |
| "Send pdf" returns *Email is not configured on the server* | `RESPYR_SMTP_PASS` not set (Step 7) |
| "Send pdf" returns *The report was too large to email* | The PDF exceeded 5 MB. A Function URL rejects bodies over ~6 MB, so the cap is deliberate |
| Dashboard works, app breaks | You deployed this over the app's Lambda. They are separate functions |

Logs are in CloudWatch under `/aws/lambda/respyr-dashboard-backend`.

---

## Quick reference

```
Function name   respyr-dashboard-backend
Region          ap-south-1
Runtime         nodejs20.x
Handler         lambda.handler
Timeout         30s
Memory          512 MB
Function URL    auth NONE, CORS unticked

Env:  DASHBOARD_JWT_SECRET  DASHBOARD_ORIGIN
      DB_HOST  DB_PORT  DB_USER  DB_PASSWORD  DB_NAME  DB_SSL
      RESPYR_SMTP_PASS
```

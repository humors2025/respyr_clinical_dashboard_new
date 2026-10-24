# Deploy the dashboard backend — Lambda + MySQL on EC2

```
Browser ──► Function URL ──► Lambda (inside the EC2's VPC) ──► EC2 private IP :3306 ──► MySQL
```

- **No PHP is used anywhere.** The backend talks only to the MySQL on your EC2.
- **The database stays private.** Port 3306 is opened only to the Lambda's
  security group, never to the internet.
- **Forgot-password is switched off** for now. The page shows "Password reset
  is not available yet". To reset a clinic's password by hand, see the end of
  this file.
- **"Send pdf" is off** until a NAT gateway is added, because a Lambda inside a
  VPC cannot reach the internet (the Zoho mail server). Everything else works.
  The last section shows how to turn it on later.

Do the parts in order: **A** (EC2 / MySQL) → **B** (security groups) →
**C** (Lambda) → **D** (test) → **E** (point the dashboard at it).

Write these down as you go:

| Value | Where you get it | Example |
|---|---|---|
| EC2 private IP | EC2 console → instance → *Private IPv4 address* | `172.31.12.34` |
| EC2 VPC | EC2 console → instance → *VPC ID* | `vpc-0abc…` |
| MySQL user password | you choose it in A2 | long random string |
| `DB_SSL` value | A4 | `no-verify` or `off` |
| JWT secret | C5 | 64 hex characters |
| Function URL | C6 | `https://xxxx.lambda-url.ap-south-1.on.aws/` |

---

## Part A — Prepare MySQL on the EC2

SSH into the EC2, then open MySQL as an admin: `sudo mysql` (or
`mysql -u root -p`).

### A1. Check that the copied database is complete

```sql
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'respyrpartnersbb'
  AND table_name IN ('table_clinics', 'clinical_scores_details', 'data_personal_info',
                     'table_clinical_profiles', 'test_allow', 'encryp_clinical_scores_details');
```

You must see **all 6 tables**. If the database has a different name, use that
name everywhere below and in `DB_NAME`.

Check that the clinic passwords came across as bcrypt hashes:

```sql
SELECT clinic_name, LEFT(password, 4) AS hash_start FROM respyrpartnersbb.table_clinics LIMIT 5;
```

`hash_start` should be `$2y$` or `$2b$`. These are the same hashes PHP made, and
the Node backend accepts them, so every clinic keeps its current password.

### A2. Create a MySQL user for the Lambda (not root)

```sql
CREATE USER 'respyr_dash'@'%' IDENTIFIED BY 'CHOOSE-A-LONG-RANDOM-PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE ON respyrpartnersbb.* TO 'respyr_dash'@'%';
FLUSH PRIVILEGES;
```

`'%'` is safe here: the security group in Part B lets only the Lambda reach
port 3306. `CREATE` is needed once, because on first start the backend creates
its own small `dashboard_login_attempts` table (login rate limiting).

### A3. Let MySQL accept connections from the VPC

Out of the box MySQL often listens only on `127.0.0.1`. Find the setting:

```bash
sudo grep -rn "bind-address" /etc/mysql/ /etc/my.cnf /etc/my.cnf.d/ 2>/dev/null
```

If it says `bind-address = 127.0.0.1`, change it to `0.0.0.0` in that file:

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf   # use the file path grep printed
```

Then restart MySQL and check:

```bash
sudo systemctl restart mysql      # on MariaDB: sudo systemctl restart mariadb
sudo ss -ltnp | grep 3306         # must show 0.0.0.0:3306 (not 127.0.0.1:3306)
```

If the OS firewall is on (`sudo ufw status` says *active*), allow the VPC range
(the default VPC is `172.31.0.0/16`; check yours in the VPC console):

```bash
sudo ufw allow from 172.31.0.0/16 to any port 3306 proto tcp
```

### A4. Check whether MySQL has TLS

```sql
SHOW VARIABLES LIKE 'have_ssl';
```

| Result | Set `DB_SSL` to |
|---|---|
| `YES` (the default on MySQL 8) | `no-verify` (encrypted, self-signed certificate) |
| `DISABLED` | `off` (acceptable here, because the traffic never leaves your VPC) |

---

## Part B — Security groups (EC2 console → Security Groups)

### B1. Create a security group for the Lambda

*Create security group*:

- Name: `respyr-dashboard-lambda`
- VPC: **the EC2's VPC**
- Inbound rules: **none**
- Outbound rules: leave the default (all traffic)

### B2. Let that group into MySQL

Open the **EC2 instance's** security group → *Edit inbound rules* → *Add rule*:

| Type | Port | Source |
|---|---|---|
| MySQL/Aurora | 3306 | the `respyr-dashboard-lambda` security group (pick it from the list) |

While you are there: if any rule allows **3306 from `0.0.0.0/0`**, delete it.
That would put your patient database on the open internet.

---

## Part C — Create the Lambda

AWS console → Lambda → region **ap-south-1 (Mumbai)**, or whichever region the
EC2 is in. It must be the same region.

### C1. Create the function

*Create function* → *Author from scratch*:

| Field | Value |
|---|---|
| Function name | `respyr-dashboard-backend` |
| Runtime | **Node.js 20.x** |
| Architecture | `x86_64` |
| Execution role | Create a new role with basic Lambda permissions |

> This is a **new** function. Do not upload this over the mobile app's Lambda.

### C2. Upload the code

*Code* tab → *Upload from* → *.zip file* → `dashboard-backend.zip`. Upload it
as it is; do not unzip it and zip it again.

### C3. Handler, timeout, memory

- *Code* tab → *Runtime settings* → *Edit* → Handler: **`lambda.handler`**
- *Configuration* → *General configuration* → *Edit*: Timeout **30 sec**, Memory **512 MB**

### C4. Put the Lambda in the EC2's VPC

*Configuration* → *VPC* → *Edit*:

| Field | Value |
|---|---|
| VPC | **the EC2's VPC** |
| Subnets | pick **at least 2** subnets of that VPC (different availability zones) |
| Security groups | **`respyr-dashboard-lambda`** (from B1) |

If saving fails with a message about *ec2:CreateNetworkInterface*: go to
*Configuration* → *Permissions* → click the role name → *Add permissions* →
*Attach policies* → **`AWSLambdaVPCAccessExecutionRole`**, then save the VPC
settings again.

### C5. Environment variables

*Configuration* → *Environment variables* → *Edit*:

| Key | Value |
|---|---|
| `DASHBOARD_JWT_SECRET` | a new random secret (command below) |
| `DASHBOARD_ORIGIN` | the address the dashboard website opens on, e.g. `https://portal.respyr.in`. Scheme + host only: no `/` at the end, no path |
| `DB_HOST` | the EC2 **private** IP (not the public one) |
| `DB_PORT` | `3306` |
| `DB_USER` | `respyr_dash` |
| `DB_PASSWORD` | the password from A2 |
| `DB_NAME` | `respyrpartnersbb` |
| `DB_SSL` | the value from A4 |

**Do not set** `RESPYR_SMTP_PASS` yet. Without it, "Send pdf" answers *Email is
not configured on the server* straight away, instead of hanging for 15 seconds
trying to reach Zoho.

Make the JWT secret on any computer with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep it. If you change it later, every dashboard user is logged out.

### C6. Function URL

*Configuration* → *Function URL* → *Create function URL*:

- Auth type: **NONE** (the dashboard sends its own login token)
- Configure cross-origin resource sharing (CORS): **leave UNTICKED**. The code
  already sends the CORS headers; ticking it here sends them twice, and browsers
  then block every request.

Copy the URL.

---

## Part D — Test (from any terminal)

Replace `<URL>` with the Function URL, without a trailing `/`.

```bash
curl <URL>/ping
```
Expect `{"status":"success","service":"dashboard-backend"}`. This proves the code
starts.

```bash
curl <URL>/health
```
Expect `"status":"ok"` (HTTP 200). This proves the database side, check by check:

| Check | Passes when | If it fails |
|---|---|---|
| `database` | Lambda connected and logged in to MySQL (also shows the MySQL version, and `tls` = cipher name, or `off`) | its `error` says what to fix; see *Troubleshooting* |
| `tables` | all 6 dashboard tables exist and this user can see them | `missing` lists them: not copied, or the user has no grant on them |
| `clinic_data` | `table_clinics` has rows | the data was not copied |
| `login_throttle_table` | the backend's own table exists (warning only) | grant `CREATE` (A2) |

Any failure returns HTTP 503 with the reason. You can also open `/health` in a
browser.

```bash
curl -X POST <URL>/api/dashboard/login -H "Content-Type: application/json" -d "{\"username\":\"OFFC\",\"password\":\"wrong-on-purpose\"}"
```
Expect `{"error":"Invalid username or password"}`. This proves **Lambda reached
MySQL**. If you get anything else, see *Troubleshooting*.

```bash
curl -X POST <URL>/api/dashboard/login -H "Content-Type: application/json" -d "{\"username\":\"<a real clinic>\",\"password\":\"<its real password>\"}"
```
Expect `{"token":"…"}`. This proves the login works with real data.

```bash
curl -i -X POST <URL>/api/dashboard/send-report-email
```
Expect `401` and `{"status":"error","message":"Missing token"}`.

---

## Part E — Point the dashboard at the new URL

Five files hold the URL, in seven places (paths are inside `clinical-required/`):

1. `clinical-dashboard_v2/head.php`, lines 7–8:
   `window.NODE_API = "https://<your-new-url>";`
2. `clinical-dashboard_v2/report/user_report.php`, **three** fallbacks around
   lines 1495, 1781 and 1840: `window.NODE_API || "https://<your-new-url>"`
3. `clinical-v2/login-port/index.html`, line 279: `const NODE_API = "https://<your-new-url>";`
4. `clinical-v2/login-port/forgot-password/index.php`, line 179: same constant
5. `clinical-v2/login-port/change-password/index.php`, line 216: same constant

Then, in a browser: log in → dashboard counts and chart → Test history →
Subjects → a profile (1W / 1M / 3M / Older) → a report. Press F12: the console
must show **no CORS errors**.

---

## Troubleshooting

Start with `<URL>/health`: the failing check's `error` is the same text the
backend writes to CloudWatch (Log groups → `/aws/lambda/<your function name>`).

| `/health` or CloudWatch says | Fix |
|---|---|
| `Timed out connecting to MySQL` | B2 rule missing, Lambda not in the VPC (C4), or `DB_HOST` is the public IP instead of the private IP |
| `refused the connection` | A3: `bind-address` is still `127.0.0.1`, or MySQL is stopped |
| `presented a certificate … cannot verify` | set `DB_SSL` to `no-verify` |
| `has TLS turned off` | set `DB_SSL` to `off` |
| `MySQL rejected user` | wrong `DB_USER` / `DB_PASSWORD`, or the user was created for `'localhost'` instead of `'%'` (A2) |
| `Database … does not exist` | `DB_NAME` does not match the database name on the EC2 |
| `Cannot find module` | handler is not `lambda.handler` (C3), or the zip was re-zipped with a folder inside |
| `DASHBOARD_JWT_SECRET must be set` | add it (C5) |
| `login_attempts table: … denied` | grant `CREATE` (A2). Login still works, but without rate limiting |
| Browser shows a CORS error | `DASHBOARD_ORIGIN` is not exactly the site's address, or CORS was ticked in C6 |
| "Send pdf" says *Email is not configured* | expected until the next section is done |

---

## Creating a new clinic login (admin page)

Open `<URL>/admin/create_clinic` in a browser. It replaces the old
`admin/create_clinic.php` page and the PHP endpoint behind it.

1. **Turn it on once.** Add an environment variable `ADMIN_KEY` with a long
   random value (16+ characters, e.g. the same `node -e …randomBytes…` command
   as the JWT secret). Without it the page refuses to create anything.
2. **Use it.** Enter the admin key, fill in the clinic, click **Create clinic**,
   then **Copy message** and send it to the clinic.

What it does:
- Writes the clinic to `table_clinics` (password stored as a bcrypt hash; logos
  as PNG/JPEG bytes) and its limit to `test_allow`, both in one transaction.
- Refuses a login ID or phone number that another clinic already uses: both
  logins look clinics up by these, so a duplicate would let one clinic's
  password open another clinic's data.
- `lambda_app` needs `INSERT` on those two tables. If it is missing, the page
  shows the database's own message.
- The link in the welcome message is `DASHBOARD_ORIGIN`. To use a different
  address (e.g. a login page path), set `DASHBOARD_LOGIN_URL`.

---

## Reading the app's error logs (admin page)

Open `<URL>/admin/logs` and enter the same `ADMIN_KEY`. (It is remembered in
that browser tab until you click **Lock**, and the create-clinic page picks it
up too.)

- Shows `clinical_app_logs`, which the **app** backend fills from the mobile
  app (`POST /api/logs/batch`). Entries are kept for 60 days.
- Filter by level, clinic login ID, install ID, platform, app version, tag and
  date (IST); search searches the message, stack trace and tag.
- Click a row for the full entry: device time, IDs, message and stack trace,
  plus **Show this clinic's logs** / **Show this install's logs** / **Copy details**.
- The filters are in the address bar, so a link to a filtered view can be
  shared (the person still needs the admin key).
- `lambda_app` needs `SELECT` on `clinical_app_logs`. If the table does not
  exist yet, the page says so: the app backend creates it on its first start.

---

## A clinic forgot its password (until forgot-password is rebuilt)

1. On your computer, unzip `dashboard-backend.zip` into a folder, open a terminal
   in it, and make a hash of the new password:
   ```bash
   node -e "console.log(require('./node_modules/bcryptjs').hashSync('NewPassword123', 10))"
   ```
2. In MySQL on the EC2, find the clinic's row, then set the hash:
   ```sql
   SELECT clinical_id, clinic_name FROM respyrpartnersbb.table_clinics WHERE clinic_name = 'CLINIC';
   UPDATE respyrpartnersbb.table_clinics SET password = '<the hash from step 1>' WHERE clinical_id = <id>;
   ```
   Use `clinical_id`, not `clinic_name`: some clinics have several login rows.

---

## Later: turning "Send pdf" on

The Lambda needs a way out to `smtp.zoho.in`:

1. VPC console → create a **NAT gateway** in a *public* subnet of the EC2's VPC
   (about ₹2,700/month).
2. Create **private subnets** (or use existing ones) whose route table sends
   `0.0.0.0/0` to that NAT gateway.
3. Lambda → *Configuration* → *VPC*: switch the subnets to those private subnets.
4. Change the Zoho password of `connect@humorstech.com` (the old one was in
   PHP source code, so treat it as public), then add `RESPYR_SMTP_PASS` with
   the new password in C5.

Nothing else changes, and MySQL keeps working the same way.

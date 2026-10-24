# Respyr Clinical — Dashboard Backend

The web dashboard's **own** backend. This is the Node port of the PHP backend
that shipped in `clinical-required/api/` (`data-weeks.php`,
`age-gender-diversity.php`, `encrp-trends-history.php`, `opd-login_v2.php`, …).

It reads the **plaintext** `clinical_scores_details` table, so unlike the
original PHP it needs no `crypto_helper.php` decryption key.

## It is separate from the app backend

`D:\Clinical\function` serves the Flutter app. This service serves the website.
They share **only the MySQL database** — the same clinic data seen through two
windows. They do not share a process, a URL, a deployment or a token secret.

That means: changes here can never break the installed mobile app, and the app
backend can be redeployed without touching the website.

## Run locally

    cd D:\Clinical\dashboard-backend
    node local.js            # http://localhost:3001

The app backend runs on 3000, so both can run side by side.
MySQL is expected on 127.0.0.1:3307 (XAMPP), database `respyrpartnersbb`.

## Endpoints

- `/ping` — the code is running (no database)
- `/health` — database reachable, all dashboard tables present, clinic data
  loaded; 200 when every check passes, 503 with the reason otherwise
- `/api/dashboard/*` — everything the dashboard needs (login, scores, subjects,
  data-weeks, age-gender-diversity, onboarded, test-allow, test-dates,
  trends-history, trend-7-days, profile-info, clinic-info, forgot-password/*,
  send-report-email)
- `/api/clinic/logos`, `/api/clinic/change-password`
- `/api/profiles/update`, `/api/profiles/delete`
- `/admin/create_clinic` — internal page to create a clinic login (Node port of
  `admin/create_clinic.php` + `create_clinic_id1.php`). Needs `ADMIN_KEY`
  (16+ characters) in the environment; without it creation is switched off.
  Optional `DASHBOARD_LOGIN_URL` sets the link in the welcome message
  (defaults to `DASHBOARD_ORIGIN`).
- `/admin/logs` — internal viewer for `clinical_app_logs` (written by the app
  backend's `POST /api/logs/batch`): filters, search, pagination, full entry
  with stack trace. Same `ADMIN_KEY`. Its API:
  `GET /admin/api/logs` (list), `/admin/api/logs/facets`, `/admin/api/logs/:id`.

Anything else returns a 404 that says it belongs to the app backend.

## Deploying

Its own Lambda function and its own Function URL — do not reuse the app's.
Entry point `lambda.js`. Required environment variables:

| Variable | Why |
|---|---|
| `DASHBOARD_JWT_SECRET` | signs/verifies dashboard logins — the service refuses to boot on Lambda without it |
| `DASHBOARD_ORIGIN` | the website's origin, so CORS is not `*` |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | MySQL connection — on EC2, `DB_HOST` is the instance's private IP |
| `DB_SSL` | `no-verify` for MySQL on EC2 (self-signed cert), `off` if the server has TLS disabled |
| `RESPYR_SMTP_PASS` | optional — report-email mailbox password. Unset = "Send pdf" answers "Email is not configured" |

There is deliberately **no** internal/shared key: every route is reached with
the logged-in user's own token, so nothing can read another clinic's data.

Then set the dashboard's `window.NODE_API` (in `clinical-dashboard_v2/head.php`)
and the `NODE_API` constants in `clinical-v2/login-port/*` to the new Function
URL. Full EC2 + Lambda setup, including that file list: `DEPLOY-EC2-LAMBDA.md`.

This service does not call any PHP endpoint. Forgot-password is switched off
for now (every `/forgot-password/*` step answers 503) until it is rebuilt on
`lib/mailer.js`.

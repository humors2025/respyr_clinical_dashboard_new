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

- `/api/dashboard/*` — everything the dashboard needs (login, scores, subjects,
  data-weeks, age-gender-diversity, onboarded, test-allow, test-dates,
  trends-history, trend-7-days, profile-info, clinic-info, forgot-password/*,
  send-report-email)
- `/api/clinic/logos`, `/api/clinic/change-password`
- `/api/profiles/update`, `/api/profiles/delete`

Anything else returns a 404 that says it belongs to the app backend.

## Deploying

Its own Lambda function and its own Function URL — do not reuse the app's.
Entry point `lambda.js`. Required environment variables:

| Variable | Why |
|---|---|
| `DASHBOARD_JWT_SECRET` | signs/verifies dashboard logins — the service refuses to boot on Lambda without it |
| `DASHBOARD_ORIGIN` | the website's origin, so CORS is not `*` |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | RDS connection |

There is deliberately **no** internal/shared key: every route is reached with
the logged-in user's own token, so nothing can read another clinic's data.

Then set the dashboard's `window.NODE_API` (in `clinical-dashboard_v2/head.php`)
and the `NODE_API` constants in `clinical-v2/login-port/*` to the new Function
URL, plus `$NODE_API` at the top of `view-profile.php`.

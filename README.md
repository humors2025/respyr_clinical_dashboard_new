# Respyr Clinical Dashboard (frontend)

The web dashboard clinics use with the Respyr breath-based health screening
device. Clinicians sign in, review subject test results across four
breath-derived scores (sugar, liver, gut, respiratory), and download or email
the PDF health report.

This repo is the **frontend only**. All data comes from the Node dashboard
backend (`respyr-dashboard-backend`, deployed to AWS Lambda), which is shared
separately and will be added to this repo once it is live. No file here
connects to a database, sends mail, or verifies a token.

## Why two folders

The site is two apps that sit side by side in the web root and reference each
other by relative path, which is why neither can be flattened away:

```
web root
├── clinical-v2/              login portal (sign-in, forgot/change password)
├── clinical-dashboard_v2/    the dashboard, subject pages and PDF report
└── router.php                dev-only router for PHP's built-in server
```

- Logged-out visitors on any dashboard page are bounced to `../clinical-v2/`
- After sign-in the portal redirects back into `../clinical-dashboard_v2/`

## Tech

PHP is only the page shell (shared includes and reading URL parameters).
Everything the pages *do* — login, data fetching, charts, the PDF build, the
report email — is JavaScript in the browser talking to the Node backend via
`window.NODE_API` and a `Bearer` JWT from login.

## Run locally

```
php -S localhost:8080 router.php
```

Then open http://localhost:8080/clinical-v2/ and sign in. The pages expect the
Node backend on http://localhost:3001 (its repo has `npm start` for that).

## Deploy

Copy both folders into the PHP host's web root (router.php is not needed
there — Apache rewrites handle the extensionless URLs). Before go-live, the
backend's Lambda Function URL must replace `http://localhost:3001` in five
files (seven places) — the exact list is Step 10 of the backend's
`DEPLOY-LAMBDA.md`:

1. `clinical-dashboard_v2/head.php` (feeds `window.NODE_API` to most pages)
2. `clinical-dashboard_v2/report/user_report.php` — three fallbacks
3. `clinical-v2/login-port/index.html`
4. `clinical-v2/login-port/forgot-password/index.php`
5. `clinical-v2/login-port/change-password/index.php`

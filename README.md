# Respyr Clinical Dashboard (frontend)

The web dashboard clinics use with the Respyr breath-based health screening
device. Clinicians sign in, review subject test results across four
breath-derived scores (sugar, liver, gut, respiratory), and download or email
the PDF health report.

This repo is the **frontend only**. All data comes from the Node dashboard
backend (`respyr-dashboard-backend`, deployed to AWS Lambda), which is shared
separately and will be added to this repo once it is live. No file here
connects to a database, sends mail, or verifies a token.

## Layout

The dashboard lives at the repo root, which is also the web root; the login
portal is the one subfolder:

```
/ (web root)
├── index.php                 bounces logged-out visitors to the login portal
├── dashboard.php  history.php  patients.php  view-profile.php  ...
├── report/                   the PDF health report page
├── pages/  assets/           shared includes and static files
├── clinical-v2/              login portal (sign-in, forgot/change password)
└── router.php                dev-only router for PHP's built-in server
```

- Logged-out visitors on any dashboard page are bounced to `./clinical-v2/`
- After sign-in the portal redirects back up to `/dashboard`

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

Copy the repo contents into the PHP host's web root (router.php is not needed
there — Apache rewrites handle the extensionless URLs).

> **URL change from the previous layout.** The dashboard used to be served
> under `/clinical-dashboard_v2/…`; in this layout its pages sit at the web
> root (`/dashboard`, `/patients`, `/report/user_report.php`, …). Old
> bookmarks to `/clinical-dashboard_v2/…` will 404 unless the host adds
> redirects. Deploy the whole layout at once — mixing old and new paths on
> one server breaks the login bounce.

Before go-live, the backend's Lambda Function URL must replace
`http://localhost:3001` in five files (seven places):

1. `head.php` (feeds `window.NODE_API` to most pages)
2. `report/user_report.php` — three fallbacks
3. `clinical-v2/login-port/index.html`
4. `clinical-v2/login-port/forgot-password/index.php`
5. `clinical-v2/login-port/change-password/index.php`

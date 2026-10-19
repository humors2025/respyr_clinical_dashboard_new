# Respyr Clinical Dashboard (frontend)

The web dashboard clinics use with the Respyr breath-based health screening
device. Clinicians sign in, review subject test results across four
breath-derived scores (sugar, liver, gut, respiratory), and download or email
the PDF health report.

**100% static HTML + JavaScript — no server-side code.** It deploys on AWS
Amplify, or any static file host. All data comes from the Node dashboard
backend (`respyr-dashboard-backend`, deployed to AWS Lambda), which is shared
separately and will be added to this repo once it is live.

> This used to be a PHP-served app. In Oct 2026 every page was converted to
> static HTML, and the report's PHP interpretation engine was ported to
> `report/methods.js`. The port is **differentially tested**: `tools/` holds
> harnesses that run the original PHP (`tools/reference/methods.php`) and the
> JS side by side over a sweep of inputs — 771 comparisons, byte-identical.
> Do not edit score thresholds or clinical wording in `methods.js` without
> re-running that harness; clinicians read reports against those exact words.

## Layout

```
/ (web root)
├── index.html                bounces logged-out visitors to the login portal
├── dashboard.html  history.html  patients.html  view-profile.html
├── admin-profile.html  usage_analytics.html
├── report/
│   ├── user_report.html      the PDF health report page
│   └── methods.js            score interpretation engine (see note above)
├── assets/                   styles, charts, images
├── clinical-v2/              login portal (sign-in, forgot/change password)
└── tools/                    PHP-vs-JS differential test harnesses
```

- Logged-out visitors on any dashboard page are bounced to `./clinical-v2/`
- After sign-in the portal redirects back up to `/dashboard.html`
- Shared chrome (sidebar, headers, footer) is inlined into each page — a
  change to the sidebar means the same edit on each dashboard page

## Run locally

Any static file server works. With the Node backend running on port 3001
(its repo has `npm start`):

```
python -m http.server 8080
# or: npx serve -l 8080
```

Then open http://localhost:8080/ and sign in.

## Deploy

**Amplify:** connect the repo, branch `main`. `amplify.yml` is already set up
— no build step, the repo deploys as-is.

**Any other static host (or the existing PHP host):** copy the repo contents
into the web root. PHP is no longer required anywhere.

> **URL change from the PHP era.** Pages that used to be served as
> `/clinical-dashboard_v2/dashboard` (extensionless, Apache-rewritten) are now
> `/dashboard.html` at the web root. Old bookmarks will 404 unless the host
> adds redirects. Deploy the whole layout at once — mixing old and new paths
> on one server breaks the login bounce.

Before go-live, the backend's Lambda Function URL must replace
`http://localhost:3001` — it appears in **10 files (12 places)** now that the
shared head is inlined into each page. Do it as one search-and-replace:

```
grep -rln "localhost:3001" --include=*.html .    # lists all 10 files
```

Replace every `http://localhost:3001` with the Function URL (no trailing
slash) and redeploy.

## Re-running the differential tests

```
php tools/diff-methods.php  > php.txt
node tools/diff-methods.mjs > js.txt
diff php.txt js.txt            # must be empty
```

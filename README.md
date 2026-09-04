# Respyr Clinical Dashboard

Next.js portal for clinics using the Respyr breath-based health screening device.
Clinicians sign in, review subject test results across four breath-derived scores,
and drill into cohorts and individual patients.

Deployed via **AWS Amplify** — pushing to `main` publishes.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4, themed with the Respyr design tokens
- Existing PHP APIs on `humorstech.com` remain the data backend — nothing here has its own database

## Scores

| Score | API field | Biomarker |
| --- | --- | --- |
| Sugar | `Db_Score` | Acetone (ppm) |
| Liver | `liver_score` | Ethanol (ppm) |
| Gut | `Gut_Score_per` | Hydrogen (ppm) |
| Respiratory | `Blow_Score` | FEV1 / FVC from expiratory pressure |

Bands: **Good** ≥ 80, **Fair** 70–79, **Poor** < 70. Thresholds mirror the legacy
`report/methods.php` and must not drift — clinicians read the report wording against them.

## Architecture

Every call to the PHP backend happens **server-side**, in a route handler or server
component. Two reasons:

1. **CORS.** `opd-encry-age-gender-diversity-v2.php` answers with
   `Access-Control-Allow-Origin: https://portal.respyr.in`, so a browser on any other
   origin is refused. Server-to-server requests aren't subject to CORS.
2. **Tenancy.** Every PHP endpoint trusts the `login_id` it is given. It is read from a
   signed, httpOnly session cookie, so a client cannot substitute another clinic's id.

The legacy portal put a JWT in `localStorage` and let the browser send `login_id` itself;
both problems are closed by this arrangement.

```
src/
  app/
    login/                 sign-in screen
    (app)/dashboard/       clinic overview (server-rendered, client-refreshed)
    api/auth/login|logout  session cookie lifecycle
    api/dashboard          per-day dashboard payload
  lib/
    respyr-api.ts          server-only client for the PHP endpoints
    dashboard.ts           aggregation — one settled call per upstream
    scores.ts              score model, bands, date helpers
    session.ts             cookie session (jose, HS256)
  proxy.ts                 route gating (page routes only, never /api)
```

Upstream calls are settled independently: one dead endpoint degrades a single card and
shows a banner, rather than blanking the page.

## Local development

```bash
npm install
```

Create `.env.local` (see `.env.example`):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Put that value in `SESSION_SECRET`, then:

```bash
npm run dev
```

### Working without production data

Patient records are real clinical data. To develop against fabricated data instead, run
the fixture API and point the app at it:

```bash
npm run dev:fixtures
```

Then add `RESPYR_API_BASE=http://localhost:3005` to `.env.local` and restart `npm run dev`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SESSION_SECRET` | yes | Signs the session cookie. Minimum 32 characters. |
| `RESPYR_API_BASE` | no | Defaults to `https://humorstech.com/api`. |
| `RESPYR_CLINIC_BASE` | no | Defaults to the `humors_app/app_final/clinical` path. |
| `RESPYR_API_TIMEOUT_MS` | no | Upstream timeout, default `15000`. |

**Before the first deploy**, set `SESSION_SECRET` in
Amplify Console → Hosting → Environment variables. Without it, every authenticated route
fails at runtime. Use a different value from the one in local `.env.local`.

## Checks

```bash
npm run lint && npm run typecheck && npm run build
```

## Ported so far

- [x] Sign-in and session handling
- [x] Clinic overview dashboard
- [ ] Test history
- [ ] Subjects (create / edit / delete)
- [ ] Patient trends (`view-profile`)
- [ ] PDF health report
- [ ] Admin profile, password change, forgot-password

---

© Humorstech Pvt Ltd

# ShedClock 🏗️

[![CI](https://github.com/char203/shedclock/actions/workflows/ci.yml/badge.svg)](https://github.com/char203/shedclock/actions/workflows/ci.yml)

**Renewal deadlines and fine exposure for NYC sidewalk sheds.**

Since January 12, 2026 (Local Laws 48 & 49 of 2025, the "Get Sheds Down" package),
NYC sidewalk shed permits last **90 days** instead of a year, and aging sheds accrue
fines of **$10–$200 per linear foot per month**. A GC running 20 sheds went from
tracking 20 renewal dates a year to ~80.

ShedClock searches live NYC Department of Buildings permit data (updated daily,
no API key) so a general contractor can see every active shed in their portfolio,
how many days remain on each permit, and what the shed is — or soon will be —
costing in monthly penalties.

## Demo login

- Username: `demo`
- Password: `sheds2026`

## Stack

- Next.js (App Router) — one API route proxies the NYC Open Data (Socrata) API
- Dataset: [DOB NOW: Build – Approved Permits](https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4) (`rbx6-tga4`), filtered to `work_type = 'Sidewalk Shed'`
- No database — watchlist lives in localStorage
- Deployed on Vercel

## Run locally

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

Unit tests cover the fine model (`lib/fines.js`) and permit-to-site grouping
(`lib/sites.js`). CI runs them under several time zones, because Socrata
timestamps carry no zone and must keep their calendar date wherever the code runs.

## Fine model (Local Law 49 of 2025)

| Shed age | Monthly penalty |
|---|---|
| < 3 years | $10 / linear ft |
| 3–4 years | $100 / linear ft |
| 4+ years | $200 / linear ft |
| Cap | $6,000 / month |

Linear footage is not published in the permit dataset, so it is an editable
per-site field (default 230 LF — the citywide average).

*Fine figures are estimates for planning purposes, not legal advice.*

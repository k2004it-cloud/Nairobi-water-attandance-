# Nairobi Water — Attendance System

This repository contains a Vite + React TypeScript frontend and simple Vercel serverless API handlers for a lightweight attendance and employee management app.

## Quick local development

1. Install dependencies

```powershell
cd "C:\Users\MIDNIGHT CRISIS\Desktop\Nairobi Water Company- dev"
npm install
```

2. Run the dev server (Vite)

```powershell
npm run dev
```

Open `/reception` for the reception view or `/admin` for the admin login.

Notes:
- The frontend falls back to seeded local data when the serverless `/api/appData` endpoint is not available during development.

## Build & preview

```powershell
npm run build
npm run preview
```

## Vercel deployment

This project is configured to deploy on Vercel using `vercel.json`. The `api/*.ts` files are deployed as Vercel Serverless Functions.

Recommended steps:

1. Push your `main` branch to GitHub (already done).
2. In the Vercel dashboard, import the repository and follow the prompts.
3. Set the build command to `npm run build` and the output directory to `dist` (Vercel should autodetect).

### Environment variables

Set the following environment variables in Vercel Project Settings → Environment Variables:

- `VITE_SUPABASE_URL` — your Supabase project URL.
- `VITE_SUPABASE_ANON_KEY` — your Supabase public anon key.
- `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key (server-only use).
- `VITE_ADMIN_PASSWORD` — value: the admin password to unlock the admin area (e.g. `admin2030`).
- `VITE_ADMIN_EMAIL` — the admin email address used for password reset requests.
- `SMTP_HOST` — SMTP server hostname for sending reset emails.
- `SMTP_PORT` — SMTP server port (e.g. `587`).
- `SMTP_SECURE` — `true` for SMTPS, `false` for STARTTLS.
- `SMTP_USER` — SMTP username.
- `SMTP_PASS` — SMTP password.
- `SMTP_FROM` — optional sender address for reset emails (defaults to `no-reply@nairobi-water.app`).

If SMTP is not configured, the reset flow still works in development by returning the token directly for testing.

You can add variables via the Vercel CLI as well:

```bash
vercel env add VITE_ADMIN_PASSWORD production
```

After adding env vars, re-deploy.

## URLs

- Reception (public, restricted UI): `https://<your-app>.vercel.app/reception`
- Admin (password-protected): `https://<your-app>.vercel.app/admin`

## Security notes

- The admin gate in this prototype is a simple password check stored in a Vite env var. For production consider:
  - Using a real authentication provider (OAuth, SSO, or session-based auth).
  - Moving admin endpoints behind secure server-side authentication.
  - Persisting data in a database (Postgres, MySQL, or Firebase) instead of in-memory store.

## Troubleshooting

- If `npm` errors in PowerShell with `npm.ps1 cannot be loaded`, either run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force` or use `npm.cmd run dev`.
- If the preview is blank, confirm you ran `npm install` in the project root and started Vite from the project folder.

## Next steps

If you want, I can deploy to Vercel for you, add persistent DB support, or wire real auth. Tell me which you'd like next.# Nairobi Water Attendance System

A Vite, React, and TypeScript attendance dashboard for Nairobi Water Co. It includes reception check-in, live dashboard metrics, employee administration, and printable daily attendance reports.

## Run Locally

1. Install dependencies:
   `npm install`
2. Start the app:
   `npm run dev`
3. Open the local URL printed by Vite.

## Useful Scripts

- `npm run dev` starts the local development server.
- `npm run lint` runs TypeScript checks.
- `npm run build` creates a production build in `dist`.
- `npm run preview` serves the production build locally.

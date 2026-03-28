# Deployment (Vercel + Neon Auth)

## Fixing "invalid origin" after sign-in

Neon Auth validates the **browser origin** (your app URL), not the Neon Auth API URL.

1. Open [Neon Console](https://console.neon.tech) → your project → **Auth** (or **Settings → Auth**).
2. Find **Trusted origins**, **Allowed origins**, or **Redirect URLs** (wording varies by Neon Auth version).
3. Add every origin where users open the app, **including scheme and host**, for example:
   - `https://your-app.vercel.app`
   - `https://your-custom-domain.com`
   - For preview deployments, add `https://*.vercel.app` if Neon supports wildcards, or add each preview URL you use.

4. In **Vercel** → Project → **Settings → Environment Variables**, set (Production + Preview as needed):
   - `DATABASE_URL` — Neon pooled connection string
   - `DIRECT_URL` — Neon direct connection string (for Prisma migrations)
   - `NEON_AUTH_BASE_URL` — from Neon Auth tab (ends with `/auth` or similar)
   - `NEON_AUTH_COOKIE_SECRET` — strong secret (`openssl rand -base64 32`), **not** a test value in production
   - `NEXT_PUBLIC_NEON_AUTH_BASE_URL` — same base URL as `NEON_AUTH_BASE_URL` (used by the browser client)
   - `NEXT_PUBLIC_USERNAME_EMAIL_DOMAIN` — domain used for synthetic emails (see below); default `internal.local` if unset

5. Redeploy after changing env vars.

## Username login (synthetic email)

This app signs users in with **username + password** at the UI. Under the hood, Neon Auth still uses **email + password**; each username maps to a synthetic address:

`{normalized_username}@{NEXT_PUBLIC_USERNAME_EMAIL_DOMAIN}`

Set `NEXT_PUBLIC_USERNAME_EMAIL_DOMAIN` to a stable value (e.g. `users.yourapp.internal`). Do not use a real mailbox domain you do not control unless you understand deliverability implications (verification emails are not the focus for this mapping).

## Legacy accounts (signed up with real email before username-only UI)

Those users still authenticate with **email + password** in Neon Auth. The sign-in form only accepts **username**. Options:

1. **One-time backfill:** Insert a `UserProfile` row with `authUserId` = their Neon user id and a chosen `username`, and ensure `usernameToEmail(username)` equals the synthetic email you standardize on, _or_ keep their real email in Neon and add a separate “link username” admin flow.
2. **Temporary:** Expose a hidden `/auth/email-sign-in` route using `AuthView` for migration only (not implemented by default).

For most new deployments, all users go through username sign-up.

# Wed Studios — Cloudflare Pages + D1

## Files
- login.html — shared login
- admin.html — admin dashboard
- editor.html — editor dashboard
- functions/api/login.js — login API
- functions/api/users.js — editor management API
- functions/api/works.js — work/calendar/report API
- functions/api/_utils.js — auth/hash helpers
- migrations/0001_initial.sql — D1 schema
- wrangler.toml — D1 binding template

## Cloudflare setup
1. Create a D1 database named `wed-studios-db` in Cloudflare.
2. Copy its Database ID into `wrangler.toml` in place of `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
3. Run the migration from Wrangler/Cloudflare dashboard:
   `npx wrangler d1 migrations apply wed-studios-db --remote`
4. In Pages, add a D1 binding with variable name `DB` pointing to `wed-studios-db`.
5. Deploy the repo.
6. Open `/login.html`. If the DB has no users, login once with `admin` / `admin123` to create the first admin.
7. Immediately replace the simple demo login/authentication with a production auth flow before exposing the app publicly. This starter uses SHA-256 password hashing and a signed-style token helper, but the fallback secret is a placeholder and must be replaced with a real secret mechanism.

## Important
- D1 data is shared across devices.
- Do not use localStorage as the database; it is only used here to keep the current login token in the browser.
- This is a ready-to-deploy starter, not a full production identity system. For production, use a proper password KDF (e.g. PBKDF2/Argon2 via a suitable auth service/implementation), secure HttpOnly cookies, CSRF protection, rate limiting, and a secret stored in Cloudflare rather than source code.

# URL Handling & Hardening

This project includes small client-side utilities to reduce URL-based attack surface.

What was added

- `src/utils/url.ts` — `isSafeRedirect`, `normalizeRedirect`, `isExternal`.
  - Uses `VITE_ALLOWED_ORIGINS` (comma-separated) to allow specific external redirect targets.
- `src/utils/params.ts` — `sanitizeString`, `getQueryParamSafe`, `parseHashParams`.
- `src/components/LinkSafe.tsx` — safe anchor wrapper (already added).
- Unit tests: `src/utils/__tests__/url.test.ts` using `vitest`.

How to configure

- To allow trusted external redirect targets, set the Vite env variable in `.env` or `.env.local`:

```
VITE_ALLOWED_ORIGINS=https://good.example.com,https://another-trusted.example.com
```

How to use

- Use `normalizeRedirect()` before performing client-side navigations to ensure fallback to `/` for unsafe targets.
- Use `getQueryParamSafe()` with a validator to read user-controlled params safely.

Testing

Run:

```bash
npm install
npm test
```

Notes

- These are defensive client-side checks and should complement server-side validation for any security-critical redirect or parameter handling.

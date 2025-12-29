# Step 5: Install Frontend Dependencies

## Admin (`remotehive-admin`)
- React set to `18.2.0` for Next.js 14 compatibility.
- Install packages:
  - `npm install`
  - Includes Next.js, React 18, Tailwind, PostCSS, Supabase.
- Dev dependencies include `@types/node` for env typing.

## Public (`remotehive-public`)
- React set to `19.0.0` with Vite.
- Install packages:
  - `npm install`
  - Includes Vite, React 19, Tailwind, Supabase, ESLint.
- Type support via `@types/react`, `@types/react-dom`, and `vite-env`.

## Next
- Place logo assets into each app's `public/logo.png`.
- Start dev servers and verify UI loads.


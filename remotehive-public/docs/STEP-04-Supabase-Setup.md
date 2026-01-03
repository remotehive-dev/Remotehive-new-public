# Step 4: Supabase Setup

## Goal
- Configure both frontends to use Supabase for database, auth, and storage.

## Environment Variables
- Admin (`remotehive-admin/.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- Public (`remotehive-public/.env`):
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`

## Client Initialization
- Both apps initialize a Supabase client using `@supabase/supabase-js` in `src/lib/supabase.ts`.
- Clients are created lazily to avoid re-instantiation during HMR.

## Notes
- Use Row Level Security (RLS) for public tables, policies for anon roles.
- Store secrets securely; do not commit `.env` files.
- Prefer service role keys only on the server (if/when backend is added).

## Next
- Define initial tables: users, companies, jobs, applications, skills.
- Add minimal queries to list remote jobs and post applications.


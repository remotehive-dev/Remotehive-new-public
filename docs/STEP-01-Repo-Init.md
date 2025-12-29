# Step 1: Repository Initialization

## Goals
- Establish monorepo layout for admin and public apps.
- Confirm technology choices and base URLs.
- Decide on database provider: Supabase.

## Decisions
- Admin Panel: Next.js 14, TypeScript, Tailwind, Zustand.
- Public Website: React 19, Vite, TypeScript, Tailwind, React Context.
- Database: Supabase (Postgres, Auth, Storage), accessed via `@supabase/supabase-js`.
- Base URLs:
  - Admin: `http://localhost:3000`
  - Public: `http://localhost:5173`

## Structure
```
remotehive-admin/
remotehive-public/
docs/
README.md
.env.example
```

## Next
- Scaffold both frontends with minimal pages and shared UI conventions.


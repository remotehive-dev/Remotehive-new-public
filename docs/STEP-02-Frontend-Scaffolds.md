# Step 2: Frontend Scaffolds (Admin + Public)

## Admin Panel (Next.js)
- Created `remotehive-admin` with:
  - TypeScript config (`tsconfig.json`)
  - Tailwind setup (`tailwind.config.ts`, `postcss.config.js`)
  - App Router skeleton (`src/app/layout.tsx`, `src/app/page.tsx`)
  - Global styles (`src/styles/globals.css`)
  - Supabase client (`src/lib/supabase.ts`)
  - API layer placeholder (`src/lib/api.ts`)
  - Static assets path (`public/logo.png`)

## Public Website (Vite React)
- Created `remotehive-public` with:
  - TypeScript config (`tsconfig.json`)
  - Vite config (`vite.config.ts`)
  - Entry files (`index.html`, `src/main.tsx`, `src/App.tsx`)
  - Global styles (`src/styles/index.css`)
  - Supabase client (`src/lib/supabase.ts`)
  - API layer placeholder (`src/lib/api.ts`)
  - Static assets path (`public/logo.png`)

## Shared Decisions
- Both apps expect a shared logo at `public/logo.png`.
- Environment variables read from `.env` files:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Admin)
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Public)

## Next
- Place uploaded website logo into each app’s `public/logo.png`.
- Implement basic header components to render the shared logo.


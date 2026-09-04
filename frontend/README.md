# Email AI — Frontend

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Clerk Auth, TanStack Query.

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your Clerk keys and backend URL.
2. `npm install`
3. `npm run dev` — http://localhost:3000

## Scripts

- `npm run dev` — start dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — typecheck

## Structure

```
src/
├── app/                    # App Router routes
│   ├── (dashboard)/        # protected dashboard shell (sidebar + topbar)
│   │   └── dashboard/      # /dashboard, /campaigns, /leads, /templates, /analytics, /settings
│   ├── sign-in/ sign-up/   # Clerk-hosted auth pages
│   └── page.tsx            # public landing page
├── components/             # ui primitives, providers, dashboard components
├── hooks/                  # TanStack Query hooks (campaigns, leads)
├── lib/                    # api-client, validations, constants
└── types/                  # API DTO types
```

## Notes

- Auth is Clerk (Next 16 uses `src/proxy.ts` — the renamed middleware convention).
- The frontend talks to the standalone `/backend` service at `NEXT_PUBLIC_BACKEND_URL`, passing the Clerk session JWT in `Authorization: Bearer <token>`.
# Apex Athletics

Full-stack website for Apex Athletics — marathons, running, fitness and adventure events.

Built with Next.js 14 (App Router) + Supabase (Postgres, Auth, Row Level Security).

**Start here: read `MANUAL_SETUP.md` first.**

## Structure
- `app/` — pages (home, events, registration, store, sponsors, login, dashboard, admin)
- `components/` — Nav, Footer
- `lib/supabase/` — Supabase client helpers
- `supabase/schema.sql` — full database schema + security policies + seed data
- `app/api/checkout/` — Razorpay integration stubs (commented, ready to activate)

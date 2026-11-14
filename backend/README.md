# Backend — Delivery Platform (Sudan)

Node.js + TypeScript + Fastify + Prisma + PostgreSQL.

## Status
Phase 3 — scaffold. Health + Auth implemented. Business routes are stubs.

## Run locally
1. Copy `.env.example` to `.env` and fill `DATABASE_URL` and `JWT_SECRET`.
2. `npm install`
3. `npx prisma generate`
4. `npx prisma migrate dev --name init`
5. `npm run dev`

## Database
Schema targets PostgreSQL 16. No Docker required — use native install on D: or a free managed tier (Neon, Supabase, Railway). See `docs/SETUP.md`.

## API base
`/api` (auth, and future routes). `/health` and `/ready` are unauthenticated.

## Scripts
- `npm run dev` — tsx watch
- `npm run build` — tsc
- `npm run typecheck` — tsc --noEmit
- `npm run prisma:validate` — prisma validate
- `npm run prisma:migrate` — prisma migrate dev
- `npm run prisma:deploy` — prisma migrate deploy

## Notes
- Passwords hashed with bcrypt (rounds from env).
- JWT signed with `JWT_SECRET`; roles: CUSTOMER, DRIVER, ADMIN, STORE_OWNER.
- Phone numbers normalized to +249XXXXXXXXX.
- Order numbers are human-friendly (SH-... / CR-...) and unique.

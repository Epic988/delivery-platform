# Development Log

## 2026-11-14 — Phase 1 complete, Phase 2 in progress

### Phase 1 — Audit
- Repo: https://github.com/Epic988/delivery-platform.git (private check pending)
- Branch: main only, 1 commit, README only.
- Env: Git 2.55, Node 24.20.0, npm 11.19.0, Temurin 17.0.20.1.
- WSL2 Ubuntu present (stopped). HypervisorPresent=True.
- Disk D: ~96.5 GB free.
- credential.helper (system): manager.
- Licenses: Fleetbase AGPL-3.0; storefront-app AGPL-3.0; navigator-app AGPL + paid bg-geo.
- Decision: custom stack (ADR-001).

### Phase 2 — Initialization
- Created D:\delivery-platform, cloned repo, created folder structure.
- Files: .gitignore, .env.example, ARCHITECTURE.md, LICENSES.md, README.md, DEVELOPMENT_LOG.md.
- Next: initial commit, then Phase 3 (backend scaffold).

### Blockers / unresolved
- Production signing keys: pending (user generates, never commit).
- Repo visibility: must confirm Private.

### Next action
- Commit Phase 2 files.
- Scaffold backend (Node + TS + Fastify + Prisma + PostgreSQL).

## 2026-11-14 — Phase 3 completion (src + CI)

### Added
- backend/src/config.ts, server.ts, app.ts
- backend/src/plugins/: prisma.ts, auth.ts, errorHandler.ts
- backend/src/routes/: health.ts, auth.ts
- backend/src/lib/: password.ts, phone.ts, orderNumber.ts
- .github/workflows/backend-ci.yml (prisma validate + tsc --noEmit, no DB, no secrets)

### Notes
- Endpoints live: /health, /ready, /api/auth/register, /api/auth/login, /api/auth/me
- JWT auth via @fastify/jwt; role in token payload
- Zod validation; centralized error handler
- No local npm install yet; CI installs on push

### Next action
- Push this commit; verify backend-ci passes on GitHub Actions.
- Then Phase 4: stores/products/cart routes.

## 2026-11-14 — Phase 3.5 complete

### Schema corrections
- ProofOfDelivery: real FK to ShoppingOrder/CourierOrder + @unique; exactly-one enforced by CHECK.
- Address.lat/lng and CourierOrder pickup/destination coords optional; text addresses mandatory.
- CheckoutGroup model + ShoppingOrder.checkoutGroupId group multi-store checkouts.
- Customer.defaultAddressId: real FK with @unique + onDelete:SetNull.
- CHECK constraints in backend/prisma/sql/check-constraints.sql.

### Security
- Production startup fails on wildcard CORS or JWT_SECRET < 32 chars.
- trustProxy only when production AND TRUST_PROXY=true.
- requireRole() re-verifies from DB (no stale JWT trust).
- Zod .strict() blocks unknown fields; P2002 -> generic 409.
- Rate limits: register 5/15min, login 10/min.
- Dependency audit: 12 vulnerabilities (4 critical) resolved. 0 prod vulns.

### Reproducibility
- package-lock.json regenerated (106 KB).
- CI: npm ci + Postgres 16 service + db push + CHECK constraints + tests.
- 9 tests: health (2) + auth (7).

### Docs
- docs/SETUP.md: Neon Free, env, migrations, tests, hardening.

### Next action
- Push and verify backend-ci green.

## 2026-11-14 — Phase 5 COMPLETE

Customer APK: build-customer-apk, run 43601534276, 9m25s, green
Driver APK:   build-driver-apk,   run 43602673843, 7m51s, green
Both artifacts downloaded locally (~153 MB each, debug signed).

Stack: Expo SDK 57 + RN 0.86.0 + React 19.2.3
CI: ubuntu-latest, Node 24, JDK 17, Gradle 8.13

Customer screens (12): Login, Register, Home, Stores, StoreDetails, Products,
Cart, Addresses, Checkout, CourierRequest, Orders, OrderDetails, Profile.
Driver screens (4): Login, Home, AssignmentDetails, Proof.

Limitations:
- API base URL defaults to http://10.0.2.2:3000 (emulator).
- Debug-signed APK (not production).
- Backend not deployed -> apps cannot reach API until hosted.
- No maps, no background GPS, no admin dashboard, no push.

Next: deployment of backend, then Phase 6 admin dashboard.

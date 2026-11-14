# Architecture Decision Record (ADR-001)

## Title
Custom lightweight stack instead of Fleetbase for MVP

## Status
Accepted (pending owner objection)

## Context
The mission nominates Fleetbase as primary candidate. Investigated repos:
- fleetbase/fleetbase — AGPL-3.0
- fleetbase/storefront-app — AGPL-3.0
- fleetbase/navigator-app — AGPL-3.0 + paid background-geolocation for release
- fleetbase/storefront — AGPL-3.0

## Decision drivers
1. Zero budget: no paid licenses, no paid services, no paid trials.
2. Hardware: 2 physical cores, 7.9 GB RAM, Docker not installed.
3. Commercial use in Sudan: Arabic-first, RTL, SDG, COD, Khartoum TZ.
4. Legal clarity: avoid AGPL source-disclosure obligations.
5. Driver app must be buildable for production without paid deps.

## Considered options

### Option A: Fleetbase + storefront-app + navigator-app
Pros: ready-made screens and dispatch.
Cons:
- AGPL-3.0 requires source disclosure (or paid commercial license).
- Heavy Docker stack on 2 cores / 7.9 GB.
- Navigator release builds require paid license.
- Deep customization inside unfamiliar codebase.

### Option B: Custom lightweight stack (CHOSEN)
Pros:
- Full ownership, MIT for our code.
- Runs on Node.js + PostgreSQL; no Docker needed.
- No paid dependencies.
- Sudan-first design from day one.
- Driver app fully buildable for production.
Cons:
- More build effort. Mitigated by MVP-first phasing.

## Proposed stack
| Layer | Technology | License |
|---|---|---|
| Backend | Node.js 24 + TypeScript + Fastify + Prisma | MIT / Apache-2.0 |
| Database | PostgreSQL 16 | PostgreSQL License |
| Customer app | React Native + Expo (managed) | MIT |
| Driver app | React Native + Expo (managed) | MIT |
| Admin | Next.js + TypeScript + Tailwind | MIT |
| Maps | OSM + Leaflet + manual coordinates | ODbL / BSD-2 |
| Auth | JWT + bcrypt | MIT |
| Payments | Cash on delivery only | N/A |

## Consequences
- We own the source; no AGPL obligations for our own code.
- We must build every screen and workflow ourselves.
- We must run PostgreSQL (native or free managed tier).
- Maps provider is replaceable.

## Risks
| Risk | Mitigation |
|---|---|
| Building too much | Phased MVP (Phases 4-6) |
| PostgreSQL hosting cost | Local + Oracle Free Tier / Railway trial |
| OSM tile policy | Manual coords + external nav links in MVP |
| Arabic RTL issues | I18nManager.forceRTL + device test |
| Driver background location | Foreground only + manual status buttons |

## References
- https://github.com/fleetbase/fleetbase
- https://github.com/fleetbase/storefront-app
- https://github.com/fleetbase/navigator-app
- https://github.com/transistorsoft/react-native-background-geolocation

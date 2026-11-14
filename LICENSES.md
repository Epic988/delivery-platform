# License Audit

## Our project
- License: TBD by owner (default MIT for our own code).

## Investigated upstream projects (NOT used)
| Project | License | Constraint |
|---|---|---|
| fleetbase/fleetbase | AGPL-3.0 (or paid) | Source disclosure |
| fleetbase/storefront-app | AGPL-3.0 | Source disclosure |
| fleetbase/navigator-app | AGPL-3.0 + paid bg-geo | Paid for release |
| fleetbase/storefront | AGPL-3.0 | Source disclosure |

## Planned dependencies (verify at install)
| Dependency | License |
|---|---|
| Node.js | MIT |
| Fastify | MIT |
| Prisma | Apache-2.0 |
| PostgreSQL | PostgreSQL License |
| React Native | MIT |
| Expo | MIT |
| Next.js | MIT |
| Tailwind CSS | MIT |
| Leaflet | BSD-2-Clause |
| OpenStreetMap data | ODbL |

## Rules
- No paid license / trial / payment info.
- No secrets committed.
- AGPL deps reviewed before introduction.
- npm audit + license-checker before release.

## Status
- [x] Fleetbase / storefront / navigator licenses verified
- [ ] Dependency audit (post-install)
- [ ] Final review before deployment

# Delivery Platform — Sudan

منصة سودانية للتسوق من المتاجر المحلية وطلب توصيل الطرود، مع تطبيق للعميل وتطبيق للسائق ولوحة إدارة.

## Current implementation

- **Customer app:** Expo / React Native. Arabic-first bilingual UI, authentication, home, stores, products, cart, checkout, addresses, shopping orders, and courier requests.
- **Driver app:** Expo / React Native. Driver authentication, assignments, status updates, and proof of delivery.
- **Backend:** Fastify 5 + TypeScript + Prisma + PostgreSQL. Authentication, health, stores, products, categories, addresses, cart, shopping orders, courier orders, driver, and admin route modules.
- **Admin:** Next.js 16 + TypeScript. Admin application and store/product management foundations.
- **Shared package:** Shared API client, types, and design system.
- **Location entry:** Map picker with reverse-geocoding support; users must still enter local landmark/street details because map data in Al-Obeid is incomplete.

## Localization and operating model

- Arabic (RTL) primary; English secondary.
- Sudanese pound (SDG), Africa/Khartoum timezone, +249 phone numbers.
- Cash on delivery.
- Zero-budget deployment strategy; no paid API or mandatory paid service.

## Important status

The repository contains implemented application code; it is not at the original scaffold-only stage. However, do not describe the platform as production-ready until the current backend deployment, database migration, admin workflows, and real-device end-to-end flows have been verified.

## Repository layout

- `backend/` — Fastify API, Prisma schema/migrations, and tests
- `apps/customer/` — customer Android app
- `apps/driver/` — driver Android app
- `admin/` — Next.js admin dashboard
- `packages/shared/` — shared types, API client, and design tokens
- `.github/workflows/` — CI and Android build workflows
- `docs/` — setup, architecture, testing, and security notes

## Builds

Customer and driver Android APKs are built through GitHub Actions. Use the latest successful workflow artifacts; older debug APKs are not production releases.

## Before launch

1. Confirm backend and database deployment are healthy.
2. Apply and verify Prisma migrations on the target database.
3. Verify admin authentication and store/product/order workflows.
4. Run customer-to-driver order flows against the deployed API.
5. Build and test release-signed Android packages.
6. Configure production secrets outside Git.

## License

Project licensing is controlled by the repository owner. Review `LICENSES.md` before distribution.

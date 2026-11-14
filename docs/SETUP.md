# Setup

## 1. Neon PostgreSQL (Free tier)
1. Sign up at https://neon.tech (no credit card).
2. Create a project in the closest region.
3. Copy two connection strings:
   - **Pooled** -> DATABASE_URL
   - **Direct** -> DIRECT_URL
4. Both must include ?sslmode=require.

For Neon, edit backend/prisma/schema.prisma to add:
    directUrl = env("DIRECT_URL")

## 2. Local env
    cd D:\delivery-platform\backend
    Copy-Item .env.example .env
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Paste into .env as JWT_SECRET.

Never commit .env.

## 3. Install, generate, migrate
    npm install
    npx prisma generate
    npx prisma migrate dev --name init
    psql $env:DATABASE_URL -f prisma/sql/check-constraints.sql

## 4. Run
    npm run dev
    # http://localhost:3000/health

## 5. Tests
    npm test

## 6. Manual-address workflow
Address text is mandatory. Coordinates are optional. No fake coordinates.

## 7. Production hardening
- NODE_ENV=production requires explicit CORS_ORIGIN and JWT_SECRET >= 32 chars.
- Set TRUST_PROXY=true only behind a trusted proxy.

# TopUp Admin Console

Internal admin console for managing top-up transactions via Digiflazz.

## Stack
- Next.js 14 (App Router, TypeScript)
- Prisma + PostgreSQL
- NextAuth.js v5 (JWT, Credentials)
- Tailwind CSS, Zod, Vitest

## Local Setup

1. Install deps: npm install
2. Copy env: cp .env.example .env  (fill in all values)
3. Migrate DB: npm run db:migrate:dev
4. Seed admin: npm run db:seed
5. Start: npm run dev  ->  http://localhost:3000

Default login: owner / changeme123  (change immediately)

## Tests
  npm test
  npm run test:coverage

## Build & Deploy
  npm run build
  npm run db:migrate
  npm start

Requires HTTPS in production. Put behind nginx with SSL.
Never commit .env. Set DIGIFLAZZ_TESTING=false in production.

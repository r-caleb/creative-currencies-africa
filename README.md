# Creative Currencies Africa

Local monorepo for the Creative Currencies Africa platform.

## Stack

- `apps/frontend`: Next.js public website
- `apps/backend`: NestJS API
- Prisma ORM
- PostgreSQL local database, managed through pgAdmin

## Frontend Architecture

The frontend follows the same shape as `guichet-ressources-numeriques`:

- `apps/frontend/src/app`: Next.js App Router pages and global styles
- `apps/frontend/src/components`: shared layout and UI components
- `apps/frontend/public/assets`: public visual assets
- `@/*`: alias to `apps/frontend/src/*`

## Local Database

Create a PostgreSQL database in pgAdmin, for example:

```text
creative_currencies
```

Then copy the backend environment example:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Update `DATABASE_URL` with your local PostgreSQL credentials.

## Commands

```bash
npm install
npm run dev:frontend
npm run dev:backend
npm run prisma:generate
npm run db:migrate
```

No Docker setup is required.

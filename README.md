# Student Performance Dashboard

A student-performance website built with Next.js, TypeScript, Prisma, and PostgreSQL. The dashboard manages students, subjects, marks, and reports using a PostgreSQL database.

## Requirements

- Node.js 20.9 or newer (Node.js LTS recommended)
- npm

## Run locally on Windows

Open PowerShell in this project folder and run:

```powershell
npm install
npm run db:setup
npm run dev
```

Set `DATABASE_URL` in `.env` to your PostgreSQL connection string before setting up the database. Then open <http://127.0.0.1:5000/>. Running `npm run db:setup` creates the schema and seeds sample students, subjects, and marks if the database is empty.

To run the production build:

```powershell
npm run build
npm start
```

Run the API smoke test while the site is running:

```powershell
npm run test:api
```

## Database

The Prisma schema is in `prisma/schema.prisma`. Set `DATABASE_URL` to a PostgreSQL connection string. For example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

Use the connection string supplied by your PostgreSQL provider. Vercel Postgres and Neon URLs commonly include `?sslmode=require`; that parameter is supported by the PostgreSQL driver.

## Deploy to Vercel

Configure the project to use the PostgreSQL database connected to your Vercel deployment:

1. In Vercel **Settings → Environment Variables**, set `DATABASE_URL` to the PostgreSQL connection string provided by Vercel Postgres, Neon, or your connected provider. Add it to every environment where the app should work.
2. Push the Prisma schema to that database once. From PowerShell in the project folder, set the same connection string and run:

   ```powershell
   $env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
   npx prisma db push
   ```

Use the actual URL from your provider; keep it private and do not commit it. `DATABASE_URL` must be a PostgreSQL URL (`postgresql://` or `postgres://`), not a Turso/libSQL URL. Redeploy after setting the environment variable and pushing the schema.

## Features

- Overview with class averages, top performers, and recent marks
- Student and subject management with duplicate validation
- Assessment mark entry with mark-range validation and duplicate detection
- Reports with subject averages, student rankings, grades, and pass status
- Responsive dashboard layout
- Prisma-backed API routes under `/api/`

Deleting a student or subject also deletes its related marks. Data persists in the PostgreSQL database configured by `DATABASE_URL`.

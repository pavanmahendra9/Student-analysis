# Student Performance Dashboard

A student-performance website built with Next.js, TypeScript, Prisma, and Prisma Accelerate. The dashboard manages students, subjects, marks, and reports using a PostgreSQL database.

## Requirements

- Node.js 20.19 or newer (Node.js LTS recommended)
- npm

## Run locally on Windows

Open PowerShell in this project folder and run:

```powershell
npm install
npm run db:setup
npm run dev
```

Set `DATABASE_URL` to your Prisma Accelerate URL and `DIRECT_URL` to the direct PostgreSQL connection URL in `.env` before setting up the database. Then open <http://127.0.0.1:5000/>. Running `npm run db:setup` creates the schema and seeds sample students, subjects, and marks if the database is empty.

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

The Prisma schema is in `prisma/schema.prisma`. Configure both URLs:

```env
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

`DATABASE_URL` is the Prisma Accelerate URL used by the app at runtime. `DIRECT_URL` is a direct PostgreSQL connection used by Prisma CLI schema operations such as `db push`; it must not be a `prisma://` Accelerate URL.

## Deploy to Vercel

Configure the project to use Prisma Accelerate and a direct database connection:

1. In Vercel **Settings → Environment Variables**, set `DATABASE_URL` to the `prisma://` URL and `DIRECT_URL` to the direct PostgreSQL URL provided by your database/Prisma setup. Add them to every environment where the app should work.
2. Push the schema using the direct PostgreSQL URL. From PowerShell in the project folder, run:

   ```powershell
   $env:DIRECT_URL = "postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
   npx prisma db push
   ```

Use your actual URLs and keep them private; do not commit them. For the app, `DATABASE_URL` must use the Prisma Accelerate `prisma://` scheme. For `db:push`, set `DIRECT_URL` to the corresponding direct PostgreSQL connection URL (not the Accelerate URL). Redeploy after setting the environment variables and pushing the schema.

This project currently pins Prisma `8.1.0-dev.9`, a prerelease selected because the deployment platform requires Prisma 8. The npm configuration allows its prerelease peer dependency range with Prisma Accelerate; upgrade to a stable Prisma 8 release once one is published.

## Features

- Overview with class averages, top performers, and recent marks
- Student and subject management with duplicate validation
- Assessment mark entry with mark-range validation and duplicate detection
- Reports with subject averages, student rankings, grades, and pass status
- Responsive dashboard layout
- Prisma-backed API routes under `/api/`

Deleting a student or subject also deletes its related marks. Data persists in the PostgreSQL database configured by Prisma Accelerate.

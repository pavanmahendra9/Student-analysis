# Student Performance Dashboard

A student-performance website built with Next.js, TypeScript, Prisma, and SQLite/libSQL. The dashboard manages students, subjects, marks, and reports. Use local SQLite for development or a hosted libSQL database for deployments such as Vercel.

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

Open <http://127.0.0.1:5000/>. The database is created at `prisma/dev.db` and seeded with sample students, subjects, and marks. Running `npm run db:setup` again preserves existing student data; it only seeds an empty database.

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

The Prisma schema is in `prisma/schema.prisma`. The default `.env` uses a local SQLite file:

```env
DATABASE_URL="file:./prisma/dev.db"
```

The SQLite file is `prisma/dev.db`. Change `DATABASE_URL` if you want to use another supported Prisma database.

## Deploy to Vercel

Vercel's function filesystem is temporary and cannot be used for persistent SQLite records. For a Vercel deployment, connect the app to a hosted libSQL database such as Turso:

1. Create a Turso database and generate a database URL and auth token.
2. In your Vercel project's **Settings → Environment Variables**, set `DATABASE_URL` to the database URL (for example, `libsql://<database-name>-<organization>.turso.io`) and `TURSO_AUTH_TOKEN` to the generated token. Add them to every Vercel environment where the app should work, then redeploy.
3. Push the Prisma schema to the remote database once. From PowerShell in the project folder, set the same values and run:

   ```powershell
   $env:DATABASE_URL = "libsql://<database-name>-<organization>.turso.io"
   $env:TURSO_AUTH_TOKEN = "<your-auth-token>"
   npx prisma db push
   ```

Keep the auth token private and do not commit it. The default `file:./prisma/dev.db` URL is for local development only; it must not be used as Vercel's production database. The app reads `TURSO_AUTH_TOKEN` when connecting to a token-protected libSQL database; it is not needed for local SQLite.

## Features

- Overview with class averages, top performers, and recent marks
- Student and subject management with duplicate validation
- Assessment mark entry with mark-range validation and duplicate detection
- Reports with subject averages, student rankings, grades, and pass status
- Responsive dashboard layout
- Prisma-backed API routes under `/api/`

Deleting a student or subject also deletes its related marks. Locally, SQLite data is stored in `prisma/dev.db`; on Vercel, data persists in the configured hosted database.

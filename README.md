# Student Performance Dashboard

A local student-performance website built with Next.js, TypeScript, Prisma, and SQLite. The dashboard manages students, subjects, marks, and reports. Data is saved in a local SQLite database, so no MySQL server or browser-local storage is required.

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

## Features

- Overview with class averages, top performers, and recent marks
- Student and subject management with duplicate validation
- Assessment mark entry with mark-range validation and duplicate detection
- Reports with subject averages, student rankings, grades, and pass status
- Responsive dashboard layout
- Prisma-backed API routes under `/api/`

Deleting a student or subject also deletes its related marks. The SQLite database is local to this project and is not shared between machines.

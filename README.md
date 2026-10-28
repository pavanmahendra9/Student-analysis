# Student Performance Dashboard

A student-performance dashboard built with Next.js and TypeScript. It manages students, subjects, marks, and reports entirely in the browser, with no database or server-side API required.

## Requirements

- Node.js 20.19 or newer (Node.js LTS recommended)
- npm

## Run locally on Windows

Open PowerShell in this project folder and run:

```powershell
npm.cmd install
npm.cmd run dev
```

Open <http://127.0.0.1:5000/>. No database or environment variables are needed.

To run tests and build the static site:

```powershell
npm.cmd test
npm.cmd run build
```

The static site is generated in `out`.

## Deploy to Vercel

Import the repository into Vercel and deploy with the default Next.js build command, `npm run build`. Next.js exports a static site to `out`; no database, Vercel storage integration, or environment variables need to be configured.

## Record storage

Records are saved in the current browser's local storage. They remain available in that browser after reloads, but are not shared across browsers or devices. Clearing the browser's site data deletes the saved records. This app does not upload class data to a server.

## Features

- Overview with class averages, top performers, and recent marks
- Student and subject management with duplicate validation
- Assessment mark entry with mark-range validation and duplicate detection
- Reports with subject averages, student rankings, grades, and pass status
- Responsive dashboard layout
- Browser-local record management without an API or database

Deleting a student or subject also deletes its related marks from this browser's saved records.

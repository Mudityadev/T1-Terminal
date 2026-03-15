# T1 Terminal

T1 Terminal is a futuristic market-intelligence dashboard built with Next.js. It combines a command-center style interface with live-style feed updates, status indicators, analytics tracking, and an admin area for managing users and reviewing feedback.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Supabase (auth, feedback, analytics)
- Zustand (state)

## Features

- Live terminal-style home experience with animated UI components
- News/feed view and market-style visualization components
- Feedback modal backed by Supabase (`t1_feedback`)
- Visit tracking endpoint and analytics storage (`t1_analytics`)
- Login + admin pages for user and feedback workflows

## Project Structure

```text
src/
  app/                # Pages, layouts, and API routes
  components/         # UI and feature components
  lib/                # Business logic (analytics, engines, supabase)
  store/              # Zustand state stores
  data/               # Local mock/demo data
```

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Without valid Supabase values, feedback and analytics persistence will be disabled.

### 3) Start the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Available Scripts

- `npm run dev` — run local development server
- `npm run build` — build for production
- `npm run start` — start production server
- `npm run lint` — run ESLint checks

## Deployment

You can deploy this app on any platform that supports Next.js (for example Vercel).

For production, ensure your Supabase environment variables are configured in your hosting provider.

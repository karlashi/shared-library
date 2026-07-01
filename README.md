# 📚 Biblioteca Compartida

A shared library app for a small private group: list your own books, borrow from other
members, and keep track of who has what. Built with React, TypeScript, and Supabase.

## Features

- **Accounts** — email/password login and registration, gated behind auth (no public
  browsing)
- **Books** — add, edit, and delete books you own, with cover image upload
- **ISBN lookup** — fill in title, author, description, and cover automatically from an
  ISBN via the Google Books API
- **Tags** — autocomplete/suggestions from tags already used across the library
- **Lending** — owners lend books to other members and mark them returned; a book can't
  be lent out twice at once, and can't be deleted if it has any borrow history
  (protects everyone else's records)
- **Profile page** — edit your display name, see your own books, and view your full
  borrow/lending history
- **Search & sort** — search by title, author, or tag; sort by most recently added or
  alphabetically

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) +
  [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [Supabase](https://supabase.com/) — Postgres database, auth, and file storage
- [TanStack Query](https://tanstack.com/query) for data fetching/caching
- [react-hook-form](https://react-hook-form.com/) for form state and validation
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
  for tests

## Getting started

```bash
git clone <this repo>
cd biblioteca
npm install
```

Copy `.env.example` to `.env.local` and fill in your own values:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_BOOKS_API_KEY=
```

- Supabase URL/anon key come from your Supabase project's API settings.
- The Google Books API key is optional (ISBN lookup works without one at low volume, but
  a free key avoids rate-limit errors) — see
  [Google Cloud Console](https://console.cloud.google.com/) → enable "Books API" → create
  an API key.

Then start the dev server:

```bash
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Typecheck and build for production |
| `npm run test` | Run the test suite once |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview a production build locally |

## Deployment

Deployed on [Vercel](https://vercel.com/), connected to this repo's `main` branch.
Remember to set the same environment variables from `.env.local` in the Vercel project's
Environment Variables settings — the app fails fast at startup if they're missing.

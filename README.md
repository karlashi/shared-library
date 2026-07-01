# 📚 Biblioteca Compartida

A shared library app for a small private group: list your own books, borrow from other
members, and keep track of who has what. Built with React, TypeScript, and Supabase.

## Features

- **Accounts** — email/password login and registration, gated behind auth (no public
  browsing); self-service account deletion from the profile page (anonymizes your name,
  archives your books, and disables login — see the privacy notice on the About page)
- **Books** — add, edit, archive, or delete books you own, with cover image upload
- **ISBN lookup** — fill in title, author, description, and cover automatically from an
  ISBN via the Google Books API, either typed in or scanned with your device's camera
- **Tags** — collaborative: any member can tag any book, with autocomplete/suggestions
  from tags already used across the library
- **Lending** — owners lend books to other members and mark them returned; a book can't
  be lent out twice at once, and can't be deleted if it has any borrow history
  (protects everyone else's records)
- **Gift/sale marking** — mark a book as free-to-take or for sale, with an optional
  comment, visible on its card and detail page
- **Wishlist** — privately mark any book you'd like to borrow eventually; only you can
  see your own list, from your profile page
- **Profile page** — edit your display name, see your own books (including archived and
  wishlisted ones), and view your full borrow/lending history
- **Stats page** — a quick overview of the library: active/archived books, members,
  and loan counts
- **Search & sort** — search by title, author, or tag; sort by most recently added or
  alphabetically
- **Admin roles** — designated admins can edit, archive, delete, or force-return any
  book/loan in the library (for cleaning up after an inactive member), granted manually
  via the database — there's no self-service way to become an admin
- **Changelog page** — a public "Novedades" page summarizing what's shipped, linked next
  to About
- **Translatable UI** — all interactive text lives in `src/i18n/` as a dictionary
  (`react-i18next`), currently shipping Spanish only. To add another language: copy
  `src/i18n/locales/es.json` to e.g. `en.json`, translate the values, and register it in
  the `resources` object in `src/i18n/index.ts`. (The About/Changelog pages' prose and the
  `books.status` database values are intentionally left as plain Spanish rather than pulled
  into the dictionary — that content is specific to this deployment, not reusable UI text.)

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) +
  [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [Supabase](https://supabase.com/) — Postgres database, auth, and file storage
- [TanStack Query](https://tanstack.com/query) for data fetching/caching
- [react-hook-form](https://react-hook-form.com/) for form state and validation
- [react-i18next](https://react.i18next.com/) for the translation dictionary
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) for the camera barcode scanner
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

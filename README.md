# 📚 Biblioteca Compartida

**Share physical books with your community — in your own language.**

This started from a simple, annoying problem: finding books in Spanish in Germany is
hard and expensive. I met a small group of Spanish speakers near where I live and wanted
a way for us to pool what we already own, lend books to each other, and actually keep
track of who has what — without turning it into a marketplace, and without losing a book
to "I forgot who I lent that to six months ago."

It's built to outgrow that one group. The translation groundwork exists because a
Brazilian community nearby could use the exact same thing in Portuguese — and the idea
generalizes to any group that shares a language, a building, a classroom, or a
neighborhood, and would rather borrow a book from someone nearby than pay import prices
for one they'll read once. The project is currently private while it's still just my own
group using it day to day, but the plan is to open it up so other communities can fork
and self-host their own instance.

## Highlights

- 📚 **Community library** — a shared catalog, multiple members, lending with a full
  loan history, wishlists, and gift/sale marking with a one-click ownership transfer once
  a book actually changes hands
- 📖 **Rich book metadata with minimal typing** — scan a barcode or type an ISBN to
  auto-fill title, author, cover, and description (Google Books, with an Open Library
  fallback); collaborative tags anyone can add; a bulk editor that surfaces every
  incomplete book so gaps get filled instead of forgotten
- 🔍 **Easy discovery** — search by title, author, or tag; filter by availability or
  gift/sale status; sort by newest or alphabetical; hide your own books by default so the
  grid shows what you could actually borrow
- 👤 **Community management** — email/password accounts, profiles, admin roles for
  cleaning up after an inactive member, and self-service account deletion that respects
  everyone else's loan history
- 🌐 **Built to be forked into another language** — all UI text lives in one translation
  dictionary; adding a new language is copying one file and translating it, not hunting
  through the codebase

## Features

- **Accounts** — email/password login and registration, gated behind auth (no public
  browsing); self-service account deletion from the profile page (anonymizes your name,
  archives your books, and disables login — see the privacy notice on the About page)
- **Books** — add, edit, archive, or delete books you own, with cover image upload
- **ISBN lookup** — fill in title, author, description, and cover automatically from an
  ISBN via the Google Books API, either typed in or scanned with your device's camera;
  falls back to Open Library for a missing cover/description when Google Books doesn't
  have one
- **Fast bulk scanning** — "Guardar y añadir otro" on Add Book saves and resets the form
  (refocusing the ISBN field) so the next scan can start immediately, without navigating
  away. Books missing a cover, description, age recommendation, or tags get a ⚠️ badge and
  a "Solo incompletos" filter on the home grid, plus a dedicated bulk editor (`/bulk-edit`)
  to fill in the gaps for several books at once, with a per-book "retry the lookup" button
- **Tags** — collaborative: any member can tag any book, with autocomplete/suggestions
  from tags already used across the library, fully keyboard-navigable (arrow keys/Tab to
  highlight a suggestion, Enter to confirm)
- **Lending** — owners lend books to other members and mark them returned; a book can't
  be lent out twice at once, and can't be deleted if it has any borrow history
  (protects everyone else's records)
- **Gift/sale marking & ownership transfer** — mark a book as free-to-take or for sale,
  with an optional comment; once it's actually handed off, the owner (or an admin) can
  transfer it to the new owner in one action, which also clears the listing
- **Wishlist** — privately mark any book you'd like to borrow eventually; only you can
  see your own list, from your profile page
- **Profile page** — edit your display name, see your own books (including archived and
  wishlisted ones), and view your full borrow/lending history
- **Stats page** — a quick overview of the library: active/archived books, members,
  and loan counts
- **Search & sort** — search by title, author, or tag; filter by availability status or
  gift/sale marking; sort by most recently added or alphabetically; toggle "Solo
  incompletos" and "Ocultar mis libros" (on by default, so the home grid focuses on what
  you could borrow from others) narrow the grid further
- **Admin roles** — designated admins can edit, archive, delete, or force-return any
  book/loan in the library (for cleaning up after an inactive member), granted manually
  via the database — there's no self-service way to become an admin
- **Changelog page** — a public "Novedades" page summarizing what's shipped, linked next
  to About
- **Translatable UI** — all interactive text lives in `src/i18n/` as a dictionary
  (`react-i18next`), currently shipping Spanish only. To add another language: copy
  `src/i18n/locales/es.json` to e.g. `pt.json`, translate the values, and register it in
  the `resources` object in `src/i18n/index.ts`. (The About/Changelog pages' prose and the
  `books.status` database values are intentionally left as plain Spanish rather than pulled
  into the dictionary — that content is specific to this deployment, not reusable UI text.)
- **Reliability** — a top-level error boundary catches unexpected render errors and shows
  a friendly reload screen instead of a blank page; the barcode scanner is lazy-loaded so
  its dependency doesn't bloat the initial page load

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) +
  [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [Supabase](https://supabase.com/) — Postgres database, auth, and file storage
- [TanStack Query](https://tanstack.com/query) for data fetching/caching
- [react-hook-form](https://react-hook-form.com/) for form state and validation
- [react-i18next](https://react.i18next.com/) for the translation dictionary
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) for the camera barcode scanner
- [Open Library](https://openlibrary.org/dev/docs/api/books) as a free fallback source for
  covers/descriptions Google Books doesn't have — no API key needed
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

## Roadmap

- [x] Transfer ownership when a book is given away or sold
- [ ] Let a member signal they'd like to borrow a book, visible to its owner
- [ ] Better search matching (typos, accents, description text — not just exact tag
      matches)
- [ ] Availability/reservation status once a library has enough members for it to matter
- [ ] A second language file, once there's a community ready to use it

## History

See [CHANGELOG.md](./CHANGELOG.md) for a technical history of what's been built and why.
(There's also a Spanish, user-facing version in the app itself, under "Novedades".)

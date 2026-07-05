# Changelog

A technical history of this project, grouped by day. For a user-facing summary in
Spanish, see the in-app "Novedades" page (`/changelog`). For full detail on any entry,
`git log` has the complete commit messages this file summarizes.

## 2026-07-02

- **Transfer ownership** — owner or admin can hand a book to another member from its
  detail page (blocked while it's on loan, clears any gift/sale marking on success). No
  RLS changes needed; the existing owner-or-admin `books` UPDATE policy already covered it.
- **README rewrite** — restructured around the project's actual motivation (scarce/
  expensive Spanish-language books in Germany) instead of opening straight into a feature
  list; added a Roadmap section.
- Replaced the leftover scaffold favicon/tab title with the app's own branding.
- **Account deletion now also blocks while borrowing.** The original guard only checked
  outbound loans (books you own that are lent out); a user could delete their account
  while still holding someone else's borrowed book, leaving the owner unable to tell who
  has it once the borrower's name was anonymized. Added a symmetric check on
  `l.borrower_id` alongside the existing `b.owner_id` one, in the same
  `delete_own_account()` function — no application code changes needed, since the
  frontend already surfaces the raised Postgres exception message directly.
- **Book comments** — descoped from a full star-rated review system to free-text personal
  reactions on a book's detail page, alongside the existing API-sourced description. New
  `book_comments` table (`book_id` cascades on book delete, mirroring `book_tags`).
  Permissions are deliberately narrower than tags: only the comment's author can edit or
  delete it, plus an admin can delete (moderation) — the book's *owner* has no special
  rights here, unlike tags, since this is meant to be a personal voice, not something the
  owner curates.
- **Prev/next navigation on the book detail page.** Browsing the gallery meant click a
  book, "Volver" back to the grid, find your place, click the next one. `BookCard` now
  passes the current gallery order (post search/filter/sort) as router state on
  navigation; the detail page reads it to show Anterior/Siguiente plus a "3 de 12"
  position indicator, stepping through exactly what was on screen. Falls back to all
  active books, most-recent-first, when there's no router state (direct link, shared URL,
  or a page refresh).
- **Book categories (data only, no UI yet).** Added a plain `category` column to `books`
  and hand-categorized the full active catalog (53 books) into a small curated set —
  Infantil, Juvenil, Adultos, Cómic/Novela gráfica, Poesía, Arte, Aprendizaje de idiomas —
  deliberately separate from the existing collaborative `tags`: categories are broad,
  single-value, and curated; tags stay free-form and multi-value. Done directly via SQL,
  not through any automated/LLM process — no Add/Edit form field or Home filter yet, that's
  intentionally a separate, later pass.
- **Cover uploads moved into the bulk editor itself.** Filling a missing cover from
  "Completar libros" meant leaving for that book's Edit page, which discarded any unsaved
  edits on every other row (all local component state). The "Sin portada" placeholder is
  now a file input that uploads inline, reusing the same `validateImageFile`/
  `uploadCoverImage` used on Add/Edit Book, writing into the same per-row local state as
  description/age/tags so it saves together with everything else.

## 2026-07-01

The single largest day — foundation work in the morning, then a long run of scoped
feature passes, each planned, built, and verified independently.

**Polish batch:**
- Adopted Tailwind CSS v4 (`@tailwindcss/vite`, no config file) and did a real responsive
  pass across every page; fixed a leftover Vite-template layout bug in `index.css`.
- Adopted `react-hook-form` across all forms with inline validation.
- Set up Vitest + React Testing Library with an initial suite targeting the trickiest
  existing logic (`validateImageFile`, `TagInput`, `deleteBook`'s loan-history guard).
- Book deletion (the RLS policy already allowed it, nothing called it), cover cleanup on
  replace/delete, upload validation.

**Tier 1 — quick wins:**
- Readable transaction-history cards with status badges, recent-first sort by default,
  a public `/about` page, first real README.

**Tier 2a — navigation & listings:**
- Shared header with burger menu on mobile, floating back-to-top button.
- Gift/sale marking (`listing_type`/`listing_comment`) and an `archived` flag separate
  from deletion (keeps loan history, pulls a book out of the public grid).
- `/stats` page (counts derived entirely from already-loaded data).

**Tier 2b — collaborative tags:**
- New `book_tags` table (`book_id`, `tag`, `added_by`) replacing the old `text[]` column,
  so removal permission (adder or book owner) can be enforced via RLS.

**GDPR / account lifecycle:**
- Self-service account deletion via a `SECURITY DEFINER` Postgres function: anonymizes
  the profile name, archives owned books, disables login — rows stay in place so other
  members' loan/tag history isn't affected. Blocked while the account has books out on
  loan to someone else. Added a short privacy notice to the About page.

**Tier 3 — wishlist, scanner, i18n, admin roles:**
- Private wishlist (RLS-scoped so entries are visible only to their owner, not the
  book's owner).
- Camera barcode scanner (`html5-qrcode`, restricted to EAN-13) feeding the existing
  Google Books lookup; same-day fix for a real race condition that crashed the whole app
  to a blank page after a successful scan (double-teardown on an idempotent `stop()`).
- Public "Novedades" changelog page.
- `react-i18next` dictionary infrastructure — ~100 strings externalized to
  `src/i18n/locales/es.json`, Spanish-only for now but structured so a fork can add a
  language by translating one file.
- Admin roles (`profiles.is_admin` + RLS bypass on `books`/`loans`) for cleaning up after
  an inactive member.
- Top-level React error boundary (the barcode-scanner crash above exposed there was none)
  and lazy-loading the scanner's dependency, cutting the main bundle from ~975KB to ~606KB.

**Bulk-scanning workflow:**
- "Guardar y añadir otro" on Add Book — save and reset the form instead of navigating
  away, for scanning several books in a row.
- Completeness tracking (missing cover/description/age/tags flagged with a badge and a
  filter) plus a `/bulk-edit` page to fill gaps across several books at once.
- Open Library fallback for a missing cover or description when Google Books doesn't
  have one — verified against the real API that cover-existence checks are reliable but
  per-edition descriptions are inconsistently present, so treated as best-effort.
- "Ocultar mis libros" (on by default) and gift/sale filtering on the home grid; several
  follow-up fixes (title/author fallback when there's no ISBN, clearer feedback when a
  lookup finds nothing, merging filters into fewer dropdowns).
- Keyboard navigation (Tab/arrows + Enter) for the tag-suggestion dropdown.

## 2026-06-30

- Initial scaffold, then a foundation refactor: environment variables instead of
  hardcoded Supabase credentials, real TypeScript types, a single `AuthContext`
  replacing four independent `auth.getUser()` calls, React Query adoption.
- Login/register page and app-wide auth gating (`RequireAuth`), with defensive
  profile creation on first authenticated load.
- Vercel SPA rewrite (client-side routes were 404ing on direct visit/refresh).
- Profile page: editable name, own books, full loan history, and the first "mark as
  returned" action anywhere in the app.
- Prevented double-lending a book that's already out; surfaced borrow/return dates.
- Restricted book editing to owners; excluded the owner from their own "lend to" list.
- ISBN lookup via Google Books (title/author/description/cover auto-fill).
- Tag autocomplete, derived from existing books' tags (no new table yet — that came
  later with collaborative tags).


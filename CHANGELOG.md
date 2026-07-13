# Changelog

A technical history of this project, grouped by day. For a user-facing summary in
Spanish, see the in-app "Novedades" page (`/changelog`). For full detail on any entry,
`git log` has the complete commit messages this file summarizes.

## 2026-07-13

- **Multi-select language field (filter + badge + forms).** Books can be in more than one
  language (e.g. a bilingual edition), so unlike `category` (single-value dropdown) this
  needed a checkbox multi-select. Added `books.languages text[]` (codes `es`/`de`/`en`/
  `pt`, routed through i18n like category); a new reusable
  `src/components/LanguageCheckboxes.tsx` used identically across Add/Edit/Bulk Edit
  forms, a Home filter (match-*any*-selected-language), and one badge per language on
  each book card. Deliberately not folded into `isBookIncomplete()` — all 53 existing
  books would've instantly flipped to "incomplete" overnight, unlike category which was a
  no-op there; the checkboxes still appear on Bulk Edit rows regardless. Also **not**
  backfilling existing books' languages — unlike category, guessing every book's
  language(s) from title/author isn't reliable enough to do unattended.
- **Fixed invalid nested-`<label>` HTML found while building the above.** Wrapping the new
  checkbox group in the same `<label className="block">` pattern used for every other
  form field (fine for a single `<select>`/`<input>`) put a field-level label around
  several already-labelled checkboxes — invalid HTML, and it broke each checkbox's
  accessible name (the first checkbox absorbed the whole group's text). Fixed by using a
  plain `<div>` for the field wrapper in these three spots specifically, since each
  checkbox already has its own correct inner `<label>`.

## 2026-07-12

- **Split "Mis libros" out of the Profile page into its own page (`/my-books`).**
  Scrolling past a growing book collection to reach loan history at the bottom of Mi
  Perfil was getting annoying. Moved the owned/archived book grids verbatim into a new
  `MyBooksPage.tsx`; `ProfilePage.tsx` keeps the name form, pending-approval admin
  section, wishlist, borrow/lend history, and account deletion. New nav item positioned
  right after "Mi perfil".
- **Quick "🚫 Marcar fuera de circulación" toggle on the book detail page.** That status
  already existed (filterable on Home, shown as a badge) but nothing in the UI ever set
  it — confirmed only `AddBookPage` writes `status`, always as `'Disponible'`. Added an
  owner-only toggle (only when the book isn't currently out on loan) via a new
  `useSetBookStatus` mutation mirroring `useSetArchived`, so an owner can flag "I'm
  reading this right now, don't ask to borrow it" and revert it just as easily.
- **Renamed "Completar libros" → "Completar datos de libros."** The original name read
  like completing a collection rather than filling in missing book data.
- **Category added to the Bulk Editor.** `isBookIncomplete()` now also flags a missing
  `category`, so books lacking one surface on `/bulk-edit` alongside the existing
  cover/description/age/tags checks (a no-op for the current catalog — all existing books
  already have a category — but means future books added without one get caught here
  automatically). Same category `<select>` already used on Add/Edit Book, reused as-is.
- **Fixed cover uploads silently failing for filenames with accents or spaces.**
  `uploadCoverImage` (`src/services/storage.ts`) built the storage key as
  `${uuid}-${file.name}` — Supabase Storage rejects keys containing non-ASCII characters
  (ó, ñ, etc.) or spaces with `Invalid key`, so any cover whose original filename had them
  (extremely common for Spanish-named files) failed, surfacing only a generic "error
  saving book" alert with no indication the filename itself was the cause. Fixed by using
  only the UUID plus the file extension as the key, dropping the original filename
  entirely — reproduced the exact failure with a real problematic filename and confirmed
  the fix.

## 2026-07-08

- **Admin activity page (`/activity`).** All loan history was previously only visible
  per-user, split across each member's own Profile page. Added a page listing every loan
  across the whole library (book, owner, borrower, borrowed/returned dates, active/
  returned status), sorted most-recent-first, admin-only (nav link and route both gated
  on `profile.is_admin`, same pattern as `EditBookPage`'s owner-or-admin guard). No new
  queries needed — reuses `useAllLoans()` (already unscoped to the current user) plus the
  same `getBookById`/`getProfileName`/`formatDate` helpers already used in
  `ProfilePage.tsx`. Ownership-transfer history explicitly out of scope for this pass —
  transfers currently overwrite `owner_id` with no history kept, so that would need a new
  audit table.

## 2026-07-05

- **Fixed a live privilege-escalation hole.** Any authenticated user could set their own
  `profiles.is_admin` to `true` — the update policy only checked `auth.uid() = id`, with
  no restriction on which columns could change, and RLS/column grants don't stop a client
  from calling the API directly regardless of what the UI exposes. Confirmed the hole was
  real by signing in as a disposable test account and running the update directly against
  the API. Fixed with a `before update` trigger on `profiles` that reverts any change to
  `is_admin` made by the `authenticated` role, leaving direct/service-role SQL (how admin
  status is granted today) unaffected. Verified the same disposable-account attack no
  longer works post-fix.
- **Fixed member email exposure.** While testing the above, discovered `profiles` has an
  `email` column the app's TypeScript types didn't declare — since `useProfiles()` did
  `select('*')` and the table's SELECT policy is permissive for any authenticated member,
  every member's real email was reachable by any other member via the network response,
  even though the UI never displayed it. Switched all `profiles` queries to explicit
  safe columns (`id, name, is_admin, approved`) and locked it down at the grant level:
  `revoke select on profiles from authenticated, anon` + `grant select (id, name,
  is_admin, approved)` — a plain per-column `revoke` turned out to be a no-op against a
  pre-existing table-wide grant, confirmed by checking `pg_attribute.attacl` directly.
- **New-member approval gate, read-only until approved.** Registration was previously
  wide open with no review step. Added `profiles.approved` (existing members
  grandfathered to `true`), and required it in the `with check` of every write-causing
  insert policy — `books`, `book_tags`, `book_comments`, `loans`, `wishlist` — enforced at
  the database layer, not just hidden in the UI. Reads stay open to any authenticated
  member, by design: an unapproved member can fully browse/search/filter the catalog, just
  can't add books, lend/borrow, tag, or comment until approved, so the wait doesn't kill
  their interest. New "Miembros pendientes de aprobación" section on the Profile page
  (admin-only) lists anyone awaiting approval with a one-click "Aprobar" button.

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
- **Category filter, card badge, and Add/Edit form field** — the UI layer on top of the
  categorization pass above. Migrated the stored values from literal Spanish text to
  stable codes (`infantil`, `juvenil`, etc.), matching how `listing_type` already works,
  so labels route through i18n instead of being baked into the database. Home now has a
  third, separate filter dropdown for category (kept distinct from the existing status
  filter — different axis, confirmed with the user rather than folding it in); each book
  card shows a small category badge; Add/Edit Book both gained a category `<select>` so
  new books get categorized going forward and existing ones can be corrected without a
  manual SQL pass.
- **Fuzzy, multi-field search.** At 50+ books, exact substring matching against
  title/author/tags was missing real hits — tags came from ChatGPT's original suggestions
  rather than a controlled vocabulary, so a search for "miedo" wouldn't find a book only
  tagged "terror". Replaced the matching logic with `Fuse.js`, weighted across
  title/author/tags plus, newly, `description` (natural-language text tends to carry more
  of the synonyms someone might actually type than a handful of curated tags). Fuse is
  used only to decide inclusion, not to reorder results, so the existing recent/title sort
  — and therefore the prev/next `navList` order on the detail page — is unaffected. Also
  fixes a latent case-sensitivity bug in the old tag matching. Explicitly not attempting
  synonym mapping or embedding-based semantic search — flagged as unnecessary complexity
  at this catalog size.
- **Clearer filter dropdowns.** The status and category filters both defaulted to showing
  "Todos" with no visual indication of which axis each one filtered. Added a small label
  above each (`Estado` / `Categoría`), distinct "all" option text per dropdown, and an
  `aria-label` on each `<select>` (previously unlabeled for screen readers).

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


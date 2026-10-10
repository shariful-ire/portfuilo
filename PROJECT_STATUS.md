# Project status

## Current delivery status - 2026-10-10

Local usability follow-up completed: resolved Atlas DNS failures, generated missing server secrets, saved the confirmed admin email server-side and phone/WhatsApp in published settings, created three real homepage section records, improved footer/dashboard discovery, and fixed browser warnings. The user's running localhost server now returns contact tokens (200), renders the sections and phone, and shows no unavailable banner. Lint, typecheck, build, 86 tests, browser checks, and client-secret scan passed. Google OAuth and Cloudinary credentials still must be supplied before real dashboard login and uploads can work. No public deployment.

## Step 1 — Foundation

Implemented on 2026-10-02. Workspace inspection found no existing application or project instructions.

### Completed

- Next.js App Router application with strict TypeScript, Tailwind v4, ESLint flat config, and exact dependency versions / npm lockfile.
- Maintainable `app`, `components/ui`, `components/layout`, `config`, and `lib` structure.
- Midnight navy / charcoal design tokens, restrained cyan accents, typography, spacing, borders, visible focus, and reduced-motion styles.
- Reusable Button, Card, Input, Textarea, and PageContainer.
- Responsive header, disclosure-style mobile navigation with Escape support, skip link, and footer.
- Requested hero and introduction, confirmed education, GitHub links, explicitly empty project / certificate sections.
- Loading, retryable error, and not-found interfaces.
- README and `.env.example`; unknown personal details remain hidden.

### Dependency compatibility

- Next.js / eslint-config-next 16.3.8; React / React DOM 19.3.0.
- Tailwind / Tailwind PostCSS 4.3.3; ESLint 9.39.5; TypeScript 5.9.3.
- Official Next.js and Tailwind installation documentation reviewed; installed Next.js package peer requirements verified. Node 22.23.2 satisfies Next.js's Node >=20.9 requirement.
- TypeScript 7 was rejected by the ESLint parser during validation and replaced with compatible stable TypeScript 5.9.3.

### Checks

- `npm run typecheck`: passed.
- `npm run build`: passed; homepage and not-found route prerendered. Build required permission to spawn workers outside the sandbox after an EPERM failure.
- Production HTTP smoke checks: passed for homepage 200, missing route 404, CSS delivery, owner identity, empty sections, mobile disclosure markup, and absence of identity placeholders.
- npm install audit: zero known vulnerabilities reported.
- `npm run lint`: passed with zero warnings after correcting the PostCSS anonymous-export warning.
- Browser visual, screen-reader, and interactive keyboard tests were not run. Responsive layouts and accessibility behavior were reviewed in source.

### Configuration requirements

No credentials are needed to run this step. `.env.example` reserves MongoDB, Better Auth, Google OAuth, admin email, and Cloudinary configuration for future integration steps. All secrets must remain server-only. Unknown city, contact channels, photo, CV, and admin Gmail must be supplied before use.

There is no authentication, admin dashboard, database CRUD, upload integration, 3D, or localStorage content database. Empty sections are presentation only; persistent editing will require MongoDB in a later step.

### Next step

Step 2 has been implemented below. Do not implement future features until requested.

## Step 2 — Persistent data foundation

Implemented on 2026-10-02. Step 1 public UI preserved; database readers are available for future server rendering, not wired into the static homepage yet.

### Completed

- Lazy reusable MongoClient pool, bounded timeouts, failed-connection retry, explicit configuration/unavailability errors, and server-only database modules.
- Typed collections and Zod models for all ten requested collections: profiles, site settings, homepage sections, projects, certificates, posts, skills, timeline entries, media, contact messages.
- UUID IDs, creation/update timestamps, draft-by-default publication status, display order, immutable ID/creation-time preparation helpers.
- Typed discriminated registry for rich text, image-and-text, gallery, projects, certificates, posts, skills, timeline, and CTA.
- Index definitions and explicit setup command: unique project/post slugs, singleton profile/settings keys, ordered public queries, unique media provider assets, timeline kinds, private inbox state/date.
- Public readers enforce published status, bounded pagination, field projections, schema validation, safe serialization, and runtime collection allowlisting. Drafts, contact messages, private media provider metadata, and unknown fields are excluded.
- MongoDB connection-check CLI, README operating instructions, and updated `.env.example`. No public mutation endpoints or simulated persistence.

### Dependencies

- MongoDB 7.7.0, Zod 4.6.5, server-only 0.0.1; tsx 4.23.15 for tests/CLI; @next/env 16.3.8 matching Next.js.
- Official MongoDB pooling and Zod documentation reviewed; package requirements checked. MongoDB requires Node >=20.19; project standard is now Node >=22 (tested on 22.23.2).
- Install audit reported zero known vulnerabilities.

### Checks

- Lint and typecheck passed after resolving introduced type errors.
- Production build passed, preserving the static homepage and not-found output.
- All nine data regression tests passed, including validation, draft/privacy exclusion, timestamp immutability, section payloads, index definitions, missing configuration, and reader query/error-path adapter coverage.
- `npm run db:check`: correctly exited unsuccessfully with an explicit missing-MongoDB-configuration message. No `.env.local` is present.
- Live connectivity, index creation, and database-enforced uniqueness are **not verified** without MongoDB credentials. Unit fixtures and mocked query checks do not represent successful database operations.
- Test/build workers required execution outside the sandbox after EPERM failures.

### Configuration requirements

Set server-only `MONGODB_URI` and `MONGODB_DB_NAME` in `.env.local`, then run `npm run db:check` and `npm run db:indexes`. Index setup needs suitable database permissions and must succeed before future writes. No database was seeded and no records were created during this step. Future write paths must validate through the preparation helpers and enforce authorization.

### Next step

Step 3 is implemented below. Live MongoDB verification remains pending configuration.

## Step 3 — Google authentication and authorization

Implemented on 2026-10-03. Existing portfolio content and data foundation preserved; no content CRUD or uploads added.

### Completed

- Better Auth 1.7.7 with matching MongoDB adapter 1.7.7, verified against official documentation and published package peer requirements for Next.js 16, React 19, and MongoDB 7. Installation audit reported zero known vulnerabilities.
- Lazy server-only auth initialization, Google sign-in, POST logout, persistent MongoDB sessions, seven-day expiration and one-day refresh interval. Cookie session caching disabled; Google OAuth tokens encrypted in storage.
- Shared `requireAdmin()` reads request headers and validates the server session, expiration, ownership, verified email, server-only `ADMIN_EMAIL`, and linked Google account. It accepts no browser-provided identity or role. No global session/authorization result caching.
- Email/password sign-in, email changes, and account linking disabled. Better Auth's OAuth state, origin/CSRF checks, and HTTP-only cookies retained; HTTPS origins use Secure cookies. Auth requests use persistent database rate limiting.
- Protected `/dashboard` and `/dashboard/account`, each guarded independently in addition to their shared layout. Responsive dashboard navigation, sign-in and access-denied screens, and logout controls.
- Authorized-admin toolbar on the existing public homepage. Homepage is now dynamic so private toolbar state cannot enter a shared static page.
- Missing configuration/outages fail closed: dashboard redirects, sign-in explains unavailability, auth endpoints return safe 503 responses, public page remains usable without a toolbar.
- README and `.env.example` document credentials, exact callback paths, local/production origins, session behavior, and the requirement that every future privileged mutation/upload call `requireAdmin()` before side effects. Record-preparation helpers remain pure and do not authorize writes.

### Checks

- All 19 regression tests passed (10 auth tests and 9 existing data tests). Auth cases include allowed admin, unauthenticated request, another account with spoofed admin role, unverified email, non-Google account, expired/invalid session, ownership mismatch, missing/replaced allowlist, backend failures, and missing configuration.
- Type checking passed for the auth implementation.
- Final lint (zero warnings), typecheck, and production build passed after correcting the logout-navigation warning.
- Production HTTP smoke checks passed: public homepage/no toolbar, both protected pages redirecting without private content even with forged identity headers/cookie while unconfigured, honest sign-in configuration screen, access-denied screen, and auth get-session/sign-out returning 503 without a session cookie.
- Next.js may send protected-page redirects as streamed meta redirects with HTTP 200 after the loading shell; protected content is not rendered. This page behavior does not replace the mandatory authorization guard or 401/403 responses for future mutation APIs.
- Test/build commands required worker execution outside the sandbox after EPERM errors.
- Live Google callback, persisted sessions across restart, actual session revocation/logout, and signed-in toolbar rendering remain **unverified** without real OAuth/MongoDB configuration. Unit fixtures and unavailable-service HTTP tests do not claim successful authentication.

### Configuration requirements

`.env.local` exists, but the secret-safe configuration check found `MONGODB_URI`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `ADMIN_EMAIL` missing. Database name and base URL are set. No secrets were read into output or changed.

Set all required server variables, then restart. For local development use `npm run dev`, `BETTER_AUTH_URL=http://localhost:3000`, and register **http://localhost:3000/api/auth/callback/google** in Google's Web application OAuth client. Add the admin as a Google OAuth test user if the app is in testing mode. In production, use an HTTPS origin and register **https://YOUR_ACTUAL_DOMAIN/api/auth/callback/google**, replacing the domain. Production rejects an HTTP auth origin. The auth MongoDB user needs read/write and index-creation permissions because the installed adapter ensures its own indexes automatically.

### Next step

Step 4 is implemented below. Live Google/MongoDB verification still requires configuration.

## Step 4 — Secure uploads and profile settings

Implemented on 2026-10-03. Cloudinary 2.11.0 is pinned; official upload documentation and installed SDK typings/runtime compatibility were reviewed. Install audit reported zero known vulnerabilities.

### Completed

- Protected `/dashboard/settings` with all requested profile, contact, education wording, availability, image/CV, and site metadata fields. Short name is editable as well. `ADMIN_EMAIL` stays server-only and extra fields are rejected.
- `POST /api/admin/media/signature`, `PUT/DELETE /api/admin/media/[id]`, `GET /api/admin/media`, and `PUT /api/admin/settings`. Every privileged endpoint uses `requireAdmin`; mutations also enforce the configured Origin and bounded request bodies.
- Admin-authorized, five-minute single-use HMAC proxy upload tickets persisted in `mediaUploads`. The actual Cloudinary upload signature is generated on the server only after byte validation. Cloudinary keys/secrets/provider signatures never reach the browser.
- JPEG/PNG/WebP (5 MiB) and PDF (10 MiB), with browser validation, bounded streaming, magic-byte/type checks, and Cloudinary result validation. Unsupported formats and SVG are rejected.
- Local previews, transfer progress, separate processing status, failed-upload guidance, refreshable media list, and explicit confirmed deletion. Missing Cloudinary configuration disables upload/deletion with setup guidance.
- Persistent media metadata and operational upload records/indexes. Unique server-generated provider IDs with overwrite disabled; no remote mutation uses a browser-supplied URL/provider key.
- Transactional settings saves and media finalization. Reference writes lock the same media upload record used by deletion. All current reference-bearing collections, including draft references, are checked before deletion.
- Replacements retain old assets. Remote deletion must succeed before metadata is removed; failed deletion stays retryable. Pending/failed upload records survive for cleanup; recent uploading/failed records wait ten minutes before deletion. No silent orphan cleanup or fake success.
- Public hero, about, contacts/footer, header short name, title/description, Open Graph, and Twitter metadata read saved published settings. Blank optional fields stay hidden; profile/CV references resolve only published matching media types. Biography renders as escaped plain text.
- Dynamic root layout/request-scoped reads and path revalidation after save/deletion. When MongoDB is unavailable the public homepage explicitly reports that confirmed owner defaults are being shown; the editing form does not load a fake successful database state.
- Updated README and `.env.example` with Cloudinary setup, PDF delivery, transactional MongoDB requirement, host request-size limits, and recovery behavior.

### Checks

- All 30 tests passed: existing auth/data regressions plus file policy/sniffing, bounded body reads, ticket ownership/expiry/tampering/replay, forbidden admin fields/unsafe contact URLs, configuration failures, reference scans/locks, and transactional settings-write adapters.
- Final lint (zero warnings), typecheck, and production build passed, including the best-effort upload-failure bookkeeping fix. Initial SDK type/React lint errors were corrected.
- Production HTTP checks passed for explicit public fallback, hidden missing contact/CV fields, protected settings-page redirect, and all five admin endpoint operations failing closed without signatures/URLs/success flags while auth is unconfigured, including forged identity headers.
- An automatic approval-review timeout initially prevented the final test/build command from starting; the permitted retry succeeded. No permission block remains.
- Live Cloudinary uploads/deletions, PDF delivery, authenticated settings saves, true MongoDB rollback/concurrency, and browser preview/progress behavior are **not verified**. Unit adapters do not claim live database success.

### Configuration requirements

The secret-safe check still found `MONGODB_URI` and all three Cloudinary variables missing. Existing Google/auth requirements from Step 3 also remain necessary. No credentials were exposed or fabricated.

Configure MongoDB Atlas or a replica set (required for transactions), Google auth/`ADMIN_EMAIL`, and `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Run `npm run db:check` and `npm run db:indexes`; use a database user with read/write/index permissions. Enable Cloudinary PDF delivery if the product environment blocks CV links. Hosting must allow 10 MiB raw request bodies and sufficient runtime; lower platform limits are not bypassed.

Cloudinary and MongoDB cannot commit atomically together. Recovery records retain asset IDs after uncertain failures. Verify uncertain remote outcomes and use explicit retry/cleanup after the grace period. Future content writers must use `requireAdmin()` and lock referenced ready media inside the same MongoDB transaction.

### Next step

Step 5 is implemented below. Live service verification from this step remains pending configuration.

## Step 5 — Certificate management

Implemented on 2026-10-03. Existing authorization, transactional MongoDB access, and Cloudinary upload utilities reused. No new dependencies, credentials, sample certificates, or unrelated content features added.

### Completed

- Certificate model/editor supports title, issuer, image and certificate-specific alt text, optional PDF, full issue date, optional credential ID/verification URL, description, category, display order, and draft/published status.
- Protected `/dashboard/certificates`: add/edit/delete, unsaved preview, publish/unpublish, numeric display order, keyboard-accessible Up/Down controls with announcements and focus restoration, validation, and delete confirmation.
- Admin list/create/update/status/delete/reorder routes use the shared authorization helper; mutations also use the existing Origin/JSON-body guard. Updates/deletes use expected timestamps to reject stale edits with 409.
- Transactional CRUD and reordering, stable order with tie normalization, shared certificate mutation lock, and referenced-media locks. Publishing validates and publishes image/PDF metadata atomically with the certificate. Unpublishing remains possible if legacy fields or external media become unavailable.
- Both certificate image and PDF references protect media deletion, including draft references. Certificate deletion retains uploaded files for explicit cleanup. Older saved image/PDF selections remain available beyond the newest-100 media list window.
- Homepage displays the first three published certificates. `/certificates` includes twelve-per-page pagination, published-only category filtering, full-size preview, optional verification/PDF links, and honest empty/unavailable states.
- Native modal dialog preview supports Escape, Close, focus containment via `showModal`, focus restoration, alt text, and an original-image link. The same card is used in dashboard preview without exposing drafts through public readers.
- Public query filtering and output validation both enforce published status. Media resolves through published-only readers. Changes invalidate homepage, listing, and dashboard paths and refresh the editing client.
- Added published category/display-order index. Fixed BSON optional-field serialization in content collections (`ignoreUndefined: true`) so cleared optional fields do not become invalid nulls on reload; verified against official MongoDB documentation and real BSON serialization.
- README updated with configuration, legacy field handling, media retention, routes, and the manual end-to-end verification sequence.

### Checks

- All **41 tests passed**, including certificate validation, draft/publish/public/unpublish transitions with test adapters, publication rollback, wrong/deleting media, stale updates/deletes, immutable identity/creation date, optional-field clearing, BSON serialization, reordering/ties, filtering/pagination, and rejection of unexpected draft results. Existing auth/data/settings/upload regressions also passed.
- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: passed.
- `npm run build`: passed with all certificate routes included.
- Production HTTP smoke checks passed: homepage/listing/filter requests show honest database-unavailable states, certificate dashboard redirects without exposing the editor, and all six admin operations fail closed while auth is unconfigured, including forged identity headers. No IDs or mutation-success flags are returned.
- Test/build worker execution used the established sandbox escalation workflow. No remaining command or permission blockers.
- Live **upload → save → publish → public display** is **not verified**. The secret-safe check found MongoDB, Google/admin auth, and Cloudinary credentials missing. Fixtures/adapters do not claim successful remote persistence or uploads.
- Interactive browser/screen-reader behavior and real MongoDB transaction/concurrency behavior were not exercised. Native accessibility behavior and keyboard control structure were reviewed in code.

### Configuration requirements

No new environment variables. Configure the existing Google/auth variables, MongoDB Atlas or a replica set, and Cloudinary credentials. Run `npm run db:check` and `npm run db:indexes` to verify connectivity and create the additional category/order index. Use actual certificate content; no missing issue dates or credential details were invented.

The prior public-Cloudinary-file limitation remains: unpublishing hides certificate records, but does not revoke already known media URLs or unpublish assets shared elsewhere. Remove saved references and explicitly delete unused media when revocation is needed.

### Next step

Once configured, verify real upload/save/reload/publish, anonymous display/filter/preview/PDF, unpublish removal, stale-edit rejection, keyboard reorder, and referenced-media deletion protection. Step 6 is implemented below. Post CRUD and 3D remain deferred.


## Step 6 - Project management

Implemented on 2026-10-03 using existing authorization, database transactions, and Cloudinary upload utilities. No new dependencies or invented project records, descriptions, achievements, or links.

### Completed

- Expanded project model and strict editor validation for title/unique slug, summary/detailed description, problem/solution/contribution, features/technologies, thumbnail/alt, gallery/alt, Web/IoT/Robotics/Other category, optional GitHub/demo/video links, challenges/lessons, featured flag, display order, and draft/published status.
- Protected `/dashboard/projects` with create/edit/delete confirmation, publish/unpublish, card preview, reusable upload manager, validation, stale-edit feedback, numeric ordering, and navigation integration.
- Protected admin list/create/update/status/delete endpoints. Every mutation uses the shared admin authorization and Origin guard before processing input. Project JSON is bounded to 256 KB; other endpoint limits are preserved.
- Transactional writes with project mutation serialization, duplicate-slug checks across drafts and published records, timestamp conflict detection, immutable identity/creation dates, and referenced-ready-image locks. Existing unique slug index retained; added public category and featured ordering indexes.
- Thumbnail/gallery publication is atomic with project publication. Draft and published references prevent media deletion; replacement/deletion retains old uploads for explicit cleanup. Referenced selections remain available beyond the newest-100 upload window.
- Featured homepage projects, `/projects` with literal bounded search/category filtering/pagination, and `/projects/[slug]` with detail sections, optional links, gallery image links, and per-project Open Graph/Twitter metadata.
- Both database filters and result validation block draft records. Direct detail URLs and metadata use the same request-scoped published-only reader. Invalid/absent/draft slugs are not-found; outages display an honest server-rendered unavailable state with noindex detail metadata.
- Useful project loading, empty, invalid-filter, not-found, and retry/error interfaces. Successful mutations invalidate homepage, listing, detail paths, and dashboard.
- README documents routes, editing, slug changes, indexes, media retention, legacy records, and the real-service verification sequence. No new environment variables.

### Checks

- All **50 tests passed**, including nine project tests covering draft/direct URL exclusion, publication transitions, media resolution, slug collisions, stale writes/deletes, identity preservation, changed-slug removal, replacement references, cleared links, rollback, deleting/wrong-type media, literal search, category/featured pagination, and fail-closed output validation.
- Existing authorization, certificate, settings, upload, and data regressions passed. Media deletion scan assertion now verifies thumbnail/gallery references explicitly.
- Final lint passed with zero warnings. Typecheck passed; production build also completed its TypeScript checks successfully with all project routes included.
- Production HTTP smoke checks passed for homepage/list/filter outage states, invalid filters, server-rendered detail outage/noindex metadata, invalid-slug not-found, protected dashboard redirect, and all five admin API operations failing closed with forged identity headers/cookies. An initial smoke check exposed client-only outage feedback; server-rendered feedback was added, then lint/build and HTTP checks passed. Temporary production server stopped after testing.
- Live upload/save/reload/publish, real MongoDB transaction/concurrency/index enforcement, signed-in browser interaction, and visual/keyboard/screen-reader verification remain **unverified**. Test adapters are not live service operations.

### Configuration requirements

The secret-safe check found `MONGODB_URI`, `ADMIN_EMAIL`, Google OAuth credentials, `BETTER_AUTH_SECRET`, and all three Cloudinary variables missing. Database name is set. Configure the existing `.env.example` variables, use MongoDB Atlas or a replica set, then run `npm run db:check` and `npm run db:indexes`. No credentials were exposed or changed.

Known public Cloudinary URLs are not revoked by unpublishing a project. Slug changes do not create redirects. Complete actual missing required fields before saving legacy records; do not invent details.

### Next step

Once credentials are configured, verify real thumbnail/gallery upload, draft persistence after reload, anonymous direct-URL exclusion, publish/feature/search/detail metadata, edits and slug changes, unpublish, stale-edit rejection, and referenced-media deletion protection. Step 7 is implemented below. 3D remains deferred.


## Step 7 - Post management

Implemented on 2026-10-03. Existing project/certificate authorization, upload, transaction, and public-reader patterns preserved. No sample posts or unconfirmed owner details added.

### Completed

- Post model/editor includes title, unique editable slug, uploaded cover/alt text, excerpt, Markdown body, tags, draft/published status, publication date, and SEO title/description. Legacy rich-text records remain readable; missing legacy publication dates are not fabricated.
- Protected `/dashboard/posts` with create/edit, shared full-article Markdown preview, publish/unpublish, confirmed delete, media manager, validation, and stale-edit handling. Dashboard/public navigation and homepage latest-post section added.
- Authorized `GET/POST /api/admin/posts` and `PUT/PATCH/DELETE /api/admin/posts/[id]`. Mutations call the shared admin/Origin guard before body parsing; post JSON is capped at 512 KB and Markdown at 100,000 characters.
- Transactional CRUD with shared post lock, unique-slug conflict checks across drafts and published posts, immutable identity/creation timestamps, expected-update conflicts, cover-type/ready-upload validation, and atomic media publication. Existing unique slug index retained; publication-date and tag/date indexes added.
- Existing draft-inclusive cover deletion protection reused. Replacement and post deletion retain assets for explicit cleanup; old referenced covers remain available beyond the newest-100 upload window.
- Publication dates use UTC calendar dates. Blank dates are assigned on publishing; saved dates survive unpublish/republish. Future dates can be drafted but cannot be published; scheduling is not implemented.
- Homepage latest three posts; `/posts` search/tag filtering and twelve-per-page pagination; readable `/posts/[slug]` articles, calculated reading-time estimate, cover, tags, dates, and SEO/Open Graph/Twitter metadata.
- Drafts are excluded by query and output validation, including direct URLs and metadata. Tag options include only published content. Latest order is publication date descending with stable ID ties. Slug changes remove old URLs without redirects.
- Shared preview/article Markdown renderer uses raw-HTML skipping, rehype sanitization, an element allowlist, and restricted safe URLs. No MDX, executable code, HTML embeds, or inline images. Fenced code is escaped text; cover images use the upload system. Tests exercise the actual rendered output, not just the URL helper.
- Article spacing, bounded width, visible links, and scrollable code; loading/empty/invalid-filter/unavailable/not-found states. All successful mutations revalidate homepage, list, detail paths, and dashboard.
- README updated with editing/date semantics, Markdown policy, dependencies, routes, media retention, indexes, and live verification sequence. No new environment variables.

### Dependencies and audit

- Added exact `react-markdown` 10.1.0 and `rehype-sanitize` 6.0.0. Official project documentation and registry compatibility metadata reviewed; React >=18 is compatible with installed React 19, and Node 22 satisfies documented support.
- Production dependency audit reports zero vulnerabilities. Full audit reports five high-severity entries through the existing development-only ESLint/fast-glob/micromatch/braces chain (GHSA-vfj7-8cjw-p6xm). npm's suggested eslint-config-next 14.2.35 downgrade conflicts with the installed Next.js 16 stack and was not applied. A compatible upstream development-tooling fix remains to track; the new Markdown packages are not identified in the advisory chain.

### Checks

- All **60 tests passed**, including ten new post tests: validation, private draft/tag/direct URL handling, publish/unpublish, publication date assignment/preservation, future-date rejection, slug conflicts, durable adapter edits, stale writes/deletes, cover replacement/type/deletion safeguards, newest-first pagination, literal search/tag filters, fail-closed public results, reading estimates, unsafe URL rejection, and actual Markdown sanitization/escaped-code output.
- Existing auth, project, certificate, settings, media, and data regressions passed.
- Lint passed with zero warnings. Typecheck passed.
- Production build passed with homepage, post listing/detail, dashboard, and admin API routes included.
- Production HTTP smoke checks passed: homepage/list/search/tag requests show honest database-unavailable states; invalid filters and invalid-slug not-found work; unavailable article metadata is noindex; dashboard redirects without editor content; all five admin API operations fail closed despite forged identity headers/cookies. Temporary server stopped afterward.
- Live authenticated uploads/saves, real MongoDB transaction concurrency and index enforcement, and interactive browser/keyboard/screen-reader verification remain unverified. Adapter tests do not claim remote persistence or authentication success.

### Configuration requirements

The secret-safe check still found MongoDB URI, admin/Google auth credentials, Better Auth secret, and Cloudinary credentials missing. Configure existing `.env.example` variables, then run `npm run db:check` and `npm run db:indexes` on MongoDB Atlas or a replica set. No secrets were printed, changed, or fabricated.

### Next step

With credentials configured, verify real cover upload, draft save/reload, anonymous direct URL/tag/list privacy, preview, publish/date ordering/search/metadata, edits and slug changes, unpublish, stale-tab rejection, and referenced-cover deletion protection. Await the next requested step; do not implement 3D or other future features yet.


## Step 8 - Homepage section manager, skills, and timeline

Implemented on 2026-10-03 using existing typed section schemas, admin authorization, transactional MongoDB storage, and media utilities. No new dependencies, credentials, seed content, or unconfirmed achievements/experience added.

### Completed

- Extended the existing nine-type section registry with optional subtitles, automatic/manual related-record selection, selection order/limits, featured-project filtering, and timeline kind filtering. An exhaustive typed React component registry implements rich text, image-and-text, gallery, projects, certificates, posts, skills, timeline, and CTA.
- Protected `/dashboard/sections` with add/edit title/subtitle/content, show/hide, delete confirmation, numeric order and accessible Up/Down buttons, and shared-renderer preview. Multiple instances of all nine types are supported. Rich-text blocks, gallery images, and selected records also have native reorder controls.
- Protected `/dashboard/skills` and `/dashboard/timeline` provide create/edit/preview/publish/unpublish/delete/order management. Timeline entries validate optional month ranges and current/end-date consistency; no dates or experience are invented.
- Shared allowlisted admin API at `/api/admin/home-content/[kind]` for sections/skills/timeline, with item update/status/delete, reorder, and non-persistent preview routes. Every write/preview uses the shared admin/Origin guard; all reads require admin. Create/update/preview request bodies are capped at 512 KB.
- Transactional writes with per-collection locks, immutable identity/creation timestamps, stale edit/delete/reorder rejection, stable order/tie normalization, and timestamp updates for both moved records. Reorder buttons announce results and restore row focus. No drag-and-drop implementation or dependency.
- Image sections validate and lock ready uploads; showing sections atomically publishes their image metadata. Hiding remains possible if old media becomes unavailable. Draft/hidden image references retain deletion protection; replacement/deletion retains media for explicit cleanup. Older referenced section images remain available beyond the newest-100 upload list.
- Saved visible sections render between the preserved settings-driven About and Contact areas. Hero and listing/detail pages remain. Empty/all-hidden configurations render no managed blocks, and deleting the last section does not restore static fallback blocks. Database failure displays an honest unavailable message. Header/hero project/certificate links point to listing pages independently of section visibility.
- Automatic related content uses published-only filters; manual selections preserve saved selection order and omit drafts/deleted/filter-excluded records. Related serializers validate publication again. This applies to admin section previews too; selecting a draft never publishes it. Previewing a draft section's own uploaded image is restricted to the authorized preview route.
- Shared escaped-text rendering for paragraphs/headings/quotes/captions/CTA/skills/timeline. CTA validation rejects executable schemes, credential-bearing URLs, protocol-relative paths, backslashes, and control characters. No arbitrary HTML, JavaScript, CSS, or executable editor content. Public images and related cards use existing safe components.
- Successful mutations invalidate homepage and all three managers. Existing project/post/certificate revalidation also refreshes their homepage associations. Existing display-order/timeline indexes reused. README documents setup, routes, visibility, selection, ordering, image retention, and migration from the earlier fixed blocks.

### Checks

- All **70 tests passed**, including ten new manager tests for nine-type registry/render coverage, unsafe CTA/unknown type/duplicate selection rejection, multiple instances, show/hide/edit/delete, immutable identity/timestamps, stale edits/moves, tied-order normalization, skills/timeline CRUD/date validation, draft/deleted related exclusion, manual selection order, automatic limits, gallery rollback/locking, published-only media, authorized preview resolution, and fail-closed public validation.
- Actual server-rendered component fixtures verify rich text/CTA/skill HTML is escaped and all nine renderers work. Existing auth/data/project/post/certificate/settings/upload regressions passed.
- Typecheck passed; production build passed with all new dashboard/API routes and homepage included. Initial discriminated-union TypeScript errors were corrected before final validation.
- Production HTTP checks passed: homepage identity/listing links and honest section-unavailable state; all three dashboard pages redirect without editor content; all 21 tested admin operations fail closed despite forged identity headers/cookies; private collection names are rejected by the route allowlist; existing project/certificate/post listings remain accessible. Temporary server stopped after checks.
- Final `npm run lint` passed with zero warnings.
- Live authenticated create/save/reload, MongoDB concurrency/index enforcement, real image upload/publication, and interactive browser/keyboard/screen-reader verification remain **unverified** without credentials. Fixtures/adapters do not represent successful remote operations.

### Configuration requirements

No new environment variables or dependency versions. The secret-safe check still found MongoDB URI, Google/admin authentication credentials, Better Auth secret, and Cloudinary credentials missing. Configure the existing `.env.example` values, then run `npm run db:check` and `npm run db:indexes` against MongoDB Atlas or a replica set.

No homepage sections were seeded. To restore the former content arrangement through persistent configuration, create visible automatic Projects (featured only, limit 3), Certificates (limit 3), and Posts (limit 3) sections in the dashboard. Skills and timeline entries require corresponding sections to appear publicly. Previously known public media URLs are not revoked by hiding a section; existing explicit cleanup rules still apply.

### Next step

Once configured, verify every section type and multiple instances, save/reload, anonymous visibility and associated-draft exclusion, automatic/manual record selection, keyboard reorder/focus, image preview/publication/deletion protection, and skill/timeline publication/deletion/date behavior. Await the next requested step; 3D and other future features remain deferred.


## Step 9 - Contact functionality and private inbox

Implemented on 2026-10-03. Existing settings, admin authorization, database connection/transactions, and UI components reused. No new dependencies, invented contact channels, sent notifications, or sample messages.

### Completed

- Shared contact normalization/validation used by settings saves, public links, hero GitHub action, and floating menu. International WhatsApp numbers normalize formatting/00 prefixes; Telegram accepts usernames/@/HTTPS t.me values; email domain normalization and HTTPS GitHub profile/repository/LinkedIn profile validation are enforced. Invalid, placeholder, or missing values stay hidden publicly.
- WhatsApp message text and mailto subjects/addresses are correctly encoded; mailto subjects exclude CR/LF injection. Confirmed GitHub remains a profile/repository link and is never included as a chat channel.
- Responsive floating disclosure for configured WhatsApp, Telegram, and email only, hidden when none exist and on dashboard pages. Expanded/controls semantics, first-link focus on open, normal link tabbing, Escape with trigger focus restoration, outside interaction and focus-leave closure. No embedded live chat.
- Accessible homepage name/email/subject/message form with labels, field feedback, required/bounded fields, preserved failure inputs, pending controls, status feedback, and explicit private-storage notice. No localStorage or fake send success.
- Public `POST /api/contact/token` and `POST /api/contact` with exact configured Origin checks, signed random tokens, two-second minimum age, one-hour expiry, honeypot, excessive-link rejection, strict server validation/control-character checks, and a 48 KB streamed body limit.
- Persistent MongoDB fixed-window rate limits shared across instances/restarts: token global 500/15 minutes, submission global 100/15 minutes, email 3/hour, and optional trusted-IP token 30/15 minutes/submission 5/15 minutes. Conditional atomic counters and unique bucket IDs enforce quotas; 429 includes Retry-After. Unacknowledged writes/outages fail closed.
- Forwarded headers are ignored by default. Optional explicitly trusted single-IP ingress header requires valid values and rejects header chains; raw IPs are not stored. HMAC identities and operational TTL cleanup protect retention without relying on TTL timing for enforcement.
- Contact message and single-use receipt commit together in a MongoDB transaction. Success requires acknowledged writes and commit. Failed saves roll back receipts; replay remains rejected even if the original message was deleted. Messages are created unread with server IDs/timestamps.
- Protected `/dashboard/inbox`: paginated newest-first list, all/read/unread filters, full escaped-text reading, explicit read/unread actions, refresh, and confirmed deletion. Opening a message leaves status unchanged. Timestamps display Asia/Dhaka time.
- Protected list/detail `GET` routes and admin/Origin-guarded `PATCH/DELETE` at `/api/admin/inbox[/id]`, no-store responses, atomic expected-timestamp conflict checks, and inbox revalidation. Public readers continue to reject contact messages. No email delivery, notification, auto-reply, or live-chat integration is claimed.
- Added inbox ordering and rate/receipt TTL indexes. `.env.example` and README document secret/origin/trusted-proxy configuration, fixed-window tradeoffs, quotas, spam checks, retention, and verification. Existing settings labels updated for accepted contact formats.

### Checks

- All **81 tests passed**, including eleven contact tests for normalization/encoding, hidden invalid channels, malformed social URLs, mailto injection prevention, strict message validation, token timing/tampering/expiry, explicit trusted ingress/Origin rejection, concurrent quota adapters and window reset, Retry-After, unacknowledged rate writes, transactional save/replay/rollback, public failure responses without success, honeypot/link spam rejection, stale inbox updates/deletes, and private-reader exclusion.
- Existing auth, content, section, Markdown, settings, upload, and data regressions passed. Previous Telegram-invalid fixture was updated to reflect the newly supported @ prefix while retaining invalid-value coverage.
- Typecheck and production build passed with public contact and protected inbox routes included.
- Production HTTP smoke checks passed: contact form markup and confirmed GitHub visible; unconfigured WhatsApp/Telegram/email links and floating trigger absent; both public endpoints return honest no-store 503 without tokens/success; inbox redirects and all four protected API operations fail closed despite forged identity headers/cookies. Temporary server stopped after testing.
- Final `npm run lint` passed with zero warnings.
- Actual MongoDB persistence/concurrency/index creation, authenticated inbox interaction, deployment-proxy behavior, real external contact-app opening, and interactive keyboard/screen-reader/browser verification remain **unverified**. Adapter and HTTP unavailable-state tests do not claim live service success.

### Configuration requirements

The secret-safe check found MongoDB URI, admin/Google auth credentials, Better Auth secret, and the new `CONTACT_FORM_SECRET` missing. No secrets were read into output or changed. `CONTACT_PUBLIC_ORIGIN` and `CONTACT_TRUSTED_IP_HEADER` are unset; origin falls back to the existing Better Auth URL, and untrusted forwarding headers remain ignored.

Configure MongoDB Atlas or a replica set, a separate random contact secret (at least 32 characters), and the actual public origin (HTTPS in production). Configure Google/admin auth for inbox access. Enable a trusted single-IP header only after verifying that the ingress overwrites it and direct application access is blocked. Global/email quotas still apply without per-IP configuration. Run `npm run db:check` and `npm run db:indexes` before use. Cloudinary is not required for contact submission.

Messages persist until the authorized admin deletes them. Rate buckets expire after their window plus a day; replay receipts expire with the form token. Fixed-window boundaries permit adjacent-window bursts, and the global cap may temporarily affect all visitors during abuse. Spam controls are not CAPTCHA or DDoS protection. Official MongoDB atomicity and Vercel request-header documentation were reviewed and linked in README; no deployment-specific trust guarantee is assumed automatically.

### Next step

Once configured, verify real contact-channel links, floating-menu keyboard behavior, a real form submission appearing after inbox reload, read/unread/delete persistence, stale-tab handling, replay/spam/rate-limit behavior, and failure during database unavailability. Await the next requested implementation step; 3D and other future functionality remain deferred.


## Step 10 - 3D and motion polish

Implemented on 2026-10-03. Existing data, content visibility, authentication, authorization, and upload architecture are unchanged.

### Completed

- Homepage-only procedural robot built with React Three Fiber and Drei rounded geometry, restrained cyan accents, simple lighting, gentle idle motion, and damped desktop pointer response. No model, texture, particle, shadow-map, or post-processing downloads.
- Responsive two-column desktop hero and stacked mobile layout; heading, introduction, and action links remain outside the decorative canvas. Retained confirmed owner information, saved profile/photo/CV behavior, missing-field handling, and truthful unavailable/empty states.
- React lazy import starts only when the visual is in view, the tab is visible, and reduced motion is not requested. Server-rendered static SVG covers initial loading, reduced motion, missing JavaScript, WebGL errors, and context loss.
- Offscreen/hidden-tab scenes switch to a stopped render loop. Motion preference changes are observed live. Mobile/coarse-pointer geometry is simpler, antenna geometry omitted, pointer tracking disabled, and DPR limited to 1; desktop DPR is capped at 1.5. Canvas does not intercept scrolling or receive focus.
- Motion's native-animation entry point progressively enhances public section reveals, card hover, button presses, navigation links, and mobile-menu opening. Above-the-fold content is not delayed or initially hidden. Shared enhancements clean up on navigation/preference changes and exclude dashboard content.
- Mobile navigation retains disclosure semantics, Escape closure/focus restoration, and hidden closed links. Reviewed responsive typography, wrapping, existing contrast tokens, visible focus, empty states, and the homepage with unavailable persistent settings.
- Added exact stable dependencies: Fiber 9.8.1, Drei 10.7.9, Three 0.186.1, Motion 14.0.0, Three types 0.186.0. Verified React 19 compatibility using official docs and registry peer declarations; npm lockfile and README updated.

### Checks

- `npm run lint`, `npm run typecheck`, all **81 existing tests**, and production build passed. Final hover/pointer refinements also passed lint and a fresh production build including TypeScript.
- Headless Chrome production smoke checks passed: desktop WebGL canvas renders; 44 animation callbacks during a sampled active 700 ms interval and zero offscreen callbacks; zero callbacks after a simulated document-hidden visibility signal; mobile DPR capped at 1; context-loss fallback works; no uncaught runtime exceptions.
- Fresh document loads of `/projects`, `/posts`, `/certificates`, and `/sign-in` requested no Three/Fiber renderer chunk and rendered no canvas. Reduced-motion homepage also requested no renderer and used its static fallback. The separate renderer chunk measured approximately 920 KB uncompressed / 241 KB gzip; the standard engine cost remains deferred to the eligible homepage visual.
- Repeated production browser checks after the final hover/pointer refinements; all passed, including switching reduced motion on and off during the visit. Temporary browser/server processes were stopped after each run.
- Reviewed captured desktop (1280 x 900) and mobile (375 x 812) screenshots. Mobile had no horizontal overflow. Mobile disclosure opens/closes, and Escape restores focus to its trigger.
- Runtime `npm audit --omit=dev` reports zero vulnerabilities. Installation still reports the five pre-existing high-severity development-tool advisories documented earlier; no forced incompatible lint-tool downgrade was applied.
- Headless checks used a temporary local production server and Chrome with software WebGL. Physical mobile GPU/battery performance, real OS tab suspension, screen-reader interaction, and authenticated populated-content visual review remain unverified. Browser checks used the honest missing-configuration states; they do not establish live database/auth/upload success.

### Configuration requirements

No new environment variables, credentials, or external assets are required for this step. Existing MongoDB, Google/Better Auth/admin, Cloudinary, and contact configuration requirements remain as documented. `.env.example` needs no animation additions; no secrets were changed.

### Next step

Await the next requested implementation step. Before release, verify the portfolio on physical mobile devices, with the OS reduced-motion preference, real tab switching, and configured published content. Complete the previously documented live-service checks once credentials are available.


## Step 11 - Final verification and delivery

Completed implementation and available verification on 2026-10-05. No public deployment was requested or performed. No invented content was added to the portfolio database.

### Audit fixes and delivery work

- Completed public homepage, listing, and detail metadata with saved site settings, descriptions, canonical URLs from validated `SITE_URL`, Open Graph/Twitter cards, published per-post SEO overrides, and a generated 1200 x 630 PNG preview at `/og` when no sharing image is configured.
- Added dynamic `/sitemap.xml` with the four public entry pages and all published project/post URLs, not just the first listing page. Queries project only required fields, validate published status/slugs again, and use real update timestamps. Missing origin/database failures return 503 rather than fake success; outputs are no-store so unpublication is immediate. More than 50,000 URLs requires splitting and fails closed.
- Added `/robots.txt` with explicit production-only opt-in through `ALLOW_INDEXING=true` and a valid HTTPS `SITE_URL`. Preview/local configurations stay excluded by default. Dashboard/API/sign-in/access-denied paths also have `X-Robots-Tag`; protected layouts and absent/draft detail pages remain noindex. Authorization remains server-enforced independently of indexing directives.
- Enabled Next image optimization for public media with responsive sizes/dimensions, lazy loading, WebP, HTTPS Cloudinary upload-path allowlisting, no redirects, and SVG optimization disabled. The allowlist narrows to the configured cloud at build time. Blob upload previews remain unoptimized. Existing original image/PDF links are preserved.
- Added certificate and dashboard loading/retry states and a self-contained root global-error page; retained existing project/post error, empty, and not-found behavior. HTTP checks account for Next's safe streamed redirects as well as ordinary redirects.
- Added four meaningful SEO regression tests, a repeatable configured-value client-bundle secret scanner, and an opt-in isolated MongoDB verification script. The script uses a newly generated short database name, verifies it is empty, exercises real stores/transactions/readers, and deletes only that database with exact-name checks. It does not bypass or pretend to verify Google login or real uploads.
- Updated README into a complete delivery guide: local setup, variable table, exact OAuth callbacks, first-admin configuration, MongoDB/Cloudinary setup, dashboard content workflows, Node deployment requirements, SEO/indexing controls, live-test boundaries, and pending release checks. Removed stale scope/deferred statements. `.env.example` now leaves unconfirmed admin email blank and documents SEO variables.
- Supplied MongoDB URI normalized to remove whitespace and saved in `.env.local`, which is ignored. No URI/password was put in source, README, status, client props, or public responses. Rotation of the password shared in chat is required before production use.

### Verification matrix

| Requested check | Verified evidence | Remaining limit |
| --- | --- | --- |
| 1. Published content without login | Real MongoDB-backed production HTTP fixture pages/listings return published content anonymously. | Genuine owner content has not yet been uploaded/published through the dashboard. |
| 2. Configured Google admin dashboard access | Authorization policy accepts a verified matching Google identity; routes/pages call shared server guards. | Real Google OAuth callback, cookie/session persistence, logout, and dashboard access await credentials. |
| 3. Other account cannot mutate/upload | Policy tests reject another Google email, unverified identity, expired/mismatched sessions and spoofed roles; production mutation/upload endpoints reject forged headers/cookies with configuration unavailable. | Second real Google account test awaits OAuth configuration. |
| 4. Certificate/project/post persistence | Real transaction/save/publish/reconnect/read/unpublish/delete operations pass in a separate MongoDB database; duplicate slugs and stale updates are rejected. | Test media was labeled fixture metadata, not a real Cloudinary upload; authenticated browser CRUD remains unverified. |
| 5. Draft privacy | Automated adapters, real MongoDB public readers, sitemap tests, and direct draft URL production HTTP checks pass. | No known draft-record exposure; public-delivery media URLs are not private assets. |
| 6. Section order/visibility | Real saved reorder and hide survive connection restart and public re-read; existing related-draft tests pass. | Dashboard drag/mouse editing with an authenticated real user is still unverified; keyboard reorder operations are tested in store tests. |
| 7. Profile updates public | Actual transactional settings save and public-settings readback after reconnect pass in isolated MongoDB. | Real profile/photo/CV updates through the authenticated UI await setup. |
| 8. Contact actions | Normalization, URL validation, hidden placeholders and correct WhatsApp/mailto encoding tests pass; saved-settings integration preserved. | Real WhatsApp/Telegram/email/LinkedIn values and external app launches remain unconfigured/unverified. Confirmed GitHub retained. |
| 9. Contact to protected inbox | Production HTTP signed-token submission returns success only after a real MongoDB save; unread message readback and replay rejection pass in an isolated database. Inbox endpoint rejects unauthenticated access. | Authenticated inbox screen/read/unread/delete live flow awaits Google setup. The running local app still needs CONTACT_FORM_SECRET; test server used an ephemeral secret. |
| 10. Mobile and keyboard | Headless Chrome at 375 px shows no horizontal overflow; mobile disclosure opens and Escape closes/restores focus. | Physical devices, full screen-reader review, and authenticated controls remain unverified. |
| 11. Reduced motion/WebGL | Headless Chrome verifies static reduced-motion fallback, idle animation, zero offscreen callbacks, context-loss fallback and no 3D renderer requests on listing pages. Step 10 additionally checked live preference changes and a hidden-document signal. | Real OS tab suspension and physical GPU/battery behavior remain unverified. |
| 12. No client secrets | Production scan of 34 client asset files found neither configured URI nor extracted password; server-only module boundaries compile. | Re-run scanner after adding remaining secrets; absent values cannot be checked empirically. |

### Checks passed

- `npm run lint` with zero warnings; `npm run typecheck`; production `npm run build` including new routes.
- **85 automated tests passed**: existing authorization/content/media/contact/homepage regressions plus four SEO tests covering unsafe origins, explicit indexing opt-in, more-than-one-page sitemap coverage, and rejection of drafts/unsafe slugs.
- `npm run db:check`: live MongoDB ping succeeded. `npm run db:indexes`: live portfolio indexes verified/created.
- `npm run db:verify`: real isolated persistence, transactions, reconnect/readback, publication changes, slug conflict/stale-write rejection, section order/hiding, profile updates, contact save/replay and sitemap checks passed. Earlier isolated attempts failed before creating fixtures; the successful run used a shorter generated database name. The test database was removed afterward.
- Production HTTP checks with real MongoDB fixtures: public lists/details, draft exclusion/noindex, canonical/OG tags, generated OG PNG, sitemap publication filtering, robots/private headers, 404 state, no protected dashboard content, rejected unauthenticated/spoofed mutations/uploads/inbox, real contact save/readback/replay.
- Image optimizer rejected a non-allowlisted local URL and successfully returned WebP for a public Cloudinary sample. This verifies optimization, not an upload to the owner's Cloudinary account.
- Headless browser checks passed for mobile layout/keyboard navigation, motion/fallbacks and bundle isolation without uncaught runtime errors. Temporary server/browser processes stopped; isolated HTTP-test database removed. Portfolio content remained untouched.
- `npm run check:client-secrets` passed; two configured sensitive values checked without printing them. New README documents repeatable scan and database commands.
- Dependency audit still reports the five previously documented high-severity development-tool advisories via ESLint/fast-glob/micromatch/braces. No production dependency advisory is reported. npm's suggested forced downgrade of eslint-config-next to 14.2.35 is incompatible with the selected stack and was not applied. No dependency changes were made in Step 11.

### Configuration still required / next action

MongoDB URI and database name are configured and verified. Before production, rotate the database password shared in chat and update it only in local/deployment secret configuration.

Still missing in `.env.local`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL`, `BETTER_AUTH_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CONTACT_FORM_SECRET`, and the final `SITE_URL`. Auth/contact secrets can be generated locally using the README command; they are not external account credentials. Configure matching auth/contact origins and Google callback URLs, then restart. Set indexing true only on the intended HTTPS public deployment; keep it false on previews.

Next: configure those integrations locally, repeat real Google admin/second-account/logout checks, upload genuine profile/CV/content media, complete authenticated save/publish/reload/unpublish flows, and verify a real contact in the dashboard inbox. Live credentials should be entered in `.env.local` or the host's secret store rather than shared in chat. Deployment remains a separate user-authorized action.


## Follow-up - Local errors, missing sections, contact number, and owner controls

Completed 2026-10-10 in response to the reported runtime logs and usability issues.

### Findings and fixes

- The current network resolver returned ECONNREFUSED for Atlas SRV lookup. A read-only alternate resolver probe succeeded, followed by a real database ping. Added optional, IP-validated `MONGODB_DNS_SERVERS`; local configuration uses 1.1.1.1 and 8.8.8.8. No OS DNS, TLS, or authentication policy was weakened. The unset option keeps existing system resolver behavior.
- `CONTACT_FORM_SECRET` and `BETTER_AUTH_SECRET` were missing. Generated independent cryptographic secrets directly into ignored `.env.local`, without displaying values. The user-confirmed admin email was saved only in server configuration; it was not treated as a public email.
- Saved the user-confirmed Bangladesh number as +8801826663235 in published profile settings, retaining other saved/default confirmed fields. Contact and footer now show the number with a real tel link and WhatsApp action; floating contact becomes available through the same validated settings. No unknown public email was added.
- Database inspection showed zero homepage sections, projects, certificates, and posts. Because the section collection was empty, created and persisted Projects, Certificates, and Latest posts sections in that order, using the existing typed registry and automatic published-only readers. No certificates, project details, posts, achievements, or upload metadata were invented. Their empty states correctly remain until genuine content is published.
- Certificate/project CRUD already existed and stays protected by the shared Google admin authorization. Improved access discovery: footer Manage portfolio link; dashboard overview with direct add/manage project/certificate shortcuts and settings, posts, sections and inbox actions. Sign-in now explains the Google setup, localhost callback, restart, and where the management forms are.
- Redesigned the footer with an introductory heading, navigation, configured contact actions, availability when configured, and owner/back-to-top links; reviewed desktop and mobile screenshots.
- Added `data-scroll-behavior="smooth"` to root HTML. Verified Fiber 9.8.1 is still the stable release and still constructs THREE.Clock. Pinned Three/types to compatible stable 0.182.0 (Clock deprecation starts at r183), preserving Fiber/Drei behavior without vendor patches or warning suppression.

### Checks

- Live `db:check` passed through the new application DNS setting. Real settings save and homepage-section writes succeeded.
- HTTP checks against the user's existing `http://localhost:3000` server passed: contact token endpoint returned 200 with a real token; phone, homepage sections and admin link rendered; no temporarily-unavailable message; root smooth-scroll attribute present. No contact message was submitted during this follow-up.
- Headless Chrome on that server passed: contact form Ready state, exactly three saved homepage sections, working WebGL canvas, zero THREE.Clock warnings, no smooth-scroll warning or uncaught runtime exceptions, mobile disclosure/Escape focus restoration, and no horizontal overflow. Desktop/mobile footer screenshots reviewed; the browser was closed and the user's dev server left running.
- All **86 tests passed**, including new DNS override validation/rejection checks and existing authorization/content/contact/media tests.
- Lint, typecheck, and production build passed. Runtime dependency audit: zero vulnerabilities. The five previously documented development-tool advisories remain unchanged.
- Client-secret scanner passed across 34 built client files, checking five configured sensitive values including the generated server secrets and admin email; values were not printed.
- README and `.env.example` now explain DNS troubleshooting and the actual remaining configuration. Original Steps 1-11 notes above are historical; this follow-up supersedes their missing-phone/admin-email/secret state.

### Still required

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`, with the exact local callback `http://localhost:3000/api/auth/callback/google`, to enable the confirmed admin's Google login. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` for real image/PDF uploads. Restart after configuration/dependency changes and use the localhost URL; the LAN IP is not automatically an authorized contact/auth origin.

Then visit the footer's Manage portfolio link (or `/dashboard`), choose Add / manage certificates or Add / manage projects, upload genuine media and publish. Production SITE_URL/HTTPS origins and deployment remain pending. Google session/dashboard/upload end-to-end success is not claimed without those external credentials. No authentication bypass or fake content was added to make the site appear configured.

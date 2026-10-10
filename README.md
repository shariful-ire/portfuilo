# Shariful - personal portfolio

Production-minded dark portfolio for Md. Shariful Islam, built with Next.js App Router, TypeScript, Tailwind, MongoDB, Better Auth, Cloudinary, React Three Fiber/Drei, and Motion. Public content is published-only; the server-authorized dashboard manages profile/settings, media, certificates, projects, posts, homepage sections, skills, timeline entries, and a private contact inbox. No content database uses localStorage. No invented portfolio entries are seeded.

## Delivery status

Steps 1-11 are implemented. This repository has not been publicly deployed. Read `PROJECT_STATUS.md` for the latest evidence and remaining integration checks. Configured credentials belong in `.env.local` or the deployment secret store, never in chat or source control. Rotate any password that was shared in chat before production use.

## Local setup

Use Node.js 22 or newer and npm. Install exact locked dependencies:

```sh
npm ci
```

Copy `.env.example` to `.env.local` (PowerShell: `Copy-Item .env.example .env.local`), only if you do not already have a configured local file. Fill in the relevant variables below, then:

```sh
npm run db:check
npm run db:indexes
npm run dev
```

Open http://localhost:3000. Without external credentials, the public shell still renders confirmed owner information and explicit unavailable states. It does not simulate database writes, authentication, or uploads. Restart after changing environment variables.

## Environment variables

All configuration below is read on the server. No `NEXT_PUBLIC_` secret is required.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Atlas connection URI; no whitespace; percent-encode special characters in credentials. |
| `MONGODB_DB_NAME` | Explicit portfolio database name; independent of the URI's default database. |
| `BETTER_AUTH_URL` | Exact application origin. Local: `http://localhost:3000`; deployed: actual HTTPS origin. |
| `BETTER_AUTH_SECRET` | Cryptographically random secret, at least 32 characters. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Web application OAuth credentials. |
| `ADMIN_EMAIL` | Exact verified Google email authorized to administer the site; not editable public contact info. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Server-side image/PDF upload and deletion credentials. |
| `CONTACT_FORM_SECRET` | Separate random secret, at least 32 characters, for contact tokens/rate identities. |
| `CONTACT_PUBLIC_ORIGIN` | Exact allowed submission origin; defaults to `BETTER_AUTH_URL`. |
| `CONTACT_TRUSTED_IP_HEADER` | Optional explicitly trusted single-IP ingress header. Leave empty unless deployment trust is verified. |
| `SITE_URL` | Canonical origin, with no path/query/credentials. Local testing may use `http://localhost:3000`; production uses the actual HTTPS URL. |
| `ALLOW_INDEXING` | Defaults to disabled. Set `true` only for the intended public HTTPS production site; keep `false` on previews. |

Generate each secret independently with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Save the output locally; do not commit it. `.env.example` deliberately contains no admin identity or credentials.

## Google OAuth and first admin

1. Create a Google OAuth client of type **Web application**, configure the consent screen, and add your Google account as a test user while the OAuth application is in testing mode.
2. Add the exact local redirect URI **`http://localhost:3000/api/auth/callback/google`** and JavaScript origin `http://localhost:3000` if requested.
3. Set the OAuth credentials, auth secret, origin, and your verified account's `ADMIN_EMAIL`. First-admin setup is this server configuration; there is no public signup role selector or database role promotion.
4. Start/restart the application, open `/sign-in`, sign in with Google, and visit `/dashboard`. A different account must be denied even if its browser supplies a forged email or role.
5. For deployment, add **`https://<your-domain>/api/auth/callback/google`** in Google Cloud and update `BETTER_AUTH_URL` to that same origin. Use HTTPS; production auth rejects HTTP. Local OAuth testing should use `npm run dev`.

## MongoDB and Cloudinary setup

Use MongoDB Atlas or a replica set: multi-document transactions are required. Allow the application host through Atlas Network Access, and give the database user read/write and index-creation permission on the portfolio database. Run `db:check` and `db:indexes` before editing content. Do not manually create an admin role in MongoDB.

Obtain Cloudinary credentials from the account dashboard. No unsigned upload preset is needed. Images are restricted to JPEG/PNG/WebP and PDFs to the existing server-enforced byte/type limits. Enable PDF delivery in Cloudinary security settings if the account blocks it. Configure the cloud name before building production so Next's image allowlist matches the intended cloud. Credentials remain server-side; media delivery URLs and cloud names are naturally public. Draft content records are private, but Cloudinary assets are public-delivery URLs, not a private file vault.

## Managing content

- **Settings:** save identity, biography, education wording, contact channels, availability, profile image, CV, and site/sharing metadata. Missing optional values are hidden publicly; `ADMIN_EMAIL` stays in server configuration.
- **Media:** upload a real image/PDF, check preview/progress, then attach it to content. Replacement and deletion preserve reference checks; in-use media cannot be removed blindly.
- **Certificates / Projects / Posts:** create a draft, fill required fields and image alt text, preview, then publish. Projects/posts require unique slugs across drafts and publications. Posts use sanitized Markdown and calculated reading time. Unpublish to remove public access; deletion requires confirmation.
- **Sections:** add supported section types, select published related records or automatic collections, show/hide, and reorder with keyboard-accessible buttons. Create skills and education/experience entries in their dashboard pages. The homepage follows saved section order.
- **Inbox:** inspect persisted contact submissions, mark read/unread, and confirm deletion. No email delivery, notification, or embedded live chat is implemented.

After the first settings save, add your own genuine content; no project details, certificates, achievements, or links are fabricated.

## Verification commands

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run check:client-secrets
npm start
```

`npm test` uses isolated adapters/fixtures and checks authorization, published-only readers, content operations, validation, spam controls, and SEO. `check:client-secrets` scans built static output against configured sensitive values without printing those values. This complements Next's server-only import boundary; it cannot prove the absence of a secret that has not been configured.

Optional **`npm run db:verify`** performs real content transactions and reconnect/readback in a newly generated temporary database, never the portfolio database. It requires permission to create/read/write/drop that separate database. Only that generated database is removed afterward. The media record is explicitly test metadata, not a successful Cloudinary upload. This command does not authenticate with Google or prove the dashboard UI/upload flow. Use a suitable test connection locally when the production user is deliberately scoped to one database.

## Deployment instructions (not performed)

Deploy to a Node-capable Next.js host; static export is not supported. Configure all server variables in the host secret store. Configure Atlas access for the host, Google redirect/origin settings, Cloudinary, and contact origin before release. Rebuild after changing Cloudinary's cloud name. Set `SITE_URL` to the final HTTPS origin; keep indexing disabled on preview deployments.

Build with `npm ci` then `npm run build`; start a Node deployment with `npm start` behind HTTPS. Ensure the reverse proxy forwards the original Host/Origin correctly and supports the configured upload sizes/timeouts. The upload endpoint proxies bytes through the server, so verify the hosting provider's request-body/runtime limits; a lower host limit may require a suitable Node host. Run database indexes with the production environment. Configure a trusted client-IP header only when the ingress overwrites it and direct access to the application is blocked.

Before enabling `ALLOW_INDEXING=true`, verify admin Google login/logout, denial for a second real account, a real upload/save/publish/reload flow for each content type, a real contact submission in the protected inbox, and public draft exclusion. Verify backup/restore arrangements for MongoDB and Cloudinary. No deployment command has been run by the assistant.

## SEO, images, and fallbacks

Public pages have titles/descriptions, canonical URLs from `SITE_URL`, and Open Graph/Twitter previews. A saved sharing image is preferred; `/og` generates a 1200 x 630 identity preview when no image is configured. Detail pages use their published image and post SEO overrides. No request-supplied host is trusted for canonical URLs.

`/sitemap.xml` reads published project/post slugs on every request, beyond the first listing page, plus the four public entry pages. It returns an honest 503 for missing origin or unavailable database, never a fake empty successful sitemap. It fails closed on unexpected drafts and requires sitemap splitting above 50,000 URLs. `/robots.txt` blocks indexing by default; when enabled, it excludes dashboard/API/sign-in/access-denied routes. Those private routes also send `X-Robots-Tag`, and protected layouts carry noindex metadata. Robots rules are not authorization; server guards and published-only readers enforce privacy.

Public images use Next's responsive image optimizer, WebP negotiation, lazy loading, explicit dimensions and sizes, HTTPS Cloudinary image-path allowlisting, no redirects, and no SVG optimization. Local blob upload previews remain unoptimized. Loading, retry/error, global-error, empty, and not-found states are available. Motion and WebGL fallback details are below.

Implementation references: [Next metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images), [image optimization](https://nextjs.org/docs/app/api-reference/components/image), and [robots metadata](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots).

## Technical integration details

## MongoDB data foundation (Step 2)

`src/lib/content/models.ts` defines Zod-validated models and inferred types for profiles, site settings, homepage sections, projects, certificates, posts, skills, education/experience timeline entries, media metadata, and private contact messages. Records use UUID string `_id` values and BSON Date timestamps. Publishable records default to `draft` and have a nonnegative `displayOrder`. Profile (`owner`) and site settings (`site`) are singletons. Admin credentials and secrets never belong in those public models.

`src/lib/content/sections.ts` defines the typed nine-kind section registry. Rich text consists of structured text blocks, not executable HTML. Renderers must escape text and resolve media references through `getPublishedMedia`; referenced draft media must never be fetched with raw collection access. Section rendering and management are implemented (Step 8).

`src/lib/db/` is guarded by `server-only` and requires the Node.js runtime:

- `connection.ts`: lazy shared MongoClient pool, bounded connection/pool wait timeouts, retry after failed connection, sanitized errors. Credentials are validated only when accessed, so static builds need no database. Restart the server after changing environment variables.
- `collections.ts`: typed raw collection access for trusted server code. This is not an authorization layer and must never be exposed directly through an endpoint.
- `records.ts`: validates complete records, assigns server UUID/timestamps, and preserves immutable ID/creation time on updates. Preparation does **not** save anything. Future authorized mutations must call these helpers and await actual writes; raw driver types alone do not validate data at runtime.
- `public-read.ts`: `listPublished(collection, { limit, offset })`, `getPublishedProject(slug)`, `getPublishedPost(slug)`, `getPublishedProfile()`, `getPublishedSiteSettings()`, and `getPublishedMedia(id)`. Queries enforce published status, deterministic display order, explicit field projections, schema validation, and bounded pagination (default 24, maximum 100). Results use `id` and ISO timestamps; private provider keys/filenames and unknown fields are stripped. Contact messages are not allowed by type or runtime guard.
- `indexes.ts`: explicit idempotent index setup. Unique project/post slugs apply across drafts and published records. Additional indexes support singleton keys, ordered publication queries, media provider identities, timeline kinds, and private inbox state/date. Duplicate records cause setup to fail; the command never silently deletes or repairs content.

Configure an Atlas or local MongoDB connection string and an explicit database name (letters, digits, underscores, hyphens; maximum 63 characters):

```sh
npm run db:check
npm run db:indexes
npm test
```

Both database commands load `.env.local` with Next.js environment precedence. `db:check` pings MongoDB without writing content. `db:indexes` also creates/verifies indexes and must be run before later content writes; its database user needs index-creation permissions. Public readers never create indexes. The CLI uses the `react-server` condition to allow server-only modules outside Next.js; do not enable that condition for client bundles.

Missing configuration raises `DatabaseConfigurationError`; connection/query failures raise `DatabaseUnavailableError`; malformed published records raise `DatabaseContentError`. No failure is converted into an empty successful result. A successful query with no matches alone returns `[]` or `null`. Never send raw database errors to browsers.

Unit tests use fixtures and a deliberate in-memory driver adapter; they do not certify a live MongoDB deployment. Actual connectivity, index creation, and server-enforced slug uniqueness require configured MongoDB and are tracked separately in `PROJECT_STATUS.md`.

Compatibility references: [MongoDB connection pooling](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/connection-pools/) and [Zod documentation](https://zod.dev/basics). Installed driver/runtime requirements were checked against package metadata.

## Google authentication and authorization (Step 3)

Better Auth 1.7.7 and its MongoDB adapter 1.7.7 support the installed Next.js 16, React 19, and MongoDB 7 versions. Integration follows the official [Google provider](https://better-auth.com/docs/authentication/google), [Next.js integration](https://better-auth.com/docs/integrations/next), and [MongoDB adapter](https://better-auth.com/docs/adapters/mongo) documentation.

### Local setup

1. Configure MongoDB in `.env.local` and verify it with `npm run db:check`. The database user needs read/write and index-creation permissions. Better Auth manages its own `user`, `account`, `session`, `verification`, and rate-limit records; these are separate from portfolio content collections. The installed MongoDB adapter automatically ensures its schema indexes when needed. `db:indexes` remains the portfolio-content index command.
2. In Google Cloud Console, configure the OAuth consent screen and create an OAuth client of type **Web application**. If the app is in testing mode, add the admin Google account as a test user.
3. Register this exact authorized redirect URI: **`http://localhost:3000/api/auth/callback/google`**. Use `http://localhost:3000` as the JavaScript origin if requested. Visit the app using that same hostname and port.
4. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `ADMIN_EMAIL` in `.env.local`. `ADMIN_EMAIL` must be the exact verified Google account email intended to administer the site (case-insensitive comparison; Gmail dot/plus aliases are not rewritten). Do not put any of these in public content models.
5. Generate a random secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and save it as `BETTER_AUTH_SECRET`. It must contain at least 32 characters. Set `BETTER_AUTH_URL=http://localhost:3000` (origin only).
6. Restart `npm run dev`, visit `/sign-in`, and choose Google. Successful authentication returns to `/dashboard`; a different account gets the access-denied screen. The account page and dashboard both verify access independently of the shared layout.

Do not paste secrets into chat, logs, or git. Missing credentials leave sign-in unavailable; they never produce a fake session. Missing database/configuration makes auth API requests return a safe 503 response. Ordinary public content remains accessible, with no toolbar when authorization cannot be established.

### Production setup

Set all the same variables in the deployment's secret environment. Use a strong production secret and `BETTER_AUTH_URL=https://YOUR_ACTUAL_DOMAIN` without a path/query. Register **`https://YOUR_ACTUAL_DOMAIN/api/auth/callback/google`** in the Google OAuth client, replacing the placeholder with the real deployed hostname. The callback path is always `/api/auth/callback/google`; `/dashboard` is the post-login destination, not Google's callback. Configure the Google consent screen for the intended deployment and allow the server to reach MongoDB.

Use HTTPS in production; production mode rejects an HTTP auth origin. The local HTTP OAuth workflow uses `npm run dev`. The explicit base origin is also the only trusted origin. Better Auth handles OAuth state, cookie signing, HTTP-only session cookies, and CSRF/origin checks; none of those checks are disabled. HTTPS origins use Secure cookies. Do not publicly cache personalized HTML: the homepage now renders per request for its admin toolbar, and dashboard/sign-in routes are dynamic.

### Authorization contract

`src/lib/auth/admin.ts` exports **`requireAdmin()`** with no arguments. It reads request headers on the server, asks Better Auth to verify the persisted session with cookie caching disabled, checks expiry and user/session identity, requires `emailVerified`, compares the database-backed email against server-only `ADMIN_EMAIL`, and confirms a linked Google account through Better Auth. Browser email, role, query parameters, localStorage, and toolbar visibility do not grant access. Email/password sign-in, account linking, and email changes are disabled. Other Google users may authenticate but cannot administer content.

**Every future privileged read, content mutation, server action, and upload/signing operation must call `await requireAdmin()` before accessing private data or causing side effects.** Page guards and hidden buttons are not substitutes. For mutation endpoints, translate `AdminAuthorizationError` into 401 (unauthenticated) or 403 (forbidden), and apply origin/CSRF protection appropriate to that endpoint. `requireAdminPage()` is a redirecting wrapper for pages only. Pure record-validation helpers do not authorize or persist data.

Sessions are persisted in MongoDB, expire after seven days, and refresh after one day of activity. Cookie session caching is disabled, so server revocation and changing `ADMIN_EMAIL` are checked on subsequent protected requests. Restart after environment changes. Logout calls Better Auth's POST sign-out endpoint, revokes the session, and reloads sign-in; a failed logout is reported rather than presented as successful. Session tokens and provider credentials are never passed to page components.

### Verification

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Authorization unit tests cover allowed admin, unauthenticated/expired sessions, another account with a spoofed role, unverified email, missing Google provider, mismatched session ownership, missing/replaced admin allowlist, database errors, and missing configuration. They test trusted-boundary behavior using fixtures, not live OAuth.

After configuring credentials, manually verify Google consent/callback, session persistence across reloads/server restarts, a second account's denial on both dashboard routes, admin-only public toolbar, and logout followed by denial when revisiting protected URLs. Live OAuth/session persistence cannot be certified without real credentials and MongoDB.

## Secure uploads and profile settings (Step 4)

Visit `/dashboard/settings` after signing in as the configured admin. The form supports name/short name, headline, introduction, biography (plain text), university, degree/department wording, city/country, profile photo, CV PDF, public contact channels, availability text, site title/description, and sharing image. Blank optional fields remove those values publicly. Saving publishes profile and site settings together; `ADMIN_EMAIL` is deliberately absent and rejected if submitted as an extra field.

### Configuration

- Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` on the server, using credentials from your Cloudinary product environment. Restart after changes. Missing values disable uploads/deletion and show configuration guidance; profile text remains editable when auth and MongoDB work.
- Use **MongoDB Atlas or a replica set**. Settings saves, media finalization, and deletion-state changes use transactions to protect cross-document references. Standalone MongoDB cannot perform these operations and produces an unsuccessful response; no success is simulated. Run `npm run db:indexes` to install content and `mediaUploads` operational indexes.
- Images: JPEG, PNG, WebP, maximum **5 MiB**. CV: PDF, maximum **10 MiB**. SVG, HTML, GIF, video, empty files, and other types are rejected. Limits are checked in the browser and independently against streamed server bytes and detected magic bytes. Cloudinary then parses the image/PDF and its returned format/metadata is checked before persistence.
- Uploads use Cloudinary's `image` resource type for both images and PDFs. If a PDF uploads but delivery is denied, review Cloudinary's **PDF/ZIP delivery security setting** for the product environment. No unsigned upload preset is required.
- Hosting must accept a raw request up to 10 MiB and an upload route lasting up to 120 seconds. A platform with a lower request-body limit will reject larger files before this code runs. Configure suitable hosting/proxy limits or deliberately lower the application limits; do not silently switch to unrestricted direct uploads.

The integration follows Cloudinary's [Node upload documentation](https://cloudinary.com/documentation/node_image_and_video_upload) and [Upload API reference](https://cloudinary.com/documentation/image_upload_api_reference). Cloudinary SDK 2.11.0 is pinned in the lockfile and supports the project's Node 22 runtime.

### Upload flow and privacy

`POST /api/admin/media/signature` calls the shared admin helper and checks the exact configured Origin before issuing a five-minute, single-use proxy signature bound to the owner, server-generated asset ID, filename, MIME, and byte count. The authorization is persisted in `mediaUploads`. `PUT /api/admin/media/[id]` repeats authorization/origin checks, verifies the ticket, reads a bounded raw body, verifies size/type, and atomically claims the ticket. The Cloudinary SDK signs the actual provider upload **only on the server after validation**. The proxy HMAC signature cannot be used at Cloudinary directly. No Cloudinary API key, API secret, or provider upload signature is returned to the browser.

Files get unique `portfolio/<UUID>` public IDs with overwrite disabled. The browser shows an image or downloadable PDF preview, transfer progress, a distinct processing stage, and explicit errors. A 100% transfer is not presented as successful persistence. Only successful Cloudinary upload plus committed MongoDB metadata returns upload success. Image descriptions are required. Files are intended for public publication; a draft metadata flag is not a private Cloudinary delivery ACL. Do not upload confidential documents.

`media` stores validated URL, provider key, type, MIME, byte size, dimensions where available, alt text, original filename, status, and timestamps. Uploaded assets begin as draft; selecting an asset and saving settings publishes it in the same transaction as its references. Public data readers continue to exclude drafts and private provider metadata. The protected media list shows the newest 100 active upload records, including incomplete/failed uploads, plus older assets still referenced by saved profile, settings, certificate, project, or post records.

### Replacement, deletion, and recovery

Replacing a selected asset does **not** overwrite or delete the old one. Save the replacement first, then explicitly delete the old asset if no saved content uses it. Clearing a selection and saving removes the reference without destroying the file.

`DELETE /api/admin/media/[id]` requires admin authorization and the allowed Origin. A MongoDB transaction checks references in profiles, site settings, projects, certificates, posts, and homepage sections, including drafts, before marking an unreferenced asset as deleting. Reference writes lock the same `mediaUploads` record; this prevents a settings save from racing deletion. **Every future reference writer must call `lockReadyMedia(id, session)` in the same transaction as its write.** Cloudinary deletion uses the fixed server-owned public ID with CDN invalidation. Only a successful deletion (or confirmed not-found response) permits metadata removal.

Failed Cloudinary deletion remains retryable as `deleting`; failed upload/finalization retains its intent and asset ID for cleanup. Recent uploading/failed records must wait ten minutes before deletion to allow an uncertain remote request to settle. No TTL removes recovery records. A crash can leave a stale uploading record: refresh the list and explicitly clean it up after the waiting period. Cloudinary and MongoDB do not share a distributed transaction; for an uncertain remote timeout, verify the known public ID in Cloudinary if necessary. Deleted records remain as audit tombstones; no provider success is fabricated.

Settings mutations call `requireAdmin` through the shared mutation guard before reading request bodies or writing. They also enforce Origin and bounded JSON input. Public reads use request-scoped memoization, and the root layout is dynamic; successful saves/deletion call `revalidatePath` for the layout/settings page and refresh the editing client. Biography is rendered as escaped plain text. Successful mutation responses are never based on localStorage.

Tests cover upload bounds/type sniffing, single-use ticket validation, forbidden admin fields/unsafe URLs, missing configuration, reference locking and scans, and transactional settings preparation using explicit test adapters. Live Cloudinary upload/deletion, real transaction rollback/concurrency, PDF delivery, browser upload progress, and authenticated end-to-end saves still require configured services and are tracked in `PROJECT_STATUS.md`.

## Certificate management (Step 5)

Open `/dashboard/certificates` as the verified admin. Add a certificate, upload/select an image using the existing upload manager, optionally upload/select a PDF, fill the details, and save as a draft or publish immediately. The editor includes title, issuer, certificate-specific image alt text, full issue date, optional credential ID/verification URL, plain-text description, category, display order, and publication status. No sample certificates are seeded.

Use **Edit / preview** to change a saved record or preview unsaved details. Publish/unpublish are explicit list actions. The native full-size preview dialog supports keyboard navigation, Escape, a Close button, and focus restoration. Up/Down reorder buttons work with Tab and Enter/Space, announce results, and return focus to the moved row. Reordering normalizes display-order values to a consecutive sequence; a numeric display-order field is also available. Deletes require confirmation and remove only the certificate, retaining uploaded assets for explicit media cleanup.

All mutation routes authorize through `requireAdmin()` and the existing Origin/body guard before processing input:

- `GET/POST /api/admin/certificates`: protected list/create.
- `PUT/PATCH/DELETE /api/admin/certificates/[id]`: update, publish/unpublish, delete.
- `POST /api/admin/certificates/reorder`: move a record up/down.

Updates, publication changes, and deletion require the last-read `updatedAt` value. A stale request gets 409 and must reload instead of overwriting another edit. Transactions serialize certificate mutations through a `contentLocks` record and lock each referenced ready media upload. Publishing validates and publishes image/PDF metadata in that same transaction. A draft does not publish newly uploaded media. Unpublishing remains possible for incomplete legacy records or unavailable assets. Deletion checks now include certificate PDFs as well as images, even when the certificate is a draft.

The homepage shows the first three published certificates. `/certificates` lists twelve per page with server-side category filtering, stable display order, full-size image preview, and optional verification/PDF links. Categories are derived only from published records. Both query filters and output validation reject drafts; public responses contain no private provider keys. Database outages display “temporarily unavailable,” distinct from an empty published collection. Successful mutations invalidate the homepage, listing, and dashboard paths.

Unpublishing removes the **certificate record** from public views. It does not revoke a previously published Cloudinary URL or unpublish shared media used by other content. That is consistent with Step 4's public-file model. Explicit media deletion is allowed only after all saved references are removed.

No new credentials or dependencies are required. Existing Google auth, Cloudinary, and MongoDB Atlas/replica-set configuration must work. Run `npm run db:indexes` to add the published-category/order index. Earlier month-only certificate dates remain readable; before saving an old record through the new editor, supply its actual full issue date and required image/alt/description/category fields rather than inventing missing details.

Content collections use `ignoreUndefined: true`, so cleared optional fields remain absent across real BSON serialization rather than becoming `null` and failing validation on reload. This follows the [MongoDB undefined-value guidance](https://www.mongodb.com/docs/drivers/node/current/data-formats/bson/undefined-values/) and also protects existing profile/settings replacement writes.

Verification sequence when credentials are available:

1. Upload a real certificate image and optional PDF; save a draft and reload the dashboard.
2. Confirm it is absent from the anonymous homepage, listing, and category choices.
3. Publish, reload anonymously, and check image alt text, full-size dialog, category filter, verification URL, and PDF.
4. Edit/reorder and reload; confirm durable order and changes. Try a stale tab to confirm 409 handling.
5. Unpublish and confirm immediate public removal. Confirm referenced image/PDF deletion is rejected; then delete the certificate and explicitly clean up unused files if desired.

The automated suite exercises these data-layer transitions with isolated test adapters, plus validation, publication rollback, stale updates, media-type rejection, equal-order movement, filtering/pagination, and unexpected draft results. It does not substitute for a real Cloudinary/Google/MongoDB end-to-end run or browser accessibility testing.


## Project management (Step 6)

Use `/dashboard/projects` to create, edit, preview cards, publish/unpublish, and delete projects. The editor supports title, unique slug, summary, detailed plain-text description, problem, solution, contribution, features, technology tags, thumbnail/alt text, gallery images/alt text, Web/IoT/Robotics/Other category, optional GitHub/demo/video URLs, challenges, lessons, featured flag, numeric display order, and draft/published status. Features and technologies use one item per line. Complete the required details and select an uploaded thumbnail before saving; no project names, claims, links, or seed records were invented.

- `GET/POST /api/admin/projects`: authorized list/create.
- `PUT/PATCH/DELETE /api/admin/projects/[id]`: authorized edit, publication change, and confirmed delete.
- `/projects`: published-only search across titles, summaries, and technologies, category filtering, stable order, and twelve-per-page pagination.
- `/projects/[slug]`: published-only detail, image gallery links, optional external actions, and project-specific title/description/Open Graph/Twitter metadata.
- Homepage: first three published **featured** projects in display order.

All writes use the shared admin/Origin guard and strict Zod validation. Project JSON requests are bounded to 256 KB to accommodate the detailed fields; other JSON endpoints retain their existing 40 KB cap. Slugs are lowercase alphanumeric words separated by hyphens and must be unique across both drafts and published records. Transactional project locking serializes application writers; the unique slug index remains the database constraint. Run `npm run db:indexes` before use, including the new category/order and featured/order indexes. MongoDB Atlas or a replica set is required.

Updates and deletes reject stale timestamps with 409. Changing a slug changes the public URL; the old URL is not redirected. Thumbnail and gallery references lock ready image uploads inside the save transaction and protect those assets from deletion even in drafts. Publishing publishes the referenced media metadata atomically. Replacing/removing references or deleting a project retains files for explicit cleanup. Unpublishing hides records and direct URLs; it cannot revoke already known public Cloudinary URLs. Older referenced uploads remain selectable beyond the newest-100 upload window.

Public query filters and output validation both exclude drafts. Detail pages and metadata share a request-scoped published-only reader. Invalid/missing/draft slugs show not-found; database failures show a retryable unavailable state. Successful writes invalidate the homepage, listing, all project detail paths, and dashboard. No new environment variables or dependencies are required. Existing legacy projects remain readable; complete missing required details when editing them.

When services are configured, verify a real thumbnail/gallery upload, draft save, and dashboard reload. Check anonymous listing/search/direct URL exclusion, then publish and feature the record and inspect its detail metadata and optional links. Edit order, category, slug, and images; verify reload persistence and old-slug removal. Unpublish and verify direct URL removal. Test a stale editing tab and referenced-file deletion rejection, then delete the project and explicitly clean up unused uploads if desired. Automated adapters exercise these transitions but do not claim live MongoDB, OAuth, Cloudinary, or interactive browser verification.


## Post management (Step 7)

Use `/dashboard/posts` to create/edit posts, preview the full article, publish/unpublish, and delete with confirmation. Fields include title, unique editable slug, uploaded cover and alt text, excerpt, Markdown, tags (one per line), status, publication date, and optional SEO title/description. Required content and a ready cover are validated before saving. SEO fields fall back to title/excerpt. No articles were seeded.

`GET/POST /api/admin/posts` and `PUT/PATCH/DELETE /api/admin/posts/[id]` use the existing authorization, Origin, strict validation, stale-timestamp, transactional slug lock, and media-reference protections. JSON bodies are bounded to 512 KB, with Markdown limited to 100,000 characters. Slugs are unique across drafts and published posts. A slug change removes the old public address without a redirect. Cover replacement and post deletion retain files for explicit cleanup. Draft cover references prevent media deletion; older referenced covers remain selectable.

Publication dates use UTC calendar dates. Leaving the date blank fills it when publishing. Unpublish/republish preserves a saved date; dates may be edited. Future dates can be saved in drafts but cannot be published: this step does not implement scheduling. Latest posts sort by publication date descending, then stable ID; legacy undated posts remain readable without an invented date.

The homepage shows the latest three published posts. `/posts` provides twelve-per-page pagination, literal bounded title/excerpt/tag search, and exact tag filtering. Tag options come only from published posts. `/posts/[slug]` and its metadata use the same request-scoped published-only reader. Drafts stay inaccessible by direct URL. Successful mutations revalidate homepage, list, all article paths, and dashboard. Outages show honest unavailable states; unavailable/missing article metadata is noindex.

Preview and public articles share `MarkdownBody`: [react-markdown](https://github.com/remarkjs/react-markdown) 10.1.0 and [rehype-sanitize](https://github.com/rehypejs/rehype-sanitize) 6.0.0, pinned after checking official documentation and package compatibility (React >=18; this app uses React 19/Node 22). CommonMark headings, paragraphs, lists, emphasis, quotes, links, and fenced code are supported. Raw HTML is skipped, the generated tree is sanitized and element-allowlisted, and URL handling allows only HTTP(S), root-relative paths, and fragments without credentials or control characters. Embedded images, SVG, forms, iframes, HTML scripts, and executable MDX are disabled. Code fences are escaped text. Cover images go through the existing upload system. Markdown source is stored as text, never executed or injected with dangerouslySetInnerHTML.

Reading time is an estimate of 200 words per minute, minimum one minute, using Unicode word segmentation after removing common markup. Article styling provides bounded width, readable line height, visible links, and horizontally scrollable code. Per-post metadata uses SEO overrides, cover image, tags, and publication/update dates.

No new environment variables. Configure existing MongoDB Atlas/replica set, Google admin auth, and Cloudinary credentials. Run `npm run db:check` and `npm run db:indexes` for the publication-date/tag indexes and existing unique slug constraint. Verify real cover upload, draft/save/reload, anonymous listing/tag/direct-URL exclusion, Markdown preview, publish/date sorting/search/article metadata, edits, unpublish, stale saves, and referenced-cover deletion protection. Public media URLs already known are not revoked by unpublishing.

Dependency audit during this step: production dependencies reported zero vulnerabilities. Full audit reported five high-severity entries in the existing ESLint -> fast-glob -> micromatch -> braces chain (GHSA-vfj7-8cjw-p6xm). npm suggested an incompatible eslint-config-next downgrade to 14.2.35; that downgrade was not applied. Track a compatible upstream fix for the development tooling. These findings were not attributed to the new Markdown dependencies.


## Homepage sections, skills, and timeline (Step 8)

Open `/dashboard/sections` to add, edit, preview, show/hide, reorder, and delete homepage sections. The existing typed schema registry now drives an exhaustive React component registry covering rich text, image-and-text, gallery, projects, certificates, posts, skills, education/experience timeline, and CTA. Multiple instances of every type are supported. Titles and optional subtitles are editable; each section has an independent stable DOM ID, publication/visibility status, and display order.

Saved visible sections replace the former fixed project/certificate/post blocks between the settings-driven About and Contact areas. Hero, About, Contact, and public project/certificate/post routes are preserved. Header and hero links use the listing routes so hidden sections do not leave broken anchors. No section configuration is invented or silently seeded: an empty collection, deleting the last section, or hiding all sections leaves no managed blocks. A database outage shows an explicit unavailable message instead of substituting static content.

To recreate the previous content arrangement, add visible Projects (automatic, featured only, limit 3), Certificates (automatic, limit 3), and Posts (automatic, limit 3) sections and order them as desired. This writes actual saved configuration through the authorized UI.

Rich text uses editable paragraph, heading, and quote blocks rendered as escaped text. Image-and-text supports left/right placement and alt text; galleries support up to 50 images with alt text and optional captions. Block/gallery controls support native Up/Down buttons. CTA destinations allow HTTP(S) or root-relative paths, excluding credentials, unsafe schemes, protocol-relative URLs, backslashes, and control characters. There is no arbitrary HTML, JavaScript, CSS, executable editor content, or code injection.

Related-content sections support automatic selection or up to 24 explicitly chosen IDs, a display limit, and accessible selected-record ordering. Automatic posts use publication date descending; other automatic content uses display order. Projects can restrict to featured records; timeline sections can filter education/experience/all. Manual selections preserve saved selection order. Draft, deleted, and filtered-out records are omitted even from admin section previews. Selecting a draft never publishes it. Related-content publication changes already invalidate the homepage through the existing CRUD flows.

`/dashboard/skills` supports name, optional category/description, publication status, and display order. `/dashboard/timeline` supports education/experience kind, title, organization, optional description/start/end month, current flag, status, and display order. Dates remain optional; current entries cannot have an end date and an end cannot precede a start. No proficiency numbers, dates, employment claims, or achievements are invented. Create a corresponding homepage section to display published entries.

All three managers provide native Up/Down reorder buttons, live status announcements, row focus restoration, numeric order editing, preview, confirmed delete, and timestamp conflict detection. Reordering normalizes ties and updates timestamps for moved records. No drag-and-drop dependency is required. Preview uses the same component registry as the public homepage; unsaved image sections can preview their uploaded draft images only behind admin authorization. Editing after preview clears the snapshot to avoid presenting stale content.

Endpoints use a fixed allowlist (`sections`, `skills`, `timeline`) rather than arbitrary collection names:

- `GET/POST /api/admin/home-content/[kind]`: authorized list/create.
- `PUT/PATCH/DELETE /api/admin/home-content/[kind]/[id]`: edit, show/publish or hide/unpublish, delete.
- `POST /api/admin/home-content/[kind]/reorder`: move up/down with expected timestamp.
- `POST /api/admin/home-content/[kind]/preview`: authorized, non-persistent preview.

Every write and preview authorizes through the shared admin/Origin guard before processing input. Create/update/preview JSON is capped at 512 KB. Stores use MongoDB transactions, shared per-collection locks, immutable IDs/creation dates, and stale-update checks. Public section reads and each related-content serializer enforce published status. Images are validated and locked as ready uploads before save; showing an image section publishes its media metadata in the same transaction. Hiding remains possible when an old asset is unavailable. Hidden references still protect media from deletion, and older referenced section images remain selectable beyond the newest-100 upload window. Deleting sections/entries retains related records and media; deleted selected entries disappear from rendering automatically.

Successful changes invalidate homepage and all three managers. Existing public display-order indexes and the timeline kind index are reused; no new credentials or dependencies are needed. Run `npm run db:check` and `npm run db:indexes` with the existing MongoDB Atlas/replica-set configuration. Admin authentication is required for all management; image uploads additionally need Cloudinary.

When configured, verify adding each section type, saving/reloading, multiple instances, automatic/manual choices, and hidden/draft exclusion anonymously. Upload real images and check preview, alt text, captions, image placement, and referenced-media deletion rejection. Reorder sections with keyboard controls, reload, verify public order, and test stale tabs. Create/edit/publish/unpublish/delete real skills and education/experience entries; verify timeline kind/date behavior and automatic removal of deleted/draft selections. Automated adapters and server-rendered fixture tests do not replace live MongoDB/OAuth/Cloudinary or interactive accessibility testing.


## Contact actions, form, and inbox (Step 9)

Saved Profile & settings contact values now share one normalization/validation policy across hero, footer, contact links, and the floating menu. WhatsApp accepts a full international number with `+` or `00` and common spaces/parentheses/hyphens; local numbers beginning with zero are rejected. Telegram accepts a username, `@username`, or HTTPS t.me username URL. Email is trimmed and its domain lowercased. GitHub accepts HTTPS profile/repository paths; LinkedIn accepts HTTPS `/in/` profile paths. Unsafe/malformed/unconfigured values produce no public links. GitHub remains a profile/repository link, never a chat channel; the confirmed default remains `https://github.com/shariful-ire`.

WhatsApp message text and mailto subjects are encoded with `encodeURIComponent`; mailto addresses are encoded too, and subjects cannot inject CR/LF headers. The floating contact disclosure shows only configured WhatsApp, Telegram, and email channels, and disappears when none are valid. It exposes expanded state/controlled navigation, focuses the first link when opened, supports normal keyboard navigation, closes on Escape/outside interaction, and returns focus to the trigger on Escape. Dashboard pages suppress it. Contact destinations open the relevant external app/site; this is not embedded live chat.

The homepage contact form collects name, email, subject, and message. It provides labels, field feedback, required/length constraints, status feedback, disabled pending states, and preserves inputs on failure. Server validation is authoritative. `POST /api/contact/token` issues signed form access; `POST /api/contact` validates and stores a new unread message. **Success is returned only after an acknowledged MongoDB transaction commits both the message and its single-use token receipt.** A failed save rolls back the receipt. A used token cannot create another message even if the original message is later deleted. If a network interruption leaves submission status uncertain, do not blindly submit a fresh token/message again.

No email delivery, email notification, auto-reply, or chat service is implemented. The form stores messages in the private dashboard inbox. Public copy explains private storage; the form works independently of whether a public email address is configured.

### Contact form configuration

- `CONTACT_FORM_SECRET`: separate cryptographically random server-only secret of at least 32 characters. Generate, for example, with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and place it in `.env.local`/hosting secrets; never commit it or use `NEXT_PUBLIC_`.
- `CONTACT_PUBLIC_ORIGIN`: exact origin, no path/query/credentials. Defaults to `BETTER_AUTH_URL` when empty. Use `http://localhost:3000` in development and your actual HTTPS origin in production. Both public POST endpoints require a matching Origin header.
- `CONTACT_TRUSTED_IP_HEADER`: optional single-client-IP header supplied by a trusted ingress. **Leave blank until deployment is verified.** The proxy must overwrite client-supplied values and direct access to the application must be blocked. Comma-separated chains, missing values, and invalid IPs fail closed when a header is configured. Arbitrary forwarded headers are ignored when unset. For Vercel, review its [request-header guarantees](https://vercel.com/docs/headers/request-headers#x-forwarded-for) and any additional proxy layer before choosing `x-forwarded-for`; other deployments should provide their own verified single-IP header.

MongoDB Atlas or a replica set is required for receipt/message transactions. Google admin configuration is needed to read the inbox, but public visitors do not sign in. Cloudinary is unrelated to contact submissions. Run `npm run db:check` and `npm run db:indexes` for the additional inbox ordering and operational TTL indexes. Missing secrets, connectivity, or trusted-header configuration returns a safe 503; no success or form token is simulated.

### Rate limiting and spam protection

Counters live in MongoDB `contactRateLimits`, shared across processes, restarts, and serverless instances. Conditional atomic `$inc`/upsert operations with deterministic unique `_id` buckets enforce limits, following [MongoDB atomic-write guidance](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/). No process-memory or localStorage limiter is used. Duplicate-key quota failures return 429 and `Retry-After`; database/unacknowledged write failures fail closed.

| Operation | Shared global cap | Trusted-IP cap, when enabled | Email cap |
| --- | --- | --- | --- |
| Form token | 500 per 15 minutes | 30 per 15 minutes | None |
| Submission attempts | 100 per 15 minutes | 5 per 15 minutes | 3 per hour after valid input/token checks |

These are fixed windows, so a boundary can allow adjacent-window bursts. Invalid attempts consume the applicable global/IP quota; failed saves still consume attempt/email quota. Without a trusted IP header, global/email limits remain active. The shared global cap intentionally bounds intake but can temporarily affect all visitors under abuse. Hosting firewall limits remain appropriate for traffic floods beyond application-level spam protection.

Additional checks include a hidden honeypot, HMAC-signed random token, a two-second minimum form age, one-hour expiration, single-use receipt, 48 KB streamed request cap, bounded fields, rejected control characters, and rejection of messages with more than five HTTP(S) links. These reduce common spam; they are not a CAPTCHA or a claim to block all bots. Tokens remain only in component memory. Rate identities are HMAC hashes; raw IPs are not stored. TTL cleanup removes rate buckets after their window plus one day and receipts after token expiration. Expiry checks and bucket IDs enforce limits independently of delayed TTL cleanup.

### Private inbox

`/dashboard/inbox` provides a paginated newest-first list, all/read/unread filters, full message reading, explicit mark read/unread, and confirmed permanent deletion. Opening a message does not mutate its status. Text renders escaped; message HTML/links are not executed or auto-linked. UI timestamps are shown in Asia/Dhaka time. Messages remain stored until explicitly deleted; they are not placed in public readers, metadata, or static caches.

`GET /api/admin/inbox` and `GET /api/admin/inbox/[id]` require the shared admin helper. `PATCH/DELETE /api/admin/inbox/[id]` use the admin/Origin guard before processing data; expected timestamps reject stale changes with 409. Atomic conditional updates/deletes preserve concurrency safety. All responses are no-store, and successful mutations refresh/revalidate the inbox. The deliberately public contact-create operation is separate from admin content mutation routes and cannot set message state, IDs, or timestamps.

Once configured, test each real saved contact channel on mobile/desktop, menu keyboard behavior, a real form save/reload in the admin inbox, read/unread/delete persistence, stale-tab rejection, honeypot/timing/token replay, 429 retry handling, and a simulated database outage. Automated adapter tests do not prove real MongoDB concurrency, trusted ingress behavior, or interactive accessibility. No messages or notifications were sent as part of implementation.


## Hero 3D and motion (Step 10)

The homepage uses a procedural robot, with no model downloads, textures, external environment maps, or new credentials. The hero text and links remain ordinary server-rendered HTML outside the decorative, aria-hidden canvas. A static SVG is present in the server response and remains usable without JavaScript or WebGL.

`src/components/hero/hero-robot.tsx` gates a React lazy import behind viewport visibility, document visibility, and the reduced-motion preference. The Three/Fiber/Drei renderer is confined to `robot-scene.tsx`; do not import that module into layouts or listing pages. Offscreen/hidden scenes switch to `frameloop="never"`. Reduced motion avoids importing the scene at all and also works when changed during a visit. WebGL initialization errors or context loss fall back to the SVG.

Mobile/coarse-pointer devices use DPR 1, fewer rounded-box segments, omit the antenna geometry, and disable pointer response; desktop DPR is capped at 1.5. Lighting has no shadow maps, post-processing, particles, or remote assets. The canvas does not capture scrolling or keyboard focus.

Shared public motion uses Motion's small native-animation entry point (`motion/mini`) to enhance existing server markup: brief section reveals, small card/link lifts, button press feedback, and mobile-navigation opening. Content is never initially hidden; reduced motion disables these enhancements. Dashboard content is excluded. Existing focus indicators and accessible menu controls remain intact.

Pinned compatible stable versions: Fiber 9.8.1, Drei 10.7.9, Three 0.182.0, Motion 14.0.0, and Three types 0.182.0. React remains 19.3.0. Verified package peer ranges against npm and official [Fiber installation guidance](https://r3f.docs.pmnd.rs/getting-started/introduction), [render-loop performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [Drei documentation](https://drei.docs.pmnd.rs/), and [Motion accessibility guidance](https://motion.dev/docs/react-accessibility).

For release checks, run lint, typecheck, tests, and build. With the production server running, use fresh browser contexts to compare homepage versus `/projects`, `/posts`, and `/certificates` network requests. Only the visible, motion-enabled homepage should request the renderer chunk. Test reduced motion before loading and during a visit, scrolling the scene offscreen, switching tabs, WebGL failure, mobile widths, and keyboard navigation. A cached renderer after visiting the homepage is expected; it must not keep rendering after navigation. No environment variables were added for this step.


## Local usability fixes - 2026-10-10

The footer now has a visible **Manage portfolio** link. Open `/dashboard/projects` to add/edit projects and `/dashboard/certificates` to add/edit certificates after signing in. The dashboard overview has direct management shortcuts. These are existing secured CRUD screens, not public forms. Google authentication is still mandatory.

The confirmed phone/WhatsApp number is saved in profile settings and appears as a call link and WhatsApp action. The confirmed admin email was saved only in server configuration, not as a public contact email. Three real homepage section records (Projects, Certificates, Latest posts) were created because none existed; each reads only published content. No project/certificate/post entries were fabricated.

The local `CONTACT_FORM_SECRET` and `BETTER_AUTH_SECRET` have been generated securely. Restart the development server after the environment changes and visit **http://localhost:3000**. The LAN address is not automatically trusted for authentication/contact submission. Production still requires matching HTTPS origins.

The network's default DNS resolver refused MongoDB Atlas SRV lookups. `MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8` is an optional local fix, verified by a successful live ping and saved settings/sections. The variable accepts up to three comma-separated IP addresses. It changes Node's process DNS resolver, not the OS configuration; leave it empty on networks with working DNS. See [Node DNS configuration](https://nodejs.org/api/dns.html#dnssetserversservers). Never disable TLS or weaken database authentication to work around connectivity problems.

The root HTML now declares its smooth-scroll behavior as [Next.js requires](https://nextjs.org/docs/messages/missing-data-scroll-behavior). Fiber 9.8.1 still constructs `THREE.Clock`; [Three deprecated that class in r183](https://threejs.org/docs/pages/Clock.html). Three and its types are pinned to compatible stable 0.182.0 until Fiber migrates, without patching node_modules or suppressing console warnings.

Still needed to actually sign in and upload: Google client ID/client secret and Cloudinary cloud name/API key/API secret. Put these in `.env.local` following the setup sections above, then restart. The owner email and generated server secrets are already set. Homepage content remains honestly empty until genuine entries are added and published.

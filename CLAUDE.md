@AGENTS.md

---

# GW Help Center Doc Tool — Technical Reference

## Project Summary

A custom documentation site built on Next.js to replace MkDocs. Designed to be self-hosted, authenticated via Game Warden (Keycloak) SSO, and fully driven by a central YAML nav config. The tool solves three hard limitations of MkDocs: flat nav only, 1:1 file-to-URL mapping, and no built-in auth layer.

## Implementation Location

`/Users/connienguyen/Documents/helpcenter-poc/` — Next.js app (POC phase)

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR middleware for auth; React/MDX; self-hostable |
| Content | MDX | Markdown + React components; familiar authoring syntax |
| Nav config | YAML (`nav/*.yml`) | Central, human-readable, decoupled from file paths |
| Auth | next-auth v5 + Keycloak OIDC | GW uses Keycloak; native next-auth provider support |
| Styling | Tailwind CSS + @tailwindcss/typography | Fast theming; prose styling for doc content |
| Versioning | Per-version `nav.yml` + `versions.yml` | Clean version separation without duplicating content files |
| Container | Docker + Nginx | Self-hosted; Nginx handles TLS and reverse proxy |

---

## Architecture

```
User → Nginx (443) → Next.js App (3000)
                          │
                          ├── middleware.ts        ← auth + RBAC check (edge, before render)
                          ├── app/[...slug]/       ← catch-all doc renderer
                          ├── lib/nav.ts           ← nav.yml parser + slug resolver
                          ├── lib/versions.ts      ← versions.yml parser
                          ├── lib/mdx.ts           ← MDX file loader + frontmatter parser
                          ├── lib/auth.ts          ← session + role helpers
                          └── components/
                                ├── Nav/TopNav     ← dropdown nav + version selector
                                ├── Sidebar/       ← left sidebar from nav tree
                                └── mdx/           ← MDX component library

Next.js ←─ OIDC/OAuth2 ─→ Keycloak (Game Warden IdP)
```

---

## Key Features

### 1. Central YAML Nav (MkDocs-style)

All navigation is defined in `nav/*.yml`. File paths and URL slugs are fully decoupled — adding a page to the nav does not require it to live at a matching file path.

```yaml
- label: "Submit an Application"
  slug: /applications/submit          # URL served at this path
  file: content/applications/submit.mdx  # MDX file read from here
  roles: [vendor]                     # RBAC: who can see and access this page
```

### 2. Same Doc at Multiple Nav Locations

The same MDX file can appear at any number of slugs with independent RBAC per location. No redirects, no duplicate files.

```yaml
# Vendor-facing path
- label: "Submit an Application"
  slug: /applications/submit
  file: content/applications/submit.mdx
  roles: [vendor]

# Admin-facing path — same file, different slug, different role requirement
- label: "Review Applications"
  slug: /admin/applications/review
  file: content/applications/submit.mdx
  roles: [admin]
```

### 3. Dropdown Nav Menus

Top nav supports multi-level dropdown menus defined in `nav.yml` via `dropdown: true`. Items hidden from users who lack the required role are automatically excluded from the dropdown.

```yaml
- label: "Applications"
  dropdown: true
  items:
    - label: "Submit an Application"
      slug: /applications/submit
      roles: [vendor]
    - label: "Body of Evidence"
      slug: /applications/boe
      roles: [vendor]
```

### 4. Version Selection

Versions are defined in `versions.yml`. Each version references its own `nav.yml`, allowing the nav structure and content to differ per version. The version selector in the top nav preserves the current page path when switching versions.

```yaml
# versions.yml
versions:
  - id: "v2.0"
    label: "v2.0 (Latest)"
    stable: true
    nav: nav/nav-v2.0.yml
  - id: "v1.9"
    label: "v1.9"
    stable: true
    nav: nav/nav-v1.9.yml
  - id: "dev"
    label: "dev"
    stable: false
    badge: "Beta"
    nav: nav/nav-dev.yml
```

Versioned slugs are prefixed: `/v2.0/getting-started/overview`, `/v1.9/getting-started/overview`, etc.

### 5. React/MDX Components

All content files are MDX. Custom components are registered globally and available in every doc without imports:

| Component | Replaces | Usage |
|---|---|---|
| `<Callout type="tip/warning/important/note">` | MkDocs `!!!tip` admonitions | Inline callout blocks |
| `<Steps>` + `<Step n={1} title="...">` | MkDocs timeline divs | Numbered step sequences |

### 6. Self-Hosted via Docker

The app runs as a single Docker container behind Nginx. No Vercel, no Cloudflare required.

```
Docker Host
  ├── nginx (443/80) — TLS termination, reverse proxy
  └── next-app (3000) — Next.js SSR app
```

---

## Authentication & RBAC

### How Users Authenticate

1. User visits the doc site
2. `middleware.ts` checks for a valid session cookie
3. No session → redirect to Keycloak login (Game Warden credentials)
4. User authenticates with their GW username/password
5. Keycloak returns an OIDC token containing the user's roles
6. `next-auth` stores roles in an encrypted server-side session cookie
7. All subsequent requests read roles from the session — no re-auth needed

### Keycloak Configuration (`auth.ts`)

```ts
Keycloak({
  clientId: process.env.GW_CLIENT_ID,
  clientSecret: process.env.GW_CLIENT_SECRET,
  issuer: process.env.GW_ISSUER_URL,
  // e.g. https://auth.gamewarden.io/realms/gw
})
```

Required env vars:
```
GW_ISSUER_URL        Keycloak realm URL
GW_CLIENT_ID         Client ID registered in GW Keycloak
GW_CLIENT_SECRET     Client secret from GW Keycloak
NEXTAUTH_SECRET      Random 32-char string for session encryption
NEXTAUTH_URL         Public URL of the doc site
```

### Where Roles Come From

Roles are assigned to users in the **Keycloak Admin Console** by the GW platform team:

```
Keycloak → Realm: game-warden → Users → [user] → Role Mappings
```

The roles are embedded in the JWT token returned at login and extracted by next-auth into the session.

### Where Content Access is Defined

Access is defined per nav entry in `nav.yml` via the `roles` field:

| `roles` value | Who can access |
|---|---|
| `[]` (empty) | Anyone with a valid GW login (public within the site) |
| `[vendor]` | Users with the `vendor` role in Keycloak |
| `[admin]` | Users with the `admin` role in Keycloak |
| `[vendor, admin]` | Users with either role |

The `roles` field enforces two things simultaneously:
- **Nav visibility** — items are hidden from users without the required role
- **Page access** — direct URL access is blocked even if the nav item is hidden

### Planned Role Taxonomy

| Role | Who has it | Access scope |
|---|---|---|
| *(no role / public)* | Any authenticated GW user | General docs, getting started guides |
| `vendor` | Software vendors onboarding apps | App Central, BoE guides, submission workflows |
| `admin` | Second Front staff | User management, internal processes |
| `second_front` | Internal team | All content including drafts |

Role names must match exactly between Keycloak and `nav.yml`.

---

## Folder Structure

```
helpcenter-poc/
├── app/
│   ├── [...slug]/page.tsx     # Catch-all doc renderer
│   ├── api/auth/[...nextauth] # next-auth Keycloak handler
│   └── layout.tsx
├── components/
│   ├── Nav/
│   │   ├── TopNav.tsx         # Top nav with dropdowns
│   │   └── VersionSelector.tsx
│   ├── Sidebar/Sidebar.tsx
│   └── mdx/                   # MDX component library
│       ├── Callout.tsx
│       ├── Steps.tsx
│       └── index.ts
├── content/                   # All MDX source files (any structure)
│   ├── getting-started/
│   ├── applications/
│   ├── admin/
│   ├── v1.9/                  # Version-specific content overrides
│   └── dev/
├── nav/                       # One nav.yml per version
│   ├── nav.yml                # Default (unversioned) nav
│   ├── nav-v2.0.yml
│   ├── nav-v1.9.yml
│   └── nav-dev.yml
├── lib/
│   ├── nav.ts                 # nav.yml parser, slug resolver
│   ├── nav-types.ts           # Shared types (client-safe)
│   ├── mdx.ts                 # MDX file loader + gray-matter
│   ├── versions.ts            # versions.yml parser, version routing
│   └── auth.ts                # Session helpers + hasAccess()
├── versions.yml               # Version registry
├── middleware.ts              # Auth + RBAC enforcement (edge)
├── Dockerfile
├── nginx.conf
└── docker-compose.yml
```

---

## Data Flow: Page Request

```
1. GET /v2.0/applications/submit

2. middleware.ts
   ├── Session cookie present? → decode → roles: [vendor]
   ├── No session → redirect to Keycloak login
   └── Pass through with roles in request headers

3. app/[...slug]/page.tsx
   ├── Extract version from slug → "v2.0"
   ├── Load nav/nav-v2.0.yml
   ├── Look up slug → { file: content/applications/submit.mdx, roles: [vendor] }
   ├── hasAccess([vendor], [vendor]) → true
   ├── Load + compile MDX file
   └── Render page with TopNav, Sidebar, MDX content

4. Browser receives fully server-rendered HTML
```

---

## POC vs Production

| | POC (current) | Production |
|---|---|---|
| Auth | Mock user in `lib/auth.ts` | next-auth + Keycloak OIDC |
| Session | Hardcoded roles array | Encrypted cookie from Keycloak JWT |
| Hosting | `npm run dev` locally | Docker + Nginx, self-hosted |
| RBAC enforcement | Page-level in `page.tsx` | `middleware.ts` edge layer |
| TLS | None | Nginx with certs |

To test different roles in the POC, edit `lib/auth.ts` and change `MOCK_USER.roles`:
```ts
roles: []                   // public only
roles: ["vendor"]           // vendor access
roles: ["admin"]            // admin access
roles: ["vendor", "admin"]  // full access
```

---

## Open Dependencies (Pre-Production)

1. **Keycloak client registration** — GW platform team must register the help center as a client in the GW realm and provide client ID + secret
2. **Roles in token claims** — Keycloak must be configured to include realm roles in the JWT (GW platform team config)
3. **Role taxonomy confirmed** — agree on role names (`vendor`, `admin`, `second_front`) before wiring nav.yml
4. **Hosting environment** — server for Docker deployment; TLS cert strategy (self-managed or Let's Encrypt)

---

## Current POC State (as of June 2026)

### What's been built and working

**Navigation & structure**
- Top nav with dropdown menus driven entirely from `nav.yml`
- 4 top-level dropdowns: Getting Started, Platform & Security, Integrations, Release Notes
- Each dropdown item is a section with its own sidebar sub-navigation
- Sidebar shows the full group (all categories + children) when you're inside any page of that group
- Category labels are ALL CAPS, vertical connector lines only appear between child docs (not between categories)
- Version selector in top nav — switches between v2.0 (latest), v1.9, dev (Beta)
- Version switching preserves current page path

**Current nav info architecture:**
```
Getting Started
  ├── Authorization Path (DoW, FedRAMP, Commercial)
  ├── Entrance Criteria (General, Technical, Design Patterns, Containers)
  ├── Onboarding Process (Quickstart, Create Account, Access Control)
  └── Game Warden App (App Central, BoE, Findings, Support Tickets)

Platform & Security
  ├── Platform Architecture (GW Architecture, Pipelines, Managed Services, Logging)
  ├── Supported Services
  └── Security & Compliance (Data Protection, RMF, ITAR, CVEs)

Integrations
  ├── Amazon Bedrock
  └── Cohere

Release Notes
```

**Doc page features**
- MDX rendering with remark-gfm (tables, task lists, strikethrough)
- Breadcrumbs: `Getting Started / Authorization Path / DoW Deployment`
- Right-side sticky "On this page" ToC with active heading tracking and left-border highlight
- Prev / Next page navigation at the bottom of every page
- Section landing pages automatically show child cards (no blank landing pages)
- Anchor links on all headings via rehype-slug + rehype-autolink-headings
- Heading anchor underlines removed via CSS

**MDX component library** (`components/mdx/`)
- `<Callout type="tip|warning|important|note|danger|success">` — exact 2F brand colors from extra.css
- `<Steps>` + `<Step n={N} title="...">` — numbered step sequences
- `<CodeBlock>` — dark code blocks (`#1a1d23` background) with language label + copy button
- Inline `code` styled with light gray background

**Search**
- `⌘K` modal search across all docs
- Dark-themed modal (`#1a1d23`) matching Fern aesthetic
- Filter chips by Section (Getting Started, Platform & Security, Integrations) and Role (Vendor, Admin)
- Results show: doc icon + title + breadcrumb path (`Group › Section`) + "Guide" badge
- Keyboard navigation (↑↓ to move, ↵ to select, Esc to close)
- Full-text search API at `/api/search` — scores title > description > body

**Homepage** (`/home`, inspired by LaunchDarkly docs)
- Dark hero section with "Get Started" and "Choose Your Path" CTAs
- 3 feature cards: Entrance Criteria, Platform Architecture, Onboarding Process
- "News from Second Front" + "What's new in GW" two-column section
- "From Second Front" resource cards (Events, Podcast, Customer Stories, Library) with Lucide icons
- Footer with copyright

**Mobile navigation**
- Hamburger menu in top nav on mobile — sidebar hidden, desktop nav hidden
- Slide-in dark drawer with expandable nav groups (chevron toggle)
- Drawer auto-expands active group and highlights current page on open
- Version selector and sign in/out in drawer footer
- Body scroll locked when drawer is open; auto-closes on navigation

**Doc page actions** (`components/DocActions/DocActions.tsx`)
- "View as Markdown" and "Download Markdown" links served via `/api/raw`
- Optional "Download PDF" link from `download_pdf` frontmatter field
- Buttons hidden in offline builds (no server available)

**Image zoom**
- Click any markdown image to zoom in-place (1.7× scale); click again to zoom out
- Implemented via `components/ZoomImages/ZoomImages.tsx` — re-binds on route change

**Details / collapsible component** (`components/mdx/Details.tsx`)
- Anchor-linkable: `<Details id="my-section" summary="...">` renders with a copy-link button
- Auto-opens and scrolls into view when URL hash matches the `id`
- Chevron animates open/close

**Content**
- 38 substantive placeholder MDX docs written across all sections
- Realistic GW content (not lorem ipsum) — technical writers can build directly on these
- Timeline CSS from existing MkDocs `stylesheets/timeline.css` ported to globals.css

**Styling**
- Tailwind CSS + @tailwindcss/typography
- Callout colors exactly match Second Front brand from `helpcenter/docs/stylesheets/extra.css`
- Prose max-width: 680px (tighter than default for better line length)
- Tables: borderless with alternating row shading (`#f9f9f9` / `#fff`)
- Code blocks: `#1a1d23` cool dark background

### How to run locally

```bash
cd /Users/connienguyen/Documents/helpcenter-poc

# Kill any existing server first
kill $(lsof -ti:3000) 2>/dev/null

# Start dev server
npm run dev
# → http://localhost:3000
```

### To test different user roles (mock auth)

Edit `lib/auth.ts` line 13:
```ts
roles: []                   // public only
roles: ["vendor"]           // vendor pages
roles: ["admin"]            // admin pages
roles: ["vendor", "admin"]  // everything
```

### What's NOT done yet (next steps for production)

| Task | Notes |
|---|---|
| **Keycloak SSO** | Replace mock auth in `lib/auth.ts` with next-auth + Keycloak provider |
| **Middleware RBAC** | Move auth check from `page.tsx` to `middleware.ts` edge layer |
| **Docker + Nginx** | Dockerfile exists but not tested end-to-end |
| **Real content migration** | MkDocs `.md` files need converting to MDX, nav.yml needs full population |
| **MkDocs admonitions → Callout** | Find/replace `!!!tip` → `<Callout type="tip">` across all docs |
| **MkDocs timeline divs** | Timeline CSS ported; existing `<div class="timeline">` blocks will render |
| **Offline ZIP in CI** | `build-offline.sh` runs manually; wire into CI to auto-publish ZIPs on release |
| **Dark mode** | Not implemented |
| **Custom 404 page** | Uses Next.js default |

### Offline doc site build

Authenticated users can download a self-contained offline ZIP of any stable version directly from the version selector (download icon appears on hover). The ZIP contains pre-rendered static HTML — no Next.js server required.

**Building a package**

```bash
# From the repo root — builds v2.0 by default
./scripts/build-offline.sh v2.0
./scripts/build-offline.sh v1.9

# Output: offline-builds/gw-helpcenter-<version>-offline.zip
```

The script:
1. Pre-generates `public/search-index.json` (full-text search index)
2. Temporarily stashes server-only API routes (`/api/raw`, `/api/download`, `/api/search`, `/api/auth`) outside `app/` so `next build` doesn't reject them in static export mode
3. Runs `OFFLINE_MODE=true next build` → outputs static HTML to `out/`
4. Writes `launch.sh` (Mac/Linux) and `launch.bat` (Windows) launcher scripts into `out/`
5. Zips `out/` to `offline-builds/gw-helpcenter-<version>-offline.zip`
6. Restores stashed routes on exit (even on error, via `trap`)

**How users launch it**

Unzip the package, then:

| Platform | Steps |
|---|---|
| **Mac / Linux** | Double-click `launch.sh`, or run `./launch.sh` in Terminal |
| **Windows** | Double-click `launch.bat` |

The launcher starts a local HTTP server on port **8765** and opens `http://localhost:8765/home/` in the browser automatically. It uses **Python 3 `http.server`** (pre-installed on most systems) with a fallback to Node/npx. No internet connection required after download.

**How offline mode differs from the live site**

| Feature | Live site | Offline package |
|---|---|---|
| Auth | Keycloak SSO (prod) / mock cookie (dev) | Bypassed — full access granted at download time |
| Search | `/api/search` (server-side, runtime) | `/search-index.json` (pre-built at build time) |
| "View/Download Markdown" buttons | Available via `/api/raw` | Hidden — no server |
| "Download PDF" button | Available if `download_pdf` set in frontmatter | Available (static link) |
| Offline download link | Shown in version selector for logged-in users | N/A |

**Key env vars**

| Var | Effect |
|---|---|
| `OFFLINE_MODE=true` | Enables `output: export`, bypasses auth, hides Markdown API buttons |
| `TARGET_VERSION=v2.0` | (Reserved for future use — scopes build to one version) |

**Download endpoint (live site)**

`GET /api/download?version=v2.0` — auth-gated; streams pre-built ZIP from `offline-builds/`. Returns 403 for unstable versions, 404 if ZIP hasn't been built yet. Only visible to logged-in users (download icon hidden otherwise).

**What's gitignored**

```
offline-builds/          # built ZIPs (rebuild from script)
public/search-index.json # generated at build time
```

---

### Key files to know

| File | Purpose |
|---|---|
| `nav/nav.yml` | Default nav — source of truth for site structure |
| `nav/nav-v2.0.yml` | v2.0 versioned nav (slugs prefixed `/v2.0/`) |
| `versions.yml` | Version registry |
| `lib/nav.ts` | Nav parser, all slug lookup functions |
| `lib/nav-types.ts` | Shared TypeScript types (client-safe, no `fs`) |
| `lib/auth.ts` | Mock auth — **swap this for Keycloak in production** |
| `lib/mdx.ts` | MDX file loader + ToC extractor |
| `lib/versions.ts` | Version config loader + slug prefix helpers |
| `app/[...slug]/page.tsx` | Main doc page renderer |
| `app/home/page.tsx` | Homepage |
| `app/api/search/route.ts` | Search API — builds full-text index from all MDX |
| `app/api/raw/route.ts` | Serves raw MDX source files (auth-unrestricted, path-restricted) |
| `app/api/download/route.ts` | Auth-gated offline ZIP download endpoint |
| `app/globals.css` | Global CSS — callout colors, prose overrides, timeline styles |
| `components/Nav/TopNav.tsx` | Top nav — desktop dropdowns + mobile hamburger |
| `components/Nav/MobileDrawer.tsx` | Mobile slide-in nav drawer |
| `components/Nav/VersionSelector.tsx` | Version switcher + offline download icon |
| `components/Search/SearchModal.tsx` | ⌘K search modal — falls back to search-index.json offline |
| `components/DocActions/DocActions.tsx` | View/Download Markdown + PDF buttons |
| `components/ZoomImages/ZoomImages.tsx` | Click-to-zoom for markdown images |
| `components/mdx/Details.tsx` | Anchor-linkable collapsible `<details>` component |
| `components/Toc/Toc.tsx` | Right-side sticky ToC |
| `components/Breadcrumbs/Breadcrumbs.tsx` | Page breadcrumbs |
| `components/PageNav/PageNav.tsx` | Prev/Next page nav |
| `components/SectionCards/SectionCards.tsx` | Child cards on section landing pages |
| `components/Code/CodeBlock.tsx` | Code block with copy button |
| `scripts/build-offline.sh` | Builds versioned offline ZIP — run this to generate packages |
| `scripts/build-search-index.ts` | Pre-generates `public/search-index.json` from MDX content |


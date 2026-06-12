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
- 3 feature cards: Authorization Paths, Entrance Criteria, App Central
- "Start here" quick links + "What's new" columns
- Deployment Paths section (DoW/FedRAMP/Commercial cards)
- Resources section (Slack, Training, Support, Release Notes)
- Footer with copyright

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
| **Search index performance** | Currently rebuilds on every cold start — consider persisting to a JSON file at build time |
| **Dark mode** | Not implemented |
| **Mobile nav** | Top nav collapses poorly on small screens |
| **Custom 404 page** | Uses Next.js default |

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
| `app/globals.css` | Global CSS — callout colors, prose overrides, timeline styles |
| `components/Search/SearchModal.tsx` | ⌘K search modal + trigger button |
| `components/Toc/Toc.tsx` | Right-side sticky ToC |
| `components/Breadcrumbs/Breadcrumbs.tsx` | Page breadcrumbs |
| `components/PageNav/PageNav.tsx` | Prev/Next page nav |
| `components/SectionCards/SectionCards.tsx` | Child cards on section landing pages |
| `components/Code/CodeBlock.tsx` | Code block with copy button |


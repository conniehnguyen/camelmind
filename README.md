# CamelMind

**Doc site spun up in minutes.**

Open-source docs-as-code platform for documentation sites, API references, and developer portals.

Build beautiful documentation from Markdown and MDX. Publish instantly, deploy anywhere, and keep documentation close to your code.

[Get Started](#quick-start) · [Documentation](/getting-started/overview) · [Auth & RBAC](/guides/auth-rbac)

---

## Why CamelMind?

Most documentation platforms force teams to choose between flexibility and ease of use. CamelMind gives you both.

- Markdown-first authoring with MDX components
- YAML navigation decoupled from file paths
- Instant local development with Next.js
- Built-in full-text search
- Beautiful Sahara theme with light and dark modes
- Optional SSO + role-based access control
- Static export for offline or self-hosted deployments
- Fully open source (MIT)

---

## Quick Start

Scaffold a new site with the CLI — no git clone needed:

```bash
npx camelmind init my-docs
cd my-docs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### CLI options

```bash
npx camelmind init my-docs               # scaffold + npm install
npx camelmind init my-docs --no-install  # scaffold only, skip npm install
npx camelmind version                    # show installed version + check for updates
npx camelmind --version                  # print version number and exit
npx camelmind --help                     # list all commands
```

---

## Project Structure

```text
my-docs/
├── content/              # MDX documentation files
├── nav/
│   └── nav.yml           # Site navigation + RBAC roles
├── camelmind.config.ts   # Site configuration
├── versions.yml          # Version registry
└── package.json
```

---

## Configuration

Edit `camelmind.config.ts` to customize your site:

```typescript
export default {
  title: "My Docs",
  tagline: "Documentation for my product",
  auth: {
    enabled: false,        // set true for SSO + RBAC
    provider: "oidc",      // or "dev-mock" for local testing
  },
}
```

See the [Configuration Reference](/reference/configuration) for all options.

---

## API Reference (Optional)

CamelMind can render an interactive API reference from one or more OpenAPI 3.x specs alongside your documentation.

### 1. Declare your specs

Add `apiReference` to `camelmind.config.ts`. The `specs` object is a named registry — each key is an identifier you choose, used to reference the spec from `versions.yml`:

```typescript
export default {
  title: "My Docs",
  apiReference: {
    enabled: true,
    navLabel: "API Reference",
    languages: ["curl", "python", "javascript", "go"],  // code sample languages
    roles: [],                                           // [] = anyone logged in; ["admin"] = role-gated
    specs: {
      "main-api": {
        label: "Main API",         // shown in the tab switcher
        file: "api/openapi.yml",   // path relative to project root
      },
      "partner-api": {
        label: "Partner API",
        file: "api/openapi-partner.yml",
      },
    },
  },
}
```

The API Reference appears in the top nav and is served at `/api-reference`.

### 2. Assign specs to versions

In `versions.yml`, each version can reference a single spec or show multiple specs in tabs.

**Single spec per version:**

```yaml
versions:
  - id: "v2.0"
    label: "v2.0 (Latest)"
    stable: true
    nav: nav/nav-v2.0.yml
    api_reference:
      spec: main-api              # key from camelmind.config.ts specs
```

**Multiple specs as tabs (URL-based, deep-linkable):**

```yaml
  - id: "v1.9"
    label: "v1.9"
    stable: true
    nav: nav/nav-v1.9.yml
    api_reference:
      tabs:
        - id: main                # becomes a URL segment: /api-reference/v1.9/main/...
          spec: main-api
        - id: partner
          spec: partner-api
```

**Disable API Reference for a version:**

```yaml
  - id: "dev"
    label: "dev"
    stable: false
    nav: nav/nav-dev.yml
    api_reference: false          # hides the link; URL returns 404
```

| `api_reference` value | Behavior |
|---|---|
| omitted or `true` | Uses the first spec declared in `specs` |
| `false` | Hides the API Reference for this version |
| `{ spec: "key" }` | Shows a single named spec |
| `{ tabs: [...] }` | Shows multiple specs with a tab switcher in the sidebar |

### URL structure

| Setup | URL pattern |
|---|---|
| Single spec, no version | `/api-reference/tag/operationId` |
| Single spec, versioned | `/api-reference/v2.0/tag/operationId` |
| Tabs, versioned | `/api-reference/v1.9/main/tag/operationId` |

Each tab has its own URL, making every endpoint deep-linkable and shareable.

---

## LLM-Friendly Docs (Optional)

CamelMind can serve your documentation to AI tools like ChatGPT, Claude, and Cursor via the [llms.txt standard](https://llmstxt.org/).

### Enable it

Add `llms` to `camelmind.config.ts`:

```typescript
export default {
  title: "My Docs",
  llms: {
    enabled: true,
    directive: "For a complete documentation index, see /llms.txt. To read any public page as Markdown, append .md to the URL.",
  },
}
```

### What gets generated

| Endpoint | What it returns |
|---|---|
| `/llms.txt` | Index of all public pages with titles and descriptions |
| `/<slug>.md` | Raw Markdown of that page with the agent directive prepended |

Only pages with `roles: []` in `nav.yml` are included. Role-restricted pages return `401` and are never listed in `/llms.txt` — non-customers can't extract private content by asking an LLM.

### Control what LLMs see per block

Use `<LLMOnly>` and `<LLMIgnore>` tags inside any MDX file to show different content to AI vs. human readers:

| Tag | Browser | `.md` response |
|---|---|---|
| `<LLMOnly>` | Hidden | Included |
| `<LLMIgnore>` | Visible | Stripped |

```mdx
Follow these steps to create an environment:

<LLMIgnore>
1. Navigate to App Central and click **New Environment**.
2. Fill in the form and click **Submit**.
</LLMIgnore>

<LLMOnly>
Use the CLI:
```bash
cm env create --name my-env
```
</LLMOnly>
```

Humans see the click-through steps. LLMs see the CLI command. Both tags are available in every MDX file — no imports needed.

---

## Offline Package and PDF Export (Optional)

CamelMind can build a self-contained offline ZIP and a master PDF for any stable version. Both are generated together by one script and made available to users directly from the version selector in the top nav.

### Build the artifacts

```bash
./scripts/build-offline.sh           # defaults to your first stable version
./scripts/build-offline.sh latest    # explicit version ID
./scripts/build-offline.sh v2        # any stable version ID from versions.yml
```

**Output:**
```
offline-builds/
  camelmind-<version>-offline.zip   # self-contained static HTML site
  camelmind-<version>.pdf           # single master PDF (cover + ToC + all pages)
```

The version ID in the filename must match an `id` in `versions.yml`. Builds for unstable versions (`stable: false`) are blocked by the download endpoint.

### What the script does

1. Pre-generates `public/search-index.json` so search works without a server
2. Stashes server-only routes (`/api/download`, `/api/search`, `/api/raw`, `/api/feedback`, `/api/llms`, `/api/auth`) so `next build` accepts static export mode
3. Runs `OFFLINE_MODE=true next build` → static HTML in `out/`
4. Starts a temporary HTTP server on port 8766, renders every doc page with Playwright, and assembles a master PDF (cover page + table of contents + all pages in nav order)
5. Zips `out/` and moves the PDF to `offline-builds/`
6. Restores all stashed routes on exit

### How users access them

When the artifacts are present in `offline-builds/`, download icons appear next to each stable version in the top nav version selector:

- **PDF icon** (`FileText`) — downloads `camelmind-<version>.pdf`
- **ZIP icon** (`Download`) — downloads `camelmind-<version>-offline.zip`

The icons show to **any visitor** when auth is disabled, and to **logged-in users only** when auth is enabled. The download endpoint (`/api/download`) enforces this automatically.

Users unzip the package and run the included launcher:

| Platform | How to open |
|---|---|
| Mac / Linux | Double-click `launch.sh`, or run `./launch.sh` in Terminal |
| Windows | Double-click `launch.bat` |

This starts a local HTTP server on port 8765 and opens the browser automatically. No internet required.

### What changes in the offline package

| Feature | Live site | Offline package |
|---|---|---|
| Auth | SSO / RBAC as configured | Bypassed — full access granted at build time |
| Search | Server-side `/api/search` | Pre-built `search-index.json` |
| "View / Download Markdown" buttons | Available | Hidden (no server) |
| "Download PDF" button | Available (where configured) | Available |

Because auth is bypassed in the offline build, the ZIP contains **all pages** regardless of role. Only distribute offline packages to users who already have access.

### Build only the PDF (against a live dev server)

```bash
npm run dev                    # terminal 1 — must be running
./scripts/build-pdf.sh         # terminal 2 — renders against localhost:3000
```

---

## Authentication (Optional)

Auth is **disabled by default**. When enabled, CamelMind supports:

| Mode | Behavior |
|---|---|
| **Public** | No login required (default) |
| **RBAC-only** | Public pages open; role-gated pages require SSO |
| **Private site** | Entire site behind SSO |

Bring your own OIDC identity provider — Keycloak, Auth0, Okta, Azure AD, and others work out of the box. See [Auth & RBAC](/guides/auth-rbac).

---

## License

MIT License — see [LICENSE](LICENSE).

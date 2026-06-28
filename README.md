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

CamelMind can produce a self-contained offline ZIP and a master PDF for any stable version. Users download them directly from the version selector in the top nav — no account or internet connection required after download.

---

### For doc owners: enabling the feature

The offline package and PDF are not generated on demand. You build them once (or in CI on each release) and the download links appear automatically on the live site.

**Step 1 — Build the artifacts**

```bash
./scripts/build-offline.sh latest    # version ID must match an id in versions.yml
./scripts/build-offline.sh v2        # build a specific version
```

This produces two files in `offline-builds/`:

```
offline-builds/
  camelmind-<version>-offline.zip   # self-contained static HTML site
  camelmind-<version>.pdf           # master PDF: cover + table of contents + all pages
```

> The build runs a full `next build` static export and requires Playwright for PDF rendering. It cannot run while `npm run dev` is active on the same machine.

**Step 2 — Start the server**

```bash
npm run dev    # or deploy to production
```

Once the server is running and `offline-builds/` contains the artifacts, download icons appear automatically next to each stable version in the top nav:

- **PDF icon** — downloads the master PDF
- **ZIP icon** — downloads the offline package

The icons are visible to **all visitors** when auth is disabled, and to **logged-in users only** when auth is enabled.

**Keeping artifacts up to date**

Rebuild whenever content changes significantly. The artifacts persist across server restarts — you only need to rebuild to refresh the content inside them.

In production, run the build script in CI as part of your release process and deploy `offline-builds/` alongside the app.

**A note on restricted content**

Auth is bypassed at build time, so the offline ZIP and PDF contain **all pages** regardless of role. Only distribute offline packages to users who already have access to your site.

---

### For end users: downloading and running the offline site

**Step 1 — Sign in (if your site requires it)**

If the doc site is behind authentication, the download icons are only visible after you log in. Sign in with your credentials, then proceed to the version selector.

If the site is public, no sign-in is needed.

**Step 2 — Download**

Hover over the version label in the top nav. Click the icon next to the version you want:

- **ZIP icon** (↓) → offline site package
- **PDF icon** → single PDF of all docs

The download starts immediately in your browser.

> **Restricted content:** the offline package and PDF include all pages you have access to — including any role-restricted content — because access was verified when you downloaded the file. No further login is required once you have the package.

**Step 3 — Run the offline site (ZIP)**

1. Unzip the downloaded file — macOS extracts it automatically when you double-click it.
2. Open the extracted folder and run the launcher:

| Platform | Steps |
|---|---|
| Mac / Linux | Double-click `launch.sh`, or run `./launch.sh` in Terminal |
| Windows | Double-click `launch.bat` |

The launcher starts a local server and opens [http://localhost:8765/home/](http://localhost:8765/home/) in your browser automatically. All content — including restricted pages — is accessible without signing in again.

3. Press `Ctrl+C` in the Terminal window to stop the server when you're done.

**No internet connection required** once the package is downloaded. Search, navigation, and all content work fully offline.

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

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

CamelMind can render an interactive API reference from an OpenAPI 3.x spec alongside your documentation.

### Enable it

Add `apiReference` to `camelmind.config.ts`:

```typescript
export default {
  title: "My Docs",
  apiReference: {
    enabled: true,
    spec: "api/openapi.yml",       // path to your OpenAPI spec (relative to project root)
    navLabel: "API Reference",     // label shown in the top nav
    languages: ["curl", "python", "javascript", "go"],  // code sample languages
    roles: [],                     // [] = anyone logged in; ["admin"] = role-gated
  },
}
```

Place your spec file at the path you set (e.g. `api/openapi.yml`). The API Reference will appear in the top nav and be served at `/api-reference`.

### Per-version specs

If you have multiple doc versions, each version can point to its own OpenAPI spec via `versions.yml`:

```yaml
versions:
  - id: "v2.0"
    label: "v2.0 (Latest)"
    stable: true
    nav: nav/nav-v2.0.yml
    api_reference:
      spec: api/openapi-v2.0.yml        # version-specific spec

  - id: "v1.9"
    label: "v1.9"
    stable: true
    nav: nav/nav-v1.9.yml
    api_reference:
      spec: api/openapi-v1.9.yml

  - id: "dev"
    label: "dev"
    stable: false
    nav: nav/nav-dev.yml
    api_reference: false                # hide API Reference for this version
```

| `api_reference` value | Behavior |
|---|---|
| omitted | Uses the site-level spec from `camelmind.config.ts` |
| `false` | Hides the API Reference link; URL returns 404 |
| `{ spec: "..." }` | Loads a version-specific OpenAPI spec |

Versioned API Reference is served at `/api-reference/<version>/tag/operationId` (e.g. `/api-reference/v2.0/applications/create`).

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

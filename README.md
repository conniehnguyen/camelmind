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

```bash
git clone https://github.com/camelmind/camelmind.git my-docs
cd my-docs
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

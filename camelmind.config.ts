import type { CamelMindConfig } from "./lib/config-types"

/**
 * CamelMind site configuration.
 *
 * Auth can also be toggled via environment variables for deployment:
 *   CAMELMIND_AUTH_ENABLED=true
 *   CAMELMIND_AUTH_REQUIRE_LOGIN=true
 *   CAMELMIND_AUTH_PROVIDER=oidc|dev-mock
 *   OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET
 *   SESSION_SECRET
 */
const config: CamelMindConfig = {
  title: "CamelMind",
  tagline: "Doc site spun up in minutes.",
  url: process.env.CAMELMIND_URL ?? "http://localhost:3000",

  contentDir: "content",
  navFile: "nav/nav.yml",
  versionsFile: "versions.yml",

  auth: {
    // Default: public site, no login required
    enabled: process.env.CAMELMIND_AUTH_ENABLED === "true",
    // When true, every page requires SSO (private site). When false, only pages
    // with roles in nav.yml require login (RBAC-only mode).
    requireLogin: process.env.CAMELMIND_AUTH_REQUIRE_LOGIN === "true",
    provider: (process.env.CAMELMIND_AUTH_PROVIDER as "dev-mock" | "oidc") ?? "dev-mock",

    oidc: {
      issuer: process.env.OIDC_ISSUER ?? "",
      clientId: process.env.OIDC_CLIENT_ID ?? "",
      clientSecret: process.env.OIDC_CLIENT_SECRET ?? "",
      // JWT claim path for roles — varies by IdP:
      //   Keycloak:  realm_access.roles
      //   Okta/Azure: groups
      rolesClaim: process.env.OIDC_ROLES_CLAIM ?? "realm_access.roles",
      // Map IdP group/role names → nav role names (optional)
      roleMapping: {},
    },

    publicPaths: ["/", "/home", "/login", "/api/auth"],
  },

  links: {
    github: "https://github.com/conniehnguyen/camelmind",
  },

  site: {
    showLastUpdated: true,
    showLastUpdateAuthor: true,
    showFeedbackWidget: true,
  },
}

export default config

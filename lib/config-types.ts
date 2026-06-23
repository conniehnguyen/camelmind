export type AuthProvider = "dev-mock" | "oidc"

export type OidcConfig = {
  issuer: string
  clientId: string
  clientSecret: string
  rolesClaim: string
  roleMapping: Record<string, string>
}

export type AuthConfig = {
  enabled: boolean
  requireLogin: boolean
  provider: AuthProvider
  oidc: OidcConfig
  publicPaths: string[]
}

export type SiteFeatures = {
  showLastUpdated?: boolean
  showLastUpdateAuthor?: boolean
  showFeedbackWidget?: boolean
}

export type CamelMindConfig = {
  title: string
  tagline: string
  url: string
  contentDir: string
  navFile: string
  versionsFile: string
  auth: AuthConfig
  links: {
    github?: string
  }
  site?: SiteFeatures
}

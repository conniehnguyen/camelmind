import siteConfig from "@/camelmind.config"
import type { AuthConfig, CamelMindConfig } from "./config-types"

export type { AuthConfig, AuthProvider, CamelMindConfig, OidcConfig } from "./config-types"

let _config: CamelMindConfig | null = null

export function getConfig(): CamelMindConfig {
  if (!_config) _config = siteConfig
  return _config
}

export function isAuthEnabled(): boolean {
  if (process.env.OFFLINE_MODE === "true") return false
  return getConfig().auth.enabled
}

export function isPrivateSite(): boolean {
  return isAuthEnabled() && getConfig().auth.requireLogin
}

export function getAuthConfig(): AuthConfig {
  return getConfig().auth
}

export function isPublicPath(pathname: string): boolean {
  const { publicPaths } = getAuthConfig()
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

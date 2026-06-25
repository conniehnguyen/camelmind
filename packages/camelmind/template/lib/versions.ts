import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import { loadNav } from "./nav"
import type { NavConfig } from "./nav-types"

export type VersionApiReference = {
  spec: string
  nav_label?: string
  languages?: string[]
}

export type Version = {
  id: string
  label: string
  stable: boolean
  badge?: string
  nav: string
  // true/omitted = use site-level spec, false = hide, object = version-specific spec
  api_reference?: boolean | VersionApiReference
}

export type VersionsConfig = {
  versions: Version[]
}

let _versionsCache: VersionsConfig | null = null

export function loadVersions(): VersionsConfig {
  if (_versionsCache) return _versionsCache
  const raw = fs.readFileSync(path.join(process.cwd(), "versions.yml"), "utf-8")
  _versionsCache = yaml.load(raw) as VersionsConfig
  return _versionsCache
}

export function getVersionFromSlug(slug: string): string | null {
  const { versions } = loadVersions()
  for (const v of versions) {
    if (slug.startsWith(`/${v.id}/`) || slug === `/${v.id}`) return v.id
  }
  // no version prefix = default (latest)
  return null
}

export function getNavForVersion(versionId: string | null): NavConfig {
  if (!versionId) return loadNav()
  const { versions } = loadVersions()
  const v = versions.find((v) => v.id === versionId)
  if (!v) return loadNav()

  const raw = fs.readFileSync(path.join(process.cwd(), v.nav), "utf-8")
  return yaml.load(raw) as NavConfig
}

export function getLatestVersion(): Version {
  const { versions } = loadVersions()
  return versions[0]
}

// Resolve which OpenAPI spec to use for a given version, with site-level fallback.
// Returns null if api_reference is explicitly disabled for this version.
export function getApiSpecForVersion(
  versionId: string | null,
  siteSpec: string,
  siteLanguages?: string[]
): { spec: string; languages?: string[] } | null {
  if (!versionId) return { spec: siteSpec, languages: siteLanguages }
  const { versions } = loadVersions()
  const v = versions.find((v) => v.id === versionId)
  if (!v) return { spec: siteSpec, languages: siteLanguages }

  const ar = v.api_reference
  if (ar === false) return null
  if (!ar || ar === true) return { spec: siteSpec, languages: siteLanguages }
  return { spec: ar.spec, languages: ar.languages ?? siteLanguages }
}

// Given a slug like /v1.9/getting-started/overview, return /getting-started/overview
export function stripVersionPrefix(slug: string, versionId: string): string {
  return slug.replace(new RegExp(`^/${versionId}`), "") || "/"
}

// Given /getting-started/overview and a target version, return /v1.9/getting-started/overview
export function swapVersion(slug: string, currentVersionId: string | null, targetVersionId: string): string {
  const bare = currentVersionId ? stripVersionPrefix(slug, currentVersionId) : slug
  return `/${targetVersionId}${bare}`
}

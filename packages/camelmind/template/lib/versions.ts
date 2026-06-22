import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import { loadNav } from "./nav"
import type { NavConfig } from "./nav-types"

export type Version = {
  id: string
  label: string
  stable: boolean
  badge?: string
  nav: string
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

// Given a slug like /v1.9/getting-started/overview, return /getting-started/overview
export function stripVersionPrefix(slug: string, versionId: string): string {
  return slug.replace(new RegExp(`^/${versionId}`), "") || "/"
}

// Given /getting-started/overview and a target version, return /v1.9/getting-started/overview
export function swapVersion(slug: string, currentVersionId: string | null, targetVersionId: string): string {
  const bare = currentVersionId ? stripVersionPrefix(slug, currentVersionId) : slug
  return `/${targetVersionId}${bare}`
}

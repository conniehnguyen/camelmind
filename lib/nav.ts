import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import type { NavConfig, NavEntry, NavGroup, NavChild } from "./nav-types"

export type { NavConfig, NavEntry, NavGroup, NavChild }
export { isNavGroup } from "./nav-types"

let _navCache: NavConfig | null = null

export function loadNav(): NavConfig {
  if (process.env.NODE_ENV !== "development" && _navCache) return _navCache
  const navPath = path.join(process.cwd(), "nav", "nav.yml")
  const raw = fs.readFileSync(navPath, "utf-8")
  _navCache = yaml.load(raw) as NavConfig
  return _navCache
}

export function flattenChildren(children: NavChild[]): NavChild[] {
  return children.flatMap((c) => [c, ...(c.children ? flattenChildren(c.children) : [])])
}

// Extract all slugs from any NavConfig (default or versioned)
export function getSlugsFromConfig(nav: NavConfig): string[] {
  const slugs: string[] = []
  for (const item of nav.nav) {
    if ("dropdown" in item) {
      const group = item as NavGroup
      // noDropdown groups have a top-level slug (the direct link target)
      if (group.noDropdown && group.slug) slugs.push(group.slug)
      for (const entry of (group.items ?? [])) {
        slugs.push(entry.slug)
        if (entry.section) {
          for (const child of flattenChildren(entry.section)) {
            slugs.push(child.slug)
          }
        }
      }
    } else if ("slug" in item) {
      slugs.push((item as NavEntry).slug)
    }
  }
  return slugs
}

export function getAllSlugs(): string[] {
  return getSlugsFromConfig(loadNav())
}

// Search any NavConfig for a slug — used for both default and versioned navs
export function getEntryBySlugFromConfig(nav: NavConfig, slug: string): (NavEntry | NavChild) | null {
  const normalized = slug.startsWith("/") ? slug : `/${slug}`

  for (const item of nav.nav) {
    if ("dropdown" in item) {
      const group = item as NavGroup
      // noDropdown group: its top-level slug maps to the first item in the group
      if (group.noDropdown && group.slug === normalized && group.items?.length) {
        return group.items[0]
      }
      for (const entry of (group.items ?? [])) {
        if (entry.slug === normalized) return entry
        if (entry.section) {
          const match = flattenChildren(entry.section).find((c) => c.slug === normalized)
          if (match) return match
        }
      }
    } else if ("slug" in item) {
      const entry = item as NavEntry
      if (entry.slug === normalized) return entry
    }
  }

  return null
}

export function getNavEntryBySlug(slug: string): (NavEntry | NavChild) | null {
  return getEntryBySlugFromConfig(loadNav(), slug)
}

// Return the NavGroup that contains the given slug in any NavConfig
export function getGroupForSlugFromConfig(nav: NavConfig, slug: string): NavGroup | null {
  const normalized = slug.startsWith("/") ? slug : `/${slug}`

  for (const item of nav.nav) {
    if (!("dropdown" in item)) continue
    const group = item as NavGroup
    if (group.noDropdown && group.slug === normalized) return group
    for (const entry of (group.items ?? [])) {
      if (entry.slug === normalized) return group
      if (entry.section) {
        const match = flattenChildren(entry.section).find((c) => c.slug === normalized)
        if (match) return group
      }
    }
  }

  return null
}

export function getGroupForSlug(slug: string): NavGroup | null {
  return getGroupForSlugFromConfig(loadNav(), slug)
}

// Return the section-root NavEntry for a slug in any NavConfig
export function getSectionForSlugFromConfig(nav: NavConfig, slug: string): NavEntry | null {
  const normalized = slug.startsWith("/") ? slug : `/${slug}`

  for (const item of nav.nav) {
    if (!("dropdown" in item)) continue
    for (const entry of ((item as NavGroup).items ?? [])) {
      if (entry.slug === normalized) return entry
      if (entry.section) {
        const match = flattenChildren(entry.section).find((c) => c.slug === normalized)
        if (match) return entry
      }
    }
  }

  return null
}

export function getSectionForSlug(slug: string): NavEntry | null {
  return getSectionForSlugFromConfig(loadNav(), slug)
}

export function getAllPublicEntries(nav: NavConfig): (NavEntry | NavChild)[] {
  const entries: (NavEntry | NavChild)[] = []
  for (const item of nav.nav) {
    if ("dropdown" in item) {
      const group = item as NavGroup
      for (const entry of (group.items ?? [])) {
        if (entry.roles.length === 0) entries.push(entry)
        if (entry.section) {
          for (const child of flattenChildren(entry.section)) {
            if (child.roles.length === 0) entries.push(child)
          }
        }
      }
    } else if ("slug" in item) {
      const entry = item as NavEntry
      if (entry.roles.length === 0) entries.push(entry)
    }
  }
  return entries
}

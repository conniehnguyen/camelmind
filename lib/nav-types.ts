export type NavChild = {
  label: string
  slug: string
  file: string
  roles: string[]
  children?: NavChild[]
}

export type NavEntry = {
  label: string
  slug: string
  file: string
  roles: string[]
  section?: NavChild[]
}

export type NavGroup = {
  label: string
  dropdown: boolean
  items: NavEntry[]
}

export type NavConfig = {
  nav: (NavEntry | NavGroup)[]
}

export function isNavGroup(item: NavEntry | NavGroup): item is NavGroup {
  return "dropdown" in item
}

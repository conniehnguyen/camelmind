import Link from "next/link"
import { NavEntry, NavGroup, NavChild, isNavGroup } from "@/lib/nav-types"

type Props = {
  activeGroup?: NavGroup | null
  currentSlug: string
  userRoles: string[]
}

function canSee(roles: string[], userRoles: string[]) {
  return roles.length === 0 || roles.some((r) => userRoles.includes(r))
}

function NavChildItem({
  item,
  currentSlug,
  userRoles,
  depth = 0,
}: {
  item: NavChild
  currentSlug: string
  userRoles: string[]
  depth?: number
}) {
  if (!canSee(item.roles, userRoles)) return null

  return (
    <li>
      <Link
        href={item.slug}
        className={`block py-2 rounded text-sm transition-colors ${
          depth > 0 ? "pl-8" : "pl-2"
        } ${
          currentSlug === item.slug
            ? "bg-blue-50 text-blue-700 font-medium"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        {item.label}
      </Link>
      {item.children && item.children.length > 0 && (
        <ul className="ml-4 border-l border-gray-200">
          {item.children.map((child) => (
            <NavChildItem
              key={child.slug}
              item={child}
              currentSlug={currentSlug}
              userRoles={userRoles}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function GroupSidebar({ group, currentSlug, userRoles }: { group: NavGroup; currentSlug: string; userRoles: string[] }) {
  const visibleItems = group.items.filter((i) => canSee(i.roles, userRoles))

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        {visibleItems.map((entry) => (
          <div key={entry.slug} className="mb-1 pt-1">
            <Link
              href={entry.slug}
              className={`block px-2 py-1.5 rounded text-xs font-semibold uppercase tracking-wide transition-colors ${
                currentSlug === entry.slug
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {entry.label}
            </Link>
            {entry.section && entry.section.length > 0 && (
              <ul className="mt-0.5 mb-3">
                {entry.section.map((child) => (
                  <NavChildItem
                    key={child.slug}
                    item={child}
                    currentSlug={currentSlug}
                    userRoles={userRoles}
                  />
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}

export function Sidebar({ activeGroup, currentSlug, userRoles }: Props) {
  if (activeGroup) {
    return <GroupSidebar group={activeGroup} currentSlug={currentSlug} userRoles={userRoles} />
  }

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 p-4 overflow-y-auto" />
  )
}

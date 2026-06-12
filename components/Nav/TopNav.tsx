"use client"

import { useState } from "react"
import Link from "next/link"
import { NavEntry, NavGroup, isNavGroup } from "@/lib/nav-types"
import { VersionSelector } from "./VersionSelector"
import { SearchTrigger } from "@/components/Search/SearchModal"
import type { Version } from "@/lib/versions"

type Props = {
  nav: (NavEntry | NavGroup)[]
  userRoles: string[]
  versions: Version[]
  currentVersionId: string | null
  currentSlug: string
}

export function TopNav({ nav, userRoles, versions, currentVersionId, currentSlug }: Props) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const canSee = (roles: string[]) =>
    roles.length === 0 || roles.some((r) => userRoles.includes(r))

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-lg mr-4">Game Warden</span>

      {nav.map((item) => {
        if (isNavGroup(item)) {
          const visibleItems = item.items.filter((i) => canSee(i.roles))
          if (visibleItems.length === 0) return null

          return (
            <div key={item.label} className="relative">
              <button
                className="flex items-center gap-1 hover:text-blue-300 text-sm font-medium"
                onClick={() =>
                  setOpenDropdown(openDropdown === item.label ? null : item.label)
                }
              >
                {item.label}
                <span className="text-xs">▾</span>
              </button>

              {openDropdown === item.label && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white text-gray-900 rounded shadow-lg z-50 py-1 border border-gray-200">
                  {visibleItems.map((child) => (
                    <Link
                      key={child.slug}
                      href={child.slug}
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        }

        const entry = item as NavEntry
        if (!canSee(entry.roles)) return null
        return (
          <Link key={entry.slug} href={entry.slug} className="text-sm font-medium hover:text-blue-300">
            {entry.label}
          </Link>
        )
      })}

      <div className="ml-auto flex items-center gap-4">
        <SearchTrigger />
        <VersionSelector
          versions={versions}
          currentVersionId={currentVersionId}
          currentSlug={currentSlug}
        />
      </div>
    </nav>
  )
}

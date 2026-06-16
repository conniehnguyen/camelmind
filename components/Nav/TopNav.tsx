"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { NavEntry, NavGroup, isNavGroup } from "@/lib/nav-types"
import { VersionSelector } from "./VersionSelector"
import { SearchTrigger } from "@/components/Search/SearchModal"
import type { Version } from "@/lib/versions"

type Props = {
  nav: (NavEntry | NavGroup)[]
  userRoles: string[]
  userName?: string | null
  versions: Version[]
  currentVersionId: string | null
  currentSlug: string
  versionSlugs: Record<string, string[]>
}

export function TopNav({ nav, userRoles, userName, versions, currentVersionId, currentSlug, versionSlugs }: Props) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  const canSee = (roles: string[]) =>
    roles.length === 0 || roles.some((r) => userRoles.includes(r))

  return (
    <nav ref={navRef} className="bg-gray-900 text-white px-6 py-3 flex items-center gap-6">
      <Link href="/home" className="flex items-center gap-2 mr-4">
        <Image src="/2f-logo.png" alt="Second Front" width={28} height={16} unoptimized className="invert" />
        <span className="font-bold text-lg">Game Warden</span>
      </Link>

      {nav.map((item) => {
        if (isNavGroup(item)) {
          if (item.noDropdown && item.slug) {
            return (
              <Link key={item.label} href={item.slug} className="text-sm font-medium hover:text-gray-300">
                {item.label}
              </Link>
            )
          }

          const visibleItems = item.items.filter((i) => canSee(i.roles))
          if (visibleItems.length === 0) return null

          return (
            <div key={item.label} className="relative">
              <button
                className="flex items-center gap-1 hover:text-gray-300 text-sm font-medium"
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
          <Link key={entry.slug} href={entry.slug} className="text-sm font-medium hover:text-gray-300">
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
          versionSlugs={versionSlugs}
        />
        {userName ? (
          <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
            <span className="text-xs text-gray-400">{userName}</span>
            <button
              onClick={signOut}
              className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-2 py-1 rounded transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-2 py-1 rounded transition-colors ml-2"
          >
            Sign in
          </a>
        )}
      </div>
    </nav>
  )
}

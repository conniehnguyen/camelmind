"use client"

import { useState } from "react"
import Link from "next/link"
import { NavEntry, NavGroup, NavChild } from "@/lib/nav-types"

type Props = {
  activeGroup?: NavGroup | null
  currentSlug: string
  userRoles: string[]
}

function canSee(roles: string[], userRoles: string[]) {
  return roles.length === 0 || roles.some((r) => userRoles.includes(r))
}

// Doc page link (leaf node inside a section)
function DocLink({ item, currentSlug }: { item: NavChild; currentSlug: string }) {
  const isActive = currentSlug === item.slug
  return (
    <li>
      <Link
        href={item.slug}
        style={isActive ? { borderColor: "var(--sf-active-border)", color: "var(--sf-active)" } : {}}
        className={`block py-1.5 pl-4 pr-3 text-sm border-l-2 transition-colors ${
          isActive
            ? "font-medium bg-black/5"
            : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
        }`}
      >
        {item.label}
      </Link>
    </li>
  )
}

// Collapsible section row (e.g. "DoW Deployment") — collapsed by default
function SectionRow({
  section,
  currentSlug,
  userRoles,
}: {
  section: NavChild
  currentSlug: string
  userRoles: string[]
}) {
  const docs = (section.children ?? []).filter((c) => canSee(c.roles, userRoles))
  const hasChildren = docs.length > 0

  // Open only if the current page lives inside this section
  const containsCurrent =
    currentSlug === section.slug ||
    docs.some((d) => currentSlug === d.slug)

  const [open, setOpen] = useState(containsCurrent)

  // No children — render as a plain link, no arrow
  if (!hasChildren) {
    return (
      <div className="mb-0.5">
        <Link
          href={section.slug}
          style={currentSlug === section.slug ? { borderColor: "var(--sf-active-border)", color: "var(--sf-active)" } : {}}
        className={`block py-1.5 pl-4 pr-2 text-sm border-l-2 transition-colors ${
            currentSlug === section.slug
              ? "font-medium bg-black/5"
              : "border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300"
          }`}
        >
          {section.label}
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-0.5">
      {/* Section header — full-width click area toggles collapse */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-1.5 px-2 text-sm text-gray-700 hover:text-gray-900 transition-colors rounded"
      >
        <span>{section.label}</span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform ${open ? "rotate-0" : "rotate-180"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {open && (
        <ul className="mt-0.5 mb-1">
          {docs.map((doc) => (
            <DocLink key={doc.slug} item={doc} currentSlug={currentSlug} />
          ))}
        </ul>
      )}
    </div>
  )
}

// Category block (e.g. "AUTHORIZATION PATH") — label only, no arrow
function CategoryBlock({
  entry,
  currentSlug,
  userRoles,
}: {
  entry: NavEntry
  currentSlug: string
  userRoles: string[]
}) {
  const sections = (entry.section ?? []).filter((s) => canSee(s.roles, userRoles))
  const isCategoryActive = currentSlug === entry.slug

  return (
    <div className="mb-4">
      {/* Category label — ALL CAPS, highlighted when on the category landing page */}
      <Link
        href={entry.slug}
        style={isCategoryActive ? { color: "var(--sf-active)" } : {}}
        className={`block px-2 pb-1 text-xs font-semibold uppercase tracking-widest transition-colors select-none ${
          isCategoryActive ? "" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        {entry.label}
      </Link>

      {sections.map((section) => (
        <SectionRow
          key={section.slug}
          section={section}
          currentSlug={currentSlug}
          userRoles={userRoles}
        />
      ))}
    </div>
  )
}

function GroupSidebar({
  group,
  currentSlug,
  userRoles,
}: {
  group: NavGroup
  currentSlug: string
  userRoles: string[]
}) {
  const visibleItems = group.items.filter((i) => canSee(i.roles, userRoles))

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 overflow-y-auto">
      <div className="px-3 py-4">
        {visibleItems.map((entry) => (
          <CategoryBlock
            key={entry.slug}
            entry={entry}
            currentSlug={currentSlug}
            userRoles={userRoles}
          />
        ))}
      </div>
    </aside>
  )
}

export function Sidebar({ activeGroup, currentSlug, userRoles }: Props) {
  if (activeGroup) {
    return (
      <GroupSidebar
        group={activeGroup}
        currentSlug={currentSlug}
        userRoles={userRoles}
      />
    )
  }

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 p-4 overflow-y-auto" />
  )
}

import Link from "next/link"
import type { NavGroup, NavChild } from "@/lib/nav-types"

type PageEntry = { label: string; slug: string }

function flattenGroup(group: NavGroup): PageEntry[] {
  const pages: PageEntry[] = []
  for (const entry of group.items) {
    pages.push({ label: entry.label, slug: entry.slug })
    if (entry.section) {
      for (const child of entry.section) {
        pages.push({ label: child.label, slug: child.slug })
        if (child.children) {
          for (const grandchild of child.children) {
            pages.push({ label: grandchild.label, slug: grandchild.slug })
          }
        }
      }
    }
  }
  return pages
}

type Props = {
  activeGroup?: NavGroup | null
  currentSlug: string
}

export function PageNav({ activeGroup, currentSlug }: Props) {
  if (!activeGroup) return null

  const pages = flattenGroup(activeGroup)
  const idx = pages.findIndex((p) => p.slug === currentSlug)
  if (idx === -1) return null

  const prev = idx > 0 ? pages[idx - 1] : null
  const next = idx < pages.length - 1 ? pages[idx + 1] : null

  if (!prev && !next) return null

  return (
    <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-200">
      {prev ? (
        <Link
          href={prev.slug}
          className="flex flex-col items-start group max-w-[45%]"
        >
          <span className="text-xs text-gray-400 mb-1 group-hover:text-gray-600">← Previous</span>
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
            {prev.label}
          </span>
        </Link>
      ) : <div />}

      {next && (
        <Link
          href={next.slug}
          className="flex flex-col items-end group max-w-[45%]"
        >
          <span className="text-xs text-gray-400 mb-1 group-hover:text-gray-600">Next →</span>
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
            {next.label}
          </span>
        </Link>
      )}
    </div>
  )
}

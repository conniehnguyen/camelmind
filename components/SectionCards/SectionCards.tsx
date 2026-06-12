import Link from "next/link"
import type { NavEntry } from "@/lib/nav-types"

export function SectionCards({ entry }: { entry: NavEntry }) {
  if (!entry.section || entry.section.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
      {entry.section.map((child) => (
        <Link
          key={child.slug}
          href={child.slug}
          className="group flex flex-col gap-1 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all"
        >
          <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
            {child.label}
          </span>
          {child.children && child.children.length > 0 && (
            <span className="text-xs text-gray-400">
              {child.children.length} article{child.children.length !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-xs text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            View →
          </span>
        </Link>
      ))}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Version } from "@/lib/versions"

type Props = {
  versions: Version[]
  currentVersionId: string | null
  currentSlug: string
}

export function VersionSelector({ versions, currentVersionId, currentSlug }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const current = versions.find((v) => v.id === currentVersionId) ?? versions[0]

  function navigateToVersion(targetId: string) {
    setOpen(false)
    const bare = currentVersionId
      ? currentSlug.replace(new RegExp(`^/${currentVersionId}`), "") || "/"
      : currentSlug
    router.push(`/${targetId}${bare}`)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-600 text-sm text-white hover:border-gray-400 transition-colors"
      >
        <span>{current?.label ?? "version"}</span>
        {current?.badge && (
          <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
            {current.badge}
          </span>
        )}
        <span className="text-xs text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-52 bg-white text-gray-900 rounded shadow-lg z-50 py-1 border border-gray-200">
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => navigateToVersion(v.id)}
              className={`w-full text-left flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 ${
                v.id === currentVersionId ? "font-semibold text-blue-600" : ""
              }`}
            >
              <span>{v.label}</span>
              <span className="flex items-center gap-1.5">
                {v.badge && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                    {v.badge}
                  </span>
                )}
                {!v.stable && !v.badge && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                    Unstable
                  </span>
                )}
                {v.stable && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                    Stable
                  </span>
                )}
                {v.id === currentVersionId && <span className="text-blue-500">✓</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

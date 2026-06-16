"use client"

import { useState, Children, isValidElement } from "react"

type TabProps = {
  label: string
  children: React.ReactNode
}

export function Tab({ children }: TabProps) {
  return <>{children}</>
}

export function Tabs({ children }: { children: React.ReactNode }) {
  const tabs = Children.toArray(children).filter(
    (child) => isValidElement(child) && (child.type as { displayName?: string })?.displayName === "Tab" ||
               isValidElement(child) && (child as React.ReactElement).props?.label !== undefined
  ) as React.ReactElement<TabProps>[]

  const [active, setActive] = useState(0)

  if (tabs.length === 0) return null

  return (
    <div className="my-4 rounded-lg border border-gray-200 overflow-hidden not-prose">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              i === active
                ? "border-gray-900 text-gray-900 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            {tab.props.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="p-4 prose prose-gray max-w-none">
        {tabs[active]?.props.children}
      </div>
    </div>
  )
}

Tab.displayName = "Tab"

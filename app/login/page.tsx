"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo") ?? "/home"
  const [loading, setLoading] = useState(false)

  async function signIn(persona: string) {
    setLoading(true)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona, returnTo }),
    })
    const data = await res.json()
    if (data.redirectTo) router.push(data.redirectTo)
    else setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo + header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Game Warden</h1>
          <p className="text-gray-400 text-sm mt-1">Help Center</p>
        </div>

        <div className="mb-6">
          <p className="text-white font-medium text-sm mb-1">Sign in with Game Warden</p>
          <p className="text-gray-400 text-xs">
            In production this button opens your Game Warden Keycloak login.
            For this demo, choose a persona below.
          </p>
        </div>

        {/* Demo persona selector */}
        <div className="space-y-3">
          <DemoPersona
            label="Vendor"
            description="Software vendor onboarding an app — sees App Central, BoE guides"
            persona="vendor"
            badge="vendor"
            badgeColor="blue"
            onClick={signIn}
            disabled={loading}
          />
          <DemoPersona
            label="Admin"
            description="Second Front staff — sees internal admin content"
            persona="admin"
            badge="admin"
            badgeColor="purple"
            onClick={signIn}
            disabled={loading}
          />
          <DemoPersona
            label="Staff (vendor + admin)"
            description="Full access to all content"
            persona="vendor-admin"
            badge="vendor + admin"
            badgeColor="green"
            onClick={signIn}
            disabled={loading}
          />
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Public pages are accessible without signing in.
        </p>
      </div>
    </div>
  )
}

function DemoPersona({
  label,
  description,
  persona,
  badge,
  badgeColor,
  onClick,
  disabled,
}: {
  label: string
  description: string
  persona: string
  badge: string
  badgeColor: "blue" | "purple" | "green"
  onClick: (p: string) => void
  disabled: boolean
}) {
  const colors = {
    blue: "bg-blue-900/50 text-blue-300 border-blue-700",
    purple: "bg-purple-900/50 text-purple-300 border-purple-700",
    green: "bg-green-900/50 text-green-300 border-green-700",
  }
  return (
    <button
      onClick={() => onClick(persona)}
      disabled={disabled}
      className="w-full text-left bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-lg px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <div className="flex items-center justify-between">
        <span className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded border font-mono ${colors[badgeColor]}`}>{badge}</span>
      </div>
      <p className="text-gray-500 text-xs mt-0.5">{description}</p>
    </button>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

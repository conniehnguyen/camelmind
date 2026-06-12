import { NextRequest, NextResponse } from "next/server"
import { createSession, COOKIE_NAME, type SessionUser } from "@/lib/auth"

// Demo personas — simulates what Keycloak would return after real OIDC login
const DEMO_USERS: Record<string, SessionUser> = {
  vendor: {
    name: "Alex Vendor",
    email: "alex@acme-software.com",
    roles: ["vendor"],
  },
  admin: {
    name: "Sam Admin",
    email: "sam@secondfront.com",
    roles: ["admin"],
  },
  "vendor-admin": {
    name: "Taylor Staff",
    email: "taylor@secondfront.com",
    roles: ["vendor", "admin"],
  },
}

export async function POST(req: NextRequest) {
  const { persona, returnTo } = await req.json()
  const user = DEMO_USERS[persona]
  if (!user) {
    return NextResponse.json({ error: "Unknown demo persona" }, { status: 400 })
  }

  const token = await createSession(user)
  const redirect = returnTo && returnTo.startsWith("/") ? returnTo : "/home"

  const res = NextResponse.json({ ok: true, redirectTo: redirect })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return res
}

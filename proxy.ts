import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const COOKIE_NAME = "gw_session"
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "fallback-dev-secret-change-in-prod"
)

// Pages that are always public (no auth required regardless of nav roles)
// Actual per-page role enforcement still happens in page.tsx
const PUBLIC_PATHS = ["/login", "/api/auth", "/_next", "/favicon.ico"]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Let public paths through unconditionally
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow the homepage and root redirect through — they handle their own display
  if (pathname === "/" || pathname === "/home") {
    return NextResponse.next()
  }

  // For all other paths, check for a valid session cookie
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("returnTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    // Token invalid or expired — send to login
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("returnTo", pathname)
    const res = NextResponse.redirect(loginUrl)
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" })
    return res
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}

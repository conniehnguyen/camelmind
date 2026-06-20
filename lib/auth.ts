import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export type SessionUser = {
  name: string
  email: string
  roles: string[]
}

const COOKIE_NAME = "gw_session"

if (!process.env.SESSION_SECRET && process.env.OFFLINE_MODE !== "true") {
  throw new Error("SESSION_SECRET environment variable is not set")
}

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "offline-mode-placeholder"
)

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(SECRET)
}

// Offline builds ship with auth bypassed — the user already authenticated when downloading
const OFFLINE_SESSION: SessionUser = {
  name: "Offline User",
  email: "",
  roles: ["vendor", "admin"],
}

export async function getSession(): Promise<SessionUser | null> {
  if (process.env.OFFLINE_MODE === "true") return OFFLINE_SESSION
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return {
      name: payload.name as string,
      email: payload.email as string,
      roles: payload.roles as string[],
    }
  } catch {
    return null
  }
}

export function hasAccess(requiredRoles: string[], userRoles: string[]): boolean {
  if (requiredRoles.length === 0) return true
  return requiredRoles.some((r) => userRoles.includes(r))
}

export { COOKIE_NAME }

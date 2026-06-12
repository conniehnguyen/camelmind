// Mock auth for POC — replace with next-auth + Keycloak for production

export type MockUser = {
  name: string
  email: string
  roles: string[]
}

// Swap this to test different roles: [], ['vendor'], ['admin'], ['vendor', 'admin']
export const MOCK_USER: MockUser = {
  name: "Test Vendor",
  email: "vendor@example.com",
  roles: ["vendor"],
}

// Set to null to simulate unauthenticated user
// export const MOCK_USER: MockUser | null = null

export function getMockSession(): MockUser | null {
  return MOCK_USER
}

export function hasAccess(requiredRoles: string[], userRoles: string[]): boolean {
  if (requiredRoles.length === 0) return true
  return requiredRoles.some((r) => userRoles.includes(r))
}

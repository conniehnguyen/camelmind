import { notFound, redirect } from "next/navigation"
import { getConfig, isAuthEnabled } from "@/lib/config"
import { loadApiSpec } from "@/lib/api-reference"
import { getSession, hasAccess } from "@/lib/auth"
import { loadVersions, getNavForVersion, getApiSpecForVersion } from "@/lib/versions"
import { getSlugsFromConfig } from "@/lib/nav"
import { TopNav } from "@/components/Nav/TopNav"
import { ApiSidebar } from "@/components/ApiReference/ApiSidebar"
import { EndpointPage } from "@/components/ApiReference/EndpointPage"
import { ApiOverview } from "@/components/ApiReference/ApiOverview"

type Props = {
  params: Promise<{ slug?: string[] }>
}

// Detect if the first slug segment is a known version ID.
// /api-reference/v2.0/applications/create → versionId="v2.0", rest=["applications","create"]
// /api-reference/applications/create      → versionId=null,   rest=["applications","create"]
function parseVersionFromSlug(
  slug: string[] | undefined,
  versionIds: string[]
): { versionId: string | null; rest: string[] } {
  if (!slug?.length) return { versionId: null, rest: [] }
  if (versionIds.includes(slug[0])) return { versionId: slug[0], rest: slug.slice(1) }
  return { versionId: null, rest: slug }
}

export async function generateStaticParams() {
  let config
  try { config = getConfig() } catch { return [] }

  const apiRef = config.apiReference
  if (!apiRef?.enabled) return []

  const { versions } = loadVersions()
  const params: Array<{ slug: string[] | undefined }> = [{ slug: undefined }]

  for (const version of versions) {
    const resolved = getApiSpecForVersion(version.id, apiRef.spec, apiRef.languages)
    if (!resolved) continue

    let spec
    try { spec = loadApiSpec(resolved.spec, resolved.languages) } catch { continue }

    params.push({ slug: [version.id] })

    for (const op of spec.allOperations) {
      params.push({ slug: [version.id, op.tagSlug, op.operationId] })
    }
  }

  // Also enumerate no-version-prefix routes using the default spec
  let defaultSpec
  try { defaultSpec = loadApiSpec(apiRef.spec, apiRef.languages) } catch { return params }
  for (const op of defaultSpec.allOperations) {
    params.push({ slug: [op.tagSlug, op.operationId] })
  }

  return params
}

export default async function ApiReferencePage({ params }: Props) {
  const config = getConfig()
  const apiRef = config.apiReference
  if (!apiRef?.enabled) return notFound()

  const { slug: rawSlug } = await params
  const { versions } = loadVersions()
  const versionIds = versions.map((v) => v.id)

  const { versionId, rest: slug } = parseVersionFromSlug(rawSlug, versionIds)
  const base = versionId ? `/api-reference/${versionId}` : "/api-reference"

  const resolved = getApiSpecForVersion(versionId, apiRef.spec, apiRef.languages)
  if (!resolved) return notFound()

  let spec
  try { spec = loadApiSpec(resolved.spec, resolved.languages) } catch { return notFound() }

  const session = await getSession()
  const authEnabled = isAuthEnabled()
  const roles = apiRef.roles ?? []

  if (!hasAccess(roles, session?.roles ?? [])) {
    if (!session) redirect(`/login?returnTo=${base}`)
    return (
      <div className="flex flex-col h-screen">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-500">You don&apos;t have permission to view the API reference.</p>
          </div>
        </div>
      </div>
    )
  }

  const versionSlugs: Record<string, string[]> = Object.fromEntries(
    versions.map((v) => {
      const nav = getNavForVersion(v.id)
      return [v.id, getSlugsFromConfig(nav)]
    })
  )
  const nav = getNavForVersion(versionId)
  const apiRefProp = { label: apiRef.navLabel ?? "API Reference", href: "/api-reference", roles }
  const currentSlug = slug.length ? `${base}/${slug.join("/")}` : base

  if (!slug.length) {
    return (
      <div className="flex flex-col h-screen">
        <TopNav
          nav={nav.nav}
          userRoles={session?.roles ?? []}
          userName={session?.name ?? null}
          authEnabled={authEnabled}
          versions={versions}
          currentVersionId={versionId}
          currentSlug={base}
          versionSlugs={versionSlugs}
          apiRef={apiRefProp}
        />
        <div className="flex flex-1 overflow-hidden">
          <ApiSidebar spec={spec} currentSlug={base} base={base} />
          <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
            <ApiOverview spec={spec} base={base} />
          </main>
        </div>
      </div>
    )
  }

  if (slug.length === 1) {
    const tag = spec.tags.find((t) => t.slug === slug[0])
    if (!tag || !tag.operations.length) return notFound()
    redirect(`${base}/${tag.slug}/${tag.operations[0].operationId}`)
  }

  const [tagSlug, operationId] = slug
  const op = spec.allOperations.find(
    (o) => o.tagSlug === tagSlug && o.operationId === operationId
  )
  if (!op) return notFound()

  return (
    <div className="flex flex-col h-screen">
      <TopNav
        nav={nav.nav}
        userRoles={session?.roles ?? []}
        userName={session?.name ?? null}
        authEnabled={authEnabled}
        versions={versions}
        currentVersionId={versionId}
        currentSlug={currentSlug}
        versionSlugs={versionSlugs}
        apiRef={apiRefProp}
      />
      <div className="flex flex-1 overflow-hidden">
        <ApiSidebar spec={spec} currentSlug={currentSlug} base={base} />
        <main className="flex-1 overflow-hidden bg-white dark:bg-gray-950 flex">
          <EndpointPage operation={op} spec={spec} />
        </main>
      </div>
    </div>
  )
}

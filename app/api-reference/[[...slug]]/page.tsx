import { notFound, redirect } from "next/navigation"
import { getConfig } from "@/lib/config"
import { loadApiSpec } from "@/lib/api-reference"
import { getSession, hasAccess } from "@/lib/auth"
import { loadVersions, getNavForVersion } from "@/lib/versions"
import { getSlugsFromConfig } from "@/lib/nav"
import { TopNav } from "@/components/Nav/TopNav"
import { ApiSidebar } from "@/components/ApiReference/ApiSidebar"
import { EndpointPage } from "@/components/ApiReference/EndpointPage"
import { ApiOverview } from "@/components/ApiReference/ApiOverview"

type Props = {
  params: Promise<{ slug?: string[] }>
}

export async function generateStaticParams() {
  let config
  try {
    config = getConfig()
  } catch {
    return []
  }

  const apiRef = config.apiReference
  if (!apiRef?.enabled) return []

  let spec
  try {
    spec = loadApiSpec(apiRef.spec, apiRef.languages)
  } catch {
    return []
  }

  const params: Array<{ slug: string[] | undefined }> = [
    { slug: undefined },
  ]

  for (const op of spec.allOperations) {
    params.push({ slug: [op.tagSlug, op.operationId] })
  }

  return params
}

export default async function ApiReferencePage({ params }: Props) {
  const config = getConfig()
  const apiRef = config.apiReference

  if (!apiRef?.enabled) return notFound()

  let spec
  try {
    spec = loadApiSpec(apiRef.spec, apiRef.languages)
  } catch {
    return notFound()
  }

  const session = await getSession()
  const roles = apiRef.roles ?? []

  if (!hasAccess(roles, session?.roles ?? [])) {
    if (!session) redirect(`/login?returnTo=/api-reference`)
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

  const { slug } = await params
  const { versions } = loadVersions()

  const versionSlugs: Record<string, string[]> = Object.fromEntries(
    versions.map((v) => {
      const nav = getNavForVersion(v.id)
      return [v.id, getSlugsFromConfig(nav)]
    })
  )

  const nav = getNavForVersion(null)
  const apiRefProp = { label: apiRef.navLabel ?? "API Reference", href: "/api-reference", roles }

  const currentSlug = slug?.length
    ? `/api-reference/${slug.join("/")}`
    : "/api-reference"

  if (!slug || slug.length === 0) {
    return (
      <div className="flex flex-col h-screen">
        <TopNav
          nav={nav.nav}
          userRoles={session?.roles ?? []}
          userName={session?.name ?? null}
          versions={versions}
          currentVersionId={null}
          currentSlug="/api-reference"
          versionSlugs={versionSlugs}
          apiRef={apiRefProp}
        />
        <div className="flex flex-1 overflow-hidden">
          <ApiSidebar spec={spec} currentSlug="/api-reference" />
          <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
            <ApiOverview spec={spec} />
          </main>
        </div>
      </div>
    )
  }

  if (slug.length === 1) {
    const tag = spec.tags.find((t) => t.slug === slug[0])
    if (!tag || !tag.operations.length) return notFound()
    redirect(`/api-reference/${tag.slug}/${tag.operations[0].operationId}`)
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
        versions={versions}
        currentVersionId={null}
        currentSlug={currentSlug}
        versionSlugs={versionSlugs}
        apiRef={apiRefProp}
      />
      <div className="flex flex-1 overflow-hidden">
        <ApiSidebar spec={spec} currentSlug={currentSlug} />
        <main className="flex-1 overflow-hidden bg-white dark:bg-gray-950 flex">
          <EndpointPage operation={op} spec={spec} />
        </main>
      </div>
    </div>
  )
}

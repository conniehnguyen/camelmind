import { notFound, redirect } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import {
  getAllSlugs,
  getSlugsFromConfig,
  getEntryBySlugFromConfig,
  getGroupForSlugFromConfig,
  getSectionForSlugFromConfig,
} from "@/lib/nav"
import { loadMdxFile } from "@/lib/mdx"
import { getSession, hasAccess } from "@/lib/auth"
import { loadVersions, getVersionFromSlug, getNavForVersion } from "@/lib/versions"
import { TopNav } from "@/components/Nav/TopNav"
import { Sidebar } from "@/components/Sidebar/Sidebar"
import { Toc } from "@/components/Toc/Toc"
import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs"
import { PageNav } from "@/components/PageNav/PageNav"
import { SectionCards } from "@/components/SectionCards/SectionCards"
import { DocActions } from "@/components/DocActions/DocActions"
import { ZoomImages } from "@/components/ZoomImages/ZoomImages"
import { mdxComponents } from "@/components/mdx"
import type { NavGroup, NavEntry } from "@/lib/nav-types"

type Props = {
  params: Promise<{ slug: string[] }>
}

export async function generateStaticParams() {
  // Default (unversioned) slugs — full depth
  const defaultSlugs = getAllSlugs().map((slug) => ({
    slug: slug.replace(/^\//, "").split("/"),
  }))

  // Versioned slugs — full depth from each version's nav
  const { versions } = loadVersions()
  const versionedSlugs = versions.flatMap((v) => {
    const nav = getNavForVersion(v.id)
    return getSlugsFromConfig(nav).map((slug) => ({
      slug: slug.replace(/^\//, "").split("/"),
    }))
  })

  return [...defaultSlugs, ...versionedSlugs]
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params
  const fullSlug = "/" + slug.join("/")

  const versionId = getVersionFromSlug(fullSlug)
  const nav = getNavForVersion(versionId)   // correct nav for this version (or default)
  const { versions } = loadVersions()

  const versionSlugs: Record<string, string[]> = Object.fromEntries(
    versions.map((v) => [v.id, getSlugsFromConfig(getNavForVersion(v.id))])
  )

  // All lookups use the version-appropriate nav
  const navEntry = getEntryBySlugFromConfig(nav, fullSlug)
  if (!navEntry) return notFound()

  const session = await getSession()

  if (!hasAccess(navEntry.roles, session?.roles ?? [])) {
    // Not logged in at all → send to login page with return URL
    if (!session) {
      redirect(`/login?returnTo=${encodeURIComponent(fullSlug)}`)
    }
    // Logged in but wrong role → show access denied
    return (
      <div className="flex flex-col h-screen">
        <TopNav nav={nav.nav} userRoles={session.roles} userName={session.name} versions={versions} currentVersionId={versionId} currentSlug={fullSlug} versionSlugs={versionSlugs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-500">You don&apos;t have permission to view this page.</p>
            <p className="text-xs text-gray-400 mt-2">
              Required roles: {navEntry.roles.join(", ")} · Your roles: {session.roles.join(", ")}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const activeGroup = getGroupForSlugFromConfig(nav, fullSlug) as NavGroup | null
  const sectionEntry = getSectionForSlugFromConfig(nav, fullSlug) as NavEntry | null
  const { frontmatter, source, toc } = loadMdxFile(navEntry.file)
  const isSectionRoot = sectionEntry?.slug === fullSlug

  return (
    <div className="flex flex-col h-screen">
      <TopNav nav={nav.nav} userRoles={session?.roles ?? []} userName={session?.name ?? null} versions={versions} currentVersionId={versionId} currentSlug={fullSlug} versionSlugs={versionSlugs} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeGroup={activeGroup} currentSlug={fullSlug} userRoles={session?.roles ?? []} />
        <main className="flex-1 overflow-y-auto">
          <div className="flex max-w-5xl mx-auto">
            <article className="flex-1 px-10 py-8 min-w-0">
              <Breadcrumbs
                activeGroup={activeGroup}
                sectionEntry={sectionEntry}
                currentEntry={navEntry as NavEntry}
              />
              <h1 className="text-3xl font-bold mb-2 text-gray-900">{frontmatter.title}</h1>
              {frontmatter.description && (
                <p className="text-gray-500 text-lg mb-6 leading-relaxed">{frontmatter.description}</p>
              )}
              <DocActions file={navEntry.file} downloadPdf={frontmatter.download_pdf} />
              <ZoomImages />
              <div className="prose prose-gray mt-6">
                <MDXRemote
                  source={source}
                  components={mdxComponents}
                  options={{
                    mdxOptions: {
                      remarkPlugins: [remarkGfm],
                      rehypePlugins: [
                        rehypeSlug,
                        [rehypeAutolinkHeadings, { behavior: "wrap" }],
                      ],
                    },
                  }}
                />
              </div>
              {isSectionRoot && sectionEntry && <SectionCards entry={sectionEntry} />}
              <PageNav activeGroup={activeGroup} currentSlug={fullSlug} />
            </article>
            <Toc entries={toc} />
          </div>
        </main>
      </div>
    </div>
  )
}

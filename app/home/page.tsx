import Link from "next/link"
import { ClipboardList, ShieldCheck, Rocket, ExternalLink, CalendarDays, Mic, Users, BookOpen } from "lucide-react"
import { loadNav, getSlugsFromConfig } from "@/lib/nav"
import { loadVersions, getNavForVersion } from "@/lib/versions"
import { getSession } from "@/lib/auth"
import { TopNav } from "@/components/Nav/TopNav"
import type { NavGroup } from "@/lib/nav-types"

const FEATURE_CARDS = [
  {
    Icon: ClipboardList,
    title: "Entrance Criteria",
    description: "Understand the technical and security requirements your application must meet before onboarding to Game Warden.",
    href: "/getting-started/entrance-criteria",
    cta: "Review requirements",
  },
  {
    Icon: ShieldCheck,
    title: "Platform Architecture & Security",
    description: "Explore Game Warden's infrastructure, managed services, security controls, and compliance posture across DoW, FedRAMP, and Commercial environments.",
    href: "/platform/architecture",
    cta: "Explore the platform",
  },
  {
    Icon: Rocket,
    title: "Onboarding Process",
    description: "Follow the step-by-step onboarding guide — from account creation and access control to your first application submission in App Central.",
    href: "/getting-started/onboarding",
    cta: "Start onboarding",
  },
]

const NEWS = [
  { title: "Second Front Announces Strategic Partnership with Palantir", date: "June 2026", href: "https://www.secondfront.com/resources/news/" },
  { title: "Game Warden Now Supports FedRAMP High Workloads", date: "May 2026", href: "https://www.secondfront.com/resources/news/" },
  { title: "2F Wins 2026 DIU Defense Tech Award", date: "April 2026", href: "https://www.secondfront.com/resources/news/" },
  { title: "New AI-Assisted Compliance Tooling Available in App Central", date: "March 2026", href: "https://www.secondfront.com/resources/news/" },
]

const WHATS_NEW = [
  { date: "June 2026", summary: "Klowd AI Assistant now available in App Central", href: "/release-notes" },
  { date: "June 2026", summary: "SAST scan parser supports Go and Rust modules", href: "/release-notes" },
  { date: "May 2026", summary: "FedRAMP Document Repository supports bulk upload", href: "/release-notes" },
  { date: "May 2026", summary: "Managed PostgreSQL now available for IL4 tenants", href: "/release-notes" },
  { date: "April 2026", summary: "End User Management feature is now GA", href: "/release-notes" },
  { date: "April 2026", summary: "Prisma Cloud upgraded to v33 — image rescan required", href: "/release-notes" },
]


const FROM_2F = [
  { Icon: CalendarDays, title: "Events", description: "Conferences, webinars, and live sessions hosted by Second Front.", href: "https://www.secondfront.com/resources/events/" },
  { Icon: Mic, title: "Podcast", description: "Conversations on defense tech, software delivery, and GovTech innovation.", href: "https://www.secondfront.com/resources/podcast/" },
  { Icon: Users, title: "Customer Stories", description: "How defense software teams deploy and scale with Game Warden.", href: "https://www.secondfront.com/resources/customer-stories/" },
  { Icon: BookOpen, title: "Library", description: "Whitepapers, guides, and research from the Second Front team.", href: "https://www.secondfront.com/resources/" },
]

export default async function HomePage() {
  const nav = loadNav()
  const { versions } = loadVersions()
  const session = await getSession()
  const versionSlugs = Object.fromEntries(
    versions.map((v) => [v.id, getSlugsFromConfig(getNavForVersion(v.id))])
  )

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav
        nav={nav.nav}
        userRoles={session?.roles ?? []}
        userName={session?.name ?? null}
        versions={versions}
        currentVersionId={null}
        currentSlug="/home"
        versionSlugs={versionSlugs}
      />

      <main className="flex-1 bg-white">
        {/* Hero */}
        <section className="bg-gray-950 text-white px-4 md:px-6 py-14 md:py-20 text-center">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-3">Second Front Systems</p>
          <h1 className="text-4xl font-bold mb-4">Game Warden Help Center</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Everything you need to onboard, deploy, and operate your application on Game Warden platform, the modern DevSecOps Platform for GovTech.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/getting-started/onboarding/quickstart" className="bg-white hover:bg-gray-100 text-gray-900 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Get Started
            </Link>
            <Link href="/getting-started/authorization-path" className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-700">
              Choose Your Path
            </Link>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16 space-y-16 md:space-y-20">

          {/* Feature cards */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURE_CARDS.map((card) => (
                <Link key={card.href} href={card.href} className="group flex flex-col gap-4 p-7 rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all">
                  <card.Icon size={28} className="text-gray-700 shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                  <p className="text-base text-gray-500 leading-relaxed flex-1">{card.description}</p>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{card.cta} →</span>
                </Link>
              ))}
            </div>
          </section>

          {/* News + What's new */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* News from Second Front */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">News from Second Front</h2>
                <a href="https://www.secondfront.com/resources/news/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">All news <ExternalLink size={13} /></a>
              </div>
              <ul className="space-y-4">
                {NEWS.map((item, i) => (
                  <li key={i}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="group block">
                      <p className="text-base text-gray-800 group-hover:text-gray-950 font-medium leading-snug transition-colors">{item.title}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{item.date}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* What's new */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">What&apos;s new</h2>
                <Link href="/release-notes" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">See all updates →</Link>
              </div>
              <ul className="space-y-4">
                {WHATS_NEW.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-sm text-gray-400 shrink-0 w-24 pt-0.5">{item.date}</span>
                    <Link href={item.href} className="text-base text-gray-700 hover:text-gray-950 transition-colors leading-snug">
                      {item.summary}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* From Second Front */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">From Second Front</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {FROM_2F.map((item) => (
                <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-3 p-5 rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between">
                    <item.Icon size={22} className="text-gray-500" />
                    <ExternalLink size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 group-hover:text-gray-950">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                </a>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <span>© 2026 Second Front Systems. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/release-notes" className="hover:text-gray-600">Release Notes</Link>
            <Link href="/platform/security" className="hover:text-gray-600">Security</Link>
            <a href="https://secondfront.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">secondfront.com</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

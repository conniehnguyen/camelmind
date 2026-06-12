import Link from "next/link"
import { loadNav } from "@/lib/nav"
import { loadVersions } from "@/lib/versions"
import { getSession } from "@/lib/auth"
import { TopNav } from "@/components/Nav/TopNav"
import type { NavGroup } from "@/lib/nav-types"

const FEATURE_CARDS = [
  {
    icon: "🛡️",
    title: "Authorization Paths",
    description: "Choose your deployment environment — DoW (IL4/IL5), FedRAMP Moderate, or Commercial — and follow a tailored onboarding track.",
    href: "/getting-started/authorization-path",
    cta: "Choose your path",
  },
  {
    icon: "📋",
    title: "Entrance Criteria",
    description: "Understand the technical and security requirements your application must meet before onboarding to Game Warden.",
    href: "/getting-started/entrance-criteria",
    cta: "Review requirements",
  },
  {
    icon: "🚀",
    title: "App Central",
    description: "Submit applications, complete your Body of Evidence, manage findings, and track your ATO progress — all from one place.",
    href: "/getting-started/gw-app/app-central",
    cta: "Open App Central docs",
  },
]

const QUICK_LINKS = [
  { label: "Quickstart Guide", href: "/getting-started/onboarding/quickstart" },
  { label: "Create Your Account", href: "/getting-started/onboarding/create-account" },
  { label: "Impact Levels Overview", href: "/getting-started/authorization-path/dow/impact-levels" },
  { label: "Body of Evidence", href: "/getting-started/gw-app/boe" },
  { label: "Security Findings", href: "/getting-started/gw-app/findings" },
  { label: "Platform Architecture", href: "/platform/architecture" },
]

const WHATS_NEW = [
  { date: "June 2026", summary: "Klowd AI Assistant now available in App Central", href: "/release-notes" },
  { date: "June 2026", summary: "SAST scan parser supports Go and Rust modules", href: "/release-notes" },
  { date: "May 2026", summary: "FedRAMP Document Repository supports bulk upload", href: "/release-notes" },
  { date: "May 2026", summary: "Managed PostgreSQL now available for IL4 tenants", href: "/release-notes" },
  { date: "April 2026", summary: "End User Management feature is now GA", href: "/release-notes" },
  { date: "April 2026", summary: "Prisma Cloud upgraded to v33 — image rescan required", href: "/release-notes" },
]

const DEPLOYMENT_PATHS = [
  { label: "DoW / IL4", docs: ["Impact Levels", "ATO & Deployment Passport", "Platform One Access"], href: "/getting-started/authorization-path/dow" },
  { label: "FedRAMP", docs: ["Account Setup", "Access Control", "POA&M Guide"], href: "/getting-started/authorization-path/fedramp" },
  { label: "Commercial", docs: ["Overview", "Account Setup", "Security Policies"], href: "/getting-started/authorization-path/commercial" },
]

const COMMUNITY = [
  { icon: "💬", title: "Slack", description: "Connect with the Second Front team and other vendors on the #game-warden channel.", href: "#" },
  { icon: "🎓", title: "Training", description: "Access guided training modules for vendors, org admins, and second front staff.", href: "#" },
  { icon: "🎫", title: "Support Tickets", description: "Open a support ticket directly from App Central to get help from the GW team.", href: "/getting-started/gw-app/support-tickets" },
  { icon: "📄", title: "Release Notes", description: "Stay current with the latest platform updates, new features, and breaking changes.", href: "/release-notes" },
]

export default async function HomePage() {
  const nav = loadNav()
  const { versions } = loadVersions()
  const session = await getSession()

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav
        nav={nav.nav}
        userRoles={session?.roles ?? []}
        userName={session?.name ?? null}
        versions={versions}
        currentVersionId={null}
        currentSlug="/home"
      />

      <main className="flex-1 bg-white">
        {/* Hero */}
        <section className="bg-gray-950 text-white px-6 py-20 text-center">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Second Front Systems</p>
          <h1 className="text-4xl font-bold mb-4">Game Warden Help Center</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Everything you need to onboard, deploy, and operate your application on Game Warden's secure DoD platform.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/getting-started/onboarding/quickstart" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Get Started
            </Link>
            <Link href="/getting-started/authorization-path" className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-700">
              Choose Your Path
            </Link>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">

          {/* Feature cards */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURE_CARDS.map((card) => (
                <Link key={card.href} href={card.href} className="group flex flex-col gap-3 p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                  <span className="text-3xl">{card.icon}</span>
                  <h3 className="font-semibold text-gray-900">{card.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{card.description}</p>
                  <span className="text-sm text-blue-600 font-medium group-hover:underline">{card.cta} →</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Quick links + What's new */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Quick links */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Start here</h2>
              <p className="text-sm text-gray-500 mb-4">Common starting points for vendors onboarding to Game Warden.</p>
              <ul className="space-y-2">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                      <span className="text-gray-300">→</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* What's new */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">What&apos;s new</h2>
                <Link href="/release-notes" className="text-xs text-blue-600 hover:underline">See all updates →</Link>
              </div>
              <ul className="space-y-3">
                {WHATS_NEW.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-gray-400 shrink-0 w-20">{item.date}</span>
                    <Link href={item.href} className="text-gray-700 hover:text-blue-600 transition-colors leading-snug">
                      {item.summary}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Deployment paths */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Deployment Paths</h2>
            <p className="text-sm text-gray-500 mb-6">Game Warden supports three deployment environments. Select yours to see the relevant documentation.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DEPLOYMENT_PATHS.map((path) => (
                <Link key={path.href} href={path.href} className="group p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                  <h3 className="font-semibold text-gray-900 mb-3 group-hover:text-blue-700">{path.label}</h3>
                  <ul className="space-y-1">
                    {path.docs.map((doc) => (
                      <li key={doc} className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                  <span className="text-xs text-blue-500 mt-3 block opacity-0 group-hover:opacity-100 transition-opacity">View docs →</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Community / Resources */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Resources</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {COMMUNITY.map((item) => (
                <Link key={item.title} href={item.href} className="group flex flex-col gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                </Link>
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

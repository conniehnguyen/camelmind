import type { Metadata } from "next"
import "./globals.css"
import { SearchModal } from "@/components/Search/SearchModal"
import { ThemeProvider } from "next-themes"

export const metadata: Metadata = {
  title: "Game Warden Help Center",
  description: "Game Warden documentation",
  icons: {
    icon: "/2f-logo.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <SearchModal />
        </ThemeProvider>
      </body>
    </html>
  )
}

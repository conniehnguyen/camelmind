import type { Metadata } from "next"
import "./globals.css"
import { SearchModal } from "@/components/Search/SearchModal"

export const metadata: Metadata = {
  title: "Game Warden Help Center",
  description: "Game Warden documentation",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <SearchModal />
      </body>
    </html>
  )
}

import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getSession } from "@/lib/auth"
import { isAuthEnabled } from "@/lib/config"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (isAuthEnabled() && !session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const file = req.nextUrl.searchParams.get("file")
  const download = req.nextUrl.searchParams.get("download") === "1"

  if (!file) {
    return new NextResponse("Missing file param", { status: 400 })
  }

  // Only allow reading from the content directory
  const resolved = path.resolve(process.cwd(), file)
  const contentRoot = path.resolve(process.cwd(), "content")
  if (!resolved.startsWith(contentRoot)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  if (!fs.existsSync(resolved)) {
    return new NextResponse("Not found", { status: 404 })
  }

  const raw = fs.readFileSync(resolved, "utf-8")
  const filename = path.basename(resolved).replace(/\.mdx?$/, ".md")

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
  }

  if (download) {
    headers["Content-Disposition"] = `attachment; filename="${filename}"`
  }

  return new NextResponse(raw, { headers })
}

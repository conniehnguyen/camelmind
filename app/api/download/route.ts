import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getSession } from "@/lib/auth"
import { loadVersions } from "@/lib/versions"

export async function GET(req: NextRequest) {
  // Must be logged in — offline packages contain all role-gated content
  const session = await getSession()
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const versionId = req.nextUrl.searchParams.get("version")
  if (!versionId) {
    return new NextResponse("Missing version parameter", { status: 400 })
  }

  // Validate against known versions
  const { versions } = loadVersions()
  const version = versions.find((v) => v.id === versionId)
  if (!version) {
    return new NextResponse("Unknown version", { status: 404 })
  }

  // Only stable versions are available for offline download
  if (!version.stable) {
    return new NextResponse("Offline download not available for pre-release versions", { status: 403 })
  }

  const zipPath = path.join(process.cwd(), "offline-builds", `gw-helpcenter-${versionId}-offline.zip`)

  if (!fs.existsSync(zipPath)) {
    return new NextResponse("Offline package not yet built for this version", { status: 404 })
  }

  const stat = fs.statSync(zipPath)
  const stream = fs.createReadStream(zipPath)

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="gw-helpcenter-${versionId}-offline.zip"`,
      "Content-Length": stat.size.toString(),
    },
  })
}

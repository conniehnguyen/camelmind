import fs from "fs"
import path from "path"
import matter from "gray-matter"

export type FrontMatter = {
  title: string
  description?: string
  roles?: string[]
  tags?: string[]
  download_pdf?: string
}

export type TocEntry = {
  id: string
  text: string
  level: number
}

export type DocContent = {
  frontmatter: FrontMatter
  source: string
  toc: TocEntry[]
}

function extractToc(source: string): TocEntry[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const entries: TocEntry[] = []
  let match

  while ((match = headingRegex.exec(source)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
    entries.push({ id, text, level })
  }

  return entries
}

export function loadMdxFile(filePath: string): DocContent {
  const fullPath = path.join(process.cwd(), filePath)
  const raw = fs.readFileSync(fullPath, "utf-8")
  const { data, content } = matter(raw)

  return {
    frontmatter: data as FrontMatter,
    source: content,
    toc: extractToc(content),
  }
}

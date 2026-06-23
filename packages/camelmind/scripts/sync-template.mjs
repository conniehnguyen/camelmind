#!/usr/bin/env node
/**
 * Syncs framework files from the monorepo root into packages/camelmind/template/.
 *
 * Run from repo root:   npm run sync-template
 * Run from CLI package: node scripts/sync-template.mjs
 *
 * These files are identical to what users get when they run `npx camelmind init`.
 * Re-run this script before publishing the CLI package to keep the template in sync.
 */

import { cp, copyFile, mkdir, rm } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_DIR = path.join(__dirname, "..")
const ROOT_DIR = path.join(PACKAGE_DIR, "../..")
const TEMPLATE_DIR = path.join(PACKAGE_DIR, "template")

// Directories copied verbatim from root → template
const FRAMEWORK_DIRS = [
  "app",
  "components",
  "lib",
  "public",
  "scripts",
]

// Individual files copied from root → template
const FRAMEWORK_FILES = [
  "next.config.ts",
  "postcss.config.mjs",
  "tsconfig.json",
  "eslint.config.mjs",
  "proxy.ts",
]

async function copyDir(src, dest) {
  if (!existsSync(src)) {
    console.log(`  ${gray("skip")}  ${src} (not found)`)
    return
  }
  await rm(dest, { recursive: true, force: true })
  await cp(src, dest, {
    recursive: true,
    filter: (s) => {
      const rel = path.relative(src, s)
      return (
        !rel.includes("node_modules") &&
        !rel.includes(".next") &&
        !rel.includes(".git")
      )
    },
  })
  console.log(`  ${green("✓")}     ${path.relative(ROOT_DIR, src)}/`)
}

async function copyOne(src, dest) {
  if (!existsSync(src)) {
    console.log(`  ${gray("skip")}  ${path.relative(ROOT_DIR, src)} (not found)`)
    return
  }
  await copyFile(src, dest)
  console.log(`  ${green("✓")}     ${path.relative(ROOT_DIR, src)}`)
}

// Minimal ANSI helpers (no external deps)
const green = (s) => `\x1b[32m${s}\x1b[0m`
const gray = (s) => `\x1b[90m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`

async function main() {
  console.log(bold("\nSyncing framework → template\n"))
  console.log(`  Root:     ${ROOT_DIR}`)
  console.log(`  Template: ${TEMPLATE_DIR}\n`)

  await mkdir(TEMPLATE_DIR, { recursive: true })

  for (const dir of FRAMEWORK_DIRS) {
    await copyDir(path.join(ROOT_DIR, dir), path.join(TEMPLATE_DIR, dir))
  }

  for (const file of FRAMEWORK_FILES) {
    await copyOne(path.join(ROOT_DIR, file), path.join(TEMPLATE_DIR, file))
  }

  console.log(bold("\nDone. Template is ready to publish.\n"))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

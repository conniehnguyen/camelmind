#!/usr/bin/env node

import { Command } from "commander"
import { createRequire } from "module"
import { fileURLToPath } from "url"
import path from "path"
import fs from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgPath = path.join(__dirname, "../package.json")
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))

import { init } from "./commands/init.js"
import { checkVersion } from "./commands/version.js"

const program = new Command()

program
  .name("camelmind")
  .description("CamelMind CLI — scaffold and manage documentation sites")
  .version(pkg.version)

program
  .command("init [project-name]")
  .description("Create a new CamelMind documentation site")
  .option("--no-install", "Skip installing npm dependencies")
  .action(init)

program
  .command("version")
  .description("Show installed version and check for updates")
  .action(() => checkVersion(pkg.version))

program.parse()

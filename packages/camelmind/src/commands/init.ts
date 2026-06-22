import path from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"
import fs from "fs-extra"
import chalk from "chalk"
import ora from "ora"
import prompts from "prompts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// tsup bundles everything into dist/index.js, so __dirname = packages/camelmind/dist/
// template lives at packages/camelmind/template/ — one level up
const TEMPLATE_DIR = path.join(__dirname, "../template")

const BANNER = `
  ${chalk.hex("#D8A15B").bold("🐪 CamelMind")}  ${chalk.hex("#F4D6A7")("Doc site spun up in minutes.")}
`

function validateProjectName(name: string): string | true {
  if (!/^[a-z0-9][a-z0-9-_]*$/.test(name)) {
    return "Use lowercase letters, numbers, hyphens, or underscores (must start with a letter or digit)"
  }
  return true
}

export async function init(
  projectName: string | undefined,
  options: { install: boolean }
) {
  console.log(BANNER)

  // 1. Resolve project name
  if (!projectName) {
    const response = await prompts(
      {
        type: "text",
        name: "name",
        message: "What do you want to call your doc site?",
        initial: "my-docs",
        validate: validateProjectName,
      },
      { onCancel: () => process.exit(0) }
    )
    projectName = response.name as string
  } else {
    const valid = validateProjectName(projectName)
    if (valid !== true) {
      console.error(chalk.red(`  Error: ${valid}`))
      process.exit(1)
    }
  }

  const targetDir = path.resolve(process.cwd(), projectName)
  const displayDir = `./${path.relative(process.cwd(), targetDir)}`

  // 2. Check for existing directory
  if (await fs.pathExists(targetDir)) {
    const { overwrite } = await prompts(
      {
        type: "confirm",
        name: "overwrite",
        message: `${chalk.yellow(displayDir)} already exists — clear it and start fresh?`,
        initial: false,
      },
      { onCancel: () => process.exit(0) }
    )
    if (!overwrite) {
      console.log(chalk.gray("\n  Safe travels. Come back when you're ready.\n"))
      process.exit(0)
    }
    await fs.remove(targetDir)
  }

  console.log(
    `  Packing your caravan in ${chalk.cyan(displayDir)}\n`
  )

  // 3. Copy template
  const copySpinner = ora("Loading up the camel...").start()
  try {
    if (!(await fs.pathExists(TEMPLATE_DIR))) {
      copySpinner.fail(
        "Template directory not found. Run `npm run sync-template` from the monorepo root first."
      )
      process.exit(1)
    }

    await fs.copy(TEMPLATE_DIR, targetDir, {
      filter: (src) =>
        !src.includes("node_modules") &&
        !src.includes(".next") &&
        !src.includes(".git"),
    })

    // Rename _package.json → package.json (with project name substitution)
    const pkgSrc = path.join(targetDir, "_package.json")
    const pkgDest = path.join(targetDir, "package.json")
    if (await fs.pathExists(pkgSrc)) {
      let content = await fs.readFile(pkgSrc, "utf-8")
      content = content.replace(/\{\{projectName\}\}/g, projectName)
      await fs.writeFile(pkgDest, content, "utf-8")
      await fs.remove(pkgSrc)
    }

    // Rename _gitignore → .gitignore
    const gitignoreSrc = path.join(targetDir, "_gitignore")
    if (await fs.pathExists(gitignoreSrc)) {
      await fs.move(gitignoreSrc, path.join(targetDir, ".gitignore"))
    }

    // Rename _env.example → .env.example
    const envSrc = path.join(targetDir, "_env.example")
    if (await fs.pathExists(envSrc)) {
      await fs.move(envSrc, path.join(targetDir, ".env.example"))
    }

    copySpinner.succeed("Caravan loaded")
  } catch (err) {
    copySpinner.fail("Failed to load the caravan")
    console.error(chalk.red(`\n  ${String(err)}\n`))
    process.exit(1)
  }

  // 4. Install dependencies
  if (options.install) {
    const installSpinner = ora("Gathering supplies...").start()
    try {
      execSync("npm install", {
        cwd: targetDir,
        stdio: "ignore",
      })
      installSpinner.succeed("Supplies ready")
    } catch {
      installSpinner.warn(
        "Supply run failed — try npm install inside your project"
      )
    }
  }

  // 5. Print success
  const cdCmd = chalk.cyan(`cd ${displayDir}`)
  const installCmd = options.install ? "" : `\n    ${chalk.cyan("npm install")}`
  const devCmd = chalk.cyan("npm run dev")

  console.log(`
  ${chalk.hex("#D8A15B")("Your documentation journey starts here.")}

  ${chalk.bold("Next steps:")}
    ${cdCmd}${installCmd}
    ${devCmd}

  Then open ${chalk.underline("http://localhost:3000")} in your browser.
`)
}

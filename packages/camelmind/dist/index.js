#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";
import { fileURLToPath as fileURLToPath2 } from "url";
import path2 from "path";
import fs2 from "fs";

// src/commands/init.ts
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var TEMPLATE_DIR = path.join(__dirname, "../template");
var BANNER = `
  ${chalk.hex("#D8A15B").bold("\u{1F42A} CamelMind")}  ${chalk.hex("#F4D6A7")("Doc site spun up in minutes.")}
`;
function validateProjectName(name) {
  if (!/^[a-z0-9][a-z0-9-_]*$/.test(name)) {
    return "Use lowercase letters, numbers, hyphens, or underscores (must start with a letter or digit)";
  }
  return true;
}
async function init(projectName, options) {
  console.log(BANNER);
  if (!projectName) {
    const response = await prompts(
      {
        type: "text",
        name: "name",
        message: "What do you want to call your doc site?",
        initial: "my-docs",
        validate: validateProjectName
      },
      { onCancel: () => process.exit(0) }
    );
    projectName = response.name;
  } else {
    const valid = validateProjectName(projectName);
    if (valid !== true) {
      console.error(chalk.red(`  Error: ${valid}`));
      process.exit(1);
    }
  }
  const targetDir = path.resolve(process.cwd(), projectName);
  const displayDir = `./${path.relative(process.cwd(), targetDir)}`;
  if (await fs.pathExists(targetDir)) {
    const { overwrite } = await prompts(
      {
        type: "confirm",
        name: "overwrite",
        message: `${chalk.yellow(displayDir)} already exists \u2014 clear it and start fresh?`,
        initial: false
      },
      { onCancel: () => process.exit(0) }
    );
    if (!overwrite) {
      console.log(chalk.gray("\n  Safe travels. Come back when you're ready.\n"));
      process.exit(0);
    }
    await fs.remove(targetDir);
  }
  console.log(
    `  Packing your caravan in ${chalk.cyan(displayDir)}
`
  );
  const copySpinner = ora("Loading up the camel...").start();
  try {
    if (!await fs.pathExists(TEMPLATE_DIR)) {
      copySpinner.fail(
        "Template directory not found. Run `npm run sync-template` from the monorepo root first."
      );
      process.exit(1);
    }
    await fs.copy(TEMPLATE_DIR, targetDir, {
      filter: (src) => {
        const rel = path.relative(TEMPLATE_DIR, src);
        return !rel.includes("node_modules") && !rel.includes(".next") && !rel.includes(".git");
      }
    });
    const pkgSrc = path.join(targetDir, "_package.json");
    const pkgDest = path.join(targetDir, "package.json");
    if (await fs.pathExists(pkgSrc)) {
      let content = await fs.readFile(pkgSrc, "utf-8");
      content = content.replace(/\{\{projectName\}\}/g, projectName);
      await fs.writeFile(pkgDest, content, "utf-8");
      await fs.remove(pkgSrc);
    }
    const gitignoreSrc = path.join(targetDir, "_gitignore");
    if (await fs.pathExists(gitignoreSrc)) {
      await fs.move(gitignoreSrc, path.join(targetDir, ".gitignore"));
    }
    const envSrc = path.join(targetDir, "_env.example");
    if (await fs.pathExists(envSrc)) {
      await fs.move(envSrc, path.join(targetDir, ".env.example"));
    }
    copySpinner.succeed("Caravan loaded");
  } catch (err) {
    copySpinner.fail("Failed to load the caravan");
    console.error(chalk.red(`
  ${String(err)}
`));
    process.exit(1);
  }
  if (options.install) {
    const installSpinner = ora("Gathering supplies...").start();
    try {
      execSync("npm install", {
        cwd: targetDir,
        stdio: "ignore"
      });
      installSpinner.succeed("Supplies ready");
    } catch {
      installSpinner.warn(
        "Supply run failed \u2014 try npm install inside your project"
      );
    }
  }
  const cdCmd = chalk.cyan(`cd ${displayDir}`);
  const installCmd = options.install ? "" : `
    ${chalk.cyan("npm install")}`;
  const devCmd = chalk.cyan("npm run dev");
  console.log(`
  ${chalk.hex("#D8A15B")("Your documentation journey starts here.")}

  ${chalk.bold("Next steps:")}
    ${cdCmd}${installCmd}
    ${devCmd}

  Then open ${chalk.underline("http://localhost:3000")} in your browser.
`);
}

// src/commands/version.ts
import chalk2 from "chalk";
import ora2 from "ora";
async function checkVersion(currentVersion) {
  const spinner = ora2("Checking latest version...").start();
  let latestVersion;
  try {
    const res = await fetch("https://registry.npmjs.org/camelmind/latest");
    if (!res.ok) throw new Error(`Registry responded with ${res.status}`);
    const data = await res.json();
    latestVersion = data.version;
    spinner.stop();
  } catch {
    spinner.fail("Could not reach the npm registry");
    console.log(`
  Installed: ${chalk2.cyan(currentVersion)}
`);
    return;
  }
  const [curMajor, curMinor, curPatch] = currentVersion.split(".").map(Number);
  const [latMajor, latMinor, latPatch] = latestVersion.split(".").map(Number);
  const isOutdated = latMajor > curMajor || latMajor === curMajor && latMinor > curMinor || latMajor === curMajor && latMinor === curMinor && latPatch > curPatch;
  console.log(`
  Installed  ${chalk2.cyan(currentVersion)}
  Latest     ${isOutdated ? chalk2.yellow(latestVersion) : chalk2.green(latestVersion)}
`);
  if (isOutdated) {
    console.log(
      `  ${chalk2.yellow("\u26A0")}  A new version is available. Run:

    ${chalk2.cyan("npm install -g camelmind@latest")}
`
    );
  } else {
    console.log(`  ${chalk2.green("\u2713")}  You're up to date.
`);
  }
}

// src/index.ts
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var pkgPath = path2.join(__dirname2, "../package.json");
var pkg = JSON.parse(fs2.readFileSync(pkgPath, "utf-8"));
var program = new Command();
program.name("camelmind").description("CamelMind CLI \u2014 scaffold and manage documentation sites").version(pkg.version);
program.command("init [project-name]").description("Create a new CamelMind documentation site").option("--no-install", "Skip installing npm dependencies").action(init);
program.command("version").description("Show installed version and check for updates").action(() => checkVersion(pkg.version));
program.parse();

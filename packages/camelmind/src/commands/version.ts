import chalk from "chalk"
import ora from "ora"

export async function checkVersion(currentVersion: string) {
  const spinner = ora("Checking latest version...").start()

  let latestVersion: string
  try {
    const res = await fetch("https://registry.npmjs.org/camelmind/latest")
    if (!res.ok) throw new Error(`Registry responded with ${res.status}`)
    const data = await res.json() as { version: string }
    latestVersion = data.version
    spinner.stop()
  } catch {
    spinner.fail("Could not reach the npm registry")
    console.log(`\n  Installed: ${chalk.cyan(currentVersion)}\n`)
    return
  }

  const [curMajor, curMinor, curPatch] = currentVersion.split(".").map(Number)
  const [latMajor, latMinor, latPatch] = latestVersion.split(".").map(Number)
  const isOutdated =
    latMajor > curMajor ||
    (latMajor === curMajor && latMinor > curMinor) ||
    (latMajor === curMajor && latMinor === curMinor && latPatch > curPatch)

  console.log(`
  Installed  ${chalk.cyan(currentVersion)}
  Latest     ${isOutdated ? chalk.yellow(latestVersion) : chalk.green(latestVersion)}
`)

  if (isOutdated) {
    console.log(
      `  ${chalk.yellow("⚠")}  A new version is available. Run:\n\n    ${chalk.cyan("npm install -g camelmind@latest")}\n`
    )
  } else {
    console.log(`  ${chalk.green("✓")}  You're up to date.\n`)
  }
}

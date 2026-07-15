/**
 * Build and package the extension into versioned store-ready zips.
 *
 * Produces (from the version in package.json):
 *   releases/kartographe-trail-chrome-vX.Y.Z.zip
 *   releases/kartographe-trail-firefox-vX.Y.Z.zip
 *
 * Each zip contains the built extension with manifest.json at its root, ready to
 * upload to the Chrome Web Store / Edge Add-ons and Firefox AMO.
 *
 * Usage: `pnpm package`
 */
import { execSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from '../package.json' with { type: 'json' }

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RELEASES = resolve(ROOT, 'releases')

interface Target {
  name: 'chrome' | 'firefox'
  mode?: string
}

const TARGETS: Target[] = [
  { name: 'chrome' },
  { name: 'firefox', mode: 'firefox' },
]

function run(cmd: string) {
  console.info(`\n$ ${cmd}`)
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' })
}

function main() {
  const version = pkg.version

  // Type-check once, then build/zip each target.
  run('pnpm exec tsc --noEmit')

  rmSync(RELEASES, { recursive: true, force: true })
  mkdirSync(RELEASES, { recursive: true })

  for (const target of TARGETS) {
    const outDir = resolve(ROOT, 'dist', target.name)
    const modeFlag = target.mode ? ` --mode ${target.mode}` : ''
    run(`pnpm exec vite build --outDir dist/${target.name}${modeFlag}`)

    const zipPath = resolve(
      RELEASES,
      `kartographe-trail-${target.name}-v${version}.zip`,
    )
    // Zip the contents (manifest.json at the zip root), not the folder itself.
    run(`cd "${outDir}" && zip -r -X "${zipPath}" .`)
    console.info(`✓ ${zipPath}`)
  }

  console.info(`\nPackaged v${version} → releases/`)
}

main()

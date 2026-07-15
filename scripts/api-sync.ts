/**
 * Generate the typed API client from the Kartographe backend OpenAPI schema.
 *
 * Source of truth: `${VITE_API_URL}/openapi.json`.
 * Output (committed): `src/lib/api/schema.d.ts` — never edit by hand.
 *
 * Usage: `pnpm api:sync` (optionally override the base URL: `API_URL=... pnpm api:sync`).
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = resolve(ROOT, 'src/lib/api/schema.d.ts')

const baseUrl = (
  process.env.API_URL ??
  process.env.VITE_API_URL ??
  'http://localhost:8000'
).replace(/\/+$/, '')

const openapiUrl = `${baseUrl}/openapi.json`

async function main() {
  console.info(`[api:sync] fetching OpenAPI from ${openapiUrl}`)

  const ast = await openapiTS(new URL(openapiUrl), {
    // Keep enums as string literal unions (matches the main front-end).
    enum: false,
    // Emit `Date` for date-time is avoided; keep strings for JSON transport.
    alphabetize: true,
  })

  const banner = [
    '/**',
    ' * GENERATED FILE — do not edit by hand.',
    ' * Run `pnpm api:sync` to regenerate from the backend OpenAPI schema.',
    ` * Source: ${openapiUrl}`,
    ' */',
    '',
  ].join('\n')

  const contents = banner + astToString(ast)

  await mkdir(dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, contents, 'utf8')

  console.info(`[api:sync] wrote ${OUTPUT}`)
}

main().catch((error) => {
  console.error('[api:sync] failed:', error)
  process.exitCode = 1
})

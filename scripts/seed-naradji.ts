/**
 * Thin wrapper — full catalog seed is the admin /next/seed path.
 * Usage: pnpm seed:naradji
 *
 * disableRevalidate is required on Atlas (relationship filterOptions + txn).
 * After seed we drop Next's data cache so CLI seed isn't masked by stale HTML.
 */
import 'dotenv/config'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { seed } from '../src/endpoints/seed'
import type { PayloadRequest } from 'payload'

async function bustNextDataCache() {
  const cacheDir = path.resolve(process.cwd(), '.next/cache')
  try {
    await rm(cacheDir, { recursive: true, force: true })
    console.log('NEXT_CACHE_CLEARED', cacheDir)
  } catch {
    // No .next yet — fine for headless CI seed.
  }
}

async function main() {
  const payload = await getPayload({ config })
  const admins = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'admin' } },
    limit: 1,
  })
  const user = admins.docs[0]
  if (!user) {
    throw new Error('No admin user — create one at /admin first')
  }

  await seed({
    payload,
    req: { payload, user, context: { disableRevalidate: true } } as unknown as PayloadRequest,
  })
  await bustNextDataCache()
  console.log('SEED_OK')
  console.log('If next dev is running, restart it once so layout/header pick up globals.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

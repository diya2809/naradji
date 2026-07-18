/**
 * Reproduces /next/seed Local API path for debugging.
 * Usage: pnpm exec tsx --env-file=.env scripts/run-admin-seed.ts
 *
 * Do NOT use createLocalReq here — Atlas transactions break gallery.variantOption
 * filterOptions during seed (same bug as the admin Seed button).
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { seed } from '../src/endpoints/seed'
import type { PayloadRequest } from 'payload'

async function main() {
  const payload = await getPayload({ config })

  const admins = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'admin' } },
    limit: 5,
  })
  console.log(
    'admins:',
    admins.docs.map((u) => ({ id: u.id, email: u.email, roles: u.roles })),
  )

  let user = admins.docs[0]
  if (!user) {
    console.log('NO_ADMIN — creating admin@naradji.local')
    user = await payload.create({
      collection: 'users',
      data: {
        email: 'admin@naradji.local',
        password: 'password',
        roles: ['admin'],
        name: 'Admin',
      },
    })
  }

  try {
    await seed({
      payload,
      req: { payload, user, context: { disableRevalidate: true } } as PayloadRequest,
    })
    console.log('SEED_OK')
  } catch (e: unknown) {
    const err = e as { message?: string; data?: unknown; stack?: string }
    console.error('SEED_FAIL:', err.message || e)
    if (err.data) console.error('data:', JSON.stringify(err.data, null, 2).slice(0, 3000))
    console.error((err.stack || String(e)).slice(0, 4000))
    process.exit(1)
  }
}

void main()

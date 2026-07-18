import { getPayload } from 'payload'
import { seed } from '@/endpoints/seed'
import config from '@payload-config'
import { headers } from 'next/headers'

import { checkRole } from '@/access/utilities'

export const maxDuration = 300 // This function can run for a maximum of 300 seconds

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  // Authenticate by passing request headers
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return Response.json(
      {
        success: false,
        error:
          'Admin login required. Create the first user at /admin/create-first-user, then click Seed again.',
      },
      { status: 403 },
    )
  }

  try {
    // Do NOT wrap seed in createLocalReq — Atlas transactions break
    // products.gallery.variantOption filterOptions mid-seed.
    await seed({
      payload,
      // Minimal req shape for typings; seed deliberately ignores transaction scope
      req: { payload, user, context: { disableRevalidate: true } } as Parameters<
        typeof seed
      >[0]['req'],
    })

    return Response.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error seeding data'
    payload.logger.error({ err: e, message: 'Error seeding data' })
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}

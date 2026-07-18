import { getPayload } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'
import { seed } from '@/endpoints/seed'
import config from '@payload-config'
import { headers } from 'next/headers'
import type { PayloadRequest } from 'payload'

import { checkRole } from '@/access/utilities'

export const maxDuration = 300 // This function can run for a maximum of 300 seconds

const seededPageSlugs = ['home', 'contact', 'about', 'privacy', 'terms', 'cookies'] as const

function revalidateSeededPages() {
  for (const slug of seededPageSlugs) {
    revalidateTag(`pages_${slug}`, 'max')
    revalidatePath(slug === 'home' ? '/' : `/${slug}`)
  }

  revalidateTag('global_header', 'max')
  revalidateTag('global_footer', 'max')
  revalidatePath('/shop')
  revalidatePath('/', 'layout')
}

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    // Do NOT use createLocalReq on Atlas — multi-doc transactions break
    // relationship filterOptions during seed. Pass a lightweight req instead.
    await seed({
      payload,
      req: {
        payload,
        user,
        context: { disableRevalidate: true },
      } as unknown as PayloadRequest,
    })
    revalidateSeededPages()

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding data' })
    return new Response('Error seeding data.', { status: 500 })
  }
}

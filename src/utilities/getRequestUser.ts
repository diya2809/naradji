import type { User } from '@/payload-types'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { cache } from 'react'
import { getPayload } from 'payload'

export const getRequestUser = cache(async (): Promise<User | null> => {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  return user ?? null
})

import type { Metadata } from 'next'

import { AccountPageClient } from './AccountPageClient'
import { getRequestUser } from '@/utilities/getRequestUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
  const user = await getRequestUser()

  if (!user) {
    redirect(`/login?warning=${encodeURIComponent('Log in to continue.')}`)
  }

  return <AccountPageClient user={user} />
}

export const metadata: Metadata = {
  description: 'Your account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}

import type { Metadata } from 'next'

import { AccountPanel } from '@/components/account/AccountPanel'
import { AddressListing } from '@/components/addresses/AddressListing'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { getRequestUser } from '@/utilities/getRequestUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { redirect } from 'next/navigation'

export default async function AddressesPage() {
  const user = await getRequestUser()

  if (!user) {
    redirect(`/login?warning=${encodeURIComponent('Log in to continue.')}`)
  }

  return (
    <AccountPanel>
      <h1 className="mb-6 text-3xl font-semibold md:mb-8">Addresses</h1>

      <div className="mb-6 md:mb-8">
        <AddressListing />
      </div>

      <CreateAddressModal buttonText="Add address" modalTitle="New address" />
    </AccountPanel>
  )
}

export const metadata: Metadata = {
  description: 'Your addresses.',
  openGraph: mergeOpenGraph({
    title: 'Addresses',
    url: '/account/addresses',
  }),
  title: 'Addresses',
}

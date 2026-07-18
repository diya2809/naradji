'use client'

import { AddressItem } from '@/components/addresses/AddressItem'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Address } from '@/payload-types'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { useState } from 'react'

type Props = {
  selectedAddress?: Address
  setAddress: React.Dispatch<React.SetStateAction<Partial<Address> | undefined>>
  heading?: string
  description?: string
}

export const CheckoutAddresses: React.FC<Props> = ({
  setAddress,
  heading = 'Addresses',
  description = 'Select or add a shipping and billing address.',
}) => {
  const { addresses } = useAddresses()

  if (!addresses?.length) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">No addresses found. Add one to continue.</p>
        <CreateAddressModal buttonText="Add address" modalTitle="New address" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-1 text-lg font-medium">{heading}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <AddressesModal setAddress={setAddress} />
    </div>
  )
}

function AddressesModal({
  setAddress,
}: {
  setAddress: React.Dispatch<React.SetStateAction<Partial<Address> | undefined>>
}) {
  const [open, setOpen] = useState(false)
  const { addresses } = useAddresses()

  if (!addresses?.length) {
    return <p className="text-sm text-muted-foreground">No addresses found.</p>
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Select an address
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select an address</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-8">
          <ul className="flex flex-col gap-6">
            {addresses.map((address) => (
              <li className="border-b border-border pb-6 last:border-none" key={address.id}>
                <AddressItem
                  address={address}
                  beforeActions={
                    <Button
                      onClick={(e) => {
                        e.preventDefault()
                        setAddress(address)
                        setOpen(false)
                      }}
                      type="button"
                    >
                      Select
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>

          <CreateAddressModal buttonText="Add address" modalTitle="New address" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import React from 'react'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { AddressItem } from '@/components/addresses/AddressItem'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { IconTrash } from '@tabler/icons-react'

export const AddressListing: React.FC = () => {
  const { addresses } = useAddresses()

  const handleDelete = async (addressID: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/addresses/${addressID}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        if (response.ok) {
          toast.success('Address deleted successfully.')
          window.location.reload()
        } else {
          toast.error('Failed to delete address.')
        }
      } catch (e) {
        toast.error('Error deleting address.')
      }
    }
  }

  if (!addresses || addresses.length === 0) {
    return <p className="text-muted-foreground">None yet.</p>
  }

  return (
    <div>
      <ul className="flex flex-col gap-8">
        {addresses.map((address) => (
          <li className="border-b border-border pb-8 last:border-none" key={address.id}>
            <AddressItem
              address={address}
              afterActions={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(address.id!)}
                  title="Delete Address"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                >
                  <IconTrash className="h-4.5 w-4.5" />
                </Button>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

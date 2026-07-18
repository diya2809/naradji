'use client'

import React from 'react'
import type { Address } from '@/payload-types'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { formatAddressSummary, type AddressInput } from '@/ecommerce/addressForm'
import { Button } from '@/components/ui/button'
import { IconPencil } from '@tabler/icons-react'

type Props = {
  address: AddressInput
  actions?: React.ReactNode
  beforeActions?: React.ReactNode
  afterActions?: React.ReactNode
  hideActions?: boolean
}

export const AddressItem: React.FC<Props> = ({
  address,
  actions,
  hideActions = false,
  beforeActions,
  afterActions,
}) => {
  if (!address) {
    return null
  }

  const lines = formatAddressSummary(address)

  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      {!hideActions && address.id && (
        <div className="flex shrink-0 flex-col gap-2">
          {actions ? (
            actions
          ) : (
            <>
              {beforeActions}
              <CreateAddressModal
                addressID={address.id}
                initialData={address}
                modalTitle="Edit address"
                renderTrigger={(onClick) => (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClick}
                    title="Edit Address"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg shrink-0"
                  >
                    <IconPencil className="h-4.5 w-4.5" />
                  </Button>
                )}
              />
              {afterActions}
            </>
          )}
        </div>
      )}
    </div>
  )
}

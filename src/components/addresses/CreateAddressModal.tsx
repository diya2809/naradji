'use client'

import { AddressFormFields } from '@/components/addresses/AddressFormFields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  toAddressFormValues,
  toAddressPayload,
  type AddressFormValues,
  type AddressInput,
} from '@/ecommerce/addressForm'
import type { Address } from '@/payload-types'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { DefaultDocumentIDType } from 'payload'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

type Props = {
  addressID?: DefaultDocumentIDType
  initialData?: AddressInput
  buttonText?: string
  modalTitle?: string
  callback?: (address: Partial<Address>) => void
  skipSubmission?: boolean
  disabled?: boolean
  renderTrigger?: (onClick: () => void) => React.ReactNode
}

export function CreateAddressModal({
  addressID,
  initialData,
  buttonText = 'Add address',
  modalTitle = 'New address',
  callback,
  skipSubmission,
  disabled,
  renderTrigger,
}: Props) {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const { createAddress, updateAddress } = useAddresses()

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressFormValues>({
    defaultValues: toAddressFormValues(initialData),
  })

  const onSubmit = useCallback(
    async (data: AddressFormValues) => {
      const payload = toAddressPayload(data)

      if (!skipSubmission) {
        if (addressID) {
          await updateAddress(addressID, payload)
        } else {
          await createAddress(payload)
        }
      }

      setOpen(false)
      reset(toAddressFormValues(initialData))
      callback?.(payload)
    },
    [addressID, callback, createAddress, initialData, reset, skipSubmission, updateAddress],
  )

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (nextOpen) {
      reset(toAddressFormValues(initialData))
    }
  }

  const fields = <AddressFormFields errors={errors} register={register} />

  const trigger = renderTrigger ? (
    renderTrigger(() => handleOpenChange(true))
  ) : (
    <Button disabled={disabled} onClick={() => handleOpenChange(true)} type="button" variant="outline">
      {buttonText}
    </Button>
  )

  if (!mounted) {
    return trigger
  }

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer direction="bottom" onOpenChange={handleOpenChange} open={open}>
          <DrawerContent className="max-h-[85vh]">
            <form
              className="flex max-h-[inherit] min-h-0 flex-col overflow-hidden"
              onSubmit={handleSubmit(onSubmit)}
            >
              <DrawerHeader className="flex-row items-center justify-between gap-3 text-left">
                <DrawerTitle className="min-w-0 flex-1 text-left">{modalTitle}</DrawerTitle>
                <Button type="submit" size="sm" className="shrink-0">
                  Save
                </Button>
              </DrawerHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{fields}</div>
            </form>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <>
      {trigger}
      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{modalTitle}</DialogTitle>
            </DialogHeader>
            <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4 no-scrollbar">{fields}</div>
            <DialogFooter>
              <Button type="submit">Save address</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

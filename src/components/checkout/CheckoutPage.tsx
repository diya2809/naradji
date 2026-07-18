'use client'

import { cn } from '@/utilities/index'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { ProductPriceDisplay } from '@/components/ProductPriceDisplay'
import { getLineItemPricing } from '@/utilities/productPricing'
import { getProductLineItemImage } from '@/utilities/productLineItemImage'
import { getShippingCharge } from '@/lib/shippingCharge'
import {
  formatAddressContactError,
  getAddressContactIssues,
  isAddressReadyForCheckout,
} from '@/ecommerce/addressForm'
import { AddressItem } from '@/components/addresses/AddressItem'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { LoginForm } from '@/components/forms/LoginForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import type { Address } from '@/payload-types'
import type { VariantOptionEntry } from '@/types/storefront'
import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/providers/Auth'
import { IconAlertCircle, IconPencil } from '@tabler/icons-react'

function CheckoutSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4 border-b border-border pb-8 last:border-b-0">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const [error, setError] = useState<null | string>(null)
  const { initiatePayment, confirmOrder } = usePayments()
  const { addresses } = useAddresses() as { addresses: Address[] | undefined }
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [isProcessingPayment, setProcessingPayment] = useState(false)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  const addressContactIssues = getAddressContactIssues(billingAddress)
  const addressReady = isAddressReadyForCheckout(billingAddress)
  const checkoutErrorTitle =
    addressContactIssues.length > 0 ||
    Boolean(error && /delivery address|full name|phone number/i.test(error))
      ? 'Address incomplete'
      : 'Couldn’t start payment'

  // Prefill default address when saved addresses load (prefer one with name + phone)
  useEffect(() => {
    if (!billingAddress && addresses?.length) {
      const ready = addresses.find((address) => isAddressReadyForCheckout(address))
      const defaultAddress = ready || addresses[0]
      if (defaultAddress) {
        setBillingAddress(defaultAddress)
      }
    }
  }, [addresses, billingAddress])

  // Keep selected address in sync after edit (e.g. name/phone added)
  useEffect(() => {
    if (!billingAddress?.id || !addresses?.length) return
    const latest = addresses.find((address) => address.id === billingAddress.id)
    if (
      latest &&
      (latest.name !== billingAddress.name ||
        latest.phone !== billingAddress.phone ||
        latest.alternatePhone !== billingAddress.alternatePhone ||
        latest.addressLine1 !== billingAddress.addressLine1 ||
        latest.addressLine2 !== billingAddress.addressLine2 ||
        latest.city !== billingAddress.city ||
        latest.state !== billingAddress.state ||
        latest.postalCode !== billingAddress.postalCode)
    ) {
      setBillingAddress(latest)
      setError(null)
    }
  }, [addresses, billingAddress])

  useEffect(() => {
    return () => {
      setBillingAddress(undefined)
    }
  }, [])

  const showCheckoutError = useCallback((message: string) => {
    setError(message)
    toast.error(message)
  }, [])

  const placeCodOrder = useCallback(async () => {
    setError(null)

    if (!billingAddress) {
      showCheckoutError('Please select a delivery address before placing the order.')
      return
    }

    const contactIssues = getAddressContactIssues(billingAddress)
    if (contactIssues.length > 0) {
      showCheckoutError(formatAddressContactError(contactIssues))
      return
    }

    setProcessingPayment(true)
    try {
      const paymentData = (await initiatePayment('cod', {
        additionalData: {
          customerEmail: user?.email,
          billingAddress,
          shippingAddress: billingAddress,
        },
      })) as Record<string, unknown>

      const reference =
        (paymentData.reference as string | undefined) ||
        (paymentData.orderID as string | undefined)

      if (!reference) {
        throw new Error('We couldn’t start your COD order. Please try again.')
      }

      const confirmResult = await confirmOrder('cod', {
        additionalData: {
          reference,
          orderID: reference,
          ...(user?.email ? { customerEmail: user.email } : {}),
        },
      })

      if (
        confirmResult &&
        typeof confirmResult === 'object' &&
        'orderID' in confirmResult &&
        confirmResult.orderID
      ) {
        try {
          await clearCart()
        } catch {
          // Non-fatal: order already succeeded; cart cleared server-side.
        }

        toast.success('Order placed — pay cash on delivery. Redirecting…')
        router.replace('/orders')
        return
      }

      throw new Error('We couldn’t confirm your COD order. Please try again.')
    } catch (error) {
      let errorMessage = 'We couldn’t place your order. Please try again.'

      if (error instanceof Error && error.message) {
        try {
          const errorData = JSON.parse(error.message) as {
            cause?: { code?: string }
            errors?: Array<{
              message?: string
              data?: { errors?: Array<{ message?: string; path?: string }> }
            }>
            message?: string
          }

          if (errorData?.cause?.code === 'OutOfStock') {
            errorMessage = 'One or more items in your cart are out of stock.'
          } else {
            const nested =
              errorData.errors?.[0]?.data?.errors?.map((e) => e.message).filter(Boolean) ||
              errorData.errors?.map((e) => e.message).filter(Boolean)
            if (nested?.length) {
              const joined = nested.join(' ')
              if (/name|phone|billingAddress|shippingAddress/i.test(joined)) {
                errorMessage =
                  'Please add your full name and phone number to the delivery address, then try again.'
              } else {
                errorMessage = joined
              }
            } else if (errorData.message && !errorData.message.startsWith('{')) {
              errorMessage = errorData.message
            }
          }
        } catch {
          if (!error.message.startsWith('{')) {
            errorMessage = error.message
          }
        }
      }

      showCheckoutError(errorMessage)
      setProcessingPayment(false)
    }
  }, [
    billingAddress,
    user?.email,
    initiatePayment,
    confirmOrder,
    clearCart,
    router,
    showCheckoutError,
  ])

  if (cartIsEmpty && isProcessingPayment) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-12">
        <h2 className="text-2xl font-semibold">Placing your order…</h2>
        <LoadingSpinner />
      </div>
    )
  }

  if (cartIsEmpty) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-12">
        <p className="text-lg text-muted-foreground">Your cart is empty.</p>
        <Button asChild variant="outline">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md pt-1 pb-12 md:max-w-lg">
        <LoginForm redirectOverride="/checkout" />
      </div>
    )
  }

  return (
    <div className="my-8 grid w-full gap-10 grid-cols-1 md:grid-cols-5">
      <div className="space-y-8 md:col-span-3">

        {/* Step 1: Delivery Address selection */}
          <CheckoutSection title="Delivery Address">
            {!addresses?.length ? (
              <div className="pt-2 flex justify-start">
                <CreateAddressModal
                  buttonText="+ Add Address"
                  callback={(address) => setBillingAddress(address)}
                  modalTitle="New address"
                  disabled={isProcessingPayment}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Select a delivery address below:</p>
                <div className="grid gap-4 grid-cols-1">
                  {addresses.map((address) => {
                    const isSelected = billingAddress?.id === address.id
                    const incomplete = getAddressContactIssues(address).length > 0
                    return (
                      <div
                        key={address.id}
                        onClick={() => {
                          setBillingAddress(address)
                          setError(null)
                        }}
                        className={cn(
                          'relative flex max-w-xl cursor-pointer items-center justify-between gap-6 rounded-xl border px-4 py-2.5 transition-all hover:bg-muted/40',
                          isSelected
                            ? incomplete
                              ? 'border-destructive ring-1 ring-destructive bg-destructive/[0.03]'
                              : 'border-primary ring-1 ring-primary bg-primary/[0.02]'
                            : 'border-border bg-card',
                        )}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <AddressItem address={address} hideActions />
                          {incomplete ? (
                            <p className="text-xs text-destructive">
                              Missing name or phone — edit to complete
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-4" onClick={(e) => e.stopPropagation()}>
                          <CreateAddressModal
                            addressID={address.id}
                            initialData={address}
                            modalTitle="Edit address"
                            disabled={isProcessingPayment}
                            callback={(updated) => {
                              setBillingAddress({ ...address, ...updated })
                              setError(null)
                            }}
                            renderTrigger={(onClick) => (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClick}
                                disabled={isProcessingPayment}
                                title="Edit Address"
                                className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-primary"
                              >
                                <IconPencil className="h-4.5 w-4.5" />
                              </Button>
                            )}
                          />
                          <div
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                              isSelected
                                ? incomplete
                                  ? 'border-destructive bg-destructive text-destructive-foreground'
                                  : 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/50 bg-transparent',
                            )}
                            onClick={() => {
                              setBillingAddress(address)
                              setError(null)
                            }}
                          >
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-2">
                  <CreateAddressModal
                    buttonText="+ Add Address"
                    callback={(address) => {
                      setBillingAddress(address)
                      setError(null)
                    }}
                    modalTitle="New address"
                    disabled={isProcessingPayment}
                  />
                </div>
              </div>
            )}

            {error ? (
              <Alert variant="destructive" className="mt-4">
                <IconAlertCircle />
                <AlertTitle>{checkoutErrorTitle}</AlertTitle>
                <AlertDescription>
                  <p>{error}</p>
                  {addressContactIssues.length > 0 ? (
                    <p className="mt-2 text-sm">
                      Tap the pencil icon on your address to add the missing details.
                    </p>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null}

            {addresses && addresses.length > 0 && (
              <div className="mt-8 flex flex-col items-stretch gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-end">
                {!addressReady && billingAddress ? (
                  <p className="text-sm text-muted-foreground sm:mr-auto">
                    Add name and phone to your address to continue.
                  </p>
                ) : null}
                <Button
                  size="lg"
                  disabled={!billingAddress || isProcessingPayment}
                  onClick={(e) => {
                    e.preventDefault()
                    void placeCodOrder()
                  }}
                >
                  {isProcessingPayment ? 'Placing order…' : 'Place COD order'}
                </Button>
              </div>
            )}
          </CheckoutSection>
      </div>

      <aside className="h-fit space-y-4 md:sticky md:top-24 md:col-span-2">
        <h2 className="text-2xl font-semibold">Order Summary</h2>
        {cart?.items?.map((item, index) => {
          if (typeof item.product === 'object' && item.product) {
            const { product, quantity, variant } = item

            if (!quantity) return null

            const isVariant = Boolean(variant) && typeof variant === 'object'
            const image = getProductLineItemImage(product, isVariant ? variant : undefined)
            const unitPricing = getLineItemPricing(product, isVariant ? variant : undefined)

            return (
              <div className="flex items-start gap-3" key={index}>
                <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted p-1.5">
                  <div className="relative h-full w-full">
                    {image ? (
                      <Media
                        className="h-full w-full"
                        fill
                        imgClassName="rounded-sm object-cover"
                        resource={image}
                      />
                    ) : null}
                  </div>
                </div>
                <div className="flex grow flex-col justify-start gap-1">
                  <p className="text-sm font-medium text-foreground">{product.title}</p>
                  
                  <ProductPriceDisplay
                    className="justify-start text-left"
                    priceClassName="text-sm font-semibold text-foreground"
                    pricing={unitPricing}
                  />

                  <p className="text-xs text-muted-foreground">Qty {quantity}</p>

                  {variant && typeof variant === 'object' && (
                    <p className="text-xs text-muted-foreground">
                      {variant.options
                        ?.map((option: VariantOptionEntry) => {
                          if (typeof option === 'object' && option) {
                            const name = typeof option.variantType === 'object' && option.variantType ? option.variantType.label : 'Variant'
                            return `${name}: ${option.label}`
                          }
                          return null
                        })
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )
          }
          return null
        })}
        <Separator />
        {(() => {
          const productSubtotal = cart.subtotal || 0
          const shippingCharge = getShippingCharge(productSubtotal)
          const grandTotal = productSubtotal + shippingCharge
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Products</span>
                <Price amount={productSubtotal} className="text-sm font-medium" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Shipping</span>
                {shippingCharge > 0 ? (
                  <Price amount={shippingCharge} className="text-sm font-medium" />
                ) : (
                  <span className="text-sm font-semibold text-foreground">Free</span>
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <Price amount={grandTotal} className="text-xl font-semibold" />
              </div>
            </div>
          )
        })()}
      </aside>
    </div>
  )
}

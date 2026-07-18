'use client'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { ProductPriceDisplay } from '@/components/ProductPriceDisplay'
import { getLineItemPricing } from '@/utilities/productPricing'
import { getProductLineItemImage } from '@/utilities/productLineItemImage'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo } from 'react'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import { OpenCartButton } from './OpenCart'
import { useCartDrawer } from './cart-context'
import { Button } from '@/components/ui/button'
import { Product, Variant } from '@/payload-types'
import type { CategoryListItem, VariantOptionEntry } from '@/types/storefront'
import { getShippingCharge } from '@/lib/shippingCharge'

type Props = {
  categories?: CategoryListItem[]
}

function CartLineImage({
  product,
  variant,
}: {
  product: Product
  variant?: Variant | string | null
}) {
  const image = getProductLineItemImage(
    product,
    variant && typeof variant === 'object' ? variant : undefined,
  )

  if (!image) {
    return <div className="relative size-full bg-muted" />
  }

  return <Media className="h-full w-full" fill imgClassName="object-cover" resource={image} />
}

export function CartModal({ categories = [] }: Props) {
  const { cart } = useCart()
  const { open, setOpen } = useCartDrawer()

  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  const totalQuantity = useMemo(() => {
    if (!cart || !cart.items || !cart.items.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
  }, [cart])

  return (
    <Drawer direction="right" onOpenChange={setOpen} open={open}>
      <DrawerTrigger asChild>
        <OpenCartButton quantity={totalQuantity} />
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Cart</DrawerTitle>
          <DrawerDescription className="sr-only">Cart</DrawerDescription>
        </DrawerHeader>

        {!cart || cart?.items?.length === 0 ? (
          <div className="flex flex-1 flex-col items-center px-4 pb-6 pt-2 text-center">
            <p className="mb-6 text-lg font-medium">Empty.</p>
            {categories.length > 0 ? (
              <div className="flex w-full max-w-xs flex-col gap-2">
                {categories.map((category) => (
                  <Button asChild key={category.id} variant="default" onClick={() => setOpen(false)}>
                    <Link href={`/shop?category=${category.id}`}>{category.title}</Link>
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="min-h-0 flex-1 px-6">
            <div className="flex h-full w-full flex-col justify-between">
              <ul className="flex-1 overflow-y-auto py-2">
                {cart?.items?.map((item, i) => {
                  const product = item.product
                  const variant = item.variant

                  if (typeof product !== 'object' || !item || !product || !product.slug)
                    return <React.Fragment key={i} />

                  const isVariant = Boolean(variant) && typeof variant === 'object'
                  const unitPricing = getLineItemPricing(
                    product,
                    isVariant ? variant : undefined,
                  )

                  return (
                    <li className="flex w-full flex-col border-b border-border/60 last:border-b-0" key={i}>
                      <div className="flex w-full flex-col items-center py-4">
                        <Link href={`/products/${product.slug}`} className="mb-2.5">
                          <div className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-lg border border-border bg-card">
                            <CartLineImage product={product} variant={variant} />
                          </div>
                        </Link>

                        <div className="mb-1.5 w-full px-2 text-center">
                          <Link
                            className="mx-auto block max-w-[85%] line-clamp-2 text-sm font-semibold leading-tight text-foreground hover:underline"
                            href={`/products/${product.slug}`}
                          >
                            {product.title}
                          </Link>
                          {isVariant && variant ? (
                            <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                              {variant.options
                                ?.map((option: VariantOptionEntry) => {
                                  if (typeof option === 'object') return option.label
                                  return null
                                })
                                .join(', ')}
                            </p>
                          ) : null}
                        </div>

                        <div className="mb-3 flex justify-center">
                          {unitPricing.mode === 'single' && (
                            <Price
                              amount={unitPricing.price}
                              className="text-lg font-bold text-foreground"
                            />
                          )}
                          {unitPricing.mode === 'range' && (
                            <Price
                              className="text-lg font-bold text-foreground"
                              highestAmount={unitPricing.highestPrice}
                              lowestAmount={unitPricing.lowestPrice}
                            />
                          )}
                          {unitPricing.mode === 'unavailable' && (
                            <span className="text-sm text-muted-foreground">Price on request</span>
                          )}
                        </div>

                        <div className="flex items-center justify-center gap-4">
                          <DeleteItemButton item={item} />
                          <div className="flex h-8 flex-row items-center rounded-md border border-border">
                            <EditItemQuantityButton item={item} type="minus" />
                            <p className="w-6 text-center">
                              <span className="w-full text-sm">{item.quantity}</span>
                            </p>
                            <EditItemQuantityButton item={item} type="plus" />
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <DrawerFooter className="border-t border-border bg-popover text-sm text-muted-foreground">
                {typeof cart?.subtotal === 'number' && (() => {
                  const shippingCharge = getShippingCharge(cart.subtotal)
                  const grandTotal = cart.subtotal + shippingCharge
                  return (
                    <>
                      <div className="flex items-center justify-between pb-0.5 pt-1">
                        <p>Products</p>
                        <Price
                          amount={cart.subtotal}
                          className="text-right text-sm text-foreground"
                        />
                      </div>
                      <div className="flex items-center justify-between pb-0.5">
                        <p>Shipping</p>
                        {shippingCharge > 0 ? (
                          <Price
                            amount={shippingCharge}
                            className="text-right text-sm text-foreground"
                          />
                        ) : (
                          <span className="text-right text-sm font-semibold text-foreground">Free</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pb-1 border-t border-border/50 pt-2 mt-1">
                        <p className="font-semibold text-foreground">Total</p>
                        <Price
                          amount={grandTotal}
                          className="text-right text-base font-semibold text-foreground"
                        />
                      </div>
                    </>
                  )
                })()}

                <Button asChild>
                  <Link className="w-full" href="/checkout">
                    Checkout
                  </Link>
                </Button>
              </DrawerFooter>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}

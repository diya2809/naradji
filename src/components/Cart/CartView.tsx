'use client'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { getShippingCharge } from '@/lib/shippingCharge'
import type { Product, Variant } from '@/payload-types'
import type { VariantOptionEntry } from '@/types/storefront'
import { getProductLineItemImage } from '@/utilities/productLineItemImage'
import { getLineItemPricing } from '@/utilities/productPricing'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import Link from 'next/link'
import React from 'react'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'

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

export function CartView() {
  const { cart } = useCart()
  const empty = !cart || !cart.items?.length

  if (empty) {
    return (
      <div className="flex flex-col items-start gap-4 py-8">
        <p className="text-lg font-medium">Your cart is empty.</p>
        <Button asChild>
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    )
  }

  const shippingCharge =
    typeof cart.subtotal === 'number' ? getShippingCharge(cart.subtotal) : 0
  const grandTotal =
    typeof cart.subtotal === 'number' ? cart.subtotal + shippingCharge : undefined

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      <ul className="min-w-0 flex-1 divide-y divide-border rounded-xl border border-border bg-card">
        {cart.items?.map((item, i) => {
          const product = item.product
          const variant = item.variant

          if (typeof product !== 'object' || !item || !product || !product.slug) {
            return <React.Fragment key={i} />
          }

          const isVariant = Boolean(variant) && typeof variant === 'object'
          const unitPricing = getLineItemPricing(product, isVariant ? variant : undefined)

          return (
            <li className="flex gap-4 p-4" key={item.id ?? i}>
              <Link href={`/products/${product.slug}`} className="shrink-0">
                <div className="relative size-20 overflow-hidden rounded-lg border border-border bg-muted sm:size-24">
                  <CartLineImage product={product} variant={variant} />
                </div>
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      className="line-clamp-2 text-sm font-semibold text-foreground hover:underline"
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
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    ) : null}
                  </div>
                  <DeleteItemButton item={item} />
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                  <div className="flex h-8 flex-row items-center rounded-md border border-border">
                    <EditItemQuantityButton item={item} type="minus" />
                    <p className="w-8 text-center text-sm">{item.quantity}</p>
                    <EditItemQuantityButton item={item} type="plus" />
                  </div>

                  <div>
                    {unitPricing.mode === 'single' && (
                      <Price amount={unitPricing.price} className="text-base font-bold" />
                    )}
                    {unitPricing.mode === 'range' && (
                      <Price
                        className="text-base font-bold"
                        highestAmount={unitPricing.highestPrice}
                        lowestAmount={unitPricing.lowestPrice}
                      />
                    )}
                    {unitPricing.mode === 'unavailable' && (
                      <span className="text-sm text-muted-foreground">Price on request</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <aside className="w-full shrink-0 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:w-80">
        <h2 className="mb-4 text-lg font-semibold">Summary</h2>
        {typeof cart.subtotal === 'number' ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <p>Products</p>
              <Price amount={cart.subtotal} className="text-foreground" />
            </div>
            <div className="flex items-center justify-between">
              <p>Shipping</p>
              {shippingCharge > 0 ? (
                <Price amount={shippingCharge} className="text-foreground" />
              ) : (
                <span className="font-semibold text-foreground">Free</span>
              )}
            </div>
            {typeof grandTotal === 'number' ? (
              <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
                <p>Total</p>
                <Price amount={grandTotal} />
              </div>
            ) : null}
          </div>
        ) : null}

        <Button asChild className="mt-5 w-full">
          <Link href="/checkout">Checkout</Link>
        </Button>
      </aside>
    </div>
  )
}

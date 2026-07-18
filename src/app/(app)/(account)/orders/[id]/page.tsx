import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { getRequestUser } from '@/utilities/getRequestUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { ProductItem } from '@/components/ProductItem'
import configPromise from '@payload-config'
import { orderLineProductPopulate } from '@/utilities/fetchListingProducts'
import { getPayload } from 'payload'
import { AddressItem } from '@/components/addresses/AddressItem'
import { ReviewButton } from '@/components/review/ReviewButton'
import { OrderStatus } from '@/components/OrderStatus'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; accessToken?: string }>
}

export default async function Order({ params, searchParams }: PageProps) {
  const user = await getRequestUser()
  const payload = await getPayload({ config: configPromise })

  const { id } = await params
  const { email = '', accessToken = '' } = await searchParams

  let order: Order | null = null

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      user,
      overrideAccess: !Boolean(user),
      depth: 3,
      populate: orderLineProductPopulate,
      where: {
        and: [
          {
            id: {
              equals: id,
            },
          },
          ...(user
            ? [
                {
                  customer: {
                    equals: user.id,
                  },
                },
              ]
            : [
                {
                  accessToken: {
                    equals: accessToken,
                  },
                },
                ...(email
                  ? [
                      {
                        customerEmail: {
                          equals: email,
                        },
                      },
                    ]
                  : []),
              ]),
        ],
      },
      select: {
        amount: true,
        currency: true,
        items: true,
        customerEmail: true,
        customer: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        shippingAddress: true,
        shippingCharge: true,
      },
    })

    const canAccessAsGuest =
      !user &&
      email &&
      accessToken &&
      orderResult &&
      orderResult.customerEmail &&
      orderResult.customerEmail === email
    const canAccessAsUser =
      user &&
      orderResult &&
      orderResult.customer &&
      (typeof orderResult.customer === 'object'
        ? orderResult.customer.id
        : orderResult.customer) === user.id

    if (orderResult && (canAccessAsGuest || canAccessAsUser)) {
      order = orderResult
    }
  } catch (error) {
    console.error(error)
  }

  if (!order) {
    notFound()
  }

  // Only allow reviews after successful delivery (completed), not while processing
  const canReview = Boolean(user?.id) && order.status === 'completed'


  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {user ? (
          <div className="flex gap-4">
            <Button asChild variant="ghost">
              <Link href="/orders">
                <ChevronLeftIcon />
                All orders
              </Link>
            </Button>
          </div>
        ) : (
          <div></div>
        )}

        <h1 className="rounded-md bg-muted px-3 py-1 text-sm text-foreground">
          <span>{`Order #${order.id}`}</span>
        </h1>
      </div>

      <div className="flex flex-col gap-10 rounded-lg border border-border bg-card p-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Order Date</p>
            <p className="text-lg">
              <time dateTime={order.createdAt}>
                {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
              </time>
            </p>
          </div>

          <div>
            <p className="mb-1 text-sm text-muted-foreground">Payment</p>
            {typeof order.amount === 'number' && (() => {
              const shippingCharge =
                typeof order.shippingCharge === 'number' ? order.shippingCharge : 0
              const productTotal = Math.max(0, order.amount - shippingCharge)
              return (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-16">Products</span>
                    <Price className="text-sm" amount={productTotal} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-16">Shipping</span>
                    {shippingCharge > 0 ? (
                      <Price className="text-sm" amount={shippingCharge} />
                    ) : (
                      <span className="text-sm font-semibold">Free</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 border-t border-border pt-1 mt-1">
                    <span className="text-sm font-semibold w-16">Total</span>
                    <Price className="text-lg font-semibold" amount={order.amount} />
                  </div>
                </div>
              )
            })()}
          </div>

          {order.status && (
            <div className="grow max-w-1/3">
              <p className="mb-1 text-sm text-muted-foreground">Status</p>
              <OrderStatus className="text-sm" status={order.status} />
            </div>
          )}
        </div>

        {order.items && (
          <div>
            <h2 className="mb-4 text-sm text-muted-foreground">Items</h2>
            <ul className="flex flex-col gap-6">
              {order.items?.map((item, index) => {
                if (typeof item.product === 'string') {
                  return null
                }

                if (!item.product || typeof item.product !== 'object') {
                  return <div key={index}>This item is no longer available.</div>
                }

                const variant =
                  item.variant && typeof item.variant === 'object' ? item.variant : undefined

                return (
                  <li key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4 last:border-0 last:pb-0">
                    <div className="grow">
                      <ProductItem
                        product={item.product}
                        quantity={item.quantity}
                        variant={variant}
                      />
                    </div>
                    {canReview && (
                      <div className="shrink-0 self-start sm:self-center">
                        <ReviewButton
                          productId={item.product.id}
                          productTitle={item.product.title}
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {order.shippingAddress && (
          <div>
            <h2 className="mb-4 text-sm text-muted-foreground">Shipping Address</h2>

            <AddressItem address={order.shippingAddress} hideActions />
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    description: `Order details for order ${id}.`,
    openGraph: mergeOpenGraph({
      title: `Order ${id}`,
      url: `/orders/${id}`,
    }),
    title: `Order ${id}`,
  }
}

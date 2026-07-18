import { OrderStatus } from '@/components/OrderStatus'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Order } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { getProductLineItemImage } from '@/utilities/productLineItemImage'
import type { ReactNode } from 'react'

type Props = {
  order: Order
  /** Extra actions (e.g. Reorder) shown next to View Order. */
  actions?: ReactNode
}

export const OrderItem: React.FC<Props> = ({ order, actions }) => {
  const itemsLabel = order.items?.length === 1 ? 'Item' : 'Items'

  return (
    <div className="flex flex-col gap-10 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {order.items?.map((item, index) => {
            const product = item.product
            const variant = item.variant
            if (!product || typeof product === 'string') return null
            const image = getProductLineItemImage(product, variant)

            return (
              <div key={item.id || index} className="flex items-center gap-3">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-border bg-muted">
                  {image ? (
                    <Media
                      className="h-full w-full"
                      fill
                      imgClassName="object-cover"
                      resource={image}
                    />
                  ) : null}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{product.title}</span>
                  {variant && typeof variant === 'object' && (
                    <span className="text-xs text-muted-foreground">
                      {variant.options
                        ?.map((option) => (typeof option === 'object' ? option.label : null))
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  )}
                  {item.quantity && item.quantity > 1 ? (
                    <span className="text-xs text-muted-foreground">Qty {item.quantity}</span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-center">
          <p className="text-xl">
            <time dateTime={order.createdAt}>
              {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
            </time>
          </p>

          {order.status && <OrderStatus status={order.status} />}
        </div>

        <p className="flex gap-2 text-xs text-muted-foreground">
          <span>
            {order.items?.length} {itemsLabel}
          </span>
          {order.amount && (
            <>
              <span>•</span>
              <Price as="span" amount={order.amount} currencyCode={order.currency ?? undefined} />
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        {actions}
        <Button variant="outline" asChild>
          <Link href={`/orders/${order.id}`}>View Order</Link>
        </Button>
      </div>
    </div>
  )
}

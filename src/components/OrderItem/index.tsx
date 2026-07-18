import { OrderStatus } from '@/components/OrderStatus'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Order } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { getProductLineItemImage } from '@/utilities/productLineItemImage'

type Props = {
  order: Order
}

export const OrderItem: React.FC<Props> = ({ order }) => {
  const itemsLabel = order.items?.length === 1 ? 'Item' : 'Items'

  return (
    <div className="flex flex-col gap-10 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-5">
      <div className="flex flex-col gap-4">
        {/* Products List */}
        <div className="flex flex-col gap-3">
          {order.items?.map((item, index) => {
            const product = item.product
            const variant = item.variant
            if (!product || typeof product === 'string') return null
            const image = getProductLineItemImage(product, variant)
            
            return (
              <div key={item.id || index} className="flex items-center gap-3">
                <div className="relative h-12 w-12 flex-shrink-0 rounded border border-border bg-muted overflow-hidden">
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
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-6">
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

      <Button variant="outline" asChild className="self-start sm:self-auto">
        <Link href={`/orders/${order.id}`}>View Order</Link>
      </Button>
    </div>
  )
}

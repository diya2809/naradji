import { Media } from '@/components/Media'
import { ReorderButton } from '@/components/ReorderButton'
import type { Order } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { getProductLineItemImage } from '@/utilities/productLineItemImage'

type Props = {
  order: Order
  item: NonNullable<Order['items']>[number]
}

export function ReorderProductCard({ order, item }: Props) {
  const product = item.product
  if (!product || typeof product === 'string') return null

  const variant = item.variant
  const image = getProductLineItemImage(product, variant)
  const variantLabel =
    variant && typeof variant === 'object'
      ? variant.options
          ?.map((option) => (typeof option === 'object' ? option.label : null))
          .filter(Boolean)
          .join(', ')
      : null

  return (
    <article className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {image ? (
          <Media className="h-full w-full" fill imgClassName="object-cover" resource={image} />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-medium text-foreground">{product.title}</h2>
        {variantLabel ? (
          <p className="truncate text-xs text-muted-foreground">{variantLabel}</p>
        ) : null}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {item.quantity && item.quantity > 1 ? `Qty ${item.quantity} · ` : null}
          <time dateTime={order.createdAt}>
            {formatDateTime({ date: order.createdAt, format: 'MMM dd, yyyy' })}
          </time>
        </p>
      </div>

      <ReorderButton product={product} variant={variant} quantity={item.quantity} />
    </article>
  )
}

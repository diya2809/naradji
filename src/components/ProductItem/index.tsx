import { Media } from '@/components/Media'
import { ProductPriceDisplay } from '@/components/ProductPriceDisplay'
import { Product, Variant } from '@/payload-types'
import { getLineItemPricing, scaleLineItemPricing } from '@/utilities/productPricing'
import { getProductLineItemImage } from '@/utilities/productLineItemImage'
import Link from 'next/link'

type Props = {
  product: Product
  style?: 'compact' | 'default'
  variant?: Variant
  quantity?: number
}

export const ProductItem: React.FC<Props> = ({ product, quantity, variant }) => {
  const { title } = product
  const image = getProductLineItemImage(product, variant)

  const linePricing = scaleLineItemPricing(
    getLineItemPricing(product, variant),
    quantity && quantity > 0 ? quantity : 1,
  )

  const itemURL = `/products/${product.slug}${variant ? `?variant=${variant.id}` : ''}`

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-border bg-card p-2">
        <div className="relative h-full w-full">
          {image ? (
            <Media
              className="h-full w-full"
              fill
              imgClassName="rounded-md object-cover"
              resource={image}
            />
          ) : null}
        </div>
      </div>
      <div className="flex grow items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-base font-medium">
            <Link href={itemURL}>{title}</Link>
          </p>
          {variant && (
            <p className="text-sm text-muted-foreground">
              {variant.options
                ?.map((option) => {
                  if (typeof option === 'object') return option.label
                  return null
                })
                .join(', ')}
            </p>
          )}
          <div className="text-sm text-muted-foreground">
            {'x'}
            {quantity}
          </div>
        </div>

        {quantity ? (
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">Subtotal</p>
            <ProductPriceDisplay
              pricing={linePricing}
              priceClassName="text-sm font-semibold text-foreground"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

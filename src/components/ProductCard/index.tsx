'use client'

import type { Media, Product } from '@/payload-types'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useCartDrawer } from '@/components/Cart'
import { toast } from 'sonner'
import { Media as MediaComponent } from '@/components/Media'
import { ProductPriceDisplay } from '@/components/ProductPriceDisplay'
import { getProductListingPrice } from '@/utilities/productPricing'
import { cn } from '@/utilities/cn'

export type ProductCardProps = {
  product: Partial<Product>
  className?: string
  imagePriority?: boolean
}

const extractText = (value: unknown): string => {
  if (!value || typeof value !== 'object') return ''

  const node = value as { text?: string; children?: unknown[]; root?: unknown }

  if (typeof node.text === 'string') return node.text
  if (Array.isArray(node.children))
    return node.children
      .map((child) => extractText(child))
      .join(' ')
      .trim()
  if (node.root) return extractText(node.root)

  return ''
}

const getCardImage = (product: Partial<Product>): Media | false => {
  const galleryImage = product.gallery?.[0]?.image
  if (galleryImage && typeof galleryImage !== 'string') return galleryImage

  const metaImage = product.meta?.image
  if (metaImage && typeof metaImage !== 'string') return metaImage

  return false
}

/** Canonical storefront product listing — use everywhere products are listed. */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  imagePriority = false,
}) => {
  const { description, slug, title } = product
  const pricing = getProductListingPrice(product)
  const image = getCardImage(product)
  const descriptionPreview = extractText(description).replace(/\s+/g, ' ').trim()

  const router = useRouter()
  const { addItem, isLoading } = useCart()
  const { openCart } = useCartDrawer()

  if (!slug) return null

  const handleCardClick = () => {
    router.push(`/products/${slug}`)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (product.enableVariants) {
      router.push(`/products/${slug}`)
      return
    }

    if (!product.id) return

    addItem({
      product: product.id,
    }).then(() => {
      openCart()
      toast.success('Item added to cart.')
    }).catch((err) => {
      console.error('Failed to add item to cart:', err)
      toast.error('Could not add item to cart.')
    })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      className={cn('group block h-full w-full cursor-pointer outline-none text-left', className)}
    >
      <div className="flex h-full flex-col">
        {image ? (
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/30 sm:aspect-square">
            <div className="relative size-full">
              <MediaComponent
                className="relative size-full"
                fill
                imgClassName="object-cover"
                priority={imagePriority}
                resource={image}
                size="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 224px"
              />
            </div>
            {/* Add to Cart button — hover slide up on desktop, hidden on mobile */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleAddToCart}
              className="absolute bottom-0 left-0 right-0 h-10 md:h-11 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-[0.15em] hidden md:flex items-center justify-center transition-all duration-300 ease-in-out z-30 hover:bg-primary/90 disabled:opacity-50 md:translate-y-full md:opacity-0 md:pointer-events-none md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
            >
              {product.enableVariants ? 'Select options' : 'Add to cart'}
            </button>
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-1 pt-2">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{title}</p>
          {descriptionPreview ? (
            <p className="line-clamp-1 hidden text-xs leading-snug text-muted-foreground sm:block">
              {descriptionPreview}
            </p>
          ) : null}
          <div className="mt-auto pt-0.5">
            <ProductPriceDisplay
              pricing={pricing}
              priceClassName="text-base font-bold text-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

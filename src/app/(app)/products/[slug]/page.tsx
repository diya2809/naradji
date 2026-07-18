import type { Media, Product } from '@/payload-types'

import configPromise from '@payload-config'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { MaxWidthWrapper } from '@/components/MaxWidthWrapper'
import { ProductCard } from '@/components/ProductCard'
import { Gallery } from '@/components/product/Gallery'
import { ProductDescription } from '@/components/product/ProductDescription'
import { getProductReviewsData } from '@/components/review/getProductReviewsData'
import { Button } from '@/components/ui/button'
import { getProductListingPrice } from '@/utilities/productPricing'
import { queryProductBySlug } from '@/utilities/queryProductBySlug'
import { ChevronLeftIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import { getTwitterImageUrls, resolveSocialImage } from '@/utilities/resolveSocialImage'
import { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React, { Suspense } from 'react'

export const revalidate = 3600

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const products = await payload.find({
    collection: 'products',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return products.docs.map(({ slug }) => ({ slug }))
}

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery = product.gallery?.filter((item) => typeof item.image === 'object') || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const canIndex = product._status === 'published'

  const galleryImage = gallery.length && typeof gallery[0]?.image === 'object' ? gallery[0].image : undefined
  const seoImage = metaImage ?? galleryImage
  const title = product.meta?.title || product.title
  const description = product.meta?.description || ''
  const images = resolveSocialImage(seoImage && 'url' in seoImage ? seoImage : null)

  return {
    description,
    openGraph: mergeOpenGraph({
      description: description || undefined,
      images,
      title,
      url: `${getServerSideURL()}/products/${slug}`,
    }),
    robots: {
      follow: canIndex,
      googleBot: {
        follow: canIndex,
        index: canIndex,
      },
      index: canIndex,
    },
    title,
    twitter: {
      card: 'summary_large_image',
      description: description || undefined,
      images: getTwitterImageUrls(images),
      title,
    },
  }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery =
    product.gallery
      ?.filter((item) => typeof item.image === 'object')
      .map((item) => ({
        ...item,
        image: item.image as Media,
      })) || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const hasStock = product.enableVariants
    ? product?.variants?.docs?.some((variant) => {
        if (typeof variant !== 'object') return false
        return variant.inventory && variant?.inventory > 0
      })
    : (product.inventory ?? 0) > 0

  const listingPrice = getProductListingPrice(product)
  const schemaPrice =
    listingPrice.mode === 'single'
      ? listingPrice.price
      : listingPrice.mode === 'range'
        ? listingPrice.lowestPrice
        : undefined

  const productJsonLd = {
    name: product.title,
    '@context': 'https://schema.org',
    '@type': 'Product',
    description: product.description,
    image: metaImage?.url,
    offers: {
      '@type': 'AggregateOffer',
      availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      price: schemaPrice,
      priceCurrency: 'INR',
    },
  }

  const relatedProducts =
    product.relatedProducts?.filter((relatedProduct): relatedProduct is Product => {
      return typeof relatedProduct === 'object'
    }) ?? []

  // Only products with approved reviews get a Review control (placed under size chart).
  const reviews = await getProductReviewsData(product.id)

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
        type="application/ld+json"
      />
      <MaxWidthWrapper className="mt-2 md:mt-4 mb-10">
        <div className="mb-4">
          <Button asChild variant="ghost">
            <Link href="/shop">
              <ChevronLeftIcon />
              All products
            </Link>
          </Button>
        </div>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="h-full w-full">
            <Suspense
              fallback={
                <div className="relative aspect-square h-full w-full overflow-hidden" />
              }
            >
              {Boolean(gallery?.length) && <Gallery gallery={gallery} />}
            </Suspense>
          </div>

          <div>
            <Suspense fallback={<Skeleton className="h-40 rounded-lg" />}>
              <ProductDescription product={product} reviews={reviews} />
            </Suspense>
          </div>
        </div>
      </MaxWidthWrapper>

      {product.layout?.length ? <RenderBlocks blocks={product.layout} /> : null}

      {relatedProducts.length ? (
        <div className="container">
          <RelatedProducts products={relatedProducts} />
        </div>
      ) : null}
    </>
  )
}

function RelatedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null

  return (
    <div className="py-12">
      <h2 className="mb-4 text-3xl font-semibold">Related Products</h2>
      <ul className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <li className="w-full" key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  )
}

'use client'

import type { CategoryListItem } from '@/types/storefront'
import type { Product } from '@/payload-types'

import { Grid } from '@/components/Grid'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

type Props = {
  categories: CategoryListItem[]
  products: Product[]
}

export function ShopCatalog({ categories, products }: Props) {
  const searchParams = useSearchParams()
  const searchValue = searchParams.get('q')?.trim() ?? ''
  const category = searchParams.get('category') ?? undefined
  const sort = searchParams.get('sort') ?? undefined

  const filteredProducts = useMemo(() => {
    let next = products

    if (category) {
      next = next.filter((product) =>
        product.categories?.some((entry) => {
          const id = typeof entry === 'object' ? String(entry.id) : String(entry)
          return id === category
        }),
      )
    }

    if (searchValue) {
      const query = searchValue.toLowerCase()
      next = next.filter((product) => {
        const title = product.title?.toLowerCase() ?? ''
        return title.includes(query)
      })
    }

    if (sort) {
      next = [...next].toSorted((left, right) => {
        if (sort === 'title') {
          return left.title.localeCompare(right.title)
        }

        if (sort === '-title') {
          return right.title.localeCompare(left.title)
        }

        return 0
      })
    }

    return next
  }, [category, products, searchValue, sort])

  const resultsText = filteredProducts.length === 1 ? 'result' : 'results'

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild variant={!category ? 'default' : 'outline'} size="sm">
          <Link href="/shop">All Categories</Link>
        </Button>
        {categories.map((entry) => (
          <Button
            asChild
            key={entry.id}
            variant={category === String(entry.id) ? 'default' : 'outline'}
            size="sm"
          >
            <Link href={`/shop?category=${entry.id}`}>{entry.title}</Link>
          </Button>
        ))}
      </div>

      {searchValue ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {filteredProducts.length === 0
            ? 'There are no products that match '
            : `Showing ${filteredProducts.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {!searchValue && filteredProducts.length === 0 && (
        <p className="mb-4 text-muted-foreground">Nothing here. Try different filters.</p>
      )}

      {filteredProducts.length > 0 ? (
        <Grid className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Grid>
      ) : null}
    </>
  )
}

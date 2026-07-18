import { ShopCatalog } from '@/app/(app)/shop/ShopCatalog'
import { getCategories } from '@/utilities/fetchCategories'
import { getShopProducts } from '@/utilities/fetchShopProducts'
import React, { Suspense } from 'react'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Shop',
}

export const revalidate = 3600

export default async function ShopPage() {
  const [categories, products] = await Promise.all([getCategories(), getShopProducts()])

  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Shop</h1>
      </div>

      <Suspense fallback={<p className="text-muted-foreground">Loading products...</p>}>
        <ShopCatalog categories={categories} products={products} />
      </Suspense>
    </div>
  )
}

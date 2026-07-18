import { getCategories } from '@/utilities/fetchCategories'
import React, { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

import { Item } from './Item'

async function List() {
  const categoryDocs = await getCategories()

  const categories = categoryDocs.map((category) => ({
    href: `/shop/${category.slug}`,
    title: category.title,
  }))

  return (
    <React.Fragment>
      <nav>
        <ul className="flex gap-3">
          <Item title="All" href="/shop" />
          <Suspense fallback={null}>
            {categories.map((category) => (
              <Item {...category} key={category.href} />
            ))}
          </Suspense>
        </ul>
      </nav>
    </React.Fragment>
  )
}

export function CategoryTabs() {
  return (
    <Suspense
      fallback={
        <div className="col-span-2 hidden w-full flex-none py-4 lg:block">
          {Array(10).fill(0).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-4 w-5/6" />
          ))}
        </div>
      }
    >
      <List />
    </Suspense>
  )
}

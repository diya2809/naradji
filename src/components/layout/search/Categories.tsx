import { getCategories } from '@/utilities/fetchCategories'
import React, { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

import { FilterList } from './filter'
import { CategoryItem } from './Categories.client'

async function CategoryList() {
  const categories = await getCategories()

  return (
    <div>
      <h3 className="mb-2 text-xs text-muted-foreground">Category</h3>

      <ul>
        {categories.map((category) => {
          return (
            <li key={category.id}>
              <CategoryItem category={category} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Categories() {
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
      <CategoryList />
    </Suspense>
  )
}

'use client'
import React, { useCallback, useMemo } from 'react'

import type { CategoryListItem } from '@/types/storefront'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Props = {
  category: CategoryListItem
}

export const CategoryItem: React.FC<Props> = ({ category }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = useMemo(() => {
    return searchParams.get('category') === String(category.id)
  }, [category.id, searchParams])

  const setQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (isActive) {
      params.delete('category')
    } else {
      params.set('category', String(category.id))
    }

    const newParams = params.toString()

    router.push(pathname + '?' + newParams)
  }, [category.id, isActive, pathname, router, searchParams])

  return (
    <Button
      onClick={() => setQuery()}
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      className="justify-start"
    >
      {category.title}
    </Button>
  )
}

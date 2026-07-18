'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { ListItem } from '.'

export function FilterItemDropdown({ list }: { list: ListItem[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeValue = useMemo(() => {
    const activePath = list.find((item) => 'path' in item && pathname === item.path)
    if (activePath && 'path' in activePath) return `path:${activePath.path}`

    const sort = searchParams.get('sort')
    const activeSort = list.find((item) => 'slug' in item && sort === item.slug)
    if (activeSort && 'slug' in activeSort) return `sort:${activeSort.slug}`

    const first = list[0]
    if (!first) return ''
    return 'path' in first ? `path:${first.path}` : `sort:${first.slug}`
  }, [list, pathname, searchParams])

  const onValueChange = (value: string) => {
    if (value.startsWith('path:')) {
      const path = value.replace('path:', '')
      const params = new URLSearchParams(searchParams.toString())
      params.delete('q')
      params.delete('sort')
      router.push(`${path}${params.toString() ? `?${params.toString()}` : ''}`)
      return
    }

    if (value.startsWith('sort:')) {
      const slug = value.replace('sort:', '')
      const params = new URLSearchParams(searchParams.toString())
      if (slug) params.set('sort', slug)
      router.push(`${pathname}?${params.toString()}`)
    }
  }

  return (
    <Select onValueChange={onValueChange} value={activeValue}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        {list.map((item: ListItem, i) => {
          const value = 'path' in item ? `path:${item.path}` : `sort:${item.slug}`
          return (
            <SelectItem key={i} value={value}>
              {item.title}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

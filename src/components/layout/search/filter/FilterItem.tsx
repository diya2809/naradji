'use client'

import type { SortFilterItem as SortFilterItemType } from '@/lib/constants'

import { createUrl } from '@/utilities/createUrl'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

import type { ListItem } from '.'
import type { PathFilterItem as PathFilterItemType } from '.'

function PathFilterItem({ item }: { item: PathFilterItemType }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = pathname === item.path
  const newParams = new URLSearchParams(searchParams.toString())

  newParams.delete('q')

  return (
    <li className="flex text-foreground" key={item.title}>
      {active ? (
        <Button className="w-full justify-start" variant="secondary">
          {item.title}
        </Button>
      ) : (
        <Button asChild className="w-full justify-start" variant="ghost">
          <Link href={createUrl(item.path, newParams)}>{item.title}</Link>
        </Button>
      )}
    </li>
  )
}

function SortFilterItem({ item }: { item: SortFilterItemType }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('sort') === item.slug
  const q = searchParams.get('q')
  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(q && { q }),
      ...(item.slug && item.slug.length && { sort: item.slug }),
    }),
  )
  return (
    <li className="flex text-sm text-foreground" key={item.title}>
      {active ? (
        <Button className="w-full justify-start" variant="secondary">
          {item.title}
        </Button>
      ) : (
        <Button asChild className="w-full justify-start" variant="ghost">
          <Link href={href} prefetch={false}>
            {item.title}
          </Link>
        </Button>
      )}
    </li>
  )
}

export function FilterItem({ item }: { item: ListItem }) {
  return 'path' in item ? <PathFilterItem item={item} /> : <SortFilterItem item={item} />
}

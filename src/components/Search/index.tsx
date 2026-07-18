'use client'

import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { CircleUserRoundIcon, SearchIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'

type Props = {
  className?: string
}

export const Search: React.FC<Props> = ({ className }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const isLoggedIn = Boolean(user?.id)
  const accountHref = isLoggedIn
    ? '/account'
    : pathname.startsWith('/login') || pathname.startsWith('/create-account')
      ? '/login'
      : `/login?redirect=${encodeURIComponent(pathname)}`

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const val = e.target as HTMLFormElement
    const search = val.search as HTMLInputElement
    const newParams = new URLSearchParams(searchParams.toString())

    if (search.value) {
      newParams.set('q', search.value)
    } else {
      newParams.delete('q')
    }

    router.push(createUrl('/shop', newParams))
  }

  return (
    <div className={cn('flex w-full items-center gap-2', className)}>
      <form className="relative min-w-0 flex-1" onSubmit={onSubmit}>
        <Input
          autoComplete="off"
          className="w-full pr-10"
          defaultValue={searchParams?.get('q') || ''}
          key={searchParams?.get('q')}
          name="search"
          placeholder="Search for products..."
          type="text"
        />
        <div className="absolute right-0 top-0 mr-3 flex h-full items-center">
          <SearchIcon className="h-4 text-muted-foreground" />
        </div>
      </form>

      <Button
        asChild
        aria-label="Account"
        className="size-11 shrink-0 md:size-9"
        size="icon"
        variant="outline"
      >
        <Link href={accountHref}>
          <CircleUserRoundIcon className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  )
}

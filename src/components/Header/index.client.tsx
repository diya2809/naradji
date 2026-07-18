'use client'
import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { Button } from '@/components/ui/button'
import { CircleUserRoundIcon, SearchIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { Suspense } from 'react'
import { useAuth } from '@/providers/Auth'

import { Logo } from '@/components/Logo/Logo'
import { siteLayoutVars } from '@/utilities/siteLayout'

import type { CategoryListItem } from '@/types/storefront'
import type { Header } from '@/payload-types'

type Props = {
  categories: CategoryListItem[]
  header: Header
}

export function HeaderClient({ categories, header }: Props) {
  const pathname = usePathname()
  const menu = header.navItems || []
  const { user: authUser } = useAuth()
  const isLoggedIn = Boolean(authUser?.id)
  const accountHref = isLoggedIn
    ? '/account'
    : pathname.startsWith('/login') || pathname.startsWith('/create-account')
      ? '/login'
      : `/login?redirect=${encodeURIComponent(pathname)}`

  return (
    <div className="fixed inset-x-0 top-0 z-40 bg-background">
      <div className="bg-background">
        <nav
          className="container relative flex items-center justify-between md:justify-start"
          style={{ height: siteLayoutVars.headerNavHeight }}
        >
          <Link
            aria-label="Naradji home"
            className="flex flex-initial max-w-[45%] items-center justify-start md:max-w-none"
            href="/"
          >
            <Logo className="h-10 md:h-12 w-auto max-w-full object-contain" />
          </Link>

          {menu.length ? (
            <ul className="ml-8 hidden items-center gap-2 text-sm md:flex">
              {menu.map((item) => (
                <li key={item.id ?? item.link.url ?? item.link.label}>
                  <CMSLink {...item.link} appearance="ghost" size="sm" />
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-1 items-center gap-1 justify-end md:ml-auto md:flex-initial">
            <Button
              asChild
              aria-label="Search products"
              className="hidden size-9 md:inline-flex"
              size="icon"
              variant="ghost"
            >
              <Link href="/shop">
                <SearchIcon className="h-5 w-5" />
              </Link>
            </Button>

            <Button asChild aria-label="Account" className="hidden md:inline-flex" size="icon" variant="ghost">
              <Link href={accountHref}>
                <CircleUserRoundIcon className="h-5 w-5" />
              </Link>
            </Button>

            <Suspense fallback={<OpenCartButton className="hidden md:inline-flex" />}>
              <Cart categories={categories} />
            </Suspense>
          </div>
        </nav>
      </div>
    </div>
  )
}

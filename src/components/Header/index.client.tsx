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

import { MobileMenu } from './MobileMenu'
import { useHeaderAnnouncementScroll } from './useHeaderAnnouncementScroll'
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
  const announcement = (header as Header & {
    announcement?: { enabled?: boolean; link?: string | null; text?: string | null }
  }).announcement
  const announcementText = announcement?.text?.trim() ?? ''
  const announcementLink = announcement?.link?.trim() ?? ''
  const showAnnouncement = announcement?.enabled !== false && Boolean(announcementText)

  useHeaderAnnouncementScroll(showAnnouncement)

  return (
    <div className="fixed inset-x-0 top-0 z-40 bg-background">
      {showAnnouncement ? (
        <div
          className="overflow-hidden transition-[height] duration-300 ease-out"
          id="site-announcement-bar"
          style={{ height: siteLayoutVars.announcementDisplayHeight }}
        >
          <div
            className="flex items-center justify-center bg-primary/15 px-4 text-center text-sm font-semibold text-primary"
            style={{ height: siteLayoutVars.headerAnnouncementHeight }}
          >
            {announcementLink ? (
              <Link className="hover:underline" href={announcementLink}>
                {announcementText}
              </Link>
            ) : (
              <p>{announcementText}</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="bg-background">
        <nav
          className="container relative flex items-center justify-between md:justify-start"
          style={{ height: siteLayoutVars.headerNavHeight }}
        >
          <div className="flex flex-1 items-center md:hidden justify-start">
            <Suspense fallback={null}>
              <MobileMenu menu={menu} topOffset={siteLayoutVars.headerOffset} />
            </Suspense>
          </div>

          <Link
            aria-label="Naradji home"
            className="flex flex-initial max-w-[45%] items-center justify-center md:static md:max-w-none md:translate-x-0 md:ml-0"
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
              className="size-11 md:size-9"
              size="icon"
              variant="ghost"
            >
              <Link href="/shop">
                <SearchIcon className="h-5 w-5" />
              </Link>
            </Button>

            <Button asChild aria-label="Account" className="hidden md:inline-flex" size="icon" variant="ghost">
              <Link href={isLoggedIn ? '/account' : pathname.startsWith('/login') || pathname.startsWith('/create-account') ? '/login' : `/login?redirect=${encodeURIComponent(pathname)}`}>
                <CircleUserRoundIcon className="h-5 w-5" />
              </Link>
            </Button>

            <Suspense fallback={<OpenCartButton />}>
              <Cart categories={categories} />
            </Suspense>
          </div>
        </nav>
      </div>
    </div>
  )
}

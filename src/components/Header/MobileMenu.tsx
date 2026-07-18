'use client'

import type { Header } from '@/payload-types'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/providers/Auth'
import {
  CircleUserRoundIcon,
  InstagramIcon,
  MenuIcon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface Props {
  menu: Header['navItems']
  topOffset: string
}

export function MobileMenu({ menu, topOffset }: Props) {
  const { user } = useAuth()
  const menuTopOffset = topOffset

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  const resolveHref = (item: NonNullable<Header['navItems']>[number]['link']) => {
    if (
      item.type === 'reference' &&
      item.reference &&
      typeof item.reference.value === 'object' &&
      'slug' in item.reference.value
    ) {
      const relationPrefix = item.reference.relationTo !== 'pages' ? `/${item.reference.relationTo}` : ''
      return `${relationPrefix}/${item.reference.value.slug}`
    }

    return item.url || '#'
  }

  const hasSubOptions = (item: NonNullable<Header['navItems']>[number]) => {
    const candidate = item as { subItems?: unknown[] }
    return Array.isArray(candidate.subItems) && candidate.subItems.length > 0
  }

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <Button
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          size="icon"
          variant="ghost"
        >
          {isOpen ? <XIcon data-icon="inline-start" /> : <MenuIcon data-icon="inline-start" />}
        </Button>
      </SheetTrigger>

      <SheetContent
        overlayStyle={{ top: menuTopOffset, bottom: 0 }}
        showCloseButton={false}
        side="left"
        style={{ top: menuTopOffset, bottom: 0, height: `calc(100% - ${menuTopOffset})` }}
      >
        <SheetTitle className="sr-only">Mobile navigation menu</SheetTitle>
        <SheetDescription className="sr-only">
          Browse site links and account actions.
        </SheetDescription>
        <div className="flex h-full flex-col">
          <nav className="flex-1 overflow-y-auto py-2">
            {menu?.length ? (
              <ul className="flex w-full flex-col">
                {menu.map((item) => (
                  <li key={item.id}>
                    <Button asChild className="w-full justify-between" size="lg" variant="ghost">
                      <Link href={resolveHref(item.link)}>
                        <span>{item.link.label}</span>
                        {hasSubOptions(item) ? (
                          <span aria-hidden className="text-2xl text-muted-foreground">
                            →
                          </span>
                        ) : null}
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </nav>

          <div className="min-h-44 space-y-6 bg-muted px-6 py-8">
            {user ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">My account</p>
                <ul className="flex flex-col gap-1">
                  <li>
                    <Button asChild className="w-full justify-start" size="lg" variant="ghost">
                      <Link href="/orders">Orders</Link>
                    </Button>
                  </li>
                  <li>
                    <Button asChild className="w-full justify-start" size="lg" variant="ghost">
                      <Link href="/account/addresses">Addresses</Link>
                    </Button>
                  </li>
                  <li>
                    <Button asChild className="w-full justify-start" size="lg" variant="ghost">
                      <Link href="/account">Manage account</Link>
                    </Button>
                  </li>
                  <li>
                    <Button asChild className="w-full justify-start" size="lg" variant="outline">
                      <Link href="/logout">Log out</Link>
                    </Button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">My account</p>
                <Button asChild className="w-full justify-start" size="lg" variant="ghost">
                  <Link href={pathname.startsWith('/login') || pathname.startsWith('/create-account') ? '/login' : `/login?redirect=${encodeURIComponent(pathname)}`}>
                    <CircleUserRoundIcon data-icon="inline-start" />
                    Log in
                  </Link>
                </Button>
                <Button asChild className="w-full" variant="default">
                  <Link href={pathname.startsWith('/login') || pathname.startsWith('/create-account') ? '/create-account' : `/create-account?redirect=${encodeURIComponent(pathname)}`}>Create account</Link>
                </Button>
              </div>
            )}

            <Button asChild className="w-full justify-start" size="lg" variant="ghost">
              <Link aria-label="Follow on Instagram" href="https://instagram.com" rel="noopener noreferrer" target="_blank">
                <InstagramIcon data-icon="inline-start" />
                <span>Follow on Instagram</span>
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

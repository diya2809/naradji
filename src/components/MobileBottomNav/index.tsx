'use client'

import { useCartDrawer } from '@/components/Cart'
import { cn } from '@/utilities/cn'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Home, RefreshCw, ShoppingBag, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

const tabs = [
  { href: '/', label: 'Home', icon: Home, match: (path: string) => path === '/' },
  {
    href: '/shop',
    label: 'Shop',
    icon: ShoppingBag,
    match: (path: string) =>
      path === '/shop' || path.startsWith('/shop/') || path.startsWith('/products/'),
  },
  {
    href: '/reorder',
    label: 'Reorder',
    icon: RefreshCw,
    match: (path: string) => path === '/reorder' || path.startsWith('/reorder/'),
  },
] as const

function shouldHideBottomNav(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname.startsWith('/admin')) return true
  if (pathname.startsWith('/checkout')) return true
  return false
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { openCart } = useCartDrawer()
  const { cart } = useCart()

  const totalQuantity = useMemo(() => {
    if (!cart?.items?.length) return 0
    return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
  }, [cart])

  if (shouldHideBottomNav(pathname)) return null

  return (
    <nav
      aria-label="Mobile primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid h-[var(--site-bottom-nav-height)] grid-cols-4">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
        <li className="min-w-0">
          <button
            type="button"
            onClick={() => openCart()}
            className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
          >
            <span className="relative">
              <ShoppingCart className="size-5" strokeWidth={1.75} />
              {totalQuantity > 0 ? (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold leading-none text-primary-foreground">
                  {totalQuantity > 99 ? '99+' : totalQuantity}
                </span>
              ) : null}
            </span>
            <span>Cart</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

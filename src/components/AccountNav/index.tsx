'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utilities/cn'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  className?: string
  layout?: 'sidebar' | 'toolbar'
}

export const AccountNav: React.FC<Props> = ({ className, layout = 'sidebar' }) => {
  const pathname = usePathname()
  const accountActive = pathname === '/account'
  const addressesActive = pathname === '/account/addresses'
  const ordersActive = pathname === '/orders' || pathname.includes('/orders')
  const logoutActive = pathname === '/logout'

  const links = [
    { active: accountActive, href: '/account', label: 'Account' },
    { active: addressesActive, href: '/account/addresses', label: 'Address' },
    { active: ordersActive, href: '/orders', label: 'Orders' },
  ] as const

  const logoutLink = (
    <Link
      className={cn(
        'text-sm text-muted-foreground hover:text-foreground',
        logoutActive && 'text-foreground',
      )}
      href="/logout"
    >
      Log out
    </Link>
  )

  if (layout === 'toolbar') {
    return (
      <nav aria-label="Account" className={cn('w-full', className)}>
        <ul className="flex items-center gap-2 overflow-x-auto pb-1">
          {links.map(({ active, href, label }) => (
            <li className="shrink-0" key={href}>
              <Button asChild size="sm" variant={active ? 'secondary' : 'outline'}>
                <Link href={href}>{label}</Link>
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    )
  }

  return (
    <nav aria-label="Account" className={cn(className)}>
      <ul className="flex flex-col gap-2">
        {links.map(({ active, href, label }) => (
          <li key={href}>
            <Button
              asChild
              className="w-full justify-start"
              size="sm"
              variant={active ? 'secondary' : 'ghost'}
            >
              <Link href={href}>{label}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

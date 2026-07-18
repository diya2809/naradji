'use client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  href: string
  title: string
}

export function Item({ href, title }: Props) {
  const pathname = usePathname()
  const active = pathname === href

  return (
    <li className="flex text-sm text-foreground">
      {active ? (
        <Button variant="secondary" className="w-full justify-start">
          {title}
        </Button>
      ) : (
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href={href} prefetch={false}>
            {title}
          </Link>
        </Button>
      )}
    </li>
  )
}

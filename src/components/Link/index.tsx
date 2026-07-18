import type { Page, Product, Category } from '@/payload-types'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { getCMSLinkHref, getCMSLinkTabProps } from '@/utilities/getCMSLinkHref'
import Link from 'next/link'
import React from 'react'

type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts' | 'products' | 'categories'
    value: Page | Product | Category | string | number
  } | null
  size?: ButtonProps['size'] | null
  type?: 'custom' | 'reference' | null
  url?: string | null
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    newTab,
    reference,
    size: sizeFromProps,
    url,
  } = props

  let href = getCMSLinkHref({ type, url, reference })

  if (!href) return null

  const size = appearance === 'link' ? undefined : sizeFromProps
  const newTabProps = getCMSLinkTabProps(newTab)

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    return (
      <Link className={cn(className)} href={href} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link href={href} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    </Button>
  )
}

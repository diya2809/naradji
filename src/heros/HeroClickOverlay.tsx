import Link from 'next/link'
import React from 'react'

import type { Page } from '@/payload-types'

import { cn } from '@/utilities/cn'
import { getCMSLinkHref, getCMSLinkTabProps } from '@/utilities/getCMSLinkHref'

type HeroLink = NonNullable<Page['hero']['links']>[number]['link'] | Page['hero']['clickLink']

export function getHeroLinkLabel(link?: HeroLink | null): string | undefined {
  if (link && 'label' in link && typeof link.label === 'string' && link.label.length > 0) {
    return link.label
  }

  return undefined
}

type HeroClickOverlayProps = {
  ariaLabel?: string | null
  className?: string
  link?: HeroLink | null
}

export function getHeroClickLink(hero: Page['hero']): HeroLink | null {
  if (hero.clickLink?.type) {
    return hero.clickLink
  }

  return hero.links?.[0]?.link ?? null
}

export const HeroClickOverlay: React.FC<HeroClickOverlayProps> = ({ ariaLabel, className, link }) => {
  const href = getCMSLinkHref(link)

  if (!href) return null

  return (
    <Link
      aria-label={ariaLabel || getHeroLinkLabel(link) || 'Open hero link'}
      className={cn('absolute inset-0 z-[5] block', className)}
      href={href}
      {...getCMSLinkTabProps(link?.newTab)}
    />
  )
}

import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { ResponsiveMedia } from '@/components/Media/ResponsiveMedia'
import { RichText } from '@/components/RichText'
import { HeroClickOverlay, getHeroClickLink, getHeroLinkLabel } from '@/heros/HeroClickOverlay'
import { cn } from '@/utilities/cn'
import { getCMSLinkHref } from '@/utilities/getCMSLinkHref'
import { siteLayoutVars } from '@/utilities/siteLayout'

export const HighImpactHero: React.FC<Page['hero']> = (props) => {
  const { links, media, mobileMedia, richText } = props
  const clickLink = getHeroClickLink(props)
  const isClickable = Boolean(getCMSLinkHref(clickLink))

  return (
    <section
      className={cn(
        'relative isolate w-full overflow-hidden text-foreground',
        isClickable && 'cursor-pointer',
      )}
      data-hero-overlay
      style={{ minHeight: siteLayoutVars.heroMinHeight }}
    >
      <div aria-hidden className="absolute inset-0 z-0 select-none">
        {media && typeof media === 'object' ? (
          <ResponsiveMedia
            desktop={media}
            fill
            imgClassName="object-cover object-center"
            mobile={mobileMedia}
            priority
            size="100vw"
            videoClassName="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <HeroClickOverlay ariaLabel={getHeroLinkLabel(clickLink)} link={clickLink} />

      <div
        className="pointer-events-none relative z-10 container flex flex-col justify-end pb-12"
        style={{ minHeight: siteLayoutVars.heroMinHeight }}
      >
        <div>
          {richText ? (
            <RichText className="hero-headline mb-5 ms-0 text-left" data={richText} enableGutter={false} />
          ) : null}
          {Array.isArray(links) && links.length > 0 ? (
            <ul className="pointer-events-auto flex flex-wrap gap-3">
              {links.map(({ link }, index) => (
                <li className="w-auto" key={index}>
                  <CMSLink className="w-auto" {...link} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}

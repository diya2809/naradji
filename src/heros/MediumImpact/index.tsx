import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { ResponsiveMedia } from '@/components/Media/ResponsiveMedia'
import { RichText } from '@/components/RichText'
import { HeroClickOverlay, getHeroClickLink, getHeroLinkLabel } from '@/heros/HeroClickOverlay'
import { cn } from '@/utilities/cn'
import { getCMSLinkHref } from '@/utilities/getCMSLinkHref'

export const MediumImpactHero: React.FC<Page['hero']> = (props) => {
  const { links, media, mobileMedia, richText } = props
  const clickLink = getHeroClickLink(props)
  const isClickable = Boolean(getCMSLinkHref(clickLink))

  return (
    <>
      <div className="container mb-8 py-8">
        {richText ? <RichText className="mb-6" data={richText} enableGutter={false} /> : null}

        {Array.isArray(links) && links.length > 0 ? (
          <ul className="flex flex-wrap gap-4">
            {links.map(({ link }, index) => (
              <li key={index}>
                <CMSLink {...link} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {media && typeof media === 'object' ? (
        <div className="container pb-8">
          <div
            className={cn(
              'relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted',
              isClickable && 'cursor-pointer',
            )}
          >
            <ResponsiveMedia
              desktop={media}
              fill
              imgClassName="object-cover object-center"
              mobile={mobileMedia}
              priority
            />
            <HeroClickOverlay ariaLabel={getHeroLinkLabel(clickLink)} className="rounded-lg" link={clickLink} />
          </div>
          {media.caption ? (
            <div className="mt-3">
              <RichText data={media.caption} enableGutter={false} />
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

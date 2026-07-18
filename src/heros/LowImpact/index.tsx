import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { RichText } from '@/components/RichText'

type LowImpactHeroType = Page['hero'] & {
  children?: React.ReactNode
}

export const LowImpactHero: React.FC<LowImpactHeroType> = ({ children, links, richText }) => {
  return (
    <div className="container py-8 text-center [&_h1]:text-5xl [&_h1]:md:text-7xl">
      <div className="mx-auto max-w-3xl">
        {children || (richText ? <RichText data={richText} enableGutter={false} /> : null)}
        {Array.isArray(links) && links.length > 0 ? (
          <ul className="mt-6 flex flex-wrap justify-center gap-4">
            {links.map(({ link }, index) => (
              <li key={index}>
                <CMSLink {...link} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

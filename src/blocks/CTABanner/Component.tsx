import { GiftIcon, HeartIcon, SparklesIcon, TruckIcon } from 'lucide-react'
import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { CMSLink } from '@/components/Link'
import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import type { CTABannerBlock as CTABannerBlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'

const iconMap = {
  sparkles: SparklesIcon,
  gift: GiftIcon,
  truck: TruckIcon,
  heart: HeartIcon,
  none: null,
}

export const CTABannerBlock: React.FC<CTABannerBlockProps & { id?: string | number }> = ({
  headline,
  icon = 'sparkles',
  link,
  mobileLayout,
  subtext,
  textAlign,
  variant = 'primary',
}) => {
  const IconComponent = icon && icon !== 'none' ? iconMap[icon] : null

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign ?? 'center'}>
      <div
        className={cn(
          'flex flex-col items-center gap-4 rounded-lg px-6 py-6 text-center md:px-8',
          variant === 'primary' && 'bg-primary text-primary-foreground',
          variant === 'muted' && 'bg-muted text-foreground',
          variant === 'card' && 'bg-background text-foreground',
        )}
      >
        {IconComponent ? <IconComponent aria-hidden className="size-5" /> : null}
        <BlockSectionHeading
          className={cn(
            'text-inherit',
            variant === 'primary' && 'text-primary-foreground',
          )}
          title={headline || 'Offer'}
        />
        {subtext ? (
          <p
            className={cn(
              'max-w-2xl text-sm md:text-base',
              variant === 'primary' ? 'text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            {subtext}
          </p>
        ) : null}
        {link ? (
          <CMSLink
            {...link}
            appearance={variant === 'primary' ? 'secondary' : (link.appearance ?? 'default')}
          />
        ) : null}
      </div>
    </BlockWrapper>
  )
}

import { BlockWrapper } from '@/components/BlockWrapper'
import { RichText } from '@/components/RichText'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { BannerBlock as BannerBlockProps } from '@/payload-types'
import React from 'react'

export const BannerBlock: React.FC<
  BannerBlockProps & {
    id?: string | number
    className?: string
  }
> = ({ className, content, mobileLayout, style, textAlign }) => {
  if (style === 'emphasis') {
    return (
      <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign}>
        <div className={className}>
          <div className="rounded-lg bg-primary px-6 py-3 text-primary-foreground">
            <RichText data={content} enableGutter={false} enableProse={false} />
          </div>
        </div>
      </BlockWrapper>
    )
  }

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign}>
      <div className={className}>
        <Alert variant={style === 'error' ? 'destructive' : 'default'}>
          <AlertDescription className="[&_p:last-child]:mb-0">
            <RichText data={content} enableGutter={false} enableProse={false} />
          </AlertDescription>
        </Alert>
      </div>
    </BlockWrapper>
  )
}

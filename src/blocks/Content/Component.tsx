import { BlockWrapper } from '@/components/BlockWrapper'
import { RichText } from '@/components/RichText'
import type { ContentBlock as ContentBlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { CMSLink } from '../../components/Link'

export const ContentBlock: React.FC<
  ContentBlockProps & {
    id?: DefaultDocumentIDType
    className?: string
  }
> = (props) => {
  const { columns, mobileColumns, mobileLayout, textAlign } = props

  const colsSpanClasses = {
    full: '12',
    half: '6',
    oneThird: '4',
    twoThirds: '8',
  }

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign}>
      <div
        className={cn(
          'grid gap-x-8 gap-y-8',
          mobileColumns === '2' ? 'grid-cols-2' : 'grid-cols-1',
          'lg:grid-cols-12',
        )}
      >
          {columns &&
            columns.length > 0 &&
            columns.map((col, index) => {
              const { enableLink, link, richText, size } = col

              return (
                <div
                  className={cn(`col-span-4 lg:col-span-${colsSpanClasses[size!]}`, {
                    'md:col-span-2': size !== 'full',
                  })}
                  key={index}
                >
                  {richText && <RichText data={richText} enableGutter={false} />}

                  {enableLink && <CMSLink {...link} />}
                </div>
              )
            })}
      </div>
    </BlockWrapper>
  )
}

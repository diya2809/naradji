import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { RichText } from '@/components/RichText'
import type { TextBlock as TextBlockProps } from '@/payload-types'

export const TextBlock: React.FC<TextBlockProps & { id?: string | number }> = ({
  content,
  mobileLayout,
  textAlign,
}) => {
  return (
    <BlockWrapper mobileLayout={mobileLayout} narrow textAlign={textAlign}>
      <RichText data={content} enableGutter={false} />
    </BlockWrapper>
  )
}

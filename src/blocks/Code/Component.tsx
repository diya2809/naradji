import type { CodeBlock as CodeBlockProps } from '@/payload-types'

import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'

import { Code } from './Component.client'

export const CodeBlock: React.FC<
  CodeBlockProps & {
    id?: string | number
    className?: string
  }
> = ({ className, code, language, mobileLayout, textAlign }) => {
  return (
    <BlockWrapper mobileLayout={mobileLayout} narrow textAlign={textAlign}>
      <div className={[className, 'not-prose'].filter(Boolean).join(' ')}>
        <Code code={code} language={language ?? undefined} />
      </div>
    </BlockWrapper>
  )
}

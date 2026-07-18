'use client'

import React from 'react'

import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import { BlockWrapper } from '@/components/BlockWrapper'
import { RichText } from '@/components/RichText'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { FAQBlock as FAQBlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { getGridColumnClasses } from '@/utilities/responsiveLayout'

export const FAQBlock: React.FC<
  FAQBlockProps & {
    id?: string | number
  }
> = ({ desktopColumns, headline, id, introContent, items, mobileColumns, mobileLayout, textAlign }) => {
  const useTwoColumn = desktopColumns === '2'

  return (
    <BlockWrapper id={id ? `block-${id}` : undefined} mobileLayout={mobileLayout} textAlign={textAlign}>
      <BlockSectionHeading className="mb-6" title={headline || 'Questions, answered'} />
      {introContent ? (
          <div className="mb-8">
            <RichText data={introContent} enableGutter={false} />
          </div>
        ) : null}

        <div
          className={cn(
            useTwoColumn
              ? getGridColumnClasses(mobileColumns, desktopColumns, 'md:grid-cols-2')
              : 'grid grid-cols-1',
            useTwoColumn && 'gap-8',
          )}
        >
          <Accordion className={cn('w-full', useTwoColumn && 'md:col-span-1')} collapsible type="single">
            {items?.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent className="pt-2">
                  {item.answer ? <RichText data={item.answer} enableGutter={false} /> : null}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
    </BlockWrapper>
  )
}

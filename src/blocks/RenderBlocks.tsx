import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CarouselBlock } from '@/blocks/Carousel/Component'
import { CategoryCardsBlock } from '@/blocks/CategoryCards/Component'
import { CollectionGridBlock } from '@/blocks/CollectionGrid/Component'
import { CompetitionFlowBlock } from '@/blocks/CompetitionFlow/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { CTABannerBlock } from '@/blocks/CTABanner/Component'
import { DisciplineArchiveBlock } from '@/blocks/DisciplineArchive/Component'
import { DividerBlock } from '@/blocks/Divider/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { FeatureBlock } from '@/blocks/Feature/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { HighlightCardsBlock } from '@/blocks/HighlightCards/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { TestimonialsBlock } from '@/blocks/Testimonials/Component'
import { TextBlock } from '@/blocks/Text/Component'
import { ThreeItemGridBlock } from '@/blocks/ThreeItemGrid/Component'
import { UpcommingEventsBlock } from '@/blocks/UpcommingEvents/Component'
import { CodeBlock } from '@/blocks/Code/Component'
import { cn } from '@/utilities/cn'
import { getBlockStackGapClasses } from '@/utilities/responsiveLayout'
import { toKebabCase } from '@/utilities/toKebabCase'
import dynamic from 'next/dynamic'
import React from 'react'

import type { Page } from '@/payload-types'

import { Skeleton } from '@/components/ui/skeleton'

const DeferredBlockFallback = () => (
  <Skeleton aria-hidden className="min-h-48 rounded-lg" />
)

const InstagramReelsBlock = dynamic(
  () => import('@/blocks/InstagramReels/Component').then((mod) => mod.InstagramReelsBlock),
  { loading: DeferredBlockFallback },
)

const ReviewsBlock = dynamic(
  () => import('@/blocks/Reviews/Component').then((mod) => mod.ReviewsBlock),
  { loading: DeferredBlockFallback },
)

const VideosBlock = dynamic(
  () => import('@/blocks/Videos/Component').then((mod) => mod.VideosBlock),
  { loading: DeferredBlockFallback },
)

const AppleCardsCarouselBlockLazy = dynamic(
  () =>
    import('@/blocks/AppleCardsCarousel/Component').then((mod) => mod.AppleCardsCarouselBlock),
  { loading: DeferredBlockFallback },
)

type LayoutBlock = NonNullable<Page['layout']>[number]

function LayoutBlockRenderer({ block, blockId }: { block: LayoutBlock; blockId?: string }) {
  const id = blockId ?? block.id ?? undefined

  switch (block.blockType) {
    case 'appleCardsCarousel':
      return <AppleCardsCarouselBlockLazy {...block} id={id} />
    case 'archive':
      return <ArchiveBlock {...block} id={id} />
    case 'banner':
      return <BannerBlock {...block} id={id} />
    case 'carousel':
      return <CarouselBlock {...block} id={id} />
    case 'categoryCards':
      return <CategoryCardsBlock {...block} id={id} />
    case 'code':
      return <CodeBlock {...block} id={id} />
    case 'collectionGrid':
      return <CollectionGridBlock {...block} id={id} />
    case 'competitionFlow':
      return <CompetitionFlowBlock {...block} id={id} />
    case 'content':
      return <ContentBlock {...block} id={id} />
    case 'cta':
      return <CallToActionBlock {...block} id={id} />
    case 'ctaBanner':
      return <CTABannerBlock {...block} id={id} />
    case 'disciplineArchive':
      return <DisciplineArchiveBlock {...block} id={id} />
    case 'divider':
      return <DividerBlock {...block} id={id} />
    case 'faq':
      return <FAQBlock {...block} id={id} />
    case 'feature':
      return <FeatureBlock {...block} id={id} />
    case 'formBlock':
      return <FormBlock {...block} id={id} />
    case 'highlightCards':
      return <HighlightCardsBlock {...block} id={id} />
    case 'instagramReels':
      return <InstagramReelsBlock {...block} id={id} />
    case 'mediaBlock':
      return <MediaBlock {...block} id={id} />
    case 'reviews':
      return <ReviewsBlock {...block} id={id} />
    case 'videos':
      return <VideosBlock {...block} id={id} />
    case 'testimonials':
      return <TestimonialsBlock {...block} id={id} />
    case 'text':
      return <TextBlock {...block} id={id} />
    case 'threeItemGrid':
      return <ThreeItemGridBlock {...block} id={id} />
    case 'upcommingEvents':
      return <UpcommingEventsBlock {...block} id={id} />
    default:
      return null
  }
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <div className={cn(getBlockStackGapClasses(), 'pt-10 md:pt-12')}>
        {blocks.map((block, index) => {
          const { blockName } = block

          const blockId =
            typeof blockName === 'string' && blockName.length > 0
              ? toKebabCase(blockName)
              : undefined

          return (
            <section id={blockId} key={index}>
              <LayoutBlockRenderer block={block} blockId={blockId} />
            </section>
          )
        })}
      </div>
    )
  }

  return null
}

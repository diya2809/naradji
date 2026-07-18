import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { blockTabs } from '@/fields/blockTabs'
import { responsiveImagePairFields } from '@/fields/responsiveMedia'

export const AppleCardsCarousel: Block = {
  slug: 'appleCardsCarousel',
  interfaceName: 'AppleCardsCarouselBlock',
  fields: blockTabs([
    {
      name: 'heading',
      type: 'text',
      label: 'Heading',
    },
    {
      name: 'cards',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'category',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        ...responsiveImagePairFields({ required: true }),
        {
          name: 'content',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => {
              return [
                ...rootFeatures,
                HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                FixedToolbarFeature(),
                InlineToolbarFeature(),
              ]
            },
          }),
          label: 'Expanded Content',
        },
      ],
      label: 'Cards',
      required: true,
    },
  ]),
  labels: {
    plural: 'Apple Cards Carousels',
    singular: 'Apple Cards Carousel',
  },
}

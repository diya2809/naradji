import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { blockTabs } from '@/fields/blockTabs'

export const Text: Block = {
  slug: 'text',
  interfaceName: 'TextBlock',
  labels: { singular: 'Text', plural: 'Text Sections' },
  fields: blockTabs([
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          FixedToolbarFeature(),
          InlineToolbarFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
        ],
      }),
      required: true,
    },
  ]),
}

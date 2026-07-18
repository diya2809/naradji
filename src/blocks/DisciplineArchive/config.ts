import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { blockTabs } from '@/fields/blockTabs'

export const DisciplineArchive: Block = {
  slug: 'disciplineArchive',
  interfaceName: 'DisciplineArchiveBlock',
  fields: blockTabs([
    {
      name: 'introContent',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: 'Intro Content',
    },
    {
      name: 'limit',
      type: 'number',
      admin: {
        step: 1,
      },
      defaultValue: 12,
      label: 'Limit',
    },
    {
      name: 'showOutOfStock',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show Out of Stock Products',
    },
  ]),
  labels: {
    plural: 'Discipline Archives',
    singular: 'Discipline Archive',
  },
}

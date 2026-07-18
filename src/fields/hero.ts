import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from './link'
import { linkGroup } from './linkGroup'

export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'lowImpact',
      label: 'Type',
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'High Impact',
          value: 'highImpact',
        },
        {
          label: 'Medium Impact',
          value: 'mediumImpact',
        },
        {
          label: 'Low Impact',
          value: 'lowImpact',
        },
      ],
      required: true,
    },
    {
      name: 'richText',
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
      label: false,
    },
    link({
      appearances: false,
      disableLabel: true,
      overrides: {
        name: 'clickLink',
        admin: {
          condition: (_data: unknown, siblingData: { type?: string } = {}) =>
            ['highImpact', 'mediumImpact'].includes(siblingData.type ?? ''),
          description:
            'Makes the hero image area clickable. If empty, the first visible link below is used.',
        },
      },
    }),
    linkGroup({
      overrides: {
        maxRows: 2,
      },
    }),
    {
      name: 'media',
      type: 'upload',
      admin: {
        condition: (_, { type } = {}) => ['highImpact', 'mediumImpact'].includes(type),
        description: 'Shown on tablet and desktop (md breakpoint and up).',
      },
      label: 'Desktop Image',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'mobileMedia',
      type: 'upload',
      admin: {
        condition: (_, { type } = {}) => ['highImpact', 'mediumImpact'].includes(type),
        description: 'Optional. Shown on small screens. Falls back to the desktop image when empty.',
      },
      label: 'Mobile Image',
      relationTo: 'media',
    },
  ],
  label: false,
}

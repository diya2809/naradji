import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { blockTabs } from '@/fields/blockTabs'
import { link } from '@/fields/link'
import { blockStyleFields, imagePositionField } from '@/fields/responsiveLayout'
import { responsiveMediaFields } from '@/fields/responsiveMedia'

const contentFields: Field[] = [
  {
    name: 'title',
    type: 'text',
    required: true,
  },
  {
    name: 'description',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()],
    }),
  },
  ...responsiveMediaFields({ required: true }),
  {
    name: 'enableLink',
    type: 'checkbox',
    defaultValue: true,
  },
  link({
    overrides: {
      admin: {
        condition: (
          _data: Record<string, unknown>,
          siblingData: { enableLink?: boolean | null },
        ) => Boolean(siblingData?.enableLink),
      },
    },
  }),
]

const styleFields: Field[] = [...blockStyleFields, imagePositionField]

export const Feature: Block = {
  slug: 'feature',
  interfaceName: 'FeatureBlock',
  labels: { singular: 'Feature', plural: 'Features' },
  fields: blockTabs(contentFields, styleFields),
}

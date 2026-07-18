import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'

export const Videos: Block = {
  slug: 'videos',
  interfaceName: 'VideosBlock',
  labels: { singular: 'Videos Gallery', plural: 'Videos Galleries' },
  fields: blockTabs([
    {
      name: 'headline',
      type: 'text',
      label: 'Heading',
    },
    {
      name: 'videos',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'video',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Video File',
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption (optional)',
        },
        {
          name: 'buttonLabel',
          type: 'text',
          label: 'Button Label (e.g. "Shop Now") - Leave blank to hide button',
        },
        {
          name: 'buttonLinkType',
          type: 'radio',
          admin: {
            layout: 'horizontal',
            condition: (_, siblingData) => Boolean(siblingData?.buttonLabel),
          },
          defaultValue: 'reference',
          options: [
            {
              label: 'Internal link',
              value: 'reference',
            },
            {
              label: 'Custom URL',
              value: 'custom',
            },
          ],
        },
        {
          name: 'buttonReference',
          type: 'relationship',
          admin: {
            condition: (_, siblingData) =>
              Boolean(siblingData?.buttonLabel) && siblingData?.buttonLinkType === 'reference',
          },
          label: 'Document to link to',
          maxDepth: 1,
          relationTo: ['pages', 'products', 'categories'],
        },
        {
          name: 'buttonUrl',
          type: 'text',
          admin: {
            condition: (_, siblingData) =>
              Boolean(siblingData?.buttonLabel) && siblingData?.buttonLinkType === 'custom',
          },
          label: 'Custom URL',
        },
        {
          name: 'buttonNewTab',
          type: 'checkbox',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.buttonLabel),
          },
          label: 'Open in new tab',
        },
      ],
      label: 'Videos',
      minRows: 1,
    },
  ]),
}

import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'

export const Reviews: Block = {
  slug: 'reviews',
  interfaceName: 'ReviewsBlock',
  labels: { singular: 'Reviews', plural: 'Reviews' },
  fields: blockTabs([
    {
      name: 'headline',
      type: 'text',
      label: 'Heading',
    },
    {
      name: 'reviews',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'author',
          type: 'text',
          required: true,
          label: 'Reviewer name',
        },
        {
          name: 'text',
          type: 'textarea',
          required: true,
          label: 'Review',
        },
        {
          name: 'rating',
          type: 'number',
          required: true,
          min: 1,
          max: 5,
          defaultValue: 5,
          label: 'Star rating',
        },
        {
          name: 'avatar',
          type: 'upload',
          relationTo: 'media',
          label: 'Avatar (optional — initials used when empty)',
        },
      ],
      label: 'Reviews',
      minRows: 1,
    },
  ]),
}

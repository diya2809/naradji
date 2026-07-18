import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'

export const Testimonials: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: { singular: 'Testimonials', plural: 'Testimonials' },
  fields: blockTabs([
    {
      name: 'headline',
      type: 'text',
    },
    {
      name: 'testimonials',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        { name: 'quote', type: 'textarea', required: true },
        { name: 'author', type: 'text', required: true },
        { name: 'location', type: 'text' },
        { name: 'avatar', type: 'upload', relationTo: 'media' },
      ],
      label: 'Testimonials',
    },
  ]),
}

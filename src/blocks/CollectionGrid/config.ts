import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'

export const CollectionGrid: Block = {
  slug: 'collectionGrid',
  interfaceName: 'CollectionGridBlock',
  labels: { singular: 'Collection Grid', plural: 'Collection Grids' },
  fields: blockTabs([
    {
      name: 'headline',
      type: 'text',
    },
    {
      name: 'subtext',
      type: 'textarea',
    },
    {
      name: 'items',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [{ name: 'label', type: 'text', required: true }],
      label: 'Items',
    },
  ]),
}

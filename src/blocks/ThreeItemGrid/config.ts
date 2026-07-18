import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'

export const ThreeItemGrid: Block = {
  slug: 'threeItemGrid',
  fields: blockTabs([
    {
      name: 'heading',
      type: 'text',
      label: 'Heading',
    },
    {
      name: 'products',
      type: 'relationship',
      admin: {
        isSortable: true,
      },
      hasMany: true,
      label: 'Products to show',
      maxRows: 3,
      minRows: 3,
      relationTo: 'products',
    },
  ]),
  interfaceName: 'ThreeItemGridBlock',
  labels: {
    plural: 'Three Item Grids',
    singular: 'Three Item Grid',
  },
}

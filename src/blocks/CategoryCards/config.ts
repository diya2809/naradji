import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'

export const CategoryCards: Block = {
  slug: 'categoryCards',
  interfaceName: 'CategoryCardsBlock',
  labels: { singular: 'Category Cards', plural: 'Category Cards' },
  fields: blockTabs([
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      hasMany: true,
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
      ],
    },
  ]),
}

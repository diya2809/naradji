import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'

export const Divider: Block = {
  slug: 'divider',
  interfaceName: 'DividerBlock',
  labels: { singular: 'Divider', plural: 'Dividers' },
  fields: blockTabs([
    {
      name: 'style',
      type: 'select',
      defaultValue: 'line',
      options: [
        { label: 'Line', value: 'line' },
        { label: 'Dots', value: 'dots' },
        { label: 'Space Only', value: 'space' },
      ],
    },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'container',
      options: [
        { label: 'Full Width', value: 'full' },
        { label: 'Container', value: 'container' },
        { label: 'Narrow', value: 'narrow' },
      ],
    },
  ]),
}

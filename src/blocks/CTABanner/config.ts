import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'
import { link } from '@/fields/link'

export const CTABanner: Block = {
  slug: 'ctaBanner',
  interfaceName: 'CTABannerBlock',
  labels: { singular: 'CTA Banner', plural: 'CTA Banners' },
  fields: blockTabs([
    {
      name: 'icon',
      type: 'select',
      defaultValue: 'sparkles',
      options: [
        { label: 'Sparkles', value: 'sparkles' },
        { label: 'Gift', value: 'gift' },
        { label: 'Truck', value: 'truck' },
        { label: 'Heart', value: 'heart' },
        { label: 'None', value: 'none' },
      ],
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
    },
    {
      name: 'subtext',
      type: 'textarea',
    },
    link({
      appearances: ['default', 'outline'],
    }),
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Muted', value: 'muted' },
        { label: 'Card', value: 'card' },
      ],
    },
  ]),
}

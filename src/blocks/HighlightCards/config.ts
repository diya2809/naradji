import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'
import { link } from '@/fields/link'
import { responsiveImagePairFields } from '@/fields/responsiveMedia'

export const HighlightCards: Block = {
  slug: 'highlightCards',
  interfaceName: 'HighlightCardsBlock',
  labels: { singular: 'Highlight Cards', plural: 'Highlight Cards' },
  fields: blockTabs([
    {
      name: 'headline',
      type: 'text',
    },
    {
      name: 'cards',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        link({ appearances: false }),
        ...responsiveImagePairFields(),
      ],
      label: 'Cards',
    },
  ]),
}

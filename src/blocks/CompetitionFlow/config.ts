import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'
import { responsiveImagePairFields } from '@/fields/responsiveMedia'

export const CompetitionFlow: Block = {
  slug: 'competitionFlow',
  interfaceName: 'CompetitionFlowBlock',
  fields: blockTabs([
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'subtitle',
      type: 'textarea',
    },
    {
      name: 'videoUrl',
      type: 'text',
      admin: {
        description: 'Optional embed URL. If set, cards are hidden.',
      },
    },
    {
      name: 'cards',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        ...responsiveImagePairFields(),
      ],
    },
  ]),
  labels: {
    plural: 'Competition Flows',
    singular: 'Competition Flow',
  },
}

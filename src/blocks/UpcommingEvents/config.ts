import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'

export const UpcommingEvents: Block = {
  slug: 'upcommingEvents',
  interfaceName: 'UpcommingEvents',
  fields: blockTabs([
    {
      name: 'title',
      type: 'text',
    },
  ]),
}

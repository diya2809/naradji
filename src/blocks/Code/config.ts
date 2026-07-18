import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'

export const Code: Block = {
  slug: 'code',
  interfaceName: 'CodeBlock',
  fields: blockTabs([
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      options: [
        {
          label: 'Typescript',
          value: 'typescript',
        },
        {
          label: 'Javascript',
          value: 'javascript',
        },
        {
          label: 'CSS',
          value: 'css',
        },
      ],
    },
    {
      name: 'code',
      type: 'code',
      label: false,
      required: true,
    },
  ]),
}

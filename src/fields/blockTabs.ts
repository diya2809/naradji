import type { Field } from 'payload'

import { blockStyleFields } from './responsiveLayout'

export function blockTabs(contentFields: Field[], styleFields: Field[] = blockStyleFields): Field[] {
  return [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: contentFields,
        },
        {
          label: 'Style',
          fields: styleFields,
        },
      ],
    },
  ]
}

import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'
import { revalidateFooter } from '@/globals/hooks/revalidateGlobal'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateFooter],
  },
  fields: [
    {
      name: 'footerCopy',
      type: 'text',
      defaultValue: '© 2026 Naradji',
    },
    {
      name: 'sections',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        {
          name: 'heading',
          type: 'text',
          required: true,
        },
        {
          name: 'links',
          type: 'array',
          minRows: 1,
          maxRows: 12,
          fields: [
            link({
              appearances: false,
            }),
          ],
        },
      ],
    },
    {
      name: 'socialLinks',
      label: 'Social Media Links',
      type: 'array',
      maxRows: 10,
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'X (Twitter)', value: 'x' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Pinterest', value: 'pinterest' },
          ],
        },
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}

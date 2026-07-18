import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'
import { revalidateHeader } from '@/globals/hooks/revalidateGlobal'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateHeader],
  },
  fields: [
    {
      name: 'announcement',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'text',
          type: 'text',
          defaultValue: 'Boliye atta, doodh, chai — COD with haan pakka · Free shipping over ₹1,999',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
          },
        },
        {
          name: 'link',
          type: 'text',
          defaultValue: '/shop',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            placeholder: '/shop',
          },
        },
      ],
    },
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
    },
  ],
}

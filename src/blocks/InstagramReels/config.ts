import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'

export const InstagramReels: Block = {
  slug: 'instagramReels',
  interfaceName: 'InstagramReelsBlock',
  labels: { singular: 'Instagram Reels', plural: 'Instagram Reels' },
  fields: blockTabs([
    {
      name: 'headline',
      type: 'text',
      defaultValue: 'From our feed',
    },
    {
      name: 'posts',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            description: 'Full Instagram post or reel URL (e.g. https://www.instagram.com/p/...)',
          },
          label: 'Post URL',
        },
      ],
      label: 'Posts',
      minRows: 1,
    },
  ]),
}

import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { checkRole } from '@/access/utilities'
import {
  revalidateSiteReviewSubmissions,
  revalidateSiteReviewSubmissionsDelete,
} from '@/collections/hooks/revalidateSiteReviewSubmissions'

export const SiteReviewSubmissions: CollectionConfig = {
  slug: 'site-review-submissions',
  admin: {
    useAsTitle: 'author',
    group: 'Content',
    defaultColumns: ['author', 'rating', 'status', 'createdAt'],
    description: 'Homepage review submissions from the storefront carousel.',
  },
  access: {
    create: () => true,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    afterChange: [revalidateSiteReviewSubmissions],
    afterDelete: [revalidateSiteReviewSubmissionsDelete],
    beforeValidate: [
      ({ data, operation }) => {
        if (operation !== 'create' || !data) {
          return data
        }

        data.status = 'pending'

        if (typeof data.author === 'string') {
          data.author = data.author.trim()
        }

        if (typeof data.text === 'string') {
          data.text = data.text.trim()
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'author',
      type: 'text',
      required: true,
      label: 'Reviewer name',
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      label: 'Review',
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      label: 'Star rating',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      access: {
        update: ({ req: { user } }) => Boolean(user && checkRole(['admin'], user)),
      },
    },
  ],
}
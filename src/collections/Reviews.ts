import type { Access, CollectionConfig, Where } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { checkRole } from '@/access/utilities'

/** Public can read approved reviews; authors and admins can read their own / all. */
const reviewsReadAccess: Access = ({ req: { user } }) => {
  if (user && checkRole(['admin'], user)) {
    return true
  }

  if (user) {
    const query: Where = {
      or: [
        {
          status: {
            equals: 'approved',
          },
        },
        {
          user: {
            equals: user.id,
          },
        },
      ],
    }
    return query
  }

  const publicQuery: Where = {
    status: {
      equals: 'approved',
    },
  }
  return publicQuery
}

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'rating',
    group: 'Content',
    defaultColumns: ['product', 'user', 'rating', 'status', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: reviewsReadAccess,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    // beforeValidate so required `user` is present before field validation.
    beforeValidate: [
      ({ data, operation, req }) => {
        if (operation !== 'create' || !data) {
          return data
        }

        // Never trust client-supplied author or moderation status.
        if (req.user?.id) {
          data.user = req.user.id
        }

        data.status = 'pending'

        return data
      },
    ],
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        readOnly: true,
      },
      access: {
        // Authors cannot reassign; only admin tooling can update via collection access.
        update: ({ req: { user } }) => Boolean(user && checkRole(['admin'], user)),
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'reviewText',
      type: 'textarea',
    },
    {
      name: 'photos',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'videos',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
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
        // Only admins can change moderation status (create always forced to pending in hook).
        update: ({ req: { user } }) => Boolean(user && checkRole(['admin'], user)),
      },
    },
  ],
}

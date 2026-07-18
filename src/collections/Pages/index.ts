import type { CollectionConfig } from 'payload'

import { AppleCardsCarousel } from '@/blocks/AppleCardsCarousel/config'
import { Banner } from '@/blocks/Banner/config'
import { Carousel } from '@/blocks/Carousel/config'
import { CategoryCards } from '@/blocks/CategoryCards/config'
import { CollectionGrid } from '@/blocks/CollectionGrid/config'
import { CTABanner } from '@/blocks/CTABanner/config'
import { Code } from '@/blocks/Code/config'
import { Divider } from '@/blocks/Divider/config'
import { Feature } from '@/blocks/Feature/config'
import { HighlightCards } from '@/blocks/HighlightCards/config'
import { InstagramReels } from '@/blocks/InstagramReels/config'
import { Testimonials } from '@/blocks/Testimonials/config'
import { Reviews } from '@/blocks/Reviews/config'
import { Videos } from '@/blocks/Videos/config'
import { Text } from '@/blocks/Text/config'
import { ThreeItemGrid } from '@/blocks/ThreeItemGrid/config'
import { CompetitionFlow } from '@/blocks/CompetitionFlow/config'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { adminOnly } from '@/access/adminOnly'
import { Archive } from '@/blocks/ArchiveBlock/config'
import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { DisciplineArchive } from '@/blocks/DisciplineArchive/config'
import { FAQ } from '@/blocks/FAQ/config'
import { FormBlock } from '@/blocks/Form/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { UpcommingEvents } from '@/blocks/UpcommingEvents/config'
import { hero } from '@/fields/hero'
import { slugField } from 'payload'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { revalidatePage, revalidateDelete } from './hooks/revalidatePage'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedStatus,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'publishedOn',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: 'Hero',
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                CallToAction,
                CTABanner,
                CategoryCards,
                CollectionGrid,
                CompetitionFlow,
                Content,
                DisciplineArchive,
                Divider,
                FAQ,
                Feature,
                HighlightCards,
                InstagramReels,
                MediaBlock,
                Archive,
                AppleCardsCarousel,
                Carousel,
                ThreeItemGrid,
                Banner,
                Code,
                FormBlock,
                Reviews,
                Videos,
                Testimonials,
                Text,
                UpcommingEvents,
              ],
              required: true,
            },
          ],
          label: 'Content',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 50,
  },
}

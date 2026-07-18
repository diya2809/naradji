import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import { Plugin } from 'payload'
import type { Field } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { inrCurrencyConfig } from '@/lib/inrCurrency'
import { siteName } from '@/lib/site'

import { codAdapter } from '@/plugins/cod'

import { Page, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { ProductsCollection } from '@/collections/Products'
import { addressFields } from '@/ecommerce/addressFields'
import { normalizeVariantOptionsBeforeChange } from '@/ecommerce/normalizeVariantOptionsBeforeChange'
import { validateVariantOptions } from '@/ecommerce/validateVariantOptions'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { resolveS3MediaConfig, shouldUseS3Media } from '@/lib/s3MediaConfig'
import {
  backfillOrderDisplayFields,
  populateOrderDetails,
} from '@/collections/hooks/populateOrderDetails'
import { dedupeOrdersForTransaction } from '@/collections/hooks/dedupeOrdersForTransaction'
import { sendOrderConfirmationEmails } from '@/collections/hooks/sendOrderConfirmationEmails'

const generateTitle: GenerateTitle<Product | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | ${siteName}` : siteName
}

const generateURL: GenerateURL<Product | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const s3MediaConfig = resolveS3MediaConfig()
const useS3Media = shouldUseS3Media()

if (process.env.USE_S3_MEDIA === 'true' && !useS3Media) {
  throw new Error(`USE_S3_MEDIA is true but missing S3 media config: ${s3MediaConfig.missing.join(', ')}`)
}

if (s3MediaConfig.endpointWasNormalized && process.env.NODE_ENV === 'production') {
  console.warn(
    '[media] S3_ENDPOINT included the bucket path and was normalized. Update the env var to the R2 account base URL only.',
  )
}

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: 'Content',
      },
    },
    formOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
        create: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  ecommercePlugin({
    currencies: inrCurrencyConfig,
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    customers: {
      slug: 'users',
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => {
        const mappedFields = defaultCollection.fields.map((field) => {
          if ('name' in field && ['items', 'shippingAddress', 'customerEmail', 'amount', 'currency'].includes(field.name)) {
            return {
              ...field,
              admin: {
                ...field.admin,
                readOnly: true,
              },
            }
          }

          // Fulfillment status: only processing (paid/in progress) and completed (delivered).
          // Never expose cancelled/refunded as selectable options.
          if ('name' in field && field.name === 'status' && field.type === 'select' && 'options' in field) {
            return {
              ...field,
              options: (field.options ?? []).filter(
                (option) =>
                  typeof option === 'object' &&
                  'value' in option &&
                  (option.value === 'processing' || option.value === 'completed'),
              ),
            }
          }

          return field
        }) as Field[]

        return {
          ...defaultCollection,
          admin: {
            ...defaultCollection.admin,
            defaultColumns: [
              'createdAt',
              'customerName',
              'productNames',
              'amount',
              'status',
              'paymentStatus',
            ],
            useAsTitle: 'customerName',
          },
          hooks: {
            ...defaultCollection.hooks,
            beforeChange: [
              ...(defaultCollection.hooks?.beforeChange || []),
              populateOrderDetails,
            ],
            afterRead: [
              ...(defaultCollection.hooks?.afterRead || []),
              backfillOrderDisplayFields,
            ],
            afterChange: [
              ...(defaultCollection.hooks?.afterChange || []),
              dedupeOrdersForTransaction,
              sendOrderConfirmationEmails,
            ],
          },
          fields: [
            ...mappedFields,
            {
              name: 'customerName',
              type: 'text',
              label: 'Customer name',
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            },
            {
              name: 'productNames',
              type: 'text',
              label: 'Product name',
              admin: {
                position: 'sidebar',
                readOnly: true,
                description: 'Product titles for this order (auto-filled from line items).',
              },
            },
            {
              name: 'customerPhone',
              type: 'text',
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            },
            {
              name: 'accessToken',
              type: 'text',
              unique: true,
              index: true,
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
              hooks: {
                beforeValidate: [
                  ({ value, operation }) => {
                    if (operation === 'create' || !value) {
                      return crypto.randomUUID()
                    }
                    return value
                  },
                ],
              },
            },
            {
              name: 'adminProduct',
              type: 'relationship',
              relationTo: 'products',
              label: 'Product',
              admin: {
                description: 'Select a product to fetch variant options',
              },
              validate: (value: any, { operation, req, data }: any) => {
                // Admin helper fields are only required for admin UI creates.
                // Seed / API / voice orders already pass items (+ optional shippingAddress).
                const hasLineItems = Array.isArray(data?.items) && data.items.length > 0
                const isAdminUser = req?.user?.roles?.includes('admin')
                if (isAdminUser && operation === 'create' && !value && !hasLineItems) {
                  return 'Product is required'
                }
                return true
              },
            },
            {
              name: 'adminVariant',
              type: 'relationship',
              relationTo: 'variants',
              label: 'Variant',
              admin: {
                description: 'Select a variant of the chosen product',
              },
              filterOptions: ({ data }) => {
                if (data && data.adminProduct) {
                  return {
                    product: {
                      equals: typeof data.adminProduct === 'object' ? data.adminProduct.id : data.adminProduct,
                    },
                  }
                }
                return {}
              },
              validate: (value: any, { operation, req, data }: any) => {
                const hasLineItems = Array.isArray(data?.items) && data.items.length > 0
                const usingAdminHelpers = Boolean(data?.adminProduct)
                const isAdminUser = req?.user?.roles?.includes('admin')
                // Grocery CSV SKUs are non-variant — only require when admin helper path is used.
                if (
                  isAdminUser &&
                  operation === 'create' &&
                  usingAdminHelpers &&
                  !hasLineItems &&
                  !value
                ) {
                  return 'Variant is required'
                }
                return true
              },
            },
            {
              name: 'adminQuantity',
              type: 'number',
              label: 'Quantity',
              defaultValue: 1,
              validate: (value: any, { operation, req, data }: any) => {
                const hasLineItems = Array.isArray(data?.items) && data.items.length > 0
                const usingAdminHelpers = Boolean(data?.adminProduct)
                const isAdminUser = req?.user?.roles?.includes('admin')
                if (
                  isAdminUser &&
                  operation === 'create' &&
                  usingAdminHelpers &&
                  !hasLineItems &&
                  (!value || value <= 0)
                ) {
                  return 'Quantity must be at least 1'
                }
                return true
              },
            },
            {
              name: 'adminAddress',
              type: 'relationship',
              relationTo: 'addresses',
              label: 'Shipping Address',
              admin: {
                description: 'Select from available customer addresses',
              },
              filterOptions: ({ data }) => {
                if (data && data.customer) {
                  return {
                    customer: {
                      equals: typeof data.customer === 'object' ? data.customer.id : data.customer,
                    },
                  }
                }
                return {}
              },
              validate: (value: any, { operation, req, data }: any) => {
                const hasShipping =
                  data?.shippingAddress &&
                  typeof data.shippingAddress === 'object' &&
                  Boolean(data.shippingAddress.addressLine1)
                const isAdminUser = req?.user?.roles?.includes('admin')
                if (isAdminUser && operation === 'create' && !value && !hasShipping) {
                  return 'Shipping address is required'
                }
                return true
              },
            },
            {
              name: 'paymentStatus',
              type: 'select',
              label: 'Payment Status',
              defaultValue: 'pending',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Paid', value: 'paid' },
                { label: 'Failed', value: 'failed' },
              ],
              admin: {
                position: 'sidebar',
                description:
                  'Pending for COD until collected on delivery; mark Paid when cash is received.',
              },
            },
            {
              name: 'shippingCharge',
              type: 'number',
              label: 'Shipping charge (₹)',
              defaultValue: 0,
              admin: {
                position: 'sidebar',
                readOnly: true,
                description: 'Shipping fee charged for this order (₹0 = free shipping).',
              },
            },
            {
              name: 'emailSent',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                hidden: true,
              },
            },
          ],
        } as import('payload').CollectionConfig
      },
    },
    transactions: {
      transactionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...defaultCollection.fields,
          {
            name: 'shippingCharge',
            type: 'number',
            label: 'Shipping charge (₹)',
            defaultValue: 0,
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Shipping fee included in this payment (₹0 = free shipping).',
            },
          },
        ],
      }),
    },
    payments: {
      paymentMethods: [
        codAdapter({ label: 'Cash on Delivery' }),
      ],
    },
    addresses: {
      addressFields: () => addressFields(),
      supportedCountries: [{ label: 'India', value: 'IN' }],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
      variants: {
        variantsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          admin: {
            ...defaultCollection.admin,
            description:
              'Each variant must be Published with price and inventory set. Draft variants are hidden on the storefront.',
          },
          hooks: {
            ...defaultCollection.hooks,
            beforeChange: [
              ...(defaultCollection.hooks?.beforeChange || []),
              normalizeVariantOptionsBeforeChange,
            ],
          },
          fields: [
            ...defaultCollection.fields.map((field): Field => {
              if ('name' in field && field.name === 'options') {
                return {
                  ...field,
                  validate: validateVariantOptions({ productsCollectionSlug: 'products' }),
                  admin: {
                    ...field.admin,
                    components: {
                      ...(field.admin && 'components' in field.admin ? field.admin.components : {}),
                      Field: {
                        path: '@/components/admin/VariantOptionsSelector#VariantOptionsSelector',
                      },
                    },
                  },
                } as Field
              }

              return field
            }),
            {
              name: 'compareAtPriceInINR',
              type: 'number',
              label: 'Compare at price (₹)',
              admin: {
                description:
                  'Original MRP for this variant. Shown struck through on the storefront when higher than the sale price.',
              },
            },
          ],
        }),
      },
    },
  }),
  ...(useS3Media
    ? [
        s3Storage({
          collections: {
            media: true,
          },
          bucket: s3MediaConfig.bucket ?? '',
          config: {
            credentials: {
              accessKeyId: s3MediaConfig.accessKeyId ?? '',
              secretAccessKey: s3MediaConfig.secretAccessKey ?? '',
            },
            region: 'apac',
            forcePathStyle: true,
            endpoint: s3MediaConfig.endpoint ?? '',
          },
          disableLocalStorage: true,
        }),
      ]
    : []),
]

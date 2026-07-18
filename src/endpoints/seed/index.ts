import type { CollectionSlug, Payload, PayloadRequest, File, RequiredDataFromCollectionSlug } from 'payload'

import { contactFormData } from './contact-form'
import { contactPageData } from './contact-page'
import { footerSeedPages } from './footer-pages'
import { homePageData } from './home'
import { seedSellerCatalog } from './seller-catalog'
import { rupeesToMinor } from '@/lib/currency'
import type { Address, Form, Media, Product, Transaction, Header } from '@/payload-types'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'products',
  'forms',
  'form-submissions',
  'variants',
  'variantOptions',
  'variantTypes',
  'carts',
  'transactions',
  'addresses',
  'orders',
]

/** Fashion/Asmi leftovers — never re-seed these. */
const LEGACY_ASMI_MEDIA_ALTS = ['Naradji hero — desktop', 'Naradji hero — mobile']
const LEGACY_ASMI_MEDIA_FILENAMES = [
  'hero-laptop.png',
  'hero-mobile.png',
  'hero-laptop-asmi.png',
  'hero-mobile-asmi.png',
]

async function purgeLegacyAsmiMedia(payload: Payload, req: PayloadRequest): Promise<void> {
  const legacy = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      or: [
        { alt: { in: LEGACY_ASMI_MEDIA_ALTS } },
        { filename: { in: LEGACY_ASMI_MEDIA_FILENAMES } },
        { filename: { contains: 'asmi' } },
        { alt: { contains: 'Asmi' } },
        { alt: { contains: 'asmi' } },
      ],
    },
  })

  let deleted = 0
  for (const doc of legacy.docs) {
    await payload.delete({ collection: 'media', id: doc.id, req })
    deleted += 1
  }
  if (deleted) {
    payload.logger.info(`— Removed ${deleted} legacy Asmi/fashion media docs`)
  }
}

const baseAddressData: Transaction['billingAddress'] = {
  name: 'Seed Customer',
  phone: '9876543210',
  alternatePhone: null,
  addressLine1: 'Flat 2, Casa Branca',
  addressLine2: 'Near Anjuna Beach, Bardez',
  city: 'Panaji',
  state: 'Goa',
  postalCode: '403001',
  country: 'IN',
}

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // Relationship filterOptions callbacks read req.context directly.
  // Set this once for the whole seed request so nested validations can bypass
  // variantOption filtering safely during bootstrap data creation.
  req.context = {
    ...(req.context ?? {}),
    disableRevalidate: true,
    skipVariantOptionFilterOptions: true,
  }

  const create = async <T extends CollectionSlug>(args: {
    collection: T
    data: RequiredDataFromCollectionSlug<T>
    depth?: number
    file?: File
  }): Promise<any> => {
    const { collection, data, depth, file } = args
    let existingDoc: any = null

    // Determine query filter based on collection slug to implement upsert
    let whereQuery: any = null

    if (collection === 'users') {
      const email = (data as any).email
      if (email) whereQuery = { email: { equals: email } }
    } else if (collection === 'categories') {
      const slug = (data as any).slug
      if (slug) whereQuery = { slug: { equals: slug } }
    } else if (collection === 'media') {
      const alt = (data as any).alt
      // Prefer alt — Payload may store suffixed filenames (e.g. hero-laptop-1.png).
      if (alt) {
        whereQuery = { alt: { equals: alt } }
      } else if (file?.name) {
        whereQuery = { filename: { equals: file.name } }
      }
    } else if (collection === 'variantTypes') {
      const name = (data as any).name
      if (name) whereQuery = { name: { equals: name } }
    } else if (collection === 'variantOptions') {
      const value = (data as any).value
      const variantType = (data as any).variantType
      if (value && variantType) {
        whereQuery = {
          and: [
            { value: { equals: value } },
            { variantType: { equals: variantType } },
          ],
        }
      }
    } else if (collection === 'products') {
      const slug = (data as any).slug
      if (slug) whereQuery = { slug: { equals: slug } }
    } else if (collection === 'forms') {
      const title = (data as any).title
      if (title) whereQuery = { title: { equals: title } }
    } else if (collection === 'pages') {
      const slug = (data as any).slug
      if (slug) whereQuery = { slug: { equals: slug } }
    } else if (collection === 'variants') {
      const product = (data as any).product
      const options = (data as any).options || []
      const productId = typeof product === 'object' ? product?.id : product
      if (productId && options.length > 0) {
        const optionIds = options.map((o: any) => (typeof o === 'object' ? o?.id : o))
        whereQuery = {
          and: [
            { product: { equals: productId } },
            ...optionIds.map((id: any) => ({
              options: { contains: id },
            })),
          ],
        }
      }
    } else if (collection === 'addresses') {
      const customer = (data as any).customer
      const customerId = typeof customer === 'object' ? customer?.id : customer
      if (customerId) whereQuery = { customer: { equals: customerId } }
    } else if (collection === 'carts') {
      const customer = (data as any).customer
      const customerId = typeof customer === 'object' ? customer?.id : customer
      if (customerId) {
        whereQuery = {
          and: [
            { customer: { equals: customerId } },
            { purchasedAt: { exists: false } },
          ],
        }
      }
    } else if (collection === 'transactions' || collection === 'orders') {
      const customer = (data as any).customer
      const customerId = typeof customer === 'object' ? customer?.id : customer
      const amount = (data as any).amount
      if (customerId && amount) {
        whereQuery = {
          and: [
            { customer: { equals: customerId } },
            { amount: { equals: amount } },
          ],
        }
      }
    }

    if (whereQuery) {
      const existing = await payload.find({
        collection,
        where: whereQuery,
        limit: 1,
        depth: 0,
        req,
      })
      if (existing.docs.length > 0) {
        existingDoc = existing.docs[0]
      }
    }

    if (existingDoc) {
      return (await payload.update({
        collection,
        id: existingDoc.id,
        data: data as any,
        depth,
        ...(file
          ? {
              file,
              overwriteExistingFiles: true,
            }
          : {}),
        req,
      })) as any
    }

    return (await payload.create({
      collection,
      data,
      depth,
      file,
      req,
    })) as any
  }
  const updateGlobal = (args: Parameters<typeof payload.updateGlobal>[0]) =>
    payload.updateGlobal({ ...args, req })

  payload.logger.info(`— Database will not be cleared. Processing updates/inserts...`)
  payload.logger.info(`— Seeding customer and customer data...`)

  await purgeLegacyAsmiMedia(payload, req)

  const customer = await create({
    collection: 'users',
    data: {
      name: 'Customer',
      email: 'customer@example.com',
      password: 'password',
      roles: ['customer'],
    },
  })

  const {
    products: sellerProducts,
    productImages,
  } = await seedSellerCatalog({ payload, req, create })

  if (sellerProducts.length < 3) {
    throw new Error('Expected at least 3 products in seller-product-catalog.csv')
  }

  // Prefer voice-demo SKUs on the homepage grid when present.
  const bySlug = new Map(
    sellerProducts.map((p) => [typeof p.slug === 'string' ? p.slug : '', p] as const),
  )
  const featuredSlugs = [
    'aashirvaad-atta-1kg',
    'amul-taaza-toned-milk-500ml',
    'tata-tea-gold-250g',
  ]
  const featuredProducts = [
    ...featuredSlugs.map((slug) => bySlug.get(slug)).filter((p): p is Product => Boolean(p)),
    ...sellerProducts,
  ]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 3) as [Product, Product, Product]

  const [productA, productB, productC] = featuredProducts
  const seedLinePrice =
    typeof productA.priceInINR === 'number' ? productA.priceInINR : rupeesToMinor(50)

  // Carousel cards: prefer images from featured SKUs, then any catalog media.
  const featuredImageIds = new Set(
    featuredProducts.flatMap((p) => {
      const gallery = Array.isArray(p.gallery) ? p.gallery : []
      return gallery
        .map((g) => (g && typeof g === 'object' && 'image' in g ? g.image : null))
        .map((img) => (img && typeof img === 'object' && 'id' in img ? String(img.id) : typeof img === 'string' ? img : null))
        .filter((id): id is string => Boolean(id))
    }),
  )
  const primaryProductImages: Media[] = [
    ...productImages.filter((m) => featuredImageIds.has(String(m.id))),
    ...productImages,
  ]
    .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
    .slice(0, 8)

  payload.logger.info(`— Seeding contact form...`)

  const contactForm: Form = await create({
    collection: 'forms',
    depth: 0,
    data: contactFormData(),
  })

  payload.logger.info(`— Seeding pages (static)...`)

  if (primaryProductImages.length < 1) {
    throw new Error('Seller catalog seed produced no product images for homepage cards')
  }

  await create({
    collection: 'pages',
    depth: 0,
    data: homePageData({
      metaImage: primaryProductImages[0],
      carouselImages: [
        primaryProductImages[0],
        primaryProductImages[1] ?? primaryProductImages[0],
        primaryProductImages[2] ?? primaryProductImages[0],
      ],
      featuredProductIds: [String(productA.id), String(productB.id), String(productC.id)],
    }),
  })
  await create({
    collection: 'pages',
    depth: 0,
    data: contactPageData({
      contactForm: contactForm,
    }),
  })
  for (const page of footerSeedPages()) {
    await create({
      collection: 'pages',
      depth: 0,
      data: page,
    })
  }

  payload.logger.info(`— Seeding addresses...`)

  await create({
    collection: 'addresses',
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressData as Address),
    },
  })

  payload.logger.info(`— Seeding transactions...`)

  await create({
    collection: 'transactions',
    data: {
      currency: 'INR',
      customer: customer.id,
      paymentMethod: 'cod',
      cod: {
        reference: 'cod_test123',
      },
      status: 'pending',
      billingAddress: baseAddressData,
    },
  })

  const succeededTransaction = await create({
    collection: 'transactions',
    data: {
      currency: 'INR',
      customer: customer.id,
      paymentMethod: 'cod',
      cod: {
        reference: 'cod_test123',
      },
      status: 'succeeded',
      billingAddress: baseAddressData,
    },
  })

  payload.logger.info(`— Seeding carts...`)

  await create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'INR',
      items: [
        {
          product: productA.id,
          quantity: 1,
        },
      ],
    },
  })

  const oldTimestamp = new Date('2023-01-01T00:00:00Z').toISOString()

  await create({
    collection: 'carts',
    data: {
      currency: 'INR',
      createdAt: oldTimestamp,
      items: [
        {
          product: productB.id,
          quantity: 1,
        },
      ],
    },
  })

  await create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'INR',
      purchasedAt: new Date().toISOString(),
      subtotal: seedLinePrice * 2,
      items: [
        {
          product: productA.id,
          quantity: 1,
        },
        {
          product: productB.id,
          quantity: 1,
        },
      ],
    },
  })

  payload.logger.info(`— Seeding orders...`)

  await create({
    collection: 'orders',
    data: {
      amount: seedLinePrice * 2,
      currency: 'INR',
      customer: customer.id,
      shippingAddress: baseAddressData,
      items: [
        {
          product: productA.id,
          quantity: 1,
        },
        {
          product: productB.id,
          quantity: 1,
        },
      ],
      status: 'completed',
      paymentStatus: 'paid',
      transactions: [succeededTransaction.id],
    },
  })

  await create({
    collection: 'orders',
    data: {
      amount: seedLinePrice * 2,
      currency: 'INR',
      customer: customer.id,
      shippingAddress: baseAddressData,
      items: [
        {
          product: productA.id,
          quantity: 1,
        },
        {
          product: productC.id,
          quantity: 1,
        },
      ],
      status: 'processing',
      paymentStatus: 'paid',
      transactions: [succeededTransaction.id],
    },
  })

  payload.logger.info(`— Seeding globals...`)

  const headerData: Partial<Header> = {
    announcement: {
      enabled: false,
      text: '',
      link: '/shop',
    },
    navItems: [
        {
          link: {
            type: 'custom',
            label: 'Home',
            url: '/',
          },
        },
        {
          link: {
            type: 'custom',
            label: 'Shop',
            url: '/shop',
          },
        },
        {
          link: {
            type: 'custom',
            label: 'Contact',
            url: '/contact',
          },
        },
      ],
  }

  await updateGlobal({
    slug: 'header',
    data: headerData,
  })

  await updateGlobal({
    slug: 'footer',
    data: {
      footerCopy: '© 2026 Naradji',
      socialLinks: [],
      sections: [
        {
          heading: 'Company',
          links: [
            {
              link: {
                type: 'custom',
                label: 'Shop',
                url: '/shop',
              },
            },
            {
              link: {
                type: 'custom',
                label: 'About',
                url: '/about',
              },
            },
            {
              link: {
                type: 'custom',
                label: 'Contact',
                url: '/contact',
              },
            },
            {
              link: {
                type: 'custom',
                label: 'Find my order',
                url: '/find-order',
              },
            },
          ],
        },
        {
          heading: 'Legal',
          links: [
            {
              link: {
                type: 'custom',
                label: 'Privacy Policy',
                url: '/privacy-policy',
              },
            },
            {
              link: {
                type: 'custom',
                label: 'Shipping Policy',
                url: '/shipping-policy',
              },
            },
            {
              link: {
                type: 'custom',
                label: 'Refund Policy',
                url: '/refund-policy',
              },
            },
            {
              link: {
                type: 'custom',
                label: 'Terms & Conditions',
                url: '/terms-conditions',
              },
            },
          ],
        },
      ],
    } as any,
  })

  const pricingCheck = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 3,
    overrideAccess: true,
    req,
    where: {
      slug: {
        in: featuredProducts.map((product) => product.slug as string),
      },
    },
  })

  for (const product of pricingCheck.docs) {
    if (product.enableVariants) {
      const variantWithPrice = product.variants?.docs?.find(
        (variant) => typeof variant === 'object' && typeof variant.priceInINR === 'number',
      )
      if (!variantWithPrice) {
        throw new Error(`Seed validation failed: variant product "${product.slug}" has no variant prices.`)
      }
      continue
    }

    if (typeof product.priceInINR !== 'number') {
      throw new Error(`Seed validation failed: product "${product.slug}" is missing priceInINR.`)
    }
  }

  payload.logger.info('Seeded database successfully!')
}

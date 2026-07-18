import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { CollectionSlug, File, Payload, PayloadRequest } from 'payload'

import { loadSellerCatalog, slugifyLabel, uniqueCategories, type SellerProductRow } from '@/lib/catalog/sellerCatalog'
import { rupeesToMinor } from '@/lib/currency'
import type { Category, Media, Product } from '@/payload-types'

type CreateFn = <T extends CollectionSlug>(args: {
  collection: T
  data: any
  depth?: number
  file?: File
}) => Promise<any>

async function fetchLocalImage(absPath: string): Promise<File | null> {
  try {
    const data = await readFile(absPath)
    const ext = path.extname(absPath).replace('.', '').toLowerCase()
    const mimetypeByExtension: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    }
    return {
      name: path.basename(absPath),
      data,
      mimetype: mimetypeByExtension[ext] ?? 'application/octet-stream',
      size: data.byteLength,
    }
  } catch {
    return null
  }
}

function lexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

/**
 * Single source of truth for storefront products:
 * docs/seller-product-catalog.csv (IndiaMART-imaged SKUs only).
 */
export async function seedSellerCatalog({
  payload,
  req,
  create,
}: {
  payload: Payload
  req: PayloadRequest
  create: CreateFn
}): Promise<{
  products: Product[]
  categories: Category[]
  productImages: Media[]
  rows: SellerProductRow[]
}> {
  const rows = loadSellerCatalog()
  if (!rows.length) {
    throw new Error('seller-product-catalog.csv produced zero rows — aborting seed')
  }

  payload.logger.info(`— Seeding ${rows.length} seller catalog products from CSV…`)

  const categoryBySlug = new Map<string, Category>()
  for (const title of uniqueCategories(rows)) {
    const slug = slugifyLabel(title)
    const cat = (await create({
      collection: 'categories',
      data: { title, slug },
    })) as Category
    categoryBySlug.set(slug, cat)
  }

  const mediaByPath = new Map<string, Media>()
  const productImages: Media[] = []
  const products: Product[] = []
  const keepSlugs = new Set(rows.map((r) => r.slug))

  for (const row of rows) {
    let media: Media | undefined
    if (row.imagePath) {
      const abs = path.resolve(process.cwd(), 'public', row.imagePath.replace(/^\//, ''))
      const cached = mediaByPath.get(abs)
      if (cached) {
        media = cached
      } else {
        const file = await fetchLocalImage(abs)
        if (file) {
          media = (await create({
            collection: 'media',
            data: { alt: row.title },
            file,
          })) as Media
          mediaByPath.set(abs, media)
          productImages.push(media)
        }
      }
    }

    const catSlug = slugifyLabel(row.category)
    const category = categoryBySlug.get(catSlug)
    const aliases = [...new Set([row.title, ...row.aliases].filter(Boolean))].map((alias) => ({
      alias,
    }))

    const product = (await create({
      collection: 'products',
      data: {
        title: row.title,
        slug: row.slug,
        _status: 'published',
        priceInINREnabled: true,
        priceInINR: rupeesToMinor(row.priceInr),
        inventory: row.inventory,
        unit: row.unit,
        aliases,
        enableVariants: false,
        categories: category ? [category.id] : [],
        description: lexicalParagraph(row.shortDescription || row.title),
        gallery: media ? [{ image: media.id }] : undefined,
        meta: {
          title: row.title,
          description: row.shortDescription || row.title,
          ...(media ? { image: media.id } : {}),
        },
        layout: [],
        relatedProducts: [],
      },
    })) as Product

    products.push(product)
  }

  // Structural cleanup: only CSV SKUs + their categories remain.
  const keepCategorySlugs = new Set([...categoryBySlug.keys()])

  const staleProducts = await payload.find({
    collection: 'products',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    req,
    pagination: false,
  })

  let deletedProducts = 0
  for (const doc of staleProducts.docs) {
    const slug = typeof doc.slug === 'string' ? doc.slug : ''
    if (!slug || !keepSlugs.has(slug)) {
      await payload.delete({ collection: 'products', id: doc.id, req })
      deletedProducts += 1
    }
  }
  if (deletedProducts) {
    payload.logger.info(`— Removed ${deletedProducts} products not in seller catalog CSV`)
  }

  const staleCategories = await payload.find({
    collection: 'categories',
    limit: 500,
    depth: 0,
    overrideAccess: true,
    req,
    pagination: false,
  })

  let deletedCategories = 0
  for (const doc of staleCategories.docs) {
    const slug = typeof doc.slug === 'string' ? doc.slug : ''
    if (!slug || !keepCategorySlugs.has(slug)) {
      await payload.delete({ collection: 'categories', id: doc.id, req })
      deletedCategories += 1
    }
  }
  if (deletedCategories) {
    payload.logger.info(`— Removed ${deletedCategories} categories not in seller catalog CSV`)
  }

  // Grocery CSV SKUs are non-variant — purge leftover fashion variants.
  const allVariants = await payload.find({
    collection: 'variants',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    req,
    pagination: false,
  })
  let deletedVariants = 0
  for (const doc of allVariants.docs) {
    await payload.delete({ collection: 'variants', id: doc.id, req })
    deletedVariants += 1
  }
  if (deletedVariants) {
    payload.logger.info(`— Removed ${deletedVariants} variants (seller catalog is non-variant)`)
  }

  if (products.length !== rows.length) {
    throw new Error(
      `Seller catalog seed mismatch: seeded ${products.length} products, CSV has ${rows.length}`,
    )
  }

  payload.logger.info(`— Seller catalog ready: ${products.length} products, ${categoryBySlug.size} categories`)

  return {
    products,
    categories: [...categoryBySlug.values()],
    productImages,
    rows,
  }
}

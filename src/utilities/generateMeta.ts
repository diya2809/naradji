import type { Metadata } from 'next'

import type { Page, Product } from '../payload-types'

import { siteName } from '@/lib/site'

import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'
import { getTwitterImageUrls, resolveSocialImage } from './resolveSocialImage'

function getDocPath(doc: Page | Product): string {
  const slug = doc?.slug

  if (!slug || slug === 'home') {
    return ''
  }

  return `/${slug}`
}

export const generateMeta = async (args: { doc: Page | Product }): Promise<Metadata> => {
  const { doc } = args || {}
  const title = doc?.meta?.title || doc?.title || siteName
  const description = doc?.meta?.description
  const metaImage = typeof doc?.meta?.image === 'object' ? doc.meta.image : null
  const images = resolveSocialImage(metaImage)
  const pageUrl = `${getServerSideURL()}${getDocPath(doc)}`

  return {
    description,
    openGraph: mergeOpenGraph({
      ...(description ? { description } : {}),
      images,
      title,
      url: pageUrl,
    }),
    title,
    twitter: {
      card: 'summary_large_image',
      description: description ?? undefined,
      images: getTwitterImageUrls(images),
      title,
    },
  }
}

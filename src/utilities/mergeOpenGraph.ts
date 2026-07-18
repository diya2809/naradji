import type { Metadata } from 'next'

import { siteName } from '@/lib/site'
import { defaultOgImage } from '@/utilities/defaultOgImage'

const defaultOpenGraph: Metadata['openGraph'] = {
  description: 'Voice commerce storefront — shop with Naradji.',
  images: defaultOgImage,
  siteName,
  title: siteName,
  type: 'website',
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ?? defaultOpenGraph.images,
  }
}

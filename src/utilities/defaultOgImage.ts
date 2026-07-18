import type { Metadata } from 'next'

export const DEFAULT_OG_IMAGE_PATH = '/logo.png'

export const defaultOgImage: NonNullable<Metadata['openGraph']>['images'] = [
  {
    alt: 'Naradji',
    height: 1080,
    type: 'image/png',
    url: DEFAULT_OG_IMAGE_PATH,
    width: 1080,
  },
]

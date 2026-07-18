import type { Metadata } from 'next'

import { defaultOgImage } from '@/utilities/defaultOgImage'
import { getServerSideURL } from '@/utilities/getURL'

type MediaLike = {
  alt?: string | null
  height?: number | null
  mimeType?: string | null
  url?: string | null
  width?: number | null
}

const LEGACY_HOSTS: string[] = []

export function isSocialShareableImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url, getServerSideURL())

    if (parsed.protocol !== 'https:') {
      return false
    }

    // WhatsApp and other crawlers need a directly fetchable asset, not the Payload media API.
    if (parsed.pathname.startsWith('/api/media/file')) {
      return false
    }

    return true
  } catch {
    return false
  }
}

function normalizeImageUrl(url: string): string {
  let normalized = url

  for (const host of LEGACY_HOSTS) {
    normalized = normalized.replace(`https://${host}`, getServerSideURL())
    normalized = normalized.replace(`http://${host}`, getServerSideURL())
  }

  if (!normalized.startsWith('http')) {
    normalized = `${getServerSideURL()}${normalized.startsWith('/') ? '' : '/'}${normalized}`
  }

  return normalized
}

export function resolveSocialImage(
  media?: MediaLike | null,
): NonNullable<Metadata['openGraph']>['images'] {
  if (!media?.url) {
    return defaultOgImage
  }

  const url = normalizeImageUrl(media.url)

  if (!isSocialShareableImageUrl(url)) {
    return defaultOgImage
  }

  return [
    {
      alt: media.alt ?? undefined,
      height: media.height ?? undefined,
      type: media.mimeType ?? undefined,
      url,
      width: media.width ?? undefined,
    },
  ]
}

export function getTwitterImageUrls(
  images: NonNullable<Metadata['openGraph']>['images'],
): string[] {
  const list = Array.isArray(images) ? images : images ? [images] : []

  return list
    .map((image) => {
      if (typeof image === 'string') {
        return image
      }

      if (image instanceof URL) {
        return image.toString()
      }

      return image.url
    })
    .filter((url): url is string => Boolean(url))
}

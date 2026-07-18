import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Media, Review, User } from '@/payload-types'
import type { ProductReviewsData, ReviewListItem } from './types'

export type { ProductReviewsData, ReviewListItem } from './types'

function resolveMediaUrl(media: Media | string | null | undefined): string | null {
  if (!media || typeof media !== 'object') return null
  return media.url || null
}

/** Returns null when the product has no approved reviews. */
export async function getProductReviewsData(
  productId: string,
): Promise<ProductReviewsData | null> {
  const payload = await getPayload({ config: configPromise })

  const { docs: reviews } = await payload.find({
    collection: 'reviews',
    where: {
      and: [
        {
          product: {
            equals: productId,
          },
        },
        {
          status: {
            equals: 'approved',
          },
        },
      ],
    },
    depth: 2,
    sort: '-createdAt',
    limit: 100,
  })

  if (reviews.length === 0) {
    return null
  }

  const totalReviews = reviews.length
  let sumRatings = 0

  const listItems: ReviewListItem[] = reviews.map((review: Review, index) => {
    const rating = typeof review.rating === 'number' && Number.isFinite(review.rating) ? review.rating : 0
    sumRatings += rating

    const reviewer = review.user as User | string | null | undefined
    let reviewerName = 'Customer'
    if (typeof reviewer === 'object' && reviewer !== null) {
      if (typeof reviewer.name === 'string' && reviewer.name.trim()) {
        reviewerName = reviewer.name.trim()
      } else if (typeof reviewer.email === 'string' && reviewer.email.trim()) {
        reviewerName = reviewer.email.trim()
      }
    }

    const photos =
      review.photos
        ?.map((photo, idx) => {
          if (typeof photo !== 'object' || !photo) return null
          const url = resolveMediaUrl(photo)
          if (!url) return null
          return {
            id: String(photo.id || `photo-${index}-${idx}`),
            url: String(url),
            alt: typeof photo.alt === 'string' && photo.alt ? photo.alt : 'Review photo',
          }
        })
        .filter((p): p is { id: string; url: string; alt: string } => Boolean(p)) || []

    const videos =
      review.videos
        ?.map((video, idx) => {
          if (typeof video !== 'object' || !video) return null
          const url = resolveMediaUrl(video)
          if (!url) return null
          return {
            id: String(video.id || `video-${index}-${idx}`),
            url: String(url),
          }
        })
        .filter((v): v is { id: string; url: string } => Boolean(v)) || []

    // Plain JSON-safe payload for client components (no class instances / undefined holes).
    return {
      id: String(review.id || `review-${index}`),
      rating,
      reviewText: typeof review.reviewText === 'string' ? review.reviewText : null,
      createdAt: typeof review.createdAt === 'string' ? review.createdAt : '',
      reviewerName,
      photos,
      videos,
    }
  })

  return {
    averageRating: (sumRatings / totalReviews).toFixed(1),
    totalReviews,
    reviews: listItems,
  }
}

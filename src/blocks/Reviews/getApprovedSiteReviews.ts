import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { SiteReviewSubmission } from '@/payload-types'

import type { ReviewItem } from './ReviewCard'

/** Approved homepage review submissions for the storefront carousel. */
export async function getApprovedSiteReviews(): Promise<ReviewItem[]> {
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'site-review-submissions',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      status: {
        equals: 'approved',
      },
    },
  })

  return docs.map((submission: SiteReviewSubmission) => ({
    id: `submission-${submission.id}`,
    author: submission.author,
    text: submission.text,
    rating: submission.rating,
    createdAt: submission.createdAt,
  }))
}
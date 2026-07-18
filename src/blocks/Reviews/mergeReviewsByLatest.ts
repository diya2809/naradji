import type { ReviewItem } from './ReviewCard'

function getSortKey(review: ReviewItem, cmsIndex?: number): number {
  if (review.createdAt) {
    const timestamp = new Date(review.createdAt).getTime()
    return Number.isNaN(timestamp) ? 0 : timestamp
  }

  // CMS entries have no timestamp; later array position is treated as newer.
  return cmsIndex ?? 0
}

/** Newest reviews first — user submissions by date, CMS entries by array order. */
export function mergeReviewsByLatest(
  cmsReviews: ReviewItem[],
  approvedSubmissions: ReviewItem[],
): ReviewItem[] {
  const tagged = [
    ...cmsReviews.map((review, index) => ({ review, cmsIndex: index })),
    ...approvedSubmissions.map((review) => ({ review, cmsIndex: undefined })),
  ]

  tagged.sort(
    (a, b) => getSortKey(b.review, b.cmsIndex) - getSortKey(a.review, a.cmsIndex),
  )

  return tagged.map(({ review }) => review)
}
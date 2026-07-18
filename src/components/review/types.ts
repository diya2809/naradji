export type ReviewListItem = {
  id: string
  rating: number
  reviewText?: string | null
  createdAt: string
  reviewerName: string
  photos: Array<{ id: string; url: string; alt: string }>
  videos: Array<{ id: string; url: string }>
}

export type ProductReviewsData = {
  averageRating: string
  totalReviews: number
  reviews: ReviewListItem[]
}

'use client'

import React, { Component, type ErrorInfo, type ReactNode, useState } from 'react'
import { Star } from 'lucide-react'
import type { ProductReviewsData, ReviewListItem } from './types'

export type { ReviewListItem, ProductReviewsData } from './types'

type Props = ProductReviewsData

function safeReviewerInitial(name: unknown): string {
  if (typeof name !== 'string' || name.length === 0) return '?'
  return name.charAt(0).toUpperCase()
}

function safeFormatDate(date: unknown): string {
  if (!date || typeof date !== 'string') return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsed)
  } catch {
    return ''
  }
}

/** Local boundary so a review-panel bug cannot take down the product page. */
class ReviewsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ProductReviews] render failed', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="mt-2 text-sm text-muted-foreground">
          Reviews could not be loaded. Please refresh the page.
        </p>
      )
    }
    return this.props.children
  }
}

/** Text-only toggle under the size chart. */
export function ProductReviewsToggle({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="product-customer-reviews"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onOpenChange(!open)
      }}
      className="text-sm text-primary underline-offset-4 transition-colors hover:underline"
    >
      Review
    </button>
  )
}

function ReviewMedia({ review }: { review: ReviewListItem }) {
  const photos = Array.isArray(review.photos) ? review.photos : []
  const videos = Array.isArray(review.videos) ? review.videos : []

  if (photos.length === 0 && videos.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((photo) => {
        if (!photo?.url) return null
        return (
          <a
            key={photo.id || photo.url}
            href={photo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block h-16 w-16 overflow-hidden rounded-xl border border-border bg-muted transition-opacity hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.alt || 'Review photo'}
              className="h-full w-full object-cover"
            />
          </a>
        )
      })}
      {videos.map((video) => {
        if (!video?.url) return null
        return (
          <div
            key={video.id || video.url}
            className="relative h-16 w-16 overflow-hidden rounded-xl border border-border bg-muted"
          >
            <video src={video.url} className="h-full w-full object-cover" controls preload="metadata" />
          </div>
        )
      })}
    </div>
  )
}

/** Expanded list — must render outside any `position: sticky` ancestor. */
export function ProductReviewsContent({
  averageRating,
  totalReviews,
  reviews,
}: Props) {
  const list = Array.isArray(reviews) ? reviews : []
  const count = typeof totalReviews === 'number' ? totalReviews : list.length
  const avg = Number(averageRating)
  const averageStars = Number.isFinite(avg) ? Math.min(5, Math.max(0, Math.round(avg))) : 0
  const avgLabel = Number.isFinite(avg) ? avg.toFixed(1) : '0.0'

  if (count <= 0 && list.length === 0) {
    return null
  }

  return (
    <ReviewsErrorBoundary>
      <div id="product-customer-reviews" className="mt-2 border-t border-border pt-6">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
          Customer Reviews
        </h2>

        <div className="mb-6 flex items-center gap-3">
          <span className="text-3xl font-extrabold text-foreground">{avgLabel}</span>
          <div className="space-y-0.5">
            <div className="flex items-center gap-0.5" aria-hidden>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= averageStars
                      ? 'fill-primary text-primary'
                      : 'fill-none text-muted-foreground/20'
                  }`}
                  strokeWidth={2}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {count} {count === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {list.map((review, index) => {
            const name =
              typeof review?.reviewerName === 'string' && review.reviewerName
                ? review.reviewerName
                : 'Customer'
            const rating = typeof review?.rating === 'number' ? review.rating : 0
            const reviewDate = safeFormatDate(review?.createdAt)

            return (
              <div
                key={review?.id || `review-${index}`}
                className="space-y-3 border-t border-border/60 pt-6 first:border-0 first:pt-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-bold text-primary">
                      {safeReviewerInitial(name)}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">{name}</span>
                      {reviewDate ? (
                        <span className="block text-xs text-muted-foreground">{reviewDate}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= rating
                            ? 'fill-primary text-primary'
                            : 'fill-none text-muted-foreground/20'
                        }`}
                        strokeWidth={2}
                      />
                    ))}
                  </div>
                </div>

                {typeof review?.reviewText === 'string' && review.reviewText.trim() ? (
                  <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                    {review.reviewText}
                  </p>
                ) : null}

                <ReviewMedia review={review} />
              </div>
            )
          })}
        </div>
      </div>
    </ReviewsErrorBoundary>
  )
}

/** Standalone wrapper (button + content). Prefer split usage so content can sit outside sticky. */
export function ProductReviewsPanel(props: Props) {
  const [open, setOpen] = useState(false)

  if (!props || props.totalReviews <= 0) {
    return null
  }

  return (
    <div>
      <ProductReviewsToggle open={open} onOpenChange={setOpen} />
      {open ? <ProductReviewsContent {...props} /> : null}
    </div>
  )
}

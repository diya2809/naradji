import React from 'react'

import type { ReviewsBlock as ReviewsBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'

import { ReviewsClient } from './Component.client'
import { getApprovedSiteReviews } from './getApprovedSiteReviews'
import { mergeReviewsByLatest } from './mergeReviewsByLatest'
import type { ReviewItem } from './ReviewCard'

export const ReviewsBlock: React.FC<
  ReviewsBlockProps & {
    id?: DefaultDocumentIDType
  }
> = async (props) => {
  const { headline, mobileLayout, reviews, textAlign } = props

  const cmsReviews = (reviews ?? []) as ReviewItem[]
  const approvedSubmissions = await getApprovedSiteReviews()
  const mergedReviews = mergeReviewsByLatest(cmsReviews, approvedSubmissions)

  if (!mergedReviews.length) return null

  return (
    <ReviewsClient
      headline={headline}
      mobileLayout={mobileLayout}
      reviews={mergedReviews}
      textAlign={textAlign}
    />
  )
}

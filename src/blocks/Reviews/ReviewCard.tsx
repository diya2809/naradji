'use client'

import { Star } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Media } from '@/components/Media'
import type { Media as MediaType } from '@/payload-types'
import { cn } from '@/utilities/cn'

export type ReviewItem = {
  id?: string | null
  author: string
  text: string
  rating: number
  avatar?: (string | null) | MediaType
  createdAt?: string | null
}

type Props = {
  review: ReviewItem
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.min(5, Math.max(0, Math.round(rating)))

  return (
    <div aria-label={`${clamped} out of 5 stars`} className="flex gap-0.5" role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          className={cn(
            'size-5',
            i < clamped ? 'fill-primary text-primary' : 'fill-muted text-muted',
          )}
          key={i}
        />
      ))}
    </div>
  )
}

function useExpandableReview(text: string) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)

  const checkTruncation = useCallback(() => {
    const el = textRef.current
    if (!el || expanded) return
    setIsTruncated(el.scrollHeight > el.clientHeight + 1)
  }, [expanded])

  useEffect(() => {
    checkTruncation()
    const el = textRef.current
    if (!el) return

    const observer = new ResizeObserver(checkTruncation)
    observer.observe(el)
    return () => observer.disconnect()
  }, [checkTruncation, text])

  const canExpand = isTruncated && !expanded

  const expand = useCallback(() => {
    if (canExpand) setExpanded(true)
  }, [canExpand])

  return { textRef, expanded, canExpand, expand }
}

export const ReviewCard: React.FC<Props> = ({ review }) => {
  const avatar = review.avatar
  const hasAvatar = avatar && typeof avatar === 'object'
  const { textRef, expanded, canExpand, expand } = useExpandableReview(review.text)

  return (
    <article
      aria-expanded={canExpand ? false : expanded ? true : undefined}
      className={cn(
        'flex h-full min-h-56 flex-col gap-4 border border-border bg-background p-5 md:p-6',
        canExpand && 'cursor-pointer',
      )}
      onClick={() => expand()}
      onKeyDown={(event) => {
        if (!canExpand) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          expand()
        }
      }}
      role={canExpand ? 'button' : undefined}
      tabIndex={canExpand ? 0 : undefined}
    >
      <StarRating rating={review.rating} />

      <p
        ref={textRef}
        className={cn(
          'flex-1 text-sm leading-relaxed text-foreground md:text-base',
          !expanded && 'line-clamp-3',
        )}
      >
        {review.text}
      </p>

      <div className="flex items-center gap-3">
        {hasAvatar ? (
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
            <Media fill imgClassName="object-cover" resource={avatar} />
          </div>
        ) : (
          <div
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
          >
            {getInitials(review.author)}
          </div>
        )}
        <p className="text-sm font-semibold text-foreground md:text-base">{review.author}</p>
      </div>
    </article>
  )
}

'use client'

import { Plus, Star } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utilities/cn'

function StarPicker({
  rating,
  onChange,
  disabled,
}: {
  rating: number | null
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <div aria-label="Star rating" className="flex gap-0.5" role="group">
      {Array.from({ length: 5 }, (_, index) => {
        const star = index + 1
        const isFilled = rating !== null && star <= rating

        return (
          <button
            key={star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            className="rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            disabled={disabled}
            onClick={() => onChange(star)}
            type="button"
          >
            <Star
              className={cn(
                'size-5',
                isFilled ? 'fill-primary text-primary' : 'fill-muted text-muted',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export const WriteReviewCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [author, setAuthor] = useState('')
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setRating(null)
    setAuthor('')
    setText('')
    setIsOpen(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedAuthor = author.trim()
    const trimmedText = text.trim()

    if (rating === null) {
      toast.error('Please select a star rating.')
      return
    }

    if (!trimmedAuthor) {
      toast.error('Please enter your name.')
      return
    }

    if (!trimmedText) {
      toast.error('Please write your review.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/site-review-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: trimmedAuthor,
          text: trimmedText,
          rating,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.errors?.[0]?.message || 'Failed to submit review')
      }

      toast.success('Thank you! Your review has been submitted for approval.')
      resetForm()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className="flex h-full min-h-56 flex-col border border-border bg-background p-5 md:p-6">
      {!isOpen ? (
        <div className="flex flex-1 items-center justify-center">
          <Button
            aria-label="Write a review"
            onClick={() => setIsOpen(true)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      ) : (
        <form
          className="flex flex-1 flex-col gap-4"
          onPointerDownCapture={(event) => event.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Your rating</Label>
            <StarPicker disabled={isSubmitting} onChange={setRating} rating={rating} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold" htmlFor="site-review-author">
              Your name
            </Label>
            <Input
              autoComplete="name"
              disabled={isSubmitting}
              id="site-review-author"
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="Your name"
              required
              value={author}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold" htmlFor="site-review-text">
              Your review
            </Label>
            <Textarea
              className="min-h-24 resize-y"
              disabled={isSubmitting}
              id="site-review-text"
              onChange={(event) => setText(event.target.value)}
              placeholder="Share your experience"
              required
              value={text}
            />
          </div>

          <div className="mt-auto flex gap-2">
            <Button
              disabled={isSubmitting}
              onClick={resetForm}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              Submit
            </Button>
          </div>
        </form>
      )}
    </article>
  )
}
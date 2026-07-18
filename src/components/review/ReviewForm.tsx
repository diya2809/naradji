'use client'

import React, { useState, useRef } from 'react'
import { Star, UploadCloud, X, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/LoadingSpinner'

type Props = {
  productId: string
  onSuccess?: () => void
}

export const ReviewForm: React.FC<Props> = ({ productId, onSuccess }) => {
  const [rating, setRating] = useState<number | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingStage, setUploadingStage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (isSubmitting || rating === null) return

    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter(
        (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
      )
      setSelectedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadMedia = async (file: File): Promise<string> => {
    // Payload 3 multipart create expects non-file fields in `_payload` JSON,
    // not as top-level form keys (those are ignored → "Alt" required fails).
    const formData = new FormData()
    formData.append('file', file)
    formData.append(
      '_payload',
      JSON.stringify({
        alt: file.name ? `Review: ${file.name}` : 'Review media',
      }),
    )

    const response = await fetch('/api/media', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      const message =
        errData?.errors?.[0]?.message ||
        errData?.message ||
        `Failed to upload ${file.name}`
      throw new Error(message)
    }

    const data = await response.json()
    const id = data?.doc?.id
    if (!id) {
      throw new Error(`Upload succeeded but no media id returned for ${file.name}`)
    }
    return id
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === null) {
      toast.error('Please select a star rating first.')
      return
    }

    setIsSubmitting(true)
    setUploadingStage('Uploading media files...')

    try {
      const photoIds: string[] = []
      const videoIds: string[] = []

      // Separate and upload photos vs videos
      const photosToUpload = selectedFiles.filter((file) => file.type.startsWith('image/'))
      const videosToUpload = selectedFiles.filter((file) => file.type.startsWith('video/'))

      if (photosToUpload.length > 0) {
        setUploadingStage(`Uploading ${photosToUpload.length} photo(s)...`)
        for (const file of photosToUpload) {
          const id = await uploadMedia(file)
          photoIds.push(id)
        }
      }

      if (videosToUpload.length > 0) {
        setUploadingStage(`Uploading ${videosToUpload.length} video(s)...`)
        for (const file of videosToUpload) {
          const id = await uploadMedia(file)
          videoIds.push(id)
        }
      }

      setUploadingStage('Saving review...')

      // Server hook forces `user` from the session and `status: pending`.
      // Do not send client-controlled author/moderation fields.
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          product: productId,
          rating,
          reviewText,
          photos: photoIds,
          videos: videoIds,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.errors?.[0]?.message || 'Failed to submit review')
      }

      toast.success('Thank you! Your review has been submitted for approval.')
      setRating(null)
      setReviewText('')
      setSelectedFiles([])

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'An error occurred during submission.')
    } finally {
      setIsSubmitting(false)
      setUploadingStage('')
    }
  }

  const isFormEnabled = rating !== null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Star Rating (Always Visible) */}
      <div className="space-y-2 text-center py-4 bg-muted/10 rounded-2xl border border-border/40">
        <Label className="text-sm font-semibold block">Overall Rating *</Label>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = rating !== null && star <= rating
            return (
              <button
                key={star}
                type="button"
                className="p-1 focus:outline-none"
                onClick={() => setRating(star)}
                disabled={isSubmitting}
              >
                <Star
                  className={`h-9 w-9 transition-colors ${
                    isFilled ? 'fill-primary text-primary' : 'text-muted-foreground/30 fill-none'
                  }`}
                  strokeWidth={2}
                />
              </button>
            )}
          )}
        </div>
      </div>

      {/* Step 2: Review Text and Media Upload (Unlocked only after star selection) */}
      {isFormEnabled && (
        <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="space-y-2">
            <Label htmlFor="reviewText" className="text-sm font-semibold">Written Review</Label>
            <Textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[100px] resize-y"
            />
          </div>

          {/* Unified Upload Section (Compact Size) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Add Photos or Videos</Label>
            
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className="border border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/[0.01] rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="hidden"
              />
              
              <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center text-primary/60 border border-primary/10">
                <UploadCloud className="h-4 w-4" />
              </div>
              
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground">Drop your files here. <span className="text-primary cursor-pointer">or Browse</span></p>
              </div>
            </div>

            {/* Uploaded File Previews */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-2">
                {selectedFiles.map((file, idx) => {
                  const isImage = file.type.startsWith('image/')
                  const fileURL = isImage ? URL.createObjectURL(file) : ''
                  
                  return (
                    <div key={idx} className="relative aspect-square rounded-xl border border-border bg-muted overflow-hidden group">
                      {isImage ? (
                        <img src={fileURL} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center bg-primary/5 text-primary">
                          <Film className="h-5 w-5" />
                          <span className="text-[9px] font-semibold mt-0.5 truncate max-w-[90%] px-1">{file.name}</span>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(idx)
                        }}
                        className="absolute top-1 right-1 h-4.5 w-4.5 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-opacity"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {isSubmitting && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/50">
              <LoadingSpinner className="h-4 w-4 shrink-0" />
              <span>{uploadingStage}</span>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border/50">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Submit Review
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}

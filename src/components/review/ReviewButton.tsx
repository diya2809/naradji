'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ReviewForm } from './ReviewForm'
import { PencilLine } from 'lucide-react'

type Props = {
  productId: string
  productTitle: string
  className?: string
}

export const ReviewButton: React.FC<Props> = ({
  productId,
  productTitle,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className={className}>
          <PencilLine className="h-4 w-4 mr-2" />
          Write a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg rounded-4xl bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-semibold text-foreground">
            Review {productTitle}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share your experience with this product. Reviews are approved before going live.
          </DialogDescription>
        </DialogHeader>

        <ReviewForm
          productId={productId}
          onSuccess={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

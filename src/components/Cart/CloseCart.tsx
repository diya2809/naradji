import { XIcon } from 'lucide-react'
import React from 'react'
import { Button } from '@/components/ui/button'

export function CloseCart({ className }: { className?: string }) {
  return (
    <Button aria-label="Close cart" size="icon" variant="outline" className={className}>
      <XIcon className="h-5 w-5" />
    </Button>
  )
}

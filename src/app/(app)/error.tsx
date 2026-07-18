'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-12 max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <Button className="w-full" onClick={() => reset()} type="button">
        Try again
      </Button>
    </div>
  )
}

import { Grid } from '@/components/Grid'
import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

export default function Loading() {
  return (
    <Grid className="grid-cols-2 lg:grid-cols-3">
      {Array(12)
        .fill(0)
        .map((_, index) => {
          return <Skeleton className="h-full w-full" key={index} />
        })}
    </Grid>
  )
}

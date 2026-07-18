'use client'

import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** COD confirms in-checkout; this page is unused redirect fallback. */
export const ConfirmOrder: React.FC = () => {
  const router = useRouter()

  useEffect(() => {
    router.replace('/checkout')
  }, [router])

  return (
    <div className="flex w-full flex-col items-center justify-start gap-4 text-center">
      <h1 className="text-2xl">Redirecting…</h1>
      <LoadingSpinner className="h-6 w-12" />
    </div>
  )
}

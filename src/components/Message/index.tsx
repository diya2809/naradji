import React from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/utilities/cn'

export const Message: React.FC<{
  className?: string
  error?: React.ReactNode
  message?: React.ReactNode
  success?: React.ReactNode
  warning?: React.ReactNode
}> = ({ className, error, message, success, warning }) => {
  const messageToRender = message || error || success || warning

  if (!messageToRender) {
    return null
  }

  return (
    <Alert className={cn('my-8', className)} variant={error ? 'destructive' : 'default'}>
      <AlertDescription>{messageToRender}</AlertDescription>
    </Alert>
  )
}

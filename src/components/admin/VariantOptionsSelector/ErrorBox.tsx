'use client'

import { FieldError, useField } from '@payloadcms/ui'
import React from 'react'

type Props = {
  children: React.ReactNode
  existingOptions?: unknown
  path: string
}

export const ErrorBox: React.FC<Props> = ({ children, path }) => {
  const { errorMessage, showError } = useField({
    path,
  })

  return (
    <div className="variantOptionsSelectorError">
      <FieldError message={errorMessage} path={path} showError={showError} />
      <div
        className={['variantOptionsSelectorErrorWrapper', showError && 'showError']
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </div>
  )
}

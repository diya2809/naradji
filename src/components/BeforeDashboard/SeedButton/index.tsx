'use client'

import React, { Fragment, useCallback, useState, MouseEvent } from 'react'
import { toast } from '@payloadcms/ui'

import './index.scss'

const SuccessMessage: React.FC = () => (
  <div>
    Database seeded! You can now{' '}
    <a target="_blank" href="/">
      visit your website
    </a>
    {' · '}
    <a target="_blank" href="/shop">
      shop
    </a>
  </div>
)

export const SeedButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      if (seeded) {
        toast.info('Database already seeded.')
        return
      }
      if (loading) {
        toast.info('Seeding already in progress.')
        return
      }

      setLoading(true)
      setError(null)

      const run = (async () => {
        const res = await fetch('/next/seed', { method: 'POST', credentials: 'include' })
        const body = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean }
        if (!res.ok) {
          const msg =
            body.error ||
            (res.status === 403
              ? 'Admin login required before seeding.'
              : `Seed failed (${res.status})`)
          setError(msg)
          throw new Error(msg)
        }
        setSeeded(true)
        return true
      })()

      try {
        await toast.promise(run, {
          loading: 'Seeding with data....',
          success: <SuccessMessage />,
          error: (err: Error) => err?.message || 'An error occurred while seeding.',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    },
    [loading, seeded],
  )

  let message = ''
  if (loading) message = ' (seeding...)'
  if (seeded) message = ' (done!)'
  if (error) message = ` (error: ${error})`

  return (
    <Fragment>
      <button className="seedButton" onClick={handleClick} type="button" disabled={loading}>
        Seed your database
      </button>
      {message}
    </Fragment>
  )
}

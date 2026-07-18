'use client'

import { cn } from '@/utilities/cn'
import { fetchSessionUser } from '@/utilities/fetchSessionUser'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import type { User } from '@/payload-types'

const Title: React.FC = () => <span>Dashboard</span>

/**
 * Admin-only toolbar using the shared deduped session fetch.
 * PayloadAdminBar always performs its own /me request and cannot be bypassed.
 */
export const AdminBar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    void fetchSessionUser().then((sessionUser) => {
      setUser(sessionUser)
    })
  }, [])

  const isAdmin = Boolean(user?.roles?.includes('admin'))

  if (!isAdmin || !user) {
    return null
  }

  const cmsURL = process.env.NEXT_PUBLIC_SERVER_URL

  return (
    <div className={cn('bg-primary py-2 text-primary-foreground', 'block')}>
      <div className="container flex items-center justify-between gap-3 text-sm">
        <Link className="font-medium text-primary-foreground hover:underline" href={`${cmsURL}/admin`}>
          <Title />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            className="text-primary-foreground hover:underline"
            href={`${cmsURL}/admin/collections/users/${user.id}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {user.email}
          </Link>
          <Link
            className="text-primary-foreground hover:underline"
            href={`${cmsURL}/admin/logout`}
            rel="noopener noreferrer"
            target="_blank"
          >
            Logout
          </Link>
        </div>
      </div>
    </div>
  )
}

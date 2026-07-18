'use client'

import React from 'react'
import { AccountPanel } from '@/components/account/AccountPanel'
import { AccountForm } from '@/components/forms/AccountForm'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'
import { IconChevronRight } from '@tabler/icons-react'
import type { User } from '@/payload-types'

type Props = {
  user: User
}

export const AccountPageClient: React.FC<Props> = () => {
  const { logout } = useAuth()

  return (
    <>
      <AccountPanel>
        <h1 className="mb-6 text-3xl font-semibold md:mb-8">Account</h1>
        <AccountForm />
      </AccountPanel>

      <AccountPanel>
        <h2 className="mb-6 text-2xl font-semibold md:mb-8">Support</h2>
        <div className="flex flex-col gap-6 w-full max-w-xl">
          <a
            href="/find-order"
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:bg-muted/40"
          >
            <span className="font-medium text-foreground">Help Center</span>
            <IconChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>

          <div className="pt-2">
            <Button
              onClick={() => void logout()}
              className="w-fit px-4 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-all flex items-center justify-center"
            >
              Logout
            </Button>
          </div>
        </div>
      </AccountPanel>
    </>
  )
}

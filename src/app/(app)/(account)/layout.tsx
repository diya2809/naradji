import type { ReactNode } from 'react'

import { AccountNav } from '@/components/AccountNav'
import { MaxWidthWrapper } from '@/components/MaxWidthWrapper'
import { RenderParams } from '@/components/RenderParams'
import { getRequestUser } from '@/utilities/getRequestUser'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getRequestUser()

  return (
    <div>
      <MaxWidthWrapper>
        <RenderParams className="" />
      </MaxWidthWrapper>

      <MaxWidthWrapper className="flex flex-col gap-6 pb-8 pt-4 md:mt-16 md:flex-row md:gap-8 md:pt-0">
        {user ? (
          <>
            <AccountNav className="md:hidden" layout="toolbar" />
            <AccountNav
              className="hidden max-w-62 shrink-0 flex-col items-start gap-4 md:flex"
              layout="sidebar"
            />
          </>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-6 md:gap-12">{children}</div>
      </MaxWidthWrapper>
    </div>
  )
}

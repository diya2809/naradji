import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateHeader: GlobalAfterChangeHook = ({ req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidateTag('global_header', 'max')
  }
}

export const revalidateFooter: GlobalAfterChangeHook = ({ req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidateTag('global_footer', 'max')
  }
}

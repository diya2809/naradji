import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath } from 'next/cache'

import type { SiteReviewSubmission } from '@/payload-types'

function shouldRevalidateHomepage(
  doc: SiteReviewSubmission,
  previousDoc?: SiteReviewSubmission | null,
): boolean {
  if (doc.status === 'approved') return true
  if (previousDoc?.status === 'approved') return true
  return false
}

export const revalidateSiteReviewSubmissions: CollectionAfterChangeHook<SiteReviewSubmission> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && shouldRevalidateHomepage(doc, previousDoc)) {
    payload.logger.info('Revalidating homepage after site review submission change')
    revalidatePath('/')
  }

  return doc
}

export const revalidateSiteReviewSubmissionsDelete: CollectionAfterDeleteHook<SiteReviewSubmission> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && doc?.status === 'approved') {
    payload.logger.info('Revalidating homepage after approved site review submission delete')
    revalidatePath('/')
  }

  return doc
}
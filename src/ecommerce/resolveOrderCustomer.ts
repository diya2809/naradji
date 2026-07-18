import type { Payload, PayloadRequest } from 'payload'

export const getRelId = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: string | number }).id)
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  return null
}

const normalizeEmail = (email: unknown): string | undefined => {
  if (typeof email !== 'string') return undefined
  const trimmed = email.trim()
  return trimmed || undefined
}

export type ResolveOrderCustomerArgs = {
  customerEmail?: string | null
  payload: Payload
  req?: PayloadRequest
  transactionCustomer?: unknown
  transactionCustomerEmail?: string | null
  userId?: string | null
  userEmail?: string | null
}

export type ResolvedOrderCustomer = {
  customerId?: string
  customerEmail?: string
}

/**
 * Resolve the storefront customer linked to an order and the email used for
 * confirmations. Prefers the active session, then the payment transaction,
 * then a lookup on the linked user record (OTP / Google sign-in).
 */
export async function resolveOrderCustomerContact({
  customerEmail,
  payload,
  req,
  transactionCustomer,
  transactionCustomerEmail,
  userId,
  userEmail,
}: ResolveOrderCustomerArgs): Promise<ResolvedOrderCustomer> {
  const customerId = getRelId(userId) || getRelId(transactionCustomer) || undefined

  let resolvedEmail =
    normalizeEmail(customerEmail) ||
    normalizeEmail(userEmail) ||
    normalizeEmail(transactionCustomerEmail)

  if (!resolvedEmail && customerId) {
    try {
      const customerUser = await payload.findByID({
        collection: 'users',
        id: customerId,
        depth: 0,
        overrideAccess: true,
        ...(req ? { req } : {}),
      })
      resolvedEmail = normalizeEmail(customerUser?.email)
    } catch {
      // Best-effort; order creation / email hook can proceed without email.
    }
  }

  return {
    ...(customerId ? { customerId } : {}),
    ...(resolvedEmail ? { customerEmail: resolvedEmail } : {}),
  }
}
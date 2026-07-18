import type { User } from '@/payload-types'
import * as qs from 'qs-esm'

const apiBase = process.env.NEXT_PUBLIC_SERVER_URL

let sessionRequest: Promise<User | null> | null = null

async function clearInvalidAuthCookie(): Promise<void> {
  try {
    await fetch(`${apiBase}/api/users/logout`, {
      credentials: 'include',
      method: 'POST',
    })
  } catch {
    // Ignore — cookie may already be absent or logout unavailable.
  }
}

/**
 * Deduplicated client-side session fetch shared by Auth and AdminBar.
 */
export function fetchSessionUser(): Promise<User | null> {
  if (!sessionRequest) {
    const query = qs.stringify({
      depth: 0,
      select: {
        cart: true,
        email: true,
        id: true,
        name: true,
        roles: true,
      },
    })

    sessionRequest = fetch(`${apiBase}/api/users/me?${query}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          await clearInvalidAuthCookie()
          return null
        }

        if (!res.ok) {
          return null
        }

        const { user } = await res.json()

        return user || null
      })
      .catch(() => null)
  }

  return sessionRequest
}

export function resetSessionUserCache(): void {
  sessionRequest = null
}

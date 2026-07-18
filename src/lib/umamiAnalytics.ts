export function getUmamiAnalyticsConfig() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC?.trim()
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim()

  if (!src || !websiteId) return null

  return { src, websiteId }
}

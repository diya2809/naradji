import { getServerSideURL } from '@/utilities/getURL'

/* eslint-disable no-restricted-exports */
export default function robots() {
  const baseUrl = getServerSideURL()

  return {
    host: baseUrl,
    rules: [
      {
        userAgent: '*',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

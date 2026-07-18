import Script from 'next/script'

type UmamiAnalyticsProps = {
  src: string
  websiteId: string
}

export function UmamiAnalytics({ src, websiteId }: UmamiAnalyticsProps) {
  return <Script async data-website-id={websiteId} src={src} strategy="lazyOnload" />
}

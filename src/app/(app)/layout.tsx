import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Suspense } from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { NaradjiVoiceLayer } from '@/components/naradji/NaradjiVoiceLayer'
import { ensureStartsWith } from '@/utilities/ensureStartsWith'
import { getServerSideURL } from '@/utilities/getURL'
import { DEFAULT_OG_IMAGE_PATH } from '@/utilities/defaultOgImage'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { siteName } from '@/lib/site'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

const { TWITTER_CREATOR, TWITTER_SITE } = process.env
const twitterCreator = TWITTER_CREATOR ? ensureStartsWith(TWITTER_CREATOR, '@') : undefined
const twitterSite = TWITTER_SITE ? ensureStartsWith(TWITTER_SITE, 'https://') : undefined

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  description: 'Voice commerce storefront — shop normally, order with Naradji.',
  openGraph: mergeOpenGraph({
    siteName,
    title: siteName,
  }),
  robots: {
    follow: true,
    index: true,
  },
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  twitter: {
    card: 'summary_large_image',
    description: 'Voice commerce storefront — shop normally, order with Naradji.',
    images: [DEFAULT_OG_IMAGE_PATH],
    title: siteName,
    ...(twitterCreator && { creator: twitterCreator }),
    ...(twitterSite && { site: twitterSite }),
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={[GeistSans.variable, GeistMono.variable].filter(Boolean).join(' ')}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body
        className="min-h-screen bg-background text-foreground font-sans antialiased"
        suppressHydrationWarning
      >
        <TooltipProvider>
          <Providers>
            <LivePreviewListener />
            <AdminBar />

            <main className="relative flex min-h-screen flex-col">
              <Header />
              <div aria-hidden className="site-header-spacer shrink-0" />
              <div className="flex flex-1 flex-col">{children}</div>
              <Footer />
            </main>

            <Suspense fallback={null}>
              <NaradjiVoiceLayer />
            </Suspense>
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  )
}

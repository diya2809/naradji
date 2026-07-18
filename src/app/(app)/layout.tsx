import type { ReactNode } from 'react'
import { Suspense } from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { NaradjiVoiceLayer } from '@/components/naradji/NaradjiVoiceLayer'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import React from 'react'
import './globals.css'

/**
 * Full Payload ecommerce shell + Naradji voice layer on top.
 * Shop/browse/cart work normally; MicPill overlays every storefront page.
 */
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
      <body>
        <Providers>
          <AdminBar />
          <LivePreviewListener />
          <Header />
          <main>{children}</main>
          <Footer />
          {/* Ambient voice — does not replace the storefront */}
          <Suspense fallback={null}>
            <NaradjiVoiceLayer />
          </Suspense>
        </Providers>
      </body>
    </html>
  )
}

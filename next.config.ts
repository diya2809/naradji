import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/** Hosts Next/Image may optimize. Relative Payload media uses localPatterns + unoptimized. */
function imageRemotePatterns() {
  const patterns: { hostname: string; protocol: 'http' | 'https' }[] = [
    { hostname: 'naradji.vercel.app', protocol: 'https' },
    // Cloudflare R2 account endpoint (signed / absolute URLs if the S3 plugin emits them)
    {
      hostname: 'e1ce239ff634e2cf0202563891ede4df.r2.cloudflarestorage.com',
      protocol: 'https',
    },
    { hostname: 'localhost', protocol: 'http' },
  ]

  const seen = new Set(patterns.map((p) => `${p.protocol}://${p.hostname}`))

  for (const raw of [NEXT_PUBLIC_SERVER_URL, process.env.PAYLOAD_PUBLIC_SERVER_URL]) {
    if (!raw) continue
    try {
      const url = new URL(raw)
      const protocol = url.protocol.replace(':', '') as 'http' | 'https'
      if (protocol !== 'http' && protocol !== 'https') continue
      const key = `${protocol}://${url.hostname}`
      if (seen.has(key)) continue
      seen.add(key)
      patterns.push({ hostname: url.hostname, protocol })
    } catch {
      // ignore invalid env during config eval
    }
  }

  return patterns
}

const nextConfig: NextConfig = {
  // Hackathon demo: never fail `next build` on type errors.
  // ESLint is not run during Next 16 builds (use `pnpm lint` separately).
  typescript: {
    ignoreBuildErrors: true,
  },
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    // Match Asmi — Next 16 rejects qualities not listed here (Media uses 75/85, cards use 90).
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [128, 256, 384, 512],
    localPatterns: [
      // Omit `search` so `?v=<updatedAt>` cache-bust from Media Image is allowed.
      { pathname: '/api/media/file/**' },
      { pathname: '/logo.png' },
      { pathname: '/naradji/**' },
    ],
    qualities: [75, 85, 90],
    remotePatterns: imageRemotePatterns(),
  },
  reactStrictMode: true,
  redirects,
  async headers() {
    return [
      {
        source: '/api/media/file/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig)

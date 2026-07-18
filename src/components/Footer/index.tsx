import type { Footer } from '@/payload-types'

import { FooterMenu } from '@/components/Footer/menu'
import { FooterTrustBar } from '@/components/Footer/FooterTrustBar'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { siteName } from '@/lib/site'
import React, { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
)

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.519 0-9.387.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.868.507 9.387.507 9.387.507s7.519 0 9.387-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const PinterestIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.993 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.162 0 7.397 2.967 7.397 6.93 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
  </svg>
)

function getSocialIcon(platform: string) {
  switch (platform) {
    case 'instagram':
      return InstagramIcon
    case 'x':
      return XIcon
    case 'linkedin':
      return LinkedinIcon
    case 'youtube':
      return YoutubeIcon
    case 'facebook':
      return FacebookIcon
    case 'pinterest':
      return PinterestIcon
    default:
      return null
  }
}

export async function Footer() {
  const footer: Footer = await getCachedGlobal('footer', 1)()
  const sections =
    (
      footer as Footer & {
        sections?: Array<{
          id?: string | null
          heading?: string | null
          links?: Array<{
            id?: string | null
            link: {
              type?: 'custom' | 'reference' | null
              label?: string | null
              url?: string | null
              newTab?: boolean | null
              reference?: {
                relationTo: 'pages' | 'products' | 'categories'
                value: string | number | any
              } | null
            }
          }> | null
        }>
      }
    ).sections || []

  // Always brand from site config so stale CMS copyright cannot leak old names.
  const footerCopy = `© ${new Date().getFullYear()} ${siteName}`

  const socialLinks = (footer as { socialLinks?: Array<{
    id?: string
    platform: 'instagram' | 'x' | 'linkedin' | 'youtube' | 'facebook' | 'pinterest'
    url: string
  }> }).socialLinks

  const socialIconsContent =
    socialLinks && socialLinks.length > 0 ? (
      <div className="flex items-center gap-6 text-muted-foreground/60">
        {socialLinks.map((link, idx) => {
          const Icon = getSocialIcon(link.platform)
          return (
            <React.Fragment key={link.id || idx}>
              {idx > 0 && <span style={{ color: '#EBEBEB' }}>|</span>}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.platform}
                className="flex items-center justify-center p-1 transition-colors hover:text-primary"
              >
                {Icon && <Icon className="h-5 w-5" />}
              </a>
            </React.Fragment>
          )
        })}
      </div>
    ) : null

  const copyrightContent = <p>{footerCopy}</p>

  return (
    <footer className="bg-background text-sm text-muted-foreground">
      <FooterTrustBar />
      <div className="container relative">
        <div className="absolute top-4 right-4 z-20 hidden flex-col items-end gap-6 md:flex md:right-8 lg:right-12">
          <ThemeSelector />
          {socialIconsContent ? <div className="mt-12">{socialIconsContent}</div> : null}
        </div>

        <div className="mt-6 w-full pt-6 text-center text-sm lg:text-left">
          <Suspense
            fallback={
              <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            }
          >
            <FooterMenu sections={sections} />
          </Suspense>
        </div>

        <div className="mt-12 mb-8 flex flex-col items-center gap-8 md:hidden">
          <ThemeSelector />
          {socialIconsContent}
          <div className="mt-2 flex flex-col items-center justify-center gap-1 text-center">
            {copyrightContent}
          </div>
        </div>
      </div>

      <div className="mt-6 hidden border-t border-border py-8 md:block">
        <div className="container mx-auto flex w-full flex-col items-center justify-center gap-1 text-center">
          {copyrightContent}
        </div>
      </div>
    </footer>
  )
}

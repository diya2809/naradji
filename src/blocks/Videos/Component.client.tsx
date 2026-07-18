'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

import Link from 'next/link'
import { CarouselSectionHeader } from '@/components/CarouselSectionHeader'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import type { VideosBlock as VideosBlockProps, Media as MediaType } from '@/payload-types'
import { BlockWrapper } from '@/components/BlockWrapper'
import { cn } from '@/utilities/cn'

type Props = Pick<VideosBlockProps, 'headline' | 'mobileLayout' | 'videos' | 'textAlign'>

/**
 * Dev-only: append updatedAt to Payload media URLs so browsers that cached 404s
 * (before USE_S3_MEDIA) fetch a fresh URL. Production keeps plain doc.url / fallback.
 */
const resolveVideoUrl = (doc: MediaType | null | undefined): string => {
  if (!doc) return ''
  const base =
    doc.url ?? (doc.filename ? `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/media/${doc.filename}` : '')
  if (
    process.env.NODE_ENV === 'development' &&
    base &&
    doc.updatedAt &&
    base.startsWith('/api/media/file/')
  ) {
    const key = new Date(doc.updatedAt).getTime()
    return `${base}${base.includes('?') ? '&' : '?'}v=${key}`
  }
  return base
}

type CarouselVideoCardProps = {
  videoUrl: string
  isActive: boolean
  onEnded: () => void
  caption?: string | null
  onClick: () => void
  buttonLabel?: string | null
  buttonLinkType?: 'reference' | 'custom' | null
  buttonReference?: {
    relationTo: 'pages' | 'products' | 'categories'
    value: string | any
  } | null
  buttonUrl?: string | null
  buttonNewTab?: boolean | null
}

function VideoCaption({ caption, hasButton }: { caption: string; hasButton?: boolean }) {
  return (
    <div
      className={cn(
        'absolute inset-x-0 bg-gradient-to-t from-foreground/75 to-transparent p-4 transition-all duration-300',
        hasButton ? 'bottom-[8%]' : 'bottom-0',
      )}
      data-hero-overlay
    >
      <p className="line-clamp-2 text-sm font-medium text-foreground">{caption}</p>
    </div>
  )
}



const getButtonHref = (
  linkType?: 'reference' | 'custom' | null,
  reference?: { relationTo: 'pages' | 'products' | 'categories'; value: string | any } | null,
  url?: string | null,
) => {
  if (linkType === 'reference' && reference && reference.value) {
    if (reference.relationTo === 'categories') {
      const categoryId = typeof reference.value === 'object' ? reference.value.id : reference.value
      return `/shop?category=${categoryId}`
    }
    if (typeof reference.value === 'object' && reference.value?.slug) {
      const relationTo = reference.relationTo
      const slug = reference.value.slug
      return `${relationTo !== 'pages' ? `/${relationTo}` : ''}/${slug}`
    }
  }
  return url || ''
}

const CarouselVideoCard: React.FC<CarouselVideoCardProps> = ({
  videoUrl,
  isActive,
  onEnded,
  caption,
  onClick,
  buttonLabel,
  buttonLinkType,
  buttonReference,
  buttonUrl,
  buttonNewTab,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      video.play().catch((err) => {
        console.warn('Video playback was blocked or failed:', err)
      })
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [isActive])

  const href = getButtonHref(buttonLinkType, buttonReference, buttonUrl)
  const newTabProps = buttonNewTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={caption ? `Play video: ${caption}` : 'Play video'}
      className={cn(
        'group relative mx-auto aspect-[9/16] w-full max-w-xs cursor-pointer overflow-hidden rounded-lg border border-border bg-card text-left transition-all duration-300 sm:max-w-[280px] md:hover:scale-[1.02] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
        isActive ? 'scale-100 opacity-100' : 'scale-[0.85] opacity-95',
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        playsInline
        onEnded={onEnded}
        className="h-full w-full object-cover"
      />
      {caption ? <VideoCaption caption={caption} hasButton={Boolean(buttonLabel && href)} /> : null}
      {buttonLabel && href ? (
        <Link
          href={href}
          {...newTabProps}
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="absolute bottom-0 left-0 right-0 z-30 flex h-[8%] items-center justify-center bg-primary text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground transition-colors duration-300 hover:bg-primary/90"
        >
          {buttonLabel}
        </Link>
      ) : null}
    </div>
  )
}

type GridVideoCardProps = {
  videoUrl: string
  caption?: string | null
  onClick: () => void
  buttonLabel?: string | null
  buttonLinkType?: 'reference' | 'custom' | null
  buttonReference?: {
    relationTo: 'pages' | 'products' | 'categories'
    value: string | any
  } | null
  buttonUrl?: string | null
  buttonNewTab?: boolean | null
}

function GridVideoCard({
  videoUrl,
  caption,
  onClick,
  buttonLabel,
  buttonLinkType,
  buttonReference,
  buttonUrl,
  buttonNewTab,
}: GridVideoCardProps) {
  const href = getButtonHref(buttonLinkType, buttonReference, buttonUrl)
  const newTabProps = buttonNewTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={caption ? `Play video: ${caption}` : 'Play video'}
      className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-lg border border-border bg-card text-left outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <video src={videoUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
      {caption ? <VideoCaption caption={caption} hasButton={Boolean(buttonLabel && href)} /> : null}
      {buttonLabel && href ? (
        <Link
          href={href}
          {...newTabProps}
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="absolute bottom-0 left-0 right-0 z-30 flex h-[8%] items-center justify-center bg-primary text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground transition-colors duration-300 hover:bg-primary/90"
        >
          {buttonLabel}
        </Link>
      ) : null}
    </div>
  )
}

export const VideosClient: React.FC<Props> = ({ headline, mobileLayout, videos, textAlign }) => {
  const [activeVideo, setActiveVideo] = useState<MediaType | null>(null)
  const [isMobileSize, setIsMobileSize] = useState(false)
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    const checkSize = () => setIsMobileSize(window.innerWidth < 640)
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return
    setSelectedIndex(carouselApi.selectedScrollSnap())
    setCanScrollPrev(carouselApi.canScrollPrev())
    setCanScrollNext(carouselApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on('select', onSelect)
    api.on('reInit', onSelect)
    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api, onSelect])

  const items = videos || []
  const activeVideoUrl = activeVideo ? resolveVideoUrl(activeVideo) || null : null

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign ?? 'left'}>
      <CarouselSectionHeader
        canScrollLeft={canScrollPrev}
        canScrollRight={canScrollNext}
        nextLabel="Next video"
        onScrollLeft={() => api?.scrollPrev()}
        onScrollRight={() => api?.scrollNext()}
        previousLabel="Previous video"
        showControls={isMobileSize && items.length > 1}
        title={headline || 'In motion'}
      />

      {isMobileSize ? (
        <div className="w-full py-4">
          <Carousel
            className="w-full"
            opts={{
              align: 'center',
              loop: items.length > 1,
              slidesToScroll: 1,
            }}
            setApi={setApi}
          >
            <CarouselContent className="-ml-0">
              {items.map((item, index) => {
                const videoDoc = item.video as MediaType
                if (!videoDoc || typeof videoDoc !== 'object') return null

                const videoUrl = resolveVideoUrl(videoDoc)
                const isActive = selectedIndex === index

                return (
                  <CarouselItem className="basis-[78%] pl-0" key={videoDoc.id ?? index}>
                    <CarouselVideoCard
                      videoUrl={videoUrl}
                      isActive={isActive}
                      caption={item.caption}
                      onEnded={() => api?.scrollNext()}
                      onClick={() => setActiveVideo(videoDoc)}
                      buttonLabel={item.buttonLabel}
                      buttonLinkType={item.buttonLinkType}
                      buttonReference={item.buttonReference}
                      buttonUrl={item.buttonUrl}
                      buttonNewTab={item.buttonNewTab}
                    />
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </Carousel>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => {
            const videoDoc = item.video as MediaType
            if (!videoDoc || typeof videoDoc !== 'object') return null

            const videoUrl = resolveVideoUrl(videoDoc)

            return (
              <GridVideoCard
                key={videoDoc.id ?? index}
                videoUrl={videoUrl}
                caption={item.caption}
                onClick={() => setActiveVideo(videoDoc)}
                buttonLabel={item.buttonLabel}
                buttonLinkType={item.buttonLinkType}
                buttonReference={item.buttonReference}
                buttonUrl={item.buttonUrl}
                buttonNewTab={item.buttonNewTab}
              />
            )
          })}
        </div>
      )}

      <Dialog
        open={Boolean(activeVideo)}
        onOpenChange={(open) => {
          if (!open) setActiveVideo(null)
        }}
      >
        <DialogContent className="max-w-sm overflow-hidden p-0" showCloseButton>
          <DialogTitle className="sr-only">Fullscreen video</DialogTitle>
          {activeVideoUrl ? (
            <div className="relative aspect-[9/16] max-h-[85vh] w-full bg-background">
              <video
                src={activeVideoUrl}
                autoPlay
                loop
                muted={false}
                controls
                playsInline
                className="h-full w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </BlockWrapper>
  )
}

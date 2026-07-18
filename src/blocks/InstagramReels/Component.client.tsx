'use client'

import dynamic from 'next/dynamic'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { CarouselSectionHeader } from '@/components/CarouselSectionHeader'
import type { InstagramReelsBlock as InstagramReelsBlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'

const InstagramEmbed = dynamic(
  () => import('react-social-media-embed').then((mod) => mod.InstagramEmbed),
  {
    ssr: false,
    loading: () => (
      <div className="instagram-embed-skeleton h-[440px] w-[280px] shrink-0 bg-muted sm:w-[328px]" />
    ),
  },
)

type Props = Pick<InstagramReelsBlockProps, 'headline' | 'mobileLayout' | 'posts' | 'textAlign'>

function LazyInstagramEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [isVisible])

  return (
    <div
      className="instagram-embed-slide h-[440px] w-[280px] shrink-0 overflow-hidden sm:w-[328px]"
      ref={ref}
    >
      {isVisible ? (
        <InstagramEmbed
          captioned={false}
          height={440}
          style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}
          url={url}
          width={328}
        />
      ) : (
        <div
          aria-hidden
          className="instagram-embed-skeleton h-[440px] w-[280px] shrink-0 bg-muted sm:w-[328px]"
        />
      )}
    </div>
  )
}

export const InstagramReelsClient: React.FC<Props> = ({
  headline,
  mobileLayout,
  posts,
  textAlign,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  useEffect(() => {
    checkScrollability()
    window.addEventListener('resize', checkScrollability)
    return () => window.removeEventListener('resize', checkScrollability)
  }, [checkScrollability, posts])

  const scrollBy = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -340 : 340,
      behavior: 'smooth',
    })
  }

  if (!posts?.length) return null

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign ?? 'left'}>
      <CarouselSectionHeader
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
        nextLabel="Next Instagram post"
        onScrollLeft={() => scrollBy('left')}
        onScrollRight={() => scrollBy('right')}
        previousLabel="Previous Instagram post"
        showControls={posts.length > 1}
        title={headline || 'From our feed'}
      />

      <div
        className={cn(
          'flex gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none]',
          textAlign === 'center' && 'justify-center',
        )}
        onScroll={checkScrollability}
        ref={scrollRef}
      >
        {posts.map((post, index) => (
          <LazyInstagramEmbed key={post.id ?? `${post.url}-${index}`} url={post.url} />
        ))}
      </div>
    </BlockWrapper>
  )
}

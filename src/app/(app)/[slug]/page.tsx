import type { Metadata } from 'next'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { homeStaticData } from '@/endpoints/seed/home-static'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import { queryPageBySlug } from '@/utilities/queryPageBySlug'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Page } from '@/payload-types'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = pages.docs
    ?.filter((doc) => {
      return doc.slug !== 'home'
    })
    .map(({ slug }) => {
      return { slug }
    })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params }: Args) {
  const { slug = 'home' } = await params

  let page = await queryPageBySlug({ slug })

  if (!page && slug === 'home' && process.env.NODE_ENV === 'development') {
    page = homeStaticData() as Page
  }

  if (!page) {
    return notFound()
  }

  const { hero, layout } = page

  return (
    <>
      <article className="pb-12">
        <RenderHero {...hero} />
        <RenderBlocks blocks={layout} />
      </article>
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = 'home' } = await params

  const page = await queryPageBySlug({ slug })

  if (!page) {
    return { title: 'Page' }
  }

  return generateMeta({ doc: page })
}

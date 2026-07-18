import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import type { UpcommingEvents as UpcommingEventsBlockProps } from '@/payload-types'

import { BlockWrapper } from '@/components/BlockWrapper'
import { listingProductPopulate, listingProductSelect } from '@/utilities/fetchListingProducts'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { EventCard } from './EventCard'

export const UpcommingEventsBlock: React.FC<UpcommingEventsBlockProps & { id?: string | number }> = async ({
  desktopColumns,
  mobileColumns,
  mobileLayout,
  textAlign,
  title,
}) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: 3,
    overrideAccess: false,
    pagination: false,
    populate: listingProductPopulate,
    select: listingProductSelect,
    sort: '-createdAt',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  const products = result.docs
  if (!products.length) return null

  const desktopGrid =
    desktopColumns === '2'
      ? 'md:grid-cols-2'
      : desktopColumns === '4'
        ? 'md:grid-cols-4'
        : 'md:grid-cols-2 lg:grid-cols-3'

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign}>
      <BlockSectionHeading className="mb-6" title={title || 'Coming soon'} />
      <ul
        className={`grid grid-cols-1 gap-6 ${mobileColumns === '2' ? 'grid-cols-2' : ''} ${desktopGrid}`}
      >
        {products.map((product) => (
          <li key={product.id}>
            <EventCard product={product} />
          </li>
        ))}
      </ul>
    </BlockWrapper>
  )
}

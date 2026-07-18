import { StoreCanvas } from '@/components/naradji/StoreCanvas'
import { FALLBACK_CATALOG, getCatalog } from '@/lib/naradji/catalog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Naradji — the store you finish in one breath',
  description: 'Speak a grocery list. The storefront morphs. COD with haan pakka.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  const demo = sp.demo === '1' || sp.demo === 'true'
  let catalog = FALLBACK_CATALOG
  try {
    catalog = await getCatalog()
  } catch {
    catalog = FALLBACK_CATALOG
  }

  return <StoreCanvas initialCatalog={catalog} demo={demo} />
}

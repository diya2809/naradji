import { getCategories } from '@/utilities/fetchCategories'
import { getCachedGlobal } from '@/utilities/getGlobals'

import { HeaderClient } from './index.client'

export async function Header() {
  const [header, categories] = await Promise.all([getCachedGlobal('header', 1)(), getCategories()])

  return <HeaderClient categories={categories} header={header} />
}

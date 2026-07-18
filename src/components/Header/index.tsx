import { getCategories } from '@/utilities/fetchCategories'

import { HeaderClient } from './index.client'

export async function Header() {
  const categories = await getCategories()

  return <HeaderClient categories={categories} />
}

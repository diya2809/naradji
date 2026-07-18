import { describe, expect, it } from 'vitest'
import { parseSellerCatalogCsv, slugifyLabel } from '../../src/lib/catalog/sellerCatalog'

describe('seller catalog CSV', () => {
  it('parses rows and unique slugs', () => {
    const csv = `category,title,brand,pack_size,unit,price_inr,inventory,short_description,aliases,image_path,image_url,image_source
Dairy Items,Amul Milk 1L,Amul,1L,pack,54,200,Milk,"milk,doodh",/x.jpg,https://example.com/x.jpg,test
Dairy Items,Amul Milk 1L,Amul,1L,pack,54,200,Dup,"milk",,/,,
`
    const rows = parseSellerCatalogCsv(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0].slug).toBe('amul-milk-1l')
    expect(rows[1].slug).toBe('amul-milk-1l-2')
    expect(rows[0].aliases).toEqual(expect.arrayContaining(['milk', 'doodh']))
    expect(rows[0].priceInr).toBe(54)
  })

  it('slugifies categories', () => {
    expect(slugifyLabel('Fruits and Vegetables')).toBe('fruits-and-vegetables')
  })
})

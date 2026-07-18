import { describe, expect, it } from 'vitest'
import { homePageData } from '../../src/endpoints/seed/home'

const stubMedia = (id: string) =>
  ({
    id,
    alt: id,
    updatedAt: '',
    createdAt: '',
  }) as any

describe('home seed content', () => {
  it('seeds grocery voice commerce copy, not fashion leftovers', () => {
    const page = homePageData({
      heroImage: stubMedia('hero'),
      mobileHeroImage: stubMedia('mobile'),
      metaImage: stubMedia('meta'),
      carouselImages: [stubMedia('c1'), stubMedia('c2'), stubMedia('c3')],
      featuredProductIds: ['a', 'b', 'c'],
    })

    const blob = JSON.stringify(page)
    expect(blob).not.toMatch(/Corset|TA3|T-Shirt|Bow Hat|occasion wear/i)
    expect(blob).toMatch(/COD|haan pakka|atta|kirana|voice/i)
    expect(page.meta?.title).toMatch(/Naradji/i)
    expect(page.layout?.some((b: any) => b.blockType === 'videos')).toBe(false)
    expect(page.layout?.some((b: any) => b.blockType === 'instagramReels')).toBe(false)
  })
})

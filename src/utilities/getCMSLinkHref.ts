import type { Page, Product, Category } from '@/payload-types'

export type CMSLinkReference = {
  relationTo: 'pages' | 'posts' | 'products' | 'categories'
  value: Page | Product | Category | string | number
}

export type CMSLinkFields = {
  type?: 'custom' | 'reference' | null
  url?: string | null
  reference?: CMSLinkReference | null
}

export function getCMSLinkHref(link?: CMSLinkFields | null): string | null {
  if (!link) return null

  if (link.type === 'custom' && link.url) {
    return link.url
  }

  if (link.type === 'reference' && link.reference?.value) {
    const { relationTo, value } = link.reference

    if (relationTo === 'categories') {
      const categoryId = typeof value === 'object' ? value.id : value
      return `/shop?category=${categoryId}`
    }

    if (typeof value === 'object' && 'slug' in value && value.slug) {
      return `${relationTo !== 'pages' ? `/${relationTo}` : ''}/${value.slug}`
    }
  }

  return null
}

export function getCMSLinkTabProps(newTab?: boolean | null) {
  return newTab ? { rel: 'noopener noreferrer', target: '_blank' as const } : {}
}

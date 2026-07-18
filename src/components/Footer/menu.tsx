import { CMSLink } from '@/components/Link'
import React from 'react'

type FooterSection = {
  id?: string | null
  heading?: string | null
  links?: Array<{
    id?: string | null
    link: {
      type?: 'custom' | 'reference' | null
      label?: string | null
      url?: string | null
      newTab?: boolean | null
      reference?: { relationTo: 'pages' | 'products' | 'categories'; value: string | number | any } | null
    }
  }> | null
}

interface Props {
  sections: FooterSection[]
}

export function FooterMenu({ sections }: Props) {
  if (!sections?.length) return null

  return (
    <nav className="flex flex-col sm:flex-row justify-center lg:justify-start gap-10 lg:gap-24 text-center lg:text-left">
      {sections.map((section, sectionIndex) => {
        const heading = section.heading?.trim()
        const links = section.links || []
        if (!heading || !links.length) return null

        return (
          <div
            className="flex flex-col items-center lg:items-start"
            key={section.id || `${heading}-${sectionIndex}`}
          >
            <h3 className="mb-2 text-sm font-semibold text-foreground">{heading}</h3>
            <ul className="flex flex-col items-center gap-1 lg:items-start">
              {links.map((item, itemIndex) => (
                <li key={item.id || `${heading}-link-${itemIndex}`}>
                  <CMSLink appearance="ghost" size="sm" {...item.link} />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

import type { Form } from '@/payload-types'

import { RequiredDataFromCollectionSlug } from 'payload'

import { richText } from './richtext'

type ContactPageArgs = {
  contactForm: Form
}

export const contactPageData: (args: ContactPageArgs) => RequiredDataFromCollectionSlug<'pages'> = ({
  contactForm,
}) => {
  return {
    slug: 'contact',
    title: 'Contact',
    _status: 'published',
    hero: {
      type: 'lowImpact',
      richText: richText('Say hello', 'h1'),
    },
    layout: [
      {
        blockType: 'formBlock',
        enableIntro: true,
        form: contactForm,
        introContent: richText("We'd love to hear from you — custom sizing, bulk orders, or a gentle hello.", 'h3'),
      },
    ],
  }
}

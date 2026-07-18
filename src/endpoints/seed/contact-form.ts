import { RequiredDataFromCollectionSlug } from 'payload'

import { richText } from './richtext'

export const contactFormData: () => RequiredDataFromCollectionSlug<'forms'> = () => {
  return {
    confirmationMessage: richText('Thank you — the Naradji team has received your message and will reply shortly.'),
    confirmationType: 'message',
    emails: [
      {
        emailFrom: '"Naradji" <hello@naradji.app>',
        emailTo: '{{email}}',
        message: richText(
          'We received your message and will respond within 1–2 business days with next steps.',
        ),
        subject: 'We received your message — Naradji',
      },
    ],
    fields: [
      {
        name: 'full-name',
        blockName: 'full-name',
        blockType: 'text',
        label: 'Full Name',
        required: true,
        width: 100,
      },
      {
        name: 'email',
        blockName: 'email',
        blockType: 'email',
        label: 'Email',
        required: true,
        width: 100,
      },
      {
        name: 'phone',
        blockName: 'phone',
        blockType: 'number',
        label: 'Phone',
        required: false,
        width: 100,
      },
      {
        name: 'message',
        blockName: 'message',
        blockType: 'textarea',
        label: 'How can we help?',
        required: true,
        width: 100,
      },
    ],
    submitButtonLabel: 'Send Message',
    title: 'Contact Naradji',
  }
}

import type { Field } from 'payload'

type ResponsiveMediaOptions = {
  desktopLabel?: string
  mobileLabel?: string
  required?: boolean
}

export function responsiveMediaFields(options: ResponsiveMediaOptions = {}): Field[] {
  const {
    desktopLabel = 'Desktop Image',
    mobileLabel = 'Mobile Image',
    required = false,
  } = options

  return [
    {
      name: 'media',
      type: 'upload',
      admin: {
        description: 'Shown on tablet and desktop (md breakpoint and up).',
      },
      label: desktopLabel,
      relationTo: 'media',
      required,
    },
    {
      name: 'mobileMedia',
      type: 'upload',
      admin: {
        description: 'Optional. Shown on small screens. Falls back to the desktop image when empty.',
      },
      label: mobileLabel,
      relationTo: 'media',
    },
  ]
}

export function responsiveImagePairFields(options: {
  desktopName?: string
  mobileName?: string
  desktopLabel?: string
  mobileLabel?: string
  required?: boolean
} = {}): Field[] {
  const {
    desktopName = 'image',
    mobileName = 'mobileImage',
    desktopLabel = 'Desktop Image',
    mobileLabel = 'Mobile Image',
    required = false,
  } = options

  return [
    {
      name: desktopName,
      type: 'upload',
      admin: {
        description: 'Shown on tablet and desktop (md breakpoint and up).',
      },
      label: desktopLabel,
      relationTo: 'media',
      required,
    },
    {
      name: mobileName,
      type: 'upload',
      admin: {
        description: 'Optional. Shown on small screens. Falls back to the desktop image when empty.',
      },
      label: mobileLabel,
      relationTo: 'media',
    },
  ]
}

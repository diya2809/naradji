import type { Field } from 'payload'

export const mobileLayoutField: Field = {
  name: 'mobileLayout',
  type: 'select',
  defaultValue: 'default',
  label: 'Mobile Layout',
  options: [
    { label: 'Default', value: 'default' },
    { label: 'Compact spacing', value: 'compact' },
    { label: 'Hide on mobile', value: 'hideMobile' },
    { label: 'Hide on desktop', value: 'hideDesktop' },
  ],
}

export const mobileColumnsField: Field = {
  name: 'mobileColumns',
  type: 'select',
  defaultValue: '1',
  label: 'Mobile Columns',
  options: [
    { label: '1 Column', value: '1' },
    { label: '2 Columns', value: '2' },
  ],
}

export const desktopColumnsField: Field = {
  name: 'desktopColumns',
  type: 'select',
  defaultValue: 'auto',
  label: 'Desktop Columns',
  options: [
    { label: 'Auto (block default)', value: 'auto' },
    { label: '1 Column', value: '1' },
    { label: '2 Columns', value: '2' },
    { label: '3 Columns', value: '3' },
    { label: '4 Columns', value: '4' },
    { label: '6 Columns', value: '6' },
  ],
}

export const textAlignField: Field = {
  name: 'textAlign',
  type: 'select',
  defaultValue: 'auto',
  label: 'Text Alignment',
  options: [
    { label: 'Auto', value: 'auto' },
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
}

export const imagePositionField: Field = {
  name: 'imagePosition',
  type: 'select',
  defaultValue: 'left',
  label: 'Image Position (desktop)',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
  ],
}

export const mobileImagePositionField: Field = {
  name: 'mobileImagePosition',
  type: 'select',
  defaultValue: 'top',
  label: 'Image Position (mobile)',
  options: [
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Hidden', value: 'hidden' },
  ],
}

export const blockStyleFields: Field[] = [
  mobileLayoutField,
  mobileColumnsField,
  desktopColumnsField,
  textAlignField,
]

export const mediaBlockStyleFields: Field[] = [
  ...blockStyleFields,
  imagePositionField,
  mobileImagePositionField,
]

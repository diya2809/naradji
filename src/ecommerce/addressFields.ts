import type { Field } from 'payload'

/** India delivery fields shared by addresses, orders, and transactions. */
export const addressFields = (): Field[] => [
  {
    name: 'name',
    type: 'text',
    label: 'Full name',
    required: true,
  },
  {
    name: 'phone',
    type: 'text',
    label: 'Phone number',
    required: true,
  },
  {
    name: 'alternatePhone',
    type: 'text',
    label: 'Alternate phone number',
    required: false,
  },
  {
    name: 'addressLine1',
    type: 'text',
    label: 'Flat, house no.',
    required: true,
  },
  {
    name: 'addressLine2',
    type: 'text',
    label: 'Apartment, area, sector, village',
    required: true,
  },
  {
    name: 'city',
    type: 'text',
    label: 'City',
    required: true,
  },
  {
    name: 'state',
    type: 'text',
    label: 'State',
    required: true,
  },
  {
    name: 'postalCode',
    type: 'text',
    label: 'Pincode',
    required: true,
  },
  {
    name: 'country',
    type: 'text',
    label: 'Country',
    required: true,
  },
]

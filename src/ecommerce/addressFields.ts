import type { Field } from 'payload'

/** India delivery fields shared by addresses, orders, and transactions.
 * All optional — demo/voice checkout must accept partial or empty addresses. */
export const addressFields = (): Field[] => [
  {
    name: 'name',
    type: 'text',
    label: 'Full name',
    required: false,
  },
  {
    name: 'phone',
    type: 'text',
    label: 'Phone number',
    required: false,
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
    required: false,
  },
  {
    name: 'addressLine2',
    type: 'text',
    label: 'Apartment, area, sector, village',
    required: false,
  },
  {
    name: 'city',
    type: 'text',
    label: 'City',
    required: false,
  },
  {
    name: 'state',
    type: 'text',
    label: 'State',
    required: false,
  },
  {
    name: 'postalCode',
    type: 'text',
    label: 'Pincode',
    required: false,
  },
  {
    name: 'country',
    type: 'text',
    label: 'Country',
    required: false,
  },
]

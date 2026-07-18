import type { Form, FormBlock } from '@/payload-types'

/** Narrow `form` relationship when depth populated the form document. */
export function isPopulatedForm(form: FormBlock['form']): form is Form {
  return typeof form === 'object' && form !== null && 'fields' in form
}

import { format, isValid } from 'date-fns'

type Props = {
  date: string
  format?: string
}

export const formatDateTime = ({ date, format: formatFromProps }: Props): string => {
  if (!date) return ''

  const parsed = new Date(date)
  if (!isValid(parsed)) return ''

  const dateFormat = formatFromProps ?? 'dd/MM/yyyy'

  try {
    return format(parsed, dateFormat)
  } catch {
    return ''
  }
}

import { OrderStatus as StatusOptions } from '@/payload-types'
import { Badge } from '@/components/ui/badge'

type Props = {
  status: StatusOptions
  className?: string
}

export const OrderStatus: React.FC<Props> = ({ status, className }) => {
  const variant = status === 'completed' ? 'default' : status === 'processing' ? 'secondary' : 'outline'

  return (
    <Badge className={className} variant={variant}>
      {status}
    </Badge>
  )
}

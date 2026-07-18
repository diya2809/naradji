import { cn } from '@/utilities/cn'

type Props = {
  title: string
  className?: string
}

/** Shared h2 for CMS block section titles — keep in sync with DESIGN.md block headings. */
export function BlockSectionHeading({ title, className }: Props) {
  return <h2 className={cn('text-2xl font-semibold text-foreground md:text-3xl', className)}>{title}</h2>
}

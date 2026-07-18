import clsx from 'clsx'
import React from 'react'

import { Price } from '@/components/Price'

type Props = {
  amount: number
  position?: 'bottom' | 'center'
  title: string
}

export const Label: React.FC<Props> = ({ amount, position = 'bottom', title }) => {
  return (
    <div
      className={clsx('absolute bottom-0 left-0 flex w-full px-4 pb-4 @container/label', {
        '': position === 'center',
      })}
    >
      <div className="grow text-sm font-medium">
        <h3 className="mr-4 line-clamp-2 rounded-md bg-background/90 px-3 py-2 leading-none text-foreground">
          {title}
        </h3>

        <Price
          amount={amount}
          className="mt-2 inline-flex rounded-md bg-primary px-3 py-2 text-primary-foreground"
          currencyCodeClassName="hidden @[275px]/label:inline"
        />
      </div>
    </div>
  )
}

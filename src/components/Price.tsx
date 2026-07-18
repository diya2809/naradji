'use client'
import { formatInrAmount } from '@/lib/inrCurrency'
import React from 'react'

type BaseProps = {
  className?: string
  currencyCodeClassName?: string
  as?: 'span' | 'p'
}

type PriceFixed = {
  amount: number
  currencyCode?: string
  highestAmount?: never
  lowestAmount?: never
}

type PriceRange = {
  amount?: never
  currencyCode?: string
  highestAmount: number
  lowestAmount: number
}

type Props = BaseProps & (PriceFixed | PriceRange)

/** Drop ".00" when the amount has no fractional cents (e.g. ₹1,500 instead of ₹1,500.00). */
const stripZeroCents = (formatted: string) => formatted.replace(/\.00$/, '')

const splitFormattedPrice = (formatted: string): { main: string; fraction: string } => {
  const match = formatted.match(/^(.+?\d+\.)(\d+)$/)

  if (match) {
    return { main: match[1], fraction: match[2] }
  }

  return { main: formatted, fraction: '' }
}

const FormattedPrice = ({ formatted }: { formatted: string }) => {
  const { main, fraction } = splitFormattedPrice(formatted)

  return (
    <>
      <span className="font-semibold">{main}</span>
      {fraction ? <span className="font-normal">{fraction}</span> : null}
    </>
  )
}

export const Price = ({
  amount,
  className,
  highestAmount,
  lowestAmount,
  as = 'p',
}: Props & React.ComponentProps<'p'>) => {
  const Element = as

  const formatDisplayAmount = (value: number) => stripZeroCents(formatInrAmount(value))

  if (typeof amount === 'number') {
    return (
      <Element className={className}>
        <FormattedPrice formatted={formatDisplayAmount(amount)} />
      </Element>
    )
  }

  if (highestAmount && highestAmount !== lowestAmount) {
    return (
      <Element className={className}>
        <FormattedPrice formatted={formatDisplayAmount(lowestAmount)} />
        <span className="font-normal"> - </span>
        <FormattedPrice formatted={formatDisplayAmount(highestAmount)} />
      </Element>
    )
  }

  if (lowestAmount) {
    return (
      <Element className={className}>
        <FormattedPrice formatted={formatDisplayAmount(lowestAmount)} />
      </Element>
    )
  }

  return null
}

type FlattenCartInput = {
  items: Array<{
    id?: string
    product: unknown
    quantity: number
    variant?: unknown
    [key: string]: unknown
  }>
}

export const flattenCartItems = (cart: FlattenCartInput) => {
  return cart.items.map((item) => {
    const productID =
      typeof item.product === 'object' && item.product !== null && 'id' in item.product
        ? (item.product as { id: string }).id
        : item.product
    const variantID =
      item.variant && typeof item.variant === 'object' && item.variant !== null && 'id' in item.variant
        ? (item.variant as { id: string }).id
        : item.variant

    const { product: _product, variant: _variant, ...customProperties } = item

    return {
      ...customProperties,
      product: productID,
      quantity: item.quantity,
      ...(variantID ? { variant: variantID } : {}),
    }
  })
}

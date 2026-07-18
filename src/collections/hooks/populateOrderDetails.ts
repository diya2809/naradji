import type {
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  PayloadRequest,
} from 'payload'
import { getShippingCharge } from '@/lib/shippingCharge'

type OrderItemLike = {
  product?: unknown
  variant?: unknown
  quantity?: number | null
}

const getRelId = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: string | number }).id)
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  return null
}

const resolveCustomerFields = async (
  data: Record<string, unknown>,
  req: PayloadRequest,
): Promise<void> => {
  const customerId = getRelId(data.customer)
  if (!customerId) return

  try {
    const customerUser = await req.payload.findByID({
      collection: 'users',
      id: customerId,
      depth: 0,
      req,
    })

    if (!customerUser) return

    // Prefer a real name; fall back to email so the admin list is never blank.
    const resolvedName =
      (typeof customerUser.name === 'string' && customerUser.name.trim()) ||
      customerUser.email ||
      null

    if (resolvedName && !data.customerName) {
      data.customerName = resolvedName
    }
    if (customerUser.email && !data.customerEmail) {
      data.customerEmail = customerUser.email
    }
    if ((customerUser as { customerPhone?: string | null }).customerPhone && !data.customerPhone) {
      data.customerPhone = (customerUser as { customerPhone?: string | null }).customerPhone
    }
  } catch (err) {
    req.payload.logger.error(`Error resolving order customer details: ${err}`)
  }
}

const resolveProductNames = async (
  items: OrderItemLike[] | null | undefined,
  req: PayloadRequest,
): Promise<string | null> => {
  if (!items?.length) return null

  const titles: string[] = []

  for (const item of items) {
    // Prefer already-populated product title to avoid an extra fetch.
    if (item.product && typeof item.product === 'object' && item.product !== null && 'title' in item.product) {
      const title = (item.product as { title?: string | null }).title
      if (title) {
        const qty = Number(item.quantity || 1)
        titles.push(qty > 1 ? `${title} ×${qty}` : title)
        continue
      }
    }

    const productId = getRelId(item.product)
    if (!productId) continue

    try {
      const product = await req.payload.findByID({
        collection: 'products',
        id: productId,
        depth: 0,
        req,
      })
      if (product?.title) {
        const qty = Number(item.quantity || 1)
        titles.push(qty > 1 ? `${product.title} ×${qty}` : product.title)
      }
    } catch {
      // Skip missing products
    }
  }

  return titles.length ? titles.join(', ') : null
}

/**
 * Before create/update: denormalize customer + product display fields,
 * and expand admin-created orders from adminProduct/adminVariant helpers.
 */
export const populateOrderDetails: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  const payload = req.payload

  try {
    // --- Admin order creation: build items/amount from helper fields ---
    if (data.adminProduct && data.adminVariant && data.customer) {
      if (data.adminAddress) {
        const addressId = getRelId(data.adminAddress)
        if (addressId) {
          const addressDoc = await payload.findByID({
            collection: 'addresses',
            id: addressId,
            depth: 0,
            req,
          })

          if (addressDoc) {
            data.shippingAddress = {
              name: addressDoc.name,
              phone: addressDoc.phone,
              alternatePhone: addressDoc.alternatePhone || null,
              addressLine1: addressDoc.addressLine1,
              addressLine2: addressDoc.addressLine2,
              city: addressDoc.city,
              state: addressDoc.state,
              postalCode: addressDoc.postalCode,
              country: addressDoc.country || 'IN',
            }

            if (addressDoc.name && !data.customerName) {
              data.customerName = addressDoc.name
            }
            if (addressDoc.phone && !data.customerPhone) {
              data.customerPhone = addressDoc.phone
            }
          }
        }
      }

      const variantId = getRelId(data.adminVariant)
      if (variantId) {
        const variantDoc = await payload.findByID({
          collection: 'variants',
          id: variantId,
          depth: 0,
          req,
        })

        const qty = Number(data.adminQuantity || 1)
        const price = variantDoc?.priceInINR || 0
        const productSubtotal = price * qty
        const shippingCharge = getShippingCharge(productSubtotal)

        data.items = [
          {
            product: getRelId(data.adminProduct),
            variant: variantId,
            quantity: qty,
          },
        ]

        data.amount = productSubtotal + shippingCharge
        data.shippingCharge = shippingCharge
        data.currency = 'INR'
      }
    }

    // Prefer contact details from the selected shipping address (delivery recipient).
    const shipping = data.shippingAddress as
      | { name?: string | null; phone?: string | null }
      | null
      | undefined
    if (shipping?.name && !data.customerName) {
      data.customerName = shipping.name
    }
    if (shipping?.phone && !data.customerPhone) {
      data.customerPhone = shipping.phone
    }

    // --- Always denormalize customer fields when a customer is linked ---
    await resolveCustomerFields(data as Record<string, unknown>, req)

    // Guest checkout may only have email — use local-part as a last resort label.
    if (!data.customerName && typeof data.customerEmail === 'string' && data.customerEmail) {
      data.customerName = data.customerEmail.split('@')[0] || data.customerEmail
    }

    // --- Always denormalize product titles for admin list column ---
    const productNames = await resolveProductNames(
      data.items as OrderItemLike[] | null | undefined,
      req,
    )
    if (productNames) {
      data.productNames = productNames
    }
  } catch (err) {
    payload.logger.error(`Error populating order details: ${err}`)
  }

  return data
}

/**
 * After read: backfill display fields for older orders that were created
 * before customerName / productNames were populated on write.
 */
export const backfillOrderDisplayFields: CollectionAfterReadHook = async ({
  doc,
  req,
}) => {
  if (!doc || typeof doc !== 'object') return doc

  const data = doc as Record<string, unknown>

  try {
    if (!data.customerName) {
      await resolveCustomerFields(data, req)
      if (!data.customerName && typeof data.customerEmail === 'string' && data.customerEmail) {
        data.customerName = data.customerEmail.split('@')[0] || data.customerEmail
      }
    }

    if (!data.productNames) {
      const productNames = await resolveProductNames(
        data.items as OrderItemLike[] | null | undefined,
        req,
      )
      if (productNames) {
        data.productNames = productNames
      }
    }
  } catch (err) {
    req.payload.logger.error(`Error backfilling order display fields: ${err}`)
  }

  return doc
}

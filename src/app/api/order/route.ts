import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCatalog } from '@/lib/naradji/catalog'
import { UISpecSchema } from '@/lib/naradji/uispec'
import { rupeesToMinor } from '@/lib/currency'

export const dynamic = 'force-dynamic'

/** Payload requires shipping fields; keep these internal and never ask in the voice demo. */
function demoFulfillmentAddress(phone?: string) {
  return {
    name: 'Naradji Demo',
    phone: phone || '0000000000',
    addressLine1: 'COD — address on call',
    addressLine2: 'Voice order',
    city: 'Ahmedabad',
    state: 'GJ',
    postalCode: '380001',
    country: 'IN',
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = UISpecSchema.safeParse(body?.uispec)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid uispec', details: parsed.error.flatten() }, { status: 400 })
  }

  const uispec = parsed.data
  if (!uispec.items.length) {
    return NextResponse.json({ error: 'no items' }, { status: 400 })
  }

  const catalog = await getCatalog()
  const byId = new Map(catalog.map((p) => [p.id, p]))
  const lines = uispec.items
    .map((item) => {
      const product = byId.get(item.id)
      if (!product) return null
      return {
        product,
        quantity: item.qty || 1,
        lineTotal: product.price * (item.qty || 1),
      }
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))

  if (!lines.length) {
    return NextResponse.json({ error: 'no valid catalog items' }, { status: 400 })
  }

  const amountRupees = lines.reduce((s, l) => s + l.lineTotal, 0)
  const amount = rupeesToMinor(amountRupees)
  const ship = demoFulfillmentAddress(body?.phone)

  try {
    const payload = await getPayload({ config })

    const productDocs = await Promise.all(
      lines.map(async (line) => {
        const { docs } = await payload.find({
          collection: 'products',
          where: { slug: { equals: line.product.slug } },
          limit: 1,
          depth: 0,
        })
        return { line, docId: docs[0]?.id as string | undefined }
      }),
    )

    const order = await payload.create({
      collection: 'orders',
      data: {
        status: 'processing',
        amount,
        currency: 'INR',
        customerEmail: body?.email || 'demo@naradji.local',
        items: productDocs.map(({ line, docId }) => ({
          product: docId || undefined,
          quantity: line.quantity,
        })),
        shippingAddress: {
          name: ship.name || 'Voice customer',
          phone: ship.phone || '0000000000',
          addressLine1: ship.addressLine1 || 'Voice address',
          addressLine2: ship.addressLine2 || 'Voice order',
          city: ship.city || 'Ahmedabad',
          state: ship.state || 'GJ',
          postalCode: ship.postalCode || '380001',
          country: ship.country || 'IN',
        },
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: amountRupees,
      currency: 'INR',
      payment: 'cod',
      items: lines.map((l) => ({
        id: l.product.id,
        title: l.product.title,
        qty: l.quantity,
        price: l.product.price,
      })),
    })
  } catch (err) {
    console.error('[order]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'order create failed' },
      { status: 500 },
    )
  }
}

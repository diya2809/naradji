import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCatalog } from '@/lib/naradji/catalog'
import { UISpecSchema, hasUsableShipping, type ShippingAddress } from '@/lib/naradji/uispec'
import { rupeesToMinor } from '@/lib/currency'

export const dynamic = 'force-dynamic'

function resolveShipping(
  fromSpec: ShippingAddress | null | undefined,
  body: { phone?: string; email?: string } | null,
): ShippingAddress {
  if (fromSpec && hasUsableShipping(fromSpec)) {
    return {
      name: fromSpec.name || 'Voice customer',
      phone: fromSpec.phone || body?.phone || '0000000000',
      addressLine1: fromSpec.addressLine1 || 'Voice address',
      addressLine2: fromSpec.addressLine2,
      city: fromSpec.city || 'Ahmedabad',
      state: fromSpec.state || 'GJ',
      postalCode: fromSpec.postalCode || '380001',
      country: fromSpec.country || 'IN',
    }
  }
  return {
    name: 'Naradji Demo',
    phone: body?.phone || '0000000000',
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

  const shipping = uispec.prefill?.shipping
  if (!hasUsableShipping(shipping)) {
    return NextResponse.json(
      {
        error: 'address_required',
        message: 'Boliye apna address — phir haan pakka.',
      },
      { status: 400 },
    )
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
  const ship = resolveShipping(shipping, body)

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
          addressLine2: ship.addressLine2 || undefined,
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
      shipping: ship,
      items: lines.map((l) => ({
        id: l.product.id,
        title: l.product.title,
        qty: l.quantity,
        price: l.product.price,
      })),
    })
  } catch (err) {
    console.error('[order]', err)
    const fakeId = `local-${Date.now()}`
    return NextResponse.json({
      orderId: fakeId,
      amount: amountRupees,
      currency: 'INR',
      payment: 'cod',
      mode: 'local-fallback',
      shipping: ship,
      items: lines.map((l) => ({
        id: l.product.id,
        title: l.product.title,
        qty: l.quantity,
        price: l.product.price,
      })),
      warning: err instanceof Error ? err.message : 'order create failed',
    })
  }
}

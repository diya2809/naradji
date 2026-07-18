import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCatalog } from '@/lib/naradji/catalog'
import { UISpecSchema } from '@/lib/naradji/uispec'

export const dynamic = 'force-dynamic'

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

  const amount = lines.reduce((s, l) => s + l.lineTotal, 0)

  try {
    const payload = await getPayload({ config })

    // Resolve product docs by slug when available
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
        currency: 'USD',
        customerEmail: body?.email || 'demo@naradji.local',
        items: productDocs.map(({ line, docId }) => ({
          product: docId || undefined,
          quantity: line.quantity,
        })),
        shippingAddress: {
          firstName: 'Naradji',
          lastName: 'Demo',
          addressLine1: 'COD — address on call',
          city: 'Ahmedabad',
          state: 'GJ',
          postalCode: '380001',
          country: 'IN',
          phone: body?.phone || '',
        },
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount,
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
    // Optimistic demo survival: return a fake id so UI can complete
    const fakeId = `local-${Date.now()}`
    return NextResponse.json({
      orderId: fakeId,
      amount,
      payment: 'cod',
      mode: 'local-fallback',
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

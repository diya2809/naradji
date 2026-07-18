import { redirect } from 'next/navigation'

/** Stripe checkout hidden for COD-only Naradji demo. */
export default function CheckoutPage() {
  redirect('/')
}

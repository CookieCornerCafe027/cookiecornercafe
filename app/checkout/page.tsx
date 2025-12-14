import { Header } from "@/components/header"
import { CheckoutForm } from "@/components/checkout-form"

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>
}) {
  const params = await searchParams

  return (
    <>
      <Header />
      <main className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>
          {params.canceled && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              Payment was canceled. Your cart is still saved — you can try again when ready.
            </div>
          )}
          <CheckoutForm />
        </div>
      </main>
    </>
  )
}

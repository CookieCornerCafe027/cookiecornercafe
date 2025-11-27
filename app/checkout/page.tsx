import { Header } from "@/components/header"
import { CheckoutForm } from "@/components/checkout-form"

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>
          <CheckoutForm />
        </div>
      </main>
    </>
  )
}

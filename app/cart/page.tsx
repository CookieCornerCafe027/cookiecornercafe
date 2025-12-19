import { Header } from "@/components/header"
import { CartContent } from "@/components/cart-content"

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-bold mb-8">Your Cart</h1>
          <CartContent />
        </div>
      </main>
    </>
  )
}

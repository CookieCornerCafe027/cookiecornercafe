import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { ClearCartOnSuccess } from "@/components/clear-cart-on-success"

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const params = await searchParams

  return (
    <>
      <Header />
      <ClearCartOnSuccess />
      <main className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-3xl">Order Placed Successfully!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Thank you for your order! We've received your request and will be in touch soon.
              </p>
              {params.orderId && (
                <p className="text-sm text-muted-foreground">
                  Order ID: <span className="font-mono">{params.orderId}</span>
                </p>
              )}
              <p className="text-sm">You'll receive a confirmation email shortly with your order details.</p>
              <Button asChild className="mt-6">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin-header"
import { ProductManager } from "@/components/product-manager"

export default async function AdminPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch all products (including inactive)
  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false })

  // Fetch recent orders
  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(10)

  return (
    <>
      <AdminHeader user={data.user} />
      <main className="container mx-auto py-8">
        <h1 className="text-3xl font-display font-bold mb-8">Admin Dashboard</h1>

        <div className="grid gap-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Recent Orders</h2>
            <div className="bg-card rounded-lg border">
              {orders && orders.length > 0 ? (
                <div className="divide-y">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                          <p className="text-sm">
                            {order.delivery_type === "pickup" ? "Pickup" : "Delivery"} -{" "}
                            {new Date(order.pickup_delivery_time).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">${order.price_paid.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-8 text-center text-muted-foreground">No orders yet</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Product Management</h2>
            <ProductManager products={products || []} />
          </section>
        </div>
      </main>
    </>
  )
}

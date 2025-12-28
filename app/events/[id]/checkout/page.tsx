import { Header } from "@/components/header";
import { EventCheckoutForm } from "@/components/event-checkout-form";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ qty?: string }>;
}

export default async function EventCheckoutPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("id,title,price_per_entry")
    .eq("id", id)
    .single();

  if (error || !event) {
    notFound();
  }

  const qtyFromQuery = Number.parseInt(sp.qty ?? "", 10);
  const initialQuantity = Number.isFinite(qtyFromQuery) && qtyFromQuery > 0 && qtyFromQuery <= 99 ? qtyFromQuery : 1;

  return (
    <>
      <Header />
      <main className="container mx-auto py-8 px-0 sm:px-4">
        <div className="max-w-2xl mx-auto">
          <EventCheckoutForm event={event as any} initialQuantity={initialQuantity} />
        </div>
      </main>
    </>
  );
}


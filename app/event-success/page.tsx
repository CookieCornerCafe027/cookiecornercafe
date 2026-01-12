import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default async function EventSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ registrationId?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-3xl">
                You’re registered for the event!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Thanks! Your payment was received and your spot is confirmed.
              </p>
              {params.registrationId && (
                <p className="text-sm text-muted-foreground">
                  Registration ID:{" "}
                  <span className="font-mono">{params.registrationId}</span>
                </p>
              )}
              <Button asChild className="mt-6">
                <Link href="/events">Back to Events</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}





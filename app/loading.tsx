"use client";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground gap-4">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary"
        role="status"
        aria-label="Loading"
      />
      <div className="text-center space-y-1">
        <p className="text-lg font-semibold">Loading our creations…</p>
        <p className="text-sm text-muted-foreground">
          Fetching cakes, cookies, and events. Just a moment.
        </p>
      </div>
    </div>
  );
}


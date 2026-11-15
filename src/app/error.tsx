"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        The page could not be loaded. If you are running locally, check that the database is up (<code>docker compose up -d</code>) and migrated (
        <code>npm run db:migrate</code>).
      </p>
      {error.digest && <p className="font-mono text-xs text-muted-foreground">ref: {error.digest}</p>}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

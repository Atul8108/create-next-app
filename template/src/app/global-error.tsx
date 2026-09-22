"use client";

import { useEffect } from "react";
import { logError } from "@/lib/errors/log-error";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logError(error);
  }, [error]);

  return (
    <html>
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <button
            onClick={reset}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

// ponytail: console-only. Swap in a reporting service (Sentry, etc.) here
// when one is chosen — this is the single call site that needs to change.
export function logError(error: unknown, context?: Record<string, unknown>): void {
  console.error("[app-error]", error, context ?? "");
}

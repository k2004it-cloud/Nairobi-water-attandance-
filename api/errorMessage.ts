/** Convert errors from Supabase and other API dependencies into safe, useful text. */
export function getErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;

  if (error && typeof error === 'object') {
    const value = error as Record<string, unknown>;
    const message = typeof value.message === 'string' ? value.message : '';
    const details = typeof value.details === 'string' ? value.details : '';
    const hint = typeof value.hint === 'string' ? value.hint : '';
    const code = typeof value.code === 'string' ? value.code : '';

    if (message) {
      return [code ? `Database error ${code}: ${message}` : message, details, hint]
        .filter(Boolean)
        .join(' — ');
    }
  }

  return fallback;
}

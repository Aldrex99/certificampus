/** Extracts a human-readable message from an RTK Query error object. */
export function apiError(err: unknown): string {
  if (!err) return 'Une erreur est survenue';
  const e = err as { data?: { message?: string; details?: unknown }; error?: string; status?: number };
  if (e.data?.message) return e.data.message;
  if (e.error) return e.error;
  if (e.status === 'FETCH_ERROR' as unknown as number) return 'Serveur injoignable';
  return 'Une erreur est survenue';
}

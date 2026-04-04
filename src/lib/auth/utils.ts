/**
 * Valida que callbackUrl é um caminho relativo seguro.
 * Rejeita URLs com host externo (proteção contra open redirect).
 */
export function getSafeCallbackUrl(raw: string | null): string {
  if (!raw) return '/upload';
  try {
    const url = new URL(raw, 'http://localhost');
    if (url.origin !== 'http://localhost') return '/upload';
    return url.pathname + url.search;
  } catch {
    return '/upload';
  }
}

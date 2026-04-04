/**
 * Formatadores compartilhados para uso em componentes de upload e batches.
 */

/**
 * Formata bytes em string legível (usa 1024 como base, começa em KB).
 * Usado para exibir tamanho de arquivo.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formata bytes em string legível (usa 1024 como base, inclui "B").
 * Usado para totais agregados no summary bar.
 */
export function formatBytesWithBase(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formata uma data ISO 8601 para string relativa em PT-BR.
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);

  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'always' });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffSec) < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (Math.abs(diffSec) < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  return rtf.format(Math.round(diffSec / 86400), 'day');
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { getDocumentList } from '@/lib/api/batch-status-client';
import type { DocumentListResponse } from '@/lib/api/types';
import type { DocumentTab } from '@/lib/api/batch-status-client';

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useDocumentList
 *
 * Lista paginada de documentos por tab.
 * NÃO é refetchado pelo polling de useBatchStatus — apenas na troca de
 * aba ou mudança de página. PRD §03.13.
 */
export function useDocumentList(
  batchId: string,
  options: { tab: DocumentTab; page: number; pageSize: number },
): {
  data: DocumentListResponse | null;
  isLoading: boolean;
  errorKey: string | null;
} {
  const { tab, page, pageSize } = options;

  const query = useQuery({
    queryKey: ['document-list', batchId, tab, page, pageSize],
    queryFn: () => getDocumentList(batchId, { tab, page, pageSize }),
    // Sem refetchInterval — lista só atualiza na interação do usuário
    staleTime: 0,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    errorKey: query.isError ? 'errors.server_error' : null,
  };
}

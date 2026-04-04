// Cliente HTTP para GET /batches/{id} e GET /batches/{id}/documents — spec 03.2
// Reutiliza a instância apiClient (Axios + interceptor JWT) de batch-client.ts

import { apiClient } from './batch-client';
import type {
  BatchStatusResponse,
  DocumentListResponse,
  DocumentStatus,
} from './types';
import { BatchApiError } from './types';

export type DocumentTab = 'all' | 'completed' | 'processing' | 'failed';

// Mapeamento de tab de UI → query param status da API (tab 'all' → omite param)
const TAB_TO_STATUS: Partial<Record<DocumentTab, DocumentStatus>> = {
  completed: 'completed',
  processing: 'processing',
  failed:     'failed',
};

// ─── getBatchStatus ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/batches/{id}
 * Lança BatchApiError em 404, 401 ou erro de rede.
 */
export async function getBatchStatus(
  batchId: string,
): Promise<BatchStatusResponse> {
  try {
    const { data } = await apiClient.get<BatchStatusResponse>(
      `/api/v1/batches/${batchId}`,
    );
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// ─── getDocumentList ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/batches/{id}/documents?page=N&page_size=50&status=X
 * Tab 'all' omite o filtro de status.
 */
export async function getDocumentList(
  batchId: string,
  params: { tab: DocumentTab; page: number; pageSize: number },
): Promise<DocumentListResponse> {
  const queryParams: Record<string, unknown> = {
    page:      params.page,
    page_size: params.pageSize,
  };

  const statusFilter = TAB_TO_STATUS[params.tab];
  if (statusFilter) queryParams.status = statusFilter;

  try {
    const { data } = await apiClient.get<DocumentListResponse>(
      `/api/v1/batches/${batchId}/documents`,
      { params: queryParams },
    );
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// ─── utilitário interno ──────────────────────────────────────────────────────

function toApiError(err: unknown): BatchApiError {
  if (isAxiosLike(err)) {
    const status = err.response?.status;
    if (status) return new BatchApiError(err.message, status);
  }
  return new BatchApiError('Network error', 'network');
}

function isAxiosLike(
  err: unknown,
): err is { response?: { status: number }; message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'isAxiosError' in err
  );
}

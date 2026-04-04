import axios from 'axios';
import { createClient } from '@/lib/supabase/client';
import type {
  BatchPresignRequest,
  BatchPresignResponse,
  BatchConfirmRequest,
  BatchConfirmResponse,
  BatchListParams,
  BatchListResponse,
  BatchListItem,
  BatchStatus,
} from './types';

// ─── Instância para invoice-api — com JWT via interceptor ───────────────────
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

// ─── Instância para Supabase Storage — sem JWT (presigned URL tem credenciais)
const storageClient = axios.create();

// ─── presignBatch ─────────────────────────────────────────────────────────────
export async function presignBatch(
  request: BatchPresignRequest,
): Promise<BatchPresignResponse> {
  const response = await apiClient.post<BatchPresignResponse>(
    '/api/v1/batches/presign',
    request,
  );
  return response.data;
}

// ─── uploadFileToStorage ──────────────────────────────────────────────────────
export async function uploadFileToStorage(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  await storageClient.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress(progressEvent) {
      if (progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(percent);
      }
    },
  });
}

// ─── confirmBatch ─────────────────────────────────────────────────────────────
export async function confirmBatch(
  batchId: string,
  request: BatchConfirmRequest,
): Promise<BatchConfirmResponse> {
  const response = await apiClient.post<BatchConfirmResponse>(
    `/api/v1/batches/${batchId}/confirm`,
    request,
  );
  return response.data;
}

// ─── (TODO: real endpoint pending — see tech debt) ──────────────────────────
// Mock data for batch listing — replace with apiClient.get when backend is ready.

const MOCK_BATCHES: BatchListItem[] = [
  { id: 'b1a2c3d4', status: 'completed', created_at: '2026-04-01T09:00:00Z', completed_at: '2026-04-01T09:05:00Z', document_count: 12 },
  { id: 'e5f6a7b8', status: 'completed', created_at: '2026-04-01T14:30:00Z', completed_at: '2026-04-01T14:35:00Z', document_count: 5 },
  { id: 'c9d0e1f2', status: 'processing', created_at: '2026-04-02T08:00:00Z', completed_at: null, document_count: 25 },
  { id: 'a3b4c5d6', status: 'failed', created_at: '2026-04-02T10:15:00Z', completed_at: '2026-04-02T10:16:00Z', document_count: 3 },
  { id: 'e7f8a9b0', status: 'partial_failure', created_at: '2026-04-02T15:00:00Z', completed_at: '2026-04-02T15:04:00Z', document_count: 18 },
  { id: 'c1d2e3f4', status: 'completed', created_at: '2026-04-03T09:30:00Z', completed_at: '2026-04-03T09:35:00Z', document_count: 7 },
  { id: 'a5b6c7d8', status: 'completed', created_at: '2026-04-03T11:00:00Z', completed_at: '2026-04-03T11:02:00Z', document_count: 2 },
  { id: 'e9f0a1b2', status: 'completed', created_at: '2026-04-03T16:00:00Z', completed_at: '2026-04-03T16:03:00Z', document_count: 9 },
  { id: 'c3d4e5f6', status: 'failed', created_at: '2026-04-04T08:30:00Z', completed_at: '2026-04-04T08:31:00Z', document_count: 1 },
  { id: 'a7b8c9d0', status: 'completed', created_at: '2026-04-04T09:00:00Z', completed_at: '2026-04-04T09:04:00Z', document_count: 15 },
  { id: 'e1f2a3b4', status: 'processing', created_at: '2026-04-04T10:00:00Z', completed_at: null, document_count: 30 },
  { id: 'c5d6e7f8', status: 'completed', created_at: '2026-04-04T11:30:00Z', completed_at: '2026-04-04T11:33:00Z', document_count: 4 },
  { id: 'a9b0c1d2', status: 'completed', created_at: '2026-04-04T13:00:00Z', completed_at: '2026-04-04T13:02:00Z', document_count: 6 },
  { id: 'e3f4a5b6', status: 'partial_failure', created_at: '2026-04-04T14:30:00Z', completed_at: '2026-04-04T14:33:00Z', document_count: 22 },
  { id: 'c7d8e9f0', status: 'completed', created_at: '2026-04-04T16:00:00Z', completed_at: '2026-04-04T16:02:00Z', document_count: 8 },
];

export async function getBatchList(
  params: BatchListParams = {},
): Promise<BatchListResponse> {
  await new Promise((r) => setTimeout(r, 500));

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  let filtered = [...MOCK_BATCHES];

  if (params.status && params.status !== 'all') {
    filtered = filtered.filter((b) => b.status === params.status);
  }

  if (params.dateFrom) {
    filtered = filtered.filter((b) => b.created_at >= params.dateFrom!);
  }
  if (params.dateTo) {
    filtered = filtered.filter((b) => b.created_at <= params.dateTo!);
  }

  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return {
    items: paged,
    total: filtered.length,
    page,
    page_size: pageSize,
  };
}

// Stub for re-processing — replace with real POST endpoint when available.
export async function reprocessBatch(
  batchId: string,
): Promise<{ success: boolean; message: string }> {
  await new Promise((r) => setTimeout(r, 800));
  console.log(`[MOCK] Reprocessing batch ${batchId}`);
  return { success: true, message: 'Batch queued for reprocessing' };
}

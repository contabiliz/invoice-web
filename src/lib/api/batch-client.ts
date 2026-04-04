import axios from 'axios';
import { createClient } from '@/lib/supabase/client';
import type {
  BatchPresignRequest,
  BatchPresignResponse,
  BatchConfirmRequest,
  BatchConfirmResponse,
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

import type { BatchPresignResponse, BatchConfirmResponse } from '@/lib/api/types';

export function mockPresignSuccess(docCount: number): BatchPresignResponse {
  return {
    batch_id: 'batch-uuid-001',
    documents: Array.from({ length: docCount }, (_, i) => ({
      document_id: `doc-uuid-${i}`,
      upload_url: `https://storage.example.com/presigned/${i}`,
      upload_url_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      object_key: `user-uuid/batch-uuid-001/doc-uuid-${i}`,
    })),
  };
}

export function mockConfirmAllSuccess(docIds: string[]): BatchConfirmResponse {
  return { confirmed: docIds, failed: [] };
}

export function mockConfirmPartialFailure(
  docIds: string[],
  failedIds: string[],
): BatchConfirmResponse {
  return {
    confirmed: docIds.filter((id) => !failedIds.includes(id)),
    failed: failedIds.map((id) => ({ document_id: id, reason: 'object_not_found' })),
  };
}

// Tipos manuais da invoice-api — spec 02.2 ADR-003
// Guardião: dev frontend é responsável por manter alinhamento com o backend

// ─── MIME Types aceitos (PRD §02.3.3) ───────────────────────────────────────
export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'application/pdf',
  'application/xml',
  'text/xml',
] as const;

export type MimeType = (typeof ACCEPTED_MIME_TYPES)[number];

// ─── Limites de validação local (PRD §02.3.4) ───────────────────────────────
export const MAX_FILE_SIZE_BYTES = 52_428_800; // 50 MB
export const MAX_DOCUMENTS_PER_BATCH = 500;
export const MIN_DOCUMENTS_PER_BATCH = 1;

// ─── POST /api/v1/batches/presign ───────────────────────────────────────────
export interface PresignDocumentRequest {
  filename: string;
  mime_type: MimeType;
  file_size: number;
}

export interface BatchPresignRequest {
  documents: PresignDocumentRequest[];
}

export interface PresignDocumentResponse {
  document_id: string;
  upload_url: string;
  upload_url_expires_at: string; // ISO8601
  object_key: string;
}

export interface BatchPresignResponse {
  batch_id: string;
  documents: PresignDocumentResponse[];
}

// ─── POST /api/v1/batches/{id}/confirm ─────────────────────────────────────
export interface BatchConfirmRequest {
  document_ids: string[];
}

export interface BatchConfirmFailedItem {
  document_id: string;
  reason: string;
}

export interface BatchConfirmResponse {
  confirmed: string[];
  failed: BatchConfirmFailedItem[];
}

// ─── GET /api/v1/batches/{id} ───────────────────────────────────────────────
export type BatchStatus =
  | 'pending_upload'
  | 'processing'
  | 'completed'
  | 'partial_failure'
  | 'failed';

export interface BatchStatusResponse {
  batch_id: string;
  status: BatchStatus;
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  created_at: string;       // ISO8601
  completed_at: string | null;
}

// ─── GET /api/v1/batches/{id}/documents ────────────────────────────────────
export type DocumentStatus =
  | 'pending_upload'
  | 'upload_confirmed'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export type DocumentDocType = 'xml' | 'pdf' | 'img';

export interface DocumentItem {
  document_id: string;
  filename: string;
  doc_type: DocumentDocType;
  status: DocumentStatus;
  error_reason: string | null;
  created_at: string;       // ISO8601
  updated_at: string;       // ISO8601
}

export interface DocumentListResponse {
  total: number;
  page: number;
  items: DocumentItem[];
}

// ─── Erro tipado do cliente de status ───────────────────────────────────────
export class BatchApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | 'network',
  ) {
    super(message);
    this.name = 'BatchApiError';
  }
}

// ─── GET /api/v1/analytics/kpis ────────────────────────────────────────────
export interface AnalyticsKPIResponse {
  total_documents: number;
  success_count: number;
  failure_count: number;
  success_rate: number;  // percentage, e.g. 95.2
}

// ─── GET /api/v1/analytics/timeseries ──────────────────────────────────────
export interface AnalyticsTimeSeriesPoint {
  date: string;    // YYYY-MM-DD
  total: number;
  success: number;
  failure: number;
}

export interface AnalyticsTimeSeriesResponse {
  points: AnalyticsTimeSeriesPoint[];
  date_range: string;   // e.g. "Últimos 7 dias"
  presets: Record<string, string>;  // {"7d": "7 dias", ...}
}

// ─── GET /api/v1/analytics/documents ────────────────────────────────────────
export interface AnalyticsDocumentBreakdown {
  document_id: string;       // UUID
  batch_id: string;          // UUID
  type: string;              // xml, pdf, img
  status: string;            // document status
  processing_time_ms: number;
  extraction_result: string;  // success, failed, partial, skipped
  created_at: string;        // ISO 8601
}

export interface AnalyticsDocumentBreakdownList {
  items: AnalyticsDocumentBreakdown[];
  total: number;
  page: number;
  page_size: number;
}

// Cliente HTTP para analytics endpoints — ANAL-01, ANAL-02, ANAL-03
// Reutiliza a instância apiClient (Axios + interceptor JWT) de batch-client.ts

import { apiClient } from './batch-client';
import type {
  AnalyticsKPIResponse,
  AnalyticsTimeSeriesResponse,
  AnalyticsDocumentBreakdownList,
} from './types';
import { BatchApiError } from './types';

export type TimeSeriesPreset = '7d' | '30d' | '90d' | 'mtd';

// ─── getAnalyticsKPIs ────────────────────────────────────────────────────────

/**
 * GET /api/v1/analytics/kpis?days=30
 * Retorna agregados de KPIs para o usuário autenticado.
 */
export async function getAnalyticsKPIs(
  days = 30,
): Promise<AnalyticsKPIResponse> {
  try {
    const { data } = await apiClient.get<AnalyticsKPIResponse>(
      '/api/v1/analytics/kpis',
      { params: { days } },
    );
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// ─── getAnalyticsTimeSeries ─────────────────────────────────────────────────

/**
 * GET /api/v1/analytics/timeseries?preset=mtd
 * Supports presets: 7d, 30d, 90d, mtd (month-to-date).
 */
export async function getAnalyticsTimeSeries(
  preset: TimeSeriesPreset = 'mtd',
): Promise<AnalyticsTimeSeriesResponse> {
  try {
    const { data } = await apiClient.get<AnalyticsTimeSeriesResponse>(
      '/api/v1/analytics/timeseries',
      { params: { preset } },
    );
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// ─── getAnalyticsDocuments ──────────────────────────────────────────────────

/**
 * GET /api/v1/analytics/documents?page=1&page_size=50&sort_by=created_at&sort_order=desc
 * Paginated document breakdown with sorting.
 */
export async function getAnalyticsDocuments(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}): Promise<AnalyticsDocumentBreakdownList> {
  const queryParams: Record<string, unknown> = {
    page: params?.page ?? 1,
    page_size: params?.pageSize ?? 50,
    sort_by: params?.sortBy ?? 'created_at',
    sort_order: params?.sortOrder ?? 'desc',
  };

  try {
    const { data } = await apiClient.get<AnalyticsDocumentBreakdownList>(
      '/api/v1/analytics/documents',
      { params: queryParams },
    );
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// ─── AnalyticsClient class (for dependency injection) ────────────────────────

/**
 * Wraps the standalone functions for DI patterns.
 * Follows the same pattern as batch-client functions but grouped in a class.
 */
export class AnalyticsClient {
  getKPIs(days = 30): Promise<AnalyticsKPIResponse> {
    return getAnalyticsKPIs(days);
  }

  getTimeSeries(preset: TimeSeriesPreset = 'mtd'): Promise<AnalyticsTimeSeriesResponse> {
    return getAnalyticsTimeSeries(preset);
  }

  getDocuments(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AnalyticsDocumentBreakdownList> {
    return getAnalyticsDocuments(params);
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

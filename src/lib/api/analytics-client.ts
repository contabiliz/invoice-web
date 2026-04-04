// Mock analytics endpoints — backend analytics endpoints are deferred.
// Replace with real API calls when backend is ready.
//
// See: D:\Contabiliz\invoice-docs\tech-debt\analytics-api.md

import type {
  AnalyticsKPIResponse,
  AnalyticsTimeSeriesResponse,
  AnalyticsDocumentBreakdownList,
  AnalyticsDocumentBreakdown,
} from './types';

export type TimeSeriesPreset = '7d' | '30d' | '90d' | 'mtd';

const MOCK_KPIS: AnalyticsKPIResponse = {
  total_documents: 1250,
  success_count: 1100,
  failure_count: 85,
  success_rate: 88.0,
};

function generateMockTimeSeries(preset: TimeSeriesPreset): {
  points: Array<{ date: string; total: number; success: number; failure: number }>;
} {
  const days = { '7d': 7, '30d': 30, '90d': 90, mtd: new Date().getDate() }[preset];
  const today = new Date();
  const points = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const total = Math.floor(Math.random() * 40) + 10;
    const success = Math.floor(total * (0.85 + Math.random() * 0.12));
    points.push({ date: dateStr, total, success, failure: total - success });
  }
  return { points };
}

function generateMockDocuments(page: number, pageSize: number): {
  items: AnalyticsDocumentBreakdown[];
  total: number;
  page: number;
  page_size: number;
} {
  const types = ['xml', 'pdf', 'img'] as const;
  const statuses = ['completed', 'completed', 'completed', 'failed', 'processing', 'partial_failure'] as const;
  const results = ['success', 'success', 'success', 'partial', 'failed', 'skipped'] as const;
  const total = 127;
  const start = (page - 1) * pageSize;
  const items: AnalyticsDocumentBreakdown[] = [];

  for (let i = 0; i < Math.min(pageSize, total - start); i++) {
    const idx = start + i;
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(idx / 5));
    items.push({
      document_id: `doc-${idx}`,
      batch_id: `batch-${Math.floor(idx / 5)}`,
      type: types[idx % types.length],
      status: statuses[idx % statuses.length],
      processing_time_ms: Math.floor(Math.random() * 5000) + 200,
      extraction_result: results[idx % results.length],
      created_at: d.toISOString(),
    });
  }

  return { items, total, page, page_size: pageSize };
}

// ─── getAnalyticsKPIs ────────────────────────────────────────────────────────
export async function getAnalyticsKPIs(
  _days = 30,
): Promise<AnalyticsKPIResponse> {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_KPIS;
}

// ─── getAnalyticsTimeSeries ─────────────────────────────────────────────────
export async function getAnalyticsTimeSeries(
  preset: TimeSeriesPreset = 'mtd',
): Promise<AnalyticsTimeSeriesResponse> {
  await new Promise((r) => setTimeout(r, 500));
  return {
    ...generateMockTimeSeries(preset),
    date_range: `Últimos ${preset === 'mtd' ? 'mes' : preset.replace('d', ' dias')}`,
    presets: { '7d': '7 dias', '30d': '30 dias', '90d': '90 dias', mtd: 'Mes atual' },
  };
}

// ─── getAnalyticsDocuments ──────────────────────────────────────────────────
export async function getAnalyticsDocuments(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}): Promise<AnalyticsDocumentBreakdownList> {
  await new Promise((r) => setTimeout(r, 600));
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 50;
  const result = generateMockDocuments(page, pageSize);
  return result as unknown as AnalyticsDocumentBreakdownList;
}

// ─── AnalyticsClient class (for dependency injection) ────────────────────────
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

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsKPIs,
  getAnalyticsTimeSeries,
  getAnalyticsDocuments,
} from '@/lib/api/analytics-client';
import type { TimeSeriesPreset } from '@/lib/api/analytics-client';

// ─── useAnalyticsKPIs ─────────────────────────────────────────────────────────

export function useAnalyticsKPIs(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'kpis', days],
    queryFn: () => getAnalyticsKPIs(days),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── useAnalyticsTimeSeries ───────────────────────────────────────────────────

export function useAnalyticsTimeSeries(preset: TimeSeriesPreset = 'mtd') {
  return useQuery({
    queryKey: ['analytics', 'timeseries', preset],
    queryFn: () => getAnalyticsTimeSeries(preset),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── useAnalyticsDocuments ────────────────────────────────────────────────────

export function useAnalyticsDocuments({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['analytics', 'documents', page, pageSize],
    queryFn: () =>
      getAnalyticsDocuments({
        page,
        pageSize,
        sortBy: 'created_at',
        sortOrder: 'desc',
      }),
    staleTime: 30_000,
  });
}

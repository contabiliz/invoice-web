import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the analytics client
vi.mock('@/lib/api/analytics-client', () => ({
  getAnalyticsKPIs: vi.fn().mockResolvedValue({
    total_documents: 500,
    success_count: 475,
    failure_count: 25,
    success_rate: 95.0,
  }),
  getAnalyticsTimeSeries: vi.fn().mockResolvedValue({
    points: [{ date: '2026-04-01', total: 10, success: 8, failure: 2 }],
    date_range: 'Últimos 7 dias',
    presets: { '7d': '7 dias' },
  }),
  getAnalyticsDocuments: vi.fn().mockResolvedValue({
    items: [
      {
        document_id: 'doc1',
        type: 'nfe',
        status: 'completed',
        processing_time_ms: 1500,
        extraction_result: 'success',
        created_at: '2026-04-01T10:00:00Z',
      },
    ],
    total: 1,
    page: 1,
    page_size: 50,
  }),
}));

// T-ANALYTICS-07
describe('useAnalytics hooks', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return React.createElement(QueryClientProvider, { client }, children);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // T-ANALYTICS-08
  it('useAnalyticsKPIs fetches data', async () => {
    const { useAnalyticsKPIs } = await import('@/hooks/useAnalytics');
    const { result } = renderHook(() => useAnalyticsKPIs(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total_documents).toBe(500);
  });

  // T-ANALYTICS-09
  it('useAnalyticsTimeSeries fetches data with preset', async () => {
    const { useAnalyticsTimeSeries } = await import('@/hooks/useAnalytics');
    const { result } = renderHook(
      () => useAnalyticsTimeSeries('7d'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.points).toHaveLength(1);
  });

  // T-ANALYTICS-10
  it('useAnalyticsDocuments fetches paginated list', async () => {
    const { useAnalyticsDocuments } = await import('@/hooks/useAnalytics');
    const { result } = renderHook(
      () => useAnalyticsDocuments({ page: 1, pageSize: 20 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.total).toBe(1);
  });
});

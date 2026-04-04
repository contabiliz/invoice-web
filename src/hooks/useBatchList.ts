'use client';

import { useQuery } from '@tanstack/react-query';
import { getBatchList } from '@/lib/api/batch-client';
import type { BatchListParams, BatchStatus } from '@/lib/api/types';

export function useBatchList({
  page = 1,
  pageSize = 20,
  status,
  dateFrom,
  dateTo,
  docType,
}: BatchListParams = {}) {
  const params: BatchListParams = {
    page,
    pageSize,
    status: status as BatchStatus | undefined,
    dateFrom,
    dateTo,
    docType,
  };

  return useQuery({
    queryKey: ['batches', 'list', page, pageSize, status, dateFrom, dateTo, docType],
    queryFn: () => getBatchList(params),
    staleTime: 30_000,
  });
}

// Stub reprocessing hook — replace with real mutation when API endpoint exists.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reprocessBatch } from '@/lib/api/batch-client';

export function useReprocessBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reprocessBatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batches', 'list'] });
    },
  });
}

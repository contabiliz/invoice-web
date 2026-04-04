'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBatchList, useReprocessBatch } from '@/hooks/useBatchList';
import { BatchList } from '@/components/batches/BatchList';
import { BatchFilters } from '@/components/batches/BatchFilters';
import type { BatchListParams } from '@/lib/api/types';

export default function BatchesPage() {
  const t = useTranslations('batches');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Omit<BatchListParams, 'page' | 'pageSize'>>({});

  const reprocessMutation = useReprocessBatch();

  const query = useBatchList({
    page,
    pageSize: 20,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    docType: filters.docType,
  });

  const applyFilters = (f: Omit<BatchListParams, 'page' | 'pageSize'>) => {
    setFilters(f);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-on-surface">
        {t('page_title')}
      </h1>

      <BatchFilters
        value={filters}
        onChange={applyFilters}
        onRefresh={() => query.refetch()}
      />

      <BatchList
        data={query.data?.items ?? null}
        isLoading={query.isLoading}
        pagination={
          query.data
            ? {
                page,
                pageSize: 20,
                total: query.data.total,
                onPageChange: setPage,
              }
            : null
        }
        onReprocess={reprocessMutation.mutate}
        isReprocessing={reprocessMutation.isPending}
      />

      {query.isError && (
        <p className="text-sm text-red-600 text-center">
          {t('errors.load_failed')}
        </p>
      )}
    </div>
  );
}

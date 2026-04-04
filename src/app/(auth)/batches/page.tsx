'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBatchList } from '@/hooks/useBatchList';
import { BatchList } from '@/components/batches/BatchList';

export default function BatchesPage() {
  const t = useTranslations('batches');
  const [page, setPage] = useState(1);

  const query = useBatchList({ page, pageSize: 20 });

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-on-surface mb-6">
        {t('page_title')}
      </h1>

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
      />

      {query.isError && (
        <p className="text-sm text-red-600 text-center mt-4">
          {t('errors.load_failed')}
        </p>
      )}
    </div>
  );
}

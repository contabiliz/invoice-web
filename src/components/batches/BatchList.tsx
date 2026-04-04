'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import type { BatchListItem } from '@/lib/api/types';

export interface BatchListProps {
  data: BatchListItem[] | null;
  isLoading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  } | null;
  onReprocess?: (batchId: string) => void;
  isReprocessing?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  partial_failure: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  pending_upload: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BatchList({
  data,
  isLoading,
  pagination,
  onReprocess,
  isReprocessing,
}: BatchListProps) {
  const t = useTranslations('batches');
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 0;

  return (
    <div className="rounded-lg border border-outline bg-surface overflow-hidden">
      <div className="px-5 py-3 border-b border-outline">
        <h3 className="text-sm font-semibold text-on-surface">
          {t('list_title')}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface-variant/30">
              <th className="text-left px-5 py-3 text-on-surface-variant font-medium">
                {t('col_batch_id')}
              </th>
              <th className="text-left px-5 py-3 text-on-surface-variant font-medium">
                {t('col_status')}
              </th>
              <th className="text-left px-5 py-3 text-on-surface-variant font-medium">
                {t('col_date')}
              </th>
              <th className="text-left px-5 py-3 text-on-surface-variant font-medium">
                {t('col_documents')}
              </th>
              <th className="text-right px-5 py-3 text-on-surface-variant font-medium">
                {t('col_actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-outline">
                  <td className="px-5 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-5 py-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="px-5 py-3">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-5 py-3">
                    <Skeleton className="h-4 w-8" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Skeleton className="h-6 w-6 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : data && data.length > 0 ? (
              data.map((batch) => (
                <tr key={batch.id} className="border-b border-outline">
                  <td className="px-5 py-3 font-mono tabular-nums">
                    <a
                      href={`/batches/${batch.id}`}
                      className="text-primary hover:text-primary/80 hover:underline"
                      title={batch.id}
                    >
                      {batch.id.slice(0, 8)}...
                    </a>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono tabular-nums ${STATUS_COLORS[batch.status] ?? 'bg-gray-100 text-gray-800'}`}
                    >
                      {t(`status_${batch.status}`, { defaultValue: batch.status })}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono tabular-nums">
                    {formatDate(batch.created_at)}
                  </td>
                  <td className="px-5 py-3 font-mono tabular-nums text-on-surface">
                    {batch.document_count}
                  </td>
                  <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                    {(batch.status === 'failed' || batch.status === 'partial_failure') && onReprocess && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onReprocess(batch.id);
                        }}
                        disabled={isReprocessing}
                        className="px-2 py-0.5 text-xs rounded border border-outline text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={t('reprocess_button')}
                      >
                        {t('reprocess_button')}
                      </button>
                    )}
                    <a
                      href={`/batches/${batch.id}`}
                      className="text-sm text-on-surface-variant hover:text-on-surface"
                      title={t('view_details')}
                    >
                      ↗
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-on-surface-variant"
                >
                  {t('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-outline bg-surface-variant/20">
          <p className="text-xs text-on-surface-variant font-mono tabular-nums">
            {t('pagination', { total: pagination.total })}
          </p>
          <div className="flex gap-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="px-3 py-1 text-xs rounded border border-outline disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-variant/50 text-on-surface-variant"
            >
              {t('table_prev')}
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`px-3 py-1 text-xs rounded border border-outline font-mono tabular-nums ${
                    pagination.page === pageNum
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-surface-variant/50 text-on-surface-variant'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="px-3 py-1 text-xs rounded border border-outline disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-variant/50 text-on-surface-variant"
            >
              {t('table_next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

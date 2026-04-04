'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import type { DocumentItem } from '@/lib/api/types';
import { DocumentRow } from './DocumentRow';

interface DocumentTableProps {
  items: DocumentItem[];
  isLoading: boolean;
  total: number;
}

export const DocumentTable = memo(function DocumentTable({ items, isLoading, total }: DocumentTableProps) {
  const t = useTranslations('batch-status');

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2 py-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 w-full rounded bg-[var(--color-bg-muted)]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-[var(--color-text-secondary)]">
        {t('table.empty_tab')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table
        role="table"
        className="w-full text-sm border-collapse"
      >
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              {t('table.col_filename')}
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide w-16">
              {t('table.col_type')}
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide w-32">
              {t('table.col_status')}
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              {t('table.col_reason')}
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide w-28">
              {t('table.col_updated')}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <DocumentRow
              key={item.document_id}
              item={item}
              isError={item.status === 'failed'}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { BatchListParams, BatchStatus } from '@/lib/api/types';

const STATUS_OPTIONS: { value: BatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'completed', label: 'Concluido' },
  { value: 'processing', label: 'Processando' },
  { value: 'failed', label: 'Falhou' },
  { value: 'partial_failure', label: 'Falha parcial' },
];

export interface BatchFiltersProps {
  value: Omit<BatchListParams, 'page' | 'pageSize'>;
  onChange: (filters: Omit<BatchListParams, 'page' | 'pageSize'>) => void;
  onRefresh: () => void;
}

export function BatchFilters({
  value,
  onChange,
  onRefresh,
}: BatchFiltersProps) {
  const t = useTranslations('batches');
  const [localDateFrom, setLocalDateFrom] = useState(value.dateFrom ?? '');
  const [localDateTo, setLocalDateTo] = useState(value.dateTo ?? '');

  useEffect(() => {
    setLocalDateFrom(value.dateFrom ?? '');
    setLocalDateTo(value.dateTo ?? '');
  }, [value.dateFrom, value.dateTo]);

  const handleReset = () => {
    onChange({ status: undefined, dateFrom: undefined, dateTo: undefined, docType: undefined });
    setLocalDateFrom('');
    setLocalDateTo('');
  };

  const handleApply = () => {
    onChange({
      status: value.status,
      dateFrom: localDateFrom || undefined,
      dateTo: localDateTo || undefined,
      docType: value.docType,
    });
  };

  return (
    <div className="rounded-lg border border-outline bg-surface p-4 space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-on-surface-variant">{t('col_status')}</label>
          <select
            className="px-3 py-1.5 text-sm rounded border border-outline bg-surface text-on-surface"
            value={value.status ?? 'all'}
            onChange={(e) =>
              onChange({ ...value, status: (e.target.value === 'all' ? undefined : e.target.value) as BatchStatus | undefined })
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(`status_${opt.value === 'all' && value.status === undefined ? 'all' : opt.value}`, { defaultValue: opt.label })}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-on-surface-variant">{t('filters.from')}</label>
          <input
            type="date"
            className="px-3 py-1.5 text-sm rounded border border-outline bg-surface text-on-surface"
            value={localDateFrom}
            onChange={(e) => setLocalDateFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-on-surface-variant">{t('filters.to')}</label>
          <input
            type="date"
            className="px-3 py-1.5 text-sm rounded border border-outline bg-surface text-on-surface"
            value={localDateTo}
            onChange={(e) => setLocalDateTo(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <button
          onClick={handleApply}
          className="px-4 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t('filters.apply')}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-1.5 text-sm rounded border border-outline text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
        >
          {t('filters.reset')}
        </button>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-sm rounded border border-outline text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
          title={t('filters.refresh')}
        >
          ↻
        </button>
      </div>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { formatBytesWithBase } from '@/lib/utils/format';

interface BatchSummaryBarProps {
  count: number;
  validCount: number;
  totalBytes: number;
}

export function BatchSummaryBar({ count, validCount, totalBytes }: BatchSummaryBarProps) {
  const t = useTranslations('upload');
  const errorCount = count - validCount;

  return (
    <div className="flex items-center gap-10">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest font-black text-[var(--color-text-secondary)]">{t('batch_statistics_label')}</span>
        <span className="font-bold text-lg text-[var(--color-text-primary)]">
          {count} · {formatBytesWithBase(totalBytes)}
        </span>
      </div>

      {errorCount > 0 && (
        <>
          <div className="h-10 w-[1px] bg-[var(--color-border)]"></div>
          <div className="flex items-center gap-3">
            <AlertCircle className="text-[var(--color-status-error)]" size={18} />
            <span className="text-sm text-[var(--color-status-error)] font-bold">
              {errorCount} {errorCount === 1 ? t('error_count_singular') : t('error_count_plural')}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';

interface BatchSummaryBarProps {
  count: number;
  validCount: number;
  totalBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BatchSummaryBar({ count, validCount, totalBytes }: BatchSummaryBarProps) {
  const t = useTranslations('upload');
  const errorCount = count - validCount;

  return (
    <div className="flex items-center gap-10">
      <div className="flex flex-col">
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black">{t('batch_statistics_label')}</span>
        <span className="text-on-surface font-bold text-lg">
          {count} · {formatBytes(totalBytes)}
        </span>
      </div>

      {errorCount > 0 && (
        <>
          <div className="h-10 w-[1px] bg-outline"></div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-2xl">error_outline</span>
            <span className="text-sm text-error font-bold">
              {errorCount} {errorCount === 1 ? t('error_count_singular') : t('error_count_plural')}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

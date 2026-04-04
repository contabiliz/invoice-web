'use client';

import { useTranslations } from 'next-intl';

interface BatchProgressBarProps {
  completed: number;
  total: number;
  isLoading: boolean;
}

export function BatchProgressBar({ completed, total, isLoading }: BatchProgressBarProps) {
  const t = useTranslations('batch-status');

  if (isLoading) {
    return (
      <div className="h-2 w-full rounded-full bg-[var(--color-bg-muted)] animate-pulse" />
    );
  }

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
        <span>{t('progress.label')}</span>
        <span className="font-mono-tabular">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={t('progress.aria', { completed, total })}
        className="h-2 w-full rounded-full bg-[var(--color-bg-muted)] overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

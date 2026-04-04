'use client';

import { useTranslations } from 'next-intl';

interface KpiCardProps {
  labelKey: string;
  value: number;
  variant: 'neutral' | 'success' | 'warning' | 'error';
  isLoading: boolean;
}

const VARIANT_VALUE_COLOR: Record<KpiCardProps['variant'], string> = {
  neutral: 'text-[var(--color-text-primary)]',
  success: 'text-[var(--color-status-success)]',
  warning: 'text-[var(--color-status-warning)]',
  error:   'text-[var(--color-status-error)]',
};

export function KpiCard({ labelKey, value, variant, isLoading }: KpiCardProps) {
  const t = useTranslations('batch-status');

  if (isLoading) {
    return (
      <div
        data-testid="kpi-card-skeleton"
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 animate-pulse"
      >
        <div className="h-3 w-20 rounded bg-[var(--color-bg-muted)] mb-3" />
        <div className="h-7 w-12 rounded bg-[var(--color-bg-muted)]" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4">
      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">
        {t(labelKey)}
      </p>
      {/* Geist Mono + tabular-nums para valores numéricos — CLAUDE.md regra crítica */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className={`font-mono-tabular text-2xl font-bold ${VARIANT_VALUE_COLOR[variant]}`}
      >
        {value}
      </p>
    </div>
  );
}

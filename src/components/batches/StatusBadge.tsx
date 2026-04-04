'use client';

import { useTranslations } from 'next-intl';
import type { DocumentStatus } from '@/lib/api/types';

interface StatusBadgeProps {
  status: DocumentStatus;
}

type Variant = 'success' | 'warning' | 'error' | 'neutral';

const STATUS_VARIANT: Record<DocumentStatus, Variant> = {
  completed:       'success',
  processing:      'warning',
  queued:          'warning',
  failed:          'error',
  upload_confirmed:'neutral',
  pending_upload:  'neutral',
};

const STATUS_I18N_KEY: Record<DocumentStatus, string> = {
  completed:       'status.completed',
  processing:      'status.processing',
  queued:          'status.queued',
  failed:          'status.failed',
  upload_confirmed:'status.pending',
  pending_upload:  'status.pending',
};

const VARIANT_STYLES: Record<Variant, string> = {
  success: 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]',
  warning: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]',
  error:   'bg-[var(--color-status-error-bg)] text-[var(--color-status-error)]',
  neutral: 'bg-[var(--color-status-neutral-bg)] text-[var(--color-status-neutral)]',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('batch-status');
  const variant = STATUS_VARIANT[status] ?? 'neutral';

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${VARIANT_STYLES[variant]}`}
    >
      {t(STATUS_I18N_KEY[status] ?? 'status.pending')}
    </span>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import type { FileUploadStatus } from '@/hooks/useBatchUpload';

interface FileStatusBadgeProps {
  status: FileUploadStatus | 'validation_error';
  confirmStatus?: 'confirmed' | 'failed';
}

const BADGE_STYLES: Record<string, string> = {
  idle: 'bg-bg-muted text-text-secondary',
  uploading: 'bg-accent-subtle text-accent',
  done: 'bg-status-success-bg text-status-success',
  error: 'bg-status-error-bg text-status-error',
  expired: 'bg-status-warning-bg text-status-warning',
  validation_error: 'bg-status-error-bg text-status-error',
  confirmed: 'bg-status-success-bg text-status-success',
  failed: 'bg-status-error-bg text-status-error',
};

const STATUS_KEY_MAP: Record<string, string> = {
  idle: 'status_idle',
  uploading: 'status_uploading',
  done: 'status_done',
  error: 'status_error',
  expired: 'status_expired',
  validation_error: 'status_error',
  confirmed: 'status_confirmed',
  failed: 'status_failed',
};

export function FileStatusBadge({ status, confirmStatus }: FileStatusBadgeProps) {
  const t = useTranslations('upload');
  const key = confirmStatus ?? status;
  const labelKey = STATUS_KEY_MAP[key] ?? 'status_idle';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[key] ?? BADGE_STYLES.idle}`}
    >
      {t(labelKey as Parameters<typeof t>[0])}
    </span>
  );
}

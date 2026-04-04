'use client';

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

const BADGE_LABELS: Record<string, string> = {
  idle: 'Aguardando',
  uploading: 'Enviando',
  done: 'Enviado',
  error: 'Erro',
  expired: 'Renovando',
  validation_error: 'Inválido',
  confirmed: 'Confirmado',
  failed: 'Falhou',
};

export function FileStatusBadge({ status, confirmStatus }: FileStatusBadgeProps) {
  const key = confirmStatus ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[key] ?? BADGE_STYLES.idle}`}
    >
      {BADGE_LABELS[key] ?? key}
    </span>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import type { BatchStatus } from '@/lib/api/types';
import type { BatchUIPhase } from '@/hooks/useBatchStatus';
import { formatRelativeTime } from '@/lib/utils/format';

interface BatchHeaderProps {
  batchId: string;
  status: BatchStatus | null;
  createdAt: string | null;  // ISO8601
  phase: BatchUIPhase;
  isLoading: boolean;
}

const STATUS_DOT_COLOR: Partial<Record<BatchStatus, string>> = {
  processing:      'bg-[var(--color-status-warning)]',
  completed:       'bg-[var(--color-status-success)]',
  partial_failure: 'bg-[var(--color-status-warning)]',
  failed:          'bg-[var(--color-status-error)]',
  pending_upload:  'bg-[var(--color-status-neutral)]',
};

const LABEL_KEY_MAP: Partial<Record<BatchStatus, string>> = {
  processing:      'header_status.processing',
  completed:       'header_status.completed',
  partial_failure: 'header_status.partial_failure',
  failed:          'header_status.failed',
  pending_upload:  'header_status.pending_upload',
};


export function BatchHeader({ batchId, status, createdAt, phase, isLoading }: BatchHeaderProps) {
  const t = useTranslations('batch-status');

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="h-3 w-3 rounded-full bg-[var(--color-bg-muted)]" />
        <div className="h-4 w-32 rounded bg-[var(--color-bg-muted)]" />
        <div className="h-3 w-24 rounded bg-[var(--color-bg-muted)]" />
      </div>
    );
  }

  const dotColor = status ? (STATUS_DOT_COLOR[status] ?? 'bg-[var(--color-status-neutral)]') : 'bg-[var(--color-status-neutral)]';
  const isActive = phase === 'active_polling';
  const abbreviatedId = batchId.slice(0, 8).toUpperCase();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Status dot */}
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotColor} ${isActive ? 'animate-pulse' : ''}`}
      />

      {/* Batch ID abreviado */}
      <h1 className="font-mono-tabular text-sm font-semibold text-[var(--color-text-primary)]">
        {t('header.batch_prefix')}{abbreviatedId}
      </h1>

      {/* Status label */}
      {status && (
        <span className="text-sm text-[var(--color-text-secondary)]">
          — {t(LABEL_KEY_MAP[status] ?? 'status.failed')}
        </span>
      )}

      {/* Tempo relativo */}
      {createdAt && (
        <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
          Criado {formatRelativeTime(createdAt)}
        </span>
      )}
    </div>
  );
}

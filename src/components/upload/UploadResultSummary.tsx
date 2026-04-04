'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import type { BatchPhase } from '@/hooks/useBatchUpload';

interface UploadResultSummaryProps {
  phase: BatchPhase;
  confirmedCount?: number;
  failedItems?: Array<{ documentId: string; reason: string }>;
  presignErrorKey?: string;
  confirmErrorKey?: string;
  onRetryPresign?: () => void;
  onRetryConfirm?: () => void;
  batchId?: string;
}

export function UploadResultSummary({
  phase,
  confirmedCount,
  failedItems,
  presignErrorKey,
  confirmErrorKey,
  onRetryPresign,
  onRetryConfirm,
  batchId,
}: UploadResultSummaryProps) {
  const t = useTranslations('upload');

  if (phase === 'success_full' && confirmedCount != null) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-status-success/30 bg-status-success-bg p-4">
        <CheckCircle size={20} className="shrink-0 text-status-success" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-status-success">
            {t('success_full', { count: confirmedCount })}
          </p>
          <p className="text-xs text-text-secondary">{t('success_full_redirect')}</p>
        </div>
      </div>
    );
  }

  if (phase === 'success_partial') {
    const failed = failedItems?.length ?? 0;
    const confirmed = confirmedCount ?? 0;
    return (
      <div
        role="alert"
        className="rounded-xl border border-status-warning/30 bg-status-warning-bg p-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-status-warning" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-status-warning">
              {t('success_partial_warning', { confirmed, failed })}
            </p>
            {failedItems && failedItems.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-text-secondary hover:text-text-primary">
                  {t('success_partial_failed_label')}
                </summary>
                <ul className="mt-1 space-y-0.5">
                  {failedItems.map((item) => (
                    <li key={item.documentId} className="font-mono-tabular text-xs text-text-secondary">
                      {item.documentId} — {item.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {batchId && (
              <a
                href={`/batches/${batchId}`}
                className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
              >
                {t('button_view_batch')} →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'presign_error' && presignErrorKey) {
    return (
      <div role="alert" className="rounded-xl border border-status-error/30 bg-status-error-bg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-status-error" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-status-error">
              {t(presignErrorKey as Parameters<typeof t>[0])}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'confirm_error' && confirmErrorKey) {
    return (
      <div role="alert" className="rounded-xl border border-status-error/30 bg-status-error-bg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-status-error" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-status-error">
              {t(confirmErrorKey as Parameters<typeof t>[0])}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

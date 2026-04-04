'use client';

import { useTranslations } from 'next-intl';
import type { BatchPhase } from '@/hooks/useBatchUpload';

interface UploadActionsProps {
  phase: BatchPhase;
  validFileCount: number;
  rateLimitCountdown?: number;
  onSubmit: () => void;
  onRetryPresign: () => void;
  onRetryConfirm: () => void;
  onClearQueue?: () => void;
}

export function UploadActions({
  phase,
  validFileCount,
  rateLimitCountdown,
  onSubmit,
  onRetryPresign,
  onRetryConfirm,
  onClearQueue,
}: UploadActionsProps) {
  const t = useTranslations('upload');

  const isLoading = ['presigning', 'uploading', 'confirming'].includes(phase);
  const isDisabled = isLoading || validFileCount === 0;

  const buttonLabel = {
    idle: t('button_submit'),
    files_selected: t('button_submit'),
    presigning: t('button_preparing'),
    uploading: t('button_uploading'),
    confirming: t('button_confirming'),
    success_full: t('button_submit'),
    success_partial: t('button_submit'),
    presign_error: t('button_retry'),
    confirm_error: t('button_retry'),
  }[phase] ?? t('button_submit');

  if (phase === 'presign_error') {
    const hasCountdown = rateLimitCountdown != null && rateLimitCountdown > 0;
    return (
      <div className="flex gap-6 items-center">
        {onClearQueue && (
          <button
            type="button"
            onClick={onClearQueue}
            className="text-on-surface-variant font-bold text-sm hover:text-on-surface transition-all px-4 py-2"
          >
            {t('button_clear_queue')}
          </button>
        )}
        <button
          type="button"
          onClick={onRetryPresign}
          disabled={hasCountdown}
          aria-disabled={hasCountdown}
          className="px-12 py-4 bg-primary text-white font-black rounded-lg shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:pointer-events-none"
        >
          {hasCountdown
            ? t('rate_limit_countdown', { seconds: rateLimitCountdown })
            : t('button_retry')}
        </button>
      </div>
    );
  }

  if (phase === 'confirm_error') {
    return (
      <button
        type="button"
        onClick={onRetryConfirm}
        className="px-12 py-4 bg-primary text-white font-black rounded-lg shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 active:scale-95 transition-all uppercase tracking-widest text-xs"
      >
        {t('button_retry')}
      </button>
    );
  }

  return (
    <div className="flex gap-6 items-center">
      {onClearQueue && (
        <button
          type="button"
          onClick={onClearQueue}
          disabled={isDisabled && phase !== 'idle' && phase !== 'files_selected'}
          className="text-on-surface-variant font-bold text-sm hover:text-on-surface transition-all px-4 py-2 disabled:opacity-50"
        >
          {t('button_clear_queue')}
        </button>
      )}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className="px-12 py-4 bg-primary text-white font-black rounded-lg shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center gap-2 disabled:bg-surface-variant disabled:text-on-surface-variant disabled:shadow-none disabled:active:scale-100 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      >
        {isLoading && (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
        )}
        {buttonLabel}
      </button>
    </div>
  );
}

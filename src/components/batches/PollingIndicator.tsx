'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PollingIndicatorProps {
  isPolling: boolean;
}

export function PollingIndicator({ isPolling }: PollingIndicatorProps) {
  const t = useTranslations('batch-status');

  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={!isPolling}
      className={`flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] transition-opacity duration-300 ${
        isPolling ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <Loader2 size={12} className="animate-spin" />
      {t('polling.updating')}
    </span>
  );
}

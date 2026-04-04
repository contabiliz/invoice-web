'use client';

import { useTranslations } from 'next-intl';
import type { BatchPhase } from '@/hooks/useBatchUpload';

interface GlobalProgressBeamProps {
  totalDocs: number;
  completedDocs: number;
  phase: BatchPhase;
}

const VISIBLE_PHASES: BatchPhase[] = ['presigning', 'uploading', 'confirming'];

export function GlobalProgressBeam({ totalDocs, completedDocs, phase }: GlobalProgressBeamProps) {
  const t = useTranslations('upload');

  if (!VISIBLE_PHASES.includes(phase)) return null;

  const percent = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;
  const isIndeterminate = phase === 'presigning' || phase === 'confirming';

  return (
    <div
      className="fixed left-0 right-0 top-0 z-60"
      aria-label={t('progress_global_label')}
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-1.5 w-full bg-[var(--color-bg-muted)]">
        <div
          className={[
            'h-full bg-[var(--color-accent)] transition-all duration-300 ease-out',
            isIndeterminate ? 'animate-pulse w-full opacity-60' : '',
          ].join(' ')}
          style={isIndeterminate ? undefined : { width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

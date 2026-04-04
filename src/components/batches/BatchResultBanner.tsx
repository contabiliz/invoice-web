'use client';

import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { BatchStatus } from '@/lib/api/types';

type TerminalStatus = 'completed' | 'partial_failure' | 'failed';

interface BatchResultBannerProps {
  status: TerminalStatus;
  completed: number;
  failed: number;
}

const BANNER_CONFIG: Record<
  TerminalStatus,
  {
    role: 'status' | 'alert';
    icon: React.ElementType;
    bg: string;
    border: string;
    text: string;
    iconColor: string;
  }
> = {
  completed: {
    role: 'status',
    icon: CheckCircle2,
    bg: 'bg-[var(--color-status-success-bg)]',
    border: 'border-[var(--color-status-success)]',
    text: 'text-[var(--color-status-success)]',
    iconColor: 'text-[var(--color-status-success)]',
  },
  partial_failure: {
    role: 'status',
    icon: AlertTriangle,
    bg: 'bg-[var(--color-status-warning-bg)]',
    border: 'border-[var(--color-status-warning)]',
    text: 'text-[var(--color-status-warning)]',
    iconColor: 'text-[var(--color-status-warning)]',
  },
  failed: {
    role: 'alert',
    icon: XCircle,
    bg: 'bg-[var(--color-status-error-bg)]',
    border: 'border-[var(--color-status-error)]',
    text: 'text-[var(--color-status-error)]',
    iconColor: 'text-[var(--color-status-error)]',
  },
};

export function BatchResultBanner({ status, completed, failed }: BatchResultBannerProps) {
  const t = useTranslations('batch-status');
  const router = useRouter();
  const config = BANNER_CONFIG[status];
  const Icon = config.icon;

  const message =
    status === 'completed'
      ? t('banner.completed')
      : status === 'partial_failure'
        ? t('banner.partial_failure', { completed, failed })
        : t('banner.failed');

  return (
    <div
      role={config.role}
      className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${config.bg} ${config.border}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={`shrink-0 ${config.iconColor}`} />
        <p className={`text-sm font-medium ${config.text}`}>{message}</p>
      </div>

      <button
        type="button"
        onClick={() => router.push('/upload')}
        className="shrink-0 rounded px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
      >
        {t('banner.action_new_upload')}
      </button>
    </div>
  );
}

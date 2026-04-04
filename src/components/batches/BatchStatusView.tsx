'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { WifiOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBatchStatus, isTerminalStatus } from '@/hooks/useBatchStatus';
import type { DocumentTab } from '@/lib/api/batch-status-client';
import type { BatchStatus } from '@/lib/api/types';

import { BatchHeader } from './BatchHeader';
import { KpiCards } from './KpiCards';
import { BatchProgressBar } from './BatchProgressBar';
import { PollingIndicator } from './PollingIndicator';
import { BatchResultBanner } from './BatchResultBanner';
import { DocumentTabs } from './DocumentTabs';

interface BatchStatusViewProps {
  batchId: string;
}

export function BatchStatusView({ batchId }: BatchStatusViewProps) {
  const t = useTranslations('batch-status');
  const router = useRouter();
  const queryClient = useQueryClient();

  const { phase, batch, isPolling, errorKey } = useBatchStatus(batchId);

  const [activeTab, setActiveTab] = useState<DocumentTab>('all');
  const [page, setPage] = useState(1);
  const [isOffline, setIsOffline] = useState(false);

  // Resetar para página 1 ao trocar aba
  const handleTabChange = (tab: DocumentTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  // Offline handling — PRD §03.4 ADR-003
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      queryClient.invalidateQueries({ queryKey: ['batch-status', batchId] });
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [batchId, queryClient]);

  const isLoading = phase === 'loading';

  // ── Error page (404) ─────────────────────────────────────────────────────
  if (phase === 'error_page') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <AlertCircle size={40} className="text-[var(--color-status-error)]" />
        <p className="text-sm text-[var(--color-text-primary)] text-center max-w-sm">
          {t('errors.not_found')}
        </p>
        <button
          type="button"
          onClick={() => router.push('/upload')}
          className="flex items-center gap-2 rounded px-4 py-2 text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          <ArrowLeft size={15} />
          {t('errors.back_to_upload')}
        </button>
      </div>
    );
  }

  const counts = {
    total:      batch?.total      ?? 0,
    completed:  batch?.completed  ?? 0,
    processing: batch?.processing ?? 0,
    failed:     batch?.failed     ?? 0,
  };

  const isTerminal =
    phase === 'terminal' &&
    batch &&
    isTerminalStatus(batch.status as BatchStatus);

  return (
    <div className="px-6 py-6 space-y-5 max-w-5xl">
      {/* Offline toast */}
      {isOffline && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-[var(--color-status-warning)] bg-[var(--color-status-warning-bg)] px-3 py-2 text-sm text-[var(--color-status-warning)]"
        >
          <WifiOff size={15} className="shrink-0" />
          {t('errors.polling_network')}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <BatchHeader
          batchId={batchId}
          status={batch?.status ?? null}
          createdAt={batch?.created_at ?? null}
          phase={phase}
          isLoading={isLoading}
        />
        <PollingIndicator isPolling={isPolling} />
      </div>

      {/* KPI cards */}
      <KpiCards
        total={counts.total}
        completed={counts.completed}
        processing={counts.processing}
        failed={counts.failed}
        isLoading={isLoading}
      />

      {/* Progress bar */}
      <BatchProgressBar
        completed={counts.completed}
        total={counts.total}
        isLoading={isLoading}
      />

      {/* Result banner — visível apenas em terminal */}
      {isTerminal && batch && (
        <BatchResultBanner
          status={batch.status as 'completed' | 'partial_failure' | 'failed'}
          completed={batch.completed}
          failed={batch.failed}
        />
      )}

      {/* Document tabs + table */}
      <DocumentTabs
        batchId={batchId}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={counts}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}

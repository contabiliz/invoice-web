'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';
import { useBatchUpload } from '@/hooks/useBatchUpload';
import { GlobalProgressBeam } from './GlobalProgressBeam';
import { DropZone } from './DropZone';
import { FileList } from './FileList';
import { BatchSummaryBar } from './BatchSummaryBar';
import { UploadActions } from './UploadActions';
import { UploadResultSummary } from './UploadResultSummary';

export function UploadView() {
  const t = useTranslations('upload');
  const router = useRouter();
  const { state, addFiles, removeFile, clearFiles, submitBatch, retryPresign, retryConfirm } = useBatchUpload();

  const { phase, files, fileIds, batchId, presignErrorKey, confirmErrorKey, rateLimitCountdown } = state;

  useEffect(() => {
    if (phase === 'success_full' && batchId) {
      const timer = setTimeout(() => {
        router.push(`/batches/${batchId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, batchId, router]);

  const allItems = fileIds.map((id) => files[id]);
  const validItems = allItems.filter((f) => !f.validationError);
  const totalBytes = validItems.reduce((acc, f) => acc + f.file.size, 0);
  const completedDocs = allItems.filter((f) => f.uploadStatus === 'done').length;

  const isLoading = ['presigning', 'uploading', 'confirming'].includes(phase);
  const showDropZone = phase === 'idle' || phase === 'files_selected';
  const showFileList = fileIds.length > 0 && phase !== 'idle';
  const showSummary = fileIds.length > 0;

  const failedConfirmItems = Object.values(files)
    .filter((f) => f.confirmStatus === 'failed')
    .map((f) => ({ documentId: f.documentId ?? '', reason: f.confirmReason ?? '' }));

  const confirmedCount = Object.values(files).filter((f) => f.confirmStatus === 'confirmed').length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.14))]">
      {/* Global progress beam */}
      <GlobalProgressBeam
        totalDocs={validItems.length}
        completedDocs={completedDocs}
        phase={phase}
      />

      <div className="flex-1 p-10 max-w-6xl mx-auto w-full pb-32">
        {/* Offline banner */}
        {typeof window !== 'undefined' && !navigator.onLine && (
          <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--color-status-error)]/30 bg-[var(--color-status-error-bg)] px-4 py-3">
            <WifiOff size={16} className="shrink-0 text-[var(--color-status-error)]" aria-hidden="true" />
            <p className="text-sm text-[var(--color-status-error)]">{t('offline_banner')}</p>
          </div>
        )}

        {/* Result summary */}
        {['presign_error', 'confirm_error', 'success_full', 'success_partial'].includes(phase) && (
          <div className="mb-8">
            <UploadResultSummary
              phase={phase}
              confirmedCount={confirmedCount}
              failedItems={failedConfirmItems}
              presignErrorKey={presignErrorKey}
              confirmErrorKey={confirmErrorKey}
              onRetryPresign={retryPresign}
              onRetryConfirm={retryConfirm}
              batchId={batchId}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-[var(--color-text-secondary)] font-semibold text-xs uppercase tracking-[0.2em] mb-2">{t('header_title')}</h2>
            <h1 className="display-font text-5xl font-black tracking-tight text-[var(--color-text-primary)]">
              {phase === 'idle' ? t('header_idle') : t('header_active')}
            </h1>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-[var(--color-text-primary)] leading-none">{fileIds.length.toString().padStart(2, '0')}</div>
            <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold mt-1">{t('documents_count_label')}</div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-12 gap-8">

          {/* Main area */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
            {showDropZone && (
              <DropZone onFilesSelected={addFiles} isDisabled={isLoading} isCompact={fileIds.length > 0} />
            )}

            {showFileList && (
              <FileList items={allItems} onRemove={removeFile} phase={phase} />
            )}
          </div>

          {/* Side info panel */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-[var(--color-bg-surface)] p-8 rounded-xl sticky top-24 shadow-lg">
              <h3 className="text-lg font-black mb-8 text-[var(--color-text-primary)]">{t('info_panel_title')}</h3>
              <div className="space-y-6 text-sm text-[var(--color-text-secondary)]">
                <div>
                  <p className="text-xs uppercase tracking-widest font-black text-[var(--color-text-secondary)] mb-2">{t('info_files_count')}</p>
                  <p className="text-[var(--color-text-primary)] font-bold">{allItems.length}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-black text-[var(--color-text-secondary)] mb-2">{t('info_valid_files')}</p>
                  <p className="text-[var(--color-text-primary)] font-bold">{validItems.length}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-black text-[var(--color-text-secondary)] mb-2">{t('info_total_size')}</p>
                  <p className="text-[var(--color-text-primary)] font-bold font-mono-tabular">{totalBytes > 0 ? (totalBytes < 1024 * 1024 ? `~${(totalBytes / 1024 / 1024).toFixed(1)} MB` : `~${(totalBytes / 1024 / 1024).toFixed(0)} MB`) : '—'}</p>
                </div>
                <div className="pt-6 border-t border-[var(--color-border)]">
                  <p className="text-xs italic text-[var(--color-text-secondary)] mb-4 leading-relaxed">{t('info_security_note')}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Summary Bar + CTA (fixed bottom) */}
      <div className="fixed bottom-0 left-64 right-0 glass-panel border-t border-[var(--color-border)] p-6 flex items-center justify-between z-40 shadow-[-10px_0_15px_rgba(0,0,0,0.02)]">
        {showSummary ? (
          <BatchSummaryBar
            count={allItems.length}
            validCount={validItems.length}
            totalBytes={totalBytes}
          />
        ) : (
          <div className="flex flex-col opacity-50">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest font-black">{t('batch_statistics_label')}</span>
            <span className="font-bold text-lg text-[var(--color-text-primary)]">{t('empty_batch_stats')}</span>
          </div>
        )}

        <UploadActions
          phase={phase}
          validFileCount={validItems.length}
          rateLimitCountdown={rateLimitCountdown}
          onSubmit={submitBatch}
          onRetryPresign={retryPresign}
          onRetryConfirm={retryConfirm}
          onClearQueue={clearFiles}
        />
      </div>
    </div>
  );
}

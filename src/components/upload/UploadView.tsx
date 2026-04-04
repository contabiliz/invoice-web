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
          <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-error/30 bg-error-container px-4 py-3">
            <WifiOff size={16} className="shrink-0 text-error" aria-hidden="true" />
            <p className="text-sm text-error">{t('offline_banner')}</p>
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

        {/* Header Section */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-on-surface-variant font-semibold text-xs uppercase tracking-[0.2em] mb-2">Queue Management</h2>
            <h1 className="text-5xl font-black tracking-tight text-on-surface">
              Upload <span className="text-primary">{phase === 'idle' ? 'Pending' : 'Active'}</span>
            </h1>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-on-surface leading-none">{fileIds.length.toString().padStart(2, '0')}</div>
            <div className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-1">Documents Staged</div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left: Upload Area & File List */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
            {showDropZone && (
              <DropZone onFilesSelected={addFiles} isDisabled={isLoading} isCompact={fileIds.length > 0} />
            )}

            {showFileList && (
              <FileList items={allItems} onRemove={removeFile} phase={phase} />
            )}
          </div>

          {/* Right: Info Panel */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-on-surface text-white p-8 rounded-xl sticky top-24 shadow-2xl">
              <h3 className="text-xl font-black mb-8">Batch Metadata</h3>
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black block mb-3">Target Ledger</label>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-white/10 transition-all">
                    <span className="text-sm font-semibold">Global Accounts Pay</span>
                    <span className="material-symbols-outlined text-xl">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black block mb-3">Priority Level</label>
                  <div className="flex gap-2">
                    <button className="bg-primary text-white text-[10px] px-5 py-2 rounded-lg font-black uppercase tracking-wider">Standard</button>
                    <button className="bg-white/5 text-on-surface-variant text-[10px] px-5 py-2 rounded-lg font-black uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all">High</button>
                  </div>
                </div>
                <div className="pt-8 border-t border-white/10">
                  <p className="text-xs text-on-surface-variant mb-5 italic leading-relaxed">System will perform CRC-32 validation and hash check on all valid documents upon transmission.</p>
                  <div className="flex items-center gap-3 text-primary">
                    <span className="material-symbols-outlined text-lg">verified_user</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">Security: E2E Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Summary Bar & Primary CTA (Fixed at bottom) */}
      <div className="fixed bottom-0 left-64 right-0 glass-panel border-t border-outline p-6 flex items-center justify-between z-40 shadow-[-10px_0_15px_rgba(0,0,0,0.02)]">
        {showSummary ? (
          <BatchSummaryBar
            count={allItems.length}
            validCount={validItems.length}
            totalBytes={totalBytes}
          />
        ) : (
          <div className="flex flex-col opacity-50">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black">Batch Statistics</span>
            <span className="text-on-surface font-bold text-lg">0 arquivos — 0 MB</span>
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

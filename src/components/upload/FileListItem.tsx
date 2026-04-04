'use client';

import { useTranslations } from 'next-intl';
import type { FileItemState } from '@/hooks/useBatchUpload';
import { UploadProgressBar } from './UploadProgressBar';
// import { FileStatusBadge } from './FileStatusBadge'; 
// Badge replaced with inline warning/errors per Sovereign Ledger design.

interface FileListItemProps {
  item: FileItemState;
  onRemove: () => void;
  showRemoveButton: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getIcon(mimeType: string) {
  if (mimeType.includes('xml')) return 'data_object';
  if (mimeType.includes('pdf')) return 'picture_as_pdf';
  if (mimeType.startsWith('image/')) return 'image';
  return 'draft';
}

function getMimeFamily(mimeType: string) {
  if (mimeType.includes('xml')) return 'XML SCHEMA';
  if (mimeType.includes('pdf')) return 'DOCUMENT';
  if (mimeType.startsWith('image/')) return `IMAGE/${mimeType.split('/')[1].toUpperCase()}`;
  return 'FILE';
}

export function FileListItem({ item, onRemove, showRemoveButton }: FileListItemProps) {
  const t = useTranslations('upload');
  const hasError = item.validationError || item.uploadStatus === 'error';

  return (
    <div
      className={[
        'bg-white p-5 rounded-xl flex items-center justify-between transition-all group',
        hasError
          ? 'border-l-4 border-error shadow-sm hover:shadow-md'
          : 'border border-outline hover:border-primary/30 hover:shadow-md'
      ].join(' ')}
    >
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${hasError ? 'bg-error-container' : 'bg-surface-variant'}`}>
          <span className={`material-symbols-outlined ${hasError ? 'text-error' : 'text-primary'}`}>
            {hasError ? 'warning' : getIcon(item.file.type)}
          </span>
        </div>

        <div>
          <p className={`font-bold mono-font text-sm ${hasError ? 'text-error' : 'text-on-surface'}`} title={item.file.name}>
            {item.file.name}
          </p>

          <div className="flex items-center gap-3 mt-1">
            {hasError && (
              <span className="bg-error text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                {t(item.validationError ? (item.validationError as Parameters<typeof t>[0]) : (item.uploadError as Parameters<typeof t>[0]) || 'error')}
              </span>
            )}
            
            {item.uploadStatus === 'uploading' ? (
              <div className="w-32 mt-1 -mt-1"><UploadProgressBar value={item.uploadProgress} fileLabel={item.file.name} /></div>
            ) : (
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                {formatBytes(item.file.size)} {!hasError && `• ${getMimeFamily(item.file.type)}`}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {hasError && item.uploadError && (
          <p className="text-xs text-error font-bold hidden md:block">Upload falhou</p>
        )}
        
        {item.uploadStatus === 'done' && (
          <span className="material-symbols-outlined text-primary" title="Sucesso">check_circle</span>
        )}

        {showRemoveButton && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-on-surface-variant hover:text-error transition-colors outline-none focus:ring-2 focus:ring-error rounded"
            aria-label={t('button_remove_file')}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

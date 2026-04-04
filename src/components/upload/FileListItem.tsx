'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, Trash2, AlertTriangle, FileText, Image, File, Code } from 'lucide-react';
import type { FileItemState } from '@/hooks/useBatchUpload';
import { UploadProgressBar } from './UploadProgressBar';
import { formatBytes } from '@/lib/utils/format';

interface FileListItemProps {
  item: FileItemState;
  onRemove: () => void;
  showRemoveButton: boolean;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('xml')) return <Code size={20} />;
  if (mimeType.includes('pdf')) return <FileText size={20} />;
  if (mimeType.startsWith('image/')) return <Image size={20} />;
  return <File size={20} />;
}

export function FileListItem({ item, onRemove, showRemoveButton }: FileListItemProps) {
  const t = useTranslations('upload');
  const hasError = item.validationError || item.uploadStatus === 'error';

  return (
    <div
      className={[
        'p-5 rounded-xl flex items-center justify-between transition-all group',
        hasError
          ? 'border-l-4 border-[var(--color-status-error)] shadow-sm hover:shadow-md bg-[var(--color-status-error-bg)]'
          : 'border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:shadow-md bg-[var(--color-bg-surface)]'
      ].join(' ')}
    >
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${hasError ? 'bg-[var(--color-status-error-bg)]' : 'bg-[var(--color-bg-subtle)]'}`}>
          {hasError ? (
            <AlertTriangle className="text-[var(--color-status-error)]" size={20} />
          ) : (
            <span className="text-[var(--color-accent)]">{getFileIcon(item.file.type)}</span>
          )}
        </div>

        <div>
          <p className={`font-bold mono-font text-sm ${hasError ? 'text-[var(--color-status-error)]' : 'text-[var(--color-text-primary)]'}`} title={item.file.name}>
            {item.file.name}
          </p>

          <div className="flex items-center gap-3 mt-1">
            {hasError && (
              <span className="bg-[var(--color-status-error)] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                {t(item.validationError ? (item.validationError as Parameters<typeof t>[0]) : (item.uploadError as Parameters<typeof t>[0]) || 'error')}
              </span>
            )}

            {item.uploadStatus === 'uploading' ? (
              <div className="w-32 mt-1 -mt-1"><UploadProgressBar value={item.uploadProgress} fileLabel={item.file.name} /></div>
            ) : (
              <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">
                {formatBytes(item.file.size)} {!hasError && `• ${item.file.type?.split('/')[1]?.toUpperCase() || ''}`}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {hasError && item.uploadError && (
          <p className="text-xs text-[var(--color-status-error)] font-bold hidden md:block">{t('upload_failed_inline')}</p>
        )}

        <div className="flex items-center gap-2">
          {item.uploadStatus === 'done' && (
            <span title={t('status_done')}><CheckCircle className="text-[var(--color-accent)]" size={18} /></span>
          )}
          {item.uploadStatus === 'error' && (
            <span title={t('upload_failed_inline')}><XCircle className="text-[var(--color-status-error)]" size={18} /></span>
          )}
          {showRemoveButton && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-status-error)] transition-colors outline-none focus:ring-2 focus:ring-[var(--color-status-error)] rounded"
              aria-label={t('button_remove_file')}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

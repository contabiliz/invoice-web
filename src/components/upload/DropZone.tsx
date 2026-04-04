'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CloudUpload, Info } from 'lucide-react';
import { FileInput } from './FileInput';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isDisabled?: boolean;
  isCompact?: boolean;
}

export function DropZone({ onFilesSelected, isDisabled = false, isCompact = false }: DropZoneProps) {
  const t = useTranslations('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const inputId = 'file-input';

  const openPicker = () => {
    if (isDisabled) return;
    document.getElementById(inputId)?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDisabled) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isDisabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesSelected(files);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  if (isCompact) {
    return (
      <div className="w-full">
        <FileInput onFilesSelected={onFilesSelected} />
        <div
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          aria-label={t('dropzone_instruction')}
          aria-disabled={isDisabled}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openPicker}
          onKeyDown={handleKeyDown}
          className={[
            'bg-[var(--color-bg-surface)] rounded-xl p-10 border-2 border-dashed transition-all group flex flex-col items-center justify-center text-center shadow-sm w-full outline-none',
            isDragOver ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 cursor-pointer',
            isDisabled ? 'pointer-events-none opacity-50' : '',
          ].join(' ')}
        >
          <CloudUpload size={40} className="mb-4 text-[var(--color-text-secondary)] group-hover:scale-110 group-hover:text-[var(--color-accent)] transition-all" />
          <p className="text-[var(--color-text-primary)] font-bold text-lg">{t('dropzone_compact_title')}</p>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('dropzone_compact_subtitle')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <FileInput onFilesSelected={onFilesSelected} />
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={t('dropzone_instruction')}
        aria-disabled={isDisabled}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        className={[
          'bg-[var(--color-bg-surface)] border-2 border-dashed transition-all group relative min-h-[480px] flex flex-col items-center justify-center p-8 text-center rounded outline-none',
          isDragOver ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border-strong)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 cursor-pointer',
          isDisabled ? 'pointer-events-none opacity-50' : '',
        ].join(' ')}
      >
        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="w-16 h-16 bg-[var(--color-bg-subtle)] rounded flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:bg-[var(--color-accent)] transition-all">
            <CloudUpload className="text-[var(--color-accent)] group-hover:text-white transition-all" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{t('dropzone_title')}</h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-10 max-w-sm mx-auto">{t('dropzone_description')}</p>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['XML', 'PDF', 'JPEG', 'PNG', 'WEBP', 'TIFF'].map(ext => (
              <span key={ext} className="px-2.5 py-1 bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] text-[10px] font-bold uppercase tracking-wider rounded-sm">
                {ext}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-[var(--color-text-secondary)]">
            <Info size={18} />
            <span className="text-[11px] font-bold uppercase">{t('dropzone_max_size')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

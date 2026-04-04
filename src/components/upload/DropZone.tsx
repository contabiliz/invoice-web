'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
            'bg-white rounded-xl p-10 border-2 border-dashed transition-all group flex flex-col items-center justify-center text-center shadow-sm w-full outline-none',
            isDragOver ? 'border-primary bg-primary/5' : 'border-outline hover:border-primary hover:bg-primary/5 cursor-pointer',
            isDisabled ? 'pointer-events-none opacity-50' : '',
          ].join(' ')}
        >
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4 group-hover:scale-110 group-hover:text-primary transition-all">
            cloud_upload
          </span>
          <p className="text-on-surface font-bold text-lg">Drop more files here</p>
          <p className="text-sm text-on-surface-variant mt-1">
            or <span className="text-primary font-semibold hover:underline cursor-pointer">browse files</span> from your system
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
          'bg-white border-2 border-dashed transition-all group relative min-h-[480px] flex flex-col items-center justify-center p-8 text-center rounded outline-none',
          isDragOver ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary hover:bg-primary/5 cursor-pointer',
          isDisabled ? 'pointer-events-none opacity-50' : '',
        ].join(' ')}
      >
        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="w-16 h-16 bg-surface-variant rounded flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:bg-primary transition-all">
            <span className="material-symbols-outlined text-3xl text-primary group-hover:text-white">cloud_upload</span>
          </div>
          <h3 className="text-2xl font-bold text-on-surface mb-2">Arraste arquivos ou clique para selecionar</h3>
          <p className="text-on-surface-variant text-sm mb-10 max-w-sm mx-auto">Sincronize seus documentos fiscais diretamente com a infraestrutura Sovereign Ledger.</p>
          
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['XML', 'PDF', 'JPEG', 'PNG', 'WEBP', 'TIFF'].map(ext => (
              <span key={ext} className="px-2.5 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-wider rounded-sm">
                {ext}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-base">info</span>
            <span className="text-[11px] font-technical font-bold uppercase">MAX FILE SIZE: 50.00 MB / PER UPLOAD</span>
          </div>
        </div>
      </div>
    </div>
  );
}

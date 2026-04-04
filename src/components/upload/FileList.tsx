'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { FileItemState, BatchPhase } from '@/hooks/useBatchUpload';
import { FileListItem } from './FileListItem';

interface FileListProps {
  items: FileItemState[];
  onRemove: (internalId: string) => void;
  phase: BatchPhase;
}

const DISCLOSURE_THRESHOLD = 50;

export function FileList({ items, onRemove, phase }: FileListProps) {
  const t = useTranslations('upload');
  const [showAll, setShowAll] = useState(false);
  const showRemoveButton = phase === 'files_selected' || phase === 'idle';

  // Disclosure progressivo: em upload ativo, prioriza arquivos com erro/uploading
  const isUploading = phase === 'uploading';
  let visibleItems = items;

  if (isUploading && !showAll && items.length > DISCLOSURE_THRESHOLD) {
    visibleItems = items.filter(
      (item) => item.uploadStatus === 'uploading' || item.uploadStatus === 'error',
    );
  } else if (!showAll && items.length > DISCLOSURE_THRESHOLD) {
    visibleItems = items.slice(0, DISCLOSURE_THRESHOLD);
  }

  const hiddenCount = items.length - visibleItems.length;

  return (
    <div className="w-full">
      <div className="space-y-4" role="list">
        {visibleItems.map((item) => (
          <FileListItem
            key={item.internalId}
            item={item}
            onRemove={() => onRemove(item.internalId)}
            showRemoveButton={showRemoveButton}
          />
        ))}
      </div>

      {hiddenCount > 0 && !showAll && (
        <div className="mt-4 px-4 py-2 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t('button_see_all')} (+{hiddenCount})
          </button>
        </div>
      )}
    </div>
  );
}

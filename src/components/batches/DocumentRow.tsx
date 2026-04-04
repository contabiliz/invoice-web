'use client';

import { useTranslations } from 'next-intl';
import { memo } from 'react';
import type { DocumentItem } from '@/lib/api/types';
import { mapDocumentError } from '@/lib/api/errors';
import { DocTypeIcon } from './DocTypeIcon';
import { StatusBadge } from './StatusBadge';
import { ErrorTooltip } from './ErrorTooltip';

interface DocumentRowProps {
  item: DocumentItem;
  isError: boolean;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export const DocumentRow = memo(function DocumentRow({ item, isError }: DocumentRowProps) {
  const t = useTranslations('batch-status');

  return (
    <tr
      className={`text-sm transition-colors ${
        isError
          ? 'bg-[var(--color-status-error-bg)]'
          : 'even:bg-[var(--color-bg-muted)]/40 hover:bg-[var(--color-bg-subtle)]'
      }`}
    >
      {/* Arquivo */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <DocTypeIcon docType={item.doc_type} />
          <span
            className="truncate max-w-[240px] text-[var(--color-text-primary)] font-medium"
            title={item.filename}
          >
            {item.filename}
          </span>
        </div>
      </td>

      {/* Tipo */}
      <td className="px-3 py-2.5 text-xs text-[var(--color-text-secondary)] uppercase font-mono-tabular">
        {item.doc_type}
      </td>

      {/* Status */}
      <td className="px-3 py-2.5">
        <StatusBadge status={item.status} />
      </td>

      {/* Razão */}
      <td className="px-3 py-2.5">
        {item.error_reason ? (
          <ErrorTooltip
            mappedReason={t(mapDocumentError(item.error_reason))}
            technicalReason={item.error_reason}
          />
        ) : (
          <span className="text-[var(--color-text-secondary)]">—</span>
        )}
      </td>

      {/* Atualizado */}
      <td className="px-3 py-2.5 font-mono-tabular text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
        {formatDateTime(item.updated_at)}
      </td>
    </tr>
  );
});

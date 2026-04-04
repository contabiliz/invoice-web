'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { AnalyticsDocumentBreakdown } from '@/lib/api/types';

export interface DocumentTableProps {
  data: AnalyticsDocumentBreakdown[] | null;
  isLoading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  } | null;
}

function formatProcessingTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDocTypeLabel(type: string): string {
  switch (type) {
    case 'xml':
      return 'XML';
    case 'pdf':
      return 'PDF';
    case 'img':
      return 'Imagem';
    default:
      return type;
  }
}

function extractResultLabel(result: string): string {
  switch (result) {
    case 'success':
      return 'Sucesso';
    case 'failed':
      return 'Falhou';
    case 'partial':
      return 'Parcial';
    case 'skipped':
      return 'Ignorado';
    default:
      return result;
  }
}

function statusBadgeColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  }
}

function extractionResultColor(result: string): string {
  switch (result) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'partial':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  }
}

export function DocumentTable({
  data,
  isLoading,
  pagination,
}: DocumentTableProps) {
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 0;

  return (
    <div className="rounded-lg border border-outline bg-surface overflow-hidden">
      <div className="px-5 py-3 border-b border-outline">
        <h3 className="text-sm font-semibold text-on-surface">
          Detalhamento por documento
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface-variant/30">
              <th className="text-left px-5 py-3 text-on-surface-variant font-medium">
                Tipo
              </th>
              <th className="text-left px-5 py-3 text-on-surface-variant font-medium">
                Status
              </th>
              <th className="text-left px-5 py-3 text-on-surface-variant font-medium">
                Tempo
              </th>
              <th className="text-left px-5 py-3 text-on-surface-variant font-medium">
                Resultado
              </th>
              <th className="text-right px-5 py-3 text-on-surface-variant font-medium">
                Data
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-outline">
                  <td className="px-5 py-3">
                    <Skeleton className="h-4 w-10" />
                  </td>
                  <td className="px-5 py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-5 py-3">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-5 py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Skeleton className="h-4 w-28 ml-auto" />
                  </td>
                </tr>
              ))
            ) : data && data.length > 0 ? (
              data.map((doc) => (
                <tr key={doc.document_id} className="border-b border-outline">
                  <td className="px-5 py-3 font-mono tabular-nums text-on-surface">
                    {getDocTypeLabel(doc.type)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono tabular-nums ${statusBadgeColor(doc.status)}`}
                    >
                      {extractResultLabel(doc.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono tabular-nums text-on-surface">
                    {formatProcessingTime(doc.processing_time_ms)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono tabular-nums ${extractionResultColor(doc.extraction_result)}`}
                    >
                      {extractResultLabel(doc.extraction_result)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-on-surface-variant">
                    {formatDate(doc.created_at)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-on-surface-variant"
                >
                  Nenhum documento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-outline bg-surface-variant/20">
          <p className="text-xs text-on-surface-variant font-mono tabular-nums">
            {pagination.total} documentos
          </p>
          <div className="flex gap-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="px-3 py-1 text-xs rounded border border-outline disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-variant/50 text-on-surface-variant"
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`px-3 py-1 text-xs rounded border border-outline font-mono tabular-nums ${
                    pagination.page === pageNum
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-surface-variant/50 text-on-surface-variant'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="px-3 py-1 text-xs rounded border border-outline disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-variant/50 text-on-surface-variant"
            >
              Proxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

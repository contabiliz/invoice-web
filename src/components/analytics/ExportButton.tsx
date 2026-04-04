'use client';

import { useState } from 'react';
import type { AnalyticsDocumentBreakdown } from '@/lib/api/types';

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

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function buildCsvData(documents: AnalyticsDocumentBreakdown[]): string {
  const BOM = '\uFEFF';
  const headers = ['Tipo', 'Status', 'Tempo (ms)', 'Resultado', 'Data'];
  const rows = documents.map((doc) => [
    escapeCsvCell(getDocTypeLabel(doc.type)),
    escapeCsvCell(extractResultLabel(doc.status)),
    String(doc.processing_time_ms),
    escapeCsvCell(extractResultLabel(doc.extraction_result)),
    escapeCsvCell(doc.created_at),
  ]);

  const lines = [headers.join(','), ...rows.map((r) => r.join(','))];
  return BOM + lines.join('\r\n');
}

function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ExportButtonProps {
  documents: AnalyticsDocumentBreakdown[] | null;
  /** If true, exports all data (caller is responsible for fetching it). */
  exportAll?: boolean;
}

export function ExportButton({ documents, exportAll }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (!documents || documents.length === 0) return;

    setIsExporting(true);

    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const filename = `analytics-${dateStr}.csv`;
      const csv = buildCsvData(documents);
      downloadCsv(csv, filename);
    } finally {
      // Small delay so user sees the "Exportando" state
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  const canExport = !isExporting && documents && documents.length > 0;

  return (
    <button
      onClick={handleExport}
      disabled={!canExport}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-mono tabular-nums transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-outline text-on-surface hover:bg-surface-variant/50"
      aria-label="Exportar dados como CSV"
    >
      {isExporting ? 'Exportando' : 'Exportar CSV'}
    </button>
  );
}

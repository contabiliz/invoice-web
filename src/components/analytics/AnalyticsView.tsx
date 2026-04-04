'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TimeSeriesPreset } from '@/lib/api/analytics-client';
import {
  useAnalyticsKPIs,
  useAnalyticsTimeSeries,
  useAnalyticsDocuments,
} from '@/hooks/useAnalytics';
import { KPICards } from '@/components/analytics/KPICards';
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart';
import { DocumentTable } from '@/components/analytics/DocumentTable';
import { ExportButton } from '@/components/analytics/ExportButton';

export function AnalyticsView() {
  const t = useTranslations('analytics');
  const [page, setPage] = useState(1);
  const [preset, setPreset] = useState<TimeSeriesPreset>('mtd');

  const kpisQuery = useAnalyticsKPIs();
  const timeSeriesQuery = useAnalyticsTimeSeries(preset);
  const docsQuery = useAnalyticsDocuments({ page, pageSize: 20 });

  const kpiData = kpisQuery.data
    ? {
        total: kpisQuery.data.total_documents,
        successRate: kpisQuery.data.success_rate,
        failures: kpisQuery.data.failure_count,
      }
    : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-on-surface">
          {t('page_title')}
        </h1>
        <ExportButton
          documents={docsQuery.data?.items ?? null}
        />
      </div>

      <KPICards data={kpiData} isLoading={kpisQuery.isLoading} />

      <TimeSeriesChart
        data={timeSeriesQuery.data ?? null}
        isLoading={timeSeriesQuery.isLoading}
        preset={preset}
        onPresetChange={setPreset}
      />

      <DocumentTable
        data={docsQuery.data?.items ?? null}
        isLoading={docsQuery.isLoading}
        pagination={
          docsQuery.data
            ? {
                page,
                pageSize: 20,
                total: docsQuery.data.total,
                onPageChange: setPage,
              }
            : null
        }
      />

      {kpisQuery.isError || timeSeriesQuery.isError || docsQuery.isError ? (
        <p className="text-sm text-red-600 text-center">
          {t('errors.load_failed')}
        </p>
      ) : null}
    </div>
  );
}

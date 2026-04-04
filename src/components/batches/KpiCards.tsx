'use client';

import { KpiCard } from './KpiCard';

interface KpiCardsProps {
  total: number;
  completed: number;
  processing: number;
  failed: number;
  isLoading: boolean;
}

export function KpiCards({ total, completed, processing, failed, isLoading }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard labelKey="kpi.total"      value={total}      variant="neutral" isLoading={isLoading} />
      <KpiCard labelKey="kpi.completed"  value={completed}  variant="success" isLoading={isLoading} />
      <KpiCard labelKey="kpi.processing" value={processing} variant="warning" isLoading={isLoading} />
      <KpiCard labelKey="kpi.failed"     value={failed}     variant="error"   isLoading={isLoading} />
    </div>
  );
}

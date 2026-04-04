'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimeSeriesPreset } from '@/lib/api/analytics-client';
import type { AnalyticsTimeSeriesPoint } from '@/lib/api/types';

export interface TimeSeriesChartProps {
  data: AnalyticsTimeSeriesPoint[] | null;
  isLoading: boolean;
  preset: TimeSeriesPreset;
  onPresetChange: (preset: TimeSeriesPreset) => void;
}

const PRESET_KEYS: TimeSeriesPreset[] = ['7d', '30d', '90d', 'mtd'];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function TimeSeriesChart({
  data,
  isLoading,
  preset,
  onPresetChange,
}: TimeSeriesChartProps) {
  const t = useTranslations('analytics');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const chartData =
    isLoading || !data
      ? []
      : data.map((p) => ({
          date: p.date,
          total: p.total,
          success: p.success,
          failure: p.failure,
          dateLabel: formatDateLabel(p.date),
        }));

  return (
    <div className="rounded-lg border border-outline bg-surface p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-on-surface">
          {t('chart_title')}
        </h3>
        <div className="flex gap-2">
          {PRESET_KEYS.map((p) => (
            <button
              key={p}
              onClick={() => onPresetChange(p)}
              className={`px-3 py-1 text-xs rounded-md transition-all font-mono tabular-nums ${
                preset === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80'
              }`}
            >
              {t(`preset_${p}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-64 w-full" />
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-center text-sm text-on-surface-variant py-12">
          {t('chart_empty')}
        </p>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <button
              onClick={() =>
                setChartType((c) => (c === 'line' ? 'bar' : 'line'))
              }
              className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface rounded border border-outline bg-transparent"
            >
              {chartType === 'line'
                ? t('chart_toggle_bars')
                : t('chart_toggle_lines')}
            </button>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dateLabel" />
                <YAxis fontSize={12} fontFamily="'Geist Mono', monospace" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="failure"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dateLabel" />
                <YAxis fontSize={12} fontFamily="'Geist Mono', monospace" />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" />
                <Bar dataKey="success" fill="#22c55e" />
                <Bar dataKey="failure" fill="#ef4444" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

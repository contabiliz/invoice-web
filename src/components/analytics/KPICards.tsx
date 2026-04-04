'use client';

import { Skeleton } from '@/components/ui/skeleton';

export interface KPIData {
  total: number;
  successRate: number;
  failures: number;
}

export interface KPICardsProps {
  data: KPIData | null;
  isLoading: boolean;
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  const cards = [
    {
      label: 'Total de documentos',
      value: data?.total ?? 0,
      format: (v: number) => v.toLocaleString('pt-BR'),
    },
    {
      label: 'Taxa de sucesso',
      value: data?.successRate ?? 0,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      label: 'Falhas',
      value: data?.failures ?? 0,
      format: (v: number) => v.toLocaleString('pt-BR'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-outline bg-surface p-5"
        >
          <p className="text-sm text-on-surface-variant">{card.label}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-on-surface mt-1 font-mono tabular-nums">
              {card.format(card.value)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

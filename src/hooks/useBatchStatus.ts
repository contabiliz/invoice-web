'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getBatchStatus } from '@/lib/api/batch-status-client';
import { BatchApiError } from '@/lib/api/types';
import type { BatchStatus, BatchStatusResponse } from '@/lib/api/types';

// ─── Tipos exportados ────────────────────────────────────────────────────────

export type BatchUIPhase =
  | 'loading'         // Carregamento inicial — skeleton visível
  | 'active_polling'  // Batch em processamento — polling ativo
  | 'polling_error'   // Erro de rede transitório — toast + retry automático
  | 'terminal'        // Status final atingido — polling parado
  | 'error_page';     // 404 ou irrecuperável — página de erro

// ─── Funções puras (testáveis isoladamente) ──────────────────────────────────

export function isTerminalStatus(status: BatchStatus): boolean {
  return ['completed', 'partial_failure', 'failed'].includes(status);
}

/** Retorna o intervalo de polling em ms, ou false para parar. */
export function getPollingInterval(
  batch: BatchStatusResponse | null | undefined,
): number | false {
  if (!batch) return false;
  if (isTerminalStatus(batch.status)) return false;
  if (batch.processing > 0) return 2_000;
  if (batch.queued > 0) return 5_000;
  return 3_000;
}

function deriveBatchPhase(
  isLoading: boolean,
  isError: boolean,
  error: unknown,
  data: BatchStatusResponse | undefined,
): BatchUIPhase {
  if (isLoading && !data) return 'loading';
  if (isError) {
    if (error instanceof BatchApiError && error.status === 404) return 'error_page';
    return 'polling_error';
  }
  if (!data) return 'loading';
  if (isTerminalStatus(data.status)) return 'terminal';
  return 'active_polling';
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBatchStatus(batchId: string): {
  phase: BatchUIPhase;
  batch: BatchStatusResponse | null;
  isPolling: boolean;
  errorKey: string | null;
} {
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['batch-status', batchId],
    queryFn: () => getBatchStatus(batchId),
    refetchInterval: (q) => getPollingInterval(q.state.data),
    retry: (failureCount, error) => {
      // 404 e 401 são terminais — não retentar
      if (
        error instanceof BatchApiError &&
        (error.status === 404 || error.status === 401)
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // 401 → redirect para login
  useEffect(() => {
    if (
      query.error instanceof BatchApiError &&
      query.error.status === 401
    ) {
      router.push('/login');
    }
  }, [query.error, router]);

  // Reconexão online: force refetch
  useEffect(() => {
    const handleOnline = () => {
      queryClient.invalidateQueries({ queryKey: ['batch-status', batchId] });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [batchId, queryClient]);

  const phase = deriveBatchPhase(
    query.isLoading,
    query.isError,
    query.error,
    query.data,
  );

  const errorKey =
    phase === 'error_page' ? 'errors.not_found' :
    phase === 'polling_error' ? 'errors.polling_network' :
    null;

  return {
    phase,
    batch: query.data ?? null,
    isPolling: phase === 'active_polling',
    errorKey,
  };
}

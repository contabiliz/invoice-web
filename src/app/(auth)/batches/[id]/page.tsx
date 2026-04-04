import type { Metadata } from 'next';
import { BatchStatusView } from '@/components/batches';

interface BatchStatusPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Status do Batch — Contabiliz',
};

// Server Component — await params (Next.js 15) e passa batchId para CC
export default async function BatchStatusPage({ params }: BatchStatusPageProps) {
  const { id } = await params;

  return <BatchStatusView batchId={id} />;
}

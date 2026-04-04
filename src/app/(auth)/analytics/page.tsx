import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('analytics');
  return { title: `${t('page_title')} - Contabiliz` };
}

export default function AnalyticsPage() {
  return <AnalyticsView />;
}

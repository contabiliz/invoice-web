import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { UploadView } from '@/components/upload/UploadView';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('upload');
  return { title: `${t('page_title')} — ${t('auth_brand')}` };
}

export default function UploadPage() {
  return <UploadView />;
}

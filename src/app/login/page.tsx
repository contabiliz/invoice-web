import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

type Props = {
  searchParams: Promise<{ registered?: string; callbackUrl?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('upload');
  return { title: `${t('auth_login_title')} — ${t('auth_brand')}` };
}

export default async function LoginPage({ searchParams }: Props) {
  const { registered } = await searchParams;
  return (
    <Suspense>
      <LoginForm showRegisteredToast={registered === 'true'} />
    </Suspense>
  );
}

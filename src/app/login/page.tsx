import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Entrar — Contabiliz',
};

type Props = {
  searchParams: Promise<{ registered?: string; callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { registered } = await searchParams;
  return (
    <Suspense>
      <LoginForm showRegisteredToast={registered === 'true'} />
    </Suspense>
  );
}

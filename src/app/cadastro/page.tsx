import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('upload');
  return { title: `${t('auth_signup_title')} — ${t('auth_brand')}` };
}

export default function CadastroPage() {
  return <SignupForm />;
}

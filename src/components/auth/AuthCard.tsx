'use client';

import { useTranslations } from 'next-intl';

type AuthCardProps = {
  subtitle: string;
  children: React.ReactNode;
};

export function AuthCard({ subtitle, children }: AuthCardProps) {
  const t = useTranslations('upload');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-4 py-12">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
          <span className="text-base font-bold text-white">C</span>
        </div>
        <span className="text-lg font-semibold text-text-primary">{t('auth_brand')}</span>
        <p className="text-center text-sm text-text-secondary">{subtitle}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-xl border border-border bg-bg-surface p-6 shadow-sm">
        {children}
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-text-disabled">
        {t('auth_footer')}
      </footer>
    </main>
  );
}

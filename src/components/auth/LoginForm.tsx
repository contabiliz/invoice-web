'use client';

import { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginFormValues } from '@/lib/auth/schemas';
import { mapSupabaseAuthError } from '@/lib/auth/errors';
import { getSafeCallbackUrl } from '@/lib/auth/utils';
import { AuthCard } from './AuthCard';
import { AuthErrorBanner } from './AuthErrorBanner';
import { PasswordInput } from './PasswordInput';

type LoginFormProps = {
  showRegisteredToast?: boolean;
};

export function LoginForm({ showRegisteredToast }: LoginFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  useEffect(() => {
    if (submitError) setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedEmail, watchedPassword]);

  useEffect(() => {
    if (submitError) errorBannerRef.current?.focus();
  }, [submitError]);

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setSubmitError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setSubmitError(t(mapSupabaseAuthError(error)));
      setIsLoading(false);
      return;
    }

    const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'));
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <AuthCard subtitle={t('login.subtitle')}>
      {showRegisteredToast && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-status-success-bg px-3 py-2.5 text-sm text-status-success">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('toast.account_created')}</span>
        </div>
      )}

      <h1 className="mb-1 text-lg font-semibold text-text-primary">{t('login.heading')}</h1>
      <p className="mb-5 text-sm text-text-secondary">{t('login.subheading')}</p>

      {submitError && <AuthErrorBanner ref={errorBannerRef} message={submitError} />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-text-secondary">
            {t('fields.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nome@empresa.com.br"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="w-full rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent aria-[invalid=true]:border-status-error"
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-xs text-status-error">
              {t(errors.email.message!)}
            </p>
          )}
        </div>

        {/* Senha */}
        <PasswordInput
          id="password"
          label={t('fields.password')}
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password ? t(errors.password.message!) : undefined}
          rightLabel={
            <button
              type="button"
              disabled
              title={t('forgot_password.tooltip')}
              className="cursor-not-allowed text-xs text-accent opacity-40"
              aria-disabled="true"
            >
              {t('forgot_password.label')}
            </button>
          }
          {...register('password')}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t('login.cta')}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-text-secondary">
        {t('login.no_account')}{' '}
        <Link href="/cadastro" className="font-medium text-accent hover:underline">
          {t('login.signup_link')}
        </Link>
      </p>
    </AuthCard>
  );
}

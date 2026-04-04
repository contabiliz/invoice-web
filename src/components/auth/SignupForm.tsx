'use client';

import { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Loader2, ShieldCheck } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { signupSchema, type SignupFormValues } from '@/lib/auth/schemas';
import { mapSupabaseAuthError } from '@/lib/auth/errors';
import { AuthCard } from './AuthCard';
import { AuthErrorBanner } from './AuthErrorBanner';
import { PasswordInput } from './PasswordInput';

export function SignupForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');
  const watchedConfirm = watch('confirmPassword');

  useEffect(() => {
    if (submitError) setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedEmail, watchedPassword, watchedConfirm]);

  useEffect(() => {
    if (submitError) errorBannerRef.current?.focus();
  }, [submitError]);

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    setSubmitError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setSubmitError(t(mapSupabaseAuthError(error)));
      setIsLoading(false);
      return;
    }

    router.push('/login?registered=true');
  };

  return (
    <AuthCard subtitle={t('signup.subtitle')}>
      <h1 className="mb-5 text-lg font-semibold text-text-primary">{t('signup.heading')}</h1>

      {submitError && <AuthErrorBanner ref={errorBannerRef} message={submitError} />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
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
          label={t('fields.password_signup')}
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password ? t(errors.password.message!) : undefined}
          {...register('password')}
        />

        {/* Confirmar senha */}
        <PasswordInput
          id="confirmPassword"
          label={t('fields.confirm_password')}
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword ? t(errors.confirmPassword.message!) : undefined}
          {...register('confirmPassword')}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t('signup.cta')}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        {t('signup.has_account')}{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">
          {t('signup.login_link')}
        </Link>
      </p>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-disabled">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{t('signup.lgpd_note')}</span>
      </div>
    </AuthCard>
  );
}

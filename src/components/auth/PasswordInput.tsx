'use client';

import { useState, forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  rightLabel?: React.ReactNode;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, rightLabel, id = 'password', ...props }, ref) => {
    const t = useTranslations('upload');
    const [show, setShow] = useState(false);
    const errorId = `${id}-error`;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
          {rightLabel}
        </div>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={show ? 'text' : 'password'}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="w-full rounded-lg border border-border bg-bg-base px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent aria-[invalid=true]:border-status-error"
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? t('password_hide') : t('password_show')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary"
          >
            {show ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-status-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

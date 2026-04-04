'use client';

import { AlertCircle } from 'lucide-react';
import { forwardRef } from 'react';

type AuthErrorBannerProps = {
  message: string;
};

export const AuthErrorBanner = forwardRef<HTMLDivElement, AuthErrorBannerProps>(
  ({ message }, ref) => (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="mb-4 flex items-start gap-2 rounded-lg bg-status-error-bg px-3 py-2.5 text-sm text-status-error outline-none"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  ),
);

AuthErrorBanner.displayName = 'AuthErrorBanner';

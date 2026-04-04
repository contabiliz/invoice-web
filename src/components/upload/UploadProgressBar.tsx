'use client';

import { useTranslations } from 'next-intl';

interface UploadProgressBarProps {
  value: number;
  fileLabel: string;
}

export function UploadProgressBar({ value, fileLabel }: UploadProgressBarProps) {
  const t = useTranslations('upload');

  return (
    <div className="w-full">
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('progress_file_label', { filename: fileLabel })}
        className="h-1 w-full rounded-full bg-bg-muted overflow-hidden"
      >
        <div
          className="h-full bg-accent transition-all duration-150 ease-out rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ACCEPTED_MIME_TYPES } from '@/lib/api/types';

interface FileInputProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileInput({ onFilesSelected }: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('upload');

  const acceptString = [
    '.xml',
    '.pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff',
  ].join(',');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onFilesSelected(files);
    // Reset para permitir reselecionar o mesmo arquivo
    e.target.value = '';
  };

  return (
    <input
      ref={inputRef}
      id="file-input"
      type="file"
      multiple
      accept={acceptString}
      className="sr-only"
      aria-label={t('file_input_aria_label')}
      onChange={handleChange}
    />
  );
}

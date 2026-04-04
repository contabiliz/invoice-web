'use client';

import { useRouter } from 'next/navigation';

type LanguageToggleProps = {
  currentLocale: 'en' | 'pt-BR';
};

const LABELS = { en: 'EN', 'pt-BR': 'PT' } as const;

export function LanguageToggle({ currentLocale }: LanguageToggleProps) {
  const router = useRouter();
  const other: 'en' | 'pt-BR' = currentLocale === 'en' ? 'pt-BR' : 'en';

  const switchLocale = (locale: 'en' | 'pt-BR') => {
    document.cookie = `locale=${locale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex items-center text-[11px] font-bold tracking-wider">
      <button
        className={`transition-colors ${
          currentLocale === 'en'
            ? 'text-primary'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
        onClick={() => switchLocale('en')}
      >
        {LABELS.en}
      </button>
      <span className="mx-1 text-outline select-none">|</span>
      <button
        className={`transition-colors ${
          currentLocale === 'pt-BR'
            ? 'text-primary'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
        onClick={() => switchLocale('pt-BR')}
      >
        {LABELS['pt-BR']}
      </button>
    </div>
  );
}

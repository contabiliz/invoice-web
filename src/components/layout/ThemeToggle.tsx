'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

const THEMES = ['system', 'light', 'dark'] as const;

const ICONS = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const current = (theme as (typeof THEMES)[number]) ?? 'system';
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  const Icon = ICONS[current];

  const labels: Record<(typeof THEMES)[number], string> = {
    system: 'Sistema',
    light: 'Claro',
    dark: 'Escuro',
  };

  return (
    <button
      onClick={() => setTheme(next)}
      className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all"
      title={`Tema: ${labels[current]}`}
      aria-label={`Tema atual: ${labels[current]}. Clique para alternar.`}
    >
      <Icon size={18} />
    </button>
  );
}

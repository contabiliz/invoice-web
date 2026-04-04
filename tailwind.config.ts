import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          subtle: 'var(--color-bg-subtle)',
          muted: 'var(--color-bg-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          disabled: 'var(--color-text-disabled)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
        },
        status: {
          success: 'var(--color-status-success)',
          'success-bg': 'var(--color-status-success-bg)',
          warning: 'var(--color-status-warning)',
          'warning-bg': 'var(--color-status-warning-bg)',
          error: 'var(--color-status-error)',
          'error-bg': 'var(--color-status-error-bg)',
          neutral: 'var(--color-status-neutral)',
          'neutral-bg': 'var(--color-status-neutral-bg)',
        },
        // Sovereign Ledger Design Tokens
        primary: {
          DEFAULT: '#0070F3',
          dark: '#005ecf',
        },
        'on-primary': '#ffffff',
        background: '#F8FAFC',
        surface: {
          DEFAULT: '#ffffff',
          variant: '#F1F5F9',
        },
        outline: {
          DEFAULT: '#E2E8F0',
          variant: '#d1d5db',
        },
        'on-surface': {
          DEFAULT: '#0F172A',
          variant: '#64748B',
        },
        error: {
          DEFAULT: '#EF4444',
          container: '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
        headline: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
        display: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
        label: ['var(--font-inter)', 'Inter', 'sans-serif'],
        technical: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '1.5' }],
        sm: ['12px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.6' }],
        md: ['15px', { lineHeight: '1.5', fontWeight: '500' }],
        lg: ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        xl: ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        '2xl': ['28px', { lineHeight: '1.2', fontWeight: '600' }],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;

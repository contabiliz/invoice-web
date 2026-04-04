import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LanguageToggle } from '../LanguageToggle';

const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, push: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

function cookieContains(value: string): boolean {
  return document.cookie.includes(value);
}

describe('LanguageToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie =
      'locale=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  // T-I18N-10
  describe('T-I18N-10: renders EN and PT buttons with active one highlighted', () => {
    it('shows EN active and PT inactive when currentLocale is en', () => {
      render(<LanguageToggle currentLocale="en" />);
      const enBtn = screen.getByText('EN');
      const ptBtn = screen.getByText('PT');

      expect(enBtn).toHaveClass('text-primary');
      expect(ptBtn).toHaveClass('text-on-surface-variant');
    });

    it('shows PT active and EN inactive when currentLocale is pt-BR', () => {
      render(<LanguageToggle currentLocale="pt-BR" />);
      const enBtn = screen.getByText('EN');
      const ptBtn = screen.getByText('PT');

      expect(ptBtn).toHaveClass('text-primary');
      expect(enBtn).toHaveClass('text-on-surface-variant');
    });
  });

  // T-I18N-11
  describe('T-I18N-11: clicking inactive button changes locale and refreshes', () => {
    it('switches to pt-BR and refreshes when clicking PT while current is en', async () => {
      render(<LanguageToggle currentLocale="en" />);
      const ptBtn = screen.getByText('PT');

      await userEvent.click(ptBtn);

      expect(cookieContains('locale=pt-BR')).toBe(true);
      expect(mockRefresh).toHaveBeenCalledOnce();
    });

    it('switches to en and refreshes when clicking EN while current is pt-BR', async () => {
      render(<LanguageToggle currentLocale="pt-BR" />);
      const enBtn = screen.getByText('EN');

      await userEvent.click(enBtn);

      expect(cookieContains('locale=en')).toBe(true);
      expect(mockRefresh).toHaveBeenCalledOnce();
    });
  });
});

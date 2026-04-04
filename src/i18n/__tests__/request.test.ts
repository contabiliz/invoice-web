import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { resolveLocale } from '../request';

describe('i18n/request.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // T-I18N-01
  it('defaults to pt-BR when no locale cookie exists', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const locale = await resolveLocale();
    expect(locale).toBe('pt-BR');
  });

  // T-I18N-02
  it('uses en when locale cookie is en', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ name: 'locale', value: 'en' }),
    } as any);

    const locale = await resolveLocale();
    expect(locale).toBe('en');
  });

  // T-I18N-03
  it('falls back to pt-BR for invalid locale cookie', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ name: 'locale', value: 'fr' }),
    } as any);

    const locale = await resolveLocale();
    expect(locale).toBe('pt-BR');
  });

  // T-I18N-04
  it('falls back to pt-BR for directory traversal attempt', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({
        name: 'locale',
        value: '../../../etc/passwd',
      }),
    } as any);

    const locale = await resolveLocale();
    expect(locale).toBe('pt-BR');
  });
});

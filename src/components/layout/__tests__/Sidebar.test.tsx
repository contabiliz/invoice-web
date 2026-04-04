import { describe, it, expect, vi } from 'vitest';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
  getLocale: vi.fn().mockResolvedValue('pt-BR'),
  getMessages: vi.fn().mockResolvedValue({}),
}));

import { getTranslations } from 'next-intl/server';

// T-I18N-12
describe('Sidebar', () => {
  it('T-I18N-12: calls getTranslations with layout namespace', async () => {
    vi.clearAllMocks();
    const { Sidebar } = await import('../Sidebar');
    await Sidebar();

    expect(vi.mocked(getTranslations)).toHaveBeenCalledWith('layout');
  });
});

// T-I18N-13
describe('TopNavBar', () => {
  it('T-I18N-13: calls getTranslations with layout namespace', async () => {
    vi.clearAllMocks();
    const { TopNavBar } = await import('../TopNavBar');
    await TopNavBar({ children: <div /> });

    expect(vi.mocked(getTranslations)).toHaveBeenCalledWith('layout');
  });
});

import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';

import { applyLocaleCookie } from '@/middleware';

describe('middleware-i18n', () => {
  // T-I18N-05
  it('T-I18N-05: sets locale=pt-BR cookie on first visit', () => {
    const res = NextResponse.next();
    applyLocaleCookie(res);

    expect(res.cookies.get('locale')?.value).toBe('pt-BR');
    expect(res.cookies.get('locale')?.path).toBe('/');
    expect(res.cookies.get('locale')?.maxAge).toBe(31536000);
  });

  // T-I18N-06
  it('T-I18N-06: does not override existing locale cookie on response', () => {
    const res = NextResponse.next();
    res.cookies.set('locale', 'en', { path: '/', maxAge: 31536000 });
    applyLocaleCookie(res);

    expect(res.cookies.get('locale')?.value).toBe('en');
  });
});
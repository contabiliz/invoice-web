import { describe, it, expect } from 'vitest';
import { mapSupabaseAuthError } from '../errors';
import type { AuthError } from '@supabase/supabase-js';

const makeError = (message: string, status?: number): AuthError =>
  ({ message, status, name: 'AuthApiError' }) as AuthError;

describe('mapSupabaseAuthError', () => {
  it('maps Invalid login credentials', () => {
    expect(mapSupabaseAuthError(makeError('Invalid login credentials'))).toBe(
      'errors.invalid_credentials',
    );
  });

  it('maps Email not confirmed', () => {
    expect(mapSupabaseAuthError(makeError('Email not confirmed'))).toBe(
      'errors.email_not_confirmed',
    );
  });

  it('maps User already registered', () => {
    expect(mapSupabaseAuthError(makeError('User already registered'))).toBe(
      'errors.email_already_registered',
    );
  });

  it('maps already been registered variant', () => {
    expect(mapSupabaseAuthError(makeError('Email has already been registered'))).toBe(
      'errors.email_already_registered',
    );
  });

  it('maps password error', () => {
    expect(
      mapSupabaseAuthError(makeError('Password should be at least 6 characters')),
    ).toBe('errors.password_too_short');
  });

  it('maps 429 rate limit by status', () => {
    expect(mapSupabaseAuthError(makeError('Too many requests', 429))).toBe(
      'errors.rate_limited',
    );
  });

  it('maps 500 server error', () => {
    expect(mapSupabaseAuthError(makeError('Internal server error', 500))).toBe(
      'errors.server_error',
    );
  });

  it('maps missing status as server error', () => {
    expect(mapSupabaseAuthError(makeError('Something broke'))).toBe('errors.server_error');
  });

  it('maps unknown 400 error to unexpected', () => {
    expect(mapSupabaseAuthError(makeError('Something weird happened', 400))).toBe(
      'errors.unexpected',
    );
  });
});

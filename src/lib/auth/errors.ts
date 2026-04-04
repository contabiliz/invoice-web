import type { AuthError } from '@supabase/supabase-js';

/**
 * Mapeia AuthError do Supabase para chave i18n do namespace 'auth'.
 * Nunca expõe error.message ao caller — retorna sempre uma chave válida.
 */
export function mapSupabaseAuthError(error: AuthError): string {
  if (error.message.includes('Invalid login credentials')) {
    return 'errors.invalid_credentials';
  }
  if (error.message.includes('Email not confirmed')) {
    return 'errors.email_not_confirmed';
  }
  if (
    error.message.includes('User already registered') ||
    error.message.includes('already been registered')
  ) {
    return 'errors.email_already_registered';
  }
  if (error.message.toLowerCase().includes('password')) {
    return 'errors.password_too_short';
  }
  if (error.status === 429) {
    return 'errors.rate_limited';
  }
  if (!error.status || error.status >= 500) {
    return 'errors.server_error';
  }
  return 'errors.unexpected';
}

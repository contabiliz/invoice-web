import { getRequestConfig as i18nGetRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const VALID_LOCALES = ['en', 'pt-BR'] as const;

export async function resolveLocale(): Promise<(typeof VALID_LOCALES)[number]> {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get('locale')?.value;
  return VALID_LOCALES.includes(rawLocale as (typeof VALID_LOCALES)[number])
    ? (rawLocale as (typeof VALID_LOCALES)[number])
    : 'pt-BR';
}

export const getRequestConfig = i18nGetRequestConfig(async () => {
  const locale = await resolveLocale();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

export default getRequestConfig;

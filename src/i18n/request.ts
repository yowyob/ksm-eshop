import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // Récupérer la locale reçue par la requête (soit via le middleware ou le cookie)
  let locale = await requestLocale;
  
  // Fallback si la locale est invalide ou absente
  if (!locale || !['fr', 'en'].includes(locale)) {
    locale = 'fr';
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});

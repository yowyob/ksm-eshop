import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // 1. Détecter la locale (cookie ou accept-language)
  let locale = request.cookies.get('NEXT_LOCALE')?.value;

  if (!locale || !['fr', 'en'].includes(locale)) {
    const acceptLang = request.headers.get('accept-language') || '';
    locale = acceptLang.toLowerCase().startsWith('en') ? 'en' : 'fr';
  }

  // 2. Proposer la locale à next-intl
  const response = NextResponse.next();
  response.headers.set('x-next-intl-locale', locale);
  
  // Configurer le cookie s'il n'est pas déjà défini
  if (request.cookies.get('NEXT_LOCALE')?.value !== locale) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 31536000, // 1 an
      sameSite: 'lax'
    });
  }

  return response;
}

export const config = {
  // Exclure les assets statiques, l'API, etc.
  matcher: ['/((?!_next/static|_next/image|api|favicon.ico|.*\\..*).*)'],
};

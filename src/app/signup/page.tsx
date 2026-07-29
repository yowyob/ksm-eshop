'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, ArrowLeft } from 'lucide-react';

import { useTranslations } from 'next-intl';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('Signup');

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const code = formData.get('code') as string;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, code })
      });
      const data = await res.json();
      
      if (data.success || res.ok) {
        // Rediriger vers login après succès
        if (data.emailVerificationRequired) {
          router.push(`/login?registered=true&verify=true`);
        } else {
          router.push(`/login?registered=true`);
        }
      } else {
        setError(data.message || t('errorMsg'));
      }
    } catch (err: any) {
      setError(t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link href="/">
        <Button variant="ghost" className="absolute top-4 left-4 sm:top-8 sm:left-8 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 rounded-full h-12 w-12 p-0 flex items-center justify-center">
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </Link>
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border-2 border-zinc-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-2 text-3xl font-black text-zinc-900 uppercase tracking-tighter italic">
            {t('title')}
          </h2>
          <p className="mt-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
            {t('subtitle')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center border-2 border-red-200">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-zinc-700 mb-1">
                {t('usernameLabel')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-zinc-200 placeholder-zinc-400 text-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent font-medium transition-all"
                placeholder={t('usernamePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-zinc-700 mb-1">
                {t('emailLabel')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-zinc-200 placeholder-zinc-400 text-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent font-medium transition-all"
                placeholder={t('emailPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="code" className="block text-sm font-bold text-zinc-700 mb-1">
                {t('passwordLabel')}
              </label>
              <input
                id="code"
                name="code"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-zinc-200 placeholder-zinc-400 text-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent font-medium transition-all"
                placeholder={t('passwordPlaceholder')}
              />
            </div>
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-black uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl disabled:opacity-50">
              {loading ? t('loading') : (
                <>{t('submitButton')} <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm font-bold text-zinc-600">
            {t('alreadyClient')}{' '}
            <Link href={`/login`} className="text-zinc-900 underline hover:text-zinc-700 transition-colors">
              {t('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

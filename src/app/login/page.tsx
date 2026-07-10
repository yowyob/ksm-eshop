'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, ArrowRight } from 'lucide-react';

import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';
import { useCartStore } from '@/store/useCartStore';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const isRegistered = searchParams.get('registered') === 'true';
  const requiresVerification = searchParams.get('verify') === 'true';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loading || setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const code = formData.get('code') as string;

    try {
      const res = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      
      if (data.success || res.ok) {
        // Mettre à jour le store d'authentification immédiatement
        if (data.data) {
          useCustomerAuthStore.getState().setAuthenticated(true, data.data);
          // Initialiser le panier du client à 0 (vide) lors de sa connexion
          useCartStore.getState().clearCart();
        }
        
        // Rediriger vers l'url de redirection ou l'accueil
        const redirectUrl = searchParams.get('redirect') || `/`;
        router.push(redirectUrl);
      } else {
        setError(data.message || 'Identifiants invalides');
      }
    } catch (err: any) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border-2 border-zinc-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-2 text-3xl font-black text-zinc-900 uppercase tracking-tighter italic">
            Connexion
          </h2>
          <p className="mt-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
            Accédez à votre espace client
          </p>
        </div>
        
        {isRegistered && !requiresVerification && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-bold text-center border-2 border-green-200">
            Inscription réussie ! Vous pouvez maintenant vous connecter.
          </div>
        )}

        {isRegistered && requiresVerification && (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-bold text-center border-2 border-blue-200">
            Inscription réussie ! <br/>
            Un e-mail de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception (et vos spams) et cliquer sur le lien avant de vous connecter.
          </div>
        )}

        <form className="mt-4 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center border-2 border-red-200">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-zinc-700 mb-1">
                Adresse Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-zinc-200 placeholder-zinc-400 text-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium transition-all"
                placeholder="vous@exemple.com"
              />
            </div>
            <div>
              <label htmlFor="code" className="block text-sm font-bold text-zinc-700 mb-1">
                Mot de passe
              </label>
              <input
                id="code"
                name="code"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-zinc-200 placeholder-zinc-400 text-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm font-bold text-zinc-700">
                Se souvenir de moi
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                Mot de passe oublié ?
              </a>
            </div>
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-black uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl disabled:opacity-50">
              {loading ? 'Connexion...' : (
                <>Se connecter <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm font-bold text-zinc-600">
            Nouveau sur la plateforme ?{' '}
            <Link href={`/signup`} className="text-blue-600 hover:text-blue-500 transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

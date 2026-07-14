'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Lock, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import ShopNavbar from '@/components/shop/ShopNavbar';
import ShopFooter from '@/components/shop/ShopFooter';

const dummyAdminTenant = {
  id: 'admin',
  name: 'Administration KSM',
  slug: 'admin',
  description: 'Portail d\'administration',
  themeColor: '#2563eb'
};

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // États MFA / OTP
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principal: email, password })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setError(data.message || 'Identifiants incorrects.');
        setLoading(false);
        return;
      }

      if (data.requiresMfa) {
        setRequiresMfa(true);
        setSessionId(data.sessionId);
        setLoading(false);
      } else {
        login(email);
        router.push('/admin/organizations');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau.');
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principal: email, code: otpCode, sessionId })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Code de vérification incorrect ou expiré.');
        setLoading(false);
      } else {
        login(email);
        router.push('/admin/organizations');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau lors de la validation du code.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <ShopNavbar tenant={dummyAdminTenant} />
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-8 transition-colors font-bold text-xs uppercase tracking-widest">
            <ArrowLeft className="h-4 w-4" /> Retour au portail
          </Link>
          
          <Card className="border-2 border-zinc-200 bg-white shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-zinc-50 p-8 text-center border-b border-zinc-100">
              <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-black text-zinc-900 uppercase italic tracking-tighter">
                {requiresMfa ? 'Double Authentification' : 'Accès Administrateur Global'}
              </CardTitle>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mt-2">
                {requiresMfa ? 'Saisissez votre code de sécurité (OTP)' : 'KSM Core Security Layer'}
              </p>
            </CardHeader>
            <CardContent className="p-8">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-xl text-xs font-bold mb-6">
                  {error}
                </div>
              )}

              {requiresMfa ? (
                <form onSubmit={handleOtpSubmit} className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Code de Validation (OTP)</label>
                    <input 
                      required
                      type="text"
                      maxLength={8}
                      placeholder="Ex : 123456" 
                      className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-4 text-center text-2xl font-black tracking-widest text-zinc-900 focus:border-blue-600 focus:outline-none transition-all"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                    <p className="text-[10px] text-zinc-400 font-medium text-center">Un code à usage unique a été généré ou envoyé pour sécuriser votre connexion.</p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-lg font-black uppercase italic tracking-tighter shadow-xl shadow-blue-900/20 rounded-xl"
                    disabled={loading}
                  >
                    {loading ? 'Validation en cours...' : 'Valider le code'}
                  </Button>

                  <button 
                    type="button" 
                    onClick={() => {
                      setRequiresMfa(false);
                      setOtpCode('');
                      setError(null);
                    }}
                    className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-wider"
                  >
                    Retour à la connexion
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Adresse Email</label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      placeholder="votre@email.com" 
                      className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-4 text-zinc-900 font-bold focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mot de passe</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        placeholder="••••••••" 
                        className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-4 pr-12 text-zinc-900 font-bold focus:border-blue-600 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-lg font-black uppercase italic tracking-tighter shadow-xl shadow-blue-900/20 rounded-xl"
                    disabled={loading}
                  >
                    {loading ? 'Vérification...' : 'Se connecter'}
                  </Button>
                </form>
              )}
            </CardContent>
            <div className="p-4 bg-zinc-50 text-center border-t border-zinc-100">
              <div className="flex items-center justify-center gap-2 text-zinc-400">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Zone Sécurisée Restreinte</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <ShopFooter tenant={dummyAdminTenant} />
    </div>
  );
}

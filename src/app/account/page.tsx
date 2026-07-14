'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { User, Phone, Mail, Loader2, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import { GlobalNavbar } from '@/components/global/GlobalNavbar';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuthenticated } = useCustomerAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, rediriger vers login
    if (!isAuthenticated) {
      router.push('/login?redirect=/account');
      return;
    }

    async function loadProfile() {
      setIsLoading(true);
      setMessage(null);
      try {
        const res = await fetch('/api/auth/customer-me');
        const data = await res.json();
        if (data.success && data.data) {
          const profile = data.data;
          setFirstName(profile.firstName || '');
          setLastName(profile.lastName || '');
          setEmail(profile.email || '');
          setPhoneNumber(profile.phoneNumber || '');
        } else {
          // Fallback sur les infos du store local si l'API échoue temporairement
          if (user) {
            setFirstName(user.firstName || user.name?.split(' ')[0] || '');
            setLastName(user.lastName || user.name?.split(' ').slice(1).join(' ') || '');
            setEmail(user.email || '');
            setPhoneNumber(user.phoneNumber || '');
          }
        }
      } catch (e) {
        console.error("Error loading user profile:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [isAuthenticated, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/customer-me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
          email
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
        
        // Mettre à jour l'état global du client connecté
        if (user) {
          setAuthenticated(true, {
            ...user,
            firstName,
            lastName,
            phoneNumber,
            name: `${firstName} ${lastName}`.trim()
          });
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur lors de la mise à jour.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur réseau lors de la sauvegarde.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <GlobalNavbar 
        organizations={[]}
        onSearch={() => {}}
        onCategorySelect={() => {}}
        selectedCategory={null}
      />

      <main className="flex-1 w-full max-w-[800px] mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()} 
            className="gap-2 font-bold border-2 border-zinc-900 uppercase text-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase italic">Mon Compte</h1>
          <div className="w-20" />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-4 border-zinc-200 shadow-md">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="font-black text-zinc-500 uppercase tracking-widest text-sm">Chargement de votre profil...</p>
          </div>
        ) : (
          <Card className="border-4 border-zinc-900 shadow-2xl bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-zinc-900 text-white p-8">
              <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Modifier mes informations</CardTitle>
              <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider mt-1">
                Gérez vos données personnelles synchronisées avec KSM Core
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {message && (
                  <div className={`p-4 rounded-xl border-2 flex items-center gap-3 text-xs font-bold uppercase tracking-wider ${
                    message.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-red-50 border-red-300 text-red-800'
                  }`}>
                    {message.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />}
                    <span>{message.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Prénom */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Prénom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        placeholder="Ex: Jean"
                        className="h-11 w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 pl-10 pr-4 text-xs font-bold focus:border-zinc-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Nom */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Nom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        placeholder="Ex: Nguemo"
                        className="h-11 w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 pl-10 pr-4 text-xs font-bold focus:border-zinc-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* E-mail (Lecture seule) */}
                  <div className="space-y-1.5 opacity-70">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Adresse E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="h-11 w-full rounded-xl border-2 border-zinc-200 bg-zinc-100 pl-10 pr-4 text-xs font-bold cursor-not-allowed text-zinc-500"
                      />
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ex: +237 600 000 000"
                        className="h-11 w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 pl-10 pr-4 text-xs font-bold focus:border-zinc-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic tracking-tighter h-14 px-8 gap-2 rounded-xl shadow-xl shadow-blue-500/10 transition-all hover:scale-105"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

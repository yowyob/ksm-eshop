import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Loader2, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

export default function UserProfileModal({ isOpen, onClose, tenantId }: UserProfileModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && tenantId) {
      async function loadProfile() {
        setIsLoading(true);
        setMessage(null);
        try {
          const res = await fetch(`/api/auth/customer-me?organizationId=${tenantId}`);
          const data = await res.json();
          if (data.success && data.data) {
            const profile = data.data;
            setFirstName(profile.firstName || '');
            setLastName(profile.lastName || '');
            setEmail(profile.email || '');
            setPhoneNumber(profile.phoneNumber || '');
          }
        } catch (e) {
          console.error("Error loading user profile:", e);
        } finally {
          setIsLoading(false);
        }
      }
      loadProfile();
    }
  }, [isOpen, tenantId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/auth/customer-me?organizationId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
          email // L'email est généralement non modifiable ou requiert une validation, mais on le transmet au cas où
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
        // Rafraîchir les informations de session du store client
        const { useCustomerAuthStore } = require('@/store/useCustomerAuthStore');
        const storeUser = useCustomerAuthStore.getState().user;
        if (storeUser) {
          useCustomerAuthStore.getState().setAuthenticated(true, {
            ...storeUser,
            firstName,
            lastName,
            phoneNumber,
            name: `${firstName} ${lastName}`.trim()
          });
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur lors de la mise à jour.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur réseau.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-white border-2 border-zinc-900 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-zinc-900 text-white border-b-2 border-zinc-900">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Mon Profil</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-zinc-500 font-bold text-sm">Chargement du profil...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              {/* Prénom */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Ex: Jean"
                    className="h-10 w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 pl-10 pr-4 text-xs font-bold focus:border-zinc-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Nom */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Nom</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Ex: Nguemo"
                    className="h-10 w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 pl-10 pr-4 text-xs font-bold focus:border-zinc-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* E-mail (Lecture seule) */}
              <div className="space-y-1.5 opacity-70">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Adresse E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="h-10 w-full rounded-xl border-2 border-zinc-200 bg-zinc-100 pl-10 pr-4 text-xs font-bold cursor-not-allowed text-zinc-500"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ex: +237 600 000 000"
                    className="h-10 w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 pl-10 pr-4 text-xs font-bold focus:border-zinc-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Bouton de validation */}
              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase italic tracking-tighter h-11 gap-2 rounded-xl shadow-lg"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Sauvegarder les modifications
                </Button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

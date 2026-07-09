import { useState } from 'react';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';
import { Button } from '@/components/ui/Button';
import { X, CreditCard, Building, Globe, ShieldCheck, Plus, ArrowLeft, Check, Loader2 } from 'lucide-react';

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

interface BankAccount {
  id: string;
  label: string;
  bankName: string;
  iban: string;
  swiftBic: string;
  currency: string;
  primary: boolean;
}

export default function BankAccountModal({ isOpen, onClose, userName }: BankAccountModalProps) {
  const { bankAccounts, addBankAccount, setPrimaryBankAccount, user } = useCustomerAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Form states
  const [label, setLabel] = useState('');
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  const [swiftBic, setSwiftBic] = useState('');
  const [currency, setCurrency] = useState('XAF');
  const [primary, setPrimary] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !bankName || !iban) return;

    const newAccount = {
      label,
      bankName,
      iban,
      swiftBic,
      currency,
      primary,
    };

    const thirdPartyId = user?.partyId || user?.id;
    if (thirdPartyId) {
      try {
        const res = await fetch(`/api/clients/${thirdPartyId}/bank-accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newAccount)
        });
        const data = await res.json();
        if (data.success || res.ok) {
           const createdAccount = data.data || data;
           addBankAccount({
             ...newAccount,
             id: createdAccount.id || Math.random().toString(36).substr(2, 9)
           });
        } else {
           console.error("Failed to add bank account:", data.message);
        }
      } catch (err) {
        console.error("Error adding bank account", err);
      }
    } else {
       // Fallback local logic
       addBankAccount({
          ...newAccount,
          id: Math.random().toString(36).substr(2, 9)
       });
    }

    // Reset form and go back to list
    setLabel('');
    setBankName('');
    setIban('');
    setSwiftBic('');
    setCurrency('XAF');
    setPrimary(false);
    setIsAdding(false);
  };

  const handleSetPrimary = async (accountId: string) => {
    const thirdPartyId = user?.partyId || user?.id;
    if (!thirdPartyId) return;

    setIsUpdating(accountId);
    try {
      // Call backend proxy API
      const res = await fetch(`/api/clients/${thirdPartyId}/bank-accounts/${accountId}/set-primary`, {
        method: 'POST'
      });
      
      // Update locally
      setPrimaryBankAccount(accountId);
    } catch (err) {
      console.error('Error setting primary bank account:', err);
      // Fallback local update
      setPrimaryBankAccount(accountId);
    } finally {
      setIsUpdating(null);
    }
  };

  const maskIban = (val: string) => {
    if (val.length < 8) return val;
    return `${val.substring(0, 4)} **** **** ${val.substring(val.length - 4)}`;
  };

  const inputClasses = "w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 p-3 pl-10 text-sm font-bold text-zinc-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all placeholder:text-zinc-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-white border-2 border-zinc-900 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-zinc-900 text-white border-b-2 border-zinc-900">
          <div className="flex items-center gap-3">
            {isAdding ? (
              <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-white transition-colors mr-1">
                <ArrowLeft className="h-6 w-6" />
              </button>
            ) : (
              <CreditCard className="h-6 w-6 text-blue-400" />
            )}
            <h2 className="text-xl font-black uppercase italic tracking-tighter">
              {isAdding ? "Ajouter un Compte" : "Comptes Bancaires"}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white max-h-[60vh] overflow-y-auto">
          {isAdding ? (
            /* FORM VIEW */
            <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-right-4 duration-200">
              
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Libellé du Compte</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Ex: Mon compte principal, Épargne..."
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Nom de la Banque</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ex: Afriland First Bank, SG..."
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">IBAN / RIB</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="Saisir votre IBAN ou numéro de compte"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Code Swift / BIC</label>
                  <input
                    type="text"
                    value={swiftBic}
                    onChange={(e) => setSwiftBic(e.target.value)}
                    placeholder="BIC Code"
                    className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 p-3 text-sm font-bold text-zinc-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all placeholder:text-zinc-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Devise (Currency)</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 p-3 text-sm font-bold text-zinc-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="XAF">XAF (FCFA)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="primary"
                  checked={primary}
                  onChange={(e) => setPrimary(e.target.checked)}
                  className="h-5 w-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="primary" className="text-sm font-bold text-zinc-700 cursor-pointer select-none">
                  Définir comme compte principal (primary)
                </label>
              </div>

              <div className="flex gap-4 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="flex-1 h-12 font-bold uppercase text-xs border-2 border-zinc-900">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1 h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase text-xs shadow-md">
                  Enregistrer
                </Button>
              </div>
            </form>
          ) : (
            /* LIST VIEW */
            <div className="space-y-5 animate-in slide-in-from-left-4 duration-200">
              {bankAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-200">
                    <CreditCard className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-zinc-800">Aucun compte</h3>
                  <p className="text-zinc-500 font-bold text-xs">Veuillez ajouter un compte bancaire pour les transactions.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bankAccounts.map((account: BankAccount) => (
                    <div key={account.id} className="relative border-2 border-zinc-200 hover:border-zinc-900 rounded-2xl p-4 transition-all bg-zinc-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black uppercase italic tracking-tight text-zinc-900">{account.label}</span>
                            {account.primary && (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter bg-blue-100 text-blue-800 rounded-full border border-blue-200 flex items-center gap-1">
                                <Check className="h-2 w-2 stroke-[4px]" /> Principal
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-zinc-400 uppercase mt-1">{account.bankName}</p>
                          <p className="text-sm font-mono font-bold text-zinc-700 mt-2 tracking-wider">{maskIban(account.iban)}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block">Devise</span>
                          <span className="text-sm font-black text-blue-600 uppercase">{account.currency}</span>
                        </div>
                      </div>

                      {/* Set primary button for non-primary accounts */}
                      {!account.primary && (
                        <div className="mt-3 pt-3 border-t border-zinc-100 flex justify-end">
                          <button
                            disabled={isUpdating !== null}
                            onClick={() => handleSetPrimary(account.id)}
                            className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            {isUpdating === account.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null}
                            Définir comme principal
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Account Button at the bottom of the list */}
              <button
                onClick={() => setIsAdding(true)}
                className="w-full h-14 border-2 border-dashed border-zinc-300 hover:border-zinc-900 rounded-2xl flex items-center justify-center gap-2.5 text-zinc-500 hover:text-zinc-900 font-bold text-sm transition-all cursor-pointer bg-white"
              >
                <Plus className="h-5 w-5" /> Ajouter un compte bancaire
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-zinc-50 border-t-2 border-zinc-200 flex justify-between items-center">
          <div className="flex items-center gap-2 text-zinc-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] uppercase font-black tracking-widest">Secured by KSM ePay</span>
          </div>
          {!isAdding && (
            <Button onClick={onClose} className="bg-zinc-900 text-white font-bold text-xs uppercase px-5">
              Fermer
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}

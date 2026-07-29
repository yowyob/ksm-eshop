'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, ShieldCheck, Zap, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function SubscriptionPage() {
  const { tenantId } = useParams();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  useEffect(() => {
    const loadCurrentPlan = async () => {
      try {
        const res = await fetch('/api/organizations?includeAll=true');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const org = data.data.find((o: any) => o.id === tenantId || o.slug === tenantId || o.code === tenantId);
          if (org && org.subscriptionPlan) {
            setCurrentPlan(org.subscriptionPlan);
          }
        }
      } catch (err) {
        console.error('Error loading current subscription plan:', err);
      } finally {
        setLoadingPlan(false);
      }
    };
    if (tenantId) loadCurrentPlan();
  }, [tenantId]);
  
  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      description: 'Pour démarrer et tester la plateforme.',
      price: 0,
      period: 'à vie',
      features: [
        'Jusqu\'à 100 produits',
        'Gestion des commandes de base',
        'Support communautaire',
        'Boutique avec sous-domaine KSM'
      ],
      icon: ShieldCheck,
      color: 'bg-zinc-100 text-zinc-900',
      buttonVariant: 'outline'
    },
    {
      id: 'monthly',
      name: 'Plan Mensuel',
      description: 'Pour les boutiques en croissance.',
      price: 15000,
      period: 'par mois',
      features: [
        'Produits illimités',
        'Gestion avancée des stocks',
        'Support prioritaire',
        'Nom de domaine personnalisé',
        'Outils d\'analyse'
      ],
      icon: Zap,
      color: 'bg-blue-600 text-white',
      buttonVariant: 'default'
    },
    {
      id: 'annual',
      name: 'Plan Annuel',
      description: 'La meilleure offre pour les pros (Économisez 20%).',
      price: 144000,
      period: 'par an',
      features: [
        'Toutes les fonctionnalités du plan mensuel',
        'API d\'intégration',
        'Plusieurs comptes administrateurs',
        'Support dédié 24/7',
        'Accès aux fonctionnalités bêta'
      ],
      icon: Sparkles,
      color: 'bg-amber-500 text-white',
      buttonVariant: 'default'
    }
  ];

  const handleSubscribe = async (planId: string) => {
    setUpdatingPlan(true);
    try {
      const res = await fetch(`/api/organizations/${tenantId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentPlan(planId);
        alert(`Félicitations ! Votre abonnement au "${planId === 'annual' ? 'Plan Annuel' : 'Plan Mensuel'}" a été validé et payé avec succès.`);
      } else {
        alert(data.message || 'Erreur lors du paiement.');
      }
    } catch {
      alert('Une erreur réseau est survenue lors de la validation de votre abonnement.');
    } finally {
      setUpdatingPlan(false);
    }
  };

  if (loadingPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-zinc-100 shadow-sm">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Vérification de l&apos;abonnement en cours...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {updatingPlan && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 max-w-sm text-center shadow-2xl">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="font-black uppercase tracking-tighter text-lg text-zinc-900">Validation du Paiement</p>
            <p className="text-xs text-zinc-500 font-medium mt-1">Traitement sécurisé par la passerelle KSM Pay...</p>
          </div>
        </div>
      )}

      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-900 mb-4">Abonnement KSM</h1>
        <p className="text-zinc-500 font-medium">Choisissez le plan adapté à la taille de votre entreprise. Gérez vos paiements et accédez aux fonctionnalités premium.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map(plan => {
          const Icon = plan.icon;
          const isActive = currentPlan === plan.id;
          
          return (
            <Card key={plan.id} className={`relative flex flex-col border-2 overflow-hidden transition-all duration-300 hover:scale-105 ${
              isActive ? 'border-blue-600 shadow-2xl shadow-blue-600/10' : 'border-zinc-200 hover:border-blue-600/50'
            }`}>
              {isActive && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
                  Plan Actuel
                </div>
              )}
              
              <CardHeader className={`${plan.color} p-8 text-center`}>
                <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                  <Icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-black uppercase tracking-tighter mb-2">{plan.name}</CardTitle>
                <p className={`text-sm ${plan.color.includes('text-white') ? 'text-white/80' : 'text-zinc-500'}`}>
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent className="p-8 flex-1 bg-white flex flex-col">
                <div className="text-center mb-8">
                  <span className="text-4xl font-black text-zinc-900">
                    {plan.price === 0 ? 'Gratuit' : formatPrice(plan.price)}
                  </span>
                  {plan.price !== 0 && (
                    <span className="text-zinc-500 font-bold ml-2">FCFA {plan.period}</span>
                  )}
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1 bg-emerald-100 rounded-full p-1">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-zinc-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => handleSubscribe(plan.id)}
                  variant={isActive ? 'outline' : (plan.buttonVariant as any)}
                  className={`w-full h-12 font-black uppercase tracking-widest ${
                    isActive ? 'border-2 border-zinc-200 text-zinc-400 cursor-default hover:bg-transparent' : 
                    plan.id === 'annual' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20' : 
                    plan.id === 'monthly' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20' : ''
                  }`}
                  disabled={isActive}
                >
                  {isActive ? 'Actif' : 'Choisir ce plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Card className="border-2 border-zinc-200 bg-white shadow-sm mt-12 rounded-3xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-center p-8 gap-8">
          <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <CreditCard className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900 mb-2">Paiement Sécurisé</h3>
            <p className="text-zinc-500 font-medium">Vos transactions sont traitées par nos partenaires de paiement certifiés. Aucune donnée bancaire n'est conservée sur nos serveurs.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { Tenant } from '@/lib/types';
import Link from 'next/link';
import { ShieldCheck, HelpCircle, PhoneCall, Truck } from 'lucide-react';

interface ShopFooterProps {
  tenant: Tenant;
}

export default function ShopFooter({ tenant }: ShopFooterProps) {
  return (
    <footer className="border-t-2 border-zinc-200 bg-zinc-50/50 text-zinc-600 font-sans">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter" style={{ color: tenant.themeColor }}>
              {tenant.name}
            </h2>
            <p className="max-w-sm text-sm font-bold text-zinc-500 leading-relaxed">
              {tenant.description || "Boutique en ligne certifiée connectée en temps réel au système logistique centralisé KSM Core."}
            </p>
            <div className="pt-2 flex items-center gap-2 text-zinc-400">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-[10px] uppercase font-black tracking-widest">Transactions Sécurisées ePay</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Boutique</h3>
            <ul className="mt-4 space-y-2.5 text-xs font-bold uppercase">
              <li>
                <Link href={`/${tenant.slug}/products`} className="text-zinc-500 hover:text-zinc-900 transition-colors">
                  Tous les produits
                </Link>
              </li>
              <li>
                <Link href="#" className="text-zinc-500 hover:text-zinc-900 transition-colors">
                  Nouveaux articles
                </Link>
              </li>
              <li>
                <Link href="/" className="text-zinc-500 hover:text-zinc-900 transition-colors">
                  Retour à l'accueil eShop
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Services Client</h3>
            <ul className="mt-4 space-y-3.5 text-xs font-bold">
              <li className="flex items-center gap-2 text-zinc-500">
                <Truck className="h-4 w-4 shrink-0" />
                <span>Livraison express à domicile</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-500">
                <PhoneCall className="h-4 w-4 shrink-0" />
                <span>Support KSM 24h/24 • 7j/7</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-500">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>FAQ & Guides d'utilisation</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-zinc-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} {tenant.name}. Tous droits réservés.
          </p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Propulsé par <span className="text-zinc-900 font-black">KSM Core Platform</span> - Cameroun
          </p>
        </div>
      </div>
    </footer>
  );
}

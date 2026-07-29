import { Tenant } from '@/lib/types';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShieldCheck, HelpCircle, PhoneCall, Truck } from 'lucide-react';

interface ShopFooterProps {
  tenant: Tenant;
}

export default function ShopFooter({ tenant }: ShopFooterProps) {
  const t = useTranslations('Footer');
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
              {tenant.description || t('defaultDesc')}
            </p>
            <div className="pt-2 flex items-center gap-2 text-zinc-400">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-[10px] uppercase font-black tracking-widest">{t('securePay')}</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">{t('shopTitle')}</h3>
            <ul className="mt-4 space-y-2.5 text-xs font-bold uppercase">
              <li>
                <Link href={`/${tenant.slug}/products`} className="text-zinc-500 hover:text-zinc-900 transition-colors">
                  {t('allProducts')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-zinc-500 hover:text-zinc-900 transition-colors">
                  {t('newProducts')}
                </Link>
              </li>
              <li>
                <Link href="/" className="text-zinc-500 hover:text-zinc-900 transition-colors">
                  {t('backHome')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">{t('customerServices')}</h3>
            <ul className="mt-4 space-y-3.5 text-xs font-bold">
              <li className="flex items-center gap-2 text-zinc-500">
                <Truck className="h-4 w-4 shrink-0" />
                <span>{t('delivery')}</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-500">
                <PhoneCall className="h-4 w-4 shrink-0" />
                <span>{t('support')}</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-500">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>{t('faq')}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-zinc-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} {tenant.name}. {t('copyright')}
          </p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {t('poweredBy')} <span className="text-zinc-900 font-black">KSM Core Platform</span> - Cameroun
          </p>
        </div>
      </div>
    </footer>
  );
}

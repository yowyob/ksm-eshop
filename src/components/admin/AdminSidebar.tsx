'use client';

import { useState, useEffect } from 'react';
import { Tenant } from '@/lib/types';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  Globe,
  LogOut,
  Boxes,
  Building2,
  Users,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useAuthStore } from '@/store/useAuthStore';

interface AdminSidebarProps {
 tenant: Tenant;
}

export default function AdminSidebar({ tenant }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isSuperAdmin = isMounted && !!user;

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    logout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Tableau de bord', icon: LayoutDashboard, href: `/admin/${tenant.slug}` },
    { label: 'Organisations', icon: Building2, href: `/admin/organizations` },
    { label: 'Clients', icon: Users, href: `/admin/${tenant.slug}/clients` },
    { label: 'Produits', icon: Package, href: `/admin/${tenant.slug}/products` },
    { label: 'Stocks & Entrepôts', icon: Boxes, href: `/admin/${tenant.slug}/inventory` },
    { label: 'Commandes', icon: ShoppingCart, href: `/admin/${tenant.slug}/orders` },
    { label: 'Paramètres', icon: Settings, href: `/admin/${tenant.slug}/settings` },
    { label: 'Abonnement', icon: Settings, href: `/admin/${tenant.slug}/subscription` },
  ];

  if (
    user?.email?.toLowerCase().trim() === 'atenaornella@gmail.com' ||
    user?.name?.toLowerCase().trim() === 'atenaornella@gmail.com'
  ) {
    navItems.push({ label: 'Super Admin', icon: ShieldCheck, href: `/admin/super-admin` });
  }

 return (
 <aside className="w-64 border-r bg-white flex flex-col shadow-sm">
    <div className="p-6">
      <div className="flex items-center gap-3 px-2">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: tenant.themeColor }}>
          {tenant.name[0]}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-black text-lg leading-tight uppercase italic text-zinc-900">KSM admin</span>
          <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest truncate">{tenant.name}</span>
        </div>
      </div>
      <p className="mt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        Gestion Boutique
      </p>
    </div>

 <nav className="flex-1 px-4 space-y-1">
 {navItems.map((item) => (
 <Link
 key={item.href}
 href={item.href}
 className={cn(
 "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
 pathname === item.href 
 ? "bg-zinc-100 text-zinc-900 " 
 : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 "
 )}
 >
 <item.icon className="h-4 w-4" />
 {item.label}
 </Link>
 ))}
 </nav>

 <div className="p-4 border-t space-y-1">
 <Link
 href={`/${tenant.slug}`}
 target="_blank"
 className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 "
 >
 <Globe className="h-4 w-4" />
 Voir la boutique
 </Link>
 <button 
   onClick={handleLogout}
   className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 "
 >
 <LogOut className="h-4 w-4" />
 Déconnexion
 </button>
 </div>
 </aside>
 );
}

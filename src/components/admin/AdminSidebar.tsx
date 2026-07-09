'use client';

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
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useAuthStore } from '@/store/useAuthStore';

interface AdminSidebarProps {
 tenant: Tenant;
}

export default function AdminSidebar({ tenant }: AdminSidebarProps) {
 const pathname = usePathname();
 const { logout } = useAuthStore();
 const router = useRouter();

 const handleLogout = async () => {
   await fetch('/api/admin/auth/logout', { method: 'POST' });
   logout();
   router.push('/admin/login');
 };

 const navItems = [
   { label: 'Tableau de bord', icon: LayoutDashboard, href: `/admin/${tenant.slug}` },
   { label: 'Organisations', icon: Building2, href: `/admin/organizations` },
   { label: 'Clients', icon: Users, href: `/admin/${tenant.slug}/clients` },
   { label: 'Produits', icon: Package, href: `/admin/${tenant.slug}/products` },
   { label: 'Stocks & Entrepôts', icon: Boxes, href: `/admin/${tenant.slug}/inventory` },
   { label: 'Commandes', icon: ShoppingCart, href: `/admin/${tenant.slug}/orders` },
   { label: 'Paramètres', icon: Settings, href: `/admin/${tenant.slug}/settings` },
 ];

 return (
 <aside className="w-64 border-r bg-white flex flex-col shadow-sm">
   <div className="p-6">
     <div className="flex items-center gap-2 px-2">
       <div className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold" style={{ backgroundColor: tenant.themeColor }}>
         {tenant.name[0]}
       </div>
       <span className="font-bold text-lg truncate">KSM eShop</span>
     </div>
     <p className="mt-2 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
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

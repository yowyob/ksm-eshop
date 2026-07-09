'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tenant } from '@/lib/types';
import { Bell, Search, User, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AdminNavbarProps {
 tenant: Tenant;
}

export default function AdminNavbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; username?: string; email?: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          // Si le kernel renvoie dans data.data.content ou directement dans data.data
          const userData = data.data.content ? data.data.content : data.data;
          setUser(userData);
        }
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      // Redirect to the base admin login/register page
      router.push('/admin/login');
    } catch (error) {
      console.error(error);
      setLoggingOut(false);
    }
  };

  const displayName = user 
    ? (user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.username || user.email) 
    : 'Chargement...';

 return (
 <header className="h-16 border-b bg-white px-8 flex items-center justify-between sticky top-0 z-30">
 <div className="flex items-center gap-4 flex-1">
 <div className="relative w-96 hidden lg:block">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
 <input
 type="search"
 placeholder="Rechercher une commande, un produit..."
 className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 "
 />
 </div>
 </div>

 <div className="flex items-center gap-4">
 <Button variant="ghost" size="icon" className="relative">
 <Bell className="h-5 w-5" />
 <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
 </Button>
 
 <div className="flex items-center gap-3 ml-2 border-l pl-4">
 <div className="text-right hidden sm:block">
 <p className="text-sm font-black uppercase tracking-tight text-zinc-900">{displayName}</p>
 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Administrateur</p>
 </div>
 <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
 <User className="h-4 w-4" />
 </div>
 <Button variant="ghost" size="icon" onClick={handleLogout} disabled={loggingOut} className="ml-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors" title="Se déconnecter">
 {loggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
 </Button>
 </div>
 </div>
 </header>
 );
}

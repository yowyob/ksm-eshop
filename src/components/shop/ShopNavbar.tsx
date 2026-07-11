'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, LogOut, Loader2, CreditCard, ShoppingBag } from 'lucide-react';
import { Tenant } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';
import BankAccountModal from './BankAccountModal';
import OrdersHistoryModal from './OrdersHistoryModal';

interface ShopNavbarProps {
  tenant: Tenant;
}

export default function ShopNavbar({ tenant }: ShopNavbarProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  
  const { user, checkAuth, setAuthenticated } = useCustomerAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  useEffect(() => {
    setIsMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, [tenant.id]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/customer-logout', { method: 'POST' });
      setAuthenticated(false, null);
      // Vider le panier au moment de la déconnexion
      useCartStore.getState().clearCart();
      router.push(`/login`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoggingOut(false);
    }
  };

  const displayName = user 
    ? (user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.name || user.username || user.email) 
    : '';

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-zinc-200 bg-white shadow-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Left Side: Brand Logo and Current Shop */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group border-2 border-zinc-900 p-1 px-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
            <span className="text-xl font-black tracking-tighter text-zinc-900 uppercase italic">KSM eShop</span>
          </Link>
          
          <div className="h-8 w-[2px] bg-zinc-200 hidden md:block" />
          
          <Link href={`/${tenant.slug}`} className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg shadow-inner flex items-center justify-center text-white font-black" style={{ backgroundColor: tenant.themeColor }}>
              {tenant.name[0]}
            </div>
            <span className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors">
              {tenant.name}
            </span>
          </Link>
        </div>

        {/* Center: Catalogue Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link href={`/${tenant.slug}/products`} className="text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors">
            Catalogue
          </Link>
          <Link href="#" className="text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors">
            Nouveautés
          </Link>
        </nav>

        {/* Right Side: Search, Cart and User Menu */}
        <div className="flex items-center gap-4">
          {/* Search bar */}
          <div className="hidden sm:flex relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="search"
              placeholder="Chercher..."
              className="h-10 w-48 rounded-full border-2 border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm font-bold focus:border-zinc-900 focus:outline-none transition-all"
            />
          </div>
          
          {/* Cart Icon */}
          <Link href={`/cart`}>
            <Button variant="ghost" size="icon" className="relative h-12 w-12 hover:bg-zinc-100 border-2 border-transparent hover:border-zinc-200">
              <ShoppingCart className="h-6 w-6 text-zinc-900" />
              {isMounted && !!user && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white shadow-lg border-2 border-white">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* User Menu - Displayed immediately AFTER the cart! */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200/80 rounded-full border-2 border-zinc-900 hover:border-blue-600 transition-colors cursor-pointer select-none font-black text-zinc-900 shadow-sm"
              >
                <User className="h-4 w-4 text-zinc-700" />
                <span className="text-xs tracking-tight">{displayName}</span>
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border-2 border-zinc-900 bg-white shadow-2xl z-50 p-2 py-3 animate-in slide-in-from-top-2 duration-150">
                  <button 
                    onClick={() => { setShowBankModal(true); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    Compte Bancaire
                  </button>
                  <button 
                    onClick={() => { setShowOrdersModal(true); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                    Mes Commandes
                  </button>
                  <div className="h-[2px] bg-zinc-100 my-2" />
                  <button 
                    disabled={loggingOut}
                    onClick={() => { handleLogout(); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href={`/login`}>
                <Button variant="ghost" className="font-black text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border-2 border-transparent text-xs uppercase tracking-wider">
                  Connexion
                </Button>
              </Link>
              <Link href={`/signup`}>
                <Button className="font-black bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg text-xs uppercase tracking-wider rounded-xl">
                  S'inscrire
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile login icon fallback */}
          {!user && (
            <div className="sm:hidden flex items-center">
              <Link href={`/login`}>
                <Button variant="ghost" size="icon" className="h-12 w-12 hover:bg-zinc-100 border-2 border-transparent hover:border-zinc-200">
                  <User className="h-6 w-6 text-zinc-900" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      {user && (
        <>
          <BankAccountModal
            isOpen={showBankModal}
            onClose={() => setShowBankModal(false)}
            userName={displayName}
          />
          <OrdersHistoryModal
            isOpen={showOrdersModal}
            onClose={() => setShowOrdersModal(false)}
            userName={displayName}
            userEmail={user.email || ''}
            customerId={user.id || user.thirdPartyId}
          />
        </>
      )}
    </header>
  );
}

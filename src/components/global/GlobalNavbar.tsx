'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, Globe, ChevronDown, LogOut, Menu, CreditCard, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore';
import { useCartStore } from '@/store/useCartStore';

interface Organization {
  id: string;
  displayName?: string;
  shortName?: string;
  name?: string;
}

export function GlobalNavbar({
  organizations,
  onSearch,
  onCategorySelect,
  selectedCategory,
  categories = []
}: {
  organizations: Organization[];
  onSearch: (query: string) => void;
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
  categories?: { id: string; label: string }[];
}) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useCustomerAuthStore();
  const cartItemCount = useCartStore(state => state.items.length);
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');
  const [isClient, setIsClient] = useState(false);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/customer-logout', { method: 'POST' });
    logout();
    useCartStore.getState().clearCart();
    router.push(`/login`);
  };

  const finalCategories = [
    { id: 'all', label: 'Toutes catégories' },
    ...categories
  ];

  const displayName = user 
    ? (user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.name || user.email) 
    : '';

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-zinc-200 bg-white shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 gap-4">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 group border-2 border-zinc-900 p-1 px-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
            <span className="text-xl font-black tracking-tighter text-zinc-900 uppercase italic">KSM eShop</span>
          </Link>
          <div className="h-8 w-[2px] bg-zinc-200 hidden lg:block" />
          
          {/* Organizations Dropdown */}
          <div className="relative hidden lg:block">
            <button 
              onClick={() => { setShowOrgMenu(!showOrgMenu); setShowUserMenu(false); setShowLangMenu(false); }}
              className="flex items-center gap-2 group hover:text-blue-600 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg shadow-inner flex items-center justify-center text-white font-black bg-zinc-900 group-hover:bg-blue-600 transition-colors">
                <Menu className="h-4 w-4" />
              </div>
              <span className="text-sm font-black text-zinc-900 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors hidden xl:block">
                Boutiques Partenaires
              </span>
              <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-blue-600" />
            </button>

            {showOrgMenu && (
              <div className="absolute top-full left-0 mt-4 w-64 bg-white text-zinc-900 shadow-2xl rounded-2xl border-2 border-zinc-900 z-50 animate-in slide-in-from-top-2 overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {organizations.map(org => {
                    const orgName = org.displayName || org.shortName || org.name || org.id;
                    return (
                      <Link 
                        key={org.id} 
                        href={`/${org.id}`} 
                        className="px-4 py-3 text-sm font-bold hover:bg-zinc-100 hover:text-blue-600 block border-b border-zinc-100 last:border-0 transition-colors"
                        onClick={() => setShowOrgMenu(false)}
                      >
                        {orgName}
                      </Link>
                    );
                  })}
                  {organizations.length === 0 && (
                    <div className="px-4 py-4 text-sm text-zinc-500 font-bold text-center">Aucune boutique disponible</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl hidden md:flex items-center">
          <form onSubmit={handleSearch} className="flex w-full rounded-full overflow-hidden border-2 border-zinc-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-zinc-50">
            <select 
              className="bg-zinc-100 text-zinc-700 text-xs font-bold px-3 py-2 border-r-2 border-zinc-200 outline-none hover:bg-zinc-200 cursor-pointer w-auto max-w-[140px] truncate"
              value={selectedCategory || 'all'}
              onChange={(e) => onCategorySelect(e.target.value === 'all' ? null : e.target.value)}
            >
              {finalCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder={lang === 'FR' ? "Rechercher un produit..." : "Search product..."}
              className="flex-1 px-4 py-2 text-zinc-900 outline-none text-sm font-bold bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 text-white flex items-center justify-center transition-colors">
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Right Side: Lang, Auth, Cart */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative hidden sm:block">
            <button 
              onClick={() => { setShowLangMenu(!showLangMenu); setShowUserMenu(false); setShowOrgMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 rounded-full border-2 border-transparent hover:border-zinc-200 transition-colors font-black text-xs text-zinc-700"
            >
              <Globe className="h-4 w-4" />
              <span>{lang}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            
            {showLangMenu && (
              <div className="absolute top-full right-0 mt-2 w-32 bg-white text-zinc-900 shadow-2xl rounded-2xl border-2 border-zinc-900 z-50 overflow-hidden animate-in slide-in-from-top-2">
                <button 
                  onClick={() => { setLang('FR'); setShowLangMenu(false); }} 
                  className={`w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-zinc-50 transition-colors border-b border-zinc-100 ${lang === 'FR' ? 'text-blue-600' : 'text-zinc-700 hover:text-zinc-900'}`}
                >
                  Français
                </button>
                <button 
                  onClick={() => { setLang('EN'); setShowLangMenu(false); }} 
                  className={`w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-zinc-50 transition-colors ${lang === 'EN' ? 'text-blue-600' : 'text-zinc-700 hover:text-zinc-900'}`}
                >
                  English
                </button>
              </div>
            )}
          </div>

          {/* User Menu */}
          {isClient && isAuthenticated ? (
            <div className="relative">
              <button 
                onClick={() => { setShowUserMenu(!showUserMenu); setShowLangMenu(false); setShowOrgMenu(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200/80 rounded-full border-2 border-zinc-900 hover:border-blue-600 transition-colors cursor-pointer select-none font-black text-zinc-900 shadow-sm"
              >
                <User className="h-4 w-4 text-zinc-700" />
                <span className="text-xs tracking-tight max-w-[100px] truncate">{displayName}</span>
                <ChevronDown className="h-3 w-3 text-zinc-700" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border-2 border-zinc-900 bg-white shadow-2xl z-50 p-2 py-3 animate-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 mb-2 border-b border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Connecté en tant que</p>
                    <p className="text-sm font-black text-zinc-900 truncate">{displayName}</p>
                  </div>
                  <Link href="/account">
                    <button className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer">
                      <User className="h-4 w-4" />
                      Mon Profil
                    </button>
                  </Link>
                  <Link href="/orders">
                    <button className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer">
                      <ShoppingBag className="h-4 w-4" />
                      Mes Commandes
                    </button>
                  </Link>
                  <div className="h-[2px] bg-zinc-100 my-2" />
                  <button 
                    onClick={() => { handleLogout(); setShowUserMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="font-black text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border-2 border-transparent text-xs uppercase tracking-wider rounded-full">
                  {lang === 'FR' ? 'Connexion' : 'Sign in'}
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="font-black bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg text-xs uppercase tracking-wider rounded-full">
                  {lang === 'FR' ? "S'inscrire" : 'Sign up'}
                </Button>
              </Link>
            </div>
          )}

          {/* Cart Icon */}
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-full hover:bg-zinc-100 border-2 border-transparent hover:border-zinc-200 transition-colors">
              <ShoppingCart className="h-6 w-6 text-zinc-900" />
              {isClient && isAuthenticated && cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white shadow-lg border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </Link>
          
          {/* Mobile login icon fallback */}
          {isClient && !isAuthenticated && (
            <div className="sm:hidden flex items-center">
              <Link href="/login">
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-zinc-100 border-2 border-transparent hover:border-zinc-200">
                  <User className="h-6 w-6 text-zinc-900" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Search & Categories Row */}
      <div className="md:hidden border-t border-zinc-100 px-4 py-3 bg-zinc-50">
        <form onSubmit={handleSearch} className="flex w-full rounded-full overflow-hidden border-2 border-zinc-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
          <input 
            type="text" 
            placeholder={lang === 'FR' ? "Rechercher..." : "Search..."}
            className="flex-1 px-4 py-2 text-zinc-900 outline-none text-sm font-bold bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 px-4 py-2 text-white flex items-center justify-center">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}

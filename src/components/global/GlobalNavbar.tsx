'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, Globe, ChevronDown, LogOut, Menu } from 'lucide-react';
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
  selectedCategory
}: {
  organizations: Organization[];
  onSearch: (query: string) => void;
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
}) {
  const router = useRouter();
  const { isAuthenticated, customer, logout } = useCustomerAuthStore();
  const cartItemCount = useCartStore(state => state.items.length);
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const categories = [
    { id: 'all', label: 'Toutes catégories' },
    { id: 'c1', label: 'Électronique & High-Tech' },
    { id: 'c2', label: 'Montres & Bijoux' },
    { id: 'c3', label: 'Mode & Chaussures' },
    { id: 'c4', label: 'Bagages & Sacs' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#131921] text-white">
      {/* Top Main Nav */}
      <div className="flex flex-col md:flex-row items-center justify-between p-2 md:px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 pt-1 pb-2 px-2 border border-transparent hover:border-white rounded-sm">
          <div className="h-8 w-8 bg-amber-500 rounded flex items-center justify-center">
            <span className="text-zinc-900 font-bold text-xl leading-none">K</span>
          </div>
          <span className="text-xl font-bold tracking-tight">KSM eShop</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 flex w-full max-w-4xl px-2">
          <form onSubmit={handleSearch} className="flex w-full rounded-md overflow-hidden bg-white">
            <select 
              className="bg-zinc-100 text-zinc-900 text-sm px-2 py-2 border-r border-zinc-300 outline-none hover:bg-zinc-200 cursor-pointer hidden md:block w-auto max-w-[160px] truncate"
              value={selectedCategory || 'all'}
              onChange={(e) => onCategorySelect(e.target.value === 'all' ? null : e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder={lang === 'FR' ? "Rechercher sur KSM eShop" : "Search KSM eShop"}
              className="flex-1 px-4 py-2 text-zinc-900 outline-none text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="bg-[#febd69] hover:bg-[#f3a847] px-4 py-2 text-zinc-900 flex items-center justify-center transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Right Links */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Language */}
          <div className="relative group px-2 py-3 border border-transparent hover:border-white rounded-sm cursor-pointer hidden md:flex items-center gap-1 font-bold text-sm">
            <Globe className="h-4 w-4" />
            <span>{lang}</span>
            <ChevronDown className="h-3 w-3 text-zinc-400" />
            
            {/* Lang Dropdown */}
            <div className="absolute top-full right-0 mt-0 w-32 bg-white text-zinc-900 shadow-xl rounded-sm hidden group-hover:block border border-zinc-200 z-50">
              <div className="p-2 flex flex-col">
                <button onClick={() => setLang('FR')} className={`text-left px-3 py-2 text-sm hover:bg-zinc-100 hover:text-amber-600 ${lang === 'FR' ? 'font-bold' : ''}`}>
                  Français - FR
                </button>
                <button onClick={() => setLang('EN')} className={`text-left px-3 py-2 text-sm hover:bg-zinc-100 hover:text-amber-600 ${lang === 'EN' ? 'font-bold' : ''}`}>
                  English - EN
                </button>
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="relative group px-2 py-2 border border-transparent hover:border-white rounded-sm cursor-pointer">
            <Link href={isAuthenticated ? "/account" : "/login"}>
              <div className="flex flex-col">
                <span className="text-[11px] leading-tight text-zinc-300">
                  {lang === 'FR' ? 'Bonjour,' : 'Hello,'} {isClient && isAuthenticated ? customer?.name?.split(' ')[0] : (lang === 'FR' ? 'Identifiez-vous' : 'Sign in')}
                </span>
                <span className="text-sm font-bold leading-tight flex items-center gap-1">
                  {lang === 'FR' ? 'Compte & Listes' : 'Account & Lists'}
                  <ChevronDown className="h-3 w-3 text-zinc-400" />
                </span>
              </div>
            </Link>

            {/* Account Dropdown */}
            <div className="absolute top-full right-0 mt-0 w-64 bg-white text-zinc-900 shadow-xl rounded-sm hidden group-hover:block border border-zinc-200 z-50">
              <div className="p-4 flex flex-col">
                {isClient && !isAuthenticated ? (
                  <div className="text-center mb-4 pb-4 border-b border-zinc-200">
                    <Link href="/login">
                      <Button className="w-full bg-[#f0c14b] hover:bg-[#ddb347] text-zinc-900 border border-[#a88734] font-bold text-sm mb-2 shadow-sm">
                        {lang === 'FR' ? 'Identifiez-vous' : 'Sign in'}
                      </Button>
                    </Link>
                    <span className="text-xs text-zinc-700">
                      {lang === 'FR' ? 'Nouveau client ?' : 'New customer?'} <Link href="/signup" className="text-blue-600 hover:underline">{lang === 'FR' ? 'Commencer ici.' : 'Start here.'}</Link>
                    </span>
                  </div>
                ) : (
                  <div className="text-center mb-2 pb-2 border-b border-zinc-200">
                    <Button onClick={logout} variant="outline" className="w-full text-xs h-8 border-zinc-300 text-zinc-900">
                      <LogOut className="h-3 w-3 mr-2" />
                      {lang === 'FR' ? 'Déconnexion' : 'Sign out'}
                    </Button>
                  </div>
                )}
                <h3 className="font-bold text-sm mb-2">{lang === 'FR' ? 'Votre compte' : 'Your Account'}</h3>
                <ul className="text-sm space-y-2 text-zinc-600">
                  <li className="hover:text-amber-600 hover:underline cursor-pointer">Vos commandes</li>
                  <li className="hover:text-amber-600 hover:underline cursor-pointer">Votre profil</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cart */}
          <Link href="/cart" className="flex items-end px-2 py-2 border border-transparent hover:border-white rounded-sm">
            <div className="relative flex items-center">
              <ShoppingCart className="h-8 w-8 text-white" />
              <span className="absolute -top-1 right-0 text-[#f0c14b] font-bold text-sm px-1 leading-none rounded-full bg-[#131921]">
                {isClient ? cartItemCount : 0}
              </span>
            </div>
            <span className="text-sm font-bold leading-tight hidden md:block mt-1 ml-1">
              {lang === 'FR' ? 'Panier' : 'Cart'}
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom Sub Nav */}
      <div className="flex items-center px-4 py-1 gap-4 bg-[#232f3e] text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex items-center gap-1 px-2 py-1 border border-transparent hover:border-white rounded-sm cursor-pointer font-bold">
          <Menu className="h-5 w-5" />
          Toutes
        </div>
        
        {/* Organizations Dropdown */}
        <div className="relative group px-2 py-1 border border-transparent hover:border-white rounded-sm cursor-pointer">
          <span className="flex items-center gap-1">
            Boutiques Partenaires
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </span>
          <div className="absolute top-full left-0 mt-0 w-48 bg-white text-zinc-900 shadow-xl rounded-sm hidden group-hover:block border border-zinc-200 z-50">
            <div className="py-2 flex flex-col">
              {organizations.map(org => {
                const displayName = org.displayName || org.shortName || org.longName || org.name || org.id;
                return (
                  <Link key={org.id} href={`/${org.id}`} className="px-4 py-2 text-sm hover:bg-zinc-100 hover:text-amber-600 block">
                    {displayName}
                  </Link>
                );
              })}
              {organizations.length === 0 && (
                <div className="px-4 py-2 text-sm text-zinc-500">Aucune boutique</div>
              )}
            </div>
          </div>
        </div>

        <span className="px-2 py-1 border border-transparent hover:border-white rounded-sm cursor-pointer">Meilleures Ventes</span>
        <span className="px-2 py-1 border border-transparent hover:border-white rounded-sm cursor-pointer">Nouveautés</span>
        <span className="px-2 py-1 border border-transparent hover:border-white rounded-sm cursor-pointer">Service Client</span>
      </div>
    </header>
  );
}

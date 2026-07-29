'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';
import { Languages, ChevronDown } from 'lucide-react';

export default function LanguageSelector() {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const changeLanguage = (newLocale: string) => {
    // Définir le cookie de locale
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    setIsOpen(false);
    // Forcer le rechargement pour mettre à jour la locale partout
    window.location.reload();
  };

  return (
    <div className="relative inline-block text-left z-50">
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-black uppercase tracking-wider shadow-sm transition-all outline-none"
      >
        <Languages className="h-3.5 w-3.5 text-zinc-500" />
        <span>{locale}</span>
        <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-28 rounded-xl bg-white border border-zinc-200 shadow-lg ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="py-1">
              <button
                onClick={() => changeLanguage('fr')}
                className={`flex w-full items-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-left transition-colors ${
                  locale === 'fr' ? 'bg-blue-50 text-blue-600' : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                Français
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`flex w-full items-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-left transition-colors ${
                  locale === 'en' ? 'bg-blue-50 text-blue-600' : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import React from 'react';
import { Package, ShoppingCart, Sparkles } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  pantryCount: number;
  shoppingCount: number;
  suggestionsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onChangeTab,
  pantryCount,
  shoppingCount,
  suggestionsCount,
}) => {
  const tabs = [
    {
      id: 'shopping' as ActiveTab,
      label: 'Shopping List',
      shortLabel: 'Shop List',
      icon: ShoppingCart,
      badge: shoppingCount,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'pantry' as ActiveTab,
      label: 'Pantry Inventory',
      shortLabel: 'Pantry',
      icon: Package,
      badge: pantryCount,
      badgeColor: 'bg-slate-200 text-slate-700',
    },
    {
      id: 'suggestions' as ActiveTab,
      label: 'Cadence Suggestions',
      shortLabel: 'Suggestions',
      icon: Sparkles,
      badge: suggestionsCount,
      badgeColor: suggestionsCount > 0 ? 'bg-amber-500 text-white animate-pulse-subtle' : 'bg-slate-200 text-slate-700',
    },
  ];

  return (
    <>
      {/* Desktop Tabs (Top) */}
      <nav aria-label="Desktop Navigation" className="hidden sm:block border-b border-slate-200 bg-white shadow-xs">
        <div className="max-w-5xl mx-auto px-4 flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm transition-all ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-semibold ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Fixed) */}
      <nav aria-label="Mobile Navigation" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-bottom">
        <div className="grid grid-cols-3 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`relative flex flex-col items-center justify-center transition-colors ${
                  isActive ? 'text-emerald-600 font-medium' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-emerald-600' : 'text-slate-500'}`} />
                  {tab.badge > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-3 px-1.5 py-0.2 min-w-[18px] text-[10px] leading-tight text-center rounded-full font-bold shadow-xs ${tab.badgeColor}`}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

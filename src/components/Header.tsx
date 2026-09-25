import React from 'react';
import { ShoppingBasket, RefreshCw, Download, Upload, RotateCcw, Smartphone } from 'lucide-react';

interface HeaderProps {
  onOpenDataModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  shoppingCount: number;
  suggestionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDataModal,
  onRefresh,
  isRefreshing,
  shoppingCount,
  suggestionsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 safe-top">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <ShoppingBasket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
              Personal Shopper
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Pantry Inventory & Smart Cadence Shopping
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Data"
            aria-label="Refresh Data"
            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={onOpenDataModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            title="Backup, Sync & Mobile Access"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Data & Sync</span>
            <span className="sm:hidden">Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingCart,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { PantryItem, StockFilter } from '../types';
import { formatRelativeDate, getCategoryColor } from '../utils/format';

interface PantryViewProps {
  items: PantryItem[];
  categories: string[];
  onAddItem: () => void;
  onEditItem: (item: PantryItem) => void;
  onDeleteItem: (id: string, name: string) => void;
  onToggleStock: (id: string) => void;
  onAddToShoppingList: (id: string) => void;
}

export const PantryView: React.FC<PantryViewProps> = ({
  items,
  categories,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleStock,
  onAddToShoppingList,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  // Compute status metrics
  const totalCount = items.length;
  const inStockCount = items.filter((i) => i.inStock).length;
  const outOfStockCount = items.filter((i) => !i.inStock).length;

  const now = new Date();
  const dueCount = items.filter((i) => {
    if (!i.inStock) return true;
    if (!i.nextDueDate) return false;
    const due = new Date(i.nextDueDate);
    const diff = (due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    return diff <= 1;
  }).length;

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      if (!matchName && !matchCategory && !matchNotes) return false;
    }

    // Category match
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }

    // Stock status match
    if (stockFilter === 'in-stock') return item.inStock;
    if (stockFilter === 'out-of-stock') return !item.inStock;
    if (stockFilter === 'due') {
      if (!item.inStock) return true;
      if (!item.nextDueDate) return false;
      const due = new Date(item.nextDueDate);
      const diff = (due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
      return diff <= 1;
    }

    return true;
  });

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pantry by name, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all bg-slate-50/50 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Add Item Button */}
        <button
          onClick={onAddItem}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Pantry Item</span>
        </button>
      </div>

      {/* Filter Tabs and Categories */}
      <div className="space-y-2">
        {/* Stock Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setStockFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              stockFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Items ({totalCount})
          </button>
          <button
            onClick={() => setStockFilter('in-stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              stockFilter === 'in-stock'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            In Stock ({inStockCount})
          </button>
          <button
            onClick={() => setStockFilter('out-of-stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              stockFilter === 'out-of-stock'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
          <button
            onClick={() => setStockFilter('due')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              stockFilter === 'due'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Due for Restock ({dueCount})</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedCategory === 'All'
                ? 'bg-slate-200 text-slate-900 font-bold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-200 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Item List / Cards */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No items match your filter</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? `No items matching "${searchQuery}"` : 'Try changing your category or stock filter.'}
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setStockFilter('all');
            }}
            className="px-4 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            const catStyle = getCategoryColor(item.category);

            // Compute due calculation
            let isOverdue = false;
            let isDueSoon = false;
            let daysDiff = 0;
            if (item.nextDueDate) {
              const diffMs = new Date(item.nextDueDate).getTime() - now.getTime();
              daysDiff = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
              isOverdue = daysDiff < 0;
              isDueSoon = daysDiff <= 1;
            }

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                  !item.inStock
                    ? 'border-rose-200 bg-rose-50/10'
                    : isOverdue
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top row: Category badge & Actions */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                    >
                      {item.category}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditItem(item)}
                        title="Edit Item"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id, item.name)}
                        title="Delete from Pantry"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Quantity */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-snug">{item.name}</h4>
                      {item.notes && <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg shrink-0 ml-2">
                      {item.quantity} {item.unit}
                    </span>
                  </div>

                  {/* Cadence Info */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{item.frequencyLabel}</span>
                    </span>

                    {/* Due Badge */}
                    {!item.inStock ? (
                      <span className="inline-flex items-center space-x-1 bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-bold">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Out of Stock</span>
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Overdue by {Math.abs(daysDiff)}d</span>
                      </span>
                    ) : daysDiff === 0 ? (
                      <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Due Today</span>
                      </span>
                    ) : isDueSoon ? (
                      <span className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md font-semibold">
                        <span>Due Tomorrow</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md">
                        <span>Due in {daysDiff}d</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Last bought: {formatRelativeDate(item.lastPurchasedAt)}</span>
                    {item.nextDueDate && <span>Next due: {formatRelativeDate(item.nextDueDate)}</span>}
                  </div>
                </div>

                {/* Bottom Row Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {/* Stock Toggle Button */}
                  <button
                    onClick={() => onToggleStock(item.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      item.inStock
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    {item.inStock ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>In Stock</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Out of Stock</span>
                      </>
                    )}
                  </button>

                  {/* Add to Shopping List button */}
                  {item.inShoppingList ? (
                    <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>On Shopping List</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onAddToShoppingList(item.id)}
                      className="flex items-center space-x-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Shop List</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

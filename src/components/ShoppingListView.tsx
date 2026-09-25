import React, { useState } from 'react';
import {
  Check,
  Trash2,
  Plus,
  Sparkles,
  ShoppingBag,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { PantryItem, ShoppingSuggestion } from '../types';
import { soundEffects } from '../utils/audio';
import { fireShoppingConfetti } from '../utils/confetti';
import { getCategoryColor } from '../utils/format';

interface ShoppingListViewProps {
  shoppingItems: PantryItem[];
  allPantryItems: PantryItem[];
  suggestions: ShoppingSuggestion[];
  categories: string[];
  onCheckOff: (id: string, name: string) => Promise<void>;
  onDeleteFromList: (id: string, name: string) => Promise<void>;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onAddToList: (payload: {
    nameOrId: string;
    quantity?: number;
    category?: string;
    frequencyDays?: number;
    unit?: string;
  }) => Promise<void>;
  onAddBulkToList: (ids: string[]) => Promise<void>;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  shoppingItems,
  allPantryItems,
  suggestions,
  categories,
  onCheckOff,
  onDeleteFromList,
  onUpdateQuantity,
  onAddToList,
  onAddBulkToList,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [newCadence, setNewCadence] = useState(7);
  const [newCategory, setNewCategory] = useState('General');
  const [showNewItemPrompt, setShowNewItemPrompt] = useState(false);
  const [checkedSessionItems, setCheckedSessionItems] = useState<Array<{ id: string; name: string; timestamp: string }>>([]);

  // Match existing pantry items as user types
  const trimmedInput = quickInput.trim().toLowerCase();
  const existingMatches = trimmedInput
    ? allPantryItems.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmedInput) &&
          !p.inShoppingList
      )
    : [];

  const exactMatch = allPantryItems.find(
    (p) => p.name.toLowerCase() === trimmedInput
  );

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickInput.trim()) return;

    if (exactMatch) {
      // It exists in pantry!
      await onAddToList({ nameOrId: exactMatch.id, quantity: 1 });
      setQuickInput('');
      setShowNewItemPrompt(false);
    } else {
      // Brand new item: prompt for cadence or submit with defaults
      await onAddToList({
        nameOrId: quickInput.trim(),
        quantity: 1,
        frequencyDays: newCadence,
        category: newCategory,
      });
      setQuickInput('');
      setShowNewItemPrompt(false);
    }
  };

  const handleSelectExisting = async (item: PantryItem) => {
    await onAddToList({ nameOrId: item.id, quantity: 1 });
    setQuickInput('');
  };

  const handleTickItem = async (item: PantryItem) => {
    // 1. Play sound
    soundEffects.playCheckSuccess();
    // 2. Fire celebratory confetti
    fireShoppingConfetti();
    // 3. Keep local record for "Purchased this trip"
    setCheckedSessionItems((prev) => [
      { id: item.id, name: item.name, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ...prev,
    ]);
    // 4. Trigger backend checkoff (sets inStock=true, resets cadence timer, inShoppingList=false)
    await onCheckOff(item.id, item.name);
  };

  const handleAddAllSuggestions = async () => {
    const ids = suggestions.map((s) => s.item.id);
    if (ids.length > 0) {
      await onAddBulkToList(ids);
    }
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Quick Add Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Add item to shopping list (e.g. Milk, Apples, Bread)..."
              value={quickInput}
              onChange={(e) => {
                setQuickInput(e.target.value);
                setShowNewItemPrompt(true);
              }}
              className="w-full pl-3.5 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="flex items-center space-x-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Add</span>
          </button>
        </form>

        {/* Real-time Suggestions / Pantry matches when typing */}
        {quickInput.trim().length > 0 && showNewItemPrompt && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
            {/* Existing pantry items match */}
            {existingMatches.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select from existing pantry:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {existingMatches.slice(0, 5).map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => handleSelectExisting(match)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-xl text-xs font-medium transition-all"
                    >
                      <span>{match.name}</span>
                      <span className="text-[10px] text-slate-400">({match.frequencyLabel})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brand new item creation config */}
            {!exactMatch && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs space-y-2">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-medium">
                  <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>"{quickInput.trim()}"</strong> will be added to your shopping list & created in your pantry.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-600">Category:</span>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-600">Buy Cadence:</span>
                    <select
                      value={newCadence}
                      onChange={(e) => setNewCadence(Number(e.target.value))}
                      className="bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs focus:outline-none font-medium"
                    >
                      <option value={3}>Every 3 days</option>
                      <option value={7}>Weekly (7d)</option>
                      <option value={14}>Every 2 weeks (14d)</option>
                      <option value={21}>Every 3 weeks</option>
                      <option value={30}>Monthly (30d)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cadence Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 rounded-2xl p-4 shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900 flex items-center space-x-1.5">
                  <span>Smart Cadence Suggestions</span>
                  <span className="bg-amber-200/80 text-amber-800 text-[11px] px-2 py-0.2 rounded-full font-bold">
                    {suggestions.length} due
                  </span>
                </h3>
                <p className="text-xs text-amber-700/80">
                  Items due for replenishment based on your purchase frequency
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddAllSuggestions}
                className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
              >
                <span>Add All ({suggestions.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                title={showSuggestions ? 'Collapse' : 'Expand'}
              >
                {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Suggestions Pill Carousel */}
          {showSuggestions && (
            <div className="mt-3 pt-3 border-t border-amber-200/50 space-y-2">
              <div className="sm:hidden mb-2">
                <button
                  onClick={handleAddAllSuggestions}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                >
                  <span>Add All ({suggestions.length}) Due Items</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {suggestions.map((sug) => {
                  const isCritical = sug.urgency === 'critical';
                  return (
                    <div
                      key={sug.item.id}
                      className="bg-white/90 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-800 text-xs truncate">
                          {sug.item.name}
                        </div>
                        <div className="flex items-center space-x-1 text-[10px] text-amber-700 font-medium">
                          <span
                            className={`px-1.5 py-0.2 rounded-md ${
                              isCritical ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {sug.reason}
                          </span>
                          <span className="text-slate-400">• {sug.item.frequencyLabel}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddToList({ nameOrId: sug.item.id, quantity: 1 })}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shrink-0 border border-emerald-200 hover:border-emerald-600"
                      >
                        + Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Shopping List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">Next Shop List</h2>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
              {shoppingItems.length} items
            </span>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            Tick off = in-stock + reset timer • Delete = didn't buy
          </div>
        </div>

        {/* Empty State */}
        {shoppingItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Your shopping list is clear!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All pantry items are stocked, or you're ready to plan your next shop. Use the input bar above or select from Cadence Suggestions.
              </p>
            </div>
            {suggestions.length > 0 && (
              <button
                onClick={handleAddAllSuggestions}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add {suggestions.length} Cadence Due Items</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {shoppingItems.map((item) => {
              const catStyle = getCategoryColor(item.category);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between gap-3 group"
                >
                  {/* Left: Interactive Tick Circle */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <button
                      onClick={() => handleTickItem(item)}
                      title="Tick off (Bought - reset cadence & mark in stock)"
                      className="w-8 h-8 rounded-full border-2 border-emerald-500 hover:bg-emerald-500 flex items-center justify-center text-transparent hover:text-white transition-all transform active:scale-90 shrink-0"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm truncate">{item.name}</span>
                        <span
                          className={`hidden xs:inline-block px-2 py-0.2 text-[10px] font-semibold rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                        <span className="inline-flex items-center space-x-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.frequencyLabel}</span>
                        </span>
                        {item.notes && <span className="text-[11px] text-slate-400 truncate">• {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity Controls & Delete ("Didn't buy") Button */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/70 overflow-hidden">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, Math.max(1, (item.shoppingListQuantity || 1) - 1))
                        }
                        className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 text-xs font-bold transition-colors"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800 min-w-[20px] text-center">
                        {item.shoppingListQuantity || 1}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, (item.shoppingListQuantity || 1) + 1)
                        }
                        className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 text-xs font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Delete button: didn't buy semantic */}
                    <button
                      onClick={() => onDeleteFromList(item.id, item.name)}
                      title="Didn't buy it (Remove from list without resetting cadence)"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Purchased This Trip (Session History) */}
      {checkedSessionItems.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Purchased This Trip ({checkedSessionItems.length})</span>
            </h3>
            <button
              onClick={() => setCheckedSessionItems([])}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mb-2.5">
            These items were marked in-stock in your pantry and their cadence timers have been reset to today.
          </p>
          <div className="flex flex-wrap gap-2">
            {checkedSessionItems.map((item, idx) => (
              <span
                key={`${item.id}-${idx}`}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium"
              >
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="line-through">{item.name}</span>
                <span className="text-[10px] text-emerald-600/70 font-normal">at {item.timestamp}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

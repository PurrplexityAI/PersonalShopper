import React from 'react';
import { Sparkles, Plus, Check, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { ShoppingSuggestion } from '../types';
import { getCategoryColor } from '../utils/format';

interface SuggestionsViewProps {
  suggestions: ShoppingSuggestion[];
  onAddToList: (id: string) => Promise<void>;
  onAddAll: (ids: string[]) => Promise<void>;
}

export const SuggestionsView: React.FC<SuggestionsViewProps> = ({
  suggestions,
  onAddToList,
  onAddAll,
}) => {
  const criticalItems = suggestions.filter((s) => s.urgency === 'critical');
  const highItems = suggestions.filter((s) => s.urgency === 'high');
  const mediumLowItems = suggestions.filter((s) => s.urgency === 'medium' || s.urgency === 'low');

  const handleAddAll = async () => {
    const ids = suggestions.map((s) => s.item.id);
    if (ids.length > 0) {
      await onAddAll(ids);
    }
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <h2 className="text-lg font-bold">Cadence Restock Suggestions</h2>
          </div>
          <p className="text-xs text-amber-100 mt-1 max-w-xl">
            Calculated from your custom purchase frequencies and current pantry stock status. Add them to your shopping list with a single tap.
          </p>
        </div>

        {suggestions.length > 0 && (
          <button
            onClick={handleAddAll}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white text-amber-800 hover:bg-amber-50 rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <span>Add All ({suggestions.length}) to Shopping List</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Everything is well-stocked!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No pantry items are currently overdue or low according to their purchase cadences.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Critical: Out of stock */}
          {criticalItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Out of Stock in Pantry ({criticalItems.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {criticalItems.map((sug) => (
                  <SuggestionCard key={sug.item.id} suggestion={sug} onAddToList={onAddToList} />
                ))}
              </div>
            </div>
          )}

          {/* High: Overdue or due today */}
          {highItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Due Today or Overdue ({highItems.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {highItems.map((sug) => (
                  <SuggestionCard key={sug.item.id} suggestion={sug} onAddToList={onAddToList} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming: Due in 1-2 days */}
          {mediumLowItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>Upcoming Replenishment ({mediumLowItems.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mediumLowItems.map((sug) => (
                  <SuggestionCard key={sug.item.id} suggestion={sug} onAddToList={onAddToList} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SuggestionCard: React.FC<{
  suggestion: ShoppingSuggestion;
  onAddToList: (id: string) => Promise<void>;
}> = ({ suggestion, onAddToList }) => {
  const { item, reason, urgency } = suggestion;
  const catStyle = getCategoryColor(item.category);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-0.2 text-[10px] font-semibold rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
          >
            {item.category}
          </span>
          <span
            className={`px-2 py-0.2 text-[10px] font-bold rounded-md ${
              urgency === 'critical'
                ? 'bg-rose-100 text-rose-800'
                : urgency === 'high'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {reason}
          </span>
        </div>
        <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{item.name}</h4>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{item.frequencyLabel}</span>
          </span>
          <span>• In stock: {item.inStock ? `${item.quantity} ${item.unit}` : 'No'}</span>
        </div>
      </div>

      <button
        onClick={() => onAddToList(item.id)}
        className="flex items-center space-x-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add</span>
      </button>
    </div>
  );
};

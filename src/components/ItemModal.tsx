import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Calendar, Tag, Hash, FileText } from 'lucide-react';
import { PantryItem } from '../types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<PantryItem>) => Promise<void>;
  initialItem?: PantryItem | null;
  existingItems: PantryItem[];
  categories: string[];
}

const CADENCE_PRESETS = [
  { days: 1, label: 'Daily' },
  { days: 3, label: 'Every 3 days' },
  { days: 7, label: 'Weekly (7d)' },
  { days: 14, label: 'Every 2 weeks (14d)' },
  { days: 21, label: 'Every 3 weeks' },
  { days: 30, label: 'Monthly (30d)' },
  { days: 60, label: 'Every 2 months' },
  { days: 90, label: 'Quarterly (90d)' },
];

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  existingItems,
  categories,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [inStock, setInStock] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('items');
  const [frequencyDays, setFrequencyDays] = useState(7);
  const [isCustomCadence, setIsCustomCadence] = useState(false);
  const [customDays, setCustomDays] = useState('7');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setCategory(initialItem.category);
      setInStock(initialItem.inStock);
      setQuantity(initialItem.quantity || 1);
      setUnit(initialItem.unit || 'items');
      setFrequencyDays(initialItem.frequencyDays || 7);
      const isPreset = CADENCE_PRESETS.some((p) => p.days === initialItem.frequencyDays);
      setIsCustomCadence(!isPreset);
      setCustomDays(String(initialItem.frequencyDays || 7));
      setNotes(initialItem.notes || '');
    } else {
      setName('');
      setCategory(categories[0] || 'General');
      setCustomCategory('');
      setInStock(true);
      setQuantity(1);
      setUnit('items');
      setFrequencyDays(7);
      setIsCustomCadence(false);
      setCustomDays('7');
      setNotes('');
    }
    setError(null);
  }, [initialItem, isOpen, categories]);

  if (!isOpen) return null;

  // Real-time duplicate name check
  const trimmedName = name.trim().toLowerCase();
  const duplicateConflict = existingItems.find(
    (item) =>
      item.name.trim().toLowerCase() === trimmedName &&
      (!initialItem || item.id !== initialItem.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }

    if (duplicateConflict) {
      setError(`An item named "${duplicateConflict.name}" already exists in the pantry. Pantry items must be unique.`);
      return;
    }

    const finalCadence = isCustomCadence ? parseInt(customDays, 10) || 7 : frequencyDays;
    const finalCategory = category === '__custom__' ? customCategory.trim() || 'General' : category;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        category: finalCategory,
        inStock,
        quantity: Math.max(0, quantity),
        unit: unit.trim() || 'items',
        frequencyDays: finalCadence,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialItem ? 'Edit Pantry Item' : 'Add New Pantry Item'}
            </h2>
            <p className="text-xs text-slate-500">
              {initialItem
                ? 'Update inventory details and purchase cadence'
                : 'Inventory items in the pantry must be unique'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Greek Yogurt, Whole Milk, Bananas"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                duplicateConflict
                  ? 'border-rose-300 ring-rose-200 focus:border-rose-500'
                  : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
              }`}
            />
            {duplicateConflict && (
              <p className="text-xs text-rose-600 mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Already in pantry. Choose a unique name or edit existing.</span>
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__custom__">+ Add Custom Category...</option>
            </select>
            {category === '__custom__' && (
              <input
                type="text"
                placeholder="Enter new category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2 w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            )}
          </div>

          {/* Purchase Cadence (Frequency) */}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Purchase Cadence (How often to buy)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {CADENCE_PRESETS.map((preset) => {
                const isSelected = !isCustomCadence && frequencyDays === preset.days;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => {
                      setIsCustomCadence(false);
                      setFrequencyDays(preset.days);
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold ring-1 ring-emerald-400 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsCustomCadence(true)}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all text-center ${
                  isCustomCadence
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold ring-1 ring-emerald-400 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Custom Days
              </button>
            </div>

            {isCustomCadence && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-slate-600">Buy every:</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-24 px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-600">days</span>
              </div>
            )}
          </div>

          {/* Stock Status & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* In Stock Toggle */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-800 block">In Stock</span>
                <span className="text-xs text-slate-500">Currently in pantry</span>
              </div>
              <button
                type="button"
                onClick={() => setInStock(!inStock)}
                className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  inStock ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    inStock ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Quantity and Unit */}
            <div className="flex space-x-2">
              <div className="w-1/2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  placeholder="pack, bottle, kg"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes (optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Brand preference, aisle location"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !!duplicateConflict}
            className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : initialItem ? 'Save Changes' : 'Add to Pantry'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

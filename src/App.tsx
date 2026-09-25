import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { PantryView } from './components/PantryView';
import { ShoppingListView } from './components/ShoppingListView';
import { SuggestionsView } from './components/SuggestionsView';
import { ItemModal } from './components/ItemModal';
import { DataModal } from './components/DataModal';
import { Toast, ToastMessage } from './components/Toast';
import { api } from './api';
import { PantryItem, ShoppingSuggestion, ActiveTab } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('shopping');
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [shoppingItems, setShoppingItems] = useState<PantryItem[]>([]);
  const [suggestions, setSuggestions] = useState<ShoppingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: String(Date.now()), text, type });
  };

  // Load all app data from backend
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [allPantry, cats, shopList, suggs] = await Promise.all([
        api.getPantry(),
        api.getCategories(),
        api.getShoppingList(),
        api.getSuggestions(),
      ]);

      setPantryItems(allPantry);
      setCategories(cats);
      setShoppingItems(shopList);
      setSuggestions(suggs);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      showToast(err.message || 'Error connecting to pantry server', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ----------------------------------------------------
  // Shopping List Handlers
  // ----------------------------------------------------

  // Tick off an item from the shopping list (Bought: mark in-stock, reset cadence timer)
  const handleCheckOff = async (id: string, name: string) => {
    try {
      const res = await api.checkOffShoppingItem(id);
      showToast(`Bought "${name}"! In stock & cadence timer reset.`, 'success');
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to tick off item', 'error');
    }
  };

  // Delete from shopping list ("Didn't buy it": removes from list, leaves cadence & stock untouched)
  const handleDeleteFromList = async (id: string, name: string) => {
    try {
      await api.deleteFromShoppingList(id);
      showToast(`Removed "${name}" from shopping list (didn't buy).`, 'info');
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove item', 'error');
    }
  };

  // Add item to shopping list (auto-creates in pantry if not existing)
  const handleAddToList = async (payload: {
    nameOrId: string;
    quantity?: number;
    category?: string;
    frequencyDays?: number;
    unit?: string;
  }) => {
    try {
      const res = await api.addToShoppingList(payload);
      showToast(res.message, 'success');
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to add item', 'error');
    }
  };

  // Bulk add suggestions
  const handleAddBulkToList = async (ids: string[]) => {
    try {
      const updated = await api.addBulkToShoppingList(ids);
      showToast(`Added ${updated.length} items to shopping list`, 'success');
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to add items', 'error');
    }
  };

  // Update shopping quantity
  const handleUpdateQuantity = async (id: string, quantity: number) => {
    try {
      await api.updateShoppingQuantity(id, quantity);
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to update quantity', 'error');
    }
  };

  // ----------------------------------------------------
  // Pantry Handlers
  // ----------------------------------------------------

  // Quick toggle in-stock status directly from pantry
  const handleToggleStock = async (id: string) => {
    try {
      const updated = await api.toggleStock(id);
      showToast(
        `"${updated.name}" is now ${updated.inStock ? 'In Stock' : 'Out of Stock'}`,
        updated.inStock ? 'success' : 'info'
      );
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle stock', 'error');
    }
  };

  // Delete item from pantry completely
  const handleDeletePantryItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from your pantry inventory?`)) {
      return;
    }
    try {
      await api.deletePantryItem(id);
      showToast(`Deleted "${name}" from pantry`, 'info');
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete item', 'error');
    }
  };

  // Save new or edited pantry item
  const handleSavePantryItem = async (itemData: Partial<PantryItem>) => {
    if (editingItem) {
      await api.updatePantryItem(editingItem.id, itemData);
      showToast(`Updated "${itemData.name || editingItem.name}"`, 'success');
    } else {
      await api.createPantryItem(itemData);
      showToast(`Added "${itemData.name}" to pantry inventory`, 'success');
    }
    await loadData(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Notifications */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Top Header */}
      <Header
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onRefresh={() => loadData(false)}
        isRefreshing={isRefreshing}
        shoppingCount={shoppingItems.length}
        suggestionsCount={suggestions.length}
      />

      {/* Main Navigation (Desktop Top & Mobile Bottom) */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pantryCount={pantryItems.length}
        shoppingCount={shoppingItems.length}
        suggestionsCount={suggestions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 sm:py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Loading your pantry & shopping list...</p>
          </div>
        ) : (
          <>
            {activeTab === 'shopping' && (
              <ShoppingListView
                shoppingItems={shoppingItems}
                allPantryItems={pantryItems}
                suggestions={suggestions}
                categories={categories}
                onCheckOff={handleCheckOff}
                onDeleteFromList={handleDeleteFromList}
                onUpdateQuantity={handleUpdateQuantity}
                onAddToList={handleAddToList}
                onAddBulkToList={handleAddBulkToList}
              />
            )}

            {activeTab === 'pantry' && (
              <PantryView
                items={pantryItems}
                categories={categories}
                onAddItem={() => {
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
                onEditItem={(item) => {
                  setEditingItem(item);
                  setIsItemModalOpen(true);
                }}
                onDeleteItem={handleDeletePantryItem}
                onToggleStock={handleToggleStock}
                onAddToShoppingList={(id) => handleAddToList({ nameOrId: id, quantity: 1 })}
              />
            )}

            {activeTab === 'suggestions' && (
              <SuggestionsView
                suggestions={suggestions}
                onAddToList={(id) => handleAddToList({ nameOrId: id, quantity: 1 })}
                onAddAll={handleAddBulkToList}
              />
            )}
          </>
        )}
      </main>

      {/* Add / Edit Item Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSavePantryItem}
        initialItem={editingItem}
        existingItems={pantryItems}
        categories={categories}
      />

      {/* Data / Sync / Mobile Guide Modal */}
      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onRefreshData={() => loadData(true)}
      />
    </div>
  );
};

export default App;

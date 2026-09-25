export interface PantryItem {
  id: string;
  name: string;
  category: string;
  inStock: boolean;
  quantity: number;
  unit: string;
  frequencyDays: number;
  frequencyLabel: string;
  lastPurchasedAt: string | null;
  nextDueDate: string | null;
  inShoppingList: boolean;
  shoppingListQuantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ShoppingSuggestion {
  item: PantryItem;
  reason: string;
  urgency: UrgencyLevel;
  daysRemaining: number;
}

export type ActiveTab = 'pantry' | 'shopping' | 'suggestions';

export type StockFilter = 'all' | 'in-stock' | 'out-of-stock' | 'due';

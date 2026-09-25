export interface PantryItem {
  id: string;
  name: string; // Must be unique (case-insensitive)
  category: string;
  inStock: boolean;
  quantity: number;
  unit: string;
  frequencyDays: number; // Purchase cadence in days (e.g., 7 = weekly)
  frequencyLabel: string; // E.g., "Weekly (7d)", "Every 2 weeks", "Monthly"
  lastPurchasedAt: string | null; // ISO string of when it was last bought
  nextDueDate: string | null; // ISO string: lastPurchasedAt + frequencyDays
  inShoppingList: boolean; // True if item is currently on the shopping list
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
  daysRemaining: number; // Negative if overdue, 0 if due today, positive if due soon
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

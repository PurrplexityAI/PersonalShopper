import { PantryItem, ShoppingSuggestion } from './types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || `HTTP error ${response.status}`);
  }
  return json.data as T;
}

export const api = {
  // Pantry Endpoints
  async getPantry(params?: { q?: string; category?: string; status?: string }): Promise<PantryItem[]> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<PantryItem[]>(`/pantry${qs}`);
  },

  async getCategories(): Promise<string[]> {
    return request<string[]>('/pantry/categories');
  },

  async getPantryItem(id: string): Promise<PantryItem> {
    return request<PantryItem>(`/pantry/${id}`);
  },

  async createPantryItem(item: Partial<PantryItem>): Promise<PantryItem> {
    return request<PantryItem>('/pantry', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updatePantryItem(id: string, updates: Partial<PantryItem>): Promise<PantryItem> {
    return request<PantryItem>(`/pantry/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async toggleStock(id: string): Promise<PantryItem> {
    return request<PantryItem>(`/pantry/${id}/toggle-stock`, {
      method: 'POST',
    });
  },

  async deletePantryItem(id: string): Promise<void> {
    await request<void>(`/pantry/${id}`, {
      method: 'DELETE',
    });
  },

  // Shopping List Endpoints
  async getShoppingList(): Promise<PantryItem[]> {
    return request<PantryItem[]>('/shopping-list');
  },

  async addToShoppingList(payload: {
    nameOrId: string;
    quantity?: number;
    category?: string;
    frequencyDays?: number;
    unit?: string;
  }): Promise<{ item: PantryItem; createdInPantry: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/shopping-list/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error || 'Failed to add item to shopping list');
    }
    return {
      item: json.data,
      createdInPantry: json.createdInPantry,
      message: json.message,
    };
  },

  async checkOffShoppingItem(id: string): Promise<{ item: PantryItem; message: string }> {
    const response = await fetch(`${API_BASE}/shopping-list/${id}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error || 'Failed to check off shopping item');
    }
    return { item: json.data, message: json.message };
  },

  async deleteFromShoppingList(id: string): Promise<PantryItem> {
    return request<PantryItem>(`/shopping-list/${id}`, {
      method: 'DELETE',
    });
  },

  async updateShoppingQuantity(id: string, quantity: number): Promise<PantryItem> {
    return request<PantryItem>(`/shopping-list/${id}/quantity`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  async getSuggestions(): Promise<ShoppingSuggestion[]> {
    return request<ShoppingSuggestion[]>('/shopping-list/suggestions');
  },

  async addBulkToShoppingList(itemIds: string[]): Promise<PantryItem[]> {
    return request<PantryItem[]>('/shopping-list/add-bulk', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    });
  },

  // Data Management
  async exportData(): Promise<{ items: PantryItem[]; exportedAt: string }> {
    const res = await fetch(`${API_BASE}/data/export`);
    if (!res.ok) throw new Error('Failed to export data');
    return res.json();
  },

  async importData(items: PantryItem[]): Promise<string> {
    const res = await fetch(`${API_BASE}/data/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to import data');
    return json.message;
  },

  async resetSampleData(): Promise<PantryItem[]> {
    return request<PantryItem[]>('/data/reset-sample', {
      method: 'POST',
    });
  },
};

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PantryItem, ShoppingSuggestion } from './types.js';
import { calculateNextDueDate, getFrequencyLabel, generateSuggestions } from './cadence.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pantry_db.json');

/**
 * Initial seed items showcasing various categories, cadences, and stock states.
 */
function getInitialSeedData(): PantryItem[] {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const seed: Array<Omit<PantryItem, 'id' | 'createdAt' | 'updatedAt' | 'frequencyLabel' | 'nextDueDate'>> = [
    {
      name: 'Whole Milk (2L)',
      category: 'Dairy & Eggs',
      inStock: true,
      quantity: 1,
      unit: 'bottle',
      frequencyDays: 7,
      lastPurchasedAt: daysAgo(6), // 6 days ago on 7-day cycle -> due tomorrow
      inShoppingList: false,
      shoppingListQuantity: 1,
      notes: 'Organic preferred',
    },
    {
      name: 'Free Range Eggs (Dozen)',
      category: 'Dairy & Eggs',
      inStock: true,
      quantity: 1,
      unit: 'carton',
      frequencyDays: 14,
      lastPurchasedAt: daysAgo(5),
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Sourdough Sliced Bread',
      category: 'Bakery',
      inStock: false, // Out of stock -> urgent suggestion!
      quantity: 0,
      unit: 'loaf',
      frequencyDays: 5,
      lastPurchasedAt: daysAgo(6),
      inShoppingList: true, // Already queued on shopping list
      shoppingListQuantity: 1,
    },
    {
      name: 'Bananas',
      category: 'Produce',
      inStock: true,
      quantity: 1,
      unit: 'bunch',
      frequencyDays: 6,
      lastPurchasedAt: daysAgo(6), // Due today!
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Extra Virgin Olive Oil',
      category: 'Pantry Staples',
      inStock: true,
      quantity: 1,
      unit: 'bottle',
      frequencyDays: 30,
      lastPurchasedAt: daysAgo(10),
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Ground Espresso Coffee',
      category: 'Beverages',
      inStock: true,
      quantity: 2,
      unit: 'bags',
      frequencyDays: 14,
      lastPurchasedAt: daysAgo(15), // Overdue by 1 day!
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Rolled Oats (1kg)',
      category: 'Pantry Staples',
      inStock: true,
      quantity: 1,
      unit: 'pack',
      frequencyDays: 21,
      lastPurchasedAt: daysAgo(12),
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Unsalted Butter',
      category: 'Dairy & Eggs',
      inStock: true,
      quantity: 1,
      unit: 'block',
      frequencyDays: 14,
      lastPurchasedAt: daysAgo(3),
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Dishwasher Tablets',
      category: 'Household',
      inStock: true,
      quantity: 1,
      unit: 'pack',
      frequencyDays: 30,
      lastPurchasedAt: daysAgo(28), // Due in 2 days
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
  ];

  return seed.map((item) => {
    const id = crypto.randomUUID();
    const frequencyLabel = getFrequencyLabel(item.frequencyDays);
    const nextDueDate = calculateNextDueDate(item.lastPurchasedAt, item.frequencyDays);
    const nowIso = now.toISOString();
    return {
      ...item,
      id,
      frequencyLabel,
      nextDueDate,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  });
}

class PantryDatabase {
  private items: PantryItem[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.items = JSON.parse(raw);
        console.log(`[DB] Loaded ${this.items.length} pantry items from ${DB_FILE}`);
      } catch (err) {
        console.error('[DB] Error reading existing DB file, creating backup and re-seeding:', err);
        const backupFile = path.join(DATA_DIR, `pantry_backup_${Date.now()}.json`);
        fs.renameSync(DB_FILE, backupFile);
        this.items = getInitialSeedData();
        this.save();
      }
    } else {
      console.log('[DB] No database found. Seeding with default pantry inventory...');
      this.items = getInitialSeedData();
      this.save();
    }
  }

  /**
   * Atomic file save: writes to .tmp file then renames to avoid data loss.
   */
  private save() {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(this.items, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase();
  }

  public getAll(): PantryItem[] {
    return [...this.items];
  }

  public getById(id: string): PantryItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  public findByName(name: string): PantryItem | undefined {
    const target = this.normalizeName(name);
    return this.items.find((item) => this.normalizeName(item.name) === target);
  }

  /**
   * Creates a new pantry inventory item. Enforces unique item names.
   */
  public create(data: {
    name: string;
    category?: string;
    inStock?: boolean;
    quantity?: number;
    unit?: string;
    frequencyDays?: number;
    lastPurchasedAt?: string | null;
    inShoppingList?: boolean;
    shoppingListQuantity?: number;
    notes?: string;
  }): PantryItem {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new Error('Item name is required');
    }

    if (this.findByName(trimmedName)) {
      throw new Error(`An item named "${trimmedName}" already exists in the pantry.`);
    }

    const now = new Date().toISOString();
    const frequencyDays = data.frequencyDays ?? 7;
    const frequencyLabel = getFrequencyLabel(frequencyDays);
    const lastPurchasedAt = data.lastPurchasedAt !== undefined ? data.lastPurchasedAt : (data.inStock !== false ? now : null);
    const nextDueDate = calculateNextDueDate(lastPurchasedAt, frequencyDays);

    const newItem: PantryItem = {
      id: crypto.randomUUID(),
      name: trimmedName,
      category: data.category?.trim() || 'General',
      inStock: data.inStock ?? true,
      quantity: data.quantity ?? 1,
      unit: data.unit?.trim() || 'items',
      frequencyDays,
      frequencyLabel,
      lastPurchasedAt,
      nextDueDate,
      inShoppingList: data.inShoppingList ?? false,
      shoppingListQuantity: data.shoppingListQuantity ?? 1,
      notes: data.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    this.items.push(newItem);
    this.save();
    return newItem;
  }

  /**
   * Updates an existing pantry item. If name is modified, ensures uniqueness.
   */
  public update(id: string, updates: Partial<PantryItem>): PantryItem {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Item with id "${id}" not found`);
    }

    const current = this.items[index];

    // Check name uniqueness if updated
    if (updates.name && updates.name.trim()) {
      const trimmed = updates.name.trim();
      const existing = this.findByName(trimmed);
      if (existing && existing.id !== id) {
        throw new Error(`Another item named "${trimmed}" already exists in the pantry.`);
      }
      updates.name = trimmed;
    }

    // Recompute cadence fields if frequency or lastPurchasedAt changed
    const frequencyDays = updates.frequencyDays !== undefined ? updates.frequencyDays : current.frequencyDays;
    const frequencyLabel = getFrequencyLabel(frequencyDays);
    const lastPurchasedAt = updates.lastPurchasedAt !== undefined ? updates.lastPurchasedAt : current.lastPurchasedAt;
    const nextDueDate = calculateNextDueDate(lastPurchasedAt, frequencyDays);

    const updatedItem: PantryItem = {
      ...current,
      ...updates,
      frequencyDays,
      frequencyLabel,
      lastPurchasedAt,
      nextDueDate,
      updatedAt: new Date().toISOString(),
    };

    this.items[index] = updatedItem;
    this.save();
    return updatedItem;
  }

  /**
   * Deletes an inventory item from the pantry completely.
   */
  public delete(id: string): boolean {
    const prevLength = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    if (this.items.length !== prevLength) {
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Retrieves active items on the shopping list.
   */
  public getShoppingList(): PantryItem[] {
    return this.items.filter((item) => item.inShoppingList);
  }

  /**
   * Adds an item to the shopping list.
   * If the item does not exist in the pantry, it creates it in the pantry automatically.
   */
  public addToShoppingList(
    nameOrId: string,
    options?: {
      quantity?: number;
      category?: string;
      frequencyDays?: number;
      unit?: string;
    }
  ): { item: PantryItem; createdInPantry: boolean } {
    let existing = this.getById(nameOrId) || this.findByName(nameOrId);

    if (existing) {
      // Existing item in pantry -> put it on the shopping list
      const updated = this.update(existing.id, {
        inShoppingList: true,
        shoppingListQuantity: options?.quantity ?? Math.max(existing.shoppingListQuantity || 1, 1),
      });
      return { item: updated, createdInPantry: false };
    }

    // Item does not exist in pantry -> create it!
    const newItem = this.create({
      name: nameOrId,
      category: options?.category || 'General',
      inStock: false, // Not yet in stock since we need to buy it
      quantity: 0,
      unit: options?.unit || 'items',
      frequencyDays: options?.frequencyDays ?? 7,
      inShoppingList: true,
      shoppingListQuantity: options?.quantity ?? 1,
      lastPurchasedAt: null,
    });

    return { item: newItem, createdInPantry: true };
  }

  /**
   * Ticking off an item on the shopping list:
   * - Marks item as inStock = true
   * - Resets cadence timer (lastPurchasedAt = now, nextDueDate recalculated)
   * - Clears item from active shopping list (inShoppingList = false)
   */
  public checkOffShoppingItem(id: string): PantryItem {
    const item = this.getById(id);
    if (!item) {
      throw new Error(`Item with id "${id}" not found`);
    }

    const now = new Date().toISOString();
    const nextDueDate = calculateNextDueDate(now, item.frequencyDays);

    return this.update(id, {
      inStock: true,
      lastPurchasedAt: now,
      nextDueDate,
      inShoppingList: false,
      quantity: item.shoppingListQuantity > 0 ? item.shoppingListQuantity : 1,
    });
  }

  /**
   * Deleting an item from the shopping list:
   * - Indicates "didn't buy it"
   * - Removes from active shopping list (inShoppingList = false)
   * - DOES NOT mark as bought or reset cadence timer
   */
  public deleteFromShoppingList(id: string): PantryItem {
    const item = this.getById(id);
    if (!item) {
      throw new Error(`Item with id "${id}" not found`);
    }

    return this.update(id, {
      inShoppingList: false,
    });
  }

  /**
   * Returns suggestions: pantry items that need to be bought based on their purchase cadence or stock level.
   */
  public getSuggestions(now: Date = new Date()): ShoppingSuggestion[] {
    return generateSuggestions(this.items, now);
  }

  /**
   * Adds multiple items to the shopping list (e.g. "Add All Due Suggestions").
   */
  public addBulkToShoppingList(itemIds: string[]): PantryItem[] {
    const updated: PantryItem[] = [];
    for (const id of itemIds) {
      const item = this.getById(id);
      if (item && !item.inShoppingList) {
        const res = this.update(id, { inShoppingList: true, shoppingListQuantity: 1 });
        updated.push(res);
      }
    }
    return updated;
  }

  /**
   * Exports full pantry data for backup.
   */
  public exportData(): { items: PantryItem[]; exportedAt: string } {
    return {
      items: this.getAll(),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Imports pantry data (validates and merges/replaces).
   */
  public importData(incomingItems: PantryItem[]): { count: number } {
    if (!Array.isArray(incomingItems)) {
      throw new Error('Invalid import data: Expected an array of pantry items.');
    }

    const validItems: PantryItem[] = [];
    const seenNames = new Set<string>();

    for (const raw of incomingItems) {
      if (!raw.name || typeof raw.name !== 'string') continue;
      const normalized = this.normalizeName(raw.name);
      if (seenNames.has(normalized)) continue;
      seenNames.add(normalized);

      const frequencyDays = Number(raw.frequencyDays) || 7;
      const frequencyLabel = getFrequencyLabel(frequencyDays);
      const nextDueDate = calculateNextDueDate(raw.lastPurchasedAt || null, frequencyDays);

      validItems.push({
        id: raw.id || crypto.randomUUID(),
        name: raw.name.trim(),
        category: raw.category?.trim() || 'General',
        inStock: Boolean(raw.inStock),
        quantity: Number(raw.quantity) >= 0 ? Number(raw.quantity) : 1,
        unit: raw.unit?.trim() || 'items',
        frequencyDays,
        frequencyLabel,
        lastPurchasedAt: raw.lastPurchasedAt || null,
        nextDueDate,
        inShoppingList: Boolean(raw.inShoppingList),
        shoppingListQuantity: Number(raw.shoppingListQuantity) > 0 ? Number(raw.shoppingListQuantity) : 1,
        notes: raw.notes || '',
        createdAt: raw.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    this.items = validItems;
    this.save();
    return { count: this.items.length };
  }

  /**
   * Resets database to sample starting items.
   */
  public resetSampleData(): PantryItem[] {
    this.items = getInitialSeedData();
    this.save();
    return [...this.items];
  }
}

export const db = new PantryDatabase();

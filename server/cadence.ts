import { PantryItem, ShoppingSuggestion, UrgencyLevel } from './types.js';

/**
 * Returns a human-friendly label for a given frequency in days.
 */
export function getFrequencyLabel(frequencyDays: number): string {
  if (frequencyDays <= 0) return 'No cadence';
  if (frequencyDays === 1) return 'Daily';
  if (frequencyDays === 2) return 'Every 2 days';
  if (frequencyDays === 3) return 'Every 3 days';
  if (frequencyDays === 7) return 'Weekly (7d)';
  if (frequencyDays === 10) return 'Every 10 days';
  if (frequencyDays === 14) return 'Every 2 weeks (14d)';
  if (frequencyDays === 21) return 'Every 3 weeks (21d)';
  if (frequencyDays === 30) return 'Monthly (30d)';
  if (frequencyDays === 60) return 'Every 2 months';
  if (frequencyDays === 90) return 'Quarterly';
  return `Every ${frequencyDays} days`;
}

/**
 * Calculates the next due date given the last purchase date and frequency in days.
 */
export function calculateNextDueDate(
  lastPurchasedAt: string | null,
  frequencyDays: number,
  fallbackBaseDate: Date = new Date()
): string | null {
  if (!frequencyDays || frequencyDays <= 0) {
    return null;
  }

  const baseDate = lastPurchasedAt ? new Date(lastPurchasedAt) : fallbackBaseDate;
  const nextDate = new Date(baseDate.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
  return nextDate.toISOString();
}

/**
 * Evaluates whether a pantry item is due for replenishment and computes suggestion details.
 */
export function evaluateItemCadence(
  item: PantryItem,
  now: Date = new Date()
): { isDue: boolean; reason: string; urgency: UrgencyLevel; daysRemaining: number } {
  // If item is completely out of stock, it's always suggested regardless of cadence
  if (!item.inStock) {
    return {
      isDue: true,
      reason: 'Out of stock in pantry',
      urgency: 'critical',
      daysRemaining: -999,
    };
  }

  // If item has no cadence defined, it only triggers if out of stock
  if (!item.frequencyDays || item.frequencyDays <= 0 || !item.nextDueDate) {
    return {
      isDue: false,
      reason: 'In stock',
      urgency: 'low',
      daysRemaining: 999,
    };
  }

  const dueDate = new Date(item.nextDueDate);
  // Calculate difference in whole days
  const msDiff = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(msDiff / (24 * 60 * 60 * 1000));

  if (diffDays < 0) {
    const overdueCount = Math.abs(diffDays);
    return {
      isDue: true,
      reason: `Overdue by ${overdueCount} day${overdueCount === 1 ? '' : 's'}`,
      urgency: overdueCount > 2 ? 'critical' : 'high',
      daysRemaining: diffDays,
    };
  }

  if (diffDays === 0) {
    return {
      isDue: true,
      reason: 'Cadence due today',
      urgency: 'high',
      daysRemaining: 0,
    };
  }

  if (diffDays === 1) {
    return {
      isDue: true,
      reason: 'Due tomorrow',
      urgency: 'medium',
      daysRemaining: 1,
    };
  }

  // For weekly or shorter items, suggest 2 days before
  if (diffDays <= 2 && item.frequencyDays <= 7) {
    return {
      isDue: true,
      reason: `Due in ${diffDays} days`,
      urgency: 'low',
      daysRemaining: diffDays,
    };
  }

  return {
    isDue: false,
    reason: `In stock (Due in ${diffDays} days)`,
    urgency: 'low',
    daysRemaining: diffDays,
  };
}

/**
 * Generates sorted suggestions for shopping list from all pantry items.
 */
export function generateSuggestions(items: PantryItem[], now: Date = new Date()): ShoppingSuggestion[] {
  const suggestions: ShoppingSuggestion[] = [];

  for (const item of items) {
    // If the item is already on the active shopping list, do not duplicate in suggestions
    if (item.inShoppingList) continue;

    const evaluation = evaluateItemCadence(item, now);
    if (evaluation.isDue) {
      suggestions.push({
        item,
        reason: evaluation.reason,
        urgency: evaluation.urgency,
        daysRemaining: evaluation.daysRemaining,
      });
    }
  }

  // Sort suggestions: critical -> high -> medium -> low, then by daysRemaining ascending
  const urgencyWeight: Record<UrgencyLevel, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return suggestions.sort((a, b) => {
    const weightA = urgencyWeight[a.urgency];
    const weightB = urgencyWeight[b.urgency];
    if (weightA !== weightB) {
      return weightB - weightA;
    }
    return a.daysRemaining - b.daysRemaining;
  });
}

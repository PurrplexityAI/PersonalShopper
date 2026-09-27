import type { PantryItem } from "~~/shared/types";

export type PantrySortOption =
  | "alpha-asc"
  | "alpha-desc"
  | "bought-desc"
  | "bought-asc"
  | "due-asc"
  | "due-desc";

export function sortPantryItems(items: PantryItem[], sortOption: PantrySortOption): PantryItem[] {
  return [...items].sort((a, b) => {
    switch (sortOption) {
      case "alpha-asc":
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

      case "alpha-desc":
        return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });

      case "bought-desc": {
        // Last bought (newest): newest dates first; items with null lastPurchasedAt at the end
        if (!a.lastPurchasedAt && !b.lastPurchasedAt) {
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        }
        if (!a.lastPurchasedAt) return 1;
        if (!b.lastPurchasedAt) return -1;
        const diff = new Date(b.lastPurchasedAt).getTime() - new Date(a.lastPurchasedAt).getTime();
        return diff !== 0 ? diff : a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }

      case "bought-asc": {
        // Last bought (oldest): oldest dates first; items with null lastPurchasedAt at the end
        if (!a.lastPurchasedAt && !b.lastPurchasedAt) {
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        }
        if (!a.lastPurchasedAt) return 1;
        if (!b.lastPurchasedAt) return -1;
        const diff = new Date(a.lastPurchasedAt).getTime() - new Date(b.lastPurchasedAt).getTime();
        return diff !== 0 ? diff : a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }

      case "due-asc": {
        // Next due (soonest): soonest dates first; items with null nextDueDate at the end
        if (!a.nextDueDate && !b.nextDueDate) {
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        }
        if (!a.nextDueDate) return 1;
        if (!b.nextDueDate) return -1;
        const diff = new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
        return diff !== 0 ? diff : a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }

      case "due-desc": {
        // Next due (latest): latest dates first; items with null nextDueDate at the end
        if (!a.nextDueDate && !b.nextDueDate) {
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        }
        if (!a.nextDueDate) return 1;
        if (!b.nextDueDate) return -1;
        const diff = new Date(b.nextDueDate).getTime() - new Date(a.nextDueDate).getTime();
        return diff !== 0 ? diff : a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }

      default:
        return 0;
    }
  });
}

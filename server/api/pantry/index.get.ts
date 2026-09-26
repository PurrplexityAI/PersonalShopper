import { repository } from "../../utils/db";
import { evaluateItemCadence } from "~~/app/utils/cadence";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    let items = await repository.getAll();

    if (query.q && typeof query.q === "string") {
      const q = query.q.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
      );
    }

    if (query.category && typeof query.category === "string" && query.category !== "All") {
      items = items.filter((item) => item.category === query.category);
    }

    if (query.status && typeof query.status === "string") {
      const now = new Date();
      if (query.status === "in-stock") {
        items = items.filter((item) => item.inStock);
      } else if (query.status === "out-of-stock") {
        items = items.filter((item) => !item.inStock);
      } else if (query.status === "due") {
        items = items.filter((item) => evaluateItemCadence(item, now).isDue);
      }
    }

    items.sort((a, b) => a.name.localeCompare(b.name));
    return { success: true, data: items };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, statusMessage: message });
  }
});

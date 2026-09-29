import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { itemIds } = body;
    if (!Array.isArray(itemIds)) {
      throw createError({ statusCode: 400, statusMessage: "itemIds array is required" });
    }
    const updated = await withRepository(event, (repo) => repo.addBulkToShoppingList(itemIds));
    return {
      success: true,
      data: updated,
      message: `Added ${updated.length} items to shopping list`,
    };
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 400, statusMessage: message });
  }
});

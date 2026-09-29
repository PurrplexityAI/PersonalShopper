import { withRepository } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: "ID is required" });
    }
    const updated = await withRepository(event, (repo) => repo.deleteFromShoppingList(id));
    return {
      success: true,
      data: updated,
      message: `Removed "${updated.name}" from shopping list without marking as purchased.`,
    };
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 400, statusMessage: message });
  }
});

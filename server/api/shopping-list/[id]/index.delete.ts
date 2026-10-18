import { withRepository } from "../../../utils/db";

export default defineEventHandler(async (event) => {
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
});

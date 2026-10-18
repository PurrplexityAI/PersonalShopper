import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "ID is required" });
  }
  const deleted = await withRepository(event, (repo) => repo.delete(id));
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }
  return { success: true, message: "Item deleted from pantry" };
});

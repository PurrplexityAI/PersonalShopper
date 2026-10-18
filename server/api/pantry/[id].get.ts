import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "ID is required" });
  }
  const item = await withRepository(event, (repo) => repo.getById(id));
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }
  return { success: true, data: item };
});

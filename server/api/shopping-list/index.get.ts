import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const list = await withRepository(event, (repo) => repo.getShoppingList());
    return { success: true, data: list };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, statusMessage: message });
  }
});

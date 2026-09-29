import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const categories = await withRepository(event, (repo) => repo.getCategories());
    return { success: true, data: categories };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, statusMessage: message });
  }
});

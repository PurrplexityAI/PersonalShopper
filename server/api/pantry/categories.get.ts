import { repository } from "../../utils/db";

export default defineEventHandler(async () => {
  try {
    const categories = await repository.getCategories();
    return { success: true, data: categories };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, statusMessage: message });
  }
});

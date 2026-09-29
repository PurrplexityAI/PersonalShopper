import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const suggestions = await withRepository(event, (repo) => repo.getSuggestions());
    return { success: true, data: suggestions };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, statusMessage: message });
  }
});

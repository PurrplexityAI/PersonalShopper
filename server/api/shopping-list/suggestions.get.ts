import { repository } from "../../utils/db";

export default defineEventHandler(async () => {
  try {
    const suggestions = await repository.getSuggestions();
    return { success: true, data: suggestions };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, statusMessage: message });
  }
});

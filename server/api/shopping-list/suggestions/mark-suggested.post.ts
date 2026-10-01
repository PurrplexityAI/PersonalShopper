import { withRepository } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ itemIds?: string[] }>(event);
    const itemIds = body?.itemIds || [];
    if (itemIds.length > 0) {
      await withRepository(event, (repo) => repo.markSuggested(itemIds));
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, statusMessage: message });
  }
});

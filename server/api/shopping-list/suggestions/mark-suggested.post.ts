import { withRepository } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ itemIds?: string[] }>(event);
  const itemIds = body?.itemIds || [];
  if (itemIds.length > 0) {
    await withRepository(event, (repo) => repo.markSuggested(itemIds));
  }
  return { success: true };
});

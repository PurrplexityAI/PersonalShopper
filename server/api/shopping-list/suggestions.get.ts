import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const suggestions = await withRepository(event, (repo) => repo.getSuggestions());
  return { success: true, data: suggestions };
});

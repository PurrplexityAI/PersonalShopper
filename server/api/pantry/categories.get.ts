import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const categories = await withRepository(event, (repo) => repo.getCategories());
  return { success: true, data: categories };
});

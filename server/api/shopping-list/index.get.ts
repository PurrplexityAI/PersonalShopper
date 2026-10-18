import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const list = await withRepository(event, (repo) => repo.getShoppingList());
  return { success: true, data: list };
});

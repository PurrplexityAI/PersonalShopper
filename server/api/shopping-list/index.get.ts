import { repository } from "../../utils/db";

export default defineEventHandler(async () => {
  try {
    const list = await repository.getShoppingList();
    return { success: true, data: list };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, statusMessage: message });
  }
});

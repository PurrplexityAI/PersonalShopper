import { repository } from '../../utils/db';

export default defineEventHandler(async () => {
  try {
    const list = await repository.getShoppingList();
    return { success: true, data: list };
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message });
  }
});

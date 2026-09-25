import { repository } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { itemIds } = body;
    if (!Array.isArray(itemIds)) {
      throw createError({ statusCode: 400, statusMessage: 'itemIds array is required' });
    }
    const updated = await repository.addBulkToShoppingList(itemIds);
    return {
      success: true,
      data: updated,
      message: `Added ${updated.length} items to shopping list`,
    };
  } catch (err: any) {
    if (err.statusCode) throw err;
    throw createError({ statusCode: 400, statusMessage: err.message });
  }
});

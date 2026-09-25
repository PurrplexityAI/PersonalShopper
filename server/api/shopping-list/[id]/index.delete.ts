import { repository } from '../../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }
    const updated = await repository.deleteFromShoppingList(id);
    return {
      success: true,
      data: updated,
      message: `Removed "${updated.name}" from shopping list without marking as purchased.`,
    };
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message });
  }
});

import { repository } from '../../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }
    const updated = await repository.checkOffShoppingItem(id);
    return {
      success: true,
      data: updated,
      message: `Marked "${updated.name}" as purchased! In stock and cadence timer reset.`,
    };
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message });
  }
});

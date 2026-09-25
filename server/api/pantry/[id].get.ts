import { repository } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }
    const item = await repository.getById(id);
    if (!item) {
      throw createError({ statusCode: 404, statusMessage: 'Item not found' });
    }
    return { success: true, data: item };
  } catch (err: any) {
    if (err.statusCode) throw err;
    throw createError({ statusCode: 500, statusMessage: err.message });
  }
});

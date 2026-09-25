import { repository } from '../../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }
    const body = await readBody(event);
    const quantity = Number(body.quantity);
    if (!quantity || quantity < 1) {
      throw createError({ statusCode: 400, statusMessage: 'Valid quantity is required' });
    }
    const updated = await repository.updateShoppingQuantity(id, quantity);
    return { success: true, data: updated };
  } catch (err: any) {
    if (err.statusCode) throw err;
    throw createError({ statusCode: 400, statusMessage: err.message });
  }
});

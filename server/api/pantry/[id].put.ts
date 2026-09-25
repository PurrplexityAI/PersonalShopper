import { repository } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }
    const body = await readBody(event);
    const updated = await repository.update(id, body);
    return { success: true, data: updated };
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message });
  }
});

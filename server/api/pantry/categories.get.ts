import { repository } from '../../utils/db';

export default defineEventHandler(async () => {
  try {
    const categories = await repository.getCategories();
    return { success: true, data: categories };
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message });
  }
});

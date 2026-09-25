import { repository } from '../../utils/db';

export default defineEventHandler(async () => {
  try {
    const suggestions = await repository.getSuggestions();
    return { success: true, data: suggestions };
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message });
  }
});

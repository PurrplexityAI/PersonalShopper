import { repository } from '../../utils/db';

export default defineEventHandler(async () => {
  try {
    const resetItems = await repository.resetSampleData();
    return {
      success: true,
      data: resetItems,
      message: 'Database reset to sample grocery items.',
    };
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message });
  }
});
